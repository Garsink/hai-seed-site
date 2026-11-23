/* HAI Seed full preview, f20. Home: the whole Seed story plays in the hero's own picture box, then the living tree comes back.
   - Only on an explicit click (the hero button, or the link at the end of the explanation). Never autoplays.
   - The film sits exactly over the tree picture (same box, same size). Its last frame is the tree picture itself, so at the
     end the film is simply removed: the still underneath is identical, and the tree's own overlays return and come alive.
   - Explanations and speech clouds come from the original film's dialogue (data built into the page as #fp-story-data).
     Words are revealed from the video's own clock, so pause, tab switches and replay always agree with the picture.
   - While the story plays, the tree overlays are hidden (no second scene loop) and the copy column shows the clouds.
   - Pause and resume, back to the tree, replay. Pauses itself when the tab is hidden or the hero leaves the screen,
     and stays paused until the visitor resumes. A failed load returns to the tree with a short message.
   - At the natural end on phones and tablets a compact finished state (closing line, Replay, Back) keeps the tree in place. */
(function () {
  var hero = document.getElementById('hero'), raw = document.getElementById('fp-story-data');
  if (!hero || !raw) return;
  var stage = hero.querySelector('.fp-hero17'), video = hero.querySelector('.fp-story-video'), panel = hero.querySelector('[data-fp-story]');
  var copy = hero.querySelector('.fp-hero-copy'), cta = hero.querySelector('.fp-story-play'), msg = hero.querySelector('.fp-story-msg');
  if (!stage || !video || !panel || !cta || typeof video.play !== 'function') return;
  var DATA; try { DATA = JSON.parse(raw.textContent); } catch (e) { return; }
  var lang = document.documentElement.lang === 'lt' ? 'lt' : 'en', T = DATA.text[lang] || DATA.text.en, UI = T.ui, CUES = T.cues;
  var cloud = panel.querySelector('.fp-cloud'), who = cloud.querySelector('.fp-cloud-who'), text = cloud.querySelector('.fp-cloud-text'), note = cloud.querySelector('.fp-cloud-note');
  var toggle = panel.querySelector('.fp-story-toggle'), back = panel.querySelector('.fp-story-back'), bar = panel.querySelector('.fp-story-time i');
  var calm = matchMedia('(prefers-reduced-motion: reduce)'), narrow = matchMedia('(max-width:1180px)');
  var CLOSE = CUES.filter(function (c) { return c.k === 'close'; })[0];
  var SVG = 'http://www.w3.org/2000/svg';
  var state = 'idle', frame = 0, shown = null, words = [], swapAt = 0, played = false;

  /* labels in the page language */
  var label = function (btn, t) { btn.querySelector('span').textContent = t; };
  label(cta, UI.play); label(back, UI.back);
  /* phones: a short visible name; the full name stays for assistive technology */
  var shortName = function () { if (narrow.matches && innerWidth <= 560) { cta.setAttribute('aria-label', played ? UI.replay : UI.play); label(cta, UI.short); } else { cta.removeAttribute('aria-label'); label(cta, played ? UI.replay : UI.play); } }; panel.setAttribute('aria-label', UI.region);
  cta.hidden = false; shortName(); addEventListener('resize', shortName);

  /* ---------- the cloud: one speaker at a time, words revealed from the video clock ---------- */
  var mark = function (parent) {
    var s = document.createElementNS(SVG, 'svg'); s.setAttribute('class', 'fp-cloud-mark'); s.setAttribute('viewBox', '0 0 1300 1738.48'); s.setAttribute('aria-hidden', 'true');
    [['b', DATA.mark.base], ['a', DATA.mark.accent]].forEach(function (p) { var e = document.createElementNS(SVG, 'path'); e.setAttribute('class', p[0]); e.setAttribute('d', p[1]); s.appendChild(e); });
    parent.appendChild(s);
  };
  var fill = function (c) {
    who.textContent = ''; text.textContent = ''; words = [];
    cloud.classList.toggle('is-hai', !!c.hai); cloud.classList.toggle('is-list', c.lines.length > 1);
    if (c.icon === 'mark') mark(who);
    if (c.dot) { var d = document.createElement('span'); d.className = 'fp-cloud-dot'; d.style.background = c.dot; who.appendChild(d); }
    if (c.who) who.appendChild(document.createTextNode(c.who));
    who.hidden = !c.who && !c.icon;
    c.lines.forEach(function (line, i) {
      var row = document.createElement('span'); row.className = 'fp-cloud-line'; text.appendChild(row);
      words.push(line.trim().split(/\s+/).map(function (w, j) {
        if (j) row.appendChild(document.createTextNode(' '));
        var s = document.createElement('span'); s.className = 'fp-w'; s.textContent = w; row.appendChild(s); return s;
      }));
    });
    note.textContent = c.note || ''; note.hidden = !c.note;
  };
  var reveal = function (n, since) {                       /* same pace as the original film: about 0.13 s a word, a line done within 1.8 s */
    if (calm.matches) return n;
    var e = since - .08; if (e < 0) return 0;
    return Math.min(n, Math.floor(e / Math.min(.13, 1.8 / Math.max(1, n - 1))) + 1);
  };
  var cueAt = function (t) { for (var i = 0; i < CUES.length; i++) if (t >= CUES[i].a && t < CUES[i].z) return CUES[i]; return null; };
  /* flush: draw the cue for this moment at once, with no fade (pause, seek, start); otherwise fade out, swap while hidden, fade in */
  var render = function (flush) {
    var t = video.currentTime || 0, c = state === 'done' ? CLOSE : cueAt(t), now = performance.now();
    bar.style.transform = 'scaleX(' + Math.min(1, t / DATA.seconds).toFixed(4) + ')';
    if (c !== shown && flush) { shown = c; swapAt = 0; if (c) fill(c); }
    if (c !== shown) {
      if (cloud.classList.contains('is-on')) { cloud.classList.remove('is-on'); swapAt = now + (calm.matches ? 0 : 190); return; }   /* fade out, then swap while hidden */
      if (now < swapAt) return;
      shown = c; if (c) fill(c);
    }
    cloud.classList.toggle('is-on', !!c);
    if (!c) return;
    words.forEach(function (row, i) {
      var at = c.at[i] != null ? c.at[i] : c.at[0], k = state === 'done' ? row.length : t >= at ? reveal(row.length, t - at) : 0;
      row.forEach(function (w, j) { w.classList.toggle('is-in', j < k); });
      row[0].parentNode.classList.toggle('is-in', t >= at);
    });
  };
  var loop = function () { frame = 0; render(); if (state === 'playing') frame = requestAnimationFrame(loop); };
  var stopLoop = function () { if (frame) cancelAnimationFrame(frame); frame = 0; };

  /* ---------- states ---------- */
  var setToggle = function () {
    var p = state === 'playing';
    toggle.classList.toggle('is-paused', !p); label(toggle, p ? UI.pause : state === 'done' ? UI.replay : UI.resume);
  };
  /* the cloud keeps the height of its longest cue at this width, so nothing below it moves while the story plays */
  /* on wide screens the cloud never reaches the tree: its right edge stays left of the art's x = 900 of 1920, less 24 px */
  var art = hero.querySelector('.fp-hero-art');
  var fitWidth = function () {
    panel.style.maxWidth = '';
    if (narrow.matches || !art) return;
    var a = art.getBoundingClientRect(), p = panel.getBoundingClientRect();
    panel.style.maxWidth = Math.max(280, Math.floor(a.left + a.width * 900 / 1920 - 24 - p.left)) + 'px';
  };
  var reserve = function () {
    if (panel.hidden) return;
    fitWidth(); cloud.style.minHeight = ''; var keep = shown, h = 0;
    CUES.forEach(function (c) { fill(c); words.forEach(function (r) { r.forEach(function (w) { w.classList.add('is-in'); }); }); h = Math.max(h, cloud.offsetHeight); });
    cloud.style.minHeight = h + 'px'; shown = null; if (keep) { shown = keep; fill(keep); }
    render(true);
  };
  var enter = function () {
    hero.classList.add('is-story'); hero.classList.remove('is-done'); panel.hidden = false; msg.textContent = '';
    shown = null; cloud.classList.remove('is-on'); text.textContent = ''; who.textContent = '';
    reserve();
  };
  var sized = 0;
  addEventListener('resize', function () { if (state !== 'idle' && !sized) sized = requestAnimationFrame(function () { sized = 0; reserve(); }); });
  var leave = function (focusCta) {
    stopLoop(); state = 'idle';
    try { video.pause(); } catch (e) {}
    hero.classList.remove('is-story', 'is-film-on', 'is-done'); panel.hidden = true;
    shortName();
    if (focusCta) cta.focus({ preventScroll: true });
  };
  var fail = function () { leave(false); msg.textContent = UI.failed; };
  var play = function () {
    if (!video.getAttribute('src')) { video.src = video.getAttribute('data-src'); video.preload = 'auto'; }
    var p = video.play();
    state = 'playing'; setToggle();
    if (p && p.catch) p.catch(function (e) { if (e && e.name === 'AbortError') return; if (state !== 'idle') fail(); });
    stopLoop(); frame = requestAnimationFrame(loop);
  };
  var pause = function () { if (state !== 'playing') return; state = 'paused'; try { video.pause(); } catch (e) {} stopLoop(); render(true); setToggle(); };
  var start = function () {
    enter();
    try { video.currentTime = 0; } catch (e) {}
    play();
    toggle.focus({ preventScroll: true });
  };

  video.addEventListener('playing', function () { hero.classList.add('is-film-on'); });   /* the film covers the tree only once it really has a frame: no black flash */
  /* Natural end. The last frame is the tree picture itself, so the film is simply faded away and the living tree's overlays return.
     Wide screens go straight back to the usual copy (it sits beside the scene, nothing moves). On phones and tablets the copy sits
     above the scene and is taller than the story panel, so the panel stays, showing the closing line with Replay and Back:
     the tree stays exactly where it was until the visitor chooses Back. */
  var done = function () {
    stopLoop(); state = 'done'; played = true; shortName();
    hero.classList.add('is-done'); hero.classList.remove('is-film-on');
    shown = null; render(true); setToggle(); bar.style.transform = 'scaleX(1)';
    toggle.focus({ preventScroll: true });
  };
  video.addEventListener('ended', function () {
    played = true;
    if (narrow.matches) done(); else leave(true);
  });
  video.addEventListener('error', function () { if (state !== 'idle') fail(); });
  video.addEventListener('waiting', function () { stopLoop(); });
  video.addEventListener('seeked', function () { if (state !== 'idle') render(true); });
  video.addEventListener('playing', function () { if (state === 'playing' && !frame) frame = requestAnimationFrame(loop); });

  cta.addEventListener('click', start);
  [].forEach.call(document.querySelectorAll('a[data-fp-story-play]'), function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      hero.scrollIntoView({ block: 'start', behavior: 'auto' });
      start();
    });
  });
  toggle.addEventListener('click', function () { if (state === 'playing') pause(); else if (state === 'paused') play(); else if (state === 'done') start(); });
  back.addEventListener('click', function () { leave(true); });
  panel.addEventListener('keydown', function (e) { if (e.key === 'Escape') leave(true); });

  /* stop when nobody can see it; the visitor decides when to go on */
  document.addEventListener('visibilitychange', function () { if (document.hidden) pause(); });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { if (!es[es.length - 1].isIntersecting) pause(); }, { threshold: .15 }).observe(stage);
  addEventListener('pagehide', function () { pause(); });
})();
