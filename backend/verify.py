import sys
from app.parser import extract_skills, extract_experience, extract_education, extract_certifications
from app.matching import compute_match
from app.config import SKILLS_TAXONOMY

def test_resume_parser_algorithms():
    print("==================================================")
    print("Testing Resume Parser Algorithms...")
    print("==================================================")
    
    # Mock resume text
    mock_resume_text = """
    Saksh Kumar
    saksh@example.com | (555) 019-2834
    
    Professional Summary:
    Experienced Software Engineer with a passion for web application development and AI.
    
    Experience:
    Senior Software Engineer at Google Inc.
    Jan 2022 - Present
    - Developed high-scale microservices using Python, FastAPI, and Docker.
    - Worked on search backend integration and React UI.
    
    Software Developer at TechCorp Co.
    June 2020 - Dec 2021 (1.5 years)
    - Built REST APIs in Node.js and Express.
    - Managed data migrations using MongoDB and PostgreSQL databases.
    
    Education:
    Master of Science in Computer Science
    Stanford University, 2020
    
    Bachelor of Technology in Computer Science
    IIT Delhi, 2018
    
    Certifications:
    - AWS Certified Solutions Architect
    - Scrum Alliance Certified ScrumMaster
    """
    
    # 1. Test Skills Extraction
    print("\n--- 1. Testing Skills Extraction ---")
    skills = extract_skills(mock_resume_text, SKILLS_TAXONOMY)
    print(f"Extracted Skills: {skills}")
    expected_skills = ['python', 'fastapi', 'docker', 'react', 'node.js', 'express', 'mongodb', 'postgresql', 'git']
    # Check overlaps
    for exp in expected_skills:
        if exp in skills:
            print(f"  [PASS] Successfully extracted skill: {exp}")
        else:
            print(f"  [FAIL] Missed skill: {exp}")
            
    # 2. Test Experience Extraction
    print("\n--- 2. Testing Experience Extraction ---")
    experience_list, total_months = extract_experience(mock_resume_text)
    print(f"Total Experience Months: {total_months} ({total_months/12:.2f} years)")
    print("Experience Entries:")
    for exp in experience_list:
        print(f"  - Company: {exp['company']}, Role: {exp['role']}, Duration: {exp['duration_months']} months ({exp['duration_str']})")
        
    if total_months >= 36: # 2022-2026 (~4.5 years) + 1.5 years = ~6 years
        print("  [PASS] Total experience meets expectations.")
    else:
        print(f"  [WARNING] Total experience is lower than expected: {total_months} months.")
        
    # 3. Test Education Extraction
    print("\n--- 3. Testing Education Extraction ---")
    education_list = extract_education(mock_resume_text)
    print("Education Entries:")
    for edu in education_list:
        print(f"  - Degree: {edu['degree']}, Institution: {edu['institution']}, Year: {edu['year']}")
    
    has_ms = any("master" in e["degree"].lower() for e in education_list)
    if has_ms:
        print("  [PASS] Successfully extracted Master's degree.")
    else:
        print("  [FAIL] Master's degree not extracted.")
        
    # 4. Test Certifications Extraction
    print("\n--- 4. Testing Certifications Extraction ---")
    certs = extract_certifications(mock_resume_text)
    print(f"Extracted Certifications: {certs}")
    if any("aws" in c.lower() for c in certs):
         print("  [PASS] Successfully extracted AWS Certification.")
    else:
         print("  [FAIL] AWS Certification not extracted.")
         
    # 5. Test Matching Algorithm
    print("\n--- 5. Testing Matching Algorithm ---")
    mock_job = {
        "title": "Senior Backend Engineer (Python)",
        "required_skills": ["python", "fastapi", "docker", "aws", "kubernetes"],
        "required_experience_months": 48, # 4 years
        "education_level": "Bachelor"
    }
    
    parsed_resume = {
        "skills": skills,
        "total_experience_months": total_months,
        "experience": experience_list,
        "education": education_list,
        "certifications": certs
    }
    
    match_result = compute_match(parsed_resume, mock_job)
    print(f"Computed Match Score: {match_result['score']}%")
    print(f"Skills Score: {match_result['skills_score']}%")
    print(f"Experience Score: {match_result['experience_score']}%")
    print(f"Education Score: {match_result['education_score']}%")
    print(f"Summary: {match_result['breakdown']['summary']}")
    print(f"Skills breakdown: {match_result['breakdown']['skills']}")
    print(f"Experience breakdown: {match_result['breakdown']['experience']}")
    print(f"Education breakdown: {match_result['breakdown']['education']}")
    print("Matched Skills:", match_result["matched_skills"])
    print("Missing Skills:", match_result["missing_skills"])
    
    print("\n==================================================")
    print("Verification Finished.")
    print("==================================================")

if __name__ == "__main__":
    test_resume_parser_algorithms()
