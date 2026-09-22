import { AlertCircle, AlertOctagon, AlertTriangle } from "lucide-react";
import { ActionItemData } from "../../lib/opsIntel/types";

const PRIORITY_STYLES: Record<ActionItemData["priority"], { text: string; bg: string; icon: React.ElementType }> = {
  High: { text: "#DC2626", bg: "#FEE2E2", icon: AlertOctagon },
  Medium: { text: "#F59E0B", bg: "#FEF3C7", icon: AlertTriangle },
  Low: { text: "#16A34A", bg: "#DCFCE7", icon: AlertCircle },
};

export default function ActionItem({ item, onInvestigate }: { item: ActionItemData; onInvestigate: (item: ActionItemData) => void }) {
  const style = PRIORITY_STYLES[item.priority];
  const Icon = style.icon;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: style.bg, color: style.text }}>
        <Icon size={16} strokeWidth={2.2} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-navy-900 text-[13px]">{item.issue}</span>
          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ color: style.text, backgroundColor: style.bg }}>
            {item.priority}
          </span>
        </div>
        <p className="text-[12px] text-slate-500 mt-0.5">{item.description}</p>
        <span className="inline-block mt-1.5 text-[11px] font-semibold text-slate-500 bg-slate-100 rounded-full px-2 py-0.5">{item.affectedBatch}</span>
      </div>
      <button onClick={() => onInvestigate(item)} className="flex-shrink-0 text-xs font-bold text-navy-900 bg-slate-100 hover:bg-slate-200 rounded-lg px-3 py-1.5">
        Investigate
      </button>
    </div>
  );
}
