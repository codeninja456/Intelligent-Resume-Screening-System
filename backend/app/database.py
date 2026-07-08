import logging
from pymongo import MongoClient
import mongomock
from app.config import MONGODB_URI, DATABASE_NAME

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

db_client = None
_db = None
is_mock = False

def init_db():
    global db_client, _db, is_mock
    try:
        logger.info(f"Attempting to connect to MongoDB at: {MONGODB_URI}")
        # Set a short timeout so we fall back quickly if not running
        client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=2000)
        # Trigger connection check
        client.server_info()
        db_client = client
        _db = client[DATABASE_NAME]
        is_mock = False
        logger.info("Successfully connected to real MongoDB instance.")
    except Exception as e:
        logger.warning(f"Failed to connect to MongoDB: {e}")
        logger.warning("Falling back to in-memory Mongomock database for session.")
        # Create an in-memory client
        db_client = mongomock.MongoClient()
        _db = db_client[DATABASE_NAME]
        is_mock = True
        
        # Populate some mock data if it's empty so the app has some jobs to match immediately!
        _populate_initial_mock_data(_db)

def get_db():
    global _db
    if _db is None:
        init_db()
    return _db

def _populate_initial_mock_data(db):
    # Populate a few initial jobs for demo purposes in mock mode
    if db.jobs.count_documents({}) == 0:
        logger.info("Populating initial mock jobs into the mongomock database...")
        mock_jobs = [
            {
                "title": "Full Stack React/Python Developer",
                "description": "We are looking for a skilled developer to work on our core platforms using FastAPI/Flask and React with Tailwind CSS. You will design backend services, parse resumes, and build beautiful frontends.",
                "required_skills": ["python", "react", "fastapi", "javascript", "tailwind", "mongodb"],
                "experience_level": "Mid",
                "required_experience_months": 24,
                "education_level": "Bachelor",
                "location": "Remote, US",
                "salary_range": "$90k - $120k",
                "created_at": "2026-07-07T00:00:00"
            },
            {
                "title": "Senior Data Scientist (NLP focus)",
                "description": "Join our AI research team. You will lead NLP efforts using spaCy, HuggingFace, and PyTorch. Experience with text analysis, information extraction, and parsing algorithms is a big plus.",
                "required_skills": ["python", "nlp", "spacy", "machine learning", "pytorch", "tensorflow"],
                "experience_level": "Senior",
                "required_experience_months": 60,
                "education_level": "Master",
                "location": "San Francisco, CA",
                "salary_range": "$150k - $180k",
                "created_at": "2026-07-07T00:00:00"
            },
            {
                "title": "Junior Backend Engineer (Node/Express)",
                "description": "Looking for an entry level backend dev to build REST APIs and manage MongoDB/Redis databases. Direct mentorship will be provided.",
                "required_skills": ["node.js", "express", "mongodb", "javascript", "git", "rest api"],
                "experience_level": "Entry",
                "required_experience_months": 12,
                "education_level": "Bachelor",
                "location": "New York, NY",
                "salary_range": "$70k - $85k",
                "created_at": "2026-07-07T00:00:00"
            },
            {
                "title": "Frontend Engineer (React/TypeScript)",
                "description": "Create high-performance user interfaces. You will develop React components using TypeScript, Tailwind CSS, and integrate them with REST APIs.",
                "required_skills": ["react", "typescript", "javascript", "tailwind", "git", "rest api"],
                "experience_level": "Mid",
                "required_experience_months": 36,
                "education_level": "Bachelor",
                "location": "Remote, US",
                "salary_range": "$95k - $115k",
                "created_at": "2026-07-07T01:00:00"
            },
            {
                "title": "DevOps & Cloud Engineer",
                "description": "Deploy, configure, and manage infrastructure in the cloud. Experience with AWS, Docker containerization, Kubernetes orchestration, and Terraform is key.",
                "required_skills": ["aws", "docker", "kubernetes", "terraform", "linux", "git", "ci/cd"],
                "experience_level": "Mid",
                "required_experience_months": 36,
                "education_level": "Bachelor",
                "location": "Austin, TX",
                "salary_range": "$110k - $135k",
                "created_at": "2026-07-07T01:00:00"
            },
            {
                "title": "Senior QA Automation Engineer",
                "description": "Lead testing automation efforts. Design regression and API automated tests using Python, Selenium, and CI/CD pipelines.",
                "required_skills": ["python", "git", "jenkins", "rest api", "teamwork", "ci/cd"],
                "experience_level": "Senior",
                "required_experience_months": 60,
                "education_level": "Bachelor",
                "location": "Seattle, WA",
                "salary_range": "$125k - $145k",
                "created_at": "2026-07-07T01:00:00"
            },
            {
                "title": "Agile Product Manager",
                "description": "Manage backlog, prioritize requirements, and direct engineering sprints. Experience with Agile, Scrum, and Jira is required.",
                "required_skills": ["project management", "product management", "agile", "scrum", "jira", "leadership"],
                "experience_level": "Mid",
                "required_experience_months": 24,
                "education_level": "Bachelor",
                "location": "Remote, US",
                "salary_range": "$100k - $125k",
                "created_at": "2026-07-07T01:00:00"
            },
            {
                "title": "iOS Mobile Developer",
                "description": "Build premium mobile applications for Apple iOS. Expertise in Swift, Git workflows, and object-oriented systems is essential.",
                "required_skills": ["swift", "git", "oop", "communication", "leadership"],
                "experience_level": "Mid",
                "required_experience_months": 36,
                "education_level": "Bachelor",
                "location": "Chicago, IL",
                "salary_range": "$115k - $130k",
                "created_at": "2026-07-07T01:00:00"
            },
            {
                "title": "Android Developer (Kotlin)",
                "description": "Build robust native Android apps. Deep knowledge of Kotlin, Java, and modern mobile app architecture components is required.",
                "required_skills": ["kotlin", "java", "git", "oop", "communication"],
                "experience_level": "Mid",
                "required_experience_months": 36,
                "education_level": "Bachelor",
                "location": "Remote, US",
                "salary_range": "$110k - $125k",
                "created_at": "2026-07-07T01:00:00"
            },
            {
                "title": "Cloud Solutions Architect",
                "description": "Design cloud systems, scale operations, and audit network security policies. Expertise in cloudpathlib, AWS, and system architectures.",
                "required_skills": ["aws", "docker", "kubernetes", "system design", "leadership"],
                "experience_level": "Senior",
                "required_experience_months": 72,
                "education_level": "Master",
                "location": "Boston, MA",
                "salary_range": "$160k - $190k",
                "created_at": "2026-07-07T01:00:00"
            },
            {
                "title": "Big Data Engineer",
                "description": "Manage raw data ingest, pipelines, and ETL processes. High proficiency in Python scripting, SQL query logic, Pandas, and NumPy.",
                "required_skills": ["python", "sql", "pandas", "numpy", "analytical skills"],
                "experience_level": "Mid",
                "required_experience_months": 48,
                "education_level": "Bachelor",
                "location": "Remote, US",
                "salary_range": "$115k - $140k",
                "created_at": "2026-07-07T01:00:00"
            },
            {
                "title": "Machine Learning Specialist",
                "description": "Implement cutting edge neural network architectures. Strong capabilities in TensorFlow, PyTorch, Deep Learning, and NLP parsing models.",
                "required_skills": ["python", "machine learning", "deep learning", "tensorflow", "pytorch", "nlp"],
                "experience_level": "Senior",
                "required_experience_months": 60,
                "education_level": "PhD",
                "location": "Pittsburgh, PA",
                "salary_range": "$170k - $210k",
                "created_at": "2026-07-07T01:00:00"
            },
            {
                "title": "Information Security Analyst",
                "description": "Monitor system vulnerabilities, audit container accesses, and harden OS permissions. Competency in Linux shells, Bash script, and Docker security.",
                "required_skills": ["linux", "bash", "docker", "git", "problem solving"],
                "experience_level": "Mid",
                "required_experience_months": 36,
                "education_level": "Bachelor",
                "location": "Remote, US",
                "salary_range": "$105k - $125k",
                "created_at": "2026-07-07T01:00:00"
            },
            {
                "title": "Golang Software Developer",
                "description": "Write high-performance microservices in Go. Knowledge of Golang primitives, Docker deployment, Kubernetes clusters, and REST web services.",
                "required_skills": ["go", "golang", "docker", "kubernetes", "rest api", "git"],
                "experience_level": "Mid",
                "required_experience_months": 24,
                "education_level": "Bachelor",
                "location": "Remote, US",
                "salary_range": "$115k - $135k",
                "created_at": "2026-07-07T01:00:00"
            },
            {
                "title": "PHP Laravel Developer",
                "description": "Design secure backend sites. Excellent capabilities in PHP backend frameworks, MySQL query optimization, Git versioning, and basic HTML/CSS integrations.",
                "required_skills": ["php", "mysql", "javascript", "git", "html", "css"],
                "experience_level": "Mid",
                "required_experience_months": 36,
                "education_level": "Bachelor",
                "location": "Miami, FL",
                "salary_range": "$80k - $95k",
                "created_at": "2026-07-07T01:00:00"
            },
            {
                "title": "C# .NET Software Engineer",
                "description": "Develop enterprise desktop and cloud structures. Deep knowledge of C#, Microsoft SQL database, REST APIs, and object-oriented programming (OOP).",
                "required_skills": ["c#", "sql", "rest api", "git", "oop"],
                "experience_level": "Mid",
                "required_experience_months": 36,
                "education_level": "Bachelor",
                "location": "Dallas, TX",
                "salary_range": "$100k - $120k",
                "created_at": "2026-07-07T01:00:00"
            },
            {
                "title": "Java Spring Boot Engineer",
                "description": "Design massive database-centric microservices in Java. Excellent Spring Boot, PostgreSQL database, Docker containerization, and Git competency.",
                "required_skills": ["java", "spring boot", "postgresql", "docker", "microservices", "git"],
                "experience_level": "Senior",
                "required_experience_months": 60,
                "education_level": "Bachelor",
                "location": "Remote, US",
                "salary_range": "$135k - $160k",
                "created_at": "2026-07-07T01:00:00"
            },
            {
                "title": "System Administrator",
                "description": "Maintain local and cloud web servers. Install, configure, and monitor NGINX and Apache web servers on Linux distributions via Bash automation.",
                "required_skills": ["linux", "bash", "nginx", "apache", "docker", "problem solving"],
                "experience_level": "Mid",
                "required_experience_months": 48,
                "education_level": "Bachelor",
                "location": "Remote, US",
                "salary_range": "$85k - $105k",
                "created_at": "2026-07-07T01:00:00"
            },
            {
                "title": "Technical Documentation Writer",
                "description": "Create readable API specifications, user handbooks, and documentation. Strong Markdown syntax, Git workflows, and technical communication skills.",
                "required_skills": ["communication", "git", "github", "teamwork"],
                "experience_level": "Entry",
                "required_experience_months": 12,
                "education_level": "Bachelor",
                "location": "Remote, US",
                "salary_range": "$60k - $75k",
                "created_at": "2026-07-07T01:00:00"
            },
            {
                "title": "Scrum Master & Agile Lead",
                "description": "Facilitate standups, remove engineering blockers, and maintain Kanban boards. Strong Jira skills, team communication, and Scrum master certified.",
                "required_skills": ["scrum", "agile", "kanban", "leadership", "jira", "communication"],
                "experience_level": "Mid",
                "required_experience_months": 36,
                "education_level": "Bachelor",
                "location": "Philadelphia, PA",
                "salary_range": "$95k - $115k",
                "created_at": "2026-07-07T01:00:00"
            },
            {
                "title": "Business Data Analyst",
                "description": "Mine database patterns and build analytical insights. Advanced SQL capabilities, Python script writing, Pandas operations, and visualization skills.",
                "required_skills": ["sql", "python", "pandas", "numpy", "analytical skills"],
                "experience_level": "Mid",
                "required_experience_months": 24,
                "education_level": "Bachelor",
                "location": "Remote, US",
                "salary_range": "$80k - $100k",
                "created_at": "2026-07-07T01:00:00"
            },
            {
                "title": "Site Reliability Engineer (SRE)",
                "description": "Optimize uptime and automate cloud server configurations. Strong AWS architecture, Docker, Terraform scripts, and NGINX servers.",
                "required_skills": ["aws", "docker", "terraform", "linux", "nginx", "python", "git"],
                "experience_level": "Senior",
                "required_experience_months": 60,
                "education_level": "Bachelor",
                "location": "San Francisco, CA",
                "salary_range": "$145k - $175k",
                "created_at": "2026-07-07T01:00:00"
            },
            {
                "title": "Systems Software Engineer (Rust)",
                "description": "Design high-performance systems utilities. Extensive systems software programming in Rust, Linux OS operations, and system architecture planning.",
                "required_skills": ["rust", "linux", "git", "system design", "oop", "problem solving"],
                "experience_level": "Mid",
                "required_experience_months": 36,
                "education_level": "Master",
                "location": "Remote, US",
                "salary_range": "$130k - $155k",
                "created_at": "2026-07-07T01:00:00"
            }
        ]
        db.jobs.insert_many(mock_jobs)
        logger.info(f"Populated {len(mock_jobs)} mock jobs successfully.")
