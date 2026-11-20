# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 2026-11-20 - Milestone 2 reproducible evidence

- Executed 16 distinct synthetic inputs through the actual local Flask application using real Ollama qwen3.5:4b inference; saved complete inputs, expected criteria, actual outputs and 13 Pass / 3 Fail results.
- Executed four newly saved versions of the job-match prompt; retained all raw outputs, measured checks and manual grounding findings. These are new experiments, not reconstructed historical results.
- Extracted six current application prompt templates to prompts/final/ without changing application behavior.
- Added an evidence PDF appendix, Markdown test/iteration tables, reproducible runners and the separate Business Model Canvas.
- Local test results do not establish hosted Gemini behavior. Main seven-section submission assembly and real browser screenshots remain separate work.

## [1.0.0] - 2026-07-20

### Added
- Initial Public Release.
- AI Resume Analyzer core matching engine.
- Interactive Dashboard with real-time feedback.
- The Strategist AI assistant for proactive bullet-point optimization.
- Cover Letter generator with tone settings.
- LaTeX PDF Resume Builder with integrated templates (Jake's Resume, Deedy).
- Fully abstracted API service layer and environment configuration.
- Vercel SPA routing configuration.
