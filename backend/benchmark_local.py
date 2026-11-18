"""Run synthetic workflow checks; never reads user files."""

import json
import time
from pathlib import Path
import app

RESUME = """Alex Example
alex@example.com
Summary
Software engineer with three years of Python and React experience.
Experience
Example Labs | Software Engineer | Remote | 2023–Present
• Reduced API latency by 30% using query optimization.
• Built accessible React dashboards with automated tests.
Projects
Resume Tool | Python, React | 2024
• Built a resume editor with PDF export.
Education
Example University | BSc Computer Science | 2023
Skills
Python, TypeScript, React, Flask, SQL, Git, Docker
"""
JD = "We seek a software engineer experienced in Python, React, SQL, accessible web applications, automated testing, API design, collaboration, deployment, and performance optimization."


def run():
    client = app.app.test_client()
    results = []
    for route, extra in [
        ("/parse-resume", {}),
        ("/analyze", {}),
        ("/skills-analysis", {}),
        ("/cover-letter", {"tone": "concise"}),
        (
            "/chat",
            {
                "message": "Suggest one improvement without inventing achievements.",
                "history": "[]",
            },
        ),
    ]:
        start = time.perf_counter()
        response = client.post(
            route,
            data={
                "resume_text": RESUME,
                "job_description": JD,
                "role_level": "mid",
                "years_experience": "3",
                **extra,
            },
        )
        body = response.get_json()
        checks = {}
        if route == "/parse-resume" and response.status_code == 200:
            checks = {
                "name_preserved": body["personal_info"].get("name") == "Alex Example",
                "email_preserved": body["personal_info"].get("email")
                == "alex@example.com",
                "metric_preserved": "30%" in json.dumps(body.get("experience")),
                "experience_present": bool(body.get("experience")),
                "projects_present": bool(body.get("projects")),
                "education_present": bool(body.get("education")),
                "warnings": body.get("parsing_warnings", []),
            }
        if route == "/analyze":
            checks = {"ai_status": body.get("ai_recommendations", {}).get("status")}
        if route == "/cover-letter":
            checks = {"word_count": len(body.get("cover_letter", "").split())}
        item = {
            "route": route,
            "seconds": round(time.perf_counter() - start, 2),
            "status": response.status_code,
            "checks": checks,
        }
        results.append(item)
        print(json.dumps(item), flush=True)
        Path("/tmp/resumaxer-model-results.json").write_text(
            json.dumps(
                {
                    "provider": app.AI_PROVIDER,
                    "model": app.model_name,
                    "results": results,
                },
                indent=2,
            )
        )


if __name__ == "__main__":
    run()
