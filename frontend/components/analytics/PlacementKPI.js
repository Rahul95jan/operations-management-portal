export default function PlacementKPI({ title, value, color }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "12px",
        padding: "20px",
        borderLeft: `6px solid ${color}`,
        boxShadow: "0 2px 10px rgba(0,0,0,.08)",
      }}
    >
      <h4
        style={{
          color: "#64748b",
          marginBottom: "10px",
        }}
      >
        {title}
      </h4>

      <h2
        style={{
          color,
          margin: 0,
          fontSize: "32px",
        }}
      >
        {value}
      </h2>
    </div>
  );
}