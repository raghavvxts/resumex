# Resumaxer fixes

Implemented locally against the production audit. The public Vercel/Render deployments have not been changed.

## Repaired behavior

- PDF generation offers Jake and Deedy through pinned Tectonic and Simple through ReportLab. Build-time warming downloads dependencies; request-time compilation uses only cached packages, escaped text, untrusted mode, concurrency bounds and a deadline. The builder previews the exact downloadable PDF.
- Builder fields are editable, including personal information, summary, education, experience, projects and skills. AI changes require explicit review. Bullet replacement requires choosing an original bullet; undo restores the previous edit. Editing invalidates an old PDF preview. Manual editing/export remains available when AI parsing fails.
- Seniority and numeric experience state are consistent. Analysis, skills, chat and letters use the selected input mode and effective job description. Pasted text is not replaced by an older uploaded PDF.
- Chat receives pasted resumes, seniority, experience and role/content history. Concurrent sends are disabled, and stale responses are ignored after a new scan or reset. Removed unrelated Google Search grounding.
- Cover letters respect tone instructions and enforce a 150-word cap for Concise (300 for other tones). Letters remain editable, copyable and downloadable as text.
- General audit shows section completeness rather than ATS/job alignment claims. Removed the duplicate role-match card. Targeted scans label TF-IDF similarity and keyword coverage as estimates. Section charts are no longer called skill proficiency.
- Keyword normalization strips trailing punctuation and filters English/recruitment filler while retaining technical terms. Percentages such as `30%.` count as quantified achievements.
- AI outages return explicit errors instead of invented skills, fixed proficiency scores, generic letters or backend-error text inside candidate fields. Parsed resume and skills responses are validated before reaching the UI.
- Requests have a 90-second client deadline and can be cancelled from the scan drawer. Model calls have bounded timeouts. Removed simulated progress stages and the artificial completion delay. Render uses threaded workers with an appropriate request timeout; free-hosting cold starts themselves remain an infrastructure limitation.
- Generated letters and skills results survive route navigation. Optional local drafts restore resume text, edited fields, analysis and generated outputs after refresh. Saving failures are surfaced. Clear data removes the local draft and resets dependent state; older responses cannot repopulate it.
- Mobile toolbar wraps without clipping. Route changes reset the content scroll position. Secondary text contrast, focus indicators, reduced-motion support, dialog focus trapping/Escape dismissal, labels and button semantics were improved.
- Restored Deedy using its actual upstream class and fonts. Removed duplicated export implementation, generic suggestion tiles, unconditional Online status and unused broken API/toast files. Standardized the interface name to Resumaxer and labeled company templates as illustrative examples.
- Added real test discovery, corrected the TypeScript script, replaced stale E2E selectors and added GitHub Actions checks.

## Verification

- TypeScript application and tooling checks: passed.
- ESLint: passed.
- Vite production build: passed.
- Frontend regression tests: 12 passed.
- Backend regression tests: 19 passed, including actual PDF parsing after export, malformed/corrupt inputs, AI outage behavior, chat context and concise-letter length.
- Local browser: audited text/general and custom-JD scans, working seniority, manual builder, PDF preview and actual download, mobile toolbar, local draft refresh recovery, and clear/reset behavior.
- Rendered an exported PDF to an image and checked its layout and extracted text.
- Clean browser run showed no JavaScript errors. Expected AI-unavailable states were shown because no local Gemini key is configured.
- The updated Playwright E2E spec is included in CI; the Playwright command was not run locally. Browser verification was performed through the connected browser instead.

## Deployment and remaining limits

Deploy both services together. The backend needs the updated requirements (`reportlab`), build script and worker settings. The frontend needs `VITE_API_BASE_URL` set to that backend. Keep `GEMINI_API_KEY` server-side and configure `FRONTEND_ORIGINS` for the deployed frontend.

Production Gemini behavior and live infrastructure latency are checked separately from local controlled tests. Local AI contracts were tested with controlled responses; model output still requires user factual review. Scanned PDFs are not OCR'd: the error explains how to paste text instead. No accounts, job board or server-side resume database were added.

## Follow-up workflow improvements

- Reports now lead with up to three prioritized findings and direct edit/guidance actions. Scores are compact and supporting charts were replaced with expandable section and requirement details.
- Resume editing uses a split layout with a sticky PDF pane on desktop and a jump-to-preview link on mobile. Generation is debounced while typing and can be paused. Older responses cannot replace the current preview.
- PDF.js renders the actual exported file directly, including multi-page navigation and fit-width/150%/200%/300% zoom. The parser and worker are loaded only when a PDF preview is needed; unsupported built-in browser PDF viewers no longer leave a blank iframe. This adds a dedicated, lazy-loaded PDF dependency and its worker asset.
- Summary and bullet suggestions show original and suggested wording side by side, with skip/reveal and undo controls. Editing synchronizes the resume text used for later analysis and marks previous scan results as outdated.
- Up to 20 named application versions are saved explicitly on the current browser, independently of automatic draft saving. Snapshots include the resume, target, analysis and generated outputs. Loading a version first saves any unsaved resume as a recovery copy; if that write fails, loading stops without replacing current work. Clear data removes all saved copies. No cloud synchronization or accounts were added.
- Added regression coverage for version restoration, recovery copies, storage failures, preview debouncing and findings-first ordering. Browser-verified actual PDF rendering, two-page navigation, mobile zoom and multiple named application versions with fictional data.
- The initial application bundle no longer includes the unused charting code. The PDF renderer is a separate lazy-loaded chunk; the build's size warning refers to this renderer chunk.

See the final deployment notes below for production verification. Use the updated frontend lockfile when installing dependencies; the PDF library supports Node 22.13+ or Node 24+ for its Node tooling.

## November 18 continuation

- Added genuine Jake and Deedy layouts, template selection retained in application versions, upstream attribution and font licenses. Simple provides wrapping/pagination for content that exceeds a fixed template. Unsupported glyphs and overflowing layouts are rejected rather than silently clipped.
- Parsing compares source sections, bullet counts, email addresses and percentage metrics, flagging possible omissions. Additional source sections trigger review. Export waits for explicit acknowledgment when warnings exist; original text remains available for comparison.
- Added an optional local Ollama provider without exposing the model to the public internet. All five synthetic workflows passed; see LOCAL_MODEL_BENCHMARK.md. Gemini remains the default for the hosted site.
- Saved drafts and versions reject malformed field shapes. Recovery was checked after refresh, at the 20-version limit, and when browser storage fails.
- Frontend has 18 passing tests. Backend has 19 passing tests, plus separate actual compiler verification. See PERFORMANCE.md for the controlled slow-device/network check.

Deployment repair: Render had a custom PATH value `/opt/render/project/src/backend/.bin:$PATH`. Environment values do not expand the shell variable, so this hid system commands and caused `/home/render/colors.sh: tput: command not found` before the build script. Removed that override; template export resolves its binary explicitly. No API credentials were changed.

Live backend verification (November 18): Render revision `af1252c` is healthy with Gemini active. Pasted-text parsing, analysis, skills, concise cover letter and chat returned HTTP 200 with valid content. Jake, Deedy and Simple PDFs downloaded and passed text extraction checks. Uploading the generated Jake PDF back into analysis also succeeded and preserved its name and 30% metric. Fixed templates took approximately 8–10 seconds on the free Render instance; preview requests are serialized so edits queue the latest content instead of overlapping exports.

Live review follow-up: the original-bullet chooser now includes both experience and project bullets, and clears stale selections after edits. AI output instructions keep coaching questions and placeholders out of draft-ready rewrites. Added a regression proving a project rewrite leaves experience unchanged.
