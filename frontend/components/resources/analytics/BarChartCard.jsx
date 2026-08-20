import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function BarChartCard({ title, data, dataKey, nameKey, color = "#0f172a", layout = "horizontal" }) {
  const isVertical = layout === "vertical"; // recharts calls a sideways bar chart "vertical"

  return (
    <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)", marginBottom: "24px" }}>
      <h2 style={{ marginTop: 0 }}>{title}</h2>

      {data.length === 0 ? (
        <p style={{ color: "#94a3b8" }}>No data yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} layout={isVertical ? "vertical" : "horizontal"} margin={isVertical ? { left: 20 } : undefined}>
            <CartesianGrid strokeDasharray="3 3" />
            {isVertical ? (
              <>
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey={nameKey} width={120} />
              </>
            ) : (
              <>
                <XAxis dataKey={nameKey} />
                <YAxis allowDecimals={false} />
              </>
            )}
            <Tooltip />
            <Bar dataKey={dataKey} fill={color} radius={isVertical ? [0, 6, 6, 0] : [6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
