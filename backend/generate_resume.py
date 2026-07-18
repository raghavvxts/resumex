import os
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

def create_resume_pdf(filename="sample_resume.pdf"):
    c = canvas.Canvas(filename, pagesize=letter)
    c.setFont("Helvetica-Bold", 24)
    c.drawString(50, 720, "John Doe")
    
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, 680, "Summary")
    c.setFont("Helvetica", 11)
    summary_text = "Experienced software engineer with expertise in python, flask, sql, rest apis, javascript, and machine learning."
    c.drawString(50, 660, summary_text)
    
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, 620, "Skills")
    c.setFont("Helvetica", 11)
    skills_text = "Python, JavaScript, SQL, Flask, REST API, Machine Learning, Docker, Git"
    c.drawString(50, 600, skills_text)
    
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, 560, "Experience")
    
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, 540, "Software Engineer - Tech Corp (May 2022 - Nov 2023)")
    c.setFont("Helvetica", 11)
    bullet1 = "- Built full stack apps with machine learning and REST API design."
    bullet2 = "- Optimised backend queries, reducing server latency by 20%."
    c.drawString(60, 520, bullet1)
    c.drawString(60, 500, bullet2)
    
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, 460, "Projects")
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, 440, "AI Resume Matcher")
    c.setFont("Helvetica", 11)
    project_bullet = "- Developed a resume analysis tool using machine learning and NLP."
    c.drawString(60, 420, project_bullet)
    
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, 380, "Education")
    c.setFont("Helvetica", 11)
    edu_text = "BTech in Computer Science - State University"
    c.drawString(50, 360, edu_text)
    
    c.save()
    print(f"Successfully generated {filename}")

if __name__ == "__main__":
    create_resume_pdf()
