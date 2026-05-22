// src/components/Footer.tsx
import "./Footer.css";

import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  FaShieldAlt,
  FaMapMarkedAlt,
  FaClipboardList,
  FaLightbulb,
  FaUsers,
  FaHeart,
  FaPhone,
} from "react-icons/fa";

import dsgLogo    from "../assets/dsg.logo.png";
import footerBg   from "../assets/footer.png";

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
  pulse?: boolean;
}

const FOOTER_NAV: FooterColumn[] = [
  {
    heading: "Community",
    links: [
      { label: "Safety Map",      to: "/map",        icon: <FaMapMarkedAlt size={11} /> },
      { label: "Report Incident", to: "/report",     icon: <FaClipboardList size={11} /> },
      { label: "Safety Tips",     to: "/safetytips", icon: <FaLightbulb size={11} /> },
    ],
  },
  {
    heading: "Portals",
    links: [
      { label: "Citizen Dashboard", to: "/citizen/dashboard",   icon: <FaUsers size={11} /> },
      { label: "Responder Portal",  to: "/responder/dashboard", icon: <FaShieldAlt size={11} /> },
      { label: "Admin Panel",       to: "/admin/dashboard",     icon: <FaClipboardList size={11} /> },
    ],
  },
  {
    heading: "Information",
    links: [
      { label: "About DumaSafeGuide", to: "/about"     },
      { label: "Privacy Policy",      to: "/privacy"   },
      { label: "Terms of Use",        to: "/terms"     },
      { label: "Emergency Contacts",  to: "/directory" },
      { label: "Resources",           to: "/resources" },
    ],
  },
];

const HOTLINES: Hotline[] = [
  { label: "Emergency", number: "911",  dialNumber: "911",  color: "#FF4444", pulse: true },
  { label: "NDRRMC",    number: "8911", dialNumber: "8911", color: "#F4A261" },
  { label: "BFP Fire",  number: "160",  dialNumber: "160",  color: "#F39C12" },
  { label: "PNP",       number: "117",  dialNumber: "117",  color: "#60B4FF" },
];

const HIDDEN_PATHS = ["/signup"];

export default function Footer() {
  const location = useLocation();
  const year = new Date().getFullYear();

  // ✅ Track which accordion column is open on mobile
  const [openCol, setOpenCol] = useState<string | null>(null);

  const toggleCol = (heading: string) => {
    setOpenCol(prev => prev === heading ? null : heading);
  };

  if (HIDDEN_PATHS.includes(location.pathname)) return null;

  return (
    <footer className="ft">

      <div
        className="ft-scrim"
        style={{ backgroundImage: `url(${footerBg})` }}
      />

      <div className="ft-glow" />
      <div className="ft-glow-right" />

      <div className="ft-inner">

        {/* ── HOTLINES ── */}
        <div className="ft-hotlines">
          <span className="ft-hotlines-label">Hotlines</span>
          {HOTLINES.map((h) => (
            <a
              key={h.label}
              href={`tel:${h.dialNumber}`}
              className={`ft-hotline-pill${h.pulse ? " ft-hotline-pill--pulse" : ""}`}
              style={{ "--hp-color": h.color } as React.CSSProperties}
              title={`Call ${h.label}: ${h.number}`}
            >
              <FaPhone size={9} className="ft-hotline-icon" />
              <span className="ft-hotline-label">{h.label}</span>
              <span className="ft-hotline-num">{h.number}</span>
            </a>
          ))}
          <span className="ft-hotlines-hint">Tap to call</span>
        </div>

        {/* ── MAIN GRID ── */}
        <div className="ft-main">

          {/* BRAND */}
          <div className="ft-brand-col">
            <div className="ft-brand-top">
              <img src={dsgLogo} alt="DumaSafeGuide Logo" className="ft-brand-logo" />
              <span className="ft-brand-name">
                Duma<em>SafeGuide</em>
              </span>
            </div>
            <p className="ft-brand-desc">
              A barangay-wide community safety platform for incident reporting,
              emergency response, and disaster preparedness.
            </p>

            {/* Mobile-only quick-dial grid */}
            <div className="ft-mobile-dial">
              <p className="ft-mobile-dial-label">Quick Dial</p>
              <div className="ft-mobile-dial-grid">
                {HOTLINES.map((h) => (
                  <a
                    key={h.label}
                    href={`tel:${h.dialNumber}`}
                    className="ft-mobile-dial-btn"
                    style={{ "--hp-color": h.color } as React.CSSProperties}
                  >
                    <FaPhone size={12} />
                    <span className="ft-mobile-dial-name">{h.label}</span>
                    <span className="ft-mobile-dial-num">{h.number}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* ── NAV COLUMNS — accordion on mobile ── */}
          {FOOTER_NAV.map((col) => {
            const isOpen = openCol === col.heading;
            return (
              <div
                key={col.heading}
                className={`ft-nav-col${isOpen ? " open" : ""}`}
              >
                {/* ✅ Button toggles open state on mobile; pointer-events: none on desktop via CSS */}
                <button
                  className="ft-col-toggle"
                  aria-label={`Toggle ${col.heading}`}
                  aria-expanded={isOpen}
                  onClick={() => toggleCol(col.heading)}
                >
                  <span className="ft-col-head">{col.heading}</span>
                  <span className="ft-col-chevron">›</span>
                </button>

                <div className="ft-col-links">
                  {col.links.map((l) => (
                    <Link key={l.to} to={l.to} className="ft-col-link">
                      {l.icon && l.icon}
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}

        </div>

        {/* ── BOTTOM BAR ── */}
        <div className="ft-bottom">
          <p className="ft-copy">
            &copy; {year} DumaSafeGuide. All rights reserved.
          </p>
          <div className="ft-bottom-right">
            <span className="ft-badge">Barangay Active</span>
            <span className="ft-love">
              Built with <FaHeart color="#FF4444" /> for safety
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}