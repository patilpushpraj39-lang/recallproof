import { element, appendSources } from './dom.mjs';

export function renderNotesQuestion(container, { notes, setBusy, onSource, onResult }) {
  container.replaceChildren(element('h3', 'section-title', 'Ask your notes'),
    element('p', 'helper', 'Have another question? Ask about these notes. This is study help and may reveal card answers. Each question makes one Gemma request.'));
  const form = element('form', 'notes-question-form');
  const label = element('label', 'answer-label', 'YOUR QUESTION');
  const input = element('textarea', 'notes-question');
  input.id = 'notes-question'; input.maxLength = 500; input.rows = 2;
  input.placeholder = 'For example: How do lists and tuples differ?'; label.htmlFor = input.id;
  const submit = element('button', 'check-answer ask-submit', 'Ask my notes →');
  submit.type = 'submit'; submit.disabled = true;
  const error = element('p', 'error-message'); error.hidden = true; error.setAttribute('role', 'alert');
  const result = element('div', 'answer-feedback'); result.hidden = true; result.setAttribute('aria-live', 'polite');
  const status = element('p', 'helper'); status.setAttribute('role', 'status');
  input.addEventListener('input', () => { submit.disabled = !input.value.trim(); });
  form.append(label, input, submit);
  container.append(form, status, error, result);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const question = input.value.trim();
    if (!question || !setBusy(true)) return;
    error.hidden = true; status.textContent = 'Checking your notes…';
    try {
      const response = await fetch('/api/ask', { method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ notes, question }), signal: AbortSignal.timeout(60000) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not answer this question. Please try again.');
      if (data.schemaVersion !== 3) throw new Error('Restart the updated app, then refresh this page.');
      result.className = `answer-feedback ${data.covered ? 'feedback-supported' : 'feedback-uncertain'}`;
      result.replaceChildren(element('span', 'feedback-label', 'GEMMA RESPONSE · REVIEW THE EVIDENCE'),
        element('h4', '', data.withheld ? 'Answer withheld' : data.covered ? 'Answer linked to your notes' : 'Not covered in these notes'),
        element('p', '', `Question: ${question}`), element('p', '', data.answer));
      appendSources(result, data.sources, onSource);
      result.append(element('p', 'helper', 'Source references do not guarantee the AI interpreted the notes correctly.'));
      result.hidden = false;
      onResult({ question, result: data });
    } catch (failure) {
      error.textContent = failure.name === 'TimeoutError' ? 'The question timed out. Your question is still here.' :
        failure instanceof TypeError ? 'Could not reach the local server. Your question is still here.' : failure.message;
      error.hidden = false;
    } finally { status.textContent = ''; setBusy(false); }
  });
}
