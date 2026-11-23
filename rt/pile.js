/* HAI Seed full preview, f17. Home: separate objects, each with its own path; lit lines join the core to each record; one caption names the current event.
   The stage is pinned with plain sticky positioning while the statements scroll past in normal flow.
   Every piece is its own image. Its place, turn, size and opacity are computed straight from the scroll position,
   each inside its own part of the scroll, so pieces move at different times and speeds and reverse exactly.
   Native scrolling only: no wheel handling, no scroll lock, no timers. Work happens only while the scene is on screen.
   With reduced motion, on short screens, or without this script, nothing is pinned: the settled arrangement from the stylesheet is shown.
   The scroll writes only the outer element of each piece. Idle motion (second part of this file) lives on inner layers and never touches it. */
(function () {
  var sec = document.querySelector('[data-fp-pile]');
  if (!sec || !('IntersectionObserver' in window)) return;
  var stage = sec.querySelector('.fp-pl-stage'), steps = [].slice.call(sec.querySelectorAll('[data-fp-step]')), head = document.querySelector('[data-rt-header]');
  var pcs = [].slice.call(stage.querySelectorAll('.fp-pc')).map(function (el) {
    return { el: el, w: JSON.parse(el.getAttribute('data-k')), n: el.hasAttribute('data-kn') ? JSON.parse(el.getAttribute('data-kn')) : null };
  });
  var roots = [].slice.call(stage.querySelectorAll('.fp-pl-roots path[data-w]')).map(function (el) { var w = el.getAttribute('data-w').split(','); return { el: el, a: +w[0], b: +w[1] }; });
  var calm = matchMedia('(prefers-reduced-motion: reduce)'), wide = matchMedia('(min-width:1181px)');
  var live = false, on = false, frame = 0, T = [], U = 1, shown = -1;
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  /* what has happened so far, for the idle motion: lines drawn, Finance has its sheet, Sales has its sheet */
  var was = '', mark = function (a, b, c) { var k = (a ? 'st-roots ' : '') + (b ? 'st-fin ' : '') + (c ? 'st-sal' : ''); if (k === was) return; was = k; stage.classList.toggle('st-roots', a); stage.classList.toggle('st-fin', b); stage.classList.toggle('st-sal', c); };
  var measure = function () {
    var r = stage.getBoundingClientRect(), W = r.width, H = r.height, hh = head.offsetHeight, top = pageYOffset;
    U = wide.matches ? Math.min(W / 100, H / 80) : Math.min(W / 76, H / 62);                       /* one board unit in pixels; the same rule is in the stylesheet */
    var line = wide.matches ? innerHeight * .5 : hh + H + (innerHeight - hh - H) * .4;            /* where a statement is read: mid screen, or the clear space under the pinned stage */
    T = [0];
    steps.forEach(function (el) {
      var q = (wide.matches ? el : el.firstElementChild).getBoundingClientRect();                  /* narrow: the heading sits just under the pinned stage, so a long statement is never covered */
      T.push(Math.max(T[T.length - 1] + 1, wide.matches ? q.top + top + q.height / 2 - line : q.top + top - (hh + H + 26)));
    });
    var st = sec.getBoundingClientRect().top + top;
    T[0] = wide.matches ? Math.min(Math.max(st - innerHeight * .55, T[1] - innerHeight * .8), T[1] - innerHeight * .3) : T[1] - innerHeight * .46;   /* the records start gathering once the stage is in view, and are together when the first statement is read */
  };
  var paint = function () {
    frame = 0; if (!live) return;
    var y = pageYOffset, n = 0, big = wide.matches; while (n < T.length - 2 && y >= T[n + 1]) n++;
    var f = clamp((y - T[n]) / (T[n + 1] - T[n]), 0, 1);
    for (var i = 0; i < pcs.length; i++) {
      var p = pcs[i], d = big ? p.w : p.n; if (!d) continue;
      var a = d.k[n], b = d.k[n + 1], w = d.t[n], e = clamp((f - w[0]) / (w[1] - w[0]), 0, 1); e = e * e * (3 - 2 * e);
      var x = (a[0] + (b[0] - a[0]) * e) * U, yy = (a[1] + (b[1] - a[1]) * e) * U, o = d.b === n ? clamp(e * 6, 0, 1) * clamp((1 - e) * 4, 0, 1) : b[4] < a[4] ? a[4] + (b[4] - a[4]) * clamp((e - .6) / .4, 0, 1) : a[4] + (b[4] - a[4]) * clamp(e * 2.5, 0, 1);   /* appear early, leave late; a piece marked b is seen only while it travels */
      p.el.style.transform = 'translate(-50%,-50%) translate3d(' + x.toFixed(1) + 'px,' + yy.toFixed(1) + 'px,0) rotate(' + (a[2] + (b[2] - a[2]) * e).toFixed(2) + 'deg) scale(' + (a[3] + (b[3] - a[3]) * e).toFixed(4) + ')';
      p.el.style.opacity = o.toFixed(3);
    }
    for (i = 0; i < roots.length; i++) {                                                        /* each line is drawn as its record arrives, and stays */
      var r = roots[i], g = n > 0 ? 1 : clamp((f - r.a) / (r.b - r.a), 0, 1);
      r.el.style.strokeDashoffset = (1 - g * g * (3 - 2 * g)).toFixed(3);
    }
    var cap = n === 0 ? (f < .7 ? 0 : 1) : n === 1 ? (f < .3 ? 1 : 2) : n === 2 ? (f < .04 ? 2 : 3) : 3;   /* one caption for the event on screen */
    if (cap !== shown) { shown = cap; stage.setAttribute('data-cap', cap); }
    mark(n >= 1 || f > .99, n > 1 || (n === 1 && f > .68), n > 1 || (n === 1 && f > .97));
  };
  var tick = function () { if (!frame) frame = requestAnimationFrame(paint); };
  var io = new IntersectionObserver(function (es) {
    var vis = es[es.length - 1].isIntersecting; if (vis === on) return; on = vis;
    if (on) { addEventListener('scroll', tick, { passive: true }); tick(); } else removeEventListener('scroll', tick);
  });
  var setLive = function () {
    /* pinned and moving only when the stage and a whole statement fit together; short or zoomed screens keep the settled picture in normal flow */
    var want = !calm.matches && (wide.matches ? innerHeight >= 600 : innerHeight - head.offsetHeight >= 520);
    if (want === live) return; live = want;
    sec.classList.toggle('is-live', live);
    if (live) { measure(); io.observe(sec); tick(); }
    else { io.unobserve(sec); removeEventListener('scroll', tick); on = false; pcs.forEach(function (p) { p.el.style.transform = ''; p.el.style.opacity = ''; }); roots.forEach(function (r) { r.el.style.strokeDashoffset = ''; }); stage.removeAttribute('data-cap'); shown = -1; mark(true, true, true); }
  };
  var relay = function () { setLive(); if (live) { measure(); tick(); } };
  addEventListener('resize', relay); addEventListener('load', relay);
  if (wide.addEventListener) { wide.addEventListener('change', relay); calm.addEventListener('change', setLive); }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(relay);
  mark(true, true, true);   /* the settled picture has everything in place; setLive below takes over when the scene is pinned */
  setLive();
})();

