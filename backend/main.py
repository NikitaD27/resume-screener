import os
import re
import shutil
import traceback
import numpy as np
import pdfplumber
from docx import Document
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from dotenv import load_dotenv
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

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

# Optional heavy ML packages with graceful fallback for memory efficiency (e.g. Render 512MB free tier)
try:
    import faiss
except ImportError:
    faiss = None

try:
    import spacy
    nlp = spacy.load("en_core_web_sm")
except Exception:
    nlp = None

try:
    from sentence_transformers import SentenceTransformer
    embedder = SentenceTransformer('all-MiniLM-L6-v2')
except Exception:
    embedder = None

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

def _get_groq_client():
    """Lazy Groq client — always reads the key fresh from env."""
    key = os.getenv("GROQ_API_KEY")
    if not key:
        return None
    return Groq(api_key=key)

groq_client = _get_groq_client()
print(f"LLM available: {groq_client is not None}")

# ─── Comprehensive Tech & AI Skills Dictionary ────────────────────────────────
SKILL_DICTIONARY = {
    # AI / ML / LLMs / GenAI
    "LLMs": [r"\bllms?\b", r"\blarge language models?\b", r"\bllm[- ]based\b"],
    "Reinforcement Learning": [r"\breinforcement learning\b", r"\brlhf\b", r"\brl\b"],
    "Agentic AI": [r"\bagentic ai\b", r"\bai agents?\b", r"\bagentic\b", r"\bmulti-?agent\b"],
    "Fine-tuning": [r"\bfine[- ]tuning\b", r"\bfinetuning\b", r"\blo-?ra\b", r"\bpeft\b"],
    "RAG": [r"\brag\b", r"\bretrieval[- ]augmented generation\b"],
    "Prompt Engineering": [r"\bprompt engineering\b", r"\bprompting\b"],
    "Generative AI": [r"\bgenerative ai\b", r"\bgenai\b"],
    "Machine Learning": [r"\bmachine learning\b", r"\bml\b"],
    "Deep Learning": [r"\bdeep learning\b", r"\bdl\b"],
    "NLP": [r"\bnlp\b", r"\bnatural language processing\b"],
    "Computer Vision": [r"\bcomputer vision\b", r"\bcv\b"],
    "PyTorch": [r"\bpytorch\b"],
    "TensorFlow": [r"\btensorflow\b"],
    "LangChain": [r"\blangchain\b"],
    "LlamaIndex": [r"\bllamaindex\b"],
    "Hugging Face": [r"\bhugging\s*face\b", r"\btransformers?\b"],
    "OpenAI": [r"\bopenai\b", r"\bgpt-?4\b", r"\bchatgpt\b"],
    "Gemini": [r"\bgemini\b"],
    "Groq": [r"\bgroq\b"],
    "vLLM": [r"\bvllm\b"],
    "Ollama": [r"\bollama\b"],
    "CrewAI": [r"\bcrewai\b"],
    "Vector DB": [r"\bvector (?:database|db)s?\b", r"\bchromadb\b", r"\bfaiss\b", r"\bpinecone\b", r"\bqdrant\b", r"\bweaviate\b"],
    "Embeddings": [r"\bembeddings?\b", r"\bsemantic search\b"],
    "Scikit-Learn": [r"\bscikit[- ]learn\b", r"\bsklearn\b"],
    "Pandas": [r"\bpandas\b"],
    "NumPy": [r"\bnumpy\b"],
    "AI/ML": [r"\bai/?ml\b", r"\bartificial intelligence\b"],
    "YOLOv5": [r"\byolov5\b", r"\byolo\b"],

    # Languages
    "Python": [r"\bpython\b"],
    "JavaScript": [r"\bjavascript\b", r"\bjs\b"],
    "TypeScript": [r"\btypescript\b", r"\bts\b"],
    "Java": [r"\bjava\b"],
    "C++": [r"\bc\+\+\b"],
    "C#": [r"\bc#\b"],
    "Go": [r"\bgo\b", r"\bgolang\b"],
    "Rust": [r"\brust\b"],
    "SQL": [r"\bsql\b"],
    "HTML": [r"\bhtml5?\b"],
    "CSS": [r"\bcss3?\b"],
    "Bash": [r"\bbash\b", r"\bshell\b"],
    
    # Web Frameworks & Libraries
    "React": [r"\breact(?:\.js|js)?\b"],
    "Vue": [r"\bvue(?:\.js|js)?\b"],
    "Angular": [r"\bangular(?:\.js|js)?\b"],
    "Next.js": [r"\bnext(?:\.js|js)?\b"],
    "Node.js": [r"\bnode(?:\.js|js)?\b"],
    "Express.js": [r"\bexpress(?:\.js|js)?\b"],
    "FastAPI": [r"\bfastapi\b"],
    "Django": [r"\bdjango\b"],
    "Flask": [r"\bflask\b"],
    "Tailwind CSS": [r"\btailwind(?:css)?\b"],
    "Bootstrap": [r"\bbootstrap\b"],
    "Recharts": [r"\brecharts\b"],

    # Databases
    "PostgreSQL": [r"\bpostgres(?:ql)?\b"],
    "MongoDB": [r"\bmongodb\b", r"\bmongo\b"],
    "MySQL": [r"\bmysql\b"],
    "SQLite": [r"\bsqlite\b"],
    "Redis": [r"\bredis\b"],
    "Firebase": [r"\bfirebase\b"],

    # Cloud & DevOps
    "AWS": [r"\baws\b", r"\bamazon web services\b"],
    "Azure": [r"\bazure\b"],
    "GCP": [r"\bgcp\b", r"\bgoogle cloud\b"],
    "Docker": [r"\bdocker\b"],
    "Kubernetes": [r"\bkubernetes\b", r"\bk8s\b"],
    "Git": [r"\bgit\b", r"\bgithub\b", r"\bgitlab\b"],
    "CI/CD": [r"\bci/?cd\b"],
    "Linux": [r"\blinux\b"],
    
    # Architecture & Practices
    "REST API": [r"\brest(?:ful)? apis?\b"],
    "GraphQL": [r"\bgraphql\b"],
    "Microservices": [r"\bmicroservices?\b"],
    "Full-Stack": [r"\bfull[- ]stack\b"],
    "DevOps": [r"\bdevops\b"],
    "SaaS": [r"\bsaas\b"],
    "CRM": [r"\bcrm\b"],
    "Agile": [r"\bagile\b", r"\bscrum\b"],
}

