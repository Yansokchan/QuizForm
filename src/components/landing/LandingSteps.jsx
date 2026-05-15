export default function LandingSteps() {
  return (
    <div className="lp-steps">
      <p className="steps-label">How it works</p>
      <div className="steps-row">
        {[
          { n: "I", title: "Create", body: "Sign in, write questions, and set time limits per item." },
          { n: "II", title: "Share", body: "Copy the public quiz link and share it with students." },
          { n: "III", title: "Review", body: "Track results in the dashboard and export reports by class." },
        ].map((step) => (
          <div className="step" key={step.n}>
            <div className="step-n">{step.n}</div><h3>{step.title}</h3><p>{step.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
