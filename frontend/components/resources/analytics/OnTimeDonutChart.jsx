import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = { "On-Time": "#16a34a", "Delayed": "#f59e0b" };

export default function OnTimeDonutChart({ data }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)", marginBottom: "24px" }}>
      <h2 style={{ marginTop: 0 }}>⏱️ On-Time vs Delayed</h2>

      {total === 0 ? (
        <p style={{ color: "#94a3b8" }}>No submissions yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie data={data} dataKey="count" nameKey="label" cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={3}>
              {data.map((d) => (
                <Cell key={d.label} fill={COLORS[d.label] || "#94a3b8"} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
