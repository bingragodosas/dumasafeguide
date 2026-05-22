import { useEffect, useState } from "react";
import { supabase } from "../js/supabase";

const IA_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@500;700;800&family=Instrument+Sans:wght@400;500&display=swap');

  .ia-root {
    font-family: 'Instrument Sans', sans-serif;
    color: #edf0fa;
    padding: 32px 0 80px;
    min-height: 100vh;
  }

  /* ── Header ── */
  .ia-header {
    display: flex; align-items: flex-start; justify-content: space-between;
    flex-wrap: wrap; gap: 16px; margin-bottom: 32px;
  }
  .ia-eyebrow {
    font-size: 10px; font-weight: 700; letter-spacing: .18em;
    text-transform: uppercase; color: rgba(237,240,250,.3); margin-bottom: 6px;
  }
  .ia-title {
    font-family: 'Cabinet Grotesk', sans-serif;
    font-size: 26px; font-weight: 800; letter-spacing: -.02em;
    color: #f0f2f8; margin: 0 0 4px;
  }
  .ia-subtitle { font-size: 13px; color: rgba(237,240,250,.4); margin: 0; }

  /* ── Stat row ── */
  .ia-stats {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 12px; margin-bottom: 28px;
  }
  .ia-stat {
    background: rgba(255,255,255,.035); border: 1px solid rgba(255,255,255,.07);
    border-radius: 12px; padding: 18px 20px; position: relative; overflow: hidden;
  }
  .ia-stat::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: var(--is-color); opacity: .7;
  }
  .ia-stat-num {
    font-family: 'Cabinet Grotesk', sans-serif;
    font-size: 30px; font-weight: 800; color: var(--is-color); line-height: 1;
    margin-bottom: 4px;
  }
  .ia-stat-label {
    font-size: 11.5px; font-weight: 500; color: rgba(237,240,250,.4);
  }
  .ia-stat-pct {
    font-size: 10.5px; color: rgba(237,240,250,.25); margin-top: 2px;
  }

  /* ── Grid layout ── */
  .ia-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  @media (max-width: 700px) { .ia-grid { grid-template-columns: 1fr; } }

  .ia-panel {
    background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.07);
    border-radius: 14px; padding: 22px;
  }
  .ia-panel-full { grid-column: 1 / -1; }
  .ia-panel-title {
    font-family: 'Cabinet Grotesk', sans-serif;
    font-size: 12px; font-weight: 800; letter-spacing: .1em;
    text-transform: uppercase; color: rgba(237,240,250,.3);
    margin-bottom: 20px;
  }

  /* ── Horizontal bar chart ── */
  .ia-hbar-row {
    display: flex; align-items: center; gap: 12px; margin-bottom: 14px;
  }
  .ia-hbar-row:last-child { margin-bottom: 0; }
  .ia-hbar-label { font-size: 12px; color: rgba(237,240,250,.55); width: 90px; flex-shrink: 0; }
  .ia-hbar-track {
    flex: 1; height: 8px; border-radius: 4px;
    background: rgba(255,255,255,.06); overflow: hidden;
  }
  .ia-hbar-fill {
    height: 100%; border-radius: 4px;
    background: var(--hb-color);
    transition: width .6s cubic-bezier(.4,0,.2,1);
  }
  .ia-hbar-val {
    font-family: 'Cabinet Grotesk', sans-serif;
    font-size: 13px; font-weight: 700;
    color: var(--hb-color); width: 28px; text-align: right; flex-shrink: 0;
  }

  /* ── Vertical bar chart ── */
  .ia-vbar-wrap {
    display: flex; align-items: flex-end; gap: 6px;
    height: 140px; padding-bottom: 24px; position: relative;
  }
  .ia-vbar-col {
    flex: 1; display: flex; flex-direction: column; align-items: center;
    gap: 4px; height: 100%; justify-content: flex-end;
  }
  .ia-vbar-bar {
    width: 100%; border-radius: 5px 5px 0 0;
    background: var(--vb-color); min-height: 4px;
    transition: height .5s cubic-bezier(.4,0,.2,1);
    position: relative;
  }
  .ia-vbar-bar:hover::after {
    content: attr(data-val);
    position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%);
    background: rgba(15,22,35,.95); border: 1px solid rgba(255,255,255,.1);
    border-radius: 5px; padding: 3px 7px;
    font-size: 11px; font-weight: 700; color: #edf0fa;
    white-space: nowrap; pointer-events: none; margin-bottom: 4px;
  }
  .ia-vbar-xlabel {
    font-size: 10px; color: rgba(237,240,250,.3);
    text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    max-width: 100%;
  }

  /* ── Donut-style ring ── */
  .ia-donut-wrap {
    display: flex; align-items: center; gap: 24px;
  }
  .ia-donut-ring {
    width: 110px; height: 110px; flex-shrink: 0;
  }
  .ia-donut-legend { display: flex; flex-direction: column; gap: 10px; flex: 1; }
  .ia-donut-legend-item {
    display: flex; align-items: center; gap: 8px;
  }
  .ia-donut-legend-dot {
    width: 8px; height: 8px; border-radius: 2px; flex-shrink: 0;
  }
  .ia-donut-legend-label { font-size: 12.5px; color: rgba(237,240,250,.55); flex: 1; }
  .ia-donut-legend-val {
    font-family: 'Cabinet Grotesk', sans-serif;
    font-size: 13px; font-weight: 700; color: rgba(237,240,250,.7);
  }

  /* ── Resolution rate ── */
  .ia-res-rate-wrap { display: flex; align-items: center; gap: 20px; }
  .ia-res-rate-num {
    font-family: 'Cabinet Grotesk', sans-serif;
    font-size: 52px; font-weight: 800; line-height: 1;
    color: #2ECC8F;
  }
  .ia-res-rate-label { font-size: 13px; color: rgba(237,240,250,.4); line-height: 1.5; }
  .ia-res-bar-track {
    margin-top: 16px; height: 8px; border-radius: 4px;
    background: rgba(255,255,255,.06); overflow: hidden;
  }
  .ia-res-bar-fill {
    height: 100%; border-radius: 4px; background: #2ECC8F;
    transition: width .8s cubic-bezier(.4,0,.2,1);
  }
