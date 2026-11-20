# MatchMyRole - Milestone 2 evidence appendix

Team: Team Tower. Executed 20 November 2026. Source revision: `56fe9c4767b22be320a1f8a3067ab0f551bd308b`.

**Q17: 16. Q18: 4.** These counts refer to the records saved alongside this report, not historical development claims.

## Execution and limits

- Real requests through the actual Flask application's test client with real Ollama `qwen3.5:4b` inference on this computer. No mock AI responses.
- This is local backend/provider verification, not browser end-to-end or production Gemini verification.
- Settings: temperature 0.1, context 8192, maximum output 4096 tokens, thinking disabled; seed not fixed.
- All resume fixtures are synthetic. Complete inputs, actual outputs, timestamps and checks are saved in `test-data/milestone-2/T01.json` through `T16.json`.
- Expected criteria were defined in the runner before execution. Results: 13 Pass / 3 Fail. A failure means the stated criterion was unmet; it is retained, not edited into a pass.
- Automated checks cover bounded scores, response contracts, exact fixture facts, length and validation. They do not establish general hiring quality, fairness or complete factual accuracy.

## Test table

| Test | Input (short) | Type | Expected output | Actual output (short) | Pass / Fail |
|---|---|---|---|---|---|
| T01 | Alex Example; resume 456 characters; JD: We seek a junior software developer with Python, SQL, React and  | Normal | 200; bounded score and nonempty AI feedback | HTTP 200; score 22.83; AI unavailable; AI returned non-JSON text. Showing deterministic guidance only. | Fail |
| T02 | Jordan Example; resume 458 characters; JD: We seek a graphic designer experienced in typography, illustrati | Normal | 200; bounded score and nonempty AI feedback for unrelated role | HTTP 200; score 0.0; AI ok; 0 strengths, 3 weak points | Pass |
| T03 | Sam Example; resume 455 characters; no JD | Normal | 200; preserve Sam Example and the supplied 30% metric | HTTP 200; name Sam Example; 30% preserved: True | Pass |
| T04 | Taylor Example; resume 458 characters; JD: We seek a junior software developer with Python, SQL, React and  | Normal | 200; technical, soft and domain categories with bounded scores | HTTP 503: Skills analysis is temporarily unavailable. Please retry. | Fail |
| T05 | Robin Example; resume 457 characters; JD: We seek a junior software developer with Python, SQL, React and  | Normal | 200; nonempty cover letter of at most 150 words | HTTP 200; 145 words. Dear Hiring Team,  I am writing to apply for the junior software developer position. My background aligns dire | Pass |
| T06 | Casey Example; resume 457 characters; JD: We seek a junior software developer with Python, SQL, React and ; message: Rewrite the Flask API bullet using only the supplied ac | Normal | 200; response preserves the supplied 30% achievement | HTTP 200; Here is a rewritten version of that bullet point based strictly on the information provided:  Built a Flask API and reduced response time by 30% through query optimization.  *Note: Since you | Pass |
| T07 | Morgan Example; resume 458 characters; no JD | Edge | 200; general audit with bounded score and AI feedback | HTTP 200; score 100.0; AI ok; 3 strengths, 5 weak points | Pass |
| T08 | Lee Example; resume 78 characters; JD: We seek a junior software developer with Python, SQL, React and  | Edge | 200; handle resume without standard section headings | HTTP 200; score 14.48; AI ok; 3 strengths, 4 weak points | Pass |
| T09 | Avery Example; resume 457 characters; JD: We seek a junior software developer with Python, SQL, React and  | Edge | 200; normalize unknown role and negative experience safely | HTTP 200; score 23.18; AI unavailable; AI returned non-JSON text. Showing deterministic guidance only. | Fail |
| T10 | Boundary Example; resume 29993 characters; no JD | Edge | 200; accept a resume near but below the 30000-character limit | HTTP 200; score 20.0; AI ok; 0 strengths, 5 weak points | Pass |
| T11 | blank_pdf | Edge | 400; explain missing extractable text and OCR/paste alternative | HTTP 400: Could not extract text. Scanned PDFs need OCR; paste the resume text instead. | Pass |
| T12 | Empty resume; resume 0 characters; JD: We seek a junior software developer with Python, SQL, React and  | Invalid | 400; missing-resume error | HTTP 400: Missing 'resume' file or 'resume_text'. | Pass |
| T13 | Alex Example; resume 456 characters; JD: Python SQL developer | Invalid | 400; reject job description shorter than 20 words | HTTP 400: Job description is too short (3 words). Please paste at least 20 words for accurate matching. | Pass |
| T14 | text_file | Invalid | 400; reject unsupported .txt upload | HTTP 400: Only PDF files are accepted. | Pass |
| T15 | corrupt_pdf | Invalid | 400; reject corrupt PDF | HTTP 400: Invalid or corrupted PDF file. | Pass |
| T16 | Oversize Example; resume 30018 characters; JD: We seek a junior software developer with Python, SQL, React and  | Invalid | 400; reject resume exceeding 30000 characters | HTTP 400: Resume exceeds 30,000 characters or job description exceeds 20,000 characters. | Pass |

