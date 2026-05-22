import { useState } from "react";
import { Link } from "react-router-dom";
import directoryBg from "../assets/directorybg.png";

interface PhoneEntry { label: string; number: string; }
interface EmergencyAgency {
  agency: string; label: string; address: string; icon: string; accent: string;
  phones: PhoneEntry[]; facebook?: string; notes?: string;
}
interface Hospital {
  name: string; address: string; icon: string; type: string;
  beds?: string; phones: PhoneEntry[]; notes?: string;
}
interface Barangay { name: string; hotline: string | null; evacuation: string | null; }

const emergency: EmergencyAgency[] = [
  {
    agency: "PNP", label: "Police",
    address: "Camp Leon Kilat, Dumaguete City", icon: "🚔", accent: "#4A90D9",
    phones: [
      { label: "National Hotline", number: "911" },
      { label: "Local Hotline",    number: "116" },
      { label: "CRUZTELCO 1",      number: "(035) 225-1766" },
      { label: "CRUZTELCO 2",      number: "(035) 225-1163" },
      { label: "Globe Mobile",     number: "0917 933 0022" },
      { label: "Smart Mobile",     number: "0929 200 6999" },
      { label: "Globe Landline",   number: "(035) 420-9143" },
    ],
    facebook: "DumagueteCityPoliceStation",
    notes: "Available 24/7 for all police emergencies",
  },
  {
    agency: "BFP", label: "Fire Dept.",
    address: "Real St, Dumaguete City", icon: "🔥", accent: "#e8372a",
    phones: [
      { label: "Emergency",      number: "160" },
      { label: "CRUZTELCO",      number: "(035) 225-3445" },
      { label: "Globe Landline", number: "(035) 422-9672" },
      { label: "Globe Mobile",   number: "0977 198 1900" },
      { label: "Smart Mobile",   number: "0961 199 8377" },
    ],
    facebook: "DUMAGUETECITY FIRESTATION",
    notes: "Fire suppression, rescue & emergency medical response",
  },
  {
    agency: "CDRRMO", label: "City DRRM",
    address: "City Hall Compound, Dumaguete City", icon: "🛡️", accent: "#e8b830",
    phones: [
      { label: "Emergency 348",  number: "348" },
      { label: "Admin Landline", number: "(035) 226-3483" },
      { label: "Operations",     number: "(035) 225-1911" },
      { label: "Globe Mobile",   number: "0936 795 4163" },
    ],
    facebook: "CDRRMO DUMAGUETE",
    notes: "City Disaster Risk Reduction & Management — 24/7 operations",
  },
  {
    agency: "LDRRMO", label: "Local DRRM",
    address: "Dumaguete City (Provincial)", icon: "⛑️", accent: "#00c8e0",
    phones: [
      { label: "Province DRRM", number: "(035) 422-3636" },
      { label: "Rescue 348",    number: "(035) 421-5073" },
    ],
    notes: "Provincial Disaster Risk Reduction & Management Office",
  },
  {
    agency: "ONE Rescue", label: "EMS / Ambulance",
    address: "Oriental Negros Emergency Rescue Foundation, Inc.", icon: "🚑", accent: "#e8b830",
    phones: [
      { label: "CRUZTELCO",      number: "(035) 225-9110" },
      { label: "Globe Landline", number: "(035) 422-9110" },
      { label: "Globe Mobile",   number: "0905 518 6917" },
      { label: "Sun Mobile",     number: "0922 880 8897" },
    ],
    facebook: "Oriental Negros Emergency Rescue Foundation, Inc.",
    notes: "Free pre-hospital emergency medical services across Negros Oriental",
  },
  {
    agency: "Coast Guard", label: "Sea Rescue",
    address: "Dumaguete Boulevard, Dumaguete City", icon: "⚓", accent: "#00c8e0",
    phones: [
      { label: "Station", number: "(035) 422-6541" },
      { label: "Mobile",  number: "0968 771 2455" },
    ],
    notes: "Philippine Coast Guard — marine search & rescue operations",
  },
  {
    agency: "NORECO II", label: "Power / Electric",
    address: "Dumaguete City", icon: "⚡", accent: "#a78bfa",
    phones: [
      { label: "CRUZTELCO",      number: "(035) 225-4830" },
      { label: "Globe Landline", number: "(035) 422-6522" },
      { label: "Globe Mobile",   number: "0917 322 4237" },
    ],
    facebook: "NORECO II",
    notes: "For power outages, downed lines, and electrical emergencies",
  },
  {
    agency: "Metro Water", label: "Water District",
    address: "Dumaguete City", icon: "💧", accent: "#38bdf8",
    phones: [
      { label: "Office",    number: "(035) 422-6951" },
      { label: "Emergency", number: "0998 847 5656" },
    ],
    notes: "Metro Dumaguete Water District — supply interruptions & pipe emergencies",
  },
];

