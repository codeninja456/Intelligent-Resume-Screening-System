from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class JobCreate(BaseModel):
    title: str = Field(..., min_length=2)
    description: str = Field(..., min_length=10)
    required_skills: List[str] = []
    experience_level: str = Field(..., pattern="^(Entry|Mid|Senior)$")
    required_experience_months: int = Field(0, ge=0)
    education_level: str = Field("Any", pattern="^(Any|Bachelor|Master|PhD)$")
    location: str
    salary_range: Optional[str] = None

class JobResponse(BaseModel):
    id: str
    employer_id: str
    title: str
    description: str
    required_skills: List[str]
    experience_level: str
    required_experience_months: int
    education_level: str
    location: str
    salary_range: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class MatchBreakdown(BaseModel):
    skills: str
    experience: str
    education: str
    summary: str

class JobApplicationCreate(BaseModel):
    job_id: str

class ApplicationResponse(BaseModel):
    id: str
    job_id: str
    candidate_id: str
    applied_at: datetime
    status: str
    match_score: float
    match_breakdown: MatchBreakdown
    candidate_name: Optional[str] = None
    job_title: Optional[str] = None

    class Config:
        from_attributes = True
