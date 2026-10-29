import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium,webkit,devices} from 'playwright';

// Uses mocked submissions only; safe against local and live marketing URLs.
const base=process.env.TEST_SITE||'http://127.0.0.1:4180';
const output=new URL('../credentials/site-checks/',import.meta.url).pathname.replace(/^\/(\w:)/,'$1');
await mkdir(output,{recursive:true});
const locales=['ar','en','he'],pages=['','privacy.html','terms.html','delete-account.html','licenses.html'];
for(const lang of locales)for(const name of pages){
  const path=(lang==='ar'?'/':`/${lang}/`)+name;
  const response=await fetch(base+path),html=await response.text();
  assert.equal(response.status,200,path);
  assert.match(html,new RegExp(`<html[^>]*lang="${lang}"`));
  assert.ok(html.includes(`href="https://akhoo.app${path}"`),'canonical '+path);
  assert.ok(!html.includes('noindex'),'indexable '+path);
  assert.match(html,/<h1[^>]*>[^<]+/,'rendered content '+path);
  for(const code of [...locales,'x-default'])assert.ok(html.includes(`hreflang="${code}"`));
  assert.ok(html.includes(`https://akhoo.app/assets/share-${lang}.jpg`));
  assert.ok(!html.includes('127.0.0.1'),'no local origin in HTML');
}
const sitemap=await fetch(base+'/sitemap.xml').then(r=>r.text());
assert.equal((sitemap.match(/<loc>/g)||[]).length,15);
assert.match(await fetch(base+'/robots.txt').then(r=>r.text()),/Allow: \/\nSitemap: https:\/\/akhoo.app\/sitemap.xml/);
console.log('PASS: 15 rendered localized pages, metadata, sitemap and robots');

