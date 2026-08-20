const DOT = { green: "🟢", yellow: "🟡", orange: "🟠", red: "🔴", gray: "⚪" };

export default function MentorHeatmap({ data }) {
  if (!data || data.rows.length === 0) {
    return <p style={{ color: "#94a3b8" }}>No weekly data yet.</p>;
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ borderCollapse: "collapse", minWidth: "500px" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: "8px 16px", fontSize: "12px", color: "#64748b" }}>Mentor</th>
            {data.week_labels.map((label) => (
              <th key={label} style={{ padding: "8px 16px", fontSize: "12px", color: "#64748b" }}>
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row) => (
            <tr key={row.mentor_name} style={{ borderTop: "1px solid #f1f5f9" }}>
              <td style={{ padding: "10px 16px", fontWeight: 600 }}>{row.mentor_name}</td>
              {row.weeks.map((cell) => (
                <td
                  key={cell.week}
                  style={{ textAlign: "center", padding: "10px 16px", fontSize: "22px" }}
                  title={cell.score === null ? "No data" : `${cell.score}% on-time`}
                >
                  {DOT[cell.color]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
