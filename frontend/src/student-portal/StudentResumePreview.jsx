function ScoreRing({ value, tone = "green" }) {
  return (
    <div className={`student-portal__score-ring student-portal__score-ring--${tone}`} style={{ "--score": value }}>
      <div className="student-portal__score-ring-inner">
        <div className="student-portal__score-ring-value">{value}</div>
        <div className="student-portal__score-ring-scale">/100</div>
      </div>
    </div>
  );
}

export default function StudentResumePreview({ summary, matchedSkills, score }) {
  return (
    <section className="student-portal__preview-page">
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
  );
}
