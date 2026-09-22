import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { TrendInfo } from "../../lib/opsIntel/types";

// Color follows TrendInfo.isGood (computed upstream from each metric's
// higherIsBetter flag) — NOT the raw up/down direction. A falling
// cancellation rate is green; a falling attendance rate is red.
export default function TrendBadge({ trend, suffix = "", compact = false }: { trend: TrendInfo; suffix?: string; compact?: boolean }) {
  const Icon = trend.direction === "flat" ? Minus : trend.direction === "up" ? TrendingUp : TrendingDown;
  const color = trend.direction === "flat" ? "text-slate-400" : trend.isGood ? "text-status-good" : "text-status-critical";
  const sign = trend.value > 0 ? "+" : "";
  return (
    <span className={`inline-flex items-center gap-1 font-bold ${color} ${compact ? "text-[11px]" : "text-xs"}`}>
      <Icon size={compact ? 11 : 13} strokeWidth={2.5} />
      {sign}
      {trend.value}
      {suffix}
    </span>
  );
}
