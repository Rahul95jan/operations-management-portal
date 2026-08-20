const STATUS_STYLES = {
  Complete: { bg: "#dcfce7", color: "#166534" },
  Submitted: { bg: "#dcfce7", color: "#166534" },
  Pending: { bg: "#fef9c3", color: "#854d0e" },
  "Partially Submitted": { bg: "#dbeafe", color: "#1e40af" },
  Delayed: { bg: "#ffedd5", color: "#9a3412" },
  Overdue: { bg: "#fee2e2", color: "#991b1b" },
  "Not Required": { bg: "#f1f5f9", color: "#64748b" },
};

export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES["Not Required"];

  return (
    <span
      style={{
        background: style.bg,
        color: style.color,
        padding: "4px 12px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: 700,
        display: "inline-block",
        whiteSpace: "nowrap",
      }}
    >
      {status || "Unknown"}
    </span>
  );
}
