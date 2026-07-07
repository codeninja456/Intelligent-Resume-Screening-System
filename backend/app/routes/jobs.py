from fastapi import APIRouter, Depends, HTTPException, status, Query
from bson import ObjectId
from datetime import datetime
from typing import List, Optional
import logging

from app.auth import get_current_user, require_role
from app.database import get_db
from app.models.job import JobCreate, JobResponse, ApplicationResponse
from app.matching import compute_match

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/jobs", tags=["Jobs"])

@router.post("/", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
def create_job(
    job_data: JobCreate,
    current_user: dict = Depends(require_role("employer"))
):
    db = get_db()
    
    # Standardize required skills to lowercase
    skills_lower = [s.lower().strip() for s in job_data.required_skills]
    
    job_doc = {
        "employer_id": ObjectId(current_user["id"]),
        "title": job_data.title,
        "description": job_data.description,
        "required_skills": skills_lower,
        "experience_level": job_data.experience_level,
        "required_experience_months": job_data.required_experience_months,
        "education_level": job_data.education_level,
        "location": job_data.location,
        "salary_range": job_data.salary_range,
        "created_at": datetime.utcnow()
    }
    
    result = db.jobs.insert_one(job_doc)
    job_doc["id"] = str(result.inserted_id)
    job_doc["employer_id"] = str(job_doc["employer_id"])
    return job_doc

@router.get("/", response_model=List[JobResponse])
def get_jobs(
    skill: Optional[str] = None,
    location: Optional[str] = None,
    experience_level: Optional[str] = None,
    query: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    filter_query = {}
    
    # Filter by skill
    if skill:
        filter_query["required_skills"] = skill.lower().strip()
        
    # Filter by location
    if location:
        filter_query["location"] = {"$regex": location, "$options": "i"}
        
    # Filter by experience level
    if experience_level:
        filter_query["experience_level"] = experience_level
        
    # Search title/desc
    if query:
        filter_query["$or"] = [
            {"title": {"$regex": query, "$options": "i"}},
            {"description": {"$regex": query, "$options": "i"}}
        ]
        
    # If the user is an employer, they might want to see only their own posted jobs
    # But for default search, return all jobs. Let's add a "my_listings" filter if wanted,
    # or just return all jobs for candidates and general search.
    
    jobs = list(db.jobs.find(filter_query).sort("created_at", -1))
    
    for job in jobs:
        job["id"] = str(job["_id"])
        job["employer_id"] = str(job["employer_id"])
        
    return jobs

@router.get("/{job_id}", response_model=JobResponse)
def get_job_by_id(job_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
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
        
    job["id"] = str(job["_id"])
    job["employer_id"] = str(job["employer_id"])
    return job

@router.put("/{job_id}", response_model=JobResponse)
def update_job(
    job_id: str,
    job_data: JobCreate,
    current_user: dict = Depends(require_role("employer"))
):
    db = get_db()
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
        
    if str(job["employer_id"]) != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to update this job listing"
        )
        
    skills_lower = [s.lower().strip() for s in job_data.required_skills]
    
    db.jobs.update_one(
        {"_id": ObjectId(job_id)},
        {
            "$set": {
                "title": job_data.title,
                "description": job_data.description,
                "required_skills": skills_lower,
                "experience_level": job_data.experience_level,
                "required_experience_months": job_data.required_experience_months,
                "education_level": job_data.education_level,
                "location": job_data.location,
                "salary_range": job_data.salary_range,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    updated_job = db.jobs.find_one({"_id": ObjectId(job_id)})
    updated_job["id"] = str(updated_job["_id"])
    updated_job["employer_id"] = str(updated_job["employer_id"])
    return updated_job

@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job(
    job_id: str,
    current_user: dict = Depends(require_role("employer"))
):
    db = get_db()
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
        
    if str(job["employer_id"]) != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to delete this job listing"
        )
        
    db.jobs.delete_one({"_id": ObjectId(job_id)})
    # Clean up applications
    db.applications.delete_many({"job_id": ObjectId(job_id)})
    return None

@router.post("/{job_id}/apply", response_model=ApplicationResponse)
def apply_to_job(
    job_id: str,
    current_user: dict = Depends(require_role("candidate"))
):
    db = get_db()
    candidate_id = current_user["id"]
    
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
        
    # 2. Check if already applied
    existing_app = db.applications.find_one({
        "job_id": ObjectId(job_id),
        "candidate_id": ObjectId(candidate_id)
    })
    if existing_app:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already applied to this job listing"
        )
        
    # 3. Get candidate resume
    resume = db.resumes.find_one({"candidate_id": ObjectId(candidate_id)})
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please upload your resume before applying to jobs"
        )
        
    # 4. Calculate Match Score
    match_result = compute_match(resume["parsed_data"], job)
    
    # 5. Save Application
    app_doc = {
        "job_id": ObjectId(job_id),
        "candidate_id": ObjectId(candidate_id),
        "applied_at": datetime.utcnow(),
        "status": "applied",
        "match_score": match_result["score"],
        "match_breakdown": {
            "skills": match_result["breakdown"]["skills"],
            "experience": match_result["breakdown"]["experience"],
            "education": match_result["breakdown"]["education"],
            "summary": match_result["breakdown"]["summary"]
        }
    }
    
    result = db.applications.insert_one(app_doc)
    
    app_doc["id"] = str(result.inserted_id)
    app_doc["job_id"] = str(app_doc["job_id"])
    app_doc["candidate_id"] = str(app_doc["candidate_id"])
    app_doc["candidate_name"] = current_user["name"]
    app_doc["job_title"] = job["title"]
    
    return app_doc

@router.get("/{job_id}/applicants", response_model=List[ApplicationResponse])
def get_job_applicants(
    job_id: str,
    current_user: dict = Depends(require_role("employer"))
):
    db = get_db()
    
    # Fetch job first to ensure it exists and belongs to the logged-in employer
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
        
    if str(job["employer_id"]) != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to view applicants for this job"
        )
        
    # Fetch applications ranked by match score
    apps = list(db.applications.find({"job_id": ObjectId(job_id)}).sort("match_score", -1))
    
    result_list = []
    for app in apps:
        # Get candidate name
        cand = db.users.find_one({"_id": app["candidate_id"]})
        candidate_name = cand["name"] if cand else "Unknown Candidate"
        
        # Get resume id to link if needed
        resume = db.resumes.find_one({"candidate_id": app["candidate_id"]})
        resume_id = str(resume["_id"]) if resume else None
        
        app_item = {
            "id": str(app["_id"]),
            "job_id": str(app["job_id"]),
            "candidate_id": str(app["candidate_id"]),
            "applied_at": app["applied_at"],
            "status": app["status"],
            "match_score": app["match_score"],
            "match_breakdown": app["match_breakdown"],
            "candidate_name": candidate_name,
            "job_title": job["title"]
        }
        
        # Attach resume_id as custom field if we want to link from UI
        if resume_id:
            app_item["resume_id"] = resume_id
            
        result_list.append(app_item)
        
    return result_list

@router.get("/applications/my", response_model=List[ApplicationResponse])
def get_my_applications(
    current_user: dict = Depends(require_role("candidate"))
):
    db = get_db()
    candidate_id = current_user["id"]
    
    apps = list(db.applications.find({"candidate_id": ObjectId(candidate_id)}).sort("applied_at", -1))
    
    result_list = []
    for app in apps:
        job = db.jobs.find_one({"_id": app["job_id"]})
        job_title = job["title"] if job else "Unknown Job"
        
        result_list.append({
            "id": str(app["_id"]),
            "job_id": str(app["job_id"]),
            "candidate_id": str(app["candidate_id"]),
            "applied_at": app["applied_at"],
            "status": app["status"],
            "match_score": app["match_score"],
            "match_breakdown": app["match_breakdown"],
            "candidate_name": current_user["name"],
            "job_title": job_title
        })
        
    return result_list

