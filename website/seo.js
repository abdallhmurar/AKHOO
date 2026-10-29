import {content} from './content.js';
export const siteOrigin='https://akhoo.app';
export const languageCodes=['ar','en','he'];
export const legalPages=['privacy','terms','delete-account','licenses'];
export function pagePath(lang='ar',page='') {
  return `${lang==='ar'?'/':`/${lang}/`}${page?`${page}.html`:''}`;
}
export function metadata(lang,page='') {
  const t=content[lang],name=page==='delete-account'?t.deletion:t[page];
  return {title:page?`${name} · ${t.brand}`:t.title,description:t.description,url:siteOrigin+pagePath(lang,page),image:`${siteOrigin}/assets/share-${lang}.jpg`,locale:{ar:'ar_IL',en:'en_US',he:'he_IL'}[lang]};
}
export function updateMetadata(lang,page='') {
  const meta=metadata(lang,page);
  document.title=meta.title;
  for(const [selector,value] of Object.entries({'meta[name="description"]':meta.description,'meta[property="og:title"]':meta.title,'meta[property="og:description"]':meta.description,'meta[property="og:url"]':meta.url,'meta[property="og:image"]':meta.image,'meta[property="og:locale"]':meta.locale,'meta[name="twitter:title"]':meta.title,'meta[name="twitter:description"]':meta.description,'meta[name="twitter:image"]':meta.image}))document.querySelector(selector)?.setAttribute('content',value);
  document.querySelector('link[rel="canonical"]')?.setAttribute('href',meta.url);
  document.querySelector('meta[property="og:image:alt"]')?.setAttribute('content',content[lang].brand+' — '+content[lang].description);
  document.querySelectorAll('link[hreflang]').forEach(link=>{link.href=siteOrigin+pagePath(link.hreflang==='x-default'?'ar':link.hreflang,page);});
}
