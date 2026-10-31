/* Progressive enhancement: native details without JS, one selected story with it. */
(() => {
  const reader = document.querySelector('.d-results-reader');
  if (!reader) return;
  const examples = [...reader.querySelectorAll('[data-example]')];
  const controls = reader.querySelector('.d-example-controls');
  const links = [...reader.querySelectorAll('[data-example-link]')];
  const select = reader.querySelector('#d-example-select');
  const announcement = reader.querySelector('[data-example-announcement]');
  if (!examples.length || !controls || !select || links.length !== examples.length) return;

  const byId = new Map(examples.map(example => [example.id, example]));
  const stateKey = 'haiResultsExample';
  let selected = null;

  const addressTarget = () => {
    try {
      return document.getElementById(decodeURIComponent(location.hash.slice(1)));
    } catch {
      return null;
    }
  };
  const exampleFor = target => {
    const example = target && target.closest('[data-example]');
    return example && byId.has(example.id) ? example : null;
  };
  const show = (example, announce = false) => {
    if (!example) return;
    const changed = selected !== example;
    examples.forEach(item => {
      item.hidden = item !== example;
      item.open = item === example;
    });
    links.forEach(link => {
      if (link.dataset.exampleLink === example.id) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
    select.value = example.id;
    select.setAttribute('aria-controls', example.id);
    selected = example;
    if (announce && changed && announcement) {
      announcement.textContent = `Showing: ${example.querySelector('.d-example-question').textContent.trim()}`;
    }
  };
  const remember = (method, example, url) => {
    const current = history.state && typeof history.state === 'object' ? history.state : {};
    history[method]({...current, [stateKey]: example.id}, '', url);
  };
  const choose = id => {
    const example = byId.get(id);
    if (!example) return;
    show(example, true);
    if (location.hash !== `#${id}`) remember('pushState', example, `#${id}`);
  };
  const revealTarget = (target, scroll) => {
    const example = exampleFor(target);
    if (!example) return false;
    show(example);
    let ancestor = target;
    while (ancestor && ancestor !== reader) {
      if (ancestor.tagName === 'DETAILS') ancestor.open = true;
      ancestor = ancestor.parentElement;
    }
    if (scroll) {
      const visibleTarget = target.matches('.sc-name, .sc-docname, summary') ? example : target;
      visibleTarget.scrollIntoView({block: 'start', behavior: 'instant'});
    }
    return true;
  };

  const initialTarget = addressTarget();
  const initialExample = exampleFor(initialTarget) || byId.get(history.state?.[stateKey]) || examples[0];
  show(initialExample);
  examples.forEach(example => { example.querySelector(':scope > summary').hidden = true; });
  reader.classList.add('is-enhanced');
  controls.hidden = false;
  remember('replaceState', initialExample, location.href);
  if (initialTarget) revealTarget(initialTarget, false);

  links.forEach(link => link.addEventListener('click', event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    choose(link.dataset.exampleLink);
  }));
  select.addEventListener('change', () => choose(select.value));

  // Hash links also work for headings/evidence within a case. Shared route scripts
  // may open details first; this handler makes the owning story visible before scrolling.
  addEventListener('hashchange', () => {
    if (!revealTarget(addressTarget(), true)) {
      const restored = byId.get(history.state?.[stateKey]);
      if (restored) show(restored);
    }
  });
  addEventListener('popstate', () => {
    const restored = exampleFor(addressTarget()) || byId.get(history.state?.[stateKey]);
    if (restored) show(restored);
  });

  // Initial deep links settle after fonts and page layout, unless the user has
  // already started navigating. No later resize or scroll can replay this jump.
  if (exampleFor(initialTarget)) {
    let cancelled = false;
    const cancel = () => { cancelled = true; cleanup(); };
    const events = ['pointerdown', 'touchstart', 'wheel', 'keydown'];
    const cleanup = () => events.forEach(type => removeEventListener(type, cancel, true));
    events.forEach(type => addEventListener(type, cancel, {capture: true, passive: true}));
    const initialHash = location.hash;
    const settle = () => {
      Promise.resolve(document.fonts?.ready).catch(() => {}).then(() => {
        requestAnimationFrame(() => {
          if (!cancelled && location.hash === initialHash) revealTarget(initialTarget, true);
          cleanup();
        });
      });
    };
    if (document.readyState === 'complete') settle();
    else addEventListener('load', settle, {once: true});
  }
})();
