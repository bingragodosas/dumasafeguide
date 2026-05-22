import { Link } from "react-router-dom";
import bgImg from "../assets/emergency.jpg";

const agencies = [
  {
    id: "cdrrmo",
    icon: "🏛️",
    color: "#2ECC8F",
    colorDim: "rgba(46,204,143,0.12)",
    colorBorder: "rgba(46,204,143,0.28)",
    colorRgb: "46,204,143",
    tag: "Government",
    name: "CDRRMO",
    fullName: "City Disaster Risk Reduction & Management Office",
    description:
      "The primary government body responsible for disaster risk reduction, preparedness, response, and recovery in Dumaguete City. Operates the Emergency Operations Center (EOC) 24/7.",
    role: "Lead disaster coordination and city-wide emergency operations",
    hotline: "(035) 225-2973",
    email: "cdrrmo@dumaguete.gov.ph",
    address: "City Hall Compound, Colon St., Dumaguete City, 6200",
    stats: [
      { label: "Barangays Covered", value: "30" },
      { label: "EOC Availability", value: "24/7" },
      { label: "Response Time", value: "< 10 min" },
    ],
    links: [
      { label: "Submit Incident Report",  href: "/report"    },
      { label: "View Hazard Maps",        href: "/map"       },
      { label: "Emergency Directory",     href: "/directory" },
    ],
  },
  {
    id: "redcross",
    icon: "🏥",
    color: "#EF5B5B",
    colorDim: "rgba(239,91,91,0.12)",
    colorBorder: "rgba(239,91,91,0.28)",
    colorRgb: "239,91,91",
    tag: "Humanitarian",
    name: "Philippine Red Cross",
    fullName: "Philippine Red Cross — Negros Oriental Chapter",
    description:
      "Provides emergency medical assistance, blood services, disaster relief, and community-based health programs. Operates the only 24-hour blood bank in Negros Oriental.",
    role: "Emergency medical response, relief distribution, and humanitarian aid",
    hotline: "(035) 225-0519",
    email: "negros.oriental@redcross.org.ph",
    address: "Red Cross Bldg., Perdices St., Dumaguete City, 6200",
    stats: [
      { label: "Trained Volunteers",  value: "500+"  },
      { label: "Blood Units / Year",  value: "3,000" },
      { label: "Relief Ops / Year",   value: "12+"   },
    ],
    links: [
      { label: "Donate Blood",         href: "https://www.redcross.org.ph" },
      { label: "Volunteer Sign-Up",    href: "https://www.redcross.org.ph" },
      { label: "Disaster Relief Info", href: "https://www.redcross.org.ph" },
    ],
  },
  {
    id: "bfp",
    icon: "🔥",
    color: "#F5A742",
    colorDim: "rgba(245,167,66,0.12)",
    colorBorder: "rgba(245,167,66,0.28)",
    colorRgb: "245,167,66",
    tag: "Fire & Rescue",
    name: "Bureau of Fire Protection",
    fullName: "Bureau of Fire Protection — Dumaguete City",
    description:
      "Handles fire suppression, fire prevention programs, and rescue operations across all 30 barangays of Dumaguete City. Also conducts fire safety inspections for commercial and residential buildings.",
    role: "Fire suppression, arson investigation, and community fire safety education",
    hotline: "160 / (035) 225-2222",
    email: "bfp.dumaguete@bfp.gov.ph",
    address: "BFP Station, Real St., Dumaguete City, 6200",
    stats: [
      { label: "Fire Trucks",        value: "6"    },
      { label: "Trained Firefighters", value: "80+" },
      { label: "Avg Response Time",  value: "5 min" },
    ],
    links: [
      { label: "Fire Safety Tips",       href: "/safetytips#fire" },
    ],
  },
  {
    id: "pnp",
    icon: "🚔",
    color: "#5B8DEF",
    colorDim: "rgba(91,141,239,0.12)",
    colorBorder: "rgba(91,141,239,0.28)",
    colorRgb: "91,141,239",
    tag: "Law Enforcement",
    name: "PNP Dumaguete",
    fullName: "Philippine National Police — Dumaguete City Station",
    description:
      "Ensures peace and order, assists in crowd control during emergencies, and coordinates with CDRRMO and other agencies for preemptive evacuations and disaster response operations.",
    role: "Security, crowd control, and law enforcement during disaster operations",
    hotline: "117 / (035) 225-3153",
    email: "pro7.dumaguete@pnp.gov.ph",
    address: "PNP Station, Sta. Catalina St., Dumaguete City, 6200",
    stats: [
      { label: "Officers on Duty",    value: "24/7"  },
      { label: "Patrol Units",        value: "15+"   },
      { label: "Emergency Hotline",   value: "117"   },
    ],
    links: [
      

    ],
  },
  {
    id: "phivolcs",
    icon: "🌋",
    color: "#C084FC",
    colorDim: "rgba(192,132,252,0.12)",
    colorBorder: "rgba(192,132,252,0.28)",
    colorRgb: "192,132,252",
    tag: "Science & Research",
    name: "PHIVOLCS",
    fullName: "Philippine Institute of Volcanology & Seismology",
    description:
      "Monitors volcanic activity, earthquakes, and tsunamis nationwide. Issues early warnings and scientific advisories to protect communities from geologic hazards, including the active Cuernos de Negros volcano.",
    role: "Geologic hazard monitoring, early warning systems, and scientific advisories",
    hotline: "(02) 8426-1468 to 79",
    email: "phivolcs.od@phivolcs.dost.gov.ph",
    address: "PHIVOLCS Bldg., C.P. Garcia Ave., UP Campus, Diliman, Quezon City",
    stats: [
      { label: "Seismic Stations",    value: "100+" },
      { label: "Volcanoes Monitored", value: "24"   },
      { label: "Intensity Scale",     value: "I–X"  },
    ],
    links: [
      { label: "Earthquake Alerts", href: "https://earthquake.phivolcs.dost.gov.ph" },
      { label: "Tsunami Warnings",  href: "https://www.phivolcs.dost.gov.ph"        },
      { label: "Hazard Maps",       href: "https://www.phivolcs.dost.gov.ph"        },
    ],
  },
  {
    id: "pagasa",
    icon: "🌀",
    color: "#38BDF8",
    colorDim: "rgba(56,189,248,0.12)",
    colorBorder: "rgba(56,189,248,0.28)",
    colorRgb: "56,189,248",
    tag: "Weather & Climate",
    name: "PAGASA",
    fullName: "Philippine Atmospheric, Geophysical & Astronomical Services Administration",
    description:
      "Issues weather forecasts, typhoon advisories, and rainfall warnings. Partners with CDRRMO to trigger preemptive evacuations. The Visayas regional office covers Negros Oriental.",
    role: "Weather forecasting, typhoon tracking, and rainfall threshold monitoring",
    hotline: "(032) 254-5571 (Visayas)",
    email: "pagasa.visayas@pagasa.dost.gov.ph",
    address: "PAGASA Visayas Regional Office, Mactan, Cebu City",
    stats: [
      { label: "Signal Levels",       value: "1–5"      },
      { label: "Forecast Updates",    value: "Every 6h" },
      { label: "Stations Nationwide", value: "54"       },
    ],
    links: [
      { label: "Weather Forecast",    href: "https://www.pagasa.dost.gov.ph"                              },
      
    ],
  },
  {
    id: "dswd",
    icon: "🤲",
    color: "#FCD34D",
    colorDim: "rgba(252,211,77,0.12)",
    colorBorder: "rgba(252,211,77,0.28)",
    colorRgb: "252,211,77",
    tag: "Social Welfare",
    name: "DSWD",
    fullName: "Department of Social Welfare and Development — Field Office VII",
    description:
      "Provides social protection, emergency cash assistance, and relief goods to vulnerable individuals and families affected by disasters. Operates the Quick Response Fund for immediate disaster relief.",
    role: "Relief goods distribution, emergency cash aid, and social protection services",
    hotline: "(032) 256-1100 / 8888",
    email: "fo7@dswd.gov.ph",
    address: "DSWD Field Office VII, MJ Cuenco Ave., Mabolo, Cebu City",
    stats: [
      { label: "QRF Budget",         value: "₱30M+"  },
      { label: "Beneficiaries/Year", value: "50,000+" },
      { label: "Hotline",            value: "8888"    },
    ],
    links: [
      { label: "Request Assistance",  href: "https://www.dswd.gov.ph"        },
      
    ],
  },
  {
    id: "mgb",
    icon: "⛰️",
    color: "#86EFAC",
    colorDim: "rgba(134,239,172,0.12)",
    colorBorder: "rgba(134,239,172,0.28)",
    colorRgb: "134,239,172",
    tag: "Geology",
    name: "MGB Region VII",
    fullName: "Mines and Geosciences Bureau — Region VII",
    description:
      "Produces landslide and flood susceptibility maps, issues geo-hazard advisories, and assists LGUs in identifying areas at risk. Critical partner for Dumaguete's hilly barangays prone to slope failures.",
    role: "Geo-hazard mapping, landslide advisories, and slope stability assessments",
    hotline: "(032) 268-0629",
    email: "mgb7@mgb.gov.ph",
    address: "MGB Regional Office VII, Mandaue City, Cebu",
    stats: [
      { label: "Hazard Maps Produced", value: "1,600+" },
      { label: "LGUs Covered",         value: "136"    },
      { label: "Geo-hazard Types",      value: "3"      },
    ],
    links: [
      { label: "Landslide Safety Tips", href: "/safetytips#landslide"  },

    ],
  },
];

