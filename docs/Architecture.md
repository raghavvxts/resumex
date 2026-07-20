# Architecture Overview

ResumeX follows a strictly decoupled client-server architecture to ensure high scalability, deployment flexibility, and clean separation of concerns.

## Frontend (React SPA)
The frontend is a React 18 Single Page Application built with Vite.
- **Language**: TypeScript for strict typing and robustness.
- **Styling**: Tailwind CSS combined with a custom design system and shadcn/ui components.
- **State Management**: React Context (`ResumeContext`, `InteractionContext`).
- **API Layer**: All network requests are abstracted behind `src/services/api/` which relies on the `environment.ts` configuration. No components interact with `fetch` directly.
- **Deployment**: Agnostic. Can be deployed on Vercel, Netlify, Cloudflare Pages, or AWS S3. It only requires a static file host and an SPA rewrite rule (see `vercel.json`).

## Backend (REST API)
The backend is a Flask-based REST API.
- **Language**: Python 3.
- **AI Integration**: Google Gemini API for NLP parsing and generation.
- **PDF Parsing**: PyPDF2 for extracting text from uploaded resumes.
- **Deployment**: Agnostic. Can be deployed on Railway, Render, Fly.io, or any Docker/WSGI compatible host.

## Communication
The frontend communicates with the backend exclusively over HTTP POST requests, primarily sending `FormData` payloads (supporting file uploads for PDFs) or JSON payloads (for PDF generation). 
