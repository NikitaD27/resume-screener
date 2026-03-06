import React, { useState, useEffect } from "react";
import { Spinner } from "react-bootstrap";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList, Cell,
} from "recharts";
import {
  UploadCloud, Moon, Sun, Search, SlidersHorizontal, FileText,
  BarChart2, CheckCircle, AlertCircle, Copy, Sparkles, Users
} from "lucide-react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

function App() {
  // ─── Theme ───────────────────────────────────────────────────────────────
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");

  useEffect(() => {
    document.body.classList.toggle("dark-mode", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  // ─── Mode: "single" | "bulk" ─────────────────────────────────────────────
  const [mode, setMode] = useState("single");

  // ─── Single Resume State ──────────────────────────────────────────────────
  const [file, setFile] = useState(null);
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);   // null until analysis runs

  // ─── Active tab in Results ────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("overview"); // overview | cover | tips | snapshot

  // ─── Skill chart filters ──────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [filterScore, setFilterScore] = useState(0);

  // ─── Bulk State ───────────────────────────────────────────────────────────
  const [bulkFiles, setBulkFiles] = useState([]);
  const [bulkJd, setBulkJd] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [rankings, setRankings] = useState(null);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const resetSingleResults = () => {
    setResult(null);
    setActiveTab("overview");
    setSearchQuery("");
    setFilterScore(0);
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0] || null);
    resetSingleResults();
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

  // ─── Derived data ──────────────────────────────────────────────────────────
  const skillScores = result
    ? Object.entries(result.analysis?.skill_scores || {}).map(([skill, score]) => ({ skill, score }))
    : [];

  const filteredSkills = skillScores.filter(
    ({ skill, score }) =>
      skill.toLowerCase().includes(searchQuery.toLowerCase()) && score >= filterScore
  );

  const getBarColor = (score) => {
    if (score >= 80) return "#10b981";
    if (score >= 60) return "#3b82f6";
    return "#f59e0b";
  };

  const highlightKeywords = (text) => {
    if (!text) return "";
    const kws = ["Name", "Email", "Phone", "Contact", "Experience", "Education", "Skills"];
    const regex = new RegExp(`\\b(${kws.join("|")})\\b`, "gi");
    return text.replace(regex, (m) => `<span class="keyword-highlight">${m}</span>`);
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="app-root">

      {/* ── Header ── */}
      <header className="app-header">
        <div className="header-inner">
          <div className="header-brand">
            <Sparkles size={28} className="brand-icon" />
            <span className="brand-text">ResumeAI</span>
          </div>

          {/* Mode switcher in header */}
          <div className="mode-tabs">
            <button
              className={`mode-tab ${mode === "single" ? "active" : ""}`}
              onClick={() => setMode("single")}
            >
              <FileText size={16} /> Single Resume
            </button>
            <button
              className={`mode-tab ${mode === "bulk" ? "active" : ""}`}
              onClick={() => setMode("bulk")}
            >
              <Users size={16} /> HR Comparison
            </button>
          </div>

          <button className="theme-btn" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      {/* ── Main Container ── */}
      <main className="app-main">

        {/* ─── SINGLE RESUME MODE ─────────────────────────────────────── */}
        {mode === "single" && (
          <>
            <div className="page-hero">
              <h1 className="main-title">AI Resume Screener</h1>
              <p className="subtitle">Upload a resume, paste a JD — get instant intelligent analysis.</p>
            </div>

            {/* Upload Card */}
            <div className="glass-card">
              <h2 className="card-heading"><UploadCloud size={22} /> Upload &amp; Analyze</h2>

              <div className="form-row">
                <div className="custom-form-group">
                  <label className="custom-label">Resume (PDF or DOCX)</label>
                  <input
                    type="file"
                    className="form-control"
                    accept=".pdf,.docx"
                    onChange={handleFileChange}
                  />
                </div>

                <div className="custom-form-group" style={{ flex: 2 }}>
                  <label className="custom-label">Target Job Description</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    placeholder="Paste the full job description here..."
                    value={jd}
                    onChange={(e) => setJd(e.target.value)}
                  />
                </div>
              </div>

              <button className="btn-premium" onClick={handleUpload} disabled={loading}>
                {loading
                  ? <><Spinner animation="border" size="sm" /> Analysing…</>
                  : <><UploadCloud size={18} /> Run Analysis</>
                }
              </button>
            </div>

            {/* ── Results ── */}
            {result && (
              <div className="glass-card fade-in">

                {/* Score Row */}
                <div className="score-row">
                  <div className="score-block main-score">
                    <span className="score-label">Overall Match</span>
                    <span className="score-value overall">{result.combined_score}%</span>
                  </div>
                  <div className="score-block">
                    <span className="score-label">Semantic (AI)</span>
                    <span className="score-value semantic">{result.semantic_score}%</span>
                  </div>
                  <div className="score-block">
                    <span className="score-label">ATS (Keywords)</span>
                    <span className="score-value ats">{result.ats?.ats_score}%</span>
                  </div>
                  <div className="score-block">
                    <span className="score-label">Keywords Matched</span>
                    <span className="score-value" style={{ color: "#10b981" }}>
                      {result.ats?.matched_keywords?.length} / {result.ats?.total_jd_skills}
                    </span>
                  </div>
                </div>

                {/* Result Tabs */}
                <div className="result-tabs">
                  {[
                    { key: "overview", label: "Overview", icon: <BarChart2 size={15} /> },
                    { key: "cover", label: "Cover Letter", icon: <FileText size={15} /> },
                    { key: "tips", label: "Resume Tips", icon: <SlidersHorizontal size={15} /> },
                    { key: "snapshot", label: "Text Snapshot", icon: <Search size={15} /> },
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

                {/* ── Tab: Overview ── */}
                {activeTab === "overview" && (
                  <>
                    {/* AI Feedback + Missing Keywords */}
                    <div className="two-col-grid">
                      <div>
                        <h3 className="section-title" style={{ color: "#8b5cf6" }}>
                          <FileText size={18} /> AI Assessment
                        </h3>
                        <div className="text-box">
                          {result.analysis?.llm_feedback || "No LLM feedback available."}
                        </div>
                      </div>
                      <div>
                        <h3 className="section-title" style={{ color: "#f59e0b" }}>
                          <AlertCircle size={18} /> Missing Keywords
                        </h3>
                        <div className="text-box" style={{ minHeight: 100 }}>
                          {result.analysis?.missing_keywords?.length > 0
                            ? <div className="kw-chips">
                              {result.analysis.missing_keywords.map((kw, i) => (
                                <span key={i} className="kw-chip missing">{kw}</span>
                              ))}
                            </div>
                            : <span className="text-muted">No major missing keywords 🎉</span>
                          }
                        </div>
                      </div>
                    </div>

                    <div className="section-divider" />

                    {/* Matched Keywords */}
                    <h3 className="section-title" style={{ color: "#10b981" }}>
                      <CheckCircle size={18} /> Matched Keywords
                    </h3>
                    <div className="kw-chips mb-4">
                      {result.ats?.matched_keywords?.map((kw, i) => (
                        <span key={i} className="kw-chip matched">{kw}</span>
                      ))}
                      {(!result.ats?.matched_keywords?.length) && (
                        <span className="text-muted">No matched keywords found.</span>
                      )}
                    </div>

                    <div className="section-divider" />

                    {/* Skill Mapping Chart */}
                    <h3 className="section-title"><BarChart2 size={18} /> Skill Mapping</h3>

                    <div className="chart-controls">
                      <div className="custom-form-group mb-0">
                        <label className="custom-label"><Search size={14} /> Search Skills</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. Python"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <div className="custom-form-group mb-0">
                        <label className="custom-label">
                          <SlidersHorizontal size={14} /> Min Score: {filterScore}%
                        </label>
                        <input
                          type="range"
                          className="form-range custom-range"
                          min="0"
                          max="100"
                          value={filterScore}
                          onChange={(e) => setFilterScore(Number(e.target.value))}
                          style={{ "--fill-percent": `${filterScore}%` }}
                        />
                      </div>
                    </div>

                    {filteredSkills.length > 0 ? (
                      <div className="chart-container">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={filteredSkills} margin={{ top: 30, right: 10, left: -20, bottom: 60 }}>
                            <XAxis
                              dataKey="skill"
                              interval={0}
                              tick={{ fill: darkMode ? "#cbd5e1" : "#475569", fontSize: 12 }}
                              angle={-40}
                              textAnchor="end"
                              height={90}
                            />
                            <YAxis domain={[0, 100]} tick={{ fill: darkMode ? "#cbd5e1" : "#475569", fontSize: 12 }} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: darkMode ? "#1e293b" : "#fff",
                                borderColor: darkMode ? "#334155" : "#e2e8f0",
                                borderRadius: "8px",
                                color: darkMode ? "#f8fafc" : "#1e293b",
                              }}
                            />
                            <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                              {filteredSkills.map((entry, i) => (
                                <Cell key={i} fill={getBarColor(entry.score)} />
                              ))}
                              <LabelList
                                dataKey="score"
                                position="top"
                                fill={darkMode ? "#cbd5e1" : "#475569"}
                                fontSize={11}
                                fontWeight="bold"
                              />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="empty-chart">
                        <p className="subtitle">No skills match your filters.</p>
                        <button className="btn btn-link" onClick={() => { setSearchQuery(""); setFilterScore(0); }}>
                          Clear Filters
                        </button>
                      </div>
                    )}
                  </>
                )}

                {/* ── Tab: Cover Letter ── */}
                {activeTab === "cover" && (
                  <div>
                    <div className="tab-header">
                      <h3 className="section-title"><FileText size={18} /> Generated Cover Letter</h3>
                      <button
                        className="copy-btn"
                        onClick={() => {
                          navigator.clipboard.writeText(result.analysis?.cover_letter || "");
                          alert("Copied to clipboard!");
                        }}
                      >
                        <Copy size={14} /> Copy
                      </button>
                    </div>
                    <textarea
                      className="form-control text-box-area"
                      rows={16}
                      readOnly
                      value={result.analysis?.cover_letter || "No cover letter generated."}
                    />
                  </div>
                )}

                {/* ── Tab: Resume Tips ── */}
                {activeTab === "tips" && (
                  <div>
                    <h3 className="section-title"><SlidersHorizontal size={18} /> How to Improve Your Resume</h3>
                    <div className="text-box tips-box">
                      {result.analysis?.resume_tips || "No tips generated."}
                    </div>
                  </div>
                )}

                {/* ── Tab: Text Snapshot ── */}
                {activeTab === "snapshot" && (
                  <div>
                    <h3 className="section-title"><Search size={18} /> Document Text Snapshot</h3>
                    <p className="subtitle">First 1500 characters of extracted text. Keywords highlighted.</p>
                    <div
                      className="text-box extracted-text"
                      dangerouslySetInnerHTML={{
                        __html: highlightKeywords(
                          (result.text || "No text extracted.").slice(0, 1500) +
                          ((result.text?.length || 0) > 1500 ? "…" : "")
                        ),
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ─── BULK / HR MODE ────────────────────────────────────────────── */}
        {mode === "bulk" && (
          <>
            <div className="page-hero">
              <h1 className="main-title">HR Comparison Mode</h1>
              <p className="subtitle">Upload up to 10 resumes and rank all candidates against one job description.</p>
            </div>

            <div className="glass-card">
              <h2 className="card-heading"><Users size={22} /> Bulk Resume Upload</h2>

              <div className="custom-form-group">
                <label className="custom-label">Resumes (PDF / DOCX — select multiple)</label>
                <input
                  type="file"
                  className="form-control"
                  accept=".pdf,.docx"
                  multiple
                  onChange={(e) => {
                    setBulkFiles(Array.from(e.target.files));
                    setRankings(null);
                  }}
                />
                {bulkFiles.length > 0 && (
                  <p className="mt-2 small text-muted">{bulkFiles.length} file(s) selected: {bulkFiles.map(f => f.name).join(", ")}</p>
                )}
              </div>

              <div className="custom-form-group">
                <label className="custom-label">Target Job Description</label>
                <textarea
                  className="form-control"
                  rows={4}
                  placeholder="Paste the job description here..."
                  value={bulkJd}
                  onChange={(e) => setBulkJd(e.target.value)}
                />
              </div>

              <button
                className="btn-premium"
                style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}
                onClick={handleBulkUpload}
                disabled={bulkLoading}
              >
                {bulkLoading
                  ? <><Spinner animation="border" size="sm" /> Ranking…</>
                  : <><BarChart2 size={18} /> Rank All Candidates</>
                }
              </button>
            </div>

            {rankings && (
              <div className="glass-card fade-in">
                <h2 className="card-heading"><BarChart2 size={22} /> Candidate Rankings</h2>
                <div className="table-responsive">
                  <table className="table table-hover custom-table">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Resume</th>
                        <th>Overall</th>
                        <th>ATS</th>
                        <th>Semantic</th>
                        <th>Matched Skills</th>
                        <th>One-Line Verdict</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rankings.map((c, i) => (
                        <tr key={i}>
                          <td>
                            <span className={`rank-badge ${i === 0 ? "gold" : i === 1 ? "silver" : i === 2 ? "bronze" : ""}`}>
                              #{c.rank}
                            </span>
                          </td>
                          <td className="fw-semibold">{c.filename}</td>
                          <td className="fw-bold score-overall">{c.combined_score}%</td>
                          <td className="text-warning fw-semibold">{c.ats_score}%</td>
                          <td className="text-info fw-semibold">{c.semantic_score}%</td>
                          <td>
                            <div className="kw-chips mini">
                              {(c.matched_keywords || []).slice(0, 4).map((kw, j) => (
                                <span key={j} className="kw-chip matched mini">{kw}</span>
                              ))}
                              {(c.matched_keywords?.length || 0) > 4 && (
                                <span className="kw-chip mini">+{c.matched_keywords.length - 4}</span>
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
