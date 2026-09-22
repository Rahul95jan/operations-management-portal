import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AttendanceTrendPoint } from "../../lib/opsIntel/types";

export default function AttendanceTrendChart({ data }: { data: AttendanceTrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid stroke="#F1F5F9" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
        <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
        <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E6EAF0", fontSize: 12 }} formatter={(v: number, n: string) => [`${v}%`, n]} />
        <Legend wrapperStyle={{ fontSize: 11, fontWeight: 600 }} />
        <Line type="monotone" dataKey="attendancePct" name="Attendance %" stroke="#16A34A" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="absenteePct" name="Absentee %" stroke="#DC2626" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
