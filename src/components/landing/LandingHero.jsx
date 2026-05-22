import { useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import HeroButton from "../ui/HeroButton.jsx";
import { InteractiveGridPattern } from "@/components/ui/interactive-grid-pattern";
import { useAuthLoginDialog } from "@/contexts/AuthLoginDialogContext";
import useAuth from "@/hooks/useAuth";
import { CircleArrowOutUpRight, SquareArrowOutUpRight } from "lucide-react";

export default function LandingHero() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const { openLogin } = useAuthLoginDialog();

  const handleTeacherCta = useCallback(() => {
    if (loading) return;
    if (session) navigate("/dashboard");
    else openLogin();
  }, [loading, session, navigate, openLogin]);

  const ctaLabel = session ? "Go to dashboard" : "Start as Teacher";

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

      <h1 className="hero-h1">Quizzes without<br />the <em>busywork.</em></h1>
      <p className="hero-sub">Set up a timed quiz, share one link with your class, and see scores on your dashboard.</p>
      <div className="hero-actions">
        <HeroButton onClick={handleTeacherCta} disabled={loading}>
          {ctaLabel}
        </HeroButton>
        <Link to="/demo" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group underline-offset-2 underline">
          Try demo quiz
          <SquareArrowOutUpRight size={16} className="group-hover:rotate-45 duration-100 transition-transform" />
        </Link>
      </div>
    </section>
  );
}
