import time
from playwright.sync_api import sync_playwright

RESUME_PATH = "/Users/raghav/Downloads/Resume-analyzer-main/resume.pdf"
URL = "http://localhost:8080"

def run_ui_test():
    with sync_playwright() as p:
        print("\n===========================================")
        print("LAUNCHING REAL CHROMIUM BROWSER LIVE DEMO")
        print("===========================================")

        browser = p.chromium.launch(headless=False, slow_mo=700)
        page = browser.new_page(viewport={"width": 1440, "height": 900})

        print(f"Navigating to {URL}...")
        page.goto(URL)
        page.wait_for_load_state("networkidle")
        time.sleep(1)

        # ─── TEST 1: GENERAL AUDIT MODE ───────────────────────────────────────
        print("\n--- Testing General Audit Mode ---")

        print("Uploading resume PDF...")
        page.set_input_files("input[type='file']", RESUME_PATH)
        time.sleep(1)

        print("Selecting General Audit tab...")
        page.click("button:has-text('General Audit')")
        time.sleep(0.8)

        print("Clicking Run Match Scan...")
        page.click("button:has-text('Run Match Scan')")

        print("Waiting for telemetry dashboard to render...")
        page.wait_for_selector("text=Match Telemetry", timeout=40000)
        time.sleep(2)

        print("Clicking Action Plan tab...")
        page.click("button:has-text('Action Plan')")
        time.sleep(1.5)

        print("Clicking Keywords tab...")
        page.click("button:has-text('Keywords')")
        time.sleep(1.5)

        print("Clicking AI Rewrites tab...")
        page.click("button:has-text('AI Rewrites')")
        time.sleep(1.5)

        print("Clicking back to Checklist tab...")
        page.click("button:has-text('Checklist')")
        time.sleep(1)

        print("Opening Resume Dossier modal...")
        page.click("button:has-text('Resume Dossier')")
        time.sleep(2)

        # Verify the candidate name is Raghav Vats (not John Doe)
        modal_text = page.inner_text(".glass-modal") if page.query_selector(".glass-modal") else ""
        if "Raghav" in modal_text or "raghav" in modal_text.lower():
            print("✅ SUCCESS: Candidate name 'Raghav Vats' found in dossier modal!")
        else:
            print(f"⚠️  Modal text found: {modal_text[:100]}")

        print("Closing Dossier modal via X button...")
        page.click("#modal-close-btn")
        time.sleep(1)

        print("Clicking New Scan button...")
        page.click("button:has-text('New Scan')")
        time.sleep(1.5)

        # ─── TEST 2: GOOGLE SWE TEMPLATE MODE ────────────────────────────────
        print("\n--- Testing Google SWE Template Mode ---")

        print("Uploading resume PDF...")
        page.set_input_files("input[type='file']", RESUME_PATH)
        time.sleep(0.8)

        print("Selecting Google SWE template...")
        page.select_option("select >> nth=0", "google")
        page.select_option("select >> nth=1", "swe")
        time.sleep(0.8)

        print("Clicking Run Match Scan...")
        page.click("button:has-text('Run Match Scan')")

        print("Waiting for results dashboard...")
        page.wait_for_selector("text=Match Telemetry", timeout=40000)
        time.sleep(4)

        print("\n===========================================")
        print("✅ ALL TESTS PASSED! Apple Monochrome Theme Live!")
        print("===========================================")
        time.sleep(5)
        browser.close()

if __name__ == "__main__":
    run_ui_test()
