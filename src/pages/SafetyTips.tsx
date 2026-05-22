import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import safetyTipsBg from "../assets/safetytips.jpg";

const GO_BAG_ITEMS = [
  { id: 1,  category: "Water & Food",   label: "3-day water supply (1 gal/person/day)"     },
  { id: 2,  category: "Water & Food",   label: "Non-perishable food (3-day supply)"         },
  { id: 3,  category: "Water & Food",   label: "Manual can opener"                          },
  { id: 4,  category: "Medical",        label: "First aid kit with manual"                  },
  { id: 5,  category: "Medical",        label: "7-day supply of prescription medications"   },
  { id: 6,  category: "Medical",        label: "Extra eyeglasses or contact lens supplies"  },
  { id: 7,  category: "Documents",      label: "Copies of IDs and important documents"      },
  { id: 8,  category: "Documents",      label: "Emergency contact list (printed)"           },
  { id: 9,  category: "Documents",      label: "Cash in small bills"                        },
  { id: 10, category: "Tools",          label: "Flashlight with extra batteries"            },
  { id: 11, category: "Tools",          label: "Battery-powered or hand-crank radio"        },
  { id: 12, category: "Tools",          label: "Multi-tool or Swiss Army knife"             },
  { id: 13, category: "Tools",          label: "Whistle to signal for help"                 },
  { id: 14, category: "Clothing",       label: "Change of clothes per family member"        },
  { id: 15, category: "Clothing",       label: "Sturdy closed-toe shoes"                   },
  { id: 16, category: "Clothing",       label: "Rain poncho or waterproof jacket"           },
  { id: 17, category: "Shelter",        label: "Lightweight emergency blanket"              },
  { id: 18, category: "Shelter",        label: "Dust masks or N95 respirators"              },
  { id: 19, category: "Communication",  label: "Fully charged power bank"                  },
  { id: 20, category: "Communication",  label: "Local hazard map and evacuation route"      },
];

// Each hotline entry: label shown + number to dial (clean digits only for tel:)
interface HotlineEntry {
  label: string;
  number: string; // the actual dialable number
}

