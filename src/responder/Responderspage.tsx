import { useEffect, useState } from "react";
import { supabase } from "../js/supabase";
import {
  FaBell,
  FaExclamationTriangle,
  FaInfoCircle,
  FaCheckCircle,
  FaClock,
  FaUser,
  FaBroadcastTower,
} from "react-icons/fa";

interface Alert {
  id: string | number;
  title: string;
  message: string;
  type: string;
  created_at: string;
  created_by?: string | null;
  target_role?: string | null;
}

const ALERT_TYPE_META: Record<string, { icon: JSX.Element; color: string; bg: string; border: string; label: string }> = {
  danger:  { icon: <FaExclamationTriangle />, color: "#EF5B5B", bg: "rgba(239,91,91,.08)",   border: "rgba(239,91,91,.2)",   label: "DANGER"  },
  warning: { icon: <FaExclamationTriangle />, color: "#F5C842", bg: "rgba(245,200,66,.08)",  border: "rgba(245,200,66,.2)",  label: "WARNING" },
  info:    { icon: <FaInfoCircle />,          color: "#5B8DEF", bg: "rgba(91,141,239,.08)",  border: "rgba(91,141,239,.2)",  label: "INFO"    },
  success: { icon: <FaCheckCircle />,         color: "#2ECC8F", bg: "rgba(46,204,143,.08)",  border: "rgba(46,204,143,.2)",  label: "SUCCESS" },
};

