// src/pages/Homepage.tsx
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { FaMapMarkedAlt, FaUsers, FaLightbulb, FaPhoneAlt, FaEye, FaEyeSlash, FaShieldAlt } from "react-icons/fa";
import { supabase } from "../js/supabase";
import homepageBg from "../assets/homepage.bg.jpg";

const cards = [
  {
    icon: <FaMapMarkedAlt size={28} />,
    label: "Safety Map",
    desc: "View live incident zones and safe routes",
    to: "/map",
    accent: "#00c8e0",
    tag: "LIVE",
  },
  {
    icon: <FaUsers size={28} />,
    label: "Directory",
    desc: "Barangay officials and contact persons",
    to: "/directory",
    accent: "#4A90D9",
    tag: "PEOPLE",
  },
  {
    icon: <FaLightbulb size={28} />,
    label: "Safety Tips",
    desc: "Preparedness guides for every situation",
    to: "/safetytips",
    accent: "#e8b830",
    tag: "TIPS",
  },
  {
    icon: <FaPhoneAlt size={28} />,
    label: "Emergency Contacts",
    desc: "Reach responders and hotlines instantly",
    to: "/resources",
    accent: "#e8372a",
    tag: "URGENT",
  },
];

const STATS = [
  { value: 30, label: "Barangays Covered", suffix: "" },
  { value: 24, label: "Hour Response",     suffix: "/7" },
  { value: 5,  label: "Avg. Response (min)", suffix: "m" },
];

const TICKER_ITEMS = [
  "🔴 STAY ALERT — Monitor local advisories",
  "📡 LIVE — Incident tracking active",
  "🚨 HOTLINE — Call 911 for emergencies",
  "🌧️ FLOOD — Check safe routes on the map",
  "🛡️ PREPARED — Review your barangay safety tips",
  "📍 REPORT — File incidents directly from your dashboard",
];

const ROLE_REDIRECT: Record<string, string> = {
  admin:     "/admin/dashboard",
  responder: "/responder/dashboard",
  citizen:   "/citizen/dashboard",
};

function useCounter(target: number, duration = 1800, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(ease * target));
      if (progress < 1) requestAnimationFrame(step);
      else setCount(target);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return count;
}

function StatCounter({ value, label, suffix, start }: { value: number; label: string; suffix: string; start: boolean }) {
  const count = useCounter(value, 1800, start);
  return (
    <div className="hp-stat">
      <div className="hp-stat-value">{count}<span className="hp-stat-suffix">{suffix}</span></div>
      <div className="hp-stat-label">{label}</div>
    </div>
  );
}

