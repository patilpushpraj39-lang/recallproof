# Validation record

This record distinguishes automated synthetic checks from a live Gemma demonstration.

## Initial state

- The participant reported a successful `READY` generation using `gemma-4-26b-a4b-it` from the current campus network before this application was built. This is a terminal connectivity test, not an app acceptance test.
- The new project directory was empty when inspected. A fresh local Git repository was initialized after the participant reported the official coding start on October 22, 2026.
- No API key has been copied into the project files.

## Observed automated and browser checks

- All 16 automated tests passed with Node's test runner after allowing the local HTTP checks outside Codex's restricted network environment. The tests used synthetic notes and mocked model responses; no real model call was made.
- The first restricted run passed the 11 non-network checks but its five local HTTP checks failed. A focused retry showed `connect EACCES 127.0.0.1`, establishing a tool restriction. The stalled run was stopped; the unrestricted rerun passed all 16 checks.
- A browser preview of the actual app loaded at `http://127.0.0.1:4173/` after its temporary server was run outside the same restriction. The restricted preview initially timed out.
- In the initial no-key preview, the desktop layout and sample-notes control were inspected in the in-app browser. The sample filled 311 characters and generation correctly stayed disabled because that preview had no API key. Later live checks are recorded below.
- The temporary preview server is stopped before handing the participant the normal launch command.

## Checks pending

- Narrow-screen layout and broader live failure/limited-note cases.
- Full manual semantic review of all generated answers and their selected passages; source-reference counts alone are not an accuracy measure.
- Current Graphify indexed-commit and graph-scope confirmation; the participant supplied a successful earlier hosted graph screenshot as recorded below.
- Broader live feedback cases, including absent claims and confidence-priority behavior; two participant-run answer cases are recorded below.
- Event submission acceptance.

## Demo cases to record honestly

1. Normal study notes: generate, reveal an answer, highlight its source passage, and manually check whether the passage supports the answer.
2. Limited notes: verify that the app does not claim facts absent from the source; record what the real model actually does.
3. Empty input: generation stays disabled.
4. Connection or provider failure: the app shows an error and allows another attempt.

Never present a mocked response or synthetic test as a live Gemma result. Source-reference counts are not an accuracy score.

## First live app failure and source-reference revision

- The participant started the real app and supplied a screenshot of an actual generated result: only 2 of 6 model-provided quotations matched; two summary points and two question cards were withheld. The network request completed, but the resulting pack was not good enough for the intended demo.
- The original mismatched quotation strings were not retained. The screenshot alone does not establish whether paraphrasing, punctuation, whitespace, or another difference caused each mismatch.
- Before editing, 10 affected source/documentation/test files were copied under ignored `work/before-source-reference-fix/`; the copies were verified by SHA-256.
- The revised approach sends numbered source passages to Gemma and asks it to select existing IDs rather than reproduce quotations. The backend validates IDs, retrieves text directly from the notes and retains exact highlighting positions. Invalid references still withhold the corresponding item.
- A regression test deliberately includes an incorrect answer linked to an existing passage. It remains linked: source existence does not establish semantic correctness. The interface and README disclose this limitation.
- The first rerun also discovered 16 old backup tests under `work/`, producing an inflated count of 35. The npm test command was corrected to select only the three current test files; backup tests must not count as current coverage.
- After that correction, all 19 current regression tests passed, with zero failures. These are synthetic and mocked-provider checks; subsequent live checks are separately recorded below.
- A restart is required for the running Node backend to load the new implementation. The browser checks the response version and asks for a restart instead of mixing the old and new formats.

## Subsequent participant-run live checks

- Python lists/tuples sample: the participant supplied a screenshot showing 6 of 6 items linked, three summary points and three recall cards. The visible summary agreed with the supplied practice notes. The participant subsequently reported that opening a card's source correctly highlighted the corresponding note sentence. This highlighting check is participant-reported, not an independent browser automation result.
- HTML/CSS/JavaScript/browser sample: the participant supplied a second screenshot showing 6 of 6 items linked. The visible summary correctly described HTML structure, CSS appearance and JavaScript interaction, and the three questions concerned facts present in the new notes. The participant confirmed this sample followed the notes. Collapsed answers were not independently inspected in the screenshot.
- These are two successful sample runs, not a general accuracy benchmark. Wrong-but-existing evidence selection remains a limitation.

## Graphify and submission preparation

- The installed Graphify launcher was blocked by Windows Application Control when invoked by the agent, both in the restricted environment and on an approved unrestricted attempt. The agent did not disable or change that policy.
- Graphify had previously worked in the participant's VS Code terminal for an unrelated practice fixture. Extraction of this actual application is now being handed to that terminal; no successful actual-project graph is claimed yet.
- The initial `.graphifyignore` scoped the graph to application code. Following the participant's later report about graph-size judging, it was changed to include the genuine test suite as well. Development backups, generated graphs and environment files remain excluded; approved judging scope is still to be confirmed with the representative.
- The participant clarified that the organizer has not yet announced an exact submission deadline. Any internal readiness target is not an official event cutoff.
- The participant's own VS Code PowerShell launch was also blocked. A read-only signing check reported the installed `graphify.exe` launcher as `NotSigned`; Windows Code Integrity event 3077 explicitly recorded this launcher failing signing/policy requirements. These observations establish an OS application-control block, not a campus network problem or a proven package defect. No policy bypass or security-setting change was performed. Vendor/organizer help with an approved installation or hosted workflow remains pending.

## Public repository and practice upgrade

