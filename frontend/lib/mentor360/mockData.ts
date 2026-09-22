import {
  AttendanceDay,
  Escalation,
  FeedbackComment,
  Mentor,
  MentorBatchRow,
  MentorSessionRow,
  QualityAudit,
  ReportItem,
} from "./types";

// Deterministic PRNG so the mock dataset is stable across reloads (mirrors
// the approach in lib/opsIntel/mockData.ts, kept independent per module).
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
const rand = mulberry32(19092026);
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
const between = (min: number, max: number) => min + rand() * (max - min);
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export const MENTORS: Mentor[] = [
  { id: "m1", name: "Krish Naik", email: "krishnaik@example.com", initials: "KN", photoUrl: null, status: "Active", primaryDomain: "Data Science", expertise: ["Data Science", "GenAI", "Machine Learning"], joinedDate: "2023-01-15" },
  { id: "m2", name: "Sunny Savita", email: "sunny.savita@example.com", initials: "SS", photoUrl: null, status: "Active", primaryDomain: "Machine Learning", expertise: ["Machine Learning", "Deep Learning"], joinedDate: "2022-08-02" },
  { id: "m3", name: "Aman Kharwal", email: "aman.kharwal@example.com", initials: "AK", photoUrl: null, status: "On Leave", primaryDomain: "Data Science", expertise: ["Data Science", "Python"], joinedDate: "2023-05-20" },
  { id: "m4", name: "Nachiketa Hebbar", email: "nachiketa.hebbar@example.com", initials: "NH", photoUrl: null, status: "Active", primaryDomain: "GenAI", expertise: ["GenAI", "Cloud & DevOps"], joinedDate: "2021-11-10" },
  { id: "m5", name: "Priya Sharma", email: "priya.sharma@example.com", initials: "PS", photoUrl: null, status: "Active", primaryDomain: "Full Stack Development", expertise: ["Full Stack Development", "React"], joinedDate: "2024-02-01" },
  { id: "m6", name: "Rohit Verma", email: "rohit.verma@example.com", initials: "RV", photoUrl: null, status: "Inactive", primaryDomain: "Cloud & DevOps", expertise: ["Cloud & DevOps", "Kubernetes"], joinedDate: "2022-03-18" },
];

const BATCH_NAMES = ["Batch 12", "Batch 13", "Batch 14", "Batch 15"];
const COURSES = ["Data Science", "GenAI", "Machine Learning", "Full Stack Development", "Cloud & DevOps"];
const SESSION_TITLES = [
  "Introduction & Setup", "Core Concepts Deep Dive", "Hands-on Lab", "Case Study Walkthrough",
  "Project Review", "Doubt Clearing Session", "Advanced Techniques", "Capstone Discussion",
  "Model Evaluation", "Deployment Walkthrough",
];
const LEARNER_NAMES = ["Ananya", "Rahul", "Vikram", "Sneha", "Arjun", "Meera", "Karan", "Divya", "Rohan", "Isha"];
const FEEDBACK_SNIPPETS = [
  "Explained the concepts very clearly, loved the pace.",
  "Would appreciate more hands-on exercises next time.",
  "Doubt resolution was excellent, very patient.",
  "Session felt a bit rushed toward the end.",
  "Best session so far, the case study was super helpful.",
  "Could improve on sharing resources ahead of the session.",
];

