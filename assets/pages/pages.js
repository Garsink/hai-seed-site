// HAI Seed pages: the team filter on Use cases, the question picker on Book a call, the timeline line on the case
// study, the slowly turning belts of cards, the floating header, and the homepage Seed opening into Root, Kernel and
// Crown as each is read. Every page reads completely without this script.
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
      document.querySelectorAll('.pg-morning').forEach(n => { n.hidden = team !== 'all'; });   // it counts all nine
      if (count) count.textContent = team === 'all' ? `${n} questions answered in real companies.`
        : `${n} ${n === 1 ? 'question' : 'questions'} answered for ${label(team)}.`;
      if (write) history.replaceState(null, '', team === 'all' ? location.pathname : '#team=' + team);
    };
    // older links name a team as #team-sales, and some teams by older names; both open today's filter
    const older = {procurement: 'operations', hr: 'people', legal: 'leadership'};
    const fromAddress = () => {
      const m = location.hash.match(/^#team[=-]([a-z]+)$/);
      return m ? older[m[1]] || m[1] : 'all';
    };
    filters.forEach(f => f.addEventListener('click', () => show(f.dataset.filter, true)));
    const follow = () => show(fromAddress(), /^#team-/.test(location.hash));   // an older form is rewritten to today's
    addEventListener('hashchange', follow);
    follow();
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

  // Homepage: real questions one at a time. Arrows, a swipe or a tap on a neighbour move to another question; the
  // text never moves on its own.
  document.querySelectorAll('.pg-carousel').forEach(box => {
    const track = box.querySelector('.pg-track');
    const slides = [...track.querySelectorAll('.pg-slide')];
    const nav = box.querySelector('.pg-carousel-nav');
    const prev = box.querySelector('.pg-prev'), next = box.querySelector('.pg-next'), pos = box.querySelector('.pg-pos');
    let current = 0, raf = 0;
    const mark = () => {
      raf = 0;
      const mid = track.getBoundingClientRect().left + track.clientWidth / 2;
      let best = 0, dist = Infinity;
      slides.forEach((s, i) => { const r = s.getBoundingClientRect(); const d = Math.abs(r.left + r.width / 2 - mid); if (d < dist) { dist = d; best = i; } });
      current = best;
      slides.forEach((s, i) => s.classList.toggle('is-current', i === best));
      if (pos) pos.textContent = `${best + 1} / ${slides.length}`;
      if (prev) prev.disabled = best === 0;
      if (next) next.disabled = best === slides.length - 1;
    };
    const go = i => {
      const s = slides[Math.max(0, Math.min(slides.length - 1, i))];
      track.scrollTo({left: s.offsetLeft - (track.clientWidth - s.clientWidth) / 2, behavior: still ? 'auto' : 'smooth'});
    };
    if (prev) prev.addEventListener('click', () => go(current - 1));
    if (next) next.addEventListener('click', () => go(current + 1));
    slides.forEach((s, i) => s.addEventListener('click', e => { if (i !== current && !e.target.closest('a, summary, button')) go(i); }));
    track.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(mark); }, {passive: true});
    addEventListener('resize', mark);
    box.classList.add('js-carousel');
    if (nav) nav.hidden = false;
    mark();
  });

  // Belts: cards on a gentle curve that turn slowly on their own, like a carousel (owner, after tryholo.ai). A belt
  // moves only while it is on screen and nobody is pointing at it, using the keyboard in it or reading from it; it has
  // previous, pause and next controls, and it stands still for reduced motion. Phones get a plain swipe row. A numbered
  // sequence does not loop: its cards keep their order and the curve sways gently instead. The list keeps its order for
  // screen readers; the copies that close a loop are hidden from them and from the keyboard, but open like the original.
  const flatScreen = matchMedia('(max-width: 1023px)');
  const easeOut = t => 1 - Math.pow(1 - t, 5);         // close to the site's own ease-out curve
  const byKeyboard = el => { try { return el.matches(':focus-visible'); } catch (_) { return false; } };
  const belt = (list, label, {loops = true} = {}) => {
    const own = [...list.children];
    const view = document.createElement('div');
    view.className = 'belt-view';
    list.before(view);
    view.append(list);
    list.classList.add('belt-track');
    const bar = document.createElement('div');
    bar.className = 'belt-controls';
    const control = (cls, name, glyph) => {
      const c = document.createElement('button');
      c.type = 'button';
      c.className = cls;
      c.setAttribute('aria-label', name);
      if (glyph) c.innerHTML = `<span aria-hidden="true">${glyph}</span>`;
      bar.append(c);
      return c;
    };
    const prev = loops ? control('belt-prev', `Previous ${label}`, '←') : null;
    const toggle = control('belt-pause', `Pause the moving ${label}`);
    const next = loops ? control('belt-next', `Next ${label}`, '→') : null;
    toggle.setAttribute('aria-pressed', 'false');
    view.after(bar);
    if (loops) for (let r = Math.max(1, Math.ceil(10 / own.length) - 1); r > 0; r--) own.forEach(el => {
      const c = el.cloneNode(true);
      c.classList.add('belt-copy');
      c.setAttribute('aria-hidden', 'true');
      c.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
      c.querySelectorAll('a, button').forEach(n => { n.tabIndex = -1; });
      list.append(c);
    });
    const all = [...list.children];
    const speed = 26;                                   // pixels a second: slow enough to read a card as it passes
    let offset = 0, phase = 0, last = 0, raf = 0, glideRaf = 0, step = 320, span = 1, radius = 1400;
    let flat = true, visible = false, pointer = false, keyboard = false, paused = false, held = false;
    const xOf = k => {
      if (!loops) return (k - (own.length - 1) / 2) * step - offset;
      const x = ((k * step - offset) % span + span) % span;
      return x > span / 2 ? x - span : x;
    };
    const place = () => all.forEach((el, k) => {
      const a = xOf(k) / radius;
      el.style.transform = `translate3d(${(radius * Math.sin(a)).toFixed(1)}px,0,${(radius * (Math.cos(a) - 1)).toFixed(1)}px) rotateY(${(a * 57.2958).toFixed(2)}deg)`;
    });
    const running = () => !flat && visible && !pointer && !keyboard && !paused && !held && !document.hidden;
    const tick = now => {
      raf = 0;
      if (!running()) return;
      const dt = last ? Math.min(64, now - last) : 0;
      last = now;
      if (loops) offset += dt * speed / 1000;
      else { phase += dt / 16000 * 2 * Math.PI; offset = step * 0.3 * Math.sin(phase); }   // a sixteen-second sway
      place();
      raf = requestAnimationFrame(tick);
    };
    const go = () => { if (running() && !raf) { last = 0; raf = requestAnimationFrame(tick); } };
    const setPaused = on => {
      paused = on;
      toggle.setAttribute('aria-pressed', String(on));
      toggle.setAttribute('aria-label', `${on ? 'Play' : 'Pause'} the moving ${label}`);
      go();
    };
    const measure = () => {
      flat = flatScreen.matches || still;
      view.classList.toggle('belt-flat', flat);
      toggle.hidden = flat;                             // a still row has nothing to pause
      bar.hidden = flat && !loops;
      all.forEach(el => { el.style.minHeight = ''; });
      if (flat) { list.style.height = ''; all.forEach(el => { el.style.transform = ''; }); return; }
      step = own[0].offsetWidth + 28;
      span = step * all.length;
      radius = Math.max(1200, view.clientWidth * 1.1);
      const tallest = Math.max(...own.map(el => el.offsetHeight));
      all.forEach(el => { el.style.minHeight = tallest + 'px'; });   // every card on a belt stands the same height
      list.style.height = tallest + 'px';
      place();
      go();
    };
    // previous and next: one card at a time, and the drift stops until Play. A click glides; a key press moves at once.
    let aim = 0;
    const move = (dir, instant) => {
      if (flat) { list.scrollBy({left: dir * (own[0].offsetWidth + 14), behavior: still || instant ? 'auto' : 'smooth'}); return; }
      setPaused(true);
      const base = glideRaf ? aim : offset;             // a second press during a glide goes one card further
      cancelAnimationFrame(glideRaf);
      glideRaf = 0;
      aim = (dir > 0 ? Math.floor(base / step + 1e-6) + 1 : Math.ceil(base / step - 1e-6) - 1) * step;
      if (instant) { offset = aim; place(); return; }
      const from = offset, to = aim, t0 = performance.now();
      const glide = now => {
        const p = Math.min(1, (now - t0) / 240);
        offset = from + (to - from) * easeOut(p);
        place();
        glideRaf = p < 1 ? requestAnimationFrame(glide) : 0;
      };
      glideRaf = requestAnimationFrame(glide);
    };
    if (prev) prev.addEventListener('click', e => move(-1, e.detail === 0));
    if (next) next.addEventListener('click', e => move(1, e.detail === 0));
    toggle.addEventListener('click', () => setPaused(!paused));
    view.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') pointer = true; });
    view.addEventListener('pointerleave', () => { pointer = false; go(); });
    // a card reached with the keyboard comes to the front and the belt waits; a mouse press never moves its card
    list.addEventListener('focusin', e => {
      if (!byKeyboard(e.target)) return;
      keyboard = true;
      const i = own.findIndex(el => el.contains(e.target));
      if (i >= 0 && !flat && loops) { offset = i * step; place(); }
    });
    list.addEventListener('focusout', () => { keyboard = false; go(); });
    new IntersectionObserver(es => { visible = es[0].isIntersecting; go(); }).observe(view);
    document.addEventListener('visibilitychange', go);
    flatScreen.addEventListener('change', measure);
    addEventListener('resize', measure);
    if (document.fonts) document.fonts.ready.then(measure);
    measure();
    return {hold: on => { held = on; go(); }};
  };

  // Homepage: the six cases. Each article becomes a card on the belt; the full case opens in a reader.
  const cases = document.querySelector('[data-cases]');
  if (cases) {
    const arts = [...cases.querySelectorAll('.sc-card')];
    const tiles = document.createElement('ul');
    tiles.className = 'sc-tiles';
    arts.forEach(art => {
      const li = document.createElement('li');
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'sc-tile';
      card.dataset.case = art.id;
      card.innerHTML = '<span class="sc-tile-top"><img width="16" height="22" alt=""><span></span></span>'
        + '<span class="sc-tile-ask"></span><span class="sc-tile-head"></span><span class="sc-tile-doc" aria-hidden="true"></span>'
        + '<span class="sc-tile-foot"><span class="sc-tile-src"></span><span class="sc-tile-open">Open <span aria-hidden="true">→</span></span></span>';
      const text = sel => art.querySelector(sel).textContent.trim().replace(/^The owner asks:\s*/, '');
      // the mark comes from the article, so its address is always the page's own
      card.querySelector('.sc-tile-top img').src = art.querySelector('.sc-by img').src;
      card.querySelector('.sc-tile-top span').textContent = text('.sc-name');
      card.querySelector('.sc-tile-ask').textContent = text('.sc-ask');
      card.querySelector('.sc-tile-head').textContent = text('.sc-head');
      card.querySelector('.sc-tile-src').textContent = text('.sc-src');
      const sheet = art.querySelector('.sc-sheet').cloneNode(true);
      sheet.querySelectorAll('a').forEach(x => x.remove());
      card.querySelector('.sc-tile-doc').append(sheet);
      li.append(card);
      tiles.append(li);
    });
    const reader = document.createElement('dialog');
    reader.className = 'sc-reader';
    reader.innerHTML = '<button type="button" class="sc-reader-close" aria-label="Close"><span aria-hidden="true">×</span></button>';
    cases.before(tiles);
    reader.append(...arts);
    cases.replaceWith(reader);
    const moving = belt(tiles, 'cases');

    // Replay inside the reader: the sources tick off, then the answer, the decision and the document arrive in turn.
    // A new replay, or closing the reader, cancels the one before.
    const replays = new Map();
    const stopReplay = c => {
      (replays.get(c) || []).forEach(clearTimeout);
      replays.delete(c);
      c.classList.remove('is-replay');
    };
    reader.querySelectorAll('.sc-replay').forEach(b => {
      if (still) return;
      b.hidden = false;
      b.addEventListener('click', () => {
        const c = b.closest('.sc-card');
        stopReplay(c);
        const lis = [...c.querySelectorAll('.sc-sources li')], beats = [...c.querySelectorAll('[data-beat]')];
        lis.forEach(l => l.classList.remove('is-done'));
        beats.forEach(x => x.classList.remove('is-shown'));
        c.classList.add('is-replay');
        const later = (fn, ms) => replays.get(c).push(setTimeout(fn, ms));
        replays.set(c, []);
        lis.forEach((l, k) => later(() => l.classList.add('is-done'), 250 + 200 * k));
        const t = 250 + 200 * lis.length + 150;
        beats.forEach((x, k) => later(() => x.classList.add('is-shown'), t + 450 * k));
        later(() => stopReplay(c), t + 450 * beats.length + 300);
      });
    });

    // the reader: a click opens and closes it in a short fade; a key press (Enter, Space, Escape) does it at once
    let opener = null, closing = 0;
    const open = (id, instant) => {
      // focus comes back to the case's own card, never to a copy that screen readers cannot see
      opener = tiles.querySelector(`li:not(.belt-copy) [data-case="${id}"]`);
      arts.forEach(art => { art.hidden = art.id !== id; });
      reader.setAttribute('aria-labelledby', id + '-n');
      reader.classList.toggle('is-instant', instant || still);
      clearTimeout(closing);
      if (!reader.open) reader.showModal();
      reader.scrollTop = 0;
      moving.hold(true);
      requestAnimationFrame(() => reader.classList.add('is-open'));
    };
    const close = instant => {
      if (instant) reader.classList.add('is-instant');
      reader.classList.remove('is-open');
      clearTimeout(closing);
      closing = setTimeout(() => reader.close(), reader.classList.contains('is-instant') ? 0 : 220);
    };
    reader.addEventListener('close', () => {           // also when the browser closes it without asking (a second Escape)
      clearTimeout(closing);
      reader.classList.remove('is-open');
      arts.forEach(stopReplay);
      moving.hold(false);
      if (opener) opener.focus({preventScroll: true});
    });
    reader.addEventListener('cancel', e => { e.preventDefault(); close(true); });
    reader.querySelector('.sc-reader-close').addEventListener('click', e => close(e.detail === 0));
    reader.addEventListener('click', e => { if (e.target === reader) close(false); });
    tiles.addEventListener('click', e => {
      const t = e.target.closest('.sc-tile');
      if (t) open(t.dataset.case, e.detail === 0);
    });
  }
  // Other belts named in the page: the growth steps keep their order 1, 2, 3 and sway instead of looping
  document.querySelectorAll('[data-belt]').forEach(list => belt(list, list.dataset.belt, {loops: list.dataset.loop !== 'no'}));

  // Header: floating pills at the top of the page; once the page moves, the links step aside and the mark and the
  // actions wait in the corners (owner, after tryholo.ai). A short fade carries the change, never a slide.
  const head = document.querySelector('.site-header');
  if (head) {
    let compact = false, swap = 0;
    const set = on => {
      if (on === compact) return;
      compact = on;
      clearTimeout(swap);
      if (still) { head.classList.toggle('is-compact', on); return; }
      head.classList.add('is-switching');
      swap = setTimeout(() => { head.classList.toggle('is-compact', on); head.classList.remove('is-switching'); }, 160);
    };
    const check = () => { if (scrollY > 64) set(true); else if (scrollY < 16) set(false); };
    addEventListener('scroll', check, {passive: true});
    check();
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
      const line = innerHeight * 0.72;            // a heading in the lower part of the screen is being read
      let active = null;
      rows.forEach(r => { if (r.getBoundingClientRect().top < line) active = r; });
      const key = active ? active.id.replace('hai-', '') : '';
      if ((unfold.dataset.active || '') === key) return;
      rows.forEach(r => r.classList.toggle('is-active', r === active));
      if (key) unfold.dataset.active = key; else delete unfold.dataset.active;
      if (name) name.textContent = active ? active.querySelector('h3').textContent : closed;
    });
  }

  // Homepage: the lab sentence is readable at once and lights up fully, word by word, as it moves up the screen.
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
      words.forEach((w, i) => { w.style.opacity = String(Math.max(0.55, clamp(lit - i))); });
    });
  }

  // Entrances: whole blocks fade in once as they arrive. Whatever is already on screen when this runs stays put, and
  // printing shows everything.
  if ('IntersectionObserver' in window) {
    const blocks = [...document.querySelectorAll(['main .chapter-head', 'main .pg-cta .inner > div:first-child',
      '.pg-grow', '.pg-outcomes', '.pg-sources', '.pg-parts', '.pg-plant', '.pg-folds', '.pg-feature', '.pg-cases',
      '.pg-timeline', '.pg-shifts', '.pg-route', '.pg-trace', '.pg-daily', '.pg-three', '.pg-carousel', '.sc-tiles', '.pg-plans', '.pg-two', '.pg-callers', '.pg-teams', '.pg-topics', '.pg-cta .pg-duo'].join(','))];
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
