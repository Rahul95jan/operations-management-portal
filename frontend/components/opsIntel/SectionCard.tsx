import { LucideIcon, RotateCcw } from "lucide-react";
import { ReactNode } from "react";

interface SectionCardProps {
  icon: LucideIcon;
  iconColor?: string;
  title: string;
  subtitle?: string;
  viewAllHref?: string;
  onViewAll?: () => void;
  headerRight?: ReactNode;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  isEmpty?: boolean;
  emptyMessage?: string;
  skeletonHeight?: number;
  className?: string;
  children: ReactNode;
}

// The one card shell every widget on the page uses. Loading/error/empty are
// handled here so a single failing widget (isError) never takes the rest of
// the page down with it — callers just pass their React Query state through.
export default function SectionCard({
  icon: Icon,
  iconColor = "#F5B82E",
  title,
  subtitle,
  viewAllHref,
  onViewAll,
  headerRight,
  isLoading,
  isError,
  onRetry,
  isEmpty,
  emptyMessage = "No data for the selected filters.",
  skeletonHeight = 220,
  className = "",
  children,
}: SectionCardProps) {
  return (
    <div className={`bg-white border border-border rounded-[16px] shadow-card p-4 sm:p-5 flex flex-col min-w-0 ${className}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <span className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0 mt-0.5 border border-slate-100" style={{ backgroundColor: `${iconColor}1a`, color: iconColor }}>
            <Icon size={17} strokeWidth={2.1} />
          </span>
          <div className="min-w-0">
            <h3 className="font-display text-[1.35rem] leading-tight text-navy-900 font-bold">{title}</h3>
            {subtitle && <p className="text-[12px] text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {headerRight ? (
          headerRight
        ) : (viewAllHref || onViewAll) ? (
          <button onClick={onViewAll} className="text-xs font-bold text-blue hover:underline whitespace-nowrap flex-shrink-0 mt-1">
            View All
          </button>
        ) : null}
      </div>

      {isLoading ? (
        <div className="animate-pulse rounded-lg bg-slate-100" style={{ height: skeletonHeight }} />
      ) : isError ? (
        <div className="flex flex-col items-center justify-center gap-2 text-center py-8" style={{ minHeight: skeletonHeight / 2 }}>
          <p className="text-sm text-status-critical font-semibold">Couldn&apos;t load this widget.</p>
          {onRetry && (
            <button onClick={onRetry} className="inline-flex items-center gap-1.5 text-xs font-bold text-navy-900 bg-slate-100 hover:bg-slate-200 rounded-lg px-3 py-1.5">
              <RotateCcw size={12} strokeWidth={2.5} /> Retry
            </button>
          )}
        </div>
      ) : isEmpty ? (
        <div className="flex items-center justify-center text-sm text-slate-400 py-8" style={{ minHeight: skeletonHeight / 2 }}>
          {emptyMessage}
        </div>
      ) : (
        children
      )}
    </div>
  );
}
