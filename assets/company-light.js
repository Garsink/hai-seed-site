// A brief first-view cue only. The page is fully usable with no JavaScript.
(() => {
  const layer = document.querySelector('.hero-light');
  const photo = document.querySelector('.hero-photo img');
  if (!layer || !photo) return;
  const eligible = matchMedia('(min-width: 801px) and (prefers-reduced-motion: no-preference)');
  if (!eligible.matches) return;
  const key = 'hai-company-light-20261023';
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, 'seen');
  } catch { return; }
  let cancelled = false;
  const stop = () => { cancelled = true; layer.classList.remove('is-playing'); };
  const onPreference = () => { if (!eligible.matches) stop(); };
  eligible.addEventListener('change', onPreference);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); }, { once: true });
  const inView = new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting) stop();
  });
  inView.observe(photo);
  const timeout = setTimeout(stop, 2500);
  photo.decode().then(() => {
    clearTimeout(timeout);
    if (cancelled || !eligible.matches || document.hidden) return;
    setTimeout(() => {
      if (cancelled || !eligible.matches || document.hidden) return;
      layer.classList.add('is-playing');
      setTimeout(() => {
        stop(); inView.disconnect(); eligible.removeEventListener('change', onPreference);
      }, 1450);
    }, 400);
  }).catch(() => { clearTimeout(timeout); stop(); inView.disconnect(); });
})();
