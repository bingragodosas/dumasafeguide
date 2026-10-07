// src/citizen/CitizenHistory.tsx
// ✅ Unified with dark cinematic aesthetic
// • Dark blue-black background with Dumaguete Boulevard photo
// • Cinematic overlay, glass-morphism cards, refined animations
// • Cabinet Grotesk + Instrument Sans typography
// • Consistent with CitizenReport, CitizenReportDetail, CitizenAlertsPage

import { useEffect, useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { supabase } from "../js/supabase";
import { Link, useNavigate } from "react-router-dom";
import {
  FaFileAlt, FaClock, FaSpinner, FaCheckCircle,
  FaExclamationCircle, FaChevronRight, FaInbox,
  FaMapMarkedAlt, FaLightbulb, FaHistory,
  FaBell, FaBars, FaTimes, FaSignOutAlt,
} from "react-icons/fa";
import dsgLogo from "../assets/dsg_logo.png";
import pagesBackground from "../assets/pagesbackground.png";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Report {
  id: string;
  description: string;
  type: string;
  status: "pending" | "in-progress" | "resolved";
  created_at: string;
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
  resolved:      { label: "RESOLVED",    color: "var(--c-resolved)", bg: "var(--clr-green-bg)",  border: "var(--clr-green-border)" },
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@400;500;700;800;900&family=Instrument+Sans:wght@400;500;600&display=swap');

:root {
  --bg: var(--clr-bg);
  --surface: var(--citizen-card);
  --surface-2: var(--clr-surface-2);
  --border: var(--clr-border);
  --border-2: var(--clr-border-2);
  --text: var(--clr-text);
  --text-2: var(--clr-text-muted);
  --text-3: var(--clr-text-faint);
  --green: var(--clr-green);
  --red: var(--clr-red);
  --blue: var(--clr-blue);
  --yellow: var(--c-pending);
  --font-display: 'Cabinet Grotesk', sans-serif;
  --font-body: 'Instrument Sans', sans-serif;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

@keyframes fadeIn  { from { opacity: 0; transform: translateY(8px);   } to { opacity: 1; transform: none; } }
@keyframes slideIn { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: none; } }
@keyframes pulse   { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
@keyframes spin    { to { transform: rotate(360deg); } }

/* ── Portal shell ── */
.ch-portal {
  position: fixed; inset: 0; z-index: 9000; overflow: hidden;
  font-family: var(--font-body);
  color: var(--text); background: var(--bg);
  background-image: url('${pagesBackground}');
  background-size: cover; background-position: center;
  background-attachment: fixed; background-repeat: no-repeat;
}
.ch-portal::before {
  content: ''; position: fixed; inset: 0;
  background: linear-gradient(160deg, var(--citizen-scrim) 0%, color-mix(in srgb, var(--citizen-scrim) 82%, transparent) 50%, var(--citizen-scrim) 100%);
  pointer-events: none; z-index: 1;
}

.ch-shell { display: flex; height: 100%; width: 100%; position: relative; z-index: 2; }

/* ── Mobile overlay ── */
.ch-overlay { display: none; position: fixed; inset: 0; z-index: 190; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); }
.ch-overlay.open { display: block; }

/* ── Sidebar ── */
.ch-sidebar {
  width: 260px; flex-shrink: 0;
  background: rgba(15,21,33,.82); border-right: 1px solid var(--border);
  display: flex; flex-direction: column;
  height: 100%; position: fixed; left: 0; top: 0; z-index: 200;
  overflow: hidden; transition: transform 0.3s ease;
  box-shadow: 0 4px 16px rgba(0,0,0,0.2);
  backdrop-filter: blur(16px);
}
.ch-logo { padding: 20px 16px; display: flex; align-items: center; gap: 12px; flex-shrink: 0; border-bottom: 1px solid var(--border); }
.ch-logo-img  { width: 40px; height: 40px; object-fit: contain; border-radius: 8px; }
.ch-logo-name { font-size: 15px; font-weight: 700; color: var(--text); white-space: nowrap; font-family: var(--font-display); }
.ch-logo-sub  { font-size: 11px; color: var(--text-3); margin-top: 3px; display: flex; align-items: center; gap: 6px; }
.ch-pip { display: inline-block; width: 5px; height: 5px; border-radius: 50%; background: var(--green); animation: pulse 2s ease infinite; flex-shrink: 0; box-shadow: 0 0 6px var(--green); }

.ch-sidebar-close {
  display: none; margin-left: auto; flex-shrink: 0;
  background: transparent; border: 1px solid var(--border); border-radius: 6px;
  width: 28px; height: 28px; align-items: center; justify-content: center;
  color: var(--text-3); cursor: pointer; transition: all 0.2s;
}
.ch-sidebar-close:hover { background: var(--surface-2); color: var(--text); }

.ch-nav-scroll { flex: 1; overflow-y: auto; padding: 8px 10px; scrollbar-width: thin; scrollbar-color: var(--border) transparent; }
.ch-nav-label {
  display: flex; align-items: center; gap: 8px;
  font-size: 11px; font-weight: 600; color: var(--text-3);
  letter-spacing: 0.5px; text-transform: uppercase; padding: 12px 8px 6px;
}
.ch-nav-label::after { content: ''; flex: 1; height: 1px; background: var(--border); }

.ch-nav-btn {
  display: flex; align-items: center; gap: 10px; width: 100%;
  padding: 10px 12px; border-radius: 8px; border: 1px solid transparent;
  font-size: 13px; font-weight: 500; color: var(--text-2);
  background: transparent; cursor: pointer; margin-bottom: 2px;
  text-align: left; transition: all 0.2s; text-decoration: none;
}
.ch-nav-btn:hover  { background: rgba(46,204,143,.08); color: var(--text); border-color: var(--border); }
.ch-nav-btn.active {
  background: linear-gradient(135deg, var(--green) 0%, #24a97a 100%);
  color: #080c14; border-color: transparent; font-weight: 600;
  box-shadow: 0 2px 8px rgba(46,204,143,.3);
}
.ch-nav-ic { font-size: 15px; flex-shrink: 0; color: var(--text-3); display: flex; align-items: center; transition: color 0.2s; }
.ch-nav-btn.active .ch-nav-ic { color: #080c14; }
.ch-badge { margin-left: auto; background: var(--red); color: white; font-size: 10px; min-width: 20px; height: 20px; border-radius: 10px; padding: 0 6px; display: flex; align-items: center; justify-content: center; font-weight: 600; animation: pulse 2s ease infinite; }

.ch-sidebar-foot { padding: 12px 10px 16px; border-top: 1px solid var(--border); flex-shrink: 0; }
.ch-user-card { display: flex; align-items: center; gap: 10px; padding: 12px; background: rgba(8,12,20,.6); border: 1px solid var(--border); border-radius: 8px; margin-bottom: 8px; }
.ch-avatar    { width: 32px; height: 32px; border-radius: 6px; flex-shrink: 0; background: linear-gradient(135deg, var(--green) 0%, #24a97a 100%); display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 11px; color: #080c14; }
.ch-user-name   { font-size: 13px; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ch-user-status { font-size: 10px; color: var(--green); display: flex; align-items: center; gap: 5px; margin-top: 2px; }
.ch-logout-btn  { display: flex; align-items: center; gap: 8px; width: 100%; padding: 9px 12px; background: rgba(8,12,20,.6); border: 1px solid var(--border); border-radius: 8px; font-size: 13px; font-weight: 500; color: var(--text-2); cursor: pointer; transition: all 0.2s; }
.ch-logout-btn:hover { background: rgba(255,107,107,.12); color: var(--red); border-color: var(--red); }

/* ── Main ── */
.ch-main {
  margin-left: 260px; flex: 1;
  display: flex; flex-direction: column;
  min-width: 0; height: 100vh; overflow-y: auto; overflow-x: hidden;
  position: relative; z-index: 1;
}

.ch-topbar {
  height: 56px; display: flex; align-items: center; padding: 0 24px;
  background: rgba(15,21,33,.82); border-bottom: 1px solid var(--border);
  position: sticky; top: 0; z-index: 100; gap: 12px; flex-shrink: 0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  backdrop-filter: blur(16px);
}
.ch-hamburger { display: none; background: rgba(8,12,20,.6); border: 1px solid var(--border); border-radius: 6px; width: 32px; height: 32px; align-items: center; justify-content: center; color: var(--text-3); cursor: pointer; transition: all 0.2s; flex-shrink: 0; font-size: 14px; }
.ch-hamburger:hover { background: var(--surface); border-color: var(--text-2); color: var(--text); }
.ch-crumb        { display: flex; align-items: center; gap: 7px; font-size: 12px; color: var(--text-3); }
.ch-crumb-sep    { color: var(--text-3); }
.ch-crumb-active { color: var(--text); font-weight: 600; }
.ch-crumb-hide   { white-space: nowrap; }
.ch-topbar-right { margin-left: auto; display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
.ch-clock  { font-size: 12px; font-weight: 500; color: var(--text-2); background: rgba(8,12,20,.6); border: 1px solid var(--border); border-radius: 6px; padding: 6px 12px; white-space: nowrap; }
.ch-icon-btn { width: 32px; height: 32px; border-radius: 6px; border: 1px solid var(--border); background: transparent; display: flex; align-items: center; justify-content: center; color: var(--text-3); cursor: pointer; font-size: 13px; transition: all 0.2s; }
.ch-icon-btn:hover { background: rgba(46,204,143,.08); color: var(--text); }

/* ── Page ── */
.ch-page { flex: 1; padding: 24px; overflow-x: hidden; min-width: 0; }
.ch-page > div { animation: fadeIn 0.4s ease-out both; }

/* ── Page header ── */
.ch-page-hd { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; margin-bottom: 24px; }
.ch-eyebrow { font-size: 11px; color: var(--green); letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 6px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
.ch-eyebrow::before { content: ''; display: block; width: 20px; height: 2px; background: var(--green); }
.ch-title    { font-size: 32px; color: var(--text); letter-spacing: -0.5px; line-height: 1.1; font-weight: 900; font-family: var(--font-display); }
.ch-subtitle { font-size: 11px; color: var(--text-3); margin-top: 4px; }

/* ── Stat Grid ── */
.ch-stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 24px; }
.ch-stat {
  background: rgba(15,21,33,.82); border: 1px solid var(--border); border-radius: 12px;
  padding: 20px; position: relative; overflow: hidden; transition: all 0.3s;
  animation: fadeIn 0.5s ease-out both;
  backdrop-filter: blur(16px);
}
.ch-stat:nth-child(2) { animation-delay: 0.05s; }
.ch-stat:nth-child(3) { animation-delay: 0.10s; }
.ch-stat:nth-child(4) { animation-delay: 0.15s; }
.ch-stat:hover { transform: translateY(-4px); border-color: var(--green); box-shadow: 0 8px 16px rgba(46,204,143,.15); }
.ch-stat::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: var(--card-accent); }
.ch-stat-icon  { font-size: 18px; color: var(--card-accent); margin-bottom: 12px; opacity: 0.85; }
.ch-stat-num   { font-size: 32px; line-height: 1; margin-bottom: 6px; letter-spacing: -0.5px; font-weight: 900; color: var(--card-accent); font-family: var(--font-display); }
.ch-stat-label { font-size: 11px; color: var(--text-2); letter-spacing: 0.3px; text-transform: uppercase; font-weight: 600; }

/* ── Panel ── */
.ch-panel {
  background: rgba(15,21,33,.82); border: 1px solid var(--border); border-radius: 12px;
  overflow: hidden; animation: slideIn 0.5s ease-out both;
  position: relative; backdrop-filter: blur(16px);
}
.ch-panel::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: var(--green); }
.ch-panel-hd {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-bottom: 1px solid var(--border);
  background: rgba(8,12,20,.4);
}
.ch-panel-title { font-size: 11px; color: var(--text-2); letter-spacing: 0.5px; text-transform: uppercase; font-weight: 600; }
.ch-panel-tag   { font-size: 9px; color: var(--green); border: 1px solid var(--green); border-radius: 4px; padding: 3px 8px; background: rgba(46,204,143,.1); font-weight: 600; }

/* ── Report rows ── */
.ch-list { display: flex; flex-direction: column; }

.ch-row {
  display: flex; align-items: center; gap: 14px;
  padding: 16px 20px; border-bottom: 1px solid var(--border);
  text-decoration: none; color: inherit;
  transition: background 0.15s; cursor: pointer;
}
.ch-row:last-child { border-bottom: none; }
.ch-row:hover { background: rgba(46,204,143,.05); }

.ch-row-icon {
  width: 36px; height: 36px; border-radius: 8px; flex-shrink: 0;
  border: 1px solid var(--border); display: flex; align-items: center;
  justify-content: center; font-size: 16px; background: rgba(8,12,20,.4);
}
.ch-row-body { flex: 1; min-width: 0; }
.ch-row-desc {
  font-size: 13px; font-weight: 600; color: var(--text);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px;
}
.ch-row-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.ch-row-date { font-size: 11px; color: var(--text-3); }
.ch-row-type {
  font-size: 10px; font-weight: 700; letter-spacing: 0.05em; text-transform: capitalize;
  border-radius: 4px; padding: 2px 8px;
}
.ch-row-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.ch-pill {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 10px; font-weight: 700; letter-spacing: 0.05em;
  text-transform: uppercase; border-radius: 6px; padding: 4px 10px; border: 1px solid;
}
.ch-pill-dot { width: 4px; height: 4px; border-radius: 50%; background: currentColor; flex-shrink: 0; }
.ch-chevron  { color: var(--text-3); font-size: 10px; transition: transform 0.2s; }
.ch-row:hover .ch-chevron { transform: translateX(2px); color: var(--text-2); }

/* ── Empty ── */
.ch-empty {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 60px 24px; gap: 8px; text-align: center;
}
.ch-empty-icon  { font-size: 28px; color: var(--text-3); margin-bottom: 4px; opacity: 0.4; }
.ch-empty-title { font-size: 15px; font-weight: 600; color: var(--text-2); font-family: var(--font-display); }
.ch-empty-sub   { font-size: 13px; color: var(--text-3); max-width: 280px; line-height: 1.6; }
.ch-empty-link  {
  margin-top: 12px; font-size: 12px; font-weight: 600; color: var(--green);
  text-decoration: none; border: 1px solid var(--green); border-radius: 8px;
  padding: 8px 16px; background: rgba(46,204,143,.08);
  display: inline-flex; align-items: center; gap: 6px; transition: all 0.2s;
}
.ch-empty-link:hover { background: rgba(46,204,143,.15); border-color: var(--green); }

/* ── Loading ── */
.ch-loading { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 56px; color: var(--text-3); font-size: 13px; }
.ch-spinner { display: inline-block; width: 16px; height: 16px; border-radius: 50%; border: 2px solid var(--border); border-top-color: var(--green); animation: spin 0.8s linear infinite; }

/* ── Responsive ── */
@media (max-width: 768px) {
  .ch-sidebar { transform: translateX(-100%); width: min(260px, 90vw); box-shadow: 4px 0 12px rgba(0,0,0,0.3); }
  .ch-sidebar.open { transform: translateX(0); }
  .ch-sidebar-close { display: flex; }
  .ch-hamburger { display: flex; }
  .ch-main { margin-left: 0; }
  .ch-topbar { padding: 0 16px; }
  .ch-crumb-hide { display: none; }
  .ch-page { padding: 16px; }
  .ch-title { font-size: 26px; }
  .ch-stat-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .ch-stat-num { font-size: 24px; }
  .ch-clock { display: none; }
}
@media (max-width: 420px) {
  .ch-page { padding: 14px 12px; }
  .ch-row-type { display: none; }
}
`;

// ─── Clock hook ───────────────────────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

export default function CitizenHistory() {
  // Consumes the active Navbar/Header language — any selector change re-renders
  // this component and re-evaluates every t() call and language-aware helper below.
  const { language, t, tList } = useLanguage();
  void tList;
  const locale = language === "tl" ? "fil-PH" : "en-PH";
  const navigate = useNavigate();
  const clock    = usePHTClock();

  // Language-aware status-pill text (status.* in the dictionary, English fallback).
  const statusLabel = (s: string) =>
    t(`status.${s === "in-progress" ? "inProgress" : s}`, STATUS_META[s]?.label ?? s);
  // Language-aware report-type name (report.types.* in the dictionary).
  const typeLabel = (type: string | undefined) =>
    t(`report.types.${type?.toLowerCase()}`, type ?? "");
  // Language-aware accessible names for icon-only buttons.
  const aria = {
    navigation: language === "tl" ? "Nabigasyon" : "Navigation",
    close: language === "tl" ? "Isara" : "Close",
    openNav: language === "tl" ? "Buksan ang nabigasyon" : "Open navigation",
    notifications: language === "tl" ? "Mga abiso" : "Notifications",
  };

  const [reports,     setReports]     = useState<Report[]>([]);
  const [user,        setUser]        = useState<any>(null);
  const [loading,     setLoading]     = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const fetchReports = async () => {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (u) {
        const { data, error } = await supabase
          .from("reports")
          .select("*")
          .eq("user_id", u.id)
          .order("created_at", { ascending: false });
        if (!error) setReports(data || []);
      }
      setLoading(false);
    };
    fetchReports();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSidebarOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  const stats = {
    total:      reports.length,
    pending:    reports.filter(r => r.status === "pending").length,
    inProgress: reports.filter(r => r.status === "in-progress").length,
    resolved:   reports.filter(r => r.status === "resolved").length,
  };

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || t("history.citizen", "Citizen");
  const initials    = displayName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  const statCards = [
    { label: t("dashboard.statTotalFiled"),  value: stats.total,      accent: "#7B9EFF", icon: <FaFileAlt />     },
    { label: t("dashboard.statPending"),      value: stats.pending,    accent: "#FFD166", icon: <FaClock />       },
    { label: t("dashboard.statInProgress"),  value: stats.inProgress, accent: "#FF9F43", icon: <FaSpinner />     },
    { label: t("dashboard.statResolved"),     value: stats.resolved,   accent: "#2ECC8F", icon: <FaCheckCircle /> },
  ];

  return (
    <>
      <style>{STYLES}</style>
      <div className="ch-portal">
        <div className="ch-shell">

          {/* Mobile overlay */}
          <div
            className={`ch-overlay${sidebarOpen ? " open" : ""}`}
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />

          {/* ── Sidebar ── */}
          <aside className={`ch-sidebar${sidebarOpen ? " open" : ""}`} aria-label={aria.navigation}>
            <div className="ch-logo">
              <img src={dsgLogo} alt="DumaSafeGuide" className="ch-logo-img" />
              <div>
                <div className="ch-logo-name">DumaSafeGuide</div>
                <div className="ch-logo-sub"><span className="ch-pip" />CITIZEN</div>
              </div>
              <button className="ch-sidebar-close" onClick={() => setSidebarOpen(false)} aria-label={aria.close}>
                <FaTimes />
              </button>
            </div>

            <nav className="ch-nav-scroll">
              <div className="ch-nav-label">{t("dashboard.sidebarPortal")}</div>
              <Link to="/citizen/dashboard" className="ch-nav-btn">
                <span className="ch-nav-ic"><FaHistory /></span>
                {t("history.overview")}
              </Link>

              <div className="ch-nav-label">{t("history.actions")}</div>
              <Link to="/citizen/report" className="ch-nav-btn">
                <span className="ch-nav-ic"><FaFileAlt /></span>
                {t("history.fileReport")}
              </Link>
              <Link to="/citizen/history" className="ch-nav-btn active">
                <span className="ch-nav-ic"><FaHistory /></span>
                {t("history.myReports")}
                {stats.total > 0 && <span className="ch-badge">{stats.total}</span>}
              </Link>
              <Link to="/citizen/map" className="ch-nav-btn">
                <span className="ch-nav-ic"><FaMapMarkedAlt /></span>
                {t("history.safetyMap")}
              </Link>
              <Link to="/citizen/safetytips" className="ch-nav-btn">
                <span className="ch-nav-ic"><FaLightbulb /></span>
                {t("history.safetyTips")}
              </Link>
            </nav>

            <div className="ch-sidebar-foot">
              <div className="ch-user-card">
                <div className="ch-avatar">{initials}</div>
                <div style={{ minWidth: 0 }}>
                  <div className="ch-user-name">{displayName}</div>
                  <div className="ch-user-status"><span className="ch-pip" />{t("history.citizen")}</div>
                </div>
              </div>
              <button className="ch-logout-btn" onClick={handleLogout}>
                <FaSignOutAlt size={12} /> {t("history.signOut")}
              </button>
            </div>
          </aside>

          {/* ── Main ── */}
          <div className="ch-main">

             {/* Topbar */}
             <div className="ch-topbar">
                <button className="ch-hamburger" onClick={() => setSidebarOpen(true)} aria-label={aria.openNav}>
                 <FaBars />
               </button>
               <div className="ch-crumb">
                 <span className="ch-crumb-hide">DUMASAFEGUIDE</span>
                 <span className="ch-crumb-sep ch-crumb-hide">/</span>
                 <span className="ch-crumb-hide">{t("history.citizen")}</span>
                 <span className="ch-crumb-sep ch-crumb-hide">/</span>
                 <span className="ch-crumb-active">{t("history.pageTitle")}</span>
               </div>
               <div className="ch-topbar-right">
                 <span className="ch-clock">{clock}</span>
                  <button className="ch-icon-btn" aria-label={aria.notifications}>
                   <FaBell size={13} />
                 </button>
               </div>
             </div>

             {/* Page content */}
             <div className="ch-page">
               <div>
                 {/* Header */}
                 <div className="ch-page-hd">
                   <div>
                     <div className="ch-eyebrow">{t("dashboard.citizenPortal")}</div>
                     <div className="ch-title">{t("history.pageTitle")}</div>
                     <div className="ch-subtitle">{t("history.subtitle")}</div>
                   </div>
                 </div>

                {/* Stats */}
                <div className="ch-stat-grid">
                  {statCards.map(c => (
                    <div
                      key={c.label}
                      className="ch-stat"
                      style={{ "--card-accent": c.accent } as React.CSSProperties}
                    >
                      <div className="ch-stat-icon">{c.icon}</div>
                      <div className="ch-stat-num">{loading ? "—" : c.value}</div>
                      <div className="ch-stat-label">{c.label}</div>
                    </div>
                  ))}
                </div>

                 {/* Reports panel */}
                 <div className="ch-panel">
                   <div className="ch-panel-hd">
                     <span className="ch-panel-title">{t("history.allReports")}</span>
                     <span className="ch-panel-tag">{loading ? "…" : `${stats.total} ${t("history.totalLabel")}`}</span>
                   </div>

                   {loading ? (
                     <div className="ch-loading">
                       <div className="ch-spinner" /> {t("history.loadingReports")}
                     </div>
                   ) : reports.length === 0 ? (
                     <div className="ch-empty">
                       <div className="ch-empty-icon"><FaInbox /></div>
                       <div className="ch-empty-title">{t("history.noReportsYet")}</div>
                       <p className="ch-empty-sub">
                         {t("history.noReportsSub")}
                       </p>
                       <Link to="/citizen/report" className="ch-empty-link">
                         <FaFileAlt size={11} /> {t("history.fileAReport")}
                       </Link>
                     </div>
                   ) : (
                    <div className="ch-list">
                      {reports.map(r => {
                        const tm = TYPE_META[r.type?.toLowerCase()] ?? TYPE_META.other;
                        const sm = STATUS_META[r.status]            ?? STATUS_META.pending;
                        return (
                          <div
                            key={r.id}
                            className="ch-row"
                            onClick={() => navigate(`/citizen/history/${r.id}`)}
                          >
                            <div className="ch-row-icon">{tm.icon}</div>
                            <div className="ch-row-body">
                              <div className="ch-row-desc" title={r.description}>
                                {r.description || t("reportDetail.noDescription", "No description")}
                              </div>
                              <div className="ch-row-meta">
                                <span className="ch-row-date">
                                  {new Date(r.created_at).toLocaleDateString(locale, {
                                    month: "short", day: "numeric", year: "numeric",
                                  })}
                                </span>
                                {r.type && (
                                  <span
                                    className="ch-row-type"
                                    style={{
                                      color: tm.color,
                                      background: `color-mix(in srgb, ${tm.color} 14%, transparent)`,
                                      border: `1px solid color-mix(in srgb, ${tm.color} 32%, transparent)`,
                                    }}
                                  >
                                    {typeLabel(r.type)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="ch-row-right">
                              <span
                                className="ch-pill"
                                style={{
                                  color: sm.color,
                                  background: sm.bg,
                                  borderColor: sm.border,
                                }}
                              >
                                <span className="ch-pill-dot" />
                                {statusLabel(r.status)}
                              </span>
                              <FaChevronRight className="ch-chevron" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}