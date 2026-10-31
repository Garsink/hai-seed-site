(() => {
  if (new URLSearchParams(location.search).has('embed')) {
    document.querySelectorAll('[data-review-utility]').forEach(el => el.hidden = true);
    document.documentElement.classList.add('review-embedded');
  }
})();
