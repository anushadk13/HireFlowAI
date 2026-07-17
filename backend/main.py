from __future__ import annotations

import math
import re
from collections import Counter
from pathlib import Path
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field


BASE_DIR = Path(__file__).resolve().parent
TEMPLATES_DIR = BASE_DIR / "templates"
STATIC_DIR = BASE_DIR / "static"


app = FastAPI(title="HireFlow AI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


SKILL_ALIASES: dict[str, list[str]] = {
    "Python": ["python", "pandas", "numpy", "scikit-learn", "sklearn"],
    "SQL": ["sql", "postgres", "postgresql", "mysql", "sqlite"],
    "React": ["react", "reactjs", "next.js", "nextjs", "frontend", "typescript"],
    "FastAPI": ["fastapi", "api", "rest api", "rest", "backend"],
    "Docker": ["docker", "container", "containers", "dockerfile"],
    "AWS": ["aws", "s3", "ec2", "lambda", "cloud"],
    "TensorFlow": ["tensorflow", "keras", "deep learning"],
    "LangChain": ["langchain", "rag", "llm", "prompt", "agent"],
    "ChromaDB": ["chromadb", "chroma", "vector database", "vector db"],
    "Git": ["git", "github", "version control"],
    "JavaScript": ["javascript", "js", "node", "node.js"],
    "TypeScript": ["typescript", "ts"],
    "PostgreSQL": ["postgresql", "postgres", "sql"],
    "Machine Learning": ["machine learning", "ml", "model training", "classification"],
    "Communication": ["communication", "stakeholder", "presentation", "documentation"],
}

ROLE_PROFILES = {
    "Data Scientist": {
        "summary": "Data Scientist with a track record of turning messy data into clear decisions using Python, SQL, statistics, and model development.",
        "projects": [
            "Built a churn prediction pipeline with feature engineering, model selection, and explainability reporting.",
            "Created a resume intelligence dashboard that matched candidate profiles to job requirements with semantic search.",
        ],
        "skills": ["Python", "SQL", "Machine Learning", "TensorFlow", "Communication"],
    },
    "Frontend Engineer": {
        "summary": "Frontend Engineer focused on responsive interfaces, design systems, and product-minded implementation with React and TypeScript.",
        "projects": [
            "Built an ATS dashboard with polished role-based flows, reusable components, and responsive data cards.",
            "Implemented a recruiter analytics UI with filters, charts, and workflow-specific call to actions.",
        ],
        "skills": ["React", "TypeScript", "JavaScript", "Git", "Communication"],
    },
    "AI Engineer": {
        "summary": "AI Engineer who ships practical retrieval and generation systems, pairing clean backend workflows with model-aware product features.",
        "projects": [
            "Built a resume-to-job matching engine with keyword extraction, semantic scoring, and explanation outputs.",
            "Created an interview prep assistant that generates role-aware questions from resumes and job descriptions.",
        ],
        "skills": ["Python", "FastAPI", "LangChain", "ChromaDB", "AWS"],
    },
    "Backend Engineer": {
        "summary": "Backend Engineer with experience designing APIs, workflow automation, and data-centric services that stay easy to maintain.",
        "projects": [
            "Built a screening API that scores resumes, ranks candidates, and surfaces hiring recommendations.",
            "Designed a job description parser and assessment generator with clean request and response contracts.",
        ],
        "skills": ["FastAPI", "Python", "SQL", "Docker", "PostgreSQL"],
    },
}

SAMPLE_CANDIDATES = [
    {
        "name": "John",
        "ats": 91,
        "skill_match": 88,
        "projects": "Excellent",
        "experience": "Relevant",
        "education": "Good",
        "recommendation": "Strong Hire",
        "college": "University of Adelaide",
    },
    {
        "name": "Aisha",
        "ats": 90,
        "skill_match": 85,
        "projects": "Very Strong",
        "experience": "Relevant",
        "education": "Good",
        "recommendation": "Strong Hire",
        "college": "Monash University",
    },
    {
        "name": "Marcus",
        "ats": 86,
        "skill_match": 82,
        "projects": "Strong",
        "experience": "Solid",
        "education": "Good",
        "recommendation": "Hire",
        "college": "University of Melbourne",
    },
    {
        "name": "Nina",
        "ats": 81,
        "skill_match": 77,
        "projects": "Good",
        "experience": "Moderate",
        "education": "Good",
        "recommendation": "Interview",
        "college": "UNSW",
    },
]

PIPELINE_COUNTS = {"total": 327, "shortlisted": 58, "rejected": 190, "pending": 79}


class ResumeInput(BaseModel):
    resume_text: str = Field(..., min_length=1)
    job_description: str = ""
    target_role: str = ""


class JobDescriptionInput(BaseModel):
    job_description: str = Field(..., min_length=1)


class CareerQuestionInput(BaseModel):
    question: str = Field(..., min_length=1)
    resume_text: str = ""
    job_description: str = ""


class CandidateBatchInput(BaseModel):
    candidates: list[dict[str, Any]]
    job_description: str = ""


class AssessmentInput(BaseModel):
    topic: str
    skill_level: str = "intermediate"
    candidate_answers: list[str] = []


class ChatInput(BaseModel):
    message: str
    skills: list[str] = []


def normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text.lower()).strip()


