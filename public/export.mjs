// Plain text download: only explicitly selected study fields, never transport data or credentials.
export function buildRevisionReport({ notes, pack, session }) {
  const lines = ['RecallProof — revision session', `Model: ${pack.model}`, '',
    'AI-generated suggestions and feedback are not objective grades.',
    'Source links establish passage existence, not semantic correctness.',
    'This report includes suggested answers. It is not a record of independent mastery.', '',
    'ORIGINAL NOTES', notes, '', 'SUMMARY'];
  const addSources = sources => {
    for (const source of sources ?? []) lines.push(`Source ${source.id}: ${source.text}`);
  };
  for (const point of pack.summary) {
    if (!point.evidence.matched) { lines.push('Summary point withheld: invalid source references.'); continue; }
    lines.push(point.text); addSources(point.sources); lines.push('');
  }
  lines.push('RECALL PRACTICE');
  pack.questions.forEach((question, index) => {
    lines.push('', `Question ${index + 1}`);
    if (!question.evidence.matched) { lines.push('Question withheld: invalid source references.'); return; }
    lines.push(question.question, `Suggested answer: ${question.answer}`);
    addSources(question.sources);
    const attempts = session.cards[index].attempts;
    if (!attempts.length) lines.push('No checked attempts recorded. Unsubmitted drafts are not included.');
    attempts.forEach((attempt, attemptIndex) => {
      lines.push('', `Checked attempt ${attemptIndex + 1}`, `Your answer: ${attempt.answer}`,
        `Confidence: ${attempt.confidence}`, `Suggested answer revealed before attempt: ${attempt.usedHelp ? 'yes' : 'no'}`,
        `AI feedback label: ${attempt.review.verdict}`, `AI feedback: ${attempt.review.feedback}`);
      addSources(attempt.review.sources);
    });
  });
  lines.push('', 'Only the latest 10 checked attempts per question are kept in this session.',
    'This is a user-downloaded text report, not a live API response or a verified learning score.');
  return lines.join('\n');
}
