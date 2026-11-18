"""Download TeX dependencies at build time; requests run without downloads."""

from pdf_exports import render_template_pdf

FIXTURE = {
    "personal_info": {"name": "Alex Example", "email": "alex@example.com"},
    "summary": "Engineer building reliable, accessible software.",
    "education": [
        {
            "institution": "Example University",
            "degree": "BSc Computer Science",
            "location": "Boston",
            "date": "2023",
            "gpa": "3.8",
        }
    ],
    "experience": [
        {
            "company": "Example Labs",
            "role": "Engineer",
            "location": "Remote",
            "date": "2023–Present",
            "bullets": [
                "Improved API latency by 30%.",
                "Built accessible interfaces with React.",
            ],
        }
    ],
    "projects": [
        {
            "name": "Resume Tool",
            "technologies": "Python, React",
            "date": "2024",
            "bullets": ["Created a resume editor and PDF exporter."],
        }
    ],
    "skills": {
        "languages": "Python, TypeScript",
        "frameworks": "React, Flask",
        "tools": "Git, Docker",
    },
}
if __name__ == "__main__":
    for template in ("jakes_resume", "deedy_resume"):
        data = {
            **FIXTURE,
            "summary": FIXTURE["summary"] + r" Symbols: & % $ # _ { } ~ ^ \.",
        }
        pdf = render_template_pdf(data, template, warm=True)
        print(f"{template}: compiled {len(pdf)} bytes")
