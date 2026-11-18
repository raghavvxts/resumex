import React from "react";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  act,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, afterEach, it, expect, vi } from "vitest";
import { ResumeProvider, useResumeContext } from "../contexts/ResumeContext";
import { ResumeBuilder } from "../features/builder/components/ResumeBuilder";
import { AnalysisResults } from "../features/dashboard/components/AnalysisResults";
import { VERSIONS_KEY } from "../lib/resumeVersions";

const Probe = () => {
  const c = useResumeContext();
  return (
    <>
      <button
        onClick={() => {
          c.setParsedResume({
            personal_info: { name: "Alex" },
            summary: "Original",
            experience: [],
            education: [],
            projects: [],
            skills: {},
          });
          c.setResumeText("Original");
          c.setJobDescription("Target A");
          c.setLetter("Letter A");
        }}
      >
        Seed original
      </button>
      <button
        onClick={() => {
          c.setParsedResume({ ...c.parsedResume, summary: "Unsaved revision" });
          c.setResumeText("Unsaved revision");
          c.setJobDescription("Target B");
        }}
      >
        Revise
      </button>
      <button onClick={() => c.saveVersion("Application A")}>Save A</button>
      <button onClick={() => c.loadVersion(c.versions[0].id)}>Load A</button>
      <button onClick={c.clearData}>Clear</button>
      <output data-testid="snapshot">
        {JSON.stringify({
          summary: c.parsedResume?.summary,
          target: c.jobDescription,
          letter: c.letter,
          versions: c.versions,
          dirty: c.versionDirty,
          error: c.draftError,
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
  vi.useRealTimers();
});
it("preserves unsaved work before loading a version, including the job target", () => {
  render(
    <ResumeProvider>
      <Probe />
    </ResumeProvider>,
  );
  fireEvent.click(screen.getByText("Seed original"));
  fireEvent.click(screen.getByText("Save A"));
  fireEvent.click(screen.getByText("Revise"));
  expect(screen.getByTestId("snapshot").textContent).toContain('"dirty":true');
  fireEvent.click(screen.getByText("Load A"));
  const state = JSON.parse(screen.getByTestId("snapshot").textContent!);
  expect(state.summary).toBe("Original");
  expect(state.target).toBe("Target A");
  expect(state.letter).toBe("Letter A");
  expect(state.dirty).toBe(false);
  expect(state.versions).toHaveLength(2);
  expect(state.versions[1].data.parsedResume.summary).toBe("Unsaved revision");
  expect(state.versions[1].data.jobDescription).toBe("Target B");
  expect(JSON.parse(localStorage.getItem(VERSIONS_KEY)!)).toHaveLength(2);
  fireEvent.click(screen.getByText("Clear"));
  expect(localStorage.getItem(VERSIONS_KEY)).toBeNull();
});
it("offers saved versions after refresh even without automatic draft saving", () => {
  const view = render(
    <ResumeProvider>
      <Probe />
    </ResumeProvider>,
  );
  fireEvent.click(screen.getByText("Seed original"));
  fireEvent.click(screen.getByText("Save A"));
  view.unmount();
  render(
    <ResumeProvider>
      <ResumeBuilder />
    </ResumeProvider>,
  );
  fireEvent.click(screen.getByText(/Application versions/));
  fireEvent.change(screen.getByLabelText("Saved versions"), {
    target: { value: JSON.parse(localStorage.getItem(VERSIONS_KEY)!)[0].id },
  });
  fireEvent.click(screen.getByRole("button", { name: "Load version" }));
  expect(screen.getByLabelText("Summary", { exact: true })).toHaveValue(
    "Original",
  );
});
it("does not replace the current draft if its recovery backup cannot be saved", () => {
  render(
    <ResumeProvider>
      <Probe />
    </ResumeProvider>,
  );
  fireEvent.click(screen.getByText("Seed original"));
  fireEvent.click(screen.getByText("Save A"));
  fireEvent.click(screen.getByText("Revise"));
  vi.spyOn(localStorage, "setItem").mockImplementation(() => {
    throw new DOMException("Full", "QuotaExceededError");
  });
  fireEvent.click(screen.getByText("Load A"));
  const state = JSON.parse(screen.getByTestId("snapshot").textContent!);
  expect(state.summary).toBe("Unsaved revision");
  expect(state.versions).toHaveLength(1);
  expect(state.error).toContain("could not be saved");
});
it("debounces PDF updates and exports the latest edited text", async () => {
  vi.useFakeTimers();
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: vi.fn(() => "blob:auto-preview"),
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: vi.fn(),
  });
  const fetchMock = vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(
      async () =>
        new Response("PDF", { headers: { "Content-Type": "application/pdf" } }),
    );
  render(
    <ResumeProvider>
      <Probe />
      <ResumeBuilder />
    </ResumeProvider>,
  );
  fireEvent.click(screen.getByText("Seed original"));
  fireEvent.change(screen.getByLabelText("Summary", { exact: true }), {
    target: { value: "First edit" },
  });
  await act(() => vi.advanceTimersByTimeAsync(400));
  expect(fetchMock).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("Summary", { exact: true }), {
    target: { value: "Latest edit" },
  });
  await act(() => vi.advanceTimersByTimeAsync(800));
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body)).summary).toBe(
    "Latest edit",
  );
  expect(screen.getByRole("link", { name: "Download PDF" })).toBeVisible();
  fireEvent.click(screen.getByRole("checkbox", { name: "Auto-preview" }));
  expect(screen.getByRole("link", { name: "Download PDF" })).toBeVisible();
  expect(screen.getByTestId("snapshot").textContent).toContain("Latest edit");
});
it("puts actionable findings before the score summary", () => {
  const Seed = () => {
    const c = useResumeContext();
    return (
      <button
        onClick={() =>
          c.setResult({
            score: 60,
            missing_keywords: [],
            suggestions: "",
            action_plan: [
              "Add impact to your project",
              "Clarify your summary",
              "Group your skills",
              "Fourth issue",
            ],
          })
        }
      >
        Seed report
      </button>
    );
  };
  render(
    <MemoryRouter>
      <ResumeProvider>
        <Seed />
        <AnalysisResults />
      </ResumeProvider>
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByText("Seed report"));
  const priorities = screen.getByRole("region", {
    name: "3 things to fix first",
  });
  const scores = screen.getByRole("region", { name: "Score summary" });
  expect(
    priorities.compareDocumentPosition(scores) &
      Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  expect(screen.queryByText("Fourth issue")).toBeNull();
});

vi.mock("../components/ui/PDFPreview", () => ({
  PDFPreview: () => <div>Rendered PDF preview</div>,
}));

it("ignores corrupt draft and version shapes without crashing", () => {
  localStorage.setItem(
    "resumaxer-draft-v1",
    JSON.stringify({
      resumeText: { invalid: true },
      parsedResume: { personal_info: "bad" },
    }),
  );
  localStorage.setItem(
    VERSIONS_KEY,
    JSON.stringify([
      {
        id: "broken",
        name: "Bad",
        savedAt: "today",
        data: {
          resumeText: "text",
          parsedResume: { personal_info: {}, experience: [null] },
        },
      },
    ]),
  );
  render(
    <ResumeProvider>
      <Probe />
      <ResumeBuilder />
    </ResumeProvider>,
  );
  expect(screen.getByText("Start an empty resume")).toBeVisible();
  expect(
    JSON.parse(screen.getByTestId("snapshot").textContent!).versions,
  ).toHaveLength(0);
});

it("requires omission review and sends the selected PDF template", async () => {
  vi.useFakeTimers();
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: vi.fn(() => "blob:review"),
  });
  const fetchMock = vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(async () => new Response("PDF"));
  const Seed = () => {
    const c = useResumeContext();
    return (
      <button
        onClick={() =>
          c.setParsedResume({
            personal_info: { name: "Alex" },
            education: [],
            experience: [],
            projects: [],
            skills: {},
            source_text: "Original source",
            parsing_warnings: ["Experience may be missing."],
          })
        }
      >
        Seed omissions
      </button>
    );
  };
  render(
    <ResumeProvider>
      <Seed />
      <ResumeBuilder />
    </ResumeProvider>,
  );
  fireEvent.click(screen.getByText("Seed omissions"));
  await act(() => vi.advanceTimersByTimeAsync(900));
  expect(fetchMock).not.toHaveBeenCalled();
  expect(
    screen.getByRole("button", { name: "Generate PDF preview" }),
  ).toBeDisabled();
  fireEvent.change(screen.getByLabelText("PDF template"), {
    target: { value: "deedy_resume" },
  });
  fireEvent.click(
    screen.getByRole("checkbox", { name: /I reviewed the source/ }),
  );
  await act(() => vi.advanceTimersByTimeAsync(800));
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(
    JSON.parse(String(fetchMock.mock.calls[0][1]?.body)).template_name,
  ).toBe("deedy_resume");
});

