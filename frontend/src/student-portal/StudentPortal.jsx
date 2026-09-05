import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import LiveCoverLetter from "./LiveCoverLetter.jsx";
import StudentResumePreview from "./StudentResumePreview.jsx";
import StudentSettings from "./StudentSettings.jsx";
import ResumeLibrary from "./ResumeLibrary.jsx";
import { auth } from "../firebase.js";
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
  { id: "analyzer", label: "RESUME ANALYZER" },
  { id: "resume", label: "RESUME" },
  { id: "cover-letter", label: "COVER LETTER" },
];

const DEFAULT_SKILLS = ["Python", "FastAPI", "LangChain", "React", "SQL", "Docker", "AWS", "APIs"];
const DEFAULT_MISSING = ["LangChain", "CI/CD", "Kubernetes"];
const DEFAULT_IMPROVEMENTS = [
  "Add more metrics to your experience",
  "Highlight your AWS and Docker experience",
  "Include more relevant projects",
  "Show stronger system design evidence",
];

const THEME_OPTIONS = [
  { name: "Violet", value: "#6f35ff", rgb: "111, 53, 255" },
  { name: "Blue", value: "#2563eb", rgb: "37, 99, 235" },
  { name: "Green", value: "#059669", rgb: "5, 150, 105" },
  { name: "Amber", value: "#d97706", rgb: "217, 119, 6" },
  { name: "Rose", value: "#e11d48", rgb: "225, 29, 72" },
];

function getStoredValue(key, fallback = "") {
  if (typeof window === "undefined") {
    return fallback;
  }
  return window.localStorage.getItem(key) || fallback;
}

function getInitialTheme() {
  const stored = getStoredValue("hireflow-student-theme", "");
  return THEME_OPTIONS.find((theme) => theme.value === stored) || THEME_OPTIONS[0];
}

function getStoredApiKey() {
  return getStoredValue("hireflow-student-api-key", "");
}

function getStoredProfilePhoto() {
  return getStoredValue("hireflow-student-profile-photo", "");
}

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

async function postFormData(path, formData) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.detail || `Request to ${path} failed with status ${res.status}`);
  }
  return res.json();
}

