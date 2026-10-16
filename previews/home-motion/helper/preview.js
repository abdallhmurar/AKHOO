/* Local design prototype. No account, GPS, request, phone or messaging APIs. */
const videos = [...document.querySelectorAll('video')];
const motionButtons = [...document.querySelectorAll('[data-motion], #motion-toggle')];
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const requestDialog = document.querySelector('#request-dialog');
const infoDialog = document.querySelector('#info-dialog');
const inView = new WeakMap();
const views = new Set(['nearby', 'details', 'mission', 'empty']);
let enabled = !reduced.matches;
let helperMap;
let mapLoading = false;
let view;
let missionStage = null;
let infoOpener;

function shouldPlay(video) {
  return enabled && !reduced.matches && !document.hidden && !infoDialog.open
    && !video.dataset.failed && !video.closest('[hidden]') && inView.get(video)
    && (requestDialog.open ? requestDialog.contains(video) : !video.closest('dialog'));
}
function renderMotion() {
  motionButtons.forEach(button => {
    button.disabled = reduced.matches;
    button.setAttribute('aria-pressed', String(enabled && !reduced.matches));
    button.setAttribute('aria-label', reduced.matches ? 'الحركة متوقفة حسب إعداد جهازك' : enabled ? 'إيقاف الحركة' : 'تشغيل الحركة');
  });
  videos.forEach(video => {
    if (!shouldPlay(video)) {
      video.pause();
      video.parentElement.classList.remove('is-playing');
      return;
    }
    if (!video.getAttribute('src')) video.src = video.dataset.src;
    video.muted = true;
    if (video.paused) video.play().then(() => {
      if (!shouldPlay(video)) { video.pause(); video.parentElement.classList.remove('is-playing'); }
    }).catch(() => video.parentElement.classList.remove('is-playing'));
  });
}
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => inView.set(entry.target, entry.isIntersecting && entry.intersectionRatio >= 0.2));
  renderMotion();
}, {threshold:[0,0.2]});
videos.forEach(video => {
  observer.observe(video);
  video.addEventListener('playing', () => {
    if (shouldPlay(video)) video.parentElement.classList.add('is-playing');
    else video.pause();
  });
  video.addEventListener('error', () => {
    video.dataset.failed = 'true';
    video.parentElement.classList.remove('is-playing');
  });
});
motionButtons.forEach(button => button.addEventListener('click', () => { enabled = !enabled; renderMotion(); }));
reduced.addEventListener('change', () => { enabled = !reduced.matches; renderMotion(); });
document.addEventListener('visibilitychange', renderMotion);
window.addEventListener('pagehide', () => videos.forEach(video => video.pause()));
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

const stages = [
  {title:'استلمت المهمة', status:'جاهز تنطلق؟', hint:'صاحب الطلب بانتظارك', next:'أنا في الطريق', footer:'حدّث حالتك ليعرف صاحب الطلب وين وصلت'},
  {title:'إنت بالطريق', status:'توصل بالسلامة', hint:'خذ وقتك، سلامتك أولًا', next:'وصلت للموقع', footer:'حدّث الحالة لما توصل بأمان'},
  {title:'وصلت للموقع', status:'إيدك بتفرق', hint:'ساعده، وبعدين حدّث الحالة', next:'تمت المساعدة', footer:'اضغط بعد ما تخلص المساعدة'},
  {title:'بانتظار التأكيد', status:'شكرًا إلك يا أخو', hint:'باقي تأكيد صاحب الطلب', next:'بانتظار تأكيد صاحب الطلب', footer:'بتكتمل المهمة بعد تأكيد صاحب الطلب'},
  {title:'المهمة اكتملت', status:'كنت أخو وقت الحاجة', hint:'شكرًا لوقتك ومساعدتك', next:'العودة للطلبات', footer:'كل مساعدة بتفرق'}
];

