import { test, expect } from "@playwright/test";

const resume =
  "Alex Example\nSummary\nEngineer with three years React experience.\nExperience\nReduced latency by 30%.\nSkills\nReact Python SQL\nProjects\nDashboard\nEducation\nBSc";
test("text analysis, seniority, editable builder, draft recovery and clear", async ({
  page,
}) => {
  await page.route("**/analyze", async (route) => {
    expect(route.request().postData()).toContain("senior");
    await route.fulfill({
      json: {
        score: 100,
        candidate_name: "Alex Example",
        source_text: resume,
        keyword_coverage: 100,
        missing_keywords: [],
        section_scores: {
          summary: 100,
          skills: 100,
          experience: 100,
          projects: 100,
          education: 100,
        },
        action_plan: ["Review your achievements"],
        ai_recommendations: { status: "ok", rewritten_bullets: [] },
      },
    });
  });
  await page.route("**/parse-resume", (route) =>
    route.fulfill({
      json: {
        personal_info: { name: "Alex Example" },
        experience: [],
        education: [],
        projects: [],
        skills: { languages: "Python" },
        source_text: resume,
      },
    }),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Paste Text", exact: true }).click();
  await page.getByLabel("Resume text", { exact: true }).fill(resume);
  await page.getByLabel("Seniority", { exact: true }).selectOption("senior");
  await page.getByRole("button", { name: "Run Analysis", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Analysis Report" }),
  ).toBeVisible();
  await expect(
    page.getByText(/resume completeness/i, { exact: false }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Edit & export", exact: true }).click();
  await page.getByLabel("Name", { exact: true }).fill("Alex Updated");
  await page
    .getByRole("checkbox", { name: "Save draft on this device" })
    .check();
  await page.reload();
  await expect(page.getByLabel("Name", { exact: true })).toHaveValue(
    "Alex Updated",
  );
  await page.getByRole("button", { name: "Clear data", exact: true }).click();
  await page.getByRole("link", { name: "Dashboard", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Paste Text", exact: true }),
  ).toBeVisible();
});
