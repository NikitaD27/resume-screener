import React, { useState, useEffect } from "react";
import { Spinner } from "react-bootstrap";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList, Cell,
} from "recharts";
import {
  UploadCloud, Moon, Sun, Search, SlidersHorizontal, FileText,
  BarChart2, CheckCircle, AlertCircle, Copy, Sparkles, Users,
  Trash2, ArrowRight, Zap, Target, Check
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
function BulkFileDropzone({ files, setFiles }) {
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
      setFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(Array.from(e.target.files));
    }
  };

  return (
    <div
      className={`file-dropzone ${isDragOver ? "drag-over" : ""} ${files.length > 0 ? "has-file" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        id="bulk-file-input"
        className="dropzone-input"
        accept=".pdf,.docx"
        multiple
        onChange={handleInputChange}
      />
      {files.length === 0 ? (
        <label htmlFor="bulk-file-input" className="dropzone-label">
          <div className="dropzone-icon-circle">
            <Users size={30} className="dropzone-icon" />
          </div>
          <div className="dropzone-text-group">
            <span className="dropzone-title">Drag &amp; Drop multiple Resumes here</span>
            <span className="dropzone-subtitle">or click to select up to 10 resumes (PDF, DOCX)</span>
          </div>
        </label>
      ) : (
        <div className="bulk-selected-container">
          <div className="bulk-header-info">
            <span className="fw-bold">{files.length} candidate resume(s) attached</span>
            <button
              type="button"
              className="btn btn-sm btn-outline-danger py-0"
              onClick={(e) => {
                e.stopPropagation();
                setFiles([]);
              }}
            >
              Clear all
            </button>
          </div>
          <div className="bulk-file-tags">
            {files.map((f, i) => (
              <span key={i} className="bulk-file-tag">
                <FileText size={13} /> {f.name}
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

  // Bulk State
  const [bulkFiles, setBulkFiles] = useState([]);
  const [bulkJd, setBulkJd] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [rankings, setRankings] = useState(null);

  const resetSingleResults = () => {
    setResult(null);
    setActiveTab("overview");
    setSearchQuery("");
    setFilterScore(0);
    setChartCategory("top");
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

                    <div className="two-col-grid mb-4">
                      <div className="assessment-box">
                        <h3 className="section-title text-indigo">
                          <Sparkles size={18} /> Recruiter AI Assessment
                        </h3>
                        <div className="text-box-styled">
                          {result.analysis?.llm_feedback || "No assessment generated."}
                        </div>
                      </div>

                      <div className="assessment-box">
                        <h3 className="section-title text-terracotta">
                          <AlertCircle size={18} /> Missing Target Keywords
                        </h3>
                        <div className="text-box-styled min-h-120">
                          {result.analysis?.missing_keywords?.length > 0 ? (
                            <div className="kw-chips">
                              {result.analysis.missing_keywords.map((kw, i) => (
                                <span key={i} className="kw-chip missing">{kw}</span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted"><Check size={16} /> All key target skills matched!</span>
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

                    {/* Skill Mapping Chart */}
                    <div className="chart-section">
                      <h3 className="section-title"><BarChart2 size={18} /> Skill Scoring Breakdown</h3>

                      <div className="chart-category-tabs">
                        <button
                          type="button"
                          className={`chart-cat-btn ${chartCategory === "top" ? "active" : ""}`}
                          onClick={() => setChartCategory("top")}
                        >
                          🌟 Top 15 Skills
                        </button>
                        <button
                          type="button"
                          className={`chart-cat-btn ${chartCategory === "jd" ? "active" : ""}`}
                          onClick={() => setChartCategory("jd")}
                        >
                          🎯 Position Target Skills ({jdSkillsList.length || matchedKws.length + missingKws.length})
                        </button>
                        <button
                          type="button"
                          className={`chart-cat-btn ${chartCategory === "all" ? "active" : ""}`}
                          onClick={() => setChartCategory("all")}
                        >
                          📊 All Detected Skills ({rawSkillEntries.length})
                        </button>
                      </div>

                      <div className="chart-controls">
                        <div className="custom-form-group mb-0 flex-grow-1">
                          <label className="custom-label"><Search size={14} /> Filter Skill Name</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="e.g. Python, Git..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                        </div>
                        <div className="custom-form-group mb-0 flex-grow-1">
                          <label className="custom-label">
                            <SlidersHorizontal size={14} /> Min Skill Score: {filterScore}%
                          </label>
                          <input
                            type="range"
                            className="form-range custom-range"
                            min="0"
                            max="100"
                            value={filterScore}
                            onChange={(e) => setFilterScore(Number(e.target.value))}
                          />
                        </div>
                      </div>

                      {filteredSkills.length > 0 ? (
                        <div className="chart-container">
                          <div className="chart-scroll-wrapper">
                            <div style={{ width: `${Math.max(100, (filteredSkills.length * 48 / 800) * 100)}%`, minWidth: `${Math.max(550, filteredSkills.length * 48)}px`, height: 330 }}>
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={filteredSkills} margin={{ top: 30, right: 15, left: -20, bottom: 70 }} barCategoryGap="15%">
                                  <XAxis
                                    dataKey="skill"
                                    interval={0}
                                    tickFormatter={(val) => truncateLabel(val, 13)}
                                    tick={{ fill: darkMode ? "#94A3B8" : "#475569", fontSize: 11, fontWeight: 500 }}
                                    angle={-45}
                                    textAnchor="end"
                                    height={85}
                                  />
                                  <YAxis domain={[0, 100]} tick={{ fill: darkMode ? "#94A3B8" : "#475569", fontSize: 12 }} />
                                  <Tooltip
                                    formatter={(value, name, item) => [`${value}% Score`, item.payload.skill]}
                                    contentStyle={{
                                      backgroundColor: darkMode ? "#1E293B" : "#FFFFFF",
                                      borderColor: darkMode ? "#334155" : "#E2E8F0",
                                      borderRadius: "12px",
                                      color: darkMode ? "#F8FAFC" : "#0F172A",
                                      boxShadow: "0 8px 24px rgba(0,0,0,0.18)"
                                    }}
                                  />
                                  <Bar dataKey="score" barSize={24} radius={[6, 6, 0, 0]}>
                                    {filteredSkills.map((entry, i) => (
                                      <Cell key={i} fill={getBarColor(entry.score)} />
                                    ))}
                                    <LabelList
                                      dataKey="score"
                                      position="top"
                                      fill={darkMode ? "#94A3B8" : "#475569"}
                                      fontSize={11}
                                      fontWeight="bold"
                                    />
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="empty-chart">
                          <p className="subtitle">No skills match the current search filter.</p>
                          <button className="btn btn-link text-indigo" onClick={() => { setSearchQuery(""); setFilterScore(0); setChartCategory("all"); }}>
                            Reset Filters
                          </button>
                        </div>
                      )}
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

                <BulkFileDropzone files={bulkFiles} setFiles={setBulkFiles} />
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

            {rankings && (
              <div className="glass-card results-card fade-in">
                <h2 className="results-title"><BarChart2 size={24} /> Candidate Leaderboard</h2>
                <div className="table-responsive mt-3">
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
