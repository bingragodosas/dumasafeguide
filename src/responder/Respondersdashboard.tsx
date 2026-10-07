import React, { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../js/supabase";
import { TranslatedDescription } from "../components/TranslatedDescription";

const Dispatch = lazy(() => import("./Dispatch"));
const ResponderAlertsPage = lazy(() => import("./ResponderAlertsPage"));
const ResponderIncidentsPage = lazy(() => import("./IncidentsPage"));
const ResponderTeamPage = lazy(() => import("./ResponderTeam"));
const ResponderChatDrawer = lazy(() => import("./components/ResponderChatDrawer"));
const ResponderCitizenChatDrawer = lazy(() => import("./components/ResponderCitizenChatDrawer"));
import GlobalResponderCallHandler from "./components/GlobalResponderCallHandler";
import { fetchUnreadCounts } from "../hooks/useRealtimeChat";
import ThemeToggle from "../components/ThemeToggle";
import { useDepartmentNotifications } from "../hooks/useDepartmentNotifications";
import { usePresence } from "../hooks/usePresence";
import { useHeartbeat, markOffline } from "../hooks/useHeartbeat";
import dsgLogo from "../assets/dsg.logo.png";

const ResponderLazyFallback = () => (
  <div className="rd-fallback" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 40, fontSize: 13 }}>
    Loading...
  </div>
);

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewId = "overview" | "incidents" | "citizenChat" | "alerts" | "dispatch" | "team";

