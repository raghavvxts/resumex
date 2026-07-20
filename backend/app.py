import json
import os
import re
import time
import tempfile
import subprocess
from collections import Counter

from dotenv import load_dotenv
from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from google import genai
from google.genai import types
from jinja2 import Environment, FileSystemLoader
import PyPDF2
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Load env
load_dotenv()

# Gemini setup
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "").strip()
DEFAULT_MODEL_CANDIDATES = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
]

if GEMINI_API_KEY:
    ai_client = genai.Client(api_key=GEMINI_API_KEY)
    model_name = GEMINI_MODEL or DEFAULT_MODEL_CANDIDATES[0]
else:
    ai_client = None
    model_name = None

app = Flask(__name__)
ALLOWED_ORIGINS = [origin.strip() for origin in os.getenv(
    "FRONTEND_ORIGINS",
    "http://localhost:8080,http://127.0.0.1:8080"
).split(",") if origin.strip()]
CORS(app, resources={r"/*": {"origins": ALLOWED_ORIGINS}})

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024
MIN_JOB_WORDS = 20
MAX_AI_RETRIES = 3

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "timestamp": time.time()}), 200

STOPWORDS = {
    "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "has", "he", "in", "is", "it", "its",
    "of", "on", "that", "the", "to", "was", "were", "will", "with", "you", "your", "we", "our", "or", "this",
    "these", "those", "there", "their", "can", "could", "should", "would", "like", "using", "use", "used",
    "via", "etc", "here", "clean", "build", "building", "make", "making", "role", "position",
}

TOKEN_SYNONYMS = {
    "js": "javascript",
    "ts": "typescript",
    "py": "python",
    "ml": "machine-learning",
    "ai": "artificial-intelligence",
    "apis": "api",
    "frontend": "front-end",
    "backend": "back-end",
    "fullstack": "full-stack",
}

PHRASE_VARIANTS = {
    "machine-learning": ["machine learning", "ml"],
    "artificial-intelligence": ["artificial intelligence", "ai"],
    "full-stack": ["full stack", "full-stack", "fullstack"],
    "data-structures-and-algorithms": ["data structures", "algorithms", "dsa"],
    "rest-api": ["rest api", "restful api", "restful apis"],
}

ROLE_LEVELS = {"intern", "junior", "mid", "senior"}

# Extract text from PDF
def extract_text(file):
    reader = PyPDF2.PdfReader(file)
    text = ""
    for page in reader.pages:
        text += page.extract_text() or ""
    return text


def normalize_token(token):
    token = token.strip().lower()
    return TOKEN_SYNONYMS.get(token, token)

# Similarity score
def calculate_similarity(resume, job_desc):
    text = [resume, job_desc]
    try:
        tfidf = TfidfVectorizer(
            stop_words="english",
            ngram_range=(1, 2),
            lowercase=True,
        ).fit_transform(text)
        score = cosine_similarity(tfidf)[0][1]
    except ValueError:
        return 0.0
    return float(round(float(score) * 100, 2))

# Keyword extraction
def extract_keyword_tokens(text):
    tokens = re.findall(r"[a-zA-Z][a-zA-Z0-9+#.-]{1,}", text.lower())
    cleaned = []
    for token in tokens:
        normalized = normalize_token(token)
        if normalized not in STOPWORDS:
            cleaned.append(normalized)
    return cleaned


def extract_keywords(text):
    return set(extract_keyword_tokens(text))


def extract_phrase_keywords(text):
    lowered = text.lower()
    found = set()
    for canonical, variants in PHRASE_VARIANTS.items():
        for variant in variants:
            if variant in lowered:
                found.add(canonical)
                break
    return found


def top_keywords_by_frequency(tokens, limit=15):
    return [keyword for keyword, _ in Counter(tokens).most_common(limit)]


def prioritize_missing_keywords(job_tokens, resume_words, limit=15):
    ranked = []
    for keyword, _ in Counter(job_tokens).most_common():
        if keyword not in resume_words:
            ranked.append(keyword)
        if len(ranked) >= limit:
            break
    return ranked
def extract_name(resume_text):
    lines = [line.strip() for line in resume_text.split("\n") if line.strip()]
    if lines:
        first_line = lines[0]
        if len(first_line) < 40 and not any(kw in first_line.lower() for kw in ["resume", "cv", "curriculum", "page"]):
            name = re.sub(r"[^a-zA-Z\s]", "", first_line).strip()
            if name.isupper() and " " not in name:
                # If it's RAGHAVVATS or similar, format nicely
                return name.title()
            return name
    return "Candidate Name"