/* Idle motion, f18: the tree and the scene keep working quietly while the visitor is still.
   This part only decides WHEN: it sets .is-amb on a stage while that stage is on screen, the tab is visible, motion is allowed and the visitor has not paused it.
   The motion itself is in the stylesheet, on inner layers only. A pause button on each stage stops both at once; the choice lasts for the visit. */
(function () {
  if (!('IntersectionObserver' in window)) return;
  var stages = [].slice.call(document.querySelectorAll('.fp-hero17, .fp-pl-stage')); if (!stages.length) return;
  var calm = matchMedia('(prefers-reduced-motion: reduce)'), off = false, ready = false, seen = [], btns = [];
  try { off = sessionStorage.getItem('fp-amb') === 'off'; } catch (e) {}
  var apply = function () {
    stages.forEach(function (el, i) { el.classList.toggle('is-amb', ready && !off && !calm.matches && !document.hidden && !!seen[i]); });
    btns.forEach(function (b) { b.hidden = calm.matches; b.classList.toggle('is-off', off); b.setAttribute('aria-label', off ? 'Play background motion' : 'Pause background motion'); b.title = off ? 'Play background motion' : 'Pause background motion'; });
  };
  stages.forEach(function (el) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'fp-amb-btn'; b.innerHTML = '<i aria-hidden="true"></i>';
    b.addEventListener('click', function () { off = !off; try { sessionStorage.setItem('fp-amb', off ? 'off' : 'on'); } catch (e) {} apply(); });
    el.appendChild(b); btns.push(b);
  });
  var io = new IntersectionObserver(function (es) { es.forEach(function (e) { seen[stages.indexOf(e.target)] = e.isIntersecting; }); apply(); }, { threshold: .2 });
  stages.forEach(function (el) { io.observe(el); });
  document.addEventListener('visibilitychange', apply);
  if (calm.addEventListener) calm.addEventListener('change', apply);
  apply();
  setTimeout(function () { ready = true; apply(); }, 3400);   /* after the tree's one arrival light has finished */
})();
