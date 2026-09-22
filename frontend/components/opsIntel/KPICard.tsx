import { LucideIcon } from "lucide-react";
import TrendBadge from "./TrendBadge";
import { KPI } from "../../lib/opsIntel/types";

export default function KPICard({ kpi, icon: Icon, color }: { kpi: KPI; icon: LucideIcon; color: string }) {
  return (
    <div className="bg-white border border-border rounded-[16px] shadow-card p-4 min-w-0 h-[132px] flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="w-11 h-11 rounded-[12px] flex items-center justify-center flex-shrink-0 border border-slate-100" style={{ backgroundColor: `${color}1a`, color }}>
          <Icon size={20} strokeWidth={2.2} />
        </span>
        <TrendBadge trend={kpi.trend} suffix={kpi.id === "avgRating" ? "" : "%"} />
      </div>
      <div>
        <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 mb-1">{kpi.label}</div>
        <div className="flex items-end justify-between gap-2">
          <div className="text-[2rem] font-display font-bold text-navy-900 tabular-nums leading-none">{kpi.value}</div>
        </div>
        <div className={`text-[12px] mt-1 ${kpi.captionTone === "good" ? "text-status-good font-semibold" : "text-slate-400"}`}>{kpi.caption}</div>
      </div>
    </div>
  );
}

export function KPICardSkeleton() {
  return <div className="bg-white border border-border rounded-[16px] shadow-card p-4 h-[132px] animate-pulse" />;
}
