// src/citizen/CitizenReportDetail.tsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../js/supabase";
import {
  FaArrowLeft, FaMapMarkerAlt, FaTag, FaClock,
  FaCheckCircle, FaSpinner, FaPaperclip, FaStickyNote,
  FaExclamationCircle, FaExternalLinkAlt,
} from "react-icons/fa";

import pageBg from "../assets/pagesbackground.png";

export default function CitizenReportDetail() {
  const { id } = useParams();
  const [report,  setReport]  = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    // ✅ FIX: fetch everything from the reports row itself.
    //    responder_notes / action_notes live on the report record —
    //    there is no separate responder_notes table in this schema.
    const fetchReport = async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("id", id)
        .single();
      if (!error && data) setReport(data);
      setLoading(false);
    };

    fetchReport();

    // ✅ Real-time: update the card when the responder changes status / adds notes
    const ch = supabase
      .channel(`report-detail-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "reports", filter: `id=eq.${id}` },
        ({ new: updated }) => setReport(updated)
      )
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [id]);

  const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    "pending":     { label: "Pending",     color: "#FFD166", bg: "rgba(255,209,102,0.1)",  icon: <FaClock size={11} />       },
    "in-progress": { label: "In Progress", color: "#7B9EFF", bg: "rgba(123,158,255,0.1)",  icon: <FaSpinner size={11} />     },
    "resolved":    { label: "Resolved",    color: "#2ECC8F", bg: "rgba(46,204,143,0.1)",   icon: <FaCheckCircle size={11} /> },
  };

  const typeColors: Record<string, string> = {
    fire: "#FF6B6B", flood: "#7B9EFF", crime: "#FF9F43",
    medical: "#2ECC8F", accident: "#FFD166",
  };

  const s         = report ? (statusConfig[report.status] ?? { label: report.status, color: "#eef0f7", bg: "rgba(255,255,255,.06)", icon: <FaExclamationCircle size={11} /> }) : null;
  const typeColor = report ? (typeColors[report.type?.toLowerCase()] || "#7B9EFF") : "#7B9EFF";

  // ✅ FIX: pull note text from the two columns that actually exist
  const noteText = report
    ? (report.responder_notes ?? report.action_notes ?? "").trim()
    : "";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@400;500;700;800;900&family=Instrument+Sans:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #080c14; --surface: #0f1521; --surface-2: #161d2e;
          --border: rgba(255,255,255,0.06); --border-2: rgba(255,255,255,0.10);
          --text: #eef0f7; --text-2: rgba(238,240,247,0.55); --text-3: rgba(238,240,247,0.25);
          --green: #2ECC8F; --red: #FF6B6B; --blue: #7B9EFF; --yellow: #FFD166;
          --font-display: 'Cabinet Grotesk', sans-serif;
          --font-body: 'Instrument Sans', sans-serif;
          --radius-sm: 8px; --radius-md: 14px; --radius-lg: 20px;
        }
        body { background: var(--bg); }

        .rd { min-height: 100vh; font-family: var(--font-body); color: var(--text); position: relative; overflow-x: hidden; }
        .rd-bg { position: fixed; inset: 0; z-index: 0; background-image: url('${pageBg}'); background-size: cover; background-position: center; }
        .rd-bg::after { content: ''; position: absolute; inset: 0; background: rgba(8,12,20,0.82); }
        .rd-glow { position: fixed; inset: 0; pointer-events: none; z-index: 1; overflow: hidden; }
        .rd-glow-1 { position: absolute; width: 600px; height: 600px; border-radius: 50%; background: radial-gradient(circle, rgba(46,204,143,0.07) 0%, transparent 70%); top: -200px; left: -100px; }
        .rd-glow-2 { position: absolute; width: 500px; height: 500px; border-radius: 50%; background: radial-gradient(circle, rgba(123,158,255,0.06) 0%, transparent 70%); bottom: -150px; right: -50px; }
        .rd-noise { position: fixed; inset: 0; opacity: 0.025; pointer-events: none; z-index: 1; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); background-size: 200px; }
        .rd-inner { position: relative; z-index: 2; max-width: 860px; margin: 0 auto; padding: 0 24px 80px; }

        /* Nav */
        .rd-nav { display: flex; align-items: center; justify-content: space-between; padding: 24px 0 0; animation: fadeDown .5s ease both; }
        .rd-logo { display: flex; align-items: center; gap: 9px; text-decoration: none; }
        .rd-logo-text { font-family: var(--font-display); font-size: 16px; font-weight: 800; letter-spacing: -.01em; color: var(--text); }
        .rd-logo-text span { color: var(--green); }
        .rd-back { display: inline-flex; align-items: center; gap: 7px; font-size: 12.5px; font-weight: 500; color: var(--text-3); text-decoration: none; border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 7px 14px; background: var(--surface); transition: all .2s; }
        .rd-back:hover { color: var(--text); border-color: var(--border-2); background: var(--surface-2); }

        /* Hero */
        .rd-hero { margin-top: 40px; margin-bottom: 28px; animation: fadeUp .6s .05s ease both; }
        .rd-hero-tag { display: inline-flex; align-items: center; gap: 7px; font-size: 11px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: var(--green); margin-bottom: 14px; }
        .rd-hero-tag-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); box-shadow: 0 0 8px var(--green); animation: pulse 2.2s ease infinite; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1);}50%{opacity:.5;transform:scale(.8);} }
        .rd-hero-heading { font-family: var(--font-display); font-size: clamp(22px,3.5vw,34px); font-weight: 900; line-height: 1.1; letter-spacing: -.03em; color: var(--text); margin-bottom: 6px; }
        .rd-hero-sub { font-size: 13px; color: var(--text-3); }

        /* Section heads */
        .rd-section-head { display: flex; align-items: center; gap: 14px; margin-bottom: 14px; }
        .rd-section-label { font-size: 10.5px; font-weight: 600; letter-spacing: .16em; text-transform: uppercase; color: var(--text-3); white-space: nowrap; }
        .rd-section-line { flex: 1; height: 1px; background: linear-gradient(90deg, var(--border-2), transparent); }

        /* Detail card */
        .rd-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; margin-bottom: 20px; animation: fadeUp .6s .1s ease both; backdrop-filter: blur(16px); }
        .rd-card-top { padding: 22px 24px 20px; border-bottom: 1px solid var(--border); display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
        .rd-card-top-left { display: flex; align-items: flex-start; gap: 14px; }
        .rd-card-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 16px; }
        .rd-desc { font-family: var(--font-display); font-size: 17px; font-weight: 700; color: var(--text); line-height: 1.3; letter-spacing: -.015em; }
        .rd-desc-sub { font-size: 12px; color: var(--text-3); margin-top: 4px; }
        .rd-status { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; border-radius: 20px; padding: 5px 12px; flex-shrink: 0; }
        .rd-status-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; flex-shrink: 0; }

        /* Meta grid */
        .rd-meta-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 0; }
        @media(max-width:560px){ .rd-meta-grid { grid-template-columns: 1fr; } }
        .rd-meta-item { padding: 16px 24px; border-right: 1px solid var(--border); border-bottom: 1px solid var(--border); display: flex; align-items: flex-start; gap: 12px; transition: background .15s; }
        .rd-meta-item:hover { background: rgba(255,255,255,.015); }
        .rd-meta-item:nth-child(even) { border-right: none; }
        .rd-meta-item:nth-last-child(-n+2) { border-bottom: none; }
        @media(max-width:560px){
          .rd-meta-item { border-right: none; }
          .rd-meta-item:last-child { border-bottom: none; }
          .rd-meta-item:nth-last-child(-n+2) { border-bottom: 1px solid var(--border); }
          .rd-meta-item:last-child { border-bottom: none; }
        }
        .rd-meta-icon { width: 30px; height: 30px; border-radius: 8px; background: rgba(255,255,255,.04); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; color: var(--text-3); font-size: 12px; flex-shrink: 0; margin-top: 1px; }
        .rd-meta-label { font-size: 10px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: var(--text-3); margin-bottom: 4px; }
        .rd-meta-value { font-size: 13px; font-weight: 500; color: var(--text-2); line-height: 1.4; }
        .rd-type-tag { font-size: 11px; font-weight: 600; letter-spacing: .06em; text-transform: capitalize; border-radius: 6px; padding: 3px 9px; display: inline-block; }

        /* Evidence image */
        .rd-evidence-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; margin-bottom: 20px; animation: fadeUp .6s .15s ease both; backdrop-filter: blur(16px); }
        .rd-evidence-head { padding: 16px 22px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
        .rd-evidence-title { font-family: var(--font-display); font-size: 14px; font-weight: 700; color: var(--text); }
        .rd-evidence-body { padding: 20px 22px; display: flex; flex-direction: column; gap: 12px; }
        .rd-evidence-img { width: 100%; max-height: 340px; object-fit: cover; border-radius: 10px; border: 1px solid var(--border); }
        .rd-evidence-link { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: var(--blue); text-decoration: none; padding: 7px 12px; background: rgba(123,158,255,.08); border: 1px solid rgba(123,158,255,.18); border-radius: 7px; width: fit-content; transition: background .18s; }
        .rd-evidence-link:hover { background: rgba(123,158,255,.15); }
        .rd-evidence-empty { padding: 32px 22px; text-align: center; }
        .rd-evidence-empty-icon { width: 40px; height: 40px; border-radius: 10px; background: rgba(255,255,255,.03); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 16px; color: var(--text-3); margin: 0 auto 10px; }
        .rd-evidence-empty-text { font-size: 13px; color: var(--text-3); }

        /* Responder note card */
        .rd-note-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; animation: fadeUp .6s .2s ease both; backdrop-filter: blur(16px); margin-bottom: 20px; }
        .rd-note-head { padding: 16px 22px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
        .rd-note-title { font-family: var(--font-display); font-size: 14px; font-weight: 700; color: var(--text); }
        .rd-note-badge { font-size: 10px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #2ECC8F; background: rgba(46,204,143,.1); border: 1px solid rgba(46,204,143,.22); border-radius: 20px; padding: 3px 9px; }
        .rd-note-body { padding: 20px 22px; display: flex; gap: 14px; }
        .rd-note-timeline { display: flex; flex-direction: column; align-items: center; gap: 0; flex-shrink: 0; }
        .rd-note-dot { width: 8px; height: 8px; border-radius: 50%; background: #2ECC8F; box-shadow: 0 0 8px rgba(46,204,143,.4); flex-shrink: 0; margin-top: 4px; }
        .rd-note-content { flex: 1; }
        .rd-note-time { font-size: 10.5px; font-weight: 600; letter-spacing: .06em; color: var(--text-3); margin-bottom: 7px; text-transform: uppercase; }
        .rd-note-msg { font-size: 14px; color: var(--text-2); line-height: 1.6; }
        .rd-note-empty { padding: 36px 22px; text-align: center; }
        .rd-note-empty-icon { width: 40px; height: 40px; border-radius: 10px; background: rgba(255,255,255,.03); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 16px; color: var(--text-3); margin: 0 auto 10px; }
        .rd-note-empty-title { font-size: 13px; font-weight: 600; color: var(--text-3); margin-bottom: 4px; }
        .rd-note-empty-sub { font-size: 12px; color: var(--text-3); opacity: .7; }

        /* Status timeline */
        .rd-timeline-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; animation: fadeUp .6s .25s ease both; backdrop-filter: blur(16px); }
        .rd-timeline-head { padding: 16px 22px; border-bottom: 1px solid var(--border); }
        .rd-timeline-title { font-family: var(--font-display); font-size: 14px; font-weight: 700; color: var(--text); }
        .rd-timeline-body { padding: 20px 22px; display: flex; flex-direction: column; gap: 0; }
        .rd-tl-step { display: flex; gap: 14px; padding-bottom: 20px; position: relative; }
        .rd-tl-step:last-child { padding-bottom: 0; }
        .rd-tl-step:not(:last-child)::before { content: ''; position: absolute; left: 11px; top: 22px; bottom: 0; width: 1px; background: linear-gradient(to bottom, rgba(255,255,255,.08), transparent); }
        .rd-tl-dot { width: 22px; height: 22px; border-radius: 50%; border: 1px solid rgba(255,255,255,.1); background: rgba(255,255,255,.04); display: flex; align-items: center; justify-content: center; font-size: 9px; flex-shrink: 0; margin-top: 1px; }
        .rd-tl-dot--done   { background: rgba(46,204,143,.15); border-color: #2ECC8F; color: #2ECC8F; }
        .rd-tl-dot--active { background: rgba(123,158,255,.15); border-color: #7B9EFF; color: #7B9EFF; }
        .rd-tl-label { font-size: 13px; font-weight: 600; color: var(--text-2); margin-bottom: 2px; }
        .rd-tl-sub { font-size: 11.5px; color: var(--text-3); }

        /* Loading */
        .rd-loading { display: flex; align-items: center; justify-content: center; gap: 10px; min-height: 100vh; color: var(--text-3); font-size: 13px; position: relative; z-index: 2; }
        .rd-spin { width: 16px; height: 16px; border: 2px solid rgba(46,204,143,.2); border-top-color: var(--green); border-radius: 50%; animation: spin .75s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeDown { from{opacity:0;transform:translateY(-12px);}to{opacity:1;transform:translateY(0);} }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(18px); }to{opacity:1;transform:translateY(0);} }
      `}</style>

      <div className="rd">
        <div className="rd-bg" />
        <div className="rd-glow"><div className="rd-glow-1" /><div className="rd-glow-2" /></div>
        <div className="rd-noise" />

        {loading || !report ? (
          <div className="rd-loading">
            <div className="rd-spin" />Loading report details…
          </div>
        ) : (
          <div className="rd-inner">

            {/* Nav */}
            <nav className="rd-nav">
              <Link to="/citizen/dashboard" className="rd-logo">
                <span className="rd-logo-text">CITI<span>ZEN</span></span>
              </Link>
              <Link to="/citizen/history" className="rd-back">
                <FaArrowLeft size={10} /> Back to History
              </Link>
            </nav>

            {/* Hero */}
            <div className="rd-hero">
              <div className="rd-hero-tag"><span className="rd-hero-tag-dot" />Report Detail</div>
              <h1 className="rd-hero-heading">Incident Report</h1>
              <p className="rd-hero-sub">
                Filed on {new Date(report.created_at).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>

            {/* ── Report Info ── */}
            <div className="rd-section-head">
              <span className="rd-section-label">Report Info</span>
              <span className="rd-section-line" />
            </div>

            <div className="rd-card">
              <div className="rd-card-top">
                <div className="rd-card-top-left">
                  <div className="rd-card-icon" style={{ background: `${typeColor}12`, border: `1px solid ${typeColor}30`, color: typeColor }}>
                    <FaExclamationCircle />
                  </div>
                  <div>
                    <div className="rd-desc">{report.description || "No description provided"}</div>
                    <div className="rd-desc-sub">ID: {report.id}</div>
                  </div>
                </div>
                {s && (
                  <span className="rd-status" style={{ color: s.color, background: s.bg }}>
                    <span className="rd-status-dot" />{s.label}
                  </span>
                )}
              </div>

              <div className="rd-meta-grid">
                <div className="rd-meta-item">
                  <div className="rd-meta-icon"><FaTag size={11} /></div>
                  <div>
                    <div className="rd-meta-label">Type</div>
                    <div className="rd-meta-value">
                      {report.type ? (
                        <span className="rd-type-tag" style={{ color: typeColor, background: `${typeColor}10`, border: `1px solid ${typeColor}25` }}>
                          {report.type}
                        </span>
                      ) : "—"}
                    </div>
                  </div>
                </div>
                <div className="rd-meta-item">
                  <div className="rd-meta-icon"><FaMapMarkerAlt size={11} /></div>
                  <div>
                    <div className="rd-meta-label">Location</div>
                    <div className="rd-meta-value">{report.address || report.location || "Not specified"}</div>
                  </div>
                </div>
                <div className="rd-meta-item">
                  <div className="rd-meta-icon"><FaClock size={11} /></div>
                  <div>
                    <div className="rd-meta-label">Submitted</div>
                    <div className="rd-meta-value">
                      {new Date(report.created_at).toLocaleString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
                <div className="rd-meta-item">
                  <div className="rd-meta-icon"><FaTag size={11} /></div>
                  <div>
                    <div className="rd-meta-label">Reporter</div>
                    <div className="rd-meta-value">{report.reporter_name || "Anonymous"}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Status Timeline ── */}
            <div className="rd-section-head" style={{ marginTop: 28 }}>
              <span className="rd-section-label">Report Progress</span>
              <span className="rd-section-line" />
            </div>

            <div className="rd-timeline-card">
              <div className="rd-timeline-head">
                <div className="rd-timeline-title">Status Timeline</div>
              </div>
              <div className="rd-timeline-body">
                {[
                  { key: "pending",     label: "Submitted",    sub: "Your report has been received by the system." },
                  { key: "in-progress", label: "In Progress",  sub: "A responder has been assigned and is investigating." },
                  { key: "resolved",    label: "Resolved",     sub: "The incident has been handled and closed." },
                ].map((step, i) => {
                  const statuses  = ["pending", "in-progress", "resolved"];
                  const curIndex  = statuses.indexOf(report.status);
                  const stepIndex = statuses.indexOf(step.key);
                  const isDone    = stepIndex < curIndex;
                  const isActive  = stepIndex === curIndex;
                  return (
                    <div key={step.key} className="rd-tl-step">
                      <div className={`rd-tl-dot ${isDone ? "rd-tl-dot--done" : isActive ? "rd-tl-dot--active" : ""}`}>
                        {isDone ? "✓" : i + 1}
                      </div>
                      <div>
                        <div className="rd-tl-label" style={{ color: isActive ? "#eef0f7" : isDone ? "rgba(46,204,143,.7)" : "rgba(238,240,247,.25)" }}>
                          {step.label}
                        </div>
                        <div className="rd-tl-sub">{step.sub}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Evidence ── */}
            <div className="rd-section-head" style={{ marginTop: 28 }}>
              <span className="rd-section-label">Evidence</span>
              <span className="rd-section-line" />
            </div>

            <div className="rd-evidence-card">
              <div className="rd-evidence-head">
                <span className="rd-evidence-title">Uploaded Evidence</span>
              </div>
              {report.evidence_url ? (
                <div className="rd-evidence-body">
                  {/\.(jpe?g|png|gif|webp)$/i.test(report.evidence_url) ? (
                    <img src={report.evidence_url} alt="Evidence" className="rd-evidence-img" />
                  ) : null}
                  <a href={report.evidence_url} target="_blank" rel="noopener noreferrer" className="rd-evidence-link">
                    <FaExternalLinkAlt size={10} /> View / Download Evidence
                  </a>
                </div>
              ) : (
                <div className="rd-evidence-empty">
                  <div className="rd-evidence-empty-icon"><FaPaperclip /></div>
                  <p className="rd-evidence-empty-text">No evidence was uploaded for this report.</p>
                </div>
              )}
            </div>

            {/* ── Responder Notes ── */}
            <div className="rd-section-head" style={{ marginTop: 28 }}>
              <span className="rd-section-label">Responder Updates</span>
              <span className="rd-section-line" />
            </div>

            <div className="rd-note-card">
              <div className="rd-note-head">
                <span className="rd-note-title">Responder Notes</span>
                {noteText && <span className="rd-note-badge">✓ Has Update</span>}
              </div>
              {noteText ? (
                <div className="rd-note-body">
                  <div className="rd-note-timeline">
                    <div className="rd-note-dot" />
                  </div>
                  <div className="rd-note-content">
                    <div className="rd-note-time">
                      {report.updated_at
                        ? new Date(report.updated_at).toLocaleString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })
                        : "Responder update"}
                    </div>
                    <div className="rd-note-msg">{noteText}</div>
                  </div>
                </div>
              ) : (
                <div className="rd-note-empty">
                  <div className="rd-note-empty-icon"><FaStickyNote /></div>
                  <div className="rd-note-empty-title">No updates yet</div>
                  <p className="rd-note-empty-sub">
                    A responder will add notes here once they begin investigating your report.
                  </p>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </>
  );
}