- With the participant's chosen owner, the repository was created at `https://github.com/patilpushpraj39-lang/recallproof`. All 16 initial files were published in commit `600becea2c1fd0985e05d9d0fe070d6f8d161a16`; its Git tree matched the local working project exactly. Anonymous HTTP requests returned 200 for the repository, README and MIT license. The local project was linked to origin/main, with the original local commit retained on master.
- The participant reported that the Graphify representative described graph size, edges and joints as judging factors. This is participant-supplied event guidance, not an independently obtained complete rubric. The upgrade adds real functionality and dependencies rather than dummy functions or fabricated graph artifacts.
- Version 0.2 adds typed answer practice, student confidence, source-linked Gemma feedback, a review-priority flag, retries, assisted-attempt context and an in-memory review queue. It uses the existing Gemma model and shared transport; no new service or secret storage is introduced.
- All 32 current automated tests passed after the upgrade. These use synthetic inputs and mocked provider responses and do not establish live feedback quality.
- A temporary test server on port 4174 used clearly labelled SIMULATED UI TEST responses, no real key and no external model calls. Browser checks verified answer submission, confidence selection, feedback rendering, exact source highlighting, flagged-card filtering and a retry changing the progress display from one review flag to zero. This is synthetic interface evidence, not a live Gemma demonstration.
- At the time of the 0.2 release, live feedback was pending. Subsequent participant-run checks are recorded below. Source-reference checks cannot prove that Gemma's feedback verdict is correct.

## Participant screenshots after the 0.2 release

- Graphify Cloud indexed `patilpushpraj39-lang/recallproof`. The dashboard showed 88 nodes; a later graph view showed 100 nodes and 185 edges: 183 extracted, 2 inferred, zero synthesized and zero observed. The reason for the dashboard/graph count difference was not verified. These are participant-supplied screenshot observations, not a locally generated graph, an audited coverage result or guaranteed current counts. The indexed commit was not visible in those screenshots.
- The participant restarted the real application. A Python notes screenshot showed 6/6 references and the new answer form. Submitting deliberately reversed list/tuple facts produced conflicting feedback and the actual list/tuple source passages, with one review flag.
- The confidence selector in that screenshot was unsure. It did not validate the felt-sure priority warning.
- A correct paraphrase initially failed with the generic provider-error message. One manual retry later returned supported feedback and the relevant original passages. This is evidence of a successful retry, not proof of the precise upstream failure cause or general availability.
- Only these two live answer cases have been seen. No general semantic-accuracy or learning-outcome claim is made. Event submission has not opened according to the participant.

## Version 0.3 reliability and export

- Before editing, nine changed existing files were backed up under ignored `work/before-reliability-export/` and verified by SHA-256.
- Completed packs and practice attempts are retained on failed same-notes regeneration. Editing notes still intentionally clears the session. A corrected final flagged answer restores all cards.
- An explicit plain-text session export includes original notes, generated content, sources and checked attempt history; it selects fields rather than serializing transport objects. It excludes unsubmitted drafts and credentials. There is no automatic persistence or import feature.
- Provider HTTP status categories are shown without copying diagnostic bodies. A previous generic error cannot be retroactively attributed to a particular status.
- All 35 automated tests passed, including new credential-exclusion/report and provider-status checks. These use synthetic inputs and mocked providers.
- On a labelled synthetic preview at port 4174, browser checks confirmed that a forced regeneration error left the existing summary, questions, typed answer, feedback and progress intact. A correction while viewing flagged cards cleared the flag and restored all three cards. The export button was clicked; the browser's downloaded-file arrival has not yet been independently confirmed. The report builder contents were verified by automated tests.

## Subsequent participant confirmations

- The participant supplied a screenshot of `recallproof-session.txt` opened in Notepad containing original notes, summaries and source passages. A later screenshot showed two checked attempts separately recorded with unsure/sure confidence, conflicting feedback and the original S3/S5 passages. These establish participant-run file arrival and visible report content; no general filesystem or private-file audit was performed.
- A real confident wrong answer showed the selected sure confidence, one felt-sure flag, the review-priority message and the original supporting passages. This closes the earlier pending confidence-warning example, not broad semantic evaluation.
- A later Graphify graph-view screenshot reported 104 nodes and 198 edges: 196 extracted, 2 inferred, zero synthesized and zero observed. Selected nodes showed `app.js` with 21 connections and `verifyStudyPack()` with 9 connections in the loaded graph. These remain participant-provided snapshot observations with indexed commit and complete edge-type coverage unverified.

## Version 0.4 notes-question addition

- Fourteen existing files were backed up under ignored `work/before-ask-notes/` and verified by SHA-256 before editing.
- Added a bounded question form and `/api/ask`, sharing model transport, input/origin checks and the one-request concurrency gate. Model-reported coverage false produces a fixed not-covered response and discards any accompanying outside facts. Claimed covered answers with invalid source IDs are withheld. Coverage and semantic correctness still depend on the model.
- Later practice attempts retain a study-help disclosure when the notes assistant was consulted; the latest five responses are included in the explicit session export. This does not claim independent mastery.
- All 46 automated tests passed. New checks cover question validation, original-source retrieval, not-covered behavior, malformed output, invalid references, the semantic limitation, question-as-data prompt construction, HTTP protections, concurrency, help context and export content. They use mocked providers; they do not prove model abstention or injection resistance.
- A labelled synthetic browser preview on 4174 checked a linked answer, opening its original passage, not-covered output with no outside facts displayed, invalid-source withholding, and a later practice attempt's help disclosure. No real key or external model call was used.
- Live acceptance of Ask your notes remains pending after restart: ask a covered comparison, then a question absent from the notes, inspect actual output and its source passages. The new report section also needs participant inspection. The prior graph counts predate this addition.
