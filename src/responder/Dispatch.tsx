import { useEffect, useState } from "react";
import { supabase } from "../js/supabase";
import {
  FaMapMarkerAlt,
  FaFilter,
  FaUser,
  FaClock,
  FaPhone,
  FaCheckCircle,
  FaRoute,
  FaFileAlt,
  FaTimes,
  FaLightbulb,
} from "react-icons/fa";

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

interface SummaryDraft {
  report: Report;
  actionTaken: string;
  resolution: string;
  notes: string;
}

const RESOLUTION_OPTIONS = [
  { value: "fully_resolved", label: "✅ Fully Resolved", color: "#2ECC8F" },
  { value: "needs_followup", label: "🔄 Resolved but needs follow-up", color: "#F5C842" },
  { value: "forwarded", label: "📋 Forwarded to appropriate department/agency", color: "#5B8DEF" },
  { value: "not_resolved", label: "⚠️ Not yet resolved", color: "#EF5B5B" },
];

const ACTION_TEMPLATES = [
  {
    label: "🚒 Dispatch & Scene",
    text: "Responded to the scene immediately upon dispatch. Conducted initial assessment of the situation. Coordinated with on-site personnel to ensure safety protocols were followed.",
  },
  {
    label: "🏥 Medical Response",
    text: "Provided first aid and emergency medical assistance to affected individuals. Coordinated with medical teams for transport to the nearest health facility. Scene was secured and bystanders were assisted.",
  },
  {
    label: "🚨 Crime/Security",
    text: "Secured the perimeter and gathered witness accounts. Documented evidence and reported findings to the appropriate authorities. Ensured the safety of all individuals in the vicinity.",
  },
];

const TYPE_META: Record<string, { icon: string; color: string; label: string }> = {
  fire: { icon: "🔥", color: "#EF5B5B", label: "Fire" },
  accident: { icon: "🚗", color: "#F5C842", label: "Accident" },
  flood: { icon: "🌊", color: "#5B8DEF", label: "Flood" },
  crime: { icon: "🚨", color: "#EF5B9E", label: "Crime" },
  medical: { icon: "🏥", color: "#2ECC8F", label: "Medical" },
  other: { icon: "⚠️", color: "#B0B8CC", label: "Other" },
};

const STATUS_META: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  pending: {
    label: "PENDING",
    color: "#EF5B5B",
    bg: "rgba(239,91,91,.1)",
    border: "rgba(239,91,91,.25)",
  },
  "in-progress": {
    label: "IN PROG",
    color: "#F5C842",
    bg: "rgba(245,200,66,.1)",
    border: "rgba(245,200,66,.25)",
  },
  resolved: {
    label: "RESOLVED",
    color: "#2ECC8F",
    bg: "rgba(46,204,143,.1)",
    border: "rgba(46,204,143,.25)",
  },
};

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=IBM+Plex+Sans:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500;700&display=swap');

*{
  box-sizing:border-box;
  margin:0;
  padding:0;
}

.dp-root{
  font-family:'IBM Plex Sans',sans-serif;
  color:#E8F0FF;
}

.dp-page-header{
  margin-bottom:20px;
  display:flex;
  justify-content:space-between;
  align-items:flex-end;
  flex-wrap:wrap;
  gap:12px;
}

.dp-eyebrow{
  font-family:'IBM Plex Mono', monospace;
  font-size:9px;
  color:rgba(232,240,255,.3);
  letter-spacing:.18em;
  text-transform:uppercase;
  margin-bottom:6px;
}

.dp-title{
  font-family:'Syne', sans-serif;
  font-size:26px;
  font-weight:800;
  color:#fff;
}

.dp-subtitle{
  font-size:10px;
  color:rgba(239,91,91,.5);
  margin-top:5px;
  font-family:'IBM Plex Mono', monospace;
}

.dp-layout{
  display:grid;
  grid-template-columns:1fr 380px;
  gap:12px;
}

@media(max-width:1100px){
  .dp-layout{
    grid-template-columns:1fr;
  }
}

.dp-map-panel,
.dp-list-panel,
.dp-filter-bar{
  background:rgba(4,15,30,.9);
  border:1px solid rgba(255,255,255,.07);
  border-radius:12px;
  overflow:hidden;
}

.dp-map-header,
.dp-list-header{
  display:flex;
  justify-content:space-between;
  align-items:center;
  padding:14px 16px;
  border-bottom:1px solid rgba(255,255,255,.06);
}

.dp-map-title,
.dp-list-title{
  font-family:'IBM Plex Mono', monospace;
  font-size:9px;
  color:rgba(232,240,255,.4);
  letter-spacing:.14em;
  text-transform:uppercase;
}

.dp-map-tag,
.dp-list-count{
  font-family:'IBM Plex Mono', monospace;
  font-size:8px;
  color:#EF5B5B;
  border:1px solid rgba(239,91,91,.2);
  border-radius:4px;
  padding:3px 8px;
}