def words(text: str) -> list[str]:
    return re.findall(r"[a-zA-Z][a-zA-Z0-9+#.-]*", text.lower())


def detect_skills(text: str) -> list[str]:
    normalized = normalize(text)
    detected: list[str] = []
    for skill, aliases in SKILL_ALIASES.items():
        if any(alias in normalized for alias in aliases):
            detected.append(skill)
    return detected


def count_bullets(text: str) -> int:
    return sum(1 for line in text.splitlines() if line.strip().startswith(("-", "*", "•")))


def detect_weak_bullets(text: str) -> list[str]:
    weak_markers = [
        "worked on",
        "responsible for",
        "helped with",
        "assisted",
        "various tasks",
        "team member",
    ]
    bullets = [line.strip(" -*•") for line in text.splitlines() if line.strip().startswith(("-", "*", "•"))]
    return [bullet for bullet in bullets if any(marker in bullet.lower() for marker in weak_markers)]


def grammar_notes(text: str) -> list[str]:
    notes: list[str] = []
    sentences = re.split(r"(?<=[.!?])\s+", text.strip())
    if sentences and any(sentence and sentence[0].islower() for sentence in sentences):
        notes.append("Some sentences start in lowercase.")
    if "  " in text:
        notes.append("Remove repeated spaces.")
    if len(text) > 0 and len(text.split()) < 80:
        notes.append("Resume content is short; add more measurable detail.")
    if text.count(",") > 20:
        notes.append("Several long sentences could be tightened for readability.")
    return notes[:4]


def formatting_suggestions(text: str) -> list[str]:
    suggestions = []
    if count_bullets(text) < 3:
        suggestions.append("Use bullet points under each role to improve scannability.")
    if not re.search(r"\b(education|experience|projects|skills|summary)\b", text.lower()):
        suggestions.append("Add clear section headings such as Summary, Experience, Projects, and Skills.")
    if not re.search(r"\b\d+%|\b\d+\+|\$\d+|[0-9]{4}\b", text):
        suggestions.append("Add metrics, years, or outcomes where possible to make impact concrete.")
    return suggestions[:4]


def extract_keywords(text: str, limit: int = 12) -> list[str]:
    tokens = [token for token in words(text) if len(token) > 2]
    common = Counter(tokens)
    stopwords = {
        "the",
        "and",
        "for",
        "with",
        "that",
        "from",
        "this",
        "have",
        "your",
        "you",
        "will",
        "are",
        "was",
        "into",
        "using",
        "work",
        "worked",
        "experience",
        "skills",
    }
    items = [word for word, _count in common.most_common() if word not in stopwords]
    return items[:limit]


def ats_score(resume_text: str, job_description: str = "") -> dict[str, Any]:
    resume_skills = detect_skills(resume_text)
    job_skills = detect_skills(job_description) if job_description else []
    matched_skills = sorted(set(resume_skills) & set(job_skills))
    missing_skills = sorted(set(job_skills) - set(resume_skills))
    bullet_bonus = min(10, count_bullets(resume_text) * 2)
    keyword_bonus = min(15, len(extract_keywords(resume_text)) * 1.3)
    alignment = 0
    if job_skills:
        alignment = math.floor((len(matched_skills) / max(1, len(set(job_skills)))) * 45)
    content_bonus = 30 if len(resume_text.split()) > 120 else 18
    score = max(20, min(100, 20 + bullet_bonus + keyword_bonus + alignment + content_bonus))
    return {
        "ats_score": score,
        "resume_score": min(100, score + 2),
        "grammar_notes": grammar_notes(resume_text),
        "formatting_suggestions": formatting_suggestions(resume_text),
        "missing_skills": missing_skills,
        "weak_bullet_points": detect_weak_bullets(resume_text),
        "keyword_optimization": missing_skills[:6] or extract_keywords(job_description, 6),
        "matched_skills": matched_skills,
        "resume_skills": resume_skills,
        "job_skills": job_skills,
    }


