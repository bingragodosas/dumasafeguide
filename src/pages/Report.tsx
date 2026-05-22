import { useEffect, useRef, useState } from "react";

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

const GEO_OPTIONS: PositionOptions = { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 };

export default function Report() {
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
  const [reporterName, setReporterName]       = useState("");
  const [reporterContact, setReporterContact] = useState("");
  const [description, setDescription]         = useState("");
  const [manualAddress, setManualAddress]     = useState("");

  const fileRef = useRef<HTMLInputElement>(null);
  const activeType = INCIDENT_TYPES.find((t) => t.value === selectedType);

  async function reverseGeocode(lat: string, lng: string) {
    try {
      const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
      const data = await res.json();
      const parts: string[] = [];
      if (data.locality) parts.push(data.locality);
      if (data.city && data.city !== data.locality) parts.push(data.city);
      if (data.principalSubdivision) parts.push(data.principalSubdivision);
      if (data.countryName) parts.push(data.countryName);
      if (parts.length > 0) { setAddress(parts.join(", ")); return; }
    } catch { /* fall through */ }
    try {
      const res2 = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=16&addressdetails=1`, { headers: { "Accept-Language": "en" } });
      const data2 = await res2.json();
      if (data2?.address) {
        const a = data2.address;
        const parts2: string[] = [];
        if (a.village || a.suburb || a.hamlet) parts2.push(a.village ?? a.suburb ?? a.hamlet);
        if (a.municipality || a.city || a.town) parts2.push(a.municipality ?? a.city ?? a.town);
        if (a.province || a.state) parts2.push(a.province ?? a.state);
        if (a.country) parts2.push(a.country);
        if (parts2.length > 0) { setAddress(parts2.join(", ")); return; }
        if (data2.display_name) setAddress(data2.display_name);
      }
    } catch { /* both failed */ }
  }

  function acquireGPS(onSuccess: (lat: string, lng: string, acc: number) => void, onError: () => void) {
    let watchId: number | null = null;
    let settled = false;
    const stop = () => { if (watchId !== null) { navigator.geolocation.clearWatch(watchId); watchId = null; } };
    const timer = setTimeout(() => { if (!settled) { settled = true; stop(); onError(); } }, 30000);
    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const acc = pos.coords.accuracy;
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        if (!settled && acc <= 50) { settled = true; clearTimeout(timer); stop(); onSuccess(lat, lng, acc); }
        else if (!settled) { onSuccess(lat, lng, acc); }
      },
      () => { if (!settled) { settled = true; clearTimeout(timer); stop(); onError(); } },
      GEO_OPTIONS
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
      type: selectedType, description: description.trim() || null, location: location || null,
      address: manualAddress.trim() || address || null, reporter_name: reporterName.trim() || null,
      reporter_contact: reporterContact.trim() || null, status: "pending", user_id: user?.id ?? null,
      responder_id: null, evidence_url: evidenceUrl,
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
    else if (locationStatus === "ok") setCurrentStep(2);
    else if (locationStatus !== "idle") setCurrentStep(2);
    else if (selectedType) setCurrentStep(1);
    else setCurrentStep(0);
  }, [selectedType, locationStatus, fileName, agreed, description]);

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
              <button className="rp-btn-ghost" onClick={() => {
                setSubmitted(false); setSelectedType(null); setDescription("");
                setReporterName(""); setReporterContact(""); setFileName(null);
                setFileObject(null); setAgreed(false); setUploadProgress("idle"); setManualAddress("");
              }}>
                Submit another report
              </button>
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
                    <label className="rp-label">GPS Coordinates (auto-detected)</label>
                    <div className="rp-location-wrap">
                      <span className="rp-location-dot" data-status={locationStatus} />
                      <input className="rp-input rp-input--location" type="text" readOnly
                        value={locationStatus === "loading" ? "Acquiring GPS — please wait…" : locationStatus === "error" ? "GPS unavailable — fill address below" : location}
                        placeholder="Tap Refresh GPS →" />
                      <button type="button" className="rp-gps-btn" onClick={() => {
                        setLocationStatus("loading"); setAddress(null); setGpsAccuracy(null);
                        acquireGPS(async (lat, lng, acc) => {
                          setLocation(`${lat}, ${lng}`); setGpsAccuracy(acc); setLocationStatus("ok");
                          await reverseGeocode(lat, lng);
                        }, () => setLocationStatus("error"));
                      }}>📍 Refresh GPS</button>
                    </div>
                    {locationStatus === "loading" && (
                      <div className="rp-gps-acquiring"><span className="rp-gps-pulse" /><span>Searching for GPS signal… keep your device still and outdoors.</span></div>
                    )}
                    {locationStatus === "error" && <p className="rp-hint rp-hint--warn">⚠️ GPS access was denied or timed out. Allow location access or type your address below.</p>}
                    {locationStatus === "ok" && location && (
                      <div className="rp-gps-result">
                        <div className="rp-gps-badges">
                          {gpsAccuracy !== null && (
                            <span className={`rp-acc-badge ${gpsAccuracy <= 20 ? "acc-great" : gpsAccuracy <= 100 ? "acc-ok" : "acc-poor"}`}>
                              {gpsAccuracy <= 20 ? "✓ High accuracy" : gpsAccuracy <= 100 ? "~ Medium accuracy" : "⚠ Low accuracy"} (±{Math.round(gpsAccuracy)}m)
                            </span>
                          )}
                          {gpsAccuracy !== null && gpsAccuracy > 100 && <span className="rp-acc-tip">Move outdoors for better accuracy</span>}
                        </div>
                        <a href={`https://www.google.com/maps?q=${location}`} target="_blank" rel="noopener noreferrer" className="rp-maps-verify">🗺 Verify on Google Maps</a>
                        <p className="rp-hint rp-hint--warn">⚠️ If the pin is wrong, tap <strong>Refresh GPS</strong> or type your address below.</p>
                      </div>
                    )}
                    {locationStatus === "ok" && address && (
                      <div className="rp-detected-address">
                        <span className="rp-detected-label">📡 Auto-detected address</span>
                        <span className="rp-detected-value">{address}</span>
                      </div>
                    )}
                  </div>
                  <div className="rp-field">
                    <label className="rp-label">Exact Address / Location Description <span className="rp-loc-required">★ Please fill this in</span></label>
                    <input className="rp-input rp-input--address" type="text" placeholder="e.g. Purok 3, Brgy. Boloboloc, Sibulan, Negros Oriental" value={manualAddress} onChange={e => setManualAddress(e.target.value)} />
                    <p className="rp-hint rp-hint--info">📌 GPS coordinates are saved automatically. Add your barangay, street, or landmark so responders can find you faster. <strong>Always confirm your actual location here.</strong></p>
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
                  <label className="rp-check-label">
                    <input type="checkbox" className="rp-checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} required />
                    <span className="rp-check-box" aria-hidden="true">{agreed ? "✓" : ""}</span>
                    <span className="rp-check-text">I understand that submitting false or malicious reports is punishable under the <strong>Cybercrime Prevention Act of 2012 (RA 10175)</strong> and other applicable Philippine laws.</span>
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
                  <span>{submitting ? "Submitting…" : "Submit Incident Report"}</span>
                  {!submitting && <span className="rp-submit-arrow">→</span>}
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
              <div className="rp-sidebar-card rp-sidebar-card--dark">
                <div className="rp-sidebar-title">🕵️ Silent Report</div>
                <p className="rp-sidebar-text">Need to tip-off authorities discreetly? Use our anonymous hotline or scan below.</p>
                <div className="rp-qr-placeholder">
                  <div className="rp-qr-inner">QR</div>
                  <span>Scan to report anonymously</span>
                </div>
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
  /* ── Fonts: Syne 800 (headings) + DM Sans 300/400/500 (body) — matches About page ── */
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

  /* ── Background ── */
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

  /* ── Body ── */
  .rp-body {
    position: relative; z-index: 1;
    max-width: 1140px; margin: 0 auto;
    padding: 0 32px 96px;
  }
  .rp-body--center { display: flex; align-items: center; justify-content: center; min-height: 80vh; }

  /* ── Hero ── */
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

  /* FIX 1: Title — use nowrap on the inline span so "Incident" stays with "an" as long as possible */
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
  }

  /* ── Step progress ── */
  /* FIX 2: Horizontally scrollable with fade-right hint, no wrapping */
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
    /* Right fade hint — users see content fading right = more to scroll */
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

  /* ── Grid ── */
  /* FIX 3: form (rp-left) always comes first, sidebar (rp-right) always below on mobile */
  .rp-layout {
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: 24px;
    align-items: start;
  }
  .rp-left  { order: 0; }
  .rp-right { order: 1; }

  /* ── Form cards ── */
  .rp-form { display: flex; flex-direction: column; gap: 14px; }
  .rp-card {
    background: var(--surface); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
    border: 1px solid var(--border); border-radius: var(--radius);
    padding: 22px 20px; display: flex; flex-direction: column; gap: 16px;
    animation: rpFadeUp 0.55s ease both;
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

  /* Type grid */
  .rp-type-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .rp-type-btn {
    background: rgba(13,27,46,0.60); border: 1px solid var(--border);
    border-radius: 9px; padding: 12px 10px;
    display: flex; flex-direction: column; align-items: center; gap: 7px;
    cursor: pointer; transition: transform 0.20s, border-color 0.20s, background 0.20s;
    font-family: 'DM Sans', sans-serif;
  }
  .rp-type-btn:hover { transform: translateY(-2px); border-color: var(--t-accent); background: var(--t-alpha); }
  .rp-type-btn--active { border-color: var(--t-accent) !important; background: var(--t-alpha) !important; transform: translateY(-2px); }
  .rp-type-icon { font-size: 20px; }
  .rp-type-label { font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 500; color: var(--text2); text-align: center; line-height: 1.3; }
  .rp-type-confirm {
    display: flex; align-items: center; gap: 8px;
    font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500;
    color: var(--t-accent); background: var(--t-alpha);
    border: 1px solid var(--t-accent); border-radius: 7px; padding: 8px 14px;
    animation: rpFadeUp 0.3s ease both;
  }

  /* Fields */
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
  .rp-input:focus { border-color: rgba(0,200,224,0.38); background: rgba(0,200,224,0.02); box-shadow: 0 0 0 3px rgba(0,200,224,0.06); }
  .rp-textarea {
    background: var(--input-bg); border: 1px solid var(--border);
    border-radius: 8px; padding: 11px 13px;
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 300;
    color: var(--text); outline: none; width: 100%; resize: vertical; line-height: 1.6;
    transition: border-color 0.18s, background 0.18s; caret-color: var(--cyan);
  }
  .rp-textarea::placeholder { color: var(--text3); }
  .rp-textarea:focus { border-color: rgba(0,200,224,0.38); background: rgba(0,200,224,0.02); box-shadow: 0 0 0 3px rgba(0,200,224,0.06); }

  /* Location */
  /* FIX 5 base: flex-wrap so GPS button can drop below on narrow screens */
  .rp-location-wrap { position: relative; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .rp-location-dot {
    position: absolute; left: 13px; top: 14px;
    width: 7px; height: 7px; border-radius: 50%; background: var(--text3);
    transition: background 0.3s; z-index: 1; flex-shrink: 0;
  }
  .rp-location-dot[data-status="loading"] { background: var(--yellow); animation: rpPulse 1.2s ease infinite; }
  .rp-location-dot[data-status="ok"]      { background: var(--green); }
  .rp-location-dot[data-status="error"]   { background: var(--red); }
  .rp-input--location { padding-left: 30px; flex: 1; min-width: 0; }
  .rp-gps-btn {
    flex-shrink: 0;
    background: rgba(0,200,224,0.08); border: 1px solid rgba(0,200,224,0.20);
    border-radius: 7px; padding: 9px 12px;
    font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500;
    color: var(--cyan); cursor: pointer; white-space: nowrap;
    transition: background 0.18s, border-color 0.18s;
    min-height: 44px;
  }
  .rp-gps-btn:hover { background: rgba(0,200,224,0.15); border-color: rgba(0,200,224,0.38); }

  .rp-gps-acquiring { display: flex; align-items: center; gap: 9px; margin-top: 8px; font-family: 'DM Sans', sans-serif; font-size: 12px; color: rgba(245,200,66,0.65); line-height: 1.5; }
  .rp-gps-pulse { width: 10px; height: 10px; border-radius: 50%; background: var(--yellow); flex-shrink: 0; animation: gpsPulse 1.1s ease infinite; }
  @keyframes gpsPulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.3; transform:scale(0.7); } }

  .rp-gps-result { display: flex; flex-direction: column; gap: 6px; margin-top: 8px; }
  .rp-gps-badges { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .rp-acc-badge { font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 500; padding: 3px 10px; border-radius: 20px; }
  .acc-great { background: rgba(46,204,143,0.12); color: var(--green); border: 1px solid rgba(46,204,143,0.25); }
  .acc-ok    { background: rgba(245,200,66,0.10); color: var(--yellow); border: 1px solid rgba(245,200,66,0.22); }
  .acc-poor  { background: rgba(232,55,42,0.10);  color: var(--red);    border: 1px solid rgba(232,55,42,0.22); }
  .rp-acc-tip { font-family: 'DM Sans', sans-serif; font-size: 11px; color: rgba(232,55,42,0.60); }
  .rp-maps-verify {
    display: inline-flex; align-items: center; gap: 6px;
    font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500;
    color: var(--cyan); background: rgba(0,200,224,0.06);
    border: 1px solid rgba(0,200,224,0.18); border-radius: 7px;
    padding: 7px 12px; text-decoration: none; width: fit-content;
    transition: background 0.18s;
  }
  .rp-maps-verify:hover { background: rgba(0,200,224,0.12); }
  .rp-hint { font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 300; color: var(--text3); line-height: 1.5; }
  .rp-hint--warn { font-size: 11px; color: rgba(245,200,66,0.60); }
  .rp-hint--info { font-size: 11.5px; color: rgba(160,200,224,0.45); line-height: 1.6; margin-top: 4px; }
  .rp-hint--info strong { color: rgba(245,200,66,0.65); font-weight: 500; }
  .rp-detected-address { display: flex; flex-direction: column; gap: 3px; margin-top: 6px; padding: 9px 12px; background: rgba(46,204,143,0.05); border: 1px solid rgba(46,204,143,0.15); border-radius: 8px; }
  .rp-detected-label { font-family: 'DM Sans', sans-serif; font-size: 9.5px; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(46,204,143,0.55); }
  .rp-detected-value { font-family: 'DM Sans', sans-serif; font-size: 12px; color: var(--text2); line-height: 1.5; }
  .rp-input--address { border-color: rgba(245,200,66,0.20) !important; }
  .rp-input--address:focus { border-color: rgba(245,200,66,0.45) !important; background: rgba(245,200,66,0.03) !important; }
  .rp-loc-required { font-family: 'DM Sans', sans-serif; font-size: 10px; font-weight: 500; color: rgba(245,200,66,0.60); margin-left: 6px; }

  /* Dropzone */
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

  /* Disclaimer */
  .rp-disclaimer {
    background: rgba(245,200,66,0.04); border: 1px solid rgba(245,200,66,0.13);
    border-radius: 10px; padding: 16px 18px;
    backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
    animation: rpFadeUp 0.55s ease 0.36s both;
  }
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

  /* Submit */
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
  .rp-submit:disabled { opacity: 0.3; cursor: not-allowed; background: var(--surface2); color: var(--text3); }
  .rp-submit-arrow { font-size: 18px; transition: transform 0.2s; }
  .rp-submit:hover:not(:disabled) .rp-submit-arrow { transform: translateX(4px); }

  /* ── Sidebar ── */
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
  .rp-sidebar-card--warn { background: rgba(245,200,66,0.05); border-color: rgba(245,200,66,0.14); }
  .rp-sidebar-card--info { background: rgba(0,200,224,0.05); border-color: rgba(0,200,224,0.14); }
  .rp-sidebar-card--dark { background: rgba(6,15,28,0.70); border-color: var(--border); }
  .rp-sidebar-title {
    font-family: 'Syne', sans-serif;
    font-size: 12px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;
    color: var(--text);
  }
  .rp-sidebar-text { font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 300; color: var(--text3); line-height: 1.65; }

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

  .rp-qr-placeholder { display: flex; flex-direction: column; align-items: center; gap: 8px; margin-top: 4px; }
  .rp-qr-inner {
    width: 72px; height: 72px; background: rgba(13,27,46,0.60);
    border: 1px solid var(--border2); border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 800; color: var(--text3);
  }
  .rp-qr-placeholder span { font-family: 'DM Sans', sans-serif; font-size: 11px; color: var(--text3); text-align: center; }

  /* ── Success state ── */
  .rp-success { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 80px 24px; animation: rpFadeUp 0.5s ease both; }
  .rp-success-icon {
    width: 64px; height: 64px; border-radius: 50%;
    background: rgba(46,204,143,0.12); border: 1px solid rgba(46,204,143,0.30);
    display: flex; align-items: center; justify-content: center;
    font-size: 26px; color: var(--green); margin-bottom: 24px;
  }
  .rp-success-title { font-family: 'Syne', sans-serif; font-size: 32px; font-weight: 800; color: var(--text); margin-bottom: 12px; }
  .rp-success-sub { font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 300; color: var(--text3); max-width: 400px; line-height: 1.65; margin-bottom: 32px; }
  .rp-btn-ghost {
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500;
    color: var(--text2); background: none;
    border: 1px solid var(--border2); border-radius: 7px;
    padding: 10px 20px; cursor: pointer; transition: color 0.2s, border-color 0.2s;
    min-height: 44px;
  }
  .rp-btn-ghost:hover { color: var(--text); border-color: rgba(0,200,224,0.35); }

  /* ══════════════════════════════════════════════════════
     RESPONSIVE — Mobile fixes (all in one place, clear)
  ══════════════════════════════════════════════════════ */

  /* ── Tablet and below: sidebar drops below form ── */
  @media (max-width: 860px) {
    .rp-body {
      padding: 0 20px 80px;
    }
    .rp-hero {
      padding: 28px 0 32px;
    }
    /* FIX 1: Tighter font so "Incident" doesn't orphan as a ghost word */
    .rp-title {
      font-size: clamp(28px, 7.5vw, 52px);
    }
    .rp-layout {
      grid-template-columns: 1fr;
      gap: 20px;
    }
    /* FIX 3: Form always first, sidebar always below */
    .rp-left  { order: 0; }
    .rp-right {
      order: 1;      /* ← sidebar goes BELOW the form */
      position: static;
      top: auto;
    }
    /* Sidebar on mobile: horizontal scrollable hotlines row */
    .rp-hotlines {
      flex-direction: row;
      flex-wrap: wrap;
      gap: 8px;
    }
    .rp-hotline {
      flex: 1 1 calc(50% - 4px);
      min-width: 120px;
    }
    /* FIX 2: Show more step labels before fade */
    .rp-steps {
      padding: 12px 16px;
      -webkit-mask-image: linear-gradient(to right, black 0%, black calc(100% - 36px), transparent 100%);
      mask-image: linear-gradient(to right, black 0%, black calc(100% - 36px), transparent 100%);
    }
  }

  /* ── Small mobile (≤ 600px) ── */
  @media (max-width: 600px) {
    /* FIX 6: Reporter fields stack vertically */
    .rp-fields {
      grid-template-columns: 1fr;
    }
    .rp-body {
      padding: 0 16px 80px;
    }
    .rp-title {
      font-size: clamp(26px, 7vw, 42px);
    }
  }

  /* ── Narrow mobile (≤ 500px) ── */
  @media (max-width: 500px) {
    /* FIX 5: GPS button wraps to full width below input */
    .rp-location-wrap {
      flex-direction: column;
      align-items: stretch;
    }
    .rp-location-dot {
      /* Reposition dot for stacked layout */
      top: 14px;
    }
    .rp-input--location {
      width: 100%;
    }
    .rp-gps-btn {
      width: 100%;
      text-align: center;
      justify-content: center;
    }
    /* Step bar: hide labels, show dots + lines only — all 6 fit */
    .rp-steps {
      -webkit-mask-image: none;
      mask-image: none;
      justify-content: space-between;
      padding: 10px 14px;
    }
    .rp-step-label {
      width: 0;
      font-size: 0;
      overflow: hidden;
      padding: 0;
      margin: 0;
    }
    .rp-step-line {
      width: 10px;
      margin: 0 2px;
    }
    .rp-step-dot {
      width: 28px;
      height: 28px;
      font-size: 11px;
    }
    /* Hotlines back to column on very narrow */
    .rp-hotline {
      flex: 1 1 100%;
    }
  }

  /* ── Very small (≤ 380px) ── */
  @media (max-width: 380px) {
    .rp-body { padding: 0 12px 80px; }
    .rp-title { font-size: 24px; }
    /* FIX 7: type grid stays 2-col (3-col too cramped) */
    .rp-type-grid { grid-template-columns: repeat(2, 1fr); gap: 6px; }
    .rp-type-btn  { padding: 10px 8px; }
    .rp-type-icon { font-size: 18px; }
    .rp-type-label { font-size: 10px; }
  }

  /* ── Animations ── */
  @keyframes rpFadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes rpPulse  { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
`;