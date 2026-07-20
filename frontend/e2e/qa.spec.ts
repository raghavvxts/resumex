import { test, expect } from '@playwright/test';

test.describe('ResumeX UI Tests', () => {
  test('should successfully load the app, open the drawer, and run an analysis', async ({ page }) => {
    console.log("🚀 Starting Agent-Driven UI Test (Playwright)...");

    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));

    // 1. Navigate to the app
    await page.goto('/');

    // 2. Wait for page to load and check if it's the Empty State
    const emptyStateHeader = page.locator('h3:has-text("Ready for Analysis")');
    await expect(emptyStateHeader).toBeVisible({ timeout: 5000 });
    console.log("✅ Homepage loaded successfully (Empty State).");

    // 3. Click 'Start Your First Scan'
    const startBtn = page.locator('button:has-text("Start Your First Scan")');
    await expect(startBtn).toBeVisible();
    await startBtn.click();

    // 4. Wait for Drawer to open (we wait for the drop-zone to be visible)
    const dropZone = page.locator('.drop-zone');
    await expect(dropZone).toBeVisible({ timeout: 3000 });
    console.log("✅ Configuration drawer opened.");

    // 5. Upload PDF
    const fileInput = page.locator('input[type="file"]');
    // Point to the PDF in the project root
    await fileInput.setInputFiles('../resume.pdf');
    console.log("✅ PDF uploaded.");

    // 6. Click 'Run Analysis'
    const runBtn = page.locator('button:has-text("Run Analysis")');
    await runBtn.click();

    // 7. Wait for Drawer to close and Analysis to finish
    console.log("Waiting for analysis to complete...");
    const reportHeader = page.locator('h2:has-text("Analysis Report")');
    await expect(reportHeader).toBeVisible({ timeout: 45000 });
    console.log("✅ Analysis completed successfully. Dashboard populated.");
  });
});
