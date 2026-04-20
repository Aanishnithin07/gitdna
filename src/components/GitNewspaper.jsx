import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import html2canvas from "html2canvas";

const NEWSPAPER_PORTAL_STYLES = `
.np-overlay{position:fixed;inset:0;z-index:9999;background:radial-gradient(circle at 20% 0%,rgba(0,220,255,.18),transparent 45%),radial-gradient(circle at 88% 100%,rgba(255,179,0,.12),transparent 40%),#05070c;overflow:auto;padding:26px 14px calc(132px + env(safe-area-inset-bottom,0px))}
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
.np-bottom-bar{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:10001;display:grid;grid-template-columns:repeat(4,minmax(130px,1fr));gap:8px;width:min(96vw,760px);padding:9px 9px calc(9px + env(safe-area-inset-bottom,0px));border-radius:14px;border:1px solid rgba(0,220,255,.35);background:linear-gradient(180deg,rgba(6,16,28,.95),rgba(4,10,18,.95));box-shadow:0 0 22px rgba(0,220,255,.24)}
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
  .np-toolbar-actions{width:100%}
  .np-corner-close{width:30px;height:30px}
  .np-bottom-bar{grid-template-columns:repeat(2,minmax(0,1fr));width:min(96vw,460px);padding:8px 8px calc(8px + env(safe-area-inset-bottom,0px));border-radius:12px;bottom:10px}
  .np-control-btn{padding:9px 10px}
  .np-control-btn.np-close-dock{max-width:none;width:100%}
}
@media (max-width:560px){
  .np-overlay{padding:14px 10px calc(176px + env(safe-area-inset-bottom,0px))}
  .np-paper{padding:14px 10px 16px}
  .np-masthead{letter-spacing:.06em}
  .np-page{padding:9px 6px 6px}
  .np-bottom-bar{grid-template-columns:1fr;width:min(96vw,340px);bottom:8px;padding:8px 8px calc(8px + env(safe-area-inset-bottom,0px))}
  .np-control-btn{width:100%}
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

const defaultClampNumber = (value, min, max) => Math.min(max, Math.max(min, value));
const defaultReadableDate = (value = Date.now()) => new Date(value).toLocaleDateString();
const defaultBuildFallback = (payload = {}, usernameHint = "developer") => ({
  headline: `GitHub Daily: ${usernameHint}`,
  subheadline: "Telemetry unavailable.",
  footerNote: "Generated from fallback edition.",
  primaryStory: "No editorial content available.",
  profileSpotlight: payload || {},
});
const defaultNormalizePayload = (payload, fallback) => payload || fallback;
const defaultBuildPages = (editionPayload) => [editionPayload];

function GitHubNewspaperPortal({
  username,
  profilePayload,
  getEdition,
  onClose,
  buildNewspaperFallback = defaultBuildFallback,
  normalizeNewspaperPayload = defaultNormalizePayload,
  buildNewspaperPages = defaultBuildPages,
  getReadableLocalDate = defaultReadableDate,
  clampNumber = defaultClampNumber,
}) {
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
    [buildNewspaperFallback, profilePayload, username],
  );
  const [edition, setEdition] = useState(fallbackEdition);

  const resolvedEdition = useMemo(
    () => normalizeNewspaperPayload(edition, fallbackEdition),
    [edition, fallbackEdition, normalizeNewspaperPayload],
  );

  const pages = useMemo(
    () => buildNewspaperPages(resolvedEdition, profilePayload),
    [buildNewspaperPages, resolvedEdition, profilePayload],
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
  }, [getEdition, profilePayload, fallbackEdition, normalizeNewspaperPayload, getReadableLocalDate]);

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


export default GitHubNewspaperPortal;
