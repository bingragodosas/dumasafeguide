import { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import Navbar from "../components/Navbar";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import mapBg from "../assets/mapbg.png";

interface Location {
  id: number;
  category: "emergency" | "hospital" | "evacuation";
  label: string;
  address: string;
  phone: string;
  lat: number;
  lng: number;
}

const LOCATIONS: Location[] = [
  // ── Emergency Services ──
  { id: 1,  category: "emergency",  label: "PNP Dumaguete",                    address: "Camp Leon Kilat, Dumaguete City",                phone: "(035) 225-1766",  lat: 9.3100,  lng: 123.3075 },
  { id: 2,  category: "emergency",  label: "BFP Fire Station",                 address: "Real St, Dumaguete City",                       phone: "160",             lat: 9.3083,  lng: 123.3061 },
  { id: 3,  category: "emergency",  label: "CDRRMO",                           address: "City Hall Compound, Dumaguete City",             phone: "0936 795 4163",   lat: 9.3077,  lng: 123.3054 },
  { id: 4,  category: "emergency",  label: "ONE Rescue (EMS)",                 address: "Oriental Negros Emergency Rescue Foundation",    phone: "(035) 225-9110",  lat: 9.3068,  lng: 123.3042 },
  { id: 5,  category: "emergency",  label: "Philippine Coast Guard",           address: "Dumaguete Boulevard, Dumaguete City",            phone: "(035) 422-6541",  lat: 9.3095,  lng: 123.3088 },
  { id: 6,  category: "emergency",  label: "LDRRMO (Provincial)",              address: "Dumaguete City (Provincial)",                    phone: "(035) 422-3636",  lat: 9.3060,  lng: 123.3070 },
  // ── Hospitals ──
  { id: 7,  category: "hospital",   label: "Silliman Univ. Medical Center",    address: "V. Aldecoa Sr. Road, Daro, Dumaguete City",     phone: "(035) 420-2000",  lat: 9.3055,  lng: 123.3028 },
  { id: 8,  category: "hospital",   label: "ACE Dumaguete Doctors Hospital",   address: "Claytown Road (North Road), Dumaguete City",    phone: "(035) 523-5957",  lat: 9.3140,  lng: 123.3090 },
  { id: 9,  category: "hospital",   label: "Holy Child Hospital",              address: "Bp. Epifanio Surban St., Dumaguete City",       phone: "(035) 422-9063",  lat: 9.2990,  lng: 123.3040 },
  { id: 10, category: "hospital",   label: "Negros Oriental Provincial Hosp.", address: "North National Highway, Brgy. Piapi, Dumaguete",phone: "(035) 225-4921",  lat: 9.3180,  lng: 123.3110 },
  // ── Evacuation Centers ──
  { id: 11, category: "evacuation", label: "Bagacay Gymnasium",                address: "Barangay Bagacay, Dumaguete City",               phone: "09652045077",     lat: 9.3020,  lng: 123.3030 },
  { id: 12, category: "evacuation", label: "NORSU Main Campus II",             address: "Barangay Bajumpandan, Dumaguete City",           phone: "09551850601",     lat: 9.3155,  lng: 123.3040 },
  { id: 13, category: "evacuation", label: "Dumaguete City National High",     address: "Barangay Calindagan, Dumaguete City",            phone: "09457419261",     lat: 9.3010,  lng: 123.3055 },
  { id: 14, category: "evacuation", label: "Taclobo National High School",     address: "Barangay Taclobo, Dumaguete City",               phone: "(035) 226-3953",  lat: 9.3130,  lng: 123.3025 },
  { id: 15, category: "evacuation", label: "Talay Multi-purpose Center",       address: "Barangay Talay, Dumaguete City",                 phone: "09190834553",     lat: 9.2970,  lng: 123.3010 },
  { id: 16, category: "evacuation", label: "City Central Elementary School",   address: "Poblacion 1, Dumaguete City",                    phone: "09264603953",     lat: 9.3072,  lng: 123.3058 },
];

const CAT_CONFIG: Record<string, {
  color: string; bg: string; border: string; icon: string; label: string;
}> = {
  emergency: {
    color:  "#e8372a",
    bg:     "rgba(232,55,42,0.10)",
    border: "rgba(232,55,42,0.32)",
    icon:   "🚨",
    label:  "Emergency Services",
  },
  hospital: {
    color:  "#4A90D9",
    bg:     "rgba(74,144,217,0.10)",
    border: "rgba(74,144,217,0.32)",
    icon:   "🏥",
    label:  "Hospitals",
  },
  evacuation: {
    color:  "#00c8e0",
    bg:     "rgba(0,200,224,0.10)",
    border: "rgba(0,200,224,0.32)",
    icon:   "🏫",
    label:  "Evacuation Centers",
  },
};

const CATEGORY_ORDER: Array<"emergency" | "hospital" | "evacuation"> = [
  "emergency", "hospital", "evacuation",
];

function openGoogleMaps(lat: number, lng: number) {
  window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, "_blank");
}

