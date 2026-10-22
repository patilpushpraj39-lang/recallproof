import { element, appendSources } from './dom.mjs';
import { markAnswerRevealed, recordAttempt, lastAttempt } from './session.mjs';

const LABELS = { supported: 'Supported by these notes', partial: 'Some parts need review', conflicting: 'Possible conflict with the notes',
  not_covered: 'No support found in these notes', uncertain: 'Needs your review' };

export function renderFeedback(container, review, usedHelp, onSource, usedNotesHelp = false) {
  container.replaceChildren(element('span', 'feedback-label', 'GEMMA FEEDBACK · NOT AN OBJECTIVE GRADE'),
    element('h4', '', LABELS[review.verdict]), element('p', '', review.feedback));
  container.className = `answer-feedback feedback-${review.verdict}`;
  if (review.priority) container.append(element('p', 'priority-note', 'Review priority: you felt sure, but Gemma flagged something to revisit. Check the passages yourself.'));
  if (usedHelp) container.append(element('p', 'help-note', 'You revealed the suggested answer before this attempt. This was practice with help.'));
  if (usedNotesHelp) container.append(element('p', 'help-note', 'You used Ask your notes earlier in this session. This attempt followed study help.'));
  appendSources(container, review.sources, onSource);
  container.hidden = false;
}

export function renderPracticeCard(card, index, { session, notes, onSource, setBusy, onProgress }) {
  const article = element('article', 'practice-card');
  article.dataset.cardIndex = index;
  const heading = element('div', 'practice-question');
  heading.append(element('span', 'question-number', String(index + 1).padStart(2, '0')), element('h4', '', card.question));
  const form = element('form', 'practice-form');
  const label = element('label', 'answer-label', 'YOUR ANSWER · TRY BEFORE REVEALING');
  const input = element('textarea', 'practice-answer');
  input.id = `answer-${index}`;
  input.maxLength = 2000;
  input.placeholder = 'Explain it in your own words…';
  label.htmlFor = input.id;
  const controls = element('div', 'practice-controls');
  const confidenceLabel = element('label', 'confidence-label', 'How sure are you? ');
  const confidence = element('select');
  confidence.setAttribute('aria-label', `Confidence for question ${index + 1}`);
  for (const [value, text] of [['unsure', 'I’m unsure'], ['sure', 'I’m sure']]) {
    const option = element('option', '', text); option.value = value; confidence.append(option);
  }
  confidenceLabel.append(confidence);
  const submit = element('button', 'check-answer', 'Check my answer →');
  submit.type = 'submit'; submit.disabled = true;
  controls.append(confidenceLabel, submit);
  const errorBox = element('p', 'error-message'); errorBox.hidden = true; errorBox.setAttribute('role', 'alert');
  const feedback = element('div', 'answer-feedback'); feedback.hidden = true; feedback.setAttribute('aria-live', 'polite');
  input.addEventListener('input', () => { submit.disabled = !input.value.trim(); });
  form.append(label, input, controls);
  const retry = element('button', 'text-button retry-answer', 'Try this question again ↻');
  retry.type = 'button'; retry.hidden = true;
  retry.addEventListener('click', () => { input.value = ''; submit.disabled = true; feedback.hidden = true; errorBox.hidden = true; retry.hidden = true; input.focus(); });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!input.value.trim() || !setBusy(true)) return;
    const answer = input.value.trim();
    const felt = confidence.value;
    // Capture reveal state before the network request, so peeking later cannot rewrite history.
    const usedHelp = session.cards[index].revealed;
    const usedNotesHelp = Boolean(session.notesHelpUsed);
    submit.textContent = 'Checking against your notes…'; input.disabled = true; confidence.disabled = true;
    errorBox.hidden = true; feedback.hidden = true;
    try {
      const response = await fetch('/api/review', { method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ notes, question: card.question, answer, confidence: felt }), signal: AbortSignal.timeout(60000) });
      const review = await response.json();
      if (!response.ok) throw new Error(review.error || 'Could not check this answer. Please try again.');
      if (review.schemaVersion !== 3) throw new Error('Restart the updated app in your terminal, then refresh this page.');
      recordAttempt(session, index, { answer, confidence: felt, review });
      // The request-start snapshot is the correct practice context for this attempt.
      lastAttempt(session, index).usedHelp = usedHelp;
      lastAttempt(session, index).usedNotesHelp = usedNotesHelp;
      renderFeedback(feedback, review, usedHelp, onSource, usedNotesHelp);
      retry.hidden = false;
      onProgress();
    } catch (error) {
      errorBox.textContent = error.name === 'TimeoutError' ? 'Feedback timed out. Your answer is still here; please try again.' :
        error instanceof TypeError ? 'Could not reach the local server. Your answer is still here.' : error.message;
      errorBox.hidden = false;
    } finally {
      input.disabled = false; confidence.disabled = false; setBusy(false);
      submit.textContent = 'Check my answer →'; submit.disabled = !input.value.trim();
    }
  });
  const reveal = element('details', 'question-card answer-reveal');
  const revealHeading = element('summary'); revealHeading.append(element('span', 'question-text', 'Reveal suggested answer'));
  const answerBody = element('div', 'answer-body');
  answerBody.append(element('p', 'answer-label', 'SUGGESTED ANSWER'), element('p', 'answer-text', card.answer));
  appendSources(answerBody, card.sources, onSource);
  reveal.append(revealHeading, answerBody);
  reveal.addEventListener('toggle', () => { if (reveal.open) markAnswerRevealed(session, index); });
  article.append(heading, form, errorBox, feedback, retry, reveal);
  return article;
}
