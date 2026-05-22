import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../js/supabase";
import {
  FaArrowLeft,
  FaBell,
  FaBellSlash,
  FaFire,
  FaWater,
  FaUserShield,
  FaAmbulance,
  FaCar,
  FaExclamationTriangle,
  FaMapMarkerAlt,
  FaClock,
  FaCheckCircle,
  FaSpinner,
  FaCircle,
  FaFilter,
  FaTimes,
  FaHome,
} from "react-icons/fa";

import pageBg from "../assets/pagesbackground.png";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Report {
  id: string;
  description: string;
  type: string;
  category: string;
  location: string;
  status: "pending" | "in-progress" | "resolved";
  created_at: string;
  notes?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<
  string,
  { color: string; bg: string; icon: React.ReactNode; label: string }
> = {
  fire:     { color: "#FF6B6B", bg: "rgba(255,107,107,0.10)", icon: <FaFire />,                label: "Fire"     },
  flood:    { color: "#7B9EFF", bg: "rgba(123,158,255,0.10)", icon: <FaWater />,               label: "Flood"    },
  crime:    { color: "#FF9F43", bg: "rgba(255,159,67,0.10)",  icon: <FaUserShield />,          label: "Crime"    },
  medical:  { color: "#2ECC8F", bg: "rgba(46,204,143,0.10)",  icon: <FaAmbulance />,           label: "Medical"  },
  accident: { color: "#FFD166", bg: "rgba(255,209,102,0.10)", icon: <FaCar />,                 label: "Accident" },
  default:  { color: "#A78BFA", bg: "rgba(167,139,250,0.10)", icon: <FaExclamationTriangle />, label: "Other"    },
};

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  "pending":     { label: "Pending",     color: "#FFD166", bg: "rgba(255,209,102,0.12)", icon: <FaClock size={10} />       },
  "in-progress": { label: "In Progress", color: "#7B9EFF", bg: "rgba(123,158,255,0.12)", icon: <FaSpinner size={10} />     },
  "resolved":    { label: "Resolved",    color: "#2ECC8F", bg: "rgba(46,204,143,0.12)",  icon: <FaCheckCircle size={10} /> },
};

