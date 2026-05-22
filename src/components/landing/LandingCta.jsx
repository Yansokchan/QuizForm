import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import CtaButton from "../ui/CtaButton.jsx";
import { InteractiveGridPattern } from "../ui/interactive-grid-pattern.jsx";
import { useAuthLoginDialog } from "@/contexts/AuthLoginDialogContext";
import useAuth from "@/hooks/useAuth";

export default function LandingCta() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const { openLogin } = useAuthLoginDialog();

  const handleTeacherCta = useCallback(() => {
    if (loading) return;
    if (session) navigate("/dashboard");
    else openLogin();
  }, [loading, session, navigate, openLogin]);

  const ctaLabel = session ? "Go to dashboard" : "Get Started Free";

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
      <h2>Ready to run a quiz<br />with your <em>class?</em></h2>
      <CtaButton
        className="lp-cta-btn mt-10"
        onClick={handleTeacherCta}
        disabled={loading}
        primaryText={ctaLabel}
        secondaryText={ctaLabel}
      />
    </div>
  );
}
