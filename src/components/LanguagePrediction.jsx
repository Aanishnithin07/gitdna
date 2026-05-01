import { memo } from "react";

function LanguagePrediction({ prediction, onClose }) {
  if (!prediction) return null;

  const suggestions = prediction.suggestions || [];
  const currentLang = prediction.current_language || "Unknown";
  const analysis = prediction.analysis || "";

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
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "rgba(6,11,18,0.98)",
          border: "1px solid rgba(0,220,255,0.3)",
          borderRadius: "12px",
          padding: "28px",
          maxWidth: "480px",
          width: "100%",
          boxShadow: "0 0 40px rgba(0,220,255,0.2)",
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
          // NEXT LANGUAGE
        </div>

        <div
          style={{
            fontFamily: "Share Tech Mono, monospace",
            fontSize: "0.7rem",
            color: "rgba(200,232,255,0.6)",
            marginBottom: "16px",
          }}
        >
          Current primary: <span style={{ color: "#fff" }}>{currentLang}</span>
        </div>

        {analysis && (
          <div
            style={{
              fontFamily: "Share Tech Mono, monospace",
              fontSize: "0.72rem",
              color: "rgba(200,232,255,0.7)",
              marginBottom: "20px",
              lineHeight: 1.5,
            }}
          >
            {analysis}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.lang || index}
              style={{
                background: "rgba(4,14,26,0.9)",
                border: `1px solid rgba(0,220,255,${0.15 + index * 0.1})`,
                borderRadius: "8px",
                padding: "14px 16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                <div
                  style={{
                    fontFamily: "Orbitron, monospace",
                    fontSize: "0.85rem",
                    color: "#fff",
                  }}
                >
                  {suggestion.lang}
                </div>
                <div
                  style={{
                    fontFamily: "Orbitron, monospace",
                    fontSize: "0.75rem",
                    color: suggestion.score >= 80 ? "#39ff14" : suggestion.score >= 65 ? "#ffb300" : "#ff4545",
                  }}
                >
                  {suggestion.score}% match
                </div>
              </div>
              <div
                style={{
                  fontFamily: "Share Tech Mono, monospace",
                  fontSize: "0.65rem",
                  color: "rgba(200,232,255,0.5)",
                  lineHeight: 1.4,
                }}
              >
                {suggestion.reason}
              </div>
              <div
                style={{
                  marginTop: "8px",
                  height: "3px",
                  background: "rgba(0,220,255,0.1)",
                  borderRadius: "2px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${suggestion.score}%`,
                    background: suggestion.score >= 80 ? "#39ff14" : suggestion.score >= 65 ? "#ffb300" : "#00dcff",
                    borderRadius: "2px",
                  }}
                />
              </div>
            </div>
          ))}
        </div>

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
            fontSize: "0.7rem",
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

export default memo(LanguagePrediction);