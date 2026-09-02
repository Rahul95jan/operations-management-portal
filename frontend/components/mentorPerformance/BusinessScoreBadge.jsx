const STYLES = {
  Excellent: { bg: "#dcfce7", color: "#166534" },
  "Strong Performer": { bg: "#dbeafe", color: "#1e40af" },
  "Needs Attention": { bg: "#ffedd5", color: "#9a3412" },
  "At Risk": { bg: "#fee2e2", color: "#991b1b" },
  Critical: { bg: "#fecaca", color: "#7f1d1d" },
  "N/A": { bg: "#f1f5f9", color: "#64748b" },
};

export default function BusinessScoreBadge({ classification }) {
  const style = STYLES[classification] || STYLES["N/A"];

  return (
    <span
      style={{
        background: style.bg,
        color: style.color,
        padding: "4px 12px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {classification}
    </span>
  );
}

const RISK_STYLES = {
  Low: { bg: "#dcfce7", color: "#166534" },
  Medium: { bg: "#ffedd5", color: "#9a3412" },
  High: { bg: "#fee2e2", color: "#991b1b" },
  Critical: { bg: "#fecaca", color: "#7f1d1d" },
  "N/A": { bg: "#f1f5f9", color: "#64748b" },
};

export function RiskBadge({ risk }) {
  const style = RISK_STYLES[risk] || RISK_STYLES["N/A"];

  return (
    <span
      style={{
        background: style.bg,
        color: style.color,
        padding: "4px 12px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {risk}
    </span>
  );
}