NON_SKILL_WORDS = {
    "role", "team", "position", "company", "work", "candidate", "experience", "degree",
    "description", "requirements", "responsibilities", "location", "office", "environment",
    "fit", "verdict", "score", "match", "leaderboard", "summary", "education", "project",
    "projects", "solutions", "knowledge", "skills", "qualifications", "application",
    "manager", "member", "date", "month", "year", "stack", "tech stack", "technologies",
    "key requirements", "ideal candidate", "fast-paced environment", "years of experience",
    "rapidclaims", "san francisco", "mumbai", "india", "opportunity", "impact", "solutions",
    "overview", "bullet point", "bullet points", "actionable suggestions", "core domain",
    "engineer", "developer", "senior", "junior", "lead", "staff", "head", "architect", "you",
    "present", "tech", "stack"
}

MONTHS_REGEX = re.compile(
    r'\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)\b',
    re.IGNORECASE
)
ACTION_WORDS_REGEX = re.compile(
    r'\b(tech stack|languages|skills|experience|implemented|building|created|developed|working|you|present)\b',
    re.IGNORECASE
)

def match_canonical_skill(phrase: str) -> str:
    """Check if a phrase matches any canonical dictionary skill."""
    phrase_lower = phrase.lower()
    for canonical, patterns in SKILL_DICTIONARY.items():
        for pat in patterns:
            if re.search(pat, phrase_lower, re.IGNORECASE):
                return canonical
    return None

def extract_text(file_path: str) -> str:
    """Clean, high-fidelity text extraction for PDFs and DOCX files."""
    text = ""
    if file_path.endswith(".pdf"):
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    elif file_path.endswith(".docx"):
        doc = Document(file_path)
        for para in doc.paragraphs:
            if para.text:
                text += para.text + "\n"
        for table in doc.tables:
            for row in table.rows:
                for cell in row.cells:
                    if cell.text:
                        text += cell.text + " "
                text += "\n"
    return text.strip()


