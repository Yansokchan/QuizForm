import { Link } from "react-router-dom";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import DashboardButton from "@/components/ui/DashboardButton.jsx";
import { useAuthLoginDialog } from "@/contexts/AuthLoginDialogContext";
import useAuth from "@/hooks/useAuth";

export default function LandingNav({ scrolled }) {
  const { session, loading } = useAuth();
  const { openLogin } = useAuthLoginDialog();
  const isSignedIn = Boolean(session);

  return (
    <nav className={`lp-nav${scrolled ? " s" : ""}`}>
      <Link to="/" className="lp-logo">QuizForm</Link>
      <div className="lp-nav-r">
        <AnimatedThemeToggler className="nav-link theme-toggle-btn" />
        {!loading && isSignedIn && (
          <DashboardButton to="/dashboard" compact>
            Dashboard
          </DashboardButton>
        )}
        {!loading && !isSignedIn && (
          <DashboardButton type="button" compact onClick={openLogin}>
            Sign in
          </DashboardButton>
        )}
      </div>
    </nav>
  );
}
