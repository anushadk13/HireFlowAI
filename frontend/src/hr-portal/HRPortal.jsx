import { useEffect, useState } from "react";
import "./HRPortal.css";

const API_BASE = "http://127.0.0.1:8000";

const NAV_ITEMS = [
  { id: "parse-jd", label: "Parse JD" },
  { id: "screen", label: "Screen" },
  { id: "rank", label: "Rank" },
  { id: "interviews", label: "Interviews" },
  { id: "dashboard", label: "Dashboard" },
];

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

const SAMPLE_CANDIDATES = JSON.stringify(
  [
    { name: "John", resume_text: "Python FastAPI React AWS Docker. Built a resume parser and candidate ranking system with RAG and analytics dashboards." },
    { name: "Aisha", resume_text: "React TypeScript Frontend Engineer. Built a design system, recruiter dashboard, and interactive analytics screens." },
    { name: "Marcus", resume_text: "Backend Engineer with Python, SQL, Docker, and PostgreSQL. Built APIs for screening, scoring, and workflow automation." },
  ],
  null,
  2
);

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

function pillList(values) {
  const items = Array.isArray(values) ? values : [];
  return (
    <div className="hr-portal__pill-list">
      {items.length ? items.map((value) => <span key={String(value)} className="hr-portal__pill">{String(value)}</span>) : <span className="hr-portal__pill hr-portal__pill--muted">None</span>}
    </div>
  );
}

function normalizeCandidates(raw) {
  return raw.map((candidate) => ({
    ...candidate,
    resume_text: candidate.resume_text || candidate.resume || "",
  }));
}

