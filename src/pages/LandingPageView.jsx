import { useEffect, useState } from "react";
import LandingNav from "../components/landing/LandingNav";
import LandingHero from "../components/landing/LandingHero";
import LandingPillars from "../components/landing/LandingPillars";
import LandingFeatures from "../components/landing/LandingFeatures";
import LandingSteps from "../components/landing/LandingSteps";
import LandingCta from "../components/landing/LandingCta";
import LandingFooter from "../components/landing/LandingFooter";
import Reveal from "../components/landing/Reveal";
import "./LandingPage.css";

export default function LandingPageView() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem("quizform-theme");
    if (storedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (storedTheme === "light") {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="lp">
      <LandingNav scrolled={scrolled} />
      <LandingHero />
    

      <Reveal>
        <LandingPillars />
      </Reveal>

      <Reveal>
        <LandingFeatures />
      </Reveal>

      <Reveal>
        <LandingSteps />
      </Reveal>

      <Reveal>
        <LandingCta />
      </Reveal>

      <LandingFooter />
    </div>
  );
}
