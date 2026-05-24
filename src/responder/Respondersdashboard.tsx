import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../js/supabase";

import Dispatch from "./Dispatch";
import ResponderAlertsPage from "./Responderalertspage";
import ResponderIncidentsPage from "./IncidentsPage";
import RespondersPage from "./Responderspage";

import dsgLogo from "../assets/dsg.logo.png";

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewId = "overview" | "incidents" | "alerts" | "dispatch" | "team";

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

// ─── Meta ─────────────────────────────────────────────────────────────────────

const TYPE_META: Record<string, { icon: string; colorClass: string }> = {
  fire:     { icon: "🔥", colorClass: "tc-fire"     },
  accident: { icon: "🚗", colorClass: "tc-accident" },
  flood:    { icon: "🌊", colorClass: "tc-flood"    },
  crime:    { icon: "🚨", colorClass: "tc-crime"    },
  medical:  { icon: "🏥", colorClass: "tc-medical"  },
  other:    { icon: "⚠️", colorClass: "tc-other"    },
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
  { id: "alerts",    label: "Alerts",    group: "Operations" },
  { id: "team",      label: "Team",      group: "Team"       },
];

// ─── SVG Icons ────────────────────────────────────────────────────────────────

const Ico = {
  Shield: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle",flexShrink:0}}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  Radar: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle",flexShrink:0}}>
      <path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6a6 6 0 0 0 0 12"/><path d="M12 10a2 2 0 0 0 0 4"/><line x1="12" y1="2" x2="12" y2="12"/>
    </svg>
  ),
  Clipboard: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle",flexShrink:0}}>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
    </svg>
  ),
  Bell: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle",flexShrink:0}}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  Gauge: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle",flexShrink:0}}>
      <path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 12l4.5-4.5"/><circle cx="12" cy="12" r="1.5"/>
    </svg>
  ),
  SignOut: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle",flexShrink:0}}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  Menu: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}>
      <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  ),
  X: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}>
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  MapPin: () => (
    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle",flexShrink:0}}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  User: () => (
    <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle",flexShrink:0}}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Clock: () => (
    <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle",flexShrink:0}}>
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  Check: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle",flexShrink:0}}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  Warn: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle",flexShrink:0}}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
};

