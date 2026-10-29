import {partnerConfig} from './partner-config.js';
import {validateApplication,sendApplication} from './partner-api.js';

export function setupPartnerForm(t,lang,onSent) {
  const form=document.querySelector('#partner-form'),dialog=document.querySelector('#partner-dialog');
  const send=dialog.querySelector('#send-partner'),status=dialog.querySelector('#partner-status'),language=document.querySelector('#language');
  let pending=false,body,controller,disposed=false;
  const showError=field=>{
    const input=form.elements[field];if(!input)return;
    input.setAttribute('aria-invalid','true');
    document.querySelector(`#${field}-error`).textContent=t.form[`${field}Error`]||t.form.required;
    input.focus();
  };
  form.addEventListener('input',event=>{
    const name=event.target.name;if(!name)return;
    event.target.removeAttribute('aria-invalid');document.querySelector(`#${name}-error`).textContent='';
  });
  form.addEventListener('submit',event=>{
    event.preventDefault();if(pending)return;
    const draft=Object.fromEntries(new FormData(form)),result=validateApplication(draft,lang);
    if(!result.ok){showError(result.field);return;}
    body=result.body;
    dialog.querySelector('#partner-title').textContent=t.form.review;
    dialog.querySelector('.partner-review').hidden=false;dialog.querySelector('.partner-success').hidden=true;
    dialog.querySelector('#message-draft').value=[`${t.form.business}: ${body.business}`,`${t.form.category}: ${t.form.categories[body.category]}`,`${t.form.city}: ${body.city}`,`${t.form.phone}: \u2066${body.phone}\u2069`,body.offer?`${t.form.details}: ${body.offer}`:''].filter(Boolean).join('\n');
    status.textContent='';dialog.showModal();
  });
  dialog.addEventListener('cancel',event=>{if(pending)event.preventDefault();});
  send.addEventListener('click',async()=>{
    if(pending||!body)return;
    pending=true;send.disabled=true;send.textContent=t.form.sending;status.textContent='';language.disabled=true;
    dialog.setAttribute('aria-busy','true');dialog.querySelectorAll('[data-close]').forEach(el=>el.disabled=true);
    controller=new AbortController();const timer=setTimeout(()=>controller.abort(),30000);
    const result=await sendApplication(body,partnerConfig,controller.signal);clearTimeout(timer);
    if(disposed)return;
    pending=false;send.disabled=false;send.textContent=t.form.send;language.disabled=false;dialog.removeAttribute('aria-busy');
    dialog.querySelectorAll('[data-close]').forEach(el=>el.disabled=false);
    if(result.status==='sent'){
      form.reset();
      // A language change renders retained entries as default values; reset alone
      // would restore those personal details after a successful submission.
      for(const field of ['business','category','city','phone','details'])form.elements[field].value='';
      onSent();body=null;dialog.querySelector('#message-draft').value='';
      dialog.querySelector('#partner-title').textContent=t.form.sent;
      dialog.querySelector('.partner-review').hidden=true;dialog.querySelector('.partner-success').hidden=false;
      dialog.querySelector('.partner-success [data-close]').focus();
      document.querySelector('#partner-form-result').textContent=t.form.sent+' — '+t.form.sentText;
    }else if(result.status==='invalid'&&form.elements[result.field]){dialog.close();showError(result.field);}
    else status.textContent=t.form[result.status]||t.form.failed;
  });
  return ()=>{disposed=true;controller?.abort();language.disabled=false;};
}