const hospitals: Hospital[] = [
  {
    name: "Silliman University Medical Center (SUMC)",
    address: "V. Aldecoa Sr. Road, Daro, Dumaguete City",
    icon: "🏥", type: "Private — Level III Tertiary", beds: "200+ beds",
    phones: [
      { label: "Main",          number: "(035) 420-2000" },
      { label: "Trunkline",     number: "(035) 225-0841" },
      { label: "ICU",           number: "(035) 225-3563" },
      { label: "EMS Ambulance", number: "0917 107 7415" },
    ],
    notes: "Oldest Protestant hospital in Negros Oriental (est. 1903). Academic teaching hospital.",
  },
  {
    name: "ACE Dumaguete Doctors Hospital",
    address: "Claytown Road (North Road), Dumaguete City",
    icon: "🏥", type: "Private — Tertiary",
    phones: [
      { label: "Trunk",     number: "(035) 523-5957" },
      { label: "Alternate", number: "(035) 225-8000" },
    ],
    notes: "Allied Care Experts hospital offering specialist and emergency services.",
  },
  {
    name: "Holy Child Hospital",
    address: "Bp. Epifanio Surban St., Dumaguete City",
    icon: "🏥", type: "Private — Secondary",
    phones: [
      { label: "Main",        number: "(035) 422-9063" },
      { label: "Alternate",   number: "(035) 225-0510" },
      { label: "Alternate 2", number: "(035) 225-4841" },
      { label: "Mobile",      number: "0995 090 8263" },
    ],
    notes: "Catholic-affiliated hospital run by the Sisters of Mount Carmel.",
  },
  {
    name: "Negros Oriental Provincial Hospital (NOPH)",
    address: "North National Highway, Brgy. Piapi, Dumaguete City",
    icon: "🏥", type: "Government — Level III Referral", beds: "250 beds",
    phones: [
      { label: "Main",        number: "(035) 225-4921" },
      { label: "Alternate",   number: "(035) 225-0949" },
      { label: "Alternate 2", number: "(035) 422-8628" },
    ],
    notes: "Primary government referral hospital for all 22 municipalities of Negros Oriental.",
  },
];

const barangays: Barangay[] = [
  { name: "Bagacay",     hotline: "09652045077",                  evacuation: "Barangay Bagacay Gymnasium" },
  { name: "Bajumpandan", hotline: "09551850601",                  evacuation: "NORSU Main Campus II" },
  { name: "Balugo",      hotline: "09273571566",                  evacuation: "Balugo Elementary School" },
  { name: "Banilad",     hotline: "09197607484",                  evacuation: "Hermenegilda Flores Gloria Memorial High School" },
  { name: "Bantayan",    hotline: "09353261839",                  evacuation: "Barangay Bantayan Health Center" },
  { name: "Batinguel",   hotline: "09054345143",                  evacuation: "Barangay Batinguel Gymnasium" },
  { name: "Buñao",       hotline: "09559268258",                  evacuation: "Buñao Barangay Hall / Magsaysay Memorial Elementary School" },
  { name: "Cadawinonan", hotline: "09363175898 / 09164803784",    evacuation: "Cadawinonan Elementary School" },
  { name: "Calindagan",  hotline: "09457419261",                  evacuation: "Dumaguete City National High School" },
  { name: "Camanjac",    hotline: "(035) 523-6263 / 09350792683", evacuation: "Camanjac Basketball Court" },
  { name: "Candau-ay",   hotline: "09359836121",                  evacuation: "Batinguel Elem. School / Candau-ay Elem. School / Balugo Church / BADC / Sto. Niño Church" },
  { name: "Cantil-e",    hotline: "09550192925",                  evacuation: "Upper Cantil-e Covered Court" },
  { name: "Daro",        hotline: "(035) 422-9761",               evacuation: "Daro Barangay Hall" },
  { name: "Junob",       hotline: "09753422065",                  evacuation: "Northern Junob Basketball Court / Babajuba Basketball Court" },
  { name: "Looc",        hotline: "09362997073",                  evacuation: "Amador Dagudag Elementary School / Piapi Elementary School" },
  { name: "Mangnao",     hotline: "09979156379",                  evacuation: "Mangnao Gymnasium / South City Elementary School" },
  { name: "Motong",      hotline: "09261912007",                  evacuation: "Barangay Motong Covered Court" },
  { name: "Piapi",       hotline: "09165009288",                  evacuation: "Piapi High School and Elementary School" },
  { name: "Poblacion 1", hotline: "09264603953",                  evacuation: "City Central Elementary School" },
  { name: "Poblacion 2", hotline: "09558560795",                  evacuation: "Building 2, Public Market" },
  { name: "Poblacion 3", hotline: null,                           evacuation: null },
  { name: "Poblacion 4", hotline: null,                           evacuation: null },
  { name: "Poblacion 5", hotline: null,                           evacuation: null },
  { name: "Poblacion 6", hotline: null,                           evacuation: null },
  { name: "Poblacion 7", hotline: "09550894159 / 09351386318",    evacuation: "Barangay Hall / West City Elementary School" },
  { name: "Poblacion 8", hotline: "09067729723",                  evacuation: "COSCA / Building 2, Public Market" },
  { name: "Pulantubig",  hotline: "09559268258",                  evacuation: "Magsaysay Memorial Elementary School" },
  { name: "Tabuc-tubig", hotline: "09975941648",                  evacuation: "Tabuc-tubig Barangay Hall" },
  { name: "Taculing",    hotline: null,                           evacuation: null },
  { name: "Talay",       hotline: "09190834553",                  evacuation: "Talay Multi-purpose Evacuation Center" },
  { name: "Tamnag",      hotline: null,                           evacuation: null },
  { name: "Taclobo",     hotline: "(035) 226-3953",               evacuation: "Taclobo National High School" },
];

