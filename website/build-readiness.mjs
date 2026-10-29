import {readFile,writeFile,readdir,mkdir,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {createServer} from 'node:http';
import {chromium} from 'playwright';
import {content} from './content.js';
import {journeyCopy} from './journey-copy.js';
import {readinessCopy} from './readiness-copy.js';
import {siteOrigin,pagePath,metadata,languageCodes,legalPages} from './seo.js';

const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const structured=JSON.stringify({'@context':'https://schema.org','@type':'WebSite',name:'AKHOO — أخوو',url:siteOrigin,inLanguage:languageCodes}).replace(/</g,'\\u003c');
function head(lang,page='') {
  const m=metadata(lang,page);
  return `<meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${m.url}">
${[...languageCodes,'x-default'].map(code=>`<link rel="alternate" hreflang="${code}" href="${siteOrigin+pagePath(code==='x-default'?'ar':code,page)}">`).join('\n')}
<meta property="og:type" content="website"><meta property="og:site_name" content="AKHOO"><meta property="og:title" content="${escape(m.title)}"><meta property="og:description" content="${escape(m.description)}"><meta property="og:url" content="${m.url}"><meta property="og:locale" content="${m.locale}"><meta property="og:image" content="${m.image}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:type" content="image/jpeg"><meta property="og:image:alt" content="${escape(content[lang].brand+' — '+content[lang].description)}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(m.title)}"><meta name="twitter:description" content="${escape(m.description)}"><meta name="twitter:image" content="${m.image}"><script type="application/ld+json">${structured}</script>`;
}
function fallback(lang,page,legal) {
  const t=content[lang];
  if(page==='privacy'||page==='terms')return `<main id="main" class="site-fallback"><h1>${escape(t[page])}</h1>${(page==='privacy'?[{type:'p',text:readinessCopy[lang].privacyPartner},...legal[page][lang]]:legal[page][lang]).map(block=>block.type==='ul'?`<ul>${block.items.map(text=>`<li>${escape(text)}</li>`).join('')}</ul>`:`<${block.type}>${escape(block.text)}</${block.type}>`).join('')}</main>`;
  if(page)return `<main id="main" class="site-fallback"><h1>${escape(page==='delete-account'?t.deletion:t[page])}</h1><p>${escape(page==='delete-account'?t.deleteIntro:t.licensesIntro)}</p><a href="${pagePath(lang)}">${escape(t.back)}</a></main>`;
  return `<main id="main" class="site-fallback"><nav>${languageCodes.map(code=>`<a href="${pagePath(code)}" hreflang="${code}">${code.toUpperCase()}</a>`).join('')}</nav><h1>${escape(t.title)}</h1><p>${escape(t.description)}</p><nav><a href="https://akhoo.vercel.app/requester">${escape(readinessCopy[lang].openApp)}</a><a href="https://apps.apple.com/app/id6809610412">${escape(t.apple)}</a><a href="https://play.google.com/store/apps/details?id=app.akhoo.help">${escape(t.android)}</a></nav><section><h2>${escape(t.howTitle)}</h2>${t.needSteps.map(([title,body])=>`<h3>${escape(title)}</h3><p>${escape(body)}</p>`).join('')}</section><section><h2>${escape(t.partnerTitle+' '+t.partnerAccent)}</h2><p>${escape(t.partnerText)}</p><a href="https://wa.me/972509956406">${escape(t.whatsapp)}</a></section><section><h2>${escape(t.faqTitle)}</h2>${t.faqs.map(([q,a])=>`<h3>${escape(q)}</h3><p>${escape(a)}</p>`).join('')}</section><nav>${legalPages.map(name=>`<a href="${pagePath(lang,name)}">${escape(name==='delete-account'?t.deletion:t[name])}</a>`).join('')}</nav></main>`;
}
function socialHtml(lang) {
  const c=journeyCopy[lang],rtl=lang!=='en';
  return `<!doctype html><html lang="${lang}" dir="${rtl?'rtl':'ltr'}"><head><meta charset="utf-8"><link rel="stylesheet" href="/site.css"><style>html,body{margin:0;width:1200px;height:630px;overflow:hidden}body{background:linear-gradient(120deg,#e8f6ff,#fff 65%,#e4f8f4);color:#0b253e}.share{position:relative;width:1200px;height:630px;padding:60px}.brand{display:flex;align-items:center;gap:18px;font-size:31px;font-weight:800}.brand img{width:94px;height:94px;border-radius:23px;background:#fff}.copy{position:absolute;right:60px;top:208px;width:550px;text-align:right}.copy h1{font-size:67px;line-height:1.3;margin:0;font-weight:800;letter-spacing:0}.copy h1 span{color:#087e91}.copy p{font-size:27px;line-height:1.6;color:#47677d;margin-top:24px}.art{position:absolute;left:48px;top:249px;width:480px;height:240px;object-fit:cover;border-radius:30px;box-shadow:0 20px 50px #0b52791a}.address{position:absolute;bottom:45px;left:60px;font:700 25px Inter,sans-serif;color:#087e91}html[lang=en] .copy{text-align:left}html[lang=en] .copy h1,html[lang=he] .copy h1{font-size:59px}</style></head><body><div class="share"><div class="brand"><img src="/assets/brand.webp" alt=""><span>${escape(content[lang].brand)}</span></div><div class="copy"><h1>${escape(c.title)}<br><span>${escape(c.accent)}</span></h1><p>${escape(content[lang].eyebrow)}</p></div><img class="art" src="/assets/help-rose.jpg" alt=""><span class="address">akhoo.app</span></div></body></html>`;
}

export async function buildReadiness(out,template) {
  const legal=JSON.parse(await readFile(resolve(out,'legal.json'),'utf8'));
  for(const lang of languageCodes)for(const page of ['',...legalPages]){
    const m=metadata(lang,page),path=pagePath(lang,page),file=resolve(out,'.'+path+(path.endsWith('/')?'index.html':''));
    await mkdir(resolve(file,'..'),{recursive:true});
    let html=template.replace('<html lang="ar" dir="rtl">',`<html lang="${lang}" dir="${lang==='en'?'ltr':'rtl'}">`)
      .replace(/<title>.*?<\/title>/,`<title>${escape(m.title)}</title>`)
      .replace(/<meta name="description"[^>]+>/,`<meta name="description" content="${escape(m.description)}">`)
      .replace(/<meta name="robots"[^>]+>/,head(lang,page))
      .replace(/<noscript>.*?<\/noscript>/,`<noscript>${escape({ar:'شغّل JavaScript عشان تستخدم نموذج الشراكة والشرح التفاعلي. بتقدر كمان تحكينا عالواتساب من رابط التواصل.',en:'Enable JavaScript to use the partnership form and interactive demo. You can also contact us using the WhatsApp link.',he:'הפעילו JavaScript כדי להשתמש בטופס השותפות ובהדגמה. אפשר גם לפנות אלינו בקישור לוואטסאפ.'}[lang])}</noscript>`)
      .replace('<div id="site"></div>',`<div id="site">${fallback(lang,page,legal)}</div>`);
    await writeFile(file,html);
  }
  await writeFile(resolve(out,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${siteOrigin}/sitemap.xml\n`);
  await writeFile(resolve(out,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${['',...legalPages].flatMap(page=>languageCodes.map(lang=>`<url><loc>${siteOrigin+pagePath(lang,page)}</loc>${[...languageCodes,'x-default'].map(code=>`<xhtml:link rel="alternate" hreflang="${code}" href="${siteOrigin+pagePath(code==='x-default'?'ar':code,page)}"/>`).join('')}</url>`)).join('')}</urlset>`);
  const redirects=['en','he'].flatMap(lang=>['',...legalPages].map(page=>({source:pagePath('ar',page),has:[{type:'query',key:'lang',value:lang}],destination:pagePath(lang,page),permanent:true})));
  await writeFile(resolve(out,'vercel.json'),JSON.stringify({trailingSlash:true,redirects,headers:[{source:'/assets/(.*)',headers:[{key:'Cache-Control',value:'public, max-age=3600, must-revalidate'}]}]},null,2));
  const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2','.ttf':'font/ttf','.json':'application/json'};
  const server=createServer(async(req,res)=>{
    try{const path=new URL(req.url,'http://localhost').pathname,file=resolve(out,'.'+path+(path.endsWith('/')?'index.html':''));if(!file.startsWith(out+sep))throw Error();const bytes=await readFile(file);res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'});res.end(bytes);}catch{res.writeHead(404);res.end();}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  let browser;
  try{
    browser=await chromium.launch({channel:process.platform==='win32'?'chrome':undefined,headless:true});
    const page=await browser.newPage({viewport:{width:1200,height:630},reducedMotion:'reduce'});
    // Optimize derived website copies only. Original app assets remain untouched.
    await page.goto(base+'/assets/brand.png');
    let original=0,optimized=0;
    for(const file of (await readdir(resolve(out,'assets'))).filter(name=>name.endsWith('.png')&&name!=='favicon.png')){
      const target=resolve(out,'assets',file.replace(/\.png$/,'.webp'));
      const encoded=await page.evaluate(async url=>{
        const blob=await fetch(url).then(r=>r.blob()),image=await createImageBitmap(blob),scale=Math.min(1,900/image.width);
        const canvas=document.createElement('canvas');canvas.width=Math.round(image.width*scale);canvas.height=Math.round(image.height*scale);canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);image.close();return canvas.toDataURL('image/webp',.82).split(',')[1];
      },base+'/assets/'+file);
      const bytes=Buffer.from(encoded,'base64');await writeFile(target,bytes);original+=(await stat(resolve(out,'assets',file))).size;optimized+=bytes.length;
    }
    const favicon=await page.evaluate(async()=>{
      const image=await createImageBitmap(await fetch('/assets/brand.png').then(r=>r.blob()));
      const canvas=document.createElement('canvas');canvas.width=48;canvas.height=48;
      canvas.getContext('2d').drawImage(image,0,0,48,48);image.close();return canvas.toDataURL('image/png').split(',')[1];
    });
    await writeFile(resolve(out,'assets/favicon.png'),Buffer.from(favicon,'base64'));
    for(const lang of languageCodes){
      await page.goto(base+pagePath(lang));
      await page.setContent(socialHtml(lang));await page.evaluate(()=>document.fonts.ready);
      await page.locator('.brand img').evaluate(img=>img.decode());await page.locator('.art').evaluate(img=>img.decode());
      await page.screenshot({path:resolve(out,'assets',`share-${lang}.jpg`),type:'jpeg',quality:88});
    }
    // Serve real, localized page content to crawlers and clients before JavaScript runs.
    await page.route('**/rest/v1/rpc/get_website_partners',route=>route.fulfill({contentType:'application/json',body:'[]'}));
    for(const lang of languageCodes)for(const name of ['',...legalPages]){
      const path=pagePath(lang,name),file=resolve(out,'.'+path+(path.endsWith('/')?'index.html':''));
      const errors=[];const listener=error=>errors.push(error.message);page.on('pageerror',listener);
      await page.goto(base+path,{waitUntil:'networkidle'});
      await page.waitForSelector('.header');if(name)await page.waitForSelector('#legal-body[aria-busy="false"]');
      if(errors.length)throw Error('Prerender failed: '+errors.join('; '));
      await page.evaluate(()=>{document.querySelectorAll('video').forEach(v=>{v.pause();v.removeAttribute('src');});document.querySelector('#partner-form')?.setAttribute('inert','');document.querySelectorAll('[data-native-app]').forEach(a=>{a.hidden=true;});});
      await writeFile(file,await page.content());page.off('pageerror',listener);
    }
    console.log(`SEO: 15 localized HTML pages; 3 sharing images. Website PNG derivatives: ${original} -> ${optimized} bytes (WebP).`);
  }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
}
