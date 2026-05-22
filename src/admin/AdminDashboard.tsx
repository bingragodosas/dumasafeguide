import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../js/supabase";
import {
  FaTachometerAlt,
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
} from "react-icons/fa";

import AdminAlertsPage from "./AdminAlertsPage";
import IncidentsPage from "./IncidentsPage";
import IncidentAnalytics from "./IncidentAnalytics";
import RespondersPage from "./RespondersPage";

import dsgLogo from "../assets/dsg.logo.png";
import adminBg from "../assets/adminbg.png";

type ViewId = "overview" | "incidents" | "alerts" | "responders" | "analytics";

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

const NAV: NavItem[] = [
  { id: "overview",   label: "Overview",   icon: <FaTachometerAlt />, group: "Command"    },
  { id: "incidents",  label: "Incidents",  icon: <FaClipboardList />, group: "Command"    },
  { id: "alerts",     label: "Alerts",     icon: <FaBell />,          group: "Command"    },
  { id: "responders", label: "Responders", icon: <FaUsers />,         group: "Management" },
  { id: "analytics",  label: "Analytics",  icon: <FaChartBar />,      group: "Management" },
];

const TYPE_META: Record<string, { icon: string; color: string }> = {
  fire:     { icon: "🔥", color: "#EF5B5B" },
  accident: { icon: "🚗", color: "#F5C842" },
  flood:    { icon: "🌊", color: "#5B8DEF" },
  crime:    { icon: "🚨", color: "#EF5B9E" },
  medical:  { icon: "🏥", color: "#2ECC8F" },
  other:    { icon: "⚠️", color: "#B0B8CC" },
};

const STATUS_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending:       { label: "PENDING",  color: "#EF5B5B", bg: "rgba(239,91,91,.1)",   border: "rgba(239,91,91,.25)"  },
  "in-progress": { label: "IN PROG",  color: "#F5C842", bg: "rgba(245,200,66,.1)",  border: "rgba(245,200,66,.25)" },
  resolved:      { label: "RESOLVED", color: "#2ECC8F", bg: "rgba(46,204,143,.1)",  border: "rgba(46,204,143,.25)" },
};

