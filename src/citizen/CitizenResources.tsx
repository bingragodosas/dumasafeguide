// src/citizen/CitizenResources.tsx
import { useLanguage } from "../context/LanguageContext";
import { Link } from "react-router-dom";
import './citizenPages.css';

// English fallback data — stable `id`/`key` values decouple render logic from
// display text so the Navbar language selector can switch languages at runtime.
// Localized strings resolve via t() with these English values as fallback.
const resources = [
  { id: "safety", icon: "🛡️", accent: "#2ECC8F", tag: "Community", title: "Safety Tips", desc: "Practical barangay-level guidelines to keep yourself protected before, during, and after an emergency.", to: "/citizen/safetytips", links: [{ key: "before", label: "Before a Typhoon", to: "/citizen/safetytips" }, { key: "flood", label: "Flood Safety Protocol", to: "/citizen/safetytips" }, { key: "fire", label: "Fire Prevention Guide", to: "/citizen/safetytips" }] },
  { id: "directory", icon: "📋", accent: "#4A90D9", tag: "Contacts", title: "Emergency Directory", desc: "All essential emergency hotlines — hospitals, barangay responders, and city-wide disaster management units.", to: "/citizen/directory", links: [{ key: "city", label: "City Emergency Services", to: "/citizen/directory" }, { key: "barangays", label: "Barangay Hotlines", to: "/citizen/directory" }, { key: "hospitals", label: "Hospitals & Medical", to: "/citizen/directory" }] },
  { id: "map", icon: "🗺️", accent: "#F5C842", tag: "Map", title: "Safety Map", desc: "Real-time map of incidents, evacuation centers, and emergency facilities across Dumaguete City.", to: "/citizen/map", links: [{ key: "view", label: "View Live Map", to: "/citizen/map" }, { key: "evac", label: "Evacuation Centers", to: "/citizen/map" }, { key: "heat", label: "Incident Heatmap", to: "/citizen/map" }] },
  { id: "report", icon: "📝", accent: "#EF5B5B", tag: "Report", title: "File a Report", desc: "Submit an emergency incident report directly to local responders. Fast, simple, and tracked in real-time.", to: "/citizen/report", links: [{ key: "newer", label: "New Incident Report", to: "/citizen/report" }, { key: "history", label: "My Report History", to: "/citizen/history" }, { key: "status", label: "Check Report Status", to: "/citizen/history" }] },
];

export default function CitizenResources() {
  // Consumes the active Navbar/Header language — any selector change re-renders
  // this component and re-evaluates every t() call below.
  const { language, t, tList } = useLanguage();
  // Locale for case conversions so Turkish-style edge cases follow the active language.
  const locale = language === "tl" ? "fil-PH" : "en";
  void tList;

  return (
    <div  className="citizen-page">

      {/* Sidebar is provided by the persistent CitizenLayout — see src/citizen/CitizenLayout.tsx. */}

      {/* Main */}
      <div style={{ padding: "28px 32px", minHeight: "100vh" }}>
        <div style={{ marginBottom: "32px" }}>
          <div style={{ fontSize: "10px", color: "var(--c-pending)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "8px", fontWeight: "700" }}>● {t("resources.heroTitle")}</div>
          <h1 style={{ fontSize: "34px", fontWeight: "900", color: "var(--clr-text)", marginBottom: "6px" }}>{t("resources.heroTitle")} &amp; <span style={{ color: "var(--c-pending)" }}>{t("resources.heroAccent")}</span></h1>
          <p style={{ fontSize: "12px", color: "var(--citizen-faint)", letterSpacing: "0.06em" }}>{t("resources.heroSub", "Everything you need to stay informed.").toLocaleUpperCase(locale)}</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
          {resources.map(r => {
            const tag = t(`resources.cards.${r.id}.tag`, r.tag);
            const title = t(`resources.cards.${r.id}.title`, r.title);
            const desc = t(`resources.cards.${r.id}.description`, r.desc);
            return (
              <div key={r.id} style={{ backgroundColor: "var(--citizen-card)", border: "1px solid var(--clr-border)", borderTop: `2px solid ${r.accent}`, borderRadius: "14px", padding: "24px", display: "flex", flexDirection: "column", transition: "all 0.2s" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                  <span style={{ fontSize: "28px" }}>{r.icon}</span>
                  <span style={{ fontSize: "9px", fontWeight: "700", letterSpacing: "0.12em", textTransform: "uppercase", color: r.accent, backgroundColor: `${r.accent}18`, border: `1px solid ${r.accent}40`, borderRadius: "3px", padding: "3px 7px" }}>{tag}</span>
                </div>
                <div style={{ fontSize: "17px", fontWeight: "800", color: "var(--clr-text)", marginBottom: "10px" }}>{title}</div>
                <p style={{ fontSize: "13px", color: "var(--citizen-body)", lineHeight: "1.65", marginBottom: "20px", flex: 1 }}>{desc}</p>
                <div style={{ borderTop: "1px solid var(--clr-border)", paddingTop: "14px", display: "flex", flexDirection: "column", gap: "2px" }}>
                  {r.links.map(l => (
                    <Link key={l.key} to={l.to} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", fontSize: "12px", color: "var(--citizen-faint)", textDecoration: "none", borderBottom: "1px solid var(--citizen-row-border)", transition: "color 0.2s" }}
                      onMouseEnter={e => (e.currentTarget.style.color = r.accent)}
                      onMouseLeave={e => (e.currentTarget.style.color = "var(--citizen-faint)")}>
                      <span>{t(`resources.cards.${r.id}.links.${l.key}`, l.label)}</span>
                      <span style={{ fontSize: "12px" }}>→</span>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        {/* Emergency CTA */}
        <div style={{ marginTop: "32px", backgroundColor: "rgba(232,55,42,0.07)", border: "1px solid rgba(232,55,42,0.2)", borderRadius: "14px", padding: "28px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "20px", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: "16px", fontWeight: "800", color: "var(--clr-text)", marginBottom: "6px" }}>{t("resources.cta.title")}</div>
            <p style={{ fontSize: "13px", color: "var(--citizen-faint)" }}>{t("resources.cta.desc")}</p>
          </div>
          <Link to="/citizen/report" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "12px 24px", backgroundColor: "#e8372a", borderRadius: "10px", fontSize: "12px", fontWeight: "700", color: "#fff", textDecoration: "none", letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
            🚨 {t("resources.cta.btn")}
          </Link>
        </div>
      </div>
    </div>
  );
}