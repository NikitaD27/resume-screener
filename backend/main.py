import os
import re
import shutil
import traceback
import numpy as np
import faiss
import spacy
import pdfplumber
from docx import Document
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sentence_transformers import SentenceTransformer
from groq import Groq
from dotenv import load_dotenv

# Load .env from the same directory as this file
_env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
load_dotenv(dotenv_path=_env_path, override=True)

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

try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    import subprocess
    subprocess.run(["python", "-m", "spacy", "download", "en_core_web_sm"])
    nlp = spacy.load("en_core_web_sm")

print("Loading sentence embeddings model...")
embedder = SentenceTransformer('all-MiniLM-L6-v2')

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

def _get_groq_client():
    """Lazy Groq client — always reads the key fresh from env."""
    key = os.getenv("GROQ_API_KEY")
    if not key:
        return None
    return Groq(api_key=key)

groq_client = _get_groq_client()
print(f"LLM available: {groq_client is not None}")

# ─── Expanded Skills Registry (80+) ───────────────────────────────────────────
SKILLS_REGISTRY = {
    # Languages
    "python", "javascript", "typescript", "java", "c++", "c", "c#", "go", "rust", "kotlin",
    "swift", "php", "ruby", "scala", "r", "matlab", "bash", "shell",
    # Web Frontend
    "react", "vue", "angular", "nextjs", "svelte", "html", "css", "tailwind", "bootstrap",
    "sass", "webpack", "vite", "redux",
    # Web Backend
    "fastapi", "django", "flask", "node.js", "nodejs", "express", "spring", "rails",
    # Databases
    "sql", "mysql", "postgresql", "mongodb", "sqlite", "redis", "firebase", "dynamodb",
    "elasticsearch", "cassandra",
    # Cloud & DevOps
    "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "jenkins", "github actions",
    "ci/cd", "linux", "git",
    # AI / ML / Data
    "machine learning", "deep learning", "nlp", "computer vision", "tensorflow", "pytorch",
    "scikit-learn", "pandas", "numpy", "langchain", "llm", "rag", "chromadb", "faiss",
    "hugging face", "transformers", "yolov5", "opencv", "prompt engineering",
    "gemini", "openai", "groq",
    # Extras
    "rest api", "graphql", "microservices", "agile", "scrum", "devops",
}

# ─── Utility Functions ─────────────────────────────────────────────────────────

def extract_text(file_path: str) -> str:
    """Enhanced extraction supporting multi-column PDFs and DOCX tables."""
    text = ""
    if file_path.endswith(".pdf"):
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                # Detect multi-column by checking word distribution
                words = page.extract_words(x_tolerance=5, y_tolerance=5)
                if words:
                    page_width = page.width
                    mid = page_width / 2
                    left_words = sorted(
                        [w for w in words if w["x0"] < mid],
                        key=lambda w: (w["top"], w["x0"])
                    )
                    right_words = sorted(
                        [w for w in words if w["x0"] >= mid],
                        key=lambda w: (w["top"], w["x0"])
                    )
                    # Merge column text in reading order
                    left_text = " ".join(w["text"] for w in left_words)
                    right_text = " ".join(w["text"] for w in right_words)
                    # If significant right content, treat as two columns
                    if len(right_text.strip()) > 30:
                        text += left_text + "\n" + right_text + "\n"
                    else:
                        raw = page.extract_text()
                        if raw:
                            text += raw + "\n"
                else:
                    raw = page.extract_text()
                    if raw:
                        text += raw + "\n"
    elif file_path.endswith(".docx"):
        doc = Document(file_path)
        for para in doc.paragraphs:
            text += para.text + "\n"
        # Extract text from tables (important for designed resumes)
        for table in doc.tables:
            for row in table.rows:
                for cell in row.cells:
                    text += cell.text + " "
            text += "\n"
    return text.strip()