async function extractResumeFileText(file) {
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  const isPlainText = file.type.startsWith("text/") || ["txt", "md", "markdown"].includes(extension);

  if (isPlainText) {
    return file.text();
  }

  const formData = new FormData();
  formData.append("file", file);
  const result = await postFormData("/api/resume/extract-text", formData);
  return result.text || "";
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

export default function StudentPortal({ onSignOut }) {
  const resumeInputRef = useRef(null);
  const profilePhotoInputRef = useRef(null);
  const profileMenuRef = useRef(null);
  const profileMenuButtonRef = useRef(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(getInitialTheme);
  const [apiKeyDraft, setApiKeyDraft] = useState(getStoredApiKey);
  const [profilePhoto, setProfilePhoto] = useState(getStoredProfilePhoto);
  const [resume, setResume] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [resumeMode, setResumeMode] = useState("upload");
  const [activeTemplate, setActiveTemplate] = useState("Professional");
  const [activeSection, setActiveSection] = useState("analyzer");
  const [previewFromCta, setPreviewFromCta] = useState(false);
  const [skillsDetailsOpen, setSkillsDetailsOpen] = useState(false);
  const [missingSkillsOpen, setMissingSkillsOpen] = useState(false);
  const [resumeFileName, setResumeFileName] = useState("Nina_Carter_Resume.pdf");
  const [resumeFileSize, setResumeFileSize] = useState("234 KB");
  const [coverPersonalization, setCoverPersonalization] = useState(
    "Dear Hiring Manager, I am writing to express my interest in the role and my experience in building reliable software systems."
  );

  const [analysisResult, setAnalysisResult] = useState(null);
  const [matchResult, setMatchResult] = useState(null);
  const [parsedJobDetails, setParsedJobDetails] = useState(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [uploadedResumes, setUploadedResumes] = useState([]);

  const [loading, setLoading] = useState(null);
  const [error, setError] = useState("");

  const summary = getResumeHeader(resume);
  const profileName = currentUser?.displayName || currentUser?.email?.split("@")?.[0] || "Logged in user";
  const profileInitials = profileName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";
  const hasAnalysis = Boolean(analysisResult || matchResult);
  const hasResumeText = Boolean(resume.trim());
  const score = hasAnalysis
    ? formatPercent(matchResult?.match_score ?? analysisResult?.resume_score ?? analysisResult?.ats_score ?? 88, 88)
    : 0;
  const skillsMatch = hasAnalysis ? formatPercent(matchResult?.skills_match_score ?? analysisResult?.skills_match_score ?? 87, 87) : 0;
  const experienceMatch = hasAnalysis ? formatPercent(analysisResult?.experience_score ?? 80, 80) : 0;
  const keywordsMatch = hasAnalysis ? formatPercent(analysisResult?.keywords_score ?? 85, 85) : 0;
  const formatMatch = hasAnalysis ? formatPercent(analysisResult?.formatting_score ?? 90, 90) : 0;
  const portalStyle = {
    "--student-accent": selectedTheme.value,
    "--student-accent-rgb": selectedTheme.rgb,
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user || null);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const handleClick = (event) => {
      if (!profileMenuRef.current) {
        return;
      }

      if (profileMenuRef.current.contains(event.target) || profileMenuButtonRef.current?.contains(event.target)) {
        return;
      }

      setProfileMenuOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem("hireflow-student-theme", selectedTheme.value);
  }, [selectedTheme]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem("hireflow-student-api-key", apiKeyDraft);
  }, [apiKeyDraft]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (profilePhoto) {
      window.localStorage.setItem("hireflow-student-profile-photo", profilePhoto);
      return;
    }

    window.localStorage.removeItem("hireflow-student-profile-photo");
  }, [profilePhoto]);

  useEffect(() => {
    const jobText = jobDescription.trim();
    if (!jobText) {
      setParsedJobDetails(null);
      return undefined;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/hr/parse-jd`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ job_description: jobText }),
          signal: controller.signal,
        });
        if (!res.ok) {
          throw new Error(`Request to /api/hr/parse-jd failed with status ${res.status}`);
        }
        setParsedJobDetails(await res.json());
      } catch (err) {
        if (err.name !== "AbortError") {
          setParsedJobDetails(null);
        }
      }
    }, 250);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [jobDescription]);

  const matchedSkills = hasAnalysis
    ? pickArray(analysisResult?.matched_skills).length
      ? analysisResult.matched_skills
      : pickArray(matchResult?.skills_match).length
        ? matchResult.skills_match
        : DEFAULT_SKILLS
    : [];

  const jobSkills = pickArray(parsedJobDetails?.skills);
  const jobResponsibilities = pickArray(parsedJobDetails?.responsibilities);
  const roleSummaryPoints = Array.isArray(parsedJobDetails?.role_summary)
    ? parsedJobDetails.role_summary.filter(Boolean)
    : parsedJobDetails?.role_summary
      ? [parsedJobDetails.role_summary]
      : [];



  const jobExperience = pickArray(parsedJobDetails?.experience).join(", ") || "N/A";
  const jobSalary = parsedJobDetails?.salary || "N/A";
  const jobType = parsedJobDetails?.employment_type || "N/A";
  const hasParsedJobDetails = Boolean(parsedJobDetails);

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
      const text = await extractResumeFileText(file);
      if (!text.trim()) {
        throw new Error("No readable text was found in the uploaded resume.");
      }
      setResume(text);
      setResumeMode("upload");
      setResumeFileName(file.name);
      setResumeFileSize(formatFileSize(file.size));
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  function handleReuploadResume() {
    setResume("");
    setResumeMode("upload");
    setResumeFileName("");
    setResumeFileSize("");
    setAnalysisResult(null);
    setMatchResult(null);
    setCoverLetter("");
    setError("");
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
        additional_context: coverPersonalization,
      });
      setCoverLetter(result.cover_letter || "");
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  }

  async function handleAddResumeToLibrary(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const text = await extractResumeFileText(file);
      if (!text.trim()) {
        throw new Error("No readable text was found in the uploaded resume.");
      }

      const newResume = {
        id: Date.now().toString(),
        name: file.name,
        text: text,
        size: formatFileSize(file.size),
        uploadDate: new Date().toISOString(),
      };

      setUploadedResumes((prev) => [...prev, newResume]);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  function handleDeleteResume(resumeId) {
    setUploadedResumes((prev) => prev.filter((r) => r.id !== resumeId));
  }

  function handleSelectResumeFromLibrary(resumeId) {
    const selectedResume = uploadedResumes.find((r) => r.id === resumeId);
    if (selectedResume) {
      setResume(selectedResume.text);
      setResumeFileName(selectedResume.name);
      setResumeFileSize(selectedResume.size);
      setResumeMode("upload");
    }
  }

  function handleSelectTheme(theme) {
    setSelectedTheme(theme);
  }

  function handleSaveApiKey(event) {
    event.preventDefault();
    setApiKeyDraft(apiKeyDraft.trim());
  }

  function handleProfilePhotoUpload(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setProfilePhoto(result);
    };
    reader.onerror = () => {
      setError("Could not read the selected image.");
    };
    reader.readAsDataURL(file);
  }

  async function handleSignOut() {
    setProfileMenuOpen(false);
    try {
      await signOut(auth);
      onSignOut?.();
    } catch (err) {
      setError(err?.message || "Could not sign out.");
    }
  }

  return (
    <div className="student-portal" style={portalStyle}>
      <aside className="student-portal__sidebar">
        <div className="student-portal__brand">
          <div className="student-portal__brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div>
            <div className="student-portal__brand-title">HireFlow AI</div>
           
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

        <div className="student-portal__sidebar-footer" ref={profileMenuRef}>
          <button
            ref={profileMenuButtonRef}
            className="student-portal__profile"
            type="button"
            aria-label={`Signed in as ${profileName}`}
            aria-expanded={profileMenuOpen}
            onClick={() => setProfileMenuOpen((value) => !value)}
          >
            <div className="student-portal__avatar" aria-hidden="true">
              {profilePhoto ? <img src={profilePhoto} alt="" /> : profileInitials}
            </div>
            <span className="student-portal__profile-name">{profileName}</span>
          </button>

              {profileMenuOpen ? (
                <div className="student-portal__profile-menu" role="menu" aria-label="Profile actions">
              <button
                className="student-portal__profile-menu-item"
                type="button"
                onClick={() => {
                  setProfileMenuOpen(false);
                  setActiveSection("settings");
                }}
              >
                Settings
              </button>
              <button className="student-portal__profile-menu-item" type="button" onClick={handleSignOut}>
                Sign out
              </button>
            </div>
          ) : null}
        </div>

      </aside>

      <main className="student-portal__content">
        {error && <div className="student-portal__error">{error}</div>}

        {activeSection === "settings" ? (
          <StudentSettings
            accountInfo={[
              { label: "Name", value: currentUser?.displayName || "Not available" },
              { label: "Email", value: currentUser?.email || "Not available" },
            ]}
            currentUser={currentUser}
            onBackToDashboard={() => setActiveSection("analyzer")}
            onHandleProfilePhotoUpload={handleProfilePhotoUpload}
            onRemoveProfilePhoto={() => setProfilePhoto("")}
            onOpenProfilePhotoPicker={() => profilePhotoInputRef.current?.click()}
            apiKeyDraft={apiKeyDraft}
            onApiKeyChange={setApiKeyDraft}
            onSaveApiKey={handleSaveApiKey}
            profileInitials={profileInitials}
            profilePhoto={profilePhoto}
            profilePhotoInputRef={profilePhotoInputRef}
            selectedTheme={selectedTheme}
            themeOptions={THEME_OPTIONS}
            onSelectTheme={handleSelectTheme}
          />
        ) : activeSection === "preview" ? (
          <StudentResumePreview
            fromCta={previewFromCta}
            resume={resume}
            resumeFileName={resumeFileName}
            hasResumeText={hasResumeText}
            summary={summary}
            matchedSkills={matchedSkills}
            score={score}
            jobDescription={jobDescription}
            jobExperience={jobExperience}
            jobSalary={jobSalary}
            jobType={jobType}
            jobSkills={jobSkills}
            hasParsedJobDetails={hasParsedJobDetails}
            parsedJobDetails={parsedJobDetails}
            roleSummaryPoints={roleSummaryPoints}
            resumeMode={resumeMode}
            setResumeMode={setResumeMode}
            resumeInputRef={resumeInputRef}
            handleResumeUpload={handleResumeUpload}
            handleReuploadResume={handleReuploadResume}
            handleNewAnalysis={handleNewAnalysis}
            setResume={setResume}
          />
        ) : activeSection === "resume" ? (
          <ResumeLibrary
            uploadedResumes={uploadedResumes}
            onAddResume={handleAddResumeToLibrary}
            onDeleteResume={handleDeleteResume}
            onSelectResume={handleSelectResumeFromLibrary}
            onNavigateToAnalyzer={() => setActiveSection("analyzer")}
          />
        ) : activeSection === "cover-letter" ? (
          <LiveCoverLetter
            jobDescription={jobDescription}
            setJobDescription={setJobDescription}
            hasParsedJobDetails={hasParsedJobDetails}
            parsedJobDetails={parsedJobDetails}
            roleSummaryPoints={roleSummaryPoints}
            resume={resume}
            setResume={setResume}
            resumeFileName={resumeFileName}
            coverLetter={coverLetter}
            loading={loading}
            uploadedResumes={uploadedResumes}
            onSelectResumeFromLibrary={handleSelectResumeFromLibrary}
            onBackToDashboard={() => setActiveSection("analyzer")}
            onGenerateCoverLetter={handleCoverLetter}
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
                  <strong>{jobExperience}</strong>
                </div>
                <div className="student-portal__detail-card">
                  <span className="student-portal__meta-label">Salary</span>
                  <strong>{jobSalary}</strong>
                </div>
                <div className="student-portal__detail-card">
                  <span className="student-portal__meta-label">Type</span>
                  <strong>{jobType}</strong>
                </div>
              </div>

              

              <div className="student-portal__job-section">
                <h3>Key Skills Detected</h3>
                {jobSkills.length ? (
                  <ChipList items={jobSkills.slice(0, 8)} />
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

              <div className="student-portal__job-section">
                <h3>About the role</h3>
                {hasParsedJobDetails ? (
                  <div className="student-portal__parsed-panel">
                    <strong>{parsedJobDetails.role_title || "Role details"}</strong>
                    {roleSummaryPoints.length ? (
                      <ul className="student-portal__parsed-list">
                        {roleSummaryPoints.slice(0, 5).map((item, index) => (
                          <li key={`${item}-${index}`}>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>Role summary was extracted from the job description.</p>
                    )}
                  </div>
                ) : (
                  <div className="student-portal__empty-panel">
                    <div className="student-portal__empty-panel-icon" aria-hidden="true">
                      ◌
                    </div>
                    <strong>Your pasted job description will appear here.</strong>
                    <p>We&apos;ll extract key details and requirements automatically.</p>
                  </div>
                )}
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

              <input
                ref={resumeInputRef}
                className="student-portal__hidden-input"
                type="file"
                accept=".pdf,.docx,.txt,.md,text/plain,text/markdown,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleResumeUpload}
              />

              {resumeMode === "upload" && !hasResumeText ? (
                <div className="student-portal__upload-summary">
                  <div className="student-portal__dropzone" onClick={() => resumeInputRef.current?.click()} role="button" tabIndex={0}>
                    <div className="student-portal__dropzone-title">Drag &amp; drop your file here</div>
                    <div className="student-portal__dropzone-copy">or</div>
                    <button
                      className="student-portal__dropzone-button"
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        resumeInputRef.current?.click();
                      }}
                    >
                      Choose File
                    </button>
                    <div className="student-portal__dropzone-copy">Supports PDF, DOCX, TXT and Markdown</div>
                  </div>
                </div>
              ) : null}

              {resumeMode === "paste" || hasResumeText ? (
                <div className={`student-portal__editor-card${resumeMode === "upload" && hasResumeText ? " student-portal__editor-card--expanded" : ""}`}>
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
              ) : null}

              <div className="student-portal__resume-actions">
                {resumeMode === "upload" && hasResumeText ? (
                  <button className="student-portal__ghost-button" type="button" onClick={handleReuploadResume}>
                    Re-upload
                  </button>
                ) : null}
                <button className="student-portal__text-link student-portal__text-link--center" type="button" onClick={handleNewAnalysis}>
                  Run analysis <span aria-hidden="true">→</span>
                </button>
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
                <button
                  className="student-portal__expand-button"
                  type="button"
                  aria-expanded={missingSkillsOpen}
                  onClick={() => setMissingSkillsOpen((open) => !open)}
                >
                  View Suggestions <span className="student-portal__expand-icon" aria-hidden="true">⌄</span>
                </button>
                {missingSkillsOpen ? (
                  <div className="student-portal__expand-panel">
                    {missingSkills.length ? (
                      missingSkills.map((skill) => (
                        <div key={skill}>
                          <span>{skill}</span>
                          <strong>Consider adding</strong>
                        </div>
                      ))
                    ) : (
                      <span>Run an analysis to receive skill suggestions.</span>
                    )}
                  </div>
                ) : null}
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

              <button
                className="student-portal__ats-cta"
                type="button"
                onClick={() => { setPreviewFromCta(true); setActiveSection("preview"); }}
              >
                <span className="student-portal__ats-cta-icon" aria-hidden="true">🚀</span>
                <span>
                  <strong>Want to get a 95+ ATS score resume?</strong>
                  <span>Click to view your optimized resume →</span>
                </span>
              </button>
            </section>
          </section>
        )}
      </main>
    </div>
  );
}
