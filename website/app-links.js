export const appleStore='https://apps.apple.com/app/id6809610412';
export const googleStore='https://play.google.com/store/apps/details?id=app.akhoo.help';
export const webRequest='https://akhoo.vercel.app/requester';
export function nativeRequestLink(userAgent, touchPoints=0) {
  if(/Android/i.test(userAgent))return `intent://requester#Intent;scheme=akhoo;package=app.akhoo.help;S.browser_fallback_url=${encodeURIComponent(googleStore)};end`;
  if(/iPhone|iPad|iPod/i.test(userAgent)||(/Macintosh/i.test(userAgent)&&touchPoints>1))return 'akhoo://requester';
  return null;
}
export function setupAppLinks() {
  const dialog=document.querySelector('#open-app-dialog');
  const native=dialog.querySelector('[data-native-app]');
  const href=nativeRequestLink(navigator.userAgent,navigator.maxTouchPoints);
  native.hidden=!href;
  if(href)native.href=href;
  document.querySelectorAll('[data-open-app]').forEach(link=>link.addEventListener('click',event=>{
    if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    event.preventDefault();dialog.showModal();
  }));
}
