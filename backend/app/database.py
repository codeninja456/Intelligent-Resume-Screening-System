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
            }
        ]
        db.jobs.insert_many(mock_jobs)
        logger.info(f"Populated {len(mock_jobs)} mock jobs successfully.")
