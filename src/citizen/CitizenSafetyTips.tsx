// src/citizen/CitizenSafetyTips.tsx
import { useState, useEffect } from "react";
import pagesBackground from "../assets/pagesbackground.png";

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

interface HotlineEntry { label: string; number: string; }

const DISASTERS = [
  {
    id: "typhoon", label: "Typhoon", emoji: "🌀",
    color: "#60A5FA", colorDim: "rgba(96,165,250,0.10)", colorBorder: "rgba(96,165,250,0.25)",
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
    color: "#38BDF8", colorDim: "rgba(56,189,248,0.10)", colorBorder: "rgba(56,189,248,0.25)",
    colorRgb: "56,189,248", signal: "NDRRMC Flood Advisory",
    hotlines: [
      { label: "911",    number: "911"       },
      { label: "NDRRMC", number: "028911506" },
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
    color: "#FB923C", colorDim: "rgba(251,146,60,0.10)", colorBorder: "rgba(251,146,60,0.25)",
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
    color: "#A78BFA", colorDim: "rgba(167,139,250,0.10)", colorBorder: "rgba(167,139,250,0.25)",
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
    color: "#86EFAC", colorDim: "rgba(134,239,172,0.10)", colorBorder: "rgba(134,239,172,0.25)",
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
    color: "#FCD34D", colorDim: "rgba(252,211,77,0.10)", colorBorder: "rgba(252,211,77,0.25)",
    colorRgb: "252,211,77", signal: "LTO / PNP Traffic Alert",
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
  before: { label: "Before", icon: "⚡", desc: "Prepare ahead" },
  during: { label: "During", icon: "🔴", desc: "Stay safe now" },
  after:  { label: "After",  icon: "✅", desc: "Recover safely" },
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@400;500;700;800;900&family=Instrument+Sans:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .cst-root {
    min-height: 100vh;
    font-family: 'Instrument Sans', sans-serif;
    color: #eef0f7;
    position: relative;
    overflow-x: hidden;
    background: #080c14;
  }
  .cst-bg {
    position: fixed; inset: 0; z-index: 0;
    background-size: cover; background-position: center; background-repeat: no-repeat;
  }
  .cst-bg::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(160deg, rgba(8,12,20,.92) 0%, rgba(8,12,20,.80) 50%, rgba(8,12,20,.93) 100%);
  }
  .cst-glow { position: fixed; inset: 0; pointer-events: none; z-index: 1; overflow: hidden; }
  .cst-glow-a { position: absolute; width: 600px; height: 600px; border-radius: 50%; background: radial-gradient(circle, rgba(46,204,143,.07) 0%, transparent 70%); top: -180px; left: -80px; }
  .cst-glow-b { position: absolute; width: 500px; height: 500px; border-radius: 50%; background: radial-gradient(circle, rgba(123,158,255,.05) 0%, transparent 70%); bottom: -140px; right: -60px; }

  .cst-inner {
    position: relative; z-index: 2;
    max-width: 1080px; margin: 0 auto;
    padding: 0 24px 100px;
  }

  /* ── Hero ── */
  .cst-hero { margin-top: 52px; margin-bottom: 36px; }
  .cst-hero-tag {
    display: inline-flex; align-items: center; gap: 7px;
    font-size: 11px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase;
    color: #2ECC8F; margin-bottom: 18px;
  }
  .cst-hero-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: #2ECC8F; box-shadow: 0 0 8px #2ECC8F;
    animation: cst-pulse 2.2s ease infinite;
  }
  @keyframes cst-pulse { 0%,100%{opacity:1;transform:scale(1);}50%{opacity:.4;transform:scale(.75);} }
  .cst-hero-heading {
    font-family: 'Cabinet Grotesk', sans-serif;
    font-size: clamp(30px, 5vw, 56px);
    font-weight: 900; line-height: 1.0;
    letter-spacing: -.035em; color: #eef0f7;
    margin-bottom: 14px;
  }
  .cst-hero-heading em { font-style: normal; color: #2ECC8F; }
  .cst-hero-sub {
    font-size: 14px; font-weight: 400;
    color: rgba(238,240,247,.35);
    max-width: 500px; line-height: 1.7;
  }

  /* ── Sticky tab bar ── */
  .cst-tabs-wrap {
    position: sticky; top: 0; z-index: 20;
    background: rgba(8,12,20,.92);
    backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
    border-bottom: 1px solid rgba(255,255,255,.06);
    margin: 0 -24px 36px; padding: 0 24px;
  }
  .cst-tabs {
    display: flex; gap: 2px; overflow-x: auto;
    scrollbar-width: none; padding: 10px 0;
  }
  .cst-tabs::-webkit-scrollbar { display: none; }
  .cst-tab {
    flex-shrink: 0; display: flex; align-items: center; gap: 7px;
    font-family: 'Instrument Sans', sans-serif;
    font-size: 12px; font-weight: 500; letter-spacing: .03em;
    padding: 8px 15px; border-radius: 10px;
    border: 1px solid transparent; cursor: pointer; transition: all .18s;
    color: rgba(238,240,247,.28); background: transparent; min-height: 44px;
  }
  .cst-tab:hover { color: rgba(238,240,247,.55); background: rgba(255,255,255,.04); }
  .cst-tab.active {
    color: #eef0f7;
    background: rgba(15,21,33,.82);
    border-color: rgba(255,255,255,.10);
  }
  .cst-tab-emoji { font-size: 14px; }

  /* ── Panel ── */
  .cst-panel { animation: cst-up .35s ease both; }
  @keyframes cst-up { from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);} }

  /* Header card */
  .cst-panel-header {
    display: grid; grid-template-columns: 1fr auto;
    gap: 20px; align-items: center;
    background: rgba(15,21,33,.82);
    border: 1px solid rgba(255,255,255,.07);
    border-top: 2px solid var(--dc);
    border-radius: 18px; padding: 24px 28px;
    margin-bottom: 16px;
    backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
    position: relative; overflow: hidden;
  }
  .cst-panel-header::before {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(ellipse 60% 100% at 0% 50%, rgba(var(--dr),0.07) 0%, transparent 70%);
    pointer-events: none;
  }
  .cst-panel-title-group { display: flex; align-items: center; gap: 16px; }
  .cst-panel-icon {
    width: 52px; height: 52px; border-radius: 14px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center; font-size: 24px;
    background: var(--dd); border: 1px solid var(--db);
  }
  .cst-panel-name {
    font-family: 'Cabinet Grotesk', sans-serif;
    font-size: 22px; font-weight: 800;
    letter-spacing: -.03em; color: #eef0f7;
  }
  .cst-panel-signal {
    font-size: 10px; font-weight: 600; letter-spacing: .16em; text-transform: uppercase;
    color: var(--dc); margin-top: 4px; opacity: .75;
  }

  /* Hotlines */
  .cst-hotlines { display: flex; gap: 8px; flex-wrap: wrap; flex-shrink: 0; }
  .cst-hotline-btn {
    display: inline-flex; align-items: center; gap: 6px;
    background: var(--dd); border: 1px solid var(--db);
    border-radius: 10px; padding: 10px 16px;
    font-size: 13px; font-weight: 600;
    color: var(--dc); text-decoration: none;
    white-space: nowrap; cursor: pointer;
    transition: background .18s, transform .15s, box-shadow .18s;
    -webkit-tap-highlight-color: transparent;
    min-height: 44px;
  }
  .cst-hotline-btn:hover, .cst-hotline-btn:active {
    background: rgba(var(--dr), 0.18);
    transform: translateY(-1px);
    box-shadow: 0 4px 18px rgba(var(--dr), 0.22);
  }

  /* Phase switcher */
  .cst-phases { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; margin-bottom: 20px; }
  .cst-phase-btn {
    display: flex; align-items: center; justify-content: center; gap: 8px; flex-direction: column;
    font-size: 12px; font-weight: 500; letter-spacing: .03em;
    padding: 14px 12px; border-radius: 14px; cursor: pointer;
    border: 1px solid rgba(255,255,255,.07);
    background: rgba(15,21,33,.82); backdrop-filter: blur(16px);
    color: rgba(238,240,247,.28); transition: all .2s;
    position: relative; overflow: hidden; min-height: 44px;
  }
  .cst-phase-btn:hover { color: rgba(238,240,247,.55); border-color: rgba(255,255,255,.14); }
  .cst-phase-btn.active {
    background: var(--dd); border-color: var(--db);
    color: var(--dc); box-shadow: 0 0 22px rgba(var(--dr), 0.13);
  }
  .cst-phase-btn.active::after {
    content: ''; position: absolute; bottom: 0; left: 10%; right: 10%;
    height: 2px; border-radius: 2px; background: var(--dc); opacity: .55;
  }
  .cst-phase-icon { font-size: 17px; }
  .cst-phase-label { font-size: 12px; font-weight: 600; }
  .cst-phase-desc { font-size: 10px; opacity: .45; }

  /* Tips grid */
  .cst-tips { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px,1fr)); gap: 10px; }
  .cst-tip {
    display: flex; align-items: flex-start; gap: 13px;
    background: rgba(15,21,33,.82); backdrop-filter: blur(16px);
    border: 1px solid rgba(255,255,255,.06);
    border-left: 3px solid var(--dc);
    border-radius: 14px; padding: 15px 17px;
    transition: border-color .2s, background .2s, transform .2s, box-shadow .2s;
    animation: cst-up .32s ease both;
  }
  .cst-tip:hover {
    background: rgba(22,29,46,.9); border-color: var(--db);
    transform: translateY(-2px); box-shadow: 0 8px 28px rgba(0,0,0,.32);
  }
  .cst-tip-num {
    font-size: 10.5px; font-weight: 700;
    min-width: 28px; height: 28px; border-radius: 7px;
    display: flex; align-items: center; justify-content: center;
    background: var(--dd); color: var(--dc);
    flex-shrink: 0; margin-top: 1px; letter-spacing: .04em;
  }
  .cst-tip-text { font-size: 13.5px; font-weight: 400; line-height: 1.65; color: rgba(238,240,247,.48); }
  .cst-tip-text strong { color: #eef0f7; font-weight: 600; }

  /* ── Go Bag ── */
  .cst-gobag { animation: cst-up .35s ease both; }
  .cst-gobag-header {
    background: rgba(15,21,33,.82);
    border: 1px solid rgba(255,255,255,.07);
    border-top: 2px solid #2ECC8F;
    border-radius: 18px; padding: 24px 28px;
    margin-bottom: 16px;
    backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
    position: relative; overflow: hidden;
  }
  .cst-gobag-header::before {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(ellipse 60% 120% at 0% 50%, rgba(46,204,143,.06) 0%, transparent 70%);
    pointer-events: none;
  }
  .cst-gobag-title {
    font-family: 'Cabinet Grotesk', sans-serif;
    font-size: 22px; font-weight: 800;
    letter-spacing: -.03em; color: #eef0f7; margin-bottom: 6px;
  }
  .cst-gobag-title em { font-style: normal; color: #2ECC8F; }
  .cst-gobag-sub {
    font-size: 13.5px; font-weight: 400;
    color: rgba(238,240,247,.38); line-height: 1.65; max-width: 440px;
  }

  /* Progress */
  .cst-progress {
    background: rgba(15,21,33,.82);
    border: 1px solid rgba(255,255,255,.07);
    border-radius: 14px; padding: 20px 24px; margin-bottom: 16px;
    backdrop-filter: blur(16px);
  }
  .cst-progress-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
  .cst-progress-label { font-size: 13px; color: rgba(238,240,247,.40); }
  .cst-progress-pct {
    font-family: 'Cabinet Grotesk', sans-serif;
    font-size: 28px; font-weight: 900; letter-spacing: -.04em;
    color: #2ECC8F;
  }
  .cst-progress-track { height: 5px; border-radius: 6px; background: rgba(255,255,255,.06); overflow: hidden; }
  .cst-progress-fill {
    height: 100%; border-radius: 6px;
    background: linear-gradient(90deg, #2ECC8F, #7B9EFF);
    transition: width .5s cubic-bezier(.4,0,.2,1);
    box-shadow: 0 0 14px rgba(46,204,143,.28);
  }

  /* Category filter */
  .cst-cat-filter { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px; }
  .cst-cat-btn {
    font-size: 11px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase;
    padding: 6px 14px; border-radius: 20px;
    border: 1px solid rgba(255,255,255,.07);
    background: rgba(15,21,33,.82); backdrop-filter: blur(8px);
    color: rgba(238,240,247,.28); cursor: pointer; transition: all .18s; min-height: 36px;
  }
  .cst-cat-btn:hover { color: rgba(238,240,247,.55); border-color: rgba(255,255,255,.14); }
  .cst-cat-btn.active {
    background: rgba(46,204,143,.10); border-color: rgba(46,204,143,.30); color: #2ECC8F;
  }

  /* Checklist */
  .cst-checklist { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px,1fr)); gap: 8px; }
  .cst-check-item {
    display: flex; align-items: center; gap: 12px;
    background: rgba(15,21,33,.82); backdrop-filter: blur(16px);
    border: 1px solid rgba(255,255,255,.06); border-radius: 12px;
    padding: 13px 16px; cursor: pointer; transition: all .2s; user-select: none; min-height: 44px;
  }
  .cst-check-item:hover { border-color: rgba(255,255,255,.12); background: rgba(22,29,46,.9); }
  .cst-check-item.checked { border-color: rgba(46,204,143,.22); background: rgba(46,204,143,.05); }
  .cst-checkbox {
    width: 22px; height: 22px; border-radius: 7px; flex-shrink: 0;
    border: 1.5px solid rgba(255,255,255,.12); background: transparent;
    display: flex; align-items: center; justify-content: center;
    transition: all .2s; font-size: 12px; color: #fff; font-weight: 800;
  }
  .cst-check-item.checked .cst-checkbox {
    background: linear-gradient(135deg, #2ECC8F, #7B9EFF);
    border-color: transparent; box-shadow: 0 0 12px rgba(46,204,143,.28);
  }
  .cst-check-cat {
    font-size: 9px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase;
    color: #2ECC8F; opacity: .7; margin-bottom: 2px;
  }
  .cst-check-label {
    font-size: 13px; font-weight: 400; line-height: 1.45;
    color: rgba(238,240,247,.50); transition: all .2s;
  }
  .cst-check-item.checked .cst-check-label { color: rgba(238,240,247,.22); text-decoration: line-through; }
  .cst-check-num {
    font-size: 10px; font-weight: 500; color: rgba(238,240,247,.18);
    flex-shrink: 0; margin-left: auto; min-width: 28px; text-align: right;
  }

  .cst-reset {
    margin-top: 16px;
    font-size: 11px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase;
    color: rgba(238,240,247,.28);
    background: rgba(15,21,33,.82); backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,.07); border-radius: 10px;
    padding: 9px 20px; cursor: pointer; transition: all .2s; min-height: 40px;
  }
  .cst-reset:hover { color: rgba(238,240,247,.55); border-color: rgba(255,255,255,.14); }

  /* Responsive */
  @media (max-width: 680px) {
    .cst-inner { padding: 0 16px 80px; }
    .cst-tabs-wrap { margin: 0 -16px 28px; padding: 0 16px; }
    .cst-hero { margin-top: 40px; margin-bottom: 28px; }
    .cst-panel-header { grid-template-columns: 1fr; gap: 16px; padding: 18px 16px; }
    .cst-hotlines { width: 100%; }
    .cst-hotline-btn { flex: 1 1 calc(50% - 4px); justify-content: center; font-size: 12px; }
    .cst-phase-desc { display: none; }
    .cst-tips { grid-template-columns: 1fr; }
    .cst-checklist { grid-template-columns: 1fr; }
    .cst-gobag-header { padding: 18px 16px; }
    .cst-progress { padding: 16px 18px; }
  }
  @media (max-width: 400px) {
    .cst-hotline-btn { flex: 1 1 100%; }
  }
`;

export default function CitizenSafetyTips() {
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
    const idx  = DISASTERS.findIndex(d => d.id === hash);
    if (idx !== -1) setActiveTab(idx);
  }, []);

  return (
    <>
      <style>{CSS}</style>
      <div className="cst-root">
        <div className="cst-bg" style={{ backgroundImage: `url(${pagesBackground})` }} />
        <div className="cst-glow">
          <div className="cst-glow-a" />
          <div className="cst-glow-b" />
        </div>

        <div className="cst-inner">

          {/* ── Hero ── */}
          <section className="cst-hero">
            <div className="cst-hero-tag">
              <span className="cst-hero-dot" />
              Preparedness Hub
            </div>
            <h1 className="cst-hero-heading">
              Safety <em>Tips</em> &amp;<br />
              Emergency Guides
            </h1>
            <p className="cst-hero-sub">
              Step-by-step guidance for typhoons, floods, fires, earthquakes, landslides,
              and road accidents — plus your complete go bag checklist.
            </p>
          </section>

          {/* ── Sticky tabs ── */}
          <div className="cst-tabs-wrap">
            <div className="cst-tabs">
              {DISASTERS.map((d, i) => (
                <button
                  key={d.id}
                  className={`cst-tab${activeTab === i ? " active" : ""}`}
                  onClick={() => { setActiveTab(i); setActivePhase("before"); }}
                >
                  <span className="cst-tab-emoji">{d.emoji}</span>
                  {d.label}
                </button>
              ))}
              <button
                className={`cst-tab${isGoBag ? " active" : ""}`}
                onClick={() => setActiveTab(DISASTERS.length)}
              >
                <span className="cst-tab-emoji">🎒</span>
                Go Bag
              </button>
            </div>
          </div>

          {/* ── Disaster panel ── */}
          {!isGoBag && disaster && (
            <div
              key={disaster.id}
              className="cst-panel"
              style={{
                "--dc": disaster.color,
                "--dd": disaster.colorDim,
                "--db": disaster.colorBorder,
                "--dr": disaster.colorRgb,
              } as React.CSSProperties}
            >
              {/* Header */}
              <div className="cst-panel-header">
                <div className="cst-panel-title-group">
                  <div className="cst-panel-icon">{disaster.emoji}</div>
                  <div>
                    <div className="cst-panel-name">{disaster.label}</div>
                    <div className="cst-panel-signal">{disaster.signal}</div>
                  </div>
                </div>
                <div className="cst-hotlines">
                  {disaster.hotlines.map(h => (
                    <a key={h.number} href={`tel:${h.number}`} className="cst-hotline-btn">
                      📞 {h.label}
                    </a>
                  ))}
                </div>
              </div>

              {/* Phase switcher */}
              <div className="cst-phases">
                {(["before", "during", "after"] as const).map(p => {
                  const m = PHASE_META[p];
                  return (
                    <button
                      key={p}
                      className={`cst-phase-btn${activePhase === p ? " active" : ""}`}
                      onClick={() => setActivePhase(p)}
                    >
                      <span className="cst-phase-icon">{m.icon}</span>
                      <span className="cst-phase-label">{m.label}</span>
                      <span className="cst-phase-desc">{m.desc}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tips */}
              <div className="cst-tips">
                {disaster[activePhase].map((tip, i) => {
                  const dot  = tip.indexOf(" — ");
                  const main = dot > -1 ? tip.slice(0, dot) : tip;
                  const rest = dot > -1 ? tip.slice(dot)   : "";
                  return (
                    <div key={i} className="cst-tip" style={{ animationDelay: `${i * 0.04}s` }}>
                      <div className="cst-tip-num">{String(i + 1).padStart(2, "0")}</div>
                      <div className="cst-tip-text">
                        <strong>{main}</strong>{rest}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Go Bag panel ── */}
          {isGoBag && (
            <div className="cst-gobag">
              <div className="cst-gobag-header">
                <div className="cst-gobag-title">🎒 Your <em>Go Bag</em> Checklist</div>
                <p className="cst-gobag-sub">
                  Pack these 20 essentials so you can evacuate safely within 15 minutes.
                  Check off what you've already prepared.
                </p>
              </div>

              <div className="cst-progress">
                <div className="cst-progress-row">
                  <span className="cst-progress-label">{checkedCount} of {GO_BAG_ITEMS.length} items packed</span>
                  <span className="cst-progress-pct">{progress}%</span>
                </div>
                <div className="cst-progress-track">
                  <div className="cst-progress-fill" style={{ width: `${progress}%` }} />
                </div>
              </div>

              <div className="cst-cat-filter">
                {categories.map(c => (
                  <button
                    key={c}
                    className={`cst-cat-btn${bagFilter === c ? " active" : ""}`}
                    onClick={() => setBagFilter(c)}
                  >{c}</button>
                ))}
              </div>

              <div className="cst-checklist">
                {visibleItems.map(item => (
                  <div
                    key={item.id}
                    className={`cst-check-item${checked[item.id] ? " checked" : ""}`}
                    onClick={() => toggleCheck(item.id)}
                  >
                    <div className="cst-checkbox">{checked[item.id] && "✓"}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="cst-check-cat">{item.category}</div>
                      <div className="cst-check-label">{item.label}</div>
                    </div>
                    <div className="cst-check-num">#{String(item.id).padStart(2, "0")}</div>
                  </div>
                ))}
              </div>

              {checkedCount > 0 && (
                <button className="cst-reset" onClick={() => setChecked({})}>
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