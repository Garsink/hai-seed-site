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

  // Open linked details immediately, but position an initial deep link after the
  // browser's load/restore cycle and final font metrics. Later hash changes stay immediate.
  const openLinked = (scroll = true) => {
    let id; try { id = decodeURIComponent(location.hash.slice(1)); } catch (_) { return null; }
    const card = id && document.getElementById(id);
    if (!card || !card.matches('details.pg-case, details.pg-win, details.pg-win-group')) return null;
    const chain = [card];
    let parent = card.parentElement && card.parentElement.closest('details');
    while (parent) {
      chain.push(parent);
      parent = parent.parentElement && parent.parentElement.closest('details');
    }
    chain.reverse().forEach(detail => { detail.open = true; });
    if (scroll) card.scrollIntoView({block: card.matches('.pg-win-group') ? 'start' : 'center'});
    return card;
  };
  let cancelInitialLink = () => {};
  addEventListener('hashchange', () => { cancelInitialLink(); openLinked(); });
  const initialLinked = openLinked(false);
  if (initialLinked) {
    const initialHash = location.hash;
    let cancelled = false;
    const intentEvents = ['pointerdown', 'touchstart', 'wheel', 'keydown'];
    const cancel = () => {
      cancelled = true;
      intentEvents.forEach(type => removeEventListener(type, cancel, true));
    };
    cancelInitialLink = cancel;
    intentEvents.forEach(type => addEventListener(type, cancel, {capture: true, passive: true}));
    const settle = () => {
      if (cancelled) return;
      Promise.resolve(document.fonts ? document.fonts.ready : null).catch(() => {}).then(() => {
        // Two rendering frames let restored scroll and responsive layout settle;
        // no timer can pull a visitor back after they have started interacting.
        requestAnimationFrame(() => requestAnimationFrame(() => {
          if (!cancelled && location.hash === initialHash) openLinked();
          cancel();
        }));
      });
    };
    if (document.readyState === 'complete') settle();
    else addEventListener('pageshow', event => { if (event.persisted) cancel(); else settle(); }, {once: true});
  }
  // END LINKED RESULTS

  // Request a demo: the visitor’s question goes into an email draft.
  const builder = document.querySelector('.pg-builder');
  if (builder) {
    const box = builder.querySelector('textarea');
    const send = builder.querySelector('.pg-send');
    const ideas = [...builder.querySelectorAll('.pg-idea')];
    const address = send.getAttribute('href').split('?')[0];
    const update = () => {
      const body = 'Company:\n\nWhat we would like to understand or improve:\n' + box.value.trim() + '\n\nBest times for a demo:\n';
      send.href = address + '?subject=' + encodeURIComponent('HAI Seed demo request') + '&body=' + encodeURIComponent(body);
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
  // previous, pause and next controls, and it stands still for reduced motion. Phones get a flat moving swipe row. A numbered
  // sequence does not loop: it stays still when all cards fit, otherwise it moves through them in order. The list keeps its order for
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
    const prev = control('belt-prev', `Previous ${label}`, '←');
    const toggle = control('belt-pause', `Pause the moving ${label}`);
    const next = control('belt-next', `Next ${label}`, '→');
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
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const pointers = new Set();
    let offset = 0, phase = 0, last = 0, raf = 0, step = 320, span = 1, radius = 1400;
    let flat = true, mobile = flatScreen.matches, staticRow = false, visible = false, pointer = false, keyboard = false, paused = false, held = false;
    let glide = null, gesture = null, input = 'keyboard', direction = 1, dwell = 1400, measuredWidth = 0, suppressClick = false;
    const limit = () => Math.max(0, (own.length - 1) * step);
    const bounded = value => loops ? value : Math.max(0, Math.min(limit(), value));
    const xOf = k => {
      if (!loops) return (mobile ? k : k - (own.length - 1) / 2) * step - offset;
      const x = ((k * step - offset) % span + span) % span;
      return x > span / 2 ? x - span : x;
    };
    const controls = () => {
      const position = flat ? list.scrollLeft : offset;
      const end = flat ? Math.max(0, list.scrollWidth - list.clientWidth) : limit();
      prev.disabled = !loops && position <= 1;
      next.disabled = !loops && position >= end - 1;
    };
    const place = () => {
      if (staticRow) return;
      all.forEach((el, k) => {
        const x = xOf(k), a = x / radius;
        el.style.transform = mobile ? `translate3d(${x.toFixed(1)}px,0,0)`
          : `translate3d(${(radius * Math.sin(a)).toFixed(1)}px,0,${(radius * (Math.cos(a) - 1)).toFixed(1)}px) rotateY(${(a * 57.2958).toFixed(2)}deg)`;
      });
      controls();
    };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; glide = null; last = 0; };
    const available = () => !flat && !staticRow && visible && !keyboard && !held && !document.hidden && !pointers.size;
    const running = () => available() && !pointer && !paused;
    const tick = now => {
      raf = 0;
      if (!available()) { stop(); return; }
      const dt = last ? Math.min(64, now - last) : 0;
      last = now;
      if (glide) {
        const p = Math.min(1, (now - glide.start) / 240);
        offset = glide.from + (glide.to - glide.from) * easeOut(p);
        if (p === 1) glide = null;
      } else if (running()) {
        if (loops) offset += dt * speed / 1000;
        else if (mobile) {
          if (dwell > 0) dwell = Math.max(0, dwell - dt);
          else {
            offset = bounded(offset + direction * dt * speed / 1000);
            if (offset === 0 || offset === limit()) { direction *= -1; dwell = 1400; }
          }
        } else { phase += dt / 16000 * 2 * Math.PI; offset = step * 0.3 * Math.sin(phase); }
      } else { last = 0; return; }
      place();
      if (glide || running()) raf = requestAnimationFrame(tick);
      else last = 0;
    };
    const go = () => {
      if (!available()) { stop(); return; }
      if ((glide || running()) && !raf) { last = 0; raf = requestAnimationFrame(tick); }
    };
    const setPaused = on => {
      paused = on;
      toggle.setAttribute('aria-pressed', String(on));
      toggle.setAttribute('aria-label', `${on ? 'Play' : 'Pause'} the moving ${label}`);
      if (on) stop();
      go();
    };
    const settle = (to, instant = false) => {
      stop();
      to = bounded(to);
      if (instant || !available()) { offset = to; place(); return; }
      glide = {from: offset, to, start: performance.now()};
      go();
    };
    const releaseGesture = () => {
      gesture = null;
      const ids = [...pointers];
      pointers.clear();
      ids.forEach(id => { if (view.hasPointerCapture(id)) view.releasePointerCapture(id); });
    };
    const measure = () => {
      stop();
      releaseGesture();
      const wasMobile = mobile, wasStatic = staticRow, previousStep = step;
      flat = motion.matches;
      mobile = flatScreen.matches;
      // Measure the normal card width, not a grid column that shrinks with its container.
      view.classList.toggle('belt-static', false);
      view.classList.toggle('belt-flat', flat);
      view.classList.toggle('belt-mobile', mobile && !flat);
      all.forEach(el => { el.style.minHeight = ''; el.style.transform = ''; });
      measuredWidth = view.clientWidth;
      staticRow = !loops && own.reduce((width, el) => width + el.offsetWidth, 0) + Math.max(0, own.length - 1) * 14 <= measuredWidth;
      // A finite row can overflow inside a narrow column even on a wide screen.
      if (!loops && !staticRow) mobile = true;
      view.classList.toggle('belt-static', staticRow);
      view.classList.toggle('belt-mobile', mobile && !flat && !staticRow);
      bar.hidden = staticRow;
      toggle.hidden = flat || staticRow;
      prev.hidden = next.hidden = staticRow || (!loops && !mobile && !flat);
      if (staticRow) {
        offset = 0; phase = 0; direction = 1; dwell = 1400;
        list.style.height = ''; list.scrollLeft = 0;
        return;
      }
      if (flat) { list.style.height = ''; controls(); return; }
      list.scrollLeft = 0;
      step = own[0].offsetWidth + (mobile ? 14 : 28);
      span = step * all.length;
      radius = Math.max(1200, view.clientWidth * 1.1);
      if (wasStatic) { offset = 0; direction = 1; dwell = 1400; }
      else if (loops || wasMobile === mobile) offset *= step / previousStep;
      else { offset = mobile ? 0 : step * 0.3 * Math.sin(phase); direction = 1; dwell = 1400; }
      if (!loops && mobile) offset = bounded(offset);
      if (wasStatic && keyboard) {
        const focused = own.findIndex(el => el.contains(document.activeElement));
        if (focused >= 0) offset = focused * step;
      }
      const tallest = Math.max(...own.map(el => el.offsetHeight));
      all.forEach(el => { el.style.minHeight = tallest + 'px'; });   // every card on a belt stands the same height
      list.style.height = tallest + 'px';
      place();
      go();
    };
    // previous and next: one card at a time, and the drift stops until Play. A click glides; a key press moves at once.
    const move = (dir, instant) => {
      if (staticRow) return;
      if (flat) { list.scrollBy({left: dir * (own[0].offsetWidth + 14), behavior: 'auto'}); return; }
      const base = glide ? glide.to : offset;           // repeated presses continue from the pending destination
      setPaused(true);
      settle((dir > 0 ? Math.floor(base / step + 1e-6) + 1 : Math.ceil(base / step - 1e-6) - 1) * step, instant);
    };
    prev.addEventListener('click', e => move(-1, e.detail === 0));
    next.addEventListener('click', e => move(1, e.detail === 0));
    toggle.addEventListener('click', () => setPaused(!paused));
    view.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { pointer = true; stop(); } });
    view.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') { pointer = false; go(); } });
    // A touch freezes its target before click dispatch. Horizontal intent owns the drag; vertical pan and pinch stay native.
    view.addEventListener('pointerdown', e => {
      suppressClick = false;
      if (flat || staticRow || (!loops && !mobile) || (e.pointerType === 'mouse' && e.button !== 0)) return;
      pointers.add(e.pointerId);
      stop();
      if (pointers.size > 1) { gesture = null; return; }
      gesture = {id: e.pointerId, x: e.clientX, y: e.clientY, from: offset, dragged: false,
        lastX: e.clientX, lastTime: performance.now(), velocity: 0};
    });
    view.addEventListener('pointermove', e => {
      if (!gesture || e.pointerId !== gesture.id || pointers.size !== 1) return;
      const dx = e.clientX - gesture.x, dy = e.clientY - gesture.y;
      if (!gesture.dragged) {
        if (Math.abs(dy) > 8 && Math.abs(dy) >= Math.abs(dx)) { gesture = null; return; }
        if (Math.abs(dx) < 8 || Math.abs(dx) <= Math.abs(dy)) return;
        gesture.dragged = true;
        setPaused(true);
        view.setPointerCapture(e.pointerId);
      }
      const time = performance.now();
      gesture.velocity = (e.clientX - gesture.lastX) / Math.max(1, time - gesture.lastTime);
      gesture.lastX = e.clientX;
      gesture.lastTime = time;
      const nextOffset = gesture.from - dx;
      offset = loops ? nextOffset : bounded(nextOffset);
      place();
    });
    const finishPointer = e => {
      // Promoting a touch's implicit child capture to the viewport also bubbles a child lostcapture event.
      if (e.type === 'lostpointercapture' && e.target !== view) return;
      if (!pointers.has(e.pointerId)) return;
      pointers.delete(e.pointerId);
      const drag = gesture && gesture.id === e.pointerId ? gesture : null;
      if (drag) gesture = null;
      if (view.hasPointerCapture(e.pointerId)) view.releasePointerCapture(e.pointerId);
      if (drag && drag.dragged) {
        suppressClick = true;
        const velocity = performance.now() - drag.lastTime < 100 ? Math.max(-1.2, Math.min(1.2, drag.velocity)) : 0;
        if (e.type === 'pointerup') settle(Math.round((offset - velocity * 160) / step) * step);
      }
      go();
    };
    document.addEventListener('pointerup', finishPointer);
    document.addEventListener('pointercancel', finishPointer);
    view.addEventListener('lostpointercapture', finishPointer);
    list.addEventListener('click', e => {
      if (!suppressClick) return;
      suppressClick = false;
      if (e.detail === 0) return;
      e.preventDefault();
      e.stopImmediatePropagation();
    }, true);
    list.addEventListener('dragstart', e => { if (!flat && !staticRow) e.preventDefault(); });
    // Pointer-origin focus restoration after a reader must not turn into a permanent keyboard pause on touch browsers.
    document.addEventListener('pointerdown', () => { input = 'pointer'; keyboard = false; go(); }, true);
    document.addEventListener('keydown', e => {
      if (e.key === 'Tab' || e.key === 'Enter' || e.key === ' ' || e.key === 'Escape' || e.key.startsWith('Arrow')) {
        input = 'keyboard';
        if (list.contains(document.activeElement)) { keyboard = true; stop(); }
      }
    }, true);
    // a card reached with the keyboard comes to the front and the belt waits; a mouse press never moves its card
    list.addEventListener('focusin', e => {
      if (input !== 'keyboard' || !byKeyboard(e.target)) return;
      keyboard = true;
      stop();
      const i = own.findIndex(el => el.contains(e.target));
      if (i >= 0 && !flat && !staticRow && (loops || mobile)) { offset = i * step; place(); }
    });
    list.addEventListener('focusout', e => { if (!list.contains(e.relatedTarget)) { keyboard = false; go(); } });
    list.addEventListener('scroll', controls, {passive: true});
    new IntersectionObserver(es => { visible = es[0].isIntersecting; go(); }).observe(view);
    document.addEventListener('visibilitychange', () => { if (document.hidden) { releaseGesture(); stop(); } else go(); });
    addEventListener('blur', () => { pointer = false; releaseGesture(); stop(); });
    addEventListener('focus', go);
    addEventListener('pageshow', () => { pointer = false; measure(); });
    motion.addEventListener('change', measure);
    flatScreen.addEventListener('change', measure);
    const resize = () => { if (Math.abs(view.clientWidth - measuredWidth) > (loops ? 1 : .5)) measure(); };
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(view);
    else addEventListener('resize', resize);
    if (document.fonts) document.fonts.ready.then(measure);
    measure();
    return {hold: on => { held = on; if (on) { releaseGesture(); stop(); } else go(); }};
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
  // Growth steps keep their order 1, 2, 3, and move only when they need more room than the available width.
  document.querySelectorAll('[data-belt]').forEach(list => belt(list, list.dataset.belt, {loops: list.dataset.loop !== 'no'}));

  // The header follows the scroll continuously. Its layout is measured only on resize;
  // each scroll frame changes transforms and opacity, so the controls never disappear.
  const head = document.querySelector('.site-header');
  if (head) {
    const nav = head.querySelector('.nav');
    const identity = head.querySelector('.identity');
    const actions = head.querySelector('.nav-actions');
    const links = head.querySelector('.nav-shortcuts');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let left = 0, right = 0, frame = 0, open = head.classList.contains('is-open');
    const paint = () => {
      frame = 0;
      if (open) return;
      const focusedLink = links && links.contains(document.activeElement);
      const p = focusedLink ? 0 : reduced.matches ? (scrollY > 64 ? 1 : 0) : clamp(scrollY / 180);
      head.style.setProperty('--header-progress', p.toFixed(4));
      head.style.setProperty('--header-left', (left * p).toFixed(2) + 'px');
      head.style.setProperty('--header-right', (right * p).toFixed(2) + 'px');
      head.style.setProperty('--header-wordmark', (1 - clamp(p / .72)).toFixed(4));
      head.style.setProperty('--header-mark', clamp((p - .3) / .7).toFixed(4));
      head.classList.toggle('is-compact', p === 1);
      if (links) links.inert = p > .92;
    };
    const ask = () => { if (!frame) frame = requestAnimationFrame(paint); };
    const measure = () => {
      if (open) return;
      head.style.setProperty('--header-left', '0px');
      head.style.setProperty('--header-right', '0px');
      const n = nav.getBoundingClientRect(), a = identity.getBoundingClientRect(), b = actions.getBoundingClientRect();
      left = n.left - a.left;
      right = n.right - b.right;
      paint();
    };
    head.classList.add('header-scroll');
    new MutationObserver(() => {
      const next = head.classList.contains('is-open');
      if (next === open) return;
      open = next;
      if (open && links) links.inert = true;
      if (!open) measure();
    }).observe(head, {attributes: true, attributeFilter: ['class']});
    addEventListener('scroll', ask, {passive: true});
    addEventListener('resize', measure);
    head.addEventListener('focusin', ask);
    head.addEventListener('focusout', ask);
    reduced.addEventListener('change', paint);
    if (document.fonts) document.fonts.ready.then(measure);
    measure();
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
