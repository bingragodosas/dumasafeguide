import { useEffect, useState } from "react";
import { supabase } from "../js/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Alert {
  id: string | number;
  title: string;
  message: string;
  type: string;
  created_at: string;
  created_by?: string | null;
  target_role?: string | null;
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

const ALERT_META: Record<string, { label: string; colorClass: string; icon: string }> = {
  danger:  { label: "DANGER",  colorClass: "al-danger",  icon: "⚠" },
  warning: { label: "WARNING", colorClass: "al-warning", icon: "⚠" },
  info:    { label: "INFO",    colorClass: "al-info",    icon: "ℹ" },
  success: { label: "SUCCESS", colorClass: "al-success", icon: "✓" },
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────

const Ico = {
  Bell: ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display:"inline-block", verticalAlign:"middle", flexShrink:0 }}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  Warn: ({ size = 13 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display:"inline-block", verticalAlign:"middle", flexShrink:0 }}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  Info: ({ size = 13 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display:"inline-block", verticalAlign:"middle", flexShrink:0 }}>
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  ),
  Check: ({ size = 13 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display:"inline-block", verticalAlign:"middle", flexShrink:0 }}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  Clock: ({ size = 9 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display:"inline-block", verticalAlign:"middle", flexShrink:0 }}>
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  Broadcast: ({ size = 15 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display:"inline-block", verticalAlign:"middle", flexShrink:0 }}>
      <path d="M1 6l10.1 7.5L22 6"/><path d="M1 18h22"/><path d="M1 12h4"/><path d="M19 12h4"/><circle cx="12" cy="12" r="2"/>
    </svg>
  ),
  X: ({ size = 11 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display:"inline-block", verticalAlign:"middle" }}>
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
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
  --font-head: 'Bebas Neue','Arial Narrow',Arial,sans-serif;
  --font-mono: 'IBM Plex Mono','Fira Mono',monospace;
  --font-body: 'DM Sans',system-ui,sans-serif;
}
@keyframes slideUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
@keyframes spin    { to{transform:rotate(360deg)} }
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

.ra{font-family:var(--font-body);color:var(--text);min-height:100vh;background:var(--ink)}

/* ── Header ── */
.ra-hd{display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:12px;margin-bottom:20px}
.ra-eyebrow{font-family:var(--font-mono);font-size:10px;color:rgba(243,51,51,.6);letter-spacing:.28em;text-transform:uppercase;margin-bottom:6px;display:flex;align-items:center;gap:8px}
.ra-eyebrow::before{content:'';display:block;width:20px;height:1px;background:var(--red);opacity:.5}
.ra-title{font-family:var(--font-head);font-size:42px;font-weight:400;color:#fff;letter-spacing:.04em;line-height:1}

/* ── Stats ── */
.ra-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-bottom:20px}
.ra-stat{background:rgba(6,17,32,.92);border:1px solid var(--edge);border-radius:12px;padding:16px;position:relative;overflow:hidden}
.ra-stat::before{content:'';position:absolute;top:0;left:0;right:0;height:2px}
.ra-stat-icon{font-size:16px;margin-bottom:10px;opacity:.85}
.ra-stat-num{font-family:var(--font-head);font-size:34px;line-height:1;margin-bottom:5px}
.ra-stat-lbl{font-family:var(--font-mono);font-size:8.5px;color:var(--dim);letter-spacing:.12em;text-transform:uppercase}

/* Stat color variants */
.ra-stat.sc-total  { }
.ra-stat.sc-total  ::before{background:var(--text)}
.ra-stat.sc-total  .ra-stat-icon,.ra-stat.sc-total  .ra-stat-num{color:var(--text)}
.ra-stat.sc-danger ::before{background:var(--red)}
.ra-stat.sc-danger .ra-stat-icon,.ra-stat.sc-danger .ra-stat-num{color:var(--red)}
.ra-stat.sc-warning::before{background:var(--amber)}
.ra-stat.sc-warning .ra-stat-icon,.ra-stat.sc-warning .ra-stat-num{color:var(--amber)}
.ra-stat.sc-info   ::before{background:var(--blue)}
.ra-stat.sc-info   .ra-stat-icon,.ra-stat.sc-info   .ra-stat-num{color:var(--blue)}

