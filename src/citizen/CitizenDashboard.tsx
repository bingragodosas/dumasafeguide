// src/citizen/CitizenDashboard.tsx
import { useEffect, useState } from "react";
import { supabase } from "../js/supabase";
import { Link, useNavigate } from "react-router-dom";
import {
  FaMapMarkedAlt, FaHistory, FaLightbulb, FaFileAlt,
  FaCheckCircle, FaClock, FaSpinner,
  FaChevronRight, FaExclamationCircle, FaStickyNote,
} from "react-icons/fa";
import pagesBackground from "../assets/pagesbackground.png";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@400;500;700;800;900&family=Instrument+Sans:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .cd-root {
    min-height: 100vh;
    font-family: 'Instrument Sans', sans-serif;
    color: #eef0f7;
    position: relative;
    overflow-x: hidden;
    background: #080c14;
  }
  .cd-bg {
    position: fixed; inset: 0; z-index: 0;
    background-size: cover; background-position: center; background-repeat: no-repeat;
  }
  .cd-bg::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(160deg, rgba(8,12,20,.9) 0%, rgba(8,12,20,.8) 50%, rgba(8,12,20,.9) 100%);
  }
  .cd-glow { position: fixed; inset: 0; pointer-events: none; z-index: 1; overflow: hidden; }
  .cd-glow-a { position: absolute; width: 600px; height: 600px; border-radius: 50%; background: radial-gradient(circle, rgba(46,204,143,.08) 0%, transparent 70%); top: -180px; left: -80px; }
  .cd-glow-b { position: absolute; width: 500px; height: 500px; border-radius: 50%; background: radial-gradient(circle, rgba(123,158,255,.06) 0%, transparent 70%); bottom: -140px; right: -60px; }

  .cd-inner { position: relative; z-index: 2; max-width: 1080px; margin: 0 auto; padding: 0 24px 80px; }

  /* Hero */
  .cd-hero { margin-top: 48px; margin-bottom: 32px; }
  .cd-hero-tag { display: inline-flex; align-items: center; gap: 7px; font-size: 11px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: #2ECC8F; margin-bottom: 16px; }
  .cd-hero-dot { width: 6px; height: 6px; border-radius: 50%; background: #2ECC8F; box-shadow: 0 0 8px #2ECC8F; animation: cd-pulse 2.2s ease infinite; }
  @keyframes cd-pulse { 0%,100%{opacity:1;transform:scale(1);}50%{opacity:.4;transform:scale(.75);} }
  .cd-hero-heading { font-family: 'Cabinet Grotesk', sans-serif; font-size: clamp(28px, 4.5vw, 46px); font-weight: 900; line-height: 1.05; letter-spacing: -.035em; color: #eef0f7; margin-bottom: 8px; }
  .cd-hero-heading em { font-style: normal; color: #2ECC8F; }
  .cd-hero-sub { font-size: 14px; color: rgba(238,240,247,.35); }

  /* Alert */
  .cd-alert { display: flex; align-items: center; gap: 12px; background: rgba(255,209,102,.06); border: 1px solid rgba(255,209,102,.2); border-radius: 12px; padding: 12px 16px; margin-bottom: 28px; backdrop-filter: blur(12px); }
  .cd-alert-icon { color: #FFD166; flex-shrink: 0; }
  .cd-alert-text { font-size: 13px; color: rgba(255,209,102,.85); flex: 1; }
  .cd-alert-text strong { font-weight: 600; }
  .cd-alert-link { font-size: 12px; font-weight: 600; color: #FFD166; text-decoration: none; border: 1px solid rgba(255,209,102,.25); border-radius: 6px; padding: 4px 10px; transition: background .2s; white-space: nowrap; }
  .cd-alert-link:hover { background: rgba(255,209,102,.1); }

  /* Stats */
  .cd-stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; margin-bottom: 32px; }
  @media(max-width:680px){ .cd-stats { grid-template-columns: repeat(2,1fr); } }
  .cd-stat { background: rgba(15,21,33,.82); border: 1px solid rgba(255,255,255,.07); border-radius: 14px; padding: 20px 18px; position: relative; overflow: hidden; transition: border-color .2s, transform .2s; backdrop-filter: blur(16px); }
  .cd-stat:hover { border-color: rgba(255,255,255,.13); transform: translateY(-2px); }
  .cd-stat-bar { position: absolute; top: 0; left: 0; right: 0; height: 2px; background: var(--sc); opacity: .55; }
  .cd-stat-label { font-size: 10.5px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: rgba(238,240,247,.28); margin-bottom: 12px; }
  .cd-stat-row { display: flex; align-items: flex-end; justify-content: space-between; }
  .cd-stat-value { font-family: 'Cabinet Grotesk', sans-serif; font-size: 38px; font-weight: 900; line-height: 1; color: var(--sc); letter-spacing: -.04em; }
  .cd-stat-icon { font-size: 20px; color: var(--sc); opacity: .18; }

  /* Section head */
  .cd-sec { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; }
  .cd-sec-label { font-size: 10.5px; font-weight: 600; letter-spacing: .16em; text-transform: uppercase; color: rgba(238,240,247,.28); white-space: nowrap; }
  .cd-sec-line { flex: 1; height: 1px; background: linear-gradient(90deg, rgba(255,255,255,.1), transparent); }
  .cd-sec-link { font-size: 11.5px; font-weight: 500; color: rgba(238,240,247,.3); text-decoration: none; transition: color .2s; display: flex; align-items: center; gap: 4px; white-space: nowrap; }
  .cd-sec-link:hover { color: #2ECC8F; }

  /* Quick action cards */
  .cd-cards { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; margin-bottom: 36px; }
  @media(max-width:860px){ .cd-cards { grid-template-columns: repeat(2,1fr); } }
  @media(max-width:480px){ .cd-cards { grid-template-columns: 1fr; } }
  .cd-card { position: relative; background: rgba(15,21,33,.82); border: 1px solid rgba(255,255,255,.07); border-radius: 14px; padding: 20px 18px 18px; text-decoration: none; color: inherit; display: flex; flex-direction: column; gap: 6px; overflow: hidden; transition: transform .22s, border-color .22s, background .22s; backdrop-filter: blur(16px); }
  .cd-card-primary { background: linear-gradient(135deg, rgba(255,107,107,.1), rgba(255,107,107,.04)); border-color: rgba(255,107,107,.2); }
  .cd-card:hover { transform: translateY(-3px); border-color: var(--ca); background: rgba(22,29,46,.9); }
  .cd-card-hd { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
  .cd-card-icon { width: 40px; height: 40px; border-radius: 10px; background: var(--cd); border: 1px solid var(--ca); display: flex; align-items: center; justify-content: center; color: var(--ca); position: relative; z-index: 1; transition: transform .2s; }
  .cd-card:hover .cd-card-icon { transform: scale(1.06); }
  .cd-card-badge { font-size: 10px; font-weight: 700; letter-spacing: .08em; color: var(--ca); border: 1px solid var(--ca); border-radius: 20px; padding: 3px 8px; opacity: .7; position: relative; z-index: 1; }
  .cd-card-title { font-family: 'Cabinet Grotesk', sans-serif; font-size: 15px; font-weight: 700; color: #eef0f7; letter-spacing: -.01em; position: relative; z-index: 1; }
  .cd-card-desc { font-size: 12px; color: rgba(238,240,247,.28); line-height: 1.5; position: relative; z-index: 1; flex: 1; }
  .cd-card-cta { display: flex; align-items: center; gap: 5px; font-size: 11.5px; font-weight: 600; color: var(--ca); margin-top: 4px; position: relative; z-index: 1; transition: gap .2s; }
  .cd-card:hover .cd-card-cta { gap: 8px; }

  /* Reports table */
  .cd-table-wrap { background: rgba(15,21,33,.82); border: 1px solid rgba(255,255,255,.07); border-radius: 20px; overflow: hidden; backdrop-filter: blur(16px); }
  .cd-table-top { display: flex; align-items: center; justify-content: space-between; padding: 18px 22px; border-bottom: 1px solid rgba(255,255,255,.06); }
  .cd-table-title { font-family: 'Cabinet Grotesk', sans-serif; font-size: 15px; font-weight: 700; color: #eef0f7; }
  .cd-pill { font-size: 11px; font-weight: 600; color: rgba(238,240,247,.3); background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.07); border-radius: 20px; padding: 3px 10px; }
  .cd-table { width: 100%; border-collapse: collapse; }
  .cd-table th { font-size: 10.5px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: rgba(238,240,247,.28); padding: 11px 22px; text-align: left; border-bottom: 1px solid rgba(255,255,255,.06); background: rgba(0,0,0,.18); }
  .cd-table td { padding: 14px 22px; font-size: 13px; color: rgba(238,240,247,.55); border-bottom: 1px solid rgba(255,255,255,.03); vertical-align: middle; }
  .cd-table tr:last-child td { border-bottom: none; }
  .cd-table tbody tr { transition: background .15s; cursor: pointer; }
  .cd-table tbody tr:hover { background: rgba(255,255,255,.025); }
  .cd-rep-desc { display: flex; align-items: center; gap: 10px; }
  .cd-rep-icon { width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0; }
  .cd-rep-text { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #eef0f7; font-size: 13px; font-weight: 500; }
  .cd-type-tag { font-size: 10.5px; font-weight: 600; letter-spacing: .06em; text-transform: capitalize; border-radius: 5px; padding: 3px 8px; }
  .cd-status { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; border-radius: 20px; padding: 4px 10px; }
  .cd-status-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; flex-shrink: 0; }
  .cd-date { font-size: 12px; color: rgba(238,240,247,.28); white-space: nowrap; }

  /* Responder Notes cell */
  .cd-note-cell { max-width: 220px; }
  .cd-note-bubble {
    display: inline-flex; align-items: flex-start; gap: 7px;
    background: rgba(46,204,143,.07); border: 1px solid rgba(46,204,143,.2);
    border-radius: 8px; padding: 6px 10px; max-width: 100%; transition: background .2s;
  }
  .cd-note-bubble:hover { background: rgba(46,204,143,.12); }
  .cd-note-icon { color: #2ECC8F; flex-shrink: 0; margin-top: 1px; opacity: .7; }
  .cd-note-text { font-size: 11.5px; color: rgba(238,240,247,.75); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-style: italic; line-height: 1.4; }
  .cd-note-empty { font-size: 11px; color: rgba(238,240,247,.18); font-style: italic; }
  .cd-note-new {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 9px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
    color: #2ECC8F; background: rgba(46,204,143,.1); border: 1px solid rgba(46,204,143,.25);
    border-radius: 20px; padding: 2px 7px; margin-left: 6px; vertical-align: middle;
  }
  .cd-note-new-dot { width: 4px; height: 4px; border-radius: 50%; background: #2ECC8F; box-shadow: 0 0 5px #2ECC8F; animation: cd-pulse 2s ease infinite; }

  .cd-view-all { display: flex; align-items: center; justify-content: center; padding: 14px; border-top: 1px solid rgba(255,255,255,.06); }
  .cd-view-all a { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 500; color: rgba(238,240,247,.28); text-decoration: none; transition: color .2s; }
  .cd-view-all a:hover { color: #2ECC8F; }

  /* Empty / loading */
  .cd-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 24px; gap: 10px; text-align: center; }
  .cd-empty-icon { width: 52px; height: 52px; border-radius: 14px; background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.07); display: flex; align-items: center; justify-content: center; font-size: 20px; color: rgba(238,240,247,.28); margin-bottom: 4px; }
  .cd-empty-title { font-family: 'Cabinet Grotesk', sans-serif; font-size: 16px; font-weight: 700; color: rgba(238,240,247,.5); }
  .cd-empty-sub { font-size: 13px; color: rgba(238,240,247,.28); max-width: 260px; }
  .cd-empty-btn { margin-top: 8px; font-size: 13px; font-weight: 600; color: #2ECC8F; text-decoration: none; border: 1px solid rgba(46,204,143,.28); border-radius: 8px; padding: 9px 20px; background: rgba(46,204,143,.06); display: inline-flex; align-items: center; gap: 6px; transition: all .2s; }
  .cd-empty-btn:hover { background: rgba(46,204,143,.12); border-color: rgba(46,204,143,.45); }
  .cd-loading { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 52px; color: rgba(238,240,247,.28); font-size: 13px; }
  .cd-spin { width: 16px; height: 16px; border: 2px solid rgba(46,204,143,.2); border-top-color: #2ECC8F; border-radius: 50%; animation: cd-spin .75s linear infinite; }
  @keyframes cd-spin { to { transform: rotate(360deg); } }

  @media(max-width:640px){
    .cd-table th:nth-child(2), .cd-table td:nth-child(2),
    .cd-table th:nth-child(4), .cd-table td:nth-child(4) { display: none; }
  }
`;

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  "pending":     { label: "Pending",     color: "#FFD166", bg: "rgba(255,209,102,.1)" },
  "in-progress": { label: "In Progress", color: "#7B9EFF", bg: "rgba(123,158,255,.1)" },
  "resolved":    { label: "Resolved",    color: "#2ECC8F", bg: "rgba(46,204,143,.1)"  },
};

const TYPE_COLORS: Record<string, string> = {
  fire: "#FF6B6B", flood: "#7B9EFF", crime: "#FF9F43",
  medical: "#2ECC8F", accident: "#FFD166",
};

function getSeenNotes(): Set<string> {
  try {
    const raw = localStorage.getItem("cd_seen_notes");
    return new Set(raw ? JSON.parse(raw) : []);
  } catch { return new Set(); }
}
function markNoteSeen(id: string) {
  try {
    const s = getSeenNotes();
    s.add(id);
    localStorage.setItem("cd_seen_notes", JSON.stringify([...s]));
  } catch {}
}

export default function CitizenDashboard() {
  const navigate = useNavigate();
  const [reports, setReports]     = useState<any[]>([]);
  const [user, setUser]           = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [greeting, setGreeting]   = useState("Good morning");
  const [seenNotes, setSeenNotes] = useState<Set<string>>(getSeenNotes());

  useEffect(() => {
    const h = new Date().getHours();
    if (h >= 12 && h < 17) setGreeting("Good afternoon");
    else if (h >= 17)       setGreeting("Good evening");
    else                    setGreeting("Good morning");

    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("reports")
        .select("id, description, type, status, created_at, responder_notes, action_notes")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setReports(data ?? []);
      setLoading(false);
    };
    load();

    const ch = supabase.channel("cd-live")
      .on("postgres_changes", {
        event: "*", schema: "public", table: "reports",
      }, ({ eventType, new: n, old: o }) => {
        setReports(prev => {
          if (eventType === "INSERT") return [n, ...prev];
          if (eventType === "UPDATE") {
            const updated = n as any;
            if (updated.responder_notes || updated.action_notes) {
              setSeenNotes(s => {
                const next = new Set(s);
                next.delete(String(updated.id));
                return next;
              });
            }
            return prev.map(r => r.id === updated.id ? updated : r);
          }
          if (eventType === "DELETE") return prev.filter(r => r.id !== (o as any).id);
          return prev;
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, []);

  const getNoteText = (r: any): string =>
    (r.responder_notes ?? r.action_notes ?? "").trim();

  const total    = reports.length;
  const pending  = reports.filter(r => r.status === "pending").length;
  const inProg   = reports.filter(r => r.status === "in-progress").length;
  const resolved = reports.filter(r => r.status === "resolved").length;
  const newNotes = reports.filter(r => getNoteText(r) && !seenNotes.has(String(r.id))).length;

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Citizen";
  const firstName   = displayName.split(" ")[0];

  const CARDS = [
    { icon: <FaFileAlt size={19} />,      label: "Report Incident", desc: "File a new incident report quickly", to: "/report",          accent: "#FF6B6B", dim: "rgba(255,107,107,.12)", tag: "New",      primary: true  },
    { icon: <FaMapMarkedAlt size={19} />, label: "Safety Map",      desc: "View live incident zones near you",  to: "/map",             accent: "#2ECC8F", dim: "rgba(46,204,143,.12)",  tag: "Live",     primary: false },
    { icon: <FaHistory size={19} />,      label: "My Reports",      desc: "Track all your filed reports",       to: "/citizen/history", accent: "#7B9EFF", dim: "rgba(123,158,255,.12)", tag: `${total}`, primary: false },
    { icon: <FaLightbulb size={19} />,    label: "Safety Tips",     desc: "Preparedness & emergency guides",    to: "/safetytips",      accent: "#FFD166", dim: "rgba(255,209,102,.12)", tag: "Read",     primary: false },
  ];

  const STATS = [
    { label: "Total Filed",  value: total,    color: "#eef0f7", icon: <FaFileAlt />     },
    { label: "Pending",      value: pending,  color: "#FFD166", icon: <FaClock />       },
    { label: "In Progress",  value: inProg,   color: "#7B9EFF", icon: <FaSpinner />     },
    { label: "Resolved",     value: resolved, color: "#2ECC8F", icon: <FaCheckCircle /> },
  ];

  return (
    <>
      <style>{CSS}</style>
      <div className="cd-root">
        <div className="cd-bg" style={{ backgroundImage: `url(${pagesBackground})` }} />
        <div className="cd-glow"><div className="cd-glow-a" /><div className="cd-glow-b" /></div>
        <div className="cd-inner">

          {/* Hero */}
          <section className="cd-hero">
            <div className="cd-hero-tag"><span className="cd-hero-dot" />Citizen Portal</div>
            <h1 className="cd-hero-heading">{greeting},<br /><em>{firstName}.</em></h1>
            <p className="cd-hero-sub">Stay informed and keep your community safe.</p>
          </section>

          {/* Alert — pending reports */}
          {pending > 0 && (
            <div className="cd-alert">
              <FaExclamationCircle className="cd-alert-icon" />
              <span className="cd-alert-text">
                You have <strong>{pending} pending {pending === 1 ? "report" : "reports"}</strong> awaiting review.
              </span>
              <Link to="/citizen/history" className="cd-alert-link">View reports</Link>
            </div>
          )}

          {/* Alert — new responder notes */}
          {newNotes > 0 && (
            <div className="cd-alert" style={{ background: "rgba(46,204,143,.06)", borderColor: "rgba(46,204,143,.2)" }}>
              <FaStickyNote style={{ color: "#2ECC8F", flexShrink: 0 }} />
              <span className="cd-alert-text" style={{ color: "rgba(46,204,143,.85)" }}>
                <strong>{newNotes} {newNotes === 1 ? "report has" : "reports have"} new responder notes</strong> — check the table below.
              </span>
              <Link to="/citizen/history" className="cd-alert-link" style={{ color: "#2ECC8F", borderColor: "rgba(46,204,143,.25)" }}>
                View details
              </Link>
            </div>
          )}

          {/* Stats */}
          <div className="cd-stats">
            {STATS.map(s => (
              <div key={s.label} className="cd-stat" style={{ "--sc": s.color } as React.CSSProperties}>
                <div className="cd-stat-bar" />
                <div className="cd-stat-label">{s.label}</div>
                <div className="cd-stat-row">
                  <div className="cd-stat-value">{loading ? "—" : s.value}</div>
                  <div className="cd-stat-icon">{s.icon}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="cd-sec">
            <span className="cd-sec-label">Quick Actions</span>
            <span className="cd-sec-line" />
          </div>
          <div className="cd-cards">
            {CARDS.map(c => (
              <Link key={c.to} to={c.to}
                className={`cd-card${c.primary ? " cd-card-primary" : ""}`}
                style={{ "--ca": c.accent, "--cd": c.dim } as React.CSSProperties}
              >
                <div className="cd-card-hd">
                  <div className="cd-card-icon">{c.icon}</div>
                  <span className="cd-card-badge">{c.tag}</span>
                </div>
                <div className="cd-card-title">{c.label}</div>
                <div className="cd-card-desc">{c.desc}</div>
                <div className="cd-card-cta">Go <FaChevronRight size={9} /></div>
              </Link>
            ))}
          </div>

          {/* Recent Reports */}
          <div className="cd-sec">
            <span className="cd-sec-label">Recent Reports</span>
            <span className="cd-sec-line" />
            {reports.length > 0 && (
              <Link to="/citizen/history" className="cd-sec-link">
                View all <FaChevronRight size={9} />
              </Link>
            )}
          </div>

          <div className="cd-table-wrap">
            <div className="cd-table-top">
              <span className="cd-table-title">Your Incident Reports</span>
              <span className="cd-pill">{total} total</span>
            </div>

            {loading ? (
              <div className="cd-loading"><div className="cd-spin" />Loading your reports…</div>
            ) : reports.length === 0 ? (
              <div className="cd-empty">
                <div className="cd-empty-icon"><FaFileAlt /></div>
                <div className="cd-empty-title">No reports yet</div>
                <p className="cd-empty-sub">Help keep your community safe by filing your first incident report.</p>
                <Link to="/report" className="cd-empty-btn"><FaFileAlt size={12} />File a Report</Link>
              </div>
            ) : (
              <>
                <table className="cd-table">
                  <thead>
                    <tr>
                      <th>Incident</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Responder Notes</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.slice(0, 5).map(r => {
                      const s    = STATUS_CFG[r.status] ?? { label: r.status, color: "#eef0f7", bg: "rgba(255,255,255,.06)" };
                      const tc   = TYPE_COLORS[r.type?.toLowerCase()] || "rgba(238,240,247,.3)";
                      const note = getNoteText(r);
                      const isNew = note && !seenNotes.has(String(r.id));

                      return (
                        <tr
                          key={r.id}
                          onClick={() => {
                            if (note) {
                              markNoteSeen(String(r.id));
                              setSeenNotes(prev => { const n = new Set(prev); n.add(String(r.id)); return n; });
                            }
                            // ✅ FIXED: was /citizen/report/ — now matches the route /citizen/history/:id
                            navigate(`/citizen/history/${r.id}`);
                          }}
                        >
                          <td>
                            <div className="cd-rep-desc">
                              <div className="cd-rep-icon" style={{ color: tc, background: `${tc}15`, border: `1px solid ${tc}30` }}>
                                <FaExclamationCircle size={11} />
                              </div>
                              <span className="cd-rep-text" title={r.description}>{r.description || "—"}</span>
                            </div>
                          </td>
                          <td>
                            {r.type && (
                              <span className="cd-type-tag" style={{ color: tc, background: `${tc}10`, border: `1px solid ${tc}25` }}>
                                {r.type}
                              </span>
                            )}
                          </td>
                          <td>
                            <span className="cd-status" style={{ color: s.color, background: s.bg }}>
                              <span className="cd-status-dot" />{s.label}
                            </span>
                          </td>
                          <td className="cd-note-cell">
                            {note ? (
                              <div className="cd-note-bubble" title={note}>
                                <FaStickyNote size={10} className="cd-note-icon" />
                                <span className="cd-note-text">{note}</span>
                                {isNew && (
                                  <span className="cd-note-new">
                                    <span className="cd-note-new-dot" />New
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="cd-note-empty">No notes yet</span>
                            )}
                          </td>
                          <td>
                            <span className="cd-date">
                              {new Date(r.created_at).toLocaleDateString("en-PH", {
                                month: "short", day: "numeric", year: "numeric",
                              })}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {reports.length > 5 && (
                  <div className="cd-view-all">
                    <Link to="/citizen/history">See all {reports.length} reports <FaChevronRight size={10} /></Link>
                  </div>
                )}
              </>
            )}
          </div>

        </div>
      </div>
    </>
  );
}