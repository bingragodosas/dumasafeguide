// src/citizen/CitizenReport.tsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import pagesBackground from "../assets/pagesbackground.png";
import { supabase } from "../js/supabase";

const INCIDENT_TYPES = [
  { value: "fire",     label: "Fire Incident",    icon: "🔥", accent: "#FF6B6B", rgb: "255,107,107" },
  { value: "accident", label: "Road Accident",     icon: "🚗", accent: "#FFD166", rgb: "255,209,102" },
  { value: "flood",    label: "Flood",             icon: "🌊", accent: "#7B9EFF", rgb: "123,158,255" },
  { value: "crime",    label: "Crime",             icon: "🚨", accent: "#FF9F43", rgb: "255,159,67"  },
  { value: "medical",  label: "Medical Emergency", icon: "🏥", accent: "#2ECC8F", rgb: "46,204,143"  },
  { value: "other",    label: "Other",             icon: "⚠️", accent: "#8fa3be", rgb: "143,163,190" },
];

const EMERGENCY_HOTLINES = [
  { label: "BFP",    number: "422-2022", icon: "🔥", color: "#FF6B6B" },
  { label: "CDRRMO", number: "422-3008", icon: "🌀", color: "#FFD166" },
  { label: "PNP",    number: "422-8708", icon: "👮", color: "#7B9EFF" },
  { label: "PDRRMO", number: "422-3006", icon: "🏥", color: "#2ECC8F" },
];

