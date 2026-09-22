import TrendBadge from "./TrendBadge";
import { TrendInfo } from "../../lib/opsIntel/types";

interface ProgressMetricRowProps {
  label: string;
  value: number; // the raw number to show, e.g. 4.7 or 96
  max: number; // 5 for ratings, 100 for percentages
  displayValue: string; // "4.7/5" or "96%"
  trend: TrendInfo;
  barColor?: string;
}

export default function ProgressMetricRow({ label, value, max, displayValue, trend, barColor = "#16A34A" }: ProgressMetricRowProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="mb-3.5 last:mb-0">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[12.5px] font-semibold text-slate-600">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-[12.5px] font-extrabold text-navy-900">{displayValue}</span>
          <TrendBadge trend={trend} compact />
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: barColor }} />
      </div>
    </div>
  );
}
