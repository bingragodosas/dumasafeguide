import { lazy, Suspense, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../js/supabase";
import {
  FaTachometerAlt,
  FaCompass,
  FaClipboardList,
  FaBell,
  FaUsers,
  FaChartBar,
  FaSignOutAlt,
  FaPhone,
  FaMapMarkerAlt,
  FaImage,
  FaVideo,
  FaExternalLinkAlt,
  FaUser,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaBars,
  FaTimes,
  FaHistory,
  FaComments,
} from "react-icons/fa";

const AdminAlertsPage = lazy(() => import("./AdminAlertsPage"));
const IncidentsPage = lazy(() => import("./IncidentsPage"));
const IncidentAnalytics = lazy(() => import("./IncidentAnalytics"));
const RespondersPage = lazy(() => import("./RespondersPage"));
const AdminTeamPage = lazy(() => import("./AdminTeamPage"));
const AdminHistoryLog = lazy(() => import("./AdminHistoryLog"));
const AdminDispatch = lazy(() => import("./AdminDispatch"));
const AdminChatDrawer = lazy(() => import("./components/AdminChatDrawer"));
import { fetchUnreadCounts } from "../hooks/useRealtimeChat";
import ThemeToggle from "../components/ThemeToggle";

const AdminLazyFallback = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 40, color: "rgba(238,240,247,0.35)", fontSize: 13 }}>
    Loading...
  </div>
);

import dsgLogo from "../assets/dsg.logo.png";
import footerBg from "../assets/footer.png";

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewId = "overview" | "dispatch" | "incidents" | "alerts" | "responders" | "team" | "analytics" | "history";

interface NavItem {
  id: ViewId;
  label: string;
  icon: JSX.Element;
  group: "Command" | "Management";
}

interface Report {
  id: string | number;
  type: string;
  description: string | null;
  location: string | null;
  address: string | null;
  reporter_name: string | null;
  reporter_contact: string | null;
  status: string;
  evidence_url: string | null;
  created_at: string;
  responder_id: string | null;
}

// ─── Navigation Items ─────────────────────────────────────────────────────────

const NAV: NavItem[] = [
{ id: "overview",   label: "Overview",    icon: <FaTachometerAlt />, group: "Command"    },
{ id: "dispatch",   label: "Dispatch",    icon: <FaCompass />,       group: "Command"    },
{ id: "incidents",  label: "Incidents",   icon: <FaClipboardList />, group: "Command"    },
  { id: "alerts",     label: "Alerts",      icon: <FaBell />,          group: "Command"    },
  { id: "responders", label: "Responders",  icon: <FaUsers />,         group: "Management" },
  { id: "team",       label: "Team",        icon: <FaUsers />,         group: "Management" },
  { id: "analytics",  label: "Analytics",   icon: <FaChartBar />,      group: "Management" },
  { id: "history",    label: "History Log", icon: <FaHistory />,       group: "Management" },
];

// ─── Constants ─────────────────────────────────────────────────────────────────

const TYPE_META: Record<string, { icon: string; color: string }> = {
  fire:     { icon: "🔥", color: "#FF3B30" },
  accident: { icon: "🚗", color: "#FF9500" },
  flood:    { icon: "🌊", color: "#0066FF" },
  crime:    { icon: "🚨", color: "#FF2D55" },
  medical:  { icon: "🏥", color: "#00B074" },
  other:    { icon: "⚠️", color: "#9CA3AF" },
};

const STATUS_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending:       { label: "PENDING",  color: "#FF3B30", bg: "rgba(255,59,48,.08)",   border: "rgba(255,59,48,.25)"  },
  "in-progress": { label: "IN PROG",  color: "#FF9500", bg: "rgba(255,149,0,.08)",   border: "rgba(255,149,0,.25)"  },
  resolved:      { label: "RESOLVED", color: "#00B074", bg: "rgba(0,176,116,.08)",   border: "rgba(0,176,116,.25)"  },
};