def split_resume_sections(resume_text):
    lowered = resume_text.lower()
    # Support concatenated and prefixed headers (e.g. PROFESSIONALSUMMARY, TECHNICALSKILLS)
    heading_pattern = re.compile(
        r"\b(?:professional)?(summary|objective)\b|"
        r"\b(?:technical|core)?(skills)\b|"
        r"\b(?:work)?(experience)\b|"
        r"\b(?:academic|personal)?(projects?)\b|"
        r"\b(education)\b",
        re.IGNORECASE
    )
    matches = list(heading_pattern.finditer(lowered))
    if not matches:
        return {}

    sections = {}
    for idx, match in enumerate(matches):
        # Extract the matched capture group name
        section_name = next((g for g in match.groups() if g is not None), "").lower()
        if not section_name:
            continue
            
        if section_name == "objective":
            section_name = "summary"
        if section_name == "project":
            section_name = "projects"

        start = match.end()
        end = matches[idx + 1].start() if idx + 1 < len(matches) else len(resume_text)
        section_text = resume_text[start:end].strip()
        if section_text:
            sections[section_name] = (sections.get(section_name, "") + "\n" + section_text).strip()
    return sections


def calculate_section_scores(resume_text, job_tokens):
    section_order = ["summary", "skills", "experience", "projects", "education"]
    sections = split_resume_sections(resume_text)
    top_job_keywords = top_keywords_by_frequency(job_tokens, limit=20)
    denominator = max(len(top_job_keywords), 1)

    section_scores = {}
    for section in section_order:
        section_text = sections.get(section, "")
        if not section_text:
            section_scores[section] = 0.0
            continue

        section_tokens = set(extract_keyword_tokens(section_text))
        matches = len([kw for kw in top_job_keywords if kw in section_tokens])
        section_scores[section] = round((matches / denominator) * 100, 2)

    return section_scores


def infer_section_gaps(resume_text):
    sections = split_resume_sections(resume_text)
    gaps = []

    if "skills" not in sections:
        gaps.append("Add a dedicated Skills section with grouped tools and languages.")
    if "projects" not in sections:
        gaps.append("Add a Projects section with 2-4 relevant projects.")
    if "experience" not in sections:
        gaps.append("Add Experience/Internship section with measurable impact bullets.")
    if "summary" not in sections:
        gaps.append("Add a short profile summary tailored to this specific role.")

    return gaps


def build_action_plan(score, missing_keywords, section_gaps, role_level):
    steps = []
    top_missing = missing_keywords[:5]

    if top_missing:
        steps.append(
            "Include these role-specific keywords naturally in skills and project bullets: "
            + ", ".join(top_missing)
            + "."
        )

    if score < 50:
        steps.append("Rewrite the top 2 project bullets so they directly mirror this job's responsibilities.")
    elif score < 75:
        steps.append("Strengthen alignment by tailoring summary and skills section to this role.")
    else:
        steps.append("Maintain current alignment and focus on stronger quantification in achievements.")

    if role_level == "intern":
        steps.append("Emphasize coursework, projects, and learning velocity instead of years of industry ownership.")
    elif role_level == "senior":
        steps.append("Highlight leadership impact, architecture decisions, and cross-team ownership outcomes.")

    steps.append("Add metrics to at least 3 bullets using a format like: improved X by Y% / reduced Z by Y hours.")

    for gap in section_gaps[:2]:
        steps.append(gap)

    return steps[:7]


def build_bullet_templates(missing_keywords, role_level, years_experience):
    templates = []
    prefix = "Collaborated with a team to" if role_level in {"intern", "junior"} else "Led the design to"
    impact = "improving delivery speed" if years_experience < 3 else "improving system reliability at scale"

    for keyword in missing_keywords[:3]:
        templates.append(
            f"{prefix} implement {keyword} in [project/system], resulting in [measurable outcome such as 20% faster processing]."
        )
        templates.append(
            f"Designed and shipped [feature] using {keyword}, {impact} for [users/team]."
        )
        if len(templates) >= 4:
            break
    return templates[:4]


def build_checklist(score, keyword_coverage, section_scores, missing_keywords, resume_text):
    sections = split_resume_sections(resume_text)
    has_summary = "summary" in sections
    has_metrics = bool(re.search(r"\b\d+%\b|\b\d+\s*(ms|sec|seconds|hours|days|x)\b", resume_text.lower()))
    experience_score = float(section_scores.get("experience", 0))

    items = [
        {
            "id": "score",
            "label": "Resume score is at least 70",
            "completed": bool(score >= 70),
            "reason": f"Current score: {score}%",
        },
        {
            "id": "coverage",
            "label": "Keyword coverage is at least 45%",
            "completed": bool(keyword_coverage >= 45),
            "reason": f"Current coverage: {keyword_coverage}%",
        },
        {
            "id": "summary",
            "label": "Profile summary/objective is present",
            "completed": has_summary,
            "reason": "Detected summary section" if has_summary else "No summary/objective section detected",
        },
        {
            "id": "metrics",
            "label": "At least one quantified achievement exists",
            "completed": has_metrics,
            "reason": "Detected numeric impact" if has_metrics else "No measurable metrics found",
        },
        {
            "id": "experience",
            "label": "Experience section is aligned with job terms",
            "completed": bool(experience_score >= 30),
            "reason": f"Experience alignment: {experience_score}%",
        },
        {
            "id": "gaps",
            "label": "High-priority keyword gaps are below 8",
            "completed": bool(len(missing_keywords) < 8),
            "reason": f"Current high-priority gaps: {len(missing_keywords)}",
        },
    ]

    completed_count = len([item for item in items if item["completed"]])
    completion_percent = float(round((completed_count / len(items)) * 100, 2))
    return {
        "completion_percent": completion_percent,
        "items": items,
    }