def find_skills_in_text(text: str) -> set:
    """Find all matching skills in text using registry + canonical resolution NLP extraction."""
    text_clean = text.replace('\n', ' ')
    text_lower = text_clean.lower()
    found = set()

    # 1. Match from comprehensive SKILL_DICTIONARY
    for canonical, patterns in SKILL_DICTIONARY.items():
        for pat in patterns:
            if re.search(pat, text_lower, re.IGNORECASE):
                found.add(canonical)
                break

    # 2. Dynamic NLP Extraction if spacy is available
    if nlp is not None:
        try:
            doc = nlp(text_clean[:3000])
            for chunk in doc.noun_chunks:
                chunk_str = chunk.text.strip()
                clean = re.sub(
                    r'^(the|a|an|experience|knowledge|skills|understanding|proficient|strong|hands-on|in|with|of|for|key)\s+',
                    '', chunk_str, flags=re.IGNORECASE
                ).strip()

                # Try canonical match first
                canonical = match_canonical_skill(clean)
                if canonical:
                    found.add(canonical)
                    continue

                clean_lower = clean.lower()
                if MONTHS_REGEX.search(clean_lower) or ACTION_WORDS_REGEX.search(clean_lower):
                    continue

                if 3 <= len(clean) <= 30 and re.match(r'^[A-Z0-9][A-Za-z0-9\.\-\/\s]+$', clean):
                    if clean_lower not in NON_SKILL_WORDS and not any(w == clean_lower for w in NON_SKILL_WORDS):
                        if clean.isupper() or "/" in clean or "-" in clean or "." in clean:
                            found.add(clean)
                        else:
                            found.add(clean.title())
        except Exception as e:
            print(f"Spacy extraction skipped: {e}")

    return found


def score_skill(skill: str, resume_text: str, jd_skills: set) -> int:
    """Real skill scoring: presence(60) + JD required(25) + frequency(15)."""
    text_lower = resume_text.lower()
    patterns = SKILL_DICTIONARY.get(skill, [r'\b' + re.escape(skill) + r's?\b'])
    matches = []
    for pat in patterns:
        matches.extend(re.findall(pat, text_lower, re.IGNORECASE))
    if not matches:
        return 0
    presence_score = 60
    jd_bonus = 25 if skill in jd_skills else 0
    freq_bonus = min(len(matches) * 5, 15)
    return presence_score + jd_bonus + freq_bonus



def calculate_semantic_score(resume_text: str, jd: str) -> float:
    """Cosine similarity between resume and JD embeddings (SentenceTransformer or TF-IDF)."""
    if embedder is not None:
        try:
            embeddings = embedder.encode([resume_text, jd])
            score = np.dot(embeddings[0], embeddings[1]) / (
                np.linalg.norm(embeddings[0]) * np.linalg.norm(embeddings[1])
            )
            return round(float(score) * 100, 2)
        except Exception as e:
            print(f"SentenceTransformer encoding failed: {e}")

    # High-efficiency TF-IDF fallback (<5MB RAM, instant cosine similarity)
    try:
        vectorizer = TfidfVectorizer(stop_words='english')
        tfidf_matrix = vectorizer.fit_transform([resume_text, jd])
        score = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        return round(float(score) * 100, 2)
    except Exception as e:
        print(f"TF-IDF similarity failed: {e}")
        return 50.0


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
    if embedder is not None and faiss is not None:
        try:
            embeddings = embedder.encode(chunks)
            q_emb = embedder.encode([query])
            dim = embeddings.shape[1]
            index = faiss.IndexFlatL2(dim)
            index.add(np.array(embeddings).astype("float32"))
            _, idxs = index.search(np.array(q_emb).astype("float32"), min(top_k, len(chunks)))
            return [chunks[i] for i in idxs[0] if i != -1]
        except Exception as e:
            print(f"FAISS retrieval failed: {e}")

    # High-efficiency TF-IDF chunk retrieval fallback
    try:
        vectorizer = TfidfVectorizer(stop_words='english')
        tfidf_matrix = vectorizer.fit_transform(chunks + [query])
        query_vec = tfidf_matrix[-1:]
        chunk_vecs = tfidf_matrix[:-1]
        scores = cosine_similarity(query_vec, chunk_vecs)[0]
        top_indices = np.argsort(scores)[::-1][:top_k]
        return [chunks[i] for i in top_indices]
    except Exception:
        return chunks[:top_k]


