# Prompt evidence

`final/` contains six prompt templates extracted from the current `backend/app.py` implementation. Braces identify the source Python expressions injected at runtime. General-audit and job-match analysis are alternative branches, not simultaneous calls.

`v1/` to `v4/` contain newly tested versions of P2 (job-match feedback), executed on 20 November 2026. These are not claims about historical development:

1. v1 re-runs the baseline in the user's Milestone 1 screenshot.
2. v2 adds the output JSON contract.
3. v3 adds factual-grounding and finished-bullet constraints.
4. v4 uses the existing application prompt with role context and complete output constraints.

Actual outputs, changes, reasons and measured results are in `test-data/milestone-2/prompt-experiments.json` and `docs/milestone-2/EVIDENCE.md`. One sample per version is a small experiment, not evidence of statistical superiority. Other final prompts do not each have a four-version history.
