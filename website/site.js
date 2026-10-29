import {icon} from './icons.js';
import {content,languages} from './content.js';
import {upgradeExperience,setupWalkthrough,setupEditorialMotion} from './experience.js';
import {createJourney,setupJourney} from './journey.js';
import {setupBrandMotion} from './brand-motion.js';
import {partnerStrip,setupPartnerStrip} from './partner-strip.js';

const root=document.querySelector('#site');
const store='https://apps.apple.com/app/id6809610412';
const androidStore='https://play.google.com/store/apps/details?id=app.akhoo.help';
const whatsapp='https://wa.me/972509956406';
const page=location.pathname.split('/').pop().replace('.html','');
const isLegal=['privacy','terms','delete-account','licenses'].includes(page);
const query=new URLSearchParams(location.search);
let savedLanguage='ar';
try { savedLanguage=localStorage.getItem('akhoo-website-language') || 'ar'; } catch {}
let lang=Object.hasOwn(content,query.get('lang'))?query.get('lang'):(Object.hasOwn(content,savedLanguage)?savedLanguage:'ar');
let cleanups=[], generation=0, currentMode='need', formValues={};
const e=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const home=()=>`./?lang=${lang}`;
const section=id=>isLegal?`${home()}#${id}`:`#${id}`;
const legalLink=name=>`./${name}.html?lang=${lang}`;
const legalTitle=t=>page==='delete-account'?t.deletion:t[page];
const art=(name,alt,classes='')=>`<div class="motion-art ${classes}" role="img" aria-label="${e(alt)}"><img src="./assets/${name}.png" alt="" loading="lazy" width="1448" height="1086"><video data-src="./assets/${name}.mp4" poster="./assets/${name}.png" muted loop playsinline preload="none" tabindex="-1" aria-hidden="true" disablepictureinpicture></video></div>`;

