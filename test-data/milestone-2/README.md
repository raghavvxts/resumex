# Milestone 2 real evidence

Executed 20 November 2026. All fixtures are synthetic. No student resumes, credentials or personal files are used.

- `results.json`: 16 distinct application inputs, expectations, actual HTTP outputs and Pass/Fail.
- `T01.json` ... `T16.json`: individual results; full fixture text included.
- `blank.pdf`, `corrupt.pdf`, `resume.txt`: generated edge/invalid upload fixtures.
- `prompt-experiments.json`: four newly executed versions of the job-match prompt, one controlled input per version. These repeated comparison inputs are not added to Q17.
- `prompt-v1.json` ... `prompt-v4.json`: complete rendered prompt and unchanged model response per experiment.
- `run-metadata.json`: provider, model, settings, source revision and timing.

Real inference uses the existing optional local Ollama integration and `qwen3.5:4b`. Requests are made through Flask's test client to the actual application routes. This is not hosted Gemini or browser end-to-end verification. No mocks are used. Results may vary because no seed is fixed.

The runner defines expected criteria before sending requests. Checks are intentionally limited to specific output properties; a Pass does not certify every sentence as factual. Error/fallback responses remain in the evidence. T06 includes a transparent checker correction note: the original evaluation read the wrong response field; its saved HTTP output was unchanged.

## Reproduce

Install existing `backend/requirements.txt` dependencies, start `ollama serve`, and install `qwen3.5:4b` if unavailable. From the repository root:

```sh
backend/.venv/bin/python test-data/milestone-2/run_evidence.py
backend/.venv/bin/python docs/milestone-2/build_evidence_report.py
```

The runner overwrites generated result files when explicitly rerun. Commit the existing evidence first if you want to retain it. Each inference request has a 55-second timeout; 16 cases plus four prompt experiments may take several minutes.

Full report: `docs/milestone-2/EVIDENCE.md`. PDF appendix: `docs/milestone-2/TeamTower_TestAndPromptEvidence.pdf`.
