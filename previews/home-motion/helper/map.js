const {Map, Marker, setWorkerUrl} = await import('/vendor/maplibre-gl.mjs');
const DEMO_CENTER = [35.245, 31.776];
const DEMO_ZOOM = 13.2;
const STYLE = 'https://tiles.openfreemap.org/styles/liberty';

export function createHelperMap() {
  setWorkerUrl('/vendor/maplibre-gl-worker.mjs');
  const frame = document.querySelector('.map-frame');
  const status = document.querySelector('#map-status');
  const statusText = document.querySelector('#map-status-text');
  const retry = document.querySelector('#retry-map');
  const zoomIn = document.querySelector('#zoom-in');
  const zoomOut = document.querySelector('#zoom-out');
  const recenter = document.querySelector('#recenter-map');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let ready = false;
  let loadTimer;
  const map = new Map({
    container:'helper-map', style:STYLE, center:DEMO_CENTER, zoom:DEMO_ZOOM,
    minZoom:10, maxZoom:18, dragRotate:false, touchPitch:false,
    pitchWithRotate:false, scrollZoom:false, attributionControl:{compact:true}
  });
  map.touchZoomRotate.disableRotation();
  map.getCanvas().setAttribute('aria-label', 'خريطة تجريبية. استخدم الأسهم للتحريك وعلامتي الجمع والطرح للتكبير والتصغير.');
  const markerElement = document.createElement('div');
  markerElement.className = 'location-marker';
  markerElement.setAttribute('aria-hidden', 'true');
  const halo = document.createElement('span');
  halo.className = 'pin-halo';
  const pin = document.createElement('span');
  pin.className = 'map-pin';
  markerElement.append(halo, pin);
  new Marker({element:markerElement, anchor:'center'}).setLngLat(DEMO_CENTER).addTo(map);
  function controls() {
    zoomIn.disabled = !ready || map.getZoom() >= map.getMaxZoom();
    zoomOut.disabled = !ready || map.getZoom() <= map.getMinZoom();
    recenter.disabled = !ready;
  }
  function fail() {
    if (ready) return;
    clearTimeout(loadTimer);
    status.hidden = false;
    statusText.textContent = 'تعذّر تحميل الخريطة. تأكد من اتصال الإنترنت وجرّب مرة ثانية.';
    retry.hidden = false;
    frame.setAttribute('aria-busy', 'false');
    controls();
  }
  function beginLoading() {
    clearTimeout(loadTimer);
    status.hidden = false;
    statusText.textContent = 'جارٍ تحميل الخريطة…';
    retry.hidden = true;
    frame.setAttribute('aria-busy', 'true');
    loadTimer = setTimeout(fail, 15000);
  }
  function reveal() {
    if (ready) return;
    ready = true;
    clearTimeout(loadTimer);
    status.hidden = true;
    frame.setAttribute('aria-busy', 'false');
    controls();
    map.resize();
  }
  beginLoading();
  map.on('load', reveal);
  map.on('idle', () => { if (map.isStyleLoaded()) reveal(); });
  map.on('error', () => { if (!map.isStyleLoaded()) fail(); });
  map.on('zoom', controls);
  zoomIn.addEventListener('click', () => map.zoomIn({duration:reduced.matches ? 0 : 250}));
  zoomOut.addEventListener('click', () => map.zoomOut({duration:reduced.matches ? 0 : 250}));
  recenter.addEventListener('click', () => map.easeTo({center:DEMO_CENTER,zoom:DEMO_ZOOM,duration:reduced.matches ? 0 : 420}));
  new ResizeObserver(() => map.resize()).observe(document.querySelector('#helper-map'));
  return {retry() { if (!ready) { beginLoading(); map.setStyle(STYLE, {diff:false}); } }};
}
