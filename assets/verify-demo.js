(() => {
  const root = document.getElementById('verify');
  if (!root) return;
  const grid = root.querySelector('.jobs');
  const btn = root.querySelector('#verify-run');
  const summary = root.querySelector('#verify-summary');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Illustrative jobs. The three failures are real audit findings, anonymised.
  const JOBS = [
    { name: 'Morning brief',          ran: '06:30', verdict: 'nobody', evidence: 'Report written every day. Its only reader was retired in July. Readers since: 0.' },
    { name: 'Supplier chase',         ran: '06:41', verdict: 'ok',     evidence: 'Three suppliers emailed. Two replies logged by 09:15, one chased again.' },
    { name: 'Quote re-draft',         ran: '07:00', verdict: 'wrong',  evidence: '27 quotes held for re-draft. The re-draft step never runs. Oldest: 45 days.' },
    { name: 'Cash alert',             ran: '20:00', verdict: 'ok',     evidence: 'Alert sent. Delivery confirmed in the relay record 308 ms later.' },
    { name: 'Procurement data feed',  ran: '00:01', verdict: 'wrong',  evidence: 'Status: ok. Newest row: 122 days old. Still used live by the customer brief.' },
    { name: 'Customer quote',         ran: '10:12', verdict: 'ok',     evidence: 'Sent under the arming rule. Price above floor. Account not flagged manual.' },
    { name: 'Meeting minutes',        ran: '14:05', verdict: 'ok',     evidence: 'Attendance taken from the recording. Two follow-ups assigned to owners.' },
    { name: 'Inbox triage',           ran: '08:15', verdict: 'ok',     evidence: '41 messages read. 6 routed to owners. 35 archived, each with a reason.' },
  ];
  const LABEL = { ok: 'Verified', wrong: 'Wrong', nobody: 'Reached nobody' };

  const el = (tag, cls, txt) => { const n = document.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; };

  function build() {
    grid.textContent = '';
    JOBS.forEach((j, i) => {
      const card = el('article', 'job'); card.dataset.i = i;
      const head = el('div', 'job-head');
      head.append(el('h3', null, j.name));
      const pill = el('span', 'pill pill-green', 'OK · exit 0 · ' + j.ran);
      head.append(pill);
      card.append(head);
      card.append(el('p', 'job-evidence', 'Status page: finished without error.'));
      grid.append(card);
    });
    summary.textContent = '';
    btn.disabled = false; btn.textContent = 'Verify against the source';
  }

  const wait = ms => new Promise(r => setTimeout(r, reduced ? 0 : ms));

  async function run() {
    btn.disabled = true; btn.textContent = 'Verifying…';
    const cards = [...grid.querySelectorAll('.job')];
    for (const card of cards) {
      const pill = card.querySelector('.pill');
      pill.className = 'pill pill-wait'; pill.textContent = 'Reading the artefact…';
      card.querySelector('.job-evidence').textContent = 'Opening the folder, the reader log, the feed timestamp, the relay record.';
    }
    let bad = 0;
    for (const card of cards) {
      await wait(420);
      const j = JOBS[card.dataset.i];
      const pill = card.querySelector('.pill');
      pill.className = 'pill pill-' + (j.verdict === 'ok' ? 'green' : 'red');
      pill.textContent = LABEL[j.verdict];
      card.classList.toggle('job-bad', j.verdict !== 'ok');
      card.querySelector('.job-evidence').textContent = j.evidence;
      if (j.verdict !== 'ok') bad++;
    }
    await wait(300);
    summary.textContent = '';
    summary.append(el('strong', null, `${JOBS.length} jobs reported success. ${bad} were wrong or reached nobody.`));
    summary.append(el('span', null, ' Not one had thrown an error. Across the whole layer on 2 September: 311 evaluations, 102 findings.'));
    btn.disabled = false; btn.textContent = 'Reset';
    btn.dataset.mode = 'reset';
  }

  btn.addEventListener('click', () => {
    if (btn.dataset.mode === 'reset') { btn.dataset.mode = ''; build(); return; }
    run();
  });
  build();
})();