def safe_ai_payload(message):
    return {
        "status": "unavailable",
        "message": message,
        "strengths": [],
        "weak_points": [],
        "rewritten_bullets": [],
        "skills_rewrite": "",
        "summary_rewrite": "",
        "interview_focus": [],
        "model_used": None,
    }


def extract_response_text(response):
    text = getattr(response, "text", "")
    if text:
        return text

    candidates = getattr(response, "candidates", None) or []
    if candidates:
        content = getattr(candidates[0], "content", None)
        parts = getattr(content, "parts", None) or []
        if parts and getattr(parts[0], "text", ""):
            return parts[0].text
    return ""


def parse_structured_ai(raw_text):
    cleaned = raw_text.strip()
    cleaned = re.sub(r"^```json\s*", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"^```", "", cleaned)
    cleaned = re.sub(r"```$", "", cleaned).strip()

    try:
        payload = json.loads(cleaned)
    except json.JSONDecodeError:
        return safe_ai_payload("AI returned non-JSON text. Showing deterministic guidance only.")

    def to_list(key):
        value = payload.get(key, [])
        if not isinstance(value, list):
            return []
        return [str(item).strip() for item in value if str(item).strip()]

    return {
        "status": "ok",
        "message": "",
        "strengths": to_list("strengths")[:6],
        "weak_points": to_list("weak_points")[:6],
        "rewritten_bullets": to_list("rewritten_bullets")[:6],
        "skills_rewrite": str(payload.get("skills_rewrite", "")).strip(),
        "summary_rewrite": str(payload.get("summary_rewrite", "")).strip(),
        "interview_focus": to_list("interview_focus")[:6],
        "model_used": None,
    }


def is_retryable_error(message):
    lowered = message.lower()
    return any(
        token in lowered
        for token in ["429", "quota", "rate", "500", "503", "timeout", "temporarily unavailable"]
    )


def ai_model_candidates():
    if GEMINI_MODEL:
        return [GEMINI_MODEL] + [m for m in DEFAULT_MODEL_CANDIDATES if m != GEMINI_MODEL]
    return list(DEFAULT_MODEL_CANDIDATES)

def get_ai_recommendations(resume, job, role_level, years_experience):
    if ai_client is None:
        return safe_ai_payload(
            "Gemini model is not available. Set GEMINI_API_KEY in backend/.env to enable AI recommendations."
        )
    is_general_audit = not (job or "").strip()

    if is_general_audit:
        prompt = f"""
You are an expert resume coach. Perform a general ATS resume audit.

Return ONLY strict JSON with this schema:
{{
  "strengths": ["..."],
  "weak_points": ["..."],
  "rewritten_bullets": ["..."],
  "skills_rewrite": "...",
  "summary_rewrite": "...",
  "interview_focus": ["..."]
}}

Rules:
- No markdown, no backticks, no extra fields.
- Review structure, action-verb strength, formatting, and quantification of impact.
- Tailor suggestions for experience level tier: {role_level} ({years_experience} years of experience).
- Rewritten bullets must be highly professional, action-oriented, and quantified.

Resume:
{resume}
"""
    else:
        prompt = f"""
You are an expert resume coach.

Return ONLY strict JSON with this schema:
{{
  "strengths": ["..."],
  "weak_points": ["..."],
  "rewritten_bullets": ["..."],
  "skills_rewrite": "...",
  "summary_rewrite": "...",
  "interview_focus": ["..."]
}}

Rules:
- No markdown, no backticks, no extra fields.
- Tailor for role level: {role_level}.
- Tailor for years of experience: {years_experience}.
- Rewritten bullets must be measurable and ATS-friendly.

Resume:
{resume}

Job Description:
{job}
"""

    last_error = ""
    for candidate_model in ai_model_candidates():
        for attempt in range(MAX_AI_RETRIES):
            try:
                response = ai_client.models.generate_content(
                    model=candidate_model,
                    contents=prompt,
                )
                text = extract_response_text(response)
                if not text:
                    raise ValueError("Empty AI response")

                parsed = parse_structured_ai(text)
                parsed["model_used"] = candidate_model
                return parsed
            except Exception as exc:
                message = str(exc)
                last_error = message

                if is_retryable_error(message) and attempt < MAX_AI_RETRIES - 1:
                    time.sleep(2 ** attempt)
                    continue

                # Quota exceeded on this model. Try next model candidate.
                if "quota" in message.lower() or "429" in message:
                    break
                # Non-retryable error; move to next model candidate.
                break

    if "quota" in last_error.lower() or "429" in last_error:
        retry_match = re.search(r"retry in\s+([0-9]+(?:\.[0-9]+)?)s", last_error, flags=re.IGNORECASE)
        retry_hint = ""
        if retry_match:
            retry_hint = f" Please retry in about {round(float(retry_match.group(1)))} seconds."
        return safe_ai_payload(
            "AI recommendations are temporarily unavailable due to quota/rate limits."
            + retry_hint
            + " Deterministic ATS guidance is still available."
        )

    return safe_ai_payload("AI recommendations are temporarily unavailable. Please try again shortly.")


