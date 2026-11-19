import React from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { browserResumeDocument, printResume } from "../lib/browserPdf";
import { readBackup } from "../lib/backup";
import { suggestionWarnings } from "../lib/suggestionReview";
import { ResumeProvider, useResumeContext } from "../contexts/ResumeContext";
import { VERSIONS_KEY } from "../lib/resumeVersions";
import { ResumeBuilder } from "../features/builder/components/ResumeBuilder";

const snapshot = (name = "Alex") => ({
  resumeText: name,
  parsedResume: {
    personal_info: { name },
    summary: "Built APIs",
    experience: [{ role: "Engineer", bullets: ["Reduced latency by 30%"] }],
    education: [],
    projects: [],
    skills: { languages: "Python" },
  },
  jobDescription: "Target",
  letter: "Saved letter",
  mode: "audit",
});
const backup = (name = "Restored") =>
  JSON.stringify({
    format: "resumaxer-backup",
    version: 1,
    draft: snapshot(name),
    versions: [],
  });
let exported = "";
const Probe = () => {
  const c = useResumeContext();
  return (
    <>
      <button
        onClick={() => {
          c.setParsedResume(snapshot().parsedResume);
          c.setResumeText("Alex");
        }}
      >
        Seed
      </button>
      <button
        onClick={() => {
          exported = c.exportBackup();
        }}
      >
        Backup
      </button>
      <button onClick={() => c.importBackup(backup())}>Restore</button>
      <button onClick={() => c.importBackup('{"format":"wrong"}')}>
        Invalid
      </button>
      <output data-testid="backup-state">
        {JSON.stringify({
          name: c.parsedResume?.personal_info?.name,
          versions: c.versions,
          error: c.draftError,
          saved: c.draftEnabled,
        })}
      </output>
    </>
  );
};
beforeEach(() => {
  localStorage.clear();
  vi.spyOn(HTMLIFrameElement.prototype, "contentWindow", "get").mockReturnValue(
    {
      document: { fonts: { ready: Promise.resolve() } },
      addEventListener: vi.fn(),
      focus: vi.fn(),
      print: vi.fn(),
    } as unknown as Window,
  );
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
it.each([
  "Zoë O’Connor & Sons <script>alert(1)</script>",
  "राघव शर्मा — 李明 — أحمد",
  "A".repeat(300),
])("browser PDF safely preserves unusual names: %s", (name) => {
  const html = browserResumeDocument(snapshot(name).parsedResume);
  const doc = new DOMParser().parseFromString(html, "text/html");
  expect(doc.querySelector("h1")?.textContent).toBe(name);
  expect(doc.querySelector("script")).toBeNull();
  expect(doc.body.textContent).toContain("30%");
  expect(doc.querySelectorAll("img,link,iframe")).toHaveLength(0);
});
it("browser PDF preserves long multi-section resumes without truncation", () => {
  const resume = snapshot().parsedResume;
  resume.experience[0].bullets = Array.from(
    { length: 200 },
    (_, i) =>
      `Achievement ${i}: built accessible software & APIs with a measurable result.`,
  );
  const doc = new DOMParser().parseFromString(
    browserResumeDocument(resume),
    "text/html",
  );
  expect(doc.querySelectorAll("li")).toHaveLength(200);
  expect(doc.body.textContent).toContain("Achievement 199");
});
it("local PDF preparation requires no network request", () => {
  const fetch = vi.spyOn(globalThis, "fetch");
  printResume(snapshot().parsedResume);
  const frame = document.querySelector(
    'iframe[title="Local resume PDF"]',
  ) as HTMLIFrameElement;
  expect(frame.srcdoc).toContain("Alex");
  expect(fetch).not.toHaveBeenCalled();
  frame.remove();
});
it("flags invented metrics, leadership, and skills without flagging preserved metrics", () => {
  expect(
    suggestionWarnings(
      "Reduced latency by 30%",
      "Reduced latency by 30 percent",
    ),
  ).toEqual([]);
  expect(
    suggestionWarnings(
      "Built APIs",
      "Led 12 engineers and saved $2 million with Kubernetes",
    ),
  ).toHaveLength(3);
});
it("backup restoration preserves current work and enables local saving", () => {
  render(
    <ResumeProvider>
      <Probe />
    </ResumeProvider>,
  );
  fireEvent.click(screen.getByText("Seed"));
  fireEvent.click(screen.getByText("Backup"));
  expect(readBackup(exported).draft.parsedResume.personal_info.name).toBe(
    "Alex",
  );
  fireEvent.click(screen.getByText("Restore"));
  const state = JSON.parse(screen.getByTestId("backup-state").textContent!);
  expect(state.name).toBe("Restored");
  expect(state.saved).toBe(true);
  expect(state.versions[0].data.parsedResume.personal_info.name).toBe("Alex");
});
it("invalid or over-capacity backups never replace the draft", () => {
  localStorage.setItem(
    VERSIONS_KEY,
    JSON.stringify(
      Array.from({ length: 20 }, (_, i) => ({
        id: String(i),
        name: String(i),
        savedAt: new Date().toISOString(),
        data: snapshot(`Saved ${i}`),
      })),
    ),
  );
  render(
    <ResumeProvider>
      <Probe />
    </ResumeProvider>,
  );
  fireEvent.click(screen.getByText("Seed"));
  fireEvent.click(screen.getByText("Invalid"));
  expect(screen.getByTestId("backup-state").textContent).toContain(
    '"name":"Alex"',
  );
  fireEvent.click(screen.getByText("Restore"));
  const state = JSON.parse(screen.getByTestId("backup-state").textContent!);
  expect(state.name).toBe("Alex");
  expect(state.versions).toHaveLength(20);
  expect(state.error).toContain("Nothing was changed");
});
it("backup imports discard untrusted AI result objects", () => {
  const draft = {
    ...snapshot(),
    result: "invalid renderer input",
    skillsData: { bad: true },
  };
  expect(
    readBackup(
      JSON.stringify({
        format: "resumaxer-backup",
        version: 1,
        draft,
        versions: [],
      }),
    ).draft.result,
  ).toBeNull();
  expect(() =>
    readBackup(
      JSON.stringify({
        format: "resumaxer-backup",
        version: 1,
        draft: { ...draft, parsedResume: { personal_info: { name: [] } } },
        versions: [],
      }),
    ),
  ).toThrow();
});
it("a flagged AI revision requires explicit confirmation before applying", () => {
  const Seed = () => {
    const c = useResumeContext();
    return (
      <button
        onClick={() => {
          c.setParsedResume(snapshot().parsedResume);
          c.setResult({
            score: 0,
            missing_keywords: [],
            suggestions: "",
            ai_recommendations: {
              status: "ok",
              message: "",
              strengths: [],
              weak_points: [],
              rewritten_bullets: [],
              summary_rewrite: "Led 12 engineers using Kubernetes",
              skills_rewrite: "",
              interview_focus: [],
            },
          });
        }}
      >
        Seed AI
      </button>
    );
  };
  render(
    <ResumeProvider>
      <Seed />
      <ResumeBuilder />
    </ResumeProvider>,
  );
  fireEvent.click(screen.getByText("Seed AI"));
  fireEvent.click(screen.getByText("Review AI suggestions"));
  const apply = screen.getByRole("button", { name: "Use this summary" });
  expect(apply).toBeDisabled();
  fireEvent.click(
    screen.getByRole("checkbox", {
      name: "I verified these claims against my actual experience.",
    }),
  );
  expect(apply).toBeEnabled();
  fireEvent.click(apply);
  expect(screen.getByLabelText("Summary", { exact: true })).toHaveValue(
    "Led 12 engineers using Kubernetes",
  );
});

it("backup storage failures preserve the current draft", () => {
  render(
    <ResumeProvider>
      <Probe />
    </ResumeProvider>,
  );
  fireEvent.click(screen.getByText("Seed"));
  vi.spyOn(localStorage, "setItem").mockImplementation(() => {
    throw new Error("Quota exceeded");
  });
  fireEvent.click(screen.getByText("Restore"));
  const state = JSON.parse(screen.getByTestId("backup-state").textContent!);
  expect(state.name).toBe("Alex");
  expect(state.versions).toHaveLength(0);
  expect(state.error).toContain("could not be saved");
});
it("server failures prepare the local PDF fallback", async () => {
  vi.spyOn(globalThis, "fetch").mockRejectedValue(
    new TypeError("Failed to fetch"),
  );
  render(
    <ResumeProvider>
      <Probe />
      <ResumeBuilder />
    </ResumeProvider>,
  );
  fireEvent.click(screen.getByText("Seed"));
  fireEvent.click(screen.getByRole("button", { name: "Download PDF" }));
  await screen.findByText(/Opening Browser PDF/);
  const frame = document.querySelector(
    'iframe[title="Local resume PDF"]',
  ) as HTMLIFrameElement;
  expect(frame.srcdoc).toContain("Alex");
  frame.remove();
});

it("accepts new MatchMyRole backups and legacy Resumaxer backups", () => {
  const file = JSON.parse(backup());
  for (const format of ["matchmyrole-backup", "resumaxer-backup"]) {
    expect(
      readBackup(JSON.stringify({ ...file, format })).draft.parsedResume
        .personal_info.name,
    ).toBe("Restored");
  }
});
