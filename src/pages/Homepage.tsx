// src/pages/Homepage.enhanced.tsx
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { FaMapMarkedAlt, FaUsers, FaLightbulb, FaPhoneAlt, FaEye, FaEyeSlash, FaShieldAlt } from "react-icons/fa";
import { supabase } from "../js/supabase";
import homepageBg from "../assets/homepage.bg.jpg";
import { useLanguage } from "../context/LanguageContext";
import { LanguageSelectModal } from "../components/LanguageSelectModal";
import TurnstileWidget from "../components/TurnstileWidget";
import { useTheme } from "../context/ThemeContext";

function EmergencyRunner() {
  const { t, tList } = useLanguage();
  const [dismissed, setDismissed] = useState(false);
  const alerts = tList("ticker.alerts");
  if (dismissed) return null;
  return (
    <>
      <style>{`
        .hp-runner {
          position: fixed; top: 70px; left: 0; right: 0;
          z-index: 99998; height: 34px;
          background: rgba(5,11,22,0.97);
          border-bottom: 1px solid rgba(232,55,42,0.28);
          border-top: 1px solid rgba(255,255,255,0.04);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          display: flex; align-items: center; overflow: hidden;
          box-shadow: 0 4px 24px rgba(0,0,0,0.35);
        }
        .hp-runner::after {
          content: '';
          position: absolute; bottom: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(232,55,42,0.5), rgba(0,200,224,0.3), transparent);
          animation: runnerGlow 4s ease-in-out infinite;
        }
        @keyframes runnerGlow { 0%,100%{opacity:0.4} 50%{opacity:1} }
        .hp-runner-badge {
          flex-shrink: 0; display: flex; align-items: center; gap: 7px;
          padding: 0 14px 0 16px; height: 100%;
          background: linear-gradient(135deg,rgba(232,55,42,0.22),rgba(232,55,42,0.10));
          border-right: 1px solid rgba(232,55,42,0.30);
          position: relative; z-index: 2;
        }
        .hp-runner-dot {
          width: 7px; height: 7px; border-radius: 50%; background: #e8372a;
          animation: runnerPulse 1.4s ease-in-out infinite;
          box-shadow: 0 0 6px rgba(232,55,42,0.8); flex-shrink: 0;
        }
        @keyframes runnerPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.45;transform:scale(0.7)} }
        .hp-runner-badge-label {
          font-family: 'Space Mono', monospace; font-size: 9.5px; font-weight: 700;
          letter-spacing: 0.18em; text-transform: uppercase; color: #e8372a; white-space: nowrap;
        }
        .hp-runner-track {
          flex: 1; overflow: hidden; position: relative; height: 100%;
          display: flex; align-items: center;
          mask-image: linear-gradient(90deg, transparent 0%, black 5%, black 95%, transparent 100%);
          -webkit-mask-image: linear-gradient(90deg, transparent 0%, black 5%, black 95%, transparent 100%);
        }
        .hp-runner-tape {
          display: flex; align-items: center; white-space: nowrap;
          animation: runnerScroll 38s linear infinite; will-change: transform;
        }
        .hp-runner-tape:hover { animation-play-state: paused; }
        @keyframes runnerScroll { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        .hp-runner-item {
          font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 400;
          color: rgba(168,216,255,0.80); padding: 0 40px;
          display: inline-flex; align-items: center; gap: 10px; letter-spacing: 0.01em;
        }
        .hp-runner-sep {
          display: inline-block; width: 4px; height: 4px; border-radius: 50%;
          background: rgba(0,200,224,0.35); margin: 0 8px; flex-shrink: 0;
        }
        .hp-911-badge {
          flex-shrink: 0; display: flex; align-items: center; gap: 7px;
          margin-right: 10px;
          background: rgba(10, 18, 30, 0.88);
          border: 1px solid rgba(232,55,42,0.55);
          border-radius: 20px; padding: 4px 12px 4px 7px;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          text-decoration: none; cursor: pointer;
          position: relative;
          animation: ambulanceStrobe 1.8s ease-in-out infinite;
          transition: all 0.2s ease;
        }
        @keyframes ambulanceStrobe {
          0%   { box-shadow: 0 0 8px rgba(232,55,42,0.40), 0 0 20px rgba(232,55,42,0.20), 0 0 40px rgba(232,55,42,0.08); border-color: rgba(232,55,42,0.55); }
          25%  { box-shadow: 0 0 16px rgba(232,55,42,0.90), 0 0 36px rgba(232,55,42,0.55), 0 0 64px rgba(232,55,42,0.25); border-color: rgba(232,55,42,1); }
          50%  { box-shadow: 0 0 6px rgba(232,55,42,0.30), 0 0 14px rgba(232,55,42,0.15), 0 0 28px rgba(232,55,42,0.06); border-color: rgba(232,55,42,0.40); }
          75%  { box-shadow: 0 0 18px rgba(232,55,42,0.95), 0 0 40px rgba(232,55,42,0.60), 0 0 70px rgba(232,55,42,0.28); border-color: rgba(232,55,42,1); }
          100% { box-shadow: 0 0 8px rgba(232,55,42,0.40), 0 0 20px rgba(232,55,42,0.20), 0 0 40px rgba(232,55,42,0.08); border-color: rgba(232,55,42,0.55); }
        }
        .hp-911-badge:hover {
          animation-play-state: paused;
          background: rgba(232,55,42,0.15);
          border-color: rgba(232,55,42,0.90);
          box-shadow: 0 0 24px rgba(232,55,42,0.80), 0 0 48px rgba(232,55,42,0.40), 0 0 80px rgba(232,55,42,0.20);
        }
        .hp-911-icon-dot {
          width: 20px; height: 20px; border-radius: 50%;
          background: rgba(232,55,42,0.20);
          border: 1px solid rgba(232,55,42,0.50);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
          animation: iconPulse 1.8s ease-in-out infinite;
        }
        @keyframes iconPulse {
          0%, 100% { background: rgba(232,55,42,0.20); border-color: rgba(232,55,42,0.50); }
          25%, 75% { background: rgba(232,55,42,0.40); border-color: rgba(232,55,42,0.90); }
          50%       { background: rgba(232,55,42,0.15); border-color: rgba(232,55,42,0.35); }
        }
        .hp-911-icon { width: 11px; height: 11px; color: #ff6b5b; flex-shrink: 0; }
        .hp-911-label {
          font-family: 'Space Mono', monospace; font-size: 10px; font-weight: 700;
          color: rgba(255, 120, 100, 0.90); letter-spacing: 0.08em; white-space: nowrap; line-height: 1;
          animation: textFlicker 1.8s ease-in-out infinite;
        }
        @keyframes textFlicker {
          0%, 100% { color: rgba(255,120,100,0.90); }
          25%, 75%  { color: rgba(255,160,140,1); }
          50%       { color: rgba(255,100,80,0.75); }
        }
        .hp-911-divider { width: 1px; height: 10px; background: rgba(232,55,42,0.30); margin: 0 1px; }
        .hp-911-number {
          font-family: 'Space Mono', monospace; font-size: 12px; font-weight: 700;
          color: #fff; letter-spacing: 0.04em; white-space: nowrap; line-height: 1;
          text-shadow: 0 0 8px rgba(232,55,42,0.60);
        }
        .hp-runner-mute {
          flex-shrink: 0; padding: 0 12px; height: 100%;
          display: flex; align-items: center;
          border-left: 1px solid rgba(0,200,224,0.10);
          cursor: pointer; background: none;
          border-top: none; border-right: none; border-bottom: none;
          transition: background 0.2s;
        }
        .hp-runner-mute:hover { background: rgba(0,200,224,0.06); }
        .hp-runner-mute svg { width: 13px; height: 13px; color: rgba(168,216,255,0.30); transition: color 0.2s; }
        .hp-runner-mute:hover svg { color: rgba(168,216,255,0.70); }
      `}</style>
      <div className="hp-runner" role="marquee" aria-label="Emergency alerts ticker">
        <div className="hp-runner-badge">
          <span className="hp-runner-dot" aria-hidden="true" />
          <span className="hp-runner-badge-label">{t("common.live")}</span>
        </div>
        <div className="hp-runner-track">
          <div className="hp-runner-tape" aria-hidden="true">
            {[...alerts, ...alerts].map((alert, i) => (
              <span key={i} className="hp-runner-item">
                {alert}
                <span className="hp-runner-sep" />
              </span>
            ))}
          </div>
        </div>
        <a href="tel:911" className="hp-911-badge" aria-label="Call emergency 911">
          <div className="hp-911-icon-dot">
            <svg className="hp-911-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .82h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
            </svg>
          </div>
          <span className="hp-911-label">{t("common.emergency")}</span>
          <span className="hp-911-divider" aria-hidden="true" />
          <span className="hp-911-number">911</span>
        </a>
        <button className="hp-runner-mute" onClick={() => setDismissed(true)} type="button" aria-label="Dismiss ticker">
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <line x1="2" y1="2" x2="12" y2="12" />
            <line x1="12" y1="2" x2="2" y2="12" />
          </svg>
        </button>
      </div>
    </>
  );
}

