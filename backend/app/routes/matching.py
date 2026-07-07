from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from typing import List, Dict, Any
import logging

from app.auth import get_current_user, require_role
from app.database import get_db
from app.matching import compute_match

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/matching", tags=["Matching"])

@router.get("/jobs")
def get_ranked_jobs_for_candidate(
    current_user: dict = Depends(require_role("candidate"))
):
    db = get_db()
    candidate_id = current_user["id"]
    
    # 1. Fetch Candidate's Resume
    resume = db.resumes.find_one({"candidate_id": ObjectId(candidate_id)})
    if not resume:
        # Return empty list or message indicating no resume uploaded yet
        return {
            "has_resume": False,
            "jobs": []
        }
        
    parsed_data = resume["parsed_data"]
    
    # 2. Fetch all jobs
    jobs = list(db.jobs.find({}))
    
    # 3. Calculate match score for each job
    ranked_jobs = []
    for job in jobs:
        match_result = compute_match(parsed_data, job)
        
        # Check if already applied
        applied = False
        app = db.applications.find_one({
            "job_id": job["_id"],
            "candidate_id": ObjectId(candidate_id)
        })
        if app:
            applied = True
            
        ranked_jobs.append({
            "job_id": str(job["_id"]),
            "title": job["title"],
            "description": job["description"],
            "required_skills": job["required_skills"],
            "experience_level": job["experience_level"],
            "required_experience_months": job["required_experience_months"],
            "education_level": job["education_level"],
            "location": job["location"],
            "salary_range": job["salary_range"],
            "match_score": match_result["score"],
            "match_breakdown": match_result["breakdown"],
            "matched_skills": match_result["matched_skills"],
            "missing_skills": match_result["missing_skills"],
            "applied": applied
        })
        
    # 4. Sort by score descending
    ranked_jobs.sort(key=lambda x: x["match_score"], reverse=True)
    
    return {
        "has_resume": True,
        "jobs": ranked_jobs
    }

@router.get("/candidates/{job_id}")
def get_ranked_candidates_for_job(
    job_id: str,
    current_user: dict = Depends(require_role("employer"))
):
    db = get_db()
    
    # 1. Fetch Job
    try:
        job = db.jobs.find_one({"_id": ObjectId(job_id)})
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid job ID format"
        )
        
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job listing not found"
        )
        
    # Check ownership
    if str(job["employer_id"]) != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to view candidate matches for this job"
        )
        
    # 2. Fetch all resumes
    resumes = list(db.resumes.find({}))
    
    # 3. Calculate match score for each candidate resume
    ranked_candidates = []
    for resume in resumes:
        match_result = compute_match(resume["parsed_data"], job)
        
        # Get candidate user name & details
        cand_user = db.users.find_one({"_id": resume["candidate_id"]})
        if not cand_user:
            continue
            
        # Check if they applied
        applied = False
        app = db.applications.find_one({
            "job_id": ObjectId(job_id),
            "candidate_id": resume["candidate_id"]
        })
        app_status = "Not Applied"
        if app:
            applied = True
            app_status = app.get("status", "applied")
            
        ranked_candidates.append({
            "candidate_id": str(resume["candidate_id"]),
            "resume_id": str(resume["_id"]),
            "name": resume["parsed_data"].get("name", cand_user.get("name")),
            "email": resume["parsed_data"].get("email", cand_user.get("email")),
            "phone": resume["parsed_data"].get("phone", ""),
            "skills": resume["parsed_data"].get("skills", []),
            "total_experience_months": resume.get("total_experience_months", 0),
            "match_score": match_result["score"],
            "match_breakdown": match_result["breakdown"],
            "matched_skills": match_result["matched_skills"],
            "missing_skills": match_result["missing_skills"],
            "applied": applied,
            "application_status": app_status
        })
        
    # 4. Sort by score descending
    ranked_candidates.sort(key=lambda x: x["match_score"], reverse=True)
    
    return ranked_candidates
