import { UseQueryResult } from "@tanstack/react-query";
import { CalendarClock, Clock, Percent, Star, TrendingUp, Users } from "lucide-react";
import KPICard, { KPICardSkeleton } from "../../opsIntel/KPICard";
import SectionCard from "../../opsIntel/SectionCard";
import ComboTrendChart from "../../opsIntel/ComboTrendChart";
import DonutChart from "../../opsIntel/DonutChart";
import ProgressMetricRow from "../../opsIntel/ProgressMetricRow";
import ChartCard from "../ChartCard";
import type { KPI, NPSData, Period, QualityScore, SessionTrendPoint } from "../../../lib/mentor360/types";
import type { TrendInfo } from "../../../lib/opsIntel/types";

const KPI_ICONS = [CalendarClock, Users, Percent, Star, Clock];
const KPI_COLORS = ["#0B1426", "#2563EB", "#0891B2", "#F5B82E", "#2563EB"];

function flat(value: number): TrendInfo {
  return { value, direction: "flat", isGood: true };
}

interface OverviewTabProps {
  kpisQ: UseQueryResult<KPI[]>;
  trendQ: UseQueryResult<SessionTrendPoint[]>;
  period: Period;
  onPeriodChange: (p: Period) => void;
  npsQ: UseQueryResult<NPSData>;
  qualityQ: UseQueryResult<QualityScore>;
  onRetry: (key: string) => void;
}

export default function OverviewTab({ kpisQ, trendQ, period, onPeriodChange, npsQ, qualityQ, onRetry }: OverviewTabProps) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 mb-5">
        {kpisQ.isLoading || !kpisQ.data
          ? Array.from({ length: 5 }).map((_, i) => <KPICardSkeleton key={i} />)
          : kpisQ.data.map((kpi, i) => (
              <div key={kpi.id} title="Compared to the equivalent previous period">
                <KPICard kpi={kpi} icon={KPI_ICONS[i]} color={KPI_COLORS[i]} />
              </div>
            ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard
          icon={TrendingUp}
          iconColor="#3B82F6"
          title="Session Performance Trend"
          subtitle="Sessions, attendance and rating over time"
          period={period}
          onPeriodChange={onPeriodChange}
          isLoading={trendQ.isLoading}
          isError={trendQ.isError}
          onRetry={() => onRetry("trend")}
        >
          {trendQ.data && <ComboTrendChart data={trendQ.data} />}
        </ChartCard>

        <SectionCard icon={Star} iconColor="#A855F7" title="NPS Score" subtitle="Promoters vs Passives vs Detractors" isLoading={npsQ.isLoading} isError={npsQ.isError} onRetry={() => onRetry("nps")}>
          {npsQ.data && (
            <DonutChart
              centerLabel={`${npsQ.data.score}`}
              centerSub="NPS Score"
              segments={[
                { label: "Promoters", count: npsQ.data.promoters, pct: Math.round((npsQ.data.promoters / (npsQ.data.total || 1)) * 100), color: "#16A34A" },
                { label: "Passives", count: npsQ.data.passives, pct: Math.round((npsQ.data.passives / (npsQ.data.total || 1)) * 100), color: "#F59E0B" },
                { label: "Detractors", count: npsQ.data.detractors, pct: Math.round((npsQ.data.detractors / (npsQ.data.total || 1)) * 100), color: "#DC2626" },
              ]}
            />
          )}
        </SectionCard>

        <SectionCard icon={Star} iconColor="#F5B82E" title="Session Quality" subtitle="Breakdown by dimension" isLoading={qualityQ.isLoading} isError={qualityQ.isError} onRetry={() => onRetry("quality")}>
          {qualityQ.data && (
            <>
              <ProgressMetricRow label="Content" value={qualityQ.data.content} max={5} displayValue={`${qualityQ.data.content}/5`} trend={flat(0)} barColor="#3B82F6" />
              <ProgressMetricRow label="Delivery" value={qualityQ.data.delivery} max={5} displayValue={`${qualityQ.data.delivery}/5`} trend={flat(0)} barColor="#16A34A" />
              <ProgressMetricRow label="Engagement" value={qualityQ.data.engagement} max={5} displayValue={`${qualityQ.data.engagement}/5`} trend={flat(0)} barColor="#A855F7" />
              <ProgressMetricRow label="Punctuality" value={qualityQ.data.punctuality} max={5} displayValue={`${qualityQ.data.punctuality}/5`} trend={flat(0)} barColor="#F5B82E" />
            </>
          )}
        </SectionCard>
      </div>
    </>
  );
}
