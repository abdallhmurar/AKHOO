import {partnerLogos} from './partner-logos.js';

const copy = {
  ar: {title:'شركاء أخوو', note:'ناس ومصالح، معنا عالطريق.', eyebrow:'في مكان لشعارك هون', titleInvite:'عندك مصلحة؟ خلّينا نكبّرها سوا.', text:'حاب تعلن عن شغلك وتقدّم عرض لأهل أخوو؟ ابعتلنا، واحكيلنا شو عندك. بنرتّبها سوا وبتصير واحد منّا.', action:'ابعتلنا وخلّيك معنا'},
  en: {title:'Our partners', note:'People and businesses, along the way.', eyebrow:'There’s room for your logo here', titleInvite:'Have a business? Let’s grow together.', text:'Want to introduce your business and offer a perk to the AKHOO community? Tell us what you have in mind. We’ll work out the details together.', action:'Talk to us about joining'},
  he: {title:'השותפים של אח׳ו', note:'אנשים ועסקים, איתנו בדרך.', eyebrow:'יש כאן מקום ללוגו שלכם', titleInvite:'יש לכם עסק? בואו נצמח יחד.', text:'רוצים לפרסם את העסק ולהציע הטבה לקהילת אח׳ו? כתבו לנו מה יש לכם בראש. נתאם את הפרטים יחד ותהיו חלק מאיתנו.', action:'דברו איתנו על הצטרפות'},
};
const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export function partnerStrip(lang) {
  const t=copy[lang]||copy.ar;
  return `<section class="partner-showcase" id="our-partners" aria-labelledby="partner-strip-heading">
    <div class="container">
      <div class="partner-strip-heading"><span class="eyebrow">${escape(t.note)}</span><h2 id="partner-strip-heading">${escape(t.title)}</h2></div>
      ${partnerLogos.length?`<div class="partner-marquee" tabindex="0" aria-labelledby="partner-strip-heading"><div class="partner-track"><ul class="partner-logo-group">${partnerLogos.map(partner=>`<li class="partner-logo"><img src="${escape(partner.image)}" alt="${escape(partner.name)}" width="184" height="116" loading="lazy" decoding="async"></li>`).join('')}</ul></div></div>`:''}
      <div class="partner-invitation">
        <div class="partner-invitation-copy"><span class="eyebrow">${escape(t.eyebrow)}</span><h3>${escape(t.titleInvite)}</h3><p>${escape(t.text)}</p></div>
        <a class="button partner-join" href="#partner-form"><span>${escape(t.action)}</span><svg class="icon directional" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M19 12H5m7-7-7 7 7 7"/></svg></a>
      </div>
    </div>
  </section>`;
}

export function setupPartnerStrip() {
  const section=document.querySelector('#our-partners');
  const viewport=section?.querySelector('.partner-marquee');
  if(!viewport) return ()=>{};
  const track=viewport.querySelector('.partner-track'), group=track.querySelector('.partner-logo-group');
  const originals=[...group.children];
  const preference=matchMedia('(prefers-reduced-motion: reduce)');
  let animation, visible=false, hovered=false, focused=false, disposed=false, frame;
  function sync(){
    const running=visible&&!document.hidden&&!preference.matches&&!hovered&&!focused;
    if(running)animation?.play();else animation?.pause();
  }
  function rebuild(){
    if(disposed)return;
    animation?.cancel(); animation=undefined;
    track.querySelectorAll('[data-repeat]').forEach(node=>node.remove());
    if(preference.matches)return;
    const cloneItem=item=>{const clone=item.cloneNode(true);clone.dataset.repeat='';clone.setAttribute('aria-hidden','true');clone.querySelector('img').alt='';return clone;};
    const itemWidth=originals[0]?.getBoundingClientRect().width||216;
    const required=Math.ceil((Math.ceil(viewport.clientWidth/(itemWidth+24))+1)/originals.length)*originals.length;
    for(let i=originals.length;i<required;i++)group.append(cloneItem(originals[i%originals.length]));
    const duplicate=group.cloneNode(true);duplicate.dataset.repeat='';duplicate.setAttribute('aria-hidden','true');duplicate.inert=true;duplicate.querySelectorAll('img').forEach(img=>img.alt='');track.append(duplicate);
    const distance=group.getBoundingClientRect().width;
    const rtl=document.documentElement.dir==='rtl';
    animation=track.animate([{transform:`translateX(${rtl?-distance:0}px)`},{transform:`translateX(${rtl?0:-distance}px)`}],{duration:distance/30*1000,iterations:Infinity,easing:'linear'});
    sync();
  }
  const observer=new IntersectionObserver(entries=>{visible=entries.some(entry=>entry.isIntersecting);sync();},{threshold:.05});observer.observe(viewport);
  const resize=new ResizeObserver(()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(rebuild);});resize.observe(viewport);
  const hoverIn=()=>{hovered=true;sync();},hoverOut=()=>{hovered=false;sync();};
  const focusIn=()=>{focused=true;sync();},focusOut=()=>{focused=false;sync();};
  viewport.addEventListener('pointerenter',hoverIn);viewport.addEventListener('pointerleave',hoverOut);
  viewport.addEventListener('focusin',focusIn);viewport.addEventListener('focusout',focusOut);
  preference.addEventListener('change',rebuild);document.addEventListener('visibilitychange',sync);
  rebuild();
  return ()=>{disposed=true;cancelAnimationFrame(frame);animation?.cancel();observer.disconnect();resize.disconnect();preference.removeEventListener('change',rebuild);document.removeEventListener('visibilitychange',sync);viewport.removeEventListener('pointerenter',hoverIn);viewport.removeEventListener('pointerleave',hoverOut);viewport.removeEventListener('focusin',focusIn);viewport.removeEventListener('focusout',focusOut);};
}
