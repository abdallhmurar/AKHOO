/* Isolated visual prototype: no app imports, API calls, location or storage. */
const screen = document.querySelector('#home-screen');
const motionButton = document.querySelector('#motion-toggle');
const referenceButton = document.querySelector('#reference-toggle');
const reference = document.querySelector('#reference');
const sheet = document.querySelector('.demo-sheet');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const characterVideos = [...document.querySelectorAll('.character-video')];
let motionEnabled = !reducedMotion.matches;

function renderMotion() {
  const shouldPlay = motionEnabled && !document.hidden && reference.hidden && !sheet.open;
  screen.classList.toggle('motion-off', !shouldPlay);
  motionButton.setAttribute('aria-pressed', String(motionEnabled));
  motionButton.disabled = reducedMotion.matches;
  motionButton.textContent = reducedMotion.matches ? 'الحركة متوقفة حسب إعداد جهازك' : motionEnabled ? 'إيقاف الحركة' : 'تشغيل الحركة';
  characterVideos.forEach(video => {
    if (!shouldPlay) video.pause();
    else {
      video.muted = true;
      video.play().then(() => {
        if (!motionEnabled || document.hidden || !reference.hidden || sheet.open) video.pause();
      }).catch(() => { /* Keep the poster if the browser blocks playback. */ });
    }
  });
}
motionButton.addEventListener('click', () => {
  motionEnabled = !motionEnabled;
  renderMotion();
});
reducedMotion.addEventListener('change', () => {
  motionEnabled = !reducedMotion.matches;
  renderMotion();
});
document.addEventListener('visibilitychange', renderMotion);
referenceButton.addEventListener('click', () => {
  reference.hidden = !reference.hidden;
  referenceButton.setAttribute('aria-pressed', String(!reference.hidden));
  referenceButton.textContent = reference.hidden ? 'شوف الصورة المعتمدة' : 'رجوع للمعاينة المتحركة';
  screen.querySelectorAll('button').forEach(button => button.inert = !reference.hidden);
  renderMotion();
});

const demos = {
  request: ['بدي مساعدة', 'هيك بيكون إحساس الزر. بالتطبيق بننتقل لاختيار نوع المساعدة؛ هون ما أرسلنا أي طلب.'],
  perks: ['مزايا أخو', 'من هون بتوصل لعروض مزايا أخو. هاي معاينة لشكل الصفحة وحركة الأزرار.'],
  notifications: ['الإشعارات', 'هذا مكان إشعاراتك في التطبيق. المعاينة غير متصلة بحسابك.'],
  activity: ['نشاطي', 'هذا الزر بيفتح سجل مساعداتك وطلباتك في التطبيق.'],
  account: ['حسابي', 'هذا الزر بيفتح حسابك وإعداداتك في التطبيق.'],
};
let opener;
document.querySelectorAll('[data-demo]').forEach(button => {
  button.addEventListener('click', () => {
    if (button.dataset.demo === 'home') return;
    if (button.dataset.demo === 'request') {
      window.location.assign('requester/');
      return;
    }
    if (button.dataset.demo === 'help') {
      window.location.assign('helper/');
      return;
    }
    opener = button;
    const [title, description] = demos[button.dataset.demo];
    document.querySelector('#demo-title').textContent = title;
    document.querySelector('#demo-description').textContent = description;
    sheet.showModal();
    renderMotion();
  });
});
function closeSheet() { sheet.close(); }
sheet.querySelector('.sheet-close').addEventListener('click', closeSheet);
sheet.querySelector('.sheet-return').addEventListener('click', closeSheet);
sheet.addEventListener('click', event => { if (event.target === sheet) {
  const rect = sheet.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeSheet();
} });
sheet.addEventListener('close', () => {
  opener?.focus({ preventScroll: true });
  renderMotion();
});
renderMotion();
