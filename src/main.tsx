import { FormEvent, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

type Analysis = {
  overallMatchScore: number;
  recruiterFirstImpression: string;
  topStrengths: string[];
  topGaps: string[];
  atsScore: number;
  careerDNA: string[];
  nextActions: string[];
};

const sample: Analysis = {
  overallMatchScore: 78,
  recruiterFirstImpression:
    "A credible operations candidate with clear ownership signals. The strongest evidence is measurable process improvement; role-specific language could be tighter.",
  topStrengths: [
    "Quantified operational impact",
    "Cross-functional ownership",
    "Relevant customer-facing experience",
  ],
  topGaps: [
    "Two priority job-description phrases are not evidenced",
    "Recent role summary buries the strongest result",
  ],
  atsScore: 74,
  careerDNA: ["Systems thinker", "Customer advocate", "Operational builder"],
  nextActions: [
    "Move the most relevant quantified result into the top third",
    "Mirror supported terminology from the job description",
    "Remove one low-relevance bullet to sharpen the narrative",
  ],
};

const clamp = (value: number) => Math.max(0, Math.min(100, value));

function Logo() {
  return (
    <a className="logo" href="#top" aria-label="Threadline home">
      <span className="logo-mark" aria-hidden="true"><i /><i /><i /></span>
      Threadline
    </a>
  );
}

function ScoreRing({ score, label }: { score: number; label: string }) {
  const safe = clamp(score);
  return (
    <div className="score-wrap" aria-label={`${label}: ${safe} out of 100`}>
      <div className="score-ring" style={{ "--score": `${safe * 3.6}deg` } as React.CSSProperties}>
        <div><strong>{safe}</strong><span>/100</span></div>
      </div>
      <p>{label}</p>
    </div>
  );
}

function Report({ data, sampleMode = false }: { data: Analysis; sampleMode?: boolean }) {
  return (
    <div className="report">
      <div className="report-head">
        <div>
          <span className="eyebrow">{sampleMode ? "Sample analysis" : "Your analysis"}</span>
          <h3>Your recruiter-readiness snapshot</h3>
        </div>
        <span className="truth-badge">Evidence only</span>
      </div>
      <div className="score-grid">
        <ScoreRing score={data.overallMatchScore} label="Overall match" />
        <ScoreRing score={data.atsScore} label="ATS alignment" />
        <div className="impression">
          <span className="mini-label">Recruiter’s first impression</span>
          <p>{data.recruiterFirstImpression}</p>
        </div>
      </div>
      <div className="report-grid">
        <div className="report-card strength">
          <span className="mini-label">Top strengths</span>
          <ul>{data.topStrengths.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
        <div className="report-card gap">
          <span className="mini-label">Top gaps</span>
          <ul>{data.topGaps.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
        <div className="report-card">
          <span className="mini-label">Career DNA</span>
          <div className="tags">{data.careerDNA.map((item) => <span key={item}>{item}</span>)}</div>
        </div>
        <div className="report-card actions">
          <span className="mini-label">Your next 3 actions</span>
          <ol>{data.nextActions.map((item) => <li key={item}>{item}</li>)}</ol>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [resume, setResume] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const counts = useMemo(() => ({
    resume: resume.trim().split(/\s+/).filter(Boolean).length,
    job: jobDescription.trim().split(/\s+/).filter(Boolean).length,
  }), [resume, jobDescription]);

  async function analyze(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (resume.trim().length < 200 || jobDescription.trim().length < 120) {
      setError("Please paste a fuller resume and job description so the comparison has enough evidence.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/job-fit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume, jobDescription }),
      });
      const payload = await response.json() as Analysis & { error?: string };
      if (!response.ok) throw new Error(payload.error || "Analysis could not be completed.");
      setAnalysis(payload);
      requestAnimationFrame(() => document.querySelector("#results")?.scrollIntoView({ behavior: "smooth" }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function checkout() {
    setCheckoutLoading(true);
    window.location.assign("https://buy.stripe.com/28E14fdwh7g19PF8FZ08g0a");
  }

  return (
    <>
      <header className="nav" id="top">
        <div className="nav-inner">
          <Logo />
          <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-controls="navigation">Menu</button>
          <nav id="navigation" className={menuOpen ? "open" : ""} aria-label="Primary navigation">
            <a href="#how" onClick={() => setMenuOpen(false)}>How it works</a>
            <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#pricing" onClick={() => setMenuOpen(false)}>Pricing</a>
            <a href="#faq" onClick={() => setMenuOpen(false)}>FAQ</a>
          </nav>
          <a className="button button-small" href="#pricing">Reserve a review</a>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow"><span className="dot" /> Same-day human resume review</span>
            <h1>See what recruiters see.<br /><em>Before they do.</em></h1>
            <p>Get a clear, human-reviewed diagnosis of the resume you are using now—matched against the job you want, with concrete fixes you can use immediately.</p>
            <div className="hero-actions">
              <a href="#pricing" className="button">Reserve my same-day review <span>→</span></a>
              <a href="#sample" className="text-link">View sample report</a>
            </div>
            <div className="trust-line"><span>✓ Human-reviewed</span><span>✓ Evidence-based</span><span>✓ Delivered within one business day</span></div>
          </div>
          <div className="hero-visual" aria-label="Threadline match preview">
            <div className="preview-window">
              <div className="window-bar"><span /><span /><span /><small>Recruiter view</small></div>
              <div className="preview-content">
                <div className="preview-title"><div><span className="skeleton short" /><span className="skeleton long" /></div><b>Strong fit</b></div>
                <div className="match-row"><div className="mini-ring">82</div><div><strong>Clear, credible match</strong><p>Your experience supports most of the role’s core needs.</p></div></div>
                <div className="signal"><i /> Strongest signal <strong>Operational ownership</strong></div>
                <div className="signal warning"><i /> Biggest opportunity <strong>Surface measurable impact sooner</strong></div>
              </div>
            </div>
            <div className="floating-note">Truth Check <strong>All claims supported ✓</strong></div>
          </div>
        </section>

        <section className="analyzer section" id="analyze">
          <div className="section-heading">
            <span className="eyebrow">Free job-fit analysis</span>
            <h2>Two documents. One honest read.</h2>
            <p>Paste the text below. We use it only to generate this analysis and do not persist it.</p>
          </div>
          <form className="input-panel" onSubmit={analyze}>
            <label>
              <span><b>01</b> Your resume <small>{counts.resume} words</small></span>
              <textarea value={resume} onChange={(event) => setResume(event.target.value)} placeholder="Paste your complete resume here…" rows={12} aria-describedby="resume-help" />
              <small id="resume-help">Include your real experience, skills, education, and accomplishments.</small>
            </label>
            <div className="connector" aria-hidden="true"><span>+</span></div>
            <label>
              <span><b>02</b> Job description <small>{counts.job} words</small></span>
              <textarea value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} placeholder="Paste the full job description here…" rows={12} aria-describedby="job-help" />
              <small id="job-help">Use the exact listing for the role you’re targeting.</small>
            </label>
            <div className="form-footer">
              <p><span>🔒</span> Your resume and job description are not saved by Threadline.</p>
              <button className="button" type="submit" disabled={loading}>{loading ? "Reading the signal…" : "Reveal my job fit"} <span>→</span></button>
            </div>
            {error && <p className="error" role="alert">{error}</p>}
          </form>
        </section>

        {analysis && <section className="section results" id="results"><Report data={analysis} /></section>}

        <section className="steps section" id="how">
          <div className="section-heading"><span className="eyebrow">How it works</span><h2>From application to clarity in minutes.</h2></div>
          <div className="three-grid">
            {[
              ["01", "Bring the evidence", "Paste your resume and the role. No formatting ritual, no account, no guesswork."],
              ["02", "We read like a recruiter", "Threadline compares requirements, proof, language, hierarchy, and likely objections."],
              ["03", "Act on what matters", "Get a prioritized, truthful plan—not a wall of generic resume advice."],
            ].map(([number, title, body]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{body}</p></article>)}
          </div>
        </section>

        <section className="features section" id="features">
          <div className="section-heading left"><span className="eyebrow">Built for the real review</span><h2>Signal over spin.</h2><p>Every insight is grounded in the words already on your resume.</p></div>
          <div className="feature-grid">
            {[
              ["◎", "Recruiter lens", "Understand the first 10-second impression and what it makes a reviewer believe."],
              ["⌁", "ATS alignment", "See supported keywords you’re missing and where your language can align naturally."],
              ["◈", "Career DNA", "Identify the durable patterns that connect your experience across roles and industries."],
              ["✓", "Truth Check", "Recommendations are constrained to resume evidence. Missing evidence stays a gap."],
              ["↗", "Transferable skills", "Surface capabilities your history proves—even when your old title doesn’t say it."],
              ["⏱", "Prioritized action", "Focus first on the edits most likely to change a recruiter’s decision."],
            ].map(([icon, title, body]) => <article key={title}><i>{icon}</i><h3>{title}</h3><p>{body}</p></article>)}
          </div>
        </section>

        <section className="sample section" id="sample">
          <div className="section-heading"><span className="eyebrow">Not another generic score</span><h2>A report you can actually use.</h2><p>Clear reasoning, prioritized changes, and an evidence trail.</p></div>
          <Report data={sample} sampleMode />
        </section>

        <section className="pricing section" id="pricing">
          <div className="section-heading"><span className="eyebrow">Five review slots this week</span><h2>Get the feedback your application needs before you hit submit.</h2></div>
          <div className="pricing-grid">
            <article className="price-card">
              <span className="plan">Snapshot</span><h3>Free</h3><p>Know where you stand before you apply.</p>
              <ul><li>Overall match score</li><li>Recruiter first impression</li><li>Top strengths and gaps</li><li>ATS score and Career DNA</li><li>3 prioritized next actions</li></ul>
              <a href="#analyze" className="button button-outline">Analyze for free</a>
            </article>
            <article className="price-card premium">
              <span className="popular">Human-reviewed</span><span className="plan">Same-Day Resume Diagnostic</span><h3>$49 <small>one time</small></h3><p>Reserve one of five same-day review slots this week. Get a focused expert review of your resume for the job you want.</p>
              <ul><li>Human review of your current resume</li><li>Review against your target job posting</li><li>Your 5 highest-impact fixes</li><li>Clear positioning recommendations</li><li>Delivered within one business day</li><li>No subscription or recurring charge</li></ul>
              <button className="button" onClick={checkout} disabled={checkoutLoading}>{checkoutLoading ? "Opening secure checkout…" : "Reserve my review"} <span>→</span></button>
            </article>
          </div>
        </section>

        <section className="faq section" id="faq">
          <div className="section-heading"><span className="eyebrow">Questions, answered</span><h2>Honesty is the product.</h2></div>
          <div className="faq-list">
            {[
              ["Will Threadline invent experience to improve my resume?", "No. Threadline is explicitly constrained to the evidence in your resume. If the job asks for something your resume does not support, we label it as a gap—not an opportunity to fabricate."],
              ["Do you store my resume?", "Threadline does not intentionally persist resume or job-description text. Your input is sent for the analysis request and returned to your browser as a report."],
              ["Is the match score a guarantee?", "No. Hiring is human and contextual. The score is a directional assessment of the evidence and alignment visible in the two documents, not a promise of an interview."],
              ["Does it work for career changers?", "Yes. Threadline looks for supported transferable skills and career patterns while staying honest about missing domain experience."],
              ["What do I get in the Same-Day Resume Diagnostic?", "A human review of your current resume against one target job, your five highest-impact fixes, and clear positioning recommendations—delivered within one business day."],
            ].map(([question, answer]) => <details key={question}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}
          </div>
        </section>

        <section className="cta">
          <span className="eyebrow">Your application deserves a fair read</span>
          <h2>Make your next application clearer, stronger, and easier to trust.</h2>
          <p>See what’s working, what isn’t, and what to do next.</p>
          <a href="#pricing" className="button button-light">Reserve my review <span>→</span></a>
        </section>
      </main>

      <footer>
        <div><Logo /><p>Truthful career intelligence for people making their next move.</p></div>
        <div className="footer-links"><a href="#how">How it works</a><a href="#pricing">Pricing</a><a href="/privacy.html">Privacy</a><a href="/terms.html">Terms</a></div>
        <p className="copyright">© {new Date().getFullYear()} Threadline</p>
      </footer>
    </>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
