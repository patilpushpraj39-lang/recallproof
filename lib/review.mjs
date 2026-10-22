import { AppError, validateNotes, buildSourcePassages, resolveSources } from './evidence.mjs';
import { buildReviewPrompt } from './prompts.mjs';
import { requestGemmaJson } from './gemma.mjs';

const VERDICTS = new Set(['supported', 'partial', 'conflicting', 'not_covered', 'uncertain']);

export function validateReviewInput(body) {
  const notes = validateNotes(body?.notes);
  if (typeof body?.question !== 'string' || !body.question.trim() || body.question.length > 500) {
    throw new AppError(400, 'Choose a question from your study pack.');
  }
  if (typeof body?.answer !== 'string' || !body.answer.trim() || body.answer.length > 2000) {
    throw new AppError(400, 'Write an answer of up to 2,000 characters before asking for feedback.');
  }
  if (!['sure', 'unsure'].includes(body.confidence)) throw new AppError(400, 'Choose how sure you feel about your answer.');
  return { notes, question: body.question.trim(), answer: body.answer.trim(), confidence: body.confidence };
}

export async function reviewAnswer({ notes, question, answer, apiKey, fetchImpl = fetch }) {
  return requestGemmaJson({ ...buildReviewPrompt({ notes, question, answer }), apiKey, fetchImpl, maxOutputTokens: 1200 });
}

export function verifyReview(review, notes, confidence) {
  if (!VERDICTS.has(review?.verdict) || typeof review?.feedback !== 'string' ||
      !review.feedback.trim() || review.feedback.length > 1400) {
    throw new AppError(502, 'Gemma returned incomplete feedback. Your answer is still here; please try again.');
  }
  const passageMap = new Map(buildSourcePassages(notes).map(source => [source.id, source]));
  const resolved = resolveSources(review, passageMap);
  const canHaveNoSources = ['not_covered', 'uncertain'].includes(review.verdict) &&
    Array.isArray(review.sourceIds) && review.sourceIds.length === 0;
  if (!resolved.matched && !canHaveNoSources) {
    return { verdict: 'uncertain', feedback: 'Feedback withheld: Gemma selected a missing or invalid source passage. Review the notes or try again.',
      sources: [], withheld: true, needsReview: true, priority: false };
  }
  return { verdict: review.verdict, feedback: review.feedback.trim(), sources: resolved.sources,
    withheld: false, needsReview: review.verdict !== 'supported',
    priority: confidence === 'sure' && ['partial', 'conflicting'].includes(review.verdict) };
}
