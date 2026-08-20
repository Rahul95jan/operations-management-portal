const STYLES = {
  risk: { icon: "🚨", color: "#dc2626", bg: "#fef2f2", label: "Risk" },
  opportunity: { icon: "💡", color: "#b45309", bg: "#fffbeb", label: "Opportunity" },
  strength: { icon: "✅", color: "#166534", bg: "#f0fdf4", label: "Strength" },
};

export default function NPSRecommendations({ recommendations }) {
  return (
    <div
      style={{
        background: "#fff",
        padding: "20px",
        borderRadius: "12px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        marginBottom: "40px",
      }}
    >
      <h2 style={{ marginBottom: "6px" }}>🚀 Business Recommendations</h2>
      <p style={{ color: "#64748b", marginTop: 0, marginBottom: "18px" }}>
        Auto-generated from response patterns — prioritized actions for the next ops review.
      </p>

      <div className="grid">
        {recommendations.map((rec, i) => {
          const style = STYLES[rec.type] || STYLES.opportunity;

          return (
            <div key={i} className="card" style={{ borderLeftColor: style.color, background: style.bg }}>
              <div className="cardHeader">
                <span>{style.icon}</span>
                <span className="label" style={{ color: style.color }}>{style.label}</span>
              </div>
              <h4 className="title">{rec.title}</h4>
              <p className="text">{rec.text}</p>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 16px;
        }

        .card {
          border-left: 4px solid;
          border-radius: 10px;
          padding: 16px;
        }

        .cardHeader {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .title {
          margin: 0 0 6px;
          font-size: 15px;
          color: #0f172a;
        }

        .text {
          margin: 0;
          font-size: 13px;
          color: #475569;
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
}
