import { useState, useEffect, useRef } from "react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import html2canvas from "html2canvas";

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
@keyframes torvalds-screen-glitch{
  0%{filter:none;transform:none}
  20%{filter:contrast(1.35) saturate(1.2) hue-rotate(-16deg);transform:skewX(-1.2deg) translateX(-2px)}
  40%{filter:contrast(1.5) hue-rotate(14deg);transform:skewX(1.2deg) translateX(2px)}
  60%{filter:contrast(1.15) saturate(1.4);transform:skewX(-.7deg)}
  100%{filter:none;transform:none}
}
@keyframes toast-down{from{opacity:0;transform:translateY(-24px)}to{opacity:1;transform:translateY(0)}}

.gd-glitch{animation:glitch 5s infinite}
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

  const normalizedGithub = {
    ...githubPayload,
    user: normalizedUser,
    repos: normalizedRepos,
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
    const svgRes = await fetch(`https://github.com/users/${username}/contributions`);
    if (svgRes.ok) {
      const svgText = await svgRes.text();
      const doc = new DOMParser().parseFromString(svgText, "image/svg+xml");
      const rects = [...doc.querySelectorAll("rect[data-date][data-count]")];
      const parsed = rects.map((rect) => ({
        date: rect.getAttribute("data-date") || "",
        count: Number(rect.getAttribute("data-count") || 0),
      })).filter((item) => item.date);
      if (parsed.length > 0) return parsed;
    }
  } catch {
    // Ignore CORS/network errors and fall back to JSON service.
  }

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

function ScoreRing({ score, specialMode = null }) {
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
        <div style={{ fontFamily: "Share Tech Mono,monospace", fontSize: "0.55rem", color: useGold ? "rgba(255,215,0,0.45)" : "rgba(0,220,255,0.4)", letterSpacing: "0.2em", marginTop: 3 }}>DEV SCORE</div>
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
            <div className="orb" style={{ fontSize: "1.1rem", fontWeight: 900, color: "#00dcff", textShadow: "0 0 12px rgba(0,220,255,0.6)" }}>GIT<span style={{ color: "#b347ea" }}>DNA</span></div>
          </div>
        </div>

        <div style={{ fontFamily: "Share Tech Mono,monospace", fontSize: "0.68rem", color: "rgba(0,220,255,0.4)", letterSpacing: "0.15em", marginBottom: 10 }}>
          SYSTEM PROCESS {String(safeStep + 1).padStart(2, "0")}/{safeSteps.length}
        </div>
        <div style={{ fontFamily: "Orbitron,monospace", fontSize: "clamp(0.7rem,2vw,0.9rem)", color: "#00dcff", letterSpacing: "0.12em", fontWeight: 600, marginBottom: 28, textShadow: "0 0 10px rgba(0,220,255,0.4)", minHeight: 24 }}>
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
}) {
  const { user, totalStars, recentCommits, contributions, repos } = github;
  const acctYears = ((Date.now() - new Date(user.created_at)) / (1000 * 60 * 60 * 24 * 365)).toFixed(1);
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
  const shareCardRef = useRef(null);
  const shareFlashTimeoutRef = useRef(null);
  const unlockFlashTimeoutRef = useRef(null);
  const founderBurstTimeoutRef = useRef(null);
  const founderCinematicTimeoutRef = useRef(null);
  const torvaldsGlitchTimeoutRef = useRef(null);
  const longSessionTimeoutRef = useRef(null);
  const starToastShowTimeoutRef = useRef(null);
  const starToastHideTimeoutRef = useRef(null);
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

  const cardEntranceStyle = (index) => ({
    opacity: 0,
    animation: `card-rise .55s cubic-bezier(.2,.8,.2,1) ${320 + index * 80}ms forwards`,
    "--scan-delay": `${index * 150}ms`,
  });

  const profileSharePath = `/?u=${encodeURIComponent(user.login || username || "")}`;

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
      ].forEach((ref) => {
        if (ref.current) {
          clearTimeout(ref.current);
          ref.current = null;
        }
      });
    };
  }, [founderActive, isTorvalds, starTier]);

  async function copyProfileLink() {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(profileSharePath);
      }
    } catch {
      // Ignore clipboard failures.
    }
  }

  async function handleGenerateShareCard() {
    if (!shareCardRef.current || isGeneratingCard) return;

    try {
      setIsGeneratingCard(true);
      const canvas = await html2canvas(shareCardRef.current, {
        backgroundColor: "#060b12",
        scale: window.devicePixelRatio > 1 ? 2 : 1,
        useCORS: true,
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
    <div className={`gd-root${ultraMode ? " gd-ultra-mode" : ""}${showTorvaldsGlitch ? " gd-torvalds-screen" : ""}`} style={{ position: "relative", zIndex: 2, paddingBottom: 60 }}>
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
                <span className="gd-badge gd-badge-gold">⌛ {acctYears}yr veteran</span>
                {user.blog && <span className="gd-badge gd-badge-green">🔗 blog</span>}
              </div>
            </div>
            <div className="gd-header-ring" style={{ flexShrink: 0 }}>
              <ScoreRing score={devScore} specialMode={founderActive || isTorvalds ? "gold" : null} />
              <button
                className="gd-btn"
                onClick={() => {
                  setShowCompareModal(true);
                  setCompareError("");
                  setOpponentUsername("");
                }}
                style={{ marginTop: 10, padding: "7px 14px", fontSize: "0.66rem", width: "100%" }}
              >
                ⚔ COMPARE
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
      window.history.pushState({}, "", `/?u=${encodeURIComponent(profileUsername)}`);
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
      window.history.pushState({}, "", `/?battle=${encodeURIComponent(slug)}`);

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

  function exitBattleView() {
    setBattleData(null);
    const fallbackUsername = activeUsername || github?.user?.login;
    if (fallbackUsername) {
      window.history.pushState({}, "", `/?u=${encodeURIComponent(fallbackUsername)}`);
    } else {
      window.history.pushState({}, "", "/");
    }
  }

  async function shareBattleLink() {
    if (!battleData?.left?.username || !battleData?.right?.username) return;
    const slug = battleSlug(battleData.left.username, battleData.right.username);
    const path = `/?battle=${encodeURIComponent(slug)}`;
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
            window.history.pushState({}, "", "/");
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