.dp-filter-bar{
  padding:12px 14px;
  display:flex;
  align-items:center;
  flex-wrap:wrap;
  gap:8px;
  margin-bottom:12px;
}

.dp-filter-label{
  font-family:'IBM Plex Mono', monospace;
  font-size:9px;
  color:rgba(232,240,255,.35);
  display:flex;
  align-items:center;
  gap:5px;
}

.dp-filter-chip{
  font-family:'IBM Plex Mono', monospace;
  font-size:8px;
  padding:5px 10px;
  border-radius:5px;
  border:1px solid rgba(255,255,255,.1);
  background:rgba(255,255,255,.03);
  color:rgba(232,240,255,.5);
  cursor:pointer;
}

.dp-filter-chip.active{
  background:rgba(239,91,91,.12);
  border-color:rgba(239,91,91,.3);
  color:#EF5B5B;
}

.dp-list-body{
  max-height:540px;
  overflow-y:auto;
}

.dp-incident-row{
  padding:14px 16px;
  border-bottom:1px solid rgba(255,255,255,.05);
  cursor:pointer;
}

.dp-incident-row:hover{
  background:rgba(255,255,255,.03);
}

.dp-inc-top{
  display:flex;
  justify-content:space-between;
  margin-bottom:7px;
}

.dp-inc-type-label{
  display:flex;
  gap:6px;
  font-size:13px;
  font-weight:600;
}

.dp-inc-badge{
  font-family:'IBM Plex Mono', monospace;
  font-size:7px;
  padding:3px 8px;
  border-radius:4px;
}

.dp-inc-address{
  font-family:'IBM Plex Mono', monospace;
  font-size:9px;
  color:rgba(232,240,255,.35);
  margin-bottom:8px;
  display:flex;
  align-items:center;
  gap:5px;
}

.dp-inc-footer{
  display:flex;
  flex-wrap:wrap;
  gap:7px;
}

.dp-inc-meta-chip{
  display:inline-flex;
  align-items:center;
  gap:5px;
  font-family:'IBM Plex Mono', monospace;
  font-size:8px;
  padding:4px 8px;
  border-radius:5px;
  border:1px solid rgba(255,255,255,.08);
  background:rgba(255,255,255,.03);
  color:rgba(232,240,255,.45);
}

.dp-nav-btn,
.dp-claim-btn,
.dp-resolve-btn{
  text-decoration:none;
  border:none;
  cursor:pointer;
  padding:5px 12px;
  border-radius:5px;
  font-family:'IBM Plex Mono', monospace;
  font-size:8px;
  display:flex;
  align-items:center;
  gap:5px;
}

.dp-nav-btn{
  background:rgba(91,141,239,.08);
  border:1px solid rgba(91,141,239,.25);
  color:#5B8DEF;
}

.dp-claim-btn{
  background:rgba(239,91,91,.08);
  border:1px solid rgba(239,91,91,.3);
  color:#EF5B5B;
}

.dp-resolve-btn{
  background:rgba(46,204,143,.08);
  border:1px solid rgba(46,204,143,.3);
  color:#2ECC8F;
}

.dp-spinner{
  width:18px;
  height:18px;
  border-radius:50%;
  border:2px solid rgba(255,255,255,.1);
  border-top-color:#EF5B5B;
  animation:spin .7s linear infinite;
}

@keyframes spin{
  to{
    transform:rotate(360deg);
  }
}