export default function PartnerAgencies() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:       #07101d;
          --surface:  rgba(13,27,46,0.72);
          --surface2: rgba(13,27,46,0.88);
          --border:   rgba(0,200,224,0.09);
          --border2:  rgba(0,200,224,0.18);
          --text:     #ddeef8;
          --text2:    rgba(160,200,224,0.65);
          --text3:    rgba(160,200,224,0.30);
          --red:      #e8372a;
          --cyan:     #00c8e0;
          --radius:   12px;
        }

        .pa {
          min-height: 100vh;
          font-family: 'DM Sans', sans-serif;
          color: var(--text);
          background: var(--bg);
          position: relative;
          overflow-x: hidden;
        }

        /* ── Background ── */
        .pa-bg {
          position: fixed; inset: 0; z-index: 0;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }
        .pa-bg-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(
            180deg,
            rgba(7,16,29,0.88) 0%,
            rgba(7,16,29,0.82) 30%,
            rgba(7,16,29,0.82) 70%,
            rgba(7,16,29,0.96) 100%
          );
          pointer-events: none;
        }
        .pa-bg-atmosphere {
          position: absolute; inset: 0; pointer-events: none;
          background:
            radial-gradient(ellipse 60% 50% at 10% 0%,  rgba(232,55,42,0.09) 0%, transparent 65%),
            radial-gradient(ellipse 55% 60% at 90% 100%, rgba(0,200,224,0.07) 0%, transparent 70%),
            radial-gradient(ellipse 40% 40% at 55% 45%,  rgba(13,27,46,0.40)  0%, transparent 60%);
        }
        .pa-bg-grain {
          position: absolute; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
          background-size: 200px; opacity: 0.45; pointer-events: none;
        }

        /* ── Layout ── */
        .pa-wrap {
          position: relative; z-index: 1;
          max-width: 1100px; margin: 0 auto;
          padding: 0 24px 120px;
        }

        /* ── Nav ── */
        .pa-nav {
          display: flex; align-items: center; justify-content: space-between;
          padding: 28px 0 0;
          animation: fadeUp .5s ease both;
        }
        .pa-logo {
          display: flex; align-items: center; gap: 10px; text-decoration: none;
          font-family: 'Syne', sans-serif;
          font-size: 15px; font-weight: 800;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: var(--text);
        }
        .pa-logo-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: var(--red);
          box-shadow: 0 0 12px var(--red), 0 0 24px rgba(232,55,42,0.4);
          animation: breathe 2.4s ease infinite;
        }
        @keyframes breathe {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:.55; transform:scale(.78); }
        }
        .pa-back {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase;
          color: var(--text3); text-decoration: none;
          border: 1px solid rgba(0,200,224,0.20); border-radius: 8px;
          padding: 8px 16px; transition: all .2s;
          background: rgba(13,27,46,0.60); backdrop-filter: blur(18px);
          display: flex; align-items: center; gap: 6px;
        }
        .pa-back:hover { color: var(--text); border-color: rgba(0,200,224,0.40); }

        /* ── Hero ── */
        .pa-hero {
          margin-top: 40px;
          margin-bottom: 52px;
          animation: fadeUp 0.7s 0.1s ease both;
        }
        .pa-hero-eyebrow {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px; font-weight: 500;
          letter-spacing: 0.20em; text-transform: uppercase;
          color: #2ECC8F; margin-bottom: 20px;
          display: flex; align-items: center; gap: 10px;
        }
        .pa-hero-eyebrow::after {
          content: ''; display: block;
          width: 40px; height: 1px;
          background: #2ECC8F; opacity: 0.5;
        }
        .pa-hero h1 {
          font-family: 'Syne', sans-serif;
          font-size: clamp(42px, 6vw, 78px);
          font-weight: 800; line-height: 0.95;
          letter-spacing: -0.03em; color: #F8FAFC;
          margin-bottom: 24px;
        }
        .pa-hero h1 .accent {
          color: #A8D8FF;
          -webkit-text-stroke: 0;
        }
        .pa-hero-sub {
          font-family: 'DM Sans', sans-serif;
          font-size: 16px; font-weight: 300;
          color: rgba(160,200,224,0.60);
          max-width: 520px; line-height: 1.68;
        }

        /* ── Breadcrumb ── */
        .pa-breadcrumb {
          display: flex; align-items: center; gap: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px; color: var(--text3);
          animation: fadeUp .4s ease both;
        }
        .pa-breadcrumb a {
          color: var(--text3); text-decoration: none;
          transition: color .2s;
        }
        .pa-breadcrumb a:hover { color: #2ECC8F; }
        .pa-breadcrumb-current { color: #2ECC8F; }

        /* ── Agency count strip ── */
        .pa-count-strip {
          display: flex; align-items: center; gap: 20px;
          margin-bottom: 36px;
          animation: fadeUp .5s .1s ease both;
        }
        .pa-count-badge {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px; font-weight: 500;
          letter-spacing: .06em;
          color: var(--text3);
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px; padding: 6px 16px;
          backdrop-filter: blur(12px);
        }
        .pa-count-badge strong { color: #2ECC8F; font-weight: 700; }

        /* ── Card grid ── */
        .pa-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        /* ── Card ── */
        .pa-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 28px;
          display: flex; flex-direction: column;
          position: relative; overflow: hidden;
          transition: transform .25s, border-color .25s, box-shadow .25s, background .25s;
          animation: fadeUp .55s ease both;
          backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
        }
        .pa-card:nth-child(1) { animation-delay: .06s; }
        .pa-card:nth-child(2) { animation-delay: .10s; }
        .pa-card:nth-child(3) { animation-delay: .14s; }
        .pa-card:nth-child(4) { animation-delay: .18s; }
        .pa-card:nth-child(5) { animation-delay: .22s; }
        .pa-card:nth-child(6) { animation-delay: .26s; }
        .pa-card:nth-child(7) { animation-delay: .30s; }
        .pa-card:nth-child(8) { animation-delay: .34s; }

        .pa-card::before {
          content: ''; position: absolute; inset: 0;
          background: radial-gradient(ellipse 80% 60% at 0% 0%, rgba(var(--d-rgb),0.08) 0%, transparent 70%);
          pointer-events: none;
        }
        .pa-card:hover {
          transform: translateY(-4px);
          border-color: rgba(var(--d-rgb),0.40);
          background: rgba(13,27,46,0.88);
          box-shadow: 0 8px 32px rgba(0,0,0,0.35), 0 0 20px rgba(var(--d-rgb),0.15);
        }

        .pa-card-top {
          display: flex; align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 14px; position: relative; z-index: 1;
        }
        .pa-icon { font-size: 28px; line-height: 1; }
        .pa-tag {
          font-family: 'DM Sans', sans-serif;
          font-size: 9px; font-weight: 700;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: rgba(var(--d-rgb), 0.85);
          background: var(--d-dim);
          border: 1px solid var(--d-border);
          border-radius: 3px; padding: 3px 7px;
          opacity: 0.8;
        }

        .pa-card-name {
          font-family: 'Syne', sans-serif;
          font-size: 19px; font-weight: 800;
          letter-spacing: -0.02em; color: var(--text);
          position: relative; z-index: 1;
          margin-bottom: 3px;
        }
        .pa-card-fullname {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px; font-weight: 300;
          color: var(--text3); margin-bottom: 12px;
          line-height: 1.45; position: relative; z-index: 1;
        }
        .pa-card-desc {
          font-family: 'DM Sans', sans-serif;
          font-size: 13.5px; font-weight: 300;
          color: var(--text2); line-height: 1.65;
          margin-bottom: 14px;
          position: relative; z-index: 1; flex: 1;
        }

        .pa-role {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px; font-weight: 400;
          color: var(--text2);
          background: var(--d-dim);
          border-left: 3px solid rgba(var(--d-rgb), 0.6);
          border-radius: 0 6px 6px 0;
          padding: 8px 12px; margin-bottom: 16px;
          line-height: 1.5; position: relative; z-index: 1;
        }

        .pa-stats {
          display: grid; grid-template-columns: repeat(3,1fr);
          gap: 8px; margin-bottom: 16px;
          position: relative; z-index: 1;
        }
        .pa-stat {
          background: rgba(0,0,0,0.18);
          border: 1px solid rgba(var(--d-rgb), 0.18);
          border-radius: 9px; padding: 10px;
          text-align: center;
        }
        .pa-stat-val {
          font-family: 'Syne', sans-serif;
          font-size: 15px; font-weight: 800;
          color: rgba(var(--d-rgb), 0.9); letter-spacing: -.02em;
          display: block;
        }
        .pa-stat-lbl {
          font-family: 'DM Sans', sans-serif;
          font-size: 9px; font-weight: 400;
          color: var(--text3); letter-spacing: .04em;
          margin-top: 3px; display: block;
          line-height: 1.3;
        }

        .pa-contact-block {
          display: flex; flex-direction: column; gap: 6px;
          margin-bottom: 14px; position: relative; z-index: 1;
        }
        .pa-contact-row {
          display: flex; align-items: center; gap: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px; color: var(--text3);
        }
        .pa-contact-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: rgba(var(--d-rgb), 0.6); opacity: 0.7; flex-shrink: 0;
        }

        .pa-divider {
          height: 1px; background: var(--border);
          margin-bottom: 14px; position: relative; z-index: 1;
        }

        .pa-links { display: flex; flex-direction: column; position: relative; z-index: 1; }
        .pa-link {
          display: flex; align-items: center; justify-content: space-between;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px; font-weight: 400;
          color: var(--text3); text-decoration: none;
          padding: 8px 0;
          border-bottom: 1px solid var(--border);
          transition: color .2s, padding-left .2s;
        }
        .pa-link:last-child { border-bottom: none; }
        .pa-link:hover { color: rgba(var(--d-rgb), 0.85); padding-left: 4px; }
        .pa-link-arrow {
          font-size: 13px; opacity: 0;
          transform: translateX(-4px);
          transition: opacity .2s, transform .2s;
        }
        .pa-link:hover .pa-link-arrow { opacity: 1; transform: translateX(0); }

        /* ── CTA strip ── */
        .pa-cta {
          margin-top: 48px;
          background: var(--surface);
          border: 1px solid var(--border); border-radius: var(--radius);
          padding: 32px 36px;
          display: flex; align-items: center;
          justify-content: space-between; gap: 24px;
          animation: fadeUp .55s .38s ease both;
          backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
          position: relative; overflow: hidden;
        }
        .pa-cta::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, var(--red), transparent);
        }
        .pa-cta-text h3 {
          font-family: 'Syne', sans-serif;
          font-size: 18px; font-weight: 800;
          letter-spacing: -0.015em; color: var(--text);
          margin-bottom: 6px;
        }
        .pa-cta-text p {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px; font-weight: 300;
          color: var(--text3); line-height: 1.5; max-width: 380px;
        }
        .pa-cta-btn {
          flex-shrink: 0;
          display: inline-flex; align-items: center; gap: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px; font-weight: 700;
          letter-spacing: 0.08em; text-transform: uppercase;
          color: #0b0f1a; background: #2ECC8F;
          border: none; border-radius: 8px;
          padding: 13px 22px; cursor: pointer; text-decoration: none;
          transition: background .2s, transform .2s;
          white-space: nowrap;
        }
        .pa-cta-btn:hover { background: #38e09e; transform: translateY(-2px); }
        .pa-cta-btn span { font-size: 16px; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 720px) {
          .pa-wrap { padding: 0 16px 100px; }
          .pa-grid { grid-template-columns: 1fr; }
          .pa-cta  { flex-direction: column; align-items: flex-start; padding: 24px 20px; }
          .pa-hero h1 { font-size: 38px; }
          .pa-hero { margin-top: 48px; margin-bottom: 36px; }
        }
        @media (max-width: 480px) {
          .pa-hero h1 { font-size: 32px; }
          .pa-stats { grid-template-columns: repeat(3,1fr); }
        }
      `}</style>

      <div className="pa">
        {/* Background image */}
        <div
          className="pa-bg"
          style={{
            backgroundImage: `url(${bgImg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          <div className="pa-bg-overlay" />
          <div className="pa-bg-atmosphere" />
          <div className="pa-bg-grain" />
        </div>

        <div className="pa-wrap">

          {/* Nav */}
          <nav className="pa-nav">
            <Link to="/" className="pa-logo">
              <span className="pa-logo-dot" />
              DumaSafeGuide
            </Link>
            <Link to="/resources" className="pa-back">← Resources</Link>
          </nav>

          {/* Hero */}
          <section className="pa-hero">
            <div className="pa-breadcrumb" style={{ marginBottom: "20px" }}>
              <Link to="/resources">Resources</Link>
              <span style={{ opacity: 0.4 }}>›</span>
              <span className="pa-breadcrumb-current">Partner Agencies</span>
            </div>
            <div className="pa-hero-eyebrow">Organizations</div>
            <h1>
              Partner <span className="accent">Agencies</span>
            </h1>
            <p className="pa-hero-sub">
              Government bodies and civil society organizations collaborating with
              DumaSafeGuide to deliver coordinated, effective emergency response
              across Dumaguete City and Negros Oriental.
            </p>
          </section>

          {/* Count badge */}
          <div className="pa-count-strip">
            <div className="pa-count-badge">
              <strong>{agencies.length}</strong> partner agencies listed
            </div>
          </div>

          {/* Cards */}
          <div className="pa-grid">
            {agencies.map((agency) => (
              <div
                key={agency.id}
                id={agency.id}
                className="pa-card"
                style={{
                  "--d-color":  agency.color,
                  "--d-dim":    agency.colorDim,
                  "--d-border": agency.colorBorder,
                  "--d-rgb":    agency.colorRgb,
                } as React.CSSProperties}
              >
                <div className="pa-card-top">
                  <span className="pa-icon">{agency.icon}</span>
                  <span className="pa-tag">{agency.tag}</span>
                </div>

                <div className="pa-card-name">{agency.name}</div>
                <div className="pa-card-fullname">{agency.fullName}</div>

                <p className="pa-card-desc">{agency.description}</p>

                <div className="pa-role">{agency.role}</div>

                <div className="pa-stats">
                  {agency.stats.map((s) => (
                    <div key={s.label} className="pa-stat">
                      <span className="pa-stat-val">{s.value}</span>
                      <span className="pa-stat-lbl">{s.label}</span>
                    </div>
                  ))}
                </div>

                <div className="pa-contact-block">
                  <div className="pa-contact-row">
                    <div className="pa-contact-dot" />
                    <span>📞 {agency.hotline}</span>
                  </div>
                  <div className="pa-contact-row">
                    <div className="pa-contact-dot" />
                    <span>✉️ {agency.email}</span>
                  </div>
                  <div className="pa-contact-row">
                    <div className="pa-contact-dot" />
                    <span>📍 {agency.address}</span>
                  </div>
                </div>

                <div className="pa-divider" />

                <div className="pa-links">
                  {agency.links.map((link) =>
                    link.href.startsWith("/") ? (
                      <Link key={link.label} to={link.href} className="pa-link">
                        <span>{link.label}</span>
                        <span className="pa-link-arrow">→</span>
                      </Link>
                    ) : (
                      <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" className="pa-link">
                        <span>{link.label}</span>
                        <span className="pa-link-arrow">↗</span>
                      </a>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="pa-cta">
            <div className="pa-cta-text">
              <h3>Need to report an emergency?</h3>
              <p>Don't wait — use the incident reporting form to alert local responders immediately.</p>
            </div>
            <Link to="/report" className="pa-cta-btn">
              <span>🚨</span> Report Now
            </Link>
          </div>

        </div>
      </div>
    </>
  );
}