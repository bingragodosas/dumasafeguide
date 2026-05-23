// src/components/Navbar.tsx (FIXED)
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../js/supabase";
import logoImage from "../assets/dsg.logo.png";
import "./Navbar.css";

export default function Navbar() {
  const [user, setUser]                   = useState<any>(undefined);
  const [role, setRole]                   = useState<string | null>(null);
  const [pendingCount, setPendingCount]   = useState(0);
  const [newNotesCount, setNewNotesCount] = useState(0);
  const [unreadAlerts, setUnreadAlerts]   = useState(0);
  const [menuOpen, setMenuOpen]           = useState(false);
  const navigate  = useNavigate();
  const location  = useLocation();

  const isCitizenDash = location.pathname === "/citizen/dashboard";
  const isLoggedIn    = user !== null && user !== undefined;

  // ── helpers: persist read alert IDs in localStorage ──────────────────────
  const getReadAlertIds = (): Set<string> => {
    try {
      const raw = localStorage.getItem("nb_read_alerts");
      return new Set(raw ? JSON.parse(raw) : []);
    } catch { return new Set(); }
  };
  const markAlertsRead = (ids: string[]) => {
    try {
      const s = getReadAlertIds();
      ids.forEach(id => s.add(id));
      localStorage.setItem("nb_read_alerts", JSON.stringify([...s]));
      setUnreadAlerts(0);
    } catch {}
  };

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) fetchRole(session.user.id);
    };
    getInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) fetchRole(currentUser.id);
      else { setRole(null); }
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

  // ── FIX: Citizen report counts — unique channel name prevents collision ──
  useEffect(() => {
    if (!user) { setPendingCount(0); setNewNotesCount(0); return; }

    const loadCounts = async () => {
      const { data } = await supabase
        .from("reports").select("id, status, responder_notes, action_notes")
        .eq("user_id", user.id);
      if (!data) return;
      setPendingCount(data.filter(r => r.status === "pending").length);
      const seenNotes = (() => {
        try { const raw = localStorage.getItem("cd_seen_notes"); return new Set(raw ? JSON.parse(raw) : []); }
        catch { return new Set(); }
      })();
      setNewNotesCount(data.filter(r => {
        const note = (r.responder_notes ?? r.action_notes ?? "").trim();
        return note && !seenNotes.has(String(r.id));
      }).length);
    };

    loadCounts();

    // ✅ FIX: Use Date.now() so each mount gets a fresh channel name,
    //         avoiding "cannot add callbacks after subscribe()" crash
    const ch = supabase
      .channel(`navbar-citizen-counts-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reports" },
        loadCounts
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [user]);

  // ── FIX: Unread alerts — unique channel name prevents collision ──────────
  useEffect(() => {
    if (!user) { setUnreadAlerts(0); return; }

    const calcUnread = (alerts: { id: string }[]) => {
      const read = getReadAlertIds();
      return alerts.filter(a => !read.has(String(a.id))).length;
    };

    const loadAlerts = async () => {
      const { data } = await supabase.from("alerts").select("id");
      setUnreadAlerts(calcUnread((data ?? []) as { id: string }[]));
    };
    loadAlerts();

    // ✅ FIX: Use Date.now() so each mount gets a fresh channel name
    const ch = supabase
      .channel(`navbar-alerts-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "alerts" },
        () => {
          setUnreadAlerts(prev => prev + 1);
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "alerts" },
        () => loadAlerts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [user]);

  const fetchRole = async (userId: string) => {
    try {
      const { data } = await supabase.from("profiles").select("role").eq("id", userId).single();
      setRole(data?.role);
    } catch (err) { console.error("Error fetching role:", err); }
  };

  const handleLogout = async () => {
    setMenuOpen(false);
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
    navigate("/", { replace: true });
  };

  const handleBellClick = async () => {
    const { data } = await supabase.from("alerts").select("id");
    if (data) markAlertsRead(data.map((a: any) => String(a.id)));
  };

  const isAuthPage  = ["/login", "/signup"].includes(location.pathname);
  const isHomePage  = location.pathname === "/";

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Citizen";
  const initials    = displayName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
  const hasDot      = pendingCount > 0 || newNotesCount > 0;

  // ── Citizen-exclusive navbar ──────────────────────────────────────────────
  const isCitizenPage = isLoggedIn && role === "citizen" &&
    location.pathname.startsWith("/citizen");

  if (isCitizenPage) {
    return <CitizenNavbar
      displayName={displayName}
      initials={initials}
      unreadAlerts={unreadAlerts}
      hasDot={hasDot}
      menuOpen={menuOpen}
      setMenuOpen={setMenuOpen}
      handleLogout={handleLogout}
      handleBellClick={handleBellClick}
      location={location}
    />;
  }

  // ── Standard (public) navbar ──────────────────────────────────────────────
  const navLinks = (
    <>
      <Link to="/directory"  onClick={() => setMenuOpen(false)}>Directory</Link>
      <Link to="/map"        onClick={() => setMenuOpen(false)}>Map</Link>
      <Link to="/safetytips" onClick={() => setMenuOpen(false)}>Safety Tips</Link>
      <Link to="/about"      onClick={() => setMenuOpen(false)}>About</Link>
      {isLoggedIn ? (
        <>
          {role === "citizen"   && <Link to="/citizen/dashboard"   onClick={() => setMenuOpen(false)}>My Dashboard</Link>}
          {role === "responder" && <Link to="/responder/dashboard" onClick={() => setMenuOpen(false)}>Responder Panel</Link>}
          {role === "admin"     && <Link to="/admin/dashboard"     onClick={() => setMenuOpen(false)}>Admin Dashboard</Link>}
        </>
      ) : (
        user === null && !isHomePage && !isAuthPage && (
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
      <div className={`nav-overlay ${menuOpen ? "visible" : ""}`} onClick={() => setMenuOpen(false)} />
      <div className={`nav-drawer ${menuOpen ? "open" : ""}`}>
        <div className="nav-drawer-header">
          <div className="nav-drawer-brand">
            <img src={logoImage} alt="DSG" className="nav-drawer-logo" />
            <span className="nav-drawer-brand-name">DumaSafe<span>Guide</span></span>
          </div>
          <button className="nav-drawer-close" onClick={() => setMenuOpen(false)} aria-label="Close menu">✕</button>
        </div>
        {isLoggedIn && (
          <div className="nav-drawer-user">
            <div className="nav-drawer-avatar">{initials}</div>
            <div className="nav-drawer-user-info">
              <div className="nav-drawer-user-name">{displayName}</div>
              <div className="nav-drawer-user-role">{role ?? "citizen"}</div>
            </div>
          </div>
        )}
        <div className="nav-drawer-divider" />
        <nav className="nav-drawer-links">
          <Link to="/directory"  onClick={() => setMenuOpen(false)}><span className="ndl-icon">🗂</span> Directory</Link>
          <Link to="/map"        onClick={() => setMenuOpen(false)}><span className="ndl-icon">🗺</span> Map</Link>
          <Link to="/safetytips" onClick={() => setMenuOpen(false)}><span className="ndl-icon">💡</span> Safety Tips</Link>
          <Link to="/about"      onClick={() => setMenuOpen(false)}><span className="ndl-icon">ℹ️</span> About</Link>
          {isLoggedIn ? (
            <>
              <div className="nav-drawer-divider" />
              {role === "citizen"   && <Link to="/citizen/dashboard"   onClick={() => setMenuOpen(false)}><span className="ndl-icon">📊</span> My Dashboard</Link>}
              {role === "responder" && <Link to="/responder/dashboard" onClick={() => setMenuOpen(false)}><span className="ndl-icon">🛡</span> Responder Panel</Link>}
              {role === "admin"     && <Link to="/admin/dashboard"     onClick={() => setMenuOpen(false)}><span className="ndl-icon">⚙️</span> Admin Dashboard</Link>}
            </>
          ) : (
            user === null && !isHomePage && !isAuthPage && (
              <>
                <div className="nav-drawer-divider" />
                <Link to="/login"  onClick={() => setMenuOpen(false)}><span className="ndl-icon">🔑</span> Login</Link>
                <Link to="/signup" onClick={() => setMenuOpen(false)}><span className="ndl-icon">✨</span> Create Account</Link>
              </>
            )
          )}
        </nav>
        {isLoggedIn && (
          <div className="nav-drawer-footer">
            <button onClick={handleLogout} className="nav-drawer-logout">Sign Out</button>
          </div>
        )}
      </div>
    </>,
    document.body
  );

  return (
    <>
      <nav className="navbar-container" style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 99999 }}>
        <div className="nav-logo">
          <Link to="/" className="logo-wrapper">
            <div className="logo-glow-container">
              <img src={logoImage} alt="DSG Logo" className="nav-logo-img" />
            </div>
            <span className="logo-text">DumaSafe<span className="logo-guide-text">Guide</span></span>
          </Link>
        </div>
        <div className="nav-links nav-links-desktop">
          {navLinks}
          {isLoggedIn && (
            <button
              onClick={handleLogout}
              className="nav-logout-btn"
              style={{
                cursor: "pointer", padding: "8px 18px", borderRadius: "8px",
                border: "1px solid rgba(255,107,107,0.3)", background: "rgba(255,107,107,0.08)",
                color: "#FF6B6B", fontSize: "13px", fontWeight: 600,
                fontFamily: "'Instrument Sans', sans-serif",
                transition: "all 0.2s", whiteSpace: "nowrap",
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
        <button className={`nav-hamburger ${menuOpen ? "open" : ""}`} onClick={() => setMenuOpen(v => !v)} aria-label="Toggle menu" aria-expanded={menuOpen}>
          <span /><span /><span />
        </button>
      </nav>
      {portalContent}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CitizenNavbar — exclusive navbar shown only when logged in as citizen
// ─────────────────────────────────────────────────────────────────────────────
const CITIZEN_NAV_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@500;700;800;900&family=Instrument+Sans:wght@400;500;600&display=swap');

  .cn-bar {
    position: fixed; top: 0; left: 0; right: 0; z-index: 99999;
    height: 58px;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 28px;
    background: rgba(8,12,20,0.88);
    border-bottom: 1px solid rgba(255,255,255,0.07);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    font-family: 'Instrument Sans', sans-serif;
    transition: background 0.25s, border-color 0.25s, box-shadow 0.25s;
  }
  .cn-bar.scrolled {
    background: rgba(8,12,20,0.97);
    border-color: rgba(255,255,255,0.1);
    box-shadow: 0 1px 24px rgba(0,0,0,0.4);
  }

  .cn-brand { display: flex; align-items: center; gap: 9px; text-decoration: none; flex-shrink: 0; }
  .cn-brand-logo { width: 28px; height: 28px; object-fit: contain; }
  .cn-brand-name { font-family: 'Cabinet Grotesk', sans-serif; font-size: 15px; font-weight: 900; letter-spacing: -.03em; color: #eef0f7; }
  .cn-brand-name span { color: #2ECC8F; }

  .cn-links { display: flex; align-items: center; gap: 2px; list-style: none; }
  .cn-links a {
    font-family: 'Instrument Sans', sans-serif; font-size: 12.5px; font-weight: 500;
    color: rgba(238,240,247,0.45); text-decoration: none;
    padding: 6px 11px; border-radius: 7px;
    transition: color 0.15s, background 0.15s; white-space: nowrap;
  }
  .cn-links a:hover     { color: #eef0f7; background: rgba(255,255,255,0.05); }
  .cn-links a.cn-active { color: #2ECC8F; background: rgba(46,204,143,0.08); }

  .cn-sep { width: 1px; height: 16px; background: rgba(255,255,255,0.08); margin: 0 6px; flex-shrink: 0; }

  .cn-report {
    font-family: 'Instrument Sans', sans-serif; font-size: 12px; font-weight: 600;
    color: rgba(238,240,247,0.85); background: rgba(46,204,143,0.1);
    border: 1px solid rgba(46,204,143,0.2); border-radius: 7px; padding: 6px 13px;
    text-decoration: none; white-space: nowrap; letter-spacing: .01em;
    transition: background 0.15s, border-color 0.15s, color 0.15s;
  }
  .cn-report:hover { background: rgba(46,204,143,0.18); border-color: rgba(46,204,143,0.35); color: #eef0f7; }

  .cn-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

  .cn-bell {
    position: relative; display: flex; align-items: center; justify-content: center;
    width: 34px; height: 34px; border-radius: 8px;
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);
    color: rgba(238,240,247,0.4); text-decoration: none; cursor: pointer;
    transition: color 0.15s, background 0.15s, border-color 0.15s;
  }
  .cn-bell:hover { color: rgba(238,240,247,0.85); background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.12); }
  .cn-bell-badge {
    position: absolute; top: -4px; right: -4px;
    min-width: 15px; height: 15px; border-radius: 50%;
    background: #EF5B5B; color: #fff; font-size: 8px; font-weight: 800;
    font-family: 'Instrument Sans', sans-serif;
    display: flex; align-items: center; justify-content: center;
    padding: 0 3px; border: 2px solid #080c14;
    animation: cn-pop 0.22s cubic-bezier(.34,1.56,.64,1) both;
  }
  @keyframes cn-pop { from{transform:scale(0);}to{transform:scale(1);} }

  .cn-user {
    display: flex; align-items: center; gap: 7px;
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);
    border-radius: 8px; padding: 4px 10px 4px 5px;
    transition: background 0.15s, border-color 0.15s;
  }
  .cn-user:hover { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.11); }
  .cn-avatar {
    width: 24px; height: 24px; border-radius: 6px; background: #1a9e6a;
    display: flex; align-items: center; justify-content: center;
    font-size: 9px; font-weight: 800; color: #060a10;
    font-family: 'Cabinet Grotesk', sans-serif; flex-shrink: 0;
  }
  .cn-user-name { font-size: 12px; font-weight: 600; color: rgba(238,240,247,0.75); max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .cn-role-chip {
    font-size: 9px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
    color: rgba(46,204,143,0.65); background: rgba(46,204,143,0.07);
    border: 1px solid rgba(46,204,143,0.14); border-radius: 20px; padding: 2px 6px;
  }

  .cn-logout {
    font-family: 'Instrument Sans', sans-serif; font-size: 12px; font-weight: 600;
    padding: 6px 13px; border-radius: 7px;
    border: 1px solid rgba(255,255,255,0.08); background: transparent;
    color: rgba(238,240,247,0.3); cursor: pointer; white-space: nowrap;
    transition: color 0.18s, background 0.18s, border-color 0.18s;
  }
  .cn-logout:hover { color: #FF6B6B; background: rgba(255,107,107,0.07); border-color: rgba(255,107,107,0.28); }

  .cn-ham { display: none; flex-direction: column; gap: 5px; background: none; border: none; cursor: pointer; padding: 6px; }
  .cn-ham span { display: block; width: 20px; height: 1.5px; background: rgba(238,240,247,0.55); border-radius: 2px; transition: all 0.22s; }
  .cn-ham.open span:nth-child(1) { transform: translateY(6.5px) rotate(45deg); }
  .cn-ham.open span:nth-child(2) { opacity: 0; }
  .cn-ham.open span:nth-child(3) { transform: translateY(-6.5px) rotate(-45deg); }

  .cn-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 99998; opacity: 0; pointer-events: none; transition: opacity 0.22s; }
  .cn-overlay.visible { opacity: 1; pointer-events: all; }

  .cn-drawer {
    position: fixed; top: 0; right: 0; bottom: 0; width: min(300px, 86vw);
    background: rgba(10,14,24,0.99); border-left: 1px solid rgba(255,255,255,0.07);
    z-index: 99999; display: flex; flex-direction: column;
    transform: translateX(100%); transition: transform 0.28s cubic-bezier(.22,1,.36,1);
    font-family: 'Instrument Sans', sans-serif;
  }
  .cn-drawer.open { transform: translateX(0); }

  .cn-drawer-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 18px; border-bottom: 1px solid rgba(255,255,255,0.06); }
  .cn-drawer-close {
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
    color: rgba(238,240,247,0.4); border-radius: 7px; width: 28px; height: 28px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; font-size: 12px; transition: all 0.15s;
  }
  .cn-drawer-close:hover { background: rgba(255,107,107,0.08); color: #FF6B6B; border-color: rgba(255,107,107,0.22); }

  .cn-drawer-user { display: flex; align-items: center; gap: 11px; padding: 14px 18px; border-bottom: 1px solid rgba(255,255,255,0.06); }
  .cn-drawer-avatar {
    width: 36px; height: 36px; border-radius: 9px; background: #1a9e6a;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 800; color: #060a10;
    font-family: 'Cabinet Grotesk', sans-serif; flex-shrink: 0;
  }
  .cn-drawer-uname { font-size: 13px; font-weight: 600; color: #eef0f7; }
  .cn-drawer-urole { font-size: 10.5px; color: rgba(238,240,247,0.3); margin-top: 2px; letter-spacing: .04em; }

  .cn-drawer-nav { flex: 1; overflow-y: auto; padding: 8px 10px; display: flex; flex-direction: column; gap: 1px; }
  .cn-drawer-nav a {
    display: flex; align-items: center; gap: 11px;
    font-size: 13px; font-weight: 500; color: rgba(238,240,247,0.5);
    text-decoration: none; padding: 10px 11px; border-radius: 8px;
    transition: color 0.15s, background 0.15s;
  }
  .cn-drawer-nav a:hover    { color: #eef0f7; background: rgba(255,255,255,0.05); }
  .cn-drawer-nav a.cn-active { color: #2ECC8F; background: rgba(46,204,143,0.08); }
  .cn-drawer-nav .cn-div { height: 1px; background: rgba(255,255,255,0.05); margin: 6px 0; }

  .cn-drawer-footer { padding: 14px 18px; border-top: 1px solid rgba(255,255,255,0.06); }
  .cn-drawer-logout {
    width: 100%; padding: 10px;
    font-family: 'Instrument Sans', sans-serif; font-size: 12.5px; font-weight: 600;
    border-radius: 8px; border: 1px solid rgba(255,107,107,0.22);
    background: rgba(255,107,107,0.06); color: #FF6B6B; cursor: pointer; transition: all 0.15s;
  }
  .cn-drawer-logout:hover { background: rgba(255,107,107,0.14); border-color: rgba(255,107,107,0.42); }

  .cn-drawer-bell {
    display: flex; align-items: center; gap: 11px;
    font-size: 13px; font-weight: 500; color: rgba(238,240,247,0.5);
    text-decoration: none; padding: 10px 11px; border-radius: 8px;
    transition: color 0.15s, background 0.15s;
  }
  .cn-drawer-bell:hover { color: #eef0f7; background: rgba(255,255,255,0.05); }
  .cn-drawer-bell.cn-active { color: #2ECC8F; background: rgba(46,204,143,0.08); }
  .cn-drawer-bell-count {
    margin-left: auto; font-size: 10px; font-weight: 700;
    background: rgba(239,91,91,0.12); color: #EF5B5B;
    border: 1px solid rgba(239,91,91,0.22); border-radius: 20px; padding: 2px 7px;
  }

  @media (max-width: 820px) {
    .cn-links  { display: none; }
    .cn-sep    { display: none; }
    .cn-report { display: none; }
    .cn-user   { display: none; }
    .cn-logout { display: none; }
    .cn-ham    { display: flex; }
  }
`;

interface CitizenNavbarProps {
  displayName: string;
  initials: string;
  unreadAlerts: number;
  hasDot: boolean;
  menuOpen: boolean;
  setMenuOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
  handleLogout: () => void;
  handleBellClick: () => void;
  location: ReturnType<typeof useLocation>;
}

function CitizenNavbar({
  displayName, initials, unreadAlerts, hasDot,
  menuOpen, setMenuOpen, handleLogout, handleBellClick, location,
}: CitizenNavbarProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (path: string) =>
    location.pathname === path ? "cn-active" : "";

  const isOnDashboard = location.pathname === "/citizen/dashboard";

  const navItems = [
    ...(!isOnDashboard ? [{ to: "/citizen/dashboard", label: "My Dashboard", icon: "📊" }] : []),
    { to: "/citizen/map",        label: "Map",         icon: "🗺" },
    { to: "/citizen/safetytips", label: "Safety Tips", icon: "💡" },
    { to: "/citizen/directory",  label: "Directory",   icon: "🗂" },
    { to: "/citizen/about",      label: "About",       icon: "ℹ️"  },
    { to: "/citizen/report",     label: "File Report", icon: "📝" },
  ];

  const portalContent = createPortal(
    <>
      <div
        className={`cn-overlay ${menuOpen ? "visible" : ""}`}
        onClick={() => setMenuOpen(false)}
      />
      <div className={`cn-drawer ${menuOpen ? "open" : ""}`}>
        <div className="cn-drawer-header">
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: "rgba(46,204,143,0.1)", border: "1px solid rgba(46,204,143,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 12, color: "#2ECC8F" }}>🛡</span>
            </div>
            <span style={{
              fontFamily: "'Cabinet Grotesk', sans-serif",
              fontWeight: 900, fontSize: 15, letterSpacing: "-.02em", color: "#eef0f7",
            }}>
              Duma<span style={{ color: "#2ECC8F" }}>SafeGuide</span>
            </span>
          </div>
          <button className="cn-drawer-close" onClick={() => setMenuOpen(false)}>✕</button>
        </div>

        <div className="cn-drawer-user">
          <div className="cn-drawer-avatar">{initials}</div>
          <div>
            <div className="cn-drawer-uname">{displayName}</div>
            <div className="cn-drawer-urole">Citizen</div>
          </div>
        </div>

        <nav className="cn-drawer-nav">
          {navItems.map(item => (
            <Link
              key={item.to}
              to={item.to}
              className={isActive(item.to)}
              onClick={() => setMenuOpen(false)}
            >
              <span style={{ width: 18, textAlign: "center" }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}

          <div className="cn-div" />

          <Link
            to="/citizen/alerts"
            className={`cn-drawer-bell ${isActive("/citizen/alerts")}`}
            onClick={() => { handleBellClick(); setMenuOpen(false); }}
          >
            <span style={{ width: 18, textAlign: "center" }}>🔔</span>
            Alerts
            {unreadAlerts > 0 && (
              <span className="cn-drawer-bell-count">{unreadAlerts > 9 ? "9+" : unreadAlerts}</span>
            )}
          </Link>
        </nav>

        <div className="cn-drawer-footer">
          <button onClick={handleLogout} className="cn-drawer-logout">Sign Out</button>
        </div>
      </div>
    </>,
    document.body
  );

  return (
    <>
      <style>{CITIZEN_NAV_CSS}</style>
      <nav className={`cn-bar ${scrolled ? "scrolled" : ""}`}>

        {/* Brand */}
        <Link to="/citizen/dashboard" className="cn-brand">
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: "rgba(46,204,143,0.08)", border: "1px solid rgba(46,204,143,0.18)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 5,
          }}>
            <img src={logoImage} alt="DSG" className="cn-brand-logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
          <span className="cn-brand-name">Duma<span>SafeGuide</span></span>
        </Link>

        {/* Desktop links */}
        <ul className="cn-links">
          {navItems.map(item => (
            <li key={item.to}>
              <Link to={item.to} className={isActive(item.to)}>{item.label}</Link>
            </li>
          ))}
        </ul>

        {/* Right cluster */}
        <div className="cn-right">
          {/* Bell */}
          <Link
            to="/citizen/alerts"
            className="cn-bell"
            onClick={handleBellClick}
            title={unreadAlerts > 0 ? `${unreadAlerts} unread alert${unreadAlerts !== 1 ? "s" : ""}` : "Alerts"}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6V11c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
            </svg>
            {unreadAlerts > 0 && (
              <span className="cn-bell-badge">{unreadAlerts > 9 ? "9+" : unreadAlerts}</span>
            )}
          </Link>

          {/* User pill */}
          <div className="cn-user">
            <div className="cn-avatar">{initials}</div>
            <span className="cn-user-name">{displayName}</span>
            <span className="cn-role-chip">Citizen</span>
          </div>

          {/* Logout */}
          <button onClick={handleLogout} className="cn-logout">Logout</button>

          {/* Hamburger */}
          <button
            className={`cn-ham ${menuOpen ? "open" : ""}`}
            onClick={() => setMenuOpen(v => !v)}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {portalContent}
    </>
  );
}