def find_skills_in_text(text: str) -> set:
    """Find all known skills in text using the registry."""
    text_lower = text.lower()
    found = set()
    for skill in SKILLS_REGISTRY:
        # Match whole word/phrase
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, text_lower):
            found.add(skill)
    return found


def score_skill(skill: str, resume_text: str, jd_skills: set) -> int:
    """Real skill scoring: presence(60) + JD required(25) + frequency(15)."""
    text_lower = resume_text.lower()
    pattern = r'\b' + re.escape(skill) + r'\b'
    matches = re.findall(pattern, text_lower)
    if not matches:
        return 0
    presence_score = 60
    jd_bonus = 25 if skill in jd_skills else 0
    freq_bonus = min(len(matches) * 5, 15)
    return presence_score + jd_bonus + freq_bonus


def calculate_semantic_score(resume_text: str, jd: str) -> float:
    """Cosine similarity between resume and JD embeddings."""
    embeddings = embedder.encode([resume_text, jd])
    score = np.dot(embeddings[0], embeddings[1]) / (
        np.linalg.norm(embeddings[0]) * np.linalg.norm(embeddings[1])
    )
    return round(float(score) * 100, 2)


def calculate_ats_score(resume_text: str, jd: str):
    """ATS keyword match: how many JD skills appear in resume."""
    jd_skills = find_skills_in_text(jd)
    resume_skills = find_skills_in_text(resume_text)
    if not jd_skills:
        return {"ats_score": 0, "matched_keywords": [], "total_jd_skills": 0}
    matched = jd_skills.intersection(resume_skills)
    score = round((len(matched) / len(jd_skills)) * 100, 2)
    return {
        "ats_score": score,
        "matched_keywords": sorted(matched),
        "total_jd_skills": len(jd_skills),
    }


def chunk_text(text: str, chunk_size=400, overlap=50):
    words = text.split()
    return [" ".join(words[i:i + chunk_size]) for i in range(0, len(words), chunk_size - overlap)]


def retrieve_relevant_chunks(chunks, query: str, top_k=3):
    if not chunks:
        return []
    embeddings = embedder.encode(chunks)
    q_emb = embedder.encode([query])
    dim = embeddings.shape[1]
    index = faiss.IndexFlatL2(dim)
    index.add(np.array(embeddings).astype("float32"))
    _, idxs = index.search(np.array(q_emb).astype("float32"), min(top_k, len(chunks)))
    return [chunks[i] for i in idxs[0] if i != -1]


def call_llm(prompt: str) -> str:
    # Re-read key each call — handles hot reload scenarios
    key = os.getenv("GROQ_API_KEY")
    if not key:
        return "LLM unavailable — please set GROQ_API_KEY in your .env file."
    try:
        client = Groq(api_key=key)
        resp = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.5,
            max_tokens=1024,
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        return f"LLM error: {str(e)}"


def analyse_resume(resume_text: str, jd: str):
    """Full single-resume analysis — returns all computed fields."""
    # Skills
    jd_skills = find_skills_in_text(jd)
    resume_skills = find_skills_in_text(resume_text)
    all_skills = jd_skills.union(resume_skills)
    skill_scores = {s: score_skill(s, resume_text, jd_skills) for s in all_skills}

    missing_keywords = sorted(jd_skills - resume_skills)

    # Scores
    semantic = calculate_semantic_score(resume_text, jd)
    ats = calculate_ats_score(resume_text, jd)
    combined = round(semantic * 0.6 + ats["ats_score"] * 0.4, 2)

    # RAG LLM feedback
    chunks = chunk_text(resume_text)
    context = "\n\n".join(retrieve_relevant_chunks(chunks, jd))
    llm_feedback = call_llm(
        f"You are an expert HR recruiter. Analyse this resume snippet against the job description. "
        f"Give a professional 2-3 sentence verdict on fit.\n\nResume:\n{context}\n\nJob Description:\n{jd[:800]}"
    )

    # Cover letter
    cover_letter = call_llm(
        f"Write a concise, professional cover letter (3 paragraphs) based on this resume and job description.\n"
        f"Resume:\n{resume_text[:2000]}\n\nJob Description:\n{jd[:800]}"
    )

    # Resume tips
    resume_tips = call_llm(
        f"List exactly 3 specific, actionable suggestions to improve this resume for the job description below. "
        f"For each, rewrite the bullet point.\nMissing keywords: {', '.join(missing_keywords[:10])}\n"
        f"Resume:\n{resume_text[:1500]}\n\nJob Description:\n{jd[:800]}"
    )

    # Contacts
    email_match = re.search(r'[\w\.-]+@[\w\.-]+', resume_text)
    phone_match = re.search(r'\+?\d[\d \-]{8,13}\d', resume_text)

    return {
        "semantic_score": semantic,
        "combined_score": combined,
        "ats": ats,
        "analysis": {
            "skill_scores": skill_scores,
            "missing_keywords": missing_keywords,
            "llm_feedback": llm_feedback,
            "cover_letter": cover_letter,
            "resume_tips": resume_tips,
            "email": email_match.group(0) if email_match else "Not found",
            "phone": phone_match.group(0) if phone_match else "Not found",
        },
        "text": resume_text,
    }


