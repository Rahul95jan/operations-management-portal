// Single source of truth for every threshold/color/direction rule used across
// the Session Operations Intelligence prototype. Change a number here and
// every card, table and chart picks it up.

export const PERCENT_THRESHOLDS = {
  good: 90, // >= good -> green
  watch: 75, // >= watch and < good -> amber; below watch -> red
};

export const RATING_THRESHOLDS = {
  good: 4.5,
  watch: 3.5,
};

export type Tier = "good" | "watch" | "critical";

export function percentTier(value: number | null | undefined): Tier {
  if (value === null || value === undefined) return "critical";
  if (value >= PERCENT_THRESHOLDS.good) return "good";
  if (value >= PERCENT_THRESHOLDS.watch) return "watch";
  return "critical";
}

export function ratingTier(value: number | null | undefined): Tier {
  if (value === null || value === undefined) return "critical";
  if (value >= RATING_THRESHOLDS.good) return "good";
  if (value >= RATING_THRESHOLDS.watch) return "watch";
  return "critical";
}

export const TIER_COLORS: Record<Tier, { text: string; bg: string; dot: string }> = {
  good: { text: "#16A34A", bg: "#DCFCE7", dot: "#16A34A" },
  watch: { text: "#F59E0B", bg: "#FEF3C7", dot: "#F59E0B" },
  critical: { text: "#DC2626", bg: "#FEE2E2", dot: "#DC2626" },
};

// Risk-matrix quadrant dividers (also drawn as dashed lines on the chart).
export const RISK_MATRIX_DIVIDERS = {
  attendancePct: 75,
  rating: 3.5,
};

// Whether a HIGHER value is a GOOD thing for each metric. TrendBadge uses
// this (not the raw direction) to decide red vs. green.
export const HIGHER_IS_BETTER: Record<string, boolean> = {
  totalSessions: true,
  completedSessions: true,
  completionRate: true,
  totalLearners: true,
  attendance: true,
  rating: true,
  operationalCompliance: true,
  recordingCompliance: true,
  reportCompletion: true,
  sessionStartCompliance: true,
  resourceUpload: true,
  slaAdherence: true,
  absenteeRate: false,
  totalCancelled: false,
  cancellationRate: false,
  rescheduled: false,
  learnersImpacted: false,
};

export function trendDirection(current: number, previous: number): "up" | "down" | "flat" {
  if (current > previous) return "up";
  if (current < previous) return "down";
  return "flat";
}

export function isGoodTrend(metricKey: string, direction: "up" | "down" | "flat"): boolean {
  if (direction === "flat") return true;
  const higherIsBetter = HIGHER_IS_BETTER[metricKey] ?? true;
  return (direction === "up") === higherIsBetter;
}

// Rule-based thresholds that drive both per-session risk classification and
// the Session Operations Action Center recommendations. Tune here only.
export const RISK_RULES = {
  lowAttendancePct: 75,
  lowRatingScore: 3.5,
  criticalAttendancePct: 60,
  criticalRatingScore: 3.0,
};

export const SIGNAL_RULES = {
  // A period-over-period change at or beyond these magnitudes is surfaced as
  // an Operational Signal / Action Center item worth investigating.
  attendanceDropPts: 5,
  ratingDropPts: 0.3,
  complianceDropPts: 5,
  cancellationRisePts: 1,
};