def validate_request():
    file = request.files.get("resume")
    resume_text_raw = (request.form.get("resume_text") or "").strip()
    job_desc = (request.form.get("job_description") or "").strip()
    role_level = (request.form.get("role_level") or "junior").strip().lower()
    years_experience_raw = (request.form.get("years_experience") or "0").strip()

    if file is None and not resume_text_raw:
        return None, None, None, None, (jsonify({"error": "Missing 'resume' file or 'resume_text'."}), 400)

    resume_text = resume_text_raw

    if file is not None:
        if not file.filename:
            return None, None, None, None, (jsonify({"error": "Resume filename is empty."}), 400)

        if not file.filename.lower().endswith(".pdf"):
            return None, None, None, None, (jsonify({"error": "Only PDF files are accepted."}), 400)
        file.stream.seek(0, os.SEEK_END)
        file_size = file.stream.tell()
        file.stream.seek(0)
        if file_size > MAX_FILE_SIZE_BYTES:
            return None, None, None, None, (jsonify({"error": "PDF exceeds 10MB limit."}), 400)
            
        try:
            resume_text = extract_text(file)
        except (PyPDF2.errors.PdfReadError, PyPDF2.errors.FileNotDecryptedError):
            return None, None, None, None, (jsonify({"error": "Invalid or corrupted PDF file."}), 400)

    if not resume_text.strip():
        return None, None, None, None, (jsonify({"error": "Could not extract text from the provided resume."}), 400)

    if job_desc:
        job_word_count = len(re.findall(r"\w+", job_desc))
        if job_word_count < MIN_JOB_WORDS:
            return None, None, None, None, (
                jsonify({
                    "error": (
                        f"Job description is too short ({job_word_count} words). "
                        f"Please paste at least {MIN_JOB_WORDS} words for accurate matching."
                    )
                }),
                400,
            )

    if role_level not in ROLE_LEVELS:
        role_level = "junior"

    try:
        years_experience = int(years_experience_raw)
    except ValueError:
        years_experience = 0
    years_experience = max(0, min(years_experience, 40))

    return resume_text, job_desc, role_level, years_experience, None

