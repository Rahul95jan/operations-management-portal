export default function DashboardCard({
  title,
  value,
  color,
}) {
  return (
    <div
      style={{
        background: "#ffffff",
        borderLeft: `6px solid ${color}`,
        padding: "25px",
        borderRadius: "16px",
        boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
        transition: "all 0.3s ease",
        cursor: "pointer",
      }}
    >
      <p
        style={{
          margin: 0,
          color: "#64748b",
          fontSize: "15px",
          fontWeight: "600",
        }}
      >
        {title}
      </p>

      <h1
        style={{
          marginTop: "15px",
          marginBottom: "0",
          fontSize: "38px",
          color: color,
          fontWeight: "700",
        }}
      >
        {value}
      </h1>
    </div>
  );
}