it("keeps unsaved work when the version limit prevents a recovery copy", () => {
  render(
    <ResumeProvider>
      <Probe />
    </ResumeProvider>,
  );
  fireEvent.click(screen.getByText("Seed original"));
  for (let count = 0; count < 20; count++)
    fireEvent.click(screen.getByText("Save A"));
  fireEvent.click(screen.getByText("Revise"));
  fireEvent.click(screen.getByText("Load A"));
  const state = JSON.parse(screen.getByTestId("snapshot").textContent!);
  expect(state.summary).toBe("Unsaved revision");
  expect(state.versions).toHaveLength(20);
  expect(state.error).toContain("20");
});

it("changing PDF layout preserves the target and generated letter", () => {
  render(
    <ResumeProvider>
      <Probe />
      <ResumeBuilder />
    </ResumeProvider>,
  );
  fireEvent.click(screen.getByText("Seed original"));
  fireEvent.change(screen.getByLabelText("PDF template"), {
    target: { value: "deedy_resume" },
  });
  const state = JSON.parse(screen.getByTestId("snapshot").textContent!);
  expect(state.letter).toBe("Letter A");
  expect(state.target).toBe("Target A");
});

it("queues the latest preview while an earlier export is still running", async () => {
  vi.useFakeTimers();
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: vi.fn(() => "blob:serialized"),
  });
  let finish!: (value: Response) => void;
  const fetchMock = vi
    .spyOn(globalThis, "fetch")
    .mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          finish = resolve;
        }),
    )
    .mockImplementation(async () => new Response("PDF"));
  render(
    <ResumeProvider>
      <Probe />
      <ResumeBuilder />
    </ResumeProvider>,
  );
  fireEvent.click(screen.getByText("Seed original"));
  await act(() => vi.advanceTimersByTimeAsync(800));
  fireEvent.change(screen.getByLabelText("Summary", { exact: true }), {
    target: { value: "Latest queued edit" },
  });
  await act(() => vi.advanceTimersByTimeAsync(1600));
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("button", { name: /Generating/ })).toBeDisabled();
  await act(async () => {
    finish(new Response("PDF"));
  });
  await act(() => vi.advanceTimersByTimeAsync(800));
  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body)).summary).toBe(
    "Latest queued edit",
  );
  expect(screen.getByRole("link", { name: "Download PDF" })).toBeVisible();
});
