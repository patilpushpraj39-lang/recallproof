export class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function validateNotes(value) {
  if (typeof value !== 'string' || value.trim().length < 60) {
    throw new AppError(400, 'Paste a few sentences of study notes (at least 60 characters).');
  }
  if (value.length > 12000) throw new AppError(400, 'Keep this study session under 12,000 characters.');
  return value.trim();
}

function requiredText(value, maxLength) {
  if (typeof value !== 'string' || !value.trim() || value.length > maxLength) {
    throw new AppError(502, 'Gemma returned an incomplete study pack. Please try again.');
  }
  return value.trim();
}

export function buildSourcePassages(notes) {
  const passages = [];
  const segmenter = new Intl.Segmenter('en', { granularity: 'sentence' });
  for (const line of notes.matchAll(/[^\r\n]+/g)) {
    for (const sentence of segmenter.segment(line[0])) {
      let offset = 0;
      while (offset < sentence.segment.length) {
        let end = Math.min(offset + 1200, sentence.segment.length);
        if (end < sentence.segment.length) {
          const space = sentence.segment.lastIndexOf(' ', end);
          if (space > offset + 600) end = space;
        }
        const fragment = sentence.segment.slice(offset, end);
        const text = fragment.trim();
        if (text) {
          const start = line.index + sentence.index + offset + fragment.indexOf(text);
          passages.push({ id: `S${passages.length + 1}`, text, start, end: start + text.length });
        }
        offset = end;
      }
    }
  }
  return passages;
}

export function resolveSources(item, passageMap) {
  const ids = item?.sourceIds;
  if (!Array.isArray(ids) || ids.length < 1 || ids.length > 3 ||
      ids.some(id => typeof id !== 'string' || !passageMap.has(id))) {
    return { matched: false, sources: [] };
  }
  return { matched: true, sources: [...new Set(ids)].map(id => passageMap.get(id)) };
}

// Source IDs prove passages exist, not that the model interpreted them correctly.
export function verifyStudyPack(pack, notes) {
  if (pack?.insufficient === true) {
    throw new AppError(422, 'These notes do not contain enough study material. Add a few factual sentences and try again.');
  }
  if (!Array.isArray(pack?.summary) || !Array.isArray(pack?.questions) ||
      pack.summary.length < 1 || pack.summary.length > 3 ||
      pack.questions.length < 1 || pack.questions.length > 3) {
    throw new AppError(502, 'Gemma returned an incomplete study pack. Please try again.');
  }
  const passageMap = new Map(buildSourcePassages(notes).map(passage => [passage.id, passage]));
  const summary = pack.summary.map(item => {
    const text = requiredText(item?.text, 600);
    const resolved = resolveSources(item, passageMap);
    return { text: resolved.matched ? text : null, sources: resolved.sources, evidence: { matched: resolved.matched } };
  });
  const questions = pack.questions.map(item => {
    const question = requiredText(item?.question, 500);
    const answer = requiredText(item?.answer, 1000);
    const resolved = resolveSources(item, passageMap);
    return { question: resolved.matched ? question : null, answer: resolved.matched ? answer : null,
      sources: resolved.sources, evidence: { matched: resolved.matched } };
  });
  const allItems = [...summary, ...questions];
  return {
    summary, questions,
    evidence: { matched: allItems.filter(item => item.evidence.matched).length, total: allItems.length }
  };
}
