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
        form.hidden=true;const success=document.getElementById('request-success');document.getElementById('request-reference').textContent=data.submissionId;const delivery=document.getElementById('request-delivery');if(delivery)delivery.textContent=data.notificationStatus==='queued'?'':"Your request is saved. Email notification is delayed; you can also reach us at hai@haiseed.ai.";success.hidden=false;success.focus();
      }catch{status.textContent='Connection interrupted. Please try again; the same request will not be added twice. You can also email hai@haiseed.ai.';}
      finally{sending=false;button.disabled=false;button.innerHTML='Request a demo <span aria-hidden="true">→</span>';}
    });
  }})();

(() => {
  // Header fold (owner 2026-11-01): past the first 80 px the links fade away, the logo pill closes to the mark and the
  // logo and buttons move to the edges; wide screens then show the menu button. Near the top it unfolds again.
  const head = document.querySelector('.site-header');
  const nav = head && head.querySelector('.nav'), identity = head && head.querySelector('.identity');
  const actions = head && head.querySelector('.nav-actions'), toggle = head && head.querySelector('.nav-toggle');
  if (!nav || !identity || !actions || !toggle || !document.body.classList.contains('d-site')) return;
  head.classList.add('has-fold');
  // Without the matching stylesheet the fold would only hide the links, so it stays off.
  if (!getComputedStyle(head).getPropertyValue('--fold-move')) { head.classList.remove('has-fold'); return; }
  const links = head.querySelector('.nav-shortcuts');
  let folded = false, open = head.classList.contains('is-open'), frame = 0, sized = 0;
  // Layout positions ignore the fold's own transforms, so a measurement taken mid-transition is still exact.
  const leftOf = el => { const p = el.offsetParent; return p.getBoundingClientRect().left + p.clientLeft + el.offsetLeft; };
  const measure = () => {
    if (open) return;
    const n = nav.getBoundingClientRect(), s = getComputedStyle(nav), t = getComputedStyle(toggle);
    let end = leftOf(actions) + actions.offsetWidth;
    if (t.position === 'absolute') end += parseFloat(t.marginLeft) + toggle.offsetWidth;
    identity.style.setProperty('--fold-x', Math.round(n.left + parseFloat(s.paddingLeft) - leftOf(identity)) + 'px');
    actions.style.setProperty('--fold-x', Math.round(n.right - parseFloat(s.paddingRight) - end) + 'px');
  };
  const paint = () => {
    frame = 0;
    if (open) return;
    const next = links && links.contains(document.activeElement) ? false : scrollY > (folded ? 40 : 80);
    if (next === folded) return;
    folded = next;
    head.classList.toggle('is-folded', folded);
    if (links) links.inert = folded;
  };
  const ask = () => { if (!frame) frame = requestAnimationFrame(paint); };
  // No transition on the first paint, nor when the menu panel opens or closes.
  const instant = () => {
    head.classList.add('fold-instant');
    requestAnimationFrame(() => requestAnimationFrame(() => head.classList.remove('fold-instant')));
  };
  new MutationObserver(() => {
    const next = head.classList.contains('is-open');
    if (next === open) return;
    open = next;
    instant();
    if (!open) { measure(); paint(); }
  }).observe(head, {attributes: true, attributeFilter: ['class']});
  instant();
  measure();
  paint();
  addEventListener('scroll', ask, {passive: true});
  addEventListener('resize', () => { if (!sized) sized = requestAnimationFrame(() => { sized = 0; measure(); paint(); }); });
  head.addEventListener('focusin', ask);
  head.addEventListener('focusout', ask);
  if (document.fonts) document.fonts.ready.then(measure);
})();
