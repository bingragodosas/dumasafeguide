import { useEffect, useRef, useState } from "react";
import { supabase } from "../js/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Report {
  id: string | number;
  type: string;
  description: string | null;
  location: string | null;
  address: string | null;
  reporter_name: string | null;
  reporter_contact: string | null;
  status: string;
  evidence_url: string | null;
  created_at: string;
  responder_id: string | null;
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

const TYPE_META: Record<string, { icon: string; label: string; colorClass: string }> = {
  fire:     { icon: "🔥", label: "Fire",     colorClass: "type-fire"     },
  accident: { icon: "🚗", label: "Accident", colorClass: "type-accident" },
  flood:    { icon: "🌊", label: "Flood",    colorClass: "type-flood"    },
  crime:    { icon: "🚨", label: "Crime",    colorClass: "type-crime"    },
  medical:  { icon: "🏥", label: "Medical",  colorClass: "type-medical"  },
  other:    { icon: "⚠️", label: "Other",    colorClass: "type-other"    },
};

const STATUS_META: Record<string, { label: string; colorClass: string }> = {
  pending:       { label: "Pending",     colorClass: "status-pending"     },
  "in-progress": { label: "In Progress", colorClass: "status-in-progress" },
  resolved:      { label: "Resolved",    colorClass: "status-resolved"    },
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const STYLES = `
:root {
  --ink:   #07101C;
  --s1:    #080F1B;
  --s2:    #060C16;
  --edge:  rgba(255,255,255,0.07);
  --text:  #D8EAF8;
  --muted: rgba(216,234,248,0.45);
  --dim:   rgba(216,234,248,0.22);

  --red:   #F44;
  --amber: #F90;
  --blue:  #3B9EFF;
  --green: #00DC82;
  --pink:  #FF3FA4;
  --slate: #8899BB;

  --font-head: 'Bebas Neue', 'Arial Narrow', Arial, sans-serif;
  --font-mono: 'IBM Plex Mono', 'Fira Mono', monospace;
  --font-body: 'DM Sans', system-ui, sans-serif;
}

@keyframes pip {
  0%,100% { opacity:1; transform:scale(1); }
  50%     { opacity:0.5; transform:scale(1.5); }
}
@keyframes spin {
  to { transform:rotate(360deg); }
}
@keyframes fadeIn {
  from { opacity:0; transform:translateY(4px); }
  to   { opacity:1; transform:translateY(0); }
}

*,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }

.dp {
  font-family: var(--font-body);
  color: var(--text);
  min-height: 100vh;
  background: var(--ink);
}

/* ── Header ── */
.dp-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}
.dp-eyebrow {
  font-family: var(--font-mono);
  font-size: 10px;
  color: rgba(244,68,68,0.6);
  letter-spacing: 0.28em;
  text-transform: uppercase;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.dp-eyebrow::before {
  content: '';
  display: block;
  width: 20px;
  height: 1px;
  background: var(--red);
  opacity: 0.5;
}
.dp-title {
  font-family: var(--font-head);
  font-size: 42px;
  font-weight: 400;
  color: #fff;
  letter-spacing: 0.04em;
  line-height: 1;
}
.dp-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.dp-live-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.14em;
  color: var(--red);
  padding: 7px 14px;
  border-radius: 6px;
  border: 1px solid rgba(244,68,68,0.25);
  background: rgba(244,68,68,0.06);
}
.dp-live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--red);
  animation: pip 1.6s ease infinite;
}

/* ── Filter bar ── */
.dp-filters {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  padding: 10px 14px;
  background: var(--s1);
  border: 1px solid var(--edge);
  border-radius: 10px;
  margin-bottom: 14px;
}
.dp-filter-label {
  font-family: var(--font-mono);
  font-size: 9px;
  color: var(--dim);
  letter-spacing: 0.2em;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
}
.dp-filter-sep {
  width: 1px;
  height: 18px;
  background: var(--edge);
  margin: 0 2px;
  flex-shrink: 0;
}
.dp-filter-group {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
}
.dp-chip {
  font-family: var(--font-mono);
  font-size: 9px;
  padding: 5px 11px;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid var(--edge);
  background: rgba(255,255,255,0.02);
  color: var(--muted);
  transition: background 0.15s, border-color 0.15s, color 0.15s;
  white-space: nowrap;
  user-select: none;
  letter-spacing: 0.04em;
}
.dp-chip:hover {
  border-color: rgba(255,255,255,0.15);
  color: var(--text);
}
.dp-chip.active {
  background: rgba(244,68,68,0.1);
  border-color: rgba(244,68,68,0.35);
  color: var(--red);
}
.dp-chip-count {
  display: inline-block;
  margin-left: 5px;
  font-size: 8px;
  opacity: 0.55;
  background: rgba(255,255,255,0.07);
  border-radius: 3px;
  padding: 1px 5px;
}

/* ── Layout ── */
.dp-body {
  display: grid;
  grid-template-columns: 1fr 370px;
  gap: 14px;
  align-items: start;
}
@media (max-width: 1060px) {
  .dp-body { grid-template-columns: 1fr; }
}

/* ── Panels ── */
.dp-panel {
  background: var(--s1);
  border: 1px solid var(--edge);
  border-radius: 12px;
  overflow: hidden;
  position: relative;
}
.dp-panel::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, rgba(244,68,68,0.5), rgba(59,158,255,0.15), transparent 55%);
  pointer-events: none;
  z-index: 1;
}
.dp-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--edge);
  background: rgba(255,255,255,0.015);
}
.dp-panel-title {
  font-family: var(--font-mono);
  font-size: 9px;
  color: var(--dim);
  letter-spacing: 0.2em;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 7px;
}
.dp-count-pill {
  font-family: var(--font-mono);
  font-size: 8px;
  padding: 3px 10px;
  border-radius: 20px;
  background: rgba(244,68,68,0.08);
  border: 1px solid rgba(244,68,68,0.22);
  color: var(--red);
  letter-spacing: 0.06em;
}

/* ── Map ── */
.dp-map-wrap { width: 100%; height: 540px; position: relative; }
.dp-map-wrap iframe { width:100%; height:100%; border:0; display:block; }
.dp-map-overlay {
  position: absolute;
  bottom: 14px;
  left: 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  z-index: 10;
  pointer-events: none;
}
.dp-map-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono);
  font-size: 9px;
  padding: 5px 11px;
  border-radius: 6px;
  background: rgba(7,16,28,0.9);
  border: 1px solid var(--edge);
  color: var(--muted);
  backdrop-filter: blur(10px);
}
.dp-map-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 540px;
  gap: 10px;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--dim);
  letter-spacing: 0.14em;
}

/* ── Queue ── */
.dp-queue {
  max-height: 576px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(244,68,68,0.15) transparent;
}
.dp-queue::-webkit-scrollbar { width: 3px; }
.dp-queue::-webkit-scrollbar-thumb {
  background: rgba(244,68,68,0.15);
  border-radius: 2px;
}

/* ── Cards ── */
.dp-card {
  padding: 13px 16px;
  cursor: pointer;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  position: relative;
  transition: background 0.14s;
  animation: fadeIn 0.2s ease both;
}
.dp-card::after {
  content: '';
  position: absolute;
  left: 0; top: 8px; bottom: 8px;
  width: 3px;
  border-radius: 0 2px 2px 0;
  transform: scaleY(0);
  transition: transform 0.18s cubic-bezier(0.4,0,0.2,1);
  transform-origin: center;
}
.dp-card:hover { background: rgba(255,255,255,0.02); }
.dp-card:hover::after,
.dp-card.selected::after { transform: scaleY(1); }
.dp-card.selected { background: rgba(255,255,255,0.025); }
.dp-card:last-child { border-bottom: none; }

/* Card accent colors by type */
.dp-card.type-fire::after    { background: #F44; }
.dp-card.type-accident::after { background: #F90; }
.dp-card.type-flood::after   { background: #3B9EFF; }
.dp-card.type-crime::after   { background: #FF3FA4; }
.dp-card.type-medical::after { background: #00DC82; }
.dp-card.type-other::after   { background: #8899BB; }

.dp-card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
  gap: 8px;
}
.dp-card-type {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  flex: 1;
  min-width: 0;
}
.dp-card-icon {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  flex-shrink: 0;
}

/* Type-specific icon bg */
.dp-card.type-fire     .dp-card-icon { background: rgba(244,68,68,0.12); }
.dp-card.type-accident .dp-card-icon { background: rgba(255,153,0,0.12); }
.dp-card.type-flood    .dp-card-icon { background: rgba(59,158,255,0.12); }
.dp-card.type-crime    .dp-card-icon { background: rgba(255,63,164,0.12); }
.dp-card.type-medical  .dp-card-icon { background: rgba(0,220,130,0.12); }
.dp-card.type-other    .dp-card-icon { background: rgba(136,153,187,0.12); }

/* Type-specific label color */
.dp-card.type-fire     .dp-card-type-label { color: #F44; }
.dp-card.type-accident .dp-card-type-label { color: #F90; }
.dp-card.type-flood    .dp-card-type-label { color: #3B9EFF; }
.dp-card.type-crime    .dp-card-type-label { color: #FF3FA4; }
.dp-card.type-medical  .dp-card-type-label { color: #00DC82; }
.dp-card.type-other    .dp-card-type-label { color: #8899BB; }

/* ── Status badges ── */
.dp-status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: var(--font-mono);
  font-size: 8px;
  padding: 3px 8px;
  border-radius: 4px;
  border: 1px solid rgba(255,255,255,0.07);
  white-space: nowrap;
  flex-shrink: 0;
  letter-spacing: 0.05em;
}
.dp-status-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
}
.dp-status.status-pending {
  background: rgba(244,68,68,0.1);
  color: #F44;
}
.dp-status.status-pending .dp-status-dot { background: #F44; }
.dp-status.status-in-progress {
  background: rgba(255,153,0,0.1);
  color: #F90;
}
.dp-status.status-in-progress .dp-status-dot { background: #F90; }
.dp-status.status-resolved {
  background: rgba(0,220,130,0.1);
  color: #00DC82;
}
.dp-status.status-resolved .dp-status-dot { background: #00DC82; }

/* ── Meta & tags ── */
.dp-card-addr {
  font-family: var(--font-mono);
  font-size: 9px;
  color: var(--dim);
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dp-card-desc {
  font-family: var(--font-mono);
  font-size: 9px;
  line-height: 1.6;
  color: rgba(216,234,248,0.3);
  font-style: italic;
  border-left: 2px solid rgba(255,255,255,0.06);
  padding-left: 9px;
  margin: 6px 0 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.dp-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}
.dp-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: var(--font-mono);
  font-size: 8px;
  padding: 3px 8px;
  border-radius: 4px;
  border: 1px solid var(--edge);
  background: rgba(255,255,255,0.02);
  color: var(--muted);
}
.dp-tag-tel {
  color: #00DC82;
  border-color: rgba(0,220,130,0.2);
  background: rgba(0,220,130,0.04);
  text-decoration: none;
  cursor: pointer;
}
.dp-tag-tel:hover { background: rgba(0,220,130,0.1); }

/* ── Action buttons ── */
.dp-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 8px;
}
.dp-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: var(--font-mono);
  font-size: 8px;
  font-weight: 500;
  letter-spacing: 0.04em;
  padding: 6px 11px;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid;
  text-decoration: none;
  transition: background 0.15s, transform 0.12s, border-color 0.15s;
  white-space: nowrap;
}
.dp-btn:hover { transform: translateY(-1px); }
.dp-btn:active { transform: translateY(0); }
.dp-btn-claim {
  background: rgba(244,68,68,0.08);
  border-color: rgba(244,68,68,0.3);
  color: var(--red);
}
.dp-btn-claim:hover {
  background: rgba(244,68,68,0.16);
  border-color: rgba(244,68,68,0.5);
}
.dp-btn-resolve {
  background: rgba(0,220,130,0.07);
  border-color: rgba(0,220,130,0.28);
  color: #00DC82;
}
.dp-btn-resolve:hover {
  background: rgba(0,220,130,0.14);
  border-color: rgba(0,220,130,0.45);
}
.dp-btn-nav {
  background: rgba(59,158,255,0.07);
  border-color: rgba(59,158,255,0.26);
  color: var(--blue);
}
.dp-btn-nav:hover {
  background: rgba(59,158,255,0.14);
  border-color: rgba(59,158,255,0.44);
}

/* ── Utility ── */
.dp-spinner {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.07);
  border-top-color: var(--red);
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}
.dp-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  gap: 12px;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--dim);
  letter-spacing: 0.14em;
  text-align: center;
}
.dp-empty-icon { font-size: 26px; opacity: 0.12; }

/* SVG icon helpers */
.dp-icon {
  display: inline-block;
  vertical-align: middle;
  flex-shrink: 0;
}
`;

// ─── SVG Icons (no external deps needed) ─────────────────────────────────────

const Icon = {
  MapPin: () => (
    <svg className="dp-icon" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  Clock: () => (
    <svg className="dp-icon" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  User: () => (
    <svg className="dp-icon" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Phone: () => (
    <svg className="dp-icon" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  ),
  Bolt: () => (
    <svg className="dp-icon" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  Check: () => (
    <svg className="dp-icon" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  Route: () => (
    <svg className="dp-icon" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="19" r="3"/><path d="M9 19h8.5c.4 0 .9-.2 1.2-.5l2.7-2.7c.3-.3.5-.7.6-1.1V5"/><path d="M18 5a3 3 0 0 0-3-3H9L6 5"/><circle cx="18" cy="5" r="3"/>
    </svg>
  ),
  File: () => (
    <svg className="dp-icon" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
    </svg>
  ),
  Filter: () => (
    <svg className="dp-icon" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    </svg>
  ),
  Layers: () => (
    <svg className="dp-icon" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
    </svg>
  ),
  Radar: () => (
    <svg className="dp-icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6a6 6 0 0 0 0 12"/><path d="M12 10a2 2 0 0 0 0 4"/><line x1="12" y1="2" x2="12" y2="12"/>
    </svg>
  ),
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRelative(ts: string): string {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(ts).toLocaleDateString();
}

function hasCoords(loc: string | null): boolean {
  if (!loc) return false;
  const parts = loc.split(",").map((s) => parseFloat(s.trim()));
  return parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1]);
}

function cls(...args: (string | false | undefined | null)[]): string {
  return args.filter(Boolean).join(" ");
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Dispatch() {
  const [reports, setReports]           = useState<Report[]>([]);
  const [loading, setLoading]           = useState(true);
  const [responderId, setResponderId]   = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType,   setFilterType]   = useState("all");
  const [selectedId,   setSelectedId]   = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setResponderId(user.id);
    });
  }, []);

  const loadReports = async () => {
    const { data } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });
    setReports(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadReports();
    const ch = supabase
      .channel("dispatch-reports")
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, loadReports)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const claimReport = async (id: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase
      .from("reports")
      .update({ responder_id: responderId, status: "in-progress" })
      .eq("id", id);
    loadReports();
  };

  const resolveReport = async (id: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase
      .from("reports")
      .update({ status: "resolved" })
      .eq("id", id);
    loadReports();
  };

  const filtered = reports.filter((r) => {
    const statusOk = filterStatus === "all" || r.status === filterStatus;
    const typeOk   = filterType   === "all" || r.type   === filterType;
    return statusOk && typeOk;
  });

  const countByStatus = (s: string) =>
    s === "all" ? reports.length : reports.filter((r) => r.status === s).length;
  const countByType = (t: string) =>
    t === "all" ? reports.length : reports.filter((r) => r.type === t).length;

  const selectedReport = selectedId
    ? reports.find((r) => String(r.id) === selectedId) ?? null
    : null;

  const mapSrc = selectedReport?.location
    ? `https://www.google.com/maps?q=${encodeURIComponent(selectedReport.location)}&z=16&output=embed`
    : "https://www.google.com/maps?q=Dumaguete+City&z=13&output=embed";

  const statusFilters = ["all", "pending", "in-progress", "resolved"];
  const typeFilters   = ["all", "fire", "accident", "flood", "crime", "medical", "other"];

  return (
    <>
      <style>{STYLES}</style>
      <div className="dp">

        {/* Header */}
        <div className="dp-header">
          <div>
            <div className="dp-eyebrow">Field Operations</div>
            <div className="dp-title">DISPATCH CENTER</div>
          </div>
          <div className="dp-header-right">
            {loading && <div className="dp-spinner" />}
            <div className="dp-live-badge">
              <span className="dp-live-dot" />
              LIVE FEED
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="dp-filters">
          <span className="dp-filter-label">
            <Icon.Filter />
            Status
          </span>
          <div className="dp-filter-group">
            {statusFilters.map((s) => (
              <button
                key={s}
                className={cls("dp-chip", filterStatus === s && "active")}
                onClick={() => setFilterStatus(s)}
              >
                {s === "all" ? "All" : STATUS_META[s]?.label ?? s}
                <span className="dp-chip-count">{countByStatus(s)}</span>
              </button>
            ))}
          </div>
          <div className="dp-filter-sep" />
          <span className="dp-filter-label">Type</span>
          <div className="dp-filter-group">
            {typeFilters.map((t) => (
              <button
                key={t}
                className={cls("dp-chip", filterType === t && "active")}
                onClick={() => setFilterType(t)}
              >
                {t === "all" ? "All" : `${TYPE_META[t]?.icon} ${TYPE_META[t]?.label}`}
                <span className="dp-chip-count">{countByType(t)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main body */}
        <div className="dp-body">

          {/* Map panel */}
          <div className="dp-panel">
            <div className="dp-panel-header">
              <span className="dp-panel-title">
                <Icon.Radar />
                Live Incident Map
              </span>
              <span className="dp-count-pill">{filtered.length} Active</span>
            </div>

            {!selectedReport || selectedReport.location ? (
              <div className="dp-map-wrap">
                <iframe
                  key={mapSrc}
                  title="Incident map"
                  src={mapSrc}
                  loading="lazy"
                  allowFullScreen
                />
                {selectedReport && (
                  <div className="dp-map-overlay">
                    <span className="dp-map-tag">
                      <Icon.MapPin />
                      {selectedReport.address || selectedReport.location}
                    </span>
                    <span className="dp-map-tag">
                      {TYPE_META[selectedReport.type]?.icon}{" "}
                      {selectedReport.type.toUpperCase()} —{" "}
                      {STATUS_META[selectedReport.status]?.label}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="dp-map-empty">
                <Icon.MapPin />
                No location data for this report
              </div>
            )}
          </div>

          {/* Queue panel */}
          <div className="dp-panel">
            <div className="dp-panel-header">
              <span className="dp-panel-title">
                <Icon.Layers />
                Incident Queue
              </span>
              <span className="dp-count-pill">{filtered.length} Reports</span>
            </div>

            <div className="dp-queue" ref={listRef}>
              {loading ? (
                <div className="dp-empty">
                  <div className="dp-spinner" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="dp-empty">
                  <span className="dp-empty-icon">📭</span>
                  No incidents match filters
                </div>
              ) : (
                filtered.map((r) => {
                  const tm = TYPE_META[r.type]     ?? TYPE_META.other;
                  const sm = STATUS_META[r.status] ?? STATUS_META.pending;
                  const isMine    = r.responder_id === responderId;
                  const isSel     = String(r.id) === selectedId;
                  const unclaimed = !r.responder_id && r.status === "pending";

                  return (
                    <div
                      key={String(r.id)}
                      className={cls(
                        "dp-card",
                        tm.colorClass,
                        isSel && "selected"
                      )}
                      onClick={() => setSelectedId(isSel ? null : String(r.id))}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) =>
                        e.key === "Enter" && setSelectedId(isSel ? null : String(r.id))
                      }
                      aria-pressed={isSel}
                    >
                      {/* Type + Status row */}
                      <div className="dp-card-top">
                        <div className="dp-card-type">
                          <span className="dp-card-icon">{tm.icon}</span>
                          <span className="dp-card-type-label">{tm.label}</span>
                        </div>
                        <div className={cls("dp-status", sm.colorClass)}>
                          <span className="dp-status-dot" />
                          {sm.label}
                        </div>
                      </div>

                      {/* Address */}
                      <div className="dp-card-addr">
                        <Icon.MapPin />
                        {r.address || r.location || "No location specified"}
                      </div>

                      {/* Description */}
                      {r.description && (
                        <div className="dp-card-desc">{r.description}</div>
                      )}

                      {/* Meta chips */}
                      <div className="dp-meta">
                        <span className="dp-tag">
                          <Icon.Clock />
                          {formatRelative(r.created_at)}
                        </span>
                        {r.reporter_name && (
                          <span className="dp-tag">
                            <Icon.User />
                            {r.reporter_name}
                          </span>
                        )}
                        {r.reporter_contact && (
                          <a
                            href={`tel:${r.reporter_contact}`}
                            className="dp-tag dp-tag-tel"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Icon.Phone />
                            {r.reporter_contact}
                          </a>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="dp-actions">
                        {unclaimed && (
                          <button
                            className="dp-btn dp-btn-claim"
                            onClick={(e) => claimReport(r.id, e)}
                          >
                            <Icon.Bolt />
                            Claim
                          </button>
                        )}
                        {isMine && r.status === "in-progress" && (
                          <button
                            className="dp-btn dp-btn-resolve"
                            onClick={(e) => resolveReport(r.id, e)}
                          >
                            <Icon.Check />
                            Resolve
                          </button>
                        )}
                        {hasCoords(r.location) && (
                          <a
                            href={`https://www.google.com/maps?q=${r.location}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="dp-btn dp-btn-nav"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Icon.Route />
                            Navigate
                          </a>
                        )}
                        {r.evidence_url && (
                          <a
                            href={r.evidence_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="dp-btn dp-btn-nav"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Icon.File />
                            Evidence
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}