interface Report {
  id: string | number;
  type: string;
  description: string | null;
  description_lang: string | null;
  description_translated: string | null;
  location: string | null;
  address: string | null;
  reporter_name: string | null;
  reporter_contact: string | null;
  status: string;
  evidence_url: string | null;
  created_at: string;
  responder_id: string | null;
  department_id: string | null;
  department: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_META: Record<string, { icon: string; colorClass: string }> = {
  fire:     { icon: "🔥", colorClass: "tc-fire"     },
  accident: { icon: "🚗", colorClass: "tc-accident" },
  flood:    { icon: "🌊", colorClass: "tc-flood"    },
  crime:    { icon: "🚨", colorClass: "tc-crime"    },
  medical:  { icon: "🏥", colorClass: "tc-medical"  },
  other:    { icon: "⚠️", colorClass: "tc-other"   },
};

const STATUS_META: Record<string, { label: string; colorClass: string }> = {
  pending:       { label: "PENDING",     colorClass: "sc-pending"  },
  "in-progress": { label: "IN PROGRESS", colorClass: "sc-progress" },
  resolved:      { label: "RESOLVED",    colorClass: "sc-resolved" },
};

const NAV_ITEMS: Array<{ id: ViewId; label: string; group: "Operations" | "Team" }> = [
  { id: "overview",  label: "Overview",  group: "Operations" },
  { id: "dispatch",  label: "Dispatch",  group: "Operations" },
  { id: "incidents", label: "Incidents", group: "Operations" },
  { id: "citizenChat", label: "Citizen Chat", group: "Operations" },
  { id: "alerts",    label: "Alerts",    group: "Operations" },
  { id: "team",      label: "Team",      group: "Team"       },
];

const TYPE_LIST = ["fire", "flood", "medical", "crime", "accident", "other"] as const;

// ─── Icons ────────────────────────────────────────────────────────────────────

const ICONS: Record<string, string> = {
  shield:    "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  radar:     "M12 2a10 10 0 1 0 10 10M12 6a6 6 0 0 0 0 12M12 10a2 2 0 0 0 0 4M12 2v10",
  clipboard: "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M8 2h8v4H8z",
  bell:      "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0",
  users:     "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 8 0a4 4 0 0 0-8 0M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  gauge:     "M12 2a10 10 0 1 0 10 10M12 12l4.5-4.5M12 12a1.5 1.5 0 0 1-1.5-1.5",
  menu:      "M3 12h18M3 6h18M3 18h18",
  x:         "M18 6L6 18M6 6l12 12",
  mapPin:    "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
  user:      "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0-4 4v2M12 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  signOut:   "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
};

const NAV_ICON_MAP: Record<ViewId, string> = {
  overview:  ICONS.gauge,
  dispatch:  ICONS.radar,
  incidents: ICONS.clipboard,
  citizenChat: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  alerts:    ICONS.bell,
  team:      ICONS.users,
};

const SvgIcon = ({ path, size = 16 }: { path: string; size?: number }) => (
  <svg
    width={size} height={size}
    viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round"
  >
    <path d={path} />
  </svg>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const STYLES = `
:root {
  --primary:        #0066FF;
  --success:        #00B074;
  --warning:        #FF9500;
  --danger:         #FF3B30;
  --bg:             #0d1117;
  --surface:        rgba(15,21,33,0.82);
  --border:         rgba(255,255,255,0.07);
  --text:           #eef0f7;
  --text-secondary: rgba(238,240,247,0.55);
  --text-tertiary:  rgba(238,240,247,0.28);
}

* { box-sizing: border-box; margin: 0; padding: 0; }

@keyframes fadeIn  { from { opacity: 0; transform: translateY(8px);   } to { opacity: 1; transform: none; } }
@keyframes slideIn { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: none; } }
@keyframes pulse   { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
@keyframes spin    { to { transform: rotate(360deg); } }

.rd-portal {
    position: fixed; inset: 0; z-index: 9000; overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: var(--text); background: var(--bg);
  }

.rd-bg {
  position: absolute; inset: 0; z-index: 0;
  background-size: cover; background-position: center; background-repeat: no-repeat; pointer-events: none;
}
.rd-bg::after { content: ''; position: absolute; inset: 0; background: rgba(8,12,20,0.93); }

.rd-shell { display: flex; height: 100dvh; width: 100%; position: relative; z-index: 0; min-height: 0; }

.rd-overlay { display: none; position: fixed; inset: 0; z-index: 1; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); }
.rd-overlay.open { display: block; }

/* ── Sidebar ── */
.rd-sidebar {
   width: 260px; flex-shrink: 0;
   background: var(--surface); border-right: 1px solid var(--border);
   display: flex; flex-direction: column; height: 100%; overflow: hidden;
   transition: transform 0.3s ease; box-shadow: 0 4px 16px rgba(0,0,0,0.04);
   position: fixed; left: 0; top: 0; z-index: 2;
 }

.rd-logo {
  padding: 20px 16px; display: flex; align-items: center; gap: 12px;
  flex-shrink: 0; border-bottom: 1px solid var(--border);
}
.rd-logo-img  { width: 40px; height: 40px; object-fit: contain; border-radius: 8px; }
.rd-logo-name { font-size: 15px; font-weight: 700; color: var(--text); white-space: nowrap; }
.rd-logo-sub  { font-size: 11px; color: var(--text-tertiary); margin-top: 3px; display: flex; align-items: center; gap: 6px; }

.rd-pip { display: inline-block; width: 5px; height: 5px; border-radius: 50%; background: var(--success); animation: pulse 2s ease infinite; flex-shrink: 0; }

.rd-sidebar-close {
  display: none; margin-left: auto; flex-shrink: 0;
  background: transparent; border: 1px solid var(--border); border-radius: 6px;
  width: 28px; height: 28px; align-items: center; justify-content: center;
  color: var(--text-tertiary); cursor: pointer; transition: all 0.2s;
}
.rd-sidebar-close:hover { background: var(--bg); color: var(--text); border-color: var(--text-secondary); }

.rd-nav-scroll { flex: 1; overflow-y: auto; padding: 8px 10px; scrollbar-width: thin; scrollbar-color: var(--border) transparent; }

.rd-nav-group {
  font-size: 11px; font-weight: 600; color: var(--text-tertiary);
  letter-spacing: 0.5px; text-transform: uppercase;
  padding: 12px 8px 6px; display: flex; align-items: center; gap: 8px;
}
.rd-nav-group::after { content: ''; flex: 1; height: 1px; background: var(--border); }

.rd-nav-btn {
  display: flex; align-items: center; gap: 10px; width: 100%;
  padding: 10px 12px; border-radius: 8px; border: 1px solid transparent;
  font-size: 13px; font-weight: 500; color: var(--text-secondary);
  background: transparent; cursor: pointer; margin-bottom: 2px;
  text-align: left; transition: all 0.2s; position: relative; touch-action: manipulation; -webkit-tap-highlight-color: transparent;
}
.rd-nav-btn:hover        { background: var(--bg); color: var(--text); border-color: var(--border); }
.rd-nav-btn.active       { background: linear-gradient(135deg, var(--primary) 0%, #0052cc 100%); color: white; border-color: transparent; font-weight: 600; box-shadow: 0 2px 8px rgba(0,102,255,0.2); }
.rd-nav-btn.active.team-nav { background: linear-gradient(135deg, var(--success) 0%, #00945a 100%); box-shadow: 0 2px 8px rgba(0,176,116,0.2); }

.rd-nav-ic { font-size: 16px; flex-shrink: 0; color: var(--text-tertiary); transition: color 0.2s; display: flex; align-items: center; }
.rd-nav-btn.active .rd-nav-ic { color: white; }

.rd-badge      { margin-left: auto; background: var(--danger);  color: white; font-size: 10px; min-width: 20px; height: 20px; border-radius: 10px; padding: 0 6px; display: flex; align-items: center; justify-content: center; animation: pulse 2s ease infinite; font-weight: 600; }
.rd-badge-blue { margin-left: auto; background: var(--primary); color: white; font-size: 10px; min-width: 20px; height: 20px; border-radius: 10px; padding: 0 6px; display: flex; align-items: center; justify-content: center; font-weight: 600; }

.rd-sidebar-foot { padding: 12px 10px 16px; border-top: 1px solid var(--border); flex-shrink: 0; }

.rd-user-card { display: flex; align-items: center; gap: 10px; padding: 12px; background: var(--bg); border: 1px solid var(--border); border-radius: 8px; margin-bottom: 8px; }
.rd-avatar    { width: 32px; height: 32px; border-radius: 6px; flex-shrink: 0; background: linear-gradient(135deg, var(--primary) 0%, #0052cc 100%); display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 11px; color: white; }
.rd-user-name { font-size: 13px; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rd-user-role { font-size: 10px; color: var(--success); display: flex; align-items: center; gap: 5px; margin-top: 2px; }

.rd-logout-btn { display: flex; align-items: center; gap: 8px; width: 100%; padding: 9px 12px; background: var(--bg); border: 1px solid var(--border); border-radius: 8px; font-size: 13px; font-weight: 500; color: var(--text-secondary); cursor: pointer; transition: all 0.2s; }
.rd-logout-btn:hover { background: var(--danger); color: white; border-color: var(--danger); }

/* ── Main ── */
.rd-main { margin-left: 260px; flex: 1; display: flex; flex-direction: column; position: relative; z-index: 1; height: 100%; min-width: 0; overflow: hidden; background: transparent; }

.rd-topbar { height: 56px; display: flex; align-items: center; padding: 0 24px; background: var(--surface); border-bottom: 1px solid var(--border); position: relative; z-index: 100; gap: 12px; flex-shrink: 0; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }

.rd-hamburger { display: none; background: var(--bg); border: 1px solid var(--border); border-radius: 6px; width: 32px; height: 32px; align-items: center; justify-content: center; color: var(--text-secondary); cursor: pointer; transition: all 0.2s; flex-shrink: 0; touch-action: manipulation; -webkit-tap-highlight-color: transparent; }
.rd-hamburger:hover { background: var(--surface); border-color: var(--text-secondary); color: var(--text); }

.rd-crumb        { display: flex; align-items: center; gap: 7px; font-size: 12px; color: var(--text-tertiary); }
.rd-crumb-sep    { color: var(--text-tertiary); }
.rd-crumb-active { color: var(--text); font-weight: 600; }

.rd-topbar-right { margin-left: auto; display: flex; align-items: center; gap: 12px; flex-shrink: 0; }

.rd-clock    { font-size: 12px; font-weight: 500; color: var(--text-secondary); background: var(--bg); border: 1px solid var(--border); border-radius: 6px; padding: 6px 12px; white-space: nowrap; }
.rd-icon-btn { width: 32px; height: 32px; border-radius: 6px; border: 1px solid var(--border); background: transparent; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); cursor: pointer; font-size: 16px; transition: all 0.2s; position: relative; }
.rd-icon-btn:hover { background: var(--bg); color: var(--text); border-color: var(--text-secondary); }

.rd-notif-wrap { position: relative; }
.rd-notif-dot  { position: absolute; top: 6px; right: 6px; width: 6px; height: 6px; border-radius: 50%; background: var(--danger); border: 1px solid var(--surface); animation: pulse 1.5s ease infinite; }

.rd-page { flex: 1; padding: 24px; overflow-y: auto; overflow-x: hidden; min-width: 0; scrollbar-width: thin; scrollbar-color: var(--border) transparent; }
.rd-page > div { animation: fadeIn 0.4s ease-out both; }

/* ── Overview ── */
.rd-ov-hd { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; margin-bottom: 24px; }

.rd-eyebrow { font-size: 11px; color: var(--primary); letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 6px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
.rd-eyebrow::before { content: ''; display: block; width: 20px; height: 2px; background: var(--primary); }

.rd-title { font-size: 32px; color: var(--text); letter-spacing: -0.5px; line-height: 1.1; font-weight: 700; }

.rd-live     { display: flex; align-items: center; gap: 6px; font-size: 11px; padding: 6px 12px; border-radius: 6px; border: 1px solid var(--danger); background: rgba(255,59,48,0.06); color: var(--danger); letter-spacing: 0.3px; white-space: nowrap; font-weight: 600; }
.rd-live-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--danger); animation: pulse 1.4s ease infinite; }

/* ── Stat Grid ── */
.rd-stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 24px; }

.rd-stat { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 20px; position: relative; overflow: hidden; transition: all 0.3s; cursor: default; animation: fadeIn 0.5s ease-out both; }
.rd-stat:nth-child(2) { animation-delay: 0.05s; }
.rd-stat:nth-child(3) { animation-delay: 0.10s; }
.rd-stat:nth-child(4) { animation-delay: 0.15s; }
.rd-stat:hover            { transform: translateY(-4px); border-color: var(--primary); box-shadow: 0 8px 16px rgba(0,102,255,0.1); }
.rd-stat.rd-stat-clickable { cursor: pointer; }
.rd-stat.rd-stat-clickable:hover { transform: translateY(-4px) scale(1.01); }
.rd-stat::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; }

.rd-stat-icon  { font-size: 20px; margin-bottom: 12px; opacity: 0.8; }
.rd-stat-num   { font-size: 32px; line-height: 1; margin-bottom: 6px; letter-spacing: -0.5px; font-weight: 700; }
.rd-stat-label { font-size: 11px; color: var(--text-secondary); letter-spacing: 0.3px; text-transform: uppercase; font-weight: 500; }
.rd-stat-tag   { position: absolute; top: 12px; right: 12px; font-size: 9px; border: 1px solid currentColor; border-radius: 4px; padding: 2px 6px; opacity: 0.5; }

.rd-stat.sv-red   ::before, .rd-stat.sv-red   .rd-stat-num, .rd-stat.sv-red   .rd-stat-icon, .rd-stat.sv-red   .rd-stat-tag { color: var(--danger);  }
.rd-stat.sv-amber .rd-stat-num, .rd-stat.sv-amber .rd-stat-icon, .rd-stat.sv-amber .rd-stat-tag { color: var(--warning); }
.rd-stat.sv-blue  .rd-stat-num, .rd-stat.sv-blue  .rd-stat-icon, .rd-stat.sv-blue  .rd-stat-tag { color: var(--primary); }
.rd-stat.sv-green .rd-stat-num, .rd-stat.sv-green .rd-stat-icon, .rd-stat.sv-green .rd-stat-tag { color: var(--success); }
.rd-stat.sv-red::before   { background: var(--danger);  }
.rd-stat.sv-amber::before { background: var(--warning); }
.rd-stat.sv-blue::before  { background: var(--primary); }
.rd-stat.sv-green::before { background: var(--success); }

/* ── Panels ── */
.rd-panels-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
@media (max-width: 1120px) { .rd-panels-row { grid-template-columns: 1fr; } }

.rd-panel { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 20px; position: relative; overflow: hidden; min-width: 0; animation: slideIn 0.5s ease-out both; }
.rd-panel:nth-child(2) { animation-delay: 0.1s; }
.rd-panel.pa-red::before  { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: var(--danger);  }
.rd-panel.pa-blue::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: var(--primary); }

.rd-panel-hd    { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--border); }
.rd-panel-title { font-size: 11px; color: var(--text-secondary); letter-spacing: 0.5px; text-transform: uppercase; font-weight: 600; }
.rd-panel-tag   { font-size: 9px; color: var(--primary); border: 1px solid var(--primary); border-radius: 4px; padding: 3px 8px; background: rgba(0,102,255,0.05); font-weight: 600; }

/* ── Incident Items ── */
.rd-inc-item { padding: 14px 0; border-bottom: 1px solid var(--border); }
.rd-inc-item:last-child { border-bottom: none; padding-bottom: 0; }
.rd-inc-row  { display: flex; align-items: flex-start; gap: 12px; }

.rd-inc-icon { width: 36px; height: 36px; border-radius: 8px; flex-shrink: 0; border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 16px; }
.rd-inc-icon.tc-fire     { background: rgba(255, 59, 48,  0.08); }
.rd-inc-icon.tc-accident { background: rgba(255,149,  0,  0.08); }
.rd-inc-icon.tc-flood    { background: rgba(  0,102,255,  0.08); }
.rd-inc-icon.tc-crime    { background: rgba(255, 45, 85,  0.08); }
.rd-inc-icon.tc-medical  { background: rgba(  0,176,116,  0.08); }
.rd-inc-icon.tc-other    { background: rgba(155,155,155,  0.08); }

.rd-inc-body { flex: 1; min-width: 0; }
.rd-inc-type { font-size: 13px; font-weight: 700; text-transform: capitalize; display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
.rd-inc-type.tc-fire     { color: var(--danger);  }
.rd-inc-type.tc-accident { color: var(--warning); }
.rd-inc-type.tc-flood    { color: var(--primary); }
.rd-inc-type.tc-crime    { color: #FF2D55;         }
.rd-inc-type.tc-medical  { color: var(--success); }
.rd-inc-type.tc-other    { color: #9B9B9B;         }

.rd-inc-loc   { font-size: 12px; color: var(--text-secondary); display: flex; align-items: center; gap: 5px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.rd-inc-pills { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.rd-inc-time  { font-size: 10px; color: var(--text-tertiary); margin-top: 6px; }

.rd-pill     { font-size: 10px; padding: 4px 10px; border-radius: 6px; border: 1px solid; display: flex; align-items: center; gap: 5px; }
.rd-pill-dot { width: 4px; height: 4px; border-radius: 50%; flex-shrink: 0; }
.rd-pill.sc-pending  { background: rgba(255,59, 48,0.08); color: var(--danger);  border-color: var(--danger);  }
.rd-pill.sc-progress { background: rgba(255,149, 0,0.08); color: var(--warning); border-color: var(--warning); }
.rd-pill.sc-resolved { background: rgba(  0,176,116,0.08); color: var(--success); border-color: var(--success); }
.rd-pill.sc-pending  .rd-pill-dot { background: var(--danger);  }
.rd-pill.sc-progress .rd-pill-dot { background: var(--warning); }
.rd-pill.sc-resolved .rd-pill-dot { background: var(--success); }
.rd-pill-neutral { background: var(--bg); color: var(--text-secondary); border-color: var(--border); }

/* ── Bar Chart ── */
.rd-bar-item  { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.rd-bar-item:last-child { margin-bottom: 0; }
.rd-bar-label { font-size: 12px; color: var(--text-secondary); width: 70px; flex-shrink: 0; display: flex; align-items: center; gap: 6px; font-weight: 500; }
.rd-bar-track { flex: 1; height: 5px; border-radius: 3px; background: var(--border); overflow: hidden; }
.rd-bar-fill  { height: 100%; border-radius: 3px; transition: width 1.2s cubic-bezier(0.4,0,0.2,1); }
.rd-bar-fill.tc-fire     { background: var(--danger);  }
.rd-bar-fill.tc-accident { background: var(--warning); }
.rd-bar-fill.tc-flood    { background: var(--primary); }
.rd-bar-fill.tc-crime    { background: #FF2D55;         }
.rd-bar-fill.tc-medical  { background: var(--success); }
.rd-bar-fill.tc-other    { background: #9B9B9B;         }
.rd-bar-val { font-size: 12px; color: var(--text-secondary); width: 20px; text-align: right; flex-shrink: 0; font-weight: 500; }

/* ── Quick Actions ── */
.rd-qgrid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 14px; }
.rd-qbtn  { display: flex; align-items: center; gap: 8px; padding: 12px; background: var(--bg); border: 1px solid var(--border); border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 600; color: var(--text-secondary); text-align: left; transition: all 0.2s; }
.rd-qbtn:hover { color: var(--text); transform: translateY(-2px); border-color: var(--text-secondary); }
.rd-qbtn-ic { width: 28px; height: 28px; border-radius: 6px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 14px; border: 1px solid var(--border); }
.rd-qbtn.qv-red   .rd-qbtn-ic { background: rgba(255, 59,48,0.08);  border-color: var(--danger);  color: var(--danger);  }
.rd-qbtn.qv-blue  .rd-qbtn-ic { background: rgba(  0,102,255,0.08); border-color: var(--primary); color: var(--primary); }
.rd-qbtn.qv-amber .rd-qbtn-ic { background: rgba(255,149, 0,0.08);  border-color: var(--warning); color: var(--warning); }
.rd-qbtn.qv-green .rd-qbtn-ic { background: rgba(  0,176,116,0.08); border-color: var(--success); color: var(--success); }

.rd-divider { border: none; border-top: 1px solid var(--border); margin: 14px 0; }

/* ── Utility ── */
.rd-spinner { display: inline-block; width: 16px; height: 16px; border-radius: 50%; border: 2px solid var(--border); border-top-color: var(--primary); animation: spin 0.8s linear infinite; }
.rd-empty   { text-align: center; padding: 48px 24px; font-size: 12px; letter-spacing: 0.3px; color: var(--text-secondary); text-transform: uppercase; }

/* ── Modal ── */
.rd-modal-backdrop { position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; padding: 24px; }
.rd-modal          { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; width: 100%; max-width: 520px; max-height: 80vh; display: flex; flex-direction: column; box-shadow: 0 24px 48px rgba(0,0,0,0.2); animation: fadeIn 0.2s ease-out; }
.rd-modal-hd       { display: flex; align-items: center; justify-content: space-between; padding: 20px 20px 16px; border-bottom: 1px solid var(--border); flex-shrink: 0; }
.rd-modal-title    { font-size: 15px; font-weight: 700; color: var(--text); display: flex; align-items: center; gap: 8px; }
.rd-modal-badge    { font-size: 11px; font-weight: 700; background: var(--primary); color: white; border-radius: 20px; padding: 2px 10px; }
.rd-modal-close    { width: 28px; height: 28px; border-radius: 6px; border: 1px solid var(--border); background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--text-tertiary); transition: all 0.2s; font-size: 16px; }
.rd-modal-close:hover { background: var(--bg); color: var(--text); }
.rd-modal-body     { flex: 1; overflow-y: auto; padding: 8px 20px 20px; scrollbar-width: thin; }
.rd-modal-item     { padding: 14px 0; border-bottom: 1px solid var(--border); }
.rd-modal-item:last-child { border-bottom: none; }
.rd-modal-row      { display: flex; align-items: flex-start; gap: 12px; }
.rd-modal-icon           { width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 18px; border: 1px solid var(--border); }
.rd-modal-icon.tc-fire     { background: rgba(255, 59, 48,  0.08); }
.rd-modal-icon.tc-accident { background: rgba(255,149,  0,  0.08); }
.rd-modal-icon.tc-flood    { background: rgba(  0,102,255,  0.08); }
.rd-modal-icon.tc-crime    { background: rgba(255, 45, 85,  0.08); }
.rd-modal-icon.tc-medical  { background: rgba(  0,176,116,  0.08); }
.rd-modal-icon.tc-other    { background: rgba(155,155,155,  0.08); }
.rd-modal-info     { flex: 1; min-width: 0; }
.rd-modal-type     { font-size: 14px; font-weight: 700; text-transform: capitalize; margin-bottom: 3px; }
.rd-modal-loc      { font-size: 12px; color: var(--text-secondary); margin-bottom: 6px; display: flex; align-items: center; gap: 4px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.rd-modal-desc     { font-size: 12px; color: var(--text-secondary); margin-bottom: 6px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.rd-modal-meta     { display: flex; flex-direction: column; gap: 3px; margin-top: 4px; }
.rd-modal-reporter { font-size: 11px; color: var(--text-secondary); display: flex; align-items: center; gap: 4px; }
.rd-modal-time     { font-size: 11px; color: var(--text-tertiary); margin-top: 4px; }
.rd-modal-empty    { text-align: center; padding: 40px 20px; color: var(--text-secondary); font-size: 13px; }

.rd-resolve-btn {
  display: inline-flex; align-items: center; gap: 6px;
  margin-top: 10px; padding: 7px 14px;
  background: rgba(0,176,116,0.08); color: var(--success);
  border: 1px solid var(--success); border-radius: 7px;
  font-size: 12px; font-weight: 600; cursor: pointer;
  transition: all 0.2s;
}
.rd-resolve-btn:hover:not(:disabled) { background: var(--success); color: white; }
.rd-resolve-btn:disabled { opacity: 0.6; cursor: not-allowed; }

/* ── Responsive ── */
@media (max-width: 768px) {
    .rd-sidebar { transform: translateX(-100%); width: min(280px, 90vw); box-shadow: 4px 0 12px rgba(0,0,0,0.1); }
    .rd-sidebar.open { transform: translateX(0); }
    .rd-sidebar-close { display: flex; min-width: 44px; min-height: 44px; }
    .rd-hamburger { display: flex; min-width: 44px; min-height: 44px; align-items: center; justify-content: center; }
    .rd-main { margin-left: 0; background: var(--bg); min-height: 0; }
    .rd-topbar { padding: 0 16px; min-height: 56px; }
    .rd-crumb-hide, .rd-clock { display: none; }
    .rd-page { padding: 16px; -webkit-overflow-scrolling: touch; overscroll-behavior: contain; }
    .rd-title { font-size: 26px; }
    .rd-stat-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .rd-stat-num { font-size: 24px; }
    .rd-qgrid { grid-template-columns: 1fr; }
  }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function usePHTClock(): string {
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () => {
      const n = new Date();
      const p = (v: number) => String(v).padStart(2, "0");
      setTime(`${p(n.getHours())}:${p(n.getMinutes())}:${p(n.getSeconds())} PHT`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

function formatRelative(ts: string): string {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(ts).toLocaleDateString();
}

function cls(...args: (string | false | null | undefined)[]): string {
  return args.filter(Boolean).join(" ");
}

// ─── Overview Panel ───────────────────────────────────────────────────────────

interface OverviewPanelProps {
  onNavigate: (v: ViewId) => void;
  responderId: string;
  responderDepartment: string | null;
}

function OverviewPanel({ onNavigate, responderId, responderDepartment }: OverviewPanelProps) {
  const [stats, setStats] = useState({ assigned: 0, pending: 0, inProgress: 0, resolved: 0 });
  const [myReports, setMyReports] = useState<Report[]>([]);
  const [inProgressReports, setInProgressReports] = useState<Report[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [typeCounts, setTypeCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<Set<string>>(new Set());

  const resolveReport = async (id: string | number) => {
    const key = String(id);
    setResolving((prev) => new Set(prev).add(key));
    try {
      const { error } = await supabase
        .from("reports")
        .update({ status: "resolved" })
        .eq("id", id);
      if (error) console.error("Resolve error:", error.message);
    } finally {
      setResolving((prev) => { const s = new Set(prev); s.delete(key); return s; });
    }
  };

  const loadData = useCallback(async () => {
    if (!responderId) { setLoading(false); return; }
    try {
      const { data, error } = await supabase
        .from("reports")
        // department column not yet live — "column reports.department does not exist"
        // caused this entire load to fail (blank Overview). Type carries the same
        // routing value; filter by type-derived department when available.
        .select("id,type,description,description_lang,description_translated,location,address,reporter_name,reporter_contact,status,evidence_url,created_at,responder_id")
        .order("created_at", { ascending: false });

      if (error) { console.error("Overview loadData error:", error.message); return; }

      const rows: Report[] = (data ?? []) as Report[];
      // Filter by responder's department if set — but department column doesn't exist
      // live yet, so derive department from `type` (migration maps type → department).
      // Fall back to showing all if no department info is present.
      const getDept = (r: Report) => (r as any).department ?? (r as any).type ?? null;
      const deptFiltered = responderDepartment
        ? rows.filter((r) => { const d = getDept(r); return d === responderDepartment || !d; })
        : rows;
      const mine = deptFiltered.filter((r) => r.responder_id === responderId);
      const counts: Record<string, number> = {};
      mine.forEach((r) => { counts[r.type] = (counts[r.type] ?? 0) + 1 });

      setStats({
        assigned:   mine.length,
        pending:    deptFiltered.filter((r) => r.status === "pending" && !r.responder_id).length,
        inProgress: mine.filter((r) => r.status === "in-progress").length,
        resolved:   mine.filter((r) => r.status === "resolved").length,
      });
      setMyReports(mine.slice(0, 6));
      setInProgressReports(mine.filter((r) => r.status === "in-progress"));
      setTypeCounts(counts);
    } finally {
      setLoading(false);
    }
  }, [responderId, responderDepartment]);

  useEffect(() => {
    loadData();
    const overviewId = `resp-overview-${Math.random().toString(36).slice(2, 9)}`;
    const ch = supabase
      .channel(overviewId)
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, loadData)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [loadData]);

  const maxCount = Math.max(...TYPE_LIST.map((t) => typeCounts[t] ?? 0), 1);

  const statCards = [
    { label: "My Assignments", value: stats.assigned,   colorClass: "sv-red",   tag: "TOTAL", icon: "🛡️", nav: "incidents" as ViewId, modal: false },
    { label: "Unassigned",     value: stats.pending,    colorClass: "sv-amber", tag: "OPEN",  icon: "⚠️", nav: "incidents" as ViewId, modal: false },
    { label: "In Progress",    value: stats.inProgress, colorClass: "sv-blue",  tag: undefined, icon: "⏱️", nav: undefined,            modal: true  },
    { label: "Resolved",       value: stats.resolved,   colorClass: "sv-green", tag: undefined, icon: "✓", nav: "incidents" as ViewId, modal: false },
  ];

  const quickNav = [
    { id: "dispatch"  as ViewId, label: "Dispatch",  colorClass: "qv-red",   icon: "📡" },
    { id: "incidents" as ViewId, label: "Incidents", colorClass: "qv-blue",  icon: "📋" },
    { id: "alerts"    as ViewId, label: "Alerts",    colorClass: "qv-amber", icon: "🔔" },
    { id: "team"      as ViewId, label: "Team",      colorClass: "qv-green", icon: "👥" },
  ];

  return (
    <div>
      <div className="rd-ov-hd">
        <div>
          <div className="rd-eyebrow">Responder Panel</div>
          <div className="rd-title">Dashboard</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {loading && <div className="rd-spinner" />}
          <div className="rd-live"><span className="rd-live-dot" />LIVE</div>
        </div>
      </div>

      <div className="rd-stat-grid">
        {statCards.map((c) => (
          <div
            key={c.label}
            className={cls("rd-stat", c.colorClass, (c.modal || c.nav) && "rd-stat-clickable")}
            onClick={() => c.modal ? setShowModal(true) : c.nav && onNavigate(c.nav)}
          >
            <div className="rd-stat-icon">{c.icon}</div>
            <div className="rd-stat-num">{loading ? "—" : c.value}</div>
            <div className="rd-stat-label">{c.label}</div>
            {c.tag && <span className="rd-stat-tag">{c.tag}</span>}
          </div>
        ))}
      </div>

      <div className="rd-panels-row">
        {/* Assignments panel */}
        <div className="rd-panel pa-red" style={{ maxHeight: 480, overflowY: "auto" }}>
          <div className="rd-panel-hd">
            <span className="rd-panel-title">My Assignments</span>
            <span className="rd-panel-tag">ASSIGNED</span>
          </div>
          {loading ? (
            <div className="rd-empty"><div className="rd-spinner" style={{ margin: "0 auto" }} /></div>
          ) : myReports.length === 0 ? (
            <div className="rd-empty">NO ASSIGNMENTS</div>
          ) : myReports.map((r) => {
            const tm = TYPE_META[r.type] ?? TYPE_META.other;
            const sm = STATUS_META[r.status] ?? STATUS_META.pending;
            return (
              <div key={String(r.id)} className="rd-inc-item">
                <div className="rd-inc-row">
                  <div className={cls("rd-inc-icon", tm.colorClass)}>{tm.icon}</div>
                  <div className="rd-inc-body">
                    <div className={cls("rd-inc-type", tm.colorClass)}>{r.type}</div>
                    <div className="rd-inc-loc">📍 {r.address || r.location || "—"}</div>
                    <div className="rd-inc-pills">
                      <span className={cls("rd-pill", sm.colorClass)}>
                        <span className="rd-pill-dot" />{sm.label}
                      </span>
                      {r.reporter_name && (
                        <span className="rd-pill rd-pill-neutral">👤 {r.reporter_name}</span>
                      )}
                    </div>
                    <div className="rd-inc-time">{formatRelative(r.created_at)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Breakdown + Quick Actions panel */}
        <div className="rd-panel pa-blue">
          <div className="rd-panel-hd">
            <span className="rd-panel-title">Incident Breakdown</span>
            <span className="rd-panel-tag">BY TYPE</span>
          </div>
          {TYPE_LIST.map((t) => {
            const tm = TYPE_META[t] ?? TYPE_META.other;
            const count = typeCounts[t] ?? 0;
            return (
              <div key={t} className="rd-bar-item">
                <span className="rd-bar-label">
                  <span>{tm.icon}</span>
                  <span style={{ textTransform: "capitalize" }}>{t}</span>
                </span>
                <div className="rd-bar-track">
                  <div className={cls("rd-bar-fill", tm.colorClass)} style={{ width: `${(count / maxCount) * 100}%` }} />
                </div>
                <span className="rd-bar-val">{count}</span>
              </div>
            );
          })}

          <hr className="rd-divider" />
          <div className="rd-panel-title" style={{ marginBottom: 12 }}>Quick Actions</div>
          <div className="rd-qgrid">
            {quickNav.map((q) => (
              <button key={q.id} className={cls("rd-qbtn", q.colorClass)} onClick={() => onNavigate(q.id)}>
                <span className="rd-qbtn-ic">{q.icon}</span>
                {q.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* In-progress modal */}
      {showModal && (
        <div className="rd-modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="rd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rd-modal-hd">
              <div className="rd-modal-title">
                ⏱️ In Progress Incidents
                <span className="rd-modal-badge">{inProgressReports.length}</span>
              </div>
              <button className="rd-modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="rd-modal-body">
              {inProgressReports.length === 0 ? (
                <div className="rd-modal-empty">No in-progress incidents</div>
              ) : inProgressReports.map((r) => {
                const tm = TYPE_META[r.type] ?? TYPE_META.other;
                return (
                  <div key={String(r.id)} className="rd-modal-item">
                    <div className="rd-modal-row">
                      <div className={cls("rd-modal-icon", tm.colorClass)}>{tm.icon}</div>
                      <div className="rd-modal-info">
                        <div className={cls("rd-modal-type", tm.colorClass)}>{r.type}</div>
                        <div className="rd-modal-loc">📍 {r.address || r.location || "No location"}</div>
                        {r.description && (
                          <TranslatedDescription
                            description={r.description}
                            descriptionLang={r.description_lang}
                            descriptionTranslated={r.description_translated}
                            className="rd-modal-desc"
                          />
                        )}
                        <div className="rd-modal-meta">
                          {r.reporter_name    && <span className="rd-modal-reporter">👤 {r.reporter_name}</span>}
                          {r.reporter_contact && <span className="rd-modal-reporter">📞 {r.reporter_contact}</span>}
                        </div>
                        <div className="rd-modal-time">{formatRelative(r.created_at)}</div>
                        <button
                          className="rd-resolve-btn"
                          disabled={resolving.has(String(r.id))}
                          onClick={() => resolveReport(r.id)}
                        >
                          {resolving.has(String(r.id))
                            ? <><span className="rd-spinner" style={{ width: 12, height: 12, borderWidth: 1.5 }} /> Resolving…</>
                            : <>✓ Mark as Resolved</>
                          }
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

const PAGE_TITLE: Record<ViewId, string> = {
  overview: "Overview", dispatch: "Dispatch",
  incidents: "Incidents", citizenChat: "Citizen Chat", alerts: "Alerts", team: "Team",
};

export default function RespondersDashboard() {
  const navigate = useNavigate();
  const clock    = usePHTClock();

  const [view,          setView]          = useState<ViewId>("overview");
  const [pendingCount,  setPendingCount]  = useState(0);
  const [alertCount,    setAlertCount]    = useState(0);
  const [responderName, setResponderName] = useState("Responder");
  const [responderId,   setResponderId]   = useState("");
  const [responderDepartment, setResponderDepartment] = useState<string | null>(null);
  const { notifications, unreadCount: deptUnreadCount, markAsRead: markDeptRead, clearNotifications: clearDeptNotifications } = useDepartmentNotifications(responderDepartment, responderId || null);
  const [sidebarOpen,   setSidebarOpen]   = useState(false);
  const [authReady,     setAuthReady]     = useState(false);
  const [isChatOpen,    setIsChatOpen]    = useState(false);
  const [chatUnread,    setChatUnread]    = useState(0);
  usePresence(responderId || null, "responder", !!responderId && authReady);
  // Heartbeat keeps profiles.is_online/last_seen fresh while the dashboard is
  // open so citizens see this responder in their online list (usePresence).
  // Previously imported but never called — the row went stale ~4 min after load.
  useHeartbeat(responderId || null, "responder", !!responderId && authReady);

  // Best-effort offline mark when the tab closes (logout button already calls
  // markOffline). Realtime Presence leave also removes them from the live set.
  useEffect(() => {
    if (!responderId) return;
    const onUnload = () => { void markOffline(responderId, "responder"); };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [responderId]);
  const [citizenChatOpen, setCitizenChatOpen] = useState(false);
  const [citizenChatTarget, setCitizenChatTarget] = useState<{
    reportId: string; citizenId: string | null; citizenName: string;
  } | null>(null);

  // Track when the user last viewed alerts so we only badge NEW ones.
  // Guarded: localStorage throws in private mode / blocked cookies — a throw
  // during render would unmount the whole dashboard.
  let initialSeen = new Date(0).toISOString();
  try {
    initialSeen = localStorage.getItem("dsg_alerts_last_seen") ?? initialSeen;
  } catch { /* storage unavailable — fall back to epoch */ }
  const lastSeenAlertTime = React.useRef<string>(initialSeen);

  const markAlertsRead = () => {
    const now = new Date().toISOString();
    lastSeenAlertTime.current = now;
    try { localStorage.setItem("dsg_alerts_last_seen", now); } catch { /* ignore */ }
    setAlertCount(0);
  };

  const openCitizenChat = (target?: {
    reportId: string; citizenId: string | null; citizenName: string;
  } | null) => {
    setCitizenChatTarget(target ?? null);
    setCitizenChatOpen(true);
    setSidebarOpen(false);
    // Also switch main view so header shows Citizen Chat and page isn't empty (fixes black screen)
    setView("citizenChat");
  };

  const handleNavigate = (v: ViewId) => {
    setView(v);
    setSidebarOpen(false);
    if (v === "alerts") markAlertsRead();
  };

  // Close sidebar on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSidebarOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Prevent body scroll when any overlay (sidebar or citizen chat) is open on mobile
  useEffect(() => {
    const shouldLock = sidebarOpen || citizenChatOpen || isChatOpen;
    if (shouldLock) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen, citizenChatOpen, isChatOpen]);

  // Also close citizen chat on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setCitizenChatOpen(false); setIsChatOpen(false); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setPendingCount(0);
          setAlertCount(0);
          return;
        }

        setResponderId(user.id);
        try {
          await supabase.from("profiles").update({ status: "on_duty", is_online: true, last_seen: new Date().toISOString() } as any).eq("id", user.id);
        } catch {
          await supabase.from("profiles").update({ status: "on_duty" } as any).eq("id", user.id);
        }

        const { data: profile } = await supabase
          .from("profiles")
          // department column not yet live on profiles either — caused 400
          // "profiles?select=full_name,department". Only select what exists;
          // department will be re-added after migration 20260916000000.
          .select("full_name")
          .eq("id", user.id)
          .single();

        if (profile?.full_name) setResponderName(profile.full_name);
        // Fallback: department not yet provisioned live, keep null so Overview
        // shows all reports (type-based filtering handles it until migration).
        const dept = (profile as any)?.department as string | undefined;
        if (dept) setResponderDepartment(dept);

        const { data: rptData } = await supabase
          .from("reports")
          .select("id")
          .eq("status", "pending")
          .is("responder_id", null);
        setPendingCount((rptData ?? []).length);

        const { data: alData } = await supabase
          .from("alerts")
          .select("id")
          .gt("created_at", lastSeenAlertTime.current)
          .order("created_at", { ascending: false })
          .limit(50);
        setAlertCount((alData ?? []).length);
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setAuthReady(true);
      }
    };

    load();
    const pendingId = `resp-pending-${Math.random().toString(36).slice(2, 9)}`;
    const ch = supabase
      .channel(pendingId)
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "alerts"  }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  // HQ chat unread badge: refresh on mount (once id known) + on any new message.
  // Uses chat_messages (the active side-chat table via useRealtimeChat).
  // Previously listened to `messages` which is stale; now aligned.
  useEffect(() => {
    if (!responderId) return;
    const refresh = async () => {
      const unread = await fetchUnreadCounts(responderId);
      setChatUnread(Object.values(unread.bySender).reduce((a, b) => a + b, 0) + unread.broadcast);
    };
    void refresh();
    const unreadId = `resp-chat-unread-${Math.random().toString(36).slice(2, 9)}`;
    const ch = supabase
      .channel(unreadId)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        () => {
          void refresh();
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.warn("[resp-chat-unread] channel status:", status);
        }
      });
    return () => { supabase.removeChannel(ch); };
  }, [responderId]);

  const handleLogout = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await markOffline(user.id, "responder");
      }
    } catch (err) {
      console.error("Logout status update error:", err);
    }
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  const initials = responderName
    ? responderName.split(" ").map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase()
    : "?";

  const navGroups = [
    { label: "Operations", items: NAV_ITEMS.filter((n) => n.group === "Operations") },
    { label: "Team",       items: NAV_ITEMS.filter((n) => n.group === "Team")       },
  ];

  return (
    <>
      <style>{STYLES}</style>
      <div className="rd-portal">
        <div className="rd-bg" style={{ backgroundImage: `url(${dsgLogo})` }} />
        <div className={cls("rd-overlay", sidebarOpen && "open")} onClick={() => setSidebarOpen(false)} />

        {/* Sidebar */}
        <aside className={cls("rd-sidebar", sidebarOpen && "open")} aria-label="Navigation">
          <div className="rd-logo">
            <img src={dsgLogo} alt="DumaSafeGuide" className="rd-logo-img" />
            <div>
              <div className="rd-logo-name">DumaSafeGuide</div>
              <div className="rd-logo-sub"><span className="rd-pip" />RESPONDER</div>
            </div>
            <button className="rd-sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar">
              <SvgIcon path={ICONS.x} />
            </button>
          </div>

          <nav className="rd-nav-scroll">
            {navGroups.map((g) => (
              <div key={g.label}>
                <div className="rd-nav-group">{g.label}</div>
                {g.items.map((item) => (
                  <button
                    key={item.id}
                    className={cls("rd-nav-btn", view === item.id && "active", item.id === "team" && "team-nav")}
                    onClick={() => {
                      if (item.id === "citizenChat") openCitizenChat();
                      else handleNavigate(item.id);
                    }}
                  >
                    <span className="rd-nav-ic">
                      <SvgIcon path={NAV_ICON_MAP[item.id]} size={16} />
                    </span>
                    <span>{item.label}</span>
                    {item.id === "incidents" && pendingCount > 0 && (
                      <span className="rd-badge">{pendingCount}</span>
                    )}
                    {item.id === "alerts" && alertCount > 0 && view !== "alerts" && (
                      <span className="rd-badge-blue">{alertCount}</span>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </nav>

          <div className="rd-sidebar-foot">
            <div className="rd-user-card">
              <div className="rd-avatar">{initials}</div>
              <div style={{ minWidth: 0 }}>
                <div className="rd-user-name">{responderName}</div>
                <div className="rd-user-role"><span className="rd-pip" />ON DUTY</div>
              </div>
            </div>
            <button className="rd-logout-btn" onClick={handleLogout}>
              <SvgIcon path={ICONS.signOut} /> Sign Out
            </button>
          </div>
        </aside>

        <div className="rd-shell">
          <div className="rd-main">
            <header className="rd-topbar">
              <button className="rd-hamburger" onClick={() => setSidebarOpen(true)} aria-label="Open navigation">
                <SvgIcon path={ICONS.menu} />
              </button>

              <div className="rd-crumb">
                <span className="rd-crumb-hide">DUMASAFEGUIDE</span>
                <span className="rd-crumb-sep rd-crumb-hide">/</span>
                <span className="rd-crumb-hide">RESPONDER</span>
                <span className="rd-crumb-sep rd-crumb-hide">/</span>
                <span className="rd-crumb-active">{PAGE_TITLE[view]}</span>
              </div>

              <div className="rd-topbar-right">
                <span className="rd-clock">{clock}</span>
                <ThemeToggle compact />
                <button
                  id="responder-chat-trigger"
                  onClick={() => { setIsChatOpen(true); setChatUnread(0); }}
                  aria-label="Open HQ direct chat"
                  title="HQ Direct Chat"
                  className="rd-hq-btn"
                >
                  <span style={{ fontSize: 14 }}>💬</span> HQ Direct Chat
                  {chatUnread > 0 && (
                    <span style={{
                      position: "absolute", top: -6, right: -6, minWidth: 17, height: 17, borderRadius: 9,
                      background: "#FF3B30", color: "#fff", fontSize: 9, fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px",
                    }}>
                      {chatUnread > 99 ? "99+" : chatUnread}
                    </span>
                  )}
                </button>
                <div className="rd-notif-wrap">
                  <button className="rd-icon-btn" onClick={() => handleNavigate("alerts")} aria-label="Alerts">
                    <SvgIcon path={ICONS.bell} />
                  </button>
                  {alertCount > 0 && view !== "alerts" && <span className="rd-notif-dot" />}
                </div>
              </div>
            </header>

            <main className="rd-page">
              <Suspense fallback={<ResponderLazyFallback />}>
                {view === "overview" && !authReady && (
                  <div className="rd-empty">
                    <div className="rd-spinner" style={{ margin: "0 auto" }} />
                  </div>
                )}
                {view === "overview"  && authReady && <OverviewPanel onNavigate={handleNavigate} responderId={responderId} responderDepartment={responderDepartment} />}
                {view === "dispatch"  && <Dispatch />}
                {view === "incidents" && <ResponderIncidentsPage onChatCitizen={openCitizenChat} />}
                {view === "alerts"    && <ResponderAlertsPage />}
                {view === "team"      && <ResponderTeamPage />}
                {view === "citizenChat" && (
                  <div style={{ maxWidth: 900, margin: "0 auto" }}>
                    <div className="rd-cc-banner">
                      <div style={{ flex: 1 }}>
                        <div className="rd-cc-eyebrow">Centralized Communications</div>
                        <div className="rd-cc-text">
                          All <strong>online citizens</strong> and assigned cases appear here. Chat, audio, or video call any citizen — they will be notified instantly and can respond to request assistance.
                        </div>
                      </div>
                      <button
                        onClick={() => setCitizenChatOpen(true)}
                        className="rd-cc-open-btn"
                      >
                        💬 Open Citizen Chat
                      </button>
                    </div>
                    {!citizenChatOpen && (
                      <div className="rd-cc-empty">
                        Click <strong>Open Citizen Chat</strong> to see the full conversation list. Citizens who message you also appear automatically in the drawer as <em>Requests</em>.
                        <div className="rd-cc-empty-sub">Responder is on duty — citizens online can see you as available.</div>
                      </div>
                    )}
                    {citizenChatOpen && (
                      <div className="rd-cc-hint">
                        Drawer is open — use the panel on the right to select a citizen. Close it to return here.
                      </div>
                    )}
                  </div>
                )}
              </Suspense>
            </main>
          </div>
        </div>

        {/* Real-time side chat with Admin HQ */}
        <Suspense fallback={null}>
          {responderId && <ResponderChatDrawer responderId={responderId} open={isChatOpen} onClose={() => setIsChatOpen(false)} responderName={responderName} />}
        </Suspense>
        {/* Direct chat with assigned citizens (text + images via chat_messages) */}
        <Suspense fallback={null}>
          {responderId && (
            <ResponderCitizenChatDrawer
              responderId={responderId}
              open={citizenChatOpen}
              onClose={() => setCitizenChatOpen(false)}
              initialReportId={citizenChatTarget?.reportId ?? null}
              initialCitizenId={citizenChatTarget?.citizenId ?? null}
              initialCitizenName={citizenChatTarget?.citizenName ?? null}
            />
          )}
        </Suspense>
        {/* Global inbox for Citizen→Responder calls — always mounted so ringing works even when drawers closed (mobile) */}
        <Suspense fallback={null}>
          {responderId && <GlobalResponderCallHandler responderId={responderId} />}
        </Suspense>
      </div>
    </>
  );
}