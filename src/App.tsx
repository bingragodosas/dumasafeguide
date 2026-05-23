// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Layout        from './pages/Layout';

// ── Public Pages ───────────────────────────────────────────────
import Homepage           from './pages/Homepage';
import Login              from './pages/Login';
import Signup             from './pages/Signup';
import ForgotPassword     from './pages/Forgotpassword';
import Directory          from './pages/Directory';
import Map                from './pages/Map';
import Report             from './pages/Report';
import IncidentAlerts     from './pages/Incidentalerts';
import AboutDumaSafeGuide from './pages/AboutDumaSafeGuide';
import PartnerAgencies    from './pages/PartnerAgencies';
import PrivacyPolicy      from './pages/PrivacyPolicy';
import Resources          from './pages/Resources';
import SafetyTips         from './pages/SafetyTips';
import TermsOfService     from './pages/TermsOfService';
import TermsOfUse         from './pages/TermsOfUse';

// ── Admin ──────────────────────────────────────────────────────
import AdminDashboard from './admin/AdminDashboard';

// ── Citizen ────────────────────────────────────────────────────
import CitizenDashboard    from './citizen/CitizenDashboard';
import CitizenAlertsPage   from './citizen/CitizenAlertsPage';
import CitizenHistory      from './citizen/CitizenHistory';
import CitizenReportDetail from './citizen/CitizenReportDetail';

// ── Responder ──────────────────────────────────────────────────
import RespondersDashboard from './responder/Respondersdashboard';
import ResponderAlertsPage from './responder/Responderalertspage';
import RespondersPage      from './responder/Responderspage';
import Dispatch            from './responder/Dispatch';
import ResponderIncidents  from './responder/IncidentsPage';

export default function App() {
  return (
    <BrowserRouter
      basename="/dumasafeguide"
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>

        {/* ── PUBLIC — Global Navbar + Footer ──────────────── */}
        <Route element={<Layout />}>
          <Route path="/privacy"          element={<PrivacyPolicy />} />
          <Route path="/terms"            element={<TermsOfService />} />
          <Route path="/"                 element={<Homepage />} />
          <Route path="/directory"        element={<Directory />} />
          <Route path="/report"           element={<Report />} />
          <Route path="/incident-alerts"  element={<IncidentAlerts />} />
          <Route path="/about"            element={<AboutDumaSafeGuide />} />
          <Route path="/partner-agencies" element={<PartnerAgencies />} />
          <Route path="/resources"        element={<Resources />} />
          <Route path="/safetytips"       element={<SafetyTips />} />
          <Route path="/terms-of-use"     element={<TermsOfUse />} />
          <Route path="/map"              element={<Map />} />
        </Route>

        {/* ── STANDALONE — own full-page layout, no global navbar ── */}
        <Route path="/login"            element={<Login />} />
        <Route path="/signup"           element={<Signup />} />
        <Route path="/forgot-password"  element={<ForgotPassword />} />

        {/* ── ADMIN portal ─────────────────────────────────── */}
        <Route element={<ProtectedRoute allowedRole="admin" />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Route>

        {/* ── CITIZEN portal ───────────────────────────────── */}
        <Route element={<ProtectedRoute allowedRole="citizen" />}>
          <Route element={<Layout />}>
            <Route path="/citizen/dashboard"   element={<CitizenDashboard />} />
            <Route path="/citizen/alerts"      element={<CitizenAlertsPage />} />
            <Route path="/citizen/history"     element={<CitizenHistory />} />
            <Route path="/citizen/history/:id" element={<CitizenReportDetail />} />
          </Route>
        </Route>

        {/* ── RESPONDER portal ─────────────────────────────── */}
        <Route element={<ProtectedRoute allowedRole="responder" />}>
          <Route element={<Layout />}>
            <Route path="/responder/dashboard"  element={<RespondersDashboard />} />
            <Route path="/responder/alerts"     element={<ResponderAlertsPage />} />
            <Route path="/responder/responders" element={<RespondersPage />} />
            <Route path="/responder/dispatch"   element={<Dispatch />} />
            <Route path="/responder/incidents"  element={<ResponderIncidents />} />
          </Route>
        </Route>

      </Routes>
    </BrowserRouter>
  );
}