from __future__ import annotations

from typing import Any

from fastapi import APIRouter

from backend.schemas import CareerQuestionInput, ResumeInput
from backend.services.resume import (
    ats_score,
    build_improvement_bundle,
    career_advice,
    generate_cover_letter,
    interview_questions,
    role_resume_version,
)

router = APIRouter()


@router.post("/api/resume/analyze")
def api_resume_analyze(payload: ResumeInput) -> dict[str, Any]:
    analysis = ats_score(payload.resume_text, payload.job_description)
    analysis["summary"] = (
        "The resume is well aligned for screening." if analysis["ats_score"] >= 80 else "The resume needs tighter keyword alignment and clearer achievement language."
    )
    return analysis


@router.post("/api/resume/match")
def api_resume_match(payload: ResumeInput) -> dict[str, Any]:
    analysis = ats_score(payload.resume_text, payload.job_description)
    match_score = analysis["ats_score"]
    return {
        "match_score": f"{match_score}%",
        "skills_match": analysis["matched_skills"],
        "missing_skills": analysis["missing_skills"],
        "recommendation": "Strong match" if match_score >= 85 else "Promising" if match_score >= 70 else "Needs tailoring",
    }


@router.post("/api/resume/improve")
def api_resume_improve(payload: ResumeInput) -> dict[str, Any]:
    return build_improvement_bundle(payload.resume_text, payload.job_description, payload.target_role)


@router.post("/api/resume/cover-letter")
def api_cover_letter(payload: ResumeInput) -> dict[str, str]:
    return {"cover_letter": generate_cover_letter(payload.resume_text, payload.job_description)}


@router.post("/api/resume/interview-prep")
def api_interview_prep(payload: ResumeInput) -> dict[str, list[str]]:
    return interview_questions(payload.resume_text, payload.job_description)


@router.post("/api/career-advisor")
def api_career_advisor(payload: CareerQuestionInput) -> dict[str, str]:
    return {"answer": career_advice(payload.question, payload.resume_text, payload.job_description)}


@router.get("/api/resume/versions")
def api_resume_versions(resume_text: str = "") -> dict[str, Any]:
    roles = ["Data Scientist", "Frontend Engineer", "AI Engineer", "Backend Engineer"]
    return {role: role_resume_version(role, resume_text) for role in roles}

