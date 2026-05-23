// src/components/Footer.tsx
import "./Footer.css";

import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  FaShieldAlt,
  FaMapMarkedAlt,
  FaClipboardList,
  FaLightbulb,
  FaHeart,
  FaPhone,
  FaInfoCircle,
  FaBook,
  FaLock,
  FaFileAlt,
  FaAddressBook,
  FaChevronDown,
} from "react-icons/fa";

import dsgLogo  from "../assets/dsg.logo.png";
import footerBg from "../assets/footer.png";

/* ─────────────────────────────────────────
   TYPES
───────────────────────────────────────── */
interface FooterLink {
  label: string;
  to: string;
  icon?: React.ReactNode;
}

interface FooterColumn {
  heading: string;
  links: FooterLink[];
}

interface Hotline {
  label: string;
  number: string;
  dialNumber: string;
  color: string;
  bg: string;
  pulse?: boolean;
}

/* ─────────────────────────────────────────
   DATA
   — Portals removed: ProtectedRoute handles
     post-login routing automatically.
───────────────────────────────────────── */
const FOOTER_NAV: FooterColumn[] = [
  {
    heading: "Navigate",
    links: [
      { label: "Safety Map",        to: "/map",        icon: <FaMapMarkedAlt size={11} /> },
      { label: "Report Incident",   to: "/report",     icon: <FaClipboardList size={11} /> },
      { label: "Safety Tips",       to: "/safetytips", icon: <FaLightbulb size={11} /> },
      { label: "Emergency Contacts",to: "/directory",  icon: <FaAddressBook size={11} /> },
    ],
  },
  {
    heading: "About",
    links: [
      { label: "About DumaSafeGuide", to: "/about",   icon: <FaInfoCircle size={11} /> },
      { label: "Resources",           to: "/resources",icon: <FaBook size={11} /> },
      { label: "Privacy Policy",      to: "/privacy",  icon: <FaLock size={11} /> },
      { label: "Terms of Use",        to: "/terms",    icon: <FaFileAlt size={11} /> },
    ],
  },
];

const HOTLINES: Hotline[] = [
  { label: "Emergency", number: "911",  dialNumber: "911",  color: "#FF4444", bg: "rgba(255,68,68,0.10)",  pulse: true },
  { label: "NDRRMC",    number: "8911", dialNumber: "8911", color: "#F4A261", bg: "rgba(244,162,97,0.10)" },
  { label: "BFP Fire",  number: "160",  dialNumber: "160",  color: "#F39C12", bg: "rgba(243,156,18,0.10)" },
  { label: "PNP",       number: "117",  dialNumber: "117",  color: "#60B4FF", bg: "rgba(96,180,255,0.10)" },
];

const HIDDEN_PATHS = ["/signup"];

/* ─────────────────────────────────────────
   COMPONENT
───────────────────────────────────────── */
export default function Footer() {
  const location = useLocation();
  const year     = new Date().getFullYear();
  const [openCol, setOpenCol] = useState<string | null>(null);

  if (HIDDEN_PATHS.includes(location.pathname)) return null;

  const toggle = (h: string) => setOpenCol(p => p === h ? null : h);

  return (
    <footer className="ft">

      {/* Textured photo scrim */}
      <div className="ft-scrim" style={{ backgroundImage: `url(${footerBg})` }} />

      {/* Ambient glows */}
      <div className="ft-glow-left"  aria-hidden="true" />
      <div className="ft-glow-right" aria-hidden="true" />

      <div className="ft-inner">

        {/* ══════════════════════════════════
            STATUS STRIP — top edge signal bar
        ══════════════════════════════════ */}
        <div className="ft-status-strip">
          <div className="ft-status-left">
            <span className="ft-status-dot" />
            <span className="ft-status-city">Dumaguete City</span>
            <span className="ft-status-sep">·</span>
            <span className="ft-status-text">All systems operational</span>
          </div>
          <div className="ft-status-right">
            <FaShieldAlt size={10} color="rgba(0,200,224,0.55)" />
            <span>DumaSafeGuide Active</span>
          </div>
        </div>

        {/* ══════════════════════════════════
            HOTLINE CARDS
        ══════════════════════════════════ */}
        <div className="ft-hotlines">
          <div className="ft-hotlines-head">
            <FaPhone size={12} color="#e8372a" />
            <span className="ft-hotlines-label">Emergency Hotlines</span>
            <span className="ft-hotlines-hint">Tap to dial instantly</span>
          </div>
          <div className="ft-hotlines-row">
            {HOTLINES.map((h) => (
              <a
                key={h.label}
                href={`tel:${h.dialNumber}`}
                className={`ft-hotline-card${h.pulse ? " is-pulse" : ""}`}
                style={{
                  "--hc-color": h.color,
                  "--hc-bg":    h.bg,
                } as React.CSSProperties}
                title={`Call ${h.label}: ${h.number}`}
              >
                <div className="ft-hc-icon-wrap">
                  <FaPhone size={13} />
                </div>
                <div className="ft-hc-body">
                  <span className="ft-hc-num">{h.number}</span>
                  <span className="ft-hc-label">{h.label}</span>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════
            MAIN GRID — brand + nav columns
        ══════════════════════════════════ */}
        <div className="ft-main">

          {/* Brand */}
          <div className="ft-brand-col">
            <Link to="/" className="ft-brand-lockup">
              <img src={dsgLogo} alt="DumaSafeGuide" className="ft-brand-logo" />
              <span className="ft-brand-name">
                Duma<em>Safe</em><strong>Guide</strong>
              </span>
            </Link>

            <p className="ft-brand-desc">
              A community-built safety platform for the City of Gentle People.
              Fast access to hotlines, incident reporting, and disaster preparedness.
            </p>

            <div className="ft-brand-badge">
              <span className="ft-badge-dot" />
              Serving Dumaguete City · Negros Oriental
            </div>
          </div>

          {/* Nav columns — accordion on mobile */}
          {FOOTER_NAV.map((col) => {
            const isOpen = openCol === col.heading;
            return (
              <div key={col.heading} className={`ft-nav-col${isOpen ? " is-open" : ""}`}>
                <button
                  className="ft-col-toggle"
                  aria-expanded={isOpen}
                  onClick={() => toggle(col.heading)}
                >
                  <span className="ft-col-head">{col.heading}</span>
                  <FaChevronDown size={10} className="ft-col-chevron" />
                </button>
                <ul className="ft-col-links">
                  {col.links.map((l) => (
                    <li key={l.to}>
                      <Link to={l.to} className="ft-col-link">
                        {l.icon && <span className="ft-link-icon">{l.icon}</span>}
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}

        </div>

        {/* ══════════════════════════════════
            DIVIDER
        ══════════════════════════════════ */}
        <div className="ft-rule" />

        {/* ══════════════════════════════════
            BOTTOM BAR
        ══════════════════════════════════ */}
        <div className="ft-bottom">
          <p className="ft-copy">
            &copy; {year} DumaSafeGuide &mdash; All rights reserved.
          </p>
          <p className="ft-love">
            Built with <FaHeart size={10} color="#e8372a" aria-label="love" /> for the safety of every Dumagueteño
          </p>
        </div>

      </div>
    </footer>
  );
}