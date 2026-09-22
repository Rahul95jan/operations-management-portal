import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

export default function CancellationTrendChart({ data }: { data: { label: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={90}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
        <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E6EAF0", fontSize: 12 }} />
        <Bar dataKey="count" name="Cancellations" fill="#DC2626" radius={[3, 3, 0, 0]} barSize={14} />
      </BarChart>
    </ResponsiveContainer>
  );
}
