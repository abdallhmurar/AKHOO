/* Isolated visual prototype: no app imports, API calls, location or storage. */
const screen = document.querySelector('#home-screen');
const motionButton = document.querySelector('#motion-toggle');
const referenceButton = document.querySelector('#reference-toggle');
const reference = document.querySelector('#reference');
const sheet = document.querySelector('.demo-sheet');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let motionEnabled = !reducedMotion.matches;

function renderMotion() {
  screen.classList.toggle('motion-off', !motionEnabled || document.hidden || !reference.hidden);
  motionButton.setAttribute('aria-pressed', String(motionEnabled));
  motionButton.disabled = reducedMotion.matches;
  motionButton.textContent = reducedMotion.matches ? 'الحركة متوقفة حسب إعداد جهازك' : motionEnabled ? 'إيقاف الحركة' : 'تشغيل الحركة';
  const svg = document.querySelector('.motion-art');
  if (screen.classList.contains('motion-off')) svg.pauseAnimations();
  else svg.unpauseAnimations();
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
  help: ['بدي أساعد', 'بالتطبيق بيفتح هذا الزر خريطة طلبات المساعدة القريبة. هون بنجرّب التصميم فقط.'],
  perks: ['مزايا أخو', 'من هون بتوصل لعروض مزايا أخو. هاي معاينة لشكل الصفحة وحركة الأزرار.'],
  notifications: ['الإشعارات', 'هذا مكان إشعاراتك في التطبيق. المعاينة غير متصلة بحسابك.'],
  activity: ['نشاطي', 'هذا الزر بيفتح سجل مساعداتك وطلباتك في التطبيق.'],
  account: ['حسابي', 'هذا الزر بيفتح حسابك وإعداداتك في التطبيق.'],
};
let opener;
document.querySelectorAll('[data-demo]').forEach(button => {
  button.addEventListener('click', () => {
    if (button.dataset.demo === 'home') return;
    opener = button;
    const [title, description] = demos[button.dataset.demo];
    document.querySelector('#demo-title').textContent = title;
    document.querySelector('#demo-description').textContent = description;
    sheet.showModal();
  });
});
function closeSheet() { sheet.close(); }
sheet.querySelector('.sheet-close').addEventListener('click', closeSheet);
sheet.querySelector('.sheet-return').addEventListener('click', closeSheet);
sheet.addEventListener('click', event => { if (event.target === sheet) {
  const rect = sheet.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeSheet();
} });
sheet.addEventListener('close', () => opener?.focus({ preventScroll: true }));
renderMotion();
