import { Link } from "react-router-dom";
import directoryBg from "../assets/emergency.jpg";

const resources = [
  {
    id: "safety",
    icon: "🛡️",
    accent: "#2ECC8F",
    tag: "Community",
    title: "Safety Tips",
    description:
      "Practical, barangay-level guidelines to keep yourself and your community protected before, during, and after an emergency.",
    links: [
      { label: "Before a Typhoon",      to: "/safetytips#typhoon" },
      { label: "Flood Safety Protocol", to: "/safetytips#flood"   },
      { label: "Fire Prevention Guide", to: "/safetytips#fire"    },
    ],
  },
  {
    id: "agencies",
    icon: "🤝",
    accent: "#4A90D9",
    tag: "Organizations",
    title: "Partner Agencies",
    description:
      "Government bodies and civil society organizations collaborating with DumaSafeGuide to deliver coordinated emergency response.",
    links: [
      { label: "CDRRMO",                    to: "/partner-agencies#cdrrmo"   },
      { label: "Philippine Red Cross",      to: "/partner-agencies#redcross" },
      { label: "Bureau of Fire Protection", to: "/partner-agencies#bfp"      },
    ],
  },
  {
    id: "directory",
    icon: "📋",
    accent: "#F5C842",
    tag: "Contacts",
    title: "Emergency Directory",
    description:
      "Quick access to all essential emergency hotlines — hospitals, barangay responders, and city-wide disaster management units.",
    links: [
      { label: "City Emergency Services", to: "/directory#city"      },
      { label: "Barangay Hotlines",       to: "/directory#barangays" },
      { label: "Hospitals & Medical",     to: "/directory#hospitals" },
    ],
  },
  {
    id: "terms",
    icon: "📜",
    accent: "#e8372a",
    tag: "Legal",
    title: "Terms of Service",
    description:
      "Understand the rules, user responsibilities, and legal framework governing the use of DumaSafeGuide, including RA 10175.",
    links: [
      { label: "User Responsibilities", to: "/terms#responsibilities" },
      { label: "Privacy Policy",        to: "/terms#privacy"          },
      { label: "RA 10175 Overview",     to: "/terms#ra10175"          },
    ],
  },
];

