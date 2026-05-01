import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

const HEATMAP_PORTAL_STYLES = `
.hm-overlay{position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,0.95);overflow:auto;color:#dff7ff}
.hm-overlay::before{content:'';position:fixed;inset:0;background-image:linear-gradient(rgba(0,220,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(0,220,255,.05) 1px,transparent 1px);background-size:42px 42px;opacity:.15;pointer-events:none}
.hm-header{position:sticky;top:0;z-index:10;background:rgba(6,11,18,0.95);backdrop-filter:blur(10px);padding:20px 24px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(0,220,255,0.2)}
.hm-title{font-family:'Orbitron',monospace;font-size:1.1rem;letter-spacing:.15em;color:#00dcff;text-shadow:0 0 20px rgba(0,220,255,0.4)}
.hm-exit{background:transparent;border:1px solid rgba(0,220,255,0.35);color:rgba(0,220,255,0.7);font-family:'Orbitron',monospace;font-size:.7rem;letter-spacing:.1em;padding:8px 14px;cursor:pointer}
.hm-exit:hover{border-color:rgba(0,220,255,0.7);color:#00dcff}
.hm-content{padding:32px 24px 60px;max-width:900px;margin:0 auto}
.hm-user-row{display:flex;align-items:center;gap:14px;margin-bottom:28px}
.hm-avatar{width:48px;height:48px;border-radius:50%;border:1px solid rgba(0,220,255,0.5)}
.hm-username{font-family:'Orbitron',monospace;font-size:1rem;color:#00dcff}
.hm-stats-row{display:flex;gap:24px;flex-wrap:wrap;margin-bottom:28px}
.hm-stat{background:rgba(4,14,26,0.9);border:1px solid rgba(0,220,255,0.2);border-radius:6px;padding:14px 18px;flex:1;min-width:140px}
.hm-stat-label{font-family:'Share Tech Mono',monospace;font-size:.58rem;letter-spacing:.15em;color:rgba(0,220,255,0.5);margin-bottom:6px}
.hm-stat-value{font-family:'Orbitron',monospace;font-size:1.4rem;color:#fff}
.hm-stat-sub{font-family:'Share Tech Mono',monospace;font-size:.6rem;color:rgba(200,232,255,0.5);margin-top:4px}
.hm-section-title{font-family:'Share Tech Mono',monospace;font-size:.65rem;letter-spacing:.2em;color:rgba(0,220,255,0.6);margin-bottom:16px;display:flex;align-items:center;gap:10px}
.hm-section-title::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,rgba(0,220,255,0.3),transparent)}
.hm-heatmap-wrap{overflow-x:auto;padding-bottom:16px}
.hm-heatmap{display:flex;gap:3px;align-items:flex-start;min-width:max-content}
.hm-week{display:flex;flex-direction:column;gap:3px}
.hm-day{width:12px;height:12px;border-radius:2px;background:rgba(0,220,255,0.08);transition:all .15s ease;cursor:pointer;position:relative}
.hm-day:hover{transform:scale(1.4);z-index:5}
.hm-day.l0{background:rgba(0,220,255,0.1)}
.hm-day.l1{background:rgba(0,220,255,0.25)}
.hm-day.l2{background:rgba(0,220,255,0.45)}
.hm-day.l3{background:rgba(0,220,255,0.7)}
.hm-day.l4{background:#00dcff;box-shadow:0 0 8px rgba(0,220,255,0.5)}
.hm-tooltip{position:fixed;background:rgba(6,11,18,0.98);border:1px solid rgba(0,220,255,0.4);border-radius:4px;padding:8px 12px;pointer-events:none;z-index:100;font-family:'Share Tech Mono',monospace;font-size:.7rem;color:#dff7ff;white-space:nowrap;opacity:0;transition:opacity .1s}
.hm-tooltip.visible{opacity:1}
.hm-tooltip-date{color:#00dcff;margin-bottom:2px}
.hm-tooltip-count{color:#fff;font-family:'Orbitron',monospace}
.hm-legend{display:flex;align-items:center;gap:8px;margin-top:14px;justify-content:flex-end}
.hm-legend-label{font-family:'Share Tech Mono',monospace;font-size:.58rem;color:rgba(200,232,255,0.5)}
.hm-legend-scale{display:flex;gap:2px}
.hm-month-labels{display:flex;margin-bottom:6px;padding-left:0}
.hm-month-label{font-family:'Share Tech Mono',monospace;font-size:.55rem;color:rgba(0,220,255,0.4);min-width:60px;text-align:left}
.hm-day-labels{position:sticky;left:0;margin-right:6px}
.hm-day-label{font-family:'Share Tech Mono',monospace;font-size:.5rem;color:rgba(0,220,255,0.3);height:14px;line-height:14px}

@keyframes hm-fade-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
.hm-stat{animation:hm-fade-in .4s ease forwards}
.hm-stat:nth-child(1){animation-delay:0ms}
.hm-stat:nth-child(2){animation-delay:80ms}
.hm-stat:nth-child(3){animation-delay:160ms}
.hm-stat:nth-child(4){animation-delay:240ms}
.hm-stat:nth-child(5){animation-delay:320ms}
`;

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getLevel(count, max) {
  if (max === 0 || count === 0) return 0;
  const ratio = count / max;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

function ContributionHeatmap({ repos, events, user, onClose }) {
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, date: "", count: 0 });
  const overlayRef = useRef(null);

  const { commitsByDay, maxPerDay, totalCommits, longestStreak, currentStreak, weeks, monthLabels, peakDayOfWeek, avgCommitsPerActiveDay, mostActiveHour, dayOfWeekDist, hourlyDist } = useMemo(() => {
    const commitsByDayMap = {};
    const dayOfWeekCounts = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
    const hourlyCounts = {};
    const now = new Date();

    if (Array.isArray(events)) {
      for (const event of events) {
        if (event?.type !== "PushEvent") continue;
        const createdAt = event?.created_at;
        if (!createdAt) continue;

        const date = new Date(createdAt);
        const dayStr = createdAt.split("T")[0];
        const dayOfWeek = date.getDay();
        const hour = date.getHours();

        dayOfWeekCounts[dayOfWeek]++;

        if (!hourlyCounts[hour]) hourlyCounts[hour] = 0;
        hourlyCounts[hour]++;

        const commits = event?.payload?.commits;
        if (Array.isArray(commits) && commits.length > 0) {
          commitsByDayMap[dayStr] = (commitsByDayMap[dayStr] || 0) + commits.length;
        } else {
          commitsByDayMap[dayStr] = (commitsByDayMap[dayStr] || 0) + 1;
        }
      }
    }

    if (!Object.keys(commitsByDayMap).length && Array.isArray(repos)) {
      for (const repo of repos) {
        const pushedAt = repo?.pushed_at;
        if (!pushedAt) continue;
        const dayStr = pushedAt.split("T")[0];
        commitsByDayMap[dayStr] = (commitsByDayMap[dayStr] || 0) + 1;
      }
    }

    const maxVal = Math.max(...Object.values(commitsByDayMap), 0);
    const total = Object.values(commitsByDayMap).reduce((sum, v) => sum + v, 0);

    let longest = 0;
    let current = 0;
    let tempLongest = 0;

    const sortedDays = Object.keys(commitsByDayMap).sort();
    for (let i = 0; i < sortedDays.length; i++) {
      if (i === 0) {
        tempLongest = 1;
      } else {
        const prev = new Date(sortedDays[i - 1]);
        const curr = new Date(sortedDays[i]);
        const diff = (curr - prev) / (1000 * 60 * 60 * 24);
        if (diff === 1) {
          tempLongest++;
        } else {
          tempLongest = 1;
        }
      }
      longest = Math.max(longest, tempLongest);
    }

    if (sortedDays.length > 0) {
      const lastDay = new Date(sortedDays[sortedDays.length - 1]);
      const daysSinceLast = Math.floor((now - lastDay) / (1000 * 60 * 60 * 24));
      if (daysSinceLast <= 3) {
        current = tempLongest;
      }
    }

    // Peak day of week
    let peakDayIndex = 0;
    for (let i = 1; i < 7; i++) {
      if (dayOfWeekCounts[i] > dayOfWeekCounts[peakDayIndex]) {
        peakDayIndex = i;
      }
    }
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const peakDay = dayOfWeekCounts[peakDayIndex] > 0 ? dayNames[peakDayIndex] : "N/A";

    // Most active hour
    let peakHour = 0;
    for (const hour in hourlyCounts) {
      if (hourlyCounts[hour] > hourlyCounts[peakHour]) {
        peakHour = hour;
      }
    }
    const formatHour = (h) => {
      const hour = parseInt(h);
      if (hour === 0) return "12 AM";
      if (hour === 12) return "12 PM";
      return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
    };
    const mostActive = hourlyCounts[peakHour] > 0 ? formatHour(peakHour) : "N/A";

    // Avg commits per active day
    const activeDays = Object.keys(commitsByDayMap).length;
    const avgPerDay = activeDays > 0 ? (total / activeDays).toFixed(1) : "0";

    const endDate = new Date(now);
    const startDate = new Date(now);
    startDate.setFullYear(startDate.getFullYear() - 1);
    startDate.setDate(startDate.getDate() - Math.max(0, endDate.getDay()));

    const weeksArr = [];
    const monthLabelsArr = [];
    let currentDate = new Date(startDate);
    let lastMonth = -1;

    while (currentDate <= endDate) {
      const weekStart = new Date(currentDate);
      const weekDays = [];

      for (let d = 0; d < 7; d++) {
        const dayDate = new Date(weekStart);
        dayDate.setDate(weekStart.getDate() + d);

        if (dayDate > endDate) break;

        const dayStr = dayDate.toISOString().split("T")[0];
        const count = commitsByDayMap[dayStr] || 0;
        const dayOfWeek = dayDate.getDay();

        if (dayDate.getMonth() !== lastMonth) {
          lastMonth = dayDate.getMonth();
          monthLabelsArr.push({
            label: MONTH_LABELS[lastMonth],
            offset: weeksArr.length * 15,
          });
        }

        weekDays.push({
          dayStr,
          count,
          level: getLevel(count, maxVal),
          dayOfWeek,
          isToday: dayStr === now.toISOString().split("T")[0],
          isFuture: dayDate > now,
          dayName: dayNames[dayOfWeek],
          hour: formatHour(dayDate.getHours()),
        });
      }

      if (weekDays.length > 0) {
        weeksArr.push(weekDays);
      }

      currentDate.setDate(currentDate.getDate() + 7);
    }

    return {
      commitsByDay: commitsByDayMap,
      maxPerDay: maxVal,
      totalCommits: total,
      longestStreak: longest,
      currentStreak: current,
      weeks: weeksArr,
      monthLabels: monthLabelsArr,
      peakDayOfWeek: peakDay,
      avgCommitsPerActiveDay: avgPerDay,
      mostActiveHour: mostActive,
      dayOfWeekDist: dayOfWeekCounts,
      hourlyDist: hourlyCounts,
    };
  }, [events, repos]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleMouseEnter = (e, dayStr, count, dayName, hour) => {
    const rect = e.target.getBoundingClientRect();
    setTooltip({
      visible: true,
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
      date: dayStr,
      count,
      dayName,
      hour,
    });
  };

  const handleMouseLeave = () => {
    setTooltip((t) => ({ ...t, visible: false }));
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="hm-overlay" ref={overlayRef}>
      <style>{HEATMAP_PORTAL_STYLES}</style>

      <div className="hm-header">
        <div className="hm-title">// ACTIVITY HEATMAP</div>
        <button className="hm-exit" onClick={onClose}>✕ CLOSE</button>
      </div>

      <div className="hm-content">
        <div className="hm-user-row">
          {user?.avatar_url && (
            <img className="hm-avatar" src={user.avatar_url} alt="" width="48" height="48" loading="lazy" />
          )}
          <div className="hm-username">@{user?.login || "unknown"}</div>
        </div>

        <div className="hm-stats-row">
          <div className="hm-stat">
            <div className="hm-stat-label">TOTAL COMMITS</div>
            <div className="hm-stat-value">{totalCommits.toLocaleString()}</div>
            <div className="hm-stat-sub">in the last year</div>
          </div>
          <div className="hm-stat">
            <div className="hm-stat-label">BEST STREAK</div>
            <div className="hm-stat-value">{longestStreak}</div>
            <div className="hm-stat-sub">consecutive days</div>
          </div>
          <div className="hm-stat">
            <div className="hm-stat-label">CURRENT STREAK</div>
            <div className="hm-stat-value">{currentStreak}</div>
            <div className="hm-stat-sub">days active</div>
          </div>
          <div className="hm-stat">
            <div className="hm-stat-label">PEAK DAILY</div>
            <div className="hm-stat-value">{maxPerDay}</div>
            <div className="hm-stat-sub">commits in a day</div>
          </div>
          <div className="hm-stat">
            <div className="hm-stat-label">ACTIVE DAYS</div>
            <div className="hm-stat-value">{Object.keys(commitsByDay).length}</div>
            <div className="hm-stat-sub">with contributions</div>
          </div>
          <div className="hm-stat">
            <div className="hm-stat-label">PEAK DAY</div>
            <div className="hm-stat-value" style={{ fontSize: "1rem" }}>{peakDayOfWeek}</div>
            <div className="hm-stat-sub">most commits</div>
          </div>
          <div className="hm-stat">
            <div className="hm-stat-label">AVG/DAY</div>
            <div className="hm-stat-value">{avgCommitsPerActiveDay}</div>
            <div className="hm-stat-sub">when active</div>
          </div>
          <div className="hm-stat">
            <div className="hm-stat-label">PRIME HOUR</div>
            <div className="hm-stat-value" style={{ fontSize: "1rem" }}>{mostActiveHour}</div>
            <div className="hm-stat-sub">peak commit time</div>
          </div>
          <div className="hm-stat">
            <div className="hm-stat-label">CONSISTENCY</div>
            <div className="hm-stat-value">{Object.keys(commitsByDay).length > 0 ? Math.round((Object.keys(commitsByDay).length / 365) * 100) : 0}%</div>
            <div className="hm-stat-sub">days active/yr</div>
          </div>
        </div>

        <div className="hm-section-title">PAST 12 MONTHS</div>

        <div className="hm-heatmap-wrap">
          <div className="hm-month-labels" style={{ paddingLeft: "28px", marginBottom: "2px" }}>
            {monthLabels.map((m) => (
              <div key={m.label + m.offset} className="hm-month-label" style={{ marginLeft: `${m.offset}px` }}>
                {m.label}
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: "0" }}>
            <div className="hm-day-labels">
              {DAY_LABELS.map((d, i) => (
                <div key={d} className="hm-day-label">{i % 2 === 1 ? d : ""}</div>
              ))}
            </div>

            <div className="hm-heatmap">
              {weeks.map((week, wi) => (
                <div key={wi} className="hm-week">
                  {week.map((day, di) => (
                    <div
                      key={`${wi}-${di}`}
                      className={`hm-day${day.isFuture ? "" : ` l${day.level}`}`}
                      style={{
                        opacity: day.isFuture ? 0.2 : day.isToday ? 1 : undefined,
                      }}
                      onMouseEnter={(e) => !day.isFuture && handleMouseEnter(e, day.dayStr, day.count, day.dayName, day.hour)}
                      onMouseLeave={handleMouseLeave}
                      aria-label={`${day.dayStr}: ${day.count} commits`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="hm-legend">
          <span className="hm-legend-label">Less</span>
          <div className="hm-legend-scale">
            <div className="hm-day l0" />
            <div className="hm-day l1" />
            <div className="hm-day l2" />
            <div className="hm-day l3" />
            <div className="hm-day l4" />
          </div>
          <span className="hm-legend-label">More</span>
        </div>

        <div className="hm-section-title" style={{ marginTop: "28px" }}>WEEKLY SUMMARY</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginTop: "12px" }}>
          {(() => {
            const now = new Date();
            const last4Weeks = [];
            for (let w = 3; w >= 0; w--) {
              const weekStart = new Date(now);
              weekStart.setDate(now.getDate() - (w * 7 + 6));
              const weekEnd = new Date(now);
              weekEnd.setDate(now.getDate() - (w * 7));
              let weekTotal = 0;
              for (let d = 0; d < 7; d++) {
                const dayDate = new Date(weekStart);
                dayDate.setDate(weekStart.getDate() + d);
                const dayStr = dayDate.toISOString().split("T")[0];
                weekTotal += commitsByDay[dayStr] || 0;
              }
              last4Weeks.push({
                label: w === 0 ? "This Week" : w === 1 ? "Last Week" : `${w} Weeks Ago`,
                total: weekTotal,
              });
            }
            return last4Weeks.map((w) => (
              <div key={w.label} className="hm-stat">
                <div className="hm-stat-label">{w.label.toUpperCase()}</div>
                <div className="hm-stat-value">{w.total.toLocaleString()}</div>
                <div className="hm-stat-sub">commits</div>
              </div>
            ));
          })()}
        </div>

        <div className="hm-section-title" style={{ marginTop: "28px" }}>PATTERN INSIGHTS</div>
        <div style={{ background: "rgba(4,14,26,0.9)", border: "1px solid rgba(0,220,255,0.2)", borderRadius: "6px", padding: "16px", marginTop: "12px" }}>
          <div style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "0.72rem", color: "rgba(200,232,255,0.7)", lineHeight: "1.6" }}>
            <div style={{ marginBottom: "8px" }}>
              <span style={{ color: "#00dcff" }}>▸</span> Peak productivity on <span style={{ color: "#fff" }}>{peakDayOfWeek}</span>s — you're most consistent on this day
            </div>
            <div style={{ marginBottom: "8px" }}>
              <span style={{ color: "#00dcff" }}>▸</span> Your prime coding hour is <span style={{ color: "#fff" }}>{mostActiveHour}</span> — that's when you do your best work
            </div>
            <div style={{ marginBottom: "8px" }}>
              <span style={{ color: "#00dcff" }}>▸</span> You average <span style={{ color: "#fff" }}>{avgCommitsPerActiveDay}</span> commits per active day
            </div>
            <div>
              <span style={{ color: "#00dcff" }}>▸</span> {Object.keys(commitsByDay).length > 26 ? "Strong year!" : "Room to grow!"} You've contributed on <span style={{ color: "#fff" }}>{Object.keys(commitsByDay).length}</span> different days
            </div>
          </div>
        </div>
      </div>

      <div
        className={`hm-tooltip${tooltip.visible ? " visible" : ""}`}
        style={{
          left: `${tooltip.x}px`,
          top: `${tooltip.y}px`,
          transform: "translate(-50%, -100%)",
        }}
      >
        <div className="hm-tooltip-date">{tooltip.date}{tooltip.dayName ? ` (${tooltip.dayName})` : ""}</div>
        <div className="hm-tooltip-count">{tooltip.count} commit{tooltip.count !== 1 ? "s" : ""}</div>
        {tooltip.hour && <div style={{color:"rgba(200,232,255,0.6)",fontSize:".6rem",marginTop:"2px"}}>Around {tooltip.hour}</div>}
      </div>
    </div>,
    document.body,
  );
}

export default ContributionHeatmap;
