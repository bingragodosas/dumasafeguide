// src/admin/AdminDispatch.tsx
//
// HQ command map: live incidents + field responder GPS positions on a single
// interactive Leaflet view, with a side panel for the active roster and a
// manual dispatch trigger (unassigned incident → available unit).
//
// Data reality note: this project has no `responder_locations` / `incidents`
// tables — unit positions come from profiles.last_lat/last_lng (broadcast by
// the responder Dispatch view) and incidents from `reports`. Realtime sync
// therefore subscribes to `profiles` + `reports` postgres_changes.

import { useEffect, useMemo, useRef, useState } from "react";
import { Marker, Polyline, Popup } from "react-leaflet";
import { supabase } from "../js/supabase";
import DispatchMap, { incidentPin, unitPin } from "../components/dispatch/DispatchMap";
import { HQ_POS, parseCoords } from "../components/dispatch/geo";

interface DispatchReport {
  id: string | number;
  type: string;
  description: string | null;
  address: string | null;
  location: string | null;
  status: string;
  reporter_name: string | null;
  responder_id: string | null;
  created_at: string;
}

interface FieldUnit {
  id: string;
  full_name: string | null;
  status?: string | null;
  last_lat?: number | null;
  last_lng?: number | null;
  location_updated_at?: string | null;
}

function fmtAgo(ts: string | null | undefined): string {
  if (!ts) return "never";
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 0) return "just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(ts).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

// Priority color: pending = urgent red, in-progress = warning yellow, else info blue.
function incidentColor(status: string): string {
  if (status === "pending") return "#FF3B30";
  if (status === "in-progress") return "#FF9500";
  return "#4A90D9";
}

function unitTag(u: FieldUnit): { label: string; color: string } {
  if (u.status === "responding") return { label: "En Route", color: "#FF9500" };
  if (u.status === "on_duty") return { label: "On Duty", color: "#00B074" };
  return { label: "Off Duty", color: "var(--text-tertiary, rgba(238,240,247,0.4))" };
}

