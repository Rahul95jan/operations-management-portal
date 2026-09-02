import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";

function quadrantLabel(x, y) {
  if (x >= 75 && y >= 75) return "Top Performer";
  if (x >= 75 && y < 75) return "Quality Concern";
  if (x < 75 && y >= 75) return "Operational Concern";
  return "Critical";
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload;
  return (
    <div style={{ background: "#0f172a", color: "#f8fafc", padding: "10px 14px", borderRadius: "10px", fontSize: "12px" }}>
      <div style={{ fontWeight: 700, marginBottom: "4px" }}>{p.mentor_name}</div>
      <div>Delivery: {p.x}%</div>
      <div>Learner Experience: {p.y}%</div>
      <div>Learners Served: {p.z}</div>
      <div style={{ color: "#facc15", marginTop: "4px" }}>{quadrantLabel(p.x, p.y)}</div>
    </div>
  );
}

export default function PerformanceMatrix({ data, highlightMentor }) {
  const points = (data || [])
    .filter((m) => typeof m.x === "number" && typeof m.y === "number")
    .map((m) => ({ ...m, isHighlighted: m.mentor_name === highlightMentor }));

  const others = points.filter((p) => !p.isHighlighted);
  const highlighted = points.filter((p) => p.isHighlighted);

  return (
    <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)", marginBottom: "24px" }}>
      <h2 style={{ marginTop: 0, marginBottom: "4px" }}>Mentor Performance Matrix</h2>
      <p style={{ margin: "0 0 12px", color: "#94a3b8", fontSize: "13px" }}>
        X: Delivery Performance &nbsp;·&nbsp; Y: Learner Experience &nbsp;·&nbsp; Bubble size: Learners Served
      </p>

      {points.length === 0 ? (
        <p style={{ color: "#94a3b8" }}>No data yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={340}>
          <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" dataKey="x" name="Delivery" domain={[0, 100]} unit="%" />
            <YAxis type="number" dataKey="y" name="Learner Experience" domain={[0, 100]} unit="%" />
            <ZAxis type="number" dataKey="z" range={[60, 400]} name="Learners Served" />
            <ReferenceLine x={75} stroke="#cbd5e1" strokeDasharray="4 4" />
            <ReferenceLine y={75} stroke="#cbd5e1" strokeDasharray="4 4" />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: "3 3" }} />
            <Scatter data={others} fill="#94a3b8" />
            <Scatter data={highlighted} fill="#f59e0b" />
          </ScatterChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
