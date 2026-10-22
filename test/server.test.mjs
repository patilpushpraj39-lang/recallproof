import test from 'node:test';
import assert from 'node:assert/strict';
import { createRecallServer } from '../server.mjs';

const notes = 'A list can be changed after creation. A tuple cannot be changed after creation.';
const sourcePack = {
  summary: [{ text: 'Lists can change.', sourceIds: ['S1'] }],
  questions: [{ question: 'Can tuples change?', answer: 'No.', sourceIds: ['S2'] }]
};

async function withServer(options, run) {
  const server = createRecallServer(options);
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const url = `http://127.0.0.1:${server.address().port}`;
  try { await run(url); }
  finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
}

function post(url, body, origin, route = '/api/study') {
  return fetch(`${url}${route}`, { method: 'POST',
    headers: { 'content-type': 'application/json', ...(origin ? { origin } : {}) }, body });
}

test('HTTP flow validates evidence and never returns the private API key', async () => {
  await withServer({ apiKey: 'private-test-key', generate: async () => sourcePack }, async url => {
    const response = await post(url, JSON.stringify({ notes }), url);
    assert.equal(response.status, 200);
    const text = await response.text();
    assert.equal(text.includes('private-test-key'), false);
    assert.deepEqual(JSON.parse(text).evidence, { matched: 2, total: 2 });
    const page = await fetch(url);
    assert.equal(page.status, 200);
    assert.match(page.headers.get('content-security-policy'), /script-src 'self'/);
  });
});

test('feedback HTTP route validates evidence and never exposes its private key', async () => {
  await withServer({ apiKey: 'private-test-key', review: async () => ({ verdict: 'conflicting', feedback: 'The properties are reversed.', sourceIds: ['S1', 'S2'] }) }, async url => {
    const response = await post(url, JSON.stringify({ notes, question: 'Compare lists and tuples.', answer: 'Tuples can change; lists cannot.', confidence: 'sure' }), url, '/api/review');
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.equal(result.priority, true);
    assert.equal(result.sources.length, 2);
    assert.equal(JSON.stringify(result).includes('private-test-key'), false);
    assert.equal(result.schemaVersion, 3);
    for (const asset of ['/practice.mjs', '/session.mjs', '/dom.mjs', '/export.mjs']) assert.equal((await fetch(`${url}${asset}`)).status, 200);
  });
});

test('invalid review input and foreign origins do not call the feedback model', async () => {
  let called = false;
  const input = { notes, question: 'Compare lists and tuples.', answer: '', confidence: 'sure' };
  await withServer({ apiKey: 'test', review: async () => { called = true; } }, async url => {
    assert.equal((await post(url, JSON.stringify(input), url, '/api/review')).status, 400);
    input.answer = 'An answer';
    assert.equal((await post(url, JSON.stringify(input), 'https://other.example', '/api/review')).status, 403);
    assert.equal(called, false);
  });
});

test('notes questions return retrieved sources and never expose credentials', async () => {
  await withServer({ apiKey: 'private-test-key', ask: async () => ({ covered: true, answer: 'A list can change.', sourceIds: ['S1'] }) }, async url => {
    const response = await post(url, JSON.stringify({ notes, question: 'Can a list change?' }), url, '/api/ask');
    assert.equal(response.status, 200);
    const text = await response.text();
    assert.equal(text.includes('private-test-key'), false);
    assert.equal(JSON.parse(text).sources[0].text, 'A list can be changed after creation.');
    assert.equal((await fetch(`${url}/ask.mjs`)).status, 200);
  });
});

test('invalid notes questions and foreign origins do not call the model', async () => {
  let calls = 0;
  await withServer({ apiKey: 'test', ask: async () => { calls++; } }, async url => {
    assert.equal((await post(url, JSON.stringify({ notes, question: '' }), url, '/api/ask')).status, 400);
    assert.equal((await post(url, JSON.stringify({ notes, question: 'Question?' }), 'https://unrelated.example', '/api/ask')).status, 403);
    assert.equal(calls, 0);
  });
});

test('missing credentials and invalid input do not call the model', async () => {
  let called = false;
  await withServer({ apiKey: '', generate: async () => { called = true; } }, async url => {
    assert.equal((await post(url, JSON.stringify({ notes: '' }))).status, 400);
    assert.equal((await post(url, '{broken')).status, 400);
    assert.equal((await post(url, JSON.stringify({ notes }))).status, 503);
    assert.equal(called, false);
  });
});

test('foreign browser origins and oversized requests are rejected before generation', async () => {
  let called = false;
  await withServer({ apiKey: 'test', generate: async () => { called = true; } }, async url => {
    assert.equal((await post(url, JSON.stringify({ notes }), 'https://unrelated.example')).status, 403);
    assert.equal((await post(url, JSON.stringify({ notes: 'x'.repeat(70000) }))).status, 413);
    assert.equal(called, false);
  });
});

test('unexpected backend failures are sanitized and the next request can recover', async () => {
  let calls = 0;
  await withServer({ apiKey: 'test', generate: async () => {
    if (++calls === 1) throw new Error('do not disclose this private-test-key');
    return sourcePack;
  } }, async url => {
    const failure = await post(url, JSON.stringify({ notes }));
    assert.equal(failure.status, 500);
    assert.equal((await failure.text()).includes('private-test-key'), false);
    assert.equal((await post(url, JSON.stringify({ notes }))).status, 200);
  });
});

test('overlapping generation requests cannot accidentally spend quota twice', async () => {
  let release;
  let notifyStarted;
  const started = new Promise(resolve => { notifyStarted = resolve; });
  const wait = new Promise(resolve => { release = resolve; });
  await withServer({ apiKey: 'test', generate: async () => { notifyStarted(); await wait; return sourcePack; } }, async url => {
    const first = post(url, JSON.stringify({ notes }));
    await started;
    try {
      assert.equal((await post(url, JSON.stringify({ notes }))).status, 429);
      assert.equal((await post(url, JSON.stringify({ notes, question: 'Can a list change?' }), url, '/api/ask')).status, 429);
    }
    finally { release(); }
    assert.equal((await first).status, 200);
  });
});