export default function HRPortal({ onBack }) {
  const [activeTab, setActiveTab] = useState("parse-jd");
  const [jobDescription, setJobDescription] = useState("");
  const [candidateResume, setCandidateResume] = useState("");
  const [candidatesJSON, setCandidatesJSON] = useState("");

  const [parsedRequirements, setParsedRequirements] = useState(null);
  const [screeningResult, setScreeningResult] = useState(null);
  const [rankedCandidates, setRankedCandidates] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  const [loading, setLoading] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setJobDescription(SAMPLE_JD);
    setCandidateResume(SAMPLE_RESUME);
    setCandidatesJSON(SAMPLE_CANDIDATES);
  }, []);

  async function handleParseJD() {
    if (!jobDescription.trim()) {
      setError("Paste a job description first.");
      return;
    }
    setError("");
    setLoading("parse-jd");
    try {
      const result = await postJSON("/api/hr/parse-jd", {
        job_description: jobDescription,
      });
      setParsedRequirements(result);
      setActiveTab("parse-jd");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  }

  async function handleScreen() {
    if (!jobDescription.trim() || !candidateResume.trim()) {
      setError("Paste both a job description and a candidate resume first.");
      return;
    }
    setError("");
    setLoading("screen");
    try {
      const result = await postJSON("/api/hr/screen", {
        job_description: jobDescription,
        resume_text: candidateResume,
      });
      setScreeningResult(result);
      setActiveTab("screen");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  }

  async function handleRank() {
    let candidates;
    try {
      candidates = normalizeCandidates(JSON.parse(candidatesJSON));
    } catch {
      setError("Candidates must be valid JSON, e.g. a list of resume objects.");
      return;
    }
    setError("");
    setLoading("rank");
    try {
      const result = await postJSON("/api/hr/rank", {
        job_description: jobDescription,
        candidates,
      });
      setRankedCandidates(result.ranked || []);
      setActiveTab("rank");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  }

  async function handleLoadDashboard() {
    setError("");
    setLoading("dashboard");
    setActiveTab("dashboard");
    try {
      const [dash, stats] = await Promise.all([
        getJSON("/api/hr/dashboard"),
        getJSON("/api/analytics"),
      ]);
      setDashboard(dash);
      setAnalytics(stats);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="hr-portal">
      <aside className="hr-portal__sidebar">
        <button className="hr-portal__back" type="button" onClick={onBack}>
          Back
        </button>
        <div className="hr-portal__title">HR portal</div>
        <nav>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={
                "hr-portal__nav-item" +
                (activeTab === item.id ? " hr-portal__nav-item--active" : "")
              }
              onClick={() => {
                setActiveTab(item.id);
                if (item.id === "dashboard") handleLoadDashboard().catch((err) => setError(err.message));
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="hr-portal__main">
        {error && <div className="hr-portal__error">{error}</div>}

        <div className="hr-portal__stats">
          <div className="hr-portal__stat">
            <div className="hr-portal__stat-label">Open roles</div>
            <div className="hr-portal__stat-value">
              {dashboard?.applications?.total ?? "--"}
            </div>
          </div>
          <div className="hr-portal__stat">
            <div className="hr-portal__stat-label">Candidates screened</div>
            <div className="hr-portal__stat-value">
              {dashboard?.applications?.shortlisted ?? "--"}
            </div>
          </div>
          <div className="hr-portal__stat">
            <div className="hr-portal__stat-label">Avg match score</div>
            <div className="hr-portal__stat-value">
              {analytics?.avg_ats ?? "--"}%
            </div>
          </div>
          <div className="hr-portal__stat">
            <div className="hr-portal__stat-label">Interviews booked</div>
            <div className="hr-portal__stat-value">
              {dashboard?.applications?.pending ?? "--"}
            </div>
          </div>
        </div>

        <div className="hr-portal__panels">
          <div className="hr-portal__card">
            <p className="hr-portal__card-title">Parse job description</p>
            <textarea
              placeholder="Paste job description here"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
            <button onClick={handleParseJD} disabled={loading === "parse-jd"}>
              {loading === "parse-jd" ? "Extracting..." : "Extract requirements"}
            </button>
            {parsedRequirements && (
              <div className="hr-portal__section">
                <div className="hr-portal__row">
                  <span>Skills</span>
                  <span className="hr-portal__muted">{(parsedRequirements.skills || []).length}</span>
                </div>
                {pillList(parsedRequirements.skills)}
                <div className="hr-portal__row">
                  <span>Responsibilities</span>
                  <span className="hr-portal__muted">{(parsedRequirements.responsibilities || []).length}</span>
                </div>
                {pillList(parsedRequirements.responsibilities)}
                <div className="hr-portal__row">
                  <span>Experience</span>
                  <span className="hr-portal__muted">{(parsedRequirements.experience || []).length}</span>
                </div>
                {pillList(parsedRequirements.experience)}
              </div>
            )}
          </div>

          <div className="hr-portal__card">
            <p className="hr-portal__card-title">Screen a resume</p>
            <textarea
              placeholder="Paste candidate resume here"
              value={candidateResume}
              onChange={(e) => setCandidateResume(e.target.value)}
            />
            <button onClick={handleScreen} disabled={loading === "screen"}>
              {loading === "screen" ? "Screening..." : "Run screening"}
            </button>
            {screeningResult && (
              <div className="hr-portal__screening">
                <div className="hr-portal__row">
                  <span>Recommendation</span>
                  <span className="hr-portal__muted">{screeningResult.recommendation ?? "--"}</span>
                </div>
                <div className="hr-portal__row">
                  <span>ATS</span>
                  <span className="hr-portal__muted">{screeningResult.ats ?? "--"}</span>
                </div>
                <div className="hr-portal__row">
                  <span>Skill match</span>
                  <span className="hr-portal__muted">{screeningResult.skill_match ?? "--"}</span>
                </div>
                <div className="hr-portal__row">
                  <span>Flags</span>
                  <span className="hr-portal__muted">{(screeningResult.flags || []).length}</span>
                </div>
                {pillList(screeningResult.flags)}
              </div>
            )}
          </div>
        </div>

        <div className="hr-portal__card">
          <div className="hr-portal__card-header">
            <p className="hr-portal__card-title">Rank candidates</p>
            <button onClick={handleRank} disabled={loading === "rank"}>
              {loading === "rank" ? "Ranking..." : "Re-rank"}
            </button>
          </div>
          <textarea
            className="hr-portal__json-input"
            placeholder='Paste a JSON list of candidates, e.g. [{"name":"Amara Khan","resume_text":"..."}]'
            value={candidatesJSON}
            onChange={(e) => setCandidatesJSON(e.target.value)}
          />
          <div className="hr-portal__ranked-list">
            {rankedCandidates.map((c, i) => (
              <div key={i} className="hr-portal__row">
                <div className="hr-portal__candidate">
                  <span className="hr-portal__avatar">
                    {(c.name || "?")
                      .split(" ")
                      .map((p) => p[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </span>
                  <span>{c.name}</span>
                </div>
                <span className="hr-portal__muted">{c.score}% score</span>
              </div>
            ))}
          </div>
        </div>

        <div className="hr-portal__card">
          <div className="hr-portal__card-header">
            <p className="hr-portal__card-title">Dashboard</p>
            <button onClick={handleLoadDashboard} disabled={loading === "dashboard"}>
              {loading === "dashboard" ? "Loading..." : "Load dashboard"}
            </button>
          </div>
          {dashboard ? (
            <div className="hr-portal__section">
              <div className="hr-portal__stats hr-portal__stats--compact">
                <div className="hr-portal__stat">
                  <div className="hr-portal__stat-label">Applications</div>
                  <div className="hr-portal__stat-value">{dashboard.applications?.total ?? "--"}</div>
                </div>
                <div className="hr-portal__stat">
                  <div className="hr-portal__stat-label">Shortlisted</div>
                  <div className="hr-portal__stat-value">{dashboard.applications?.shortlisted ?? "--"}</div>
                </div>
                <div className="hr-portal__stat">
                  <div className="hr-portal__stat-label">Shortlist rate</div>
                  <div className="hr-portal__stat-value">{dashboard.shortlist_rate ?? "--"}%</div>
                </div>
                <div className="hr-portal__stat">
                  <div className="hr-portal__stat-label">Avg ATS</div>
                  <div className="hr-portal__stat-value">{analytics?.avg_ats ?? "--"}%</div>
                </div>
              </div>
              <div className="hr-portal__dash-grid">
                <div>
                  <h3>Top skills</h3>
                  {pillList((dashboard.skills_distribution || []).map((item) => `${item.label} ${item.value}`))}
                </div>
                <div>
                  <h3>Pipeline</h3>
                  {pillList((analytics?.pipeline || []).map((item) => `${item.label} ${item.value}`))}
                </div>
              </div>
            </div>
          ) : (
            <p className="hr-portal__muted">Load the dashboard to see analytics.</p>
          )}
        </div>
      </main>
    </div>
  );
}
