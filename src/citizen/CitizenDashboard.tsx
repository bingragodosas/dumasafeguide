// src/citizen/CitizenDashboard.tsx
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { supabase } from "../js/supabase";
import { Link, useNavigate } from "react-router-dom";
import {
  FaFileAlt, FaPen, FaFolderOpen, FaBell, FaMapMarkedAlt, FaLightbulb, FaComments,
  FaFire, FaCarCrash, FaWater, FaShieldAlt, FaBriefcaseMedical, FaExclamationCircle,
  FaCheckCircle, FaClock, FaSpinner, FaExclamationTriangle,
  FaTimes, FaInfoCircle, FaInbox, FaBellSlash,
} from "react-icons/fa";
import pagesBackground from "../assets/pagesbackground.png";
import {
  Eyebrow, PageTitle, Card, SectionHead, Stat, StatusPill,
  Tile, QuickAction, EmptyState, SkeletonRows, Banner,
} from "./components/ui";

// Direct imports — no lazy loading, modals open instantly.
import CitizenSafetyTips from "./CitizenSafetyTips";
import CitizenAlertsPage from "./CitizenAlertsPage";
import CitizenReport from "./CitizenReport";
import CitizenReportDetail from "./CitizenReportDetail";
import CitizenMap from "./CitizenMap";

interface Report {
  id: string;
  description: string;
  type: string;
  status: "pending" | "in-progress" | "resolved";
  created_at: string;
}

interface Alert {
  id: string;
  title: string;
  message: string;
  type: string;
  created_at: string;
}

interface User {
  id: string;
  email: string;
  user_metadata?: { full_name?: string };
}

type ModalView = null | "safetytips" | "alerts" | "report" | "reportdetail" | "map";

const ALERTS_READ_KEY = "cd_alerts_last_read";

const TYPE_META: Record<string, { icon: ReactNode; color: string }> = {
  fire:     { icon: <FaFire size={14} />,              color: "var(--c-fire)" },
  accident: { icon: <FaCarCrash size={14} />,          color: "var(--c-accident)" },
  flood:    { icon: <FaWater size={14} />,             color: "var(--c-flood)" },
  crime:    { icon: <FaShieldAlt size={14} />,         color: "var(--c-crime)" },
  medical:  { icon: <FaBriefcaseMedical size={14} />,  color: "var(--c-medical)" },
  other:    { icon: <FaExclamationCircle size={14} />, color: "var(--c-other)" },
};

const STATUS_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending:       { label: "PENDING",     color: "var(--c-pending)",  bg: "var(--clr-yellow-bg)",  border: "var(--clr-yellow-border)"  },
  "in-progress": { label: "IN PROGRESS", color: "var(--c-progress)", bg: "var(--clr-blue-bg)",    border: "var(--clr-blue-border)"   },
  resolved:      { label: "RESOLVED",    color: "var(--c-resolved)", bg: "var(--clr-green-bg)",   border: "var(--clr-green-border)"  },
};

const ALERT_TYPE_META: Record<string, { color: string; bg: string; border: string; label: string; icon: JSX.Element }> = {
  danger:  { color: "var(--clr-red)", bg: "var(--clr-red-bg)", border: "var(--clr-red-border)", label: "Danger", icon: <FaExclamationTriangle /> },
  warning: { color: "var(--c-pending)", bg: "var(--clr-yellow-bg)", border: "var(--clr-yellow-border)", label: "Warning", icon: <FaExclamationTriangle /> },
  info:    { color: "var(--clr-blue)", bg: "var(--clr-blue-bg)", border: "var(--clr-blue-border)", label: "Info", icon: <FaInfoCircle /> },
  success: { color: "var(--clr-green)", bg: "var(--clr-green-bg)", border: "var(--clr-green-border)", label: "All Clear", icon: <FaCheckCircle /> },
};

const TYPE_LIST = ["fire", "flood", "medical", "crime", "accident", "other"];

