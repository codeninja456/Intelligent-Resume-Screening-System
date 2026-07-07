import os

# JWT Settings
SECRET_KEY = os.environ.get("SECRET_KEY", "supersecretkeychangeinproduction12345!")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# MongoDB Settings
MONGODB_URI = os.environ.get("MONGODB_URI", "mongodb://localhost:27017")
DATABASE_NAME = os.environ.get("DATABASE_NAME", "resume_parser_db")

# Default pre-defined skills taxonomy for keyword matching
SKILLS_TAXONOMY = [
    # Programming Languages
    "python", "javascript", "typescript", "java", "c++", "c#", "go", "golang", "ruby", "php", "swift", "kotlin", "rust", "scala", "sql", "r", "html", "css", "sass", "bash",
    # Frameworks & Libraries
    "react", "angular", "vue", "next.js", "nuxt", "svelte", "django", "flask", "fastapi", "spring boot", "express", "node.js", "node", "jquery", "bootstrap", "tailwind", "pandas", "numpy", "scikit-learn", "tensorflow", "pytorch", "keras",
    # Databases
    "mongodb", "postgresql", "mysql", "sqlite", "redis", "cassandra", "dynamodb", "mariadb", "oracle", "neo4j",
    # Devops & Cloud
    "docker", "kubernetes", "aws", "azure", "gcp", "google cloud", "jenkins", "github actions", "gitlab ci", "terraform", "ansible", "linux", "nginx", "apache",
    # Concepts & Methodologies
    "agile", "scrum", "kanban", "ci/cd", "rest api", "graphql", "microservices", "system design", "machine learning", "deep learning", "nlp", "computer vision", "data science", "oop", "tdd",
    # Tools
    "git", "github", "gitlab", "jira", "confluence", "figma", "postman", "docker-compose",
    # Soft & Management Skills
    "project management", "product management", "leadership", "communication", "teamwork", "problem solving", "time management", "analytical skills"
]
