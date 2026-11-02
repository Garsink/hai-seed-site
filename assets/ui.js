(() => {
  const header = document.querySelector('.site-header');
  const button = document.querySelector('.nav-toggle');
  const menu = document.getElementById('nav-menu');
  if (!header || !button || !menu) return;
  let open = false;
  // The labels follow the page language (Lithuanian pages ship their own; this kept resetting them to English).
  const words = document.documentElement.lang === 'lt'
    ? {open: 'Atidaryti meniu', close: 'Uždaryti meniu', menu: 'Meniu', closeShort: 'Uždaryti'}
    : {open: 'Open menu', close: 'Close menu', menu: 'Menu', closeShort: 'Close'};
  function setOpen(next, returnFocus = false) {
    open = next;
    header.classList.toggle('is-open', open);
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? words.close : words.open);
    button.querySelector('.menu-label').textContent = open ? words.closeShort : words.menu;
    menu.hidden = !open;
    if (returnFocus) button.focus();
  }
  setOpen(false);
  header.classList.add('nav-ready');
  button.addEventListener('click', () => setOpen(!open));
  menu.addEventListener('click', event => {
    if (event.target.closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && open) setOpen(false, true);
  });
  document.addEventListener('click', event => {
    if (open && !header.contains(event.target)) setOpen(false);
  });
  header.addEventListener('focusout', event => {
    if (open && event.relatedTarget && !header.contains(event.relatedTarget)) setOpen(false);
  });
  // D's desktop links replace the narrow-screen panel. Close it at the same
  // breakpoint so its scroll lock and now-hidden Close control cannot remain.
  if (document.body.classList.contains('d-site')) {
    const desktop = matchMedia('(min-width: 1101px)');
    desktop.addEventListener('change', event => {
      if (!event.matches || !open) return;
      const focused = document.activeElement;
      const restoreFocus = button.contains(focused) || menu.contains(focused);
      const href = focused && focused.closest('a')?.href;
      const destination = [...header.querySelectorAll('.nav-shortcuts a')].find(a => a.href === href)
        || header.querySelector('.header-cta');
      setOpen(false);
      if (restoreFocus && destination) destination.focus({preventScroll: true});
    });
  }
})();
