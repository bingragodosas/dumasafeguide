import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../js/supabase";
import { FaShieldAlt } from "react-icons/fa";

const AR_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@700;800&family=Instrument+Sans:wght@400;500&display=swap');

  .ar-checking {
    min-height: 100vh;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Instrument Sans', sans-serif;
    background: #0b0f1a;
  }
  .ar-checking-inner {
    display: flex; flex-direction: column; align-items: center; gap: 16px;
    text-align: center;
  }
  .ar-shield {
    width: 52px; height: 52px; border-radius: 14px;
    background: rgba(46,204,143,.1);
    border: 1px solid rgba(46,204,143,.25);
    display: flex; align-items: center; justify-content: center;
    color: #2ECC8F; font-size: 20px;
    animation: arPulse 1.8s ease infinite;
  }
  @keyframes arPulse {
    0%,100% { box-shadow: 0 0 0 0 rgba(46,204,143,.25); }
    50%      { box-shadow: 0 0 0 10px rgba(46,204,143,.0); }
  }
  .ar-spinner {
    width: 20px; height: 20px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,.1);
    border-top-color: #2ECC8F;
    animation: arSpin .7s linear infinite;
  }
  @keyframes arSpin { to { transform: rotate(360deg); } }
  .ar-checking-label {
    font-size: 13px; font-weight: 500; color: rgba(237,240,250,.35);
  }
`;

type AuthState = "checking" | "authorized" | "unauthorized";

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>("checking");

  useEffect(() => {
    const checkRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setAuthState("unauthorized"); return; }

      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      setAuthState(data?.role === "admin" ? "authorized" : "unauthorized");
    };
    checkRole();
  }, []);

  if (authState === "checking") {
    return (
      <>
        <style>{AR_STYLE}</style>
        <div className="ar-checking">
          <div className="ar-checking-inner">
            <div className="ar-shield">
              <FaShieldAlt />
            </div>
            <div className="ar-spinner" />
            <div className="ar-checking-label">Verifying admin access…</div>
          </div>
        </div>
      </>
    );
  }

  if (authState === "unauthorized") {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}