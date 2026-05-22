import { useEffect, useState } from "react";
import { supabase } from "../js/supabase";
import {
  FaBell,
  FaUserShield,
  FaUsers,
  FaBroadcastTower,
  FaExclamationTriangle,
  FaCheckCircle,
  FaInfoCircle,
  FaFire,
  FaWater,
  FaMedkit,
  FaShieldAlt,
  FaClipboardList,
  FaMountain,
  FaCar,
  FaQuestionCircle,
  FaGlobeAsia,
  FaWind,
  FaTrash,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";

// ─── Types ────────────────────────────────────────────────────────────────────
interface AlertTemplate {
  id: string;
  label: string;
  message: string;
  audience: "responder" | "citizen" | "all";
  severity: "info" | "warning" | "critical";
  icon: JSX.Element;
}

// ─── Templates ────────────────────────────────────────────────────────────────
const TEMPLATES: AlertTemplate[] = [
  {
    id: "all-typhoon",
    label: "Typhoon Advisory",
    message:
      "🌀 TYPHOON ADVISORY: Signal No. raised for Dumaguete City area. Citizens: secure your homes and prepare emergency kits. Avoid going outside. Responders: report to command center for deployment briefing.",
    audience: "all",
    severity: "critical",
    icon: <FaWind />,
  },
  {
    id: "all-flood",
    label: "Flood Warning",
    message:
      "🌊 FLOOD WARNING: Rising water levels have been detected in low-lying areas of the barangay. All residents near waterways must evacuate immediately to higher ground. Avoid crossing flooded roads. Responders deploy to affected zones.",
    audience: "all",
    severity: "critical",
    icon: <FaWater />,
  },
  {
    id: "all-fire",
    label: "Fire Incident Alert",
    message:
      "🔥 FIRE ALERT: An active fire incident is currently being responded to in the barangay. Citizens in the vicinity: stay indoors, close windows, and avoid the area. BFP and responders are on scene.",
    audience: "all",
    severity: "critical",
    icon: <FaFire />,
  },
  {
    id: "all-earthquake",
    label: "Earthquake Advisory",
    message:
      "⚠ EARTHQUAKE ADVISORY: A seismic event has been detected. Citizens: check for structural damage, stay away from damaged buildings, and do not use elevators. Watch for aftershocks. Responders: conduct damage assessment immediately.",
    audience: "all",
    severity: "critical",
    icon: <FaGlobeAsia />,
  },
  {
    id: "all-landslide",
    label: "Landslide Warning",
    message:
      "⛰ LANDSLIDE WARNING: Risk of landslides in hilly and mountainous areas due to heavy rainfall. Residents in elevated or slope-adjacent areas must evacuate to safe zones immediately. Avoid roads near hillsides.",
    audience: "all",
    severity: "critical",
    icon: <FaMountain />,
  },
  {
    id: "all-roadaccident",
    label: "Road Accident Alert",
    message:
      "🚗 ROAD ACCIDENT ALERT: A major road accident has been reported. Emergency responders are on scene. Citizens: avoid the affected road and follow alternate routes. Clear the way for emergency vehicles.",
    audience: "all",
    severity: "warning",
    icon: <FaCar />,
  },
  {
    id: "all-others",
    label: "General Emergency",
    message:
      "⚠ EMERGENCY NOTICE: An emergency situation has been reported in your area. Please remain calm, stay indoors, and follow instructions from barangay officials and emergency responders. Further updates to follow.",
    audience: "all",
    severity: "warning",
    icon: <FaQuestionCircle />,
  },
  {
    id: "rsp-deploy",
    label: "Deploy to Scene",
    message:
      "ALL RESPONDERS: An incident has been reported. Please deploy to the designated location immediately and await further instructions from the command center.",
    audience: "responder",
    severity: "critical",
    icon: <FaUserShield />,
  },
  {
    id: "rsp-standby",
    label: "Standby Alert",
    message:
      "RESPONDERS: Please remain on standby. A potential emergency situation is developing. Check your equipment and await deployment orders.",
    audience: "responder",
    severity: "warning",
    icon: <FaShieldAlt />,
  },
  {
    id: "rsp-debrief",
    label: "Post-Incident Debrief",
    message:
      "RESPONDERS: Incident has been resolved. Please return to base and submit your incident report within 24 hours. A debrief session will be scheduled.",
    audience: "responder",
    severity: "info",
    icon: <FaClipboardList />,
  },
  {
    id: "rsp-shift",
    label: "Shift Change Notice",
    message:
      "RESPONDERS: Duty shift change in 30 minutes. On-duty team, please prepare handover notes. Incoming team, report to command center for briefing.",
    audience: "responder",
    severity: "info",
    icon: <FaUserShield />,
  },
  {
    id: "cit-evacuate",
    label: "Evacuation Order",
    message:
      "⚠ EVACUATION NOTICE: Residents in affected areas are advised to evacuate immediately. Proceed to the nearest designated evacuation center. Bring essential documents and supplies.",
    audience: "citizen",
    severity: "critical",
    icon: <FaExclamationTriangle />,
  },
  {
    id: "cit-medical",
    label: "Medical Emergency",
    message:
      "🚑 MEDICAL ADVISORY: Emergency medical services are responding to an incident nearby. Please clear the road for emergency vehicles and avoid the affected area.",
    audience: "citizen",
    severity: "warning",
    icon: <FaMedkit />,
  },
  {
    id: "cit-allclear",
    label: "All Clear Notice",
    message:
      "✅ ALL CLEAR: The situation has been resolved. Residents may resume normal activities. Thank you for your cooperation and patience during this emergency.",
    audience: "citizen",
    severity: "info",
    icon: <FaCheckCircle />,
  },
  {
    id: "cit-update",
    label: "Situation Update",
    message:
      "ℹ SITUATION UPDATE: Emergency responders are actively managing the ongoing incident. Please remain calm, stay indoors, and monitor official channels for further updates.",
    audience: "citizen",
    severity: "info",
    icon: <FaInfoCircle />,
  },
  {
    id: "all-drill",
    label: "Emergency Drill",
    message:
      "📢 EMERGENCY DRILL NOTICE: A city-wide emergency response drill will be conducted. This is only a test. Responders please follow drill protocols. Citizens, no action required.",
    audience: "all",
    severity: "info",
    icon: <FaBroadcastTower />,
  },
];

// ─── Styles ───────────────────────────────────────────────────────────────────
const AL_STYLE = `
  .al-root {
    font-family: 'IBM Plex Sans', sans-serif;
    color: #edf0fa;
    width: 100%;
    min-width: 0;
  }

  /* ── Header ── */
  .al-header {
    display: flex; align-items: flex-end;
    justify-content: space-between; flex-wrap: wrap;
    gap: 14px; margin-bottom: 22px;
  }
  .al-eyebrow {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10px; font-weight: 700; letter-spacing: .18em;
    text-transform: uppercase; color: rgba(237,240,250,.28); margin-bottom: 4px;
  }
  .al-title {
    font-family: 'Syne', sans-serif;
    font-size: 22px; font-weight: 800; color: #f0f2f8;
    letter-spacing: -.02em; margin: 0 0 3px;
  }
  .al-subtitle { font-size: 12.5px; color: rgba(237,240,250,.35); margin: 0; }

  /* ── Main layout: side-by-side on desktop, stacked on mobile ── */
  .al-layout {
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: 16px;
    align-items: start;
    width: 100%;
    min-width: 0;
  }

  /* ── Left column ── */
  .al-left { display: flex; flex-direction: column; gap: 16px; min-width: 0; }

  /* ── Compose card ── */
  .al-compose {
    background: rgba(255,255,255,.03);
    border: 1px solid rgba(255,255,255,.08);
    border-radius: 14px; padding: 20px;
    min-width: 0;
  }
  .al-compose-title {
    font-family: 'Syne', sans-serif;
    font-size: 14px; font-weight: 800; color: #f0f2f8;
    margin: 0 0 18px; display: flex; align-items: center; gap: 8px;
  }

  /* ── Audience ── */
  .al-audience-group { display: flex; gap: 6px; margin-bottom: 16px; flex-wrap: wrap; }
  .al-audience-btn {
    display: flex; align-items: center; gap: 7px;
    padding: 7px 14px; border-radius: 8px; border: 1px solid;
    font-family: 'IBM Plex Sans', sans-serif;
    font-size: 12px; font-weight: 600; cursor: pointer;
    transition: all .17s; background: transparent;
    white-space: nowrap;
  }
  .al-audience-btn--responder { border-color: rgba(123,158,255,.2); color: rgba(123,158,255,.55); }
  .al-audience-btn--responder.active { background: rgba(123,158,255,.12); border-color: rgba(123,158,255,.4); color: #7B9EFF; }
  .al-audience-btn--citizen { border-color: rgba(46,204,143,.2); color: rgba(46,204,143,.55); }
  .al-audience-btn--citizen.active { background: rgba(46,204,143,.12); border-color: rgba(46,204,143,.4); color: #2ECC8F; }
  .al-audience-btn--all { border-color: rgba(251,146,60,.2); color: rgba(251,146,60,.55); }
  .al-audience-btn--all.active { background: rgba(251,146,60,.12); border-color: rgba(251,146,60,.4); color: #FB923C; }

  /* ── Severity ── */
  .al-severity-group { display: flex; gap: 6px; margin-bottom: 16px; }
  .al-severity-btn {
    flex: 1; padding: 8px 10px; border-radius: 7px; border: 1px solid;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px; font-weight: 700; text-transform: uppercase;
    letter-spacing: .06em; cursor: pointer; transition: all .17s;
    background: transparent; text-align: center;
  }
  .al-severity-btn--info    { border-color: rgba(123,158,255,.2); color: rgba(123,158,255,.5); }
  .al-severity-btn--info.active { background: rgba(123,158,255,.1); border-color: rgba(123,158,255,.45); color: #7B9EFF; }
  .al-severity-btn--warning { border-color: rgba(255,209,102,.2); color: rgba(255,209,102,.5); }
  .al-severity-btn--warning.active { background: rgba(255,209,102,.1); border-color: rgba(255,209,102,.45); color: #FFD166; }
  .al-severity-btn--critical { border-color: rgba(230,57,70,.2); color: rgba(230,57,70,.5); }
  .al-severity-btn--critical.active { background: rgba(230,57,70,.1); border-color: rgba(230,57,70,.45); color: #e63946; }

  /* ── Fields ── */
  .al-field { margin-bottom: 14px; }
  .al-field:last-of-type { margin-bottom: 0; }
  .al-label {
    display: block; font-size: 10px; font-weight: 700;
    letter-spacing: .12em; text-transform: uppercase;
    color: rgba(237,240,250,.3); margin-bottom: 7px;
    font-family: 'IBM Plex Mono', monospace;
  }
  .al-input {
    width: 100%; padding: 10px 13px;
    background: rgba(255,255,255,.05);
    border: 1px solid rgba(255,255,255,.1);
    border-radius: 8px;
    font-family: 'IBM Plex Sans', sans-serif;
    font-size: 13px; color: #edf0fa;
    outline: none; transition: border-color .17s;
    box-sizing: border-box;
  }
  .al-input::placeholder { color: rgba(237,240,250,.22); }
  .al-input:focus { border-color: rgba(251,146,60,.5); }
  .al-textarea {
    width: 100%; padding: 11px 13px;
    background: rgba(255,255,255,.05);
    border: 1px solid rgba(255,255,255,.1);
    border-radius: 8px; resize: vertical;
    min-height: 100px; max-height: 220px;
    font-family: 'IBM Plex Sans', sans-serif;
    font-size: 13px; color: #edf0fa;
    outline: none; line-height: 1.6;
    transition: border-color .17s;
    box-sizing: border-box;
  }
  .al-textarea::placeholder { color: rgba(237,240,250,.22); }
  .al-textarea:focus { border-color: rgba(251,146,60,.5); }
  .al-charcount {
    font-size: 10.5px; font-family: 'IBM Plex Mono', monospace;
    color: rgba(237,240,250,.28); margin-top: 5px; text-align: right;
  }

  /* ── Send button ── */
  .al-send-btn {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    width: 100%; padding: 12px;
    background: linear-gradient(135deg, #e63946, #ff5d73);
    border: none; border-radius: 9px;
    font-family: 'Syne', sans-serif;
    font-size: 13px; font-weight: 700; letter-spacing: .04em;
    color: #fff; cursor: pointer;
    transition: all .18s;
    box-shadow: 0 4px 14px rgba(230,57,70,.3);
    margin-top: 16px;
  }
  .al-send-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(230,57,70,.4); }
  .al-send-btn:disabled { opacity: .5; cursor: not-allowed; }

  /* ── Toast ── */
  .al-toast {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 14px; border-radius: 9px; margin-top: 12px;
    background: rgba(46,204,143,.1); border: 1px solid rgba(46,204,143,.25);
    font-size: 12.5px; color: #2ECC8F;
    animation: alFadeIn .3s ease;
  }
  @keyframes alFadeIn { from { opacity:0; transform:translateY(4px); } to { opacity:1; } }

  /* ── Error banner ── */
  .al-error-banner {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 14px; border-radius: 9px; margin-bottom: 14px;
    background: rgba(230,57,70,.1); border: 1px solid rgba(230,57,70,.3);
    font-size: 12.5px; color: #e63946;
  }

  /* ── Recent alerts log ── */
  .al-log-title {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10px; font-weight: 700; letter-spacing: .14em;
    text-transform: uppercase; color: rgba(237,240,250,.25);
    margin-bottom: 10px;
  }
  .al-log-list {
    background: rgba(255,255,255,.025);
    border: 1px solid rgba(255,255,255,.07);
    border-radius: 12px; overflow: hidden;
  }
  .al-log-row {
    display: flex; align-items: flex-start; gap: 12px;
    padding: 13px 16px;
    border-bottom: 1px solid rgba(255,255,255,.04);
    transition: background .15s; position: relative;
  }
  .al-log-row:last-child { border-bottom: none; }
  .al-log-row:hover { background: rgba(255,255,255,.02); }
  .al-log-dot {
    width: 8px; height: 8px; border-radius: 50%;
    flex-shrink: 0; margin-top: 4px;
  }
  .al-log-content { flex: 1; min-width: 0; }
  .al-log-title-text {
    font-size: 13px; font-weight: 600;
    color: rgba(237,240,250,.85);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    margin-bottom: 2px;
  }
  .al-log-msg {
    font-size: 11.5px; color: rgba(237,240,250,.4);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    margin-bottom: 4px;
  }
  .al-log-meta {
    display: flex; align-items: center; flex-wrap: wrap;
    gap: 6px; font-size: 10.5px; color: rgba(237,240,250,.28);
    font-family: 'IBM Plex Mono', monospace;
  }
  .al-log-empty {
    padding: 28px; text-align: center;
    font-size: 12.5px; color: rgba(237,240,250,.2);
  }
  .al-log-delete {
    flex-shrink: 0;
    background: rgba(230,57,70,.08);
    border: 1px solid rgba(230,57,70,.2);
    border-radius: 6px; color: #e63946; cursor: pointer;
    padding: 5px 8px; font-size: 11px;
    display: flex; align-items: center;
    transition: background .15s; align-self: center;
  }
  .al-log-delete:hover { background: rgba(230,57,70,.18); }

  /* ── Severity / audience tags shared ── */
  .al-tpl-sev {
    font-size: 8.5px; font-family: 'IBM Plex Mono', monospace;
    font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
    padding: 2px 6px; border-radius: 3px; white-space: nowrap;
  }
  .al-tpl-audience {
    font-size: 9px; font-family: 'IBM Plex Mono', monospace;
    font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
    padding: 2px 6px; border-radius: 4px; white-space: nowrap;
  }
  .al-sev-info     { background: rgba(123,158,255,.1); color: #7B9EFF;  border: 1px solid rgba(123,158,255,.2); }
  .al-sev-warning  { background: rgba(255,209,102,.1); color: #FFD166;  border: 1px solid rgba(255,209,102,.2); }
  .al-sev-critical { background: rgba(230,57,70,.1);   color: #e63946;  border: 1px solid rgba(230,57,70,.2);  }
  .al-aud-responder { background: rgba(123,158,255,.1); color: #7B9EFF; border: 1px solid rgba(123,158,255,.2); }
  .al-aud-citizen   { background: rgba(46,204,143,.1);  color: #2ECC8F; border: 1px solid rgba(46,204,143,.2);  }
  .al-aud-all       { background: rgba(251,146,60,.1);  color: #FB923C; border: 1px solid rgba(251,146,60,.2);  }

  /* ── Spinner ── */
  .al-spinner {
    display: inline-block; width: 14px; height: 14px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,.1); border-top-color: #fff;
    animation: alSpin .7s linear infinite;
  }
  @keyframes alSpin { to { transform: rotate(360deg); } }

  /* ─────────────────────────────────────────
     TEMPLATES PANEL (right column)
  ───────────────────────────────────────── */
  .al-templates {
    background: rgba(255,255,255,.025);
    border: 1px solid rgba(255,255,255,.07);
    border-radius: 14px; overflow: hidden;
    min-width: 0;
  }

  /* Collapsible header on mobile */
  .al-templates-header {
    padding: 14px 18px 12px;
    border-bottom: 1px solid rgba(255,255,255,.06);
    display: flex; align-items: center; justify-content: space-between;
    cursor: default;
    user-select: none;
  }
  .al-templates-header-left { display: flex; align-items: center; gap: 8px; }
  .al-templates-title {
    font-family: 'Syne', sans-serif;
    font-size: 13px; font-weight: 800; color: #f0f2f8;
    display: flex; align-items: center; gap: 7px;
  }
  .al-templates-sub {
    font-size: 10.5px; color: rgba(237,240,250,.28);
    font-family: 'IBM Plex Mono', monospace; letter-spacing: .04em;
  }
  .al-templates-toggle {
    display: none; /* hidden on desktop */
    background: none; border: none; color: rgba(237,240,250,.35);
    cursor: pointer; font-size: 14px; padding: 2px;
    transition: color .15s;
  }
  .al-templates-toggle:hover { color: rgba(237,240,250,.7); }

  /* Filter pills */
  .al-tpl-filter {
    display: flex; gap: 4px;
    padding: 10px 14px 6px; flex-wrap: wrap;
    border-bottom: 1px solid rgba(255,255,255,.04);
  }
  .al-tpl-pill {
    padding: 4px 10px; border-radius: 20px; border: 1px solid;
    font-size: 10.5px; font-weight: 600; cursor: pointer;
    transition: all .15s; background: transparent;
    font-family: 'IBM Plex Sans', sans-serif;
  }
  .al-tpl-pill--all       { border-color: rgba(255,255,255,.12); color: rgba(237,240,250,.4); }
  .al-tpl-pill--all.active { background: rgba(255,255,255,.07); border-color: rgba(255,255,255,.22); color: #fff; }
  .al-tpl-pill--responder { border-color: rgba(123,158,255,.2); color: rgba(123,158,255,.5); }
  .al-tpl-pill--responder.active { background: rgba(123,158,255,.1); border-color: rgba(123,158,255,.4); color: #7B9EFF; }
  .al-tpl-pill--citizen   { border-color: rgba(46,204,143,.2); color: rgba(46,204,143,.5); }
  .al-tpl-pill--citizen.active { background: rgba(46,204,143,.1); border-color: rgba(46,204,143,.4); color: #2ECC8F; }
  .al-tpl-pill--broadcast { border-color: rgba(251,146,60,.2); color: rgba(251,146,60,.5); }
  .al-tpl-pill--broadcast.active { background: rgba(251,146,60,.1); border-color: rgba(251,146,60,.4); color: #FB923C; }

  /* Template list */
  .al-tpl-list {
    padding: 6px 8px 10px;
    max-height: 520px; overflow-y: auto;
  }
  .al-tpl-list::-webkit-scrollbar { width: 3px; }
  .al-tpl-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,.1); border-radius: 2px; }

  .al-tpl-card {
    padding: 11px 13px; border-radius: 9px;
    border: 1px solid transparent; cursor: pointer;
    transition: all .16s; margin-bottom: 4px;
    background: rgba(255,255,255,.02);
  }
  .al-tpl-card:last-child { margin-bottom: 0; }
  .al-tpl-card:hover { background: rgba(255,255,255,.05); border-color: rgba(255,255,255,.09); }
  .al-tpl-card-top {
    display: flex; align-items: center; gap: 8px;
    margin-bottom: 5px; flex-wrap: wrap;
  }
  .al-tpl-icon {
    width: 26px; height: 26px; border-radius: 7px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center; font-size: 11px;
  }
  .al-tpl-label {
    font-family: 'IBM Plex Sans', sans-serif;
    font-size: 12.5px; font-weight: 700; color: #edf0fa; flex: 1;
    min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .al-tpl-preview {
    font-size: 11.5px; color: rgba(237,240,250,.35);
    line-height: 1.5; white-space: nowrap;
    overflow: hidden; text-overflow: ellipsis;
  }
  .al-tpl-icon--responder { background: rgba(123,158,255,.12); color: #7B9EFF; border: 1px solid rgba(123,158,255,.2); }
  .al-tpl-icon--citizen   { background: rgba(46,204,143,.12);  color: #2ECC8F; border: 1px solid rgba(46,204,143,.2);  }
  .al-tpl-icon--all       { background: rgba(251,146,60,.12);  color: #FB923C; border: 1px solid rgba(251,146,60,.2);  }

  /* ════════════════════════════════════
     RESPONSIVE BREAKPOINTS
  ════════════════════════════════════ */

  /* Narrow desktop / tablet: stack at 960px */
  @media (max-width: 960px) {
    .al-layout {
      grid-template-columns: 1fr;
    }
    .al-tpl-list { max-height: 320px; }
    .al-templates-toggle { display: flex; align-items: center; }
    .al-templates-header { cursor: pointer; }
  }

  /* Mobile: ≤ 640px */
  @media (max-width: 640px) {
    .al-title { font-size: 18px; }
    .al-compose { padding: 16px 14px; }
    .al-audience-group { gap: 5px; }
    .al-audience-btn { padding: 6px 10px; font-size: 11px; }
    .al-severity-group { gap: 4px; }
    .al-severity-btn { font-size: 10px; padding: 6px 4px; }
    .al-send-btn { padding: 11px; font-size: 13px; }
    .al-textarea { min-height: 90px; }
    .al-tpl-list { max-height: 260px; }
  }

  /* Very small: ≤ 380px */
  @media (max-width: 380px) {
    .al-severity-group { flex-direction: column; }
    .al-severity-btn { flex: unset; }
  }
`;

const SEV_COLORS: Record<string, string> = {
  info: "#7B9EFF", warning: "#FFD166", critical: "#e63946",
};
const AUD_LABELS: Record<string, string> = {
  responder: "Responders", citizen: "Citizens", all: "All",
};

type TplFilter = "all" | "responder" | "citizen" | "broadcast";

export default function AdminAlertsPage() {
  const [alerts, setAlerts]         = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [sending, setSending]       = useState(false);
  const [success, setSuccess]       = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const [audience,  setAudience]    = useState<"responder" | "citizen" | "all">("all");
  const [severity,  setSeverity]    = useState<"info" | "warning" | "critical">("info");
  const [title,     setTitle]       = useState("");
  const [message,   setMessage]     = useState("");
  const [tplFilter, setTplFilter]   = useState<TplFilter>("all");

  // Templates panel collapsed on mobile
  const [tplOpen, setTplOpen]       = useState(true);

  // ── Load alert log ──────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const { data, error: dbErr } = await supabase
        .from("alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);

      if (dbErr) {
        setError("Failed to load alerts: " + dbErr.message);
      } else {
        setAlerts(data ?? []);
      }
      setLoading(false);
    };
    load();

    const channel = supabase
      .channel("admin-alerts-log")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "alerts" }, (payload) => {
        setAlerts((prev) => {
          if (prev.some((a) => a.id === payload.new.id)) return prev;
          return [payload.new, ...prev];
        });
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "alerts" }, (payload) => {
        setAlerts((prev) => prev.filter((a) => a.id !== payload.old.id));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // ── Apply template ──────────────────────────────────────────────────────────
  const applyTemplate = (tpl: AlertTemplate) => {
    setMessage(tpl.message);
    setTitle(tpl.label);
    setAudience(tpl.audience);
    setSeverity(tpl.severity);
    setError(null);
    // On mobile, collapse the template panel after picking
    if (window.innerWidth <= 960) setTplOpen(false);
  };

  // ── Send alert ──────────────────────────────────────────────────────────────
  const sendAlert = async () => {
    if (!message.trim()) return;
    setSending(true);
    setError(null);

    const payload = {
      title:     title.trim() || "Alert",
      message:   message.trim(),
      audience,
      severity,
      is_active: true,
    };

    const { data, error: dbErr } = await supabase
      .from("alerts")
      .insert(payload)
      .select()
      .single();

    if (dbErr) {
      setError("Failed to send alert: " + dbErr.message);
      setSending(false);
      return;
    }

    if (data) {
      setAlerts((prev) => {
        if (prev.some((a) => a.id === data.id)) return prev;
        return [data, ...prev];
      });
    }

    setSending(false);
    setSuccess(true);
    setTitle("");
    setMessage("");
    setTimeout(() => setSuccess(false), 3500);
  };

  // ── Delete alert ────────────────────────────────────────────────────────────
  const deleteAlert = async (id: string) => {
    await supabase.from("alerts").delete().eq("id", id);
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  // ── Filtered templates ──────────────────────────────────────────────────────
  const visibleTemplates = TEMPLATES.filter((t) => {
    if (tplFilter === "all")       return true;
    if (tplFilter === "broadcast") return t.audience === "all";
    return t.audience === tplFilter;
  });

  const formatDate = (ts: string) =>
    ts
      ? new Date(ts).toLocaleString("en-PH", {
          month: "short", day: "numeric",
          hour: "2-digit", minute: "2-digit",
        })
      : "—";

  return (
    <>
      <style>{AL_STYLE}</style>
      <div className="al-root">

        {/* ── Page header ── */}
        <div className="al-header">
          <div>
            <div className="al-eyebrow">Communications</div>
            <h2 className="al-title">Alerts &amp; Broadcasts</h2>
            <p className="al-subtitle">Send targeted alerts to responders, citizens, or broadcast to all</p>
          </div>
        </div>

        {/* ── Global error banner ── */}
        {error && (
          <div className="al-error-banner">
            <FaExclamationTriangle size={12} /> {error}
          </div>
        )}

        {/* ── Two-column layout ── */}
        <div className="al-layout">

          {/* ════ LEFT: Compose + Log ════ */}
          <div className="al-left">

            {/* Compose card */}
            <div className="al-compose">
              <div className="al-compose-title">
                <FaBell size={13} color="#FB923C" /> Compose Alert
              </div>

              {/* Audience */}
              <div className="al-field">
                <label className="al-label">Send To</label>
                <div className="al-audience-group">
                  {(["responder", "citizen", "all"] as const).map((a) => (
                    <button
                      key={a}
                      className={`al-audience-btn al-audience-btn--${a}${audience === a ? " active" : ""}`}
                      onClick={() => setAudience(a)}
                    >
                      {a === "responder" && <FaUserShield size={11} />}
                      {a === "citizen"   && <FaUsers size={11} />}
                      {a === "all"       && <FaBroadcastTower size={11} />}
                      {AUD_LABELS[a]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Severity */}
              <div className="al-field">
                <label className="al-label">Severity</label>
                <div className="al-severity-group">
                  {(["info", "warning", "critical"] as const).map((s) => (
                    <button
                      key={s}
                      className={`al-severity-btn al-severity-btn--${s}${severity === s ? " active" : ""}`}
                      onClick={() => setSeverity(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div className="al-field">
                <label className="al-label">Alert Title</label>
                <input
                  className="al-input"
                  placeholder="e.g. Evacuation Order — Barangay 3"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* Message */}
              <div className="al-field">
                <label className="al-label">Message</label>
                <textarea
                  className="al-textarea"
                  placeholder="Type your alert message here, or pick a template →"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <div className="al-charcount">{message.length} characters</div>
              </div>

              {/* Send */}
              <button
                className="al-send-btn"
                onClick={sendAlert}
                disabled={sending || !message.trim()}
              >
                {sending
                  ? <><span className="al-spinner" /> Sending…</>
                  : <><FaBell size={12} /> Send Alert</>}
              </button>

              {success && (
                <div className="al-toast">
                  <FaCheckCircle size={13} /> Alert sent successfully!
                </div>
              )}
            </div>

            {/* ── Recent Alerts log ── */}
            <div>
              <div className="al-log-title">Recent Alerts ({alerts.length})</div>
              <div className="al-log-list">
                {loading ? (
                  <div className="al-log-empty">Loading…</div>
                ) : alerts.length === 0 ? (
                  <div className="al-log-empty">No alerts sent yet</div>
                ) : (
                  alerts.map((a) => (
                    <div key={a.id} className="al-log-row">
                      <div
                        className="al-log-dot"
                        style={{ background: SEV_COLORS[a.severity] ?? "#7B9EFF" }}
                      />
                      <div className="al-log-content">
                        <div className="al-log-title-text">{a.title || "Alert"}</div>
                        <div className="al-log-msg">{a.message}</div>
                        <div className="al-log-meta">
                          <span className={`al-tpl-audience al-aud-${a.audience ?? "all"}`}>
                            {AUD_LABELS[a.audience ?? "all"]}
                          </span>
                          <span className={`al-tpl-sev al-sev-${a.severity ?? "info"}`}>
                            {a.severity ?? "info"}
                          </span>
                          <span>{formatDate(a.created_at)}</span>
                        </div>
                      </div>
                      <button
                        className="al-log-delete"
                        title="Delete alert"
                        onClick={() => deleteAlert(a.id)}
                      >
                        <FaTrash size={10} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* ════ RIGHT: Templates ════ */}
          <div className="al-templates">
            <div
              className="al-templates-header"
              onClick={() => {
                if (window.innerWidth <= 960) setTplOpen((v) => !v);
              }}
            >
              <div className="al-templates-header-left">
                <div className="al-templates-title">
                  <FaClipboardList size={12} color="#FB923C" /> Templates
                </div>
                <div className="al-templates-sub">{visibleTemplates.length} available</div>
              </div>
              <button
                className="al-templates-toggle"
                aria-label={tplOpen ? "Collapse templates" : "Expand templates"}
                onClick={(e) => { e.stopPropagation(); setTplOpen((v) => !v); }}
              >
                {tplOpen ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
              </button>
            </div>

            {tplOpen && (
              <>
                <div className="al-tpl-filter">
                  {(["all", "responder", "citizen", "broadcast"] as TplFilter[]).map((f) => (
                    <button
                      key={f}
                      className={`al-tpl-pill al-tpl-pill--${f}${tplFilter === f ? " active" : ""}`}
                      onClick={() => setTplFilter(f)}
                    >
                      {f === "broadcast" ? "📢 All" : f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>

                <div className="al-tpl-list">
                  {visibleTemplates.map((tpl) => (
                    <div
                      key={tpl.id}
                      className="al-tpl-card"
                      onClick={() => applyTemplate(tpl)}
                      title="Click to load into composer"
                    >
                      <div className="al-tpl-card-top">
                        <div className={`al-tpl-icon al-tpl-icon--${tpl.audience}`}>{tpl.icon}</div>
                        <div className="al-tpl-label">{tpl.label}</div>
                        <span className={`al-tpl-audience al-aud-${tpl.audience}`}>
                          {AUD_LABELS[tpl.audience]}
                        </span>
                        <span className={`al-tpl-sev al-sev-${tpl.severity}`}>{tpl.severity}</span>
                      </div>
                      <div className="al-tpl-preview">{tpl.message}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </>
  );
}