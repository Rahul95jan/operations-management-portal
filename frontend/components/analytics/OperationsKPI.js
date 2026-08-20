export default function OperationsKPI({ title, value, color }) {
  return (
    <div
      className="kpi-tile"
      style={{
        background: "#fff",
        borderLeft: `4px solid ${color}`,
        padding: "18px 20px",
        borderRadius: "12px",
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.06)",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
      }}
    >
      <h4
        style={{
          marginBottom: "8px",
          fontSize: "12px",
          fontWeight: 700,
          letterSpacing: "0.03em",
          textTransform: "uppercase",
          color: "#94a3b8",
        }}
      >
        {title}
      </h4>

      <h1
        style={{
          margin: 0,
          fontSize: "28px",
          color,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </h1>

      <style jsx>{`
        .kpi-tile:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 18px -10px rgba(15, 23, 42, 0.25);
        }
      `}</style>
    </div>
  );
}