export default function Resources() {
  return (
    <>
      <style>{`
        /* ── Fonts: Syne 800 (headings) + DM Sans 300/400/500 (body) — matches About page ── */
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');

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
          --radius:   13px;
        }

        .rs {
          min-height: 100vh;
          font-family: 'DM Sans', sans-serif;
          color: var(--text);
          background: var(--bg);
          position: relative;
          overflow-x: hidden;
        }

        /* ── Background — exact match to About page ── */
        .rs-bg {
          position: fixed; inset: 0; z-index: 0;
          overflow: hidden;
        }
        .rs-bg-img {
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

        .rs-bg-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(
            180deg,
            rgba(7,16,29,0.82) 0%,
            rgba(7,16,29,0.68) 40%,
            rgba(7,16,29,0.82) 75%,
            rgba(7,16,29,0.97) 100%
          );
        }
        .rs-bg-atmosphere {
          position: absolute; inset: 0; pointer-events: none;
          background:
            radial-gradient(ellipse 60% 50% at 10% 0%,  rgba(232,55,42,0.09)  0%, transparent 65%),
            radial-gradient(ellipse 55% 60% at 90% 100%, rgba(0,200,224,0.07)  0%, transparent 70%),
            radial-gradient(ellipse 40% 40% at 55% 45%,  rgba(13,27,46,0.40)   0%, transparent 60%);
        }
        .rs-bg-grain {
          position: absolute; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
          background-size: 200px; opacity: 0.45; pointer-events: none;
        }

        /* ── Layout ── */
        .rs-wrap {
          position: relative; z-index: 1;
          max-width: 1100px; margin: 0 auto;
          padding: 0 28px 120px;
        }

        /* ── Nav ── */
        .rs-nav {
          display: flex; align-items: center; justify-content: space-between;
          padding: 28px 0 0;
          animation: fadeUp .5s ease both;
        }
        .rs-logo {
          display: flex; align-items: center; gap: 10px; text-decoration: none;
          font-family: 'Syne', sans-serif;
          font-size: 15px; font-weight: 800;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: var(--text);
        }
        .rs-logo-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: var(--red);
          box-shadow: 0 0 12px var(--red), 0 0 24px rgba(232,55,42,0.4);
          animation: breathe 2.4s ease infinite;
        }
        @keyframes breathe {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:.55; transform:scale(.78); }
        }
        .rs-back {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase;
          color: var(--text3); text-decoration: none;
          border: 1px solid rgba(0,200,224,0.12); border-radius: 8px;
          padding: 8px 16px; transition: all .2s;
          background: rgba(13,27,46,0.60); backdrop-filter: blur(18px);
          display: flex; align-items: center; gap: 6px;
        }
        .rs-back:hover { color: var(--text); border-color: rgba(0,200,224,0.30); }

        /* ── Hero ── */
        .rs-hero {
          margin-top: 72px;
          margin-bottom: 52px;
          animation: fadeUp 0.7s 0.1s ease both;
        }
        .rs-hero-eyebrow {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px; font-weight: 500;
          letter-spacing: 0.20em; text-transform: uppercase;
          color: var(--red); margin-bottom: 20px;
          display: flex; align-items: center; gap: 10px;
        }
        .rs-hero-eyebrow::after {
          content: ''; display: block;
          width: 40px; height: 1px;
          background: var(--red); opacity: 0.5;
        }
        .rs-hero h1 {
          font-family: 'Syne', sans-serif;
          font-size: clamp(42px, 6vw, 78px);
          font-weight: 800; line-height: 0.95;
          letter-spacing: -0.03em; color: #F8FAFC;
          margin-bottom: 24px;
        }
        .rs-hero h1 .accent {
          color: #A8D8FF;
          -webkit-text-stroke: 0;
        }
        .rs-hero-sub {
          font-family: 'DM Sans', sans-serif;
          font-size: 16px; font-weight: 300;
          color: rgba(160,200,224,0.60);
          max-width: 460px; line-height: 1.68;
        }

        /* ── Cards grid ── */
        .rs-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .rs-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-top: 2px solid var(--rs-accent);
          border-radius: var(--radius);
          padding: 28px 26px;
          display: flex; flex-direction: column;
          position: relative; overflow: hidden;
          transition: transform .25s, border-color .25s, box-shadow .25s;
          animation: fadeUp .55s ease both;
          backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
        }
        .rs-card:nth-child(1) { animation-delay: .08s; }
        .rs-card:nth-child(2) { animation-delay: .14s; }
        .rs-card:nth-child(3) { animation-delay: .20s; }
        .rs-card:nth-child(4) { animation-delay: .26s; }

        .rs-card::before {
          content: ''; position: absolute; inset: 0;
          background: radial-gradient(ellipse 90% 70% at 0% 0%, var(--rs-alpha), transparent 70%);
          opacity: 0; transition: opacity .35s; pointer-events: none;
        }
        .rs-card:hover {
          transform: translateY(-4px);
          border-color: var(--rs-accent);
          box-shadow: 0 0 20px var(--rs-alpha), 0 8px 28px rgba(0,0,0,0.4);
        }
        .rs-card:hover::before { opacity: 1; }

        .rs-card-top {
          display: flex; align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 18px; position: relative; z-index: 1;
        }
        .rs-icon { font-size: 30px; line-height: 1; }
        .rs-tag {
          font-family: 'DM Sans', sans-serif;
          font-size: 9px; font-weight: 700;
          letter-spacing: 0.15em; text-transform: uppercase;
          color: var(--rs-accent);
          background: var(--rs-alpha);
          border: 1px solid var(--rs-accent-border);
          border-radius: 3px; padding: 3px 7px; opacity: .75;
        }

        .rs-card-title {
          font-family: 'Syne', sans-serif;
          font-size: 20px; font-weight: 800;
          letter-spacing: -0.02em; color: var(--text);
          margin-bottom: 10px; position: relative; z-index: 1;
        }
        .rs-card-desc {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px; font-weight: 300;
          color: var(--text2); line-height: 1.7;
          margin-bottom: 24px; position: relative; z-index: 1; flex: 1;
        }

        .rs-divider {
          height: 1px; background: var(--border);
          margin-bottom: 18px; position: relative; z-index: 1;
        }

        .rs-links {
          display: flex; flex-direction: column;
          gap: 0; position: relative; z-index: 1;
        }
        .rs-link {
          display: flex; align-items: center;
          justify-content: space-between;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px; font-weight: 400;
          color: var(--text3); text-decoration: none;
          padding: 8px 0;
          border-bottom: 1px solid var(--border);
          transition: color .2s, padding-left .2s;
        }
        .rs-link:last-child { border-bottom: none; }
        .rs-link:hover { color: var(--rs-accent); padding-left: 4px; }
        .rs-link-arrow {
          font-size: 13px; opacity: 0;
          transform: translateX(-4px);
          transition: opacity .2s, transform .2s;
        }
        .rs-link:hover .rs-link-arrow { opacity: 1; transform: translateX(0); }

        /* ── CTA strip ── */
        .rs-cta {
          margin-top: 48px;
          background: var(--surface);
          border: 1px solid rgba(232,55,42,0.20); border-radius: var(--radius);
          padding: 32px 36px;
          display: flex; align-items: center;
          justify-content: space-between; gap: 24px;
          animation: fadeUp .55s .32s ease both;
          backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
          position: relative; overflow: hidden;
        }
        .rs-cta::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, var(--red), rgba(232,55,42,0.3), transparent);
        }
        .rs-cta-text h3 {
          font-family: 'Syne', sans-serif;
          font-size: 18px; font-weight: 800;
          letter-spacing: -0.02em; color: var(--text);
          margin-bottom: 6px;
        }
        .rs-cta-text p {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px; font-weight: 300;
          color: var(--text3); line-height: 1.5; max-width: 380px;
        }
        .rs-cta-btn {
          flex-shrink: 0;
          display: inline-flex; align-items: center; gap: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px; font-weight: 500;
          letter-spacing: 0.08em; text-transform: uppercase;
          color: #fff;
          background: linear-gradient(135deg, var(--red), #b82010);
          border: none; border-radius: 8px;
          padding: 13px 24px; cursor: pointer; text-decoration: none;
          transition: transform .2s, box-shadow .2s;
          box-shadow: 0 0 28px rgba(232,55,42,0.28);
          white-space: nowrap;
        }
        .rs-cta-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 48px rgba(232,55,42,0.50);
        }
        .rs-cta-btn span { font-size: 16px; }

        /* ── Animations ── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Responsive ── */
        @media (max-width: 700px) {
          .rs-grid { grid-template-columns: 1fr; }
          .rs-cta  { flex-direction: column; align-items: flex-start; padding: 24px 22px; }
        }
        @media (max-width: 760px) {
          .rs-wrap { padding: 0 18px 100px; }
          .rs-hero h1 { font-size: 38px; }
          .rs-hero { margin-top: 48px; margin-bottom: 36px; }
        }
        @media (max-width: 480px) {
          .rs-hero h1 { font-size: 32px; }
          .rs-card { padding: 22px 18px; }
        }
      `}</style>

      <div className="rs">
        <div className="rs-bg">
          <img src={directoryBg} alt="" className="rs-bg-img" aria-hidden="true" />
          <div className="rs-bg-overlay" />
          <div className="rs-bg-atmosphere" />
          <div className="rs-bg-grain" />
        </div>

        <div className="rs-wrap">

          <nav className="rs-nav">
            <Link to="/" className="rs-logo">
              <span className="rs-logo-dot" />
              DumaSafeGuide
            </Link>
          </nav>

          <section className="rs-hero">
            <div className="rs-hero-eyebrow">Knowledge Hub</div>
            <h1>
              Resources &amp; <span className="accent">Guides</span>
            </h1>
            <p className="rs-hero-sub">
              Everything you need to stay informed — safety guides, partner agencies,
              emergency contacts, and legal references in one place.
            </p>
          </section>

          <div className="rs-grid">
            {resources.map((res) => (
              <div
                key={res.id}
                className="rs-card"
                style={{
                  "--rs-accent":        res.accent,
                  "--rs-alpha":         `${res.accent}18`,
                  "--rs-accent-border": `${res.accent}40`,
                } as React.CSSProperties}
              >
                <div className="rs-card-top">
                  <span className="rs-icon">{res.icon}</span>
                  <span className="rs-tag">{res.tag}</span>
                </div>
                <div className="rs-card-title">{res.title}</div>
                <p className="rs-card-desc">{res.description}</p>
                <div className="rs-divider" />
                <div className="rs-links">
                  {res.links.map((link) => (
                    <Link key={link.label} to={link.to} className="rs-link">
                      <span>{link.label}</span>
                      <span className="rs-link-arrow">→</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="rs-cta">
            <div className="rs-cta-text">
              <h3>Need to report an emergency?</h3>
              <p>Don't wait — use the incident reporting form to alert local responders immediately.</p>
            </div>
            <Link to="/report" className="rs-cta-btn">
              <span>🚨</span> Report Now
            </Link>
          </div>

        </div>
      </div>
    </>
  );
}