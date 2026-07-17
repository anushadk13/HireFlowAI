const API = "";
const ROLE_STORAGE_KEY = "hireflow-role";
const ROLE_LABELS = {
  student: "Student",
  hr: "HR",
};
const ROLE_PORTALS = {
  student: "studentSection",
  hr: "hrSection",
};

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
    {
      name: "John",
      resume_text:
        "Python FastAPI React AWS Docker. Built a resume parser and candidate ranking system with RAG and analytics dashboards.",
    },
    {
      name: "Aisha",
      resume_text:
        "React TypeScript Frontend Engineer. Built a design system, recruiter dashboard, and interactive analytics screens.",
    },
    {
      name: "Marcus",
      resume_text:
        "Backend Engineer with Python, SQL, Docker, and PostgreSQL. Built APIs for screening, scoring, and workflow automation.",
    },
  ],
  null,
  2
);

function $(id) {
  return document.getElementById(id);
}

function normalizeRole(role) {
  return role === "student" || role === "hr" ? role : "";
}

function getStoredRole() {
  try {
    return normalizeRole(localStorage.getItem(ROLE_STORAGE_KEY) || "");
  } catch {
    return "";
  }
}

function showLoginGate() {
  $("authGate").hidden = false;
  $("portalShell").hidden = true;
}

function showPortal(role) {
  const currentRole = normalizeRole(role);
  $("authGate").hidden = true;
  $("portalShell").hidden = false;
  $("activeRoleChip").textContent = `${ROLE_LABELS[currentRole]} access`;
  document.querySelectorAll(".panel").forEach((panel) => panel.classList.remove("active"));
  $(ROLE_PORTALS[currentRole]).classList.add("active");
}

async function initializeRole(role) {
  const currentRole = normalizeRole(role);
  if (!currentRole) {
    showLoginGate();
    return;
  }

  showPortal(currentRole);

  if (currentRole === "student") {
    $("studentResume").value = SAMPLE_RESUME;
    $("studentJobDescription").value = SAMPLE_JD;
    analyzeResume().catch((error) => alert(error.message || String(error)));
    loadVersions().catch((error) => alert(error.message || String(error)));
    return;
  }

  $("hrResume").value = SAMPLE_RESUME;
  $("hrJobDescription").value = SAMPLE_JD;
  $("rankingInput").value = SAMPLE_CANDIDATES;
  refreshDashboard().catch((error) => alert(error.message || String(error)));
  parseJD().catch((error) => alert(error.message || String(error)));
}

async function setRole(role) {
  const currentRole = normalizeRole(role);
  if (!currentRole) return;
  try {
    localStorage.setItem(ROLE_STORAGE_KEY, currentRole);
    await initializeRole(currentRole);
  } catch (error) {
    clearRole();
    alert(error.message || String(error));
  }
}

function clearRole() {
  localStorage.removeItem(ROLE_STORAGE_KEY);
  showLoginGate();
}

function safeJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

async function request(path, body) {
  const response = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }
  return response.json();
}

async function getJson(path) {
  const response = await fetch(`${API}${path}`);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }
  return response.json();
}

function setHtml(id, html) {
  $(id).innerHTML = html;
}

function metricCard(label, value) {
  return `<div class="metric"><span>${label}</span><strong>${value}</strong></div>`;
}

