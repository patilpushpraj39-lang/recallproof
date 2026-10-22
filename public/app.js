const $ = id => document.getElementById(id);
const notes = $('notes');
const generate = $('generate');
let working = false;
let configured = false;
let sourceNotes = '';

const SAMPLE = `Python lists and tuples store items in order.
A list uses square brackets, for example [10, 20, 30].
You can add, remove or replace items in a list.
A tuple can be written as (10, 20, 30).
Once created, a tuple's items cannot be added, removed or replaced.
Both support indexing: index 0 selects the first item.`;

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function updateInput() {
  $('character-count').textContent = `${notes.value.length.toLocaleString()} / 12,000`;
  generate.disabled = working || !configured || notes.value.trim().length < 60;
}

function resetResults() {
  $('results').hidden = true;
  $('source-panel').hidden = true;
  $('empty-state').hidden = false;
  $('error').hidden = true;
}

notes.addEventListener('input', () => { resetResults(); updateInput(); });
$('sample').addEventListener('click', () => {
  notes.value = SAMPLE;
  resetResults(); updateInput(); notes.focus();
});
$('close-source').addEventListener('click', () => { $('source-panel').hidden = true; });

function showSource(evidence) {
  const source = $('source-text');
  source.replaceChildren(
    document.createTextNode(sourceNotes.slice(0, evidence.start)),
    element('mark', '', sourceNotes.slice(evidence.start, evidence.end)),
    document.createTextNode(sourceNotes.slice(evidence.end))
  );
  $('source-panel').hidden = false;
  source.querySelector('mark').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function sourceButton(evidence) {
  const button = element('button', 'text-button', 'View passage in notes ↗');
  button.type = 'button';
  button.addEventListener('click', () => showSource(evidence));
  return button;
}

function renderStudyPack(pack) {
  if (pack.schemaVersion !== 2) throw new Error('The app has been updated. Restart npm start in the terminal, then refresh this page.');
  $('evidence-count').textContent = `${pack.evidence.matched} of ${pack.evidence.total} items linked to original note passages`;
  $('summary').replaceChildren();
  $('questions').replaceChildren();
  for (const point of pack.summary) {
    const row = element('li');
    if (!point.evidence.matched) {
      row.append(element('p', 'withheld', 'Summary point withheld: Gemma selected a missing or invalid source passage.'));
    } else {
      const body = element('div', 'summary-body');
      body.append(element('p', '', point.text));
      for (const source of point.sources) {
        const button = sourceButton(source);
        button.textContent = `View source ${source.id} ↗`;
        body.append(button, document.createTextNode(' '));
      }
      row.append(element('span', 'summary-bullet'), body);
    }
    $('summary').append(row);
  }
  pack.questions.forEach((card, index) => {
    if (!card.evidence.matched) {
      $('questions').append(element('div', 'question-card withheld',
        `Card ${index + 1} withheld: Gemma selected a missing or invalid source passage. Try generating again.`));
      return;
    }
    const details = element('details', 'question-card');
    const heading = element('summary');
    heading.append(element('span', 'question-number', String(index + 1).padStart(2, '0')),
      element('span', 'question-text', card.question), element('span', 'reveal-label', 'Reveal answer +'));
    const answer = element('div', 'answer-body');
    answer.append(element('p', 'answer-label', 'SUGGESTED ANSWER'), element('p', 'answer-text', card.answer),
      element('span', 'evidence-label', 'Original passages · selected by Gemma'));
    for (const source of card.sources) {
      const button = sourceButton(source);
      button.textContent = `View source ${source.id} in notes ↗`;
      answer.append(element('blockquote', 'evidence-quote', source.text), button);
    }
    details.append(heading, answer);
    $('questions').append(details);
  });
  $('results').hidden = false;
}

generate.addEventListener('click', async () => {
  if (working || !configured || notes.value.trim().length < 60) return;
  working = true;
  sourceNotes = notes.value.trim();
  resetResults();
  $('empty-state').hidden = true;
  $('loading').hidden = false;
  document.querySelector('.result-panel').setAttribute('aria-busy', 'true');
  notes.disabled = true;
  $('sample').disabled = true;
  generate.textContent = 'Creating your study pack…';
  updateInput();
  const started = Date.now();
  $('elapsed').textContent = '0 seconds';
  const timer = setInterval(() => { $('elapsed').textContent = `${Math.floor((Date.now() - started) / 1000)} seconds`; }, 1000);
  try {
    const response = await fetch('/api/study', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ notes: sourceNotes }), signal: AbortSignal.timeout(60000)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Could not create this study pack. Please try again.');
    renderStudyPack(data);
  } catch (error) {
    $('error').textContent = error.name === 'TimeoutError' ? 'The request timed out. Check your connection and try again.' :
      error instanceof TypeError ? 'The local server could not be reached. Check that it is still running in your terminal.' : error.message;
    $('error').hidden = false;
    $('empty-state').hidden = false;
  } finally {
    clearInterval(timer);
    working = false;
    notes.disabled = false;
    $('sample').disabled = false;
    generate.textContent = 'Create my study pack →';
    $('loading').hidden = true;
    document.querySelector('.result-panel').setAttribute('aria-busy', 'false');
    updateInput();
  }
});

async function checkServer() {
  const badge = $('model-status');
  try {
    const response = await fetch('/api/health');
    if (!response.ok) throw new Error('Health check failed');
    const status = await response.json();
    if (status.schemaVersion !== 2) {
      badge.classList.add('warning');
      badge.replaceChildren(element('span', 'status-dot'), document.createTextNode('Restart the app'));
      $('error').textContent = 'An update is ready. Stop the terminal with Ctrl+C, run npm start again, then refresh this page.';
      $('error').hidden = false;
      return;
    }
    configured = status.configured;
    badge.classList.add(configured ? 'ready' : 'warning');
    badge.replaceChildren(element('span', 'status-dot'), document.createTextNode(configured ? 'Gemma 4 · Key loaded' : 'API key needed'));
    if (!configured) {
      $('error').textContent = 'Start the app with npm start, then enter your API key in the terminal. The key stays on the server.';
      $('error').hidden = false;
    }
  } catch {
    badge.classList.add('warning');
    badge.replaceChildren(element('span', 'status-dot'), document.createTextNode('Local server unavailable'));
  }
  updateInput();
}
checkServer();