function announce(text) { document.querySelector('#announcement').textContent = text; }
function renderMission() {
  const stage = stages[missionStage ?? 0];
  document.querySelector('#mission-status').textContent = stage.status;
  document.querySelector('#mission-hint').textContent = stage.hint;
  const next = document.querySelector('#next-stage');
  next.textContent = stage.next;
  next.disabled = missionStage === 3;
  document.querySelector('#next-hint').textContent = stage.footer;
  document.querySelector('#complete-demo').hidden = missionStage !== 3;
  document.querySelectorAll('.mission-timeline li').forEach((item,index) => {
    item.classList.toggle('is-current', index === missionStage);
    item.classList.toggle('is-complete', index < missionStage);
    if (index === missionStage) item.setAttribute('aria-current','step');
    else item.removeAttribute('aria-current');
  });
  document.querySelector('#view-request-label').textContent = missionStage === null ? 'عرض الطلب' : 'متابعة المهمة';
  document.querySelector('#accept-request').textContent = missionStage === null ? 'استلام المهمة' : 'متابعة المهمة';
  return stage;
}
function renderRoute({focus = false} = {}) {
  const requestedView = new URLSearchParams(location.search).get('view') || 'nearby';
  view = views.has(requestedView) ? requestedView : 'nearby';
  if (view === 'mission' && missionStage === null) missionStage = 0;
  const mission = view === 'mission';
  const empty = view === 'empty';
  document.body.classList.toggle('show-mission', mission);
  document.body.classList.toggle('show-empty', empty);
  document.body.classList.toggle('show-nearby', !mission && !empty);
  document.querySelector('#nearby-panel').hidden = mission || empty;
  document.querySelector('#empty-panel').hidden = !empty;
  document.querySelector('#mission-panel').hidden = !mission;
  document.querySelector('#mission-footer').hidden = !mission;
  const stage = renderMission();
  const title = document.querySelector('#page-title');
  title.textContent = mission ? stage.title : 'بدي أساعد';
  document.title = 'أخو — ' + title.textContent + ' · معاينة';
  document.querySelector('#page-subtitle').textContent = mission ? 'تابع المهمة وتواصل مع صاحب الطلب' : empty ? 'طلبات المساعدة القريبة بتظهر هون' : 'مساعدة صغيرة منك، بتفرق كثير';
  document.querySelector('#availability-label').textContent = mission ? (missionStage === 4 ? 'تمت المساعدة' : 'عم تساعد') : 'متاح للمساعدة';
  const back = document.querySelector('.back');
  back.href = mission ? '?view=nearby' : '../';
  back.setAttribute('aria-label', mission ? 'الرجوع للطلبات' : 'الرجوع للرئيسية');
  if (infoDialog.open) infoDialog.close();
  if (view === 'details' && !requestDialog.open) requestDialog.showModal();
  else if (view !== 'details' && requestDialog.open) requestDialog.close();
  renderMotion();
  if (focus && view !== 'details') title.focus({preventScroll:true});
}
function navigate(nextView, {replace = false, sheet = false} = {}) {
  const url = new URL(location.href);
  url.search = '';
  url.searchParams.set('view',nextView);
  history[replace ? 'replaceState' : 'pushState']({helperPreview:true,sheet},'',url);
  renderRoute({focus:!sheet});
  if (!sheet) window.scrollTo({top:0,behavior:'instant'});
}
function openRequest() {
  if (missionStage !== null) navigate('mission');
  else navigate('details',{sheet:true});
}
function closeRequest() {
  if (history.state?.helperPreview && history.state.sheet) history.back();
  else navigate('nearby',{replace:true});
}
document.querySelectorAll('[data-open-details]').forEach(button => button.addEventListener('click',openRequest));
document.querySelectorAll('[data-view]').forEach(link => link.addEventListener('click',event => {
  event.preventDefault(); navigate(link.dataset.view,{sheet:link.dataset.view === 'details'});
}));
document.querySelector('.back').addEventListener('click',event => {
  if (view === 'mission') { event.preventDefault(); navigate('nearby'); }
});
document.querySelector('#close-request').addEventListener('click',closeRequest);
requestDialog.addEventListener('cancel',event => { event.preventDefault(); closeRequest(); });
requestDialog.addEventListener('click',event => {
  const rect = requestDialog.getBoundingClientRect();
  if (event.target === requestDialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) closeRequest();
});
requestDialog.addEventListener('close',renderMotion);
document.querySelector('#accept-request').addEventListener('click',() => {
  if (missionStage === null) missionStage = 0;
  navigate('mission');
  announce('تم استلام المهمة التجريبية');
});
document.querySelector('#next-stage').addEventListener('click',() => {
  if (view !== 'mission' || missionStage === 3) return;
  if (missionStage === 4) { missionStage = null; navigate('nearby'); return; }
  missionStage += 1;
  renderRoute();
  announce(stages[missionStage].title);
});
document.querySelector('#complete-demo').addEventListener('click',() => {
  if (missionStage !== 3) return;
  missionStage = 4;
  navigate('mission');
  announce('معاينة اكتمال المهمة بعد تأكيد صاحب الطلب');
});
document.querySelector('#reset-demo').addEventListener('click',() => {
  missionStage = null;
  navigate('nearby');
  announce('بدأت تجربة طلب جديد');
});
window.addEventListener('popstate',() => renderRoute());

const information = {
  call:['الاتصال بصاحب الطلب','بالتطبيق بيفتح الاتصال بصاحب الطلب. هون بنجرّب شكل الزر، بدون اتصال فعلي أو رقم شخصي.'],
  chat:['المحادثة','من هون بتتواصل بالرسائل والصور والفيديو. هاي معاينة محلية، ما بتبعت أي رسالة.'],
  navigation:['الملاحة للموقع','بالتطبيق بتفتح الملاحة لموقع الطلب. الموقع هون تجريبي، وما رح نفتَح مسار أو نشارك موقعك.'],
  request:['تفاصيل الطلب','شحن بطارية · السيارة بحاجة لوصلة بطارية. رقم المعاينة DEMO-001، والمسافة المعروضة تجريبية.']
};
document.querySelectorAll('[data-info]').forEach(button => button.addEventListener('click',() => {
  infoOpener = button;
  const [title,copy] = information[button.dataset.info];
  document.querySelector('#info-title').textContent = title;
  document.querySelector('#info-copy').textContent = copy;
  infoDialog.showModal();
  renderMotion();
}));
document.querySelector('#close-info').addEventListener('click',() => infoDialog.close());
infoDialog.addEventListener('close',() => {
  renderMotion();
  if (infoOpener?.checkVisibility() && (!requestDialog.open || requestDialog.contains(infoOpener))) infoOpener.focus({preventScroll:true});
});

renderRoute();
prepareMap();
