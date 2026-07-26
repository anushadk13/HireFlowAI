import { useEffect, useState } from "react";
import "./StudentPortal.css";

const API_BASE = "http://127.0.0.1:8000";

const NAV_ITEMS = [
  { id: "analyze", label: "Analyze" },
  { id: "cover-letter", label: "Cover letter" },
  { id: "interview-prep", label: "Interview prep" },
  { id: "advisor", label: "Advisor" },
  { id: "versions", label: "Versions" },
];

const STUDENT_LOGO_SRC = encodeURI("/images/image copy.png");

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

async function getJSON(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    throw new Error(`Request to ${path} failed with status ${res.status}`);
  }
  return res.json();
}

function pickArray(value) {
  return Array.isArray(value) ? value : [];
}

export default function StudentPortal({ onBack }) {
  const [activeTab, setActiveTab] = useState("analyze");
  const [resume, setResume] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [advisorQuestion, setAdvisorQuestion] = useState("");

  const [analysisResult, setAnalysisResult] = useState(null);
  const [matchResult, setMatchResult] = useState(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [interviewQuestions, setInterviewQuestions] = useState([]);
  const [advisorReply, setAdvisorReply] = useState("");
  const [versions, setVersions] = useState(null);

  const [loading, setLoading] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setResume(SAMPLE_RESUME);
    setJobDescription(SAMPLE_JD);
  }, []);

  function requireInputs() {
    if (!resume.trim() || !jobDescription.trim()) {
      setError("Paste both a resume and a job description first.");
      return false;
    }
    setError("");
    return true;
  }

  async function handleAnalyze() {
    if (!requireInputs()) return;
    setLoading("analyze");
    try {
      const analysis = await postJSON("/api/resume/analyze", {
        resume_text: resume,
        job_description: jobDescription,
      });
      const match = await postJSON("/api/resume/match", {
        resume_text: resume,
        job_description: jobDescription,
      });
      setAnalysisResult(analysis);
      setMatchResult({
        ...analysis,
        ...match,
        strengths: pickArray(analysis.matched_skills).length ? analysis.matched_skills : pickArray(match.skills_match),
        gaps: pickArray(analysis.missing_skills).length ? analysis.missing_skills : pickArray(match.missing_skills),
      });
      setActiveTab("analyze");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  }

  async function handleImprove() {
    if (!requireInputs()) return;
    setLoading("improve");
    try {
      const result = await postJSON("/api/resume/improve", {
        resume_text: resume,
        job_description: jobDescription,
        target_role: "AI Engineer",
      });
      setMatchResult((prev) => ({ ...prev, improvement: result }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  }

  async function handleCoverLetter() {
    if (!requireInputs()) return;
    setLoading("cover-letter");
    setActiveTab("cover-letter");
    try {
      const result = await postJSON("/api/resume/cover-letter", {
        resume_text: resume,
        job_description: jobDescription,
      });
      setCoverLetter(result.cover_letter || "");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  }

  async function handleInterviewPrep() {
    if (!requireInputs()) return;
    setLoading("interview-prep");
    setActiveTab("interview-prep");
    try {
      const result = await postJSON("/api/resume/interview-prep", {
        resume_text: resume,
        job_description: jobDescription,
      });
      setInterviewQuestions(
        [...pickArray(result.hr_questions), ...pickArray(result.technical_questions), ...pickArray(result.coding_questions), ...pickArray(result.behavioral_questions)]
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  }

  async function handleAskAdvisor() {
    if (!advisorQuestion.trim()) return;
    setLoading("advisor");
    try {
      const result = await postJSON("/api/career-advisor", {
        question: advisorQuestion,
        resume_text: resume,
        job_description: jobDescription,
      });
      setAdvisorReply(result.answer || "");
      setActiveTab("advisor");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  }

  async function handleVersions() {
    if (!resume.trim()) {
      setError("Paste a resume first to generate versions.");
      return;
    }
    setLoading("versions");
    try {
      const result = await getJSON(`/api/resume/versions?resume_text=${encodeURIComponent(resume)}`);
      setVersions(result);
      setActiveTab("versions");
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
        <img className="student-portal__logo" src={STUDENT_LOGO_SRC} alt="Student logo" />
        <button className="student-portal__back" type="button" onClick={onBack}>
          Back
        </button>
        <div className="student-portal__title">Student portal</div>
        <nav>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={
                "student-portal__nav-item" +
                (activeTab === item.id ? " student-portal__nav-item--active" : "")
              }
              onClick={() => {
                setActiveTab(item.id);
                if (item.id === "versions") {
                  handleVersions().catch((err) => setError(err.message));
                }
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="student-portal__main">
        {error && <div className="student-portal__error">{error}</div>}

        <div className="student-portal__inputs">
          <div className="student-portal__card">
            <p className="student-portal__card-title">Your resume</p>
            <textarea
              placeholder="Paste your resume here"
              value={resume}
              onChange={(e) => setResume(e.target.value)}
            />
          </div>
          <div className="student-portal__card">
            <p className="student-portal__card-title">Job description</p>
            <textarea
              placeholder="Paste the job description here"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </div>
        </div>

        <div className="student-portal__actions">
          <button onClick={handleAnalyze} disabled={loading === "analyze"}>
            {loading === "analyze" ? "Analyzing..." : "Analyze fit"}
          </button>
          <button onClick={handleImprove} disabled={loading === "improve"}>
            {loading === "improve" ? "Improving..." : "Improve resume"}
          </button>
          <button onClick={handleCoverLetter} disabled={loading === "cover-letter"}>
            {loading === "cover-letter" ? "Generating..." : "Generate cover letter"}
          </button>
          <button onClick={handleInterviewPrep} disabled={loading === "interview-prep"}>
            {loading === "interview-prep" ? "Preparing..." : "Prep interview"}
          </button>
        </div>

        {activeTab === "analyze" && matchResult && (
          <div className="student-portal__card">
            <p className="student-portal__card-title">Match results</p>
            <div className="student-portal__score">
              <span className="student-portal__score-value">
                {matchResult.match_score ?? "--"}%
              </span>
              <span className="student-portal__score-label">match to role</span>
            </div>
            {(matchResult.strengths || []).map((s, i) => (
              <div key={`strength-${i}`} className="student-portal__row">
                <span>{s}</span>
                <span className="student-portal__muted">Strong match</span>
              </div>
            ))}
            {(matchResult.gaps || []).map((g, i) => (
              <div key={`gap-${i}`} className="student-portal__row">
                <span>{g}</span>
                <span className="student-portal__muted">Missing</span>
              </div>
            ))}
            {analysisResult?.grammar_notes?.length ? (
              <div className="student-portal__section">
                <p className="student-portal__card-title">Grammar notes</p>
                {analysisResult.grammar_notes.map((note) => (
                  <div key={note} className="student-portal__row">
                    <span>{note}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}

        {activeTab === "cover-letter" && coverLetter && (
          <div className="student-portal__card">
            <p className="student-portal__card-title">Cover letter</p>
            <pre className="student-portal__prose">{coverLetter}</pre>
          </div>
        )}

        {activeTab === "interview-prep" && interviewQuestions.length > 0 && (
          <div className="student-portal__card">
            <p className="student-portal__card-title">Interview prep questions</p>
            <ol className="student-portal__list">
              {interviewQuestions.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ol>
          </div>
        )}

        {activeTab === "advisor" && advisorReply && (
          <div className="student-portal__card">
            <p className="student-portal__card-title">Career advisor reply</p>
            <p className="student-portal__prose">{advisorReply}</p>
          </div>
        )}

        {activeTab === "versions" && versions && (
          <div className="student-portal__card">
            <p className="student-portal__card-title">Resume versions</p>
            <div className="student-portal__versions">
              {Object.entries(versions).map(([role, payload]) => (
                <div key={role} className="student-portal__version-card">
                  <strong>{role}</strong>
                  <p>{payload.summary}</p>
                  <ul>
                    {(payload.skills || []).map((skill) => (
                      <li key={skill}>{skill}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="student-portal__card">
          <div className="student-portal__card-header">
            <p className="student-portal__card-title">Career advisor</p>
            <button onClick={handleAskAdvisor} disabled={loading === "advisor"}>
              {loading === "advisor" ? "Asking..." : "Ask advisor"}
            </button>
          </div>
          <input
            type="text"
            placeholder="Ask about your career path"
            value={advisorQuestion}
            onChange={(e) => setAdvisorQuestion(e.target.value)}
          />
          {advisorReply && <p className="student-portal__prose">{advisorReply}</p>}
        </div>
      </main>
    </div>
  );
}