def call_llm(prompt: str, prompt_type: str = "general", fallback_data: dict = None) -> str:
    load_dotenv(dotenv_path=_env_path, override=True)
    key = os.getenv("GROQ_API_KEY")
    if key and key != "your_groq_api_key_here":
        # Try primary model first, fallback to alternate model
        for model in ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"]:
            try:
                client = Groq(api_key=key)
                resp = client.chat.completions.create(
                    model=model,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.5,
                    max_tokens=1024,
                )
                return resp.choices[0].message.content.strip()
            except Exception as e:
                print(f"Groq API model {model} attempt failed: {e}")
                continue

    # ── High-Quality Fallback Response Generator ──
    data = fallback_data or {}
    matched_kws = data.get("matched_keywords", [])
    missing_kws = data.get("missing_keywords", [])
    score = data.get("combined_score", 70)
    email = data.get("email", "candidate@email.com")

    if prompt_type == "cover_letter":
        matched_str = ", ".join(matched_kws[:4]) if matched_kws else "core domain requirements"
        return (
            f"Dear Hiring Manager,\n\n"
            f"I am writing to express my strong enthusiasm for this position. With proven proficiency in {matched_str}, "
            f"I am confident in my ability to make an immediate impact on your engineering and business objectives.\n\n"
            f"Throughout my career, I have consistently focused on delivering robust, scalable solutions and collaborating "
            f"effectively within cross-functional teams. My technical background matches your key qualifications, and I bring a track record of driving technical excellence.\n\n"
            f"Thank you for considering my application. I welcome the opportunity to discuss how my background and hands-on expertise align with your team's needs.\n\n"
            f"Sincerely,\nCandidate\n{email}"
        )
    elif prompt_type == "resume_tips":
        missing_str = ", ".join(missing_kws[:3]) if missing_kws else "key technical proficiencies"
        return (
            f"1. **Highlight Required Core Technologies**: Incorporate explicit mentions of {missing_str} into your technical skills section and recent work experience bullet points.\n"
            f"2. **Quantify Accomplishments**: Add measurable impact metrics (e.g., 'Improved API performance by 35%' or 'Reduced build times by 20 minutes') to strengthen your project descriptions.\n"
            f"3. **Tailor Work Summaries**: Align your project bullet points directly with the primary responsibilities and tools emphasized in the job description."
        )
    elif prompt_type == "verdict":
        if matched_kws:
            matched_str = ", ".join(matched_kws[:4])
            missing_str = ", ".join(missing_kws[:3]) if missing_kws else "few minor requirements"
            return f"Solid fit ({score}% match) with strong experience in {matched_str}; lacks {missing_str}."
        elif score >= 75:
            return f"Strong alignment ({score}% match). Candidate possesses key qualifications and core competency match."
        elif score >= 50:
            return f"Moderate fit ({score}% match). Meets several requirements but lacks specific key keywords."
        else:
            return f"Low alignment ({score}% match). Significant gaps identified in required skills."
    else:
        return f"Candidate fit score: {score}%. Key matching proficiencies identified."


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

    # Contacts
    email_match = re.search(r'[\w\.-]+@[\w\.-]+', resume_text)
    phone_match = re.search(r'\+?\d[\d \-]{8,13}\d', resume_text)
    email_val = email_match.group(0) if email_match else "Not found"
    phone_val = phone_match.group(0) if phone_match else "Not found"

    fallback_data = {
        "matched_keywords": sorted(ats.get("matched_keywords", [])),
        "missing_keywords": missing_keywords,
        "combined_score": combined,
        "email": email_val
    }

    # RAG LLM feedback
    chunks = chunk_text(resume_text)
    context = "\n\n".join(retrieve_relevant_chunks(chunks, jd))
    llm_feedback = call_llm(
        f"You are an expert HR recruiter. Analyse this resume snippet against the job description. "
        f"Give a professional 2-3 sentence verdict on fit.\n\nResume:\n{context}\n\nJob Description:\n{jd[:800]}",
        prompt_type="verdict",
        fallback_data=fallback_data
    )

    # Cover letter
    cover_letter = call_llm(
        f"Write a concise, professional cover letter (3 paragraphs) based on this resume and job description.\n"
        f"Resume:\n{resume_text[:2000]}\n\nJob Description:\n{jd[:800]}",
        prompt_type="cover_letter",
        fallback_data=fallback_data
    )

    # Resume tips
    resume_tips = call_llm(
        f"List exactly 3 specific, actionable suggestions to improve this resume for the job description below. "
        f"For each, rewrite the bullet point.\nMissing keywords: {', '.join(missing_keywords[:10])}\n"
        f"Resume:\n{resume_text[:1500]}\n\nJob Description:\n{jd[:800]}",
        prompt_type="resume_tips",
        fallback_data=fallback_data
    )

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
            "email": email_val,
            "phone": phone_val,
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
        "skills_count": len(SKILL_DICTIONARY),
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
                f"You are an expert HR recruiter. Write exactly ONE concise sentence summarizing fit.\n"
                f"STRICT RULE: The candidate HAS the following skills, so NEVER say they lack them: {', '.join(sorted(matched)) if matched else 'None'}\n"
                f"Missing Skills: {', '.join(missing[:6]) if missing else 'None'}\n"
                f"Overall Score: {combined}%\n"
                f"Role: {job_description[:300]}",
                prompt_type="verdict",
                fallback_data={"combined_score": combined, "matched_keywords": sorted(matched), "missing_keywords": missing}
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
        f"Resume:\n{resume_text[:2000]}\n\nJob Description:\n{job_description[:800]}",
        prompt_type="cover_letter",
        fallback_data={"matched_keywords": [], "combined_score": 75}
    )
    return {"cover_letter": letter}

