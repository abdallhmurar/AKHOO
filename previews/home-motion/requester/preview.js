/* Isolated local visual preview. No application imports, storage or APIs. */
const form = document.querySelector('#problem-form');
const cards = [...document.querySelectorAll('.problem-card')];
const videos = [...document.querySelectorAll('video')];
const nextButton = document.querySelector('#next-button');
const motionButton = document.querySelector('#motion-toggle');
const sheet = document.querySelector('.demo-sheet');
const page = document.querySelector('.request-page');
const selectionStep = document.querySelector('#selection-step');
const detailsStep = document.querySelector('#details-step');
const locationStep = document.querySelector('#location-step');
const sendButton = document.querySelector('#send-request');
const selectedVideo = document.querySelector('#selected-video');
const backLink = document.querySelector('.back');
const note = document.querySelector('#problem-note');
const photoInput = document.querySelector('#problem-photo');
const photoPreview = document.querySelector('#photo-preview');
const photoFeedback = document.querySelector('#photo-feedback');
const addPhoto = document.querySelector('#add-photo');
const removePhoto = document.querySelector('#remove-photo');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const inView = new Set();
let motionEnabled = !reducedMotion.matches;
let photoUrl = null;
let photoVersion = 0;
let step = 'selection';
let locationMap;
let locationMapLoading = false;
const problemCopy = {
  battery: {title:'شحن بطارية', placeholder:'مثال: السيارة ما بتشتغل وبحتاج وصلة بطارية.'},
  fuel: {title:'وقود', placeholder:'مثال: خلص البنزين والسيارة واقفة على جنب الطريق.'},
  other: {title:'شيء آخر', placeholder:'احكيلنا باختصار شو صار معك وشو المساعدة اللي بتحتاجها.'},
  tire: {title:'بنشر', placeholder:'مثال: الإطار الأمامي نازل وعندي إطار احتياط.'}
};

function canPlay(video) {
  return motionEnabled && !reducedMotion.matches && !document.hidden && !sheet.open
    && !video.closest('.step-panel').hidden && inView.has(video) && !video.dataset.failed;
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
  history.replaceState(null, '', routeUrl('selection', form.elements.problem.value));
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
  if (!form.elements.problem.value) return;
  history.pushState(null, '', routeUrl('details', form.elements.problem.value));
  renderRoute(true);
});

function routeUrl(nextStep, problem) {
  const url = new URL(window.location.href);
  url.search = '';
  if (nextStep !== 'selection') url.searchParams.set('step', nextStep);
  if (problem) url.searchParams.set('problem', problem);
  return url;
}

function renderRoute(focusHeading = false) {
  const params = new URLSearchParams(window.location.search);
  const problem = params.get('problem');
  const validProblem = Object.hasOwn(problemCopy, problem);
  step = ['details', 'location'].includes(params.get('step')) && validProblem ? params.get('step') : 'selection';
  cards.forEach(card => { card.querySelector('input').checked = card.dataset.kind === problem; });
  nextButton.disabled = !validProblem;
  selectionStep.hidden = step !== 'selection';
  detailsStep.hidden = step !== 'details';
  locationStep.hidden = step !== 'location';
  page.classList.toggle('show-details', step === 'details');
  page.classList.toggle('show-location', step === 'location');
  document.querySelector('.details-scenery').hidden = step === 'selection';
  motionButton.hidden = step === 'location';
  const stepIndex = ['selection', 'details', 'location'].indexOf(step);
  const caption = ['الخطوة ١ من ٣', 'الخطوة ٢ من ٣', 'الخطوة الأخيرة'][stepIndex];
  const progress = document.querySelector('.progress');
  progress.setAttribute('aria-label', caption);
  progress.querySelector('span').textContent = caption;
  progress.querySelectorAll('i').forEach((segment, index) => {
    segment.classList.toggle('current', index === stepIndex);
    segment.classList.toggle('complete', index < stepIndex);
  });
  backLink.href = step === 'location' ? routeUrl('details', problem) : step === 'details' ? routeUrl('selection', problem) : '../';
  backLink.setAttribute('aria-label', ['الرجوع للرئيسية', 'الرجوع لاختيار المشكلة', 'الرجوع للتفاصيل'][stepIndex]);
  document.title = ['أخو — اختَر نوع المساعدة', 'أخو — تفاصيل المشكلة', 'أخو — حدّد موقعك'][stepIndex];
  if (step !== 'location') locationMap?.cancelEditing();
  if (step === 'details') {
    document.querySelector('#selected-title').textContent = problemCopy[problem].title;
    note.placeholder = problemCopy[problem].placeholder;
    const selectedCard = document.querySelector('.selected-problem');
    if (selectedCard.dataset.kind !== problem) {
      selectedVideo.pause();
      selectedVideo.parentElement.classList.remove('is-playing');
      selectedCard.dataset.kind = problem;
      document.querySelector('#selected-poster').src = `assets/${problem}.png`;
      selectedVideo.poster = `assets/${problem}.png`;
      selectedVideo.removeAttribute('src');
      selectedVideo.dataset.src = `assets/${problem}.mp4`;
      delete selectedVideo.dataset.failed;
      selectedVideo.load();
    }
  }
  if (sheet.open) sheet.close();
  renderMotion();
  if (step === 'location') prepareLocationMap();
  if (focusHeading) {
    window.scrollTo({top:0, behavior:'instant'});
    document.querySelector(['#page-title', '#details-title', '#location-title'][stepIndex]).focus({preventScroll:true});
  }
}

