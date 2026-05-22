import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../js/supabase";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import logoImage from "../assets/dsg.logo.png";

const SIGNUP_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@500;700;800&family=Instrument+Sans:wght@400;500&display=swap');

  .lg-root {
    min-height: 100vh;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    font-family: 'Instrument Sans', sans-serif;
    padding: 40px 24px;
    background: #080c14 url('/src/assets/loginbg.png') center/cover no-repeat fixed;
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
    background: rgba(255,255,255,.035);
    border: 1px solid rgba(255,255,255,.08);
    border-radius: 20px;
    padding: 40px 36px;
    width: 100%; max-width: 440px;
    position: relative; overflow: hidden;
    backdrop-filter: blur(10px);
  }
  .lg-card::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, #3d565c, transparent);
  }

  .lg-logo {
    display: flex; align-items: center; justify-content: center; margin-bottom: 24px;
  }
  .lg-logo img { width: 42px; height: 42px; border-radius: 12px; }

  .lg-title {
    font-family: 'Cabinet Grotesk', sans-serif;
    font-size: 24px; font-weight: 800; color: #d9e7e7;
    margin: 0 0 6px; text-align: center;
  }
  .lg-subtitle {
    font-size: 13px; color: rgba(237,240,250,.4);
    margin: 0 0 32px; text-align: center;
  }

  .lg-label {
    font-size: 10px; font-weight: 700; letter-spacing: .14em;
    text-transform: uppercase; color: rgba(237,240,250,.35);
    display: block; margin-bottom: 8px;
  }
  .lg-input-wrap { position: relative; margin-bottom: 18px; }

  .lg-input, .lg-select {
    width: 100%; background: rgba(255,255,255,.05);
    border: 1px solid rgba(255,255,255,.1); border-radius: 10px;
    padding: 12px 14px; font-family: 'Instrument Sans', sans-serif;
    font-size: 14px; color: #edf0fa; outline: none;
    transition: all .2s; box-sizing: border-box;
  }

  .lg-select {
    appearance: none; cursor: pointer;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='rgba(237,240,250,0.3)'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 14px center; background-size: 16px;
  }
  .lg-select option { background: #0e1421; color: #fff; }

  .lg-input:focus, .lg-select:focus {
    border-color: rgba(46,204,143,.4);
    box-shadow: 0 0 0 3px rgba(46,204,143,.07);
  }

  .lg-eye {
    position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer; color: rgba(237,240,250,.3);
    display: flex; align-items: center; transition: color 0.2s;
  }
  .lg-eye:hover { color: #5c6b88; }

  .lg-btn {
    width: 100%; padding: 14px;
    font-family: 'Cabinet Grotesk', sans-serif;
    font-size: 13px; font-weight: 800; letter-spacing: .08em;
    text-transform: uppercase; border-radius: 10px; border: none;
    background: #527eaf; color: #080c14;
    cursor: pointer; transition: all .18s; margin: 10px 0 20px;
  }
  .lg-btn:hover:not(:disabled) {
    background: #35e09a; transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(46,204,143,.25);
  }
  .lg-btn:disabled { opacity: .5; cursor: not-allowed; }

  .lg-error {
    background: rgba(239,91,91,.08); border: 1px solid rgba(239,91,91,.2);
    border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #EF5B5B; margin-bottom: 18px;
  }

  .lg-success-screen {
    display: flex; flex-direction: column; align-items: center;
    text-align: center; padding: 20px 0;
    animation: lgRise .5s cubic-bezier(.22,1,.36,1) both;
  }
  @keyframes lgRise {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .lg-success-icon {
    width: 80px; height: 80px; border-radius: 50%;
    background: rgba(46,204,143,.1); border: 2px solid rgba(46,204,143,.35);
    display: flex; align-items: center; justify-content: center;
    font-size: 36px; margin-bottom: 20px;
    animation: lgPop .5s .1s cubic-bezier(.22,1,.36,1) both;
  }
  @keyframes lgPop {
    from { transform: scale(.6); opacity: 0; }
    to   { transform: scale(1);  opacity: 1; }
  }
  .lg-success-title {
    font-family: 'Cabinet Grotesk', sans-serif;
    font-size: 22px; font-weight: 800; color: #eef0f7; margin-bottom: 10px;
  }
  .lg-success-msg {
    font-size: 13.5px; color: rgba(237,240,250,.5);
    line-height: 1.65; margin-bottom: 8px; max-width: 300px;
  }
  .lg-success-msg strong { color: #2ECC8F; }
  .lg-success-note {
    font-size: 12px; color: rgba(237,240,250,.25);
    margin-bottom: 28px;
  }
  .lg-success-divider {
    width: 100%; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,.08), transparent);
    margin-bottom: 24px;
  }
  .lg-success-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    width: 100%; padding: 14px;
    font-family: 'Cabinet Grotesk', sans-serif;
    font-size: 13px; font-weight: 800; letter-spacing: .08em;
    text-transform: uppercase; border-radius: 10px; border: none;
    background: #2ECC8F; color: #080c14;
    cursor: pointer; text-decoration: none;
    transition: all .18s; box-sizing: border-box;
  }
  .lg-success-btn:hover {
    background: #35e09a; transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(46,204,143,.3);
  }

  .lg-footer { text-align: center; font-size: 13px; color: rgba(237,240,250,.3); }
  .lg-footer a { color: #2ECC8F; text-decoration: none; font-weight: 600; }

  .lg-spinner {
    display: inline-block; width: 14px; height: 14px; border-radius: 50%;
    border: 2px solid rgba(8,12,20,.3); border-top-color: #080c14;
    animation: lgSpin .6s linear infinite; margin-right: 8px; vertical-align: middle;
  }
  @keyframes lgSpin { to { transform: rotate(360deg); } }
`;

const BARANGAYS = [
  "Bagacay", "Bajumpandan", "Balugo", "Banilad", "Bantayan", "Batinguel",
  "Buñao", "Cadawinonan", "Calindagan", "Camanjac", "Candau-ay", "Cantil-e",
  "Daro", "Looc", "Lumabangan", "Mangnao", "Motong", "Piapi", "Poblacion 1",
  "Poblacion 2", "Poblacion 3", "Poblacion 4", "Poblacion 5", "Poblacion 6",
  "Poblacion 7", "Poblacion 8", "Pulantubig", "Tabuctubig", "Taclobo", "Talay"
].sort();

export default function Signup() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    barangay: "",
    password: "",
    confirmPassword: ""
  });

  const [showPw, setShowPw]               = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState("");
  const [success, setSuccess]             = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const { fullName, email, phone, barangay, password, confirmPassword } = formData;

    if (!fullName || !email || !phone || !barangay || !password || !confirmPassword) {
      setError("Please complete all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Signup failed.");

      const { error: profileError } = await supabase
        .from("profiles")
        .insert([{
          id: authData.user.id,
          full_name: fullName,
          email: email,
          phone_number: phone,
          barangay: barangay,
          role: "citizen"
        }]);

      if (profileError) throw profileError;

      // Sign out immediately — force them to log in manually
      await supabase.auth.signOut();

      setSuccess(true);
      setTimeout(() => navigate("/login"), 4000);

    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // ── Success Screen ──
  if (success) {
    return (
      <>
        <style>{SIGNUP_STYLE}</style>
        <div className="lg-root">
          <div className="lg-card">
            <div className="lg-success-screen">
              <div className="lg-success-icon">✅</div>
              <div className="lg-success-title">Account Created!</div>
              <p className="lg-success-msg">
                Welcome to <strong>DumaSafeGuide</strong>!<br />
                Your account has been successfully created.
              </p>
              <p className="lg-success-note">
                Redirecting to Sign In in 4 seconds...
              </p>
              <div className="lg-success-divider" />
              <Link to="/login" className="lg-success-btn">
                Sign In Now →
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── Signup Form ──
  return (
    <>
      <style>{SIGNUP_STYLE}</style>
      <div className="lg-root">

        {/* ← Back to Home link */}
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
          <div className="lg-logo">
            <img src={logoImage} alt="DumaSafeGuide Logo" />
          </div>

          <h1 className="lg-title">Join DumaSafeGuide</h1>
          <p className="lg-subtitle">Secure your account for emergency assistance.</p>

          {error && <div className="lg-error">{error}</div>}

          <form onSubmit={handleSignup}>
            <label className="lg-label">Full Name</label>
            <div className="lg-input-wrap">
              <input
                className="lg-input" name="fullName" type="text"
                placeholder="e.g. Maria Clara"
                value={formData.fullName} onChange={handleChange}
              />
            </div>

            <label className="lg-label">Barangay</label>
            <div className="lg-input-wrap">
              <select className="lg-select" name="barangay" value={formData.barangay} onChange={handleChange}>
                <option value="" disabled>Select your location</option>
                {BARANGAYS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            <label className="lg-label">Phone Number</label>
            <div className="lg-input-wrap">
              <input
                className="lg-input" name="phone" type="tel"
                placeholder="0912 345 6789"
                value={formData.phone} onChange={handleChange}
              />
            </div>

            <label className="lg-label">Email Address</label>
            <div className="lg-input-wrap">
              <input
                className="lg-input" name="email" type="email"
                placeholder="name@email.com"
                value={formData.email} onChange={handleChange}
              />
            </div>

            <label className="lg-label">Password</label>
            <div className="lg-input-wrap">
              <input
                className="lg-input" name="password"
                type={showPw ? "text" : "password"}
                placeholder="••••••••"
                value={formData.password} onChange={handleChange}
              />
              <button type="button" className="lg-eye" onClick={() => setShowPw(!showPw)} tabIndex={-1}>
                {showPw ? <FaEyeSlash size={15} /> : <FaEye size={15} />}
              </button>
            </div>

            <label className="lg-label">Confirm Password</label>
            <div className="lg-input-wrap">
              <input
                className="lg-input" name="confirmPassword"
                type={showConfirmPw ? "text" : "password"}
                placeholder="••••••••"
                value={formData.confirmPassword} onChange={handleChange}
              />
              <button type="button" className="lg-eye" onClick={() => setShowConfirmPw(!showConfirmPw)} tabIndex={-1}>
                {showConfirmPw ? <FaEyeSlash size={15} /> : <FaEye size={15} />}
              </button>
            </div>

            <button className="lg-btn" type="submit" disabled={loading}>
              {loading && <span className="lg-spinner" />}
              {loading ? "Registering..." : "Create Account"}
            </button>
          </form>

          <div className="lg-footer">
            Already have an account? <Link to="/login">Sign In</Link>
          </div>
        </div>
      </div>
    </>
  );
}