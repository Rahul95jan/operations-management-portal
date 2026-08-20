const STYLES = {
  Excellent: { bg: "#dcfce7", color: "#166534" },
  Good: { bg: "#dbeafe", color: "#1e40af" },
  "Needs Improvement": { bg: "#ffedd5", color: "#9a3412" },
  Critical: { bg: "#fee2e2", color: "#991b1b" },
};

export default function ComplianceBadge({ classification }) {
  const style = STYLES[classification] || STYLES.Critical;

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
