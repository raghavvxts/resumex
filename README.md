# ResumeX 

An intelligent, open-source resume analysis platform that evaluates your resume against job descriptions using AI, providing actionable feedback to beat ATS systems and land interviews.

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
- **Resume Builder**: Export your optimized resume directly to a beautifully formatted PDF.

---

## 🏗️ Architecture

ResumeX is designed with a strictly decoupled frontend-backend architecture.

* **Frontend**: React 18 SPA built with Vite, TypeScript, Tailwind CSS, and shadcn/ui. Deployment-agnostic (Vercel recommended).
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
