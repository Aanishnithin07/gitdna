import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import html2canvas from "html2canvas";

const BALATHARUNR_HANDLE = "balatharunr";
const clampNumber = (value, min, max) => Math.min(max, Math.max(min, value));

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
                  ? <img src={user.avatar_url} alt={`${user?.login || "user"} avatar`} width="320" height="192" loading="lazy" decoding="async" onError={(event) => { event.currentTarget.style.visibility = "hidden"; }} />
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


export default TradingCard;
