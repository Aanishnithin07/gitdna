import { useState, useEffect, useRef, useMemo, useId } from "react";
import { createPortal } from "react-dom";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
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
const BALATHARUNR_HANDLE = "balatharunr";
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
const COMMIT_LINGUISTICS_CACHE = new Map();
const NEWSPAPER_AI_CACHE = new Map();
const GITHUB_API_BASE = "https://api.github.com";
const GITHUB_TOKEN = String(import.meta.env.VITE_GITHUB_TOKEN || "").trim();
const GITHUB_API_HEADERS = {
  Accept: "application/vnd.github+json",
  ...(GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {}),
};

function isGithubRateLimitResponse(response) {
  if (!response) return false;
  if (response.status !== 403) return false;
  return String(response.headers?.get("x-ratelimit-remaining") || "") === "0";
}

async function fetchGithubJson(path, { notFoundMessage = "GitHub resource not found." } = {}) {
  const normalizedPath = String(path || "").startsWith("/") ? String(path) : `/${String(path || "")}`;
  const response = await fetch(`${GITHUB_API_BASE}${normalizedPath}`, {
    headers: GITHUB_API_HEADERS,
  });

  if (isGithubRateLimitResponse(response)) {
    throw new Error(RATE_LIMIT_MESSAGE);
  }

  if (response.status === 404) {
    throw new Error(notFoundMessage);
  }

  if (!response.ok) {
    throw new Error(`GitHub API error (${response.status}).`);
  }

  return response.json();
}

