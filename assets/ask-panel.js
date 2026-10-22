(() => {
  const root = document.getElementById('ask');
  if (!root) return;
  const chips = [...root.querySelectorAll('.ask-chip')];
  const panels = [...root.querySelectorAll('.ask-answer')];
  if (!chips.length || chips.length !== panels.length) return;
  function show(i) {
    chips.forEach((c, k) => { const on = k === i; c.setAttribute('aria-pressed', String(on)); c.classList.toggle('is-on', on); });
    panels.forEach((p, k) => { p.hidden = k !== i; });
  }
  chips.forEach((c, i) => c.addEventListener('click', () => show(i)));
  root.addEventListener('keydown', e => {
    const i = chips.indexOf(document.activeElement);
    if (i < 0) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); chips[(i + 1) % chips.length].focus(); show((i + 1) % chips.length); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); chips[(i - 1 + chips.length) % chips.length].focus(); show((i - 1 + chips.length) % chips.length); }
  });
  show(0);
})();
