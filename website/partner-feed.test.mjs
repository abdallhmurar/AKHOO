import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizePartners,fetchWebsitePartners} from './partner-feed.js';

test('only display fields and HTTPS images reach the renderer',()=>{
  const result=normalizePartners([
    {id:'a',name:'A',image:'https://example.com/logo.png',phone:'private',caption:{ar:' اسم ',en:'Name',he:'שם',internal:'private'}},
    {id:'b',name:'B',image:'javascript:alert(1)'},null,
  ]);
  assert.deepEqual(result,[{id:'a',name:'A',image:'https://example.com/logo.png',caption:{ar:'اسم',en:'Name',he:'שם'}}]);
});
test('empty selection stays empty; failures never restore a static list',async()=>{
  const config={url:'https://example.supabase.co',key:'public-key'};
  const empty=await fetchWebsitePartners(config,undefined,async(url,options)=>{
    assert.equal(url,'https://example.supabase.co/rest/v1/rpc/get_website_partners');
    assert.equal(options.cache,'no-store');assert.equal(options.credentials,'omit');
    assert.equal(options.headers.apikey,'public-key');
    return {ok:true,json:async()=>[]};
  });
  assert.deepEqual(empty,[]);
  await assert.rejects(fetchWebsitePartners(config,undefined,async()=>({ok:false})),/unavailable/);
  assert.throws(()=>normalizePartners({error:'not a list'}),/Invalid/);
});
