import { useEffect, useState, type CSSProperties } from "react";
import { supabase } from "../js/supabase";

interface ResponderAlert {
  id: string;
  title: string | null;
  message: string | null;
  type: string | null;
  severity: string | null;
  audience: string | null;
  created_at: string;
  description?: string | null;
  location?: string | null;
  address?: string | null;
  report_id?: string | null;
  report_link?: string | null;
  // allow any extra columns from real Supabase row (see console.log)
  [key: string]: any;
}

const RESP_ALERT_META: Record<string, { accent: string; accentBg: string; accentBorder: string; label: string }> = {
  danger:   { accent: "var(--ra-danger)", accentBg: "var(--ra-danger-bg)", accentBorder: "var(--ra-danger-border)", label: "Danger" },
  critical: { accent: "var(--ra-danger)", accentBg: "var(--ra-danger-bg)", accentBorder: "var(--ra-danger-border)", label: "Critical" },
  warning:  { accent: "var(--ra-warning)", accentBg: "var(--ra-warning-bg)", accentBorder: "var(--ra-warning-border)", label: "Warning" },
  info:     { accent: "var(--ra-info)", accentBg: "var(--ra-info-bg)", accentBorder: "var(--ra-info-border)", label: "Info" },
  success:  { accent: "var(--ra-success)", accentBg: "var(--ra-success-bg)", accentBorder: "var(--ra-success-border)", label: "Info" },
};

function normalizeAlertType(a: ResponderAlert): string {
  const raw = (a.type ?? a.severity ?? "info").toLowerCase();
  if (raw === "critical") return "critical";
  if (raw === "danger") return "danger";
  if (raw === "warning") return "warning";
  if (raw === "success") return "info";
  return "info";
}

export default function ResponderAlertsPage() {
  const [alerts, setAlerts] = useState<ResponderAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const { data, error: err } = await supabase
          .from("alerts")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50);

        if (err) throw err;
        if (cancelled) return;
        const rows = (data as ResponderAlert[]) ?? [];
        // Dev helper: log raw row once so fields can be inspected (task #4)
        if (import.meta.env.DEV && rows.length > 0) {
          console.log("[ResponderAlerts] raw alert row:", rows[0]);
        }
        setAlerts(rows);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load alerts:", err);
        if (!cancelled) {
          setError("Error loading alerts");
          setLoading(false);
        }
      }
    };

    void load();

    const channelId = `resp-alerts-${Math.random().toString(36).slice(2, 9)}`;
    const channel = supabase
      .channel(channelId)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "alerts" }, (payload) => {
        const newAlert = payload.new as ResponderAlert;
        setAlerts(prev => {
          if (prev.some(a => a.id === newAlert.id)) return prev;
          return [newAlert, ...prev];
        });
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "alerts" }, (payload) => {
        setAlerts(prev => prev.filter(a => a.id !== (payload.old as any).id));
      })
      .subscribe();

    return () => {
      cancelled = true;
      channel.unsubscribe();
    };
  }, []);

  if (loading) return <div className="ra-state">Loading alerts…</div>;
  if (error) return <div className="ra-state">Error: {error}</div>;
  if (alerts.length === 0) return <div className="ra-state">No alerts.</div>;

  return (
    <div className="ra-root">
      <h3 className="ra-title">Alerts</h3>
      <p className="ra-sub">Broadcasts from command — title, message, severity &amp; audience</p>
      <div className="ra-list">
        {alerts.map((alert) => {
          const t = normalizeAlertType(alert);
          const meta = RESP_ALERT_META[t] ?? RESP_ALERT_META.info;
          const aud = (alert.audience ?? "all").toLowerCase();
          // Correct fields per real Supabase columns (see supabase/migrations/20260912130000_ensure_alerts_table.sql)
          // title -> type fallback, message -> description fallback
          const rawTitle = (alert.title?.trim() ? alert.title.trim() : null) ?? (alert.type?.trim() ? alert.type.trim() : null);
          const rawMessage = (alert.message?.trim() ? alert.message.trim() : null) ?? ((alert as any).description?.trim() ? (alert as any).description.trim() : null);
          const severityExists = !!(alert.severity?.trim() || alert.type?.trim());
          const displayTitle = rawTitle || (rawMessage || severityExists ? (rawMessage ? rawMessage.slice(0, 60) : meta.label) : "Alert");
          const displayMessage = rawMessage || "";
          const isExpanded = expandedId === alert.id;
          const locationText = (alert.location?.trim() ? alert.location.trim() : null) ?? ((alert as any).address?.trim() ? (alert as any).address.trim() : null);
          const reportLink = (alert.report_id ? `/reports/${alert.report_id}` : null) ?? ((alert as any).report_link?.trim() ? (alert as any).report_link.trim() : null) ?? ((alert as any).reportLink?.trim() ? (alert as any).reportLink.trim() : null);
          return (
            <div
              key={alert.id}
              onClick={() => setExpandedId(isExpanded ? null : alert.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpandedId(isExpanded ? null : alert.id); } }}
              title={isExpanded ? "Click to collapse" : "Click to expand"}
              className="ra-card"
              style={{
                "--ra-accent": meta.accent,
                "--ra-accent-bg": meta.accentBg,
                "--ra-accent-border": meta.accentBorder,
              } as CSSProperties}
            >
              <div className="ra-card-top">
                <span className="ra-card-title">{displayTitle}</span>
                <span className="ra-card-time">
                  {new Date(alert.created_at).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <div className="ra-card-msg">
                {displayMessage || (isExpanded ? "No details provided." : (severityExists ? "" : "No details provided."))}
                {!isExpanded && displayMessage && displayMessage.length > 120 ? "…" : ""}
              </div>
              <div className="ra-tags">
                {severityExists && (
                  <span className="ra-sev">
                    {meta.label}
                  </span>
                )}
                <span className="ra-aud">
                  {aud}
                </span>
                {!isExpanded && (
                  <span className="ra-expand-hint">Click to expand ▸</span>
                )}
              </div>
              {isExpanded && (
                <div className="ra-detail">
                  {displayMessage && (
                    <div><strong>Message:</strong> <span style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{displayMessage}</span></div>
                  )}
                  <div><strong>Time:</strong> {new Date(alert.created_at).toLocaleString("en-PH", { weekday: "short", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })}</div>
                  {locationText && (
                    <div><strong>Location:</strong> {locationText}</div>
                  )}
                  {reportLink && (
                    <div><strong>Report:</strong> <a href={reportLink} onClick={(e) => e.stopPropagation()}>{reportLink}</a></div>
                  )}
                  {!locationText && !reportLink && !displayMessage && (
                    <div className="ra-detail-empty">No additional details for this alert.</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}