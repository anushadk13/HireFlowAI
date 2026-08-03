import { useEffect, useRef, useState } from "react";
import LiveCoverLetter from "./LiveCoverLetter.jsx";
import "./StudentPortal.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";
const STUDENT_LOGO_SRC = import.meta.env.VITE_STUDENT_LOGO_SRC || "/images/student.png";

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

export default function StudentPortal({ onBack }) {
  const resumeInputRef = useRef(null);
  const [resume, setResume] = useState(SAMPLE_RESUME);
  const [jobDescription, setJobDescription] = useState(SAMPLE_JD);
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

  useEffect(() => {
    void runAnalysis(SAMPLE_RESUME, SAMPLE_JD);
  }, []);

  const summary = getResumeHeader(resume);
  const score = formatPercent(
    matchResult?.match_score ?? analysisResult?.resume_score ?? analysisResult?.ats_score ?? 88,
    88
  );
  const skillsMatch = formatPercent(
    matchResult?.skills_match_score ?? analysisResult?.skills_match_score ?? 87,
    87
  );
  const completeness = formatPercent(analysisResult?.resume_score ?? analysisResult?.ats_score ?? 85, 85);
  const experienceMatch = formatPercent(analysisResult?.experience_score ?? 80, 80);
  const keywordsMatch = formatPercent(analysisResult?.keywords_score ?? 85, 85);
  const formatMatch = formatPercent(analysisResult?.formatting_score ?? 90, 90);

  const matchedSkills = pickArray(analysisResult?.matched_skills).length
    ? analysisResult.matched_skills
    : pickArray(matchResult?.skills_match).length
      ? matchResult.skills_match
      : DEFAULT_SKILLS;

  const missingSkills = pickArray(analysisResult?.missing_skills).length
    ? analysisResult.missing_skills
    : pickArray(matchResult?.missing_skills).length
      ? matchResult.missing_skills
      : DEFAULT_MISSING;

  const improvementTips = pickArray(matchResult?.improvement?.improvement_suggestions).length
    ? matchResult.improvement.improvement_suggestions
    : pickArray(matchResult?.improvement?.suggestions).length
      ? matchResult.improvement.suggestions
      : DEFAULT_IMPROVEMENTS;

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

        {activeSection !== "cover-letter" ? (
          <>
            <section className="student-portal__workspace-grid">
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

            <div className="student-portal__job-card">
              <div className="student-portal__job-topline">
                <div className="student-portal__company-mark">G</div>
                <div className="student-portal__job-company">
                  <strong>Google</strong>
                  <div>Mountain View, CA • Full-time</div>
                </div>
                <span className="student-portal__job-tag">Software Engineer</span>
              </div>

              <div className="student-portal__job-meta">
                <div>
                  <span className="student-portal__meta-label">Experience</span>
                  <strong>2-4 Years</strong>
                </div>
                <div>
                  <span className="student-portal__meta-label">Salary</span>
                  <strong>$120K - $180K</strong>
                </div>
                <div>
                  <span className="student-portal__meta-label">Type</span>
                  <strong>Full-time</strong>
                </div>
              </div>

              <div className="student-portal__job-section">
                <h3>About the role</h3>
                <textarea
                  className="student-portal__textarea student-portal__textarea--job"
                  placeholder="Paste the job description here"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                />
                <div className="student-portal__counter">{jobDescription.length} / 5000 characters</div>
              </div>

              <div className="student-portal__job-section">
                <h3>Key Skills Detected</h3>
                <ChipList items={matchedSkills.slice(0, 8)} />
              </div>

              <button className="student-portal__text-link" type="button" onClick={handleNewAnalysis}>
                Run analysis <span aria-hidden="true">→</span>
              </button>
            </div>
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

              <div className="student-portal__panel-actions">
                <button className="student-portal__ghost-button" type="button" onClick={() => resumeInputRef.current?.click()}>
                  ⤴ Upload File
                </button>
                <button className="student-portal__ghost-button" type="button" onClick={handleResetResume}>
                  ⌁ New Resume
                </button>
                <input
                  ref={resumeInputRef}
                  className="student-portal__hidden-input"
                  type="file"
                  accept=".txt,.md,.csv,.json,.html,.htm,.log,.pdf,.docx"
                  onChange={handleResumeUpload}
                />
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

            <div className="student-portal__upload-summary">
              <div className="student-portal__file-card">
                <div className="student-portal__file-pill">
                  <span className="student-portal__file-icon">PDF</span>
                  <div>
                    <strong>{resumeFileName}</strong>
                    <span>{resumeFileSize}</span>
                  </div>
                </div>
                <span className="student-portal__success-dot" />
              </div>

              <div className="student-portal__dropzone" onClick={() => resumeInputRef.current?.click()} role="button" tabIndex={0}>
                <div className="student-portal__dropzone-icon" aria-hidden="true">
                  ⇧
                </div>
                <div className="student-portal__dropzone-title">Drag &amp; drop your file here</div>
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
              />

              <div className="student-portal__editor-footer">
                <span>{resume.length} / 10000 characters</span>
                <span className="student-portal__saved">✓ Resume saved</span>
              </div>
            </div>
          </article>

          <article className="student-portal__panel student-portal__panel--preview">
            <div className="student-portal__panel-header">
              <div>
                <div className="student-portal__panel-step">
                  <span>4</span>
                  <h2>100% Score Resume Preview</h2>
                </div>
                <p className="student-portal__panel-subtitle">See how a perfect resume looks</p>
              </div>
            </div>

            <div className="student-portal__preview-document">
              <div className="student-portal__preview-title">{summary.name.toUpperCase()}</div>
              <div className="student-portal__preview-role">{summary.title}</div>
              <div className="student-portal__preview-contact">
                <span>nina.carter@email.com</span>
                <span>+1 (555) 123-4567</span>
                <span>San Francisco, CA</span>
                <span>linkedin.com/in/ninacarter</span>
              </div>

              <div className="student-portal__preview-section">
                <h3>SUMMARY</h3>
                <p>
                  AI Engineer with 3+ years of experience building intelligent systems and internal tools using Python,
                  FastAPI, and modern ML techniques. Passionate about turning data into impactful products.
                </p>
              </div>

              <div className="student-portal__preview-section">
                <h3>SKILLS</h3>
                <p>{matchedSkills.slice(0, 8).join(" • ")}</p>
              </div>

              <div className="student-portal__preview-section">
                <h3>EXPERIENCE</h3>
                <div className="student-portal__preview-row">
                  <strong>AI Engineer • Tech Solutions Inc.</strong>
                  <span>Jan 2023 - Present</span>
                </div>
                <ul className="student-portal__preview-list">
                  <li>Built RAG-based prototypes using LangChain and OpenAI, improving answer accuracy by 35%.</li>
                  <li>Developed internal tools for candidate search, JD parsing, and interview automation.</li>
                  <li>Integrated APIs and optimized data pipelines, reducing processing time by 40%.</li>
                </ul>
              </div>

              <div className="student-portal__preview-section">
                <h3>PROJECTS</h3>
                <p><strong>AI Resume Screener</strong> Built an AI tool to parse resumes and rank candidates based on job match.</p>
                <p><strong>Analytics Dashboard</strong> Developed dashboards to visualize hiring metrics and team performance.</p>
              </div>

              <div className="student-portal__preview-section">
                <h3>EDUCATION</h3>
                <div className="student-portal__preview-row">
                  <strong>B.S. in Computer Science</strong>
                  <span>2019 - 2023</span>
                </div>
              </div>
            </div>

            <div className="student-portal__score-card">
              <div className="student-portal__score-card-head">
                <div className="student-portal__score-ring-wrap">
                  <ScoreRing value={score} tone="green" />
                </div>
                <div className="student-portal__score-copy">
                  <strong>100% Score Resume</strong>
                  <p>This resume is fully optimized for ATS and matches the job description perfectly.</p>
                </div>
              </div>
              <button className="student-portal__download-button" type="button">
                Download Resume (PDF)
              </button>
            </div>
          </article>
            </section>

            <section className="student-portal__stats-grid">
          <article className="student-portal__stat-card">
            <div className="student-portal__stat-label">ATS SCORE</div>
            <div className="student-portal__stat-body">
              <ScoreRing value={score} tone="purple" />
              <div className="student-portal__stat-copy">
                <strong>Great Match! 🎉</strong>
                <p>Your resume is well optimized for this job.</p>
                <span className="student-portal__hint-pill">Top 14% of candidates</span>
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
            <p className="student-portal__stat-note">Great match! You have most of the required skills.</p>
            <button className="student-portal__text-link" type="button">
              View Details <span aria-hidden="true">→</span>
            </button>
          </article>

          <article className="student-portal__stat-card">
            <div className="student-portal__stat-label">MISSING SKILLS</div>
            <div className="student-portal__missing-head">
              <span className="student-portal__missing-count">{missingSkills.length}</span>
              <p>Improve your chances by adding these skills.</p>
            </div>
            <ChipList items={missingSkills} tone="amber" />
            <button className="student-portal__text-link" type="button">
              View Suggestions <span aria-hidden="true">→</span>
            </button>
          </article>

          <article className="student-portal__stat-card">
            <div className="student-portal__stat-label">IMPROVEMENT SUGGESTIONS</div>
            <ul className="student-portal__suggestion-list">
              {improvementTips.slice(0, 4).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <button className="student-portal__text-link" type="button">
              View All Suggestions <span aria-hidden="true">→</span>
            </button>
          </article>

          <article className="student-portal__stat-card student-portal__stat-card--match">
            <div className="student-portal__stat-label">MATCH PERCENTAGE</div>
            <div className="student-portal__big-number">{Math.max(score, skillsMatch)}%</div>
            <p className="student-portal__stat-note">Your profile is a strong match for this job.</p>
            <div className="student-portal__star-row" aria-hidden="true">
              <span>★</span>
              <span>★</span>
              <span>★</span>
              <span>★</span>
              <span>★</span>
            </div>
          </article>
            </section>
          </>
        ) : (
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
        )}
      </main>
    </div>
  );
}