function cleanPhone(phone: string): string { return phone.replace(/[^0-9+]/g, ""); }

function openMaps(query: string) {
  window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, "_blank");
}

function PhoneLink({ number, className }: { number: string; className: string }) {
  const parts = number.split(/\s*\/\s*/);
  return (
    <>
      {parts.map((part, i) => (
        <span key={i}>
          <a href={`tel:${cleanPhone(part.trim())}`} className={className}>
            {part.trim()}
          </a>
          {i < parts.length - 1 && (
            <span style={{ color: "rgba(168,216,255,0.30)", margin: "0 3px" }}>/</span>
          )}
        </span>
      ))}
    </>
  );
}

export default function Directory() {
  const [bgySearch, setBgySearch] = useState("");

  const filteredBarangays = barangays.filter((bgy) => {
    const q = bgySearch.toLowerCase();
    return (
      bgy.name.toLowerCase().includes(q) ||
      (bgy.hotline?.toLowerCase().includes(q) ?? false) ||
      (bgy.evacuation?.toLowerCase().includes(q) ?? false)
    );
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:       #07101d;
          --surface:  rgba(13,27,46,0.72);
          --surface2: rgba(13,27,46,0.88);
          --input-bg: #060f1c;
          --border:   rgba(168,216,255,0.08);
          --border2:  rgba(168,216,255,0.20);

          /* ── Option E color system ── */
          --text:     #F8FAFC;           /* crisp white — main headings & names */
          --accent:   #A8D8FF;           /* ice blue — accent words & key info */
          --text2:    rgba(168,216,255,0.70);  /* ice blue tint — body copy */
          --text3:    rgba(168,216,255,0.35);  /* ice blue faint — labels & muted */

          --red:      #e8372a;
          --cyan:     #00c8e0;
          --blue:     #4A90D9;
          --radius:   13px;
        }

        .dr {
          min-height: 100vh;
          font-family: 'DM Sans', sans-serif;
          color: var(--text);
          background: var(--bg);
          position: relative;
          overflow-x: hidden;
        }

        .dr-bg { position: fixed; inset: 0; z-index: 0; overflow: hidden; }
        .dr-bg-img {
          width: 100%; height: 100%;
          object-fit: cover; object-position: center; display: block;
          transform-origin: center center;
          animation: bgDrift 30s ease-in-out infinite;
          will-change: transform;
        }
        @keyframes bgDrift {
          0%   { transform: scale(1.08) translate(0px,   0px);   }
          25%  { transform: scale(1.11) translate(-20px, -8px);  }
          50%  { transform: scale(1.10) translate(-10px, -16px); }
          75%  { transform: scale(1.12) translate(10px,  -6px);  }
          100% { transform: scale(1.08) translate(0px,   0px);   }
        }
        .dr-bg-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(
            180deg,
            rgba(7,16,29,0.85) 0%,
            rgba(7,16,29,0.70) 40%,
            rgba(7,16,29,0.88) 80%,
            rgba(7,16,29,0.97) 100%
          );
        }
        .dr-bg-atmosphere {
          position: absolute; inset: 0; pointer-events: none;
          background:
            radial-gradient(ellipse 60% 50% at 10% 0%,   rgba(232,55,42,0.09)  0%, transparent 65%),
            radial-gradient(ellipse 55% 60% at 90% 100%,  rgba(168,216,255,0.06) 0%, transparent 70%),
            radial-gradient(ellipse 40% 40% at 55% 45%,   rgba(13,27,46,0.40)   0%, transparent 60%);
        }
        .dr-bg-grain {
          position: absolute; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
          background-size: 200px; opacity: 0.45; pointer-events: none;
        }

        .dr-wrap {
          position: relative; z-index: 1;
          max-width: 1080px; margin: 0 auto;
          padding: 0 28px 120px;
        }

        .dr-nav {
          display: flex; align-items: center; justify-content: space-between;
          padding: 28px 0 0;
          animation: fadeUp .5s ease both;
        }
        .dr-logo {
          display: flex; align-items: center; gap: 10px; text-decoration: none;
          font-family: 'Syne', sans-serif;
          font-size: 15px; font-weight: 800;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: var(--text);
        }
        .dr-logo-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: var(--red);
          box-shadow: 0 0 12px var(--red), 0 0 24px rgba(232,55,42,0.4);
          animation: breathe 2.4s ease infinite;
        }
        @keyframes breathe {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:.55; transform:scale(.78); }
        }
        .dr-back {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase;
          color: var(--text3); text-decoration: none;
          border: 1px solid rgba(168,216,255,0.12); border-radius: 8px;
          padding: 8px 16px; transition: all .2s;
          background: rgba(13,27,46,0.60); backdrop-filter: blur(18px);
          display: flex; align-items: center; gap: 6px;
        }
        .dr-back:hover { color: var(--accent); border-color: rgba(168,216,255,0.30); }

        /* ── HERO — Option E ── */
        .dr-hero {
          margin-top: 72px; margin-bottom: 52px;
          animation: fadeUp 0.7s 0.1s ease both;
        }
        .dr-hero-eyebrow {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px; font-weight: 500;
          letter-spacing: 0.20em; text-transform: uppercase;
          color: var(--red); margin-bottom: 20px;
          display: flex; align-items: center; gap: 10px;
        }
        .dr-hero-eyebrow::after {
          content: ''; display: block;
          width: 40px; height: 1px; background: var(--red); opacity: 0.5;
        }

        /* White headline */
        .dr-hero h1 {
          font-family: 'Syne', sans-serif;
          font-size: clamp(42px, 6vw, 78px);
          font-weight: 800; line-height: 0.95;
          letter-spacing: -0.03em;
          color: #F8FAFC;            /* crisp white */
          margin-bottom: 24px;
          -webkit-text-stroke: unset;
          text-stroke: unset;
        }
        /* Ice-blue accent words */
        .dr-hero h1 .accent {
          color: #A8D8FF;            /* ice blue */
          -webkit-text-stroke: 0;
          text-stroke: 0;
        }

        .dr-hero-sub {
          font-family: 'DM Sans', sans-serif;
          font-size: 16px; font-weight: 300;
          color: rgba(168,216,255,0.70); /* ice blue tint */
          max-width: 520px; line-height: 1.68;
        }

        .dr-banner {
          position: relative;
          background: rgba(232,55,42,0.10);
          border: 1px solid rgba(232,55,42,0.35);
          border-radius: var(--radius); padding: 16px 20px;
          display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
          margin-bottom: 16px;
          animation: bannerPulse 3s ease-in-out infinite, fadeUp .6s .15s ease both;
          box-shadow: 0 0 22px rgba(232,55,42,0.12);
          backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
        }
        @keyframes bannerPulse {
          0%,100% { box-shadow: 0 0 22px rgba(232,55,42,0.12); }
          50%      { box-shadow: 0 0 38px rgba(232,55,42,0.26); }
        }
        .dr-banner-label {
          font-family: 'Syne', sans-serif;
          font-size: 11px; font-weight: 800;
          letter-spacing: 0.14em; text-transform: uppercase;
          color: #ff8a80; white-space: nowrap;
        }
        .dr-banner-pills { display: flex; gap: 7px; flex-wrap: wrap; }
        .dr-banner-pill {
          display: inline-flex; align-items: center; gap: 5px;
          background: rgba(232,55,42,0.12); border: 1px solid rgba(232,55,42,0.35);
          border-radius: 22px; padding: 7px 14px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px; font-weight: 500;
          color: #F8FAFC; text-decoration: none;
          transition: all .18s; min-height: 40px;
        }
        .dr-banner-pill:hover {
          background: rgba(232,55,42,0.26); border-color: rgba(232,55,42,0.60);
          transform: translateY(-1px);
        }

        .dr-disclaimer {
          display: flex; align-items: flex-start; gap: 10px;
          background: var(--surface); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
          border: 1px solid var(--border); border-radius: 10px;
          padding: 12px 16px; margin-bottom: 48px;
          animation: fadeUp .6s .2s ease both;
        }
        .dr-disclaimer-icon { font-size: 13px; flex-shrink: 0; margin-top: 2px; }
        .dr-disclaimer-text {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px; font-weight: 300;
          color: var(--text2); line-height: 1.65;
        }
        .dr-disclaimer-text strong { color: var(--text); font-weight: 500; }
        .dr-disclaimer-text .red { color: #ff8a80; font-weight: 500; }

        .dr-section { margin-bottom: 56px; animation: fadeUp .55s ease both; scroll-margin-top: 80px; }
        .dr-section:nth-of-type(1) { animation-delay: .08s; }
        .dr-section:nth-of-type(2) { animation-delay: .16s; }
        .dr-section:nth-of-type(3) { animation-delay: .24s; }

        .dr-section-head { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
        .dr-section-icon { font-size: 18px; }
        .dr-section-head h2 {
          font-family: 'Syne', sans-serif;
          font-size: 19px; font-weight: 800;
          letter-spacing: -0.02em; color: #F8FAFC;
        }
        .dr-section-line {
          flex: 1; height: 1px;
          background: linear-gradient(90deg, rgba(168,216,255,0.18), transparent);
        }
        .dr-section-count {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px; font-weight: 500;
          letter-spacing: 0.12em; text-transform: uppercase; color: var(--text3);
        }

        .dr-grid-emergency { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }

        .dr-emerg-card {
          background: var(--surface); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
          border: 1px solid var(--border);
          border-top: 2px solid var(--accent);
          border-radius: var(--radius); padding: 20px 16px 16px;
          position: relative; overflow: hidden;
          transition: transform .22s, border-color .22s, box-shadow .22s;
          display: flex; flex-direction: column;
        }
        .dr-emerg-card::before {
          content: ''; position: absolute; inset: 0;
          background: radial-gradient(ellipse 100% 80% at 0% 0%, var(--accent-dim), transparent 70%);
          opacity: 0; transition: opacity .35s; pointer-events: none;
        }
        .dr-emerg-card:hover {
          transform: translateY(-3px);
          border-color: var(--accent);
          box-shadow: 0 0 20px var(--accent-dim), 0 8px 28px rgba(0,0,0,0.4);
        }
        .dr-emerg-card:hover::before { opacity: 1; }

        .dr-emerg-icon { font-size: 26px; margin-bottom: 10px; position: relative; z-index: 1; }
        .dr-emerg-agency {
          font-family: 'Syne', sans-serif;
          font-size: 20px; font-weight: 800;
          letter-spacing: -0.02em; color: var(--accent);
          line-height: 1; position: relative; z-index: 1;
        }
        .dr-emerg-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px; font-weight: 500;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: var(--text3); margin-top: 3px; margin-bottom: 14px;
          position: relative; z-index: 1;
        }
        .dr-phone-list { display: flex; flex-direction: column; gap: 5px; position: relative; z-index: 1; flex: 1; }
        .dr-phone-row { display: flex; align-items: center; justify-content: space-between; gap: 6px; flex-wrap: wrap; }
        .dr-phone-lbl {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px; font-weight: 500;
          letter-spacing: 0.07em; text-transform: uppercase;
          color: var(--text3); min-width: 80px; flex-shrink: 0;
        }
        .dr-phone-num {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px; font-weight: 500;
          color: var(--text2); text-decoration: none; transition: color .15s;
          display: inline-block; padding: 4px 2px;
        }
        .dr-phone-num:hover { color: var(--accent); }
        .dr-phone-num.mobile { color: #A8D8FF; }
        .dr-phone-num.mobile:hover { color: #F8FAFC; }
        .dr-phone-num.hotline { font-size: 16px; font-weight: 700; color: #ff8a80; }

        .dr-emerg-note {
          font-family: 'DM Sans', sans-serif;
          font-size: 11.5px; font-weight: 300;
          color: var(--text3); line-height: 1.55;
          margin-top: 10px; position: relative; z-index: 1;
        }
        .dr-card-actions { display: flex; gap: 6px; margin-top: 13px; flex-wrap: wrap; position: relative; z-index: 1; }
        .dr-act-btn {
          display: inline-flex; align-items: center; gap: 5px;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px; font-weight: 500;
          letter-spacing: 0.06em; text-transform: uppercase;
          border-radius: 8px; padding: 8px 13px;
          cursor: pointer; border: none; text-decoration: none;
          transition: all .18s; backdrop-filter: blur(8px);
          min-height: 36px;
        }
        .dr-act-btn:hover { transform: translateY(-1px); }
        .dr-act-call {
          background: var(--accent-dim);
          border: 1px solid var(--accent) !important;
          color: var(--accent);
        }
        .dr-act-call:hover { box-shadow: 0 0 14px var(--accent-dim); }
        .dr-act-nav {
          background: var(--surface2); border: 1px solid var(--border) !important;
          color: var(--text3);
        }
        .dr-act-nav:hover { border-color: var(--border2) !important; color: var(--text2); }

        .dr-grid-hospital { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }

        .dr-hosp-card {
          background: var(--surface); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
          border: 1px solid var(--border); border-radius: var(--radius); padding: 20px;
          transition: transform .22s, border-color .22s, box-shadow .22s;
          position: relative; overflow: hidden;
          display: flex; flex-direction: column;
        }
        .dr-hosp-card::after {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, #A8D8FF, transparent);
          opacity: 0; transition: opacity .28s;
        }
        .dr-hosp-card:hover {
          transform: translateY(-3px);
          border-color: rgba(168,216,255,0.28);
          box-shadow: 0 0 18px rgba(168,216,255,0.08), 0 8px 28px rgba(0,0,0,0.4);
        }
        .dr-hosp-card:hover::after { opacity: 1; }

        .dr-hosp-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; margin-bottom: 12px; }
        .dr-hosp-tags { display: flex; gap: 5px; flex-wrap: wrap; }
        .dr-hosp-tag {
          font-family: 'DM Sans', sans-serif;
          font-size: 9px; font-weight: 500;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: #A8D8FF; border: 1px solid rgba(168,216,255,0.25);
          border-radius: 4px; padding: 3px 7px;
        }
        .dr-hosp-tag.gov { color: var(--blue); border-color: rgba(74,144,217,0.25); }
        .dr-hosp-beds {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px; font-weight: 400; color: var(--text3);
          background: rgba(168,216,255,0.04); border: 1px solid var(--border);
          border-radius: 4px; padding: 3px 8px; white-space: nowrap;
        }
        .dr-hosp-name {
          font-family: 'Syne', sans-serif;
          font-size: 15px; font-weight: 700;
          letter-spacing: -0.01em; color: #F8FAFC;
          margin-bottom: 4px; line-height: 1.35;
        }
        .dr-hosp-addr {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px; font-weight: 300;
          color: var(--text3); margin-bottom: 13px; line-height: 1.55;
        }
        .dr-hosp-phones { display: flex; flex-direction: column; gap: 5px; margin-bottom: 12px; }
        .dr-hosp-phone-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .dr-hosp-phone-lbl {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px; font-weight: 500;
          letter-spacing: 0.07em; text-transform: uppercase;
          color: var(--text3); min-width: 68px; flex-shrink: 0;
        }
        .dr-hosp-phone-num {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px; font-weight: 500;
          color: var(--text2); text-decoration: none; transition: color .15s;
          display: inline-block; padding: 4px 2px;
        }
        .dr-hosp-phone-num:hover { color: #A8D8FF; }
        .dr-hosp-phone-num.mobile { color: #A8D8FF; }
        .dr-hosp-phone-num.mobile:hover { color: #F8FAFC; }
        .dr-hosp-note {
          font-family: 'DM Sans', sans-serif;
          font-size: 11.5px; font-weight: 300;
          color: var(--text3); line-height: 1.55; margin-bottom: 13px;
        }
        .dr-hosp-actions { display: flex; gap: 6px; margin-top: auto; flex-wrap: wrap; }

        .dr-bgy-search-wrap { position: relative; margin-bottom: 16px; }
        .dr-bgy-search-icon { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); font-size: 14px; opacity: 0.25; pointer-events: none; }
        .dr-bgy-search-input {
          width: 100%;
          background: var(--input-bg);
          border: 1px solid var(--border);
          border-radius: 9px; padding: 11px 38px 11px 38px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px; font-weight: 400;
          color: #F8FAFC; outline: none; caret-color: #A8D8FF;
          transition: border-color .18s, background .18s;
          backdrop-filter: blur(18px);
        }
        .dr-bgy-search-input::placeholder { color: var(--text3); }
        .dr-bgy-search-input:focus {
          border-color: rgba(168,216,255,0.38);
          background: rgba(168,216,255,0.02);
          box-shadow: 0 0 0 3px rgba(168,216,255,0.06);
        }
        .dr-bgy-search-clear {
          position: absolute; right: 11px; top: 50%; transform: translateY(-50%);
          background: none; border: none; color: var(--text3);
          cursor: pointer; font-size: 20px; line-height: 1; padding: 0;
          transition: color .18s; font-family: 'DM Sans', sans-serif;
        }
        .dr-bgy-search-clear:hover { color: var(--text2); }

        .dr-bgy-stats { display: flex; gap: 8px; margin-bottom: 15px; flex-wrap: wrap; }
        .dr-bgy-stat {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px; font-weight: 400; color: var(--text3);
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 6px; padding: 4px 10px; backdrop-filter: blur(8px);
        }
        .dr-bgy-stat span { color: #A8D8FF; font-weight: 500; }
        .dr-bgy-empty {
          text-align: center; color: var(--text3);
          font-family: 'DM Sans', sans-serif;
          font-size: 14px; font-weight: 300; padding: 48px 0;
        }

        .dr-grid-barangay { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }

        .dr-bgy-card {
          background: var(--surface); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
          border: 1px solid var(--border);
          border-radius: 11px; padding: 14px 13px;
          display: flex; flex-direction: column; gap: 8px;
          transition: transform .2s, border-color .2s, background .2s;
        }
        .dr-bgy-card:hover {
          transform: translateY(-2px);
          border-color: var(--border2);
          background: var(--surface2);
        }
        .dr-bgy-name {
          font-family: 'Syne', sans-serif;
          font-size: 13px; font-weight: 700;
          letter-spacing: -0.01em; color: #F8FAFC;
        }
        .dr-bgy-badges { display: flex; flex-wrap: wrap; gap: 4px; }
        .dr-bgy-badge {
          font-family: 'DM Sans', sans-serif;
          font-size: 8px; font-weight: 500;
          letter-spacing: 0.10em; text-transform: uppercase;
          padding: 2px 6px; border-radius: 3px; white-space: nowrap;
        }
        .dr-bgy-badge-hotline { color: #A8D8FF; background: rgba(168,216,255,0.08); border: 1px solid rgba(168,216,255,0.20); }
        .dr-bgy-badge-evac    { color: var(--blue); background: rgba(74,144,217,0.08); border: 1px solid rgba(74,144,217,0.18); }
        .dr-bgy-badge-tbd     { color: var(--text3); background: rgba(168,216,255,0.02); border: 1px solid var(--border); }

        .dr-bgy-info-row { display: flex; align-items: flex-start; gap: 6px; }
        .dr-bgy-info-icon { font-size: 10px; margin-top: 2px; flex-shrink: 0; opacity: .40; }
        .dr-bgy-phone-link {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px; font-weight: 500;
          color: #A8D8FF; text-decoration: none; transition: color .15s;
          display: inline-block; padding: 3px 1px;
        }
        .dr-bgy-phone-link:hover { color: #F8FAFC; }
        .dr-bgy-info-text {
          font-family: 'DM Sans', sans-serif;
          font-weight: 300; color: var(--text3); line-height: 1.45; font-size: 11px;
        }
        .dr-bgy-nav-btn {
          display: inline-flex; align-items: center; gap: 4px;
          font-family: 'DM Sans', sans-serif;
          font-size: 10px; font-weight: 500;
          letter-spacing: 0.06em; text-transform: uppercase;
          color: var(--text3); background: none; border: none; cursor: pointer; padding: 0;
          transition: color .18s; margin-top: 2px;
        }
        .dr-bgy-nav-btn:hover { color: #A8D8FF; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 760px) {
          .dr-phone-num,
          .dr-hosp-phone-num { padding: 6px 2px; min-height: 36px; line-height: 24px; }
          .dr-bgy-phone-link  { padding: 5px 2px; min-height: 36px; line-height: 26px; }
          .dr-act-btn         { min-height: 40px; padding: 10px 16px; }
          .dr-banner-pill     { min-height: 44px; padding: 10px 16px; }
        }
        @media (max-width: 1024px) {
          .dr-grid-emergency { grid-template-columns: repeat(2, 1fr); }
          .dr-grid-barangay  { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 760px) {
          .dr-wrap          { padding: 0 18px 100px; }
          .dr-hero h1       { font-size: 38px; }
          .dr-grid-hospital { grid-template-columns: 1fr; }
          .dr-grid-barangay { grid-template-columns: repeat(2, 1fr); }
          .dr-banner        { flex-direction: column; align-items: flex-start; gap: 10px; }
        }
        @media (max-width: 520px) {
          .dr-grid-emergency  { grid-template-columns: 1fr; }
          .dr-grid-barangay   { grid-template-columns: 1fr; }
          .dr-hero h1         { font-size: 34px; }
          .dr-hero            { margin-top: 48px; margin-bottom: 36px; }
          .dr-section-head h2 { font-size: 16px; }
        }
      `}</style>

      <div className="dr">
        <div className="dr-bg">
          <img src={directoryBg} alt="" className="dr-bg-img" aria-hidden="true" />
          <div className="dr-bg-overlay" />
          <div className="dr-bg-atmosphere" />
          <div className="dr-bg-grain" />
        </div>

        <div className="dr-wrap">

          {/* Nav */}
          <nav className="dr-nav">
            <Link to="/" className="dr-logo">
              <span className="dr-logo-dot" />
            </Link>
            <Link to="/resources" className="dr-back">← Resources</Link>
          </nav>

          {/* Hero — Option E */}
          <section className="dr-hero">
            <div className="dr-hero-eyebrow">Emergency Directory</div>
            <h1>
              Stay <span className="accent">Connected</span>,<br />
              Stay <span className="accent">Safe</span>
            </h1>
            <p className="dr-hero-sub">
              All critical contacts for Dumaguete City — landlines and mobile numbers
              for emergency services, hospitals, and every barangay hotline in one place.
            </p>
          </section>

          {/* Universal 911 banner */}
          <div className="dr-banner">
            <div className="dr-banner-label">🚨 Universal Emergency</div>
            <div className="dr-banner-pills">
              <a href="tel:911"         className="dr-banner-pill">📞 911 — All Emergencies</a>
              <a href="tel:116"         className="dr-banner-pill">🚔 116 — PNP Police</a>
              <a href="tel:160"         className="dr-banner-pill">🔥 160 — BFP Fire</a>
              <a href="tel:09367954163" className="dr-banner-pill">🛡️ 0936 795 4163 — CDRRMO</a>
              <a href="tel:09055186917" className="dr-banner-pill">🚑 0905 518 6917 — ONE Rescue</a>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="dr-disclaimer">
            <span className="dr-disclaimer-icon">ℹ️</span>
            <p className="dr-disclaimer-text">
              <strong>911, 116, and 160 are free to call from any mobile or landline</strong>{" "}
              in the Philippines — no load required, no charges. Mobile numbers (09xx) and
              landlines (035) may incur standard call rates. When in doubt, dial{" "}
              <span className="red">911</span> first.
            </p>
          </div>

          {/* Emergency Services */}
          <div id="city" className="dr-section">
            <div className="dr-section-head">
              <span className="dr-section-icon">🚨</span>
              <h2>Emergency Services</h2>
              <span className="dr-section-line" />
              <span className="dr-section-count">{emergency.length} agencies</span>
            </div>
            <div className="dr-grid-emergency">
              {emergency.map((item) => (
                <div
                  key={item.agency}
                  className="dr-emerg-card"
                  style={{ "--accent": item.accent, "--accent-dim": `${item.accent}18` } as React.CSSProperties}
                >
                  <div className="dr-emerg-icon">{item.icon}</div>
                  <div className="dr-emerg-agency">{item.agency}</div>
                  <div className="dr-emerg-label">{item.label}</div>
                  <div className="dr-phone-list">
                    {item.phones.map((p, i) => {
                      const isMobile  = p.number.startsWith("09") || p.number.startsWith("+639");
                      const isHotline = /^\d{2,3}$/.test(p.number.trim());
                      return (
                        <div key={i} className="dr-phone-row">
                          <span className="dr-phone-lbl">{p.label}</span>
                          <a
                            href={`tel:${cleanPhone(p.number)}`}
                            className={`dr-phone-num${isMobile ? " mobile" : ""}${isHotline ? " hotline" : ""}`}
                          >
                            {p.number}
                          </a>
                        </div>
                      );
                    })}
                  </div>
                  {item.notes && <p className="dr-emerg-note">{item.notes}</p>}
                  <div className="dr-card-actions">
                    <a href={`tel:${cleanPhone(item.phones[0].number)}`} className="dr-act-btn dr-act-call">
                      📞 Call Now
                    </a>
                    <button className="dr-act-btn dr-act-nav" onClick={() => openMaps(`${item.agency} ${item.address}`)}>
                      📍 Map
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hospitals */}
          <div id="hospitals" className="dr-section">
            <div className="dr-section-head">
              <span className="dr-section-icon">🏥</span>
              <h2>Hospitals &amp; Medical Facilities</h2>
              <span className="dr-section-line" />
              <span className="dr-section-count">{hospitals.length} facilities</span>
            </div>
            <div className="dr-grid-hospital">
              {hospitals.map((h) => {
                const isGov = h.type.includes("Government");
                return (
                  <div key={h.name} className="dr-hosp-card">
                    <div className="dr-hosp-top">
                      <div className="dr-hosp-tags">
                        <span className={`dr-hosp-tag${isGov ? " gov" : ""}`}>
                          {isGov ? "Government" : "Private"}
                        </span>
                        <span className="dr-hosp-tag" style={{ color: "#a78bfa", borderColor: "rgba(167,139,250,0.25)" }}>
                          {h.type.split("—")[1]?.trim() || "Hospital"}
                        </span>
                      </div>
                      {h.beds && <span className="dr-hosp-beds">🛏 {h.beds}</span>}
                    </div>
                    <div className="dr-hosp-name">{h.name}</div>
                    <div className="dr-hosp-addr">📍 {h.address}</div>
                    <div className="dr-hosp-phones">
                      {h.phones.map((p, i) => {
                        const isMobile = p.number.startsWith("09") || p.number.startsWith("+639");
                        return (
                          <div key={i} className="dr-hosp-phone-row">
                            <span className="dr-hosp-phone-lbl">{p.label}</span>
                            <a
                              href={`tel:${cleanPhone(p.number)}`}
                              className={`dr-hosp-phone-num${isMobile ? " mobile" : ""}`}
                            >
                              {p.number}
                            </a>
                          </div>
                        );
                      })}
                    </div>
                    {h.notes && <p className="dr-hosp-note">{h.notes}</p>}
                    <div className="dr-hosp-actions">
                      <a
                        href={`tel:${cleanPhone(h.phones[0].number)}`}
                        className="dr-act-btn dr-act-call"
                        style={{ "--accent": "#A8D8FF", "--accent-dim": "rgba(168,216,255,0.10)" } as React.CSSProperties}
                      >
                        📞 Call
                      </a>
                      <button className="dr-act-btn dr-act-nav" onClick={() => openMaps(`${h.name} Dumaguete`)}>
                        📍 Navigate
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Barangay Contacts */}
          <div id="barangays" className="dr-section">
            <div className="dr-section-head">
              <span className="dr-section-icon">🏘️</span>
              <h2>Barangay Emergency Contacts</h2>
              <span className="dr-section-line" />
              <span className="dr-section-count">{filteredBarangays.length} barangays</span>
            </div>

            <div className="dr-bgy-search-wrap">
              <span className="dr-bgy-search-icon">🔍</span>
              <input
                type="text"
                className="dr-bgy-search-input"
                placeholder="Search barangay, hotline, or evacuation site…"
                value={bgySearch}
                onChange={(e) => setBgySearch(e.target.value)}
                aria-label="Search barangay emergency contacts"
              />
              {bgySearch && (
                <button className="dr-bgy-search-clear" onClick={() => setBgySearch("")} aria-label="Clear search">×</button>
              )}
            </div>

            <div className="dr-bgy-stats">
              <div className="dr-bgy-stat"><span>{barangays.filter((b) => b.hotline).length}</span> with hotlines</div>
              <div className="dr-bgy-stat"><span>{barangays.filter((b) => b.evacuation).length}</span> with evacuation sites</div>
              <div className="dr-bgy-stat"><span>{barangays.filter((b) => !b.hotline && !b.evacuation).length}</span> no direct hotline</div>
            </div>

            {filteredBarangays.length === 0 ? (
              <p className="dr-bgy-empty">No barangay matches your search.</p>
            ) : (
              <div className="dr-grid-barangay">
                {filteredBarangays.map((bgy) => (
                  <div key={bgy.name} className="dr-bgy-card">
                    <div className="dr-bgy-name">{bgy.name}</div>
                    <div className="dr-bgy-badges">
                      {bgy.hotline    && <span className="dr-bgy-badge dr-bgy-badge-hotline">📞 Hotline</span>}
                      {bgy.evacuation && <span className="dr-bgy-badge dr-bgy-badge-evac">🏫 Evacuation</span>}
                      {!bgy.hotline && !bgy.evacuation && <span className="dr-bgy-badge dr-bgy-badge-tbd">No Direct Hotline</span>}
                    </div>
                    {bgy.hotline ? (
                      <div className="dr-bgy-info-row">
                        <span className="dr-bgy-info-icon">📞</span>
                        <PhoneLink number={bgy.hotline} className="dr-bgy-phone-link" />
                      </div>
                    ) : (
                      <div className="dr-bgy-info-row">
                        <span className="dr-bgy-info-icon">⚠️</span>
                        <span className="dr-bgy-info-text">
                          No direct hotline — call{" "}
                          <a href="tel:911" style={{ color: "#ff8a80", fontWeight: 500, textDecoration: "none" }}>911</a>
                          {" "}or CDRRMO{" "}
                          <a href="tel:09367954163" style={{ color: "#A8D8FF", fontWeight: 500, textDecoration: "none" }}>0936 795 4163</a>
                        </span>
                      </div>
                    )}
                    {bgy.evacuation && (
                      <div className="dr-bgy-info-row">
                        <span className="dr-bgy-info-icon">🏫</span>
                        <span className="dr-bgy-info-text">{bgy.evacuation}</span>
                      </div>
                    )}
                    <button className="dr-bgy-nav-btn" onClick={() => openMaps(`${bgy.name} Barangay Dumaguete City`)}>
                      Navigate →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}