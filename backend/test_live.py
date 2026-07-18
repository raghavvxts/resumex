import requests
import os
import json

API_URL = "http://127.0.0.1:5000/analyze"
RESUME_PATH = "/Users/raghav/Downloads/Resume-analyzer-main/resume.pdf"

def run_test(mode_name, job_desc):
    print(f"\n===========================================")
    print(f"RUNNING TEST: {mode_name}")
    print(f"===========================================")
    
    if not os.path.exists(RESUME_PATH):
        print(f"Error: Resume not found at {RESUME_PATH}")
        return
        
    with open(RESUME_PATH, "rb") as f:
        files = {"resume": f}
        data = {
            "job_description": job_desc,
            "role_level": "junior",
            "years_experience": "2"
        }
        try:
            r = requests.post(API_URL, files=files, data=data)
            if r.status_code == 200:
                res = r.json()
                print(f"Status: SUCCESS (200)")
                print(f"ATS Match Score: {res.get('score')}%")
                print(f"Keyword Coverage: {res.get('keyword_coverage')}%")
                print("\nChecklist Indicators:")
                for item in res.get("checklist", {}).get("items", []):
                    status = "✓" if item.get("completed") else "✗"
                    print(f"  [{status}] {item.get('label')}: {item.get('reason')}")
                
                print("\nAI Recommendations Strengths:")
                recs = res.get("ai_recommendations", {})
                for strg in recs.get("strengths", [])[:3]:
                    print(f"  - {strg}")
                
                print("\nAI Recommendations Weak Points:")
                for weak in recs.get("weak_points", [])[:3]:
                    print(f"  - {weak}")
                
                print("\nAI Rewritten Profile Summary:")
                print(f"  {recs.get('summary_rewrite')}")
            else:
                print(f"Status: FAILED ({r.status_code})")
                print(r.text)
        except Exception as e:
            print(f"Connection Error: {e}")

if __name__ == "__main__":
    # Test 1: General Audit (Empty Job Description)
    run_test("General ATS Resume Audit Mode", "")
    
    # Test 2: Preloaded Template (Google Software Engineer)
    google_swe_desc = (
        "We are looking for a Software Engineer to develop next-generation technologies. "
        "Candidates must have experience with Python, C++, Java, distributed systems, algorithms, "
        "and data structures. You will design, develop, test, deploy, and maintain software solutions."
    )
    run_test("Google SWE Template Mode", google_swe_desc)
