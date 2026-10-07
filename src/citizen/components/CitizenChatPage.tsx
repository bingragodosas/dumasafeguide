// src/citizen/components/CitizenChatPage.tsx
// Centralized citizen ↔ responder communication — citizens see all online/on-duty responders
// and can chat / audio / video call any of them. Previous version already supported this
// but relied on a one-off fetch; this version uses the shared usePresence hook so the
// list stays live, shows presence accurately, and the thread is incident_id-aware
// (centralized chat uses incident_id = null when no active report links the pair).

import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { supabase } from "../../js/supabase";
import { useNavigate } from "react-router-dom";
import ChatBox from "../../components/Chatbox";
import { useWebRTC } from "../../hooks/useWebRTC";
import CallOverlay from "../../components/CallOverlay";
import { FaPhone, FaVideo, FaSearch } from "react-icons/fa";
import { usePresence } from "../../hooks/usePresence";
import pagesBackground from "../../assets/pagesbackground.png";

// 🔒 CENTRALIZED: admin hidden from citizen chat per professor toggle — code retained below
// Set to false to show admin contacts again if required by professor
const HIDE_ADMIN_FOR_CITIZEN = true;

// Shared cinematic photo backdrop (same as Pag-report og Insidente) — the
// scrim var keeps it theme-aware in every branch below.
const CHAT_PAGE_BG = {
  minHeight: "100vh",
  backgroundImage: `linear-gradient(var(--citizen-scrim), var(--citizen-scrim)), url(${pagesBackground})`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundAttachment: "fixed",
  backgroundRepeat: "no-repeat",
  backgroundColor: "var(--clr-bg)",
} as const;

interface ResponderContact {
  id: string;
  full_name: string | null;
  email: string;
  status?: string | null;
  is_online?: boolean | null;
  last_seen?: string | null;
}

