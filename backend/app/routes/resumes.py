from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from bson import ObjectId
from datetime import datetime
from typing import Dict, Any
import logging

from app.auth import get_current_user, require_role
from app.database import get_db
from app.config import SKILLS_TAXONOMY
from app.parser import parse_resume
from app.models.resume import ResumeResponse, ResumeUpdateRequest

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/resumes", tags=["Resumes"])

@router.post("/upload", response_model=ResumeResponse)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: dict = Depends(require_role("candidate"))
):
    # Validate extension
    file_name = file.filename
    if not (file_name.lower().endswith('.pdf') or file_name.lower().endswith('.docx')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Only PDF and DOCX files are allowed."
        )
        
    try:
        # Read content
        contents = await file.read()
        
        # Parse the resume
        parsed_result = parse_resume(contents, file_name, SKILLS_TAXONOMY)
        
        # Save to database
        db = get_db()
        candidate_id = current_user["id"]
        
        # Check if resume already exists for candidate
        existing_resume = db.resumes.find_one({"candidate_id": ObjectId(candidate_id)})
        
        resume_doc = {
            "candidate_id": ObjectId(candidate_id),
            "file_name": file_name,
            "file_content_type": file.content_type,
            "raw_text": parsed_result["raw_text"],
            "parsed_data": parsed_result["parsed_data"],
            "skills_count": parsed_result["skills_count"],
            "total_experience_months": parsed_result["total_experience_months"],
            "uploaded_at": datetime.utcnow()
        }
        
        if existing_resume:
            db.resumes.update_one(
                {"_id": existing_resume["_id"]},
                {"$set": resume_doc}
            )
            resume_doc["id"] = str(existing_resume["_id"])
        else:
            result = db.resumes.insert_one(resume_doc)
            resume_doc["id"] = str(result.inserted_id)
            
        # Convert ObjectId references for response validation
        resume_doc["candidate_id"] = str(resume_doc["candidate_id"])
        
        return resume_doc
    except Exception as e:
        logger.error(f"Error parsing/uploading resume: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while parsing the resume: {str(e)}"
        )

@router.get("/my-resume", response_model=ResumeResponse)
def get_my_resume(current_user: dict = Depends(require_role("candidate"))):
    db = get_db()
    candidate_id = current_user["id"]
    
    resume = db.resumes.find_one({"candidate_id": ObjectId(candidate_id)})
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No resume found. Please upload one."
        )
        
    resume["id"] = str(resume["_id"])
    resume["candidate_id"] = str(resume["candidate_id"])
    return resume

@router.put("/my-resume", response_model=ResumeResponse)
def update_my_resume(
    update_data: ResumeUpdateRequest,
    current_user: dict = Depends(require_role("candidate"))
):
    db = get_db()
    candidate_id = current_user["id"]
    
    resume = db.resumes.find_one({"candidate_id": ObjectId(candidate_id)})
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No resume exists to update. Please upload a resume first."
        )
        
    # Update parsed data fields
    updated_parsed = update_data.parsed_data.dict()
    
    # Calculate updated metrics
    skills_count = len(updated_parsed.get("skills", []))
    total_exp = sum([exp.get("duration_months", 0) for exp in updated_parsed.get("experience", [])])
    
    db.resumes.update_one(
        {"_id": resume["_id"]},
        {
            "$set": {
                "parsed_data": updated_parsed,
                "skills_count": skills_count,
                "total_experience_months": total_exp,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Reload and return
    updated_resume = db.resumes.find_one({"_id": resume["_id"]})
    updated_resume["id"] = str(updated_resume["_id"])
    updated_resume["candidate_id"] = str(updated_resume["candidate_id"])
    return updated_resume

@router.get("/{resume_id}", response_model=ResumeResponse)
def get_resume_by_id(
    resume_id: str,
    current_user: dict = Depends(get_current_user)
):
    # Only employers or the candidate owner can view a specific resume
    db = get_db()
    
    try:
        resume = db.resumes.find_one({"_id": ObjectId(resume_id)})
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid resume ID format"
        )
        
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found"
        )
        
    candidate_id_str = str(resume["candidate_id"])
    
    if current_user["role"] == "candidate" and current_user["id"] != candidate_id_str:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied."
        )
        
    resume["id"] = str(resume["_id"])
    resume["candidate_id"] = candidate_id_str
    return resume
