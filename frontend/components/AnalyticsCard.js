export default function AnalyticsCard({
  title,
  value,
  color,
}) {
  return (
    <div
      style={{
        background: "white",
        borderLeft: `6px solid ${color}`,
        padding: "20px",
        borderRadius: "10px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}
    >
      <h4>{title}</h4>

      <h1
        style={{
          color,
          margin: 0,
        }}
      >
        {value}
      </h1>
    </div>
  );
}