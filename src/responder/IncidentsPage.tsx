import { useEffect, useState } from "react";
import { supabase } from "../js/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

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

const TYPE_META: Record<string, { icon: string; label: string; colorClass: string }> = {
  fire:     { icon: "🔥", label: "Fire",     colorClass: "t-fire"     },
  accident: { icon: "🚗", label: "Accident", colorClass: "t-accident" },
  flood:    { icon: "🌊", label: "Flood",    colorClass: "t-flood"    },
  crime:    { icon: "🚨", label: "Crime",    colorClass: "t-crime"    },
  medical:  { icon: "🏥", label: "Medical",  colorClass: "t-medical"  },
  other:    { icon: "⚠️", label: "Other",    colorClass: "t-other"    },
};

const STATUS_META: Record<string, { label: string; colorClass: string }> = {
  pending:       { label: "PENDING",     colorClass: "s-pending"     },
  "in-progress": { label: "IN PROGRESS", colorClass: "s-progress"    },
  resolved:      { label: "RESOLVED",    colorClass: "s-resolved"    },
};

const AGENCY_CONTACTS: Record<string, { label: string; number: string; icon: string; colorClass: string; note: string }[]> = {
  fire: [
    { label: "BFP Dumaguete",       number: "422-2022", icon: "🔥", colorClass: "ag-red",   note: "Bureau of Fire Protection"      },
    { label: "CDRRMO",              number: "422-3008", icon: "🌀", colorClass: "ag-amber", note: "City Disaster Risk Reduction"    },
    { label: "PNP Dumaguete",       number: "422-8708", icon: "👮", colorClass: "ag-blue",  note: "Philippine National Police"     },
  ],
  flood: [
    { label: "CDRRMO",              number: "422-3008", icon: "🌊", colorClass: "ag-blue",  note: "City Disaster Risk Reduction"   },
    { label: "PDRRMO",              number: "422-3006", icon: "🌀", colorClass: "ag-amber", note: "Provincial DRRMO"               },
    { label: "PNP Dumaguete",       number: "422-8708", icon: "👮", colorClass: "ag-pink",  note: "Philippine National Police"    },
    { label: "LDRRMO",              number: "422-3007", icon: "🏛️", colorClass: "ag-slate", note: "Local DRRMO Office"            },
  ],
  medical: [
    { label: "Holy Child Hospital", number: "422-5555", icon: "🏥", colorClass: "ag-green", note: "Primary Hospital"              },
    { label: "SUMC Emergency",      number: "422-2691", icon: "🏨", colorClass: "ag-blue",  note: "Silliman University Medical"   },
    { label: "PDRRMO",              number: "422-3006", icon: "🚑", colorClass: "ag-amber", note: "Provincial DRRMO Ambulance"    },
    { label: "PNP Dumaguete",       number: "422-8708", icon: "👮", colorClass: "ag-pink",  note: "Security escort"              },
  ],
  accident: [
    { label: "PNP Dumaguete",       number: "422-8708", icon: "👮", colorClass: "ag-blue",  note: "Philippine National Police"   },
    { label: "Holy Child Hospital", number: "422-5555", icon: "🏥", colorClass: "ag-green", note: "Emergency Room"               },
    { label: "CDRRMO",              number: "422-3008", icon: "🌀", colorClass: "ag-amber", note: "City Disaster Risk Reduction"  },
    { label: "BFP Dumaguete",       number: "422-2022", icon: "🔥", colorClass: "ag-red",   note: "Rescue / Extrication"         },
  ],
  crime: [
    { label: "PNP Dumaguete",       number: "422-8708", icon: "👮", colorClass: "ag-blue",  note: "Philippine National Police"   },
    { label: "NBI Dumaguete",       number: "422-4126", icon: "🕵️", colorClass: "ag-pink",  note: "National Bureau of Investigation" },
    { label: "CDRRMO",              number: "422-3008", icon: "🌀", colorClass: "ag-amber", note: "Crowd control support"        },
  ],
  other: [
    { label: "CDRRMO",              number: "422-3008", icon: "🌀", colorClass: "ag-amber", note: "City Disaster Risk Reduction"  },
    { label: "PNP Dumaguete",       number: "422-8708", icon: "👮", colorClass: "ag-blue",  note: "Philippine National Police"   },
    { label: "BFP Dumaguete",       number: "422-2022", icon: "🔥", colorClass: "ag-red",   note: "Bureau of Fire Protection"    },
    { label: "PDRRMO",              number: "422-3006", icon: "🏥", colorClass: "ag-green", note: "Provincial DRRMO"             },
  ],
};

const RESOLUTION_TYPES = [
  { id: "forwarded",      label: "Forwarded to Department",    sub: "Handed off to appropriate agency",    icon: "↗", colorClass: "rt-blue"  },
  { id: "follow-up",      label: "Resolved — Needs Follow-Up", sub: "Addressed but monitoring required",   icon: "⟳", colorClass: "rt-amber" },
  { id: "fully-resolved", label: "Fully Resolved",             sub: "No additional action needed",         icon: "✓", colorClass: "rt-green" },
];

// ─── Inline SVG icons (zero deps) ────────────────────────────────────────────

