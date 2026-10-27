(() => {
  const oldHomeLinks = {'#film':'/how-it-works/#film','#ask':'/use-cases/#cases','#origin':'/about/#origin','#offer':'/pricing/#pricing'};
  if (location.pathname === '/' && oldHomeLinks[location.hash]) {
    location.replace(oldHomeLinks[location.hash]); return;
  }
  const oldResultsLinks = {
    '#costs':'/use-cases/#q-service-cost','#costs-h':'/use-cases/#q-service-cost',
    '#negotiation':'/use-cases/#q-negotiate','#negotiation-h':'/use-cases/#q-negotiate',
    '#origin':'/about/#origin','#origin-h':'/about/#origin',
    '#control':'/how-it-works/#control','#control-h':'/how-it-works/#control',
    '#weekly-h':'/results/#weekly'
  };
  const moveOldResult = () => {
    if (!['/results','/results/','/results/index.html'].includes(location.pathname)) return false;
    let hash; try { hash = decodeURIComponent(location.hash); } catch (_) { return false; }
    if (!oldResultsLinks[hash]) return false;
    location.replace(oldResultsLinks[hash]); return true;
  };
  if (moveOldResult()) return;
  window.addEventListener('hashchange', moveOldResult);
  const movedTeamHash = /^#(?:teams(?:-h)?|team-(?:leadership|marketing|sales|procurement|hr|legal|finance)|review-(?:comment|input)-start-here-teams)$/;
  if (location.pathname.replace(/\/$/,'') === '/start-here' && movedTeamHash.test(location.hash)) {
    location.replace('/use-cases/' + (location.hash.startsWith('#review-') ? '#teams' : location.hash));
    return;
  }
  function revealHashTarget() {
    let id; try { id = decodeURIComponent(location.hash.slice(1)); } catch (_) { return; }
    const target = document.getElementById(id);
    if (!target) return;
    let parent = target.parentElement;
    let opened = false;
    while (parent) { if (parent.tagName === 'DETAILS' && !parent.open) { parent.open = true; opened = true; } parent = parent.parentElement; }
    if (opened) target.scrollIntoView({block:'start',behavior:'instant'});
  }
  window.addEventListener('hashchange', revealHashTarget);
  revealHashTarget();
})();
