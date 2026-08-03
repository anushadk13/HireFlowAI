import { useRef, useState } from "react";
import LiveCoverLetter from "./LiveCoverLetter.jsx";
import StudentResumePreview from "./StudentResumePreview.jsx";
import "./StudentPortal.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

const SAMPLE_RESUME = `Nina Carter
AI Engineer

Summary
- Built RAG prototypes and resume screening tools using Python, FastAPI, LangChain, and ChromaDB.
- Improved ranking workflows for hiring teams by combining keyword extraction and semantic scoring.

Experience
- Developed internal tools for candidate search, JD parsing, and interview prep automation.
- Worked on API integration, data cleanup, and dashboard delivery with React and TypeScript.

Projects
- Built an AI Medical Assistant using LangChain, FastAPI, RAG, and ChromaDB.
- Created a recruiter dashboard for ATS scoring, shortlist recommendations, and analytics.

Skills
Python, SQL, React, FastAPI, Docker, AWS, TensorFlow, LangChain`;

const SAMPLE_JD = `Software Engineer JD

We are looking for a Software Engineer with strong Python, SQL, React, and FastAPI experience.
You will build internal tools, work with Docker and AWS, and collaborate with product, design, and engineering teams.
Experience with APIs, analytics dashboards, and scalable workflows is preferred.
Bachelor's degree or equivalent experience required.`;

const SIDEBAR_ITEMS = [
  { id: "analyzer", label: "Resume Analyzer", active: true },
  { id: "preview", label: "100% Score Resume Preview" },
  { id: "cover-letter", label: "Cover Letter" },
];

const DEFAULT_SKILLS = ["Python", "FastAPI", "LangChain", "React", "SQL", "Docker", "AWS", "APIs"];
const DEFAULT_MISSING = ["LangChain", "CI/CD", "Kubernetes"];
const DEFAULT_IMPROVEMENTS = [
  "Add more metrics to your experience",
  "Highlight your AWS and Docker experience",
  "Include more relevant projects",
  "Show stronger system design evidence",
];

