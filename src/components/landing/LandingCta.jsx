import CtaButton from "../ui/CtaButton.jsx";
import { InteractiveGridPattern } from "../ui/interactive-grid-pattern.jsx";

export default function LandingCta() {
  return (
    <div className="lp-cta">
      <div className="hero-grid-bg" aria-hidden="true">
        <div className="hero-grid-pattern-inner">
          <InteractiveGridPattern
            className="border-none inset-0 h-full min-w-full w-full opacity-40"
            squaresClassName="stroke-[color-mix(in_oklab,var(--foreground)_12%,transparent)]"
          />
        </div>
      </div>
      <h2>Ready to run your<br />first quiz <em>today?</em></h2>
      <CtaButton
        className="lp-cta-btn mt-10"
        to="/login"
        primaryText="Get Started Free"
        secondaryText="Get Started Free"
      />
    </div>
  );
}