@app.route("/analyze", methods=["POST"])
def analyze():
    resume_text, job_desc, role_level, years_experience, error_response = validate_request()
    if error_response:
        return error_response

    try:
        candidate_name = extract_name(resume_text)

        is_general_audit = not job_desc.strip()

        if is_general_audit:
            # General ATS Resume Audit
            sections = split_resume_sections(resume_text)
            has_summary = "summary" in sections
            has_skills = "skills" in sections
            has_experience = "experience" in sections
            has_projects = "projects" in sections
            has_education = "education" in sections
            has_metrics = bool(re.search(r"\b\d+%\b|\b\d+\s*(ms|sec|seconds|hours|days|x)\b", resume_text.lower()))

            score = 0.0
            if has_summary: score += 15
            if has_skills: score += 20
            if has_experience: score += 25
            if has_projects: score += 15
            if has_education: score += 10
            if has_metrics: score += 15

            present_sections_count = sum([1 for s in ["summary", "skills", "experience", "projects", "education"] if s in sections])
            keyword_coverage = round((present_sections_count / 5) * 100, 2)

            section_scores = {
                "summary": 100.0 if has_summary else 0.0,
                "skills": 100.0 if has_skills else 0.0,
                "experience": 100.0 if has_experience else 0.0,
                "projects": 100.0 if has_projects else 0.0,
                "education": 100.0 if has_education else 0.0
            }

            matched = []
            missing = []
            matched_phrases = []
            missing_phrases = []

            action_plan = []
            if not has_summary:
                action_plan.append("Add a high-impact profile summary explaining your core value proposition.")
            if not has_skills:
                action_plan.append("Add a categorized Skills section showing your technical stack.")
            if not has_experience:
                action_plan.append("Add a detailed professional experience section with chronological order.")
            if not has_projects:
                action_plan.append("Add a projects section highlighting at least 2 relevant projects.")
            if not has_metrics:
                action_plan.append("Incorporate measurable achievements (percentages, time saved, dollar value) in your bullet points.")
            action_plan.append("Use strong action verbs (e.g. Spearheaded, Designed, Optimised) at the start of experience bullets.")
            action_plan.append("Organize skills by categories (e.g. Languages, Frameworks, Tools) to pass ATS checks.")

            bullet_templates = [
                "Spearheaded the design and delivery of [project/system], resulting in [quantified outcome like 25% efficiency gain].",
                "Optimised backend [service/queries], reducing latency by [measurable metric like 40ms].",
                "Collaborated with cross-functional teams to integrate [feature/service], improving [delivery speed/adoption]."
            ]

            checklist = {
                "completion_percent": score,
                "items": [
                    {
                        "id": "score",
                        "label": "ATS Layout score is at least 70",
                        "completed": bool(score >= 70),
                        "reason": f"Current structural score: {score}%",
                    },
                    {
                        "id": "coverage",
                        "label": "Core sections coverage is at least 80%",
                        "completed": bool(keyword_coverage >= 80),
                        "reason": f"Current section coverage: {keyword_coverage}%",
                    },
                    {
                        "id": "summary",
                        "label": "Profile summary section is present",
                        "completed": has_summary,
                        "reason": "Detected summary section" if has_summary else "No summary section detected",
                    },
                    {
                        "id": "metrics",
                        "label": "At least one quantified achievement exists",
                        "completed": has_metrics,
                        "reason": "Detected numeric impact" if has_metrics else "No measurable metrics found",
                    },
                    {
                        "id": "experience",
                        "label": "Experience section is present",
                        "completed": has_experience,
                        "reason": "Detected experience section" if has_experience else "No experience section detected",
                    },
                    {
                        "id": "gaps",
                        "label": "Skills matrix is configured",
                        "completed": has_skills,
                        "reason": "Detected skills section" if has_skills else "No skills section detected",
                    }
                ]
            }

        else:
            # Standard Job Description Matching (original code)
            score = calculate_similarity(resume_text, job_desc)

            resume_tokens = extract_keyword_tokens(resume_text)
            job_tokens = extract_keyword_tokens(job_desc)
            resume_words = set(resume_tokens)
            job_words = set(job_tokens)

            resume_phrases = extract_phrase_keywords(resume_text)
            job_phrases = extract_phrase_keywords(job_desc)

            missing = prioritize_missing_keywords(job_tokens, resume_words, limit=15)
            missing_phrases = sorted(list(job_phrases - resume_phrases))
            matched_phrases = sorted(list(job_phrases & resume_phrases))
            matched = [word for word in top_keywords_by_frequency(job_tokens, limit=30) if word in resume_words][:15]
            keyword_coverage = round((len(job_words & resume_words) / max(len(job_words), 1)) * 100, 2)

            section_scores = calculate_section_scores(resume_text, job_tokens)

            section_gaps = infer_section_gaps(resume_text)
            action_plan = build_action_plan(score, missing, section_gaps, role_level)
            bullet_templates = build_bullet_templates(missing, role_level, years_experience)
            checklist = build_checklist(score, keyword_coverage, section_scores, missing, resume_text)

        ai_payload = get_ai_recommendations(
            resume_text[:1800],
            job_desc[:1800],
            role_level,
            years_experience,
        )

        fallback_text = ai_payload.get("message", "")
        if ai_payload.get("status") == "ok":
            suggestions = "\n".join(
                [
                    "Strengths:",
                    *[f"- {item}" for item in ai_payload.get("strengths", [])],
                    "",
                    "Weak Points:",
                    *[f"- {item}" for item in ai_payload.get("weak_points", [])],
                ]
            ).strip()
        else:
            suggestions = fallback_text

        return jsonify({
            "score": score,
            "candidate_name": candidate_name,
            "role_level": role_level,
            "years_experience": years_experience,
            "keyword_coverage": keyword_coverage,
            "matched_keywords": matched,
            "missing_keywords": missing,
            "matched_phrases": matched_phrases,
            "missing_phrases": missing_phrases,
            "section_scores": section_scores,
            "action_plan": action_plan,
            "bullet_templates": bullet_templates,
            "checklist": checklist,
            "ai_recommendations": ai_payload,
            "suggestions": suggestions,
        })
    except (PyPDF2.errors.PdfReadError, PyPDF2.errors.FileNotDecryptedError):
        return jsonify({"error": "Invalid or corrupted PDF file."}), 400
    except Exception as exc:
        app.logger.exception("Analyze endpoint failed")
        debug_enabled = os.getenv("FLASK_DEBUG", "false").lower() == "true"
        if debug_enabled:
            return jsonify({"error": f"Analysis failed: {exc}"}), 500
        return jsonify({"error": "Analysis failed due to an internal error."}), 500
