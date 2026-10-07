import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import CameraCaptureModal from "../components/CameraCaptureModal";
import { useNavigate } from "react-router-dom";
import pagesBackground from "../assets/pagesbackground.png";
import { supabase } from "../js/supabase";
import { getDepartmentForType, getDepartmentCodeForType } from "../js/departments";

const INCIDENT_TYPES = [
  { value: "fire",     label: "Fire Incident",    icon: "🔥", accent: "#FF6B6B", rgb: "255,107,107" },
  { value: "accident", label: "Road Accident",     icon: "🚗", accent: "#FFD166", rgb: "255,209,102" },
  { value: "flood",    label: "Flood",             icon: "🌊", accent: "#7B9EFF", rgb: "123,158,255" },
  { value: "crime",    label: "Crime",             icon: "🚨", accent: "#FF9F43", rgb: "255,159,67"  },
  { value: "medical",  label: "Medical Emergency", icon: "🏥", accent: "#2ECC8F", rgb: "46,204,143"  },
  { value: "other",    label: "Other",             icon: "⚠️", accent: "#8fa3be", rgb: "143,163,190" },
];

const EMERGENCY_HOTLINES = [
  { label: "BFP",    number: "422-2022", icon: "🔥", color: "var(--c-fire)" },
  { label: "CDRRMO", number: "422-3008", icon: "🌀", color: "var(--c-pending)" },
  { label: "PNP",    number: "422-8708", icon: "👮", color: "var(--c-progress)" },
  { label: "PDRRMO", number: "422-3006", icon: "🏥", color: "var(--c-resolved)" },
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
    /* bg-slate-950/85 + gradient to match Directory page theme seamlessly */
    background: linear-gradient(180deg, rgba(2,6,23,0.88) 0%, rgba(2,6,23,0.80) 40%, rgba(2,6,23,0.92) 80%, rgba(2,6,23,0.98) 100%);
    backdrop-filter: blur(1px); -webkit-backdrop-filter: blur(1px);
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

  .cr-hero { margin-top: 12px; margin-bottom: 28px; }
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
    font-family: var(--font-display);
    font-size: clamp(30px, 5vw, 58px);
    font-weight: 900; line-height: 1.0;
    letter-spacing: -.035em; color: #FFFFFF; margin-bottom: 12px;
  }
  .cr-hero-heading em { font-style: normal; color: #FF6B6B; }
  .cr-hero-sub {
    font-size: 14px; font-weight: 400;
    color: #D1D5DB;
    max-width: 480px; line-height: 1.7;
  }

  .cr-banner {
    display: flex; align-items: center; gap: 14px;
    background: rgba(46,204,143,.08);
    border: 1px solid rgba(46,204,143,.30);
    border-radius: 14px; padding: 14px 18px;
    margin-bottom: 24px;
    backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  }
  .cr-banner-icon { font-size: 22px; flex-shrink: 0; }
  .cr-banner-body { flex: 1; }
  .cr-banner-title {
    font-family: var(--font-display);
    font-size: 13px; font-weight: 800; letter-spacing: -.01em;
    color: #34D399; margin-bottom: 3px;
  }
  .cr-banner-text {
    font-size: 12px; font-weight: 400;
    color: #D1D5DB; line-height: 1.5;
  }
  .cr-banner-text strong { color: #6EE7B7; font-weight: 600; }
  .cr-banner-btn {
    flex-shrink: 0; display: inline-flex; align-items: center;
    font-size: 12px; font-weight: 600;
    color: #34D399; background: rgba(46,204,143,.15);
    border: 1px solid rgba(46,204,143,.35); border-radius: 8px;
    padding: 8px 14px; white-space: nowrap; cursor: pointer;
    transition: background .18s, transform .18s;
  }
  .cr-banner-btn:hover { background: rgba(46,204,143,.25); transform: translateY(-1px); }

  .cr-steps {
    display: flex; align-items: center;
    background: rgba(15,21,33,.90); backdrop-filter: blur(16px);
    border: 1px solid rgba(255,255,255,.10); border-radius: 14px;
    padding: 14px 18px; margin-bottom: 28px;
    overflow-x: auto; scrollbar-width: none; flex-wrap: nowrap;
    -webkit-mask-image: linear-gradient(to right, black 85%, transparent 100%);
    mask-image: linear-gradient(to right, black 85%, transparent 100%);
  }
  .cr-steps::-webkit-scrollbar { display: none; }
  .cr-step { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
  .cr-step-dot {
    width: 24px; height: 24px; border-radius: 50%;
    border: 1px solid rgba(255,255,255,.15); background: rgba(255,255,255,.06);
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 600; color: #FFFFFF;
    transition: all .3s; flex-shrink: 0;
  }
  .cr-step--done .cr-step-dot   { background: rgba(46,204,143,.20); border-color: #34D399; color: #34D399; }
  .cr-step--active .cr-step-dot { background: rgba(255,107,107,.20); border-color: #FF6B6B; color: #FF6B6B; box-shadow: 0 0 8px rgba(255,107,107,.28); }
  .cr-step-label {
    font-size: 11px; font-weight: 600; color: #D1D5DB;
    white-space: nowrap; transition: color .3s;
  }
  .cr-step--done .cr-step-label   { color: #34D399; }
  .cr-step--active .cr-step-label { color: #FF6B6B; }
  .cr-step-line { width: 18px; height: 1px; background: rgba(255,255,255,.10); margin: 0 6px; flex-shrink: 0; }

  .cr-layout { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px; align-items: start; }
  /* lg:grid-cols-3 with main lg:col-span-2 + sidebar lg:col-span-1 — matches Directory 2-col aesthetic */
  .cr-form { grid-column: span 2 / span 2; display: flex; flex-direction: column; gap: 14px; min-width: 0; }
  .cr-card {
    background: var(--citizen-card); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
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
    font-family: var(--font-display);
    font-size: 14px; font-weight: 800; letter-spacing: -.02em;
    color: #FFFFFF; display: flex; align-items: center; gap: 10px;
  }
  .cr-step-badge {
    font-size: 9.5px; font-weight: 700; letter-spacing: .12em;
    color: #D1D5DB;
    border: 1px solid rgba(255,255,255,.15);
    border-radius: 4px; padding: 2px 7px;
  }
  .cr-optional { font-size: 11px; font-weight: 400; color: #9CA3AF; margin-left: 4px; }

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
  .cr-type-label { font-size: 11px; font-weight: 500; color: #D1D5DB; text-align: center; line-height: 1.3; }
  .cr-type-confirm {
    display: flex; align-items: center; gap: 8px;
    font-size: 12px; font-weight: 600;
    color: #34D399; background: rgba(46,204,143,.15);
    border: 1px solid rgba(46,204,143,.30); border-radius: 8px; padding: 8px 14px;
    animation: cr-up .28s ease both;
  }

  .cr-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .cr-field { display: flex; flex-direction: column; gap: 7px; }
  .cr-label {
    font-size: 10px; font-weight: 600; letter-spacing: .16em; text-transform: uppercase;
    color: #9CA3AF;
  }
  .cr-input {
    background: rgba(8,12,20,.85); border: 1px solid rgba(255,255,255,.12);
    border-radius: 9px; padding: 11px 13px;
    font-family: 'Instrument Sans', sans-serif;
    font-size: 13px; font-weight: 400; color: #FFFFFF;
    outline: none; width: 100%; transition: border-color .18s, background .18s;
    caret-color: #2ECC8F;
  }
  .cr-input::placeholder { color: #6B7280; }
  .cr-input:focus { border-color: rgba(46,204,143,.50); background: rgba(46,204,143,.06); box-shadow: 0 0 12px rgba(46,204,143,.15); }
  .cr-input--readonly:focus { border-color: rgba(255,255,255,.15); background: rgba(8,12,20,.85); box-shadow: none; }
  .cr-textarea {
    background: rgba(8,12,20,.85); border: 1px solid rgba(255,255,255,.12);
    border-radius: 9px; padding: 11px 13px;
    font-family: 'Instrument Sans', sans-serif;
    font-size: 13px; font-weight: 400; color: #FFFFFF;
    outline: none; width: 100%; resize: vertical; line-height: 1.65;
    transition: border-color .18s; caret-color: #2ECC8F;
  }
  .cr-textarea::placeholder { color: #6B7280; }
  .cr-textarea:focus { border-color: rgba(46,204,143,.50); background: rgba(46,204,143,.06); box-shadow: 0 0 12px rgba(46,204,143,.15); }

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
  .cr-coords-text { font-size: 11px; color: #9CA3AF; font-variant-numeric: tabular-nums; flex: 1; }
  .cr-maps-link {
    font-size: 11px; font-weight: 600; color: #34D399;
    text-decoration: none; white-space: nowrap; transition: opacity .18s;
  }
  .cr-maps-link:hover { opacity: .7; }
  .cr-gps-acquiring {
    display: flex; align-items: center; gap: 9px;
    font-size: 12px; color: #FBBF24; line-height: 1.5;
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
  .acc-ip    { background: rgba(123,158,255,.10); color: #7B9EFF; border: 1px solid rgba(123,158,255,.22); }
  .cr-acc-tip { font-size: 11px; color: #F87171; }
  .cr-hint { font-size: 12px; color: #9CA3AF; line-height: 1.5; }
  .cr-hint--warn { font-size: 11px; color: #FBBF24; }

  .cr-dropzone {
    border: 1px dashed rgba(255,255,255,.15); border-radius: 12px;
    padding: 28px 20px; display: flex; flex-direction: column; align-items: center; gap: 6px;
    cursor: pointer; transition: border-color .2s, background .2s; text-align: center;
  }
  .cr-dropzone:hover { border-color: rgba(46,204,143,.40); background: rgba(46,204,143,.05); }
  .cr-dropzone-icon { font-size: 24px; }
  .cr-dropzone-text { font-size: 13px; font-weight: 400; color: #D1D5DB; }
  .cr-dropzone-name { font-size: 13px; font-weight: 600; color: #34D399; }
  .cr-dropzone-hint, .cr-dropzone-change { font-size: 11px; color: #9CA3AF; }
  .cr-upload-status { font-size: 12px; font-weight: 500; padding: 8px 12px; border-radius: 8px; }
  .cr-upload--uploading { background: rgba(255,209,102,.08); color: #FFD166; border: 1px solid rgba(255,209,102,.20); }
  .cr-upload--done      { background: rgba(46,204,143,.08);  color: #2ECC8F; border: 1px solid rgba(46,204,143,.20); }
  .cr-upload--error     { background: rgba(255,107,107,.08); color: #FF6B6B; border: 1px solid rgba(255,107,107,.20); }

  .cr-disclaimer {
    background: var(--clr-yellow-bg); border: 1px solid var(--clr-yellow-border);
    border-radius: 14px; padding: 16px 18px;
    display: flex; flex-direction: column; gap: 12px;
    animation: cr-up .5s ease .24s both;
  }
  .cr-disclaimer-header { display: flex; align-items: center; gap: 8px; }
  .cr-disclaimer-title {
    font-family: var(--font-display);
    font-size: 11px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase;
    color: var(--c-pending);
  }
  .cr-disclaimer-summary { font-size: 12px; color: var(--citizen-body); line-height: 1.55; }
  .cr-legal-notice {
    display: flex; align-items: flex-start; gap: 10px;
    background: var(--clr-yellow-bg);
    border: 1px solid var(--clr-yellow-border);
    border-radius: 10px; padding: 10px 12px;
  }
  .cr-legal-notice-badge {
    flex-shrink: 0; font-size: 10px; font-weight: 800; letter-spacing: .08em;
    color: var(--c-pending);
    background: var(--clr-yellow-bg);
    border: 1px solid var(--clr-yellow-border); border-radius: 6px;
    padding: 3px 7px; text-transform: uppercase; line-height: 1;
  }
  .cr-legal-notice-text { font-size: 11px; color: var(--citizen-body); line-height: 1.6; }
  .cr-legal-notice-text strong { color: var(--c-pending); font-weight: 700; }
  .cr-check-row { display: flex; align-items: flex-start; gap: 12px; cursor: pointer; }
  .cr-checkbox-hidden { display: none; }
  .cr-checkbox-box {
    width: 18px; height: 18px; flex-shrink: 0;
    border: 1px solid var(--clr-yellow-border); border-radius: 5px;
    background: var(--clr-yellow-bg);
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700; color: var(--c-pending); margin-top: 1px;
    transition: all .2s;
  }
  .cr-check-text {
    font-size: 12px; font-weight: 400; color: var(--citizen-body); line-height: 1.65;
  }
  .cr-check-text strong { font-weight: 600; color: var(--c-pending); }

  .cr-error {
    background: var(--clr-red-bg); border: 1px solid var(--clr-red-border);
    border-radius: 10px; padding: 12px 16px;
    font-size: 13px; color: var(--clr-red); animation: cr-up .28s ease both;
  }
  .cr-skip-btn {
    display: inline-block; margin-top: 8px; padding: 7px 14px;
    background: var(--clr-red-bg); border: 1px solid var(--clr-red-border);
    border-radius: 7px; font-size: 12px; font-weight: 600;
    color: var(--clr-red); cursor: pointer; transition: background .18s;
  }
  .cr-skip-btn:hover { background: var(--clr-red-bg); }

  .cr-submit {
    display: flex; align-items: center; justify-content: center; gap: 10px;
    width: 100%; padding: 15px 24px;
    font-family: var(--font-display);
    font-size: 14px; font-weight: 900; letter-spacing: .04em; text-transform: uppercase;
    color: #080c14; background: #2ECC8F;
    border: none; border-radius: 12px; cursor: pointer;
    transition: opacity .2s, transform .2s, background .2s;
    animation: cr-up .5s ease .28s both;
    position: relative; z-index: 20; pointer-events: auto;
  }
  .cr-submit:hover:not(:disabled) { background: #38e09e; transform: translateY(-2px); }
  .cr-submit:active:not(:disabled) { transform: translateY(0); background: #27b885; }
  .cr-submit:disabled { opacity: .28; cursor: not-allowed; background: rgba(255,255,255,.04); color: #9CA3AF; pointer-events: auto; }
  .cr-submit-arrow { font-size: 17px; transition: transform .2s; }
  .cr-submit:hover:not(:disabled) .cr-submit-arrow { transform: translateX(4px); }
  .cr-spinner {
    display: inline-block; width: 14px; height: 14px;
    border: 2px solid rgba(8,12,20,.3); border-top-color: #080c14;
    border-radius: 50%; animation: cr-spin .75s linear infinite;
  }
  @keyframes cr-spin { to { transform: rotate(360deg); } }

  .cr-sidebar { grid-column: span 1 / span 1; display: flex; flex-direction: column; gap: 12px; position: sticky; top: 72px; animation: cr-up .5s ease .08s both; min-width: 0; }
  .cr-sidebar-card {
    background: var(--citizen-card);
    backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
    border: 1px solid var(--clr-border);
    border-radius: 16px; /* rounded-xl */
    padding: 16px; display: flex; flex-direction: column; gap: 10px;
    overflow: hidden; /* contain children */
    box-shadow: var(--cd-card-shadow);
  }
  .cr-sidebar-card--warn  { border-color: var(--clr-yellow-border); }
  .cr-sidebar-card--info  { border-color: var(--clr-blue-border); }
  .cr-sidebar-card--track { border-color: var(--clr-green-border); }
  .cr-sidebar-title {
    font-family: var(--font-display);
    font-size: 12px; font-weight: 800; letter-spacing: .05em; text-transform: uppercase;
    color: var(--clr-text);
  }
  .cr-sidebar-text { font-size: 12px; font-weight: 400; color: var(--clr-text-muted); line-height: 1.65; }
  .cr-track-btn {
    display: inline-flex; align-items: center;
    font-size: 12px; font-weight: 600;
    color: var(--clr-green); background: var(--clr-green-bg);
    border: 1px solid var(--clr-green-border); border-radius: 8px;
    padding: 8px 12px; cursor: pointer; width: fit-content;
    transition: background .18s, border-color .18s;
  }
  .cr-track-btn:hover { background: rgba(46,204,143,.22); border-color: rgba(46,204,143,.40); }

  .cr-hotlines { display: flex; flex-direction: column; gap: 8px; }
  .cr-hotline {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px;
    background: var(--clr-surface-2); border: 1px solid var(--clr-border); border-radius: 10px;
    text-decoration: none; transition: background .2s, border-color .2s; min-height: 44px;
  }
  .cr-hotline:hover { background: var(--clr-surface-3); border-color: var(--hc); }
  .cr-hotline-icon { font-size: 15px; }
  .cr-hotline-info { display: flex; flex-direction: column; flex: 1; }
  .cr-hotline-label { font-size: 9.5px; font-weight: 600; letter-spacing: .10em; text-transform: uppercase; color: var(--clr-text-muted); }
  .cr-hotline-number { font-family: var(--font-display); font-size: 14px; font-weight: 800; color: var(--clr-text); }
  .cr-hotline-call { font-size: 11px; font-weight: 700; color: var(--hc, var(--clr-green)); opacity: .9; }

  .cr-success {
    display: flex; flex-direction: column; align-items: center; text-align: center;
    padding: 60px 24px; animation: cr-up .5s ease both;
  }
  .cr-success-icon {
    width: 64px; height: 64px; border-radius: 50%;
    background: var(--clr-green-bg); border: 1px solid var(--clr-green-border);
    display: flex; align-items: center; justify-content: center;
    font-size: 26px; color: var(--clr-green); margin-bottom: 22px;
  }
  .cr-success-title {
    font-family: var(--font-display);
    font-size: 32px; font-weight: 900; letter-spacing: -.03em; color: var(--clr-text); margin-bottom: 12px;
  }
  .cr-success-sub {
    font-size: 14px; font-weight: 400; color: var(--clr-text-muted);
    max-width: 460px; line-height: 1.68; margin-bottom: 28px;
  }
  .cr-success-cards {
    display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;
    width: 100%; max-width: 780px;
  }
  .cr-success-card {
    background: var(--citizen-card); backdrop-filter: blur(16px);
    border: 1px solid var(--clr-border); border-radius: 18px;
    padding: 24px 20px; flex: 1; min-width: 260px; max-width: 360px;
    display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center;
    animation: cr-up .5s ease .1s both; box-shadow: var(--cd-card-shadow);
  }
  .cr-success-card--track {
    background: rgba(46,204,143,.04);
    border-color: rgba(46,204,143,.18);
    animation-delay: .18s;
  }
  .cr-success-card-icon { font-size: 30px; }
  .cr-success-card-title { font-family: var(--font-display); font-size: 15px; font-weight: 800; color: var(--clr-text); }
  .cr-success-card-text { font-size: 12px; color: var(--clr-text-muted); line-height: 1.55; }
  .cr-success-btn {
    margin-top: 4px; display: inline-flex; align-items: center;
    font-size: 13px; font-weight: 600;
    color: var(--clr-green); background: var(--clr-green-bg);
    border: 1px solid var(--clr-green-border); border-radius: 9px;
    padding: 10px 18px; cursor: pointer; min-height: 40px;
    transition: background .18s, border-color .18s;
  }
  .cr-success-btn:hover { background: rgba(46,204,143,.15); border-color: rgba(46,204,143,.38); }
  .cr-success-btn--track {
    color: #eef0f7; background: #2ECC8F;
    border-color: #2ECC8F;
  }
  .cr-success-btn--track:hover { background: #38e09e; border-color: #38e09e; color: #060a10; }

  @media (max-width: 860px) {
    .cr-layout { grid-template-columns: 1fr; }
    .cr-form, .cr-sidebar { grid-column: span 1 / span 1; }
    .cr-sidebar { position: static; }
    .cr-hotlines { flex-direction: row; flex-wrap: wrap; }
    .cr-hotline { flex: 1 1 calc(50% - 4px); }
    .cr-inner { padding: 0 16px 80px; }
    .cr-steps { -webkit-mask-image: none; mask-image: none; }
    .cr-success-cards { flex-direction: column; align-items: center; }
    .cr-banner { flex-direction: column; align-items: flex-start; gap: 12px; }
    .cr-banner-btn { width: 100%; justify-content: center; }
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

async function checkGeolocationPermission() {
  try {
    if ("permissions" in navigator) {
      const status = await navigator.permissions.query({ name: "geolocation" as PermissionName });
      return status.state;
    }
  } catch {}
  return "unknown" as PermissionState | "unknown";
}

async function ipGeolocationFallback(): Promise<{ lat: string; lng: string } | null> {
  try {
    const res  = await fetch("https://ipapi.co/json/");
    const data = await res.json();
    if (data?.latitude && data?.longitude) {
      return { lat: String(data.latitude), lng: String(data.longitude) };
    }
  } catch {}
  return null;
}

function acquireGPS(
  onSuccess: (lat: string, lng: string, acc: number) => void,
  onError:   () => void
) {
  if (!navigator.geolocation) { onError(); return; }

  let best:    GeolocationPosition | null = null;
  let watchId: number | null = null;
  let done     = false;

  const finish = () => {
    if (done) return;
    done = true;
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
    if (best) {
      onSuccess(
        best.coords.latitude.toFixed(6),
        best.coords.longitude.toFixed(6),
        best.coords.accuracy
      );
    } else {
      onError();
    }
  };

  const timer = setTimeout(finish, 25_000);

  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      if (!best || pos.coords.accuracy < best.coords.accuracy) best = pos;
      if (pos.coords.accuracy <= 15) { clearTimeout(timer); finish(); }
    },
    (err) => {
      if (err.code === err.PERMISSION_DENIED) { clearTimeout(timer); finish(); return; }
      if (best) { clearTimeout(timer); finish(); }
    },
    { enableHighAccuracy: true, timeout: 30_000, maximumAge: 0 }
  );
}

interface CitizenReportProps {
  onBack?: () => void;
  onViewHistory?: () => void;
  onViewReport?: (id: string) => void;
}

export default function CitizenReport({ onBack, onViewHistory, onViewReport }: CitizenReportProps = {}) {
  // Consumes the active Navbar/Header language — any selector change re-renders
  // this form and re-evaluates every t() call and language-aware helper below.
  const { language, t, tList } = useLanguage();
  void tList;
  const navigate = useNavigate();

  // Short "Refresh GPS" button label without the 📍 prefix (both languages
  // prefix the emoji, so stripping it is language-safe).
  const refreshShort = t("report.form.refreshGps", "📍 Refresh GPS").replace("📍 ", "");
  // Language-aware incident-type name (report.types.* in the dictionary).
  const typeName = (v: string | undefined) =>
    t(`report.types.${v}`, INCIDENT_TYPES.find(i => i.value === v)?.label ?? v ?? "");

  // Note: `onBack` is kept in props for modal callers (CitizenDashboard passes
  // it); in-page back navigation lives in the persistent CitizenLayout sidebar.
  const goHistory = () => (onViewHistory ? onViewHistory() : navigate("/citizen/history"));
  const goReport  = (id: string | null) =>
    onViewReport
      ? (id ? onViewReport(id) : goHistory())
      : (id ? navigate(`/citizen/history/${id}`) : navigate("/citizen/history"));

  const [location,        setLocation]        = useState("");
  const [address,         setAddress]         = useState<string | null>(null);
  const [locationStatus,  setLocationStatus]  = useState<"idle"|"loading"|"ok"|"error">("idle");
  const [locationSource,  setLocationSource]  = useState<"gps"|"ip"|null>(null);
  const [selectedType,    setSelectedType]    = useState<string | null>(null);
  const [agreed,          setAgreed]          = useState(false);
  // Compliance alias: isAgreed / setIsAgreed bound to Legal Acknowledgment checkbox
  const isAgreed = agreed;
  const setIsAgreed = setAgreed;
  void isAgreed; void setIsAgreed;
  const [submitted,       setSubmitted]       = useState(false);
  const [submittedId,     setSubmittedId]     = useState<string | null>(null);
  // Multi-file evidence attachments (uploads + camera captures).
  const [evidenceFiles,   setEvidenceFiles]   = useState<{ id: string; file: File; previewUrl: string }[]>([]);
  const [fileError,       setFileError]       = useState<string | null>(null);
  const [uploadState,     setUploadState]     = useState<{ done: number; total: number } | null>(null);
  const [uploadProgress,  setUploadProgress]  = useState<"idle"|"uploading"|"done"|"error">("idle");
  const [showCamera,      setShowCamera]      = useState(false);
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
      const res  = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=jsonv2&addressdetails=1`,
        { headers: { "Accept-Language": language === "tl" ? "fil" : "en" } }
      );
      const data = await res.json();
      if (data?.address) {
        const a = data.address;
        const parts: string[] = [];
        if (a.road)            parts.push(a.road);
        if (a.neighbourhood)   parts.push(a.neighbourhood);
        if (a.suburb)          parts.push(a.suburb);
        if (a.village)         parts.push(a.village);
        if (a.barangay)        parts.push(a.barangay);
        if (a.city || a.town || a.municipality)
          parts.push(a.city ?? a.town ?? a.municipality);
        if (a.state || a.province) parts.push(a.state ?? a.province);
        if (a.country) parts.push(a.country);
        const clean = [...new Set(parts)];
        if (clean.length) { setAddress(clean.join(", ")); return; }
      }
      if (data?.display_name) { setAddress(data.display_name); return; }
    } catch {}
    setAddress(`Lat ${lat}, Lng ${lng}`);
  }

  async function resolveLocation() {
    setLocationStatus("loading");
    setAddress(null);
    setGpsAccuracy(null);
    setLocationSource(null);

    const permState = await checkGeolocationPermission();

    if (permState === "denied") {
      const ip = await ipGeolocationFallback();
      if (ip) {
        setLocation(`${ip.lat}, ${ip.lng}`);
        setGpsAccuracy(null);
        setLocationSource("ip");
        setLocationStatus("ok");
        await reverseGeocode(ip.lat, ip.lng);
      } else {
        setLocationStatus("error");
      }
      return;
    }

    acquireGPS(
      async (lat, lng, acc) => {
        setLocation(`${lat}, ${lng}`);
        setGpsAccuracy(acc);
        setLocationSource("gps");
        setLocationStatus("ok");
        await reverseGeocode(lat, lng);
      },
      async () => {
        const ip = await ipGeolocationFallback();
        if (ip) {
          setLocation(`${ip.lat}, ${ip.lng}`);
          setGpsAccuracy(null);
          setLocationSource("ip");
          setLocationStatus("ok");
          await reverseGeocode(ip.lat, ip.lng);
        } else {
          setLocationStatus("error");
        }
      }
    );
  }

  useEffect(() => { resolveLocation(); }, []);

  const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB per image
  const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50MB per video
  const MAX_FILES = 5;

  const describeLimit = (maxMB: number) =>
    t("report.form.attachmentTooLarge", `File "{name}" is too large (max ${maxMB}MB).`);

  function addEvidenceFiles(incoming: FileList | File[]) {
    const list = Array.from(incoming);
    if (!list.length) return;
    setFileError(null);
    setUploadProgress("idle");
    setEvidenceFiles(prev => {
      const next = [...prev];
      for (const file of list) {
        if (next.length >= MAX_FILES) {
          setFileError(t("report.form.tooManyFiles", `Maximum ${MAX_FILES} files allowed.`));
          break;
        }
        const isVideo = file.type.startsWith("video/");
        const isImage = file.type.startsWith("image/");
        if (!isVideo && !isImage) continue;
        const limit = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
        if (file.size > limit) {
          setFileError(describeLimit(isVideo ? 50 : 10).replace("{name}", file.name));
          continue;
        }
        next.push({
          id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
          file,
          previewUrl: URL.createObjectURL(file),
        });
      }
      return next;
    });
  }

  function removeEvidenceFile(id: string) {
    setEvidenceFiles(prev => {
      const target = prev.find(f => f.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter(f => f.id !== id);
    });
    setUploadProgress("idle");
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) addEvidenceFiles(e.target.files);
    e.target.value = "";
  }

  async function uploadEvidence(file: File): Promise<{ url: string | null; errorMsg: string | null }> {
    const safeName   = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const ext        = safeName.split(".").pop() ?? "bin";
    const uniqueName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const filePath   = `evidence/${uniqueName}`;
    const { error }  = await supabase.storage
      .from("reports-evidence")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "application/octet-stream",
      });
    if (error) {
      let msg = `${t("report.uploadFailed", "Upload failed")}: ${error.message}`;
      if (error.message?.includes("Bucket not found"))  msg = t("report.form.bucketMissing", 'Storage bucket "reports-evidence" not found.');
      else if (error.message?.includes("policy"))       msg = t("report.form.uploadBlocked", "Upload blocked by storage security policy.");
      else if (error.message?.includes("too large"))    msg = t("report.form.uploadTooLarge", "File is too large.");
      return { url: null, errorMsg: msg };
    }
    const { data } = supabase.storage.from("reports-evidence").getPublicUrl(filePath);
    return { url: data?.publicUrl ?? null, errorMsg: null };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Debug verification per task: log submit attempt and formData to browser console (F12)
    console.log("Submit button clicked", {
      isAgreed: agreed,
      selectedType,
      reporterName,
      reporterContact,
      location,
      description: description.slice(0, 80),
      evidenceCount: evidenceFiles.length,
    });
    if (!agreed || !selectedType) {
      console.log("Submit blocked: validation failed", { agreed, selectedType });
      return;
    }
    setSubmitting(true);
    setSubmitError(null);

    const { data: { user } } = await supabase.auth.getUser();

    // Upload every attachment with per-file progress; first URL stays the
    // primary evidence_url for all existing readers, the full array persists
    // in evidence_urls (with legacy fallback if the column is unavailable).
    let evidenceUrls: string[] = [];
    if (evidenceFiles.length > 0) {
      setUploadProgress("uploading");
      setUploadState({ done: 0, total: evidenceFiles.length });
      for (let i = 0; i < evidenceFiles.length; i++) {
        const { url, errorMsg } = await uploadEvidence(evidenceFiles[i].file);
        if (!url) {
          setSubmitError(errorMsg ?? t("report.form.evidenceUploadFailed", "Evidence upload failed."));
          setUploadProgress("error");
          setUploadState(null);
          setSubmitting(false);
          return;
        }
        evidenceUrls.push(url);
        setUploadState({ done: i + 1, total: evidenceFiles.length });
      }
      setUploadProgress("done");
      setUploadState(null);
    }

    // Ensure incident_type is valid string — normalize to expected enum values
    const validTypes = new Set(["fire", "medical", "crime", "flood", "disaster", "other", "accident"]);
    const normalizedType = validTypes.has(selectedType as string) ? selectedType : "other";
    // Department routing: let DB trigger handle department_id (uuid). Frontend must NOT send invalid uuid string.
    // Send department as text code, and explicitly set department_id to null so trigger assigns correct uuid.
    const basePayload: Record<string, unknown> = {
      // Payload Name Normalization: map UI state to DB columns (incident_reports)
      incident_type:    normalizedType,
      type:             normalizedType,
      reporter_name:    reporterName.trim() || null,
      reporter_contact: reporterContact.trim() || null,
      description:      description.trim() || null,
      location:         location || null,
      address:          address || null,
      status:           "pending",
      user_id:          user?.id ?? null,
      responder_id:     null,
      evidence_url:     evidenceUrls[0] ?? null,
      department:       getDepartmentCodeForType(normalizedType as string),
      department_id:    null,
      assigned_department_id: null,
    };
    // Exclude UI-only flags (isAgreed/agreed) — never sent
    // Ensure we never send empty string for FK fields that would override trigger with invalid uuid
    if (!basePayload.department) basePayload.department = getDepartmentCodeForType(normalizedType as string);
    if (basePayload.department_id === "") basePayload.department_id = null;
    if ((basePayload as any).assigned_department_id === "") (basePayload as any).assigned_department_id = null;
    let inserted: { id: string } | null = null;
    let error: any = null;
    {
      const res = await supabase
        .from("reports")
        .insert({ ...basePayload, evidence_urls: evidenceUrls })
        .select("id")
        .single();
      inserted = res.data;
      error = res.error;
      if (error) {
        console.error("Supabase error code:", (error as any).code, "message:", (error as any).message, "details:", (error as any).details);
        console.error("Supabase Error Details:", error);
        console.error("Payload was:", { ...basePayload, evidence_urls: evidenceUrls });
        console.error("Details - code:", (error as any).code, "message:", (error as any).message, "details:", (error as any).details, "hint:", (error as any).hint);
      }
      // Fallback if DB uses 'type' not 'incident_type' (or vice versa)
      if (error && /incident_type/i.test(error.message ?? "")) {
        console.error("Supabase error code:", (error as any).code, "message:", (error as any).message, "details:", (error as any).details);
        const fallback: Record<string, unknown> = { ...basePayload };
        delete (fallback as any).incident_type;
        const r2 = await supabase.from("reports").insert({ ...fallback, evidence_urls: evidenceUrls }).select("id").single();
        inserted = r2.data; error = r2.error;
        if (error) console.error("Supabase error code:", (error as any).code, "message:", (error as any).message, "details:", (error as any).details);
        if (error && /evidence_urls/i.test(error.message ?? "")) {
          const r3 = await supabase.from("reports").insert(fallback).select("id").single();
          inserted = r3.data; error = r3.error;
        }
      }
      // Legacy fallback: older DBs without the evidence_urls column.
      if (error && /evidence_urls/i.test(error.message ?? "")) {
        console.error("Supabase error code:", (error as any).code, "message:", (error as any).message, "details:", (error as any).details);
        console.error("Supabase Error Details (retry without evidence_urls):", error);
        const retry = await supabase.from("reports").insert(basePayload).select("id").single();
        inserted = retry.data;
        error = retry.error;
        if (error) {
          console.error("Supabase error code:", (error as any).code, "message:", (error as any).message, "details:", (error as any).details);
          console.error("Supabase Error Details (retry):", error);
        }
      }
      // Fallback if department columns don't exist (older DB)
      if (error && /department/i.test(error.message ?? "")) {
        console.error("Supabase error code:", (error as any).code, "message:", (error as any).message, "details:", (error as any).details);
        const minimal: Record<string, unknown> = {
          type: basePayload.type,
          description: basePayload.description,
          location: basePayload.location,
          address: basePayload.address,
          reporter_name: basePayload.reporter_name,
          reporter_contact: basePayload.reporter_contact,
          status: basePayload.status,
          user_id: basePayload.user_id,
          responder_id: basePayload.responder_id,
          evidence_url: basePayload.evidence_url,
        };
        const rDept = await supabase.from("reports").insert({ ...minimal, evidence_urls: evidenceUrls }).select("id").single();
        inserted = rDept.data; error = rDept.error;
        if (error && /evidence_urls/i.test(error.message ?? "")) {
          const rDept2 = await supabase.from("reports").insert(minimal).select("id").single();
          inserted = rDept2.data; error = rDept2.error;
        }
        if (error) console.error("Supabase error code:", (error as any).code, "message:", (error as any).message, "details:", (error as any).details);
      }
    }

    if (error) {
      console.error("Supabase error code:", (error as any).code, "message:", (error as any).message, "details:", (error as any).details);
      console.error("Supabase Error Details:", error);
      setSubmitError(t("report.form.submitFailed", "Failed to submit report. Please try again."));
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setSubmittedId(inserted?.id ?? null);
    setSubmitted(true);
  }

  useEffect(() => {
    if (agreed && selectedType)                                    setCurrentStep(5);
    else if (evidenceFiles.length > 0)                             setCurrentStep(4);
    else if (description.trim())                                   setCurrentStep(3);
    else if (locationStatus === "ok" || locationStatus !== "idle") setCurrentStep(2);
    else if (selectedType)                                         setCurrentStep(1);
    else                                                           setCurrentStep(0);
  }, [selectedType, locationStatus, evidenceFiles.length, agreed, description]);

  function gpsValue() {
    if (locationStatus === "loading") return t("report.acquiringLocation");
    if (locationStatus === "error")   return t("report.locationUnavailable");
    if (locationStatus === "ok") {
      if (address)  return address;
      // Trim the language-specific "please wait" suffix via its own dictionary
      // key instead of a hardcoded English substring.
      if (location) return `${t("report.acquiringLocation").replace(t("report.form.acquiringTrimSuffix", "— please wait"), "")} (${location})`;
    }
    return "";
  }

  function resetForm() {
    setSubmitted(false);
    setSubmittedId(null);
    setSelectedType(null);
    setDescription("");
    setReporterName("");
    setReporterContact("");
    setEvidenceFiles(prev => {
      prev.forEach(f => URL.revokeObjectURL(f.previewUrl));
      return [];
    });
    setFileError(null);
    setUploadState(null);
    setAgreed(false);
    setUploadProgress("idle");
  }

  if (submitted) {
    const deptInfo = getDepartmentForType(selectedType ?? "other");
    return (
      <>
        <style>{CSS}</style>
        <div className="cr-root">
          <div className="cr-bg" style={{ backgroundImage: `url(${pagesBackground})` }} />
          <div className="cr-glow"><div className="cr-glow-a" /><div className="cr-glow-b" /></div>
          <div className="cr-inner cr-inner--center">
            <div className="cr-success">
              <div className="cr-success-icon">✓</div>
              <h2 className="cr-success-title">{t("report.success.title")}</h2>
              <p className="cr-success-sub">
                {t("report.success.sub")}
              </p>
              <div className="cr-success-cards">
                <div className="cr-success-card">
                  <div className="cr-success-card-icon">📝</div>
                  <div className="cr-success-card-title">{t("report.success.cardTitle")}</div>
                  <p className="cr-success-card-text">
                    {t("report.success.cardText")}
                  </p>
                  <button className="cr-success-btn" onClick={resetForm}>
                    {t("report.success.cardBtn")}
                  </button>
                </div>
                <div className="cr-success-card cr-success-card--track">
                  <div className="cr-success-card-icon">📍</div>
                  <div className="cr-success-card-title">{t("report.trackMyReport")}</div>
                  <p className="cr-success-card-text">
                    {t("report.sidebar.trackText")}
                  </p>
                  <button
                    className="cr-success-btn cr-success-btn--track"
                    onClick={() => goReport(submittedId)}
                  >
                    {t("report.trackIncidentReport")}
                  </button>
                </div>
              </div>
              {deptInfo && (
                <div style={{ marginTop: "16px", padding: "12px 20px", background: "rgba(46,204,143,0.1)", border: "1px solid rgba(46,204,143,0.25)", borderRadius: "10px", fontSize: "13px", color: "#2ECC8F" }}>
                  <strong>Assigned Department:</strong> {deptInfo.departmentName}
                </div>
              )}
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

          {/* Back navigation lives in the persistent CitizenLayout sidebar. */}

          <section className="cr-hero">
            <div className="cr-hero-tag">
              <span className="cr-hero-dot" />
              {t("report.reportingLiveIncident")}
            </div>
            <h1 className="cr-hero-heading">{t("report.heroTitle")} <em>{t("report.heroAccent")}</em></h1>
            <p className="cr-hero-sub">
              {t("report.heroSub")}
            </p>
          </section>

          <div className="cr-banner">
            <div className="cr-banner-icon">✅</div>
            <div className="cr-banner-body">
              <div className="cr-banner-title">{t("report.bannerTitle")}</div>
              <p className="cr-banner-text">
                {t("report.bannerText")}
              </p>
            </div>
            <button className="cr-banner-btn" onClick={goHistory}>
              {t("report.myReportsBtn")}
            </button>
          </div>

          <div className="cr-steps">
            {STEPS.map((step, i) => {
              const stepKey = ["incidentType", "reporterInfo", "location", "description", "evidence", "submit"][i];
              return (
                <div
                  key={step}
                  className={`cr-step${i <= currentStep ? " cr-step--done" : ""}${i === currentStep ? " cr-step--active" : ""}`}
                >
                  <div className="cr-step-dot">{i < currentStep ? "✓" : i + 1}</div>
                  <span className="cr-step-label">{t(`report.steps.${stepKey}`)}</span>
                  {i < STEPS.length - 1 && <div className="cr-step-line" />}
                </div>
              );
            })}
          </div>

          <div className="cr-layout">

            <form className="cr-form" onSubmit={handleSubmit} noValidate>

              <div className="cr-card">
                <div className="cr-card-label">
                  <span className="cr-step-badge">01</span>{t("report.cardLabels.incidentType")}
                </div>
                <div className="cr-type-grid">
                  {INCIDENT_TYPES.map(type => (
                    <button
                      key={type.value}
                      type="button"
                      className={`cr-type-btn${selectedType === type.value ? " active" : ""}`}
                      style={{
                        "--ta": type.accent,
                        "--td": `${type.accent}18`,
                        "--tr": type.rgb,
                      } as React.CSSProperties}
                      onClick={() => setSelectedType(type.value)}
                    >
                      <span className="cr-type-icon">{type.icon}</span>
                      <span className="cr-type-label">{t(`report.types.${type.value}`)}</span>
                    </button>
                  ))}
                </div>
                {selectedType && (
                  <div
                    className="cr-type-confirm"
                    style={{
                      "--ta": activeType?.accent,
                      "--td": `${activeType?.accent}18`,
                    } as React.CSSProperties}
                  >
                    <span>{activeType?.icon}</span>
                    <span>{t("report.selected").replace("{type}", typeName(selectedType))}</span>
                  </div>
                )}
              </div>

              <div className="cr-card">
                <div className="cr-card-label">
                  <span className="cr-step-badge">02</span>{t("report.cardLabels.reporterInfo")}
                </div>
                <div className="cr-fields">
                  <div className="cr-field">
                    <label className="cr-label">
                      {t("report.form.fullName")} <span className="cr-optional">{t("report.form.optional")}</span>
                    </label>
                    <input
                      className="cr-input"
                      type="text"
                      placeholder={t("report.form.namePlaceholder", "e.g. Juan dela Cruz")}
                      value={reporterName}
                      onChange={e => setReporterName(e.target.value)}
                    />
                  </div>
                  <div className="cr-field">
                    <label className="cr-label">
                      {t("report.form.contactNumber")} <span className="cr-optional">{t("report.form.optional")}</span>
                    </label>
                    <input
                      className="cr-input"
                      type="tel"
                      placeholder={t("report.form.contactPlaceholder", "+63 9XX XXX XXXX")}
                      value={reporterContact}
                      onChange={e => setReporterContact(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="cr-card">
                <div className="cr-card-label">
                  <span className="cr-step-badge">03</span>{t("report.cardLabels.location")}
                </div>
                <div className="cr-field">
                  <label className="cr-label">{t("report.form.detectedLocation")}</label>
                  <div className="cr-loc-row">
                    <div className="cr-loc-wrap">
                      <span className="cr-loc-dot" data-status={locationStatus} />
                      <input
                        className="cr-input cr-input--loc cr-input--readonly"
                        type="text"
                        readOnly
                        value={gpsValue()}
                        placeholder={t("report.form.gpsWaiting", "Waiting for GPS…")}
                      />
                    </div>
                    <button type="button" className="cr-gps-btn" onClick={resolveLocation}>
                      {t("report.form.refreshGps")}
                    </button>
                  </div>

                  {locationStatus === "ok" && location && (
                    <div className="cr-coords-badge">
                      <span className="cr-coords-text">🌐 {location}</span>
                      {address && (
                        <a
                          href={`https://www.google.com/maps?q=${location}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="cr-maps-link"
                        >
                          {t("report.form.verifyMaps")}
                        </a>
                      )}
                    </div>
                  )}

                  {locationStatus === "loading" && (
                    <div className="cr-gps-acquiring">
                      <span className="cr-gps-pulse" />
                      {t("report.searchingGps")}
                    </div>
                  )}

                  {locationStatus === "error" && (
                    <p className="cr-hint cr-hint--warn">
                      ⚠️ {t("report.locationUnavailable")} {t("report.form.allowLocationAccess", "Allow location access and tap")} <strong>{refreshShort}</strong>.
                    </p>
                  )}

                  {locationStatus === "ok" && (
                    <>
                      <div className="cr-acc-badges">
                        {locationSource === "gps" && gpsAccuracy !== null && (
                          <span className={`cr-acc-badge ${gpsAccuracy <= 20 ? "acc-great" : gpsAccuracy <= 100 ? "acc-ok" : "acc-poor"}`}>
                            {gpsAccuracy <= 20 ? t("report.highAccuracy") : gpsAccuracy <= 100 ? t("report.mediumAccuracy") : t("report.lowAccuracy")}{" "}
                            (±{Math.round(gpsAccuracy)}m)
                          </span>
                        )}
                        {locationSource === "ip" && (
                          <span className="cr-acc-badge acc-ip">
                            {t("report.approximateLocation")}
                          </span>
                        )}
                        {locationSource === "gps" && gpsAccuracy !== null && gpsAccuracy > 100 && (
                          <span className="cr-acc-tip">{t("report.moveOutdoors")}</span>
                        )}
                      </div>
                      <p className="cr-hint cr-hint--warn">
                        ⚠️ {t("report.form.locationLooksWrong", "If the location looks wrong, tap {refresh} to try again.").replace("{refresh}", refreshShort)}
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div className="cr-card">
                <div className="cr-card-label">
                  <span className="cr-step-badge">04</span>{t("report.cardLabels.description")}
                </div>
                <div className="cr-field">
                  <label className="cr-label">{t("report.detailedDescription")}</label>
                  <textarea
                    className="cr-textarea"
                    rows={5}
                    placeholder={t("report.form.descriptionPlaceholder")}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="cr-card">
                <div className="cr-card-label">
                  <span className="cr-step-badge">05</span>{t("report.cardLabels.evidence")}
                  <span className="cr-optional">{t("report.form.optional")}</span>
                </div>
                <div
                  className="cr-dropzone"
                  onClick={() => fileRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault();
                    if (e.dataTransfer.files.length) addEvidenceFiles(e.dataTransfer.files);
                  }}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                  />
                  <span className="cr-dropzone-icon">📤</span>
                  <span className="cr-dropzone-text">{t("report.form.uploadHint")}</span>
                  <span className="cr-dropzone-hint">{t("report.photosAccepted")}</span>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="cr-gps-btn"
                    onClick={() => fileRef.current?.click()}
                  >
                    📎 {t("report.form.uploadFiles", "Upload Files")}
                  </button>
                  <button
                    type="button"
                    className="cr-gps-btn"
                    onClick={() => setShowCamera(true)}
                  >
                    📷 {t("report.form.cameraCapture", "Camera Capture")}
                  </button>
                </div>
                {fileError && (
                  <div className="cr-upload-status cr-upload--error">{fileError}</div>
                )}
                {evidenceFiles.length > 0 && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 10, marginTop: 12 }}>
                    {evidenceFiles.map(f => {
                      const isVideo = f.file.type.startsWith("video/");
                      return (
                        <div key={f.id} style={{ position: "relative", borderRadius: 10, overflow: "hidden", border: "1px solid var(--clr-border-2)", background: "var(--clr-surface-2)" }}>
                          {isVideo ? (
                            <video src={f.previewUrl} style={{ width: "100%", height: 90, objectFit: "cover", display: "block" }} preload="metadata" />
                          ) : (
                            <img src={f.previewUrl} alt={f.file.name} style={{ width: "100%", height: 90, objectFit: "cover", display: "block" }} />
                          )}
                          <div style={{ fontSize: 10, color: "var(--citizen-body)", padding: "4px 6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {isVideo ? "🎬 " : "🖼 "}{f.file.name}
                          </div>
                          <button
                            type="button"
                            aria-label="Remove attachment"
                            onClick={() => removeEvidenceFile(f.id)}
                            style={{ position: "absolute", top: 4, right: 4, width: 24, height: 24, borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.7)", color: "#fff", fontSize: 13, cursor: "pointer", lineHeight: 1 }}
                          >×</button>
                        </div>
                      );
                    })}
                  </div>
                )}
                {showCamera && (
                  <CameraCaptureModal
                    onCapture={(file) => addEvidenceFiles([file])}
                    onClose={() => setShowCamera(false)}
                  />
                )}
                {uploadProgress === "uploading" && (
                  <div className="cr-upload-status cr-upload--uploading">
                    {t("report.uploadingEvidence")}
                    {uploadState && ` (${uploadState.done}/${uploadState.total})`}
                  </div>
                )}
                {uploadState && uploadProgress === "uploading" && (
                  <div className="cr-upload-track" style={{ height: 6, borderRadius: 4, background: "var(--clr-surface-3)", overflow: "hidden", marginTop: 8 }}>
                    <div style={{ height: "100%", width: `${Math.round((uploadState.done / Math.max(uploadState.total, 1)) * 100)}%`, background: "var(--clr-green)", transition: "width 0.3s" }} />
                  </div>
                )}
                {uploadProgress === "done" && (
                  <div className="cr-upload-status cr-upload--done">{t("report.evidenceUploaded")}</div>
                )}
                {uploadProgress === "error" && (
                  <div className="cr-upload-status cr-upload--error">{t("report.uploadFailed")}</div>
                )}
              </div>

              <div className="cr-disclaimer">
                <div className="cr-disclaimer-header">
                  <span style={{ fontSize: 16 }}>⚖️</span>
                  <span className="cr-disclaimer-title">{t("report.form.legalTitle", "LEGAL ACKNOWLEDGMENT & WARNING")}</span>
                </div>
                <p className="cr-disclaimer-summary">
                  {t("report.form.legalSummary", "By submitting this report, you confirm that the information provided is true and accurate to the best of your knowledge.")}
                </p>
                <div className="cr-legal-notice">
                  <span className="cr-legal-notice-badge">NOTICE</span>
                  <span className="cr-legal-notice-text">
                    Submission of false, fraudulent, or malicious emergency reports is punishable by law under <strong>Republic Act No. 10175 (Cybercrime Prevention Act of 2012)</strong> and relevant provisions of the <strong>Revised Penal Code</strong>. Misuse of emergency response channels may lead to civil liability and criminal prosecution.
                  </span>
                </div>
                <label className="cr-check-row">
                  <input
                    type="checkbox"
                    className="cr-checkbox-hidden"
                    checked={isAgreed}
                    onChange={e => {
                      const v = e.target.checked;
                      setIsAgreed(v);
                      // setAgreed is alias; ensure state updates to true
                      console.log("Legal checkbox toggled", v);
                    }}
                    required
                  />
                  <div className="cr-checkbox-box">{agreed && "✓"}</div>
                  <span className="cr-check-text">
                    {t("report.form.legalCheckText", "I confirm that the information provided is truthful, and I acknowledge the legal consequences of submitting false emergency reports under RA 10175.")}
                  </span>
                </label>
              </div>

              {submitError && (
                <div className="cr-error">
                  <div>⚠️ {submitError}</div>
                  {uploadProgress === "error" && (
                    <button
                      type="button"
                      className="cr-skip-btn"
                      onClick={() => {
                        setEvidenceFiles(prev => {
                          prev.forEach(f => URL.revokeObjectURL(f.previewUrl));
                          return [];
                        });
                        setUploadProgress("idle");
                        setUploadState(null);
                        setSubmitError(null);
                      }}
                    >
                      {t("report.form.removeEvidence", "Remove evidence and submit without it →")}
                    </button>
                  )}
                </div>
              )}

              <button
                type="submit"
                className="cr-submit"
                disabled={!isAgreed || submitting}
                onClick={(e) => {
                  // Debug verification: ensure click reaches handler even before form submit
                  console.log("Submit button clicked", {
                    isAgreed,
                    agreed,
                    selectedType,
                    location,
                    description: description.slice(0, 80),
                    evidenceCount: evidenceFiles.length,
                  });
                  // allow form onSubmit to handle actual submission; no extra prevent here
                }}
              >
                {submitting ? (
                  <><span className="cr-spinner" /><span>{t("report.form.submitting")}</span></>
                ) : (
                  <><span>{t("report.form.submitBtn")}</span><span className="cr-submit-arrow">→</span></>
                )}
              </button>
            </form>

             <div className="cr-sidebar">
               <div className="cr-sidebar-card">
                 <div className="cr-sidebar-title">{t("report.sidebar.hotlinesTitle")}</div>
                 <div className="cr-hotlines">
{EMERGENCY_HOTLINES.map(h => (
                      <a
                        key={h.number}
                        href={`tel:${h.number}`}
                        className="cr-hotline"
                        style={{ "--hc": h.color } as React.CSSProperties}
                      >
                        <span className="cr-hotline-icon">{h.icon}</span>
                        <div className="cr-hotline-info">
                          <span className="cr-hotline-label">{h.label}</span>
                          <span className="cr-hotline-number">{h.number}</span>
                        </div>
                        <span className="cr-hotline-call">{t("report.call")}</span>
                      </a>
                    ))}
                 </div>
               </div>

               <div className="cr-sidebar-card cr-sidebar-card--warn">
                 <div className="cr-sidebar-title">⚠️ {t("report.sidebar.warnTitle")}</div>
                 <p className="cr-sidebar-text">
                   {t("report.sidebar.warnText")}
                 </p>
               </div>

               <div className="cr-sidebar-card cr-sidebar-card--info">
                 <div className="cr-sidebar-title">🛡️ {t("report.sidebar.safetyTitle")}</div>
                 <p className="cr-sidebar-text">
                   {t("report.sidebar.safetyText")}
                 </p>
               </div>

               <div className="cr-sidebar-card cr-sidebar-card--track">
                 <div className="cr-sidebar-title">📍 {t("report.sidebar.trackTitle")}</div>
                 <p className="cr-sidebar-text">
                   {t("report.sidebar.trackText")}
                 </p>
                 <button
                   className="cr-track-btn"
                   onClick={goHistory}
                 >
                   {t("report.sidebar.trackBtn")}
                 </button>
               </div>
             </div>

          </div>
        </div>
      </div>
    </>
  );
}
