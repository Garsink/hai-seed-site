/* How it works V2: the film starts muted on arrival (unless reduced motion is set or the browser blocks it), with sound, pause,
   restart and full-screen buttons. It pauses when scrolled away and resumes on return only if it had been playing.
   Scenes animate only while on screen. Without this script the page keeps the native video controls and still pictures. */
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var box = document.querySelector('[data-hw-film]');
  if (box) {
    var v = box.querySelector('video'), big = box.querySelector('[data-hw-big]'), ctrl = document.querySelector('[data-hw-ctrl]');
    var lane = document.querySelector('[data-hw-lane]'), snd = lane.querySelector('[data-hw-snd]'), line = lane.querySelector('[data-hw-line]');
    var data = JSON.parse(document.getElementById('hw-cues').textContent), cues = data.cues, cur = -1, used = false, swap = 0;
    var bToggle = ctrl.querySelector('[data-hw-toggle]'), bRestart = ctrl.querySelector('[data-hw-restart]'), bFull = ctrl.querySelector('[data-hw-full]');
    var userPaused = false, autoPaused = false, visible = true;
    v.removeAttribute('controls');
    var label = function (b, t) { b.querySelector('span').textContent = t; };
    var ui = function () {
      var t = v.paused ? 'Play' : 'Pause'; bToggle.setAttribute('aria-label', t); bToggle.title = t; bToggle.classList.toggle('is-paused', v.paused);
      snd.setAttribute('aria-pressed', String(!v.muted));
      snd.setAttribute('aria-label', !used ? 'Watch with sound from the start' : (v.muted ? 'Sound on' : 'Sound off'));
      snd.classList.toggle('is-used', used); snd.classList.toggle('is-muted', v.muted);
      if (used) { var st = v.muted ? 'Sound on' : 'Sound off'; snd.querySelector('.hw-snd-long').textContent = st; snd.querySelector('.hw-snd-short').textContent = v.muted ? 'On' : 'Off'; }
    };
    var showBig = function (t) { label(big, t); big.hidden = false; };
    var play = function () {
      var p = v.play(); big.hidden = true;
      if (p && p.catch) p.catch(function (err) { if (err && err.name === 'NotAllowedError') { showBig(v.muted ? 'Play the film' : 'Play with sound'); ui(); } });
    };
    ['play', 'pause', 'volumechange'].forEach(function (e) { v.addEventListener(e, ui); });
    v.addEventListener('playing', function () { if (!visible && !fsEl()) { autoPaused = true; v.pause(); } });   /* a play that resolves after the visitor scrolled away */
    v.addEventListener('ended', function () { showBig('Watch again'); ui(); });
    big.addEventListener('click', function () { if (v.ended) v.currentTime = 0; v.muted = false; used = true; userPaused = false; play(); });
    /* first press: the story from the start, with sound. After that the same button only turns sound on or off. */
    snd.addEventListener('click', function () {
      if (!used) { used = true; v.muted = false; v.currentTime = 0; userPaused = false; play(); }
      else { v.muted = !v.muted; if (!v.muted && v.paused) { userPaused = false; play(); } }
      ui();
    });
    /* key messages: the line whose start time has passed; it holds until the next one. Same text with or without sound. */
    var show = function () {
      var t = v.currentTime, i = 0;
      while (i + 1 < cues.length && cues[i + 1][0] <= t + 0.05) i++;
      if (i === cur) return;
      cur = i; clearTimeout(swap);
      if (reduce) { line.textContent = cues[i][1]; return; }
      line.classList.add('is-out');
      swap = setTimeout(function () { line.textContent = cues[i][1]; line.classList.remove('is-out'); }, 180);
    };
    ['timeupdate', 'seeked', 'loadedmetadata'].forEach(function (e) { v.addEventListener(e, show); });
    lane.hidden = false; line.textContent = cues[0][1];
    bToggle.addEventListener('click', function () { if (v.paused) { userPaused = false; play(); } else { userPaused = true; v.pause(); } });
    bRestart.addEventListener('click', function () { v.currentTime = 0; userPaused = false; play(); });
    /* full screen: the video element itself, with the browser's own controls while in full screen; they go away again on exit.
       If the browser refuses, the native controls stay on the player so its own full-screen button can be used. */
    var fsEl = function () { return document.fullscreenElement || document.webkitFullscreenElement; };
    var fallback = function () { v.controls = true; };
    bFull.addEventListener('click', function () {
      v.controls = true;
      try {
        if (v.requestFullscreen) { var p = v.requestFullscreen(); if (p && p.catch) p.catch(fallback); }
        else if (v.webkitRequestFullscreen) v.webkitRequestFullscreen();
        else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen();
        else fallback();
      } catch (err) { fallback(); }
    });
    var onFs = function () { if (!fsEl()) v.controls = false; ui(); };
    document.addEventListener('fullscreenchange', onFs); document.addEventListener('webkitfullscreenchange', onFs);
    v.addEventListener('webkitendfullscreen', function () { v.controls = false; ui(); });   /* iPhone native player */
    if (reduce) showBig('Play the film'); else play();
    ui();
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) {
      var e = es[es.length - 1]; visible = e.isIntersecting;
      if (!e.isIntersecting && !v.paused && !fsEl()) { autoPaused = true; v.pause(); }
      else if (e.isIntersecting && autoPaused && !userPaused && !fsEl()) { autoPaused = false; play(); }
    }, { threshold: 0.25 }).observe(box);
  }
  /* scenes: run their small motions only on screen; the Kernel tags light as the travelling light passes them */
  var scenes = document.querySelectorAll('.hw-vis');
  var kernel = document.querySelector('.hw-v-kernel'), ksvg = kernel && kernel.querySelector('svg'), tags = kernel ? kernel.querySelectorAll('.hw-tag.hw-st') : [], raf = 0;
  var tick = function () {
    var t = (ksvg.getCurrentTime() % 8) / 8, on = Math.floor(((t + 0.06) % 1) * 4);
    for (var i = 0; i < tags.length; i++) tags[i].classList.toggle('is-on', i === on && ((t + 0.06) % 0.25) < 0.16);
    raf = requestAnimationFrame(tick);
  };
  var set = function (el, live) {
    el.classList.toggle('is-live', live);
    var s = el.querySelector('svg');
    if (s && s.pauseAnimations) { if (live && !reduce) s.unpauseAnimations(); else s.pauseAnimations(); }
    if (el === kernel && !reduce) { cancelAnimationFrame(raf); if (live) raf = requestAnimationFrame(tick); else for (var i = 0; i < tags.length; i++) tags[i].classList.remove('is-on'); }
  };
  [].forEach.call(scenes, function (el) { set(el, false); });
  if (!('IntersectionObserver' in window)) { [].forEach.call(scenes, function (el) { set(el, true); }); return; }
  var io = new IntersectionObserver(function (es) { es.forEach(function (e) { set(e.target, e.isIntersecting); }); }, { threshold: 0.2 });
  [].forEach.call(scenes, function (el) { io.observe(el); });
})();