async function postJSON(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Request to ${path} failed with status ${res.status}`);
  }
  return res.json();
}

function pickArray(value) {
  return Array.isArray(value) ? value : [];
}

function formatPercent(value, fallback) {
  const next = Number.isFinite(Number(value)) ? Number(value) : fallback;
  return Math.max(0, Math.min(100, Math.round(next)));
}

function formatFileSize(size) {
  if (!size) return "";
  const kb = size / 1024;
  return kb < 1024 ? `${Math.max(1, Math.round(kb))} KB` : `${(kb / 1024).toFixed(1)} MB`;
}

function getResumeHeader(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  return {
    name: lines[0] || "Nina Carter",
    title: lines[1] || "AI Engineer",
  };
}

function ScoreRing({ value, tone = "purple" }) {
  return (
    <div className={`student-portal__score-ring student-portal__score-ring--${tone}`} style={{ "--score": value }}>
      <div className="student-portal__score-ring-inner">
        <div className="student-portal__score-ring-value">{value}</div>
        <div className="student-portal__score-ring-scale">/100</div>
      </div>
    </div>
  );
}

function StatBar({ value, tone = "purple" }) {
  return (
    <div className="student-portal__statbar">
      <div className="student-portal__statbar-track">
        <span className={`student-portal__statbar-fill student-portal__statbar-fill--${tone}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function ChipList({ items, tone = "purple" }) {
  return (
    <div className="student-portal__chip-list">
      {items.map((item) => (
        <span key={item} className={`student-portal__chip student-portal__chip--${tone}`}>
          {item}
        </span>
      ))}
    </div>
  );
}

export default function StudentPortal() {
  const resumeInputRef = useRef(null);
  const [resume, setResume] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [resumeMode, setResumeMode] = useState("upload");
  const [activeTemplate, setActiveTemplate] = useState("Professional");
  const [activeSection, setActiveSection] = useState("analyzer");
  const [resumeFileName, setResumeFileName] = useState("Nina_Carter_Resume.pdf");
  const [resumeFileSize, setResumeFileSize] = useState("234 KB");
  const [coverPersonalization, setCoverPersonalization] = useState(
    "Dear Hiring Manager, I am writing to express my interest in the role and my experience in building reliable software systems."
  );

  const [analysisResult, setAnalysisResult] = useState(null);
  const [matchResult, setMatchResult] = useState(null);
  const [coverLetter, setCoverLetter] = useState("");

  const [loading, setLoading] = useState(null);
  const [error, setError] = useState("");

  const summary = getResumeHeader(resume);
  const hasAnalysis = Boolean(analysisResult || matchResult);
  const score = hasAnalysis
    ? formatPercent(matchResult?.match_score ?? analysisResult?.resume_score ?? analysisResult?.ats_score ?? 88, 88)
    : 0;
  const skillsMatch = hasAnalysis ? formatPercent(matchResult?.skills_match_score ?? analysisResult?.skills_match_score ?? 87, 87) : 0;
  const experienceMatch = hasAnalysis ? formatPercent(analysisResult?.experience_score ?? 80, 80) : 0;
  const keywordsMatch = hasAnalysis ? formatPercent(analysisResult?.keywords_score ?? 85, 85) : 0;
  const formatMatch = hasAnalysis ? formatPercent(analysisResult?.formatting_score ?? 90, 90) : 0;

  const matchedSkills = hasAnalysis
    ? pickArray(analysisResult?.matched_skills).length
      ? analysisResult.matched_skills
      : pickArray(matchResult?.skills_match).length
        ? matchResult.skills_match
        : DEFAULT_SKILLS
    : [];

  const missingSkills = hasAnalysis
    ? pickArray(analysisResult?.missing_skills).length
      ? analysisResult.missing_skills
      : pickArray(matchResult?.missing_skills).length
        ? matchResult.missing_skills
        : DEFAULT_MISSING
    : [];

  const improvementTips = hasAnalysis
    ? pickArray(matchResult?.improvement?.improvement_suggestions).length
      ? matchResult.improvement.improvement_suggestions
      : pickArray(matchResult?.improvement?.suggestions).length
        ? matchResult.improvement.suggestions
        : DEFAULT_IMPROVEMENTS
    : [];

  async function runAnalysis(resumeText = resume, jobText = jobDescription) {
    if (!resumeText.trim() || !jobText.trim()) {
      setError("Paste both a resume and a job description first.");
      return;
    }
    setLoading("analysis");
    try {
      const analysis = await postJSON("/api/resume/analyze", {
        resume_text: resumeText,
        job_description: jobText,
      });
      const match = await postJSON("/api/resume/match", {
        resume_text: resumeText,
        job_description: jobText,
      });
      setAnalysisResult(analysis);
      setMatchResult({
        ...analysis,
        ...match,
        strengths: pickArray(analysis.matched_skills).length ? analysis.matched_skills : pickArray(match.skills_match),
        gaps: pickArray(analysis.missing_skills).length ? analysis.missing_skills : pickArray(match.missing_skills),
      });
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  }

  async function handleResumeUpload(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const text = await file.text();
      setResume(text);
      setResumeMode("upload");
      setResumeFileName(file.name);
      setResumeFileSize(formatFileSize(file.size));
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  function handleResetResume() {
    setResume(SAMPLE_RESUME);
    setResumeMode("upload");
    setResumeFileName("Nina_Carter_Resume.pdf");
    setResumeFileSize("234 KB");
    setError("");
    void runAnalysis(SAMPLE_RESUME, jobDescription);
  }

  function handleNewAnalysis() {
    void runAnalysis();
  }

  async function handleCoverLetter() {
    if (!resume.trim() || !jobDescription.trim()) {
      setError("Paste both a resume and a job description first.");
      return;
    }
    setLoading("cover-letter");
    try {
      const result = await postJSON("/api/resume/cover-letter", {
        resume_text: resume,
        job_description: jobDescription,
      });
      setCoverLetter(result.cover_letter || "");
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="student-portal">
      <aside className="student-portal__sidebar">
        <div className="student-portal__brand">
          <div className="student-portal__brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div>
            <div className="student-portal__brand-title">HireFlow AI</div>
            <div className="student-portal__brand-subtitle">AI Resume &amp; Cover Letter Assistant</div>
          </div>
        </div>

        <nav className="student-portal__nav" aria-label="Student portal navigation">
          {SIDEBAR_ITEMS.map((item) => (
            <button
              key={item.label}
              className={`student-portal__nav-item${activeSection === item.id || item.active ? " is-active" : ""}`}
              type="button"
              onClick={() => setActiveSection(item.id)}
            >
              <span className="student-portal__nav-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

      </aside>

      <main className="student-portal__content">
        {error && <div className="student-portal__error">{error}</div>}

        {activeSection === "preview" ? (
          <StudentResumePreview summary={summary} matchedSkills={matchedSkills} score={score} />
        ) : activeSection === "cover-letter" ? (
          <LiveCoverLetter
            coverLetter={coverLetter}
            loading={loading}
            onBackToDashboard={() => setActiveSection("analyzer")}
            onGenerateCoverLetter={handleCoverLetter}
            activeTemplate={activeTemplate}
            setActiveTemplate={setActiveTemplate}
            personalization={coverPersonalization}
            setPersonalization={setCoverPersonalization}
          />
        ) : (
          <section className="student-portal__analyzer-layout">
            <article className="student-portal__panel">
              <div className="student-portal__panel-header">
                <div>
                  <div className="student-portal__panel-step">
                    <span>1</span>
                    <h2>Job Description</h2>
                  </div>
                  <p className="student-portal__panel-subtitle">Paste the job description</p>
                </div>
              </div>

              <textarea
                className="student-portal__textarea student-portal__textarea--job"
                placeholder="Paste the job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />

              <div className="student-portal__section-label">
                <span aria-hidden="true">📋</span>
                <h3>Extracted Job Details</h3>
              </div>

              <div className="student-portal__job-meta">
                <div className="student-portal__detail-card">
                  <span className="student-portal__meta-label">Experience</span>
                  <strong>{hasAnalysis ? "2-4 Years" : "N/A"}</strong>
                </div>
                <div className="student-portal__detail-card">
                  <span className="student-portal__meta-label">Salary</span>
                  <strong>{hasAnalysis ? "$120K - $180K" : "N/A"}</strong>
                </div>
                <div className="student-portal__detail-card">
                  <span className="student-portal__meta-label">Type</span>
                  <strong>{hasAnalysis ? "Full-time" : "N/A"}</strong>
                </div>
              </div>

              <div className="student-portal__job-section">
                <h3>About the role</h3>
                <div className="student-portal__empty-panel">
                  <div className="student-portal__empty-panel-icon" aria-hidden="true">
                    ◌
                  </div>
                  <strong>{hasAnalysis ? "Parsed job summary will appear here." : "Your pasted job description will appear here."}</strong>
                  <p>We&apos;ll extract key details and requirements automatically.</p>
                </div>
              </div>

              <div className="student-portal__job-section">
                <h3>Key Skills Detected</h3>
                {matchedSkills.length ? (
                  <ChipList items={matchedSkills.slice(0, 8)} />
                ) : (
                  <div className="student-portal__empty-panel">
                    <div className="student-portal__empty-panel-icon" aria-hidden="true">
                      ✧
                    </div>
                    <strong>Detected skills will be shown here</strong>
                    <p>We&apos;ll highlight important skills from the job description.</p>
                  </div>
                )}
              </div>

              <button className="student-portal__text-link" type="button" onClick={handleNewAnalysis}>
                Run analysis <span aria-hidden="true">→</span>
              </button>
            </article>

            <article className="student-portal__panel student-portal__panel--resume">
              <div className="student-portal__panel-header student-portal__panel-header--split">
                <div>
                  <div className="student-portal__panel-step">
                    <span>2</span>
                    <h2>Your Resume</h2>
                  </div>
                  <p className="student-portal__panel-subtitle">Upload or paste your resume</p>
                </div>

      
              </div>

              <div className="student-portal__upload-tabs" role="tablist" aria-label="Resume source">
                <button
                  className={`student-portal__upload-tab${resumeMode === "upload" ? " is-active" : ""}`}
                  type="button"
                  onClick={() => setResumeMode("upload")}
                >
                  Upload File
                </button>
                <button
                  className={`student-portal__upload-tab${resumeMode === "paste" ? " is-active" : ""}`}
                  type="button"
                  onClick={() => setResumeMode("paste")}
                >
                  Paste Text
                </button>
              </div>

              {resumeMode === "upload" ? (
                <div className="student-portal__upload-summary">
                  <div className="student-portal__dropzone" onClick={() => resumeInputRef.current?.click()} role="button" tabIndex={0}>
                    <div className="student-portal__dropzone-title">Drag &amp; drop your file here</div>
                    <div className="student-portal__dropzone-copy">or</div>
                    <button className="student-portal__dropzone-button" type="button" onClick={() => resumeInputRef.current?.click()}>
                      Choose File
                    </button>
                    <div className="student-portal__dropzone-copy">Supports PDF, DOCX, TXT and Markdown</div>
                  </div>

                  <div className="student-portal__success-callout">
                    <span className="student-portal__success-callout-icon">✓</span>
                    <div>
                      <strong>Resume parsed successfully</strong>
                      <p>We extracted text and key information from your resume.</p>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="student-portal__editor-card">
                <div className="student-portal__editor-toolbar" aria-hidden="true">
                  <span>↶</span>
                  <span>↷</span>
                  <span className="student-portal__toolbar-divider" />
                  <span>Paragraph</span>
                  <span className="student-portal__toolbar-divider" />
                  <span>B</span>
                  <span>I</span>
                  <span>U</span>
                  <span className="student-portal__toolbar-divider" />
                  <span>≡</span>
                  <span>☰</span>
                  <span>🔗</span>
                  <span>{"{}"}</span>
                  <span>&lt;/&gt;</span>
                </div>

                <textarea
                  className="student-portal__textarea student-portal__textarea--resume"
                  value={resume}
                  onChange={(e) => setResume(e.target.value)}
                  aria-label="Resume editor"
                  placeholder={`Your resume content will appear here...
You can edit the text if needed.`}
                />

                <div className="student-portal__editor-footer">
                  <span>{resume.length} / 10000 characters</span>
                </div>
              </div>
            </article>

            <section className="student-portal__stats-grid">
              <article className="student-portal__stat-card">
                <div className="student-portal__stat-label">ATS SCORE</div>
                <div className="student-portal__stat-body">
                  <ScoreRing value={score} tone="purple" />
                  <div className="student-portal__stat-copy">
                    <strong>{hasAnalysis ? "Great Match! 🎉" : "No match yet"}</strong>
                    <p>{hasAnalysis ? "Your resume is well optimized for this job." : "Enter job description and upload your resume to see the score."}</p>
                    <span className="student-portal__hint-pill">{hasAnalysis ? "Top 14% of candidates" : "-"}</span>
                  </div>
                </div>
                <div className="student-portal__stat-metrics">
                  <div><span>Overall Match</span><StatBar value={score} tone="purple" /></div>
                  <div><span>Skills Match</span><StatBar value={skillsMatch} tone="purple" /></div>
                  <div><span>Experience Match</span><StatBar value={experienceMatch} tone="purple" /></div>
                  <div><span>Keywords Match</span><StatBar value={keywordsMatch} tone="purple" /></div>
                  <div><span>Format &amp; Structure</span><StatBar value={formatMatch} tone="purple" /></div>
                </div>
              </article>

              <article className="student-portal__stat-card">
                <div className="student-portal__stat-label">SKILLS MATCH</div>
                <div className="student-portal__big-number">{skillsMatch}%</div>
                <StatBar value={skillsMatch} tone="green" />
                <p className="student-portal__stat-note">{hasAnalysis ? "Great match! You have most of the required skills." : "No skills matched yet."}</p>
                <button className="student-portal__text-link" type="button">
                  View Details <span aria-hidden="true">→</span>
                </button>
              </article>

              <article className="student-portal__stat-card">
                <div className="student-portal__stat-label">MISSING SKILLS</div>
                <div className="student-portal__missing-head">
                  <span className="student-portal__missing-count">{missingSkills.length}</span>
                  <p>{hasAnalysis ? "Skills that you might be missing." : "Enter job description to see missing skills"}</p>
                </div>
                {missingSkills.length ? (
                  <ChipList items={missingSkills} tone="amber" />
                ) : (
                  <div className="student-portal__empty-inline">Enter job description to see missing skills</div>
                )}
                <button className="student-portal__text-link" type="button">
                  View Suggestions <span aria-hidden="true">→</span>
                </button>
              </article>

              <article className="student-portal__stat-card">
                <div className="student-portal__stat-label">IMPROVEMENT SUGGESTIONS</div>
                {improvementTips.length ? (
                  <ul className="student-portal__suggestion-list">
                    {improvementTips.slice(0, 4).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="student-portal__empty-panel student-portal__empty-panel--tight">
                    <strong>Get AI-powered suggestions to improve your resume for better matches.</strong>
                  </div>
                )}
                <button className="student-portal__text-link" type="button">
                  View Suggestions <span aria-hidden="true">→</span>
                </button>
              </article>
            </section>
          </section>
        )}
      </main>
    </div>
  );
}
