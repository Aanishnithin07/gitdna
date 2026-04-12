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
  "CONNECTING TO GITHUB SERVERS",
  "EXTRACTING REPOSITORY GENOME",
  "MAPPING LANGUAGE TOPOLOGY",
  "ANALYZING COMMIT BEHAVIOR",
  "DECODING COLLABORATION DNA",
  "CALIBRATING TEMPORAL PATTERNS",
  "RUNNING BEHAVIORAL ENGINE",
  "SYNTHESIZING DEV PROFILE",
  "RENDERING PSYCHOLOGICAL MATRIX",
  "PROFILE READY — INITIALIZING",
];

const RATE_LIMIT_MESSAGE = "RATE LIMIT HIT — Add a GitHub token in .env or wait 60 minutes";

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
@keyframes card-rise{from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:translateY(0)}}
@keyframes scan-sweep{0%{transform:translateY(-6px);opacity:0}12%{opacity:1}100%{transform:translateY(calc(100% + 6px));opacity:0}}
@keyframes dna-lock{
  0%{opacity:0;color:#39ff14;text-shadow:0 0 14px rgba(57,255,20,.95);transform:translateY(4px) scale(.78)}
  65%{opacity:1;color:#39ff14;text-shadow:0 0 18px rgba(57,255,20,.85)}
  100%{opacity:1;color:var(--dna-final);text-shadow:var(--dna-final-shadow);transform:translateY(0) scale(1)}
}

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

.gd-enter-scan{overflow:hidden}
.gd-enter-scan::after{content:'';position:absolute;left:0;right:0;top:0;height:2px;background:linear-gradient(90deg,transparent,rgba(0,220,255,0.4),transparent);transform:translateY(-6px);opacity:0;pointer-events:none;z-index:4;animation:scan-sweep .6s linear var(--scan-delay,0ms) 1 forwards}

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

function ScoreRing({ score }) {
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
  const scoreColor = score >= 80 ? "#39ff14" : score >= 60 ? "#00dcff" : score >= 40 ? "#ffb300" : "#ff4545";
  const ringColor = "#00dcff";
  const sparkAngle = progress * 2 * Math.PI;
  const sparkX = 65 + r * Math.cos(sparkAngle);
  const sparkY = 65 + r * Math.sin(sparkAngle);
  return (
    <div style={{ position: "relative", width: 130, height: 130, flexShrink: 0 }}>
      <svg width="130" height="130" style={{ transform: "rotate(-90deg)", position: "absolute", inset: 0 }}>
        <circle cx="65" cy="65" r={r} fill="none" stroke="rgba(0,220,255,0.07)" strokeWidth="7" />
        <circle cx="65" cy="65" r={r} fill="none" stroke="rgba(0,220,255,0.04)" strokeWidth="7"
          strokeDasharray="4 8" />
        <circle cx="65" cy="65" r={r} fill="none" stroke={ringColor} strokeWidth="11" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={off}
          style={{ filter: "blur(4px)", opacity: 0.55 }} />
        <circle cx="65" cy="65" r={r} fill="none" stroke={ringColor} strokeWidth="7" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={off}
          style={{ filter: "drop-shadow(0 0 10px rgba(0,220,255,0.95))" }} />
        {progress > 0.002 && (
          <circle cx={sparkX} cy={sparkY} r="3.2" fill="#c6ffff"
            style={{ filter: "drop-shadow(0 0 8px rgba(0,220,255,1))" }} />
        )}
        <circle cx="65" cy="65" r="40" fill="none" stroke="rgba(0,220,255,0.04)" strokeWidth="1" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: "Orbitron,monospace", fontSize: "1.75rem", fontWeight: 900, color: scoreColor, lineHeight: 1, textShadow: `0 0 12px ${scoreColor}88` }}>
          <AnimatedCounter target={score} delay={500} duration={1800} />
        </div>
        <div style={{ fontFamily: "Share Tech Mono,monospace", fontSize: "0.55rem", color: "rgba(0,220,255,0.4)", letterSpacing: "0.2em", marginTop: 3 }}>DEV SCORE</div>
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

function DNASequence({ seq }) {
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
        <span key={i} style={{
          fontFamily: "Share Tech Mono,monospace", fontSize: "0.75rem",
          opacity: i < visibleCount ? 1 : 0,
          color: i % 2 === 0 ? "#00dcff" : "#b347ea",
          textShadow: i % 2 === 0 ? "0 0 8px rgba(0,220,255,0.5)" : "0 0 8px rgba(179,71,234,0.5)",
          transform: i < visibleCount ? "translateY(0) scale(1)" : "translateY(4px) scale(0.8)",
          transition: "opacity .08s linear",
          animation: i < visibleCount ? "dna-lock .25s ease both" : "none",
          "--dna-final": i % 2 === 0 ? "#00dcff" : "#b347ea",
          "--dna-final-shadow": i % 2 === 0 ? "0 0 8px rgba(0,220,255,0.5)" : "0 0 8px rgba(179,71,234,0.5)",
        }}>{c}</span>
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
    const gridSize = 60;
    const particleCount = 35;
    const particles = [];
    const gridHighlights = [];
    const meteors = [];
    let nextGridPulse = performance.now() + 3000;
    let nextMeteor = performance.now() + 8000 + Math.random() * 4000;
    let prevTs = performance.now();

    const pickColor = () => {
      const roll = Math.random();
      if (roll < 0.6) return "#00dcff";
      if (roll < 0.85) return "#b347ea";
      return "#39ff14";
    };

    const resetParticle = (particle, spawnAtBottom = false) => {
      particle.x = Math.random() * state.width;
      particle.y = spawnAtBottom ? state.height + Math.random() * 48 : Math.random() * state.height;
      particle.size = 1 + Math.random() * 2;
      particle.opacity = 0.2 + Math.random() * 0.5;
      particle.color = pickColor();
      particle.speed = 0.28 + Math.random() * 0.55;
      particle.swayAmp = 0.25 + Math.random() * 0.85;
      particle.swaySpeed = 0.018 + Math.random() * 0.04;
      particle.phase = Math.random() * Math.PI * 2;
    };

    const createParticle = () => {
      const particle = {
        x: 0,
        y: 0,
        size: 0,
        opacity: 0,
        color: "#00dcff",
        speed: 0,
        swayAmp: 0,
        swaySpeed: 0,
        phase: 0,
      };
      resetParticle(particle, false);
      return particle;
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
    };

    const spawnGridPulse = (ts) => {
      const count = 1 + Math.floor(Math.random() * 3);
      const cols = Math.max(1, Math.floor(state.width / gridSize));
      const rows = Math.max(1, Math.floor(state.height / gridSize));
      for (let i = 0; i < count; i += 1) {
        gridHighlights.push({
          col: Math.floor(Math.random() * cols),
          row: Math.floor(Math.random() * rows),
          start: ts,
          duration: 1000,
        });
      }
    };

    const drawGrid = (ts) => {
      ctx.save();
      ctx.strokeStyle = "rgba(0,220,255,0.025)";
      ctx.lineWidth = 1;
      for (let x = 0; x <= state.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, state.height);
        ctx.stroke();
      }
      for (let y = 0; y <= state.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(state.width, y + 0.5);
        ctx.stroke();
      }
      ctx.restore();

      for (let i = gridHighlights.length - 1; i >= 0; i -= 1) {
        const pulse = gridHighlights[i];
        const life = (ts - pulse.start) / pulse.duration;
        if (life >= 1) {
          gridHighlights.splice(i, 1);
          continue;
        }
        const alpha = Math.max(0, 1 - life);
        const x = pulse.col * gridSize;
        const y = pulse.row * gridSize;
        ctx.save();
        ctx.fillStyle = `rgba(0,220,255,${0.05 + alpha * 0.12})`;
        ctx.fillRect(x, y, gridSize, gridSize);
        ctx.strokeStyle = `rgba(0,220,255,${alpha * 0.55})`;
        ctx.lineWidth = 1.2;
        ctx.shadowColor = `rgba(0,220,255,${alpha * 0.85})`;
        ctx.shadowBlur = 14;
        ctx.strokeRect(x + 1, y + 1, gridSize - 2, gridSize - 2);
        ctx.restore();
      }
    };

    const updateAndDrawParticles = (dt) => {
      const attractPoint = attractPointRef.current;
      for (let i = 0; i < particles.length; i += 1) {
        const p = particles[i];
        p.phase += p.swaySpeed * dt;
        p.y -= p.speed * dt;
        p.x += Math.sin(p.phase) * p.swayAmp * 0.35 * dt;

        if (attractActiveRef.current && attractPoint) {
          const dx = attractPoint.x - p.x;
          const dy = attractPoint.y - p.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 1 && dist < 280) {
            const pull = (1 - dist / 280) * 0.8;
            p.x += (dx / dist) * pull * dt;
            p.y += (dy / dist) * pull * dt * 0.7;
          }
        }

        if (p.y < -12) {
          resetParticle(p, true);
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fill();
        ctx.restore();
      }
    };

    const drawConnections = () => {
      let lineCount = 0;
      for (let i = 0; i < particles.length && lineCount < 20; i += 1) {
        for (let j = i + 1; j < particles.length && lineCount < 20; j += 1) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distance = Math.hypot(dx, dy);
          if (distance > 80) continue;
          const alpha = (1 - distance / 80) * 0.24;
          ctx.save();
          ctx.strokeStyle = `rgba(0,220,255,${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
          ctx.restore();
          lineCount += 1;
        }
      }
    };

    const updateAndDrawMeteors = (ts) => {
      for (let i = meteors.length - 1; i >= 0; i -= 1) {
        const meteor = meteors[i];
        const life = (ts - meteor.start) / meteor.duration;
        if (life >= 1) {
          meteors.splice(i, 1);
          continue;
        }
        const headX = meteor.startX - meteor.travel * life;
        const headY = meteor.startY + meteor.travel * life;
        const tailX = headX + meteor.length;
        const tailY = headY - meteor.length;
        const gradient = ctx.createLinearGradient(headX, headY, tailX, tailY);
        gradient.addColorStop(0, `rgba(255,255,255,${(1 - life) * 0.95})`);
        gradient.addColorStop(1, "rgba(255,255,255,0)");

        ctx.save();
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(headX, headY);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();
        ctx.restore();
      }
    };

    const drawVignette = () => {
      const gradient = ctx.createRadialGradient(
        state.width / 2,
        state.height / 2,
        Math.min(state.width, state.height) * 0.16,
        state.width / 2,
        state.height / 2,
        Math.max(state.width, state.height) * 0.72
      );
      gradient.addColorStop(0, "rgba(6,11,18,0)");
      gradient.addColorStop(1, "rgba(6,11,18,0.8)");
      ctx.save();
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, state.width, state.height);
      ctx.restore();
    };

    resizeCanvas();
    updateAttractPoint();
    for (let i = 0; i < particleCount; i += 1) {
      particles.push(createParticle());
    }

    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
      updateAttractPoint();
    });
    resizeObserver.observe(document.documentElement);

    const tick = (ts) => {
      const dt = Math.min((ts - prevTs) / 16.67, 2);
      prevTs = ts;

      if (ts >= nextGridPulse) {
        spawnGridPulse(ts);
        nextGridPulse = ts + 3000;
      }
      if (ts >= nextMeteor) {
        meteors.push({
          start: ts,
          duration: 400,
          startX: state.width + 20 + Math.random() * 80,
          startY: -20 + Math.random() * state.height * 0.25,
          travel: Math.max(state.width, state.height) * 0.65,
          length: 60 + Math.random() * 60,
        });
        nextMeteor = ts + 8000 + Math.random() * 4000;
      }

      updateAttractPoint();
      ctx.clearRect(0, 0, state.width, state.height);
      drawGrid(ts);
      updateAndDrawParticles(dt);
      drawConnections();
      updateAndDrawMeteors(ts);
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

function LandingPage({ onAnalyze }) {
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
    <div className="gd-root" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "40px 20px", position: "relative", zIndex: 2 }}>
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
            Add VITE_GITHUB_TOKEN to .env for higher rate limits
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

function LoadingPage({ step }) {
  const pct = Math.round(((step + 1) / LOADING_STEPS.length) * 100);
  return (
    <div className="gd-root" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 20, position: "relative", zIndex: 2 }}>
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
          SYSTEM PROCESS {String(step + 1).padStart(2, "0")}/{LOADING_STEPS.length}
        </div>
        <div style={{ fontFamily: "Orbitron,monospace", fontSize: "clamp(0.7rem,2vw,0.9rem)", color: "#00dcff", letterSpacing: "0.12em", fontWeight: 600, marginBottom: 28, textShadow: "0 0 10px rgba(0,220,255,0.4)", minHeight: 24 }}>
          {LOADING_STEPS[step]}
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
          {LOADING_STEPS.slice(0, step + 1).map((msg, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, opacity: i === step ? 1 : 0.35 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: i === step ? "#00dcff" : "#39ff14", boxShadow: i === step ? "0 0 6px rgba(0,220,255,0.8)" : "none", flexShrink: 0 }} />
              <span style={{ fontFamily: "Share Tech Mono,monospace", fontSize: "0.6rem", color: "rgba(0,220,255,0.5)", letterSpacing: "0.08em" }}>{msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Dashboard({ github, aiData, devScore, langs, username, onReset }) {
  const { user, totalStars, recentCommits } = github;
  const acctYears = ((Date.now() - new Date(user.created_at)) / (1000 * 60 * 60 * 24 * 365)).toFixed(1);
  const devClass = aiData?.devClass || "Unknown Archetype";
  const chronotype = aiData?.chronotype || { title: "Unknown", description: "Analysis unavailable." };
  const collab = aiData?.collaborationStyle || { title: "Unknown", description: "Analysis unavailable." };
  const traits = aiData?.traits;
  const facts = aiData?.fastFacts || [];
  const dna = aiData?.dnaSequence || "0000000000000000";
  const shareCardRef = useRef(null);
  const shareFlashTimeoutRef = useRef(null);
  const unlockFlashTimeoutRef = useRef(null);
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);
  const [showCardSaved, setShowCardSaved] = useState(false);
  const [showUnlockFlash, setShowUnlockFlash] = useState(true);

  const cardEntranceStyle = (index) => ({
    opacity: 0,
    animation: `card-rise .55s cubic-bezier(.2,.8,.2,1) ${320 + index * 80}ms forwards`,
    "--scan-delay": `${index * 150}ms`,
  });

  useEffect(() => {
    setShowUnlockFlash(true);
    unlockFlashTimeoutRef.current = setTimeout(() => setShowUnlockFlash(false), 420);
    return () => {
      if (shareFlashTimeoutRef.current) {
        clearTimeout(shareFlashTimeoutRef.current);
      }
      if (unlockFlashTimeoutRef.current) {
        clearTimeout(unlockFlashTimeoutRef.current);
      }
    };
  }, []);

  async function handleGenerateShareCard() {
    if (!shareCardRef.current || isGeneratingCard) return;

    try {
      setIsGeneratingCard(true);
      const canvas = await html2canvas(shareCardRef.current, {
        backgroundColor: "#060b12",
        scale: window.devicePixelRatio > 1 ? 2 : 1,
        useCORS: true,
      });

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
    <div className="gd-root" style={{ position: "relative", zIndex: 2, paddingBottom: 60 }}>
      <BackgroundCanvas />
      <div className="gd-scanlines" />
      {showUnlockFlash && <div className="gd-unlock-flash" />}

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px", position: "relative", zIndex: 2 }}>
        <div ref={shareCardRef} style={{ padding: 2, borderRadius: 8 }}>
          {/* HEADER */}
          <div className="gd-card gd-header-card gd-enter-scan" style={{ padding: "20px 22px", marginBottom: 16, display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", ...cardEntranceStyle(0) }}>
            <div className="scan-overlay" />
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
                <span className="gd-badge gd-badge-purple">{devClass}</span>
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
              <ScoreRing score={devScore} />
            </div>
          </div>

          {/* DNA SEQUENCE */}
          <div className="gd-card gd-enter-scan" style={{ padding: "12px 18px", marginBottom: 16, ...cardEntranceStyle(1) }}>
            <div className="gd-section-label" style={{ marginBottom: 8 }}>DEV DNA SEQUENCE</div>
            <DNASequence seq={dna} />
          </div>

          {/* VITALS */}
          <div className="gd-vitals-row">
            <StatCard label="STARS EARNED" value={totalStars} delay={2} sub="across all repos" enterIndex={2} ticker={true} />
            <StatCard label="FOLLOWERS" value={user.followers} delay={3} sub="in the network" enterIndex={3} ticker={true} />
            <StatCard label="REPOSITORIES" value={user.public_repos} delay={4} sub="public codebases" enterIndex={4} ticker={true} />
            <StatCard label="COMMITS" value={recentCommits} delay={5} sub="recent activity" enterIndex={5} />
          </div>
        </div>

        {/* SKILLS + CHRONOTYPE */}
        <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
          <div className="gd-card gd-enter-scan" style={{ flex: "1 1 220px", padding: "18px 18px", ...cardEntranceStyle(6) }}>
            <div className="gd-section-label">SKILL TOPOLOGY</div>
            {langs.map((l, i) => <SkillBar key={l.lang} lang={l.lang} pct={l.pct} delay={i + 1} />)}
            {langs.length === 0 && <div style={{ color: "rgba(200,232,255,0.3)", fontFamily: "Share Tech Mono,monospace", fontSize: "0.7rem" }}>No language data</div>}
          </div>

          <div className="gd-card-purple gd-enter-scan" style={{ flex: "1 1 220px", padding: "18px 18px", ...cardEntranceStyle(7) }}>
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

          <div className="gd-card gd-enter-scan" style={{ flex: "1 1 180px", padding: "18px 18px", ...cardEntranceStyle(8) }}>
            <div className="gd-section-label">NEURAL TRAITS</div>
            <TraitsRadar traits={traits} />
          </div>
        </div>

        {/* COLLAB STYLE */}
        <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
          <div className="gd-card-green gd-enter-scan" style={{ flex: "1 1 240px", padding: "18px 18px", ...cardEntranceStyle(9) }}>
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
            <div className="gd-card gd-enter-scan" style={{ flex: "1 1 200px", padding: "18px 18px", ...cardEntranceStyle(10) }}>
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
        {facts.length > 0 && (
          <div style={cardEntranceStyle(11)}>
            <div className="gd-card gd-enter-scan" style={{ padding: "18px 18px" }}>
              <div className="gd-section-label">// AI FAST FACTS</div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {facts.map((fact, i) => (
                  <div key={i} className="gd-card-gold gd-hover-lift gd-enter-scan" style={{ flex: "1 1 180px", padding: "14px 14px", ...cardEntranceStyle(12 + i) }}>
                    <div style={{ fontFamily: "Share Tech Mono,monospace", fontSize: "0.55rem", color: "rgba(255,179,0,0.45)", letterSpacing: "0.15em", marginBottom: 8 }}>INTEL_{String(i + 1).padStart(2, "0")}</div>
                    <p style={{ fontSize: "0.84rem", color: "rgba(200,232,255,0.7)", lineHeight: 1.55, fontWeight: 400 }}>{fact}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div style={{ marginTop: 24, textAlign: "center", ...cardEntranceStyle(16) }}>
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
        </div>
      </div>
    </div>
  );
}

export default function GitDNA() {
  const [phase, setPhase] = useState("landing");
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState("");
  const [github, setGithub] = useState(null);
  const [aiData, setAiData] = useState(null);
  const [devScore, setDevScore] = useState(0);
  const [langs, setLangs] = useState([]);
  const [activeUsername, setActiveUsername] = useState("");
  const autoAnalyzeRef = useRef(false);
  const githubHeaders = import.meta.env.VITE_GITHUB_TOKEN
    ? { Authorization: `Bearer ${import.meta.env.VITE_GITHUB_TOKEN}` }
    : {};

  async function analyze(username) {
    const parsedUsername = parseGithubUsername(username);
    if (!parsedUsername) {
      setError("Enter a valid GitHub username or profile URL.");
      setPhase("error");
      return;
    }

    setPhase("loading");
    setLoadingStep(0);
    setError("");

    const advanceTo = (step) => setLoadingStep(step);
    const isRateLimited = (status) => status === 403 || status === 429;

    try {
      advanceTo(0);
      const userRes = await fetch(`https://api.github.com/users/${parsedUsername}`, {
        headers: githubHeaders,
      });
      if (!userRes.ok) {
        if (isRateLimited(userRes.status)) throw new Error(RATE_LIMIT_MESSAGE);
        throw new Error(userRes.status === 404 ? `User "${username}" not found on GitHub.` : "GitHub API error. Try again.");
      }
      const user = await userRes.json();
      const profileUsername = user.login || parsedUsername;

      advanceTo(1);
      const repos = [];
      let page = 1;
      while (true) {
        const reposRes = await fetch(
          `https://api.github.com/users/${parsedUsername}/repos?per_page=100&sort=pushed&page=${page}`,
          {
            headers: githubHeaders,
          }
        );
        if (!reposRes.ok) {
          if (isRateLimited(reposRes.status)) throw new Error(RATE_LIMIT_MESSAGE);
          break;
        }
        const pageRepos = await reposRes.json();
        if (!Array.isArray(pageRepos) || pageRepos.length === 0) break;
        repos.push(...pageRepos);
        if (pageRepos.length < 100) break;
        page += 1;
      }

      advanceTo(2);
      const topLangs = extractTopLangs(Array.isArray(repos) ? repos : []);
      const totalStars = Array.isArray(repos) ? repos.reduce((s, r) => s + (r.stargazers_count || 0), 0) : 0;
      const score = calcDevScore(user, Array.isArray(repos) ? repos : []);

      advanceTo(3);
      const eventsRes = await fetch(`https://api.github.com/users/${parsedUsername}/events/public?per_page=30`, {
        headers: githubHeaders,
      });
      if (!eventsRes.ok && isRateLimited(eventsRes.status)) throw new Error(RATE_LIMIT_MESSAGE);
      const events = eventsRes.ok ? await eventsRes.json() : [];
      const { messages, hours } = extractCommitData(Array.isArray(events) ? events : []);

      setGithub({ user, totalStars, recentCommits: messages.length });
      setDevScore(score);
      setLangs(topLangs);
      setActiveUsername(profileUsername);

      advanceTo(4);
      const langNames = topLangs.map(l => l.lang).join(", ") || "Unknown";
      const avgHour = hours.length ? Math.round(hours.reduce((a, b) => a + b, 0) / hours.length) : 14;
      const ageYears = ((Date.now() - new Date(user.created_at)) / (1000 * 60 * 60 * 24 * 365)).toFixed(1);

      advanceTo(5);
      const prompt = `Analyze this GitHub developer profile and return ONLY valid JSON (no markdown, no backticks):

Username: ${user.login}
Display Name: ${user.name || user.login}
Primary Languages: ${langNames}
Total Public Stars: ${totalStars}
Followers: ${user.followers}
Public Repos: ${user.public_repos}
Account Age: ${ageYears} years
Average Commit Hour (UTC): ${avgHour}:00 (${avgHour < 6 ? "deep night" : avgHour < 12 ? "morning" : avgHour < 18 ? "daytime" : avgHour < 22 ? "evening" : "night"})
Sample Commit Messages: ${messages.slice(0, 8).join(" | ") || "none available"}
Bio: ${user.bio || "none"}

Return this exact JSON structure with creative, specific, personalized content:
{
  "devClass": "Creative RPG-style archetype title (e.g. 'The Distributed Systems Oracle', 'The Frontend Sorcerer')",
  "chronotype": {
    "title": "Creative name for their work time pattern (e.g. 'Midnight Architect', 'Dawn Protocol Engineer')",
    "description": "2-sentence behavioral insight linking their commit timing to personality traits. Make it feel psychological and specific."
  },
  "collaborationStyle": {
    "title": "Creative archetype for collaboration (e.g. 'The Empathic Reviewer', 'The Autonomous Builder')",
    "description": "2-sentence insight about their collaboration patterns based on the data. Be specific and interesting."
  },
  "traits": {
    "creativity": <integer 0-100>,
    "discipline": <integer 0-100>,
    "collaboration": <integer 0-100>,
    "boldness": <integer 0-100>,
    "depth": <integer 0-100>
  },
  "fastFacts": [
    "Punchy, darkly witty personalized fact using their actual data (stars, repos, commit patterns)",
    "Another personalized fact. E.g. 'Your average commit lands at ${avgHour}:00 UTC. Sleep is clearly optional.'",
    "Third fact. Could be about their top language, account age, or behavioral quirk. Make it memorable."
  ],
  "dnaSequence": "16 character uppercase hex string representing their unique developer fingerprint"
}`;

      advanceTo(6);
      let aiResult = null;
      try {
        const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1000,
            messages: [{ role: "user", content: prompt }],
          }),
        });
        advanceTo(7);
        const aiJson = await aiRes.json();
        const raw = aiJson.content?.map(b => b.text || "").join("") || "";
        const cleaned = raw.replace(/```json|```/g, "").trim();
        aiResult = JSON.parse(cleaned);
      } catch (e) {
        aiResult = {
          devClass: "The Code Phantom",
          chronotype: { title: "Temporal Drifter", description: `Commits most frequently around hour ${avgHour}. Their schedule follows an internal clock that ignores conventional time zones entirely.` },
          collaborationStyle: { title: "The Silent Architect", description: "Builds in focused bursts with minimal external noise. Their work speaks louder than their commit messages." },
          traits: { creativity: 72, discipline: 68, collaboration: 55, boldness: 80, depth: 85 },
          fastFacts: [
            `${totalStars} stars earned across ${user.public_repos} repos. The market has spoken.`,
            `Account age: ${ageYears} years. That's ${(parseFloat(ageYears) * 8760).toFixed(0)} hours of accumulated git muscle memory.`,
            `Primary language: ${topLangs[0]?.lang || "Unknown"}. A choice that reveals everything and nothing.`
          ],
          dnaSequence: "4F6E3A1D9C2B8E7F"
        };
      }

      advanceTo(8);
      setAiData(aiResult);
      await new Promise(r => setTimeout(r, 600));
      advanceTo(9);
      await new Promise(r => setTimeout(r, 500));
      window.history.pushState({}, "", `/?u=${encodeURIComponent(profileUsername)}`);
      setPhase("dashboard");

    } catch (err) {
      setError(err.message || "Analysis failed.");
      setPhase("error");
    }
  }

  useEffect(() => {
    if (autoAnalyzeRef.current) return;
    autoAnalyzeRef.current = true;
    const urlUsername = new URLSearchParams(window.location.search).get("u");
    if (urlUsername && urlUsername.trim()) {
      const parsedUsername = parseGithubUsername(urlUsername.trim());
      if (parsedUsername) analyze(parsedUsername);
    }
  }, []);

  if (phase === "landing") return (
    <>
      <style>{CSS}</style>
      <LandingPage onAnalyze={analyze} />
    </>
  );

  if (phase === "loading") return (
    <>
      <style>{CSS}</style>
      <LoadingPage step={loadingStep} />
    </>
  );

  if (phase === "error") return (
    <>
      <style>{CSS}</style>
      <div className="gd-root" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 20, zIndex: 2, position: "relative" }}>
        <BackgroundCanvas />
        <div className="gd-scanlines" />
        <div className="gd-card" style={{ padding: 28, maxWidth: 440, textAlign: "center", zIndex: 2, position: "relative" }}>
          <div className="orb" style={{ color: "#ff4545", fontSize: "1rem", marginBottom: 12, letterSpacing: "0.1em" }}>⚠ SCAN FAILURE</div>
          <p style={{ color: "rgba(200,232,255,0.6)", marginBottom: 20, fontFamily: "Share Tech Mono,monospace", fontSize: "0.8rem" }}>{error}</p>
          <button className="gd-btn" onClick={() => setPhase("landing")}>◀ RETRY</button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{CSS}</style>
      <Dashboard
        github={github}
        aiData={aiData}
        devScore={devScore}
        langs={langs}
        username={activeUsername}
        onReset={() => {
          setPhase("landing");
          setGithub(null);
          setAiData(null);
          setActiveUsername("");
        }}
      />
    </>
  );
}
