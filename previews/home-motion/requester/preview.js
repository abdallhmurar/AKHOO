/* Isolated local visual preview. No application imports, storage or APIs. */
const form = document.querySelector('#problem-form');
const cards = [...document.querySelectorAll('.problem-card')];
const videos = cards.map(card => card.querySelector('video'));
const nextButton = document.querySelector('#next-button');
const motionButton = document.querySelector('#motion-toggle');
const sheet = document.querySelector('.demo-sheet');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const inView = new Set();
let motionEnabled = !reducedMotion.matches;

function canPlay(video) {
  return motionEnabled && !reducedMotion.matches && !document.hidden && !sheet.open && inView.has(video) && !video.dataset.failed;
}

function renderMotion() {
  motionButton.setAttribute('aria-pressed', String(motionEnabled && !reducedMotion.matches));
  motionButton.setAttribute('aria-label', reducedMotion.matches ? 'الحركة متوقفة حسب إعداد جهازك' : motionEnabled ? 'إيقاف الحركة' : 'تشغيل الحركة');
  motionButton.disabled = reducedMotion.matches;
  videos.forEach(video => {
    if (!canPlay(video)) {
      video.pause();
      video.parentElement.classList.remove('is-playing');
      return;
    }
    if (!video.getAttribute('src')) video.src = video.dataset.src;
    video.muted = true;
    if (video.paused) video.play().then(() => {
      if (!canPlay(video)) {
        video.pause();
        video.parentElement.classList.remove('is-playing');
      }
    }).catch(() => {
      video.parentElement.classList.remove('is-playing');
    });
  });
}

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) inView.add(entry.target);
    else inView.delete(entry.target);
  });
  renderMotion();
}, {threshold:0.2});

videos.forEach(video => {
  observer.observe(video);
  video.addEventListener('playing', () => {
    if (canPlay(video)) video.parentElement.classList.add('is-playing');
    else video.pause();
  });
  video.addEventListener('error', () => {
    video.dataset.failed = 'true';
    video.parentElement.classList.remove('is-playing');
  });
});

form.addEventListener('change', () => {
  nextButton.disabled = !form.elements.problem.value;
  const selected = cards.find(card => card.querySelector('input').checked);
  const video = selected?.querySelector('video');
  if (video && canPlay(video) && video.readyState > 0) video.currentTime = 0;
  renderMotion();
});

motionButton.addEventListener('click', () => {
  motionEnabled = !motionEnabled;
  renderMotion();
});
reducedMotion.addEventListener('change', () => {
  motionEnabled = !reducedMotion.matches;
  renderMotion();
});
document.addEventListener('visibilitychange', renderMotion);
window.addEventListener('pagehide', () => videos.forEach(video => video.pause()));
window.addEventListener('pageshow', renderMotion);
form.addEventListener('submit', event => {
  event.preventDefault();
  const selected = cards.find(card => card.querySelector('input').checked);
  if (!selected) return;
  document.querySelector('#chosen-name').textContent = selected.querySelector('strong').textContent;
  sheet.showModal();
  renderMotion();
});
document.querySelector('#return-button').addEventListener('click', () => sheet.close());
sheet.addEventListener('close', () => {
  nextButton.focus({preventScroll:true});
  renderMotion();
});
renderMotion();
