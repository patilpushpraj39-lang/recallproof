import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyStudyPack, validateNotes, buildSourcePassages } from '../lib/evidence.mjs';

const notes = 'A list can be changed after creation. A tuple cannot be changed after creation.';
const pack = () => ({
  summary: [{ text: 'Lists are mutable.', sourceIds: ['S1'] }],
  questions: [{ question: 'Can a tuple be changed?', answer: 'No.', sourceIds: ['S2'] }]
});

test('valid source references retrieve the original text and highlighting span', () => {
  const result = verifyStudyPack(pack(), notes);
  assert.deepEqual(result.evidence, { matched: 2, total: 2 });
  for (const item of [...result.summary, ...result.questions]) {
    for (const source of item.sources) assert.equal(notes.slice(source.start, source.end), source.text);
  }
});

test('invented and missing source IDs withhold associated claims and answers', () => {
  const input = pack();
  input.summary[0].sourceIds = ['S999'];
  input.questions[0].sourceIds = [];
  const result = verifyStudyPack(input, notes);
  assert.deepEqual(result.evidence, { matched: 0, total: 2 });
  assert.equal(result.summary[0].text, null);
  assert.equal(result.questions[0].question, null);
  assert.equal(result.questions[0].answer, null);
  assert.deepEqual(result.questions[0].sources, []);
});

test('model-generated quotations cannot replace the original source text', () => {
  const input = pack();
  input.questions[0].quote = 'A tuple can always be changed.';
  const result = verifyStudyPack(input, notes);
  assert.equal(result.questions[0].sources[0].text, 'A tuple cannot be changed after creation.');
  assert.equal(JSON.stringify(result).includes('A tuple can always be changed.'), false);
});

test('existing source references deliberately do not imply semantic correctness', () => {
  const input = pack();
  input.questions[0].answer = 'Yes, always.';
  const result = verifyStudyPack(input, notes);
  assert.equal(result.questions[0].evidence.matched, true);
  // Existing evidence text still does not imply a correct interpretation.
  assert.equal(result.questions[0].answer, 'Yes, always.');
});

test('multiple passages support comparisons, but one missing ID withholds the whole item', () => {
  const input = pack();
  input.questions[0].sourceIds = ['S1', 'S2'];
  assert.equal(verifyStudyPack(input, notes).questions[0].sources.length, 2);
  input.questions[0].sourceIds = ['S1', 'S999'];
  assert.equal(verifyStudyPack(input, notes).questions[0].evidence.matched, false);
});

test('Windows line endings and Unicode retain exact original source positions', () => {
  const source = "  First statement.\r\n  A tuple’s items cannot be replaced.\nLast statement.  ";
  const passages = buildSourcePassages(source);
  assert.equal(passages.length, 3);
  for (const passage of passages) assert.equal(source.slice(passage.start, passage.end), passage.text);
});

test('long source lines stay bounded without changing their characters', () => {
  const source = 'long original source '.repeat(200);
  const passages = buildSourcePassages(source);
  assert.ok(passages.length > 1);
  for (const passage of passages) {
    assert.ok(passage.text.length <= 1200);
    assert.equal(source.slice(passage.start, passage.end), passage.text);
  }
});

test('short notes do not force three padded questions', () => {
  assert.equal(verifyStudyPack(pack(), notes).questions.length, 1);
});

test('empty, oversized and non-text notes fail before a model call', () => {
  for (const value of ['', '   ', null, 42, 'a'.repeat(12001)]) {
    assert.throws(() => validateNotes(value), error => error.status === 400);
  }
});

test('malformed model output and insufficient material produce clear failures', () => {
  assert.throws(() => verifyStudyPack({ questions: [] }, notes), error => error.status === 502);
  assert.throws(() => verifyStudyPack({ insufficient: true }, notes), error => error.status === 422);
});
