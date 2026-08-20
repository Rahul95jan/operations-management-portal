import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

function colorFor(score) {
  if (score >= 50) return "#16a34a";
  if (score >= 0) return "#f59e0b";
  return "#dc2626";
}

export default function NPSBreakdownChart({ title, data }) {
  return (
    <div
      style={{
        background: "#fff",
        padding: "20px",
        borderRadius: "12px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        marginBottom: "40px",
      }}
    >
      <h2>{title}</h2>

      {data.length === 0 ? (
        <p style={{ color: "#94a3b8" }}>Not enough data yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[-100, 100]} />
            <YAxis type="category" dataKey="name" width={140} />
            <Tooltip />

            <Bar dataKey="nps_score" name="NPS Score" radius={[0, 6, 6, 0]}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={colorFor(entry.nps_score)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
