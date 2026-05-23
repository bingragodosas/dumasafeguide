import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../js/supabase";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import logoImage from "../assets/dsg.logo.png";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@500;700;800;900&family=Instrument+Sans:wght@400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .lg-root {
    min-height: 100vh;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    font-family: 'Instrument Sans', sans-serif;
    padding: 24px 24px 0;
    background: #080c14 url('/src/assets/loginbg.png') center/cover no-repeat fixed;
    position: relative;
    overflow: hidden;
  }

  .lg-glow {
    position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden;
  }
  .lg-glow-a {
    position: absolute; width: 700px; height: 700px; border-radius: 50%;
    background: radial-gradient(circle, rgba(46,204,143,.07) 0%, transparent 65%);
    top: -260px; left: -160px;
  }
  .lg-glow-b {
    position: absolute; width: 600px; height: 600px; border-radius: 50%;
    background: radial-gradient(circle, rgba(123,158,255,.05) 0%, transparent 65%);
    bottom: -200px; right: -120px;
  }

  .lg-content {
    flex: 1;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    width: 100%; padding: 40px 0;
    position: relative; z-index: 1;
  }

  .lg-back-home {
    display: inline-flex; align-items: center; gap: 8px;
    margin-bottom: 20px;
    padding: 8px 18px 8px 14px;
    font-family: 'Instrument Sans', sans-serif;
    font-size: 12px; font-weight: 600; letter-spacing: .04em;
    color: rgba(238,240,247,.55);
    text-decoration: none;
    background: rgba(255,255,255,.055);
    border: 1px solid rgba(255,255,255,.1);
    border-radius: 999px;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    transition: color .22s, background .22s, border-color .22s, box-shadow .22s, transform .18s;
    position: relative; z-index: 1;
  }
  .lg-back-home:hover {
    color: #2ECC8F;
    background: rgba(46,204,143,.08);
    border-color: rgba(46,204,143,.3);
    box-shadow: 0 0 18px rgba(46,204,143,.12);
    transform: translateY(-1px);
  }
  .lg-back-home .bh-arrow {
    display: flex; align-items: center; justify-content: center;
    width: 20px; height: 20px; border-radius: 50%;
    background: rgba(255,255,255,.07);
    border: 1px solid rgba(255,255,255,.1);
    transition: background .22s, border-color .22s, transform .22s;
    flex-shrink: 0;
  }
  .lg-back-home:hover .bh-arrow {
    background: rgba(46,204,143,.15);
    border-color: rgba(46,204,143,.35);
    transform: translateX(-2px);
  }

  .lg-card {
    position: relative; z-index: 1;
    background: rgba(15,21,33,.82);
    border: 1px solid rgba(255,255,255,.08);
    border-radius: 24px;
    padding: 44px 40px 40px;
    width: 100%; max-width: 440px;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    animation: lg-rise .55s cubic-bezier(.22,1,.36,1) both;
  }
  @keyframes lg-rise {
    from { opacity: 0; transform: translateY(24px) scale(.98); }
    to   { opacity: 1; transform: translateY(0)   scale(1);    }
  }

  .lg-card::before {
    content: '';
    position: absolute; top: 0; left: 40px; right: 40px; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(46,204,143,.45), transparent);
    border-radius: 1px;
  }

  .lg-brand {
    display: flex; flex-direction: column; align-items: center;
    gap: 14px; margin-bottom: 32px; text-align: center;
  }
  .lg-logo-ring {
    width: 72px; height: 72px; border-radius: 18px;
    background: rgba(46,204,143,.06);
    border: 1px solid rgba(46,204,143,.18);
    display: flex; align-items: center; justify-content: center;
    padding: 10px;
  }
  .lg-logo-ring img { width: 100%; height: 100%; object-fit: contain; }
  .lg-brand-name {
    font-family: 'Cabinet Grotesk', sans-serif;
    font-size: 22px; font-weight: 900;
    letter-spacing: -.03em; color: #eef0f7;
  }
  .lg-brand-name span { color: #2ECC8F; }
  .lg-brand-sub {
    font-size: 12.5px; color: rgba(238,240,247,.32);
    line-height: 1.5; max-width: 260px;
  }

  .lg-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,.07), transparent);
    margin-bottom: 28px;
  }

  .lg-error {
    display: flex; align-items: flex-start; gap: 10px;
    background: rgba(255,107,107,.07);
    border: 1px solid rgba(255,107,107,.2);
    border-radius: 10px; padding: 11px 14px;
    font-size: 12.5px; color: #FF6B6B;
    margin-bottom: 20px;
    animation: lg-shake .35s ease;
  }
  @keyframes lg-shake {
    0%,100% { transform: translateX(0); }
    20%     { transform: translateX(-5px); }
    40%     { transform: translateX(5px); }
    60%     { transform: translateX(-3px); }
    80%     { transform: translateX(3px); }
  }
  .lg-error-icon { flex-shrink: 0; margin-top: 1px; }

  .lg-field { margin-bottom: 18px; }
  .lg-label {
    display: block;
    font-size: 10px; font-weight: 700; letter-spacing: .13em;
    text-transform: uppercase; color: rgba(238,240,247,.28);
    margin-bottom: 8px;
  }
  .lg-input-wrap { position: relative; }
  .lg-input {
    width: 100%;
    background: rgba(255,255,255,.04);
    border: 1px solid rgba(255,255,255,.08);
    border-radius: 11px;
    padding: 12px 14px;
    font-family: 'Instrument Sans', sans-serif;
    font-size: 14px; color: #eef0f7; outline: none;
    transition: border-color .2s, background .2s, box-shadow .2s;
  }
  .lg-input::placeholder { color: rgba(238,240,247,.18); }
  .lg-input:focus {
    border-color: rgba(46,204,143,.38);
    background: rgba(46,204,143,.03);
    box-shadow: 0 0 0 3px rgba(46,204,143,.06);
  }
  .lg-input.lg-has-pw { padding-right: 44px; }
  .lg-eye {
    position: absolute; right: 13px; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer;
    color: rgba(143,149,172,.25); padding: 0;
    display: flex; align-items: center;
    transition: color .2s;
  }
  .lg-eye:hover { color: rgba(238,240,247,.6); }

  .lg-row {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 26px;
  }
  .lg-remember {
    display: flex; align-items: center; gap: 8px;
    font-size: 12.5px; color: rgba(238,240,247,.35); cursor: pointer;
    user-select: none;
  }
  .lg-remember input[type="checkbox"] { accent-color: #fff9f3; cursor: pointer; }
  .lg-forgot {
    font-size: 12.5px; font-weight: 500;
    color: #8ed9df; text-decoration: none;
    transition: opacity .18s;
  }
  .lg-forgot:hover { opacity: .7; }

  .lg-btn {
    width: 100%; padding: 13px 20px;
    font-family: 'Cabinet Grotesk', sans-serif;
    font-size: 13px; font-weight: 800; letter-spacing: .1em;
    text-transform: uppercase; border-radius: 11px; border: none;
    background: linear-gradient(135deg, #87849b, #355c8f);
    color: #060a10;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: transform .18s, box-shadow .18s, background .18s;
    margin-bottom: 22px;
    position: relative; overflow: hidden;
  }
  .lg-btn::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(26,51,19,0.1), transparent);
    opacity: 0; transition: opacity .2s;
  }
  .lg-btn:hover:not(:disabled)::after { opacity: 1; }
  .lg-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 28px rgba(46,204,143,.28);
  }
  .lg-btn:active:not(:disabled) { transform: translateY(0); }
  .lg-btn:disabled { opacity: .45; cursor: not-allowed; }

  .lg-spin {
    width: 14px; height: 14px; border-radius: 50%;
    border: 2px solid rgba(6,10,16,.25);
    border-top-color: #060a10;
    animation: lg-rotate .65s linear infinite;
    flex-shrink: 0;
  }
  @keyframes lg-rotate { to { transform: rotate(360deg); } }

  .lg-footer {
    text-align: center;
    font-size: 12.5px; color: rgba(74,83,117,.28);
  }
  .lg-footer a {
    color: #2ECC8F; text-decoration: none; font-weight: 500;
    transition: opacity .18s;
  }
  .lg-footer a:hover { opacity: .7; }

  .lg-success {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 14px; padding: 20px 0;
    animation: lg-rise .4s ease both;
  }
  .lg-success-ring {
    width: 56px; height: 56px; border-radius: 50%;
    background: rgba(46,204,143,.1);
    border: 1px solid rgba(46,204,143,.3);
    display: flex; align-items: center; justify-content: center;
    font-size: 22px; color: #2ECC8F;
  }
  .lg-success-text {
    font-family: 'Cabinet Grotesk', sans-serif;
    font-size: 16px; font-weight: 800; color: #eef0f7;
  }
  .lg-success-sub { font-size: 12.5px; color: rgba(238,240,247,.3); }

  /* Checking session state — hides the form flash */
  .lg-checking {
    display: flex; align-items: center; justify-content: center;
    gap: 10px; padding: 60px 0;
    font-size: 13px; color: rgba(238,240,247,.28);
  }
  .lg-check-spin {
    width: 16px; height: 16px; border-radius: 50%;
    border: 2px solid rgba(46,204,143,.2);
    border-top-color: #2ECC8F;
    animation: lg-rotate .7s linear infinite;
    flex-shrink: 0;
  }
