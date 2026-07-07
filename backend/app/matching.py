from typing import Dict, Any, List

EDUCATION_RANKS = {
    "any": 0,
    "bachelor": 1,
    "master": 2,
    "phd": 3
}

def get_education_rank(degree_name: str) -> int:
    deg_lower = degree_name.lower()
    if "ph" in deg_lower or "doctor" in deg_lower:
        return EDUCATION_RANKS["phd"]
    elif "master" in deg_lower or "m.s." in deg_lower or "m.a." in deg_lower or "ms" in deg_lower or "ma" in deg_lower or "mba" in deg_lower:
        return EDUCATION_RANKS["master"]
    elif "bachelor" in deg_lower or "b.s." in deg_lower or "b.a." in deg_lower or "bs" in deg_lower or "ba" in deg_lower or "b.tech" in deg_lower or "b.e." in deg_lower or "btech" in deg_lower:
        return EDUCATION_RANKS["bachelor"]
    return EDUCATION_RANKS["bachelor"]  # default rank if not clear

def get_candidate_highest_education(education_list: List[Dict[str, Any]]) -> tuple:
    if not education_list:
        return "Bachelor", EDUCATION_RANKS["bachelor"]
        
    highest_rank = -1
    highest_degree = "Bachelor"
    
    for ed in education_list:
        degree = ed.get("degree", "Bachelor")
        rank = get_education_rank(degree)
        if rank > highest_rank:
            highest_rank = rank
            highest_degree = degree
            
    return highest_degree, highest_rank

def compute_match(parsed_resume: Dict[str, Any], job_listing: Dict[str, Any]) -> Dict[str, Any]:
    # Extract values
    candidate_skills = [s.lower().strip() for s in parsed_resume.get("skills", [])]
    candidate_exp_months = parsed_resume.get("total_experience_months", 0)
    if candidate_exp_months == 0:
        # Sum experience durations if total_experience_months is not set directly
        candidate_exp_months = sum([job.get("duration_months", 0) for job in parsed_resume.get("experience", [])])
        
    candidate_edu = parsed_resume.get("education", [])
    
    job_required_skills = [s.lower().strip() for s in job_listing.get("required_skills", [])]
    job_required_exp_months = job_listing.get("required_experience_months", 0)
    job_required_edu = job_listing.get("education_level", "Any")
    
    # 1. Skills Scoring (60% weight)
    skills_score = 100.0
    skills_match_details = "No skills required."
    matched_skills = []
    missing_skills = []
    
    if job_required_skills:
        matched_skills = list(set(job_required_skills).intersection(set(candidate_skills)))
        missing_skills = list(set(job_required_skills) - set(candidate_skills))
        skills_score = (len(matched_skills) / len(job_required_skills)) * 100.0
        
        matched_str = ", ".join([s.title() for s in matched_skills]) if matched_skills else "None"
        missing_str = ", ".join([s.title() for s in missing_skills]) if missing_skills else "None"
        
        skills_match_details = (
            f"Matched: {matched_str} ({len(matched_skills)}/{len(job_required_skills)} required skills). "
            f"Missing: {missing_str}."
        )
        
    # 2. Experience Scoring (30% weight)
    exp_score = 100.0
    experience_match_details = "No experience required."
    
    if job_required_exp_months > 0:
        if candidate_exp_months >= job_required_exp_months:
            exp_score = 100.0
            surplus = candidate_exp_months - job_required_exp_months
            surplus_str = f" ({surplus / 12:.1f} years surplus)" if surplus > 0 else ""
            experience_match_details = (
                f"Candidate has {candidate_exp_months / 12:.1f} years. "
                f"Job requires {job_required_exp_months / 12:.1f} years{surplus_str}."
            )
        else:
            exp_score = (candidate_exp_months / job_required_exp_months) * 100.0
            gap = job_required_exp_months - candidate_exp_months
            experience_match_details = (
                f"Candidate has {candidate_exp_months / 12:.1f} years. "
                f"Job requires {job_required_exp_months / 12:.1f} years ({gap / 12:.1f} years gap)."
            )
    else:
        experience_match_details = f"Candidate has {candidate_exp_months / 12:.1f} years. Job requires 0 years."
        
    # 3. Education Scoring (10% weight)
    edu_score = 100.0
    education_match_details = "No education requirement specified."
    
    job_edu_rank = EDUCATION_RANKS.get(job_required_edu.lower(), 0)
    cand_highest_degree, cand_edu_rank = get_candidate_highest_education(candidate_edu)
    
    if job_edu_rank > 0:
        if cand_edu_rank >= job_edu_rank:
            edu_score = 100.0
            education_match_details = (
                f"Candidate has {cand_highest_degree} (meets or exceeds required {job_required_edu})."
            )
        elif cand_edu_rank == job_edu_rank - 1:
            edu_score = 50.0
            education_match_details = (
                f"Candidate has {cand_highest_degree} (one level below required {job_required_edu})."
            )
        else:
            edu_score = 0.0
            education_match_details = (
                f"Candidate has {cand_highest_degree} (does not meet required {job_required_edu})."
            )
    else:
        education_match_details = f"Candidate has {cand_highest_degree} (Meets 'Any' education requirement)."
        
    # Weighted calculation
    final_score = (0.6 * skills_score) + (0.3 * exp_score) + (0.1 * edu_score)
    final_score = round(final_score, 1)
    
    # Heuristics for overall summary
    summary = f"Match Score: {final_score}%. "
    if final_score >= 80:
        summary += "Strong fit: Excellent skill overlap and meets experience requirements."
    elif final_score >= 50:
        summary += "Moderate fit: Partially matches required skills or has minor experience gaps."
    else:
        summary += "Low fit: Significant skill gap or lacks required experience."

    return {
        "score": final_score,
        "skills_score": round(skills_score, 1),
        "experience_score": round(exp_score, 1),
        "education_score": round(edu_score, 1),
        "breakdown": {
            "skills": skills_match_details,
            "experience": experience_match_details,
            "education": education_match_details,
            "summary": summary
        },
        "matched_skills": [s.title() for s in matched_skills],
        "missing_skills": [s.title() for s in missing_skills]
    }