def infer_role(resume_text: str, job_description: str = "", target_role: str = "") -> str:
    target_role = target_role.strip()
    if target_role:
        return target_role
    combined = f"{resume_text}\n{job_description}".lower()
    if any(term in combined for term in ["react", "frontend", "typescript", "ui"]):
        return "Frontend Engineer"
    if any(term in combined for term in ["fastapi", "api", "backend", "docker", "postgres"]):
        return "Backend Engineer"
    if any(term in combined for term in ["rag", "llm", "langchain", "chromadb", "openai"]):
        return "AI Engineer"
    if any(term in combined for term in ["data", "model", "statistics", "ml", "machine learning"]):
        return "Data Scientist"
    return "AI Engineer"


def build_improvement_bundle(resume_text: str, job_description: str = "", target_role: str = "") -> dict[str, Any]:
    role = infer_role(resume_text, job_description, target_role)
    profile = ROLE_PROFILES.get(role, ROLE_PROFILES["AI Engineer"])
    resume_skills = detect_skills(resume_text)
    highlighted_skills = sorted(set(resume_skills + profile["skills"]))[:8]
    return {
        "target_role": role,
        "summary": profile["summary"],
        "experience": [
            "Led delivery of a hiring workflow that scores resumes, explains matches, and prioritizes candidates for recruiters.",
            "Collaborated with product and engineering stakeholders to turn ambiguous requirements into measurable system behavior.",
        ],
        "projects": profile["projects"],
        "skills": highlighted_skills,
        "tailored_bullets": [
            "Improved screening quality by combining rule-based ATS scoring with skill extraction and ranking heuristics.",
            "Built reusable UI and backend workflows that reduce recruiter effort and keep candidate feedback consistent.",
        ],
    }


def generate_cover_letter(resume_text: str, job_description: str = "") -> str:
    role = infer_role(resume_text, job_description)
    top_skills = ", ".join(detect_skills(resume_text)[:5] or ["problem solving", "delivery", "communication"])
    return (
        f"Dear Hiring Manager,\n\n"
        f"I am excited to apply for the {role} opportunity. My background includes {top_skills}, "
        f"and I have a strong bias toward shipping tools that make complex workflows simple for users.\n\n"
        f"I would bring a mix of execution speed, product thinking, and technical rigor to your team. "
        f"Please consider my application for a conversation.\n\n"
        f"Regards,\nCandidate"
    )


def interview_questions(resume_text: str, job_description: str = "") -> dict[str, list[str]]:
    skills = detect_skills(f"{resume_text}\n{job_description}")
    primary = skills[:5] or ["problem solving", "system design"]
    role = infer_role(resume_text, job_description)
    return {
        "hr_questions": [
            f"Tell me about a project where you used {primary[0]}.",
            "What kind of team environment helps you do your best work?",
            "Describe a time you handled changing requirements.",
        ],
        "technical_questions": [
            f"How would you design and test a production feature that uses {skill}?" for skill in primary[:3]
        ],
        "coding_questions": [
            "Write a function that ranks candidates by weighted skills and experience.",
            "How would you optimize text matching for resume-to-job description similarity?",
        ],
        "behavioral_questions": [
            "Tell me about a difficult bug you diagnosed.",
            "Describe a time you improved a process for your team.",
            f"What makes you a strong fit for a {role} role?",
        ],
    }


