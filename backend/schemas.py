from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


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
    candidate_answers: list[str] = Field(default_factory=list)


class ChatInput(BaseModel):
    message: str
    skills: list[str] = Field(default_factory=list)

