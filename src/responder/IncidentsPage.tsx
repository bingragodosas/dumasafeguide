import { useEffect, useState } from "react";
import { supabase } from "../js/supabase";
import {
  FaMapMarkerAlt,
  FaUser,
  FaClock,
  FaPhone,
  FaImage,
  FaVideo,
  FaExternalLinkAlt,
  FaCheckCircle,
  FaSearch,
  FaStickyNote,
  FaTimes,
  FaShieldAlt,
  FaHospital,
  FaWater,
} from "react-icons/fa";

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

// ── Agency contacts per incident type ────────────────────────────────────────
interface Agency {
  label: string;
  number: string;
  icon: string;
  color: string;
  note?: string; // small descriptor
}

const AGENCY_CONTACTS: Record<string, Agency[]> = {
  fire: [
    { label: "BFP Dumaguete",   number: "422-2022", icon: "🔥", color: "#EF5B5B", note: "Bureau of Fire Protection" },
    { label: "CDRRMO",          number: "422-3008", icon: "🌀", color: "#F5C842", note: "City Disaster Risk Reduction" },
    { label: "PNP Dumaguete",   number: "422-8708", icon: "👮", color: "#5B8DEF", note: "Philippine National Police" },
  ],
  flood: [
    { label: "CDRRMO",          number: "422-3008", icon: "🌊", color: "#5B8DEF", note: "City Disaster Risk Reduction" },
    { label: "PDRRMO",          number: "422-3006", icon: "🌀", color: "#F5C842", note: "Provincial DRRMO" },
    { label: "PNP Dumaguete",   number: "422-8708", icon: "👮", color: "#EF5B9E", note: "Philippine National Police" },
    { label: "LDRRMO",          number: "422-3007", icon: "🏛️", color: "#B0B8CC", note: "Local DRRMO Office" },
  ],
  medical: [
    { label: "Holy Child Hospital",  number: "422-5555", icon: "🏥", color: "#2ECC8F", note: "Primary Hospital" },
    { label: "Silliman University Medical Center", number: "422-2691", icon: "🏨", color: "#5B8DEF", note: "SUMC Emergency" },
    { label: "PDRRMO",          number: "422-3006", icon: "🚑", color: "#F5C842", note: "Provincial DRRMO Ambulance" },
    { label: "PNP Dumaguete",   number: "422-8708", icon: "👮", color: "#EF5B9E", note: "For security escort" },
  ],
  accident: [
    { label: "PNP Dumaguete",   number: "422-8708", icon: "👮", color: "#5B8DEF", note: "Philippine National Police" },
    { label: "Holy Child Hospital",  number: "422-5555", icon: "🏥", color: "#2ECC8F", note: "Emergency Room" },
    { label: "CDRRMO",          number: "422-3008", icon: "🌀", color: "#F5C842", note: "City Disaster Risk Reduction" },
    { label: "BFP Dumaguete",   number: "422-2022", icon: "🔥", color: "#EF5B5B", note: "Rescue / Extrication" },
  ],
  crime: [
    { label: "PNP Dumaguete",   number: "422-8708", icon: "👮", color: "#5B8DEF", note: "Philippine National Police" },
    { label: "NBI Dumaguete",   number: "422-4126", icon: "🕵️", color: "#EF5B9E", note: "National Bureau of Investigation" },
    { label: "CDRRMO",          number: "422-3008", icon: "🌀", color: "#F5C842", note: "For crowd control support" },
  ],
  other: [
    { label: "CDRRMO",          number: "422-3008", icon: "🌀", color: "#F5C842", note: "City Disaster Risk Reduction" },
    { label: "PNP Dumaguete",   number: "422-8708", icon: "👮", color: "#5B8DEF", note: "Philippine National Police" },
    { label: "BFP Dumaguete",   number: "422-2022", icon: "🔥", color: "#EF5B5B", note: "Bureau of Fire Protection" },
    { label: "PDRRMO",          number: "422-3006", icon: "🏥", color: "#2ECC8F", note: "Provincial DRRMO" },
  ],
};