// ─── Light theme matching the Responder dashboard ─────────────────────────────
const DASH_STYLE = `
:root {
  --primary:  #0066FF;
  --success:  #00B074;
  --warning:  #FF9500;
  --danger:   #FF3B30;
  --bg:       #0d1117;
  --surface:  rgba(15,21,33,0.82);
  --border:   rgba(255,255,255,0.07);
  --text:     #eef0f7;
  --text-secondary: rgba(238,240,247,0.55);
  --text-tertiary:  rgba(238,240,247,0.28);
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

@keyframes fadeIn  { from { opacity: 0; transform: translateY(8px);  } to { opacity: 1; transform: none; } }
@keyframes slideIn { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: none; } }
@keyframes pulse   { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
@keyframes spin    { to { transform: rotate(360deg); } }

/* ── Portal / shell ── */
.hud-portal {
   position: fixed; inset: 0; z-index: 9000; overflow-y: auto; overflow-x: hidden;
   font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
   color: var(--text); background: var(--bg);
   background-image: url('${footerBg}');
   background-size: cover;
   background-position: center;
   background-attachment: fixed;
   background-repeat: no-repeat;
 }

.hud-portal::before {
  content: '';
  position: fixed;
  inset: 0;
  background: linear-gradient(135deg, rgba(8,12,20,0.93), rgba(8,12,20,0.93));
  pointer-events: none;
  z-index: 1;
}

.hud { display: flex; height: 100%; width: 100%; position: relative; z-index: 2; }

/* ── Mobile overlay ── */
.hud-sidebar-overlay {
  display: none; position: fixed; inset: 0; z-index: 190;
  background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);
}
.hud-sidebar-overlay.open { display: block; }

/* ── Sidebar ── */
.hud-sidebar {
  width: 260px; flex-shrink: 0;
  background: var(--surface); border-right: 1px solid var(--border);
  display: flex; flex-direction: column;
  height: 100%; position: fixed; left: 0; top: 0; z-index: 200;
  overflow: hidden; transition: transform 0.3s ease;
  box-shadow: 0 4px 16px rgba(0,0,0,0.04);
}

.hud-logo {
  padding: 20px 16px; display: flex; align-items: center; gap: 12px;
  flex-shrink: 0; border-bottom: 1px solid var(--border);
}
.hud-logo-img-wrap { position: relative; width: 40px; height: 40px; flex-shrink: 0; }
.hud-logo-img { width: 40px; height: 40px; object-fit: contain; border-radius: 8px; }
.hud-logo-glow  { display: none; }
.hud-logo-ring  { display: none; }
.hud-logo-text-wrap { flex: 1; min-width: 0; }
.hud-logo-name {
  font-size: 15px; font-weight: 700; color: var(--text);
  white-space: nowrap; display: block;
  background: none; -webkit-background-clip: unset; -webkit-text-fill-color: unset;
  background-clip: unset; filter: none; letter-spacing: normal;
}
.hud-logo-sub {
  font-size: 11px; color: var(--text-tertiary);
  margin-top: 3px; display: flex; align-items: center; gap: 6px;
  font-family: inherit; letter-spacing: normal; text-transform: none;
}

.hud-sidebar-close {
  display: none; margin-left: auto;
  background: transparent; border: 1px solid var(--border); border-radius: 6px;
  width: 28px; height: 28px; align-items: center; justify-content: center;
  color: var(--text-tertiary); cursor: pointer; transition: all 0.2s; flex-shrink: 0;
}
.hud-sidebar-close:hover { background: var(--bg); color: var(--text); border-color: var(--text-secondary); }

.hud-status-pip {
  display: inline-block; width: 5px; height: 5px; border-radius: 50%;
  background: var(--success); animation: pulse 2s ease infinite; flex-shrink: 0;
}

/* ── Nav ── */
.hud-nav-scroll {
  flex: 1; overflow-y: auto; padding: 8px 10px;
  scrollbar-width: thin; scrollbar-color: var(--border) transparent;
}
.hud-nav-label {
  display: flex; align-items: center; gap: 8px;
  font-size: 11px; font-weight: 600; color: var(--text-tertiary);
  letter-spacing: 0.5px; text-transform: uppercase; padding: 12px 8px 6px;
}
.hud-nav-label::after { content: ''; flex: 1; height: 1px; background: var(--border); }

.hud-nav-item {
  display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px 12px;
  border-radius: 8px; border: 1px solid transparent;
  font-size: 13px; font-weight: 500; color: var(--text-secondary);
  background: transparent; cursor: pointer; margin-bottom: 2px;
  text-align: left; transition: all 0.2s; position: relative; overflow: visible;
}
.hud-nav-item:hover { background: var(--bg); color: var(--text); border-color: var(--border); }
.hud-nav-item.active {
  background: linear-gradient(135deg, var(--primary) 0%, #0052cc 100%);
  color: white; border-color: transparent; font-weight: 600;
  box-shadow: 0 2px 8px rgba(0,102,255,0.2);
}
.hud-nav-item.active::before { display: none; }
.hud-nav-ic { font-size: 15px; flex-shrink: 0; color: var(--text-tertiary); transition: color 0.2s; display: flex; align-items: center; }
.hud-nav-item.active .hud-nav-ic { color: white; }

.hud-badge {
  margin-left: auto; background: var(--danger); color: white;
  font-size: 10px; min-width: 20px; height: 20px; border-radius: 10px;
  padding: 0 6px; display: flex; align-items: center; justify-content: center;
  animation: pulse 2s ease infinite; font-weight: 600;
}

/* ── Sidebar footer ── */
.hud-sidebar-footer { padding: 12px 10px 16px; border-top: 1px solid var(--border); flex-shrink: 0; }
.hud-user-card {
  display: flex; align-items: center; gap: 10px; padding: 12px;
  background: var(--bg); border: 1px solid var(--border); border-radius: 8px; margin-bottom: 8px;
}
.hud-avatar {
  width: 32px; height: 32px; border-radius: 6px; flex-shrink: 0;
  background: linear-gradient(135deg, var(--primary) 0%, #0052cc 100%);
  display: flex; align-items: center; justify-content: center;
  font-weight: 600; font-size: 11px; color: white;
  font-family: inherit; border: none;
}
.hud-user-name { font-size: 13px; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.hud-user-status {
  font-size: 10px; color: var(--success);
  display: flex; align-items: center; gap: 5px; margin-top: 2px;
  font-family: inherit; letter-spacing: normal; text-transform: none;
}
.hud-logout-btn {
  display: flex; align-items: center; gap: 8px; width: 100%; padding: 9px 12px;
  background: var(--bg); border: 1px solid var(--border); border-radius: 8px;
  font-size: 13px; font-weight: 500; color: var(--text-secondary); cursor: pointer; transition: all 0.2s;
}
.hud-logout-btn:hover { background: var(--danger); color: white; border-color: var(--danger); }

/* ── Main area ── */
.hud-main {
  margin-left: 260px; flex: 1;
  display: flex; flex-direction: column; position: relative; z-index: 1;
  min-width: 0; height: 100vh; overflow-y: auto; overflow-x: hidden;
}

.hud-topbar {
  height: 56px; display: flex; align-items: center; padding: 0 24px;
  background: var(--surface); border-bottom: 1px solid var(--border);
  position: sticky; top: 0; z-index: 100; gap: 12px; flex-shrink: 0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.hud-topbar::after { display: none; }

.hud-hamburger {
   display: none; background: var(--bg); border: 1px solid var(--border); border-radius: 6px;
   width: 32px; height: 32px; align-items: center; justify-content: center;
   color: var(--text-secondary); cursor: pointer; transition: all 0.2s; flex-shrink: 0; font-size: 14px;
 }
 .hud-hamburger:hover { background: var(--surface); border-color: var(--text-secondary); color: var(--text); }

.hud-topbar { height: 56px; display: flex; align-items: center; padding: 0 24px; background: var(--surface); border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 100; gap: 12px; flex-shrink: 0; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
 .hud-topbar::after { display: none; }

 .hud-crumb-trail {
   display: flex; align-items: center; gap: 7px;
   font-size: 12px; color: var(--text-tertiary);
   font-family: inherit; letter-spacing: normal; overflow: hidden; min-width: 0;
 }
 .hud-crumb-active { color: var(--text); font-weight: 600; white-space: nowrap; }
 .hud-crumb-sep { color: var(--text-tertiary); flex-shrink: 0; }
 .hud-crumb-hide-mobile {}

.hud-topbar-right { margin-left: auto; display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
.hud-topbar-time {
  font-size: 12px; font-weight: 500; color: var(--text-secondary);
  background: var(--bg); border: 1px solid var(--border); border-radius: 6px;
  padding: 6px 12px; white-space: nowrap; font-family: inherit; letter-spacing: normal;
}
.hud-topbar-btn {
  width: 32px; height: 32px; border-radius: 6px; border: 1px solid var(--border);
  background: transparent; display: flex; align-items: center; justify-content: center;
  color: var(--text-secondary); cursor: pointer; font-size: 13px; transition: all 0.2s; flex-shrink: 0;
}
.hud-topbar-btn:hover { background: var(--bg); color: var(--text); border-color: var(--text-secondary); }
.hud-notif-wrap { position: relative; }
.hud-notif-dot {
  position: absolute; top: 6px; right: 6px; width: 6px; height: 6px; border-radius: 50%;
  background: var(--danger); border: 1px solid var(--surface); animation: pulse 1.5s ease infinite;
}

/* ── Page content ── */
.hud-page { flex: 1; padding: 24px; overflow-x: hidden; min-width: 0; }

/* ── Overview header ── */
.hud-page-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  flex-wrap: wrap; gap: 12px; margin-bottom: 24px;
}
.hud-eyebrow {
  font-size: 11px; color: var(--primary); letter-spacing: 0.5px;
  text-transform: uppercase; margin-bottom: 6px; font-weight: 600;
  display: flex; align-items: center; gap: 8px; font-family: inherit;
}
.hud-eyebrow::before { content: ''; display: block; width: 20px; height: 2px; background: var(--primary); }
.hud-title { font-size: 32px; color: var(--text); letter-spacing: -0.5px; line-height: 1.1; font-weight: 700; font-family: inherit; }
.hud-subtitle { font-size: 11px; color: var(--text-tertiary); margin-top: 4px; font-family: inherit; letter-spacing: normal; }
.hud-live-tag {
  display: flex; align-items: center; gap: 6px; font-size: 11px; padding: 6px 12px;
  border-radius: 6px; border: 1px solid var(--danger);
  background: rgba(255,59,48,0.06); color: var(--danger); letter-spacing: 0.3px;
  white-space: nowrap; font-weight: 600; font-family: inherit;
}
.hud-live-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--danger); animation: pulse 1.4s ease infinite; }

/* ── Stat cards ── */
.hud-stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 24px; }
.hud-stat {
  background: var(--surface); border: 1px solid var(--border); border-radius: 12px;
  padding: 20px; position: relative; overflow: hidden; transition: all 0.3s; cursor: default;
  animation: fadeIn 0.5s ease-out both; backdrop-filter: none;
}
.hud-stat:nth-child(2) { animation-delay: 0.05s; }
.hud-stat:nth-child(3) { animation-delay: 0.10s; }
.hud-stat:nth-child(4) { animation-delay: 0.15s; }
.hud-stat:nth-child(5) { animation-delay: 0.20s; }
.hud-stat:nth-child(6) { animation-delay: 0.25s; }
.hud-stat:hover { transform: translateY(-4px); border-color: var(--primary); box-shadow: 0 8px 16px rgba(0,102,255,0.1); }
.hud-stat::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: var(--card-accent); }
.hud-stat-icon { font-size: 18px; color: var(--card-accent); margin-bottom: 12px; opacity: 0.85; }
.hud-stat-num { font-size: 32px; line-height: 1; margin-bottom: 6px; letter-spacing: -0.5px; font-weight: 700; color: var(--card-accent); font-family: inherit; }
.hud-stat-label { font-size: 11px; color: var(--text-secondary); letter-spacing: 0.3px; text-transform: uppercase; font-weight: 500; font-family: inherit; }
.hud-stat-delta { position: absolute; top: 12px; right: 12px; font-size: 9px; border: 1px solid var(--card-accent); border-radius: 4px; padding: 2px 6px; color: var(--card-accent); opacity: 0.6; font-family: inherit; }

/* ── Panels ── */
.hud-panels-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.hud-panel {
  background: var(--surface); border: 1px solid var(--border); border-radius: 12px;
  padding: 20px; min-width: 0; backdrop-filter: none; animation: slideIn 0.5s ease-out both;
}
.hud-panel:nth-child(2) { animation-delay: 0.1s; }
.hud-panel-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--border); }
.hud-panel-title { font-size: 11px; color: var(--text-secondary); letter-spacing: 0.5px; text-transform: uppercase; font-weight: 600; font-family: inherit; }
.hud-panel-tag { font-size: 9px; color: var(--primary); border: 1px solid var(--primary); border-radius: 4px; padding: 3px 8px; background: rgba(0,102,255,0.05); font-weight: 600; white-space: nowrap; }

/* ── Feed card quick actions + modals (single page scroll, no nested scrollbar) ── */
.hud-act-btn { font-family: inherit; font-size: 11px; font-weight: 600; padding: 7px 12px; border-radius: 7px; border: 1px solid var(--border); background: var(--surface); color: var(--text-secondary); cursor: pointer; transition: all .15s; }
.hud-act-btn:hover { border-color: var(--primary); color: var(--text); }
.hud-act-btn:disabled { opacity: .5; cursor: not-allowed; }
.hud-act-btn--primary { border-color: rgba(0,102,255,.4); color: #4A90D9; background: rgba(0,102,255,.08); }
.hud-act-btn--success { border-color: rgba(0,176,116,.4); color: #00B074; background: rgba(0,176,116,.08); }
.hud-modal-overlay { position: fixed; inset: 0; z-index: 1000; background: rgba(0,0,0,.6); display: flex; align-items: center; justify-content: center; padding: 20px; }
.hud-modal { width: 100%; max-width: 520px; max-height: 85vh; overflow-y: auto; background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 20px; }
.hud-modal-head { display: flex; align-items: center; justify-content: space-between; font-size: 15px; font-weight: 700; color: var(--text); margin-bottom: 12px; }
.hud-modal-x { background: none; border: none; color: var(--text-tertiary); font-size: 20px; cursor: pointer; line-height: 1; }
.hud-select { font-family: inherit; font-size: 13px; color: var(--text); background: var(--bg); border: 1px solid var(--border); border-radius: 7px; padding: 8px 10px; }

/* ── Incident cards ── */
.hud-inc-full {
  display: flex; flex-direction: column; gap: 10px; margin-bottom: 12px;
  padding: 14px; background: var(--bg); border: 1px solid var(--border);
  border-radius: 10px;
}
.hud-inc-full:last-child { margin-bottom: 0; }
.hud-inc-full-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
.hud-inc-full-title { font-size: 15px; font-weight: 700; color: var(--text); display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-family: inherit; }
.hud-inc-full-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.hud-inc-field { display: flex; flex-direction: column; gap: 3px; padding: 8px 10px; background: var(--surface); border: 1px solid var(--border); border-radius: 7px; min-width: 0; }
.hud-inc-field-label { font-size: 9px; color: var(--text-tertiary); letter-spacing: 0.1em; text-transform: uppercase; font-family: inherit; }
.hud-inc-field-val { font-size: 12.5px; color: var(--text); line-height: 1.4; overflow-wrap: break-word; word-break: break-word; }
.hud-inc-desc { font-size: 12.5px; color: var(--text-secondary); line-height: 1.6; padding: 8px 10px; background: var(--surface); border-radius: 6px; border: 1px solid var(--border); overflow-wrap: break-word; }
.hud-inc-evidence-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.hud-inc-evidence-large {
  display: flex; align-items: center; gap: 8px; padding: 8px 12px;
  background: rgba(0,102,255,0.05); border: 1px solid rgba(0,102,255,0.18);
  border-radius: 8px; text-decoration: none; color: var(--primary);
  font-size: 12px; transition: background 0.15s; width: fit-content; max-width: 100%;
}
.hud-inc-evidence-large:hover { background: rgba(0,102,255,0.1); }
.hud-inc-evidence-img { max-width: 120px; max-height: 80px; border-radius: 6px; object-fit: cover; border: 1px solid var(--border); }

.hud-inc-badge {
  font-size: 9px; padding: 3px 9px; border-radius: 4px;
  background: var(--ib-bg); color: var(--ib-text); border: 1px solid var(--ib-border);
  white-space: nowrap; font-weight: 600;
}

/* ── Bar chart ── */
.hud-bar-row { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.hud-bar-row:last-child { margin-bottom: 0; }
.hud-bar-label { font-size: 12px; color: var(--text-secondary); width: 72px; flex-shrink: 0; display: flex; align-items: center; gap: 5px; font-weight: 500; }
.hud-bar-track { flex: 1; height: 5px; border-radius: 3px; background: var(--border); overflow: hidden; min-width: 0; }
.hud-bar-fill { height: 100%; border-radius: 3px; background: var(--bar-color); transition: width 1.2s cubic-bezier(0.4,0,0.2,1); }
.hud-bar-val { font-size: 12px; color: var(--text-secondary); width: 22px; text-align: right; flex-shrink: 0; font-weight: 500; }

/* ── Quick nav ── */
.hud-qnav { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px; }
.hud-qbtn {
  display: flex; align-items: center; gap: 8px; padding: 12px;
  background: var(--bg); border: 1px solid var(--border); border-radius: 8px;
  cursor: pointer; font-size: 12px; font-weight: 600; color: var(--text-secondary);
  text-align: left; transition: all 0.2s; position: relative;
}
.hud-qbtn::before { display: none; }
.hud-qbtn:hover { color: var(--text); transform: translateY(-2px); border-color: var(--text-secondary); }
.hud-qbtn-icon { width: 28px; height: 28px; border-radius: 6px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 13px; border: 1px solid var(--qbtn-border); background: var(--qbtn-bg); color: var(--qbtn-color); }

/* ── Spinner / empty ── */
.hud-spinner { display: inline-block; width: 16px; height: 16px; border-radius: 50%; border: 2px solid var(--border); border-top-color: var(--primary); animation: spin 0.8s linear infinite; }
.hud-empty { text-align: center; padding: 48px 24px; font-size: 12px; letter-spacing: 0.3px; color: var(--text-secondary); text-transform: uppercase; }

/* ── Sub-page resets ── */
.hud-page .al-root, .hud-page .ia-root, .hud-page .inc-root, .hud-page .rp-root, .hud-page .atp-root, .hud-page .hl-root { min-height: unset; padding: 0; }

/* ════════════ RESPONSIVE ════════════ */
@media (max-width: 1024px) {
  .hud-panels-row { grid-template-columns: 1fr; }
}

@media (max-width: 768px) {
  .hud-sidebar { transform: translateX(-100%); width: min(260px, 90vw); box-shadow: 4px 0 12px rgba(0,0,0,0.1); }
  .hud-sidebar.open { transform: translateX(0); }
  .hud-sidebar-close { display: flex; }
  .hud-hamburger { display: flex; }
  .hud-main { margin-left: 0; }
  .hud-topbar { padding: 0 16px; }
  .hud-crumb-hide-mobile { display: none; }
  .hud-topbar-time { font-size: 11px; padding: 4px 8px; }
  .hud-page { padding: 16px; }
  .hud-title { font-size: 26px; }
  .hud-stat-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .hud-stat-num { font-size: 24px; }
  .hud-inc-full-grid { grid-template-columns: 1fr; }
  .hud-qnav { grid-template-columns: 1fr 1fr; }
}

@media (max-width: 420px) {
  .hud-qnav { grid-template-columns: 1fr; }
  .hud-topbar-time { display: none; }
  .hud-page { padding: 14px 12px; }
}
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function usePHTClock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(`${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}:${String(now.getSeconds()).padStart(2,"0")} PHT`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

function formatRelative(ts: string) {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(ts).toLocaleDateString();
}

function isVideo(url: string) {
  return /\.(mp4|mov|avi|webm|mkv)/i.test(url);
}

function IncidentCard({ r, onChanged }: { r: Report; onChanged: () => void }) {
  const tm = TYPE_META[r.type] ?? TYPE_META.other;
  const sm = STATUS_META[r.status] ?? STATUS_META.pending;
  const hasContact  = r.reporter_contact;
  const hasEvidence = r.evidence_url;
  const vid = hasEvidence && isVideo(r.evidence_url!);

  const [action, setAction] = useState<null | "dispatch" | "resolve" | "details">(null);
  const [responders, setResponders] = useState<{ id: string; name: string }[]>([]);
  const [assignee, setAssignee] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openDispatch = async () => {
    setAction("dispatch");
    setError(null);
    setAssignee("");
    const { data } = await supabase.from("responders").select("id,name").eq("on_duty", true).order("name");
    setResponders((data ?? []) as { id: string; name: string }[]);
  };

  const confirmDispatch = async () => {
    if (!assignee) { setError("Select a responder first."); return; }
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.from("reports")
      .update({ responder_id: assignee, status: "in-progress" })
      .eq("id", r.id);
    setBusy(false);
    if (err) { setError("Assign failed. Please try again."); return; }
    setAction(null);
    onChanged();
  };

  const confirmResolve = async () => {
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.from("reports").update({ status: "resolved" }).eq("id", r.id);
    setBusy(false);
    if (err) { setError("Resolve failed. Please try again."); return; }
    setAction(null);
    onChanged();
  };

  return (
    <div className="hud-inc-full">
      <div className="hud-inc-full-header">
        <div className="hud-inc-full-title">
          <span>{tm.icon}</span>
          <span style={{ color: tm.color, textTransform: "capitalize" }}>{(r.type ?? "other").replace(/_/g," ")}</span>
          <span style={{ fontSize: 9, opacity: .4, fontWeight: 400 }}>
            #{String(r.id).slice(0, 8)}
          </span>
        </div>
        <span className="hud-inc-badge" style={{ "--ib-bg": sm.bg, "--ib-text": sm.color, "--ib-border": sm.border } as React.CSSProperties}>
          {sm.label}
        </span>
      </div>

      <div className="hud-inc-full-grid">
        <div className="hud-inc-field">
          <span className="hud-inc-field-label"><FaMapMarkerAlt size={8} style={{marginRight:3}}/>Location</span>
          <span className="hud-inc-field-val">{r.address || r.location || "—"}</span>
        </div>
        <div className="hud-inc-field">
          <span className="hud-inc-field-label"><FaUser size={8} style={{marginRight:3}}/>Reporter</span>
          <span className="hud-inc-field-val">{r.reporter_name || "Anonymous"}</span>
        </div>
        {hasContact && (
          <div className="hud-inc-field">
            <span className="hud-inc-field-label"><FaPhone size={8} style={{marginRight:3}}/>Contact</span>
            <a href={`tel:${r.reporter_contact}`} className="hud-inc-field-val" style={{ color: "var(--success)", textDecoration: "none" }}>
              {r.reporter_contact}
            </a>
          </div>
        )}
        <div className="hud-inc-field">
          <span className="hud-inc-field-label"><FaClock size={8} style={{marginRight:3}}/>Reported</span>
          <span className="hud-inc-field-val">{formatRelative(r.created_at)}</span>
        </div>
      </div>

      {r.description && (
        <div className="hud-inc-desc">{r.description}</div>
      )}

      {hasEvidence && (
        <div className="hud-inc-evidence-row">
          {!vid && (
            <img src={r.evidence_url!} alt="evidence" className="hud-inc-evidence-img" />
          )}
          <a href={r.evidence_url!} target="_blank" rel="noopener noreferrer" className="hud-inc-evidence-large">
            {vid ? <FaVideo size={12} /> : <FaImage size={12} />}
            View {vid ? "Video" : "Photo"} Evidence
            <FaExternalLinkAlt size={9} style={{ opacity: .5 }} />
          </a>
        </div>
      )}

      {/* ── Quick actions per feed card ── */}
      <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
        <button className="hud-act-btn" onClick={() => setAction("details")}>View Details</button>
        {r.status !== "resolved" && (
          <>
            <button className="hud-act-btn hud-act-btn--primary" onClick={openDispatch}>Dispatch Responder</button>
            <button className="hud-act-btn hud-act-btn--success" onClick={() => { setError(null); setAction("resolve"); }}>Mark Resolved</button>
          </>
        )}
      </div>
      {error && <div style={{ color: "#FF3B30", fontSize: 11, marginTop: 6 }}>{error}</div>}

      {/* ── Details modal ── */}
      {action === "details" && (
        <div className="hud-modal-overlay" onClick={() => setAction(null)}>
          <div className="hud-modal" onClick={e => e.stopPropagation()}>
            <div className="hud-modal-head">
              <span style={{ color: tm.color, textTransform: "capitalize" }}>{(r.type ?? "other").replace(/_/g, " ")} #{String(r.id).slice(0, 8)}</span>
              <button className="hud-modal-x" onClick={() => setAction(null)} aria-label="Close">×</button>
            </div>
            <div className="hud-inc-full-grid">
              <div className="hud-inc-field"><span className="hud-inc-field-label">Status</span><span className="hud-inc-field-val">{sm.label}</span></div>
              <div className="hud-inc-field"><span className="hud-inc-field-label">Reported</span><span className="hud-inc-field-val">{formatRelative(r.created_at)}</span></div>
              <div className="hud-inc-field"><span className="hud-inc-field-label">Location</span><span className="hud-inc-field-val">{r.address || r.location || "—"}</span></div>
              <div className="hud-inc-field"><span className="hud-inc-field-label">Reporter</span><span className="hud-inc-field-val">{r.reporter_name || "Anonymous"}{r.reporter_contact ? ` (${r.reporter_contact})` : ""}</span></div>
            </div>
            {r.description && <div className="hud-inc-desc">{r.description}</div>}
            {hasEvidence && (
              <a href={r.evidence_url!} target="_blank" rel="noopener noreferrer" className="hud-inc-evidence-large">
                {vid ? <FaVideo size={12} /> : <FaImage size={12} />}
                View {vid ? "Video" : "Photo"} Evidence
                <FaExternalLinkAlt size={9} style={{ opacity: .5 }} />
              </a>
            )}
          </div>
        </div>
      )}

      {/* ── Dispatch modal ── */}
      {action === "dispatch" && (
        <div className="hud-modal-overlay" onClick={() => setAction(null)}>
          <div className="hud-modal" onClick={e => e.stopPropagation()}>
            <div className="hud-modal-head">
              <span>Dispatch Responder</span>
              <button className="hud-modal-x" onClick={() => setAction(null)} aria-label="Close">×</button>
            </div>
            <p style={{ fontSize: 12, opacity: .6, marginBottom: 10 }}>Assign an on-duty responder to #{String(r.id).slice(0, 8)}. Status flips to In Progress.</p>
            <select value={assignee} onChange={e => setAssignee(e.target.value)} className="hud-select" style={{ width: "100%", marginBottom: 10 }}>
              <option value="">Select responder…</option>
              {responders.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
            {responders.length === 0 && <p style={{ fontSize: 11, opacity: .55, marginBottom: 10 }}>No on-duty responders found.</p>}
            {error && <p style={{ color: "#FF3B30", fontSize: 11, marginBottom: 8 }}>{error}</p>}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="hud-act-btn" onClick={() => setAction(null)}>Cancel</button>
              <button className="hud-act-btn hud-act-btn--primary" disabled={busy} onClick={confirmDispatch}>{busy ? "Assigning…" : "Assign Responder"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Resolve confirm ── */}
      {action === "resolve" && (
        <div className="hud-modal-overlay" onClick={() => setAction(null)}>
          <div className="hud-modal" onClick={e => e.stopPropagation()}>
            <div className="hud-modal-head">
              <span>Mark Resolved</span>
              <button className="hud-modal-x" onClick={() => setAction(null)} aria-label="Close">×</button>
            </div>
            <p style={{ fontSize: 12, opacity: .6, marginBottom: 12 }}>Mark report #{String(r.id).slice(0, 8)} as resolved?</p>
            {error && <p style={{ color: "#FF3B30", fontSize: 11, marginBottom: 8 }}>{error}</p>}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="hud-act-btn" onClick={() => setAction(null)}>Cancel</button>
              <button className="hud-act-btn hud-act-btn--success" disabled={busy} onClick={confirmResolve}>{busy ? "Saving…" : "Yes, Resolve"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Overview panel ───────────────────────────────────────────────────────────
function OverviewPanel({ onNavigate }: { onNavigate: (v: ViewId) => void }) {
  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, resolved: 0, responders: 0, alerts: 0 });
  const [recentReports, setRecentReports] = useState<Report[]>([]);
  const [typeCounts, setTypeCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    const [reports, responders, alerts] = await Promise.all([
      supabase.from("reports").select("id,type,description,location,address,reporter_name,reporter_contact,status,evidence_url,created_at,responder_id").order("created_at", { ascending: false }),
      supabase.from("responders").select("id"),
      supabase.from("alerts").select("id"),
    ]);

    const rows: Report[] = reports.data ?? [];
    const counts: Record<string, number> = {};
    rows.forEach(r => { counts[r.type] = (counts[r.type] ?? 0) + 1; });

    setStats({
      total:      rows.length,
      pending:    rows.filter(r => r.status === "pending").length,
      inProgress: rows.filter(r => r.status === "in-progress").length,
      resolved:   rows.filter(r => r.status === "resolved").length,
      responders: (responders.data ?? []).length,
      alerts:     (alerts.data ?? []).length,
    });
    setRecentReports(rows.slice(0, 5));
    setTypeCounts(counts);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const channel = supabase
      .channel("overview-reports")
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, loadData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const statCards = [
    { label: "Total Reports", value: stats.total,      accent: "#0066FF", icon: <FaClipboardList />,      delta: "ALL TIME" },
    { label: "Pending",       value: stats.pending,    accent: "#FF3B30", icon: <FaExclamationTriangle />, delta: "URGENT"   },
    { label: "In Progress",   value: stats.inProgress, accent: "#FF9500", icon: <FaClock />,              delta: undefined   },
    { label: "Resolved",      value: stats.resolved,   accent: "#00B074", icon: <FaCheckCircle />,        delta: undefined   },
    { label: "Responders",    value: stats.responders, accent: "#00B074", icon: <FaUsers />,              delta: "ACTIVE"   },
    { label: "Alerts Sent",   value: stats.alerts,     accent: "#FF3B30", icon: <FaBell />,               delta: "TOTAL"    },
  ];

  const typeList = ["fire","flood","medical","crime","accident","other"];
  const maxCount = Math.max(...typeList.map(t => typeCounts[t] ?? 0), 1);

  const quickNav = [
    { id: "incidents"  as ViewId, label: "Incidents",  icon: <FaClipboardList />, color: "#0066FF", bg: "rgba(0,102,255,.08)",   border: "rgba(0,102,255,.2)"   },
    { id: "alerts"     as ViewId, label: "Alerts",     icon: <FaBell />,          color: "#FF3B30", bg: "rgba(255,59,48,.08)",   border: "rgba(255,59,48,.2)"   },
    { id: "team"       as ViewId, label: "Team",       icon: <FaUsers />,         color: "#00B074", bg: "rgba(0,176,116,.08)",   border: "rgba(0,176,116,.2)"   },
    { id: "analytics"  as ViewId, label: "Analytics",  icon: <FaChartBar />,      color: "#FF9500", bg: "rgba(255,149,0,.08)",   border: "rgba(255,149,0,.2)"   },
  ];

  return (
    <div>
      <div className="hud-page-header">
        <div>
          <div className="hud-eyebrow">Admin Panel</div>
          <div className="hud-title">Command Overview</div>
          <div className="hud-subtitle">DUMAGUETE CITY EMERGENCY HQ</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {loading && <div className="hud-spinner" />}
          <div className="hud-live-tag"><span className="hud-live-dot" />LIVE FEED</div>
        </div>
      </div>

      <div className="hud-stat-grid">
        {statCards.map(c => (
          <div key={c.label} className="hud-stat" style={{ "--card-accent": c.accent } as React.CSSProperties}>
            <div className="hud-stat-icon">{c.icon}</div>
            <div className="hud-stat-num">{loading ? "—" : c.value}</div>
            <div className="hud-stat-label">{c.label}</div>
            {c.delta && <span className="hud-stat-delta">{c.delta}</span>}
          </div>
        ))}
      </div>

      <div className="hud-panels-row">
        {/* Feed panel flows with the main page scroll (no nested scrollbar). */}
        <div className="hud-panel">
          <div className="hud-panel-head">
            <span className="hud-panel-title">Live Incident Feed</span>
            <span className="hud-panel-tag">REAL-TIME</span>
          </div>
          {loading ? (
            <div className="hud-empty"><div className="hud-spinner" style={{ margin: "0 auto" }} /></div>
          ) : recentReports.length === 0 ? (
            <div className="hud-empty">No reports yet</div>
          ) : (
            recentReports.map(r => <IncidentCard key={String(r.id)} r={r} onChanged={loadData} />)
          )}
        </div>

        <div className="hud-panel">
          <div className="hud-panel-head">
            <span className="hud-panel-title">Incident Types</span>
            <span className="hud-panel-tag">ALL TIME</span>
          </div>
          {typeList.map(t => {
            const tm = TYPE_META[t] ?? TYPE_META.other;
            const count = typeCounts[t] ?? 0;
            return (
              <div key={t} className="hud-bar-row">
                <span className="hud-bar-label">
                  <span>{tm.icon}</span>
                  <span style={{ textTransform: "capitalize" }}>{t}</span>
                </span>
                <div className="hud-bar-track">
                  <div className="hud-bar-fill" style={{ width: `${(count / maxCount) * 100}%`, "--bar-color": tm.color } as React.CSSProperties} />
                </div>
                <span className="hud-bar-val">{count}</span>
              </div>
            );
          })}

          <div style={{ borderTop: "1px solid var(--border)", marginTop: 16, paddingTop: 14 }}>
            <div className="hud-panel-title" style={{ marginBottom: 11 }}>Quick Actions</div>
            <div className="hud-qnav">
              {quickNav.map(q => (
                <button key={q.id} className="hud-qbtn"
                  style={{ "--qbtn-color": q.color, "--qbtn-bg": q.bg, "--qbtn-border": q.border } as React.CSSProperties}
                  onClick={() => onNavigate(q.id)}
                >
                  <span className="hud-qbtn-icon">{q.icon}</span>
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main AdminDashboard ──────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate = useNavigate();
  const clock = usePHTClock();
  const [view, setView] = useState<ViewId>("overview");
  const [pendingCount, setPendingCount] = useState(0);
  const [adminName, setAdminName] = useState("Admin");
  const [adminId, setAdminId] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatUnread, setChatUnread] = useState(0);

  const handleNavigate = (v: ViewId) => {
    setView(v);
    setSidebarOpen(false);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSidebarOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setPendingCount(0);
        return;
      }
      setAdminId(user.id);
      const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
      if (profile?.full_name) setAdminName(profile.full_name);
      await supabase.from("profiles").update({ status: "on_duty", last_seen: new Date().toISOString() }).eq("id", user.id);
      await supabase.from("responders").update({ status: "on_duty" }).eq("email", user.email);
      const unread = await fetchUnreadCounts(user.id);
      setChatUnread(Object.values(unread.bySender).reduce((a, b) => a + b, 0) + unread.broadcast);
      const { data } = await supabase.from("reports").select("id").eq("status", "pending");
      setPendingCount((data ?? []).length);
    };
    load();

    const channel = supabase
      .channel("dashboard-pending")
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Chat unread badge: refresh whenever any side-chat message lands.
  useEffect(() => {
    if (!adminId) return;
    const ch = supabase
      .channel("dashboard-chat-unread")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, async () => {
        const unread = await fetchUnreadCounts(adminId);
        setChatUnread(Object.values(unread.bySender).reduce((a, b) => a + b, 0) + unread.broadcast);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [adminId]);

  const handleLogout = async () => {
    const { data: { user: logoutUser } } = await supabase.auth.getUser();
    if (logoutUser) {
      await supabase.from("profiles").update({ status: "off_duty", last_seen: new Date().toISOString() }).eq("id", logoutUser.id);
      await supabase.from("responders").update({ status: "off_duty" }).eq("email", logoutUser.email);
    }
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  const initials = adminName.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase();

  const PAGE_TITLE: Record<ViewId, string> = {
    overview:   "Overview",
    dispatch:   "Dispatch",
    incidents:  "Incidents",
    alerts:     "Alerts",
    responders: "Responders",
    team:       "Team",
    analytics:  "Analytics",
    history:    "History Log",
  };

  const groups = [
    { label: "Command",    items: NAV.filter(n => n.group === "Command")    },
    { label: "Management", items: NAV.filter(n => n.group === "Management") },
  ];

  return (
    <>
      <style>{DASH_STYLE}</style>
      <div className="hud-portal">
        <div className="hud">
          <div
            className={`hud-sidebar-overlay${sidebarOpen ? " open" : ""}`}
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />

          <aside className={`hud-sidebar${sidebarOpen ? " open" : ""}`} aria-label="Navigation">
            <div className="hud-logo">
              <div className="hud-logo-img-wrap">
                <img src={dsgLogo} alt="DSG Logo" className="hud-logo-img" />
              </div>
              <div className="hud-logo-text-wrap">
                <div className="hud-logo-name">DumaSafeGuide</div>
                <div className="hud-logo-sub"><span className="hud-status-pip" />ADMIN</div>
              </div>
              <button
                className="hud-sidebar-close"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close navigation"
              >
                <FaTimes />
              </button>
            </div>

            <nav className="hud-nav-scroll">
              {groups.map(g => (
                <div key={g.label}>
                  <div className="hud-nav-label">{g.label}</div>
                  {g.items.map(item => (
                    <button
                      key={item.id}
                      className={`hud-nav-item${view === item.id ? " active" : ""}`}
                      onClick={() => handleNavigate(item.id)}
                    >
                      <span className="hud-nav-ic">{item.icon}</span>
                      <span>{item.label}</span>
                      {item.id === "incidents" && pendingCount > 0 && (
                        <span className="hud-badge">{pendingCount}</span>
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </nav>

            <div className="hud-sidebar-footer">
              <div className="hud-user-card">
                <div className="hud-avatar">{initials}</div>
                <div style={{ minWidth: 0 }}>
                  <div className="hud-user-name">{adminName}</div>
                  <div className="hud-user-status"><span className="hud-status-pip" />SYS ONLINE</div>
                </div>
              </div>
              <button className="hud-logout-btn" onClick={handleLogout}>
                <FaSignOutAlt size={12} /> Sign Out
              </button>
            </div>
          </aside>

          <div className="hud-main">
            <div className="hud-topbar">
              <button
                className="hud-hamburger"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open navigation"
                aria-expanded={sidebarOpen}
              >
                <FaBars />
              </button>

              <div className="hud-crumb-trail">
                <span className="hud-crumb-hide-mobile">DUMASAFEGUIDE</span>
                <span className="hud-crumb-sep hud-crumb-hide-mobile">/</span>
                <span className="hud-crumb-hide-mobile">ADMIN</span>
                <span className="hud-crumb-sep hud-crumb-hide-mobile">/</span>
                <span className="hud-crumb-active">{PAGE_TITLE[view]}</span>
              </div>

              <div className="hud-topbar-right">
                <span className="hud-topbar-time">{clock}</span>
                <ThemeToggle compact />
                <div className="hud-notif-wrap">
                  <button
                    id="admin-chat-trigger"
                    className="hud-topbar-btn"
                    aria-label="Open team chat"
                    title="Team chat"
                    onClick={() => { setIsChatOpen(true); setChatUnread(0); }}
                    style={{ position: "relative" }}
                  >
                    <FaComments size={13} />
                    {chatUnread > 0 && (
                      <span style={{
                        position: "absolute", top: -5, right: -5, minWidth: 16, height: 16, borderRadius: 8,
                        background: "#FF3B30", color: "#fff", fontSize: 9, fontWeight: 700,
                        display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px",
                      }}>
                        {chatUnread > 99 ? "99+" : chatUnread}
                      </span>
                    )}
                  </button>
                </div>
                <div className="hud-notif-wrap">
                  <button className="hud-topbar-btn" aria-label="Notifications"><FaBell size={13} /></button>
                  {pendingCount > 0 && <span className="hud-notif-dot" />}
                </div>
              </div>
            </div>

            <div className="hud-page">
              <Suspense fallback={<AdminLazyFallback />}>
                {view === "overview"   && <OverviewPanel onNavigate={handleNavigate} />}
                {view === "dispatch"   && <AdminDispatch />}
                {view === "incidents"  && <IncidentsPage />}
                {view === "alerts"     && <AdminAlertsPage />}
                {view === "responders" && <RespondersPage />}
                {view === "team"       && <AdminTeamPage />}
                {view === "analytics"  && <IncidentAnalytics />}
                {view === "history"    && <AdminHistoryLog />}
              </Suspense>
            </div>
          </div>

          {/* Real-time side chat (all admin views) */}
          <Suspense fallback={null}>
            <AdminChatDrawer open={isChatOpen} onClose={() => setIsChatOpen(false)} />
          </Suspense>
        </div>
      </div>
    </>
  );
}