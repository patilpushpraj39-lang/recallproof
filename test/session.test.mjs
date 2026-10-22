import test from 'node:test';
import assert from 'node:assert/strict';
import { createPracticeSession, recordAttempt, markAnswerRevealed, lastAttempt, reviewQueue, practiceProgress } from '../public/session.mjs';

const cards = [{ question: 'Question one?', evidence: { matched: true } }, { question: null, evidence: { matched: false } }];

test('withheld cards do not inflate practice progress', () => {
  assert.deepEqual(practiceProgress(createPracticeSession(cards)), { total: 1, attempted: 0, flagged: 0, priority: 0 });
});

test('a corrected retry clears the review flag without counting as another attempted card', () => {
  const session = createPracticeSession(cards);
  recordAttempt(session, 0, { answer: 'first answer', confidence: 'sure', review: { needsReview: true, priority: true } });
  assert.deepEqual(reviewQueue(session), [0]);
  assert.equal(practiceProgress(session).priority, 1);
  recordAttempt(session, 0, { answer: 'revised answer', confidence: 'unsure', review: { needsReview: false, priority: false } });
  assert.deepEqual(reviewQueue(session), []);
  assert.equal(practiceProgress(session).attempted, 1);
  assert.equal(lastAttempt(session, 0).answer, 'revised answer');
});

test('revealing a suggestion is retained as assisted practice for subsequent attempts', () => {
  const session = createPracticeSession(cards);
  markAnswerRevealed(session, 0);
  recordAttempt(session, 0, { answer: 'answer after reveal', confidence: 'sure', review: { needsReview: false } });
  assert.equal(lastAttempt(session, 0).usedHelp, true);
});

test('a new note session starts without another session’s answers or flags', () => {
  const first = createPracticeSession(cards);
  recordAttempt(first, 0, { answer: 'private attempt', confidence: 'unsure', review: { needsReview: true } });
  const second = createPracticeSession(cards);
  assert.equal(lastAttempt(second, 0), null);
  assert.equal(practiceProgress(second).flagged, 0);
});