export default function Homepage() {
  const navigate = useNavigate();
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  // ── FIX: Track the auth listener separately to prevent redirect after logout ──
  const authListenerRef = useRef<any>(null);

  // ── Redirect already-authenticated users to their dashboard ──
  // FIXED: Only redirect on SIGNED_IN or INITIAL_SESSION events, NEVER on SIGNED_OUT
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // === CRITICAL FIX: Don't redirect on SIGNED_OUT ===
      if (event === "SIGNED_OUT") {
        return;
      }

      // Ignore token refresh events
      if (event === "TOKEN_REFRESHED") return;

      // Only redirect when user is signing in or has an existing session
      if (event !== "SIGNED_IN" && event !== "INITIAL_SESSION") return;

      // Make sure there's actually a user
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
        } else if (role) {
          navigate("/citizen/dashboard", { replace: true });
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    });

    authListenerRef.current = subscription;
    return () => {
      if (authListenerRef.current) {
        authListenerRef.current.unsubscribe();
      }
    };
  }, [navigate]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.4 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) { 
      setError("Please enter your email and password."); 
      return; 
    }
    setLoading(true); 
    setError(null);

    try {
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({ email, password });

      if (authError || !authData.user) {
        setError(authError?.message || "Login failed.");
        setLoading(false); 
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authData.user.id)
        .single();

      if (profileError || !profile?.role) {
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
        setLoading(false);
        navigate(ROLE_REDIRECT[role] ?? "/citizen/dashboard", { replace: true });
        return;
      }

      const role = profile.role.trim().toLowerCase();
      setLoading(false);
      navigate(ROLE_REDIRECT[role] ?? "/citizen/dashboard", { replace: true });
    } catch (err: any) {
      setError(err.message || "Login failed.");
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');

        .hp-root {
          min-height: 100vh;
          font-family: 'DM Sans', sans-serif;
          color: #ddeef8;
          overflow-x: hidden;
          position: relative;
          width: 100%;
          max-width: 100vw;
        }

        .hp-bg {
          position: fixed; inset: 0; z-index: -1;
          overflow: hidden;
        }
        .hp-bg-img {
          width: 100%; height: 100%;
          object-fit: cover; object-position: center bottom; display: block;
          transform-origin: center center;
          animation: bgDrift 28s ease-in-out infinite;
          will-change: transform;
        }
        .hp-bg-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(
            180deg,
            rgba(7,16,29,0.85) 0%,
            rgba(7,16,29,0.70) 40%,
            rgba(7,16,29,0.85) 75%,
            rgba(7,16,29,0.97) 100%
          );
        }
        .hp-bg-atmosphere {
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 60% 50% at 10% 0%,  rgba(232,55,42,0.11)  0%, transparent 65%),
            radial-gradient(ellipse 55% 60% at 90% 100%, rgba(0,200,224,0.08)  0%, transparent 70%),
            radial-gradient(ellipse 40% 40% at 55% 45%,  rgba(13,27,46,0.45)   0%, transparent 60%);
          pointer-events: none;
        }
        .hp-bg-grain {
          position: absolute; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
          background-size: 200px; opacity: 0.45; pointer-events: none;
        }

        @keyframes bgDrift {
          0%   { transform: scale(1.08) translate(0px, 0px); }
          25%  { transform: scale(1.12) translate(-18px, -10px); }
          50%  { transform: scale(1.10) translate(-8px, -20px); }
          75%  { transform: scale(1.13) translate(12px, -8px); }
          100% { transform: scale(1.08) translate(0px, 0px); }
        }

        .hp-orb {
          position: fixed; border-radius: 50%; pointer-events: none; z-index: 0;
          animation: orbDrift linear infinite;
        }
        .hp-orb-1 {
          width: 320px; height: 320px;
          background: radial-gradient(circle, rgba(232,55,42,0.06) 0%, transparent 70%);
          top: 10%; left: -8%;
          animation-duration: 22s;
        }
        .hp-orb-2 {
          width: 260px; height: 260px;
          background: radial-gradient(circle, rgba(0,200,224,0.06) 0%, transparent 70%);
          bottom: 20%; right: -6%;
          animation-duration: 28s; animation-delay: -10s;
        }
        .hp-orb-3 {
          width: 180px; height: 180px;
          background: radial-gradient(circle, rgba(74,144,217,0.05) 0%, transparent 70%);
          top: 55%; left: 40%;
          animation-duration: 18s; animation-delay: -5s;
        }
        @keyframes orbDrift {
          0%   { transform: translate(0, 0) scale(1); }
          33%  { transform: translate(20px, -30px) scale(1.05); }
          66%  { transform: translate(-15px, 20px) scale(0.97); }
          100% { transform: translate(0, 0) scale(1); }
        }

        .hp-badge-row {
          display: flex; justify-content: flex-end; align-items: center;
          padding: 16px 0 0 0; position: relative; z-index: 2;
          animation: fadeDown 0.6s ease both;
          width: 100%; max-width: 100%; box-sizing: border-box;
        }
        .hp-badge-slot { width: auto; max-width: 340px; flex-shrink: 1; min-width: 0; }
        .hp-nav-badge {
          display: inline-flex; align-items: center; justify-content: center; gap: 10px;
          width: 100%; padding: 11px 18px;
          background: rgba(8,18,32,0.70);
          border: 1px solid rgba(232,55,42,0.35);
          border-radius: 999px;
          backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
          text-decoration: none; cursor: pointer;
          box-shadow: 0 0 0 1px rgba(232,55,42,0.10), 0 0 20px rgba(232,55,42,0.15), inset 0 1px 0 rgba(255,255,255,0.05);
          transition: background 0.25s, border-color 0.25s, box-shadow 0.25s, transform 0.2s;
          -webkit-tap-highlight-color: transparent;
          position: relative; overflow: hidden;
          box-sizing: border-box; white-space: nowrap;
        }
        .hp-nav-badge::before {
          content: ''; position: absolute; top: 0; left: -75%;
          width: 50%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
          transform: skewX(-20deg); transition: left 0.5s ease;
        }
        .hp-nav-badge:hover::before { left: 140%; }
        .hp-nav-badge:hover {
          background: rgba(12,24,42,0.88);
          border-color: rgba(232,55,42,0.65);
          box-shadow: 0 0 0 1px rgba(232,55,42,0.20), 0 0 28px rgba(232,55,42,0.30), 0 0 60px rgba(232,55,42,0.10), inset 0 1px 0 rgba(255,255,255,0.07);
          transform: translateY(-1px) scale(1.02);
        }
        .hp-nav-badge:active { transform: scale(0.97); }

        .hp-badge-icon {
          display: flex; align-items: center; justify-content: center;
          width: 26px; height: 26px; border-radius: 50%;
          background: rgba(232,55,42,0.15); border: 1px solid rgba(232,55,42,0.30);
          color: #e8372a; font-size: 12px; flex-shrink: 0;
          position: relative;
          animation: ringShake 3s ease-in-out infinite;
        }
        .hp-badge-icon::before,
        .hp-badge-icon::after {
          content: ''; position: absolute; inset: -4px;
          border-radius: 50%; border: 1px solid rgba(232,55,42,0.4);
          animation: badgePulse 2s ease-out infinite;
        }
        .hp-badge-icon::after { inset: -8px; animation-delay: 0.5s; border-color: rgba(232,55,42,0.2); }

        @keyframes badgePulse {
          0%   { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes ringShake {
          0%, 85%, 100% { transform: rotate(0deg); }
          88%           { transform: rotate(-15deg); }
          91%           { transform: rotate(15deg); }
          94%           { transform: rotate(-10deg); }
          97%           { transform: rotate(8deg); }
        }

        .hp-badge-text {
          font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 400;
          letter-spacing: 0.06em; color: rgba(200,225,245,0.65);
        }
        .hp-badge-sep { width: 1px; height: 14px; background: rgba(232,55,42,0.25); flex-shrink: 0; }
        .hp-badge-911 {
          font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 800;
          letter-spacing: 0.08em; color: #e8372a;
          animation: glowPulse 1.8s ease-in-out infinite;
        }
        @keyframes glowPulse {
          0%, 100% { text-shadow: 0 0 6px rgba(232,55,42,0.4); opacity: 1; }
          50%       { text-shadow: 0 0 14px rgba(232,55,42,0.9), 0 0 28px rgba(232,55,42,0.4); opacity: 0.9; }
        }

        @media (max-width: 860px) { .hp-badge-slot { width: 100%; max-width: none; } }

        .hp-inner {
          position: relative; z-index: 1;
          max-width: 1100px; margin: 0 auto;
          padding: 0 24px 0; width: 100%; box-sizing: border-box;
        }

        .hp-hero {
          margin-top: 40px; margin-bottom: 72px;
          display: grid; grid-template-columns: 1fr 400px;
          gap: 48px; align-items: center;
          animation: fadeUp 0.7s 0.1s ease both;
        }
        @media (max-width: 860px) {
          .hp-hero { grid-template-columns: 1fr; }
          .hp-auth-panel { order: -1; }
        }

        .hp-hero-eyebrow {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px; font-weight: 500; letter-spacing: 0.20em; text-transform: uppercase;
          color: #e8372a; margin-bottom: 20px;
          display: flex; align-items: center; gap: 10px;
        }
        .hp-hero-eyebrow::after {
          content: ''; display: block; width: 40px; height: 1px;
          background: #e8372a; opacity: 0.5;
        }

        .hp-hero h1 {
          font-family: 'Syne', sans-serif;
          font-size: clamp(42px, 6vw, 78px);
          font-weight: 800;
          line-height: 0.95;
          letter-spacing: -0.03em;
          color: #F8FAFC;
          margin-bottom: 24px;
        }
        .hp-hero h1 .accent {
          color: #A8D8FF;
        }

        .hp-hero-sub {
          font-size: 16px; font-weight: 300;
          color: rgba(168, 216, 255, 0.70);
          max-width: 400px; line-height: 1.65; margin-bottom: 36px;
        }

        .hp-hero-cta {
          display: inline-flex; align-items: center; gap: 12px;
          background: #e8372a; color: #fff; text-decoration: none;
          font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700;
          letter-spacing: 0.06em; text-transform: uppercase;
          padding: 14px 28px; border-radius: 4px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          box-shadow: 0 0 30px rgba(232,55,42,0.28);
          position: relative; overflow: hidden;
        }
        .hp-hero-cta::after {
          content: '';
          position: absolute; top: 0; left: -100%;
          width: 60%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
          transform: skewX(-20deg);
          animation: ctaShimmer 3s ease-in-out infinite;
        }
        @keyframes ctaShimmer {
          0%   { left: -100%; }
          40%  { left: 140%; }
          100% { left: 140%; }
        }
        .hp-hero-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 50px rgba(232,55,42,0.55), 0 4px 24px rgba(232,55,42,0.35);
          background: #f04438;
        }
        .hp-hero-cta-arrow { transition: transform 0.2s ease; }
        .hp-hero-cta:hover .hp-hero-cta-arrow { transform: translateX(4px); }

        .hp-stats {
          display: flex; align-items: center; gap: 0;
          margin-top: 48px;
          border: 1px solid rgba(0,200,224,0.10);
          border-radius: 12px;
          background: rgba(7,16,29,0.50);
          backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
          overflow: hidden;
        }
        .hp-stat {
          flex: 1; padding: 20px 24px; text-align: center;
          position: relative;
        }
        .hp-stat + .hp-stat::before {
          content: ''; position: absolute; left: 0; top: 20%; bottom: 20%;
          width: 1px; background: rgba(0,200,224,0.10);
        }
        .hp-stat-value {
          font-family: 'Syne', sans-serif;
          font-size: 32px; font-weight: 800;
          color: #F8FAFC; line-height: 1;
          margin-bottom: 6px;
        }
        .hp-stat-suffix {
          font-size: 18px; color: #A8D8FF; margin-left: 2px;
        }
        .hp-stat-label {
          font-size: 11px; font-weight: 400; letter-spacing: 0.08em;
          text-transform: uppercase; color: rgba(168,216,255,0.45);
        }

        .hp-auth-panel {
          background: rgba(13,27,46,0.78);
          border: 1px solid rgba(0,200,224,0.14);
          border-radius: 16px; padding: 32px 28px 28px;
          backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
          position: relative; overflow: hidden;
          box-shadow: 0 0 40px rgba(7,16,29,0.5), inset 0 0 40px rgba(0,200,224,0.02);
        }
        .hp-auth-panel::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, #e8372a, #00c8e0, transparent);
          border-radius: 16px 16px 0 0;
        }
        .hp-auth-panel::after {
          content: ''; position: absolute; top: -40px; right: -40px;
          width: 120px; height: 120px; border-radius: 50%;
          background: radial-gradient(circle, rgba(0,200,224,0.10), transparent 70%);
          pointer-events: none;
        }
        .hp-auth-scan {
          position: absolute; top: 0; left: 0; right: 0; height: 100%;
          pointer-events: none; overflow: hidden; border-radius: 16px;
          z-index: 0;
        }
        .hp-auth-scan::after {
          content: '';
          position: absolute; left: 0; right: 0; top: -4px; height: 3px;
          background: linear-gradient(90deg, transparent 0%, rgba(0,200,224,0.18) 40%, rgba(0,200,224,0.35) 50%, rgba(0,200,224,0.18) 60%, transparent 100%);
          animation: scanLine 5s ease-in-out infinite;
          filter: blur(1px);
        }
        @keyframes scanLine {
          0%   { top: 0%; opacity: 0; }
          5%   { opacity: 1; }
          95%  { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }

        .hp-auth-watermark {
          position: absolute; bottom: -20px; right: -20px;
          font-size: 120px; color: rgba(0,200,224,0.025);
          pointer-events: none; z-index: 0;
          line-height: 1;
        }

        .hp-auth-panel > *:not(.hp-auth-scan):not(.hp-auth-watermark) {
          position: relative; z-index: 1;
        }

        .hp-auth-title {
          font-family: 'Syne', sans-serif;
          font-size: 22px; font-weight: 800;
          color: #F8FAFC;
          margin-bottom: 4px;
        }
        .hp-auth-subtitle {
          font-size: 13px; font-weight: 300;
          color: rgba(168,216,255,0.55);
          margin-bottom: 24px; line-height: 1.5;
        }

        .hp-auth-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
        .hp-auth-label {
          font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 500;
          letter-spacing: 0.10em; text-transform: uppercase;
          color: rgba(168,216,255,0.45);
        }
        .hp-auth-input {
          background: #060f1c; border: 1px solid rgba(0,200,224,0.10);
          border-radius: 8px; padding: 11px 14px;
          font-family: 'DM Sans', sans-serif; font-size: 14px; color: #c8e4f4;
          outline: none; caret-color: #00c8e0;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s;
          width: 100%; box-sizing: border-box;
        }
        .hp-auth-input::placeholder { color: rgba(160,200,224,0.18); }
        .hp-auth-input:focus {
          border-color: rgba(0,200,224,0.40);
          box-shadow: 0 0 0 3px rgba(0,200,224,0.07);
          background: rgba(0,200,224,0.02);
        }

        .hp-auth-row {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 20px;
        }
        .hp-auth-remember {
          display: flex; align-items: center; gap: 7px;
          font-size: 12px; color: rgba(168,216,255,0.40);
          cursor: pointer; user-select: none;
        }
        .hp-auth-remember input[type="checkbox"] {
          accent-color: #e8372a; width: 13px; height: 13px; cursor: pointer;
        }
        .hp-auth-forgot {
          font-size: 12px; color: rgba(168,216,255,0.75); text-decoration: none;
          transition: color 0.2s;
        }
        .hp-auth-forgot:hover { color: #A8D8FF; }

        .hp-auth-error {
          font-size: 12px; color: #e8372a;
          background: rgba(232,55,42,0.08);
          border: 1px solid rgba(232,55,42,0.22);
          border-radius: 6px; padding: 9px 12px;
          margin-bottom: 14px; line-height: 1.4;
          animation: errShake 0.35s ease;
        }
        @keyframes errShake {
          0%,100% { transform: translateX(0); }
          20%     { transform: translateX(-5px); }
          40%     { transform: translateX(5px); }
          60%     { transform: translateX(-3px); }
          80%     { transform: translateX(3px); }
        }

        .hp-auth-btn {
          width: 100%; padding: 13px; border: none; border-radius: 8px;
          background: #e8372a; color: #fff;
          font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700;
          letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s;
          box-shadow: 0 0 24px rgba(232,55,42,0.22);
          position: relative; overflow: hidden;
        }
        .hp-auth-btn::after {
          content: '';
          position: absolute; top: 0; left: -100%; width: 60%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
          transform: skewX(-20deg);
          transition: left 0.4s ease;
        }
        .hp-auth-btn:hover:not(:disabled)::after { left: 140%; }
        .hp-auth-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 0 36px rgba(232,55,42,0.50);
          background: #f04438;
        }
        .hp-auth-btn:disabled { opacity: 0.45; cursor: not-allowed; }

        .hp-auth-or {
          display: flex; align-items: center; gap: 12px; margin: 18px 0;
        }
        .hp-auth-or-line { flex: 1; height: 1px; background: rgba(0,200,224,0.10); }
        .hp-auth-or-text {
          font-size: 11px; letter-spacing: 0.10em; text-transform: uppercase;
          color: rgba(168,216,255,0.30); white-space: nowrap;
        }

        .hp-auth-create {
          display: block; width: 100%; padding: 13px;
          border: 1px solid rgba(168,216,255,0.28);
          border-radius: 8px; background: rgba(168,216,255,0.05);
          color: #A8D8FF;
          font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700;
          letter-spacing: 0.08em; text-transform: uppercase;
          text-align: center; text-decoration: none;
          transition: background 0.2s, border-color 0.2s, transform 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }
        .hp-auth-create:hover {
          background: rgba(168,216,255,0.10);
          border-color: rgba(168,216,255,0.50);
          transform: translateY(-1px);
          box-shadow: 0 0 20px rgba(168,216,255,0.12);
        }

        .hp-divider {
          display: flex; align-items: center; gap: 16px;
          margin-bottom: 40px;
          animation: fadeUp 0.7s 0.2s ease both;
        }
        .hp-divider-label {
          font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 500;
          letter-spacing: 0.18em; text-transform: uppercase;
          color: rgba(168,216,255,0.35); white-space: nowrap;
        }
        .hp-divider-line {
          flex: 1; height: 1px;
          background: linear-gradient(90deg, rgba(168,216,255,0.18), transparent);
        }

        .hp-grid {
          display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;
        }
        @media (max-width: 600px) { .hp-grid { grid-template-columns: 1fr; } }

        .hp-card {
          position: relative;
          background: rgba(13,27,46,0.60);
          border: 1px solid rgba(0,200,224,0.09);
          border-radius: 12px; padding: 28px;
          text-decoration: none; color: inherit;
          display: flex; flex-direction: column; gap: 12px;
          overflow: hidden;
          transition: transform 0.25s ease, border-color 0.25s ease, background 0.25s ease, box-shadow 0.25s ease;
          animation: fadeUp 0.6s ease both;
          cursor: pointer;
          backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
        }
        .hp-card:nth-child(1) { animation-delay: 0.25s; }
        .hp-card:nth-child(2) { animation-delay: 0.32s; }
        .hp-card:nth-child(3) { animation-delay: 0.39s; }
        .hp-card:nth-child(4) { animation-delay: 0.46s; }

        .hp-card::before {
          content: ''; position: absolute; inset: 0;
          background: radial-gradient(ellipse 80% 60% at 10% 0%, var(--accent-alpha), transparent 70%);
          opacity: 0; transition: opacity 0.3s ease;
        }
        .hp-card::after {
          content: ''; position: absolute; top: 0; left: 20%; right: 20%; height: 1px;
          background: linear-gradient(90deg, transparent, var(--accent-color), transparent);
          opacity: 0; transition: opacity 0.35s ease;
          border-radius: 1px;
        }
        .hp-card:hover {
          transform: translateY(-6px) scale(1.01);
          border-color: var(--accent-color);
          background: rgba(13,27,46,0.85);
          box-shadow: 0 12px 40px rgba(0,0,0,0.4), 0 0 28px var(--accent-alpha);
        }
        .hp-card:hover::before { opacity: 1; }
        .hp-card:hover::after  { opacity: 1; }

        .hp-card-header {
          display: flex; align-items: center; justify-content: space-between;
        }
        .hp-card-icon {
          width: 52px; height: 52px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          color: var(--accent-color);
          background: var(--accent-alpha); border: 1px solid var(--accent-color);
          flex-shrink: 0; position: relative; z-index: 1;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .hp-card:hover .hp-card-icon {
          transform: scale(1.08);
          box-shadow: 0 0 16px var(--accent-alpha);
        }
        .hp-card-tag {
          font-family: 'DM Sans', sans-serif; font-size: 9px; font-weight: 700;
          letter-spacing: 0.15em; color: var(--accent-color);
          border: 1px solid var(--accent-color);
          border-radius: 3px; padding: 3px 7px; opacity: 0.7;
          position: relative; z-index: 1;
        }
        .hp-card-title {
          font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 700;
          color: #F8FAFC; position: relative; z-index: 1;
        }
        .hp-card-desc {
          font-size: 13px; font-weight: 300;
          color: rgba(168,216,255,0.55); line-height: 1.55;
          position: relative; z-index: 1; flex: 1;
        }
        .hp-card-action {
          display: flex; align-items: center; gap: 6px;
          font-size: 12px; font-weight: 500; letter-spacing: 0.05em;
          color: var(--accent-color); position: relative; z-index: 1; margin-top: 4px;
          transition: gap 0.2s ease;
        }
        .hp-card:hover .hp-card-action { gap: 10px; }

        .hp-ticker {
          margin-top: 16px; margin-bottom: 0;
          border: 1px solid rgba(168,216,255,0.10);
          border-radius: 10px;
          background: rgba(7,16,29,0.65);
          backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
          padding: 11px 0;
          display: flex; align-items: center;
          overflow: hidden; position: relative;
        }
        .hp-ticker-label {
          flex-shrink: 0;
          font-family: 'Syne', sans-serif; font-size: 9px; font-weight: 800;
          letter-spacing: 0.18em; text-transform: uppercase;
          color: #e8372a; padding: 0 20px;
          border-right: 1px solid rgba(232,55,42,0.25);
          margin-right: 20px;
          background: rgba(7,16,29,0.60);
          position: relative; z-index: 2;
        }
        .hp-ticker-track {
          display: flex; gap: 64px; align-items: center;
          animation: tickerScroll 28s linear infinite;
          white-space: nowrap;
        }
        .hp-ticker:hover .hp-ticker-track { animation-play-state: paused; }
        @keyframes tickerScroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .hp-ticker-item {
          font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 400;
          letter-spacing: 0.04em; color: rgba(168,216,255,0.50);
          flex-shrink: 0;
        }
        .hp-ticker-dot {
          width: 4px; height: 4px; border-radius: 50%;
          background: rgba(168,216,255,0.3); flex-shrink: 0;
        }

        .hp-footer-bridge {
          height: 48px;
          background: linear-gradient(to bottom, rgba(4,16,28,0) 0%, rgba(4,16,28,1) 100%);
          pointer-events: none; position: relative; z-index: 1;
        }

        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="hp-root">

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

          <div className="hp-ticker">
            <div className="hp-ticker-label">LIVE</div>
            <div className="hp-ticker-track">
              {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
                <>
                  <span key={i} className="hp-ticker-item">{item}</span>
                  <span className="hp-ticker-dot" />
                </>
              ))}
            </div>
          </div>

          <div className="hp-badge-row">
            <div className="hp-badge-slot">
              <a href="tel:911" className="hp-nav-badge">
                <span className="hp-badge-icon">
                  <FaPhoneAlt size={11} />
                </span>
                <span className="hp-badge-text">Emergency</span>
                <span className="hp-badge-sep" />
                <span className="hp-badge-911">911</span>
              </a>
            </div>
          </div>

          <section className="hp-hero">
            <div className="hp-hero-copy">
              <div className="hp-hero-eyebrow">Community Safety Platform</div>

              <h1>
                Emergency<br />
                <span className="accent">Response</span> at Your Fingertips
              </h1>

              <p className="hp-hero-sub">
                A centralized safety platform for the City of Gentle People. Fast access
                to hotlines, facilities, and safety guidelines.
              </p>

              <Link to="/report" className="hp-hero-cta">
                Report an Incident
                <span className="hp-hero-cta-arrow">→</span>
              </Link>

              <div className="hp-stats" ref={statsRef}>
                {STATS.map((s) => (
                  <StatCounter key={s.label} value={s.value} label={s.label} suffix={s.suffix} start={statsVisible} />
                ))}
              </div>
            </div>

            <div className="hp-auth-panel">
              <div className="hp-auth-scan" />
              <div className="hp-auth-watermark">
                <FaShieldAlt />
              </div>

              <div className="hp-auth-title">Welcome Back</div>
              <div className="hp-auth-subtitle">
                Login to access the DumaSafeGuide emergency dashboard.
              </div>

              <div className="hp-auth-field">
                <label className="hp-auth-label">Email Address</label>
                <input
                  className="hp-auth-input" type="email" placeholder="you@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>

              <div className="hp-auth-field">
                <label className="hp-auth-label">Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    className="hp-auth-input"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    autoComplete="current-password"
                    style={{ paddingRight: "42px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    style={{
                      position: "absolute", right: "12px", top: "50%",
                      transform: "translateY(-50%)", background: "none",
                      border: "none", cursor: "pointer", padding: 0,
                      display: "flex", alignItems: "center",
                      color: "rgba(168,216,255,0.40)", transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#A8D8FF")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(168,216,255,0.40)")}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <FaEyeSlash size={15} /> : <FaEye size={15} />}
                  </button>
                </div>
              </div>

              <div className="hp-auth-row">
                <label className="hp-auth-remember">
                  <input type="checkbox" /> Remember me
                </label>
                <Link to="/forgot-password" className="hp-auth-forgot">
                  Forgot Password?
                </Link>
              </div>

              {error && <div className="hp-auth-error">⚠ {error}</div>}

              <button className="hp-auth-btn" onClick={handleLogin} disabled={loading}>
                {loading ? "Signing in…" : "Login Account"}
              </button>

              <div className="hp-auth-or">
                <span className="hp-auth-or-line" />
                <span className="hp-auth-or-text">No account yet?</span>
                <span className="hp-auth-or-line" />
              </div>

              <Link to="/signup" className="hp-auth-create">
                Create Account →
              </Link>
            </div>
          </section>

          <div className="hp-divider">
            <span className="hp-divider-label">Quick Access</span>
            <span className="hp-divider-line" />
          </div>

          <div className="hp-grid">
            {cards.map((card) => (
              <Link
                key={card.to} to={card.to} className="hp-card"
                style={{
                  "--accent-color": card.accent,
                  "--accent-alpha": `${card.accent}20`,
                } as React.CSSProperties}
              >
                <div className="hp-card-header">
                  <div className="hp-card-icon">{card.icon}</div>
                  <span className="hp-card-tag">{card.tag}</span>
                </div>
                <div className="hp-card-title">{card.label}</div>
                <div className="hp-card-desc">{card.desc}</div>
                <div className="hp-card-action">Explore <span>→</span></div>
              </Link>
            ))}
          </div>

        </div>

        <div className="hp-footer-bridge" />

      </div>
    </>
  );
}