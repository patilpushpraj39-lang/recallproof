import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { AppError, validateNotes, verifyStudyPack } from './lib/evidence.mjs';
import { MODEL, generateStudyPack } from './lib/gemma.mjs';
import { validateReviewInput, reviewAnswer, verifyReview } from './lib/review.mjs';

const ASSETS = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/dom.mjs', ['dom.mjs', 'text/javascript; charset=utf-8']],
  ['/practice.mjs', ['practice.mjs', 'text/javascript; charset=utf-8']],
  ['/session.mjs', ['session.mjs', 'text/javascript; charset=utf-8']],
  ['/export.mjs', ['export.mjs', 'text/javascript; charset=utf-8']]
]);

function respondJson(response, status, body) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
}

async function readBody(request) {
  let size = 0;
  const chunks = [];
  for await (const chunk of request) {
    size += chunk.length;
    if (size <= 65536) chunks.push(chunk);
  }
  if (size > 65536) throw new AppError(413, 'These notes are too large. Please shorten them.');
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new AppError(400, 'The request was not valid JSON. Refresh the page and try again.'); }
}

export function createRecallServer({ apiKey = process.env.GEMINI_API_KEY, generate = generateStudyPack, review = reviewAnswer } = {}) {
  let busy = false;
  const server = createServer(async (request, response) => {
    response.setHeader('cache-control', 'no-store');
    response.setHeader('x-content-type-options', 'nosniff');
    response.setHeader('referrer-policy', 'no-referrer');
    response.setHeader('content-security-policy', "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    try {
      const port = server.address()?.port;
      const allowedHosts = new Set([`127.0.0.1:${port}`, `localhost:${port}`]);
      if (!allowedHosts.has(request.headers.host)) throw new AppError(403, 'Open this app using its localhost address.');
      if (request.headers.origin && !new Set([`http://127.0.0.1:${port}`, `http://localhost:${port}`]).has(request.headers.origin)) {
        throw new AppError(403, 'This request did not come from the local app.');
      }
      const route = new URL(request.url, 'http://localhost').pathname;
      if (request.method === 'GET' && route === '/api/health') {
        return respondJson(response, 200, { configured: Boolean(apiKey), model: MODEL, schemaVersion: 3 });
      }
      if (request.method === 'GET' && ASSETS.has(route)) {
        const [file, type] = ASSETS.get(route);
        const content = await readFile(new URL(`./public/${file}`, import.meta.url));
        response.writeHead(200, { 'content-type': type });
        return response.end(content);
      }
      if (request.method !== 'POST' || !['/api/study', '/api/review'].includes(route)) return respondJson(response, 404, { error: 'Page not found.' });
      if (request.headers['content-type']?.split(';')[0].trim() !== 'application/json') {
        throw new AppError(415, 'Send notes using the study form.');
      }
      const body = await readBody(request);
      const input = route === '/api/review' ? validateReviewInput(body) : { notes: validateNotes(body?.notes) };
      const { notes } = input;
      if (!apiKey) throw new AppError(503, 'The API key is missing. Start the app with npm start and enter your key in the terminal.');
      if (busy) throw new AppError(429, 'A Gemma request is already running. Please wait.');
      busy = true;
      try {
        if (route === '/api/review') {
          const rawFeedback = await review({ ...input, apiKey });
          return respondJson(response, 200, { ...verifyReview(rawFeedback, notes, input.confidence), model: MODEL, schemaVersion: 3 });
        }
        const pack = await generate({ notes, apiKey });
        const checked = verifyStudyPack(pack, notes);
        return respondJson(response, 200, { ...checked, model: MODEL, schemaVersion: 3 });
      } finally { busy = false; }
    } catch (error) {
      // Do not expose provider responses, API keys, student notes, or stack traces.
      const known = error instanceof AppError;
      if (!response.headersSent) respondJson(response, known ? error.status : 500,
        { error: known ? error.message : 'Something went wrong. Please try again.' });
    }
  });
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  return server;
}
