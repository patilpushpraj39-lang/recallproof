import { AppError } from './evidence.mjs';
import { buildStudyPrompt } from './prompts.mjs';

export const MODEL = 'gemma-4-26b-a4b-it';

export function parseStudyJson(text) {
  const clean = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try { return JSON.parse(clean); }
  catch { throw new AppError(502, 'Gemma did not return a readable study pack. Please try again.'); }
}

export async function requestGemmaJson({ instruction, input, apiKey, fetchImpl = fetch, maxOutputTokens = 3072 }) {
  let response;
  try {
    response = await fetchImpl(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: instruction }] },
        contents: [{ role: 'user', parts: [{ text: JSON.stringify(input) }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens, thinkingConfig: { thinkingLevel: 'minimal' } }
      }),
      signal: AbortSignal.timeout(45000)
    });
  } catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      throw new AppError(504, 'Gemma took too long to respond. Check your connection and try again.');
    }
    throw new AppError(502, 'Could not reach Gemma. Check Wi-Fi or try your hotspot.');
  }
  if (!response.ok) {
    if ([401, 403].includes(response.status)) throw new AppError(502, 'Google rejected the API credentials. Restart the app and enter a valid key.');
    if (response.status === 429) throw new AppError(429, 'Google reported a rate or quota limit. Wait before trying again; repeated clicks will not reset it.');
    if ([500, 502, 503, 504].includes(response.status)) {
      throw new AppError(502, `Google's model service returned HTTP ${response.status}. No result was recorded. Wait about 30 seconds before trying once more.`);
    }
    throw new AppError(502, `Google rejected the model request (HTTP ${response.status}). No result was recorded. If it repeats, check the model and request configuration.`);
  }
  let data;
  try { data = await response.json(); }
  catch { throw new AppError(502, 'Google returned an unreadable response. Please try again.'); }
  const candidate = data.candidates?.[0];
  if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
    throw new AppError(502, 'Gemma could not finish this study pack. Try shorter notes or try again.');
  }
  const text = (candidate?.content?.parts ?? []).filter(part => !part.thought && typeof part.text === 'string')
    .map(part => part.text).join('');
  return parseStudyJson(text);
}

export async function generateStudyPack({ notes, apiKey, fetchImpl = fetch }) {
  return requestGemmaJson({ ...buildStudyPrompt(notes), apiKey, fetchImpl });
}
