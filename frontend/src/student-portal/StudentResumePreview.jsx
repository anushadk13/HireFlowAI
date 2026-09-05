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

function GeneratedResumePanel({ summary, matchedSkills, score }) {
  return (
    <article className="student-portal__panel student-portal__panel--preview">
      <div className="student-portal__panel-header">
        <div>
          <div className="student-portal__panel-step">
            <span>✦</span>
            <h2>AI‑Optimised Resume</h2>
          </div>
          <p className="student-portal__panel-subtitle">95+ ATS score · fully tailored to the job</p>
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
            <span>Jan 2023 – Present</span>
          </div>
          <ul className="student-portal__preview-list">
            <li>Built RAG-based prototypes using LangChain and OpenAI, improving answer accuracy by 35%.</li>
            <li>Developed internal tools for candidate search, JD parsing, and interview automation.</li>
            <li>Integrated APIs and optimised data pipelines, reducing processing time by 40%.</li>
          </ul>
        </div>

        <div className="student-portal__preview-section">
          <h3>PROJECTS</h3>
          <p><strong>AI Resume Screener</strong> — Built an AI tool to parse resumes and rank candidates based on job match.</p>
          <p><strong>Analytics Dashboard</strong> — Developed dashboards to visualise hiring metrics and team performance.</p>
        </div>

        <div className="student-portal__preview-section">
          <h3>EDUCATION</h3>
          <div className="student-portal__preview-row">
            <strong>B.S. in Computer Science</strong>
            <span>2019 – 2023</span>
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
            <p>Fully optimised for ATS and tailored to the job description.</p>
          </div>
        </div>
        <button className="student-portal__download-button" type="button">
          Download Resume (PDF)
        </button>
      </div>
    </article>
  );
}

export default function StudentResumePreview({
  fromCta,
  resume,
  resumeFileName,
  hasResumeText,
  summary,
  matchedSkills,
  score,
  jobDescription,
  jobExperience,
  jobSalary,
  jobType,
  jobSkills = [],
  hasParsedJobDetails,
  parsedJobDetails,
  roleSummaryPoints = [],
  resumeMode,
  setResumeMode,
  resumeInputRef,
  handleResumeUpload,
  handleReuploadResume,
  handleNewAnalysis,
  setResume,
}) {
  /* ── CTA mode: they already have a resume uploaded ── */
  if (fromCta && hasResumeText) {
    return (
      <section className="student-portal__preview-compare-layout">
        {/* Original uploaded resume */}
        <article className="student-portal__panel">
          <div className="student-portal__panel-header">
            <div>
              <div className="student-portal__panel-step">
                <span>1</span>
                <h2>Your Uploaded Resume</h2>
              </div>
              {resumeFileName && (
                <p className="student-portal__panel-subtitle">{resumeFileName}</p>
              )}
            </div>
          </div>

          <div className="student-portal__uploaded-resume-body">
            <pre className="student-portal__uploaded-resume-text">{resume}</pre>
          </div>
        </article>

        {/* AI generated resume */}
        <GeneratedResumePanel summary={summary} matchedSkills={matchedSkills} score={score} />
      </section>
    );
  }

  /* ── Direct nav mode: no resume yet – show full input + generated preview ── */
  return (
    <section className="student-portal__analyzer-layout">
      {/* Column 1 – Job Description */}
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
          readOnly
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
              <div className="student-portal__empty-panel-icon" aria-hidden="true">✧</div>
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
                    <li key={`${item}-${index}`}><span>{item}</span></li>
                  ))}
                </ul>
              ) : (
                <p>Role summary was extracted from the job description.</p>
              )}
            </div>
          ) : (
            <div className="student-portal__empty-panel">
              <div className="student-portal__empty-panel-icon" aria-hidden="true">◌</div>
              <strong>Your pasted job description will appear here.</strong>
              <p>We&apos;ll extract key details and requirements automatically.</p>
            </div>
          )}
        </div>
      </article>

      {/* Column 2 – Resume upload */}
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
            <div
              className="student-portal__dropzone"
              onClick={() => resumeInputRef.current?.click()}
              role="button"
              tabIndex={0}
            >
              <div className="student-portal__dropzone-title">Drag &amp; drop your file here</div>
              <div className="student-portal__dropzone-copy">or</div>
              <button
                className="student-portal__dropzone-button"
                type="button"
                onClick={(e) => { e.stopPropagation(); resumeInputRef.current?.click(); }}
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
              <span>↶</span><span>↷</span>
              <span className="student-portal__toolbar-divider" />
              <span>Paragraph</span>
              <span className="student-portal__toolbar-divider" />
              <span>B</span><span>I</span><span>U</span>
              <span className="student-portal__toolbar-divider" />
              <span>≡</span><span>☰</span><span>🔗</span><span>{"{}"}</span><span>&lt;/&gt;</span>
            </div>
            <textarea
              className="student-portal__textarea student-portal__textarea--resume"
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              aria-label="Resume editor"
              placeholder={`Your resume content will appear here...\nYou can edit the text if needed.`}
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
          <button
            className="student-portal__text-link student-portal__text-link--center"
            type="button"
            onClick={handleNewAnalysis}
          >
            Run analysis <span aria-hidden="true">→</span>
          </button>
        </div>
      </article>

      {/* Column 3 – Generated resume */}
      <GeneratedResumePanel summary={summary} matchedSkills={matchedSkills} score={score} />
    </section>
  );
}
