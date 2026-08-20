import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export default function NPSTrendChart({ data }) {
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
      <h2>📈 Response Volume &amp; Avg Recommendation Score Trend</h2>

      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis yAxisId="responses" allowDecimals={false} />
          <YAxis yAxisId="nps" orientation="right" domain={[0, 10]} />
          <Tooltip />
          <Legend />

          <Bar
            yAxisId="responses"
            dataKey="responses"
            name="Responses"
            fill="#facc15"
            radius={[6, 6, 0, 0]}
          />

          <Line
            yAxisId="nps"
            type="monotone"
            dataKey="nps"
            name="Avg Score (0-10)"
            stroke="#0f172a"
            strokeWidth={3}
            dot={{ r: 4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