`;

const ROLE_REDIRECT: Record<string, string> = {
  admin:     "/admin/dashboard",
  responder: "/responder/dashboard",
  citizen:   "/citizen/dashboard",
};

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [remember, setRemember]   = useState(false);
  const [showPw, setShowPw]       = useState(false);
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState(false);
  const [error, setError]         = useState("");
  // ── NEW: prevents form flash while checking existing session ──
  const [checking, setChecking]   = useState(true);

  useEffect(() => {
    // Use onAuthStateChange so we wait for Supabase to fully
    // restore the session from storage before deciding what to show
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!session?.user) {
          // No session — show the login form
          setChecking(false);
          return;
        }
        // Session exists — fetch role and redirect silently
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();
        const role = profile?.role?.trim().toLowerCase() ?? "";
        navigate(ROLE_REDIRECT[role] ?? "/citizen/dashboard", { replace: true });
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({ email: email.trim(), password });

    if (authError || !authData?.user) {
      setError(authError?.message || "Login failed. Please check your credentials.");
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .single();

    if (profileError || !profile?.role) {
      // Profile may not be ready yet — retry once after a short delay
      await new Promise(res => setTimeout(res, 1500));
      const { data: retryProfile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authData.user.id)
        .single();
      if (!retryProfile?.role) {
        setError("Profile not ready yet. Please wait a moment and try again.");
        setLoading(false);
        return;
      }
      const role = retryProfile.role.trim().toLowerCase();
      setSuccess(true);
      setLoading(false);
      setTimeout(() => navigate(ROLE_REDIRECT[role] ?? "/citizen/dashboard", { replace: true }), 900);
      return;
    }

    const role = profile.role.trim().toLowerCase();
    setSuccess(true);
    setLoading(false);
    setTimeout(() => navigate(ROLE_REDIRECT[role] ?? "/citizen/dashboard", { replace: true }), 900);
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="lg-root">

        <div className="lg-glow">
          <div className="lg-glow-a" />
          <div className="lg-glow-b" />
        </div>

        <div className="lg-content">

          <Link to="/" className="lg-back-home">
            <span className="bh-arrow">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
            </span>
            Back to Home
          </Link>

          <div className="lg-card">

            {/* While checking session — show spinner, not the form */}
            {checking ? (
              <div className="lg-checking">
                <span className="lg-check-spin" />
                Checking session…
              </div>
            ) : success ? (
              <div className="lg-success">
                <div className="lg-success-ring">✓</div>
                <div className="lg-success-text">Signed in!</div>
                <div className="lg-success-sub">Redirecting you now…</div>
              </div>
            ) : (
              <>
                <div className="lg-brand">
                  <div className="lg-logo-ring">
                    <img src={logoImage} alt="DumaSafeGuide" />
                  </div>
                  <div>
                    <div className="lg-brand-name">Duma<span>SafeGuide</span></div>
                    <p className="lg-brand-sub">
                      Emergency response portal — sign in to continue.
                    </p>
                  </div>
                </div>

                <div className="lg-divider" />

                {error && (
                  <div className="lg-error" key={error}>
                    <span className="lg-error-icon">⚠</span>
                    <span>{error}</span>
                  </div>
                )}

                <div className="lg-field">
                  <label className="lg-label">Email Address</label>
                  <div className="lg-input-wrap">
                    <input
                      className="lg-input"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleLogin()}
                      autoComplete="email"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="lg-field">
                  <label className="lg-label">Password</label>
                  <div className="lg-input-wrap">
                    <input
                      className="lg-input lg-has-pw"
                      type={showPw ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleLogin()}
                      autoComplete="current-password"
                    />
                    <button
                      className="lg-eye"
                      onClick={() => setShowPw(v => !v)}
                      tabIndex={-1}
                      type="button"
                    >
                      {showPw ? <FaEyeSlash size={15} /> : <FaEye size={15} />}
                    </button>
                  </div>
                </div>

                <div className="lg-row">
                  <label className="lg-remember">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={e => setRemember(e.target.checked)}
                    />
                    Remember me
                  </label>
                  <Link to="/forgot-password" className="lg-forgot">
                    Forgot password?
                  </Link>
                </div>

                <button
                  className="lg-btn"
                  onClick={handleLogin}
                  disabled={loading}
                  type="button"
                >
                  {loading && <span className="lg-spin" />}
                  {loading ? "Signing in…" : "Sign In"}
                </button>

                <div className="lg-footer">
                  No account yet?{" "}
                  <Link to="/signup">Create one</Link>
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </>
  );
}