def career_advice(question: str, resume_text: str = "", job_description: str = "") -> str:
    q = question.lower()
    skills = detect_skills(f"{resume_text}\n{job_description}")
    if "project" in q:
        missing = [skill for skill in ["Docker", "AWS", "React", "LangChain"] if skill not in skills]
        return (
            "Build a project that closes a visible gap in your stack. "
            f"For example, pair {', '.join(missing[:2] or ['LLM orchestration', 'APIs'])} with a clear user workflow, "
            "a dashboard, and measurable outcomes."
        )
    if "certification" in q or "certification" in question.lower():
        return (
            "Choose a certification that supports the direction of your portfolio. "
            f"Given your current profile, the highest-leverage options are: {', '.join(skills[:3] or ['cloud fundamentals', 'system design', 'data literacy'])}."
        )
    if "google" in q or "ready" in q:
        return (
            "You are ready when your resume shows repeated depth in one domain, clean projects, and evidence of ownership. "
            "If those are weak, add one flagship project, strengthen metrics, and practice coding plus system design interviews."
        )
    return (
        "Focus on one portfolio story that proves you can solve a real problem end-to-end. "
        "Strong candidates demonstrate scope, tradeoffs, and measurable results, not just tools."
    )


def role_resume_version(role: str, resume_text: str) -> dict[str, Any]:
    profile = ROLE_PROFILES.get(role, ROLE_PROFILES["AI Engineer"])
    base_skills = detect_skills(resume_text)
    return {
        "role": role,
        "summary": profile["summary"],
        "experience": profile["projects"],
        "skills": sorted(set(base_skills + profile["skills"]))[:10],
    }


def parse_jd(job_description: str) -> dict[str, Any]:
    skills = detect_skills(job_description)
    keywords = extract_keywords(job_description, 10)
    experience = []
    lower = job_description.lower()
    if "years" in lower:
        match = re.search(r"(\d+)\+?\s+years?", lower)
        if match:
            experience.append(f"{match.group(1)}+ years of experience")
    if "degree" in lower or "bachelor" in lower:
        experience.append("Bachelor's degree or equivalent")
    responsibilities = []
    for sentence in re.split(r"(?<=[.!?])\s+", job_description.strip()):
        if any(word in sentence.lower() for word in ["build", "design", "maintain", "develop", "own", "implement"]):
            responsibilities.append(sentence.strip())
    if not responsibilities:
        responsibilities = [
            "Own the end-to-end delivery of product features.",
            "Collaborate with cross-functional stakeholders.",
            "Write maintainable and testable code.",
        ]
    return {
        "skills": skills,
        "experience": experience or ["2+ years of relevant experience"],
        "degree": "Bachelor's degree preferred" if ("degree" in lower or "bachelor" in lower) else "Not specified",
        "keywords": keywords,
        "responsibilities": responsibilities[:5],
    }


def project_evaluation(project_text: str) -> dict[str, Any]:
    lower = project_text.lower()
    score = 35
    reasons: list[str] = []
    if any(term in lower for term in ["rag", "llm", "vector", "embedding", "semantic"]):
        score += 25
        reasons.append("Uses modern AI retrieval or generation concepts.")
    if any(term in lower for term in ["fastapi", "django", "express", "api"]):
        score += 15
        reasons.append("Shows backend architecture and integration depth.")
    if any(term in lower for term in ["docker", "aws", "kubernetes", "deployment"]):
        score += 10
        reasons.append("Includes production-oriented delivery details.")
    if any(term in lower for term in ["dashboard", "analytics", "metric", "visualization"]):
        score += 10
        reasons.append("Demonstrates product and business impact.")
    if any(term in lower for term in ["clone", "todo", "weather app"]):
        score -= 12
        reasons.append("Looks like a common tutorial project.")
    if len(project_text.split()) > 40:
        score += 5
    score = max(0, min(100, score))
    if score >= 80:
        tier = "High"
    elif score >= 55:
        tier = "Medium"
    else:
        tier = "Low"
    if not reasons:
        reasons = ["Project is understandable, but the differentiation is not obvious."]
    return {"score": score, "tier": tier, "reasons": reasons}


def fraud_detection(resume_text: str) -> dict[str, Any]:
    lower = resume_text.lower()
    flags = []
    if lower.count("intern") > 4:
        flags.append("Possible keyword stuffing around internships.")
    if lower.count("developed") > 8 or lower.count("built") > 8:
        flags.append("Repeated verbs may indicate template reuse.")
    if "github.com" not in lower and "portfolio" not in lower and len(resume_text.split()) > 300:
        flags.append("Long resume without supporting links can look overstated.")
    if any(phrase in lower for phrase in ["managed a team of 100", "led 50 engineers"]):
        flags.append("Large scale claims should be verified.")
    return {"risk": "Low" if not flags else "Moderate", "flags": flags or ["No obvious fraud signals detected."]}