/* ── Layout ── */
.ra-layout{display:grid;grid-template-columns:1fr 340px;gap:16px;align-items:start}
@media(max-width:1050px){.ra-layout{grid-template-columns:1fr}}

/* ── Alert list ── */
.ra-list{display:flex;flex-direction:column;gap:10px}
.ra-empty{text-align:center;padding:52px;font-family:var(--font-mono);font-size:10.5px;color:var(--dim);letter-spacing:.12em}

/* ── Alert card ── */
.ra-card{background:rgba(6,17,32,.92);border:1px solid;border-radius:12px;padding:16px 18px;display:flex;flex-direction:column;gap:10px;transition:border-color .2s,box-shadow .2s;animation:slideUp .3s ease both;position:relative;overflow:hidden}
.ra-card::before{content:'';position:absolute;top:0;left:0;right:0;height:36px;background:linear-gradient(180deg,currentColor,transparent);opacity:.06;pointer-events:none}
.ra-card:hover{box-shadow:0 8px 40px rgba(0,0,0,.4)}

/* Card color variants */
.ra-card.al-danger {border-left:3px solid var(--red);  border-color:rgba(243,51,51,.22)}
.ra-card.al-warning{border-left:3px solid var(--amber); border-color:rgba(255,153,0,.22)}
.ra-card.al-info   {border-left:3px solid var(--blue);  border-color:rgba(77,158,255,.22)}
.ra-card.al-success{border-left:3px solid var(--green); border-color:rgba(0,220,130,.22)}
.ra-card.al-danger:hover {border-color:rgba(243,51,51,.5)}
.ra-card.al-warning:hover{border-color:rgba(255,153,0,.5)}
.ra-card.al-info:hover   {border-color:rgba(77,158,255,.5)}
.ra-card.al-success:hover{border-color:rgba(0,220,130,.5)}

.ra-card-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
.ra-badge-row{display:flex;align-items:center;gap:8px;margin-bottom:6px}
.ra-badge{display:inline-flex;align-items:center;gap:5px;font-family:var(--font-mono);font-size:8.5px;font-weight:700;padding:3px 10px;border-radius:5px;letter-spacing:.08em}
.ra-badge.al-danger {background:rgba(243,51,51,.1); color:var(--red);  border:1px solid rgba(243,51,51,.25)}
.ra-badge.al-warning{background:rgba(255,153,0,.1); color:var(--amber);border:1px solid rgba(255,153,0,.25)}
.ra-badge.al-info   {background:rgba(77,158,255,.1);color:var(--blue); border:1px solid rgba(77,158,255,.25)}
.ra-badge.al-success{background:rgba(0,220,130,.1); color:var(--green);border:1px solid rgba(0,220,130,.25)}