function FlyTo({ target }: { target: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target, 17, { duration: 1.2 });
  }, [target]);
  return null;
}

function createIcon(category: string) {
  const cfg = CAT_CONFIG[category];
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width:38px;height:38px;border-radius:9999px;
        background:${cfg.color};
        display:flex;align-items:center;justify-content:center;
        font-size:16px;
        border:2.5px solid #0d1b2e;
        box-shadow:0 2px 12px rgba(0,0,0,0.40),0 0 0 3px ${cfg.color}44;
      ">${cfg.icon}</div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  });
}

export default function FacilityLocator() {
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
  const [search, setSearch]       = useState("");
  const [activeFilter, setFilter] = useState<string | null>(null);
  const markersRef = useRef<Record<number, L.Marker>>({});

  function handleSelect(loc: Location) {
    setFlyTarget([loc.lat, loc.lng]);
    setTimeout(() => markersRef.current[loc.id]?.openPopup(), 1200);
  }

  const filtered = LOCATIONS.filter((loc) => {
    const q = search.toLowerCase();
    const matchSearch =
      loc.label.toLowerCase().includes(q) ||
      loc.address.toLowerCase().includes(q);
    const matchFilter = !activeFilter || loc.category === activeFilter;
    return matchSearch && matchFilter;
  });

  const byCategory = (cat: string) => filtered.filter((l) => l.category === cat);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .fl-root {
          min-height: 100vh;
          font-family: 'DM Sans', sans-serif;
          color: #ddeef8;
          position: relative;
          overflow-x: hidden;
        }

        /* ── Background with Ken Burns drift ── */
        .fl-bg {
          position: fixed; inset: 0; z-index: 0;
          overflow: hidden;
        }
        .fl-bg-img {
          width: 100%; height: 100%;
          object-fit: cover; object-position: 15% center; display: block;
          transform-origin: center center;
          animation: bgDrift 35s ease-in-out infinite;
          will-change: transform;
        }

        @keyframes bgDrift {
          0%   { transform: scale(1.08) translate(0px,   0px);   }
          25%  { transform: scale(1.12) translate(-14px, -12px); }
          50%  { transform: scale(1.09) translate(-4px,  -20px); }
          75%  { transform: scale(1.13) translate(16px,  -4px);  }
          100% { transform: scale(1.08) translate(0px,   0px);   }
        }

        .fl-bg-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(
            180deg,
            rgba(7,16,29,0.82) 0%,
            rgba(7,16,29,0.70) 30%,
            rgba(7,16,29,0.78) 70%,
            rgba(7,16,29,0.96) 100%
          );
        }
        .fl-bg-atmosphere {
          position: absolute; inset: 0; pointer-events: none;
          background:
            radial-gradient(ellipse 40% 55% at 0%  50%, rgba(232,55,42,0.08)  0%, transparent 70%),
            radial-gradient(ellipse 35% 40% at 20% 30%, rgba(13,27,46,0.30)   0%, transparent 60%),
            radial-gradient(ellipse 45% 55% at 95% 85%, rgba(0,200,224,0.06)  0%, transparent 70%);
        }

        /* ── Body ── */
        .fl-body {
          position: relative; z-index: 1;
          display: flex; flex-direction: column; min-height: 100vh;
        }

        /* ── Hero — uses the fixed bg, no inline image ── */
        .fl-hero {
          padding: 48px 0 40px;
          animation: fadeUp 0.55s ease both;
        }
        .fl-hero-inner {
          max-width: 1080px;
          margin: 0 auto;
          padding: 0 28px;
        }

        .fl-eyebrow {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px; font-weight: 500;
          letter-spacing: 0.20em; text-transform: uppercase;
          color: #e8372a; margin-bottom: 16px;
          display: flex; align-items: center; gap: 10px;
        }
        .fl-eyebrow::after {
          content: ''; display: block;
          width: 40px; height: 1px;
          background: #e8372a; opacity: 0.5;
        }

        .fl-hero h1 {
          font-family: 'Syne', sans-serif;
          font-size: clamp(34px, 5.5vw, 72px);
          font-weight: 800; letter-spacing: -0.03em;
          color: #F8FAFC; line-height: 0.97;
        }
        .fl-hero h1 .accent {
          color: #A8D8FF;
          -webkit-text-stroke: 0;
        }

        .fl-hero-sub {
          font-family: 'DM Sans', sans-serif;
          font-size: 16px; font-weight: 300;
          color: rgba(168, 216, 255, 0.70);
          margin-top: 16px; max-width: 480px; line-height: 1.68;
        }

        /* ── Filter pills ── */
        .fl-filters {
          display: flex; gap: 8px;
          padding: 14px 28px;
          max-width: 1080px; margin: 0 auto;
          flex-wrap: wrap; align-items: center;
        }
        .fl-filters-bar {
          background: rgba(7,16,29,0.85);
          border-top: 1px solid rgba(0,200,224,0.08);
          border-bottom: 1px solid rgba(0,200,224,0.08);
          backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
        }
        .fl-filter-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase;
          color: rgba(160,200,224,0.25); margin-right: 2px;
        }
        .fl-filter-pill {
          display: inline-flex; align-items: center; gap: 6px;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px; font-weight: 500; letter-spacing: 0.07em; text-transform: uppercase;
          border-radius: 20px; padding: 7px 14px;
          cursor: pointer; transition: all 0.18s ease;
        }
        .fl-filter-pill-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }

        /* ── Content grid ── */
        .fl-content {
          display: grid; grid-template-columns: 340px 1fr;
          flex: 1; min-height: calc(100vh - 260px);
          max-width: 1080px; margin: 0 auto; width: 100%;
          animation: fadeUp 0.55s ease 0.1s both;
        }
        @media (max-width: 900px) { .fl-content { grid-template-columns: 1fr; } }

        /* ── Sidebar ── */
        .fl-sidebar {
          background: rgba(13,27,46,0.88);
          backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
          border-right: 1px solid rgba(0,200,224,0.09);
          display: flex; flex-direction: column; overflow: hidden;
          border-radius: 0 0 0 12px;
        }
        .fl-search-wrap {
          padding: 16px 14px 12px;
          border-bottom: 1px solid rgba(0,200,224,0.08);
          position: relative; flex-shrink: 0;
        }
        .fl-search-icon {
          position: absolute; left: 26px; top: 50%; transform: translateY(-50%);
          font-size: 13px; opacity: 0.25; pointer-events: none;
        }
        .fl-search-input {
          width: 100%; background: #060f1c;
          border: 1px solid rgba(0,200,224,0.10); border-radius: 9px;
          padding: 10px 14px 10px 34px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px; color: #c8e4f4; outline: none;
          caret-color: #00c8e0;
          transition: border-color 0.18s ease, background 0.18s ease;
        }
        .fl-search-input::placeholder { color: rgba(160,200,224,0.18); }
        .fl-search-input:focus {
          border-color: rgba(0,200,224,0.38);
          background: rgba(0,200,224,0.02);
          box-shadow: 0 0 0 3px rgba(0,200,224,0.06);
        }

        .fl-list { overflow-y: auto; flex: 1; padding: 10px 12px 24px; }
        .fl-list::-webkit-scrollbar { width: 3px; }
        .fl-list::-webkit-scrollbar-track { background: transparent; }
        .fl-list::-webkit-scrollbar-thumb { background: rgba(0,200,224,0.10); border-radius: 2px; }

        /* ── Category section ── */
        .fl-cat-section { margin-bottom: 4px; }
        .fl-cat-header {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 8px 8px;
          position: sticky; top: 0; z-index: 10;
          background: rgba(13,27,46,0.96);
          backdrop-filter: blur(10px);
          border-radius: 7px; margin-bottom: 6px;
        }
        .fl-cat-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
        .fl-cat-title {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px; font-weight: 500;
          letter-spacing: 0.14em; text-transform: uppercase; flex: 1;
        }
        .fl-cat-count {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px; font-weight: 500;
          color: rgba(160,200,224,0.28);
          background: rgba(0,200,224,0.05);
          border: 1px solid rgba(0,200,224,0.09);
          border-radius: 4px; padding: 2px 7px;
        }
        .fl-cat-divider { height: 1px; background: rgba(0,200,224,0.07); margin: 10px 2px; }

        /* ── Facility card ── */
        .fl-facility-card {
          background: #0d1b2e;
          border: 1px solid rgba(0,200,224,0.07);
          border-left: 3px solid var(--cat-color);
          border-radius: 10px; padding: 12px 14px;
          margin-bottom: 7px; cursor: pointer;
          transition: transform 0.20s ease, box-shadow 0.20s ease, background 0.20s ease, border-color 0.20s ease;
        }
        .fl-facility-card:hover {
          transform: translateY(-2px);
          border-color: var(--cat-color);
          background: rgba(13,27,46,0.95);
          box-shadow: 0 4px 18px rgba(0,0,0,0.38), 0 0 10px var(--cat-glow);
        }
        .fl-facility-name {
          font-family: 'Syne', sans-serif;
          font-size: 13px; font-weight: 700; letter-spacing: -0.01em;
          color: #ddeef8; margin-bottom: 3px; line-height: 1.3;
        }
        .fl-facility-addr {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px; font-weight: 300;
          color: rgba(160,200,224,0.35);
          margin-bottom: 8px; line-height: 1.45;
        }
        .fl-facility-phone {
          display: inline-flex; align-items: center; gap: 4px;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px; font-weight: 500; letter-spacing: 0.01em;
          text-decoration: none; transition: opacity 0.15s ease;
        }
        .fl-facility-phone:hover { opacity: 0.75; }

        /* ── Map panel ── */
        .fl-map-panel { position: relative; }

        /* ── Leaflet popup ── */
        .leaflet-popup-content-wrapper {
          background: #ffffff !important;
          border: none !important;
          border-radius: 14px !important;
          box-shadow: 0 4px 24px rgba(0,0,0,0.20), 0 1px 6px rgba(0,0,0,0.12) !important;
          color: #1a1a2e !important;
          padding: 0 !important;
          overflow: hidden;
        }
        .leaflet-popup-content { margin: 0 !important; width: auto !important; }
        .leaflet-popup-tip { background: #ffffff !important; box-shadow: none !important; }
        .leaflet-popup-close-button { color: #9ca3af !important; font-size: 18px !important; top: 10px !important; right: 12px !important; z-index: 10; }
        .leaflet-popup-close-button:hover { color: #374151 !important; }

        /* ── Map legend ── */
        .fl-legend {
          position: absolute; top: 16px; right: 16px; z-index: 400;
          background: rgba(255,255,255,0.97);
          border: 1px solid rgba(0,0,0,0.08);
          border-radius: 12px; padding: 14px 16px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.14);
          min-width: 180px;
        }
        .fl-legend-title {
          font-family: 'DM Sans', sans-serif;
          font-size: 9px; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase;
          color: #6b7280; margin-bottom: 10px;
        }
        .fl-legend-item {
          display: flex; align-items: center; gap: 8px;
          margin-bottom: 7px;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px; font-weight: 500; color: #374151;
        }
        .fl-legend-item:last-child { margin-bottom: 0; }
        .fl-legend-dot { width: 11px; height: 11px; border-radius: 50%; flex-shrink: 0; }
        .fl-legend-count {
          margin-left: auto;
          font-family: 'DM Sans', sans-serif;
          font-size: 10px; font-weight: 500;
          color: #9ca3af; background: #f3f4f6; border-radius: 4px; padding: 1px 6px;
        }

        /* ── Map status badge ── */
        .fl-map-badge {
          position: absolute; bottom: 20px; left: 20px; z-index: 400;
          background: rgba(255,255,255,0.97);
          border: 1px solid rgba(0,0,0,0.08);
          border-radius: 12px; padding: 12px 16px; max-width: 240px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.12);
        }
        .fl-badge-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
        .fl-badge-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #e8372a; flex-shrink: 0;
          animation: badgePulse 2.5s ease-in-out infinite;
        }
        @keyframes badgePulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(232,55,42,0.5); }
          50%      { box-shadow: 0 0 0 4px rgba(232,55,42,0); }
        }
        .fl-badge-title {
          font-family: 'Syne', sans-serif;
          font-size: 12px; font-weight: 700; color: #111827;
        }
        .fl-badge-sub {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px; font-weight: 400; color: #6b7280; line-height: 1.5;
        }

        /* ── Popup internals ── */
        .fl-popup-header { padding: 14px 16px 10px; border-bottom: 1px solid #f3f4f6; }
        .fl-popup-cat {
          font-family: 'DM Sans', sans-serif;
          font-size: 9px; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase;
          margin-bottom: 4px; display: flex; align-items: center; gap: 4px;
        }
        .fl-popup-name {
          font-family: 'Syne', sans-serif;
          font-size: 14px; font-weight: 700; letter-spacing: -0.01em;
          color: #111827; line-height: 1.3;
        }
        .fl-popup-body { padding: 10px 16px 14px; }
        .fl-popup-row {
          display: flex; align-items: flex-start; gap: 6px;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px; font-weight: 400;
          color: #6b7280; margin-bottom: 5px; line-height: 1.45;
        }
        .fl-popup-phone-link {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px; font-weight: 500;
          text-decoration: none; transition: opacity 0.15s ease;
        }
        .fl-popup-phone-link:hover { opacity: 0.75; }
        .fl-popup-nav-btn {
          width: 100%; margin-top: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase;
          border-radius: 8px; padding: 10px 14px;
          cursor: pointer; border: none; color: white;
          display: flex; align-items: center; justify-content: center; gap: 6px;
          transition: opacity 0.18s ease, transform 0.18s ease;
        }
        .fl-popup-nav-btn:hover { opacity: 0.88; transform: translateY(-1px); }

        /* ── No results ── */
        .fl-no-results {
          text-align: center;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px; font-weight: 300;
          color: rgba(160,200,224,0.22); padding: 40px 0;
        }

        /* ── Animations ── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Responsive ── */
        @media (max-width: 900px) {
          .fl-content { max-width: 100%; }
          .fl-filters { padding: 12px 20px; }
          .fl-hero-inner { padding: 0 20px; }
        }
        @media (max-width: 600px) {
          .fl-hero { padding: 32px 0 28px; }
          .fl-hero-inner { padding: 0 16px; }
          .fl-filters { padding: 10px 16px; }
        }
      `}</style>

      <div className="fl-root">

        {/* ── Fixed animated background ── */}
        <div className="fl-bg">
          <img src={mapBg} alt="" className="fl-bg-img" aria-hidden="true" />
          <div className="fl-bg-overlay" />
          <div className="fl-bg-atmosphere" />
        </div>

        <div className="fl-body">

          {/* ── HERO — no inline backgroundImage, uses the fixed bg ── */}
          <section className="fl-hero">
            <div className="fl-hero-inner">
              <div className="fl-eyebrow">Facility Locator</div>
              <h1>
                Find Help <span className="accent">Near You</span>
              </h1>
              <p className="fl-hero-sub">
                Locate emergency services, hospitals, and evacuation centers
                across Dumaguete City — tap any pin to get directions.
              </p>
            </div>
          </section>

          {/* ── FILTER PILLS ── */}
          <div className="fl-filters-bar">
            <div className="fl-filters">
              <span className="fl-filter-label">Filter:</span>

              <button
                className="fl-filter-pill"
                onClick={() => setFilter(null)}
                style={{
                  background: !activeFilter ? "rgba(0,200,224,0.10)" : "rgba(0,200,224,0.03)",
                  border: `1px solid ${!activeFilter ? "rgba(0,200,224,0.35)" : "rgba(0,200,224,0.09)"}`,
                  color: !activeFilter ? "#00c8e0" : "rgba(160,200,224,0.40)",
                }}
              >
                All ({LOCATIONS.length})
              </button>

              {CATEGORY_ORDER.map((cat) => {
                const cfg = CAT_CONFIG[cat];
                const active = activeFilter === cat;
                return (
                  <button
                    key={cat}
                    className="fl-filter-pill"
                    onClick={() => setFilter(active ? null : cat)}
                    style={{
                      background: active ? cfg.bg : "rgba(0,200,224,0.03)",
                      border: `1px solid ${active ? cfg.border : "rgba(0,200,224,0.09)"}`,
                      color: active ? cfg.color : "rgba(160,200,224,0.45)",
                      boxShadow: active ? `0 0 10px ${cfg.color}22` : "none",
                    }}
                  >
                    <span className="fl-filter-pill-dot" style={{ background: cfg.color }} />
                    {cfg.icon} {cfg.label} ({LOCATIONS.filter((l) => l.category === cat).length})
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── CONTENT ── */}
          <div className="fl-content">

            {/* SIDEBAR */}
            <aside className="fl-sidebar">
              <div className="fl-search-wrap">
                <span className="fl-search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search facilities or addresses..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="fl-search-input"
                />
              </div>

              <div className="fl-list">
                {CATEGORY_ORDER.map((cat, idx) => {
                  const cfg = CAT_CONFIG[cat];
                  const items = byCategory(cat);
                  if (items.length === 0) return null;

                  const phoneColor =
                    cat === "emergency" ? "#ff8a80" :
                    cat === "hospital"  ? "#93c4ef" :
                    "#7ce8f5";

                  return (
                    <div key={cat} className="fl-cat-section">
                      {idx > 0 && <div className="fl-cat-divider" />}
                      <div className="fl-cat-header">
                        <div className="fl-cat-dot" style={{ background: cfg.color }} />
                        <span className="fl-cat-title" style={{ color: cfg.color }}>
                          {cfg.icon} {cfg.label}
                        </span>
                        <span className="fl-cat-count">{items.length}</span>
                      </div>
                      {items.map((loc) => (
                        <div
                          key={loc.id}
                          onClick={() => handleSelect(loc)}
                          className="fl-facility-card"
                          style={{
                            "--cat-color": cfg.color,
                            "--cat-glow":  cfg.color + "22",
                          } as React.CSSProperties}
                        >
                          <div className="fl-facility-name">{loc.label}</div>
                          <div className="fl-facility-addr">📍 {loc.address}</div>
                          <a
                            href={`tel:${loc.phone.replace(/[^0-9+]/g, "")}`}
                            className="fl-facility-phone"
                            style={{ color: phoneColor }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            📞 {loc.phone}
                          </a>
                        </div>
                      ))}
                    </div>
                  );
                })}

                {filtered.length === 0 && (
                  <p className="fl-no-results">No facilities match your search.</p>
                )}
              </div>
            </aside>

            {/* MAP */}
            <main className="fl-map-panel">
              <MapContainer
                center={[9.3077, 123.3054]}
                zoom={14}
                style={{ width: "100%", height: "100%", minHeight: "600px" }}
                zoomControl={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />
                <FlyTo target={flyTarget} />
                {filtered.map((loc) => {
                  const cfg = CAT_CONFIG[loc.category];
                  return (
                    <Marker
                      key={loc.id}
                      position={[loc.lat, loc.lng]}
                      icon={createIcon(loc.category)}
                      ref={(r) => { if (r) markersRef.current[loc.id] = r; }}
                      eventHandlers={{ click: () => handleSelect(loc) }}
                    >
                      <Popup>
                        <div style={{ minWidth: "220px", fontFamily: "'DM Sans',sans-serif" }}>
                          <div className="fl-popup-header">
                            <div className="fl-popup-cat" style={{ color: cfg.color }}>
                              {cfg.icon} {cfg.label}
                            </div>
                            <div className="fl-popup-name">{loc.label}</div>
                          </div>
                          <div className="fl-popup-body">
                            <div className="fl-popup-row">
                              <span>📍</span><span>{loc.address}</span>
                            </div>
                            <div className="fl-popup-row">
                              <span>📞</span>
                              <a
                                href={`tel:${loc.phone.replace(/[^0-9+]/g, "")}`}
                                className="fl-popup-phone-link"
                                style={{ color: cfg.color }}
                              >
                                {loc.phone}
                              </a>
                            </div>
                            <button
                              onClick={() => openGoogleMaps(loc.lat, loc.lng)}
                              className="fl-popup-nav-btn"
                              style={{ background: cfg.color }}
                            >
                              🗺️ Navigate Here
                            </button>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>

              {/* Legend */}
              <div className="fl-legend">
                <div className="fl-legend-title">Map Legend</div>
                {CATEGORY_ORDER.map((cat) => {
                  const cfg = CAT_CONFIG[cat];
                  const count = filtered.filter((l) => l.category === cat).length;
                  return (
                    <div key={cat} className="fl-legend-item">
                      <div className="fl-legend-dot" style={{ background: cfg.color }} />
                      <span>{cfg.icon} {cfg.label}</span>
                      <span className="fl-legend-count">{count}</span>
                    </div>
                  );
                })}
              </div>

              {/* Status badge */}
              <div className="fl-map-badge">
                <div className="fl-badge-row">
                  <div className="fl-badge-dot" />
                  <div className="fl-badge-title">Dumaguete Coastal Watch</div>
                </div>
                <div className="fl-badge-sub">
                  Live emergency facility map — active & operational.
                </div>
              </div>
            </main>
          </div>

        </div>
      </div>
    </>
  );
}