function getLocalDayKey(value = Date.now()) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getReadableLocalDate(value = Date.now()) {
  const date = new Date(value);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

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

const TRADING_CARD_STYLES = `
.tc-overlay{position:fixed;inset:0;z-index:9998;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(3,8,14,.78);backdrop-filter:blur(8px)}
.tc-shell{display:flex;flex-direction:column;align-items:center;gap:10px}
.tc-card{position:relative;width:320px;height:480px;perspective:1400px;cursor:pointer;--mx:50;--my:50}
.tc-inner{position:relative;width:100%;height:100%;transform-style:preserve-3d;transition:transform .68s cubic-bezier(.2,.8,.2,1)}
.tc-inner.flipped{transform:rotateY(180deg)}
.tc-face{position:absolute;inset:0;border-radius:14px;overflow:hidden;background:linear-gradient(180deg,#0a121f,#0a101b 46%,#0a0f18);border:1px solid rgba(255,255,255,.16);box-shadow:0 16px 40px rgba(0,0,0,.45),inset 0 0 24px rgba(255,255,255,.03);backface-visibility:hidden;display:flex;flex-direction:column}
.tc-face::before{content:'';position:absolute;inset:0;border-radius:14px;border:1px solid rgba(255,255,255,.08);pointer-events:none}
.tc-back{transform:rotateY(180deg)}
.tc-header{height:36px;padding:0 10px;background:var(--tier-band);display:flex;align-items:center;justify-content:space-between;font-family:'Share Tech Mono',monospace;font-size:.54rem;letter-spacing:.1em;color:rgba(255,255,255,.92);text-transform:uppercase}
.tc-portrait{position:relative;height:192px;border-bottom:1px solid rgba(255,255,255,.1);overflow:hidden;background:#060b12}
.tc-portrait img{width:100%;height:100%;object-fit:cover;filter:saturate(.62) contrast(1.05)}
.tc-username{position:absolute;left:10px;right:10px;bottom:8px;padding:4px 7px;border:1px solid rgba(0,220,255,.32);background:rgba(4,10,20,.7);backdrop-filter:blur(4px);font-family:'Orbitron',monospace;font-size:.75rem;letter-spacing:.08em;color:#e8f9ff;text-shadow:0 0 10px rgba(0,220,255,.32)}
.tc-holo{position:absolute;inset:0;pointer-events:none;background:linear-gradient(135deg,transparent 40%,rgba(255,255,255,0.08) 50%,transparent 60%);mix-blend-mode:screen;opacity:.88;transform:translate(calc((var(--mx) - 50) * 0.24px),calc((var(--my) - 50) * 0.24px));transition:transform .08s linear,opacity .2s ease}
.tc-card:hover .tc-holo{opacity:1}
.tc-stats{display:grid;grid-template-columns:1fr 1fr;gap:6px 10px;padding:11px 12px 6px}
.tc-stat{display:flex;justify-content:space-between;align-items:center;font-family:'Share Tech Mono',monospace;font-size:.58rem;letter-spacing:.08em;color:rgba(0,220,255,.75);padding-bottom:4px;border-bottom:1px dashed rgba(0,220,255,.16)}
.tc-stat strong{font-family:'Orbitron',monospace;color:#e6f8ff;font-size:.68rem;letter-spacing:.03em}
.tc-devscore{padding:6px 12px 8px;text-align:center}
.tc-devscore-label{font-family:'Share Tech Mono',monospace;font-size:.55rem;letter-spacing:.14em;color:rgba(0,220,255,.55)}
.tc-devscore-value{font-family:'Orbitron',monospace;font-size:1.7rem;line-height:1;color:#00dcff;text-shadow:0 0 14px rgba(0,220,255,.38)}
.tc-ability{margin:0 12px 8px;padding:9px 10px;border:1px solid rgba(255,255,255,.16);background:rgba(4,10,18,.74);border-radius:8px}
.tc-ability-title{font-family:'Share Tech Mono',monospace;font-size:.54rem;letter-spacing:.14em;color:rgba(255,179,0,.74);margin-bottom:4px}
.tc-ability-main{font-family:'Orbitron',monospace;font-size:.74rem;color:#fff;letter-spacing:.05em;line-height:1.35}
.tc-ability-sub{margin-top:4px;font-family:'Share Tech Mono',monospace;font-size:.56rem;color:rgba(0,220,255,.58);letter-spacing:.09em}
.tc-footer{margin-top:auto;padding:8px 10px;border-top:1px solid rgba(255,255,255,.12);display:flex;align-items:center;justify-content:space-between;gap:8px;font-family:'Share Tech Mono',monospace;font-size:.5rem;letter-spacing:.08em;color:rgba(200,232,255,.64)}
.tc-dna{max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tc-card-number{font-family:'Orbitron',monospace;color:#ffd770;font-size:.62rem;letter-spacing:.08em}
.tc-rarity{position:absolute;right:10px;bottom:34px;padding:3px 8px;border-radius:999px;border:1px solid rgba(255,255,255,.26);font-family:'Share Tech Mono',monospace;font-size:.5rem;letter-spacing:.12em;background:rgba(4,10,18,.84);color:#dff7ff;text-transform:uppercase}
.tc-back-wrap{padding:10px 10px 8px;height:100%;display:flex;flex-direction:column;gap:8px}
.tc-radar{display:grid;place-items:center;border:1px solid rgba(0,220,255,.2);border-radius:10px;background:rgba(4,14,24,.7);padding:8px}
.tc-textbox{border:1px solid rgba(255,255,255,.16);border-radius:8px;background:rgba(5,10,18,.72);padding:8px}
.tc-textbox h4{font-family:'Share Tech Mono',monospace;font-size:.54rem;letter-spacing:.12em;color:rgba(0,220,255,.62);margin:0 0 4px}
.tc-textbox p{font-family:'Rajdhani',sans-serif;font-size:.72rem;line-height:1.35;color:rgba(220,240,255,.9);margin:0}
.tc-logo{margin-top:auto;text-align:center;font-family:'Orbitron',monospace;font-size:1.2rem;letter-spacing:.2em;color:rgba(0,220,255,.72);text-shadow:0 0 14px rgba(0,220,255,.25)}
.tc-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
.tc-hint{font-family:'Share Tech Mono',monospace;font-size:.55rem;letter-spacing:.12em;color:rgba(0,220,255,.56)}
.tc-copy{font-family:'Share Tech Mono',monospace;font-size:.58rem;letter-spacing:.08em;color:#39ff14}
.tc-card.tc-rarity-mythic .tc-face{border-color:rgba(224,214,255,.8);box-shadow:0 0 18px rgba(192,135,255,.32),0 0 32px rgba(0,220,255,.24),0 16px 40px rgba(0,0,0,.45);animation:tc-hue 7s linear infinite}
.tc-card.tc-rarity-legendary .tc-face{border-color:rgba(255,215,110,.82);box-shadow:0 0 20px rgba(255,190,80,.33),0 16px 40px rgba(0,0,0,.45)}
.tc-card.tc-rarity-rare .tc-face{border-color:rgba(193,122,255,.74);box-shadow:0 0 18px rgba(179,71,234,.35),0 16px 40px rgba(0,0,0,.45)}
.tc-card.tc-rarity-uncommon .tc-face{border-color:rgba(76,231,255,.68);box-shadow:0 0 14px rgba(0,220,255,.28),0 16px 40px rgba(0,0,0,.45)}
.tc-card.tc-rarity-common .tc-face{border-color:rgba(176,188,206,.48)}
.tc-card.tc-rarity-legendary .tc-face::after{content:'';position:absolute;inset:-80% -20%;background:linear-gradient(120deg,transparent 42%,rgba(255,220,120,.24) 50%,transparent 58%);animation:tc-shimmer 4.2s linear infinite;pointer-events:none}
.tc-card.tc-collab-silver .tc-face{border-color:rgba(214,223,233,.88);box-shadow:0 0 20px rgba(220,228,240,.35),0 0 34px rgba(152,168,186,.24),0 16px 40px rgba(0,0,0,.45)}
.tc-card.tc-collab-silver .tc-face::after{content:'';position:absolute;inset:-80% -20%;background:linear-gradient(120deg,transparent 40%,rgba(236,242,249,.34) 50%,transparent 60%);animation:tc-shimmer 3.4s linear infinite;pointer-events:none}
.tc-card.tc-collab-silver .tc-rarity{border-color:rgba(222,232,246,.65);color:rgba(232,241,253,.96);box-shadow:0 0 10px rgba(214,223,236,.28)}
.tc-card.tc-collab-silver .tc-card-number{color:#f1f6ff;text-shadow:0 0 10px rgba(216,228,242,.5)}
.tc-export-static,.tc-export-static *{animation:none!important;transition:none!important}
@keyframes tc-hue{from{filter:hue-rotate(0deg)}to{filter:hue-rotate(360deg)}}
@keyframes tc-shimmer{0%{transform:translateX(-45%) translateY(-10%)}100%{transform:translateX(55%) translateY(10%)}}
@media (max-width:430px){.tc-overlay{padding:10px}.tc-card{transform:scale(.92);transform-origin:center top;margin-bottom:-34px}}
`;

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
@keyframes ach-reveal{from{opacity:0;transform:scale(.8);filter:blur(4px)}to{opacity:1;transform:scale(1);filter:blur(0)}}
@keyframes ach-legendary-flash{0%{opacity:0}35%{opacity:.4}100%{opacity:0}}
@keyframes ach-legendary-shimmer{0%{transform:translateX(-120%);opacity:0}20%{opacity:1}100%{transform:translateX(140%);opacity:0}}
@keyframes ach-vault-backdrop-in{from{opacity:0}to{opacity:1}}
@keyframes ach-vault-shell-in{0%{opacity:0;transform:translateY(52px) scale(.95)}100%{opacity:1;transform:translateY(0) scale(1)}}
@keyframes ach-vault-scan{0%{transform:translateY(-120%)}100%{transform:translateY(520%)}}
@keyframes ach-vault-title-flicker{0%,100%{opacity:1}48%{opacity:.84}50%{opacity:.72}52%{opacity:.98}}
@keyframes ach-vault-orb-pulse{0%,100%{box-shadow:0 0 0 rgba(0,220,255,0)}50%{box-shadow:0 0 18px rgba(0,220,255,.35)}}

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

.gd-commit-toggle{padding:7px 12px;font-size:.6rem;letter-spacing:.11em}
.gd-commit-score-pill{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 12px;border:1px solid rgba(0,220,255,0.28);border-radius:8px;background:rgba(6,16,30,0.74)}
.gd-commit-tier{display:inline-flex;align-items:center;padding:4px 9px;border:1px solid currentColor;border-radius:999px;font-family:'Share Tech Mono',monospace;font-size:.54rem;letter-spacing:.12em}
.gd-commit-rows{display:flex;flex-direction:column;gap:7px;margin-top:10px}
.gd-commit-row{display:flex;align-items:center;gap:10px;border:1px solid rgba(0,220,255,0.25);border-radius:8px;padding:8px 10px}
.gd-commit-grade{display:inline-flex;align-items:center;justify-content:center;min-width:34px;padding:3px 7px;border:1px solid currentColor;border-radius:6px;font-family:'Orbitron',monospace;font-size:.62rem;letter-spacing:.08em;line-height:1}
.gd-commit-eye{font-size:.85rem;line-height:1;filter:drop-shadow(0 0 4px rgba(255,179,0,.5))}
.gd-commit-eye-tip{position:relative;display:inline-flex;align-items:center;justify-content:center;cursor:help}
.gd-commit-eye-bubble{position:absolute;right:-6px;bottom:125%;width:min(220px,70vw);padding:7px 8px;border-radius:6px;border:1px solid rgba(255,179,0,.45);background:rgba(22,14,3,.95);color:rgba(255,224,168,.95);font-family:'Share Tech Mono',monospace;font-size:.54rem;line-height:1.45;letter-spacing:.08em;opacity:0;transform:translateY(6px);transition:all .18s ease;pointer-events:none;z-index:4}
.gd-commit-eye-tip:hover .gd-commit-eye-bubble{opacity:1;transform:translateY(0)}

.gd-achievement-vault-header{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap}
.gd-achievement-vault-title{font-family:'Share Tech Mono',monospace;font-size:.64rem;letter-spacing:.16em;color:rgba(0,220,255,.58)}
.gd-achievement-progress-wrap{display:flex;align-items:center;gap:10px}
.gd-achievement-progress-text{font-family:'Orbitron',monospace;font-size:.66rem;letter-spacing:.1em;color:#dff7ff;text-align:right;line-height:1.35}
.gd-achievement-progress-ring{position:relative;width:40px;height:40px;display:grid;place-items:center;flex-shrink:0}
.gd-achievement-progress-ring svg{position:absolute;inset:0;transform:rotate(-90deg)}
.gd-achievement-progress-value{font-family:'Share Tech Mono',monospace;font-size:.54rem;letter-spacing:.08em;color:rgba(0,220,255,.78)}

.gd-achievement-filter-row{margin-top:10px;display:flex;flex-wrap:wrap;gap:8px}
.gd-achievement-filter-pill{padding:5px 10px;border-radius:999px;border:1px solid rgba(0,220,255,.25);background:rgba(0,220,255,.07);color:rgba(0,220,255,.72);font-family:'Share Tech Mono',monospace;font-size:.56rem;letter-spacing:.11em;cursor:pointer;transition:all .2s ease}
.gd-achievement-filter-pill:hover{border-color:rgba(0,220,255,.45);background:rgba(0,220,255,.14)}
.gd-achievement-filter-pill.active{border-color:rgba(0,220,255,.65);background:rgba(0,220,255,.2);color:#00dcff;box-shadow:0 0 14px rgba(0,220,255,.18)}

.gd-achievement-summary{margin-top:12px;padding:8px 10px;border:1px solid rgba(0,220,255,.2);border-radius:8px;background:rgba(6,16,30,.72);display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.gd-achievement-summary-item{display:inline-flex;align-items:center;gap:6px;font-family:'Share Tech Mono',monospace;font-size:.58rem;letter-spacing:.08em;color:rgba(200,232,255,.76)}
.gd-achievement-summary-dot{width:7px;height:7px;border-radius:2px;display:inline-block;box-shadow:0 0 10px currentColor}

.gd-achievement-grid{margin-top:12px;display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px}
.gd-achievement-card{position:relative;border-radius:8px;padding:12px 10px 10px;background:rgba(4,14,26,.9);border:1px solid rgba(255,255,255,.06);min-height:220px;display:flex;flex-direction:column;align-items:center;text-align:center;overflow:hidden;transition:transform .2s ease,filter .2s ease,opacity .2s ease}
.gd-achievement-card--unlocked{opacity:0;transform:scale(.8);filter:blur(4px)}
.gd-achievement-card--unlocked.gd-achievement-card--revealed{animation:ach-reveal .55s cubic-bezier(.2,.8,.2,1) forwards;animation-delay:calc(var(--ach-delay,0ms) + var(--ach-legendary-delay,0ms))}
.gd-achievement-card--legendary-unlocked::before{content:'';position:absolute;inset:0;background:rgba(255,215,0,.4);opacity:0;pointer-events:none;animation:ach-legendary-flash .3s ease-out forwards;animation-delay:var(--ach-delay,0ms)}
.gd-achievement-card--legendary-unlocked::after{content:'';position:absolute;inset:-8px;pointer-events:none;background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.88) 50%,transparent 70%);opacity:0;transform:translateX(-120%);animation:ach-legendary-shimmer .8s ease forwards;animation-delay:calc(var(--ach-delay,0ms) + 300ms)}
.gd-achievement-card--locked{filter:grayscale(100%) opacity(.35);border:1px solid rgba(255,255,255,.06);cursor:not-allowed}
.gd-achievement-card--locked:hover{filter:grayscale(60%) opacity(.6)}
.gd-achievement-pip{position:absolute;top:8px;left:8px;width:6px;height:6px;border-radius:50%;background:var(--ach-color,#00dcff);box-shadow:0 0 8px var(--ach-color,#00dcff)}
.gd-achievement-icon{font-size:2rem;line-height:1;filter:drop-shadow(0 0 6px var(--ach-color,#00dcff));margin-top:14px}
.gd-achievement-card--locked .gd-achievement-icon{font-size:2rem;color:rgba(255,255,255,.15);filter:none;text-shadow:none}
.gd-achievement-name{margin-top:8px;font-family:'Orbitron',monospace;font-size:.65rem;letter-spacing:.1em;color:var(--ach-color,#00dcff);line-height:1.35}
.gd-achievement-desc{margin-top:4px;font-family:'Share Tech Mono',monospace;font-size:.58rem;line-height:1.45;color:rgba(200,232,255,.5)}
.gd-achievement-flavor{margin-top:8px;padding-top:8px;border-top:1px solid var(--ach-divider,rgba(255,255,255,.12));font-family:'Rajdhani',sans-serif;font-size:.78rem;font-style:italic;line-height:1.5;color:rgba(200,232,255,.7);width:100%}
.gd-achievement-card--locked .gd-achievement-flavor{color:rgba(200,232,255,.62);opacity:.56}
.gd-achievement-card--locked:hover .gd-achievement-flavor{opacity:.95}
.gd-achievement-rarity-pill{margin-top:auto;padding:3px 8px;border-radius:999px;border:1px solid currentColor;font-family:'Share Tech Mono',monospace;font-size:.52rem;letter-spacing:.12em;background:var(--ach-pill-bg,rgba(0,220,255,.12));color:var(--ach-color,#00dcff)}
.gd-achievement-empty{margin-top:12px;border:1px dashed rgba(0,220,255,.26);border-radius:8px;padding:12px;font-family:'Share Tech Mono',monospace;font-size:.62rem;letter-spacing:.07em;color:rgba(200,232,255,.62);text-align:center}
.gd-achievement-actions{margin-top:12px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.gd-achievement-compact-label{margin-top:12px;font-family:'Share Tech Mono',monospace;font-size:.56rem;letter-spacing:.15em;color:rgba(0,220,255,.62)}
.gd-achievement-grid--compact{max-height:410px;overflow:auto;padding-right:4px}
.gd-achievement-vault-open-btn{border-color:rgba(255,215,0,.38)!important;color:#ffd770!important;background:linear-gradient(135deg,rgba(255,215,0,.16),rgba(0,220,255,.16))!important;animation:ach-vault-orb-pulse 2.4s ease-in-out infinite}

.gd-achievement-vault-overlay{position:fixed;inset:0;z-index:96;display:flex;align-items:flex-end;justify-content:center;padding:20px;background:radial-gradient(circle at 50% 10%,rgba(0,220,255,.14),rgba(4,10,20,.92) 45%,rgba(2,4,10,.97) 100%);backdrop-filter:blur(8px);animation:ach-vault-backdrop-in .3s ease forwards}
.gd-achievement-vault-shell{position:relative;width:min(1180px,96vw);max-height:min(84vh,860px);border:1px solid rgba(0,220,255,.36);border-radius:14px 14px 10px 10px;background:linear-gradient(180deg,rgba(7,18,34,.97),rgba(4,12,24,.97));box-shadow:0 0 34px rgba(0,220,255,.2),0 0 50px rgba(179,71,234,.12);display:flex;flex-direction:column;overflow:hidden;animation:ach-vault-shell-in .45s cubic-bezier(.2,.8,.2,1) forwards}
.gd-achievement-vault-shell::before{content:'';position:absolute;inset:0;pointer-events:none;background:linear-gradient(120deg,transparent 28%,rgba(0,220,255,.1) 46%,transparent 65%);opacity:.5}
.gd-achievement-vault-shell::after{content:'';position:absolute;left:-20%;right:-20%;top:0;height:2px;background:linear-gradient(90deg,transparent,rgba(0,220,255,.7),transparent);opacity:.6;pointer-events:none;animation:ach-vault-scan 3.5s linear infinite}
.gd-achievement-vault-top{padding:14px 16px;border-bottom:1px solid rgba(0,220,255,.2);display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;position:relative;z-index:1}
.gd-achievement-vault-heading{font-family:'Orbitron',monospace;font-size:.75rem;letter-spacing:.15em;color:#dff7ff;animation:ach-vault-title-flicker 2.8s steps(1,end) infinite}
.gd-achievement-vault-sub{margin-top:5px;font-family:'Share Tech Mono',monospace;font-size:.56rem;letter-spacing:.1em;color:rgba(0,220,255,.58)}
.gd-achievement-vault-close{padding:6px 10px;border-radius:999px;border:1px solid rgba(255,120,120,.45);background:rgba(44,12,14,.75);color:#ff9b9b;font-family:'Share Tech Mono',monospace;font-size:.56rem;letter-spacing:.12em;cursor:pointer;transition:all .2s ease}
.gd-achievement-vault-close:hover{background:rgba(64,16,20,.86);border-color:rgba(255,120,120,.65)}
.gd-achievement-vault-close-icon{position:absolute;top:10px;right:10px;width:34px;height:34px;border-radius:999px;border:1px solid rgba(255,120,120,.5);background:rgba(44,12,14,.8);color:#ffb4b4;font-family:'Orbitron',monospace;font-size:.92rem;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:3;transition:all .2s ease}
.gd-achievement-vault-close-icon:hover{background:rgba(66,14,18,.92);border-color:rgba(255,120,120,.72);color:#ffd2d2}
.gd-achievement-vault-body{padding:12px 14px 16px;overflow:auto;position:relative;z-index:1}
.gd-achievement-grid--panel{margin-top:10px}
.gd-achievement-vault-footer{margin-top:14px;padding-top:12px;border-top:1px solid rgba(0,220,255,.18);display:flex;justify-content:flex-end}

@media (max-width:720px){
  .gd-achievement-vault-overlay{padding:10px}
  .gd-achievement-vault-shell{width:100%;max-height:90vh;border-radius:12px}
}

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
  const messages = [];
  const hours = [];
  const repoActivity = {};

  const safeEvents = Array.isArray(events) ? events : [];
  const pushEventCount = safeEvents.filter((event) => event?.type === "PushEvent").length;

  console.log("[GitDNA] Events received:", safeEvents.length);
  console.log("[GitDNA] Push events:", pushEventCount);

  if (!Array.isArray(events)) {
    console.log("[GitDNA] Messages extracted:", 0);
    return { messages: [], messageTexts: [], hours: [], repoActivity: {} };
  }

  safeEvents.forEach((event) => {
    if (event?.type !== "PushEvent") return;

    if (event?.created_at) {
      const hour = new Date(event.created_at).getUTCHours();
      if (Number.isInteger(hour) && hour >= 0 && hour <= 23) {
        hours.push(hour);
      }
    }

    const repoName = String(event?.repo?.name || "")
      .split("/")
      .filter(Boolean)[1] || "unknown";

    const commits = event?.payload?.commits;
    if (!Array.isArray(commits)) return;

    commits.forEach((commit) => {
      const msg = commit?.message;
      if (!msg || typeof msg !== "string") return;

      const firstLine = msg.split("\n")[0].trim();
      if (firstLine.length === 0) return;

      const rawSha = typeof commit?.sha === "string" ? commit.sha : "";
      messages.push({
        message: firstLine,
        repo: repoName,
        timestamp: event?.created_at || "",
        sha: rawSha ? rawSha.slice(0, 7) : "???????",
      });

      repoActivity[repoName] = (repoActivity[repoName] || 0) + 1;
    });
  });

  const uniqueMessages = [];
  const seen = new Set();
  for (const entry of messages) {
    const key = `${String(entry.repo || "unknown").toLowerCase()}::${String(entry.message || "").toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    uniqueMessages.push(entry);
    if (uniqueMessages.length >= 30) break;
  }

  console.log("[GitDNA] Messages extracted:", uniqueMessages.length);

  return {
    messages: uniqueMessages,
    messageTexts: uniqueMessages.map((entry) => entry.message),
    hours,
    repoActivity,
  };
}

const COMMIT_GRADE_META = {
  "A+": {
    badgeColor: "#ffd770",
    badgeBg: "rgba(255,215,112,0.15)",
    badgeBorder: "rgba(255,215,112,0.48)",
    rowTint: "rgba(255,215,112,0.06)",
  },
  A: {
    badgeColor: "rgba(255,215,112,0.82)",
    badgeBg: "rgba(255,215,112,0.12)",
    badgeBorder: "rgba(255,215,112,0.34)",
    rowTint: "rgba(255,215,112,0.05)",
  },
  B: {
    badgeColor: "#8deeff",
    badgeBg: "rgba(0,220,255,0.15)",
    badgeBorder: "rgba(0,220,255,0.42)",
    rowTint: "rgba(0,220,255,0.06)",
  },
  C: {
    badgeColor: "#ffc978",
    badgeBg: "rgba(255,201,120,0.16)",
    badgeBorder: "rgba(255,201,120,0.42)",
    rowTint: "rgba(255,201,120,0.07)",
  },
  D: {
    badgeColor: "#ffab66",
    badgeBg: "rgba(255,171,102,0.16)",
    badgeBorder: "rgba(255,171,102,0.45)",
    rowTint: "rgba(255,171,102,0.07)",
  },
  F: {
    badgeColor: "#ff9d9d",
    badgeBg: "rgba(255,88,88,0.17)",
    badgeBorder: "rgba(255,88,88,0.48)",
    rowTint: "rgba(255,88,88,0.08)",
  },
};

const COMMIT_RENDER_LIMIT = 15;

const ACHIEVEMENT_RARITY_COLORS = {
  COMMON: "rgba(136,136,136,1)",
  UNCOMMON: "rgba(57,255,20,1)",
  RARE: "rgba(0,220,255,1)",
  EPIC: "rgba(179,71,234,1)",
  LEGENDARY: "rgba(255,215,0,1)",
};

const ACHIEVEMENT_RARITY_META = {
  COMMON: { rank: 0, color: ACHIEVEMENT_RARITY_COLORS.COMMON },
  UNCOMMON: { rank: 1, color: ACHIEVEMENT_RARITY_COLORS.UNCOMMON },
  RARE: { rank: 2, color: ACHIEVEMENT_RARITY_COLORS.RARE },
  EPIC: { rank: 3, color: ACHIEVEMENT_RARITY_COLORS.EPIC },
  LEGENDARY: { rank: 4, color: ACHIEVEMENT_RARITY_COLORS.LEGENDARY },
};

const ACHIEVEMENT_RARITY_ORDER = ["LEGENDARY", "EPIC", "RARE", "UNCOMMON", "COMMON"];
const ACHIEVEMENT_FILTERS = ["ALL", ...ACHIEVEMENT_RARITY_ORDER];

function rgbaWithAlpha(color, alpha) {
  const safeAlpha = clampNumber(Number(alpha) || 0, 0, 1);
  const match = String(color || "").match(/^rgba?\(([^)]+)\)$/i);
  if (!match) return color;
  const parts = match[1].split(",").map((part) => part.trim());
  if (parts.length < 3) return color;
  return `rgba(${parts[0]},${parts[1]},${parts[2]},${safeAlpha})`;
}

function createAchievement(definition) {
  const rarity = String(definition?.rarity || "COMMON").toUpperCase();
  return {
    ...definition,
    rarity,
    rarityColor: ACHIEVEMENT_RARITY_COLORS[rarity] || ACHIEVEMENT_RARITY_COLORS.COMMON,
  };
}

const ACHIEVEMENTS = [
  createAchievement({
    id: "first_blood",
    icon: "🩸",
    name: "FIRST BLOOD",
    description: "Created your first repository",
    rarity: "COMMON",
    condition: (data) => data.totalRepos >= 1,
    unlockedText: "The journey starts with a single commit.",
    lockedText: "Create your first repository.",
  }),
  createAchievement({
    id: "night_shift",
    icon: "🌑",
    name: "NIGHT SHIFT",
    description: "Committed code after midnight",
    rarity: "COMMON",
    condition: (data) => data.avgCommitHour >= 0 && data.avgCommitHour <= 4,
    unlockedText: "Sleep is for the compiled.",
    lockedText: "Commit code between midnight and 4am.",
  }),
  createAchievement({
    id: "polyglot_init",
    icon: "🗣",
    name: "POLYGLOT INIT",
    description: "Used 3 or more programming languages",
    rarity: "COMMON",
    condition: (data) => data.topLangs.length >= 3,
    unlockedText: "You speak in multiple tongues.",
    lockedText: "Use at least 3 different languages.",
  }),
  createAchievement({
    id: "social_signal",
    icon: "📡",
    name: "SOCIAL SIGNAL",
    description: "Gained your first 10 followers",
    rarity: "COMMON",
    condition: (data) => data.followers >= 10,
    unlockedText: "People are watching. Build accordingly.",
    lockedText: "Reach 10 followers.",
  }),
  createAchievement({
    id: "repo_hoarder",
    icon: "📦",
    name: "REPO HOARDER",
    description: "Created 20+ repositories",
    rarity: "COMMON",
    condition: (data) => data.totalRepos >= 20,
    unlockedText: "You have a lot of ideas. Most incomplete. That tracks.",
    lockedText: "Create 20 repositories.",
  }),
  createAchievement({
    id: "star_child",
    icon: "⭐",
    name: "STAR CHILD",
    description: "Earned your first star",
    rarity: "COMMON",
    condition: (data) => data.totalStars >= 1,
    unlockedText: "Someone out there noticed.",
    lockedText: "Earn at least 1 star on any repo.",
  }),
  createAchievement({
    id: "veteran_badge",
    icon: "🎖",
    name: "YEAR ONE",
    description: "GitHub account over 1 year old",
    rarity: "COMMON",
    condition: (data) => data.accountAge >= 1,
    unlockedText: "You survived year one. Most don't come back.",
    lockedText: "Maintain your GitHub for 1 year.",
  }),
  createAchievement({
    id: "bio_written",
    icon: "✍",
    name: "IDENTITY ESTABLISHED",
    description: "Filled in your GitHub bio",
    rarity: "COMMON",
    condition: (data) => Boolean(data.bio),
    unlockedText: "You exist. Officially.",
    lockedText: "Add a bio to your GitHub profile.",
  }),
  createAchievement({
    id: "century_stars",
    icon: "💫",
    name: "CENTURY MARK",
    description: "Earned 100 total stars",
    rarity: "UNCOMMON",
    condition: (data) => data.totalStars >= 100,
    unlockedText: "Triple digits. The algorithm has spoken.",
    lockedText: "Earn 100 stars across all repos.",
  }),
  createAchievement({
    id: "open_source_soul",
    icon: "🔓",
    name: "OPEN SOURCE SOUL",
    description: "Has 10+ public repos with descriptions",
    rarity: "UNCOMMON",
    condition: (data) => data.repos.filter((repo) => repo.description).length >= 10,
    unlockedText: "You document for strangers. Rare energy.",
    lockedText: "Add descriptions to 10+ repos.",
  }),
  createAchievement({
    id: "weekend_warrior",
    icon: "⚔",
    name: "WEEKEND WARRIOR",
    description: "Commits on weekends consistently",
    rarity: "UNCOMMON",
    condition: (data) => data.weekendRatio > 0.25,
    unlockedText: "The hustle doesn't take days off.",
    lockedText: "Make 25% of commits on weekends.",
  }),
  createAchievement({
    id: "language_master",
    icon: "🏆",
    name: "LANGUAGE DOMINANT",
    description: "80%+ of repos in one language",
    rarity: "UNCOMMON",
    condition: (data) => data.topLangs[0]?.pct >= 80,
    unlockedText: "Specialist. Committed. Possibly stubborn.",
    lockedText: "Have one language exceed 80% of your repos.",
  }),
  createAchievement({
    id: "networked",
    icon: "🕸",
    name: "NETWORKED",
    description: "Following 100+ developers",
    rarity: "UNCOMMON",
    condition: (data) => data.following >= 100,
    unlockedText: "You watch everyone. They don't all watch back.",
    lockedText: "Follow 100+ developers.",
  }),
  createAchievement({
    id: "consistent",
    icon: "📅",
    name: "CONSISTENT",
    description: "Active on GitHub for 3+ consecutive months",
    rarity: "UNCOMMON",
    condition: (data) => data.accountAge >= 0.25,
    unlockedText: "Consistency is rarer than talent.",
    lockedText: "Stay active for 3+ months.",
  }),
  createAchievement({
    id: "commit_quality",
    icon: "📝",
    name: "CLEAN COMMIT",
    description: "Commit message quality score above 70%",
    rarity: "UNCOMMON",
    condition: (data) => data.commitQualityScore >= 70,
    unlockedText: "Your git log is readable by humans. Exceptional.",
    lockedText: "Achieve 70%+ commit message quality.",
  }),
  createAchievement({
    id: "portfolio_complete",
    icon: "💼",
    name: "PROFILE COMPLETE",
    description: "Has bio, location, website and photo",
    rarity: "UNCOMMON",
    condition: (data) => Boolean(data.bio && data.location && data.blog),
    unlockedText: "You take this seriously. It shows.",
    lockedText: "Fill in bio, location, and website.",
  }),
  createAchievement({
    id: "fork_life",
    icon: "🍴",
    name: "FORK LIFE",
    description: "Forked 10+ repositories",
    rarity: "UNCOMMON",
    condition: (data) => data.repos.filter((repo) => repo.fork).length >= 10,
    unlockedText: "You learn by taking apart other people's work. Smart.",
    lockedText: "Fork 10+ repositories.",
  }),
  createAchievement({
    id: "five_years",
    icon: "🗓",
    name: "HALF DECADE",
    description: "GitHub account over 5 years old",
    rarity: "UNCOMMON",
    condition: (data) => data.accountAge >= 5,
    unlockedText: "Five years of commits. The discipline is real.",
    lockedText: "Maintain your GitHub for 5 years.",
  }),
  createAchievement({
    id: "thousand_stars",
    icon: "🌟",
    name: "STAR FORGE",
    description: "Earned 1000+ total stars",
    rarity: "RARE",
    condition: (data) => data.totalStars >= 1000,
    unlockedText: "Top 5% of GitHub developers.",
    lockedText: "Earn 1000 stars across all repos.",
  }),
  createAchievement({
    id: "hundred_followers",
    icon: "👥",
    name: "SIGNAL AMPLIFIED",
    description: "100+ followers",
    rarity: "RARE",
    condition: (data) => data.followers >= 100,
    unlockedText: "You have an audience. Use it.",
    lockedText: "Reach 100 followers.",
  }),
  createAchievement({
    id: "midnight_architect",
    icon: "🏗",
    name: "MIDNIGHT ARCHITECT",
    description: "50%+ of commits between 10pm and 4am",
    rarity: "RARE",
    condition: (data) => {
      const nightHours = data.commitHourDist
        .slice(22, 24)
        .concat(data.commitHourDist.slice(0, 4))
        .reduce((sum, count) => sum + count, 0);
      const total = data.commitHourDist.reduce((sum, count) => sum + count, 0) || 1;
      return (nightHours / total) >= 0.5;
    },
    unlockedText: "You don't work at night. You live there.",
    lockedText: "Make 50%+ of commits between 10pm and 4am.",
  }),
  createAchievement({
    id: "polyglot_master",
    icon: "🌐",
    name: "TOWER OF BABEL",
    description: "Used 7+ different languages",
    rarity: "RARE",
    condition: (data) => data.topLangs.length >= 7,
    unlockedText: "You have no allegiances. Only tools.",
    lockedText: "Use 7 or more programming languages.",
  }),
  createAchievement({
    id: "repo_empire",
    icon: "🏛",
    name: "REPO EMPIRE",
    description: "50+ public repositories",
    rarity: "RARE",
    condition: (data) => data.totalRepos >= 50,
    unlockedText: "An empire of code. How many are finished?",
    lockedText: "Create 50+ public repositories.",
  }),
  createAchievement({
    id: "ancient",
    icon: "⏳",
    name: "THE ANCIENT",
    description: "Account created before 2015",
    rarity: "RARE",
    condition: (data) => new Date(data.createdAt).getFullYear() <= 2015,
    unlockedText: "You were here before the gold rush.",
    lockedText: "Have a GitHub account created before 2015.",
  }),
  createAchievement({
    id: "tenk_stars",
    icon: "💎",
    name: "DIAMOND HANDS",
    description: "Single repo with 1000+ stars",
    rarity: "RARE",
    condition: (data) => data.repos.some((repo) => repo.stargazers_count >= 1000),
    unlockedText: "One repo. Thousands of developers said yes.",
    lockedText: "Get a single repo to 1000 stars.",
  }),
  createAchievement({
    id: "commit_machine",
    icon: "⚡",
    name: "COMMIT MACHINE",
    description: "500+ total contributions in a single year",
    rarity: "RARE",
    condition: (data) => data.totalContributions >= 500,
    unlockedText: "This isn't a hobby. This is a way of life.",
    lockedText: "Make 500+ contributions in a year.",
  }),
  createAchievement({
    id: "rust_belt",
    icon: "🦀",
    name: "RUST BELT",
    description: "Primary language is Rust",
    rarity: "RARE",
    condition: (data) => data.topLangs[0]?.lang === "Rust",
    unlockedText: "You chose the hard path. Respect.",
    lockedText: "Make Rust your primary language.",
  }),
  createAchievement({
    id: "go_getter",
    icon: "🏃",
    name: "GO GETTER",
    description: "Primary language is Go",
    rarity: "RARE",
    condition: (data) => data.topLangs[0]?.lang === "Go",
    unlockedText: "You build for scale before you need it.",
    lockedText: "Make Go your primary language.",
  }),
  createAchievement({
    id: "ten_thousand_stars",
    icon: "🌠",
    name: "SUPERNOVA",
    description: "Earned 10,000+ total stars",
    rarity: "EPIC",
    condition: (data) => data.totalStars >= 10000,
    unlockedText: "You are in the top 0.1% of GitHub. Undeniable.",
    lockedText: "Earn 10,000 total stars.",
  }),
  createAchievement({
    id: "thousand_followers",
    icon: "📻",
    name: "BROADCAST TOWER",
    description: "1000+ followers",
    rarity: "EPIC",
    condition: (data) => data.followers >= 1000,
    unlockedText: "Four digits. Your commit log has fans.",
    lockedText: "Reach 1,000 followers.",
  }),
  createAchievement({
    id: "decade",
    icon: "🔟",
    name: "THE DECADE MARK",
    description: "Account over 10 years old",
    rarity: "EPIC",
    condition: (data) => data.accountAge >= 10,
    unlockedText: "A decade of pushing code. GitHub owes you a pension.",
    lockedText: "Maintain your GitHub for 10 years.",
  }),
  createAchievement({
    id: "perfect_commits",
    icon: "✨",
    name: "THE SCRIBE",
    description: "Commit quality score 90%+",
    rarity: "EPIC",
    condition: (data) => data.commitQualityScore >= 90,
    unlockedText: "Conventional commits. Every time. Inhuman discipline.",
    lockedText: "Achieve 90%+ commit message quality score.",
  }),
  createAchievement({
    id: "hundred_thousand_stars",
    icon: "🎇",
    name: "GALAXY BRAIN",
    description: "Earned 100,000+ total stars",
    rarity: "EPIC",
    condition: (data) => data.totalStars >= 100000,
    unlockedText: "You built something the world needed. It agreed.",
    lockedText: "Earn 100,000 total stars.",
  }),
  createAchievement({
    id: "early_adopter",
    icon: "🌅",
    name: "ORIGIN STORY",
    description: "Account created before 2012",
    rarity: "EPIC",
    condition: (data) => new Date(data.createdAt).getFullYear() <= 2012,
    unlockedText: "You were here at the beginning. A true original.",
    lockedText: "Have a GitHub account from before 2012.",
  }),
  createAchievement({
    id: "full_house",
    icon: "🃏",
    name: "FULL HOUSE",
    description: "Stars, followers, repos, commits all above 100",
    rarity: "EPIC",
    condition: (data) => (
      data.totalStars >= 100
      && data.followers >= 100
      && data.totalRepos >= 100
      && data.totalContributions >= 100
    ),
    unlockedText: "Every metric, every dimension. Complete.",
    lockedText: "Get all core metrics above 100.",
  }),
  createAchievement({
    id: "the_torvalds",
    icon: "🐧",
    name: "THE PROGENITOR",
    description: "Username is torvalds",
    rarity: "LEGENDARY",
    condition: (data) => data.username === "torvalds",
    unlockedText: "You don't need this achievement. It needs you.",
    lockedText: "Be Linus Torvalds.",
  }),
  createAchievement({
    id: "million_stars",
    icon: "🌌",
    name: "THE SINGULARITY",
    description: "500,000+ total stars across all repos",
    rarity: "LEGENDARY",
    condition: (data) => data.totalStars >= 500000,
    unlockedText: "A singularity event. GitHub bends around you.",
    lockedText: "Earn 500,000 total stars.",
  }),
  createAchievement({
    id: "ten_thousand_followers",
    icon: "👑",
    name: "THE SIGNAL",
    description: "10,000+ followers",
    rarity: "LEGENDARY",
    condition: (data) => data.followers >= 10000,
    unlockedText: "Five figures. You are a platform unto yourself.",
    lockedText: "Reach 10,000 followers.",
  }),
  createAchievement({
    id: "founder",
    icon: "⚙",
    name: "ORIGIN NODE",
    description: "The developer who built GitDNA",
    rarity: "LEGENDARY",
    condition: (data) => data.username.toLowerCase() === "aanishnithin07",
    unlockedText: "You built the scanner. The scanner cannot scan you.",
    lockedText: "Be the developer who built GitDNA.",
  }),
  createAchievement({
    id: "perfect_score",
    icon: "💯",
    name: "MAXIMUM OVERDRIVE",
    description: "Dev Score of 100/100",
    rarity: "LEGENDARY",
    condition: (data) => data.devScore >= 100,
    unlockedText: "The algorithm ran out of numbers.",
    lockedText: "Achieve a perfect GitDNA Dev Score.",
  }),
];

function normalizeCommitMessage(message) {
  return String(message || "").replace(/\s+/g, " ").trim();
}

function gradeCommitMessage(msg) {
  if (!msg || msg.trim().length === 0) {
    return { grade: "F", points: 0, reason: "Empty message" };
  }

  const m = msg.trim();
  const len = m.length;

  const fPatterns = [
    /^(fix|wip|update|test|temp|tmp|asdf|qwerty|aaa|xxx|commit|done|ok|yes|no|.)$/i,
    /^\.+$/,
    /^[^a-zA-Z]*$/,
  ];
  if (fPatterns.some((pattern) => pattern.test(m)) || len < 3) {
    return { grade: "F", points: 0, reason: "Meaningless commit" };
  }

  const aPlus = /^(feat|fix|docs|style|refactor|perf|test|chore|build|ci|revert)(\([a-z0-9-]+\))?: .{10,}/i;
  if (aPlus.test(m) && len >= 20) {
    return { grade: "A+", points: 10, reason: "Conventional commit with scope" };
  }

  const aGrade = /^(feat|fix|docs|style|refactor|perf|test|chore|build|ci|revert): .{8,}/i;
  if (aGrade.test(m)) {
    return { grade: "A", points: 8, reason: "Conventional commit format" };
  }

  const hasVerb = /\b(add|remove|update|create|delete|fix|improve|refactor|implement|change|rename|move|merge|resolve|handle|replace|optimize|clean|simplify|extract|modify)\b/i.test(m);
  if (len >= 30 && hasVerb) {
    return { grade: "B", points: 6, reason: "Descriptive with action verb" };
  }
  if (len >= 40) {
    return { grade: "B", points: 6, reason: "Detailed description" };
  }

  if (len >= 15 && hasVerb) {
    return { grade: "C", points: 4, reason: "Has verb and some context" };
  }
  if (len >= 20) {
    return { grade: "C", points: 4, reason: "Moderately descriptive" };
  }

  if (len >= 8) {
    return { grade: "D", points: 2, reason: "Too brief" };
  }

  return { grade: "F", points: 0, reason: "Too short to be meaningful" };
}

function calcOverallQuality(gradedMessages) {
  if (!Array.isArray(gradedMessages) || gradedMessages.length === 0) return 0;
  const totalPoints = gradedMessages.reduce((sum, row) => sum + Number(row?.points || 0), 0);
  const maxPossible = gradedMessages.length * 10;
  return Math.round((totalPoints / maxPossible) * 100);
}

function getCommitQualityTier(scorePercent) {
  const score = Number(scorePercent || 0);
  if (score >= 90) return { label: "CONVENTIONAL COMMITS MASTER", color: "#ffd770" };
  if (score >= 70) return { label: "COMMUNICATIVE DEVELOPER", color: "#8deeff" };
  if (score >= 50) return { label: "ROOM FOR CLARITY", color: "#ffc978" };
  return { label: "YOUR FUTURE SELF WILL NOT THANK YOU", color: "#ff9d9d" };
}

function fallbackCommitLinguisticsInsight(username, messages) {
  const safeMessages = Array.isArray(messages)
    ? messages.map((msg) => normalizeCommitMessage(msg)).filter(Boolean).slice(0, 20)
    : [];

  if (safeMessages.length === 0) {
    return "No recent commit messages were visible, so your writing style signal is still loading.";
  }

  const graded = safeMessages.map((message) => gradeCommitMessage(message));
  const highSignal = graded.filter((entry) => entry.grade === "A+" || entry.grade === "A").length;
  const weakSignal = graded.filter((entry) => entry.grade === "F" || entry.grade === "D").length;
  const avgLength = Math.round(
    safeMessages.reduce((sum, message) => sum + message.length, 0) / Math.max(1, safeMessages.length),
  );

  if (highSignal >= Math.ceil(safeMessages.length * 0.45)) {
    return `@${username} writes intent-first commit logs with clear verbs and scope, which signals deliberate shipping under pressure and easier team handoffs. Average message length is ${avgLength} characters, so the narrative is concise without collapsing into noise.`;
  }

  if (weakSignal >= Math.ceil(safeMessages.length * 0.35)) {
    return `@${username} commits fast but often drops context, which suggests execution urgency is outrunning documentation discipline. The logs show fragments more than decisions, so future-you will spend extra time reconstructing intent from code diffs.`;
  }

  return `@${username} shows mixed commit language: enough actionable messages to keep momentum, but occasional vague lines that reduce traceability. The style reads like a builder balancing speed with clarity, and that balance improves quickly when each commit states action plus affected scope.`;
}

function buildNewspaperFallback(profilePayload = {}, usernameHint = "developer") {
  const safeProfile = profilePayload && typeof profilePayload === "object" ? profilePayload : {};
  const github = safeProfile.github && typeof safeProfile.github === "object" ? safeProfile.github : {};
  const user = github.user && typeof github.user === "object" ? github.user : {};

  const username = String(safeProfile.username || user.login || usernameHint || "developer");
  const topLanguageEntry = Array.isArray(github.top_languages) ? github.top_languages[0] : null;
  const topLanguage = String(topLanguageEntry?.language || topLanguageEntry?.lang || "Unknown");
  const topLanguagePct = Number(topLanguageEntry?.percentage ?? topLanguageEntry?.pct ?? 0);
  const stars = Number(github.total_stars || 0);
  const repos = Number(user.public_repos || 0);
  const followers = Number(user.followers || 0);
  const commits30d = Number(github.recent_commits_30d || github.recent_commits_last_30_days || 0);
  const devScore = Number(safeProfile.devScore || 0);
  const createdAtMs = new Date(user.created_at || "").getTime();
  const accountAgeYears = Number.isFinite(createdAtMs)
    ? Math.max(0, (Date.now() - createdAtMs) / (1000 * 60 * 60 * 24 * 365.25))
    : 0;
  const aiData = safeProfile.aiData && typeof safeProfile.aiData === "object"
    ? safeProfile.aiData
    : (safeProfile.ai && typeof safeProfile.ai === "object" ? safeProfile.ai : {});
  const workStyle = String(aiData?.chronotype?.workStyle || "Adaptive Rhythm Coder");
  const devClass = String(aiData?.devClass || "Steady Commit Craftsman");
  const achievements = safeProfile.achievements && typeof safeProfile.achievements === "object"
    ? safeProfile.achievements
    : {};
  const unlockedCount = Number(achievements.unlockedCount || 0);
  const totalCount = Number(achievements.totalCount || 0);
  const repoList = Array.isArray(github.repos) ? [...github.repos] : [];
  const topRepo = repoList.sort((left, right) => {
    const leftStars = Number(left?.stargazers_count || left?.stars || 0);
    const rightStars = Number(right?.stargazers_count || right?.stars || 0);
    if (leftStars !== rightStars) return rightStars - leftStars;

    const leftForks = Number(left?.forks_count || left?.forks || 0);
    const rightForks = Number(right?.forks_count || right?.forks || 0);
    return rightForks - leftForks;
  })[0] || null;
  const topRepoName = String(topRepo?.name || "No standout repo yet");
  const topRepoStars = Number(topRepo?.stargazers_count || topRepo?.stars || 0);

  return {
    masthead: "GITHUB NEWSPAPER",
    editionLabel: `${username.toUpperCase()} EDITION`,
    dateLine: new Date().toLocaleDateString(undefined, { month: "long", day: "2-digit", year: "numeric" }),
    ticker: `LIVE METRICS | ${stars.toLocaleString()} stars | ${commits30d.toLocaleString()} commits in 30d | ${repos.toLocaleString()} repositories | ${followers.toLocaleString()} followers`,
    headline: `@${username} ships at pace with ${commits30d.toLocaleString()} commits and ${stars.toLocaleString()} stars`,
    subheadline: `${workStyle} rhythm plus ${repos.toLocaleString()} repositories keeps this profile in active delivery mode.`,
    leadStory: `${username} now maps to the ${devClass} archetype, carrying ${stars.toLocaleString()} stars and ${followers.toLocaleString()} followers across ${repos.toLocaleString()} public repositories. Recent velocity sits at ${commits30d.toLocaleString()} commits in the last 30 days, signaling steady execution pressure rather than isolated bursts.`,
    secondaryTitle: "Repository Watch",
    secondaryStory: `Language gravity currently points to ${topLanguage}${topLanguagePct > 0 ? ` (${topLanguagePct.toFixed(2)}%)` : ""}, while the profile's output trend suggests sustained maintenance over one-off spikes.`,
    editorialTitle: "Editorial: Build With Memory",
    editorial: `A ${devScore}/100 development score shows strong output, but long-horizon impact still depends on maintainable communication discipline. Speed is visible; readability is the multiplier that compounds over years of active shipping.`,
    sidebarTitle: "Data Desk",
    sidebarBullets: [
      `Dev Score: ${devScore}`,
      `Followers: ${followers.toLocaleString()}`,
      `Top Language: ${topLanguage}${topLanguagePct > 0 ? ` (${topLanguagePct.toFixed(2)}%)` : ""}`,
      `Achievement Vault: ${unlockedCount}/${totalCount}`,
      `Account Age: ${accountAgeYears.toFixed(2)} years`,
    ],
    hotWire: [
      `Velocity Desk: ${commits30d.toLocaleString()} commits landed in the last 30 days.`,
      `Language Heat: ${topLanguage}${topLanguagePct > 0 ? ` controls ${topLanguagePct.toFixed(2)}% of visible language share.` : " remains the current stack anchor."}`,
      `Community Pulse: ${followers.toLocaleString()} followers currently track @${username}.`,
      `Repository Tracker: ${repos.toLocaleString()} public repositories are live in this profile.`,
    ],
    marketWatch: [
      `Top repository by stars: ${topRepoName}${topRepoStars > 0 ? ` (${topRepoStars.toLocaleString()} stars)` : ""}.`,
      `Achievement unlock rate: ${unlockedCount}/${totalCount} cards opened in the vault.`,
      `Signal blend: ${stars.toLocaleString()} stars, ${followers.toLocaleString()} followers, ${commits30d.toLocaleString()} commits in 30 days.`,
    ],
    timeline: [
      `Account tenure now stands at ${accountAgeYears.toFixed(2)} years.`,
      `${commits30d.toLocaleString()} commits in 30 days indicate sustained shipping momentum.`,
      `${repos.toLocaleString()} repositories and ${stars.toLocaleString()} total stars define the current footprint.`,
    ],
    opinionDeck: [
      `At ${devScore}/100, this profile shows strong output pressure with room to compound through clearer commit storytelling.`,
      `Execution speed is visible; long-term leverage comes from documentation discipline and maintainable handoffs.`,
    ],
    pullQuote: `${commits30d.toLocaleString()} commits in 30 days means roadmap gravity is moving toward this developer's execution lane.`,
    footerNote: "Printed by GitDNA Press | Built from public GitHub telemetry",
  };
}

function normalizeNewspaperPayload(rawPayload, fallbackPayload) {
  const fallback = fallbackPayload && typeof fallbackPayload === "object"
    ? fallbackPayload
    : buildNewspaperFallback({}, "developer");
  const source = rawPayload && typeof rawPayload === "object" ? rawPayload : {};

  const normalized = {
    ...fallback,
    sidebarBullets: Array.isArray(fallback.sidebarBullets) ? [...fallback.sidebarBullets] : [],
    hotWire: Array.isArray(fallback.hotWire) ? [...fallback.hotWire] : [],
    marketWatch: Array.isArray(fallback.marketWatch) ? [...fallback.marketWatch] : [],
    timeline: Array.isArray(fallback.timeline) ? [...fallback.timeline] : [],
    opinionDeck: Array.isArray(fallback.opinionDeck) ? [...fallback.opinionDeck] : [],
  };

  const textKeys = [
    "masthead",
    "editionLabel",
    "dateLine",
    "ticker",
    "headline",
    "subheadline",
    "leadStory",
    "secondaryTitle",
    "secondaryStory",
    "editorialTitle",
    "editorial",
    "sidebarTitle",
    "pullQuote",
    "footerNote",
  ];

  for (const key of textKeys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) {
      normalized[key] = value.trim();
    }
  }

  if (Array.isArray(source.sidebarBullets)) {
    const cleanBullets = source.sidebarBullets
      .map((item) => String(item || "").trim())
      .filter(Boolean)
      .slice(0, 6);

    if (cleanBullets.length >= 3) {
      normalized.sidebarBullets = cleanBullets;
    }
  }

  const listKeys = ["hotWire", "marketWatch", "timeline", "opinionDeck"];
  for (const key of listKeys) {
    if (!Array.isArray(source[key])) continue;
    const cleanLines = source[key]
      .map((item) => String(item || "").replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .slice(0, 8);
    if (cleanLines.length >= 2) {
      normalized[key] = cleanLines;
    }
  }

  return normalized;
}

function sanitizeNewspaperLines(lines, minItems = 0, maxItems = 8) {
  const cleaned = Array.isArray(lines)
    ? lines
      .map((line) => String(line || "").replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .slice(0, maxItems)
    : [];

  if (cleaned.length < minItems) return [];
  return cleaned;
}

function formatNewspaperDateLabel(value, withYear = false) {
  const date = new Date(value || "");
  if (!Number.isFinite(date.getTime())) {
    return "Unknown date";
  }

  return date.toLocaleDateString(undefined, withYear
    ? { month: "short", day: "2-digit", year: "numeric" }
    : { month: "short", day: "2-digit" });
}

function buildNewspaperPages(editionPayload, profilePayload = {}) {
  const safeProfile = profilePayload && typeof profilePayload === "object" ? profilePayload : {};
  const github = safeProfile.github && typeof safeProfile.github === "object" ? safeProfile.github : {};
  const user = github.user && typeof github.user === "object" ? github.user : {};
  const username = String(safeProfile.username || user.login || "developer");
  const repos = Array.isArray(github.repos) ? github.repos : [];
  const events = Array.isArray(github.events) ? github.events : [];
  const contributions = Array.isArray(github.contributions) ? github.contributions : [];
  const achievements = safeProfile.achievements && typeof safeProfile.achievements === "object"
    ? safeProfile.achievements
    : {};
  const unlockedCount = Number(achievements.unlockedCount || 0);
  const totalCount = Number(achievements.totalCount || 0);
  const devScore = Number(safeProfile.devScore || 0);
  const totalStars = Number(github.totalStars || github.total_stars || 0);
  const followerCount = Number(user.followers || 0);
  const publicRepos = Number(user.public_repos || repos.length || 0);
  const commits30d = Number(github.recentCommits || github.recent_commits_30d || github.recent_commits_last_30_days || 0);

  const langsFromProfile = Array.isArray(safeProfile.langs) ? safeProfile.langs : [];
  const langsFromGithub = Array.isArray(github.top_languages)
    ? github.top_languages.map((item) => ({
        lang: String(item?.language || item?.lang || "Unknown"),
        pct: Number(item?.percentage ?? item?.pct ?? 0),
      }))
    : [];
  const langs = (langsFromProfile.length > 0 ? langsFromProfile : langsFromGithub)
    .map((item) => ({
      lang: String(item?.lang || item?.language || "Unknown"),
      pct: Number(item?.pct ?? item?.percentage ?? 0),
    }))
    .filter((item) => item.lang)
    .slice(0, 6);

  const topRepos = [...repos]
    .sort((left, right) => {
      const leftStars = Number(left?.stargazers_count || left?.stars || 0);
      const rightStars = Number(right?.stargazers_count || right?.stars || 0);
      if (leftStars !== rightStars) return rightStars - leftStars;

      const leftForks = Number(left?.forks_count || left?.forks || 0);
      const rightForks = Number(right?.forks_count || right?.forks || 0);
      if (leftForks !== rightForks) return rightForks - leftForks;

      const leftPushed = new Date(left?.pushed_at || left?.updated_at || 0).getTime();
      const rightPushed = new Date(right?.pushed_at || right?.updated_at || 0).getTime();
      return rightPushed - leftPushed;
    })
    .slice(0, 5)
    .map((repo, index) => ({
      id: String(repo?.id || `${repo?.name || "repo"}-${index}`),
      name: String(repo?.name || `repo-${index + 1}`),
      stars: Number(repo?.stargazers_count || repo?.stars || 0),
      forks: Number(repo?.forks_count || repo?.forks || 0),
      updated: formatNewspaperDateLabel(repo?.pushed_at || repo?.updated_at, true),
    }));

  const now = Date.now();
  const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayStartMs = todayStart.getTime();
  const todayLabel = getReadableLocalDate(todayStartMs);

  let pushEvents14d = 0;
  let commits14d = 0;
  let pullRequestEvents14d = 0;
  let issueEvents14d = 0;
  let pushEventsToday = 0;
  let commitsToday = 0;
  let pullRequestEventsToday = 0;
  let issueEventsToday = 0;

  for (const event of events) {
    const createdAt = new Date(event?.created_at || "").getTime();
    if (!Number.isFinite(createdAt)) continue;

    const eventType = String(event?.type || "");
    const commitCount = Array.isArray(event?.payload?.commits) ? event.payload.commits.length : 0;

    if (createdAt >= todayStartMs) {
      if (eventType === "PushEvent") {
        pushEventsToday += 1;
        commitsToday += Math.max(1, commitCount);
      }
      if (eventType === "PullRequestEvent") pullRequestEventsToday += 1;
      if (eventType === "IssuesEvent") issueEventsToday += 1;
    }

    if (now - createdAt > fourteenDaysMs) continue;

    if (eventType === "PushEvent") {
      pushEvents14d += 1;
      commits14d += Math.max(1, commitCount);
    }
    if (eventType === "PullRequestEvent") pullRequestEvents14d += 1;
    if (eventType === "IssuesEvent") issueEvents14d += 1;
  }

  const activeRepos30d = repos.filter((repo) => {
    const pushedAt = new Date(repo?.pushed_at || repo?.updated_at || "").getTime();
    return Number.isFinite(pushedAt) && now - pushedAt <= thirtyDaysMs;
  }).length;

  const updatedReposToday = repos.filter((repo) => {
    const pushedAt = new Date(repo?.pushed_at || repo?.updated_at || "").getTime();
    return Number.isFinite(pushedAt) && pushedAt >= todayStartMs;
  }).length;

  const currentStreak = getCurrentContributionStreak(contributions);
  const commitDrop = detectCommitSpikeDrop(events);

  const rawEdition = editionPayload && typeof editionPayload === "object"
    ? editionPayload
    : buildNewspaperFallback(safeProfile, username);

  const hotWire = sanitizeNewspaperLines(rawEdition.hotWire, 0, 8);
  const marketWatch = sanitizeNewspaperLines(rawEdition.marketWatch, 0, 8);
  const timeline = sanitizeNewspaperLines(rawEdition.timeline, 0, 8);
  const opinionDeck = sanitizeNewspaperLines(rawEdition.opinionDeck, 0, 8);

  const timelineSource = [];
  if (user.created_at) {
    timelineSource.push(`Account opened on ${formatNewspaperDateLabel(user.created_at, true)}.`);
  }

  const firstActiveDay = contributions.find((entry) => Number(entry?.count || 0) > 0)?.date;
  const lastActiveDay = [...contributions].reverse().find((entry) => Number(entry?.count || 0) > 0)?.date;
  if (firstActiveDay) {
    timelineSource.push(`Earliest visible contribution in the current archive: ${formatNewspaperDateLabel(firstActiveDay, true)}.`);
  }
  if (lastActiveDay) {
    timelineSource.push(`Latest visible contribution marker: ${formatNewspaperDateLabel(lastActiveDay, true)}.`);
  }
  if (topRepos[0]) {
    timelineSource.push(`Top repository today is ${topRepos[0].name} with ${topRepos[0].stars.toLocaleString()} stars.`);
  }
  if (commits30d > 0) {
    timelineSource.push(`The last 30 days produced ${commits30d.toLocaleString()} commits.`);
  }

  const accountAgeYears = (() => {
    const createdAt = new Date(user.created_at || "").getTime();
    if (!Number.isFinite(createdAt)) return 0;
    return Math.max(0, (Date.now() - createdAt) / (1000 * 60 * 60 * 24 * 365.25));
  })();

  const dailyHotLines = [
    `Today (${todayLabel}) desk: ${pushEventsToday.toLocaleString()} push events, ${pullRequestEventsToday.toLocaleString()} PR events, and ${issueEventsToday.toLocaleString()} issue events are visible so far.`,
    `Today code pulse: ${commitsToday.toLocaleString()} commit actions and ${updatedReposToday.toLocaleString()} repositories updated since local midnight.`,
  ];

  const fallbackHotLines = [
    `Breaking Desk: ${commits14d.toLocaleString()} commits detected across ${pushEvents14d.toLocaleString()} push events in the last 14 days.`,
    `Live Repo Pulse: ${activeRepos30d.toLocaleString()} repositories received updates in the last 30 days.`,
    `Collab Counter: ${pullRequestEvents14d.toLocaleString()} pull request events and ${issueEvents14d.toLocaleString()} issue events landed over two weeks.`,
    commitDrop.detected
      ? `Volatility Alert: monthly push output shows a ${commitDrop.dropPct}% post-spike drop.`
      : "Volatility Alert: no severe post-spike collapse detected in recent monthly commit flow.",
  ];

  const effectiveHotWire = [...dailyHotLines, ...(hotWire.length > 0 ? hotWire : fallbackHotLines)]
    .filter(Boolean)
    .slice(0, 8);

  const effectiveMarketWatch = marketWatch.length > 0
    ? marketWatch
    : [
      topRepos[0]
        ? `Top repo board: ${topRepos[0].name} leads with ${topRepos[0].stars.toLocaleString()} stars and ${topRepos[0].forks.toLocaleString()} forks.`
        : "Top repo board: no public repositories are available for ranking yet.",
      langs[0]
        ? `Language market leader: ${langs[0].lang} at ${langs[0].pct.toFixed(1)}% share.`
        : "Language market leader: stack distribution is still warming up.",
      `Achievement vault status: ${unlockedCount.toLocaleString()}/${totalCount.toLocaleString()} unlocked.`,
      `Audience density: ${followerCount.toLocaleString()} followers tracking ${publicRepos.toLocaleString()} public repos.`,
    ];

  const effectiveTimeline = timeline.length > 0
    ? timeline
    : timelineSource.slice(0, 6);

  const effectiveOpinionDeck = opinionDeck.length > 0
    ? opinionDeck
    : [
      rawEdition.editorial,
      `At ${devScore}/100 dev score, this profile combines execution pressure with long-cycle maintainability potential.`,
      `The output surface currently spans ${publicRepos.toLocaleString()} repositories, ${totalStars.toLocaleString()} stars, and ${followerCount.toLocaleString()} followers.`,
      `Sustained momentum over ${accountAgeYears.toFixed(2)} years suggests a builder with repeatable operating rhythm.`,
    ];

  return [
    {
      id: "front-page",
      kind: "front",
      label: "Front Page",
      kicker: "Main Edition",
      title: rawEdition.headline,
    },
    {
      id: "hot-wire",
      kind: "hot",
      label: "Hot Wire",
      kicker: "Live Desk",
      title: `Hot Recent News on GitHub • ${todayLabel}`,
      lead: `Real-time desk for @${username}: active stream of pushes, pull requests, issues, and shipping bursts from visible public telemetry.`,
      cards: effectiveHotWire,
      sideStats: [
        `Today Pushes: ${pushEventsToday.toLocaleString()}`,
        `Today Commits: ${commitsToday.toLocaleString()}`,
        `Repos Updated Today: ${updatedReposToday.toLocaleString()}`,
        `Push Events (14d): ${pushEvents14d.toLocaleString()}`,
        `Commits (14d): ${commits14d.toLocaleString()}`,
        `Active Repos (30d): ${activeRepos30d.toLocaleString()}`,
        `Current Streak: ${currentStreak.toLocaleString()} days`,
      ].slice(0, 6),
      bulletin: commitDrop.detected
        ? `Post-spike dip detected: ${commitDrop.dropPct}% drop in monthly commit volume after a surge.`
        : "No significant post-spike crash detected. Delivery rhythm currently reads stable.",
    },
    {
      id: "repo-market",
      kind: "market",
      label: "Repo Market",
      kicker: "Data Exchange",
      title: "Repository Market + Language Board",
      repoRows: topRepos,
      languageRows: langs,
      marketWatch: effectiveMarketWatch,
    },
    {
      id: "editorial-board",
      kind: "editorial",
      label: "Editorial",
      kicker: "Opinion + Timeline",
      title: "Editorial Board & Timeline",
      opinionDeck: effectiveOpinionDeck,
      timeline: effectiveTimeline,
      quote: rawEdition.pullQuote,
    },
  ];
}

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

const TRAIT_KEYS = ["creativity", "discipline", "collaboration", "boldness", "depth", "velocity"];

function calculateBaseTraits(data) {
  const {
    totalStars,
    totalRepos,
    followers,
    following,
    accountAge,
    recentCommits,
    topLangs,
    avgCommitHour,
    weekendRatio,
    commitMessages,
    bio,
    blog,
    repos,
  } = data;

  const safeTopLangs = Array.isArray(topLangs) ? topLangs : [];
  const safeCommitMessages = Array.isArray(commitMessages)
    ? commitMessages.map((message) => normalizeCommitMessage(message)).filter(Boolean)
    : [];
  const safeRepos = Array.isArray(repos) ? repos : [];
  const safeRecentCommits = Math.max(0, Number(recentCommits || 0));
  const safeTotalRepos = Math.max(0, Number(totalRepos || 0));
  const safeTotalStars = Math.max(0, Number(totalStars || 0));
  const safeFollowers = Math.max(0, Number(followers || 0));
  const safeFollowing = Math.max(0, Number(following || 0));
  const safeAccountAge = Math.max(0, Number(accountAge || 0));
  const safeAvgCommitHour = Number.isFinite(Number(avgCommitHour)) ? Number(avgCommitHour) : 12;
  const safeWeekendRatio = Math.max(0, Number(weekendRatio || 0));

  // CREATIVITY (0-100)
  let creativity = 40;
  creativity += Math.min(25, safeTopLangs.length * 5);
  const starPerRepo = safeTotalRepos > 0 ? (safeTotalStars / safeTotalRepos) : 0;
  creativity += Math.min(20, Math.round(starPerRepo * 2));
  if (safeAvgCommitHour >= 20 || safeAvgCommitHour <= 5) creativity += 10;
  if (safeWeekendRatio > 0.2) creativity += 5;
  creativity = clampNumber(Math.round(creativity), 5, 100);

  // DISCIPLINE (0-100)
  let discipline = 40;
  if (safeCommitMessages.length > 0) {
    const conventionalCount = safeCommitMessages.filter((message) => (
      /^(feat|fix|docs|refactor|chore|perf|test|style|build|ci):/i.test(message)
    )).length;
    discipline += Math.min(30, Math.round((conventionalCount / safeCommitMessages.length) * 30));
  }
  discipline += Math.min(20, Math.round(safeAccountAge * 4));
  if (safeRecentCommits > 10) discipline += 10;
  discipline = clampNumber(Math.round(discipline), 5, 100);

  // COLLABORATION (0-100)
  let collaboration = 30;
  collaboration += Math.min(25, Math.round(Math.sqrt(safeFollowers) * 3));
  const followRatio = safeFollowing > 0 ? Math.min(2, safeFollowers / safeFollowing) : 0;
  collaboration += Math.min(15, Math.round(followRatio * 8));
  if (bio && /open.source|contributor|team|collaborat/i.test(String(bio))) {
    collaboration += 15;
  }
  if (blog) collaboration += 5;
  collaboration = clampNumber(Math.round(collaboration), 5, 100);

  // BOLDNESS (0-100)
  let boldness = 35;
  boldness += Math.min(30, Math.round(Math.log10(safeTotalStars + 1) * 15));
  if (safeRecentCommits > 15) boldness += 15;
  if (safeTopLangs[0]?.lang === "Rust" || safeTopLangs[0]?.lang === "C") boldness += 15;
  if (safeTopLangs[0]?.lang === "Assembly") boldness += 20;
  boldness = clampNumber(Math.round(boldness), 5, 100);

  // DEPTH (0-100)
  let depth = 35;
  if (safeTopLangs[0]?.pct >= 60) depth += 20;
  depth += Math.min(20, Math.round(safeAccountAge * 3.5));
  const maxSingleRepoStars = Math.max(
    ...safeRepos.map((repo) => Number(repo?.stargazers_count || 0)),
    0,
  );
  depth += Math.min(20, Math.round(Math.log10(maxSingleRepoStars + 1) * 10));
  if (safeCommitMessages.length > 0) {
    const avgMsgLen = safeCommitMessages.reduce((sum, message) => sum + message.length, 0) / safeCommitMessages.length;
    depth += Math.min(10, Math.round(avgMsgLen / 10));
  }
  depth = clampNumber(Math.round(depth), 5, 100);

  // VELOCITY (0-100)
  let velocity = 30;
  const reposPerYear = safeAccountAge > 0 ? (safeTotalRepos / safeAccountAge) : safeTotalRepos;
  velocity += Math.min(30, Math.round(reposPerYear * 3));
  velocity += Math.min(30, Math.round(safeRecentCommits * 2));
  if (safeWeekendRatio > 0.3) velocity += 10;
  velocity = clampNumber(Math.round(velocity), 5, 100);

  return {
    creativity,
    discipline,
    collaboration,
    boldness,
    depth,
    velocity,
  };
}

async function buildFrontendAnalyzePayload(username) {
  const safeUsername = String(username || "").trim();
  if (!safeUsername) {
    throw new Error("Username is required.");
  }

  const encodedUsername = encodeURIComponent(safeUsername);
  const [userResponse, reposResponse, eventsResponse] = await Promise.all([
    fetchGithubJson(`/users/${encodedUsername}`, { notFoundMessage: "GitHub user not found." }),
    fetchGithubJson(`/users/${encodedUsername}/repos?per_page=100&sort=updated`),
    fetchGithubJson(`/users/${encodedUsername}/events/public?per_page=100`),
  ]);

  const user = userResponse && typeof userResponse === "object" ? userResponse : {};
  const repos = Array.isArray(reposResponse) ? reposResponse : [];
  const events = Array.isArray(eventsResponse) ? eventsResponse : [];

  let commitData = extractCommitData(events);
  const missingCommitMessages = !Array.isArray(commitData?.messages) || commitData.messages.length === 0;

  if (missingCommitMessages) {
    const latestRepo = [...repos]
      .filter((repo) => !repo?.fork && String(repo?.name || "").trim())
      .sort((left, right) => {
        const leftPushed = new Date(left?.pushed_at || left?.updated_at || 0).getTime();
        const rightPushed = new Date(right?.pushed_at || right?.updated_at || 0).getTime();
        return rightPushed - leftPushed;
      })[0];

    const owner = String(user?.login || safeUsername).trim();
    const repoName = String(latestRepo?.name || "").trim();

    if (owner && repoName) {
      try {
        const fallbackCommits = await fetchGithubJson(
          `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repoName)}/commits?per_page=10`,
        );

        const fallbackMessages = Array.isArray(fallbackCommits)
          ? fallbackCommits
              .map((commit) => {
                const message = normalizeCommitMessage(String(commit?.commit?.message || "").split("\n")[0]);
                if (!message) return null;

                return {
                  message,
                  repo: repoName,
                  timestamp: String(commit?.commit?.author?.date || ""),
                  sha: String(commit?.sha || "").slice(0, 7) || "???????",
                };
              })
              .filter(Boolean)
          : [];

        if (fallbackMessages.length > 0) {
          const fallbackHours = fallbackMessages
            .map((entry) => {
              const timestamp = String(entry?.timestamp || "");
              if (!timestamp) return null;
              const hour = new Date(timestamp).getUTCHours();
              return Number.isInteger(hour) && hour >= 0 && hour <= 23 ? hour : null;
            })
            .filter((hour) => hour !== null);

          commitData = {
            messages: fallbackMessages,
            messageTexts: fallbackMessages.map((entry) => entry.message),
            hours: fallbackHours,
            repoActivity: { [repoName]: fallbackMessages.length },
          };
        }
      } catch {
        // Keep empty commit data when fallback lookup fails.
      }
    }
  }

  const commitHours = Array.isArray(commitData?.hours) ? commitData.hours : [];
  const commitHourDist = Array.from({ length: 24 }, () => 0);
  commitHours.forEach((hour) => {
    if (Number.isInteger(hour) && hour >= 0 && hour <= 23) {
      commitHourDist[hour] += 1;
    }
  });

  const pushEvents = events.filter((event) => event?.type === "PushEvent" && event?.created_at);
  const weekendPushes = pushEvents.filter((event) => {
    const dt = new Date(event.created_at);
    if (Number.isNaN(dt.getTime())) return false;
    const day = dt.getUTCDay();
    return day === 0 || day === 6;
  }).length;
  const weekdayPushes = Math.max(0, pushEvents.length - weekendPushes);
  const weekendRatio = pushEvents.length > 0 ? (weekendPushes / pushEvents.length) : 0;

  const avgCommitHour = commitHours.length > 0
    ? (commitHours.reduce((sum, hour) => sum + hour, 0) / commitHours.length)
    : 14;

  const totalStars = repos.reduce((sum, repo) => sum + Number(repo?.stargazers_count || 0), 0);
  const totalRepos = Math.max(Number(user?.public_repos || 0), repos.length);
  const accountAgeYears = user?.created_at
    ? ((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24 * 365))
    : 0;
  const topLangs = extractTopLangs(repos);

  const recentCommitMessages = Array.isArray(commitData?.messageTexts)
    ? commitData.messageTexts.map((message) => normalizeCommitMessage(message)).filter(Boolean)
    : [];
  const recentCommitTimestamps = Array.isArray(commitData?.messages)
    ? commitData.messages
        .map((entry) => String(entry?.timestamp || ""))
        .filter(Boolean)
    : [];

  const now = Date.now();
  const activeRepos30d = repos.filter((repo) => {
    const pushed = new Date(repo?.pushed_at || repo?.updated_at || 0).getTime();
    return Number.isFinite(pushed) && pushed > 0 && (now - pushed) <= (30 * 24 * 60 * 60 * 1000);
  }).length;
  const activeRepos90d = repos.filter((repo) => {
    const pushed = new Date(repo?.pushed_at || repo?.updated_at || 0).getTime();
    return Number.isFinite(pushed) && pushed > 0 && (now - pushed) <= (90 * 24 * 60 * 60 * 1000);
  }).length;
  const staleRepos180d = repos.filter((repo) => {
    const pushed = new Date(repo?.pushed_at || repo?.updated_at || 0).getTime();
    return Number.isFinite(pushed) && pushed > 0 && (now - pushed) > (180 * 24 * 60 * 60 * 1000);
  }).length;
  const archivedRepoCount = repos.filter((repo) => Boolean(repo?.archived)).length;
  const forkRepoCount = repos.filter((repo) => Boolean(repo?.fork)).length;
  const totalRepoSizeKb = repos.reduce((sum, repo) => sum + Number(repo?.size || 0), 0);
  const avgRepoSizeKb = repos.length > 0 ? (totalRepoSizeKb / repos.length) : 0;
  const totalOpenIssues = repos.reduce((sum, repo) => sum + Number(repo?.open_issues_count || 0), 0);
  const languageDiversity = new Set(
    repos
      .map((repo) => String(repo?.language || "").trim())
      .filter(Boolean),
  ).size;

  const topStarredRepo = repos
    .map((repo) => ({
      name: String(repo?.name || "").trim(),
      stars: Number(repo?.stargazers_count || 0),
    }))
    .sort((left, right) => right.stars - left.stars)[0] || { name: "", stars: 0 };

  const largestRepo = repos
    .map((repo) => ({
      name: String(repo?.name || "").trim(),
      size_kb: Number(repo?.size || 0),
    }))
    .sort((left, right) => right.size_kb - left.size_kb)[0] || { name: "", size_kb: 0 };

  const baseTraits = calculateBaseTraits({
    totalStars,
    totalRepos,
    followers: Number(user?.followers || 0),
    following: Number(user?.following || 0),
    accountAge: accountAgeYears,
    recentCommits: recentCommitMessages.length,
    topLangs,
    avgCommitHour,
    weekendRatio,
    commitMessages: recentCommitMessages,
    bio: String(user?.bio || ""),
    blog: String(user?.blog || ""),
    repos,
  });

  return {
    username: String(user?.login || safeUsername),
    user,
    repos,
    events,
    total_stars: totalStars,
    total_repos: totalRepos,
    followers: Number(user?.followers || 0),
    following: Number(user?.following || 0),
    account_age_years: Number(accountAgeYears.toFixed(2)),
    avg_commit_hour: Number(avgCommitHour.toFixed(2)),
    weekend_ratio: Number(weekendRatio.toFixed(3)),
    top_languages: topLangs,
    recent_commit_messages: recentCommitMessages,
    recent_commits_30d: recentCommitMessages.length,
    recent_commit_timestamps: recentCommitTimestamps,
    commit_hour_distribution: commitHourDist,
    weekend_vs_weekday: {
      weekend_commits: weekendPushes,
      weekday_commits: weekdayPushes,
      ratio: weekdayPushes > 0 ? Number((weekendPushes / weekdayPushes).toFixed(3)) : Number(weekendRatio.toFixed(3)),
    },
    language_diversity: languageDiversity,
    active_repos_30d: activeRepos30d,
    active_repos_90d: activeRepos90d,
    stale_repos_180d: staleRepos180d,
    archived_repo_count: archivedRepoCount,
    fork_repo_count: forkRepoCount,
    total_repo_size_kb: totalRepoSizeKb,
    avg_repo_size_kb: Number(avgRepoSizeKb.toFixed(2)),
    total_open_issues: totalOpenIssues,
    top_starred_repo: topStarredRepo,
    largest_repo: largestRepo,
    base_traits: baseTraits,
    bio: String(user?.bio || ""),
    blog: String(user?.blog || ""),
    location: String(user?.location || ""),
    created_at: String(user?.created_at || ""),
  };
}

function constrainAiTraitRefinement(baseTraits, aiTraits, maxDelta = 8) {
  const safeBase = baseTraits && typeof baseTraits === "object" ? baseTraits : {};
  const safeAi = aiTraits && typeof aiTraits === "object" ? aiTraits : {};
  const safeDelta = Math.max(0, Number(maxDelta || 0));

  return TRAIT_KEYS.reduce((result, key) => {
    const baseValue = clampNumber(Math.round(Number(safeBase[key] ?? 50)), 5, 100);
    const aiValueRaw = Number(safeAi[key]);

    if (!Number.isFinite(aiValueRaw)) {
      result[key] = baseValue;
      return result;
    }

    const aiValue = clampNumber(Math.round(aiValueRaw), 0, 100);
    const bounded = clampNumber(aiValue, baseValue - safeDelta, baseValue + safeDelta);
    result[key] = clampNumber(Math.round(bounded), 5, 100);
    return result;
  }, {});
}

function getCurrentContributionStreak(contributions) {
  const safe = Array.isArray(contributions)
    ? contributions.map((entry) => ({
        date: String(entry?.date || ""),
        count: Number(entry?.count || 0),
      })).filter((entry) => entry.date)
    : [];

  if (safe.length === 0) return 0;
  safe.sort((a, b) => a.date.localeCompare(b.date));

  let streak = 0;
  for (let i = safe.length - 1; i >= 0; i -= 1) {
    if (safe[i].count > 0) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
}

function detectCommitSpikeDrop(events) {
  const monthlyBuckets = new Map();
  const safeEvents = Array.isArray(events) ? events : [];

  for (const event of safeEvents) {
    if (event?.type !== "PushEvent") continue;
    const dt = new Date(event?.created_at || "");
    if (Number.isNaN(dt.getTime())) continue;

    const key = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}`;
    const commitCount = Math.max(1, Array.isArray(event?.payload?.commits) ? event.payload.commits.length : 0);
    monthlyBuckets.set(key, (monthlyBuckets.get(key) || 0) + commitCount);
  }

  const counts = [...monthlyBuckets.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map((entry) => entry[1]);

  if (counts.length < 3) {
    return { detected: false, dropPct: 0 };
  }

  let bestDrop = 0;
  for (let i = 1; i < counts.length - 1; i += 1) {
    const prev = counts[i - 1];
    const current = counts[i];
    const next = counts[i + 1];
    if (current < Math.max(8, prev * 1.8)) continue;
    if (next > current * 0.55) continue;
    const drop = Math.round(((current - next) / Math.max(current, 1)) * 100);
    bestDrop = Math.max(bestDrop, drop);
  }

  return {
    detected: bestDrop > 0,
    dropPct: bestDrop,
  };
}

function calculateBurnoutIndex(data) {
  const {
    commitHourDist,
    recentCommits,
    totalRepos,
    commitMessages,
    accountAge,
    weekendRatio,
    topLangs,
    avgCommitHour,
    followers,
    totalStars,
  } = data;

  let score = 50;
  const signals = [];

  const safeHourDist = Array.isArray(commitHourDist) && commitHourDist.length === 24
    ? commitHourDist.map((count) => Number(count || 0))
    : Array(24).fill(0);
  const safeCommitMessages = Array.isArray(commitMessages)
    ? commitMessages.map((message) => normalizeCommitMessage(message)).filter(Boolean)
    : [];
  const safeTopLangs = Array.isArray(topLangs) ? topLangs : [];
  const safeRecentCommits = Math.max(0, Number(recentCommits || 0));
  const safeTotalRepos = Math.max(0, Number(totalRepos || 0));
  const safeAccountAge = Math.max(0, Number(accountAge || 0));
  const safeWeekendRatio = Math.max(0, Math.min(1, Number(weekendRatio || 0)));
  const safeFollowers = Math.max(0, Number(followers || 0));
  const safeTotalStars = Math.max(0, Number(totalStars || 0));
  const safeAvgCommitHour = Number.isFinite(Number(avgCommitHour)) ? Number(avgCommitHour) : 14;

  const totalCommits = safeHourDist.reduce((sum, count) => sum + count, 0) || 1;
  const lateNightCommits = safeHourDist
    .slice(0, 5)
    .concat(safeHourDist.slice(22))
    .reduce((sum, count) => sum + count, 0);
  const lateNightRatio = lateNightCommits / totalCommits;
  if (lateNightRatio > 0.5) {
    score += 18;
    signals.push({ type: "risk", text: `${Math.round(lateNightRatio * 100)}% of commits between 10pm-5am` });
  } else if (lateNightRatio > 0.3) {
    score += 8;
    signals.push({ type: "risk", text: `${Math.round(lateNightRatio * 100)}% late-night commit concentration` });
  }

  const activeHours = safeHourDist.filter((count) => count > 0).length;
  if (activeHours <= 4 && totalCommits > 5) {
    score += 12;
    signals.push({ type: "risk", text: `Commits clustered in ${activeHours} hour windows - tunnel vision pattern` });
  }

  if (safeTotalRepos > 70) {
    score += 12;
    signals.push({ type: "risk", text: `${safeTotalRepos} repositories - extreme context switching detected` });
  } else if (safeTotalRepos > 40) {
    score += 6;
    signals.push({ type: "risk", text: `${safeTotalRepos} repositories - high context switching load` });
  }

  if (safeCommitMessages.length > 0) {
    const chaoticCount = safeCommitMessages.filter((message) => {
      const lowered = message.toLowerCase();
      return /^(fix|wip|hotfix|urgent|asap|temp|hack|quick|dirty|broken|debug)/.test(lowered)
        || message.length < 6;
    }).length;
    const chaoticRatio = chaoticCount / safeCommitMessages.length;
    if (chaoticRatio > 0.4) {
      score += 10;
      signals.push({ type: "risk", text: `${Math.round(chaoticRatio * 100)}% of commits show hurried/stressed pattern` });
    }
  }

  if (safeRecentCommits === 0 && safeAccountAge > 0.5) {
    score += 15;
    signals.push({ type: "risk", text: "No activity in 30 days - possible burnout recovery or hiatus" });
  } else if (safeRecentCommits < 3 && safeAccountAge > 1) {
    score += 7;
    signals.push({ type: "risk", text: "Very low recent activity for account age" });
  }

  if (safeTopLangs[0]?.pct >= 90) {
    score += 5;
    signals.push({ type: "risk", text: `${safeTopLangs[0].pct}% ${safeTopLangs[0].lang} - deep specialization, limited variety` });
  }

  if (safeWeekendRatio > 0.25) {
    score -= 12;
    signals.push({ type: "healthy", text: `${Math.round(safeWeekendRatio * 100)}% weekend commits - personal projects detected` });
  } else if (safeWeekendRatio > 0.15) {
    score -= 6;
    signals.push({ type: "healthy", text: "Moderate weekend activity - healthy balance signal" });
  }

  if (activeHours >= 8) {
    score -= 10;
    signals.push({ type: "healthy", text: `Commits spread across ${activeHours} hours - sustainable work pattern` });
  }

  if (safeRecentCommits > 10 && safeAccountAge > 2) {
    score -= 8;
    signals.push({ type: "healthy", text: "Active after 2+ years - sustainable development pace" });
  }

  const qualityMsg = safeCommitMessages.filter((message) => (
    /^(feat|fix|docs|refactor|chore|perf|test):/i.test(message)
  )).length;
  if (safeCommitMessages.length > 0 && (qualityMsg / safeCommitMessages.length) > 0.3) {
    score -= 8;
    signals.push({ type: "healthy", text: "Structured commit discipline - deliberate working style" });
  }

  if (safeTopLangs.length >= 4) {
    score -= 6;
    signals.push({ type: "healthy", text: `${safeTopLangs.length} languages used - cognitive diversity signal` });
  }

  if (signals.length === 0) {
    signals.push({ type: "healthy", text: "No dominant overload signatures detected in visible public activity" });
  }

  const finalScore = Math.max(5, Math.min(95, Math.round(score)));
  const tier = finalScore >= 75
    ? "CRITICAL"
    : finalScore >= 55
      ? "ELEVATED"
      : finalScore >= 35
        ? "OPTIMAL"
        : "BALANCED";

  const color = finalScore >= 75
    ? "#ff4545"
    : finalScore >= 55
      ? "#ffb300"
      : finalScore >= 35
        ? "#00dcff"
        : "#39ff14";

  const topSignals = signals.slice(0, 4);
  const riskSignals = topSignals.filter((signal) => signal.type === "risk");
  const topRiskSignal = riskSignals[0]?.text || "late-stage overload markers";

  const recommendation = tier === "CRITICAL"
    ? "The pattern suggests unsustainable velocity. Burnout events typically follow this signature. Reduce context switching. Guard sleep windows."
    : tier === "ELEVATED"
      ? `Manageable now but trending toward overload. The ${topRiskSignal} is the clearest warning sign.`
      : tier === "OPTIMAL"
        ? "Healthy signal. Current patterns are sustainable. The data shows a developer working with intention."
        : "Rare equilibrium detected. Whatever your system is, document it. Most developers never find this.";

  return {
    score: finalScore,
    tier,
    color,
    signals: topSignals,
    recommendation,
    topRiskSignal,
    context: {
      totalCommits,
      activeHours,
      lateNightRatio,
      avgCommitHour: safeAvgCommitHour,
      followers: safeFollowers,
      totalStars: safeTotalStars,
    },
  };
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
        const fork = Boolean(repo?.fork ?? repo?.is_fork ?? false);
        const login = normalizedUser.login || fallbackUsername;
        return {
          ...repo,
          stargazers_count: stars,
          stars,
          forks_count: forks,
          forks,
          fork,
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
                sha: typeof commit?.sha === "string" ? commit.sha : "",
              }))
              .filter((commit) => commit.message)
          : [];

        const repoName = typeof event?.repo?.name === "string"
          ? event.repo.name
          : `${normalizedUser.login || fallbackUsername}/unknown`;

        return {
          type: typeof event?.type === "string" ? event.type : "",
          created_at: typeof event?.created_at === "string" ? event.created_at : "",
          repo: { name: repoName },
          payload: { commits },
        };
      }).filter((event) => event.type && event.created_at)
    : (Array.isArray(githubPayload.recent_commit_timestamps)
        ? (() => {
            const fallbackMessages = Array.isArray(githubPayload.recent_commit_messages)
              ? githubPayload.recent_commit_messages.map((message) => normalizeCommitMessage(message))
              : [];

            return githubPayload.recent_commit_timestamps
            .filter((timestamp) => typeof timestamp === "string" && timestamp)
            .map((timestamp, index) => {
              const message = fallbackMessages[index] || "";
              return {
              type: "PushEvent",
              created_at: timestamp,
              repo: { name: `${normalizedUser.login || fallbackUsername}/unknown` },
              payload: {
                commits: message ? [{ message, sha: "" }] : [],
              },
              };
            });
          })()
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

  const normalizedCommitMessages = (() => {
    const directMessages = Array.isArray(githubPayload.recent_commit_messages)
      ? githubPayload.recent_commit_messages
      : [];

    if (directMessages.length > 0) {
      return directMessages
        .map((message) => normalizeCommitMessage(message))
        .filter(Boolean);
    }

    return normalizedEvents
      .flatMap((event) => (Array.isArray(event?.payload?.commits) ? event.payload.commits : []))
      .map((commit) => normalizeCommitMessage(commit?.message))
      .filter(Boolean);
  })();

  const totalRepos = Math.max(Number(normalizedUser.public_repos || 0), normalizedRepos.length);
  const accountAge = normalizedUser.created_at
    ? ((Date.now() - new Date(normalizedUser.created_at).getTime()) / (1000 * 60 * 60 * 24 * 365))
    : 0;
  const weekendCommits = Number(githubPayload?.weekend_vs_weekday?.weekend_commits || 0);
  const weekdayCommits = Number(githubPayload?.weekend_vs_weekday?.weekday_commits || 0);
  const weekendRatio = (weekendCommits + weekdayCommits) > 0
    ? (weekendCommits / (weekendCommits + weekdayCommits))
    : 0;
  const recentCommits = Number(
    githubPayload.recentCommits
      ?? githubPayload.recent_commits_30d
      ?? githubPayload.recent_commit_messages?.length
      ?? normalizedCommitMessages.length
      ?? 0,
  );

  const baseTraits = calculateBaseTraits({
    totalStars: Number(totalStars || 0),
    totalRepos,
    followers: Number(normalizedUser.followers || 0),
    following: Number(normalizedUser.following || 0),
    accountAge,
    recentCommits,
    topLangs,
    avgCommitHour: Number(githubPayload.avg_commit_hour ?? 12),
    weekendRatio,
    commitMessages: normalizedCommitMessages,
    commitHourDist: Array.isArray(githubPayload.commit_hour_distribution) ? githubPayload.commit_hour_distribution : [],
    bio: String(normalizedUser.bio || ""),
    blog: String(normalizedUser.blog || ""),
    repos: normalizedRepos,
  });

  const normalizedAiData = {
    ...aiPayload,
    traits: constrainAiTraitRefinement(baseTraits, aiPayload?.traits, 8),
    baseTraits,
  };

  return {
    github: normalizedGithub,
    aiData: normalizedAiData,
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

async function fetchReadmeFallbackCommitSample(username, repos) {
  const safeUsername = String(username || "").trim();
  if (!safeUsername || !Array.isArray(repos) || repos.length === 0) return null;

  const repoCandidates = [...repos]
    .filter((repo) => repo && typeof repo.name === "string" && repo.name.trim())
    .sort((left, right) => {
      const leftPushed = new Date(left?.pushed_at || left?.updated_at || 0).getTime();
      const rightPushed = new Date(right?.pushed_at || right?.updated_at || 0).getTime();
      return rightPushed - leftPushed;
    });

  const readmeCandidates = ["README.md", "README.MD", "readme.md", "README"];

  for (const repo of repoCandidates.slice(0, 6)) {
    const repoName = String(repo?.name || "").trim();
    if (!repoName) continue;

    for (const readmePath of readmeCandidates) {
      const apiUrl = `https://api.github.com/repos/${encodeURIComponent(safeUsername)}/${encodeURIComponent(repoName)}/commits?path=${encodeURIComponent(readmePath)}&per_page=1`;

      try {
        const response = await fetch(apiUrl, { headers: GITHUB_API_HEADERS });
        if (!response.ok) continue;

        const payload = await response.json();
        const firstCommit = Array.isArray(payload) ? payload[0] : null;
        const messageLine = normalizeCommitMessage(String(firstCommit?.commit?.message || "").split("\n")[0]);
        if (!messageLine) continue;

        const sha = String(firstCommit?.sha || "").slice(0, 7) || "???????";
        const timestamp = String(firstCommit?.commit?.author?.date || repo?.pushed_at || "");
        return {
          message: messageLine,
          repo: repoName,
          timestamp,
          sha,
        };
      } catch {
        // Ignore network failures; this is a best-effort fallback.
      }
    }
  }

  return null;
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

function BurnoutGauge({ score, tierLabel, tierColor }) {
  const safeScore = clampNumber(Number(score) || 0, 0, 100);
  const resolvedTierLabel = tierLabel || (
    safeScore >= 75
      ? "CRITICAL"
      : safeScore >= 55
        ? "ELEVATED"
        : safeScore >= 35
          ? "OPTIMAL"
          : "BALANCED"
  );
  const resolvedTierColor = tierColor || (
    safeScore >= 75
      ? "#ff4545"
      : safeScore >= 55
        ? "#ffb300"
        : safeScore >= 35
          ? "#00dcff"
          : "#39ff14"
  );

  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    const targetProgress = safeScore / 100;
    let start = null;
    let rafId = 0;

    const animate = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / 1400, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = targetProgress * eased;
      setOffset(circumference * (1 - current));
      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      }
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [safeScore, circumference]);

  return (
    <div style={{ position: "relative", width: 170, height: 170 }}>
      <svg width="170" height="170" style={{ transform: "rotate(-90deg)", position: "absolute", inset: 0 }}>
        <circle cx="85" cy="85" r={radius} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" />
        <circle cx="85" cy="85" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" strokeDasharray="5 8" />
        <circle
          cx="85"
          cy="85"
          r={radius}
          fill="none"
          stroke={resolvedTierColor}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ filter: `drop-shadow(0 0 10px ${resolvedTierColor}99)` }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: "Orbitron,monospace", fontSize: "2rem", fontWeight: 900, lineHeight: 1, color: resolvedTierColor, textShadow: `0 0 12px ${resolvedTierColor}88` }}>
          <AnimatedCounter target={safeScore} delay={180} duration={1000} />
        </div>
        <div style={{ marginTop: 4, fontFamily: "Share Tech Mono,monospace", fontSize: "0.5rem", letterSpacing: "0.16em", color: "rgba(0,220,255,0.58)" }}>
          BURNOUT INDEX
        </div>
        <div style={{ marginTop: 4, fontFamily: "Share Tech Mono,monospace", fontSize: "0.6rem", letterSpacing: "0.13em", color: resolvedTierColor }}>
          {resolvedTierLabel}
        </div>
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

function StatCard({ label, value, delay, sub, enterIndex = 0, ticker = false }) {
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
  const gradientToken = useId().replace(/:/g, "");
  if (!traits || typeof traits !== "object") return null;

  const data = [
    { key: "creativity", trait: "Creativity", value: clampNumber(Number(traits.creativity ?? 50), 0, 100) },
    { key: "discipline", trait: "Discipline", value: clampNumber(Number(traits.discipline ?? 50), 0, 100) },
    { key: "collaboration", trait: "Collaboration", value: clampNumber(Number(traits.collaboration ?? 50), 0, 100) },
    { key: "boldness", trait: "Boldness", value: clampNumber(Number(traits.boldness ?? 50), 0, 100) },
    { key: "depth", trait: "Depth", value: clampNumber(Number(traits.depth ?? 50), 0, 100) },
    { key: "velocity", trait: "Velocity", value: clampNumber(Number(traits.velocity ?? 50), 0, 100) },
  ];

  const dominantTrait = data.reduce(
    (winner, item) => (item.value > winner.value ? item : winner),
    data[0],
  );

  const dominantPalette = {
    creativity: "#b347ea",
    discipline: "#00dcff",
    collaboration: "#00dcff",
    boldness: "#ffd770",
    depth: "#00dcff",
    velocity: "#39ff14",
  };

  const dominantColor = dominantPalette[dominantTrait?.key] || "#00dcff";
  const chartWidth = 260;
  const chartHeight = 220;
  const chartCx = 130;
  const chartCy = 108;
  const chartOuterRadius = 74;

  const axisVectors = data.map((item, index) => {
    const angleDeg = -90 + ((index * 360) / data.length);
    const angleRad = (angleDeg * Math.PI) / 180;

    return {
      key: item.key,
      angleDeg,
      angleRad,
      x: chartCx + Math.cos(angleRad) * chartOuterRadius,
      y: chartCy + Math.sin(angleRad) * chartOuterRadius,
    };
  });

  const dominantAxis = axisVectors.find((axis) => axis.key === dominantTrait?.key) || axisVectors[0];
  const gradientId = `traits-radar-gradient-${gradientToken}`;
  const gradientX2 = chartCx + Math.cos(dominantAxis.angleRad) * chartOuterRadius;
  const gradientY2 = chartCy + Math.sin(dominantAxis.angleRad) * chartOuterRadius;

  const valueLabelPoints = data.map((item, index) => {
    const axis = axisVectors[index];
    const radius = (chartOuterRadius * item.value) / 100;
    const insideRadius = Math.max(10, radius - 8);
    return {
      key: item.key,
      value: Math.round(item.value),
      angleDeg: axis.angleDeg,
      x: chartCx + Math.cos(axis.angleRad) * insideRadius,
      y: chartCy + Math.sin(axis.angleRad) * insideRadius,
    };
  });

  const renderAngleTick = ({ x, y, payload, textAnchor, index }) => {
    const datum = data[index] || data.find((item) => item.trait === payload?.value);
    const hoverText = `${datum?.trait || payload?.value}: ${Math.round(Number(datum?.value ?? 0))}`;

    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={3}
          textAnchor={textAnchor || "middle"}
          fill="rgba(0,220,255,0.62)"
          fontFamily="Share Tech Mono,monospace"
          fontSize={9}
        >
          {payload?.value}
          <title>{hoverText}</title>
        </text>
      </g>
    );
  };

  return (
    <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
      <RadarChart
        data={data}
        width={chartWidth}
        height={chartHeight}
        cx={chartCx}
        cy={chartCy}
        outerRadius={chartOuterRadius}
        margin={{ top: 8, right: 12, bottom: 8, left: 12 }}
      >
        <defs>
          <linearGradient id={gradientId} x1={chartCx} y1={chartCy} x2={gradientX2} y2={gradientY2} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={dominantColor} stopOpacity={0.08} />
            <stop offset="100%" stopColor={dominantColor} stopOpacity={0.42} />
          </linearGradient>
        </defs>

        <PolarGrid stroke="rgba(0,220,255,0.1)" />

        {axisVectors.map((axis) => (
          <line
            key={`axis-${axis.key}`}
            x1={chartCx}
            y1={chartCy}
            x2={axis.x}
            y2={axis.y}
            stroke={axis.key === dominantTrait.key ? "rgba(255,255,255,0.5)" : "rgba(0,220,255,0.14)"}
            strokeWidth={axis.key === dominantTrait.key ? 1.8 : 1}
          />
        ))}

        <PolarAngleAxis
          dataKey="trait"
          tick={renderAngleTick}
          tickLine={false}
        />
        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />

        <Radar
          dataKey="value"
          stroke={dominantColor}
          fill={`url(#${gradientId})`}
          fillOpacity={1}
          strokeWidth={1.7}
          dot={{ fill: dominantColor, r: 2.4 }}
          isAnimationActive={false}
        />

        {valueLabelPoints.map((point) => (
          <text
            key={`radar-value-${point.key}`}
            x={point.x}
            y={point.y}
            fill="rgba(255,255,255,0.95)"
            fontFamily="Share Tech Mono,monospace"
            fontSize={9}
            textAnchor="middle"
            dominantBaseline="middle"
            transform={`rotate(${point.angleDeg} ${point.x} ${point.y})`}
          >
            {point.value}
          </text>
        ))}
      </RadarChart>
    </div>
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
    const resetTimer = setTimeout(() => {
      setVisibleCount(0);
    }, 0);
    let next = 0;
    const timer = setInterval(() => {
      next += 1;
      setVisibleCount(Math.min(next, chars.length));
      if (next >= chars.length) clearInterval(timer);
    }, 60);
    return () => {
      clearTimeout(resetTimer);
      clearInterval(timer);
    };
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
  const [inputError, setInputError] = useState("");
  const [isInputFocused, setIsInputFocused] = useState(false);
  const inputRef = useRef(null);
  const recentProfiles = ["torvalds", "gaearon", "antirez"];
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

function TimeMachine({ repos, events, user, onClose }) {
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
    const timeout = setTimeout(() => setScanTimeoutReached(true), 3000);

    geocodeLocation()
      .then((result) => {
        if (cancelled) return;
        setGeo(result);
      })
      .finally(() => {
        if (cancelled) return;
        setGeocodeReady(true);
      });

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [user?.login, user?.location]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (sequenceStep !== 1) return;
    if (!geocodeReady && !scanTimeoutReached) return;
    const timeout = setTimeout(() => setSequenceStep(2), 80);
    return () => clearTimeout(timeout);
  }, [sequenceStep, geocodeReady, scanTimeoutReached]);

  useEffect(() => {
    if (sequenceStep !== 2) return;
    const resetTimer = setTimeout(() => {
      setTypedPlace("");
      setTypedCoords("");
    }, 0);

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
      clearTimeout(resetTimer);
      clearTimeout(signalDelay);
      if (placeTimer) clearInterval(placeTimer);
      if (coordsTimer) clearInterval(coordsTimer);
    };
  }, [sequenceStep, geo.city, geo.country, coordsText]);

  useEffect(() => {
    if (sequenceStep !== 3) return;
    const text = `SIGNAL STRENGTH: ${countryStats.signal}/100`;
    const resetTimer = setTimeout(() => {
      setTypedSignal("");
    }, 0);
    let index = 0;
    const timer = setInterval(() => {
      index += 1;
      setTypedSignal(text.slice(0, index));
      if (index >= text.length) clearInterval(timer);
    }, 18);
    return () => {
      clearTimeout(resetTimer);
      clearInterval(timer);
    };
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
      let fallbackFrame = 0;
      fallbackFrame = requestAnimationFrame(() => {
        setAnimatedDevCount(countryStats.devCount);
      });
      return () => cancelAnimationFrame(fallbackFrame);
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
  }, [showMainMap, API_URL, user?.login, geo.city, geo.country, geo.countryCode, topLang, totalStars, accountAge, recentCommits]); // eslint-disable-line react-hooks/exhaustive-deps

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

function TradingCard({
  user,
  devScore,
  totalStars,
  reposCount,
  followers,
  velocity,
  dnaSequence,
  tier,
  devClass,
  workStyle,
  traits,
  strengthReport,
  warningSign,
  onClose,
}) {
  const cardRef = useRef(null);
  const [flipped, setFlipped] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const normalizedTier = String(tier || "RISING").toUpperCase();
  const isBalatharunr = (user?.login || "").toLowerCase() === BALATHARUNR_HANDLE;
  const tierBand = {
    LEGENDARY: "linear-gradient(90deg,#8e5b00,#ffd76a,#9f5f00)",
    ELITE: "linear-gradient(90deg,#2a103f,#9f4eff,#2d1146)",
    VETERAN: "linear-gradient(90deg,#063649,#00dcff,#0a3d4d)",
    RISING: "linear-gradient(90deg,#163c0d,#39ff14,#1f4313)",
  }[normalizedTier] || "linear-gradient(90deg,#163c0d,#39ff14,#1f4313)";
  const effectiveTierBand = isBalatharunr
    ? "linear-gradient(90deg,#3a434f,#d9e1ec,#465463)"
    : tierBand;

  const scoreValue = clampNumber(Number(devScore) || 0, 0, 100);
  const rarity = scoreValue >= 90
    ? { label: "✦ MYTHIC", className: "tc-rarity-mythic" }
    : scoreValue >= 75
      ? { label: "◆ LEGENDARY", className: "tc-rarity-legendary" }
      : scoreValue >= 60
        ? { label: "◈ RARE", className: "tc-rarity-rare" }
        : scoreValue >= 40
          ? { label: "○ UNCOMMON", className: "tc-rarity-uncommon" }
          : { label: "· COMMON", className: "tc-rarity-common" };

  const safeTraits = useMemo(() => {
    const fallbackVelocity = Number.isFinite(Number(velocity)) ? Number(velocity) : 50;
    return [
      { key: "creativity", label: "CRE", value: clampNumber(Number(traits?.creativity ?? 50), 0, 100) },
      { key: "discipline", label: "DIS", value: clampNumber(Number(traits?.discipline ?? 50), 0, 100) },
      { key: "collaboration", label: "COL", value: clampNumber(Number(traits?.collaboration ?? 50), 0, 100) },
      { key: "boldness", label: "BOL", value: clampNumber(Number(traits?.boldness ?? 50), 0, 100) },
      { key: "depth", label: "DPT", value: clampNumber(Number(traits?.depth ?? 50), 0, 100) },
      { key: "velocity", label: "VEL", value: clampNumber(Number(traits?.velocity ?? fallbackVelocity), 0, 100) },
    ];
  }, [traits, velocity]);

  const velocityValue = safeTraits.find((item) => item.key === "velocity")?.value || 50;
  const cardNumber = isBalatharunr
    ? "#9NX"
    : `#${String(dnaSequence || "0000").slice(-4).toUpperCase()}`;

  const radarCenter = 90;
  const radarRadius = 66;
  const pointFor = (index, multiplier) => {
    const angle = ((-90 + (index * 360) / safeTraits.length) * Math.PI) / 180;
    return {
      x: radarCenter + Math.cos(angle) * radarRadius * multiplier,
      y: radarCenter + Math.sin(angle) * radarRadius * multiplier,
    };
  };

  const radarLevels = [20, 40, 60, 80, 100];
  const radarGrid = radarLevels.map((level) => safeTraits.map((_, index) => {
    const p = pointFor(index, level / 100);
    return `${p.x},${p.y}`;
  }).join(" "));

  const radarPolygon = safeTraits.map((item, index) => {
    const p = pointFor(index, item.value / 100);
    return `${p.x},${p.y}`;
  }).join(" ");

  const handleHoloMove = (event) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const mx = clampNumber(((event.clientX - rect.left) / rect.width) * 100, 0, 100);
    const my = clampNumber(((event.clientY - rect.top) / rect.height) * 100, 0, 100);
    cardRef.current.style.setProperty("--mx", mx.toFixed(2));
    cardRef.current.style.setProperty("--my", my.toFixed(2));
  };

  const resetHolo = () => {
    if (!cardRef.current) return;
    cardRef.current.style.setProperty("--mx", "50");
    cardRef.current.style.setProperty("--my", "50");
  };

  const handleDownload = async () => {
    if (!cardRef.current || isDownloading) return;
    setIsDownloading(true);

    let exportNode = null;
    try {
      if (document?.fonts?.ready) {
        await document.fonts.ready;
      }

      const sourceNode = cardRef.current;
      exportNode = sourceNode.cloneNode(true);
      exportNode.classList.add("tc-export-static");

      const currentMx = sourceNode.style.getPropertyValue("--mx") || "50";
      const currentMy = sourceNode.style.getPropertyValue("--my") || "50";
      const currentBand = sourceNode.style.getPropertyValue("--tier-band") || effectiveTierBand;

      exportNode.style.setProperty("--mx", currentMx);
      exportNode.style.setProperty("--my", currentMy);
      exportNode.style.setProperty("--tier-band", currentBand);
      exportNode.style.position = "fixed";
      exportNode.style.left = "-10000px";
      exportNode.style.top = "0";
      exportNode.style.margin = "0";
      exportNode.style.transform = "none";
      exportNode.style.width = "320px";
      exportNode.style.height = "480px";
      exportNode.style.zIndex = "-1";
      exportNode.style.pointerEvents = "none";

      const exportInner = exportNode.querySelector(".tc-inner");
      const exportFront = exportNode.querySelector(".tc-front");
      const exportBack = exportNode.querySelector(".tc-back");

      if (exportInner) {
        exportInner.classList.remove("flipped");
        exportInner.style.transform = "none";
        exportInner.style.transition = "none";
      }

      const activateFace = (face, hiddenFace) => {
        if (hiddenFace) hiddenFace.style.display = "none";
        if (!face) return;
        face.style.display = "flex";
        face.style.position = "relative";
        face.style.inset = "auto";
        face.style.transform = "none";
        face.style.backfaceVisibility = "visible";
      };

      if (flipped) activateFace(exportBack, exportFront);
      else activateFace(exportFront, exportBack);

      document.body.appendChild(exportNode);
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      const canvas = await html2canvas(exportNode, {
        backgroundColor: null,
        scale: Math.max(2, window.devicePixelRatio || 1),
        useCORS: true,
        allowTaint: false,
        logging: false,
        removeContainer: true,
        width: 320,
        height: 480,
        windowWidth: 320,
        windowHeight: 480,
      });

      if (exportNode && exportNode.parentNode) {
        exportNode.parentNode.removeChild(exportNode);
        exportNode = null;
      }

      const filename = `gitdna-card-${String(user?.login || "dev")}.png`;
      const link = document.createElement("a");
      link.download = filename;
      link.href = canvas.toDataURL("image/png");
      link.click();

      const tweetText = `Just got my GitDNA developer card 🃏\nArchetype: ${devClass} | Score: ${scoreValue}/100 | Rarity: ${rarity.label}\nScan any dev → gitdna.vercel.app\n#GitDNA #DevCard #GitHub`;
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(tweetText);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      // Keep flow silent if browser blocks canvas/clipboard.
    } finally {
      if (exportNode && exportNode.parentNode) {
        exportNode.parentNode.removeChild(exportNode);
      }
      setIsDownloading(false);
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="tc-overlay" onClick={() => onClose?.()}>
      <style>{TRADING_CARD_STYLES}</style>
      <div className="tc-shell" onClick={(event) => event.stopPropagation()}>
        <div
          ref={cardRef}
          className={`tc-card ${rarity.className}${isBalatharunr ? " tc-collab-silver" : ""}`}
          onMouseMove={handleHoloMove}
          onMouseLeave={resetHolo}
          onClick={() => setFlipped((prev) => !prev)}
          style={{ "--tier-band": effectiveTierBand }}
        >
          <div className={`tc-inner${flipped ? " flipped" : ""}`}>
            <article className="tc-face tc-front">
              <div className="tc-header">
                <span>GITDNA DEVELOPER SERIES</span>
                <span>{normalizedTier}</span>
              </div>

              <div className="tc-portrait">
                {user?.avatar_url
                  ? <img src={user.avatar_url} alt={`${user?.login || "user"} avatar`} />
                  : <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: "#9ed7ff", fontFamily: "Orbitron,monospace", fontSize: "2rem" }}>?</div>}
                <div className="tc-holo" />
                <div className="tc-username">@{user?.login || "unknown"}</div>
              </div>

              <div className="tc-stats">
                <div className="tc-stat"><span>⭐ STARS</span><strong>{Number(totalStars || 0).toLocaleString()}</strong></div>
                <div className="tc-stat"><span>◈ REPOS</span><strong>{Number(reposCount || 0).toLocaleString()}</strong></div>
                <div className="tc-stat"><span>♟ FOLLOWERS</span><strong>{Number(followers || 0).toLocaleString()}</strong></div>
                <div className="tc-stat"><span>⚡ VELOCITY</span><strong>{Math.round(velocityValue)}</strong></div>
              </div>

              <div className="tc-devscore">
                <div className="tc-devscore-label">DEV SCORE</div>
                <div className="tc-devscore-value">{scoreValue}</div>
              </div>

              <div className="tc-ability">
                <div className="tc-ability-title">SIGNATURE ABILITY</div>
                <div className="tc-ability-main">{devClass || "Unknown Archetype"}</div>
                <div className="tc-ability-sub">{workStyle || "Adaptive Rhythm Coder"}</div>
              </div>

              <div className="tc-rarity">{rarity.label}</div>

              <div className="tc-footer">
                <div className="tc-dna">{String(dnaSequence || "0000000000000000")}</div>
                <div>gitdna.vercel.app</div>
                <div className="tc-card-number">{cardNumber}</div>
              </div>
            </article>

            <article className="tc-face tc-back">
              <div className="tc-header">
                <span>GITDNA DEVELOPER SERIES</span>
                <span>CARD BACK</span>
              </div>

              <div className="tc-back-wrap">
                <div className="tc-radar">
                  <svg width="180" height="180" viewBox="0 0 180 180" aria-hidden="true">
                    {radarGrid.map((polygon, index) => (
                      <polygon
                        key={`grid-${index}`}
                        points={polygon}
                        fill="none"
                        stroke="rgba(0,220,255,0.16)"
                        strokeWidth="1"
                      />
                    ))}

                    {safeTraits.map((item, index) => {
                      const end = pointFor(index, 1);
                      const label = pointFor(index, 1.18);
                      return (
                        <g key={`axis-${item.key}`}>
                          <line x1={radarCenter} y1={radarCenter} x2={end.x} y2={end.y} stroke="rgba(0,220,255,0.14)" strokeWidth="1" />
                          <text x={label.x} y={label.y} fill="rgba(0,220,255,0.64)" fontFamily="Share Tech Mono,monospace" fontSize="8" textAnchor="middle" dominantBaseline="middle">
                            {item.label}
                          </text>
                        </g>
                      );
                    })}

                    <polygon points={radarPolygon} fill="rgba(0,220,255,0.24)" stroke="rgba(0,220,255,0.85)" strokeWidth="1.4" />
                  </svg>
                </div>

                <div className="tc-textbox">
                  <h4>STRENGTH REPORT</h4>
                  <p>{strengthReport || "No strength report available."}</p>
                </div>

                <div className="tc-textbox">
                  <h4>WARNING SIGN</h4>
                  <p>{warningSign || "No warning signal available."}</p>
                </div>

                <div className="tc-logo">GITDNA</div>
              </div>

              <div className="tc-rarity">{rarity.label}</div>
            </article>
          </div>
        </div>

        <div className="tc-actions">
          <button className="gd-btn" onClick={handleDownload} disabled={isDownloading} style={{ padding: "8px 14px", fontSize: "0.64rem" }}>
            {isDownloading ? "RENDERING..." : "DOWNLOAD CARD"}
          </button>
          <button className="gd-btn" onClick={() => onClose?.()} style={{ padding: "8px 14px", fontSize: "0.64rem" }}>
            CLOSE
          </button>
        </div>

        {copied && <div className="tc-copy">Tweet text copied to clipboard.</div>}
        <div className="tc-hint">Click card to flip</div>
      </div>
    </div>,
    document.body,
  );
}

const NEWSPAPER_PORTAL_STYLES = `
.np-overlay{position:fixed;inset:0;z-index:9999;background:radial-gradient(circle at 20% 0%,rgba(0,220,255,.18),transparent 45%),radial-gradient(circle at 88% 100%,rgba(255,179,0,.12),transparent 40%),#05070c;overflow:auto;padding:26px 14px 132px}
.np-overlay.np-closing{animation:np-fade-out .22s ease forwards}
.np-shell{position:relative;max-width:980px;margin:0 auto}
.np-paper{position:relative;background:linear-gradient(180deg,#f5ecd6 0%,#efe3c8 52%,#e8d8b8 100%);color:#25170c;border:1px solid rgba(92,64,33,.5);border-radius:6px;padding:22px 24px 28px;box-shadow:0 22px 60px rgba(0,0,0,.55),0 0 0 1px rgba(255,255,255,.2) inset;animation:np-paper-in .35s cubic-bezier(.2,.8,.2,1)}
.np-paper::before{content:'';position:absolute;inset:0;border-radius:6px;background:radial-gradient(circle at 0% 100%,rgba(122,82,43,.14),transparent 48%),radial-gradient(circle at 100% 0%,rgba(122,82,43,.16),transparent 40%);pointer-events:none}
.np-paper::after{content:'';position:absolute;inset:0;border-radius:6px;opacity:.12;background-image:repeating-linear-gradient(0deg,rgba(54,35,17,.18) 0px,rgba(54,35,17,.18) 1px,transparent 1px,transparent 3px);pointer-events:none}
.np-masthead-row{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;position:relative;z-index:1}
.np-edition{font-family:'Share Tech Mono',monospace;font-size:.64rem;letter-spacing:.14em;color:#5b3f24}
.np-date{font-family:'Share Tech Mono',monospace;font-size:.62rem;letter-spacing:.12em;color:#5b3f24}
.np-corner-close{margin-left:auto;display:inline-flex;align-items:center;justify-content:center;width:29px;height:29px;border-radius:999px;border:1px solid rgba(124,55,55,.64);background:linear-gradient(135deg,rgba(87,30,30,.92),rgba(124,37,37,.92));color:#ffe3e3;font-family:'Share Tech Mono',monospace;font-size:.9rem;line-height:1;cursor:pointer;box-shadow:0 2px 8px rgba(69,25,25,.35)}
.np-corner-close:hover{transform:translateY(-1px);filter:brightness(1.07)}
.np-masthead{margin-top:8px;text-align:center;font-family:'Baskerville','Palatino Linotype','Book Antiqua',serif;font-size:clamp(2rem,7vw,3.35rem);font-weight:700;letter-spacing:.1em;line-height:1;color:#2d1a0b;position:relative;z-index:1}
.np-rule{height:2px;background:linear-gradient(90deg,transparent,rgba(74,49,28,.75),transparent);margin:10px 0 9px;position:relative;z-index:1}
.np-ticker{font-family:'Share Tech Mono',monospace;font-size:.68rem;letter-spacing:.08em;color:#5f4125;border-top:1px solid rgba(84,56,30,.35);border-bottom:1px solid rgba(84,56,30,.35);padding:7px 0;position:relative;z-index:1}
.np-page-header{margin-top:15px;display:flex;align-items:center;justify-content:space-between;gap:10px;position:relative;z-index:1}
.np-page-kicker{font-family:'Share Tech Mono',monospace;font-size:.6rem;letter-spacing:.14em;color:#5f4125;text-transform:uppercase}
.np-page-count{font-family:'Share Tech Mono',monospace;font-size:.58rem;letter-spacing:.14em;color:#765130}
.np-toolbar{margin-top:10px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;position:relative;z-index:1}
.np-refresh-stamp{font-family:'Share Tech Mono',monospace;font-size:.54rem;letter-spacing:.12em;color:#6b4828;text-transform:uppercase}
.np-toolbar-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.np-toolbar .gd-btn{padding:7px 12px;font-size:.56rem;letter-spacing:.1em;border:1px solid rgba(88,64,39,.65);background:linear-gradient(135deg,#2f1f11,#5a3a20);color:#f8ecd9;box-shadow:0 2px 8px rgba(53,29,9,.25)}
.np-toolbar .gd-btn:hover{transform:translateY(-1px)}
.np-toolbar .np-share-btn{border-color:rgba(68,131,170,.72);background:linear-gradient(135deg,#102738,#24547b);color:#d8f1ff}
.np-toolbar .np-close-btn{border-color:rgba(171,72,72,.72);background:linear-gradient(135deg,#3a1515,#6a1f1f);color:#ffdede}
.np-page-window{margin-top:10px;overflow:hidden;border:1px solid rgba(92,64,33,.3);border-radius:6px;background:rgba(255,250,240,.3);position:relative;z-index:1;perspective:1700px;transform-style:preserve-3d}
.np-page-window::before{content:'';position:absolute;inset:0;opacity:0;pointer-events:none;mix-blend-mode:multiply;background:radial-gradient(circle at 50% 50%,rgba(40,24,8,.28),transparent 70%)}
.np-page-window::after{content:'';position:absolute;inset:-8% -30% -8% auto;width:58%;opacity:0;pointer-events:none;background:linear-gradient(108deg,rgba(255,255,255,0) 0%,rgba(255,255,255,.28) 26%,rgba(104,72,41,.24) 54%,rgba(0,0,0,0) 100%)}
.np-page-window.np-turn-next{transform-origin:left center;animation:np-book-turn-next .62s cubic-bezier(.2,.74,.24,1)}
.np-page-window.np-turn-prev{transform-origin:right center;animation:np-book-turn-prev .62s cubic-bezier(.2,.74,.24,1)}
.np-page-window.np-turning::before{animation:np-turn-shadow .62s ease}
.np-page-window.np-turn-next::after{animation:np-curl-next .62s cubic-bezier(.2,.74,.24,1)}
.np-page-window.np-turn-prev::after{left:-30%;right:auto;background:linear-gradient(252deg,rgba(255,255,255,0) 0%,rgba(255,255,255,.28) 26%,rgba(104,72,41,.24) 54%,rgba(0,0,0,0) 100%);animation:np-curl-prev .62s cubic-bezier(.2,.74,.24,1)}
.np-page-track{display:flex;width:100%;transition:transform .66s cubic-bezier(.2,.82,.25,1);will-change:transform}
.np-page{min-width:100%;padding:14px 14px 10px;box-sizing:border-box}
.np-grid{display:grid;grid-template-columns:minmax(0,2fr) minmax(230px,1fr);gap:24px;position:relative;z-index:1}
.np-main-column{display:flex;flex-direction:column;gap:14px}
.np-headline{font-family:'Baskerville','Palatino Linotype','Book Antiqua',serif;font-size:clamp(1.5rem,4.2vw,2.5rem);line-height:1.13;letter-spacing:.01em;color:#1f1208}
.np-subheadline{font-family:'Rajdhani',sans-serif;font-size:1rem;line-height:1.45;color:#3f2916;font-weight:500}
.np-story{font-family:'Georgia',serif;font-size:.96rem;line-height:1.75;color:#2b1c0d}
.np-quote{margin:3px 0;border-left:3px solid rgba(92,64,33,.55);padding:6px 0 6px 10px;font-family:'Baskerville','Palatino Linotype','Book Antiqua',serif;font-style:italic;font-size:1rem;line-height:1.6;color:#3d2814}
.np-secondary{border-top:1px solid rgba(92,64,33,.35);padding-top:12px}
.np-secondary-title{font-family:'Baskerville','Palatino Linotype','Book Antiqua',serif;font-size:1.16rem;letter-spacing:.05em;color:#25170c;margin-bottom:6px}
.np-sidebar{display:flex;flex-direction:column;gap:12px}
.np-sidebar-card{border:1px solid rgba(92,64,33,.34);background:rgba(255,250,240,.4);padding:12px 11px;border-radius:4px}
.np-sidebar-title{font-family:'Share Tech Mono',monospace;font-size:.62rem;letter-spacing:.14em;text-transform:uppercase;color:#5f4125;margin-bottom:7px}
.np-sidebar-list{list-style:none;display:flex;flex-direction:column;gap:6px}
.np-sidebar-list li{font-family:'Rajdhani',sans-serif;font-size:.84rem;color:#2e1d10;line-height:1.4}
.np-editorial{font-family:'Georgia',serif;font-size:.9rem;line-height:1.62;color:#2f2011}
.np-hot-grid{display:grid;grid-template-columns:minmax(0,2fr) minmax(240px,1fr);gap:18px}
.np-hot-cards{display:grid;grid-template-columns:minmax(0,1fr);gap:10px}
.np-hot-card{border:1px solid rgba(92,64,33,.34);background:rgba(255,249,236,.45);border-radius:5px;padding:9px 10px}
.np-hot-tag{display:inline-flex;font-family:'Share Tech Mono',monospace;font-size:.53rem;letter-spacing:.12em;color:#704c2d;margin-bottom:6px}
.np-market-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.np-repo-board{display:flex;flex-direction:column;gap:7px}
.np-repo-row,.np-lang-row{display:flex;align-items:center;justify-content:space-between;gap:10px;border-bottom:1px dashed rgba(92,64,33,.24);padding-bottom:6px}
.np-repo-row:last-child,.np-lang-row:last-child{border-bottom:none;padding-bottom:0}
.np-repo-name,.np-lang-name{font-family:'Rajdhani',sans-serif;font-size:.86rem;color:#2b1c0d;line-height:1.35}
.np-repo-meta,.np-lang-meta{font-family:'Share Tech Mono',monospace;font-size:.56rem;letter-spacing:.08em;color:#6b4828;text-align:right;white-space:nowrap}
.np-small-note{font-family:'Rajdhani',sans-serif;font-size:.82rem;color:#2d1f12;line-height:1.5}
.np-opinion-stack{display:flex;flex-direction:column;gap:10px}
.np-opinion-card{border:1px solid rgba(92,64,33,.32);background:rgba(255,249,236,.4);border-radius:5px;padding:9px 10px}
.np-timeline{display:flex;flex-direction:column;gap:8px;list-style:none;padding:0;margin:0}
.np-timeline li{position:relative;padding-left:14px;font-family:'Rajdhani',sans-serif;font-size:.84rem;color:#2d1e10;line-height:1.45}
.np-timeline li::before{content:'';position:absolute;left:0;top:.45em;width:6px;height:6px;border-radius:50%;background:#7f542f}
.np-footer{margin-top:18px;padding-top:11px;border-top:1px solid rgba(92,64,33,.4);font-family:'Share Tech Mono',monospace;font-size:.62rem;letter-spacing:.11em;color:#5f4125;text-align:center;position:relative;z-index:1}
.np-loading-wrap{display:flex;flex-direction:column;gap:12px;margin-top:15px;position:relative;z-index:1}
.np-loading-title{font-family:'Share Tech Mono',monospace;font-size:.72rem;letter-spacing:.2em;color:#5f4125}
.np-skeleton{height:11px;border-radius:4px;background:linear-gradient(90deg,rgba(120,87,52,.16),rgba(120,87,52,.31),rgba(120,87,52,.16));background-size:250% 100%;animation:np-shimmer 1.25s linear infinite}
.np-skeleton.short{width:38%}
.np-skeleton.mid{width:64%}
.np-skeleton.long{width:100%}
.np-load-error{margin-top:10px;font-family:'Share Tech Mono',monospace;font-size:.6rem;letter-spacing:.08em;color:#7a1e1e;background:rgba(122,30,30,.08);border:1px solid rgba(122,30,30,.28);padding:6px 8px;border-radius:4px}
.np-bottom-bar{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:10001;display:grid;grid-template-columns:repeat(4,minmax(130px,1fr));gap:8px;width:min(96vw,760px);padding:9px;border-radius:14px;border:1px solid rgba(0,220,255,.35);background:linear-gradient(180deg,rgba(6,16,28,.95),rgba(4,10,18,.95));box-shadow:0 0 22px rgba(0,220,255,.24)}
.np-control-btn{position:relative;overflow:hidden;padding:10px 12px;font-size:.58rem;letter-spacing:.1em;border-radius:10px;border:1px solid rgba(0,220,255,.35);background:linear-gradient(135deg,rgba(0,220,255,.13),rgba(17,40,66,.52));color:#c8f5ff}
.np-control-btn::after{content:'';position:absolute;inset:0;background:linear-gradient(100deg,transparent 30%,rgba(255,255,255,.2) 50%,transparent 70%);opacity:0;transform:translateX(-120%)}
.np-control-btn:hover::after{opacity:.55;animation:np-control-sweep .55s linear}
.np-control-btn.np-prev{border-color:rgba(255,213,140,.45);background:linear-gradient(135deg,rgba(255,213,140,.15),rgba(68,39,12,.5));color:#ffe6ba}
.np-control-btn.np-next{border-color:rgba(140,255,202,.45);background:linear-gradient(135deg,rgba(140,255,202,.16),rgba(9,66,53,.48));color:#c7ffe7}
.np-control-btn.np-refresh{border-color:rgba(255,173,92,.5);background:linear-gradient(135deg,rgba(255,173,92,.2),rgba(85,43,11,.53));color:#ffd9b4}
.np-control-btn.np-print{border-color:rgba(192,167,255,.48);background:linear-gradient(135deg,rgba(192,167,255,.18),rgba(35,22,73,.54));color:#ece0ff}
.np-control-btn.np-close-dock{grid-column:1 / -1;max-width:290px;justify-self:center;border-color:rgba(255,121,121,.58);background:linear-gradient(135deg,rgba(255,121,121,.24),rgba(104,27,27,.62));color:#ffe0e0}
.np-control-btn:disabled{opacity:.45;cursor:not-allowed}
@media (max-width:900px){
  .np-paper{padding:16px 14px 20px}
  .np-grid,.np-hot-grid{grid-template-columns:minmax(0,1fr);gap:14px}
  .np-market-grid{grid-template-columns:minmax(0,1fr)}
  .np-headline{font-size:clamp(1.36rem,6.1vw,2.12rem)}
  .np-subheadline{font-size:.92rem}
  .np-story{font-size:.9rem}
  .np-page{padding:11px 10px 8px}
  .np-toolbar{flex-direction:column;align-items:flex-start}
  .np-corner-close{width:30px;height:30px}
  .np-bottom-bar{grid-template-columns:repeat(2,minmax(0,1fr));width:min(96vw,460px);padding:8px;border-radius:12px;bottom:10px}
  .np-control-btn{padding:9px 10px}
  .np-control-btn.np-close-dock{max-width:none;width:100%}
}
@keyframes np-shimmer{0%{background-position:200% 0}100%{background-position:-120% 0}}
@keyframes np-paper-in{from{opacity:0;transform:translateY(24px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes np-fade-out{from{opacity:1}to{opacity:0}}
@keyframes np-book-turn-next{0%{transform:rotateY(0deg)}45%{transform:rotateY(-7deg)}100%{transform:rotateY(0deg)}}
@keyframes np-book-turn-prev{0%{transform:rotateY(0deg)}45%{transform:rotateY(7deg)}100%{transform:rotateY(0deg)}}
@keyframes np-turn-shadow{0%{opacity:0}40%{opacity:.45}100%{opacity:0}}
@keyframes np-curl-next{0%{opacity:0;transform:translateX(35%) skewY(0deg)}45%{opacity:.62}100%{opacity:0;transform:translateX(-10%) skewY(-4deg)}}
@keyframes np-curl-prev{0%{opacity:0;transform:translateX(-35%) skewY(0deg)}45%{opacity:.62}100%{opacity:0;transform:translateX(10%) skewY(4deg)}}
@keyframes np-control-sweep{0%{transform:translateX(-120%)}100%{transform:translateX(120%)}}
`;

function GitHubNewspaperPortal({ username, profilePayload, getEdition, onClose }) {
  const paperRef = useRef(null);
  const closeTimerRef = useRef(null);
  const turnTimerRef = useRef(null);
  const shareCopiedTimerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [turnDirection, setTurnDirection] = useState("");
  const [lastUpdatedLabel, setLastUpdatedLabel] = useState(() => `LAST UPDATE ${getReadableLocalDate()}`);

  const fallbackEdition = useMemo(
    () => buildNewspaperFallback(profilePayload, username),
    [profilePayload, username],
  );
  const [edition, setEdition] = useState(fallbackEdition);

  const resolvedEdition = useMemo(
    () => normalizeNewspaperPayload(edition, fallbackEdition),
    [edition, fallbackEdition],
  );

  const pages = useMemo(
    () => buildNewspaperPages(resolvedEdition, profilePayload),
    [resolvedEdition, profilePayload],
  );

  const totalPages = Math.max(1, pages.length);
  const boundedPageIndex = clampNumber(activePageIndex, 0, totalPages - 1);
  const activePage = pages[boundedPageIndex] || pages[0] || {
    id: "front-page",
    kind: "front",
    label: "Front Page",
    kicker: "Main Edition",
    title: resolvedEdition.headline,
  };
  const canGoPrev = boundedPageIndex > 0;
  const canGoNext = boundedPageIndex < totalPages - 1;

  const triggerPageTurn = (direction) => {
    if (turnTimerRef.current) {
      clearTimeout(turnTimerRef.current);
      turnTimerRef.current = null;
    }

    setTurnDirection(direction);
    turnTimerRef.current = setTimeout(() => {
      setTurnDirection("");
      turnTimerRef.current = null;
    }, 620);
  };

  const goToPage = (nextPage) => {
    if (isLoading || isRefreshing) return;
    const targetPage = clampNumber(nextPage, 0, totalPages - 1);
    if (targetPage === boundedPageIndex) return;
    triggerPageTurn(targetPage > boundedPageIndex ? "next" : "prev");
    setActivePageIndex(targetPage);
  };

  const handlePrevPage = () => {
    if (!canGoPrev || isLoading || isRefreshing) return;
    goToPage(boundedPageIndex - 1);
  };

  const handleNextPage = () => {
    if (!canGoNext || isLoading || isRefreshing) return;
    goToPage(boundedPageIndex + 1);
  };

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadError("");
    setActivePageIndex(0);

    const run = async () => {
      try {
        const generated = typeof getEdition === "function"
          ? await getEdition(profilePayload, { forceRefresh: false })
          : fallbackEdition;
        if (!cancelled) {
          setEdition(normalizeNewspaperPayload(generated, fallbackEdition));
          setLastUpdatedLabel(`LAST UPDATE ${getReadableLocalDate()}`);
        }
      } catch (error) {
        if (!cancelled) {
          setEdition(fallbackEdition);
          setLoadError(error?.message || "Newspaper generation failed.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [getEdition, profilePayload, fallbackEdition]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        if (closeTimerRef.current) {
          clearTimeout(closeTimerRef.current);
        }
        setIsClosing(true);
        closeTimerRef.current = setTimeout(() => onClose?.(), 180);
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        if (!isLoading && !isRefreshing) {
          goToPage(boundedPageIndex + 1);
        }
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        if (!isLoading && !isRefreshing) {
          goToPage(boundedPageIndex - 1);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      if (turnTimerRef.current) {
        clearTimeout(turnTimerRef.current);
        turnTimerRef.current = null;
      }
      if (shareCopiedTimerRef.current) {
        clearTimeout(shareCopiedTimerRef.current);
        shareCopiedTimerRef.current = null;
      }
    };
  }, [onClose, totalPages, boundedPageIndex, isLoading, isRefreshing]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => {
    if (isClosing) return;
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
    setIsClosing(true);
    closeTimerRef.current = setTimeout(() => onClose?.(), 180);
  };

  const handleRefreshToday = async () => {
    if (isLoading || isRefreshing) return;

    setIsRefreshing(true);
    setLoadError("");

    try {
      const generated = typeof getEdition === "function"
        ? await getEdition(profilePayload, { forceRefresh: true })
        : fallbackEdition;
      const normalized = normalizeNewspaperPayload(generated, fallbackEdition);
      setEdition(normalized);
      setLastUpdatedLabel(`LAST UPDATE ${getReadableLocalDate()}`);
    } catch (error) {
      setLoadError(error?.message || "Daily refresh failed.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDownload = async () => {
    if (!paperRef.current || isDownloading) return;
    setIsDownloading(true);

    try {
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const canvas = await html2canvas(paperRef.current, {
        backgroundColor: "#efe3c8",
        scale: Math.max(2, window.devicePixelRatio || 1),
        useCORS: true,
        allowTaint: false,
        logging: false,
        removeContainer: true,
      });

      const filenameBase = String(username || "developer").replace(/[^a-zA-Z0-9_-]/g, "") || "developer";
      const link = document.createElement("a");
      link.download = `github-newspaper-${filenameBase}-page-${boundedPageIndex + 1}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      // Keep flow resilient if capture fails in restricted browsers.
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    const summary = `${resolvedEdition.masthead} • ${resolvedEdition.editionLabel}\nPAGE ${boundedPageIndex + 1}/${totalPages} — ${activePage.label}\n${activePage.title || resolvedEdition.headline}\n${resolvedEdition.footerNote}`;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(summary);
      }
      setShareCopied(true);
      if (shareCopiedTimerRef.current) {
        clearTimeout(shareCopiedTimerRef.current);
      }
      shareCopiedTimerRef.current = setTimeout(() => {
        setShareCopied(false);
        shareCopiedTimerRef.current = null;
      }, 1500);
    } catch {
      // Ignore clipboard failures.
    }
  };

  const renderPageContent = (page) => {
    if (page.kind === "front") {
      return (
        <section className="np-grid">
          <main className="np-main-column">
            <h2 className="np-headline">{resolvedEdition.headline}</h2>
            <p className="np-subheadline">{resolvedEdition.subheadline}</p>
            <p className="np-story">{resolvedEdition.leadStory}</p>

            <blockquote className="np-quote">"{resolvedEdition.pullQuote}"</blockquote>

            <section className="np-secondary">
              <h3 className="np-secondary-title">{resolvedEdition.secondaryTitle}</h3>
              <p className="np-story">{resolvedEdition.secondaryStory}</p>
            </section>
          </main>

          <aside className="np-sidebar">
            <section className="np-sidebar-card">
              <h4 className="np-sidebar-title">{resolvedEdition.sidebarTitle}</h4>
              <ul className="np-sidebar-list">
                {resolvedEdition.sidebarBullets.map((line, index) => (
                  <li key={`np-line-${index}`}>• {line}</li>
                ))}
              </ul>
            </section>

            <section className="np-sidebar-card">
              <h4 className="np-sidebar-title">{resolvedEdition.editorialTitle}</h4>
              <p className="np-editorial">{resolvedEdition.editorial}</p>
            </section>
          </aside>
        </section>
      );
    }

    if (page.kind === "hot") {
      return (
        <section className="np-hot-grid">
          <main className="np-main-column">
            <h2 className="np-headline">{page.title}</h2>
            <p className="np-subheadline">{page.lead}</p>

            <div className="np-hot-cards">
              {(Array.isArray(page.cards) ? page.cards : []).map((line, index) => (
                <article key={`np-hot-line-${index}`} className="np-hot-card">
                  <span className="np-hot-tag">HOT DESK {String(index + 1).padStart(2, "0")}</span>
                  <p className="np-story">{line}</p>
                </article>
              ))}
            </div>

            <blockquote className="np-quote">"{page.bulletin}"</blockquote>
          </main>

          <aside className="np-sidebar">
            <section className="np-sidebar-card">
              <h4 className="np-sidebar-title">ACTIVITY TALLY</h4>
              <ul className="np-sidebar-list">
                {(Array.isArray(page.sideStats) ? page.sideStats : []).map((line, index) => (
                  <li key={`np-hot-stat-${index}`}>• {line}</li>
                ))}
              </ul>
            </section>

            <section className="np-sidebar-card">
              <h4 className="np-sidebar-title">WIRE NOTE</h4>
              <p className="np-editorial">Signals update as public telemetry changes. Reload the edition for a fresh desk snapshot.</p>
            </section>
          </aside>
        </section>
      );
    }

    if (page.kind === "market") {
      return (
        <section className="np-grid">
          <main className="np-main-column">
            <h2 className="np-headline">{page.title}</h2>
            <p className="np-subheadline">Top repos and language balance reveal where engineering energy is concentrated right now.</p>

            <div className="np-market-grid">
              <section className="np-sidebar-card np-repo-board">
                <h4 className="np-sidebar-title">TOP REPOSITORIES</h4>
                {(Array.isArray(page.repoRows) && page.repoRows.length > 0) ? page.repoRows.map((repo) => (
                  <div key={`np-repo-${repo.id}`} className="np-repo-row">
                    <span className="np-repo-name">{repo.name}</span>
                    <span className="np-repo-meta">{repo.stars.toLocaleString()}★ · {repo.forks.toLocaleString()} forks · {repo.updated}</span>
                  </div>
                )) : (
                  <div className="np-small-note">No repositories available yet.</div>
                )}
              </section>

              <section className="np-sidebar-card np-repo-board">
                <h4 className="np-sidebar-title">LANGUAGE BOARD</h4>
                {(Array.isArray(page.languageRows) && page.languageRows.length > 0) ? page.languageRows.map((entry, index) => (
                  <div key={`np-lang-${entry.lang}-${index}`} className="np-lang-row">
                    <span className="np-lang-name">{entry.lang}</span>
                    <span className="np-lang-meta">{Number(entry.pct || 0).toFixed(1)}%</span>
                  </div>
                )) : (
                  <div className="np-small-note">Language telemetry is currently unavailable.</div>
                )}
              </section>
            </div>
          </main>

          <aside className="np-sidebar">
            <section className="np-sidebar-card">
              <h4 className="np-sidebar-title">MARKET WATCH</h4>
              <ul className="np-sidebar-list">
                {(Array.isArray(page.marketWatch) ? page.marketWatch : []).map((line, index) => (
                  <li key={`np-market-line-${index}`}>• {line}</li>
                ))}
              </ul>
            </section>
          </aside>
        </section>
      );
    }

    return (
      <section className="np-grid">
        <main className="np-main-column">
          <h2 className="np-headline">{page.title}</h2>
          <p className="np-subheadline">Opinion desk blends qualitative signals with long-horizon timeline markers.</p>

          <div className="np-opinion-stack">
            {(Array.isArray(page.opinionDeck) ? page.opinionDeck : []).map((line, index) => (
              <article key={`np-opinion-${index}`} className="np-opinion-card">
                <p className="np-story">{line}</p>
              </article>
            ))}
          </div>

          <blockquote className="np-quote">"{page.quote}"</blockquote>
        </main>

        <aside className="np-sidebar">
          <section className="np-sidebar-card">
            <h4 className="np-sidebar-title">TIMELINE DESK</h4>
            <ol className="np-timeline">
              {(Array.isArray(page.timeline) ? page.timeline : []).map((line, index) => (
                <li key={`np-timeline-${index}`}>{line}</li>
              ))}
            </ol>
          </section>
        </aside>
      </section>
    );
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className={`np-overlay${isClosing ? " np-closing" : ""}`}>
      <style>{NEWSPAPER_PORTAL_STYLES}</style>

      <div className="np-shell">
        <article ref={paperRef} className="np-paper">
          <div className="np-masthead-row">
            <span className="np-edition">{resolvedEdition.editionLabel}</span>
            <span className="np-date">{resolvedEdition.dateLine}</span>
            <button
              className="np-corner-close"
              onClick={handleClose}
              aria-label="Close newspaper"
              title="Close newspaper"
              type="button"
            >
              ×
            </button>
          </div>

          <h1 className="np-masthead">{resolvedEdition.masthead}</h1>
          <div className="np-rule" />
          <div className="np-ticker">{resolvedEdition.ticker}</div>

          {isLoading ? (
            <div className="np-loading-wrap">
              <div className="np-loading-title">THE PRESSES ARE RUNNING...</div>
              <div className="np-skeleton long" />
              <div className="np-skeleton mid" />
              <div className="np-skeleton long" />
              <div className="np-skeleton short" />
              <div className="np-skeleton long" />
              <div className="np-skeleton mid" />
              <div className="np-skeleton long" />
            </div>
          ) : (
            <>
              <div className="np-page-header">
                <span className="np-page-kicker">{activePage.kicker}</span>
                <span className="np-page-count">PAGE {boundedPageIndex + 1} OF {totalPages}</span>
              </div>

              <div className="np-toolbar">
                <span className="np-refresh-stamp">
                  {isRefreshing ? "REFRESHING TODAY'S EDITION..." : lastUpdatedLabel}
                </span>
                <div className="np-toolbar-actions">
                  <button className="gd-btn np-share-btn" onClick={handleShare} disabled={isLoading || isRefreshing}>
                    {shareCopied ? "CLIP COPIED" : "SHARE CLIP"}
                  </button>
                  <button className="gd-btn np-close-btn" onClick={handleClose}>EXIT PRESSROOM</button>
                </div>
              </div>

              <section className={`np-page-window${turnDirection ? ` np-turning np-turn-${turnDirection}` : ""}`}>
                <div className="np-page-track" style={{ transform: `translateX(-${boundedPageIndex * 100}%)` }}>
                  {pages.map((page) => (
                    <section key={page.id} className="np-page" aria-hidden={page.id !== activePage.id}>
                      {renderPageContent(page)}
                    </section>
                  ))}
                </div>
              </section>
            </>
          )}

          {loadError && <div className="np-load-error">{loadError}</div>}
          <div className="np-footer">{resolvedEdition.footerNote}</div>
        </article>
      </div>

      <div className="np-bottom-bar">
        <button className="gd-btn np-control-btn np-prev" onClick={handlePrevPage} disabled={isLoading || isRefreshing || !canGoPrev}>
          ◀ PREV SPREAD
        </button>
        <button className="gd-btn np-control-btn np-refresh" onClick={handleRefreshToday} disabled={isLoading || isRefreshing}>
          {isRefreshing ? "⟳ UPDATING WIRE..." : "⟳ REFRESH TODAY"}
        </button>
        <button className="gd-btn np-control-btn np-print" onClick={handleDownload} disabled={isDownloading || isLoading || isRefreshing}>
          {isDownloading ? "PRINTING PAGE..." : "🖨 PRINT PAGE"}
        </button>
        <button className="gd-btn np-control-btn np-next" onClick={handleNextPage} disabled={isLoading || isRefreshing || !canGoNext}>
          NEXT SPREAD ▶
        </button>
        <button className="gd-btn np-control-btn np-close-dock" onClick={handleClose} type="button">
          ✕ CLOSE NEWSPAPER
        </button>
      </div>
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
  onGenerateNewspaper,
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
  const achievementShareTimerRef = useRef(null);
  const dashboardWakeTimeoutRef = useRef(null);
  const newspaperCacheRef = useRef(NEWSPAPER_AI_CACHE);
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
  const [showTradingCard, setShowTradingCard] = useState(false);
  const [showNewspaper, setShowNewspaper] = useState(false);
  const [showAvatarPreview, setShowAvatarPreview] = useState(false);
  const [showDashboardWake, setShowDashboardWake] = useState(false);
  const [showCommitAnalyzer, setShowCommitAnalyzer] = useState(false);
  const [commitInsight, setCommitInsight] = useState("");
  const [commitInsightLoading, setCommitInsightLoading] = useState(false);
  const [showAllCommitRows, setShowAllCommitRows] = useState(false);
  const [commitFallbackSample, setCommitFallbackSample] = useState(null);
  const [commitFallbackLoading, setCommitFallbackLoading] = useState(false);
  const [achievementFilter, setAchievementFilter] = useState("ALL");
  const [achievementRevealReady, setAchievementRevealReady] = useState(false);
  const [achievementShareCopied, setAchievementShareCopied] = useState(false);
  const [showAchievementVaultPanel, setShowAchievementVaultPanel] = useState(false);

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
  const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");
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

  const [commitData, setCommitData] = useState(() => extractCommitData(events));

  useEffect(() => {
    setCommitData(extractCommitData(events));
  }, [events]);

  const commitMessageCount = Array.isArray(commitData?.messages) ? commitData.messages.length : 0;

  useEffect(() => {
    let cancelled = false;

    if (commitMessageCount > 0) {
      return () => {
        cancelled = true;
      };
    }

    const owner = String(user.login || username || "").trim();
    if (!owner || !Array.isArray(repos) || repos.length === 0) {
      return () => {
        cancelled = true;
      };
    }

    const latestRepo = [...repos]
      .filter((repo) => !repo?.fork && String(repo?.name || "").trim())
      .sort((left, right) => {
        const leftPushed = new Date(left?.pushed_at || left?.updated_at || 0).getTime();
        const rightPushed = new Date(right?.pushed_at || right?.updated_at || 0).getTime();
        return rightPushed - leftPushed;
      })[0];

    const repoName = String(latestRepo?.name || "").trim();
    if (!repoName) {
      return () => {
        cancelled = true;
      };
    }

    fetchGithubJson(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repoName)}/commits?per_page=10`)
      .then((commitPayload) => {
        if (cancelled) return;
        const fallbackMessages = Array.isArray(commitPayload)
          ? commitPayload
              .map((commit) => {
                const message = normalizeCommitMessage(String(commit?.commit?.message || "").split("\n")[0]);
                if (!message) return null;

                return {
                  message,
                  repo: repoName,
                  timestamp: String(commit?.commit?.author?.date || ""),
                  sha: String(commit?.sha || "").slice(0, 7) || "???????",
                };
              })
              .filter(Boolean)
          : [];

        if (fallbackMessages.length === 0 || cancelled) return;

        const fallbackHours = fallbackMessages
          .map((entry) => {
            const timestamp = String(entry?.timestamp || "");
            if (!timestamp) return null;
            const hour = new Date(timestamp).getUTCHours();
            return Number.isInteger(hour) && hour >= 0 && hour <= 23 ? hour : null;
          })
          .filter((hour) => hour !== null);

        setCommitData({
          messages: fallbackMessages,
          messageTexts: fallbackMessages.map((entry) => entry.message),
          hours: fallbackHours,
          repoActivity: { [repoName]: fallbackMessages.length },
        });
      })
      .catch(() => {
        // Keep current commit state if fallback fetch fails.
      });

    return () => {
      cancelled = true;
    };
  }, [commitMessageCount, repos, user.login, username]);

  const commitRows = useMemo(() => {
    const fromEvents = Array.isArray(commitData?.messages) ? commitData.messages : [];
    const fromGithub = Array.isArray(github?.recent_commit_messages)
      ? github.recent_commit_messages.map((rawMessage, index) => ({
          message: normalizeCommitMessage(rawMessage),
          repo: "recent-feed",
          timestamp: "",
          sha: `gh${index + 1}`,
        }))
      : [];

    const mergedEntries = [...fromEvents, ...fromGithub]
      .map((entry) => ({
        message: normalizeCommitMessage(entry?.message),
        repo: normalizeCommitMessage(entry?.repo) || "unknown",
        timestamp: String(entry?.timestamp || ""),
        sha: String(entry?.sha || "").slice(0, 7) || "???????",
      }))
      .filter((entry) => entry.message);

    const uniqueEntries = [];
    const seen = new Set();
    for (const entry of mergedEntries) {
      const key = `${entry.repo.toLowerCase()}::${entry.message.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      uniqueEntries.push(entry);
      if (uniqueEntries.length >= 45) break;
    }

    return uniqueEntries.map((entry) => {
      const result = gradeCommitMessage(entry.message);
      const palette = COMMIT_GRADE_META[result.grade] || COMMIT_GRADE_META.D;

      return {
        ...entry,
        ...result,
        preview: truncateText(entry.message, 70),
        badgeColor: palette.badgeColor,
        badgeBg: palette.badgeBg,
        badgeBorder: palette.badgeBorder,
        rowTint: palette.rowTint,
      };
    });
  }, [commitData?.messages, github?.recent_commit_messages]);

  const burnoutInput = useMemo(() => {
    const hourDistribution = Array(24).fill(0);
    const commitHours = Array.isArray(commitData?.hours) ? commitData.hours : [];
    commitHours.forEach((hour) => {
      if (Number.isInteger(hour) && hour >= 0 && hour <= 23) {
        hourDistribution[hour] += 1;
      }
    });

    const pushEvents = Array.isArray(events)
      ? events.filter((event) => event?.type === "PushEvent" && event?.created_at)
      : [];
    const weekendPushes = pushEvents.filter((event) => {
      const dt = new Date(event.created_at);
      if (Number.isNaN(dt.getTime())) return false;
      const day = dt.getUTCDay();
      return day === 0 || day === 6;
    }).length;

    const weekendRatio = pushEvents.length > 0 ? (weekendPushes / pushEvents.length) : 0;
    const avgCommitHour = commitHours.length > 0
      ? (commitHours.reduce((sum, hour) => sum + hour, 0) / commitHours.length)
      : 14;

    return {
      commitHourDist: hourDistribution,
      recentCommits: Number(recentCommits || 0),
      totalRepos: Number(user?.public_repos ?? repos?.length ?? 0),
      commitMessages: commitRows.map((row) => row.message),
      accountAge: Number(accountAgeYears || 0),
      weekendRatio,
      topLangs: Array.isArray(langs) ? langs : [],
      avgCommitHour,
      followers: Number(user?.followers || 0),
      totalStars: Number(totalStars || 0),
    };
  }, [
    commitData?.hours,
    events,
    recentCommits,
    user?.public_repos,
    repos?.length,
    commitRows,
    accountAgeYears,
    langs,
    user?.followers,
    totalStars,
  ]);

  const burnoutReport = useMemo(() => (
    calculateBurnoutIndex(burnoutInput)
  ), [burnoutInput]);

  const commitMessageInputs = useMemo(
    () => commitRows.map((row) => row.message).filter(Boolean).slice(0, 20),
    [commitRows],
  );

  const commitScorePercent = useMemo(
    () => calcOverallQuality(commitRows),
    [commitRows],
  );

  const commitTier = useMemo(
    () => getCommitQualityTier(commitScorePercent),
    [commitScorePercent],
  );

  const commitRowsToRender = useMemo(
    () => (showAllCommitRows ? commitRows : commitRows.slice(0, COMMIT_RENDER_LIMIT)),
    [commitRows, showAllCommitRows],
  );

  const hiddenCommitRowCount = Math.max(0, commitRows.length - COMMIT_RENDER_LIMIT);

  const commitBestWorst = useMemo(() => {
    if (commitRows.length < 2) {
      return { best: null, worst: null, hasContrast: false };
    }

    const sorted = [...commitRows].sort((left, right) => right.points - left.points);
    const best = sorted[0] || null;
    const worst = sorted[sorted.length - 1] || null;
    const hasContrast = Boolean(best && worst && best.points !== worst.points);

    return { best, worst, hasContrast };
  }, [commitRows]);

  const commitInsightKey = useMemo(() => {
    const identity = String(user.login || username || "unknown").toLowerCase();
    const signature = commitMessageInputs.map((message) => message.toLowerCase()).join("|");
    return `${identity}::${signature}`;
  }, [commitMessageInputs, user.login, username]);

  const achievementData = useMemo(() => {
    const safeHourDist = Array.isArray(github?.commit_hour_distribution) && github.commit_hour_distribution.length === 24
      ? github.commit_hour_distribution.map((entry) => Number(entry || 0))
      : Array.from({ length: 24 }, () => 0);

    const weekendCommits = Number(github?.weekend_vs_weekday?.weekend_commits || 0);
    const weekdayCommits = Number(github?.weekend_vs_weekday?.weekday_commits || 0);
    const weekendRatio = (weekendCommits + weekdayCommits) > 0
      ? (weekendCommits / (weekendCommits + weekdayCommits))
      : 0;

    const totalContributions = Array.isArray(contributions)
      ? contributions.reduce((sum, item) => sum + Number(item?.count || 0), 0)
      : 0;

    const normalizedRepos = Array.isArray(repos)
      ? repos.map((repo) => ({
          ...repo,
          fork: Boolean(repo?.fork ?? repo?.is_fork ?? false),
        }))
      : [];

    const totalRepos = Math.max(
      Number(user?.public_repos || 0),
      normalizedRepos.length,
    );

    return {
      username: String(user?.login || username || "").toLowerCase(),
      createdAt: user?.created_at || "",
      accountAge: accountAgeYears,
      avgCommitHour: Number.isFinite(Number(github?.avg_commit_hour)) ? Number(github.avg_commit_hour) : -1,
      commitHourDist: safeHourDist,
      topLangs: Array.isArray(langs) ? langs : [],
      totalStars: Number(totalStars || 0),
      totalRepos,
      followers: Number(user?.followers || 0),
      following: Number(user?.following || 0),
      bio: String(user?.bio || "").trim(),
      location: String(user?.location || "").trim(),
      blog: String(user?.blog || "").trim(),
      repos: normalizedRepos,
      weekendRatio,
      commitQualityScore: Number(commitScorePercent || 0),
      totalContributions,
      devScore: Number(devScore || 0),
    };
  }, [
    github?.avg_commit_hour,
    github?.commit_hour_distribution,
    github?.weekend_vs_weekday?.weekend_commits,
    github?.weekend_vs_weekday?.weekday_commits,
    contributions,
    repos,
    user?.public_repos,
    user?.login,
    user?.created_at,
    user?.followers,
    user?.following,
    user?.bio,
    user?.location,
    user?.blog,
    username,
    accountAgeYears,
    langs,
    totalStars,
    commitScorePercent,
    devScore,
  ]);

  const achievementRows = useMemo(() => {
    return ACHIEVEMENTS.map((achievement) => {
      let unlocked = false;
      try {
        unlocked = Boolean(achievement.condition?.(achievementData));
      } catch {
        unlocked = false;
      }

      return {
        ...achievement,
        unlocked,
      };
    });
  }, [achievementData]);

  const unlockedAchievementCount = useMemo(
    () => achievementRows.filter((achievement) => achievement.unlocked).length,
    [achievementRows],
  );

  const rarityUnlockedCounts = useMemo(() => {
    const counts = {
      LEGENDARY: 0,
      EPIC: 0,
      RARE: 0,
      UNCOMMON: 0,
      COMMON: 0,
    };

    for (const achievement of achievementRows) {
      if (!achievement.unlocked) continue;
      const rarity = String(achievement.rarity || "COMMON").toUpperCase();
      if (Object.prototype.hasOwnProperty.call(counts, rarity)) {
        counts[rarity] += 1;
      }
    }

    return counts;
  }, [achievementRows]);

  const unlockedAchievements = useMemo(
    () => achievementRows.filter((achievement) => achievement.unlocked),
    [achievementRows],
  );

  const vaultPanelAchievements = useMemo(() => {
    if (achievementFilter === "ALL") return achievementRows;
    return achievementRows.filter((achievement) => achievement.rarity === achievementFilter);
  }, [achievementRows, achievementFilter]);

  const unlockedPreviewSequenceById = useMemo(() => {
    const lookup = new Map();
    unlockedAchievements.forEach((achievement, index) => {
      lookup.set(achievement.id, index);
    });
    return lookup;
  }, [unlockedAchievements]);

  const vaultPanelUnlockedSequenceById = useMemo(() => {
    const lookup = new Map();
    let sequence = 0;
    for (const achievement of vaultPanelAchievements) {
      if (!achievement.unlocked) continue;
      lookup.set(achievement.id, sequence);
      sequence += 1;
    }
    return lookup;
  }, [vaultPanelAchievements]);

  const rarestUnlockedAchievements = useMemo(() => {
    return achievementRows
      .filter((achievement) => achievement.unlocked)
      .sort((left, right) => {
        const leftRank = ACHIEVEMENT_RARITY_META[left.rarity]?.rank || 0;
        const rightRank = ACHIEVEMENT_RARITY_META[right.rarity]?.rank || 0;
        if (leftRank !== rightRank) return rightRank - leftRank;
        return left.name.localeCompare(right.name);
      })
      .slice(0, 3);
  }, [achievementRows]);

  const achievementProgress = ACHIEVEMENTS.length > 0
    ? (unlockedAchievementCount / ACHIEVEMENTS.length)
    : 0;
  const achievementRingRadius = 14;
  const achievementRingCircumference = 2 * Math.PI * achievementRingRadius;
  const achievementRingOffset = achievementRingCircumference * (1 - achievementProgress);

  const newspaperPayload = useMemo(() => {
    const rarest = rarestUnlockedAchievements.map((achievement) => ({
      id: achievement.id,
      name: achievement.name,
      rarity: achievement.rarity,
      description: achievement.description,
    }));

    const unlocked = unlockedAchievements.map((achievement) => ({
      id: achievement.id,
      name: achievement.name,
      rarity: achievement.rarity,
      description: achievement.description,
    }));

    return {
      username: user.login || username || "unknown",
      github,
      aiData,
      devScore,
      langs,
      achievements: {
        unlockedCount: unlockedAchievementCount,
        totalCount: ACHIEVEMENTS.length,
        rarestUnlocked: rarest,
        unlockedCards: unlocked,
      },
    };
  }, [
    user.login,
    username,
    github,
    aiData,
    devScore,
    langs,
    unlockedAchievementCount,
    rarestUnlockedAchievements,
    unlockedAchievements,
  ]);

  async function getNewspaperEdition(requestedPayload = newspaperPayload, options = {}) {
    const safeRequestedPayload = requestedPayload && typeof requestedPayload === "object"
      ? requestedPayload
      : newspaperPayload;
    const forceRefresh = Boolean(options?.forceRefresh);
    const cacheKey = String(user.login || username || "unknown").toLowerCase();
    const todayKey = getLocalDayKey();
    const fallbackEdition = buildNewspaperFallback(safeRequestedPayload, user.login || username || "developer");

    const cachedRaw = newspaperCacheRef.current.get(cacheKey);
    const cachedEntry = cachedRaw && typeof cachedRaw === "object" && cachedRaw.edition
      ? cachedRaw
      : null;

    if (!forceRefresh && cachedEntry?.dayKey === todayKey) {
      return cachedEntry.edition;
    }

    if (typeof onGenerateNewspaper !== "function") {
      const normalizedFallback = normalizeNewspaperPayload(fallbackEdition, fallbackEdition);
      newspaperCacheRef.current.set(cacheKey, {
        dayKey: todayKey,
        fetchedAt: Date.now(),
        edition: normalizedFallback,
      });
      return normalizedFallback;
    }

    try {
      const generated = await onGenerateNewspaper(safeRequestedPayload);
      const normalized = normalizeNewspaperPayload(generated, fallbackEdition);
      newspaperCacheRef.current.set(cacheKey, {
        dayKey: todayKey,
        fetchedAt: Date.now(),
        edition: normalized,
      });
      return normalized;
    } catch (error) {
      if (cachedEntry?.edition) {
        return cachedEntry.edition;
      }
      throw error;
    }
  }

  const triggerDashboardWake = () => {
    setShowDashboardWake(true);
    if (dashboardWakeTimeoutRef.current) {
      clearTimeout(dashboardWakeTimeoutRef.current);
    }
    dashboardWakeTimeoutRef.current = setTimeout(() => setShowDashboardWake(false), 220);
  };

  useEffect(() => {
    setAchievementRevealReady(false);
    setShowAchievementVaultPanel(false);
    setAchievementFilter("ALL");
    const raf = requestAnimationFrame(() => setAchievementRevealReady(true));
    return () => cancelAnimationFrame(raf);
  }, [user?.login]);

  useEffect(() => {
    if (!showAchievementVaultPanel) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;
      setShowAchievementVaultPanel(false);
      triggerDashboardWake();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [showAchievementVaultPanel]);

  const handleOpenAchievementVault = () => {
    setShowAchievementVaultPanel(true);
  };

  const handleCloseAchievementVault = () => {
    setShowAchievementVaultPanel(false);
    triggerDashboardWake();
  };

  const handleCloseTimeMachine = () => {
    setShowTimeMachine(false);
    triggerDashboardWake();
  };

  const handleCloseGitMap = () => {
    setShowGitMap(false);
    triggerDashboardWake();
  };

  const handleCloseTradingCard = () => {
    setShowTradingCard(false);
    triggerDashboardWake();
  };

  const handleCloseNewspaper = () => {
    setShowNewspaper(false);
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
        achievementShareTimerRef,
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

  useEffect(() => {
    if (!showAvatarPreview) return;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setShowAvatarPreview(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showAvatarPreview]);

  useEffect(() => {
    let cancelled = false;
    const fallbackInsight = fallbackCommitLinguisticsInsight(user.login || username || "developer", commitMessageInputs);

    if (commitMessageInputs.length === 0) {
      setCommitInsightLoading(false);
      setCommitInsight(fallbackInsight);
      return () => {
        cancelled = true;
      };
    }

    const cached = COMMIT_LINGUISTICS_CACHE.get(commitInsightKey);
    if (cached) {
      setCommitInsightLoading(false);
      setCommitInsight(cached);
      return () => {
        cancelled = true;
      };
    }

    const abortController = new AbortController();
    setCommitInsightLoading(true);

    const run = async () => {
      try {
        const response = await fetch(`${API_URL}/api/commit-linguistics-insight`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            username: user.login || username || "developer",
            commitMessages: commitMessageInputs,
          }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`Commit linguistics API error (${response.status})`);
        }

        const payload = await response.json();
        const insightText = String(payload?.insight || "").trim() || fallbackInsight;
        COMMIT_LINGUISTICS_CACHE.set(commitInsightKey, insightText);
        if (!cancelled) {
          setCommitInsight(insightText);
          setCommitInsightLoading(false);
        }
      } catch (error) {
        if (error?.name === "AbortError") return;
        if (!cancelled) {
          setCommitInsight(fallbackInsight);
          setCommitInsightLoading(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, [API_URL, commitInsightKey, commitMessageInputs, user.login, username]);

  useEffect(() => {
    if (!showCommitAnalyzer) {
      setShowAllCommitRows(false);
    }
  }, [showCommitAnalyzer]);

  useEffect(() => {
    let cancelled = false;

    if (!showCommitAnalyzer || commitRows.length > 0) {
      setCommitFallbackLoading(false);
      setCommitFallbackSample(null);
      return () => {
        cancelled = true;
      };
    }

    const login = String(user.login || username || "").trim();
    if (!login) {
      setCommitFallbackLoading(false);
      setCommitFallbackSample(null);
      return () => {
        cancelled = true;
      };
    }

    setCommitFallbackLoading(true);
    fetchReadmeFallbackCommitSample(login, repos)
      .then((sample) => {
        if (cancelled) return;
        setCommitFallbackSample(sample || null);
        setCommitFallbackLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setCommitFallbackSample(null);
        setCommitFallbackLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [showCommitAnalyzer, commitRows.length, repos, user.login, username]);

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

  async function handleShareAchievements() {
    const topThree = rarestUnlockedAchievements;
    const lines = topThree.length > 0
      ? topThree.map((achievement) => `   ${achievement.icon} ${achievement.name} — ${achievement.description}`)
      : ["   No achievements unlocked yet. Start your GitHub arc."];

    const shareText = `${user.login}'s rarest GitDNA achievements:\n${lines.join("\n")}\n\nWhat's your vault? gitdna.vercel.app #GitDNA`;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText);
      }
      setAchievementShareCopied(true);
      if (achievementShareTimerRef.current) {
        clearTimeout(achievementShareTimerRef.current);
      }
      achievementShareTimerRef.current = setTimeout(() => setAchievementShareCopied(false), 1800);
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
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
          <button
            className="gd-btn"
            onClick={onReset}
            title="Return to scanner and analyze another profile"
            style={{
              padding: "8px 14px",
              fontSize: "0.64rem",
              letterSpacing: "0.1em",
            }}
          >
            ◀ NEW SCAN
          </button>
        </div>

        <div ref={shareCardRef} style={{ padding: 2, borderRadius: 8 }}>
          {/* HEADER */}
          <div className={`gd-card gd-header-card gd-enter-scan ${tierMeta.headerClass}${founderActive ? " gd-founder-header" : ""}`} style={{ padding: "20px 22px", marginBottom: 16, display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", ...cardEntranceStyle(0) }}>
            <div className="scan-overlay" />
            {founderActive && <div className="gd-founder-header-shimmer" />}
            <div
              style={{ position: "relative", flexShrink: 0, cursor: user.avatar_url ? "zoom-in" : "default" }}
              onClick={() => {
                if (!user.avatar_url) return;
                setShowAvatarPreview(true);
              }}
              onKeyDown={(event) => {
                if (!user.avatar_url) return;
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setShowAvatarPreview(true);
                }
              }}
              role={user.avatar_url ? "button" : undefined}
              tabIndex={user.avatar_url ? 0 : -1}
              title={user.avatar_url ? "View profile picture" : ""}
            >
              <div style={{ position: "absolute", inset: -4, borderRadius: "50%", border: "1.5px solid rgba(0,220,255,0.3)", animation: "ring-spin 8s linear infinite", pointerEvents: "none" }} />
              <div style={{ position: "absolute", inset: -8, borderRadius: "50%", border: "1px solid rgba(179,71,234,0.2)", animation: "ring-spin 12s linear infinite reverse", pointerEvents: "none" }} />
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={`${user.login} profile`} style={{ width: 72, height: 72, borderRadius: "50%", border: "2px solid rgba(0,220,255,0.35)", display: "block" }} />
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

          <div className="gd-card gd-enter-scan" style={{ padding: "11px 14px", marginBottom: 12, ...cardEntranceStyle(1) }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontFamily: "Share Tech Mono,monospace", fontSize: "0.62rem", letterSpacing: "0.14em", color: "rgba(0,220,255,0.52)" }}>
                COLLECTIBLE LAB + PRESSROOM
              </span>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  className="gd-btn"
                  onClick={() => setShowTradingCard(true)}
                  style={{ padding: "8px 14px", fontSize: "0.64rem" }}
                >
                  🃏 GENERATE CARD
                </button>
                <button
                  className="gd-btn"
                  onClick={() => setShowNewspaper(true)}
                  style={{ padding: "8px 14px", fontSize: "0.64rem" }}
                >
                  📰 GENERATE NEWSPAPER
                </button>
              </div>
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

          <div className="gd-card gd-enter-scan" style={{ padding: "18px 18px", marginBottom: 12, ...cardEntranceStyle(6) }}>
            <div className="gd-section-label" style={{ marginBottom: 12 }}>COGNITIVE LOAD ANALYSIS</div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "stretch" }}>
              <div style={{ flex: "0 1 230px", display: "flex", alignItems: "center", justifyContent: "center", minWidth: 190 }}>
                <BurnoutGauge
                  score={burnoutReport.score}
                  tierLabel={burnoutReport.tier}
                  tierColor={burnoutReport.color}
                />
              </div>

              <div style={{ flex: "1 1 360px", minWidth: 240 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                  {(Array.isArray(burnoutReport.signals) ? burnoutReport.signals : []).map((signal, index) => {
                    const isRisk = signal?.type === "risk";
                    return (
                      <div
                        key={`burnout-signal-${index}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "8px 10px",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderLeft: `4px solid ${isRisk ? "#ffb300" : "#39ff14"}`,
                          background: isRisk ? "rgba(32,12,8,0.62)" : "rgba(8,26,10,0.62)",
                          borderRadius: 8,
                          fontSize: "0.82rem",
                          color: isRisk ? "rgba(255,204,153,0.94)" : "rgba(180,255,175,0.94)",
                          lineHeight: 1.45,
                        }}
                      >
                        <span style={{ fontSize: "0.9rem", lineHeight: 1 }}>{isRisk ? "⚠" : "✓"}</span>
                        <span>{signal?.text}</span>
                      </div>
                    );
                  })}
                </div>

                <div style={{
                  border: "1px solid rgba(0,220,255,0.28)",
                  borderRadius: 8,
                  background: "rgba(6,16,30,0.72)",
                  padding: "10px 12px",
                  fontSize: "0.82rem",
                  lineHeight: 1.6,
                  color: "rgba(208,239,255,0.88)",
                }}>
                  {burnoutReport.recommendation}
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: -4, marginBottom: 12, fontFamily: "Share Tech Mono,monospace", fontSize: "0.52rem", letterSpacing: "0.08em", color: "rgba(200,232,255,0.38)" }}>
            This is pattern analysis, not medical advice. Data based on public GitHub activity only.
          </div>

          <div className="gd-card gd-enter-scan" style={{ padding: "14px 16px", marginBottom: 12, ...cardEntranceStyle(7) }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <div className="gd-section-label" style={{ marginBottom: 0 }}>COMMIT QUALITY ANALYZER</div>
              <button
                className="gd-btn gd-commit-toggle"
                onClick={() => setShowCommitAnalyzer((prev) => !prev)}
              >
                {showCommitAnalyzer ? "COLLAPSE" : "EXPAND"}
              </button>
            </div>

            {showCommitAnalyzer && (
              <div style={{ marginTop: 12 }}>
                {commitRows.length > 0 ? (
                  <div className="gd-commit-score-pill" style={{ marginBottom: 10 }}>
                    <span style={{ fontFamily: "Share Tech Mono,monospace", fontSize: "0.58rem", letterSpacing: "0.12em", color: "rgba(0,220,255,0.6)" }}>
                      OVERALL QUALITY
                    </span>
                    <span className="orb" style={{ fontSize: "1.1rem", color: "#e9fbff", letterSpacing: "0.05em" }}>
                      {commitScorePercent}%
                    </span>
                    <span
                      className="gd-commit-tier"
                      style={{
                        color: commitTier.color,
                        borderColor: commitTier.color,
                        background: `${commitTier.color}22`,
                      }}
                    >
                      {commitTier.label}
                    </span>
                  </div>
                ) : (
                  <div style={{ marginBottom: 10, border: "1px solid rgba(255,157,157,0.35)", borderRadius: 8, background: "rgba(38,10,10,0.58)", padding: "10px 12px" }}>
                    <div style={{ fontFamily: "Share Tech Mono,monospace", fontSize: "0.58rem", letterSpacing: "0.12em", color: "rgba(255,171,171,0.88)", marginBottom: 6 }}>
                      INSUFFICIENT EVENT DATA
                    </div>
                    <div style={{ fontSize: "0.8rem", lineHeight: 1.5, color: "rgba(255,224,224,0.82)" }}>
                      GitHub Events API returned too little commit activity to calculate a reliable quality score. No score is shown until enough commit messages are available.
                    </div>

                    {commitFallbackLoading && (
                      <div style={{ marginTop: 8, fontSize: "0.78rem", color: "rgba(200,232,255,0.78)" }}>
                        Checking latest README commit as backup sample...
                      </div>
                    )}

                    {!commitFallbackLoading && commitFallbackSample?.message && (
                      <div style={{ marginTop: 8, border: "1px solid rgba(0,220,255,0.26)", borderRadius: 8, background: "rgba(6,16,30,0.72)", padding: "8px 10px" }}>
                        <div style={{ fontFamily: "Share Tech Mono,monospace", fontSize: "0.55rem", letterSpacing: "0.11em", color: "rgba(0,220,255,0.66)", marginBottom: 5 }}>
                          README BACKUP SAMPLE
                        </div>
                        <div style={{ fontSize: "0.76rem", color: "rgba(190,230,255,0.72)", marginBottom: 4 }}>
                          {commitFallbackSample.repo} • {commitFallbackSample.sha}
                        </div>
                        <div style={{ fontSize: "0.82rem", color: "rgba(220,241,255,0.9)", lineHeight: 1.45 }}>
                          {commitFallbackSample.message}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div style={{ fontFamily: "Share Tech Mono,monospace", fontSize: "0.6rem", letterSpacing: "0.14em", color: "rgba(0,220,255,0.5)", marginBottom: 8 }}>
                  COMMIT LINGUISTICS REPORT
                </div>

                <div className="gd-commit-rows">
                  {commitRows.length > 0 ? commitRowsToRender.map((row, index) => (
                    <div
                      key={`commit-quality-${row.repo}-${row.sha}-${index}`}
                      className="gd-commit-row"
                      style={{ borderColor: row.badgeBorder, background: row.rowTint }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 92 }}>
                        <span
                          className="gd-commit-grade"
                          style={{
                            color: row.badgeColor,
                            borderColor: row.badgeBorder,
                            background: row.badgeBg,
                          }}
                        >
                          {row.grade}
                        </span>
                        <span style={{ fontFamily: "Share Tech Mono,monospace", fontSize: "0.56rem", color: "rgba(200,232,255,0.65)", letterSpacing: "0.08em" }}>
                          {row.points}/10
                        </span>
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "Share Tech Mono,monospace", fontSize: "0.56rem", color: "rgba(0,220,255,0.62)", letterSpacing: "0.08em", marginBottom: 3 }}>
                          {row.repo} • {row.sha}
                        </div>
                        <div style={{ fontSize: "0.81rem", color: "rgba(220,241,255,0.9)", lineHeight: 1.45 }}>
                          {row.preview}
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div style={{ border: "1px solid rgba(0,220,255,0.2)", borderRadius: 8, padding: "10px 11px", color: "rgba(200,232,255,0.65)", fontSize: "0.8rem" }}>
                      No commit rows available yet.
                    </div>
                  )}
                </div>

                {hiddenCommitRowCount > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <button
                      className="gd-btn"
                      onClick={() => setShowAllCommitRows((prev) => !prev)}
                    >
                      {showAllCommitRows ? "SHOW LESS" : `SHOW ALL ${commitRows.length}`}
                    </button>
                  </div>
                )}

                {commitBestWorst.hasContrast && (
                  <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8 }}>
                    <div style={{ border: "1px solid rgba(57,255,20,0.3)", borderRadius: 8, background: "rgba(8,26,10,0.62)", padding: "9px 10px" }}>
                      <div style={{ fontFamily: "Share Tech Mono,monospace", fontSize: "0.54rem", letterSpacing: "0.1em", color: "rgba(177,255,170,0.82)", marginBottom: 4 }}>
                        BEST COMMIT
                      </div>
                      <div style={{ fontSize: "0.76rem", color: "rgba(177,255,170,0.85)", marginBottom: 3 }}>
                        {commitBestWorst.best.grade} • {commitBestWorst.best.points}/10 • {commitBestWorst.best.repo}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "rgba(225,255,222,0.92)", lineHeight: 1.4 }}>
                        {commitBestWorst.best.preview}
                      </div>
                    </div>

                    <div style={{ border: "1px solid rgba(255,122,0,0.35)", borderRadius: 8, background: "rgba(35,14,8,0.66)", padding: "9px 10px" }}>
                      <div style={{ fontFamily: "Share Tech Mono,monospace", fontSize: "0.54rem", letterSpacing: "0.1em", color: "rgba(255,197,160,0.85)", marginBottom: 4 }}>
                        WORST COMMIT
                      </div>
                      <div style={{ fontSize: "0.76rem", color: "rgba(255,197,160,0.84)", marginBottom: 3 }}>
                        {commitBestWorst.worst.grade} • {commitBestWorst.worst.points}/10 • {commitBestWorst.worst.repo}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "rgba(255,228,210,0.92)", lineHeight: 1.4 }}>
                        {commitBestWorst.worst.preview}
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ marginTop: 10, border: "1px solid rgba(179,71,234,0.3)", borderRadius: 8, background: "rgba(15,7,26,0.7)", padding: "10px 12px" }}>
                  <div style={{ fontFamily: "Share Tech Mono,monospace", fontSize: "0.58rem", letterSpacing: "0.12em", color: "rgba(179,71,234,0.72)", marginBottom: 6 }}>
                    WHAT YOUR COMMITS SAY ABOUT YOU
                  </div>
                  <p style={{ margin: 0, fontSize: "0.82rem", color: "rgba(227,235,255,0.86)", lineHeight: 1.58 }}>
                    {commitInsightLoading ? "Reading commit language patterns..." : commitInsight}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="gd-card gd-enter-scan" style={{ padding: "18px 18px", marginBottom: 12, ...cardEntranceStyle(7) }}>
          <div className="gd-section-label">CONTRIBUTION GENOME — LAST 52 WEEKS</div>
          <ContributionHeatmap contributions={contributions} />
        </div>

        <div className="gd-card gd-enter-scan" style={{ padding: "18px 18px", marginBottom: 12, ...cardEntranceStyle(7) }}>
          <div className="gd-achievement-vault-header">
            <div>
              <div className="gd-section-label" style={{ marginBottom: 6 }}>// ACHIEVEMENT VAULT</div>
              <div className="gd-achievement-vault-title">Xbox/Steam style progression for your real GitHub career.</div>
            </div>

            <div className="gd-achievement-progress-wrap">
              <div className="gd-achievement-progress-ring" aria-hidden="true">
                <svg width="40" height="40" viewBox="0 0 40 40">
                  <circle cx="20" cy="20" r={achievementRingRadius} fill="none" stroke="rgba(0,220,255,0.12)" strokeWidth="4" />
                  <circle
                    cx="20"
                    cy="20"
                    r={achievementRingRadius}
                    fill="none"
                    stroke="#00dcff"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={achievementRingCircumference}
                    strokeDashoffset={achievementRingOffset}
                    style={{ filter: "drop-shadow(0 0 6px rgba(0,220,255,0.7))" }}
                  />
                </svg>
                <span className="gd-achievement-progress-value">{Math.round(achievementProgress * 100)}%</span>
              </div>

              <div className="gd-achievement-progress-text">
                {unlockedAchievementCount}/{ACHIEVEMENTS.length} UNLOCKED
              </div>
            </div>
          </div>

          <div className="gd-achievement-summary">
            {ACHIEVEMENT_RARITY_ORDER.map((rarity) => (
              <div key={`achievement-summary-${rarity}`} className="gd-achievement-summary-item">
                <span
                  className="gd-achievement-summary-dot"
                  style={{ color: ACHIEVEMENT_RARITY_COLORS[rarity], background: ACHIEVEMENT_RARITY_COLORS[rarity] }}
                />
                <span>{rarityUnlockedCounts[rarity]} {rarity}</span>
              </div>
            ))}
          </div>

          <div className="gd-achievement-compact-label">UNLOCKED NOW</div>

          {unlockedAchievements.length > 0 ? (
            <div className="gd-achievement-grid gd-achievement-grid--compact">
              {unlockedAchievements.map((achievement) => {
                const rarityColor = achievement.rarityColor;
                const unlockedOrder = unlockedPreviewSequenceById.get(achievement.id) || 0;
                const isLegendaryUnlocked = achievement.rarity === "LEGENDARY";
                const isCommonUnlocked = achievement.rarity === "COMMON";
                const unlockedBorder = isCommonUnlocked
                  ? "rgba(178,208,245,0.62)"
                  : rgbaWithAlpha(rarityColor, 0.4);
                const unlockedGlow = isCommonUnlocked
                  ? "rgba(178,208,245,0.22)"
                  : rgbaWithAlpha(rarityColor, 0.15);

                return (
                  <article
                    key={achievement.id}
                    className={[
                      "gd-achievement-card",
                      "gd-achievement-card--unlocked",
                      achievementRevealReady ? "gd-achievement-card--revealed" : "",
                      isLegendaryUnlocked ? "gd-achievement-card--legendary-unlocked" : "",
                    ].filter(Boolean).join(" ")}
                    style={{
                      "--ach-color": rarityColor,
                      "--ach-divider": rgbaWithAlpha(rarityColor, 0.15),
                      "--ach-pill-bg": rgbaWithAlpha(rarityColor, 0.12),
                      "--ach-delay": `${unlockedOrder * 60}ms`,
                      "--ach-legendary-delay": isLegendaryUnlocked ? "300ms" : "0ms",
                      border: `1px solid ${unlockedBorder}`,
                      boxShadow: `0 0 12px ${unlockedGlow}`,
                    }}
                    title={achievement.unlockedText}
                  >
                    <span className="gd-achievement-pip" />
                    <div className="gd-achievement-icon">{achievement.icon}</div>
                    <div className="gd-achievement-name">{achievement.name}</div>
                    <div className="gd-achievement-desc">{achievement.description}</div>
                    <div className="gd-achievement-flavor">{achievement.unlockedText}</div>
                    <div className="gd-achievement-rarity-pill">{achievement.rarity}</div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="gd-achievement-empty">
              No achievements unlocked yet. Start scanning repos and your first cards will light up here.
            </div>
          )}

          <div className="gd-achievement-actions">
            <button
              className="gd-btn gd-achievement-vault-open-btn"
              onClick={handleOpenAchievementVault}
              style={{ padding: "8px 14px", fontSize: "0.66rem" }}
            >
              ⬢ OPEN FULL VAULT
            </button>
            <button className="gd-btn" onClick={handleShareAchievements} style={{ padding: "8px 14px", fontSize: "0.66rem" }}>
              ↗ SHARE ACHIEVEMENTS
            </button>
            {achievementShareCopied && <span className="gd-badge gd-badge-green">VAULT COPIED</span>}
          </div>

          {showAchievementVaultPanel && (
            <div className="gd-achievement-vault-overlay" onClick={handleCloseAchievementVault}>
              <div
                className="gd-achievement-vault-shell"
                role="dialog"
                aria-modal="true"
                aria-label="Full achievement vault"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  className="gd-achievement-vault-close-icon"
                  aria-label="Close achievement vault"
                  onClick={handleCloseAchievementVault}
                >
                  ×
                </button>

                <div className="gd-achievement-vault-top">
                  <div>
                    <div className="gd-achievement-vault-heading">FULL ACHIEVEMENT VAULT</div>
                    <div className="gd-achievement-vault-sub">
                      All {ACHIEVEMENTS.length} cards. Locked, unlocked, and everything in between.
                    </div>
                  </div>

                  <button className="gd-achievement-vault-close" onClick={handleCloseAchievementVault}>
                    CLOSE VAULT
                  </button>
                </div>

                <div className="gd-achievement-vault-body">
                  <div className="gd-achievement-filter-row">
                    {ACHIEVEMENT_FILTERS.map((filter) => (
                      <button
                        key={`achievement-filter-${filter}`}
                        className={`gd-achievement-filter-pill${achievementFilter === filter ? " active" : ""}`}
                        onClick={() => setAchievementFilter(filter)}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>

                  <div className="gd-achievement-summary">
                    {ACHIEVEMENT_RARITY_ORDER.map((rarity) => (
                      <div key={`achievement-panel-summary-${rarity}`} className="gd-achievement-summary-item">
                        <span
                          className="gd-achievement-summary-dot"
                          style={{ color: ACHIEVEMENT_RARITY_COLORS[rarity], background: ACHIEVEMENT_RARITY_COLORS[rarity] }}
                        />
                        <span>{rarityUnlockedCounts[rarity]} {rarity}</span>
                      </div>
                    ))}
                  </div>

                  {vaultPanelAchievements.length > 0 ? (
                    <div className="gd-achievement-grid gd-achievement-grid--panel">
                      {vaultPanelAchievements.map((achievement) => {
                        const rarityColor = achievement.rarityColor;
                        const unlockedOrder = vaultPanelUnlockedSequenceById.get(achievement.id) || 0;
                        const isLegendaryUnlocked = achievement.unlocked && achievement.rarity === "LEGENDARY";
                        const isCommonUnlocked = achievement.unlocked && achievement.rarity === "COMMON";
                        const unlockedBorder = isCommonUnlocked
                          ? "rgba(178,208,245,0.62)"
                          : rgbaWithAlpha(rarityColor, 0.4);
                        const unlockedGlow = isCommonUnlocked
                          ? "rgba(178,208,245,0.22)"
                          : rgbaWithAlpha(rarityColor, 0.15);

                        return (
                          <article
                            key={`vault-panel-${achievement.id}`}
                            className={[
                              "gd-achievement-card",
                              achievement.unlocked ? "gd-achievement-card--unlocked" : "gd-achievement-card--locked",
                              achievement.unlocked && achievementRevealReady ? "gd-achievement-card--revealed" : "",
                              isLegendaryUnlocked ? "gd-achievement-card--legendary-unlocked" : "",
                            ].filter(Boolean).join(" ")}
                            style={{
                              "--ach-color": rarityColor,
                              "--ach-divider": rgbaWithAlpha(rarityColor, 0.15),
                              "--ach-pill-bg": rgbaWithAlpha(rarityColor, 0.12),
                              "--ach-delay": `${unlockedOrder * 60}ms`,
                              "--ach-legendary-delay": isLegendaryUnlocked ? "300ms" : "0ms",
                              border: achievement.unlocked
                                ? `1px solid ${unlockedBorder}`
                                : "1px solid rgba(255,255,255,0.06)",
                              boxShadow: achievement.unlocked
                                ? `0 0 12px ${unlockedGlow}`
                                : "none",
                            }}
                            title={achievement.unlocked ? achievement.unlockedText : achievement.lockedText}
                          >
                            <span className="gd-achievement-pip" />
                            <div className="gd-achievement-icon">{achievement.unlocked ? achievement.icon : "?"}</div>
                            <div className="gd-achievement-name">{achievement.name}</div>
                            <div className="gd-achievement-desc">{achievement.description}</div>
                            <div className="gd-achievement-flavor">
                              {achievement.unlocked ? achievement.unlockedText : achievement.lockedText}
                            </div>
                            <div className="gd-achievement-rarity-pill">{achievement.rarity}</div>
                          </article>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="gd-achievement-empty">No achievements match this filter yet.</div>
                  )}

                  <div className="gd-achievement-vault-footer">
                    <button className="gd-achievement-vault-close" onClick={handleCloseAchievementVault}>
                      CLOSE VAULT
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
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

      {showTradingCard && (
        <TradingCard
          user={user}
          devScore={devScore}
          totalStars={totalStars}
          reposCount={user.public_repos}
          followers={user.followers}
          velocity={traits?.velocity}
          dnaSequence={dna}
          tier={tierMeta.label}
          devClass={effectiveDevClass}
          workStyle={chronotype?.workStyle}
          traits={traits}
          strengthReport={strengthReport}
          warningSign={warningSign}
          onClose={handleCloseTradingCard}
        />
      )}

      {showNewspaper && (
        <GitHubNewspaperPortal
          username={user.login || username || "developer"}
          profilePayload={newspaperPayload}
          getEdition={getNewspaperEdition}
          onClose={handleCloseNewspaper}
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

      {showAvatarPreview && user.avatar_url && (
        <div
          className="gd-modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowAvatarPreview(false)}
          style={{ zIndex: 96 }}
        >
          <div
            className="gd-modal-card"
            onClick={(event) => event.stopPropagation()}
            style={{
              maxWidth: 560,
              padding: 12,
              background: "rgba(4,10,18,0.96)",
              borderColor: "rgba(0,220,255,0.4)",
              boxShadow: "0 0 30px rgba(0,220,255,0.22)",
            }}
          >
            <img
              src={user.avatar_url}
              alt={`${user.login} profile enlarged`}
              style={{ width: "100%", display: "block", borderRadius: 8, border: "1px solid rgba(0,220,255,0.34)" }}
            />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 10 }}>
              <span style={{ fontFamily: "Share Tech Mono,monospace", fontSize: "0.62rem", letterSpacing: "0.11em", color: "rgba(0,220,255,0.62)" }}>
                @{user.login}
              </span>
              <button className="gd-btn" onClick={() => setShowAvatarPreview(false)} style={{ padding: "6px 12px", fontSize: "0.62rem" }}>
                CLOSE
              </button>
            </div>
          </div>
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
  const preferredHost = typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:8000"
    : "http://127.0.0.1:8000";
  const [apiBaseUrl, setApiBaseUrl] = useState(() => {
    const configured = String(import.meta.env.VITE_API_URL || "").trim().replace(/\/$/, "");
    return configured || preferredHost;
  });
  const API_URL = apiBaseUrl;
  const apiBaseCandidates = useMemo(() => {
    const configured = String(import.meta.env.VITE_API_URL || "").trim().replace(/\/$/, "");
    const hostMatched = preferredHost;
    const alternateHost = hostMatched === "http://localhost:8000"
      ? "http://127.0.0.1:8000"
      : "http://localhost:8000";

    return Array.from(new Set([
      apiBaseUrl,
      configured,
      hostMatched,
      alternateHost,
    ].filter(Boolean)));
  }, [apiBaseUrl, preferredHost]);

  const isNetworkFetchError = (err) => {
    const msg = String(err?.message || "");
    return err instanceof TypeError || /Failed to fetch|NetworkError|Load failed|fetch/i.test(msg);
  };

  const fetchFromBackend = async (path, init) => {
    let lastNetworkError = null;

    for (const base of apiBaseCandidates) {
      try {
        const response = await fetch(`${base}${path}`, init);
        if (base !== apiBaseUrl) {
          setApiBaseUrl(base);
        }
        return response;
      } catch (err) {
        if (!isNetworkFetchError(err)) {
          throw err;
        }
        lastNetworkError = err;
      }
    }

    const triedHosts = apiBaseCandidates.join(", ");
    throw new Error(
      `Cannot reach backend at ${triedHosts}. Start FastAPI on port 8000 and try again.`,
      { cause: lastNetworkError || undefined },
    );
  };

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

  const fetchProfilePayload = async (username, body = null) => {
    const hasBody = body && typeof body === "object";
    const res = await fetchFromBackend(`/api/analyze/${encodeURIComponent(username)}`, {
      method: hasBody ? "POST" : "GET",
      headers: hasBody
        ? { "Content-Type": "application/json", Accept: "application/json" }
        : { Accept: "application/json" },
      body: hasBody ? JSON.stringify(body) : undefined,
    });
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
    const res = await fetchFromBackend("/api/battle", {
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
    const res = await fetchFromBackend("/api/roast", {
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

  const fetchNewspaperEdition = async (profilePayload) => {
    const safePayload = profilePayload && typeof profilePayload === "object" ? profilePayload : {};
    const fallbackEdition = buildNewspaperFallback(
      safePayload,
      String(safePayload.username || activeUsername || github?.user?.login || "developer"),
    );

    const res = await fetchFromBackend("/api/newspaper", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ profile: safePayload }),
    });

    if (!res.ok) {
      let detail = `Newspaper API error (${res.status})`;
      try {
        const errJson = await res.json();
        detail = errJson?.detail || detail;
      } catch {
        // Keep default detail.
      }
      throw new Error(detail);
    }

    const payload = await res.json();
    return normalizeNewspaperPayload(payload?.newspaper || payload, fallbackEdition);
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

    try {
      if (streamRef.current) {
        streamRef.current.close();
        streamRef.current = null;
      }

      const fetchStep = Math.max(1, Math.min(3, selectedLoadingSteps.length - 1));
      const fetchMessage = selectedLoadingSteps[fetchStep] || selectedLoadingSteps[0] || LOADING_STEPS[0];
      setLoadingStep(fetchStep);
      setLoadingMessage(fetchMessage);
      setLoadingFeed((prev) => prev.includes(fetchMessage) ? prev : [...prev, fetchMessage]);

      const frontendPayload = await buildFrontendAnalyzePayload(parsedUsername);

      if (import.meta.env.DEV && typeof console !== "undefined") {
        const eventsLength = Array.isArray(frontendPayload.events) ? frontendPayload.events.length : 0;
        const pushEvents = Array.isArray(frontendPayload.events)
          ? frontendPayload.events.filter((event) => event?.type === "PushEvent").length
          : 0;
        const commitMessages = Array.isArray(frontendPayload.recent_commit_messages)
          ? frontendPayload.recent_commit_messages.length
          : 0;

        console.groupCollapsed(`[GitDNA] Data Quality :: @${parsedUsername}`);
        console.log("events.length", eventsLength);
        console.log("pushEvents", pushEvents);
        console.log("commitMessages", commitMessages);
        console.log("avgCommitHour", frontendPayload.avg_commit_hour);
        console.log("weekendRatio", frontendPayload.weekend_ratio);
        console.log("topLangs", frontendPayload.top_languages);
        console.log("baseTraits", frontendPayload.base_traits);
        console.groupEnd();
      }

      const aiStep = Math.max(0, selectedLoadingSteps.length - 2);
      const aiMessage = selectedLoadingSteps[aiStep] || selectedLoadingSteps[0] || LOADING_STEPS[0];
      setLoadingStep(aiStep);
      setLoadingMessage(aiMessage);
      setLoadingFeed((prev) => prev.includes(aiMessage) ? prev : [...prev, aiMessage]);

      const data = await fetchProfilePayload(parsedUsername, frontendPayload);
      await applyResult(data);
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

  async function onGenerateNewspaperFromDashboard(profilePayload) {
    const currentUsername = activeUsername || github?.user?.login;
    if (!currentUsername || !github) {
      throw new Error("Load a profile before generating the newspaper.");
    }

    const payload = profilePayload && typeof profilePayload === "object"
      ? profilePayload
      : {
          username: currentUsername,
          github,
          aiData,
          devScore,
          langs,
        };

    return fetchNewspaperEdition(payload);
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
          onGenerateNewspaper={onGenerateNewspaperFromDashboard}
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