`;

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const TYPE_COLORS: Record<string, string> = {
  fire:       "#FB923C",
  flood:      "#7B9EFF",
  crime:      "#EF5B5B",
  medical:    "#2ECC8F",
  accident:   "#FFD166",
  other:      "#888",
};

export default function IncidentAnalytics() {
  const [incidents, setIncidents] = useState<any[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      const { data } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: true });
      setIncidents(data || []);
    };
    fetchAll();
  }, []);

  const total = incidents.length;
  const pending  = incidents.filter((i) => i.status === "pending").length;
  const inProg   = incidents.filter((i) => i.status === "in-progress").length;
  const resolved = incidents.filter((i) => i.status === "resolved").length;
  const resRate  = total > 0 ? Math.round((resolved / total) * 100) : 0;

  // Monthly counts (last 6 months)
  const now = new Date();
  const monthly = Array.from({ length: 6 }, (_, idx) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1);
    const count = incidents.filter((i) => {
      const id = new Date(i.created_at);
      return id.getFullYear() === d.getFullYear() && id.getMonth() === d.getMonth();
    }).length;
    return { label: MONTH_LABELS[d.getMonth()], count };
  });
  const maxMonthly = Math.max(...monthly.map((m) => m.count), 1);

  // Type breakdown
  const typeCounts: Record<string, number> = {};
  incidents.forEach((i) => {
    const t = (i.type || "other").toLowerCase();
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  });
  const typeEntries = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
  const maxType = Math.max(...typeEntries.map((e) => e[1]), 1);

  // Donut SVG data
  const statusSlices = [
    { label: "Pending",    count: pending,  color: "#FFD166" },
    { label: "In Progress",count: inProg,   color: "#7B9EFF" },
    { label: "Resolved",   count: resolved, color: "#2ECC8F" },
  ];
  const donutRadius = 44;
  const donutCircumference = 2 * Math.PI * donutRadius;
  let donutOffset = 0;

  return (
    <>
      <style>{IA_STYLE}</style>
      <div className="ia-root">

        {/* Header */}
        <div className="ia-header">
          <div>
            <div className="ia-eyebrow">Admin Panel</div>
            <h1 className="ia-title">Incident Analytics</h1>
            <p className="ia-subtitle">Statistical overview of reported incidents</p>
          </div>
        </div>

        {/* Stat strip */}
        <div className="ia-stats">
          {[
            { label: "Total Reports", value: total,    color: "#7B9EFF", pct: "All time" },
            { label: "Pending",       value: pending,  color: "#FFD166", pct: total ? `${Math.round((pending/total)*100)}%` : "0%" },
            { label: "In Progress",   value: inProg,   color: "#7B9EFF", pct: total ? `${Math.round((inProg/total)*100)}%` : "0%" },
            { label: "Resolved",      value: resolved, color: "#2ECC8F", pct: total ? `${resRate}%` : "0%" },
          ].map((s) => (
            <div className="ia-stat" key={s.label} style={{ "--is-color": s.color } as React.CSSProperties}>
              <div className="ia-stat-num">{s.value}</div>
              <div className="ia-stat-label">{s.label}</div>
              <div className="ia-stat-pct">{s.pct} of total</div>
            </div>
          ))}
        </div>

        {/* Charts grid */}
        <div className="ia-grid">

          {/* Monthly trend */}
          <div className="ia-panel ia-panel-full">
            <div className="ia-panel-title">Monthly Incident Trend (Last 6 Months)</div>
            <div className="ia-vbar-wrap">
              {monthly.map((m) => (
                <div className="ia-vbar-col" key={m.label}>
                  <div
                    className="ia-vbar-bar"
                    data-val={m.count}
                    style={{
                      height: `${Math.round((m.count / maxMonthly) * 100)}%`,
                      "--vb-color": "#7B9EFF",
                    } as React.CSSProperties}
                  />
                  <span className="ia-vbar-xlabel">{m.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Type breakdown */}
          <div className="ia-panel">
            <div className="ia-panel-title">Incidents by Type</div>
            {typeEntries.length === 0 ? (
              <p style={{ fontSize: 13, color: "rgba(237,240,250,.25)", margin: 0 }}>No data yet.</p>
            ) : (
              typeEntries.map(([type, count]) => (
                <div className="ia-hbar-row" key={type}>
                  <span className="ia-hbar-label">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                  <div className="ia-hbar-track">
                    <div
                      className="ia-hbar-fill"
                      style={{
                        width: `${Math.round((count / maxType) * 100)}%`,
                        "--hb-color": TYPE_COLORS[type] ?? "#888",
                      } as React.CSSProperties}
                    />
                  </div>
                  <span
                    className="ia-hbar-val"
                    style={{ "--hb-color": TYPE_COLORS[type] ?? "#888" } as React.CSSProperties}
                  >
                    {count}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Status donut */}
          <div className="ia-panel">
            <div className="ia-panel-title">Status Distribution</div>
            <div className="ia-donut-wrap">
              {/* SVG donut */}
              <svg className="ia-donut-ring" viewBox="0 0 110 110">
                <circle cx="55" cy="55" r={donutRadius} fill="none"
                  stroke="rgba(255,255,255,.06)" strokeWidth="12" />
                {total === 0 ? (
                  <circle cx="55" cy="55" r={donutRadius} fill="none"
                    stroke="rgba(255,255,255,.08)" strokeWidth="12" />
                ) : statusSlices.map((s) => {
                  const dash = (s.count / total) * donutCircumference;
                  const gap  = donutCircumference - dash;
                  const el = (
                    <circle key={s.label}
                      cx="55" cy="55" r={donutRadius} fill="none"
                      stroke={s.color} strokeWidth="12"
                      strokeDasharray={`${dash} ${gap}`}
                      strokeDashoffset={-donutOffset}
                      strokeLinecap="butt"
                      transform="rotate(-90 55 55)"
                      style={{ opacity: .85 }}
                    />
                  );
                  donutOffset += dash;
                  return el;
                })}
                <text x="55" y="51" textAnchor="middle"
                  fill="#f0f2f8" fontSize="18" fontWeight="800"
                  fontFamily="Cabinet Grotesk, sans-serif">{total}</text>
                <text x="55" y="65" textAnchor="middle"
                  fill="rgba(237,240,250,.35)" fontSize="9.5"
                  fontFamily="Instrument Sans, sans-serif">TOTAL</text>
              </svg>

              <div className="ia-donut-legend">
                {statusSlices.map((s) => (
                  <div className="ia-donut-legend-item" key={s.label}>
                    <div className="ia-donut-legend-dot" style={{ background: s.color }} />
                    <span className="ia-donut-legend-label">{s.label}</span>
                    <span className="ia-donut-legend-val">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Resolution rate */}
          <div className="ia-panel ia-panel-full">
            <div className="ia-panel-title">Resolution Rate</div>
            <div className="ia-res-rate-wrap">
              <div className="ia-res-rate-num">{resRate}%</div>
              <div className="ia-res-rate-label">
                of all reported incidents<br />have been resolved
              </div>
            </div>
            <div className="ia-res-bar-track">
              <div className="ia-res-bar-fill" style={{ width: `${resRate}%` }} />
            </div>
          </div>

        </div>
      </div>
    </>
  );
}