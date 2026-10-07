import { useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import './citizenPages.css';
interface PhoneEntry { label: string; number: string; }
interface EmergencyAgency {
  agency: string; label: string; address: string; icon: string; accent: string;
  phones: PhoneEntry[]; notes?: string;
  /** Optional service category used by the Emergency Hotlines category filter. */
  category?: string;
  /** "24/7" style availability badge, shown as-is (language-neutral). */
  available?: string;
  /** Dictionary base key (e.g. "directory.redCross") providing localized
   *  `{name, category, description}` for this entry. */
  translationKey?: string;
}
interface Hospital {
  name: string; address: string; type: string;
  beds?: string; phones: PhoneEntry[]; notes?: string;
}
interface Barangay { name: string; hotline: string | null; evacuation: string | null; }

// Theme-aware accent text: mixes any brand hex 68/32 toward the theme text
// color, so cyan/yellow/lavender accents stay vivid on dark navy yet turn
// deep and readable on light cards. (Raw hex is kept for translucent fills,
// where the `18`/`55` suffix trick requires a real hex value.)
const themeAccent = (hex: string) => `color-mix(in srgb, ${hex} 68%, var(--clr-text))`;

const emergency: EmergencyAgency[] = [
  { agency: "PNP", label: "Police", address: "Camp Leon Kilat, Dumaguete City", icon: "🚔", accent: "#4A90D9",
    category: "lawEnforcement",
    phones: [{ label: "National", number: "911" }, { label: "Local", number: "116" }, { label: "Hotline", number: "117" }, { label: "CRUZTELCO", number: "(035) 225-1766" }, { label: "Globe", number: "0917 933 0022" }, { label: "Smart", number: "0929 200 6999" }],
    notes: "Available 24/7 for all police emergencies" },
  { agency: "BFP", label: "Fire Dept.", address: "Real St, Dumaguete City", icon: "🔥", accent: "#e8372a",
    category: "fireSafety",
    phones: [{ label: "Emergency", number: "160" }, { label: "Landline", number: "(035) 225-2025" }, { label: "CRUZTELCO", number: "(035) 225-3445" }, { label: "Globe", number: "0977 198 1900" }, { label: "Smart", number: "0961 199 8377" }],
    notes: "Fire suppression, rescue & emergency medical response" },
  { agency: "CDRRMO", label: "City DRRM", address: "City Hall Compound, Dumaguete City", icon: "🛡️", accent: "#F5C842",
    category: "emergencyRescue",
    phones: [{ label: "Emergency", number: "348" }, { label: "Operations", number: "(035) 225-1911" }, { label: "Globe", number: "0936 795 4163" }],
    notes: "City Disaster Risk Reduction & Management — 24/7" },
  { agency: "LDRRMO", label: "Local DRRM", address: "Dumaguete City (Provincial)", icon: "⛑️", accent: "#00c8e0",
    category: "emergencyRescue", translationKey: "directory.ldrrmo",
    phones: [{ label: "Hotline", number: "(035) 225-3775" }, { label: "Rescue", number: "(035) 422-911" }, { label: "Province DRRM", number: "(035) 422-3636" }, { label: "Rescue 348", number: "(035) 421-5073" }],
    notes: "Provincial Disaster Risk Reduction & Management Office" },
  { agency: "ONE Rescue", label: "EMS / Ambulance", address: "Oriental Negros Emergency Rescue Foundation", icon: "🚑", accent: "#2ECC8F",
    category: "emergencyMedical",
    phones: [{ label: "CRUZTELCO", number: "(035) 225-9110" }, { label: "Globe", number: "0905 518 6917" }, { label: "Sun", number: "0922 880 8897" }],
    notes: "Free pre-hospital emergency medical services" },
  { agency: "Coast Guard", label: "Sea Rescue", address: "Dumaguete Boulevard", icon: "⚓", accent: "#00c8e0",
    category: "emergencyRescue",
    phones: [{ label: "Station", number: "(035) 422-6541" }, { label: "Mobile", number: "0968 771 2455" }],
    notes: "Marine search & rescue operations" },
  { agency: "NORECO II", label: "Electric", address: "Dumaguete City", icon: "⚡", accent: "#a78bfa",
    category: "utilities",
    phones: [{ label: "CRUZTELCO", number: "(035) 225-4830" }, { label: "Globe", number: "0917-322-2114" }],
    notes: "Power outages, downed lines & electrical emergencies" },
  { agency: "DCWD", label: "Water District", address: "Dumaguete City", icon: "💧", accent: "#38bdf8",
    category: "utilities", translationKey: "directory.waterDistrict",
    phones: [{ label: "Hotline", number: "(035) 225-2374" }, { label: "Alt", number: "(035) 422-4025" }, { label: "Office", number: "(035) 422-6951" }, { label: "Emergency", number: "0998 847 5656" }],
    notes: "Dumaguete City Water District — supply interruptions & pipe emergencies" },
  { agency: "City Health Office", label: "Public Health", address: "Dumaguete City", icon: "🏥", accent: "#2ECC8F",
    category: "medical", available: "weekdays", translationKey: "directory.cityHealth",
    phones: [{ label: "Trunkline", number: "(035) 225-0211" }],
    notes: "Public health services, medical consultations, and sanitation programs" },
  { agency: "Philippine Red Cross - Negros Oriental Chapter", label: "Emergency & Medical", address: "Real St, Dumaguete City, Negros Oriental", icon: "🩺", accent: "#E63946",
    category: "emergencyMedical", available: "always", translationKey: "directory.redCross",
    phones: [{ label: "Hotline", number: "(035) 225-2821" }, { label: "Mobile", number: "0917-700-7722" }, { label: "Landline", number: "(035) 225-2835" }, { label: "Landline 2", number: "(035) 522-2815" }],
    notes: "Emergency blood supply, ambulance services, and disaster response." },
];

const hospitals: Hospital[] = [
  { name: "Silliman University Medical Center", address: "V. Aldecoa Sr. Road, Daro", type: "Private — Level III",
    beds: "200+ beds",
    phones: [{ label: "Main", number: "(035) 420-2000" }, { label: "ICU", number: "(035) 225-3563" }, { label: "Ambulance", number: "0917 107 7415" }],
    notes: "Oldest Protestant hospital in Negros Oriental (est. 1903)" },
  { name: "ACE Dumaguete Doctors Hospital", address: "Claytown Road, Dumaguete City", type: "Private — Tertiary",
    phones: [{ label: "Trunk", number: "(035) 523-5957" }, { label: "Alt", number: "(035) 225-8000" }],
    notes: "Allied Care Experts — specialist and emergency services" },
  { name: "Holy Child Hospital", address: "Bp. Epifanio Surban St.", type: "Private — Secondary",
    phones: [{ label: "Main", number: "(035) 422-9063" }, { label: "Mobile", number: "0995 090 8263" }],
    notes: "Catholic-affiliated, run by the Sisters of Mount Carmel" },
  { name: "Negros Oriental Provincial Hospital", address: "North National Hwy, Brgy. Piapi", type: "Government — Level III",
    beds: "250 beds",
    phones: [{ label: "Main", number: "(035) 225-4921" }, { label: "Alt", number: "(035) 422-8628" }],
    notes: "Primary government referral hospital for Negros Oriental" },
];

const barangays: Barangay[] = [
  { name: "Bagacay",     hotline: "09652045077",               evacuation: "Barangay Bagacay Gymnasium" },
  { name: "Bajumpandan", hotline: "09551850601",               evacuation: "NORSU Main Campus II" },
  { name: "Balugo",      hotline: "09273571566",               evacuation: "Balugo Elementary School" },
  { name: "Banilad",     hotline: "09197607484",               evacuation: "Hermenegilda Flores Gloria Memorial High School" },
  { name: "Bantayan",    hotline: "09353261839",               evacuation: "Barangay Bantayan Health Center" },
  { name: "Batinguel",   hotline: "09054345143",               evacuation: "Barangay Batinguel Gymnasium" },
  { name: "Buñao",       hotline: "09559268258",               evacuation: "Buñao Barangay Hall / Magsaysay Memorial Elementary School" },
  { name: "Cadawinonan", hotline: "09363175898 / 09164803784", evacuation: "Cadawinonan Elementary School" },
  { name: "Calindagan",  hotline: "09457419261",               evacuation: "Dumaguete City National High School" },
  { name: "Camanjac",    hotline: "(035) 523-6263",            evacuation: "Camanjac Basketball Court" },
  { name: "Candau-ay",   hotline: "09359836121",               evacuation: "Batinguel / Candau-ay Elementary School" },
  { name: "Cantil-e",    hotline: "09550192925",               evacuation: "Upper Cantil-e Covered Court" },
  { name: "Daro",        hotline: "(035) 422-9761",            evacuation: "Daro Barangay Hall" },
  { name: "Junob",       hotline: "09753422065",               evacuation: "Northern Junob Basketball Court" },
  { name: "Looc",        hotline: "09362997073",               evacuation: "Amador Dagudag Elementary School" },
  { name: "Mangnao",     hotline: "09979156379",               evacuation: "Mangnao Gymnasium / South City Elementary School" },
  { name: "Motong",      hotline: "09261912007",               evacuation: "Barangay Motong Covered Court" },
  { name: "Piapi",       hotline: "09165009288",               evacuation: "Piapi High School and Elementary School" },
  { name: "Poblacion 1", hotline: "09264603953",               evacuation: "City Central Elementary School" },
  { name: "Poblacion 2", hotline: "09558560795",               evacuation: "Building 2, Public Market" },
  { name: "Poblacion 3", hotline: null,                        evacuation: null },
  { name: "Poblacion 4", hotline: null,                        evacuation: null },
  { name: "Poblacion 5", hotline: null,                        evacuation: null },
  { name: "Poblacion 6", hotline: null,                        evacuation: null },
  { name: "Poblacion 7", hotline: "09550894159",               evacuation: "Barangay Hall / West City Elementary School" },
  { name: "Poblacion 8", hotline: "09067729723",               evacuation: "COSCA / Building 2, Public Market" },
  { name: "Pulantubig",  hotline: "09559268258",               evacuation: "Magsaysay Memorial Elementary School" },
  { name: "Tabuc-tubig", hotline: "09975941648",               evacuation: "Tabuc-tubig Barangay Hall" },
  { name: "Taculing",    hotline: null,                        evacuation: null },
  { name: "Talay",       hotline: "09190834553",               evacuation: "Talay Multi-purpose Evacuation Center" },
  { name: "Tamnag",      hotline: null,                        evacuation: null },
  { name: "Taclobo",     hotline: "(035) 226-3953",            evacuation: "Taclobo National High School" },
];

function cleanPhone(p: string) { return p.replace(/[^0-9+]/g, ""); }
function openMaps(q: string) { window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`, "_blank"); }

// Tagalog fallbacks for directory descriptive notes, index-aligned with the
// `emergency` and `hospitals` arrays above. Shown when the Navbar language is
// Tagalog; agency names, addresses, and phone numbers stay as source data.
// Entries with a `translationKey` resolve via the dictionary instead — their
// slots below are kept only to preserve index alignment.
const AGENCY_NOTES_TL: string[] = [
  "Bukas 24/7 para sa lahat ng emerhensiyang pulis",
  "Pag-apula ng sunog, rescue at emergency medical response",
  "City Disaster Risk Reduction & Management — 24/7",
  "Panlalawigang pagbabawas ng panganib sa sakuna at rescue operation",
  "Libreng pre-hospital emergency medical services",
  "Mga operasyong marine search & rescue",
  "Mga brownout, naputol na linya at emerhensiyang elektrikal",
];

const HOSPITAL_NOTES_TL: string[] = [
  "Pinakamatandang Protestanteng ospital sa Negros Oriental (est. 1903)",
  "Allied Care Experts — espesyalista at serbisyong pang-emerhensiya",
  "Katolikong ospital na pinapatakbo ng Sisters of Mount Carmel",
  "Pangunahing ospital ng gobyerno para sa Negros Oriental",
];

export default function CitizenDirectory() {
  // Consumes the active Navbar/Header language — any selector change re-renders
  // this component (directory notes switch via the TL tables above).
  const { language, t, tList } = useLanguage();
  void tList;
  const [tab,       setTab]       = useState<"emergency" | "hospitals" | "barangays">("emergency");
  const [bgySearch, setBgySearch] = useState("");
  // Category filter for the Emergency Hotlines tab ("All" shows every agency).
  const [catFilter, setCatFilter] = useState("All");

  // Distinct service categories present in the directory data.
  const emergencyCategories = ["All", ...Array.from(new Set(emergency.map(e => e.category).filter((c): c is string => Boolean(c))))];
  const visibleEmergency = catFilter === "All" ? emergency : emergency.filter(e => e.category === catFilter);
  const categoryLabel = (c: string) =>
    c === "All" ? t("map.filterAll", "All") : t(`directory.categories.${c}`, c);

  const filtered = barangays.filter(b => {
    const q = bgySearch.toLowerCase();
    return b.name.toLowerCase().includes(q) ||
      (b.hotline?.toLowerCase().includes(q) ?? false) ||
      (b.evacuation?.toLowerCase().includes(q) ?? false);
  });

  return (
    <div className="citizen-page">

      {/* Sidebar is provided by the persistent CitizenLayout — see src/citizen/CitizenLayout.tsx. */}

      {/* ── Main ── */}
      <div style={{ padding: "28px 32px", minHeight: "100vh" }}>

        {/* Header */}
        <div style={{ marginBottom: "28px" }}>
          <div style={{ fontSize: "10px", color: "var(--c-progress)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "8px", fontWeight: "700" }}>● {t("directory.hero.line1")} <span style={{ color: "var(--c-progress)" }}>{t("directory.hero.line1Accent")}</span></div>
          <h1 style={{ fontSize: "34px", fontWeight: "900", color: "var(--clr-text)", marginBottom: "6px" }}>{t("directory.hero.line2")} <span style={{ color: "var(--c-progress)" }}>{t("directory.hero.line2Accent")}</span></h1>
          <p style={{ fontSize: "12px", color: "var(--citizen-faint)", letterSpacing: "0.06em" }}>{t("directory.hero.sub")}</p>
        </div>

        {/* 911 Banner */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", backgroundColor: "rgba(232,55,42,0.08)", border: "1px solid rgba(232,55,42,0.3)", borderRadius: "10px", padding: "14px 18px", marginBottom: "24px" }}>
          <span style={{ fontSize: "11px", fontWeight: "800", color: themeAccent("#ff8a80"), letterSpacing: "0.12em" }}>{t("directory.banner.label")}</span>
          {[
            [t("directory.banner.allEmergencies"), "911"],
            [t("directory.banner.pnpPolice"), "116"],
            [t("directory.banner.bfpFire"), "160"],
            [t("directory.banner.cdrrmo"), "0936 795 4163"],
            [t("directory.banner.oneRescue"), "0905 518 6917"],
          ].map(([lbl, num]) => (
            <a key={num} href={`tel:${cleanPhone(num)}`} style={{ display: "inline-flex", alignItems: "center", gap: "5px", backgroundColor: "rgba(232,55,42,0.1)", border: "1px solid rgba(232,55,42,0.3)", borderRadius: "20px", padding: "6px 13px", fontSize: "12px", fontWeight: "500", color: "var(--clr-text)", textDecoration: "none" }}>
              📞 {num} <span style={{ color: "var(--citizen-faint)", fontSize: "10px" }}>— {lbl}</span>
            </a>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "20px" }}>
          {(["emergency","hospitals","barangays"] as const).map((tabName) => (
            <button key={tabName} onClick={() => setTab(tabName)} style={{ padding: "8px 18px", borderRadius: "8px", fontSize: "11px", fontWeight: "700", letterSpacing: "0.10em", textTransform: "uppercase", cursor: "pointer", border: "1px solid", transition: "all 0.2s",
              backgroundColor: tab === tabName ? "rgba(74,144,217,0.15)" : "var(--clr-surface-2)",
              color:           tab === tabName ? "var(--c-progress)"      : "var(--citizen-body)",
              borderColor:     tab === tabName ? "rgba(74,144,217,0.4)"  : "var(--clr-border)",
            }}>
              {tabName === "emergency" ? `🚨 ${t("directory.emergency.title")}` : tabName === "hospitals" ? `🏥 ${t("directory.hospitals.title")}` : `🏘️ ${t("directory.barangays.title")}`}
            </button>
          ))}
        </div>

        {/* ── Emergency Services Tab ── */}
        {tab === "emergency" && (
          <>
            {/* Category filter — includes "Emergency & Medical" (localized) so
                users can filter straight to the Red Cross entry. */}
            <div style={{ display: "flex", gap: "6px", marginBottom: "16px", flexWrap: "wrap" }}>
              {emergencyCategories.map(c => (
                <button
                  key={c}
                  onClick={() => setCatFilter(c)}
                  style={{ padding: "6px 14px", borderRadius: "20px", fontSize: "11px", fontWeight: "600", letterSpacing: "0.07em", textTransform: "uppercase", cursor: "pointer", border: "1px solid", transition: "all 0.18s",
                    backgroundColor: catFilter === c ? "rgba(74,144,217,0.15)" : "var(--clr-surface-2)",
                    color:           catFilter === c ? "var(--c-progress)"      : "var(--citizen-body)",
                    borderColor:     catFilter === c ? "rgba(74,144,217,0.4)"  : "var(--clr-border)",
                  }}
                >
                  {categoryLabel(c)}
                </button>
              ))}
            </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
            {visibleEmergency.map((item) => {
              const ei = emergency.indexOf(item);
              const agencyName = item.translationKey ? t(`${item.translationKey}.name`, item.agency) : item.agency;
              const agencyLabel = item.category ? t(`directory.categories.${item.category}`, item.label) : item.label;
              const agencyNotes = item.translationKey
                ? t(`${item.translationKey}.description`, item.notes ?? "")
                : (language === "tl" ? (AGENCY_NOTES_TL[ei] ?? item.notes) : item.notes);
              return (
              <div key={item.agency} style={{ backgroundColor: "var(--citizen-card)", border: `1px solid var(--clr-border)`, borderTop: `2px solid ${item.accent}`, borderRadius: "14px", padding: "20px", transition: "all 0.2s" }}>
                <div style={{ fontSize: "24px", marginBottom: "8px" }}>{item.icon}</div>
                <div style={{ fontSize: "18px", fontWeight: "900", color: themeAccent(item.accent), marginBottom: "2px" }}>{agencyName}</div>
                <div style={{ fontSize: "10px", color: "var(--clr-text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "14px" }}>{agencyLabel}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginBottom: "12px" }}>
                  {item.phones.map((p, i) => {
                    const isHotline = /^\d{2,3}$/.test(p.number.trim());
                    const isMobile  = p.number.startsWith("09");
                    return (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "10px", color: "var(--clr-text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>{p.label}</span>
                        <a href={`tel:${cleanPhone(p.number)}`} style={{ fontSize: isHotline ? "16px" : "13px", fontWeight: isHotline ? "800" : "500", color: isHotline ? themeAccent("#ff8a80") : isMobile ? themeAccent(item.accent) : "var(--citizen-body)", textDecoration: "none" }}>
                          {p.number}
                        </a>
                      </div>
                    );
                  })}
                </div>
                {agencyNotes && <p style={{ fontSize: "11px", color: "var(--clr-text-muted)", lineHeight: "1.5", marginBottom: "12px" }}>{agencyNotes}</p>}
                {item.available && <p style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.10em", color: "var(--clr-green)", marginBottom: "12px" }}>🕒 {t(`directory.hours.${item.available}`, item.available)}</p>}
                <div style={{ display: "flex", gap: "6px" }}>
                  <a href={`tel:${cleanPhone(item.phones[0].number)}`} style={{ flex: 1, textAlign: "center", padding: "8px", backgroundColor: `${item.accent}18`, border: `1px solid ${item.accent}55`, borderRadius: "8px", fontSize: "11px", fontWeight: "700", color: themeAccent(item.accent), textDecoration: "none" }}>
                    📞 {t("directory.actions.callNow")}
                  </a>
                  <button onClick={() => openMaps(`${item.agency} ${item.address}`)} style={{ padding: "8px 12px", backgroundColor: "var(--clr-surface-2)", border: "1px solid var(--clr-border)", borderRadius: "8px", fontSize: "11px", fontWeight: "600", color: "var(--citizen-body)", cursor: "pointer" }}>
                    📍 {t("directory.actions.map")}
                  </button>
                </div>
              </div>
              );
            })}
          </div>
          </>
        )}

        {/* ── Hospitals Tab ── */}
        {tab === "hospitals" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "12px" }}>
            {hospitals.map((h, hi) => {
              const isGov = h.type.includes("Government") || h.type.includes("Gobyerno");
              return (
                <div key={h.name} style={{ backgroundColor: "var(--citizen-card)", border: "1px solid var(--clr-border)", borderRadius: "14px", padding: "20px" }}>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "9px", fontWeight: "700", letterSpacing: "0.12em", textTransform: "uppercase", color: isGov ? "var(--c-progress)" : "var(--clr-green)", border: `1px solid ${isGov ? "var(--clr-blue-border)" : "var(--clr-green-border)"}`, borderRadius: "4px", padding: "3px 7px" }}>
                      {isGov ? t("directory.hospitals.government") : t("directory.hospitals.private")}
                    </span>
                    {h.beds && <span style={{ fontSize: "9px", color: "var(--clr-text-faint)", border: "1px solid var(--clr-border)", borderRadius: "4px", padding: "3px 7px" }}>🛏 {h.beds}</span>}
                  </div>
                  <div style={{ fontSize: "15px", fontWeight: "800", color: "var(--clr-text)", marginBottom: "4px", lineHeight: "1.3" }}>{h.name}</div>
                  <div style={{ fontSize: "11px", color: "var(--clr-text-faint)", marginBottom: "14px" }}>📍 {h.address}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginBottom: "12px" }}>
                    {h.phones.map((p, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "10px", color: "var(--clr-text-faint)", textTransform: "uppercase", letterSpacing: "0.07em" }}>{p.label}</span>
                        <a href={`tel:${cleanPhone(p.number)}`} style={{ fontSize: "13px", fontWeight: "500", color: p.number.startsWith("09") ? "var(--c-progress)" : "var(--citizen-body)", textDecoration: "none" }}>{p.number}</a>
                      </div>
                    ))}
                  </div>
                  {h.notes && <p style={{ fontSize: "11px", color: "var(--clr-text-faint)", lineHeight: "1.5", marginBottom: "12px" }}>{language === "tl" ? (HOSPITAL_NOTES_TL[hi] ?? h.notes) : h.notes}</p>}
                  <div style={{ display: "flex", gap: "6px" }}>
                    <a href={`tel:${cleanPhone(h.phones[0].number)}`} style={{ flex: 1, textAlign: "center", padding: "8px", backgroundColor: "var(--clr-blue-bg)", border: "1px solid var(--clr-blue-border)", borderRadius: "8px", fontSize: "11px", fontWeight: "700", color: "var(--c-progress)", textDecoration: "none" }}>📞 {t("directory.actions.call")}</a>
                    <button onClick={() => openMaps(`${h.name} Dumaguete`)} style={{ padding: "8px 12px", backgroundColor: "var(--clr-surface-2)", border: "1px solid var(--clr-border)", borderRadius: "8px", fontSize: "11px", fontWeight: "600", color: "var(--citizen-body)", cursor: "pointer" }}>📍 {t("directory.actions.map")}</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Barangays Tab ── */}
        {tab === "barangays" && (
          <>
            <div style={{ position: "relative", marginBottom: "16px" }}>
              <span style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", opacity: 0.3 }}>🔍</span>
              <input
                type="text"
                value={bgySearch}
                onChange={e => setBgySearch(e.target.value)}
                placeholder={t("directory.barangays.searchPlaceholder")}
                style={{ width: "100%", backgroundColor: "var(--citizen-rail)", border: "1px solid var(--clr-border)", borderRadius: "10px", padding: "11px 36px 11px 36px", fontSize: "13px", color: "var(--clr-text)", outline: "none", fontFamily: "inherit" }}
              />
              {bgySearch && (
                <button onClick={() => setBgySearch("")} aria-label={language === "tl" ? "I-clear ang paghahanap" : "Clear search"} style={{ position: "absolute", right: "11px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--citizen-faint)", fontSize: "18px", cursor: "pointer" }}>×</button>
              )}
            </div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
              {[
                { label: `${barangays.filter(b => b.hotline).length} ${t("directory.barangays.withHotlines")}`,        color: "var(--c-progress)" },
                { label: `${barangays.filter(b => b.evacuation).length} ${t("directory.barangays.withEvac")}`,   color: "var(--clr-green)" },
                { label: `${barangays.filter(b => !b.hotline).length} ${t("directory.barangays.noHotline")}`,   color: "var(--clr-text-faint)" },
              ].map(s => (
                <span key={s.label} style={{ fontSize: "11px", color: s.color, backgroundColor: "var(--clr-surface-2)", border: "1px solid var(--clr-border)", borderRadius: "6px", padding: "4px 10px" }}>{s.label}</span>
              ))}
            </div>
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px", color: "var(--clr-text-faint)", fontSize: "13px" }}>{t("directory.barangays.emptyText")}</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "10px" }}>
                {filtered.map(b => (
                  <div key={b.name} style={{ backgroundColor: "var(--citizen-card)", border: "1px solid var(--clr-border)", borderRadius: "12px", padding: "14px" }}>
                    <div style={{ fontSize: "13px", fontWeight: "800", color: "var(--clr-text)", marginBottom: "8px" }}>{b.name}</div>
                    <div style={{ display: "flex", gap: "4px", marginBottom: "8px", flexWrap: "wrap" }}>
                      {b.hotline    && <span style={{ fontSize: "8px", fontWeight: "700", letterSpacing: "0.10em", color: "var(--c-progress)", border: "1px solid var(--clr-blue-border)", borderRadius: "3px", padding: "2px 6px" }}>📞 {t("directory.barangays.hotlineBadge")}</span>}
                      {b.evacuation && <span style={{ fontSize: "8px", fontWeight: "700", letterSpacing: "0.10em", color: "var(--clr-green)", border: "1px solid var(--clr-green-border)", borderRadius: "3px", padding: "2px 6px" }}>🏫 {t("directory.barangays.evacBadge")}</span>}
                      {!b.hotline && !b.evacuation && <span style={{ fontSize: "8px", color: "var(--clr-text-faint)", border: "1px solid var(--clr-border)", borderRadius: "3px", padding: "2px 6px" }}>{t("directory.barangays.tbdBadge")}</span>}
                    </div>
                    {b.hotline
                      ? <a href={`tel:${cleanPhone(b.hotline.split("/")[0].trim())}`} style={{ fontSize: "12px", fontWeight: "600", color: "var(--c-progress)", textDecoration: "none", display: "block", marginBottom: "5px" }}>{b.hotline}</a>
                      : <p style={{ fontSize: "11px", color: "var(--clr-text-faint)", marginBottom: "5px" }}>{t("directory.barangays.noDirectPrefix")} <a href="tel:911" style={{ color: "var(--clr-red)", textDecoration: "none" }}>911</a> {t("directory.barangays.orCdrrmo")} <a href="tel:09367954163" style={{ color: "var(--c-progress)", textDecoration: "none" }}>CDRRMO</a></p>
                    }
                    {b.evacuation && <p style={{ fontSize: "10px", color: "var(--citizen-faint)", lineHeight: "1.4", marginBottom: "8px" }}>🏫 {b.evacuation}</p>}
                    <button onClick={() => openMaps(`${b.name} Barangay Dumaguete City`)} style={{ fontSize: "10px", fontWeight: "600", color: "var(--citizen-faint)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>{t("directory.barangays.navigate")} →</button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}