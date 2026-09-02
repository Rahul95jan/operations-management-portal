import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

// Generic pie/donut for any {label, count, color} breakdown — used for both
// Classification and Risk distributions on the Mentor 360 dashboard.
// donut=false renders a solid pie (innerRadius 0) — used to keep the two
// charts visually distinct even though their underlying data is related.
export default function BreakdownDonutChart({ title, data, donut = true }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)", marginBottom: "24px" }}>
      <h2 style={{ marginTop: 0 }}>{title}</h2>

      {total === 0 ? (
        <p style={{ color: "#94a3b8" }}>No data yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={data} dataKey="count" nameKey="label" cx="50%" cy="50%" innerRadius={donut ? 60 : 0} outerRadius={95} paddingAngle={3}>
              {data.map((d) => (
                <Cell key={d.label} fill={d.color} />
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
