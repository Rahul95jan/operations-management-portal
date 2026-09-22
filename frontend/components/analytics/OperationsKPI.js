export default function OperationsKPI({ title, value, color, icon: Icon }) {
  return (
    <div
      className="kpi-tile"
      style={{
        background: "#fff",
        borderLeft: `4px solid ${color}`,
        padding: "14px 16px",
        borderRadius: "12px",
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.06)",
        border: "1px solid #eef2f7",
        borderLeftWidth: "4px",
        display: "flex",
        gap: "12px",
        alignItems: "flex-start",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
      }}
    >
      {Icon && (
        <div style={{ width: 34, height: 34, borderRadius: 9, background: `${color}1a`, color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={17} strokeWidth={2.2} />
        </div>
      )}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: "21px", fontWeight: 800, color, lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>{value}</div>
        <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.03em", textTransform: "uppercase", color: "#64748b", marginTop: "3px" }}>{title}</div>
      </div>

      <style jsx>{`
        .kpi-tile:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 18px -10px rgba(15, 23, 42, 0.25);
        }
      `}</style>
    </div>
  );
}
