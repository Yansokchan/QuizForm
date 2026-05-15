export default function LandingFeatures() {
  return (
    <div className="lp-feat">
      <div className="feat-left">
        <p className="feat-label">Features</p>
        <h2>Everything a teacher<br /><em>actually needs.</em></h2>
        <p className="feat-copy">No bloat. No learning curve. Just the tools that matter for running focused and fair quiz sessions.</p>
      </div>
      <div className="feat-right">
        {[
          { n: "01", title: "Precise per-question timer", body: "Each item runs on its own countdown. When time ends, the quiz advances automatically." },
          { n: "02", title: "Class-based access windows", body: "Assign class groups and control quiz start/end times to protect access." },
          { n: "03", title: "Results and export", body: "Review per-student and per-question performance, then export when ready." },
        ].map((feature) => (
          <div className="feat-item" key={feature.n}>
            <div className="feat-num">{feature.n}</div><h3>{feature.title}</h3><p>{feature.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
