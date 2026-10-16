/* Isolated local account design. No account APIs, storage, credentials or uploads. */
const DEFAULT_AVATAR = '../activity/assets/icons/person.png';
const profile = {name:'مستخدم أخو',phone:'',avatar:DEFAULT_AVATAR};
const settings = {language:'ar',navigation:'waze'};
const profileDialog = document.querySelector('#profile-dialog');
const profileForm = document.querySelector('#profile-form');
const choiceDialog = document.querySelector('#choice-dialog');
const guideDialog = document.querySelector('#guide-dialog');
const infoDialog = document.querySelector('#info-dialog');
const openers = new WeakMap();
const ownedPhotos = new Set();
let draftAvatar = DEFAULT_AVATAR;
let photoRevision = 0;
let photoBusy = false;
let choiceKind;
let guideStep = 0;
let feedbackTimer;
const choices = {
  language:{title:'اللغة',description:'معاينة لاختيار اللغة. نصوص الصفحة هون بتضل بالعربية.',options:[['ar','العربية'],['he','עברית'],['en','English']]},
  navigation:{title:'تطبيق الملاحة',description:'اختَر التطبيق المفضّل بالمعاينة. ما رح نفتح ملاحة فعلية.',options:[['waze','ويز'],['google','خرائط جوجل']]}
};
const guideSteps = [
  {title:'لما تحتاج مساعدة',copy:'من الرئيسية اختَر «بدي مساعدة»، وحدّد المشكلة والتفاصيل وموقعك.',art:'../requester/assets/battery.png'},
  {title:'إيدك بتفرق',copy:'اختَر «بدي أساعد» لتشوف الطلبات القريبة وتتابع المهمة بعد استلامها.',art:'../helper/assets/helper.png'},
  {title:'كل مساعدة إلها أثر',copy:'من «نشاطي» بتتابع مساعداتك والنقاط اللي كسبتها.',art:'../activity/assets/icons/trophy.png'}
];
function announce(message) {
  clearTimeout(feedbackTimer);
  const feedback = document.querySelector('#feedback');
  feedback.textContent = message;
  feedback.hidden = false;
  feedbackTimer = setTimeout(() => { feedback.hidden = true; },4000);
}
function openDialog(dialog,opener) {
  openers.set(dialog,opener);
  dialog.showModal();
}
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click',() => document.getElementById(button.dataset.close).close()));
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.addEventListener('close',() => {
    const opener = openers.get(dialog);
    if (opener?.isConnected) opener.focus({preventScroll:true});
  });
  dialog.addEventListener('click',event => {
    const r = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom)) dialog.close();
  });
});
function releaseUnusedPhotos() {
  for (const url of ownedPhotos) {
    if (url !== profile.avatar && (!profileDialog.open || url !== draftAvatar)) { URL.revokeObjectURL(url); ownedPhotos.delete(url); }
  }
}
function renderDraft() {
  const image = document.querySelector('#draft-avatar');
  image.src = draftAvatar;
  image.classList.toggle('has-photo',draftAvatar !== DEFAULT_AVATAR);
}
function openProfile(opener) {
  profileForm.elements.name.value = profile.name;
  profileForm.elements.name.setCustomValidity('');
  profileForm.elements.phone.value = profile.phone;
  document.querySelector('#avatar-file').value = '';
  document.querySelector('#photo-error').textContent = '';
  draftAvatar = profile.avatar;
  renderDraft();
  openDialog(profileDialog,opener);
}
document.querySelectorAll('#edit-profile, #avatar-button').forEach(button => button.addEventListener('click',() => openProfile(button)));
document.querySelector('#avatar-file').addEventListener('change',async event => {
  const file = event.target.files[0];
  if (!file) return;
  const error = document.querySelector('#photo-error');
  error.textContent = '';
  const revision = ++photoRevision;
  if (!['image/png','image/jpeg','image/webp'].includes(file.type) || file.size > 10*1024*1024) {
    photoBusy = false;
    document.querySelector('#save-profile').disabled = false;
    error.textContent = 'اختَر صورة PNG أو JPG أو WebP، أصغر من 10 ميغابايت.';
    event.target.value = '';
    return;
  }
  photoBusy = true;
  document.querySelector('#save-profile').disabled = true;
  const url = URL.createObjectURL(file);
  ownedPhotos.add(url);
  try {
    const probe = new Image();
    probe.src = url;
    await probe.decode();
    if (revision !== photoRevision || !profileDialog.open) return;
    draftAvatar = url;
    renderDraft();
  } catch {
    if (revision === photoRevision && profileDialog.open) error.textContent = 'ما قدرنا نعرض الصورة. جرّب صورة ثانية.';
  } finally {
    if (revision === photoRevision) { photoBusy = false; document.querySelector('#save-profile').disabled = false; }
    releaseUnusedPhotos();
  }
});
document.querySelector('#remove-avatar').addEventListener('click',() => {
  photoRevision += 1;
  photoBusy = false;
  document.querySelector('#save-profile').disabled = false;
  document.querySelector('#avatar-file').value = '';
  document.querySelector('#photo-error').textContent = '';
  draftAvatar = DEFAULT_AVATAR;
  renderDraft();
  releaseUnusedPhotos();
});
profileForm.elements.name.addEventListener('input',() => profileForm.elements.name.setCustomValidity(''));
profileForm.addEventListener('submit',event => {
  event.preventDefault();
  if (photoBusy) return;
  const name = profileForm.elements.name.value.trim();
  profileForm.elements.name.setCustomValidity(name.length >= 2 ? '' : 'اكتب اسمًا من حرفين على الأقل.');
  if (!profileForm.reportValidity()) return;
  profile.name = name;
  profile.phone = profileForm.elements.phone.value.trim();
  profile.avatar = draftAvatar;
  document.querySelector('#profile-name').textContent = profile.name;
  document.querySelector('#profile-avatar').src = profile.avatar;
  document.querySelector('#avatar-button').classList.toggle('has-photo',profile.avatar !== DEFAULT_AVATAR);
  profileDialog.close();
  announce('تم حفظ التغييرات في المعاينة');
});
profileDialog.addEventListener('close',() => {
  photoRevision += 1;
  photoBusy = false;
  document.querySelector('#save-profile').disabled = false;
  draftAvatar = profile.avatar;
  releaseUnusedPhotos();
});
document.querySelectorAll('[data-choice]').forEach(button => button.addEventListener('click',() => {
  choiceKind = button.dataset.choice;
  const config = choices[choiceKind];
  document.querySelector('#choice-title').textContent = config.title;
  document.querySelector('#choice-description').textContent = config.description;
  const options = document.querySelector('#choice-options');
  options.querySelectorAll('label').forEach(label => label.remove());
  for (const [value,text] of config.options) {
    const label = document.createElement('label'); label.className = 'choice-label';
    const input = document.createElement('input'); input.type = 'radio'; input.name = 'choice'; input.value = value; input.checked = value === settings[choiceKind];
    const caption = document.createElement('bdi'); caption.textContent = text;
    const dot = document.createElement('span'); dot.className = 'radio-dot'; dot.setAttribute('aria-hidden','true');
    label.append(input,caption,dot); options.append(label);
  }
  openDialog(choiceDialog,button);
}));
document.querySelector('#choice-form').addEventListener('submit',event => {
  event.preventDefault();
  const value = new FormData(event.currentTarget).get('choice');
  const option = choices[choiceKind]?.options.find(([key]) => key === value);
  if (!option) return;
  settings[choiceKind] = value;
  document.querySelector('#'+choiceKind+'-value').textContent = option[1];
  choiceDialog.close();
  announce('تم حفظ الاختيار في المعاينة');
});
document.querySelector('#theme-switch').addEventListener('click',event => {
  const dark = event.currentTarget.getAttribute('aria-checked') !== 'true';
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  event.currentTarget.setAttribute('aria-checked',String(dark));
  document.querySelector('meta[name="theme-color"]').content = dark ? '#102c3e' : '#effaff';
  announce(dark ? 'الوضع الليلي مفعّل' : 'الوضع النهاري مفعّل');
});
function renderGuide() {
  const step = guideSteps[guideStep];
  document.querySelector('#guide-title').textContent = step.title;
  document.querySelector('#guide-copy').textContent = step.copy;
  document.querySelector('#guide-art').src = step.art;
  document.querySelector('#guide-count').textContent = (guideStep+1)+' / '+guideSteps.length;
  document.querySelector('#guide-back').hidden = guideStep === 0;
  document.querySelector('#guide-next').textContent = guideStep === guideSteps.length-1 ? 'تمام، فهمت' : 'التالي';
}
document.querySelector('#open-guide').addEventListener('click',event => { guideStep = 0; renderGuide(); openDialog(guideDialog,event.currentTarget); });
document.querySelector('#guide-next').addEventListener('click',() => {
  if (guideStep === guideSteps.length-1) guideDialog.close();
  else { guideStep += 1; renderGuide(); }
});
document.querySelector('#guide-back').addEventListener('click',() => {
  if (guideStep > 0) { guideStep -= 1; renderGuide(); if (guideStep === 0) document.querySelector('#guide-next').focus(); }
});
const info = {
  privacy:['الخصوصية والأمان','من هون بتوصل لإعدادات الأمان وسياسة الخصوصية بالتطبيق. هاي معاينة للتصميم فقط، وما بتغيّر كلمة المرور أو إعدادات حسابك.'],
  support:['المساعدة والدعم','بدك تعرف كيف تستخدم أخو؟ هاي إجابات سريعة بالمعاينة، بدون إرسال رسالة دعم.'],
  perks:['مزايا أخو','من هون بتوصل لعروض مزايا أخو. هاي معاينة لشكل الشريط، وما بتغيّر رصيد النقاط.'],
  logout:['تسجيل خروج','أنت داخل معاينة محلية. الخروج من هون بيرجعك للرئيسية، وما بيسجّل خروج من حسابك الحقيقي.']
};
function openInfo(kind,opener) {
  document.querySelector('#info-title').textContent = info[kind][0];
  document.querySelector('#info-copy').textContent = info[kind][1];
  document.querySelector('#support-faq').hidden = kind !== 'support';
  document.querySelectorAll('#support-faq details').forEach(item => { item.open = false; });
  document.querySelector('#leave-preview').hidden = kind !== 'logout';
  document.querySelector('#close-info').textContent = kind === 'logout' ? 'البقاء في حسابي' : 'تمام';
  openDialog(infoDialog,opener);
}
document.querySelectorAll('[data-info]').forEach(button => button.addEventListener('click',() => openInfo(button.dataset.info,button)));
document.querySelector('#logout-button').addEventListener('click',event => openInfo('logout',event.currentTarget));
document.querySelector('#account-nav').addEventListener('click',() => window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'}));
