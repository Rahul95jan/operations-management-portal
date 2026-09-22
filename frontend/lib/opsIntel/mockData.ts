import { Batch, Course, Mentor, SessionRecord, SessionIssue, RiskLevel } from "./types";
import { RISK_RULES } from "./config";

// Deterministic PRNG (mulberry32) so the mock dataset is stable across
// reloads/SSR+CSR instead of re-randomizing on every render.
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260919);
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
const between = (min: number, max: number) => min + rand() * (max - min);
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export const COURSES: Course[] = [
  { id: "c1", name: "Data Science" },
  { id: "c2", name: "GenAI" },
  { id: "c3", name: "Machine Learning" },
  { id: "c4", name: "Full Stack Development" },
  { id: "c5", name: "Cloud & DevOps" },
];

export const MENTORS: Mentor[] = [
  { id: "m1", name: "Krish Naik", initials: "KN", expertise: "Data Science, GenAI" },
  { id: "m2", name: "Sunny Savita", initials: "SS", expertise: "Machine Learning" },
  { id: "m3", name: "Aman Kharwal", initials: "AK", expertise: "Data Science" },
  { id: "m4", name: "Nachiketa Hebbar", initials: "NH", expertise: "GenAI, Cloud & DevOps" },
  { id: "m5", name: "Priya Sharma", initials: "PS", expertise: "Full Stack Development" },
  { id: "m6", name: "Rohit Verma", initials: "RV", expertise: "Cloud & DevOps" },
];

export const BATCHES: Batch[] = [
  { id: "b1", name: "DS Batch 12", courseId: "c1" },
  { id: "b2", name: "DS Batch 13", courseId: "c1" },
  { id: "b3", name: "GenAI Batch 4", courseId: "c2" },
  { id: "b4", name: "GenAI Batch 5", courseId: "c2" },
  { id: "b5", name: "ML Batch 8", courseId: "c3" },
  { id: "b6", name: "ML Batch 9", courseId: "c3" },
  { id: "b7", name: "Full Stack Batch 6", courseId: "c4" },
  { id: "b8", name: "Full Stack Batch 7", courseId: "c4" },
  { id: "b9", name: "DevOps Batch 3", courseId: "c5" },
  { id: "b10", name: "DevOps Batch 4", courseId: "c5" },
];

const SESSION_TYPES = ["Live Class", "Doubt Clearing", "Project Review", "Guest Lecture"];
const TOPICS = [
  "Introduction & Setup", "Core Concepts Deep Dive", "Hands-on Lab", "Case Study Walkthrough",
  "Project Review", "Doubt Clearing Session", "Advanced Techniques", "Capstone Discussion",
  "Model Evaluation", "Deployment Walkthrough", "API Design", "System Design Basics",
];

export function batchesForCourse(courseId: string) {
  if (!courseId) return BATCHES;
  return BATCHES.filter((b) => b.courseId === courseId);
}

function classifyRisk(attendancePct: number | null, rating: number | null): RiskLevel {
  if (attendancePct === null || rating === null) return "Watch";
  if (attendancePct < RISK_RULES.criticalAttendancePct || rating < RISK_RULES.criticalRatingScore) return "Critical";
  if (attendancePct < RISK_RULES.lowAttendancePct || rating < RISK_RULES.lowRatingScore) return "Watch";
  return "Healthy";
}

function deriveIssue(
  status: SessionRecord["status"],
  attendancePct: number | null,
  rating: number | null,
  recording: SessionRecord["recording"],
  report: SessionRecord["report"],
  sla: SessionRecord["sla"]
): SessionIssue {
  if (status !== "Completed") return null;
  if (attendancePct !== null && attendancePct < RISK_RULES.lowAttendancePct) return "Low Attendance";
  if (rating !== null && rating < RISK_RULES.lowRatingScore) return "Low Rating";
  if (recording === "Missing") return "Missing Recording";
  if (report === "Pending" || report === "Missing") return "Report Pending";
  if (sla === "Late") return "Late Start";
  return null;
}

function generateSessions(count: number): SessionRecord[] {
  const sessions: SessionRecord[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(between(0, 180));
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    date.setHours(10 + Math.floor(rand() * 8), rand() > 0.5 ? 30 : 0, 0, 0);

    const course = pick(COURSES);
    const batchOptions = batchesForCourse(course.id);
    const batch = pick(batchOptions.length ? batchOptions : BATCHES);
    const mentor = pick(MENTORS);

    // Status distribution: mostly completed (past), a handful cancelled /
    // rescheduled, and a slice of genuinely upcoming sessions among the most
    // recent ones so "Scheduled" isn't scattered across history.
    let status: SessionRecord["status"];
    const statusRoll = rand();
    if (daysAgo < 5 && statusRoll > 0.55) {
      status = "Scheduled";
    } else if (statusRoll > 0.955) {
      status = "Rescheduled";
    } else if (statusRoll > 0.915) {
      status = "Cancelled";
    } else {
      status = "Completed";
    }

    const learners = Math.round(between(45, 95));
    let attended: number | null = null;
    let attendancePct: number | null = null;
    let rating: number | null = null;
    let recording: SessionRecord["recording"] = "Missing";
    let report: SessionRecord["report"] = "Missing";
    let sla: SessionRecord["sla"] = "On Time";

    if (status === "Completed") {
      // Attendance skewed high with a long-ish tail toward lower values.
      const attendanceRoll = Math.pow(rand(), 1.6);
      attendancePct = Math.round(clamp(96 - attendanceRoll * 45, 40, 99));
      attended = Math.round((attendancePct / 100) * learners);

      const hasFeedback = rand() > 0.28;
      if (hasFeedback) {
        const ratingRoll = Math.pow(rand(), 1.8);
        rating = Math.round(clamp(5 - ratingRoll * 2.6, 2.2, 5) * 10) / 10;
      }

      const recRoll = rand();
      recording = recRoll > 0.14 ? "Available" : recRoll > 0.06 ? "Pending" : "Missing";

      const repRoll = rand();
      report = repRoll > 0.18 ? "Ready" : repRoll > 0.06 ? "Pending" : "Missing";

      sla = rand() > 0.1 ? "On Time" : "Late";
    }

    const risk = status === "Completed" ? classifyRisk(attendancePct, rating) : status === "Cancelled" ? "Critical" : "Healthy";
    const issue = deriveIssue(status, attendancePct, rating, recording, report, sla);

    sessions.push({
      id: `s${i + 1}`,
      dateTime: date.toISOString(),
      topic: pick(TOPICS),
      mentorId: mentor.id,
      mentorName: mentor.name,
      batchId: batch.id,
      batchName: batch.name,
      courseId: course.id,
      courseName: course.name,
      sessionType: pick(SESSION_TYPES),
      learners,
      attended: attended ?? 0,
      attendancePct,
      rating,
      durationMinutes: Math.round(between(60, 150) / 5) * 5,
      recording,
      report,
      sla,
      status,
      risk,
      issue,
    });
  }

  return sessions.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
}

export const ALL_SESSIONS: SessionRecord[] = generateSessions(428);
