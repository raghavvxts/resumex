import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("portable backup preserves current work and survives reload", async ({
  page,
}) => {
  await page.goto("/builder");
  await page.getByRole("button", { name: "Start an empty resume" }).click();
  await page.getByLabel("Name", { exact: true }).fill("Zoë Example — 李明");
  await page
    .getByLabel("Summary", { exact: true })
    .fill("Built accessible APIs & reduced latency by 30%.");
  await page.getByText("Application versions", { exact: false }).click();
  const downloading = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download backup" }).click();
  const download = await downloading;
  const file = await readFile((await download.path())!);
  await page.getByLabel("Name", { exact: true }).fill("Unsaved current work");
  await page
    .getByLabel("Resume backup file")
    .setInputFiles({
      name: "backup.json",
      mimeType: "application/json",
      buffer: file,
    });
  await expect(page.getByLabel("Name", { exact: true })).toHaveValue(
    "Zoë Example — 李明",
  );
  await expect(
    page.getByRole("option", { name: /Before importing backup/ }),
  ).toHaveCount(1);
  await expect(
    page.getByRole("checkbox", { name: "Save draft on this device" }),
  ).toBeChecked();
  await page.reload();
  await expect(page.getByLabel("Name", { exact: true })).toHaveValue(
    "Zoë Example — 李明",
  );
});

test("mobile export remains available during a backend outage", async ({
  page,
}) => {
  await page.setViewportSize({ width: 402, height: 874 });
  await page.route("**/generate-pdf", (route) => route.abort("failed"));
  await page.goto("/builder");
  await page.getByRole("button", { name: "Start an empty resume" }).click();
  await page.getByLabel("Name", { exact: true }).fill("Alex Example");
  const download = page.getByRole("button", {
    name: "Download PDF from mobile toolbar",
    exact: true,
  });
  await expect(download).toBeVisible();
  await download.click();
  await expect(page.getByText(/Opening Browser PDF/)).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Browser PDF from mobile toolbar",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("checkbox", { name: "Auto-preview" }),
  ).not.toBeChecked();
});
