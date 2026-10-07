// src/citizen/CitizenHistoryPage.tsx
import { useEffect, useState, useCallback } from "react";
import { useLanguage } from "../context/LanguageContext";
import { supabase } from "../js/supabase";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FaFileAlt, FaClock, FaSpinner, FaCheckCircle,
  FaExclamationCircle, FaChevronRight, FaInbox,
  FaBell, FaArrowLeft,
  FaClipboardCheck, FaUserShield,
} from "react-icons/fa";
import { Card, SectionHead, Stat, StatusPill, Tag, Tile, EmptyState, SkeletonRows } from "./components/ui";

import pagesBackground from '../assets/pagesbackground.png';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Report {
  id: string;
  description: string;
  type: string;
  status: "pending" | "in-progress" | "resolved";
  created_at: string;
  location: string | null;
  address: string | null;
  evidence_url: string | null;
  responder_id: string | null;
  responder_notes: string | null;
  action_notes: string | null;
  resolution_type: string | null;
  resolved_at: string | null;
}

// ─── Read-tracking helpers (localStorage) ────────────────────────────────────

function getReadIds(userId: string): Set<string> {
  try {
    const raw = localStorage.getItem(`read_reports_${userId}`);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function markAsRead(userId: string, reportId: string) {
  try {
    const ids = getReadIds(userId);
    ids.add(reportId);
    localStorage.setItem(`read_reports_${userId}`, JSON.stringify([...ids]));
  } catch {}
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_META: Record<string, { icon: string; color: string }> = {
  fire:     { icon: "🔥", color: "var(--c-fire)" },
  accident: { icon: "🚗", color: "var(--c-accident)" },
  flood:    { icon: "🌊", color: "var(--c-flood)" },
  crime:    { icon: "🚨", color: "var(--c-crime)" },
  medical:  { icon: "🏥", color: "var(--c-medical)" },
  other:    { icon: "⚠️", color: "var(--c-other)" },
};

const STATUS_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending:       { label: "PENDING",     color: "var(--c-pending)",  bg: "var(--clr-yellow-bg)", border: "var(--clr-yellow-border)" },
  "in-progress": { label: "IN PROGRESS", color: "var(--c-progress)", bg: "var(--clr-blue-bg)",   border: "var(--clr-blue-border)"  },
  resolved:      { label: "RESOLVED",    color: "var(--c-resolved)", bg: "var(--clr-green-bg)",  border: "var(--clr-green-border)"  },
};

const RESOLUTION_META: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  "forwarded":      { label: "Forwarded to Department",    icon: "↗", color: "var(--c-progress)", bg: "var(--clr-blue-bg)" },
  "follow-up":      { label: "Resolved — Needs Follow-Up", icon: "⟳", color: "var(--c-pending)",  bg: "var(--clr-yellow-bg)" },
  "fully-resolved": { label: "Fully Resolved",             icon: "✓", color: "var(--c-resolved)", bg: "var(--clr-green-bg)"  },
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@400;500;700;800;900&family=Instrument+Sans:wght@400;500;600&display=swap');

:root {
  --bg: var(--clr-bg); --surface: var(--citizen-card); --surface-2: var(--clr-surface-2);
  --border: var(--clr-border); --border-2: var(--clr-border-2);
  --text: var(--clr-text); --text-2: var(--clr-text-muted); --text-3: var(--clr-text-faint);
  --green: var(--clr-green); --red: var(--clr-red); --blue: var(--clr-blue); --yellow: var(--c-pending);
  --font-display: 'Cabinet Grotesk', sans-serif;
  --font-body: 'Instrument Sans', sans-serif;
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
@keyframes fadeIn  { from { opacity: 0; transform: translateY(8px);   } to { opacity: 1; transform: none; } }
@keyframes slideIn { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: none; } }
@keyframes pulse   { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
@keyframes spin    { to { transform: rotate(360deg); } }

.ch-portal {
  position: relative; min-height: 100vh; z-index: 0; overflow: hidden;
  font-family: var(--font-body); color: var(--text); background: var(--bg);
  background-image: url('${pagesBackground}');
  background-size: cover; background-position: center;
  background-attachment: fixed; background-repeat: no-repeat;
}
.ch-portal::before {
  content: ''; position: fixed; inset: 0;
  background: linear-gradient(160deg, var(--citizen-scrim) 0%, color-mix(in srgb, var(--citizen-scrim) 82%, transparent) 50%, var(--citizen-scrim) 100%);
  pointer-events: none; z-index: 1;
}
.ch-overlay { display: none; position: fixed; inset: 0; z-index: 190; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); }
.ch-overlay.open { display: block; }

.ch-sidebar {
  width: 260px; flex-shrink: 0; background: rgba(15,21,33,.82); border-right: 1px solid var(--border);
  display: flex; flex-direction: column; height: 100%; position: fixed; left: 0; top: 0; z-index: 200;
  overflow: hidden; transition: transform 0.3s ease; backdrop-filter: blur(16px);
}
.ch-logo { padding: 20px 16px; display: flex; align-items: center; gap: 12px; flex-shrink: 0; border-bottom: 1px solid var(--border); }
.ch-logo-img  { width: 40px; height: 40px; object-fit: contain; border-radius: 8px; }
.ch-logo-name { font-size: 15px; font-weight: 700; color: var(--text); white-space: nowrap; font-family: var(--font-display); }
.ch-logo-sub  { font-size: 11px; color: var(--text-3); margin-top: 3px; display: flex; align-items: center; gap: 6px; }
.ch-pip { display: inline-block; width: 5px; height: 5px; border-radius: 50%; background: var(--green); animation: pulse 2s ease infinite; flex-shrink: 0; box-shadow: 0 0 6px var(--green); }
.ch-sidebar-close { display: none; margin-left: auto; flex-shrink: 0; background: transparent; border: 1px solid var(--border); border-radius: 6px; width: 28px; height: 28px; align-items: center; justify-content: center; color: var(--text-3); cursor: pointer; transition: all 0.2s; }
.ch-sidebar-close:hover { background: var(--surface-2); color: var(--text); }
.ch-nav-scroll { flex: 1; overflow-y: auto; padding: 8px 10px; scrollbar-width: thin; scrollbar-color: var(--border) transparent; }
.ch-nav-label { display: flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 600; color: var(--text-3); letter-spacing: 0.5px; text-transform: uppercase; padding: 12px 8px 6px; }
.ch-nav-label::after { content: ''; flex: 1; height: 1px; background: var(--border); }
.ch-nav-btn { display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid transparent; font-size: 13px; font-weight: 500; color: var(--text-2); background: transparent; cursor: pointer; margin-bottom: 2px; text-align: left; transition: all 0.2s; text-decoration: none; }
.ch-nav-btn:hover  { background: rgba(46,204,143,.08); color: var(--text); border-color: var(--border); }
.ch-nav-btn.active { background: linear-gradient(135deg, var(--green) 0%, #24a97a 100%); color: #080c14; border-color: transparent; font-weight: 600; box-shadow: 0 2px 8px rgba(46,204,143,.3); }
.ch-nav-ic { font-size: 15px; flex-shrink: 0; color: var(--text-3); display: flex; align-items: center; transition: color 0.2s; }
.ch-nav-btn.active .ch-nav-ic { color: #080c14; }
.ch-badge { margin-left: auto; background: var(--red); color: white; font-size: 10px; min-width: 20px; height: 20px; border-radius: 10px; padding: 0 6px; display: flex; align-items: center; justify-content: center; font-weight: 600; }
.ch-sidebar-foot { padding: 12px 10px 16px; border-top: 1px solid var(--border); flex-shrink: 0; }
.ch-user-card { display: flex; align-items: center; gap: 10px; padding: 12px; background: rgba(8,12,20,.6); border: 1px solid var(--border); border-radius: 8px; margin-bottom: 8px; }
.ch-avatar    { width: 32px; height: 32px; border-radius: 6px; flex-shrink: 0; background: linear-gradient(135deg, var(--green) 0%, #24a97a 100%); display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 11px; color: #080c14; }
.ch-user-name   { font-size: 13px; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ch-user-status { font-size: 10px; color: var(--green); display: flex; align-items: center; gap: 5px; margin-top: 2px; }
.ch-logout-btn  { display: flex; align-items: center; gap: 8px; width: 100%; padding: 9px 12px; background: rgba(8,12,20,.6); border: 1px solid var(--border); border-radius: 8px; font-size: 13px; font-weight: 500; color: var(--text-2); cursor: pointer; transition: all 0.2s; }
.ch-logout-btn:hover { background: rgba(255,107,107,.12); color: var(--red); border-color: var(--red); }

.ch-page { flex: 1; padding: 24px; overflow-x: hidden; min-width: 0; min-height: calc(100vh - 56px); position: relative; z-index: 2; }
.ch-page > div { animation: fadeIn 0.4s ease-out both; }
.ch-page-hd { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; margin-bottom: 24px; }
.ch-eyebrow { font-size: 11px; color: var(--green); letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 6px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
.ch-eyebrow::before { content: ''; display: block; width: 20px; height: 2px; background: var(--green); }
.ch-title    { font-size: 32px; color: var(--text); letter-spacing: -0.5px; line-height: 1.1; font-weight: 900; font-family: var(--font-display); }
.ch-subtitle { font-size: 11px; color: var(--text-3); margin-top: 4px; }

.ch-stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 24px; }
.ch-stat { background: rgba(15,21,33,.82); border: 1px solid var(--border); border-radius: 12px; padding: 20px; position: relative; overflow: hidden; transition: all 0.3s; animation: fadeIn 0.5s ease-out both; backdrop-filter: blur(16px); }
.ch-stat:hover { transform: translateY(-4px); border-color: var(--green); box-shadow: 0 8px 16px rgba(46,204,143,.15); }
.ch-stat::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: var(--card-accent); }
.ch-stat-icon  { font-size: 18px; color: var(--card-accent); margin-bottom: 12px; opacity: 0.85; }
.ch-stat-num   { font-size: 32px; line-height: 1; margin-bottom: 6px; letter-spacing: -0.5px; font-weight: 900; color: var(--card-accent); font-family: var(--font-display); }
.ch-stat-label { font-size: 11px; color: var(--text-2); letter-spacing: 0.3px; text-transform: uppercase; font-weight: 600; }

.ch-panel { background: rgba(15,21,33,.82); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; animation: slideIn 0.5s ease-out both; position: relative; backdrop-filter: blur(16px); }
.ch-panel::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: var(--green); }
.ch-panel-hd { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--border); background: rgba(8,12,20,.4); }
.ch-panel-title { font-size: 11px; color: var(--text-2); letter-spacing: 0.5px; text-transform: uppercase; font-weight: 600; }
.ch-panel-tag   { font-size: 9px; color: var(--green); border: 1px solid var(--green); border-radius: 4px; padding: 3px 8px; background: rgba(46,204,143,.1); font-weight: 600; }

.ch-list { display: flex; flex-direction: column; }
.ch-row { display: flex; align-items: center; gap: 14px; padding: 16px 20px; border-bottom: 1px solid var(--border); text-decoration: none; color: inherit; transition: background 0.15s; cursor: pointer; position: relative; }
.ch-row:last-child { border-bottom: none; }
.ch-row:hover { background: rgba(46,204,143,.05); }
.ch-row.unread { background: rgba(46,204,143,.03); }
.ch-row.unread::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: var(--green); border-radius: 0 2px 2px 0; }
.ch-row-icon { width: 36px; height: 36px; border-radius: 8px; flex-shrink: 0; border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 16px; background: rgba(8,12,20,.4); }
.ch-row-body { flex: 1; min-width: 0; }
.ch-row-desc { font-size: 13px; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px; }
.ch-row.unread .ch-row-desc { color: var(--clr-text); }
.ch-row-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.ch-row-date { font-size: 11px; color: var(--text-2); }
.ch-row-type { font-size: 10px; font-weight: 700; letter-spacing: 0.05em; text-transform: capitalize; border-radius: 4px; padding: 2px 8px; }
.ch-row-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.ch-unread-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--green); box-shadow: 0 0 6px var(--green); flex-shrink: 0; }
.ch-pill { display: inline-flex; align-items: center; gap: 5px; font-size: 10px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; border-radius: 6px; padding: 4px 10px; border: 1px solid; }
.ch-pill-dot { width: 4px; height: 4px; border-radius: 50%; background: currentColor; flex-shrink: 0; }
.ch-chevron  { color: var(--text-3); font-size: 10px; transition: transform 0.2s; }
.ch-row:hover .ch-chevron { transform: translateX(2px); color: var(--text-2); }

/* ── Detail View ── */
.ch-detail { display: flex; flex-direction: column; gap: 16px; animation: fadeIn 0.4s ease-out both; }
.ch-back-btn { display: inline-flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 600; color: var(--text-3); background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 8px; padding: 8px 14px; cursor: pointer; transition: all 0.2s; text-decoration: none; width: fit-content; margin-bottom: 4px; }
.ch-back-btn:hover { color: var(--text); border-color: var(--border-2); background: rgba(255,255,255,0.06); }
.ch-detail-card { background: rgba(15,21,33,.82); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; backdrop-filter: blur(16px); position: relative; }
.ch-detail-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: var(--card-top); }
.ch-detail-hd { padding: 20px 24px; border-bottom: 1px solid var(--border); display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; background: rgba(8,12,20,.4); }
.ch-detail-type-row { display: flex; align-items: center; gap: 12px; }
.ch-detail-type-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 22px; border: 1px solid var(--border); background: rgba(8,12,20,.5); }
.ch-detail-type-name { font-size: 20px; font-weight: 900; font-family: var(--font-display); text-transform: capitalize; }
.ch-detail-id { font-size: 10px; color: var(--text-3); margin-top: 3px; font-family: monospace; }
.ch-detail-body { padding: 24px; display: flex; flex-direction: column; gap: 20px; }
.ch-detail-section-title { font-size: 10px; font-weight: 700; color: var(--text-3); letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
.ch-detail-section-title::after { content: ''; flex: 1; height: 1px; background: var(--border); }
.ch-detail-field { display: flex; flex-direction: column; gap: 4px; }
.ch-detail-field-label { font-size: 10px; font-weight: 600; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.4px; }
.ch-detail-field-value { font-size: 13px; color: var(--text); line-height: 1.55; }
.ch-detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

/* ── Timeline ── */
.ch-timeline { display: flex; flex-direction: column; gap: 0; }
.ch-tl-item { display: flex; gap: 14px; position: relative; }
.ch-tl-item:not(:last-child)::before { content: ''; position: absolute; left: 15px; top: 32px; bottom: 0; width: 1px; background: var(--border); }
.ch-tl-dot { width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 13px; border: 2px solid; z-index: 1; }
.ch-tl-dot.pending  { background: var(--clr-yellow-bg); border-color: var(--c-pending);  color: var(--c-pending); }
.ch-tl-dot.progress { background: var(--clr-blue-bg);   border-color: var(--c-progress); color: var(--c-progress); }
.ch-tl-dot.resolved { background: var(--clr-green-bg);  border-color: var(--c-resolved); color: var(--c-resolved); }
.ch-tl-dot.inactive { background: var(--clr-surface-2); border-color: var(--clr-border); color: var(--text-3); }
.ch-tl-content { flex: 1; padding-bottom: 20px; }
.ch-tl-label { font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 3px; }
.ch-tl-label.inactive { color: var(--text-3); }
.ch-tl-time  { font-size: 10px; color: var(--text-3); font-family: monospace; margin-bottom: 6px; }
.ch-tl-note  { font-size: 12px; color: var(--text-2); line-height: 1.55; background: rgba(8,12,20,.4); border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; }

/* ── Resolution Box ── */
.ch-resolution { border-radius: 12px; overflow: hidden; border: 1px solid var(--clr-green-border); background: var(--clr-green-bg); }
.ch-resolution-hd { display: flex; align-items: center; gap: 10px; padding: 14px 18px; background: var(--clr-green-bg); border-bottom: 1px solid var(--clr-green-border); }
.ch-resolution-hd-icon { font-size: 16px; }
.ch-resolution-hd-title { font-size: 12px; font-weight: 700; color: var(--clr-green); flex: 1; text-transform: uppercase; letter-spacing: 0.4px; }
.ch-resolution-type-pill { display: inline-flex; align-items: center; gap: 6px; font-size: 10px; font-weight: 700; padding: 4px 10px; border-radius: 20px; border: 1px solid; }
.ch-resolution-body { padding: 18px; display: flex; flex-direction: column; gap: 16px; }
.ch-resolution-field { display: flex; flex-direction: column; gap: 8px; }
.ch-resolution-field-label { font-size: 10px; font-weight: 700; color: var(--clr-green); text-transform: uppercase; letter-spacing: 0.4px; display: flex; align-items: center; gap: 6px; }
.ch-resolution-field-value { font-size: 13px; color: var(--text); line-height: 1.7; background: var(--clr-surface-2); border: 1px solid var(--clr-green-border); border-radius: 10px; padding: 14px 16px; }
.ch-resolution-field-value.empty { color: var(--text-3); font-style: italic; }
.ch-resolution-divider { height: 1px; background: var(--clr-green-border); }
.ch-resolution-footer { padding: 10px 18px 14px; font-size: 11px; color: var(--clr-green); display: flex; align-items: center; gap: 6px; }

/* ── Evidence ── */
.ch-evidence { border-radius: 10px; overflow: hidden; border: 1px solid var(--border); }
.ch-evidence img   { width: 100%; max-height: 280px; object-fit: cover; display: block; cursor: zoom-in; }
.ch-evidence video { width: 100%; max-height: 280px; display: block; background: #000; }

/* ── Notices ── */
.ch-status-notice { display: flex; align-items: flex-start; gap: 14px; border-radius: 10px; padding: 16px 18px; border: 1px solid; }
.ch-status-notice.pending     { background: var(--clr-yellow-bg); border-color: var(--clr-yellow-border); }
.ch-status-notice.in-progress { background: var(--clr-blue-bg);   border-color: var(--clr-blue-border); }
.ch-status-notice-icon  { font-size: 18px; flex-shrink: 0; margin-top: 1px; }
.ch-status-notice-title { font-size: 13px; font-weight: 700; margin-bottom: 4px; }
.ch-status-notice.pending     .ch-status-notice-title { color: var(--c-pending); }
.ch-status-notice.in-progress .ch-status-notice-title { color: var(--c-progress); }
.ch-status-notice-text { font-size: 12px; color: var(--text-2); line-height: 1.55; }

/* ── Empty / Loading ── */
.ch-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 24px; gap: 8px; text-align: center; }
.ch-empty-icon  { font-size: 28px; color: var(--text-3); margin-bottom: 4px; opacity: 0.4; }
.ch-empty-title { font-size: 15px; font-weight: 600; color: var(--text-2); font-family: var(--font-display); }
.ch-empty-sub   { font-size: 13px; color: var(--text-3); max-width: 280px; line-height: 1.6; }
.ch-empty-link  { margin-top: 12px; font-size: 12px; font-weight: 600; color: var(--green); text-decoration: none; border: 1px solid var(--green); border-radius: 8px; padding: 8px 16px; background: rgba(46,204,143,.08); display: inline-flex; align-items: center; gap: 6px; transition: all 0.2s; }
.ch-empty-link:hover { background: rgba(46,204,143,.15); }
.ch-loading { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 56px; color: var(--text-3); font-size: 13px; }
.ch-spinner { display: inline-block; width: 16px; height: 16px; border-radius: 50%; border: 2px solid var(--border); border-top-color: var(--green); animation: spin 0.8s linear infinite; }

@media (max-width: 768px) {
  .ch-sidebar { transform: translateX(-100%); width: min(260px, 90vw); }
  .ch-sidebar.open { transform: translateX(0); }
  .ch-sidebar-close { display: flex; }
  .ch-hamburger { display: flex; }
  .ch-crumb-hide { display: none; }
  .ch-page { padding: 16px; }
  .ch-title { font-size: 26px; }
  .ch-stat-grid { grid-template-columns: repeat(2, 1fr); }
  .ch-clock { display: none; }
  .ch-detail-grid { grid-template-columns: 1fr; }
}
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function usePHTClock() {
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

function fmtDate(ts: string, locale = "en-PH") {
  return new Date(ts).toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" });
}
function fmtDateTime(ts: string, locale = "en-PH") {
  return new Date(ts).toLocaleString(locale, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// Resolution-type key mapping: DB values use kebab-case, the
// reportDetail.resolutionLabels dictionary uses camelCase.
function resolutionKey(rt: string | null | undefined): "forwarded" | "followUp" | "fullyResolved" {
  if (rt === "follow-up") return "followUp";
  if (rt === "fully-resolved") return "fullyResolved";
  return "forwarded";
}

// ─── Detail View ─────────────────────────────────────────────────────────────

function ReportDetail({ report, onBack }: { report: Report; onBack: () => void }) {
  // Consumes the active Navbar/Header language — re-renders on selector change.
  const { language, t, tList } = useLanguage();
  void tList;
  const locale = language === "tl" ? "fil-PH" : "en-PH";
  const tm      = TYPE_META[report.type?.toLowerCase()] ?? TYPE_META.other;
  const sm      = STATUS_META[report.status]            ?? STATUS_META.pending;
  // Language-aware labels (dictionary first, English data fallback).
  const statusLabel = t(`status.${report.status === "in-progress" ? "inProgress" : report.status}`, sm.label);
  const typeName = t(`report.types.${report.type?.toLowerCase()}`, report.type);
  const resolutionName = report.resolution_type
    ? t(`reportDetail.resolutionLabels.${resolutionKey(report.resolution_type)}`, RESOLUTION_META[report.resolution_type]?.label ?? report.resolution_type)
    : "";
  const rm      = report.resolution_type ? RESOLUTION_META[report.resolution_type] : null;
  const isVideo = report.evidence_url && /\.(mp4|mov|webm)/i.test(report.evidence_url);

  const knownResolutionTypes = ["forwarded", "follow-up", "fully-resolved"];
  const responderNotes = (report.responder_notes ?? "").trim();
  const actionNotes    = (report.action_notes    ?? "").trim();
  const safeResponderNotes = knownResolutionTypes.includes(responderNotes) ? "" : responderNotes;
  const safeActionNotes    = knownResolutionTypes.includes(actionNotes)    ? "" : actionNotes;

  return (
    <div className="ch-detail">
      <button className="ch-back-btn" onClick={onBack}>
        <FaArrowLeft size={11} /> {t("reportDetail.backToHistory")}
      </button>

      <div className="ch-detail-card" style={{ "--card-top": tm.color } as React.CSSProperties}>
        <div className="ch-detail-hd">
          <div className="ch-detail-type-row">
            <div className="ch-detail-type-icon">{tm.icon}</div>
            <div>
              <div className="ch-detail-type-name" style={{ color: tm.color }}>{typeName}</div>
              <div className="ch-detail-id">ID: {report.id}</div>
            </div>
          </div>
          <span className="ch-pill" style={{ color: sm.color, background: sm.bg, borderColor: sm.border }}>
            <span className="ch-pill-dot" /> {statusLabel}
          </span>
        </div>

        <div className="ch-detail-body">

          {/* Description + location */}
          <div>
            <div className="ch-detail-section-title">{t("reportDetail.reportDetails")}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div className="ch-detail-field">
                <span className="ch-detail-field-label">{t("reportDetail.description")}</span>
                <span className="ch-detail-field-value">{report.description || t("reportDetail.noDescription")}</span>
              </div>
              <div className="ch-detail-grid">
                <div className="ch-detail-field">
                  <span className="ch-detail-field-label">{t("reportDetail.location")}</span>
                  <span className="ch-detail-field-value">{report.address || report.location || t("reportDetail.notSpecified")}</span>
                </div>
                <div className="ch-detail-field">
                  <span className="ch-detail-field-label">{t("reportDetail.submitted")}</span>
                  <span className="ch-detail-field-value">{fmtDateTime(report.created_at, locale)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Evidence */}
          {report.evidence_url && (
            <div>
              <div className="ch-detail-section-title">{t("reportDetail.evidence")}</div>
              <div className="ch-evidence">
                {isVideo
                  ? <video src={report.evidence_url} controls preload="metadata" />
                  : <img src={report.evidence_url} alt={t("reportDetail.evidenceAlt", "Evidence")} onClick={() => window.open(report.evidence_url!, "_blank")} />
                }
              </div>
            </div>
          )}

          {/* Timeline */}
          <div>
            <div className="ch-detail-section-title">{t("reportDetail.statusTimeline")}</div>
            <div className="ch-timeline">
              <div className="ch-tl-item">
                <div className="ch-tl-dot resolved">✓</div>
                <div className="ch-tl-content">
                  <div className="ch-tl-label">{t("reportDetail.reportFiled")}</div>
                  <div className="ch-tl-time">{fmtDateTime(report.created_at, locale)}</div>
                  <div className="ch-tl-note">{t("reportDetail.reportFiledSub")}</div>
                </div>
              </div>
              <div className="ch-tl-item">
                <div className={`ch-tl-dot ${report.responder_id ? "progress" : "inactive"}`}>
                  {report.responder_id ? "👤" : "○"}
                </div>
                <div className="ch-tl-content">
                  <div className={`ch-tl-label ${!report.responder_id ? "inactive" : ""}`}>
                    {report.responder_id ? t("reportDetail.claimedByResponder") : t("reportDetail.awaitingResponder")}
                  </div>
                  {!report.responder_id && <div className="ch-tl-time">{t("reportDetail.awaitingResponderSub")}</div>}
                  {report.responder_id && report.status === "in-progress" && (
                    <div className="ch-tl-note" style={{ borderColor: "rgba(123,158,255,.2)", background: "rgba(123,158,255,.05)" }}>
                      {t("reportDetail.responderOnItSub")}
                    </div>
                  )}
                </div>
              </div>
              <div className="ch-tl-item">
                <div className={`ch-tl-dot ${report.status === "resolved" ? "resolved" : "inactive"}`}>
                  {report.status === "resolved" ? "✓" : "○"}
                </div>
                <div className="ch-tl-content">
                  <div className={`ch-tl-label ${report.status !== "resolved" ? "inactive" : ""}`}>
                    {report.status === "resolved" ? t("reportDetail.statusResolved") : t("reportDetail.resolutionPending")}
                  </div>
                  {report.resolved_at && <div className="ch-tl-time">{fmtDateTime(report.resolved_at, locale)}</div>}
                </div>
              </div>
            </div>
          </div>

          {/* Resolution details — always shown for resolved */}
          {report.status === "resolved" && (
            <div>
              <div className="ch-detail-section-title">{t("reportDetail.responderUpdates")}</div>
              <div className="ch-resolution">
                <div className="ch-resolution-hd">
                  <span className="ch-resolution-hd-icon">🛡️</span>
                  <span className="ch-resolution-hd-title">{t("reportDetail.resolutionSummary")}</span>
                  {rm && (
                    <span className="ch-resolution-type-pill" style={{ color: rm.color, background: rm.bg, borderColor: `${rm.color}40` }}>
                      {rm.icon} {resolutionName}
                    </span>
                  )}
                </div>
                <div className="ch-resolution-body">
                  <div className="ch-resolution-field">
                    <span className="ch-resolution-field-label">
                      <FaUserShield size={10} /> {t("reportDetail.responseNotes")}
                    </span>
                    <div className={`ch-resolution-field-value ${!safeResponderNotes ? "empty" : ""}`}>
                      {safeResponderNotes || t("reportDetail.noNotesProvided")}
                    </div>
                  </div>
                  <div className="ch-resolution-divider" />
                  <div className="ch-resolution-field">
                    <span className="ch-resolution-field-label">
                      <FaClipboardCheck size={10} /> {t("reportDetail.actionTaken")}
                    </span>
                    <div className={`ch-resolution-field-value ${!safeActionNotes ? "empty" : ""}`}>
                      {safeActionNotes || t("reportDetail.noActionDetails")}
                    </div>
                  </div>
                </div>
                {report.resolved_at && (
                  <div className="ch-resolution-footer">
                    🕐 {t("reportDetail.resolvedOn").replace("{date}", fmtDateTime(report.resolved_at, locale))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status notices */}
          {report.status === "pending" && (
            <div className="ch-status-notice pending">
              <span className="ch-status-notice-icon">⏳</span>
              <div>
                <div className="ch-status-notice-title">{t("reportDetail.awaitingResponder")}</div>
                <p className="ch-status-notice-text">{t("reportDetail.awaitingResponderSub")}</p>
              </div>
            </div>
          )}
          {report.status === "in-progress" && (
            <div className="ch-status-notice in-progress">
              <span className="ch-status-notice-icon">🚨</span>
              <div>
                <div className="ch-status-notice-title">{t("reportDetail.responderOnIt")}</div>
                <p className="ch-status-notice-text">{t("reportDetail.responderOnItSub")}</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CitizenHistoryPage() {
  // Consumes the active Navbar/Header language — any selector change re-renders
  // this page and re-evaluates every t() call and language-aware helper below.
  const { language, t, tList } = useLanguage();
  void tList;
  const locale = language === "tl" ? "fil-PH" : "en-PH";
  const navigate     = useNavigate();
  const { id }       = useParams<{ id: string }>();
  const clock        = usePHTClock();

  const [reports,     setReports]     = useState<Report[]>([]);
  const [userId,      setUserId]      = useState<string>("");
  const [loading,     setLoading]     = useState(true);
  const [readIds,     setReadIds]     = useState<Set<string>>(new Set());

  const refreshReadIds = useCallback((uid: string) => {
    setReadIds(getReadIds(uid));
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
        refreshReadIds(data.user.id);
      }
    });
  }, [refreshReadIds]);

  useEffect(() => {
    if (!userId) return;
    const fetchReports = async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("id, description, type, status, created_at, location, address, evidence_url, responder_id, responder_notes, action_notes, resolution_type, resolved_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (!error) setReports(data || []);
      setLoading(false);
    };
    fetchReports();

    const ch = supabase
      .channel("ch-reports-live")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "reports" }, fetchReports)
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [userId]);

  // Mark as read when opening detail view
  useEffect(() => {
    if (id && userId) {
      markAsRead(userId, id);
      refreshReadIds(userId);
    }
  }, [id, userId, refreshReadIds]);

  const stats = {
    total:      reports.length,
    pending:    reports.filter(r => r.status === "pending").length,
    inProgress: reports.filter(r => r.status === "in-progress").length,
    resolved:   reports.filter(r => r.status === "resolved").length,
  };

  // Unread = reports the citizen hasn't opened yet
  const unreadCount = reports.filter(r => !readIds.has(String(r.id))).length;

  const selectedReport = id ? reports.find(r => String(r.id) === String(id)) ?? null : null;

  // Language-aware labels for the report list (dictionary first, English fallback).
  const statusLabel = (s: string) =>
    t(`status.${s === "in-progress" ? "inProgress" : s}`, STATUS_META[s]?.label ?? s);
  const typeName = (type: string | undefined) =>
    t(`report.types.${type?.toLowerCase()}`, type ?? "");
  const resolutionName = (rt: string | null | undefined) =>
    rt ? t(`reportDetail.resolutionLabels.${resolutionKey(rt)}`, RESOLUTION_META[rt]?.label ?? rt) : "";

  const statCards = [
    { label: t("dashboard.statTotalFiled"),  value: stats.total,      accent: "var(--clr-blue)", icon: <FaFileAlt size={15} />     },
    { label: t("dashboard.statPending"),      value: stats.pending,    accent: "var(--c-pending)",  icon: <FaClock size={15} />       },
    { label: t("dashboard.statInProgress"),  value: stats.inProgress, accent: "var(--c-progress)", icon: <FaSpinner size={15} />     },
    { label: t("dashboard.statResolved"),     value: stats.resolved,   accent: "var(--c-resolved)", icon: <FaCheckCircle size={15} /> },
  ];

  return (
    <>
      <style>{STYLES}</style>
      <div className="ch-portal">
        <div className="ch-page">
          <div>

{selectedReport ? (
              <ReportDetail report={selectedReport} onBack={() => navigate("/citizen/history")} />
                ) : (
                  <>
                    <div className="ch-page-hd">
                      <div>
                        <div className="ch-eyebrow">{t("dashboard.citizenPortal")}</div>
                        <div className="ch-title">{t("history.pageTitle")}</div>
                        <div className="ch-subtitle">{t("history.subtitle")}</div>
                      </div>
                    </div>

                    <div className="dsg-stat-grid">
                      {statCards.map(c => (
                        <Stat key={c.label} icon={c.icon} value={c.value} label={c.label} accent={c.accent} loading={loading} />
                      ))}
                    </div>

                    <Card>
                      <SectionHead
                        title={t("history.allReports")}
                        action={
                          <span className="ch-panel-tag">
                            {loading ? "…" : unreadCount > 0 ? `${unreadCount} ${t("history.totalLabel")}` : `${stats.total} ${t("history.totalLabel")}`}
                          </span>
                        }
                      />

                      {loading ? (
                        <SkeletonRows rows={4} />
                      ) : reports.length === 0 ? (
                        <EmptyState
                          icon={<FaInbox />}
                          title={t("history.noReportsYet")}
                          sub={t("history.noReportsSub")}
                          actionLabel={t("history.fileAReport")}
                          onAction={() => navigate("/citizen/report")}
                        />
                      ) : (
                        <div className="dsg-list">
                          {reports.map(r => {
                            const tm       = TYPE_META[r.type?.toLowerCase()] ?? TYPE_META.other;
                            const sm       = STATUS_META[r.status]            ?? STATUS_META.pending;
                            const isUnread = !readIds.has(String(r.id));
                            return (
                              <button
                                key={r.id}
                                type="button"
                                className={`dsg-row${isUnread ? " is-unread" : ""}`}
                                onClick={() => navigate(`/citizen/history/${r.id}`)}
                              >
                                <Tile icon={tm.icon} color={tm.color} />
                                <span className="dsg-row-body">
                                  <span className="dsg-row-desc" title={r.description}>{r.description || t("reportDetail.noDescription")}</span>
                                  <span className="dsg-row-meta">
                                    <span className="dsg-time">{fmtDate(r.created_at, locale)}</span>
                                    {r.type && (
                                      <Tag color={tm.color} bg={`color-mix(in srgb, ${tm.color} 14%, transparent)`} border={`color-mix(in srgb, ${tm.color} 32%, transparent)`}>
                                        {typeName(r.type)}
                                      </Tag>
                                    )}
                                    {r.status === "resolved" && r.resolution_type && RESOLUTION_META[r.resolution_type] && (
                                      <Tag color="var(--c-resolved)" bg="var(--clr-green-bg)" border="var(--clr-green-border)">
                                        {RESOLUTION_META[r.resolution_type].icon} {resolutionName(r.resolution_type)}
                                      </Tag>
                                    )}
                                  </span>
                                </span>
                                <span style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                                  {isUnread && <span className="ch-unread-dot" />}
                                  <StatusPill color={sm.color} bg={sm.bg} border={sm.border}>
                                    {statusLabel(r.status)}
                                  </StatusPill>
                                  <FaChevronRight style={{ color: "var(--clr-text-faint)", fontSize: 10 }} />
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </Card>
                  </>
                )}

</div>
      </div>
    </div>
    </>
  );
}