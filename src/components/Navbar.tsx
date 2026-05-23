// src/components/Navbar.tsx
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../js/supabase";
import logoImage from "../assets/dsg.logo.png";
import "./Navbar.css";

export default function Navbar() {
  const [user, setUser]                   = useState<any>(null);
  const [role, setRole]                   = useState<string | null>(null);
  const [pendingCount, setPendingCount]   = useState(0);
  const [newNotesCount, setNewNotesCount] = useState(0);
  const [alertCount, setAlertCount]       = useState(0);
  const [menuOpen, setMenuOpen]           = useState(false);
  const navigate  = useNavigate();
  const location  = useLocation();

  const isCitizenDashboard = location.pathname === "/citizen/dashboard";

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) { setUser(session.user); fetchRole(session.user.id); }
    };
    getInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) fetchRole(currentUser.id);
      else setRole(null);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const nav = document.querySelector(".navbar-container");
    const handleScroll = () => {
      if (!nav) return;
      nav.classList.toggle("scrolled", window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.pathname]);

  useEffect(() => {
    if (!isCitizenDashboard || !user) {
      setPendingCount(0); setNewNotesCount(0); return;
    }
    const loadCounts = async () => {
      const { data } = await supabase
        .from("reports").select("id, status, responder_notes, action_notes")
        .eq("user_id", user.id);
      if (!data) return;
      setPendingCount(data.filter((r) => r.status === "pending").length);
      let seenNotes: Set<string> = new Set();
      try {
        const raw = localStorage.getItem("cd_seen_notes");
        seenNotes = new Set(raw ? JSON.parse(raw) : []);
      } catch {}
      const newNotes = data.filter((r) => {
        const note = (r.responder_notes ?? r.action_notes ?? "").trim();
        return note && !seenNotes.has(String(r.id));
      }).length;
      setNewNotesCount(newNotes);
    };
    loadCounts();
    const ch = supabase
      .channel("navbar-citizen-counts")
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, loadCounts)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [isCitizenDashboard, user]);

  useEffect(() => {
    if (!user) { setAlertCount(0); return; }
    const loadAlerts = async () => {
      const { count } = await supabase
        .from("alerts")
        .select("*", { count: "exact", head: true });
      setAlertCount(count ?? 0);
    };
    loadAlerts();
    const ch = supabase
      .channel("navbar-alerts")
      .on("postgres_changes", { event: "*", schema: "public", table: "alerts" }, loadAlerts)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const fetchRole = async (userId: string) => {
    try {
      const { data } = await supabase.from("profiles").select("role").eq("id", userId).single();
      setRole(data?.role);
    } catch (err) { console.error("Error fetching role:", err); }
  };

  // ── FIXED: signOut first, clear state, then navigate ──
  const handleLogout = async () => {
    setMenuOpen(false);
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
    navigate("/", { replace: true });
  };

  const isAuthPage = ["/login", "/signup"].includes(location.pathname);
  const isHomePage  = location.pathname === "/";

  const displayName = user?.user_metadata?.full_name
    || user?.email?.split("@")[0]
    || "Citizen";
  const initials = displayName
    .split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);

  const hasDot = pendingCount > 0 || newNotesCount > 0;

  const navLinks = (
    <>
      <Link to="/directory"  onClick={() => setMenuOpen(false)}>Directory</Link>
      <Link to="/map"        onClick={() => setMenuOpen(false)}>Map</Link>
      <Link to="/safetytips" onClick={() => setMenuOpen(false)}>Safety Tips</Link>
      <Link to="/about"      onClick={() => setMenuOpen(false)}>About</Link>
      {user ? (
        <>
          {role === "citizen"   && <Link to="/citizen/dashboard"   onClick={() => setMenuOpen(false)}>My Dashboard</Link>}
          {role === "responder" && <Link to="/responder/dashboard" onClick={() => setMenuOpen(false)}>Responder Panel</Link>}
          {role === "admin"     && <Link to="/admin/dashboard"     onClick={() => setMenuOpen(false)}>Admin Dashboard</Link>}
        </>
      ) : (
        !isHomePage && !isAuthPage && (
          <>
            <Link to="/login"  className="nav-login-link"  onClick={() => setMenuOpen(false)}>Login</Link>
            <Link to="/signup" className="nav-signup-btn"  onClick={() => setMenuOpen(false)}>Create Account</Link>
          </>
        )
      )}
    </>
  );

  const portalContent = createPortal(
    <>
      <div
        className={`nav-overlay ${menuOpen ? "visible" : ""}`}
        onClick={() => setMenuOpen(false)}
      />
      <div className={`nav-drawer ${menuOpen ? "open" : ""}`}>
        <div className="nav-drawer-header">
          <div className="nav-drawer-brand">
            <img src={logoImage} alt="DSG" className="nav-drawer-logo" />
            <span className="nav-drawer-brand-name">
              DumaSafe<span>Guide</span>
            </span>
          </div>
          <button
            className="nav-drawer-close"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        {user && (
          <div className="nav-drawer-user">
            <div className="nav-drawer-avatar">{initials}</div>
            <div className="nav-drawer-user-info">
              <div className="nav-drawer-user-name">{displayName}</div>
              <div className="nav-drawer-user-role">{role ?? "citizen"}</div>
            </div>
            {alertCount > 0 ? (
              <Link
                to="/citizen/alerts"
                onClick={() => setMenuOpen(false)}
                style={{
                  marginLeft: "auto", display: "flex", alignItems: "center",
                  gap: 5, fontSize: 11, fontWeight: 700, color: "#2ECC8F",
                  textDecoration: "none", background: "rgba(46,204,143,0.1)",
                  border: "1px solid rgba(46,204,143,0.25)", borderRadius: 20,
                  padding: "3px 9px",
                }}
              >
                <span style={{
                  width: 6, height: 6, borderRadius: "50%", background: "#2ECC8F",
                  boxShadow: "0 0 6px #2ECC8F", display: "inline-block", flexShrink: 0,
                }} />
                {alertCount} alert{alertCount !== 1 ? "s" : ""}
              </Link>
            ) : hasDot ? (
              <div className="nav-drawer-bell-dot" title="You have notifications" />
            ) : null}
          </div>
        )}

        <div className="nav-drawer-divider" />

        <nav className="nav-drawer-links">
          <Link to="/directory"  onClick={() => setMenuOpen(false)}><span className="ndl-icon">🗂</span> Directory</Link>
          <Link to="/map"        onClick={() => setMenuOpen(false)}><span className="ndl-icon">🗺</span> Map</Link>
          <Link to="/safetytips" onClick={() => setMenuOpen(false)}><span className="ndl-icon">💡</span> Safety Tips</Link>
          <Link to="/about"      onClick={() => setMenuOpen(false)}><span className="ndl-icon">ℹ️</span> About</Link>

          {user ? (
            <>
              <div className="nav-drawer-divider" />
              {role === "citizen"   && <Link to="/citizen/dashboard"   onClick={() => setMenuOpen(false)}><span className="ndl-icon">📊</span> My Dashboard</Link>}
              {role === "responder" && <Link to="/responder/dashboard" onClick={() => setMenuOpen(false)}><span className="ndl-icon">🛡</span> Responder Panel</Link>}
              {role === "admin"     && <Link to="/admin/dashboard"     onClick={() => setMenuOpen(false)}><span className="ndl-icon">⚙️</span> Admin Dashboard</Link>}
              {alertCount > 0 && (
                <Link to="/citizen/alerts" onClick={() => setMenuOpen(false)}>
                  <span className="ndl-icon">🔔</span> Alerts
                  <span style={{
                    marginLeft: "auto", fontSize: 10, fontWeight: 700, color: "#2ECC8F",
                    background: "rgba(46,204,143,0.1)", border: "1px solid rgba(46,204,143,0.25)",
                    borderRadius: 20, padding: "2px 8px",
                  }}>
                    {alertCount > 9 ? "9+" : alertCount}
                  </span>
                </Link>
              )}
            </>
          ) : (
            !isHomePage && !isAuthPage && (
              <>
                <div className="nav-drawer-divider" />
                <Link to="/login"  onClick={() => setMenuOpen(false)}><span className="ndl-icon">🔑</span> Login</Link>
                <Link to="/signup" onClick={() => setMenuOpen(false)}><span className="ndl-icon">✨</span> Create Account</Link>
              </>
            )
          )}
        </nav>

        {/* ── Mobile drawer logout ── */}
        {user && (
          <div className="nav-drawer-footer">
            <button onClick={handleLogout} className="nav-drawer-logout">
              Sign Out
            </button>
          </div>
        )}
      </div>
    </>,
    document.body
  );

  return (
    <>
      <nav
        className="navbar-container"
        style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 99999 }}
      >
        <div className="nav-logo">
          <Link to="/" className="logo-wrapper">
            <div className="logo-glow-container">
              <img src={logoImage} alt="DSG Logo" className="nav-logo-img" />
            </div>
            <span className="logo-text">
              DumaSafe<span className="logo-guide-text">Guide</span>
            </span>
          </Link>
        </div>

        <div className="nav-links nav-links-desktop">
          {navLinks}

          {user && isCitizenDashboard && role === "citizen" && (
            <>
              <Link
                to="/citizen/alerts"
                className="csb-bell"
                title={alertCount > 0
                  ? `${alertCount} admin alert${alertCount !== 1 ? "s" : ""}`
                  : "Notifications"}
                style={{ textDecoration: "none", position: "relative" }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6V11c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                </svg>
                {alertCount > 0 && (
                  <span
                    className="csb-bell-dot"
                    style={{
                      minWidth: alertCount > 9 ? 16 : undefined,
                      borderRadius: 10, fontSize: 9, fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      padding: alertCount > 9 ? "0 3px" : undefined,
                    }}
                  >
                    {alertCount > 9 ? "9+" : alertCount}
                  </span>
                )}
                {alertCount === 0 && hasDot && <span className="csb-bell-dot" />}
              </Link>

              <div className="csb-pill">
                <div className="csb-avatar">{initials}</div>
                <span className="csb-name">{displayName}</span>
                <span className="csb-role-chip">Citizen</span>
              </div>
            </>
          )}

          {/* ── Desktop logout — always visible when logged in ── */}
          {user && (
            <button
              onClick={handleLogout}
              className="nav-logout-btn"
              style={{
                cursor: "pointer",
                padding: "8px 18px",
                borderRadius: "8px",
                border: "1px solid rgba(255,107,107,0.3)",
                background: "rgba(255,107,107,0.08)",
                color: "#FF6B6B",
                fontSize: "13px",
                fontWeight: 600,
                fontFamily: "inherit",
                transition: "all 0.2s",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,107,107,0.18)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,107,107,0.55)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,107,107,0.08)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,107,107,0.3)";
              }}
            >
              Logout
            </button>
          )}
        </div>

        <button
          className={`nav-hamburger ${menuOpen ? "open" : ""}`}
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <span /><span /><span />
        </button>
      </nav>

      {portalContent}
    </>
  );
}