.dp-empty{
  padding:40px;
  text-align:center;
  color:rgba(232,240,255,.3);
  font-family:'IBM Plex Mono', monospace;
}
`;

function formatRelative(ts: string) {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);

  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;

  return new Date(ts).toLocaleDateString();
}

function parseCoords(loc: string | null): [number, number] | null {
  if (!loc) return null;

  const parts = loc.split(",").map((s) => parseFloat(s.trim()));

  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return [parts[0], parts[1]];
  }

  return null;
}

export default function Dispatch() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const [responderId, setResponderId] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");

  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setResponderId(user.id);
      }
    };

    init();
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
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reports",
        },
        loadReports
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const claimReport = async (id: string | number) => {
    await supabase
      .from("reports")
      .update({
        responder_id: responderId,
        status: "in-progress",
      })
      .eq("id", id);

    await loadReports();
  };

  const filtered = reports.filter((r) => {
    const statusOk =
      filterStatus === "all" || r.status === filterStatus;

    const typeOk =
      filterType === "all" || r.type === filterType;

    return statusOk && typeOk;
  });

  const statusFilters = ["all", "pending", "in-progress", "resolved"];

  const typeFilters = [
    "all",
    "fire",
    "accident",
    "flood",
    "crime",
    "medical",
    "other",
  ];

  return (
    <>
      <style>{STYLES}</style>

      <div className="dp-root">
        <div className="dp-page-header">
          <div>
            <div className="dp-eyebrow">Field Operations</div>

            <div className="dp-title">
              Dispatch Center
            </div>

            <div className="dp-subtitle">
              LIVE GOOGLE MAP — DUMAGUETE CITY
            </div>
          </div>

          {loading && <div className="dp-spinner" />}
        </div>

        {/* FILTERS */}
        <div className="dp-filter-bar">
          <span className="dp-filter-label">
            <FaFilter size={9} />
            Status
          </span>

          {statusFilters.map((s) => (
            <button
              key={s}
              className={`dp-filter-chip ${
                filterStatus === s ? "active" : ""
              }`}
              onClick={() => setFilterStatus(s)}
            >
              {s.toUpperCase()}
            </button>
          ))}

          <span
            className="dp-filter-label"
            style={{ marginLeft: 8 }}
          >
            Type
          </span>

          {typeFilters.map((t) => (
            <button
              key={t}
              className={`dp-filter-chip ${
                filterType === t ? "active" : ""
              }`}
              onClick={() => setFilterType(t)}
            >
              {t === "all"
                ? "ALL"
                : `${TYPE_META[t]?.icon} ${t.toUpperCase()}`}
            </button>
          ))}
        </div>

        <div className="dp-layout">

          {/* LIVE GOOGLE MAP */}
          <div className="dp-map-panel">
            <div className="dp-map-header">
              <span className="dp-map-title">
                // Live Incident Map
              </span>

              <span className="dp-map-tag">
                {filtered.length} ACTIVE
              </span>
            </div>

            <div
              style={{
                width: "100%",
                height: "540px",
                overflow: "hidden",
              }}
            >
              {selectedId ? (
                (() => {
                  const selectedReport = reports.find(
                    (r) => String(r.id) === selectedId
                  );

                  if (!selectedReport?.location) {
                    return (
                      <div className="dp-empty">
                        NO LOCATION FOUND
                      </div>
                    );
                  }

                  return (
                    <iframe
                      title="Google Map"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      loading="lazy"
                      allowFullScreen
                      src={`https://www.google.com/maps?q=${selectedReport.location}&z=16&output=embed`}
                    />
                  );
                })()
              ) : (
                <iframe
                  title="Google Map Overview"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  src="https://www.google.com/maps?q=Dumaguete+City&z=13&output=embed"
                />
              )}
            </div>
          </div>

          {/* INCIDENT LIST */}
          <div className="dp-list-panel">
            <div className="dp-list-header">
              <span className="dp-list-title">
                // Incident Queue
              </span>

              <span className="dp-list-count">
                {filtered.length} REPORTS
              </span>
            </div>

            <div className="dp-list-body">
              {loading ? (
                <div className="dp-empty">
                  <div className="dp-spinner" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="dp-empty">
                  NO INCIDENTS FOUND
                </div>
              ) : (
                filtered.map((r) => {
                  const tm =
                    TYPE_META[r.type] ?? TYPE_META.other;

                  const sm =
                    STATUS_META[r.status] ??
                    STATUS_META.pending;

                  const isMine =
                    r.responder_id === responderId;

                  return (
                    <div
                      key={String(r.id)}
                      className="dp-incident-row"
                      onClick={() =>
                        setSelectedId(String(r.id))
                      }
                    >
                      <div className="dp-inc-top">
                        <div
                          className="dp-inc-type-label"
                          style={{ color: tm.color }}
                        >
                          <span>{tm.icon}</span>

                          <span>
                            {r.type.toUpperCase()}
                          </span>
                        </div>

                        <span
                          className="dp-inc-badge"
                          style={{
                            background: sm.bg,
                            color: sm.color,
                            border: `1px solid ${sm.border}`,
                          }}
                        >
                          {sm.label}
                        </span>
                      </div>

                      <div className="dp-inc-address">
                        <FaMapMarkerAlt size={8} />

                        {r.address ||
                          r.location ||
                          "No location"}
                      </div>

                      <div className="dp-inc-footer">
                        <span className="dp-inc-meta-chip">
                          <FaClock size={7} />
                          {formatRelative(r.created_at)}
                        </span>

                        {r.reporter_name && (
                          <span className="dp-inc-meta-chip">
                            <FaUser size={7} />
                            {r.reporter_name}
                          </span>
                        )}

                        {r.reporter_contact && (
                          <a
                            href={`tel:${r.reporter_contact}`}
                            className="dp-inc-meta-chip"
                            style={{
                              textDecoration: "none",
                              color: "#2ECC8F",
                            }}
                          >
                            <FaPhone size={7} />
                            {r.reporter_contact}
                          </a>
                        )}

                        {!r.responder_id &&
                          r.status === "pending" && (
                            <button
                              className="dp-claim-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                claimReport(r.id);
                              }}
                            >
                              Claim →
                            </button>
                          )}

                        {isMine &&
                          r.status === "in-progress" && (
                            <button className="dp-resolve-btn">
                              <FaFileAlt size={8} />
                              Resolve
                            </button>
                          )}

                        {parseCoords(r.location) && (
                          <a
                            href={`https://www.google.com/maps?q=${r.location}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="dp-nav-btn"
                          >
                            <FaRoute size={8} />
                            Navigate
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