const ALL_TYPES    = ["all", "fire", "flood", "crime", "medical", "accident"];
const ALL_STATUSES = ["all", "pending", "in-progress", "resolved"];

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60)    return `${Math.floor(diff)}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(dateStr).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

function getType(r: Report)   { return TYPE_CONFIG[r.type?.toLowerCase()] ?? TYPE_CONFIG.default; }
function getStatus(r: Report) {
  return STATUS_CONFIG[r.status] ?? {
    label: r.status, color: "#eef0f7", bg: "rgba(255,255,255,0.08)", icon: <FaCircle size={10} />,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function IncidentAlerts() {
  const navigate = useNavigate();

  const [reports, setReports]             = useState<Report[]>([]);
  const [loading, setLoading]             = useState(true);
  const [connected, setConnected]         = useState(false);
  const [newIds, setNewIds]               = useState<Set<string>>(new Set());
  const [filterType, setFilterType]       = useState("all");
  const [filterStatus, setFilterStatus]   = useState("all");
  const [showFilters, setShowFilters]     = useState(false);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [lastUpdated, setLastUpdated]     = useState<Date>(new Date());

  // ── User role detection ─────────────────────────────────────────────────────
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setUserRole(null); return; }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      setUserRole(profile?.role ?? null);
    });
  }, []);

  const isResponder = userRole === "responder";

  // ── Soft ping sound ─────────────────────────────────────────────────────────
  const playPing = () => {
    try {
      const ctx  = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch (_) {}
  };

  // ── Initial fetch ───────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchReports = async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (!error && data) setReports(data as Report[]);
      setLoading(false);
    };
    fetchReports();
  }, []);

  // ── Realtime ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel("incident-alerts-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, (payload) => {
        setLastUpdated(new Date());
        if (payload.eventType === "INSERT") {
          const r = payload.new as Report;
          setReports((prev) => [r, ...prev]);
          setNewIds((prev) => new Set(prev).add(r.id));
          if (alertsEnabled) playPing();
          setTimeout(() => setNewIds((prev) => { const n = new Set(prev); n.delete(r.id); return n; }), 4000);
        }
        if (payload.eventType === "UPDATE") {
          const u = payload.new as Report;
          setReports((prev) => prev.map((r) => (r.id === u.id ? u : r)));
        }
        if (payload.eventType === "DELETE") {
          setReports((prev) => prev.filter((r) => r.id !== payload.old.id));
        }
      })
      .subscribe((status) => setConnected(status === "SUBSCRIBED"));

    return () => { supabase.removeChannel(channel); };
  }, [alertsEnabled]);

  // ── Filtered list ───────────────────────────────────────────────────────────
  const filtered = reports.filter((r) => {
    const typeMatch   = filterType   === "all" || r.type?.toLowerCase() === filterType;
    const statusMatch = filterStatus === "all" || r.status === filterStatus;
    return typeMatch && statusMatch;
  });

  const counts = {
    total:    reports.length,
    pending:  reports.filter((r) => r.status === "pending").length,
    active:   reports.filter((r) => r.status === "in-progress").length,
    resolved: reports.filter((r) => r.status === "resolved").length,
  };

  const activeFilters = [filterType !== "all", filterStatus !== "all"].filter(Boolean).length;

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@400;500;700;800;900&family=Instrument+Sans:wght@400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:        #080c14;
          --surface:   rgba(15,21,33,0.55);
          --surface-2: rgba(22,29,46,0.65);
          --border:    rgba(255,255,255,0.08);
          --border-2:  rgba(255,255,255,0.14);
          --text:      #eef0f7;
          --text-2:    rgba(238,240,247,0.55);
          --text-3:    rgba(238,240,247,0.30);
          --green:     #2ECC8F;
          --red:       #FF6B6B;
          --blue:      #7B9EFF;
          --yellow:    #FFD166;
          --orange:    #FF9F43;
          --font-d: 'Cabinet Grotesk', sans-serif;
          --font-b: 'Instrument Sans', sans-serif;
          --r-sm: 8px; --r-md: 14px; --r-lg: 20px;
        }

        body { background: var(--bg); }

        /* ── Page shell ── */
        .ia { min-height: 100vh; font-family: var(--font-b); color: var(--text); position: relative; overflow-x: hidden; }

        .ia-bg {
          position: fixed; inset: 0; z-index: 0;
          background-image: url('${pageBg}');
          background-size: cover; background-position: center; background-repeat: no-repeat;
        }
        .ia-bg::after {
          content: ''; position: absolute; inset: 0;
          background: rgba(8,12,20,0.72);
        }

        .ia-glow { position: fixed; inset: 0; pointer-events: none; z-index: 1; overflow: hidden; }
        .ia-glow-1 { position: absolute; width: 700px; height: 700px; border-radius: 50%; background: radial-gradient(circle, rgba(255,107,107,0.06) 0%, transparent 70%); top: -250px; right: -150px; }
        .ia-glow-2 { position: absolute; width: 500px; height: 500px; border-radius: 50%; background: radial-gradient(circle, rgba(123,158,255,0.06) 0%, transparent 70%); bottom: -100px; left: -80px; }
        .ia-noise  { position: fixed; inset: 0; opacity: 0.022; pointer-events: none; z-index: 1; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); background-size: 200px; }

        .ia-inner { position: relative; z-index: 2; max-width: 980px; margin: 0 auto; padding: 0 24px 80px; }

        /* ── Nav ── */
        .ia-nav {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 0;
          animation: fadeDown 0.5s ease both;
        }

        .ia-logo { display: flex; align-items: center; gap: 9px; text-decoration: none; }
        .ia-logo-text { font-family: var(--font-d); font-size: 16px; font-weight: 800; letter-spacing: -0.01em; color: var(--text); }
        .ia-logo-text span { color: var(--green); }

        .ia-nav-right { display: flex; align-items: center; gap: 8px; }

        /* ── Back / nav buttons ── */
        .ia-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-b);
          font-size: 13px;
          font-weight: 600;
          color: var(--text);
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.14);
          border-radius: var(--r-sm);
          padding: 8px 16px;
          cursor: pointer;
          text-decoration: none;
          transition: background 0.2s, border-color 0.2s, transform 0.15s;
          white-space: nowrap;
          backdrop-filter: blur(8px);
        }
        .ia-back-btn:hover {
          background: rgba(255,255,255,0.12);
          border-color: rgba(255,255,255,0.24);
          transform: translateX(-2px);
        }
        .ia-back-btn:active { transform: translateX(-4px); }
        .ia-back-btn svg { flex-shrink: 0; opacity: 0.8; transition: transform 0.15s; }
        .ia-back-btn:hover svg { transform: translateX(-2px); opacity: 1; }

        /* responder dashboard button — accent green tint */
        .ia-back-btn--responder {
          background: rgba(46,204,143,0.08);
          border-color: rgba(46,204,143,0.22);
          color: #2ECC8F;
        }
        .ia-back-btn--responder:hover {
          background: rgba(46,204,143,0.15);
          border-color: rgba(46,204,143,0.4);
          transform: translateX(-2px);
        }

        /* circle arrow */
        .ia-back-arrow {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.13);
          color: var(--text-2);
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s, color 0.2s, transform 0.15s;
          backdrop-filter: blur(8px);
          flex-shrink: 0;
        }
        .ia-back-arrow:hover {
          background: rgba(255,255,255,0.11);
          border-color: rgba(255,255,255,0.22);
          color: var(--text);
          transform: translateX(-2px);
        }

        /* mute btn */
        .ia-mute-btn {
          display: inline-flex; align-items: center; gap: 7px;
          font-size: 12px; font-weight: 600;
          color: var(--text-3); border: 1px solid var(--border);
          border-radius: var(--r-sm); padding: 8px 13px;
          background: rgba(255,255,255,0.05);
          cursor: pointer; transition: all 0.2s;
          backdrop-filter: blur(8px);
        }
        .ia-mute-btn:hover { border-color: var(--border-2); color: var(--text); }
        .ia-mute-btn.active { color: var(--yellow); border-color: rgba(255,209,102,0.3); background: rgba(255,209,102,0.06); }

        /* ── Hero ── */
        .ia-hero { margin-top: 32px; margin-bottom: 28px; animation: fadeUp 0.6s 0.05s ease both; }
        .ia-hero-tag { display: inline-flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: var(--red); margin-bottom: 14px; }
        .ia-hero-tag-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--red); box-shadow: 0 0 10px var(--red); animation: pulse 1.8s ease infinite; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.75)} }
        .ia-hero-heading { font-family: var(--font-d); font-size: clamp(26px, 4vw, 42px); font-weight: 900; line-height: 1.08; letter-spacing: -0.03em; color: var(--text); margin-bottom: 8px; }
        .ia-hero-sub { font-size: 13px; color: var(--text-3); display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

        .ia-live { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; }
        .ia-live-dot { width: 7px; height: 7px; border-radius: 50%; }
        .ia-live-dot.on  { background: var(--green); box-shadow: 0 0 8px var(--green); animation: pulse 2s ease infinite; }
        .ia-live-dot.off { background: var(--text-3); }
        .ia-live.on  { color: var(--green); }
        .ia-live.off { color: var(--text-3); }

        /* ── Stats ── */
        .ia-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 28px; animation: fadeUp 0.6s 0.1s ease both; }
        @media (max-width: 640px) { .ia-stats { grid-template-columns: repeat(2, 1fr); } }

        .ia-stat {
          background: transparent;
          border: 1px solid var(--border);
          border-radius: var(--r-md); padding: 16px 18px;
          position: relative; overflow: hidden; transition: border-color 0.2s;
          backdrop-filter: blur(6px);
        }
        .ia-stat:hover { border-color: var(--border-2); }
        .ia-stat-label { font-size: 10px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-3); margin-bottom: 8px; }
        .ia-stat-value { font-family: var(--font-d); font-size: 30px; font-weight: 900; letter-spacing: -0.04em; line-height: 1; }
        .ia-stat-bar { position: absolute; bottom: 0; left: 0; right: 0; height: 2px; }

        /* ── Toolbar ── */
        .ia-toolbar { display: flex; align-items: center; gap: 10px; margin-bottom: 18px; flex-wrap: wrap; animation: fadeUp 0.6s 0.13s ease both; }
        .ia-toolbar-left { display: flex; align-items: center; gap: 8px; flex: 1; flex-wrap: wrap; }

        .ia-filter-btn {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 12px; font-weight: 600;
          border: 1px solid var(--border); border-radius: var(--r-sm); padding: 7px 13px;
          background: transparent; color: var(--text-3); cursor: pointer; transition: all 0.2s;
          white-space: nowrap; backdrop-filter: blur(6px);
        }
        .ia-filter-btn:hover, .ia-filter-btn.open { border-color: var(--border-2); color: var(--text); background: rgba(255,255,255,0.04); }
        .ia-filter-btn .ia-badge { background: var(--blue); color: #fff; font-size: 10px; border-radius: 4px; padding: 1px 5px; margin-left: 2px; }

        .ia-result-count { font-size: 12px; color: var(--text-3); margin-left: auto; white-space: nowrap; }

        .ia-filter-clear { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; color: var(--text-3); background: none; border: none; cursor: pointer; padding: 4px 0; transition: color 0.2s; }
        .ia-filter-clear:hover { color: var(--red); }

        /* ── Filter Drawer ── */
        .ia-filter-drawer {
          background: transparent; border: 1px solid var(--border-2);
          border-radius: var(--r-md); padding: 18px 20px; margin-bottom: 18px;
          animation: fadeUp 0.25s ease both; backdrop-filter: blur(10px);
        }
        .ia-filter-row { display: flex; gap: 20px; flex-wrap: wrap; }
        .ia-filter-group { display: flex; flex-direction: column; gap: 8px; }
        .ia-filter-group-label { font-size: 10px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-3); }
        .ia-filter-chips { display: flex; gap: 6px; flex-wrap: wrap; }
        .ia-chip { font-size: 11.5px; font-weight: 600; border-radius: 20px; padding: 5px 13px; border: 1px solid var(--border); background: transparent; color: var(--text-3); cursor: pointer; transition: all 0.18s; text-transform: capitalize; }
        .ia-chip:hover { border-color: var(--border-2); color: var(--text-2); }
        .ia-chip.active { border-color: transparent; color: #fff; }

        /* ── Section head ── */
        .ia-section-head { display: flex; align-items: center; gap: 14px; margin-bottom: 14px; }
        .ia-section-label { font-size: 10.5px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: var(--text-3); white-space: nowrap; }
        .ia-section-line { flex: 1; height: 1px; background: linear-gradient(90deg, var(--border-2), transparent); }

        /* ── Feed ── */
        .ia-feed { display: flex; flex-direction: column; gap: 10px; }

        .ia-card {
          background: transparent;
          border: 1px solid var(--border); border-radius: var(--r-lg);
          display: grid; grid-template-columns: auto 1fr auto;
          overflow: hidden; transition: border-color 0.2s, transform 0.2s, background 0.2s;
          animation: fadeUp 0.4s ease both;
          text-decoration: none; color: inherit;
          backdrop-filter: blur(6px);
        }
        .ia-card:hover { border-color: var(--border-2); transform: translateY(-1px); background: rgba(255,255,255,0.02); }
        .ia-card.is-new { animation: newFlash 4s ease both; }
        @keyframes newFlash {
          0%   { border-color: rgba(46,204,143,0.6); box-shadow: 0 0 24px rgba(46,204,143,0.15); }
          60%  { border-color: rgba(46,204,143,0.2); box-shadow: 0 0 8px rgba(46,204,143,0.05); }
          100% { border-color: var(--border); box-shadow: none; }
        }

        .ia-card-accent { width: 4px; flex-shrink: 0; }

        .ia-card-body { padding: 16px 18px; display: flex; flex-direction: column; gap: 10px; }
        .ia-card-top { display: flex; align-items: flex-start; gap: 12px; }
        .ia-card-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0; }
        .ia-card-info { flex: 1; min-width: 0; }
        .ia-card-desc { font-family: var(--font-d); font-size: 15px; font-weight: 700; color: var(--text); line-height: 1.3; letter-spacing: -0.01em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .ia-card-id   { font-size: 11px; color: var(--text-3); margin-top: 2px; }
        .ia-card-meta { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
        .ia-card-meta-item { display: flex; align-items: center; gap: 5px; font-size: 12px; color: var(--text-3); }
        .ia-card-meta-item svg { opacity: 0.6; }

        .ia-card-right { padding: 16px 18px 16px 0; display: flex; flex-direction: column; align-items: flex-end; justify-content: space-between; gap: 10px; }
        .ia-status-pill { display: inline-flex; align-items: center; gap: 5px; font-size: 10.5px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; border-radius: 20px; padding: 4px 11px; white-space: nowrap; }
        .ia-type-pill   { display: inline-flex; align-items: center; gap: 5px; font-size: 10.5px; font-weight: 600; border-radius: 6px; padding: 3px 9px; text-transform: capitalize; }
        .ia-new-badge { font-size: 9.5px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: var(--green); background: rgba(46,204,143,0.12); border: 1px solid rgba(46,204,143,0.25); border-radius: 4px; padding: 2px 7px; }

        /* ── Empty ── */
        .ia-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; padding: 80px 24px; background: transparent; border: 1px solid var(--border); border-radius: var(--r-lg); backdrop-filter: blur(6px); }
        .ia-empty-icon { width: 52px; height: 52px; border-radius: 14px; background: rgba(255,255,255,0.03); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 20px; color: var(--text-3); }
        .ia-empty-title { font-family: var(--font-d); font-size: 16px; font-weight: 700; color: var(--text); }
        .ia-empty-sub   { font-size: 13px; color: var(--text-3); text-align: center; max-width: 300px; }

        /* ── Loading ── */
        .ia-loading { display: flex; align-items: center; justify-content: center; gap: 10px; min-height: 100vh; color: var(--text-3); font-size: 13px; position: relative; z-index: 2; }
        .ia-spin { width: 16px; height: 16px; border: 2px solid rgba(46,204,143,0.2); border-top-color: var(--green); border-radius: 50%; animation: spin 0.75s linear infinite; }
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeDown { from { opacity:0; transform:translateY(-12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeUp   { from { opacity:0; transform:translateY(18px);  } to { opacity:1; transform:translateY(0); } }

        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
      `}</style>

      <div className="ia">
        <div className="ia-bg" />
        <div className="ia-glow"><div className="ia-glow-1" /><div className="ia-glow-2" /></div>
        <div className="ia-noise" />

        {loading ? (
          <div className="ia-loading"><div className="ia-spin" />Loading incident feed…</div>
        ) : (
          <div className="ia-inner">

            {/* ── Nav ── */}
            <nav className="ia-nav">
              {/* Left: back arrow + logo */}
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <button
                  className="ia-back-arrow"
                  onClick={() => navigate(-1)}
                  title="Go back"
                  aria-label="Go back"
                >
                  <FaArrowLeft size={13} />
                </button>

                <Link to="/" className="ia-logo">
                  <span className="ia-logo-text">DUMA<span>SAFEGUIDE</span></span>
                </Link>
              </div>

              {/* Right: mute + role-aware back button */}
              <div className="ia-nav-right">
                <button
                  className={`ia-mute-btn${alertsEnabled ? " active" : ""}`}
                  onClick={() => setAlertsEnabled((p) => !p)}
                  title={alertsEnabled ? "Mute alerts" : "Unmute alerts"}
                >
                  {alertsEnabled ? <FaBell size={11} /> : <FaBellSlash size={11} />}
                  {alertsEnabled ? "Alerts On" : "Muted"}
                </button>

                {/* Responders see "← Dashboard", everyone else sees "← Home" */}
                {isResponder ? (
                  <Link to="/responder/dashboard" className="ia-back-btn ia-back-btn--responder">
                    <FaArrowLeft size={12} />
                    Dashboard
                  </Link>
                ) : (
                  <Link to="/" className="ia-back-btn">
                    <FaHome size={12} />
                    Home
                  </Link>
                )}
              </div>
            </nav>

            {/* ── Hero ── */}
            <div className="ia-hero">
              <div className="ia-hero-tag">
                <span className="ia-hero-tag-dot" />Live Incident Feed
              </div>
              <h1 className="ia-hero-heading">Incident Alerts</h1>
              <div className="ia-hero-sub">
                <span className={`ia-live ${connected ? "on" : "off"}`}>
                  <span className={`ia-live-dot ${connected ? "on" : "off"}`} />
                  {connected ? "Realtime Connected" : "Connecting…"}
                </span>
                <span>·</span>
                <span>Last updated {timeAgo(lastUpdated.toISOString())}</span>
                <span>·</span>
                <span>{counts.total} total reports</span>
              </div>
            </div>

            {/* ── Stats ── */}
            <div className="ia-stats">
              <div className="ia-stat">
                <div className="ia-stat-label">Total Reports</div>
                <div className="ia-stat-value" style={{ color: "var(--text)" }}>{counts.total}</div>
                <div className="ia-stat-bar" style={{ background: "linear-gradient(90deg,rgba(238,240,247,0.15),transparent)" }} />
              </div>
              <div className="ia-stat">
                <div className="ia-stat-label">Pending</div>
                <div className="ia-stat-value" style={{ color: "var(--yellow)" }}>{counts.pending}</div>
                <div className="ia-stat-bar" style={{ background: "linear-gradient(90deg,rgba(255,209,102,0.4),transparent)" }} />
              </div>
              <div className="ia-stat">
                <div className="ia-stat-label">In Progress</div>
                <div className="ia-stat-value" style={{ color: "var(--blue)" }}>{counts.active}</div>
                <div className="ia-stat-bar" style={{ background: "linear-gradient(90deg,rgba(123,158,255,0.4),transparent)" }} />
              </div>
              <div className="ia-stat">
                <div className="ia-stat-label">Resolved</div>
                <div className="ia-stat-value" style={{ color: "var(--green)" }}>{counts.resolved}</div>
                <div className="ia-stat-bar" style={{ background: "linear-gradient(90deg,rgba(46,204,143,0.4),transparent)" }} />
              </div>
            </div>

            {/* ── Toolbar ── */}
            <div className="ia-toolbar">
              <div className="ia-toolbar-left">
                <button
                  className={`ia-filter-btn${showFilters ? " open" : ""}`}
                  onClick={() => setShowFilters((p) => !p)}
                >
                  <FaFilter size={10} />
                  Filters
                  {activeFilters > 0 && <span className="ia-badge">{activeFilters}</span>}
                </button>
                {activeFilters > 0 && (
                  <button
                    className="ia-filter-clear"
                    onClick={() => { setFilterType("all"); setFilterStatus("all"); }}
                  >
                    <FaTimes size={9} /> Clear filters
                  </button>
                )}
              </div>
              <span className="ia-result-count">Showing {filtered.length} of {reports.length}</span>
            </div>

            {/* ── Filter Drawer ── */}
            {showFilters && (
              <div className="ia-filter-drawer">
                <div className="ia-filter-row">
                  <div className="ia-filter-group">
                    <div className="ia-filter-group-label">Incident Type</div>
                    <div className="ia-filter-chips">
                      {ALL_TYPES.map((t) => {
                        const cfg = t !== "all" ? (TYPE_CONFIG[t] ?? TYPE_CONFIG.default) : null;
                        const isActive = filterType === t;
                        return (
                          <button
                            key={t}
                            className={`ia-chip${isActive ? " active" : ""}`}
                            style={isActive && cfg ? { background: cfg.color, borderColor: cfg.color } : isActive ? { background: "var(--border-2)", borderColor: "var(--border-2)", color: "var(--text)" } : {}}
                            onClick={() => setFilterType(t)}
                          >
                            {t === "all" ? "All Types" : (cfg?.label ?? t)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="ia-filter-group">
                    <div className="ia-filter-group-label">Status</div>
                    <div className="ia-filter-chips">
                      {ALL_STATUSES.map((s) => {
                        const cfg = s !== "all" ? STATUS_CONFIG[s] : null;
                        const isActive = filterStatus === s;
                        return (
                          <button
                            key={s}
                            className={`ia-chip${isActive ? " active" : ""}`}
                            style={isActive && cfg ? { background: cfg.color, borderColor: cfg.color } : isActive ? { background: "var(--border-2)", borderColor: "var(--border-2)", color: "var(--text)" } : {}}
                            onClick={() => setFilterStatus(s)}
                          >
                            {s === "all" ? "All Statuses" : (cfg?.label ?? s)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Feed ── */}
            <div className="ia-section-head">
              <span className="ia-section-label">Live Feed</span>
              <span className="ia-section-line" />
            </div>

            {filtered.length === 0 ? (
              <div className="ia-empty">
                <div className="ia-empty-icon"><FaBell /></div>
                <div className="ia-empty-title">No incidents found</div>
                <p className="ia-empty-sub">
                  {reports.length === 0
                    ? "No incidents have been reported yet. The feed will update in real-time."
                    : "No incidents match your current filters. Try adjusting or clearing them."}
                </p>
              </div>
            ) : (
              <div className="ia-feed">
                {filtered.map((report, idx) => {
                  const tCfg = getType(report);
                  const sCfg = getStatus(report);
                  const isNew = newIds.has(report.id);
                  return (
                    <Link
                      key={report.id}
                      to={`/responder/reports/${report.id}`}
                      className={`ia-card${isNew ? " is-new" : ""}`}
                      style={{ animationDelay: `${Math.min(idx * 0.04, 0.4)}s` }}
                    >
                      <div className="ia-card-accent" style={{ background: tCfg.color }} />
                      <div className="ia-card-body">
                        <div className="ia-card-top">
                          <div className="ia-card-icon" style={{ background: tCfg.bg, color: tCfg.color, border: `1px solid ${tCfg.color}25` }}>
                            {tCfg.icon}
                          </div>
                          <div className="ia-card-info">
                            <div className="ia-card-desc">{report.description || "No description provided"}</div>
                            <div className="ia-card-id">ID: {report.id}</div>
                          </div>
                        </div>
                        <div className="ia-card-meta">
                          {report.location && (
                            <span className="ia-card-meta-item"><FaMapMarkerAlt size={10} />{report.location}</span>
                          )}
                          <span className="ia-card-meta-item"><FaClock size={10} />{timeAgo(report.created_at)}</span>
                          {report.category && report.category !== "General" && (
                            <span className="ia-card-meta-item">{report.category}</span>
                          )}
                        </div>
                      </div>
                      <div className="ia-card-right">
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                          <span className="ia-status-pill" style={{ color: sCfg.color, background: sCfg.bg }}>
                            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor", display: "inline-block", flexShrink: 0 }} />
                            {sCfg.label}
                          </span>
                          <span className="ia-type-pill" style={{ color: tCfg.color, background: tCfg.bg, border: `1px solid ${tCfg.color}22` }}>
                            {tCfg.label}
                          </span>
                        </div>
                        {isNew && <span className="ia-new-badge">NEW</span>}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

          </div>
        )}
      </div>
    </>
  );
}