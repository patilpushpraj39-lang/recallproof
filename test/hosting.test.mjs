import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer, request } from 'node:http';
import { hostingOptions, createHostedHandler } from '../lib/hosting.mjs';

const notes = 'A list can be changed after creation. A tuple cannot be changed after creation.';
const env = { VERCEL_URL: 'judge.example', GEMINI_API_KEY: 'private-provider-key', DEMO_ACCESS_CODE: 'private-demo-code' };
const pack = { summary: [{ text: 'Lists can change.', sourceIds: ['S1'] }], questions: [{ question: 'Can lists change?', answer: 'Yes.', sourceIds: ['S1'] }] };

async function withHosted(options, run, preParsedBody) {
  const handler = createHostedHandler(options);
  const server = createServer((req, res) => {
    if (preParsedBody !== undefined) req.body = preParsedBody;
    return handler(req, res);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  try { await run(url); }
  finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
}

function requestHost(url, options) {
  return new Promise((resolve, reject) => {
    const req = request(url, options, res => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => { const text = Buffer.concat(chunks).toString('utf8');
        resolve({ status: res.statusCode, text: async () => text, json: async () => JSON.parse(text) }); });
    });
    req.on('error', reject); req.end(options.body);
  });
}

function post(url, route, body, code, extraHeaders = {}) {
  return requestHost(url + route, { method: 'POST', headers: { host: 'judge.example', origin: 'https://judge.example',
    'content-type': 'application/json', ...(code ? { 'x-demo-code': code } : {}), ...extraHeaders }, body: JSON.stringify(body) });
}

test('hosting only trusts configured hostnames and requires a code even when secrets are absent', async () => {
  const options = hostingOptions({ VERCEL_URL: 'judge.example', PUBLIC_HOSTS: 'good.example,https://bad.example,path/name' });
  assert.deepEqual(options.publicHosts, ['judge.example', 'good.example']);
  assert.equal(options.requireDemoAccess, true);
  await withHosted(options, async url => {
    const health = await requestHost(url + '/api/health', { headers: { host: 'judge.example' } });
    assert.equal((await health.json()).configured, false);
    assert.equal((await post(url, '/api/study', { notes })).status, 503);
  });
});

test('hosted model routes deny missing and wrong codes before model calls and never expose either secret', async () => {
  let calls = 0;
  await withHosted({ ...hostingOptions(env), generate: async () => { calls++; return pack; },
    review: async () => { calls++; }, ask: async () => { calls++; } }, async url => {
    for (const route of ['/api/study', '/api/review', '/api/ask']) {
      for (const code of [undefined, 'wrong-code']) assert.equal((await post(url, route, { notes }, code)).status, 401);
    }
    assert.equal(calls, 0);
    const response = await post(url, '/api/study', { notes }, env.DEMO_ACCESS_CODE);
    assert.equal(response.status, 200);
    const text = await response.text();
    assert.equal(text.includes(env.GEMINI_API_KEY), false);
    assert.equal(text.includes(env.DEMO_ACCESS_CODE), false);
    assert.equal(calls, 1);
  });
});

test('hosted origin and hostname checks remain enforced with a correct presenter code', async () => {
  await withHosted(hostingOptions(env), async url => {
    assert.equal((await post(url, '/api/study', { notes }, env.DEMO_ACCESS_CODE, { origin: 'https://foreign.example' })).status, 403);
    assert.equal((await post(url, '/api/study', { notes }, env.DEMO_ACCESS_CODE, { host: 'foreign.example' })).status, 403);
  });
});

test('serverless pre-parsed request bodies are validated and bounded', async () => {
  await withHosted({ ...hostingOptions(env), generate: async input => { assert.equal(input.notes, notes); return pack; } }, async url => {
    assert.equal((await post(url, '/api/study', {}, env.DEMO_ACCESS_CODE)).status, 200);
  }, { notes });
  await withHosted(hostingOptions(env), async url => {
    assert.equal((await post(url, '/api/study', {}, env.DEMO_ACCESS_CODE)).status, 413);
  }, { notes: 'x'.repeat(70000) });
});
