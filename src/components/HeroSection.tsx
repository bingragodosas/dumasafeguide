import { Link } from "react-router-dom";
import "./HeroSection.css";
import heroBg from "../assets/footer.png"; // reuse your existing image

const STATS = [
  { num: "1,284", unit: "active", label: "Citizens Enrolled" },
  { num: "38",    unit: "units",  label: "Responders On Duty" },
  { num: "4.2",   unit: "min",    label: "Avg. Response Time" },
  { num: "6",     unit: "active", label: "Ongoing Incidents" },
];

export default function HeroSection() {
  return (
    <section className="hero" style={{ "--hero-bg": `url(${heroBg})` } as React.CSSProperties}>
      <div className="hero-bg" />
      <div className="hero-overlay" />
      <div className="hero-top-glow" />
      <div className="hero-bottom-fade" />
      <div className="hero-orb hero-orb--red" />
      <div className="hero-orb hero-orb--blue" />
      <div className="hero-scanline" />

      <div className="hero-content">
        <div className="hero-badge">
          <span className="hero-badge__dot" />
          Dumaguete City — Live System
        </div>
        <h1 className="hero-title">
          Your City.<br />
          <span className="hero-title--accent">Safer</span>
          <span className="hero-title--thin"> Together.</span>
        </h1>
        <p className="hero-sub">
          A barangay-wide community safety platform for real-time incident reporting,
          emergency response coordination, and disaster preparedness.
        </p>
        <div className="hero-actions">
          <Link to="/report" className="hero-btn hero-btn--primary">🚨 Report an Incident</Link>
          <Link to="/map"    className="hero-btn hero-btn--outline">🗺 View Safety Map</Link>
        </div>
      </div>

      <div className="hero-stats">
        {STATS.map((s) => (
          <div key={s.label} className="hero-stat">
            <div className="hero-stat__num">{s.num} <span>{s.unit}</span></div>
            <div className="hero-stat__label">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}