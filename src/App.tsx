import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Link } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import PublicLayout   from './components/Publiclayout';
import { supabase }   from './js/supabase';

// ── Direct (eager) imports — no lazy loading ─────────────────────────────────
// Every page is bundled up front so in-app navigation renders instantly with
// no chunk fetch, no Suspense flash, and no stale-chunk recovery reloads.
import About from "./pages/About";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/TermsOfUse";

// ── Public pages ──────────────────────────────────────────────────────────────
import Homepage from './pages/Homepage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Directory from './pages/Directory';
import Map from './pages/Map';
import IncidentAlerts from './pages/IncidentaAlerts';
import SafetyTips from './pages/SafetyTips';
import Resources from './pages/Resources';
import PartnerAgencies from './pages/PartnerAgencies';

// ── Admin ─────────────────────────────────────────────────────────────────────
import AdminDashboard from './admin/AdminDashboard';

// ── Responder ─────────────────────────────────────────────────────────────────
import Dispatch from './responder/Dispatch';
import IncidentsPage from './responder/IncidentsPage';
import ResponderAlertsPage from './responder/ResponderAlertsPage';
import RespondersDashboard from './responder/Respondersdashboard';
import ResponderTeam from './responder/ResponderTeam';

// ── Chat ────────────────────────────────────────────────────────────────
import ChatPage from './components/ChatPage';

// ── Citizen ───────────────────────────────────────────────────────────────────
import CitizenLayout from './citizen/CitizenLayout';
import CitizenDashboard from './citizen/CitizenDashboard';
import CitizenHistoryPage from './citizen/CitizenHistoryPage';
import CitizenAlertsPage from './citizen/CitizenAlertsPage';
import CitizenMap from './citizen/CitizenMap';
import CitizenSafetyTips from './citizen/CitizenSafetyTips';
import CitizenReportPage from "./citizen/CitizenReportPage";
import Report from "./pages/Report";
import CitizenDirectory from './citizen/CitizenDirectory';
import CitizenResources from './citizen/CitizenResources';
import CitizenAbout from './citizen/CitizenAbout';
import CitizenChatPage from './citizen/components/CitizenChatPage';

function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080c14', color: '#eef0f7', padding: 24, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 480, textAlign: 'center', background: 'rgba(15,21,33,0.9)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 32 }}>
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Page not found</div>
        <div style={{ fontSize: 13, color: 'rgba(238,240,247,0.65)', marginBottom: 20 }}>The link you followed does not exist. It may have moved after an update.</div>
        <Link to="/" style={{ display: 'inline-block', background: 'rgba(46,204,143,0.16)', border: '1px solid rgba(46,204,143,0.35)', color: '#2ECC8F', borderRadius: 8, padding: '10px 18px', fontWeight: 700, textDecoration: 'none' }}>
          Back to Home
        </Link>
      </div>
    </div>
  );
}

