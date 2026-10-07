// src/citizen/CitizenLayout.tsx
//
// Persistent shared layout for every /citizen/* route. Renders the citizen
// sidebar statically on the left and the active child route in <Outlet /> on
// the right, so navigating between citizen pages never unmounts, flickers, or
// hides the sidebar. Active link highlighting derives from
// useLocation().pathname (prefix match, so /citizen/history/:id still
// highlights "My Reports").

import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  FaBars, FaTimes, FaHome, FaFileAlt, FaComments, FaFolderOpen,
  FaBell, FaMapMarkedAlt, FaLightbulb, FaAddressBook, FaBookOpen,
  FaSignOutAlt,
} from "react-icons/fa";
import { useLanguage } from "../context/LanguageContext";
import { supabase } from "../js/supabase";
import ThemeToggle from "../components/ThemeToggle";
import dsgLogo from "../assets/dsg_logo.png";
import { usePresence } from "../hooks/usePresence";
import { useHeartbeat, markOffline } from "../hooks/useHeartbeat";
import GlobalCitizenCallHandler from "../components/GlobalCitizenCallHandler";

// ── Sidebar nav link: icon tile + accent rail + hover/active states ──────────
// No layout shift: the 3px rail is absolutely positioned, so activating a link
// never nudges its label. All colors are theme vars — identical code renders
// the dark cinematic look and the soft light look.
function SideNavLink({ to, icon, label, active }: { to: string; icon: React.ReactNode; label: string; active: boolean }) {
  const [hover, setHover] = useState(false);
  return (
    <Link
      to={to}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "relative",
        display: "flex", alignItems: "center", gap: "11px",
        padding: "7px 12px 7px 14px", margin: "0 4px 3px",
        borderRadius: "10px", textDecoration: "none",
        fontSize: "13px", fontWeight: active ? 650 : 500,
        color: active ? "var(--clr-green)" : hover ? "var(--clr-text)" : "var(--clr-text-muted)",
        backgroundColor: active
          ? "color-mix(in srgb, var(--clr-green) 13%, transparent)"
          : hover ? "color-mix(in srgb, var(--clr-text) 5%, transparent)" : "transparent",
        border: "1px solid",
        borderColor: active ? "color-mix(in srgb, var(--clr-green) 32%, transparent)" : "transparent",
        transition: "background-color .18s ease, color .18s ease, border-color .18s ease",
      }}
    >
      <span style={{
        position: "absolute", left: 0, top: 9, bottom: 9, width: 3, borderRadius: 3,
        background: active ? "var(--clr-green)" : "transparent",
        boxShadow: active ? "0 0 8px var(--clr-green)" : "none",
        transition: "background .18s ease",
      }} />
      <span style={{
        width: 30, height: 30, borderRadius: 9, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
        backgroundColor: active
          ? "color-mix(in srgb, var(--clr-green) 16%, transparent)"
          : "color-mix(in srgb, var(--clr-text) 5%, transparent)",
        color: active ? "var(--clr-green)" : hover ? "var(--clr-text)" : "var(--clr-text-muted)",
        transition: "background-color .18s ease, color .18s ease",
      }}>
        {icon}
      </span>
      <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
      {active && <span style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: "var(--clr-green)", flexShrink: 0 }} />}
    </Link>
  );
}

function SideSection({ children, tight }: { children: React.ReactNode; tight?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: tight ? "8px 16px 7px" : "14px 16px 7px" }}>
      <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".16em", color: "var(--clr-text-muted)", whiteSpace: "nowrap" }}>{children}</span>
      <span style={{ flex: 1, height: 1, background: "var(--clr-border)" }} />
    </div>
  );
}

function SideSignOut({ label, onClick }: { label: string; onClick: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
        width: "100%", padding: "10px 12px",
        backgroundColor: hover ? "var(--clr-red-bg)" : "var(--clr-surface-2)",
        border: "1px solid", borderColor: hover ? "var(--clr-red-border)" : "var(--clr-border)",
        borderRadius: "10px", fontSize: "13px", fontWeight: 600,
        color: hover ? "var(--clr-red)" : "var(--clr-text-muted)",
        cursor: "pointer", transition: "all .18s ease",
      }}
    >
      <FaSignOutAlt size={13} /> {label}
    </button>
  );
}

