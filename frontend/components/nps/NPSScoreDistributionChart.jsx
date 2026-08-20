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
  if (score >= 9) return "#16a34a";
  if (score >= 7) return "#f59e0b";
  return "#dc2626";
}

export default function NPSScoreDistributionChart({ data }) {
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
      <h2>📊 NPS Score Distribution</h2>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="score" />
          <YAxis allowDecimals={false} />
          <Tooltip />

          <Bar dataKey="count" name="Responses" radius={[6, 6, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.score} fill={colorFor(entry.score)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
