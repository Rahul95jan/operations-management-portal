// Mock mentorService — typed exactly as a real API-backed version would be.
// Swapping this file for one that calls a backend is the only change the
// rest of the Mentor 360 page would ever need.

import { MENTORS, mentorBundle } from "./mockData";
import { isGoodTrend, trendDirection } from "../opsIntel/config";
import type {
  AttendanceDay,
  FeedbackComment,
  KPI,
  Mentor,
  MentorBatchRow,
  MentorSessionRow,
  NPSData,
  OperationsMetrics,
  Period,
  QualityAudit,
  QualityScore,
  ReportItem,
  SessionTrendPoint,
} from "./types";
import type { SortDirection } from "../opsIntel/types";

function delay<T>(value: T): Promise<T> {
  const ms = 220 + Math.random() * 320;
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function daysAgo(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

function periodDays(period: Period): number {
  return { "7d": 7, "30d": 30, "90d": 90, "6m": 182, "1y": 365 }[period];
}

function avg(nums: (number | null)[]): number | null {
  const vals = nums.filter((n): n is number => n !== null && !Number.isNaN(n));
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}
function round(n: number | null, dp = 0): number {
  if (n === null || n === undefined) return 0;
  const f = Math.pow(10, dp);
  return Math.round(n * f) / f;
}
// Absolute delta — for metrics that are ALREADY a percentage or a small
// score (attendance %, rating), so the badge reads as "+5 pts"/"+0.3".
function buildTrend(metricKey: string, current: number, previous: number, dp = 0) {
  const value = round(current - previous, dp);
  const direction = trendDirection(current, previous);
  return { value, direction, isGood: isGoodTrend(metricKey, direction) };
}

// Relative % change — for count-based metrics (sessions, learners, minutes)
// where showing the raw difference with a "%" suffix would be misleading.
function buildPctTrend(metricKey: string, current: number, previous: number) {
  const value = previous ? round(((current - previous) / previous) * 100) : 0;
  const direction = trendDirection(current, previous);
  return { value, direction, isGood: isGoodTrend(metricKey, direction) };
}

export async function getMentors(): Promise<Mentor[]> {
  return delay(MENTORS);
}

export async function getMentorProfile(id: string): Promise<Mentor | null> {
  return delay(MENTORS.find((m) => m.id === id) ?? null);
}

export async function getMentorKPIs(id: string, period: Period): Promise<KPI[]> {
  const { sessions } = mentorBundle(id);
  const days = periodDays(period);
  const current = sessions.filter((s) => daysAgo(s.date) < days);
  const previous = sessions.filter((s) => daysAgo(s.date) >= days && daysAgo(s.date) < days * 2);
  const completed = (list: MentorSessionRow[]) => list.filter((s) => s.status === "Completed");

  const c = completed(current);
  const p = completed(previous);

  const totalLearners = c.reduce((s, r) => s + r.attendees, 0);
  const prevLearners = p.reduce((s, r) => s + r.attendees, 0) || 1;

  const avgAttendance = round(avg(c.map((s) => (s.attendees ? (s.attendees / 90) * 100 : null))) ?? 0);
  const prevAvgAttendance = round(avg(p.map((s) => (s.attendees ? (s.attendees / 90) * 100 : null))) ?? 0);

  const rated = c.filter((s) => s.rating !== null);
  const avgRating = round(avg(rated.map((s) => s.rating)) ?? 0, 1);
  const prevRated = p.filter((s) => s.rating !== null);
  const prevAvgRating = round(avg(prevRated.map((s) => s.rating)) ?? 0, 1);

  const avgDuration = round(avg(c.map((s) => s.durationMinutes)) ?? 0);
  const prevAvgDuration = round(avg(p.map((s) => s.durationMinutes)) ?? 0);

  return delay([
    { id: "totalSessions", label: "Total Sessions", value: sessions.length.toLocaleString(), trend: buildPctTrend("totalSessions", current.length, previous.length || 1), caption: "All time" },
    { id: "totalLearners", label: "Total Learners", value: totalLearners.toLocaleString(), trend: buildPctTrend("totalLearners", totalLearners, prevLearners), caption: "Across all sessions" },
    { id: "avgAttendance", label: "Avg Attendance", value: `${avgAttendance}%`, trend: buildTrend("attendance", avgAttendance, prevAvgAttendance), caption: "Across all sessions" },
    { id: "avgRating", label: "Avg Rating", value: `${avgRating} / 5`, trend: buildTrend("rating", avgRating, prevAvgRating, 1), caption: "Based on learner feedback" },
    { id: "avgDuration", label: "Avg Duration", value: `${avgDuration} min`, trend: buildPctTrend("avgDuration", avgDuration, prevAvgDuration), caption: "Per session" },
  ]);
}

export async function getSessionTrend(id: string, period: Period): Promise<SessionTrendPoint[]> {
  const { sessions } = mentorBundle(id);
  const days = periodDays(period);
  const bucketDays = days > 90 ? 7 : 1;
  const bucketCount = Math.ceil(days / bucketDays);

  const buckets: { end: Date; rows: MentorSessionRow[] }[] = [];
  for (let i = bucketCount - 1; i >= 0; i--) {
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() - i * bucketDays);
    buckets.push({ end, rows: [] });
  }
  sessions.forEach((s) => {
    const age = daysAgo(s.date);
    if (age >= days) return;
    const idx = bucketCount - 1 - Math.floor(age / bucketDays);
    if (buckets[idx]) buckets[idx].rows.push(s);
  });

  return delay(
    buckets.map((b) => {
      const completed = b.rows.filter((r) => r.status === "Completed");
      return {
        label: b.end.toLocaleDateString(undefined, { day: "2-digit", month: "short" }),
        sessions: b.rows.length,
        attendancePct: completed.length ? round(avg(completed.map((r) => (r.attendees / 90) * 100))) : null,
        rating: completed.some((r) => r.rating !== null) ? round(avg(completed.filter((r) => r.rating !== null).map((r) => r.rating)), 1) : null,
      };
    })
  );
}

export async function getNPS(id: string): Promise<NPSData> {
  const { feedback } = mentorBundle(id);
  const scores = feedback.map((f) => Math.round((f.rating / 5) * 10)); // map 0-5 rating to a 0-10 NPS-style score
  const promoters = scores.filter((s) => s >= 9).length;
  const passives = scores.filter((s) => s >= 7 && s < 9).length;
  const detractors = scores.filter((s) => s < 7).length;
  const total = scores.length || 1;
  const score = Math.round(((promoters - detractors) / total) * 100);

  const trend = Array.from({ length: 6 }, (_, i) => ({
    label: `M${i + 1}`,
    score: Math.round(score + (i - 3) * 4 + (Math.sin(i) * 5)),
  }));

  return delay({ score, promoters, passives, detractors, total: scores.length, trend });
}

export async function getQuality(id: string): Promise<QualityScore> {
  const { qualityAudits } = mentorBundle(id);
  const overall = round(avg(qualityAudits.map((a) => a.score)) ?? 0, 1);
  return delay({
    overall,
    content: round(clamp(overall + 0.1), 1),
    delivery: round(clamp(overall - 0.05), 1),
    engagement: round(clamp(overall + 0.05), 1),
    punctuality: round(clamp(overall - 0.15), 1),
  });
}
function clamp(v: number) {
  return Math.max(0, Math.min(5, v));
}

export async function getQualityAudits(id: string): Promise<QualityAudit[]> {
  return delay(mentorBundle(id).qualityAudits);
}

export interface SessionsParams {
  id: string;
  page: number;
  pageSize: number;
  search: string;
  sortBy: keyof MentorSessionRow;
  sortDir: SortDirection;
  status?: MentorSessionRow["status"] | "";
}

export async function getSessions(params: SessionsParams) {
  const { id, page, pageSize, search, sortBy, sortDir, status } = params;
  let rows = mentorBundle(id).sessions;

  if (status) rows = rows.filter((r) => r.status === status);
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    rows = rows.filter((r) => r.title.toLowerCase().includes(q) || r.batch.toLowerCase().includes(q));
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
  return delay({ rows: rows.slice(start, start + pageSize), total, page, pageSize });
}

export async function getBatches(id: string): Promise<MentorBatchRow[]> {
  return delay(mentorBundle(id).batches);
}

export async function getAttendanceCalendar(id: string): Promise<AttendanceDay[]> {
  return delay(mentorBundle(id).attendanceCalendar);
}

export async function getOperations(id: string): Promise<OperationsMetrics> {
  const { sessions, escalations } = mentorBundle(id);
  const days = 30;
  const current = sessions.filter((s) => daysAgo(s.date) < days);
  const previous = sessions.filter((s) => daysAgo(s.date) >= days && daysAgo(s.date) < days * 2);

  const cancelledCur = current.filter((s) => s.status === "Cancelled").length;
  const cancelledPrev = previous.filter((s) => s.status === "Cancelled").length;
  const completedCur = current.filter((s) => s.status === "Completed").length || 1;

  return delay({
    punctualityPct: 96,
    punctualityTrend: buildTrend("sessionStartCompliance", 96, 94),
    reschedules: Math.round(current.length * 0.06),
    reschedulesTrend: buildTrend("rescheduled", Math.round(current.length * 0.06), Math.round(previous.length * 0.05) || 1),
    cancellations: cancelledCur,
    cancellationsTrend: buildTrend("totalCancelled", cancelledCur, cancelledPrev || 1),
    slaAdherencePct: Math.round(((completedCur - cancelledCur) / completedCur) * 100),
    slaAdherenceTrend: buildTrend("slaAdherence", 97, 95),
    escalations,
  });
}

export async function getReports(id: string): Promise<ReportItem[]> {
  return delay(mentorBundle(id).reports);
}

export async function getFeedback(id: string): Promise<FeedbackComment[]> {
  return delay(mentorBundle(id).feedback);
}
