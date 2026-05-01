import { memo } from "react";

function DeveloperMatcher({ match, user, onClose }) {
  if (!match) return null;

  const suggestions = match.suggestions || [];
  const profile = match.user_profile || {};
  const langSynergy = match.language_synergy || "";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9998,
        background: "rgba(0,0,0,0.95)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        overflow: "auto",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "rgba(6,11,18,0.98)",
          border: "1px solid rgba(0,220,255,0.3)",
          borderRadius: "12px",
          padding: "28px",
          maxWidth: "580px",
          width: "100%",
          boxShadow: "0 0 40px rgba(0,220,255,0.2)",
          maxHeight: "90vh",
          overflow: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            fontFamily: "Orbitron, monospace",
            fontSize: "0.9rem",
            letterSpacing: "0.15em",
            color: "#00dcff",
            textAlign: "center",
            marginBottom: "20px",
            textShadow: "0 0 20px rgba(0,220,255,0.4)",
          }}
        >
          // DEVELOPER MATCH
        </div>

        {user?.avatar_url && (
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
            <img
              src={user.avatar_url}
              alt=""
              style={{ width: "40px", height: "40px", borderRadius: "50%", border: "1px solid rgba(0,220,255,0.5)" }}
            />
            <span style={{ fontFamily: "Orbitron, monospace", color: "#fff" }}>@{user.login}</span>
          </div>
        )}

        <div
          style={{
            background: "rgba(4,14,26,0.9)",
            border: "1px solid rgba(0,220,255,0.2)",
            borderRadius: "8px",
            padding: "14px",
            marginBottom: "16px",
          }}
        >
          <div style={{ fontFamily: "Share Tech Mono, monospace", fontSize: ".65rem", color: "rgba(200,232,255,0.5)", marginBottom: "10px", textTransform: "uppercase", letterSpacing: ".1em" }}>
            Your Profile
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {Object.entries(profile).map(([key, value]) => (
              <div
                key={key}
                style={{
                  background: "rgba(0,220,255,0.08)",
                  border: "1px solid rgba(0,220,255,0.2)",
                  borderRadius: "4px",
                  padding: "4px 10px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span style={{ fontFamily: "Share Tech Mono, monospace", fontSize: ".6rem", color: "rgba(200,232,255,0.5)" }}>
                  {key}:
                </span>
                <span style={{ fontFamily: "Orbitron, monospace", fontSize: ".75rem", color: "#fff" }}>
                  {typeof value === "number" ? value.toFixed(0) : value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {langSynergy && (
          <div
            style={{
              background: "rgba(179,71,234,0.1)",
              border: "1px solid rgba(179,71,234,0.3)",
              borderRadius: "8px",
              padding: "12px",
              marginBottom: "16px",
              fontFamily: "Share Tech Mono, monospace",
              fontSize: ".72rem",
              color: "rgba(200,232,255,0.8)",
              lineHeight: 1.5,
            }}
          >
            {langSynergy}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.type || index}
              style={{
                background: "rgba(4,14,26,0.9)",
                border: `1px solid rgba(0,220,255,${0.15 + index * 0.1})`,
                borderRadius: "8px",
                padding: "16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "rgba(0,220,255,0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.8rem",
                  }}
                >
                  {index + 1}
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: "Orbitron, monospace",
                      fontSize: ".8rem",
                      color: "#fff",
                      textTransform: "uppercase",
                    }}
                  >
                    {suggestion.type}
                  </div>
                  <div
                    style={{
                      fontFamily: "Share Tech Mono, monospace",
                      fontSize: ".65rem",
                      color: "rgba(200,232,255,0.5)",
                    }}
                  >
                    Ideal: {suggestion.ideal_trait}
                  </div>
                </div>
              </div>
              <div
                style={{
                  fontFamily: "Share Tech Mono, monospace",
                  fontSize: ".72rem",
                  color: "rgba(200,232,255,0.7)",
                  marginBottom: "8px",
                  lineHeight: 1.4,
                }}
              >
                {suggestion.description}
              </div>
              <div
                style={{
                  fontFamily: "Share Tech Mono, monospace",
                  fontSize: ".65rem",
                  color: "#00dcff",
                  fontStyle: "italic",
                }}
              >
                → {suggestion.reason}
              </div>
            </div>
          ))}
        </div>

        {match.summary && (
          <div
            style={{
              marginTop: "16px",
              padding: "12px",
              background: "rgba(0,220,255,0.05)",
              border: "1px solid rgba(0,220,255,0.2)",
              borderRadius: "6px",
              fontFamily: "Share Tech Mono, monospace",
              fontSize: ".68rem",
              color: "rgba(200,232,255,0.6)",
              lineHeight: 1.5,
            }}
          >
            {match.summary}
          </div>
        )}

        <button
          onClick={onClose}
          style={{
            marginTop: "20px",
            width: "100%",
            padding: "10px",
            background: "transparent",
            border: "1px solid rgba(0,220,255,0.35)",
            color: "rgba(0,220,255,0.7)",
            fontFamily: "Orbitron, monospace",
            fontSize: ".7rem",
            letterSpacing: "0.1em",
            cursor: "pointer",
            borderRadius: "6px",
            transition: "all .2s ease",
          }}
          onMouseEnter={(e) => {
            e.target.style.borderColor = "rgba(0,220,255,0.7)";
            e.target.style.color = "#00dcff";
          }}
          onMouseLeave={(e) => {
            e.target.style.borderColor = "rgba(0,220,255,0.35)";
            e.target.style.color = "rgba(0,220,255,0.7)";
          }}
        >
          CLOSE
        </button>
      </div>
    </div>
  );
}

export default memo(DeveloperMatcher);