const Loader = () => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100vh', backgroundColor: '#080c14', color: '#eef0f7',
  }}>
    Loading...
  </div>
);

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null; componentStack: string | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, componentStack: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log the real stack trace + which component crashed so the culprit is
    // visible in DevTools instead of just "Something went wrong".
    console.error('[ErrorBoundary] message:', error?.message);
    console.error('[ErrorBoundary] stack:', (error as Error)?.stack);
    console.error('[ErrorBoundary] componentStack:', info?.componentStack);
    console.error('[ErrorBoundary] error object:', error, info);
    this.setState({ componentStack: info?.componentStack ?? null });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080c14', color: '#eef0f7', padding: 24, fontFamily: 'Inter, sans-serif' }}>
          <div style={{ maxWidth: 560, width: '100%', background: 'rgba(15,21,33,0.9)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Something went wrong</div>
            <div style={{ fontSize: 13, color: 'rgba(238,240,247,0.65)', marginBottom: 12, wordBreak: 'break-word' }}>
              {this.state.error?.message ?? 'Unknown error'}
            </div>
            {this.state.error?.stack && (
              <details style={{ textAlign: 'left', marginBottom: 12 }}>
                <summary style={{ cursor: 'pointer', fontSize: 12, opacity: 0.7 }}>Stack trace</summary>
                <pre style={{ fontSize: 11, whiteSpace: 'pre-wrap', wordBreak: 'break-word', opacity: 0.7, maxHeight: 200, overflow: 'auto' }}>
                  {this.state.error.stack}
                  {this.state.componentStack ?? ''}
                </pre>
              </details>
            )}
            <button onClick={() => window.location.reload()} style={{ background: 'rgba(46,204,143,0.16)', border: '1px solid rgba(46,204,143,0.35)', color: '#2ECC8F', borderRadius: 8, padding: '10px 18px', fontWeight: 700, cursor: 'pointer' }}>
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser]       = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error && /Invalid Refresh Token|Refresh Token Not Found/i.test(error.message ?? '')) {
          try { await supabase.auth.signOut(); } catch {}
          try {
            Object.keys(localStorage).forEach(k => {
              if (k.startsWith('sb-') && k.includes('-auth-token')) localStorage.removeItem(k);
            });
          } catch {}
          if (!cancelled) {
            setUser(null);
            setLoading(false);
            // Force redirect to login if on protected route
            if (window.location.hash.includes('/citizen/') || window.location.hash.includes('/responder/') || window.location.hash.includes('/admin/')) {
              window.location.hash = '#/login';
            }
            return;
          }
        }
        if (!cancelled) {
          setUser(session?.user ?? null);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
          setLoading(false);
        }
      }
    };
    init();
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => { cancelled = true; authListener?.subscription?.unsubscribe(); };
  }, []);

  if (loading) return <Loader />;

  return (
    <HashRouter>
      <ErrorBoundary>
        <Routes>

          {/* ── Public pages — all get Navbar + Footer via PublicLayout ──── */}
          <Route path="/" element={
            <PublicLayout isHomepage>
              <Homepage />
            </PublicLayout>
          } />

          <Route path="/login" element={
            <PublicLayout>
              <Login />
            </PublicLayout>
          } />

          <Route path="/signup" element={
            <PublicLayout>
              <Signup />
            </PublicLayout>
          } />

          <Route path="/forgot-password" element={
            <PublicLayout>
              <ForgotPassword />
            </PublicLayout>
          } />

          <Route path="/directory" element={
            <PublicLayout>
              <Directory />
            </PublicLayout>
          } />

          <Route path="/map" element={
            <PublicLayout>
              <Map />
            </PublicLayout>
          } />

          <Route path="/safetytips" element={
            <PublicLayout>
              <SafetyTips />
            </PublicLayout>
          } />

          <Route path="/resources" element={
            <PublicLayout>
              <Resources />
            </PublicLayout>
          } />

          <Route path="/partner-agencies" element={
            <PublicLayout>
              <PartnerAgencies />
            </PublicLayout>
          } />

          <Route path="/incident-alerts" element={
            <PublicLayout>
              <IncidentAlerts />
            </PublicLayout>
          } />

          {/* ── Admin — NO PublicLayout, has its own full-screen shell ──── */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />

          {/* ── Citizen — persistent CitizenLayout sidebar + <Outlet/> children ───── */}
          <Route element={<ProtectedRoute allowedRole="citizen"><CitizenLayout /></ProtectedRoute>}>
            <Route path="/citizen/dashboard"   element={<CitizenDashboard />} />
            <Route path="/citizen/history"     element={<CitizenHistoryPage />} />
            <Route path="/citizen/history/:id" element={<CitizenHistoryPage />} />
            <Route path="/citizen/alerts"      element={<CitizenAlertsPage />} />
            <Route path="/citizen/map"         element={<CitizenMap />} />
            <Route path="/citizen/safetytips"  element={<CitizenSafetyTips />} />
            <Route path="/citizen/report"      element={<CitizenReportPage />} />
            <Route path="/citizen/directory"   element={<CitizenDirectory />} />
            <Route path="/citizen/resources"   element={<CitizenResources />} />
            <Route path="/citizen/about"       element={<CitizenAbout />} />
            <Route path="/citizen/chat"      element={<CitizenChatPage />} />
          </Route>

          {/* ── Universal Chat ── */}
          <Route path="/chat" element={<ProtectedRoute allowedRole="citizen,responder,admin"><ChatPage /></ProtectedRoute>} />

          {/* ── Responder — NO PublicLayout, has its own dashboard shell ── */}
          <Route path="/responder/dashboard" element={<ProtectedRoute allowedRole="responder"><RespondersDashboard /></ProtectedRoute>} />
          <Route path="/responder/dispatch"  element={<ProtectedRoute allowedRole="responder"><Dispatch /></ProtectedRoute>} />
          <Route path="/responder/incidents" element={<ProtectedRoute allowedRole="responder"><IncidentsPage /></ProtectedRoute>} />
          <Route path="/responder/alerts"    element={<ProtectedRoute allowedRole="responder"><ResponderAlertsPage /></ProtectedRoute>} />
          <Route path="/responder/team"      element={<ProtectedRoute allowedRole="responder"><ResponderTeam /></ProtectedRoute>} />

          {/* ── Convenience redirects ─────────────────────────────────────── */}
              <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />
              <Route path="/privacy" element={<PublicLayout><PrivacyPolicy /></PublicLayout>} />
              <Route path="/terms" element={<PublicLayout><Terms /></PublicLayout>} />
              <Route path="/report" element={<PublicLayout><Report /></PublicLayout>} />
          {/* ── Catch-all — explicit 404 so bad URLs are visible ── */}
          <Route path="*" element={<NotFound />} />

        </Routes>
      </ErrorBoundary>
    </HashRouter>
  );
}