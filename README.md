# MatchMyRole

Live website: [match-my-role.vercel.app](https://match-my-role.vercel.app).

The previous Resumaxer address redirects to the new site. Browser-saved drafts can be exported from the [old-address recovery page](https://resumaxer.vercel.app/legacy-backup.html), then imported under Application versions.

An intelligent, open-source resume analysis platform that evaluates your resume against job descriptions using AI, providing section checks, keyword estimates, and reviewable writing suggestions. Scores are not hiring predictions.

[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-purple.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-38B2AC.svg)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## ✨ Features

- **Smart Analysis**: Automatic parsing of PDF and text resumes, matched against target job descriptions.
- **Actionable Scoring**: Section-by-section breakdown of your keyword coverage and missing terms.
- **AI Recommendations**: Get tailored bullet point rewrites, summary optimizations, and skills suggestions.
- **The Strategist**: Proactive AI Career Assistant ready to chat, critique, and refine specific bullet points interactively.
- **Cover Letter Generator**: Generate professional, concise, or enthusiastic cover letters automatically based on your analysis.
- **Resume Builder**: Edit your parsed resume, review AI changes, and preview/download the exact PDF.

---

## 🏗️ Architecture

MatchMyRole is designed with a strictly decoupled frontend-backend architecture.

* **Frontend**: React 18 SPA built with Vite, TypeScript, and Tailwind CSS. Deployment-agnostic (Vercel recommended).
* **Backend**: Flask REST API powered by Python, utilizing the Gemini AI API for intelligent analysis. (Railway/Render recommended).

---

## 🚀 Quick Start (Frontend)

The frontend is a standalone SPA that communicates with the backend via a single REST API endpoint.

```bash
cd frontend
npm install
cp .env.example .env
```

Set `VITE_API_BASE_URL` in your `.env` file to point to your backend.

```bash
npm run dev
```

For production builds:
```bash
npm run typecheck
npm run lint
npm run build
```

---

## 📚 Documentation

For deep dives into the project architecture and contributing guidelines, check out the `docs/` folder:

- [Architecture Overview](docs/Architecture.md)
- [Deployment Guide](docs/Deployment.md)
- [API Reference](docs/API.md)
- [Design System](docs/DesignSystem.md)
- [Contributing](CONTRIBUTING.md)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Reliability and privacy

PDF export offers authentic Jake and Deedy layouts using Tectonic, plus Simple using ReportLab. Run `backend/build.sh` to install the pinned compiler and warm packages before serving; requests use cached packages only. AI parsing, letters, skills and chat use Gemini by default or local Ollama when `AI_PROVIDER=ollama`; outages return explicit errors rather than fabricated results. Scanned PDFs require OCR outside the app or pasted text.

Draft saving is opt-in and stored in this browser. Clear data removes the local draft and cancels active requests. Resume text is sent to the backend and Google Gemini for AI processing. This repository does not add a server-side resume database.

Run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` in frontend; run `python -m unittest test_app test_exports -v` in backend after installing requirements. Frontend tests use controlled API responses; backend tests mock AI calls and exercise actual PDF generation.

## Editing and application versions

The report leads with priority fixes. The editor provides a live PDF preview with page navigation and zoom. Named application versions are stored on this browser (up to 20), with automatic recovery copies before loading over unsaved edits. Clear data removes these copies as well as the current draft. PDF previews are rendered with a lazy-loaded PDF.js worker; install frontend packages from the updated lockfile. Use Node 22.13+ or Node 24+ for frontend tooling.

See [local model checks](docs/LOCAL_MODEL_BENCHMARK.md), [loading measurements](docs/PERFORMANCE.md), and [implementation verification](docs/FIXES.md). To exercise the actual TeX compiler after `backend/build.sh`, run `RUN_TEMPLATE_TESTS=1 python -m unittest test_app test_exports -v` in backend.