const INC_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=IBM+Plex+Sans:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .rinc-root { font-family: 'IBM Plex Sans', sans-serif; color: #E8F0FF; }

  .rinc-page-header { margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 12px; }
  .rinc-eyebrow { font-family: 'IBM Plex Mono', monospace; font-size: 9.5px; color: rgba(232,240,255,0.28); letter-spacing: .18em; text-transform: uppercase; margin-bottom: 6px; display: flex; align-items: center; gap: 8px; }
  .rinc-eyebrow::before { content: ''; width: 14px; height: 1px; background: #EF5B5B; display: block; }
  .rinc-title { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; color: #fff; letter-spacing: -.03em; }
  .rinc-subtitle { font-size: 10.5px; color: rgba(239,91,91,0.45); margin-top: 5px; font-family: 'IBM Plex Mono', monospace; }

  /* Controls */
  .rinc-controls { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
  .rinc-search-wrap { position: relative; flex: 1; min-width: 180px; }
  .rinc-search-ic { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: rgba(232,240,255,0.25); font-size: 12px; pointer-events: none; }
  .rinc-search {
    width: 100%; background: rgba(4,15,30,0.9); border: 1px solid rgba(255,255,255,0.08);
    border-radius: 8px; padding: 9px 12px 9px 32px;
    font-family: 'IBM Plex Sans', sans-serif; font-size: 12.5px; color: #E8F0FF; outline: none;
    transition: border-color .2s;
  }
  .rinc-search::placeholder { color: rgba(232,240,255,0.2); }
  .rinc-search:focus { border-color: rgba(239,91,91,0.35); }

  .rinc-filter-chips { display: flex; gap: 5px; flex-wrap: wrap; }
  .rinc-chip {
    font-family: 'IBM Plex Mono', monospace; font-size: 8.5px; padding: 5px 11px;
    border-radius: 5px; border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.04); color: rgba(232,240,255,0.45);
    cursor: pointer; transition: all .15s;
  }
  .rinc-chip.active { background: rgba(239,91,91,0.1); border-color: rgba(239,91,91,0.3); color: #EF5B5B; }
  .rinc-chip:hover:not(.active) { border-color: rgba(255,255,255,0.2); color: rgba(232,240,255,0.7); }

  /* Tabs */
  .rinc-tabs { display: flex; gap: 4px; margin-bottom: 14px; background: rgba(4,15,30,0.6); border: 1px solid rgba(255,255,255,0.07); border-radius: 9px; padding: 4px; width: fit-content; }
  .rinc-tab {
    font-family: 'IBM Plex Mono', monospace; font-size: 9px; font-weight: 500;
    padding: 6px 14px; border-radius: 6px; border: none;
    color: rgba(232,240,255,0.4); background: transparent;
    cursor: pointer; letter-spacing: .08em; transition: all .15s;
  }
  .rinc-tab.active { background: rgba(239,91,91,0.12); color: #EF5B5B; border: 1px solid rgba(239,91,91,0.25); }
  .rinc-tab:hover:not(.active) { color: rgba(232,240,255,0.7); }

  /* Grid */
  .rinc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 10px; }

  /* Card */
  .rinc-card {
    background: rgba(4,15,30,0.88); border: 1px solid rgba(255,255,255,0.07);
    border-radius: 12px; overflow: hidden; transition: border-color .2s, transform .2s;
    backdrop-filter: blur(8px);
  }
  .rinc-card:hover { border-color: rgba(255,255,255,0.12); transform: translateY(-1px); }
  .rinc-card-top { height: 3px; background: var(--card-accent); }
  .rinc-card-body { padding: 14px; }

  .rinc-card-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 10px; }
  .rinc-card-title { display: flex; align-items: center; gap: 7px; font-size: 13px; font-weight: 600; color: var(--card-accent); text-transform: capitalize; }
  .rinc-status-badge {
    font-family: 'IBM Plex Mono', monospace; font-size: 7.5px; padding: 3px 8px; border-radius: 4px;
    background: var(--ib-bg); color: var(--ib-text); border: 1px solid var(--ib-border); white-space: nowrap;
  }

  .rinc-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 9px; }
  .rinc-field { display: flex; flex-direction: column; gap: 2px; padding: 7px 9px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 6px; }
  .rinc-field-label { font-family: 'IBM Plex Mono', monospace; font-size: 7.5px; color: rgba(232,240,255,0.28); letter-spacing: .08em; text-transform: uppercase; }
  .rinc-field-val { font-size: 11.5px; color: rgba(232,240,255,0.72); line-height: 1.4; }

  .rinc-desc { font-size: 11.5px; color: rgba(232,240,255,0.48); line-height: 1.6; padding: 8px 10px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 6px; margin-bottom: 9px; }

  /* ── Evidence preview (inline on card) ── */
  .rinc-evidence-wrap {
    position: relative; width: 100%; border-radius: 8px; overflow: hidden;
    background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.07);
    margin-bottom: 9px;
  }
  .rinc-evidence-img {
    width: 100%; max-height: 190px; object-fit: cover; display: block;
    transition: transform .25s, opacity .2s; cursor: zoom-in;
  }
  .rinc-evidence-img:hover { opacity: .9; transform: scale(1.015); }
  .rinc-evidence-video {
    width: 100%; max-height: 190px; display: block; background: #000; outline: none;
  }
  .rinc-evidence-bar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 5px 9px; border-top: 1px solid rgba(255,255,255,0.06);
    background: rgba(4,15,30,0.6);
  }
  .rinc-evidence-type {
    display: flex; align-items: center; gap: 5px;
    font-family: 'IBM Plex Mono', monospace; font-size: 8px; color: rgba(91,141,239,0.75);
  }
  .rinc-evidence-link {
    display: inline-flex; align-items: center; gap: 4px;
    font-family: 'IBM Plex Mono', monospace; font-size: 8px;
    color: rgba(232,240,255,0.35); text-decoration: none; transition: color .15s;
  }
  .rinc-evidence-link:hover { color: rgba(232,240,255,0.75); }

  /* Lightbox */
  .rinc-lightbox {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(0,0,0,0.88); display: flex; align-items: center; justify-content: center;
    animation: rIncFadeIn .2s ease; cursor: zoom-out; padding: 24px;
  }
  @keyframes rIncFadeIn { from { opacity:0; } to { opacity:1; } }
  .rinc-lightbox img { max-width: 100%; max-height: 90vh; border-radius: 8px; object-fit: contain; cursor: default; box-shadow: 0 20px 60px rgba(0,0,0,0.6); }
  .rinc-lightbox-close {
    position: fixed; top: 18px; right: 22px; font-size: 22px; color: rgba(255,255,255,0.6);
    cursor: pointer; background: none; border: none; line-height: 1;
    transition: color .15s;
  }
  .rinc-lightbox-close:hover { color: #fff; }

  /* Action bar */
  .rinc-actions { display: flex; gap: 7px; flex-wrap: wrap; margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.05); }
  .rinc-action-btn {
    display: inline-flex; align-items: center; gap: 5px;
    font-family: 'IBM Plex Mono', monospace; font-size: 9px; font-weight: 700;
    padding: 5px 12px; border-radius: 5px; border: 1px solid; cursor: pointer;
    transition: background .15s, opacity .15s;
  }
  .rinc-action-btn:disabled { opacity: .35; cursor: not-allowed; }
  .rinc-btn-claim   { background: rgba(239,91,91,0.08);  border-color: rgba(239,91,91,0.3);  color: #EF5B5B; }
  .rinc-btn-claim:hover:not(:disabled)   { background: rgba(239,91,91,0.18); }
  .rinc-btn-resolve { background: rgba(46,204,143,0.08); border-color: rgba(46,204,143,0.3); color: #2ECC8F; }
  .rinc-btn-resolve:hover:not(:disabled) { background: rgba(46,204,143,0.18); }
  .rinc-btn-maps    { background: rgba(91,141,239,0.07); border-color: rgba(91,141,239,0.25); color: #5B8DEF; text-decoration: none; }
  .rinc-btn-maps:hover { background: rgba(91,141,239,0.15); }

  .rinc-spinner { display: inline-block; width: 14px; height: 14px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.1); border-top-color: #EF5B5B; animation: rIncSpin .7s linear infinite; }
  @keyframes rIncSpin { to { transform: rotate(360deg); } }
  .rinc-empty { text-align: center; padding: 48px 0; font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; color: rgba(232,240,255,0.18); letter-spacing: .1em; }
  .rinc-mine-tag {
    font-family: 'IBM Plex Mono', monospace; font-size: 7.5px; padding: 2px 7px; border-radius: 4px;
    background: rgba(239,91,91,0.08); color: rgba(239,91,91,0.7); border: 1px solid rgba(239,91,91,0.2);
  }

  /* ══════════════════════════════════════
     RESOLUTION NOTE MODAL
  ══════════════════════════════════════ */
  .rinc-modal-backdrop {
    position: fixed; inset: 0; z-index: 10000;
    background: rgba(0,0,0,0.75);
    backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
    animation: rIncFadeIn .2s ease;
  }

  .rinc-modal {
    background: linear-gradient(180deg, #040f1e 0%, #020c18 100%);
    border: 1px solid rgba(46,204,143,0.2);
    border-radius: 16px;
    width: 100%; max-width: 480px;
    max-height: 90vh; overflow-y: auto;
    box-shadow: 0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(46,204,143,0.08);
    animation: rModalIn .25s cubic-bezier(0.34,1.56,0.64,1) both;
  }
  @keyframes rModalIn {
    from { opacity: 0; transform: scale(0.93) translateY(16px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }

  .rinc-modal-header {
    padding: 20px 22px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
    position: relative;
  }
  .rinc-modal-header::after {
    content: '';
    position: absolute; bottom: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, rgba(46,204,143,0.5), rgba(46,204,143,0.1), transparent 70%);
  }

  .rinc-modal-icon {
    width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
    background: rgba(46,204,143,0.1); border: 1px solid rgba(46,204,143,0.25);
    display: flex; align-items: center; justify-content: center;
    color: #2ECC8F; font-size: 15px;
  }

  .rinc-modal-title-wrap { flex: 1; }
  .rinc-modal-title {
    font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 800;
    color: #fff; letter-spacing: -0.02em; margin-bottom: 3px;
  }
  .rinc-modal-subtitle {
    font-family: 'IBM Plex Mono', monospace; font-size: 9px;
    color: rgba(46,204,143,0.55); letter-spacing: 0.12em; text-transform: uppercase;
  }

  .rinc-modal-close {
    background: none; border: none; cursor: pointer;
    color: rgba(232,240,255,0.3); font-size: 16px; padding: 4px;
    transition: color .15s; flex-shrink: 0; line-height: 1;
  }
  .rinc-modal-close:hover { color: rgba(232,240,255,0.8); }

  .rinc-modal-body { padding: 20px 22px; }

  /* Info banner inside modal */
  .rinc-modal-info {
    display: flex; align-items: flex-start; gap: 10px;
    background: rgba(46,204,143,0.06); border: 1px solid rgba(46,204,143,0.15);
    border-radius: 8px; padding: 11px 13px; margin-bottom: 16px;
  }
  .rinc-modal-info-dot {
    width: 6px; height: 6px; border-radius: 50%; background: #2ECC8F;
    flex-shrink: 0; margin-top: 4px;
    animation: rIncPip 2s ease infinite;
  }
  @keyframes rIncPip { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
  .rinc-modal-info-text {
    font-family: 'IBM Plex Sans', sans-serif; font-size: 12px;
    color: rgba(46,204,143,0.8); line-height: 1.55;
  }

  /* Report summary inside modal */
  .rinc-modal-report-meta {
    display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
    margin-bottom: 14px; padding: 9px 12px;
    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
    border-radius: 8px;
  }
  .rinc-modal-report-type {
    font-family: 'IBM Plex Mono', monospace; font-size: 10px; font-weight: 700;
    color: var(--modal-type-color, #EF5B5B);
    text-transform: uppercase; letter-spacing: 0.08em;
  }
  .rinc-modal-report-sep { color: rgba(232,240,255,0.15); }
  .rinc-modal-report-loc {
    font-family: 'IBM Plex Sans', sans-serif; font-size: 11.5px;
    color: rgba(232,240,255,0.45);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;
  }

  /* Note textarea */
  .rinc-modal-label {
    display: block;
    font-family: 'IBM Plex Mono', monospace; font-size: 9px;
    color: rgba(232,240,255,0.35); letter-spacing: 0.12em; text-transform: uppercase;
    margin-bottom: 8px;
  }
  .rinc-modal-label span {
    color: #EF5B5B; margin-left: 3px;
  }

  .rinc-modal-textarea {
    width: 100%; min-height: 110px; resize: vertical;
    background: rgba(4,15,30,0.9); border: 1px solid rgba(255,255,255,0.1);
    border-radius: 9px; padding: 12px 14px;
    font-family: 'IBM Plex Sans', sans-serif; font-size: 13px;
    color: #E8F0FF; outline: none; line-height: 1.6;
    transition: border-color .2s, box-shadow .2s;
    caret-color: #2ECC8F;
  }
  .rinc-modal-textarea::placeholder {
    color: rgba(232,240,255,0.2);
  }
  .rinc-modal-textarea:focus {
    border-color: rgba(46,204,143,0.4);
    box-shadow: 0 0 0 3px rgba(46,204,143,0.07);
  }
  .rinc-modal-textarea.error {
    border-color: rgba(239,91,91,0.5);
    box-shadow: 0 0 0 3px rgba(239,91,91,0.08);
  }

  .rinc-modal-char-row {
    display: flex; align-items: center; justify-content: space-between;
    margin-top: 6px;
  }
  .rinc-modal-error-text {
    font-family: 'IBM Plex Mono', monospace; font-size: 9px;
    color: #EF5B5B; letter-spacing: 0.06em;
  }
  .rinc-modal-char-count {
    font-family: 'IBM Plex Mono', monospace; font-size: 9px;
    color: rgba(232,240,255,0.2);
  }

  /* Modal footer */
  .rinc-modal-footer {
    padding: 14px 22px 20px;
    display: flex; gap: 8px; justify-content: flex-end;
  }

  .rinc-modal-btn-cancel {
    font-family: 'IBM Plex Mono', monospace; font-size: 10px; font-weight: 700;
    padding: 9px 18px; border-radius: 7px; cursor: pointer;
    background: transparent; border: 1px solid rgba(255,255,255,0.1);
    color: rgba(232,240,255,0.4); transition: all .15s; letter-spacing: 0.06em;
  }
  .rinc-modal-btn-cancel:hover { border-color: rgba(255,255,255,0.2); color: rgba(232,240,255,0.7); }

  .rinc-modal-spinner {
    width: 11px; height: 11px; border-radius: 50%;
    border: 2px solid rgba(46,204,143,0.2); border-top-color: #2ECC8F;
    animation: rIncSpin .7s linear infinite; flex-shrink: 0;
  }

  /* ══════════════════════════════════════
     RESPONDER REPORT FORM STYLES
  ══════════════════════════════════════ */

  /* Incident summary strip */
  .rinc-rpt-summary {
    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
    border-left: 3px solid var(--modal-type-color, #EF5B5B);
    border-radius: 9px; padding: 12px 14px; margin-bottom: 18px;
    display: flex; flex-direction: column; gap: 6px;
  }
  .rinc-rpt-summary-row {
    display: flex; align-items: baseline; justify-content: space-between; gap: 10px;
  }
  .rinc-rpt-summary-label {
    font-family: 'IBM Plex Mono', monospace; font-size: 8.5px;
    color: rgba(232,240,255,0.28); letter-spacing: 0.1em; text-transform: uppercase;
    flex-shrink: 0;
  }
  .rinc-rpt-summary-val {
    font-family: 'IBM Plex Sans', sans-serif; font-size: 12px;
    color: rgba(232,240,255,0.72); text-align: right;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 60%;
  }
  .rinc-rpt-type {
    font-family: 'IBM Plex Mono', monospace; font-weight: 700; font-size: 11px;
    color: var(--modal-type-color, #EF5B5B);
  }

  /* Section heads */
  .rinc-rpt-section-head {
    display: flex; align-items: center; gap: 8px; margin-bottom: 10px;
  }
  .rinc-rpt-step-badge {
    font-family: 'IBM Plex Mono', monospace; font-size: 9px; font-weight: 700;
    color: rgba(239,91,91,0.7); border: 1px solid rgba(239,91,91,0.2);
    border-radius: 4px; padding: 2px 6px; flex-shrink: 0;
  }
  .rinc-rpt-section-label {
    font-family: 'IBM Plex Mono', monospace; font-size: 9px;
    color: rgba(232,240,255,0.35); letter-spacing: 0.12em; text-transform: uppercase;
    flex: 1;
  }
  .rinc-rpt-field-error {
    font-family: 'IBM Plex Mono', monospace; font-size: 8.5px;
    color: #EF5B5B; flex-shrink: 0;
  }

  /* Resolution type cards */
  .rinc-rpt-type-grid {
    display: flex; flex-direction: column; gap: 7px; margin-bottom: 4px;
  }
  .rinc-rpt-type-card {
    display: flex; align-items: center; gap: 12px;
    padding: 11px 14px; border-radius: 9px; cursor: pointer;
    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
    transition: background .15s, border-color .15s, transform .12s;
    text-align: left; width: 100%;
  }
  .rinc-rpt-type-card:hover {
    background: var(--rt-bg); border-color: var(--rt-border);
    transform: translateX(2px);
  }
  .rinc-rpt-type-card.selected {
    background: var(--rt-bg); border-color: var(--rt-border);
    box-shadow: inset 0 0 0 1px var(--rt-border);
  }
  .rinc-rpt-type-icon {
    font-size: 16px; width: 32px; height: 32px; border-radius: 8px;
    background: var(--rt-bg); border: 1px solid var(--rt-border);
    display: flex; align-items: center; justify-content: center;
    color: var(--rt-color); flex-shrink: 0; font-style: normal;
    font-family: 'IBM Plex Mono', monospace; font-weight: 700; font-size: 14px;
  }
  .rinc-rpt-type-text {
    display: flex; flex-direction: column; gap: 2px; flex: 1;
  }
  .rinc-rpt-type-label {
    font-family: 'IBM Plex Sans', sans-serif; font-size: 12.5px; font-weight: 600;
    color: rgba(232,240,255,0.85);
  }
  .rinc-rpt-type-card.selected .rinc-rpt-type-label { color: var(--rt-color); }
  .rinc-rpt-type-sub {
    font-family: 'IBM Plex Mono', monospace; font-size: 8.5px;
    color: rgba(232,240,255,0.28);
  }
  .rinc-rpt-type-radio {
    width: 14px; height: 14px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.15); flex-shrink: 0;
    transition: background .15s, border-color .15s;
    position: relative;
  }
  .rinc-rpt-type-radio.checked {
    border-color: var(--rt-color);
    background: var(--rt-color);
    box-shadow: 0 0 0 3px var(--rt-bg);
  }
  .rinc-rpt-type-radio.checked::after {
    content: ''; position: absolute; inset: 3px;
    border-radius: 50%; background: #020c18;
  }

  /* Report preview card */
  .rinc-rpt-preview {
    margin-top: 16px; border-radius: 9px; overflow: hidden;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(2,12,24,0.7);
    animation: rIncFadeIn .2s ease both;
  }
  .rinc-rpt-preview-head {
    padding: 8px 14px; background: rgba(255,255,255,0.04);
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .rinc-rpt-preview-title {
    font-family: 'IBM Plex Mono', monospace; font-size: 8.5px;
    color: rgba(232,240,255,0.35); letter-spacing: 0.12em;
  }
  .rinc-rpt-preview-body { padding: 12px 14px; display: flex; flex-direction: column; gap: 7px; }
  .rinc-rpt-preview-row {
    display: flex; align-items: baseline; justify-content: space-between; gap: 10px;
  }
  .rinc-rpt-preview-row span:first-child {
    font-family: 'IBM Plex Mono', monospace; font-size: 8.5px;
    color: rgba(232,240,255,0.25); letter-spacing: 0.08em; text-transform: uppercase; flex-shrink: 0;
  }
  .rinc-rpt-preview-row span:last-child {
    font-family: 'IBM Plex Sans', sans-serif; font-size: 11.5px;
    color: rgba(232,240,255,0.65); text-align: right;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 65%;
  }
  .rinc-rpt-preview-divider {
    height: 1px; background: rgba(255,255,255,0.06); margin: 2px 0;
  }
  .rinc-rpt-preview-block {
    display: flex; flex-direction: column; gap: 3px;
  }
  .rinc-rpt-preview-block-label {
    font-family: 'IBM Plex Mono', monospace; font-size: 8.5px;
    color: rgba(232,240,255,0.25); letter-spacing: 0.08em; text-transform: uppercase;
  }
  .rinc-rpt-preview-block-val {
    font-family: 'IBM Plex Sans', sans-serif; font-size: 12px;
    color: rgba(232,240,255,0.65); line-height: 1.55;
  }

  /* Confirm button dynamic color */
  .rinc-modal-btn-confirm {
    font-family: 'IBM Plex Mono', monospace; font-size: 10px; font-weight: 700;
    padding: 9px 20px; border-radius: 7px; cursor: pointer;
    background: var(--btn-bg, rgba(46,204,143,0.12));
    border: 1px solid var(--btn-border, rgba(46,204,143,0.35));
    color: var(--btn-color, #2ECC8F);
    transition: all .15s; letter-spacing: 0.06em;
    display: flex; align-items: center; gap: 7px;
  }
  .rinc-modal-btn-confirm:hover:not(:disabled) {
    filter: brightness(1.2);
  }
  .rinc-modal-btn-confirm:disabled { opacity: 0.35; cursor: not-allowed; }

  /* ══════════════════════════════════════
     AGENCY QUICK-CALL SECTION
  ══════════════════════════════════════ */
  .rinc-agency-section { margin-top: 18px; }

  .rinc-agency-section-head {
    display: flex; align-items: center; gap: 8px; margin-bottom: 10px;
  }
  .rinc-agency-section-label {
    font-family: 'IBM Plex Mono', monospace; font-size: 9px;
    color: rgba(232,240,255,0.28); letter-spacing: 0.14em; text-transform: uppercase;
  }
  .rinc-agency-section-line {
    flex: 1; height: 1px;
    background: linear-gradient(90deg, rgba(255,255,255,0.07), transparent);
  }
  .rinc-agency-tip {
    font-family: 'IBM Plex Sans', sans-serif; font-size: 11px;
    color: rgba(232,240,255,0.25); margin-bottom: 10px; line-height: 1.5;
  }

  .rinc-agency-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 7px;
  }

  .rinc-agency-card {
    display: flex; align-items: center; gap: 9px;
    padding: 9px 11px;
    background: rgba(4,15,30,0.7); border: 1px solid rgba(255,255,255,0.07);
    border-radius: 9px; text-decoration: none;
    transition: background .15s, border-color .15s, transform .15s;
    cursor: pointer; position: relative; overflow: hidden;
  }
  .rinc-agency-card::before {
    content: '';
    position: absolute; left: 0; top: 0; bottom: 0; width: 2px;
    background: var(--agency-color);
    border-radius: 9px 0 0 9px;
  }
  .rinc-agency-card:hover {
    background: rgba(255,255,255,0.04);
    border-color: var(--agency-color-dim);
    transform: translateY(-1px);
  }

  .rinc-agency-icon {
    width: 30px; height: 30px; border-radius: 7px; flex-shrink: 0;
    background: var(--agency-bg);
    border: 1px solid var(--agency-color-dim);
    display: flex; align-items: center; justify-content: center;
    font-size: 13px;
  }

  .rinc-agency-info { flex: 1; min-width: 0; }
  .rinc-agency-name {
    font-family: 'IBM Plex Sans', sans-serif; font-size: 11px; font-weight: 600;
    color: rgba(232,240,255,0.85); white-space: nowrap;
    overflow: hidden; text-overflow: ellipsis;
  }
  .rinc-agency-note {
    font-family: 'IBM Plex Mono', monospace; font-size: 8px;
    color: rgba(232,240,255,0.28); margin-top: 1px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .rinc-agency-number {
    font-family: 'IBM Plex Mono', monospace; font-size: 10px; font-weight: 700;
    color: var(--agency-color); flex-shrink: 0; white-space: nowrap;
  }

  .rinc-agency-call-icon {
    position: absolute; right: 9px; top: 50%; transform: translateY(-50%);
    font-size: 9px; color: var(--agency-color); opacity: 0;
    transition: opacity .15s;
  }
  .rinc-agency-card:hover .rinc-agency-call-icon { opacity: 0.7; }

  @media (max-width: 480px) {
    .rinc-agency-grid { grid-template-columns: 1fr; }
    .rinc-modal { max-height: 90vh; overflow-y: auto; }
  }
`;

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

type TabId = "all" | "mine" | "unassigned";

// ── Resolution types ──────────────────────────────────────────────────────────
interface ResolutionType {
  id: string;
  label: string;
  sublabel: string;
  icon: string;
  color: string;
  bg: string;
  border: string;
}

const RESOLUTION_TYPES: ResolutionType[] = [
  {
    id: "forwarded",
    label: "Forwarded to Department",
    sublabel: "Handed off to appropriate agency",
    icon: "↗",
    color: "#5B8DEF",
    bg: "rgba(91,141,239,0.08)",
    border: "rgba(91,141,239,0.3)",
  },
  {
    id: "follow-up",
    label: "Resolved — Needs Follow-Up",
    sublabel: "Addressed but monitoring required",
    icon: "⟳",
    color: "#F5C842",
    bg: "rgba(245,200,66,0.08)",
    border: "rgba(245,200,66,0.3)",
  },
  {
    id: "fully-resolved",
    label: "Fully Resolved",
    sublabel: "No additional action needed",
    icon: "✓",
    color: "#2ECC8F",
    bg: "rgba(46,204,143,0.08)",
    border: "rgba(46,204,143,0.3)",
  },
];

// ── Resolution Note Modal ─────────────────────────────────────────────────────
interface ResolutionModalProps {
  report: Report;
  responderName: string;
  onCancel: () => void;
  onConfirm: (payload: { resolutionType: string; notes: string; actionTaken: string }) => Promise<void>;
  submitting: boolean;
}

function ResolutionModal({ report, responderName, onCancel, onConfirm, submitting }: ResolutionModalProps) {
  const [resolutionType, setResolutionType] = useState<string>("");
  const [notes, setNotes]                   = useState("");
  const [actionTaken, setActionTaken]       = useState("");
  const [touched, setTouched]               = useState(false);

  const tm = TYPE_META[report.type] ?? TYPE_META.other;
  const selectedRT = RESOLUTION_TYPES.find((r) => r.id === resolutionType);

  const isValid = resolutionType !== "" && notes.trim().length >= 10 && actionTaken.trim().length >= 5;
  const showTypeError    = touched && resolutionType === "";
  const showNotesError   = touched && notes.trim().length < 10;
  const showActionError  = touched && actionTaken.trim().length < 5;

  const now = new Date();
  const dateTimeStr = now.toLocaleString("en-PH", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  const handleConfirm = () => {
    setTouched(true);
    if (!isValid) return;
    onConfirm({ resolutionType, notes: notes.trim(), actionTaken: actionTaken.trim() });
  };

  const agencies = AGENCY_CONTACTS[report.type] ?? AGENCY_CONTACTS.other;

  return (
    <div className="rinc-modal-backdrop" onClick={onCancel}>
      <div className="rinc-modal" onClick={(e) => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="rinc-modal-header">
          <div className="rinc-modal-icon"><FaStickyNote /></div>
          <div className="rinc-modal-title-wrap">
            <div className="rinc-modal-title">Responder Report</div>
            <div className="rinc-modal-subtitle">Complete before marking resolved</div>
          </div>
          <button className="rinc-modal-close" onClick={onCancel} aria-label="Cancel">
            <FaTimes />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="rinc-modal-body">

          {/* Incident summary strip */}
          <div className="rinc-rpt-summary" style={{ "--modal-type-color": tm.color } as React.CSSProperties}>
            <div className="rinc-rpt-summary-row">
              <span className="rinc-rpt-summary-label">Incident Type</span>
              <span className="rinc-rpt-summary-val rinc-rpt-type">{tm.icon} {report.type.toUpperCase()}</span>
            </div>
            <div className="rinc-rpt-summary-row">
              <span className="rinc-rpt-summary-label">Location</span>
              <span className="rinc-rpt-summary-val">{report.address || report.location || "Not specified"}</span>
            </div>
            <div className="rinc-rpt-summary-row">
              <span className="rinc-rpt-summary-label">Date & Time</span>
              <span className="rinc-rpt-summary-val">{dateTimeStr}</span>
            </div>
            <div className="rinc-rpt-summary-row">
              <span className="rinc-rpt-summary-label">Responder</span>
              <span className="rinc-rpt-summary-val">{responderName}</span>
            </div>
          </div>

          {/* ── Step 1: Resolution Type ── */}
          <div className="rinc-rpt-section-head">
            <span className="rinc-rpt-step-badge">01</span>
            <span className="rinc-rpt-section-label">Resolution Status</span>
            {showTypeError && <span className="rinc-rpt-field-error">⚠ Select one</span>}
          </div>

          <div className="rinc-rpt-type-grid">
            {RESOLUTION_TYPES.map((rt) => (
              <button
                key={rt.id}
                className={`rinc-rpt-type-card${resolutionType === rt.id ? " selected" : ""}`}
                style={{
                  "--rt-color":  rt.color,
                  "--rt-bg":     rt.bg,
                  "--rt-border": rt.border,
                } as React.CSSProperties}
                onClick={() => setResolutionType(rt.id)}
                type="button"
              >
                <span className="rinc-rpt-type-icon">{rt.icon}</span>
                <div className="rinc-rpt-type-text">
                  <span className="rinc-rpt-type-label">{rt.label}</span>
                  <span className="rinc-rpt-type-sub">{rt.sublabel}</span>
                </div>
                <span className={`rinc-rpt-type-radio${resolutionType === rt.id ? " checked" : ""}`} />
              </button>
            ))}
          </div>

          {/* ── Step 2: Response Notes ── */}
          <div className="rinc-rpt-section-head" style={{ marginTop: 18 }}>
            <span className="rinc-rpt-step-badge">02</span>
            <span className="rinc-rpt-section-label">Response Notes</span>
            {showNotesError && <span className="rinc-rpt-field-error">⚠ Min. 10 characters</span>}
          </div>
          <textarea
            className={`rinc-modal-textarea${showNotesError ? " error" : ""}`}
            placeholder="Describe what happened on the ground — situation upon arrival, severity, persons involved, conditions observed…"
            value={notes}
            onChange={(e) => { setNotes(e.target.value); setTouched(false); }}
            rows={3}
          />
          <div className="rinc-modal-char-row">
            <span />
            <span className="rinc-modal-char-count">{notes.length} chars</span>
          </div>

          {/* ── Step 3: Action Taken ── */}
          <div className="rinc-rpt-section-head" style={{ marginTop: 14 }}>
            <span className="rinc-rpt-step-badge">03</span>
            <span className="rinc-rpt-section-label">Action Taken</span>
            {showActionError && <span className="rinc-rpt-field-error">⚠ Required</span>}
          </div>
          <textarea
            className={`rinc-modal-textarea${showActionError ? " error" : ""}`}
            placeholder="e.g. Deployed BFP units, fire extinguished at 14:32 — area cordoned and secured, no casualties reported…"
            value={actionTaken}
            onChange={(e) => { setActionTaken(e.target.value); setTouched(false); }}
            rows={3}
          />
          <div className="rinc-modal-char-row">
            <span />
            <span className="rinc-modal-char-count">{actionTaken.length} chars</span>
          </div>

          {/* ── Report Preview Card ── */}
          {(notes.trim() || actionTaken.trim() || resolutionType) && (
            <div className="rinc-rpt-preview">
              <div className="rinc-rpt-preview-head">
                <span className="rinc-rpt-preview-title">━━ RESPONDER REPORT PREVIEW ━━</span>
              </div>
              <div className="rinc-rpt-preview-body">
                <div className="rinc-rpt-preview-row"><span>Incident Type</span><span>{tm.icon} {report.type.toUpperCase()}</span></div>
                <div className="rinc-rpt-preview-row"><span>Location</span><span>{report.address || report.location || "—"}</span></div>
                <div className="rinc-rpt-preview-row"><span>Date & Time</span><span>{dateTimeStr}</span></div>
                <div className="rinc-rpt-preview-divider" />
                {notes.trim() && (
                  <div className="rinc-rpt-preview-block">
                    <span className="rinc-rpt-preview-block-label">Response Notes</span>
                    <span className="rinc-rpt-preview-block-val">{notes.trim() || "—"}</span>
                  </div>
                )}
                {actionTaken.trim() && (
                  <div className="rinc-rpt-preview-block">
                    <span className="rinc-rpt-preview-block-label">Action Taken</span>
                    <span className="rinc-rpt-preview-block-val">{actionTaken.trim() || "—"}</span>
                  </div>
                )}
                <div className="rinc-rpt-preview-divider" />
                <div className="rinc-rpt-preview-row">
                  <span>Status</span>
                  <span style={{ color: selectedRT?.color ?? "rgba(232,240,255,0.4)" }}>
                    {selectedRT ? `${selectedRT.icon} ${selectedRT.label}` : "—"}
                  </span>
                </div>
                <div className="rinc-rpt-preview-row"><span>Responder</span><span>{responderName}</span></div>
              </div>
            </div>
          )}

          {/* ── Agency Quick-Call ── */}
          <div className="rinc-agency-section">
            <div className="rinc-agency-section-head">
              <span className="rinc-agency-section-label">// Quick Call — Recommended Agencies</span>
              <span className="rinc-agency-section-line" />
            </div>
            <p className="rinc-agency-tip">
              Tap to call the recommended agency for a <strong style={{ color: "rgba(232,240,255,0.5)" }}>{report.type}</strong> incident.
            </p>
            <div className="rinc-agency-grid">
              {agencies.map((ag) => (
                <a
                  key={ag.label}
                  href={`tel:${ag.number}`}
                  className="rinc-agency-card"
                  style={{
                    "--agency-color":     ag.color,
                    "--agency-color-dim": `${ag.color}40`,
                    "--agency-bg":        `${ag.color}12`,
                  } as React.CSSProperties}
                >
                  <div className="rinc-agency-icon">{ag.icon}</div>
                  <div className="rinc-agency-info">
                    <div className="rinc-agency-name">{ag.label}</div>
                    {ag.note && <div className="rinc-agency-note">{ag.note}</div>}
                  </div>
                  <div className="rinc-agency-number">{ag.number}</div>
                  <FaPhone className="rinc-agency-call-icon" />
                </a>
              ))}
            </div>
          </div>

        </div>{/* end modal-body */}

        {/* ── Footer ── */}
        <div className="rinc-modal-footer">
          <button className="rinc-modal-btn-cancel" onClick={onCancel} disabled={submitting}>
            CANCEL
          </button>
          <button
            className="rinc-modal-btn-confirm"
            onClick={handleConfirm}
            disabled={submitting}
            style={selectedRT ? {
              "--btn-color":  selectedRT.color,
              "--btn-bg":     selectedRT.bg,
              "--btn-border": selectedRT.border,
            } as React.CSSProperties : {}}
          >
            {submitting
              ? <><div className="rinc-modal-spinner" /> SUBMITTING…</>
              : <><FaCheckCircle size={10} /> SUBMIT REPORT & RESOLVE</>
            }
          </button>
        </div>

      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ResponderIncidentsPage() {
  const [reports, setReports]         = useState<Report[]>([]);
  const [loading, setLoading]         = useState(true);
  const [responderId, setResponderId] = useState("");
  const [responderName, setResponderName] = useState("Responder");
  const [tab, setTab]                 = useState<TabId>("all");
  const [filterType, setFilterType]   = useState("all");
  const [search, setSearch]           = useState("");
  const [claiming, setClaiming]       = useState<string | null>(null);
  const [lightbox, setLightbox]       = useState<string | null>(null);

  // Resolution modal state
  const [resolveTarget, setResolveTarget] = useState<Report | null>(null);
  const [resolving, setResolving]         = useState(false);

  useEffect(() => {
    const init = async () => {
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
    };
    init();
  }, []);

  const loadReports = async () => {
    const { data } = await supabase
      .from("reports")
      .select("id,type,description,location,address,reporter_name,reporter_contact,status,evidence_url,created_at,responder_id")
      .order("created_at", { ascending: false });
    setReports(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadReports();
    const ch = supabase
      .channel("rinc-reports")
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, loadReports)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const claimReport = async (id: string | number) => {
    if (!responderId) return;
    setClaiming(String(id));
    await supabase.from("reports").update({ responder_id: responderId, status: "in-progress" }).eq("id", id);
    await loadReports();
    setClaiming(null);
  };

  // Called when responder clicks "Mark Resolved" — opens modal instead of resolving directly
  const openResolveModal = (report: Report) => {
    setResolveTarget(report);
  };

  // Called when responder confirms resolution with note
  const confirmResolve = async (payload: { resolutionType: string; notes: string; actionTaken: string }) => {
    if (!resolveTarget || !responderId) return;
    setResolving(true);

    const fullNote = [
      `[${payload.resolutionType.toUpperCase()}]`,
      `Response Notes: ${payload.notes}`,
      `Action Taken: ${payload.actionTaken}`,
    ].join("\n");

    try {
      // 1. Save structured resolution note to incident_notes
      await supabase.from("incident_notes").insert({
        incident_id:  resolveTarget.id,
        note_text:    fullNote,
        responder_id: responderId,
      });

      // 2. Update report status to resolved
      await supabase
        .from("reports")
        .update({ status: "resolved" })
        .eq("id", resolveTarget.id)
        .eq("responder_id", responderId);

      await loadReports();
    } finally {
      setResolving(false);
      setResolveTarget(null);
    }
  };

  let filtered = reports;
  if (tab === "mine")       filtered = filtered.filter((r) => r.responder_id === responderId);
  if (tab === "unassigned") filtered = filtered.filter((r) => !r.responder_id && r.status === "pending");
  if (filterType !== "all") filtered = filtered.filter((r) => r.type === filterType);
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.type.includes(q) ||
        (r.address ?? "").toLowerCase().includes(q) ||
        (r.reporter_name ?? "").toLowerCase().includes(q) ||
        (r.description ?? "").toLowerCase().includes(q)
    );
  }

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: "all",        label: "ALL",        count: reports.length },
    { id: "mine",       label: "MINE",       count: reports.filter((r) => r.responder_id === responderId).length },
    { id: "unassigned", label: "UNASSIGNED", count: reports.filter((r) => !r.responder_id && r.status === "pending").length },
  ];

  const typeFilters = ["all", "fire", "accident", "flood", "crime", "medical", "other"];

  return (
    <>
      <style>{INC_STYLE}</style>
      <div className="rinc-root">

        {/* Lightbox */}
        {lightbox && (
          <div className="rinc-lightbox" onClick={() => setLightbox(null)}>
            <button className="rinc-lightbox-close" onClick={() => setLightbox(null)}>✕</button>
            <img src={lightbox} alt="Evidence" onClick={(e) => e.stopPropagation()} />
          </div>
        )}

        {/* Resolution Note Modal */}
        {resolveTarget && (
          <ResolutionModal
            report={resolveTarget}
            responderName={responderName}
            onCancel={() => !resolving && setResolveTarget(null)}
            onConfirm={confirmResolve}
            submitting={resolving}
          />
        )}

        <div className="rinc-page-header">
          <div>
            <div className="rinc-eyebrow">Field Operations</div>
            <div className="rinc-title">Incidents</div>
            <div className="rinc-subtitle">MANAGE & RESPOND TO INCIDENTS</div>
          </div>
          {loading && <div className="rinc-spinner" />}
        </div>

        {/* Tabs */}
        <div className="rinc-tabs">
          {tabs.map((t) => (
            <button key={t.id} className={`rinc-tab${tab === t.id ? " active" : ""}`} onClick={() => setTab(t.id)}>
              {t.label} ({t.count})
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="rinc-controls">
          <div className="rinc-search-wrap">
            <FaSearch className="rinc-search-ic" />
            <input
              className="rinc-search"
              placeholder="Search incidents…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="rinc-filter-chips">
            {typeFilters.map((t) => (
              <button
                key={t}
                className={`rinc-chip${filterType === t ? " active" : ""}`}
                onClick={() => setFilterType(t)}
              >
                {t === "all" ? "ALL TYPES" : (TYPE_META[t]?.icon ?? "") + " " + t.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="rinc-empty"><div className="rinc-spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="rinc-empty">NO INCIDENTS FOUND</div>
        ) : (
          <div className="rinc-grid">
            {filtered.map((r) => {
              const tm = TYPE_META[r.type] ?? TYPE_META.other;
              const sm = STATUS_META[r.status] ?? STATUS_META.pending;
              const isMine = r.responder_id === responderId;
              const canClaim = !r.responder_id && r.status === "pending" && responderId.length > 0;
              const canResolve = isMine && r.status === "in-progress";
              const vid = r.evidence_url && isVideo(r.evidence_url);

              return (
                <div key={String(r.id)} className="rinc-card" style={{ "--card-accent": tm.color } as React.CSSProperties}>
                  <div className="rinc-card-top" />
                  <div className="rinc-card-body">
                    <div className="rinc-card-header">
                      <div className="rinc-card-title">
                        <span>{tm.icon}</span>
                        <span>{r.type.replace(/_/g, " ")}</span>
                        {isMine && <span className="rinc-mine-tag">MINE</span>}
                      </div>
                      <span
                        className="rinc-status-badge"
                        style={{ "--ib-bg": sm.bg, "--ib-text": sm.color, "--ib-border": sm.border } as React.CSSProperties}
                      >
                        {sm.label}
                      </span>
                    </div>

                    <div className="rinc-fields">
                      <div className="rinc-field">
                        <span className="rinc-field-label"><FaMapMarkerAlt size={7} style={{ marginRight: 2 }} />Location</span>
                        <span className="rinc-field-val">{r.address || r.location || "—"}</span>
                      </div>
                      <div className="rinc-field">
                        <span className="rinc-field-label"><FaUser size={7} style={{ marginRight: 2 }} />Reporter</span>
                        <span className="rinc-field-val">{r.reporter_name || "Anonymous"}</span>
                      </div>
                      {r.reporter_contact && (
                        <div className="rinc-field">
                          <span className="rinc-field-label"><FaPhone size={7} style={{ marginRight: 2 }} />Contact</span>
                          <a href={`tel:${r.reporter_contact}`} className="rinc-field-val" style={{ color: "#2ECC8F", textDecoration: "none" }}>
                            {r.reporter_contact}
                          </a>
                        </div>
                      )}
                      <div className="rinc-field">
                        <span className="rinc-field-label"><FaClock size={7} style={{ marginRight: 2 }} />Reported</span>
                        <span className="rinc-field-val">{formatRelative(r.created_at)}</span>
                      </div>
                    </div>

                    {r.description && (
                      <div className="rinc-desc">{r.description}</div>
                    )}

                    {/* ── Inline evidence preview ── */}
                    {r.evidence_url && (
                      <div className="rinc-evidence-wrap">
                        {vid ? (
                          <video
                            className="rinc-evidence-video"
                            src={r.evidence_url}
                            controls
                            preload="metadata"
                          />
                        ) : (
                          <img
                            className="rinc-evidence-img"
                            src={r.evidence_url}
                            alt="Incident evidence"
                            onClick={() => setLightbox(r.evidence_url!)}
                          />
                        )}
                        <div className="rinc-evidence-bar">
                          <span className="rinc-evidence-type">
                            {vid ? <FaVideo size={9} /> : <FaImage size={9} />}
                            {vid ? "Video Evidence" : "Photo Evidence"}
                          </span>
                          <a
                            href={r.evidence_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rinc-evidence-link"
                          >
                            Open full <FaExternalLinkAlt size={7} />
                          </a>
                        </div>
                      </div>
                    )}

                    <div className="rinc-actions">
                      {canClaim && (
                        <button
                          className="rinc-action-btn rinc-btn-claim"
                          disabled={claiming === String(r.id)}
                          onClick={() => claimReport(r.id)}
                        >
                          {claiming === String(r.id) ? "Claiming…" : "Claim Incident →"}
                        </button>
                      )}
                      {canResolve && (
                        <button
                          className="rinc-action-btn rinc-btn-resolve"
                          onClick={() => openResolveModal(r)}
                        >
                          <FaCheckCircle size={9} />
                          Mark Resolved
                        </button>
                      )}
                      {r.location && (
                        <a
                          href={`https://www.google.com/maps?q=${r.location}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rinc-action-btn rinc-btn-maps"
                        >
                          <FaMapMarkerAlt size={9} /> Navigate
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}