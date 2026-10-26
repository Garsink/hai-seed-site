// Homepage hero film: the story plays once per visit, then the loop keeps running.
// What is said in the film (the intro's narration, each department's question and HAI's answer, the alert HAI
// raises before anyone asks) is written under the headline in step with the film, where it reads comfortably;
// on phones it sits under the film. Each pass of the loop asks a new set of questions (window.HAI_HERO_FILM,
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
  const narrow = matchMedia('(max-width: 800px)');
  const SVG = 'http://www.w3.org/2000/svg';

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
    const box = el('div', 'hero-talk');
    box.setAttribute('aria-hidden', 'true');          // the film's label tells the story to screen readers
    const turns = [0, 1].map(() => {
      const t = el('div', 'ht-turn', box);
      t.who = el('p', 'ht-who', t);
      t.text = el('p', 'ht-text', t);
      t.note = el('p', 'ht-note', t);
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
    // under the headline on wide screens, under the film on phones
    const place = () => {
      box.classList.toggle('wrap', narrow.matches);
      if (narrow.matches) figure.after(box); else message.appendChild(box);
    };
    place();
    narrow.addEventListener('change', place);
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
    t.who.textContent = '';
    t.who.className = 'ht-who' + (w.tone ? ' is-' + w.tone : '');
    t.year = null;
    if (w.dot) el('span', 'ht-dot', t.who).style.background = w.dot;
    if (w.icon === 'mark') mark(t.who);
    if (w.icon === 'siren') siren(t.who);
    if (w.icon === 'year') t.year = el('span', 'ht-year', t.who);
    if (w.who) el('span', '', t.who, w.who);
    t.text.textContent = '';
    t.items = (Array.isArray(w.text) ? w.text : [w.text]).map(s => el('span', 'ht-item is-on', t.text, s));
    t.note.textContent = w.note || '';
    t.note.hidden = !w.note;
  };
  // Show what the film says now: fade out, swap the words while hidden, fade in.
  const apply = (t, w, now, instant) => {
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
  };

  // The intro, f in the intro's frames: the years pile up, the engineer plants the Seed, it opens into three parts.
  const sayIntro = f => {
    const I = DATA.intro;
    if (f < I.engineer[0] - 8) {
      const year = Math.min(I.yearTo, I.yearFrom + Math.floor(Math.max(0, f - I.years[0]) / I.yearStep));
      return [{key: 'years', icon: 'year', who: '', year, on: f >= I.years[0] && f < I.years[1],
               text: 'Years of emails, files and systems.', note: 'Scattered everywhere. Nobody can read it all.'}, null];
    }
    if (f < I.root[0] - 8) {
      return [{key: 'engineer', icon: 'mark', tone: 'hai', who: 'HAI Seed engineer', on: f >= I.engineer[0] && f < I.engineer[1],
               text: 'Plants HAI in your company.'}, null];
    }
    return [{key: 'seed', who: 'The Seed opens into three parts', on: f >= I.root[0] && f < I.root[1],
             text: ['Root: your company’s living memory.', 'Kernel: the shared operating core.', 'Crown: company intelligence at work.'],
             items: [f >= I.root[0], f >= I.kernel[0], f >= I.crown[0]]}, null];
  };

  // The loop, f in the loop's frames. Windows that cross the loop's end are read on both sides of it.
  const IDS = ['sales', 'finance', 'marketing', 'ceo'];
  const sayLoop = f => {
    const L = DATA.loop;
    const within = (a, z) => [f, f + L, f - L].some(v => v >= a && v < z);
    talk.ring.classList.toggle('is-on', within(DATA.stories.ceo.ripen - 4, DATA.stories.ceo.pick + 16));
    for (const id of IDS) {
      const b = DATA.stories[id], conf = DATA.sets[id];
      const set = conf.sets[talk.pass % conf.sets.length];
      const key = id + talk.pass;
      if (id === 'ceo') {
        if (!within(b.ripen - 4, b.until)) continue;
        return [{key: key + 'q', icon: 'siren', tone: 'alert', who: 'Heads-up from HAI', on: true, text: set.alert},
                {key: key + 'a', icon: 'mark', tone: 'hai', who: 'HAI to the CEO', on: within(b.pick + 20, b.until),
                 text: set.answer, note: sources(set.from)}];
      }
      const qa = Math.max((b.enter ?? b.start) + 30, (b.stop ?? b.ripen) - 24);
      if (!within(qa, b.until)) continue;
      return [{key: key + 'q', dot: conf.fruit, who: conf.who + ' asks', on: true, text: set.ask},
              {key: key + 'a', icon: 'mark', tone: 'hai', who: 'HAI answers', on: within(b.ripen - 10, b.until),
               text: set.answer, note: sources(set.from)}];
    }
    return [null, null];
  };

  const show = (said, instant) => {
    const now = performance.now();
    talk.turns.forEach((t, i) => apply(t, said[i], now, instant));
  };

  // Keep the film clear of the proof line under it; on phones keep the pause button on the film.
  const fit = () => {
    const h = hero.getBoundingClientRect();
    if (proof) hero.style.setProperty('--film-bottom', Math.max(0, Math.round(h.bottom - proof.getBoundingClientRect().top + 12)) + 'px');
    hero.style.setProperty('--toggle-bottom', Math.max(0, Math.round(h.bottom - figure.getBoundingClientRect().bottom + 12)) + 'px');
  };
  fit();
  if ('ResizeObserver' in window) new ResizeObserver(fit).observe(hero);
  else addEventListener('resize', fit);

  // The still shows a moment of the first story; its conversation is written once, without motion.
  const stillFrame = hero.querySelector('.hero-film-still source');
  const staticTalk = () => {
    if (!talk || talk.box.classList.contains('is-static')) return;
    if (still && stillFrame) still.src = stillFrame.srcset;
    talk.box.classList.add('is-static');
    talk.overlay.classList.add('is-on');
    show(sayLoop(DATA.showcase), true);
    fit();
  };
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = navigator.connection && navigator.connection.saveData;
  if (calm || saveData || !intro || !loop || !toggle) {
    staticTalk();
    return;
  }

  const width = innerWidth * Math.min(devicePixelRatio || 1, 2) > 1400 ? '1600' : '1280';
  const source = video => video.getAttribute('data-src-' + width);
  const KEY = 'hai-hero-film-20261025';
  let seen = false;
  try { seen = sessionStorage.getItem(KEY) === 'seen'; } catch {}

  let active = null, paused = false, visible = true, last = 0, ticking = false;
  const play = video => video.play().then(() => true, () => false);
  const tick = () => {
    if (talk && active) {
      const t = active.currentTime;
      if (active === loop) {
        if (t < last - 1) talk.pass++;          // the loop wrapped: next set of questions
        last = t;
        show(sayLoop(t * DATA.fps));
      } else {
        talk.ring.classList.remove('is-on');
        show(sayIntro(t * DATA.fps));
      }
    }
    requestAnimationFrame(tick);
  };
  const showVideo = video => {
    video.classList.add('is-on');
    if (active && active !== video) { active.classList.remove('is-on'); active.pause(); }
    active = video;
    toggle.hidden = false;
    if (talk) {
      talk.overlay.classList.add('is-on');
      fit();
      if (!ticking) { ticking = true; requestAnimationFrame(tick); }
    }
  };
  const startLoop = () => {
    if (!loop.getAttribute('src')) loop.src = source(loop);
    play(loop).then(ok => { if (ok) showVideo(loop); else if (!active) staticTalk(); });
  };

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
    intro.addEventListener('ended', () => {
      try { sessionStorage.setItem(KEY, 'seen'); } catch {}
      startLoop();
    }, { once: true });
    // Autoplay refused (power saving, browser settings): the still and its conversation, as for reduced motion.
    play(intro).then(ok => { if (!ok) staticTalk(); });
  }

  // Rest off screen; resume only if the visitor has not paused it.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!active) return;
      if (visible && !paused) active.play().catch(() => {});
      else active.pause();
    }).observe(hero);
  }
  toggle.addEventListener('click', () => {
    paused = !paused;
    toggle.setAttribute('aria-pressed', String(paused));
    hero.classList.toggle('is-paused', paused);           // the ring and the siren stop with the film
    if (!active) return;
    if (paused) active.pause();
    else if (visible) active.play().catch(() => {});
  });
})();
