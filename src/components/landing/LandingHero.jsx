import { Link } from "react-router-dom";
import HeroButton from "../ui/HeroButton.jsx";
import { InteractiveGridPattern } from "@/components/ui/interactive-grid-pattern";

export default function LandingHero() {
  return (
    <section className="flex flex-col items-start justify-center pl-12 h-screen hero">
      <div className="hero-grid-bg" aria-hidden="true">
        <div className="hero-grid-pattern-inner">
          <InteractiveGridPattern
            className="border-none inset-0 h-full min-w-full w-full opacity-40"
            squaresClassName="stroke-[color-mix(in_oklab,var(--foreground)_12%,transparent)]"
          />
        </div>
      </div>

      <h1 className="hero-h1">Quizzes that<br />run <em>themselves.</em></h1>
      <p className="hero-sub">Build timed quizzes in minutes. Share one link with your class. Review scores and export results from a single dashboard.</p>
      <div className="hero-actions">
        <HeroButton to="/login">Start as Teacher</HeroButton>
      </div>
    </section>
  );
}
