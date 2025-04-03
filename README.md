Resume Screener App

Overview
The Resume Screener App is an AI-powered tool that analyzes resumes against job descriptions to provide insights into skill matches, candidate ranking, and resume feedback. 
It features AI-driven skill scoring, search and filtering, and a responsive UI for enhanced usability.

Features
📂 Resume Upload: Supports PDF and DOCX formats.
📄 Job Description Input: Enter job descriptions to compare against resumes.
🤖 AI-Powered Analysis: Uses NLP and Machine Learning to match skills.
📊 Skill Scoring: Visual representation of skill matches with dynamic filtering.
🔎 Search & Filtering: Filter candidates based on skills and scores.
📌 Smart Candidate Ranking: AI-driven ranking of candidates based on job relevance.
📝 AI-Powered Resume Feedback: Get suggestions to improve your resume.
🌑 Dark Mode Toggle: User-friendly theme switching.
🌍 Live Hosting: Deployed using Railway.

Tech Stack
Frontend: React.js, Bootstrap, Recharts
Backend: FastAPI, Python
Database: PostgreSQL (or SQLite for local testing)

Installation
Prerequisites
Ensure you have the following installed:
Node.js (LTS version)
Python 3.8+
Yarn (or use npm)

Setup Frontend
git clone https://github.com/NikitaD27/resume-screener.git
cd resume-screener
yarn install
yarn start

Setup Backend (FastAPI)
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

Usage
Upload a resume.
Paste a job description.
Click "Analyze" to get insights.
View the skill match chart.
Use search and filtering for better results.
Check AI-generated resume feedback.
View ranked candidates based on job relevance.

Contributions
Contributions are welcome! Feel free to fork and submit PRs.

License
MIT License © 2025 Nikita Vishnu Dung