const STEPS = ["Incident Type", "Reporter Info", "Location", "Description", "Evidence", "Submit"];

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@400;500;700;800;900&family=Instrument+Sans:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .cr-root {
    min-height: 100vh;
    font-family: 'Instrument Sans', sans-serif;
    color: #eef0f7;
    position: relative;
    overflow-x: hidden;
    background: #080c14;
  }
  .cr-bg {
    position: fixed; inset: 0; z-index: 0;
    background-size: cover; background-position: center; background-repeat: no-repeat;
  }
  .cr-bg::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(160deg, rgba(8,12,20,.92) 0%, rgba(8,12,20,.80) 50%, rgba(8,12,20,.94) 100%);
  }
  .cr-glow { position: fixed; inset: 0; pointer-events: none; z-index: 1; overflow: hidden; }
  .cr-glow-a { position: absolute; width: 600px; height: 600px; border-radius: 50%; background: radial-gradient(circle, rgba(255,107,107,.06) 0%, transparent 70%); top: -180px; left: -80px; }
  .cr-glow-b { position: absolute; width: 500px; height: 500px; border-radius: 50%; background: radial-gradient(circle, rgba(46,204,143,.05) 0%, transparent 70%); bottom: -140px; right: -60px; }

  .cr-inner {
    position: relative; z-index: 2;
    max-width: 1100px; margin: 0 auto;
    padding: 0 24px 100px;
  }
  .cr-inner--center {
    display: flex; align-items: center; justify-content: center; min-height: 80vh;
  }

  /* ── Hero ── */
  .cr-hero { margin-top: 52px; margin-bottom: 28px; }
  .cr-hero-tag {
    display: inline-flex; align-items: center; gap: 7px;
    font-size: 11px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase;
    color: #FF6B6B; margin-bottom: 16px;
  }
  .cr-hero-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: #FF6B6B; box-shadow: 0 0 8px #FF6B6B;
    animation: cr-pulse 2s ease infinite;
  }
  @keyframes cr-pulse { 0%,100%{opacity:1;transform:scale(1);}50%{opacity:.4;transform:scale(.75);} }
  .cr-hero-heading {
    font-family: 'Cabinet Grotesk', sans-serif;
    font-size: clamp(30px, 5vw, 58px);
    font-weight: 900; line-height: 1.0;
    letter-spacing: -.035em; color: #eef0f7; margin-bottom: 12px;
  }
  .cr-hero-heading em { font-style: normal; color: #FF6B6B; }
  .cr-hero-sub {
    font-size: 14px; font-weight: 400;
    color: rgba(238,240,247,.35);
    max-width: 480px; line-height: 1.7;
  }

  /* ── Tracking banner ── */
  .cr-banner {
    display: flex; align-items: center; gap: 14px;
    background: rgba(46,204,143,.06);
    border: 1px solid rgba(46,204,143,.18);
    border-radius: 14px; padding: 14px 18px;
    margin-bottom: 24px;
  }
  .cr-banner-icon { font-size: 22px; flex-shrink: 0; }
  .cr-banner-body { flex: 1; }
  .cr-banner-title {
    font-family: 'Cabinet Grotesk', sans-serif;
    font-size: 13px; font-weight: 800; letter-spacing: -.01em;
    color: #2ECC8F; margin-bottom: 3px;
  }
  .cr-banner-text {
    font-size: 12px; font-weight: 400;
    color: rgba(238,240,247,.32); line-height: 1.5;
  }
  .cr-banner-text strong { color: rgba(46,204,143,.72); font-weight: 600; }
  .cr-banner-btn {
    flex-shrink: 0; display: inline-flex; align-items: center;
    font-size: 12px; font-weight: 600;
    color: #2ECC8F; background: rgba(46,204,143,.10);
    border: 1px solid rgba(46,204,143,.22); border-radius: 8px;
    padding: 8px 14px; white-space: nowrap; cursor: pointer;
    transition: background .18s, transform .18s;
  }
  .cr-banner-btn:hover { background: rgba(46,204,143,.18); transform: translateY(-1px); }

  /* ── Steps ── */
  .cr-steps {
    display: flex; align-items: center;
    background: rgba(15,21,33,.82); backdrop-filter: blur(16px);
    border: 1px solid rgba(255,255,255,.07); border-radius: 14px;
    padding: 14px 18px; margin-bottom: 28px;
    overflow-x: auto; scrollbar-width: none; flex-wrap: nowrap;
    -webkit-mask-image: linear-gradient(to right, black 85%, transparent 100%);
    mask-image: linear-gradient(to right, black 85%, transparent 100%);
  }
  .cr-steps::-webkit-scrollbar { display: none; }
  .cr-step { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
  .cr-step-dot {
    width: 24px; height: 24px; border-radius: 50%;
    border: 1px solid rgba(255,255,255,.10); background: rgba(255,255,255,.03);
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 600; color: rgba(238,240,247,.22);
    transition: all .3s; flex-shrink: 0;
  }
  .cr-step--done .cr-step-dot   { background: rgba(46,204,143,.15); border-color: #2ECC8F; color: #2ECC8F; }
  .cr-step--active .cr-step-dot { background: rgba(255,107,107,.15); border-color: #FF6B6B; color: #FF6B6B; box-shadow: 0 0 8px rgba(255,107,107,.28); }
  .cr-step-label {
    font-size: 11px; font-weight: 500; color: rgba(238,240,247,.22);
    white-space: nowrap; transition: color .3s;
  }
  .cr-step--done .cr-step-label   { color: rgba(46,204,143,.55); }
  .cr-step--active .cr-step-label { color: rgba(255,107,107,.80); }
  .cr-step-line { width: 18px; height: 1px; background: rgba(255,255,255,.07); margin: 0 6px; flex-shrink: 0; }

  /* ── Layout ── */
  .cr-layout { display: grid; grid-template-columns: 1fr 290px; gap: 22px; align-items: start; }

  /* ── Form ── */
  .cr-form { display: flex; flex-direction: column; gap: 14px; }
  .cr-card {
    background: rgba(15,21,33,.82); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255,255,255,.07); border-radius: 18px;
    padding: 22px 20px; display: flex; flex-direction: column; gap: 16px;
    animation: cr-up .5s ease both;
  }
  .cr-card:nth-child(1){animation-delay:.06s;}
  .cr-card:nth-child(2){animation-delay:.10s;}
  .cr-card:nth-child(3){animation-delay:.14s;}
  .cr-card:nth-child(4){animation-delay:.18s;}
  .cr-card:nth-child(5){animation-delay:.22s;}
  @keyframes cr-up { from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);} }

  .cr-card-label {
    font-family: 'Cabinet Grotesk', sans-serif;
    font-size: 14px; font-weight: 800; letter-spacing: -.02em;
    color: #eef0f7; display: flex; align-items: center; gap: 10px;
  }
  .cr-step-badge {
    font-size: 9.5px; font-weight: 700; letter-spacing: .12em;
    color: rgba(238,240,247,.28);
    border: 1px solid rgba(255,255,255,.10);
    border-radius: 4px; padding: 2px 7px;
  }
  .cr-optional { font-size: 11px; font-weight: 400; color: rgba(238,240,247,.22); margin-left: 4px; }

  /* Type grid */
  .cr-type-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; }
  .cr-type-btn {
    background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.07);
    border-radius: 12px; padding: 13px 10px;
    display: flex; flex-direction: column; align-items: center; gap: 7px;
    cursor: pointer; transition: transform .2s, border-color .2s, background .2s;
  }
  .cr-type-btn:hover { transform: translateY(-2px); border-color: var(--ta); background: var(--td); }
  .cr-type-btn.active { border-color: var(--ta) !important; background: var(--td) !important; transform: translateY(-2px); box-shadow: 0 0 20px rgba(var(--tr),.18); }
  .cr-type-icon { font-size: 20px; }
  .cr-type-label { font-size: 11px; font-weight: 500; color: rgba(238,240,247,.45); text-align: center; line-height: 1.3; }
  .cr-type-confirm {
    display: flex; align-items: center; gap: 8px;
    font-size: 12px; font-weight: 600;
    color: var(--ta); background: var(--td);
    border: 1px solid var(--ta); border-radius: 8px; padding: 8px 14px;
    animation: cr-up .28s ease both;
  }

  /* Fields */
  .cr-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .cr-field { display: flex; flex-direction: column; gap: 7px; }
  .cr-label {
    font-size: 10px; font-weight: 600; letter-spacing: .16em; text-transform: uppercase;
    color: rgba(238,240,247,.28);
  }
  .cr-input {
    background: rgba(8,12,20,.80); border: 1px solid rgba(255,255,255,.08);
    border-radius: 9px; padding: 11px 13px;
    font-family: 'Instrument Sans', sans-serif;
    font-size: 13px; font-weight: 400; color: #eef0f7;
    outline: none; width: 100%; transition: border-color .18s, background .18s;
    caret-color: #2ECC8F;
  }
  .cr-input::placeholder { color: rgba(238,240,247,.20); }
  .cr-input:focus { border-color: rgba(46,204,143,.40); background: rgba(46,204,143,.03); box-shadow: 0 0 12px rgba(46,204,143,.10); }
  .cr-input--readonly:focus { border-color: rgba(255,255,255,.10); background: rgba(8,12,20,.80); box-shadow: none; }
  .cr-textarea {
    background: rgba(8,12,20,.80); border: 1px solid rgba(255,255,255,.08);
    border-radius: 9px; padding: 11px 13px;
    font-family: 'Instrument Sans', sans-serif;
    font-size: 13px; font-weight: 400; color: #eef0f7;
    outline: none; width: 100%; resize: vertical; line-height: 1.65;
    transition: border-color .18s; caret-color: #2ECC8F;
  }
  .cr-textarea::placeholder { color: rgba(238,240,247,.20); }
  .cr-textarea:focus { border-color: rgba(46,204,143,.40); background: rgba(46,204,143,.03); box-shadow: 0 0 12px rgba(46,204,143,.10); }

  /* Location */
  .cr-loc-row { display: flex; align-items: stretch; gap: 8px; }
  .cr-loc-wrap { position: relative; flex: 1; min-width: 0; display: flex; align-items: center; }
  .cr-loc-dot {
    position: absolute; left: 13px; top: 50%; transform: translateY(-50%);
    width: 7px; height: 7px; border-radius: 50%;
    background: rgba(238,240,247,.18); transition: background .3s;
    z-index: 1; pointer-events: none; flex-shrink: 0;
  }
  .cr-loc-dot[data-status="loading"] { background: #FFD166; animation: cr-pulse 1.2s ease infinite; }
  .cr-loc-dot[data-status="ok"]      { background: #2ECC8F; }
  .cr-loc-dot[data-status="error"]   { background: #FF6B6B; }
  .cr-input--loc { padding-left: 30px; width: 100%; }
  .cr-gps-btn {
    flex-shrink: 0; background: rgba(46,204,143,.08);
    border: 1px solid rgba(46,204,143,.18); border-radius: 9px;
    padding: 9px 13px; font-size: 12px; font-weight: 600;
    color: #2ECC8F; cursor: pointer; white-space: nowrap;
    transition: background .18s, border-color .18s;
    min-height: 44px; display: flex; align-items: center;
  }
  .cr-gps-btn:hover { background: rgba(46,204,143,.15); border-color: rgba(46,204,143,.35); }
  .cr-coords-badge {
    display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
    background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.07);
    border-radius: 8px; padding: 7px 12px;
  }
  .cr-coords-text { font-size: 11px; color: rgba(238,240,247,.28); font-variant-numeric: tabular-nums; flex: 1; }
  .cr-maps-link {
    font-size: 11px; font-weight: 600; color: #2ECC8F;
    text-decoration: none; white-space: nowrap; transition: opacity .18s;
  }
  .cr-maps-link:hover { opacity: .7; }
  .cr-gps-acquiring {
    display: flex; align-items: center; gap: 9px;
    font-size: 12px; color: rgba(255,209,102,.60); line-height: 1.5;
  }
  .cr-gps-pulse {
    width: 9px; height: 9px; border-radius: 50%; background: #FFD166; flex-shrink: 0;
    animation: cr-pulse 1.1s ease infinite;
  }
  .cr-acc-badges { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .cr-acc-badge {
    font-size: 11px; font-weight: 500; padding: 3px 10px; border-radius: 20px;
  }
  .acc-great { background: rgba(46,204,143,.12);  color: #2ECC8F; border: 1px solid rgba(46,204,143,.25); }
  .acc-ok    { background: rgba(255,209,102,.10); color: #FFD166; border: 1px solid rgba(255,209,102,.22); }
  .acc-poor  { background: rgba(255,107,107,.10); color: #FF6B6B; border: 1px solid rgba(255,107,107,.22); }
  .cr-acc-tip { font-size: 11px; color: rgba(255,107,107,.55); }
  .cr-hint { font-size: 12px; color: rgba(238,240,247,.25); line-height: 1.5; }
  .cr-hint--warn { font-size: 11px; color: rgba(255,209,102,.55); }

  /* Dropzone */
  .cr-dropzone {
    border: 1px dashed rgba(255,255,255,.12); border-radius: 12px;
    padding: 28px 20px; display: flex; flex-direction: column; align-items: center; gap: 6px;
    cursor: pointer; transition: border-color .2s, background .2s; text-align: center;
  }
  .cr-dropzone:hover { border-color: rgba(46,204,143,.30); background: rgba(46,204,143,.03); }
  .cr-dropzone-icon { font-size: 24px; }
  .cr-dropzone-text { font-size: 13px; font-weight: 400; color: rgba(238,240,247,.40); }
  .cr-dropzone-name { font-size: 13px; font-weight: 600; color: #2ECC8F; }
  .cr-dropzone-hint, .cr-dropzone-change { font-size: 11px; color: rgba(238,240,247,.22); }
  .cr-upload-status { font-size: 12px; font-weight: 500; padding: 8px 12px; border-radius: 8px; }
  .cr-upload--uploading { background: rgba(255,209,102,.08); color: #FFD166; border: 1px solid rgba(255,209,102,.20); }
  .cr-upload--done      { background: rgba(46,204,143,.08);  color: #2ECC8F; border: 1px solid rgba(46,204,143,.20); }
  .cr-upload--error     { background: rgba(255,107,107,.08); color: #FF6B6B; border: 1px solid rgba(255,107,107,.20); }

  /* Disclaimer */
  .cr-disclaimer {
    background: rgba(255,209,102,.04); border: 1px solid rgba(255,209,102,.12);
    border-radius: 14px; padding: 16px 18px;
    display: flex; flex-direction: column; gap: 12px;
    animation: cr-up .5s ease .24s both;
  }
  .cr-disclaimer-header { display: flex; align-items: center; gap: 8px; }
  .cr-disclaimer-title {
    font-family: 'Cabinet Grotesk', sans-serif;
    font-size: 11px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase;
    color: rgba(255,209,102,.75);
  }
  .cr-disclaimer-summary { font-size: 12px; color: rgba(238,240,247,.28); line-height: 1.55; }
  .cr-check-row { display: flex; align-items: flex-start; gap: 12px; cursor: pointer; }
  .cr-checkbox-hidden { display: none; }
  .cr-checkbox-box {
    width: 18px; height: 18px; flex-shrink: 0;
    border: 1px solid rgba(255,209,102,.30); border-radius: 5px;
    background: rgba(255,209,102,.05);
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700; color: #FFD166; margin-top: 1px;
    transition: all .2s;
  }
  .cr-check-text {
    font-size: 12px; font-weight: 400; color: rgba(238,240,247,.28); line-height: 1.65;
  }
  .cr-check-text strong { font-weight: 600; color: rgba(255,209,102,.65); }

  /* Error banner */
  .cr-error {
    background: rgba(255,107,107,.08); border: 1px solid rgba(255,107,107,.22);
    border-radius: 10px; padding: 12px 16px;
    font-size: 13px; color: #FF6B6B; animation: cr-up .28s ease both;
  }
  .cr-skip-btn {
    display: inline-block; margin-top: 8px; padding: 7px 14px;
    background: rgba(255,107,107,.12); border: 1px solid rgba(255,107,107,.28);
    border-radius: 7px; font-size: 12px; font-weight: 600;
    color: #FF6B6B; cursor: pointer; transition: background .18s;
  }
  .cr-skip-btn:hover { background: rgba(255,107,107,.20); }

  /* Submit */
  .cr-submit {
    display: flex; align-items: center; justify-content: center; gap: 10px;
    width: 100%; padding: 15px 24px;
    font-family: 'Cabinet Grotesk', sans-serif;
    font-size: 14px; font-weight: 900; letter-spacing: .04em; text-transform: uppercase;
    color: #080c14; background: #2ECC8F;
    border: none; border-radius: 12px; cursor: pointer;
    transition: opacity .2s, transform .2s, background .2s;
    animation: cr-up .5s ease .28s both;
  }
  .cr-submit:hover:not(:disabled) { background: #38e09e; transform: translateY(-2px); }
  .cr-submit:active:not(:disabled) { transform: translateY(0); background: #27b885; }
  .cr-submit:disabled { opacity: .28; cursor: not-allowed; background: rgba(255,255,255,.06); color: rgba(238,240,247,.28); }
  .cr-submit-arrow { font-size: 17px; transition: transform .2s; }
  .cr-submit:hover:not(:disabled) .cr-submit-arrow { transform: translateX(4px); }
  .cr-spinner {
    display: inline-block; width: 14px; height: 14px;
    border: 2px solid rgba(8,12,20,.3); border-top-color: #080c14;
    border-radius: 50%; animation: cr-spin .75s linear infinite;
  }
  @keyframes cr-spin { to { transform: rotate(360deg); } }

  /* ── Sidebar ── */
  .cr-sidebar { display: flex; flex-direction: column; gap: 12px; position: sticky; top: 72px; animation: cr-up .5s ease .08s both; }
  .cr-sidebar-card {
    background: rgba(15,21,33,.82); backdrop-filter: blur(16px);
    border: 1px solid rgba(255,255,255,.07); border-radius: 18px;
    padding: 18px 16px; display: flex; flex-direction: column; gap: 10px;
  }
  .cr-sidebar-card--warn  { background: rgba(255,209,102,.04); border-color: rgba(255,209,102,.12); }
  .cr-sidebar-card--info  { background: rgba(123,158,255,.04); border-color: rgba(123,158,255,.12); }
  .cr-sidebar-card--track { background: rgba(46,204,143,.04);  border-color: rgba(46,204,143,.12);  }
  .cr-sidebar-title {
    font-family: 'Cabinet Grotesk', sans-serif;
    font-size: 12px; font-weight: 800; letter-spacing: .05em; text-transform: uppercase;
    color: #eef0f7;
  }
  .cr-sidebar-text { font-size: 12px; font-weight: 400; color: rgba(238,240,247,.28); line-height: 1.65; }
  .cr-track-btn {
    display: inline-flex; align-items: center;
    font-size: 12px; font-weight: 600;
    color: #2ECC8F; background: rgba(46,204,143,.08);
    border: 1px solid rgba(46,204,143,.18); border-radius: 8px;
    padding: 8px 12px; cursor: pointer; width: fit-content;
    transition: background .18s, border-color .18s;
  }
  .cr-track-btn:hover { background: rgba(46,204,143,.15); border-color: rgba(46,204,143,.32); }

  .cr-hotlines { display: flex; flex-direction: column; gap: 8px; }
  .cr-hotline {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px;
    background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.06); border-radius: 10px;
    text-decoration: none; transition: background .2s, border-color .2s; min-height: 44px;
  }
  .cr-hotline:hover { background: rgba(255,255,255,.06); border-color: var(--hc); }
  .cr-hotline-icon { font-size: 15px; }
  .cr-hotline-info { display: flex; flex-direction: column; flex: 1; }
  .cr-hotline-label { font-size: 9.5px; font-weight: 600; letter-spacing: .10em; text-transform: uppercase; color: rgba(238,240,247,.28); }
  .cr-hotline-number { font-family: 'Cabinet Grotesk', sans-serif; font-size: 14px; font-weight: 800; color: #eef0f7; }
  .cr-hotline-call { font-size: 11px; font-weight: 600; color: var(--hc); opacity: .70; }

  /* ── Success ── */
  .cr-success {
    display: flex; flex-direction: column; align-items: center; text-align: center;
    padding: 60px 24px; animation: cr-up .5s ease both;
  }
  .cr-success-icon {
    width: 64px; height: 64px; border-radius: 50%;
    background: rgba(46,204,143,.12); border: 1px solid rgba(46,204,143,.28);
    display: flex; align-items: center; justify-content: center;
    font-size: 26px; color: #2ECC8F; margin-bottom: 22px;
  }
  .cr-success-title {
    font-family: 'Cabinet Grotesk', sans-serif;
    font-size: 32px; font-weight: 900; letter-spacing: -.03em; color: #eef0f7; margin-bottom: 12px;
  }
  .cr-success-sub {
    font-size: 14px; font-weight: 400; color: rgba(238,240,247,.35);
    max-width: 460px; line-height: 1.68; margin-bottom: 36px;
  }

  /* ── SUCCESS CARDS ROW ── */
  .cr-success-cards {
    display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;
    width: 100%; max-width: 780px;
  }
  .cr-success-card {
    background: rgba(15,21,33,.82); backdrop-filter: blur(16px);
    border: 1px solid rgba(255,255,255,.07); border-radius: 18px;
    padding: 24px 20px; flex: 1; min-width: 260px; max-width: 360px;
    display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center;
    animation: cr-up .5s ease .1s both;
  }
  .cr-success-card--track {
    background: rgba(46,204,143,.04);
    border-color: rgba(46,204,143,.18);
    animation-delay: .18s;
  }
  .cr-success-card-icon { font-size: 30px; }
  .cr-success-card-title { font-family: 'Cabinet Grotesk', sans-serif; font-size: 15px; font-weight: 800; color: #eef0f7; }
  .cr-success-card-text { font-size: 12px; color: rgba(238,240,247,.30); line-height: 1.55; }
  .cr-success-btn {
    margin-top: 4px; display: inline-flex; align-items: center;
    font-size: 13px; font-weight: 600;
    color: #2ECC8F; background: rgba(46,204,143,.08);
    border: 1px solid rgba(46,204,143,.22); border-radius: 9px;
    padding: 10px 18px; cursor: pointer; min-height: 40px;
    transition: background .18s, border-color .18s;
  }
  .cr-success-btn:hover { background: rgba(46,204,143,.15); border-color: rgba(46,204,143,.38); }
  .cr-success-btn--track {
    color: #eef0f7; background: #2ECC8F;
    border-color: #2ECC8F;
  }
  .cr-success-btn--track:hover { background: #38e09e; border-color: #38e09e; color: #060a10; }

  /* Responsive */
  @media (max-width: 860px) {
    .cr-layout { grid-template-columns: 1fr; }
    .cr-sidebar { position: static; }
    .cr-hotlines { flex-direction: row; flex-wrap: wrap; }
    .cr-hotline { flex: 1 1 calc(50% - 4px); }
    .cr-inner { padding: 0 16px 80px; }
    .cr-banner { flex-direction: column; align-items: flex-start; }
    .cr-banner-btn { width: 100%; justify-content: center; }
    .cr-steps { -webkit-mask-image: none; mask-image: none; }
    .cr-success-cards { flex-direction: column; align-items: center; }
  }
  @media (max-width: 560px) {
    .cr-fields { grid-template-columns: 1fr; }
    .cr-type-grid { grid-template-columns: repeat(2,1fr); }
    .cr-hotline { flex: 1 1 100%; }
  }
  @media (max-width: 480px) {
    .cr-loc-row { flex-direction: column; }
    .cr-gps-btn { width: 100%; justify-content: center; }
    .cr-step-label { width: 0; font-size: 0; overflow: hidden; padding: 0; margin: 0; }
    .cr-step-line { width: 10px; margin: 0 2px; }
    .cr-step-dot { width: 28px; height: 28px; font-size: 11px; }
  }
`;

export default function CitizenReport() {
  const navigate = useNavigate();

  const [location,        setLocation]        = useState("");
  const [address,         setAddress]         = useState<string | null>(null);
  const [locationStatus,  setLocationStatus]  = useState<"idle"|"loading"|"ok"|"error">("idle");
  const [selectedType,    setSelectedType]    = useState<string | null>(null);
  const [agreed,          setAgreed]          = useState(false);
  const [submitted,       setSubmitted]       = useState(false);
  const [submittedId,     setSubmittedId]     = useState<string | null>(null);
  const [fileName,        setFileName]        = useState<string | null>(null);
  const [fileObject,      setFileObject]      = useState<File | null>(null);
  const [uploadProgress,  setUploadProgress]  = useState<"idle"|"uploading"|"done"|"error">("idle");
  const [gpsAccuracy,     setGpsAccuracy]     = useState<number | null>(null);
  const [currentStep,     setCurrentStep]     = useState(0);
  const [submitting,      setSubmitting]      = useState(false);
  const [submitError,     setSubmitError]     = useState<string | null>(null);
  const [reporterName,    setReporterName]    = useState("");
  const [reporterContact, setReporterContact] = useState("");
  const [description,     setDescription]    = useState("");

  const fileRef    = useRef<HTMLInputElement>(null);
  const activeType = INCIDENT_TYPES.find(t => t.value === selectedType);

  async function reverseGeocode(lat: string, lng: string) {
    try {
      const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=jsonv2&addressdetails=1`, { headers: { "Accept-Language": "en" } });
      const data = await res.json();
      if (data?.address) {
        const a = data.address;
        const parts: string[] = [];
        if (a.road)            parts.push(a.road);
        if (a.neighbourhood)   parts.push(a.neighbourhood);
        if (a.suburb)          parts.push(a.suburb);
        if (a.village)         parts.push(a.village);
        if (a.barangay)        parts.push(a.barangay);
        if (a.city || a.town || a.municipality) parts.push(a.city ?? a.town ?? a.municipality);
        if (a.state || a.province) parts.push(a.state ?? a.province);
        if (a.country)         parts.push(a.country);
        const clean = [...new Set(parts)];
        if (clean.length) { setAddress(clean.join(", ")); return; }
      }
      if (data?.display_name) { setAddress(data.display_name); return; }
    } catch {}
    setAddress(`Lat ${lat}, Lng ${lng}`);
  }

  function acquireGPS(onSuccess: (lat: string, lng: string, acc: number) => void, onError: () => void) {
    let best: GeolocationPosition | null = null;
    let watchId: number | null = null;
    const stop   = () => { if (watchId !== null) { navigator.geolocation.clearWatch(watchId); watchId = null; } };
    const finish = () => { if (!best) { onError(); return; } onSuccess(best.coords.latitude.toFixed(6), best.coords.longitude.toFixed(6), best.coords.accuracy); };
    const timer  = setTimeout(() => { stop(); finish(); }, 12000);
    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (!best || pos.coords.accuracy < best.coords.accuracy) best = pos;
        if (pos.coords.accuracy <= 15) { clearTimeout(timer); stop(); finish(); }
      },
      () => { clearTimeout(timer); stop(); onError(); },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  }

  useEffect(() => {
    setLocationStatus("loading");
    acquireGPS(async (lat, lng, acc) => {
      setLocation(`${lat}, ${lng}`); setGpsAccuracy(acc); setLocationStatus("ok");
      await reverseGeocode(lat, lng);
    }, () => setLocationStatus("error"));
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) { setFileName(file.name); setFileObject(file); setUploadProgress("idle"); }
    else       { setFileName(null); setFileObject(null); }
  }

  async function uploadEvidence(file: File): Promise<{ url: string | null; errorMsg: string | null }> {
    setUploadProgress("uploading");
    const safeName   = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const ext        = safeName.split(".").pop() ?? "bin";
    const uniqueName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const filePath   = `evidence/${uniqueName}`;
    const { error }  = await supabase.storage.from("reports-evidence").upload(filePath, file, { cacheControl: "3600", upsert: false, contentType: file.type || "application/octet-stream" });
    if (error) {
      setUploadProgress("error");
      let msg = `Upload failed: ${error.message}`;
      if (error.message?.includes("Bucket not found")) msg = 'Storage bucket "reports-evidence" not found.';
      else if (error.message?.includes("policy"))      msg = "Upload blocked by storage security policy.";
      else if (error.message?.includes("too large"))   msg = "File is too large.";
      return { url: null, errorMsg: msg };
    }
    const { data } = supabase.storage.from("reports-evidence").getPublicUrl(filePath);
    setUploadProgress("done");
    return { url: data?.publicUrl ?? null, errorMsg: null };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agreed || !selectedType) return;
    setSubmitting(true); setSubmitError(null);
    const { data: { user } } = await supabase.auth.getUser();
    let evidenceUrl: string | null = null;
    if (fileObject) {
      const { url, errorMsg } = await uploadEvidence(fileObject);
      if (!url) { setSubmitError(errorMsg ?? "Evidence upload failed."); setSubmitting(false); return; }
      evidenceUrl = url;
    }
    const { data: inserted, error } = await supabase.from("reports").insert({
      type: selectedType, description: description.trim() || null,
      location: location || null, address: address || null,
      reporter_name: reporterName.trim() || null,
      reporter_contact: reporterContact.trim() || null,
      status: "pending", user_id: user?.id ?? null,
      responder_id: null, evidence_url: evidenceUrl,
    }).select("id").single();
    if (error) { setSubmitError("Failed to submit report. Please try again."); setSubmitting(false); return; }
    setSubmitting(false);
    // ✅ Store the new report ID so we can link directly to it
    setSubmittedId(inserted?.id ?? null);
    setSubmitted(true);
  }

  useEffect(() => {
    if (agreed && selectedType)                                    setCurrentStep(5);
    else if (fileName)                                             setCurrentStep(4);
    else if (description.trim())                                   setCurrentStep(3);
    else if (locationStatus === "ok" || locationStatus !== "idle") setCurrentStep(2);
    else if (selectedType)                                         setCurrentStep(1);
    else                                                           setCurrentStep(0);
  }, [selectedType, locationStatus, fileName, agreed, description]);

  function gpsValue() {
    if (locationStatus === "loading") return "Acquiring location — please wait…";
    if (locationStatus === "error")   return "Location unavailable — GPS access denied or timed out";
    if (locationStatus === "ok") {
      if (address) return address;
      if (location) return `Resolving address… (${location})`;
    }
    return "";
  }

  function resetForm() {
    setSubmitted(false); setSubmittedId(null); setSelectedType(null); setDescription("");
    setReporterName(""); setReporterContact(""); setFileName(null);
    setFileObject(null); setAgreed(false); setUploadProgress("idle");
  }

  // ── Success screen ──
  if (submitted) {
    return (
      <>
        <style>{CSS}</style>
        <div className="cr-root">
          <div className="cr-bg" style={{ backgroundImage: `url(${pagesBackground})` }} />
          <div className="cr-glow"><div className="cr-glow-a" /><div className="cr-glow-b" /></div>
          <div className="cr-inner cr-inner--center">
            <div className="cr-success">
              <div className="cr-success-icon">✓</div>
              <h2 className="cr-success-title">Report Submitted</h2>
              <p className="cr-success-sub">
                Your incident report has been received and is now visible to
                responders. Authorities have been notified and will respond
                shortly. Keep your phone nearby for follow-up.
              </p>

              {/* ✅ TWO CARDS SIDE BY SIDE */}
              <div className="cr-success-cards">

                {/* Card 1 — Submit another */}
                <div className="cr-success-card">
                  <div className="cr-success-card-icon">📝</div>
                  <div className="cr-success-card-title">Submit Another Report</div>
                  <p className="cr-success-card-text">
                    Report another incident to help keep your community safe.
                  </p>
                  <button className="cr-success-btn" onClick={resetForm}>
                    Submit Another Report →
                  </button>
                </div>

                {/* Card 2 — Track this report */}
                <div className="cr-success-card cr-success-card--track">
                  <div className="cr-success-card-icon">📍</div>
                  <div className="cr-success-card-title">Track My Report</div>
                  <p className="cr-success-card-text">
                    Monitor your report status and see responder updates in
                    real-time as authorities investigate your incident.
                  </p>
                  <button
                    className="cr-success-btn cr-success-btn--track"
                    onClick={() =>
                      submittedId
                        ? navigate(`/citizen/history/${submittedId}`)
                        : navigate("/citizen/history")
                    }
                  >
                    Track Incident Report →
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="cr-root">
        <div className="cr-bg" style={{ backgroundImage: `url(${pagesBackground})` }} />
        <div className="cr-glow"><div className="cr-glow-a" /><div className="cr-glow-b" /></div>

        <div className="cr-inner">

          {/* ── Hero ── */}
          <section className="cr-hero">
            <div className="cr-hero-tag">
              <span className="cr-hero-dot" />
              Reporting a live incident
            </div>
            <h1 className="cr-hero-heading">Report an <em>Incident</em></h1>
            <p className="cr-hero-sub">
              Submit a report to alert local responders. Provide accurate details
              so the right team can act fast.
            </p>
          </section>

          {/* ── Tracking banner ── */}
          <div className="cr-banner">
            <div className="cr-banner-icon">📍</div>
            <div className="cr-banner-body">
              <div className="cr-banner-title">Track Your Report in Real-Time</div>
              <p className="cr-banner-text">
                Monitor your report status and receive updates as authorities respond.{" "}
                <strong>Check My Reports in the sidebar to view all your submissions.</strong>
              </p>
            </div>
            <button className="cr-banner-btn" onClick={() => navigate("/citizen/history")}>
              View My Reports →
            </button>
          </div>

          {/* ── Step progress ── */}
          <div className="cr-steps">
            {STEPS.map((step, i) => (
              <div
                key={step}
                className={`cr-step${i <= currentStep ? " cr-step--done" : ""}${i === currentStep ? " cr-step--active" : ""}`}
              >
                <div className="cr-step-dot">{i < currentStep ? "✓" : i + 1}</div>
                <span className="cr-step-label">{step}</span>
                {i < STEPS.length - 1 && <div className="cr-step-line" />}
              </div>
            ))}
          </div>

          <div className="cr-layout">

            {/* ── Form ── */}
            <form className="cr-form" onSubmit={handleSubmit} noValidate>

              {/* Step 1 — Type */}
              <div className="cr-card">
                <div className="cr-card-label"><span className="cr-step-badge">01</span>Incident Type</div>
                <div className="cr-type-grid">
                  {INCIDENT_TYPES.map(type => (
                    <button
                      key={type.value} type="button"
                      className={`cr-type-btn${selectedType === type.value ? " active" : ""}`}
                      style={{ "--ta": type.accent, "--td": `${type.accent}18`, "--tr": type.rgb } as React.CSSProperties}
                      onClick={() => setSelectedType(type.value)}
                    >
                      <span className="cr-type-icon">{type.icon}</span>
                      <span className="cr-type-label">{type.label}</span>
                    </button>
                  ))}
                </div>
                {selectedType && (
                  <div
                    className="cr-type-confirm"
                    style={{ "--ta": activeType?.accent, "--td": `${activeType?.accent}18` } as React.CSSProperties}
                  >
                    <span>{activeType?.icon}</span><span>{activeType?.label} selected</span>
                  </div>
                )}
              </div>

              {/* Step 2 — Reporter Info */}
              <div className="cr-card">
                <div className="cr-card-label"><span className="cr-step-badge">02</span>Reporter Information</div>
                <div className="cr-fields">
                  <div className="cr-field">
                    <label className="cr-label">Full Name <span className="cr-optional">(Optional)</span></label>
                    <input className="cr-input" type="text" placeholder="e.g. Juan dela Cruz"
                      value={reporterName} onChange={e => setReporterName(e.target.value)} />
                  </div>
                  <div className="cr-field">
                    <label className="cr-label">Contact Number <span className="cr-optional">(Optional)</span></label>
                    <input className="cr-input" type="tel" placeholder="+63 9XX XXX XXXX"
                      value={reporterContact} onChange={e => setReporterContact(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Step 3 — Location */}
              <div className="cr-card">
                <div className="cr-card-label"><span className="cr-step-badge">03</span>Your Location</div>
                <div className="cr-field">
                  <label className="cr-label">Detected Location</label>
                  <div className="cr-loc-row">
                    <div className="cr-loc-wrap">
                      <span className="cr-loc-dot" data-status={locationStatus} />
                      <input
                        className="cr-input cr-input--loc cr-input--readonly"
                        type="text" readOnly
                        value={gpsValue()}
                        placeholder="Waiting for GPS…"
                      />
                    </div>
                    <button type="button" className="cr-gps-btn" onClick={() => {
                      setLocationStatus("loading"); setAddress(null); setGpsAccuracy(null);
                      acquireGPS(async (lat, lng, acc) => {
                        setLocation(`${lat}, ${lng}`); setGpsAccuracy(acc); setLocationStatus("ok");
                        await reverseGeocode(lat, lng);
                      }, () => setLocationStatus("error"));
                    }}>📍 Refresh GPS</button>
                  </div>

                  {locationStatus === "ok" && location && (
                    <div className="cr-coords-badge">
                      <span className="cr-coords-text">🌐 {location}</span>
                      {address && (
                        <a href={`https://www.google.com/maps?q=${location}`} target="_blank" rel="noopener noreferrer" className="cr-maps-link">
                          Verify on Maps →
                        </a>
                      )}
                    </div>
                  )}
                  {locationStatus === "loading" && (
                    <div className="cr-gps-acquiring">
                      <span className="cr-gps-pulse" />
                      Searching for GPS signal — keep your device still and outdoors.
                    </div>
                  )}
                  {locationStatus === "error" && (
                    <p className="cr-hint cr-hint--warn">
                      ⚠️ Location access was denied or timed out. Allow location access and tap <strong>Refresh GPS</strong>.
                    </p>
                  )}
                  {locationStatus === "ok" && (
                    <>
                      <div className="cr-acc-badges">
                        {gpsAccuracy !== null && (
                          <span className={`cr-acc-badge ${gpsAccuracy <= 20 ? "acc-great" : gpsAccuracy <= 100 ? "acc-ok" : "acc-poor"}`}>
                            {gpsAccuracy <= 20 ? "✓ High accuracy" : gpsAccuracy <= 100 ? "~ Medium accuracy" : "⚠ Low accuracy"} (±{Math.round(gpsAccuracy)}m)
                          </span>
                        )}
                        {gpsAccuracy !== null && gpsAccuracy > 100 && (
                          <span className="cr-acc-tip">Move outdoors for better accuracy</span>
                        )}
                      </div>
                      <p className="cr-hint cr-hint--warn">
                        ⚠️ If the location looks wrong, tap <strong>Refresh GPS</strong> to try again.
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Step 4 — Description */}
              <div className="cr-card">
                <div className="cr-card-label"><span className="cr-step-badge">04</span>Incident Details</div>
                <div className="cr-field">
                  <label className="cr-label">Detailed Description</label>
                  <textarea
                    className="cr-textarea" rows={5}
                    placeholder="Describe what happened — include time, number of people involved, severity, and any other relevant details…"
                    value={description} onChange={e => setDescription(e.target.value)} required
                  />
                </div>
              </div>

              {/* Step 5 — Evidence */}
              <div className="cr-card">
                <div className="cr-card-label">
                  <span className="cr-step-badge">05</span>Upload Evidence
                  <span className="cr-optional">(optional)</span>
                </div>
                <div
                  className="cr-dropzone"
                  onClick={() => fileRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file && fileRef.current) {
                      const dt = new DataTransfer(); dt.items.add(file);
                      fileRef.current.files = dt.files;
                      setFileName(file.name); setFileObject(file); setUploadProgress("idle");
                    }
                  }}
                >
                  <input ref={fileRef} type="file" accept="image/*,video/*"
                    style={{ display: "none" }} onChange={handleFileChange} />
                  {fileName
                    ? (<><span className="cr-dropzone-icon">📎</span><span className="cr-dropzone-name">{fileName}</span><span className="cr-dropzone-change">Click to change</span></>)
                    : (<><span className="cr-dropzone-icon">📤</span><span className="cr-dropzone-text">Click to select or drag & drop</span><span className="cr-dropzone-hint">Photos or videos accepted</span></>)
                  }
                </div>
                {uploadProgress === "uploading" && <div className="cr-upload-status cr-upload--uploading">⏳ Uploading evidence…</div>}
                {uploadProgress === "done"      && <div className="cr-upload-status cr-upload--done">✅ Evidence uploaded successfully</div>}
                {uploadProgress === "error"     && <div className="cr-upload-status cr-upload--error">❌ Upload failed — please try again</div>}
              </div>

              {/* Disclaimer */}
              <div className="cr-disclaimer">
                <div className="cr-disclaimer-header">
                  <span style={{ fontSize: 16 }}>⚖️</span>
                  <span className="cr-disclaimer-title">Legal Acknowledgment</span>
                </div>
                <p className="cr-disclaimer-summary">
                  By submitting this report, you confirm that the information provided is true and accurate to the best of your knowledge.
                </p>
                <label className="cr-check-row">
                  <input type="checkbox" className="cr-checkbox-hidden" checked={agreed} onChange={e => setAgreed(e.target.checked)} required />
                  <div className="cr-checkbox-box">{agreed && "✓"}</div>
                  <span className="cr-check-text">
                    I understand that submitting <strong>false, misleading, or malicious reports</strong> is punishable under the{" "}
                    <strong>Cybercrime Prevention Act of 2012 (RA 10175)</strong>, the <strong>Penal Code</strong>, and other applicable
                    Philippine laws. Penalties may include fines and imprisonment.
                  </span>
                </label>
              </div>

              {submitError && (
                <div className="cr-error">
                  <div>⚠️ {submitError}</div>
                  {uploadProgress === "error" && (
                    <button type="button" className="cr-skip-btn" onClick={() => {
                      setFileObject(null); setFileName(null); setUploadProgress("idle"); setSubmitError(null);
                    }}>
                      Remove evidence and submit without it →
                    </button>
                  )}
                </div>
              )}

              <button type="submit" className="cr-submit" disabled={!agreed || !selectedType || submitting}>
                {submitting
                  ? (<><span className="cr-spinner" /><span>Submitting…</span></>)
                  : (<><span>Submit Incident Report</span><span className="cr-submit-arrow">→</span></>)
                }
              </button>
            </form>

            {/* ── Sidebar ── */}
            <div className="cr-sidebar">
              <div className="cr-sidebar-card">
                <div className="cr-sidebar-title">Emergency Hotlines</div>
                <div className="cr-hotlines">
                  {EMERGENCY_HOTLINES.map(h => (
                    <a key={h.number} href={`tel:${h.number}`} className="cr-hotline"
                      style={{ "--hc": h.color } as React.CSSProperties}>
                      <span className="cr-hotline-icon">{h.icon}</span>
                      <div className="cr-hotline-info">
                        <span className="cr-hotline-label">{h.label}</span>
                        <span className="cr-hotline-number">{h.number}</span>
                      </div>
                      <span className="cr-hotline-call">Call →</span>
                    </a>
                  ))}
                </div>
              </div>

              <div className="cr-sidebar-card cr-sidebar-card--warn">
                <div className="cr-sidebar-title">⚠️ Emergency Reminder</div>
                <p className="cr-sidebar-text">
                  If someone is in immediate danger, call emergency services directly. Do not rely solely on this form in life-threatening situations.
                </p>
              </div>

              <div className="cr-sidebar-card cr-sidebar-card--info">
                <div className="cr-sidebar-title">🛡️ Your Safety Matters</div>
                <p className="cr-sidebar-text">
                  Your identity and contact information are kept strictly confidential. You may submit anonymously if preferred.
                </p>
              </div>

              <div className="cr-sidebar-card cr-sidebar-card--track">
                <div className="cr-sidebar-title">📍 Track Your Report</div>
                <p className="cr-sidebar-text">
                  View all your submitted reports and track their status in real-time as authorities respond and investigate.
                </p>
                <button className="cr-track-btn" onClick={() => navigate("/citizen/history")}>
                  View My Reports →
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}