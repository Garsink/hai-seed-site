(() => {
  function revealHash() {
    if (!window.location.hash) return;
    let id;
    try {
      id = decodeURIComponent(window.location.hash.slice(1));
    } catch {
      return;
    }
    const target = document.getElementById(id);
    if (!target) return;

    const disclosures = [];
    for (let node = target; node; node = node.parentElement) {
      if (node.tagName === 'DETAILS') disclosures.push(node);
    }
    // Open from the outside in, including a target that is itself <details>.
    disclosures.reverse().forEach(details => { details.open = true; });
    // CSS owns the offset for the site header and the guide navigation.
    target.scrollIntoView({ block: 'start', behavior: 'auto' });
  }

  window.addEventListener('hashchange', revealHash);
  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest?.('a[href]');
    if (!link) return;
    const url = new URL(link.href, window.location.href);
    // A repeated link to the same hash emits no hashchange, but its panel may
    // have been closed manually. Keep normal link navigation and history.
    if (url.origin === window.location.origin && url.pathname === window.location.pathname
        && url.search === window.location.search && url.hash === window.location.hash) revealHash();
  });
  // Deferred scripts may run before image/font layout finishes on a cold load.
  // Reapply the same initial destination after load, without altering history.
  const initialHash = window.location.hash;
  window.addEventListener('load', () => {
    if (window.location.hash === initialHash) revealHash();
  }, { once: true });
  revealHash();
})();