export default function AdminDispatch() {
  const [reports, setReports] = useState<DispatchReport[]>([]);
  const [units, setUnits] = useState<FieldUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selIncident, setSelIncident] = useState("");
  const [selUnit, setSelUnit] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  // Pin-click quick dispatch modal.
  const [pinIncident, setPinIncident] = useState<DispatchReport | null>(null);
  const [pinUnit, setPinUnit] = useState("");
  const [pinBusy, setPinBusy] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);
  // Shared STATUS / TYPE filter pills (mirrors the responder Dispatch view).
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");

  const STATUS_FILTERS = ["all", "pending", "in-progress", "resolved"];
  const TYPE_FILTERS = ["all", "fire", "accident", "flood", "crime", "medical", "other"];

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 4000);
  };

  const load = async () => {
    const [{ data: rpt }, { data: prof }] = await Promise.all([
      supabase.from("reports").select("id,type,description,address,location,status,reporter_name,responder_id,created_at").order("created_at", { ascending: false }).limit(200),
      supabase.from("profiles").select("id,full_name,status,last_lat,last_lng,location_updated_at").eq("role", "responder").order("full_name"),
    ]);
    setReports((rpt ?? []) as DispatchReport[]);
    setUnits((prof ?? []) as FieldUnit[]);
    setLoading(false);
  };

  useEffect(() => {
    void load();
    const ch = supabase
      .channel("admin-dispatch-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const geoReports = useMemo(
    () => reports.map(r => ({ r, pos: parseCoords(r.location) })).filter((x): x is { r: DispatchReport; pos: [number, number] } => x.pos !== null),
    [reports]
  );
  // Map pins follow the shared STATUS / TYPE pills.
  const visibleReports = useMemo(
    () => geoReports.filter(({ r }) =>
      (filterStatus === "all" || r.status === filterStatus) &&
      (filterType === "all" || (r.type ?? "other").toLowerCase() === filterType)
    ),
    [geoReports, filterStatus, filterType]
  );
  const geoUnits = useMemo(
    () => units.filter(u => u.last_lat != null && u.last_lng != null),
    [units]
  );
  // Unassigned queue: pending rows, rows with no responder, plus in-progress
  // rows eligible for reassignment (mirrors the requested
  // `status === 'pending' || !responder_id || status === 'in_progress'` set;
  // field names follow this repo's `reports` schema: responder_id, status).
  const unassigned = useMemo(
    () => reports.filter(r => r.status === "pending" || !r.responder_id || r.status === "in-progress"),
    [reports]
  );
  const available = useMemo(
    () => units.filter(u => u.status === "on_duty" || u.status === "responding"),
    [units]
  );

  // Active route lines: dispatched unit GPS → assigned incident coords.
  const activeRoutes = useMemo(() => {
    const lines: Array<{ key: string; from: [number, number]; to: [number, number]; label: string }> = [];
    for (const r of reports) {
      if (!r.responder_id || r.status !== "in-progress") continue;
      const unit = units.find(u => u.id === r.responder_id);
      const dest = parseCoords(r.location);
      if (!unit || unit.last_lat == null || unit.last_lng == null || !dest) continue;
      lines.push({
        key: `${unit.id}-${r.id}`,
        from: [unit.last_lat, unit.last_lng],
        to: dest,
        label: `${unit.full_name || "Unit"} → #${String(r.id).slice(0, 8)}`,
      });
    }
    return lines;
  }, [reports, units]);

  // Optimistic dispatch: paint the assignment + route vector instantly, then
  // persist. The responder's operational status uses this app's vocabulary
  // ("responding" = en route; a literal "en_route" value would break the
  // status filters/tags, so it is intentionally not used).
  const assignUnit = async (incidentId: string, unitId: string): Promise<boolean> => {
    const prevReports = reports;
    const prevUnits = units;
    setReports(rs => rs.map(r =>
      String(r.id) === incidentId ? { ...r, responder_id: unitId, status: "in-progress" } : r
    ));
    setUnits(us => us.map(u =>
      u.id === unitId ? { ...u, status: "responding", location_updated_at: new Date().toISOString() } : u
    ));
    try {
      const { error } = await supabase.from("reports")
        .update({ responder_id: unitId, status: "in-progress" })
        .eq("id", incidentId);
      if (error) throw error;
      const { error: uerr } = await supabase.from("profiles")
        .update({ status: "responding", last_seen: new Date().toISOString() })
        .eq("id", unitId);
      if (uerr) throw uerr;
      showToast(`Unit successfully dispatched to Incident #${incidentId.slice(0, 8)}`);
      await load();
      return true;
    } catch {
      setReports(prevReports);
      setUnits(prevUnits);
      return false;
    }
  };

  const manualDispatch = async () => {
    if (!selIncident || !selUnit) { setNotice("Select an incident and a unit first."); return; }
    setBusy(true);
    setNotice(null);
    const ok = await assignUnit(selIncident, selUnit);
    setBusy(false);
    if (!ok) { setNotice("Dispatch failed. Please try again."); return; }
    setNotice("Unit dispatched.");
    setSelIncident("");
  };

  const pinDispatch = async () => {
    if (!pinIncident || !pinUnit) { setPinError("Select a unit first."); return; }
    setPinBusy(true);
    setPinError(null);
    const ok = await assignUnit(String(pinIncident.id), pinUnit);
    setPinBusy(false);
    if (!ok) { setPinError("Dispatch failed. Please try again."); return; }
    setPinIncident(null);
    setPinUnit("");
  };

  return (
    <div>
      <div className="hud-page-header">
        <div>
          <div className="hud-eyebrow">Admin Panel</div>
          <div className="hud-title">Dispatch Command Map</div>
          <div className="hud-subtitle">DUMAGUETE CITY · LIVE UNITS + INCIDENTS</div>
        </div>
        <div className="hud-live-tag"><span className="hud-live-dot" />LIVE COMMAND FEED</div>
      </div>

      {/* ── Shared STATUS / TYPE filter pills (mirrors responder view) ── */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "var(--text-tertiary, rgba(238,240,247,0.4))" }}>STATUS</span>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {STATUS_FILTERS.map(s => {
            const n = s === "all" ? reports.length : reports.filter(r => r.status === s).length;
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                style={{
                  fontSize: 11, fontWeight: 700, padding: "6px 12px", borderRadius: 16, cursor: "pointer",
                  background: filterStatus === s ? "rgba(0,102,255,0.15)" : "transparent",
                  border: `1px solid ${filterStatus === s ? "rgba(0,102,255,0.5)" : "rgba(255,255,255,0.1)"}`,
                  color: filterStatus === s ? "#4A90D9" : "var(--text-secondary, rgba(238,240,247,0.55))",
                }}
              >
                {s === "all" ? "All" : s === "in-progress" ? "In Progress" : s.charAt(0).toUpperCase() + s.slice(1)} ({n})
              </button>
            );
          })}
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "var(--text-tertiary, rgba(238,240,247,0.4))" }}>TYPE</span>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {TYPE_FILTERS.map(t => {
            const n = t === "all" ? reports.length : reports.filter(r => (r.type ?? "other").toLowerCase() === t).length;
            return (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                style={{
                  fontSize: 11, fontWeight: 700, padding: "6px 12px", borderRadius: 16, cursor: "pointer", textTransform: "capitalize",
                  background: filterType === t ? "rgba(0,176,116,0.12)" : "transparent",
                  border: `1px solid ${filterType === t ? "rgba(0,176,116,0.5)" : "rgba(255,255,255,0.1)"}`,
                  color: filterType === t ? "#00B074" : "var(--text-secondary, rgba(238,240,247,0.55))",
                }}
              >
                {t === "all" ? "All" : t} ({n})
              </button>
            );
          })}
        </div>
      </div>

      <div className="hud-panels-row" style={{ gridTemplateColumns: "2fr 1fr" }}>
        {/* Map — shared DispatchMap shell (identical tiles/markers/HUD chrome) */}
        <div className="hud-panel" style={{ padding: 0, overflow: "hidden" }}>
          <DispatchMap center={HQ_POS} zoom={14} height={560}>
            {visibleReports.map(({ r, pos }) => (
                <Marker
                  key={String(r.id)}
                  position={pos}
                  icon={incidentPin(incidentColor(r.status))}
                  eventHandlers={{ click: () => { setPinIncident(r); setPinUnit(""); setPinError(null); setSelIncident(String(r.id)); } }}
                >
                <Popup>
                  <div style={{ fontSize: 12, fontWeight: 700, textTransform: "capitalize" }}>{r.type}</div>
                  <div style={{ fontSize: 11 }}>{r.address || r.location}</div>
                  <div style={{ fontSize: 10, opacity: 0.7 }}>{r.status} · {r.reporter_name || "Anonymous"}</div>
                  <div style={{ fontSize: 10, opacity: 0.7 }}>Click pin to dispatch →</div>
                </Popup>
              </Marker>
            ))}
            {activeRoutes.map(line => (
              <Polyline
                key={line.key}
                positions={[line.from, line.to]}
                pathOptions={{ color: "#00B074", weight: 3, opacity: 0.75, dashArray: "7 6" }}
              />
            ))}
            {geoUnits.map(u => (
              <Marker key={u.id} position={[u.last_lat!, u.last_lng!]} icon={unitPin(null)} zIndexOffset={500}>
                <Popup>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{u.full_name || "Unit"}</div>
                  <div style={{ fontSize: 11 }}>{unitTag(u).label} · {fmtAgo(u.location_updated_at)}</div>
                </Popup>
              </Marker>
            ))}
          </DispatchMap>
          <div style={{ display: "flex", gap: 12, padding: "10px 16px", fontSize: 11, color: "var(--text-secondary, rgba(238,240,247,0.6))", flexWrap: "wrap" }}>
            <span><span style={{ color: "#FF3B30" }}>●</span> Urgent / Pending</span>
            <span><span style={{ color: "#FF9500" }}>●</span> Warning / In Progress</span>
            <span><span style={{ color: "#4A90D9" }}>●</span> Info / Resolved</span>
            <span>🚑 Field unit ({geoUnits.length} tracked)</span>
          </div>
        </div>

        {/* Side panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="hud-panel">
            <div className="hud-panel-head">
              <span className="hud-panel-title">Active Responders ({units.length})</span>
              <span className="hud-panel-tag">LIVE</span>
            </div>
            {loading ? (
              <div className="hud-empty"><div className="hud-spinner" style={{ margin: "0 auto" }} /></div>
            ) : units.length === 0 ? (
              <div className="hud-empty">No responders found</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 260, overflowY: "auto" }}>
                {units.map(u => {
                  const tag = unitTag(u);
                  return (
                    <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: tag.color, boxShadow: `0 0 6px ${tag.color}`, flexShrink: 0 }} />
                      <span style={{ flex: 1, color: "var(--text, #eef0f7)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {u.full_name || "Unit"}
                      </span>
                      <span style={{ color: tag.color, fontSize: 10, fontWeight: 700 }}>{tag.label}</span>
                      <span style={{ color: "var(--text-tertiary, rgba(238,240,247,0.35))", fontSize: 10 }}>{fmtAgo(u.location_updated_at)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="hud-panel">
            <div className="hud-panel-head">
              <span className="hud-panel-title">Manual Dispatch</span>
            </div>
            <label style={{ display: "block", fontSize: 11, color: "var(--text-secondary, rgba(238,240,247,0.55))", marginBottom: 4 }}>Unassigned incident</label>
            <select value={selIncident} onChange={e => setSelIncident(e.target.value)} className="hud-select" style={{ width: "100%", marginBottom: 10 }}>
              <option value="">Select incident… ({unassigned.length} pending)</option>
              {unassigned.map(r => (
                <option key={String(r.id)} value={String(r.id)}>
                  #{String(r.id).slice(0, 8)} - {(r.type || "other").replace(/_/g, " ")} ({(r.address || r.location || "no location").slice(0, 32)})
                </option>
              ))}
            </select>
            <label style={{ display: "block", fontSize: 11, color: "var(--text-secondary, rgba(238,240,247,0.55))", marginBottom: 4 }}>Available unit</label>
            <select value={selUnit} onChange={e => setSelUnit(e.target.value)} className="hud-select" style={{ width: "100%", marginBottom: 12 }}>
              <option value="">Select unit… ({available.length} available)</option>
              {available.map(u => (
                <option key={u.id} value={u.id}>{u.full_name || "Unit"} — {unitTag(u).label}</option>
              ))}
            </select>
            {notice && <div style={{ fontSize: 11, marginBottom: 8, color: notice.startsWith("Unit dispatched") ? "#00B074" : "#FF3B30" }}>{notice}</div>}
            <button className="hud-act-btn hud-act-btn--primary" disabled={busy || !selIncident || !selUnit} onClick={manualDispatch} style={{ width: "100%" }}>
              {busy ? "Dispatching…" : "Dispatch Unit"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Toast notification ── */}
      {toast && (
        <div
          style={{
            position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 1100,
            background: "rgba(0,176,116,0.16)", border: "1px solid rgba(0,176,116,0.5)", color: "#00B074",
            borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 700,
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)", maxWidth: "calc(100vw - 40px)", textAlign: "center",
          }}
        >
          ✓ {toast}
        </div>
      )}

      {/* ── Pin-click quick dispatch modal ── */}
      {pinIncident && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={() => setPinIncident(null)}
        >
          <div
            style={{ width: "100%", maxWidth: 440, background: "#0f1623", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: 22 }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text, #eef0f7)", marginBottom: 4, textTransform: "capitalize" }}>
              {(pinIncident.type || "other").replace(/_/g, " ")} #{String(pinIncident.id).slice(0, 8)}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-secondary, rgba(238,240,247,0.55))", marginBottom: 4 }}>
              {pinIncident.address || pinIncident.location || "No location"}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-tertiary, rgba(238,240,247,0.4))", marginBottom: 14 }}>
              Status: {pinIncident.status} · Reporter: {pinIncident.reporter_name || "Anonymous"}
            </div>
            <label style={{ display: "block", fontSize: 11, color: "var(--text-secondary, rgba(238,240,247,0.55))", marginBottom: 4 }}>Assign unit</label>
            <select value={pinUnit} onChange={e => setPinUnit(e.target.value)} className="hud-select" style={{ width: "100%", marginBottom: 12 }}>
              <option value="">Select unit… ({available.length} available)</option>
              {available.map(u => (
                <option key={u.id} value={u.id}>{u.full_name || "Unit"} — {unitTag(u).label}</option>
              ))}
            </select>
            {pinError && <div style={{ color: "#FF3B30", fontSize: 11, marginBottom: 8 }}>{pinError}</div>}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="hud-act-btn" onClick={() => setPinIncident(null)}>Cancel</button>
              <button className="hud-act-btn hud-act-btn--primary" disabled={pinBusy || !pinUnit} onClick={pinDispatch}>
                {pinBusy ? "Dispatching…" : "Assign Unit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
