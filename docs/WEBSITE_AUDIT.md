# ResumeX website audit

Date: 11 November 2026 (IST). Target: https://resumaxer.vercel.app

Tested the deployed website with fictional pasted resume data and the repository's generic John Doe sample PDF. Reviewed the cloned main branch to explain observed behavior. The deployed bundle differs from the local build, so source-only findings below are identified separately. No application fixes or deployment changes were made.

## Implementation update

The findings below record the original production audit. Implementation changes and verification are documented in [FIXES.md](FIXES.md).

## Coverage and results

| Flow | Result |
| --- | --- |
| Landing page and navigation | Working; desktop and 390 x 844 mobile inspected |
| Paste resume / general audit | Completed after a long initial wait |
| PDF upload / Google SWE template | Completed; sample PDF extracted and scored |
| Custom JD validation | Correctly rejected a two-word JD with a 20-word minimum message; successful custom analysis not separately exercised |
| Seniority selection | Broken: selecting Senior raises `TypeError: p is not a function` |
| Experience entry | Accepted numeric input |
| Structural parsing / builder preview | Correctly extracted fictional name, contact, education, experience, projects and skills in API response; preview omits projects |
| Skills analysis | API returned populated technical, soft and domain categories and gaps |
| Cover letter | API returned a tailored letter; selected Concise tone was not honored |
| Strategist chat | Responded, but lost pasted resume context and described the candidate as junior with zero experience |
| Dossier | Opened and showed rewritten summary and generic bullet templates; Copy All displayed Copied; clipboard content not independently verified |
| PDF export | Broken: POST /generate-pdf returned 500 with {"error":"An internal error occurred."} |
| Clear Data | Cleared active input/results, but left the empty report layout rather than restoring the landing state |
| Refresh | Cleared all resume/analysis state |

## Fix first

### 1. Repair PDF generation — high priority, live failure

The primary deliverable cannot be exported. The observed API response was HTTP 500. Browser evidence does not establish whether the cause is the compiler binary, LaTeX packages, template input or another server error. Inspect backend logs using the failed request, then add a realistic export smoke test. Show a useful inline error with retry instead of a generic alert. Both the topbar and builder use this endpoint.

### 2. Repair seniority and shared request context — high priority, live + source

`ConfigDrawer.tsx` reads `roleLevel` and `setRoleLevel`, but `ResumeContext.tsx` provides neither. The selector visibly changes in the browser but its handler throws. Skills and cover-letter requests instead send `selectedRole` (observed value `swe`) as `role_level`, which the server treats as invalid and resets to junior. Add the missing shared seniority state and pass the effective target, seniority, experience and selected input mode consistently to every feature.

### 3. Restore chat resume and history context — high priority, live + source

After analyzing a three-year engineer's pasted resume, chat replied: "I don't have your current resume" and described zero experience. The frontend sends `resume_text`, but `/chat` only extracts an uploaded file. The frontend history uses `role/content`; the backend reads `sender/text`, discarding its contents. The request also omits seniority and experience. Fix these contracts before adding more chat features. Disable concurrent sends or associate replies with message IDs: current code replaces the last message, which can corrupt out-of-order replies.

### 4. Correct score meaning and keyword extraction — high priority, live + source

General audit displayed 100% ATS Score, 85% Role Match, zero matched keywords and "No critical gaps found" without any target JD. In this mode, 100% represents five detected section headings, not demonstrated ATS compatibility. The radar measures sections, not skill proficiency. Overall Match and Role Match reuse the same score.

The PDF template run returned 6.83% match and recommended missing terms such as `looking`, `must`, `have` and `technologies.`. Remove recruitment filler and trailing punctuation, preserve technical terms such as C++/C#, and prioritize job requirements. Label similarity as an estimate and explain its basis. In audit mode show section completeness/readability; show job alignment only with a target. Do not imply interview odds or verified compatibility with an employer's ATS.

The audit also missed the sample's `30%` metric: `has_metrics` uses `\b\d+%\b`, which does not match a percentage followed by a space or period. Fix and regression-test percentage recognition.

### 5. Stop silent substitutions and unapproved rewrites — high priority, source

The builder and topbar automatically replace bullets in the first job with AI rewrites. The preview shows original data, while export uses changed data. Offer before/after review, per-bullet approval and factual checks; export exactly what the preview shows. Never invent metrics or attach a rewrite to the wrong employer.

When AI fails, skills returns fixed scores, generic gaps and sometimes invented default skills; cover letters return an undisclosed generic fallback. Parsing returns backend-error messages inside candidate fields with HTTP 200. These paths were found in source, not induced in production. Return explicit degraded/error states and keep the original resume safe.

### 6. Fix controls that promise unavailable behavior — medium priority

- Cover-letter backend never reads `tone`; all options use the same prompt. Enforce tone and length server-side, and keep tone controls available after generation.
- Deedy is selectable, but only `backend/templates/jakes_resume.tex` exists. The backend silently falls back to Jake's. Remove Deedy until implemented, or provide the real template and a matching preview.
- Template analysis creates a local effective JD but does not save it to shared state. Downstream chat, skills and cover letters can run without that target, or with an older custom JD. Store one effective target and invalidate generated output when it changes.
- Skills, cover letters and chat infer PDF mode from whether an old file exists, rather than honoring `resumeInputMode`. Switching from PDF to text can silently use the older PDF.

