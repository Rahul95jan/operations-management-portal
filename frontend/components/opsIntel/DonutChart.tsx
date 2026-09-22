import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface Segment {
  label: string;
  count: number;
  pct: number;
  color: string;
}

export default function DonutChart({ segments, centerLabel, centerSub, onSegmentClick }: { segments: Segment[]; centerLabel: string; centerSub?: string; onSegmentClick?: (label: string) => void }) {
  return (
    <div className="flex items-center gap-6 flex-wrap">
      <div className="relative w-[140px] h-[140px] flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={segments}
              dataKey="count"
              nameKey="label"
              innerRadius={44}
              outerRadius={68}
              paddingAngle={2}
              stroke="none"
              onClick={(d: any) => onSegmentClick?.(d.payload?.label ?? d.name)}
              cursor={onSegmentClick ? "pointer" : "default"}
            >
              {segments.map((s) => (
                <Cell key={s.label} fill={s.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number, name: string) => [`${value}`, name]} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-2">
          <div className="text-lg font-extrabold text-navy-900 leading-none">{centerLabel}</div>
          {centerSub && <div className="text-[9px] font-bold uppercase tracking-wide text-slate-400 mt-1">{centerSub}</div>}
        </div>
      </div>
      <div className="flex flex-col gap-2 text-sm">
        {segments.map((s) => (
          <button
            key={s.label}
            className={`flex items-center gap-2 text-left ${onSegmentClick ? "hover:underline cursor-pointer" : "cursor-default"}`}
            onClick={() => onSegmentClick?.(s.label)}
          >
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
            <span className="font-semibold text-slate-600">{s.label}</span>
            <span className="font-extrabold text-navy-900">{s.pct}%</span>
            <span className="text-slate-400">({s.count})</span>
          </button>
        ))}
      </div>
    </div>
  );
}
