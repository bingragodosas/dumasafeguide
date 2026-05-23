// src/citizen/CitizenMap.tsx
// ✅ COMPLETE - Citizen-scoped Map page
// This wraps the public Map component but ensures it's protected by ProtectedRoute
// and displays with the citizen navbar instead of public navbar

import { useEffect, useRef, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import Navbar from "../components/Navbar";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import mapBg from "../assets/mapbg.png";

// ── FIX 1: Leaflet default icon broken by bundlers (Vite/webpack) ──
// Without this, markers show as broken images or don't appear at all.
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

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
  { id: 1,  category: "emergency",  label: "PNP Dumaguete",                    address: "Camp Leon Kilat, Dumaguete City",                phone: "(035) 225-1766",  lat: 9.3100,  lng: 123.3075 },
  { id: 2,  category: "emergency",  label: "BFP Fire Station",                 address: "Real St, Dumaguete City",                       phone: "160",             lat: 9.3083,  lng: 123.3061 },
  { id: 3,  category: "emergency",  label: "CDRRMO",                           address: "City Hall Compound, Dumaguete City",             phone: "0936 795 4163",   lat: 9.3077,  lng: 123.3054 },
  { id: 4,  category: "emergency",  label: "ONE Rescue (EMS)",                 address: "Oriental Negros Emergency Rescue Foundation",    phone: "(035) 225-9110",  lat: 9.3068,  lng: 123.3042 },
  { id: 5,  category: "emergency",  label: "Philippine Coast Guard",           address: "Dumaguete Boulevard, Dumaguete City",            phone: "(035) 422-6541",  lat: 9.3095,  lng: 123.3088 },
  { id: 6,  category: "emergency",  label: "LDRRMO (Provincial)",              address: "Dumaguete City (Provincial)",                    phone: "(035) 422-3636",  lat: 9.3060,  lng: 123.3070 },
  { id: 7,  category: "hospital",   label: "Silliman Univ. Medical Center",    address: "V. Aldecoa Sr. Road, Daro, Dumaguete City",     phone: "(035) 420-2000",  lat: 9.3055,  lng: 123.3028 },
  { id: 8,  category: "hospital",   label: "ACE Dumaguete Doctors Hospital",   address: "Claytown Road (North Road), Dumaguete City",    phone: "(035) 523-5957",  lat: 9.3140,  lng: 123.3090 },
  { id: 9,  category: "hospital",   label: "Holy Child Hospital",              address: "Bp. Epifanio Surban St., Dumaguete City",       phone: "(035) 422-9063",  lat: 9.2990,  lng: 123.3040 },
  { id: 10, category: "hospital",   label: "Negros Oriental Provincial Hosp.", address: "North National Highway, Brgy. Piapi, Dumaguete",phone: "(035) 225-4921",  lat: 9.3180,  lng: 123.3110 },
  { id: 11, category: "evacuation", label: "Bagacay Gymnasium",                address: "Barangay Bagacay, Dumaguete City",               phone: "09652045077",     lat: 9.3020,  lng: 123.3030 },
  { id: 12, category: "evacuation", label: "NORSU Main Campus II",             address: "Barangay Bajumpandan, Dumaguete City",           phone: "09551850601",     lat: 9.3155,  lng: 123.3040 },
  { id: 13, category: "evacuation", label: "Dumaguete City National High",     address: "Barangay Calindagan, Dumaguete City",            phone: "09457419261",     lat: 9.3010,  lng: 123.3055 },
  { id: 14, category: "evacuation", label: "Taclobo National High School",     address: "Barangay Taclobo, Dumaguete City",               phone: "(035) 226-3953",  lat: 9.3130,  lng: 123.3025 },
  { id: 15, category: "evacuation", label: "Talay Multi-purpose Center",       address: "Barangay Talay, Dumaguete City",                 phone: "09190834553",     lat: 9.2970,  lng: 123.3010 },
  { id: 16, category: "evacuation", label: "City Central Elementary School",   address: "Poblacion 1, Dumaguete City",                    phone: "09264603953",     lat: 9.3072,  lng: 123.3058 },
];

