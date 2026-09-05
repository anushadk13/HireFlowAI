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


COVER_LETTER_PROMPT_TEMPLATE = """You are an expert career coach and copywriter helping me write a highly targeted, natural-sounding cover letter. Do not write a generic letter — follow the process below exactly.

Step 1 — Analyze the job posting
Read the job description and identify:
- The 2–3 real priorities/problems this role exists to solve (not just the listed skills)
- The tone of the company (formal, startup-casual, technical, mission-driven, etc.)
- Any specific product, initiative, or challenge mentioned that I could reference

Step 2 — Analyze my resume
Read my resume and identify:
- The 2–3 achievements most relevant to the priorities from Step 1
- Concrete metrics or outcomes I can cite as evidence (not vague adjectives)
- Any potential gap, transition, or mismatch I should address briefly and confidently

Step 3 — Write the cover letter
Using what you found in Steps 1–2, write a cover letter that:
1. Opens with a hook — a specific accomplishment, sharp observation about the company, or relevant connection. No "I am writing to apply for..."
2. Matches my story to their problem — 2–3 achievements mapped directly to the role's real priorities, with concrete evidence, not generic claims
3. Shows understanding of their context — one paragraph connecting my experience to their specific situation, challenge, or stated values
4. Closes with confidence — states why I want this role/company plainly, invites next steps, no begging or over-apologizing
5. Is 250–350 words total
6. Uses plain, human language — no corporate jargon or clichés ("team player," "go-getter," "synergy," "passionate")
7. Matches the tone of the job posting (formal vs. casual)
8. Reads like something I would actually say out loud, not a template with the company name swapped in

Step 4 — Show your work
Before the final letter, briefly list (2–3 bullets) which priorities you identified in the job posting and which resume achievements you matched to them. This helps me verify it's targeted, not generic.

Output format:
1. Brief analysis (bullets, from Step 4)
2. The final cover letter (no headers, ready to copy/paste)

### JOB DESCRIPTION:
{job_description}

### MY RESUME:
{resume_text}

### ADDITIONAL CONTEXT (optional):
{additional_context}
"""


def generate_cover_letter(resume_text: str, job_description: str = "", additional_context: str = "") -> str:
    role = infer_role(resume_text, job_description)
    detected_skills = detect_skills(resume_text)
    jd_skills = detect_skills(job_description)
    matched_skills = [s for s in detected_skills if s.lower() in [j.lower() for j in jd_skills]]
    top_skills = matched_skills[:4] if matched_skills else detected_skills[:4] or ["Python", "FastAPI", "React", "Cloud Architecture"]

    primary_skills_str = ", ".join(top_skills)

    priority_bullets = [
        f"Priority Identified: Delivering scalable {role} solutions using {top_skills[0] if top_skills else 'high performance software'} -> Matched Achievement: Developed production-ready features with proven optimization and reliability.",
        f"Priority Identified: Workflow automation & candidate execution -> Matched Achievement: Applied {top_skills[1] if len(top_skills) > 1 else 'clean architecture'} to reduce manual processing overhead by over 35%.",
        f"Priority Identified: Technical problem solving and product delivery -> Matched Achievement: Built end-to-end systems utilizing {primary_skills_str}.",
    ]

    if additional_context and additional_context.strip():
        priority_bullets.append(f"Additional Context Incorporated: {additional_context.strip()}")

    analysis_section = "Targeted Analysis:\n" + "\n".join(f"• {b}" for b in priority_bullets)

    letter_body = (
        f"Building reliable, intuitive software that directly addresses core business challenges is what drives my work. "
        f"Having developed robust applications using {primary_skills_str}, I have consistently focused on turning technical goals into measurable user impact.\n\n"
        f"In my recent projects, I designed and deployed scalable backend services and responsive frontend interfaces that streamlined data processing, "
        f"improving workflow efficiency by over 35%. My experience aligns closely with your team's current technical priorities—especially in building clean, maintainable systems that scale seamlessly.\n\n"
        f"What excites me most about the {role} position is your focus on thoughtful engineering and high-performance delivery. "
        f"I bring a combination of rapid execution, system design fundamentals, and user-centric problem solving.\n\n"
        f"I look forward to discussing how my experience with {top_skills[0] if top_skills else 'software engineering'} can support your upcoming goals."
    )

    return f"{analysis_section}\n\nDear Hiring Manager,\n\n{letter_body}\n\nSincerely,\nCandidate"


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
