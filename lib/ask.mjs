import { AppError, validateNotes, buildSourcePassages, resolveSources } from './evidence.mjs';
import { buildQuestionPrompt } from './prompts.mjs';
import { requestGemmaJson } from './gemma.mjs';

export function validateQuestionInput(body) {
  const notes = validateNotes(body?.notes);
  if (typeof body?.question !== 'string' || !body.question.trim() || body.question.length > 500) {
    throw new AppError(400, 'Write a question of up to 500 characters.');
  }
  return { notes, question: body.question.trim() };
}

export async function answerFromNotes({ notes, question, apiKey, fetchImpl = fetch }) {
  return requestGemmaJson({ ...buildQuestionPrompt({ notes, question }), apiKey, fetchImpl, maxOutputTokens: 1200 });
}

export function verifyNoteAnswer(raw, notes) {
  if (typeof raw?.covered !== 'boolean') throw new AppError(502, 'Gemma returned an incomplete answer. Your question is still here; please try again.');
  if (!raw.covered) return { covered: false, withheld: false, answer: 'Not covered in these notes.', sources: [] };
  if (typeof raw.answer !== 'string' || !raw.answer.trim() || raw.answer.length > 1600) {
    throw new AppError(502, 'Gemma returned an incomplete answer. Your question is still here; please try again.');
  }
  const map = new Map(buildSourcePassages(notes).map(source => [source.id, source]));
  const resolved = resolveSources(raw, map, 6);
  const reasons = {
    missing_sources: 'Gemma did not provide a non-empty source ID list.',
    too_many_sources: 'Gemma selected more than six source references. Ask a narrower question.',
    invalid_source: 'Gemma selected an unknown or malformed source ID.'
  };
  if (!resolved.matched) return { covered: false, withheld: true,
    answer: `Answer withheld: ${reasons[resolved.reason]} The answer text has not been shown.`,
    referenceIssue: resolved.reason, sources: [] };
  return { covered: true, withheld: false, answer: raw.answer.trim(), sources: resolved.sources };
}