### 7. Improve reliability and reset behavior — medium priority

Initial requests waited several minutes while progress phrases rotated; a separate backend health GET timed out at 30 seconds. Subsequent requests completed, so this was not a permanent outage. Cold start versus upstream latency was not established. Add request deadlines, cancel/retry, elapsed time, server timing and clear delayed-service messaging. Replace simulated stages with actual request state; remove the extra 3.6-second ceremony after the response.

Refresh loses results. Skills and cover letters also keep generated outputs in page-local state, so navigation can discard them. Offer opt-in local draft saving with an explicit clear action, and retain generated outputs across routes. Avoid requiring accounts just to preserve a draft.

Clear Data does not reset uploadStatus, parsed dossier text, strategist query or chat history. Clear all resume-dependent state and return to the upload screen; cancel outstanding requests so an old response cannot repopulate cleared data.

## UI improvements

1. Make mobile actions fit. At 390 x 844, the completed-report header wrapped its export/clear buttons and the captured report had these actions partially above the viewport. Use a compact mobile toolbar or overflow menu, prevent header shrink, and verify auto-scroll keeps controls reachable.
2. Raise secondary-text contrast. Labels use dark gray on near-black, especially template descriptions, score captions and field help. Increase text size and contrast; preserve purple for the primary action.
3. Lead with an actionable report: three prioritized issues with the source bullet, suggested revision and Apply/Skip. The current four suggestion cards are static prompts, while useful returned action plans and recommendations are mostly hidden.
4. Add a visible Edit resume / Change target / New scan action after analysis. Currently users mainly have Clear Data, making iteration awkward.
5. Make the builder an editor: editable parsed sections, missing-field warnings, project/summary preview, accurate page preview and export. Currently it is a template selector and download screen.
6. Use one product name consistently: domain Resumaxer, interface ResumeX. Rename View Dossier to View resume suggestions; remove LaTeX from normal user-facing action labels.
7. Improve keyboard/screen-reader support. Template, tone and target-mode choices are clickable divs without native button/radio semantics. Add field labels, selected state, named close/send buttons, dialog semantics, focus trapping, Escape dismissal and focus restoration. These are source findings, not a complete assistive-technology audit.
8. Keep Copy visible on touch devices and show clear copy failure feedback. Use a real newline in Dossier Copy All; source currently joins with a literal backslash-n.
9. Explain resume handling near upload: where text is processed, whether it is stored, and how to clear it. No data-retention claim was independently verified.

## Useful feature upgrades, in order

1. Reviewable resume editing with before/after changes and undo.
2. Real job-target matching with requirement evidence and missing-skill importance.
3. Persistent local drafts and reusable generated letters across navigation.
4. In-place cover-letter editing, enforced tone/length, recipient/company fields and plain-text download.
5. A short, prioritized skills plan tied to the target JD and evidence from experience, rather than unsupported proficiency scores.
6. Optional scanned-PDF support, or explicit detection and a Paste Text fallback. Current extraction has no OCR path.

## Remove or simplify

- Remove Deedy until it produces a distinct output.
- Merge duplicate Overall Match / Role Match cards.
- Hide keyword and job-match cards in general audit mode.
- Replace the decorative section radar with clear section checks, or label it accurately as section coverage.
- Replace generic AI suggestion cards and placeholder bullet templates with actual findings; retain chat as an optional follow-up.
- Remove simulated loading stages and unconditional "Online" chat status.
- Treat Google/Meta/etc. templates as illustrative role examples, not employer-calibrated ATS benchmarks. Prefer a smaller role-template set plus an actual pasted JD.
- Keep one export path that respects the selected template and reviewed changes; topbar currently hardcodes Jake's and duplicates export logic.

Keep PDF/text input, analysis, skills, chat, cover letters and builder as the core set. Reliability and truthful outputs matter more than adding accounts, job boards or more charts now. Feature removals should eventually be checked against usage data; none was available for this audit.

## Automated checks

- Production build: passed.
- ESLint: passed.
- `npm run typecheck`: reported success, but root config has an empty files list and referenced projects are not checked by that command.
- Actual app check, `npx tsc -p tsconfig.app.json --noEmit`: failed with 15 diagnostics, including missing seniority context, experience type mismatches and broken/missing imports.
- `npm test`: failed because no matching tests were found. The only example is named `example.vitest.ts`, outside the configured `*.test` / `*.spec` pattern, and merely asserts true.
- Backend unit tests: five passed, one failed. The failing test uploads fake PDF bytes and expects successful extraction; the fixture/test is invalid rather than proof that valid PDF upload fails.
- Existing E2E spec was reviewed, not run: it expects removed UI text (Ready for Analysis / Start Your First Scan) and uploads a separate resume file. It needs current selectors and a disposable fixture before serving as useful regression coverage.

## Limits

Representative main flows were exercised, not every company/role/tone permutation. Successful custom-JD analysis, oversized/corrupt/encrypted/scanned PDFs, clipboard contents, every browser/device, load/security testing and backend production logs were not verified. PDF download content could not be inspected because generation failed. No live personal resume was uploaded. No feature was removed or fixed in this audit.
