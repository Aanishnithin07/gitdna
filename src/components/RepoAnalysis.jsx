import { useMemo, useState } from "react";
import { createPortal } from "react-dom";

const REPO_ANALYSIS_STYLES = `
.ra-overlay{position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,0.95);overflow:auto;color:#dff7ff}
.ra-overlay::before{content:'';position:fixed;inset:0;background-image:linear-gradient(rgba(0,220,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(0,220,255,.05) 1px,transparent 1px);background-size:42px 42px;opacity:.15;pointer-events:none}
.ra-header{position:sticky;top:0;z-index:10;background:rgba(6,11,18,0.95);backdrop-filter:blur(10px);padding:20px 24px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(0,220,255,0.2)}
.ra-title{font-family:'Orbitron',monospace;font-size:1.1rem;letter-spacing:.15em;color:#00dcff;text-shadow:0 0 20px rgba(0,220,255,0.4)}
.ra-exit{background:transparent;border:1px solid rgba(0,220,255,0.35);color:rgba(0,220,255,0.7);font-family:'Orbitron',monospace;font-size:.7rem;letter-spacing:.1em;padding:8px 14px;cursor:pointer}
.ra-exit:hover{border-color:rgba(0,220,255,0.7);color:#00dcff}
.ra-content{padding:32px 24px 60px;max-width:1100px;margin:0 auto}
.ra-user-row{display:flex;align-items:center;gap:14px;margin-bottom:28px}
.ra-avatar{width:48px;height:48px;border-radius:50%;border:1px solid rgba(0,220,255,0.5)}
.ra-username{font-family:'Orbitron',monospace;font-size:1rem;color:#00dcff}
.ra-stats-row{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:28px}
.ra-stat{background:rgba(4,14,26,0.9);border:1px solid rgba(0,220,255,0.2);border-radius:6px;padding:14px 18px;flex:1;min-width:120px}
.ra-stat-label{font-family:'Share Tech Mono',monospace;font-size:.58rem;letter-spacing:.15em;color:rgba(0,220,255,0.5);margin-bottom:6px}
.ra-stat-value{font-family:'Orbitron',monospace;font-size:1.4rem;color:#fff}
.ra-stat-sub{font-family:'Share Tech Mono',monospace;font-size:.6rem;color:rgba(200,232,255,0.5);margin-top:4px}
.ra-section-title{font-family:'Share Tech Mono',monospace;font-size:.65rem;letter-spacing:.2em;color:rgba(0,220,255,0.6);margin-bottom:16px;display:flex;align-items:center;gap:10px}
.ra-section-title::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,rgba(0,220,255,0.3),transparent)}
.ra-tabs{display:flex;gap:8px;margin-bottom:24px}
.ra-tab{padding:10px 20px;background:rgba(4,14,26,0.9);border:1px solid rgba(0,220,255,0.2);color:rgba(200,232,255,0.6);font-family:'Share Tech Mono',monospace;font-size:.7rem;letter-spacing:.1em;cursor:pointer;transition:all .2s ease;border-radius:4px}
.ra-tab:hover{border-color:rgba(0,220,255,0.5);color:#00dcff}
.ra-tab.active{background:rgba(0,220,255,0.15);border-color:#00dcff;color:#00dcff}
.ra-repo-list{display:flex;flex-direction:column;gap:12px}
.ra-repo-card{background:rgba(4,14,26,0.9);border:1px solid rgba(0,220,255,0.15);border-radius:8px;padding:16px;transition:all .2s ease}
.ra-repo-card:hover{border-color:rgba(0,220,255,0.4);box-shadow:0 0 20px rgba(0,220,255,0.1)}
.ra-repo-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;gap:12px}
.ra-repo-name{font-family:'Orbitron',monospace;font-size:.9rem;color:#fff;word-break:break-all}
.ra-repo-url{font-family:'Share Tech Mono',monospace;font-size:.6rem;color:rgba(0,220,255,0.5);text-decoration:none;margin-left:8px}
.ra-repo-url:hover{color:#00dcff}
.ra-repo-lang{display:inline-flex;align-items:center;gap:6px;font-family:'Share Tech Mono',monospace;font-size:.65rem;color:rgba(200,232,255,0.7);margin-bottom:10px}
.ra-lang-dot{width:10px;height:10px;border-radius:50%;display:inline-block}
.ra-repo-stats{display:flex;gap:16px;flex-wrap:wrap}
.ra-repo-stat{display:flex;align-items:center;gap:4px;font-family:'Share Tech Mono',monospace;font-size:.65rem;color:rgba(200,232,255,0.6)}
.ra-repo-stat svg{opacity:.6}
.ra-repo-desc{font-family:'Share Tech Mono',monospace;font-size:.68rem;color:rgba(200,232,255,0.5);margin-top:10px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.ra-status-badge{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:12px;font-family:'Share Tech Mono',monospace;font-size:.6rem;letter-spacing:.05em}
.ra-status-maintained{background:rgba(57,255,20,0.15);color:#39ff14;border:1px solid rgba(57,255,20,0.3)}
.ra-status-abandoned{background:rgba(255,69,69,0.15);color:#ff4545;border:1px solid rgba(255,69,69,0.3)}
.ra-status-active{background:rgba(0,220,255,0.15);color:#00dcff;border:1px solid rgba(0,220,255,0.3)}
.ra-health-bar{display:flex;align-items:center;gap:8px;margin:10px 0}
.ra-health-label{font-family:'Share Tech Mono',monospace;font-size:.6rem;color:rgba(200,232,255,0.5);width:60px}
.ra-health-track{flex:1;height:4px;background:rgba(0,220,255,0.1);border-radius:2px;overflow:hidden}
.ra-health-fill{height:100%;border-radius:2px;transition:width .3s ease}
.ra-health-value{font-family:'Orbitron',monospace;font-size:.65rem;color:#fff;width:35px;text-align:right}
.ra-topics{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
.ra-topic{background:rgba(0,220,255,0.08);border:1px solid rgba(0,220,255,0.2);border-radius:4px;padding:2px 8px;font-family:'Share Tech Mono',monospace;font-size:.55rem;color:rgba(0,220,255,0.6)}
.ra-empty{text-align:center;padding:40px;font-family:'Share Tech Mono',monospace;font-size:.8rem;color:rgba(200,232,255,0.4)}
@keyframes ra-fade-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
.ra-stat{animation:ra-fade-in .4s ease forwards}
.ra-repo-card{animation:ra-fade-in .4s ease forwards}
`;

