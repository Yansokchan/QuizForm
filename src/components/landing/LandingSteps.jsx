export default function LandingSteps() {
  return (
    <div className="lp-steps">
      <p className="steps-label">How it works</p>
      <div className="steps-row">
        {[
          { n: "I", title: "Create", body: "Sign in with Google, add questions, and set a time limit for each one." },
          { n: "II", title: "Share", body: "Copy the quiz link and send it to your class." },
          { n: "III", title: "Review", body: "Check scores in the dashboard and export by class when you need to." },
        ].map((step) => (
          <div className="step" key={step.n}>
            <div className="step-n">{step.n}</div><h3>{step.title}</h3><p>{step.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
