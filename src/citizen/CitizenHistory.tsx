import { useEffect, useState } from "react";
import { supabase } from "../js/supabase";
import { Link } from "react-router-dom";
import {
  FaFileAlt, FaClock, FaSpinner, FaCheckCircle,
  FaExclamationCircle, FaChevronRight, 
  FaInbox,
} from "react-icons/fa";

// 1. Import the background image asset
import pagesBackground from "../assets/pagesbackground.png"; 

export default function CitizenHistory() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      const user = await supabase.auth.getUser();
      if (user.data?.user) {
        const { data, error } = await supabase
          .from("reports")
          .select("*")
          .eq("citizen_id", user.data.user.id)
          .order("created_at", { ascending: false });
        if (!error) setReports(data || []);
      }
      setLoading(false);
    };
    fetchReports();
  }, []);

  const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode; tip: string }> = {
    "pending":     { label: "Pending",     color: "#FFD166", bg: "rgba(255,209,102,0.1)",  icon: <FaClock size={10} />,       tip: "Awaiting responder review" },
    "in-progress": { label: "In Progress", color: "#7B9EFF", bg: "rgba(123,158,255,0.1)",  icon: <FaSpinner size={10} />,     tip: "Responder is currently handling this report" },
    "resolved":    { label: "Resolved",    color: "#2ECC8F", bg: "rgba(46,204,143,0.1)",   icon: <FaCheckCircle size={10} />, tip: "This report has been resolved" },
  };

  const typeColors: Record<string, string> = {
    fire: "#FF6B6B", flood: "#7B9EFF", crime: "#FF9F43",
    medical: "#2ECC8F", accident: "#FFD166",
  };

  const total    = reports.length;
  const pending  = reports.filter(r => r.status === "pending").length;
  const inProg   = reports.filter(r => r.status === "in-progress").length;
  const resolved = reports.filter(r => r.status === "resolved").length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@400;500;700;800;900&family=Instrument+Sans:wght@400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:         #080c14;
          --surface:    rgba(15, 21, 33, 0.75); /* Updated to semi-transparent for glassmorphism */
          --surface-2:  rgba(22, 29, 46, 0.85); /* Updated to semi-transparent */
          --border:     rgba(255,255,255,0.08);
          --border-2:   rgba(255,255,255,0.15);
          --text:       #eef0f7;
          --text-2:     rgba(238,240,247,0.75);
          --text-3:     rgba(238,240,247,0.45);
          --green:      #2ECC8F;
          --red:        #FF6B6B;
          --blue:       #7B9EFF;
          --yellow:     #FFD166;
          --font-display: 'Cabinet Grotesk', sans-serif;
          --font-body:    'Instrument Sans', sans-serif;
          --radius-sm:  8px;
          --radius-md:  14px;
          --radius-lg:  20px;
        }

        /* 2. Updated container to handle the background image with a dark overlay */
        .ch { 
          min-height: 100vh; 
          font-family: var(--font-body); 
          color: var(--text); 
          position: relative; 
          overflow-x: hidden;
          background: linear-gradient(to bottom, rgba(8, 12, 20, 0.75), rgba(8, 12, 20, 0.9)), url(${pagesBackground});
          background-size: cover;
          background-position: center;
          background-attachment: fixed;
        }

        .ch-glow { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
        .ch-glow-1 { position: absolute; width: 600px; height: 600px; border-radius: 50%; background: radial-gradient(circle, rgba(46,204,143,0.07) 0%, transparent 70%); top: -200px; left: -100px; }
        .ch-glow-2 { position: absolute; width: 500px; height: 500px; border-radius: 50%; background: radial-gradient(circle, rgba(123,158,255,0.06) 0%, transparent 70%); bottom: -150px; right: -50px; }
        .ch-noise { position: fixed; inset: 0; opacity: 0.025; pointer-events: none; z-index: 0; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); background-size: 200px; }

        .ch-inner { position: relative; z-index: 1; max-width: 1080px; margin: 0 auto; padding: 0 24px 80px; }

        /* Nav */
        .ch-nav { display: flex; align-items: center; justify-content: space-between; padding: 24px 0 0; animation: fadeDown 0.5s ease both; }
        .ch-logo { display: flex; align-items: center; gap: 9px; text-decoration: none; }
        .ch-logo-text { font-family: var(--font-display); font-size: 16px; font-weight: 800; letter-spacing: -0.01em; color: var(--text); }
        .ch-logo-text span { color: var(--green); }
        .ch-back { display: inline-flex; align-items: center; gap: 7px; font-size: 12.5px; font-weight: 500; color: var(--text-2); text-decoration: none; border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 7px 14px; background: var(--surface); transition: all 0.2s; backdrop-filter: blur(8px); }
        .ch-back:hover { color: var(--text); border-color: var(--border-2); background: var(--surface-2); }

        /* Hero */
        .ch-hero { margin-top: 48px; margin-bottom: 32px; animation: fadeUp 0.6s 0.05s ease both; }
        .ch-hero-tag { display: inline-flex; align-items: center; gap: 7px; font-size: 11px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: var(--green); margin-bottom: 16px; }
        .ch-hero-tag-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); box-shadow: 0 0 8px var(--green); animation: pulse 2.2s ease infinite; }
        @keyframes pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.8); } }
        .ch-hero-heading { font-family: var(--font-display); font-size: clamp(28px, 4vw, 42px); font-weight: 900; line-height: 1.05; letter-spacing: -0.035em; color: var(--text); margin-bottom: 8px; }
        .ch-hero-heading em { font-style: normal; color: var(--green); }
        .ch-hero-sub { font-size: 14px; color: var(--text-2); line-height: 1.6; }

        /* Stats */
        .ch-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 32px; animation: fadeUp 0.6s 0.1s ease both; }
        @media (max-width: 680px) { .ch-stats { grid-template-columns: repeat(2, 1fr); } }
        .ch-stat { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 20px 18px; position: relative; overflow: hidden; transition: border-color 0.2s, transform 0.2s; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
        .ch-stat:hover { border-color: var(--border-2); transform: translateY(-2px); }
        .ch-stat-bar { position: absolute; top: 0; left: 0; right: 0; height: 2px; background: var(--stat-color); opacity: 0.5; }
        .ch-stat-label { font-size: 10.5px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-2); margin-bottom: 12px; }
        .ch-stat-row { display: flex; align-items: flex-end; justify-content: space-between; }
        .ch-stat-value { font-family: var(--font-display); font-size: 38px; font-weight: 900; line-height: 1; color: var(--stat-color); letter-spacing: -0.04em; }
        .ch-stat-icon { font-size: 20px; color: var(--stat-color); opacity: 0.3; margin-bottom: 2px; }

        /* Section header */
        .ch-section-head { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; }
        .ch-section-label { font-size: 10.5px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: var(--text-2); white-space: nowrap; }
        .ch-section-line { flex: 1; height: 1px; background: linear-gradient(90deg, var(--border-2), transparent); }
        .ch-section-count { font-size: 11px; font-weight: 600; color: var(--text-2); background: rgba(255,255,255,0.06); border: 1px solid var(--border); border-radius: 20px; padding: 3px 10px; white-space: nowrap; }

        /* Report list */
        .ch-list { display: flex; flex-direction: column; gap: 10px; animation: fadeUp 0.6s 0.15s ease both; }

        .ch-report-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; text-decoration: none; color: inherit; display: flex; align-items: stretch; transition: border-color 0.22s, transform 0.22s, background 0.22s; position: relative; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
        .ch-report-card:hover { border-color: var(--border-2); transform: translateX(3px); background: var(--surface-2); }
        .ch-report-accent { width: 3px; flex-shrink: 0; background: var(--card-color); opacity: 0.6; }
        .ch-report-body { display: flex; align-items: center; gap: 14px; padding: 16px 18px; flex: 1; min-width: 0; }
        .ch-report-icon { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
        .ch-report-info { flex: 1; min-width: 0; }
        .ch-report-desc { font-family: var(--font-display); font-size: 14px; font-weight: 700; color: var(--text); letter-spacing: -0.01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 5px; }
        .ch-report-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .ch-report-date { font-size: 11.5px; color: var(--text-2); opacity: 0.8; }
        .ch-report-type { font-size: 10.5px; font-weight: 600; letter-spacing: 0.05em; text-transform: capitalize; border-radius: 5px; padding: 2px 8px; }
        .ch-report-right { display: flex; align-items: center; gap: 12px; padding-right: 18px; flex-shrink: 0; }
        .ch-status { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; border-radius: 20px; padding: 4px 10px; cursor: help; }
        .ch-status-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; flex-shrink: 0; }
        .ch-chevron { color: var(--text-3); font-size: 11px; transition: color 0.2s, transform 0.2s; }
        .ch-report-card:hover .ch-chevron { color: var(--text-2); transform: translateX(2px); }

        /* Empty state */
        .ch-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 72px 24px; gap: 12px; text-align: center; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); animation: fadeUp 0.6s 0.15s ease both; backdrop-filter: blur(12px); }
        .ch-empty-icon { width: 56px; height: 56px; border-radius: 16px; background: rgba(255,255,255,0.03); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 22px; color: var(--text-2); margin-bottom: 4px; }
        .ch-empty-title { font-family: var(--font-display); font-size: 17px; font-weight: 700; color: var(--text-2); }
        .ch-empty-sub { font-size: 13px; color: var(--text-2); opacity: 0.8; max-width: 280px; line-height: 1.6; }
        .ch-empty-btn { margin-top: 6px; font-size: 13px; font-weight: 600; color: var(--green); text-decoration: none; border: 1px solid rgba(46,204,143,0.28); border-radius: var(--radius-sm); padding: 9px 22px; background: rgba(46,204,143,0.06); display: inline-flex; align-items: center; gap: 7px; transition: all 0.2s; }
        .ch-empty-btn:hover { background: rgba(46,204,143,0.12); border-color: rgba(46,204,143,0.45); }

        /* Loading */
        .ch-loading { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 72px; color: var(--text-2); font-size: 13px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); backdrop-filter: blur(12px); }
        .ch-spin { width: 16px; height: 16px; border: 2px solid rgba(46,204,143,0.2); border-top-color: var(--green); border-radius: 50%; animation: spin 0.75s linear infinite; }

        @keyframes spin     { to { transform: rotate(360deg); } }
        @keyframes fadeDown { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeUp   { from { opacity: 0; transform: translateY(18px);  } to { opacity: 1; transform: translateY(0); } }

        @media (max-width: 600px) {
          .ch-report-type { display: none; }
          .ch-report-right { gap: 8px; padding-right: 14px; }
        }
      `}</style>

      <div className="ch">
        <div className="ch-glow"><div className="ch-glow-1" /><div className="ch-glow-2" /></div>
        <div className="ch-noise" />
        <div className="ch-inner">

          {/* Nav */}
          <nav className="ch-nav">
            <Link to="/" className="ch-logo">
              <span className="ch-logo-text">CITI<span>ZEN</span></span>
            </Link>
            <Link to="/citizen/dashboard" className="ch-back">
              ← Dashboard
            </Link>
          </nav>

          {/* Hero */}
          <section className="ch-hero">
            <div className="ch-hero-tag"><span className="ch-hero-tag-dot" />My Reports</div>
            <h1 className="ch-hero-heading">Report <em>History</em></h1>
            <p className="ch-hero-sub">A full log of every incident you've submitted.</p>
          </section>

          {/* Stats */}
          <div className="ch-stats">
            {[
              { label: "Total Filed",  value: total,    color: "var(--text)",   icon: <FaFileAlt />     },
              { label: "Pending",      value: pending,  color: "var(--yellow)", icon: <FaClock />       },
              { label: "In Progress",  value: inProg,   color: "var(--blue)",   icon: <FaSpinner />     },
              { label: "Resolved",     value: resolved, color: "var(--green)",  icon: <FaCheckCircle /> },
            ].map(s => (
              <div key={s.label} className="ch-stat" style={{ "--stat-color": s.color } as React.CSSProperties}>
                <div className="ch-stat-bar" />
                <div className="ch-stat-label">{s.label}</div>
                <div className="ch-stat-row">
                  <div className="ch-stat-value">{s.value}</div>
                  <div className="ch-stat-icon">{s.icon}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Section header */}
          <div className="ch-section-head">
            <span className="ch-section-label">All Reports</span>
            <span className="ch-section-line" />
            <span className="ch-section-count">{total} total</span>
          </div>

          {/* List */}
          {loading ? (
            <div className="ch-loading"><div className="ch-spin" />Loading your reports…</div>
          ) : reports.length === 0 ? (
            <div className="ch-empty">
              <div className="ch-empty-icon"><FaInbox /></div>
              <div className="ch-empty-title">No reports yet</div>
              <p className="ch-empty-sub">You haven't submitted any incident reports. Help keep your community safe by filing one.</p>
              <Link to="/report" className="ch-empty-btn"><FaFileAlt size={12} /> File a Report</Link>
            </div>
          ) : (
            <div className="ch-list">
              {reports.map(report => {
                const s = statusConfig[report.status] ?? { label: report.status, color: "var(--text-2)", bg: "rgba(255,255,255,0.06)", icon: <FaExclamationCircle size={10} />, tip: "" };
                const typeColor = typeColors[report.type?.toLowerCase()] || "var(--text-3)";
                return (
                  <Link key={report.id} to={`/citizen/report/${report.id}`} className="ch-report-card"
                    style={{ "--card-color": s.color } as React.CSSProperties}>
                    <div className="ch-report-accent" />
                    <div className="ch-report-body">
                      <div className="ch-report-icon" style={{ background: `${typeColor}12`, border: `1px solid ${typeColor}28`, color: typeColor }}>
                        <FaExclamationCircle />
                      </div>
                      <div className="ch-report-info">
                        <div className="ch-report-desc" title={report.description}>{report.description || "No description"}</div>
                        <div className="ch-report-meta">
                          <span className="ch-report-date">
                            {new Date(report.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                          {report.type && (
                            <span className="ch-report-type" style={{ color: typeColor, background: `${typeColor}10`, border: `1px solid ${typeColor}25` }}>
                              {report.type}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="ch-report-right">
                      <span className="ch-status" style={{ color: s.color, background: s.bg }} title={s.tip}>
                        <span className="ch-status-dot" />{s.label}
                      </span>
                      <FaChevronRight className="ch-chevron" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </>
  );
}