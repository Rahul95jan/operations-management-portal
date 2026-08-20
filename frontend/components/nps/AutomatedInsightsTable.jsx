export default function AutomatedInsightsTable({ rows }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "12px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        marginBottom: "40px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          background: "#0f172a",
          color: "#facc15",
          padding: "12px 20px",
          fontWeight: 800,
          fontSize: "15px",
          letterSpacing: "0.03em",
        }}
      >
        🤖 AUTOMATED INSIGHTS SUMMARY
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.label} style={{ background: i % 2 === 0 ? "#f8fafc" : "#fff" }}>
              <td
                style={{
                  padding: "10px 20px",
                  fontWeight: 600,
                  color: "#334155",
                  width: "45%",
                  borderBottom: "1px solid #f1f5f9",
                }}
              >
                {row.label}
              </td>
              <td
                style={{
                  padding: "10px 20px",
                  color: "#0f172a",
                  fontWeight: 700,
                  borderBottom: "1px solid #f1f5f9",
                }}
              >
                {row.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
