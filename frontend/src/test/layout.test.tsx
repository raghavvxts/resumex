import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { ResumeProvider } from "../contexts/ResumeContext";
import { InteractionProvider } from "../contexts/InteractionContext";
import { DashboardPage } from "../features/dashboard/components/DashboardPage";
import { ResumeBuilder } from "../features/builder/components/ResumeBuilder";
import { SkillsAnalysisView } from "../features/skills/components/SkillsAnalysisView";
import { CoverLetterView } from "../features/cover-letter/components/CoverLetterView";

afterEach(cleanup);

it("keeps the same artwork across navigation and entering the editor", () => {
  localStorage.clear();
  const { container } = render(
    <MemoryRouter>
      <InteractionProvider>
        <ResumeProvider>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/builder" element={<ResumeBuilder />} />
              <Route path="/skills" element={<SkillsAnalysisView />} />
              <Route path="/cover" element={<CoverLetterView />} />
            </Route>
          </Routes>
        </ResumeProvider>
      </InteractionProvider>
    </MemoryRouter>,
  );
  const artwork = container.querySelector(
    'img[src="/images/homepage-background.jpg"]',
  );
  expect(artwork).not.toBeNull();
  for (const name of ["Resume Builder", "Skills Analysis", "Cover Letter"]) {
    fireEvent.click(screen.getByRole("link", { name }));
    expect(
      container.querySelector('img[src="/images/homepage-background.jpg"]'),
    ).toBe(artwork);
  }
  fireEvent.click(screen.getByRole("link", { name: "Resume Builder" }));
  fireEvent.click(
    screen.getByRole("button", { name: "Start an empty resume" }),
  );
  expect(
    container.querySelector('img[src="/images/homepage-background.jpg"]'),
  ).toBe(artwork);
  expect(screen.queryByRole("link", { name: "Edit & export" })).toBeNull();
});