const CAT_CONFIG: Record<string, { color: string; bg: string; border: string; icon: string; label: string; glow: string }> = {
  emergency: { color: "#e8372a", bg: "rgba(232,55,42,0.12)",  border: "rgba(232,55,42,0.35)",  icon: "🚨", label: "Emergency Services", glow: "rgba(232,55,42,0.20)"  },
  hospital:  { color: "#4A90D9", bg: "rgba(74,144,217,0.12)", border: "rgba(74,144,217,0.35)", icon: "🏥", label: "Hospitals",          glow: "rgba(74,144,217,0.20)" },
  evacuation:{ color: "#00c8e0", bg: "rgba(0,200,224,0.12)",  border: "rgba(0,200,224,0.35)",  icon: "🏫", label: "Evacuation Centers", glow: "rgba(0,200,224,0.20)"  },
};

const CATEGORY_ORDER: Array<"emergency" | "hospital" | "evacuation"> = ["emergency", "hospital", "evacuation"];

function openGoogleMaps(lat: number, lng: number) {
  window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, "_blank");
}

function FlyTo({ target }: { target: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target, 17, { duration: 1.4, easeLinearity: 0.25 });
  }, [target, map]);
  return null;
}

function createIcon(category: string, isSelected = false) {
  const cfg = CAT_CONFIG[category];
  const size = isSelected ? 44 : 38;
  return L.divIcon({
    className: "",
    html: `<div style="
        width:${size}px;height:${size}px;border-radius:9999px;
        background:${cfg.color};
        display:flex;align-items:center;justify-content:center;
        font-size:${isSelected ? 18 : 15}px;
        border:${isSelected ? "3px" : "2px"} solid #0d1b2e;
        box-shadow:0 2px 16px rgba(0,0,0,0.50),0 0 0 ${isSelected ? "5px" : "3px"} ${cfg.color}55;
        ${isSelected ? "transform:scale(1.1)" : ""}
      ">${cfg.icon}</div>`,
    iconSize:   [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export default function CitizenMap() {
  const [flyTarget, setFlyTarget]     = useState<[number, number] | null>(null);
  const [search, setSearch]           = useState("");
  const [activeFilter, setFilter]     = useState<string | null>(null);
  const [selectedId, setSelectedId]   = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const markerInstancesRef = useRef<Record<number, L.Marker>>({});
  const cardRefs = useRef<Record<number, HTMLDivElement>>({});

  function handleSelect(loc: Location) {
    setSelectedId(loc.id);
    setFlyTarget([loc.lat, loc.lng]);
    setTimeout(() => {
      markerInstancesRef.current[loc.id]?.openPopup();
      cardRefs.current[loc.id]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 1400);
  }

  const filtered = LOCATIONS.filter((loc) => {
    const q = search.toLowerCase();
    return (
      (loc.label.toLowerCase().includes(q) || loc.address.toLowerCase().includes(q)) &&
      (!activeFilter || loc.category === activeFilter)
    );
  });

  const byCategory      = (cat: string) => filtered.filter((l) => l.category === cat);
  const totalByCategory = (cat: string) => LOCATIONS.filter((l) => l.category === cat).length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --page-px: clamp(24px, 6vw, 148px);
          --navbar-h: 64px;
        }

        .fl-root {
          height: calc(100vh - var(--navbar-h));
          font-family: 'DM Sans', sans-serif;
          color: #ddeef8;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
          background: #060f1c;
        }

        .fl-bg { position: fixed; inset: 0; z-index: 0; overflow: hidden; pointer-events: none; }
        .fl-bg-img {
          width: 100%; height: 100%; object-fit: cover; object-position: center;
          animation: bgDrift 40s ease-in-out infinite; will-change: transform;
        }
        .fl-bg-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(180deg, rgba(6,15,28,0.92) 0%, rgba(6,15,28,0.82) 100%);
        }
        @keyframes bgDrift {
          0%,100% { transform: scale(1.06) translate(0,0); }
          33%      { transform: scale(1.09) translate(-12px,-8px); }
          66%      { transform: scale(1.07) translate(10px,-14px); }
        }

        .fl-header {
          position: relative; z-index: 10; flex-shrink: 0;
          padding: 20px var(--page-px) 18px;
          background: rgba(6,15,28,0.85);
          border-bottom: 1px solid rgba(0,200,224,0.10);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          display: flex; align-items: center; gap: 20px;
          animation: slideDown 0.5s ease both;
        }
        @keyframes slideDown {
          from { opacity:0; transform:translateY(-12px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .fl-header-left { flex: 1; min-width: 0; }
        .fl-eyebrow {
          font-size: 10px; font-weight: 500; letter-spacing: 0.22em; text-transform: uppercase;
          color: #e8372a; margin-bottom: 6px;
          display: flex; align-items: center; gap: 8px;
        }
        .fl-eyebrow-line { width: 28px; height: 1px; background: #e8372a; opacity: 0.6; }
        .fl-header h1 {
          font-family: 'Syne', sans-serif;
          font-size: clamp(22px, 3.2vw, 36px);
          font-weight: 800; letter-spacing: -0.025em; line-height: 1;
          color: #F8FAFC;
        }
        .fl-header h1 .accent { color: #A8D8FF; }
        .fl-header-sub {
          font-size: 12px; font-weight: 300;
          color: rgba(168,216,255,0.50); margin-top: 6px; line-height: 1.5;
        }
        .fl-header-stats { display: flex; gap: 8px; flex-shrink: 0; }
        .fl-hstat {
          display: flex; flex-direction: column; align-items: center;
          padding: 9px 16px;
          background: rgba(0,200,224,0.05);
          border: 1px solid rgba(0,200,224,0.12);
          border-radius: 10px; min-width: 64px;
        }
        .fl-hstat-val {
          font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800;
          color: #F8FAFC; line-height: 1;
        }
        .fl-hstat-label {
          font-size: 9px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase;
          color: rgba(168,216,255,0.38); margin-top: 4px; text-align: center;
        }

        .fl-filterbar {
          position: relative; z-index: 10; flex-shrink: 0;
          padding: 10px var(--page-px);
          background: rgba(6,15,28,0.78);
          border-bottom: 1px solid rgba(0,200,224,0.07);
          backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
          display: flex; align-items: center; gap: 7px;
          overflow-x: auto;
          animation: slideDown 0.5s 0.05s ease both;
        }
        .fl-filterbar::-webkit-scrollbar { display: none; }
        .fl-filter-label {
          font-size: 9px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase;
          color: rgba(168,216,255,0.25); flex-shrink: 0; margin-right: 4px;
        }
        .fl-pill {
          display: inline-flex; align-items: center; gap: 5px;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px; font-weight: 500; letter-spacing: 0.04em;
          border-radius: 20px; padding: 6px 14px;
          cursor: pointer; border: none; flex-shrink: 0;
          transition: all 0.18s ease;
          -webkit-tap-highlight-color: transparent;
        }
        .fl-pill:active { transform: scale(0.95); }
        .fl-pill-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

        .fl-stage {
          position: relative; z-index: 1;
          flex: 1;
          display: flex;
          overflow: hidden;
          padding-left: var(--page-px);
          padding-right: var(--page-px);
          animation: fadeIn 0.6s 0.1s ease both;
        }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }

        .fl-sidebar {
          width: 300px;
          flex-shrink: 0;
          display: flex; flex-direction: column;
          background: rgba(8,18,32,0.94);
          border-right: 2px solid rgba(0,200,224,0.18);
          backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
          overflow: hidden;
          z-index: 5;
          transition: transform 0.32s cubic-bezier(0.32,0,0.15,1);
          position: relative;
        }

        .fl-search-wrap {
          padding: 12px 14px;
          border-bottom: 1px solid rgba(0,200,224,0.07);
          flex-shrink: 0; position: relative;
        }
        .fl-search-icon {
          position: absolute; left: 26px; top: 50%; transform: translateY(-50%);
          font-size: 13px; opacity: 0.22; pointer-events: none;
        }
        .fl-search-input {
          width: 100%; background: rgba(6,15,28,0.90);
          border: 1px solid rgba(0,200,224,0.10);
          border-radius: 9px; padding: 9px 12px 9px 32px;
          font-family: 'DM Sans', sans-serif; font-size: 12px; color: #c8e4f4;
          outline: none; caret-color: #00c8e0;
          transition: border-color 0.18s, box-shadow 0.18s;
        }
        .fl-search-input::placeholder { color: rgba(160,200,224,0.16); }
        .fl-search-input:focus {
          border-color: rgba(0,200,224,0.38);
          box-shadow: 0 0 0 3px rgba(0,200,224,0.07);
          background: rgba(0,200,224,0.02);
        }

        .fl-sidebar-meta {
          padding: 7px 14px 6px;
          font-size: 10px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase;
          color: rgba(168,216,255,0.22); flex-shrink: 0;
          border-bottom: 1px solid rgba(0,200,224,0.05);
        }
        .fl-sidebar-meta span { color: rgba(168,216,255,0.52); }

        .fl-list {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 8px 10px 32px;
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
        }
        .fl-list::-webkit-scrollbar { width: 5px; }
        .fl-list::-webkit-scrollbar-track { background: rgba(0,200,224,0.04); border-radius: 4px; }
        .fl-list::-webkit-scrollbar-thumb { background: rgba(0,200,224,0.45); border-radius: 4px; box-shadow: 0 0 6px rgba(0,200,224,0.55); }
        .fl-list::-webkit-scrollbar-thumb:hover { background: rgba(0,200,224,0.72); }

        .fl-sidebar::after {
          content: '';
          position: absolute; bottom: 0; left: 0; right: 0; height: 48px;
          background: linear-gradient(to top, rgba(8,18,32,0.92) 0%, transparent 100%);
          pointer-events: none; z-index: 6;
        }

        .fl-scroll-hint {
          position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%);
          z-index: 7;
          display: flex; flex-direction: column; align-items: center; gap: 2px;
          font-size: 9px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;
          color: rgba(0,200,224,0.70);
          animation: bounceDown 2s ease-in-out infinite;
          pointer-events: none;
        }
        .fl-scroll-hint svg {
          width: 16px; height: 16px; fill: none;
          stroke: rgba(0,200,224,0.80); stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round;
          filter: drop-shadow(0 0 4px rgba(0,200,224,0.60));
        }
        @keyframes bounceDown {
          0%,100% { transform: translateX(-50%) translateY(0); opacity: 0.70; }
          50%      { transform: translateX(-50%) translateY(4px); opacity: 1; }
        }

        .fl-divider {
          width: 3px; flex-shrink: 0;
          background: linear-gradient(to bottom, transparent 0%, rgba(0,200,224,0.55) 15%, rgba(0,200,224,0.80) 50%, rgba(0,200,224,0.55) 85%, transparent 100%);
          box-shadow: 0 0 10px rgba(0,200,224,0.35), 0 0 20px rgba(0,200,224,0.15);
          position: relative; z-index: 4;
        }

        .fl-cat-section { margin-bottom: 2px; }
        .fl-cat-header {
          display: flex; align-items: center; gap: 7px;
          padding: 9px 8px 7px;
          position: sticky; top: 0; z-index: 10;
          background: rgba(8,18,32,0.97); backdrop-filter: blur(10px);
          border-radius: 8px; margin-bottom: 4px;
        }
        .fl-cat-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .fl-cat-title {
          font-family: 'DM Sans', sans-serif;
          font-size: 9px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; flex: 1;
        }
        .fl-cat-badge {
          font-size: 9px; font-weight: 600; color: rgba(160,200,224,0.32);
          background: rgba(0,200,224,0.04); border: 1px solid rgba(0,200,224,0.09);
          border-radius: 4px; padding: 1px 6px;
        }
        .fl-cat-divider { height: 1px; background: rgba(0,200,224,0.05); margin: 8px 2px; }

        .fl-card {
          background: rgba(13,27,46,0.70);
          border: 1px solid rgba(0,200,224,0.06);
          border-left: 3px solid var(--cat-color);
          border-radius: 10px; padding: 11px 13px;
          margin-bottom: 6px; cursor: pointer;
          transition: transform 0.20s ease, box-shadow 0.20s ease, background 0.20s ease, border-color 0.20s ease;
          position: relative; overflow: hidden;
        }
        .fl-card::before {
          content: ''; position: absolute; inset: 0;
          background: radial-gradient(ellipse 80% 60% at 5% 0%, var(--cat-glow), transparent 70%);
          opacity: 0; transition: opacity 0.25s ease;
        }
        .fl-card:hover::before, .fl-card.is-selected::before { opacity: 1; }
        .fl-card:hover, .fl-card.is-selected {
          transform: translateX(3px);
          border-color: var(--cat-color);
          background: rgba(13,27,46,0.95);
          box-shadow: 0 3px 14px rgba(0,0,0,0.30), 0 0 10px var(--cat-glow);
        }
        .fl-card.is-selected { border-left-width: 4px; }
        .fl-card-name {
          font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 700;
          color: #e8f4ff; margin-bottom: 3px; line-height: 1.3; position: relative; z-index: 1;
        }
        .fl-card-addr {
          font-size: 10px; font-weight: 300; color: rgba(160,200,224,0.32);
          margin-bottom: 7px; line-height: 1.4; position: relative; z-index: 1;
        }
        .fl-card-footer {
          display: flex; align-items: center; justify-content: space-between;
          position: relative; z-index: 1;
        }
        .fl-card-phone {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 11px; font-weight: 500; text-decoration: none;
          transition: opacity 0.15s;
        }
        .fl-card-phone:hover { opacity: 0.72; }
        .fl-card-nav-btn {
          font-size: 9px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
          padding: 4px 9px; border-radius: 5px; cursor: pointer;
          background: var(--cat-bg); color: var(--cat-color);
          border: 1px solid var(--cat-border);
          transition: all 0.15s ease; -webkit-tap-highlight-color: transparent;
        }
        .fl-card-nav-btn:hover { background: var(--cat-color); color: #fff; }

        .fl-empty {
          text-align: center; padding: 48px 16px;
          font-size: 12px; font-weight: 300; color: rgba(160,200,224,0.20);
        }
        .fl-empty-icon { font-size: 32px; margin-bottom: 10px; }

        .fl-map-panel {
          flex: 1; position: relative; overflow: hidden;
        }
        .fl-map-panel .leaflet-container {
          width: 100%; height: 100%; background: #0d1b2e;
        }

        .leaflet-popup-content-wrapper {
          background: #ffffff !important; border: none !important;
          border-radius: 14px !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.10) !important;
          padding: 0 !important; overflow: hidden; color: #1a1a2e !important;
        }
        .leaflet-popup-content { margin: 0 !important; width: auto !important; }
        .leaflet-popup-tip { background: #ffffff !important; box-shadow: none !important; }
        .leaflet-popup-close-button {
          color: #9ca3af !important; font-size: 18px !important;
          top: 10px !important; right: 12px !important; z-index: 10;
          width: 24px !important; height: 24px !important;
          line-height: 24px !important; text-align: center !important;
        }
        .leaflet-popup-close-button:hover { color: #374151 !important; }
        .fl-popup-head { padding: 14px 16px 10px; border-bottom: 1px solid #f3f4f6; }
        .fl-popup-cat {
          font-size: 9px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase;
          margin-bottom: 4px; display: flex; align-items: center; gap: 5px;
        }
        .fl-popup-name { font-family:'Syne',sans-serif; font-size:14px; font-weight:700; color:#111827; line-height:1.3; }
        .fl-popup-body { padding: 10px 16px 14px; }
        .fl-popup-row {
          display: flex; align-items: flex-start; gap: 6px;
          font-size: 12px; color: #6b7280; margin-bottom: 5px; line-height: 1.45;
        }
        .fl-popup-phone { font-size:13px; font-weight:500; text-decoration:none; transition:opacity 0.15s; }
        .fl-popup-phone:hover { opacity: 0.75; }
        .fl-popup-btn {
          width: 100%; margin-top: 10px;
          font-family:'DM Sans',sans-serif; font-size:11px; font-weight:600;
          letter-spacing:0.08em; text-transform:uppercase;
          border-radius:8px; padding:10px; cursor:pointer; border:none; color:#fff;
          display:flex; align-items:center; justify-content:center; gap:6px;
          transition: opacity 0.18s, transform 0.18s;
        }
        .fl-popup-btn:hover { opacity:0.88; transform:translateY(-1px); }

        .fl-map-legend {
          position: absolute; top: 14px; right: 14px; z-index: 400;
          background: rgba(255,255,255,0.97);
          border: 1px solid rgba(0,0,0,0.07); border-radius: 12px;
          padding: 12px 14px; box-shadow: 0 4px 18px rgba(0,0,0,0.13); min-width: 170px;
        }
        .fl-legend-title {
          font-size: 8px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase;
          color: #9ca3af; margin-bottom: 9px;
        }
        .fl-legend-row {
          display: flex; align-items: center; gap: 7px;
          font-size: 11px; font-weight: 500; color: #374151; margin-bottom: 6px;
        }
        .fl-legend-row:last-child { margin-bottom: 0; }
        .fl-legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
        .fl-legend-n {
          margin-left: auto; font-size: 9px; color: #9ca3af;
          background: #f3f4f6; border-radius: 4px; padding: 1px 5px;
        }
        .fl-live-badge {
          position: absolute; bottom: 18px; left: 18px; z-index: 400;
          background: rgba(255,255,255,0.97); border: 1px solid rgba(0,0,0,0.07);
          border-radius: 12px; padding: 10px 14px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.12); max-width: 220px;
        }
        .fl-live-row { display: flex; align-items: center; gap: 7px; margin-bottom: 3px; }
        .fl-live-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #e8372a; flex-shrink: 0;
          animation: livePulse 2.2s ease-in-out infinite;
        }
        @keyframes livePulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(232,55,42,0.5); }
          50%      { box-shadow: 0 0 0 4px rgba(232,55,42,0); }
        }
        .fl-live-title { font-family:'Syne',sans-serif; font-size:11px; font-weight:700; color:#111827; }
        .fl-live-sub { font-size:10px; color:#6b7280; line-height:1.4; }

        .fl-sidebar-toggle {
          display: none;
          position: absolute; bottom: 72px; left: 14px; z-index: 600;
          background: #0d1b2e; border: 1px solid rgba(0,200,224,0.28);
          border-radius: 50%; width: 46px; height: 46px;
          align-items: center; justify-content: center;
          cursor: pointer; font-size: 18px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.40); color: #00c8e0;
          transition: transform 0.2s, box-shadow 0.2s;
          -webkit-tap-highlight-color: transparent;
        }
        .fl-sidebar-toggle:hover { transform: scale(1.08); }

        @media (max-width: 900px) {
          :root { --page-px: 24px; }
          .fl-stage { padding-left: 0; padding-right: 0; }
          .fl-sidebar {
            position: absolute; top: 0; left: 0; bottom: 0;
            width: 84%; max-width: 300px;
            transform: translateX(-105%);
            box-shadow: 4px 0 32px rgba(0,0,0,0.55); z-index: 500;
          }
          .fl-sidebar.is-open { transform: translateX(0); }
          .fl-divider { display: none; }
          .fl-sidebar-toggle { display: flex; }
          .fl-map-panel { width: 100%; }
          .fl-live-badge { max-width: 180px; bottom: 14px; left: 70px; }
          .fl-map-legend { top: 10px; right: 10px; min-width: 150px; }
        }
        @media (max-width: 480px) {
          :root { --navbar-h: 56px; }
          .fl-header { padding: 12px 16px 10px; gap: 10px; }
          .fl-header h1 { font-size: 18px; }
          .fl-header-sub { display: none; }
          .fl-hstat { padding: 6px 8px; min-width: 46px; }
          .fl-hstat-val { font-size: 15px; }
          .fl-filterbar { padding: 8px 16px; gap: 5px; }
          .fl-pill { font-size: 10px; padding: 5px 9px; }
          .fl-map-legend { display: none; }
          .fl-live-badge { bottom: 10px; left: 66px; padding: 7px 11px; max-width: 160px; }
          .fl-live-title { font-size: 10px; }
          .fl-live-sub { font-size: 9px; }
          .fl-sidebar { width: 90%; }
        }
        @media (max-width: 360px) {
          .fl-header h1 { font-size: 16px; }
          .fl-hstat-val { font-size: 13px; }
          .fl-hstat { min-width: 40px; padding: 5px 6px; }
        }

        .fl-drawer-backdrop {
          display: none; position: absolute; inset: 0; z-index: 499;
          background: rgba(0,0,0,0.52); backdrop-filter: blur(2px);
          -webkit-tap-highlight-color: transparent;
        }
        .fl-drawer-backdrop.is-open { display: block; }
      `}</style>

      <Navbar />

      <div className="fl-root">
        <div className="fl-bg">
          <img src={mapBg} alt="" className="fl-bg-img" aria-hidden="true" />
          <div className="fl-bg-overlay" />
        </div>

        {/* ── HEADER ── */}
        <header className="fl-header">
          <div className="fl-header-left">
            <div className="fl-eyebrow">
              <span className="fl-eyebrow-line" />
              Facility Locator
            </div>
            <h1>Find Help <span className="accent">Near You</span></h1>
            <p className="fl-header-sub">Emergency services, hospitals &amp; evacuation centers across Dumaguete City</p>
          </div>
          <div className="fl-header-stats">
            {CATEGORY_ORDER.map((cat) => (
              <div className="fl-hstat" key={cat}>
                <div className="fl-hstat-val">{totalByCategory(cat)}</div>
                <div className="fl-hstat-label">{CAT_CONFIG[cat].icon}</div>
              </div>
            ))}
            <div className="fl-hstat">
              <div className="fl-hstat-val">{LOCATIONS.length}</div>
              <div className="fl-hstat-label">Total</div>
            </div>
          </div>
        </header>

        {/* ── FILTER BAR ── */}
        <div className="fl-filterbar">
          <span className="fl-filter-label">Filter</span>
          <button
            className="fl-pill"
            onClick={() => setFilter(null)}
            style={{
              background: !activeFilter ? "rgba(0,200,224,0.10)" : "rgba(0,200,224,0.03)",
              border: `1px solid ${!activeFilter ? "rgba(0,200,224,0.38)" : "rgba(0,200,224,0.09)"}`,
              color: !activeFilter ? "#00c8e0" : "rgba(160,200,224,0.38)",
            }}
          >All ({LOCATIONS.length})</button>
          {CATEGORY_ORDER.map((cat) => {
            const cfg = CAT_CONFIG[cat];
            const active = activeFilter === cat;
            return (
              <button key={cat} className="fl-pill"
                onClick={() => setFilter(active ? null : cat)}
                style={{
                  background: active ? cfg.bg : "rgba(0,200,224,0.03)",
                  border: `1px solid ${active ? cfg.border : "rgba(0,200,224,0.09)"}`,
                  color: active ? cfg.color : "rgba(160,200,224,0.40)",
                  boxShadow: active ? `0 0 12px ${cfg.glow}` : "none",
                }}
              >
                <span className="fl-pill-dot" style={{ background: cfg.color }} />
                {cfg.icon} {cfg.label}
              </button>
            );
          })}
        </div>

        {/* ── MAIN STAGE ── */}
        <div className="fl-stage">
          <div className={`fl-drawer-backdrop ${sidebarOpen ? "is-open" : ""}`} onClick={() => setSidebarOpen(false)} />

          {/* ── SIDEBAR ── */}
          <aside className={`fl-sidebar ${sidebarOpen ? "is-open" : ""}`}>
            <div className="fl-search-wrap">
              <span className="fl-search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search facilities or addresses…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="fl-search-input"
              />
            </div>
            <div className="fl-sidebar-meta">
              Showing <span>{filtered.length}</span> of {LOCATIONS.length} facilities
            </div>

            <div className="fl-list">
              {CATEGORY_ORDER.map((cat, idx) => {
                const cfg = CAT_CONFIG[cat];
                const items = byCategory(cat);
                if (items.length === 0) return null;
                const phoneColor = cat === "emergency" ? "#ff8a80" : cat === "hospital" ? "#93c4ef" : "#7ce8f5";
                return (
                  <div key={cat} className="fl-cat-section">
                    {idx > 0 && <div className="fl-cat-divider" />}
                    <div className="fl-cat-header">
                      <div className="fl-cat-dot" style={{ background: cfg.color }} />
                      <span className="fl-cat-title" style={{ color: cfg.color }}>{cfg.icon} {cfg.label}</span>
                      <span className="fl-cat-badge">{items.length}</span>
                    </div>
                    {items.map((loc) => (
                      <div
                        key={loc.id}
                        ref={(el) => { if (el) cardRefs.current[loc.id] = el; }}
                        onClick={() => { handleSelect(loc); setSidebarOpen(false); }}
                        className={`fl-card ${selectedId === loc.id ? "is-selected" : ""}`}
                        style={{ "--cat-color": cfg.color, "--cat-glow": cfg.glow, "--cat-bg": cfg.bg, "--cat-border": cfg.border } as React.CSSProperties}
                      >
                        <div className="fl-card-name">{loc.label}</div>
                        <div className="fl-card-addr">📍 {loc.address}</div>
                        <div className="fl-card-footer">
                          <a
                            href={`tel:${loc.phone.replace(/[^0-9+]/g, "")}`}
                            className="fl-card-phone"
                            style={{ color: phoneColor }}
                            onClick={(e) => e.stopPropagation()}
                          >📞 {loc.phone}</a>
                          <button
                            className="fl-card-nav-btn"
                            onClick={(e) => { e.stopPropagation(); openGoogleMaps(loc.lat, loc.lng); }}
                          >Navigate →</button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className="fl-empty">
                  <div className="fl-empty-icon">🔍</div>
                  No facilities match your search.
                </div>
              )}
            </div>

            <div className="fl-scroll-hint">
              <svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
              scroll
            </div>
          </aside>

          {/* ── GLOWING DIVIDER ── */}
          <div className="fl-divider" />

          {/* ── MAP PANEL ── */}
          <main className="fl-map-panel">
            <MapContainer
              center={[9.3077, 123.3054]}
              zoom={14}
              style={{ width: "100%", height: "100%" }}
              zoomControl={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              />
              <FlyTo target={flyTarget} />

              {filtered.map((loc) => {
                const cfg = CAT_CONFIG[loc.category];
                return (
                  <Marker
                    key={loc.id}
                    position={[loc.lat, loc.lng]}
                    icon={createIcon(loc.category, selectedId === loc.id)}
                    eventHandlers={{
                      add: (e) => { markerInstancesRef.current[loc.id] = e.target as L.Marker; },
                      click: () => handleSelect(loc),
                    }}
                  >
                    <Popup minWidth={230} maxWidth={280}>
                      <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        <div className="fl-popup-head">
                          <div className="fl-popup-cat" style={{ color: cfg.color }}>{cfg.icon} {cfg.label}</div>
                          <div className="fl-popup-name">{loc.label}</div>
                        </div>
                        <div className="fl-popup-body">
                          <div className="fl-popup-row"><span>📍</span><span>{loc.address}</span></div>
                          <div className="fl-popup-row">
                            <span>📞</span>
                            <a href={`tel:${loc.phone.replace(/[^0-9+]/g, "")}`} className="fl-popup-phone" style={{ color: cfg.color }}>{loc.phone}</a>
                          </div>
                          <button onClick={() => openGoogleMaps(loc.lat, loc.lng)} className="fl-popup-btn" style={{ background: cfg.color }}>
                            🗺️ Get Directions
                          </button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>

            <div className="fl-map-legend">
              <div className="fl-legend-title">Map Legend</div>
              {CATEGORY_ORDER.map((cat) => {
                const cfg = CAT_CONFIG[cat];
                const count = filtered.filter((l) => l.category === cat).length;
                return (
                  <div key={cat} className="fl-legend-row">
                    <div className="fl-legend-dot" style={{ background: cfg.color }} />
                    <span>{cfg.icon} {cfg.label}</span>
                    <span className="fl-legend-n">{count}</span>
                  </div>
                );
              })}
            </div>

            <div className="fl-live-badge">
              <div className="fl-live-row">
                <div className="fl-live-dot" />
                <div className="fl-live-title">Dumaguete Coastal Watch</div>
              </div>
              <div className="fl-live-sub">Live map — all {LOCATIONS.length} facilities active</div>
            </div>

            <button
              className="fl-sidebar-toggle"
              onClick={() => setSidebarOpen((v) => !v)}
              aria-label="Toggle facility list"
            >{sidebarOpen ? "✕" : "☰"}</button>
          </main>
        </div>
      </div>
    </>
  );
}