backLink.addEventListener('click', event => {
  if (step === 'selection' || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  // Replace this entry so browser Back never reopens the just-dismissed step.
  history.replaceState(null, '', routeUrl(step === 'location' ? 'details' : 'selection', form.elements.problem.value));
  renderRoute(true);
});
window.addEventListener('popstate', () => renderRoute(true));

note.addEventListener('input', () => {
  document.querySelector('#note-count').textContent = `${note.value.length}/500`;
});

function showPhotoFeedback(message, isError = false) {
  photoFeedback.textContent = message;
  photoFeedback.hidden = !message;
  photoFeedback.classList.toggle('is-error', isError);
}

addPhoto.addEventListener('click', () => {
  photoInput.value = '';
  photoInput.click();
});

photoInput.addEventListener('change', async () => {
  const file = photoInput.files[0];
  if (!file) return;
  const version = ++photoVersion;
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
  if (!allowedTypes.includes(file.type)) {
    showPhotoFeedback('اختَر صورة بصيغة JPG أو PNG أو WebP أو GIF أو AVIF.', true);
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    showPhotoFeedback('الصورة كبيرة. اختَر صورة حجمها أقل من ١٠ ميغابايت.', true);
    return;
  }
  const candidate = URL.createObjectURL(file);
  const image = new Image();
  image.src = candidate;
  try {
    await image.decode();
    if (version !== photoVersion) { URL.revokeObjectURL(candidate); return; }
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    photoUrl = candidate;
    photoPreview.src = photoUrl;
    photoPreview.hidden = false;
    document.querySelector('#camera-art').hidden = true;
    removePhoto.hidden = false;
    addPhoto.textContent = 'تغيير الصورة';
    showPhotoFeedback('تمت إضافة الصورة.');
  } catch {
    URL.revokeObjectURL(candidate);
    if (version === photoVersion) showPhotoFeedback('ما قدرنا نفتح الصورة. جرّب صورة ثانية.', true);
  }
});

removePhoto.addEventListener('click', () => {
  photoVersion++;
  if (photoUrl) URL.revokeObjectURL(photoUrl);
  photoUrl = null;
  photoPreview.removeAttribute('src');
  photoPreview.hidden = true;
  photoInput.value = '';
  document.querySelector('#camera-art').hidden = false;
  removePhoto.hidden = true;
  addPhoto.textContent = 'إضافة صورة';
  showPhotoFeedback('تمت إزالة الصورة.');
  addPhoto.focus();
});

document.querySelector('#details-form').addEventListener('submit', event => {
  event.preventDefault();
  history.pushState(null, '', routeUrl('location', form.elements.problem.value));
  renderRoute(true);
});

async function prepareLocationMap() {
  if (locationMap) { locationMap.resize(); return; }
  if (locationMapLoading) return;
  locationMapLoading = true;
  document.querySelector('#retry-map').hidden = true;
  document.querySelector('#map-status-text').textContent = 'جارٍ تحميل الخريطة…';
  try {
    const {createLocationMap} = await import('./location-map.js');
    locationMap = createLocationMap();
  } catch {
    document.querySelector('#map-status-text').textContent = 'تعذّر تحميل الخريطة. تأكد من اتصال الإنترنت وجرّب مرة ثانية.';
    document.querySelector('#retry-map').hidden = false;
  } finally {
    locationMapLoading = false;
  }
}
document.querySelector('#retry-map').addEventListener('click', () => {
  if (locationMap) locationMap.retry();
  else prepareLocationMap();
});

document.querySelector('#location-form').addEventListener('submit', event => {
  event.preventDefault();
  if (sendButton.disabled) return;
  document.querySelector('#chosen-name').textContent = problemCopy[form.elements.problem.value].title;
  sheet.showModal();
  renderMotion();
});
document.querySelector('#return-button').addEventListener('click', () => sheet.close());
sheet.addEventListener('close', () => {
  if (step === 'location') sendButton.focus({preventScroll:true});
  renderMotion();
});
renderRoute();
