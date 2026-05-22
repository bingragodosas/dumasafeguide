import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../js/supabase";

import {
  FaTachometerAlt,
  FaClipboardList,
  FaBell,
  FaMapMarkerAlt,
  FaSignOutAlt,
  FaUser,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaShieldAlt,
  FaBars,
  FaTimes,
} from "react-icons/fa";

import Dispatch from "./Dispatch";
import ResponderAlertsPage from "./Responderalertspage";
import ResponderIncidentsPage from "./IncidentsPage";
import RespondersPage from "./Responderspage";

import dsgLogo from "../assets/dsg.logo.png";

type ViewId = "overview" | "incidents" | "alerts" | "dispatch" | "team";

interface NavItem {
  id: ViewId;
  label: string;
  icon: React.ReactElement;
  group: "Operations" | "Team";
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
  { id: "overview",  label: "Overview",  icon: <FaTachometerAlt />, group: "Operations" },
  { id: "dispatch",  label: "Dispatch",  icon: <FaMapMarkerAlt />,  group: "Operations" },
  { id: "incidents", label: "Incidents", icon: <FaClipboardList />, group: "Operations" },
  { id: "alerts",    label: "Alerts",    icon: <FaBell />,          group: "Operations" },
  { id: "team",      label: "Team",      icon: <FaShieldAlt />,     group: "Team"       },
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

  .rhud-portal {
    position: fixed;
    inset: 0;
    z-index: 9000;
    overflow: hidden;
  }

  .rhud {
    display: flex;
    height: 100%;
    width: 100%;
    font-family: 'IBM Plex Sans', sans-serif;
    color: #E8F0FF;
    position: relative;
    overflow: hidden;
  }

