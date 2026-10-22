export function createPracticeSession(cards) {
  return { cards: cards.map(card => ({ question: card.question, enabled: card.evidence.matched, revealed: false, attempts: [] })) };
}

export function markAnswerRevealed(session, index) {
  session.cards[index].revealed = true;
}

export function recordAttempt(session, index, { answer, confidence, review }) {
  const card = session.cards[index];
  card.attempts.push({ answer, confidence, review, usedHelp: card.revealed });
  if (card.attempts.length > 10) card.attempts.shift();
}

export function lastAttempt(session, index) {
  return session.cards[index].attempts.at(-1) ?? null;
}

export function reviewQueue(session) {
  return session.cards.flatMap((card, index) => card.attempts.at(-1)?.review.needsReview ? [index] : []);
}

export function practiceProgress(session) {
  return { total: session.cards.filter(card => card.enabled).length,
    attempted: session.cards.filter(card => card.attempts.length > 0).length,
    flagged: reviewQueue(session).length,
    priority: session.cards.filter(card => card.attempts.at(-1)?.review.priority).length };
}
