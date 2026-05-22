import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../js/supabase";
import {
  FaBellSlash, FaExclamationTriangle, FaInfoCircle,
  FaCheckCircle, FaClock, FaChevronLeft,
} from "react-icons/fa";
import pagesBackground from "../assets/pagesbackground.png";

interface Alert {
  id: string;
  title: string;
  message: string;
  type: string;
  created_at: string;
  created_by?: string | null;
}

const ALERT_TYPE_META: Record<string, {
  color: string; bg: string; border: string;
  icon: JSX.Element; label: string;
}> = {
  danger:  { color: "#EF5B5B", bg: "rgba(239,91,91,0.08)",  border: "rgba(239,91,91,0.2)",  icon: <FaExclamationTriangle />, label: "Danger"    },
  warning: { color: "#F5C842", bg: "rgba(245,200,66,0.08)", border: "rgba(245,200,66,0.2)", icon: <FaExclamationTriangle />, label: "Warning"   },
  info:    { color: "#5B8DEF", bg: "rgba(91,141,239,0.08)", border: "rgba(91,141,239,0.2)", icon: <FaInfoCircle />,          label: "Info"      },
  success: { color: "#2ECC8F", bg: "rgba(46,204,143,0.08)", border: "rgba(46,204,143,0.2)", icon: <FaCheckCircle />,         label: "All Clear" },
};