  .rhud-bg {
    position: absolute; inset: 0; z-index: 0;
    background: linear-gradient(135deg, #020c18 0%, #040f1e 50%, #020c18 100%);
  }
  .rhud-bg::after {
    content: ''; position: absolute; inset: 0;
    background:
      radial-gradient(ellipse 60% 40% at 0% 0%, rgba(239,91,91,0.06) 0%, transparent 60%),
      radial-gradient(ellipse 50% 50% at 100% 100%, rgba(46,204,143,0.04) 0%, transparent 60%);
  }

  .rhud-overlay {
    display: none;
    position: fixed; inset: 0; z-index: 190;
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(2px);
  }
  .rhud-overlay.open { display: block; }

  .rhud-sidebar {
    width: 260px; flex-shrink: 0;
    background: linear-gradient(180deg, rgba(4,15,30,0.99) 0%, rgba(2,10,22,0.99) 100%);
    display: flex; flex-direction: column;
    height: 100%; position: absolute; left: 0; top: 0; z-index: 200;
    border-right: 1px solid rgba(239,91,91,0.12);
    overflow: hidden;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .rhud-sidebar::after {
    content: ''; position: absolute; top: 0; right: 0; width: 1px; height: 100%;
    background: linear-gradient(180deg, #EF5B5B 0%, rgba(239,91,91,0) 30%, rgba(46,204,143,0.4) 70%, rgba(46,204,143,0) 100%);
    pointer-events: none;
  }

  .rhud-logo {
    padding: 18px 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.05);
    position: relative; display: flex; align-items: center; gap: 10px;
    flex-shrink: 0;
  }
  .rhud-logo::after {
    content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, #EF5B5B, rgba(46,204,143,0.4), transparent 70%);
  }
  .rhud-logo-img-wrap { position: relative; flex-shrink: 0; width: 36px; height: 36px; }
  .rhud-logo-img { width: 36px; height: 36px; object-fit: contain; display: block; position: relative; z-index: 2; }
  .rhud-logo-glow {
    position: absolute; inset: -6px; border-radius: 50%;
    background: radial-gradient(circle, rgba(239,91,91,0.2) 0%, transparent 70%);
    z-index: 1; animation: rLogoGlow 3s ease-in-out infinite;
  }
  @keyframes rLogoGlow { 0%,100% { opacity:.6; transform:scale(1); } 50% { opacity:1; transform:scale(1.1); } }

  .rhud-logo-text-wrap { flex: 1; min-width: 0; overflow: hidden; }
  .rhud-logo-name {
    font-family: 'Syne', sans-serif; font-size: 13.5px; font-weight: 800;
    letter-spacing: -0.4px; line-height: 1.1; color: transparent;
    background: linear-gradient(135deg, #fff 30%, #EF5B5B 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text; white-space: nowrap; display: block;
  }
  .rhud-logo-sub {
    font-family: 'IBM Plex Mono', monospace; font-size: 7.5px;
    color: rgba(239,91,91,0.5); letter-spacing: 2px; text-transform: uppercase;
    margin-top: 3px; display: flex; align-items: center; gap: 5px;
  }

  .rhud-sidebar-close {
    display: none;
    margin-left: auto; flex-shrink: 0;
    background: none; border: none; cursor: pointer;
    color: rgba(232,240,255,0.4); font-size: 17px; padding: 4px;
    transition: color .15s;
  }
  .rhud-sidebar-close:hover { color: rgba(232,240,255,0.8); }

  .rhud-status-pip {
    width: 5px; height: 5px; border-radius: 50%; background: #2ECC8F;
    animation: rPip 2s ease infinite; flex-shrink: 0; display: inline-block;
  }
  @keyframes rPip { 0%,100% { opacity:1; } 50% { opacity:0.3; } }

  .rhud-nav-scroll { flex: 1; overflow-y: auto; padding: 8px; min-height: 0; }
  .rhud-nav-scroll::-webkit-scrollbar { width: 3px; }
  .rhud-nav-scroll::-webkit-scrollbar-thumb { background: rgba(239,91,91,0.1); border-radius: 2px; }

  .rhud-nav-label {
    font-family: 'IBM Plex Mono', monospace; font-size: 8.5px;
    color: rgba(232,240,255,0.22); letter-spacing: 2px; text-transform: uppercase;
    padding: 12px 10px 5px; display: block;
  }
  .rhud-nav-item {
    display: flex; align-items: center; gap: 10px; width: 100%; padding: 9px 12px;
    border-radius: 7px; border: 1px solid transparent;
    font-family: 'IBM Plex Sans', sans-serif; font-size: 13.5px; font-weight: 400;
    cursor: pointer; color: rgba(232,240,255,0.4); background: transparent;
    margin-bottom: 2px; position: relative; overflow: hidden;
    transition: color .15s, background .15s; text-align: left;
  }
  .rhud-nav-item:hover { background: rgba(255,255,255,0.04); color: rgba(232,240,255,0.7); }
  .rhud-nav-item.active {
    background: rgba(239,91,91,0.08); border-color: rgba(239,91,91,0.22);
    color: #fff; font-weight: 500;
  }
  .rhud-nav-item.active::before {
    content: ''; position: absolute; left: 0; top: 0; bottom: 0;
    width: 3px; background: #EF5B5B; border-radius: 0 2px 2px 0;
  }
  .rhud-nav-item.active .rhud-nav-ic { color: #EF5B5B; }
  .rhud-nav-ic { font-size: 14px; flex-shrink: 0; color: rgba(232,240,255,0.22); transition: color .15s; }

  .rhud-badge {
    margin-left: auto; background: #EF5B5B; color: #fff;
    font-family: 'IBM Plex Mono', monospace; font-size: 9px; font-weight: 700;
    min-width: 18px; height: 18px; border-radius: 9px; padding: 0 5px;
    display: flex; align-items: center; justify-content: center;
  }

  /* Alert badge — blue tint to distinguish from incidents */
  .rhud-badge--alert {
    margin-left: auto; background: #5B8DEF; color: #fff;
    font-family: 'IBM Plex Mono', monospace; font-size: 9px; font-weight: 700;
    min-width: 18px; height: 18px; border-radius: 9px; padding: 0 5px;
    display: flex; align-items: center; justify-content: center;
    animation: rAlertPulse 1.5s ease infinite;
  }
  @keyframes rAlertPulse { 0%,100%{opacity:1;} 50%{opacity:0.6;} }

  .rhud-sidebar-footer { padding: 10px 8px 14px; border-top: 1px solid rgba(255,255,255,0.05); flex-shrink: 0; }
  .rhud-user-card {
    display: flex; align-items: center; gap: 9px; padding: 10px 12px;
    background: rgba(239,91,91,0.05); border: 1px solid rgba(239,91,91,0.12);
    border-radius: 8px; margin-bottom: 7px;
  }
  .rhud-avatar {
    width: 30px; height: 30px; border-radius: 7px;
    background: rgba(239,91,91,0.1); border: 1px solid rgba(239,91,91,0.25);
    display: flex; align-items: center; justify-content: center;
    font-family: 'IBM Plex Mono', monospace; font-weight: 700; font-size: 11px; color: #EF5B5B; flex-shrink: 0;
  }
  .rhud-user-name { font-size: 13px; font-weight: 500; color: #E8F0FF; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .rhud-user-role {
    font-family: 'IBM Plex Mono', monospace; font-size: 8px; color: #EF5B5B;
    display: flex; align-items: center; gap: 4px; margin-top: 2px; opacity: .7;
  }
  .rhud-logout-btn {
    display: flex; align-items: center; gap: 8px; width: 100%; padding: 9px 12px;
    background: transparent; border: 1px solid rgba(239,91,91,0.18); border-radius: 7px;
    font-family: 'IBM Plex Sans', sans-serif; font-size: 13px; font-weight: 500;
    color: rgba(239,91,91,0.6); cursor: pointer; transition: all .17s;
  }
  .rhud-logout-btn:hover { background: rgba(239,91,91,0.08); border-color: rgba(239,91,91,0.35); color: #EF5B5B; }

  .rhud-main {
    margin-left: 260px; flex: 1;
    display: flex; flex-direction: column;
    position: relative; z-index: 1;
    height: 100%; min-width: 0;
    overflow: hidden;
  }

  .rhud-topbar {
    height: 54px; display: flex; align-items: center; padding: 0 22px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    background: rgba(2,12,24,0.88); backdrop-filter: blur(14px);
    position: relative; z-index: 100; gap: 10px;
    flex-shrink: 0;
  }
  .rhud-topbar::after {
    content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, rgba(239,91,91,0.6), rgba(46,204,143,0.3), transparent 65%);
    pointer-events: none;
  }

  .rhud-hamburger {
    display: none;
    background: none; border: 1px solid rgba(239,91,91,0.2); border-radius: 7px;
    width: 34px; height: 34px; align-items: center; justify-content: center;
    color: rgba(232,240,255,0.55); cursor: pointer; font-size: 15px;
    transition: all .17s; flex-shrink: 0;
  }
  .rhud-hamburger:hover { background: rgba(239,91,91,0.1); color: #EF5B5B; }

  .rhud-crumb {
    display: flex; align-items: center; gap: 7px;
    font-family: 'IBM Plex Mono', monospace; font-size: 10.5px;
    color: rgba(232,240,255,0.28); letter-spacing: .06em;
    overflow: hidden; min-width: 0;
  }
  .rhud-crumb-active { color: rgba(232,240,255,0.72); font-weight: 500; white-space: nowrap; }
  .rhud-crumb-sep { color: rgba(232,240,255,0.13); flex-shrink: 0; }
  .rhud-crumb-hide-mobile { }

  .rhud-topbar-right { margin-left: auto; display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
  .rhud-topbar-time {
    font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; color: rgba(239,91,91,0.7);
    border: 1px solid rgba(239,91,91,0.18); border-radius: 5px; padding: 5px 10px;
    white-space: nowrap;
  }
  .rhud-topbar-btn {
    width: 32px; height: 32px; border-radius: 7px; border: 1px solid rgba(239,91,91,0.12);
    background: rgba(239,91,91,0.04); display: flex; align-items: center; justify-content: center;
    color: rgba(232,240,255,0.32); cursor: pointer; font-size: 13px; transition: all .17s;
    flex-shrink: 0;
  }
  .rhud-topbar-btn:hover { background: rgba(239,91,91,0.09); color: #EF5B5B; border-color: rgba(239,91,91,0.3); }
  .rhud-notif-wrap { position: relative; }
  .rhud-notif-dot {
    position: absolute; top: 5px; right: 5px; width: 6px; height: 6px; border-radius: 50%;
    background: #EF5B5B; border: 1.5px solid #020c18; animation: rPip 1.5s ease infinite;
  }

  .rhud-page {
    flex: 1; padding: 22px 22px 48px;
    overflow-y: auto; overflow-x: hidden;
    min-width: 0;
  }
  .rhud-page > div { animation: rFadeUp .35s ease both; }
  @keyframes rFadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }

  .rhud-page-header { margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 12px; }
  .rhud-eyebrow {
    font-family: 'IBM Plex Mono', monospace; font-size: 9.5px; color: rgba(232,240,255,0.28);
    letter-spacing: .18em; text-transform: uppercase; margin-bottom: 6px;
    display: flex; align-items: center; gap: 8px;
  }
  .rhud-eyebrow::before { content: ''; width: 14px; height: 1px; background: #EF5B5B; display: block; }
  .rhud-title { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; color: #fff; letter-spacing: -.03em; line-height: 1; }
  .rhud-subtitle { font-size: 10.5px; color: rgba(239,91,91,0.45); margin-top: 5px; font-family: 'IBM Plex Mono', monospace; }

  .rhud-live-tag {
    display: flex; align-items: center; gap: 6px; font-family: 'IBM Plex Mono', monospace;
    font-size: 8.5px; color: #EF5B5B; border: 1px solid rgba(239,91,91,0.3);
    border-radius: 5px; padding: 5px 11px; background: rgba(239,91,91,0.05); white-space: nowrap;
  }
  .rhud-live-dot { width: 6px; height: 6px; border-radius: 50%; background: #EF5B5B; animation: rPip 1.2s ease infinite; }

  .rhud-stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 9px; margin-bottom: 16px; }
  .rhud-stat {
    background: rgba(4,15,30,0.88); border: 1px solid rgba(255,255,255,0.06);
    border-radius: 11px; padding: 15px; position: relative; overflow: hidden;
    transition: border-color .2s; backdrop-filter: blur(8px);
  }
  .rhud-stat:hover { border-color: rgba(255,255,255,0.1); }
  .rhud-stat::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: var(--card-accent); }
  .rhud-stat-icon { font-size: 15px; color: var(--card-accent); margin-bottom: 10px; opacity: .9; }
  .rhud-stat-num { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; color: var(--card-accent); line-height: 1; margin-bottom: 4px; }
  .rhud-stat-label { font-family: 'IBM Plex Mono', monospace; font-size: 8.5px; color: rgba(232,240,255,0.32); letter-spacing: .1em; text-transform: uppercase; }
  .rhud-stat-delta { position: absolute; top: 13px; right: 11px; font-family: 'IBM Plex Mono', monospace; font-size: 8.5px; color: var(--card-accent); border: 1px solid currentColor; border-radius: 4px; padding: 2px 6px; opacity: .6; }

  .rhud-panels-row { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; margin-bottom: 9px; }
  .rhud-panel { background: rgba(4,15,30,0.88); border: 1px solid rgba(255,255,255,0.06); border-radius: 11px; padding: 16px; backdrop-filter: blur(8px); min-width: 0; }
  .rhud-panel-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
  .rhud-panel-title { font-family: 'IBM Plex Mono', monospace; font-size: 9.5px; color: rgba(232,240,255,0.38); letter-spacing: .14em; text-transform: uppercase; }
  .rhud-panel-tag { font-family: 'IBM Plex Mono', monospace; font-size: 8px; color: rgba(239,91,91,0.8); border: 1px solid rgba(239,91,91,0.2); border-radius: 4px; padding: 2px 7px; background: rgba(239,91,91,0.05); white-space: nowrap; }

  .rhud-incident { padding: 11px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
  .rhud-incident:last-child { border-bottom: none; padding-bottom: 0; }
  .rhud-inc-row { display: flex; align-items: flex-start; gap: 9px; }
  .rhud-inc-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--inc-color); flex-shrink: 0; margin-top: 5px; }
  .rhud-inc-body { flex: 1; min-width: 0; }
  .rhud-inc-type { display: flex; align-items: center; gap: 6px; margin-bottom: 2px; flex-wrap: wrap; }
  .rhud-inc-text { font-size: 12.5px; font-weight: 500; color: rgba(232,240,255,0.82); }
  .rhud-inc-loc { font-family: 'IBM Plex Mono', monospace; font-size: 9px; color: rgba(232,240,255,0.3); margin-top: 2px; display: flex; align-items: center; gap: 4px; overflow: hidden; }
  .rhud-inc-meta { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 5px; }
  .rhud-inc-badge {
    font-family: 'IBM Plex Mono', monospace; font-size: 8px; padding: 2px 8px; border-radius: 4px;
    background: var(--ib-bg); color: var(--ib-text); border: 1px solid var(--ib-border); white-space: nowrap;
  }
  .rhud-inc-time { font-family: 'IBM Plex Mono', monospace; font-size: 8.5px; color: rgba(232,240,255,0.18); margin-top: 3px; }

  .rhud-bar-row { display: flex; align-items: center; gap: 9px; margin-bottom: 9px; }
  .rhud-bar-row:last-child { margin-bottom: 0; }
  .rhud-bar-label { font-family: 'IBM Plex Sans', sans-serif; font-size: 11.5px; color: rgba(232,240,255,0.55); width: 68px; flex-shrink: 0; display: flex; align-items: center; gap: 5px; }
  .rhud-bar-track { flex: 1; height: 5px; border-radius: 3px; background: rgba(255,255,255,0.06); overflow: hidden; min-width: 0; }
  .rhud-bar-fill { height: 100%; border-radius: 3px; background: var(--bar-color); transition: width 1s ease; }
  .rhud-bar-val { font-family: 'IBM Plex Mono', monospace; font-size: 9.5px; color: rgba(232,240,255,0.4); width: 20px; text-align: right; flex-shrink: 0; }

  .rhud-qnav { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; margin-top: 12px; }
  .rhud-qbtn {
    display: flex; align-items: center; gap: 9px; padding: 11px 13px;
    background: rgba(4,15,30,0.6); border: 1px solid rgba(239,91,91,0.1);
    border-radius: 8px; cursor: pointer; font-family: 'IBM Plex Sans', sans-serif;
    font-size: 12.5px; font-weight: 400; color: rgba(232,240,255,0.5);
    position: relative; overflow: hidden; transition: all .17s; text-align: left;
  }
  .rhud-qbtn:hover { background: rgba(255,255,255,0.05); border-color: rgba(239,91,91,0.25); color: rgba(232,240,255,0.85); }
  .rhud-qbtn::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, var(--qbtn-color), transparent); }
  .rhud-qbtn-icon { width: 28px; height: 28px; border-radius: 6px; background: var(--qbtn-bg); border: 1px solid var(--qbtn-border); display: flex; align-items: center; justify-content: center; font-size: 12px; color: var(--qbtn-color); flex-shrink: 0; }

  .rhud-spinner { display: inline-block; width: 15px; height: 15px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.1); border-top-color: #EF5B5B; animation: rSpin .7s linear infinite; }
  @keyframes rSpin { to { transform: rotate(360deg); } }
  .rhud-empty { text-align: center; padding: 24px 0; font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; color: rgba(232,240,255,0.18); letter-spacing: .1em; }

  @media (max-width: 1050px) {
    .rhud-panels-row { grid-template-columns: 1fr; }
  }

  @media (max-width: 768px) {
    .rhud-sidebar {
      transform: translateX(-100%);
      width: min(260px, 85vw);
      box-shadow: 4px 0 32px rgba(0,0,0,0.7);
    }
    .rhud-sidebar.open { transform: translateX(0); }
    .rhud-sidebar-close { display: flex; align-items: center; }
    .rhud-hamburger { display: flex; }
    .rhud-main { margin-left: 0; }
    .rhud-topbar { padding: 0 14px; }
    .rhud-crumb-hide-mobile { display: none; }
    .rhud-topbar-time { font-size: 10px; padding: 4px 8px; }
    .rhud-page { padding: 16px 14px 48px; }
    .rhud-title { font-size: 20px; }
    .rhud-stat-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
    .rhud-stat-num { font-size: 24px; }
    .rhud-qnav { grid-template-columns: 1fr 1fr; }
  }

  @media (max-width: 420px) {
    .rhud-topbar-time { display: none; }
    .rhud-page { padding: 14px 12px 48px; }
    .rhud-qnav { grid-template-columns: 1fr; }
  }
`;

function usePHTClock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(
        `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")} PHT`
      );
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

// ─── Overview Panel ───────────────────────────────────────────────────────────
function OverviewPanel({
  onNavigate,
  responderId,
}: {
  onNavigate: (v: ViewId) => void;
  responderId: string;
}) {
  const [stats, setStats] = useState({ assigned: 0, pending: 0, inProgress: 0, resolved: 0 });
  const [myReports, setMyReports] = useState<Report[]>([]);
  const [typeCounts, setTypeCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!responderId) return;

    const { data: all } = await supabase
      .from("reports")
      .select("id,type,description,location,address,reporter_name,reporter_contact,status,evidence_url,created_at,responder_id")
      .order("created_at", { ascending: false });

    const rows: Report[] = all ?? [];
    const mine = rows.filter((r) => r.responder_id === responderId);
    const counts: Record<string, number> = {};
    mine.forEach((r) => { counts[r.type] = (counts[r.type] ?? 0) + 1; });

    setStats({
      assigned:   mine.length,
      pending:    rows.filter((r) => r.status === "pending" && !r.responder_id).length,
      inProgress: mine.filter((r) => r.status === "in-progress").length,
      resolved:   mine.filter((r) => r.status === "resolved").length,
    });
    setMyReports(mine.slice(0, 5));
    setTypeCounts(counts);
    setLoading(false);
  }, [responderId]);

  useEffect(() => {
    loadData();
    const ch = supabase
      .channel("resp-overview")
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, loadData)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [loadData]);

  const statCards = [
    { label: "My Assignments", value: stats.assigned,   accent: "#EF5B5B", icon: <FaShieldAlt />,          delta: "TOTAL"  },
    { label: "Unassigned",     value: stats.pending,    accent: "#F5C842", icon: <FaExclamationTriangle />, delta: "OPEN"   },
    { label: "In Progress",    value: stats.inProgress, accent: "#5B8DEF", icon: <FaClock />,               delta: undefined },
    { label: "Resolved",       value: stats.resolved,   accent: "#2ECC8F", icon: <FaCheckCircle />,         delta: undefined },
  ];

  const typeList = ["fire", "flood", "medical", "crime", "accident", "other"];
  const maxCount = Math.max(...typeList.map((t) => typeCounts[t] ?? 0), 1);

  const quickNav = [
    { id: "dispatch"  as ViewId, label: "Dispatch",  icon: <FaMapMarkerAlt />,  color: "#EF5B5B", bg: "rgba(239,91,91,.08)",   border: "rgba(239,91,91,.18)"  },
    { id: "incidents" as ViewId, label: "Incidents", icon: <FaClipboardList />, color: "#5B8DEF", bg: "rgba(91,141,239,.08)",  border: "rgba(91,141,239,.18)" },
    { id: "alerts"    as ViewId, label: "Alerts",    icon: <FaBell />,          color: "#F5C842", bg: "rgba(245,200,66,.08)",  border: "rgba(245,200,66,.18)" },
    { id: "team"      as ViewId, label: "Team",      icon: <FaShieldAlt />,     color: "#2ECC8F", bg: "rgba(46,204,143,.08)",  border: "rgba(46,204,143,.18)" },
  ];

  return (
    <div>
      <div className="rhud-page-header">
        <div>
          <div className="rhud-eyebrow">Responder Panel</div>
          <div className="rhud-title">My Overview</div>
          <div className="rhud-subtitle">DUMAGUETE CITY — FIELD OPERATIONS</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {loading && <div className="rhud-spinner" />}
          <div className="rhud-live-tag"><span className="rhud-live-dot" />LIVE</div>
        </div>
      </div>

      <div className="rhud-stat-grid">
        {statCards.map((c) => (
          <div key={c.label} className="rhud-stat" style={{ "--card-accent": c.accent } as React.CSSProperties}>
            <div className="rhud-stat-icon">{c.icon}</div>
            <div className="rhud-stat-num">{loading ? "—" : c.value}</div>
            <div className="rhud-stat-label">{c.label}</div>
            {c.delta && <span className="rhud-stat-delta">{c.delta}</span>}
          </div>
        ))}
      </div>

      <div className="rhud-panels-row">
        <div className="rhud-panel" style={{ maxHeight: 460, overflow: "auto" }}>
          <div className="rhud-panel-head">
            <span className="rhud-panel-title">// My Assignments</span>
            <span className="rhud-panel-tag">ASSIGNED TO ME</span>
          </div>
          {loading ? (
            <div className="rhud-empty"><div className="rhud-spinner" /></div>
          ) : myReports.length === 0 ? (
            <div className="rhud-empty">NO ASSIGNMENTS YET</div>
          ) : (
            myReports.map((r) => {
              const tm = TYPE_META[r.type] ?? TYPE_META.other;
              const sm = STATUS_META[r.status] ?? STATUS_META.pending;
              return (
                <div key={String(r.id)} className="rhud-incident">
                  <div className="rhud-inc-row">
                    <div className="rhud-inc-dot" style={{ "--inc-color": tm.color } as React.CSSProperties} />
                    <div className="rhud-inc-body">
                      <div className="rhud-inc-type">
                        <span>{tm.icon}</span>
                        <span className="rhud-inc-text" style={{ color: tm.color, textTransform: "capitalize" }}>
                          {r.type}
                        </span>
                      </div>
                      <div className="rhud-inc-loc">
                        <FaMapMarkerAlt size={8} />
                        {r.address || r.location || "—"}
                      </div>
                      <div className="rhud-inc-meta">
                        <span className="rhud-inc-badge" style={{ "--ib-bg": sm.bg, "--ib-text": sm.color, "--ib-border": sm.border } as React.CSSProperties}>
                          {sm.label}
                        </span>
                        {r.reporter_name && (
                          <span className="rhud-inc-badge" style={{ "--ib-bg": "rgba(255,255,255,0.04)", "--ib-text": "rgba(232,240,255,0.5)", "--ib-border": "rgba(255,255,255,0.08)" } as React.CSSProperties}>
                            <FaUser size={7} style={{ marginRight: 3 }} />{r.reporter_name}
                          </span>
                        )}
                      </div>
                      <div className="rhud-inc-time">{formatRelative(r.created_at)}</div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="rhud-panel">
          <div className="rhud-panel-head">
            <span className="rhud-panel-title">// My Incident Types</span>
            <span className="rhud-panel-tag">BREAKDOWN</span>
          </div>
          {typeList.map((t) => {
            const tm = TYPE_META[t] ?? TYPE_META.other;
            const count = typeCounts[t] ?? 0;
            return (
              <div key={t} className="rhud-bar-row">
                <span className="rhud-bar-label">
                  <span>{tm.icon}</span>
                  <span style={{ textTransform: "capitalize" }}>{t}</span>
                </span>
                <div className="rhud-bar-track">
                  <div
                    className="rhud-bar-fill"
                    style={{ width: `${(count / maxCount) * 100}%`, "--bar-color": tm.color } as React.CSSProperties}
                  />
                </div>
                <span className="rhud-bar-val">{count}</span>
              </div>
            );
          })}

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: 14, paddingTop: 12 }}>
            <div className="rhud-panel-title" style={{ marginBottom: 10 }}>// Quick Actions</div>
            <div className="rhud-qnav">
              {quickNav.map((q) => (
                <button
                  key={q.id}
                  className="rhud-qbtn"
                  style={{ "--qbtn-color": q.color, "--qbtn-bg": q.bg, "--qbtn-border": q.border } as React.CSSProperties}
                  onClick={() => onNavigate(q.id)}
                >
                  <span className="rhud-qbtn-icon">{q.icon}</span>
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

// ─── Main RespondersDashboard ─────────────────────────────────────────────────
export default function RespondersDashboard() {
  const navigate = useNavigate();
  const clock = usePHTClock();
  const [view, setView] = useState<ViewId>("overview");
  const [pendingCount, setPendingCount] = useState(0);
  const [alertCount, setAlertCount] = useState(0);       // ← new: tracks unread alerts
  const [responderName, setResponderName] = useState("Responder");
  const [responderId, setResponderId] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Clear alert badge when navigating to alerts tab
  const handleNavigate = (v: ViewId) => {
    setView(v);
    setSidebarOpen(false);
    if (v === "alerts") setAlertCount(0);
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
      if (user) {
        setResponderId(user.id);
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();
        if (profile?.full_name) setResponderName(profile.full_name);
      }

      // Unassigned incident reports
      const { data: reportData } = await supabase
        .from("reports")
        .select("id")
        .eq("status", "pending")
        .is("responder_id", null);
      setPendingCount((reportData ?? []).length);

      // Total alerts count — used for badge
      const { data: alertData } = await supabase
        .from("alerts")
        .select("id")
        .order("created_at", { ascending: false })
        .limit(50);
      setAlertCount((alertData ?? []).length);
    };
    load();

    const ch = supabase
      .channel("resp-pending")
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "alerts" }, load)  // ← watch alerts too
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  const initials = responderName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  const PAGE_TITLE: Record<ViewId, string> = {
    overview:  "OVERVIEW",
    dispatch:  "DISPATCH",
    incidents: "INCIDENTS",
    alerts:    "ALERTS",
    team:      "TEAM",
  };

  const groups = [
    { label: "// Operations", items: NAV.filter((n) => n.group === "Operations") },
    { label: "// Team",       items: NAV.filter((n) => n.group === "Team")       },
  ];

  return (
    <>
      <style>{DASH_STYLE}</style>

      <div className="rhud-portal">

        <div
          className={`rhud-overlay${sidebarOpen ? " open" : ""}`}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />

        <div className="rhud">
          <div className="rhud-bg" />

          {/* ── Sidebar ── */}
          <aside className={`rhud-sidebar${sidebarOpen ? " open" : ""}`} aria-label="Navigation">
            <div className="rhud-logo">
              <div className="rhud-logo-img-wrap">
                <div className="rhud-logo-glow" />
                <img src={dsgLogo} alt="DSG Logo" className="rhud-logo-img" />
              </div>
              <div className="rhud-logo-text-wrap">
                <div className="rhud-logo-name">DumaSafeGuide</div>
                <div className="rhud-logo-sub"><span className="rhud-status-pip" />RESPONDER HQ</div>
              </div>
              <button
                className="rhud-sidebar-close"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close navigation"
              >
                <FaTimes />
              </button>
            </div>

            <nav className="rhud-nav-scroll">
              {groups.map((g) => (
                <div key={g.label}>
                  <span className="rhud-nav-label">{g.label}</span>
                  {g.items.map((item) => (
                    <button
                      key={item.id}
                      className={`rhud-nav-item${view === item.id ? " active" : ""}`}
                      onClick={() => handleNavigate(item.id)}
                    >
                      <span className="rhud-nav-ic">{item.icon}</span>
                      <span>{item.label}</span>
                      {/* Incidents badge — red */}
                      {item.id === "incidents" && pendingCount > 0 && (
                        <span className="rhud-badge">{pendingCount}</span>
                      )}
                      {/* Alerts badge — blue, clears when tab is opened */}
                      {item.id === "alerts" && alertCount > 0 && view !== "alerts" && (
                        <span className="rhud-badge--alert">{alertCount}</span>
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </nav>

            <div className="rhud-sidebar-footer">
              <div className="rhud-user-card">
                <div className="rhud-avatar">{initials}</div>
                <div style={{ minWidth: 0 }}>
                  <div className="rhud-user-name">{responderName}</div>
                  <div className="rhud-user-role"><span className="rhud-status-pip" />ON DUTY</div>
                </div>
              </div>
              <button className="rhud-logout-btn" onClick={handleLogout}>
                <FaSignOutAlt size={11} />Sign Out
              </button>
            </div>
          </aside>

          {/* ── Main ── */}
          <div className="rhud-main">
            <div className="rhud-topbar">
              <button
                className="rhud-hamburger"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open navigation"
                aria-expanded={sidebarOpen}
              >
                <FaBars />
              </button>

              <div className="rhud-crumb">
                <span className="rhud-crumb-hide-mobile">DUMASAFEGUIDE</span>
                <span className="rhud-crumb-sep rhud-crumb-hide-mobile">/</span>
                <span className="rhud-crumb-hide-mobile">RESPONDER</span>
                <span className="rhud-crumb-sep rhud-crumb-hide-mobile">/</span>
                <span className="rhud-crumb-active">{PAGE_TITLE[view]}</span>
              </div>

              <div className="rhud-topbar-right">
                <span className="rhud-topbar-time">{clock}</span>
                <div className="rhud-notif-wrap">
                  <button
                    className="rhud-topbar-btn"
                    aria-label="Alerts"
                    onClick={() => handleNavigate("alerts")}
                  >
                    <FaBell size={12} />
                  </button>
                  {alertCount > 0 && view !== "alerts" && <span className="rhud-notif-dot" />}
                </div>
              </div>
            </div>

            <div className="rhud-page">
              {view === "overview"  && responderId && <OverviewPanel onNavigate={handleNavigate} responderId={responderId} />}
              {view === "overview"  && !responderId && <div className="rhud-empty"><div className="rhud-spinner" /></div>}
              {view === "dispatch"  && <Dispatch />}
              {view === "incidents" && <ResponderIncidentsPage />}
              {view === "alerts"    && <ResponderAlertsPage />}
              {view === "team"      && <RespondersPage />}
            </div>
          </div>
        </div>

      </div>
    </>
  );
}