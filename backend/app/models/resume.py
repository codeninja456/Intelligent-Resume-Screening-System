from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class EducationItem(BaseModel):
    degree: str
    institution: str
    year: str

class ExperienceItem(BaseModel):
    company: str
    role: str
    duration_months: int
    duration_str: Optional[str] = None
    description: Optional[str] = None

class ParsedResumeProfile(BaseModel):
    name: str
    email: str
    phone: str
    skills: List[str] = []
    experience: List[ExperienceItem] = []
    education: List[EducationItem] = []
    certifications: List[str] = []

class ResumeResponse(BaseModel):
    id: str
    candidate_id: str
    file_name: str
    parsed_data: ParsedResumeProfile
    skills_count: int
    total_experience_months: int
    uploaded_at: datetime

    class Config:
        from_attributes = True

class ResumeUpdateRequest(BaseModel):
    parsed_data: ParsedResumeProfile