function header(t) {
  return `<a class="skip" href="#main">${e(t.skip)}</a><header class="header"><div class="container header-inner">
    <a class="brand" href="${home()}" aria-label="${e(t.brand)}"><img src="./assets/brand.png" alt="${e(t.brand)}" width="62" height="62"><span>${e(t.brand)}<small>AKHOO</small></span></a>
    <nav class="nav" id="main-nav" aria-label="${e(t.menu)}">${['how','community','perks','partners'].map((id,i)=>`<a href="${section(id)}">${e(t.nav[i])}</a>`).join('')}</nav>
    <div class="header-actions"><label class="language"><span class="sr-only">${e(t.language)}</span><select id="language">${Object.entries(languages).map(([key,label])=>`<option value="${key}" ${lang===key?'selected':''}>${label}</option>`).join('')}</select></label><a class="button small header-download" href="${section('download')}">${e(t.download)}${icon('arrow','directional')}</a><button class="menu-toggle" aria-label="${e(t.menu)}" aria-controls="main-nav" aria-expanded="false">${icon('menu')}</button></div>
  </div></header>`;
}
function footer(t) {
  return `<footer class="footer"><div class="container footer-top"><a class="brand" href="${home()}"><img src="./assets/brand.png" alt="${e(t.brand)}" width="54" height="54"><span>${e(t.brand)}<small>${e(t.footerTag)}</small></span></a><nav aria-label="${e(t.supportTitle)}"><a href="${legalLink('privacy')}">${e(t.privacy)}</a><a href="${legalLink('terms')}">${e(t.terms)}</a><a href="${legalLink('delete-account')}">${e(t.deletion)}</a><a href="${section('contact')}">${e(t.whatsapp)}</a></nav></div><div class="container footer-bottom"><span>${e(t.rights)}</span><span dir="ltr">© ${new Date().getFullYear()} AKHOO</span></div></footer>`;
}
function fields(t) {
  return ['business','person','city','details'].map(name=>`<div class="field ${name==='business'||name==='details'?'wide':''}"><label for="${name}">${e(t.form[name])}${name==='details'?` <span class="field-optional">${e(t.partnerOptional)}</span>`:''}</label>${name==='details'?`<textarea id="${name}" name="${name}" rows="3" maxlength="1500" placeholder="${e(t.form.detailsHint)}" aria-describedby="${name}-error">${e(formValues[name]||'')}</textarea>`:`<input id="${name}" name="${name}" value="${e(formValues[name]||'')}" maxlength="120" required autocomplete="${name==='business'?'organization':name==='person'?'name':'address-level2'}" placeholder="${e(t.form[name+'Hint'])}" aria-describedby="${name}-error">`}<span class="field-error" id="${name}-error"></span></div>`).join('');
}
function partnership(t) {
  return `<section id="partners" class="section partners" aria-labelledby="partnership-heading">
    <div class="container partner-grid">
      <div class="partner-copy">
        <span class="eyebrow">${e(t.partnerEyebrow)}</span>
        <h2 id="partnership-heading">${e(t.partnerTitle)} <span>${e(t.partnerAccent)}</span></h2>
        <p class="partner-intro">${e(t.partnerText)}</p>
        <ul class="partner-benefits">${t.partnerBenefits.map(([title,text])=>`<li><span class="partner-benefit-mark">${icon('check')}</span><div><h3>${e(title)}</h3><p>${e(text)}</p></div></li>`).join('')}</ul>
        <figure class="partner-example">
          <div class="partner-offer"><div class="partner-offer-copy"><small>${e(t.partnerExampleLabel)}</small><strong>${e(t.partnerExampleTitle)}</strong><p>${e(t.partnerExampleText)}</p><div class="partner-offer-types">${t.partnerExampleOffers.map(text=>`<span>${e(text)}</span>`).join('')}</div></div><div class="partner-offer-art"><img src="./assets/gift.png" alt="" width="100" height="100" loading="lazy"></div></div>
          <figcaption>${e(t.partnerExampleNote)}</figcaption>
        </figure>
      </div>
      <form id="partner-form" class="partner-form" aria-labelledby="partner-form-heading" novalidate>
        <div class="partner-form-heading wide"><span class="partner-form-icon">${icon('whatsapp')}</span><h3 id="partner-form-heading">${e(t.partnerFormTitle)}</h3><p>${e(t.partnerFormText)}</p></div>
        ${fields(t)}
        <div class="partner-form-action wide"><button type="submit" class="button">${e(t.form.submit)}${icon('arrow','directional')}</button><p class="partner-submit-note">${e(t.partnerNote)}</p></div>
      </form>
    </div>
  </section>`;
}
function landing(t) {
  return `<main id="main">
    <section class="hero"><div class="container hero-grid"><div class="hero-copy"><span class="eyebrow pill"><i></i>${e(t.eyebrow)}</span><h1>${e(t.heroTitle)}<br><span>${e(t.heroAccent)}</span></h1><p class="hero-description">${e(t.heroText)}</p><div class="actions"><a class="button" href="#download">${e(t.heroAction)}${icon('arrow','directional')}</a><a class="text-link" href="#how">${e(t.heroSecondary)}<span class="round-arrow">${icon('arrow','directional')}</span></a></div><div class="hero-chips">${t.heroChips.map((v,i)=>`<span><img src="./assets/${['person','hands','gift'][i]}.png" alt="" width="26" height="26">${e(v)}</span>`).join('')}</div></div>
    <div class="hero-art"><div class="hero-orbit orbit-one"></div><div class="hero-orbit orbit-two"></div><div class="floating-label top-label"><img src="./assets/hands.png" alt="" width="40" height="40"><strong>${e(t.artTop)}</strong>${icon('spark')}</div><div class="hero-window">${art('help',t.heroAlt)}<div class="hero-window-caption"><span class="live-dot"></span>${e(t.artCaption)}<span>AKHOO</span></div></div><div class="floating-label bottom-label"><span class="location-badge">${icon('pin')}</span><div><small>${e(t.artBottom)}</small><strong>${e(t.services.map(v=>v[0]).slice(0,3).join(' · '))}</strong></div></div><span class="deco-plus">✦</span></div>
    </div><a class="hero-scroll" href="#services">${e(t.scroll)}${icon('down')}</a></section>
    <section id="services" class="services container"><p class="section-kicker">${e(t.servicesLabel)}</p><div class="service-grid">${t.services.map(([title,body],i)=>`<article class="service"><img src="./assets/${['battery','fuel','tire','other'][i]}.png" alt="" width="200" height="140" loading="lazy"><div><h3>${e(title)}</h3><p>${e(body)}</p></div></article>`).join('')}</div></section>
    <section id="how" class="section how"><div class="container"><div class="section-heading"><span class="eyebrow">${e(t.howEyebrow)}</span><h2>${e(t.howTitle)}</h2><p>${e(t.howText)}</p></div><div class="how-grid"><div class="how-visual"><div class="how-visual-dots"></div><img class="how-art" src="./assets/battery.png" alt="" width="600" height="400" loading="lazy"><span class="how-art-note">${icon('check')} ${e(t.howCaption)}</span></div><div class="how-content"><div class="tabs" role="tablist" aria-label="${e(t.nav[0])}"><button role="tab" id="tab-need" aria-controls="step-panel" data-mode="need">${e(t.needTab)}</button><button role="tab" id="tab-help" aria-controls="step-panel" data-mode="help">${e(t.helpTab)}</button></div><div id="step-panel" role="tabpanel" tabindex="0"></div><p class="quiet-note">${e(t.howNote)}</p></div></div></div></section>
    <section id="community" class="section community"><div class="container community-grid"><div class="community-copy"><span class="eyebrow">${e(t.communityEyebrow)}</span><h2>${e(t.communityTitle)}<br><span>${e(t.communityAccent)}</span></h2><p>${e(t.communityText)}</p><ul class="check-list">${t.communityList.map(v=>`<li>${icon('check')} ${e(v)}</li>`).join('')}</ul><a class="button teal" href="#download">${e(t.communityAction)}${icon('arrow','directional')}</a></div><div class="community-art">${art('helpers',t.communityAlt)}<div class="community-sticker"><img src="./assets/hands.png" alt="" width="64" height="64"><span>${e(t.artTop)}</span></div></div></div></section>
    <section id="perks" class="section perks"><div class="container perks-panel"><div class="perks-copy"><span class="eyebrow">${e(t.perksEyebrow)}</span><h2>${e(t.perksTitle)}</h2><p>${e(t.perksText)}</p><a class="text-link" href="#download">${e(t.perksAction)}${icon('arrow','directional')}</a></div><div class="perks-art">${art('perks',t.perksAlt,'cropped-art')}</div><div class="gift-wrap"><button class="gift" aria-label="${e(t.giftLabel)}" data-ready="false"><img class="gift-fallback" src="./assets/gift.png" alt="" width="160" height="160"><canvas aria-hidden="true"></canvas></button><span class="gift-hint" aria-live="polite">${e(t.giftHint)}</span></div></div></section>
    ${partnerStrip(lang)}
    ${partnership(t)}
    <section class="section faq" id="faq"><div class="container faq-grid"><div><span class="eyebrow">${e(t.faqEyebrow)}</span><h2>${e(t.faqTitle)}</h2><a class="text-link" href="#contact">${e(t.supportTitle)}${icon('arrow','directional')}</a></div><div class="faq-list">${t.faqs.map(([q,a])=>`<details><summary>${e(q)}${icon('plus')}</summary><p>${e(a)}</p></details>`).join('')}</div></div></section>
    <section id="download" class="download-section"><div class="container download-panel"><div class="download-copy"><span class="eyebrow">${e(t.downloadEyebrow)}</span><h2>${e(t.downloadTitle)}</h2><p>${e(t.downloadText)}</p><div class="actions"><a class="button store-button" href="${store}" target="_blank" rel="noopener noreferrer">${icon('apple')}${e(t.apple)}</a><a class="button android-button" href="${androidStore}" target="_blank" rel="noopener noreferrer">${icon('googleplay')}${e(t.android)}</a></div></div><div class="download-art"><img src="./assets/road.png" alt="" width="800" height="400" loading="lazy"><div class="download-brand"><img src="./assets/brand.png" alt="${e(t.brand)}" width="82" height="82"></div><div class="road-line"></div></div></div></section>
    <section id="contact" class="contact container"><div><h2>${e(t.supportTitle)}</h2><p>${e(t.supportText)}</p></div><div class="actions"><a class="button outline" href="${whatsapp}" target="_blank" rel="noopener noreferrer">${icon('whatsapp')}${e(t.whatsapp)}</a><a class="text-link" href="tel:0509956406"><span class="phone-label">${icon('phone')}${e(t.phone)}</span><bdi>050-995-6406</bdi></a></div></section>
  </main>`;
}
function legal(t) {
  const title=legalTitle(t);
  return `<main id="main" class="legal-main container"><a class="text-link" href="${home()}">${icon('arrow','back-arrow')} ${e(t.back)}</a><h1>${e(title)}</h1><article class="legal-content" id="legal-body" aria-busy="true"></article></main>`;
}
function dialogs(t) {
  return `<dialog id="partner-dialog" aria-labelledby="partner-title"><button class="dialog-close" data-close aria-label="${e(t.close)}">${icon('close')}</button><h2 id="partner-title">${e(t.form.review)}</h2><p>${e(t.form.draftNote)}</p><label for="message-draft" class="sr-only">${e(t.form.review)}</label><textarea id="message-draft" readonly rows="8"></textarea><div class="dialog-actions"><a class="button" id="whatsapp-draft" target="_blank" rel="noopener noreferrer">${e(t.form.send)}${icon('whatsapp')}</a><button class="button outline" id="copy-draft">${icon('copy')}${e(t.form.copy)}</button></div><p id="copy-status" class="copy-status" role="status"></p></dialog>`;
}

