import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import html2canvas from "html2canvas";
import { geoContains, geoNaturalEarth1, geoPath } from "d3-geo";
import { feature as topojsonFeature } from "topojson-client";
import worldAtlas110m from "world-atlas/countries-110m.json";

const LANG_COLORS = {
  JavaScript:"#f1e05a",TypeScript:"#3178c6",Python:"#3572A5",Rust:"#dea584",
  Go:"#00ADD8",Java:"#b07219","C++":"#f34b7d",C:"#888888",Ruby:"#701516",
  PHP:"#4F5D95",Swift:"#F05138",Kotlin:"#A97BFF",Dart:"#00B4AB",HTML:"#e34c26",
  CSS:"#563d7c",Shell:"#89e051",Vue:"#41b883",Svelte:"#ff3e00","C#":"#239120",
  Scala:"#c22d40",R:"#198CE7","Jupyter Notebook":"#DA5B0B",Lua:"#000080",
  Haskell:"#5e5086",Elixir:"#6e4a7e",Clojure:"#db5855",
};
const getLangColor = (l) => LANG_COLORS[l] || "#00f5ff";

const LOADING_STEPS = [
  "CONNECTING TO GITHUB",
  "EXTRACTING REPOSITORY GENOME",
  "MAPPING LANGUAGE TOPOLOGY",
  "ANALYZING COMMIT BEHAVIOR",
  "DECODING COLLABORATION PATTERNS",
  "RUNNING BEHAVIORAL ENGINE",
  "SYNTHESIZING PROFILE",
  "RENDERING PSYCHOLOGICAL MATRIX",
  "FINALIZING PROFILE",
  "PROFILE READY — INITIALIZING",
];

const RATE_LIMIT_MESSAGE = "RATE LIMIT HIT — Add a GitHub token in .env or wait 60 minutes";
const FOUNDER_HANDLE = "aanishnithin07";
const TORVALDS_HANDLE = "torvalds";
const FOUNDER_LOADING_STEPS = [
  "WAIT... THIS SIGNATURE IS FAMILIAR",
  "CROSS-REFERENCING FOUNDER DATABASE",
  "DNA MATCH CONFIRMED — ORIGIN DETECTED",
  "INITIATING FOUNDER PROTOCOL",
  "THE ARCHITECT HAS ENTERED THE SYSTEM",
];
const TORVALDS_LOADING_STEPS = [
  "SCANNING LEGEND...",
  "INDEXING KERNEL COMMITS",
  "MAPPING DISTRIBUTED SYSTEM IMPACT",
  "ANALYZING COMMIT BEHAVIOR",
  "DECODING OPEN SOURCE LEADERSHIP",
  "RUNNING LEGACY RESONANCE ENGINE",
  "SYNTHESIZING PROFILE",
  "RENDERING PSYCHOLOGICAL MATRIX",
  "FINALIZING PROFILE",
  "LEGEND PROFILE READY — INITIALIZING",
];
const FOUNDER_FAST_FACTS = [
  "GitDNA was built by this developer. The algorithm you're looking at? He designed it at midnight.",
  "Aanish coded the engine that reads everyone else's DNA. The scanner cannot scan the one who built the scanner.",
  "0 to GitDNA in one idea. Some developers use tools. This one forges them.",
];
const EMPTY_REPO_ROAST = "Zero stars. Every legend started here.\nThe commit log doesn't lie — you showed up.";
const TIME_MACHINE_AI_CACHE = new Map();
const GITMAP_GEOCODE_CACHE = new Map();
const GITMAP_INSIGHT_CACHE = new Map();

const CITY_COORDS = {
  bangalore: [12.9716, 77.5946],
  mumbai: [19.076, 72.8777],
  chennai: [13.0827, 80.2707],
  delhi: [28.6139, 77.209],
  "san francisco": [37.7749, -122.4194],
  "new york": [40.7128, -74.006],
  london: [51.5074, -0.1278],
  berlin: [52.52, 13.405],
  toronto: [43.6532, -79.3832],
  tokyo: [35.6762, 139.6503],
  beijing: [39.9042, 116.4074],
  sydney: [-33.8688, 151.2093],
  paris: [48.8566, 2.3522],
  amsterdam: [52.3676, 4.9041],
  singapore: [1.3521, 103.8198],
  hyderabad: [17.385, 78.4867],
  pune: [18.5204, 73.8567],
};

const COUNTRY_DEV_DATA = {
  IN: {
    devCount: "5.8M",
    rank: 3,
    topLang: "JavaScript",
    topLang2: "Python",
    topLang3: "Java",
    risingTech: "Rust",
    timezoneName: "IST",
    devDensity: "HIGH",
    signal: 92,
    funFact: "India produces the 3rd most developers globally. The output is relentless.",
  },
  US: {
    devCount: "4.4M",
    rank: 1,
    topLang: "JavaScript",
    topLang2: "Python",
    topLang3: "TypeScript",
    risingTech: "Go",
    timezoneName: "EST/PST",
    devDensity: "EXTREME",
    signal: 98,
    funFact: "Home of GitHub itself. The epicenter. Every PR standard was born here.",
  },
  GB: {
    devCount: "1.2M",
    rank: 6,
    topLang: "Python",
    topLang2: "JavaScript",
    topLang3: "Java",
    risingTech: "Kotlin",
    timezoneName: "GMT",
    devDensity: "HIGH",
    signal: 85,
    funFact: "Built the web's first browser. The British dev legacy runs deep.",
  },
  DE: {
    devCount: "1.5M",
    rank: 4,
    topLang: "Java",
    topLang2: "Python",
    topLang3: "C++",
    risingTech: "Rust",
    timezoneName: "CET",
    devDensity: "HIGH",
    signal: 88,
    funFact: "Germany open-sources at a per-capita rate that shames most nations.",
  },
  CN: {
    devCount: "7.5M",
    rank: 2,
    topLang: "Java",
    topLang2: "Python",
    topLang3: "JavaScript",
    risingTech: "Go",
    timezoneName: "CST",
    devDensity: "EXTREME",
    signal: 96,
    funFact: "The world's largest developer population. GitHub's fastest growing region.",
  },
  BR: {
    devCount: "800K",
    rank: 8,
    topLang: "JavaScript",
    topLang2: "Python",
    topLang3: "Java",
    risingTech: "TypeScript",
    timezoneName: "BRT",
    devDensity: "MEDIUM",
    signal: 74,
    funFact: "Brazil's dev community doubled in 4 years. The rise continues.",
  },
  CA: {
    devCount: "900K",
    rank: 7,
    topLang: "JavaScript",
    topLang2: "Python",
    topLang3: "TypeScript",
    risingTech: "Rust",
    timezoneName: "EST/PST",
    devDensity: "HIGH",
    signal: 82,
    funFact: "Shopify, Slack, Cohere. Canada exports developer excellence quietly.",
  },
  JP: {
    devCount: "1.1M",
    rank: 5,
    topLang: "JavaScript",
    topLang2: "Ruby",
    topLang3: "Python",
    risingTech: "TypeScript",
    timezoneName: "JST",
    devDensity: "HIGH",
    signal: 86,
    funFact: "Ruby was born here. Japan's engineering precision bleeds into its code.",
  },
  AU: {
    devCount: "420K",
    rank: 12,
    topLang: "Python",
    topLang2: "JavaScript",
    topLang3: "Go",
    risingTech: "Rust",
    timezoneName: "AEST",
    devDensity: "MEDIUM",
    signal: 71,
    funFact: "Atlassian launched here. Australia punches above its weight in dev tools.",
  },
  DEFAULT: {
    devCount: "Unknown",
    rank: "—",
    topLang: "JavaScript",
    topLang2: "Python",
    topLang3: "Unknown",
    risingTech: "Unknown",
    timezoneName: "Unknown",
    devDensity: "DETECTING",
    signal: 60,
    funFact: "Every country has developers. Every developer has a story.",
  },
};

const GITMAP_REGION_BASELINES = {
  IN: { stars: 28, commits: 11 },
  US: { stars: 45, commits: 15 },
  GB: { stars: 38, commits: 13 },
  DE: { stars: 34, commits: 12 },
  CN: { stars: 31, commits: 14 },
  BR: { stars: 22, commits: 10 },
  CA: { stars: 33, commits: 12 },
  JP: { stars: 30, commits: 11 },
  AU: { stars: 29, commits: 10 },
  DEFAULT: { stars: 26, commits: 10 },
};

const GITMAP_TECH_HUBS = [
  { city: "San Francisco", lat: 37.7749, lon: -122.4194 },
  { city: "London", lat: 51.5074, lon: -0.1278 },
  { city: "Berlin", lat: 52.52, lon: 13.405 },
  { city: "Tokyo", lat: 35.6762, lon: 139.6503 },
  { city: "Bangalore", lat: 12.9716, lon: 77.5946 },
  { city: "Sydney", lat: -33.8688, lon: 151.2093 },
];

const TZ_MAP = {
  IN: "Asia/Kolkata",
  US: "America/New_York",
  GB: "Europe/London",
  DE: "Europe/Berlin",
  JP: "Asia/Tokyo",
  AU: "Australia/Sydney",
  BR: "America/Sao_Paulo",
  CA: "America/Toronto",
  CN: "Asia/Shanghai",
  SG: "Asia/Singapore",
  FR: "Europe/Paris",
  NL: "Europe/Amsterdam",
};

let GITMAP_WORLD_FEATURES_CACHE = null;
let GITMAP_COUNTRY_NAME_CACHE = null;

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Share+Tech+Mono&family=Rajdhani:wght@300;400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
html,body{max-width:100%;overflow-x:hidden}
.gd-root{font-family:'Rajdhani',sans-serif;background:#060b12;min-height:100vh;color:#c8e8ff;overflow-x:hidden;position:relative}
.gd-bg-canvas{position:fixed;inset:0;pointer-events:none;z-index:0;width:100%;height:100%}
.gd-scanlines{position:fixed;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.12) 2px,rgba(0,0,0,0.12) 4px);pointer-events:none;z-index:1;opacity:.5}
.orb{font-family:'Orbitron',monospace!important}
.mono{font-family:'Share Tech Mono',monospace!important}