const Ico = {
  MapPin: () => (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display:"inline-block", verticalAlign:"middle", flexShrink:0 }}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  User: () => (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display:"inline-block", verticalAlign:"middle", flexShrink:0 }}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Phone: () => (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display:"inline-block", verticalAlign:"middle", flexShrink:0 }}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  ),
  Clock: () => (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display:"inline-block", verticalAlign:"middle", flexShrink:0 }}>
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  Search: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display:"inline-block" }}>
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  Check: () => (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display:"inline-block", verticalAlign:"middle", flexShrink:0 }}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  Note: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display:"inline-block" }}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  X: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display:"inline-block" }}>
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  Image: () => (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display:"inline-block", verticalAlign:"middle" }}>
      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
    </svg>
  ),
  Video: () => (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display:"inline-block", verticalAlign:"middle" }}>
      <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
    </svg>
  ),
  ExternalLink: () => (
    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display:"inline-block", verticalAlign:"middle" }}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  ),
  Route: () => (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display:"inline-block", verticalAlign:"middle", flexShrink:0 }}>
      <circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a1.5 1.5 0 0 0 1.06-.44l2.7-2.7A1.5 1.5 0 0 0 21.7 15V5"/><path d="M18 5a3 3 0 0 0-3-3H9L6 5"/><circle cx="18" cy="5" r="3"/>
    </svg>
  ),
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const STYLES = `
:root {
  --ink:   #06101C;
  --s1:    #070F1B;
  --s2:    #050D17;
  --edge:  rgba(255,255,255,0.07);
  --text:  #D8EAF8;
  --muted: rgba(216,234,248,0.45);
  --dim:   rgba(216,234,248,0.22);
  --red:   #F33;
  --amber: #F90;
  --blue:  #4D9EFF;
  --green: #00DC82;
  --pink:  #FF4DA6;
  --slate: #8899BB;
  --font-head: 'Bebas Neue','Arial Narrow',Arial,sans-serif;
  --font-mono: 'IBM Plex Mono','Fira Mono',monospace;
  --font-body: 'DM Sans',system-ui,sans-serif;
}
@keyframes fadeIn  { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:none} }
@keyframes spin    { to{transform:rotate(360deg)} }
@keyframes modalIn { from{opacity:0;transform:scale(.94) translateY(14px)} to{opacity:1;transform:none} }
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
.ri{font-family:var(--font-body);color:var(--text);min-height:100vh;background:var(--ink)}

/* ── Header ── */
.ri-hd{display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:12px;margin-bottom:20px}
.ri-eyebrow{font-family:var(--font-mono);font-size:10px;color:rgba(243,51,51,.6);letter-spacing:.28em;text-transform:uppercase;margin-bottom:6px;display:flex;align-items:center;gap:8px}
.ri-eyebrow::before{content:'';display:block;width:20px;height:1px;background:var(--red);opacity:.5}
.ri-title{font-family:var(--font-head);font-size:42px;font-weight:400;color:#fff;letter-spacing:.04em;line-height:1}

/* ── Tabs ── */
.ri-tabs{display:flex;gap:3px;margin-bottom:16px;background:rgba(6,17,32,.8);border:1px solid var(--edge);border-radius:10px;padding:4px;width:fit-content}
.ri-tab{font-family:var(--font-mono);font-size:9.5px;font-weight:600;padding:7px 16px;border-radius:7px;border:1px solid transparent;color:rgba(216,234,248,.3);background:transparent;cursor:pointer;letter-spacing:.1em;transition:color .15s,background .15s,border-color .15s}
.ri-tab:hover:not(.active){color:rgba(216,234,248,.65)}
.ri-tab.active{background:rgba(243,51,51,.1);border-color:rgba(243,51,51,.25);color:var(--red)}

/* ── Controls ── */
.ri-controls{display:flex;align-items:center;gap:10px;margin-bottom:18px;flex-wrap:wrap}
.ri-srch-wrap{position:relative;flex:1;min-width:200px}
.ri-srch-ic{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--dim);pointer-events:none}
.ri-srch{width:100%;background:rgba(6,17,32,.9);border:1px solid var(--edge);border-radius:9px;padding:10px 12px 10px 36px;font-family:var(--font-body);font-size:13px;color:var(--text);outline:none;transition:border-color .2s}
.ri-srch::placeholder{color:var(--dim)}
.ri-srch:focus{border-color:rgba(243,51,51,.3)}
.ri-chips{display:flex;gap:5px;flex-wrap:wrap}
.ri-chip{font-family:var(--font-mono);font-size:8.5px;padding:6px 11px;border-radius:6px;border:1px solid var(--edge);background:rgba(255,255,255,.02);color:var(--muted);cursor:pointer;transition:all .15s;letter-spacing:.04em}
.ri-chip:hover:not(.active){border-color:rgba(255,255,255,.16);color:var(--text)}
.ri-chip.active{background:rgba(243,51,51,.1);border-color:rgba(243,51,51,.3);color:var(--red)}

/* ── Grid ── */
.ri-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:12px}

/* ── Card ── */
.ri-card{background:rgba(6,17,32,.92);border:1px solid var(--edge);border-radius:14px;overflow:hidden;transition:border-color .2s,transform .2s;animation:fadeIn .2s ease both;position:relative}
.ri-card:hover{border-color:rgba(255,255,255,.13);transform:translateY(-2px)}
.ri-card-bar{height:2px}
.ri-card.t-fire    .ri-card-bar{background:var(--red)}
.ri-card.t-accident .ri-card-bar{background:var(--amber)}
.ri-card.t-flood   .ri-card-bar{background:var(--blue)}
.ri-card.t-crime   .ri-card-bar{background:var(--pink)}
.ri-card.t-medical .ri-card-bar{background:var(--green)}
.ri-card.t-other   .ri-card-bar{background:var(--slate)}

.ri-card-body{padding:15px}
.ri-card-top{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}
.ri-card-label{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:700}
.ri-card.t-fire     .ri-card-label{color:var(--red)}
.ri-card.t-accident .ri-card-label{color:var(--amber)}
.ri-card.t-flood    .ri-card-label{color:var(--blue)}
.ri-card.t-crime    .ri-card-label{color:var(--pink)}
.ri-card.t-medical  .ri-card-label{color:var(--green)}
.ri-card.t-other    .ri-card-label{color:var(--slate)}

.ri-mine-tag{font-family:var(--font-mono);font-size:7.5px;font-weight:700;padding:2px 7px;border-radius:4px;background:rgba(243,51,51,.1);color:rgba(243,51,51,.8);border:1px solid rgba(243,51,51,.2)}

/* Status badge */
.ri-badge{font-family:var(--font-mono);font-size:8px;font-weight:700;padding:3px 9px;border-radius:4px;white-space:nowrap;border:1px solid rgba(255,255,255,.07)}
.ri-badge.s-pending {background:rgba(243,51,51,.1);color:var(--red)}
.ri-badge.s-progress{background:rgba(255,153,0,.1);color:var(--amber)}
.ri-badge.s-resolved{background:rgba(0,220,130,.1);color:var(--green)}

/* Fields */
.ri-fields{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:10px}
.ri-field{padding:8px 10px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:8px;display:flex;flex-direction:column;gap:3px}
.ri-field-lbl{font-family:var(--font-mono);font-size:7.5px;font-weight:500;color:var(--dim);letter-spacing:.1em;text-transform:uppercase;display:flex;align-items:center;gap:4px}
.ri-field-val{font-size:12px;font-weight:500;color:var(--muted);line-height:1.4;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ri-field-tel{color:var(--green);text-decoration:none}
.ri-field-tel:hover{text-decoration:underline}

.ri-desc{font-size:12px;font-weight:300;color:rgba(216,234,248,.4);line-height:1.6;padding:9px 11px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);border-radius:7px;margin-bottom:10px}

/* Evidence */
.ri-ev-wrap{border-radius:9px;overflow:hidden;background:rgba(0,0,0,.3);border:1px solid var(--edge);margin-bottom:10px}
.ri-ev-img{width:100%;max-height:180px;object-fit:cover;display:block;cursor:zoom-in;transition:opacity .2s,transform .3s}
.ri-ev-img:hover{opacity:.9;transform:scale(1.02)}
.ri-ev-video{width:100%;max-height:180px;display:block;background:#000}
.ri-ev-bar{display:flex;align-items:center;justify-content:space-between;padding:6px 10px;border-top:1px solid var(--edge);background:rgba(6,17,32,.7)}
.ri-ev-type{display:flex;align-items:center;gap:5px;font-family:var(--font-mono);font-size:8px;color:rgba(77,158,255,.7)}
.ri-ev-link{display:inline-flex;align-items:center;gap:4px;font-family:var(--font-mono);font-size:8px;color:var(--dim);text-decoration:none;transition:color .15s}
.ri-ev-link:hover{color:var(--text)}

/* Actions */
.ri-actions{display:flex;gap:7px;flex-wrap:wrap;padding-top:12px;border-top:1px solid rgba(255,255,255,.05)}
.ri-btn{display:inline-flex;align-items:center;gap:5px;font-family:var(--font-mono);font-size:9px;font-weight:700;padding:6px 13px;border-radius:7px;cursor:pointer;border:1px solid;transition:background .15s,transform .12s;text-decoration:none;letter-spacing:.04em;white-space:nowrap}
.ri-btn:hover{transform:translateY(-1px)}
.ri-btn:active{transform:none}
.ri-btn:disabled{opacity:.35;cursor:not-allowed;transform:none}
.ri-btn-claim  {background:rgba(243,51,51,.08);border-color:rgba(243,51,51,.3);color:var(--red)}
.ri-btn-claim:hover:not(:disabled){background:rgba(243,51,51,.16)}
.ri-btn-resolve{background:rgba(0,220,130,.08);border-color:rgba(0,220,130,.28);color:var(--green)}
.ri-btn-resolve:hover:not(:disabled){background:rgba(0,220,130,.16)}
.ri-btn-nav    {background:rgba(77,158,255,.07);border-color:rgba(77,158,255,.25);color:var(--blue)}
.ri-btn-nav:hover{background:rgba(77,158,255,.14)}

/* ── Lightbox ── */
.ri-lb{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.9);display:flex;align-items:center;justify-content:center;padding:24px;cursor:zoom-out;animation:fadeIn .2s ease}
.ri-lb img{max-width:100%;max-height:90vh;border-radius:10px;cursor:default;object-fit:contain}
.ri-lb-close{position:fixed;top:20px;right:24px;font-size:14px;color:rgba(255,255,255,.55);cursor:pointer;background:rgba(255,255,255,.1);border:none;width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;transition:all .15s}
.ri-lb-close:hover{background:rgba(255,255,255,.2);color:#fff}

/* ── Modal backdrop ── */
.ri-modal-bg{position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.8);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn .2s ease}
.ri-modal{background:var(--s2);border:1px solid rgba(0,220,130,.18);border-radius:18px;width:100%;max-width:500px;max-height:90vh;overflow-y:auto;animation:modalIn .28s cubic-bezier(.34,1.56,.64,1) both;scrollbar-width:thin;scrollbar-color:rgba(0,220,130,.15) transparent}
.ri-modal::-webkit-scrollbar{width:4px}
.ri-modal::-webkit-scrollbar-thumb{background:rgba(0,220,130,.15);border-radius:2px}

/* Modal header */
.ri-modal-hd{padding:20px 22px 16px;border-bottom:1px solid var(--edge);display:flex;align-items:flex-start;gap:14px;position:relative}
.ri-modal-hd::after{content:'';position:absolute;bottom:0;left:0;right:0;height:1px;background:linear-gradient(90deg,rgba(0,220,130,.4),rgba(0,220,130,.1),transparent 65%)}
.ri-modal-icon{width:38px;height:38px;border-radius:10px;flex-shrink:0;background:rgba(0,220,130,.1);border:1px solid rgba(0,220,130,.25);display:flex;align-items:center;justify-content:center;color:var(--green)}
.ri-modal-title-wrap{flex:1}
.ri-modal-title{font-family:var(--font-body);font-size:17px;font-weight:700;color:#fff;letter-spacing:-.3px;margin-bottom:3px}
.ri-modal-sub{font-family:var(--font-mono);font-size:9.5px;color:rgba(0,220,130,.55);letter-spacing:.1em;text-transform:uppercase}
.ri-modal-close{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:8px;width:32px;height:32px;display:flex;align-items:center;justify-content:center;color:var(--muted);cursor:pointer;transition:all .15s;flex-shrink:0}
.ri-modal-close:hover{background:rgba(255,255,255,.12);color:var(--text)}

/* Modal body */
.ri-modal-body{padding:20px 22px}

/* Summary strip */
.ri-sum{background:rgba(255,255,255,.03);border:1px solid var(--edge);border-radius:10px;padding:14px 16px;margin-bottom:20px;display:flex;flex-direction:column;gap:7px}
.ri-sum.t-fire    {border-left:3px solid var(--red)}
.ri-sum.t-accident{border-left:3px solid var(--amber)}
.ri-sum.t-flood   {border-left:3px solid var(--blue)}
.ri-sum.t-crime   {border-left:3px solid var(--pink)}
.ri-sum.t-medical {border-left:3px solid var(--green)}
.ri-sum.t-other   {border-left:3px solid var(--slate)}
.ri-sum-row{display:flex;align-items:baseline;justify-content:space-between;gap:12px}
.ri-sum-lbl{font-family:var(--font-mono);font-size:8.5px;font-weight:500;color:var(--dim);letter-spacing:.1em;text-transform:uppercase;flex-shrink:0}
.ri-sum-val{font-size:12.5px;font-weight:500;color:var(--muted);text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:62%}
.ri-sum-type{font-family:var(--font-mono);font-weight:700;font-size:11px;text-transform:uppercase}
.ri-sum.t-fire     .ri-sum-type{color:var(--red)}
.ri-sum.t-accident .ri-sum-type{color:var(--amber)}
.ri-sum.t-flood    .ri-sum-type{color:var(--blue)}
.ri-sum.t-crime    .ri-sum-type{color:var(--pink)}
.ri-sum.t-medical  .ri-sum-type{color:var(--green)}
.ri-sum.t-other    .ri-sum-type{color:var(--slate)}

/* Section heads */
.ri-sec-hd{display:flex;align-items:center;gap:10px;margin-bottom:12px;margin-top:18px}
.ri-step{font-family:var(--font-mono);font-size:9px;font-weight:700;color:rgba(243,51,51,.75);border:1px solid rgba(243,51,51,.2);border-radius:5px;padding:2px 7px;flex-shrink:0}
.ri-sec-lbl{font-family:var(--font-mono);font-size:9px;font-weight:500;color:var(--dim);letter-spacing:.12em;text-transform:uppercase;flex:1}
.ri-field-err{font-family:var(--font-mono);font-size:8.5px;color:var(--red);flex-shrink:0}

/* Resolution type cards */
.ri-rt-grid{display:flex;flex-direction:column;gap:7px}
.ri-rt-card{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:10px;cursor:pointer;background:rgba(255,255,255,.03);border:1px solid var(--edge);transition:all .15s;text-align:left;width:100%}
.ri-rt-card:hover{transform:translateX(2px)}

.ri-rt-card.rt-blue:hover,  .ri-rt-card.rt-blue.sel  {background:rgba(77,158,255,.08);border-color:rgba(77,158,255,.28)}
.ri-rt-card.rt-amber:hover, .ri-rt-card.rt-amber.sel {background:rgba(255,153,0,.08); border-color:rgba(255,153,0,.28)}
.ri-rt-card.rt-green:hover, .ri-rt-card.rt-green.sel {background:rgba(0,220,130,.08); border-color:rgba(0,220,130,.28)}

.ri-rt-icon{width:34px;height:34px;border-radius:9px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:15px;font-family:var(--font-mono)}
.ri-rt-card.rt-blue  .ri-rt-icon{background:rgba(77,158,255,.1);border:1px solid rgba(77,158,255,.25);color:var(--blue)}
.ri-rt-card.rt-amber .ri-rt-icon{background:rgba(255,153,0,.1); border:1px solid rgba(255,153,0,.25);color:var(--amber)}
.ri-rt-card.rt-green .ri-rt-icon{background:rgba(0,220,130,.1); border:1px solid rgba(0,220,130,.25);color:var(--green)}

.ri-rt-text{flex:1;display:flex;flex-direction:column;gap:2px}
.ri-rt-label{font-size:13px;font-weight:600;color:rgba(216,234,248,.8)}
.ri-rt-card.rt-blue.sel  .ri-rt-label{color:var(--blue)}
.ri-rt-card.rt-amber.sel .ri-rt-label{color:var(--amber)}
.ri-rt-card.rt-green.sel .ri-rt-label{color:var(--green)}
.ri-rt-sub{font-family:var(--font-mono);font-size:8.5px;color:var(--dim)}
.ri-rt-radio{width:15px;height:15px;border-radius:50%;border:2px solid rgba(255,255,255,.15);flex-shrink:0;transition:all .15s;position:relative}
.ri-rt-card.rt-blue.sel  .ri-rt-radio{border-color:var(--blue); background:var(--blue); box-shadow:0 0 0 3px rgba(77,158,255,.15)}
.ri-rt-card.rt-amber.sel .ri-rt-radio{border-color:var(--amber);background:var(--amber);box-shadow:0 0 0 3px rgba(255,153,0,.15)}
.ri-rt-card.rt-green.sel .ri-rt-radio{border-color:var(--green);background:var(--green);box-shadow:0 0 0 3px rgba(0,220,130,.15)}
.ri-rt-card.sel .ri-rt-radio::after{content:'';position:absolute;inset:3px;border-radius:50%;background:var(--s2)}

/* Textarea */
.ri-textarea{width:100%;min-height:90px;resize:vertical;background:rgba(6,17,32,.9);border:1px solid var(--edge);border-radius:10px;padding:12px 14px;font-family:var(--font-body);font-size:13px;font-weight:400;color:var(--text);outline:none;line-height:1.6;transition:border-color .2s,box-shadow .2s;caret-color:var(--green)}
.ri-textarea::placeholder{color:var(--dim)}
.ri-textarea:focus{border-color:rgba(0,220,130,.35);box-shadow:0 0 0 3px rgba(0,220,130,.07)}
.ri-textarea.err{border-color:rgba(243,51,51,.45)}
.ri-char{display:flex;justify-content:flex-end;margin-top:4px}
.ri-char span{font-family:var(--font-mono);font-size:9px;color:var(--dim)}

/* Preview */
.ri-preview{margin-top:18px;border-radius:10px;overflow:hidden;border:1px solid var(--edge);background:rgba(3,11,21,.7);animation:fadeIn .2s ease}
.ri-preview-hd{padding:8px 14px;background:rgba(255,255,255,.03);border-bottom:1px solid var(--edge)}
.ri-preview-hd span{font-family:var(--font-mono);font-size:8.5px;color:var(--dim);letter-spacing:.12em}
.ri-preview-body{padding:12px 14px;display:flex;flex-direction:column;gap:7px}
.ri-prev-row{display:flex;align-items:baseline;justify-content:space-between;gap:10px}
.ri-prev-row span:first-child{font-family:var(--font-mono);font-size:8.5px;color:rgba(216,234,248,.25);text-transform:uppercase;flex-shrink:0}
.ri-prev-row span:last-child{font-size:12px;color:rgba(216,234,248,.65);text-align:right;max-width:65%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ri-prev-div{height:1px;background:var(--edge)}
.ri-prev-block{display:flex;flex-direction:column;gap:4px}
.ri-prev-block-lbl{font-family:var(--font-mono);font-size:8.5px;color:rgba(216,234,248,.25);text-transform:uppercase}
.ri-prev-block-val{font-size:12px;color:rgba(216,234,248,.65);line-height:1.5}

/* Agency */
.ri-ag-sec{margin-top:22px}
.ri-ag-hd{display:flex;align-items:center;gap:10px;margin-bottom:12px}
.ri-ag-lbl{font-family:var(--font-mono);font-size:9px;color:var(--dim);letter-spacing:.14em;text-transform:uppercase}
.ri-ag-line{flex:1;height:1px;background:linear-gradient(90deg,rgba(255,255,255,.07),transparent)}
.ri-ag-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}
.ri-ag-card{display:flex;align-items:center;gap:9px;padding:10px 12px;background:rgba(6,17,32,.7);border:1px solid var(--edge);border-radius:10px;text-decoration:none;transition:all .15s;position:relative;overflow:hidden}
.ri-ag-card::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;border-radius:10px 0 0 10px}
.ri-ag-card:hover{background:rgba(255,255,255,.04);transform:translateY(-1px)}
.ri-ag-icon{width:32px;height:32px;border-radius:8px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:14px}
.ri-ag-info{flex:1;min-width:0}
.ri-ag-name{font-size:11.5px;font-weight:600;color:rgba(216,234,248,.85);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ri-ag-note{font-family:var(--font-mono);font-size:7.5px;color:var(--dim);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ri-ag-num{font-family:var(--font-mono);font-size:10.5px;font-weight:700;flex-shrink:0}

/* Agency color classes */
.ri-ag-card.ag-red  ::before,.ri-ag-card.ag-red  .ri-ag-num{color:var(--red)}
.ri-ag-card.ag-amber::before,.ri-ag-card.ag-amber .ri-ag-num{color:var(--amber)}
.ri-ag-card.ag-blue ::before,.ri-ag-card.ag-blue  .ri-ag-num{color:var(--blue)}
.ri-ag-card.ag-green::before,.ri-ag-card.ag-green .ri-ag-num{color:var(--green)}
.ri-ag-card.ag-pink ::before,.ri-ag-card.ag-pink  .ri-ag-num{color:var(--pink)}
.ri-ag-card.ag-slate::before,.ri-ag-card.ag-slate .ri-ag-num{color:var(--slate)}
.ri-ag-card.ag-red  .ri-ag-icon{background:rgba(243,51,51,.1); border:1px solid rgba(243,51,51,.2)}
.ri-ag-card.ag-amber .ri-ag-icon{background:rgba(255,153,0,.1); border:1px solid rgba(255,153,0,.2)}
.ri-ag-card.ag-blue  .ri-ag-icon{background:rgba(77,158,255,.1);border:1px solid rgba(77,158,255,.2)}
.ri-ag-card.ag-green .ri-ag-icon{background:rgba(0,220,130,.1); border:1px solid rgba(0,220,130,.2)}
.ri-ag-card.ag-pink  .ri-ag-icon{background:rgba(255,77,166,.1);border:1px solid rgba(255,77,166,.2)}
.ri-ag-card.ag-slate .ri-ag-icon{background:rgba(136,153,187,.1);border:1px solid rgba(136,153,187,.2)}
/* pseudo-element color tricks with CSS variables won't work for ::before, so we use box-shadow instead */
.ri-ag-card.ag-red   {box-shadow:inset 3px 0 0 var(--red)}
.ri-ag-card.ag-amber {box-shadow:inset 3px 0 0 var(--amber)}
.ri-ag-card.ag-blue  {box-shadow:inset 3px 0 0 var(--blue)}
.ri-ag-card.ag-green {box-shadow:inset 3px 0 0 var(--green)}
.ri-ag-card.ag-pink  {box-shadow:inset 3px 0 0 var(--pink)}
.ri-ag-card.ag-slate {box-shadow:inset 3px 0 0 var(--slate)}

/* Modal footer */
.ri-modal-ft{padding:14px 22px 20px;display:flex;gap:8px;justify-content:flex-end;border-top:1px solid var(--edge)}
.ri-ft-cancel{font-family:var(--font-mono);font-size:10px;font-weight:700;padding:10px 18px;border-radius:8px;cursor:pointer;background:transparent;border:1px solid rgba(255,255,255,.12);color:var(--muted);transition:all .15s;letter-spacing:.06em}
.ri-ft-cancel:hover{border-color:rgba(255,255,255,.22);color:var(--text)}
.ri-ft-confirm{font-family:var(--font-mono);font-size:10px;font-weight:700;padding:10px 20px;border-radius:8px;cursor:pointer;border:1px solid;transition:all .15s;letter-spacing:.06em;display:flex;align-items:center;gap:7px}
.ri-ft-confirm:hover:not(:disabled){filter:brightness(1.2)}
.ri-ft-confirm:disabled{opacity:.35;cursor:not-allowed}
.ri-ft-confirm.rt-green{background:rgba(0,220,130,.12);border-color:rgba(0,220,130,.35);color:var(--green)}
.ri-ft-confirm.rt-blue {background:rgba(77,158,255,.12);border-color:rgba(77,158,255,.35);color:var(--blue)}
.ri-ft-confirm.rt-amber{background:rgba(255,153,0,.12); border-color:rgba(255,153,0,.35); color:var(--amber)}
.ri-ft-confirm.rt-none {background:rgba(0,220,130,.12);border-color:rgba(0,220,130,.35);color:var(--green)}

/* Spinner */
.ri-spinner{display:inline-block;width:16px;height:16px;border-radius:50%;border:2px solid rgba(255,255,255,.1);border-top-color:var(--red);animation:spin .7s linear infinite}
.ri-spinner-sm{display:inline-block;width:12px;height:12px;border-radius:50%;border:2px solid rgba(0,220,130,.2);border-top-color:var(--green);animation:spin .7s linear infinite}
.ri-empty{text-align:center;padding:52px 0;font-family:var(--font-mono);font-size:10.5px;color:var(--dim);letter-spacing:.1em}

@media(max-width:520px){
  .ri-ag-grid{grid-template-columns:1fr}
  .ri-fields{grid-template-columns:1fr}
}
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

function cls(...args: (string | false | undefined | null)[]): string {
  return args.filter(Boolean).join(" ");
}

// ─── Resolution Modal ─────────────────────────────────────────────────────────

interface ModalProps {
  report: Report;
  responderName: string;
  onCancel: () => void;
  onConfirm: (p: { resolutionType: string; notes: string; actionTaken: string }) => Promise<void>;
  submitting: boolean;
}

function ResolutionModal({ report, responderName, onCancel, onConfirm, submitting }: ModalProps) {
  const [resolutionType, setResolutionType] = useState("");
  const [notes,          setNotes]          = useState("");
  const [actionTaken,    setActionTaken]    = useState("");
  const [touched,        setTouched]        = useState(false);

  const tm = TYPE_META[report.type] ?? TYPE_META.other;
  const selectedRT = RESOLUTION_TYPES.find((r) => r.id === resolutionType);
  const isValid       = resolutionType !== "" && notes.trim().length >= 10 && actionTaken.trim().length >= 5;
  const showTypeErr   = touched && resolutionType === "";
  const showNotesErr  = touched && notes.trim().length < 10;
  const showActionErr = touched && actionTaken.trim().length < 5;

  const dateTimeStr = new Date().toLocaleString("en-PH", {
    month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  const agencies = AGENCY_CONTACTS[report.type] ?? AGENCY_CONTACTS.other;

  const handleConfirm = () => {
    setTouched(true);
    if (!isValid) return;
    onConfirm({ resolutionType, notes: notes.trim(), actionTaken: actionTaken.trim() });
  };

  const showPreview = notes.trim() || actionTaken.trim() || resolutionType;

  return (
    <div className="ri-modal-bg" onClick={onCancel}>
      <div className="ri-modal" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="ri-modal-hd">
          <div className="ri-modal-icon"><Ico.Note /></div>
          <div className="ri-modal-title-wrap">
            <div className="ri-modal-title">Responder Report</div>
            <div className="ri-modal-sub">Complete before marking resolved</div>
          </div>
          <button className="ri-modal-close" onClick={onCancel}><Ico.X /></button>
        </div>

        <div className="ri-modal-body">

          {/* Summary */}
          <div className={cls("ri-sum", tm.colorClass)}>
            <div className="ri-sum-row">
              <span className="ri-sum-lbl">Incident Type</span>
              <span className={cls("ri-sum-val ri-sum-type")}>{tm.icon} {report.type.toUpperCase()}</span>
            </div>
            <div className="ri-sum-row">
              <span className="ri-sum-lbl">Location</span>
              <span className="ri-sum-val">{report.address || report.location || "Not specified"}</span>
            </div>
            <div className="ri-sum-row">
              <span className="ri-sum-lbl">Date &amp; Time</span>
              <span className="ri-sum-val">{dateTimeStr}</span>
            </div>
            <div className="ri-sum-row">
              <span className="ri-sum-lbl">Responder</span>
              <span className="ri-sum-val">{responderName}</span>
            </div>
          </div>

          {/* Step 1 — Resolution Status */}
          <div className="ri-sec-hd">
            <span className="ri-step">01</span>
            <span className="ri-sec-lbl">Resolution Status</span>
            {showTypeErr && <span className="ri-field-err">⚠ Select one</span>}
          </div>
          <div className="ri-rt-grid">
            {RESOLUTION_TYPES.map((rt) => (
              <button
                key={rt.id}
                type="button"
                className={cls("ri-rt-card", rt.colorClass, resolutionType === rt.id && "sel")}
                onClick={() => setResolutionType(rt.id)}
              >
                <span className="ri-rt-icon">{rt.icon}</span>
                <div className="ri-rt-text">
                  <span className="ri-rt-label">{rt.label}</span>
                  <span className="ri-rt-sub">{rt.sub}</span>
                </div>
                <span className="ri-rt-radio" />
              </button>
            ))}
          </div>

          {/* Step 2 — Response Notes */}
          <div className="ri-sec-hd">
            <span className="ri-step">02</span>
            <span className="ri-sec-lbl">Response Notes</span>
            {showNotesErr && <span className="ri-field-err">⚠ Min. 10 chars</span>}
          </div>
          <textarea
            className={cls("ri-textarea", showNotesErr && "err")}
            placeholder="Describe what happened on the ground — situation upon arrival, severity, conditions observed…"
            value={notes}
            onChange={(e) => { setNotes(e.target.value); setTouched(false); }}
            rows={3}
          />
          <div className="ri-char"><span>{notes.length} chars</span></div>

          {/* Step 3 — Action Taken */}
          <div className="ri-sec-hd">
            <span className="ri-step">03</span>
            <span className="ri-sec-lbl">Action Taken</span>
            {showActionErr && <span className="ri-field-err">⚠ Required</span>}
          </div>
          <textarea
            className={cls("ri-textarea", showActionErr && "err")}
            placeholder="e.g. Deployed BFP units, fire extinguished at 14:32 — area secured, no casualties…"
            value={actionTaken}
            onChange={(e) => { setActionTaken(e.target.value); setTouched(false); }}
            rows={3}
          />
          <div className="ri-char"><span>{actionTaken.length} chars</span></div>

          {/* Preview */}
          {showPreview && (
            <div className="ri-preview">
              <div className="ri-preview-hd"><span>RESPONDER REPORT PREVIEW</span></div>
              <div className="ri-preview-body">
                <div className="ri-prev-row"><span>Type</span><span>{tm.icon} {report.type.toUpperCase()}</span></div>
                <div className="ri-prev-row"><span>Location</span><span>{report.address || report.location || "—"}</span></div>
                <div className="ri-prev-row"><span>Date &amp; Time</span><span>{dateTimeStr}</span></div>
                <div className="ri-prev-div" />
                {notes.trim() && (
                  <div className="ri-prev-block">
                    <span className="ri-prev-block-lbl">Response Notes</span>
                    <span className="ri-prev-block-val">{notes.trim()}</span>
                  </div>
                )}
                {actionTaken.trim() && (
                  <div className="ri-prev-block">
                    <span className="ri-prev-block-lbl">Action Taken</span>
                    <span className="ri-prev-block-val">{actionTaken.trim()}</span>
                  </div>
                )}
                <div className="ri-prev-div" />
                <div className="ri-prev-row">
                  <span>Status</span>
                  <span>{selectedRT ? `${selectedRT.icon} ${selectedRT.label}` : "—"}</span>
                </div>
                <div className="ri-prev-row"><span>Responder</span><span>{responderName}</span></div>
              </div>
            </div>
          )}

          {/* Agencies */}
          <div className="ri-ag-sec">
            <div className="ri-ag-hd">
              <span className="ri-ag-lbl">Quick Call — Recommended Agencies</span>
              <span className="ri-ag-line" />
            </div>
            <div className="ri-ag-grid">
              {agencies.map((ag) => (
                <a
                  key={ag.label}
                  href={`tel:${ag.number}`}
                  className={cls("ri-ag-card", ag.colorClass)}
                >
                  <div className="ri-ag-icon">{ag.icon}</div>
                  <div className="ri-ag-info">
                    <div className="ri-ag-name">{ag.label}</div>
                    {ag.note && <div className="ri-ag-note">{ag.note}</div>}
                  </div>
                  <div className="ri-ag-num">{ag.number}</div>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="ri-modal-ft">
          <button className="ri-ft-cancel" onClick={onCancel} disabled={submitting}>CANCEL</button>
          <button
            className={cls("ri-ft-confirm", selectedRT ? selectedRT.colorClass : "rt-none")}
            onClick={handleConfirm}
            disabled={submitting}
          >
            {submitting
              ? <><span className="ri-spinner-sm" /> SUBMITTING…</>
              : <><Ico.Check /> SUBMIT &amp; RESOLVE</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type TabId = "all" | "mine" | "unassigned";

export default function ResponderIncidentsPage() {
  const [reports,       setReports]       = useState<Report[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [responderId,   setResponderId]   = useState("");
  const [responderName, setResponderName] = useState("Responder");
  const [tab,           setTab]           = useState<TabId>("all");
  const [filterType,    setFilterType]    = useState("all");
  const [search,        setSearch]        = useState("");
  const [claiming,      setClaiming]      = useState<string | null>(null);
  const [lightbox,      setLightbox]      = useState<string | null>(null);
  const [resolveTarget, setResolveTarget] = useState<Report | null>(null);
  const [resolving,     setResolving]     = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setResponderId(user.id);
      const { data: profile } = await supabase
        .from("profiles").select("full_name").eq("id", user.id).single();
      if (profile?.full_name) setResponderName(profile.full_name);
    });
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
    await supabase
      .from("reports")
      .update({ responder_id: responderId, status: "in-progress" })
      .eq("id", id);
    await loadReports();
    setClaiming(null);
  };

  const confirmResolve = async (payload: { resolutionType: string; notes: string; actionTaken: string }) => {
    if (!resolveTarget || !responderId) return;
    setResolving(true);
    const fullNote = [
      `[${payload.resolutionType.toUpperCase()}]`,
      `Response Notes: ${payload.notes}`,
      `Action Taken: ${payload.actionTaken}`,
    ].join("\n");
    try {
      await supabase.from("incident_notes").insert({
        incident_id:  resolveTarget.id,
        note_text:    fullNote,
        responder_id: responderId,
      });
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

  // Filtering
  let filtered = reports;
  if (tab === "mine")       filtered = filtered.filter((r) => r.responder_id === responderId);
  if (tab === "unassigned") filtered = filtered.filter((r) => !r.responder_id && r.status === "pending");
  if (filterType !== "all") filtered = filtered.filter((r) => r.type === filterType);
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter((r) =>
      r.type.includes(q) ||
      (r.address ?? "").toLowerCase().includes(q) ||
      (r.reporter_name ?? "").toLowerCase().includes(q) ||
      (r.description ?? "").toLowerCase().includes(q)
    );
  }

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: "all",        label: "ALL REPORTS", count: reports.length },
    { id: "mine",       label: "MY CASES",    count: reports.filter((r) => r.responder_id === responderId).length },
    { id: "unassigned", label: "UNASSIGNED",  count: reports.filter((r) => !r.responder_id && r.status === "pending").length },
  ];
  const typeFilters = ["all", "fire", "accident", "flood", "crime", "medical", "other"];

  return (
    <>
      <style>{STYLES}</style>
      <div className="ri">

        {/* Lightbox */}
        {lightbox && (
          <div className="ri-lb" onClick={() => setLightbox(null)}>
            <button className="ri-lb-close" onClick={() => setLightbox(null)}><Ico.X /></button>
            <img src={lightbox} alt="Evidence" onClick={(e) => e.stopPropagation()} />
          </div>
        )}

        {/* Resolve modal */}
        {resolveTarget && (
          <ResolutionModal
            report={resolveTarget}
            responderName={responderName}
            onCancel={() => !resolving && setResolveTarget(null)}
            onConfirm={confirmResolve}
            submitting={resolving}
          />
        )}

        {/* Header */}
        <div className="ri-hd">
          <div>
            <div className="ri-eyebrow">Field Operations</div>
            <div className="ri-title">INCIDENTS</div>
          </div>
          {loading && <div className="ri-spinner" />}
        </div>

        {/* Tabs */}
        <div className="ri-tabs">
          {tabs.map((t) => (
            <button
              key={t.id}
              className={cls("ri-tab", tab === t.id && "active")}
              onClick={() => setTab(t.id)}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="ri-controls">
          <div className="ri-srch-wrap">
            <span className="ri-srch-ic"><Ico.Search /></span>
            <input
              className="ri-srch"
              placeholder="Search incidents…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="ri-chips">
            {typeFilters.map((t) => (
              <button
                key={t}
                className={cls("ri-chip", filterType === t && "active")}
                onClick={() => setFilterType(t)}
              >
                {t === "all" ? "ALL TYPES" : `${TYPE_META[t]?.icon ?? ""} ${t.toUpperCase()}`}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="ri-empty"><div className="ri-spinner" style={{ margin: "0 auto" }} /></div>
        ) : filtered.length === 0 ? (
          <div className="ri-empty">NO INCIDENTS FOUND</div>
        ) : (
          <div className="ri-grid">
            {filtered.map((r) => {
              const tm = TYPE_META[r.type]     ?? TYPE_META.other;
              const sm = STATUS_META[r.status] ?? STATUS_META.pending;
              const isMine    = r.responder_id === responderId;
              const canClaim  = !r.responder_id && r.status === "pending" && responderId.length > 0;
              const canResolve = isMine && r.status === "in-progress";
              const vid = r.evidence_url && isVideo(r.evidence_url);

              return (
                <div key={String(r.id)} className={cls("ri-card", tm.colorClass)}>
                  <div className="ri-card-bar" />
                  <div className="ri-card-body">

                    {/* Card top */}
                    <div className="ri-card-top">
                      <div className="ri-card-label">
                        <span>{tm.icon}</span>
                        <span>{r.type.replace(/_/g, " ")}</span>
                        {isMine && <span className="ri-mine-tag">MINE</span>}
                      </div>
                      <span className={cls("ri-badge", sm.colorClass)}>{sm.label}</span>
                    </div>

                    {/* Fields grid */}
                    <div className="ri-fields">
                      <div className="ri-field">
                        <span className="ri-field-lbl"><Ico.MapPin /> Location</span>
                        <span className="ri-field-val">{r.address || r.location || "—"}</span>
                      </div>
                      <div className="ri-field">
                        <span className="ri-field-lbl"><Ico.User /> Reporter</span>
                        <span className="ri-field-val">{r.reporter_name || "Anonymous"}</span>
                      </div>
                      {r.reporter_contact && (
                        <div className="ri-field">
                          <span className="ri-field-lbl"><Ico.Phone /> Contact</span>
                          <a href={`tel:${r.reporter_contact}`} className="ri-field-val ri-field-tel">
                            {r.reporter_contact}
                          </a>
                        </div>
                      )}
                      <div className="ri-field">
                        <span className="ri-field-lbl"><Ico.Clock /> Reported</span>
                        <span className="ri-field-val">{formatRelative(r.created_at)}</span>
                      </div>
                    </div>

                    {/* Description */}
                    {r.description && <div className="ri-desc">{r.description}</div>}

                    {/* Evidence */}
                    {r.evidence_url && (
                      <div className="ri-ev-wrap">
                        {vid ? (
                          <video className="ri-ev-video" src={r.evidence_url} controls preload="metadata" />
                        ) : (
                          <img
                            className="ri-ev-img"
                            src={r.evidence_url}
                            alt="Incident evidence"
                            onClick={() => setLightbox(r.evidence_url!)}
                          />
                        )}
                        <div className="ri-ev-bar">
                          <span className="ri-ev-type">
                            {vid ? <Ico.Video /> : <Ico.Image />}
                            {vid ? "Video Evidence" : "Photo Evidence"}
                          </span>
                          <a href={r.evidence_url} target="_blank" rel="noopener noreferrer" className="ri-ev-link">
                            Open full <Ico.ExternalLink />
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="ri-actions">
                      {canClaim && (
                        <button
                          className="ri-btn ri-btn-claim"
                          disabled={claiming === String(r.id)}
                          onClick={() => claimReport(r.id)}
                        >
                          {claiming === String(r.id) ? "Claiming…" : "Claim Incident →"}
                        </button>
                      )}
                      {canResolve && (
                        <button className="ri-btn ri-btn-resolve" onClick={() => setResolveTarget(r)}>
                          <Ico.Check /> Mark Resolved
                        </button>
                      )}
                      {r.location && (
                        <a
                          href={`https://www.google.com/maps?q=${r.location}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ri-btn ri-btn-nav"
                        >
                          <Ico.Route /> Navigate
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