const CARD_META = [
  { icon: <FaMapMarkedAlt size={28} />, to: "/map", accent: "#00c8e0", key: "map" },
  { icon: <FaUsers size={28} />, to: "/directory", accent: "#4A90D9", key: "directory" },
  { icon: <FaLightbulb size={28} />, to: "/safetytips", accent: "#e8b830", key: "tips" },
  { icon: <FaPhoneAlt size={28} />, to: "/resources", accent: "#e8372a", key: "contacts" },
] as const;

const STAT_META = [
  { key: "barangays", value: 30, suffix: "" },
  { key: "hourResponse", value: 24, suffix: "/7" },
  { key: "avgResponse", value: 5, suffix: "m" },
] as const;

const ROLE_REDIRECT: Record<string, string> = {
  admin: "/admin/dashboard",
  responder: "/responder/dashboard",
  citizen: "/citizen/dashboard",
};

function useCounter(target: number, duration = 1800, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const raf = { id: 0 };
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(ease * target));
      if (progress < 1) {
        raf.id = requestAnimationFrame(step);
      } else {
        setCount(target);
      }
    };
    raf.id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.id);
  }, [start, target, duration]);
  return count;
}

function StatCounter({
  value,
  label,
  suffix,
  start,
}: {
  value: number;
  label: string;
  suffix: string;
  start: boolean;
}) {
  const count = useCounter(value, 1800, start);
  return (
    <div className="hp-stat">
      <div className="hp-stat-value">
        {count}
        <span className="hp-stat-suffix">{suffix}</span>
      </div>
      <div className="hp-stat-label">{label}</div>
    </div>
  );
}

