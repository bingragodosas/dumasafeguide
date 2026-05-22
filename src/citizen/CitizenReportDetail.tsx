import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../js/supabase";
import {
  FaArrowLeft, FaMapMarkerAlt, FaTag, FaClock,
  FaCheckCircle, FaSpinner, FaPaperclip, FaStickyNote,
  FaExclamationCircle, FaFileAlt, FaExternalLinkAlt,
} from "react-icons/fa";

import pageBg from "../assets/pagesbackground.png";

export default function CitizenReportDetail() {
  const { id } = useParams();
  const [report, setReport] = useState<any>(null);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("id", id)
        .single();
      if (!error) setReport(data);
    };

    const fetchAttachments = async () => {
      const { data } = await supabase
        .from("report_attachments")
        .select("*")
        .eq("report_id", id);
      setAttachments(data || []);
    };

    const fetchNotes = async () => {
      const { data } = await supabase
        .from("responder_notes")
        .select("*")
        .eq("report_id", id)
        .order("created_at", { ascending: true });
      setNotes(data || []);
      setLoading(false);
    };

    fetchReport();
    fetchAttachments();
    fetchNotes();
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

  const s = report ? (statusConfig[report.status] ?? { label: report.status, color: "var(--text)", bg: "rgba(255,255,255,0.06)", icon: <FaExclamationCircle size={11} /> }) : null;
  const typeColor = report ? (typeColors[report.type?.toLowerCase()] || "#7B9EFF") : "#7B9EFF";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@400;500;700;800;900&family=Instrument+Sans:wght@400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:         #080c14;
          --surface:    #0f1521;
          --surface-2:  #161d2e;
          --border:     rgba(255,255,255,0.06);
          --border-2:   rgba(255,255,255,0.10);
          --text:       #eef0f7;
          --text-2:     rgba(238,240,247,0.55);
          --text-3:     rgba(238,240,247,0.25);
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

        body { background: var(--bg); }

        .rd {
          min-height: 100vh;
          font-family: var(--font-body);
          color: var(--text);
          position: relative;
          overflow-x: hidden;
        }

        /* Background image layer */
        .rd-bg {
          position: fixed;
          inset: 0;
          z-index: 0;
          background-image: url('${pageBg}');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }
        /* Dark overlay so the existing dark theme stays readable */
        .rd-bg::after {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(8, 12, 20, 0.82);
        }

        .rd-glow { position: fixed; inset: 0; pointer-events: none; z-index: 1; overflow: hidden; }
        .rd-glow-1 { position: absolute; width: 600px; height: 600px; border-radius: 50%; background: radial-gradient(circle, rgba(46,204,143,0.07) 0%, transparent 70%); top: -200px; left: -100px; }
        .rd-glow-2 { position: absolute; width: 500px; height: 500px; border-radius: 50%; background: radial-gradient(circle, rgba(123,158,255,0.06) 0%, transparent 70%); bottom: -150px; right: -50px; }
        .rd-noise { position: fixed; inset: 0; opacity: 0.025; pointer-events: none; z-index: 1; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); background-size: 200px; }

        .rd-inner { position: relative; z-index: 2; max-width: 860px; margin: 0 auto; padding: 0 24px 80px; }

        /* Nav */
        .rd-nav { display: flex; align-items: center; justify-content: space-between; padding: 24px 0 0; animation: fadeDown 0.5s ease both; }
        .rd-logo { display: flex; align-items: center; gap: 9px; text-decoration: none; }
        .rd-logo-text { font-family: var(--font-display); font-size: 16px; font-weight: 800; letter-spacing: -0.01em; color: var(--text); }
        .rd-logo-text span { color: var(--green); }

        /* Back button */
        .rd-back { display: inline-flex; align-items: center; gap: 7px; font-size: 12.5px; font-weight: 500; color: var(--text-3); text-decoration: none; border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 7px 14px; background: var(--surface); transition: all 0.2s; }
        .rd-back:hover { color: var(--text); border-color: var(--border-2); background: var(--surface-2); }

        /* Hero */
        .rd-hero { margin-top: 40px; margin-bottom: 28px; animation: fadeUp 0.6s 0.05s ease both; }
        .rd-hero-tag { display: inline-flex; align-items: center; gap: 7px; font-size: 11px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: var(--green); margin-bottom: 14px; }
        .rd-hero-tag-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); box-shadow: 0 0 8px var(--green); animation: pulse 2.2s ease infinite; }
        @keyframes pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.8); } }
        .rd-hero-heading { font-family: var(--font-display); font-size: clamp(22px, 3.5vw, 34px); font-weight: 900; line-height: 1.1; letter-spacing: -0.03em; color: var(--text); margin-bottom: 6px; }
        .rd-hero-sub { font-size: 13px; color: var(--text-3); }

        /* Section headers */
        .rd-section-head { display: flex; align-items: center; gap: 14px; margin-bottom: 14px; }
        .rd-section-label { font-size: 10.5px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: var(--text-3); white-space: nowrap; }
        .rd-section-line { flex: 1; height: 1px; background: linear-gradient(90deg, var(--border-2), transparent); }

        /* Main detail card */
        .rd-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; margin-bottom: 20px; animation: fadeUp 0.6s 0.1s ease both; }
        .rd-card-top { padding: 22px 24px 20px; border-bottom: 1px solid var(--border); display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
        .rd-card-top-left { display: flex; align-items: flex-start; gap: 14px; }
        .rd-card-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 16px; }
        .rd-desc { font-family: var(--font-display); font-size: 17px; font-weight: 700; color: var(--text); line-height: 1.3; letter-spacing: -0.015em; }
        .rd-desc-sub { font-size: 12px; color: var(--text-3); margin-top: 4px; }

        .rd-status { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; border-radius: 20px; padding: 5px 12px; flex-shrink: 0; }
        .rd-status-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; flex-shrink: 0; }

        /* Meta grid */
        .rd-meta-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0; }
        @media (max-width: 560px) { .rd-meta-grid { grid-template-columns: 1fr; } }
        .rd-meta-item { padding: 16px 24px; border-right: 1px solid var(--border); border-bottom: 1px solid var(--border); display: flex; align-items: flex-start; gap: 12px; transition: background 0.15s; }
        .rd-meta-item:hover { background: rgba(255,255,255,0.015); }
        .rd-meta-item:nth-child(even) { border-right: none; }
        .rd-meta-item:nth-last-child(-n+2) { border-bottom: none; }
        @media (max-width: 560px) {
          .rd-meta-item { border-right: none; }
          .rd-meta-item:last-child { border-bottom: none; }
          .rd-meta-item:nth-last-child(-n+2) { border-bottom: 1px solid var(--border); }
          .rd-meta-item:last-child { border-bottom: none; }
        }
        .rd-meta-icon { width: 30px; height: 30px; border-radius: 8px; background: rgba(255,255,255,0.04); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; color: var(--text-3); font-size: 12px; flex-shrink: 0; margin-top: 1px; }
        .rd-meta-label { font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-3); margin-bottom: 4px; }
        .rd-meta-value { font-size: 13px; font-weight: 500; color: var(--text-2); line-height: 1.4; }

        /* Type tag */
        .rd-type-tag { font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: capitalize; border-radius: 6px; padding: 3px 9px; display: inline-block; }

        /* Attachments */
        .rd-attach-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; margin-bottom: 20px; animation: fadeUp 0.6s 0.15s ease both; }
        .rd-attach-head { padding: 16px 22px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
        .rd-attach-title { font-family: var(--font-display); font-size: 14px; font-weight: 700; color: var(--text); }
        .rd-attach-count { font-size: 11px; font-weight: 600; color: var(--text-3); background: rgba(255,255,255,0.04); border: 1px solid var(--border); border-radius: 20px; padding: 3px 10px; }
        .rd-attach-list { padding: 8px 0; }
        .rd-attach-item { display: flex; align-items: center; gap: 12px; padding: 11px 22px; text-decoration: none; transition: background 0.15s; border-bottom: 1px solid rgba(255,255,255,0.03); }
        .rd-attach-item:last-child { border-bottom: none; }
        .rd-attach-item:hover { background: rgba(255,255,255,0.02); }
        .rd-attach-file-icon { width: 32px; height: 32px; border-radius: 8px; background: rgba(123,158,255,0.08); border: 1px solid rgba(123,158,255,0.18); display: flex; align-items: center; justify-content: center; color: var(--blue); font-size: 13px; flex-shrink: 0; }
        .rd-attach-name { font-size: 13px; font-weight: 500; color: var(--text-2); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .rd-attach-link-icon { color: var(--text-3); font-size: 11px; flex-shrink: 0; transition: color 0.2s; }
        .rd-attach-item:hover .rd-attach-link-icon { color: var(--blue); }
        .rd-attach-empty { padding: 32px 22px; text-align: center; }
        .rd-attach-empty-icon { width: 40px; height: 40px; border-radius: 10px; background: rgba(255,255,255,0.03); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 16px; color: var(--text-3); margin: 0 auto 10px; }
        .rd-attach-empty-text { font-size: 13px; color: var(--text-3); }

        /* Notes */
        .rd-notes-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; animation: fadeUp 0.6s 0.2s ease both; }
        .rd-notes-head { padding: 16px 22px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
        .rd-notes-title { font-family: var(--font-display); font-size: 14px; font-weight: 700; color: var(--text); }
        .rd-notes-count { font-size: 11px; font-weight: 600; color: var(--text-3); background: rgba(255,255,255,0.04); border: 1px solid var(--border); border-radius: 20px; padding: 3px 10px; }
        .rd-notes-list { padding: 6px 0; }
        .rd-note-item { display: flex; gap: 14px; padding: 16px 22px; border-bottom: 1px solid rgba(255,255,255,0.03); }
        .rd-note-item:last-child { border-bottom: none; }
        .rd-note-timeline { display: flex; flex-direction: column; align-items: center; gap: 0; flex-shrink: 0; }
        .rd-note-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--green); box-shadow: 0 0 8px rgba(46,204,143,0.4); flex-shrink: 0; margin-top: 4px; }
        .rd-note-line { width: 1px; flex: 1; background: linear-gradient(to bottom, rgba(46,204,143,0.2), transparent); margin-top: 6px; min-height: 16px; }
        .rd-note-body { flex: 1; }
        .rd-note-time { font-size: 10.5px; font-weight: 600; letter-spacing: 0.06em; color: var(--text-3); margin-bottom: 5px; text-transform: uppercase; }
        .rd-note-msg { font-size: 13.5px; color: var(--text-2); line-height: 1.55; }
        .rd-notes-empty { padding: 36px 22px; text-align: center; }
        .rd-notes-empty-icon { width: 40px; height: 40px; border-radius: 10px; background: rgba(255,255,255,0.03); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 16px; color: var(--text-3); margin: 0 auto 10px; }
        .rd-notes-empty-text { font-size: 13px; color: var(--text-3); }

        /* Loading */
        .rd-loading { display: flex; align-items: center; justify-content: center; gap: 10px; min-height: 100vh; color: var(--text-3); font-size: 13px; }
        .rd-spin { width: 16px; height: 16px; border: 2px solid rgba(46,204,143,0.2); border-top-color: var(--green); border-radius: 50%; animation: spin 0.75s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeDown { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div className="rd">
        {/* Background image with dark overlay */}
        <div className="rd-bg" />

        <div className="rd-glow"><div className="rd-glow-1" /><div className="rd-glow-2" /></div>
        <div className="rd-noise" />

        {loading || !report ? (
          <div className="rd-loading" style={{ position: "relative", zIndex: 2 }}>
            <div className="rd-spin" />Loading report details…
          </div>
        ) : (
          <div className="rd-inner">

            {/* Nav */}
            <nav className="rd-nav">
              <Link to="/" className="rd-logo">
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
              <p className="rd-hero-sub">Filed on {new Date(report.created_at).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })}</p>
            </div>

            {/* Report Detail Card */}
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
                    <div className="rd-meta-value">{report.location || "Not specified"}</div>
                  </div>
                </div>
                <div className="rd-meta-item">
                  <div className="rd-meta-icon"><FaTag size={11} /></div>
                  <div>
                    <div className="rd-meta-label">Category</div>
                    <div className="rd-meta-value">{report.category || "General"}</div>
                  </div>
                </div>
                <div className="rd-meta-item">
                  <div className="rd-meta-icon"><FaClock size={11} /></div>
                  <div>
                    <div className="rd-meta-label">Submitted</div>
                    <div className="rd-meta-value">{new Date(report.created_at).toLocaleString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                  </div>
                </div>
                {report.notes && (
                  <div className="rd-meta-item" style={{ gridColumn: "1 / -1" }}>
                    <div className="rd-meta-icon"><FaStickyNote size={11} /></div>
                    <div>
                      <div className="rd-meta-label">Notes</div>
                      <div className="rd-meta-value">{report.notes}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Attachments */}
            <div className="rd-section-head" style={{ marginTop: 28 }}>
              <span className="rd-section-label">Attachments</span>
              <span className="rd-section-line" />
            </div>

            <div className="rd-attach-card">
              <div className="rd-attach-head">
                <span className="rd-attach-title">Uploaded Files</span>
                <span className="rd-attach-count">{attachments.length} file{attachments.length !== 1 ? "s" : ""}</span>
              </div>
              {attachments.length > 0 ? (
                <div className="rd-attach-list">
                  {attachments.map((file) => (
                    <a key={file.id} href={file.url} target="_blank" rel="noopener noreferrer" className="rd-attach-item">
                      <div className="rd-attach-file-icon"><FaFileAlt /></div>
                      <span className="rd-attach-name">{file.filename}</span>
                      <FaExternalLinkAlt className="rd-attach-link-icon" />
                    </a>
                  ))}
                </div>
              ) : (
                <div className="rd-attach-empty">
                  <div className="rd-attach-empty-icon"><FaPaperclip /></div>
                  <p className="rd-attach-empty-text">No attachments uploaded for this report.</p>
                </div>
              )}
            </div>

            {/* Responder Notes */}
            <div className="rd-section-head" style={{ marginTop: 28 }}>
              <span className="rd-section-label">Responder Updates</span>
              <span className="rd-section-line" />
            </div>

            <div className="rd-notes-card">
              <div className="rd-notes-head">
                <span className="rd-notes-title">Responder Notes</span>
                <span className="rd-notes-count">{notes.length} update{notes.length !== 1 ? "s" : ""}</span>
              </div>
              {notes.length > 0 ? (
                <div className="rd-notes-list">
                  {notes.map((note, i) => (
                    <div key={note.id} className="rd-note-item">
                      <div className="rd-note-timeline">
                        <div className="rd-note-dot" />
                        {i < notes.length - 1 && <div className="rd-note-line" />}
                      </div>
                      <div className="rd-note-body">
                        <div className="rd-note-time">{new Date(note.created_at).toLocaleString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                        <div className="rd-note-msg">{note.message}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rd-notes-empty">
                  <div className="rd-notes-empty-icon"><FaStickyNote /></div>
                  <p className="rd-notes-empty-text">No responder updates yet. Check back soon.</p>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </>
  );
}