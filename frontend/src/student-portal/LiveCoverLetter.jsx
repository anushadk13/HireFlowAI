const TEMPLATE_OPTIONS = [
  {
    name: "Professional",
    subtitle: "Clean and formal style, ideal for most roles",
    tone: "blue",
    sample: "Dear Hiring Manager, I am writing to express my interest in the role and my experience in building reliable software systems.",
  },
  {
    name: "Modern",
    subtitle: "Contemporary and stylish, for product-focused roles",
    tone: "violet",
    sample: "Hi team, I’m excited to apply and bring a product-minded approach to building polished, user-focused experiences.",
  },
  {
    name: "Creative",
    subtitle: "Unique and eye-catching for creative positions",
    tone: "amber",
    sample: "I’d love to help shape bold ideas into thoughtful products that stand out and create measurable impact.",
  },
  {
    name: "Minimal",
    subtitle: "Simple and concise, for a clean look",
    tone: "mint",
    sample: "I’m interested in the role and can contribute with a clear, focused approach and strong execution.",
  },
];

const USE_ITEMS = ["Your resume details", "Job description", "Key skills & achievements"];

function PreviewLine({ icon, text }) {
  return (
    <div className="student-portal__preview-line">
      <span className="student-portal__preview-line-icon">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

export default function LiveCoverLetter({
  coverLetter,
  loading,
  onBackToDashboard,
  onGenerateCoverLetter,
  activeTemplate,
  setActiveTemplate,
  personalization,
  setPersonalization,
}) {
  const selectedTemplate =
    TEMPLATE_OPTIONS.find((template) => template.name === activeTemplate) || TEMPLATE_OPTIONS[0];

  return (
    <section className="student-portal__cover-page">
      <header className="student-portal__cover-hero">
        <div>
          <h1 className="student-portal__cover-title">
            Generate a <span>Cover Letter</span> ✨
          </h1>
          <p className="student-portal__cover-subtitle">
            Choose a template and let AI craft a personalized, job-ready cover letter for you.
          </p>
        </div>

        <div className="student-portal__cover-tip">
          <span className="student-portal__cover-tip-icon">✉</span>
          <span>Stand out with a cover letter that gets you noticed!</span>
        </div>
      </header>

      <div className="student-portal__cover-layout">
        <div className="student-portal__cover-main">
          <div className="student-portal__section-title-row">
            <span className="student-portal__section-spark">✧</span>
            <h2>Choose a Template</h2>
          </div>

          <div className="student-portal__template-grid">
            {TEMPLATE_OPTIONS.map((template, index) => (
              <button
                key={template.name}
                className={`student-portal__template-card student-portal__template-card--${template.tone}${activeTemplate === template.name ? " is-active" : ""}`}
                type="button"
                aria-pressed={activeTemplate === template.name}
                onClick={() => setActiveTemplate(template.name)}
              >
                <div className="student-portal__template-art">
                  <span className="student-portal__template-sheet student-portal__template-sheet--one" />
                  <span className="student-portal__template-sheet student-portal__template-sheet--two" />
                  <span className="student-portal__template-sheet student-portal__template-sheet--three" />
                  {index === 0 ? <span className="student-portal__template-badge">★ Most Popular</span> : null}
                </div>
                <div className="student-portal__template-copy">
                  <strong>{template.name}</strong>
                  <span>{template.subtitle}</span>
                </div>
                <span className="student-portal__template-check">{activeTemplate === template.name ? "✓" : ""}</span>
              </button>
            ))}
          </div>

          <div className="student-portal__use-strip">
            <div className="student-portal__use-strip-label">AI will use:</div>
            {USE_ITEMS.map((item) => (
              <span key={item} className="student-portal__use-chip">
                {item}
              </span>
            ))}
          </div>

          <div className="student-portal__personalize-card">
            <div className="student-portal__personalize-header">
              <span className="student-portal__personalize-icon">✎</span>
              <div>
                <strong>Personalize (optional)</strong>
              </div>
            </div>

            <textarea
              className="student-portal__personalize-input"
              value={personalization}
              onChange={(e) => setPersonalization(e.target.value)}
              placeholder="Dear Hiring Manager, I am writing to express my interest in the role and my experience in building reliable software systems."
            />
            <div className="student-portal__personalize-counter">{personalization.length}/1000</div>
          </div>

          <div className="student-portal__cover-actions">
            <button
              className="student-portal__action-button student-portal__action-button--ghost"
              type="button"
              onClick={onGenerateCoverLetter}
              disabled={loading === "cover-letter"}
            >
              <span>⟳</span>
              <span>{loading === "cover-letter" ? "Regenerating..." : "Regenerate"}</span>
            </button>
            <button
              className="student-portal__action-button student-portal__action-button--primary"
              type="button"
              onClick={onGenerateCoverLetter}
              disabled={loading === "cover-letter"}
            >
              <span>⬇</span>
              <span>{loading === "cover-letter" ? "Generating..." : "Download Cover Letter (PDF)"}</span>
            </button>
          </div>
        </div>

        <aside className="student-portal__cover-preview">
          <div className="student-portal__preview-topbar">
            <div className="student-portal__preview-title-row">
              <span className="student-portal__preview-eye">◉</span>
              <span>Cover Letter Preview</span>
            </div>
            <span className="student-portal__preview-pill">{selectedTemplate.name} Template</span>
          </div>

          <div className="student-portal__preview-document">
            <div className="student-portal__preview-doc-head">
              <div>
                <h3>Anusha D K</h3>
                <p>Software Engineer | AI &amp; Data Enthusiast</p>
              </div>
              <span>31 July 2026</span>
            </div>

            <div className="student-portal__preview-contact">
              <PreviewLine icon="◌" text="anusha.dk@email.com" />
              <PreviewLine icon="☎" text="+61 4XX XXX XXX" />
              <PreviewLine icon="⌂" text="Adelaide, Australia" />
            </div>

            <div className="student-portal__preview-body">
              <p>Dear Hiring Manager,</p>
              <p>{coverLetter || selectedTemplate.sample}</p>
              <p>
                During my academic and professional journey, I have gained hands-on experience in Python, JavaScript, React
                and cloud technologies, working on impactful projects that solve real-world problems. I am particularly drawn
                to opportunities where I can contribute with clear execution and thoughtful collaboration.
              </p>
              <p>I would welcome the opportunity to discuss how my background aligns with your team’s needs.</p>
              <p>Sincerely,</p>
              <div className="student-portal__preview-signature">Anusha D K</div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
