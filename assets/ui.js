(() => {
  const header = document.querySelector('.site-header');
  const button = document.querySelector('.nav-toggle');
  const menu = document.getElementById('nav-menu');
  if (!header || !button || !menu) return;
  let open = false;
  function setOpen(next, returnFocus = false) {
    open = next;
    header.classList.toggle('is-open', open);
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    button.querySelector('.menu-label').textContent = open ? 'Close' : 'Menu';
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
