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
const waitingStep = document.querySelector('#waiting-step');
const trackingStep = document.querySelector('#tracking-step');
const trackingVideo = document.querySelector('#tracking-video');
const chatPreview = document.querySelector('#chat-preview');
const confirmationOutcomes = new Map();
const mapFrame = document.querySelector('.map-frame');
const waitingFeedback = document.querySelector('#waiting-feedback');
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
  return motionEnabled && !reducedMotion.matches && !document.hidden && !document.querySelector('dialog[open]')
    && !video.closest('.step-panel').hidden && !video.parentElement.hidden && inView.has(video) && !video.dataset.failed;
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
  step = ['details', 'location', 'waiting', 'accepted', 'confirmation'].includes(params.get('step')) && validProblem ? params.get('step') : 'selection';
  const isTracking = step === 'accepted' || step === 'confirmation';
  cards.forEach(card => { card.querySelector('input').checked = card.dataset.kind === problem; });
  nextButton.disabled = !validProblem;
  selectionStep.hidden = step !== 'selection';
  detailsStep.hidden = step !== 'details';
  locationStep.hidden = step !== 'location';
  waitingStep.hidden = step !== 'waiting';
  trackingStep.hidden = !isTracking;
  page.classList.toggle('show-details', step === 'details');
  page.classList.toggle('show-location', step === 'location');
  page.classList.toggle('show-waiting', step === 'waiting');
  page.classList.toggle('show-tracking', isTracking);
  page.classList.toggle('show-confirmation', step === 'confirmation');
  document.querySelector('.details-scenery').hidden = step === 'selection';
  motionButton.hidden = step === 'location';
  const stepIndex = ['selection', 'details', 'location', 'waiting', 'accepted', 'confirmation'].indexOf(step);
  const caption = ['الخطوة ١ من ٣', 'الخطوة ٢ من ٣', 'الخطوة الأخيرة', 'تم إرسال الطلب', 'تم قبول الطلب', 'بانتظار التأكيد'][stepIndex];
  const progress = document.querySelector('.progress');
  progress.setAttribute('aria-hidden', String(step === 'waiting' || isTracking));
  progress.setAttribute('aria-label', caption);
  progress.querySelector('span').textContent = caption;
  progress.querySelectorAll('i').forEach((segment, index) => {
    segment.classList.toggle('current', index === stepIndex);
    segment.classList.toggle('complete', index < stepIndex);
  });
  backLink.href = step === 'confirmation' ? routeUrl('accepted', problem) : step === 'accepted' ? routeUrl('waiting', problem) : step === 'waiting' ? routeUrl('location', problem) : step === 'location' ? routeUrl('details', problem) : step === 'details' ? routeUrl('selection', problem) : '../';
  backLink.setAttribute('aria-label', ['الرجوع للرئيسية', 'الرجوع لاختيار المشكلة', 'الرجوع للتفاصيل', 'الرجوع للموقع', 'الرجوع لمعاينة الانتظار', 'الرجوع لمعاينة القبول'][stepIndex]);
  document.title = ['أخو — اختَر نوع المساعدة', 'أخو — تفاصيل المشكلة', 'أخو — حدّد موقعك', 'أخو — انتظار المساعد · معاينة', 'أخو — المساعد استلم طلبك · معاينة', 'أخو — بانتظار تأكيدك · معاينة'][stepIndex];
  if (step !== 'location') locationMap?.cancelEditing();
  // Reuse the live map and selected point, without a second WebGL instance.
  const mapSlot = document.querySelector(isTracking ? '#tracking-map-slot' : step === 'waiting' ? '#waiting-map-slot' : '#location-map-slot');
  if (mapFrame.parentElement !== mapSlot) mapSlot.append(mapFrame);
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
  if (chatPreview.open) chatPreview.close();
  if (isTracking) renderTracking();
  document.querySelectorAll('[data-preview-step]').forEach(link => {
    link.href = routeUrl(link.dataset.previewStep, validProblem ? problem : 'battery');
    if (link.dataset.previewStep === step) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  renderMotion();
  if (step === 'location' || step === 'waiting' || isTracking) prepareLocationMap();
  if (focusHeading) {
    window.scrollTo({top:0, behavior:'instant'});
    document.querySelector(['#page-title', '#details-title', '#location-title', '#waiting-title', '#tracking-title', '#tracking-title'][stepIndex]).focus({preventScroll:true});
  }
}

backLink.addEventListener('click', event => {
  if (step === 'selection' || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  // Replace this entry so browser Back never reopens the just-dismissed step.
  history.replaceState(null, '', backLink.href);
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
  waitingFeedback.hidden = true;
  history.pushState(null, '', routeUrl('waiting', form.elements.problem.value));
  renderRoute(true);
});
document.querySelector('#refresh-request').addEventListener('click', () => {
  waitingFeedback.textContent = 'تم تحديث المعاينة، لسه بانتظار القبول.';
  waitingFeedback.hidden = false;
});
document.querySelector('#cancel-request').addEventListener('click', () => {
  sheet.showModal();
  renderMotion();
});
document.querySelector('#return-button').addEventListener('click', () => sheet.close());
document.querySelector('#confirm-cancel').addEventListener('click', () => {
  sheet.close();
  history.replaceState(null, '', routeUrl('location', form.elements.problem.value));
  renderRoute(true);
});
sheet.addEventListener('close', () => {
  if (step === 'waiting') document.querySelector('#cancel-request').focus({preventScroll:true});
  renderMotion();
});

function renderTracking() {
  const confirmation = step === 'confirmation';
  const outcome = confirmationOutcomes.get(form.elements.problem.value);
  const complete = confirmation && outcome === 'success';
  const asset = confirmation ? 'confirmation' : 'accepted';
  document.querySelector('#tracking-title').textContent = complete ? 'تمت المساعدة بنجاح' : confirmation ? 'بانتظار تأكيدك' : 'المساعد استلم طلبك';
  document.querySelector('#tracking-description').textContent = complete ? 'شكرًا لتأكيدك، أخوك دايمًا قريب' : confirmation ? 'أكد إذا وصلتك المساعدة فعلاً' : 'تابع حالته وتواصل معه من هون';
  document.querySelector('#tracking-status-title').textContent = complete ? 'تم تأكيد المساعدة' : confirmation ? 'بانتظار تأكيدك' : 'تم قبول طلبك';
  document.querySelector('#tracking-status-description').textContent = complete ? 'اكتملت تجربة الطلب' : confirmation ? 'أكد إذا وصلتك المساعدة فعلاً' : 'مساعدك جاهز يساعدك';
  document.querySelector('#confirmation-card').hidden = !confirmation;
  document.querySelector('#tracking-caption').textContent = complete ? 'تم التأكيد · معاينة' : confirmation ? 'بانتظار تأكيد وصول المساعدة · معاينة' : 'تم قبول الطلب · معاينة';
  const currentIndex = complete ? 4 : confirmation ? 3 : 0;
  document.querySelectorAll('#tracking-timeline li').forEach((item, index) => {
    item.classList.toggle('is-complete', index < currentIndex);
    item.classList.toggle('is-current', index === currentIndex);
    item.classList.toggle('is-finished', complete && index === 4);
    if (index === currentIndex) item.setAttribute('aria-current', 'step');
    else item.removeAttribute('aria-current');
  });
  const result = document.querySelector('#confirmation-result');
  result.hidden = !outcome;
  result.textContent = outcome === 'success' ? 'تم تسجيل التأكيد في المعاينة.' : outcome === 'incomplete' ? 'سجّلنا أن المساعدة لم تكتمل في المعاينة.' : '';
  document.querySelector('.confirmation-actions').hidden = Boolean(outcome);
  document.querySelector('#confirmation-question').textContent = outcome === 'success' ? 'شكرًا لتأكيدك' : outcome === 'incomplete' ? 'المساعدة لم تكتمل' : 'هل تمت المساعدة بنجاح؟';
  document.querySelector('#reset-confirmation').hidden = !outcome;
  if (trackingVideo.dataset.src !== `assets/${asset}.mp4`) {
    trackingVideo.pause();
    trackingVideo.parentElement.classList.remove('is-playing');
    document.querySelector('#tracking-poster').src = `assets/${asset}.png`;
    trackingVideo.poster = `assets/${asset}.png`;
    trackingVideo.removeAttribute('src');
    trackingVideo.dataset.src = `assets/${asset}.mp4`;
    delete trackingVideo.dataset.failed;
    trackingVideo.load();
  }
  trackingVideo.parentElement.hidden = complete;
}

document.querySelectorAll('[data-preview-step]').forEach(link => {
  link.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    document.querySelector('#tracking-feedback').hidden = true;
    history.pushState(null, '', link.href);
    renderRoute(true);
  });
});
document.querySelector('#refresh-tracking').addEventListener('click', () => {
  const feedback = document.querySelector('#tracking-feedback');
  feedback.textContent = 'تم تحديث المعاينة. حالة الطلب ما تغيّرت.';
  feedback.hidden = false;
});
document.querySelector('#open-chat').addEventListener('click', () => {
  chatPreview.showModal();
  renderMotion();
});
document.querySelector('#close-chat').addEventListener('click', () => chatPreview.close());
chatPreview.addEventListener('close', () => {
  if (step === 'accepted' || step === 'confirmation') document.querySelector('#open-chat').focus({preventScroll:true});
  renderMotion();
});
function setConfirmation(outcome) {
  if (step !== 'confirmation') return;
  if (outcome) confirmationOutcomes.set(form.elements.problem.value, outcome);
  else confirmationOutcomes.delete(form.elements.problem.value);
  renderTracking();
  renderMotion();
  document.querySelector(outcome ? '#reset-confirmation' : '#confirm-success').focus({preventScroll:true});
}
document.querySelector('#confirm-success').addEventListener('click', () => setConfirmation('success'));
document.querySelector('#confirm-incomplete').addEventListener('click', () => setConfirmation('incomplete'));
document.querySelector('#reset-confirmation').addEventListener('click', () => setConfirmation(null));
renderRoute();