const DISASTERS = [
  {
    id: "typhoon", label: "Typhoon", emoji: "🌀",
    color: "#60A5FA", colorDim: "rgba(96,165,250,0.08)", colorBorder: "rgba(96,165,250,0.22)",
    colorRgb: "96,165,250", signal: "PAGASA Signal #1–5",
    hotlines: [
      { label: "1550 (PAGASA)", number: "1550" },
      { label: "911",           number: "911"  },
    ] as HotlineEntry[],
    before: [
      "Stock at least 3 days of food, water, and medicines",
      "Secure or bring inside loose outdoor objects (furniture, pots, signages)",
      "Reinforce windows and doors with tape or boards",
      "Charge all devices and power banks before the storm",
      "Know your evacuation route and nearest evacuation center",
      "Trim trees near your house that could fall on the roof",
    ],
    during: [
      "Stay indoors and away from windows and glass doors",
      "Do not go outside during the eye of the storm — the second eyewall is coming",
      "Avoid flooded roads; 6 inches of moving water can knock you down",
      "Do not use generators indoors — carbon monoxide is lethal",
      "Monitor PAGASA updates via battery-powered radio",
    ],
    after: [
      "Check for structural damage before re-entering your home",
      "Avoid downed power lines — treat them as live",
      "Use bottled or boiled water; floodwaters contaminate pipes",
      "Document damage with photos for insurance claims",
      "Help vulnerable neighbors: elderly, children, PWDs",
    ],
  },
  {
    id: "flood", label: "Flood", emoji: "🌊",
    color: "#38BDF8", colorDim: "rgba(56,189,248,0.08)", colorBorder: "rgba(56,189,248,0.22)",
    colorRgb: "56,189,248", signal: "NDRRMC Flood Advisory",
    hotlines: [
      { label: "911",    number: "911"        },
      { label: "NDRRMC", number: "028911506"  },
    ] as HotlineEntry[],
    before: [
      "Elevate important documents, appliances, and furniture",
      "Know your flood zone level — consult your barangay hazard map",
      "Keep an emergency kit and go bag ready at all times",
      "Install check valves in plumbing to prevent sewage backflow",
      "Identify a safe meeting place above the flood zone for your family",
    ],
    during: [
      "Evacuate immediately when authorities issue an order — don't wait",
      "Never walk or drive through floodwater; 12 inches can sweep a car",
      "Turn off utilities at main switches if instructed and safe to do so",
      "Avoid contact with floodwater — it may contain sewage and chemicals",
      "Move to the highest floor, not the attic, where you can escape if needed",
    ],
    after: [
      "Return home only when authorities declare it safe",
      "Wear rubber boots and gloves when cleaning — health hazard",
      "Discard food that contacted floodwater — do not risk it",
      "Check for mold growth and ventilate thoroughly",
      "Report damaged infrastructure (roads, bridges) to your barangay",
    ],
  },
  {
    id: "fire", label: "Fire", emoji: "🔥",
    color: "#FB923C", colorDim: "rgba(251,146,60,0.08)", colorBorder: "rgba(251,146,60,0.22)",
    colorRgb: "251,146,60", signal: "BFP Fire Alert",
    hotlines: [
      { label: "BFP", number: "160" },
      { label: "911", number: "911" },
    ] as HotlineEntry[],
    before: [
      "Install working smoke detectors on every floor and test monthly",
      "Create and practice a home fire escape plan with two exits per room",
      "Keep a dry chemical fire extinguisher in the kitchen and know how to use it",
      "Never leave cooking, candles, or mosquito coils unattended",
      "Store flammable materials (LPG, gasoline) away from heat sources",
      "Check electrical wiring — overloaded sockets are a leading fire cause",
    ],
    during: [
      "Get out immediately — do NOT stop to collect belongings",
      "Crawl low under smoke; cleaner air is near the floor",
      "Before opening a door, feel it with the back of your hand — hot means fire on the other side",
      "Close doors behind you to slow the spread of fire",
      "Call 911 once you are safely outside — never from inside",
      "If trapped, seal door gaps with cloth and signal from a window",
    ],
    after: [
      "Do not re-enter a burned building until fire officials clear it",
      "Contact your local BFP office for investigation and documentation",
      "Seek medical help for smoke inhalation even if you feel fine",
      "Watch for hidden embers that can reignite hours later",
      "Contact the Red Cross or DSWD for emergency assistance",
    ],
  },
  {
    id: "earthquake", label: "Earthquake", emoji: "🌍",
    color: "#A78BFA", colorDim: "rgba(167,139,250,0.08)", colorBorder: "rgba(167,139,250,0.22)",
    colorRgb: "167,139,250", signal: "PHIVOLCS Intensity Scale",
    hotlines: [
      { label: "PHIVOLCS", number: "028426146" },
      { label: "911",      number: "911"       },
    ] as HotlineEntry[],
    before: [
      "Secure heavy furniture (bookshelves, cabinets) to walls with straps",
      "Store heavy items on lower shelves; glass and breakables in secured cabinets",
      "Identify safe spots in each room: under sturdy tables, against interior walls",
      "Know how to shut off gas, water, and electricity at the main valves",
      "Prepare an earthquake kit including water, food, flashlight, first aid",
      "Practice DROP, COVER, HOLD ON with all household members",
    ],
    during: [
      "DROP to hands and knees immediately — protects from being knocked down",
      "COVER your head and neck under a sturdy table or desk, or against an interior wall",
      "HOLD ON until the shaking stops — stay in position",
      "Stay away from windows, exterior walls, and anything that can fall",
      "If outdoors, move away from buildings, trees, streetlights, and power lines",
      "If in a vehicle, pull over away from overpasses and stop carefully",
    ],
    after: [
      "Expect aftershocks — they can be strong; apply DROP-COVER-HOLD ON again",
      "Check yourself and others for injuries before moving",
      "Smell for gas leaks — if detected, open windows and leave immediately",
      "Use text messages rather than calls; networks are overloaded after quakes",
      "Check PHIVOLCS and local authorities before returning to damaged structures",
    ],
  },
  {
    id: "landslide", label: "Landslide", emoji: "⛰️",
    color: "#86EFAC", colorDim: "rgba(134,239,172,0.08)", colorBorder: "rgba(134,239,172,0.22)",
    colorRgb: "134,239,172", signal: "MGB Landslide Advisory",
    hotlines: [
      { label: "MGB", number: "029295767" },
      { label: "911", number: "911"       },
    ] as HotlineEntry[],
    before: [
      "Know if your community is in a landslide-prone zone (consult your barangay)",
      "Observe warning signs: cracks in ground or walls, tilting trees, unusual sounds",
      "Do not build or live on steep slopes, at canyon bases, or near river channels",
      "Plant deep-rooted vegetation on slopes around your property",
      "Clear drainage channels to prevent water buildup on slopes",
      "Prepare an evacuation route to higher ground away from slopes",
    ],
    during: [
      "Move away from the landslide path immediately — go perpendicular, not straight",
      "If escape is impossible, curl into a ball and protect your head",
      "Listen for unusual sounds: snapping trees, boulders knocking — early warning",
      "Avoid valleys and low-lying areas near the source of a slide",
      "If driving, watch for collapsed pavement, mud, or debris flows on roads",
    ],
    after: [
      "Stay away from the slide area — additional slides are likely",
      "Check for injured and trapped persons but do not enter unstable areas",
      "Report the landslide to your barangay or MGB immediately",
      "Watch for flooding which often follows landslides",
      "Do not use roads damaged by slides until officially inspected",
    ],
  },
  {
    id: "road", label: "Road Accident", emoji: "🚗",
    color: "#FCD34D", colorDim: "rgba(252,211,77,0.08)", colorBorder: "rgba(252,211,77,0.22)",
    colorRgb: "252,211,77", signal: "LTO / MMDA Traffic Alert",
    hotlines: [
      { label: "PNP",  number: "117" },
      { label: "MMDA", number: "136" },
      { label: "911",  number: "911" },
    ] as HotlineEntry[],
    before: [
      "Always wear a seatbelt — front and rear passengers",
      "Never text or use a phone while driving; use hands-free if necessary",
      "Conduct a simple vehicle check before long trips: tires, brakes, lights, fluids",
      "Observe speed limits; adjust speed for weather, traffic, and road conditions",
      "Never drive under the influence of alcohol or drowsiness",
      "Keep a roadside emergency kit: triangle reflectors, jumper cables, first aid",
    ],
    during: [
      "Stay calm — assess yourself and passengers for injuries before moving",
      "Turn on hazard lights and place triangle reflectors at safe distance",
      "Call 911 immediately if there are injuries; do not move injured persons unless there is immediate danger",
      "Move vehicles out of traffic if safe and if there are no injuries",
      "Do not argue about fault at the scene — document with photos instead",
    ],
    after: [
      "Cooperate with responding authorities and provide your license and registration",
      "Seek medical evaluation even if you feel fine — injuries can be delayed",
      "File an incident report at the nearest police station within 24 hours",
      "Notify your insurance company as soon as possible",
      "Contact LTO for procedures on vehicle damage and road incident documentation",
    ],
  },
];

