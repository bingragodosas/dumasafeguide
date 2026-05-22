import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { supabase } from "../js/supabase";

const ROLE_HOME: Record<string, string> = {
  citizen:   "/citizen/dashboard",
  responder: "/responder/dashboard",
  admin:     "/admin/dashboard",
};

interface Props {
  allowedRole: "citizen" | "responder" | "admin";
}

type AuthState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "wrong_role"; actualRole: string }
  | { status: "authorized" };

export default function ProtectedRoute({ allowedRole }: Props) {
  const [authState, setAuthState] = useState<AuthState>({ status: "loading" });
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;

    // ✅ FIX: Use onAuthStateChange instead of one-shot getUser()
    // This waits for Supabase to fully persist the session before checking,
    // preventing the race condition where navigate() fires before the session
    // is committed to storage.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (cancelled) return;

      if (!session?.user) {
        setAuthState({ status: "unauthenticated" });
        return;
      }

      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (cancelled) return;

      if (profileErr || !profile?.role) {
        console.error("[ProtectedRoute] profile fetch failed:", profileErr);
        setAuthState({ status: "unauthenticated" });
        return;
      }

      const role = (profile.role as string).trim().toLowerCase();

      if (role === allowedRole) {
        setAuthState({ status: "authorized" });
      } else {
        setAuthState({ status: "wrong_role", actualRole: role });
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [allowedRole]);

  if (authState.status === "loading") {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", background: "#080c14", gap: 10,
        fontFamily: "sans-serif", color: "rgba(237,240,250,.35)", fontSize: 13,
      }}>
        <span style={{
          width: 16, height: 16, borderRadius: "50%",
          border: "2px solid rgba(46,204,143,.2)", borderTopColor: "#2ECC8F",
          display: "inline-block", animation: "pr-spin .7s linear infinite",
        }} />
        Verifying access…
        <style>{`@keyframes pr-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (authState.status === "unauthenticated") {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (authState.status === "wrong_role") {
    const home = ROLE_HOME[authState.actualRole] ?? "/login";
    return <Navigate to={home} replace />;
  }

  return <Outlet />;
}