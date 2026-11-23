
/* HAI Seed full preview, 2026-11-20. Home film chapter: still first, playback only on request,
   pause and replay always visible, paused when off screen or in a hidden tab. */
(function () {
  var box = document.querySelector('[data-fp-film]');
  if (!box) return;
  var stage = box.querySelector('.fp-film-stage'), play = box.querySelector('.fp-play');
  var bar = box.querySelector('.fp-film-bar'), toggle = bar.querySelector('[data-fp-toggle]'), again = bar.querySelector('[data-fp-replay]');
  var state = bar.querySelector('[data-fp-state]'), label = play.querySelector('span');
  var video = null, away = false, parts = [stage.getAttribute('data-src'), stage.getAttribute('data-src-2')].filter(Boolean), part = 0;
  var say = function (t) { state.textContent = t; };
  var show = function (playing) {
    box.classList.toggle('is-playing', playing);
    toggle.textContent = playing && video && !video.paused ? 'Pause' : 'Play';
  };
  var fail = function () {
    box.classList.remove('is-playing'); box.classList.add('is-ended');
    toggle.hidden = true; again.hidden = true;
    say('The film could not load here. The page explains the same thing in words.');
    if (video) { video.remove(); video = null; }
  };
  /* A play request that is interrupted (pause, scrolling away, a resize, a new source) is normal, not a failure.
     Only a real media error, or a refusal that is not an interruption, ends the attempt. */
  var go = function () {
    var p = video.play();
    if (p && p.catch) p.catch(function (e) {
      if (!video) return;
      if (e && (e.name === 'AbortError' || e.name === 'NotAllowedError')) { toggle.textContent = 'Play'; say('Paused.'); return; }
      fail();
    });
  };
  var start = function () {
    if (!video) {
      video = document.createElement('video');
      video.playsInline = true; video.muted = true; video.preload = 'auto';
      video.setAttribute('aria-label', stage.getAttribute('data-label'));
      video.addEventListener('ended', function () {
        if (part < parts.length - 1) { part += 1; video.src = parts[part]; go(); return; } /* the growth, then the people around the tree, once */
        box.classList.remove('is-playing'); box.classList.add('is-ended');
        label.textContent = 'Play again'; toggle.hidden = true; again.hidden = true; say('The film has ended.'); /* one control after the end: Play again */
      });
      video.addEventListener('error', function () { if (video && video.error && video.getAttribute('src')) fail(); });
      video.addEventListener('pause', function () { if (!video.ended) { toggle.textContent = 'Play'; say('Paused.'); } });
      video.addEventListener('playing', function () { toggle.textContent = 'Pause'; say('Playing. About 70 seconds, no sound.'); });
      stage.appendChild(video);
    }
    box.classList.remove('is-ended'); toggle.hidden = false; again.hidden = false;
    part = 0; video.src = parts[0]; show(true);
    if (stage.scrollIntoView) stage.scrollIntoView({ block: 'nearest' }); /* on a phone the picture sits under the words */
    go();
  };
  play.addEventListener('click', function () { start(); toggle.focus(); });
  again.addEventListener('click', start);
  toggle.addEventListener('click', function () {
    if (!video) return;
    if (video.paused) go(); else video.pause();
  });
  /* never keeps running where nobody is watching; it does not restart by itself */
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) {
    away = !es[0].isIntersecting; if (away && video && !video.paused) video.pause();
  }, { threshold: 0.15 }).observe(stage);
  document.addEventListener('visibilitychange', function () { if (document.hidden && video && !video.paused) video.pause(); });
})();