export default function CitizenChatPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [assignedResponderId, setAssignedResponderId] = useState<string | null>(null);
  const [assignedIncidentId, setAssignedIncidentId] = useState<string | null>(null);
  const [assignedResponderName, setAssignedResponderName] = useState<string>("Responder");
  const [citizenId, setCitizenId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [noResponder, setNoResponder] = useState(false);
  const [allReports, setAllReports] = useState<any[]>([]);
  const [selectedResponderId, setSelectedResponderId] = useState<string | null>(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [selectedResponderName, setSelectedResponderName] = useState<string>("Responder");
  const [search, setSearch] = useState("");
  const [roleMismatch, setRoleMismatch] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const { onlineResponders, allResponders } = usePresence(citizenId, "citizen", !!citizenId);
  // Live online set from usePresence (DB is_online/last_seen/status + Realtime
  // Presence). Updates in real time via postgres_changes — no refresh needed.
  const onlineIdSet = useMemo(() => new Set(onlineResponders.map(r => r.id)), [onlineResponders]);
  const isOnline = (id: string) => onlineIdSet.has(id);
  // Full roster, online first — offline responders stay visible but greyed out
  // and disabled so citizens always see who can actually help right now.
  const responders: ResponderContact[] = useMemo(() => {
    const all = allResponders as ResponderContact[];
    return [...all].sort((a, b) => {
      const ao = onlineIdSet.has(a.id) ? 0 : 1;
      const bo = onlineIdSet.has(b.id) ? 0 : 1;
      if (ao !== bo) return ao - bo;
      return (a.full_name || a.email || "").localeCompare(b.full_name || b.email || "");
    });
  }, [allResponders, onlineIdSet]);
  const onlineCount = onlineResponders.length;

  const effectiveResponderId = selectedResponderId ?? assignedResponderId;
  const effectiveResponderName = selectedResponderName || assignedResponderName;
  const effectiveIncidentId = selectedIncidentId ?? assignedIncidentId;
  const [showCallOverlay, setShowCallOverlay] = useState(false);
  const [callType, setCallType] = useState<"audio" | "video" | null>(null);
  const {
    state: callState,
    startCall,
    endCall,
    acceptCall,
    declineCall,
    toggleMute,
    toggleCamera,
    upgradeToVideo,
  } = useWebRTC(citizenId, effectiveResponderId);
  const handleStartAudioCall = async () => {
    if (!effectiveResponderId) return;
    setCallType("audio");
    setShowCallOverlay(true);
    await startCall("audio");
  };
  const handleStartVideoCall = async () => {
    if (!effectiveResponderId) return;
    setCallType("video");
    setShowCallOverlay(true);
    await startCall("video");
  };
  const handleEndCall = () => {
    endCall();
    setShowCallOverlay(false);
    setCallType(null);
  };
  const handleAcceptCall = async () => { await acceptCall(); };
  const handleDeclineCall = async () => { await declineCall(); setShowCallOverlay(false); setCallType(null); };
  useEffect(() => {
    if (callState.callState === "ringing" || callState.callState === "active") {
      setShowCallOverlay(true);
      if (callState.callType) setCallType(callState.callType);
    } else if (callState.callState === "ended" || callState.callState === "declined") {
      const tid = setTimeout(() => { setShowCallOverlay(false); setCallType(null); }, 1200);
      return () => clearTimeout(tid);
    } else if (callState.callState === "idle" && showCallOverlay) {
      if (!callState.localStream && !callState.remoteStream) { setShowCallOverlay(false); setCallType(null); }
    }
  }, [callState.callState, callState.callType, callState.localStream, callState.remoteStream, showCallOverlay]);

  // Initial load: assigned responder from active report (pinned)
  // NOTE: ProtectedRoute already guarantees only citizens reach this page.
  // We keep a soft guard but don't hard-navigate to /citizen/dashboard when
  // the user is a responder — that would loop inside a citizen-only layout
  // and appear as a black screen. Instead we show an inline unauthorized
  // message and let ProtectedRoute handle the redirect if needed.
  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { navigate("/login"); return; }
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
        const r = (profile?.role as string)?.toLowerCase().trim() ?? "";
        if (r && r !== "citizen") {
          // Don't navigate to /citizen/dashboard (still citizen-only and would
          // flash a black/empty layout for responders). Show inline message and
          // let ProtectedRoute redirect on next render if needed.
          setRoleMismatch(true);
          setCitizenId(user.id);
          setLoading(false);
          return;
        }
        setCitizenId(user.id);
        const { data: reports } = await supabase
          .from("reports")
          .select("id, responder_id, status")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10);
        setAllReports(reports ?? []);
        const active = (reports ?? []).find(r => r.responder_id && (r.status === "pending" || r.status === "in-progress"));
        let assignedId: string | null = null;
        let assignedInc: string | null = null;
        let assignedName = "Responder";
        if (active?.responder_id) {
          const { data: responder } = await supabase.from("profiles").select("id, role, full_name, email").eq("id", active.responder_id).single();
          if ((responder?.role as string)?.toLowerCase() === "responder") {
            assignedId = active.responder_id as string;
            assignedInc = active.id as string;
            assignedName = (responder as any)?.full_name || (responder as any)?.email || "Responder";
            setAssignedResponderId(assignedId);
            setAssignedIncidentId(assignedInc);
            setAssignedResponderName(assignedName);
          }
        }
        // Don't decide noResponder here based on stale presence — let the
        // presence-driven effect below set it once onlineResponders have loaded.
        setNoResponder(false);
      } catch (e: any) {
        const msg = String(e?.message ?? e ?? '');
        if (/Invalid Refresh Token|Refresh Token Not Found/i.test(msg)) {
          setAuthError('Session expired. Please sign in again.');
          try { await supabase.auth.signOut(); } catch {}
          try {
            Object.keys(localStorage).forEach(k => {
              if (k.startsWith('sb-') && k.includes('-auth-token')) localStorage.removeItem(k);
            });
          } catch {}
        } else {
          // Don't navigate to /login inside citizen layout (causes black flash) — show inline error
          setAuthError('Could not load chat. Please refresh or sign in again.');
        }
      } finally { setLoading(false); }
    })();
  }, [navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-select initial responder when presence loads
  useEffect(() => {
    if (loading) return;
    if (selectedResponderId) return;
    if (assignedResponderId) {
      setSelectedResponderId(assignedResponderId);
      setSelectedResponderName(assignedResponderName);
      setSelectedIncidentId(assignedIncidentId);
      setNoResponder(false);
      return;
    }
    if (responders.length > 0) {
      // Prefer an online responder so the citizen can start chatting immediately
      const r = responders.find(x => onlineIdSet.has(x.id)) ?? responders[0];
      // Don't auto-select an offline responder — let the citizen pick an online one
      if (!onlineIdSet.has(r.id) && !assignedResponderId) { setNoResponder(true); return; }
      setSelectedResponderId(r.id);
      setSelectedResponderName(r.full_name || r.email || "Responder");
      const linked = allReports.find(rep => String(rep.responder_id) === String(r.id));
      setSelectedIncidentId(linked ? String(linked.id) : null);
      setNoResponder(false);
    } else if (!assignedResponderId) {
      setNoResponder(true);
    }
  }, [loading, responders, onlineIdSet, assignedResponderId, assignedResponderName, assignedIncidentId, selectedResponderId, allReports]);

  // Keep responder selection stable when online list changes — don't auto-switch away
  useEffect(() => {
    if (selectedResponderId && !responders.some(r => r.id === selectedResponderId) && assignedResponderId !== selectedResponderId) {
      // selected went offline — keep it but show offline indicator; don't clear
    }
  }, [responders, selectedResponderId, assignedResponderId]);

  const markCitizenRead = async (otherId: string | null) => {
    const me = citizenId;
    if (!me || !otherId) return;
    // Real column is receiver_id (broadcast = receiver_id null) and text is message
    try { await (supabase.from("chat_messages").update({ is_read: true } as any).eq("receiver_id", me).eq("sender_id", otherId).eq("is_read", false) as any); } catch {}
  };

  // Clear badge when citizen opens a responder thread (so other responders won't see stale unread)
  useEffect(() => {
    if (effectiveResponderId) void markCitizenRead(effectiveResponderId);
  }, [effectiveResponderId]);

  const handleSelectResponder = (r: ResponderContact) => {
    setSelectedResponderId(r.id);
    setSelectedResponderName(r.full_name || r.email || "Responder");
    const linked = allReports.find(rep => String(rep.responder_id) === String(r.id));
    if (linked) setSelectedIncidentId(String(linked.id));
    else if (r.id === assignedResponderId) setSelectedIncidentId(assignedIncidentId);
    else setSelectedIncidentId(null);
    void markCitizenRead(r.id);
  };

  const filteredResponders = useMemo(() => {
    if (!search.trim()) return responders;
    const q = search.toLowerCase();
    return responders.filter(r => (r.full_name ?? "").toLowerCase().includes(q) || r.email.toLowerCase().includes(q));
  }, [responders, search]);

  if (loading) {
    return (
      <div style={{ ...CHAT_PAGE_BG, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--citizen-faint)", fontSize: "13px", fontFamily: "'Inter', sans-serif" }}>
        <div style={{ textAlign: "center" }}><div style={{ marginBottom: "12px", fontSize: "24px" }}>🔒</div>{t("chat.loading", "Loading chat...")}</div>
      </div>
    );
  }

  if (authError) {
    return (
      <div style={{ ...CHAT_PAGE_BG, padding: "24px" }}>
      <div style={{ maxWidth: "600px", margin: "40px auto", background: "var(--citizen-card)", border: "1px solid var(--clr-red-border)", borderRadius: "12px", textAlign: "center", padding: "24px" }}>
        <div style={{ fontSize: "32px", marginBottom: "12px" }}>⚠️</div>
        <div style={{ fontSize: "14px", fontWeight: "700", color: "var(--clr-text)", marginBottom: "8px" }}>{authError}</div>
        <div style={{ fontSize: "12px", color: "var(--clr-text-muted)", marginBottom: "16px" }}>
          Your session has expired or is invalid (Invalid Refresh Token). Please clear and sign in again.
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button
            onClick={() => {
              try {
                Object.keys(localStorage).forEach(k => { if (k.startsWith('sb-')) localStorage.removeItem(k); });
                sessionStorage.clear();
              } catch {}
              window.location.hash = '#/login';
              window.location.reload();
            }}
            style={{ background: "var(--clr-green)", border: "none", color: "#0a1a14", borderRadius: "8px", padding: "10px 18px", fontWeight: "700", cursor: "pointer", fontSize: "13px" }}
          >
            Clear & Go to Login
          </button>
          <button
            onClick={() => window.location.reload()}
            style={{ background: "var(--clr-border)", border: "1px solid var(--clr-border-2)", color: "var(--clr-text)", borderRadius: "8px", padding: "10px 18px", fontWeight: "700", cursor: "pointer", fontSize: "13px" }}
          >
            Retry
          </button>
        </div>
      </div>
      </div>
    );
  }

  if (roleMismatch) {
    return (
      <div style={{ ...CHAT_PAGE_BG, padding: "24px" }}>
      <div style={{ maxWidth: "600px", margin: "40px auto", background: "var(--citizen-card)", border: "1px solid var(--clr-border)", borderRadius: "12px", textAlign: "center", padding: "24px" }}>
        <div style={{ fontSize: "32px", marginBottom: "12px" }}>🔒</div>
        <div style={{ fontSize: "14px", fontWeight: "700", color: "var(--clr-text)", marginBottom: "8px" }}>Responder account — citizen chat is for citizens</div>
        <div style={{ fontSize: "12px", color: "var(--clr-text-muted)", marginBottom: "16px" }}>
          You are logged in as a <strong>responder</strong>. Citizen Chat is only available to citizen accounts.
          Use <strong>Citizen Chat</strong> in your Responder Dashboard to message citizens who are online.
        </div>
        <button
          onClick={() => navigate("/responder/dashboard")}
          style={{ background: "rgba(46,204,143,0.16)", border: "1px solid rgba(46,204,143,0.35)", color: "var(--clr-green)", borderRadius: "8px", padding: "10px 18px", fontWeight: "700", cursor: "pointer", fontSize: "13px" }}
        >
          Go to Responder Dashboard
        </button>
      </div>
      </div>
    );
  }

  if (noResponder && responders.length === 0) {
    return (
      <div style={{ ...CHAT_PAGE_BG, padding: "20px" }}>
      <div style={{ maxWidth: "700px", margin: "0 auto" }}>
        <div style={{ marginBottom: "16px", padding: "14px 18px", backgroundColor: "var(--citizen-card)", border: "1px solid var(--clr-red-border)", borderRadius: "12px", borderLeft: "3px solid var(--clr-red)" }}>
          <div style={{ fontSize: "10px", color: "var(--clr-red)", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: "700", marginBottom: "4px" }}>{t("chat.noResponder", "No Responders Online")}</div>
          <div style={{ fontSize: "13px", color: "var(--citizen-body)" }}>No responders online right now. Your message will be queued and the next available responder will assist you. Please try again shortly.</div>
        </div>
        {/* Still allow queuing — show chat disabled but with responders list empty */}
      </div>
      </div>
    );
  }

  const assignedResponder = assignedResponderId
    ? filteredResponders.find(r => r.id === assignedResponderId) || ({ id: assignedResponderId, full_name: assignedResponderName, email: "", status: "on_duty", is_online: true } as ResponderContact)
    : null;
  const otherResponders = filteredResponders.filter(r => r.id !== assignedResponderId);
  const showAssignedSection = !!assignedResponderId;

  return (
    // Same cinematic photo backdrop as Pag-report og Insidente — scrim var
    // keeps it theme-aware (dark veil in dark mode, soft gray in light).
    <div style={{ ...CHAT_PAGE_BG, padding: "clamp(12px,3vw,20px)" }}>
    <div style={{ maxWidth: "min(700px, calc(100vw - 24px))", margin: "0 auto", width: "100%", boxSizing: "border-box", borderRadius: "18px",
      backgroundImage: "radial-gradient(560px 260px at 15% 0%, color-mix(in srgb, var(--clr-green) 9%, transparent), transparent), radial-gradient(480px 280px at 95% 100%, color-mix(in srgb, var(--clr-blue) 9%, transparent), transparent)" }}>
      <div style={{
        marginBottom: "16px", padding: "14px 18px",
        backgroundColor: "var(--citizen-card)",
        border: "1px solid rgba(46,204,143,0.15)",
        borderRadius: "12px", borderLeft: "3px solid var(--clr-green)",
        display: "flex", alignItems: "center", gap: "12px",
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "10px", color: "var(--clr-green)", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: "700", marginBottom: "4px" }}>{t("chat.secureChannel", "Secure Channel")}</div>
          <div style={{ fontSize: "13px", color: "var(--citizen-body)", fontWeight: "500" }}>
            Centralized: message any on-duty responder — chat, audio, or video. Responders online are highlighted and will respond to assist you.
          </div>
        </div>
        {effectiveResponderId && (
          <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
            <button onClick={handleStartAudioCall} title="Audio Call — responder will be notified" style={{ background: "rgba(46,204,143,0.12)", border: "1px solid rgba(46,204,143,0.3)", borderRadius: "8px", padding: "8px 10px", cursor: "pointer", color: "var(--clr-green)", fontSize: "14px", display: "flex", alignItems: "center" }}><FaPhone size={14} /></button>
            <button onClick={handleStartVideoCall} title="Video Call — responder will be notified" style={{ background: "rgba(46,204,143,0.12)", border: "1px solid rgba(46,204,143,0.3)", borderRadius: "8px", padding: "8px 10px", cursor: "pointer", color: "var(--clr-green)", fontSize: "14px", display: "flex", alignItems: "center" }}><FaVideo size={14} /></button>
          </div>
        )}
      </div>

      {showAssignedSection && assignedResponder && (
        <div style={{ marginBottom: "16px" }}>
          <div style={{ fontSize: "10px", color: "var(--clr-green)", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: "700", marginBottom: "8px" }}>Your assigned responder</div>
          <button
            onClick={() => handleSelectResponder(assignedResponder)}
            style={{
              display: "flex", alignItems: "center", gap: "12px", width: "100%", textAlign: "left",
              padding: "12px 14px", borderRadius: "12px",
              background: selectedResponderId === assignedResponder.id ? "rgba(46,204,143,0.10)" : "var(--citizen-card)",
              border: `1px solid ${selectedResponderId === assignedResponder.id ? "rgba(46,204,143,0.35)" : "rgba(46,204,143,0.18)"}`,
              borderLeft: "3px solid var(--clr-green)",
              cursor: "pointer", color: "var(--clr-text)",
            }}
          >
            <span style={{ width: "10px", height: "10px", borderRadius: "50%", flexShrink: 0, background: assignedResponderId && isOnline(assignedResponderId) ? "var(--clr-green)" : "var(--clr-text-faint)", boxShadow: assignedResponderId && isOnline(assignedResponderId) ? "0 0 6px var(--clr-green)" : "none" }} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: "13px", fontWeight: "700", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{assignedResponder.full_name || assignedResponder.email || "Responder"} {selectedResponderId === assignedResponder.id ? "✓" : ""}</span>
              <span style={{ display: "block", fontSize: "11px", color: assignedResponderId && isOnline(assignedResponderId) ? "var(--clr-green)" : "var(--citizen-faint)" }}>{assignedResponderId && isOnline(assignedResponderId) ? "Assigned to your active report • Tap to chat • Will take action to assist" : "Assigned to your active report • Currently offline"}</span>
            </span>
            <span style={{ fontSize: "10px", color: "var(--clr-green)", fontWeight: "700", letterSpacing: "0.06em" }}>PINNED</span>
          </button>
        </div>
      )}

      <div style={{ marginBottom: "16px", backgroundColor: "var(--citizen-card)", border: "1px solid var(--clr-border)", borderRadius: "12px", overflow: "hidden" }}>
        <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--clr-border)", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: "10px", color: "var(--citizen-faint)", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: "700", flex: 1 }}>
            Responders {responders.length > 0 ? `(${onlineCount} online)` : ""}
          </span>
          <span title={onlineCount > 0 ? `${onlineCount} responder(s) online` : "No responders online"} style={{ width: "8px", height: "8px", borderRadius: "50%", background: onlineCount > 0 ? "var(--clr-green)" : "var(--clr-text-faint)", boxShadow: onlineCount > 0 ? "0 0 6px var(--clr-green)" : "none", display: "inline-block" }} />
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <FaSearch size={10} style={{ position: "absolute", left: 8, color: "var(--citizen-faint)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search responder" style={{ background: "var(--clr-surface)", border: "1px solid var(--clr-border-2)", borderRadius: 8, padding: "6px 8px 6px 24px", fontSize: 11, color: "var(--clr-text)", outline: "none", width: 130 }} />
          </div>
        </div>
        {/* HIDDEN: Admin contacts for citizen — code retained, hidden via flag (set HIDE_ADMIN_FOR_CITIZEN=false to show) */}
        {!HIDE_ADMIN_FOR_CITIZEN && (
          <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--clr-border)", background: "color-mix(in srgb, var(--clr-text) 3%, transparent)" }}>
            <div style={{ fontSize: "10px", color: "var(--citizen-faint)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Admin contacts (hidden in production)</div>
            <div style={{ fontSize: "11px", color: "var(--citizen-faint)" }}>Admin list would appear here when HIDE_ADMIN_FOR_CITIZEN=false</div>
          </div>
        )}
        <div style={{ maxHeight: "220px", overflowY: "auto" }}>
          {onlineCount === 0 && filteredResponders.length > 0 && (
            <div style={{ padding: "12px 14px", fontSize: "12px", color: "rgba(239,91,91,0.85)", textAlign: "center", borderBottom: "1px solid var(--clr-border)" }}>
              No responders online right now — they will appear as Online below when available.
            </div>
          )}
          {filteredResponders.length === 0 && !showAssignedSection ? (
            <div style={{ padding: "16px", fontSize: "12px", color: "var(--citizen-faint)", textAlign: "center" }}>No responders online right now — they appear here when on duty and online. Your report is still visible to dispatch.</div>
          ) : (
            <>
              {otherResponders.map(r => {
                const isSelected = selectedResponderId === r.id;
                const online = isOnline(r.id);
                return (
                  <button
                    key={r.id}
                    onClick={() => handleSelectResponder(r)}
                    disabled={!online}
                    title={online ? `Chat with ${r.full_name || r.email}` : "Responder is offline"}
                    style={{
                      display: "flex", alignItems: "center", gap: "10px", width: "100%", textAlign: "left",
                      padding: "10px 14px", cursor: online ? "pointer" : "not-allowed", color: "var(--clr-text)",
                      opacity: online ? 1 : 0.45,
                      background: isSelected ? "rgba(46,204,143,0.08)" : "transparent",
                      border: "none", borderBottom: "1px solid var(--clr-border)",
                      borderLeft: isSelected ? "2px solid var(--clr-green)" : "2px solid transparent",
                    }}
                  >
                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", flexShrink: 0, background: online ? "var(--clr-green)" : "var(--clr-text-faint)", boxShadow: online ? "0 0 6px var(--clr-green)" : "none" }} />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: "13px", fontWeight: "600", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.full_name || r.email || "Responder"}</span>
                      <span style={{ display: "block", fontSize: "11px", color: online ? "var(--clr-green)" : "var(--citizen-faint)" }}>{online ? "● Online • Chat · Audio · Video • Will respond" : "○ Offline"}</span>
                    </span>
                    {isSelected && <span style={{ fontSize: "12px", color: "var(--clr-green)" }}>✓</span>}
                  </button>
                );
              })}
              {otherResponders.length === 0 && showAssignedSection && filteredResponders.length > 0 && (
                <div style={{ padding: "12px 14px", fontSize: "11px", color: "var(--citizen-faint)", textAlign: "center" }}>No other on-duty responders. Your assigned responder is pinned above.</div>
              )}
            </>
          )}
        </div>
      </div>

      {effectiveResponderId ? (
        <ChatBox assignedResponderId={effectiveResponderId} incidentId={effectiveIncidentId} userRole="citizen" />
      ) : (
        <div style={{ textAlign: "center", padding: "24px", color: "var(--citizen-faint)", fontSize: "12px", background: "var(--citizen-card)", borderRadius: "12px", border: "1px solid var(--clr-border)" }}>
          Select a responder above to start chatting — audio and video calls are available.
        </div>
      )}

      {showCallOverlay && callType && (
        <CallOverlay
          state={callState}
          callType={callType}
          remoteName={effectiveResponderName}
          onMute={toggleMute}
          onCamera={toggleCamera}
          onUpgrade={upgradeToVideo}
          onEnd={handleEndCall}
          onAccept={handleAcceptCall}
          onDecline={handleDeclineCall}
          isOnline={callState.callState === "active" ? true : !!effectiveResponderId && isOnline(effectiveResponderId)}
        />
      )}
    </div>
    </div>
  );
}