function NavIcon({ id }: { id: ViewId }) {
  if (id === "overview")  return <Ico.Gauge />;
  if (id === "dispatch")  return <Ico.Radar />;
  if (id === "incidents") return <Ico.Clipboard />;
  if (id === "alerts")    return <Ico.Bell />;
  return <Ico.Shield />;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const STYLES = `
:root {
  --red:     #FF4D4D;
  --green:   #00E896;
  --blue:    #3B9EFF;
  --amber:   #FFAA00;
  --ink:     #030B15;
  --surface: #060F1E;
  --panel:   #071122;
  --edge:    rgba(255,255,255,0.06);
  --text:    #E2EEF8;
  --muted:   rgba(226,238,248,0.35);
  --dim:     rgba(226,238,248,0.15);
  --font-ui:   'Bebas Neue','Arial Narrow',Arial,sans-serif;
  --font-sans: 'DM Sans',system-ui,sans-serif;
  --font-mono: 'IBM Plex Mono','Fira Mono',monospace;
}
@keyframes ring  { 0%,100%{opacity:.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.06)} }
@keyframes pip   { 0%,100%{opacity:1} 50%{opacity:.2} }
@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.75;transform:scale(.95)} }
@keyframes spin  { to{transform:rotate(360deg)} }
@keyframes up    { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
@keyframes bar   { from{width:0} }

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

/* ── Portal shell ── */
.rd-portal{position:fixed;inset:0;z-index:9000;overflow:hidden;font-family:var(--font-sans);color:var(--text);background:var(--ink)}
.rd-shell{display:flex;height:100%;width:100%;position:relative;overflow:hidden}

/* ── Background ── */
.rd-bg{position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden}
.rd-bg-grad{position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at -10% -10%,rgba(255,77,77,.09) 0%,transparent 55%),radial-gradient(ellipse 60% 70% at 110% 110%,rgba(0,232,150,.06) 0%,transparent 50%),radial-gradient(ellipse 40% 40% at 50% 50%,rgba(59,158,255,.03) 0%,transparent 70%)}
.rd-bg-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.018) 1px,transparent 1px);background-size:52px 52px}

/* ── Sidebar ── */
.rd-overlay{display:none;position:fixed;inset:0;z-index:190;background:rgba(0,0,0,.7);backdrop-filter:blur(6px)}
.rd-overlay.open{display:block}

.rd-sidebar{width:264px;flex-shrink:0;background:rgba(4,11,22,.97);border-right:1px solid var(--edge);display:flex;flex-direction:column;height:100%;position:absolute;left:0;top:0;z-index:200;overflow:hidden;transition:transform .32s cubic-bezier(.4,0,.2,1)}
.rd-sidebar::before{content:'';position:absolute;left:0;top:0;bottom:0;width:2px;background:linear-gradient(180deg,var(--red) 0%,rgba(255,77,77,.4) 30%,rgba(0,232,150,.35) 70%,transparent 100%);z-index:3}

/* Logo */
.rd-logo{padding:22px 18px 20px;display:flex;align-items:center;gap:12px;flex-shrink:0;position:relative}
.rd-logo::after{content:'';position:absolute;bottom:0;left:0;right:0;height:1px;background:linear-gradient(90deg,rgba(255,77,77,.5) 0%,rgba(0,232,150,.2) 50%,transparent 80%)}
.rd-logo-ring{position:relative;flex-shrink:0;width:42px;height:42px}
.rd-logo-ring::before{content:'';position:absolute;inset:-3px;border-radius:50%;border:1.5px solid rgba(255,77,77,.3);animation:ring 3s ease-in-out infinite}
.rd-logo-ring::after{content:'';position:absolute;inset:-6px;border-radius:50%;border:1px solid rgba(255,77,77,.12);animation:ring 3s ease-in-out infinite .5s}
.rd-logo-img{width:42px;height:42px;object-fit:contain;display:block;position:relative;z-index:2;border-radius:10px}
.rd-logo-name{font-family:var(--font-ui);font-size:17px;letter-spacing:.04em;white-space:nowrap;background:linear-gradient(120deg,#fff 30%,var(--red) 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.rd-logo-sub{font-family:var(--font-mono);font-size:8px;color:rgba(255,77,77,.5);letter-spacing:.22em;text-transform:uppercase;margin-top:4px;display:flex;align-items:center;gap:6px}
.rd-pip{display:inline-block;width:5px;height:5px;border-radius:50%;background:var(--green);animation:pip 2s ease infinite;flex-shrink:0}
.rd-sidebar-close{display:none;margin-left:auto;flex-shrink:0;background:rgba(255,255,255,.04);border:1px solid var(--edge);border-radius:8px;width:30px;height:30px;align-items:center;justify-content:center;color:var(--muted);cursor:pointer;transition:all .15s}
.rd-sidebar-close:hover{background:rgba(255,77,77,.12);color:var(--red);border-color:rgba(255,77,77,.3)}

/* Nav */
.rd-nav-scroll{flex:1;overflow-y:auto;padding:10px 12px;scrollbar-width:thin;scrollbar-color:rgba(255,77,77,.12) transparent}
.rd-nav-scroll::-webkit-scrollbar{width:2px}
.rd-nav-scroll::-webkit-scrollbar-thumb{background:rgba(255,77,77,.12);border-radius:2px}
.rd-nav-group{font-family:var(--font-mono);font-size:8px;font-weight:500;color:var(--dim);letter-spacing:.22em;text-transform:uppercase;padding:16px 8px 7px;display:flex;align-items:center;gap:8px}
.rd-nav-group::after{content:'';flex:1;height:1px;background:var(--edge)}
.rd-nav-btn{display:flex;align-items:center;gap:11px;width:100%;padding:11px 13px;border-radius:10px;border:1px solid transparent;font-family:var(--font-sans);font-size:13.5px;font-weight:500;color:var(--muted);background:transparent;cursor:pointer;margin-bottom:2px;text-align:left;transition:all .18s;position:relative;overflow:hidden}
.rd-nav-btn:hover{color:rgba(226,238,248,.7);border-color:var(--edge)}
.rd-nav-btn.active{background:rgba(255,77,77,.07);border-color:rgba(255,77,77,.22);color:#fff;font-weight:700}
.rd-nav-btn.active::after{content:'';position:absolute;left:0;top:8px;bottom:8px;width:3px;background:var(--red);border-radius:0 2px 2px 0}
.rd-nav-ic{font-size:14px;flex-shrink:0;color:var(--dim);transition:color .18s;display:flex;align-items:center}
.rd-nav-btn.active .rd-nav-ic{color:var(--red)}

/* Badges */
.rd-badge{margin-left:auto;background:var(--red);color:#fff;font-family:var(--font-mono);font-size:9px;min-width:20px;height:20px;border-radius:10px;padding:0 6px;display:flex;align-items:center;justify-content:center;animation:pulse 2s ease infinite}
.rd-badge-blue{margin-left:auto;background:var(--blue);color:#fff;font-family:var(--font-mono);font-size:9px;min-width:20px;height:20px;border-radius:10px;padding:0 6px;display:flex;align-items:center;justify-content:center}

/* Sidebar footer */
.rd-sidebar-foot{padding:10px 12px 18px;border-top:1px solid var(--edge);flex-shrink:0}
.rd-user-card{display:flex;align-items:center;gap:11px;padding:12px 14px;background:rgba(255,77,77,.04);border:1px solid rgba(255,77,77,.1);border-radius:11px;margin-bottom:8px;position:relative;overflow:hidden}
.rd-user-card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,rgba(255,77,77,.4),transparent 60%)}
.rd-avatar{width:34px;height:34px;border-radius:9px;flex-shrink:0;background:rgba(255,77,77,.1);border:1px solid rgba(255,77,77,.2);display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-weight:500;font-size:12px;color:var(--red)}
.rd-user-name{font-size:13.5px;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rd-user-role{font-family:var(--font-mono);font-size:8px;color:var(--green);display:flex;align-items:center;gap:5px;margin-top:2px;opacity:.8}
.rd-logout-btn{display:flex;align-items:center;gap:8px;width:100%;padding:10px 13px;background:transparent;border:1px solid rgba(255,77,77,.12);border-radius:10px;font-family:var(--font-sans);font-size:13px;font-weight:500;color:rgba(255,77,77,.5);cursor:pointer;transition:all .18s}
.rd-logout-btn:hover{background:rgba(255,77,77,.07);border-color:rgba(255,77,77,.3);color:var(--red)}

/* ── Main area ── */
.rd-main{margin-left:264px;flex:1;display:flex;flex-direction:column;position:relative;z-index:1;height:100%;min-width:0;overflow:hidden}

/* Topbar */
.rd-topbar{height:58px;display:flex;align-items:center;padding:0 26px;background:rgba(3,11,21,.92);backdrop-filter:blur(20px);border-bottom:1px solid var(--edge);position:relative;z-index:100;gap:12px;flex-shrink:0}
.rd-topbar::after{content:'';position:absolute;bottom:0;left:0;right:0;height:1px;background:linear-gradient(90deg,rgba(255,77,77,.6) 0%,rgba(0,232,150,.25) 40%,transparent 70%);pointer-events:none}
.rd-hamburger{display:none;background:rgba(255,255,255,.04);border:1px solid var(--edge);border-radius:9px;width:36px;height:36px;align-items:center;justify-content:center;color:var(--muted);cursor:pointer;transition:all .17s;flex-shrink:0}
.rd-hamburger:hover{background:rgba(255,77,77,.1);color:var(--red);border-color:rgba(255,77,77,.3)}
.rd-crumb{display:flex;align-items:center;gap:7px;font-family:var(--font-mono);font-size:10px;color:var(--dim);letter-spacing:.06em}
.rd-crumb-sep{color:var(--edge)}
.rd-crumb-active{color:rgba(226,238,248,.8);font-weight:500;white-space:nowrap}
.rd-topbar-right{margin-left:auto;display:flex;align-items:center;gap:8px;flex-shrink:0}
.rd-clock{font-family:var(--font-mono);font-size:11px;font-weight:500;color:rgba(255,77,77,.7);background:rgba(255,77,77,.06);border:1px solid rgba(255,77,77,.14);border-radius:8px;padding:6px 13px;white-space:nowrap;letter-spacing:.05em}
.rd-icon-btn{width:34px;height:34px;border-radius:9px;border:1px solid var(--edge);background:rgba(255,255,255,.03);display:flex;align-items:center;justify-content:center;color:var(--dim);cursor:pointer;font-size:13px;transition:all .17s}
.rd-icon-btn:hover{background:rgba(255,77,77,.09);color:var(--red);border-color:rgba(255,77,77,.28)}
.rd-notif-wrap{position:relative}
.rd-notif-dot{position:absolute;top:7px;right:7px;width:7px;height:7px;border-radius:50%;background:var(--red);border:2px solid var(--ink);animation:pip 1.5s ease infinite}

/* Page content */
.rd-page{flex:1;padding:26px 26px 60px;overflow-y:auto;overflow-x:hidden;min-width:0;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.06) transparent}
.rd-page::-webkit-scrollbar{width:4px}
.rd-page::-webkit-scrollbar-thumb{background:rgba(255,255,255,.06);border-radius:2px}
.rd-page > div{animation:up .38s cubic-bezier(.4,0,.2,1) both}

/* ── Overview ── */
.rd-ov-hd{display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:14px;margin-bottom:26px}
.rd-eyebrow{font-family:var(--font-mono);font-size:9.5px;color:rgba(255,77,77,.65);letter-spacing:.22em;text-transform:uppercase;margin-bottom:7px;display:flex;align-items:center;gap:10px}
.rd-eyebrow::before{content:'';display:block;width:24px;height:1px;background:linear-gradient(90deg,var(--red),transparent)}
.rd-title{font-family:var(--font-ui);font-size:38px;color:#fff;letter-spacing:.02em;line-height:1}
.rd-live{display:flex;align-items:center;gap:7px;font-family:var(--font-mono);font-size:9px;padding:7px 14px;border-radius:20px;border:1px solid rgba(255,77,77,.28);background:rgba(255,77,77,.06);color:var(--red);letter-spacing:.12em;white-space:nowrap}
.rd-live-dot{width:6px;height:6px;border-radius:50%;background:var(--red);animation:pip 1.4s ease infinite}

/* Stat grid */
.rd-stat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(148px,1fr));gap:10px;margin-bottom:20px}
.rd-stat{background:var(--panel);border:1px solid var(--edge);border-radius:14px;padding:20px 18px;position:relative;overflow:hidden;transition:transform .22s,border-color .22s;cursor:default}
.rd-stat:hover{transform:translateY(-2px);border-color:rgba(255,255,255,.1)}
.rd-stat::before{content:'';position:absolute;top:0;left:0;right:0;height:2px}
.rd-stat-glow{position:absolute;top:-20px;right:-20px;width:80px;height:80px;border-radius:50%;opacity:.12;pointer-events:none}
.rd-stat-icon{font-size:15px;margin-bottom:14px;opacity:.85;display:flex;align-items:center}
.rd-stat-num{font-family:var(--font-ui);font-size:38px;line-height:1;margin-bottom:6px;letter-spacing:-1px}
.rd-stat-label{font-family:var(--font-mono);font-size:8px;color:var(--dim);letter-spacing:.14em;text-transform:uppercase}
.rd-stat-tag{position:absolute;top:14px;right:14px;font-family:var(--font-mono);font-size:7.5px;border:1px solid currentColor;border-radius:4px;padding:2px 7px;opacity:.45}

/* Stat color variants */
.rd-stat.sv-red  ::before,.rd-stat.sv-red  .rd-stat-glow{background:var(--red)}
.rd-stat.sv-red   .rd-stat-icon,.rd-stat.sv-red  .rd-stat-num,.rd-stat.sv-red  .rd-stat-tag{color:var(--red)}
.rd-stat.sv-amber::before,.rd-stat.sv-amber .rd-stat-glow{background:var(--amber)}
.rd-stat.sv-amber .rd-stat-icon,.rd-stat.sv-amber .rd-stat-num,.rd-stat.sv-amber .rd-stat-tag{color:var(--amber)}
.rd-stat.sv-blue ::before,.rd-stat.sv-blue  .rd-stat-glow{background:var(--blue)}
.rd-stat.sv-blue  .rd-stat-icon,.rd-stat.sv-blue  .rd-stat-num,.rd-stat.sv-blue  .rd-stat-tag{color:var(--blue)}
.rd-stat.sv-green::before,.rd-stat.sv-green .rd-stat-glow{background:var(--green)}
.rd-stat.sv-green .rd-stat-icon,.rd-stat.sv-green .rd-stat-num,.rd-stat.sv-green .rd-stat-tag{color:var(--green)}

/* Panels row */
.rd-panels-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media(max-width:1060px){.rd-panels-row{grid-template-columns:1fr}}

.rd-panel{background:var(--panel);border:1px solid var(--edge);border-radius:14px;padding:20px;position:relative;overflow:hidden;min-width:0}
.rd-panel-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;padding-bottom:14px;border-bottom:1px solid var(--edge)}
.rd-panel-title{font-family:var(--font-mono);font-size:9.5px;color:var(--dim);letter-spacing:.16em;text-transform:uppercase}
.rd-panel-tag{font-family:var(--font-mono);font-size:7.5px;color:rgba(255,77,77,.7);border:1px solid rgba(255,77,77,.16);border-radius:5px;padding:3px 8px;background:rgba(255,77,77,.04)}

/* Accent top borders */
.rd-panel.pa-red  ::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,rgba(255,77,77,.5),transparent 60%)}
.rd-panel.pa-blue ::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,rgba(59,158,255,.4),transparent 60%)}

/* Incident list */
.rd-inc-item{padding:13px 0;border-bottom:1px solid rgba(255,255,255,.04)}
.rd-inc-item:last-child{border-bottom:none;padding-bottom:0}
.rd-inc-row{display:flex;align-items:flex-start;gap:11px}
.rd-inc-icon{width:32px;height:32px;border-radius:9px;flex-shrink:0;border:1px solid rgba(255,255,255,.06);display:flex;align-items:center;justify-content:center;font-size:14px;margin-top:1px}

/* Icon bg by type */
.rd-inc-icon.tc-fire    {background:rgba(255,77,77,.1)}
.rd-inc-icon.tc-accident{background:rgba(255,170,0,.1)}
.rd-inc-icon.tc-flood   {background:rgba(59,158,255,.1)}
.rd-inc-icon.tc-crime   {background:rgba(255,63,164,.1)}
.rd-inc-icon.tc-medical {background:rgba(0,232,150,.1)}
.rd-inc-icon.tc-other   {background:rgba(136,153,187,.1)}

.rd-inc-body{flex:1;min-width:0}
.rd-inc-type{font-size:13.5px;font-weight:700;text-transform:capitalize;display:flex;align-items:center;gap:6px;margin-bottom:3px}
.rd-inc-type.tc-fire    {color:var(--red)}
.rd-inc-type.tc-accident{color:var(--amber)}
.rd-inc-type.tc-flood   {color:var(--blue)}
.rd-inc-type.tc-crime   {color:#FF3FA4}
.rd-inc-type.tc-medical {color:var(--green)}
.rd-inc-type.tc-other   {color:#8899BB}

.rd-inc-loc{font-family:var(--font-mono);font-size:9px;color:var(--dim);display:flex;align-items:center;gap:4px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.rd-inc-pills{display:flex;flex-wrap:wrap;gap:5px;margin-top:7px}
.rd-pill{font-family:var(--font-mono);font-size:8px;padding:3px 9px;border-radius:5px;border:1px solid rgba(255,255,255,.06);display:flex;align-items:center;gap:4px}
.rd-pill-dot{width:4px;height:4px;border-radius:50%;flex-shrink:0}

.rd-pill.sc-pending  {background:rgba(255,77,77,.12); color:#FF4D4D}
.rd-pill.sc-pending  .rd-pill-dot{background:#FF4D4D}
.rd-pill.sc-progress {background:rgba(255,170,0,.12); color:#FFAA00}
.rd-pill.sc-progress .rd-pill-dot{background:#FFAA00}
.rd-pill.sc-resolved {background:rgba(0,232,150,.12); color:#00E896}
.rd-pill.sc-resolved .rd-pill-dot{background:#00E896}
.rd-pill-neutral{background:rgba(255,255,255,.04);color:rgba(226,238,248,.45)}

.rd-inc-time{font-family:var(--font-mono);font-size:8.5px;color:var(--dim);margin-top:5px;opacity:.7}

/* Bar chart */
.rd-bar-item{display:flex;align-items:center;gap:10px;margin-bottom:11px}
.rd-bar-item:last-child{margin-bottom:0}
.rd-bar-label{font-size:12px;color:var(--muted);width:74px;flex-shrink:0;display:flex;align-items:center;gap:6px;font-weight:500}
.rd-bar-track{flex:1;height:4px;border-radius:4px;background:rgba(255,255,255,.05);overflow:hidden}
.rd-bar-fill{height:100%;border-radius:4px;transition:width 1.4s cubic-bezier(.4,0,.2,1);animation:bar 1.4s cubic-bezier(.4,0,.2,1)}
.rd-bar-fill.tc-fire    {background:var(--red);  box-shadow:0 0 8px rgba(255,77,77,.4)}
.rd-bar-fill.tc-accident{background:var(--amber);box-shadow:0 0 8px rgba(255,170,0,.4)}
.rd-bar-fill.tc-flood   {background:var(--blue); box-shadow:0 0 8px rgba(59,158,255,.4)}
.rd-bar-fill.tc-crime   {background:#FF3FA4;     box-shadow:0 0 8px rgba(255,63,164,.4)}
.rd-bar-fill.tc-medical {background:var(--green);box-shadow:0 0 8px rgba(0,232,150,.4)}
.rd-bar-fill.tc-other   {background:#8899BB;     box-shadow:0 0 8px rgba(136,153,187,.3)}
.rd-bar-val{font-family:var(--font-mono);font-size:10px;color:var(--muted);width:22px;text-align:right;flex-shrink:0}

/* Quick actions */
.rd-qgrid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px}
.rd-qbtn{display:flex;align-items:center;gap:10px;padding:13px 14px;background:rgba(255,255,255,.02);border:1px solid var(--edge);border-radius:11px;cursor:pointer;font-family:var(--font-sans);font-size:13px;font-weight:600;color:var(--muted);text-align:left;transition:all .2s}
.rd-qbtn:hover{color:var(--text);transform:translateY(-1px)}
.rd-qbtn-ic{width:32px;height:32px;border-radius:9px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:14px}

.rd-qbtn.qv-red  :hover,.rd-qbtn.qv-red  {border-color:rgba(255,77,77,.12)}  .rd-qbtn.qv-red  :hover{border-color:rgba(255,77,77,.3)}
.rd-qbtn.qv-blue {border-color:rgba(59,158,255,.12)} .rd-qbtn.qv-blue:hover {border-color:rgba(59,158,255,.3)}
.rd-qbtn.qv-amber{border-color:rgba(255,170,0,.12)}  .rd-qbtn.qv-amber:hover{border-color:rgba(255,170,0,.3)}
.rd-qbtn.qv-green{border-color:rgba(0,232,150,.12)}  .rd-qbtn.qv-green:hover{border-color:rgba(0,232,150,.3)}

.rd-qbtn-ic.qv-red  {background:rgba(255,77,77,.08); border:1px solid rgba(255,77,77,.2); color:var(--red)}
.rd-qbtn-ic.qv-blue {background:rgba(59,158,255,.08);border:1px solid rgba(59,158,255,.2);color:var(--blue)}
.rd-qbtn-ic.qv-amber{background:rgba(255,170,0,.08); border:1px solid rgba(255,170,0,.2); color:var(--amber)}
.rd-qbtn-ic.qv-green{background:rgba(0,232,150,.08); border:1px solid rgba(0,232,150,.2); color:var(--green)}

.rd-divider{border:none;border-top:1px solid var(--edge);margin:18px 0 16px}

/* Spinner */
.rd-spinner{display:inline-block;width:18px;height:18px;border-radius:50%;border:2px solid rgba(255,255,255,.08);border-top-color:var(--red);animation:spin .7s linear infinite}
.rd-empty{text-align:center;padding:36px 0;font-family:var(--font-mono);font-size:10px;letter-spacing:.12em;color:var(--dim)}

/* ── Responsive ── */
@media(max-width:768px){
  .rd-sidebar{transform:translateX(-100%);width:min(264px,90vw);box-shadow:8px 0 48px rgba(0,0,0,.8)}
  .rd-sidebar.open{transform:translateX(0)}
  .rd-sidebar-close{display:flex}
  .rd-hamburger{display:flex}
  .rd-main{margin-left:0}
  .rd-topbar{padding:0 16px}
  .rd-crumb-hide{display:none}
  .rd-clock{display:none}
  .rd-page{padding:16px 14px 64px}
  .rd-title{font-size:30px}
  .rd-stat-grid{grid-template-columns:repeat(2,1fr);gap:9px}
  .rd-stat-num{font-size:28px}
  .rd-qgrid{grid-template-columns:1fr 1fr}
}
@media(max-width:440px){
  .rd-qgrid{grid-template-columns:1fr}
  .rd-page{padding:14px 12px 64px}
}
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
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
}

function OverviewPanel({ onNavigate, responderId }: OverviewPanelProps) {
  const [stats, setStats]           = useState({ assigned: 0, pending: 0, inProgress: 0, resolved: 0 });
  const [myReports, setMyReports]   = useState<Report[]>([]);
  const [typeCounts, setTypeCounts] = useState<Record<string, number>>({});
  const [loading, setLoading]       = useState(true);

  const loadData = useCallback(async () => {
    // ✅ FIX: always call setLoading(false), even if responderId is empty
    if (!responderId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("reports")
        .select("id,type,description,location,address,reporter_name,reporter_contact,status,evidence_url,created_at,responder_id")
        .order("created_at", { ascending: false });

      // ✅ FIX: handle query errors gracefully — don't leave loading=true
      if (error) {
        console.error("Overview loadData error:", error.message);
        return;
      }

      const rows: Report[] = data ?? [];
      const mine = rows.filter((r) => r.responder_id === responderId);
      const counts: Record<string, number> = {};
      mine.forEach((r) => { counts[r.type] = (counts[r.type] ?? 0) + 1; });

      setStats({
        assigned:   mine.length,
        pending:    rows.filter((r) => r.status === "pending" && !r.responder_id).length,
        inProgress: mine.filter((r) => r.status === "in-progress").length,
        resolved:   mine.filter((r) => r.status === "resolved").length,
      });
      setMyReports(mine.slice(0, 6));
      setTypeCounts(counts);
    } finally {
      // ✅ FIX: finally block guarantees loading is cleared regardless of success or error
      setLoading(false);
    }
  }, [responderId]);

  useEffect(() => {
    loadData();
    const ch = supabase
      .channel("resp-overview")
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, loadData)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [loadData]);

  const typeList = ["fire", "flood", "medical", "crime", "accident", "other"] as const;
  const maxCount = Math.max(...typeList.map((t) => typeCounts[t] ?? 0), 1);

  const statCards = [
    { label: "My Assignments", value: stats.assigned,   colorClass: "sv-red",   tag: "TOTAL", icon: <Ico.Shield /> },
    { label: "Unassigned",     value: stats.pending,    colorClass: "sv-amber", tag: "OPEN",  icon: <Ico.Warn />   },
    { label: "In Progress",    value: stats.inProgress, colorClass: "sv-blue",  tag: undefined, icon: <Ico.Clock /> },
    { label: "Resolved",       value: stats.resolved,   colorClass: "sv-green", tag: undefined, icon: <Ico.Check /> },
  ];

  const quickNav = [
    { id: "dispatch"  as ViewId, label: "Dispatch",  colorClass: "qv-red",   icon: <Ico.Radar />     },
    { id: "incidents" as ViewId, label: "Incidents", colorClass: "qv-blue",  icon: <Ico.Clipboard /> },
    { id: "alerts"    as ViewId, label: "Alerts",    colorClass: "qv-amber", icon: <Ico.Bell />      },
    { id: "team"      as ViewId, label: "Team",      colorClass: "qv-green", icon: <Ico.Shield />    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="rd-ov-hd">
        <div>
          <div className="rd-eyebrow">Responder Panel</div>
          <div className="rd-title">MY OVERVIEW</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {loading && <div className="rd-spinner" />}
          <div className="rd-live"><span className="rd-live-dot" />LIVE FEED</div>
        </div>
      </div>

      {/* Stats */}
      <div className="rd-stat-grid">
        {statCards.map((c) => (
          <div key={c.label} className={cls("rd-stat", c.colorClass)}>
            <div className="rd-stat-glow" />
            <div className="rd-stat-icon">{c.icon}</div>
            <div className="rd-stat-num">{loading ? "—" : c.value}</div>
            <div className="rd-stat-label">{c.label}</div>
            {c.tag && <span className="rd-stat-tag">{c.tag}</span>}
          </div>
        ))}
      </div>

      {/* Panels */}
      <div className="rd-panels-row">

        {/* Assignments */}
        <div className="rd-panel pa-red" style={{ maxHeight: 480, overflowY: "auto" }}>
          <div className="rd-panel-hd">
            <span className="rd-panel-title">My Assignments</span>
            <span className="rd-panel-tag">ASSIGNED TO ME</span>
          </div>
          {loading ? (
            <div className="rd-empty"><div className="rd-spinner" style={{ margin: "0 auto" }} /></div>
          ) : myReports.length === 0 ? (
            <div className="rd-empty">NO ASSIGNMENTS YET</div>
          ) : (
            myReports.map((r) => {
              const tm = TYPE_META[r.type]     ?? TYPE_META.other;
              const sm = STATUS_META[r.status] ?? STATUS_META.pending;
              return (
                <div key={String(r.id)} className="rd-inc-item">
                  <div className="rd-inc-row">
                    <div className={cls("rd-inc-icon", tm.colorClass)}>{tm.icon}</div>
                    <div className="rd-inc-body">
                      <div className={cls("rd-inc-type", tm.colorClass)}>{r.type}</div>
                      <div className="rd-inc-loc">
                        <Ico.MapPin />
                        {r.address || r.location || "—"}
                      </div>
                      <div className="rd-inc-pills">
                        <span className={cls("rd-pill", sm.colorClass)}>
                          <span className="rd-pill-dot" />
                          {sm.label}
                        </span>
                        {r.reporter_name && (
                          <span className="rd-pill rd-pill-neutral">
                            <Ico.User />
                            {r.reporter_name}
                          </span>
                        )}
                      </div>
                      <div className="rd-inc-time">{formatRelative(r.created_at)}</div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Breakdown + Quick Actions */}
        <div className="rd-panel pa-blue">
          <div className="rd-panel-hd">
            <span className="rd-panel-title">Incident Breakdown</span>
            <span className="rd-panel-tag">BY TYPE</span>
          </div>

          {typeList.map((t) => {
            const tm = TYPE_META[t] ?? TYPE_META.other;
            const count = typeCounts[t] ?? 0;
            return (
              <div key={t} className="rd-bar-item">
                <span className="rd-bar-label">
                  <span>{tm.icon}</span>
                  <span style={{ textTransform: "capitalize" }}>{t}</span>
                </span>
                <div className="rd-bar-track">
                  <div
                    className={cls("rd-bar-fill", tm.colorClass)}
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="rd-bar-val">{count}</span>
              </div>
            );
          })}

          <hr className="rd-divider" />
          <div className="rd-panel-title" style={{ marginBottom: 12 }}>Quick Actions</div>
          <div className="rd-qgrid">
            {quickNav.map((q) => (
              <button
                key={q.id}
                className={cls("rd-qbtn", q.colorClass)}
                onClick={() => onNavigate(q.id)}
              >
                <span className={cls("rd-qbtn-ic", q.colorClass)}>{q.icon}</span>
                {q.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function RespondersDashboard() {
  const navigate = useNavigate();
  const clock = usePHTClock();

  const [view,          setView]          = useState<ViewId>("overview");
  const [pendingCount,  setPendingCount]  = useState(0);
  const [alertCount,    setAlertCount]    = useState(0);
  const [responderName, setResponderName] = useState("Responder");
  const [responderId,   setResponderId]   = useState("");
  const [sidebarOpen,   setSidebarOpen]   = useState(false);
  // ✅ FIX: track auth loading separately so overview never mounts before we know the user
  const [authReady,     setAuthReady]     = useState(false);

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
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setResponderId(user.id);
          const { data: profile } = await supabase
            .from("profiles").select("full_name").eq("id", user.id).single();
          if (profile?.full_name) setResponderName(profile.full_name);
        }

        const { data: rptData } = await supabase
          .from("reports").select("id").eq("status", "pending").is("responder_id", null);
        setPendingCount((rptData ?? []).length);

        const { data: alData } = await supabase
          .from("alerts").select("id").order("created_at", { ascending: false }).limit(50);
        setAlertCount((alData ?? []).length);
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        // ✅ FIX: always mark auth as ready so the page renders
        setAuthReady(true);
      }
    };

    load();

    const ch = supabase
      .channel("resp-pending")
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "alerts" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  const initials = responderName
    .split(" ").map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase();

  const PAGE_TITLE: Record<ViewId, string> = {
    overview: "OVERVIEW", dispatch: "DISPATCH",
    incidents: "INCIDENTS", alerts: "ALERTS", team: "TEAM",
  };

  const navGroups: Array<{ label: string; items: typeof NAV_ITEMS }> = [
    { label: "Operations", items: NAV_ITEMS.filter((n) => n.group === "Operations") },
    { label: "Team",       items: NAV_ITEMS.filter((n) => n.group === "Team") },
  ];

  return (
    <>
      <style>{STYLES}</style>
      <div className="rd-portal">
        <div className={cls("rd-overlay", sidebarOpen && "open")} onClick={() => setSidebarOpen(false)} />

        <div className="rd-shell">
          <div className="rd-bg" aria-hidden="true">
            <div className="rd-bg-grad" />
            <div className="rd-bg-grid" />
          </div>

          {/* Sidebar */}
          <aside className={cls("rd-sidebar", sidebarOpen && "open")} aria-label="Navigation">
            <div className="rd-logo">
              <div className="rd-logo-ring">
                <img src={dsgLogo} alt="DumaSafeGuide" className="rd-logo-img" />
              </div>
              <div>
                <div className="rd-logo-name">DumaSafeGuide</div>
                <div className="rd-logo-sub"><span className="rd-pip" />RESPONDER HQ</div>
              </div>
              <button className="rd-sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close navigation">
                <Ico.X />
              </button>
            </div>

            <nav className="rd-nav-scroll" aria-label="Main navigation">
              {navGroups.map((g) => (
                <div key={g.label}>
                  <div className="rd-nav-group">{g.label}</div>
                  {g.items.map((item) => (
                    <button
                      key={item.id}
                      className={cls("rd-nav-btn", view === item.id && "active")}
                      onClick={() => handleNavigate(item.id)}
                      aria-current={view === item.id ? "page" : undefined}
                    >
                      <span className="rd-nav-ic"><NavIcon id={item.id} /></span>
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
                <Ico.SignOut /> Sign Out
              </button>
            </div>
          </aside>

          {/* Main */}
          <div className="rd-main">
            <header className="rd-topbar">
              <button className="rd-hamburger" onClick={() => setSidebarOpen(true)} aria-label="Open navigation">
                <Ico.Menu />
              </button>

              <div className="rd-crumb" aria-label="Breadcrumb">
                <span className="rd-crumb-hide">DUMASAFEGUIDE</span>
                <span className="rd-crumb-sep rd-crumb-hide">/</span>
                <span className="rd-crumb-hide">RESPONDER</span>
                <span className="rd-crumb-sep rd-crumb-hide">/</span>
                <span className="rd-crumb-active">{PAGE_TITLE[view]}</span>
              </div>

              <div className="rd-topbar-right">
                <span className="rd-clock">{clock}</span>
                <div className="rd-notif-wrap">
                  <button className="rd-icon-btn" onClick={() => handleNavigate("alerts")} aria-label="Alerts">
                    <Ico.Bell />
                  </button>
                  {alertCount > 0 && view !== "alerts" && <span className="rd-notif-dot" />}
                </div>
              </div>
            </header>

            <main className="rd-page">
              {/* ✅ FIX: render overview once auth is ready, regardless of responderId */}
              {view === "overview" && !authReady && (
                <div className="rd-empty">
                  <div className="rd-spinner" style={{ margin: "0 auto" }} />
                </div>
              )}
              {view === "overview" && authReady && (
                <OverviewPanel onNavigate={handleNavigate} responderId={responderId} />
              )}
              {view === "dispatch"  && <Dispatch />}
              {view === "incidents" && <ResponderIncidentsPage />}
              {view === "alerts"    && <ResponderAlertsPage />}
              {view === "team"      && <RespondersPage />}
            </main>
          </div>
        </div>
      </div>
    </>
  );
}