export default function LandingFeatures() {
  return (
    <div className="lp-feat">
      <div className="feat-left">
        <p className="feat-label">Features</p>
        <h2>What teachers<br /><em>use it for</em></h2>
        <p className="feat-copy">Timers, class links, and results — without extra stuff you won't use.</p>
      </div>
      <div className="feat-right">
        {[
          { n: "01", title: "Timer on every question", body: "Each question runs on its own countdown. When time ends, the quiz moves to the next one." },
          { n: "02", title: "Open and close times", body: "Set when students can start and when the quiz closes." },
          { n: "03", title: "Scores and export", body: "See how each student did, question by question, and export when you're ready." },
        ].map((feature) => (
          <div className="feat-item" key={feature.n}>
            <div className="feat-num">{feature.n}</div><h3>{feature.title}</h3><p>{feature.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
