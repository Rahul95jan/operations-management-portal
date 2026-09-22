import { useState } from "react";
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, LabelList } from "recharts";
import { BarChart3, Lightbulb, ChevronDown } from "lucide-react";
import CardShell from "./CardShell";

function WrappedTick({ x, y, payload }) {
  const label = String(payload.value || "").trim();
  const short = label.length > 22 ? `${label.slice(0, 21)}…` : label;
  return (
    <text x={x} y={y + 14} textAnchor="middle" fontSize={11} fill="#334155">
      {short}
    </text>
  );
}

export default function AttendanceTrendCard({ data, average, insight }) {
  const [view, setView] = useState("bar");
  const rows = (data || []).map((d) => ({ name: d.meeting || "Untitled", attendance: d.attendance ?? 0 }));

  const control = (
    <label className="view-select">
      <select value={view} onChange={(e) => setView(e.target.value)} aria-label="Chart view">
        <option value="bar">Bar View</option>
        <option value="line">Line View</option>
      </select>
      <ChevronDown size={13} />
      <style jsx>{`
        .view-select { position: relative; display: inline-flex; align-items: center; }
        .view-select select { appearance: none; border: 1px solid #e2e8f0; border-radius: 8px; background: #fff; padding: 7px 28px 7px 12px; font-size: 12px; font-weight: 600; color: #1e293b; cursor: pointer; outline: none; }
        .view-select :global(svg) { position: absolute; right: 9px; pointer-events: none; color: #475569; }
      `}</style>
    </label>
  );

  const common = { data: rows, margin: { top: 22, right: 20, left: 4, bottom: 4 } };
  const axes = (
    <>
      <CartesianGrid stroke="#e8edf5" vertical={false} />
      <XAxis dataKey="name" tick={<WrappedTick />} interval={0} height={36} axisLine={{ stroke: "#cbd5e1" }} tickLine={false} />
      <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fontSize: 11, fill: "#475569" }} axisLine={false} tickLine={false} width={34} label={{ value: "Attendance (%)", angle: -90, position: "insideLeft", offset: 6, fontSize: 11, fill: "#475569" }} />
      <Tooltip formatter={(v) => [`${v}%`, "Attendance"]} cursor={{ fill: "rgba(148,163,184,0.12)" }} />
      {average !== null && average !== undefined && (
        <ReferenceLine y={average} stroke="#3b82f6" strokeDasharray="5 4" label={{ value: `Avg. ${average}%`, position: "insideTopRight", fontSize: 11, fill: "#334155" }} />
      )}
    </>
  );

  return (
    <CardShell icon={BarChart3} iconColor="#2563eb" title="Webinar Attendance Trend" subtitle="Attendance across webinars for the selected period. Hover over bars to see exact values." right={control}>
      {rows.length === 0 ? (
        <div className="empty">No attendance data for the selected filters.</div>
      ) : (
        <div className="chart-box">
          <ResponsiveContainer width="100%" height="100%">
            {view === "bar" ? (
              <BarChart {...common}>
                {axes}
                <Bar dataKey="attendance" fill="#3b82f6" radius={[3, 3, 0, 0]} maxBarSize={150} isAnimationActive={false}>
                  <LabelList dataKey="attendance" position="top" formatter={(v) => `${v}%`} style={{ fontSize: 11, fontWeight: 700, fill: "#0f172a" }} />
                </Bar>
              </BarChart>
            ) : (
              <LineChart {...common}>
                {axes}
                <Line type="monotone" dataKey="attendance" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4, fill: "#3b82f6" }} isAnimationActive={false}>
                  <LabelList dataKey="attendance" position="top" formatter={(v) => `${v}%`} style={{ fontSize: 11, fontWeight: 700, fill: "#0f172a" }} />
                </Line>
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
      {insight && (
        <div className="insight-note">
          <Lightbulb size={15} strokeWidth={2.1} /> <span>{insight}</span>
        </div>
      )}

      <style jsx>{`
        .chart-box { height: 250px; }
        .empty { padding: 60px 0; text-align: center; color: #94a3b8; font-size: 13px; }
        .insight-note { display: flex; align-items: center; gap: 8px; margin-top: 12px; background: #eff6ff; color: #1e3a8a; border-radius: 8px; padding: 10px 14px; font-size: 12px; }
        .insight-note :global(svg) { color: #2563eb; flex-shrink: 0; }
      `}</style>
    </CardShell>
  );
}