@app.route("/cover-letter", methods=["POST"])
def generate_cover_letter():
    if ai_client is None:
        return jsonify({"error": "Gemini API key is not configured."}), 503

    resume_text, job_desc, role_level, years_experience, error_response = validate_request()
    if error_response:
        return error_response
    
    try:
        candidate_name = extract_name(resume_text)
        
        prompt = f"""
You are an expert career coach and executive recruiter.
Write a professional, compelling, and modern cover letter for the candidate named {candidate_name}.
They are applying for a {role_level} level position, with {years_experience} years of experience.

Job Description (if any):
{job_desc or "General Application"}

Candidate's Resume:
{resume_text[:2000]}

Rules:
- Do not include brackets like [Company Name] if the information is missing; instead, write naturally to avoid obvious placeholders.
- The tone should be confident, professional, and enthusiastic.
- It should be 3-4 paragraphs long.
- Output ONLY the plain text of the cover letter. No markdown formatting, no JSON, no conversational filler.
"""

        last_error = ""
        for candidate_model in ai_model_candidates():
            for attempt in range(MAX_AI_RETRIES):
                try:
                    response = ai_client.models.generate_content(
                        model=candidate_model,
                        contents=prompt,
                    )
                    text = extract_response_text(response).strip()
                    if text:
                        return jsonify({"cover_letter": text})
                except Exception as exc:
                    last_error = str(exc)
                    if is_retryable_error(last_error) and attempt < MAX_AI_RETRIES - 1:
                        time.sleep(2 ** attempt)
                        continue
                    break
        
        # FALLBACK LOGIC: If Gemini API fails (quota / key error), generate a high-fidelity local fallback
        skills = list(extract_keywords(resume_text))[:6]
        if not skills:
            skills = ["Python", "React", "SQL", "Git", "Software Engineering"]
        
        fallback_letter = f"""Dear Hiring Team,

I am writing to express my enthusiastic interest in target opportunities. With a solid foundation as a {role_level.title()} and {years_experience} years of hands-on experience, I am confident in my ability to contribute effectively to your engineering goals.

Throughout my career, I have developed proficiency in key technologies including {', '.join(skills[:5])}. I pride myself on writing clean, scalable code and collaborating with cross-functional teams to deliver high-quality software solutions.

I am particularly drawn to this opportunity because of your commitment to technical excellence and innovation. I am eager to apply my experience in problem-solving and software development to help drive your projects forward.

Thank you for your time and consideration. I look forward to the possibility of discussing how my skills and background align with your needs.

Sincerely,
{candidate_name}"""
        return jsonify({"cover_letter": fallback_letter})

    except Exception as exc:
        app.logger.exception("Cover Letter endpoint failed")
        return jsonify({"error": "An internal error occurred while generating the cover letter."}), 500

@app.route("/skills-analysis", methods=["POST"])
def analyze_skills():
    if ai_client is None:
        return jsonify({"error": "Gemini API key is not configured."}), 503

    resume_text, job_desc, role_level, years_experience, error_response = validate_request()
    if error_response:
        return error_response
    
    try:
        prompt = f"""
You are an expert technical recruiter and career coach.
Analyze the following resume and categorize the candidate's skills into three distinct buckets:
1. Technical Skills (Languages, frameworks, tools)
2. Soft Skills (Leadership, communication, problem-solving)
3. Domain Knowledge (Industry expertise like Finance, Healthcare, System Design, Agile)

For each category, provide:
- A "score" (0-100) indicating their overall proficiency based on how deeply the skills are demonstrated in their experience (e.g., used in complex projects vs just listed in a skills section).
- A list of "skills" (strings).

Also, if a Job Description is provided, provide a list of up to 3 "gaps" (missing critical skills). If no Job Description is provided, provide up to 3 general skill gaps based on their experience level.

Job Description:
{job_desc or "None provided. Do a general audit."}

Candidate's Resume:
{resume_text[:2500]}

Return ONLY strict JSON with this exact schema, and absolutely NO markdown formatting or backticks:
{{
  "technical": {{ "score": 85, "skills": ["..."] }},
  "soft": {{ "score": 90, "skills": ["..."] }},
  "domain": {{ "score": 75, "skills": ["..."] }},
  "gaps": ["..."]
}}
"""

        last_error = ""
        for candidate_model in ai_model_candidates():
            for attempt in range(MAX_AI_RETRIES):
                try:
                    response = ai_client.models.generate_content(
                        model=candidate_model,
                        contents=prompt,
                    )
                    text = extract_response_text(response).strip()
                    text = re.sub(r"^```json\s*", "", text, flags=re.IGNORECASE)
                    text = re.sub(r"^```", "", text)
                    text = re.sub(r"```$", "", text).strip()
                    
                    data = json.loads(text)
                    return jsonify(data)
                except Exception as exc:
                    last_error = str(exc)
                    if is_retryable_error(last_error) and attempt < MAX_AI_RETRIES - 1:
                        time.sleep(2 ** attempt)
                        continue
                    break
        
        # FALLBACK LOGIC: If Gemini API fails, return parsed/deterministic skills analysis
        keywords = list(extract_keywords(resume_text))
        tech_skills = [k for k in keywords if k.lower() in ["python", "react", "javascript", "typescript", "c++", "java", "sql", "git", "node.js", "express", "flask", "django", "docker", "aws", "gcp", "kubernetes"]]
        if not tech_skills:
            tech_skills = ["Python", "JavaScript", "SQL", "Git", "React"]
        
        fallback_data = {
            "technical": {
                "score": 85 if role_level == "senior" else 75 if role_level == "mid" else 65,
                "skills": tech_skills[:12]
            },
            "soft": {
                "score": 80,
                "skills": ["Problem Solving", "Team Collaboration", "Effective Communication", "Adaptability", "Time Management"]
            },
            "domain": {
                "score": 75,
                "skills": ["Software Engineering", "Agile Methodologies", "Object-Oriented Programming", "RESTful API Design"]
            },
            "gaps": [
                "Cloud Infrastructure (AWS/GCP/Azure) and DevOps pipelines",
                "Unit Testing & Integration Testing methodologies",
                "System Architecture & Scalability design patterns"
            ]
        }
        return jsonify(fallback_data)

    except Exception as exc:
        app.logger.exception("Skills Analysis endpoint failed")
        return jsonify({"error": "An internal error occurred."}), 500


