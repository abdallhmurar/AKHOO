/* Local design preview: no account APIs, redemption requests or stored state. */
const openers=new WeakMap();
let motion;
let medalTimer;
function openDialog(dialog,opener){clearTimeout(medalTimer);openers.set(dialog,opener);dialog.showModal();motion?.suspend(true);}
document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>document.getElementById(button.dataset.close).close()));
document.querySelectorAll('dialog').forEach(dialog=>{
  dialog.addEventListener('close',()=>{openers.get(dialog)?.focus({preventScroll:true});motion?.suspend(false);});
  dialog.addEventListener('click',event=>{const r=dialog.getBoundingClientRect();if(event.target===dialog&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom))dialog.close();});
});
document.querySelectorAll('#offer-details,#offer-image').forEach(button=>button.addEventListener('click',()=>openDialog(document.querySelector('#offer-dialog'),button)));
document.querySelector('#medal-button').addEventListener('click',event=>{
  clearTimeout(medalTimer);const opener=event.currentTarget;
  if(motion?.play())medalTimer=setTimeout(()=>openDialog(document.querySelector('#level-dialog'),opener),450);
  else openDialog(document.querySelector('#level-dialog'),opener);
});
document.querySelector('#perks-nav').addEventListener('click',()=>{window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});});
document.addEventListener('visibilitychange',()=>{if(document.hidden)clearTimeout(medalTimer);});
import('./scene.js').then(({createMotion})=>{motion=createMotion();motion.suspend(!!document.querySelector('dialog[open]'));}).catch(()=>{document.querySelector('#motion-toggle span').textContent='عرض ثابت';document.querySelector('#motion-toggle').disabled=true;});
window.addEventListener('pagehide',event=>{clearTimeout(medalTimer);if(!event.persisted)motion?.dispose();else motion?.suspend(true);});
window.addEventListener('pageshow',()=>motion?.suspend(!!document.querySelector('dialog[open]')));
