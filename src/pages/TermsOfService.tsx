import { Link } from "react-router-dom";
import Footer from "../components/Footer";
import emergencyBg from "../assets/emergency.jpg";

const sections = [
  {
    id: "responsibilities",
    icon: "👤",
    accent: "#2ECC8F",
    tag: "User Conduct",
    title: "User Responsibilities",
    content: [
      {
        heading: "Accurate Information",
        body: "Users must provide truthful and accurate information when submitting incident reports, emergency tips, or any content through DumaSafeGuide. Deliberately false reports that trigger unnecessary emergency responses may constitute a criminal offense under Philippine law.",
      },
      {
        heading: "Appropriate Use",
        body: "This platform is intended solely for disaster preparedness, emergency response coordination, and community safety. Use of this platform for personal disputes, harassment, or any purpose unrelated to public safety is strictly prohibited.",
      },
      {
        heading: "Account Security",
        body: "If a registered account is provided, users are responsible for maintaining the confidentiality of their credentials. Any unauthorized use of an account must be reported immediately to DumaSafeGuide administrators.",
      },
    ],
  },
  {
    id: "privacy",
    icon: "🔒",
    accent: "#4A90D9",
    tag: "Data & Privacy",
    title: "Privacy Policy",
    content: [
      {
        heading: "Data We Collect",
        body: "DumaSafeGuide may collect location data, contact information, and incident details submitted voluntarily by users. This data is used exclusively for emergency coordination and is not sold or shared with commercial third parties.",
      },
      {
        heading: "Data Retention",
        body: "Incident reports and user-submitted data may be retained for up to three (3) years for archival, analysis, and improvement of emergency response services. Users may request deletion of their personal data by contacting the platform administrators.",
      },
      {
        heading: "Third-Party Sharing",
        body: "Information may be shared with partner government agencies (CDRRMO, BFP, PNP, Philippine Red Cross) strictly for emergency coordination purposes. No data is shared with private commercial entities without explicit user consent.",
      },
    ],
  },
  {
    id: "ra10175",
    icon: "📜",
    accent: "#F5C842",
    tag: "Legal Framework",
    title: "RA 10175 Overview",
    content: [
      {
        heading: "Cybercrime Prevention Act of 2012",
        body: "Republic Act 10175, or the Cybercrime Prevention Act of 2012, governs the responsible use of online platforms in the Philippines. DumaSafeGuide operates in full compliance with this law.",
      },
      {
        heading: "Prohibited Online Acts",
        body: "Under RA 10175, acts such as cyber libel, identity theft, illegal access to systems, and online fraud are criminal offenses. Users who misuse DumaSafeGuide for such purposes may face civil and criminal liability under this Act.",
      },
      {
        heading: "Reporting Violations",
        body: "If you encounter any content or user behavior on this platform that violates RA 10175 or other applicable laws, report it immediately through the platform's admin contact or directly to the National Bureau of Investigation Cybercrime Division.",
      },
    ],
    penalties: [
      {
        offense: "Illegal Access / Hacking",
        prison: "6 years 1 day – 12 years",
        fine: "₱200,000 – ₱500,000",
        severity: "high",
      },
      {
        offense: "Cyber Libel",
        prison: "6 years 1 day – 12 years",
        fine: "₱200,000 – ₱1,000,000",
        severity: "high",
      },
      {
        offense: "Identity Theft",
        prison: "6 years 1 day – 12 years",
        fine: "₱200,000 – ₱500,000",
        severity: "high",
      },
      {
        offense: "Cybersex",
        prison: "6 years 1 day – 12 years",
        fine: "₱200,000 – ₱1,000,000",
        severity: "high",
      },
      {
        offense: "Child Pornography (online)",
        prison: "Up to reclusion perpetua",
        fine: "Up to ₱5,000,000",
        severity: "critical",
      },
      {
        offense: "Online Fraud / Estafa",
        prison: "6 months 1 day – 20 years",
        fine: "Amount defrauded + damages",
        severity: "medium",
      },
      {
        offense: "Unsolicited Commercial Communications (Spam)",
        prison: "Up to 6 months",
        fine: "Up to ₱50,000 per spam",
        severity: "low",
      },
    ],
  },
  {
    id: "disclaimer",
    icon: "⚠️",
    accent: "#e8372a",
    tag: "Disclaimers",
    title: "Limitation of Liability",
    content: [
      {
        heading: "No Guarantee of Response",
        body: "DumaSafeGuide is an information and coordination aid. It does not guarantee emergency response times or outcomes. Users should always contact official emergency services directly (911, local CDRRMO) during life-threatening situations.",
      },
      {
        heading: "Platform Availability",
        body: "We strive for high availability but cannot guarantee uninterrupted access during extreme disaster events that may affect internet infrastructure. Always have offline emergency plans and barangay-level contacts as backup.",
      },
      {
        heading: "Information Accuracy",
        body: "While we work to keep all information up to date, contact numbers, agency details, and safety guidelines may change. Always verify critical information with the relevant agency directly before acting on it.",
      },
    ],
  },
];

