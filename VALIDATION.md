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
- Graphify extraction of this actual project.
- Public repository, license visibility from an unauthenticated browser, and event submission acceptance.

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
- `.graphifyignore` limits the graph to application code, excluding the test directory, development backups, generated graphs and environment files. The separate automated tests remain in the repository.
- The participant clarified that the organizer has not yet announced an exact submission deadline. Any internal readiness target is not an official event cutoff.
- The participant's own VS Code PowerShell launch was also blocked. A read-only signing check reported the installed `graphify.exe` launcher as `NotSigned`; Windows Code Integrity event 3077 explicitly recorded this launcher failing signing/policy requirements. These observations establish an OS application-control block, not a campus network problem or a proven package defect. No policy bypass or security-setting change was performed. Vendor/organizer help with an approved installation or hosted workflow remains pending.
