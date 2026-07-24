from __future__ import annotations

import re
from typing import Any

from backend.services.data import PIPELINE_COUNTS, SAMPLE_CANDIDATES
from backend.services.resume import ats_score
from backend.services.text_utils import detect_skills, extract_keywords


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
