import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ResumeProvider, useResumeContext } from "../contexts/ResumeContext";
import { ConfigDrawer } from "../features/dashboard/components/ConfigDrawer";
import { CoverLetterView } from "../features/cover-letter/components/CoverLetterView";
import { chatWithStrategist } from "../services/api/chat";
import { ResumeBuilder } from "../features/builder/components/ResumeBuilder";
import { cancelRequests, request } from "../services/api/request";

const resume =
  "Alex Example\nSummary\nReact engineer with three years of experience.\nExperience\nBuilt dashboards with Python and SQL.\nSkills\nReact Python SQL";
const Probe = () => {
  const c = useResumeContext();
  return (
    <>
      <button
        onClick={() => {
          c.setResumeText(resume);
          c.setResumeInputMode("text");
          c.setShowConfigDrawer(true);
        }}
      >
        Prepare
      </button>
      <button onClick={() => c.setDraftEnabled(true)}>Save draft</button>
      <button onClick={c.clearData}>Clear</button>
      <output data-testid="state">
        {JSON.stringify({
          role: c.roleLevel,
          jd: c.jobDescription,
          text: c.resumeText,
          result: c.result,
          letter: c.letter,
          status: c.uploadStatus,
        })}
      </output>
    </>
  );
};
beforeEach(() => {
  vi.stubGlobal("localStorage", window.localStorage);
  localStorage.clear();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  cancelRequests();
});

