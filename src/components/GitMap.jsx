import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { geoContains, geoNaturalEarth1, geoPath } from "d3-geo";
import { resolveBackendApiBase } from "../utils/backendApi";

const DEFAULT_COUNTRY_DEV_DATA = {
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

const DEFAULT_REGION_BASELINES = {
  DEFAULT: { stars: 26, commits: 10 },
};

const EMPTY_TECH_HUBS = [];
const EMPTY_CITY_COORDS = {};
const INTERNAL_GEOCODE_CACHE = new Map();
const INTERNAL_INSIGHT_CACHE = new Map();

function GitMap({
  user,
  avgCommitHour,
  totalStars,
  topLang,
  accountAge,
  recentCommits = 0,
  onClose,
  cityCoords,
  countryDevData,
  regionBaselines,
  techHubs,
  inferTimezone: inferTimezoneProp,
  loadGitMapCartography: loadGitMapCartographyProp,
  geocodeCache,
  insightCache,
  getLangColor,
}) {
  const CITY_COORDS = cityCoords || EMPTY_CITY_COORDS;
  const COUNTRY_DEV_DATA = countryDevData || DEFAULT_COUNTRY_DEV_DATA;
  const GITMAP_REGION_BASELINES = regionBaselines || DEFAULT_REGION_BASELINES;
  const GITMAP_TECH_HUBS = Array.isArray(techHubs) ? techHubs : EMPTY_TECH_HUBS;
  const inferTimezone = useMemo(
    () => (typeof inferTimezoneProp === "function" ? inferTimezoneProp : (() => "UTC")),
    [inferTimezoneProp],
  );
  const loadGitMapCartography = useMemo(
    () => (typeof loadGitMapCartographyProp === "function"
      ? loadGitMapCartographyProp
      : (async () => ({ features: [], nameById: new Map() }))),
    [loadGitMapCartographyProp],
  );
  const GITMAP_GEOCODE_CACHE = geocodeCache || INTERNAL_GEOCODE_CACHE;
  const GITMAP_INSIGHT_CACHE = insightCache || INTERNAL_INSIGHT_CACHE;
  const resolveLangColor = useMemo(
    () => (typeof getLangColor === "function" ? getLangColor : (() => "#00f5ff")),
    [getLangColor],
  );

  const API_URL = useMemo(() => resolveBackendApiBase(), []);
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
  .gm-scan-line{position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,#ffffff,transparent);will-change:transform;animation:gm-scan-down .5s linear forwards}
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
  .gm-map-scan{position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(0,220,255,.15),transparent);will-change:transform;animation:gm-map-scan 4s linear infinite;pointer-events:none}
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

  @media (max-width:900px){
    .gm-grid3{grid-template-columns:1fr;}
    .gm-panel{padding:16px 14px 142px}
  }
  @media (max-width:760px){
    .gm-topbar{padding:0 12px}
    .gm-title{font-size:.63rem;letter-spacing:.11em}
    .gm-tr{display:flex;flex-wrap:wrap;gap:4px 8px}
    .gm-tr > span:first-child{flex:1 1 100%;font-size:.56rem;color:rgba(0,220,255,.6)}
    .gm-tr > span:last-child{margin-left:auto}
  }
  @media (max-width:600px){
    .gm-map-wrap{height:45vw;min-height:200px}
    .gm-broadcast-visual{display:none}
    .gm-panel{padding:14px 12px 158px}
    .gm-card{padding:12px 10px 10px}
    .gm-footer{padding:10px 12px calc(10px + env(safe-area-inset-bottom,0px));flex-direction:column;align-items:flex-start}
    .gm-footer-actions{width:100%;justify-content:flex-start}
    .gm-footer-actions .gm-btn{flex:1 1 140px}
    .gm-place{font-size:clamp(1.1rem,6vw,1.45rem)}
  }

  @keyframes gm-scan-down{from{transform:translateY(0)}to{transform:translateY(120vh)}}
  @keyframes gm-world-fade{from{opacity:0}to{opacity:.06}}
  @keyframes gm-bars{0%{transform:scaleX(.1);opacity:.25}50%{transform:scaleX(1);opacity:1}100%{transform:scaleX(.1);opacity:.25}}
  @keyframes gm-pulse{0%,100%{opacity:.3}50%{opacity:.8}}
  @keyframes gm-map-scan{0%{transform:translateY(0)}100%{transform:translateY(70vh)}}
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
  }, [loadGitMapCartography]);

  useEffect(() => {
    const timeout = setTimeout(() => setSequenceStep(1), 400);
    return () => clearTimeout(timeout);
  }, [loadGitMapCartography]);

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
  }, [loadGitMapCartography]);

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
  }, [showMainMap, geo.countryCode, inferTimezone]);

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
                        <div style={{ height: "100%", width: `${lang.pct}%`, background: `linear-gradient(90deg,${resolveLangColor(lang.label)}88,${resolveLangColor(lang.label)})`, animation: `bar-expand .8s cubic-bezier(.2,.8,.2,1) ${index * 120}ms both`, "--w": `${lang.pct}%` }} />
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


export default GitMap;