function getUnreadCount(alerts: Alert[]): number {
  try {
    const lastRead = localStorage.getItem(ALERTS_READ_KEY);
    if (!lastRead) return alerts.length;
    return alerts.filter(a => new Date(a.created_at) > new Date(lastRead)).length;
  } catch { return 0; }
}

function markAlertsRead() {
  try { localStorage.setItem(ALERTS_READ_KEY, new Date().toISOString()); } catch {}
}

function usePHTClock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () => {
      const n = new Date();
      const p = (v: number) => String(v).padStart(2, "0");
      setTime(`${p(n.getHours())}:${p(n.getMinutes())}:${p(n.getSeconds())} PHT`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

function useIsMobile() {
   const [isMobile, setIsMobile] = useState(
     typeof window !== "undefined" ? window.innerWidth < 900 : false
   );
   useEffect(() => {
       const handler = () => setIsMobile(window.innerWidth < 900);
       window.addEventListener("resize", handler);
       return () => window.removeEventListener("resize", handler);
   }, []);
   return isMobile;
}

export default function CitizenDashboard() {
  // Consumes the active Navbar/Header language — any selector change re-renders
  // this component and re-evaluates every t() call and language-aware helper below.
  const { language, t, tList } = useLanguage();
  void tList;
  const locale = language === "tl" ? "fil-PH" : "en-PH";
  const navigate = useNavigate();
  const clock = usePHTClock();
  const isMobile = useIsMobile();

  // Language-aware status-pill text (status.* in the dictionary, English fallback).
  // Normalized + fallback so unknown/cased DB values never render unstyled (dim).
  const statusLabel = (s: string) => {
    const key = (s ?? "").toLowerCase().trim();
    return t(`status.${key === "in-progress" ? "inProgress" : key}`, STATUS_META[key]?.label ?? s);
  };
  // Language-aware alert-level badge text.
  const levelLabel = (level: string) =>
    t(`alerts.levels.${level}`, ALERT_TYPE_META[level]?.label ?? level);
  // Language-aware report-type name (report.types.* in the dictionary).
  const typeLabel = (type: string | undefined) =>
    t(`report.types.${type?.toLowerCase().trim()}`, type ?? "");
  // Language-aware relative timestamp — computed every render, never cached.
  const formatRelativeLocal = (ts: string) => {
    const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (diff < 60)    return t("timeAgo.second", "{n}s ago").replace("{n}", String(diff));
    if (diff < 3600)  return t("timeAgo.minute", "{n}m ago").replace("{n}", String(Math.floor(diff / 60)));
    if (diff < 86400) return t("timeAgo.hour", "{n}h ago").replace("{n}", String(Math.floor(diff / 3600)));
    return new Date(ts).toLocaleDateString(locale, { month: "short", day: "numeric" });
  };

  const [reports,     setReports]     = useState<Report[]>([]);
  const [alerts,      setAlerts]      = useState<Alert[]>([]);
  const [newAlertIds, setNewAlertIds] = useState<Set<string>>(new Set());
  const [unreadCount, setUnreadCount] = useState(0);
  const [user,        setUser]        = useState<User | null>(null);
  const [loading,     setLoading]     = useState(true);

  const [modalView, setModalView] = useState<ModalView>(null);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  useEffect(() => {
    setUnreadCount(getUnreadCount(alerts));
  }, [alerts]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user as any));

    const loadData = async () => {
      try {
        const { data: { user: u } } = await supabase.auth.getUser();
        if (!u) return;

        const { data: reportData } = await supabase
          .from("reports")
          .select("id, description, type, status, created_at")
          .eq("user_id", u.id)
          .order("created_at", { ascending: false });
        setReports((reportData as Report[]) || []);

        const { data: alertData } = await supabase
          .from("alerts")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5);
        setAlerts((alertData as Alert[]) ?? []);

      } finally {
        setLoading(false);
      }
    };

    loadData();

    const reportChannel = supabase
      .channel("cd-reports-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" },
        ({ eventType, new: nr, old: or }) => {
          setReports(prev => {
            if (eventType === "INSERT") return [nr as Report, ...prev];
            if (eventType === "UPDATE") return prev.map(r => r.id === (nr as any).id ? nr as Report : r);
            if (eventType === "DELETE") return prev.filter(r => r.id !== (or as any).id);
            return prev;
          });
        }
      )
      .subscribe();

    const alertChannel = supabase
      .channel("cd-alerts-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "alerts" },
        (payload) => {
          const a = payload.new as Alert;
          setAlerts(prev => {
            if (prev.some(x => x.id === a.id)) return prev;
            return [a, ...prev].slice(0, 5);
          });
          setNewAlertIds(prev => new Set(prev).add(a.id));
          setTimeout(() => {
            setNewAlertIds(prev => { const n = new Set(prev); n.delete(a.id); return n; });
          }, 5000);
        }
      )
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "alerts" },
        (payload) => {
          setAlerts(prev => prev.filter(a => a.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(reportChannel);
      supabase.removeChannel(alertChannel);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setModalView(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = modalView ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [modalView]);

  const stats = {
    total:      reports.length,
    pending:    reports.filter(r => r.status === "pending").length,
    inProgress: reports.filter(r => r.status === "in-progress").length,
    resolved:   reports.filter(r => r.status === "resolved").length,
  };

  // Split on the {count} placeholder instead of English words so the <strong>
  // emphasis works in every language (Tagalog word order differs from English).
  const pendingParts = t("dashboard.pendingReports", "You have {count} report(s) awaiting review.").split("{count}");
  const pendingHtml = `${pendingParts[0] ?? ""}<strong>${stats.pending}</strong>${pendingParts[1] ?? ""}`;

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || t("history.citizen", "Citizen");
  const firstName   = displayName.split(" ")[0];

  const statCards = [
    { label: t("dashboard.statTotalFiled"),  value: stats.total,      accent: "var(--clr-blue)", icon: <FaFileAlt size={15} />,            },
    { label: t("dashboard.statPending"),      value: stats.pending,    accent: "var(--c-pending)",  icon: <FaExclamationTriangle size={15} />, },
    { label: t("dashboard.statInProgress"),  value: stats.inProgress, accent: "var(--c-progress)", icon: <FaSpinner size={15} />,             },
    { label: t("dashboard.statResolved"),     value: stats.resolved,   accent: "var(--c-resolved)", icon: <FaCheckCircle size={15} />,         },
  ];

  const quickActions = [
    { label: t("dashboard.quickActionFileReport"), icon: <FaPen size={14} />,           modal: "report" as const },
    { label: t("dashboard.quickActionSafetyMap"),  icon: <FaMapMarkedAlt size={14} />,  modal: "map" as const },
    { label: t("dashboard.quickActionMyReports"),  icon: <FaFolderOpen size={14} />,    to: "/citizen/history" as const },
    { label: t("dashboard.quickActionAlerts", "Alerts"), icon: <FaBell size={14} />,    to: "/citizen/alerts" as const },
    { label: t("dashboard.quickActionSafetyTips"), icon: <FaLightbulb size={14} />,     modal: "safetytips" as const },
    { label: t("dashboard.quickActionChat"),       icon: <FaComments size={14} />,       to: "/citizen/chat" as const },
  ];

  const handleViewAllAlerts = () => {
    markAlertsRead();
    setUnreadCount(0);
    setModalView("alerts");
  };

  const openSafetyTips = () => {
    setModalView("safetytips");
  };

  const openAlerts = () => {
    markAlertsRead();
    setUnreadCount(0);
    setModalView("alerts");
  };

  const openFileReport = () => {
    setModalView("report");
  };

  const openReportDetail = (id: string) => {
    setSelectedReportId(id);
    setModalView("reportdetail");
  };

  const openMap = () => {
    setModalView("map");
  };

  return (
    <div
      className="dsg-page"
      style={{ "--dsg-page-photo": `url(${pagesBackground})`, fontFamily: "'Instrument Sans', sans-serif" } as React.CSSProperties}
    >
      {/* Sidebar + mobile nav are provided by the persistent CitizenLayout. */}

      <div className="dsg-wrap" style={{ paddingBottom: isMobile ? 96 : undefined }}>

        <div style={{ marginBottom: "20px" }}>
          <Eyebrow>{t("dashboard.portalLabel")}</Eyebrow>
          <PageTitle>{t("dashboard.welcomeTitle").replace("{name}", firstName)}</PageTitle>
          <p className="dsg-sub">{t("dashboard.dumagueteCity")}</p>
        </div>

        {stats.pending > 0 && (
          <Banner
            icon={<FaExclamationTriangle />}
            action={<Link className="dsg-btn-outline" to="/citizen/history">{t("dashboard.view")}</Link>}
          >
            <span dangerouslySetInnerHTML={{ __html: pendingHtml }} />
          </Banner>
        )}

        <div className="dsg-stat-grid">
          {statCards.map(c => (
            <Stat key={c.label} icon={c.icon} value={c.value} label={c.label} accent={c.accent} loading={loading} />
          ))}
        </div>

        <div className="dsg-qa-grid">
          {quickActions.map(q =>
            "modal" in q && q.modal ? (
              <QuickAction key={q.label} icon={q.icon} label={q.label} onClick={() => setModalView(q.modal)} />
            ) : (
              <QuickAction key={q.to} icon={q.icon} label={q.label} to={q.to as string} />
            )
          )}
        </div>

        <Card style={{ marginBottom: 16 }}>
          <SectionHead title={t("dashboard.recentReportsTitle")} />
          {loading ? (
            <SkeletonRows rows={3} />
          ) : reports.length === 0 ? (
            <EmptyState
              icon={<FaInbox />}
              title={t("dashboard.noReportsYet")}
              actionLabel={t("dashboard.fileAReport")}
              onAction={openFileReport}
            />
          ) : (
            <div className="dsg-list">
            {reports.slice(0, 6).map(r => {
              const normType = r.type?.toLowerCase().trim() ?? "";
              const normStatus = r.status?.toLowerCase().trim() ?? "";
              const tm = TYPE_META[normType] ?? TYPE_META.other;
              const sm = STATUS_META[normStatus] ?? STATUS_META.pending;
              return (
              <button key={r.id} type="button" className="dsg-row" onClick={() => openReportDetail(r.id)}>
                <Tile icon={tm.icon} color={tm.color} />
                <span className="dsg-row-body">
                  <span className="dsg-row-title" style={{ color: tm.color }}>{typeLabel(r.type)}</span>
                  <span className="dsg-row-sub">{r.description || t("reportDetail.noDescription", "No description")}</span>
                  <span className="dsg-row-meta">
                    <StatusPill color={sm.color} bg={sm.bg} border={sm.border}>
                      {statusLabel(r.status)}
                    </StatusPill>
                    <span className="dsg-time">{formatRelativeLocal(r.created_at)}</span>
                  </span>
                </span>
              </button>
              );
            })}
            </div>
          )}
        </Card>

        <Card style={{ marginBottom: 0 }}>
          <SectionHead title={t("dashboard.alertsTitle")} />
          {loading ? (
            <SkeletonRows rows={2} />
          ) : alerts.length === 0 ? (
            <EmptyState
              icon={<FaBellSlash />}
              title={t("dashboard.noActiveAlerts")}
              sub={t("dashboard.updatesAutomatically")}
            />
          ) : (
            <>
              <div className="dsg-list">
              {alerts.map(a => {
                const am = ALERT_TYPE_META[a.type] ?? ALERT_TYPE_META.info;
                return (
                  <div key={a.id} className="dsg-row" style={{ cursor: "default" }}>
                    <span className="dsg-tile" style={{ backgroundColor: am.bg, color: am.color, border: `1px solid ${am.border}` }}>{am.icon}</span>
                    <span className="dsg-row-body">
                      <span className="dsg-row-title" style={{ color: am.color }}>{a.title || t("alerts.alert")}</span>
                      <span className="dsg-row-sub" style={{ fontSize: 11 }}>{a.message}</span>
                      <span className="dsg-row-meta">
                        <StatusPill color={am.color} bg={am.bg} border={am.border}>
                          {levelLabel(a.type)}
                        </StatusPill>
                        <span className="dsg-time" style={{ marginLeft: "auto" }}>{formatRelativeLocal(a.created_at)}</span>
                      </span>
                    </span>
                  </div>
                );
              })}
              </div>
              <button type="button" onClick={handleViewAllAlerts} className="dsg-btn-outline" style={{ width: "100%", marginTop: 12 }}>
                {t("dashboard.viewAllAlerts")}
              </button>
            </>
          )}
        </Card>
      </div>

      {isMobile && (
        <nav className="dsg-bottomnav" aria-label={t("nav.myDashboard")}>
          <button type="button" onClick={openFileReport} className="dsg-bnav-btn">
            <FaPen /><span className="dsg-bnav-label">{t("dashboard.bottomNavReport")}</span>
          </button>
          <Link to="/citizen/history" className="dsg-bnav-btn">
            <FaFolderOpen /><span className="dsg-bnav-label">{t("dashboard.bottomNavHistory")}</span>
          </Link>
          <button type="button" onClick={openAlerts} className="dsg-bnav-btn">
            <FaBell /><span className="dsg-bnav-label">{t("nav.alerts")}</span>
            {unreadCount > 0 && (
              <span className="dsg-bnav-badge">{unreadCount}</span>
            )}
          </button>
          <button type="button" onClick={openMap} className="dsg-bnav-btn">
            <FaMapMarkedAlt /><span className="dsg-bnav-label">{t("nav.map")}</span>
          </button>
          <button type="button" onClick={openSafetyTips} className="dsg-bnav-btn">
            <FaLightbulb /><span className="dsg-bnav-label">{t("dashboard.bottomNavTips")}</span>
          </button>
        </nav>
      )}

      {modalView && (
        <div
          style={{
            position: "fixed",
            top: isMobile ? "56px" : 0,
            left: isMobile ? 0 : "260px",
            right: 0,
            bottom: isMobile ? "64px" : 0,
            zIndex: 150,
            overflowY: "auto",
            background: "var(--clr-bg)",
            transform: "translateZ(0)",
            WebkitTransform: "translateZ(0)",
          }}
        >
          <button
            onClick={() => setModalView(null)}
            aria-label={language === "tl" ? "Isara" : "Close"}
            style={{
              position: "fixed",
              top: isMobile ? "68px" : "16px",
              right: "16px",
              zIndex: 160,
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--citizen-card)",
              border: "1px solid var(--clr-border-2)",
              color: "var(--clr-text)",
              fontSize: "16px",
              cursor: "pointer",
              backdropFilter: "blur(12px)",
            }}
          >
            <FaTimes />
          </button>

          {modalView === "safetytips" && <CitizenSafetyTips />}
          {modalView === "alerts" && <CitizenAlertsPage />}

          {modalView === "report" && (
            <CitizenReport
              onBack={() => setModalView(null)}
              onViewHistory={() => navigate("/citizen/history")}
              onViewReport={(id) => openReportDetail(id)}
            />
          )}

          {modalView === "reportdetail" && selectedReportId && (
            <CitizenReportDetail
              reportId={selectedReportId}
              onBack={() => setModalView(null)}
              onViewHistory={() => navigate("/citizen/history")}
            />
          )}

          {modalView === "map" && (
            <CitizenMap onBack={() => setModalView(null)} />
          )}
        </div>
      )}

    </div>
  );
}
