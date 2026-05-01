import { useMemo, createPortal } from "react";

const BURNOUT_DETAIL_STYLES = `
.bd-overlay{position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,0.95);overflow:auto;color:#dff7ff}
.bd-overlay::before{content:'';position:fixed;inset:0;background-image:linear-gradient(rgba(0,220,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(0,220,255,.05) 1px,transparent 1px);background-size:42px 42px;opacity:.15;pointer-events:none}
.bd-header{position:sticky;top:0;z-index:10;background:rgba(6,11,18,0.95);backdrop-filter:blur(10px);padding:20px 24px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(0,220,255,0.2)}
.bd-title{font-family:'Orbitron',monospace;font-size:1.1rem;letter-spacing:.15em;color:#00dcff;text-shadow:0 0 20px rgba(0,220,255,0.4)}
.bd-exit{background:transparent;border:1px solid rgba(0,220,255,0.35);color:rgba(0,220,255,0.7);font-family:'Orbitron',monospace;font-size:.7rem;letter-spacing:.1em;padding:8px 14px;cursor:pointer}
.bd-exit:hover{border-color:rgba(0,220,255,0.7);color:#00dcff}
.bd-content{padding:32px 24px 60px;max-width:800px;margin:0 auto}
.bd-user-row{display:flex;align-items:center;gap:14px;margin-bottom:28px}
.bd-avatar{width:48px;height:48px;border-radius:50%;border:1px solid rgba(0,220,255,0.5)}
.bd-username{font-family:'Orbitron',monospace;font-size:1rem;color:#00dcff}
.bd-score-display{display:flex;align-items:center;gap:24px;margin-bottom:28px;background:rgba(4,14,26,0.9);border:1px solid rgba(0,220,255,0.2);border-radius:8px;padding:20px}
.bd-score-number{font-family:'Orbitron',monospace;font-size:3rem;font-weight:900;color:#fff;text-shadow:0 0 20px currentColor}
.bd-score-details{flex:1}
.bd-tier-badge{display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:20px;font-family:'Share Tech Mono',monospace;font-size:.7rem;letter-spacing:.1em;margin-bottom:6px}
.bd-tier-critical{background:rgba(255,69,69,0.2);color:#ff4545;border:1px solid rgba(255,69,69,0.4)}
.bd-tier-elevated{background:rgba(255,179,0,0.2);color:#ffb300;border:1px solid rgba(255,179,0,0.4)}
.bd-tier-optimal{background:rgba(0,220,255,0.2);color:#00dcff;border:1px solid rgba(0,220,255,0.4)}
.bd-tier-balanced{background:rgba(57,255,20,0.2);color:#39ff14;border:1px solid rgba(57,255,20,0.4)}
.bd-score-desc{font-family:'Share Tech Mono',monospace;font-size:.68rem;color:rgba(200,232,255,0.5);line-height:1.5}
.bd-section-title{font-family:'Share Tech Mono',monospace;font-size:.65rem;letter-spacing:.2em;color:rgba(0,220,255,0.6);margin-bottom:16px;display:flex;align-items:center;gap:10px}
.bd-section-title::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,rgba(0,220,255,0.3),transparent)}
.bd-factor-list{display:flex;flex-direction:column;gap:12px;margin-bottom:28px}
.bd-factor{background:rgba(4,14,26,0.9);border:1px solid rgba(0,220,255,0.15);border-radius:8px;padding:16px}
.bd-factor-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
.bd-factor-name{font-family:'Share Tech Mono',monospace;font-size:.75rem;color:rgba(200,232,255,0.8)}
.bd-factor-impact{display:flex;align-items:center;gap:6px;font-family:'Share Tech Mono',monospace;font-size:.7rem}
.bd-factor-impact.risk{color:#ff4545}
.bd-factor-impact.healthy{color:#39ff14}
.bd-factor-bar{height:6px;background:rgba(0,220,255,0.1);border-radius:3px;overflow:hidden}
.bd-factor-fill{height:100%;border-radius:3px;transition:width .3s ease}
.bd-factor-fill.risk{background:#ff4545}
.bd-factor-fill.healthy{background:#39ff14}
.bd-factor-fill.neutral{background:#00dcff}
.bd-recommendation{background:linear-gradient(135deg,rgba(0,220,255,0.1),rgba(179,71,234,0.1));border:1px solid rgba(0,220,255,0.3);border-radius:8px;padding:20px;margin-bottom:28px}
.bd-recommendation-title{font-family:'Orbitron',monospace;font-size:.8rem;color:#00dcff;margin-bottom:10px;letter-spacing:.1em}
.bd-recommendation-text{font-family:'Share Tech Mono',monospace;font-size:.75rem;color:rgba(200,232,255,0.8);line-height:1.6}
.bd-timeline{display:grid;grid-template-columns:repeat(7,1fr);gap:8px;margin-bottom:28px}
.bd-timeline-day{text-align:center}
.bd-timeline-bar{flex:1;min-height:60px;background:rgba(4,14,26,0.9);border:1px solid rgba(0,220,255,0.15);border-radius:6px;display:flex;flex-direction:column;align-items:center;padding:8px 4px;gap:6px}
.bd-timeline-bar.risk-high{border-color:rgba(255,69,69,0.4);background:rgba(255,69,69,0.1)}
.bd-timeline-bar.risk-medium{border-color:rgba(255,179,0,0.4);background:rgba(255,179,0,0.1)}
.bd-timeline-bar.healthy{border-color:rgba(57,255,20,0.4);background:rgba(57,255,20,0.1)}
.bd-timeline-label{font-family:'Share Tech Mono',monospace;font-size:.55rem;color:rgba(200,232,255,0.5);text-transform:uppercase}
.bd-timeline-value{font-family:'Orbitron',monospace;font-size:.7rem;color:#fff}
.bd-risk-meter{display:flex;gap:16px;margin-bottom:28px;flex-wrap:wrap}
.bd-risk-item{flex:1;min-width:120px;background:rgba(4,14,26,0.9);border:1px solid rgba(0,220,255,0.15);border-radius:8px;padding:16px;text-align:center}
.bd-risk-value{font-family:'Orbitron',monospace;font-size:1.5rem;color:#fff;margin-bottom:4px}
.bd-risk-label{font-family:'Share Tech Mono',monospace;font-size:.6rem;color:rgba(200,232,255,0.5);text-transform:uppercase;letter-spacing:.1em}
.bd-disclaimer{font-family:'Share Tech Mono',monospace;font-size:.6rem;color:rgba(200,232,255,0.3);line-height:1.6;text-align:center;margin-top:20px}
@keyframes bd-fade-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
.bd-factor{animation:bd-fade-in .4s ease forwards}
.bd-score-display{animation:bd-fade-in .4s ease forwards}
`;