function RepoAnalysis({ repos, user, onClose }) {
  const [activeTab, setActiveTab] = useState("all");

  const { categorized, stats, totalStars, totalForks } = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

    const categories = {
      maintained: [],
      needsAttention: [],
      abandoned: [],
      archived: [],
      forked: [],
    };

    let totalStarsCount = 0;
    let totalForksCount = 0;

    if (!Array.isArray(repos)) {
      return { categorized: categories, stats: { total: 0, active30d: 0, active90d: 0, stale: 0, archived: 0, forked: 0 }, totalStars: 0, totalForks: 0 };
    }

    for (const repo of repos) {
      const pushedAt = repo?.pushed_at;
      const pushedDate = pushedAt ? new Date(pushedAt) : null;
      const stars = repo?.stargazers_count || 0;
      const forks = repo?.forks_count || 0;

      totalStarsCount += stars;
      totalForksCount += forks;

      const repoData = {
        name: repo?.name || "Unknown",
        fullName: repo?.full_name || repo?.name || "Unknown",
        url: repo?.html_url || "#",
        description: repo?.description || null,
        language: repo?.language || null,
        stars,
        forks,
        pushedAt: pushedAt,
        pushedDate,
        sizeKb: repo?.size || 0,
        openIssues: repo?.open_issues_count || 0,
        topics: Array.isArray(repo?.topics) ? repo.topics : [],
        isArchived: repo?.archived || false,
        isFork: repo?.fork || false,
        createdAt: repo?.created_at || null,
      };

      if (repoData.isArchived) {
        categories.archived.push({ ...repoData, status: "archived", healthScore: 0 });
      } else if (repoData.isFork) {
        categories.forked.push({ ...repoData, status: "forked", healthScore: 30 });
      } else if (pushedDate && pushedDate >= thirtyDaysAgo) {
        const issueFactor = Math.max(0, 20 - Math.min(repoData.openIssues * 2, 20));
        const recencyFactor = 40;
        const sizeFactor = Math.min(repoData.sizeKb / 1000, 20);
        const healthScore = Math.min(100, recencyFactor + issueFactor + sizeFactor + 20);
        categories.maintained.push({ ...repoData, status: "maintained", healthScore });
      } else if (pushedDate && pushedDate >= ninetyDaysAgo) {
        const issueFactor = Math.max(0, 15 - Math.min(repoData.openIssues * 1.5, 15));
        const recencyFactor = 25;
        const sizeFactor = Math.min(repoData.sizeKb / 1000, 15);
        const healthScore = Math.min(100, recencyFactor + issueFactor + sizeFactor + 15);
        categories.needsAttention.push({ ...repoData, status: "needs_attention", healthScore });
      } else if (pushedDate && pushedDate >= sixMonthsAgo) {
        const recencyFactor = 10;
        const healthScore = Math.min(100, recencyFactor + 10);
        categories.needsAttention.push({ ...repoData, status: "needs_attention", healthScore });
      } else {
        const healthScore = pushedDate ? 15 : 5;
        categories.abandoned.push({ ...repoData, status: "abandoned", healthScore });
      }
    }

    return {
      categorized,
      stats: {
        total: repos.length,
        active30d: categories.maintained.length,
        active90d: categories.needsAttention.length,
        stale: categories.abandoned.length,
        archived: categories.archived.length,
        forked: categories.forked.length,
      },
      totalStars: totalStarsCount,
      totalForks: totalForksCount,
    };
  }, [repos]);

  const getHealthColor = (score) => {
    if (score >= 70) return "#39ff14";
    if (score >= 40) return "#ffb300";
    return "#ff4545";
  };

  const getLangColor = (lang) => {
    const colors = {
      JavaScript: "#f1e05a", TypeScript: "#3178c6", Python: "#3572A5",
      Rust: "#dea584", Go: "#00ADD8", Java: "#b07219",
      "C++": "#f34b7d", C: "#888888", Ruby: "#701516",
      PHP: "#4F5D95", Swift: "#F05138", Kotlin: "#A97BFF",
    };
    return colors[lang] || "#00dcff";
  };

  const filteredRepos = useMemo(() => {
    switch (activeTab) {
      case "maintained": return categorized.maintained;
      case "attention": return categorized.needsAttention;
      case "abandoned": return categorized.abandoned;
      case "archived": return categorized.archived;
      case "forked": return categorized.forked;
      default: return [...categorized.maintained, ...categorized.needsAttention, ...categorized.abandoned, ...categorized.archived, ...categorized.forked];
    }
  }, [activeTab, categorized]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "maintained": return <span className="ra-status-badge ra-status-maintained">● MAINTAINED</span>;
      case "needs_attention": return <span className="ra-status-badge ra-status-active">◐ NEEDS ATTENTION</span>;
      case "abandoned": return <span className="ra-status-badge ra-status-abandoned">○ ABANDONED</span>;
      case "archived": return <span className="ra-status-badge" style={{ background: "rgba(128,128,128,0.15)", color: "#888", border: "1px solid rgba(128,128,128,0.3)" }}>▣ ARCHIVED</span>;
      case "forked": return <span className="ra-status-badge" style={{ background: "rgba(255,180,0,0.15)", color: "#ffb300", border: "1px solid rgba(255,180,0,0.3)" }}>⑂ FORKED</span>;
      default: return null;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "Never";
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 30) return `${diffDays}d ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
    return `${Math.floor(diffDays / 365)}y ago`;
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="ra-overlay">
      <style>{REPO_ANALYSIS_STYLES}</style>

      <div className="ra-header">
        <div className="ra-title">// REPOSITORY ANALYSIS</div>
        <button className="ra-exit" onClick={onClose}>✕ CLOSE</button>
      </div>

      <div className="ra-content">
        <div className="ra-user-row">
          {user?.avatar_url && (
            <img className="ra-avatar" src={user.avatar_url} alt="" width="48" height="48" loading="lazy" />
          )}
          <div className="ra-username">@{user?.login || "unknown"}'s repositories</div>
        </div>

        <div className="ra-stats-row">
          <div className="ra-stat">
            <div className="ra-stat-label">TOTAL REPOS</div>
            <div className="ra-stat-value">{stats.total}</div>
            <div className="ra-stat-sub">public repos</div>
          </div>
          <div className="ra-stat">
            <div className="ra-stat-label">MAINTAINED</div>
            <div className="ra-stat-value" style={{ color: "#39ff14" }}>{stats.active30d}</div>
            <div className="ra-stat-sub">active &lt;30d</div>
          </div>
          <div className="ra-stat">
            <div className="ra-stat-label">NEEDS WORK</div>
            <div className="ra-stat-value" style={{ color: "#00dcff" }}>{stats.active90d}</div>
            <div className="ra-stat-sub">active 30-90d</div>
          </div>
          <div className="ra-stat">
            <div className="ra-stat-label">ABANDONED</div>
            <div className="ra-stat-value" style={{ color: "#ff4545" }}>{stats.stale}</div>
            <div className="ra-stat-sub">stale 180d+</div>
          </div>
          <div className="ra-stat">
            <div className="ra-stat-label">TOTAL STARS</div>
            <div className="ra-stat-value">{totalStars.toLocaleString()}</div>
            <div className="ra-stat-sub">across all repos</div>
          </div>
          <div className="ra-stat">
            <div className="ra-stat-label">TOTAL FORKS</div>
            <div className="ra-stat-value">{totalForks.toLocaleString()}</div>
            <div className="ra-stat-sub">across all repos</div>
          </div>
        </div>

        <div className="ra-tabs">
          <button className={`ra-tab${activeTab === "all" ? " active" : ""}`} onClick={() => setActiveTab("all")}>ALL ({stats.total})</button>
          <button className={`ra-tab${activeTab === "maintained" ? " active" : ""}`} onClick={() => setActiveTab("maintained")}>MAINTAINED ({stats.active30d})</button>
          <button className={`ra-tab${activeTab === "attention" ? " active" : ""}`} onClick={() => setActiveTab("attention")}>NEEDS ATTENTION ({stats.active90d})</button>
          <button className={`ra-tab${activeTab === "abandoned" ? " active" : ""}`} onClick={() => setActiveTab("abandoned")}>ABANDONED ({stats.stale})</button>
          {stats.archived > 0 && <button className={`ra-tab${activeTab === "archived" ? " active" : ""}`} onClick={() => setActiveTab("archived")}>ARCHIVED ({stats.archived})</button>}
          {stats.forked > 0 && <button className={`ra-tab${activeTab === "forked" ? " active" : ""}`} onClick={() => setActiveTab("forked")}>FORKED ({stats.forked})</button>}
        </div>

        <div className="ra-section-title">REPOSITORY DETAILS</div>

        {filteredRepos.length === 0 ? (
          <div className="ra-empty">No repositories in this category</div>
        ) : (
          <div className="ra-repo-list">
            {filteredRepos.map((repo) => (
              <div key={repo.name} className="ra-repo-card">
                <div className="ra-repo-header">
                  <div>
                    <div className="ra-repo-name">{repo.name}</div>
                    <a className="ra-repo-url" href={repo.url} target="_blank" rel="noopener noreferrer">
                      ↗ {repo.fullName}
                    </a>
                  </div>
                  {getStatusBadge(repo.status)}
                </div>

                {repo.language && (
                  <div className="ra-repo-lang">
                    <span className="ra-lang-dot" style={{ background: getLangColor(repo.language) }} />
                    {repo.language}
                  </div>
                )}

                {repo.status !== "archived" && repo.status !== "forked" && (
                  <div className="ra-health-bar">
                    <span className="ra-health-label">HEALTH</span>
                    <div className="ra-health-track">
                      <div className="ra-health-fill" style={{ width: `${repo.healthScore}%`, background: getHealthColor(repo.healthScore) }} />
                    </div>
                    <span className="ra-health-value">{repo.healthScore}%</span>
                  </div>
                )}

                <div className="ra-repo-stats">
                  <div className="ra-repo-stat">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/></svg>
                    {repo.stars.toLocaleString()}
                  </div>
                  <div className="ra-repo-stat">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75v-.878a2.25 2.25 0 111.5 0v.878a2.25 2.25 0 01-2.25 2.25h-1.5v2.128a2.251 2.251 0 11-1.5 0V8.5h-1.5A2.25 2.25 0 013.5 6.25v-.878a2.25 2.25 0 111.5 0zM5 3.25a.75.75 0 10-1.5 0 .75.75 0 001.5 0zm6.75.75a.75.75 0 100-1.5.75.75 0 000 1.5zm-3 8.75a.75.75 0 10-1.5 0 .75.75 0 001.5 0z"/></svg>
                    {repo.forks.toLocaleString()}
                  </div>
                  <div className="ra-repo-stat">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M8 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/><path d="M8 0a8 8 0 100 16A8 8 0 008 0zM1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0z"/></svg>
                    {formatDate(repo.pushedAt)}
                  </div>
                  {repo.openIssues > 0 && (
                    <div className="ra-repo-stat">
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M8 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/><path d="M8 0a8 8 0 100 16A8 8 0 008 0zM1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0z"/></svg>
                      {repo.openIssues} issues
                    </div>
                  )}
                </div>

                {repo.topics.length > 0 && (
                  <div className="ra-topics">
                    {repo.topics.slice(0, 5).map((topic) => (
                      <span key={topic} className="ra-topic">{topic}</span>
                    ))}
                    {repo.topics.length > 5 && <span className="ra-topic">+{repo.topics.length - 5}</span>}
                  </div>
                )}

                {repo.description && (
                  <div className="ra-repo-desc">{repo.description}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

export default RepoAnalysis;