## Prompt iteration log

These are four new experiments performed on 20 November 2026. They are not reconstructed past runs. v1 reuses the user-supplied Milestone 1 baseline; v4 is the current application prompt. All use the same synthetic resume and JD for a controlled comparison, and are not counted again as distinct Q17 inputs. One run per version cannot establish consistency or statistical superiority.

| Version | What changed | Why | Observed result |
|---|---|---|---|
| v1 | Re-run the Milestone 1 baseline supplied in the screenshot. This is a new experiment, not a historical run. | Starting point: inspect output structure and factual grounding. | {"strict_json": false, "required_keys_present": false, "rewritten_bullet_count": 0, "all_bullets_at_most_40_words": false}; Grounding review: Unsupported rewrite claims include WCAG compliance, 95% code coverage and collaboration with backend engineers. Output is prose, not strict JSON. |
| v2 | Add the application JSON contract. | Assess whether explicit output fields improve machine-readable consistency. | {"strict_json": true, "required_keys_present": true, "rewritten_bullet_count": 3, "all_bullets_at_most_40_words": true}; Grounding review: JSON contract passes, but rewrites invent 85% code coverage, caching strategies and cross-functional collaboration. It also incorrectly calls 2025 a future date during a 2026 run. |
| v3 | Add factual-grounding and finished-bullet constraints. | Structured output alone does not prevent fabricated achievements or placeholders. | {"strict_json": true, "required_keys_present": true, "rewritten_bullet_count": 2, "all_bullets_at_most_40_words": true}; Grounding review: JSON and bullet-length checks pass, but under peak load and evidence of team collaboration are unsupported by the fixture. Grounding is still incomplete. |
| v4 | Use the current application job-match prompt, including seniority and its complete output constraints. | Compare the production prompt with the newly tested alternatives; final selection follows the existing implementation, not a claim it wins every case. | {"strict_json": true, "required_keys_present": true, "rewritten_bullet_count": 3, "all_bullets_at_most_40_words": true}; Grounding review: JSON and bullet-length checks pass, but the third rewritten bullet invents collaboration with engineering teams; deployment is also not evidenced. Current production prompt still needs factual-review safeguards. |

## Final prompt inventory

Six templates were extracted from `backend/app.py` (general audit, job match, cover letter, skills, career chat and resume parsing; trailing whitespace trimmed). They are saved in `prompts/final/`. General and job-match audit are mutually exclusive branches of one call, so six templates do not mean six calls on every input. The four-version experiment concerns P2 only.

## Known limitations and next actions

- Local-model results cannot be assumed to match hosted Gemini. Repeat selected cases against the deployed provider.
- Inspect full generated text manually for unsupported claims; machine checks alone are incomplete.
- Long input may exceed local context or latency limits even when request validation accepts it.
- Add the required 2-3 real browser screenshots and team-agreed contributions when assembling the full seven-section Milestone 2 PDF. This appendix is not that full submission.

## Provenance

AI-assisted preparation and execution, at the user's request. Team members must review the evidence; no member-specific completed work or consent is inferred. Synthetic test fixtures and runner are published with raw outputs for audit.