describe("resume workflow contracts", () => {
  it("sends seniority and effective template JD, and resets fully", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (url, init) => {
        const body = init?.body as FormData;
        expect(body.get("role_level")).toBe("senior");
        expect(body.get("resume_text")).toBe(resume);
        expect(String(body.get("job_description"))).toContain(
          "Software Engineer",
        );
        return new Response(
          JSON.stringify(
            String(url).endsWith("/analyze")
              ? {
                  score: 75,
                  missing_keywords: [],
                  ai_recommendations: { status: "ok", rewritten_bullets: [] },
                }
              : { personal_info: { name: "Alex" }, source_text: resume },
          ),
          { status: 200 },
        );
      });
    render(
      <ResumeProvider>
        <Probe />
        <ConfigDrawer />
      </ResumeProvider>,
    );
    fireEvent.click(screen.getByText("Prepare"));
    fireEvent.change(screen.getByLabelText("Seniority"), {
      target: { value: "senior" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Run Analysis" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(screen.getByTestId("state").textContent).toContain(
        '"status":"complete"',
      ),
    );
    fireEvent.click(screen.getByText("Clear"));
    expect(screen.getByTestId("state").textContent).toContain('"result":null');
    expect(screen.getByTestId("state").textContent).toContain(
      '"status":"idle"',
    );
  });
  it("saves only with opt-in and restores the draft", async () => {
    const view = render(
      <ResumeProvider>
        <Probe />
      </ResumeProvider>,
    );
    fireEvent.click(screen.getByText("Prepare"));
    expect(localStorage.getItem("resumaxer-draft-v1")).toBeNull();
    fireEvent.click(screen.getByText("Save draft"));
    await waitFor(() =>
      expect(localStorage.getItem("resumaxer-draft-v1")).toContain(
        "Alex Example",
      ),
    );
    view.unmount();
    render(
      <ResumeProvider>
        <Probe />
      </ResumeProvider>,
    );
    expect(screen.getByTestId("state").textContent).toContain("Alex Example");
    fireEvent.click(screen.getByText("Clear"));
    expect(localStorage.getItem("resumaxer-draft-v1")).toBeNull();
  });
  it("sends text resume and role/content history to chat", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ reply: "Relevant reply" }), {
        status: 200,
      }),
    );
    await chatWithStrategist(
      new File(["stale PDF"], "old.pdf", { type: "application/pdf" }),
      resume,
      "text",
      "",
      "Improve summary",
      [{ role: "user", content: "Previous message" }],
      "senior",
      3,
    );
    const body = fetchMock.mock.calls[0][1]?.body as FormData;
    expect(body.get("resume_text")).toBe(resume);
    expect(body.has("resume")).toBe(false);
    expect(body.get("role_level")).toBe("senior");
    expect(body.get("years_experience")).toBe("3");
    expect(JSON.parse(String(body.get("history")))[0].content).toBe(
      "Previous message",
    );
  });
  it("keeps cover letters editable and sends chosen tone", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (_url, init) => {
      expect((init?.body as FormData).get("tone")).toBe("concise");
      return new Response(
        JSON.stringify({ cover_letter: "Dear team, a concise letter." }),
        { status: 200 },
      );
    });
    render(
      <ResumeProvider>
        <Probe />
        <CoverLetterView />
      </ResumeProvider>,
    );
    fireEvent.click(screen.getByText("Prepare"));
    fireEvent.click(screen.getByRole("button", { name: /Concise/ }));
    fireEvent.click(
      screen.getByRole("button", { name: "Generate Cover Letter" }),
    );
    const editor = await screen.findByLabelText("Edit your letter");
    fireEvent.change(editor, { target: { value: "Edited letter" } });
    expect(screen.getByTestId("state").textContent).toContain("Edited letter");
  });
  it("aborts outstanding requests on clear", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) =>
          init?.signal?.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError")),
          ),
        ),
    );
    const pending = request("/analyze");
    cancelRequests();
    await expect(pending).rejects.toThrow(/cancelled or timed out/);
  });
  it("exports reviewed edits without silently applying AI bullets", async () => {
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:test-preview"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("%PDF-fixture", {
        headers: { "Content-Type": "application/pdf" },
      }),
    );
    const Seed = () => {
      const c = useResumeContext();
      return (
        <button
          onClick={() => {
            c.setParsedResume({
              personal_info: { name: "Alex" },
              summary: "Original summary",
              experience: [
                {
                  role: "Engineer",
                  company: "Example",
                  bullets: ["Original achievement"],
                },
              ],
              education: [],
              projects: [],
              skills: {},
            });
            c.setResult({
              score: 50,
              missing_keywords: [],
              suggestions: "",
              ai_recommendations: {
                status: "ok",
                message: "",
                strengths: [],
                weak_points: [],
                rewritten_bullets: ["Unreviewed AI achievement"],
                summary_rewrite: "Suggested summary",
                skills_rewrite: "",
                interview_focus: [],
              },
            });
          }}
        >
          Seed builder
        </button>
      );
    };
    render(
      <ResumeProvider>
        <Seed />
        <ResumeBuilder />
      </ResumeProvider>,
    );
    fireEvent.click(screen.getByText("Seed builder"));
    fireEvent.change(screen.getByLabelText("Summary", { exact: true }), {
      target: { value: "Reviewed summary" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Generate PDF preview" }),
    );
    await screen.findByRole("link", { name: "Download PDF" });
    const exported = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(exported.summary).toBe("Reviewed summary");
    expect(exported.experience[0].bullets).toEqual(["Original achievement"]);
    fireEvent.change(screen.getByLabelText("Summary", { exact: true }), {
      target: { value: "Changed again" },
    });
    expect(screen.queryByRole("link", { name: "Download PDF" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Undo last edit" }));
    expect(screen.getByLabelText("Summary", { exact: true })).toHaveValue(
      "Reviewed summary",
    );
  });
  it("requires choosing an original bullet before applying a rewrite", () => {
    const Seed = () => {
      const c = useResumeContext();
      return (
        <button
          onClick={() => {
            c.setParsedResume({
              personal_info: { name: "Alex" },
              experience: [
                {
                  role: "Engineer",
                  company: "First",
                  bullets: ["First achievement"],
                },
                {
                  role: "Engineer",
                  company: "Second",
                  bullets: ["Second achievement"],
                },
              ],
              education: [],
              projects: [],
              skills: {},
            });
            c.setResult({
              score: 50,
              missing_keywords: [],
              suggestions: "",
              ai_recommendations: {
                status: "ok",
                message: "",
                strengths: [],
                weak_points: [],
                rewritten_bullets: ["Reviewed rewrite"],
                summary_rewrite: "",
                skills_rewrite: "",
                interview_focus: [],
              },
            });
          }}
        >
          Seed rewrite
        </button>
      );
    };
    render(
      <ResumeProvider>
        <Seed />
        <ResumeBuilder />
      </ResumeProvider>,
    );
    fireEvent.click(screen.getByText("Seed rewrite"));
    fireEvent.click(screen.getByText("Review AI suggestions"));
    const apply = screen.getByRole("button", {
      name: "Replace selected bullet",
    });
    expect(apply).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Original bullet to replace"), {
      target: { value: "experience:1:0" },
    });
    fireEvent.click(apply);
    expect(
      screen.getByLabelText("Bullets (experience 1, one per line)"),
    ).toHaveValue("First achievement");
    expect(
      screen.getByLabelText("Bullets (experience 2, one per line)"),
    ).toHaveValue("Reviewed rewrite");
  });
});

vi.mock("../components/ui/PDFPreview", () => ({
  PDFPreview: () => <div>Rendered PDF preview</div>,
}));
