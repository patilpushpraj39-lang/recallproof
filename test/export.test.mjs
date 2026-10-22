import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRevisionReport } from '../public/export.mjs';
import { createPracticeSession, recordAttempt } from '../public/session.mjs';
import { verifyStudyPack } from '../lib/evidence.mjs';

const notes = 'Lists can change. Tuples cannot change.';
function fixture() {
  const pack = { ...verifyStudyPack({ summary: [{ text: 'Lists allow changes.', sourceIds: ['S1'] }],
    questions: [{ question: 'Can tuples change?', answer: 'No.', sourceIds: ['S2'] },
      { question: 'Fabricated question', answer: 'Fabricated answer', sourceIds: ['missing'] }] }, notes), model: 'test-model',
    apiKey: 'must-never-export', rawResponse: 'private-provider-diagnostic' };
  return { notes, pack, session: createPracticeSession(pack.questions) };
}

test('report retains original source text and assistance context without including transport fields', () => {
  const data = fixture();
  recordAttempt(data.session, 0, { answer: 'I think yes.', confidence: 'sure', review: {
    verdict: 'conflicting', feedback: 'Check the tuple passage.', sources: data.pack.questions[0].sources } });
  data.session.cards[0].attempts[0].usedHelp = true;
  const report = buildRevisionReport(data);
  assert.ok(report.includes(notes));
  assert.match(report, /Source S2: Tuples cannot change\./);
  assert.match(report, /Your answer: I think yes\./);
  assert.match(report, /revealed before attempt: yes/);
  for (const forbidden of ['must-never-export', 'private-provider-diagnostic', 'Fabricated question', 'Fabricated answer']) {
    assert.equal(report.includes(forbidden), false);
  }
});

test('report distinguishes unattempted questions, model feedback and withheld content', () => {
  const report = buildRevisionReport(fixture());
  assert.match(report, /No checked attempts recorded/);
  assert.match(report, /Question withheld/);
  assert.match(report, /not objective grades/);
  assert.match(report, /Unsubmitted drafts are not included/);
});
