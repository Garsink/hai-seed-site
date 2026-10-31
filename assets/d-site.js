(() => {
  // Deliberate route changes begin at the top; explicit story anchors are preserved.
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  const path = location.pathname.replace(/index\.html$/, '').replace(/\/$/,'') || '/';
  document.querySelectorAll('.nav-shortcuts a,.nav-menu-links a').forEach(a => {
    if (new URL(a.href).pathname.replace(/\/$/,'') === path) a.setAttribute('aria-current','page');
  });
  // Form success is shown only after the durable server receipt has arrived.
  const form=document.getElementById('demo-request');
  if(form){
    const status=document.getElementById('request-status'), button=form.querySelector('button[type=submit]');
    let key=crypto.randomUUID(), sending=false, lastPayload=null;
    form.addEventListener('submit',async e=>{
      e.preventDefault(); if(sending)return;
      if(!form.reportValidity())return;
      const f=new FormData(form), payload=Object.fromEntries(f.entries());
      if(String(payload.name).trim().length<2||String(payload.question).trim().length<10){status.textContent='Please add your name and a little more detail about your question.';return;}
      const fingerprint=JSON.stringify(payload);if(lastPayload&&lastPayload!==fingerprint)key=crypto.randomUUID();lastPayload=fingerprint;
      sending=true; button.disabled=true; button.textContent='Sending…';status.textContent='';
      try{
        const response=await fetch('https://hai-seed-d-oct30.garsink.chatgpt.site/api/demo-requests',{method:'POST',mode:'cors',credentials:'omit',headers:{'Content-Type':'application/json','Idempotency-Key':key},body:JSON.stringify(payload)});
        const data=await response.json().catch(()=>null);
        if(!response.ok||!data?.ok||!data?.submissionId){status.textContent=typeof data?.error==='string'?data.error:'Your request could not be saved. Please try again, or email hai@haiseed.ai.';return;}
        form.hidden=true;const success=document.getElementById('request-success');document.getElementById('request-reference').textContent=data.submissionId;success.hidden=false;success.focus();
      }catch{status.textContent='Connection interrupted. Please try again; the same request will not be added twice. You can also email hai@haiseed.ai.';}
      finally{sending=false;button.disabled=false;button.innerHTML='Request a demo <span aria-hidden="true">→</span>';}
    });
  }})();
