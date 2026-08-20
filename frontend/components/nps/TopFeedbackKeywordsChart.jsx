import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function TopFeedbackKeywordsChart({ data }) {
  const chartData = [...data].reverse();

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
      <h2>🗣️ Top Feedback Keywords</h2>
      <p style={{ color: "#94a3b8", marginTop: 0 }}>
        Most repeated words in constructive feedback (passives &amp; detractors)
      </p>

      {chartData.length === 0 ? (
        <p style={{ color: "#94a3b8" }}>Not enough constructive feedback text yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" allowDecimals={false} />
            <YAxis type="category" dataKey="word" width={100} />
            <Tooltip />

            <Bar dataKey="count" name="Mentions" fill="#7c3aed" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
