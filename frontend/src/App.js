import React, { useState, useEffect } from "react";
import { Spinner } from "react-bootstrap";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList, Cell,
  PieChart, Pie, Legend,
} from "recharts";
import {
  UploadCloud, Moon, Sun, Search, SlidersHorizontal, FileText,
  BarChart2, CheckCircle, AlertCircle, Copy, Sparkles, Users,
  Trash2, ArrowRight, Zap, Target, Check, ChevronDown, ChevronUp
} from "lucide-react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

const API_URL = (process.env.REACT_APP_API_URL || "http://localhost:8000").replace(/\/$/, "");

// Helper for color coding scores based on Electric Indigo & Cyber Silver palette
const getScoreColor = (score) => {
  if (score >= 75) return "#10B981"; // Striking emerald green for high match
  if (score >= 50) return "#3B82F6"; // Electric vivid blue for medium match
  return "#EF4444"; // Soft terracotta red for low match
};

const getScorePillClass = (score) => {
  if (score >= 75) return "score-pill-high";
  if (score >= 50) return "score-pill-medium";
  return "score-pill-low";
};

// ─── Circular / Radial Progress Gauge Component ─────────────────────────────────
function CircularProgressGauge({ value = 0, label, sublabel, color = "#4F46E5", size = 140, strokeWidth = 10 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const normalizedValue = Math.min(100, Math.max(0, value || 0));
  const strokeDashoffset = circumference - (normalizedValue / 100) * circumference;
  
  // Use emerald green if score is 100% or high match (>=75%)
  const gaugeColor = color === "auto" ? getScoreColor(normalizedValue) : color;

  return (
    <div className="radial-gauge-card">
      <div className="radial-gauge-svg-wrapper" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            className="radial-gauge-bg"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
          />
          <circle
            className="radial-gauge-fill"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            stroke={gaugeColor}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
          />
        </svg>
        <div className="radial-gauge-text">
          <span className="radial-value" style={{ color: gaugeColor }}>{normalizedValue}%</span>
        </div>
      </div>
      <div className="radial-gauge-info">
        <span className="radial-label">{label}</span>
        {sublabel && <span className="radial-sublabel">{sublabel}</span>}
      </div>
    </div>
  );
}

// ─── Native Dotted Drag & Drop File Zone ───────────────────────────────────────
function FileDropzone({ file, setFile, accept = ".pdf,.docx", labelText = "Drag & Drop your Resume here" }) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = () => {
    setIsDragOver(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div
      className={`file-dropzone ${isDragOver ? "drag-over" : ""} ${file ? "has-file" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        id="single-file-input"
        className="dropzone-input"
        accept={accept}
        onChange={handleInputChange}
      />
      {!file ? (
        <label htmlFor="single-file-input" className="dropzone-label">
          <div className="dropzone-icon-circle">
            <UploadCloud size={30} className="dropzone-icon" />
          </div>
          <div className="dropzone-text-group">
            <span className="dropzone-title">{labelText}</span>
            <span className="dropzone-subtitle">or click to browse from computer (PDF, DOCX)</span>
          </div>
        </label>
      ) : (
        <div className="selected-file-card">
          <div className="file-icon-badge">
            <FileText size={26} />
          </div>
          <div className="file-details">
            <span className="file-name">{file.name}</span>
            <span className="file-size">{formatFileSize(file.size)}</span>
          </div>
          <button
            type="button"
            className="file-remove-btn"
            onClick={(e) => {
              e.stopPropagation();
              setFile(null);
            }}
            title="Remove file"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Multi File Dropzone for Bulk HR Mode ──────────────────────────────────────
function BulkFileDropzone({ files, setFiles, onShowLimitModal }) {
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    if (files.length > 10) {
      setFiles((prev) => prev.slice(0, 10));
      onShowLimitModal();
    }
  }, [files, setFiles, onShowLimitModal]);

  const processFiles = (newFileList) => {
    const combined = [...files, ...Array.from(newFileList)];
    const unique = [];
    const names = new Set();
    for (const f of combined) {
      if (!names.has(f.name)) {
        names.add(f.name);
        unique.push(f);
      }
    }
    if (unique.length > 10) {
      onShowLimitModal();
      setFiles(unique.slice(0, 10));
    } else {
      setFiles(unique);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = () => {
    setIsDragOver(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = "";
    }
  };

  const removeSingleFile = (idx, e) => {
    e.preventDefault();
    e.stopPropagation();
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const clearAllFiles = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setFiles([]);
  };

  return (
    <div
      className={`file-dropzone ${isDragOver ? "drag-over" : ""} ${files.length > 0 ? "has-file" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {files.length === 0 ? (
        <>
          <input
            type="file"
            id="bulk-file-input"
            className="dropzone-input"
            accept=".pdf,.docx"
            multiple
            onChange={handleInputChange}
          />
          <label htmlFor="bulk-file-input" className="dropzone-label">
            <div className="dropzone-icon-circle">
              <Users size={30} className="dropzone-icon" />
            </div>
            <div className="dropzone-text-group">
              <span className="dropzone-title">Drag &amp; Drop multiple Resumes here</span>
              <span className="dropzone-subtitle">Upload up to 10 PDF or Word resumes</span>
            </div>
          </label>
        </>
      ) : (
        <div className="bulk-selected-container">
          <input
            type="file"
            id="bulk-file-input-hidden"
            style={{ display: "none" }}
            accept=".pdf,.docx"
            multiple
            onChange={handleInputChange}
          />

          <div className="bulk-header-info">
            <span className="fw-bold fs-6 text-main">
              {files.length} candidate resume(s) attached
            </span>
            <div className="d-flex align-items-center gap-2">
              {files.length < 10 && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary rounded-pill px-3 py-1 fw-bold"
                  onClick={(e) => {
                    e.stopPropagation();
                    document.getElementById("bulk-file-input-hidden")?.click();
                  }}
                >
                  + Add More
                </button>
              )}
              <button
                type="button"
                className="btn btn-sm btn-outline-danger rounded-pill px-3 py-1 fw-bold"
                onClick={clearAllFiles}
              >
                Clear all
              </button>
            </div>
          </div>

          <div className="bulk-file-tags custom-scrollbar" onWheel={(e) => e.stopPropagation()}>
            {files.map((f, i) => (
              <span key={i} className="bulk-file-tag">
                <FileText size={13} className="text-indigo-icon" />
                <span className="file-tag-name text-truncate" title={f.name}>{f.name}</span>
                <button
                  type="button"
                  className="file-tag-remove"
                  onClick={(e) => removeSingleFile(i, e)}
                  title="Remove file"
                >
                  <Trash2 size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────────
function App() {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");

  useEffect(() => {
    document.body.classList.toggle("dark-mode", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const [mode, setMode] = useState("single"); // "single" | "bulk"

  // Single Resume State
  const [file, setFile] = useState(null);
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Active Tab & Filters
  const [activeTab, setActiveTab] = useState("overview"); // overview | cover | tips | snapshot
  const [searchQuery, setSearchQuery] = useState("");
  const [filterScore, setFilterScore] = useState(0);
  const [chartCategory, setChartCategory] = useState("top"); // "top" | "jd" | "all"
  const [chartViewMode, setChartViewMode] = useState("donut"); // "donut" | "matrix" | "bars"
  const [selectedCategoryName, setSelectedCategoryName] = useState(null);
  const [matrixSubMode, setMatrixSubMode] = useState("grid"); // "grid" | "tiered"

  // Bulk State
  const [bulkFiles, setBulkFiles] = useState([]);
  const [bulkJd, setBulkJd] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [rankings, setRankings] = useState(null);
  const [selectedCandidateIndex, setSelectedCandidateIndex] = useState(0);
  const [expandedRows, setExpandedRows] = useState({});
  const [leaderboardViewMode, setLeaderboardViewMode] = useState("feed"); // "feed" | "split" | "grid" | "accordion"
  const [showLimitModal, setShowLimitModal] = useState(false);

  const toggleRowExpand = (idx) => {
    setExpandedRows((prev) => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const resetSingleResults = () => {
    setResult(null);
    setActiveTab("overview");
    setSearchQuery("");
    setFilterScore(0);
    setChartCategory("top");
    setChartViewMode("donut");
    setSelectedCategoryName(null);
    setMatrixSubMode("grid");
  };

  const truncateLabel = (label, maxLength = 13) => {
    if (!label) return "";
    if (label.length <= maxLength) return label;
    return label.substring(0, maxLength - 1) + "…";
  };

  const handleUpload = async () => {
    if (!file || !jd.trim()) {
      alert("Please select a resume file and enter a job description.");
      return;
    }
    setLoading(true);
    resetSingleResults();
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("job_description", jd);
      const res = await axios.post(`${API_URL}/upload/`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(res.data);
    } catch (err) {
      alert("Upload failed. Is the backend running at " + API_URL + "?");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpload = async () => {
    if (bulkFiles.length === 0 || !bulkJd.trim()) {
      alert("Please select at least one resume and enter a job description.");
      return;
    }
    setBulkLoading(true);
    setRankings(null);
    try {
      const fd = new FormData();
      bulkFiles.forEach((f) => fd.append("files", f));
      fd.append("job_description", bulkJd);
      const res = await axios.post(`${API_URL}/compare/`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setRankings(res.data.ranked_candidates || []);
    } catch (err) {
      alert("Bulk upload failed. Check the backend console.");
      console.error(err);
    } finally {
      setBulkLoading(false);
    }
  };

  const jdSkillsList = result?.ats?.total_jd_skills_list || [];
  const missingKws = result?.analysis?.missing_keywords || [];
  const matchedKws = result?.ats?.matched_keywords || [];

  const rawSkillEntries = result
    ? Object.entries(result.analysis?.skill_scores || {}).map(([skill, score]) => ({
        skill,
        score,
        isJdSkill: jdSkillsList.includes(skill) || missingKws.includes(skill) || matchedKws.includes(skill),
      }))
    : [];

  const SKILL_CATEGORY_MAP = {
    "AI / ML & LLMs": ["LLMs", "Reinforcement Learning", "Agentic AI", "Fine-tuning", "RAG", "Prompt Engineering", "Generative AI", "Machine Learning", "Deep Learning", "NLP", "Computer Vision", "PyTorch", "TensorFlow", "LangChain", "LlamaIndex", "Hugging Face", "OpenAI", "Gemini", "Groq", "vLLM", "Ollama", "CrewAI", "Vector DB", "Embeddings", "Scikit-Learn", "Pandas", "NumPy", "AI/ML", "YOLOv5", "Vector Search"],
    "Web & Frameworks": ["React", "Vue", "Angular", "Next.js", "Node.js", "Express.js", "FastAPI", "Django", "Flask", "Tailwind CSS", "Bootstrap", "Recharts", "Full-Stack", "REST API", "GraphQL", "Microservices", "HTML", "CSS"],
    "Databases & Cloud": ["PostgreSQL", "MongoDB", "MySQL", "SQLite", "Redis", "Firebase", "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Git", "CI/CD", "Linux", "DevOps", "SaaS"],
    "Core Languages": ["Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "Go", "Rust", "SQL", "Bash", "ES6"]
  };

  const getCategoryForSkill = (skill) => {
    for (const [cat, skills] of Object.entries(SKILL_CATEGORY_MAP)) {
      if (skills.some((s) => s.toLowerCase() === skill.toLowerCase())) {
        return cat;
      }
    }
    return "Other Technical";
  };

  const categoryColors = {
    "AI / ML & LLMs": "#4F46E5",
    "Web & Frameworks": "#3B82F6",
    "Databases & Cloud": "#10B981",
    "Core Languages": "#F59E0B",
    "Other Technical": "#8B5CF6"
  };

  const categoryMap = {};
  rawSkillEntries.forEach(({ skill, score }) => {
    const cat = getCategoryForSkill(skill);
    if (!categoryMap[cat]) {
      categoryMap[cat] = { name: cat, count: 0, totalScore: 0, color: categoryColors[cat] || "#64748B", skills: [] };
    }
    categoryMap[cat].count += 1;
    categoryMap[cat].totalScore += score;
    categoryMap[cat].skills.push({ skill, score });
  });

  const categoryChartData = Object.values(categoryMap).map((c) => ({
    name: c.name,
    value: c.count,
    avgScore: Math.round(c.totalScore / c.count),
    color: c.color,
    skills: c.skills.sort((a, b) => b.score - a.score)
  }));

  const activeCategory = categoryChartData.find((c) => c.name === selectedCategoryName) || categoryChartData[0];

  const getProficiencyLabel = (score) => {
    if (score >= 90) return { label: "Expert", color: "#10B981" };
    if (score >= 75) return { label: "Proficient", color: "#3B82F6" };
    if (score >= 60) return { label: "Intermediate", color: "#38BDF8" };
    return { label: "Foundational", color: "#F59E0B" };
  };

  let categorySkills = [];
  if (chartCategory === "top") {
    categorySkills = [...rawSkillEntries].sort((a, b) => b.score - a.score).slice(0, 15);
  } else if (chartCategory === "jd") {
    categorySkills = rawSkillEntries.filter((s) => s.isJdSkill);
    missingKws.forEach((mSkill) => {
      if (!categorySkills.some((s) => s.skill.toLowerCase() === mSkill.toLowerCase())) {
        categorySkills.push({ skill: mSkill, score: 0, isJdSkill: true });
      }
    });
    categorySkills.sort((a, b) => b.score - a.score);
  } else {
    categorySkills = [...rawSkillEntries].sort((a, b) => b.score - a.score);
  }

  const filteredSkills = categorySkills.filter(
    ({ skill, score }) =>
      skill.toLowerCase().includes(searchQuery.toLowerCase()) && score >= filterScore
  );

  const getBarColor = (score) => {
    if (score >= 80) return "#10B981"; // Striking emerald green
    if (score >= 60) return "#38BDF8"; // Ice blue
    return "#F59E0B"; // Warm gold
  };

  const highlightKeywords = (text) => {
    if (!text) return "";
    const kws = ["Name", "Email", "Phone", "Contact", "Experience", "Education", "Skills"];
    const regex = new RegExp(`\\b(${kws.join("|")})\\b`, "gi");
    return text.replace(regex, (m) => `<span class="keyword-highlight">${m}</span>`);
  };

  return (
    <div className="app-root">

      {/* Capping Alert Popup Modal */}
      {showLimitModal && (
        <div className="modal-backdrop-custom fade-in" onClick={() => setShowLimitModal(false)}>
          <div className="modal-box-custom" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon-header warning">
              <AlertCircle size={32} />
            </div>
            <h3 className="modal-title">Batch Limit Reached</h3>
            <p className="modal-body-text">
              You can upload up to 10 resumes per batch. We have automatically kept the first 10 candidate resumes.
            </p>
            <button
              type="button"
              className="btn btn-primary rounded-pill px-4 py-2 fw-bold"
              onClick={() => setShowLimitModal(false)}
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <header className="app-header">
        <div className="header-inner">
          <div className="header-brand">
            <div className="brand-logo-bg">
              <Sparkles size={22} className="brand-icon" />
            </div>
            <div className="brand-title-group">
              <span className="brand-text">ResumeAI</span>
              <span className="brand-tag">AI Screener &amp; Matcher</span>
            </div>
          </div>

          <div className="mode-tabs">
            <button
              className={`mode-tab ${mode === "single" ? "active" : ""}`}
              onClick={() => setMode("single")}
            >
              <FileText size={16} /> Single Candidate
            </button>
            <button
              className={`mode-tab ${mode === "bulk" ? "active" : ""}`}
              onClick={() => setMode("bulk")}
            >
              <Users size={16} /> HR Bulk Comparison
            </button>
          </div>

          <button
            className="theme-btn"
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? "Switch to Cyber Silver Light Mode" : "Switch to Steel Slate Dark Mode"}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      {/* ── Main Container ── */}
      <main className="app-main">

        {/* ─── SINGLE CANDIDATE MODE ──────────────────────────────────────── */}
        {mode === "single" && (
          <>
            <div className="page-hero">
              <span className="hero-pill"><Zap size={14} /> AI Industrial Workspace</span>
              <h1 className="main-title">Resume &amp; Job Description Matcher</h1>
              <p className="subtitle">Evaluate candidate alignment, generate tailored cover letters, and uncover ATS insights.</p>
            </div>

            {/* ── Distinct Container Cards Section ── */}
            <div className="input-cards-grid">

              {/* Card 1: Resume Upload */}
              <div className="glass-card input-card">
                <div className="card-header-badge">
                  <FileText size={18} className="badge-icon" />
                  <span>1. Resume File</span>
                </div>
                <h2 className="card-heading">Candidate Resume</h2>
                <p className="card-subtext">Upload the candidate's PDF or Word resume.</p>

                <FileDropzone
                  file={file}
                  setFile={(f) => {
                    setFile(f);
                    resetSingleResults();
                  }}
                  labelText="Drag & Drop candidate resume here"
                />
              </div>

              {/* Card 2: Target Job Description */}
              <div className="glass-card input-card">
                <div className="card-header-badge">
                  <Target size={18} className="badge-icon" />
                  <span>2. Target Position</span>
                </div>
                <div className="card-heading-row">
                  <h2 className="card-heading">Job Description</h2>
                  {jd && (
                    <button
                      type="button"
                      className="btn-link-action"
                      onClick={() => setJd("")}
                    >
                      Clear text
                    </button>
                  )}
                </div>
                <p className="card-subtext">Paste the full job requirements and skills list.</p>

                <div className="jd-textarea-wrapper">
                  <textarea
                    className="form-control custom-textarea"
                    rows={6}
                    placeholder="Paste full job description requirements here..."
                    value={jd}
                    onChange={(e) => setJd(e.target.value)}
                  />
                  <div className="textarea-footer">
                    <span className="char-count">{jd.trim() ? `${jd.trim().split(/\s+/).length} words` : "Empty"}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* CTA Action Section */}
            <div className="action-row">
              <button className="btn-indigo-cta" onClick={handleUpload} disabled={loading}>
                {loading ? (
                  <><Spinner animation="border" size="sm" /> Analyzing Match...</>
                ) : (
                  <><Sparkles size={20} /> Run AI Analysis <ArrowRight size={18} /></>
                )}
              </button>
            </div>

            {/* ── Results Container ── */}
            {result && (
              <div className="glass-card results-card fade-in">

                <div className="results-header">
                  <h2 className="results-title"><BarChart2 size={24} /> Match Evaluation Results</h2>
                  <span className="results-subtitle">File: {file?.name || "Uploaded Resume"}</span>
                </div>

                {/* ── Prominent Radial Gauge Charts Row ── */}
                <div className="radial-gauges-grid">
                  <CircularProgressGauge
                    value={result.combined_score}
                    label="Overall Match"
                    sublabel="Combined Semantic + ATS"
                    color="auto"
                    size={145}
                    strokeWidth={11}
                  />

                  <CircularProgressGauge
                    value={result.semantic_score}
                    label="Semantic (AI) Fit"
                    sublabel="Contextual similarity"
                    color="#38BDF8"
                    size={125}
                    strokeWidth={9}
                  />

                  <CircularProgressGauge
                    value={result.ats?.ats_score}
                    label="ATS Keyword Score"
                    sublabel="Keyword overlap"
                    color="#4F46E5"
                    size={125}
                    strokeWidth={9}
                  />

                  <div className="radial-gauge-card stat-summary-card">
                    <div className="stat-summary-badge">
                      <CheckCircle size={28} />
                    </div>
                    <div className="stat-summary-value" style={{ color: getScoreColor(result.ats?.ats_score || result.combined_score) }}>
                      {result.ats?.matched_keywords?.length || 0} / {result.ats?.total_jd_skills || 0}
                    </div>
                    <div className="radial-label">Keywords Matched</div>
                    <div className="radial-sublabel">Found in candidate resume</div>
                  </div>
                </div>

                {/* Result Tabs */}
                <div className="result-tabs">
                  {[
                    { key: "overview", label: "Overview & Skills", icon: <BarChart2 size={16} /> },
                    { key: "cover", label: "Cover Letter", icon: <FileText size={16} /> },
                    { key: "tips", label: "Resume Tips", icon: <SlidersHorizontal size={16} /> },
                    { key: "snapshot", label: "Text Snapshot", icon: <Search size={16} /> },
                  ].map((t) => (
                    <button
                      key={t.key}
                      className={`result-tab ${activeTab === t.key ? "active" : ""}`}
                      onClick={() => setActiveTab(t.key)}
                    >
                      {t.icon} {t.label}
                    </button>
                  ))}
                </div>

                {/* ── Tab 1: Overview ── */}
                {activeTab === "overview" && (
                  <div className="tab-content-wrapper">

                    {/* ── 70% / 30% Dynamic Sub-Panel Row ── */}
                    <div className="assessment-subpanel-grid mb-4">
                      {/* Left 70%: AI Assessment text block */}
                      <div className="assessment-main-panel">
                        <h3 className="section-title text-indigo">
                          <Sparkles size={18} /> Recruiter AI Assessment
                        </h3>
                        <div className="text-box-styled">
                          {result.analysis?.llm_feedback || "No assessment generated."}
                        </div>
                      </div>

                      {/* Right 30%: Sleek Sidebar for Missing Target Keywords */}
                      <div className="missing-skills-sidebar">
                        <h3 className="section-title text-terracotta">
                          <AlertCircle size={18} /> Missing Target Keywords
                        </h3>
                        <div className="sidebar-styled-box">
                          {result.analysis?.missing_keywords?.length > 0 ? (
                            <div className="sidebar-kw-stack">
                              {result.analysis.missing_keywords.map((kw, i) => (
                                <span key={i} className="kw-chip missing w-100">
                                  <span>{kw}</span>
                                  <span className="kw-missing-badge">Missing</span>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <div className="sidebar-success-state">
                              <CheckCircle size={22} className="text-emerald" />
                              <span>All target skills matched!</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="section-divider" />

                    {/* Matched Keywords */}
                    <div className="mb-4">
                      <h3 className="section-title text-emerald">
                        <CheckCircle size={18} /> Matched Skill Keywords
                      </h3>
                      <div className="kw-chips">
                        {result.ats?.matched_keywords?.length > 0 ? (
                          result.ats.matched_keywords.map((kw, i) => (
                            <span key={i} className="kw-chip matched">{kw}</span>
                          ))
                        ) : (
                          <span className="kw-chip none">0 skill keywords matched</span>
                        )}
                      </div>
                    </div>

                    <div className="section-divider" />

                    {/* Skill Mapping Section */}
                    <div className="chart-section">
                      <h3 className="section-title mb-4"><BarChart2 size={18} /> Skill Scoring &amp; Category Breakdown</h3>

                      {/* Master Split Dashboard Layout */}
                      <div className="split-dashboard-wrapper fade-in">
                          {/* Donut Distribution Card at the top */}
                          <div className="split-donut-header-card mb-4">
                            <div className="donut-header-left">
                              <h4 className="split-header-title">Technical Domain Distribution</h4>
                              <p className="split-header-subtitle">
                                {rawSkillEntries.length} Total Skills Categorized Across {categoryChartData.length} Competency Domains
                              </p>
                            </div>

                            <div className="split-donut-chart-container">
                              <ResponsiveContainer width={190} height={140}>
                                <PieChart>
                                  <Pie
                                    data={categoryChartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={36}
                                    outerRadius={58}
                                    paddingAngle={4}
                                    dataKey="value"
                                    onClick={(entry) => setSelectedCategoryName(entry.name)}
                                    style={{ cursor: "pointer" }}
                                  >
                                    {categoryChartData.map((entry, index) => (
                                      <Cell
                                        key={`cell-${index}`}
                                        fill={entry.color}
                                        stroke={activeCategory?.name === entry.name ? "#FFFFFF" : "transparent"}
                                        strokeWidth={activeCategory?.name === entry.name ? 2 : 0}
                                      />
                                    ))}
                                  </Pie>
                                  <Tooltip
                                    formatter={(value, name, item) => [`${value} Skills`, item.payload.name]}
                                    contentStyle={{
                                      backgroundColor: darkMode ? "#1E293B" : "#FFFFFF",
                                      borderColor: darkMode ? "#334155" : "#E2E8F0",
                                      borderRadius: "10px",
                                      color: darkMode ? "#F8FAFC" : "#0F172A",
                                    }}
                                  />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          {/* Split Base Grid: Left Category Sidebar (40%) + Right Live Details (60%) */}
                          <div className="split-dashboard-grid">
                            {/* LEFT PANEL: Category Sidebar (40% Width) */}
                            <div className="split-left-sidebar">
                              {categoryChartData.map((cat, idx) => {
                                const isActive = activeCategory?.name === cat.name;
                                return (
                                  <button
                                    key={idx}
                                    type="button"
                                    className={`split-sidebar-btn ${isActive ? "active" : ""}`}
                                    style={{
                                      borderLeftColor: isActive ? cat.color : "transparent"
                                    }}
                                    onClick={() => setSelectedCategoryName(cat.name)}
                                  >
                                    <div className="split-btn-left">
                                      <span className="split-btn-dot" style={{ backgroundColor: cat.color }} />
                                      <span className="split-btn-name">{cat.name}</span>
                                    </div>
                                    <span
                                      className="split-btn-pill"
                                      style={{
                                        backgroundColor: isActive ? `${cat.color}25` : undefined,
                                        color: isActive ? cat.color : undefined
                                      }}
                                    >
                                      {cat.value} skills
                                    </span>
                                  </button>
                                );
                              })}
                            </div>

                            {/* RIGHT PANEL: Live Skill Details Container (60% Width) */}
                            <div className="split-right-panel">
                              {activeCategory && (
                                <div className="split-detail-card">
                                  {/* Panel Context Header */}
                                  <div className="split-panel-header">
                                    <div>
                                      <h4 className="split-category-heading">{activeCategory.name}</h4>
                                      <p className="split-category-subtext">
                                        {activeCategory.value} Total Skills • Avg Score {activeCategory.avgScore}%
                                      </p>
                                    </div>
                                    <span
                                      className="split-domain-match-badge"
                                      style={{
                                        backgroundColor: `${activeCategory.color}15`,
                                        color: activeCategory.color,
                                        borderColor: `${activeCategory.color}30`
                                      }}
                                    >
                                      {activeCategory.avgScore}% Domain Match
                                    </span>
                                  </div>

                                  {/* Embedded Controls: Live Search + Min Score Slider + Scope Filter */}
                                  <div className="split-controls-row">
                                    <div className="split-filter-search">
                                      <Search size={14} className="text-muted" />
                                      <input
                                        type="text"
                                        className="split-search-input"
                                        placeholder="Filter skills..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                      />
                                    </div>

                                    <div className="split-filter-slider">
                                      <span className="split-slider-label">
                                        Min: <strong>{filterScore}%</strong>
                                      </span>
                                      <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="5"
                                        value={filterScore}
                                        onChange={(e) => setFilterScore(Number(e.target.value))}
                                        className="form-range custom-range-slider"
                                      />
                                    </div>

                                    <div className="split-scope-pills">
                                      <button
                                        type="button"
                                        className={`split-scope-btn ${chartCategory === "all" ? "active" : ""}`}
                                        onClick={() => setChartCategory("all")}
                                      >
                                        All
                                      </button>
                                      <button
                                        type="button"
                                        className={`split-scope-btn ${chartCategory === "top" ? "active" : ""}`}
                                        onClick={() => setChartCategory("top")}
                                      >
                                        Top 15
                                      </button>
                                      <button
                                        type="button"
                                        className={`split-scope-btn ${chartCategory === "jd" ? "active" : ""}`}
                                        onClick={() => setChartCategory("jd")}
                                      >
                                        JD Targets
                                      </button>
                                    </div>
                                  </div>

                                  {/* Live Filtered Skill Row Progress Bar Items */}
                                  <div className="split-skills-stack">
                                    {activeCategory.skills
                                      .filter((s) => s.score >= filterScore)
                                      .filter((s) => s.skill.toLowerCase().includes(searchQuery.toLowerCase()))
                                      .filter((s) => {
                                        if (chartCategory === "jd") {
                                          return jdSkillsList.some((jdSkill) => jdSkill.toLowerCase() === s.skill.toLowerCase());
                                        }
                                        return true;
                                      })
                                      .slice(0, chartCategory === "top" ? 15 : undefined)
                                      .map((s, i) => {
                                        const prof = getProficiencyLabel(s.score);
                                        return (
                                          <div key={i} className="split-skill-item">
                                            <div className="split-skill-info-row">
                                              <span className="split-skill-title">{s.skill}</span>
                                              <div className="split-skill-meta">
                                                <span
                                                  className="split-prof-tag"
                                                  style={{ color: prof.color }}
                                                >
                                                  {prof.label}
                                                </span>
                                                <span className="split-match-percentage">
                                                  {s.score}% Match
                                                </span>
                                              </div>
                                            </div>
                                            <div className="split-progress-track">
                                              <div
                                                className="split-progress-fill"
                                                style={{
                                                  width: `${s.score}%`,
                                                  backgroundColor: getBarColor(s.score)
                                                }}
                                              />
                                            </div>
                                          </div>
                                        );
                                      })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                  </div>
                )}

                {/* ── Tab 2: Cover Letter ── */}
                {activeTab === "cover" && (
                  <div className="tab-content-wrapper">
                    <div className="tab-header">
                      <h3 className="section-title"><FileText size={18} /> Tailored Cover Letter</h3>
                      <button
                        className="copy-btn"
                        onClick={() => {
                          navigator.clipboard.writeText(result.analysis?.cover_letter || "");
                          alert("Cover letter copied to clipboard!");
                        }}
                      >
                        <Copy size={14} /> Copy Letter
                      </button>
                    </div>
                    <div className="cover-letter-view">
                      {result.analysis?.cover_letter ? (
                        result.analysis.cover_letter.split("\n\n").map((para, idx) => (
                          <p key={idx} className="cover-para">{para}</p>
                        ))
                      ) : (
                        <p className="text-muted">No cover letter generated.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Tab 3: Resume Tips ── */}
                {activeTab === "tips" && (
                  <div className="tab-content-wrapper">
                    <h3 className="section-title"><SlidersHorizontal size={18} /> Actionable Resume Improvement Recommendations</h3>
                    <div className="tips-formatted-container">
                      {result.analysis?.resume_tips ? (
                        result.analysis.resume_tips.split("\n").filter(t => t.trim()).map((tip, idx) => (
                          <div key={idx} className="tip-card">
                            <div className="tip-number">{idx + 1}</div>
                            <div className="tip-body">{tip.replace(/^\d+\.\s*/, "")}</div>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted">No specific tips available.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Tab 4: Text Snapshot ── */}
                {activeTab === "snapshot" && (
                  <div className="tab-content-wrapper">
                    <h3 className="section-title"><Search size={18} /> Document Text Extraction</h3>
                    <p className="subtitle">Extracted text preview from candidate document.</p>
                    <div
                      className="text-box-styled extracted-text"
                      dangerouslySetInnerHTML={{
                        __html: highlightKeywords(
                          (result.text || "No text extracted.").slice(0, 2000) +
                          ((result.text?.length || 0) > 2000 ? "…" : "")
                        ),
                      }}
                    />
                  </div>
                )}

              </div>
            )}
          </>
        )}

        {/* ─── BULK HR COMPARISON MODE ────────────────────────────────────── */}
        {mode === "bulk" && (
          <>
            <div className="page-hero">
              <span className="hero-pill"><Users size={14} /> HR Industrial Portal</span>
              <h1 className="main-title">Bulk Candidate Ranking</h1>
              <p className="subtitle">Compare multiple candidate resumes against a single job description simultaneously.</p>
            </div>

            <div className="input-cards-grid">
              <div className="glass-card input-card">
                <div className="card-header-badge">
                  <Users size={18} className="badge-icon" />
                  <span>1. Batch Resumes</span>
                </div>
                <h2 className="card-heading">Select Multiple Resumes</h2>
                <p className="card-subtext">Upload up to 10 PDF or Word resumes.</p>

                <BulkFileDropzone files={bulkFiles} setFiles={setBulkFiles} onShowLimitModal={() => setShowLimitModal(true)} />
              </div>

              <div className="glass-card input-card">
                <div className="card-header-badge">
                  <Target size={18} className="badge-icon" />
                  <span>2. Target Position</span>
                </div>
                <h2 className="card-heading">Job Description</h2>
                <p className="card-subtext">Requirements to rank candidates against.</p>

                <textarea
                  className="form-control custom-textarea"
                  rows={6}
                  placeholder="Paste the target job description..."
                  value={bulkJd}
                  onChange={(e) => setBulkJd(e.target.value)}
                />
              </div>
            </div>

            <div className="action-row">
              <button className="btn-indigo-cta" onClick={handleBulkUpload} disabled={bulkLoading}>
                {bulkLoading ? (
                  <><Spinner animation="border" size="sm" /> Ranking Candidates...</>
                ) : (
                  <><BarChart2 size={20} /> Rank All Candidates <ArrowRight size={18} /></>
                )}
              </button>
            </div>

            {rankings && rankings.length > 0 && (
              <div className="glass-card results-card fade-in mt-4">
                <h2 className="results-title mb-3"><BarChart2 size={24} /> Candidate Leaderboard</h2>
                <div className="table-responsive">
                  <table className="table custom-table">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Candidate File</th>
                        <th>Overall Match</th>
                        <th>ATS Score</th>
                        <th>Semantic</th>
                        <th>Matched Skills</th>
                        <th>Recruiter Verdict</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rankings.map((c, i) => (
                        <tr key={i}>
                          <td>
                            <span className={`rank-badge ${i === 0 ? "rank-1" : i === 1 ? "rank-2" : i === 2 ? "rank-3" : ""}`}>
                              #{c.rank}
                            </span>
                          </td>
                          <td className="fw-semibold">{c.filename}</td>
                          <td>
                            <span className={`overall-score-pill overall-match-pill ${getScorePillClass(c.combined_score)}`}>
                              {c.combined_score}%
                            </span>
                          </td>
                          <td className="text-gold fw-semibold">{c.ats_score}%</td>
                          <td className="text-ice-blue fw-semibold">{c.semantic_score}%</td>
                          <td>
                            <div className="kw-chips mini">
                              {c.matched_keywords && c.matched_keywords.length > 0 ? (
                                <>
                                  {c.matched_keywords.slice(0, 3).map((kw, j) => (
                                    <span key={j} className="kw-chip matched mini">{kw}</span>
                                  ))}
                                  {c.matched_keywords.length > 3 && (
                                    <span className="kw-chip mini">+{c.matched_keywords.length - 3}</span>
                                  )}
                                </>
                              ) : (
                                <span className="kw-chip none mini">0 matched</span>
                              )}
                            </div>
                          </td>
                          <td className="verdict-cell">{c.verdict}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

      </main>
    </div>
  );
}

export default App;
