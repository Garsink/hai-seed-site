(() => {
  const root = document.getElementById('ask');
  if (!root) return;

  const questions = [...root.querySelectorAll('[data-question]')];
  const questionList = root.querySelector('.question-list');
  const updateButton = root.querySelector('.next-day');
  const updateSource = root.querySelector('#update-source');
  const sourceCount = root.querySelector('.result-top span:last-child');
  const view = root.querySelector('#demo-view');
  const finding = root.querySelector('#demo-finding');
  const explanation = root.querySelector('#demo-explanation');
  const gap = root.querySelector('#demo-gap');
  const next = root.querySelector('#demo-next');
  const status = root.querySelector('.demo-status');
  const sources = [...root.querySelectorAll('.demo-sources details')];
  const relevance = sources.map(source => source.querySelector('.source-relevance'));
  if (![questionList, updateButton, updateSource, sourceCount, view, finding, explanation, gap, next, status].every(Boolean)
      || sources.length !== 4 || relevance.some(node => !node)
      || !['cost', 'history', 'next'].every(key => questions.some(button => button.dataset.question === key))) return;

  // Prepared fictional answers. No model, external request or saved visitor data.
  const answers = {
    cost: {
      initial: {
        finding: 'The rate stayed the same. The billed quantity increased.',
        explanation: 'April: 8 units × €75 = €600. May: 12 units × €75 = €900. The €300 difference comes from four additional billed units, not a higher unit price.',
        gap: 'The service log is missing. We cannot yet tell whether all 12 units were delivered.',
        next: 'Operations: check the service log. Finance: compare it with the invoice before approving payment.'
      },
      updated: {
        finding: 'The rate is unchanged. Two billed units still need matching records.',
        explanation: 'The invoices still show 8 units in April and 12 in May at €75 each. LOG-053 now records 10 May units as completed, leaving two billed units without a matching entry.',
        gap: 'A missing entry does not prove that a unit was not delivered. We need supporting records or an explanation for the two unmatched units.',
        next: 'Operations: obtain records or clarification for the two unmatched units. Finance: reconcile the evidence with INV-052 before deciding on payment.'
      }
    },
    history: {
      initial: {
        finding: 'There was an earlier request to review the service.',
        explanation: 'MAIL-018 asked the team to review usage and alternatives before renewal, and to request the monthly log from Operations. It records a request, not a completed review.',
        gap: 'Neither the requested service log nor a completed review is present in these sample records.',
        next: 'Operations: provide the monthly service log. Finance: follow up on the earlier request and record the comparison with the invoice.'
      },
      updated: {
        finding: 'The log arrived; a completed review is still not recorded.',
        explanation: 'LOG-053 adds part of the evidence requested in MAIL-018: 10 May units recorded as completed. The earlier request remains relevant because two billed units still have no matching entry.',
        gap: 'The records do not show a completed review or explain the two unmatched units. Missing entries are not proof of non-delivery.',
        next: 'Operations: clarify the unmatched units. Finance: complete and record the review once the supporting evidence has been checked.'
      }
    },
    next: {
      initial: {
        finding: 'Check the delivered units before deciding on payment.',
        explanation: 'The invoices explain the €300 increase through quantity, not price. They do not establish whether all 12 May units were delivered, and MAIL-018 already requested a usage review.',
        gap: 'The service log and a recorded outcome of the earlier review are missing.',
        next: 'Operations: obtain the May service log. Finance: compare it with INV-052, document any gaps and review the payment decision.'
      },
      updated: {
        finding: 'Resolve the two unmatched units before closing the review.',
        explanation: 'LOG-053 records 10 completed units against 12 billed in INV-052. The next step is to reconcile the remaining two, not assume the invoice is wrong.',
        gap: 'We still need evidence or an explanation for two billed units. The missing entries do not prove non-delivery.',
        next: 'Operations: request the missing records or an explanation. Finance: reconcile all 12 billed units and record the outcome before approving payment.'
      }
    }
  };
  const sourceNotes = {
    cost: [
      'INV-041 establishes the April rate and billed quantity.',
      'INV-052 shows the same unit rate and four more billed units. It does not prove delivery.',
      'MAIL-018 provides earlier review context; it does not establish the delivered quantity.',
      'LOG-053 records 10 completed May units. Two billed units remain unmatched, not proven undelivered.'
    ],
    history: [
      'The earlier invoice provides a comparison point, not evidence that a review was completed.',
      'The later invoice shows what changed after the earlier request; it does not record a review outcome.',
      'MAIL-018 is the earlier request. No completed review is present in these sample records.',
      'LOG-053 adds requested evidence but does not record completion of the earlier review.'
    ],
    next: [
      'The April invoice helps separate the unit rate from the quantity change.',
      'The May invoice identifies the 12 billed units that need to be checked.',
      'The earlier request explains why the usage review still needs a recorded outcome.',
      'The log narrows the follow-up to two unmatched units; it does not prove non-delivery.'
    ]
  };

  let selected = 'cost';
  let updated = false;
  const updateIcon = updateButton.querySelector('[aria-hidden]');

  function render(announce = true) {
    const answer = answers[selected][updated ? 'updated' : 'initial'];
    questions.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.question === selected)));
    updateButton.setAttribute('aria-pressed', String(updated));
    const label = document.createTextNode(updated ? 'Reset to initial review ' : 'Add a next-day update ');
    if (updateIcon) {
      updateIcon.textContent = updated ? '−' : '+';
      updateButton.replaceChildren(label, updateIcon);
    } else {
      updateButton.replaceChildren(label);
    }
    view.textContent = updated ? 'Next-day review' : 'Initial review';
    sourceCount.textContent = updated ? '4 connected sources' : '3 connected sources';
    finding.textContent = answer.finding;
    explanation.textContent = answer.explanation;
    gap.textContent = answer.gap;
    next.textContent = answer.next;
    relevance.forEach((node, i) => { node.textContent = sourceNotes[selected][i]; });
    updateSource.hidden = !updated;
    if (!updated) updateSource.open = false;
    if (announce) status.textContent = `${view.textContent}. ${sourceCount.textContent}. ${answer.finding}`;
  }

  questions.forEach(button => {
    if (!Object.prototype.hasOwnProperty.call(answers, button.dataset.question)) return;
    button.addEventListener('click', () => {
      selected = button.dataset.question;
      render();
    });
  });
  updateButton.addEventListener('click', () => {
    updated = !updated;
    render();
  });
  questionList.addEventListener('keydown', event => {
    const index = questions.indexOf(document.activeElement);
    if (index < 0) return;
    let target;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') target = (index + 1) % questions.length;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') target = (index - 1 + questions.length) % questions.length;
    if (event.key === 'Home') target = 0;
    if (event.key === 'End') target = questions.length - 1;
    if (target === undefined) return;
    event.preventDefault();
    questions[target].focus();
    questions[target].click();
  });
  render(false);
})();