function timeAgo(ts: string) {
  const s = (Date.now() - new Date(ts).getTime()) / 1000;
  if (s < 60)    return `${Math.floor(s)}s ago`;
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(ts).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

function ping() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.frequency.setValueAtTime(660, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(330, ctx.currentTime + 0.3);
    g.gain.setValueAtTime(0.12, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(); osc.stop(ctx.currentTime + 0.4);
  } catch (_) {}
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@400;500;700;800;900&family=Instrument+Sans:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .ca-root {
    min-height: 100vh;
    font-family: 'Instrument Sans', sans-serif;
    color: #eef0f7;
    position: relative;
    overflow-x: hidden;
    background: #080c14;
  }
  .ca-bg {
    position: fixed; inset: 0; z-index: 0;
    background-size: cover; background-position: center; background-repeat: no-repeat;
  }
  .ca-bg::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(160deg, rgba(8,12,20,.92) 0%, rgba(8,12,20,.82) 50%, rgba(8,12,20,.92) 100%);
  }
  .ca-glow { position: fixed; inset: 0; pointer-events: none; z-index: 1; overflow: hidden; }
  .ca-glow-a { position: absolute; width: 600px; height: 600px; border-radius: 50%; background: radial-gradient(circle, rgba(46,204,143,.08) 0%, transparent 70%); top: -180px; left: -80px; }
  .ca-glow-b { position: absolute; width: 500px; height: 500px; border-radius: 50%; background: radial-gradient(circle, rgba(123,158,255,.06) 0%, transparent 70%); bottom: -140px; right: -60px; }

  .ca-inner { position: relative; z-index: 2; max-width: 860px; margin: 0 auto; padding: 0 24px 80px; }

  /* Hero */
  .ca-hero { margin-top: 48px; margin-bottom: 32px; }
  .ca-hero-tag { display: inline-flex; align-items: center; gap: 7px; font-size: 11px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: #2ECC8F; margin-bottom: 16px; }
  .ca-hero-dot { width: 6px; height: 6px; border-radius: 50%; background: #2ECC8F; box-shadow: 0 0 8px #2ECC8F; animation: ca-pulse 2.2s ease infinite; }
  @keyframes ca-pulse { 0%,100%{opacity:1;transform:scale(1);}50%{opacity:.4;transform:scale(.75);} }
  .ca-hero-heading { font-family: 'Cabinet Grotesk', sans-serif; font-size: clamp(28px, 4vw, 42px); font-weight: 900; line-height: 1.05; letter-spacing: -.035em; color: #eef0f7; margin-bottom: 8px; }
  .ca-hero-heading em { font-style: normal; color: #2ECC8F; }
  .ca-hero-sub { font-size: 14px; color: rgba(238,240,247,.35); display: inline-flex; align-items: center; gap: 7px; }

  /* Live dot */
  .ca-live-dot { width: 7px; height: 7px; border-radius: 50%; display: inline-block; flex-shrink: 0; }
  .ca-live-dot.on  { background: #2ECC8F; box-shadow: 0 0 8px #2ECC8F; animation: ca-pulse 2s ease infinite; }
  .ca-live-dot.off { background: rgba(238,240,247,.2); }

  /* Section head */
  .ca-sec { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; }
  .ca-sec-label { font-size: 10.5px; font-weight: 600; letter-spacing: .16em; text-transform: uppercase; color: rgba(238,240,247,.28); white-space: nowrap; }
  .ca-sec-line { flex: 1; height: 1px; background: linear-gradient(90deg, rgba(255,255,255,.1), transparent); }
  .ca-sec-count { font-size: 11px; font-weight: 600; color: rgba(238,240,247,.3); background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.07); border-radius: 20px; padding: 3px 10px; white-space: nowrap; }

  /* Filters */
  .ca-filters { display: flex; gap: 6px; margin-bottom: 20px; flex-wrap: wrap; }
  .ca-pill { padding: 5px 14px; border-radius: 20px; border: 1px solid; font-size: 11px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; cursor: pointer; transition: all .15s; background: transparent; font-family: 'Instrument Sans', sans-serif; }
  .ca-pill--all     { border-color: rgba(255,255,255,.1);    color: rgba(238,240,247,.35); }
  .ca-pill--all.on  { background: rgba(255,255,255,.07); border-color: rgba(255,255,255,.2); color: #fff; }
  .ca-pill--danger  { border-color: rgba(239,91,91,.2);  color: rgba(239,91,91,.5); }
  .ca-pill--danger.on  { background: rgba(239,91,91,.1); border-color: rgba(239,91,91,.45); color: #EF5B5B; }
  .ca-pill--warning { border-color: rgba(245,200,66,.2); color: rgba(245,200,66,.5); }
  .ca-pill--warning.on { background: rgba(245,200,66,.1); border-color: rgba(245,200,66,.45); color: #F5C842; }
  .ca-pill--info    { border-color: rgba(91,141,239,.2); color: rgba(91,141,239,.5); }
  .ca-pill--info.on { background: rgba(91,141,239,.1); border-color: rgba(91,141,239,.45); color: #5B8DEF; }

  /* Alert cards */
  .ca-list { display: flex; flex-direction: column; gap: 12px; }
  .ca-card {
    background: rgba(15,21,33,.82); border: 1px solid rgba(255,255,255,.07);
    border-left: 3px solid var(--ca-color);
    border-radius: 14px; overflow: hidden;
    transition: border-color .18s, transform .18s;
    animation: caFade .35s ease both;
    backdrop-filter: blur(16px);
  }
  .ca-card:hover { border-color: rgba(255,255,255,.13); transform: translateY(-2px); }
  @keyframes caFade { from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);} }
  .ca-card.is-new { animation: caNew 5s ease both; }
  @keyframes caNew {
    0%   { border-color: rgba(46,204,143,.5); box-shadow: 0 0 22px rgba(46,204,143,.1); }
    60%  { border-color: rgba(46,204,143,.15); }
    100% { border-color: rgba(255,255,255,.07); box-shadow: none; }
  }

  .ca-card-body { padding: 18px 20px; }
  .ca-card-top { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 12px; }
  .ca-card-icon { width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 15px; }
  .ca-card-info { flex: 1; min-width: 0; }
  .ca-card-title { font-family: 'Cabinet Grotesk', sans-serif; font-size: 15px; font-weight: 800; color: #eef0f7; letter-spacing: -.01em; margin-bottom: 6px; }
  .ca-card-msg { font-size: 13px; color: rgba(238,240,247,.55); line-height: 1.6; }
  .ca-card-footer { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding-top: 12px; border-top: 1px solid rgba(255,255,255,.05); margin-top: 12px; }
  .ca-tag { font-size: 9.5px; font-family: monospace; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; padding: 3px 9px; border-radius: 5px; }
  .ca-time { font-size: 11px; font-family: monospace; color: rgba(238,240,247,.28); margin-left: auto; display: flex; align-items: center; gap: 5px; }
  .ca-new-badge {
    font-size: 9px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase;
    color: #2ECC8F; background: rgba(46,204,143,.1); border: 1px solid rgba(46,204,143,.25);
    border-radius: 20px; padding: 2px 8px;
    display: inline-flex; align-items: center; gap: 4px;
  }
  .ca-new-badge-dot { width: 4px; height: 4px; border-radius: 50%; background: #2ECC8F; box-shadow: 0 0 5px #2ECC8F; animation: ca-pulse 2s ease infinite; }

  /* Empty */
  .ca-empty {
    display: flex; flex-direction: column; align-items: center; gap: 12px;
    padding: 64px 24px; text-align: center;
    background: rgba(15,21,33,.82); border: 1px dashed rgba(255,255,255,.07);
    border-radius: 20px; backdrop-filter: blur(16px);
  }
  .ca-empty-icon { width: 52px; height: 52px; border-radius: 14px; background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.07); display: flex; align-items: center; justify-content: center; font-size: 20px; color: rgba(238,240,247,.2); }
  .ca-empty-title { font-family: 'Cabinet Grotesk', sans-serif; font-size: 16px; font-weight: 700; color: rgba(238,240,247,.35); }
  .ca-empty-sub { font-size: 13px; color: rgba(238,240,247,.2); max-width: 290px; line-height: 1.6; }

  /* Loading */
  .ca-loading { display: flex; align-items: center; gap: 10px; padding: 64px; justify-content: center; font-size: 13px; color: rgba(238,240,247,.3); background: rgba(15,21,33,.82); border: 1px solid rgba(255,255,255,.07); border-radius: 20px; backdrop-filter: blur(16px); }
  .ca-spin { width: 16px; height: 16px; border-radius: 50%; border: 2px solid rgba(255,255,255,.1); border-top-color: #2ECC8F; animation: caSpin .75s linear infinite; display: inline-block; flex-shrink: 0; }
  @keyframes caSpin { to{transform:rotate(360deg);} }
`;

export default function CitizenAlertsPage() {
  const [alerts, setAlerts]       = useState<Alert[]>([]);
  const [loading, setLoading]     = useState(true);
  const [connected, setConnected] = useState(false);
  const [filter, setFilter]       = useState<"all" | "danger" | "warning" | "info">("all");
  const [newIds, setNewIds]       = useState<Set<string>>(new Set());

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) console.error("CitizenAlerts load error:", error);
      setAlerts((data as Alert[]) ?? []);
      setLoading(false);
    };
    load();

    const channel = supabase
      .channel("citizen-alerts-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "alerts" },
        (payload) => {
          const a = payload.new as Alert;
          setAlerts((prev) => {
            if (prev.some((x) => x.id === a.id)) return prev;
            return [a, ...prev];
          });
          setNewIds((prev) => new Set(prev).add(a.id));
          ping();
          setTimeout(() => {
            setNewIds((prev) => { const n = new Set(prev); n.delete(a.id); return n; });
          }, 5000);
        }
      )
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "alerts" },
        (payload) => {
          setAlerts((prev) => prev.filter((a) => a.id !== payload.old.id));
        }
      )
      .subscribe((s) => setConnected(s === "SUBSCRIBED"));

    return () => { supabase.removeChannel(channel); };
  }, []);

  const filtered = filter === "all" ? alerts : alerts.filter((a) => a.type === filter);
  const counts = {
    all:     alerts.length,
    danger:  alerts.filter((a) => a.type === "danger").length,
    warning: alerts.filter((a) => a.type === "warning").length,
    info:    alerts.filter((a) => a.type === "info").length,
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="ca-root">
        <div className="ca-bg" style={{ backgroundImage: `url(${pagesBackground})` }} />
        <div className="ca-glow">
          <div className="ca-glow-a" />
          <div className="ca-glow-b" />
        </div>

        <div className="ca-inner">

          {/* Hero */}
          <section className="ca-hero">
            <div className="ca-hero-tag">
              <span className="ca-hero-dot" />
              Citizen Portal
            </div>
            <h1 className="ca-hero-heading">
              Barangay <em>Alerts</em>
            </h1>
            <p className="ca-hero-sub">
              <span className={`ca-live-dot ${connected ? "on" : "off"}`} />
              {connected ? "Live — updates automatically" : "Connecting…"}
            </p>
          </section>

          {/* Filters */}
          <div className="ca-filters">
            {(["all", "danger", "warning", "info"] as const).map((f) => (
              <button
                key={f}
                className={`ca-pill ca-pill--${f}${filter === f ? " on" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f === "all" ? `ALL (${counts.all})` : `${f.toUpperCase()} (${counts[f]})`}
              </button>
            ))}
          </div>

          {/* Section head */}
          <div className="ca-sec">
            <span className="ca-sec-label">
              {filter === "all" ? "All Alerts" : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Alerts`}
            </span>
            <span className="ca-sec-line" />
            <span className="ca-sec-count">{filtered.length} total</span>
          </div>

          {/* Content */}
          {loading ? (
            <div className="ca-loading">
              <span className="ca-spin" /> Loading alerts…
            </div>
          ) : filtered.length === 0 ? (
            <div className="ca-empty">
              <div className="ca-empty-icon"><FaBellSlash /></div>
              <div className="ca-empty-title">No Active Alerts</div>
              <p className="ca-empty-sub">
                {alerts.length === 0
                  ? "No emergency alerts have been issued. This page updates automatically in real-time."
                  : "No alerts match this filter."}
              </p>
            </div>
          ) : (
            <div className="ca-list">
              {filtered.map((a, i) => {
                const meta  = ALERT_TYPE_META[a.type] ?? ALERT_TYPE_META.info;
                const isNew = newIds.has(a.id);
                return (
                  <div
                    key={a.id}
                    className={`ca-card${isNew ? " is-new" : ""}`}
                    style={{
                      "--ca-color": meta.color,
                      animationDelay: `${Math.min(i * 0.05, 0.5)}s`,
                    } as React.CSSProperties}
                  >
                    <div className="ca-card-body">
                      <div className="ca-card-top">
                        <div
                          className="ca-card-icon"
                          style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}
                        >
                          {meta.icon}
                        </div>
                        <div className="ca-card-info">
                          <div className="ca-card-title">{a.title || "Alert"}</div>
                          <div className="ca-card-msg">{a.message}</div>
                        </div>
                      </div>
                      <div className="ca-card-footer">
                        <span
                          className="ca-tag"
                          style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}
                        >
                          {meta.label}
                        </span>
                        {isNew && (
                          <span className="ca-new-badge">
                            <span className="ca-new-badge-dot" />NEW
                          </span>
                        )}
                        <span className="ca-time">
                          <FaClock size={9} />
                          {timeAgo(a.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </>
  );
}