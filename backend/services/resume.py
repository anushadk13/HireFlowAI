from __future__ import annotations

import math
from typing import Any

from backend.services.data import ROLE_PROFILES
from backend.services.text_utils import (
    count_bullets,
    detect_skills,
    detect_weak_bullets,
    extract_keywords,
    formatting_suggestions,
    grammar_notes,
)


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
