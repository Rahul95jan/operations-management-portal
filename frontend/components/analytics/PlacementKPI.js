export default function PlacementKPI({ title, value, color }) {
  return (
    <div
      className="kpi-tile"
      style={{
        background: "#fff",
        borderRadius: "12px",
        padding: "18px 20px",
        borderLeft: `4px solid ${color}`,
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.06)",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
      }}
    >
      <h4
        style={{
          color: "#94a3b8",
          marginBottom: "8px",
          fontSize: "12px",
          fontWeight: 700,
          letterSpacing: "0.03em",
          textTransform: "uppercase",
        }}
      >
        {title}
      </h4>

      <h2
        style={{
          color,
          margin: 0,
          fontSize: "26px",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </h2>

      <style jsx>{`
        .kpi-tile:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 18px -10px rgba(15, 23, 42, 0.25);
        }
      `}</style>
    </div>
  );
}