function BurnoutDetail({ burnoutReport, events, user, onClose }) {
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const weeklyPattern = useMemo(() => {
    const dayCounts = [0, 0, 0, 0, 0, 0, 0];
    const dayRisk = [0, 0, 0, 0, 0, 0, 0];

    if (Array.isArray(events)) {
      events.forEach((event) => {
        if (event?.type !== "PushEvent" || !event?.created_at) return;
        const date = new Date(event.created_at);
        const day = date.getDay();
        dayCounts[day]++;
        const hour = date.getHours();
        if (hour >= 22 || hour < 6) {
          dayRisk[day]++;
        }
      });
    }

    const maxDay = Math.max(...dayCounts, 1);
    return dayNames.map((name, i) => ({
      name,
      count: dayCounts[i],
      riskRatio: dayCounts[i] > 0 ? dayRisk[i] / dayCounts[i] : 0,
      intensity: dayCounts[i] / maxDay,
      isWeekend: i === 0 || i === 6,
    }));
  }, [events]);

  const riskMetrics = useMemo(() => {
    if (!burnoutReport) return null;
    const score = burnoutReport.score || 50;
    return {
      workLifeBalance: score < 35 ? "Good" : score < 55 ? "Fair" : score < 75 ? "Poor" : "Critical",
      paceSustainability: score < 40 ? "Sustainable" : score < 60 ? "High" : score < 80 ? "Very High" : "Excessive",
      recoveryIndicator: score > 60 ? "Needs Rest" : score > 40 ? "Moderate" : "Good",
      commitQuality: score < 50 ? "High" : score < 70 ? "Variable" : "Stressed",
    };
  }, [burnoutReport]);

  const factors = useMemo(() => {
    if (!burnoutReport?.signals) return [];
    return burnoutReport.signals.slice(0, 8).map((signal, i) => ({
      name: signal.text.split(" - ")[0] || signal.text.split(" — ")[0] || signal.text.substring(0, 40),
      impact: signal.type === "risk" ? "+" : "-",
      type: signal.type,
      strength: signal.type === "risk" ? Math.min(100, 50 + (i * 5)) : Math.min(100, 60 - (i * 5)),
    }));
  }, [burnoutReport]);

  const getTierClass = (tier) => {
    switch (tier) {
      case "CRITICAL": return "bd-tier-critical";
      case "ELEVATED": return "bd-tier-elevated";
      case "OPTIMAL": return "bd-tier-optimal";
      default: return "bd-tier-balanced";
    }
  };

  const getTierDescription = (tier) => {
    switch (tier) {
      case "CRITICAL": return "Immediate attention needed. Consider taking a break.";
      case "ELEVATED": return "Elevated stress detected. Monitor and consider adjustments.";
      case "OPTIMAL": return "Good balance detected. Keep maintaining this pace.";
      default: return "Excellent work-life balance. Your current pattern is sustainable.";
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="bd-overlay">
      <style>{BURNOUT_DETAIL_STYLES}</style>

      <div className="bd-header">
        <div className="bd-title">// BURNOUT ANALYSIS</div>
        <button className="bd-exit" onClick={onClose}>✕ CLOSE</button>
      </div>

      <div className="bd-content">
        <div className="bd-user-row">
          {user?.avatar_url && (
            <img className="bd-avatar" src={user.avatar_url} alt="" width="48" height="48" loading="lazy" />
          )}
          <div className="bd-username">@{user?.login || "unknown"}'s burnout analysis</div>
        </div>

        <div className="bd-score-display">
          <div
            className="bd-score-number"
            style={{ color: burnoutReport?.color || "#00dcff" }}
          >
            {burnoutReport?.score || 50}
          </div>
          <div className="bd-score-details">
            <div className={`bd-tier-badge ${getTierClass(burnoutReport?.tier)}`}>
              {burnoutReport?.tier || "BALANCED"} RISK
            </div>
            <div className="bd-score-desc">{getTierDescription(burnoutReport?.tier)}</div>
          </div>
        </div>

        <div className="bd-section-title">WEEKLY COMMIT PATTERNS</div>
        <div className="bd-timeline">
          {weeklyPattern.map((day) => (
            <div key={day.name} className="bd-timeline-day">
              <div
                className={`bd-timeline-bar ${
                  day.riskRatio > 0.4 ? "risk-high" :
                  day.riskRatio > 0.2 ? "risk-medium" :
                  day.count > 0 ? "healthy" : ""
                }`}
              >
                <div className="bd-timeline-value" style={{ color: day.count > 0 ? "#fff" : "rgba(200,232,255,0.3)" }}>
                  {day.count}
                </div>
                <div
                  className="bd-timeline-label"
                  style={{ color: day.isWeekend ? "rgba(255,179,0,0.6)" : "rgba(200,232,255,0.4)" }}
                >
                  {day.name}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bd-section-title">RISK METRICS</div>
        {riskMetrics && (
          <div className="bd-risk-meter">
            <div className="bd-risk-item">
              <div className="bd-risk-value" style={{ color: "#39ff14" }}>✓</div>
              <div className="bd-risk-label">Work-Life Balance</div>
              <div style={{ fontFamily: "Share Tech Mono,monospace", fontSize: ".65rem", color: "rgba(200,232,255,0.6)", marginTop: "4px" }}>{riskMetrics.workLifeBalance}</div>
            </div>
            <div className="bd-risk-item">
              <div className="bd-risk-value" style={{ color: "#ffb300" }}>⚡</div>
              <div className="bd-risk-label">Pace Level</div>
              <div style={{ fontFamily: "Share Tech Mono,monospace", fontSize: ".65rem", color: "rgba(200,232,255,0.6)", marginTop: "4px" }}>{riskMetrics.paceSustainability}</div>
            </div>
            <div className="bd-risk-item">
              <div className="bd-risk-value" style={{ color: "#00dcff" }}>◐</div>
              <div className="bd-risk-label">Recovery Need</div>
              <div style={{ fontFamily: "Share Tech Mono,monospace", fontSize: ".65rem", color: "rgba(200,232,255,0.6)", marginTop: "4px" }}>{riskMetrics.recoveryIndicator}</div>
            </div>
            <div className="bd-risk-item">
              <div className="bd-risk-value" style={{ color: "#ff4545" }}>!</div>
              <div className="bd-risk-label">Commit Quality</div>
              <div style={{ fontFamily: "Share Tech Mono,monospace", fontSize: ".65rem", color: "rgba(200,232,255,0.6)", marginTop: "4px" }}>{riskMetrics.commitQuality}</div>
            </div>
          </div>
        )}

        <div className="bd-section-title">CONTRIBUTING FACTORS</div>
        <div className="bd-factor-list">
          {factors.map((factor, index) => (
            <div key={index} className="bd-factor">
              <div className="bd-factor-header">
                <span className="bd-factor-name">{factor.name}</span>
                <span className={`bd-factor-impact ${factor.type}`}>
                  {factor.impact === "+" ? "⚠ Risk" : "✓ Healthy"}
                </span>
              </div>
              <div className="bd-factor-bar">
                <div
                  className={`bd-factor-fill ${factor.type}`}
                  style={{ width: `${factor.strength}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {burnoutReport?.recommendation && (
          <div className="bd-recommendation">
            <div className="bd-recommendation-title">// RECOMMENDATION</div>
            <div className="bd-recommendation-text">{burnoutReport.recommendation}</div>
          </div>
        )}

        <div className="bd-disclaimer">
          Pattern analysis based on public GitHub activity only. This is not medical advice.
          <br />
          For concerns about burnout, consult a healthcare professional.
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default BurnoutDetail;