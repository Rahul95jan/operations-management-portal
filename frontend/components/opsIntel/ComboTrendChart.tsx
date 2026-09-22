import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TrendPoint } from "../../lib/opsIntel/types";

export default function ComboTrendChart({ data }: { data: TrendPoint[] }) {
  // Rating (0-5) is scaled x20 so it can share the 0-100% right axis with
  // Attendance %, matching the "dual Y-axis" combo chart brief.
  const chartData = data.map((d) => ({ ...d, ratingPct: d.rating !== null ? Math.round(d.rating * 20) : null }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid stroke="#F1F5F9" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
        <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} allowDecimals={false} />
        <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
        <Tooltip
          contentStyle={{ borderRadius: 10, border: "1px solid #E6EAF0", fontSize: 12 }}
          formatter={(value: number, name: string) => {
            if (name === "Attendance %") return [`${value}%`, name];
            if (name === "Avg Rating") return [(value / 20).toFixed(1), name];
            return [value, name];
          }}
        />
        <Legend wrapperStyle={{ fontSize: 11, fontWeight: 600 }} />
        <Bar yAxisId="left" dataKey="sessions" name="Sessions Conducted" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={10} />
        <Line yAxisId="right" type="monotone" dataKey="attendancePct" name="Attendance %" stroke="#F59E0B" strokeWidth={2} dot={false} connectNulls />
        <Line yAxisId="right" type="monotone" dataKey="ratingPct" name="Avg Rating" stroke="#16A34A" strokeWidth={2} strokeDasharray="4 3" dot={false} connectNulls />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
