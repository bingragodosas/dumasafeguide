import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import reportBg from "../assets/report.bg.png";
import { supabase } from "../js/supabase";

const INCIDENT_TYPES = [
  { value: "fire",     label: "Fire Incident",    icon: "🔥", accent: "#EF5B5B" },
  { value: "accident", label: "Road Accident",     icon: "🚗", accent: "#F5C842" },
  { value: "flood",    label: "Flood",             icon: "🌊", accent: "#5B8DEF" },
  { value: "crime",    label: "Crime",             icon: "🚨", accent: "#EF5B9E" },
  { value: "medical",  label: "Medical Emergency", icon: "🏥", accent: "#2ECC8F" },
  { value: "other",    label: "Other",             icon: "⚠️", accent: "#B0B8CC" },
];

const EMERGENCY_HOTLINES = [
  { label: "BFP",    number: "422-2022", icon: "🔥", color: "#EF5B5B" },
  { label: "CDRRMO", number: "422-3008", icon: "🌀", color: "#F5C842" },
  { label: "PNP",    number: "422-8708", icon: "👮", color: "#5B8DEF" },
  { label: "PDRRMO", number: "422-3006", icon: "🏥", color: "#2ECC8F" },
];

const STEPS = ["Incident Type", "Reporter Info", "Location", "Description", "Evidence", "Submit"];