const ALERTS_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=IBM+Plex+Sans:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .ral-root { font-family: 'IBM Plex Sans', sans-serif; color: #E8F0FF; }

  .ral-page-header { margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 12px; }
  .ral-eyebrow { font-family: 'IBM Plex Mono', monospace; font-size: 9.5px; color: rgba(232,240,255,0.28); letter-spacing: .18em; text-transform: uppercase; margin-bottom: 6px; display: flex; align-items: center; gap: 8px; }
  .ral-eyebrow::before { content: ''; width: 14px; height: 1px; background: #EF5B5B; display: block; }
  .ral-title { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; color: #fff; letter-spacing: -.03em; }
  .ral-subtitle { font-size: 10.5px; color: rgba(239,91,91,0.45); margin-top: 5px; font-family: 'IBM Plex Mono', monospace; }

  /* Broadcast button */
  .ral-broadcast-btn {
    display: inline-flex; align-items: center; gap: 8px;
    font-family: 'IBM Plex Mono', monospace; font-size: 9.5px; font-weight: 700;
    padding: 8px 16px; border-radius: 7px; border: 1px solid rgba(239,91,91,0.35);
    background: rgba(239,91,91,0.1); color: #EF5B5B; cursor: pointer;
    transition: background .15s, border-color .15s; letter-spacing: .06em;
  }
  .ral-broadcast-btn:hover { background: rgba(239,91,91,0.2); border-color: rgba(239,91,91,0.5); }

  /* Stats row */
  .ral-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 8px; margin-bottom: 16px; }
  .ral-stat {
    background: rgba(4,15,30,0.88); border: 1px solid rgba(255,255,255,0.06);
    border-radius: 10px; padding: 13px; position: relative; overflow: hidden;
    backdrop-filter: blur(8px);
  }
  .ral-stat::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: var(--s-color); }
  .ral-stat-num { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800; color: var(--s-color); line-height: 1; margin-bottom: 4px; }
  .ral-stat-label { font-family: 'IBM Plex Mono', monospace; font-size: 8px; color: rgba(232,240,255,0.3); letter-spacing: .1em; text-transform: uppercase; }

  /* Layout */
  .ral-layout { display: grid; grid-template-columns: 1fr 320px; gap: 12px; align-items: start; }
  @media (max-width: 1050px) { .ral-layout { grid-template-columns: 1fr; } }

  /* Alert list */
  .ral-list { display: flex; flex-direction: column; gap: 8px; }

  .ral-card {
    background: rgba(4,15,30,0.88); border: 1px solid var(--al-border);
    border-left: 3px solid var(--al-color);
    border-radius: 10px; padding: 14px 16px; display: flex; flex-direction: column; gap: 8px;
    backdrop-filter: blur(8px); animation: ralFadeUp .35s ease both;
    transition: border-color .2s;
  }
  .ral-card:hover { filter: brightness(1.05); }
  @keyframes ralFadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }

  .ral-card-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
  .ral-card-type-badge {
    display: inline-flex; align-items: center; gap: 5px;
    font-family: 'IBM Plex Mono', monospace; font-size: 8px; font-weight: 700;
    padding: 3px 9px; border-radius: 4px;
    background: var(--al-bg); color: var(--al-color); border: 1px solid var(--al-border);
    letter-spacing: .08em;
  }
  .ral-card-title { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: #fff; line-height: 1.3; margin-bottom: 2px; }
  .ral-card-msg { font-size: 12.5px; font-weight: 300; color: rgba(232,240,255,0.52); line-height: 1.6; }
  .ral-card-footer { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .ral-card-meta {
    display: inline-flex; align-items: center; gap: 4px;
    font-family: 'IBM Plex Mono', monospace; font-size: 8.5px; color: rgba(232,240,255,0.28);
  }

  /* Compose panel */
  .ral-compose {
    background: rgba(4,15,30,0.88); border: 1px solid rgba(255,255,255,0.07);
    border-radius: 12px; padding: 16px; backdrop-filter: blur(8px);
    display: flex; flex-direction: column; gap: 12px; position: sticky; top: 24px;
  }
  .ral-compose-title { font-family: 'IBM Plex Mono', monospace; font-size: 9.5px; color: rgba(232,240,255,0.38); letter-spacing: .14em; text-transform: uppercase; display: flex; align-items: center; gap: 7px; }

  .ral-field { display: flex; flex-direction: column; gap: 6px; }
  .ral-label { font-family: 'IBM Plex Mono', monospace; font-size: 8.5px; color: rgba(232,240,255,0.32); letter-spacing: .08em; text-transform: uppercase; }
  .ral-input {
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.09);
    border-radius: 7px; padding: 9px 11px; font-size: 12.5px;
    font-family: 'IBM Plex Sans', sans-serif; color: #E8F0FF; outline: none;
    transition: border-color .2s; width: 100%;
  }
  .ral-input::placeholder { color: rgba(232,240,255,0.18); }
  .ral-input:focus { border-color: rgba(239,91,91,0.35); }
  .ral-textarea {
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.09);
    border-radius: 7px; padding: 9px 11px; font-size: 12.5px;
    font-family: 'IBM Plex Sans', sans-serif; font-weight: 300; color: #E8F0FF; outline: none;
    transition: border-color .2s; width: 100%; resize: vertical; min-height: 80px; line-height: 1.6;
  }
  .ral-textarea::placeholder { color: rgba(232,240,255,0.18); }
  .ral-textarea:focus { border-color: rgba(239,91,91,0.35); }

  .ral-type-row { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
  .ral-type-opt {
    display: flex; align-items: center; gap: 6px; padding: 8px 10px;
    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
    border-radius: 6px; cursor: pointer; font-size: 11.5px; font-family: 'IBM Plex Sans', sans-serif;
    color: rgba(232,240,255,0.45); transition: all .15s;
  }
  .ral-type-opt.active { background: var(--to-bg); border-color: var(--to-border); color: var(--to-color); }
  .ral-type-opt:hover:not(.active) { border-color: rgba(255,255,255,0.15); color: rgba(232,240,255,0.7); }

  .ral-send-btn {
    width: 100%; padding: 11px; font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 800;
    letter-spacing: .05em; text-transform: uppercase;
    background: #EF5B5B; color: #fff; border: none; border-radius: 8px; cursor: pointer;
    transition: background .15s, transform .15s; display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .ral-send-btn:hover:not(:disabled) { background: #f56d6d; transform: translateY(-1px); }
  .ral-send-btn:disabled { opacity: .4; cursor: not-allowed; background: rgba(232,240,255,0.1); color: rgba(232,240,255,0.3); }

  .ral-success-msg { text-align: center; padding: 10px; background: rgba(46,204,143,0.08); border: 1px solid rgba(46,204,143,0.2); border-radius: 7px; font-family: 'IBM Plex Mono', monospace; font-size: 9px; color: #2ECC8F; letter-spacing: .08em; }

  /* Spinner / empty */
  .ral-spinner { display: inline-block; width: 14px; height: 14px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.1); border-top-color: #EF5B5B; animation: ralSpin .7s linear infinite; }
  @keyframes ralSpin { to { transform: rotate(360deg); } }
  .ral-empty { text-align: center; padding: 40px 0; font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; color: rgba(232,240,255,0.18); letter-spacing: .1em; }
`;

function formatRelative(ts: string) {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(ts).toLocaleDateString();
}

export default function ResponderAlertsPage() {
  const [alerts, setAlerts]       = useState<Alert[]>([]);
  const [loading, setLoading]     = useState(true);
  const [sending, setSending]     = useState(false);
  const [sent, setSent]           = useState(false);
  const [title, setTitle]         = useState("");
  const [message, setMessage]     = useState("");
  const [alertType, setAlertType] = useState("warning");

  const loadAlerts = async () => {
    const { data } = await supabase
      .from("alerts")
      .select("*")
      .order("created_at", { ascending: false });
    setAlerts(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadAlerts();
    const ch = supabase
      .channel("ral-alerts")
      .on("postgres_changes", { event: "*", schema: "public", table: "alerts" }, loadAlerts)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) return;
    setSending(true);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("alerts").insert({
      title:       title.trim(),
      message:     message.trim(),
      type:        alertType,
      created_by:  user?.id ?? null,
      target_role: "citizen",
    });
    setTitle("");
    setMessage("");
    setAlertType("warning");
    setSending(false);
    setSent(true);
    setTimeout(() => setSent(false), 3000);
    await loadAlerts();
  };

  const counts = {
    total:   alerts.length,
    danger:  alerts.filter((a) => a.type === "danger").length,
    warning: alerts.filter((a) => a.type === "warning").length,
    info:    alerts.filter((a) => a.type === "info").length,
  };

  const alertTypeOptions = ["danger", "warning", "info", "success"];

  return (
    <>
      <style>{ALERTS_STYLE}</style>
      <div className="ral-root">
        <div className="ral-page-header">
          <div>
            <div className="ral-eyebrow">Field Operations</div>
            <div className="ral-title">Alerts</div>
            <div className="ral-subtitle">BROADCAST & MONITOR ALERTS</div>
          </div>
          {loading && <div className="ral-spinner" />}
        </div>

        {/* Stats */}
        <div className="ral-stats">
          {[
            { label: "Total Alerts", value: counts.total,   color: "#E8F0FF" },
            { label: "Danger",       value: counts.danger,  color: "#EF5B5B" },
            { label: "Warning",      value: counts.warning, color: "#F5C842" },
            { label: "Info",         value: counts.info,    color: "#5B8DEF" },
          ].map((s) => (
            <div key={s.label} className="ral-stat" style={{ "--s-color": s.color } as React.CSSProperties}>
              <div className="ral-stat-num">{loading ? "—" : s.value}</div>
              <div className="ral-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="ral-layout">
          {/* Alert feed */}
          <div className="ral-list">
            {loading ? (
              <div className="ral-empty"><div className="ral-spinner" /></div>
            ) : alerts.length === 0 ? (
              <div className="ral-empty">NO ALERTS YET</div>
            ) : (
              alerts.map((a) => {
                const am = ALERT_TYPE_META[a.type] ?? ALERT_TYPE_META.info;
                return (
                  <div
                    key={String(a.id)}
                    className="ral-card"
                    style={{
                      "--al-color": am.color,
                      "--al-bg":    am.bg,
                      "--al-border": am.border,
                    } as React.CSSProperties}
                  >
                    <div className="ral-card-header">
                      <div>
                        <span className="ral-card-type-badge">
                          {am.icon} {am.label}
                        </span>
                        <div className="ral-card-title" style={{ marginTop: 6 }}>{a.title}</div>
                      </div>
                    </div>
                    <div className="ral-card-msg">{a.message}</div>
                    <div className="ral-card-footer">
                      <span className="ral-card-meta"><FaClock size={8} />{formatRelative(a.created_at)}</span>
                      {a.target_role && (
                        <span className="ral-card-meta"><FaUser size={8} />→ {a.target_role.toUpperCase()}</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Compose panel */}
          <div className="ral-compose">
            <div className="ral-compose-title">
              <FaBroadcastTower size={12} /> Broadcast Alert
            </div>

            <div className="ral-field">
              <label className="ral-label">Alert Type</label>
              <div className="ral-type-row">
                {alertTypeOptions.map((t) => {
                  const am = ALERT_TYPE_META[t];
                  return (
                    <div
                      key={t}
                      className={`ral-type-opt${alertType === t ? " active" : ""}`}
                      style={{
                        "--to-color":  am.color,
                        "--to-bg":     am.bg,
                        "--to-border": am.border,
                      } as React.CSSProperties}
                      onClick={() => setAlertType(t)}
                    >
                      {am.icon}
                      <span style={{ fontSize: 11 }}>{am.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="ral-field">
              <label className="ral-label">Title</label>
              <input
                className="ral-input"
                placeholder="e.g. Road closed — Rizal Blvd"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="ral-field">
              <label className="ral-label">Message</label>
              <textarea
                className="ral-textarea"
                placeholder="Describe the situation and any public safety instructions…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            {sent && (
              <div className="ral-success-msg">✓ ALERT BROADCAST SUCCESSFULLY</div>
            )}

            <button
              className="ral-send-btn"
              disabled={!title.trim() || !message.trim() || sending}
              onClick={handleSend}
            >
              <FaBell size={13} />
              {sending ? "Sending…" : "Broadcast Alert"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}