# ─── API Endpoints ─────────────────────────────────────────────────────────────

@app.get("/")
async def health():
    _key = os.getenv("GROQ_API_KEY")
    return {
        "status": "ok",
        "llm_available": bool(_key),
        "skills_count": len(SKILLS_REGISTRY),
    }


@app.post("/upload/")
async def upload_resume(file: UploadFile = File(...), job_description: str = Form(...)):
    file_path = f"{UPLOAD_FOLDER}/{file.filename}"
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    try:
        resume_text = extract_text(file_path)
        result = analyse_resume(resume_text, job_description)
        return {"filename": file.filename, **result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}\n{traceback.format_exc()}")


@app.post("/compare/")
async def compare_resumes(files: list[UploadFile] = File(...), job_description: str = Form(...)):
    ranked = []
    for i, file in enumerate(files):
        file_path = f"{UPLOAD_FOLDER}/{file.filename}"
        with open(file_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
        try:
            resume_text = extract_text(file_path)
            jd_skills = find_skills_in_text(job_description)
            resume_skills = find_skills_in_text(resume_text)
            matched = jd_skills.intersection(resume_skills)
            missing = sorted(jd_skills - resume_skills)

            semantic = calculate_semantic_score(resume_text, job_description)
            ats = calculate_ats_score(resume_text, job_description)
            combined = round(semantic * 0.6 + ats["ats_score"] * 0.4, 2)

            verdict = call_llm(
                f"Give exactly ONE sentence verdict on this candidate's fit for the job. "
                f"Their combined score is {combined}%, matched skills: {', '.join(list(matched)[:8])}.\n"
                f"Job Description: {job_description[:400]}"
            )
            ranked.append({
                "filename": file.filename,
                "combined_score": combined,
                "semantic_score": semantic,
                "ats_score": ats["ats_score"],
                "matched_keywords": sorted(matched),
                "missing_keywords": missing[:10],
                "verdict": verdict,
            })
        except Exception as e:
            ranked.append({
                "filename": file.filename,
                "combined_score": 0,
                "error": str(e),
                "verdict": "Failed to process.",
            })

    ranked.sort(key=lambda x: x["combined_score"], reverse=True)
    for i, r in enumerate(ranked):
        r["rank"] = i + 1

    return {"ranked_candidates": ranked}


@app.post("/cover-letter/")
async def cover_letter_only(file: UploadFile = File(...), job_description: str = Form(...)):
    file_path = f"{UPLOAD_FOLDER}/{file.filename}"
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    resume_text = extract_text(file_path)
    letter = call_llm(
        f"Write a concise, professional cover letter (3 paragraphs) based on this resume and job description.\n"
        f"Resume:\n{resume_text[:2000]}\n\nJob Description:\n{job_description[:800]}"
    )
    return {"cover_letter": letter}