@keyframes glitch{
  0%,90%,100%{text-shadow:0 0 8px rgba(0,220,255,0.6),0 0 20px rgba(0,220,255,0.3);transform:none}
  92%{text-shadow:-3px 0 #b347ea,3px 0 #39ff14;transform:translate(-2px,1px) skewX(-1deg)}
  94%{text-shadow:3px -1px #00dcff,-3px 1px #b347ea;transform:translate(1px,-1px)}
  96%{text-shadow:-2px 0 #39ff14,2px 0 #00dcff;transform:translate(0,0) skewX(0.5deg)}
}
@keyframes pulse-border{
  0%,100%{box-shadow:0 0 8px rgba(0,220,255,0.15),inset 0 0 8px rgba(0,220,255,0.04)}
  50%{box-shadow:0 0 18px rgba(0,220,255,0.3),inset 0 0 12px rgba(0,220,255,0.08)}
}
@keyframes slide-up{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
@keyframes slide-left{from{opacity:0;transform:translateX(-24px)}to{opacity:1;transform:translateX(0)}}
@keyframes fade-in{from{opacity:0}to{opacity:1}}
@keyframes count-in{from{opacity:0;transform:translateY(12px) scale(0.85)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes bar-expand{from{width:0}to{width:var(--w)}}
@keyframes blink{0%,49%{opacity:1}50%,100%{opacity:0}}
@keyframes spin-slow{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes scan-line{0%{top:-2px}100%{top:100%}}
@keyframes particle-rise{
  0%{transform:translateY(0) translateX(0);opacity:0}
  10%{opacity:0.7}
  90%{opacity:0.3}
  100%{transform:translateY(-80vh) translateX(var(--dx));opacity:0}
}
@keyframes hexagon-pulse{
  0%,100%{opacity:0.3;transform:scale(1)}
  50%{opacity:0.6;transform:scale(1.05)}
}
@keyframes data-flash{
  0%,100%{opacity:1}
  50%{opacity:0.4}
}
@keyframes ring-spin{
  from{transform:rotate(0deg)}
  to{transform:rotate(360deg)}
}
@keyframes helix-wave-a{from{stroke-dashoffset:0}to{stroke-dashoffset:-96}}
@keyframes helix-wave-b{from{stroke-dashoffset:0}to{stroke-dashoffset:96}}
@keyframes helix-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes flash{0%{opacity:0}20%{opacity:.6}100%{opacity:0}}
@keyframes founder-burst{
  0%{opacity:0;transform:scale(.82)}
  30%{opacity:.95}
  100%{opacity:0;transform:scale(1.18)}
}
@keyframes founder-pan{0%{background-position:0% 50%}100%{background-position:200% 50%}}
@keyframes founder-ring-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes founder-beacon{
  0%,100%{opacity:.65;filter:drop-shadow(0 0 8px rgba(255,179,0,.5))}
  50%{opacity:1;filter:drop-shadow(0 0 16px rgba(255,179,0,.9))}
}
@keyframes duel-left-in{from{opacity:0;transform:translateX(-60px) scale(.9)}to{opacity:1;transform:translateX(0) scale(1)}}
@keyframes duel-right-in{from{opacity:0;transform:translateX(60px) scale(.9)}to{opacity:1;transform:translateX(0) scale(1)}}
@keyframes duel-vs-pop{
  0%{opacity:0;transform:scale(.45) rotate(-8deg)}
  45%{opacity:1}
  70%{transform:scale(1.12) rotate(2deg)}
  100%{opacity:1;transform:scale(1) rotate(0deg)}
}
@keyframes duel-pulse{0%,100%{box-shadow:0 0 10px rgba(255,179,0,.25)}50%{box-shadow:0 0 24px rgba(255,179,0,.5)}}
@keyframes card-rise{from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:translateY(0)}}
@keyframes scan-sweep{0%{transform:translateY(-6px);opacity:0}12%{opacity:1}100%{transform:translateY(calc(100% + 6px));opacity:0}}
@keyframes dna-lock{
  0%{opacity:0;color:#39ff14;text-shadow:0 0 14px rgba(57,255,20,.95);transform:translateY(4px) scale(.78)}
  65%{opacity:1;color:#39ff14;text-shadow:0 0 18px rgba(57,255,20,.85)}
  100%{opacity:1;color:var(--dna-final);text-shadow:var(--dna-final-shadow);transform:translateY(0) scale(1)}
}
@keyframes ultra-hue{from{filter:hue-rotate(0deg)}to{filter:hue-rotate(360deg)}}
@keyframes founder-dashboard-rise{from{opacity:.2;transform:translateY(42px)}to{opacity:1;transform:translateY(0)}}
@keyframes founder-cinematic-text{
  0%,18%{opacity:0;transform:translateY(10px) scale(.98)}
  35%,72%{opacity:1;transform:translateY(0) scale(1)}
  100%{opacity:0;transform:translateY(-10px) scale(1.02)}
}
@keyframes founder-shimmer{0%{transform:translateX(-120%)}100%{transform:translateX(140%)}}
@keyframes loading-letter-drift{
  0%,18%,100%{transform:translate(0,0) rotate(0deg) scale(1);opacity:1}
  28%{transform:translate(0,-20px) rotate(-14deg) scale(.86);opacity:.08}
  42%{transform:translate(20px,10px) rotate(10deg) scale(.92);opacity:0}
  62%{transform:translate(-8px,-6px) rotate(6deg) scale(1.08);opacity:1}
}
@keyframes loading-title-flicker{0%,100%{opacity:1}50%{opacity:.82}}
@keyframes roast-line-rise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes roast-meter-loop{0%{left:-36%}100%{left:100%}}
@keyframes torvalds-screen-glitch{
  0%{filter:none;transform:none}
  20%{filter:contrast(1.35) saturate(1.2) hue-rotate(-16deg);transform:skewX(-1.2deg) translateX(-2px)}
  40%{filter:contrast(1.5) hue-rotate(14deg);transform:skewX(1.2deg) translateX(2px)}
  60%{filter:contrast(1.15) saturate(1.4);transform:skewX(-.7deg)}
  100%{filter:none;transform:none}
}
@keyframes toast-down{from{opacity:0;transform:translateY(-24px)}to{opacity:1;transform:translateY(0)}}
@keyframes dashboard-wake{0%{opacity:.7}100%{opacity:1}}
@keyframes tier-halo-pulse{0%,100%{opacity:.6}50%{opacity:1}}

.gd-glitch{animation:glitch 5s infinite}
.gd-dashboard-wake{animation:dashboard-wake .2s ease}
.gd-card{border:1px solid rgba(0,220,255,0.18);background:rgba(4,14,26,0.88);backdrop-filter:blur(14px);border-radius:6px;animation:pulse-border 4s ease-in-out infinite;position:relative}
.gd-card-purple{border:1px solid rgba(179,71,234,0.25);background:rgba(10,4,22,0.88);backdrop-filter:blur(14px);box-shadow:0 0 14px rgba(179,71,234,0.12);border-radius:6px;position:relative}
.gd-card-green{border:1px solid rgba(57,255,20,0.2);background:rgba(4,14,6,0.88);backdrop-filter:blur(14px);box-shadow:0 0 10px rgba(57,255,20,0.1);border-radius:6px;position:relative}
.gd-card-gold{border:1px solid rgba(255,179,0,0.25);background:rgba(18,12,0,0.88);backdrop-filter:blur(14px);box-shadow:0 0 12px rgba(255,179,0,0.1);border-radius:6px;position:relative}

.gd-card::before{content:'';position:absolute;top:0;left:0;width:14px;height:14px;border-top:1.5px solid rgba(0,220,255,0.6);border-left:1.5px solid rgba(0,220,255,0.6);border-radius:2px 0 0 0;pointer-events:none}
.gd-card::after{content:'';position:absolute;bottom:0;right:0;width:14px;height:14px;border-bottom:1.5px solid rgba(0,220,255,0.6);border-right:1.5px solid rgba(0,220,255,0.6);border-radius:0 0 2px 0;pointer-events:none}

.gd-section-label{font-family:'Share Tech Mono',monospace;font-size:0.62rem;letter-spacing:0.18em;color:rgba(0,220,255,0.45);text-transform:uppercase;margin-bottom:10px;display:flex;align-items:center;gap:8px}
.gd-section-label::before{content:'';display:inline-block;width:4px;height:4px;background:rgba(0,220,255,0.5);border-radius:50%;flex-shrink:0}
.gd-section-label::after{content:'';display:block;height:1px;flex:1;background:linear-gradient(90deg,rgba(0,220,255,0.2),transparent)}

.gd-input{background:rgba(0,8,20,0.95);border:1px solid rgba(0,220,255,0.35);color:#00dcff;font-family:'Share Tech Mono',monospace;font-size:1.05rem;padding:15px 18px;outline:none;width:100%;transition:all .3s;letter-spacing:.04em;border-radius:4px}
.gd-input:focus{border-color:rgba(0,220,255,0.8);box-shadow:0 0 24px rgba(0,220,255,0.2),inset 0 0 10px rgba(0,220,255,0.04)}
.gd-input::placeholder{color:rgba(0,220,255,0.25)}

.gd-btn{background:linear-gradient(135deg,rgba(0,220,255,0.12),rgba(179,71,234,0.12));border:1px solid rgba(0,220,255,0.45);color:#00dcff;font-family:'Orbitron',monospace;font-size:0.78rem;letter-spacing:.12em;padding:13px 28px;cursor:pointer;transition:all .25s;border-radius:4px;position:relative;overflow:hidden;white-space:nowrap}
.gd-btn:hover:not(:disabled){background:linear-gradient(135deg,rgba(0,220,255,0.25),rgba(179,71,234,0.25));box-shadow:0 0 24px rgba(0,220,255,0.35);transform:translateY(-1px)}
.gd-btn:disabled{opacity:.4;cursor:not-allowed}
.gd-btn::before{content:'';position:absolute;top:-50%;left:-50%;width:200%;height:200%;background:linear-gradient(45deg,transparent 40%,rgba(255,255,255,0.04) 50%,transparent 60%);transform:translateX(-100%);transition:transform .5s}
.gd-btn:hover::before{transform:translateX(100%)}
.gd-btn-roast{background:linear-gradient(135deg,rgba(255,70,70,0.24),rgba(120,20,20,0.25));border-color:rgba(255,90,90,0.6);color:#ff8a8a}
.gd-btn-roast:hover:not(:disabled){background:linear-gradient(135deg,rgba(255,82,82,0.34),rgba(120,20,20,0.35));box-shadow:0 0 24px rgba(255,82,82,0.35)}

.gd-badge{font-family:'Share Tech Mono',monospace;font-size:0.6rem;letter-spacing:.1em;padding:2px 7px;border-radius:2px;text-transform:uppercase;display:inline-block}
.gd-badge-cyan{background:rgba(0,220,255,0.1);color:#00dcff;border:1px solid rgba(0,220,255,0.25)}
.gd-badge-purple{background:rgba(179,71,234,0.1);color:#c46ef8;border:1px solid rgba(179,71,234,0.25)}
.gd-badge-green{background:rgba(57,255,20,0.1);color:#39ff14;border:1px solid rgba(57,255,20,0.25)}
.gd-badge-gold{background:rgba(255,179,0,0.1);color:#ffb300;border:1px solid rgba(255,179,0,0.25)}

.gd-neon-line{height:1px;background:linear-gradient(90deg,transparent,rgba(0,220,255,0.4),transparent);margin:18px 0}
.gd-divider-v{width:1px;background:linear-gradient(180deg,transparent,rgba(0,220,255,0.3),transparent);flex-shrink:0}

.delay-1{animation-delay:.1s;opacity:0;fill-mode:forwards}
.delay-2{animation-delay:.2s;opacity:0}
.delay-3{animation-delay:.3s;opacity:0}
.delay-4{animation-delay:.4s;opacity:0}
.delay-5{animation-delay:.5s;opacity:0}
.delay-6{animation-delay:.6s;opacity:0}
.delay-7{animation-delay:.7s;opacity:0}
.delay-8{animation-delay:.8s;opacity:0}

.anim-up{animation:slide-up .55s cubic-bezier(.2,.8,.2,1) forwards}
.anim-left{animation:slide-left .55s cubic-bezier(.2,.8,.2,1) forwards}
.anim-fade{animation:fade-in .7s ease forwards}
.anim-count{animation:count-in .5s ease forwards}

::-webkit-scrollbar{width:3px}
::-webkit-scrollbar-track{background:#060b12}
::-webkit-scrollbar-thumb{background:rgba(0,220,255,0.25);border-radius:2px}

.stat-number{font-family:'Orbitron',monospace;letter-spacing:.05em}
.trait-label{font-family:'Share Tech Mono',monospace;font-size:.68rem;fill:rgba(0,220,255,0.5)}

.gd-hover-lift{transition:transform .2s ease,box-shadow .2s ease;cursor:default}
.gd-hover-lift:hover{transform:translateY(-3px)}

.scan-overlay{position:absolute;inset:0;pointer-events:none;overflow:hidden;border-radius:6px}
.scan-overlay::after{content:'';position:absolute;left:0;right:0;top:0;height:1px;background:linear-gradient(90deg,transparent,rgba(0,220,255,0.4),transparent);opacity:.2}

.gd-recent-pill{border:1px solid rgba(0,220,255,0.28);background:rgba(0,8,20,0.8);color:rgba(0,220,255,0.88);padding:6px 10px;border-radius:999px;font-family:'Share Tech Mono',monospace;font-size:.62rem;letter-spacing:.08em;cursor:pointer;transition:all .2s ease}
.gd-recent-pill:hover{background:rgba(0,220,255,0.14);box-shadow:0 0 12px rgba(0,220,255,0.24)}

.gd-helix{transform-origin:50% 50%;animation:helix-spin 4.5s linear infinite;filter:drop-shadow(0 0 18px rgba(0,220,255,0.2))}
.gd-helix-a{fill:none;stroke:#00dcff;stroke-width:3;stroke-linecap:round;stroke-dasharray:14 8;animation:helix-wave-a 1.1s linear infinite}
.gd-helix-b{fill:none;stroke:#b347ea;stroke-width:3;stroke-linecap:round;stroke-dasharray:14 8;animation:helix-wave-b 1.1s linear infinite}

.gd-loading-title{margin-top:4px;display:flex;justify-content:center;gap:4px;animation:loading-title-flicker 2.5s ease-in-out infinite;position:relative;z-index:3}
.gd-loading-title span{display:inline-block;font-family:'Orbitron',monospace;font-weight:900;font-size:clamp(1.1rem,4.2vw,1.8rem);letter-spacing:.08em;text-shadow:0 0 14px rgba(0,220,255,.55);animation:loading-letter-drift 2.8s ease-in-out infinite;animation-delay:calc(var(--i) * 120ms)}
.gd-loading-title span:nth-child(odd){color:#00dcff}
.gd-loading-title span:nth-child(even){color:#b347ea}
.gd-loading-status{position:relative;z-index:3}

.gd-share-export-card{border:1px solid rgba(0,220,255,0.3);border-radius:12px;background:linear-gradient(160deg,#071424,#0a1324 50%,#110a1f);box-shadow:0 0 24px rgba(0,220,255,0.24);padding:24px;color:#dff7ff;font-family:'Rajdhani',sans-serif}
.gd-share-export-row{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-top:14px}
.gd-share-export-chip{padding:7px 10px;border-radius:6px;border:1px solid rgba(0,220,255,0.28);background:rgba(7,24,38,0.85);font-family:'Share Tech Mono',monospace;font-size:.64rem;letter-spacing:.08em;color:#9de7ff}

.gd-vitals-row{display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;max-width:100%}
.gd-unlock-flash{position:fixed;inset:0;background:radial-gradient(circle at center,rgba(255,255,255,.95),rgba(140,248,255,.72));pointer-events:none;z-index:60;animation:flash .4s ease-out forwards}
.gd-founder-burst{position:fixed;inset:-20%;pointer-events:none;z-index:65;mix-blend-mode:screen;background:radial-gradient(circle at center,rgba(255,210,92,.95) 0%,rgba(255,179,0,.32) 28%,rgba(179,71,234,.22) 46%,rgba(0,220,255,.16) 63%,rgba(0,0,0,0) 78%);animation:founder-burst .95s ease-out forwards}

.gd-founder-header{border-color:rgba(255,179,0,0.38);box-shadow:0 0 18px rgba(255,179,0,0.2),0 0 26px rgba(179,71,234,0.14),inset 0 0 12px rgba(255,179,0,0.05)}
.gd-founder-header-shimmer{position:absolute;inset:0;pointer-events:none;overflow:hidden;border-radius:6px}
.gd-founder-header-shimmer::after{content:'';position:absolute;inset:-20% 0;background:linear-gradient(110deg,transparent 34%,rgba(255,215,0,.02) 42%,rgba(255,215,0,.3) 50%,rgba(255,215,0,.02) 58%,transparent 66%);animation:founder-shimmer 6s linear infinite}

.gd-ultra-mode .gd-card,
.gd-ultra-mode .gd-btn,
.gd-ultra-mode .gd-badge-cyan,
.gd-ultra-mode .gd-neon-line,
.gd-ultra-mode .gd-input,
.gd-ultra-mode .gd-section-label,
.gd-ultra-mode .gd-active-dot,
.gd-ultra-mode .gd-header-ring{animation:ultra-hue 4s linear infinite}

.gd-torvalds-screen{animation:torvalds-screen-glitch .23s steps(2,end) 3}

.gd-tier-header-legendary{border-color:rgba(255,179,0,0.55)!important;box-shadow:0 0 20px rgba(255,179,0,0.24),inset 0 0 12px rgba(255,179,0,0.08)}
.gd-tier-header-elite{border-color:rgba(179,71,234,0.55)!important;box-shadow:0 0 18px rgba(179,71,234,0.26),inset 0 0 12px rgba(179,71,234,0.08)}
.gd-tier-header-veteran{border-color:rgba(0,220,255,0.55)!important;box-shadow:0 0 18px rgba(0,220,255,0.24),inset 0 0 12px rgba(0,220,255,0.08)}
.gd-tier-header-rising{border-color:rgba(57,255,20,0.5)!important;box-shadow:0 0 16px rgba(57,255,20,0.2),inset 0 0 10px rgba(57,255,20,0.08)}

.gd-cognitive-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}
.gd-compare-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px}

.gd-modal-overlay{position:fixed;inset:0;z-index:85;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(4,8,16,0.68);backdrop-filter:blur(8px)}
.gd-modal-card{width:100%;max-width:460px;border:1px solid rgba(0,220,255,0.26);background:rgba(6,14,24,0.95);border-radius:8px;box-shadow:0 0 24px rgba(0,220,255,0.18);padding:20px 18px;position:relative}
.gd-modal-title{font-family:'Share Tech Mono',monospace;font-size:.68rem;letter-spacing:.18em;color:rgba(0,220,255,0.58);margin-bottom:14px}

.gd-winner-chip{display:inline-flex;align-items:center;justify-content:center;padding:2px 8px;border-radius:999px;font-family:'Share Tech Mono',monospace;font-size:.52rem;letter-spacing:.14em;text-transform:uppercase}
.gd-winner-chip-cyan{border:1px solid rgba(0,220,255,0.4);color:#00dcff;background:rgba(0,220,255,0.1)}
.gd-winner-chip-purple{border:1px solid rgba(179,71,234,0.4);color:#c46ef8;background:rgba(179,71,234,0.1)}
.gd-winner-chip-gold{border:1px solid rgba(255,179,0,0.45);color:#ffb300;background:rgba(255,179,0,0.1)}
.gd-lang-pill{display:inline-flex;align-items:center;padding:4px 9px;border-radius:999px;font-family:'Share Tech Mono',monospace;font-size:.58rem;letter-spacing:.08em}
.gd-lang-pill-shared{border:1px solid rgba(255,179,0,0.4);color:#ffb300;background:rgba(255,179,0,0.1)}
.gd-lang-pill-left{border:1px solid rgba(0,220,255,0.36);color:#00dcff;background:rgba(0,220,255,0.09)}
.gd-lang-pill-right{border:1px solid rgba(179,71,234,0.36);color:#c46ef8;background:rgba(179,71,234,0.1)}

.gd-duel-stage{position:relative;z-index:2;width:100%;max-width:920px;display:grid;grid-template-columns:1fr auto 1fr;gap:14px;align-items:center}
.gd-duel-card{border-radius:8px;padding:18px 14px;text-align:center;backdrop-filter:blur(10px)}
.gd-duel-card-left{border:1px solid rgba(0,220,255,0.42);background:rgba(4,18,30,0.9);animation:duel-left-in .75s cubic-bezier(.2,.8,.2,1) forwards}
.gd-duel-card-right{border:1px solid rgba(179,71,234,0.45);background:rgba(16,7,26,0.92);animation:duel-right-in .75s cubic-bezier(.2,.8,.2,1) forwards}
.gd-duel-vs{width:96px;height:96px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:1px solid rgba(255,179,0,.55);background:radial-gradient(circle at 35% 35%,rgba(255,179,0,.3),rgba(35,18,0,.95));color:#ffd166;font-size:1.5rem;font-weight:900;letter-spacing:.08em;animation:duel-vs-pop .8s ease-out forwards,duel-pulse 1.2s ease-in-out .9s infinite}
.gd-duel-label{font-family:'Share Tech Mono',monospace;font-size:.58rem;letter-spacing:.16em;margin-bottom:8px}
.gd-duel-sub{margin-top:16px;text-align:center;font-family:'Share Tech Mono',monospace;font-size:.64rem;letter-spacing:.16em;color:rgba(255,179,0,.66)}

.gd-global-badge{position:fixed;z-index:9999;pointer-events:none;padding:4px 10px;border-radius:999px;font-family:'Share Tech Mono',monospace;font-size:.58rem;letter-spacing:.1em;text-transform:uppercase}
.gd-ultra-badge{left:12px;bottom:12px;background:rgba(57,255,20,.14);border:1px solid rgba(57,255,20,.4);color:#39ff14}

.gd-fixed-overlay{position:fixed;inset:0;z-index:9999;pointer-events:none}
.gd-konami-flash{background:#39ff14}
.gd-konami-message{display:flex;align-items:center;justify-content:center}
.gd-konami-message > div{font-family:'Orbitron',monospace;font-size:clamp(1.4rem,5vw,2.2rem);font-weight:900;letter-spacing:.12em;color:#39ff14;text-shadow:0 0 16px rgba(57,255,20,.85)}

.gd-toast{position:fixed;z-index:9999;pointer-events:none;padding:10px 12px;border-radius:8px;font-family:'Share Tech Mono',monospace;font-size:.64rem;letter-spacing:.06em;max-width:min(92vw,420px);line-height:1.45;animation:toast-down .35s ease forwards}
.gd-toast button{pointer-events:auto}
.gd-toast-close{margin-left:8px;background:transparent;border:1px solid currentColor;border-radius:4px;color:inherit;font-size:.55rem;padding:2px 6px;cursor:pointer}
.gd-toast-action{margin-top:7px;background:transparent;border:1px solid currentColor;border-radius:4px;color:inherit;font-size:.58rem;padding:4px 8px;cursor:pointer}

.gd-roast-card{border:1px solid rgba(255,88,88,0.38);background:radial-gradient(circle at 15% 0%,rgba(98,0,0,0.36),rgba(22,6,10,0.94) 38%,rgba(8,10,18,0.96) 100%);box-shadow:0 0 20px rgba(255,62,62,0.22),inset 0 0 18px rgba(255,60,60,0.08)}
.gd-roast-meter{height:8px;border-radius:999px;background:rgba(255,77,77,0.14);border:1px solid rgba(255,90,90,0.22);overflow:hidden;position:relative}
.gd-roast-meter-fill{height:100%;border-radius:999px;background:linear-gradient(90deg,#7d0f0f,#ff4343,#ff8a5b);box-shadow:0 0 12px rgba(255,67,67,.42);transition:width .8s cubic-bezier(.2,.8,.2,1)}
.gd-roast-line{display:flex;gap:8px;align-items:flex-start;padding:7px 0;color:rgba(255,208,208,0.88);font-size:.84rem;line-height:1.55;animation:roast-line-rise .35s ease both}
.gd-roast-redemption{margin-top:10px;padding:10px 12px;border-radius:6px;border:1px solid rgba(57,255,20,0.26);background:rgba(6,30,8,0.56);color:#95ff8b;font-size:.83rem;line-height:1.6;animation:roast-line-rise .35s ease both}
.gd-roast-meter-loading::after{content:'';position:absolute;top:-1px;bottom:-1px;width:36%;border-radius:999px;background:linear-gradient(90deg,rgba(255,67,67,0),rgba(255,122,122,.95),rgba(255,67,67,0));filter:blur(.2px);animation:roast-meter-loop 1.05s linear infinite}
.gd-roast-pending{padding:10px 0 2px}

.gd-cursor-trail-dot{position:fixed;z-index:9999;pointer-events:none;width:3px;height:3px;border-radius:50%;background:#00dcff;box-shadow:0 0 8px rgba(0,220,255,.7);transition:opacity .6s linear}

.gd-founder-cinematic{position:fixed;inset:0;z-index:9999;pointer-events:none;background:#000;display:flex;align-items:center;justify-content:center}
.gd-founder-cinematic-text{font-family:'Orbitron',monospace;font-size:clamp(2rem,8vw,4rem);font-weight:900;letter-spacing:.1em;color:#fff;animation:founder-cinematic-text 1.7s ease .3s forwards;opacity:0}

.gd-founder-card{position:relative;border:1px solid rgba(255,179,0,0.34);background:radial-gradient(circle at 10% 0%,rgba(255,179,0,0.2),rgba(16,11,2,0.95) 42%,rgba(7,8,16,0.94) 100%);backdrop-filter:blur(12px);border-radius:6px;overflow:hidden;box-shadow:0 0 18px rgba(255,179,0,0.14),0 0 30px rgba(179,71,234,0.1)}
.gd-founder-card::before{content:'';position:absolute;inset:0;background:linear-gradient(120deg,transparent 15%,rgba(255,179,0,.14) 36%,rgba(179,71,234,.16) 50%,rgba(0,220,255,.12) 64%,transparent 86%);background-size:200% 100%;animation:founder-pan 7s linear infinite;pointer-events:none}
.gd-founder-card::after{content:'';position:absolute;inset:0;border:1px solid rgba(255,179,0,0.2);border-radius:6px;pointer-events:none}
.gd-founder-core{display:flex;justify-content:space-between;align-items:center;gap:14px;position:relative;z-index:1;flex-wrap:wrap}
.gd-founder-title{font-family:'Orbitron',monospace;font-size:.88rem;letter-spacing:.08em;color:#ffd166;text-shadow:0 0 14px rgba(255,179,0,.35)}
.gd-founder-note{margin-top:8px;font-size:.8rem;color:rgba(227,234,255,.72);line-height:1.5;font-weight:500;max-width:600px}
.gd-founder-sigil-wrap{position:relative;width:78px;height:78px;flex-shrink:0;display:flex;align-items:center;justify-content:center}
.gd-founder-ring{position:absolute;inset:0;border-radius:50%;border:1.5px solid rgba(255,179,0,.6);border-top-color:rgba(0,220,255,.85);border-bottom-color:rgba(179,71,234,.75);animation:founder-ring-spin 5.5s linear infinite}
.gd-founder-sigil{width:56px;height:56px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(255,179,0,.12);border:1px solid rgba(255,179,0,.5);color:#ffd166;letter-spacing:.2em;font-size:.64rem;font-weight:700;animation:founder-beacon 1.9s ease-in-out infinite}
.gd-founder-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin-top:12px;position:relative;z-index:1}
.gd-founder-chip{border:1px solid rgba(255,179,0,.32);background:rgba(20,14,4,.78);border-radius:4px;padding:8px 10px;min-height:58px}
.gd-founder-chip-label{font-family:'Share Tech Mono',monospace;font-size:.55rem;letter-spacing:.14em;color:rgba(255,179,0,.55);margin-bottom:5px}
.gd-founder-chip-value{font-family:'Orbitron',monospace;font-size:.76rem;letter-spacing:.04em;color:#fff6dc;text-shadow:0 0 10px rgba(255,179,0,.25);line-height:1.35}

.gd-enter-scan{overflow:hidden}
.gd-enter-scan::after{content:'';position:absolute;left:0;right:0;top:0;height:2px;background:linear-gradient(90deg,transparent,rgba(0,220,255,0.4),transparent);transform:translateY(-6px);opacity:0;pointer-events:none;z-index:4;animation:scan-sweep .6s linear var(--scan-delay,0ms) 1 forwards}

.gd-repo-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px}
.gd-repo-card{padding:14px 14px;background:rgba(6,14,24,0.88);backdrop-filter:blur(10px);transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease}
.gd-repo-card:hover{transform:translateY(-4px);border-color:rgba(0,220,255,0.45)!important;box-shadow:0 8px 20px rgba(0,220,255,0.12)}
.gd-repo-title{font-family:'Orbitron',monospace;font-size:.74rem;letter-spacing:.04em;color:#dff7ff;text-decoration:none;line-height:1.25;display:inline-block}
.gd-repo-title:hover{color:#00dcff;text-shadow:0 0 10px rgba(0,220,255,0.45)}
.gd-active-dot{width:6px;height:6px;border-radius:50%;background:#39ff14;box-shadow:0 0 8px rgba(57,255,20,.7);display:inline-block;animation:blink .9s linear infinite}

@media (max-width:640px){
  .gd-vitals-row{flex-wrap:nowrap;overflow-x:auto;padding-bottom:8px;scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch}
  .gd-vitals-row > *{flex:0 0 auto;min-width:170px;scroll-snap-align:start}
}

@media (max-width:500px){
  .gd-header-card{flex-direction:column;align-items:flex-start!important;gap:14px!important}
  .gd-header-ring{align-self:center}
}
`;

function calcDevScore(user, repos) {
  if (!user) return 0;
  const totalStars = repos.reduce((s, r) => s + (r.stargazers_count || 0), 0);
  const stars = Math.min(30, Math.floor(totalStars / 8));
  const followers = Math.min(20, Math.floor(Math.sqrt(user.followers || 0) * 2));
  const repoScore = Math.min(12, Math.floor((user.public_repos || 0) / 4));
  const ageYears = (Date.now() - new Date(user.created_at)) / (1000 * 60 * 60 * 24 * 365);
  const age = Math.min(14, Math.floor(ageYears * 2.5));
  const completeness = [user.bio, user.location, user.company, user.blog].filter(Boolean).length * 3;
  const activity = Math.min(10, repos.filter(r => {
    const d = new Date(r.pushed_at);
    return Date.now() - d < 90 * 24 * 60 * 60 * 1000;
  }).length);
  return Math.min(100, Math.max(10, Math.round(stars + followers + repoScore + age + completeness + activity)));
}

function extractTopLangs(repos) {
  const w = {};
  repos.forEach(r => {
    if (r.language) w[r.language] = (w[r.language] || 0) + (r.stargazers_count + 1);
  });
  const total = Object.values(w).reduce((a, b) => a + b, 0) || 1;
  return Object.entries(w).sort((a, b) => b[1] - a[1]).slice(0, 7).map(([lang, count]) => ({
    lang, pct: Math.round((count / total) * 100)
  }));
}

function extractCommitData(events) {
  const messages = [], hours = [];
  events.forEach(e => {
    if (e.type === "PushEvent" && e.payload?.commits) {
      e.payload.commits.forEach(c => {
        if (c.message) messages.push(c.message.split("\n")[0].slice(0, 80));
      });
      const h = new Date(e.created_at).getUTCHours();
      hours.push(h);
    }
  });
  return { messages: messages.slice(0, 20), hours };
}

function isValidGithubUsername(name) {
  if (!name || name.length > 39) return false;
  if (name.startsWith("-") || name.endsWith("-")) return false;
  return /^[A-Za-z0-9-]+$/.test(name);
}

function parseGithubUsername(input) {
  const raw = (input || "").trim();
  if (!raw) return "";

  const withoutAt = raw.startsWith("@") ? raw.slice(1) : raw;
  const looksLikeUrl = /^(https?:\/\/|www\.|github\.com\/)/i.test(withoutAt);

  if (looksLikeUrl) {
    try {
      const normalizedUrl = /^https?:\/\//i.test(withoutAt) ? withoutAt : `https://${withoutAt}`;
      const url = new URL(normalizedUrl);
      const host = url.hostname.toLowerCase();
      if (host !== "github.com" && host !== "www.github.com") return "";

      const firstSegment = url.pathname.split("/").filter(Boolean)[0] || "";
      return isValidGithubUsername(firstSegment) ? firstSegment : "";
    } catch {
      return "";
    }
  }

  const candidate = withoutAt.split("/").filter(Boolean)[0] || "";
  return isValidGithubUsername(candidate) ? candidate : "";
}

function isFounderLogin(login) {
  return (login || "").toLowerCase() === FOUNDER_HANDLE;
}

function getLoadingSequenceForUsername(username) {
  const login = (username || "").toLowerCase();
  if (login === FOUNDER_HANDLE) return FOUNDER_LOADING_STEPS;
  if (login === TORVALDS_HANDLE) return TORVALDS_LOADING_STEPS;
  return LOADING_STEPS;
}

function mapLoadingStep(rawStep, totalSteps) {
  const safeTotalSteps = Math.max(1, Number(totalSteps) || 1);
  const maxBackendStep = Math.max(1, LOADING_STEPS.length - 1);
  const clampedRaw = Math.max(0, Math.min(Number(rawStep) || 0, maxBackendStep));
  if (safeTotalSteps === 1) return 0;
  return Math.round((clampedRaw / maxBackendStep) * (safeTotalSteps - 1));
}

function getStarTier(totalStars) {
  const stars = Number(totalStars || 0);
  if (stars >= 1000) return "elite";
  if (stars >= 100) return "century";
  return null;
}

function isNightOwlProfile(bundle) {
  const avgHour = Number(bundle?.github?.avg_commit_hour);
  if (Number.isFinite(avgHour)) {
    return avgHour >= 22 || avgHour < 6;
  }
  const chronotypeTitle = (bundle?.aiData?.chronotype?.title || "").toLowerCase();
  return /midnight|night|evening|owl/.test(chronotypeTitle);
}

function getTierMeta(tier) {
  const key = (tier || "RISING").toUpperCase();
  if (key === "LEGENDARY") {
    return { icon: "♛", label: "LEGENDARY", badgeClass: "gd-badge-gold", headerClass: "gd-tier-header-legendary" };
  }
  if (key === "ELITE") {
    return { icon: "◈", label: "ELITE", badgeClass: "gd-badge-purple", headerClass: "gd-tier-header-elite" };
  }
  if (key === "VETERAN") {
    return { icon: "⬡", label: "VETERAN", badgeClass: "gd-badge-cyan", headerClass: "gd-tier-header-veteran" };
  }
  return { icon: "↑", label: "RISING", badgeClass: "gd-badge-green", headerClass: "gd-tier-header-rising" };
}

function inferTimezone(countryCode) {
  return TZ_MAP[String(countryCode || "").toUpperCase()] || "UTC";
}

function getAppBasePath() {
  const rawBase = String(import.meta.env.BASE_URL || "/");
  const withLeadingSlash = rawBase.startsWith("/") ? rawBase : `/${rawBase}`;
  return withLeadingSlash.endsWith("/") ? withLeadingSlash : `${withLeadingSlash}/`;
}

function buildAppPath(query = "") {
  const normalizedQuery = query
    ? (String(query).startsWith("?") ? String(query) : `?${String(query)}`)
    : "";
  return `${getAppBasePath()}${normalizedQuery}`;
}

function buildAppUrl(query = "") {
  const appPath = buildAppPath(query);
  if (typeof window === "undefined") return appPath;
  return `${window.location.origin}${appPath}`;
}

async function loadGitMapCartography() {
  if (GITMAP_WORLD_FEATURES_CACHE && GITMAP_COUNTRY_NAME_CACHE) {
    return { features: GITMAP_WORLD_FEATURES_CACHE, nameById: GITMAP_COUNTRY_NAME_CACHE };
  }

  const countriesObject = worldAtlas110m?.objects?.countries;
  if (!countriesObject) {
    throw new Error("Unable to load world atlas countries data.");
  }

  const features = topojsonFeature(worldAtlas110m, countriesObject).features || [];
  GITMAP_WORLD_FEATURES_CACHE = features;

  if (!GITMAP_COUNTRY_NAME_CACHE) {
    const nameMap = new Map();
    for (const feature of features) {
      const id = String(feature?.id || "");
      const name = String(feature?.properties?.name || "").trim();
      if (id && name) {
        nameMap.set(id, name);
      }
    }
    GITMAP_COUNTRY_NAME_CACHE = nameMap;
  }

  return { features: GITMAP_WORLD_FEATURES_CACHE, nameById: GITMAP_COUNTRY_NAME_CACHE };
}

function parseBattleParam(rawBattleParam) {
  const raw = (rawBattleParam || "").trim();
  if (!raw) return null;
  const lower = raw.toLowerCase();
  const splitterIndex = lower.indexOf("-vs-");
  if (splitterIndex <= 0) return null;
  const leftRaw = raw.slice(0, splitterIndex);
  const rightRaw = raw.slice(splitterIndex + 4);
  const left = parseGithubUsername(leftRaw);
  const right = parseGithubUsername(rightRaw);
  if (!left || !right) return null;
  return { left, right };
}

function battleSlug(leftUsername, rightUsername) {
  return `${leftUsername}-vs-${rightUsername}`;
}

function buildBattleFallbackAnalysis(leftBundle, rightBundle) {
  const leftScore = Number(leftBundle?.devScore || 0);
  const rightScore = Number(rightBundle?.devScore || 0);
  const leftCommits = Number(leftBundle?.github?.recentCommits || 0);
  const rightCommits = Number(rightBundle?.github?.recentCommits || 0);
  const leftStars = Number(leftBundle?.github?.totalStars || 0);
  const rightStars = Number(rightBundle?.github?.totalStars || 0);

  const reviewWinner = leftScore === rightScore
    ? "Code review is a dead tie."
    : (leftScore > rightScore
        ? `${leftBundle.username} wins code review with the sharper trait profile.`
        : `${rightBundle.username} wins code review with the sharper trait profile.`);

  const speedWinner = leftCommits === rightCommits
    ? "Shipping speed is effectively equal based on recent commits."
    : (leftCommits > rightCommits
        ? `${leftBundle.username} ships faster from recent commit velocity (${leftCommits} vs ${rightCommits}).`
        : `${rightBundle.username} ships faster from recent commit velocity (${rightCommits} vs ${leftCommits}).`);

  const maintainabilityWinner = leftStars === rightStars
    ? "Maintainability signal is tied in public validation."
    : (leftStars > rightStars
        ? `${leftBundle.username} appears more maintainable by public trust signal (${leftStars} stars).`
        : `${rightBundle.username} appears more maintainable by public trust signal (${rightStars} stars).`);

  return `${reviewWinner} ${speedWinner} ${maintainabilityWinner}`;
}

function normalizeAnalysisPayload(payload, fallbackUsername) {
  const githubPayload = payload?.github || {};
  const aiPayload = payload?.ai || {};
  const user = githubPayload.user || {};
  const normalizedUser = {
    ...user,
    login: user.login || fallbackUsername,
  };

  const normalizedRepos = Array.isArray(githubPayload.repos)
    ? githubPayload.repos.map((repo) => {
        const stars = repo?.stargazers_count ?? repo?.stars ?? 0;
        const forks = repo?.forks_count ?? repo?.forks ?? 0;
        const login = normalizedUser.login || fallbackUsername;
        return {
          ...repo,
          stargazers_count: stars,
          stars,
          forks_count: forks,
          forks,
          html_url: repo?.html_url || `https://github.com/${login}/${repo?.name || ""}`,
        };
      })
    : [];

  const totalStars = githubPayload.totalStars
    ?? githubPayload.total_stars
    ?? normalizedRepos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);

  const topLangs = Array.isArray(githubPayload.top_languages) && githubPayload.top_languages.length > 0
    ? githubPayload.top_languages.map((item) => ({
        lang: item.language || item.lang || "Unknown",
        pct: Math.round(Number(item.percentage ?? item.pct ?? 0)),
      }))
    : extractTopLangs(normalizedRepos);

  const normalizedEvents = Array.isArray(githubPayload.events)
    ? githubPayload.events.map((event) => {
        const commits = Array.isArray(event?.payload?.commits)
          ? event.payload.commits
              .map((commit) => ({
                message: typeof commit?.message === "string" ? commit.message : "",
              }))
              .filter((commit) => commit.message)
          : [];

        return {
          type: typeof event?.type === "string" ? event.type : "",
          created_at: typeof event?.created_at === "string" ? event.created_at : "",
          payload: { commits },
        };
      }).filter((event) => event.type && event.created_at)
    : (Array.isArray(githubPayload.recent_commit_timestamps)
        ? githubPayload.recent_commit_timestamps
            .filter((timestamp) => typeof timestamp === "string" && timestamp)
            .map((timestamp) => ({
              type: "PushEvent",
              created_at: timestamp,
              payload: { commits: [{ message: "commit" }] },
            }))
        : []);

  const normalizedGithub = {
    ...githubPayload,
    user: normalizedUser,
    repos: normalizedRepos,
    events: normalizedEvents,
    totalStars,
    recentCommits: githubPayload.recentCommits ?? (githubPayload.recent_commit_messages?.length || 0),
    contributions: Array.isArray(githubPayload.contributions)
      ? githubPayload.contributions.map((entry) => ({
          date: entry?.date || "",
          count: Number(entry?.count || 0),
        })).filter((entry) => entry.date)
      : [],
  };

  return {
    github: normalizedGithub,
    aiData: aiPayload,
    devScore: calcDevScore(normalizedUser, normalizedRepos),
    langs: topLangs,
    username: normalizedUser.login || fallbackUsername,
  };
}

function getWinner(leftValue, rightValue) {
  const left = Number(leftValue || 0);
  const right = Number(rightValue || 0);
  if (left === right) return "tie";
  return left > right ? "left" : "right";
}

async function fetchContributionData(username) {
  try {
    const fallbackRes = await fetch(`https://github-contributions-api.jogruber.de/v4/${username}`);
    if (!fallbackRes.ok) return [];
    const fallbackJson = await fallbackRes.json();
    if (!Array.isArray(fallbackJson?.contributions)) return [];
    return fallbackJson.contributions.map((entry) => ({
      date: entry.date,
      count: Number(entry.count || 0),
    })).filter((item) => item.date);
  } catch {
    return [];
  }
}

function buildContributionSeries(rawContributions) {
  const byDate = new Map();
  for (const item of rawContributions || []) {
    byDate.set(item.date, Number(item.count || 0));
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - 363);

  const series = [];
  for (let i = 0; i < 364; i += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    const key = day.toISOString().slice(0, 10);
    series.push({
      date: key,
      count: byDate.get(key) || 0,
    });
  }
  return series;
}

async function resolveContributionSeries(username, existingContributions = []) {
  const preloaded = Array.isArray(existingContributions)
    ? existingContributions.map((entry) => ({
        date: entry?.date || "",
        count: Number(entry?.count || 0),
      })).filter((entry) => entry.date)
    : [];

  if (preloaded.length > 0) {
    return buildContributionSeries(preloaded);
  }

  const fetched = await fetchContributionData(username);
  if (fetched.length > 0) {
    return buildContributionSeries(fetched);
  }

  return [];
}

async function withContributionSeries(bundle) {
  const username = bundle?.username || bundle?.github?.user?.login;
  if (!username) return bundle;

  const contributions = await resolveContributionSeries(username, bundle?.github?.contributions || []);
  return {
    ...bundle,
    github: {
      ...bundle.github,
      contributions,
    },
  };
}

function formatContributionDate(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    month: "long",
    day: "2-digit",
    year: "numeric",
  });
}

function truncateText(text, max = 80) {
  if (!text) return "No description provided.";
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}...`;
}

function getDaysAgo(dateString) {
  if (!dateString) return null;
  const pushed = new Date(dateString);
  if (Number.isNaN(pushed.getTime())) return null;
  const now = new Date();
  const diffMs = now.getTime() - pushed.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

function AnimatedCounter({ target, delay = 0, duration = 1600, ticker = false }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const finalTarget = Number(target) || 0;
    let rafId = null;
    const t = setTimeout(() => {
      let start = null;
      const tickerWindow = 200;
      const tickerStart = Math.max(duration - tickerWindow, 0);
      const digitCount = Math.max(1, String(Math.floor(Math.abs(finalTarget))).length);
      const maxRandom = Math.max(9, Math.pow(10, digitCount) - 1);
      const step = ts => {
        if (!start) start = ts;
        const elapsed = ts - start;
        if (ticker && elapsed >= tickerStart && elapsed < duration) {
          setVal(Math.floor(Math.random() * (maxRandom + 1)));
        } else {
          const p = Math.min(elapsed / duration, 1);
          const e = 1 - Math.pow(1 - p, 4);
          setVal(Math.floor(e * finalTarget));
        }
        if (elapsed < duration) {
          rafId = requestAnimationFrame(step);
        } else {
          setVal(finalTarget);
        }
      };
      rafId = requestAnimationFrame(step);
    }, delay);
    return () => {
      clearTimeout(t);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [target, delay, duration, ticker]);
  return <>{val.toLocaleString()}</>;
}

function ScoreRing({ score, specialMode = null, percentileText = "", percentileColor = null }) {
  const r = 54, circ = 2 * Math.PI * r;
  const [off, setOff] = useState(circ);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => {
      let s = null;
      const targetProgress = Math.max(0, Math.min(score / 100, 1));
      const step = ts => {
        if (!s) s = ts;
        const p = Math.min((ts - s) / 2000, 1);
        const e = 1 - Math.pow(1 - p, 3);
        const currentProgress = targetProgress * e;
        setProgress(currentProgress);
        setOff(circ * (1 - currentProgress));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, 400);
    return () => clearTimeout(t);
  }, [score, circ]);
  const useGold = specialMode === "gold";
  const scoreColor = useGold
    ? "#FFD700"
    : (score >= 80 ? "#39ff14" : score >= 60 ? "#00dcff" : score >= 40 ? "#ffb300" : "#ff4545");
  const ringColor = useGold ? "#FFD700" : "#00dcff";
  const outerTrack = useGold ? "rgba(255,215,0,0.09)" : "rgba(0,220,255,0.07)";
  const innerTrack = useGold ? "rgba(255,215,0,0.05)" : "rgba(0,220,255,0.04)";
  const dropShadow = useGold ? "drop-shadow(0 0 18px rgba(255,215,0,0.95))" : "drop-shadow(0 0 10px rgba(0,220,255,0.95))";
  const sparkFill = useGold ? "#ffe27a" : "#c6ffff";
  const sparkShadow = useGold ? "drop-shadow(0 0 14px rgba(255,215,0,1))" : "drop-shadow(0 0 8px rgba(0,220,255,1))";
  const sparkAngle = progress * 2 * Math.PI;
  const sparkX = 65 + r * Math.cos(sparkAngle);
  const sparkY = 65 + r * Math.sin(sparkAngle);
  const labelColor = useGold ? "rgba(255,215,0,0.45)" : "rgba(0,220,255,0.4)";
  const resolvedPercentileColor = percentileColor || (useGold ? "rgba(255,215,0,0.7)" : "rgba(0,220,255,0.7)");
  return (
    <div style={{ position: "relative", width: 130, height: 130, flexShrink: 0 }}>
      <svg width="130" height="130" style={{ transform: "rotate(-90deg)", position: "absolute", inset: 0 }}>
        <circle cx="65" cy="65" r={r} fill="none" stroke={outerTrack} strokeWidth="7" />
        <circle cx="65" cy="65" r={r} fill="none" stroke={innerTrack} strokeWidth="7"
          strokeDasharray="4 8" />
        <circle cx="65" cy="65" r={r} fill="none" stroke={ringColor} strokeWidth="11" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={off}
          style={{ filter: "blur(4px)", opacity: 0.55 }} />
        <circle cx="65" cy="65" r={r} fill="none" stroke={ringColor} strokeWidth="7" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={off}
          style={{ filter: dropShadow }} />
        {progress > 0.002 && (
          <circle cx={sparkX} cy={sparkY} r="3.2" fill={sparkFill}
            style={{ filter: sparkShadow }} />
        )}
        <circle cx="65" cy="65" r="40" fill="none" stroke={innerTrack} strokeWidth="1" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: "Orbitron,monospace", fontSize: "1.75rem", fontWeight: 900, color: scoreColor, lineHeight: 1, textShadow: `0 0 12px ${scoreColor}88` }}>
          <AnimatedCounter target={score} delay={500} duration={1800} />
        </div>
        <div style={{ fontFamily: "Share Tech Mono,monospace", fontSize: percentileText ? "0.5rem" : "0.55rem", color: labelColor, letterSpacing: "0.2em", marginTop: 3 }}>DEV SCORE</div>
        {percentileText && (
          <div style={{ fontFamily: "Share Tech Mono,monospace", fontSize: "0.5rem", color: resolvedPercentileColor, letterSpacing: "0.1em", marginTop: 2 }}>
            {percentileText}
          </div>
        )}
      </div>
    </div>
  );
}

function SkillBar({ lang, pct, delay = 0 }) {
  const color = getLangColor(lang);
  return (
    <div className={`anim-fade delay-${delay}`} style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}88`, flexShrink: 0 }} />
          <span style={{ fontFamily: "Share Tech Mono,monospace", fontSize: "0.75rem", color: "#c8e8ff" }}>{lang}</span>
        </div>
        <span style={{ fontFamily: "Orbitron,monospace", fontSize: "0.65rem", color: "rgba(0,220,255,0.55)" }}>{pct}%</span>
      </div>
      <div style={{ height: 5, background: "rgba(0,220,255,0.07)", borderRadius: 3, overflow: "hidden", position: "relative" }}>
        <div style={{
          height: "100%", borderRadius: 3,
          background: `linear-gradient(90deg, ${color}99, ${color})`,
          boxShadow: `0 0 6px ${color}66`,
          width: `${pct}%`,
          animation: `bar-expand 1.2s cubic-bezier(.2,.8,.2,1) ${delay * 100}ms both`,
          "--w": `${pct}%`,
        }} />
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, delay, sub, enterIndex = 0, ticker = false }) {
  return (
    <div className="gd-card gd-hover-lift gd-enter-scan"
      style={{
        padding: "16px 14px",
        textAlign: "center",
        flex: 1,
        minWidth: 0,
        opacity: 0,
        animation: `card-rise .55s cubic-bezier(.2,.8,.2,1) ${320 + enterIndex * 80}ms forwards`,
        "--scan-delay": `${enterIndex * 150}ms`,
      }}>
      <div className="gd-section-label" style={{ justifyContent: "center", marginBottom: 8 }}>{label}</div>
      <div className="stat-number anim-count" style={{ fontSize: "1.5rem", color: "#00dcff", textShadow: "0 0 12px rgba(0,220,255,0.4)" }}>
        {typeof value === "number" ? <AnimatedCounter target={value} delay={delay * 80} ticker={ticker} /> : value}
      </div>
      {sub && <div style={{ fontFamily: "Share Tech Mono,monospace", fontSize: "0.58rem", color: "rgba(0,220,255,0.3)", letterSpacing: "0.1em", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function TraitsRadar({ traits }) {
  if (!traits) return null;
  const data = [
    { trait: "Creativity", value: traits.creativity || 50 },
    { trait: "Discipline", value: traits.discipline || 50 },
    { trait: "Collab", value: traits.collaboration || 50 },
    { trait: "Boldness", value: traits.boldness || 50 },
    { trait: "Depth", value: traits.depth || 50 },
  ];
  return (
    <ResponsiveContainer width="100%" height={200}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="64%" margin={{ top: 8, right: 26, bottom: 8, left: 26 }}>
        <PolarGrid stroke="rgba(0,220,255,0.1)" />
        <PolarAngleAxis dataKey="trait" tick={{ fill: "rgba(0,220,255,0.45)", fontSize: 9, fontFamily: "Share Tech Mono,monospace" }} />
        <Radar dataKey="value" stroke="#00dcff" fill="#00dcff" fillOpacity={0.12} strokeWidth={1.5} dot={{ fill: "#00dcff", r: 3 }} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

function ContributionHeatmap({ contributions }) {
  const tooltipWrapRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);

  const normalizedInput = Array.isArray(contributions)
    ? contributions.map((entry) => ({
        date: entry?.date || "",
        count: Number(entry?.count || 0),
      })).filter((entry) => entry.date)
    : [];

  if (normalizedInput.length === 0) {
    return (
      <div style={{ color: "rgba(200,232,255,0.42)", fontFamily: "Share Tech Mono,monospace", fontSize: "0.72rem" }}>
        Contribution history unavailable for this profile.
      </div>
    );
  }

  const safeContributions = buildContributionSeries(normalizedInput);

  const weeks = [];
  for (let w = 0; w < 52; w += 1) {
    weeks.push(safeContributions.slice(w * 7, w * 7 + 7));
  }

  const monthLabels = [];
  let previousMonthKey = "";
  for (let weekIndex = 0; weekIndex < weeks.length; weekIndex += 1) {
    const firstDay = weeks[weekIndex][0];
    if (!firstDay?.date) continue;
    const date = new Date(`${firstDay.date}T00:00:00`);
    const monthLabel = date.toLocaleDateString(undefined, { month: "short" });
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
    if (weekIndex === 0 || monthKey !== previousMonthKey) {
      monthLabels.push({ weekIndex, label: monthLabel, key: monthKey });
      previousMonthKey = monthKey;
    }
  }

  const getCellColor = (count) => {
    if (count <= 0) return "rgba(0,220,255,0.06)";
    if (count <= 3) return "rgba(0,220,255,0.2)";
    if (count <= 9) return "rgba(0,220,255,0.45)";
    if (count <= 19) return "rgba(0,220,255,0.7)";
    return "#00dcff";
  };

  const placeTooltip = (event, day) => {
    const wrapRect = tooltipWrapRef.current?.getBoundingClientRect();
    if (!wrapRect) return;
    setTooltip({
      text: `${day.count} commits on ${formatContributionDate(day.date)}`,
      x: Math.max(8, Math.min(event.clientX - wrapRect.left + 14, wrapRect.width - 230)),
      y: Math.max(8, event.clientY - wrapRect.top - 34),
    });
  };

  let totalContributions = 0;
  let longestStreak = 0;
  let streakRun = 0;
  for (const day of safeContributions) {
    totalContributions += day.count;
    if (day.count >= 1) {
      streakRun += 1;
    } else {
      longestStreak = Math.max(longestStreak, streakRun);
      streakRun = 0;
    }
  }
  longestStreak = Math.max(longestStreak, streakRun);

  let currentStreak = 0;
  for (let i = safeContributions.length - 1; i >= 0; i -= 1) {
    if (safeContributions[i].count >= 1) currentStreak += 1;
    else break;
  }

  const legendColors = [
    "rgba(0,220,255,0.06)",
    "rgba(0,220,255,0.2)",
    "rgba(0,220,255,0.45)",
    "rgba(0,220,255,0.7)",
    "#00dcff",
  ];

  const dayLabels = [
    { row: 1, label: "Mon" },
    { row: 3, label: "Wed" },
    { row: 5, label: "Fri" },
  ];

  return (
    <div>
      <div ref={tooltipWrapRef} style={{ position: "relative", overflowX: "auto", paddingBottom: 6 }}>
        <div style={{ minWidth: 760, width: "fit-content" }}>
          <div style={{ marginLeft: 54, marginBottom: 6, position: "relative", height: 20 }}>
            {monthLabels.map((month) => (
              <div
                key={`${month.key}-${month.weekIndex}`}
                style={{
                  position: "absolute",
                  left: month.weekIndex * 13,
                  fontFamily: "Share Tech Mono,monospace",
                  fontSize: "0.72rem",
                  color: "rgba(200,232,255,0.86)",
                }}
              >
                {month.label}
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div style={{ width: 44, display: "grid", gridTemplateRows: "repeat(7, 11px)", rowGap: 2 }}>
              {Array.from({ length: 7 }).map((_, row) => {
                const label = dayLabels.find((entry) => entry.row === row)?.label || "";
                return (
                  <div
                    key={`day-row-${row}`}
                    style={{
                      fontFamily: "Share Tech Mono,monospace",
                      fontSize: "0.66rem",
                      color: "rgba(200,232,255,0.86)",
                      lineHeight: "11px",
                    }}
                  >
                    {label}
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: 2 }}>
              {weeks.map((week, weekIndex) => (
                <div key={`week-${weekIndex}`} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {week.map((day, dayIndex) => {
                    const flatIndex = weekIndex * 7 + dayIndex;
                    const isRecent = flatIndex >= safeContributions.length - 28;
                    return (
                      <div
                        key={day.date}
                        onMouseEnter={(event) => placeTooltip(event, day)}
                        onMouseMove={(event) => placeTooltip(event, day)}
                        onMouseLeave={() => setTooltip(null)}
                        style={{
                          width: 11,
                          height: 11,
                          borderRadius: 2,
                          background: getCellColor(day.count),
                          boxShadow: isRecent && day.count > 0 ? "0 0 8px rgba(0,220,255,0.35)" : "none",
                          border: "1px solid rgba(0,220,255,0.08)",
                          transition: "transform .12s ease, box-shadow .2s ease",
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 12, marginLeft: 54, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <span style={{ fontFamily: "Rajdhani,sans-serif", fontSize: "0.72rem", color: "rgba(200,232,255,0.6)" }}>Learn how we count contributions</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontFamily: "Rajdhani,sans-serif", fontSize: "0.72rem", color: "rgba(200,232,255,0.7)" }}>Less</span>
              {legendColors.map((color, index) => (
                <span
                  key={`legend-${index}`}
                  style={{ width: 11, height: 11, borderRadius: 2, background: color, border: "1px solid rgba(0,220,255,0.08)", display: "inline-block" }}
                />
              ))}
              <span style={{ fontFamily: "Rajdhani,sans-serif", fontSize: "0.72rem", color: "rgba(200,232,255,0.7)" }}>More</span>
            </div>
          </div>
        </div>

        {tooltip && (
          <div
            style={{
              position: "absolute",
              left: tooltip.x,
              top: tooltip.y,
              pointerEvents: "none",
              background: "rgba(6,11,18,0.96)",
              border: "1px solid rgba(0,220,255,0.28)",
              color: "#c8e8ff",
              fontFamily: "Share Tech Mono,monospace",
              fontSize: "0.62rem",
              padding: "6px 8px",
              borderRadius: 4,
              whiteSpace: "nowrap",
              zIndex: 30,
              boxShadow: "0 0 12px rgba(0,220,255,0.2)",
            }}
          >
            {tooltip.text}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
        <span className="gd-badge gd-badge-cyan">TOTAL {totalContributions} IN LAST YEAR</span>
        <span className="gd-badge gd-badge-purple">LONGEST STREAK {longestStreak} DAYS</span>
        <span className="gd-badge gd-badge-green">CURRENT STREAK {currentStreak} DAYS</span>
      </div>
    </div>
  );
}

function FounderProtocol({ user, devScore, totalStars, repos, contributions }) {
  const safeRepos = Array.isArray(repos) ? repos : [];
  const hottestRepo = safeRepos.reduce((top, repo) => {
    if (!top) return repo;
    return (repo.stargazers_count || 0) > (top.stargazers_count || 0) ? repo : top;
  }, null);
  const activeRepos30d = safeRepos.filter((repo) => {
    const days = getDaysAgo(repo.pushed_at);
    return days !== null && days <= 30;
  }).length;
  const yearlyContrib = (Array.isArray(contributions) ? contributions : []).reduce((sum, day) => sum + (day.count || 0), 0);
  const missionState = devScore >= 85 ? "NETWORK DOMINANCE" : devScore >= 70 ? "ACCELERATION PHASE" : "CORE BUILD CYCLE";
  const founderHash = `${String(user.id || 0).toString(16).toUpperCase()}-${Math.round(devScore).toString(16).toUpperCase()}-${String(totalStars % 4096).toString(16).toUpperCase().padStart(3, "0")}`;

  return (
    <div
      className="gd-founder-card gd-enter-scan"
      style={{
        padding: "16px 18px",
        marginBottom: 16,
        opacity: 0,
        animation: "card-rise .55s cubic-bezier(.2,.8,.2,1) 420ms forwards",
        "--scan-delay": "140ms",
      }}
    >
      <div className="gd-founder-core">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="gd-section-label" style={{ color: "rgba(255,179,0,0.72)" }}>FOUNDER PROTOCOL // EXCLUSIVE</div>
          <div className="gd-founder-title">AANISHNITHIN07 CONFIRMED AS ORIGIN NODE</div>
          <div className="gd-founder-note">
            Founder handshake accepted. Rendering command-layer telemetry unavailable to standard profiles.
          </div>
        </div>
        <div className="gd-founder-sigil-wrap">
          <div className="gd-founder-ring" />
          <div className="gd-founder-sigil mono">ROOT</div>
        </div>
      </div>

      <div className="gd-founder-grid">
        <div className="gd-founder-chip">
          <div className="gd-founder-chip-label">MISSION STATE</div>
          <div className="gd-founder-chip-value">{missionState}</div>
        </div>
        <div className="gd-founder-chip">
          <div className="gd-founder-chip-label">IMPACT STARS</div>
          <div className="gd-founder-chip-value">{Number(totalStars || 0).toLocaleString()}</div>
        </div>
        <div className="gd-founder-chip">
          <div className="gd-founder-chip-label">ACTIVE REPOS /30D</div>
          <div className="gd-founder-chip-value">{activeRepos30d}</div>
        </div>
        <div className="gd-founder-chip">
          <div className="gd-founder-chip-label">YEARLY COMMITS</div>
          <div className="gd-founder-chip-value">{Number(yearlyContrib).toLocaleString()}</div>
        </div>
        <div className="gd-founder-chip" style={{ gridColumn: "1 / -1" }}>
          <div className="gd-founder-chip-label">PRIMARY COMMAND REPOSITORY</div>
          <div className="gd-founder-chip-value">{hottestRepo ? `${hottestRepo.name} // ${hottestRepo.stargazers_count || 0} stars` : "No repository telemetry available"}</div>
        </div>
      </div>

      <div style={{ marginTop: 10, fontFamily: "Share Tech Mono,monospace", fontSize: "0.58rem", color: "rgba(255,179,0,0.6)", letterSpacing: "0.12em", position: "relative", zIndex: 1 }}>
        FOUNDER HASH :: {founderHash}
      </div>
    </div>
  );
}

function TopRepositories({ repos, username }) {
  const topRepos = [...(Array.isArray(repos) ? repos : [])]
    .sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0))
    .slice(0, 6);

  if (topRepos.length === 0) {
    return (
      <div style={{ color: "rgba(200,232,255,0.42)", fontFamily: "Share Tech Mono,monospace", fontSize: "0.72rem" }}>
        No repository metadata available for @{username || "this user"}.
      </div>
    );
  }

  return (
    <div className="gd-repo-grid">
      {topRepos.map((repo, idx) => {
        const language = repo.language || "Unknown";
        const langColor = getLangColor(language);
        const stars = repo.stargazers_count || 0;
        const forks = repo.forks_count || 0;
        const daysAgo = getDaysAgo(repo.pushed_at);
        const isHiddenGem = stars === 0 && forks >= 5;
        const isAcclaimed = stars >= 100;
        const isActive = daysAgo !== null && daysAgo <= 7;

        return (
          <div
            key={repo.id || repo.full_name || repo.name}
            className="gd-card gd-repo-card gd-enter-scan"
            style={{
              borderTop: `2px solid ${langColor}`,
              "--scan-delay": `${idx * 150}ms`,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
              <a className="gd-repo-title" href={repo.html_url} target="_blank" rel="noreferrer">
                {repo.name}
              </a>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end" }}>
                {isHiddenGem && <span className="gd-badge gd-badge-gold">HIDDEN GEM</span>}
                {isAcclaimed && <span className="gd-badge gd-badge-green">ACCLAIMED</span>}
                {isActive && (
                  <span className="gd-badge gd-badge-green" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <span className="gd-active-dot" />ACTIVE
                  </span>
                )}
              </div>
            </div>

            <p style={{ fontSize: "0.78rem", color: "rgba(200,232,255,0.62)", lineHeight: 1.45, minHeight: 46, marginBottom: 10 }}>
              {truncateText(repo.description, 80)}
            </p>

            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: langColor, boxShadow: `0 0 8px ${langColor}99`, flexShrink: 0 }} />
              <span style={{ fontFamily: "Share Tech Mono,monospace", fontSize: "0.68rem", color: "rgba(0,220,255,0.66)" }}>{language}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 8, fontFamily: "Share Tech Mono,monospace", fontSize: "0.68rem", color: "rgba(200,232,255,0.72)" }}>
              <span>⭐ {stars}</span>
              <span>🍴 {forks}</span>
            </div>

            <div style={{ fontFamily: "Share Tech Mono,monospace", fontSize: "0.62rem", color: "rgba(0,220,255,0.5)" }}>
              Last pushed: {daysAgo === null ? "Unknown" : `${daysAgo} day${daysAgo === 1 ? "" : "s"} ago`}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DNASequence({ seq, goldMode = false }) {
  const chars = (seq || "4F6E3A1D9C2B8E7F").split("");
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    setVisibleCount(0);
    let next = 0;
    const timer = setInterval(() => {
      next += 1;
      setVisibleCount(Math.min(next, chars.length));
      if (next >= chars.length) clearInterval(timer);
    }, 60);
    return () => clearInterval(timer);
  }, [seq, chars.length]);

  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center" }}>
      {chars.map((c, i) => (
        (() => {
          const color = goldMode ? "#FFD700" : (i % 2 === 0 ? "#00dcff" : "#b347ea");
          const shadow = goldMode ? "0 0 10px rgba(255,215,0,0.7)" : (i % 2 === 0 ? "0 0 8px rgba(0,220,255,0.5)" : "0 0 8px rgba(179,71,234,0.5)");
          return (
        <span key={i} style={{
          fontFamily: "Share Tech Mono,monospace", fontSize: "0.75rem",
          opacity: i < visibleCount ? 1 : 0,
          color,
          textShadow: shadow,
          transform: i < visibleCount ? "translateY(0) scale(1)" : "translateY(4px) scale(0.8)",
          transition: "opacity .08s linear",
          animation: i < visibleCount ? "dna-lock .25s ease both" : "none",
          "--dna-final": color,
          "--dna-final-shadow": shadow,
        }}>{c}</span>
          );
        })()
      ))}
    </div>
  );
}

function BackgroundCanvas({ attractRef = null, attractActive = false }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const attractActiveRef = useRef(attractActive);
  const attractPointRef = useRef(null);

  useEffect(() => {
    attractActiveRef.current = attractActive;
  }, [attractActive]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const state = { width: 1, height: 1, dpr: 1 };
    const stars = [];
    const wisps = [];
    const comets = [];
    const waveSeeds = [
      { speed: 0.00014, freq: 0.008, amp: 0.028, phase: Math.random() * Math.PI * 2, color: "rgba(0,220,255,0.08)" },
      { speed: 0.00011, freq: 0.006, amp: 0.035, phase: Math.random() * Math.PI * 2, color: "rgba(179,71,234,0.08)" },
      { speed: 0.00009, freq: 0.007, amp: 0.03, phase: Math.random() * Math.PI * 2, color: "rgba(57,255,20,0.06)" },
    ];
    let nextComet = performance.now() + 12000 + Math.random() * 8000;
    let prevTs = performance.now();

    const wispPalette = [
      ["rgba(0,220,255,0.22)", "rgba(0,220,255,0)"],
      ["rgba(179,71,234,0.2)", "rgba(179,71,234,0)"],
      ["rgba(57,255,20,0.14)", "rgba(57,255,20,0)"],
      ["rgba(255,179,0,0.16)", "rgba(255,179,0,0)"],
    ];
    const starColors = ["#00dcff", "#89e8ff", "#b347ea", "#39ff14"];

    const createStar = () => {
      const layer = Math.random();
      return {
        x: Math.random() * state.width,
        y: Math.random() * state.height,
        size: 0.6 + layer * 1.8,
        baseAlpha: 0.16 + Math.random() * 0.5,
        twinkle: 0.0012 + Math.random() * 0.0025,
        phase: Math.random() * Math.PI * 2,
        driftX: (Math.random() - 0.5) * (0.04 + layer * 0.08),
        driftY: -0.02 - Math.random() * (0.03 + layer * 0.06),
        color: starColors[Math.floor(Math.random() * starColors.length)],
      };
    };

    const createWisp = (index) => {
      const palette = wispPalette[index % wispPalette.length];
      return {
        anchorX: 0.1 + Math.random() * 0.8,
        anchorY: 0.1 + Math.random() * 0.8,
        radius: 0.2 + Math.random() * 0.22,
        driftX: 0.00004 + Math.random() * 0.00007,
        driftY: 0.00003 + Math.random() * 0.00006,
        phase: Math.random() * Math.PI * 2,
        inner: palette[0],
        outer: palette[1],
      };
    };

    const fillBase = () => {
      const bg = ctx.createLinearGradient(0, 0, state.width, state.height);
      bg.addColorStop(0, "rgba(5,11,22,0.95)");
      bg.addColorStop(0.45, "rgba(7,12,28,0.94)");
      bg.addColorStop(1, "rgba(5,10,18,0.96)");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, state.width, state.height);
    };

    const updateAttractPoint = () => {
      if (!attractRef?.current) {
        attractPointRef.current = null;
        return;
      }
      const rect = attractRef.current.getBoundingClientRect();
      attractPointRef.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    };

    const resizeCanvas = () => {
      const width = Math.max(1, Math.floor(window.innerWidth));
      const height = Math.max(1, Math.floor(window.innerHeight));
      const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
      state.width = width;
      state.height = height;
      state.dpr = dpr;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const targetStars = Math.max(80, Math.min(170, Math.floor((width * height) / 13000)));
      while (stars.length < targetStars) stars.push(createStar());
      if (stars.length > targetStars) stars.length = targetStars;

      if (wisps.length === 0) {
        for (let i = 0; i < 4; i += 1) wisps.push(createWisp(i));
      }
    };

    const drawWisps = (ts) => {
      for (let i = 0; i < wisps.length; i += 1) {
        const w = wisps[i];
        const cx = w.anchorX * state.width + Math.sin(ts * w.driftX + w.phase) * state.width * 0.16;
        const cy = w.anchorY * state.height + Math.cos(ts * w.driftY + w.phase * 1.2) * state.height * 0.14;
        const radius = Math.min(state.width, state.height) * (w.radius + Math.sin(ts * 0.00012 + w.phase) * 0.03);
        const grad = ctx.createRadialGradient(cx, cy, radius * 0.12, cx, cy, radius);
        grad.addColorStop(0, w.inner);
        grad.addColorStop(1, w.outer);
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    };

    const drawWaves = (ts) => {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      for (let i = 0; i < waveSeeds.length; i += 1) {
        const seed = waveSeeds[i];
        const baseY = state.height * (0.2 + i * 0.22 + Math.sin(ts * seed.speed + seed.phase) * 0.02);
        ctx.beginPath();
        ctx.moveTo(0, state.height);
        for (let x = 0; x <= state.width; x += Math.max(16, state.width / 32)) {
          const y = baseY + Math.sin(x * seed.freq + ts * seed.speed * 18 + seed.phase) * state.height * seed.amp;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(state.width, state.height);
        ctx.closePath();
        const grad = ctx.createLinearGradient(0, baseY - 80, 0, state.height);
        grad.addColorStop(0, seed.color);
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grad;
        ctx.fill();
      }
      ctx.restore();
    };

    const drawAttractAura = (ts) => {
      if (!attractActiveRef.current || !attractPointRef.current) return;
      const p = attractPointRef.current;
      const pulse = 0.55 + Math.sin(ts * 0.009) * 0.2;
      const radius = 90 + pulse * 36;
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
      grad.addColorStop(0, "rgba(0,220,255,0.2)");
      grad.addColorStop(0.6, "rgba(0,220,255,0.06)");
      grad.addColorStop(1, "rgba(0,220,255,0)");
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const updateAndDrawStars = (ts, dt) => {
      const attractPoint = attractPointRef.current;
      for (let i = 0; i < stars.length; i += 1) {
        const s = stars[i];
        s.x += s.driftX * dt;
        s.y += s.driftY * dt;

        if (attractActiveRef.current && attractPoint) {
          const dx = attractPoint.x - s.x;
          const dy = attractPoint.y - s.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 1 && dist < 240) {
            const pull = (1 - dist / 240) * 0.38;
            s.x += (dx / dist) * pull * dt;
            s.y += (dy / dist) * pull * dt;
          }
        }

        if (s.y < -6) s.y = state.height + 6;
        if (s.y > state.height + 6) s.y = -6;
        if (s.x < -6) s.x = state.width + 6;
        if (s.x > state.width + 6) s.x = -6;

        const alpha = s.baseAlpha * (0.62 + 0.38 * Math.sin(ts * s.twinkle + s.phase));
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
        if (s.size > 1.6) {
          ctx.globalAlpha = alpha * 0.35;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size * 2.8, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    };

    const drawComets = (ts) => {
      for (let i = comets.length - 1; i >= 0; i -= 1) {
        const comet = comets[i];
        const life = (ts - comet.start) / comet.duration;
        if (life >= 1) {
          comets.splice(i, 1);
          continue;
        }
        const x = comet.startX - comet.travelX * life;
        const y = comet.startY + comet.travelY * life;
        const tailX = x + comet.tail;
        const tailY = y - comet.tail * 0.4;
        const grad = ctx.createLinearGradient(x, y, tailX, tailY);
        grad.addColorStop(0, `rgba(255,255,255,${(1 - life) * 0.9})`);
        grad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.save();
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();
        ctx.restore();
      }
    };

    const drawVignette = () => {
      const vignette = ctx.createRadialGradient(
        state.width / 2,
        state.height / 2,
        Math.min(state.width, state.height) * 0.2,
        state.width / 2,
        state.height / 2,
        Math.max(state.width, state.height) * 0.75
      );
      vignette.addColorStop(0, "rgba(5,10,18,0)");
      vignette.addColorStop(1, "rgba(5,10,18,0.84)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, state.width, state.height);
    };

    resizeCanvas();
    updateAttractPoint();

    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
      updateAttractPoint();
    });
    resizeObserver.observe(document.documentElement);

    const tick = (ts) => {
      const dt = Math.min((ts - prevTs) / 16.67, 2.2);
      prevTs = ts;

      if (ts >= nextComet) {
        comets.push({
          start: ts,
          duration: 1100 + Math.random() * 700,
          startX: state.width + 80 + Math.random() * 180,
          startY: Math.random() * state.height * 0.35,
          travelX: state.width * (0.9 + Math.random() * 0.4),
          travelY: state.height * (0.3 + Math.random() * 0.2),
          tail: 70 + Math.random() * 70,
        });
        nextComet = ts + 12000 + Math.random() * 10000;
      }

      updateAttractPoint();
      ctx.clearRect(0, 0, state.width, state.height);
      fillBase();
      drawWisps(ts);
      drawWaves(ts);
      updateAndDrawStars(ts, dt);
      drawAttractAura(ts);
      drawComets(ts);
      drawVignette();

      animationRef.current = requestAnimationFrame(tick);
    };

    animationRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      resizeObserver.disconnect();
    };
  }, [attractRef]);

  return <canvas ref={canvasRef} className="gd-bg-canvas" aria-hidden="true" />;
}

function LandingPage({ onAnalyze, ultraMode = false }) {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [blink, setBlink] = useState(true);
  const [inputError, setInputError] = useState("");
  const [isInputFocused, setIsInputFocused] = useState(false);
  const inputRef = useRef(null);
  const recentProfiles = ["torvalds", "gaearon", "antirez"];
  useEffect(() => { const t = setInterval(() => setBlink(b => !b), 500); return () => clearInterval(t); }, []);
  const handle = () => {
    const parsedUsername = parseGithubUsername(username);
    if (!parsedUsername) {
      setInputError("Enter a valid GitHub username or profile URL");
      return;
    }
    setInputError("");
    setLoading(true);
    setUsername(parsedUsername);
    onAnalyze(parsedUsername);
  };
  return (
    <div className={`gd-root${ultraMode ? " gd-ultra-mode" : ""}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "40px 20px", position: "relative", zIndex: 2 }}>
      <BackgroundCanvas attractRef={inputRef} attractActive={isInputFocused} />
      <div className="gd-scanlines" />

      <div className="anim-fade" style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ fontFamily: "Share Tech Mono,monospace", fontSize: "0.65rem", letterSpacing: "0.3em", color: "rgba(0,220,255,0.4)", marginBottom: 16 }}>
          // DEVELOPER INTELLIGENCE SYSTEM v2.0
        </div>
        <h1 className="orb gd-glitch" style={{ fontSize: "clamp(3rem,10vw,6rem)", fontWeight: 900, color: "#00dcff", letterSpacing: "0.08em", lineHeight: 1, textShadow: "0 0 30px rgba(0,220,255,0.4)" }}>
          GIT<span style={{ color: "#b347ea", textShadow: "0 0 30px rgba(179,71,234,0.5)" }}>DNA</span>
        </h1>
        <div style={{ fontFamily: "Rajdhani,sans-serif", fontSize: "1.1rem", color: "rgba(200,232,255,0.5)", letterSpacing: "0.12em", marginTop: 10, fontWeight: 300 }}>
          YOUR CODE HAS A FINGERPRINT. WE READ IT.
        </div>
      </div>

      <div className="anim-up delay-3" style={{ width: "100%", maxWidth: 520 }}>
        <div className="gd-card" style={{ padding: "28px 28px 24px" }}>
          <div className="gd-section-label">INITIALIZE SCAN</div>
          <div style={{ position: "relative", marginBottom: 14 }}>
            <div style={{ fontFamily: "Share Tech Mono,monospace", fontSize: "0.75rem", color: "rgba(0,220,255,0.5)", marginBottom: 8 }}>
              root@gitdna:~$ scan_developer
            </div>
            <div style={{ display: "flex", gap: 0, alignItems: "stretch" }}>
              <div style={{ fontFamily: "Share Tech Mono,monospace", fontSize: "1.05rem", color: "rgba(0,220,255,0.5)", padding: "15px 12px 15px 0", background: "transparent", flexShrink: 0 }}>
                @
              </div>
              <input
                ref={inputRef}
                className="gd-input"
                style={{ borderRadius: "0 4px 4px 0", borderLeft: "none" }}
                placeholder="username or github.com/username"
                value={username}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                onChange={e => {
                  setUsername(e.target.value);
                  if (inputError) setInputError("");
                }}
                onKeyDown={e => e.key === "Enter" && handle()}
                autoFocus
              />
            </div>
            {inputError && (
              <div style={{ marginTop: 8, color: "#ff8b8b", fontFamily: "Share Tech Mono,monospace", fontSize: "0.62rem", letterSpacing: "0.03em" }}>
                {inputError}
              </div>
            )}
          </div>
          <button className="gd-btn" onClick={handle} disabled={loading || !username.trim()} style={{ width: "100%", fontSize: "0.8rem" }}>
            {loading ? "INITIALIZING..." : "▶ EXECUTE ANALYSIS"}
          </button>
          <div style={{ marginTop: 10, fontFamily: "Share Tech Mono,monospace", fontSize: "0.62rem", color: "rgba(0,220,255,0.45)", letterSpacing: "0.04em" }}>
            Set VITE_API_URL in .env to your FastAPI backend URL
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={{ fontFamily: "Share Tech Mono,monospace", fontSize: "0.58rem", color: "rgba(0,220,255,0.36)", letterSpacing: "0.14em", marginBottom: 8 }}>
              RECENTLY ANALYZED
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {recentProfiles.map((profile) => (
                <button
                  key={profile}
                  type="button"
                  className="gd-recent-pill"
                  onClick={() => {
                    setUsername(profile);
                    if (inputError) setInputError("");
                  }}
                >
                  @{profile}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="anim-fade delay-6" style={{ display: "flex", gap: 24, marginTop: 36, flexWrap: "wrap", justifyContent: "center" }}>
        {[["⬡ BEHAVIORAL PROFILING", "Decode your coding psychology"],
          ["⬡ SKILL TOPOLOGY", "Map your language mastery"],
          ["⬡ CHRONOTYPE ANALYSIS", "Reveal your dev rhythm"]].map(([t, s]) => (
          <div key={t} style={{ textAlign: "center", maxWidth: 140 }}>
            <div style={{ fontFamily: "Share Tech Mono,monospace", fontSize: "0.62rem", letterSpacing: "0.1em", color: "rgba(0,220,255,0.5)", marginBottom: 4 }}>{t}</div>
            <div style={{ fontSize: "0.75rem", color: "rgba(200,232,255,0.3)" }}>{s}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LoadingPage({ step, message, feed, steps = LOADING_STEPS, ultraMode = false }) {
  const safeSteps = Array.isArray(steps) && steps.length > 0 ? steps : LOADING_STEPS;
  const safeStep = Math.max(0, Math.min(step, safeSteps.length - 1));
  const pct = Math.round(((safeStep + 1) / safeSteps.length) * 100);
  const currentMessage = message || safeSteps[safeStep] || safeSteps[0];
  const displayFeed = Array.isArray(feed) && feed.length > 0 ? feed : safeSteps.slice(0, Math.max(safeStep + 1, 1));
  return (
    <div className={`gd-root${ultraMode ? " gd-ultra-mode" : ""}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 20, position: "relative", zIndex: 2 }}>
      <BackgroundCanvas />
      <div className="gd-scanlines" />

      <div style={{ width: "100%", maxWidth: 480, textAlign: "center" }}>
        <div style={{ position: "relative", width: "100%", maxWidth: 260, height: 140, margin: "0 auto 28px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg className="gd-helix" viewBox="0 0 240 120" width="240" height="120" aria-hidden="true">
            <path className="gd-helix-a" d="M10 60 C 30 12, 50 12, 70 60 C 90 108, 110 108, 130 60 C 150 12, 170 12, 190 60 C 210 108, 230 108, 230 60" />
            <path className="gd-helix-b" d="M10 60 C 30 108, 50 108, 70 60 C 90 12, 110 12, 130 60 C 150 108, 170 108, 190 60 C 210 12, 230 12, 230 60" />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          </div>
        </div>

        <div className="gd-loading-title" aria-hidden="true">
          {"GITDNA".split("").map((char, index) => (
            <span key={`${char}-${index}`} style={{ "--i": index }}>{char}</span>
          ))}
        </div>

        <div className="gd-loading-status" style={{ fontFamily: "Share Tech Mono,monospace", fontSize: "0.68rem", color: "rgba(0,220,255,0.72)", letterSpacing: "0.15em", marginBottom: 10, marginTop: 10 }}>
          SYSTEM PROCESS {String(safeStep + 1).padStart(2, "0")}/{safeSteps.length}
        </div>
        <div className="gd-loading-status" style={{ fontFamily: "Orbitron,monospace", fontSize: "clamp(0.78rem,2.2vw,1rem)", color: "#7feaff", letterSpacing: "0.12em", fontWeight: 700, marginBottom: 28, textShadow: "0 0 14px rgba(0,220,255,0.7)", minHeight: 24 }}>
          {currentMessage}
          <span style={{ opacity: 0.5 }}>...</span>
        </div>

        <div className="gd-card" style={{ padding: "14px 18px", marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontFamily: "Share Tech Mono,monospace", fontSize: "0.62rem", color: "rgba(0,220,255,0.4)" }}>GENOMIC EXTRACTION</span>
            <span className="orb" style={{ fontSize: "0.62rem", color: "#00dcff" }}>{pct}%</span>
          </div>
          <div style={{ height: 6, background: "rgba(0,220,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", background: "linear-gradient(90deg,#00dcff,#b347ea)", borderRadius: 3, width: `${pct}%`, transition: "width 0.5s ease", boxShadow: "0 0 8px rgba(0,220,255,0.4)" }} />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {displayFeed.map((msg, i) => {
            const latestIndex = displayFeed.length - 1;
            return (
            <div key={`${msg}-${i}`} style={{ display: "flex", alignItems: "center", gap: 10, opacity: i === latestIndex ? 1 : 0.35 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: i === latestIndex ? "#00dcff" : "#39ff14", boxShadow: i === latestIndex ? "0 0 6px rgba(0,220,255,0.8)" : "none", flexShrink: 0 }} />
              <span style={{ fontFamily: "Share Tech Mono,monospace", fontSize: "0.6rem", color: "rgba(0,220,255,0.5)", letterSpacing: "0.08em" }}>{msg}</span>
            </div>
          )})}
        </div>
      </div>
    </div>
  );
}

const TIME_MACHINE_PORTAL_STYLES = `
.tm-overlay{position:fixed;inset:0;z-index:9999;background:#000;overflow:hidden;color:#dff7ff}
.tm-overlay::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 20% 0%,rgba(0,220,255,.08),transparent 36%),radial-gradient(circle at 80% 100%,rgba(179,71,234,.1),transparent 42%);opacity:0;transition:opacity .6s ease;pointer-events:none}
.tm-overlay.tm-has-grid::before{opacity:1}
.tm-overlay-closing{animation:tm-close-fade .4s ease forwards}
.tm-open-shell{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px;background:#000;cursor:default}
.tm-open-shell.tm-step-2,.tm-open-shell.tm-step-3,.tm-open-shell.tm-step-4{background:#060b12;transition:background .8s ease}
.tm-open-shell.tm-step-2::before,.tm-open-shell.tm-step-3::before,.tm-open-shell.tm-step-4::before{content:'';position:absolute;inset:0;background-image:linear-gradient(rgba(0,220,255,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(0,220,255,.08) 1px,transparent 1px);background-size:42px 42px;opacity:.22;pointer-events:none}
.tm-scan-line{position:absolute;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,#fff,transparent);animation:tm-scan-down .5s linear forwards}
.tm-avatar-wrap{width:100px;height:100px;border-radius:50%;border:2px solid #00dcff;box-shadow:0 0 40px rgba(0,220,255,.5);overflow:hidden;transform:scale(0);animation:tm-avatar-pop .6s cubic-bezier(.34,1.56,.64,1) forwards}
.tm-avatar-wrap img{width:100%;height:100%;object-fit:cover;display:block}
.tm-open-username{margin-top:14px;font-family:'Orbitron',monospace;font-size:1.2rem;color:#00dcff;opacity:0;letter-spacing:.5em;animation:tm-name-fade .4s ease forwards}
.tm-chronicles{position:absolute;top:18px;left:50%;transform:translateX(-50%);font-family:'Share Tech Mono',monospace;font-size:.62rem;letter-spacing:.2em;color:rgba(0,220,255,.62)}
.tm-origin{margin-top:18px;max-width:400px;min-height:46px;font-family:'Share Tech Mono',monospace;font-size:.85rem;line-height:1.5;color:rgba(200,232,255,.74)}
.tm-cursor{opacity:.8;animation:tm-cursor-blink .8s linear infinite}
.tm-divider-wrap{margin-top:14px;width:min(90vw,420px);display:flex;justify-content:center;overflow:hidden}
.tm-divider{font-family:'Share Tech Mono',monospace;color:rgba(0,220,255,.4);white-space:nowrap;display:inline-block;transform-origin:left center;animation:tm-divider-grow .5s ease forwards}
.tm-hero{margin-top:16px;font-family:'Orbitron',monospace;font-weight:900;font-size:clamp(1.4rem,4vw,2.2rem);letter-spacing:.12em;color:#fff;text-shadow:0 0 30px rgba(0,220,255,.5);opacity:0;transform:translateY(40px);animation:tm-hero-slam .4s ease forwards}
.tm-begin-hint{position:absolute;bottom:28px;left:50%;transform:translateX(-50%);font-family:'Share Tech Mono',monospace;font-size:.65rem;color:rgba(0,220,255,.5);letter-spacing:.2em;animation:tm-hint-pulse 1.3s ease-in-out infinite}
.tm-skip{position:absolute;top:16px;right:16px;border:1px solid rgba(0,220,255,.25);background:transparent;color:rgba(0,220,255,.55);font-family:'Share Tech Mono',monospace;font-size:.58rem;letter-spacing:.12em;padding:6px 8px;cursor:pointer;opacity:.7}
.tm-main{position:absolute;inset:0;overflow:auto;background:#060b12}
.tm-main::before{content:'';position:fixed;inset:0;background-image:linear-gradient(rgba(0,220,255,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(0,220,255,.08) 1px,transparent 1px);background-size:42px 42px;opacity:.2;pointer-events:none}
.tm-exit{position:fixed;top:16px;right:16px;z-index:4;background:transparent;border:1px solid rgba(0,220,255,.3);color:rgba(0,220,255,.66);font-family:'Orbitron',monospace;font-size:.7rem;letter-spacing:.08em;padding:8px 10px;cursor:pointer}
.tm-scroll{position:relative;max-width:700px;margin:0 auto;padding:80px 20px 120px;z-index:2}
.tm-head{text-align:center;margin-bottom:30px}
.tm-head-kicker{font-family:'Share Tech Mono',monospace;font-size:.62rem;letter-spacing:.2em;color:rgba(0,220,255,.42);margin-bottom:8px}
.tm-head-title{font-family:'Orbitron',monospace;font-size:clamp(1.5rem,4vw,2rem);letter-spacing:.1em;color:#fff}
.tm-head-byline{margin-top:10px;display:inline-flex;align-items:center;gap:8px;font-family:'Share Tech Mono',monospace;font-size:.64rem;color:rgba(200,232,255,.55)}
.tm-head-byline img{width:32px;height:32px;border-radius:50%;border:1px solid rgba(0,220,255,.4)}
.tm-track{position:relative;padding-top:8px}
.tm-spine{position:absolute;left:calc(50% - 1px);top:0;width:2px;height:100%;background:linear-gradient(180deg,transparent,#00dcff 5%,#00dcff 95%,transparent);box-shadow:0 0 8px rgba(0,220,255,.4),0 0 20px rgba(0,220,255,.15);transform-origin:top center;animation:tm-spine-grow 2s ease-out forwards}
.tm-row{position:relative;display:flex;min-height:174px;margin-bottom:18px}
.tm-row.tm-right{justify-content:flex-end}
.tm-row.tm-left{justify-content:flex-start}
.tm-chevron{position:absolute;left:50%;top:-12px;transform:translateX(-50%);font-size:9px;letter-spacing:.15em;color:rgba(0,220,255,.2)}
.tm-node-wrap{position:absolute;left:50%;top:28px;transform:translateX(-50%);width:0;height:0;z-index:2}
.tm-now{position:absolute;top:-22px;left:50%;transform:translateX(-50%);font-family:'Share Tech Mono',monospace;font-size:.52rem;letter-spacing:.16em;color:#00dcff}
.tm-node{position:relative;display:grid;place-items:center;transform:translate(-50%,-50%);transition:transform .2s ease}
.tm-node svg{display:block}
.tm-node-level{position:absolute;font-family:'Orbitron',monospace;font-size:.6rem;color:#dff7ff;text-shadow:0 0 8px rgba(0,220,255,.32)}
.tm-node-active{transform:translate(-50%,-50%) scale(1.3)}
.tm-node-active svg{filter:drop-shadow(0 0 6px var(--tier-color));animation:tm-node-pulse 1s ease-in-out infinite}
.tm-node-ripple{position:absolute;left:50%;top:50%;border-radius:50%;border:1px solid var(--tier-color);animation:tm-ripple 1.5s ease-out infinite;transform:translate(-50%,-50%)}
.tm-node-current svg{animation:tm-current-pulse 2s ease-in-out infinite}
.tm-card{width:calc(50% - 40px);border-radius:6px;padding:16px 18px;background:rgba(4,14,26,.9);backdrop-filter:blur(12px);opacity:0;will-change:transform,opacity;transition:opacity .5s cubic-bezier(.2,.8,.2,1),transform .5s cubic-bezier(.2,.8,.2,1),box-shadow .35s ease}
.tm-row.tm-right .tm-card{margin-left:20px;border-left:2px solid var(--tier-color);text-align:left;transform:translateX(30px)}
.tm-row.tm-left .tm-card{margin-right:20px;border-right:2px solid var(--tier-color);text-align:right;transform:translateX(-30px)}
.tm-card.tm-visible{opacity:1;transform:translateX(0)}
.tm-card.tm-peak{box-shadow:0 0 0 1px var(--tier-color),0 0 24px var(--tier-glow)}
.tm-peak-banner{font-family:'Share Tech Mono',monospace;font-size:.6rem;letter-spacing:.15em;color:var(--tier-color);margin-bottom:8px}
.tm-card-head{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
.tm-row.tm-left .tm-card-head{flex-direction:row-reverse}
.tm-year{font-family:'Orbitron',monospace;font-size:1.5rem;font-weight:700;color:var(--tier-color);text-shadow:0 0 10px var(--tier-glow)}
.tm-year.tm-year-peak{text-shadow:0 0 18px var(--tier-glow)}
.tm-tier{display:inline-flex;align-items:center;padding:2px 8px;border-radius:3px;font-family:'Share Tech Mono',monospace;font-size:.58rem;letter-spacing:.12em;color:var(--tier-color);background:var(--tier-soft);border:1px solid var(--tier-mid)}
.tm-level-row{display:flex;align-items:center;justify-content:flex-end;gap:8px;margin-top:8px}
.tm-row.tm-right .tm-level-row{justify-content:flex-end}
.tm-row.tm-left .tm-level-row{justify-content:flex-start}
.tm-level-label{font-family:'Orbitron',monospace;font-size:.6rem;color:var(--tier-color);letter-spacing:.1em}
.tm-level-track{height:3px;border-radius:2px;background:rgba(255,255,255,.05);overflow:hidden;flex:1;position:relative}
.tm-level-fill{height:100%;border-radius:2px;background:linear-gradient(90deg,var(--tier-mid),var(--tier-color));width:0;transition:width .6s ease .08s;position:relative}
.tm-card.tm-visible .tm-level-fill{width:var(--lvl)}
.tm-level-fill.tm-peak::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.38),transparent);transform:translateX(-100%);animation:tm-shimmer 1s ease .85s 1 forwards}
.tm-lang{margin-top:10px;display:flex;align-items:center;gap:7px;font-family:'Share Tech Mono',monospace;font-size:.75rem;color:rgba(200,232,255,.85)}
.tm-row.tm-left .tm-lang{justify-content:flex-end}
.tm-dot{width:8px;height:8px;border-radius:50%}
.tm-stats{margin-top:8px;font-family:'Share Tech Mono',monospace;font-size:.68rem;color:rgba(0,220,255,.55)}
.tm-bars{margin-top:10px;display:flex;gap:2px;align-items:flex-end}
.tm-row.tm-left .tm-bars{justify-content:flex-end}
.tm-bars span{width:3px;border-radius:2px}
.tm-sep{height:1px;background:rgba(255,255,255,.06);margin:10px 0}
.tm-narration{font-family:'Rajdhani',sans-serif;font-size:.88rem;color:rgba(200,232,255,.66);line-height:1.55;font-style:italic;min-height:34px}
.tm-active-badge{margin-top:8px;display:inline-flex;align-items:center;gap:6px;font-family:'Share Tech Mono',monospace;font-size:.62rem;letter-spacing:.1em;color:#39ff14}
.tm-active-badge-dot{width:7px;height:7px;border-radius:50%;background:#39ff14;box-shadow:0 0 8px rgba(57,255,20,.7);animation:tm-cursor-blink .9s linear infinite}
.tm-current-status{margin-top:12px;border:1px solid rgba(255,215,0,.4);box-shadow:0 0 14px rgba(255,215,0,.22);border-radius:6px;padding:10px 12px}
.tm-current-level{font-family:'Orbitron',monospace;font-size:1.6rem;color:#ffd700;letter-spacing:.08em}
.tm-current-sub{font-family:'Share Tech Mono',monospace;font-size:.58rem;color:rgba(255,215,0,.68);letter-spacing:.13em}
.tm-sentinel{height:2px}
.tm-final{margin-top:20px;border:1px solid rgba(255,215,0,.35);background:rgba(18,12,0,.9);box-shadow:0 0 30px rgba(255,215,0,.1);border-radius:8px;padding:32px;opacity:0;transform:translateY(20px);animation:tm-final-in .55s ease forwards}
.tm-stagger{opacity:0;transform:translateY(10px);animation:tm-final-stagger .45s ease forwards}
.tm-final-kicker{font-family:'Share Tech Mono',monospace;font-size:.62rem;letter-spacing:.18em;color:rgba(255,215,0,.68)}
.tm-final-divider{height:1px;background:linear-gradient(90deg,transparent,rgba(255,215,0,.62),transparent);margin:14px 0}
.tm-final-title{font-family:'Orbitron',monospace;font-size:1.8rem;color:#fff;letter-spacing:.08em}
.tm-final-summary{margin-top:12px;font-family:'Rajdhani',sans-serif;font-size:1rem;line-height:1.7;font-style:italic;color:rgba(200,232,255,.7)}
.tm-chip-row{display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin-top:14px}
.tm-chip{border:1px solid rgba(255,215,0,.48);color:#ffd700;background:rgba(255,215,0,.08);padding:4px 8px;border-radius:999px;font-family:'Share Tech Mono',monospace;font-size:.65rem;letter-spacing:.09em}
.tm-journey{margin-top:14px}
.tm-journey-track{display:flex;height:8px;border-radius:4px;overflow:hidden;background:rgba(255,255,255,.05);position:relative}
.tm-journey-seg{flex:1;opacity:0;animation:tm-segment-in .35s ease forwards;cursor:pointer}
.tm-journey-tip{margin-top:7px;text-align:center;font-family:'Share Tech Mono',monospace;font-size:.58rem;color:rgba(0,220,255,.62);letter-spacing:.12em;min-height:14px}
.tm-final-actions{margin-top:18px;display:flex;justify-content:center;gap:10px;flex-wrap:wrap}
.tm-btn{background:linear-gradient(135deg,rgba(0,220,255,.12),rgba(179,71,234,.12));border:1px solid rgba(0,220,255,.4);color:#00dcff;font-family:'Orbitron',monospace;font-size:.68rem;letter-spacing:.1em;padding:10px 14px;cursor:pointer}
.tm-btn.tm-close{border-color:rgba(255,120,120,.45);color:#ff8a8a;background:linear-gradient(135deg,rgba(255,60,60,.14),rgba(100,20,20,.25))}
.tm-particles{position:fixed;inset:0;pointer-events:none;z-index:6}
.tm-particle{position:fixed;width:4px;height:4px;border-radius:50%;left:0;top:0;animation:tm-level-particle .6s ease-out forwards}
.tm-level-up-text{position:fixed;left:0;top:0;font-family:'Orbitron',monospace;font-size:.7rem;letter-spacing:.08em;animation:tm-float-up-fade 1s ease-out forwards;white-space:nowrap}
.tm-returning{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:'Share Tech Mono',monospace;font-size:.75rem;letter-spacing:.2em;color:#fff;pointer-events:none;animation:tm-return-fade .6s ease forwards;background:rgba(0,0,0,.82)}

@media (max-width:600px){
  .tm-open-username{font-size:clamp(.95rem,5.2vw,1.1rem)}
  .tm-origin{font-size:clamp(.74rem,3.3vw,.82rem);max-width:88vw}
  .tm-spine{left:28px}
  .tm-row{justify-content:flex-end!important}
  .tm-node-wrap{left:28px}
  .tm-card{width:calc(100% - 52px);margin-left:52px!important;margin-right:0!important;text-align:left!important;border-left:2px solid var(--tier-color)!important;border-right:none!important}
  .tm-card-head{flex-direction:row!important}
  .tm-level-row,.tm-lang,.tm-bars{justify-content:flex-start!important}
}

@keyframes tm-scan-down{from{top:0}to{top:100%}}
@keyframes tm-avatar-pop{0%{transform:scale(0)}70%{transform:scale(1.15)}100%{transform:scale(1)}}
@keyframes tm-name-fade{from{opacity:0;letter-spacing:.5em}to{opacity:1;letter-spacing:.15em}}
@keyframes tm-cursor-blink{0%,49%{opacity:1}50%,100%{opacity:0}}
@keyframes tm-divider-grow{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes tm-hero-slam{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}
@keyframes tm-hint-pulse{0%,100%{opacity:.3}50%{opacity:.8}}
@keyframes tm-spine-grow{from{transform:scaleY(0)}to{transform:scaleY(1)}}
@keyframes tm-node-pulse{0%,100%{opacity:.55}50%{opacity:1}}
@keyframes tm-ripple{0%{width:28px;height:28px;opacity:.8;transform:translate(-50%,-50%)}100%{width:70px;height:70px;opacity:0;transform:translate(-50%,-50%)}}
@keyframes tm-current-pulse{0%,100%{filter:drop-shadow(0 0 8px rgba(0,220,255,.45))}50%{filter:drop-shadow(0 0 20px rgba(0,220,255,.85))}}
@keyframes tm-shimmer{from{transform:translateX(-100%)}to{transform:translateX(100%)}}
@keyframes tm-segment-in{from{opacity:0;transform:scaleX(.45)}to{opacity:1;transform:scaleX(1)}}
@keyframes tm-final-in{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes tm-final-stagger{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes tm-close-fade{0%{opacity:1}100%{opacity:0;background:#000}}
@keyframes tm-return-fade{0%{opacity:0}30%{opacity:1}100%{opacity:0}}
@keyframes tm-level-particle{0%{transform:translate(-50%,-50%) scale(1);opacity:1}100%{transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) scale(0);opacity:0}}
@keyframes tm-float-up-fade{0%{transform:translate(-50%,0);opacity:1}100%{transform:translate(-50%,-40px);opacity:0}}
`;

function TimeMachine({ repos, events, user, aiData, onClose }) {
  const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");
  const safeRepos = useMemo(() => (Array.isArray(repos) ? repos : []), [repos]);
  const safeEvents = useMemo(() => (Array.isArray(events) ? events : []), [events]);
  const cardRefs = useRef(new Map());
  const nodeRefs = useRef(new Map());
  const narrationIntervalsRef = useRef({});
  const narrationSourceRef = useRef({});
  const levelUpTriggeredRef = useRef(new Set());
  const closeTimerRef = useRef(null);
  const [sequenceStep, setSequenceStep] = useState(0);
  const [showTimeline, setShowTimeline] = useState(false);
  const [typedOrigin, setTypedOrigin] = useState("");
  const [typedYearNarrations, setTypedYearNarrations] = useState({});
  const [revealedYears, setRevealedYears] = useState({});
  const [inViewYears, setInViewYears] = useState({});
  const [hoveredYear, setHoveredYear] = useState(null);
  const [particles, setParticles] = useState([]);
  const [levelTexts, setLevelTexts] = useState([]);
  const [showEvolutionCard, setShowEvolutionCard] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showReturning, setShowReturning] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [hoveredSegment, setHoveredSegment] = useState(null);
  const [chroniclesLoading, setChroniclesLoading] = useState(false);
  const [placeholderNarrations, setPlaceholderNarrations] = useState(false);
  const [narrationData, setNarrationData] = useState(null);
  const aiPendingRef = useRef(false);
  const sentinelRef = useRef(null);

  const accountCreationYear = useMemo(() => {
    const parsed = new Date(user?.created_at || "");
    const year = parsed.getUTCFullYear();
    return Number.isFinite(year) ? year : new Date().getUTCFullYear();
  }, [user?.created_at]);

  const journey = useMemo(() => {
    const nowYear = new Date().getUTCFullYear();
    const startYear = Math.min(accountCreationYear, nowYear);
    const eventsByYear = new Map();
    const reposCreatedByYear = new Map();
    const reposPushedByYear = new Map();

    for (const event of safeEvents) {
      if (event?.type !== "PushEvent") continue;
      const year = new Date(event?.created_at || "").getUTCFullYear();
      if (!Number.isFinite(year)) continue;
      const commitCount = Array.isArray(event?.payload?.commits) && event.payload.commits.length > 0
        ? event.payload.commits.length
        : 1;
      eventsByYear.set(year, (eventsByYear.get(year) || 0) + commitCount);
    }

    for (const repo of safeRepos) {
      const createdYear = new Date(repo?.created_at || "").getUTCFullYear();
      if (Number.isFinite(createdYear)) {
        const list = reposCreatedByYear.get(createdYear) || [];
        list.push(repo);
        reposCreatedByYear.set(createdYear, list);
      }

      const pushedYear = new Date(repo?.pushed_at || "").getUTCFullYear();
      if (Number.isFinite(pushedYear)) {
        reposPushedByYear.set(pushedYear, (reposPushedByYear.get(pushedYear) || 0) + 1);
      }
    }

    const resolveTier = (score) => {
      if (score <= 5) return { label: "ROOKIE", level: 1, color: "#888888" };
      if (score <= 15) return { label: "DEVELOPING", level: 2, color: "#39ff14" };
      if (score <= 35) return { label: "COMPETENT", level: 3, color: "#00dcff" };
      if (score <= 80) return { label: "VETERAN", level: 4, color: "#b347ea" };
      return { label: "ELITE", level: 5, color: "#FFD700" };
    };

    const years = [];
    let previousLanguage = "Unknown";
    let cumulativeStars = 0;
    let cumulativeRepos = 0;
    const followers = Number(user?.followers || 0);

    for (let year = startYear; year <= nowYear; year += 1) {
      const yearRepos = reposCreatedByYear.get(year) || [];
      const commitsFromEvents = eventsByYear.get(year) || 0;
      const commitsFromPushedRepos = reposPushedByYear.get(year) || 0;
      const commits = commitsFromEvents > 0 ? commitsFromEvents : commitsFromPushedRepos;
      const newRepos = yearRepos.length;
      const starsEarned = yearRepos.reduce((sum, repo) => sum + Number(repo?.stargazers_count ?? repo?.stars ?? 0), 0);

      const langCount = {};
      for (const repo of yearRepos) {
        if (!repo?.language) continue;
        langCount[repo.language] = (langCount[repo.language] || 0) + 1;
      }

      const topLanguage = Object.keys(langCount).length > 0
        ? Object.entries(langCount).sort((a, b) => b[1] - a[1])[0][0]
        : previousLanguage;

      previousLanguage = topLanguage || previousLanguage || "Unknown";
      cumulativeStars += starsEarned;
      cumulativeRepos += newRepos;

      const yearScore = commits + newRepos * 3 + starsEarned * 0.5;
      const tier = resolveTier(yearScore);
      const yearsActive = (year - startYear) + 1;
      const overallLevel = Math.min(
        100,
        Math.round((cumulativeStars * 0.3) + (cumulativeRepos * 2) + (yearsActive * 5) + (followers * 0.1)),
      );

      years.push({
        year,
        commits,
        newRepos,
        starsEarned,
        topLanguage: previousLanguage || "Unknown",
        totalStarsAtEndOfYear: cumulativeStars,
        tier,
        overallLevel,
      });
    }

    const first = years[0] || null;
    const last = years[years.length - 1] || null;
    const peak = years.reduce((top, current) => (current.commits > top.commits ? current : top), years[0] || { year: nowYear, commits: 0 });
    const firstCommits = Math.max(1, Number(first?.commits || 0));
    const lastCommits = Math.max(0, Number(last?.commits || 0));
    const velocityMultiplier = Math.max(1, Math.min(99, Number((lastCommits / firstCommits).toFixed(2))));

    return {
      years,
      firstLanguage: first?.topLanguage || "Unknown",
      currentLanguage: last?.topLanguage || first?.topLanguage || "Unknown",
      peakYear: peak?.year || nowYear,
      totalYearsActive: years.length,
      velocityMultiplier,
      firstYear: first?.year || startYear,
      firstYearRepos: first?.newRepos || 0,
      firstTierLabel: first?.tier?.label || "ROOKIE",
      finalLevel: last?.overallLevel || 1,
    };
  }, [safeRepos, safeEvents, user?.followers, accountCreationYear]);

  const fallbackNarration = useMemo(() => {
    const yearNarrations = {};
    for (const item of journey.years) {
      yearNarrations[String(item.year)] = `${item.year} — ${item.commits} commits. ${item.newRepos} new repos.`;
    }

    return {
      yearNarrations,
      evolutionSummary: `${journey.totalYearsActive} years. ${journey.firstLanguage} to ${journey.currentLanguage}. ${journey.velocityMultiplier}x velocity increase.`,
      heroTitle: `${journey.years[journey.years.length - 1]?.tier?.label || "ROOKIE"} DEVELOPER`,
      originStory: `It started in ${journey.firstYear} with ${journey.firstYearRepos} repositories.`,
    };
  }, [journey]);

  const cacheKey = `${user?.login || "unknown"}:${journey.firstYear}:${journey.years.length}`;
  const narrationCacheRef = useRef(TIME_MACHINE_AI_CACHE.get(cacheKey) || null);

  useEffect(() => {
    if (narrationCacheRef.current) {
      setNarrationData(narrationCacheRef.current);
      return;
    }

    let cancelled = false;
    aiPendingRef.current = true;
    setChroniclesLoading(true);

    const timeoutId = setTimeout(() => {
      if (cancelled || !aiPendingRef.current) return;
      setPlaceholderNarrations(true);
      setChroniclesLoading(false);
    }, 8000);

    const run = async () => {
      try {
        const response = await fetch(`${API_URL}/api/time-machine-narration`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            username: user?.login || "unknown",
            yearData: journey.years,
            firstLanguage: journey.firstLanguage,
            currentLanguage: journey.currentLanguage,
            velocityMultiplier: journey.velocityMultiplier,
            totalYearsActive: journey.totalYearsActive,
          }),
        });

        if (!response.ok) {
          throw new Error("Time Machine narration failed");
        }

        const payload = await response.json();
        const narration = payload?.narration || payload;
        if (!narration || typeof narration !== "object") {
          throw new Error("Invalid narration payload");
        }

        if (!cancelled) {
          narrationCacheRef.current = narration;
          TIME_MACHINE_AI_CACHE.set(cacheKey, narration);
          setNarrationData(narration);
          setPlaceholderNarrations(false);
        }
      } catch {
        if (!cancelled) {
          narrationCacheRef.current = fallbackNarration;
          TIME_MACHINE_AI_CACHE.set(cacheKey, fallbackNarration);
          setNarrationData(fallbackNarration);
          setPlaceholderNarrations(false);
        }
      } finally {
        if (!cancelled) {
          aiPendingRef.current = false;
          setChroniclesLoading(false);
        }
        clearTimeout(timeoutId);
      }
    };

    run();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [API_URL, cacheKey, fallbackNarration, journey.currentLanguage, journey.firstLanguage, journey.totalYearsActive, journey.velocityMultiplier, journey.years, user?.login]);

  const openingOriginStory = narrationData?.originStory || fallbackNarration.originStory;
  const heroTitle = narrationData?.heroTitle || fallbackNarration.heroTitle;
  const evolutionSummary = narrationData?.evolutionSummary || fallbackNarration.evolutionSummary;
  const narrationByYear = useMemo(() => {
    const mapped = {};
    for (const item of journey.years) {
      const key = String(item.year);
      if (journey.totalYearsActive === 1) {
        mapped[key] = "YOUR JOURNEY HAS BEGUN";
      } else if (placeholderNarrations && aiPendingRef.current && !narrationData?.yearNarrations?.[key]) {
        mapped[key] = "AI NARRATION LOADING...";
      } else {
        mapped[key] = narrationData?.yearNarrations?.[key] || fallbackNarration.yearNarrations[key] || `${item.year} — ${item.commits} commits. ${item.newRepos} new repos.`;
      }
    }
    return mapped;
  }, [journey.years, journey.totalYearsActive, placeholderNarrations, narrationData, fallbackNarration.yearNarrations]);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  useEffect(() => {
    if (showTimeline) return;
    const t1 = setTimeout(() => setSequenceStep(1), 600);
    const t2 = setTimeout(() => setSequenceStep(2), 1800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [showTimeline]);

  useEffect(() => {
    if (showTimeline || sequenceStep !== 2) return;

    if (journey.totalYearsActive <= 1) {
      const t = setTimeout(() => setSequenceStep(3), 200);
      return () => clearTimeout(t);
    }

    setTypedOrigin("");
    let index = 0;
    const text = openingOriginStory || "";
    const timer = setInterval(() => {
      index += 1;
      setTypedOrigin(text.slice(0, index));
      if (index >= text.length) {
        clearInterval(timer);
        setTimeout(() => setSequenceStep(3), 400);
      }
    }, 28);

    return () => clearInterval(timer);
  }, [showTimeline, sequenceStep, journey.totalYearsActive, openingOriginStory]);

  useEffect(() => {
    if (showTimeline || sequenceStep !== 3) return;
    const t = setTimeout(() => setSequenceStep(4), 500);
    return () => clearTimeout(t);
  }, [showTimeline, sequenceStep]);

  useEffect(() => {
    if (showTimeline || sequenceStep < 4) return;
    const onKeyDown = (event) => {
      if (event.code !== "Space") return;
      event.preventDefault();
      setShowTimeline(true);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showTimeline, sequenceStep]);

  const startNarrationTyping = (year, text, force = false) => {
    const key = String(year);
    if (!text) return;
    if (!force && narrationSourceRef.current[key] === text) return;

    if (narrationIntervalsRef.current[key]) {
      clearInterval(narrationIntervalsRef.current[key]);
      delete narrationIntervalsRef.current[key];
    }

    narrationSourceRef.current[key] = text;
    setTypedYearNarrations((prev) => ({ ...prev, [key]: "" }));
    let index = 0;
    narrationIntervalsRef.current[key] = setInterval(() => {
      index += 1;
      setTypedYearNarrations((prev) => ({ ...prev, [key]: text.slice(0, index) }));
      if (index >= text.length) {
        clearInterval(narrationIntervalsRef.current[key]);
        delete narrationIntervalsRef.current[key];
      }
    }, 20);
  };

  const triggerLevelUpBurst = (year, color) => {
    const nodeEl = nodeRefs.current.get(year);
    if (!nodeEl) return;
    const rect = nodeEl.getBoundingClientRect();
    const x = rect.left + (rect.width / 2);
    const y = rect.top + (rect.height / 2);
    const burstId = `${year}-${Date.now()}`;

    const particlesToAdd = Array.from({ length: 8 }).map((_, index) => {
      const angle = (Math.PI / 4) * index;
      const distance = 30 + (index % 3) * 14;
      return {
        id: `${burstId}-${index}`,
        x,
        y,
        dx: Math.cos(angle) * distance,
        dy: Math.sin(angle) * distance,
        color: index % 2 === 0 ? color : "#ffffff",
      };
    });

    setParticles((prev) => [...prev, ...particlesToAdd]);
    setLevelTexts((prev) => [...prev, { id: burstId, x, y, color, text: "+LEVEL UP" }]);

    setTimeout(() => {
      setParticles((prev) => prev.filter((item) => !item.id.startsWith(burstId)));
      setLevelTexts((prev) => prev.filter((item) => item.id !== burstId));
    }, 1000);
  };

  useEffect(() => {
    if (!showTimeline) return;

    const yearIndexMap = new Map(journey.years.map((item, index) => [item.year, index]));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const year = Number(entry.target.getAttribute("data-year"));
          if (!Number.isFinite(year)) continue;
          const inView = entry.isIntersecting && entry.intersectionRatio >= 0.3;

          setInViewYears((prev) => (prev[year] === inView ? prev : { ...prev, [year]: inView }));

          if (!inView) continue;

          setRevealedYears((prev) => (prev[year] ? prev : { ...prev, [year]: true }));
          startNarrationTyping(year, narrationByYear[String(year)] || "");

          const index = yearIndexMap.get(year);
          if (index === undefined || index <= 0 || levelUpTriggeredRef.current.has(year)) continue;

          const currentTier = journey.years[index]?.tier?.level || 0;
          const previousTier = journey.years[index - 1]?.tier?.level || 0;
          if (currentTier > previousTier) {
            levelUpTriggeredRef.current.add(year);
            triggerLevelUpBurst(year, journey.years[index].tier.color);
          }
        }
      },
      { threshold: [0.3] },
    );

    for (const item of journey.years) {
      const target = cardRefs.current.get(item.year);
      if (target) observer.observe(target);
    }

    return () => observer.disconnect();
  }, [showTimeline, journey.years, narrationByYear]);

  useEffect(() => {
    if (!showTimeline) return;
    for (const item of journey.years) {
      const year = String(item.year);
      if (!revealedYears[year] && !revealedYears[item.year]) continue;
      const targetText = narrationByYear[year] || "";
      if (targetText && narrationSourceRef.current[year] !== targetText) {
        startNarrationTyping(item.year, targetText, true);
      }
    }
  }, [showTimeline, narrationByYear, revealedYears, journey.years]);

  useEffect(() => {
    if (!showTimeline) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShowEvolutionCard(true);
          }
        }
      },
      { threshold: [0.3] },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [showTimeline]);

  useEffect(() => {
    return () => {
      Object.values(narrationIntervalsRef.current).forEach((timer) => clearInterval(timer));
      narrationIntervalsRef.current = {};
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, []);

  const handleBegin = () => {
    if (sequenceStep < 4) return;
    setShowTimeline(true);
  };

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    setShowReturning(true);
    closeTimerRef.current = setTimeout(() => {
      onClose?.();
    }, 600);
  };

  const handleShareJourney = async () => {
    const shareText = `My dev journey: ${journey.totalYearsActive} yrs · Started as ${journey.firstTierLabel} · Now LEVEL ${journey.finalLevel} ${heroTitle} · gitdna.vercel.app`;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText);
      }
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 1400);
    } catch {
      // Ignore clipboard failures.
    }
  };

  const deterministicBars = (year, commits) => {
    const seed = Math.max(1, commits || 1);
    return Array.from({ length: 7 }).map((_, index) => {
      const n = Math.abs(Math.sin((seed * (index + 1)) + year * 0.37 + index * 2.1));
      return 4 + Math.round(n * 14);
    });
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className={`tm-overlay${showTimeline ? " tm-has-grid" : ""}${isClosing ? " tm-overlay-closing" : ""}`}>
      <style>{TIME_MACHINE_PORTAL_STYLES}</style>

      {!showTimeline ? (
        <div className={`tm-open-shell tm-step-${sequenceStep}`} onClick={handleBegin}>
          {chroniclesLoading && !placeholderNarrations && <div className="tm-chronicles">LOADING CHRONICLES...</div>}
          {sequenceStep === 0 && <div className="tm-scan-line" />}

          {sequenceStep >= 1 && (
            <>
              <div className="tm-avatar-wrap">
                {user?.avatar_url ? <img src={user.avatar_url} alt="" /> : null}
              </div>
              <div className="tm-open-username">@{user?.login || "unknown"}</div>
            </>
          )}

          {sequenceStep >= 2 && journey.totalYearsActive > 1 && (
            <div className="tm-origin">
              {typedOrigin}
              {typedOrigin.length < (openingOriginStory || "").length && <span className="tm-cursor"> |</span>}
            </div>
          )}

          {sequenceStep >= 3 && (
            <>
              <div className="tm-divider-wrap">
                <span className="tm-divider">━━━━━━━━━━━━━━━━━━━━━━━</span>
              </div>
              <div className="tm-hero">{heroTitle}</div>
            </>
          )}

          {sequenceStep >= 4 && (
            <>
              <button className="tm-skip" onClick={(event) => { event.stopPropagation(); setShowTimeline(true); }}>SKIP ›</button>
              <div className="tm-begin-hint">PRESS SPACE OR CLICK TO BEGIN JOURNEY</div>
            </>
          )}
        </div>
      ) : (
        <div className="tm-main">
          <button className="tm-exit" onClick={handleClose}>✕ EXIT</button>
          <div className="tm-scroll">
            <div className="tm-head">
              <div className="tm-head-kicker">// DEVELOPMENT JOURNEY</div>
              <div className="tm-head-title">{journey.totalYearsActive} YEARS IN THE MAKING</div>
              <div className="tm-head-byline">
                {user?.avatar_url ? <img src={user.avatar_url} alt="" /> : null}
                <span>@{user?.login || "unknown"}</span>
              </div>
            </div>

            <div className="tm-track">
              <div className="tm-spine" />

              {journey.years.map((item, index) => {
                const isLeft = index % 2 === 1;
                const isPeak = item.year === journey.peakYear;
                const isCurrent = index === journey.years.length - 1;
                const active = Boolean(inViewYears[item.year] || hoveredYear === item.year);
                const visible = Boolean(revealedYears[item.year]);
                const bars = deterministicBars(item.year, item.commits);
                const levelWidth = `${Math.max(0, Math.min(item.overallLevel, 100))}%`;
                const tierGlow = `${item.tier.color}55`;

                return (
                  <div key={item.year} className={`tm-row ${isLeft ? "tm-left" : "tm-right"}`}>
                    {index > 0 && <div className="tm-chevron">▼</div>}
                    <div className="tm-node-wrap">
                      {isCurrent && <div className="tm-now">▶ NOW</div>}
                      <div
                        ref={(node) => {
                          if (node) nodeRefs.current.set(item.year, node);
                          else nodeRefs.current.delete(item.year);
                        }}
                        className={`tm-node${active ? " tm-node-active" : ""}${isCurrent ? " tm-node-current" : ""}`}
                        style={{ "--tier-color": item.tier.color }}
                      >
                        <svg width={isPeak ? 40 : 28} height={isPeak ? 44 : 32} viewBox="0 0 28 32" aria-hidden="true">
                          <polygon points="14,1 26,8 26,24 14,31 2,24 2,8" fill="rgba(4,14,26,0.95)" stroke={item.tier.color} strokeWidth="1.5" />
                        </svg>
                        <div className="tm-node-level">{item.commits > 0 ? item.tier.level : "•"}</div>
                        {active && <div className="tm-node-ripple" />}
                      </div>
                    </div>

                    <div
                      ref={(node) => {
                        if (node) cardRefs.current.set(item.year, node);
                        else cardRefs.current.delete(item.year);
                      }}
                      data-year={item.year}
                      className={`tm-card${visible ? " tm-visible" : ""}${isPeak ? " tm-peak" : ""}`}
                      style={{ "--tier-color": item.tier.color, "--tier-soft": `${item.tier.color}18`, "--tier-mid": `${item.tier.color}55`, "--tier-glow": tierGlow, "--lvl": levelWidth }}
                      onMouseEnter={() => setHoveredYear(item.year)}
                      onMouseLeave={() => setHoveredYear(null)}
                    >
                      {isPeak && <div className="tm-peak-banner">⚡ PEAK PERFORMANCE YEAR</div>}
                      <div className="tm-card-head">
                        <div className={`tm-year${isPeak ? " tm-year-peak" : ""}`}>{item.year}</div>
                        <span className="tm-tier">{item.tier.label}</span>
                      </div>

                      <div className="tm-level-row">
                        <div className="tm-level-track">
                          <div className={`tm-level-fill${isPeak ? " tm-peak" : ""}`} />
                        </div>
                        <div className="tm-level-label">LVL {item.overallLevel}</div>
                      </div>

                      <div className="tm-lang">
                        <span className="tm-dot" style={{ background: getLangColor(item.topLanguage) }} />
                        <span>{item.topLanguage || "Unknown"}</span>
                      </div>

                      <div className="tm-stats">
                        {item.commits > 0
                          ? `${item.commits} commits · ${item.newRepos} repos · ${item.starsEarned}⭐`
                          : `~${item.newRepos} active repos`}
                      </div>

                      <div className="tm-bars">
                        {bars.map((height, barIndex) => (
                          <span key={`${item.year}-bar-${barIndex}`} style={{ height, background: `${item.tier.color}66` }} />
                        ))}
                      </div>

                      <div className="tm-sep" />
                      <div className="tm-narration">{typedYearNarrations[String(item.year)] || ""}</div>

                      {isCurrent && (
                        <>
                          <div className="tm-active-badge">
                            <span className="tm-active-badge-dot" />
                            ACTIVE DEVELOPER
                          </div>
                          <div className="tm-current-status">
                            <div className="tm-current-level">LEVEL {item.overallLevel}</div>
                            <div className="tm-current-sub">OVERALL DEVELOPER RANK</div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}

              <div ref={sentinelRef} className="tm-sentinel" />

              {showEvolutionCard && (
                <div className="tm-final">
                  <div className="tm-final-kicker tm-stagger" style={{ animationDelay: "0ms" }}>// EVOLUTION ANALYSIS</div>
                  <div className="tm-final-divider tm-stagger" style={{ animationDelay: "150ms" }} />
                  <div className="tm-final-title tm-stagger" style={{ animationDelay: "300ms" }}>{heroTitle}</div>
                  <div className="tm-final-summary tm-stagger" style={{ animationDelay: "450ms" }}>{evolutionSummary}</div>

                  <div className="tm-chip-row tm-stagger" style={{ animationDelay: "600ms" }}>
                    <div className="tm-chip">STARTED: {journey.firstYear}</div>
                    <div className="tm-chip">PEAK: {journey.peakYear}</div>
                    <div className="tm-chip">LEVEL: {journey.finalLevel}</div>
                  </div>

                  <div className="tm-journey tm-stagger" style={{ animationDelay: "750ms" }}>
                    <div className="tm-journey-track">
                      {journey.years.map((item, index) => (
                        <div
                          key={`segment-${item.year}`}
                          className="tm-journey-seg"
                          style={{ background: item.tier.color, animationDelay: `${index * 100}ms` }}
                          onMouseEnter={() => setHoveredSegment(item.year)}
                          onMouseLeave={() => setHoveredSegment(null)}
                          title={String(item.year)}
                        />
                      ))}
                    </div>
                    <div className="tm-journey-tip">{hoveredSegment ? `YEAR ${hoveredSegment}` : "HOVER SEGMENTS FOR YEAR"}</div>
                  </div>

                  <div className="tm-final-actions tm-stagger" style={{ animationDelay: "900ms" }}>
                    <button className="tm-btn" onClick={handleShareJourney}>↗ SHARE JOURNEY</button>
                    <button className="tm-btn tm-close" onClick={handleClose}>✕ CLOSE TIME MACHINE</button>
                  </div>
                  {shareCopied && <div className="tm-journey-tip">JOURNEY LINK COPIED</div>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="tm-particles">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="tm-particle"
            style={{ left: particle.x, top: particle.y, background: particle.color, "--dx": `${particle.dx}px`, "--dy": `${particle.dy}px` }}
          />
        ))}
        {levelTexts.map((entry) => (
          <div key={entry.id} className="tm-level-up-text" style={{ left: entry.x, top: entry.y, color: entry.color }}>{entry.text}</div>
        ))}
      </div>

      {showReturning && <div className="tm-returning">RETURNING TO PRESENT...</div>}
    </div>,
    document.body,
  );
}

function GitMap({ user, avgCommitHour, totalStars, topLang, accountAge, recentCommits = 0, onClose }) {
  const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");
  const geocodeRef = useRef(new Map());
  const insightRef = useRef(new Map());
  const closeTimeoutRef = useRef(null);
  const [sequenceStep, setSequenceStep] = useState(0);
  const [showMainMap, setShowMainMap] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showReturning, setShowReturning] = useState(false);
  const [geocodeLoading, setGeocodeLoading] = useState(true);
  const [geocodeReady, setGeocodeReady] = useState(false);
  const [scanTimeoutReached, setScanTimeoutReached] = useState(false);
  const [geo, setGeo] = useState({
    lat: 20,
    lon: 0,
    city: user?.location || "UNKNOWN",
    country: "Unknown",
    countryCode: "DEFAULT",
    displayName: user?.location || "Unknown location",
  });
  const [typedPlace, setTypedPlace] = useState("");
  const [typedCoords, setTypedCoords] = useState("");
  const [typedSignal, setTypedSignal] = useState("");
  const [cartographyLoading, setCartographyLoading] = useState(true);
  const [cartographyReady, setCartographyReady] = useState(false);
  const [cartographyFailed, setCartographyFailed] = useState(false);
  const [countries, setCountries] = useState([]);
  const [countryNames, setCountryNames] = useState(new Map());
  const [mapEntered, setMapEntered] = useState(false);
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const [hoveredHub, setHoveredHub] = useState("");
  const [insight, setInsight] = useState("");
  const [insightLoading, setInsightLoading] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [localTimeNow, setLocalTimeNow] = useState("");
  const [isMobile, setIsMobile] = useState(() => (typeof window !== "undefined" ? window.innerWidth < 600 : false));
  const [animatedDevCount, setAnimatedDevCount] = useState("0");
  const [countryTooltip, setCountryTooltip] = useState(null);

  const GITMAP_STYLES = `
  .gm-overlay{position:fixed;inset:0;z-index:9999;background:#000;overflow:hidden;color:#dff7ff}
  .gm-overlay.closing{animation:gm-fade-out .4s ease forwards}
  .gm-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(0,220,255,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(0,220,255,.08) 1px,transparent 1px);background-size:42px 42px;opacity:.18;pointer-events:none}
  .gm-open{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;text-align:center;cursor:default;transition:background .8s ease}
  .gm-open.step-0{background:#000}
  .gm-open.step-1,.gm-open.step-2,.gm-open.step-3{background:#060b12}
  .gm-scan-line{position:absolute;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,#ffffff,transparent);animation:gm-scan-down .5s linear forwards}
  .gm-open-world{position:absolute;inset:0;opacity:0;animation:gm-world-fade .4s ease forwards;pointer-events:none}
  .gm-open-world path{fill:none;stroke:rgba(255,255,255,.24);stroke-width:1.2}
  .gm-kicker{font-family:'Share Tech Mono',monospace;font-size:.65rem;letter-spacing:.2em;color:rgba(0,220,255,.45);margin-bottom:14px}
  .gm-scan-bars{display:flex;flex-direction:column;gap:6px;align-items:center}
  .gm-scan-bars span{width:120px;height:2px;background:rgba(0,220,255,.3);display:block;animation:gm-bars 1.2s linear infinite}
  .gm-scan-bars span:nth-child(2){animation-delay:.2s}
  .gm-scan-bars span:nth-child(3){animation-delay:.4s}
  .gm-acquired{font-family:'Orbitron',monospace;font-size:.9rem;color:#39ff14;letter-spacing:.12em;margin-bottom:12px}
  .gm-place{font-family:'Orbitron',monospace;font-size:1.8rem;letter-spacing:.1em;color:#fff;line-height:1.2;min-height:2.2em}
  .gm-coords{font-family:'Share Tech Mono',monospace;font-size:.85rem;color:rgba(0,220,255,.56);letter-spacing:.12em;min-height:1.4em;margin-top:4px}
  .gm-signal-line{font-family:'Share Tech Mono',monospace;font-size:.68rem;color:rgba(0,220,255,.5);letter-spacing:.14em;margin-top:16px;min-height:1.2em}
  .gm-signal-track{width:220px;height:4px;border-radius:999px;background:rgba(255,255,255,.08);margin-top:8px;overflow:hidden}
  .gm-signal-fill{height:100%;border-radius:999px;transition:width .8s ease}
  .gm-hint{position:absolute;left:50%;bottom:26px;transform:translateX(-50%);font-family:'Share Tech Mono',monospace;font-size:.63rem;letter-spacing:.2em;color:rgba(0,220,255,.5);animation:gm-pulse 1.25s ease-in-out infinite}
  .gm-skip{position:absolute;top:14px;right:14px;border:1px solid rgba(0,220,255,.3);background:transparent;color:rgba(0,220,255,.6);font-family:'Share Tech Mono',monospace;font-size:.58rem;letter-spacing:.1em;padding:6px 8px;cursor:pointer}
  .gm-main{position:absolute;inset:0;display:flex;flex-direction:column;background:#060b12}
  .gm-topbar{height:48px;display:flex;align-items:center;justify-content:space-between;padding:0 16px;border-bottom:1px solid rgba(0,220,255,.14);background:rgba(4,14,26,.94);z-index:2}
  .gm-title{font-family:'Orbitron',monospace;font-size:.72rem;letter-spacing:.14em;color:rgba(0,220,255,.75)}
  .gm-exit{border:1px solid rgba(255,120,120,.4);background:transparent;color:#ff9b9b;font-family:'Orbitron',monospace;font-size:.62rem;letter-spacing:.08em;padding:7px 10px;cursor:pointer}
  .gm-map-wrap{position:relative;height:60vh;min-height:260px;border-bottom:1px solid rgba(0,220,255,.12);overflow:hidden}
  .gm-map-svg{width:100%;height:100%;display:block}
  .gm-map-scan{position:absolute;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(0,220,255,.15),transparent);animation:gm-map-scan 4s linear infinite;pointer-events:none}
  .gm-map-layer{transform-box:fill-box;transition:transform 1.2s cubic-bezier(.2,.8,.2,1),opacity .6s ease}
  .gm-map-tooltip{position:fixed;z-index:6;padding:6px 8px;border:1px solid rgba(0,220,255,.3);background:rgba(4,14,26,.96);font-family:'Share Tech Mono',monospace;font-size:11px;color:#00dcff;pointer-events:none;white-space:nowrap}
  .gm-country{fill:rgba(0,220,255,.04);stroke:rgba(0,220,255,.15);stroke-width:.5;transition:fill .2s ease}
  .gm-country:hover{fill:rgba(0,220,255,.18)}
  .gm-country-active{fill:rgba(0,220,255,.25)!important;stroke:rgba(0,220,255,.6)!important;stroke-width:1.5}
  .gm-country-flow{fill:none;stroke:rgba(0,220,255,.3);stroke-width:1.2;stroke-dasharray:4 8;animation:gm-dash 2s linear infinite}
  .gm-ripple{fill:none;stroke:#00dcff;stroke-width:1;animation:gm-ripple 2.4s ease-out infinite}
  .gm-ripple.r2{animation-delay:.8s}
  .gm-ripple.r3{animation-delay:1.6s}
  .gm-beacon-dot{fill:#00dcff;filter:drop-shadow(0 0 6px #00dcff);animation:gm-dot-pulse 1.5s ease-in-out infinite}
  .gm-beacon-label{font-family:'Share Tech Mono',monospace;font-size:10px;fill:#00dcff;filter:drop-shadow(0 0 8px rgba(0,220,255,.8))}
  .gm-panel{position:relative;background:rgba(4,14,26,.95);border-top:1px solid rgba(0,220,255,.12);padding:20px 20px 120px;overflow:auto;flex:1}
  .gm-grid3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
  .gm-card{border:1px solid rgba(0,220,255,.2);border-radius:8px;background:rgba(7,18,30,.88);padding:14px 14px 12px}
  .gm-card-label{font-family:'Share Tech Mono',monospace;font-size:.6rem;letter-spacing:.16em;color:rgba(0,220,255,.45);margin-bottom:10px}
  .gm-city{font-family:'Orbitron',monospace;font-size:1.2rem;color:#fff;letter-spacing:.06em}
  .gm-country{font-family:'Share Tech Mono',monospace;font-size:.74rem;color:rgba(0,220,255,.6)}
  .gm-small{font-family:'Share Tech Mono',monospace;font-size:.62rem;color:rgba(200,232,255,.6);letter-spacing:.08em}
  .gm-row{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:8px}
  .gm-signal-chip{font-family:'Orbitron',monospace;font-size:1.4rem;letter-spacing:.05em}
  .gm-density{display:flex;gap:3px;align-items:flex-end;height:16px}
  .gm-density span{width:4px;border-radius:1px;background:rgba(255,255,255,.15)}
  .gm-fact{margin-top:10px;font-family:'Rajdhani',sans-serif;font-size:.9rem;line-height:1.45;color:rgba(200,232,255,.72)}
  .gm-table{display:flex;flex-direction:column;gap:8px;margin-top:2px}
  .gm-tr{display:grid;grid-template-columns:1fr auto auto auto auto;gap:8px;align-items:center;font-family:'Share Tech Mono',monospace;font-size:.58rem;color:rgba(200,232,255,.76)}
  .gm-chip-you{border:1px solid rgba(0,220,255,.4);padding:2px 6px;border-radius:999px;color:#00dcff}
  .gm-chip-region{border:1px solid rgba(255,255,255,.22);padding:2px 6px;border-radius:999px;color:rgba(220,235,255,.7)}
  .gm-insight{margin-top:12px;font-family:'Share Tech Mono',monospace;font-size:.64rem;line-height:1.55;color:rgba(200,232,255,.64);font-style:italic}
  .gm-broadcast{margin-top:14px;border:1px solid rgba(0,220,255,.2);border-radius:8px;background:rgba(6,16,28,.9);padding:16px}
  .gm-broadcast-line{font-family:'Share Tech Mono',monospace;font-size:.6rem;color:rgba(0,220,255,.45);letter-spacing:.16em;margin-bottom:10px}
  .gm-broadcast-visual{width:100%;height:170px;display:block}
  .gm-broadcast-path{fill:none;stroke:rgba(0,220,255,.2);stroke-width:2}
  .gm-arc{fill:none;stroke:rgba(0,220,255,.28);stroke-width:1.3;stroke-dasharray:4 6;animation:gm-dash 2s linear infinite}
  .gm-link{fill:none;stroke:rgba(0,220,255,.2);stroke-width:1;stroke-dasharray:3 5;animation:gm-dash 1.6s linear infinite}
  .gm-hub-dot{fill:#00dcff}
  .gm-hub-dot.active{fill:#ffd700;filter:drop-shadow(0 0 6px rgba(255,215,0,.85))}
  .gm-hub-name{font-family:'Share Tech Mono',monospace;font-size:8px;fill:rgba(0,220,255,.62)}
  .gm-broadcast-copy{margin-top:8px;font-family:'Share Tech Mono',monospace;font-size:.64rem;color:rgba(0,220,255,.62);letter-spacing:.12em;text-align:center}
  .gm-footer{position:fixed;left:0;right:0;bottom:0;display:flex;justify-content:space-between;align-items:center;gap:10px;background:rgba(4,14,26,.98);border-top:1px solid rgba(0,220,255,.1);padding:12px 24px;z-index:8}
  .gm-footer-left{font-family:'Share Tech Mono',monospace;font-size:.56rem;letter-spacing:.07em;color:rgba(0,220,255,.55)}
  .gm-footer-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}
  .gm-btn{background:linear-gradient(135deg,rgba(0,220,255,.12),rgba(179,71,234,.12));border:1px solid rgba(0,220,255,.4);color:#00dcff;font-family:'Orbitron',monospace;font-size:.62rem;letter-spacing:.1em;padding:8px 10px;cursor:pointer}
  .gm-btn.close{border-color:rgba(255,120,120,.4);color:#ff9b9b;background:linear-gradient(135deg,rgba(255,70,70,.15),rgba(80,20,20,.3))}
  .gm-returning{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.82);font-family:'Share Tech Mono',monospace;font-size:.75rem;letter-spacing:.2em;color:#fff;animation:gm-return-fade .6s ease forwards;pointer-events:none}

  @media (max-width:900px){.gm-grid3{grid-template-columns:1fr;}}
  @media (max-width:600px){
    .gm-map-wrap{height:45vw;min-height:200px}
    .gm-broadcast-visual{display:none}
    .gm-footer{padding:10px 12px;flex-direction:column;align-items:flex-start}
    .gm-footer-actions{width:100%;justify-content:flex-start}
    .gm-place{font-size:clamp(1.1rem,6vw,1.45rem)}
  }

  @keyframes gm-scan-down{from{top:0}to{top:100%}}
  @keyframes gm-world-fade{from{opacity:0}to{opacity:.06}}
  @keyframes gm-bars{0%{transform:scaleX(.1);opacity:.25}50%{transform:scaleX(1);opacity:1}100%{transform:scaleX(.1);opacity:.25}}
  @keyframes gm-pulse{0%,100%{opacity:.3}50%{opacity:.8}}
  @keyframes gm-map-scan{0%{top:0}100%{top:100%}}
  @keyframes gm-dash{from{stroke-dashoffset:0}to{stroke-dashoffset:-42}}
  @keyframes gm-ripple{0%{r:4;opacity:.8;stroke-width:2}100%{r:50;opacity:0;stroke-width:.5}}
  @keyframes gm-dot-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.4)}}
  @keyframes gm-fade-out{0%{opacity:1}100%{opacity:0;background:#000}}
  @keyframes gm-return-fade{0%{opacity:0}30%{opacity:1}100%{opacity:0}}
  `;

  const resolveFallbackGeo = (locationText) => {
    const lower = String(locationText || "").toLowerCase();
    for (const key of Object.keys(CITY_COORDS)) {
      if (lower.includes(key)) {
        const [lat, lon] = CITY_COORDS[key];
        return {
          lat,
          lon,
          displayName: locationText || key,
          country: "Unknown",
          countryCode: "DEFAULT",
          city: key.replace(/\b\w/g, (char) => char.toUpperCase()),
        };
      }
    }
    return {
      lat: 20,
      lon: 0,
      displayName: locationText || "Unknown location",
      country: "Unknown",
      countryCode: "DEFAULT",
      city: (locationText || "Unknown").toString(),
    };
  };

  const geocodeLocation = async () => {
    const userKey = String(user?.login || "unknown").toLowerCase();
    const locationText = String(user?.location || "").trim();
    if (!locationText) return resolveFallbackGeo("Unknown");

    if (geocodeRef.current.has(userKey)) return geocodeRef.current.get(userKey);
    if (GITMAP_GEOCODE_CACHE.has(userKey)) {
      const cached = GITMAP_GEOCODE_CACHE.get(userKey);
      geocodeRef.current.set(userKey, cached);
      return cached;
    }

    let resolved = null;
    try {
      const endpoint = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationText)}&format=json&limit=1&addressdetails=1`;
      const response = await fetch(endpoint, {
        headers: {
          "User-Agent": "GitDNA-App/1.0",
          Accept: "application/json",
        },
      });
      if (response.ok) {
        const json = await response.json();
        const row = Array.isArray(json) ? json[0] : null;
        if (row && row.lat && row.lon) {
          const address = row.address || {};
          resolved = {
            lat: Number.parseFloat(row.lat),
            lon: Number.parseFloat(row.lon),
            displayName: row.display_name || locationText,
            country: address.country || "Unknown",
            countryCode: String(address.country_code || "DEFAULT").toUpperCase(),
            city: address.city || address.town || address.state || locationText,
          };
        }
      }
    } catch {
      // Continue to fallback coordinates.
    }

    if (!resolved || !Number.isFinite(resolved.lat) || !Number.isFinite(resolved.lon)) {
      resolved = resolveFallbackGeo(locationText);
    }

    geocodeRef.current.set(userKey, resolved);
    GITMAP_GEOCODE_CACHE.set(userKey, resolved);
    return resolved;
  };

  const countryStats = COUNTRY_DEV_DATA[String(geo?.countryCode || "DEFAULT").toUpperCase()] || COUNTRY_DEV_DATA.DEFAULT;
  const timezone = inferTimezone(geo?.countryCode);

  const signalColor = countryStats.signal > 80 ? "#39ff14" : countryStats.signal > 60 ? "#00dcff" : "#ffb300";
  const rankColor = typeof countryStats.rank === "number"
    ? (countryStats.rank <= 3 ? "#FFD700" : countryStats.rank <= 7 ? "#b347ea" : "#00dcff")
    : "#00dcff";

  const formatCardinal = (lat, lon) => {
    const latText = `${Math.abs(lat).toFixed(4)}°${lat >= 0 ? "N" : "S"}`;
    const lonText = `${Math.abs(lon).toFixed(4)}°${lon >= 0 ? "E" : "W"}`;
    return `${latText}  ${lonText}`;
  };

  const coordsText = formatCardinal(geo.lat, geo.lon);

  const parseCompactCount = (value) => {
    const text = String(value || "").trim().toUpperCase();
    if (!text || text === "UNKNOWN") return null;
    if (text.endsWith("M")) return Number.parseFloat(text.slice(0, -1)) * 1_000_000;
    if (text.endsWith("K")) return Number.parseFloat(text.slice(0, -1)) * 1_000;
    const parsed = Number.parseFloat(text.replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  };

  const formatCompactCount = (value) => {
    if (!Number.isFinite(value)) return "Unknown";
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
    return `${Math.round(value)}`;
  };

  const getLocalHourFromUtc = (utcHour, tz) => {
    const safeHour = Number.isFinite(Number(utcHour)) ? Number(utcHour) : 12;
    const date = new Date(Date.UTC(2024, 0, 1, safeHour, 0, 0));
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "2-digit",
      hourCycle: "h23",
    }).formatToParts(date);
    const hourPart = parts.find((part) => part.type === "hour")?.value;
    return Number.isFinite(Number(hourPart)) ? Number(hourPart) : 12;
  };

  const localCommitHour = getLocalHourFromUtc(avgCommitHour, timezone);
  const commitChrono = localCommitHour <= 5
    ? "MIDNIGHT CODER 🌑"
    : localCommitHour <= 11
      ? "MORNING BUILDER 🌅"
      : localCommitHour <= 17
        ? "DAYSHIFT DEV ☀"
        : "EVENING ENGINEER 🌆";

  const densityBars = countryStats.devDensity === "EXTREME"
    ? [1, 1, 1, 1, 1]
    : countryStats.devDensity === "HIGH"
      ? [1, 1, 1, 1, 0]
      : countryStats.devDensity === "MEDIUM"
        ? [1, 1, 1, 0, 0]
        : [1, 1, 0, 0, 0];

  const baseline = GITMAP_REGION_BASELINES[String(geo?.countryCode || "DEFAULT").toUpperCase()] || GITMAP_REGION_BASELINES.DEFAULT;
  const starsWin = Number(totalStars || 0) >= baseline.stars;
  const commitsWin = Number(recentCommits || 0) >= baseline.commits;
  const languageAligned = String(topLang || "").toLowerCase() === String(countryStats.topLang || "").toLowerCase();
  const veteranThreshold = 3;
  const accountAgeNumber = Number(accountAge || 0);
  const accountAgeWin = accountAgeNumber >= veteranThreshold;

  const emitInsightFallback = () => {
    const lang = topLang || "JavaScript";
    return `${lang} from ${geo.city}, ${geo.country} with ${totalStars} stars and ${accountAge} years shows a ${starsWin ? "strong" : "growing"} signal against regional baselines.`;
  };

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => setSequenceStep(1), 400);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setGeocodeLoading(true);
    setGeocodeReady(false);
    const timeout = setTimeout(() => setScanTimeoutReached(true), 3000);

    geocodeLocation()
      .then((result) => {
        if (cancelled) return;
        setGeo(result);
      })
      .finally(() => {
        if (cancelled) return;
        setGeocodeLoading(false);
        setGeocodeReady(true);
      });

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [user?.login, user?.location]);

  useEffect(() => {
    if (sequenceStep !== 1) return;
    if (!geocodeReady && !scanTimeoutReached) return;
    const timeout = setTimeout(() => setSequenceStep(2), 80);
    return () => clearTimeout(timeout);
  }, [sequenceStep, geocodeReady, scanTimeoutReached]);

  useEffect(() => {
    if (sequenceStep !== 2) return;
    setTypedPlace("");
    setTypedCoords("");

    const placeText = `${geo.city}, ${geo.country}`;
    const coords = coordsText;
    let placeIndex = 0;
    let coordsIndex = 0;
    let placeTimer = null;
    let coordsTimer = null;

    const startCoords = () => {
      coordsTimer = setInterval(() => {
        coordsIndex += 1;
        setTypedCoords(coords.slice(0, coordsIndex));
        if (coordsIndex >= coords.length) {
          clearInterval(coordsTimer);
          setTimeout(() => setSequenceStep(3), 800);
        }
      }, 16);
    };

    const signalDelay = setTimeout(() => {
      placeTimer = setInterval(() => {
        placeIndex += 1;
        setTypedPlace(placeText.slice(0, placeIndex));
        if (placeIndex >= placeText.length) {
          clearInterval(placeTimer);
          startCoords();
        }
      }, 24);
    }, 600);

    return () => {
      clearTimeout(signalDelay);
      if (placeTimer) clearInterval(placeTimer);
      if (coordsTimer) clearInterval(coordsTimer);
    };
  }, [sequenceStep, geo.city, geo.country, coordsText]);

  useEffect(() => {
    if (sequenceStep !== 3) return;
    const text = `SIGNAL STRENGTH: ${countryStats.signal}/100`;
    setTypedSignal("");
    let index = 0;
    const timer = setInterval(() => {
      index += 1;
      setTypedSignal(text.slice(0, index));
      if (index >= text.length) clearInterval(timer);
    }, 18);
    return () => clearInterval(timer);
  }, [sequenceStep, countryStats.signal]);

  useEffect(() => {
    if (showMainMap || sequenceStep < 3) return;
    const onKeyDown = (event) => {
      if (event.code !== "Space") return;
      event.preventDefault();
      setShowMainMap(true);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showMainMap, sequenceStep]);

  useEffect(() => {
    let cancelled = false;
    setCartographyLoading(true);
    setCartographyFailed(false);
    loadGitMapCartography()
      .then((data) => {
        if (cancelled) return;
        setCountries(Array.isArray(data.features) ? data.features : []);
        setCountryNames(data.nameById instanceof Map ? data.nameById : new Map());
        setCartographyReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        setCartographyReady(false);
        setCartographyFailed(true);
      })
      .finally(() => {
        if (!cancelled) setCartographyLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const mapData = useMemo(() => {
    if (!cartographyReady || !countries.length) {
      return null;
    }

    try {
      const width = 1000;
      const height = 520;
      const projection = geoNaturalEarth1().fitSize(
        [width, height],
        { type: "FeatureCollection", features: countries },
      );
      const pathFactory = geoPath(projection);
      const beacon = projection([geo.lon, geo.lat]) || [width / 2, height / 2];

      let activeCountryId = null;
      for (const feature of countries) {
        if (geoContains(feature, [geo.lon, geo.lat])) {
          activeCountryId = String(feature.id);
          break;
        }
      }

      const paths = countries.map((feature) => {
        const id = String(feature.id);
        return {
          id,
          d: pathFactory(feature) || "",
          name: countryNames.get(id) || `Country ${id}`,
        };
      });

      return { width, height, beacon, paths, activeCountryId };
    } catch {
      return null;
    }
  }, [cartographyReady, countries, countryNames, geo.lat, geo.lon]);

  useEffect(() => {
    if (!showMainMap) return;
    const timeout = setTimeout(() => setMapEntered(true), 40);
    return () => clearTimeout(timeout);
  }, [showMainMap]);

  useEffect(() => {
    if (!showMainMap) return;
    const timezoneValue = inferTimezone(geo.countryCode);
    const updateTime = () => {
      try {
        const value = new Date().toLocaleTimeString("en-US", {
          timeZone: timezoneValue,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
        setLocalTimeNow(value);
      } catch {
        setLocalTimeNow(new Date().toUTCString().slice(17, 25));
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [showMainMap, geo.countryCode]);

  useEffect(() => {
    if (!showMainMap) return;
    const target = parseCompactCount(countryStats.devCount);
    if (!Number.isFinite(target)) {
      setAnimatedDevCount(countryStats.devCount);
      return;
    }

    let start = null;
    let raf = 0;
    const duration = 1100;
    const tick = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = target * eased;
      setAnimatedDevCount(formatCompactCount(value));
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setAnimatedDevCount(countryStats.devCount);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [showMainMap, countryStats.devCount]);

  useEffect(() => {
    if (!showMainMap) return;
    const insightKey = `${user?.login || "unknown"}:${geo.countryCode}:${topLang || "unknown"}:${totalStars}:${accountAge}`;
    if (insightRef.current.has(insightKey)) {
      setInsight(insightRef.current.get(insightKey));
      return;
    }
    if (GITMAP_INSIGHT_CACHE.has(insightKey)) {
      const cached = GITMAP_INSIGHT_CACHE.get(insightKey);
      insightRef.current.set(insightKey, cached);
      setInsight(cached);
      return;
    }

    let cancelled = false;
    setInsightLoading(true);
    fetch(`${API_URL}/api/gitmap-insight`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        username: user?.login || "unknown",
        city: geo.city,
        country: geo.country,
        topLang: topLang || "JavaScript",
        totalStars: Number(totalStars || 0),
        accountAge: Number(accountAge || 0),
        recentCommits: Number(recentCommits || 0),
      }),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Failed to fetch insight");
        return response.json();
      })
      .then((payload) => {
        if (cancelled) return;
        const text = String(payload?.insight || "").trim() || emitInsightFallback();
        insightRef.current.set(insightKey, text);
        GITMAP_INSIGHT_CACHE.set(insightKey, text);
        setInsight(text);
      })
      .catch(() => {
        if (cancelled) return;
        const fallbackText = emitInsightFallback();
        insightRef.current.set(insightKey, fallbackText);
        GITMAP_INSIGHT_CACHE.set(insightKey, fallbackText);
        setInsight(fallbackText);
      })
      .finally(() => {
        if (!cancelled) setInsightLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [showMainMap, API_URL, user?.login, geo.city, geo.country, geo.countryCode, topLang, totalStars, accountAge, recentCommits]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setIsMobile(window.innerWidth < 600);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
    };
  }, []);

  const closeGitMap = () => {
    if (isClosing) return;
    setIsClosing(true);
    setShowReturning(true);
    closeTimeoutRef.current = setTimeout(() => {
      onClose?.();
    }, 600);
  };

  const onShare = async () => {
    const summary = `@${user?.login || "unknown"} is transmitting from ${geo.city}, ${geo.country}. #${countryStats.rank} developer nation globally. ${countryStats.devCount} devs and counting. gitdna.vercel.app #GitDNA #GitMap`;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(summary);
      }
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 1600);
    } catch {
      // Ignore clipboard failures.
    }
  };

  const broadcastX = (() => {
    const lon = Number(geo.lon || 0);
    return Math.max(20, Math.min(980, ((lon + 180) / 360) * 960 + 20));
  })();

  const densityColor = countryStats.devDensity === "EXTREME"
    ? "#FFD700"
    : countryStats.devDensity === "HIGH"
      ? "#00dcff"
      : countryStats.devDensity === "MEDIUM"
        ? "#39ff14"
        : "#ffb300";

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className={`gm-overlay${isClosing ? " closing" : ""}`}>
      <style>{GITMAP_STYLES}</style>

      {!showMainMap ? (
        <div className={`gm-open step-${sequenceStep}`} onClick={() => sequenceStep >= 3 && setShowMainMap(true)}>
          {sequenceStep === 0 && (
            <>
              <div className="gm-scan-line" />
              <svg className="gm-open-world" viewBox="0 0 1000 400" aria-hidden="true">
                <path d="M30 210 C 100 180, 180 240, 260 210 C 330 190, 410 235, 490 205 C 560 186, 640 220, 730 198 C 810 176, 880 214, 970 196" />
                <path d="M90 170 C 150 146, 210 194, 280 174 C 360 150, 430 186, 520 166 C 600 149, 670 180, 760 160 C 830 145, 900 170, 950 156" />
              </svg>
            </>
          )}

          {sequenceStep >= 1 && <div className="gm-grid" />}

          {sequenceStep === 1 && (
            <>
              <div className="gm-kicker">INITIALIZING GEOGRAPHIC SCAN</div>
              <div className="gm-scan-bars" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
            </>
          )}

          {sequenceStep === 2 && (
            <>
              <div className="gm-acquired">SIGNAL ACQUIRED</div>
              <div className="gm-place">{typedPlace}</div>
              <div className="gm-coords">{typedCoords}</div>
            </>
          )}

          {sequenceStep >= 3 && (
            <>
              <div className="gm-signal-line">{typedSignal}</div>
              <div className="gm-signal-track">
                <div className="gm-signal-fill" style={{ width: `${countryStats.signal}%`, background: signalColor }} />
              </div>
              <div className="gm-hint">PRESS SPACE OR CLICK TO VIEW MAP</div>
            </>
          )}

          {sequenceStep >= 1 && (
            <button
              className="gm-skip"
              onClick={(event) => {
                event.stopPropagation();
                setShowMainMap(true);
              }}
            >
              SKIP ›
            </button>
          )}
        </div>
      ) : (
        <div className="gm-main">
          <div className="gm-topbar">
            <div className="gm-title">MISSION CONTROL // GITMAP</div>
            <button className="gm-exit" onClick={closeGitMap}>✕ EXIT GITMAP</button>
          </div>

          <div className="gm-map-wrap">
            {cartographyLoading && (
              <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontFamily: "Share Tech Mono,monospace", fontSize: "0.7rem", letterSpacing: "0.2em", color: "rgba(0,220,255,0.5)" }}>
                LOADING CARTOGRAPHIC DATA...
              </div>
            )}

            {!cartographyLoading && (cartographyFailed || !mapData) && (
              <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", padding: 20 }}>
                <div className="gm-card" style={{ maxWidth: 560 }}>
                  <div className="gm-card-label">MAP DATA UNAVAILABLE — SIGNAL STATS ACTIVE</div>
                  <div className="gm-city">{geo.city}</div>
                  <div className="gm-country">{geo.country}</div>
                  <div className="gm-small" style={{ marginTop: 8 }}>{coordsText}</div>
                  <div className="gm-row" style={{ marginTop: 10 }}>
                    <span className="gm-small">SIGNAL STRENGTH</span>
                    <span className="gm-small" style={{ color: signalColor }}>{countryStats.signal}/100</span>
                  </div>
                  <div className="gm-signal-track" style={{ width: "100%" }}>
                    <div className="gm-signal-fill" style={{ width: `${countryStats.signal}%`, background: signalColor }} />
                  </div>
                </div>
              </div>
            )}

            {!cartographyLoading && !cartographyFailed && mapData && (
              <>
                <svg className="gm-map-svg" viewBox={`0 0 ${mapData.width} ${mapData.height}`}>
                  <g
                    className="gm-map-layer"
                    style={{
                      transformOrigin: `${mapData.beacon[0]}px ${mapData.beacon[1]}px`,
                      transform: mapEntered ? "scale(1)" : "scale(1.8)",
                      opacity: mapEntered ? 1 : 0,
                    }}
                  >
                    {mapData.paths.map((country) => (
                      <path
                        key={`country-${country.id}`}
                        d={country.d}
                        className={`gm-country${country.id === mapData.activeCountryId ? " gm-country-active" : ""}`}
                        onMouseMove={(event) => {
                          setCountryTooltip({
                            name: country.id === mapData.activeCountryId ? (geo.country || country.name) : country.name,
                            x: event.clientX,
                            y: event.clientY,
                          });
                        }}
                        onMouseLeave={() => setCountryTooltip(null)}
                      />
                    ))}

                    {mapData.activeCountryId && (
                      <path
                        d={mapData.paths.find((item) => item.id === mapData.activeCountryId)?.d || ""}
                        className="gm-country-flow"
                      />
                    )}

                    <circle cx={mapData.beacon[0]} cy={mapData.beacon[1]} r="4" className="gm-ripple" />
                    <circle cx={mapData.beacon[0]} cy={mapData.beacon[1]} r="4" className="gm-ripple r2" />
                    <circle cx={mapData.beacon[0]} cy={mapData.beacon[1]} r="4" className="gm-ripple r3" />

                    <circle cx={mapData.beacon[0]} cy={mapData.beacon[1]} r="5" className="gm-beacon-dot" />
                    <line x1={mapData.beacon[0]} y1={mapData.beacon[1] - 5} x2={mapData.beacon[0]} y2={mapData.beacon[1] - 18} stroke="rgba(0,220,255,.6)" strokeWidth="1" />
                    <text x={mapData.beacon[0]} y={mapData.beacon[1] - 22} textAnchor="middle" className="gm-beacon-label">{geo.city}</text>
                  </g>
                </svg>
                <div className="gm-map-scan" />
              </>
            )}

            {countryTooltip && (
              <div className="gm-map-tooltip" style={{ left: countryTooltip.x + 10, top: countryTooltip.y + 10 }}>
                {countryTooltip.name}
              </div>
            )}
          </div>

          <div className="gm-panel">
            <div className="gm-grid3">
              <div className="gm-card">
                <div className="gm-card-label">// ORIGIN NODE</div>
                <div className="gm-city">{geo.city}</div>
                <div className="gm-country">{geo.country}</div>
                <div className="gm-small" style={{ marginTop: 6 }}>{coordsText}</div>
                <div className="gm-row">
                  <span className="gm-small">SIGNAL STRENGTH</span>
                  <span className="gm-small" style={{ color: signalColor }}>{countryStats.signal}/100</span>
                </div>
                <div className="gm-signal-track" style={{ width: "100%", marginTop: 4 }}>
                  <div className="gm-signal-fill" style={{ width: `${countryStats.signal}%`, background: signalColor }} />
                </div>
                <div className="gm-row"><span className="gm-small">TIMEZONE</span><span className="gm-small">{countryStats.timezoneName}</span></div>
                <div className="gm-row"><span className="gm-small">LOCAL TIME NOW</span><span className="gm-small">{localTimeNow || "--:--:--"}</span></div>
                <div className="gm-row"><span className="gm-small">COMMITS IN LOCAL TIME</span><span className="gm-small">{String(localCommitHour).padStart(2, "0")}:00</span></div>
                <div className="gm-fact" style={{ marginTop: 6 }}>{commitChrono}</div>
              </div>

              <div className="gm-card">
                <div className="gm-card-label">// REGIONAL ECOSYSTEM</div>
                <div className="gm-signal-chip" style={{ color: rankColor }}>#{countryStats.rank} DEVELOPER NATION</div>
                <div className="gm-small" style={{ marginTop: 4 }}>{animatedDevCount} ACTIVE DEVELOPERS</div>

                <div style={{ marginTop: 10 }}>
                  {[
                    { label: countryStats.topLang, pct: 85 },
                    { label: countryStats.topLang2, pct: 65 },
                    { label: countryStats.topLang3, pct: 45 },
                  ].map((lang, index) => (
                    <div key={`gm-lang-${lang.label}-${index}`} style={{ marginBottom: 7 }}>
                      <div className="gm-row" style={{ marginTop: 0 }}>
                        <span className="gm-small">{lang.label}</span>
                        <span className="gm-small">{lang.pct}%</span>
                      </div>
                      <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,.05)", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${lang.pct}%`, background: `linear-gradient(90deg,${getLangColor(lang.label)}88,${getLangColor(lang.label)})`, animation: `bar-expand .8s cubic-bezier(.2,.8,.2,1) ${index * 120}ms both`, "--w": `${lang.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 6, border: "1px solid rgba(255,179,0,.45)", color: "#ffb300", padding: "3px 8px", borderRadius: 999, fontFamily: "Share Tech Mono,monospace", fontSize: "0.6rem", letterSpacing: "0.11em", animation: "gm-pulse 1.4s ease-in-out infinite" }}>
                  RISING IN {geo.country.toUpperCase()}: {countryStats.risingTech}
                </div>

                <div className="gm-row" style={{ marginTop: 10 }}>
                  <span className="gm-small">DEVELOPER DENSITY: {countryStats.devDensity}</span>
                  <span className="gm-density" aria-hidden="true">
                    {densityBars.map((on, index) => (
                      <span key={`bar-${index}`} style={{ height: 4 + index * 2, background: on ? densityColor : "rgba(255,255,255,.15)" }} />
                    ))}
                  </span>
                </div>
                <div className="gm-fact">{countryStats.funFact}</div>
              </div>

              <div className="gm-card">
                <div className="gm-card-label">// YOUR SIGNAL vs REGION</div>
                <div className="gm-table">
                  <div className="gm-tr">
                    <span>STARS EARNED</span>
                    <span>{totalStars}</span>
                    <span>vs</span>
                    <span>{baseline.stars}</span>
                    <span className={starsWin ? "gm-chip-you" : "gm-chip-region"}>{starsWin ? "▲ YOU" : "◎ REGION"}</span>
                  </div>
                  <div className="gm-tr">
                    <span>COMMIT FREQUENCY</span>
                    <span>{recentCommits}</span>
                    <span>vs</span>
                    <span>{baseline.commits}</span>
                    <span className={commitsWin ? "gm-chip-you" : "gm-chip-region"}>{commitsWin ? "▲ YOU" : "◎ REGION"}</span>
                  </div>
                  <div className="gm-tr">
                    <span>LANGUAGE MATCH</span>
                    <span>{topLang || "Unknown"}</span>
                    <span>vs</span>
                    <span>{countryStats.topLang}</span>
                    <span className={languageAligned ? "gm-chip-you" : "gm-chip-region"}>{languageAligned ? "ALIGNED" : "UNIQUE"}</span>
                  </div>
                  <div className="gm-tr">
                    <span>ACCOUNT AGE</span>
                    <span>{accountAge}y</span>
                    <span>vs</span>
                    <span>{veteranThreshold}y</span>
                    <span className={accountAgeWin ? "gm-chip-you" : "gm-chip-region"}>{accountAgeWin ? "▲ YOU" : "◎ REGION"}</span>
                  </div>
                </div>
                <div className="gm-insight">
                  {insightLoading ? "Computing regional comparison insight..." : insight}
                </div>
              </div>
            </div>

            <div className="gm-broadcast">
              <div className="gm-broadcast-line">// DEV SIGNAL BROADCAST</div>

              {!isMobile && (
                <svg className="gm-broadcast-visual" viewBox="0 0 1000 170" aria-hidden="true">
                  <path className="gm-broadcast-path" d="M20 90 C 120 78, 220 102, 320 89 C 430 74, 540 104, 640 87 C 740 74, 850 102, 980 88" />

                  {[80, 140, 200].map((distance, index) => (
                    <path
                      key={`arc-r-${distance}`}
                      className="gm-arc"
                      style={{ opacity: 0.45 - index * 0.12 }}
                      d={`M ${broadcastX} 90 Q ${broadcastX + distance / 2} ${90 - (26 + index * 10)} ${broadcastX + distance} 90`}
                    />
                  ))}
                  {[80, 140, 200].map((distance, index) => (
                    <path
                      key={`arc-l-${distance}`}
                      className="gm-arc"
                      style={{ opacity: 0.45 - index * 0.12 }}
                      d={`M ${broadcastX} 90 Q ${broadcastX - distance / 2} ${90 - (26 + index * 10)} ${broadcastX - distance} 90`}
                    />
                  ))}

                  {GITMAP_TECH_HUBS.map((hub) => {
                    const x = Math.max(18, Math.min(980, ((hub.lon + 180) / 360) * 960 + 20));
                    const activeHub = hub.city.toLowerCase() === String(geo.city || "").toLowerCase();
                    return (
                      <g
                        key={`hub-${hub.city}`}
                        onMouseEnter={() => setHoveredHub(hub.city)}
                        onMouseLeave={() => setHoveredHub("")}
                      >
                        <path className="gm-link" d={`M ${broadcastX} 90 Q ${(broadcastX + x) / 2} 62 ${x} 90`} />
                        <circle cx={x} cy={90} r="3" className={`gm-hub-dot${activeHub ? " active" : ""}`} />
                        <text x={x} y={106} textAnchor="middle" className="gm-hub-name">{hub.city}</text>
                      </g>
                    );
                  })}

                  <circle cx={broadcastX} cy={90} r="6" className="gm-beacon-dot" />
                </svg>
              )}

              <div className="gm-broadcast-copy">
                TRANSMITTING FROM {String(geo.city || "Unknown").toUpperCase()} — SIGNAL REACH: GLOBAL
                {hoveredHub ? ` // LINK: ${hoveredHub.toUpperCase()}` : ""}
              </div>
            </div>
          </div>

          <div className="gm-footer">
            <div className="gm-footer-left">
              📡 {geo.city}, {geo.country} — {countryStats.devDensity} DEV ZONE — RANK #{countryStats.rank} GLOBALLY
              {shareCopied ? " // SHARED" : ""}
            </div>
            <div className="gm-footer-actions">
              <button className="gm-btn" onClick={onShare}>↗ SHARE GITMAP</button>
              <button className="gm-btn close" onClick={closeGitMap}>✕ EXIT GITMAP</button>
            </div>
          </div>
        </div>
      )}

      {showReturning && <div className="gm-returning">RETURNING TO PROFILE...</div>}
    </div>,
    document.body,
  );
}

function Dashboard({
  github,
  aiData,
  devScore,
  langs,
  username,
  onReset,
  onCompare,
  compareBusy,
  isFounderState,
  starTier,
  nightOwlToastVisible,
  onNightOwlDismiss,
  ultraMode,
  onRoast,
}) {
  const { user, totalStars, recentCommits, contributions, repos, events = [] } = github;
  const accountAgeYears = (Date.now() - new Date(user.created_at)) / (1000 * 60 * 60 * 24 * 365);
  const acctYears = accountAgeYears.toFixed(1);
  const founderActive = isFounderState || isFounderLogin(user.login);
  const isTorvalds = (user.login || "").toLowerCase() === "torvalds";
  const effectiveDevClass = founderActive ? "THE ORIGIN NODE" : (isTorvalds ? "THE PROGENITOR 🐧" : (aiData?.devClass || "Unknown Archetype"));
  const archetype = aiData?.archetype || { tier: "RISING" };
  const tierMeta = getTierMeta(founderActive ? "LEGENDARY" : archetype.tier);
  const chronotype = aiData?.chronotype || { title: "Unknown", description: "Analysis unavailable." };
  const collab = aiData?.collaborationStyle || { title: "Unknown", description: "Analysis unavailable." };
  const strengthReport = aiData?.strengthReport || "Strength profile unavailable.";
  const warningSign = aiData?.warningSign || "Blindspot profile unavailable.";
  const traits = aiData?.traits;
  const aiFacts = aiData?.fastFacts || [];
  const roastMode = !founderActive && totalStars === 0 && (user.public_repos || 0) < 5;
  const facts = founderActive
    ? FOUNDER_FAST_FACTS
    : (roastMode ? [EMPTY_REPO_ROAST, ...aiFacts.filter((fact) => fact !== EMPTY_REPO_ROAST)].slice(0, 3) : aiFacts);
  const dna = aiData?.dnaSequence || "0000000000000000";
  const roastSectionRef = useRef(null);
  const shareCardRef = useRef(null);
  const shareExportRef = useRef(null);
  const shareFlashTimeoutRef = useRef(null);
  const unlockFlashTimeoutRef = useRef(null);
  const founderBurstTimeoutRef = useRef(null);
  const founderCinematicTimeoutRef = useRef(null);
  const torvaldsGlitchTimeoutRef = useRef(null);
  const longSessionTimeoutRef = useRef(null);
  const starToastShowTimeoutRef = useRef(null);
  const starToastHideTimeoutRef = useRef(null);
  const roastRevealTimerRef = useRef(null);
  const roastMeterTimerRef = useRef(null);
  const roastShareTimerRef = useRef(null);
  const dashboardWakeTimeoutRef = useRef(null);
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);
  const [showCardSaved, setShowCardSaved] = useState(false);
  const [showUnlockFlash, setShowUnlockFlash] = useState(true);
  const [showFounderBurst, setShowFounderBurst] = useState(false);
  const [showFounderCinematic, setShowFounderCinematic] = useState(false);
  const [showTorvaldsGlitch, setShowTorvaldsGlitch] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [opponentUsername, setOpponentUsername] = useState("");
  const [compareError, setCompareError] = useState("");
  const [showLongSessionToast, setShowLongSessionToast] = useState(false);
  const [showStarToast, setShowStarToast] = useState(false);
  const [showRoastWarning, setShowRoastWarning] = useState(false);
  const [isRoasting, setIsRoasting] = useState(false);
  const [roastError, setRoastError] = useState("");
  const [roastReport, setRoastReport] = useState(null);
  const [roastVisibleSteps, setRoastVisibleSteps] = useState(0);
  const [roastMeterValue, setRoastMeterValue] = useState(0);
  const [roastShareCopied, setRoastShareCopied] = useState(false);
  const [showTimeMachine, setShowTimeMachine] = useState(false);
  const [showGitMap, setShowGitMap] = useState(false);
  const [showDashboardWake, setShowDashboardWake] = useState(false);

  const cardEntranceStyle = (index) => ({
    opacity: 0,
    animation: `card-rise .55s cubic-bezier(.2,.8,.2,1) ${320 + index * 80}ms forwards`,
    "--scan-delay": `${index * 150}ms`,
  });

  const profileShareUrl = buildAppUrl(`u=${encodeURIComponent(user.login || username || "")}`);
  const shareLangs = Array.isArray(langs) ? langs.slice(0, 4) : [];
  const shareHighlights = Array.isArray(facts) ? facts.slice(0, 2) : [];
  const shareInitial = ((user.login || user.name || "?").charAt(0) || "?").toUpperCase();
  const shouldShowRoastSection = isRoasting || Boolean(roastReport) || Boolean(roastError);
  const isTimeMachineUnlocked = accountAgeYears >= 1;
  const hasLocationData = Boolean(String(user.location || "").trim());
  const topLang = Array.isArray(langs) && langs[0]?.lang ? langs[0].lang : "Unknown";
  const avgCommitHour = Number.isFinite(Number(github.avg_commit_hour)) ? Number(github.avg_commit_hour) : 12;
  const tierVisualKey = founderActive ? "LEGENDARY" : String(archetype.tier || "RISING").toUpperCase();
  const tierVisual = {
    LEGENDARY: {
      icon: "♛",
      label: "LEGENDARY",
      color: "#FFD700",
      halo: "rgba(255,215,0,0.12)",
      text: "rgba(255,215,0,0.7)",
      barFill: "rgba(255,215,0,0.6)",
    },
    ELITE: {
      icon: "◈",
      label: "ELITE",
      color: "#b347ea",
      halo: "rgba(179,71,234,0.12)",
      text: "rgba(179,71,234,0.7)",
      barFill: "rgba(179,71,234,0.6)",
    },
    VETERAN: {
      icon: "⬡",
      label: "VETERAN",
      color: "#00dcff",
      halo: "rgba(0,220,255,0.12)",
      text: "rgba(0,220,255,0.7)",
      barFill: "rgba(0,220,255,0.6)",
    },
    RISING: {
      icon: "↑",
      label: "RISING",
      color: "#39ff14",
      halo: "rgba(57,255,20,0.12)",
      text: "rgba(57,255,20,0.7)",
      barFill: "rgba(57,255,20,0.6)",
    },
  }[tierVisualKey] || {
    icon: "↑",
    label: "RISING",
    color: "#39ff14",
    halo: "rgba(57,255,20,0.12)",
    text: "rgba(57,255,20,0.7)",
    barFill: "rgba(57,255,20,0.6)",
  };

  const scorePercentileLabel = devScore >= 90
    ? "TOP 1% OF GITHUB"
    : devScore >= 75
      ? "TOP 8% OF GITHUB"
      : devScore >= 60
        ? "TOP 18% OF GITHUB"
        : devScore >= 40
          ? "TOP 35% OF GITHUB"
          : "TOP 60% OF GITHUB";

  const starsPortion = Math.min(30, Math.floor(totalStars / 8));
  const followersPortion = Math.min(20, Math.floor(Math.sqrt(user.followers || 0) * 2));
  const agePortion = Math.min(14, Math.floor(accountAgeYears * 2.5));

  const scoreBreakdown = [
    {
      label: "REPUTATION",
      value: Math.max(0, Math.min(100, Math.round(((starsPortion + followersPortion) / 50) * 100))),
    },
    {
      label: "ACTIVITY",
      value: Math.max(0, Math.min(100, Math.round((Math.min(Number(recentCommits || 0), 30) / 30) * 100))),
    },
    {
      label: "EXPERIENCE",
      value: Math.max(0, Math.min(100, Math.round((agePortion / 14) * 100))),
    },
  ];

  const triggerDashboardWake = () => {
    setShowDashboardWake(true);
    if (dashboardWakeTimeoutRef.current) {
      clearTimeout(dashboardWakeTimeoutRef.current);
    }
    dashboardWakeTimeoutRef.current = setTimeout(() => setShowDashboardWake(false), 220);
  };

  const handleCloseTimeMachine = () => {
    setShowTimeMachine(false);
    triggerDashboardWake();
  };

  const handleCloseGitMap = () => {
    setShowGitMap(false);
    triggerDashboardWake();
  };

  const scrollToRoastSection = (behavior = "smooth") => {
    const roastNode = roastSectionRef.current;
    if (!roastNode) return;
    roastNode.scrollIntoView({ behavior, block: "start" });
  };

  useEffect(() => {
    setShowUnlockFlash(true);
    unlockFlashTimeoutRef.current = setTimeout(() => setShowUnlockFlash(false), 420);

    if (founderActive) {
      setShowFounderBurst(true);
      founderBurstTimeoutRef.current = setTimeout(() => setShowFounderBurst(false), 950);
      setShowFounderCinematic(true);
      founderCinematicTimeoutRef.current = setTimeout(() => setShowFounderCinematic(false), 2000);
    } else {
      setShowFounderBurst(false);
      setShowFounderCinematic(false);
    }

    if (isTorvalds) {
      setShowTorvaldsGlitch(true);
      torvaldsGlitchTimeoutRef.current = setTimeout(() => setShowTorvaldsGlitch(false), 780);
    } else {
      setShowTorvaldsGlitch(false);
    }

    longSessionTimeoutRef.current = setTimeout(() => setShowLongSessionToast(true), 180000);

    if (starTier) {
      starToastShowTimeoutRef.current = setTimeout(() => setShowStarToast(true), 2400);
      starToastHideTimeoutRef.current = setTimeout(
        () => setShowStarToast(false),
        starTier === "elite" ? 6400 : 4400,
      );
    } else {
      setShowStarToast(false);
    }

    return () => {
      [
        shareFlashTimeoutRef,
        unlockFlashTimeoutRef,
        founderBurstTimeoutRef,
        founderCinematicTimeoutRef,
        torvaldsGlitchTimeoutRef,
        longSessionTimeoutRef,
        starToastShowTimeoutRef,
        starToastHideTimeoutRef,
        roastRevealTimerRef,
        roastMeterTimerRef,
        roastShareTimerRef,
        dashboardWakeTimeoutRef,
      ].forEach((ref) => {
        if (ref.current) {
          clearTimeout(ref.current);
          ref.current = null;
        }
      });
    };
  }, [founderActive, isTorvalds, starTier]);

  useEffect(() => {
    if (!roastReport) {
      setRoastVisibleSteps(0);
      setRoastMeterValue(0);
      return;
    }

    if (roastRevealTimerRef.current) {
      clearInterval(roastRevealTimerRef.current);
      roastRevealTimerRef.current = null;
    }
    if (roastMeterTimerRef.current) {
      clearTimeout(roastMeterTimerRef.current);
      roastMeterTimerRef.current = null;
    }

    setRoastVisibleSteps(0);
    setRoastMeterValue(0);
    roastMeterTimerRef.current = setTimeout(() => {
      setRoastMeterValue(Number(roastReport.roastScore || 0));
    }, 120);

    let step = 0;
    const totalSteps = (Array.isArray(roastReport.roastLines) ? roastReport.roastLines.length : 0) + 1;
    roastRevealTimerRef.current = setInterval(() => {
      step += 1;
      setRoastVisibleSteps(Math.min(step, totalSteps));
      if (step >= totalSteps && roastRevealTimerRef.current) {
        clearInterval(roastRevealTimerRef.current);
        roastRevealTimerRef.current = null;
      }
    }, 1200);

    return () => {
      if (roastRevealTimerRef.current) {
        clearInterval(roastRevealTimerRef.current);
        roastRevealTimerRef.current = null;
      }
      if (roastMeterTimerRef.current) {
        clearTimeout(roastMeterTimerRef.current);
        roastMeterTimerRef.current = null;
      }
    };
  }, [roastReport]);

  useEffect(() => {
    if (!shouldShowRoastSection) return;

    const scrollTimer = setTimeout(() => {
      scrollToRoastSection("smooth");
    }, roastReport ? 80 : 30);

    return () => clearTimeout(scrollTimer);
  }, [shouldShowRoastSection, roastReport]);

  async function copyProfileLink() {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(profileShareUrl);
      }
    } catch {
      // Ignore clipboard failures.
    }
  }

  async function handleConfirmRoast() {
    if (isRoasting || typeof onRoast !== "function") return;

    setIsRoasting(true);
    setRoastError("");
    setRoastReport(null);
    setRoastShareCopied(false);
    setShowRoastWarning(false);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => scrollToRoastSection("smooth"));
    });

    try {
      const roastData = await onRoast();
      setRoastReport(roastData);
    } catch (err) {
      setRoastError(err?.message || "Roast generation failed.");
    } finally {
      setIsRoasting(false);
    }
  }

  async function handleShareRoast() {
    if (!roastReport) return;
    const roastScore = Number(roastReport.roastScore || 0);
    const shareText = `GitDNA just roasted @${user.login}. Score: ${roastScore}/100. gitdna.vercel.app`;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText);
      }
      setRoastShareCopied(true);
      if (roastShareTimerRef.current) {
        clearTimeout(roastShareTimerRef.current);
      }
      roastShareTimerRef.current = setTimeout(() => setRoastShareCopied(false), 1800);
    } catch {
      // Ignore clipboard failures.
    }
  }

  async function handleGenerateShareCard() {
    if (isGeneratingCard) return;
    const captureNode = shareExportRef.current || shareCardRef.current;
    if (!captureNode) return;

    try {
      setIsGeneratingCard(true);

      // Two paint frames ensure the offscreen export card is fully laid out before capture.
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      const canvas = await html2canvas(captureNode, {
        backgroundColor: "#060b12",
        scale: window.devicePixelRatio > 1 ? 2 : 1,
        useCORS: true,
        allowTaint: false,
        logging: false,
        removeContainer: true,
        windowWidth: Math.max(document.documentElement.clientWidth, captureNode.scrollWidth || 0),
        windowHeight: Math.max(document.documentElement.clientHeight, captureNode.scrollHeight || 0),
      });

      if (founderActive) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.save();
          ctx.translate(canvas.width * 0.5, canvas.height * 0.5);
          ctx.rotate(-Math.PI / 4);
          ctx.fillStyle = "rgba(255,215,0,0.08)";
          ctx.textAlign = "center";
          ctx.font = `${Math.floor(canvas.width * 0.11)}px Orbitron, monospace`;
          ctx.fillText("FOUNDER", 0, 0);
          ctx.restore();
        }
      }

      const profileUsername = (user.login || username || "profile").replace(/[^a-zA-Z0-9_-]/g, "") || "profile";
      const link = document.createElement("a");
      link.download = `gitdna-${profileUsername}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      setShowCardSaved(true);
      if (shareFlashTimeoutRef.current) {
        clearTimeout(shareFlashTimeoutRef.current);
      }
      shareFlashTimeoutRef.current = setTimeout(() => setShowCardSaved(false), 1500);
    } catch (err) {
      console.error("Share card generation failed", err);
    } finally {
      setIsGeneratingCard(false);
    }
  }

  return (
    <div className={`gd-root${ultraMode ? " gd-ultra-mode" : ""}${showTorvaldsGlitch ? " gd-torvalds-screen" : ""}${showDashboardWake ? " gd-dashboard-wake" : ""}`} style={{ position: "relative", zIndex: 2, paddingBottom: 60 }}>
      <BackgroundCanvas />
      <div className="gd-scanlines" />
      {showUnlockFlash && <div className="gd-unlock-flash" />}
      {showFounderBurst && <div className="gd-founder-burst" />}

      {showFounderCinematic && founderActive && (
        <div className="gd-founder-cinematic">
          <div className="gd-founder-cinematic-text">YOU BUILT THIS.</div>
        </div>
      )}

      {showStarToast && starTier && (
        <div
          className="gd-toast"
          style={{
            top: 16,
            left: "50%",
            transform: "translateX(-50%)",
            border: starTier === "elite" ? "1px solid rgba(255,179,0,0.55)" : "1px solid rgba(57,255,20,0.5)",
            color: starTier === "elite" ? "#ffb300" : "#39ff14",
            background: starTier === "elite" ? "rgba(18,12,0,0.92)" : "rgba(4,14,6,0.92)",
          }}
        >
          {starTier === "elite"
            ? "⭐ ELITE TIER — You are in the top 1% of GitHub"
            : "⭐ CENTURY CLUB — Top 12% of GitHub developers"}
        </div>
      )}

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px", position: "relative", zIndex: 2, animation: founderActive ? "founder-dashboard-rise .9s ease .95s both" : undefined }}>
        <div ref={shareCardRef} style={{ padding: 2, borderRadius: 8 }}>
          {/* HEADER */}
          <div className={`gd-card gd-header-card gd-enter-scan ${tierMeta.headerClass}${founderActive ? " gd-founder-header" : ""}`} style={{ padding: "20px 22px", marginBottom: 16, display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", ...cardEntranceStyle(0) }}>
            <div className="scan-overlay" />
            {founderActive && <div className="gd-founder-header-shimmer" />}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{ position: "absolute", inset: -4, borderRadius: "50%", border: "1.5px solid rgba(0,220,255,0.3)", animation: "ring-spin 8s linear infinite" }} />
              <div style={{ position: "absolute", inset: -8, borderRadius: "50%", border: "1px solid rgba(179,71,234,0.2)", animation: "ring-spin 12s linear infinite reverse" }} />
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" style={{ width: 72, height: 72, borderRadius: "50%", border: "2px solid rgba(0,220,255,0.35)", display: "block" }} />
              ) : (
                <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(0,220,255,0.1)", border: "2px solid rgba(0,220,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Orbitron,monospace", fontSize: "1.4rem", color: "#00dcff" }}>
                  {(user.login || "?")[0].toUpperCase()}
                </div>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
                <h2 className="orb" style={{ fontSize: "1.25rem", fontWeight: 700, color: "#ffffff", letterSpacing: "0.05em" }}>{user.name || user.login}</h2>
                <span className="gd-badge gd-badge-purple">{effectiveDevClass}</span>
                <span className={`gd-badge ${tierMeta.badgeClass}`}>{tierMeta.icon} {tierMeta.label}</span>
                {founderActive && <span className="gd-badge gd-badge-gold" style={{ fontSize: "0.66rem", padding: "3px 10px" }}>⚙ ARCHITECT OF GITDNA</span>}
                {isTorvalds && <span className="gd-badge gd-badge-gold">KERNEL DEITY</span>}
              </div>
              <div style={{ fontFamily: "Share Tech Mono,monospace", fontSize: "0.72rem", color: "rgba(0,220,255,0.5)", marginBottom: 8 }}>@{user.login}</div>
              {user.bio && <div style={{ fontSize: "0.88rem", color: "rgba(200,232,255,0.55)", fontWeight: 300, marginBottom: 8 }}>{user.bio}</div>}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                {user.location && <span className="gd-badge gd-badge-cyan">📍 {user.location}</span>}
                <span
                  title={
                    hasLocationData
                      ? "Open GITMAP"
                      : "Location unavailable. Add location to unlock GITMAP."
                  }
                  style={{ display: "inline-flex" }}
                >
                  <button
                    className="gd-btn"
                    onClick={() => {
                      if (!hasLocationData) return;
                      setShowGitMap(true);
                    }}
                    disabled={!hasLocationData}
                    style={{
                      padding: "5px 10px",
                      fontSize: "0.58rem",
                      letterSpacing: "0.1em",
                      opacity: hasLocationData ? 1 : 0.45,
                      cursor: hasLocationData ? "pointer" : "not-allowed",
                    }}
                  >
                    🌐 GITMAP
                  </button>
                </span>
                <span className="gd-badge gd-badge-gold">⌛ {acctYears}yr veteran</span>
                {user.blog && <span className="gd-badge gd-badge-green">🔗 blog</span>}
              </div>
            </div>
            <div className="gd-header-ring" style={{ flexShrink: 0 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, width: 150, margin: "0 auto" }}>
                <div
                  className="orb"
                  style={{
                    fontSize: "0.62rem",
                    letterSpacing: "0.2em",
                    fontWeight: 600,
                    color: tierVisual.color,
                    textShadow: `0 0 8px ${tierVisual.color}`,
                    textAlign: "center",
                  }}
                >
                  {tierVisual.icon} {tierVisual.label}
                </div>

                <div style={{ position: "relative", width: 150, height: 150, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: "50%",
                      background: `radial-gradient(circle, ${tierVisual.halo} 0%, transparent 70%)`,
                      zIndex: 0,
                      animation: "tier-halo-pulse 3s ease-in-out infinite",
                    }}
                  />
                  <div style={{ position: "relative", zIndex: 1 }}>
                    <ScoreRing
                      score={devScore}
                      specialMode={founderActive || isTorvalds ? "gold" : null}
                      percentileText={scorePercentileLabel}
                      percentileColor={tierVisual.text}
                    />
                  </div>
                </div>

                <div style={{ width: 130, display: "flex", flexDirection: "column", gap: 5 }}>
                  {scoreBreakdown.map((item, index) => (
                    <div key={`score-part-${item.label}`}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                        <span style={{ fontFamily: "Share Tech Mono,monospace", fontSize: "0.52rem", color: "rgba(0,220,255,0.35)", letterSpacing: "0.08em" }}>{item.label}</span>
                        <span style={{ fontFamily: "Share Tech Mono,monospace", fontSize: "0.52rem", color: "rgba(0,220,255,0.35)", letterSpacing: "0.08em" }}>{item.value}%</span>
                      </div>
                      <div style={{ height: 2, borderRadius: 1, background: "rgba(255,255,255,0.05)", overflow: "hidden", position: "relative" }}>
                        <div
                          style={{
                            height: "100%",
                            borderRadius: 1,
                            background: tierVisual.barFill,
                            width: `${item.value}%`,
                            animation: `bar-expand .9s cubic-bezier(.2,.8,.2,1) ${index * 120}ms both`,
                            "--w": `${item.value}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <button
                className="gd-btn"
                onClick={() => {
                  setShowCompareModal(true);
                  setCompareError("");
                  setOpponentUsername("");
                }}
                style={{
                  marginTop: 10,
                  padding: "10px 14px",
                  fontSize: "0.74rem",
                  width: "100%",
                  fontWeight: 700,
                  boxShadow: "0 0 14px rgba(0,220,255,0.28)",
                }}
              >
                ⚔ COMPARE TWO DEVS
              </button>
              <button
                className="gd-btn"
                onClick={() => {
                  if (!isTimeMachineUnlocked) return;
                  setShowTimeMachine(true);
                }}
                disabled={!isTimeMachineUnlocked}
                title={isTimeMachineUnlocked ? "" : "TIME MACHINE UNLOCKS AFTER 1 YEAR OF DEVELOPMENT"}
                style={{ marginTop: 8, padding: "9px 16px", fontSize: "0.72rem", width: "100%" }}
              >
                ⏳ TIME MACHINE
              </button>
              <button
                className="gd-btn gd-btn-roast"
                onClick={() => {
                  if (isRoasting) return;
                  setShowRoastWarning(true);
                  setRoastError("");
                }}
                disabled={isRoasting}
                style={{ marginTop: 8, padding: "7px 14px", fontSize: "0.66rem", width: "100%" }}
              >
                {isRoasting ? "🔥 ROASTING..." : "🔥 ROAST ME"}
              </button>
            </div>
          </div>

          {founderActive && (
            <FounderProtocol
              user={user}
              devScore={devScore}
              totalStars={totalStars}
              repos={repos}
              contributions={contributions}
            />
          )}

          {/* DNA SEQUENCE */}
          <div className="gd-card gd-enter-scan" style={{ padding: "12px 18px", marginBottom: 16, ...cardEntranceStyle(1) }}>
            <div className="gd-section-label" style={{ marginBottom: 8 }}>DEV DNA SEQUENCE</div>
            <DNASequence seq={dna} goldMode={founderActive} />
          </div>

          {/* VITALS */}
          <div className="gd-vitals-row">
            <StatCard label="STARS EARNED" value={totalStars} delay={2} sub="across all repos" enterIndex={2} ticker={true} />
            <StatCard label="FOLLOWERS" value={user.followers} delay={3} sub="in the network" enterIndex={3} ticker={true} />
            <StatCard label="REPOSITORIES" value={user.public_repos} delay={4} sub="public codebases" enterIndex={4} ticker={true} />
            <StatCard label="COMMITS" value={recentCommits} delay={5} sub="recent activity" enterIndex={5} />
          </div>
        </div>

        <div className="gd-card gd-enter-scan" style={{ padding: "18px 18px", marginBottom: 12, ...cardEntranceStyle(6) }}>
          <div className="gd-section-label">CONTRIBUTION GENOME — LAST 52 WEEKS</div>
          <ContributionHeatmap contributions={contributions} />
        </div>

        {shouldShowRoastSection && (
          <div ref={roastSectionRef} className="gd-card gd-roast-card gd-enter-scan" style={{ padding: "18px 18px", marginBottom: 12, ...cardEntranceStyle(7) }}>
            <div className="gd-section-label" style={{ color: "rgba(255,120,120,0.72)" }}>
              {isRoasting && !roastReport ? "ROAST ENGINE" : "ROAST REPORT"}
            </div>

            {isRoasting && !roastReport && (
              <div className="gd-roast-pending">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
                  <span style={{ fontFamily: "Share Tech Mono,monospace", fontSize: "0.64rem", letterSpacing: "0.12em", color: "rgba(255,170,170,0.78)" }}>
                    GENERATING ROAST FOR @{user.login}
                  </span>
                  <span className="gd-badge gd-badge-gold">NO MERCY MODE</span>
                </div>
                <div className="gd-roast-meter gd-roast-meter-loading" style={{ marginBottom: 10 }}>
                  <div className="gd-roast-meter-fill" style={{ width: "36%", opacity: 0.65 }} />
                </div>
                <div className="gd-roast-line">
                  <span style={{ color: "#ff5c5c", fontSize: "0.85rem", lineHeight: 1.6 }}>🔥</span>
                  <span>Analyzing commits, repos, and coding habits...</span>
                </div>
              </div>
            )}

            {!isRoasting && roastError && !roastReport && (
              <div style={{ border: "1px solid rgba(255,120,120,0.35)", background: "rgba(48,10,14,0.68)", borderRadius: 8, padding: "12px 12px", color: "rgba(255,188,188,0.9)", fontSize: "0.82rem", lineHeight: 1.55 }}>
                Roast generation failed: {roastError}
              </div>
            )}

            {roastReport && (
              <>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
                    <span style={{ fontFamily: "Share Tech Mono,monospace", fontSize: "0.64rem", letterSpacing: "0.12em", color: "rgba(255,170,170,0.78)" }}>
                      ROASTABILITY SCORE: {Number(roastReport.roastScore || 0)}/100
                    </span>
                    <span className="gd-badge gd-badge-gold">NO MERCY MODE</span>
                  </div>
                  <div className="gd-roast-meter">
                    <div className="gd-roast-meter-fill" style={{ width: `${Math.max(0, Math.min(roastMeterValue, 100))}%` }} />
                  </div>
                </div>

                <div>
                  {(Array.isArray(roastReport.roastLines) ? roastReport.roastLines : [])
                    .slice(0, Math.min(roastVisibleSteps, roastReport.roastLines?.length || 0))
                    .map((line, index) => (
                      <div key={`roast-line-${index}`} className="gd-roast-line">
                        <span style={{ color: "#ff5c5c", fontSize: "0.85rem", lineHeight: 1.6 }}>🔥</span>
                        <span>{line}</span>
                      </div>
                    ))}

                  {roastVisibleSteps > (roastReport.roastLines?.length || 0) && (
                    <div className="gd-roast-redemption">
                      <span className="orb" style={{ fontSize: "0.7rem", letterSpacing: "0.08em", color: "#95ff8b" }}>BUT SERIOUSLY...</span>
                      <div style={{ marginTop: 6 }}>{roastReport.redemption}</div>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                  <button className="gd-btn gd-btn-roast" onClick={handleShareRoast} style={{ padding: "8px 14px", fontSize: "0.66rem" }}>
                    SHARE ROAST
                  </button>
                  {roastShareCopied && <span className="gd-badge gd-badge-green">ROAST LINK COPIED</span>}
                </div>
              </>
            )}
          </div>
        )}

        {/* SKILLS + CHRONOTYPE */}
        <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
          <div className="gd-card gd-enter-scan" style={{ flex: "1 1 220px", padding: "18px 18px", ...cardEntranceStyle(7) }}>
            <div className="gd-section-label">SKILL TOPOLOGY</div>
            {langs.map((l, i) => <SkillBar key={l.lang} lang={l.lang} pct={l.pct} delay={i + 1} />)}
            {langs.length === 0 && <div style={{ color: "rgba(200,232,255,0.3)", fontFamily: "Share Tech Mono,monospace", fontSize: "0.7rem" }}>No language data</div>}
          </div>

          <div className="gd-card-purple gd-enter-scan" style={{ flex: "1 1 220px", padding: "18px 18px", ...cardEntranceStyle(8) }}>
            <div className="gd-section-label" style={{ color: "rgba(179,71,234,0.6)" }}>CHRONOTYPE</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(179,71,234,0.1)", border: "1px solid rgba(179,71,234,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", flexShrink: 0 }}>🌑</div>
              <div>
                <div className="orb" style={{ fontSize: "0.85rem", fontWeight: 700, color: "#c46ef8", letterSpacing: "0.05em" }}>{chronotype.title}</div>
                <span className="gd-badge gd-badge-purple" style={{ marginTop: 4 }}>TEMPORAL CLASS</span>
              </div>
            </div>
            <div className="gd-neon-line" style={{ background: "linear-gradient(90deg,transparent,rgba(179,71,234,0.35),transparent)" }} />
            <p style={{ fontSize: "0.84rem", color: "rgba(200,232,255,0.6)", lineHeight: 1.6, fontWeight: 300 }}>{chronotype.description}</p>
          </div>

          <div className="gd-card gd-enter-scan" style={{ flex: "1 1 180px", padding: "18px 18px", ...cardEntranceStyle(9) }}>
            <div className="gd-section-label">NEURAL TRAITS</div>
            <TraitsRadar traits={traits} />
          </div>
        </div>

        {/* COLLAB STYLE */}
        <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
          <div className="gd-card-green gd-enter-scan" style={{ flex: "1 1 240px", padding: "18px 18px", ...cardEntranceStyle(10) }}>
            <div className="gd-section-label" style={{ color: "rgba(57,255,20,0.5)" }}>COLLABORATION MATRIX</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(57,255,20,0.08)", border: "1px solid rgba(57,255,20,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", flexShrink: 0 }}>⚡</div>
              <div>
                <div className="orb" style={{ fontSize: "0.85rem", fontWeight: 700, color: "#39ff14", letterSpacing: "0.05em", textShadow: "0 0 8px rgba(57,255,20,0.4)" }}>{collab.title}</div>
                <span className="gd-badge gd-badge-green" style={{ marginTop: 4 }}>COLLAB ARCHETYPE</span>
              </div>
            </div>
            <div className="gd-neon-line" style={{ background: "linear-gradient(90deg,transparent,rgba(57,255,20,0.25),transparent)" }} />
            <p style={{ fontSize: "0.84rem", color: "rgba(200,232,255,0.6)", lineHeight: 1.6, fontWeight: 300 }}>{collab.description}</p>
          </div>

          {traits && (
            <div className="gd-card gd-enter-scan" style={{ flex: "1 1 200px", padding: "18px 18px", ...cardEntranceStyle(11) }}>
              <div className="gd-section-label">TRAIT METRICS</div>
              {Object.entries(traits).map(([k, v]) => (
                <div key={k} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontFamily: "Share Tech Mono,monospace", fontSize: "0.65rem", color: "rgba(0,220,255,0.5)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{k}</span>
                    <span className="orb" style={{ fontSize: "0.6rem", color: "#00dcff" }}>{v}</span>
                  </div>
                  <div style={{ height: 3, background: "rgba(0,220,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", background: `linear-gradient(90deg,rgba(0,220,255,0.6),rgba(179,71,234,0.6))`, width: `${v}%`, transition: "width 1.5s ease", boxShadow: "0 0 4px rgba(0,220,255,0.3)" }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FAST FACTS */}
        <div style={cardEntranceStyle(12)}>
          <div className="gd-card gd-enter-scan" style={{ padding: "18px 18px", marginBottom: 12 }}>
            <div className="gd-section-label">COGNITIVE PROFILE SUMMARY</div>
            <div className="gd-cognitive-grid">
              <div className="gd-card-green gd-enter-scan" style={{ padding: "16px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: "1rem", color: "#39ff14" }}>✦</span>
                  <span className="gd-badge gd-badge-green">CORE STRENGTH</span>
                </div>
                <p style={{ fontSize: "0.86rem", color: "rgba(200,232,255,0.72)", lineHeight: 1.6 }}>{strengthReport}</p>
              </div>
              <div className="gd-card-gold gd-enter-scan" style={{ padding: "16px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: "1rem", color: "#ffb300" }}>⚠</span>
                  <span className="gd-badge gd-badge-gold">BLINDSPOT</span>
                </div>
                <p style={{ fontSize: "0.86rem", color: "rgba(200,232,255,0.72)", lineHeight: 1.6 }}>{warningSign}</p>
              </div>
            </div>
          </div>
        </div>

        {facts.length > 0 && (
          <div style={cardEntranceStyle(13)}>
            <div className="gd-card gd-enter-scan" style={{ padding: "18px 18px" }}>
              <div className="gd-section-label">// AI FAST FACTS</div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {facts.map((fact, i) => (
                  <div
                    key={i}
                    className={`${roastMode && i === 0 ? "gd-card-gold" : "gd-card"} gd-hover-lift gd-enter-scan`}
                    style={{ flex: "1 1 180px", padding: "14px 14px", ...cardEntranceStyle(14 + i) }}
                  >
                    <div style={{ fontFamily: "Share Tech Mono,monospace", fontSize: "0.55rem", color: roastMode && i === 0 ? "rgba(255,179,0,0.62)" : "rgba(0,220,255,0.45)", letterSpacing: "0.15em", marginBottom: 8 }}>INTEL_{String(i + 1).padStart(2, "0")}</div>
                    <p style={{ fontSize: "0.84rem", color: "rgba(200,232,255,0.7)", lineHeight: 1.55, fontWeight: 400, whiteSpace: "pre-line" }}>{fact}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div style={cardEntranceStyle(17)}>
          <div className="gd-card gd-enter-scan" style={{ padding: "18px 18px" }}>
            <div className="gd-section-label">REPO GENOME</div>
            <TopRepositories repos={repos} username={user.login} />
          </div>
        </div>

        {/* FOOTER */}
        <div style={{ marginTop: 24, textAlign: "center", ...cardEntranceStyle(19) }}>
          <div className="gd-neon-line" />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <span style={{ fontFamily: "Share Tech Mono,monospace", fontSize: "0.6rem", color: "rgba(0,220,255,0.3)" }}>GITDNA ENGINE v2.0 // BEHAVIORAL PROFILE GENERATED</span>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", flexWrap: "wrap", gap: 8, marginLeft: "auto" }}>
              {showCardSaved && <span className="gd-badge gd-badge-green">CARD SAVED</span>}
              <button className="gd-btn" onClick={handleGenerateShareCard} disabled={isGeneratingCard} style={{ padding: "8px 16px", fontSize: "0.68rem" }}>
                {isGeneratingCard ? "GENERATING..." : "⤓ GENERATE SHARE CARD"}
              </button>
              <button className="gd-btn" onClick={onReset} style={{ padding: "8px 16px", fontSize: "0.68rem" }}>◀ NEW SCAN</button>
            </div>
          </div>
          {founderActive && (
            <div style={{ marginTop: 10, fontFamily: "Share Tech Mono,monospace", fontSize: "0.5rem", letterSpacing: "0.08em", color: "rgba(200,232,255,0.25)" }}>
              // GitDNA was conceived, designed, and built by @Aanishnithin07 — 2025
            </div>
          )}
        </div>
      </div>

      <div aria-hidden="true" style={{ position: "fixed", left: -12000, top: 0, width: 900, pointerEvents: "none", zIndex: -1 }}>
        <div ref={shareExportRef} className="gd-share-export-card" style={{ width: 900 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, gap: 14 }}>
            <div>
              <div style={{ fontFamily: "Share Tech Mono,monospace", fontSize: "0.62rem", letterSpacing: "0.14em", color: "rgba(0,220,255,0.72)", marginBottom: 6 }}>
                GITDNA REPORT // @{user.login}
              </div>
              <div className="orb" style={{ fontSize: "1.42rem", fontWeight: 800, color: "#f0fbff", letterSpacing: "0.04em" }}>
                {user.name || user.login}
              </div>
              <div style={{ marginTop: 6, fontSize: "0.78rem", color: "rgba(223,247,255,0.7)", letterSpacing: "0.06em" }}>
                {effectiveDevClass}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", border: "1px solid rgba(0,220,255,0.38)", display: "grid", placeItems: "center", fontFamily: "Orbitron,monospace", fontWeight: 700, color: "#00dcff", background: "rgba(0,220,255,0.06)" }}>
                {shareInitial}
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "Share Tech Mono,monospace", fontSize: "0.58rem", letterSpacing: "0.13em", color: "rgba(0,220,255,0.62)" }}>DEV SCORE</div>
                <div className="orb" style={{ fontSize: "1.38rem", fontWeight: 800, color: "#8ff3ff" }}>{devScore}</div>
              </div>
            </div>
          </div>

          <div className="gd-share-export-row" style={{ marginBottom: 12 }}>
            <span className="gd-share-export-chip">⭐ {totalStars.toLocaleString()} STARS</span>
            <span className="gd-share-export-chip">📦 {user.public_repos} REPOS</span>
            <span className="gd-share-export-chip">👥 {user.followers.toLocaleString()} FOLLOWERS</span>
            <span className="gd-share-export-chip">🧬 {dna.slice(0, 8)}...{dna.slice(-4)}</span>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontFamily: "Share Tech Mono,monospace", fontSize: "0.58rem", letterSpacing: "0.13em", color: "rgba(0,220,255,0.62)", marginBottom: 8 }}>
              LANGUAGE TOPOLOGY
            </div>
            <div className="gd-share-export-row">
              {shareLangs.length > 0 ? shareLangs.map((lang) => (
                <span key={`share-lang-${lang.lang}`} className="gd-share-export-chip">{lang.lang}: {lang.pct}%</span>
              )) : <span className="gd-share-export-chip">No language stats available</span>}
            </div>
          </div>

          <div style={{ marginBottom: 10 }}>
            <div style={{ fontFamily: "Share Tech Mono,monospace", fontSize: "0.58rem", letterSpacing: "0.13em", color: "rgba(0,220,255,0.62)", marginBottom: 6 }}>
              AI HIGHLIGHTS
            </div>
            {shareHighlights.length > 0 ? shareHighlights.map((fact, index) => (
              <div key={`share-fact-${index}`} style={{ fontSize: "0.8rem", lineHeight: 1.5, color: "rgba(223,247,255,0.86)", marginBottom: 4 }}>
                • {fact}
              </div>
            )) : (
              <div style={{ fontSize: "0.8rem", lineHeight: 1.5, color: "rgba(223,247,255,0.72)" }}>
                AI profile highlights are not available yet.
              </div>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(0,220,255,0.22)", gap: 12 }}>
            <span style={{ fontFamily: "Share Tech Mono,monospace", fontSize: "0.6rem", color: "rgba(0,220,255,0.64)", letterSpacing: "0.1em" }}>
              GITDNA ENGINE v2.0
            </span>
            <span style={{ fontFamily: "Share Tech Mono,monospace", fontSize: "0.6rem", color: "rgba(223,247,255,0.62)", letterSpacing: "0.08em" }}>
              gitdna.vercel.app
            </span>
          </div>
        </div>
      </div>

      {showTimeMachine && (
        <TimeMachine
          repos={repos}
          events={events}
          user={user}
          aiData={aiData}
          onClose={handleCloseTimeMachine}
        />
      )}

      {showGitMap && (
        <GitMap
          user={user}
          avgCommitHour={avgCommitHour}
          totalStars={totalStars}
          topLang={topLang}
          accountAge={accountAgeYears}
          recentCommits={recentCommits}
          onClose={handleCloseGitMap}
        />
      )}

      {showLongSessionToast && (
        <div className="gd-toast" style={{ right: 14, bottom: 14, border: "1px solid rgba(0,220,255,0.45)", color: "#00dcff", background: "rgba(4,12,22,0.95)" }}>
          <div>Still analyzing? Share this profile →</div>
          <button className="gd-toast-action" onClick={copyProfileLink}>COPY LINK</button>
          <button className="gd-toast-close" onClick={() => setShowLongSessionToast(false)}>DISMISS</button>
        </div>
      )}

      {nightOwlToastVisible && (
        <div className="gd-toast" style={{ left: "50%", transform: "translateX(-50%)", bottom: 14, border: "1px solid rgba(0,220,255,0.45)", color: "#00dcff", background: "rgba(4,12,22,0.95)" }}>
          🌑 Late night code session detected. You and this developer would probably get along.
          <button className="gd-toast-close" onClick={onNightOwlDismiss}>OK</button>
        </div>
      )}

      {showRoastWarning && (
        <div className="gd-modal-overlay" role="dialog" aria-modal="true">
          <div className="gd-modal-card" style={{ borderColor: "rgba(255,90,90,0.4)", boxShadow: "0 0 24px rgba(255,82,82,0.26)", background: "rgba(20,7,10,0.95)" }}>
            <div className="gd-modal-title" style={{ color: "rgba(255,130,130,0.8)" }}>⚠ ROAST PROTOCOL WARNING</div>
            <div style={{ marginBottom: 12, fontSize: "0.84rem", color: "rgba(255,208,208,0.84)", lineHeight: 1.6 }}>
              WARNING: GitDNA's roast algorithm has no mercy.<br />
              Developers have cried. Repository count has been mocked.<br />
              Commit messages have been questioned.<br />
              Proceed?
            </div>
            {roastError && (
              <div style={{ marginBottom: 10, fontFamily: "Share Tech Mono,monospace", fontSize: "0.62rem", color: "#ff8b8b", letterSpacing: "0.05em" }}>
                {roastError}
              </div>
            )}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
              <button
                className="gd-btn"
                onClick={() => {
                  setShowRoastWarning(false);
                  setRoastError("");
                }}
                style={{ padding: "8px 13px", fontSize: "0.64rem" }}
                disabled={isRoasting}
              >
                nevermind
              </button>
              <button
                className="gd-btn gd-btn-roast"
                onClick={handleConfirmRoast}
                style={{ padding: "8px 13px", fontSize: "0.64rem" }}
                disabled={isRoasting}
              >
                {isRoasting ? "ROASTING..." : "I CAN HANDLE IT"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCompareModal && (
        <div className="gd-modal-overlay" role="dialog" aria-modal="true">
          <div className="gd-modal-card">
            <div className="gd-modal-title">ENTER OPPONENT USERNAME</div>
            <div style={{ marginBottom: 10 }}>
              <input
                className="gd-input"
                placeholder="opponent username or github.com/user"
                value={opponentUsername}
                autoFocus
                onChange={(event) => {
                  setOpponentUsername(event.target.value);
                  if (compareError) setCompareError("");
                }}
                onKeyDown={async (event) => {
                  if (event.key !== "Enter") return;
                  try {
                    await onCompare(opponentUsername);
                    setShowCompareModal(false);
                    setOpponentUsername("");
                  } catch (err) {
                    setCompareError(err?.message || "Comparison failed.");
                  }
                }}
              />
            </div>
            {compareError && (
              <div style={{ marginBottom: 10, fontFamily: "Share Tech Mono,monospace", fontSize: "0.62rem", color: "#ff8b8b", letterSpacing: "0.05em" }}>
                {compareError}
              </div>
            )}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
              <button
                className="gd-btn"
                onClick={() => {
                  setShowCompareModal(false);
                  setCompareError("");
                }}
                style={{ padding: "8px 13px", fontSize: "0.64rem" }}
              >
                CANCEL
              </button>
              <button
                className="gd-btn"
                disabled={compareBusy || !opponentUsername.trim()}
                onClick={async () => {
                  try {
                    await onCompare(opponentUsername);
                    setShowCompareModal(false);
                    setOpponentUsername("");
                  } catch (err) {
                    setCompareError(err?.message || "Comparison failed.");
                  }
                }}
                style={{ padding: "8px 13px", fontSize: "0.64rem" }}
              >
                {compareBusy ? "LOADING..." : "START DUEL"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BattleIntro({ leftUsername, rightUsername, ultraMode = false }) {
  return (
    <div className={`gd-root${ultraMode ? " gd-ultra-mode" : ""}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 20, position: "relative", zIndex: 2 }}>
      <BackgroundCanvas />
      <div className="gd-scanlines" />

      <div className="gd-duel-stage">
        <div className="gd-duel-card gd-duel-card-left">
          <div className="gd-duel-label" style={{ color: "rgba(0,220,255,0.66)" }}>CHALLENGER A</div>
          <div className="orb" style={{ color: "#00dcff", fontSize: "1.1rem", letterSpacing: "0.06em" }}>{leftUsername}</div>
        </div>

        <div className="gd-duel-vs orb">VS</div>

        <div className="gd-duel-card gd-duel-card-right">
          <div className="gd-duel-label" style={{ color: "rgba(179,71,234,0.72)" }}>CHALLENGER B</div>
          <div className="orb" style={{ color: "#c46ef8", fontSize: "1.1rem", letterSpacing: "0.06em" }}>{rightUsername}</div>
        </div>
      </div>

      <div className="gd-duel-sub">LOADING BATTLE ARENA...</div>
    </div>
  );
}

function CompareView({ battleData, onBack, onShareBattle, ultraMode = false }) {
  const { left, right, analysis } = battleData;

  const leftTraits = left?.aiData?.traits || {};
  const rightTraits = right?.aiData?.traits || {};
  const traitLabels = {
    creativity: "Creativity",
    discipline: "Discipline",
    collaboration: "Collab",
    boldness: "Boldness",
    depth: "Depth",
    velocity: "Velocity",
  };

  const radarData = Object.keys(traitLabels).map((key) => ({
    trait: traitLabels[key],
    left: Number(leftTraits[key] ?? 50),
    right: Number(rightTraits[key] ?? 50),
  }));

  const leftLangMap = new Map((left?.langs || []).map((item) => [item.lang, item.pct]));
  const rightLangMap = new Map((right?.langs || []).map((item) => [item.lang, item.pct]));
  const sharedLangs = [...leftLangMap.keys()].filter((lang) => rightLangMap.has(lang));
  const leftOnlyLangs = [...leftLangMap.keys()].filter((lang) => !rightLangMap.has(lang));
  const rightOnlyLangs = [...rightLangMap.keys()].filter((lang) => !leftLangMap.has(lang));

  const leftStats = {
    score: left.devScore,
    stars: left.github.totalStars,
    followers: left.github.user?.followers,
    repos: left.github.user?.public_repos,
    commits: left.github.recentCommits,
  };

  const rightStats = {
    score: right.devScore,
    stars: right.github.totalStars,
    followers: right.github.user?.followers,
    repos: right.github.user?.public_repos,
    commits: right.github.recentCommits,
  };

  const statRows = [
    { key: "score", label: "DEV SCORE" },
    { key: "stars", label: "TOTAL STARS" },
    { key: "followers", label: "FOLLOWERS" },
    { key: "repos", label: "PUBLIC REPOS" },
    { key: "commits", label: "RECENT COMMITS" },
  ];

  return (
    <div className={`gd-root${ultraMode ? " gd-ultra-mode" : ""}`} style={{ position: "relative", zIndex: 2, paddingBottom: 60 }}>
      <BackgroundCanvas />
      <div className="gd-scanlines" />

      <div style={{ maxWidth: 980, margin: "0 auto", padding: "24px 16px", position: "relative", zIndex: 2 }}>
        <div className="gd-card gd-enter-scan" style={{ padding: "18px 18px", marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div>
              <div className="gd-section-label">DEVELOPER DUEL // SPLIT-SCREEN</div>
              <div className="orb" style={{ color: "#dff7ff", letterSpacing: "0.06em", fontSize: "0.98rem" }}>
                {left.username} VS {right.username}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="gd-btn" onClick={onShareBattle} style={{ padding: "8px 14px", fontSize: "0.68rem" }}>⤴ SHARE BATTLE</button>
              <button className="gd-btn" onClick={onBack} style={{ padding: "8px 14px", fontSize: "0.68rem" }}>◀ BACK</button>
            </div>
          </div>
        </div>

        <div className="gd-compare-grid" style={{ marginBottom: 12 }}>
          <div className="gd-card gd-enter-scan" style={{ padding: "16px 16px", borderColor: "rgba(0,220,255,0.45)" }}>
            <div className="gd-section-label">LEFT // CYAN PROFILE</div>
            <div className="orb" style={{ color: "#00dcff", fontSize: "0.96rem", letterSpacing: "0.05em", marginBottom: 10 }}>{left.username}</div>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <ScoreRing score={left.devScore} />
            </div>
          </div>

          <div className="gd-card-purple gd-enter-scan" style={{ padding: "16px 16px" }}>
            <div className="gd-section-label" style={{ color: "rgba(179,71,234,0.65)" }}>RIGHT // PURPLE PROFILE</div>
            <div className="orb" style={{ color: "#c46ef8", fontSize: "0.96rem", letterSpacing: "0.05em", marginBottom: 10 }}>{right.username}</div>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <ScoreRing score={right.devScore} />
            </div>
          </div>
        </div>

        <div className="gd-card gd-enter-scan" style={{ padding: "18px 18px", marginBottom: 12 }}>
          <div className="gd-section-label">STAT DOMINANCE</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {statRows.map((row) => {
              const leftValue = leftStats[row.key];
              const rightValue = rightStats[row.key];
              const winner = getWinner(leftValue, rightValue);
              return (
                <div key={row.key} className="gd-card" style={{ padding: "10px 12px", background: "rgba(6,14,24,0.72)" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 10, alignItems: "center" }}>
                    <div style={{ textAlign: "left" }}>
                      <div className="orb" style={{ color: "#00dcff", fontSize: "0.92rem" }}>{Number(leftValue || 0).toLocaleString()}</div>
                      <div style={{ marginTop: 3 }}>
                        {winner === "left" && <span className="gd-winner-chip gd-winner-chip-cyan">WINNER</span>}
                        {winner === "tie" && <span className="gd-winner-chip gd-winner-chip-gold">TIE</span>}
                      </div>
                    </div>

                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontFamily: "Share Tech Mono,monospace", fontSize: "0.62rem", letterSpacing: "0.12em", color: "rgba(200,232,255,0.62)" }}>{row.label}</div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div className="orb" style={{ color: "#c46ef8", fontSize: "0.92rem" }}>{Number(rightValue || 0).toLocaleString()}</div>
                      <div style={{ marginTop: 3 }}>
                        {winner === "right" && <span className="gd-winner-chip gd-winner-chip-purple">WINNER</span>}
                        {winner === "tie" && <span className="gd-winner-chip gd-winner-chip-gold">TIE</span>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="gd-card gd-enter-scan" style={{ padding: "18px 18px", marginBottom: 12 }}>
          <div className="gd-section-label">TRAIT RADAR OVERLAY</div>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%" margin={{ top: 8, right: 28, bottom: 8, left: 28 }}>
                <PolarGrid stroke="rgba(0,220,255,0.1)" />
                <PolarAngleAxis dataKey="trait" tick={{ fill: "rgba(0,220,255,0.45)", fontSize: 10, fontFamily: "Share Tech Mono,monospace" }} />
                <Radar name={left.username} dataKey="left" stroke="#00dcff" fill="#00dcff" fillOpacity={0.15} strokeWidth={1.8} />
                <Radar name={right.username} dataKey="right" stroke="#b347ea" fill="#b347ea" fillOpacity={0.15} strokeWidth={1.8} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="gd-card gd-enter-scan" style={{ padding: "18px 18px", marginBottom: 12 }}>
          <div className="gd-section-label">LANGUAGE INTERSECTION MAP</div>

          <div style={{ marginBottom: 10 }}>
            <div style={{ fontFamily: "Share Tech Mono,monospace", fontSize: "0.6rem", letterSpacing: "0.12em", color: "rgba(255,179,0,0.62)", marginBottom: 6 }}>SHARED LANGUAGES</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {sharedLangs.length > 0 ? sharedLangs.map((lang) => (
                <span key={`shared-${lang}`} className="gd-lang-pill gd-lang-pill-shared">{lang}</span>
              )) : <span style={{ color: "rgba(200,232,255,0.42)", fontSize: "0.75rem" }}>No shared top languages.</span>}
            </div>
          </div>

          <div className="gd-compare-grid">
            <div>
              <div style={{ fontFamily: "Share Tech Mono,monospace", fontSize: "0.6rem", letterSpacing: "0.12em", color: "rgba(0,220,255,0.62)", marginBottom: 6 }}>UNIQUE TO {left.username.toUpperCase()}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {leftOnlyLangs.length > 0 ? leftOnlyLangs.map((lang) => (
                  <span key={`left-${lang}`} className="gd-lang-pill gd-lang-pill-left">{lang}</span>
                )) : <span style={{ color: "rgba(200,232,255,0.42)", fontSize: "0.75rem" }}>No unique languages in top set.</span>}
              </div>
            </div>

            <div>
              <div style={{ fontFamily: "Share Tech Mono,monospace", fontSize: "0.6rem", letterSpacing: "0.12em", color: "rgba(179,71,234,0.7)", marginBottom: 6 }}>UNIQUE TO {right.username.toUpperCase()}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {rightOnlyLangs.length > 0 ? rightOnlyLangs.map((lang) => (
                  <span key={`right-${lang}`} className="gd-lang-pill gd-lang-pill-right">{lang}</span>
                )) : <span style={{ color: "rgba(200,232,255,0.42)", fontSize: "0.75rem" }}>No unique languages in top set.</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="gd-card-gold gd-enter-scan" style={{ padding: "18px 18px", marginBottom: 12 }}>
          <div className="gd-section-label" style={{ color: "rgba(255,179,0,0.75)" }}>⚔ AI BATTLE ANALYSIS</div>
          <p style={{ fontSize: "0.88rem", color: "rgba(231,236,255,0.8)", lineHeight: 1.65 }}>{analysis}</p>
        </div>
      </div>
    </div>
  );
}

function GlobalEasterEggOverlays({ ultraMode, showKonamiFlash, showKonamiMessage }) {
  return (
    <>
      {ultraMode && <div className="gd-global-badge gd-ultra-badge">ULTRA MODE</div>}
      {showKonamiFlash && (
        <div
          className="gd-fixed-overlay gd-konami-flash"
          style={{ animation: "flash .35s ease-out forwards", opacity: 0.88 }}
        />
      )}
      {showKonamiMessage && (
        <div className="gd-fixed-overlay gd-konami-message">
          <div>ULTRA MODE UNLOCKED</div>
        </div>
      )}
    </>
  );
}

export default function GitDNA() {
  const [phase, setPhase] = useState("landing");
  const [loadingSteps, setLoadingSteps] = useState(LOADING_STEPS);
  const [loadingStep, setLoadingStep] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState(LOADING_STEPS[0]);
  const [loadingFeed, setLoadingFeed] = useState([]);
  const [error, setError] = useState("");
  const [github, setGithub] = useState(null);
  const [aiData, setAiData] = useState(null);
  const [devScore, setDevScore] = useState(0);
  const [langs, setLangs] = useState([]);
  const [activeUsername, setActiveUsername] = useState("");
  const [battleData, setBattleData] = useState(null);
  const [compareBusy, setCompareBusy] = useState(false);
  const [ultraMode, setUltraMode] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("gitdna_ultra_mode") === "1";
  });
  const [showKonamiFlash, setShowKonamiFlash] = useState(false);
  const [showKonamiMessage, setShowKonamiMessage] = useState(false);
  const [isFounder, setIsFounder] = useState(false);
  const [starTier, setStarTier] = useState(null);
  const [nightOwlShown, setNightOwlShown] = useState(false);
  const [nightOwlToastVisible, setNightOwlToastVisible] = useState(false);
  const autoAnalyzeRef = useRef(false);
  const streamRef = useRef(null);
  const battleIntroTimerRef = useRef(null);
  const konamiIndexRef = useRef(0);
  const konamiFlashTimeoutRef = useRef(null);
  const konamiMessageTimeoutRef = useRef(null);
  const nightOwlShownRef = useRef(false);
  const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

  const beginBattleIntro = () => {
    if (battleIntroTimerRef.current) {
      clearTimeout(battleIntroTimerRef.current);
      battleIntroTimerRef.current = null;
    }
    setPhase("battle-intro");
    battleIntroTimerRef.current = setTimeout(() => {
      setPhase("dashboard");
      battleIntroTimerRef.current = null;
    }, 3000);
  };

  const fetchProfilePayload = async (username) => {
    const endpoint = `${API_URL}/api/analyze/${encodeURIComponent(username)}`;
    const res = await fetch(endpoint, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      let detail = `Backend error (${res.status})`;
      try {
        const errJson = await res.json();
        detail = errJson?.detail || detail;
      } catch {
        // Keep default detail.
      }
      throw new Error(detail);
    }
    return res.json();
  };

  const fetchBattleNarrative = async (leftPayload, rightPayload) => {
    const endpoint = `${API_URL}/api/battle`;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ left: leftPayload, right: rightPayload }),
    });

    if (!res.ok) {
      let detail = `Battle API error (${res.status})`;
      try {
        const errJson = await res.json();
        detail = errJson?.detail || detail;
      } catch {
        // Keep default detail.
      }
      throw new Error(detail);
    }

    const battle = await res.json();
    return battle?.analysis || "Battle analysis unavailable.";
  };

  const fetchRoastReport = async (profilePayload) => {
    const endpoint = `${API_URL}/api/roast`;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ profile: profilePayload }),
    });

    if (!res.ok) {
      let detail = `Roast API error (${res.status})`;
      try {
        const errJson = await res.json();
        detail = errJson?.detail || detail;
      } catch {
        // Keep default detail.
      }
      throw new Error(detail);
    }

    const roast = await res.json();
    return {
      roastLines: Array.isArray(roast?.roastLines) ? roast.roastLines : [],
      redemption: typeof roast?.redemption === "string" ? roast.redemption : "Respect where it's due — you keep showing up and shipping code.",
      roastScore: Number(roast?.roastScore || 0),
    };
  };

  useEffect(() => {
    nightOwlShownRef.current = nightOwlShown;
  }, [nightOwlShown]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.__gitdna_console_signature__) return;
    window.__gitdna_console_signature__ = true;

    console.log(
      "%cGITDNA // BUILT BY @Aanishnithin07",
      "color:#00dcff;background:#061626;padding:6px 10px;border:1px solid #00dcff;font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:1px;",
    );
    console.log(
      "%cYour code has a fingerprint. We read it.",
      "color:#ffd166;font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:0.6px;",
    );
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const sequence = ["arrowup", "arrowup", "arrowdown", "arrowdown", "arrowleft", "arrowright", "arrowleft", "arrowright", "b", "a"];
    const onKeyDown = (event) => {
      const key = (event.key || "").toLowerCase();
      if (!key) return;

      const expected = sequence[konamiIndexRef.current];
      if (key === expected) {
        konamiIndexRef.current += 1;
        if (konamiIndexRef.current === sequence.length) {
          konamiIndexRef.current = 0;
          setUltraMode(true);

          if (konamiFlashTimeoutRef.current) clearTimeout(konamiFlashTimeoutRef.current);
          if (konamiMessageTimeoutRef.current) clearTimeout(konamiMessageTimeoutRef.current);

          setShowKonamiFlash(true);
          setShowKonamiMessage(true);
          konamiFlashTimeoutRef.current = setTimeout(() => setShowKonamiFlash(false), 360);
          konamiMessageTimeoutRef.current = setTimeout(() => setShowKonamiMessage(false), 1700);
        }
        return;
      }

      konamiIndexRef.current = key === sequence[0] ? 1 : 0;
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (konamiFlashTimeoutRef.current) {
        clearTimeout(konamiFlashTimeoutRef.current);
        konamiFlashTimeoutRef.current = null;
      }
      if (konamiMessageTimeoutRef.current) {
        clearTimeout(konamiMessageTimeoutRef.current);
        konamiMessageTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("gitdna_ultra_mode", ultraMode ? "1" : "0");
  }, [ultraMode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) return;

    let lastPaint = 0;
    const onMouseMove = (event) => {
      const now = performance.now();
      if (now - lastPaint < 18) return;
      lastPaint = now;

      const dot = document.createElement("div");
      dot.className = "gd-cursor-trail-dot";
      dot.style.left = `${event.clientX - 1.5}px`;
      dot.style.top = `${event.clientY - 1.5}px`;
      dot.style.opacity = "0.95";
      document.body.appendChild(dot);

      requestAnimationFrame(() => {
        dot.style.opacity = "0";
        dot.style.transform = "scale(0.25)";
      });

      setTimeout(() => {
        dot.remove();
      }, 620);
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  async function analyze(username) {
    const parsedUsername = parseGithubUsername(username);
    if (!parsedUsername) {
      setError("Enter a valid GitHub username or profile URL.");
      setPhase("error");
      return;
    }

    const selectedLoadingSteps = getLoadingSequenceForUsername(parsedUsername);
    const overrideStreamMessages = isFounderLogin(parsedUsername) || parsedUsername.toLowerCase() === TORVALDS_HANDLE;
    const initialMessage = selectedLoadingSteps[0] || LOADING_STEPS[0];

    setPhase("loading");
    setLoadingSteps(selectedLoadingSteps);
    setLoadingStep(0);
    setLoadingMessage(initialMessage);
    setLoadingFeed([initialMessage]);
    setError("");
    setBattleData(null);
    setIsFounder(isFounderLogin(parsedUsername));
    setStarTier(null);
    setNightOwlToastVisible(false);

    const endpoint = `${API_URL}/api/analyze/${encodeURIComponent(parsedUsername)}`;

    const applyResult = async (payload) => {
      let bundle = normalizeAnalysisPayload(payload, parsedUsername);
      bundle = await withContributionSeries(bundle);
      setGithub(bundle.github);
      setAiData(bundle.aiData);
      setDevScore(bundle.devScore);
      setLangs(bundle.langs);
      setActiveUsername(bundle.username);
      const founderDetected = isFounderLogin(bundle.username);
      setIsFounder(founderDetected);
      setStarTier(getStarTier(bundle.github.totalStars));

      const shouldShowNightOwl = isNightOwlProfile(bundle) && !nightOwlShownRef.current;
      if (shouldShowNightOwl) {
        setNightOwlToastVisible(true);
        setNightOwlShown(true);
      } else {
        setNightOwlToastVisible(false);
      }

      const profileUsername = bundle.username;
      window.history.pushState({}, "", buildAppPath(`u=${encodeURIComponent(profileUsername)}`));
      const finalStepIndex = Math.max(0, selectedLoadingSteps.length - 1);
      const finalMessage = selectedLoadingSteps[finalStepIndex] || selectedLoadingSteps[0] || LOADING_STEPS[0];
      setLoadingStep(finalStepIndex);
      setLoadingMessage(finalMessage);
      setLoadingFeed((prev) => prev.includes(finalMessage) ? prev : [...prev, finalMessage]);
      setPhase("dashboard");
    };

    const handleFailure = (message) => {
      setError(message || "Analysis failed.");
      setPhase("error");
    };

    const fallbackFetch = async () => {
      const penultimateStep = Math.max(0, selectedLoadingSteps.length - 2);
      const fallbackMessage = selectedLoadingSteps[penultimateStep] || selectedLoadingSteps[0] || LOADING_STEPS[0];
      setLoadingStep(penultimateStep);
      setLoadingMessage(fallbackMessage);
      setLoadingFeed((prev) => prev.includes(fallbackMessage) ? prev : [...prev, fallbackMessage]);
      const data = await fetchProfilePayload(parsedUsername);
      await applyResult(data);
    };

    try {
      if (streamRef.current) {
        streamRef.current.close();
        streamRef.current = null;
      }

      if (typeof window !== "undefined" && "EventSource" in window) {
        const source = new EventSource(endpoint);
        streamRef.current = source;

        source.onmessage = async (event) => {
          if (!event?.data) return;
          let packet;
          try {
            packet = JSON.parse(event.data);
          } catch {
            return;
          }

          if (typeof packet.step === "number") {
            const mappedStep = mapLoadingStep(packet.step, selectedLoadingSteps.length);
            setLoadingStep(mappedStep);

            if (overrideStreamMessages) {
              const overrideMessage = selectedLoadingSteps[mappedStep] || selectedLoadingSteps[0] || LOADING_STEPS[0];
              setLoadingMessage(overrideMessage);
              setLoadingFeed((prev) => prev.includes(overrideMessage) ? prev : [...prev, overrideMessage]);
            }
          }

          if (!overrideStreamMessages && typeof packet.message === "string" && packet.message.trim()) {
            const msg = packet.message.trim();
            setLoadingMessage(msg);
            setLoadingFeed((prev) => prev.includes(msg) ? prev : [...prev, msg]);
          }

          if (packet.done) {
            source.close();
            streamRef.current = null;
            try {
              await applyResult(packet.data || {});
            } catch (err) {
              handleFailure(err?.message || "Analysis failed.");
            }
          }
        };

        source.onerror = async () => {
          source.close();
          streamRef.current = null;
          try {
            await fallbackFetch();
          } catch (err) {
            handleFailure(err.message || "Analysis stream failed.");
          }
        };
        return;
      }

      await fallbackFetch();
    } catch (err) {
      handleFailure(err.message || "Analysis failed.");
    }
  }

  async function executeBattle(leftInput, rightInput, { showLoading = false } = {}) {
    const leftUsername = parseGithubUsername(leftInput);
    const rightUsername = parseGithubUsername(rightInput);

    if (!leftUsername || !rightUsername) {
      throw new Error("Provide two valid GitHub usernames for comparison.");
    }

    if (showLoading) {
      setPhase("loading");
      setLoadingSteps(LOADING_STEPS);
      setLoadingStep(0);
      setLoadingMessage(LOADING_STEPS[0]);
      setLoadingFeed([LOADING_STEPS[0]]);
      setError("");
    }

    setCompareBusy(true);
    try {
      const [leftPayload, rightPayload] = await Promise.all([
        fetchProfilePayload(leftUsername),
        fetchProfilePayload(rightUsername),
      ]);

      if (showLoading) {
        setLoadingStep(7);
        setLoadingMessage(LOADING_STEPS[7]);
        setLoadingFeed((prev) => prev.includes(LOADING_STEPS[7]) ? prev : [...prev, LOADING_STEPS[7]]);
      }

      let leftBundle = normalizeAnalysisPayload(leftPayload, leftUsername);
      let rightBundle = normalizeAnalysisPayload(rightPayload, rightUsername);

      [leftBundle, rightBundle] = await Promise.all([
        withContributionSeries(leftBundle),
        withContributionSeries(rightBundle),
      ]);

      let analysis = "";
      try {
        analysis = await fetchBattleNarrative(leftPayload, rightPayload);
      } catch {
        analysis = buildBattleFallbackAnalysis(leftBundle, rightBundle);
      }

      setGithub(leftBundle.github);
      setAiData(leftBundle.aiData);
      setDevScore(leftBundle.devScore);
      setLangs(leftBundle.langs);
      setActiveUsername(leftBundle.username);
      setIsFounder(isFounderLogin(leftBundle.username));
      setStarTier(getStarTier(leftBundle.github.totalStars));
      setNightOwlToastVisible(false);
      setBattleData({ left: leftBundle, right: rightBundle, analysis });

      const slug = battleSlug(leftBundle.username, rightBundle.username);
      window.history.pushState({}, "", buildAppPath(`battle=${encodeURIComponent(slug)}`));

      if (showLoading) {
        setLoadingStep(9);
        setLoadingMessage(LOADING_STEPS[9]);
        setLoadingFeed((prev) => prev.includes(LOADING_STEPS[9]) ? prev : [...prev, LOADING_STEPS[9]]);
      }
      beginBattleIntro();
    } finally {
      setCompareBusy(false);
    }
  }

  async function onCompareFromDashboard(opponentInput) {
    const currentUsername = activeUsername || github?.user?.login;
    if (!currentUsername) {
      throw new Error("Current profile not loaded yet.");
    }
    await executeBattle(currentUsername, opponentInput, { showLoading: false });
  }

  async function onRoastFromDashboard() {
    const currentUsername = activeUsername || github?.user?.login;
    if (!currentUsername || !github) {
      throw new Error("Load a profile before requesting a roast.");
    }

    return fetchRoastReport({
      username: currentUsername,
      github,
      ai: aiData,
      devScore,
      langs,
    });
  }

  function exitBattleView() {
    setBattleData(null);
    const fallbackUsername = activeUsername || github?.user?.login;
    if (fallbackUsername) {
      window.history.pushState({}, "", buildAppPath(`u=${encodeURIComponent(fallbackUsername)}`));
    } else {
      window.history.pushState({}, "", buildAppPath());
    }
  }

  async function shareBattleLink() {
    if (!battleData?.left?.username || !battleData?.right?.username) return;
    const slug = battleSlug(battleData.left.username, battleData.right.username);
    const path = buildAppUrl(`battle=${encodeURIComponent(slug)}`);
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(path);
      }
    } catch {
      // Ignore clipboard failures to avoid breaking the view.
    }
  }

  useEffect(() => () => {
    if (streamRef.current) {
      streamRef.current.close();
      streamRef.current = null;
    }
    if (battleIntroTimerRef.current) {
      clearTimeout(battleIntroTimerRef.current);
      battleIntroTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (autoAnalyzeRef.current) return;
    autoAnalyzeRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const battleParam = params.get("battle");
    const urlBattle = parseBattleParam(battleParam);
    if (urlBattle) {
      executeBattle(urlBattle.left, urlBattle.right, { showLoading: true }).catch((err) => {
        setError(err?.message || "Battle analysis failed.");
        setPhase("error");
      });
      return;
    }

    const urlUsername = params.get("u");
    if (urlUsername && urlUsername.trim()) {
      const parsedUsername = parseGithubUsername(urlUsername.trim());
      if (parsedUsername) analyze(parsedUsername);
    }
  }, []);

  if (phase === "landing") return (
    <>
      <style>{CSS}</style>
      <LandingPage onAnalyze={analyze} ultraMode={ultraMode} />
      <GlobalEasterEggOverlays
        ultraMode={ultraMode}
        showKonamiFlash={showKonamiFlash}
        showKonamiMessage={showKonamiMessage}
      />
    </>
  );

  if (phase === "loading") return (
    <>
      <style>{CSS}</style>
      <LoadingPage
        step={loadingStep}
        message={loadingMessage}
        feed={loadingFeed}
        steps={loadingSteps}
        ultraMode={ultraMode}
      />
      <GlobalEasterEggOverlays
        ultraMode={ultraMode}
        showKonamiFlash={showKonamiFlash}
        showKonamiMessage={showKonamiMessage}
      />
    </>
  );

  if (phase === "battle-intro") return (
    <>
      <style>{CSS}</style>
      <BattleIntro
        leftUsername={battleData?.left?.username || activeUsername || "UNKNOWN"}
        rightUsername={battleData?.right?.username || "OPPONENT"}
        ultraMode={ultraMode}
      />
      <GlobalEasterEggOverlays
        ultraMode={ultraMode}
        showKonamiFlash={showKonamiFlash}
        showKonamiMessage={showKonamiMessage}
      />
    </>
  );

  if (phase === "error") return (
    <>
      <style>{CSS}</style>
      <div className={`gd-root${ultraMode ? " gd-ultra-mode" : ""}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 20, zIndex: 2, position: "relative" }}>
        <BackgroundCanvas />
        <div className="gd-scanlines" />
        <div className="gd-card" style={{ padding: 28, maxWidth: 440, textAlign: "center", zIndex: 2, position: "relative" }}>
          <div className="orb" style={{ color: "#ff4545", fontSize: "1rem", marginBottom: 12, letterSpacing: "0.1em" }}>⚠ SCAN FAILURE</div>
          <p style={{ color: "rgba(200,232,255,0.6)", marginBottom: 20, fontFamily: "Share Tech Mono,monospace", fontSize: "0.8rem" }}>{error}</p>
          <button className="gd-btn" onClick={() => setPhase("landing")}>◀ RETRY</button>
        </div>
      </div>
      <GlobalEasterEggOverlays
        ultraMode={ultraMode}
        showKonamiFlash={showKonamiFlash}
        showKonamiMessage={showKonamiMessage}
      />
    </>
  );

  return (
    <>
      <style>{CSS}</style>
      {battleData ? (
        <CompareView
          battleData={battleData}
          onBack={exitBattleView}
          onShareBattle={shareBattleLink}
          ultraMode={ultraMode}
        />
      ) : (
        <Dashboard
          github={github}
          aiData={aiData}
          devScore={devScore}
          langs={langs}
          username={activeUsername}
          compareBusy={compareBusy}
          onCompare={onCompareFromDashboard}
          isFounderState={isFounder}
          starTier={starTier}
          nightOwlToastVisible={nightOwlToastVisible}
          onNightOwlDismiss={() => setNightOwlToastVisible(false)}
          ultraMode={ultraMode}
          onRoast={onRoastFromDashboard}
          onReset={() => {
            setPhase("landing");
            setLoadingSteps(LOADING_STEPS);
            setBattleData(null);
            setGithub(null);
            setAiData(null);
            setDevScore(0);
            setLangs([]);
            setActiveUsername("");
            setIsFounder(false);
            setStarTier(null);
            setNightOwlToastVisible(false);
            window.history.pushState({}, "", buildAppPath());
          }}
        />
      )}
      <GlobalEasterEggOverlays
        ultraMode={ultraMode}
        showKonamiFlash={showKonamiFlash}
        showKonamiMessage={showKonamiMessage}
      />
    </>
  );
}
