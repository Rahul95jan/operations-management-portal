import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";
import SectionCard from "../opsIntel/SectionCard";
import { Period } from "../../lib/mentor360/types";

const PERIOD_LABELS: Record<Period, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 3 months",
  "6m": "Last 6 months",
  "1y": "Last 1 year",
};

interface ChartCardProps {
  icon: LucideIcon;
  iconColor?: string;
  title: string;
  subtitle?: string;
  period?: Period;
  onPeriodChange?: (period: Period) => void;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  skeletonHeight?: number;
  children: ReactNode;
}

// Thin wrapper around SectionCard that adds the "period dropdown in the card
// header" pattern used by Session Performance Trend (and reusable by any
// other time-series card).
export default function ChartCard({ icon, iconColor, title, subtitle, period, onPeriodChange, isLoading, isError, onRetry, skeletonHeight, children }: ChartCardProps) {
  return (
    <SectionCard
      icon={icon}
      iconColor={iconColor}
      title={title}
      subtitle={subtitle}
      isLoading={isLoading}
      isError={isError}
      onRetry={onRetry}
      skeletonHeight={skeletonHeight}
      headerRight={
        period && onPeriodChange ? (
          <select
            value={period}
            onChange={(e) => onPeriodChange(e.target.value as Period)}
            className="text-[12px] font-bold text-navy-900 bg-slate-50 border border-border rounded-lg px-2.5 py-1.5 outline-none"
          >
            {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
              <option key={p} value={p}>
                {PERIOD_LABELS[p]}
              </option>
            ))}
          </select>
        ) : undefined
      }
    >
      {children}
    </SectionCard>
  );
}