export default function Homepage() {
  const { t } = useLanguage();
  const { isLight } = useTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // ── CAPTCHA (Turnstile) state — required by Supabase Auth when captcha
  // protection is enabled. Widget loads only on this screen, once per mount.
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaStatus, setCaptchaStatus] = useState<"loading" | "ready" | "error">("loading");
  const [captchaMsg, setCaptchaMsg] = useState("");
  const [turnstileKey, setTurnstileKey] = useState(0);

  const resetCaptcha = () => {
    setCaptchaToken("");
    setTurnstileKey(k => k + 1);
  };

  const retryCaptcha = () => {
    setCaptchaMsg("");
    setCaptchaStatus("loading");
    setCaptchaToken("");
    setTurnstileKey(k => k + 1);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event !== "INITIAL_SESSION") return;
        if (!session?.user) return;
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single();
          const role = profile?.role?.trim().toLowerCase();
          if (role && ROLE_REDIRECT[role]) {
            navigate(ROLE_REDIRECT[role], { replace: true });
          }
        } catch (err) {
          console.error("Error fetching profile on initial session:", err);
        }
      }
    );
    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setStatsVisible(true);
      },
      { threshold: 0.4 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  // Turnstile is now handled by <TurnstileWidget /> below — single instance per mount, script loaded only on this screen.

  const handleLogin = async () => {
    if (!email || !password) {
      setError(t("auth.errMissingFields"));
      return;
    }
    if (captchaStatus === "loading") {
      setError(t("auth.errNeedCaptcha"));
      return;
    }
    // If the widget itself failed to load (status "error"), don't brick the
    // login: attempt auth without a token and let Supabase decide.
    if (!captchaToken && captchaStatus !== "error") {
      setError(captchaMsg || t("auth.errNeedCaptcha"));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
          ...(captchaToken ? { options: { captchaToken } } : {}),
        });
      if (authError || !authData.user) {
        const rawMessage = (authError?.message || "").toLowerCase();
        const isCaptcha =
          rawMessage.includes("captcha") ||
          rawMessage.includes("turnstile") ||
          rawMessage.includes("challenge") ||
          rawMessage.includes("robot") ||
          rawMessage.includes("verification");
        setError(
          isCaptcha ? t("auth.errNeedCaptcha") : authError?.message || t("auth.errLoginFailed")
        );
        setLoading(false);
        resetCaptcha();
        return;
      }
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authData.user.id)
        .single();
      if (profileError || !profile?.role) {
        await new Promise((res) => setTimeout(res, 1500));
        const { data: retryProfile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", authData.user.id)
          .single();
        if (!retryProfile?.role) {
          setError(t("auth.errProfileNotReady"));
          setLoading(false);
          return;
        }
        const role = retryProfile.role.trim().toLowerCase();
        setLoading(false);
        await new Promise((res) => setTimeout(res, 100));
        navigate(ROLE_REDIRECT[role] ?? "/citizen/dashboard", { replace: true });
        return;
      }
      const role = profile.role.trim().toLowerCase();
      setLoading(false);
      await new Promise((res) => setTimeout(res, 100));
      navigate(ROLE_REDIRECT[role] ?? "/citizen/dashboard", { replace: true });
    } catch (err: any) {
      setError(err.message || t("auth.errLoginFailed"));
      setLoading(false);
      resetCaptcha();
    }
  };

  return (
    <>
      <LanguageSelectModal />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Poppins:wght@300;400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap');

        html, body, #root {
          overflow-x: hidden !important;
          overflow-y: auto !important;
          height: auto !important;
          min-height: 100vh;
          width: 100%;
          max-width: 100vw;
        }

        .hp-root *, .hp-root *::before, .hp-root *::after {
          box-sizing: border-box;
        }

        .hp-root {
          min-height: 100vh;
          height: auto;
          font-family: 'Inter', sans-serif;
          color: #ddeef8;
          overflow-x: hidden;
          overflow-y: visible;
          position: relative;
          width: 100%;
          max-width: 100vw;
        }

        .hp-bg {
          position: fixed;
          inset: 0;
          z-index: -1;
          overflow: hidden;
          will-change: transform;
          transform: translateZ(0);
        }

        .hp-bg-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center bottom;
          display: block;
          transform-origin: center center;
          animation: bgDrift 30s ease-in-out infinite;
          will-change: transform;
          transform: translateZ(0) scale(1.08);
        }

        .hp-bg-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            rgba(7, 16, 29, 0.87) 0%,
            rgba(7, 16, 29, 0.72) 40%,
            rgba(7, 16, 29, 0.87) 75%,
            rgba(7, 16, 29, 0.98) 100%
          );
        }

        .hp-bg-atmosphere {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 70% 60% at 10% 0%, rgba(232, 55, 42, 0.14) 0%, transparent 65%),
            radial-gradient(ellipse 60% 70% at 90% 100%, rgba(0, 200, 224, 0.10) 0%, transparent 70%),
            radial-gradient(ellipse 50% 50% at 55% 45%, rgba(13, 27, 46, 0.50) 0%, transparent 60%);
          pointer-events: none;
          animation: atmosphereDrift 20s ease-in-out infinite;
        }

        .hp-bg-grain {
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
          background-size: 200px;
          opacity: 0.45;
          pointer-events: none;
        }

        @keyframes bgDrift {
          0% { transform: translateZ(0) scale(1.08) translate(0px, 0px); }
          25% { transform: translateZ(0) scale(1.11) translate(-12px, -8px); }
          50% { transform: translateZ(0) scale(1.10) translate(-6px, -14px); }
          75% { transform: translateZ(0) scale(1.11) translate(8px, -6px); }
          100% { transform: translateZ(0) scale(1.08) translate(0px, 0px); }
        }

        @keyframes atmosphereDrift {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }

        .hp-orb {
          position: fixed;
          border-radius: 50%;
          pointer-events: none;
          z-index: 0;
          animation: orbDrift linear infinite;
          will-change: transform;
          transform: translateZ(0);
          filter: blur(60px);
          max-width: 100vw;
        }

        .hp-orb-1 {
          width: 300px; height: 300px;
          background: radial-gradient(circle, rgba(232, 55, 42, 0.09) 0%, transparent 70%);
          top: 5%; left: -8%;
          animation-duration: 22s;
        }

        .hp-orb-2 {
          width: 260px; height: 260px;
          background: radial-gradient(circle, rgba(0, 200, 224, 0.08) 0%, transparent 70%);
          bottom: 15%; right: -6%;
          animation-duration: 28s;
          animation-delay: -10s;
        }

        .hp-orb-3 {
          width: 200px; height: 200px;
          background: radial-gradient(circle, rgba(74, 144, 217, 0.07) 0%, transparent 70%);
          top: 50%; left: 35%;
          animation-duration: 18s;
          animation-delay: -5s;
        }

        @keyframes orbDrift {
          0% { transform: translateZ(0) translate(0, 0) scale(1); }
          33% { transform: translateZ(0) translate(20px, -30px) scale(1.08); }
          66% { transform: translateZ(0) translate(-16px, 20px) scale(0.95); }
          100% { transform: translateZ(0) translate(0, 0) scale(1); }
        }

        .hp-inner {
          position: relative;
          z-index: 1;
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 20px 60px;
          width: 100%;
          box-sizing: border-box;
          overflow-x: hidden;
        }

        .hp-hero {
          margin-top: 24px;
          margin-bottom: 80px;
          display: grid;
          grid-template-columns: 1fr minmax(0, 420px);
          gap: 56px;
          align-items: center;
          animation: fadeUp 0.8s 0.15s cubic-bezier(0.22, 1, 0.36, 1) both;
          width: 100%;
          box-sizing: border-box;
        }

        .hp-hero-eyebrow {
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #e8372a;
          margin-bottom: 22px;
          display: flex;
          align-items: center;
          gap: 12px;
          animation: slideRight 0.6s 0.1s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .hp-hero-eyebrow::after {
          content: '';
          display: block;
          width: 48px;
          height: 1.5px;
          background: linear-gradient(90deg, #e8372a, transparent);
          opacity: 0.7;
        }

        .hp-hero h1 {
          font-family: 'Poppins', sans-serif;
          font-size: clamp(38px, 6.5vw, 84px);
          font-weight: 800;
          line-height: 0.92;
          letter-spacing: -0.03em;
          color: #F8FAFC;
          margin-bottom: 28px;
          animation: slideUp 0.8s 0.2s cubic-bezier(0.22, 1, 0.36, 1) both;
          word-break: break-word;
          background: linear-gradient(135deg, #F8FAFC 0%, #A8D8FF 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hp-hero h1 .accent {
          color: #00c8e0;
          background: linear-gradient(135deg, #00c8e0 0%, #A8D8FF 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hp-hero-sub {
          font-size: 16px;
          font-weight: 400;
          color: rgba(168, 216, 255, 0.75);
          max-width: 420px;
          line-height: 1.75;
          margin-bottom: 40px;
          animation: slideUp 0.8s 0.25s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .hp-hero-cta {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          background: linear-gradient(135deg, #e8372a 0%, #f04438 100%);
          color: #fff;
          text-decoration: none;
          font-family: 'Poppins', sans-serif;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 15px 32px;
          border-radius: 10px;
          transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
          box-shadow: 0 0 32px rgba(232, 55, 42, 0.32);
          position: relative;
          overflow: hidden;
          animation: slideUp 0.8s 0.3s cubic-bezier(0.22, 1, 0.36, 1) both;
          max-width: 100%;
          box-sizing: border-box;
          border: none;
          cursor: pointer;
        }

        .hp-hero-cta::after {
          content: '';
          position: absolute;
          top: 0; left: -100%;
          width: 60%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.20), transparent);
          transform: skewX(-20deg);
          animation: ctaShimmer 3s ease-in-out infinite;
        }

        @keyframes ctaShimmer {
          0% { left: -100%; }
          40% { left: 140%; }
          100% { left: 140%; }
        }

        .hp-hero-cta:hover {
          transform: translateY(-3px);
          box-shadow: 0 0 48px rgba(232, 55, 42, 0.60), 0 8px 32px rgba(232, 55, 42, 0.40);
          background: linear-gradient(135deg, #f04438 0%, #f85a47 100%);
        }

        .hp-hero-cta:active { transform: translateY(-1px); }

        .hp-hero-cta-arrow {
          transition: transform 0.3s ease;
          display: inline-block;
        }

        .hp-hero-cta:hover .hp-hero-cta-arrow { transform: translateX(6px); }

        .hp-stats {
          display: flex;
          align-items: stretch;
          gap: 0;
          margin-top: 56px;
          border: 1px solid rgba(0, 200, 224, 0.14);
          border-radius: 14px;
          background: rgba(7, 16, 29, 0.60);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          overflow: hidden;
          box-shadow: 0 0 40px rgba(0, 200, 224, 0.08);
          animation: slideUp 0.8s 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;
          width: 100%;
          box-sizing: border-box;
        }

        .hp-stat {
          flex: 1;
          padding: 24px 18px;
          text-align: center;
          position: relative;
          min-width: 0;
          transition: all 0.3s ease;
        }

        .hp-stat:hover { background: rgba(0, 200, 224, 0.05); }

        .hp-stat + .hp-stat::before {
          content: '';
          position: absolute;
          left: 0; top: 18%; bottom: 18%;
          width: 1px;
          background: rgba(0, 200, 224, 0.12);
        }

        .hp-stat-value {
          font-family: 'Poppins', sans-serif;
          font-size: 32px;
          font-weight: 800;
          color: #F8FAFC;
          line-height: 1;
          margin-bottom: 8px;
          background: linear-gradient(135deg, #F8FAFC 0%, #A8D8FF 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hp-stat-suffix {
          font-size: 18px;
          color: #A8D8FF;
          margin-left: 3px;
          font-weight: 600;
        }

        .hp-stat-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(168, 216, 255, 0.50);
          line-height: 1.4;
        }

        .hp-auth-panel {
          background: rgba(13, 27, 46, 0.85);
          border: 1px solid rgba(0, 200, 224, 0.18);
          border-radius: 18px;
          padding: 36px 32px 32px;
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          position: relative;
          overflow: hidden;
          box-shadow: 0 0 48px rgba(7, 16, 29, 0.6), inset 0 0 48px rgba(0, 200, 224, 0.03);
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          animation: slideUp 0.8s 0.2s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .hp-auth-panel::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, #e8372a, #00c8e0, transparent);
          border-radius: 18px 18px 0 0;
        }

        .hp-auth-panel::after {
          content: '';
          position: absolute;
          top: -50px; right: -50px;
          width: 150px; height: 150px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0, 200, 224, 0.12), transparent 70%);
          pointer-events: none;
          filter: blur(40px);
        }

        .hp-auth-scan {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 100%;
          pointer-events: none;
          overflow: hidden;
          border-radius: 18px;
          z-index: 0;
        }

        .hp-auth-scan::after {
          content: '';
          position: absolute;
          left: 0; right: 0;
          top: -4px; height: 3px;
          background: linear-gradient(90deg, transparent 0%, rgba(0,200,224,0.20) 40%, rgba(0,200,224,0.40) 50%, rgba(0,200,224,0.20) 60%, transparent 100%);
          animation: scanLine 5s ease-in-out infinite;
          filter: blur(1.5px);
          will-change: top;
        }

        @keyframes scanLine {
          0% { top: 0%; opacity: 0; }
          5% { opacity: 1; }
          95% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }

        .hp-auth-watermark {
          position: absolute;
          bottom: -20px; right: -20px;
          font-size: 130px;
          color: rgba(0, 200, 224, 0.03);
          pointer-events: none;
          z-index: 0;
          line-height: 1;
        }

        .hp-auth-panel > *:not(.hp-auth-scan):not(.hp-auth-watermark) {
          position: relative;
          z-index: 1;
        }

        .hp-auth-title {
          font-family: 'Poppins', sans-serif;
          font-size: 24px;
          font-weight: 800;
          color: #F8FAFC;
          margin-bottom: 6px;
        }

        .hp-auth-subtitle {
          font-size: 13.5px;
          font-weight: 400;
          color: rgba(168, 216, 255, 0.60);
          margin-bottom: 28px;
          line-height: 1.6;
        }

        .hp-auth-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
          width: 100%;
        }

        .hp-auth-label {
          font-family: 'Space Mono', monospace;
          font-size: 10.5px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(168, 216, 255, 0.50);
        }

        .hp-auth-input {
          background: rgba(6, 15, 28, 0.85);
          border: 1px solid rgba(0, 200, 224, 0.14);
          border-radius: 10px;
          padding: 12px 16px;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          color: #c8e4f4;
          outline: none;
          caret-color: #00c8e0;
          transition: all 0.25s ease;
          width: 100%;
          box-sizing: border-box;
        }

        .hp-auth-input::placeholder { color: rgba(160, 200, 224, 0.20); }

        .hp-auth-input:focus {
          border-color: rgba(0, 200, 224, 0.45);
          box-shadow: 0 0 0 3.5px rgba(0, 200, 224, 0.08);
          background: rgba(0, 200, 224, 0.03);
        }

        .hp-auth-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          gap: 10px;
          flex-wrap: wrap;
          width: 100%;
          box-sizing: border-box;
        }

        .hp-auth-remember {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12.5px;
          color: rgba(168, 216, 255, 0.50);
          cursor: pointer;
          user-select: none;
          transition: color 0.2s;
        }

        .hp-auth-remember:hover { color: rgba(168, 216, 255, 0.70); }

        .hp-auth-remember input[type="checkbox"] {
          accent-color: #e8372a;
          width: 14px; height: 14px;
          cursor: pointer;
          border: 1.5px solid rgba(0, 200, 224, 0.25);
        }

        .hp-auth-forgot {
          font-size: 12.5px;
          font-weight: 600;
          color: #00c8e0;
          text-decoration: none;
          transition: all 0.25s;
        }

        .hp-auth-forgot:hover {
          color: #A8D8FF;
          text-shadow: 0 0 12px rgba(0, 200, 224, 0.35);
        }

        .hp-auth-error {
          font-size: 12px;
          color: #ff7f6b;
          background: rgba(232, 55, 42, 0.12);
          border: 1px solid rgba(232, 55, 42, 0.28);
          border-radius: 10px;
          padding: 11px 14px;
          margin-bottom: 16px;
          line-height: 1.5;
          animation: errShake 0.35s ease;
          width: 100%;
          box-sizing: border-box;
        }

        @keyframes errShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }

        .hp-auth-captcha {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          min-height: 65px;
          width: 100%;
          box-sizing: border-box;
        }
        .hp-turnstile-box {
          width: 100%;
          min-height: 65px;
          height: 65px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(6, 15, 28, 0.55);
          border: 1px solid rgba(0, 200, 224, 0.12);
          border-radius: 10px;
          overflow: hidden;
        }
        .hp-turnstile-box > div {
          width: 300px !important;
          height: 65px !important;
          display: flex !important;
          align-items: center;
          justify-content: center;
        }
        .hp-turnstile-box iframe {
          display: block !important;
          visibility: visible !important;
          width: 300px !important;
          height: 65px !important;
          border: 0;
        }

        .hp-auth-btn {
          width: 100%;
          padding: 14px 22px;
          border: none;
          border-radius: 10px;
          background: linear-gradient(135deg, #e8372a 0%, #f04438 100%);
          color: #fff;
          font-family: 'Poppins', sans-serif;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
          box-shadow: 0 0 32px rgba(232, 55, 42, 0.28);
          position: relative;
          overflow: hidden;
          box-sizing: border-box;
        }

        .hp-auth-btn::after {
          content: '';
          position: absolute;
          top: 0; left: -100%;
          width: 60%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
          transform: skewX(-20deg);
          transition: left 0.45s ease;
        }

        .hp-auth-btn:hover:not(:disabled)::after { left: 140%; }

        .hp-auth-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 0 48px rgba(232, 55, 42, 0.50);
          background: linear-gradient(135deg, #f04438 0%, #f85a47 100%);
        }

        .hp-auth-btn:active:not(:disabled) { transform: translateY(0); }
        .hp-auth-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .hp-auth-or {
          display: flex;
          align-items: center;
          gap: 14px;
          margin: 20px 0;
          width: 100%;
          box-sizing: border-box;
        }

        .hp-auth-or-line {
          flex: 1; height: 1px;
          background: rgba(0, 200, 224, 0.12);
        }

        .hp-auth-or-text {
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(168, 216, 255, 0.35);
          white-space: nowrap;
        }

        .hp-auth-create {
          display: block;
          width: 100%;
          padding: 14px;
          border: 1.5px solid rgba(168, 216, 255, 0.30);
          border-radius: 10px;
          background: rgba(168, 216, 255, 0.06);
          color: #A8D8FF;
          font-family: 'Poppins', sans-serif;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          text-align: center;
          text-decoration: none;
          transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
          box-sizing: border-box;
          cursor: pointer;
        }

        .hp-auth-create:hover {
          background: rgba(168, 216, 255, 0.12);
          border-color: rgba(168, 216, 255, 0.55);
          transform: translateY(-2px);
          box-shadow: 0 0 28px rgba(168, 216, 255, 0.15);
        }

        .hp-auth-create:active { transform: translateY(0); }

        .hp-divider {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 48px;
          animation: fadeUp 0.8s 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
          width: 100%;
          box-sizing: border-box;
          overflow: hidden;
        }

        .hp-divider-label {
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.20em;
          text-transform: uppercase;
          color: rgba(168, 216, 255, 0.40);
          white-space: nowrap;
        }

        .hp-divider-line {
          flex: 1; height: 1px;
          background: linear-gradient(90deg, rgba(168, 216, 255, 0.20), transparent);
          min-width: 0;
        }

        .hp-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
          width: 100%;
          box-sizing: border-box;
        }

        .hp-card {
          position: relative;
          background: rgba(13, 27, 46, 0.70);
          border: 1.5px solid rgba(0, 200, 224, 0.11);
          border-radius: 14px;
          padding: 28px 24px;
          text-decoration: none;
          color: inherit;
          display: flex;
          flex-direction: column;
          gap: 12px;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
          animation: fadeUp 0.7s ease both;
          cursor: pointer;
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
          box-sizing: border-box;
          min-width: 0;
        }

        .hp-card:nth-child(1) { animation-delay: 0.3s; }
        .hp-card:nth-child(2) { animation-delay: 0.38s; }
        .hp-card:nth-child(3) { animation-delay: 0.46s; }
        .hp-card:nth-child(4) { animation-delay: 0.54s; }

        .hp-card::before {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(ellipse 100% 70% at 10% 0%, var(--accent-alpha), transparent 75%);
          opacity: 0;
          transition: opacity 0.35s ease;
          pointer-events: none;
        }

        .hp-card::after {
          content: '';
          position: absolute;
          top: 0; left: 15%; right: 15%;
          height: 1.5px;
          background: linear-gradient(90deg, transparent, var(--accent-color), transparent);
          opacity: 0;
          transition: opacity 0.4s ease;
          border-radius: 1px;
          pointer-events: none;
        }

        .hp-card:hover {
          transform: translateY(-8px) scale(1.02);
          border-color: var(--accent-color);
          background: rgba(13, 27, 46, 0.92);
          box-shadow: 0 16px 48px rgba(0,0,0,0.45), 0 0 40px var(--accent-alpha);
        }

        .hp-card:hover::before { opacity: 1; }
        .hp-card:hover::after { opacity: 1; }
        .hp-card:focus-within { outline: 2px solid var(--accent-color); outline-offset: 2px; }

        .hp-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .hp-card-icon {
          width: 52px; height: 52px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent-color);
          background: var(--accent-alpha);
          border: 1.5px solid var(--accent-color);
          flex-shrink: 0;
          position: relative; z-index: 1;
          transition: all 0.3s ease;
          box-shadow: 0 0 20px var(--accent-alpha);
        }

        .hp-card:hover .hp-card-icon {
          transform: scale(1.12) rotate(3deg);
          box-shadow: 0 0 28px var(--accent-alpha);
        }

        .hp-card-tag {
          font-family: 'Space Mono', monospace;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.14em;
          color: var(--accent-color);
          border: 1px solid var(--accent-color);
          border-radius: 4px;
          padding: 3px 8px;
          opacity: 0.75;
          position: relative; z-index: 1;
          transition: all 0.2s ease;
        }

        .hp-card:hover .hp-card-tag { opacity: 1; transform: scale(1.05); }

        .hp-card-title {
          font-family: 'Poppins', sans-serif;
          font-size: 19px;
          font-weight: 700;
          color: #F8FAFC;
          position: relative; z-index: 1;
        }

        .hp-card-desc {
          font-size: 13px;
          font-weight: 400;
          color: rgba(168, 216, 255, 0.62);
          line-height: 1.6;
          position: relative; z-index: 1;
          flex: 1;
        }

        .hp-card-action {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.06em;
          color: var(--accent-color);
          position: relative; z-index: 1;
          margin-top: 6px;
          transition: gap 0.25s ease;
        }

        .hp-card:hover .hp-card-action { gap: 12px; }

        .hp-footer-bridge {
          height: 56px;
          background: linear-gradient(to bottom, rgba(4,16,28,0) 0%, rgba(4,16,28,1) 100%);
          pointer-events: none;
          position: relative; z-index: 1;
        }

        @keyframes slideRight {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(28px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 860px) {
          .hp-hero { grid-template-columns: 1fr; margin-top: 32px; margin-bottom: 56px; gap: 40px; }
          .hp-auth-panel { order: -1; }
        }

        @media (max-width: 600px) {
          .hp-inner { padding: 0 14px 48px; }
          .hp-hero { margin-top: 16px; margin-bottom: 36px; gap: 24px; }
          .hp-hero h1 { font-size: clamp(34px, 9vw, 52px); margin-bottom: 14px; line-height: 0.95; }
          .hp-hero-sub { font-size: 14px; margin-bottom: 22px; line-height: 1.65; }
          .hp-hero-eyebrow { font-size: 10px; margin-bottom: 14px; }
          .hp-hero-cta { padding: 13px 22px; font-size: 12px; width: 100%; justify-content: center; }
          .hp-auth-panel { padding: 22px 16px 20px; border-radius: 14px; }
          .hp-auth-title { font-size: 20px; }
          .hp-auth-subtitle { font-size: 12.5px; margin-bottom: 20px; }
          .hp-auth-input { padding: 11px 13px; font-size: 13px; }
          .hp-auth-btn { padding: 13px; font-size: 12px; }
          .hp-auth-create { padding: 13px; font-size: 12px; }
          .hp-auth-row { margin-bottom: 18px; }
          .hp-stats { margin-top: 28px; }
          .hp-stat { padding: 14px 8px; }
          .hp-stat-value { font-size: 24px; }
          .hp-stat-suffix { font-size: 14px; }
          .hp-stat-label { font-size: 9px; letter-spacing: 0.04em; }
          .hp-divider { margin-bottom: 24px; }
          .hp-grid { gap: 12px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .hp-card { padding: 18px 14px; gap: 10px; border-radius: 12px; }
          .hp-card-icon { width: 42px; height: 42px; border-radius: 10px; }
          .hp-card-icon svg { width: 20px !important; height: 20px !important; }
          .hp-card-title { font-size: 15px; }
          .hp-card-desc { font-size: 11.5px; }
          .hp-card-tag { font-size: 8px; padding: 2px 6px; }
          .hp-card-action { font-size: 11px; margin-top: 2px; }
        }

        @media (max-width: 400px) {
          .hp-inner { padding: 0 12px 40px; }
          .hp-grid { grid-template-columns: 1fr; }
          .hp-card { padding: 16px 14px; }
          .hp-card-title { font-size: 15px; }
          .hp-card-desc { font-size: 11px; }
          .hp-stat-value { font-size: 20px; }
          .hp-hero h1 { font-size: clamp(30px, 9vw, 46px); }
          .hp-auth-panel { padding: 20px 14px 18px; }
        }

        /* ══════════════════════════════════════════════════════════════
           PRO LIGHT MODE — html[data-theme="light"]
           Soft off-white canvas, dark-slate type (never pure black),
           white cards with hairline borders + soft shadows.
           Every low-contrast dark-mode rgba() is overridden so all
           fonts stay legible. Scoped to .hp-* so dashboards are untouched.
           ══════════════════════════════════════════════════════════════ */
        html[data-theme="light"] .hp-root { color: #16263f; }
        html[data-theme="light"] .hp-bg-img { opacity: 0.6; filter: saturate(1) brightness(1.02); }
        html[data-theme="light"] .hp-bg-overlay {
          background: linear-gradient(
            180deg,
            rgba(240,244,249,0.84) 0%,
            rgba(240,244,249,0.66) 40%,
            rgba(238,242,247,0.80) 75%,
            rgba(234,239,245,0.97) 100%
          );
        }
        html[data-theme="light"] .hp-bg-atmosphere {
          background:
            radial-gradient(ellipse 70% 60% at 10% 0%, rgba(232,55,42,0.08) 0%, transparent 65%),
            radial-gradient(ellipse 60% 70% at 90% 100%, rgba(29,79,215,0.08) 0%, transparent 70%),
            radial-gradient(ellipse 50% 50% at 55% 45%, rgba(255,255,255,0.55) 0%, transparent 60%);
        }
        html[data-theme="light"] .hp-bg-grain { opacity: 0.22; }
        html[data-theme="light"] .hp-orb { filter: blur(70px); opacity: 0.8; }
        html[data-theme="light"] .hp-orb-1 { background: radial-gradient(circle, rgba(232,55,42,0.10) 0%, transparent 70%); }
        html[data-theme="light"] .hp-orb-2 { background: radial-gradient(circle, rgba(29,79,215,0.10) 0%, transparent 70%); }
        html[data-theme="light"] .hp-orb-3 { background: radial-gradient(circle, rgba(0,122,77,0.08) 0%, transparent 70%); }

        /* ── Emergency ticker → light ── */
        html[data-theme="light"] .hp-runner {
          background: rgba(255,255,255,0.96);
          border-bottom: 1px solid rgba(15,30,51,0.10);
          border-top: 1px solid rgba(15,30,51,0.06);
          box-shadow: 0 4px 20px rgba(15,30,51,0.08);
        }
        html[data-theme="light"] .hp-runner-badge {
          background: linear-gradient(135deg, rgba(232,55,42,0.12), rgba(232,55,42,0.05));
          border-right: 1px solid rgba(232,55,42,0.25);
        }
        html[data-theme="light"] .hp-runner-item { color: rgba(22,38,63,0.78); }
        html[data-theme="light"] .hp-runner-sep { background: rgba(29,79,215,0.35); }
        html[data-theme="light"] .hp-911-badge {
          background: #ffffff;
          border-color: rgba(232,55,42,0.45);
          box-shadow: 0 2px 12px rgba(232,55,42,0.18);
          animation: none;
        }
        html[data-theme="light"] .hp-911-badge:hover { background: rgba(232,55,42,0.08); }
        html[data-theme="light"] .hp-911-number { color: #b32323; text-shadow: none; }
        html[data-theme="light"] .hp-911-label { color: #b32323; animation: none; }
        html[data-theme="light"] .hp-runner-mute { border-left: 1px solid rgba(15,30,51,0.10); }
        html[data-theme="light"] .hp-runner-mute svg { color: rgba(22,38,63,0.40); }
        html[data-theme="light"] .hp-runner-mute:hover { background: rgba(15,30,51,0.05); }
        html[data-theme="light"] .hp-runner-mute:hover svg { color: rgba(22,38,63,0.75); }

        /* ── Hero copy → light ── */
        html[data-theme="light"] .hp-hero h1 {
          background: linear-gradient(135deg, #0f1e33 0%, #274b7a 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        html[data-theme="light"] .hp-hero h1 .accent {
          background: linear-gradient(135deg, #0077b6 0%, #1d4fd7 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        html[data-theme="light"] .hp-hero-eyebrow { color: #b32323; }
        html[data-theme="light"] .hp-hero-eyebrow::after { background: linear-gradient(90deg, #b32323, transparent); }
        html[data-theme="light"] .hp-hero-sub { color: rgba(22,38,63,0.74); }

        /* ── Stats strip → light card ── */
        html[data-theme="light"] .hp-stats {
          background: #ffffff;
          border: 1px solid rgba(15,30,51,0.10);
          box-shadow: 0 6px 28px rgba(15,30,51,0.08);
        }
        html[data-theme="light"] .hp-stat:hover { background: rgba(29,79,215,0.04); }
        html[data-theme="light"] .hp-stat + .hp-stat::before { background: rgba(15,30,51,0.10); }
        html[data-theme="light"] .hp-stat-value {
          background: linear-gradient(135deg, #0f1e33 0%, #274b7a 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        html[data-theme="light"] .hp-stat-suffix { color: #1d4fd7; }
        html[data-theme="light"] .hp-stat-label { color: rgba(22,38,63,0.60); }

        /* ── Auth panel → white pro card ── */
        html[data-theme="light"] .hp-auth-panel {
          background: #ffffff;
          border: 1px solid rgba(15,30,51,0.10);
          box-shadow: 0 12px 44px rgba(15,30,51,0.12), inset 0 1px 0 rgba(255,255,255,0.9);
        }
        html[data-theme="light"] .hp-auth-panel::after {
          background: radial-gradient(circle, rgba(29,79,215,0.08), transparent 70%);
        }
        html[data-theme="light"] .hp-auth-scan::after {
          background: linear-gradient(90deg, transparent 0%, rgba(29,79,215,0.14) 40%, rgba(29,79,215,0.22) 50%, rgba(29,79,215,0.14) 60%, transparent 100%);
        }
        html[data-theme="light"] .hp-auth-watermark { color: rgba(15,30,51,0.045); }
        html[data-theme="light"] .hp-auth-title { color: #0f1e33; }
        html[data-theme="light"] .hp-auth-subtitle { color: rgba(22,38,63,0.66); }
        html[data-theme="light"] .hp-auth-label { color: rgba(22,38,63,0.58); }
        html[data-theme="light"] .hp-auth-input {
          background: #f1f5f9;
          border: 1px solid rgba(15,30,51,0.14);
          color: #0f1e33;
          caret-color: #1d4fd7;
        }
        html[data-theme="light"] .hp-auth-input::placeholder { color: rgba(22,38,63,0.35); }
        html[data-theme="light"] .hp-auth-input:focus {
          border-color: rgba(29,79,215,0.55);
          box-shadow: 0 0 0 3.5px rgba(29,79,215,0.10);
          background: #ffffff;
        }
        html[data-theme="light"] .hp-auth-remember { color: rgba(22,38,63,0.62); }
        html[data-theme="light"] .hp-auth-remember:hover { color: #0f1e33; }
        html[data-theme="light"] .hp-auth-forgot { color: #1d4fd7; }
        html[data-theme="light"] .hp-auth-forgot:hover { color: #0077b6; text-shadow: none; }
        html[data-theme="light"] .hp-auth-error {
          color: #8f1d1d;
          background: rgba(179,35,35,0.08);
          border-color: rgba(179,35,35,0.28);
        }
        html[data-theme="light"] .hp-turnstile-box {
          background: #f1f5f9;
          border-color: rgba(15,30,51,0.12);
        }
        html[data-theme="light"] .hp-auth-or-line { background: rgba(15,30,51,0.12); }
        html[data-theme="light"] .hp-auth-or-text { color: rgba(22,38,63,0.52); }
        html[data-theme="light"] .hp-auth-create {
          background: #ffffff;
          border-color: rgba(29,79,215,0.35);
          color: #1d4fd7;
        }
        html[data-theme="light"] .hp-auth-create:hover {
          background: rgba(29,79,215,0.07);
          border-color: rgba(29,79,215,0.60);
          box-shadow: 0 6px 22px rgba(29,79,215,0.14);
        }

        /* ── Divider + quick-access cards → light ── */
        html[data-theme="light"] .hp-divider-label { color: rgba(22,38,63,0.55); }
        html[data-theme="light"] .hp-divider-line { background: linear-gradient(90deg, rgba(15,30,51,0.18), transparent); }
        html[data-theme="light"] .hp-card {
          background: #ffffff;
          border-color: rgba(15,30,51,0.10);
          box-shadow: 0 6px 26px rgba(15,30,51,0.07);
        }
        html[data-theme="light"] .hp-card:hover {
          background: #ffffff;
          border-color: var(--accent-color);
          box-shadow: 0 16px 40px rgba(15,30,51,0.12), 0 0 24px var(--accent-alpha);
        }
        html[data-theme="light"] .hp-card-title { color: #0f1e33; }
        html[data-theme="light"] .hp-card-desc { color: rgba(22,38,63,0.70); }
        html[data-theme="light"] .hp-footer-bridge {
          background: linear-gradient(to bottom, rgba(234,239,245,0) 0%, rgba(234,239,245,1) 100%);
        }

        /* ── Theme-aware micro-controls (eye / captcha hints) ── */
        .hp-eye-btn { color: rgba(168,216,255,0.40); }
        .hp-eye-btn:hover { color: #A8D8FF; }
        .hp-captcha-hint { font-size: 12px; color: rgba(168,216,255,0.55); margin-top: 8px; text-align: center; }
        .hp-captcha-err { font-size: 12px; color: #ffb4a6; margin-top: 8px; text-align: center; max-width: 320px; }
        .hp-captcha-retry {
          background: none; border: none; color: #00c8e0; cursor: pointer;
          font-weight: 700; font-size: 12px; padding: 0; margin-left: 4px;
        }
        .hp-captcha-retry:hover { text-decoration: underline; }
        html[data-theme="light"] .hp-eye-btn { color: rgba(22,38,63,0.45); }
        html[data-theme="light"] .hp-eye-btn:hover { color: #0f1e33; }
        html[data-theme="light"] .hp-captcha-hint { color: rgba(22,38,63,0.62); }
        html[data-theme="light"] .hp-captcha-err { color: #8f1d1d; }
        html[data-theme="light"] .hp-captcha-retry { color: #1d4fd7; }
      `}</style>

      {/* ── Outermost wrapper ── */}
      <div
        style={{
          overflowX: "hidden",
          overflowY: "visible",
          width: "100%",
          maxWidth: "100vw",
          minHeight: "100vh",
          height: "auto",
        }}
      >
        <div className="hp-root">
          {/* ── Ticker + 911 badge ── */}
          <EmergencyRunner />
          {/* ── Spacer: navbar (70px) + ticker (34px) ── */}
          <div style={{ height: "104px", width: "100%", flexShrink: 0 }} />

          {/* ── Fixed background ── */}
          <div className="hp-bg">
            <img src={homepageBg} alt="" className="hp-bg-img" aria-hidden="true" />
            <div className="hp-bg-overlay" />
            <div className="hp-bg-atmosphere" />
            <div className="hp-bg-grain" />
          </div>

          <div className="hp-orb hp-orb-1" />
          <div className="hp-orb hp-orb-2" />
          <div className="hp-orb hp-orb-3" />

          <div className="hp-inner">
            {/* ── Hero ── */}
            <section className="hp-hero">
              <div className="hp-hero-copy">
                <h1>
                  {t("hero.titleLine1")}
                  <br />
                  <span className="accent">{t("hero.titleAccent")}</span> {t("hero.titleRest")}
                </h1>
                <p className="hp-hero-sub">{t("hero.subtitle")}</p>
                <Link to="/report" className="hp-hero-cta">
                  {t("hero.cta")}
                  <span className="hp-hero-cta-arrow">→</span>
                </Link>
                <div className="hp-stats" ref={statsRef}>
                  {STAT_META.map((s) => (
                    <StatCounter
                      key={s.key}
                      value={s.value}
                      label={t(`stats.${s.key}`)}
                      suffix={s.suffix}
                      start={statsVisible}
                    />
                  ))}
                </div>
              </div>

              {/* ── Auth Panel ── */}
              <div className="hp-auth-panel">
                <div className="hp-auth-scan" />
                <div className="hp-auth-watermark">
                  <FaShieldAlt />
                </div>
                <div className="hp-auth-title">{t("auth.welcomeTitle")}</div>
                <div className="hp-auth-subtitle">{t("auth.welcomeSubtitle")}</div>
                <div className="hp-auth-field">
                  <label className="hp-auth-label">{t("auth.emailLabel")}</label>
                  <input
                    className="hp-auth-input"
                    type="email"
                    placeholder=" "
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    autoComplete="email"
                    aria-label="Email address"
                  />
                </div>
                <div className="hp-auth-field">
                  <label className="hp-auth-label">{t("auth.passwordLabel")}</label>
                  <div style={{ position: "relative", width: "100%" }}>
                    <input
                      className="hp-auth-input"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                      onFocus={() => setFocusedField("password")}
                      onBlur={() => setFocusedField(null)}
                      autoComplete="current-password"
                      style={{ paddingRight: "42px" }}
                      aria-label="Password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="hp-eye-btn"
                      style={{
                        position: "absolute",
                        right: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        display: "flex",
                        alignItems: "center",
                        transition: "color 0.2s",
                      }}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <FaEyeSlash size={15} /> : <FaEye size={15} />}
                    </button>
                  </div>
                </div>
                <div className="hp-auth-row">
                  <label className="hp-auth-remember">
                    <input type="checkbox" aria-label="Remember me" /> {t("auth.rememberMe")}
                  </label>
                  <Link to="/forgot-password" className="hp-auth-forgot">
                    {t("auth.forgotPassword")}
                  </Link>
                </div>
                {error && (
                  <div className="hp-auth-error" role="alert" aria-live="polite">
                    ⚠ {error}
                  </div>
                )}
                {/* ── Turnstile CAPTCHA — loads only here, once per mount, full-width like login button ── */}
                <div className="my-3 flex flex-col items-center w-full">
                  <TurnstileWidget
                    key={turnstileKey}
                    className="hp-turnstile-box"
                    theme={isLight ? "light" : "dark"}
                    onToken={(token) => {
                      setCaptchaToken(token);
                      setCaptchaMsg("");
                      setCaptchaStatus("ready");
                    }}
                    onExpired={() => {
                      setCaptchaToken("");
                      setCaptchaMsg(t("auth.errNeedCaptcha"));
                      setTurnstileKey(k => k + 1);
                    }}
                    onError={(msg) => {
                      setCaptchaToken("");
                      setCaptchaStatus("error");
                      setCaptchaMsg(msg);
                    }}
                    onReady={() => setCaptchaStatus("ready")}
                  />
                  {captchaStatus === "loading" && !captchaToken && (
                    <div className="hp-captcha-hint">
                      {t("auth.errNeedCaptcha")}
                    </div>
                  )}
                  {captchaMsg && captchaStatus !== "loading" && (
                    <div className="hp-captcha-err">
                      {captchaMsg}{" "}
                      <button
                        type="button"
                        onClick={retryCaptcha}
                        className="hp-captcha-retry"
                      >
                        Retry
                      </button>
                    </div>
                  )}
                </div>
                <button
                  className="hp-auth-btn"
                  onClick={handleLogin}
                  disabled={loading}
                  aria-busy={loading}
                >
                  {loading ? t("auth.loggingIn") : t("auth.loginBtn")}
                </button>
                <div className="hp-auth-or">
                  <span className="hp-auth-or-line" />
                  <span className="hp-auth-or-text">{t("auth.noAccount")}</span>
                  <span className="hp-auth-or-line" />
                </div>
                <Link to="/signup" className="hp-auth-create">
                  {t("auth.createAccount")}
                </Link>
              </div>
            </section>

            {/* ── Quick Access Divider ── */}
            <div className="hp-divider">
              <span className="hp-divider-label">{t("common.quickAccess")}</span>
              <span className="hp-divider-line" />
            </div>

            {/* ── Cards Grid ── */}
            <div className="hp-grid">
              {CARD_META.map((card) => (
                <Link
                  key={card.to}
                  to={card.to}
                  className="hp-card"
                  style={{
                    "--accent-color": card.accent,
                    "--accent-alpha": `${card.accent}20`,
                  } as React.CSSProperties}
                >
                  <div className="hp-card-header">
                    <div className="hp-card-icon" aria-hidden="true">
                      {card.icon}
                    </div>
                    <span className="hp-card-tag">{t(`cards.${card.key}.tag`)}</span>
                  </div>
                  <div className="hp-card-title">{t(`cards.${card.key}.label`)}</div>
                  <div className="hp-card-desc">{t(`cards.${card.key}.desc`)}</div>
                  <div className="hp-card-action">
                    {t("common.explore")} <span aria-hidden="true">→</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="hp-footer-bridge" />
        </div>
      </div>
    </>
  );
}