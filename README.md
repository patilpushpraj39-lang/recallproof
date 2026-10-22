# RecallProof

Revision cards with inspectable evidence, powered by **Gemma 4**.

Students can get plausible answers from AI without noticing that the explanation goes beyond their notes. RecallProof divides notes into numbered source passages. Gemma chooses source IDs for each generated summary point and answer; the backend validates those IDs and retrieves the original text itself. Items with missing or invalid references are withheld, and students can highlight the original passages.

**Important limitation:** an existing source reference does not prove that it supports the associated claim. The model can select the wrong passage or misinterpret a genuine one. RecallProof validates reference existence and retrieves original source text, not factual or semantic correctness; it cannot determine whether the source notes themselves are correct.

## Run locally on Windows

Requires Node.js 22 or later and a Google AI Studio API key with access to `gemma-4-26b-a4b-it`. No npm dependencies are required.

Open a PowerShell terminal in this folder, then run:

```powershell
npm start
```

Paste your key into the hidden terminal prompt once, then press Enter. Open **http://127.0.0.1:4173**. Use **Try sample notes**, then **Create my study pack**. Press Ctrl+C in the terminal to stop.

The key is kept in server memory and is not sent to the browser or saved by this app. Alternatively, the launcher reads `GEMINI_API_KEY` from its process environment. Never commit a key or paste one into a screenshot or GitHub issue.

Notes are sent to Google's hosted Gemini API to run Gemma. This is an online API prototype, not offline inference. Notes and generated packs are not persisted by the application. Google's service has its own terms and data handling policies.

## What it does

1. Accepts up to 12,000 characters of factual study notes.
2. Divides notes into numbered passages and asks Gemma for up to three summary points and three distinct recall questions with answers and source IDs.
3. Validates the source IDs on the backend, retrieves the original passages, and withholds items with invalid references. Comparisons can reference up to three passages.
4. Lets students think before revealing an answer and inspect its highlighted source passage.

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
```

The backend binds to loopback only, rejects foreign browser origins and unexpected hostnames, serves only explicitly listed public assets, and never exposes raw provider error responses. This is a local prototype; it has no accounts, durable storage or public deployment hardening.

## Tests

```powershell
npm test
```

Automated tests use synthetic data and mocked model responses. They cover invalid source IDs, source retrieval, Windows line endings, the semantic limitation, invalid inputs, credential redaction, upstream failures, local HTTP handling and overlapping requests. The test command explicitly selects the current test files, excluding ignored development backups. Tests do **not** establish real model quality or live end-to-end generation. See [VALIDATION.md](VALIDATION.md) for observed results and pending checks.

## Graphify

After the project is working, map its actual code using Graphify. Inspect the relationship from `createRecallServer` to `generateStudyPack` and `verifyStudyPack`; confirm the relationships actually appear in your generated graph before presenting them. Generated graphs are ignored by Git by default. Follow the host's instructions for the separate Graphify submission and do not include secrets or unrelated code.

## Model, dependencies and assistance

- Model: [`gemma-4-26b-a4b-it`](https://ai.google.dev/gemma/docs/core/gemma_on_gemini_api), hosted through Google's Gemini API.
- Model usage is governed by the applicable [Gemma terms](https://ai.google.dev/gemma/terms), separate from this application's MIT license.
- Runtime: Node.js standard library, browser HTML/CSS/JavaScript. No npm dependencies.
- AI assistance: OpenAI Codex generated the initial application, styling, tests and documentation and assisted with debugging. The participant supplies the problem selection, local execution, testing feedback and demonstration; independent understanding must be demonstrated, not assumed.
- Development began after the participant reported the event's coding start on October 22, 2026. The earlier two-file Graphify practice is not included.

## License

Application code: MIT. See [LICENSE](LICENSE). A public GitHub repository and event submission have not been created by merely running this app locally.
