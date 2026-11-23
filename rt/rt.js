/* HAI Seed rethink preview, 2026-11-20. Header menu, header theme over the film, manual tabs. No scroll effects. */
(function () {
  var head = document.querySelector('[data-rt-header]');
  if (head) {
    var btn = head.querySelector('.rt-menu-btn'), menu = document.getElementById('rt-menu');
    var setOpen = function (open) {
      menu.hidden = !open; btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.textContent = open ? 'Close' : 'Menu'; head.classList.toggle('is-open', open);
    };
    if (btn && menu) {
      btn.addEventListener('click', function () { setOpen(menu.hidden); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) { setOpen(false); btn.focus(); } });
      document.addEventListener('click', function (e) { if (!menu.hidden && !menu.contains(e.target) && !head.contains(e.target)) setOpen(false); });
    }
    var hero = document.querySelector('.hero.has-film'), frame = 0;
    var paint = function () {
      frame = 0;
      head.classList.toggle('is-scrolled', scrollY > 8);
      if (hero) head.classList.toggle('is-over', scrollY <= 8); /* opaque as soon as the page moves, so it never sits on the hero's bottom strip */
    };
    paint();
    addEventListener('scroll', function () { if (!frame) frame = requestAnimationFrame(paint); }, { passive: true });
    addEventListener('resize', paint);
  }

  /* Tabs: buttons choose one panel. Without this script every panel is shown in order. */
  [].forEach.call(document.querySelectorAll('[data-rt-tabs]'), function (root) {
    var tabs = [].slice.call(root.querySelectorAll('.rt-tab')), panels = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });
    var wideOnly = root.getAttribute('data-rt-tabs') === 'wide', narrow = matchMedia('(max-width:820px)');
    var current = Math.max(0, tabs.findIndex(function (t) { return t.hasAttribute('data-rt-start'); }));
    var render = function () {
      var off = wideOnly && narrow.matches; /* phones read the whole case in order */
      tabs.forEach(function (t, n) {
        t.setAttribute('aria-selected', n === current ? 'true' : 'false'); t.tabIndex = n === current ? 0 : -1;
        panels[n].hidden = !off && n !== current;
      });
    };
    root.rtShow = function (n, snap) { root.classList.toggle('is-snap', !!snap); current = n; render(); };
    tabs.forEach(function (t, n) {
      t.addEventListener('click', function (e) { root.rtShow(n, e.detail === 0); });
      t.addEventListener('keydown', function (e) {
        var to = null, k = e.key;
        if (k === 'ArrowRight' || k === 'ArrowDown') to = (n + 1) % tabs.length;
        else if (k === 'ArrowLeft' || k === 'ArrowUp') to = (n - 1 + tabs.length) % tabs.length;
        else if (k === 'Home') to = 0; else if (k === 'End') to = tabs.length - 1;
        if (to === null) return;
        e.preventDefault(); root.rtShow(to, true); tabs[to].focus();
      });
    });
    narrow.addEventListener('change', render);
    root.classList.add('is-js'); render();
  });

  /* Old shared links keep working: an old section name is sent to where that content now lives. */
  var path = location.pathname.replace(/index\.html$/, '').replace(/\/$/, '') || '/';
  var W = '/results/worked-examples/', HOW = '/how-it-works/';
  var ALIAS = {
    '/': { film: HOW + '#story', ask: '/results/#highlights', origin: '/about/#origin', offer: '/pricing/', comparison: HOW + '#control', 'hai-root': HOW + '#control', 'hai-kernel': HOW + '#control', 'hai-crown': HOW + '#control',
      lab: '/about/', teams: HOW + '#setup', structure: HOW + '#control', shared: HOW + '#control', teach: HOW + '#setup', agents: HOW + '#control', email: HOW + '#control', 'grow-home': '#start',
      'sc-run': W + '#sc-run', 'sc-grow': W + '#sc-grow', 'sc-buy': W + '#sc-buy', 'sc-cash': W + '#sc-cash', 'sc-cause': W + '#sc-cause', 'sc-deal': W + '#sc-deal',
      'case': '/results/#case', 'in-action': '/results/#case', 'home-results': '#proof', real: '#proof', 'what-it-does': '#start', 'get-started': '#start', how: '#start', questions: '#start', intro: '#hero' },
    '/results': { stories: '#highlights', 'stories-h': '#highlights', 'more-h': '#more', weekly: W + '#weekly', 'weekly-h': W + '#weekly',
      'sc-run': W + '#sc-run', 'sc-grow': W + '#sc-grow', 'sc-buy': W + '#sc-buy', 'sc-cash': W + '#sc-cash', 'sc-cause': W + '#sc-cause', 'sc-deal': W + '#sc-deal',
      costs: '#operations', 'costs-h': '#operations', negotiation: '#operations', 'negotiation-h': '#operations', origin: '/about/#origin', 'origin-h': '/about/#origin', control: HOW + '#control', 'control-h': HOW + '#control' },
    '/results/worked-examples': { stories: '/results/#highlights', more: '/results/#more' },
    '/how-it-works': { memory: '#control', root: '#inside', kernel: '#inside', crown: '#inside', route: '#inside', 'by-team': '#setup', review: '#day', daily: '#day' },
    '/about': { 'lab-practice': '#lab', 'about-aviation': '#aviation', 'about-introduction': '#main' }
  };
  /* A link to one result opens its area and the result itself. */
  var reveal = function () {
    var id; try { id = decodeURIComponent(location.hash.slice(1)); } catch (e) { return; }
    if (!id) return;
    var el = document.getElementById(id) || document.querySelector('.rt-lib [data-wow-id="' + id.toUpperCase().replace(/[^A-Z0-9]/g, '') + '"]');
    if (!el) {
      var to = (ALIAS[path] || {})[id] || ((/-h$/.test(id) && document.getElementById(id.slice(0, -2))) ? '#' + id.slice(0, -2) : null);
      if (to) location.replace(to.charAt(0) === '#' ? to : to.replace('#', location.search + '#').replace(/^([^#]*)$/, '$1' + location.search)); /* the visitor's source tag travels along */
      return;
    }
    var panel = el.closest('.rt-panel'), root = el.closest('[data-rt-tabs]');
    if (panel && root && root.rtShow) {
      var i = [].indexOf.call(root.querySelectorAll('.rt-panel'), panel); if (i > -1) root.rtShow(i, true);
    }
    for (var d = el; d; d = d.parentElement) if (d.tagName === 'DETAILS') d.open = true;
    el.scrollIntoView();
  };
  addEventListener('hashchange', reveal);
  if (location.hash) (document.readyState === 'complete' ? reveal() : addEventListener('load', reveal));
})();

/* HAI Seed full preview: "On this page" row shows the section in view. */
(function () {
  var nav = document.querySelector('[data-fp-local]');
  if (!nav || !('IntersectionObserver' in window)) return;
  var links = [].filter.call(nav.querySelectorAll('a'), function (a) { return a.getAttribute('href').charAt(0) === '#'; });
  var secs = links.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
  var frame = 0;
  var mark = function () {
    frame = 0;
    var bar = getComputedStyle(nav).position === 'sticky' ? nav : document.querySelector('[data-rt-header]');
    var line = bar.getBoundingClientRect().bottom + 24, on = -1;
    secs.forEach(function (s, n) { if (s && s.getBoundingClientRect().top <= line) on = n; });
    links.forEach(function (a, n) { if (n === on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); });
  };
  addEventListener('scroll', function () { if (!frame) frame = requestAnimationFrame(mark); }, { passive: true });
  addEventListener('resize', mark); addEventListener('hashchange', function () { setTimeout(mark, 60); });
  mark();
})();