const DASH_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=IBM+Plex+Sans:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  /* ── Layout escape: hide global navbar/footer when admin is mounted inside Layout ── */
  body:has(.hud) .navbar-wrapper,
  body:has(.hud) footer,
  body:has(.hud) .layout-body > *:not(.hud-portal),
  body:has(.hud) > footer {
    display: none !important;
  }

  /* Make the hud cover the full viewport regardless of parent */
  .hud-portal {
    position: fixed;
    inset: 0;
    z-index: 9000;
    overflow: hidden;
  }

  .hud {
    display: flex;
    height: 100%;
    width: 100%;
    font-family: 'IBM Plex Sans', sans-serif;
    color: #E8F0FF;
    position: relative;
    overflow: hidden;
  }

  .hud-bg {
    position: absolute; inset: 0; z-index: 0;
    background-image: url('${adminBg}');
    background-size: cover; background-position: center; background-repeat: no-repeat;
  }
  .hud-bg::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(2,12,24,0.97) 0%, rgba(4,15,30,0.93) 40%, rgba(2,12,24,0.96) 100%);
  }

  /* ── Mobile overlay backdrop ── */
  .hud-sidebar-overlay {
    display: none;
    position: fixed; inset: 0; z-index: 190;
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(2px);
  }
  .hud-sidebar-overlay.open { display: block; }

  /* ── Sidebar ── */
  .hud-sidebar {
    width: 280px; flex-shrink: 0;
    background: linear-gradient(180deg, rgba(4,15,30,0.98) 0%, rgba(2,12,24,0.98) 100%);
    display: flex; flex-direction: column;
    height: 100vh; position: fixed; left: 0; top: 0; z-index: 200;
    border-right: 1px solid rgba(214,40,40,0.15);
    overflow: hidden; backdrop-filter: blur(20px);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .hud-sidebar::after {
    content: ''; position: absolute; top: 0; right: 0; width: 1px; height: 100%;
    background: linear-gradient(180deg, #D62828 0%, rgba(214,40,40,0) 35%, rgba(0,212,255,0.5) 65%, rgba(0,212,255,0) 100%);
    pointer-events: none;
  }

  .hud-logo {
    padding: 20px 16px 18px; border-bottom: 1px solid rgba(255,255,255,0.05);
    position: relative; display: flex; align-items: center; gap: 11px;
    flex-shrink: 0; overflow: hidden;
  }
  .hud-logo::after {
    content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, #D62828, rgba(0,212,255,0.5), transparent 70%);
  }
  .hud-logo-img-wrap { position: relative; flex-shrink: 0; width: 38px; height: 38px; }
  .hud-logo-img { width: 38px; height: 38px; object-fit: contain; display: block; position: relative; z-index: 2; }
  .hud-logo-glow {
    position: absolute; inset: -6px; border-radius: 50%;
    background: radial-gradient(circle, rgba(0,212,255,0.22) 0%, rgba(214,40,40,0.12) 50%, transparent 70%);
    z-index: 1; animation: logoGlow 3s ease-in-out infinite;
  }
  .hud-logo-ring {
    position: absolute; inset: -3px; border-radius: 50%;
    border: 1px solid rgba(0,212,255,0.2); z-index: 0;
    animation: ringPulse 3s ease-in-out infinite;
  }
  @keyframes logoGlow { 0%,100% { opacity:.7; transform:scale(1); } 50% { opacity:1; transform:scale(1.08); } }
  @keyframes ringPulse { 0%,100% { opacity:.4; transform:scale(1); } 50% { opacity:.8; transform:scale(1.12); } }

  .hud-logo-text-wrap { flex: 1; min-width: 0; overflow: hidden; }
  .hud-logo-name {
    font-family: 'Syne', sans-serif; font-size: 14.5px; font-weight: 800;
    letter-spacing: -0.5px; line-height: 1.1; color: transparent;
    background: linear-gradient(135deg, #fff 30%, #00D4FF 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text; filter: drop-shadow(0 0 8px rgba(0,212,255,0.4));
    white-space: nowrap; display: block;
  }
  .hud-logo-sub {
    font-family: 'IBM Plex Mono', monospace; font-size: 8px;
    color: rgba(0,212,255,0.4); letter-spacing: 2px; text-transform: uppercase;
    margin-top: 4px; display: flex; align-items: center; gap: 5px;
  }

  /* Close button (mobile only) */
  .hud-sidebar-close {
    display: none;
    margin-left: auto;
    background: none; border: none; cursor: pointer;
    color: rgba(232,240,255,0.4); font-size: 18px; padding: 4px;
    flex-shrink: 0;
  }

  .hud-status-pip {
    width: 5px; height: 5px; border-radius: 50%; background: #2ECC71;
    animation: pip 2s ease infinite; flex-shrink: 0; display: inline-block;
  }
  @keyframes pip { 0%,100% { opacity:1; } 50% { opacity:0.3; } }

  .hud-nav-scroll {
    flex: 1; overflow-y: auto; overflow-x: hidden; padding: 10px 8px; min-height: 0;
  }
  .hud-nav-scroll::-webkit-scrollbar { width: 3px; }
  .hud-nav-scroll::-webkit-scrollbar-thumb { background: rgba(0,212,255,0.1); border-radius: 2px; }

  .hud-nav-label {
    font-family: 'IBM Plex Mono', monospace; font-size: 9px;
    color: rgba(232,240,255,0.25); letter-spacing: 2px; text-transform: uppercase;
    padding: 14px 10px 6px; display: block;
  }
  .hud-nav-item {
    display: flex; align-items: center; gap: 11px; width: 100%; padding: 10px 13px;
    border-radius: 8px; border: 1px solid transparent;
    font-family: 'IBM Plex Sans', sans-serif; font-size: 14px; font-weight: 400;
    cursor: pointer; color: rgba(232,240,255,0.45); background: transparent;
    margin-bottom: 2px; position: relative; overflow: hidden;
    transition: color .15s, background .15s; text-align: left;
  }
  .hud-nav-item:hover { background: rgba(255,255,255,0.04); color: rgba(232,240,255,0.75); }
  .hud-nav-item.active { background: rgba(214,40,40,0.1); border-color: rgba(214,40,40,0.25); color: #fff; font-weight: 500; }
  .hud-nav-item.active::before {
    content: ''; position: absolute; left: 0; top: 0; bottom: 0;
    width: 3px; background: #D62828;
  }
  .hud-nav-item.active .hud-nav-ic { color: #D62828; }
  .hud-nav-ic { font-size: 15px; flex-shrink: 0; color: rgba(232,240,255,0.25); transition: color .15s; }

  .hud-badge {
    margin-left: auto; background: #D62828; color: #fff;
    font-family: 'IBM Plex Mono', monospace; font-size: 9px; font-weight: 700;
    min-width: 18px; height: 18px; border-radius: 9px; padding: 0 5px;
    display: flex; align-items: center; justify-content: center;
  }

  .hud-sidebar-footer { padding: 10px 8px 16px; border-top: 1px solid rgba(255,255,255,0.05); flex-shrink: 0; }
  .hud-user-card {
    display: flex; align-items: center; gap: 10px; padding: 11px 13px;
    background: rgba(0,212,255,0.05); border: 1px solid rgba(0,212,255,0.12);
    border-radius: 9px; margin-bottom: 8px;
  }
  .hud-avatar {
    width: 32px; height: 32px; border-radius: 7px;
    background: rgba(0,212,255,0.1); border: 1px solid rgba(0,212,255,0.25);
    display: flex; align-items: center; justify-content: center;
    font-family: 'IBM Plex Mono', monospace; font-weight: 700; font-size: 11px; color: #00D4FF; flex-shrink: 0;
  }
  .hud-user-name { font-size: 13px; font-weight: 500; color: #E8F0FF; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .hud-user-status {
    font-family: 'IBM Plex Mono', monospace; font-size: 8px; color: #2ECC71;
    display: flex; align-items: center; gap: 4px; margin-top: 3px;
  }
  .hud-logout-btn {
    display: flex; align-items: center; gap: 8px; width: 100%; padding: 9px 13px;
    background: transparent; border: 1px solid rgba(214,40,40,0.2); border-radius: 8px;
    font-family: 'IBM Plex Sans', sans-serif; font-size: 13px; font-weight: 500;
    color: rgba(214,40,40,0.65); cursor: pointer; transition: all .17s;
  }
  .hud-logout-btn:hover { background: rgba(214,40,40,0.08); border-color: rgba(214,40,40,0.35); color: #D62828; }

  /* ── Main ── */
  .hud-main {
    margin-left: 280px; flex: 1;
    display: flex; flex-direction: column; position: relative; z-index: 1;
    min-width: 0;
    height: 100vh;
    overflow-y: auto;
    overflow-x: hidden;
  }
  .hud-topbar {
    height: 56px; display: flex; align-items: center; padding: 0 20px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    background: rgba(2,12,24,0.85); backdrop-filter: blur(14px);
    position: sticky; top: 0; z-index: 100; gap: 10px;
  }
  .hud-topbar::after {
    content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, rgba(214,40,40,0.7), rgba(0,212,255,0.45), transparent 65%);
    pointer-events: none;
  }

  /* Hamburger button (hidden on desktop) */
  .hud-hamburger {
    display: none;
    background: none; border: 1px solid rgba(0,212,255,0.15); border-radius: 7px;
    width: 34px; height: 34px; align-items: center; justify-content: center;
    color: rgba(232,240,255,0.55); cursor: pointer; font-size: 15px;
    transition: all .17s; flex-shrink: 0;
  }
  .hud-hamburger:hover { background: rgba(0,212,255,0.08); color: #00D4FF; }

  .hud-crumb-trail {
    display: flex; align-items: center; gap: 8px;
    font-family: 'IBM Plex Mono', monospace; font-size: 11px;
    color: rgba(232,240,255,0.3); letter-spacing: .06em;
    overflow: hidden; min-width: 0;
  }
  .hud-crumb-active { color: rgba(232,240,255,0.75); font-weight: 500; white-space: nowrap; }
  .hud-crumb-sep { color: rgba(232,240,255,0.15); flex-shrink: 0; }
  .hud-crumb-hide-mobile { /* hide on very small screens */ }
  .hud-topbar-right { margin-left: auto; display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
  .hud-topbar-time {
    font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: rgba(0,212,255,0.7);
    border: 1px solid rgba(0,212,255,0.18); border-radius: 5px; padding: 5px 11px;
    white-space: nowrap;
  }
  .hud-topbar-btn {
    width: 34px; height: 34px; border-radius: 7px; border: 1px solid rgba(0,212,255,0.12);
    background: rgba(0,212,255,0.04); display: flex; align-items: center; justify-content: center;
    color: rgba(232,240,255,0.35); cursor: pointer; font-size: 14px; transition: all .17s;
    flex-shrink: 0;
  }
  .hud-topbar-btn:hover { background: rgba(0,212,255,0.09); color: #00D4FF; border-color: rgba(0,212,255,0.3); }
  .hud-notif-wrap { position: relative; }
  .hud-notif-dot {
    position: absolute; top: 5px; right: 5px; width: 6px; height: 6px; border-radius: 50%;
    background: #D62828; border: 1.5px solid #020c18; animation: pip 1.5s ease infinite;
  }

  .hud-page { flex: 1; padding: 26px 22px 60px; min-width: 0; overflow-x: hidden; }

  /* ── Overview ── */
  .hud-page-header { margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 12px; }
  .hud-eyebrow {
    font-family: 'IBM Plex Mono', monospace; font-size: 10px; color: rgba(232,240,255,0.3);
    letter-spacing: .18em; text-transform: uppercase; margin-bottom: 7px;
    display: flex; align-items: center; gap: 8px;
  }
  .hud-eyebrow::before { content: ''; width: 16px; height: 1px; background: #D62828; display: block; }
  .hud-title { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800; color: #fff; letter-spacing: -.03em; line-height: 1; }
  .hud-subtitle { font-size: 11px; color: rgba(0,212,255,0.45); margin-top: 6px; font-family: 'IBM Plex Mono', monospace; }
  .hud-live-tag {
    display: flex; align-items: center; gap: 6px; font-family: 'IBM Plex Mono', monospace;
    font-size: 9px; color: #D62828; border: 1px solid rgba(214,40,40,0.3);
    border-radius: 5px; padding: 6px 12px; background: rgba(214,40,40,0.05); white-space: nowrap;
  }
  .hud-live-dot { width: 6px; height: 6px; border-radius: 50%; background: #D62828; animation: pip 1.2s ease infinite; }

  /* ── Stat cards ── */
  .hud-stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-bottom: 18px; }
  .hud-stat {
    background: rgba(4,15,30,0.85); border: 1px solid rgba(255,255,255,0.06);
    border-radius: 12px; padding: 16px; position: relative; overflow: hidden;
    transition: border-color .2s, background .2s; backdrop-filter: blur(8px);
  }
  .hud-stat:hover { background: rgba(6,20,36,0.9); border-color: rgba(255,255,255,0.1); }
  .hud-stat::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: var(--card-accent); }
  .hud-stat-icon { font-size: 16px; color: var(--card-accent); margin-bottom: 12px; opacity: .9; }
  .hud-stat-num { font-family: 'Syne', sans-serif; font-size: 30px; font-weight: 800; color: var(--card-accent); line-height: 1; margin-bottom: 5px; }
  .hud-stat-label { font-family: 'IBM Plex Mono', monospace; font-size: 9px; color: rgba(232,240,255,0.35); letter-spacing: .1em; text-transform: uppercase; }
  .hud-stat-delta { position: absolute; top: 14px; right: 12px; font-family: 'IBM Plex Mono', monospace; font-size: 9px; color: var(--card-accent); border: 1px solid currentColor; border-radius: 4px; padding: 2px 7px; opacity: .65; }

  /* ── Panels ── */
  .hud-panels-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
  .hud-panel { background: rgba(4,15,30,0.85); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 18px; backdrop-filter: blur(8px); min-width: 0; }
  .hud-panel-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
  .hud-panel-title { font-family: 'IBM Plex Mono', monospace; font-size: 10px; color: rgba(232,240,255,0.4); letter-spacing: .15em; text-transform: uppercase; }
  .hud-panel-tag { font-family: 'IBM Plex Mono', monospace; font-size: 8.5px; color: rgba(0,212,255,0.8); border: 1px solid rgba(0,212,255,0.2); border-radius: 4px; padding: 2px 8px; background: rgba(0,212,255,0.05); white-space: nowrap; }

  /* ── Live incident rows ── */
  .hud-incident { padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
  .hud-incident:last-child { border-bottom: none; padding-bottom: 0; }
  .hud-inc-row1 { display: flex; align-items: flex-start; gap: 10px; }
  .hud-inc-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--inc-color); flex-shrink: 0; margin-top: 5px; }
  .hud-inc-body { flex: 1; min-width: 0; }
  .hud-inc-type { display: flex; align-items: center; gap: 6px; margin-bottom: 3px; flex-wrap: wrap; }
  .hud-inc-icon { font-size: 13px; }
  .hud-inc-text { font-size: 13px; font-weight: 500; color: rgba(232,240,255,0.85); }
  .hud-inc-loc { font-family: 'IBM Plex Mono', monospace; font-size: 9.5px; color: rgba(232,240,255,0.32); margin-top: 2px; display: flex; align-items: center; gap: 4px; overflow: hidden; }
  .hud-inc-meta { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
  .hud-inc-chip {
    display: inline-flex; align-items: center; gap: 4px;
    font-family: 'IBM Plex Mono', monospace; font-size: 9px;
    padding: 3px 8px; border-radius: 4px; border: 1px solid;
    background: var(--chip-bg); color: var(--chip-color); border-color: var(--chip-border);
    text-decoration: none; transition: opacity .15s;
  }
  .hud-inc-chip:hover { opacity: .8; }
  .hud-inc-badge {
    font-family: 'IBM Plex Mono', monospace; font-size: 8.5px; padding: 3px 9px; border-radius: 4px;
    background: var(--ib-bg); color: var(--ib-text); border: 1px solid var(--ib-border); white-space: nowrap;
  }
  .hud-inc-time { font-family: 'IBM Plex Mono', monospace; font-size: 9px; color: rgba(232,240,255,0.2); margin-top: 4px; }

  /* ── Evidence thumbnail ── */
  .hud-inc-evidence {
    display: flex; align-items: center; gap: 7px; margin-top: 6px;
    padding: 6px 10px; background: rgba(0,212,255,0.04); border: 1px solid rgba(0,212,255,0.12);
    border-radius: 6px; text-decoration: none; transition: background .15s;
    font-family: 'IBM Plex Mono', monospace; font-size: 9px; color: rgba(0,212,255,0.7);
    width: fit-content; max-width: 100%;
  }
  .hud-inc-evidence:hover { background: rgba(0,212,255,0.09); }
  .hud-inc-evidence-thumb { width: 36px; height: 36px; border-radius: 4px; object-fit: cover; border: 1px solid rgba(0,212,255,0.2); flex-shrink: 0; }

  /* ── Bar chart ── */
  .hud-bar-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
  .hud-bar-row:last-child { margin-bottom: 0; }
  .hud-bar-label { font-family: 'IBM Plex Sans', sans-serif; font-size: 12px; color: rgba(232,240,255,0.6); width: 72px; flex-shrink: 0; }
  .hud-bar-track { flex: 1; height: 6px; border-radius: 3px; background: rgba(255,255,255,0.06); overflow: hidden; min-width: 0; }
  .hud-bar-fill { height: 100%; border-radius: 3px; background: var(--bar-color); transition: width 1s ease; }
  .hud-bar-val { font-family: 'IBM Plex Mono', monospace; font-size: 10px; color: rgba(232,240,255,0.45); width: 22px; text-align: right; flex-shrink: 0; }

  /* ── Quick nav ── */
  .hud-qnav { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px; }
  .hud-qbtn {
    display: flex; align-items: center; gap: 10px; padding: 12px 14px;
    background: rgba(4,15,30,0.6); border: 1px solid rgba(0,212,255,0.1);
    border-radius: 9px; cursor: pointer; font-family: 'IBM Plex Sans', sans-serif;
    font-size: 13px; font-weight: 400; color: rgba(232,240,255,0.55);
    position: relative; overflow: hidden; transition: all .17s; text-align: left;
  }
  .hud-qbtn:hover { background: rgba(255,255,255,0.05); border-color: rgba(0,212,255,0.25); color: rgba(232,240,255,0.85); }
  .hud-qbtn::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, var(--qbtn-color), transparent); }
  .hud-qbtn-icon { width: 30px; height: 30px; border-radius: 7px; background: var(--qbtn-bg); border: 1px solid var(--qbtn-border); display: flex; align-items: center; justify-content: center; font-size: 13px; color: var(--qbtn-color); flex-shrink: 0; }

  /* ── Full incident detail panel ── */
  .hud-inc-full {
    display: flex; flex-direction: column; gap: 10px; margin-bottom: 12px;
    padding: 14px; background: rgba(4,15,30,0.85); border: 1px solid rgba(255,255,255,0.07);
    border-radius: 10px; backdrop-filter: blur(8px);
  }
  .hud-inc-full:last-child { margin-bottom: 0; }
  .hud-inc-full-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
  .hud-inc-full-title { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .hud-inc-full-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .hud-inc-field { display: flex; flex-direction: column; gap: 3px; padding: 8px 10px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 7px; min-width: 0; }
  .hud-inc-field-label { font-family: 'IBM Plex Mono', monospace; font-size: 8.5px; color: rgba(232,240,255,0.3); letter-spacing: .1em; text-transform: uppercase; }
  .hud-inc-field-val { font-size: 12.5px; color: rgba(232,240,255,0.75); line-height: 1.4; overflow-wrap: break-word; word-break: break-word; }
  .hud-inc-desc { font-size: 12.5px; color: rgba(232,240,255,0.55); line-height: 1.6; padding: 8px 10px; background: rgba(255,255,255,0.02); border-radius: 6px; border: 1px solid rgba(255,255,255,0.05); overflow-wrap: break-word; }
  .hud-inc-evidence-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .hud-inc-evidence-large {
    display: flex; align-items: center; gap: 8px; padding: 8px 12px;
    background: rgba(0,212,255,0.05); border: 1px solid rgba(0,212,255,0.15);
    border-radius: 8px; text-decoration: none; color: #00D4FF;
    font-family: 'IBM Plex Mono', monospace; font-size: 10px;
    transition: background .15s; width: fit-content; max-width: 100%;
  }
  .hud-inc-evidence-large:hover { background: rgba(0,212,255,0.1); }
  .hud-inc-evidence-img { max-width: 120px; max-height: 80px; border-radius: 6px; object-fit: cover; border: 1px solid rgba(0,212,255,0.2); }

  /* ── Spinner ── */
  .hud-spinner { display: inline-block; width: 16px; height: 16px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.1); border-top-color: #00D4FF; animation: hudSpin .7s linear infinite; }
  @keyframes hudSpin { to { transform: rotate(360deg); } }

  /* Empty state */
  .hud-empty { text-align: center; padding: 28px 0; font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: rgba(232,240,255,0.2); letter-spacing: .1em; }

  /* ── Sub-page resets ── */
  .hud-page .al-root, .hud-page .ia-root, .hud-page .inc-root, .hud-page .rp-root { min-height: unset; padding: 0; }

  /* ════════════════════════════════════
     RESPONSIVE BREAKPOINTS
  ════════════════════════════════════ */

  /* Tablet: ≤ 1024px — panels stack */
  @media (max-width: 1024px) {
    .hud-panels-row { grid-template-columns: 1fr; }
  }

  /* Mobile: ≤ 768px — sidebar becomes drawer */
  @media (max-width: 768px) {
    .hud-sidebar {
      transform: translateX(-100%);
      width: min(280px, 85vw);
      box-shadow: 4px 0 32px rgba(0,0,0,0.6);
    }
    .hud-sidebar.open { transform: translateX(0); }
    .hud-sidebar-close { display: flex; }

    .hud-hamburger { display: flex; }

    .hud-main { margin-left: 0; height: 100vh; }

    .hud-topbar { padding: 0 14px; }
    .hud-crumb-hide-mobile { display: none; }
    .hud-topbar-time { font-size: 10px; padding: 4px 8px; }

    .hud-page { padding: 16px 14px 60px; }

    .hud-title { font-size: 22px; }

    .hud-stat-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
    .hud-stat-num { font-size: 26px; }

    .hud-inc-full-grid { grid-template-columns: 1fr; }

    .hud-qnav { grid-template-columns: 1fr 1fr; }
  }

  /* Small mobile: ≤ 420px */
  @media (max-width: 420px) {
    .hud-stat-grid { grid-template-columns: repeat(2, 1fr); }
    .hud-qnav { grid-template-columns: 1fr; }
    .hud-topbar-time { display: none; }
    .hud-page { padding: 14px 12px 60px; }
  }
`;

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
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(ts).toLocaleDateString();
}

function isVideo(url: string) {
  return /\.(mp4|mov|avi|webm|mkv)/i.test(url);
}

function IncidentCard({ r }: { r: Report }) {
  const tm = TYPE_META[r.type] ?? TYPE_META.other;
  const sm = STATUS_META[r.status] ?? STATUS_META.pending;
  const hasContact = r.reporter_contact;
  const hasEvidence = r.evidence_url;
  const vid = hasEvidence && isVideo(r.evidence_url!);

  return (
    <div className="hud-inc-full">
      <div className="hud-inc-full-header">
        <div className="hud-inc-full-title">
          <span>{tm.icon}</span>
          <span style={{ color: tm.color, textTransform: "capitalize" }}>{r.type.replace(/_/g," ")}</span>
          <span style={{ fontFamily: "IBM Plex Mono", fontSize: 9, opacity: .4, fontWeight: 400 }}>
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
            <a href={`tel:${r.reporter_contact}`} className="hud-inc-field-val" style={{ color: "#2ECC8F", textDecoration: "none" }}>
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
    { label: "Total Reports", value: stats.total,      accent: "#7B9EFF", icon: <FaClipboardList />,      delta: "ALL TIME" },
    { label: "Pending",       value: stats.pending,    accent: "#EF5B5B", icon: <FaExclamationTriangle />, delta: "URGENT"   },
    { label: "In Progress",   value: stats.inProgress, accent: "#F5C842", icon: <FaClock />,              delta: undefined   },
    { label: "Resolved",      value: stats.resolved,   accent: "#2ECC8F", icon: <FaCheckCircle />,        delta: undefined   },
    { label: "Responders",    value: stats.responders, accent: "#2ECC8F", icon: <FaUsers />,              delta: "ACTIVE"   },
    { label: "Alerts Sent",   value: stats.alerts,     accent: "#D62828", icon: <FaBell />,               delta: "TOTAL"    },
  ];

  const typeList = ["fire","flood","medical","crime","accident","other"];
  const maxCount = Math.max(...typeList.map(t => typeCounts[t] ?? 0), 1);

  const quickNav = [
    { id: "incidents"  as ViewId, label: "Incidents",  icon: <FaClipboardList />, color: "#7B9EFF", bg: "rgba(123,158,255,.09)", border: "rgba(123,158,255,.18)" },
    { id: "alerts"     as ViewId, label: "Alerts",     icon: <FaBell />,          color: "#D62828", bg: "rgba(214,40,40,.09)",   border: "rgba(214,40,40,.2)"    },
    { id: "responders" as ViewId, label: "Responders", icon: <FaUsers />,         color: "#2ECC8F", bg: "rgba(46,204,113,.09)",  border: "rgba(46,204,113,.18)"  },
    { id: "analytics"  as ViewId, label: "Analytics",  icon: <FaChartBar />,      color: "#00D4FF", bg: "rgba(0,212,255,.07)",   border: "rgba(0,212,255,.15)"   },
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
        {/* Live incidents feed */}
        <div className="hud-panel" style={{ overflow: "auto", maxHeight: 520 }}>
          <div className="hud-panel-head">
            <span className="hud-panel-title">// Live Incident Feed</span>
            <span className="hud-panel-tag">REAL-TIME</span>
          </div>
          {loading ? (
            <div className="hud-empty"><div className="hud-spinner" /></div>
          ) : recentReports.length === 0 ? (
            <div className="hud-empty">NO REPORTS YET</div>
          ) : (
            recentReports.map(r => <IncidentCard key={String(r.id)} r={r} />)
          )}
        </div>

        {/* Bar chart + quick nav */}
        <div className="hud-panel">
          <div className="hud-panel-head">
            <span className="hud-panel-title">// Incident Types</span>
            <span className="hud-panel-tag">ALL TIME</span>
          </div>
          {typeList.map(t => {
            const tm = TYPE_META[t] ?? TYPE_META.other;
            const count = typeCounts[t] ?? 0;
            return (
              <div key={t} className="hud-bar-row">
                <span className="hud-bar-label" style={{ display: "flex", alignItems: "center", gap: 5 }}>
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

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: 16, paddingTop: 14 }}>
            <div className="hud-panel-title" style={{ marginBottom: 11 }}>// Quick Actions</div>
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on view change (mobile UX)
  const handleNavigate = (v: ViewId) => {
    setView(v);
    setSidebarOpen(false);
  };

  // Close sidebar on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSidebarOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Prevent body scroll when sidebar open on mobile
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
        if (profile?.full_name) setAdminName(profile.full_name);
      }
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  const initials = adminName.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase();

  const PAGE_TITLE: Record<ViewId, string> = {
    overview: "OVERVIEW", incidents: "INCIDENTS", alerts: "ALERTS",
    responders: "RESPONDERS", analytics: "ANALYTICS",
  };

  const groups = [
    { label: "// Command",    items: NAV.filter(n => n.group === "Command")    },
    { label: "// Management", items: NAV.filter(n => n.group === "Management") },
  ];

  return (
    <>
      <style>{DASH_STYLE}</style>
      <div className="hud-portal">
      <div className="hud">
        <div className="hud-bg" />

        {/* Mobile overlay backdrop */}
        <div
          className={`hud-sidebar-overlay${sidebarOpen ? " open" : ""}`}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />

        <aside className={`hud-sidebar${sidebarOpen ? " open" : ""}`} aria-label="Navigation">
          <div className="hud-logo">
            <div className="hud-logo-img-wrap">
              <div className="hud-logo-glow" />
              <div className="hud-logo-ring" />
              <img src={dsgLogo} alt="DSG Logo" className="hud-logo-img" />
            </div>
            <div className="hud-logo-text-wrap">
              <div className="hud-logo-name">DumaSafeGuide</div>
              <div className="hud-logo-sub"><span className="hud-status-pip" />COMMAND CENTER</div>
            </div>
            {/* Close button — visible on mobile only */}
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
                <span className="hud-nav-label">{g.label}</span>
                {g.items.map(item => (
                  <button
                    key={item.id}
                    className={`hud-nav-item${view === item.id ? " active" : ""}`}
                    onClick={() => handleNavigate(item.id)}
                  >
                    <span className="hud-nav-ic">{item.icon}</span>
                    <span>{item.label}</span>
                    {item.id === "incidents" && pendingCount > 0 && <span className="hud-badge">{pendingCount}</span>}
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
              <FaSignOutAlt size={12} />Sign Out
            </button>
          </div>
        </aside>

        <div className="hud-main">
          <div className="hud-topbar">
            {/* Hamburger — shown on mobile only */}
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
              <div className="hud-notif-wrap">
                <button className="hud-topbar-btn" aria-label="Notifications"><FaBell size={13} /></button>
                {pendingCount > 0 && <span className="hud-notif-dot" />}
              </div>
            </div>
          </div>

          <div className="hud-page">
            {view === "overview"   && <OverviewPanel onNavigate={handleNavigate} />}
            {view === "incidents"  && <IncidentsPage />}
            {view === "alerts"     && <AdminAlertsPage />}
            {view === "responders" && <RespondersPage />}
            {view === "analytics"  && <IncidentAnalytics />}
          </div>
        </div>
      </div>
      </div>
    </>
  );
}