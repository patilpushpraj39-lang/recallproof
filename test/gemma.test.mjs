import test from 'node:test';
import assert from 'node:assert/strict';
import { generateStudyPack } from '../lib/gemma.mjs';

test('Gemma adapter uses private header authentication and excludes thinking text', async () => {
  const result = await generateStudyPack({ notes: 'test notes', apiKey: 'test-secret-not-a-real-key',
    fetchImpl: async (url, options) => {
      assert.equal(url.includes('test-secret'), false);
      assert.equal(options.headers['x-goog-api-key'], 'test-secret-not-a-real-key');
      const request = JSON.parse(options.body);
      const input = JSON.parse(request.contents[0].parts[0].text);
      assert.deepEqual(input.passages, [{ id: 'S1', text: 'test notes' }]);
      assert.equal(request.systemInstruction.parts[0].text.includes('Do NOT generate quotations'), true);
      assert.match(url, /gemma-4-26b-a4b-it:generateContent$/);
      assert.equal(request.generationConfig.thinkingConfig.thinkingLevel, 'minimal');
      return new Response(JSON.stringify({ candidates: [{ finishReason: 'STOP', content: { parts: [
        { text: 'private reasoning should not become output', thought: true },
        { text: '```json\n{"summary":[],"questions":[]}\n```' }
      ] } }] }));
    }
  });
  assert.deepEqual(result, { summary: [], questions: [] });
});

test('quota failures are reported without exposing provider messages or credentials', async () => {
  await assert.rejects(generateStudyPack({ notes: 'notes', apiKey: 'secret',
    fetchImpl: async () => new Response('provider diagnostic with secret', { status: 429 })
  }), error => error.status === 429 && !error.message.includes('secret'));
});

test('a truncated generation is not accepted as a completed pack', async () => {
  await assert.rejects(generateStudyPack({ notes: 'notes', apiKey: 'secret', fetchImpl: async () =>
    Response.json({ candidates: [{ finishReason: 'MAX_TOKENS', content: { parts: [{ text: '{}' }] } }] })
  }), error => error.status === 502);
});

test('connection failures receive a useful message without leaking raw error text', async () => {
  await assert.rejects(generateStudyPack({ notes: 'notes', apiKey: 'secret', fetchImpl: async () => {
    throw new Error('sensitive provider error secret');
  } }), error => error.status === 502 && /connection|Wi-Fi/.test(error.message) && !error.message.includes('secret'));
});
