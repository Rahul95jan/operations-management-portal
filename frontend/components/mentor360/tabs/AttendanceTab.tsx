import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { CalendarDays, Percent } from "lucide-react";
import { useEffect } from "react";
import SectionCard from "../../opsIntel/SectionCard";
import { getAttendanceCalendar } from "../../../lib/mentor360/mentorService";
import { percentTier, TIER_COLORS } from "../../../lib/opsIntel/config";

export default function AttendanceTab({ mentorId, onDataChange }: { mentorId: string; onDataChange: (rows: Record<string, unknown>[]) => void }) {
  const queryClient = useQueryClient();
  const calendarQ = useQuery({ queryKey: ["mentor360", "attendanceCalendar", mentorId], queryFn: () => getAttendanceCalendar(mentorId) });

  useEffect(() => {
    if (calendarQ.data) onDataChange(calendarQ.data.filter((d) => d.attendancePct !== null) as unknown as Record<string, unknown>[]);
  }, [calendarQ.data]); // eslint-disable-line react-hooks/exhaustive-deps

  const chartData = (calendarQ.data ?? [])
    .filter((d) => d.attendancePct !== null)
    .slice(-30)
    .map((d) => ({ label: new Date(d.date).toLocaleDateString(undefined, { day: "2-digit", month: "short" }), attendancePct: d.attendancePct }));

  // 90-day calendar heatmap, 7-day columns (like a GitHub contribution graph).
  const weeks: { date: string; attendancePct: number | null }[][] = [];
  (calendarQ.data ?? []).forEach((d, i) => {
    const weekIdx = Math.floor(i / 7);
    if (!weeks[weekIdx]) weeks[weekIdx] = [];
    weeks[weekIdx].push(d);
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <SectionCard
        icon={Percent}
        iconColor="#16A34A"
        title="Attendance % per Session"
        subtitle="Last 30 sessions"
        isLoading={calendarQ.isLoading}
        isError={calendarQ.isError}
        onRetry={() => queryClient.invalidateQueries({ queryKey: ["mentor360", "attendanceCalendar"] })}
      >
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid stroke="#F1F5F9" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} interval={2} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
            <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E6EAF0", fontSize: 12 }} formatter={(v: number) => [`${v}%`, "Attendance"]} />
            <Bar dataKey="attendancePct" fill="#16A34A" radius={[4, 4, 0, 0]} barSize={12} />
          </BarChart>
        </ResponsiveContainer>
      </SectionCard>

      <SectionCard
        icon={CalendarDays}
        iconColor="#2563EB"
        title="Attendance Heatmap"
        subtitle="Last 90 days — darker green = higher attendance"
        isLoading={calendarQ.isLoading}
        isError={calendarQ.isError}
        onRetry={() => queryClient.invalidateQueries({ queryKey: ["mentor360", "attendanceCalendar"] })}
      >
        <div className="flex gap-1 overflow-x-auto pb-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((day) => {
                const color = day.attendancePct === null ? "#F1F5F9" : TIER_COLORS[percentTier(day.attendancePct)].bg;
                const border = day.attendancePct === null ? "transparent" : TIER_COLORS[percentTier(day.attendancePct)].text;
                return (
                  <div
                    key={day.date}
                    title={day.attendancePct !== null ? `${day.date}: ${day.attendancePct}% attendance` : `${day.date}: no session`}
                    className="w-3.5 h-3.5 rounded-sm"
                    style={{ backgroundColor: color, border: `1px solid ${border}22` }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
