import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

// Generic pie/donut for any {label, count, color} breakdown — used for both
// Classification and Risk distributions on the Mentor 360 dashboard, and on
// the Webinar dashboard. donut=false renders a solid pie (innerRadius 0).
//
// `compact` (default false, so existing callers are unaffected) tightens the
// card padding/height and lets the title carry an icon badge, matching the
// denser card style used elsewhere in Mentor 360.
export default function BreakdownDonutChart({ title, data, donut = true, compact = false, icon: Icon, iconColor = "#2563eb" }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const height = compact ? 190 : 260;

  return (
    <div style={{ background: "#fff", padding: compact ? "16px 18px" : "20px", borderRadius: compact ? "14px" : "12px", boxShadow: "0 1px 3px rgba(15,23,42,0.06)", border: compact ? "1px solid #eef2f7" : "none", marginBottom: compact ? "14px" : "24px" }}>
      {compact && Icon ? (
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
          <span style={{ width: 28, height: 28, borderRadius: 8, background: `${iconColor}1a`, color: iconColor, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon size={15} strokeWidth={2.2} />
          </span>
          <h2 style={{ margin: 0, fontSize: "14.5px", color: "#1e293b" }}>{title}</h2>
        </div>
      ) : (
        <h2 style={{ marginTop: 0, fontSize: compact ? "14.5px" : undefined }}>{title}</h2>
      )}

      {total === 0 ? (
        <p style={{ color: "#94a3b8", fontSize: compact ? "13px" : undefined }}>No data yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie data={data} dataKey="count" nameKey="label" cx="50%" cy="50%" innerRadius={donut ? (compact ? 44 : 60) : 0} outerRadius={compact ? 68 : 95} paddingAngle={3}>
              {data.map((d) => (
                <Cell key={d.label} fill={d.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend wrapperStyle={compact ? { fontSize: 11 } : undefined} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