def auto_evaluation(answers: list[str]) -> dict[str, Any]:
    combined = " ".join(answers).lower()
    positive = sum(term in combined for term in ["python", "sql", "api", "test", "optimize", "design"])
    score = min(100, 40 + positive * 10 + min(20, len(answers) * 5))
    return {
        "score": score,
        "status": "Passed" if score >= 70 else "Needs Review",
        "feedback": [
            "Use more concrete terms and include steps or tradeoffs." if score < 70 else "Answers are strong enough to advance.",
            "Add examples where you measured impact.",
        ],
    }


def interview_slots(score: int) -> dict[str, Any]:
    if score <= 80:
        return {"eligible": False, "message": "Score must be above 80 to trigger scheduling."}
    return {
        "eligible": True,
        "message": "Interview slot options prepared and ready to send.",
        "slots": ["Mon 10:00", "Tue 14:30", "Wed 09:00"],
    }


@app.get("/", response_class=HTMLResponse)
def index() -> HTMLResponse:
    template_path = TEMPLATES_DIR / "index.html"
    if template_path.exists():
        return HTMLResponse(template_path.read_text(encoding="utf-8"))
    return HTMLResponse("<h1>HireFlow AI</h1>")


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/resume/analyze")
def api_resume_analyze(payload: ResumeInput) -> dict[str, Any]:
    analysis = ats_score(payload.resume_text, payload.job_description)
    analysis["summary"] = (
        "The resume is well aligned for screening." if analysis["ats_score"] >= 80 else "The resume needs tighter keyword alignment and clearer achievement language."
    )
    return analysis


@app.post("/api/resume/match")
def api_resume_match(payload: ResumeInput) -> dict[str, Any]:
    analysis = ats_score(payload.resume_text, payload.job_description)
    match_score = analysis["ats_score"]
    return {
        "match_score": f"{match_score}%",
        "skills_match": analysis["matched_skills"],
        "missing_skills": analysis["missing_skills"],
        "recommendation": "Strong match" if match_score >= 85 else "Promising" if match_score >= 70 else "Needs tailoring",
    }


@app.post("/api/resume/improve")
def api_resume_improve(payload: ResumeInput) -> dict[str, Any]:
    return build_improvement_bundle(payload.resume_text, payload.job_description, payload.target_role)


@app.post("/api/resume/cover-letter")
def api_cover_letter(payload: ResumeInput) -> dict[str, str]:
    return {"cover_letter": generate_cover_letter(payload.resume_text, payload.job_description)}


@app.post("/api/resume/interview-prep")
def api_interview_prep(payload: ResumeInput) -> dict[str, list[str]]:
    return interview_questions(payload.resume_text, payload.job_description)


@app.post("/api/career-advisor")
def api_career_advisor(payload: CareerQuestionInput) -> dict[str, str]:
    return {"answer": career_advice(payload.question, payload.resume_text, payload.job_description)}


@app.get("/api/resume/versions")
def api_resume_versions(resume_text: str = "") -> dict[str, Any]:
    return {
        role: role_resume_version(role, resume_text)
        for role in ROLE_PROFILES
    }


@app.post("/api/hr/parse-jd")
def api_parse_jd(payload: JobDescriptionInput) -> dict[str, Any]:
    return parse_jd(payload.job_description)


@app.post("/api/hr/screen")
def api_hr_screen(payload: ResumeInput) -> dict[str, Any]:
    analysis = ats_score(payload.resume_text, payload.job_description)
    project = project_evaluation(payload.resume_text)
    fraud = fraud_detection(payload.resume_text)
    return {
        "candidate": "John",
        "ats": f'{analysis["ats_score"]}%',
        "skill_match": f'{min(100, analysis["ats_score"] - 3)}%',
        "projects": project["tier"],
        "experience": "Relevant" if len(detect_skills(payload.resume_text)) >= 3 else "Limited",
        "education": "Good",
        "recommendation": "Strong Hire" if analysis["ats_score"] >= 85 else "Interview" if analysis["ats_score"] >= 70 else "Reject",
        "flags": fraud["flags"],
    }


