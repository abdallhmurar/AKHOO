// The local server exposes these exact files from the existing installed package.
const {Map, Marker, setWorkerUrl} = await import('/vendor/maplibre-gl.mjs');

// Illustrative Jerusalem location. This preview never reads device geolocation.
const DEMO_CENTER = [35.245, 31.776];
const DEMO_ZOOM = 13.2;
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

export function createLocationMap() {
  setWorkerUrl('/vendor/maplibre-gl-worker.mjs');
  const container = document.querySelector('#location-map');
  const frame = document.querySelector('.map-frame');
  const status = document.querySelector('#map-status');
  const statusText = document.querySelector('#map-status-text');
  const retryButton = document.querySelector('#retry-map');
  const recenterButton = document.querySelector('#recenter-map');
  const refreshButton = document.querySelector('#refresh-location');
  const manualButton = document.querySelector('#manual-location');
  const sendButton = document.querySelector('#send-request');
  const instructions = document.querySelector('#manual-instructions');
  const centerPin = document.querySelector('#manual-pin');
  const feedback = document.querySelector('#location-feedback');
  const label = document.querySelector('#selected-location-label');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let selected = [...DEMO_CENTER];
  let manual = false;
  let ready = false;
  let loadTimer;

  const map = new Map({
    container, style: MAP_STYLE, center: selected, zoom: DEMO_ZOOM,
    minZoom: 10, maxZoom: 18, dragRotate: false, touchPitch: false,
    pitchWithRotate: false, scrollZoom: false,
    attributionControl: {compact: true}
  });
  map.touchZoomRotate.disableRotation();
  map.getCanvas().setAttribute('aria-label', 'خريطة الموقع. استخدم الأسهم لتحريكها، وعلامتي الجمع والطرح للتكبير والتصغير.');

  const markerElement = document.createElement('div');
  markerElement.className = 'location-marker';
  markerElement.setAttribute('aria-hidden', 'true');
  const halo = document.createElement('span');
  halo.className = 'pin-halo';
  const pin = document.createElement('span');
  pin.className = 'map-pin';
  markerElement.append(halo, pin);
  const marker = new Marker({element: markerElement, anchor: 'center'})
    .setLngLat(selected).addTo(map);

  function say(message) {
    feedback.textContent = message;
    feedback.hidden = !message;
  }

  function moveTo(point, zoom) {
    map.easeTo({center: point, ...(zoom === undefined ? {} : {zoom}), duration: reducedMotion.matches ? 0 : 420});
  }

  function setEditing(value) {
    manual = value;
    frame.classList.toggle('is-editing', value);
    centerPin.hidden = !value;
    markerElement.hidden = value;
    instructions.hidden = !value;
    manualButton.setAttribute('aria-pressed', String(value));
    manualButton.querySelector('span').textContent = value ? 'تأكيد الموقع' : 'تحديد يدوي';
    refreshButton.disabled = !ready || value;
    sendButton.disabled = !ready || value;
    map.resize();
  }

  function fail() {
    if (ready) return;
    clearTimeout(loadTimer);
    status.hidden = false;
    statusText.textContent = 'تعذّر تحميل الخريطة. تأكد من اتصال الإنترنت وجرّب مرة ثانية.';
    retryButton.hidden = false;
    frame.setAttribute('aria-busy', 'false');
    [recenterButton, refreshButton, manualButton, sendButton].forEach(button => { button.disabled = true; });
  }

  function beginLoading() {
    clearTimeout(loadTimer);
    status.hidden = false;
    statusText.textContent = 'جارٍ تحميل الخريطة…';
    retryButton.hidden = true;
    frame.setAttribute('aria-busy', 'true');
    loadTimer = setTimeout(fail, 15000);
  }

  function reveal() {
    if (ready) return;
    ready = true;
    clearTimeout(loadTimer);
    status.hidden = true;
    frame.setAttribute('aria-busy', 'false');
    [recenterButton, refreshButton, manualButton, sendButton].forEach(button => { button.disabled = false; });
    map.resize();
  }

  beginLoading();
  map.on('load', reveal);
  map.on('idle', () => { if (map.isStyleLoaded()) reveal(); });
  map.on('error', () => { if (!map.isStyleLoaded()) fail(); });
  map.on('click', event => {
    if (manual) moveTo([event.lngLat.lng, event.lngLat.lat]);
  });

  manualButton.addEventListener('click', () => {
    if (!ready) return;
    say('');
    if (!manual) {
      map.stop();
      map.jumpTo({center: selected});
      setEditing(true);
      map.getCanvas().focus({preventScroll: true});
    } else {
      map.stop();
      const center = map.getCenter();
      selected = [center.lng, center.lat];
      marker.setLngLat(selected);
      label.textContent = 'تم تحديد النقطة يدويًا · معاينة';
      setEditing(false);
      say('تم حفظ النقطة المحددة في المعاينة.');
    }
  });

  function cancelEditing() {
    if (!manual) return;
    setEditing(false);
    moveTo(selected);
    say('');
  }

  document.querySelector('#cancel-location').addEventListener('click', () => {
    cancelEditing();
    manualButton.focus({preventScroll: true});
  });
  recenterButton.addEventListener('click', () => moveTo(selected));
  refreshButton.addEventListener('click', () => {
    selected = [...DEMO_CENTER];
    marker.setLngLat(selected);
    moveTo(selected, DEMO_ZOOM);
    label.textContent = 'القدس · موقع تجريبي للمعاينة';
    say('تم تحديث الموقع التجريبي.');
  });

  const resizeObserver = new ResizeObserver(() => {
    if (container.clientWidth && container.clientHeight) map.resize();
  });
  resizeObserver.observe(container);

  return {
    resize: () => map.resize(),
    cancelEditing,
    retry() {
      if (ready) return;
      beginLoading();
      map.setStyle(MAP_STYLE, {diff: false});
    }
  };
}
