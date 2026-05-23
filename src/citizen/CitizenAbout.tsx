// src/citizen/CitizenAbout.tsx
import { Link } from "react-router-dom";
import pagesBackground from "../assets/pagesbackground.png";
import {
  FaShieldAlt, FaBullseye, FaEye, FaMapMarkerAlt,
  FaPhoneAlt, FaClipboardList, FaHandshake, FaChevronRight,
  FaFileAlt,
} from "react-icons/fa";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@400;500;700;800;900&family=Instrument+Sans:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .ca-root {
    min-height: 100vh;
    font-family: 'Instrument Sans', sans-serif;
    color: #eef0f7;
    position: relative;
    overflow-x: hidden;
    background: #080c14;
  }
  .ca-bg {
    position: fixed; inset: 0; z-index: 0;
    background-size: cover; background-position: center; background-repeat: no-repeat;
  }
  .ca-bg::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(160deg, rgba(8,12,20,.92) 0%, rgba(8,12,20,.80) 50%, rgba(8,12,20,.93) 100%);
  }
  .ca-glow { position: fixed; inset: 0; pointer-events: none; z-index: 1; overflow: hidden; }
  .ca-glow-a {
    position: absolute; width: 640px; height: 640px; border-radius: 50%;
    background: radial-gradient(circle, rgba(46,204,143,.07) 0%, transparent 70%);
    top: -200px; left: -100px;
  }
  .ca-glow-b {
    position: absolute; width: 520px; height: 520px; border-radius: 50%;
    background: radial-gradient(circle, rgba(123,158,255,.05) 0%, transparent 70%);
    bottom: -160px; right: -80px;
  }
  .ca-glow-c {
    position: absolute; width: 360px; height: 360px; border-radius: 50%;
    background: radial-gradient(circle, rgba(46,204,143,.04) 0%, transparent 70%);
    top: 50%; right: 10%;
  }

  .ca-inner {
    position: relative; z-index: 2;
    max-width: 1080px; margin: 0 auto;
    padding: 0 24px 100px;
  }

  /* ── Hero ── */
  .ca-hero { margin-top: 52px; margin-bottom: 44px; }
  .ca-hero-tag {
    display: inline-flex; align-items: center; gap: 7px;
    font-size: 11px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase;
    color: #2ECC8F; margin-bottom: 18px;
  }
  .ca-hero-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: #2ECC8F; box-shadow: 0 0 8px #2ECC8F;
    animation: ca-pulse 2.2s ease infinite;
  }
  @keyframes ca-pulse {
    0%,100% { opacity:1; transform:scale(1); }
    50%      { opacity:.4; transform:scale(.75); }
  }
  .ca-hero-heading {
    font-family: 'Cabinet Grotesk', sans-serif;
    font-size: clamp(34px, 5.5vw, 62px);
    font-weight: 900; line-height: 1.0;
    letter-spacing: -.035em; color: #eef0f7;
    margin-bottom: 16px;
  }
  .ca-hero-heading em { font-style: normal; color: #2ECC8F; }
  .ca-hero-sub {
    font-size: 15px; font-weight: 400;
    color: rgba(238,240,247,.38);
    max-width: 520px; line-height: 1.7;
    margin-bottom: 22px;
  }
  .ca-meta {
    display: inline-flex; align-items: center; gap: 8px;
    font-size: 11px; font-weight: 600; letter-spacing: .10em; text-transform: uppercase;
    color: rgba(238,240,247,.22);
    background: rgba(15,21,33,.70);
    border: 1px solid rgba(255,255,255,.07);
    border-radius: 20px; padding: 6px 16px;
    backdrop-filter: blur(14px);
  }
  .ca-meta-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: #2ECC8F; box-shadow: 0 0 7px #2ECC8F;
    animation: ca-pulse 2.2s ease infinite;
  }

  /* ── Section label ── */
  .ca-sec { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; }
  .ca-sec-label {
    font-size: 10.5px; font-weight: 600; letter-spacing: .16em; text-transform: uppercase;
    color: rgba(238,240,247,.28); white-space: nowrap;
  }
  .ca-sec-line {
    flex: 1; height: 1px;
    background: linear-gradient(90deg, rgba(255,255,255,.1), transparent);
  }

  /* ── Intro card ── */
  .ca-intro {
    background: rgba(15,21,33,.82);
    border: 1px solid rgba(255,255,255,.07);
    border-radius: 18px; padding: 28px 32px;
    position: relative; overflow: hidden;
    backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
    margin-bottom: 14px;
  }
  .ca-intro::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, #2ECC8F, rgba(46,204,143,.3), transparent);
  }
  .ca-intro-eyebrow {
    font-size: 10px; font-weight: 600; letter-spacing: .18em; text-transform: uppercase;
    color: #2ECC8F; margin-bottom: 12px;
  }
  .ca-intro-text {
    font-size: 14.5px; font-weight: 400;
    color: rgba(238,240,247,.50); line-height: 1.78;
  }
  .ca-intro-text strong { color: #eef0f7; font-weight: 600; }

  /* ── Pillars grid ── */
  .ca-pillars { display: grid; grid-template-columns: repeat(2,1fr); gap: 12px; margin-bottom: 14px; }
  @media(max-width:640px) { .ca-pillars { grid-template-columns: 1fr; } }

  .ca-pillar {
    background: rgba(15,21,33,.82);
    border: 1px solid rgba(255,255,255,.07);
    border-top: 2px solid var(--pa);
    border-radius: 18px; padding: 26px 24px;
    position: relative; overflow: hidden;
    transition: transform .22s, border-color .22s, box-shadow .22s;
    backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  }
  .ca-pillar::before {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(ellipse 80% 60% at 0% 0%, var(--pd), transparent 70%);
    pointer-events: none;
  }
  .ca-pillar:hover {
    transform: translateY(-3px);
    border-color: var(--pa);
    box-shadow: 0 0 24px var(--pd), 0 8px 32px rgba(0,0,0,.38);
  }
  .ca-pillar-top {
    display: flex; align-items: flex-start;
    justify-content: space-between; margin-bottom: 16px;
    position: relative; z-index: 1;
  }
  .ca-pillar-icon-wrap {
    width: 42px; height: 42px; border-radius: 11px;
    background: var(--pd); border: 1px solid var(--pa);
    display: flex; align-items: center; justify-content: center;
    color: var(--pa); font-size: 17px;
    transition: transform .2s;
  }
  .ca-pillar:hover .ca-pillar-icon-wrap { transform: scale(1.06); }
  .ca-pillar-tag {
    font-size: 9px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase;
    color: var(--pa); border: 1px solid var(--pa);
    border-radius: 4px; padding: 3px 8px; opacity: .72;
    position: relative; z-index: 1;
  }
  .ca-pillar-title {
    font-family: 'Cabinet Grotesk', sans-serif;
    font-size: 17px; font-weight: 800;
    letter-spacing: -.02em; color: #eef0f7;
    margin-bottom: 10px; position: relative; z-index: 1;
  }
  .ca-pillar-body {
    font-size: 13.5px; font-weight: 400;
    color: rgba(238,240,247,.40); line-height: 1.72;
    position: relative; z-index: 1;
  }

  /* ── Features list ── */
  .ca-features {
    background: rgba(15,21,33,.82);
    border: 1px solid rgba(255,255,255,.07);
    border-radius: 18px; overflow: hidden;
    backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
    position: relative; margin-bottom: 14px;
  }
  .ca-features::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, #7B9EFF, rgba(123,158,255,.3), transparent);
  }
  .ca-features-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 24px; border-bottom: 1px solid rgba(255,255,255,.06);
  }
  .ca-features-title {
    font-family: 'Cabinet Grotesk', sans-serif;
    font-size: 15px; font-weight: 700; color: #eef0f7;
  }
  .ca-feat-count {
    font-size: 11px; font-weight: 600;
    color: rgba(238,240,247,.28);
    background: rgba(255,255,255,.04);
    border: 1px solid rgba(255,255,255,.07);
    border-radius: 20px; padding: 3px 10px;
  }
  .ca-feature {
    display: flex; align-items: flex-start; gap: 16px;
    padding: 18px 24px;
    border-bottom: 1px solid rgba(255,255,255,.04);
    transition: background .18s;
  }
  .ca-feature:last-child { border-bottom: none; }
  .ca-feature:hover { background: rgba(255,255,255,.025); }
  .ca-feat-icon {
    width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
    background: var(--fi); border: 1px solid var(--fb);
    display: flex; align-items: center; justify-content: center;
    color: var(--fc); font-size: 15px; margin-top: 1px;
    transition: transform .2s;
  }
  .ca-feature:hover .ca-feat-icon { transform: scale(1.06); }
  .ca-feat-label {
    font-size: 14px; font-weight: 600; color: #eef0f7;
    margin-bottom: 4px; letter-spacing: -.005em;
  }
  .ca-feat-detail {
    font-size: 12.5px; font-weight: 400;
    color: rgba(238,240,247,.32); line-height: 1.65;
  }

  /* ── Partners strip ── */
  .ca-partners {
    background: rgba(15,21,33,.82);
    border: 1px solid rgba(255,255,255,.07);
    border-radius: 18px; padding: 24px 28px;
    backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
    position: relative; overflow: hidden; margin-bottom: 14px;
  }
  .ca-partners::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, #FFD166, rgba(255,209,102,.3), transparent);
  }
  .ca-partners-eyebrow {
    font-size: 10px; font-weight: 600; letter-spacing: .18em; text-transform: uppercase;
    color: #FFD166; margin-bottom: 14px;
  }
  .ca-partners-list { display: flex; flex-wrap: wrap; gap: 8px; }
  .ca-partner-badge {
    display: inline-flex; align-items: center; gap: 7px;
    font-size: 12px; font-weight: 500;
    color: rgba(238,240,247,.55);
    background: rgba(255,255,255,.04);
    border: 1px solid rgba(255,255,255,.09);
    border-radius: 8px; padding: 7px 13px;
    transition: all .2s;
  }
  .ca-partner-badge:hover { color: #eef0f7; border-color: rgba(255,255,255,.18); background: rgba(255,255,255,.07); }
  .ca-partner-dot { width: 5px; height: 5px; border-radius: 50%; background: #FFD166; opacity: .6; }

  /* ── CTA ── */
  .ca-cta {
    background: rgba(15,21,33,.82);
    border: 1px solid rgba(255,107,107,.18);
    border-radius: 18px; padding: 30px 32px;
    display: flex; align-items: center; justify-content: space-between; gap: 20px;
    backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
    position: relative; overflow: hidden;
  }
  .ca-cta::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, #FF6B6B, rgba(255,107,107,.3), transparent);
  }
  .ca-cta-text h3 {
    font-family: 'Cabinet Grotesk', sans-serif;
    font-size: 17px; font-weight: 800;
    letter-spacing: -.02em; color: #eef0f7;
    margin-bottom: 5px;
  }
  .ca-cta-text p {
    font-size: 13px; font-weight: 400;
    color: rgba(238,240,247,.30); line-height: 1.55; max-width: 360px;
  }
  .ca-cta-btn {
    flex-shrink: 0;
    display: inline-flex; align-items: center; gap: 9px;
    font-size: 12px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase;
    color: #fff;
    background: linear-gradient(135deg, #FF6B6B, #c94040);
    border: none; border-radius: 10px;
    padding: 13px 22px; cursor: pointer; text-decoration: none;
    transition: transform .2s, box-shadow .2s;
    box-shadow: 0 0 28px rgba(255,107,107,.22);
    white-space: nowrap;
  }
  .ca-cta-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 48px rgba(255,107,107,.44);
  }
  @media(max-width:600px) {
    .ca-cta { flex-direction: column; align-items: flex-start; }
    .ca-inner { padding: 0 16px 80px; }
    .ca-intro { padding: 20px 18px; }
    .ca-feature { padding: 14px 18px; }
    .ca-cta { padding: 22px 20px; }
    .ca-partners { padding: 20px 18px; }
  }
`;

const pillars = [
  {
    id: "mission",
    icon: <FaBullseye />,
    accent: "#FF6B6B",
    dim: "rgba(255,107,107,.12)",
    tag: "Purpose",
    title: "Our Mission",
    body: "To improve public safety awareness, enhance emergency accessibility, and support timely communication between the public and emergency service providers in Dumaguete City.",
  },
  {
    id: "vision",
    icon: <FaEye />,
    accent: "#7B9EFF",
    dim: "rgba(123,158,255,.12)",
    tag: "Future",
    title: "Our Vision",
    body: "A safer, more informed Dumaguete City where residents, students, and visitors can access reliable emergency information anytime, anywhere — without barriers.",
  },
];

const features = [
  {
    icon: <FaPhoneAlt />,
    label: "Verified Contacts",
    detail: "Curated, regularly updated emergency hotlines for hospitals, barangay offices, and city-wide disaster response units.",
    color: "#2ECC8F",
    bg: "rgba(46,204,143,.10)",
    border: "rgba(46,204,143,.22)",
  },
  {
    icon: <FaShieldAlt />,
    label: "Safety Guidelines",
    detail: "Practical, barangay-level preparedness tips covering typhoons, floods, fires, and other common local emergencies.",
    color: "#7B9EFF",
    bg: "rgba(123,158,255,.10)",
    border: "rgba(123,158,255,.22)",
  },
  {
    icon: <FaClipboardList />,
    label: "Incident Reporting",
    detail: "A fast, accessible reporting form that lets residents alert local responders directly — no delays, no confusion.",
    color: "#FF6B6B",
    bg: "rgba(255,107,107,.10)",
    border: "rgba(255,107,107,.22)",
  },
  {
    icon: <FaHandshake />,
    label: "Partner Network",
    detail: "Coordinated with CDRRMO, Philippine Red Cross, Bureau of Fire Protection, and other key government agencies.",
    color: "#FFD166",
    bg: "rgba(255,209,102,.10)",
    border: "rgba(255,209,102,.22)",
  },
];

const partners = [
  "CDRRMO",
  "Philippine Red Cross",
  "Bureau of Fire Protection",
  "Barangay Units",
  "Dumaguete City Hall",
  "PNP Dumaguete",
];

export default function CitizenAbout() {
  return (
    <>
      <style>{CSS}</style>
      <div className="ca-root">
        <div className="ca-bg" style={{ backgroundImage: `url(${pagesBackground})` }} />
        <div className="ca-glow">
          <div className="ca-glow-a" />
          <div className="ca-glow-b" />
          <div className="ca-glow-c" />
        </div>

        <div className="ca-inner">

          {/* ── Hero ── */}
          <section className="ca-hero">
            <div className="ca-hero-tag">
              <span className="ca-hero-dot" />
              About Us
            </div>
            <h1 className="ca-hero-heading">
              About<br />
              <em>DumaSafe</em>Guide
            </h1>
            <p className="ca-hero-sub">
              A web-based public safety and emergency reporting system built for
              Dumaguete City — consolidating everything you need in one place.
            </p>
            <div className="ca-meta">
              <span className="ca-meta-dot" />
              Serving Dumaguete City · Est. 2025
            </div>
          </section>

          {/* ── What is DSG ── */}
          <div className="ca-sec">
            <span className="ca-sec-label">Overview</span>
            <span className="ca-sec-line" />
          </div>
          <div className="ca-intro" style={{ marginBottom: 32 }}>
            <div className="ca-intro-eyebrow">What is DumaSafeGuide?</div>
            <p className="ca-intro-text">
              <strong>DumaSafeGuide (DSG)</strong> is a web-based public safety and emergency reporting
              system designed specifically for <strong>Dumaguete City</strong>. It consolidates verified
              emergency contacts, safety tips, preparedness guidelines, and reporting features into
              one accessible platform — so that when seconds matter, you're never searching for answers.
            </p>
          </div>

          {/* ── Mission & Vision ── */}
          <div className="ca-sec">
            <span className="ca-sec-label">Mission &amp; Vision</span>
            <span className="ca-sec-line" />
          </div>
          <div className="ca-pillars" style={{ marginBottom: 32 }}>
            {pillars.map((p) => (
              <div
                key={p.id}
                className="ca-pillar"
                style={{ "--pa": p.accent, "--pd": p.dim } as React.CSSProperties}
              >
                <div className="ca-pillar-top">
                  <div className="ca-pillar-icon-wrap">{p.icon}</div>
                  <span className="ca-pillar-tag">{p.tag}</span>
                </div>
                <div className="ca-pillar-title">{p.title}</div>
                <p className="ca-pillar-body">{p.body}</p>
              </div>
            ))}
          </div>

          {/* ── What We Provide ── */}
          <div className="ca-sec">
            <span className="ca-sec-label">What We Provide</span>
            <span className="ca-sec-line" />
          </div>
          <div className="ca-features" style={{ marginBottom: 32 }}>
            <div className="ca-features-header">
              <span className="ca-features-title">Platform Features</span>
              <span className="ca-feat-count">{features.length} features</span>
            </div>
            {features.map((f) => (
              <div key={f.label} className="ca-feature">
                <div
                  className="ca-feat-icon"
                  style={{ "--fc": f.color, "--fi": f.bg, "--fb": f.border } as React.CSSProperties}
                >
                  {f.icon}
                </div>
                <div>
                  <div className="ca-feat-label">{f.label}</div>
                  <p className="ca-feat-detail">{f.detail}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Partners ── */}
          <div className="ca-sec">
            <span className="ca-sec-label">Partner Agencies</span>
            <span className="ca-sec-line" />
          </div>
          <div className="ca-partners" style={{ marginBottom: 32 }}>
            <div className="ca-partners-eyebrow">Coordinated With</div>
            <div className="ca-partners-list">
              {partners.map((p) => (
                <span key={p} className="ca-partner-badge">
                  <span className="ca-partner-dot" />
                  {p}
                </span>
              ))}
            </div>
          </div>

          {/* ── CTA ── */}
          <div className="ca-cta">
            <div className="ca-cta-text">
              <h3>Need to report an emergency?</h3>
              <p>Don't wait — use the incident reporting form to alert local responders immediately.</p>
            </div>
            <Link to="/report" className="ca-cta-btn">
              <FaFileAlt size={12} /> Report Now <FaChevronRight size={10} />
            </Link>
          </div>

        </div>
      </div>
    </>
  );
}