const SEVERITY_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  critical: { bg: "rgba(232,55,42,0.12)",  border: "rgba(232,55,42,0.35)",  text: "#e8372a", dot: "#e8372a" },
  high:     { bg: "rgba(245,200,66,0.10)",  border: "rgba(245,200,66,0.30)",  text: "#F5C842", dot: "#F5C842" },
  medium:   { bg: "rgba(74,144,217,0.10)",  border: "rgba(74,144,217,0.28)",  text: "#4A90D9", dot: "#4A90D9" },
  low:      { bg: "rgba(46,204,143,0.08)",  border: "rgba(46,204,143,0.25)",  text: "#2ECC8F", dot: "#2ECC8F" },
};

export default function TermsOfService() {
  return (
    <>
      <style>{`
        /* ── Fonts: Syne 800 (headings) + DM Sans 300/400/500 (body) — matches About page ── */
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:       #07101d;
          --surface:  rgba(13,27,46,0.72);
          --surface2: rgba(13,27,46,0.88);
          --border:   rgba(0,200,224,0.08);
          --border2:  rgba(0,200,224,0.18);
          --text:     #ddeef8;
          --text2:    rgba(160,200,224,0.65);
          --text3:    rgba(160,200,224,0.30);
          --red:      #e8372a;
          --cyan:     #00c8e0;
          --blue:     #4A90D9;
          --green:    #2ECC8F;
          --pink:     #EF5B9E;
          --yellow:   #F5C842;
          --radius:   13px;
        }

        .tos {
          min-height: 100vh;
          font-family: 'DM Sans', sans-serif;
          color: var(--text);
          background: var(--bg);
          position: relative;
          overflow-x: hidden;
        }

        /* ── Background — exact match to About page ── */
        .tos-bg { position: fixed; inset: 0; z-index: 0; overflow: hidden; }
        .tos-bg-img {
          width: 100%; height: 100%;
          object-fit: cover; object-position: center; display: block;
          transform-origin: center center;
          animation: bgDrift 30s ease-in-out infinite;
          will-change: transform;
        }

        @keyframes bgDrift {
          0%   { transform: scale(1.08) translate(0px,   0px);   }
          25%  { transform: scale(1.11) translate(-16px, -10px); }
          50%  { transform: scale(1.10) translate(-8px,  -18px); }
          75%  { transform: scale(1.12) translate(14px,  -6px);  }
          100% { transform: scale(1.08) translate(0px,   0px);   }
        }

        .tos-bg-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(
            180deg,
            rgba(7,16,29,0.82) 0%,
            rgba(7,16,29,0.68) 40%,
            rgba(7,16,29,0.82) 75%,
            rgba(7,16,29,0.97) 100%
          );
        }
        .tos-bg-atmosphere {
          position: absolute; inset: 0; pointer-events: none;
          background:
            radial-gradient(ellipse 60% 50% at 10% 0%,  rgba(232,55,42,0.09)  0%, transparent 65%),
            radial-gradient(ellipse 55% 60% at 90% 100%, rgba(0,200,224,0.07)  0%, transparent 70%),
            radial-gradient(ellipse 40% 40% at 55% 45%,  rgba(13,27,46,0.40)   0%, transparent 60%);
        }
        .tos-bg-grain {
          position: absolute; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
          background-size: 200px; opacity: 0.45; pointer-events: none;
        }

        .tos-wrap {
          position: relative; z-index: 1;
          max-width: 1100px; margin: 0 auto;
          padding: 0 28px 120px;
        }

        .tos-nav {
          display: flex; align-items: center; justify-content: space-between;
          padding: 28px 0 0;
          animation: fadeUp .5s ease both;
        }
        .tos-logo {
          display: flex; align-items: center; gap: 10px; text-decoration: none;
          font-family: 'Syne', sans-serif;
          font-size: 15px; font-weight: 800;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: var(--text);
        }
        .tos-logo-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: var(--red);
          box-shadow: 0 0 12px var(--red), 0 0 24px rgba(232,55,42,0.4);
          animation: breathe 2.4s ease infinite;
        }
        @keyframes breathe {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:.55; transform:scale(.78); }
        }
        .tos-back {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase;
          color: var(--text3); text-decoration: none;
          border: 1px solid rgba(0,200,224,0.12); border-radius: 8px;
          padding: 8px 16px; transition: all .2s;
          background: rgba(13,27,46,0.60); backdrop-filter: blur(18px);
          display: flex; align-items: center; gap: 6px;
        }
        .tos-back:hover { color: var(--text); border-color: rgba(0,200,224,0.30); }

        .tos-hero {
          margin-top: 72px; margin-bottom: 52px;
          animation: fadeUp 0.7s 0.1s ease both;
        }
        .tos-hero-eyebrow {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px; font-weight: 500;
          letter-spacing: 0.20em; text-transform: uppercase;
          color: var(--red); margin-bottom: 20px;
          display: flex; align-items: center; gap: 10px;
        }
        .tos-hero-eyebrow::after {
          content: ''; display: block; width: 40px; height: 1px;
          background: var(--red); opacity: 0.5;
        }
        .tos-hero h1 {
          font-family: 'Syne', sans-serif;
          font-size: clamp(42px, 6vw, 78px);
          font-weight: 800; line-height: 0.95;
          letter-spacing: -0.03em; color: #F8FAFC;
          margin-bottom: 24px;
        }
        .tos-hero h1 .accent {
          color: #A8D8FF;
          -webkit-text-stroke: 0;
        }
        .tos-hero-sub {
          font-family: 'DM Sans', sans-serif;
          font-size: 16px; font-weight: 300;
          color: rgba(160,200,224,0.60);
          max-width: 520px; line-height: 1.68;
          margin-bottom: 24px;
        }
        .tos-meta {
          display: inline-flex; align-items: center; gap: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px; font-weight: 500;
          letter-spacing: 0.10em; text-transform: uppercase;
          color: var(--text3);
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 20px; padding: 6px 16px;
          backdrop-filter: blur(18px);
        }
        .tos-meta-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--green);
          box-shadow: 0 0 10px var(--green), 0 0 22px rgba(46,204,143,0.35);
          animation: breathe 2.4s ease infinite;
        }

        .tos-toc {
          background: var(--surface); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
          border: 1px solid var(--border); border-radius: var(--radius);
          padding: 20px 24px; margin-bottom: 28px;
          animation: fadeUp 0.55s 0.15s ease both;
        }
        .tos-toc-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px; font-weight: 500;
          letter-spacing: 0.20em; text-transform: uppercase;
          color: var(--text3); margin-bottom: 12px;
        }
        .tos-toc-links { display: flex; flex-wrap: wrap; gap: 8px; }
        .tos-toc-link {
          display: inline-flex; align-items: center; gap: 6px;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px; font-weight: 400;
          color: var(--text2); text-decoration: none;
          background: rgba(13,27,46,0.60);
          border: 1px solid var(--border); border-radius: 6px;
          padding: 6px 12px;
          transition: color .2s, border-color .2s, background .2s;
        }
        .tos-toc-link:hover {
          color: var(--text);
          border-color: var(--border2);
          background: rgba(13,27,46,0.88);
        }

        .tos-sections { display: flex; flex-direction: column; gap: 16px; }

        .tos-section {
          background: var(--surface);
          border: 1px solid var(--border);
          border-top: 2px solid var(--tos-accent);
          border-radius: var(--radius);
          overflow: hidden; position: relative;
          transition: border-color .25s, box-shadow .25s;
          animation: fadeUp .55s ease both;
          backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
          scroll-margin-top: 80px;
        }
        .tos-section:nth-child(1) { animation-delay: .08s; }
        .tos-section:nth-child(2) { animation-delay: .14s; }
        .tos-section:nth-child(3) { animation-delay: .20s; }
        .tos-section:nth-child(4) { animation-delay: .26s; }

        .tos-section::before {
          content: ''; position: absolute; inset: 0;
          background: radial-gradient(ellipse 90% 70% at 0% 0%, var(--tos-alpha), transparent 70%);
          opacity: 0; transition: opacity .35s; pointer-events: none;
        }
        .tos-section:hover {
          border-color: var(--tos-accent);
          box-shadow: 0 0 20px var(--tos-alpha), 0 8px 28px rgba(0,0,0,0.4);
        }
        .tos-section:hover::before { opacity: 1; }

        .tos-section-head {
          display: flex; align-items: center;
          justify-content: space-between;
          padding: 22px 26px 18px;
          border-bottom: 1px solid var(--border);
          position: relative; z-index: 1;
          flex-wrap: wrap; gap: 10px;
          background: rgba(0,0,0,0.12);
        }
        .tos-section-left { display: flex; align-items: center; gap: 12px; }
        .tos-section-icon { font-size: 24px; line-height: 1; }
        .tos-section-name {
          font-family: 'Syne', sans-serif;
          font-size: 18px; font-weight: 800;
          letter-spacing: -0.02em; color: var(--text);
        }
        .tos-section-tag {
          font-family: 'DM Sans', sans-serif;
          font-size: 9px; font-weight: 700;
          letter-spacing: 0.15em; text-transform: uppercase;
          color: var(--tos-accent);
          background: var(--tos-alpha);
          border: 1px solid var(--tos-accent-border);
          border-radius: 3px; padding: 3px 7px; opacity: .75;
        }

        .tos-section-body {
          padding: 22px 26px;
          display: flex; flex-direction: column; gap: 20px;
          position: relative; z-index: 1;
        }

        .tos-clause-heading {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px; font-weight: 500;
          color: var(--text); margin-bottom: 6px;
          display: flex; align-items: center; gap: 8px;
        }
        .tos-clause-heading::before {
          content: ''; display: block;
          width: 4px; height: 4px; border-radius: 50%;
          background: var(--tos-accent); flex-shrink: 0;
        }
        .tos-clause-body {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px; font-weight: 300;
          color: var(--text2); line-height: 1.72;
          padding-left: 12px;
        }

        .tos-penalties {
          margin-top: 8px;
          border: 1px solid rgba(245,200,66,0.22);
          border-radius: 10px; overflow: hidden;
          position: relative; z-index: 1;
        }
        .tos-penalties-head {
          display: flex; align-items: center; gap: 10px;
          padding: 14px 18px;
          background: rgba(245,200,66,0.08);
          border-bottom: 1px solid rgba(245,200,66,0.18);
        }
        .tos-penalties-head-icon { font-size: 16px; }
        .tos-penalties-head-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.18em; text-transform: uppercase;
          color: #F5C842;
        }
        .tos-penalties-head-sub {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px; font-weight: 300;
          color: var(--text3); margin-left: auto;
        }

        .tos-penalty-row {
          display: grid;
          grid-template-columns: 1fr auto auto;
          align-items: center;
          gap: 12px;
          padding: 13px 18px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          transition: background .18s;
        }
        .tos-penalty-row:last-child { border-bottom: none; }
        .tos-penalty-row:hover { background: rgba(245,200,66,0.04); }

        .tos-penalty-offense {
          display: flex; align-items: center; gap: 10px;
        }
        .tos-penalty-dot {
          width: 7px; height: 7px; border-radius: 50%;
          flex-shrink: 0;
        }
        .tos-penalty-name {
          font-family: 'DM Sans', sans-serif;
          font-size: 13.5px; font-weight: 500;
          color: var(--text);
        }

        .tos-penalty-cell {
          display: flex; flex-direction: column; align-items: flex-end; gap: 2px;
          min-width: 120px;
        }
        .tos-penalty-cell-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 9px; font-weight: 600;
          letter-spacing: 0.14em; text-transform: uppercase;
          color: var(--text3);
        }
        .tos-penalty-cell-value {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px; font-weight: 600;
          color: var(--text2);
          text-align: right;
        }
        .tos-penalty-badge {
          display: inline-flex;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px; font-weight: 700;
          padding: 3px 10px; border-radius: 20px;
          border: 1px solid;
          white-space: nowrap;
        }

        .tos-penalties-note {
          padding: 11px 18px;
          background: rgba(245,200,66,0.05);
          border-top: 1px solid rgba(245,200,66,0.12);
          font-family: 'DM Sans', sans-serif;
          font-size: 11.5px; font-weight: 300;
          color: var(--text3); line-height: 1.55;
        }
        .tos-penalties-note strong { color: #F5C842; font-weight: 500; }

        .tos-accept {
          margin-top: 48px;
          background: var(--surface);
          border: 1px solid rgba(46,204,143,0.25);
          border-radius: var(--radius);
          padding: 28px 36px;
          display: flex; align-items: center;
          justify-content: space-between; gap: 24px;
          animation: fadeUp .55s .32s ease both;
          backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
          position: relative; overflow: hidden;
        }
        .tos-accept::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, var(--green), transparent);
        }
        .tos-accept-text h3 {
          font-family: 'Syne', sans-serif;
          font-size: 16px; font-weight: 800;
          color: var(--green); margin-bottom: 6px;
        }
        .tos-accept-text p {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px; font-weight: 300;
          color: var(--text2); line-height: 1.5; max-width: 420px;
        }
        .tos-accept-badge {
          flex-shrink: 0;
          display: inline-flex; align-items: center; gap: 8px;
          font-family: 'Syne', sans-serif;
          font-size: 12px; font-weight: 700;
          letter-spacing: 0.05em;
          color: var(--green);
          background: rgba(46,204,143,0.10);
          border: 1px solid rgba(46,204,143,0.30);
          border-radius: 8px; padding: 10px 18px;
          white-space: nowrap;
        }

        .tos-cta {
          margin-top: 16px;
          background: var(--surface);
          border: 1px solid rgba(232,55,42,0.20);
          border-radius: var(--radius);
          padding: 32px 36px;
          display: flex; align-items: center;
          justify-content: space-between; gap: 24px;
          animation: fadeUp .55s .38s ease both;
          backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
          position: relative; overflow: hidden;
        }
        .tos-cta::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, var(--red), rgba(232,55,42,0.3), transparent);
        }
        .tos-cta-text h3 {
          font-family: 'Syne', sans-serif;
          font-size: 18px; font-weight: 800;
          letter-spacing: -0.02em; color: var(--text);
          margin-bottom: 6px;
        }
        .tos-cta-text p {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px; font-weight: 300;
          color: var(--text3); line-height: 1.5; max-width: 380px;
        }
        .tos-cta-btn {
          flex-shrink: 0;
          display: inline-flex; align-items: center; gap: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px; font-weight: 500;
          letter-spacing: 0.08em; text-transform: uppercase;
          color: #fff;
          background: linear-gradient(135deg, var(--green), #1fa872);
          border: none; border-radius: 8px;
          padding: 13px 24px; cursor: pointer; text-decoration: none;
          transition: transform .2s, box-shadow .2s;
          box-shadow: 0 0 28px rgba(46,204,143,0.28);
          white-space: nowrap;
        }
        .tos-cta-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 48px rgba(46,204,143,0.50);
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 760px) {
          .tos-wrap { padding: 0 18px 100px; }
          .tos-hero { margin-top: 48px; margin-bottom: 36px; }
          .tos-hero h1 { font-size: 38px; }
          .tos-hero-sub { font-size: 15px; }
          .tos-accept { flex-direction: column; align-items: flex-start; padding: 22px 20px; }
          .tos-cta { flex-direction: column; align-items: flex-start; padding: 24px 22px; }
          .tos-section-head { padding: 18px 18px 14px; }
          .tos-section-body { padding: 18px 18px; }
          .tos-toc { padding: 16px 18px; }
          .tos-penalty-row { grid-template-columns: 1fr; gap: 6px; }
          .tos-penalty-cell { align-items: flex-start; }
          .tos-penalty-cell-value { text-align: left; }
          .tos-penalties-head-sub { display: none; }
        }

        @media (max-width: 480px) {
          .tos-hero h1 { font-size: 32px; }
          .tos-section-name { font-size: 15px; }
          .tos-meta { font-size: 10px; padding: 5px 10px; }
          .tos-accept-badge { font-size: 11px; padding: 8px 14px; }
        }
      `}</style>

      <div className="tos">
        <div className="tos-bg">
          <img src={emergencyBg} alt="" className="tos-bg-img" aria-hidden="true" />
          <div className="tos-bg-overlay" />
          <div className="tos-bg-atmosphere" />
          <div className="tos-bg-grain" />
        </div>

        <div className="tos-wrap">

          <nav className="tos-nav">
            <Link to="/" className="tos-logo">
              <span className="tos-logo-dot" />
              DumaSafeGuide
            </Link>
            <Link to="/resources" className="tos-back">← Resources</Link>
          </nav>

          <section className="tos-hero">
            <div className="tos-hero-eyebrow">Legal</div>
            <h1>Terms of <span className="accent">Service</span></h1>
            <p className="tos-hero-sub">
              The rules, responsibilities, and legal framework governing use of DumaSafeGuide,
              including applicable Philippine law.
            </p>
            <div className="tos-meta">
              <div className="tos-meta-dot" />
              Effective Date: January 1, 2025 · Last Updated: June 2025
            </div>
          </section>

          {/* TOC */}
          <div className="tos-toc">
            <div className="tos-toc-label">Jump to Section</div>
            <div className="tos-toc-links">
              {sections.map((s) => (
                <a key={s.id} href={`#${s.id}`} className="tos-toc-link">
                  <span>{s.icon}</span>
                  <span>{s.title}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Sections */}
          <div className="tos-sections">
            {sections.map((section) => (
              <div
                key={section.id}
                id={section.id}
                className="tos-section"
                style={{
                  "--tos-accent":        section.accent,
                  "--tos-alpha":         `${section.accent}18`,
                  "--tos-accent-border": `${section.accent}40`,
                } as React.CSSProperties}
              >
                <div className="tos-section-head">
                  <div className="tos-section-left">
                    <span className="tos-section-icon">{section.icon}</span>
                    <span className="tos-section-name">{section.title}</span>
                  </div>
                  <span className="tos-section-tag">{section.tag}</span>
                </div>

                <div className="tos-section-body">
                  {section.content.map((clause) => (
                    <div key={clause.heading} className="tos-clause">
                      <div className="tos-clause-heading">{clause.heading}</div>
                      <p className="tos-clause-body">{clause.body}</p>
                    </div>
                  ))}

                  {/* Penalties table — only for RA 10175 section */}
                  {"penalties" in section && section.penalties && (
                    <div className="tos-penalties">
                      <div className="tos-penalties-head">
                        <span className="tos-penalties-head-icon">⚖️</span>
                        <span className="tos-penalties-head-label">Penalties Under RA 10175</span>
                        <span className="tos-penalties-head-sub">Philippine Law · As of 2024</span>
                      </div>

                      {section.penalties.map((p) => {
                        const colors = SEVERITY_COLORS[p.severity];
                        return (
                          <div key={p.offense} className="tos-penalty-row">
                            <div className="tos-penalty-offense">
                              <div className="tos-penalty-dot" style={{ background: colors.dot }} />
                              <span className="tos-penalty-name">{p.offense}</span>
                            </div>
                            <div className="tos-penalty-cell">
                              <span className="tos-penalty-cell-label">Imprisonment</span>
                              <span className="tos-penalty-cell-value">{p.prison}</span>
                            </div>
                            <div className="tos-penalty-cell">
                              <span className="tos-penalty-cell-label">Fine</span>
                              <span
                                className="tos-penalty-badge"
                                style={{
                                  background:  colors.bg,
                                  borderColor: colors.border,
                                  color:       colors.text,
                                }}
                              >
                                {p.fine}
                              </span>
                            </div>
                          </div>
                        );
                      })}

                      <div className="tos-penalties-note">
                        <strong>Note:</strong> Penalties may be one degree higher when the crime is
                        committed against critical infrastructure or by public officials. Fines and
                        imprisonment ranges are subject to judicial discretion. Source: Republic Act
                        No. 10175, Cybercrime Prevention Act of 2012.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Acceptance */}
          <div className="tos-accept">
            <div className="tos-accept-text">
              <h3>✓ Implied Acceptance</h3>
              <p>
                By accessing and using DumaSafeGuide, you agree to these Terms of Service
                and the Privacy Policy in full. Continued use constitutes ongoing acceptance.
              </p>
            </div>
            <div className="tos-accept-badge">
              <span>🛡️</span> RA 10175 Compliant
            </div>
          </div>

          {/* CTA */}
          <div className="tos-cta">
            <div className="tos-cta-text">
              <h3>Need to report an emergency?</h3>
              <p>Don't wait — use the incident reporting form to alert local responders immediately.</p>
            </div>
            <Link to="/report" className="tos-cta-btn">
              <span>🚨</span> Report Now
            </Link>
          </div>

        </div>

      </div>
    </>
  );
}