@app.route("/chat", methods=["POST"])
def chat():
    if ai_client is None:
        return jsonify({"error": "Gemini API key is not configured."}), 503

    message = (request.form.get("message") or "").strip()
    job_desc = (request.form.get("job_description") or "").strip()
    role_level = (request.form.get("role_level") or "junior").strip().lower()
    years_experience = (request.form.get("years_experience") or "0").strip()
    chat_history = request.form.get("history") or "[]"
    file = request.files.get("resume")

    if not message:
        return jsonify({"error": "Message is required."}), 400

    try:
        resume_text = extract_text(file) if file else ""
        candidate_name = extract_name(resume_text) if resume_text else "the candidate"
        history_str = ""
        try:
            history_data = json.loads(chat_history)
            for m in history_data[-5:]:
                history_str += f"{m.get('sender', 'user')}: {m.get('text', '')}\n"
        except:
            pass

        prompt = f"""
You are "The Strategist", an expert technical recruiter and career coach AI assistant.
You are chatting with {candidate_name}.
They are applying for a {role_level} level position, with {years_experience} years of experience.

Job Description (if any):
{job_desc or "General Application"}

Candidate's Resume (if provided):
{resume_text[:2000] if resume_text else "No resume provided yet."}

Recent Chat History:
{history_str}

User Message: {message}

Rules:
- Provide a helpful, concise, and professional response directly addressing their message.
- If they ask to rewrite a bullet point, provide 1 or 2 strong, quantified options based on their resume context.
- Output ONLY the plain text of your response. No markdown formatting for the whole message, just standard text or basic bullet points.
"""

        last_error = ""
        for candidate_model in ai_model_candidates():
            for attempt in range(MAX_AI_RETRIES):
                try:
                    response = ai_client.models.generate_content(
                        model=candidate_model,
                        contents=prompt,
                        config=types.GenerateContentConfig(
                            tools=[{"google_search": {}}]
                        )
                    )
                    text = extract_response_text(response).strip()
                    if text:
                        return jsonify({"reply": text})
                except Exception as exc:
                    last_error = str(exc)
                    if is_retryable_error(last_error) and attempt < MAX_AI_RETRIES - 1:
                        time.sleep(2 ** attempt)
                        continue
                    break
        return jsonify({"error": "AI failed to generate a response due to quota limits or errors."}), 500

    except Exception as exc:
        app.logger.exception("Chat endpoint failed")
        return jsonify({"error": "An internal error occurred while processing the chat."}), 500

@app.route("/parse-resume", methods=["POST"])
def parse_resume():
    if ai_client is None:
        return jsonify({"error": "Gemini API key is not configured."}), 503

    resume_text, _, _, _, error_response = validate_request()
    if error_response:
        return error_response

    try:
        prompt = f"""
You are an expert resume data extractor. 
Extract the information from the following resume into a STRICT JSON object perfectly matching this schema:

{{
  "personal_info": {{
    "name": "Full Name",
    "email": "email@example.com",
    "phone": "Phone Number",
    "linkedin": "LinkedIn URL or handle",
    "github": "GitHub URL or handle",
    "portfolio": "Portfolio URL"
  }},
  "education": [
    {{
      "institution": "University Name",
      "degree": "Degree and Major",
      "location": "City, State",
      "date": "Graduation Date (e.g. May 2024)",
      "gpa": "GPA if present"
    }}
  ],
  "experience": [
    {{
      "company": "Company Name",
      "role": "Job Title",
      "location": "City, State",
      "date": "Start - End Date",
      "bullets": ["Bullet point 1", "Bullet point 2"]
    }}
  ],
  "projects": [
    {{
      "name": "Project Name",
      "technologies": "Comma separated technologies",
      "date": "Date if present",
      "bullets": ["Bullet point 1", "Bullet point 2"]
    }}
  ],
  "skills": {{
    "languages": "Comma separated languages",
    "frameworks": "Comma separated frameworks",
    "tools": "Comma separated tools"
  }}
}}

Rules:
- Return ONLY valid JSON. Absolutely no markdown backticks, no explanatory text.
- If a field is missing, leave it as an empty string "".
- Ensure all bullet points are parsed individually into the 'bullets' arrays.
- Do not make up information.

Resume Text:
{resume_text[:5000]}
"""

        last_error = ""
        for candidate_model in ai_model_candidates():
            for attempt in range(MAX_AI_RETRIES):
                try:
                    response = ai_client.models.generate_content(
                        model=candidate_model,
                        contents=prompt,
                    )
                    text = extract_response_text(response).strip()
                    text = re.sub(r"^```json\s*", "", text, flags=re.IGNORECASE)
                    text = re.sub(r"^```", "", text)
                    text = re.sub(r"```$", "", text).strip()
                    
                    data = json.loads(text)
                    return jsonify(data)
                except Exception as exc:
                    last_error = str(exc)
                    if is_retryable_error(last_error) and attempt < MAX_AI_RETRIES - 1:
                        time.sleep(2 ** attempt)
                        continue
                    break
                    
        # Fallback if AI fails (e.g. quota limit or parsing error)
        # We will extract a small snippet of the resume so the UI at least updates!
        fallback_snippet = " ".join(resume_text.split()[:40]) + "..." if resume_text else "No text found."
        
        fallback_data = {
            "personal_info": {
                "name": extract_name(resume_text) or "Candidate Name",
                "email": "Update API Key",
                "phone": "Backend Quota Reached",
                "linkedin": "",
                "github": ""
            },
            "experience": [
                {
                    "company": "API Quota Limit Reached",
                    "role": "Backend Error",
                    "location": "",
                    "date": "",
                    "bullets": [
                        "Your resume was uploaded, but the AI parser has exhausted its quota.",
                        "Because the backend hit the Google Gemini API rate limits, we cannot intelligently extract your experience.",
                        "Please update the GEMINI_API_KEY in backend/.env with a new key.",
                        f"Raw text preview: {fallback_snippet}"
                    ]
                }
            ],
            "education": [
                {
                    "institution": "API Quota Limit Reached",
                    "location": "",
                    "degree": "Backend Error",
                    "date": ""
                }
            ],
            "projects": [
                {
                    "name": "API Quota Limit Reached",
                    "technologies": "Backend Error",
                    "date": "",
                    "bullets": [
                        "Please update the GEMINI_API_KEY in backend/.env."
                    ]
                }
            ],
            "skills": {
                "languages": "Update API Key",
                "frameworks": "Backend Error",
                "tools": ""
            }
        }
        return jsonify(fallback_data), 200

    except Exception as exc:
        app.logger.exception("Parse Resume endpoint failed")
        return jsonify({"error": "An internal error occurred."}), 500