const PHASE_META = {
  before: { label: "Before",  icon: "⚡", desc: "Prepare ahead" },
  during: { label: "During",  icon: "🔴", desc: "Stay safe now" },
  after:  { label: "After",   icon: "✅", desc: "Recover safely" },
};

export default function SafetyTips() {
  const [activeTab,   setActiveTab]   = useState(0);
  const [activePhase, setActivePhase] = useState<"before" | "during" | "after">("before");
  const [checked,     setChecked]     = useState<Record<number, boolean>>({});
  const [bagFilter,   setBagFilter]   = useState("All");

  const toggleCheck = (id: number) =>
    setChecked(prev => ({ ...prev, [id]: !prev[id] }));

  const checkedCount = Object.values(checked).filter(Boolean).length;
  const progress     = Math.round((checkedCount / GO_BAG_ITEMS.length) * 100);
  const categories   = ["All", ...Array.from(new Set(GO_BAG_ITEMS.map(i => i.category)))];
  const visibleItems = bagFilter === "All" ? GO_BAG_ITEMS : GO_BAG_ITEMS.filter(i => i.category === bagFilter);

  const isGoBag  = activeTab === DISASTERS.length;
  const disaster = !isGoBag ? DISASTERS[activeTab] : null;

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    const idx = DISASTERS.findIndex(d => d.id === hash);
    if (idx !== -1) setActiveTab(idx);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:       #07101d;
          --surface:  rgba(13,27,46,0.72);
          --surface2: rgba(13,27,46,0.88);
          --border:   rgba(0,200,224,0.08);
          --border2:  rgba(0,200,224,0.18);
          --text:     #ddeef8;
          --text2:    rgba(160,200,224,0.65);
          --text3:    rgba(160,200,224,0.30);
          --red:      #e8372a;
          --cyan:     #00c8e0;
          --blue:     #4A90D9;
          --radius:   13px;
        }

        .st {
          min-height: 100vh;
          font-family: 'DM Sans', sans-serif;
          color: var(--text);
          background: var(--bg);
          position: relative;
          overflow-x: hidden;
        }

        .st-bg { position: fixed; inset: 0; z-index: 0; }
        .st-bg-img {
  width: 100%; height: 100%;
  object-fit: cover; object-position: center; display: block;
  transform-origin: center center;
  animation: bgDrift 26s ease-in-out infinite;
  will-change: transform;
}
.st-bg { position: fixed; inset: 0; z-index: 0; overflow: hidden; }
        .st-bg-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(
            180deg,
            rgba(7,16,29,0.88) 0%,
            rgba(7,16,29,0.82) 25%,
            rgba(7,16,29,0.70) 50%,
            rgba(7,16,29,0.85) 75%,
            rgba(7,16,29,0.96) 100%
          );
          pointer-events: none;
        }

