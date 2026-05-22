import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../js/supabase";
import { FaEnvelope, FaEye, FaEyeSlash, FaArrowLeft, FaCheckCircle } from "react-icons/fa";
import logoImage from "../assets/dsg.logo.png";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@500;700;800;900&family=Instrument+Sans:wght@400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .fp-root {
    min-height: 100vh;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Instrument Sans', sans-serif;
    padding: 24px;
    background: #080c14 url('/src/assets/loginbg.png') center/cover no-repeat fixed;
    position: relative; overflow: hidden;
  }
  .fp-glow { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
  .fp-glow-a {
    position: absolute; width: 700px; height: 700px; border-radius: 50%;
    background: radial-gradient(circle, rgba(46,204,143,.07) 0%, transparent 65%);
    top: -260px; left: -160px;
  }
  .fp-glow-b {
    position: absolute; width: 600px; height: 600px; border-radius: 50%;
    background: radial-gradient(circle, rgba(123,158,255,.05) 0%, transparent 65%);
    bottom: -200px; right: -120px;
  }
  .fp-card {
    position: relative; z-index: 1;
    background: rgba(15,21,33,.82);
    border: 1px solid rgba(255,255,255,.08);
    border-radius: 24px;
    padding: 44px 40px 40px;
    width: 100%; max-width: 460px;
    backdrop-filter: blur(20px);
    animation: fp-rise .55s cubic-bezier(.22,1,.36,1) both;
  }
  @keyframes fp-rise {
    from { opacity: 0; transform: translateY(24px) scale(.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  .fp-card::before {
    content: '';
    position: absolute; top: 0; left: 40px; right: 40px; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(46,204,143,.45), transparent);
  }
  .fp-brand {
    display: flex; flex-direction: column; align-items: center;
    gap: 14px; margin-bottom: 32px; text-align: center;
  }
  .fp-logo-ring {
    width: 72px; height: 72px; border-radius: 18px;
    background: rgba(46,204,143,.06); border: 1px solid rgba(46,204,143,.18);
    display: flex; align-items: center; justify-content: center; padding: 10px;
  }
  .fp-logo-ring img { width: 100%; height: 100%; object-fit: contain; }
  .fp-brand-name {
    font-family: 'Cabinet Grotesk', sans-serif;
    font-size: 22px; font-weight: 900; letter-spacing: -.03em; color: #eef0f7;
  }
  .fp-brand-name span { color: #2ECC8F; }
  .fp-brand-sub { font-size: 12.5px; color: rgba(238,240,247,.32); line-height: 1.5; max-width: 280px; }
  .fp-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,.07), transparent);
    margin-bottom: 28px;
  }
  .fp-error {
    display: flex; align-items: flex-start; gap: 10px;
    background: rgba(255,107,107,.07); border: 1px solid rgba(255,107,107,.2);
    border-radius: 10px; padding: 11px 14px;
    font-size: 12.5px; color: #FF6B6B; margin-bottom: 20px;
    animation: fp-shake .35s ease;
  }
  @keyframes fp-shake {
    0%,100% { transform: translateX(0); }
    20% { transform: translateX(-5px); }
    40% { transform: translateX(5px); }
    60% { transform: translateX(-3px); }
    80% { transform: translateX(3px); }
  }
  .fp-step-indicator {
    display: flex; align-items: center; justify-content: center;
    gap: 8px; margin-bottom: 28px;
  }
  .fp-step {
    display: flex; align-items: center; justify-content: center;
    width: 28px; height: 28px; border-radius: 50%;
    font-size: 11px; font-weight: 700; transition: all .3s;
  }
  .fp-step.active { background: #2ECC8F; color: #080c14; }
  .fp-step.done { background: rgba(46,204,143,.2); color: #2ECC8F; border: 1px solid rgba(46,204,143,.3); }
  .fp-step.inactive { background: rgba(255,255,255,.06); color: rgba(238,240,247,.3); }
  .fp-step-line { width: 40px; height: 1px; background: rgba(255,255,255,.08); }
  .fp-field { margin-bottom: 18px; }
  .fp-label {
    display: block; font-size: 10px; font-weight: 700; letter-spacing: .13em;
    text-transform: uppercase; color: rgba(238,240,247,.28); margin-bottom: 8px;
  }
  .fp-input-wrap { position: relative; }
  .fp-input-icon {
    position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
    color: rgba(238,240,247,.2); pointer-events: none;
  }
  .fp-input {
    width: 100%;
    background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08);
    border-radius: 11px; padding: 12px 14px 12px 40px;
    font-family: 'Instrument Sans', sans-serif;
    font-size: 14px; color: #eef0f7; outline: none;
    transition: border-color .2s, background .2s, box-shadow .2s;
  }
  .fp-input.no-icon { padding-left: 14px; }
  .fp-input::placeholder { color: rgba(238,240,247,.18); }
  .fp-input:focus {
    border-color: rgba(46,204,143,.38); background: rgba(46,204,143,.03);
    box-shadow: 0 0 0 3px rgba(46,204,143,.06);
  }
  .fp-eye {
    position: absolute; right: 13px; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer;
    color: rgba(143,149,172,.25); padding: 0;
    display: flex; align-items: center; transition: color .2s;
  }
  .fp-eye:hover { color: rgba(238,240,247,.6); }
  .fp-strength-wrap { margin-top: 8px; margin-bottom: 6px; }
  .fp-strength-track {
    height: 4px; border-radius: 2px;
    background: rgba(255,255,255,.06); overflow: hidden; margin-bottom: 5px;
  }
  .fp-strength-fill { height: 100%; border-radius: 2px; transition: width .3s ease, background .3s ease; }
  .fp-strength-label { font-size: 10.5px; color: rgba(238,240,247,.3); }
  .fp-btn {
    width: 100%; padding: 13px 20px;
    font-family: 'Cabinet Grotesk', sans-serif;
    font-size: 13px; font-weight: 800; letter-spacing: .1em;
    text-transform: uppercase; border-radius: 11px; border: none;
    background: linear-gradient(135deg, #87849b, #355c8f);
    color: #060a10; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: transform .18s, box-shadow .18s;
    margin-bottom: 20px;
  }
  .fp-btn:hover:not(:disabled) {
    transform: translateY(-2px); box-shadow: 0 10px 28px rgba(46,204,143,.28);
  }
  .fp-btn:disabled { opacity: .45; cursor: not-allowed; }
  .fp-spin {
    width: 14px; height: 14px; border-radius: 50%;
    border: 2px solid rgba(6,10,16,.25); border-top-color: #060a10;
    animation: fp-rotate .65s linear infinite; flex-shrink: 0;
  }
  @keyframes fp-rotate { to { transform: rotate(360deg); } }
  .fp-back {
    display: flex; align-items: center; justify-content: center; gap: 7px;
    font-size: 13px; color: rgba(238,240,247,.3); text-decoration: none;
    transition: color .2s; background: none; border: none; cursor: pointer; width: 100%;
  }
  .fp-back:hover { color: #2ECC8F; }
  .fp-success {
    display: flex; flex-direction: column; align-items: center;
    text-align: center; padding: 8px 0;
    animation: fp-rise .5s cubic-bezier(.22,1,.36,1) both;
  }
  .fp-success-icon {
    width: 80px; height: 80px; border-radius: 50%;
    background: rgba(46,204,143,.1); border: 2px solid rgba(46,204,143,.35);
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 22px;
    animation: fp-pop .5s .1s cubic-bezier(.22,1,.36,1) both;
  }
  @keyframes fp-pop {
    from { transform: scale(.6); opacity: 0; }
    to   { transform: scale(1); opacity: 1; }
  }
  .fp-success-title {
    font-family: 'Cabinet Grotesk', sans-serif;
    font-size: 22px; font-weight: 800; color: #eef0f7; margin-bottom: 10px;
  }
  .fp-success-msg {
    font-size: 13.5px; color: rgba(237,240,250,.5);
    line-height: 1.65; margin-bottom: 28px; max-width: 300px;
  }
  .fp-success-msg strong { color: #2ECC8F; }
  .fp-success-divider {
    width: 100%; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,.08), transparent);
    margin-bottom: 24px;
  }
  .fp-success-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    width: 100%; padding: 14px;
    font-family: 'Cabinet Grotesk', sans-serif;
    font-size: 13px; font-weight: 800; letter-spacing: .08em;
    text-transform: uppercase; border-radius: 10px; border: none;
    background: #2ECC8F; color: #080c14;
    cursor: pointer; text-decoration: none;
    transition: all .18s; box-sizing: border-box;
  }
  .fp-success-btn:hover {
    background: #35e09a; transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(46,204,143,.3);
  }
  .fp-otp-row {
    display: flex; gap: 6px; justify-content: center; margin-bottom: 8px;
  }
  .fp-otp-input {
    width: 36px; height: 52px; text-align: center;
    background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08);
    border-radius: 10px; font-size: 18px; font-weight: 700;
    color: #eef0f7; outline: none;
    transition: border-color .2s, box-shadow .2s;
  }
  .fp-otp-input:focus {
    border-color: rgba(46,204,143,.38);
    box-shadow: 0 0 0 3px rgba(46,204,143,.06);
  }
  .fp-resend {
    font-size: 12px; color: rgba(238,240,247,.3);
    text-align: center; margin-bottom: 20px;
  }
  .fp-resend button {
    background: none; border: none; color: #2ECC8F;
    font-size: 12px; cursor: pointer; padding: 0; margin-left: 4px;
  }
  .fp-resend button:disabled { color: rgba(46,204,143,.3); cursor: not-allowed; }
`;

function getStrength(pw: string) {
  if (!pw) return { width: "0%", color: "transparent", label: "" };
  if (pw.length < 6) return { width: "25%", color: "#EF5B5B", label: "Too short" };
  if (pw.length < 8) return { width: "50%", color: "#F5C842", label: "Weak" };
  if (!/[A-Z]/.test(pw) || !/[0-9]/.test(pw)) return { width: "70%", color: "#F5C842", label: "Fair" };
  return { width: "100%", color: "#2ECC8F", label: "Strong" };
}

type Step = "email" | "otp" | "password" | "success";

const OTP_LENGTH = 8;

export default function ForgotPassword() {
  const [step, setStep]           = useState<Step>("email");
  const [email, setEmail]         = useState("");
  const [otp, setOtp]             = useState(Array(OTP_LENGTH).fill(""));
  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [showPw, setShowPw]       = useState(false);
  const [showCf, setShowCf]       = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [countdown, setCountdown] = useState(0);

  const strength = getStrength(password);

  // ── Step 1: Send recovery email ──
  const handleSendOtp = async () => {
    setError("");
    if (!email.trim()) { setError("Please enter your email address."); return; }
    setLoading(true);
    const { error: e } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo: `${window.location.origin}/reset-password` }
    );
    setLoading(false);
    if (e) { setError(e.message || "Failed to send code. Please try again."); return; }
    setStep("otp");
    startCountdown();
  };

  // ── Step 2: Verify OTP ──
  const handleVerifyOtp = async () => {
    setError("");
    const code = otp.join("");
    if (code.length < OTP_LENGTH) { setError(`Please enter the full ${OTP_LENGTH}-digit code.`); return; }
    setLoading(true);
    const { error: e } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code,
      type: "recovery",
    });
    setLoading(false);
    if (e) { setError("Invalid or expired code. Please try again."); return; }
    setStep("password");
  };

  // ── Step 3: Update password ──
  const handleUpdatePassword = async () => {
    setError("");
    if (!password || !confirm) { setError("Please fill in both fields."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    const { error: e } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (e) { setError(e.message || "Failed to update password."); return; }
    setStep("success");
  };

  // OTP input handling
  const handleOtpChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    if (val && i < OTP_LENGTH - 1) document.getElementById(`otp-${i + 1}`)?.focus();
  };

  const handleOtpKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[i] && i > 0)
      document.getElementById(`otp-${i - 1}`)?.focus();
  };

  const startCountdown = () => {
    setCountdown(60);
    const t = setInterval(() => {
      setCountdown(c => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; });
    }, 1000);
  };

  const handleResend = async () => {
    setError("");
    setOtp(Array(OTP_LENGTH).fill(""));
    await supabase.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo: `${window.location.origin}/reset-password` }
    );
    startCountdown();
  };

  const stepNum = step === "email" ? 1 : step === "otp" ? 2 : 3;

  // ── Success ──
  if (step === "success") {
    return (
      <>
        <style>{CSS}</style>
        <div className="fp-root">
          <div className="fp-glow"><div className="fp-glow-a" /><div className="fp-glow-b" /></div>
          <div className="fp-card">
            <div className="fp-success">
              <div className="fp-success-icon"><FaCheckCircle size={36} color="#2ECC8F" /></div>
              <div className="fp-success-title">Password Updated!</div>
              <p className="fp-success-msg">
                Your password has been <strong>successfully reset</strong>.
                You can now sign in with your new password.
              </p>
              <div className="fp-success-divider" />
              <Link to="/login" className="fp-success-btn">Sign In Now →</Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="fp-root">
        <div className="fp-glow"><div className="fp-glow-a" /><div className="fp-glow-b" /></div>
        <div className="fp-card">

          {/* Brand */}
          <div className="fp-brand">
            <div className="fp-logo-ring"><img src={logoImage} alt="DumaSafeGuide" /></div>
            <div>
              <div className="fp-brand-name">Duma<span>SafeGuide</span></div>
              <p className="fp-brand-sub">
                {step === "email"    && "Enter your email to receive a verification code."}
                {step === "otp"      && `Enter the ${OTP_LENGTH}-digit code sent to your email.`}
                {step === "password" && "Choose a strong new password."}
              </p>
            </div>
          </div>

          {/* Step indicator */}
          <div className="fp-step-indicator">
            <div className={`fp-step ${stepNum === 1 ? "active" : "done"}`}>1</div>
            <div className="fp-step-line" />
            <div className={`fp-step ${stepNum === 2 ? "active" : stepNum > 2 ? "done" : "inactive"}`}>2</div>
            <div className="fp-step-line" />
            <div className={`fp-step ${stepNum === 3 ? "active" : "inactive"}`}>3</div>
          </div>

          <div className="fp-divider" />

          {error && <div className="fp-error"><span>⚠</span><span>{error}</span></div>}

          {/* ── Step 1: Email ── */}
          {step === "email" && (
            <>
              <div className="fp-field">
                <label className="fp-label">Email Address</label>
                <div className="fp-input-wrap">
                  <FaEnvelope size={13} className="fp-input-icon" />
                  <input
                    className="fp-input"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSendOtp()}
                    autoFocus
                  />
                </div>
              </div>
              <button className="fp-btn" onClick={handleSendOtp} disabled={loading}>
                {loading && <span className="fp-spin" />}
                {loading ? "Sending Code…" : "Send Verification Code"}
              </button>
              <Link to="/login" className="fp-back">
                <FaArrowLeft size={11} /> Back to Sign In
              </Link>
            </>
          )}

          {/* ── Step 2: OTP ── */}
          {step === "otp" && (
            <>
              <div className="fp-field">
                <label className="fp-label">Verification Code ({OTP_LENGTH} digits)</label>
                <div className="fp-otp-row">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      id={`otp-${i}`}
                      className="fp-otp-input"
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKey(i, e)}
                      autoFocus={i === 0}
                    />
                  ))}
                </div>
                <p className="fp-resend">
                  Didn't receive it?
                  <button onClick={handleResend} disabled={countdown > 0}>
                    {countdown > 0 ? ` Resend in ${countdown}s` : " Resend Code"}
                  </button>
                </p>
              </div>
              <button className="fp-btn" onClick={handleVerifyOtp} disabled={loading}>
                {loading && <span className="fp-spin" />}
                {loading ? "Verifying…" : "Verify Code"}
              </button>
              <button className="fp-back" onClick={() => { setStep("email"); setError(""); }}>
                <FaArrowLeft size={11} /> Change Email
              </button>
            </>
          )}

          {/* ── Step 3: New Password ── */}
          {step === "password" && (
            <>
              <div className="fp-field">
                <label className="fp-label">New Password</label>
                <div className="fp-input-wrap">
                  <input
                    className="fp-input no-icon"
                    type={showPw ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoFocus
                  />
                  <button type="button" className="fp-eye" onClick={() => setShowPw(v => !v)}>
                    {showPw ? <FaEyeSlash size={15} /> : <FaEye size={15} />}
                  </button>
                </div>
                {password && (
                  <div className="fp-strength-wrap">
                    <div className="fp-strength-track">
                      <div className="fp-strength-fill" style={{ width: strength.width, background: strength.color }} />
                    </div>
                    <span className="fp-strength-label" style={{ color: strength.color }}>{strength.label}</span>
                  </div>
                )}
              </div>
              <div className="fp-field">
                <label className="fp-label">Confirm New Password</label>
                <div className="fp-input-wrap">
                  <input
                    className="fp-input no-icon"
                    type={showCf ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleUpdatePassword()}
                  />
                  <button type="button" className="fp-eye" onClick={() => setShowCf(v => !v)}>
                    {showCf ? <FaEyeSlash size={15} /> : <FaEye size={15} />}
                  </button>
                </div>
                {confirm && (
                  <p style={{ fontSize: 11, marginTop: 6, color: password === confirm ? "#2ECC8F" : "#EF5B5B" }}>
                    {password === confirm ? "✓ Passwords match" : "✗ Passwords do not match"}
                  </p>
                )}
              </div>
              <button className="fp-btn" onClick={handleUpdatePassword} disabled={loading}>
                {loading && <span className="fp-spin" />}
                {loading ? "Updating…" : "Update Password"}
              </button>
              <Link to="/login" className="fp-back">
                <FaArrowLeft size={11} /> Back to Sign In
              </Link>
            </>
          )}

        </div>
      </div>
    </>
  );
}