export default function Report() {
  const navigate = useNavigate();
  const [location, setLocation]             = useState("");
  const [address, setAddress]               = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [selectedType, setSelectedType]     = useState<string | null>(null);
  const [agreed, setAgreed]                 = useState(false);
  const [submitted, setSubmitted]           = useState(false);
  const [fileName, setFileName]             = useState<string | null>(null);
  const [fileObject, setFileObject]         = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [gpsAccuracy, setGpsAccuracy]       = useState<number | null>(null);
  const [currentStep, setCurrentStep]       = useState(0);
  const [submitting, setSubmitting]         = useState(false);
  const [submitError, setSubmitError]       = useState<string | null>(null);
  const [reporterName, setReporterName]     = useState("");
  const [reporterContact, setReporterContact] = useState("");
  const [description, setDescription]       = useState("");

  const fileRef = useRef<HTMLInputElement>(null);
  const activeType = INCIDENT_TYPES.find((t) => t.value === selectedType);

  async function reverseGeocode(lat: string, lng: string) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=jsonv2&addressdetails=1`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      if (data?.address) {
        const a = data.address;
        const parts: string[] = [];
        if (a.road) parts.push(a.road);
        if (a.neighbourhood) parts.push(a.neighbourhood);
        if (a.suburb) parts.push(a.suburb);
        if (a.village) parts.push(a.village);
        if (a.barangay) parts.push(a.barangay);
        if (a.city || a.town || a.municipality) parts.push(a.city ?? a.town ?? a.municipality);
        if (a.state || a.province) parts.push(a.state ?? a.province);
        if (a.country) parts.push(a.country);
        const clean = [...new Set(parts)];
        if (clean.length > 0) { setAddress(clean.join(", ")); return; }
      }
      if (data?.display_name) { setAddress(data.display_name); return; }
    } catch (err) {
      console.error("Reverse geocode failed:", err);
    }
    setAddress(`Lat ${lat}, Lng ${lng}`);
  }

  function acquireGPS(
    onSuccess: (lat: string, lng: string, acc: number) => void,
    onError: () => void
  ) {
    let bestPosition: GeolocationPosition | null = null;
    let watchId: number | null = null;
    const stop = () => {
      if (watchId !== null) { navigator.geolocation.clearWatch(watchId); watchId = null; }
    };
    const finish = () => {
      if (!bestPosition) { onError(); return; }
      const lat = bestPosition.coords.latitude.toFixed(6);
      const lng = bestPosition.coords.longitude.toFixed(6);
      const acc = bestPosition.coords.accuracy;
      onSuccess(lat, lng, acc);
    };
    const timer = setTimeout(() => { stop(); finish(); }, 12000);
    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const accuracy = pos.coords.accuracy;
        if (!bestPosition || accuracy < bestPosition.coords.accuracy) {
          bestPosition = pos;
        }
        if (accuracy <= 15) { clearTimeout(timer); stop(); finish(); }
      },
      (err) => {
        console.error("GPS error:", err);
        clearTimeout(timer); stop(); onError();
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  }

  useEffect(() => {
    setLocationStatus("loading");
    acquireGPS(
      async (lat, lng, acc) => {
        setLocation(`${lat}, ${lng}`);
        setGpsAccuracy(acc);
        setLocationStatus("ok");
        await reverseGeocode(lat, lng);
      },
      () => setLocationStatus("error")
    );
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) { setFileName(file.name); setFileObject(file); setUploadProgress("idle"); }
    else { setFileName(null); setFileObject(null); }
  }

  async function uploadEvidence(file: File): Promise<{ url: string | null; errorMsg: string | null }> {
    setUploadProgress("uploading");
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const ext = safeName.split(".").pop() ?? "bin";
    const uniqueName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const filePath = `evidence/${uniqueName}`;
    const { error: uploadError } = await supabase.storage.from("reports-evidence").upload(filePath, file, { cacheControl: "3600", upsert: false, contentType: file.type || "application/octet-stream" });
    if (uploadError) {
      setUploadProgress("error");
      let errorMsg = `Upload failed: ${uploadError.message}`;
      if (uploadError.message?.includes("Bucket not found")) errorMsg = 'Storage bucket "reports-evidence" not found.';
      else if (uploadError.message?.includes("row-level security") || uploadError.message?.includes("policy")) errorMsg = "Upload blocked by storage security policy.";
      else if (uploadError.message?.includes("exceeded") || uploadError.message?.includes("too large")) errorMsg = "File is too large.";
      return { url: null, errorMsg };
    }
    const { data } = supabase.storage.from("reports-evidence").getPublicUrl(filePath);
    setUploadProgress("done");
    return { url: data?.publicUrl ?? null, errorMsg: null };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agreed || !selectedType) return;
    setSubmitting(true);
    setSubmitError(null);
    const { data: { user } } = await supabase.auth.getUser();
    let evidenceUrl: string | null = null;
    if (fileObject) {
      const { url, errorMsg } = await uploadEvidence(fileObject);
      if (!url) { setSubmitError(errorMsg ?? "Evidence upload failed."); setSubmitting(false); return; }
      evidenceUrl = url;
    }
    const payload = {
      type: selectedType,
      description: description.trim() || null,
      location: location || null,
      address: address || null,
      reporter_name: reporterName.trim() || null,
      reporter_contact: reporterContact.trim() || null,
      status: "pending",
      user_id: user?.id ?? null,
      responder_id: null,
      evidence_url: evidenceUrl,
    };
    const { error } = await supabase.from("reports").insert(payload);
    if (error) { setSubmitError("Failed to submit report. Please try again."); setSubmitting(false); return; }
    setSubmitting(false);
    setSubmitted(true);
  }

  useEffect(() => {
    if (agreed && selectedType) setCurrentStep(5);
    else if (fileName) setCurrentStep(4);
    else if (description.trim()) setCurrentStep(3);
    else if (locationStatus === "ok" || locationStatus !== "idle") setCurrentStep(2);
    else if (selectedType) setCurrentStep(1);
    else setCurrentStep(0);
  }, [selectedType, locationStatus, fileName, agreed, description]);

  function gpsInputValue() {
    if (locationStatus === "loading") return "Acquiring location — please wait…";
    if (locationStatus === "error")   return "Location unavailable — GPS access denied or timed out";
    if (locationStatus === "ok") {
      if (address) return address;
      if (location) return `Resolving address… (${location})`;
    }
    return "";
  }

  if (submitted) {
    return (
      <>
        <style>{styles}</style>
        <div className="rp-root">
          <div className="rp-bg">
            <img src={reportBg} alt="" className="rp-bg-img" aria-hidden="true" />
            <div className="rp-bg-overlay" />
            <div className="rp-bg-atmosphere" />
            <div className="rp-bg-grain" />
          </div>
          <div className="rp-body rp-body--center">
            <div className="rp-success">
              <div className="rp-success-icon">✓</div>
              <h2 className="rp-success-title">Report Submitted</h2>
              <p className="rp-success-sub">Your incident report has been received and is now visible to responders. Authorities have been notified and will respond shortly. Keep your phone nearby for follow-up.</p>
              <div className="rp-success-actions">
                <div className="rp-success-card">
                  <div className="rp-success-card-icon">📝</div>
                  <div className="rp-success-card-title">Submit Another Report</div>
                  <p className="rp-success-card-text">Report another incident to help keep your community safe.</p>
                  <button className="rp-btn-primary rp-btn-primary--ghost" onClick={() => {
                    setSubmitted(false); setSelectedType(null); setDescription("");
                    setReporterName(""); setReporterContact(""); setFileName(null);
                    setFileObject(null); setAgreed(false); setUploadProgress("idle");
                  }}>
                    Submit Another Report →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="rp-root">

        {/* ── Background ── */}
        <div className="rp-bg">
          <img src={reportBg} alt="" className="rp-bg-img" aria-hidden="true" />
          <div className="rp-bg-overlay" />
          <div className="rp-bg-atmosphere" />
          <div className="rp-bg-grain" />
        </div>

        <div className="rp-body">

          {/* ── Hero ── */}
          <section className="rp-hero">
            <div className="rp-eyebrow">Reporting a live incident</div>
            <h1 className="rp-title">
              Report an <span className="accent">Incident</span>
            </h1>
            <p className="rp-sub">
              Submit a report to alert local responders. Provide accurate details
              so the right team can act fast.
            </p>
          </section>

          {/* ── Tracking Benefit Banner ── */}
          <div className="rp-tracking-banner">
            <div className="rp-banner-icon">📍</div>
            <div className="rp-banner-content">
              <div className="rp-banner-title">Track Your Report in Real-Time</div>
              <p className="rp-banner-text">Create an account to monitor the status of your incident report and receive updates as authorities respond. <strong>Don't have an account? Sign up after submission!</strong></p>
            </div>
            <button onClick={() => navigate("/signup")} className="rp-banner-cta" style={{ cursor: "pointer" }}>Create Account →</button>
          </div>

          {/* ── Step progress ── */}
          <div className="rp-steps">
            {STEPS.map((step, i) => (
              <div key={step} className={`rp-step-item${i <= currentStep ? " rp-step-item--done" : ""}${i === currentStep ? " rp-step-item--active" : ""}`}>
                <div className="rp-step-dot">{i < currentStep ? "✓" : i + 1}</div>
                <span className="rp-step-label">{step}</span>
                {i < STEPS.length - 1 && <div className="rp-step-line" />}
              </div>
            ))}
          </div>

          <div className="rp-layout">

            {/* LEFT — Form */}
            <div className="rp-left">
              <form className="rp-form" onSubmit={handleSubmit} noValidate>

                {/* Step 1 — Incident Type */}
                <div className="rp-card">
                  <div className="rp-card-label"><span className="rp-step-badge">01</span>Incident Type</div>
                  <div className="rp-type-grid">
                    {INCIDENT_TYPES.map((type) => (
                      <button key={type.value} type="button"
                        className={`rp-type-btn${selectedType === type.value ? " rp-type-btn--active" : ""}`}
                        style={{ "--t-accent": type.accent, "--t-alpha": `${type.accent}22` } as React.CSSProperties}
                        onClick={() => setSelectedType(type.value)}>
                        <span className="rp-type-icon">{type.icon}</span>
                        <span className="rp-type-label">{type.label}</span>
                      </button>
                    ))}
                  </div>
                  {selectedType && (
                    <div className="rp-type-confirm" style={{ "--t-accent": activeType?.accent } as React.CSSProperties}>
                      <span>{activeType?.icon}</span><span>{activeType?.label} selected</span>
                    </div>
                  )}
                </div>

                {/* Step 2 — Reporter Info */}
                <div className="rp-card">
                  <div className="rp-card-label"><span className="rp-step-badge">02</span>Reporter Information</div>
                  <div className="rp-fields">
                    <div className="rp-field">
                      <label className="rp-label">Full Name <span className="rp-optional">(Optional)</span></label>
                      <input className="rp-input" type="text" placeholder="e.g. Juan dela Cruz" value={reporterName} onChange={e => setReporterName(e.target.value)} />
                    </div>
                    <div className="rp-field">
                      <label className="rp-label">Contact Number <span className="rp-optional">(Optional)</span></label>
                      <input className="rp-input" type="tel" placeholder="+63 9XX XXX XXXX" value={reporterContact} onChange={e => setReporterContact(e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* Step 3 — Location */}
                <div className="rp-card">
                  <div className="rp-card-label"><span className="rp-step-badge">03</span>Your Location</div>
                  <div className="rp-field">
                    <label className="rp-label">Detected Location</label>

                    <div className="rp-location-row">
                      <div className="rp-location-input-wrap">
                        <span className="rp-location-dot" data-status={locationStatus} />
                        <input
                          className="rp-input rp-input--location"
                          type="text"
                          readOnly
                          value={gpsInputValue()}
                          placeholder="Waiting for GPS…"
                        />
                      </div>
                      <button type="button" className="rp-gps-btn" onClick={() => {
                        setLocationStatus("loading"); setAddress(null); setGpsAccuracy(null);
                        acquireGPS(async (lat, lng, acc) => {
                          setLocation(`${lat}, ${lng}`); setGpsAccuracy(acc); setLocationStatus("ok");
                          await reverseGeocode(lat, lng);
                        }, () => setLocationStatus("error"));
                      }}>📍 Refresh GPS</button>
                    </div>

                    {/* Raw coords + Maps link */}
                    {locationStatus === "ok" && location && (
                      <div className="rp-coords-badge">
                        <span className="rp-coords-icon">🌐</span>
                        <span className="rp-coords-text">{location}</span>
                        {address && (
                          <a
                            href={`https://www.google.com/maps?q=${location}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rp-maps-verify"
                          >
                            Verify on Maps →
                          </a>
                        )}
                      </div>
                    )}

                    {locationStatus === "loading" && (
                      <div className="rp-gps-acquiring">
                        <span className="rp-gps-pulse" />
                        <span>Searching for GPS signal… keep your device still and outdoors.</span>
                      </div>
                    )}

                    {locationStatus === "error" && (
                      <p className="rp-hint rp-hint--warn">⚠️ Location access was denied or timed out. Please allow location access and tap <strong>Refresh GPS</strong>.</p>
                    )}

                    {locationStatus === "ok" && (
                      <div className="rp-gps-badges">
                        {gpsAccuracy !== null && (
                          <span className={`rp-acc-badge ${gpsAccuracy <= 20 ? "acc-great" : gpsAccuracy <= 100 ? "acc-ok" : "acc-poor"}`}>
                            {gpsAccuracy <= 20 ? "✓ High accuracy" : gpsAccuracy <= 100 ? "~ Medium accuracy" : "⚠ Low accuracy"} (±{Math.round(gpsAccuracy)}m)
                          </span>
                        )}
                        {gpsAccuracy !== null && gpsAccuracy > 100 && (
                          <span className="rp-acc-tip">Move outdoors for better accuracy</span>
                        )}
                      </div>
                    )}

                    {locationStatus === "ok" && (
                      <p className="rp-hint rp-hint--warn">⚠️ If the location looks wrong, tap <strong>Refresh GPS</strong> to try again.</p>
                    )}
                  </div>
                </div>

                {/* Step 4 — Description */}
                <div className="rp-card">
                  <div className="rp-card-label"><span className="rp-step-badge">04</span>Incident Details</div>
                  <div className="rp-field">
                    <label className="rp-label">Detailed Description</label>
                    <textarea className="rp-textarea" rows={5} placeholder="Describe what happened — include time, number of people involved, severity, and any other relevant details…" value={description} onChange={e => setDescription(e.target.value)} required />
                  </div>
                </div>

                {/* Step 5 — Evidence */}
                <div className="rp-card">
                  <div className="rp-card-label"><span className="rp-step-badge">05</span>Upload Evidence <span className="rp-optional">(optional)</span></div>
                  <div className="rp-dropzone" onClick={() => fileRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files[0];
                      if (file && fileRef.current) {
                        const dt = new DataTransfer(); dt.items.add(file);
                        fileRef.current.files = dt.files;
                        setFileName(file.name); setFileObject(file); setUploadProgress("idle");
                      }
                    }}>
                    <input ref={fileRef} type="file" accept="image/*,video/*" style={{ display: "none" }} onChange={handleFileChange} />
                    {fileName
                      ? (<><span className="rp-dropzone-icon">📎</span><span className="rp-dropzone-name">{fileName}</span><span className="rp-dropzone-change">Click to change</span></>)
                      : (<><span className="rp-dropzone-icon">📤</span><span className="rp-dropzone-text">Click to select or drag & drop</span><span className="rp-dropzone-hint">Photos or Videos accepted</span></>)
                    }
                  </div>
                  {uploadProgress === "uploading" && <div className="rp-upload-status rp-upload-status--uploading">⏳ Uploading evidence…</div>}
                  {uploadProgress === "done"      && <div className="rp-upload-status rp-upload-status--done">✅ Evidence uploaded successfully</div>}
                  {uploadProgress === "error"     && <div className="rp-upload-status rp-upload-status--error">❌ Upload failed — please try again</div>}
                </div>

                {/* Disclaimer */}
                <div className="rp-disclaimer">
                  <div className="rp-disclaimer-header">
                    <span className="rp-disclaimer-icon">⚖️</span>
                    <span className="rp-disclaimer-title">Legal Acknowledgment</span>
                  </div>
                  <p className="rp-disclaimer-summary">By submitting this report, you confirm that the information provided is true and accurate to the best of your knowledge.</p>
                  <label className="rp-check-label">
                    <input type="checkbox" className="rp-checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} required />
                    <span className="rp-check-box" aria-hidden="true">{agreed ? "✓" : ""}</span>
                    <span className="rp-check-text">I understand that submitting <strong>false, misleading, or malicious reports</strong> is punishable under the <strong>Cybercrime Prevention Act of 2012 (RA 10175)</strong>, the <strong>Penal Code</strong>, and other applicable Philippine laws. Penalties may include fines and imprisonment. All reports are logged and may be investigated by authorities.</span>
                  </label>
                </div>

                {submitError && (
                  <div className="rp-error-banner">
                    <div style={{ marginBottom: uploadProgress === "error" ? 10 : 0 }}>⚠️ {submitError}</div>
                    {uploadProgress === "error" && (
                      <button type="button" className="rp-skip-evidence-btn" onClick={() => { setFileObject(null); setFileName(null); setUploadProgress("idle"); setSubmitError(null); }}>
                        Remove evidence and submit without it →
                      </button>
                    )}
                  </div>
                )}

                <button type="submit" className="rp-submit" disabled={!agreed || !selectedType || submitting}>
                  {submitting ? (
                    <>
                      <span className="rp-loader"></span>
                      <span>Submitting…</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Incident Report</span>
                      <span className="rp-submit-arrow">→</span>
                    </>
                  )}
                </button>

              </form>
            </div>

            {/* RIGHT — Sidebar */}
            <div className="rp-right">
              <div className="rp-sidebar-card">
                <div className="rp-sidebar-title">Emergency Hotlines</div>
                <div className="rp-hotlines">
                  {EMERGENCY_HOTLINES.map((h) => (
                    <a key={h.number} href={`tel:${h.number}`} className="rp-hotline" style={{ "--h-color": h.color } as React.CSSProperties}>
                      <span className="rp-hotline-icon">{h.icon}</span>
                      <div className="rp-hotline-info">
                        <span className="rp-hotline-label">{h.label}</span>
                        <span className="rp-hotline-number">{h.number}</span>
                      </div>
                      <span className="rp-hotline-call">Call →</span>
                    </a>
                  ))}
                </div>
              </div>
              <div className="rp-sidebar-card rp-sidebar-card--warn">
                <div className="rp-sidebar-title">⚠️ Emergency Reminder</div>
                <p className="rp-sidebar-text">If someone is in immediate danger, call emergency services directly. Do not rely solely on this form in life-threatening situations.</p>
              </div>
              <div className="rp-sidebar-card rp-sidebar-card--info">
                <div className="rp-sidebar-title">🛡️ Your Safety Matters</div>
                <p className="rp-sidebar-text">Your identity and contact information are kept strictly confidential. You may submit anonymously if preferred.</p>
              </div>
              <div className="rp-sidebar-card rp-sidebar-card--track">
                <div className="rp-sidebar-title">📍 Track Your Report</div>
                <p className="rp-sidebar-text">Create an account to track the status of your incident reports in real-time. You'll receive updates as authorities respond and investigate your report.</p>
                <button onClick={() => navigate("/signup")} className="rp-track-link" style={{ cursor: "pointer", marginLeft: 0 }}>Create Account or Login →</button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:       #07101d;
    --surface:  rgba(13,27,46,0.72);
    --surface2: rgba(13,27,46,0.88);
    --input-bg: #060f1c;
    --border:   rgba(0,200,224,0.08);
    --border2:  rgba(0,200,224,0.18);
    --text:     #ddeef8;
    --text2:    rgba(160,200,224,0.65);
    --text3:    rgba(160,200,224,0.30);
    --red:      #e8372a;
    --cyan:     #00c8e0;
    --green:    #2ECC8F;
    --yellow:   #F5C842;
    --blue:     #5B8DEF;
    --radius:   13px;
  }

  .rp-root {
    min-height: 100vh;
    font-family: 'DM Sans', sans-serif;
    color: var(--text);
    background: var(--bg);
    position: relative;
    overflow-x: hidden;
  }

  .rp-bg-img {
    width: 100%; height: 100%;
    object-fit: cover; object-position: center; display: block;
    transform-origin: center center;
    animation: bgDrift 32s ease-in-out infinite;
    will-change: transform;
  }
  .rp-bg { position: fixed; inset: 0; z-index: 0; overflow: hidden; }

  @keyframes bgDrift {
    0%   { transform: scale(1.08) translate(0px,   0px);   }
    25%  { transform: scale(1.12) translate(-16px, -10px); }
    50%  { transform: scale(1.10) translate(-6px,  -18px); }
    75%  { transform: scale(1.13) translate(14px,  -6px);  }
    100% { transform: scale(1.08) translate(0px,   0px);   }
  }

  .rp-bg-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(
      180deg,
      rgba(7,16,29,0.82) 0%,
      rgba(7,16,29,0.68) 40%,
      rgba(7,16,29,0.82) 75%,
      rgba(7,16,29,0.97) 100%
    );
  }
  .rp-bg-atmosphere {
    position: absolute; inset: 0; pointer-events: none;
    background:
      radial-gradient(ellipse 60% 50% at 10% 0%,  rgba(232,55,42,0.09)  0%, transparent 65%),
      radial-gradient(ellipse 55% 60% at 90% 100%, rgba(0,200,224,0.07)  0%, transparent 70%),
      radial-gradient(ellipse 40% 40% at 55% 45%,  rgba(13,27,46,0.40)   0%, transparent 60%);
  }
  .rp-bg-grain {
    position: absolute; inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
    background-size: 200px; opacity: 0.45; pointer-events: none;
  }

  .rp-body {
    position: relative; z-index: 1;
    max-width: 1140px; margin: 0 auto;
    padding: 0 32px 96px;
  }
  .rp-body--center { display: flex; align-items: center; justify-content: center; min-height: 80vh; }

  .rp-hero {
    padding: 40px 0 40px;
    animation: rpFadeUp 0.55s ease both;
  }
  .rp-eyebrow {
    font-family: 'DM Sans', sans-serif;
    font-size: 11px; font-weight: 500;
    letter-spacing: 0.20em; text-transform: uppercase;
    color: var(--red); margin-bottom: 16px;
    display: flex; align-items: center; gap: 10px;
  }
  .rp-eyebrow::after { content: ''; display: block; width: 40px; height: 1px; background: var(--red); opacity: 0.5; }

  .rp-title {
    font-family: 'Syne', sans-serif;
    font-size: clamp(34px, 5.5vw, 72px);
    font-weight: 800; letter-spacing: -0.03em;
    color: #F8FAFC; line-height: 0.97;
    margin-bottom: 16px;
  }
  .rp-title .accent {
    color: #A8D8FF;
    -webkit-text-stroke: 0;
    display: inline;
    white-space: nowrap;
  }

  .rp-sub {
    font-family: 'DM Sans', sans-serif;
    font-size: 16px; font-weight: 300;
    color: rgba(160,200,224,0.60); max-width: 480px; line-height: 1.68;
    margin-bottom: 28px;
  }

  .rp-tracking-banner {
    display: flex; align-items: center; gap: 16px;
    background: linear-gradient(135deg, rgba(46,204,143,0.08), rgba(0,200,224,0.05));
    border: 1px solid rgba(46,204,143,0.20);
    border-radius: 12px; padding: 16px 18px;
    margin-bottom: 28px; animation: rpFadeUp 0.55s ease both;
  }
  .rp-banner-icon { font-size: 24px; flex-shrink: 0; }
  .rp-banner-content { flex: 1; }
  .rp-banner-title {
    font-family: 'Syne', sans-serif;
    font-size: 13px; font-weight: 800; letter-spacing: -0.02em;
    color: var(--green); margin-bottom: 4px;
  }
  .rp-banner-text {
    font-family: 'DM Sans', sans-serif;
    font-size: 12px; font-weight: 300; color: rgba(160,200,224,0.55);
    line-height: 1.5; margin: 0;
  }
  .rp-banner-text strong { font-weight: 500; color: rgba(46,204,143,0.80); }
  .rp-banner-cta {
    display: inline-flex; align-items: center; gap: 6px;
    font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 600;
    color: var(--green); background: rgba(46,204,143,0.12);
    border: 1px solid rgba(46,204,143,0.25); border-radius: 8px;
    padding: 8px 14px; text-decoration: none;
    transition: background 0.18s, border-color 0.18s, transform 0.18s;
    flex-shrink: 0; white-space: nowrap;
  }
  .rp-banner-cta:hover { background: rgba(46,204,143,0.20); border-color: rgba(46,204,143,0.40); transform: translateY(-1px); }

  .rp-steps {
    display: flex; align-items: center; gap: 0;
    margin-bottom: 28px;
    background: var(--surface); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
    border: 1px solid var(--border); border-radius: var(--radius);
    padding: 16px 20px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    flex-wrap: nowrap;
    animation: rpFadeUp 0.55s ease 0.05s both;
    -webkit-mask-image: linear-gradient(to right, black 0%, black calc(100% - 48px), transparent 100%);
    mask-image: linear-gradient(to right, black 0%, black calc(100% - 48px), transparent 100%);
  }
  .rp-steps::-webkit-scrollbar { display: none; }

  .rp-step-item { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
  .rp-step-dot {
    width: 24px; height: 24px; border-radius: 50%;
    border: 1px solid var(--border2); background: rgba(13,27,46,0.60);
    display: flex; align-items: center; justify-content: center;
    font-family: 'DM Sans', sans-serif;
    font-size: 10px; font-weight: 500; color: var(--text3);
    transition: all 0.3s ease; flex-shrink: 0;
  }
  .rp-step-item--done .rp-step-dot  { background: rgba(46,204,143,0.15); border-color: var(--green); color: var(--green); }
  .rp-step-item--active .rp-step-dot { background: rgba(232,55,42,0.15); border-color: var(--red); color: var(--red); box-shadow: 0 0 8px rgba(232,55,42,0.30); }
  .rp-step-label {
    font-family: 'DM Sans', sans-serif;
    font-size: 11px; font-weight: 400;
    color: var(--text3); white-space: nowrap; transition: color 0.3s ease;
  }
  .rp-step-item--done .rp-step-label   { color: rgba(46,204,143,0.60); }
  .rp-step-item--active .rp-step-label { color: rgba(232,55,42,0.80); }
  .rp-step-line { width: 20px; height: 1px; background: var(--border); margin: 0 6px; flex-shrink: 0; }

  .rp-layout {
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: 24px;
    align-items: start;
  }
  .rp-left  { order: 0; }
  .rp-right { order: 1; }

  .rp-form { display: flex; flex-direction: column; gap: 18px; }
  .rp-card {
    background: var(--surface); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
    border: 1px solid var(--border); border-radius: var(--radius);
    padding: 22px 20px; display: flex; flex-direction: column; gap: 16px;
    animation: rpFadeUp 0.55s ease both;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  }
  .rp-card:nth-child(1) { animation-delay: 0.08s; }
  .rp-card:nth-child(2) { animation-delay: 0.14s; }
  .rp-card:nth-child(3) { animation-delay: 0.20s; }
  .rp-card:nth-child(4) { animation-delay: 0.26s; }
  .rp-card:nth-child(5) { animation-delay: 0.32s; }

  .rp-card-label {
    font-family: 'Syne', sans-serif;
    font-size: 13px; font-weight: 800;
    color: var(--text); display: flex; align-items: center; gap: 10px;
    letter-spacing: -0.02em;
  }
  .rp-step-badge {
    font-family: 'Syne', sans-serif;
    font-size: 10px; font-weight: 700; letter-spacing: 0.10em;
    color: var(--text3); border: 1px solid var(--border2);
    border-radius: 4px; padding: 2px 6px;
  }
  .rp-optional { font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 300; color: var(--text3); margin-left: 4px; }

  .rp-type-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .rp-type-btn {
    background: rgba(13,27,46,0.60); border: 1px solid var(--border);
    border-radius: 9px; padding: 12px 10px;
    display: flex; flex-direction: column; align-items: center; gap: 7px;
    cursor: pointer; transition: transform 0.20s, border-color 0.20s, background 0.20s;
    font-family: 'DM Sans', sans-serif;
  }
  .rp-type-btn:hover { transform: translateY(-2px); border-color: var(--t-accent); background: var(--t-alpha); }
  .rp-type-btn--active { border-color: var(--t-accent) !important; background: var(--t-alpha) !important; transform: translateY(-2px); box-shadow: 0 0 20px rgba(var(--t-accent), 0.25); }
  .rp-type-icon { font-size: 20px; }
  .rp-type-label { font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 500; color: var(--text2); text-align: center; line-height: 1.3; }
  .rp-type-confirm {
    display: flex; align-items: center; gap: 8px;
    font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500;
    color: var(--t-accent); background: var(--t-alpha);
    border: 1px solid var(--t-accent); border-radius: 7px; padding: 8px 14px;
    animation: rpFadeUp 0.3s ease both;
  }

  .rp-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .rp-field { display: flex; flex-direction: column; gap: 8px; }
  .rp-label {
    font-family: 'DM Sans', sans-serif;
    font-size: 10px; font-weight: 500; letter-spacing: 0.20em; text-transform: uppercase;
    color: var(--text3);
  }
  .rp-input {
    background: var(--input-bg); border: 1px solid var(--border);
    border-radius: 8px; padding: 11px 13px;
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 400;
    color: var(--text); outline: none; width: 100%;
    transition: border-color 0.18s, background 0.18s;
    caret-color: var(--cyan);
  }
  .rp-input::placeholder { color: var(--text3); }
  .rp-input:focus { border-color: rgba(0,200,224,0.50); background: rgba(0,200,224,0.04); box-shadow: 0 0 12px rgba(0,200,224,0.15); }
  .rp-textarea {
    background: var(--input-bg); border: 1px solid var(--border);
    border-radius: 8px; padding: 11px 13px;
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 300;
    color: var(--text); outline: none; width: 100%; resize: vertical; line-height: 1.6;
    transition: border-color 0.18s, background 0.18s; caret-color: var(--cyan);
  }
  .rp-textarea::placeholder { color: var(--text3); }
  .rp-textarea:focus { border-color: rgba(0,200,224,0.50); background: rgba(0,200,224,0.04); box-shadow: 0 0 12px rgba(0,200,224,0.15); }

  .rp-location-row {
    display: flex;
    align-items: stretch;
    gap: 8px;
  }
  .rp-location-input-wrap {
    position: relative;
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
  }
  .rp-location-dot {
    position: absolute;
    left: 13px;
    top: 50%;
    transform: translateY(-50%);
    width: 7px; height: 7px; border-radius: 50%;
    background: var(--text3);
    transition: background 0.3s;
    z-index: 1;
    flex-shrink: 0;
    pointer-events: none;
  }
  .rp-location-dot[data-status="loading"] { background: var(--yellow); animation: rpPulse 1.2s ease infinite; }
  .rp-location-dot[data-status="ok"]      { background: var(--green); }
  .rp-location-dot[data-status="error"]   { background: var(--red); }
  .rp-input--location { padding-left: 30px; width: 100%; }

  .rp-gps-btn {
    flex-shrink: 0;
    background: rgba(0,200,224,0.08); border: 1px solid rgba(0,200,224,0.20);
    border-radius: 7px; padding: 9px 12px;
    font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500;
    color: var(--cyan); cursor: pointer; white-space: nowrap;
    transition: background 0.18s, border-color 0.18s;
    min-height: 44px; align-self: stretch;
    display: flex; align-items: center;
  }
  .rp-gps-btn:hover { background: rgba(0,200,224,0.15); border-color: rgba(0,200,224,0.38); }

  .rp-coords-badge {
    display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
    background: rgba(0,200,224,0.04); border: 1px solid rgba(0,200,224,0.10);
    border-radius: 7px; padding: 7px 12px;
  }
  .rp-coords-icon { font-size: 12px; flex-shrink: 0; }
  .rp-coords-text {
    font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 400;
    color: var(--text3); font-variant-numeric: tabular-nums; flex: 1;
  }

  .rp-gps-acquiring { display: flex; align-items: center; gap: 9px; margin-top: 8px; font-family: 'DM Sans', sans-serif; font-size: 12px; color: rgba(245,200,66,0.65); line-height: 1.5; }
  .rp-gps-pulse { width: 10px; height: 10px; border-radius: 50%; background: var(--yellow); flex-shrink: 0; animation: gpsPulse 1.1s ease infinite; }
  @keyframes gpsPulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.3; transform:scale(0.7); } }

  .rp-gps-badges { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 6px; }
  .rp-acc-badge { font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 500; padding: 3px 10px; border-radius: 20px; }
  .acc-great { background: rgba(46,204,143,0.12); color: var(--green); border: 1px solid rgba(46,204,143,0.25); }
  .acc-ok    { background: rgba(245,200,66,0.10); color: var(--yellow); border: 1px solid rgba(245,200,66,0.22); }
  .acc-poor  { background: rgba(232,55,42,0.10);  color: var(--red);    border: 1px solid rgba(232,55,42,0.22); }
  .rp-acc-tip { font-family: 'DM Sans', sans-serif; font-size: 11px; color: rgba(232,55,42,0.60); }

  .rp-maps-verify {
    display: inline-flex; align-items: center; gap: 4px;
    font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 500;
    color: var(--cyan);
    text-decoration: none;
    transition: opacity 0.18s;
    white-space: nowrap;
  }
  .rp-maps-verify:hover { opacity: 0.75; }

  .rp-hint { font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 300; color: var(--text3); line-height: 1.5; }
  .rp-hint--warn { font-size: 11px; color: rgba(245,200,66,0.60); }

  .rp-dropzone {
    border: 1px dashed var(--border2); border-radius: 10px;
    padding: 28px 20px; display: flex; flex-direction: column; align-items: center; gap: 6px;
    cursor: pointer; transition: border-color 0.2s, background 0.2s; text-align: center;
  }
  .rp-dropzone:hover { border-color: rgba(0,200,224,0.35); background: rgba(0,200,224,0.03); }
  .rp-dropzone-icon { font-size: 24px; }
  .rp-dropzone-text  { font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 400; color: var(--text2); }
  .rp-dropzone-name  { font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; color: var(--cyan); }
  .rp-dropzone-hint, .rp-dropzone-change { font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 300; color: var(--text3); }
  .rp-upload-status { font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500; padding: 8px 12px; border-radius: 7px; }
  .rp-upload-status--uploading { background: rgba(245,200,66,0.08); color: var(--yellow); border: 1px solid rgba(245,200,66,0.20); }
  .rp-upload-status--done      { background: rgba(46,204,143,0.08); color: var(--green);  border: 1px solid rgba(46,204,143,0.20); }
  .rp-upload-status--error     { background: rgba(232,55,42,0.08);  color: var(--red);    border: 1px solid rgba(232,55,42,0.20); }

  .rp-disclaimer {
    background: rgba(245,200,66,0.04); border: 1px solid rgba(245,200,66,0.13);
    border-radius: 10px; padding: 16px 18px;
    backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
    animation: rpFadeUp 0.55s ease 0.36s both;
    display: flex; flex-direction: column; gap: 12px;
  }
  .rp-disclaimer-header { display: flex; align-items: center; gap: 8px; }
  .rp-disclaimer-icon { font-size: 16px; }
  .rp-disclaimer-title { font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; color: rgba(245,200,66,0.80); }
  .rp-disclaimer-summary { font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 400; color: var(--text3); line-height: 1.5; margin: 0; }
  .rp-check-label { display: flex; align-items: flex-start; gap: 12px; cursor: pointer; }
  .rp-checkbox { display: none; }
  .rp-check-box {
    width: 18px; height: 18px; flex-shrink: 0;
    border: 1px solid rgba(245,200,66,0.35); border-radius: 4px;
    background: rgba(245,200,66,0.06);
    display: flex; align-items: center; justify-content: center;
    font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 500; color: var(--yellow);
    margin-top: 1px; transition: background 0.2s, border-color 0.2s;
  }
  .rp-check-text { font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 300; color: var(--text3); line-height: 1.6; }
  .rp-check-text strong { font-weight: 500; color: rgba(245,200,66,0.70); }

  .rp-error-banner {
    background: rgba(232,55,42,0.08); border: 1px solid rgba(232,55,42,0.25);
    border-radius: 8px; padding: 12px 16px;
    font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--red);
    animation: rpFadeUp 0.3s ease both;
  }
  .rp-skip-evidence-btn {
    display: inline-block; margin-top: 8px; padding: 7px 14px;
    background: rgba(232,55,42,0.12); border: 1px solid rgba(232,55,42,0.30);
    border-radius: 7px; font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500;
    color: var(--red); cursor: pointer; transition: background 0.18s;
  }
  .rp-skip-evidence-btn:hover { background: rgba(232,55,42,0.22); }

  .rp-submit {
    display: flex; align-items: center; justify-content: center; gap: 12px;
    width: 100%; padding: 15px 24px;
    font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 800;
    letter-spacing: 0.06em; text-transform: uppercase;
    color: #0b0f1a; background: var(--green);
    border: none; border-radius: 10px; cursor: pointer;
    transition: opacity 0.2s, transform 0.2s, background 0.2s;
    animation: rpFadeUp 0.55s ease 0.42s both;
  }
  .rp-submit:hover:not(:disabled) { background: #38e09e; transform: translateY(-2px); }
  .rp-submit:active:not(:disabled) { transform: translateY(0px); background: #27b885; }
  .rp-submit:disabled { opacity: 0.3; cursor: not-allowed; background: var(--surface2); color: var(--text3); }
  .rp-submit-arrow { font-size: 18px; transition: transform 0.2s; }
  .rp-submit:hover:not(:disabled) .rp-submit-arrow { transform: translateX(4px); }
  .rp-loader {
    display: inline-block;
    width: 14px; height: 14px;
    border: 2px solid rgba(11, 15, 26, 0.3);
    border-top-color: #0b0f1a;
    border-radius: 50%;
    animation: rpSpin 0.8s linear infinite;
  }
  @keyframes rpSpin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .rp-right {
    display: flex; flex-direction: column; gap: 14px;
    position: sticky; top: 76px;
    animation: rpFadeUp 0.55s ease 0.10s both;
  }
  .rp-sidebar-card {
    background: var(--surface2); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
    border: 1px solid var(--border); border-radius: var(--radius);
    padding: 18px 16px; display: flex; flex-direction: column; gap: 12px;
  }
  .rp-sidebar-card--warn  { background: rgba(245,200,66,0.05); border-color: rgba(245,200,66,0.14); }
  .rp-sidebar-card--info  { background: rgba(0,200,224,0.05);  border-color: rgba(0,200,224,0.14);  }
  .rp-sidebar-card--track { background: rgba(46,204,143,0.05); border-color: rgba(46,204,143,0.14); }
  .rp-sidebar-title {
    font-family: 'Syne', sans-serif;
    font-size: 12px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;
    color: var(--text);
  }
  .rp-sidebar-text { font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 300; color: var(--text3); line-height: 1.65; margin: 0; }
  .rp-track-link {
    display: inline-block; margin-top: 8px;
    font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500;
    color: var(--green); background: rgba(46,204,143,0.08);
    border: 1px solid rgba(46,204,143,0.20); border-radius: 7px;
    padding: 8px 12px; text-decoration: none; width: fit-content;
    transition: background 0.18s, border-color 0.18s;
  }
  .rp-track-link:hover { background: rgba(46,204,143,0.15); border-color: rgba(46,204,143,0.35); }

  .rp-hotlines { display: flex; flex-direction: column; gap: 8px; }
  .rp-hotline {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px; background: rgba(13,27,46,0.60);
    border: 1px solid var(--border); border-radius: 8px;
    text-decoration: none; transition: background 0.2s, border-color 0.2s;
    min-height: 44px;
  }
  .rp-hotline:hover { background: rgba(13,27,46,0.88); border-color: var(--h-color, var(--border2)); }
  .rp-hotline-icon { font-size: 16px; }
  .rp-hotline-info { display: flex; flex-direction: column; flex: 1; }
  .rp-hotline-label { font-family: 'DM Sans', sans-serif; font-size: 10px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text3); }
  .rp-hotline-number { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 800; color: var(--text); }
  .rp-hotline-call { font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 500; color: var(--h-color, var(--text3)); opacity: 0.7; }

  .rp-success { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 60px 24px 40px; animation: rpFadeUp 0.5s ease both; }
  .rp-success-icon {
    width: 64px; height: 64px; border-radius: 50%;
    background: rgba(46,204,143,0.12); border: 1px solid rgba(46,204,143,0.30);
    display: flex; align-items: center; justify-content: center;
    font-size: 26px; color: var(--green); margin-bottom: 24px;
  }
  .rp-success-title { font-family: 'Syne', sans-serif; font-size: 32px; font-weight: 800; color: var(--text); margin-bottom: 12px; }
  .rp-success-sub { font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 300; color: var(--text3); max-width: 480px; line-height: 1.65; margin-bottom: 40px; }

  .rp-success-actions {
    display: grid; grid-template-columns: 1fr; gap: 20px; max-width: 500px; width: 100%; margin: 0 auto 20px; justify-items: center;
  }
  .rp-success-card {
    background: var(--surface); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
    border: 1px solid var(--border); border-radius: var(--radius);
    padding: 24px 20px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    animation: rpFadeUp 0.55s ease both;
    width: 100%; max-width: 400px;
  }
  .rp-success-card-icon { font-size: 32px; }
  .rp-success-card-title { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 800; color: var(--text); letter-spacing: -0.02em; }
  .rp-success-card-text { font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 300; color: var(--text3); line-height: 1.5; margin: 0; }

  .rp-btn-primary {
    display: inline-flex; align-items: center;
    margin-top: 8px;
    font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 600;
    color: #0b0f1a; background: var(--green);
    border: none; border-radius: 7px;
    padding: 9px 16px; text-decoration: none; cursor: pointer;
    transition: background 0.18s, transform 0.18s;
    min-height: 40px;
  }
  .rp-btn-primary:hover { background: #38e09e; transform: translateY(-2px); }
  .rp-btn-primary--ghost {
    color: var(--green); background: rgba(46,204,143,0.08);
    border: 1px solid rgba(46,204,143,0.20);
  }
  .rp-btn-primary--ghost:hover { background: rgba(46,204,143,0.15); border-color: rgba(46,204,143,0.35); }

  @media (max-width: 860px) {
    .rp-body { padding: 0 20px 80px; }
    .rp-hero { padding: 28px 0 32px; }
    .rp-tracking-banner { flex-direction: column; align-items: flex-start; gap: 12px; margin-bottom: 24px; }
    .rp-banner-cta { width: 100%; justify-content: center; }
    .rp-title { font-size: clamp(28px, 7.5vw, 52px); }
    .rp-layout { grid-template-columns: 1fr; gap: 20px; }
    .rp-left  { order: 0; }
    .rp-right { order: 1; position: static; top: auto; }
    .rp-hotlines { flex-direction: row; flex-wrap: wrap; gap: 8px; }
    .rp-hotline { flex: 1 1 calc(50% - 4px); min-width: 120px; }
    .rp-steps { padding: 12px 16px; -webkit-mask-image: linear-gradient(to right, black 0%, black calc(100% - 36px), transparent 100%); mask-image: linear-gradient(to right, black 0%, black calc(100% - 36px), transparent 100%); }
  }

  @media (max-width: 600px) {
    .rp-fields { grid-template-columns: 1fr; }
    .rp-body { padding: 0 16px 80px; }
    .rp-title { font-size: clamp(26px, 7vw, 42px); }
    .rp-success-actions { grid-template-columns: 1fr; gap: 16px; }
    .rp-success-card { padding: 20px 16px; }
  }

  @media (max-width: 500px) {
    .rp-location-row { flex-direction: column; align-items: stretch; }
    .rp-gps-btn { width: 100%; justify-content: center; }
    .rp-steps { -webkit-mask-image: none; mask-image: none; justify-content: space-between; padding: 10px 14px; }
    .rp-step-label { width: 0; font-size: 0; overflow: hidden; padding: 0; margin: 0; }
    .rp-step-line { width: 10px; margin: 0 2px; }
    .rp-step-dot { width: 28px; height: 28px; font-size: 11px; }
    .rp-hotline { flex: 1 1 100%; }
  }

  @media (max-width: 380px) {
    .rp-body { padding: 0 12px 80px; }
    .rp-title { font-size: 24px; }
    .rp-type-grid { grid-template-columns: repeat(2, 1fr); gap: 6px; }
    .rp-type-btn  { padding: 10px 8px; }
    .rp-type-icon { font-size: 18px; }
    .rp-type-label { font-size: 10px; }
  }

  @keyframes rpFadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes rpPulse  { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
`;