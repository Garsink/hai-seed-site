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
})();