function generateSessionsForMentor(mentorId: string, count = 46): MentorSessionRow[] {
  const rows: MentorSessionRow[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(between(0, 180));
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    date.setHours(10 + Math.floor(rand() * 8), rand() > 0.5 ? 30 : 0, 0, 0);

    const status = daysAgo < 4 && rand() > 0.6 ? "Scheduled" : rand() > 0.94 ? "Cancelled" : "Completed";
    const attendees = Math.round(between(35, 90));
    const rating = status === "Completed" && rand() > 0.25 ? Math.round(clamp(5 - Math.pow(rand(), 1.8) * 2.4, 2.5, 5) * 10) / 10 : null;

    rows.push({
      id: `${mentorId}-s${i + 1}`,
      date: date.toISOString(),
      title: pick(SESSION_TITLES),
      batch: pick(BATCH_NAMES),
      durationMinutes: Math.round(between(60, 150) / 5) * 5,
      attendees: status === "Completed" ? attendees : 0,
      rating,
      status,
    });
  }
  return rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function generateBatchesForMentor(mentorId: string): MentorBatchRow[] {
  return BATCH_NAMES.map((name, i) => {
    const start = new Date();
    start.setMonth(start.getMonth() - (4 - i));
    const end = new Date(start);
    end.setMonth(end.getMonth() + 6);
    return {
      id: `${mentorId}-${name.replace(" ", "").toLowerCase()}`,
      name: `${pick(COURSES)} ${name}`,
      course: pick(COURSES),
      learners: Math.round(between(40, 90)),
      progressPct: Math.round(between(20, 100)),
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  });
}

function generateAttendanceCalendar(mentorId: string, days = 90): AttendanceDay[] {
  const out: AttendanceDay[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const hasSession = rand() > 0.55;
    out.push({
      date: d.toISOString().slice(0, 10),
      attendancePct: hasSession ? Math.round(clamp(95 - Math.pow(rand(), 1.5) * 40, 45, 99)) : null,
    });
  }
  return out;
}

function generateQualityAudits(mentorId: string): QualityAudit[] {
  const reviewers = ["Ops Lead — Meera Iyer", "Academic Head — Sanjay Rao", "QA Reviewer — Fatima Khan"];
  const improvementPool = ["Pace of delivery", "Use of visual aids", "Doubt resolution follow-up", "Session punctuality", "Resource sharing before class"];
  return Array.from({ length: 4 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i * 1.5);
    const areas = [pick(improvementPool), pick(improvementPool)].filter((v, idx, arr) => arr.indexOf(v) === idx);
    return {
      id: `${mentorId}-audit${i + 1}`,
      date: date.toISOString(),
      reviewer: pick(reviewers),
      score: Math.round(clamp(4.6 - i * 0.08 + between(-0.1, 0.1), 3.5, 5) * 10) / 10,
      notes: "Overall strong delivery with consistent learner engagement across sessions reviewed this cycle.",
      improvementAreas: areas,
    };
  });
}

function generateEscalations(mentorId: string): Escalation[] {
  return [
    { id: `${mentorId}-esc1`, date: new Date(Date.now() - 12 * 86400000).toISOString(), description: "Learner complaint about a rescheduled session with short notice.", status: "Resolved" },
    { id: `${mentorId}-esc2`, date: new Date(Date.now() - 3 * 86400000).toISOString(), description: "Batch coordinator flagged a recording upload delay.", status: "Open" },
  ];
}

function generateReports(mentorId: string): ReportItem[] {
  return [
    { id: `${mentorId}-r1`, name: "Monthly Performance Summary", type: "PDF", generatedDate: new Date(Date.now() - 2 * 86400000).toISOString(), status: "Ready" },
    { id: `${mentorId}-r2`, name: "Session Attendance Export", type: "Excel", generatedDate: new Date(Date.now() - 9 * 86400000).toISOString(), status: "Ready" },
    { id: `${mentorId}-r3`, name: "Learner Feedback Digest", type: "CSV", generatedDate: null, status: "Generating" },
    { id: `${mentorId}-r4`, name: "Quarterly Compliance Report", type: "PDF", generatedDate: null, status: "Scheduled" },
  ];
}

function generateFeedback(mentorId: string): FeedbackComment[] {
  return Array.from({ length: 10 }, (_, i) => {
    const date = new Date(Date.now() - Math.floor(between(1, 60)) * 86400000);
    return {
      id: `${mentorId}-fb${i + 1}`,
      learnerName: pick(LEARNER_NAMES),
      rating: Math.round(clamp(5 - Math.pow(rand(), 1.8) * 2.2, 2.5, 5) * 10) / 10,
      comment: pick(FEEDBACK_SNIPPETS),
      date: date.toISOString(),
      batch: pick(BATCH_NAMES),
    };
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

interface MentorMockBundle {
  sessions: MentorSessionRow[];
  batches: MentorBatchRow[];
  attendanceCalendar: AttendanceDay[];
  qualityAudits: QualityAudit[];
  escalations: Escalation[];
  reports: ReportItem[];
  feedback: FeedbackComment[];
}

const BUNDLES = new Map<string, MentorMockBundle>();
export function mentorBundle(mentorId: string): MentorMockBundle {
  if (!BUNDLES.has(mentorId)) {
    BUNDLES.set(mentorId, {
      sessions: generateSessionsForMentor(mentorId),
      batches: generateBatchesForMentor(mentorId),
      attendanceCalendar: generateAttendanceCalendar(mentorId),
      qualityAudits: generateQualityAudits(mentorId),
      escalations: generateEscalations(mentorId),
      reports: generateReports(mentorId),
      feedback: generateFeedback(mentorId),
    });
  }
  return BUNDLES.get(mentorId)!;
}
