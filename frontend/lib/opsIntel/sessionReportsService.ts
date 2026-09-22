// Mock implementation of the Session Operations Intelligence data layer.
// Every function here is async and typed exactly as a real API-backed
// version would be — swapping this file for one that calls a backend is the
// only change the rest of the app would ever need.

import { ALL_SESSIONS, BATCHES, COURSES, MENTORS } from "./mockData";
import { evaluateActionRules } from "./actionRules";
import { HIGHER_IS_BETTER, RISK_MATRIX_DIVIDERS, SIGNAL_RULES, isGoodTrend, trendDirection } from "./config";
import type {
  ActionItemData,
  AttendanceIntel,
  AttendanceTrendPoint,
  AttentionBatchRow,
  AttentionSessionRow,
  BatchMatrixRow,
  CancellationStats,
  ComplianceRow,
  Filters,
  HealthDonut,
  KPI,
  MentorMatrixRow,
  PagedSessions,
  QualityRow,
  RiskPoint,
  SessionRecord,
  Signal,
  SortDirection,
  TrendInfo,
  TrendPoint,
} from "./types";

// ---- generic helpers -------------------------------------------------

function delay<T>(value: T): Promise<T> {
  const ms = 250 + Math.random() * 350;
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function daysAgo(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

function windowDays(filters: Filters): number {
  switch (filters.dateRange) {
    case "7d":
      return 7;
    case "90d":
      return 90;
    case "thisMonth":
      return new Date().getDate();
    case "custom": {
      if (filters.customFrom && filters.customTo) {
        const span = (new Date(filters.customTo).getTime() - new Date(filters.customFrom).getTime()) / 86400000;
        return Math.max(1, Math.round(span));
      }
      return 30;
    }
    case "30d":
    default:
      return 30;
  }
}

function applyAttributeFilters(sessions: SessionRecord[], filters: Filters): SessionRecord[] {
  return sessions.filter(
    (s) =>
      (!filters.courseId || s.courseId === filters.courseId) &&
      (!filters.batchId || s.batchId === filters.batchId) &&
      (!filters.mentorId || s.mentorId === filters.mentorId) &&
      (!filters.sessionType || s.sessionType === filters.sessionType)
  );
}

function splitWindows(filters: Filters): { current: SessionRecord[]; previous: SessionRecord[] } {
  const attrFiltered = applyAttributeFilters(ALL_SESSIONS, filters);
  const w = windowDays(filters);
  const current = attrFiltered.filter((s) => daysAgo(s.dateTime) < w);
  const previous = attrFiltered.filter((s) => daysAgo(s.dateTime) >= w && daysAgo(s.dateTime) < w * 2);
  return { current, previous };
}

function avg(nums: number[]): number | null {
  const vals = nums.filter((n) => n !== null && n !== undefined && !Number.isNaN(n));
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function round(n: number | null, dp = 0): number {
  if (n === null || n === undefined) return 0;
  const f = Math.pow(10, dp);
  return Math.round(n * f) / f;
}

function pct(part: number, total: number): number {
  return total ? round((part / total) * 100) : 0;
}

// Absolute delta — for metrics already expressed as a percentage or small
// score (attendance %, compliance %, rating), so the badge reads "+5 pts"/"+0.3".
function buildTrend(metricKey: string, current: number, previous: number, dp = 0): TrendInfo {
  const delta = round(current - previous, dp);
  const direction = trendDirection(current, previous);
  return { value: delta, direction, isGood: isGoodTrend(metricKey, direction) };
}

// Relative % change — for count-based metrics (sessions, learners) where the
// KPI card renders a "%" suffix; a raw count difference there would be wrong.
function buildPctTrend(metricKey: string, current: number, previous: number): TrendInfo {
  const value = previous ? round(((current - previous) / previous) * 100) : 0;
  const direction = trendDirection(current, previous);
  return { value, direction, isGood: isGoodTrend(metricKey, direction) };
}

function completedOf(sessions: SessionRecord[]): SessionRecord[] {
  return sessions.filter((s) => s.status === "Completed");
}

// ---- filter option lists ----------------------------------------------

export async function getFilterOptions() {
  return delay({ courses: COURSES, batches: BATCHES, mentors: MENTORS, sessionTypes: ["Live Class", "Doubt Clearing", "Project Review", "Guest Lecture"] });
}

export { batchesForCourse } from "./mockData";

// ---- KPIs ---------------------------------------------------------------

export async function getKPIs(filters: Filters): Promise<KPI[]> {
  const { current, previous } = splitWindows(filters);
  const c = completedOf(current);
  const p = completedOf(previous);

  const totalSessions = current.length;
  const prevTotalSessions = previous.length || 1;
  const completedSessions = c.length;
  const completionRate = pct(completedSessions, totalSessions);

  const totalLearners = c.reduce((sum, s) => sum + s.attended, 0);
  const prevLearners = p.reduce((sum, s) => sum + s.attended, 0) || 1;

  const avgAttendance = round(avg(c.map((s) => s.attendancePct ?? 0)) ?? 0);
  const prevAvgAttendance = round(avg(p.map((s) => s.attendancePct ?? 0)) ?? 0);

  const ratedSessions = c.filter((s) => s.rating !== null);
  const avgRating = round(avg(ratedSessions.map((s) => s.rating as number)) ?? 0, 1);
  const prevRatedSessions = p.filter((s) => s.rating !== null);
  const prevAvgRating = round(avg(prevRatedSessions.map((s) => s.rating as number)) ?? 0, 1);

  const compliance = round(
    ((pct(c.filter((s) => s.recording === "Available").length, c.length) +
      pct(c.filter((s) => s.report === "Ready").length, c.length) +
      pct(c.filter((s) => s.sla === "On Time").length, c.length)) /
      3)
  );
  const prevCompliance = round(
    ((pct(p.filter((s) => s.recording === "Available").length, p.length) +
      pct(p.filter((s) => s.report === "Ready").length, p.length) +
      pct(p.filter((s) => s.sla === "On Time").length, p.length)) /
      3)
  );

  const kpis: KPI[] = [
    {
      id: "totalSessions",
      label: "Total Sessions",
      value: totalSessions.toLocaleString(),
      trend: buildPctTrend("totalSessions", totalSessions, prevTotalSessions),
      caption: "vs previous period",
    },
    {
      id: "completedSessions",
      label: "Completed Sessions",
      value: completedSessions.toLocaleString(),
      trend: buildPctTrend("completedSessions", completedSessions, p.length || 1),
      caption: `${completionRate}% Completion Rate`,
      captionTone: "good",
    },
    {
      id: "totalLearners",
      label: "Total Learners",
      value: totalLearners.toLocaleString(),
      trend: buildPctTrend("totalLearners", totalLearners, prevLearners),
      caption: "Unique learner-sessions",
    },
    {
      id: "avgAttendance",
      label: "Avg Attendance",
      value: `${avgAttendance}%`,
      trend: buildTrend("attendance", avgAttendance, prevAvgAttendance),
      caption: `Based on ${c.length} sessions`,
    },
    {
      id: "avgRating",
      label: "Avg Session Rating",
      value: `${avgRating} / 5`,
      trend: buildTrend("rating", avgRating, prevAvgRating, 1),
      caption: `Based on ${ratedSessions.length} responses`,
    },
    {
      id: "operationalCompliance",
      label: "Operational Compliance",
      value: `${compliance}%`,
      trend: buildTrend("operationalCompliance", compliance, prevCompliance),
      caption: "Recording | Report | SLA",
    },
  ];

  return delay(kpis);
}

// ---- Session Health -------------------------------------------------

export async function getSessionHealth(filters: Filters): Promise<HealthDonut> {
  const { current } = splitWindows(filters);
  const c = completedOf(current);
  const healthy = c.filter((s) => s.risk === "Healthy").length;
  const atRisk = c.filter((s) => s.risk === "Watch").length;
  const critical = c.filter((s) => s.risk === "Critical").length;
  const total = c.length || 1;

  return delay({
    total: c.length,
    segments: [
      { label: "Healthy", count: healthy, pct: pct(healthy, total), color: "#16A34A" },
      { label: "At Risk", count: atRisk, pct: pct(atRisk, total), color: "#F59E0B" },
      { label: "Critical", count: critical, pct: pct(critical, total), color: "#DC2626" },
    ],
  });
}

// ---- Performance trend ------------------------------------------------

export async function getPerformanceTrend(filters: Filters, period: "7D" | "30D" | "90D" | "6M" | "12M"): Promise<TrendPoint[]> {
  const days = { "7D": 7, "30D": 30, "90D": 90, "6M": 182, "12M": 365 }[period];
  const bucketDays = days > 90 ? 7 : 1;
  const bucketCount = Math.ceil(days / bucketDays);
  const attrFiltered = applyAttributeFilters(ALL_SESSIONS, filters);

  const buckets: { end: Date; sessions: SessionRecord[] }[] = [];
  for (let i = bucketCount - 1; i >= 0; i--) {
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() - i * bucketDays);
    buckets.push({ end, sessions: [] });
  }
  attrFiltered.forEach((s) => {
    const age = daysAgo(s.dateTime);
    if (age >= days) return;
    const idx = bucketCount - 1 - Math.floor(age / bucketDays);
    if (buckets[idx]) buckets[idx].sessions.push(s);
  });

  const points: TrendPoint[] = buckets.map((b) => {
    const completed = completedOf(b.sessions);
    return {
      label: b.end.toLocaleDateString(undefined, { day: "2-digit", month: "short" }),
      sessions: b.sessions.length,
      attendancePct: completed.length ? round(avg(completed.map((s) => s.attendancePct ?? 0))) : null,
      rating: completed.some((s) => s.rating !== null) ? round(avg(completed.filter((s) => s.rating !== null).map((s) => s.rating as number)), 1) : null,
    };
  });

  return delay(points);
}

// ---- Quality -------------------------------------------------------

export async function getQuality(filters: Filters): Promise<QualityRow[]> {
  const { current, previous } = splitWindows(filters);
  const c = completedOf(current).filter((s) => s.rating !== null);
  const p = completedOf(previous).filter((s) => s.rating !== null);

  // Mock sub-scores derived from the overall rating with small deterministic
  // offsets — a real backend would source these from separate feedback
  // dimensions the same way the overall rating is sourced here.
  const base = round(avg(c.map((s) => s.rating as number)) ?? 0, 1);
  const prevBase = round(avg(p.map((s) => s.rating as number)) ?? 0, 1);

  const rows: QualityRow[] = [
    { label: "Teaching Method", score: round(Math.min(5, base + 0.1), 1), max: 5, trend: buildTrend("rating", base + 0.1, prevBase + 0.1, 1) },
    { label: "Doubt Resolution", score: round(Math.max(0, base - 0.1), 1), max: 5, trend: buildTrend("rating", base - 0.1, prevBase - 0.15, 1) },
    { label: "Overall Experience", score: base, max: 5, trend: buildTrend("rating", base, prevBase, 1) },
  ];
  return delay(rows);
}

// ---- Attendance Intelligence -----------------------------------------

export async function getAttendance(filters: Filters): Promise<AttendanceIntel> {
  const { current, previous } = splitWindows(filters);
  const c = completedOf(current);
  const p = completedOf(previous);

  const registered = c.reduce((s, r) => s + r.learners, 0);
  const attended = c.reduce((s, r) => s + r.attended, 0);
  const averagePct = round(avg(c.map((s) => s.attendancePct ?? 0)) ?? 0);
  const prevAveragePct = round(avg(p.map((s) => s.attendancePct ?? 0)) ?? 0);
  const absenteeRate = round(registered ? ((registered - attended) / registered) * 100 : 0);
  const prevRegistered = p.reduce((s, r) => s + r.learners, 0);
  const prevAttended = p.reduce((s, r) => s + r.attended, 0);
  const prevAbsenteeRate = round(prevRegistered ? ((prevRegistered - prevAttended) / prevRegistered) * 100 : 0);

  // Batch-level distribution, computed from the same current-window sessions.
  const byBatch = new Map<string, number[]>();
  c.forEach((s) => {
    if (s.attendancePct === null) return;
    if (!byBatch.has(s.batchId)) byBatch.set(s.batchId, []);
    byBatch.get(s.batchId)!.push(s.attendancePct);
  });
  const batchAverages = Array.from(byBatch.values()).map((vals) => avg(vals) ?? 0);
  const high = batchAverages.filter((v) => v >= 90).length;
  const medium = batchAverages.filter((v) => v >= 75 && v < 90).length;
  const low = batchAverages.filter((v) => v < 75).length;
  const totalBatches = batchAverages.length || 1;

  return delay({
    registered,
    attended,
    averagePct,
    averageTrend: buildTrend("attendance", averagePct, prevAveragePct),
    absenteeRate,
    absenteeTrend: buildTrend("absenteeRate", absenteeRate, prevAbsenteeRate),
    distribution: [
      { tier: "high", label: "High (≥ 90%)", batches: high, pct: pct(high, totalBatches) },
      { tier: "medium", label: "Medium (75%–89%)", batches: medium, pct: pct(medium, totalBatches) },
      { tier: "low", label: "Low (< 75%)", batches: low, pct: pct(low, totalBatches) },
    ],
  });
}

export async function getAttendanceTrend(filters: Filters): Promise<AttendanceTrendPoint[]> {
  const points = await getPerformanceTrend(filters, "30D");
  return points.map((p) => ({
    label: p.label,
    attendancePct: p.attendancePct ?? 0,
    absenteePct: p.attendancePct !== null ? round(100 - p.attendancePct) : 0,
  }));
}

// ---- Batch / Mentor matrices --------------------------------------------

function riskFromMetrics(attendancePct: number, rating: number, recordingPct: number, reportPct: number): "Healthy" | "Watch" | "Critical" {
  if (attendancePct < 60 || rating < 3) return "Critical";
  if (attendancePct < 75 || rating < 3.5 || recordingPct < 80 || reportPct < 80) return "Watch";
  return "Healthy";
}

export async function getBatchMatrix(filters: Filters): Promise<BatchMatrixRow[]> {
  const { current } = splitWindows(filters);
  const c = completedOf(current);

  const rows: BatchMatrixRow[] = BATCHES.map((batch) => {
    const rows_ = c.filter((s) => s.batchId === batch.id);
    if (!rows_.length) return null;
    const sessions = rows_.length;
    const learners = rows_.reduce((s, r) => s + r.attended, 0);
    const attendancePct = round(avg(rows_.map((s) => s.attendancePct ?? 0)) ?? 0);
    const rated = rows_.filter((s) => s.rating !== null);
    const rating = round(avg(rated.map((s) => s.rating as number)) ?? 0, 1);
    const recordingPct = pct(rows_.filter((s) => s.recording === "Available").length, sessions);
    const reportPct = pct(rows_.filter((s) => s.report === "Ready").length, sessions);
    const slaPct = pct(rows_.filter((s) => s.sla === "On Time").length, sessions);

    // Trend: chronological first-half vs second-half attendance within batch.
    const sorted = [...rows_].sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
    const mid = Math.floor(sorted.length / 2) || 1;
    const earlier = avg(sorted.slice(0, mid).map((s) => s.attendancePct ?? 0)) ?? attendancePct;
    const recent = avg(sorted.slice(mid).map((s) => s.attendancePct ?? 0)) ?? attendancePct;

    return {
      batchId: batch.id,
      batch: batch.name,
      sessions,
      learners,
      attendancePct,
      rating,
      recordingPct,
      reportPct,
      slaPct,
      risk: riskFromMetrics(attendancePct, rating, recordingPct, reportPct),
      trend: recent >= earlier ? "up" : "down",
    } as BatchMatrixRow;
  }).filter((r): r is BatchMatrixRow => r !== null);

  return delay(rows.sort((a, b) => b.sessions - a.sessions));
}

export async function getMentorPerformance(filters: Filters): Promise<MentorMatrixRow[]> {
  const { current } = splitWindows(filters);
  const c = completedOf(current);

  const rows: MentorMatrixRow[] = MENTORS.map((mentor) => {
    const rows_ = c.filter((s) => s.mentorId === mentor.id);
    if (!rows_.length) return null;
    const sessions = rows_.length;
    const learners = rows_.reduce((s, r) => s + r.attended, 0);
    const attendancePct = round(avg(rows_.map((s) => s.attendancePct ?? 0)) ?? 0);
    const rated = rows_.filter((s) => s.rating !== null);
    const rating = round(avg(rated.map((s) => s.rating as number)) ?? 0, 1);
    const recordingPct = pct(rows_.filter((s) => s.recording === "Available").length, sessions);
    const reportPct = pct(rows_.filter((s) => s.report === "Ready").length, sessions);

    return {
      mentorId: mentor.id,
      name: mentor.name,
      initials: mentor.initials,
      sessions,
      learners,
      attendancePct,
      rating,
      recordingPct,
      reportPct,
      status: riskFromMetrics(attendancePct, rating, recordingPct, reportPct),
    } as MentorMatrixRow;
  }).filter((r): r is MentorMatrixRow => r !== null);

  return delay(rows.sort((a, b) => b.sessions - a.sessions));
}

// ---- Risk matrix -----------------------------------------------------

export async function getRiskMatrix(filters: Filters): Promise<RiskPoint[]> {
  const { current } = splitWindows(filters);
  const c = completedOf(current).filter((s) => s.attendancePct !== null && s.rating !== null);

  const points: RiskPoint[] = c.map((s) => {
    const compliant = s.recording === "Available" && s.report === "Ready" && s.sla === "On Time";
    const compliance: "Healthy" | "Watch" | "Critical" = compliant ? "Healthy" : s.recording === "Missing" || s.report === "Missing" ? "Critical" : "Watch";
    return {
      sessionId: s.id,
      sessionName: s.topic,
      mentor: s.mentorName,
      batch: s.batchName,
      attendancePct: s.attendancePct as number,
      rating: s.rating as number,
      learners: s.attended,
      compliance,
    };
  });

  return delay(points);
}

export const riskMatrixDividers = RISK_MATRIX_DIVIDERS;

// ---- Compliance / Recording / Report health ---------------------------

export async function getCompliance(filters: Filters): Promise<ComplianceRow[]> {
  const { current, previous } = splitWindows(filters);
  const c = completedOf(current);
  const p = completedOf(previous);

  const row = (key: string, label: string, curPct: number, prevPct: number): ComplianceRow => ({
    key,
    label,
    current: curPct,
    previous: prevPct,
    trend: buildTrend(key, curPct, prevPct),
  });

  return delay([
    row("sessionStartCompliance", "Session Start Compliance", pct(c.filter((s) => s.sla === "On Time").length, c.length), pct(p.filter((s) => s.sla === "On Time").length, p.length)),
    row("recordingCompliance", "Recording Compliance", pct(c.filter((s) => s.recording === "Available").length, c.length), pct(p.filter((s) => s.recording === "Available").length, p.length)),
    row("reportCompletion", "Report Completion", pct(c.filter((s) => s.report === "Ready").length, c.length), pct(p.filter((s) => s.report === "Ready").length, p.length)),
    row("resourceUpload", "Resource Upload", pct(c.filter((s) => s.recording !== "Missing").length, c.length), pct(p.filter((s) => s.recording !== "Missing").length, p.length)),
    row("slaAdherence", "SLA Adherence", pct(c.filter((s) => s.sla === "On Time").length, c.length), pct(p.filter((s) => s.sla === "On Time").length, p.length)),
  ]);
}

export async function getRecordingHealth(filters: Filters) {
  const { current } = splitWindows(filters);
  const c = completedOf(current);
  const available = c.filter((s) => s.recording === "Available").length;
  const pending = c.filter((s) => s.recording === "Pending").length;
  const missing = c.filter((s) => s.recording === "Missing").length;
  const total = c.length || 1;
  return delay({
    total: c.length,
    segments: [
      { label: "Available", count: available, pct: pct(available, total), color: "#16A34A" },
      { label: "Pending", count: pending, pct: pct(pending, total), color: "#F59E0B" },
      { label: "Missing", count: missing, pct: pct(missing, total), color: "#DC2626" },
    ],
  });
}

export async function getReportHealth(filters: Filters) {
  const { current } = splitWindows(filters);
  const c = completedOf(current);
  const ready = c.filter((s) => s.report === "Ready").length;
  const pending = c.filter((s) => s.report === "Pending").length;
  const missing = c.filter((s) => s.report === "Missing").length;
  const total = c.length || 1;
  return delay({
    total: c.length,
    segments: [
      { label: "Ready", count: ready, pct: pct(ready, total), color: "#16A34A" },
      { label: "Pending", count: pending, pct: pct(pending, total), color: "#F59E0B" },
      { label: "Missing", count: missing, pct: pct(missing, total), color: "#DC2626" },
    ],
  });
}

// ---- Cancellations -----------------------------------------------------

export async function getCancellations(filters: Filters): Promise<CancellationStats> {
  const { current, previous } = splitWindows(filters);
  const cancelled = current.filter((s) => s.status === "Cancelled");
  const prevCancelled = previous.filter((s) => s.status === "Cancelled");
  const rescheduled = current.filter((s) => s.status === "Rescheduled");
  const prevRescheduled = previous.filter((s) => s.status === "Rescheduled");
  const learnersImpacted = cancelled.reduce((s, r) => s + r.learners, 0);
  const prevLearnersImpacted = prevCancelled.reduce((s, r) => s + r.learners, 0);
  const rate = round(current.length ? (cancelled.length / current.length) * 100 : 0, 1);
  const prevRate = round(previous.length ? (prevCancelled.length / previous.length) * 100 : 0, 1);

  const days = windowDays(filters);
  const bucketCount = 8;
  const bucketSize = Math.max(1, Math.ceil(days / bucketCount));
  const series = Array.from({ length: bucketCount }, (_, i) => {
    const startAge = (bucketCount - i) * bucketSize;
    const endAge = (bucketCount - i - 1) * bucketSize;
    const count = cancelled.filter((s) => {
      const age = daysAgo(s.dateTime);
      return age >= endAge && age < startAge;
    }).length;
    return { label: `${endAge}d`, count };
  });

  return delay({
    totalCancelled: cancelled.length,
    totalCancelledTrend: buildTrend("totalCancelled", cancelled.length, prevCancelled.length || 1),
    cancellationRate: rate,
    cancellationRateTrend: buildTrend("cancellationRate", rate, prevRate || 0.1),
    rescheduled: rescheduled.length,
    rescheduledTrend: buildTrend("rescheduled", rescheduled.length, prevRescheduled.length || 1),
    learnersImpacted,
    learnersImpactedTrend: buildTrend("learnersImpacted", learnersImpacted, prevLearnersImpacted || 1),
    series,
  });
}

// ---- Attention lists -----------------------------------------------------

export async function getAttentionSessions(filters: Filters): Promise<AttentionSessionRow[]> {
  const { current } = splitWindows(filters);
  const flagged = completedOf(current).filter((s) => s.risk !== "Healthy");

  const rows: AttentionSessionRow[] = flagged
    .map((s) => ({
      sessionId: s.id,
      session: s.topic,
      dateTime: s.dateTime,
      batch: s.batchName,
      attendancePct: s.attendancePct,
      rating: s.rating,
      issue: s.issue,
      status: (s.risk === "Critical" ? "Critical" : "Watch") as "Critical" | "Watch",
    }))
    .sort((a, b) => (a.status === b.status ? 0 : a.status === "Critical" ? -1 : 1));

  return delay(rows);
}

export async function getAttentionBatches(filters: Filters): Promise<AttentionBatchRow[]> {
  const matrix = await getBatchMatrix(filters);
  const rows: AttentionBatchRow[] = matrix
    .filter((b) => b.risk !== "Healthy")
    .map((b) => ({
      batch: b.batch,
      attendancePct: b.attendancePct,
      rating: b.rating,
      compliancePct: round((b.recordingPct + b.reportPct + b.slaPct) / 3),
      sessions: b.sessions,
      risk: b.risk,
    }));
  return delay(rows);
}

// ---- Signals + Action Center --------------------------------------------

export async function getSignals(filters: Filters): Promise<Signal[]> {
  const { current, previous } = splitWindows(filters);
  const c = completedOf(current);
  const p = completedOf(previous);

  const worstBatch = (metric: (s: SessionRecord) => number) => {
    const byBatch = new Map<string, number[]>();
    c.forEach((s) => {
      if (!byBatch.has(s.batchName)) byBatch.set(s.batchName, []);
      byBatch.get(s.batchName)!.push(metric(s));
    });
    let worstName = "Multiple batches";
    let worstAvg = Infinity;
    byBatch.forEach((vals, name) => {
      const a = avg(vals) ?? 0;
      if (a < worstAvg) {
        worstAvg = a;
        worstName = name;
      }
    });
    return worstName;
  };

  const attendanceCur = round(avg(c.map((s) => s.attendancePct ?? 0)) ?? 0);
  const attendancePrev = round(avg(p.map((s) => s.attendancePct ?? 0)) ?? 0);

  const reportCur = pct(c.filter((s) => s.report === "Ready").length, c.length);
  const reportPrev = pct(p.filter((s) => s.report === "Ready").length, p.length);

  const recordingCur = pct(c.filter((s) => s.recording === "Available").length, c.length);
  const recordingPrev = pct(p.filter((s) => s.recording === "Available").length, p.length);

  const ratedC = c.filter((s) => s.rating !== null);
  const ratedP = p.filter((s) => s.rating !== null);
  const ratingCur = round(avg(ratedC.map((s) => s.rating as number)) ?? 0, 1);
  const ratingPrev = round(avg(ratedP.map((s) => s.rating as number)) ?? 0, 1);

  const cancelCur = current.filter((s) => s.status === "Cancelled").length;
  const cancelPrev = previous.filter((s) => s.status === "Cancelled").length;

  const signals: Signal[] = [
    {
      id: "attendance",
      metric: "Attendance",
      current: `${attendanceCur}%`,
      previous: `${attendancePrev}%`,
      change: buildTrend("attendance", attendanceCur, attendancePrev),
      affectedArea: worstBatch((s) => s.attendancePct ?? 0),
      sampleSize: c.length,
    },
    {
      id: "reportCompletion",
      metric: "Report Completion",
      current: `${reportCur}%`,
      previous: `${reportPrev}%`,
      change: buildTrend("reportCompletion", reportCur, reportPrev),
      affectedArea: worstBatch((s) => (s.report === "Ready" ? 100 : 0)),
      sampleSize: c.length,
    },
    {
      id: "recordingCompliance",
      metric: "Recording Compliance",
      current: `${recordingCur}%`,
      previous: `${recordingPrev}%`,
      change: buildTrend("recordingCompliance", recordingCur, recordingPrev),
      affectedArea: worstBatch((s) => (s.recording === "Available" ? 100 : 0)),
      sampleSize: c.length,
    },
    {
      id: "rating",
      metric: "Session Rating",
      current: `${ratingCur}`,
      previous: `${ratingPrev}`,
      change: buildTrend("rating", ratingCur, ratingPrev, 1),
      affectedArea: worstBatch((s) => s.rating ?? 0),
      sampleSize: ratedC.length,
    },
    {
      id: "cancellations",
      metric: "Cancellations",
      current: `${cancelCur}`,
      previous: `${cancelPrev}`,
      change: buildTrend("totalCancelled", cancelCur, cancelPrev || 1),
      affectedArea: worstBatch(() => 0),
      sampleSize: current.length,
    },
  ];

  return delay(signals);
}

export async function getActions(filters: Filters): Promise<ActionItemData[]> {
  const [signals, batches] = await Promise.all([getSignals(filters), getBatchMatrix(filters)]);
  return delay(evaluateActionRules({ signals, batches }));
}

export { SIGNAL_RULES };

// ---- Session Explorer ------------------------------------------------

export interface SessionExplorerParams {
  filters: Filters;
  page: number;
  pageSize: number;
  search: string;
  sortBy: keyof SessionRecord;
  sortDir: SortDirection;
}

export async function getSessions(params: SessionExplorerParams): Promise<PagedSessions> {
  const { filters, page, pageSize, search, sortBy, sortDir } = params;
  const { current } = splitWindows(filters);

  let rows = current;
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    rows = rows.filter(
      (s) =>
        s.topic.toLowerCase().includes(q) ||
        s.mentorName.toLowerCase().includes(q) ||
        s.batchName.toLowerCase().includes(q) ||
        s.courseName.toLowerCase().includes(q)
    );
  }

  rows = [...rows].sort((a, b) => {
    const av = a[sortBy] as unknown as number | string | null;
    const bv = b[sortBy] as unknown as number | string | null;
    if (av === null || av === undefined) return 1;
    if (bv === null || bv === undefined) return -1;
    if (typeof av === "string") return sortDir === "asc" ? av.localeCompare(bv as string) : (bv as string).localeCompare(av);
    return sortDir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number);
  });

  const total = rows.length;
  const start = (page - 1) * pageSize;
  const paged = rows.slice(start, start + pageSize);

  return delay({ rows: paged, total, page, pageSize });
}

export async function getSessionById(id: string): Promise<SessionRecord | null> {
  return delay(ALL_SESSIONS.find((s) => s.id === id) ?? null);
}

export { HIGHER_IS_BETTER };