async function fill(page){
  await page.locator('#business').fill('Website QA');
  await page.locator('#category').selectOption('4');
  await page.locator('#city').fill('Jerusalem');
  await page.locator('#phone').fill('+972 50 123 4567');
  await page.locator('#details').fill('Browser verification only, intercepted before sending.');
}
for(const [engine,type,device] of [['chrome',chromium,devices['Pixel 7']],['webkit',webkit,devices['iPhone 13']]]){
  const browser=await type.launch({headless:true,...(engine==='chrome'?{channel:'chrome'}:{})});
  try{
    const context=await browser.newContext({...device,reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    let submissions=[],status=200,payload={ok:true},hold;
    await context.route('**/functions/v1/submit-partner-application',async route=>{
      if(route.request().method()==='OPTIONS'){await route.fulfill({status:204,headers:{'access-control-allow-origin':'*','access-control-allow-headers':'content-type,apikey'}});return;}
      submissions.push(route.request().postDataJSON());
      if(hold)await hold;
      if(status===0){await route.abort();return;}
      await route.fulfill({status,headers:{'access-control-allow-origin':'*'},contentType:'application/json',body:JSON.stringify(payload)});
    });
    for(const lang of locales){
      await page.setViewportSize({width:320,height:780});
      await page.goto(base+(lang==='ar'?'/':`/${lang}/`),{waitUntil:'networkidle'});
      assert.equal(await page.locator('html').getAttribute('lang'),lang);
      assert.equal(await page.locator('#partner-form').getAttribute('inert'),null);
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),engine+' '+lang+' overflow');
      await page.locator('.rose-help-card').click();
      assert.ok(await page.locator('#open-app-dialog').evaluate(el=>el.open));
      const native=await page.locator('[data-native-app]').getAttribute('href');
      assert.ok(engine==='chrome'?native.startsWith('intent://requester#Intent;'):native==='akhoo://requester');
      assert.equal(await page.locator('#open-app-dialog a[href="https://akhoo.vercel.app/requester"]').count(),1);
      await page.locator('#open-app-dialog [data-close]').click();
      await page.locator('#partner-form button[type=submit]').click();
      assert.equal(await page.locator('#business').getAttribute('aria-invalid'),'true');
      assert.equal(submissions.length,0,'invalid form must not send');
      await fill(page);
      await page.locator('#partner-form button[type=submit]').click();
      assert.equal(submissions.length,0,'review before send');
      assert.ok(await page.locator('#message-draft').inputValue());
      await page.screenshot({path:`${output}/${engine}-${lang}-review.jpg`,type:'jpeg',quality:80});
      await page.locator('#partner-dialog .partner-review [data-close]').click();
    }
    await page.locator('#language').selectOption('en');
    assert.equal(await page.locator('#business').inputValue(),'Website QA');
    assert.equal(new URL(page.url()).pathname,'/en/');
    await page.locator('#partner-form button[type=submit]').click();
    let release;hold=new Promise(resolve=>release=resolve);
    await page.locator('#send-partner').click();
    await page.waitForFunction(()=>document.querySelector('#send-partner').disabled);
    assert.equal(await page.locator('#language').isDisabled(),true);
    await page.keyboard.press('Escape');
    assert.ok(await page.locator('#partner-dialog').evaluate(el=>el.open));
    await page.locator('#send-partner').dispatchEvent('click');
    release();hold=null;
    await page.waitForFunction(()=>!document.querySelector('.partner-success').hidden);
    assert.equal(submissions.length,1,'one submission despite duplicate click');
    assert.deepEqual(submissions[0],{business:'Website QA',category:4,city:'Jerusalem',phone:'+972501234567',offer:'Browser verification only, intercepted before sending.',language:'en',source:'web'});
    assert.equal(await page.locator('#business').inputValue(),'');
    await page.locator('.partner-success [data-close]').click();
    for(const [nextStatus,nextPayload] of [[429,{code:'rate_limited'}],[500,{code:'failed'}],[200,{}],[0,{}]]){
      status=nextStatus;payload=nextPayload;
      await fill(page);await page.locator('#partner-form button[type=submit]').click();
      await page.locator('#send-partner').click();
      await page.waitForFunction(()=>document.querySelector('#partner-status').textContent.length>0);
      assert.equal(await page.locator('.partner-success').isVisible(),false);
      assert.equal(await page.locator('#business').inputValue(),'Website QA');
      await page.locator('#partner-dialog .partner-review [data-close]').click();
    }
    status=400;payload={code:'invalid',field:'phone'};
    await page.locator('#partner-form button[type=submit]').click();await page.locator('#send-partner').click();
    await page.waitForFunction(()=>document.querySelector('#phone').getAttribute('aria-invalid')==='true');
    assert.equal(await page.locator('#partner-dialog').evaluate(el=>el.open),false);
    await page.setViewportSize({width:390,height:844});
    await page.goto(base+'/',{waitUntil:'networkidle'});
    await page.screenshot({path:`${output}/${engine}-mobile.jpg`,type:'jpeg',quality:85});
    assert.ok(await page.evaluate(()=>[...document.querySelectorAll('video')].every(v=>v.paused)));
    assert.deepEqual(errors,[]);
    await context.close();
    console.log(`PASS: ${engine} 320/390px ar/en/he, app links, validation, review, duplicate guard, success, errors, retained data, reduced motion`);
    if(engine==='chrome'){
      const desktop=await browser.newPage({viewport:{width:1440,height:1000}});
      await desktop.goto(base,{waitUntil:'networkidle'});
      assert.ok(await desktop.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      await desktop.locator('.rose-help-card').click();assert.equal(await desktop.locator('[data-native-app]').isVisible(),false);
      await desktop.locator('#open-app-dialog [data-close]').click();
      await desktop.screenshot({path:`${output}/desktop.jpg`,type:'jpeg',quality:85});
      await desktop.close();
      const slow=await browser.newPage({...device});
      await slow.addInitScript(()=>Object.defineProperty(navigator,'connection',{value:{saveData:true,effectiveType:'3g',addEventListener(){},removeEventListener(){}}}));
      await slow.goto(base,{waitUntil:'networkidle'});
      assert.equal(await slow.locator('video[src]').count(),0,'save-data avoids video download');
      assert.equal(await slow.locator('script[src*="gift.js"]').count(),0);
      await slow.close();
      console.log('PASS: desktop app chooser and save-data video fallback');
    }
  }finally{await browser.close();}
}
