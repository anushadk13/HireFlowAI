from __future__ import annotations

from typing import Any

from fastapi import APIRouter

from backend.schemas import AssessmentInput, CandidateBatchInput, ChatInput, JobDescriptionInput, ResumeInput
from backend.services.hr import api_analytics, api_dashboard, auto_evaluation, fraud_detection, interview_slots, parse_jd, project_evaluation
from backend.services.resume import ats_score
from backend.services.text_utils import detect_skills

router = APIRouter()


@router.post("/api/hr/parse-jd")
def api_parse_jd(payload: JobDescriptionInput) -> dict[str, Any]:
    return parse_jd(payload.job_description)


@router.post("/api/hr/screen")
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


@router.post("/api/hr/rank")
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


@router.post("/api/hr/assessment")
def api_assessment(payload: AssessmentInput) -> dict[str, Any]:
    topic = payload.topic.strip().title()
    count = 20 if topic.lower() == "python" else 15 if topic.lower() == "react" else 10
    questions = [
        f"{topic} question {i + 1}: Explain a practical concept at {payload.skill_level} level."
        for i in range(count)
    ]
    return {"topic": topic, "count": count, "questions": questions}


@router.post("/api/hr/evaluate-assessment")
def api_evaluate_assessment(payload: AssessmentInput) -> dict[str, Any]:
    return auto_evaluation(payload.candidate_answers)


@router.post("/api/hr/schedule-interview")
def api_schedule_interview(payload: dict[str, Any]) -> dict[str, Any]:
    score = int(payload.get("score", 0))
    return interview_slots(score)


@router.post("/api/hr/chat")
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


@router.get("/api/hr/dashboard")
def api_dashboard_route() -> dict[str, Any]:
    return api_dashboard()


@router.get("/api/analytics")
def api_analytics_route() -> dict[str, Any]:
    return api_analytics()

