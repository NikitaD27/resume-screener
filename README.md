# 🤖 AI Resume Screener

> An end-to-end AI-powered resume analysis platform built with **FastAPI** + **React**.  
> Upload a resume, paste a job description — get instant semantic scoring, ATS matching, missing keywords, a generated cover letter, and improvement tips powered by **Llama 3.1 via Groq**.

---

## 📸 Preview

| Single Resume Analysis | HR Bulk Comparison |
|---|---|
| Upload PDF/DOCX → get Overall, ATS, and Semantic scores | Upload 10 resumes → auto-ranked table with AI verdicts |

---

## ✨ Features

| Feature | Description |
|---|---|
| **Dual Scoring** | Semantic (embedding) + ATS (keyword) scores, combined into an overall match % |
| **Skill Mapping Chart** | Visual bar chart of 88+ skills scored by presence, JD relevance, and frequency |
| **Missing Keywords** | Highlights exactly which JD skills are absent from the resume |
| **AI Match Assessment** | RAG-powered qualitative verdict using Llama 3.1 |
| **Cover Letter Generator** | One-click tailored cover letter based on resume + JD |
| **Resume Improvement Tips** | 3 specific, actionable suggestions with rewritten bullet points |
| **HR Comparison Mode** | Upload up to 10 resumes, get a ranked table with one-line LLM verdict per candidate |
| **Multi-column PDF Parsing** | Detects and correctly extracts two-column resume layouts |
| **DOCX Table Extraction** | Pulls skills from designed resume tables |
| **Dark Mode** | Persisted via localStorage |

---

## 🧱 Tech Stack

### Backend
| Package | Purpose |
|---|---|
| `FastAPI` | REST API framework |
| `pdfplumber` | PDF text extraction with column detection |
| `python-docx` | DOCX parsing including tables |
| `sentence-transformers` | Semantic embeddings (`all-MiniLM-L6-v2`) |
| `faiss-cpu` | Vector similarity search for RAG |
| `spacy` | NLP tokenization |
| `groq` | LLM API client (Llama 3.1) |
| `python-dotenv` | Environment variable management |

### Frontend
| Package | Purpose |
|---|---|
| `React 19` | UI framework |
| `Recharts` | Skill mapping bar chart |
| `Lucide React` | Icons |
| `Bootstrap 5` | Layout utilities |
| `Axios` | HTTP client |

---

## 📁 Project Structure

```
resume-screener/
├── backend/
│   ├── main.py              # FastAPI application & all endpoints
│   ├── requirements.txt     # Python dependencies
│   ├── .env                 # API keys (not committed)
│   └── uploaded_resumes/    # Temp storage for uploaded files
│
└── frontend/
    └── resume-screener-ui/
        ├── src/
        │   ├── App.js       # Main React component
        │   └── App.css      # All custom styles
        ├── public/
        └── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- **Python 3.10+**
- **Node.js 18+ / npm**
- A free [Groq API key](https://console.groq.com) (for LLM features)

---

### 1. Clone the Repo

```bash
git clone https://github.com/NikitaD27/resume-screener.git
cd resume-screener
```

---

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment (recommended)
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Download spaCy model
python -m spacy download en_core_web_sm
```

#### Configure Environment

Create a `.env` file in the `backend/` directory:

```plaintext
GROQ_API_KEY=your_groq_key_here
```

> Get a free key at [console.groq.com](https://console.groq.com) — generous free tier.

#### Start the Backend

```bash
uvicorn main:app --port 8000 --reload --host 0.0.0.0
```

Verify it's running:
```bash
curl http://localhost:8000/
# → {"status":"ok","llm_available":true,"skills_count":88}
```

---

### 3. Frontend Setup

```bash
cd frontend/resume-screener-ui

# Install dependencies
npm install

# Start the dev server
npm start
```

The app will open at **http://localhost:3000**

---

## 🔌 API Reference

### `GET /`
Health check.  
Returns `llm_available: true` if GROQ key is configured.

---

### `POST /upload/`
Analyse a single resume against a job description.

| Field | Type | Description |
|---|---|---|
| `file` | File | Resume (PDF or DOCX) |
| `job_description` | String | Target job description text |

**Response:**
```json
{
  "filename": "resume.pdf",
  "combined_score": 61.5,
  "semantic_score": 65.2,
  "ats": {
    "ats_score": 57.14,
    "matched_keywords": ["python", "fastapi", "react"],
    "total_jd_skills": 7
  },
  "analysis": {
    "skill_scores": { "python": 100, "react": 85, "docker": 0 },
    "missing_keywords": ["docker", "kubernetes"],
    "llm_feedback": "Strong Python background...",
    "cover_letter": "Dear Hiring Manager...",
    "resume_tips": "1. Add Docker experience...",
    "email": "nikita@example.com",
    "phone": "+91 9876543210"
  },
  "text": "Extracted resume text..."
}
```

---

### `POST /compare/`
Rank up to 10 resumes against one JD.

| Field | Type | Description |
|---|---|---|
| `files` | File[] | Multiple resume files |
| `job_description` | String | Target job description |

**Response:**
```json
{
  "ranked_candidates": [
    {
      "rank": 1,
      "filename": "candidate_a.pdf",
      "combined_score": 72.3,
      "ats_score": 71.4,
      "semantic_score": 73.0,
      "matched_keywords": ["python", "ml", "fastapi"],
      "missing_keywords": ["docker"],
      "verdict": "Strong technical fit with solid ML experience."
    }
  ]
}
```

---

### `POST /cover-letter/`
Generate a cover letter only (no full analysis).

| Field | Type | Description |
|---|---|---|
| `file` | File | Resume (PDF or DOCX) |
| `job_description` | String | Target job description |

---

## ⚙️ Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | Yes (for LLM) | Groq API key for Llama 3.1 |
| `REACT_APP_API_URL` | No | Backend URL (default: `http://localhost:8000`) |

---

## 🌐 Deployment

### Backend (Railway / Render / Fly.io)
1. Set `GROQ_API_KEY` as an environment variable in the platform dashboard.
2. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Frontend (Vercel / Netlify)
1. Set `REACT_APP_API_URL=https://your-backend-url.railway.app` in environment settings.
2. Build command: `npm run build`
3. Output directory: `build/`

---

## 🔒 .gitignore Notes

The following are excluded from the repo:
- `backend/.env` — contains your secret API keys
- `backend/uploaded_resumes/` — user-uploaded files
- `node_modules/` — reinstall with `npm install`
- `__pycache__/` — Python bytecode
- `venv/` — local virtual environment

---

## 📜 License

MIT License © 2025 [Nikita Dung](https://github.com/NikitaD27)

---

## 🙏 Acknowledgements

- [Groq](https://groq.com) — blazing fast Llama 3.1 inference
- [Sentence Transformers](https://www.sbert.net) — semantic embeddings
- [pdfplumber](https://github.com/jsvine/pdfplumber) — accurate PDF parsing
- [FAISS](https://github.com/facebookresearch/faiss) — vector search
