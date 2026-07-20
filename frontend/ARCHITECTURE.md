# ResumeAI - Architecture Principles

This document outlines the core architectural decisions for the ResumeAI frontend.

## 1. Feature-Based Architecture
We use a plugin-style feature architecture instead of a flat `components/` folder. This scales much better for a complex Workspace.
- Code is grouped by feature domain: `features/analysis`, `features/builder`, etc.
- Each feature owns its own `components/`, `hooks/`, `services/`, and `types/`.
- Generic UI primitives (`Button`, `Card`) live in `src/components/ui`.

## 2. Global State (Context vs Redux/Zustand)
We use React Context (`ResumeContext`, `AnalysisContext`) over global stores like Zustand. 
- **Why?** It enforces a single responsibility principle and avoids a massive global store where unrelated features (like Cover Letter state and Resume Builder state) pollute the same namespace. The Strategist AI reads directly from these contexts.

## 3. Separation of Concerns (Services)
The UI components must **never** perform `fetch` requests directly.
- **Why?** To keep components clean and testable.
- API calls live in `src/services/` or `src/features/[name]/services/`.
- Example: `api.ts` handles the base API client, and `analysis.service.ts` handles the specific parsing logic.

## 4. Visual Consistency (Design System First)
We build reusable UI primitives (Design System) before implementing new pages.
- Components like `GlassPanel`, `ProgressRing`, `MetricCard` ensure 100% visual consistency and eliminate duplicated Tailwind utility strings.
- Animations are standardized in `src/constants/motion.ts` rather than hardcoding `framer-motion` variants in every file.