@app.post("/api/hr/rank")
def api_rank_candidates(payload: CandidateBatchInput) -> dict[str, Any]:
    ranked = []
    for candidate in payload.candidates:
        text = candidate.get("resume_text", "")
        name = candidate.get("name", "Candidate")
        analysis = ats_score(text, payload.job_description)
        project = project_evaluation(text)
        total = min(100, round(analysis["ats_score"] * 0.65 + project["score"] * 0.35))
        ranked.append(
            {
                "name": name,
                "score": total,
                "ats": analysis["ats_score"],
                "skill_match": len(analysis["matched_skills"]),
                "projects": project["tier"],
            }
        )
    ranked.sort(key=lambda item: item["score"], reverse=True)
    return {"ranked": ranked}


@app.post("/api/hr/assessment")
def api_assessment(payload: AssessmentInput) -> dict[str, Any]:
    topic = payload.topic.strip().title()
    count = 20 if topic.lower() == "python" else 15 if topic.lower() == "react" else 10
    questions = [
        f"{topic} question {i + 1}: Explain a practical concept at {payload.skill_level} level."
        for i in range(count)
    ]
    return {"topic": topic, "count": count, "questions": questions}


@app.post("/api/hr/evaluate-assessment")
def api_evaluate_assessment(payload: AssessmentInput) -> dict[str, Any]:
    return auto_evaluation(payload.candidate_answers)


@app.post("/api/hr/schedule-interview")
def api_schedule_interview(payload: dict[str, Any]) -> dict[str, Any]:
    score = int(payload.get("score", 0))
    return interview_slots(score)


@app.post("/api/hr/chat")
def api_hr_chat(payload: ChatInput) -> dict[str, Any]:
    message = payload.message.lower()
    if "python" in message and "react" in message and "docker" in message:
        return {
            "answer": "Top candidates are those whose resumes show at least two of Python, React, and Docker, plus one production project and measurable impact.",
        }
    if "shortlist" in message:
        return {
            "answer": "Shortlisting is based on ATS score, skill match, project complexity, and whether the resume shows real delivery rather than keyword repetition.",
        }
    if "experience" in message:
        return {
            "answer": "Look for repeated ownership patterns, production context, and tools used to ship work, not just a total number of years.",
        }
    return {
        "answer": "Ask for candidate names, skills, or screening criteria and I can summarize the strongest matches.",
    }


@app.get("/api/hr/dashboard")
def api_dashboard() -> dict[str, Any]:
    pipeline = PIPELINE_COUNTS.copy()
    shortlist_rate = round(pipeline["shortlisted"] / pipeline["total"] * 100, 1)
    return {
        "applications": pipeline,
        "shortlist_rate": shortlist_rate,
        "skills_distribution": [
            {"label": "Python", "value": 92},
            {"label": "SQL", "value": 77},
            {"label": "React", "value": 64},
            {"label": "Docker", "value": 51},
            {"label": "AWS", "value": 44},
        ],
        "funnel": [
            {"label": "Applied", "value": 327},
            {"label": "Screened", "value": 188},
            {"label": "Shortlisted", "value": 58},
            {"label": "Interviewed", "value": 31},
            {"label": "Offered", "value": 12},
        ],
        "top_colleges": [
            {"label": "University of Adelaide", "value": 18},
            {"label": "Monash University", "value": 16},
            {"label": "University of Melbourne", "value": 15},
            {"label": "UNSW", "value": 13},
        ],
        "experience_distribution": [
            {"label": "0-2", "value": 41},
            {"label": "3-5", "value": 93},
            {"label": "6-8", "value": 54},
            {"label": "8+", "value": 17},
        ],
        "sample_candidates": SAMPLE_CANDIDATES,
    }


@app.get("/api/analytics")
def api_analytics() -> dict[str, Any]:
    return {
        "avg_ats": 84.2,
        "skills_distribution": [
            {"label": "Python", "value": 92},
            {"label": "React", "value": 64},
            {"label": "SQL", "value": 77},
            {"label": "FastAPI", "value": 58},
            {"label": "LangChain", "value": 49},
        ],
        "pipeline": [
            {"label": "Applications", "value": 327},
            {"label": "Shortlisted", "value": 58},
            {"label": "Rejected", "value": 190},
            {"label": "Pending", "value": 79},
        ],
    }


@app.exception_handler(Exception)
def generic_exception_handler(_request: Any, exc: Exception) -> JSONResponse:
    return JSONResponse({"detail": str(exc)}, status_code=500)
