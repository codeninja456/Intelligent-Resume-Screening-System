from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.database import init_db
from app.routes import auth, resumes, jobs, matching

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Resume Parser & Job Matcher API",
    description="REST API for parsing PDF/DOCX resumes and bidirectionally matching candidates with jobs using NLP metrics.",
    version="1.0.0"
)

# Set up CORS middleware to allow connection from the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the exact domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on app startup
@app.on_event("startup")
def on_startup():
    logger.info("Starting up Resume Parser & Job Matcher API...")
    init_db()

# Register API routes
app.include_router(auth.router, prefix="/api")
app.include_router(resumes.router, prefix="/api")
app.include_router(jobs.router, prefix="/api")
app.include_router(matching.router, prefix="/api")

@app.get("/")
def read_root():
    return {
        "message": "Welcome to the Resume Parser & Job Matcher API!",
        "status": "online",
        "docs_url": "/docs"
    }
