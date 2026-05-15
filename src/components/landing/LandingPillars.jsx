const PILLARS = [
  {
    label: "01 — Setup",
    title: "3-Step Flow",
    body: "Create, share, and review with minimal configuration. Be live in minutes.",
  },
  {
    label: "02 — Pacing",
    title: "Live Timing",
    body: "Each question has its own countdown and responses lock automatically.",
  },
  {
    label: "03 — Reporting",
    title: "Excel Export",
    body: "Download clean reports by quiz and class in one click.",
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
