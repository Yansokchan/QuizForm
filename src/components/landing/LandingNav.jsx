import { Link } from "react-router-dom";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import DashboardButton from "@/components/ui/DashboardButton.jsx";
import useAuth from "@/hooks/useAuth";

export default function LandingNav({ scrolled }) {
  const { session, loading } = useAuth();
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
          <DashboardButton to="/login" compact>
            Sign in
          </DashboardButton>
        )}
      </div>
    </nav>
  );
}