@keyframes bgDrift {
  0%   { transform: scale(1.08) translate(0px,   0px);   }
  25%  { transform: scale(1.11) translate(-12px, -14px); }
  50%  { transform: scale(1.10) translate(-8px,  -22px); }
  75%  { transform: scale(1.12) translate(18px,  -8px);  }
  100% { transform: scale(1.08) translate(0px,   0px);   }
}
        .st-bg-atmosphere {
          position: absolute; inset: 0; pointer-events: none;
          background:
            radial-gradient(ellipse 60% 50% at 10% 0%,  rgba(232,55,42,0.09)  0%, transparent 65%),
            radial-gradient(ellipse 55% 60% at 90% 100%, rgba(0,200,224,0.07)  0%, transparent 70%),
            radial-gradient(ellipse 40% 40% at 55% 45%,  rgba(13,27,46,0.40)   0%, transparent 60%);
        }
        .st-bg-grain {
          position: absolute; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
          background-size: 200px; opacity: 0.45; pointer-events: none;
        }

        .st-wrap {
          position: relative; z-index: 1;
          max-width: 1080px; margin: 0 auto;
          padding: 0 28px 120px;
        }

        .st-nav {
          display: flex; align-items: center; justify-content: space-between;
          padding: 28px 0 0;
          animation: fadeUp .5s ease both;
        }
        .st-logo {
          display: flex; align-items: center; gap: 10px; text-decoration: none;
          font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 800;
          letter-spacing: 0.12em; text-transform: uppercase; color: var(--text);
        }
        .st-logo-dot {
          width: 8px; height: 8px; border-radius: 50%; background: var(--red);
          box-shadow: 0 0 12px var(--red), 0 0 24px rgba(232,55,42,0.4);
          animation: breathe 2.4s ease infinite;
        }
        @keyframes breathe { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:.55; transform:scale(.78); } }
        .st-back {
          font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 500;
          letter-spacing: 0.08em; text-transform: uppercase;
          color: var(--text3); text-decoration: none;
          border: 1px solid rgba(0,200,224,0.12); border-radius: 8px;
          padding: 8px 16px; transition: all .2s;
          background: rgba(13,27,46,0.60); backdrop-filter: blur(18px);
          display: flex; align-items: center; gap: 6px;
          min-height: 44px;
        }
        .st-back:hover { color: var(--text); border-color: rgba(0,200,224,0.30); }

        .st-hero {
          margin-top: 72px; margin-bottom: 52px;
          animation: fadeUp 0.7s 0.1s ease both;
        }
        .st-hero-eyebrow {
          font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 500;
          letter-spacing: 0.20em; text-transform: uppercase;
          color: var(--red); margin-bottom: 20px;
          display: flex; align-items: center; gap: 10px;
        }
        .st-hero-eyebrow::after { content: ''; display: block; width: 40px; height: 1px; background: var(--red); opacity: 0.5; }
        .st-hero h1 {
          font-family: 'Syne', sans-serif; font-size: clamp(42px, 6vw, 78px);
          font-weight: 800; line-height: 0.95; letter-spacing: -0.03em; color: #F8FAFC; margin-bottom: 24px;
        }
        .st-hero h1 .accent { color: #A8D8FF; -webkit-text-stroke: 0; }
        .st-hero-sub {
          font-family: 'DM Sans', sans-serif; font-size: 16px; font-weight: 300;
          color: rgba(160,200,224,0.60); max-width: 520px; line-height: 1.68;
        }

        /* ── Sticky tab bar ── */
        .st-tabs-wrap {
          position: sticky; top: 0; z-index: 20;
          background: rgba(7,16,29,0.90);
          backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
          border-bottom: 1px solid rgba(0,200,224,0.08);
          margin: 0 -28px 40px; padding: 0 28px;
          animation: fadeUp .6s .1s ease both;
        }
        .st-tabs {
          display: flex; gap: 2px; overflow-x: auto;
          scrollbar-width: none; padding: 10px 0;
        }
        .st-tabs::-webkit-scrollbar { display: none; }
        .st-tab {
          flex-shrink: 0; display: flex; align-items: center; gap: 7px;
          font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500;
          letter-spacing: .04em; padding: 8px 16px; border-radius: 9px;
          border: 1px solid transparent; cursor: pointer; transition: all .18s;
          color: var(--text3); background: transparent; min-height: 44px;
        }
        .st-tab:hover { color: var(--text2); background: rgba(0,200,224,0.04); }
        .st-tab.active { color: var(--text); background: var(--surface); border-color: var(--border2); }
        .st-tab-emoji { font-size: 14px; }

        /* ── Disaster panel ── */
        .st-panel { animation: fadeUp .38s ease both; }

        .st-panel-header-card {
          display: grid; grid-template-columns: 1fr auto;
          gap: 20px; align-items: center;
          background: var(--surface);
          border: 1px solid rgba(0,200,224,0.08);
          border-top: 2px solid var(--d-color);
          border-radius: var(--radius);
          padding: 24px 28px; margin-bottom: 20px;
          backdrop-filter: blur(18px);
          position: relative; overflow: hidden;
        }
        .st-panel-header-card::before {
          content: ''; position: absolute; inset: 0;
          background: radial-gradient(ellipse 60% 100% at 0% 50%, rgba(var(--d-rgb),0.06) 0%, transparent 70%);
          pointer-events: none;
        }
        .st-panel-title-group { display: flex; align-items: center; gap: 16px; }
        .st-panel-icon {
          width: 54px; height: 54px; border-radius: 14px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center; font-size: 26px;
          background: var(--d-dim); border: 1px solid var(--d-border);
        }
        .st-panel-name {
          font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800;
          letter-spacing: -.03em; color: var(--text);
        }
        .st-panel-signal {
          font-family: 'DM Sans', sans-serif; font-size: 10px; font-weight: 500;
          letter-spacing: .16em; text-transform: uppercase;
          color: var(--d-color); margin-top: 5px; opacity: .75;
        }

        /* ── HOTLINES — now real tappable call links ── */
        .st-hotlines {
          display: flex; gap: 8px; flex-wrap: wrap;
          flex-shrink: 0;
        }
        .st-hotline-btn {
          display: inline-flex; align-items: center; gap: 6px;
          background: var(--d-dim); border: 1px solid var(--d-border);
          border-radius: 9px; padding: 10px 16px;
          font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600;
          color: var(--d-color); text-decoration: none;
          white-space: nowrap; cursor: pointer;
          transition: background 0.18s, transform 0.15s, box-shadow 0.18s;
          -webkit-tap-highlight-color: transparent;
          min-height: 44px; /* WCAG touch target */
        }
        .st-hotline-btn:hover,
        .st-hotline-btn:active {
          background: rgba(var(--d-rgb), 0.18);
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(var(--d-rgb), 0.20);
        }
        .st-hotline-icon { font-size: 14px; flex-shrink: 0; }

        /* Phase switcher */
        .st-phases {
          display: grid; grid-template-columns: repeat(3,1fr); gap: 10px;
          margin-bottom: 24px;
        }
        .st-phase-btn {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          flex-direction: column;
          font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500;
          letter-spacing: .04em; padding: 14px 12px; border-radius: var(--radius);
          cursor: pointer; border: 1px solid rgba(0,200,224,0.08);
          background: var(--surface); backdrop-filter: blur(18px);
          color: var(--text3); transition: all .2s;
          position: relative; overflow: hidden; min-height: 44px;
        }
        .st-phase-btn:hover { color: var(--text2); border-color: var(--border2); background: var(--surface2); }
        .st-phase-btn.active {
          background: var(--d-dim); border-color: var(--d-border);
          color: var(--d-color); box-shadow: 0 0 20px rgba(var(--d-rgb),0.12);
        }
        .st-phase-icon { font-size: 18px; }
        .st-phase-label { font-size: 12px; }
        .st-phase-desc { font-size: 10px; font-weight: 300; opacity: .55; }
        .st-phase-btn.active::after {
          content: ''; position: absolute; bottom: 0; left: 10%; right: 10%;
          height: 2px; border-radius: 2px; background: var(--d-color); opacity: .55;
        }

        /* Tips grid */
        .st-tips {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 10px;
        }
        .st-tip {
          display: flex; align-items: flex-start; gap: 14px;
          background: var(--surface); backdrop-filter: blur(18px);
          border: 1px solid rgba(0,200,224,0.07);
          border-left: 3px solid var(--d-color);
          border-radius: var(--radius); padding: 16px 18px;
          transition: border-color .2s, background .2s, transform .2s, box-shadow .2s;
          animation: fadeUp .35s ease both;
        }
        .st-tip:hover {
          background: var(--surface2); border-color: var(--d-border);
          transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,0.35);
        }
        .st-tip-num {
          font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 700;
          min-width: 28px; height: 28px; border-radius: 7px;
          display: flex; align-items: center; justify-content: center;
          background: var(--d-dim); color: var(--d-color);
          flex-shrink: 0; margin-top: 1px; letter-spacing: .04em;
        }
        .st-tip-text {
          font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 300;
          line-height: 1.65; color: var(--text2);
        }
        .st-tip-text strong { color: var(--text); font-weight: 500; }

        /* ── Go Bag ── */
        .st-gobag { animation: fadeUp .38s ease both; }
        .st-gobag-header-card {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 20px; flex-wrap: wrap;
          background: var(--surface); border: 1px solid rgba(0,200,224,0.08);
          border-top: 2px solid var(--red); border-radius: var(--radius);
          padding: 24px 28px; margin-bottom: 20px; backdrop-filter: blur(18px);
          position: relative; overflow: hidden;
        }
        .st-gobag-header-card::before {
          content: ''; position: absolute; inset: 0;
          background: radial-gradient(ellipse 60% 120% at 0% 50%, rgba(232,55,42,0.06) 0%, transparent 70%);
          pointer-events: none;
        }
        .st-gobag-title { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; letter-spacing: -.03em; color: var(--text); }
        .st-gobag-title span { color: #A8D8FF; -webkit-text-stroke: 0; }
        .st-gobag-sub { font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 300; color: var(--text2); margin-top: 6px; max-width: 440px; line-height: 1.65; }

        .st-progress-card {
          background: var(--surface); border: 1px solid rgba(0,200,224,0.08);
          border-radius: var(--radius); padding: 20px 24px; margin-bottom: 20px;
          backdrop-filter: blur(18px);
        }
        .st-progress-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
        .st-progress-label { font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 400; color: var(--text2); }
        .st-progress-pct {
          font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800; letter-spacing: -.04em;
          background: linear-gradient(135deg, var(--red), var(--cyan));
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .st-progress-track { height: 5px; border-radius: 6px; background: rgba(0,200,224,0.06); overflow: hidden; }
        .st-progress-fill {
          height: 100%; border-radius: 6px;
          background: linear-gradient(90deg, var(--red), var(--cyan));
          transition: width .5s cubic-bezier(.4,0,.2,1);
          box-shadow: 0 0 16px rgba(232,55,42,0.30);
        }

        .st-cat-filter { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 18px; }
        .st-cat-btn {
          font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 500;
          letter-spacing: .07em; text-transform: uppercase; padding: 6px 14px;
          border-radius: 20px; border: 1px solid rgba(0,200,224,0.08);
          background: var(--surface); backdrop-filter: blur(8px);
          color: var(--text3); cursor: pointer; transition: all .18s; min-height: 36px;
        }
        .st-cat-btn:hover { color: var(--text2); border-color: rgba(0,200,224,0.20); }
        .st-cat-btn.active { background: rgba(0,200,224,0.08); border-color: rgba(0,200,224,0.30); color: var(--cyan); }

        .st-checklist { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 8px; }
        .st-check-item {
          display: flex; align-items: center; gap: 12px;
          background: var(--surface); backdrop-filter: blur(18px);
          border: 1px solid rgba(0,200,224,0.07); border-radius: 12px;
          padding: 13px 16px; cursor: pointer; transition: all .2s; user-select: none;
          min-height: 44px;
        }
        .st-check-item:hover { border-color: rgba(0,200,224,0.18); background: var(--surface2); }
        .st-check-item.checked { border-color: rgba(0,200,224,0.22); background: rgba(0,200,224,0.05); }
        .st-checkbox {
          width: 22px; height: 22px; border-radius: 7px; flex-shrink: 0;
          border: 1.5px solid rgba(0,200,224,0.18); background: transparent;
          display: flex; align-items: center; justify-content: center;
          transition: all .2s; font-size: 12px; color: #fff; font-weight: 800;
        }
        .st-check-item.checked .st-checkbox {
          background: linear-gradient(135deg, var(--red), var(--cyan));
          border-color: transparent; box-shadow: 0 0 12px rgba(232,55,42,0.30);
        }
        .st-check-cat { font-family: 'DM Sans', sans-serif; font-size: 9px; font-weight: 500; letter-spacing: .14em; text-transform: uppercase; color: var(--cyan); opacity: .7; margin-bottom: 2px; }
        .st-check-label { font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 300; line-height: 1.45; color: var(--text2); transition: all .2s; }
        .st-check-item.checked .st-check-label { color: var(--text3); text-decoration: line-through; }
        .st-check-num { font-family: 'DM Sans', sans-serif; font-size: 10px; font-weight: 500; color: var(--text3); flex-shrink: 0; margin-left: auto; min-width: 28px; text-align: right; }

        .st-reset {
          margin-top: 20px; font-family: 'DM Sans', sans-serif;
          font-size: 11px; font-weight: 500; letter-spacing: .08em; text-transform: uppercase;
          color: var(--text3); background: var(--surface); backdrop-filter: blur(8px);
          border: 1px solid rgba(0,200,224,0.08); border-radius: 8px;
          padding: 9px 20px; cursor: pointer; transition: all .2s; min-height: 44px;
        }
        .st-reset:hover { color: var(--text2); border-color: rgba(0,200,224,0.20); }

        @keyframes fadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }

        /* ── RESPONSIVE ── */
        @media (max-width: 680px) {
          .st-wrap { padding: 0 16px 100px; }
          .st-tabs-wrap { margin: 0 -16px 28px; padding: 0 16px; }
          .st-hero { margin-top: 40px; margin-bottom: 36px; }
          .st-hero h1 { font-size: clamp(32px, 8vw, 52px); }
          .st-hero-sub { font-size: 14px; }

          /* Header card: stack title + hotlines vertically */
          .st-panel-header-card {
            grid-template-columns: 1fr;
            gap: 16px;
            padding: 18px 16px;
          }
          /* Hotlines wrap into rows of 2 on mobile */
          .st-hotlines { width: 100%; }
          .st-hotline-btn { flex: 1 1 calc(50% - 4px); justify-content: center; font-size: 12px; }

          .st-phases { grid-template-columns: repeat(3,1fr); gap: 8px; }
          .st-phase-btn { padding: 12px 8px; }
          .st-phase-desc { display: none; }

          .st-tips { grid-template-columns: 1fr; }
          .st-checklist { grid-template-columns: 1fr; }
          .st-gobag-header-card { padding: 18px 16px; }
          .st-gobag-title { font-size: 20px; }
        }

        @media (max-width: 400px) {
          /* Hotlines stack full width on very small phones */
          .st-hotline-btn { flex: 1 1 100%; }
          .st-panel-icon { width: 44px; height: 44px; font-size: 22px; }
          .st-panel-name { font-size: 20px; }
        }
      `}</style>

      <div className="st">
        <div className="st-bg">
          <img src={safetyTipsBg} alt="" className="st-bg-img" aria-hidden="true" />
          <div className="st-bg-overlay" />
          <div className="st-bg-atmosphere" />
          <div className="st-bg-grain" />
        </div>

        <div className="st-wrap">

          {/* Nav */}
          <nav className="st-nav">
            <Link to="/" className="st-logo">
              <span className="st-logo-dot" />
              DumaSafeGuide
            </Link>
            <Link to="/resources" className="st-back">← Resources</Link>
          </nav>

          {/* Hero */}
          <section className="st-hero">
            <div className="st-hero-eyebrow">Preparedness Hub</div>
            <h1>
              Safety <span className="accent">Tips</span> &amp;<br />
              Emergency Guides
            </h1>
            <p className="st-hero-sub">
              Step-by-step guidance for typhoons, floods, fires, earthquakes, landslides,
              and road accidents — plus your complete go bag checklist.
            </p>
          </section>

          {/* Sticky tabs */}
          <div className="st-tabs-wrap">
            <div className="st-tabs">
              {DISASTERS.map((d, i) => (
                <button
                  key={d.id}
                  className={`st-tab${activeTab === i ? " active" : ""}`}
                  onClick={() => { setActiveTab(i); setActivePhase("before"); }}
                >
                  <span className="st-tab-emoji">{d.emoji}</span>
                  {d.label}
                </button>
              ))}
              <button
                className={`st-tab${isGoBag ? " active" : ""}`}
                onClick={() => setActiveTab(DISASTERS.length)}
              >
                <span className="st-tab-emoji">🎒</span>
                Go Bag
              </button>
            </div>
          </div>

          {/* Disaster panel */}
          {!isGoBag && disaster && (
            <div
              key={disaster.id}
              className="st-panel"
              style={{
                "--d-color":  disaster.color,
                "--d-dim":    disaster.colorDim,
                "--d-border": disaster.colorBorder,
                "--d-rgb":    disaster.colorRgb,
              } as React.CSSProperties}
            >
              <div className="st-panel-header-card">
                <div className="st-panel-title-group">
                  <div className="st-panel-icon">{disaster.emoji}</div>
                  <div>
                    <div className="st-panel-name">{disaster.label}</div>
                    <div className="st-panel-signal">{disaster.signal}</div>
                  </div>
                </div>

                {/* ── HOTLINES: each number is a real tel: link ── */}
                <div className="st-hotlines">
                  {disaster.hotlines.map((h) => (
                    <a
                      key={h.number}
                      href={`tel:${h.number}`}
                      className="st-hotline-btn"
                    >
                      <span className="st-hotline-icon">📞</span>
                      {h.label}
                    </a>
                  ))}
                </div>
              </div>

              <div className="st-phases">
                {(["before","during","after"] as const).map(p => {
                  const m = PHASE_META[p];
                  return (
                    <button
                      key={p}
                      className={`st-phase-btn${activePhase === p ? " active" : ""}`}
                      onClick={() => setActivePhase(p)}
                    >
                      <span className="st-phase-icon">{m.icon}</span>
                      <span className="st-phase-label">{m.label}</span>
                      <span className="st-phase-desc">{m.desc}</span>
                    </button>
                  );
                })}
              </div>

              <div className="st-tips">
                {disaster[activePhase].map((tip, i) => {
                  const dot  = tip.indexOf(" — ");
                  const main = dot > -1 ? tip.slice(0, dot) : tip;
                  const rest = dot > -1 ? tip.slice(dot)   : "";
                  return (
                    <div key={i} className="st-tip" style={{ animationDelay: `${i * 0.045}s` }}>
                      <div className="st-tip-num">{String(i + 1).padStart(2,"0")}</div>
                      <div className="st-tip-text">
                        <strong>{main}</strong>{rest}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Go Bag panel */}
          {isGoBag && (
            <div className="st-gobag">
              <div className="st-gobag-header-card">
                <div>
                  <div className="st-gobag-title">🎒 Your <span>Go Bag</span> Checklist</div>
                  <p className="st-gobag-sub">
                    Pack these 20 essentials so you can evacuate safely within 15 minutes.
                    Check off what you've already prepared.
                  </p>
                </div>
              </div>

              <div className="st-progress-card">
                <div className="st-progress-row">
                  <span className="st-progress-label">{checkedCount} of {GO_BAG_ITEMS.length} items packed</span>
                  <span className="st-progress-pct">{progress}%</span>
                </div>
                <div className="st-progress-track">
                  <div className="st-progress-fill" style={{ width: `${progress}%` }} />
                </div>
              </div>

              <div className="st-cat-filter">
                {categories.map(c => (
                  <button
                    key={c}
                    className={`st-cat-btn${bagFilter === c ? " active" : ""}`}
                    onClick={() => setBagFilter(c)}
                  >{c}</button>
                ))}
              </div>

              <div className="st-checklist">
                {visibleItems.map(item => (
                  <div
                    key={item.id}
                    className={`st-check-item${checked[item.id] ? " checked" : ""}`}
                    onClick={() => toggleCheck(item.id)}
                  >
                    <div className="st-checkbox">{checked[item.id] && "✓"}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="st-check-cat">{item.category}</div>
                      <div className="st-check-label">{item.label}</div>
                    </div>
                    <div className="st-check-num">#{String(item.id).padStart(2,"0")}</div>
                  </div>
                ))}
              </div>

              {checkedCount > 0 && (
                <button className="st-reset" onClick={() => setChecked({})}>
                  Reset checklist
                </button>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  );
}