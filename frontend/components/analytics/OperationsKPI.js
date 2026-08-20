export default function OperationsKPI({ title, value, color }) {
  return (
    <div
      style={{
        background: "#fff",
        borderLeft: `6px solid ${color}`,
        padding: "20px",
        borderRadius: "12px",
        boxShadow: "0 2px 10px rgba(0,0,0,.08)",
      }}
    >
      <h4
        style={{
          marginBottom: "12px",
          color: "#64748b",
        }}
      >
        {title}
      </h4>

      <h1
        style={{
          margin: 0,
          fontSize: "34px",
          color,
        }}
      >
        {value}
      </h1>
    </div>
  );
}