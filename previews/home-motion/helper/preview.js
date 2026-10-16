/* Isolated visual preview: no account, geolocation, request or availability APIs. */
const video = document.querySelector('#helper-video');
const motion = document.querySelector('#motion-toggle');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
let enabled = !reduced.matches;
let inView = false;
let helperMap;
let mapLoading = false;

function shouldPlay() {
  return enabled && !reduced.matches && !document.hidden && inView && !video.dataset.failed;
}
function renderMotion() {
  motion.disabled = reduced.matches;
  motion.setAttribute('aria-pressed', String(enabled && !reduced.matches));
  motion.setAttribute('aria-label', reduced.matches ? 'الحركة متوقفة حسب إعداد جهازك' : enabled ? 'إيقاف الحركة' : 'تشغيل الحركة');
  if (!shouldPlay()) {
    video.pause();
    video.parentElement.classList.remove('is-playing');
    return;
  }
  if (!video.getAttribute('src')) video.src = video.dataset.src;
  video.muted = true;
  if (video.paused) video.play().then(() => {
    if (!shouldPlay()) { video.pause(); video.parentElement.classList.remove('is-playing'); }
  }).catch(() => video.parentElement.classList.remove('is-playing'));
}
new IntersectionObserver(entries => {
  inView = entries[0].isIntersecting;
  renderMotion();
}, {threshold:0.2}).observe(video);
video.addEventListener('playing', () => {
  if (shouldPlay()) video.parentElement.classList.add('is-playing');
  else video.pause();
});
video.addEventListener('error', () => {
  video.dataset.failed = 'true';
  video.parentElement.classList.remove('is-playing');
});
motion.addEventListener('click', () => { enabled = !enabled; renderMotion(); });
reduced.addEventListener('change', () => { enabled = !reduced.matches; renderMotion(); });
document.addEventListener('visibilitychange', renderMotion);
window.addEventListener('pagehide', () => video.pause());
window.addEventListener('pageshow', renderMotion);

async function prepareMap() {
  if (helperMap) { helperMap.retry(); return; }
  if (mapLoading) return;
  mapLoading = true;
  document.querySelector('#retry-map').hidden = true;
  document.querySelector('.map-frame').setAttribute('aria-busy', 'true');
  document.querySelector('#map-status-text').textContent = 'جارٍ تحميل الخريطة…';
  try {
    const {createHelperMap} = await import('./map.js');
    helperMap = createHelperMap();
  } catch {
    document.querySelector('#map-status-text').textContent = 'تعذّر تحميل الخريطة. تأكد من اتصال الإنترنت وجرّب مرة ثانية.';
    document.querySelector('#retry-map').hidden = false;
    document.querySelector('.map-frame').setAttribute('aria-busy', 'false');
  } finally { mapLoading = false; }
}
document.querySelector('#retry-map').addEventListener('click', prepareMap);
renderMotion();
prepareMap();