.ra-card-target{font-family:var(--font-mono);font-size:8.5px;font-weight:600;padding:2px 8px;border-radius:4px;background:rgba(77,158,255,.08);color:rgba(77,158,255,.7);border:1px solid rgba(77,158,255,.2)}
.ra-card-title{font-size:15px;font-weight:700;color:#fff;line-height:1.3}
.ra-card-msg{font-size:13px;font-weight:300;color:rgba(216,234,248,.5);line-height:1.65}
.ra-card-footer{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.ra-card-meta{display:inline-flex;align-items:center;gap:5px;font-family:var(--font-mono);font-size:9px;color:var(--dim)}

/* ── Compose panel ── */
.ra-compose{background:rgba(6,17,32,.95);border:1px solid var(--edge);border-radius:14px;padding:20px;display:flex;flex-direction:column;gap:16px;position:sticky;top:24px}
.ra-compose-hd{display:flex;align-items:center;gap:10px;padding-bottom:14px;border-bottom:1px solid var(--edge)}
.ra-compose-icon{width:36px;height:36px;border-radius:10px;flex-shrink:0;background:rgba(243,51,51,.1);border:1px solid rgba(243,51,51,.2);display:flex;align-items:center;justify-content:center;color:var(--red)}
.ra-compose-title{font-size:14px;font-weight:700;color:#fff}
.ra-compose-sub{font-family:var(--font-mono);font-size:8.5px;color:var(--dim);margin-top:2px;text-transform:uppercase;letter-spacing:.1em}

.ra-field{display:flex;flex-direction:column;gap:8px}
.ra-label{font-family:var(--font-mono);font-size:9px;font-weight:600;color:rgba(216,234,248,.32);letter-spacing:.1em;text-transform:uppercase}
.ra-input{background:rgba(3,11,21,.8);border:1px solid var(--edge);border-radius:9px;padding:11px 13px;font-family:var(--font-body);font-size:13px;color:var(--text);outline:none;transition:border-color .2s;width:100%}
.ra-input::placeholder{color:var(--dim)}
.ra-input:focus{border-color:rgba(243,51,51,.3)}
.ra-textarea{background:rgba(3,11,21,.8);border:1px solid var(--edge);border-radius:9px;padding:11px 13px;font-family:var(--font-body);font-size:13px;font-weight:300;color:var(--text);outline:none;transition:border-color .2s;width:100%;resize:vertical;min-height:90px;line-height:1.65}
.ra-textarea::placeholder{color:var(--dim)}
.ra-textarea:focus{border-color:rgba(243,51,51,.3)}

/* Type selector */
.ra-type-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.ra-type-opt{display:flex;align-items:center;gap:7px;padding:9px 11px;background:rgba(255,255,255,.03);border:1px solid var(--edge);border-radius:8px;cursor:pointer;font-size:11px;font-weight:500;color:var(--muted);transition:all .15s}
.ra-type-opt:hover:not(.active){border-color:rgba(255,255,255,.15);color:var(--text)}
.ra-type-opt.active.al-danger {background:rgba(243,51,51,.1); border-color:rgba(243,51,51,.3); color:var(--red)}
.ra-type-opt.active.al-warning{background:rgba(255,153,0,.1); border-color:rgba(255,153,0,.3); color:var(--amber)}
.ra-type-opt.active.al-info   {background:rgba(77,158,255,.1);border-color:rgba(77,158,255,.3);color:var(--blue)}
.ra-type-opt.active.al-success{background:rgba(0,220,130,.1); border-color:rgba(0,220,130,.3); color:var(--green)}
.ra-type-icon{font-size:13px;flex-shrink:0}

/* Success banner */
.ra-success{text-align:center;padding:10px 14px;background:rgba(0,220,130,.07);border:1px solid rgba(0,220,130,.2);border-radius:8px;font-family:var(--font-mono);font-size:9.5px;color:var(--green);letter-spacing:.08em;display:flex;align-items:center;justify-content:center;gap:7px}

/* Send button */
.ra-send{width:100%;padding:13px;border-radius:10px;border:none;cursor:pointer;font-family:var(--font-body);font-size:14px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;background:var(--red);color:#fff;display:flex;align-items:center;justify-content:center;gap:8px;transition:all .15s}
.ra-send:hover:not(:disabled){transform:translateY(-2px);filter:brightness(1.1)}
.ra-send:active:not(:disabled){transform:none}
.ra-send:disabled{opacity:.4;cursor:not-allowed;background:rgba(216,234,248,.1);color:rgba(216,234,248,.3)}

/* Spinner */
.ra-spinner{display:inline-block;width:15px;height:15px;border-radius:50%;border:2px solid rgba(255,255,255,.1);border-top-color:var(--red);animation:spin .7s linear infinite}
.ra-spinner-sm{display:inline-block;width:13px;height:13px;border-radius:50%;border:2px solid rgba(255,255,255,.15);border-top-color:#fff;animation:spin .7s linear infinite}
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRelative(ts: string) {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(ts).toLocaleDateString();
}

function cls(...args: (string | false | undefined | null)[]): string {
  return args.filter(Boolean).join(" ");
}

// ─── Alert type icon helper ───────────────────────────────────────────────────

function AlertTypeIcon({ type, size = 13 }: { type: string; size?: number }) {
  if (type === "info")    return <Ico.Info size={size} />;
  if (type === "success") return <Ico.Check size={size} />;
  return <Ico.Warn size={size} />;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ResponderAlertsPage() {
  const [alerts,    setAlerts]    = useState<Alert[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [sending,   setSending]   = useState(false);
  const [sent,      setSent]      = useState(false);
  const [title,     setTitle]     = useState("");
  const [message,   setMessage]   = useState("");
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
      .channel("responder-alerts-feed")
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
    setTimeout(() => setSent(false), 3500);
    await loadAlerts();
  };

  const counts = {
    total:   alerts.length,
    danger:  alerts.filter((a) => a.type === "danger").length,
    warning: alerts.filter((a) => a.type === "warning").length,
    info:    alerts.filter((a) => a.type === "info").length,
  };

  const statCards = [
    { label: "Total Alerts", value: counts.total,   colorClass: "sc-total",   icon: <Ico.Bell size={16} /> },
    { label: "Danger",       value: counts.danger,  colorClass: "sc-danger",  icon: <Ico.Warn size={16} /> },
    { label: "Warning",      value: counts.warning, colorClass: "sc-warning", icon: <Ico.Warn size={16} /> },
    { label: "Info",         value: counts.info,    colorClass: "sc-info",    icon: <Ico.Info size={16} /> },
  ];

  const typeOptions = ["danger", "warning", "info", "success"];

  return (
    <>
      <style>{STYLES}</style>
      <div className="ra">

        {/* Header */}
        <div className="ra-hd">
          <div>
            <div className="ra-eyebrow">Field Operations</div>
            <div className="ra-title">ALERTS</div>
          </div>
          {loading && <div className="ra-spinner" />}
        </div>

        {/* Stats */}
        <div className="ra-stats">
          {statCards.map((s) => (
            <div key={s.label} className={cls("ra-stat", s.colorClass)}>
              <div className="ra-stat-icon">{s.icon}</div>
              <div className="ra-stat-num">{loading ? "—" : s.value}</div>
              <div className="ra-stat-lbl">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Layout */}
        <div className="ra-layout">

          {/* Alert feed */}
          <div className="ra-list">
            {loading ? (
              <div className="ra-empty">
                <div className="ra-spinner" style={{ margin: "0 auto" }} />
              </div>
            ) : alerts.length === 0 ? (
              <div className="ra-empty">NO ALERTS YET</div>
            ) : (
              alerts.map((a) => {
                const am = ALERT_META[a.type] ?? ALERT_META.info;
                return (
                  <div key={String(a.id)} className={cls("ra-card", am.colorClass)}>
                    <div className="ra-card-top">
                      <div style={{ flex: 1 }}>
                        <div className="ra-badge-row">
                          <span className={cls("ra-badge", am.colorClass)}>
                            <AlertTypeIcon type={a.type} size={9} />
                            {am.label}
                          </span>
                          {a.target_role && (
                            <span className="ra-card-target">→ {a.target_role.toUpperCase()}</span>
                          )}
                        </div>
                        <div className="ra-card-title">{a.title}</div>
                      </div>
                    </div>
                    <div className="ra-card-msg">{a.message}</div>
                    <div className="ra-card-footer">
                      <span className="ra-card-meta">
                        <Ico.Clock size={9} />
                        {formatRelative(a.created_at)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Compose panel */}
          <div className="ra-compose">
            <div className="ra-compose-hd">
              <div className="ra-compose-icon"><Ico.Broadcast size={15} /></div>
              <div>
                <div className="ra-compose-title">Broadcast Alert</div>
                <div className="ra-compose-sub">Send to citizens</div>
              </div>
            </div>

            {/* Type selector */}
            <div className="ra-field">
              <span className="ra-label">Alert Type</span>
              <div className="ra-type-grid">
                {typeOptions.map((t) => {
                  const am = ALERT_META[t];
                  return (
                    <div
                      key={t}
                      className={cls("ra-type-opt", am.colorClass, alertType === t && "active")}
                      onClick={() => setAlertType(t)}
                    >
                      <span className="ra-type-icon">
                        <AlertTypeIcon type={t} size={13} />
                      </span>
                      <span>{am.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div className="ra-field">
              <label className="ra-label">Title</label>
              <input
                className="ra-input"
                placeholder="e.g. Road closed — Rizal Blvd"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Message */}
            <div className="ra-field">
              <label className="ra-label">Message</label>
              <textarea
                className="ra-textarea"
                placeholder="Describe the situation and any public safety instructions…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            {/* Success banner */}
            {sent && (
              <div className="ra-success">
                <Ico.Check size={12} />
                ALERT BROADCAST SUCCESSFULLY
              </div>
            )}

            {/* Send button */}
            <button
              className="ra-send"
              disabled={!title.trim() || !message.trim() || sending}
              onClick={handleSend}
            >
              {sending ? (
                <><span className="ra-spinner-sm" /> Sending…</>
              ) : (
                <><Ico.Bell size={14} /> Broadcast Alert</>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}