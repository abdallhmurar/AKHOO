import {parsePartnerApplication} from '../supabase/functions/_shared/partnerApplication.ts';

export function validateApplication(draft, language) {
  const body={business:draft.business, category:draft.category === '' ? -1 : Number(draft.category), city:draft.city, phone:draft.phone, offer:draft.details || '', language, source:'web'};
  const parsed=parsePartnerApplication(body);
  if(!parsed.ok) return {ok:false,field:parsed.field==='offer'?'details':parsed.field};
  const row=parsed.value;
  return {ok:true,body:{business:row.business_name,category:row.category,city:row.city,phone:row.phone,offer:row.offer,language:row.language,source:'web'}};
}

export async function sendApplication(body, config, signal, fetcher=fetch) {
  try {
    const response=await fetcher(`${config.url}/functions/v1/submit-partner-application`,{
      method:'POST',headers:{'Content-Type':'application/json',apikey:config.key},
      body:JSON.stringify(body),signal,
    });
    const data=await response.json().catch(()=>null);
    if(response.ok && data?.ok===true)return {status:'sent'};
    if(response.status===429)return {status:'limited'};
    if(response.status===400&&data?.code==='invalid')return {status:'invalid',field:data.field==='offer'?'details':data.field};
    return {status:'failed'};
  }catch{return {status:'failed'};}
}
