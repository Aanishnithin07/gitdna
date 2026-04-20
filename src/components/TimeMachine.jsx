import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { resolveBackendApiBase } from "../utils/backendApi";

const TIME_MACHINE_AI_CACHE = new Map();
const fallbackGetLangColor = () => "#00f5ff";

const TIME_MACHINE_PORTAL_STYLES = `
.tm-overlay{position:fixed;inset:0;z-index:9999;background:#000;overflow:hidden;color:#dff7ff}
.tm-overlay::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 20% 0%,rgba(0,220,255,.08),transparent 36%),radial-gradient(circle at 80% 100%,rgba(179,71,234,.1),transparent 42%);opacity:0;transition:opacity .6s ease;pointer-events:none}
.tm-overlay.tm-has-grid::before{opacity:1}
.tm-overlay-closing{animation:tm-close-fade .4s ease forwards}
.tm-open-shell{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px;background:#000;cursor:default}
.tm-open-shell.tm-step-2,.tm-open-shell.tm-step-3,.tm-open-shell.tm-step-4{background:#060b12;transition:background .8s ease}
.tm-open-shell.tm-step-2::before,.tm-open-shell.tm-step-3::before,.tm-open-shell.tm-step-4::before{content:'';position:absolute;inset:0;background-image:linear-gradient(rgba(0,220,255,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(0,220,255,.08) 1px,transparent 1px);background-size:42px 42px;opacity:.22;pointer-events:none}
.tm-scan-line{position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,#fff,transparent);will-change:transform;animation:tm-scan-down .5s linear forwards}
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
.tm-node-ripple{position:absolute;left:50%;top:50%;width:28px;height:28px;border-radius:50%;border:1px solid var(--tier-color);animation:tm-ripple 1.5s ease-out infinite;transform:translate(-50%,-50%) scale(1)}
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

@media (max-width:860px){
  .tm-exit{top:10px;right:10px}
  .tm-scroll{max-width:100%;padding:72px 12px 120px}
  .tm-spine{left:24px}
  .tm-row{justify-content:flex-end!important;min-height:162px}
  .tm-node-wrap{left:24px}
  .tm-card{width:calc(100% - 46px);margin-left:46px!important;margin-right:0!important;text-align:left!important;border-left:2px solid var(--tier-color)!important;border-right:none!important}
  .tm-card-head{flex-direction:row!important}
  .tm-level-row,.tm-lang,.tm-bars{justify-content:flex-start!important}
  .tm-final{padding:22px 16px}
}

@media (max-width:600px){
  .tm-open-username{font-size:clamp(.95rem,5.2vw,1.1rem)}
  .tm-origin{font-size:clamp(.74rem,3.3vw,.82rem);max-width:88vw}
  .tm-spine{left:20px}
  .tm-row{justify-content:flex-end!important}
  .tm-node-wrap{left:20px}
  .tm-card{width:calc(100% - 40px);margin-left:40px!important;margin-right:0!important;text-align:left!important;border-left:2px solid var(--tier-color)!important;border-right:none!important}
  .tm-card-head{flex-direction:row!important}
  .tm-level-row,.tm-lang,.tm-bars{justify-content:flex-start!important}
}

@keyframes tm-scan-down{from{transform:translateY(0)}to{transform:translateY(120vh)}}
@keyframes tm-avatar-pop{0%{transform:scale(0)}70%{transform:scale(1.15)}100%{transform:scale(1)}}
@keyframes tm-name-fade{from{opacity:0;letter-spacing:.5em}to{opacity:1;letter-spacing:.15em}}
@keyframes tm-cursor-blink{0%,49%{opacity:1}50%,100%{opacity:0}}
@keyframes tm-divider-grow{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes tm-hero-slam{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}
@keyframes tm-hint-pulse{0%,100%{opacity:.3}50%{opacity:.8}}
@keyframes tm-spine-grow{from{transform:scaleY(0)}to{transform:scaleY(1)}}
@keyframes tm-node-pulse{0%,100%{opacity:.55}50%{opacity:1}}
@keyframes tm-ripple{0%{opacity:.8;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(-50%,-50%) scale(2.5)}}
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

function TimeMachine({ repos, events, user, onClose, getLangColor }) {
  const resolveLangColor = typeof getLangColor === "function" ? getLangColor : fallbackGetLangColor;
  const API_URL = useMemo(() => resolveBackendApiBase(), []);
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
                {user?.avatar_url ? <img src={user.avatar_url} alt="" width="100" height="100" loading="lazy" decoding="async" onError={(event) => { event.currentTarget.style.visibility = "hidden"; }} /> : null}
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
                {user?.avatar_url ? <img src={user.avatar_url} alt="" width="32" height="32" loading="lazy" decoding="async" onError={(event) => { event.currentTarget.style.visibility = "hidden"; }} /> : null}
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
                        <span className="tm-dot" style={{ background: resolveLangColor(item.topLanguage) }} />
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


export default TimeMachine;
