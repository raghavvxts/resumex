import React from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  act,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ResumeProvider, useResumeContext } from "../contexts/ResumeContext";
import { ResumeBuilder } from "../features/builder/components/ResumeBuilder";
import { generatePDF } from "../services/api/builder";
vi.mock("../components/ui/PDFPreview", () => ({
  PDFPreview: () => <div>Preview</div>,
}));
const Seed = () => {
  const c = useResumeContext();
  return (
    <button
      onClick={() =>
        c.setParsedResume({
          personal_info: { name: "Alex" },
          summary: "Reviewed facts",
          education: [],
          experience: [],
          projects: [],
          skills: {},
        })
      }
    >
      Seed
    </button>
  );
};
const prepare = () => {
  render(
    <ResumeProvider>
      <Seed />
      <ResumeBuilder />
    </ResumeProvider>,
  );
  fireEvent.click(screen.getByText("Seed"));
};
beforeEach(() => {
  localStorage.clear();
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: vi.fn(() => "blob:export"),
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: vi.fn(),
  });
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
it("downloads latest edits without generating a preview", async () => {
  const fetch = vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(new Response("%PDF-test"));
  prepare();
  expect(fetch).not.toHaveBeenCalled();
  expect(
    screen.getByRole("checkbox", { name: "Auto-preview" }),
  ).not.toBeChecked();
  fireEvent.change(screen.getByLabelText("Summary", { exact: true }), {
    target: { value: "Latest facts" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Download PDF" }));
  await waitFor(() =>
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledTimes(1),
  );
  expect(JSON.parse(String(fetch.mock.calls[0][1]?.body))).toMatchObject({
    summary: "Latest facts",
    template_name: "simple_resume",
  });
  expect(screen.queryByText("Preview")).toBeNull();
});
it("falls back to Simple when selected compiler fails", async () => {
  const fetch = vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Template compiler unavailable" }), {
        status: 503,
      }),
    )
    .mockResolvedValueOnce(new Response("%PDF-fallback"));
  prepare();
  fireEvent.change(screen.getByLabelText("PDF template"), {
    target: { value: "deedy_resume" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Download PDF" }));
  await waitFor(() =>
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledTimes(1),
  );
  expect(
    fetch.mock.calls.map(
      ([, init]) => JSON.parse(String(init?.body)).template_name,
    ),
  ).toEqual(["deedy_resume", "simple_resume"]);
  expect(screen.getByText(/Downloaded Simple PDF/)).toBeVisible();
});
it("never downloads stale content if resume changes during export", async () => {
  let finish!: (r: Response) => void;
  vi.spyOn(globalThis, "fetch").mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  prepare();
  fireEvent.click(screen.getByRole("button", { name: "Download PDF" }));
  fireEvent.change(screen.getByLabelText("Summary", { exact: true }), {
    target: { value: "Changed during export" },
  });
  await act(async () => finish(new Response("%PDF-old")));
  expect(HTMLAnchorElement.prototype.click).not.toHaveBeenCalled();
  expect(screen.getByText(/resume changed during export/)).toBeVisible();
});
it("rejects an HTTP success containing an error page instead of a PDF", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response("<html>Proxy error</html>"),
  );
  await expect(
    generatePDF({ personal_info: { name: "Alex" } }),
  ).rejects.toThrow("invalid PDF");
});
