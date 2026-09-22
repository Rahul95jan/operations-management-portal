import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef, SortingState } from "@tanstack/react-table";
import {
  Activity,
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  CircleSlash,
  ClipboardList,
  FileText,
  Layers,
  Percent,
  Search,
  Sparkles,
  Star,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  UserCog,
  Users,
  Video,
} from "lucide-react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";

import ProtectedRoute from "../../components/ProtectedRoute";
import QueryProvider from "../../components/opsIntel/QueryProvider";
import Sidebar from "../../components/opsIntel/Sidebar";
import PageHeader from "../../components/opsIntel/PageHeader";
import FilterBar from "../../components/opsIntel/FilterBar";
import KPICard, { KPICardSkeleton } from "../../components/opsIntel/KPICard";
import SectionCard from "../../components/opsIntel/SectionCard";
import DonutChart from "../../components/opsIntel/DonutChart";
import ComboTrendChart from "../../components/opsIntel/ComboTrendChart";
import ProgressMetricRow from "../../components/opsIntel/ProgressMetricRow";
import AttendanceTrendChart from "../../components/opsIntel/AttendanceTrendChart";
import CancellationTrendChart from "../../components/opsIntel/CancellationTrendChart";
import DataTable from "../../components/opsIntel/DataTable";
import RiskMatrixChart from "../../components/opsIntel/RiskMatrixChart";
import ActionItem from "../../components/opsIntel/ActionItem";
import StatusPill, { RiskPill } from "../../components/opsIntel/StatusPill";
import TrendBadge from "../../components/opsIntel/TrendBadge";
import SessionDetailDrawer from "../../components/opsIntel/SessionDetailDrawer";

import {
  getKPIs,
  getSessionHealth,
  getPerformanceTrend,
  getQuality,
  getAttendance,
  getAttendanceTrend,
  getBatchMatrix,
  getMentorPerformance,
  getRiskMatrix,
  getCompliance,
  getRecordingHealth,
  getReportHealth,
  getCancellations,
  getAttentionSessions,
  getAttentionBatches,
  getSignals,
  getActions,
  getSessions,
  getFilterOptions,
} from "../../lib/opsIntel/sessionReportsService";
import { percentTier, ratingTier, TIER_COLORS } from "../../lib/opsIntel/config";
import type { ActionItemData, BatchMatrixRow, Filters, MentorMatrixRow, RiskPoint, SessionRecord } from "../../lib/opsIntel/types";

const DEFAULT_FILTERS: Filters = { dateRange: "30d", courseId: "", batchId: "", mentorId: "", sessionType: "" };
const TREND_PERIODS: ("7D" | "30D" | "90D" | "6M" | "12M")[] = ["7D", "30D", "90D", "6M", "12M"];

function PctText({ value }: { value: number }) {
  const tier = percentTier(value);
  return <span style={{ color: TIER_COLORS[tier].text }} className="font-bold">{value}%</span>;
}
function RatingText({ value }: { value: number }) {
  const tier = ratingTier(value);
  return <span style={{ color: TIER_COLORS[tier].text }} className="font-bold">{value}</span>;
}
function TrendArrow({ dir }: { dir: "up" | "down" }) {
  return dir === "up" ? <TrendingUp size={15} className="text-status-good" /> : <TrendingDown size={15} className="text-status-critical" />;
}

function filtersFromQuery(query: Record<string, string | string[] | undefined>): Filters {
  const str = (v: string | string[] | undefined, fallback = "") => (typeof v === "string" ? v : fallback);
  return {
    dateRange: (str(query.dateRange, "30d") as Filters["dateRange"]) || "30d",
    customFrom: str(query.customFrom) || undefined,
    customTo: str(query.customTo) || undefined,
    courseId: str(query.courseId),
    batchId: str(query.batchId),
    mentorId: str(query.mentorId),
    sessionType: str(query.sessionType),
  };
}

function SessionOperationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [hydrated, setHydrated] = useState(false);
  const [trendPeriod, setTrendPeriod] = useState<"7D" | "30D" | "90D" | "6M" | "12M">("30D");
  const [healthFilter, setHealthFilter] = useState<string | null>(null);
  const [drawerSessionId, setDrawerSessionId] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "dateTime", desc: true }]);

  // Hydrate filters from the URL once the router is ready, then keep the URL
  // in sync on every subsequent change (shallow — no full page reloads).
  useEffect(() => {
    if (!router.isReady || hydrated) return;
    setFilters(filtersFromQuery(router.query));
    setHydrated(true);
  }, [router.isReady, hydrated, router.query]);

  useEffect(() => {
    if (!hydrated) return;
    const query: Record<string, string> = {};
    Object.entries(filters).forEach(([k, v]) => {
      if (v) query[k] = String(v);
    });
    router.replace({ pathname: router.pathname, query }, undefined, { shallow: true });
    setPage(1);
  }, [filters, hydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  const filterOptionsQ = useQuery({ queryKey: ["opsIntel", "filterOptions"], queryFn: getFilterOptions });

  const kpisQ = useQuery({ queryKey: ["opsIntel", "kpis", filters], queryFn: () => getKPIs(filters), enabled: hydrated });
  const healthQ = useQuery({ queryKey: ["opsIntel", "health", filters], queryFn: () => getSessionHealth(filters), enabled: hydrated });
  const trendQ = useQuery({ queryKey: ["opsIntel", "trend", filters, trendPeriod], queryFn: () => getPerformanceTrend(filters, trendPeriod), enabled: hydrated });
  const qualityQ = useQuery({ queryKey: ["opsIntel", "quality", filters], queryFn: () => getQuality(filters), enabled: hydrated });
  const attendanceQ = useQuery({ queryKey: ["opsIntel", "attendance", filters], queryFn: () => getAttendance(filters), enabled: hydrated });
  const attendanceTrendQ = useQuery({ queryKey: ["opsIntel", "attendanceTrend", filters], queryFn: () => getAttendanceTrend(filters), enabled: hydrated });
  const batchMatrixQ = useQuery({ queryKey: ["opsIntel", "batchMatrix", filters], queryFn: () => getBatchMatrix(filters), enabled: hydrated });
  const mentorMatrixQ = useQuery({ queryKey: ["opsIntel", "mentorMatrix", filters], queryFn: () => getMentorPerformance(filters), enabled: hydrated });
  const riskMatrixQ = useQuery({ queryKey: ["opsIntel", "riskMatrix", filters], queryFn: () => getRiskMatrix(filters), enabled: hydrated });
  const complianceQ = useQuery({ queryKey: ["opsIntel", "compliance", filters], queryFn: () => getCompliance(filters), enabled: hydrated });
  const recordingHealthQ = useQuery({ queryKey: ["opsIntel", "recordingHealth", filters], queryFn: () => getRecordingHealth(filters), enabled: hydrated });
  const reportHealthQ = useQuery({ queryKey: ["opsIntel", "reportHealth", filters], queryFn: () => getReportHealth(filters), enabled: hydrated });
  const cancellationsQ = useQuery({ queryKey: ["opsIntel", "cancellations", filters], queryFn: () => getCancellations(filters), enabled: hydrated });
  const attentionSessionsQ = useQuery({ queryKey: ["opsIntel", "attentionSessions", filters], queryFn: () => getAttentionSessions(filters), enabled: hydrated });
  const attentionBatchesQ = useQuery({ queryKey: ["opsIntel", "attentionBatches", filters], queryFn: () => getAttentionBatches(filters), enabled: hydrated });
  const signalsQ = useQuery({ queryKey: ["opsIntel", "signals", filters], queryFn: () => getSignals(filters), enabled: hydrated });
  const actionsQ = useQuery({ queryKey: ["opsIntel", "actions", filters], queryFn: () => getActions(filters), enabled: hydrated });

  const sortBy = (sorting[0]?.id ?? "dateTime") as keyof SessionRecord;
  const sortDir = sorting[0]?.desc ? "desc" : "asc";
  const sessionsQ = useQuery({
    queryKey: ["opsIntel", "sessions", filters, page, pageSize, search, sortBy, sortDir],
    queryFn: () => getSessions({ filters, page, pageSize, search, sortBy, sortDir }),
    enabled: hydrated,
    placeholderData: (prev) => prev,
  });

  const retry = (key: unknown[]) => queryClient.invalidateQueries({ queryKey: key });

  const handleReset = () => setFilters(DEFAULT_FILTERS);

  const batchColumns = useMemo<ColumnDef<BatchMatrixRow>[]>(
    () => [
      { accessorKey: "batch", header: "Batch", cell: (i) => <span className="font-bold text-navy-900">{i.getValue() as string}</span> },
      { accessorKey: "sessions", header: "Sessions" },
      { accessorKey: "learners", header: "Learners" },
      { accessorKey: "attendancePct", header: "Attendance", cell: (i) => <PctText value={i.getValue() as number} /> },
      { accessorKey: "rating", header: "Rating", cell: (i) => <RatingText value={i.getValue() as number} /> },
      { accessorKey: "recordingPct", header: "Recording", cell: (i) => <PctText value={i.getValue() as number} /> },
      { accessorKey: "reportPct", header: "Reports", cell: (i) => <PctText value={i.getValue() as number} /> },
      { accessorKey: "slaPct", header: "SLA", cell: (i) => <PctText value={i.getValue() as number} /> },
      { accessorKey: "risk", header: "Risk", cell: (i) => <RiskPill risk={i.getValue() as BatchMatrixRow["risk"]} /> },
      { accessorKey: "trend", header: "Trend", cell: (i) => <TrendArrow dir={i.getValue() as "up" | "down"} /> },
    ],
    []
  );

  const mentorColumns = useMemo<ColumnDef<MentorMatrixRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Mentor",
        cell: (i) => (
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-gold/15 text-gold-dark font-bold text-[11px] flex items-center justify-center flex-shrink-0">{i.row.original.initials}</span>
            <span className="font-bold text-navy-900">{i.getValue() as string}</span>
          </div>
        ),
      },
      { accessorKey: "sessions", header: "Sessions" },
      { accessorKey: "learners", header: "Learners" },
      { accessorKey: "attendancePct", header: "Attendance", cell: (i) => <PctText value={i.getValue() as number} /> },
      { accessorKey: "rating", header: "Rating", cell: (i) => <RatingText value={i.getValue() as number} /> },
      { accessorKey: "recordingPct", header: "Recording", cell: (i) => <PctText value={i.getValue() as number} /> },
      { accessorKey: "reportPct", header: "Reports", cell: (i) => <PctText value={i.getValue() as number} /> },
      { accessorKey: "status", header: "Status", cell: (i) => <RiskPill risk={i.getValue() as MentorMatrixRow["status"]} /> },
    ],
    []
  );

  const sessionColumns = useMemo<ColumnDef<SessionRecord>[]>(
    () => [
      { accessorKey: "id", header: "#", cell: (i) => <span className="text-slate-400 font-semibold">{(i.getValue() as string).replace("s", "")}</span> },
      { accessorKey: "dateTime", header: "Date & Time", cell: (i) => <span>{new Date(i.getValue() as string).toLocaleString(undefined, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span> },
      { accessorKey: "topic", header: "Session", cell: (i) => <span className="font-semibold text-navy-900">{i.getValue() as string}</span> },
      { accessorKey: "mentorName", header: "Mentor" },
      { accessorKey: "batchName", header: "Batch" },
      { accessorKey: "courseName", header: "Course" },
      { accessorKey: "learners", header: "Learners" },
      { accessorKey: "attended", header: "Attendance" },
      { accessorKey: "attendancePct", header: "Attendance %", cell: (i) => (i.getValue() !== null ? <PctText value={i.getValue() as number} /> : <span className="text-slate-300">N/A</span>) },
      { accessorKey: "rating", header: "Rating", cell: (i) => (i.getValue() !== null ? <RatingText value={i.getValue() as number} /> : <span className="text-slate-300">N/A</span>) },
      { accessorKey: "durationMinutes", header: "Duration", cell: (i) => `${i.getValue()} min` },
      { accessorKey: "recording", header: "Recording", cell: (i) => <StatusPill label={i.getValue() as string} /> },
      { accessorKey: "report", header: "Report", cell: (i) => <StatusPill label={i.getValue() as string} /> },
      { accessorKey: "sla", header: "SLA", cell: (i) => <StatusPill label={i.getValue() as string} /> },
      { accessorKey: "status", header: "Status", cell: (i) => <StatusPill label={i.getValue() as string} /> },
      {
        id: "actions",
        header: "Actions",
        cell: (i) => (
          <button onClick={() => setDrawerSessionId(i.row.original.id)} className="text-xs font-bold text-navy-900 bg-slate-100 hover:bg-slate-200 rounded-lg px-3 py-1.5">
            View
          </button>
        ),
      },
    ],
    []
  );

  const totalPages = sessionsQ.data ? Math.max(1, Math.ceil(sessionsQ.data.total / pageSize)) : 1;

  return (
    <div className="min-h-screen bg-surface flex">
      <Sidebar />
      <div className="flex-1 min-w-0 px-4 sm:px-6 lg:px-7 py-5 lg:py-6 pt-16 lg:pt-6">
        <PageHeader />

        <FilterBar
          filters={filters}
          onChange={setFilters}
          onReset={handleReset}
          courses={filterOptionsQ.data?.courses ?? []}
          mentors={filterOptionsQ.data?.mentors ?? []}
          sessionTypes={filterOptionsQ.data?.sessionTypes ?? []}
          exportRows={sessionsQ.data?.rows ?? []}
        />

        {/* KPI row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-5">
          {kpisQ.isLoading || !kpisQ.data
            ? Array.from({ length: 6 }).map((_, i) => <KPICardSkeleton key={i} />)
            : kpisQ.data.map((kpi, i) => {
                const icons = [CalendarClock, CheckCircle2, Users, Percent, Star, ShieldCheck];
                const colors = ["#0B1426", "#16A34A", "#2563EB", "#0891B2", "#A855F7", "#F5B82E"];
                return <KPICard key={kpi.id} kpi={kpi} icon={icons[i]} color={colors[i]} />;
              })}
        </div>

        {/* Health + Trend + Quality */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <SectionCard
            icon={Activity}
            iconColor="#DC2626"
            title="Session Health"
            subtitle="Overall session status based on attendance, rating and operations"
            isLoading={healthQ.isLoading}
            isError={healthQ.isError}
            onRetry={() => retry(["opsIntel", "health"])}
          >
            {healthQ.data && (
              <DonutChart
                segments={healthQ.data.segments}
                centerLabel={`${healthQ.data.total}`}
                centerSub="Total Sessions"
                onSegmentClick={(label) => setHealthFilter((prev) => (prev === label ? null : label))}
              />
            )}
          </SectionCard>

          <SectionCard
            icon={TrendingUp}
            iconColor="#3B82F6"
            title="Session Performance Trend"
            subtitle="Sessions, attendance and rating over time"
            className="lg:col-span-1"
            headerRight={
              <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                {TREND_PERIODS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setTrendPeriod(p)}
                    className={`text-[11px] font-bold px-2 py-1 rounded-md ${trendPeriod === p ? "bg-navy-900 text-white" : "text-slate-500"}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            }
            isLoading={trendQ.isLoading}
            isError={trendQ.isError}
            onRetry={() => retry(["opsIntel", "trend"])}
          >
            {trendQ.data && <ComboTrendChart data={trendQ.data} />}
          </SectionCard>

          <SectionCard icon={Star} iconColor="#A855F7" title="Session Quality" subtitle="Based on learner feedback" isLoading={qualityQ.isLoading} isError={qualityQ.isError} onRetry={() => retry(["opsIntel", "quality"])}>
            {qualityQ.data?.map((row) => (
              <ProgressMetricRow key={row.label} label={row.label} value={row.score} max={row.max} displayValue={`${row.score}/5`} trend={row.trend} barColor="#F5B82E" />
            ))}
          </SectionCard>
        </div>

        {/* Attendance row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <SectionCard icon={Users} iconColor="#0891B2" title="Attendance Intelligence" subtitle="Registered vs attended learners" isLoading={attendanceQ.isLoading} isError={attendanceQ.isError} onRetry={() => retry(["opsIntel", "attendance"])}>
            {attendanceQ.data && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <div className="bg-slate-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-extrabold text-navy-900">{attendanceQ.data.registered.toLocaleString()}</div>
                    <div className="text-[10px] font-bold uppercase text-slate-400 mt-0.5">Registered</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-extrabold text-navy-900">{attendanceQ.data.attended.toLocaleString()}</div>
                    <div className="text-[10px] font-bold uppercase text-slate-400 mt-0.5">Attended</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-extrabold text-navy-900">{attendanceQ.data.averagePct}%</div>
                    <div className="text-[10px] font-bold uppercase text-slate-400 mt-0.5 flex items-center justify-center gap-1">
                      Avg Attendance <TrendBadge trend={attendanceQ.data.averageTrend} compact />
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-extrabold text-navy-900">{attendanceQ.data.absenteeRate}%</div>
                    <div className="text-[10px] font-bold uppercase text-slate-400 mt-0.5 flex items-center justify-center gap-1">
                      Absentee Rate <TrendBadge trend={attendanceQ.data.absenteeTrend} compact />
                    </div>
                  </div>
                </div>
                <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-2">Attendance Distribution</div>
                <div className="grid grid-cols-3 gap-2">
                  {attendanceQ.data.distribution.map((d) => {
                    const color = d.tier === "high" ? TIER_COLORS.good : d.tier === "medium" ? TIER_COLORS.watch : TIER_COLORS.critical;
                    return (
                      <button
                        key={d.tier}
                        onClick={() => setHealthFilter(null)}
                        className="rounded-lg p-3 text-left"
                        style={{ backgroundColor: color.bg }}
                      >
                        <div className="text-[11px] font-bold" style={{ color: color.text }}>{d.label}</div>
                        <div className="text-lg font-extrabold text-navy-900 mt-1">{d.batches} batches</div>
                        <div className="text-xs font-semibold" style={{ color: color.text }}>{d.pct}%</div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </SectionCard>

          <SectionCard icon={TrendingUp} iconColor="#16A34A" title="Attendance Trend" subtitle="Attendance % vs Absentee %" isLoading={attendanceTrendQ.isLoading} isError={attendanceTrendQ.isError} onRetry={() => retry(["opsIntel", "attendanceTrend"])}>
            {attendanceTrendQ.data && <AttendanceTrendChart data={attendanceTrendQ.data} />}
          </SectionCard>
        </div>

        {/* Batch + Mentor tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <SectionCard
            icon={Layers}
            iconColor="#16A34A"
            title="Batch Operations Health Matrix"
            subtitle="Performance overview across all batches"
            onViewAll={() => document.getElementById("session-explorer")?.scrollIntoView({ behavior: "smooth" })}
            isLoading={batchMatrixQ.isLoading}
            isError={batchMatrixQ.isError}
            onRetry={() => retry(["opsIntel", "batchMatrix"])}
          >
            {batchMatrixQ.data && <DataTable columns={batchColumns} data={batchMatrixQ.data.slice(0, 5)} dense />}
          </SectionCard>

          <SectionCard
            icon={UserCog}
            iconColor="#2563EB"
            title="Mentor Session Performance"
            subtitle="Delivery and compliance by mentor"
            onViewAll={() => document.getElementById("session-explorer")?.scrollIntoView({ behavior: "smooth" })}
            isLoading={mentorMatrixQ.isLoading}
            isError={mentorMatrixQ.isError}
            onRetry={() => retry(["opsIntel", "mentorMatrix"])}
          >
            {mentorMatrixQ.data && (
              <DataTable
                columns={mentorColumns}
                data={mentorMatrixQ.data}
                dense
                onRowClick={(row) => router.push(`/mentor-performance/${encodeURIComponent(row.name)}`)}
              />
            )}
          </SectionCard>
        </div>

        {/* Risk + Compliance + Recording/Report health */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <SectionCard
            icon={AlertTriangle}
            iconColor="#DC2626"
            title="Session Risk Matrix"
            subtitle="Bubble size = learners, color = compliance"
            skeletonHeight={300}
            isLoading={riskMatrixQ.isLoading}
            isError={riskMatrixQ.isError}
            onRetry={() => retry(["opsIntel", "riskMatrix"])}
          >
            {riskMatrixQ.data && <RiskMatrixChart data={riskMatrixQ.data} onPointClick={(p: RiskPoint) => setDrawerSessionId(p.sessionId)} />}
          </SectionCard>

          <SectionCard icon={ClipboardList} iconColor="#F5B82E" title="Operational Compliance" subtitle="Delivery process adherence" isLoading={complianceQ.isLoading} isError={complianceQ.isError} onRetry={() => retry(["opsIntel", "compliance"])}>
            {complianceQ.data?.map((row) => (
              <ProgressMetricRow key={row.key} label={row.label} value={row.current} max={100} displayValue={`${row.current}%`} trend={row.trend} />
            ))}
          </SectionCard>

          <div className="flex flex-col gap-4">
            <SectionCard icon={Video} iconColor="#16A34A" title="Recording Health" isLoading={recordingHealthQ.isLoading} isError={recordingHealthQ.isError} onRetry={() => retry(["opsIntel", "recordingHealth"])} skeletonHeight={140}>
              {recordingHealthQ.data && <DonutChart segments={recordingHealthQ.data.segments} centerLabel={`${recordingHealthQ.data.total}`} centerSub="Sessions" />}
            </SectionCard>
            <SectionCard icon={FileText} iconColor="#2563EB" title="Report Health" isLoading={reportHealthQ.isLoading} isError={reportHealthQ.isError} onRetry={() => retry(["opsIntel", "reportHealth"])} skeletonHeight={140}>
              {reportHealthQ.data && <DonutChart segments={reportHealthQ.data.segments} centerLabel={`${reportHealthQ.data.total}`} centerSub="Sessions" />}
            </SectionCard>
          </div>
        </div>

        {/* Cancellations + Attention lists */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <SectionCard icon={CircleSlash} iconColor="#DC2626" title="Session Cancellation" isLoading={cancellationsQ.isLoading} isError={cancellationsQ.isError} onRetry={() => retry(["opsIntel", "cancellations"])}>
            {cancellationsQ.data && (
              <>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <div className="text-lg font-extrabold text-navy-900">{cancellationsQ.data.totalCancelled}</div>
                    <div className="text-[10px] font-bold uppercase text-slate-400">Total Cancelled</div>
                    <TrendBadge trend={cancellationsQ.data.totalCancelledTrend} compact />
                  </div>
                  <div>
                    <div className="text-lg font-extrabold text-navy-900">{cancellationsQ.data.cancellationRate}%</div>
                    <div className="text-[10px] font-bold uppercase text-slate-400">Cancellation Rate</div>
                    <TrendBadge trend={cancellationsQ.data.cancellationRateTrend} compact />
                  </div>
                  <div>
                    <div className="text-lg font-extrabold text-navy-900">{cancellationsQ.data.rescheduled}</div>
                    <div className="text-[10px] font-bold uppercase text-slate-400">Rescheduled</div>
                    <TrendBadge trend={cancellationsQ.data.rescheduledTrend} compact />
                  </div>
                  <div>
                    <div className="text-lg font-extrabold text-navy-900">{cancellationsQ.data.learnersImpacted}</div>
                    <div className="text-[10px] font-bold uppercase text-slate-400">Learners Impacted</div>
                    <TrendBadge trend={cancellationsQ.data.learnersImpactedTrend} compact />
                  </div>
                </div>
                <div className="text-[10.5px] font-bold uppercase tracking-wide text-slate-400 mb-1">Cancellation Trend</div>
                <CancellationTrendChart data={cancellationsQ.data.series} />
              </>
            )}
          </SectionCard>

          <SectionCard
            icon={AlertTriangle}
            iconColor="#F5B82E"
            title="Sessions Requiring Attention"
            onViewAll={() => document.getElementById("session-explorer")?.scrollIntoView({ behavior: "smooth" })}
            isLoading={attentionSessionsQ.isLoading}
            isError={attentionSessionsQ.isError}
            onRetry={() => retry(["opsIntel", "attentionSessions"])}
            isEmpty={attentionSessionsQ.data?.length === 0}
          >
            <div className="flex flex-col divide-y divide-slate-50 -mx-1">
              {attentionSessionsQ.data?.slice(0, 6).map((r) => (
                <button key={r.sessionId} onClick={() => setDrawerSessionId(r.sessionId)} className="text-left px-1 py-2 hover:bg-slate-50 rounded-md">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-navy-900 text-[12.5px] truncate">{r.session}</span>
                    <StatusPill label={r.status} />
                  </div>
                  <div className="text-[11px] text-slate-400">{r.batch} · {r.issue ?? "—"}</div>
                </button>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            icon={Layers}
            iconColor="#F59E0B"
            title="Batches Requiring Attention"
            onViewAll={() => document.getElementById("session-explorer")?.scrollIntoView({ behavior: "smooth" })}
            isLoading={attentionBatchesQ.isLoading}
            isError={attentionBatchesQ.isError}
            onRetry={() => retry(["opsIntel", "attentionBatches"])}
            isEmpty={attentionBatchesQ.data?.length === 0}
          >
            <div className="flex flex-col divide-y divide-slate-50 -mx-1">
              {attentionBatchesQ.data?.map((b) => (
                <div key={b.batch} className="flex items-center justify-between gap-2 px-1 py-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-navy-900 text-[12.5px] truncate">{b.batch}</div>
                    <div className="text-[11px] text-slate-400">Attendance {b.attendancePct}% · Rating {b.rating}</div>
                  </div>
                  <RiskPill risk={b.risk} />
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Signals + Action Center */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <SectionCard icon={Activity} iconColor="#0891B2" title="Operational Signals" subtitle="Key changes that require investigation" isLoading={signalsQ.isLoading} isError={signalsQ.isError} onRetry={() => retry(["opsIntel", "signals"])}>
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-[12.5px] min-w-[480px]">
                <thead>
                  <tr className="text-left text-[10px] uppercase text-slate-400 font-bold border-b-2 border-slate-100">
                    <th className="px-2 py-2">Metric</th>
                    <th className="px-2 py-2">Current</th>
                    <th className="px-2 py-2">Previous</th>
                    <th className="px-2 py-2">Change</th>
                    <th className="px-2 py-2">Affected Area</th>
                    <th className="px-2 py-2">Sample</th>
                  </tr>
                </thead>
                <tbody>
                  {signalsQ.data?.map((s) => (
                    <tr key={s.id} className="border-b border-slate-50 last:border-0">
                      <td className="px-2 py-2 font-semibold text-navy-900">{s.metric}</td>
                      <td className="px-2 py-2">{s.current}</td>
                      <td className="px-2 py-2 text-slate-400">{s.previous}</td>
                      <td className="px-2 py-2"><TrendBadge trend={s.change} compact /></td>
                      <td className="px-2 py-2 text-slate-500">{s.affectedArea}</td>
                      <td className="px-2 py-2 text-slate-400">{s.sampleSize}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <SectionCard
            icon={Sparkles}
            iconColor="#A855F7"
            title="Session Operations Action Center"
            subtitle="Data-driven recommendations based on current trends"
            isLoading={actionsQ.isLoading}
            isError={actionsQ.isError}
            onRetry={() => retry(["opsIntel", "actions"])}
            isEmpty={actionsQ.data?.length === 0}
            emptyMessage="No operational issues detected right now."
          >
            {actionsQ.data?.map((item: ActionItemData) => (
              <ActionItem key={item.id} item={item} onInvestigate={(i) => { setSearch(i.affectedBatch); document.getElementById("session-explorer")?.scrollIntoView({ behavior: "smooth" }); }} />
            ))}
          </SectionCard>
        </div>

        {/* Session Explorer */}
        <div id="session-explorer" className="bg-white border border-border rounded-card shadow-card p-4 sm:p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="font-extrabold text-navy-900 text-[15.5px]">Session Explorer</h2>
              <p className="text-[11.5px] text-slate-400">Deep-dive into individual sessions</p>
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => { setPage(1); setSearch(e.target.value); }}
                placeholder="Search sessions, mentors, batches…"
                className="text-[13px] border border-border rounded-lg pl-8 pr-3 py-2 w-full md:w-72 outline-none focus:border-gold"
              />
            </div>
          </div>

          {sessionsQ.isLoading && !sessionsQ.data ? (
            <div className="animate-pulse h-64 bg-slate-100 rounded-lg" />
          ) : sessionsQ.isError ? (
            <div className="text-center py-10 text-status-critical font-semibold">Couldn&apos;t load sessions. <button onClick={() => retry(["opsIntel", "sessions"])} className="underline">Retry</button></div>
          ) : (
            <>
              <DataTable
                columns={sessionColumns}
                data={sessionsQ.data?.rows ?? []}
                manualSorting
                sorting={sorting}
                onSortingChange={setSorting}
                rowKey={(row) => row.id}
              />
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 text-[12.5px]">
                <div className="flex items-center gap-2 text-slate-500">
                  Showing {sessionsQ.data ? Math.min((page - 1) * pageSize + 1, sessionsQ.data.total) : 0}–{sessionsQ.data ? Math.min(page * pageSize, sessionsQ.data.total) : 0} of {sessionsQ.data?.total ?? 0} results
                  <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="border border-border rounded-md px-2 py-1 ml-2">
                    {[10, 20, 50].map((n) => <option key={n} value={n}>{n} / page</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="font-bold text-slate-600 disabled:opacity-30 px-2 py-1">Previous</button>
                  <span className="font-bold text-navy-900">{page} / {totalPages}</span>
                  <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="font-bold text-slate-600 disabled:opacity-30 px-2 py-1">Next</button>
                </div>
              </div>
            </>
          )}
        </div>

        <SessionDetailDrawer sessionId={drawerSessionId} onClose={() => setDrawerSessionId(null)} />
      </div>
    </div>
  );
}

export default function SessionOperationsIntelligencePage() {
  return (
    <ProtectedRoute permission={["session_reports", "view"]}>
      <Head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Dancing+Script:wght@600&display=swap" />
      </Head>
      <QueryProvider>
        <SessionOperationsPage />
      </QueryProvider>
    </ProtectedRoute>
  );
}