@app.route("/generate-pdf", methods=["POST"])
def generate_pdf():
    try:
        resume_data = request.json
        if not resume_data:
            return jsonify({"error": "No resume data provided."}), 400

        # Setup custom Jinja2 environment for LaTeX
        env = Environment(
            block_start_string='<%',
            block_end_string='%>',
            variable_start_string='<<',
            variable_end_string='>>',
            comment_start_string='<#',
            comment_end_string='#>',
            trim_blocks=True,
            autoescape=False,
            loader=FileSystemLoader(os.path.join(os.path.dirname(__file__), 'templates'))
        )
        
        # We need a function to escape latex special characters in the json data
        def escape_latex(s):
            if not isinstance(s, str):
                return s
            # Escaping minimal set of latex special chars
            chars = {
                '&': r'\&',
                '%': r'\%',
                '$': r'\$',
                '#': r'\#',
                '_': r'\_',
                '{': r'\{',
                '}': r'\}',
                '~': r'\textasciitilde{}',
                '^': r'\textasciicircum{}',
                '\\': r'\textbackslash{}',
            }
            return "".join(chars.get(c, c) for c in s)
            
        def escape_dict(d):
            if isinstance(d, dict):
                return {k: escape_dict(v) for k, v in d.items()}
            elif isinstance(d, list):
                return [escape_dict(v) for v in d]
            elif isinstance(d, str):
                return escape_latex(d)
            return d
            
        escaped_data = escape_dict(resume_data)
        
        template_name = resume_data.get("template_name", "jakes_resume")
        template_file = f"{template_name}.tex"
        
        try:
            template = env.get_template(template_file)
        except Exception:
            template = env.get_template('jakes_resume.tex')
            
        rendered_tex = template.render(**escaped_data)

        # Create a temporary directory to run tectonic
        with tempfile.TemporaryDirectory() as temp_dir:
            tex_file = os.path.join(temp_dir, 'resume.tex')
            with open(tex_file, 'w') as f:
                f.write(rendered_tex)
                
            # Run tectonic
            result = subprocess.run(
                ['tectonic', 'resume.tex'],
                cwd=temp_dir,
                capture_output=True,
                text=True
            )
            
            if result.returncode != 0:
                app.logger.error(f"Tectonic failed: {result.stderr}")
                return jsonify({"error": "Failed to compile LaTeX PDF."}), 500
                
            pdf_path = os.path.join(temp_dir, 'resume.pdf')
            if not os.path.exists(pdf_path):
                return jsonify({"error": "PDF was not generated."}), 500
                
            # Read pdf data to memory to send it
            with open(pdf_path, 'rb') as f:
                pdf_data = f.read()
                
            from io import BytesIO
            return send_file(
                BytesIO(pdf_data),
                mimetype='application/pdf',
                as_attachment=True,
                download_name='resume.pdf'
            )

    except Exception as exc:
        app.logger.exception("Generate PDF endpoint failed")
        return jsonify({"error": "An internal error occurred."}), 500

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "gemini_enabled": ai_client is not None,
        "gemini_model": model_name,
    })

if __name__ == "__main__":
    app.run(
        host=os.getenv("FLASK_HOST", "127.0.0.1"),
        port=int(os.getenv("FLASK_PORT", "5000")),
        debug=os.getenv("FLASK_DEBUG", "false").lower() == "true",
    )