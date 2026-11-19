/// <reference types="node" />
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { expect, it, vi } from "vitest";
import { readBackup } from "../lib/backup";

const html = readFileSync("public/legacy-backup.html", "utf8");
const script = html.match(/<script>([\s\S]*?)<\/script>/)![1];
const recover = (draft: string | null, versions: string | null) => {
  let click: (() => void) | undefined;
  let exported = "";
  const button = {
    disabled: true,
    addEventListener: (_event: string, callback: () => void) => {
      click = callback;
    },
  };
  const status = { textContent: "" };
  const store = new Map([
    ["resumaxer-draft-v1", draft],
    ["resumaxer-versions-v1", versions],
  ]);
  runInNewContext(script, {
    document: {
      getElementById: (id: string) => (id === "download" ? button : status),
      createElement: () => ({ click: vi.fn(), remove: vi.fn() }),
      body: { appendChild: vi.fn() },
    },
    localStorage: { getItem: (key: string) => store.get(key) },
    Blob: class {
      constructor(parts: string[]) {
        exported = parts.join("");
      }
    },
    URL: { createObjectURL: () => "blob:recovery", revokeObjectURL: vi.fn() },
    setTimeout: vi.fn(),
    Date,
  });
  return {
    button,
    status,
    download: () => {
      click?.();
      return exported;
    },
    store,
  };
};
it("recovers old-origin drafts as an importable MatchMyRole backup without changing storage", () => {
  const draft = JSON.stringify({
    resumeText: "Alex",
    parsedResume: { personal_info: { name: "Alex" } },
  });
  const page = recover(draft, "[]");
  expect(page.button.disabled).toBe(false);
  expect(
    readBackup(page.download()).draft.parsedResume.personal_info.name,
  ).toBe("Alex");
  expect(page.store.get("resumaxer-draft-v1")).toBe(draft);
});
it("explains when the old origin contains no saved data", () => {
  const page = recover(null, null);
  expect(page.button.disabled).toBe(true);
  expect(page.status.textContent).toContain("No saved draft");
});
it("handles corrupt or inaccessible saved data without overwriting it", () => {
  const page = recover("not JSON", "[]");
  expect(page.button.disabled).toBe(true);
  expect(page.status.textContent).toContain("could not be read");
  expect(page.store.get("resumaxer-draft-v1")).toBe("not JSON");
});
