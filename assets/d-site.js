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
    // Messages follow the page language, as ui.js does. The button gets back the page's own label after every try,
    // so it always matches the page. English shows the server's error text; a Lithuanian page shows its own message.
    // A Lithuanian page also words the browser's own field warnings; an English page keeps the browser's.
    const label=button.innerHTML, words=document.documentElement.lang==='lt'?{
      short:'Įrašykite vardą ir šiek tiek plačiau aprašykite savo klausimą.',
      sending:'Siunčiama…',
      failed:'Jūsų užklausos išsaugoti nepavyko. Bandykite dar kartą arba rašykite adresu hai@haiseed.ai.',
      delayed:'Užklausą išsaugojome, tačiau pranešimas el. paštu vėluoja. Jei reikia, parašykite mums: hai@haiseed.ai.',
      offline:'Ryšys nutrūko. Bandykite dar kartą: ta pati užklausa du kartus nebus išsaugota. Taip pat galite rašyti adresu hai@haiseed.ai.',
      source:'šaltinis',
      serverText:false,
      invalid:{missing:'Užpildykite šį lauką.',email:'Įrašykite teisingą el. pašto adresą.',short:'Parašykite šiek tiek daugiau.'}
    }:{
      short:'Please add your name and a little more detail about your question.',
      sending:'Sending…',
      failed:'Your request could not be saved. Please try again, or email hai@haiseed.ai.',
      delayed:'Your request is saved. Email notification is delayed; you can also reach us at hai@haiseed.ai.',
      offline:'Connection interrupted. Please try again; the same request will not be added twice. You can also email hai@haiseed.ai.',
      source:'source',
      serverText:true,
      invalid:null
    };
    if(words.invalid)for(const field of form.querySelectorAll('input,textarea')){
      field.addEventListener('invalid',()=>{const v=field.validity;field.setCustomValidity(v.valueMissing?words.invalid.missing:v.typeMismatch?words.invalid.email:v.tooShort?words.invalid.short:'');});
      field.addEventListener('input',()=>field.setCustomValidity(''));
    }
    // A message the visitor must read is brought into view: on a short laptop screen it can sit below the fold.
    const say=text=>{status.textContent=text;status.scrollIntoView({block:'nearest'});};
    // The ad or post that brought the visitor (?s=fb2, kept on internal links below) ends the request as
    // "(source: fb2)" for the owner. Nothing is stored in the browser.
    const tag=new URLSearchParams(location.search).get('s')||'', source=/^[a-z0-9-]{1,24}$/i.test(tag)?tag:'';
    let key=crypto.randomUUID(), sending=false, lastPayload=null;
    form.addEventListener('submit',async e=>{
      e.preventDefault(); if(sending)return;
      if(!form.reportValidity())return;
      const f=new FormData(form), payload=Object.fromEntries(f.entries());
      if(String(payload.name).trim().length<2||String(payload.question).trim().length<10){say(words.short);return;}
      if(source){const note=`\n\n(${words.source}: ${source})`;if(payload.question.length+note.length<=4000)payload.question+=note;}
      const fingerprint=JSON.stringify(payload);if(lastPayload&&lastPayload!==fingerprint)key=crypto.randomUUID();lastPayload=fingerprint;
      sending=true; button.disabled=true; button.textContent=words.sending;status.textContent='';
      try{
        const response=await fetch('https://hai-seed-d-oct30.garsink.chatgpt.site/api/demo-requests',{method:'POST',mode:'cors',credentials:'omit',headers:{'Content-Type':'application/json','Idempotency-Key':key},body:JSON.stringify(payload)});
        const data=await response.json().catch(()=>null);
        if(!response.ok||!data?.ok||!data?.submissionId){say(words.serverText&&typeof data?.error==='string'?data.error:words.failed);return;}
        form.hidden=true;const success=document.getElementById('request-success');document.getElementById('request-reference').textContent=data.submissionId;const delivery=document.getElementById('request-delivery');if(delivery)delivery.textContent=data.notificationStatus==='queued'?'':words.delayed;success.hidden=false;success.focus();
      }catch{say(words.offline);}
      finally{sending=false;button.disabled=false;button.innerHTML=label;}
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

(() => {
  // Lab diagrams on phones are wider than the screen and scroll sideways in their own box: a soft fade marks the side
  // that has more, and the box takes keyboard focus while it can scroll, named by the diagram's title.
  const boxes = document.querySelectorAll('.lab-fig-scroll');
  if (!boxes.length) return;
  const update = box => {
    const room = box.scrollWidth - box.clientWidth;
    box.classList.toggle('has-less', box.scrollLeft > 1);
    box.classList.toggle('has-more', box.scrollLeft < room - 1);
    if (room > 1) box.tabIndex = 0; else box.removeAttribute('tabindex');
  };
  boxes.forEach(box => {
    const svg = box.querySelector('svg[aria-labelledby]');
    if (svg) { box.setAttribute('role', 'group'); box.setAttribute('aria-labelledby', svg.getAttribute('aria-labelledby')); }
    box.addEventListener('scroll', () => update(box), {passive: true});
    update(box);
  });
  let frame = 0;
  addEventListener('resize', () => { if (!frame) frame = requestAnimationFrame(() => { frame = 0; boxes.forEach(update); }); });
})();

(() => {
  // An ad or post link carries a short tag (?s=fb2). The site's own links keep it, so the contact page still knows
  // where the visitor came from when a request is sent. In-page links and other sites are left alone.
  const tag = new URLSearchParams(location.search).get('s');
  if (!tag || !/^[a-z0-9-]{1,24}$/i.test(tag)) return;
  document.querySelectorAll('a[href]').forEach(a => {
    if (a.getAttribute('href').startsWith('#')) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || url.searchParams.has('s')) return;
    url.searchParams.set('s', tag);
    a.href = url.pathname + url.search + url.hash;
  });
})();
