import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../js/supabase';
import logoImage from '../assets/dsg.logo.png';
import directorybg from '../assets/directorybg.png';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

type IconName = 'mail' | 'chevron-left' | 'shield-check' | 'key-round' | 'lock';

const Icon = ({ name, size = 18, className, style }: {
  name: IconName;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) => {
  const paths: Record<IconName, React.ReactNode> = {
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    'chevron-left': <path d="m15 18-6-6 6-6" />,
    'shield-check': <><path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></>,
    'key-round': <><circle cx="8" cy="15" r="3" /><path d="m10.5 12.5 7-7M15 6l2 2m-5 2 2 2" /></>,
    lock: <><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style} aria-hidden="true">{paths[name]}</svg>;
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin:0; padding:0; }
  .fp-root {
    min-height: 100vh;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Inter', sans-serif;
    padding: 24px; position: relative; overflow: hidden;
  }
  .fp-root::after {
    content: ''; position: fixed; inset:0; z-index:0;
    background-image: var(--bg-image); background-size: cover; background-position: center;
    background-attachment: fixed; opacity: 0.12; pointer-events: none;
  }
  .fp-root::before {
    content: ''; position: fixed; inset:0; z-index:0;
    background-image:
      radial-gradient(circle at 20% 20%, rgba(0,200,224,0.10) 0%, transparent 50%),
      radial-gradient(circle at 80% 80%, rgba(232,55,42,0.08) 0%, transparent 50%);
    animation: fpDrift 25s ease-in-out infinite; pointer-events:none;
  }
  @keyframes fpDrift { 0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.85;transform:scale(1.02)} }
  .fp-page {
    position:relative; z-index:1; width:100%; max-width:1080px;
    display:grid; grid-template-columns:1.1fr 440px; gap:0;
    background: rgba(13,27,46,0.72); border-radius:24px;
    border:1px solid rgba(0,200,224,0.18);
    box-shadow: 0 0 80px rgba(0,200,224,0.10), 0 25px 80px rgba(7,16,29,0.65), inset 0 1px 0 rgba(0,200,224,0.08);
    overflow:hidden; min-height:620px; backdrop-filter:blur(24px); -webkit-backdrop-filter:blur(24px);
    animation: fpSlideUp .7s cubic-bezier(.22,1,.36,1) both;
  }
  @keyframes fpSlideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  .fp-brand-panel {
    position:relative; display:flex; flex-direction:column; justify-content:space-between;
    padding:60px 56px;
    background: linear-gradient(135deg, rgba(10,37,64,0.88) 0%, rgba(13,27,46,0.82) 50%, rgba(5,26,36,0.88) 100%);
    overflow:hidden;
  }
  .fp-brand-panel-bg { position:absolute; inset:0; z-index:0; background-size:cover; background-position:center; opacity:0.02; }
  .fp-brand-panel::after { content:''; position:absolute; inset:0; z-index:0; background: radial-gradient(ellipse 90% 110% at 50% -10%, rgba(0,200,224,0.10) 0%, transparent 60%); }
  .fp-panel-geo { position:absolute; z-index:1; bottom:-100px; right:-100px; width:360px; height:360px; border-radius:50%; border:60px solid rgba(0,200,224,0.06); box-shadow:0 0 60px rgba(0,200,224,0.08); animation: fpGeo 8s ease-in-out infinite; }
  .fp-panel-geo-2 { position:absolute; z-index:1; top:-60px; left:-60px; width:240px; height:240px; border-radius:50%; border:40px solid rgba(232,55,42,0.04); animation: fpGeo 10s 1s ease-in-out infinite reverse; }
  @keyframes fpGeo { 0%,100%{transform:scale(1);opacity:.6}50%{transform:scale(1.15);opacity:.9} }
  .fp-brand-top{position:relative;z-index:2}
  .fp-brand-logo{display:flex;align-items:center;gap:14px;margin-bottom:64px;animation: fpDown .6s cubic-bezier(.22,1,.36,1) both}
  @keyframes fpDown{from{opacity:0;transform:translateY(-16px)}to{opacity:1;transform:translateY(0)}}
  .fp-brand-logo-img{width:48px;height:48px;background:linear-gradient(135deg,rgba(0,200,224,0.18),rgba(232,55,42,0.12));border:1.5px solid rgba(0,200,224,0.25);border-radius:14px;padding:10px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 24px rgba(0,200,224,0.12);transition:all .3s ease}
  .fp-brand-logo:hover .fp-brand-logo-img{transform:scale(1.08) rotate(-4deg);box-shadow:0 0 32px rgba(0,200,224,0.18)}
  .fp-brand-logo-img img{width:100%;height:100%;object-fit:contain}
  .fp-brand-logo-name{font-family:'Poppins',sans-serif;font-size:17px;font-weight:700;color:#f8fafc;letter-spacing:-0.02em}
  .fp-brand-logo-name span{color:#00c8e0}
  .fp-brand-headline{font-family:'Poppins',sans-serif;font-size:36px;font-weight:700;color:#f8fafc;line-height:1.08;letter-spacing:-0.025em;margin-bottom:20px;animation: fpUp .7s .1s cubic-bezier(.22,1,.36,1) both}
  @keyframes fpUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
  .fp-brand-headline .accent{color:#00c8e0}
  .fp-brand-desc{font-family:'Inter',sans-serif;font-size:14.5px;font-weight:400;color:rgba(200,228,244,0.52);line-height:1.8;max-width:340px;animation:fpUp .7s .15s cubic-bezier(.22,1,.36,1) both}
  .fp-brand-bottom{position:relative;z-index:2}
  .fp-brand-stats{display:flex;gap:36px;margin-bottom:32px;animation:fpUp .7s .25s cubic-bezier(.22,1,.36,1) both}
  .fp-brand-stat-val{font-family:'Poppins',sans-serif;font-size:28px;font-weight:700;color:#f8fafc;line-height:1;margin-bottom:5px}
  .fp-brand-stat-val em{color:#00c8e0;font-style:normal}
  .fp-brand-stat-label{font-family:'Inter',sans-serif;font-size:10.5px;font-weight:600;color:rgba(168,216,255,0.38);text-transform:uppercase;letter-spacing:.12em}
  .fp-brand-divider{height:1px;background:linear-gradient(90deg,rgba(0,200,224,0.12),transparent);margin-bottom:26px}
  .fp-brand-badge{display:inline-flex;align-items:center;gap:9px;font-family:'Inter',sans-serif;font-size:12px;color:rgba(168,216,255,0.50);animation:fpUp .7s .35s cubic-bezier(.22,1,.36,1) both}
  .fp-brand-badge-dot{width:8px;height:8px;border-radius:50%;background:#00c8e0;flex-shrink:0;box-shadow:0 0 10px rgba(0,200,224,0.80);animation: fp-pulse 2.2s ease-in-out infinite}
  @keyframes fp-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(.75)}}
  .fp-form-panel{display:flex;flex-direction:column;justify-content:center;padding:56px 48px;background:rgba(13,27,46,0.72);border-left:1px solid rgba(0,200,224,0.12);position:relative}
  .fp-form-panel::before{content:'';position:absolute;top:-150px;right:-150px;width:400px;height:400px;background:radial-gradient(circle,rgba(0,200,224,0.06),transparent 70%);border-radius:50%;pointer-events:none;filter:blur(40px)}
  .fp-back{display:inline-flex;align-items:center;gap:6px;font-family:'Inter',sans-serif;font-size:11.5px;font-weight:600;color:rgba(168,216,255,0.45);text-decoration:none;transition:color .2s ease;margin-bottom:28px;position:relative;z-index:1;width:fit-content;animation: fpUp .5s .05s cubic-bezier(.22,1,.36,1) both}
  .fp-back:hover{color:#00c8e0}
  .fp-back-arrow{font-size:13px;transition:transform .2s ease;line-height:1}
  .fp-back:hover .fp-back-arrow{transform:translateX(-3px)}
  .fp-form-header{margin-bottom:28px;position:relative;z-index:1;animation:fpUp .6s .1s cubic-bezier(.22,1,.36,1) both}
  .fp-form-eyebrow{font-family:'Inter',sans-serif;font-size:10px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:#00c8e0;margin-bottom:14px;display:flex;align-items:center;gap:9px}
  .fp-form-eyebrow::before{content:'';width:6px;height:6px;border-radius:50%;background:#00c8e0;opacity:0.7;animation:fp-pulse 2.2s ease-in-out infinite}
  .fp-form-title{font-family:'Poppins',sans-serif;font-size:26px;font-weight:700;color:#f8fafc;letter-spacing:-0.025em;margin-bottom:7px}
  .fp-form-sub{font-family:'Inter',sans-serif;font-size:13.5px;font-weight:400;color:rgba(168,216,255,0.52);line-height:1.6}
  .fp-rule{height:1px;background:linear-gradient(90deg,rgba(0,200,224,0.10),transparent);margin-bottom:28px;position:relative;z-index:1}
  .fp-error{display:flex;align-items:flex-start;gap:11px;background:rgba(232,55,42,0.12);border:1px solid rgba(232,55,42,0.28);border-radius:12px;padding:13px 15px;font-family:'Inter',sans-serif;font-size:12.5px;color:#ff7f6b;margin-bottom:18px;animation:fpShake .35s ease;position:relative;z-index:1}
  .fp-success-msg{display:flex;align-items:flex-start;gap:11px;background:rgba(0,200,224,0.10);border:1px solid rgba(0,200,224,0.28);border-radius:12px;padding:13px 15px;font-family:'Inter',sans-serif;font-size:12.5px;color:#7dd8ff;margin-bottom:18px;position:relative;z-index:1}
  @keyframes fpShake{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}
  .fp-field{margin-bottom:18px;position:relative;z-index:1;animation:fpUp .5s ease both}
  .fp-label{display:block;font-family:'Inter',sans-serif;font-size:11px;font-weight:700;color:rgba(168,216,255,0.64);margin-bottom:9px;letter-spacing:0.04em;text-transform:uppercase}
  .fp-input-wrap{position:relative}
  .fp-field-icon{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:rgba(0,200,224,0.35);pointer-events:none;display:flex;align-items:center;transition:color .25s ease}
  .fp-input-wrap:focus-within .fp-field-icon{color:rgba(0,200,224,0.65)}
  .fp-input{width:100%;background:rgba(13,27,46,0.88);border:1.5px solid rgba(0,200,224,0.16);border-radius:11px;padding:13px 16px 13px 42px;font-family:'Inter',sans-serif;font-size:14px;color:#f8fafc;outline:none;transition:all .25s ease}
  .fp-input::placeholder{color:rgba(168,216,255,0.22)}
  .fp-input:focus{border-color:rgba(0,200,224,0.42);background:rgba(0,200,224,0.04);box-shadow:0 0 0 4px rgba(0,200,224,0.08), inset 0 0 0 1px rgba(0,200,224,0.06)}
  .fp-input.has-eye{padding-right:44px}
  .fp-eye{position:absolute;right:14px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;padding:0;color:rgba(0,200,224,0.35);display:flex;align-items:center;transition:color .25s ease}
  .fp-eye:hover{color:rgba(0,200,224,0.70)}
  .fp-btn{width:100%;padding:15px 22px;font-family:'Poppins',sans-serif;font-size:13px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;border-radius:11px;border:none;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:all .25s ease;margin-bottom:14px;box-shadow:0 0 32px rgba(232,55,42,0.18);position:relative;z-index:1;overflow:hidden;animation:fpUp .5s .35s cubic-bezier(.22,1,.36,1) both}
  .fp-btn::before{content:'';position:absolute;top:0;left:-100%;width:60%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.20),transparent);transform:skewX(-20deg);transition:left 0.45s ease}
  .fp-btn:hover:not(:disabled)::before{left:140%}
  .fp-btn:hover:not(:disabled){transform:translateY(-2px);filter:brightness(1.08);box-shadow:0 0 50px rgba(232,55,42,0.35),0 6px 24px rgba(232,55,42,0.25)}
  .fp-btn:active:not(:disabled){transform:translateY(0)}
  .fp-btn:disabled{opacity:.5;cursor:not-allowed}
  .fp-spinner{width:14px;height:14px;border-radius:50%;border:2px solid rgba(255,255,255,.22);border-top-color:#fff;animation:fpSpin .65s linear infinite;flex-shrink:0}
  @keyframes fpSpin{to{transform:rotate(360deg)}}
  .fp-secondary{width:100%;background:transparent;border:1px solid rgba(0,200,224,0.18);color:rgba(168,216,255,0.70);padding:12px;border-radius:11px;font-family:'Inter',sans-serif;font-size:12.5px;font-weight:600;cursor:pointer;transition:all .2s ease;position:relative;z-index:1}
  .fp-secondary:hover{border-color:rgba(0,200,224,0.32);color:#a8d8ff;background:rgba(0,200,224,0.06)}
  .fp-secondary:disabled{opacity:.4;cursor:not-allowed}
  .fp-footer{text-align:center;font-family:'Inter',sans-serif;font-size:13px;color:rgba(168,216,255,0.50);padding-top:18px;border-top:1px solid rgba(0,200,224,0.10);position:relative;z-index:1;margin-top:6px}
  .fp-footer a{color:#00c8e0;font-weight:700;text-decoration:none;transition:all .25s ease}
  .fp-footer a:hover{color:#a8d8ff;text-shadow:0 0 14px rgba(0,200,224,0.35)}
  .fp-steps{display:flex;align-items:center;gap:8px;margin-bottom:22px;position:relative;z-index:1}
  .fp-step-dot{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;border:1.5px solid rgba(0,200,224,0.18);color:rgba(168,216,255,0.45);transition:all .3s ease}
  .fp-step-dot.active{background:rgba(0,200,224,0.18);border-color:rgba(0,200,224,0.45);color:#00c8e0;box-shadow:0 0 16px rgba(0,200,224,0.20)}
  .fp-step-dot.done{background:#00c8e0;border-color:#00c8e0;color:#07101d}
  .fp-step-line{flex:1;height:1.5px;background:rgba(0,200,224,0.12);transition:background .3s ease}
  .fp-step-line.done{background:rgba(0,200,224,0.45)}
  @media(max-width:920px){.fp-page{grid-template-columns:1fr;max-width:500px;border-radius:20px}.fp-brand-panel{display:none}.fp-form-panel{border-left:none;border-radius:20px}}
  @media(max-width:480px){.fp-root{padding:16px;align-items:flex-start;padding-top:32px}.fp-page{min-height:auto;border-radius:16px}.fp-form-panel{padding:36px 26px}.fp-form-title{font-size:22px}.fp-input{padding:11px 14px 11px 38px;font-size:13px}.fp-btn{padding:13px 18px;font-size:12px}}
`;

const ForgotPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'otp' | 'new_password'>('email');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<number | null>(null);

  const rawType = searchParams.get('type') || 'Admin';
  // HashRouter recovery flow also uses ?type=recovery & hash tokens; don't mis-detect those
  const isSystemType = ['recovery', 'signup', 'invite', 'magiclink', 'email_change'].includes(rawType.toLowerCase());
  const displayType = isSystemType ? 'Admin' : rawType;
  const userType = displayType;
  const isResponder = userType.toLowerCase() === 'responder';
  const themeColor = isResponder ? '#3b82f6' : '#a855f7';
  const themeGlow = isResponder ? 'rgba(59, 130, 246, 0.18)' : 'rgba(168, 85, 247, 0.18)';

  // Cooldown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    cooldownRef.current = window.setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => { if (cooldownRef.current) clearTimeout(cooldownRef.current); };
  }, [resendCooldown]);

  // Detect recovery session via Supabase auth state (magic-link click, PKCE code, or OTP verify)
  useEffect(() => {
    // If user arrived via email magic link (hash contains access_token or via PKCE code)
    const hash = window.location.hash;
    const hasRecoveryToken = hash.includes('access_token') || hash.includes('type=recovery') || hash.includes('refresh_token');
    const urlParams = new URLSearchParams(window.location.search);
    const hasCode = !!urlParams.get('code');

    // PASSWORD_RECOVERY event fires when Supabase detects recovery token
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setStep('new_password');
        setMessage('Recovery link verified! Set your new password below.');
        setErrorMsg('');
      }
    });

    // Also proactively check session: if we already have a recovery session, go to step 3
    // This covers cases where hash parsing happened before component mount
    if (hasRecoveryToken || hasCode) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          // For HashRouter, the hash token is still considered a valid recovery session after getSession
          setStep('new_password');
          setMessage('Recovery link verified! Set your new password below.');
        }
      });
      // PKCE code exchange if needed
      if (hasCode) {
        const code = urlParams.get('code')!;
        supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
          if (!error) {
            setStep('new_password');
            setMessage('Recovery link verified! Set your new password below.');
          }
        });
      }
    }

    return () => subscription.unsubscribe();
  }, []);

  // Step 1: Send reset email (works for both link and optional OTP)
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setMessage('');

    // Build a reliable redirect for HashRouter: must be absolute URL accessible publicly
    // Using origin + pathname + hash ensures the link returns to this page even behind HashRouter
    const redirectTo = `${window.location.origin}${window.location.pathname}#/forgot-password?type=${encodeURIComponent(userType.toLowerCase())}`;
    const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
      redirectTo,
    });

    if (error) {
      // Provide friendlier messages for common cases
      const msg = error.message.toLowerCase();
      if (msg.includes('rate limit') || msg.includes('too many')) {
        setErrorMsg('Too many requests. Please wait a minute and try again.');
      } else {
        setErrorMsg(error.message);
      }
    } else {
      setMessage(`Recovery email sent to ${trimmed}. Check your inbox (and spam). You can either click the link in the email OR enter the 6-digit code below if your email contains one.`);
      setStep('otp');
      setResendCooldown(60);
    }
    setLoading(false);
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !email.trim()) return;
    setLoading(true);
    setErrorMsg('');
    const redirectTo = `${window.location.origin}${window.location.pathname}#/forgot-password?type=${encodeURIComponent(userType.toLowerCase())}`;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo });
    if (error) {
      setErrorMsg(error.message);
    } else {
      setMessage('Recovery email resent. Check your inbox.');
      setResendCooldown(60);
    }
    setLoading(false);
  };

  // Step 2: Verify Supabase OTP Code
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otpCode.trim();
    if (!code) {
      setErrorMsg('Please enter the verification code.');
      return;
    }
    if (code.length < 6) {
      setErrorMsg('Code should be at least 6 characters.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setMessage('');

    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: code,
      type: 'recovery',
    });

    if (error) {
      // If OTP fails but user clicked magic link, they may already have a session
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setMessage('Session detected — you can set a new password below.');
        setStep('new_password');
      } else {
        setErrorMsg(error.message || 'Invalid or expired code. Try resending or click the link in your email.');
      }
    } else {
      setMessage('Code verified! Set your new password below.');
      setStep('new_password');
    }
    setLoading(false);
  };

  // Step 3: Update Password
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    setLoading(true);

    // Ensure we have a session (OTP verify or magic link creates it)
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setErrorMsg('No recovery session found. Please verify your code again or click the link in your email.');
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setMessage('Password updated! Redirecting to login...');
      // Sign out recovery session so login is clean, then redirect
      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate('/login');
      }, 1500);
    }
    setLoading(false);
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="fp-root" style={{ '--bg-image': `url(${directorybg})` } as React.CSSProperties}>
        <div className="fp-page">
          {/* Brand panel */}
          <div className="fp-brand-panel">
            <div className="fp-brand-panel-bg" style={{ backgroundImage: `url(${directorybg})` }} />
            <div className="fp-panel-geo" />
            <div className="fp-panel-geo-2" />
            <div className="fp-brand-top">
              <div className="fp-brand-logo">
                <div className="fp-brand-logo-img">
                  <img src={logoImage} alt="DumaSafeGuide" />
                </div>
                <div className="fp-brand-logo-name">Duma<span>SafeGuide</span></div>
              </div>
              <div className="fp-brand-headline">
                Recover<br /><span className="accent">Your Access</span><br />Securely.
              </div>
              <p className="fp-brand-desc">
                Reset your password securely via email verification. Your recovery link and code are time-sensitive.
              </p>
            </div>
            <div className="fp-brand-bottom">
              <div className="fp-brand-stats">
                <div>
                  <div className="fp-brand-stat-val">30<em>+</em></div>
                  <div className="fp-brand-stat-label">Barangays Covered</div>
                </div>
                <div>
                  <div className="fp-brand-stat-val"><em>24</em>/7</div>
                  <div className="fp-brand-stat-label">Support</div>
                </div>
                <div>
                  <div className="fp-brand-stat-val">OTP</div>
                  <div className="fp-brand-stat-label">Secure Recovery</div>
                </div>
              </div>
              <div className="fp-brand-divider" />
              <div className="fp-brand-badge">
                <span className="fp-brand-badge-dot" />
                Official City Emergency Portal
              </div>
            </div>
          </div>

          {/* Form panel */}
          <div className="fp-form-panel">
            <Link to="/login" className="fp-back">
              <span className="fp-back-arrow">←</span> Back to Login
            </Link>

            <div className="fp-form-header">
              <div className="fp-form-eyebrow">Secure Recovery</div>
              <div className="fp-form-title">{userType} <span style={{ color: themeColor }}>Recovery</span></div>
              <p className="fp-form-sub">
                {step === 'email' && 'Enter your registered email to receive a verification code or magic link.'}
                {step === 'otp' && `Enter the code sent to ${email || 'your email'}. Or simply click the link in your email.`}
                {step === 'new_password' && 'Create a strong new password. You will be redirected to login after.'}
              </p>
            </div>

            <div className="fp-rule" />

            {/* Progress dots */}
            <div className="fp-steps">
              <div className={`fp-step-dot ${step === 'email' ? 'active' : 'done'}`}>1</div>
              <div className={`fp-step-line ${step !== 'email' ? 'done' : ''}`} />
              <div className={`fp-step-dot ${step === 'otp' ? 'active' : step === 'new_password' ? 'done' : ''}`}>2</div>
              <div className={`fp-step-line ${step === 'new_password' ? 'done' : ''}`} />
              <div className={`fp-step-dot ${step === 'new_password' ? 'active' : ''}`}>3</div>
            </div>

            {errorMsg && <div className="fp-error"><span>⚠</span><span>{errorMsg}</span></div>}
            {message && <div className="fp-success-msg"><span>✓</span><span>{message}</span></div>}

            {step === 'email' && (
              <form onSubmit={handleSendCode} noValidate>
                <div className="fp-field">
                  <label className="fp-label">Verified Email Address</label>
                  <div className="fp-input-wrap">
                    <span className="fp-field-icon"><Icon name="mail" size={15} /></span>
                    <input
                      type="email"
                      className="fp-input"
                      placeholder="name@dumasafeguide.gov"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      autoFocus
                    />
                  </div>
                  <div className="fp-hint">
                    We'll send a link and, if enabled, a 6-digit code.
                  </div>
                </div>
                <button
                  type="submit"
                  className="fp-btn"
                  style={{ background: `linear-gradient(135deg, ${themeColor} 0%, ${themeColor}ee 100%)`, boxShadow: `0 0 28px ${themeGlow}` }}
                  disabled={loading}
                >
                  {loading && <span className="fp-spinner" />}
                  {loading ? 'Sending...' : 'Send Verification Code'}
                </button>
              </form>
            )}

            {step === 'otp' && (
              <form onSubmit={handleVerifyOtp} noValidate>
                <div className="fp-field">
                  <label className="fp-label">Verification Code</label>
                  <div className="fp-input-wrap">
                    <span className="fp-field-icon"><Icon name="key-round" size={15} /></span>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      className="fp-input"
                      placeholder="Enter 6-digit code"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 8))}
                      required
                      autoFocus
                    />
                  </div>
                  <div className="fp-hint">
                    Didn't get a code? Check spam or resend. You can also just click the link in the email — it will auto-advance.
                  </div>
                </div>
                <button
                  type="submit"
                  className="fp-btn"
                  style={{ background: `linear-gradient(135deg, ${themeColor} 0%, ${themeColor}ee 100%)`, boxShadow: `0 0 28px ${themeGlow}` }}
                  disabled={loading}
                >
                  {loading && <span className="fp-spinner" />}
                  {loading ? 'Verifying...' : 'Verify Code'}
                </button>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => { setStep('email'); setErrorMsg(''); setMessage(''); }}
                    className="fp-secondary"
                    style={{ flex: 1 }}
                  >
                    Change Email
                  </button>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || loading}
                    className="fp-secondary"
                    style={{ flex: 1 }}
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Email'}
                  </button>
                </div>
                <div style={{ textAlign: 'center', marginTop: '12px' }}>
                  <button
                    type="button"
                    onClick={async () => {
                      const { data: { session } } = await supabase.auth.getSession();
                      if (session) {
                        setStep('new_password');
                        setMessage('Session detected — set your new password.');
                        setErrorMsg('');
                      } else {
                        setErrorMsg('No recovery session yet. Verify code or click the email link.');
                      }
                    }}
                    style={{ background: 'none', border: 'none', color: themeColor, cursor: 'pointer', fontSize: '12.5px', fontWeight: 700 }}
                  >
                    Already clicked the email link? Continue →
                  </button>
                </div>
              </form>
            )}

            {step === 'new_password' && (
              <form onSubmit={handleUpdatePassword} noValidate>
                <div className="fp-field">
                  <label className="fp-label">New Password</label>
                  <div className="fp-input-wrap">
                    <span className="fp-field-icon"><Icon name="lock" size={15} /></span>
                    <input
                      type={showPw ? 'text' : 'password'}
                      className="fp-input has-eye"
                      placeholder="At least 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      autoFocus
                    />
                    <button type="button" className="fp-eye" onClick={() => setShowPw(v => !v)} tabIndex={-1} aria-label={showPw ? 'Hide' : 'Show'}>
                      {showPw ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                    </button>
                  </div>
                </div>
                <div className="fp-field">
                  <label className="fp-label">Confirm Password</label>
                  <div className="fp-input-wrap">
                    <span className="fp-field-icon"><Icon name="lock" size={15} /></span>
                    <input
                      type={showConfirmPw ? 'text' : 'password'}
                      className="fp-input has-eye"
                      placeholder="Repeat password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      autoComplete="new-password"
                    />
                    <button type="button" className="fp-eye" onClick={() => setShowConfirmPw(v => !v)} tabIndex={-1} aria-label={showConfirmPw ? 'Hide' : 'Show'}>
                      {showConfirmPw ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                    </button>
                  </div>
                  <div className="fp-hint">
                    Must be at least 6 characters.
                  </div>
                </div>
                <button
                  type="submit"
                  className="fp-btn"
                  style={{ background: `linear-gradient(135deg, ${themeColor} 0%, ${themeColor}ee 100%)`, boxShadow: `0 0 28px ${themeGlow}` }}
                  disabled={loading}
                >
                  {loading && <span className="fp-spinner" />}
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
                <button type="button" onClick={() => setStep('otp')} className="fp-secondary">
                  Back to Code
                </button>
              </form>
            )}

            <div className="fp-footer">
              Remembered it? <Link to="/login">Back to Sign In</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;
