
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
    accent: "#5B8DEF",
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
  },
  {
    id: "disclaimer",
    icon: "⚠️",
    accent: "#EF5B5B",
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

export default function TermsOfService() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .tos-root {
          min-height: 100vh;
          font-family: 'DM Sans', sans-serif;
          color: #e8eaf0;
          position: relative;
          overflow-x: hidden;
        }

        /* Background image */
        .tos-bg {
          position: fixed;
          inset: 0;
          z-index: 0;
          background-image: url(${emergencyBg});
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }

        .tos-bg::after {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(11, 15, 26, 0.90);
        }

        .tos-overlay {
          position: fixed;
          inset: 0;
          z-index: 1;
          background:
            radial-gradient(ellipse 55% 40% at 10% 10%, rgba(239,91,158,0.06) 0%, transparent 65%),
            radial-gradient(ellipse 45% 50% at 90% 85%, rgba(245,200,66,0.05) 0%, transparent 65%),
            radial-gradient(ellipse 35% 35% at 50% 50%, rgba(91,141,239,0.03) 0%, transparent 60%);
          pointer-events: none;
        }

        .tos-noise {
          position: fixed;
          inset: 0;
          z-index: 1;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          background-size: 200px;
          pointer-events: none;
          opacity: 0.5;
        }

        .tos-body {
          position: relative;
          z-index: 2;
          max-width: 1100px;
          margin: 0 auto;
          padding: 56px 24px 96px;
        }

        /* Breadcrumb */
        .tos-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: rgba(232,234,240,0.3);
          margin-bottom: 32px;
          animation: tosFadeUp 0.4s ease both;
        }

        .tos-breadcrumb a {
          color: rgba(232,234,240,0.3);
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .tos-breadcrumb a:hover { color: #EF5B9E; }
        .tos-breadcrumb-sep { opacity: 0.3; }
        .tos-breadcrumb-current { color: #EF5B9E; }

        /* Header */
        .tos-header {
          margin-bottom: 64px;
          animation: tosFadeUp 0.55s ease both;
        }

        .tos-eyebrow {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #EF5B9E;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .tos-eyebrow::after {
          content: '';
          display: block;
          width: 36px;
          height: 1px;
          background: #EF5B9E;
          opacity: 0.5;
        }

        .tos-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(36px, 6vw, 64px);
          font-weight: 800;
          letter-spacing: -0.03em;
          color: #f0f2f8;
          line-height: 1;
        }

        .tos-title span {
          color: transparent;
          -webkit-text-stroke: 1px rgba(240,242,248,0.25);
        }

        .tos-sub {
          font-size: 15px;
          font-weight: 300;
          color: rgba(232,234,240,0.4);
          margin-top: 14px;
          max-width: 480px;
          line-height: 1.65;
        }

        .tos-meta {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(232,234,240,0.3);
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 6px;
          padding: 6px 14px;
          margin-top: 20px;
        }

        .tos-meta-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #2ECC8F;
        }

        /* TOC */
        .tos-toc {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 14px;
          padding: 24px 28px;
          margin-bottom: 32px;
          animation: tosFadeUp 0.55s ease 0.1s both;
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
        }

        .tos-toc-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(232,234,240,0.3);
          margin-bottom: 14px;
        }

        .tos-toc-links {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .tos-toc-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12.5px;
          color: rgba(232,234,240,0.45);
          text-decoration: none;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 6px;
          padding: 6px 12px;
          transition: color 0.2s ease, border-color 0.2s ease, background 0.2s ease;
        }

        .tos-toc-link:hover {
          color: #f0f2f8;
          border-color: rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.07);
        }

        /* Sections */
        .tos-sections {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .tos-section {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 14px;
          overflow: hidden;
          position: relative;
          transition: border-color 0.25s ease;
          animation: tosFadeUp 0.55s ease both;
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          /* Offset for sticky nav when anchor-jumping */
          scroll-margin-top: 80px;
        }

        .tos-section:nth-child(1) { animation-delay: 0.12s; }
        .tos-section:nth-child(2) { animation-delay: 0.18s; }
        .tos-section:nth-child(3) { animation-delay: 0.24s; }
        .tos-section:nth-child(4) { animation-delay: 0.30s; }

        .tos-section::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--tos-accent), transparent);
        }

        .tos-section:hover {
          border-color: var(--tos-accent-border);
        }

        /* Section header */
        .tos-section-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 28px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }

        .tos-section-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .tos-section-icon { font-size: 26px; line-height: 1; }

        .tos-section-name {
          font-family: 'Syne', sans-serif;
          font-size: 18px;
          font-weight: 800;
          color: #f0f2f8;
          letter-spacing: -0.01em;
        }

        .tos-section-tag {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--tos-accent);
          background: var(--tos-alpha);
          border: 1px solid var(--tos-accent-border);
          border-radius: 4px;
          padding: 3px 9px;
        }

        /* Section body */
        .tos-section-body {
          padding: 24px 28px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .tos-clause-heading {
          font-size: 13px;
          font-weight: 500;
          color: rgba(232,234,240,0.7);
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .tos-clause-heading::before {
          content: '';
          display: block;
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: var(--tos-accent);
          flex-shrink: 0;
        }

        .tos-clause-body {
          font-size: 14px;
          font-weight: 300;
          color: rgba(232,234,240,0.4);
          line-height: 1.7;
          padding-left: 11px;
        }

        /* Acceptance bar */
        .tos-accept {
          margin-top: 48px;
          background: rgba(46,204,143,0.05);
          border: 1px solid rgba(46,204,143,0.2);
          border-radius: 14px;
          padding: 28px 36px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          animation: tosFadeUp 0.55s ease 0.36s both;
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
        }

        @media (max-width: 600px) {
          .tos-accept { flex-direction: column; align-items: flex-start; }
        }

        .tos-accept-text h3 {
          font-family: 'Syne', sans-serif;
          font-size: 16px;
          font-weight: 700;
          color: #2ECC8F;
          margin-bottom: 4px;
        }

        .tos-accept-text p {
          font-size: 13px;
          font-weight: 300;
          color: rgba(232,234,240,0.38);
          line-height: 1.5;
          max-width: 420px;
        }

        .tos-accept-badge {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: 'Syne', sans-serif;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.05em;
          color: #2ECC8F;
          background: rgba(46,204,143,0.1);
          border: 1px solid rgba(46,204,143,0.3);
          border-radius: 8px;
          padding: 10px 18px;
          white-space: nowrap;
        }

        /* CTA strip */
        .tos-cta {
          margin-top: 16px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 14px;
          padding: 32px 36px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          animation: tosFadeUp 0.55s ease 0.40s both;
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
        }

        @media (max-width: 600px) {
          .tos-cta { flex-direction: column; align-items: flex-start; }
        }

        .tos-cta-text h3 {
          font-family: 'Syne', sans-serif;
          font-size: 18px;
          font-weight: 700;
          color: #f0f2f8;
          margin-bottom: 6px;
        }

        .tos-cta-text p {
          font-size: 14px;
          font-weight: 300;
          color: rgba(232,234,240,0.38);
          line-height: 1.5;
          max-width: 380px;
        }

        .tos-cta-btn {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.05em;
          color: #0b0f1a;
          background: #2ECC8F;
          border: none;
          border-radius: 8px;
          padding: 13px 22px;
          cursor: pointer;
          text-decoration: none;
          transition: background 0.2s ease, transform 0.2s ease;
          white-space: nowrap;
        }

        .tos-cta-btn:hover { background: #38e09e; transform: translateY(-2px); }
        .tos-cta-btn span { font-size: 16px; }

        @keyframes tosFadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="tos-root">
        {/* Layered background */}
        <div className="tos-bg" />
        <div className="tos-overlay" />
        <div className="tos-noise" />


        <div className="tos-body">

          {/* Breadcrumb */}
          <div className="tos-breadcrumb">
            <a href="/resources">Resources</a>
            <span className="tos-breadcrumb-sep">›</span>
            <span className="tos-breadcrumb-current">Terms of Service</span>
          </div>

          {/* Header */}
          <div className="tos-header">
            <div className="tos-eyebrow">Legal</div>
            <h1 className="tos-title">Terms of<br /><span>Service</span></h1>
            <p className="tos-sub">
              The rules, responsibilities, and legal framework governing use of DumaSafeGuide,
              including applicable Philippine law.
            </p>
            <div className="tos-meta">
              <div className="tos-meta-dot" />
              Effective Date: January 1, 2025 · Last Updated: June 2025
            </div>
          </div>

          {/* Table of Contents */}
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
                  "--tos-accent": section.accent,
                  "--tos-alpha": `${section.accent}18`,
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
                </div>
              </div>
            ))}
          </div>

          {/* Acceptance notice */}
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

          {/* CTA strip */}
          <div className="tos-cta">
            <div className="tos-cta-text">
              <h3>Need to report an emergency?</h3>
              <p>
                Don't wait — use the incident reporting form to alert local responders immediately.
              </p>
            </div>
            <a href="/report" className="tos-cta-btn">
              <span>🚨</span> Report Now
            </a>
          </div>

        </div>
      </div>
    </>
  );
}