function render() {
  cleanups.forEach(fn=>fn()); cleanups=[]; generation++;
  const t=content[lang];
  document.documentElement.lang=lang;
  document.documentElement.dir=lang==='en'?'ltr':'rtl';
  document.title=isLegal?`${legalTitle(t)} · ${t.brand}`:t.title;
  document.querySelector('meta[name="description"]').content=t.description;
  root.innerHTML=header(t)+(isLegal?legal(t):landing(t))+footer(t)+dialogs(t);
  if(!isLegal){upgradeExperience(t,lang,art);createJourney(t,lang,art);}
  document.querySelector('#language').addEventListener('change',event=>{
    const form=document.querySelector('#partner-form');
    if(form) formValues=Object.fromEntries(new FormData(form));
    lang=event.target.value;
    try { localStorage.setItem('akhoo-website-language',lang); } catch {}
    const url=new URL(location.href);url.searchParams.set('lang',lang);history.replaceState(null,'',url);
    render();document.querySelector('#language').focus({preventScroll:true});
  });
  const menu=document.querySelector('.menu-toggle'), headerEl=document.querySelector('.header');
  const closeMenu=()=>{menu.setAttribute('aria-expanded','false');headerEl.classList.remove('menu-open');};
  menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));headerEl.classList.toggle('menu-open',open);});
  document.querySelectorAll('#main-nav a').forEach(a=>a.addEventListener('click',closeMenu));
  const escapeMenu=ev=>{if(ev.key==='Escape'&&menu.getAttribute('aria-expanded')==='true'){closeMenu();menu.focus();}};
  document.addEventListener('keydown',escapeMenu);cleanups.push(()=>document.removeEventListener('keydown',escapeMenu));
  document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
  document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',ev=>{const b=d.getBoundingClientRect();if(ev.target===d&&(ev.clientX<b.left||ev.clientX>b.right||ev.clientY<b.top||ev.clientY>b.bottom))d.close();}));
  if(isLegal) loadLegal(t,generation); else {cleanups.push(setupWalkthrough(t,lang,currentMode,mode=>{currentMode=mode;}));setupJourney(t,lang);setupForm(t);setupMotion();setupGift(t);cleanups.push(setupEditorialMotion());cleanups.push(setupBrandMotion());cleanups.push(setupPartnerStrip(lang));}
}
function setupForm(t) {
  const form=document.querySelector('#partner-form');
  form.addEventListener('input',ev=>{if(!ev.target.name)return;ev.target.removeAttribute('aria-invalid');document.querySelector(`#${ev.target.name}-error`).textContent='';});
  form.addEventListener('submit',ev=>{
    ev.preventDefault();let firstInvalid;
    formValues=Object.fromEntries(new FormData(form));
    for(const name of ['business','person','city']) {
      const field=form.elements[name], invalid=!String(formValues[name]).trim();
      field.setAttribute('aria-invalid',String(invalid));document.querySelector(`#${name}-error`).textContent=invalid?t.form.required:'';
      if(invalid&&!firstInvalid)firstInvalid=field;
    }
    if(firstInvalid){firstInvalid.focus();return;}
    const draft=t.form.intro+'\n\n'+['business','person','city','details'].filter(k=>formValues[k].trim()).map(k=>`${t.form[k]}: ${formValues[k].trim()}`).join('\n');
    document.querySelector('#message-draft').value=draft;
    document.querySelector('#whatsapp-draft').href=whatsapp+'?text='+encodeURIComponent(draft);
    document.querySelector('#copy-status').textContent='';document.querySelector('#partner-dialog').showModal();
  });
  document.querySelector('#copy-draft').addEventListener('click',async()=>{try {await navigator.clipboard.writeText(document.querySelector('#message-draft').value);document.querySelector('#copy-status').textContent=t.form.copied;}catch{document.querySelector('#message-draft').select();document.querySelector('#copy-status').textContent=t.form.copyError;}});
}
function setupMotion() {
  const preference=matchMedia('(prefers-reduced-motion: reduce)'), videos=[...document.querySelectorAll('video[data-src]')], visible=new Set();
  let disposed=false;
  const sync=()=>videos.forEach(video=>{
    if(preference.matches||document.hidden||video.closest('[hidden]')||!visible.has(video)){video.pause();return;}
    if(!video.src){video.src=video.dataset.src;video.load();}
    video.muted=true;video.play().catch(()=>{});
  });
  const observer=new IntersectionObserver(entries=>{if(disposed)return;entries.forEach(entry=>{if(entry.isIntersecting)visible.add(entry.target);else visible.delete(entry.target);});sync();},{threshold:0.15});
  videos.forEach(video=>{observer.observe(video);video.addEventListener('error',()=>{video.style.opacity='0';});});
  preference.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);
  cleanups.push(()=>{disposed=true;observer.disconnect();preference.removeEventListener('change',sync);document.removeEventListener('visibilitychange',sync);videos.forEach(v=>{v.pause();v.removeAttribute('src');v.load();});});
}
function setupGift(t) {
  const button=document.querySelector('.gift'), canvas=button.querySelector('canvas'), hint=document.querySelector('.gift-hint');
  const preference=matchMedia('(prefers-reduced-motion: reduce)');
  let scene,disposed=false,visible=false,loading=false,unavailable=false;
  const resize=()=>{const b=button.getBoundingClientRect();scene?.resize(b.width,b.height);};
  const sync=()=>{
    const enabled=visible&&!document.hidden;scene?.setEnabled(enabled,preference.matches);
    if(!enabled||scene||loading||unavailable)return;
    loading=true;import('./gift-scene.js').then(({createRewardsGift})=>{
      if(disposed)return;
      scene=createRewardsGift(canvas,()=>{unavailable=true;button.dataset.ready='false';},celebrating=>{button.dataset.celebrating=String(celebrating);});
      resize();button.dataset.ready=String(!unavailable);scene.setEnabled(visible&&!document.hidden,preference.matches);
    }).catch(()=>{unavailable=true;});
  };
  const intersection=new IntersectionObserver(entries=>{visible=entries.some(v=>v.isIntersecting);sync();},{threshold:0.15});intersection.observe(button);
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(button);
  preference.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);
  button.addEventListener('click',()=>{hint.textContent=t.giftOpen;if(scene&&!unavailable){scene.celebrate();}else if(!preference.matches){button.animate([{transform:'rotate(0)'},{transform:'rotate(-8deg) scale(1.08)'},{transform:'rotate(8deg)'},{transform:'rotate(0)'}],{duration:450});}});
  cleanups.push(()=>{disposed=true;intersection.disconnect();resizeObserver.disconnect();preference.removeEventListener('change',sync);document.removeEventListener('visibilitychange',sync);scene?.dispose();});
}
async function loadLegal(t,version) {
  const article=document.querySelector('#legal-body');
  if(page==='licenses') {
    article.innerHTML=`<p>${e(t.licensesIntro)}</p><ul dir="ltr"><li><a href="https://www.flaticon.com/free-icon/user_1077012" target="_blank" rel="noopener noreferrer">Magnific (Freepik) — Flaticon</a></li><li><a href="https://www.flaticon.com/free-icon/holding-hands_3131389" target="_blank" rel="noopener noreferrer">Smashicons — Flaticon</a></li><li><a href="https://www.flaticon.com/media/license/license.pdf" target="_blank" rel="noopener noreferrer">Flaticon license</a></li><li><a href="./assets/TAJAWAL-LICENSE.txt">Tajawal — SIL Open Font License</a></li><li><a href="./assets/INTER-LICENSE.txt">Inter — SIL Open Font License</a></li><li><a href="./assets/HEBREW-LICENSE.txt">Noto Sans Hebrew — SIL Open Font License</a></li><li><a href="./assets/THREE-LICENSE.txt">Three.js — MIT</a></li><li><a href="./assets/MOTION-LICENSE.txt">Motion — MIT</a></li><li><a href="./assets/LUCIDE-LICENSE.txt">Lucide — ISC / MIT</a></li><li><a href="./assets/SIMPLE-ICONS-LICENSE.txt">Simple Icons — CC0</a></li></ul>`;article.setAttribute('aria-busy','false');return;
  }
  if(page==='delete-account') {
    article.innerHTML=`<p>${e(t.deleteIntro)}</p><ol>${t.deleteSteps.map(v=>`<li>${e(v)}</li>`).join('')}</ol><p>${e(t.deleteHelp)}</p><a class="button" href="${whatsapp}" target="_blank" rel="noopener noreferrer">${e(t.whatsapp)}${icon('whatsapp')}</a><p>${e(t.deletePolicy)} <a href="${legalLink('privacy')}">${e(t.privacy)}</a></p>`;article.setAttribute('aria-busy','false');return;
  }
  try {
    const response=await fetch('./legal.json');if(!response.ok)throw new Error('Legal content unavailable');
    const data=await response.json();if(version!==generation)return;
    article.innerHTML=`<p class="legal-updated">${e(t.updated)}: ${e(data.updated[lang])}</p>`+data[page][lang].map(block=>block.type==='ul'?`<ul>${block.items.map(v=>`<li>${e(v)}</li>`).join('')}</ul>`:`<${block.type}>${e(block.text)}</${block.type}>`).join('')+`<div class="actions"><a class="text-link" href="${e(data.contact.telHref)}">${icon('phone')}<bdi>${e(data.contact.displayPhone)}</bdi></a><a class="text-link" href="${e(data.contact.whatsappHref)}" target="_blank" rel="noopener noreferrer">${icon('whatsapp')}${e(t.whatsapp)}</a></div><p><a href="${legalLink('licenses')}">${e(t.licenses)}</a></p>`;
  }catch{if(version!==generation)return;article.innerHTML=`<p>${e(t.legalError)}</p><button class="button" id="retry-legal">${e(t.retry)}</button>`;document.querySelector('#retry-legal').addEventListener('click',()=>loadLegal(t,version));}
  article.setAttribute('aria-busy','false');
}
render();
