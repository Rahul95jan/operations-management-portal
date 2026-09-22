export type SessionStatus = "Completed" | "Scheduled" | "Cancelled" | "Rescheduled";
export type RecordingStatus = "Available" | "Pending" | "Missing";
export type ReportStatus = "Ready" | "Pending" | "Missing";
export type SLAStatus = "On Time" | "Late";
export type RiskLevel = "Healthy" | "Watch" | "Critical";
export type SessionIssue = "Low Attendance" | "Missing Recording" | "Report Pending" | "Late Start" | "Low Rating" | null;

export interface Mentor {
  id: string;
  name: string;
  initials: string;
  expertise: string;
}

export interface Course {
  id: string;
  name: string;
}

export interface Batch {
  id: string;
  name: string;
  courseId: string;
}

export interface SessionRecord {
  id: string;
  dateTime: string; // ISO
  topic: string;
  mentorId: string;
  mentorName: string;
  batchId: string;
  batchName: string;
  courseId: string;
  courseName: string;
  sessionType: string;
  learners: number;
  attended: number;
  attendancePct: number | null;
  rating: number | null;
  durationMinutes: number;
  recording: RecordingStatus;
  report: ReportStatus;
  sla: SLAStatus;
  status: SessionStatus;
  risk: RiskLevel;
  issue: SessionIssue;
}

export type DateRangeKey = "7d" | "30d" | "90d" | "thisMonth" | "custom";

export interface Filters {
  dateRange: DateRangeKey;
  customFrom?: string;
  customTo?: string;
  courseId: string; // "" = all
  batchId: string; // "" = all
  mentorId: string; // "" = all
  sessionType: string; // "" = all
}

export interface TrendInfo {
  value: number; // signed delta, in the unit the caller expects (pts or %)
  direction: "up" | "down" | "flat";
  isGood: boolean;
}

export interface KPI {
  id: string;
  label: string;
  value: string;
  trend: TrendInfo;
  caption: string;
  captionTone?: "good" | "neutral";
}

export interface SessionHealth {
  total: number;
  healthy: { count: number; pct: number };
  atRisk: { count: number; pct: number };
  critical: { count: number; pct: number };
}

export interface TrendPoint {
  label: string;
  sessions: number;
  attendancePct: number | null;
  rating: number | null;
}

export interface QualityRow {
  label: string;
  score: number;
  max: number;
  trend: TrendInfo;
}

export interface AttendanceIntel {
  registered: number;
  attended: number;
  averagePct: number;
  averageTrend: TrendInfo;
  absenteeRate: number;
  absenteeTrend: TrendInfo;
  distribution: { tier: "high" | "medium" | "low"; label: string; batches: number; pct: number }[];
}

export interface AttendanceTrendPoint {
  label: string;
  attendancePct: number;
  absenteePct: number;
}

export interface BatchMatrixRow {
  batchId: string;
  batch: string;
  sessions: number;
  learners: number;
  attendancePct: number;
  rating: number;
  recordingPct: number;
  reportPct: number;
  slaPct: number;
  risk: RiskLevel;
  trend: "up" | "down";
}

export interface MentorMatrixRow {
  mentorId: string;
  name: string;
  initials: string;
  sessions: number;
  learners: number;
  attendancePct: number;
  rating: number;
  recordingPct: number;
  reportPct: number;
  status: RiskLevel;
}

export interface RiskPoint {
  sessionId: string;
  sessionName: string;
  mentor: string;
  batch: string;
  attendancePct: number;
  rating: number;
  learners: number;
  compliance: RiskLevel;
}

export interface ComplianceRow {
  key: string;
  label: string;
  current: number;
  previous: number;
  trend: TrendInfo;
}

export interface HealthDonut {
  total: number;
  segments: { label: string; count: number; pct: number; color: string }[];
}

export interface CancellationStats {
  totalCancelled: number;
  totalCancelledTrend: TrendInfo;
  cancellationRate: number;
  cancellationRateTrend: TrendInfo;
  rescheduled: number;
  rescheduledTrend: TrendInfo;
  learnersImpacted: number;
  learnersImpactedTrend: TrendInfo;
  series: { label: string; count: number }[];
}

export interface AttentionSessionRow {
  sessionId: string;
  session: string;
  dateTime: string;
  batch: string;
  attendancePct: number | null;
  rating: number | null;
  issue: SessionIssue;
  status: "Critical" | "Watch";
}

export interface AttentionBatchRow {
  batch: string;
  attendancePct: number;
  rating: number;
  compliancePct: number;
  sessions: number;
  risk: RiskLevel;
}

export interface Signal {
  id: string;
  metric: string;
  current: string;
  previous: string;
  change: TrendInfo;
  affectedArea: string;
  sampleSize: number;
}

export interface ActionItemData {
  id: string;
  issue: string;
  description: string;
  affectedBatch: string;
  priority: "High" | "Medium" | "Low";
  metric: string;
}

export interface PagedSessions {
  rows: SessionRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export type SortDirection = "asc" | "desc";
