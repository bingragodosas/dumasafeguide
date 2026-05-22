import { useEffect, useState } from "react";
import { supabase } from "../js/supabase";

const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');

  .ip-root {
    min-height: 100vh;
    background: #060d16;
    font-family: 'DM Sans', sans-serif;
    color: #e8edf5;
    padding: 36px 32px;
  }

  .ip-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-bottom: 32px;
    flex-wrap: wrap;
    gap: 16px;
  }

  .ip-title-block {}

  .ip-eyebrow {
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: #4A90D9;
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .ip-eyebrow::before {
    content: '';
    display: block;
    width: 20px;
    height: 1px;
    background: #4A90D9;
    opacity: 0.6;
  }

  .ip-title {
    font-family: 'Syne', sans-serif;
    font-size: 28px;
    font-weight: 800;
    color: #f0f4fa;
    letter-spacing: -0.02em;
    margin: 0;
  }

  .ip-filters {
    display: flex;
    gap: 6px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 10px;
    padding: 5px;
  }

  .ip-filter-btn {
    padding: 8px 18px;
    border: none;
    border-radius: 7px;
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.18s ease;
    background: transparent;
    color: rgba(184,197,214,0.5);
  }

  .ip-filter-btn:hover {
    background: rgba(255,255,255,0.06);
    color: #e8edf5;
  }

  .ip-filter-btn.active-pending {
    background: rgba(214,130,40,0.15);
    color: #F4A261;
    border: 1px solid rgba(214,130,40,0.25);
  }

  .ip-filter-btn.active-in-progress {
    background: rgba(74,144,217,0.15);
    color: #4A90D9;
    border: 1px solid rgba(74,144,217,0.25);
  }

  .ip-filter-btn.active-resolved {
    background: rgba(46,204,113,0.12);
    color: #2ECC71;
    border: 1px solid rgba(46,204,113,0.2);
  }

  .ip-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 28px;
  }

  .ip-stat {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 12px;
    padding: 16px 20px;
    position: relative;
    overflow: hidden;
  }

  .ip-stat::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
  }

  .ip-stat.s-pending::before { background: linear-gradient(90deg, #F4A261, transparent); }
  .ip-stat.s-progress::before { background: linear-gradient(90deg, #4A90D9, transparent); }
  .ip-stat.s-resolved::before { background: linear-gradient(90deg, #2ECC71, transparent); }

  .ip-stat-label {
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: rgba(184,197,214,0.4);
    margin-bottom: 6px;
  }

  .ip-stat-value {
    font-family: 'Syne', sans-serif;
    font-size: 26px;
    font-weight: 800;
    line-height: 1;
  }

  .ip-stat.s-pending .ip-stat-value { color: #F4A261; }
  .ip-stat.s-progress .ip-stat-value { color: #4A90D9; }
  .ip-stat.s-resolved .ip-stat-value { color: #2ECC71; }

  .ip-table-wrap {
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 14px;
    overflow: hidden;
  }

  .ip-table {
    width: 100%;
    border-collapse: collapse;
  }

  .ip-table thead tr {
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }

  .ip-table th {
    padding: 13px 18px;
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: rgba(184,197,214,0.35);
    text-align: left;
  }

  .ip-table tbody tr {
    border-bottom: 1px solid rgba(255,255,255,0.04);
    transition: background 0.15s ease;
  }

  .ip-table tbody tr:last-child { border-bottom: none; }

  .ip-table tbody tr:hover {
    background: rgba(255,255,255,0.03);
  }

  .ip-table td {
    padding: 14px 18px;
    font-size: 13px;
    color: rgba(232,237,245,0.8);
    vertical-align: middle;
  }

  .ip-desc {
    max-width: 220px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: #e8edf5;
    font-weight: 500;
  }

  .ip-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    padding: 4px 10px;
    border-radius: 5px;
  }

  .ip-badge::before {
    content: '';
    width: 5px;
    height: 5px;
    border-radius: 50%;
  }

  .ip-badge.b-pending {
    background: rgba(214,130,40,0.12);
    color: #F4A261;
    border: 1px solid rgba(214,130,40,0.2);
  }
  .ip-badge.b-pending::before { background: #F4A261; }

  .ip-badge.b-in-progress {
    background: rgba(74,144,217,0.12);
    color: #4A90D9;
    border: 1px solid rgba(74,144,217,0.2);
  }
  .ip-badge.b-in-progress::before { background: #4A90D9; box-shadow: 0 0 6px #4A90D9; animation: blink 1.4s ease infinite; }

  .ip-badge.b-resolved {
    background: rgba(46,204,113,0.1);
    color: #2ECC71;
    border: 1px solid rgba(46,204,113,0.18);
  }
  .ip-badge.b-resolved::before { background: #2ECC71; }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.35; }
  }

  .ip-actions { display: flex; gap: 6px; flex-wrap: wrap; }

  .ip-btn {
    padding: 6px 13px;
    border-radius: 6px;
    font-family: 'DM Sans', sans-serif;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.05em;
    cursor: pointer;
    transition: all 0.16s ease;
    border: none;
  }

  .ip-btn-reassign {
    background: rgba(74,144,217,0.1);
    color: #4A90D9;
    border: 1px solid rgba(74,144,217,0.2);
  }
  .ip-btn-reassign:hover {
    background: rgba(74,144,217,0.2);
    transform: translateY(-1px);
  }

  .ip-btn-resolve {
    background: rgba(46,204,113,0.1);
    color: #2ECC71;
    border: 1px solid rgba(46,204,113,0.18);
  }
  .ip-btn-resolve:hover {
    background: rgba(46,204,113,0.2);
    transform: translateY(-1px);
  }

  .ip-evidence-thumb {
    width: 52px;
    height: 44px;
    border-radius: 7px;
    object-fit: cover;
    border: 1px solid rgba(255,255,255,0.1);
    cursor: pointer;
    transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
    display: block;
  }
  .ip-evidence-thumb:hover {
    transform: scale(1.08);
    border-color: rgba(74,144,217,0.5);
    box-shadow: 0 0 12px rgba(74,144,217,0.25);
  }

  .ip-evidence-video-thumb {
    position: relative;
    width: 52px;
    height: 44px;
    border-radius: 7px;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,0.1);
    cursor: pointer;
    transition: transform 0.18s ease, border-color 0.18s ease;
    flex-shrink: 0;
  }
  .ip-evidence-video-thumb:hover {
    transform: scale(1.08);
    border-color: rgba(74,144,217,0.5);
  }
  .ip-evidence-video-thumb video {
    width: 100%; height: 100%; object-fit: cover;
  }
  .ip-evidence-video-play {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    background: rgba(0,0,0,0.45);
    font-size: 16px;
  }

  .ip-evidence-none {
    font-size: 11px;
    color: rgba(184,197,214,0.22);
    font-style: italic;
  }

  .ip-lightbox-backdrop {
    position: fixed; inset: 0;
    background: rgba(4, 8, 18, 0.92);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    animation: lbFadeIn 0.2s ease both;
  }
  @keyframes lbFadeIn { from { opacity: 0; } to { opacity: 1; } }

  .ip-lightbox {
    position: relative;
    max-width: 90vw;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    animation: lbSlideUp 0.22s ease both;
  }
  @keyframes lbSlideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

  .ip-lightbox img {
    max-width: 88vw;
    max-height: 78vh;
    border-radius: 12px;
    object-fit: contain;
    border: 1px solid rgba(255,255,255,0.1);
    box-shadow: 0 24px 80px rgba(0,0,0,0.7);
    display: block;
  }

  .ip-lightbox video {
    max-width: 88vw;
    max-height: 78vh;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.1);
    box-shadow: 0 24px 80px rgba(0,0,0,0.7);
    outline: none;
  }

  .ip-lightbox-close {
    position: absolute;
    top: -14px; right: -14px;
    width: 36px; height: 36px;
    border-radius: 50%;
    background: rgba(230,57,70,0.15);
    border: 1px solid rgba(230,57,70,0.3);
    color: #e63946;
    font-size: 18px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    transition: background 0.18s ease;
    line-height: 1;
  }
  .ip-lightbox-close:hover { background: rgba(230,57,70,0.3); }

  .ip-lightbox-label {
    font-family: 'DM Sans', sans-serif;
    font-size: 11px;
    color: rgba(184,197,214,0.35);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    text-align: center;
  }

  .ip-lightbox-open-btn {
    font-size: 11px;
    font-family: 'DM Sans', sans-serif;
    font-weight: 500;
    color: #4A90D9;
    background: rgba(74,144,217,0.1);
    border: 1px solid rgba(74,144,217,0.2);
    border-radius: 6px;
    padding: 5px 12px;
    cursor: pointer;
    text-decoration: none;
    transition: background 0.16s ease;
    display: inline-block;
  }
  .ip-lightbox-open-btn:hover { background: rgba(74,144,217,0.2); }

  .ip-empty {
    text-align: center;
    padding: 60px 20px;
    color: rgba(184,197,214,0.3);
  }
  .ip-empty-icon { font-size: 36px; margin-bottom: 12px; opacity: 0.3; }
  .ip-empty-text { font-size: 14px; font-weight: 300; }

  .ip-responder {
    font-size: 12px;
    color: rgba(184,197,214,0.45);
    font-family: 'DM Sans', monospace;
  }
  .ip-responder.assigned { color: #4A90D9; }

  .ip-loading {
    text-align: center;
    padding: 48px;
    color: rgba(184,197,214,0.3);
    font-size: 13px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  /* ── Reassign Modal ── */
  .ip-modal-backdrop {
    position: fixed; inset: 0;
    background: rgba(4, 8, 18, 0.88);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    z-index: 2000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    animation: lbFadeIn 0.2s ease both;
  }

  .ip-modal {
    background: #0d1825;
    border: 1px solid rgba(74,144,217,0.2);
    border-radius: 16px;
    padding: 28px;
    width: 100%;
    max-width: 420px;
    box-shadow: 0 24px 80px rgba(0,0,0,0.6);
    animation: lbSlideUp 0.22s ease both;
    position: relative;
  }

  .ip-modal-title {
    font-family: 'Syne', sans-serif;
    font-size: 18px;
    font-weight: 800;
    color: #f0f4fa;
    margin-bottom: 4px;
  }

  .ip-modal-sub {
    font-size: 12px;
    color: rgba(184,197,214,0.35);
    margin-bottom: 20px;
    line-height: 1.5;
  }

  .ip-modal-close {
    position: absolute;
    top: 16px; right: 16px;
    width: 30px; height: 30px;
    border-radius: 50%;
    background: rgba(230,57,70,0.1);
    border: 1px solid rgba(230,57,70,0.25);
    color: #e63946;
    font-size: 16px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    transition: background 0.15s;
    line-height: 1;
  }
  .ip-modal-close:hover { background: rgba(230,57,70,0.25); }

  .ip-responder-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 320px;
    overflow-y: auto;
    margin-bottom: 16px;
  }
  .ip-responder-list::-webkit-scrollbar { width: 3px; }
  .ip-responder-list::-webkit-scrollbar-thumb { background: rgba(74,144,217,0.2); border-radius: 2px; }

  .ip-responder-option {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.06);
    background: rgba(255,255,255,0.03);
    cursor: pointer;
    transition: all 0.16s ease;
  }
  .ip-responder-option:hover {
    background: rgba(74,144,217,0.08);
    border-color: rgba(74,144,217,0.25);
  }
  .ip-responder-option.selected {
    background: rgba(74,144,217,0.12);
    border-color: rgba(74,144,217,0.4);
  }

  .ip-responder-avatar {
    width: 36px; height: 36px;
    border-radius: 9px;
    background: rgba(74,144,217,0.12);
    border: 1px solid rgba(74,144,217,0.2);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Syne', sans-serif;
    font-size: 12px; font-weight: 700;
    color: #4A90D9;
    flex-shrink: 0;
  }

  .ip-responder-info { flex: 1; min-width: 0; }
  .ip-responder-name {
    font-size: 13px;
    font-weight: 500;
    color: #e8edf5;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .ip-responder-detail {
    font-size: 11px;
    color: rgba(184,197,214,0.35);
    margin-top: 2px;
  }

  .ip-responder-check {
    font-size: 14px;
    color: #4A90D9;
    opacity: 0;
    transition: opacity 0.15s;
  }
  .ip-responder-option.selected .ip-responder-check { opacity: 1; }

  .ip-modal-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }

  .ip-modal-cancel {
    padding: 9px 18px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.1);
    background: transparent;
    color: rgba(184,197,214,0.5);
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
  }
  .ip-modal-cancel:hover { background: rgba(255,255,255,0.05); color: #e8edf5; }

  .ip-modal-confirm {
    padding: 9px 20px;
    border-radius: 8px;
    border: none;
    background: #4A90D9;
    color: #fff;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
  }
  .ip-modal-confirm:disabled { opacity: 0.35; cursor: not-allowed; }
  .ip-modal-confirm:not(:disabled):hover { background: #5ba0e8; transform: translateY(-1px); }

  .ip-modal-loading {
    text-align: center;
    padding: 32px;
    color: rgba(184,197,214,0.3);
    font-size: 13px;
    letter-spacing: 0.1em;
  }

  .ip-modal-empty {
    text-align: center;
    padding: 28px;
    color: rgba(184,197,214,0.25);
    font-size: 13px;
  }

  .ip-resolve-icon {
    font-size: 36px;
    text-align: center;
    margin-bottom: 12px;
  }

  @media (max-width: 768px) {
    .ip-root { padding: 20px 16px; }
    .ip-stats { grid-template-columns: 1fr; }
    .ip-table th:nth-child(3),
    .ip-table td:nth-child(3) { display: none; }
  }
`;

type Incident = {
  id: string;
  description: string;
  status: string;
  responder_id: string | null;
  created_at: string;
  evidence_url: string | null;
};

// ← FIXED: matches your actual Supabase columns
type Responder = {
  id: string;
  name: string | null;
  email: string | null;
  status: string | null;
  on_duty: boolean | null;
};

const STATUS_FILTERS = [
  { key: "pending",     label: "Pending",     activeClass: "active-pending"     },
  { key: "in-progress", label: "In Progress", activeClass: "active-in-progress" },
  { key: "resolved",    label: "Resolved",    activeClass: "active-resolved"    },
];

function getBadgeClass(status: string) {
  if (status === "pending")     return "b-pending";
  if (status === "in-progress") return "b-in-progress";
  if (status === "resolved")    return "b-resolved";
  return "b-pending";
}

function isVideo(url: string) {
  return /\.(mp4|webm|ogg|mov|avi|mkv)(\?|$)/i.test(url);
}

function getInitials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────
function Lightbox({ url, onClose }: { url: string; onClose: () => void }) {
  const video = isVideo(url);

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).classList.contains("ip-lightbox-backdrop")) onClose();
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="ip-lightbox-backdrop" onClick={handleBackdrop}>
      <div className="ip-lightbox">
        <button className="ip-lightbox-close" onClick={onClose} aria-label="Close">×</button>
        {video ? (
          <video src={url} controls autoPlay playsInline />
        ) : (
          <img src={url} alt="Evidence" />
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="ip-lightbox-label">
            {video ? "🎥 Video Evidence" : "🖼 Photo Evidence"}
          </span>
          <a href={url} target="_blank" rel="noopener noreferrer" className="ip-lightbox-open-btn">
            Open original ↗
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Evidence cell ────────────────────────────────────────────────────────────
function EvidenceCell({ url, onView }: { url: string | null; onView: (u: string) => void }) {
  if (!url) return <span className="ip-evidence-none">—</span>;

  if (isVideo(url)) {
    return (
      <div className="ip-evidence-video-thumb" onClick={() => onView(url)} title="Click to view video">
        <video src={url} muted preload="metadata" />
        <div className="ip-evidence-video-play">▶</div>
      </div>
    );
  }

  return (
    <img
      className="ip-evidence-thumb"
      src={url}
      alt="Evidence"
      title="Click to view full image"
      onClick={() => onView(url)}
      loading="lazy"
    />
  );
}

// ─── Reassign Modal ───────────────────────────────────────────────────────────
function ReassignModal({
  incident,
  onClose,
  onConfirm,
}: {
  incident: Incident;
  onClose: () => void;
  onConfirm: (responderId: string) => Promise<void>;
}) {
  const [responders, setResponders]         = useState<Responder[]>([]);
  const [loadingResponders, setLoadingResponders] = useState(true);
  const [selectedId, setSelectedId]         = useState<string | null>(incident.responder_id);
  const [saving, setSaving]                 = useState(false);

  useEffect(() => {
    const fetchResponders = async () => {
      // ← FIXED: uses correct column names from your Supabase table
      const { data } = await supabase
        .from("responders")
        .select("id, name, email, status, on_duty")
        .order("name", { ascending: true });
      setResponders(data ?? []);
      setLoadingResponders(false);
    };
    fetchResponders();
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).classList.contains("ip-modal-backdrop")) onClose();
  };

  const handleConfirm = async () => {
    if (!selectedId) return;
    setSaving(true);
    await onConfirm(selectedId);
    setSaving(false);
    onClose();
  };

  return (
    <div className="ip-modal-backdrop" onClick={handleBackdrop}>
      <div className="ip-modal">
        <button className="ip-modal-close" onClick={onClose}>×</button>
        <div className="ip-modal-title">Reassign Incident</div>
        <div className="ip-modal-sub">
          Select a responder to assign this incident to.<br />
          <span style={{ color: "rgba(74,144,217,0.6)" }}>
            {incident.description?.slice(0, 60) || "No description"}
            {(incident.description?.length ?? 0) > 60 ? "…" : ""}
          </span>
        </div>

        {loadingResponders ? (
          <div className="ip-modal-loading">Loading responders…</div>
        ) : responders.length === 0 ? (
          <div className="ip-modal-empty">No responders found. Add responders first.</div>
        ) : (
          <div className="ip-responder-list">
            {responders.map((r) => (
              <div
                key={r.id}
                className={`ip-responder-option${selectedId === r.id ? " selected" : ""}`}
                onClick={() => setSelectedId(r.id)}
              >
                {/* ← FIXED: uses r.name instead of r.full_name */}
                <div className="ip-responder-avatar">{getInitials(r.name)}</div>
                <div className="ip-responder-info">
                  <div className="ip-responder-name">{r.name ?? "Unnamed"}</div>
                  <div className="ip-responder-detail">
                    {r.on_duty ? "🟢 On Duty" : "⚫ Off Duty"} · {r.email ?? "No email"}
                  </div>
                </div>
                <span className="ip-responder-check">✓</span>
              </div>
            ))}
          </div>
        )}

        <div className="ip-modal-actions">
          <button className="ip-modal-cancel" onClick={onClose}>Cancel</button>
          <button
            className="ip-modal-confirm"
            disabled={!selectedId || saving || loadingResponders}
            onClick={handleConfirm}
          >
            {saving ? "Assigning…" : "Assign Responder"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Resolve Confirm Modal ────────────────────────────────────────────────────
function ResolveModal({
  incident,
  onClose,
  onConfirm,
}: {
  incident: Incident;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).classList.contains("ip-modal-backdrop")) onClose();
  };

  const handleConfirm = async () => {
    setSaving(true);
    await onConfirm();
    setSaving(false);
    onClose();
  };

  return (
    <div className="ip-modal-backdrop" onClick={handleBackdrop}>
      <div className="ip-modal" style={{ maxWidth: 360 }}>
        <button className="ip-modal-close" onClick={onClose}>×</button>
        <div className="ip-resolve-icon">✅</div>
        <div className="ip-modal-title" style={{ textAlign: "center" }}>Mark as Resolved?</div>
        <div className="ip-modal-sub" style={{ textAlign: "center", marginBottom: 24 }}>
          This will mark the incident as resolved and move it out of the active queue.
          <br /><br />
          <span style={{ color: "rgba(74,144,217,0.6)" }}>
            {incident.description?.slice(0, 80) || "No description"}
            {(incident.description?.length ?? 0) > 80 ? "…" : ""}
          </span>
        </div>
        <div className="ip-modal-actions" style={{ justifyContent: "center" }}>
          <button className="ip-modal-cancel" onClick={onClose}>Cancel</button>
          <button
            className="ip-modal-confirm"
            style={{ background: "#2ECC71" }}
            disabled={saving}
            onClick={handleConfirm}
          >
            {saving ? "Resolving…" : "Yes, Resolve"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function IncidentsPage() {
  const [incidents, setIncidents]         = useState<Incident[]>([]);
  const [filter, setFilter]               = useState("pending");
  const [counts, setCounts]               = useState({ pending: 0, "in-progress": 0, resolved: 0 });
  const [loading, setLoading]             = useState(true);
  const [lightboxUrl, setLightboxUrl]     = useState<string | null>(null);
  const [reassignTarget, setReassignTarget] = useState<Incident | null>(null);
  const [resolveTarget, setResolveTarget]   = useState<Incident | null>(null);

  const fetchIncidents = async (status: string) => {
    setLoading(true);
    const { data } = await supabase
      .from("reports")
      .select("*")
      .eq("status", status)
      .order("created_at", { ascending: false });
    setIncidents(data || []);
    setLoading(false);
  };

  const fetchCounts = async () => {
    const statuses = ["pending", "in-progress", "resolved"] as const;
    const results = await Promise.all(
      statuses.map((s) =>
        supabase.from("reports").select("id", { count: "exact", head: true }).eq("status", s)
      )
    );
    setCounts({
      pending:       results[0].count ?? 0,
      "in-progress": results[1].count ?? 0,
      resolved:      results[2].count ?? 0,
    });
  };

  useEffect(() => { fetchCounts(); }, []);
  useEffect(() => { fetchIncidents(filter); }, [filter]);

  const handleReassignConfirm = async (responderId: string) => {
    if (!reassignTarget) return;
    await supabase
      .from("reports")
      .update({ responder_id: responderId, status: "in-progress" })
      .eq("id", reassignTarget.id);
    fetchIncidents(filter);
    fetchCounts();
  };

  const handleResolveConfirm = async () => {
    if (!resolveTarget) return;
    await supabase
      .from("reports")
      .update({ status: "resolved" })
      .eq("id", resolveTarget.id);
    fetchIncidents(filter);
    fetchCounts();
  };

  return (
    <>
      <style>{STYLE}</style>
      <div className="ip-root">

        {/* Header */}
        <div className="ip-header">
          <div className="ip-title-block">
            <div className="ip-eyebrow">Responder Panel</div>
            <h1 className="ip-title">Incidents Oversight</h1>
          </div>
          <div className="ip-filters">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.key}
                className={`ip-filter-btn ${filter === f.key ? f.activeClass : ""}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="ip-stats">
          <div className="ip-stat s-pending">
            <div className="ip-stat-label">Pending</div>
            <div className="ip-stat-value">{counts.pending}</div>
          </div>
          <div className="ip-stat s-progress">
            <div className="ip-stat-label">In Progress</div>
            <div className="ip-stat-value">{counts["in-progress"]}</div>
          </div>
          <div className="ip-stat s-resolved">
            <div className="ip-stat-label">Resolved</div>
            <div className="ip-stat-value">{counts.resolved}</div>
          </div>
        </div>

        {/* Table */}
        <div className="ip-table-wrap">
          {loading ? (
            <div className="ip-loading">Loading incidents…</div>
          ) : incidents.length === 0 ? (
            <div className="ip-empty">
              <div className="ip-empty-icon">⚐</div>
              <div className="ip-empty-text">No {filter} incidents found</div>
            </div>
          ) : (
            <table className="ip-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Responder</th>
                  <th>Evidence</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((inc) => (
                  <tr key={inc.id}>
                    <td className="ip-desc" title={inc.description}>
                      {inc.description || "—"}
                    </td>
                    <td>
                      <span className={`ip-badge ${getBadgeClass(inc.status)}`}>
                        {inc.status}
                      </span>
                    </td>
                    <td>
                      <span className={`ip-responder ${inc.responder_id ? "assigned" : ""}`}>
                        {inc.responder_id ?? "Unassigned"}
                      </span>
                    </td>
                    <td>
                      <EvidenceCell url={inc.evidence_url} onView={(u) => setLightboxUrl(u)} />
                    </td>
                    <td style={{ fontSize: "12px", color: "rgba(184,197,214,0.35)" }}>
                      {new Date(inc.created_at).toLocaleDateString("en-PH", {
                        month: "short", day: "numeric", year: "numeric",
                      })}
                    </td>
                    <td>
                      <div className="ip-actions">
                        <button
                          className="ip-btn ip-btn-reassign"
                          onClick={() => setReassignTarget(inc)}
                        >
                          Reassign
                        </button>
                        {inc.status !== "resolved" && (
                          <button
                            className="ip-btn ip-btn-resolve"
                            onClick={() => setResolveTarget(inc)}
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxUrl && (
        <Lightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
      )}

      {/* Reassign Modal */}
      {reassignTarget && (
        <ReassignModal
          incident={reassignTarget}
          onClose={() => setReassignTarget(null)}
          onConfirm={handleReassignConfirm}
        />
      )}

      {/* Resolve Modal */}
      {resolveTarget && (
        <ResolveModal
          incident={resolveTarget}
          onClose={() => setResolveTarget(null)}
          onConfirm={handleResolveConfirm}
        />
      )}
    </>
  );
}