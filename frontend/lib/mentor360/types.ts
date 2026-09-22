import type { KPI, TrendInfo } from "../opsIntel/types";

export type MentorStatus = "Active" | "Inactive" | "On Leave";

export interface Mentor {
  id: string;
  name: string;
  email: string;
  initials: string;
  photoUrl: string | null;
  status: MentorStatus;
  primaryDomain: string;
  expertise: string[];
  joinedDate: string; // ISO
}

export type Period = "7d" | "30d" | "90d" | "6m" | "1y";

export interface SessionTrendPoint {
  label: string;
  sessions: number;
  attendancePct: number | null;
  rating: number | null;
}

export interface NPSData {
  score: number; // -100..100
  promoters: number;
  passives: number;
  detractors: number;
  total: number;
  trend: { label: string; score: number }[];
}

export interface QualityScore {
  overall: number;
  content: number;
  delivery: number;
  engagement: number;
  punctuality: number;
}

export type SessionRowStatus = "Completed" | "Scheduled" | "Cancelled";

export interface MentorSessionRow {
  id: string;
  date: string; // ISO
  title: string;
  batch: string;
  durationMinutes: number;
  attendees: number;
  rating: number | null;
  status: SessionRowStatus;
}

export interface MentorBatchRow {
  id: string;
  name: string;
  course: string;
  learners: number;
  progressPct: number;
  startDate: string;
  endDate: string;
}

export interface AttendanceDay {
  date: string; // ISO date (no time)
  attendancePct: number | null; // null = no session that day
}

export interface QualityAudit {
  id: string;
  date: string;
  reviewer: string;
  score: number;
  notes: string;
  improvementAreas: string[];
}

export interface Escalation {
  id: string;
  date: string;
  description: string;
  status: "Open" | "Resolved";
}

export interface OperationsMetrics {
  punctualityPct: number;
  punctualityTrend: TrendInfo;
  reschedules: number;
  reschedulesTrend: TrendInfo;
  cancellations: number;
  cancellationsTrend: TrendInfo;
  slaAdherencePct: number;
  slaAdherenceTrend: TrendInfo;
  escalations: Escalation[];
}

export interface ReportItem {
  id: string;
  name: string;
  type: "PDF" | "Excel" | "CSV";
  generatedDate: string | null;
  status: "Ready" | "Generating" | "Scheduled";
}

export interface FeedbackComment {
  id: string;
  learnerName: string;
  rating: number;
  comment: string;
  date: string;
  batch: string;
}

export type { KPI };