function useIsMobile(breakpoint = 900) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < breakpoint : false
  );
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [breakpoint]);
  return isMobile;
}

export default function CitizenLayout() {
  // Consumes the active Navbar/Header language — sidebar labels re-render
  // instantly alongside page content on language change.
  const { language, t, tList } = useLanguage();
  void language;
  void tList;
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [citizenId, setCitizenId] = useState<string | null>(null);
  useEffect(() => { supabase.auth.getUser().then(({ data }) => setCitizenId(data.user?.id ?? null)); }, []);
  usePresence(citizenId, "citizen", !!citizenId);
  useHeartbeat(citizenId, "citizen", !!citizenId);

  const handleLogout = async () => {
    if (citizenId) await markOffline(citizenId, "citizen");
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  // Close the mobile drawer on every navigation (including back/forward).
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Lock body scroll only while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  const isActive = (to: string) =>
    pathname === to || pathname.startsWith(to + "/");

  const sidebarBody = (
    <>
      <div style={{ padding: "18px 16px 16px", borderBottom: "1px solid var(--clr-border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ position: "relative", flexShrink: 0 }}>
            <img src={dsgLogo} alt="DSG" style={{ width: "42px", height: "42px", borderRadius: "11px", display: "block", border: "1px solid var(--clr-border-2)", background: "var(--clr-surface-2)" }} />
            <span style={{ position: "absolute", right: -2, bottom: -2, width: 12, height: 12, borderRadius: "50%", background: "var(--clr-green)", border: "2px solid var(--citizen-rail)", boxShadow: "0 0 6px var(--clr-green)" }} />
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: "15px", fontWeight: "800", letterSpacing: "-0.01em", color: "var(--clr-text)", whiteSpace: "nowrap" }}>DumaSafeGuide</div>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: "4px", fontSize: "9px", fontWeight: "800", letterSpacing: "0.12em", color: "var(--clr-green)", background: "var(--clr-green-bg)", border: "1px solid var(--clr-green-border)", borderRadius: 20, padding: "2px 9px" }}>
              CITIZEN
            </span>
          </div>
          {isMobile && (
            <button onClick={() => setDrawerOpen(false)} aria-label="Close navigation" style={{ marginLeft: "auto", background: "var(--clr-surface-2)", border: "1px solid var(--clr-border)", borderRadius: "8px", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--clr-text-muted)", cursor: "pointer", fontSize: "13px" }}>
              <FaTimes />
            </button>
          )}
        </div>
      </div>

      <nav style={{ flex: 1, overflowY: "auto", padding: "4px 6px 12px", scrollbarWidth: "thin", scrollbarColor: "var(--clr-border-2) transparent" }}>
        <SideSection>{t("dashboard.sidebarPortal", "Portal")}</SideSection>
        <SideNavLink to="/citizen/dashboard" icon={<FaHome size={14} />} label={t("history.overview", "Overview")} active={isActive("/citizen/dashboard")} />

        <SideSection tight>{t("history.actions", "Actions")}</SideSection>
        <SideNavLink to="/citizen/report" icon={<FaFileAlt size={14} />} label={t("nav.reportIncident", "Report Incident")} active={isActive("/citizen/report")} />
        <SideNavLink to="/citizen/chat" icon={<FaComments size={14} />} label={t("nav.chat", "Chat")} active={isActive("/citizen/chat")} />
        <SideNavLink to="/citizen/history" icon={<FaFolderOpen size={14} />} label={t("nav.myReports", "My Reports")} active={isActive("/citizen/history")} />
        <SideNavLink to="/citizen/alerts" icon={<FaBell size={14} />} label={t("history.barangayAlerts", "Barangay Alerts")} active={isActive("/citizen/alerts")} />
        <SideNavLink to="/citizen/map" icon={<FaMapMarkedAlt size={14} />} label={t("history.safetyMap", "Safety Map")} active={isActive("/citizen/map")} />
        <SideNavLink to="/citizen/safetytips" icon={<FaLightbulb size={14} />} label={t("history.safetyTips", "Safety Tips")} active={isActive("/citizen/safetytips")} />

        <SideSection tight>{t("history.info", "Info")}</SideSection>
        <SideNavLink to="/citizen/directory" icon={<FaAddressBook size={14} />} label={t("history.directory", "Directory")} active={isActive("/citizen/directory")} />
        <SideNavLink to="/citizen/resources" icon={<FaBookOpen size={14} />} label={t("history.resources", "Resources")} active={isActive("/citizen/resources")} />
      </nav>

      <div style={{ padding: "12px", borderTop: "1px solid var(--clr-border)", display: "flex", flexDirection: "column", gap: "8px", background: "color-mix(in srgb, var(--clr-text) 2%, transparent)" }}>
        <ThemeToggle />
        <SideSignOut label={t("history.signOut", "Sign Out")} onClick={handleLogout} />
        <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.14em", textAlign: "center", color: "var(--clr-text-muted)" }}>
          {t("dashboard.dumagueteCity", "DUMAGUETE CITY")}
        </div>
      </div>
    </>
  );

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--clr-bg)" }}>
      {!isMobile && (
        <aside style={{ position: "fixed", left: 0, top: 0, width: "260px", height: "100vh", backgroundColor: "var(--citizen-rail)", borderRight: "1px solid var(--clr-border)", boxShadow: "4px 0 24px rgba(0,0,0,0.12)", display: "flex", flexDirection: "column", zIndex: 200 }}>
          {sidebarBody}
        </aside>
      )}

      {isMobile && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: "56px", backgroundColor: "color-mix(in srgb, var(--citizen-rail) 92%, transparent)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderBottom: "1px solid var(--clr-border)", boxShadow: "0 2px 16px rgba(0,0,0,0.10)", display: "flex", alignItems: "center", gap: "10px", padding: "0 16px", zIndex: 200 }}>
          <button onClick={() => setDrawerOpen(true)} aria-label="Open navigation" style={{ background: "var(--clr-surface-2)", border: "1px solid var(--clr-border)", borderRadius: "8px", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--clr-text)", cursor: "pointer", fontSize: "14px" }}>
            <FaBars />
          </button>
          <img src={dsgLogo} alt="DSG" style={{ width: "26px", height: "26px", borderRadius: "7px", border: "1px solid var(--clr-border)" }} />
          <span style={{ fontSize: "14px", fontWeight: "800", letterSpacing: "-0.01em", color: "var(--clr-text)" }}>DumaSafeGuide</span>
          <span style={{ fontSize: "8px", fontWeight: "800", letterSpacing: "0.12em", color: "var(--clr-green)", background: "var(--clr-green-bg)", border: "1px solid var(--clr-green-border)", borderRadius: 20, padding: "2px 7px" }}>CITIZEN</span>
          <span style={{ marginLeft: "auto" }}><ThemeToggle compact /></span>
        </div>
      )}

      {isMobile && drawerOpen && (
        <>
          <div onClick={() => setDrawerOpen(false)} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 299 }} />
          <aside style={{ position: "fixed", left: 0, top: 0, width: "280px", height: "100vh", backgroundColor: "var(--citizen-rail)", borderRight: "1px solid var(--clr-border-2)", display: "flex", flexDirection: "column", zIndex: 300, pointerEvents: "auto" }}>
            {sidebarBody}
          </aside>
        </>
      )}

      <main style={{ marginLeft: isMobile ? 0 : "260px", paddingTop: isMobile ? "56px" : 0, minHeight: "100vh" }}>
        <Outlet />
      </main>
      {citizenId && <GlobalCitizenCallHandler citizenId={citizenId} />}
    </div>
  );
}
