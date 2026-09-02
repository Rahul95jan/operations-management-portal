import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";

// Shows the 8-dimension shape of a single mentor at a glance — a lopsided
// radar (e.g. strong delivery, weak learner experience) is easier to spot
// here than by scanning a bar chart's individual values.
export default function DimensionRadar({ data }) {
  const hasData = data.some((d) => typeof d.value === "number");

  return (
    <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)", marginBottom: "24px" }}>
      <h2 style={{ marginTop: 0, marginBottom: "4px" }}>Performance Shape</h2>
      <p style={{ margin: "0 0 12px", color: "#94a3b8", fontSize: "13px" }}>
        All 8 dimensions on a 0-100 scale — a lopsided shape flags where this mentor needs support.
      </p>

      {!hasData ? (
        <p style={{ color: "#94a3b8" }}>No data yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <RadarChart data={data} outerRadius="75%">
            <PolarGrid />
            <PolarAngleAxis dataKey="name" tick={{ fontSize: 12, fill: "#475569" }} />
            <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
            <Radar dataKey="value" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.35} />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