function pillList(values, muted = false) {
  return `<div class="pill-list">${
    values.length ? values.map((value) => `<span class="pill ${muted ? "muted" : ""}">${escapeHtml(value)}</span>`).join("") : '<span class="pill muted">None</span>'
  }</div>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderMetricBlock(data) {
  return [
    metricCard("ATS Score", data.ats_score ?? data.ats ?? data.score ?? "N/A"),
    metricCard("Resume Score", data.resume_score ?? "N/A"),
    metricCard("Match", data.match_score ?? data.skill_match ?? "N/A"),
    metricCard("Recommendation", data.recommendation ?? data.status ?? "N/A"),
  ].join("");
}

function renderListBlock(title, values) {
  return `<div><strong>${escapeHtml(title)}</strong><div style="height:8px"></div>${pillList(values)}</div>`;
}

async function analyzeResume() {
  const resume_text = $("studentResume").value.trim();
  const job_description = $("studentJobDescription").value.trim();
  const data = await request("/api/resume/analyze", { resume_text, job_description });
  setHtml(
    "studentMetrics",
    [
      metricCard("ATS Score", `${data.ats_score}%`),
      metricCard("Resume Score", `${data.resume_score}/100`),
      metricCard("Matched Skills", data.matched_skills.length),
      metricCard("Missing Skills", data.missing_skills.length),
    ].join("")
  );
  setHtml(
    "studentLists",
    [
      renderListBlock("Grammar Check", data.grammar_notes),
      renderListBlock("Formatting Suggestions", data.formatting_suggestions),
      renderListBlock("Missing Skills", data.missing_skills),
      renderListBlock("Weak Bullet Points", data.weak_bullet_points),
      renderListBlock("Keyword Optimization", data.keyword_optimization),
    ].join("")
  );
}

async function matchJob() {
  const resume_text = $("studentResume").value.trim();
  const job_description = $("studentJobDescription").value.trim();
  const data = await request("/api/resume/match", { resume_text, job_description });
  setHtml(
    "studentMetrics",
    [
      metricCard("Match Score", data.match_score),
      metricCard("Skills Matched", data.skills_match.length),
      metricCard("Missing Skills", data.missing_skills.length),
      metricCard("Recommendation", data.recommendation),
    ].join("")
  );
  setHtml(
    "studentLists",
    [
      renderListBlock("Skills Match", data.skills_match),
      renderListBlock("Missing Skills", data.missing_skills),
    ].join("")
  );
}

async function improveResume() {
  const resume_text = $("studentResume").value.trim();
  const job_description = $("studentJobDescription").value.trim();
  const target_role = $("targetRole").value;
  const data = await request("/api/resume/improve", { resume_text, job_description, target_role });
  setHtml(
    "improvedResume",
    `
      <div class="metric-badge">${escapeHtml(data.target_role)}</div>
      <strong>Summary</strong>
      <p>${escapeHtml(data.summary)}</p>
      <strong>Experience</strong>
      ${pillList(data.experience)}
      <strong>Projects</strong>
      ${pillList(data.projects)}
      <strong>Skills</strong>
      ${pillList(data.skills)}
    `
  );
}

async function generateCoverLetter() {
  const resume_text = $("studentResume").value.trim();
  const job_description = $("studentJobDescription").value.trim();
  const data = await request("/api/resume/cover-letter", { resume_text, job_description });
  setHtml("coverLetter", `<p style="white-space:pre-line">${escapeHtml(data.cover_letter)}</p>`);
}

async function generateInterviewPrep() {
  const resume_text = $("studentResume").value.trim();
  const job_description = $("studentJobDescription").value.trim();
  const data = await request("/api/resume/interview-prep", { resume_text, job_description });
  setHtml(
    "interviewPrep",
    `
      <strong>HR Questions</strong>${pillList(data.hr_questions)}
      <strong>Technical Questions</strong>${pillList(data.technical_questions)}
      <strong>Coding Questions</strong>${pillList(data.coding_questions)}
      <strong>Behavioral Questions</strong>${pillList(data.behavioral_questions)}
    `
  );
}

async function careerAdvice() {
  const question = $("careerQuestion").value.trim();
  const resume_text = $("studentResume").value.trim();
  const job_description = $("studentJobDescription").value.trim();
  const data = await request("/api/career-advisor", { question, resume_text, job_description });
  setHtml("careerAnswer", `<p>${escapeHtml(data.answer)}</p>`);
}

async function loadVersions() {
  const resume_text = $("studentResume").value.trim();
  const data = await getJson(`/api/resume/versions?resume_text=${encodeURIComponent(resume_text)}`);
  const html = Object.entries(data)
    .map(
      ([role, payload]) => `
        <div class="metric">
          <span>${escapeHtml(role)}</span>
          <strong>${escapeHtml(payload.summary)}</strong>
          <div style="height:8px"></div>
          ${pillList(payload.skills)}
        </div>
      `
    )
    .join("");
  setHtml("resumeVersions", html);
}

async function parseJD() {
  const job_description = $("hrJobDescription").value.trim();
  const data = await request("/api/hr/parse-jd", { job_description });
  setHtml(
    "dashboardCharts",
    `
      <strong>JD Skills</strong>${pillList(data.skills)}
      <strong>Responsibilities</strong>${pillList(data.responsibilities)}
      <strong>Keywords</strong>${pillList(data.keywords)}
      <strong>Experience</strong>${pillList(data.experience)}
      <strong>Degree</strong><p>${escapeHtml(data.degree)}</p>
    `
  );
}

async function refreshDashboard() {
  const data = await getJson("/api/hr/dashboard");
  $("heroApplications").textContent = data.applications.total;
  $("heroShortlisted").textContent = data.applications.shortlisted;
  $("heroAts").textContent = "84.2";
  setHtml(
    "dashboardCards",
    [
      metricCard("Total", data.applications.total),
      metricCard("Shortlisted", data.applications.shortlisted),
      metricCard("Rejected", data.applications.rejected),
      metricCard("Pending", data.applications.pending),
    ].join("")
  );
  setHtml(
    "dashboardCharts",
    `
      <strong>Skills Distribution</strong>${pillList(data.skills_distribution.map((item) => `${item.label} ${item.value}`))}
      <strong>Candidate Funnel</strong>${pillList(data.funnel.map((item) => `${item.label} ${item.value}`))}
      <strong>Top Colleges</strong>${pillList(data.top_colleges.map((item) => `${item.label} ${item.value}`))}
      <strong>Experience Distribution</strong>${pillList(data.experience_distribution.map((item) => `${item.label} ${item.value}`))}
    `
  );
  $("rankingInput").value = SAMPLE_CANDIDATES;
}

async function screenResume() {
  const resume_text = $("hrResume").value.trim();
  const job_description = $("hrJobDescription").value.trim();
  const data = await request("/api/hr/screen", { resume_text, job_description });
  setHtml(
    "screeningOutput",
    `
      ${renderMetricBlock({
        ats: data.ats,
        skill_match: data.skill_match,
        recommendation: data.recommendation,
      })}
      <div class="metric"><span>Projects</span><strong>${escapeHtml(data.projects)}</strong></div>
      <div class="metric"><span>Experience</span><strong>${escapeHtml(data.experience)}</strong></div>
      <div class="metric"><span>Education</span><strong>${escapeHtml(data.education)}</strong></div>
      <strong>Flags</strong>${pillList(data.flags, true)}
    `
  );
}

async function rankCandidates() {
  const parsed = safeJson($("rankingInput").value.trim());
  if (!Array.isArray(parsed)) {
    setHtml("rankingOutput", "<p>Paste a valid JSON array of candidates.</p>");
    return;
  }
  const job_description = $("hrJobDescription").value.trim();
  const data = await request("/api/hr/rank", { candidates: parsed, job_description });
  setHtml(
    "rankingOutput",
    data.ranked
      .map(
        (item, index) => `
          <div class="metric">
            <span>#${index + 1} ${escapeHtml(item.name)}</span>
            <strong>${item.score}%</strong>
            <div style="height:8px"></div>
            ${pillList([`ATS ${item.ats}`, `Skills ${item.skill_match}`, `Projects ${item.projects}`])}
          </div>
        `
      )
      .join("")
  );
}

async function generateAssessment() {
  const topic = $("assessmentTopic").value.trim() || "Python";
  const skill_level = $("assessmentLevel").value;
  const data = await request("/api/hr/assessment", { topic, skill_level, candidate_answers: [] });
  setHtml(
    "assessmentOutput",
    `
      <div class="metric"><span>Count</span><strong>${data.count}</strong></div>
      <strong>Questions</strong>${pillList(data.questions)}
    `
  );
}

async function evaluateAssessment() {
  const candidate_answers = $("candidateAnswers").value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const data = await request("/api/hr/evaluate-assessment", {
    topic: $("assessmentTopic").value.trim() || "Python",
    skill_level: $("assessmentLevel").value,
    candidate_answers,
  });
  setHtml(
    "evaluationOutput",
    `
      <div class="metric"><span>Score</span><strong>${data.score}%</strong></div>
      <div class="metric"><span>Status</span><strong>${escapeHtml(data.status)}</strong></div>
      <strong>Feedback</strong>${pillList(data.feedback)}
    `
  );
}

async function askHRChat() {
  const message = $("chatQuery").value.trim();
  const data = await request("/api/hr/chat", { message, skills: [] });
  setHtml("chatOutput", `<p>${escapeHtml(data.answer)}</p>`);
}

function bindAuth() {
  document.querySelectorAll("[data-role]").forEach((button) => {
    button.addEventListener("click", () => {
      setRole(button.getAttribute("data-role"));
    });
  });
  $("switchRole").addEventListener("click", clearRole);
}

function bindActions() {
  const actions = {
    analyzeResume,
    matchJob,
    improveResume,
    generateCoverLetter,
    generateInterviewPrep,
    careerAdvice,
    loadVersions,
    parseJD,
    refreshDashboard,
    screenResume,
    rankCandidates,
    generateAssessment,
    evaluateAssessment,
    askHRChat,
  };
  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", async () => {
      const action = button.getAttribute("data-action");
      button.disabled = true;
      try {
        await actions[action]();
      } catch (error) {
        alert(error.message || String(error));
      } finally {
        button.disabled = false;
      }
    });
  });
}

function bindSamples() {
  $("loadSampleResume").addEventListener("click", () => {
    $("studentResume").value = SAMPLE_RESUME;
    $("studentJobDescription").value = SAMPLE_JD;
    $("hrResume").value = SAMPLE_RESUME;
    $("hrJobDescription").value = SAMPLE_JD;
    $("rankingInput").value = SAMPLE_CANDIDATES;
  });
  $("loadSampleJD").addEventListener("click", () => {
    $("hrJobDescription").value = SAMPLE_JD;
  });
}

async function boot() {
  bindAuth();
  bindActions();
  bindSamples();
  const storedRole = getStoredRole();
  if (storedRole) {
    try {
      await initializeRole(storedRole);
    } catch (error) {
      clearRole();
      alert(error.message || String(error));
    }
  } else {
    showLoginGate();
  }
}

document.addEventListener("DOMContentLoaded", boot);
