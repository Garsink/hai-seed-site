(() => {
  // Old shared links remain useful, but never move a visitor away from a real
  // section that exists in D or send them into another website version.
  const homeAliases = {
    '#film':'/how-it-works/#film', '#ask':'/results/#stories', '#origin':'/about/#origin', '#offer':'/pricing/',
    '#comparison':'/how-it-works/#route', '#hai-root':'/how-it-works/#root', '#hai-kernel':'/how-it-works/#kernel', '#hai-crown':'/how-it-works/#crown',
    '#lab':'/about/', '#teams':'/how-it-works/#by-team', '#structure':'/how-it-works/#route', '#shared':'/how-it-works/#root',
    '#teach':'/how-it-works/#setup', '#agents':'/how-it-works/#control', '#email':'/how-it-works/#control', '#grow-home':'/#get-started',
    '#sc-run':'/results/#sc-run', '#sc-grow':'/results/#sc-grow', '#sc-buy':'/results/#sc-buy', '#sc-cash':'/results/#sc-cash', '#sc-cause':'/results/#sc-cause', '#sc-deal':'/results/#sc-deal'
  };
  const resultAliases = {
    '#costs':'/results/#operations', '#costs-h':'/results/#operations', '#negotiation':'/results/#operations', '#negotiation-h':'/results/#operations',
    '#origin':'/about/#origin', '#origin-h':'/about/#origin', '#control':'/how-it-works/#control', '#control-h':'/how-it-works/#control', '#weekly-h':'/results/#weekly'
  };
  function revealOrMove() {
    let id; try { id=decodeURIComponent(location.hash.slice(1)); } catch { return; }
    if (!id) return;
    const target=document.getElementById(id);
    if (target) {
      let parent=target, opened=false;
      while(parent){ if(parent.tagName==='DETAILS'&&!parent.open){parent.open=true;opened=true;} parent=parent.parentElement; }
      if(opened)target.scrollIntoView({block:'start',behavior:'instant'});
      return;
    }
    const path=location.pathname.replace(/\/index\.html$/, '').replace(/\/$/,'') || '/';
    const destination=path==='/'?homeAliases[location.hash]:path==='/results'?resultAliases[location.hash]:null;
    if(destination)location.replace(destination);
  }
  addEventListener('hashchange',revealOrMove);
  revealOrMove();
})();
