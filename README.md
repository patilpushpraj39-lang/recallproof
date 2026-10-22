# RecallProof

Answer, inspect the evidence, and retry: a small revision coach powered by **Gemma 4**.

Students can get plausible answers from AI without noticing that the explanation goes beyond their notes. RecallProof divides notes into numbered source passages. Gemma chooses source IDs for each generated summary point and answer; the backend validates those IDs and retrieves the original text itself. Items with missing or invalid references are withheld, and students can highlight the original passages.

The practice flow asks students to write an answer and choose whether they feel sure or unsure before revealing a suggestion. Gemma gives notes-based feedback; the student can inspect the original passages, retry the question, and filter to cards flagged for review. A felt-sure answer that receives conflicting or partial feedback gets a review-priority note. This is a prompt for human review, not a verified diagnosis of misunderstanding.

**Important limitation:** an existing source reference does not prove that it supports the associated claim. The model can select the wrong passage, misinterpret a genuine one, or give incorrect feedback on a student's answer. Feedback is labelled as AI feedback, not an objective grade. RecallProof validates reference existence and retrieves original source text, not factual or semantic correctness; it cannot determine whether the source notes themselves are correct.

## Run locally on Windows

Requires Node.js 22 or later and a Google AI Studio API key with access to `gemma-4-26b-a4b-it`. No npm dependencies are required.

Open a PowerShell terminal in this folder, then run:

```powershell
npm start
```

Paste your key into the hidden terminal prompt once, then press Enter. Open **http://127.0.0.1:4173**. Use **Try sample notes**, then **Create my study pack**. Press Ctrl+C in the terminal to stop.

The key is kept in server memory and is not sent to the browser or saved by this app. Alternatively, the launcher reads `GEMINI_API_KEY` from its process environment. Never commit a key or paste one into a screenshot or GitHub issue.

Notes and submitted answers are sent to Google's hosted Gemini API to run Gemma. This is an online API prototype, not offline inference. Notes, generated packs, confidence choices and attempts are not saved to disk by the application. Practice progress exists in browser memory until the page is refreshed or notes change. Google's service has its own terms and data handling policies.

## What it does

1. Accepts up to 12,000 characters of factual study notes.
2. Divides notes into numbered passages and asks Gemma for up to three summary points and three distinct recall questions with answers and source IDs.
3. Validates the source IDs on the backend, retrieves the original passages, and withholds items with invalid references. Comparisons can reference up to three passages.
4. Lets students think before revealing an answer and inspect its highlighted source passage.
5. Reviews typed answers with Gemma using five possible feedback labels: supported, partial, conflicting, not covered, or uncertain. Missing evidence references withhold the feedback.
6. Keeps an in-session review queue, supports retries and records whether a suggested answer was revealed before an attempt. Progress counts attempts and review flags; it is not an accuracy or learning-gain score.

Short notes may produce fewer items. Empty input, API errors, quota limits and incomplete responses receive visible messages. There are no automatic retries that silently consume more quota.

## Architecture

```text
Browser: public/app.js
    POST /api/study (notes only)
Node backend: server.mjs
    validateNotes -> generateStudyPack -> verifyStudyPack
Gemma: lib/gemma.mjs -> Google's generateContent endpoint
Evidence checks: lib/evidence.mjs -> numbered passages + reference validation + original source positions
Browser: summary, reveal cards, highlighted passages

Browser practice: public/practice.mjs + public/session.mjs
    POST /api/review (notes, question, student answer, confidence)
Review validation: lib/review.mjs
    validateReviewInput -> buildReviewPrompt -> requestGemmaJson
    verifyReview -> resolveSources -> original passages
Browser: AI feedback -> priority note -> retry -> review queue
```

The backend binds to loopback only, rejects foreign browser origins and unexpected hostnames, serves only explicitly listed public assets, and never exposes raw provider error responses. This is a local prototype; it has no accounts, durable storage or public deployment hardening.

## Tests

```powershell
npm test
```

Automated tests use synthetic data and mocked model responses. They cover invalid source IDs, source retrieval, Windows line endings, the semantic limitation, feedback validation, retries, assisted attempts, session isolation, invalid inputs, credential redaction, upstream failures, local HTTP handling and overlapping requests. The test command explicitly selects the current test files, excluding ignored development backups. Tests do **not** establish real model quality or live end-to-end generation. See [VALIDATION.md](VALIDATION.md) for observed results and pending checks.

## Graphify

Map the actual project using Graphify. `.graphifyignore` includes both the application and its genuine tests while excluding development backups and generated output. Inspect the paths from `createRecallServer` to generation/evidence checking and from answer review through the shared Gemma client and source validation. Confirm these relationships actually appear before presenting them. No node or edge counts are claimed until a Graphify extraction succeeds. Generated graphs are ignored by Git by default. Follow the representative's instructions about eligible graph scope and submission.

The current Windows installation blocked the unsigned `graphify.exe` launcher. An approved vendor/organizer installation or hosted mapping route is pending; no security policy was disabled and no substitute graph is presented as Graphify output.

## Model, dependencies and assistance

- Model: [`gemma-4-26b-a4b-it`](https://ai.google.dev/gemma/docs/core/gemma_on_gemini_api), hosted through Google's Gemini API.
- Model usage is governed by the applicable [Gemma terms](https://ai.google.dev/gemma/terms), separate from this application's MIT license.
- Runtime: Node.js standard library, browser HTML/CSS/JavaScript. No npm dependencies.
- AI assistance: OpenAI Codex generated the initial application, styling, tests and documentation and assisted with debugging. The participant supplies the problem selection, local execution, testing feedback and demonstration; independent understanding must be demonstrated, not assumed.
- Development began after the participant reported the event's coding start on October 22, 2026. The earlier two-file Graphify practice is not included.

## License

Application code: MIT. See [LICENSE](LICENSE). Public source: https://github.com/patilpushpraj39-lang/recallproof . Publishing the repository does not complete the event submission.
