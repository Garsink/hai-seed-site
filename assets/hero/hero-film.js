// Homepage hero film: the story plays once per visit, then the loop keeps running.
// Dialogue stays beside its speaker in the film; on small screens the same bubbles form a readable
// conversation immediately below it. Text is HTML, independent of the video resolution. Each pass of the loop asks a new set of questions (window.HAI_HERO_FILM,
// from hero-film-data.js). The still stays for reduced motion, data saver, or when autoplay is refused.
// A button pauses it.
(() => {
  const hero = document.querySelector('.hero.has-film');
  if (!hero) return;
  const figure = hero.querySelector('.hero-film');
  const message = hero.querySelector('.hero-message');
  const intro = hero.querySelector('.hero-film-intro');
  const loop = hero.querySelector('.hero-film-loop');
  const still = hero.querySelector('.hero-film-still img');
  const toggle = hero.querySelector('.hero-film-toggle');
  const proof = hero.querySelector('.hero-proof');
  const DATA = window.HAI_HERO_FILM;
  const BASE = (document.currentScript && document.currentScript.src || '/assets/hero/').split('?')[0].replace(/[^/]*$/, '');
  const narrow = matchMedia('(max-width: 1100px)');
  const SVG = 'http://www.w3.org/2000/svg';

  // Pure media-clock helpers: no wall-clock typing timers, so pause, seek and replay agree.
  // BEGIN REVEAL HELPERS
  const revealCount = (count, elapsedSourceSeconds, rate = 1, instant = false) => {
    if (instant) return count;
    const elapsed = elapsedSourceSeconds / Math.max(.1, rate) - .08;
    if (elapsed < 0) return 0;
    const step = Math.min(.13, 1.8 / Math.max(1, count - 1));
    return Math.min(count, Math.floor(elapsed / step) + 1);
  };
  const frameSince = (frame, start, cycle = 0) => {
    const delta = frame - start;
    return cycle && delta < -cycle / 2 ? delta + cycle : delta;
  };
  // END REVEAL HELPERS

  const skin = parent => {
    const svg = document.createElementNS(SVG, 'svg');
    svg.setAttribute('class', 'ht-cloud-skin');
    svg.setAttribute('viewBox', '0 0 600 160');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS(SVG, 'path');
    path.setAttribute('d', 'M28 10 C52 2 95 2 120 8 C153 2 195 2 224 8 C260 2 309 2 340 8 C381 2 426 2 456 8 C492 2 533 2 555 10 Q584 7 590 32 C598 47 598 66 591 80 C598 98 597 118 589 131 Q589 153 561 151 C526 159 487 159 458 153 C423 160 380 160 348 153 C308 160 265 160 234 153 C192 160 154 160 126 153 C90 160 52 158 30 150 Q9 151 10 130 C2 115 3 96 9 80 C2 64 3 46 11 32 Q8 11 28 10Z');
    svg.appendChild(path); parent.appendChild(svg);
    const tail = document.createElementNS(SVG, 'svg');
    tail.setAttribute('class', 'ht-cloud-tail'); tail.setAttribute('viewBox', '0 0 28 20');
    tail.setAttribute('aria-hidden', 'true');
    const tip = document.createElementNS(SVG, 'path');
    tip.setAttribute('d', 'M0 1 Q10 3 26 10 Q11 10 0 19Z');
    tail.appendChild(tip); parent.appendChild(tail);
  };

  const el = (tag, cls, parent, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    if (parent) parent.appendChild(n);
    return n;
  };
  const mark = parent => {
    const s = document.createElementNS(SVG, 'svg');
    s.setAttribute('class', 'ht-mark');
    s.setAttribute('viewBox', '0 0 1300 1738.48');
    for (const [cls, d] of [['b', DATA.mark.base], ['a', DATA.mark.accent]]) {
      const p = document.createElementNS(SVG, 'path');
      p.setAttribute('class', cls);
      p.setAttribute('d', d);
      s.appendChild(p);
    }
    parent.appendChild(s);
  };
  const siren = parent => {
    // a 3D siren: a dimmed copy stays, the full-brightness copy flashes on top
    const s = el('span', 'ht-siren', parent);
    for (const cls of ['dim', 'lit']) { const img = el('img', cls, s); img.src = BASE + 'siren.webp'; img.alt = ''; }
  };
  const sources = from => {
    const names = from.map(([label]) => (label === label.toUpperCase() ? label : label.toLowerCase()));
    return 'Read from ' + (names.length > 1 ? names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1] : names[0]) + '.';
  };

  // ---------- the conversation: two turns, each a speaker line and the words ----------
  let talk = null;
  if (DATA) {
    const box = el('div', 'hero-talk hf-dialogue');
    box.dataset.position = 'context';
    box.setAttribute('aria-hidden', 'true');          // the film's label tells the story to screen readers
    const turns = [0, 1].map(i => {
      const t = el('div', 'ht-turn ' + (i ? 'ht-answer' : 'ht-question'), box);
      skin(t);
      t.meta = el('div', 'ht-meta', t);
      t.who = el('p', 'ht-who', t.meta);
      t.note = el('p', 'ht-note', t.meta);
      t.text = el('p', 'ht-text', t);
      t.key = '';
      t.offAt = 0;
      return t;
    });
    // the CEO's fruit, which HAI raised before anyone asked, gets a pulsing ring on the film
    const overlay = el('div', 'hero-film-overlay', figure);
    overlay.setAttribute('aria-hidden', 'true');
    const stage = el('div', 'hf-stage', overlay);
    const ring = el('div', 'hf-ring-wrap', stage);
    el('span', 'hf-ring', ring);
    ring.style.left = DATA.stories.ceo.fruit[0] + 'px';
    ring.style.top = DATA.stories.ceo.fruit[1] + 'px';
    const scale = () => { stage.style.transform = `scale(${overlay.clientWidth / 1920})`; };
    if ('ResizeObserver' in window) new ResizeObserver(scale).observe(overlay);
    scale();
    // A separate dialogue layer uses measured quiet space, never a head/tree anchor.
    // The ring remains on the film's own source coordinates.
    hero.appendChild(box); hero.appendChild(overlay);
    talk = {box, turns, overlay, ring, pass: 0};
    // Screen readers get the film's first conversations once, as a plain list, instead of the moving words.
    const said = el('div', 'ht-sr');
    el('p', '', said, 'Illustrative examples from the film:');
    const list = el('ul', '', said);
    for (const key of ['sales', 'finance', 'marketing']) {
      const set = DATA.sets[key].sets[0];
      el('li', '', list, `${key[0].toUpperCase() + key.slice(1)} asks: ${set.ask} HAI answers: ${set.answer}`);
    }
    const ceo = DATA.sets.ceo.sets[0];
    el('li', '', list, `Heads-up from HAI: ${ceo.alert} HAI to the CEO: ${ceo.answer}`);
    message.appendChild(said);
  }

  // Write a turn's words (only while it is hidden).
  const fill = (t, w) => {
    t.classList.toggle('is-components', w.key === 'seed');
    t.meta.hidden = !w.who && !w.icon && !w.note;
    t.who.textContent = '';
    t.who.className = 'ht-who' + (w.tone ? ' is-' + w.tone : '');
    t.year = null;
    if (w.dot) el('span', 'ht-dot', t.who).style.background = w.dot;
    if (w.icon === 'mark') mark(t.who);
    if (w.icon === 'siren') siren(t.who);
    if (w.icon === 'year') t.year = el('span', 'ht-year', t.who);
    if (w.who) el('span', '', t.who, w.who);
    t.text.textContent = '';
    t.wordLines = [];
    t.items = (Array.isArray(w.text) ? w.text : [w.text]).map(line => {
      const item = el('span', 'ht-item is-on', t.text);
      const words = line.trim().split(/\s+/).map((word, i) => {
        if (i) item.appendChild(document.createTextNode(' '));
        return el('span', 'ht-word', item, word);
      });
      t.wordLines.push(words);
      return item;
    });
    t.note.textContent = (w.note || '').replace(/^Read from /, '').replace(/\.$/, '');
    t.note.hidden = !w.note;
  };
  // Show what the film says now: fade out, swap the words while hidden, fade in.
  const apply = (t, w, now, instant, frame, rate, cycle) => {
    const key = w ? w.key : '';
    if (t.key !== key) {
      if (t.classList.contains('is-on') && !instant) { t.classList.remove('is-on'); t.offAt = now; return; }
      if (now - t.offAt < 230 && !instant) return;
      t.key = key;
      if (w) fill(t, w);
    }
    t.classList.toggle('is-on', !!(w && w.on));
    if (!w) return;
    if (w.items && t.items) t.items.forEach((n, i) => n.classList.toggle('is-on', !!w.items[i]));
    if (t.year && w.year != null) t.year.textContent = w.year;
    if (t.wordLines) t.wordLines.forEach((words, line) => {
      const start = Array.isArray(w.revealAt) ? w.revealAt[line] : w.revealAt;
      const elapsed = frameSince(frame, start ?? frame, cycle) / DATA.fps;
      const count = revealCount(words.length, elapsed, rate, instant);
      words.forEach((word, i) => word.classList.toggle('is-revealed', i < count));
    });
  };

  // The intro, f in the intro's frames: accumulated knowledge, the engineer's Seed, then three connected parts.
  const sayIntro = f => {
    talk.box.classList.add('is-intro');
    talk.box.classList.remove('is-proactive');
    const I = DATA.intro;
    if (f < I.engineer[0] - 8) {
      return [{key: 'years', who: '', on: f >= I.years[0] && f < I.years[1],
               text: 'Years of company knowledge. Buried in files, emails and systems.', revealAt: I.years[0], position: 'arrival'}, null];
    }
    if (f < I.root[0] - 8) {
      return [{key: 'engineer', icon: 'mark', tone: 'hai', who: 'HAI Seed engineer', on: f >= I.engineer[0] && f < I.engineer[1],
               text: 'One Seed connects it all.', revealAt: I.engineer[0], position: 'arrival'}, null];
    }
    return [{key: 'seed', who: 'The Seed opens into three parts', on: f >= I.root[0] && f < I.root[1],
             text: ['Root: your company’s living memory.', 'Kernel: the shared operating core.', 'Crown: company intelligence at work.'],
             items: [f >= I.root[0], f >= I.kernel[0], f >= I.crown[0]], revealAt: [I.root[0], I.kernel[0], I.crown[0]], position: 'context'}, null];
  };

  // The loop, f in the loop's frames. Windows that cross the loop's end are read on both sides of it.
  const IDS = ['sales', 'finance', 'marketing', 'ceo'];
  const sayLoop = f => {
    talk.box.classList.remove('is-intro');
    const L = DATA.loop;
    const within = (a, z) => [f, f + L, f - L].some(v => v >= a && v < z);
    talk.ring.classList.toggle('is-on', within(DATA.stories.ceo.ripen - 4, DATA.stories.ceo.pick + 16));
    for (const id of IDS) {
      const b = DATA.stories[id], conf = DATA.sets[id];
      const set = conf.sets[talk.pass % conf.sets.length];
      const key = id + talk.pass;
      if (id === 'ceo') {
        if (!within(b.ripen - 4, b.until)) continue;
        talk.box.classList.add('is-proactive');
        return [{key: key + 'q', icon: 'siren', tone: 'alert', who: 'Heads-up from HAI', on: true, text: set.alert, revealAt: b.ripen - 4},
                {key: key + 'a', icon: 'mark', tone: 'hai', who: 'HAI to the CEO', on: within(b.pick + 20, b.until),
                 text: set.answer, note: sources(set.from), revealAt: b.pick + 20}];
      }
      const qa = Math.max((b.enter ?? b.start) + 30, (b.stop ?? b.ripen) - 24);
      if (!within(qa, b.until)) continue;
      talk.box.classList.remove('is-proactive');
      return [{key: key + 'q', dot: conf.fruit, who: conf.who + ' asks', on: true, text: set.ask, revealAt: qa},
              {key: key + 'a', icon: 'mark', tone: 'hai', who: 'HAI answers', on: within(b.ripen - 10, b.until),
               text: set.answer, note: sources(set.from), revealAt: b.ripen - 10}];
    }
    return [null, null];
  };

  const show = (said, instant = false, frame = 0, rate = 1, cycle = 0) => {
    const now = performance.now();
    // One speaker at a time. Leave 200ms for the question to clear before the answer enters.
    // The delay is expressed in source time, not a timer that could keep running while paused.
    if (said[1] && said[1].on) {
      const delayFrames = .2 * rate * DATA.fps;
      const answerStart = said[1].revealAt + delayFrames;
      said = [said[0] && {...said[0], on: false}, {...said[1],
        on: instant || frameSince(frame, answerStart, cycle) >= 0, revealAt: answerStart}];
    }
    const visible = said.find(w => w && w.on);
    if (visible) talk.box.dataset.position = visible.position || 'context';
    talk.turns.forEach((t, i) => apply(t, said[i], now, instant, frame, rate, cycle));
  };

  // Measure all final text once per layout: word reveal never changes line wrapping or rail height.
  const samples = () => {
    const context = [{components: true, who: 'The Seed opens into three parts', text: ['Root: your company’s living memory.', 'Kernel: the shared operating core.', 'Crown: company intelligence at work.']}];
    for (const [id, conf] of Object.entries(DATA.sets)) for (const set of conf.sets) {
      context.push({who: id === 'ceo' ? 'Heads-up from HAI' : conf.who + ' asks', text: set.ask || set.alert});
      context.push({who: id === 'ceo' ? 'HAI to the CEO' : 'HAI answers', text: set.answer, note: sources(set.from)});
    }
    return {context, arrival: [
      {who: '', text: 'Years of company knowledge. Buried in files, emails and systems.'},
      {who: 'HAI Seed engineer', text: 'One Seed connects it all.'}
    ]};
  };
  const sampleText = DATA ? samples() : {context: [], arrival: []};
  const measureCloud = (width, records) => {
    const holder = el('div', 'hero-talk hf-dialogue hf-measure', hero);
    holder.style.width = width + 'px';
    const card = el('div', 'ht-turn', holder);
    const meta = el('div', 'ht-meta', card), who = el('p', 'ht-who', meta), note = el('p', 'ht-note', meta), body = el('p', 'ht-text', card);
    let height = 0;
    for (const record of records) {
      card.classList.toggle('is-components', !!record.components);
      meta.hidden = !record.who && !record.note;
      who.textContent = '';
      if (record.who === '2025') el('span', 'ht-year', who, record.who); else who.textContent = record.who;
      note.textContent = (record.note || '').replace(/^Read from /, '').replace(/\.$/, '');
      note.hidden = !record.note;
      body.textContent = '';
      for (const line of Array.isArray(record.text) ? record.text : [record.text]) el('span', 'ht-item', body, line);
      // The real speaker icon needs 21px; reserve it in the measurement too.
      who.style.paddingLeft = '21px';
      height = Math.max(height, Math.ceil(card.getBoundingClientRect().height));
    }
    holder.remove(); return height + 2;
  };
  let layingOut = false, layoutFrame = 0;
  const fit = () => {
    if (layingOut || !talk) return;
    layingOut = true;
    const box = talk.box, content = hero.querySelector('.hero-content');
    // A previous below-film rail is in normal flow. Reset it before measuring
    // the baseline hero, or its old margin/height inflates the bottom reserve.
    box.dataset.layout = 'measuring';
    hero.classList.remove('has-dialogue-below');
    box.classList.remove('wrap');
    hero.appendChild(box);
    const narrowNow = narrow.matches;
    box.dataset.anchor = 'sky';
    if (narrowNow) {
      box.classList.add('wrap'); box.dataset.layout = 'mobile'; figure.after(box); figure.appendChild(talk.overlay);
      box.style.setProperty('--hf-cloud-height', measureCloud(box.getBoundingClientRect().width, [...sampleText.context, ...sampleText.arrival]) + 'px');
    } else {
      hero.appendChild(talk.overlay);
      // Restore the existing stage before measuring it; a below-scene rail must not enlarge the video.
      const initialHero = hero.getBoundingClientRect();
      hero.style.setProperty('--film-bottom', Math.max(0, Math.round(initialHero.bottom - proof.getBoundingClientRect().top + 12)) + 'px');
      const film = figure.querySelector('picture').getBoundingClientRect();
      const h = hero.getBoundingClientRect(), m = message.getBoundingClientRect();
      const textRight = Math.max(...[...message.querySelectorAll('h1,.hero-summary')].map(node => {
        const range = document.createRange(); range.selectNodeContents(node); return range.getBoundingClientRect().right;
      }));
      const safeRight = film.left + film.width * (860 / 1920) - 24;
      const contextWidth = Math.min(460, safeRight - m.left);
      const contextTop = m.bottom + 12;
      const skyBottom = film.top + film.height * (600 / 1080) - 10;
      const contextHeight = contextWidth >= 300 ? measureCloud(contextWidth, sampleText.context) : Infinity;
      const arrivalWidth = Math.min(320, film.width * (430 / 1920));
      const arrivalLeft = film.right - arrivalWidth - 18;
      const arrivalTop = film.top + film.height * .12;
      const arrivalHeight = measureCloud(Math.max(1, arrivalWidth), sampleText.arrival);
      const arrivalSafeLeft = film.left + film.width * (1390 / 1920) + 12;
      const safe = contextWidth >= 320 && contextTop + contextHeight <= skyBottom &&
        arrivalWidth >= 240 && arrivalLeft >= Math.max(arrivalSafeLeft, textRight + 20) &&
        arrivalTop + arrivalHeight <= skyBottom;
      // On shorter desktops the scene moves right, leaving a genuine blank column.
      // A cloud wholly outside the video cannot cross the ground, people or tree,
      // so this slot is not constrained by source-space soil coordinates.
      const outsideWidth = Math.min(460, film.left - m.left - 28);
      const outsideTop = m.bottom + 20;
      const outsideHeight = outsideWidth >= 320 ? measureCloud(outsideWidth, [...sampleText.context, ...sampleText.arrival]) : Infinity;
      const outsideSafe = outsideWidth >= 320 && outsideTop + outsideHeight <= proof.getBoundingClientRect().top - 16;
      box.dataset.layout = safe || outsideSafe ? 'sky' : 'below';
      if (!safe && outsideSafe) {
        box.dataset.anchor = 'outside';
        for (const [name, value] of Object.entries({
          'context-left': m.left - h.left, 'context-top': outsideTop - h.top, 'context-width': outsideWidth,
          'arrival-left': m.left - h.left, 'arrival-top': outsideTop - h.top, 'arrival-width': outsideWidth,
          'cloud-height': outsideHeight
        })) box.style.setProperty('--hf-' + name, value + 'px');
      } else if (safe) {
        for (const [name, value] of Object.entries({
          'context-left': m.left - h.left, 'context-top': contextTop - h.top, 'context-width': contextWidth,
          'arrival-left': arrivalLeft - h.left, 'arrival-top': arrivalTop - h.top, 'arrival-width': arrivalWidth,
          'cloud-height': Math.max(contextHeight, arrivalHeight)
        })) box.style.setProperty('--hf-' + name, value + 'px');
      } else {
        const width = Math.min(560, content.getBoundingClientRect().width);
        box.style.setProperty('--hf-cloud-height', measureCloud(width, [...sampleText.context, ...sampleText.arrival]) + 'px');
        box.style.setProperty('--hf-band-width', width + 'px');
        box.style.setProperty('--hf-band-gap', Math.max(16, film.bottom - m.bottom + 16) + 'px');
        hero.style.setProperty('--hf-film-top', film.top - h.top + 'px');
        hero.style.setProperty('--hf-film-height', film.height + 'px');
        hero.style.setProperty('--hf-film-width', film.width + 'px');
        content.insertBefore(box, proof);
        hero.classList.add('has-dialogue-below');
      }
    }
    const h = hero.getBoundingClientRect();
    hero.style.setProperty('--toggle-bottom', Math.max(0, Math.round(h.bottom - figure.getBoundingClientRect().bottom + 12)) + 'px');
    layingOut = false;
  };
  const queueFit = () => { if (!layoutFrame) layoutFrame = requestAnimationFrame(() => { layoutFrame = 0; fit(); }); };
  fit();
  addEventListener('resize', queueFit);
  narrow.addEventListener('change', queueFit);
  if (document.fonts) document.fonts.ready.then(queueFit);

  // The still shows a moment of the first story; its conversation is written once, without motion.
  const stillFrame = hero.querySelector('.hero-film-still source');
  const staticTalk = () => {
    if (!talk || talk.box.classList.contains('is-static')) return;
    if (still && stillFrame) still.src = stillFrame.srcset;
    hero.classList.remove('is-intro-film');
    talk.box.classList.add('is-static');
    talk.overlay.classList.add('is-on');
    show(sayLoop(DATA.showcase), true, DATA.showcase, 1, DATA.loop);
    fit();
  };
  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  const calm = motionPreference.matches;
  const saveData = navigator.connection && navigator.connection.saveData;
  if (calm || saveData || !intro || !loop || !toggle) {
    staticTalk();
    return;
  }

  const width = innerWidth * Math.min(devicePixelRatio || 1, 2) > 1400 ? '1920' : '1280';
  const source = video => video.getAttribute('data-src-' + width);
  const KEY = 'hai-hero-film-v16';
  let seen = false;
  try { seen = sessionStorage.getItem(KEY) === 'seen'; } catch {}

  let active = null, paused = false, visible = true, pageVisible = !document.hidden, last = 0, ticking = false, playEpoch = 0;
  const play = video => {
    const epoch = ++playEpoch;
    return video.play().then(() => epoch === playEpoch, () => false);
  };
  const tick = () => {
    if (talk && active) {
      const t = active.currentTime;
      if (active === loop) {
        if (t < last - 1) talk.pass++;          // the loop wrapped: next set of questions
        last = t;
        show(sayLoop(t * DATA.fps), false, t * DATA.fps, active.playbackRate, DATA.loop);
      } else {
        talk.ring.classList.remove('is-on');
        show(sayIntro(t * DATA.fps), false, t * DATA.fps, active.playbackRate);
      }
    }
    requestAnimationFrame(tick);
  };
  const showVideo = video => {
    video.classList.add('is-on');
    if (active && active !== video) { active.classList.remove('is-on'); active.pause(); }
    active = video;
    hero.classList.toggle('is-intro-film', video === intro);
    if (paused || !visible || !pageVisible) active.pause();
    toggle.hidden = false;
    if (talk) {
      talk.overlay.classList.add('is-on');
      fit();
      if (!ticking) { ticking = true; requestAnimationFrame(tick); }
    }
  };
  const startLoop = (restart = false) => {
    // 39 seconds becomes 52: the dialogue remains locked to source frames, not wall time.
    loop.defaultPlaybackRate = .75;
    if (!loop.getAttribute('src')) loop.src = source(loop);
    loop.playbackRate = .75;
    if (restart) { loop.currentTime = 0; last = 0; }
    play(loop).then(ok => { if (ok) showVideo(loop); else if (!active) staticTalk(); });
  };

  const replay = el('button', 'hero-film-replay', hero, 'Replay story');
  replay.type = 'button';
  replay.setAttribute('aria-label', 'Replay the HAI Seed story');
  intro.addEventListener('ended', () => {
    try { sessionStorage.setItem(KEY, 'seen'); } catch {}
    startLoop(true);
  });

  if (seen) {
    // Back on the page in the same visit: skip the story, start where the loop starts.
    if (still && loop.poster) still.src = loop.poster;
    loop.preload = 'auto';
    startLoop();
  } else {
    intro.src = source(intro);
    intro.addEventListener('playing', () => {
      showVideo(intro);
      if (!loop.getAttribute('src')) { loop.preload = 'auto'; loop.src = source(loop); loop.load(); }
    }, { once: true });
    // The intro's last frame is the loop's first, so the hand-over is seamless.
    // Autoplay refused (power saving, browser settings): the still and its conversation, as for reduced motion.
    play(intro).then(ok => { if (!ok) staticTalk(); });
  }

  replay.addEventListener('click', () => {
    paused = false;
    hero.classList.remove('is-paused');
    toggle.setAttribute('aria-pressed', 'false');
    toggle.setAttribute('aria-label', 'Pause animation');
    if (active) active.pause();
    if (!intro.getAttribute('src')) intro.src = source(intro);
    intro.currentTime = 0;
    if (talk) talk.pass = 0;
    last = 0;
    play(intro).then(ok => { if (ok) showVideo(intro); });
  });

  motionPreference.addEventListener('change', event => {
    if (!event.matches) return;
    ++playEpoch;
    paused = true;
    active = null;
    for (const video of [intro, loop]) { video.pause(); video.classList.remove('is-on'); }
    toggle.hidden = true;
    replay.hidden = true;
    hero.classList.add('is-paused');
    staticTalk();
  });

  // Rest off screen; resume only if the visitor has not paused it.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!active) return;
      if (visible && pageVisible && !paused) active.play().catch(() => {});
      else active.pause();
    }).observe(hero);
  }
  document.addEventListener('visibilitychange', () => {
    pageVisible = !document.hidden;
    if (!active) return;
    if (pageVisible && visible && !paused) active.play().catch(() => {});
    else active.pause();
  });
  toggle.addEventListener('click', () => {
    paused = !paused;
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.setAttribute('aria-label', paused ? 'Play animation' : 'Pause animation');
    hero.classList.toggle('is-paused', paused);           // the ring and the siren stop with the film
    if (!active) return;
    if (paused) active.pause();
    else if (visible && pageVisible) active.play().catch(() => {});
  });
})();
