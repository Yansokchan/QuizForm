const PILLARS = [
  {
    label: "01 — Setup",
    title: "Quick setup",
    body: "Create your quiz, share the link, and check results. A few minutes start to finish.",
  },
  {
    label: "02 — Pacing",
    title: "Timed questions",
    body: "Each question has its own timer. When time's up, the quiz moves on.",
  },
  {
    label: "03 — Reporting",
    title: "Export to Excel",
    body: "Download results by quiz and class when you need them.",
  },
];

export default function LandingPillars() {
  return (
    <section className="lp-pillars" aria-label="How QuizForm works">
      {PILLARS.map((pillar) => (
        <article className="pillar" key={pillar.label}>
          <p className="pillar-label">{pillar.label}</p>
          <h3 className="pillar-title">{pillar.title}</h3>
          <p className="pillar-body">{pillar.body}</p>
        </article>
      ))}
    </section>
  );
}
