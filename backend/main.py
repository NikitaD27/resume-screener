from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
import pdfplumber
from docx import Document
import spacy
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_FOLDER = "uploaded_resumes"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

nlp = spacy.load("en_core_web_sm")

@app.post("/upload/")
async def upload_resume(file: UploadFile = File(...), job_description: str = Form(...)):
    file_path = f"{UPLOAD_FOLDER}/{file.filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    extracted_text = extract_text(file_path)
    resume_data = extract_resume_info(extracted_text, job_description)

    # Compute similarity score
    score = calculate_resume_score(extracted_text, job_description)

    return {
        "filename": file.filename,
        "message": "File uploaded successfully!",
        "text": extracted_text[:500],
        "analysis": resume_data,
        "score": score  # ✅ Return the resume score
    }


def extract_text(file_path: str) -> str:
    """Extract text from a PDF or DOCX file."""
    if file_path.endswith(".pdf"):
        with pdfplumber.open(file_path) as pdf:
            return "\n".join([page.extract_text() for page in pdf.pages if page.extract_text()])
    
    elif file_path.endswith(".docx"):
        doc = Document(file_path)
        return "\n".join([para.text for para in doc.paragraphs])

    return "Unsupported file format"

def extract_resume_info(resume_text, job_description):
    """Extract skills, education, experience, and contact details."""
    doc = nlp(resume_text)

    skills = ["Python", "Java", "SQL", "Machine Learning", "Deep Learning", "React", "Django", "NLP", "Flask"]
    found_skills = [skill for skill in skills if skill.lower() in resume_text.lower()]

    degrees = ["B.E", "B.Tech", "M.Tech", "B.Sc", "M.Sc", "Ph.D", "Bachelor", "Master", "Diploma"]
    found_degrees = [degree for degree in degrees if degree.lower() in resume_text.lower()]

    experience_matches = re.findall(r'(\d+)\s+years?', resume_text, re.IGNORECASE)
    years_of_experience = max(map(int, experience_matches), default=0)

    email = re.search(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", resume_text)
    phone = re.search(r"\+?\d{10,15}", resume_text)

    skill_scores = {skill: round(50 + (hash(skill) % 50), 2) for skill in found_skills}

    return {
        "skills": found_skills,
        "skill_scores": skill_scores,  # ✅ Include skill_scores in the return dictionary
        "education": found_degrees,
        "experience": f"{years_of_experience} years",
        "email": email.group() if email else "Not found",
        "phone": phone.group() if phone else "Not found",
        "job_description": job_description  # ✅ Include job description for reference
    }


def calculate_resume_score(resume_text, job_description):
    """Calculate similarity score using TF-IDF and Cosine Similarity."""
    vectorizer = TfidfVectorizer(stop_words="english")
    tfidf_matrix = vectorizer.fit_transform([resume_text, job_description])

    similarity_score = cosine_similarity(tfidf_matrix[0], tfidf_matrix[1])[0][0]
    return round(similarity_score * 100, 2)  # Convert to percentage
