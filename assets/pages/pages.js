// HAI Seed pages: the team filter on Use cases, the question picker on Book a call, the timeline line on the case
// study, and two homepage scenes: the Seed opening into Root, Kernel and Crown as each is read, and the lab sentence
// lighting up word by word. Every page reads completely without this script.
(() => {
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = v => Math.min(1, Math.max(0, v));

  // Use cases: one team's answers and ideas at a time, kept in the address (#team=sales). With all teams, six ideas
  // show and the rest wait behind one button.
  const filters = [...document.querySelectorAll('.pg-filter')];
  if (filters.length) {
    const count = document.querySelector('.pg-count');
    const ideas = [...document.querySelectorAll('#ideas .pg-idea')];
    const list = document.querySelector('#ideas .pg-ideas');
    let more = null, expanded = false;
    if (list && ideas.length > 6) {
      more = document.createElement('button');
      more.type = 'button';
      more.className = 'pg-more-ideas';
      more.textContent = `Show all ${ideas.length} ideas`;
      more.addEventListener('click', () => { expanded = true; show(current, false); });
      list.after(more);
    }
    const label = team => filters.find(f => f.dataset.filter === team).textContent.trim();
    let current = 'all';
    const show = (team, write) => {
      if (!filters.some(f => f.dataset.filter === team)) team = 'all';
      current = team;
      filters.forEach(f => f.setAttribute('aria-pressed', String(f.dataset.filter === team)));
      let n = 0;
      document.querySelectorAll('.pg-case').forEach(c => {
        c.hidden = !(team === 'all' || c.dataset.team === team);
        if (!c.hidden) n++;
      });
      let shown = 0;
      ideas.forEach(i => {
        const fits = team === 'all' || i.dataset.team === team;
        i.hidden = !fits || (team === 'all' && !expanded && shown >= 6);
        if (fits && !i.hidden) shown++;
      });
      if (more) more.hidden = team !== 'all' || expanded;
      if (count) count.textContent = team === 'all' ? `${n} questions answered in real companies.`
        : `${n} ${n === 1 ? 'question' : 'questions'} answered for ${label(team)}.`;
      if (write) history.replaceState(null, '', team === 'all' ? location.pathname : '#team=' + team);
    };
    const fromAddress = () => (location.hash.match(/^#team=([a-z]+)$/) || [])[1] || 'all';
    filters.forEach(f => f.addEventListener('click', () => show(f.dataset.filter, true)));
    addEventListener('hashchange', () => show(fromAddress(), false));
    show(fromAddress(), false);
  }

  // A link to one answer (#q-...) opens it.
  const openLinked = () => {
    let id; try { id = decodeURIComponent(location.hash.slice(1)); } catch (_) { return; }
    const card = id && document.getElementById(id);
    if (card && card.matches('details.pg-case')) { card.open = true; card.scrollIntoView({block: 'center'}); }
  };
  addEventListener('hashchange', openLinked);
  openLinked();

  // Book a call: a tapped idea, or the visitor's own words, goes into the email draft.
  const builder = document.querySelector('.pg-builder');
  if (builder) {
    const box = builder.querySelector('textarea');
    const send = builder.querySelector('.pg-send');
    const ideas = [...builder.querySelectorAll('.pg-idea')];
    const address = send.getAttribute('href').split('?')[0];
    const update = () => {
      const body = 'Company:\n\nOne question we would like HAI to answer:\n' + box.value.trim() + '\n\nBest times for a short call:\n';
      send.href = address + '?subject=' + encodeURIComponent('A question for HAI Seed') + '&body=' + encodeURIComponent(body);
    };
    ideas.forEach(b => b.addEventListener('click', () => {
      box.value = b.textContent.trim();
      ideas.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      update();
    }));
    box.addEventListener('input', () => { ideas.forEach(x => x.setAttribute('aria-pressed', 'false')); update(); });
    update();
  }

  // Scroll-linked painting, only while the element is near the screen.
  const onScroll = (el, paint) => {
    let raf = 0, near = false;
    const tick = () => { raf = 0; paint(); };
    const ask = () => { if (near && !raf) raf = requestAnimationFrame(tick); };
    new IntersectionObserver(es => { near = es[0].isIntersecting; ask(); }, {rootMargin: '30% 0px'}).observe(el);
    addEventListener('scroll', ask, {passive: true});
    addEventListener('resize', ask);
    paint();
  };

  // Homepage: the part whose heading has passed the middle of the screen comes forward in the opened Seed and is
  // named under it. Before the first heading, the Seed is whole.
  const unfold = document.querySelector('.pg-unfold');
  if (unfold && 'IntersectionObserver' in window) {
    const rows = [...unfold.querySelectorAll('.product-row')];
    const name = unfold.querySelector('.pg-unfold-stage .label');
    const closed = name ? name.textContent : '';
    onScroll(unfold, () => {
      const line = innerHeight * 0.55;
      let active = null;
      rows.forEach(r => { if (r.getBoundingClientRect().top < line) active = r; });
      const key = active ? active.id.replace('hai-', '') : '';
      if ((unfold.dataset.active || '') === key) return;
      if (key) unfold.dataset.active = key; else delete unfold.dataset.active;
      if (name) name.textContent = active ? active.querySelector('h3').textContent : closed;
    });
  }

  // Homepage: the lab sentence is dim, then lights up word by word as it moves up the screen.
  const sentence = document.querySelector('[data-pg-words]');
  if (sentence && !still && 'IntersectionObserver' in window) {
    const parts = sentence.textContent.split(/(\s+)/);
    sentence.textContent = '';
    parts.forEach(t => {
      if (/^\s+$/.test(t) || !t) { sentence.append(t); return; }
      const w = document.createElement('span');
      w.className = 'w';
      w.textContent = t;
      sentence.append(w);
    });
    sentence.classList.add('pg-words');
    const words = [...sentence.querySelectorAll('.w')];
    onScroll(sentence, () => {
      const top = sentence.getBoundingClientRect().top, vh = innerHeight;
      const lit = clamp((vh * 0.88 - top) / (vh * 0.42)) * (words.length + 1);
      words.forEach((w, i) => { w.style.opacity = String(Math.max(0.22, clamp(lit - i))); });
    });
  }

  // Entrances: whole blocks fade in once as they arrive. Whatever is already on screen when this runs stays put, and
  // printing shows everything.
  if ('IntersectionObserver' in window) {
    const blocks = [...document.querySelectorAll(['main .chapter-head', 'main .pg-cta .inner > div:first-child',
      '.pg-grow', '.pg-outcomes', '.pg-sources', '.pg-parts', '.pg-plant', '.pg-folds', '.pg-feature', '.pg-cases',
      '.pg-timeline', '.pg-plans', '.pg-two', '.pg-callers', '.pg-teams', '.pg-topics', '.pg-cta .pg-duo'].join(','))];
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    }), {rootMargin: '0px 0px -6% 0px'});
    blocks.forEach(el => {
      el.classList.add('rv');
      if (el.getBoundingClientRect().top < innerHeight) el.classList.add('is-in', 'was-in');
      else io.observe(el);
    });
    document.documentElement.classList.add('js-reveal');
    addEventListener('beforeprint', () => blocks.forEach(el => el.classList.add('is-in', 'was-in')));
  }

  // Case study: the timeline's line draws as the timeline is read.
  if (!still && 'IntersectionObserver' in window) {
    document.querySelectorAll('.pg-timeline').forEach(line => onScroll(line, () => {
      const r = line.getBoundingClientRect(), vh = innerHeight;
      line.style.setProperty('--drawn', clamp((vh * 0.82 - r.top) / (r.height + vh * 0.2)).toFixed(3));
    }));
  }
})();
