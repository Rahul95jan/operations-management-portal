import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Sidebar from "../components/Sidebar";
import ProtectedRoute from "../components/ProtectedRoute";
import {
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  BubbleController,
  Chart as ChartJS,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Chart, Doughnut, Bubble } from "react-chartjs-2";
import {
  Video,
  Users,
  CalendarClock,
  CheckCircle2,
  Percent,
  Star,
  Search,
  MoreVertical,
  Download,
  FileText,
  ExternalLink,
  AlertTriangle,
  Sparkles,
  ChevronDown,
  SlidersHorizontal,
  Check,
  RotateCcw,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  ClipboardList,
  UserCog,
  Layers,
  Activity,
  CircleSlash,
} from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, BubbleController, Tooltip, Legend, Filler);

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const STATUS_STYLES = {
  Upcoming: { bg: "#e0e7ff", color: "#4338ca", dot: "#6366f1" },
  Scheduled: { bg: "#dbeafe", color: "#1d4ed8", dot: "#3b82f6" },
  Live: { bg: "#fee2e2", color: "#b91c1c", dot: "#ef4444" },
  Completed: { bg: "#dcfce7", color: "#15803d", dot: "#22c55e" },
  Cancelled: { bg: "#f1f5f9", color: "#475569", dot: "#94a3b8" },
  Rescheduled: { bg: "#fef3c7", color: "#b45309", dot: "#f59e0b" },
  "No Show": { bg: "#fee2e2", color: "#991b1b", dot: "#dc2626" },
};

const RECORDING_STYLES = {
  Available: { bg: "#dcfce7", color: "#15803d", dot: "#22c55e" },
  "Not Available": { bg: "#f1f5f9", color: "#64748b", dot: "#94a3b8" },
};

const REPORT_STYLES = {
  Pending: { bg: "#fef3c7", color: "#b45309", dot: "#f59e0b" },
  Submitted: { bg: "#dbeafe", color: "#1d4ed8", dot: "#3b82f6" },
  Reviewed: { bg: "#dcfce7", color: "#15803d", dot: "#22c55e" },
};

const RISK_STYLES = {
  Critical: { bg: "#fee2e2", color: "#b91c1c", dot: "#ef4444" },
  Watch: { bg: "#fef3c7", color: "#b45309", dot: "#f59e0b" },
  Good: { bg: "#dcfce7", color: "#15803d", dot: "#22c55e" },
};

// Frontend-only thresholds for the Session Health / risk rollups — no backend
// business logic changes; tune these if operations wants different cutoffs.
const HEALTH_THRESHOLDS = {
  lowAttendancePct: 60,
  lowRating: 3,
  highCancellationPct: 10,
  lowCompliancePct: 80,
};

function classifySessionHealth(r) {
  if (r.status === "Cancelled") return { tier: "attention", reason: "Cancelled Session" };
  if (r.status === "Completed") {
    if (r.attendance_percentage && r.attendance_percentage < HEALTH_THRESHOLDS.lowAttendancePct) {
      return { tier: "attention", reason: `Low Attendance (${r.attendance_percentage}%)` };
    }
    if (r.rating && r.rating < HEALTH_THRESHOLDS.lowRating) {
      return { tier: "attention", reason: `Low Rating (${r.rating} / 5)` };
    }
    if (r.report_status === "Pending") return { tier: "needsReview", reason: "Report Pending" };
    if (r.recording_status === "Not Available") return { tier: "needsReview", reason: "Recording Missing" };
  }
  return { tier: "healthy", reason: null };
}

function daysBetween(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

function inWindow(dateStr, maxAgeExclusive, minAgeInclusive = 0) {
  const age = daysBetween(dateStr);
  if (age === null) return false;
  return age >= minAgeInclusive && age < maxAgeExclusive;
}

function buildOpsMatrix(allRows, keyField) {
  const groups = {};
  allRows.forEach((r) => {
    const key = r[keyField];
    if (!key) return;
    if (!groups[key]) {
      groups[key] = {
        key, sessions: 0, completed: 0, cancelled: 0, learners: 0,
        attendanceSum: 0, attendanceN: 0, ratingSum: 0, ratingN: 0,
        recordingAvailable: 0, recordingEligible: 0, reportDone: 0, reportEligible: 0,
        completedRows: [],
      };
    }
    const g = groups[key];
    g.sessions += 1;
    if (r.status === "Completed") {
      g.completed += 1;
      g.learners += r.learner_count || 0;
      if (r.attendance_percentage !== null && r.attendance_percentage !== undefined) {
        g.attendanceSum += r.attendance_percentage;
        g.attendanceN += 1;
        g.completedRows.push(r);
      }
      if (r.rating) { g.ratingSum += r.rating; g.ratingN += 1; }
      g.recordingEligible += 1;
      if (r.recording_status === "Available") g.recordingAvailable += 1;
      g.reportEligible += 1;
      if (r.report_status === "Submitted" || r.report_status === "Reviewed") g.reportDone += 1;
    }
    if (r.status === "Cancelled") g.cancelled += 1;
  });

  return Object.values(groups)
    .map((g) => {
      const avgAttendance = g.attendanceN ? Math.round(g.attendanceSum / g.attendanceN) : null;
      const avgRating = g.ratingN ? Math.round((g.ratingSum / g.ratingN) * 10) / 10 : null;
      const recordingPct = g.recordingEligible ? Math.round((g.recordingAvailable / g.recordingEligible) * 100) : null;
      const reportPct = g.reportEligible ? Math.round((g.reportDone / g.reportEligible) * 100) : null;
      const cancelRate = g.sessions ? Math.round((g.cancelled / g.sessions) * 100) : 0;
      let risk = "Good";
      if (
        (avgAttendance !== null && avgAttendance < HEALTH_THRESHOLDS.lowAttendancePct) ||
        (avgRating !== null && avgRating < HEALTH_THRESHOLDS.lowRating) ||
        cancelRate >= HEALTH_THRESHOLDS.highCancellationPct
      ) {
        risk = "Critical";
      } else if (
        (recordingPct !== null && recordingPct < HEALTH_THRESHOLDS.lowCompliancePct) ||
        (reportPct !== null && reportPct < HEALTH_THRESHOLDS.lowCompliancePct)
      ) {
        risk = "Watch";
      }

      // Trend: compare average attendance of the group's own earlier vs more
      // recent completed sessions (chronological split) — needs at least 4
      // sessions with attendance data to be meaningful.
      let trend = null;
      if (g.completedRows.length >= 4) {
        const sorted = [...g.completedRows].sort((a, b) => new Date(a.session_date) - new Date(b.session_date));
        const mid = Math.floor(sorted.length / 2);
        const earlier = sorted.slice(0, mid);
        const recent = sorted.slice(mid);
        const avgOf = (list) => list.reduce((s, r) => s + r.attendance_percentage, 0) / list.length;
        const diff = avgOf(recent) - avgOf(earlier);
        trend = diff >= 2 ? "up" : diff <= -2 ? "down" : "flat";
      }

      return {
        name: g.key, sessions: g.sessions, completed: g.completed, learners: g.learners,
        avgAttendance, avgRating, recordingPct, reportPct, cancelRate, risk, trend,
      };
    })
    .sort((a, b) => b.sessions - a.sessions);
}

function Badge({ label, styles }) {
  const s = styles[label] || { bg: "#e2e8f0", color: "#475569", dot: "#94a3b8" };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        background: s.bg,
        color: s.color,
        fontSize: "12px",
        fontWeight: 700,
        padding: "4px 10px",
        borderRadius: "999px",
        whiteSpace: "nowrap",
      }}
    >
      {s.dot && <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: s.dot }} />}
      {label || "—"}
    </span>
  );
}

function KPICard({ icon: Icon, label, value, sub, color = "#0f172a", trend, trendSuffix = "%", trendInvert = false }) {
  const hasTrend = trend !== undefined;
  const trendGood = hasTrend && trend !== null && (trendInvert ? trend <= 0 : trend >= 0);
  return (
    <div className="kpi-tile">
      <div className="kpi-icon" style={{ background: `${color}1a`, color }}>
        <Icon size={17} strokeWidth={2.2} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div className="kpi-value" style={{ color }}>{value}</div>
        <div className="kpi-label">{label}</div>
        {sub && <div className="kpi-sub">{sub}</div>}
        {hasTrend && (
          <div className={`kpi-trend ${trend === null ? "kpi-trend-flat" : trendGood ? "kpi-trend-up" : "kpi-trend-down"}`}>
            {trend === null ? "No prior period data" : `${trend > 0 ? "+" : ""}${trend}${trendSuffix} vs previous period`}
          </div>
        )}
      </div>
      <style jsx>{`
        .kpi-tile {
          background: #fff;
          border: 1px solid #eef2f7;
          border-left: 4px solid ${color};
          padding: 14px 16px;
          border-radius: 12px;
          display: flex;
          gap: 12px;
          align-items: flex-start;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .kpi-tile:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 18px -10px rgba(15, 23, 42, 0.25);
        }
        .kpi-icon {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .kpi-value {
          font-size: 21px;
          font-weight: 800;
          font-variant-numeric: tabular-nums;
          line-height: 1.1;
        }
        .kpi-label {
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          margin-top: 3px;
        }
        .kpi-sub {
          font-size: 10.5px;
          color: #94a3b8;
          margin-top: 2px;
        }
        .kpi-trend { font-size: 10.5px; font-weight: 700; margin-top: 4px; }
        .kpi-trend-up { color: #16a34a; }
        .kpi-trend-down { color: #ef4444; }
        .kpi-trend-flat { color: #94a3b8; }
      `}</style>
    </div>
  );
}

function KPISkeleton() {
  return <div className="kpi-skel" />;
}

function QualityBar({ label, value, max, note }) {
  const pct = value ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="quality-row">
      <div className="quality-row-top">
        <span className="quality-label">{label}</span>
        <span className="quality-value">{value ? `${value} / ${max}` : "Not Available"}</span>
      </div>
      <div className="quality-track">
        <div className="quality-fill" style={{ width: `${pct}%` }} />
      </div>
      {note && <div className="quality-note">{note}</div>}
      <style jsx>{`
        .quality-row { margin-bottom: 14px; }
        .quality-row:last-child { margin-bottom: 0; }
        .quality-row-top { display: flex; justify-content: space-between; margin-bottom: 6px; }
        .quality-label { font-size: 12.5px; font-weight: 700; color: #334155; }
        .quality-value { font-size: 12.5px; font-weight: 800; color: #0f172a; }
        .quality-track { height: 7px; background: #f1f5f9; border-radius: 999px; overflow: hidden; }
        .quality-fill { height: 100%; background: linear-gradient(90deg, #f59e0b, #fbbf24); border-radius: 999px; }
        .quality-note { font-size: 10.5px; color: #94a3b8; margin-top: 4px; }
      `}</style>
    </div>
  );
}

function OpBar({ label, pct, note }) {
  const color = pct === null ? "#cbd5e1" : pct >= 80 ? "#22c55e" : pct >= 60 ? "#f59e0b" : "#ef4444";
  return (
    <div className="quality-row">
      <div className="quality-row-top">
        <span className="quality-label">{label}</span>
        <span className="quality-value">{pct === null ? "Not Available" : `${pct}%`}</span>
      </div>
      <div className="quality-track">
        <div className="quality-fill" style={{ width: `${pct || 0}%`, background: color }} />
      </div>
      {note && <div className="quality-note">{note}</div>}
      <style jsx>{`
        .quality-row { margin-bottom: 14px; }
        .quality-row:last-child { margin-bottom: 0; }
        .quality-row-top { display: flex; justify-content: space-between; margin-bottom: 6px; }
        .quality-label { font-size: 12.5px; font-weight: 700; color: #334155; }
        .quality-value { font-size: 12.5px; font-weight: 800; color: #0f172a; }
        .quality-track { height: 7px; background: #f1f5f9; border-radius: 999px; overflow: hidden; }
        .quality-fill { height: 100%; border-radius: 999px; }
        .quality-note { font-size: 10.5px; color: #94a3b8; margin-top: 4px; }
      `}</style>
    </div>
  );
}

function SectionTitle({ icon: Icon, iconColor = "#2563eb", title, sub, right }) {
  return (
    <div className="card-header-row">
      <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
        {Icon && (
          <span className="section-icon" style={{ background: `${iconColor}1a`, color: iconColor }}>
            <Icon size={15} strokeWidth={2.2} />
          </span>
        )}
        <div>
          <h2 className="card-title" style={{ margin: 0 }}>{title}</h2>
          {sub && <div className="card-sub">{sub}</div>}
        </div>
      </div>
      {right}
      <style jsx>{`
        .section-icon { width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
      `}</style>
    </div>
  );
}

function TrendArrow({ trend }) {
  if (trend === "up") return <span style={{ color: "#16a34a", fontWeight: 800 }}>↑</span>;
  if (trend === "down") return <span style={{ color: "#ef4444", fontWeight: 800 }}>↓</span>;
  if (trend === "flat") return <span style={{ color: "#94a3b8", fontWeight: 800 }}>→</span>;
  return <span style={{ color: "#cbd5e1" }}>—</span>;
}

function TrendPill({ value, invert = false, suffix = "" }) {
  if (value === null || value === undefined) return <span className="trend-pill trend-flat"><Minus size={11} /> No prior data</span>;
  const good = invert ? value <= 0 : value >= 0;
  const Icon = value === 0 ? Minus : value > 0 ? TrendingUp : TrendingDown;
  return (
    <span className={`trend-pill ${good ? "trend-up" : "trend-down"}`}>
      <Icon size={11} /> {value > 0 ? "+" : ""}{value}{suffix} vs prior period
      <style jsx>{`
        .trend-pill { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 999px; }
        .trend-up { background: #dcfce7; color: #15803d; }
        .trend-down { background: #fee2e2; color: #b91c1c; }
        .trend-flat { background: #f1f5f9; color: #64748b; }
      `}</style>
    </span>
  );
}

const inputStyle = {
  width: "100%",
  padding: "9px 11px",
  borderRadius: "8px",
  border: "1px solid #e2e8f0",
  fontSize: "13px",
  background: "#f8fafc",
  boxSizing: "border-box",
  outline: "none",
};

const emptyFilters = {
  date_from: "",
  date_to: "",
  status: "",
  mentor_name: "",
  batch_name: "",
  course_name: "",
  session_type: "",
  recording_status: "",
  report_status: "",
  attendance_tier: "",
  rating_tier: "",
};

const ATTENDANCE_TIERS = {
  high: { label: "High (≥90%)", test: (v) => v !== null && v !== undefined && v >= 90 },
  medium: { label: "Medium (75–89%)", test: (v) => v !== null && v !== undefined && v >= 75 && v < 90 },
  low: { label: "Low (<75%)", test: (v) => v !== null && v !== undefined && v < 75 },
};

const RATING_TIERS = {
  high: { label: "4 – 5", test: (v) => !!v && v >= 4 },
  medium: { label: "3 – 3.9", test: (v) => !!v && v >= 3 && v < 4 },
  low: { label: "Below 3", test: (v) => !!v && v < 3 },
};

const TREND_RANGE_LABELS = { 7: "7D", 30: "30D", 90: "90D", 180: "6M", 365: "12M" };

function buildQuery(params) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== "" && v !== null && v !== undefined) usp.set(k, v);
  });
  return usp.toString();
}

function fmtDateTime(dateStr, timeStr) {
  if (!dateStr) return { date: "—", time: timeStr || "—" };
  const d = new Date(dateStr);
  const date = isNaN(d.getTime())
    ? dateStr
    : d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
  return { date, time: timeStr || "—" };
}

function buildTrend(allRows, rangeDays = 30) {
  // Daily buckets for short ranges; weekly buckets for longer ones so the
  // chart stays readable instead of cramming 180-365 daily bars.
  const bucketDays = rangeDays > 90 ? 7 : 1;
  const bucketCount = Math.ceil(rangeDays / bucketDays);
  const buckets = [];
  for (let i = bucketCount - 1; i >= 0; i--) {
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() - i * bucketDays);
    buckets.push({ end, count: 0, sum: 0, n: 0, ratingSum: 0, ratingN: 0 });
  }
  allRows.forEach((r) => {
    if (!r.session_date) return;
    const age = daysBetween(r.session_date);
    if (age === null || age >= rangeDays) return;
    const idx = bucketCount - 1 - Math.floor(age / bucketDays);
    const b = buckets[idx];
    if (!b) return;
    b.count += 1;
    if (r.attendance_percentage) { b.sum += r.attendance_percentage; b.n += 1; }
    if (r.rating) { b.ratingSum += r.rating; b.ratingN += 1; }
  });

  return {
    labels: buckets.map((b) => b.end.toLocaleDateString(undefined, { day: "2-digit", month: "short" })),
    counts: buckets.map((b) => b.count),
    attendance: buckets.map((b) => (b.n ? Math.round(b.sum / b.n) : null)),
    rating: buckets.map((b) => (b.ratingN ? Math.round((b.ratingSum / b.ratingN) * 10) / 10 : null)),
  };
}

function DrawerField({ label, value }) {
  return (
    <div className="drawer-field">
      <div className="drawer-field-label">{label}</div>
      <div className="drawer-field-value">{value || value === 0 ? value : "—"}</div>
      <style jsx>{`
        .drawer-field { margin-bottom: 12px; }
        .drawer-field-label { font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; color: #94a3b8; margin-bottom: 3px; }
        .drawer-field-value { font-size: 13.5px; font-weight: 600; color: #1e293b; }
      `}</style>
    </div>
  );
}

function SessionDrawer({ session, onClose }) {
  const [detail, setDetail] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    Promise.all([
      fetch(`${API}/session-reports/${session.id}`).then((r) => r.json()).catch(() => null),
      fetch(`${API}/session-reports/${session.id}/feedback`).then((r) => r.json()).catch(() => null),
    ])
      .then(([d, f]) => {
        setDetail(d && d.success ? d : null);
        setFeedback(f && f.success ? f : null);
      })
      .finally(() => setLoading(false));
  }, [session]);

  if (!session) return null;

  const info = detail?.session_info;
  const content = detail?.content;
  const report = detail?.report;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div>
            <div className="drawer-eyebrow">Session #{session.id}</div>
            <h3 className="drawer-title">{session.topic}</h3>
          </div>
          <button className="drawer-close" onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <div className="drawer-loading">Loading session details…</div>
        ) : (
          <div className="drawer-body">
            <div className="drawer-section-title">Session Details</div>
            <div className="drawer-grid">
              <DrawerField label="Date" value={info ? fmtDateTime(info.session_date, info.session_time).date : session.session_date} />
              <DrawerField label="Time" value={info?.session_time || session.session_time} />
              <DrawerField label="Duration" value={(info?.duration || session.duration) ? `${info?.duration || session.duration} min` : "—"} />
              <DrawerField label="Mentor" value={info?.mentor_name || session.mentor_name} />
              <DrawerField label="Batch" value={info?.batch_name || session.batch_name || "—"} />
              <DrawerField label="Course" value={info?.course_name || session.course_name || "—"} />
              <DrawerField label="Session Type" value={info?.session_type || session.session_type || "—"} />
              <DrawerField label="Status" value={<Badge label={info?.status || session.status} styles={STATUS_STYLES} />} />
            </div>

            <div className="drawer-section-title">Session Performance</div>
            <div className="drawer-grid">
              <DrawerField label="Registered Learners" value={session.learner_count} />
              <DrawerField label="Attended Learners" value={session.attendance} />
              <DrawerField label="Attendance %" value={`${session.attendance_percentage}%`} />
            </div>

            <div className="drawer-section-title">Session Quality</div>
            <div className="drawer-quality">
              <DrawerField label="Session Rating" value={feedback?.average_rating ? `${feedback.average_rating} / 5` : "Not Available"} />
              <DrawerField label="Batch/Mentor NPS (avg)" value={feedback?.nps?.average_score ?? "Not Available"} />
              {feedback?.nps?.note && <div className="drawer-note">ℹ️ {feedback.nps.note}</div>}
            </div>

            <div className="drawer-section-title">Recording</div>
            <div className="drawer-grid">
              <DrawerField label="Recording Status" value={<Badge label={session.recording_status} styles={RECORDING_STYLES} />} />
              <DrawerField
                label="Recording Link"
                value={content?.recording_link ? <a href={content.recording_link} target="_blank" rel="noreferrer">Open Recording</a> : "Not Available"}
              />
            </div>

            <div className="drawer-section-title">Report</div>
            <div className="drawer-grid">
              <DrawerField label="Report Status" value={<Badge label={session.report_status} styles={REPORT_STYLES} />} />
              <DrawerField label="Summary" value={report?.summary || "Session report is not available yet."} />
            </div>

            <div className="drawer-section-title">Actions</div>
            <div className="drawer-actions">
              <Link href="/sessions" className="drawer-btn">🗓️ View Session</Link>
              <Link href={`/session-reports/${session.id}`} className="drawer-btn">📄 View Report</Link>
              <a className="drawer-btn" href={`${API}/session-reports/${session.id}/download`} target="_blank" rel="noreferrer">⬇️ Download PDF</a>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .drawer-overlay {
          position: fixed; inset: 0; background: rgba(15, 23, 42, 0.45);
          z-index: 100; display: flex; justify-content: flex-end;
          animation: fadeIn 0.15s ease;
        }
        .drawer-panel {
          width: 440px; max-width: 92vw; height: 100vh; background: #fff;
          box-shadow: -12px 0 32px -12px rgba(0,0,0,0.35);
          display: flex; flex-direction: column; animation: slideInRight 0.2s ease;
        }
        .drawer-header {
          display: flex; align-items: flex-start; justify-content: space-between;
          padding: 20px 22px; border-bottom: 1px solid #f1f5f9; flex-shrink: 0;
        }
        .drawer-eyebrow { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 4px; }
        .drawer-title { margin: 0; font-size: 17px; color: #0f172a; max-width: 340px; }
        .drawer-close { background: #f1f5f9; border: none; border-radius: 8px; width: 30px; height: 30px; cursor: pointer; font-size: 13px; color: #475569; flex-shrink: 0; }
        .drawer-body { padding: 20px 22px; overflow-y: auto; }
        .drawer-loading { padding: 40px 22px; color: #94a3b8; font-size: 13px; }
        .drawer-section-title {
          font-size: 11.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em;
          color: #0f172a; margin: 18px 0 10px; padding-bottom: 6px; border-bottom: 2px solid #fbbf24;
        }
        .drawer-section-title:first-child { margin-top: 0; }
        .drawer-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; }
        .drawer-quality { }
        .drawer-note { font-size: 11px; color: #94a3b8; font-style: italic; margin-top: -4px; margin-bottom: 8px; }
        .drawer-actions { display: flex; flex-direction: column; gap: 8px; }
        :global(.drawer-btn) {
          display: block; text-align: center; text-decoration: none; background: #f8fafc; border: 1px solid #e2e8f0;
          color: #1e293b; font-weight: 700; font-size: 13px; padding: 10px; border-radius: 9px; cursor: pointer;
        }
        :global(.drawer-btn:hover) { background: #f1f5f9; }
        @keyframes slideInRight { from { transform: translateX(24px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}

export default function SessionReports() {
  const [summary, setSummary] = useState(null);
  const [allRows, setAllRows] = useState([]); // unpaginated, server-filtered — powers every dashboard section + the explorer table
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [mentors, setMentors] = useState([]);
  const [batches, setBatches] = useState([]);
  const [npsFeedback, setNpsFeedback] = useState([]);

  const [filters, setFilters] = useState(emptyFilters);
  const [datePreset, setDatePreset] = useState("");
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [search, setSearch] = useState("");

  const [sortBy, setSortBy] = useState("session_date");
  const [sortDir, setSortDir] = useState("desc");

  const [trendRangeDays, setTrendRangeDays] = useState(30);

  const [mentorSearch, setMentorSearch] = useState("");
  const [mentorSort, setMentorSort] = useState({ field: "sessions", dir: "desc" });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const [exportMenu, setExportMenu] = useState(null); // { top, left } when open
  const [rowMenu, setRowMenu] = useState(null); // { id, top, left }
  const [drawerSession, setDrawerSession] = useState(null);

  useEffect(() => {
    fetch(`${API}/mentors`).then((r) => r.json()).then(setMentors).catch(() => {});
    fetch(`${API}/batches`).then((r) => r.json()).then(setBatches).catch(() => {});
    fetch(`${API}/nps`).then((r) => r.json()).then((d) => setNpsFeedback(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const load = () => {
    setLoading(true);
    setError("");

    // Attendance/Rating tiers have no backend column to filter on — they're
    // applied client-side below, so only the other filters go server-side.
    const { attendance_tier, rating_tier, ...serverFilters } = appliedFilters;
    const summaryQuery = buildQuery(serverFilters);
    const allQuery = buildQuery({ ...serverFilters, search, page: 1, page_size: 1000, sort_by: sortBy, sort_dir: sortDir });

    Promise.all([
      fetch(`${API}/session-reports/summary?${summaryQuery}`).then((r) => r.json()),
      fetch(`${API}/session-reports?${allQuery}`).then((r) => r.json()),
    ])
      .then(([summaryData, allData]) => {
        setSummary(summaryData);
        setAllRows(allData.items || []);
        setLastUpdated(new Date());
      })
      .catch(() => setError("Unable to reach the server."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [appliedFilters, search, sortBy, sortDir]);

  useEffect(() => {
    const onClick = (e) => {
      if (exportMenu && !e.target.closest(".export-menu, .btn-export")) setExportMenu(null);
      if (rowMenu && !e.target.closest(".row-menu, .btn-icon-only")) setRowMenu(null);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [exportMenu, rowMenu]);

  const applyFilters = () => {
    setPage(1);
    setAppliedFilters(filters);
  };

  // Quick date ranges fill date_from/date_to; editing either date by hand
  // flips the preset back to "Custom".
  const changeDatePreset = (preset) => {
    setDatePreset(preset);
    const iso = (d) => d.toLocaleDateString("en-CA");
    const today = new Date();
    let from = "";
    let to = "";
    if (preset === "7" || preset === "30" || preset === "90") {
      const start = new Date();
      start.setDate(today.getDate() - Number(preset));
      from = iso(start);
      to = iso(today);
    } else if (preset === "month") {
      from = iso(new Date(today.getFullYear(), today.getMonth(), 1));
      to = iso(today);
    } else if (preset === "custom") {
      return;
    }
    setFilters((prev) => ({ ...prev, date_from: from, date_to: to }));
  };

  const clearFilters = () => {
    setDatePreset("");
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setSearch("");
    setPage(1);
  };

  const courseOptions = useMemo(() => [...new Set(batches.map((b) => b.course_name).filter(Boolean))].sort(), [batches]);
  const advancedFilterActive = !!(filters.session_type || filters.recording_status || filters.report_status || filters.attendance_tier || filters.rating_tier);

  const viewBatch = (batchName) => {
    const next = { ...emptyFilters, batch_name: batchName };
    setFilters(next);
    setAppliedFilters(next);
    setPage(1);
    document.getElementById("session-explorer")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir("asc");
    }
  };

  // Attendance / Rating tiers applied client-side on top of the server-filtered rows.
  // Every dashboard section (KPIs, health, matrices, risk, explorer) reads from this.
  const filteredAllRows = useMemo(() => {
    const attTier = appliedFilters.attendance_tier && ATTENDANCE_TIERS[appliedFilters.attendance_tier];
    const ratTier = appliedFilters.rating_tier && RATING_TIERS[appliedFilters.rating_tier];
    if (!attTier && !ratTier) return allRows;
    return allRows.filter((r) => {
      if (attTier && !attTier.test(r.attendance_percentage)) return false;
      if (ratTier && !ratTier.test(r.rating)) return false;
      return true;
    });
  }, [allRows, appliedFilters.attendance_tier, appliedFilters.rating_tier]);

  const total = filteredAllRows.length;
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  const rows = useMemo(() => filteredAllRows.slice((page - 1) * pageSize, page * pageSize), [filteredAllRows, page]);

  const exportUrl = `${API}/session-reports/export?${buildQuery({ ...appliedFilters, search })}`;
  const exportAllUrl = `${API}/session-reports/export`;
  const exportPdfUrl = `${API}/session-reports/export/pdf?${buildQuery({ ...appliedFilters, search })}`;

  const sortIndicator = (field) => (sortBy === field ? (sortDir === "asc" ? " ▲" : " ▼") : "");

  const appliedFilterCount = Object.values(appliedFilters).filter((v) => v !== "").length + (search ? 1 : 0);

  const trend = useMemo(() => buildTrend(filteredAllRows, trendRangeDays), [filteredAllRows, trendRangeDays]);

  const quality = useMemo(() => {
    if (!npsFeedback.length) return null;
    const avg = (key) => {
      const vals = npsFeedback.map((f) => f[key]).filter((v) => v !== null && v !== undefined);
      return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null;
    };
    return { instructor: avg("instructor_rating"), doubt: avg("doubt_rating"), nps: avg("nps_score"), count: npsFeedback.length };
  }, [npsFeedback]);

  const health = useMemo(() => {
    const buckets = { healthy: 0, needsReview: 0, attention: 0 };
    const flagged = [];
    filteredAllRows.forEach((r) => {
      const c = classifySessionHealth(r);
      buckets[c.tier] += 1;
      if (c.tier !== "healthy") flagged.push({ ...r, reason: c.reason, tier: c.tier });
    });
    flagged.sort((a, b) => (a.tier === b.tier ? 0 : a.tier === "attention" ? -1 : 1));
    return { buckets, flagged };
  }, [filteredAllRows]);

  const insights = useMemo(() => {
    if (!filteredAllRows.length) return null;
    const mentorCounts = {};
    const batchAttendance = {};
    filteredAllRows.forEach((r) => {
      if (r.mentor_name) mentorCounts[r.mentor_name] = (mentorCounts[r.mentor_name] || 0) + 1;
      if (r.batch_name && r.attendance_percentage) {
        if (!batchAttendance[r.batch_name]) batchAttendance[r.batch_name] = { sum: 0, n: 0 };
        batchAttendance[r.batch_name].sum += r.attendance_percentage;
        batchAttendance[r.batch_name].n += 1;
      }
    });
    const mostActiveMentor = Object.entries(mentorCounts).sort((a, b) => b[1] - a[1])[0];
    const batchAverages = Object.entries(batchAttendance).map(([name, v]) => [name, Math.round(v.sum / v.n)]);
    const topBatch = batchAverages.sort((a, b) => b[1] - a[1])[0];
    return { mostActiveMentor, topBatch };
  }, [filteredAllRows]);

  // ---- New: Operations Intelligence computations (all derived from real filteredAllRows/summary) ----

  const mentorMatrix = useMemo(() => buildOpsMatrix(filteredAllRows, "mentor_name"), [filteredAllRows]);
  const batchMatrix = useMemo(() => buildOpsMatrix(filteredAllRows, "batch_name"), [filteredAllRows]);
  const atRiskBatches = useMemo(() => batchMatrix.filter((b) => b.risk !== "Good"), [batchMatrix]);

  const visibleMentorMatrix = useMemo(() => {
    let list = mentorMatrix;
    if (mentorSearch.trim()) {
      const q = mentorSearch.trim().toLowerCase();
      list = list.filter((m) => m.name.toLowerCase().includes(q));
    }
    const { field, dir } = mentorSort;
    const sorted = [...list].sort((a, b) => {
      const av = a[field], bv = b[field];
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      if (typeof av === "string") return dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      return dir === "asc" ? av - bv : bv - av;
    });
    return sorted;
  }, [mentorMatrix, mentorSearch, mentorSort]);

  const toggleMentorSort = (field) => {
    setMentorSort((s) => (s.field === field ? { field, dir: s.dir === "asc" ? "desc" : "asc" } : { field, dir: "desc" }));
  };

  const attendanceIntel = useMemo(() => {
    const completed = filteredAllRows.filter((r) => r.status === "Completed");
    if (!completed.length) return null;
    const registered = completed.reduce((s, r) => s + (r.learner_count || 0), 0);
    const attended = completed.reduce((s, r) => s + (r.attendance || 0), 0);
    const withPct = completed.filter((r) => r.attendance_percentage !== null && r.attendance_percentage !== undefined);
    const avgPct = withPct.length ? Math.round(withPct.reduce((s, r) => s + r.attendance_percentage, 0) / withPct.length) : null;
    const high = withPct.filter((r) => r.attendance_percentage >= 90).length;
    const medium = withPct.filter((r) => r.attendance_percentage >= 75 && r.attendance_percentage < 90).length;
    const low = withPct.filter((r) => r.attendance_percentage < 75).length;
    return {
      registered, attended, avgPct,
      absenteeRate: registered ? Math.round(((registered - attended) / registered) * 1000) / 10 : null,
      high, medium, low, total: withPct.length,
    };
  }, [filteredAllRows]);

  const opCompliance = useMemo(() => {
    const complianceOf = (list) => {
      const completed = list.filter((r) => r.status === "Completed");
      if (!completed.length) return null;
      const recordingAvail = completed.filter((r) => r.recording_status === "Available").length;
      const reportDone = completed.filter((r) => r.report_status === "Submitted" || r.report_status === "Reviewed").length;
      return {
        recordingPct: Math.round((recordingAvail / completed.length) * 100),
        reportPct: Math.round((reportDone / completed.length) * 100),
        n: completed.length,
      };
    };
    const current = complianceOf(filteredAllRows.filter((r) => inWindow(r.session_date, 30)));
    const previous = complianceOf(filteredAllRows.filter((r) => inWindow(r.session_date, 60, 30)));
    const overall = complianceOf(filteredAllRows);
    if (!overall) return null;
    return { ...overall, current, previous };
  }, [filteredAllRows]);

  const overallCompliancePct = opCompliance ? Math.round((opCompliance.recordingPct + opCompliance.reportPct) / 2) : null;

  const recordingHealth = useMemo(() => {
    const completed = filteredAllRows.filter((r) => r.status === "Completed");
    if (!completed.length) return null;
    const available = completed.filter((r) => r.recording_status === "Available").length;
    return { available, notAvailable: completed.length - available, total: completed.length };
  }, [filteredAllRows]);

  const reportHealth = useMemo(() => {
    const completed = filteredAllRows.filter((r) => r.status === "Completed");
    if (!completed.length) return null;
    const pending = completed.filter((r) => r.report_status === "Pending").length;
    const submitted = completed.filter((r) => r.report_status === "Submitted").length;
    const reviewed = completed.filter((r) => r.report_status === "Reviewed").length;
    return { pending, submitted, reviewed, total: completed.length };
  }, [filteredAllRows]);

  const riskMatrixData = useMemo(() => {
    return filteredAllRows
      .filter((r) => r.status === "Completed" && r.attendance_percentage !== null && r.attendance_percentage !== undefined && r.rating)
      .map((r) => {
        const compliant = r.recording_status === "Available" && (r.report_status === "Submitted" || r.report_status === "Reviewed");
        return {
          x: r.attendance_percentage,
          y: r.rating,
          r: Math.max(4, Math.min(18, (r.learner_count || 2) / 2)),
          compliant,
          session: r,
        };
      });
  }, [filteredAllRows]);

  const cancellation = useMemo(() => {
    const cancelled = filteredAllRows.filter((r) => r.status === "Cancelled");
    const rescheduled = filteredAllRows.filter((r) => r.status === "Rescheduled");
    const learnersImpacted = cancelled.reduce((sum, r) => sum + (r.learner_count || 0), 0);
    const rate = filteredAllRows.length ? Math.round((cancelled.length / filteredAllRows.length) * 1000) / 10 : 0;

    const weeks = [];
    for (let i = 7; i >= 0; i--) weeks.push({ start: (i + 1) * 7, end: i * 7, count: 0 });
    cancelled.forEach((r) => {
      const age = daysBetween(r.session_date);
      if (age === null) return;
      const w = weeks.find((w) => age >= w.end && age < w.start);
      if (w) w.count += 1;
    });

    const byMentor = {}, byBatch = {}, byCourse = {};
    cancelled.forEach((r) => {
      if (r.mentor_name) byMentor[r.mentor_name] = (byMentor[r.mentor_name] || 0) + 1;
      if (r.batch_name) byBatch[r.batch_name] = (byBatch[r.batch_name] || 0) + 1;
      if (r.course_name) byCourse[r.course_name] = (byCourse[r.course_name] || 0) + 1;
    });
    const top = (obj) => Object.entries(obj).sort((a, b) => b[1] - a[1])[0] || null;

    return {
      total: cancelled.length, rescheduled: rescheduled.length, rate, learnersImpacted,
      trendLabels: weeks.map((w) => `${w.end}d`).reverse(),
      trend: weeks.map((w) => w.count).reverse(),
      topMentor: top(byMentor), topBatch: top(byBatch), topCourse: top(byCourse),
    };
  }, [filteredAllRows]);

  const signals = useMemo(() => {
    const curr = filteredAllRows.filter((r) => inWindow(r.session_date, 30));
    const prev = filteredAllRows.filter((r) => inWindow(r.session_date, 60, 30));
    if (!curr.length || !prev.length) return null;
    const statOf = (list) => {
      const completed = list.filter((r) => r.status === "Completed");
      const att = completed.map((r) => r.attendance_percentage).filter((v) => v !== null && v !== undefined);
      const rat = completed.map((r) => r.rating).filter(Boolean);
      const cancelled = list.filter((r) => r.status === "Cancelled").length;
      return {
        avgAttendance: att.length ? Math.round(att.reduce((a, b) => a + b, 0) / att.length) : null,
        avgRating: rat.length ? Math.round((rat.reduce((a, b) => a + b, 0) / rat.length) * 10) / 10 : null,
        cancelRate: list.length ? Math.round((cancelled / list.length) * 1000) / 10 : null,
        count: list.length,
      };
    };
    const c = statOf(curr), p = statOf(prev);
    return {
      attendanceDelta: (c.avgAttendance !== null && p.avgAttendance !== null) ? c.avgAttendance - p.avgAttendance : null,
      ratingDelta: (c.avgRating !== null && p.avgRating !== null) ? Math.round((c.avgRating - p.avgRating) * 10) / 10 : null,
      cancelDelta: (c.cancelRate !== null && p.cancelRate !== null) ? Math.round((c.cancelRate - p.cancelRate) * 10) / 10 : null,
      current: c, previous: p,
    };
  }, [filteredAllRows]);

  const kpiTrends = useMemo(() => {
    const curr = filteredAllRows.filter((r) => inWindow(r.session_date, 30));
    const prev = filteredAllRows.filter((r) => inWindow(r.session_date, 60, 30));
    if (!curr.length || !prev.length) return null;
    const statOf = (list) => {
      const completed = list.filter((r) => r.status === "Completed");
      const recordingAvail = completed.filter((r) => r.recording_status === "Available").length;
      const reportDone = completed.filter((r) => r.report_status === "Submitted" || r.report_status === "Reviewed").length;
      const compliancePct = completed.length ? Math.round(((recordingAvail / completed.length) + (reportDone / completed.length)) / 2 * 100) : null;
      return {
        sessions: list.length,
        completedPct: list.length ? Math.round((completed.length / list.length) * 100) : null,
        learners: completed.reduce((s, r) => s + (r.attendance || 0), 0),
        compliancePct,
      };
    };
    const c = statOf(curr), p = statOf(prev);
    const pctDelta = (cv, pv) => (cv !== null && pv !== null && pv !== 0 ? Math.round(((cv - pv) / pv) * 1000) / 10 : null);
    return {
      sessionsDelta: pctDelta(c.sessions, p.sessions),
      completedPctDelta: (c.completedPct !== null && p.completedPct !== null) ? c.completedPct - p.completedPct : null,
      learnersDelta: pctDelta(c.learners, p.learners),
      complianceDelta: (c.compliancePct !== null && p.compliancePct !== null) ? c.compliancePct - p.compliancePct : null,
      current: c, previous: p,
    };
  }, [filteredAllRows]);

  const actionItems = useMemo(() => {
    const items = [];
    if (signals) {
      if (signals.attendanceDelta !== null && signals.attendanceDelta <= -5) {
        items.push({
          issue: "Attendance declining", priority: "High", metric: "Attendance %",
          evidence: `Avg attendance dropped ${Math.abs(signals.attendanceDelta)} pts (${signals.previous.avgAttendance}% → ${signals.current.avgAttendance}%)`,
          affected: `${signals.current.count} sessions in the last 30 days`,
          recommendation: "Investigate attendance patterns for the affected batches and review recent learner feedback.",
        });
      }
      if (signals.ratingDelta !== null && signals.ratingDelta <= -0.3) {
        items.push({
          issue: "Session rating declining", priority: "High", metric: "Rating",
          evidence: `Avg rating dropped ${Math.abs(signals.ratingDelta)} (${signals.previous.avgRating} → ${signals.current.avgRating})`,
          affected: `${signals.current.count} sessions in the last 30 days`,
          recommendation: "Review recent learner feedback and session recordings to identify a potential signal.",
        });
      }
      if (signals.cancelDelta !== null && signals.cancelDelta >= 5) {
        items.push({
          issue: "Cancellation rate rising", priority: "Medium", metric: "Cancellation %",
          evidence: `Cancellation rate up ${signals.cancelDelta} pts (${signals.previous.cancelRate}% → ${signals.current.cancelRate}%)`,
          affected: `${signals.current.count} sessions in the last 30 days`,
          recommendation: "Review scheduling and mentor availability associated with the cancelled sessions.",
        });
      }
    }
    mentorMatrix.filter((m) => m.risk === "Critical").slice(0, 3).forEach((m) => {
      items.push({
        issue: `Mentor requires review: ${m.name}`, priority: "High", metric: "Attendance / Rating",
        evidence: `Avg attendance ${m.avgAttendance ?? "N/A"}%, avg rating ${m.avgRating ?? "N/A"}`,
        affected: `${m.sessions} sessions`,
        recommendation: "Investigate session delivery for this mentor — do not conclude causation without a manual review.",
      });
    });
    batchMatrix.filter((b) => b.risk === "Critical").slice(0, 3).forEach((b) => {
      items.push({
        issue: `Batch requires review: ${b.name}`, priority: "High", metric: "Attendance / Cancellation",
        evidence: `Avg attendance ${b.avgAttendance ?? "N/A"}%, cancellation rate ${b.cancelRate}%`,
        affected: `${b.sessions} sessions`,
        recommendation: "Review batch scheduling, mentor assignment and learner feedback associated with this batch.",
      });
    });
    if (cancellation.rate >= HEALTH_THRESHOLDS.highCancellationPct) {
      items.push({
        issue: "Overall cancellation rate elevated", priority: "Medium", metric: "Cancellation %",
        evidence: `${cancellation.rate}% of all sessions cancelled (${cancellation.total} sessions)`,
        affected: `${cancellation.learnersImpacted} learners impacted`,
        recommendation: "Review cancellation patterns by course, batch and mentor for a potential operational cause.",
      });
    }
    return items;
  }, [signals, mentorMatrix, batchMatrix, cancellation]);

  const criticalOperationalItems = useMemo(() => {
    return filteredAllRows
      .filter((r) => r.status === "Completed" && (r.recording_status === "Not Available" || r.report_status === "Pending"))
      .map((r) => ({
        ...r,
        issue: r.recording_status === "Not Available" && r.report_status === "Pending"
          ? "Missing Recording + Report Pending"
          : r.recording_status === "Not Available" ? "Missing Recording" : "Report Pending",
        age: daysBetween(r.session_date),
      }))
      .sort((a, b) => (b.age ?? 0) - (a.age ?? 0));
  }, [filteredAllRows]);

  return (
    <ProtectedRoute>
      <>
        <Sidebar />

        <div style={{ marginLeft: "var(--om-sidebar-width, 280px)", transition: "margin-left 0.25s ease", padding: "32px 36px 60px", background: "#f1f5f9", minHeight: "100vh" }}>
          {/* Header */}
          <div className="page-hero">
            <div className="page-hero-blob" />
            <div className="page-hero-content">
              <h1 className="page-hero-title">Session Operations Intelligence</h1>
              <p className="page-hero-subtitle">
                Real-time session performance, operational compliance and risk monitoring.
              </p>
              <div className="page-hero-meta">
                <span className="live-dot" /> Live Data
                {lastUpdated && <span className="page-hero-updated">· Last updated {lastUpdated.toLocaleTimeString()}</span>}
              </div>
            </div>

            <div className="export-wrap">
              <button
                className="btn btn-export"
                onClick={(e) => {
                  if (exportMenu) { setExportMenu(null); return; }
                  const rect = e.currentTarget.getBoundingClientRect();
                  setExportMenu({ top: rect.bottom + 8, left: rect.right - 220 });
                }}
              >
                📥 Export <ChevronDown size={13} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Filters — directly under the header, compact single row */}
          <div className="card filters-card">
            <div className="fbar">
              <div className="fbar-field">
                <label className="field-label">Date Range</label>
                <select style={inputStyle} value={datePreset} onChange={(e) => changeDatePreset(e.target.value)}>
                  <option value="">All Time</option>
                  <option value="7">Last 7 Days</option>
                  <option value="30">Last 30 Days</option>
                  <option value="90">Last 90 Days</option>
                  <option value="month">This Month</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div className="fbar-field">
                <label className="field-label">Date From</label>
                <input type="date" style={inputStyle} value={filters.date_from} onChange={(e) => { setDatePreset("custom"); setFilters({ ...filters, date_from: e.target.value }); }} />
              </div>
              <div className="fbar-field">
                <label className="field-label">Date To</label>
                <input type="date" style={inputStyle} value={filters.date_to} onChange={(e) => { setDatePreset("custom"); setFilters({ ...filters, date_to: e.target.value }); }} />
              </div>
              <div className="fbar-field">
                <label className="field-label">Course</label>
                <select style={inputStyle} value={filters.course_name} onChange={(e) => setFilters({ ...filters, course_name: e.target.value })}>
                  <option value="">All Courses</option>
                  {courseOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="fbar-field">
                <label className="field-label">Batch</label>
                <select style={inputStyle} value={filters.batch_name} onChange={(e) => setFilters({ ...filters, batch_name: e.target.value })}>
                  <option value="">All Batches</option>
                  {batches.map((b) => <option key={b.id} value={b.batch_name}>{b.batch_name}</option>)}
                </select>
              </div>
              <div className="fbar-field">
                <label className="field-label">Mentor</label>
                <select style={inputStyle} value={filters.mentor_name} onChange={(e) => setFilters({ ...filters, mentor_name: e.target.value })}>
                  <option value="">All Mentors</option>
                  {mentors.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
                </select>
              </div>
              <div className="fbar-field">
                <label className="field-label">Status</label>
                <select style={inputStyle} value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                  <option value="">All Statuses</option>
                  {Object.keys(STATUS_STYLES).map((st) => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>

              <div className="fbar-actions">
                <button className="btn btn-primary" onClick={applyFilters}><Check size={14} strokeWidth={2.6} /> Apply Filters</button>
                <button className="btn btn-ghost" onClick={clearFilters}><RotateCcw size={14} strokeWidth={2.3} /> Clear Filters</button>
                <button className="btn btn-ghost" onClick={() => setShowMoreFilters((v) => !v)}>
                  <SlidersHorizontal size={14} strokeWidth={2.3} /> {showMoreFilters || advancedFilterActive ? "Fewer Filters" : "More Filters"}
                </button>
              </div>
            </div>

            {(showMoreFilters || advancedFilterActive) && (
              <div className="fbar fbar-more">
                <div className="fbar-field">
                  <label className="field-label">Session Type</label>
                  <input placeholder="e.g. GenAI" style={inputStyle} value={filters.session_type} onChange={(e) => setFilters({ ...filters, session_type: e.target.value })} />
                </div>
                <div className="fbar-field">
                  <label className="field-label">Recording Status</label>
                  <select style={inputStyle} value={filters.recording_status} onChange={(e) => setFilters({ ...filters, recording_status: e.target.value })}>
                    <option value="">All</option>
                    <option value="Available">Available</option>
                    <option value="Not Available">Not Available</option>
                  </select>
                </div>
                <div className="fbar-field">
                  <label className="field-label">Report Status</label>
                  <select style={inputStyle} value={filters.report_status} onChange={(e) => setFilters({ ...filters, report_status: e.target.value })}>
                    <option value="">All</option>
                    <option value="Pending">Pending</option>
                    <option value="Submitted">Submitted</option>
                    <option value="Reviewed">Reviewed</option>
                  </select>
                </div>
                <div className="fbar-field">
                  <label className="field-label">Attendance</label>
                  <select style={inputStyle} value={filters.attendance_tier} onChange={(e) => setFilters({ ...filters, attendance_tier: e.target.value })}>
                    <option value="">All</option>
                    {Object.entries(ATTENDANCE_TIERS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div className="fbar-field">
                  <label className="field-label">Rating</label>
                  <select style={inputStyle} value={filters.rating_tier} onChange={(e) => setFilters({ ...filters, rating_tier: e.target.value })}>
                    <option value="">All</option>
                    {Object.entries(RATING_TIERS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
            )}

            {(filters.attendance_tier || filters.rating_tier) && (
              <div className="card-note" style={{ marginTop: "10px" }}>
                Attendance and Rating filters refine the dashboard and Session Explorer on-screen; CSV/PDF exports are not filtered by these two (no backend support yet).
              </div>
            )}
            {appliedFilterCount > 0 && <div className="filter-count-chip fbar-count">{appliedFilterCount} filter{appliedFilterCount > 1 ? "s" : ""} applied</div>}
          </div>

          {/* KPI cards */}
          <div className="kpi-section-label">Executive Overview</div>
          {summary ? (
            <div className="kpi-grid">
              <KPICard icon={CalendarClock} label="Total Sessions" value={summary.total_sessions} sub={`Avg duration ${summary.average_session_duration ?? "—"} min`} color="#0f172a" trend={kpiTrends ? kpiTrends.sessionsDelta : undefined} />
              <KPICard icon={CheckCircle2} label="Completed Sessions" value={summary.completed_sessions} sub={summary.total_sessions ? `${Math.round((summary.completed_sessions / summary.total_sessions) * 100)}% completion rate` : undefined} color="#16a34a" trend={kpiTrends ? kpiTrends.completedPctDelta : undefined} trendSuffix=" pts" />
              <KPICard icon={Users} label="Total Learners" value={summary.total_learners_attended} sub="Attended, all sessions" color="#2563eb" trend={kpiTrends ? kpiTrends.learnersDelta : undefined} />
              <KPICard icon={Percent} label="Avg Attendance" value={`${summary.average_attendance_percentage}%`} sub="Across all sessions" color="#0891b2" trend={signals ? signals.attendanceDelta : undefined} trendSuffix=" pts" />
              <KPICard icon={Star} label="Avg Rating" value={summary.average_rating ? `${summary.average_rating} / 5` : "Not Available"} sub="Based on feedback" color="#a855f7" trend={signals ? signals.ratingDelta : undefined} trendSuffix="" />
              <KPICard icon={ShieldCheck} label="Operational Compliance" value={overallCompliancePct !== null ? `${overallCompliancePct}%` : "N/A"} sub="Recording + report avg" color="#f59e0b" trend={kpiTrends ? kpiTrends.complianceDelta : undefined} trendSuffix=" pts" />
            </div>
          ) : (
            <div className="kpi-grid">{[...Array(6)].map((_, i) => <KPISkeleton key={i} />)}</div>
          )}

          {/* Session Health — standalone */}
          <div className="card" style={{ marginTop: "20px" }}>
            <SectionTitle icon={Activity} iconColor="#ef4444" title="Session Health" sub="Rollup across all sessions matching current filters" />
            {filteredAllRows.length === 0 ? (
              <div className="empty-state" style={{ padding: "20px 0" }}>No data yet.</div>
            ) : (
              <div className="health-row-wide">
                <div style={{ position: "relative", width: "130px", flexShrink: 0 }}>
                  <Doughnut
                    data={{
                      labels: ["Healthy", "Needs Review", "Attention"],
                      datasets: [{ data: [health.buckets.healthy, health.buckets.needsReview, health.buckets.attention], backgroundColor: ["#22c55e", "#f59e0b", "#ef4444"], borderWidth: 0 }],
                    }}
                    options={{ plugins: { legend: { display: false } }, cutout: "72%" }}
                  />
                  <div className="health-center">{filteredAllRows.length}<br /><span>Total Sessions</span></div>
                </div>
                <div className="health-legend">
                  <div><span className="legend-dot" style={{ background: "#22c55e" }} /> Healthy <b>{health.buckets.healthy}</b></div>
                  <div><span className="legend-dot" style={{ background: "#f59e0b" }} /> Needs Review <b>{health.buckets.needsReview}</b></div>
                  <div><span className="legend-dot" style={{ background: "#ef4444" }} /> Attention <b>{health.buckets.attention}</b></div>
                </div>
                <div className="health-legend" style={{ borderLeft: "1px solid #f1f5f9", paddingLeft: "24px" }}>
                  <div>Recording Compliance <b>{opCompliance ? `${opCompliance.recordingPct}%` : "N/A"}</b></div>
                  <div>Report Completion <b>{opCompliance ? `${opCompliance.reportPct}%` : "N/A"}</b></div>
                  <div>Cancellation Rate <b>{cancellation.rate}%</b></div>
                </div>
              </div>
            )}
          </div>

          {/* Trend + Quality */}
          <div className="grid-2a">
            <div className="card">
              <SectionTitle
                icon={TrendingUp}
                iconColor="#3b82f6"
                title="Session Performance Trend"
                sub={`Sessions conducted, attendance and rating (last ${TREND_RANGE_LABELS[trendRangeDays]})`}
                right={
                  <div className="range-toggle">
                    {Object.entries(TREND_RANGE_LABELS).map(([days, label]) => (
                      <button
                        key={days}
                        className={`range-btn ${trendRangeDays === Number(days) ? "range-btn-active" : ""}`}
                        onClick={() => setTrendRangeDays(Number(days))}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                }
              />
              {filteredAllRows.length === 0 ? (
                <div className="empty-state" style={{ padding: "40px 0" }}>No session data in the selected range.</div>
              ) : (
                <div style={{ height: "250px" }}>
                  <Chart
                    type="bar"
                    data={{
                      labels: trend.labels,
                      datasets: [
                        { type: "bar", label: "Sessions Conducted", data: trend.counts, backgroundColor: "#3b82f6", borderRadius: 4, yAxisID: "y", barThickness: 9 },
                        { type: "line", label: "Attendance %", data: trend.attendance, borderColor: "#f59e0b", backgroundColor: "#f59e0b", tension: 0.35, pointRadius: 2, yAxisID: "y1", spanGaps: true },
                        { type: "line", label: "Avg Rating (×20)", data: trend.rating.map((v) => (v === null ? null : Math.round(v * 20))), borderColor: "#a855f7", backgroundColor: "#a855f7", tension: 0.35, pointRadius: 2, yAxisID: "y1", spanGaps: true, borderDash: [4, 3] },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { position: "top", labels: { boxWidth: 10, font: { size: 11, weight: 600 }, color: "#475569" } } },
                      scales: {
                        x: { ticks: { font: { size: 9.5 }, color: "#94a3b8", maxRotation: 0, autoSkip: true, maxTicksLimit: 10 }, grid: { display: false } },
                        y: { beginAtZero: true, position: "left", ticks: { font: { size: 10.5 }, color: "#94a3b8", precision: 0 }, grid: { color: "#f1f5f9" } },
                        y1: { beginAtZero: true, max: 100, position: "right", ticks: { font: { size: 10.5 }, color: "#94a3b8", callback: (v) => `${v}%` }, grid: { drawOnChartArea: false } },
                      },
                    }}
                  />
                </div>
              )}
              <div className="card-note">Rating is scaled ×20 to share the 0–100% axis (e.g. a rating of 4.5 plots at 90).</div>
            </div>

            <div className="card">
              <SectionTitle icon={Star} iconColor="#a855f7" title="Session Quality" sub={`Based on learner feedback (${quality?.count || 0} responses)`} />
              <QualityBar label="Mentor Teaching Method" value={quality?.instructor} max={5} />
              <QualityBar label="Doubt Resolution" value={quality?.doubt} max={5} />
              <QualityBar label="Overall Experience (NPS)" value={quality?.nps} max={10} note="Matched by batch + mentor — not tied to a single session." />
            </div>
          </div>

          {/* Attendance Intelligence */}
          <div className="card" style={{ marginTop: "16px" }}>
            <SectionTitle icon={Users} iconColor="#0891b2" title="Attendance Intelligence" sub="Registered vs attended learners across completed sessions" />
            {!attendanceIntel ? (
              <div className="empty-state" style={{ padding: "20px 0" }}>No completed sessions yet.</div>
            ) : (
              <div className="attendance-intel-row">
                <div className="mini-kpi-grid">
                  <div className="mini-kpi"><div className="mini-kpi-val">{attendanceIntel.registered}</div><div className="mini-kpi-label">Registered</div></div>
                  <div className="mini-kpi"><div className="mini-kpi-val">{attendanceIntel.attended}</div><div className="mini-kpi-label">Attended</div></div>
                  <div className="mini-kpi"><div className="mini-kpi-val">{attendanceIntel.avgPct !== null ? `${attendanceIntel.avgPct}%` : "N/A"}</div><div className="mini-kpi-label">Avg Attendance</div></div>
                  <div className="mini-kpi"><div className="mini-kpi-val">{attendanceIntel.absenteeRate !== null ? `${attendanceIntel.absenteeRate}%` : "N/A"}</div><div className="mini-kpi-label">Absentee Rate</div></div>
                </div>
                <div className="attendance-dist">
                  <div className="dist-row"><span className="dist-label"><span className="legend-dot" style={{ background: "#22c55e" }} />High (≥90%)</span><span>{attendanceIntel.high}</span></div>
                  <div className="dist-track"><div style={{ width: `${attendanceIntel.total ? (attendanceIntel.high / attendanceIntel.total) * 100 : 0}%`, background: "#22c55e" }} className="dist-fill" /></div>
                  <div className="dist-row"><span className="dist-label"><span className="legend-dot" style={{ background: "#f59e0b" }} />Medium (75–89%)</span><span>{attendanceIntel.medium}</span></div>
                  <div className="dist-track"><div style={{ width: `${attendanceIntel.total ? (attendanceIntel.medium / attendanceIntel.total) * 100 : 0}%`, background: "#f59e0b" }} className="dist-fill" /></div>
                  <div className="dist-row"><span className="dist-label"><span className="legend-dot" style={{ background: "#ef4444" }} />Low (&lt;75%)</span><span>{attendanceIntel.low}</span></div>
                  <div className="dist-track"><div style={{ width: `${attendanceIntel.total ? (attendanceIntel.low / attendanceIntel.total) * 100 : 0}%`, background: "#ef4444" }} className="dist-fill" /></div>
                </div>
              </div>
            )}
          </div>

          {/* Batch Operations Health Matrix */}
          <div className="card" style={{ marginTop: "16px" }}>
            <SectionTitle icon={Layers} iconColor="#16a34a" title="Batch Operations Health Matrix" sub="Per-batch attendance, quality and compliance rollup" />
            {batchMatrix.length === 0 ? (
              <div className="empty-state" style={{ padding: "20px 0" }}>No batch data yet.</div>
            ) : (
              <div className="table-wrap">
                <table className="styled-table matrix-table">
                  <thead>
                    <tr>
                      <th>Batch</th><th>Sessions</th><th>Learners</th><th>Attendance</th><th>Rating</th>
                      <th>Recording</th><th>Reports</th><th>SLA</th><th>Cancellation</th><th>Risk</th><th>Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batchMatrix.map((b) => (
                      <tr key={b.name}>
                        <td className="strong">{b.name}</td>
                        <td className="muted">{b.sessions}</td>
                        <td className="muted">{b.learners}</td>
                        <td className="muted">{b.avgAttendance !== null ? `${b.avgAttendance}%` : "N/A"}</td>
                        <td className="muted">{b.avgRating !== null ? `★ ${b.avgRating}` : "N/A"}</td>
                        <td className="muted">{b.recordingPct !== null ? `${b.recordingPct}%` : "N/A"}</td>
                        <td className="muted">{b.reportPct !== null ? `${b.reportPct}%` : "N/A"}</td>
                        <td className="muted">N/A</td>
                        <td className="muted">{b.cancelRate}%</td>
                        <td><Badge label={b.risk} styles={RISK_STYLES} /></td>
                        <td><TrendArrow trend={b.trend} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="card-note">SLA Adherence is not tracked in the current data model — shown as N/A rather than estimated.</div>
          </div>

          {/* Mentor Session Performance Matrix */}
          <div className="card" style={{ marginTop: "16px" }}>
            <SectionTitle
              icon={UserCog}
              iconColor="#2563eb"
              title="Mentor Session Performance Matrix"
              sub="Per-mentor attendance, quality and compliance rollup — diagnostic, not a ranking"
              right={
                <div className="search-wrap">
                  <Search size={13} strokeWidth={2.3} className="search-icon" />
                  <input type="text" placeholder="Search mentor…" value={mentorSearch} onChange={(e) => setMentorSearch(e.target.value)} className="search-input" style={{ ...inputStyle, width: "180px" }} />
                </div>
              }
            />
            {mentorMatrix.length === 0 ? (
              <div className="empty-state" style={{ padding: "20px 0" }}>No mentor data yet.</div>
            ) : (
              <div className="table-wrap">
                <table className="styled-table matrix-table">
                  <thead>
                    <tr>
                      <th className="sortable" onClick={() => toggleMentorSort("name")}>Mentor</th>
                      <th className="sortable" onClick={() => toggleMentorSort("sessions")}>Sessions</th>
                      <th className="sortable" onClick={() => toggleMentorSort("learners")}>Learners</th>
                      <th className="sortable" onClick={() => toggleMentorSort("avgAttendance")}>Attendance</th>
                      <th className="sortable" onClick={() => toggleMentorSort("avgRating")}>Rating</th>
                      <th className="sortable" onClick={() => toggleMentorSort("recordingPct")}>Recording</th>
                      <th className="sortable" onClick={() => toggleMentorSort("reportPct")}>Reports</th>
                      <th>SLA</th>
                      <th className="sortable" onClick={() => toggleMentorSort("risk")}>Status</th>
                      <th>Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleMentorMatrix.map((m) => (
                      <tr key={m.name}>
                        <td className="strong">{m.name}</td>
                        <td className="muted">{m.sessions}</td>
                        <td className="muted">{m.learners}</td>
                        <td className="muted">{m.avgAttendance !== null ? `${m.avgAttendance}%` : "N/A"}</td>
                        <td className="muted">{m.avgRating !== null ? `★ ${m.avgRating}` : "N/A"}</td>
                        <td className="muted">{m.recordingPct !== null ? `${m.recordingPct}%` : "N/A"}</td>
                        <td className="muted">{m.reportPct !== null ? `${m.reportPct}%` : "N/A"}</td>
                        <td className="muted">N/A</td>
                        <td><Badge label={m.risk} styles={RISK_STYLES} /></td>
                        <td><TrendArrow trend={m.trend} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {visibleMentorMatrix.length === 0 && <div className="empty-state" style={{ padding: "20px 0" }}>No mentors match "{mentorSearch}".</div>}
              </div>
            )}
          </div>

          {/* Risk Matrix + Operational Compliance */}
          <div className="grid-2a">
            <div className="card">
              <SectionTitle icon={AlertTriangle} iconColor="#ef4444" title="Session Risk Matrix" sub="Attendance vs rating — bubble size = learners, color = compliance. Click a bubble for session details." />
              {riskMatrixData.length === 0 ? (
                <div className="empty-state" style={{ padding: "40px 0" }}>No completed sessions with both attendance and rating data yet.</div>
              ) : (
                <>
                  <div style={{ height: "260px", position: "relative" }}>
                    <Bubble
                      data={{
                        datasets: [
                          {
                            label: "Compliant",
                            data: riskMatrixData.filter((d) => d.compliant),
                            backgroundColor: "rgba(34,197,94,0.55)",
                          },
                          {
                            label: "Non-compliant",
                            data: riskMatrixData.filter((d) => !d.compliant),
                            backgroundColor: "rgba(239,68,68,0.55)",
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        onClick: (evt, elements, chart) => {
                          if (!elements.length) return;
                          const el = elements[0];
                          const ds = chart.data.datasets[el.datasetIndex];
                          const point = ds.data[el.index];
                          if (point?.session) setDrawerSession(point.session);
                        },
                        onHover: (evt, elements) => {
                          if (evt.native) evt.native.target.style.cursor = elements.length ? "pointer" : "default";
                        },
                        plugins: {
                          legend: { position: "top", labels: { boxWidth: 10, font: { size: 11, weight: 600 }, color: "#475569" } },
                          tooltip: {
                            callbacks: {
                              label: (ctx) => {
                                const s = ctx.raw.session;
                                return `${s.topic || "Session"} — Attendance ${ctx.raw.x}%, Rating ${ctx.raw.y}`;
                              },
                            },
                          },
                        },
                        scales: {
                          x: { title: { display: true, text: "Attendance %", font: { size: 10.5 }, color: "#94a3b8" }, min: 0, max: 100, ticks: { font: { size: 10 }, color: "#94a3b8" }, grid: { color: "#f1f5f9" } },
                          y: { title: { display: true, text: "Rating", font: { size: 10.5 }, color: "#94a3b8" }, min: 0, max: 5, ticks: { font: { size: 10 }, color: "#94a3b8" }, grid: { color: "#f1f5f9" } },
                        },
                      }}
                      plugins={[
                        {
                          id: "riskQuadrants",
                          beforeDraw(chart) {
                            const { ctx, chartArea, scales } = chart;
                            if (!chartArea) return;
                            const xMid = scales.x.getPixelForValue(75);
                            const yMid = scales.y.getPixelForValue(3.5);
                            ctx.save();
                            ctx.font = "10px sans-serif";
                            ctx.fillStyle = "rgba(148,163,184,0.55)";
                            ctx.fillText("ENGAGEMENT RISK", chartArea.left + 6, chartArea.top + 12);
                            ctx.textAlign = "right";
                            ctx.fillText("HEALTHY", chartArea.right - 6, chartArea.top + 12);
                            ctx.textAlign = "left";
                            ctx.fillText("CRITICAL ATTENTION", chartArea.left + 6, chartArea.bottom - 6);
                            ctx.textAlign = "right";
                            ctx.fillText("QUALITY RISK", chartArea.right - 6, chartArea.bottom - 6);
                            ctx.strokeStyle = "rgba(226,232,240,0.9)";
                            ctx.setLineDash([4, 4]);
                            ctx.beginPath();
                            ctx.moveTo(xMid, chartArea.top); ctx.lineTo(xMid, chartArea.bottom);
                            ctx.moveTo(chartArea.left, yMid); ctx.lineTo(chartArea.right, yMid);
                            ctx.stroke();
                            ctx.restore();
                          },
                        },
                      ]}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="card">
              <SectionTitle icon={ClipboardList} iconColor="#f59e0b" title="Operational Compliance" sub="Only metrics with real underlying data are shown" />
              <OpBar
                label="Recording Compliance"
                pct={opCompliance ? opCompliance.recordingPct : null}
                note={opCompliance?.current && opCompliance?.previous ? `${opCompliance.current.recordingPct}% now vs ${opCompliance.previous.recordingPct}% prior 30 days` : (opCompliance ? `${opCompliance.n} completed sessions` : undefined)}
              />
              <OpBar
                label="Report Completion"
                pct={opCompliance ? opCompliance.reportPct : null}
                note={opCompliance?.current && opCompliance?.previous ? `${opCompliance.current.reportPct}% now vs ${opCompliance.previous.reportPct}% prior 30 days` : (opCompliance ? `${opCompliance.n} completed sessions` : undefined)}
              />
              <OpBar label="Session Start Compliance" pct={null} note="Not tracked in the current data model" />
              <OpBar label="Resource Upload" pct={null} note="Not tracked in the current data model" />
              <OpBar label="SLA Adherence" pct={null} note="Not tracked in the current data model" />
            </div>
          </div>

          {/* Recording Health + Report Health */}
          <div className="grid-2a" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="card">
              <SectionTitle icon={Video} iconColor="#16a34a" title="Recording Health" sub="Completed sessions only" />
              {!recordingHealth ? (
                <div className="empty-state" style={{ padding: "20px 0" }}>No data yet.</div>
              ) : (
                <div className="health-row-wide">
                  <div style={{ position: "relative", width: "110px", flexShrink: 0 }}>
                    <Doughnut
                      data={{ labels: ["Available", "Missing"], datasets: [{ data: [recordingHealth.available, recordingHealth.notAvailable], backgroundColor: ["#22c55e", "#94a3b8"], borderWidth: 0 }] }}
                      options={{ plugins: { legend: { display: false } }, cutout: "70%" }}
                    />
                    <div className="health-center" style={{ fontSize: "16px" }}>{recordingHealth.total}<br /><span>Sessions</span></div>
                  </div>
                  <div className="health-legend">
                    <div><span className="legend-dot" style={{ background: "#22c55e" }} /> Available <b>{recordingHealth.available}</b></div>
                    <div><span className="legend-dot" style={{ background: "#94a3b8" }} /> Missing <b>{recordingHealth.notAvailable}</b></div>
                  </div>
                </div>
              )}
            </div>

            <div className="card">
              <SectionTitle icon={FileText} iconColor="#2563eb" title="Report Health" sub="Completed sessions only" />
              {!reportHealth ? (
                <div className="empty-state" style={{ padding: "20px 0" }}>No data yet.</div>
              ) : (
                <div className="health-row-wide">
                  <div style={{ position: "relative", width: "110px", flexShrink: 0 }}>
                    <Doughnut
                      data={{ labels: ["Pending", "Submitted", "Reviewed"], datasets: [{ data: [reportHealth.pending, reportHealth.submitted, reportHealth.reviewed], backgroundColor: ["#f59e0b", "#3b82f6", "#22c55e"], borderWidth: 0 }] }}
                      options={{ plugins: { legend: { display: false } }, cutout: "70%" }}
                    />
                    <div className="health-center" style={{ fontSize: "16px" }}>{reportHealth.total}<br /><span>Sessions</span></div>
                  </div>
                  <div className="health-legend">
                    <div><span className="legend-dot" style={{ background: "#f59e0b" }} /> Pending <b>{reportHealth.pending}</b></div>
                    <div><span className="legend-dot" style={{ background: "#3b82f6" }} /> Submitted <b>{reportHealth.submitted}</b></div>
                    <div><span className="legend-dot" style={{ background: "#22c55e" }} /> Reviewed <b>{reportHealth.reviewed}</b></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Critical Operational Items */}
          <div className="card" style={{ marginTop: "16px" }}>
            <SectionTitle icon={AlertTriangle} iconColor="#b91c1c" title="Critical Operational Items" sub="Completed sessions with a missing recording or a pending report" />
            {criticalOperationalItems.length === 0 ? (
              <div className="empty-state" style={{ padding: "16px 0" }}>No critical operational items right now.</div>
            ) : (
              <div className="table-wrap">
                <table className="styled-table matrix-table">
                  <thead><tr><th>Session</th><th>Mentor</th><th>Batch</th><th>Date</th><th>Issue</th><th>Age</th><th>Status</th></tr></thead>
                  <tbody>
                    {criticalOperationalItems.slice(0, 10).map((r) => (
                      <tr key={r.id} style={{ cursor: "pointer" }} onClick={() => setDrawerSession(r)}>
                        <td className="strong">#{r.id} {r.topic}</td>
                        <td className="muted">{r.mentor_name || "—"}</td>
                        <td className="muted">{r.batch_name || "—"}</td>
                        <td className="muted">{fmtDateTime(r.session_date, r.session_time).date}</td>
                        <td className="muted">{r.issue}</td>
                        <td className="muted">{r.age !== null ? `${r.age}d` : "—"}</td>
                        <td><Badge label={r.status} styles={STATUS_STYLES} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {criticalOperationalItems.length > 10 && <div className="attention-more">+{criticalOperationalItems.length - 10} more</div>}
              </div>
            )}
          </div>

          {/* Cancellation Intelligence */}
          <div className="card" style={{ marginTop: "16px" }}>
            <SectionTitle icon={CircleSlash} iconColor="#b91c1c" title="Session Cancellation Intelligence" sub="Cancellation and rescheduling patterns across all sessions" />
            <div className="mini-kpi-grid" style={{ marginBottom: "16px" }}>
              <div className="mini-kpi"><div className="mini-kpi-val">{cancellation.total}</div><div className="mini-kpi-label">Total Cancelled</div></div>
              <div className="mini-kpi"><div className="mini-kpi-val">{cancellation.rate}%</div><div className="mini-kpi-label">Cancellation Rate</div></div>
              <div className="mini-kpi"><div className="mini-kpi-val">{cancellation.rescheduled}</div><div className="mini-kpi-label">Rescheduled</div></div>
              <div className="mini-kpi"><div className="mini-kpi-val">{cancellation.learnersImpacted}</div><div className="mini-kpi-label">Learners Impacted</div></div>
            </div>
            {cancellation.total === 0 ? (
              <div className="empty-state" style={{ padding: "10px 0" }}>No cancellations in the selected range.</div>
            ) : (
              <>
                <div style={{ height: "150px" }}>
                  <Chart
                    type="bar"
                    data={{ labels: cancellation.trendLabels, datasets: [{ type: "bar", label: "Cancellations", data: cancellation.trend, backgroundColor: "#ef4444", borderRadius: 4, barThickness: 16 }] }}
                    options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { font: { size: 9.5 }, color: "#94a3b8" }, grid: { display: false } }, y: { beginAtZero: true, ticks: { precision: 0, font: { size: 10 }, color: "#94a3b8" }, grid: { color: "#f1f5f9" } } } }}
                  />
                </div>
                <div className="insights-list" style={{ marginTop: "12px" }}>
                  {cancellation.topMentor && <div>Most cancellations by mentor: <b>{cancellation.topMentor[0]}</b> ({cancellation.topMentor[1]})</div>}
                  {cancellation.topBatch && <div>Most cancellations by batch: <b>{cancellation.topBatch[0]}</b> ({cancellation.topBatch[1]})</div>}
                  {cancellation.topCourse && <div>Most cancellations by course: <b>{cancellation.topCourse[0]}</b> ({cancellation.topCourse[1]})</div>}
                </div>
              </>
            )}
          </div>

          {/* Requires Attention (sessions) + At-Risk Batches */}
          <div className="grid-2a">
            <div className="card">
              <SectionTitle icon={AlertTriangle} iconColor="#f59e0b" title="Sessions Requiring Attention" sub="Rule-based on attendance, rating, recording and report compliance" />
              {health.flagged.length === 0 ? (
                <div className="empty-state" style={{ padding: "16px 0" }}>Nothing needs attention right now.</div>
              ) : (
                <div className="table-wrap">
                  <table className="styled-table matrix-table">
                    <thead><tr><th>Session</th><th>Mentor</th><th>Batch</th><th>Date</th><th>Issue</th><th>Priority</th></tr></thead>
                    <tbody>
                      {health.flagged.slice(0, 8).map((r) => (
                        <tr key={r.id} style={{ cursor: "pointer" }} onClick={() => setDrawerSession(r)}>
                          <td className="strong">#{r.id} {r.topic}</td>
                          <td className="muted">{r.mentor_name || "—"}</td>
                          <td className="muted">{r.batch_name || "—"}</td>
                          <td className="muted">{fmtDateTime(r.session_date, r.session_time).date}</td>
                          <td className="muted">{r.reason}</td>
                          <td><Badge label={r.tier === "attention" ? "Critical" : "Watch"} styles={RISK_STYLES} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {health.flagged.length > 8 && <div className="attention-more">+{health.flagged.length - 8} more</div>}
                </div>
              )}
            </div>

            <div className="card">
              <SectionTitle icon={Layers} iconColor="#b45309" title="Batches Requiring Attention" sub="Batches flagged Watch or Critical" />
              {atRiskBatches.length === 0 ? (
                <div className="empty-state" style={{ padding: "16px 0" }}>No batches currently at risk.</div>
              ) : (
                <div className="table-wrap">
                  <table className="styled-table matrix-table">
                    <thead><tr><th>Batch</th><th>Attendance</th><th>Rating</th><th>Compliance</th><th>Sessions</th><th>Risk</th><th>Trend</th><th></th></tr></thead>
                    <tbody>
                      {atRiskBatches.map((b) => (
                        <tr key={b.name}>
                          <td className="strong">{b.name}</td>
                          <td className="muted">{b.avgAttendance !== null ? `${b.avgAttendance}%` : "N/A"}</td>
                          <td className="muted">{b.avgRating !== null ? `★ ${b.avgRating}` : "N/A"}</td>
                          <td className="muted">{b.recordingPct !== null && b.reportPct !== null ? `${Math.round((b.recordingPct + b.reportPct) / 2)}%` : "N/A"}</td>
                          <td className="muted">{b.sessions}</td>
                          <td><Badge label={b.risk} styles={RISK_STYLES} /></td>
                          <td><TrendArrow trend={b.trend} /></td>
                          <td><button className="btn-view-details" onClick={() => viewBatch(b.name)}>View Batch</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Operational Signals */}
          <div className="card" style={{ marginTop: "16px" }}>
            <SectionTitle icon={Activity} iconColor="#0891b2" title="Operational Signals" sub="Last 30 days vs prior 30 days" />
            {!signals ? (
              <div className="empty-state" style={{ padding: "16px 0" }}>Not enough historical data yet to compute period-over-period signals.</div>
            ) : (
              <div className="signals-grid">
                {[
                  {
                    metric: "Attendance", current: signals.current.avgAttendance, previous: signals.previous.avgAttendance,
                    change: signals.attendanceDelta, suffix: "%", sample: signals.current.count, invert: false,
                  },
                  {
                    metric: "Rating", current: signals.current.avgRating, previous: signals.previous.avgRating,
                    change: signals.ratingDelta, suffix: "", sample: signals.current.count, invert: false,
                  },
                  {
                    metric: "Cancellation Rate", current: signals.current.cancelRate, previous: signals.previous.cancelRate,
                    change: signals.cancelDelta, suffix: "%", sample: signals.current.count, invert: true,
                  },
                  ...(opCompliance?.current && opCompliance?.previous ? [{
                    metric: "Recording Compliance", current: opCompliance.current.recordingPct, previous: opCompliance.previous.recordingPct,
                    change: opCompliance.current.recordingPct - opCompliance.previous.recordingPct, suffix: "%", sample: opCompliance.current.n, invert: false,
                  }, {
                    metric: "Report Completion", current: opCompliance.current.reportPct, previous: opCompliance.previous.reportPct,
                    change: opCompliance.current.reportPct - opCompliance.previous.reportPct, suffix: "%", sample: opCompliance.current.n, invert: false,
                  }] : []),
                ].map((s) => {
                  const declining = s.change !== null && (s.invert ? s.change > 0 : s.change < 0);
                  return (
                    <div key={s.metric} className="signal-card">
                      <div className="signal-label">{s.metric}</div>
                      <div className="signal-val">{s.current !== null ? `${s.current}${s.suffix}` : "N/A"}</div>
                      <TrendPill value={s.change} invert={s.invert} suffix={s.suffix === "%" ? " pts" : ""} />
                      <div className="signal-meta">Previous: {s.previous !== null ? `${s.previous}${s.suffix}` : "N/A"} · Sample: {s.sample} sessions</div>
                      {declining && <div className="signal-investigate">⚠ Investigate — potential signal, not a confirmed cause</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action Center */}
          <div className="card" style={{ marginTop: "16px" }}>
            <SectionTitle icon={Sparkles} iconColor="#a855f7" title="Session Operations Action Center" sub="Rule-based, evidence-backed recommendations from real data" />
            {actionItems.length === 0 ? (
              <div className="empty-state" style={{ padding: "16px 0" }}>No operational issues detected right now.</div>
            ) : (
              <div className="action-grid">
                {actionItems.map((a, i) => (
                  <div key={i} className="action-card">
                    <div className="action-card-top">
                      <span className="action-issue">{a.issue}</span>
                      <Badge label={a.priority} styles={{ High: RISK_STYLES.Critical, Medium: RISK_STYLES.Watch, Low: RISK_STYLES.Good }} />
                    </div>
                    <div className="action-row"><span className="action-key">Evidence</span>{a.evidence}</div>
                    <div className="action-row"><span className="action-key">Affected</span>{a.affected}</div>
                    <div className="action-row"><span className="action-key">Metric</span>{a.metric}</div>
                    {a.recommendation && <div className="action-row"><span className="action-key">Investigate</span>{a.recommendation}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Session Explorer + side column */}
          <div className="grid-table-side" style={{ marginTop: "16px" }} id="session-explorer">
            <div className="card">
              <div className="list-toolbar">
                <div>
                  <h2 className="card-title" style={{ margin: 0 }}>Session Explorer</h2>
                  <div className="card-sub">Search and analyze individual sessions</div>
                </div>
                <div className="search-wrap">
                  <Search size={14} strokeWidth={2.3} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search sessions, topics, mentors, batches…"
                    value={search}
                    onChange={(e) => { setPage(1); setSearch(e.target.value); }}
                    className="search-input"
                    style={inputStyle}
                  />
                </div>
              </div>

              {error && <div className="error-state">{error}</div>}

              {loading ? (
                <div className="skeleton-wrap">
                  {[...Array(5)].map((_, i) => <div key={i} className="skeleton-row" />)}
                </div>
              ) : (
                <div className="table-wrap">
                  <table className="styled-table explorer-table">
                    <thead>
                      <tr>
                        <th onClick={() => toggleSort("id")} className="sortable">Session{sortIndicator("id")}</th>
                        <th onClick={() => toggleSort("session_date")} className="sortable">Date &amp; Time{sortIndicator("session_date")}</th>
                        <th>Mentor</th>
                        <th>Batch / Course</th>
                        <th>Type / Duration</th>
                        <th>Status</th>
                        <th>Attendance</th>
                        <th>Rating</th>
                        <th>Recording</th>
                        <th>Report</th>
                        <th>SLA</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r, i) => {
                        const dt = fmtDateTime(r.session_date, r.session_time);
                        return (
                          <tr key={r.id} style={{ animationDelay: `${i * 0.02}s` }}>
                            <td>
                              <div className="strong">#{r.id}</div>
                              <div className="muted-sm">{r.topic}</div>
                            </td>
                            <td>
                              <div>{dt.date}</div>
                              <div className="muted-sm">{dt.time}</div>
                            </td>
                            <td>{r.mentor_name || "—"}</td>
                            <td>
                              <div>{r.batch_name || "—"}</div>
                              <div className="muted-sm">{r.course_name || "—"}</div>
                            </td>
                            <td>
                              <div style={{ color: "#94a3b8" }}>{r.session_type || "—"}</div>
                              <div className="muted-sm">{r.duration ? `${r.duration} min` : "—"}</div>
                            </td>
                            <td><Badge label={r.status} styles={STATUS_STYLES} /></td>
                            <td>
                              <div className="attendance-cell">
                                <span>
                                  {r.attendance_percentage}%
                                  <span className="muted-sm"> · {r.attendance} / {r.learner_count || 0}</span>
                                </span>
                                <div className="attendance-track"><div className="attendance-fill" style={{ width: `${Math.min(100, r.attendance_percentage || 0)}%` }} /></div>
                              </div>
                            </td>
                            <td className="muted">{r.rating ? `★ ${r.rating}` : "—"}</td>
                            <td><Badge label={r.recording_status} styles={RECORDING_STYLES} /></td>
                            <td><Badge label={r.report_status} styles={REPORT_STYLES} /></td>
                            <td className="muted">N/A</td>
                            <td>
                              <div className="actions-cell">
                                <button className="btn-view-details" onClick={() => setDrawerSession(r)}>View Details</button>
                                <button
                                  className="btn-icon-only"
                                  onClick={(e) => {
                                    if (rowMenu && rowMenu.id === r.id) { setRowMenu(null); return; }
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setRowMenu({ id: r.id, top: rect.bottom + 6, left: rect.right - 180 });
                                  }}
                                >
                                  <MoreVertical size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {rows.length === 0 && (
                    <div className="empty-state">
                      <div style={{ fontSize: "32px", marginBottom: "8px" }}>📋</div>
                      {total === 0 ? "No session reports match the selected filters." : "No results on this page."}
                      {total === 0 && appliedFilterCount > 0 && (
                        <div style={{ marginTop: "14px" }}>
                          <button className="btn btn-ghost" onClick={clearFilters}>Clear Filters</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {!loading && total > 0 && (
                <div className="pagination">
                  <button className="btn btn-ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
                  <span className="page-info">Page {page} of {totalPages} · {total} total</span>
                  <button className="btn btn-ghost" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next →</button>
                </div>
              )}
            </div>

            <div className="side-col">
              <div className="card">
                <h3 className="card-title" style={{ margin: "0 0 12px", fontSize: "14.5px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Sparkles size={15} color="#a855f7" /> Quick Insights
                </h3>
                {!insights ? (
                  <div className="empty-state" style={{ padding: "16px 0", fontSize: "12.5px" }}>No data yet.</div>
                ) : (
                  <ul className="insights-list">
                    <li>{summary?.average_attendance_percentage ?? 0}% average attendance across all sessions</li>
                    <li>{summary?.average_rating ? `${summary.average_rating}/5 average session rating` : "Average rating not available yet"}</li>
                    <li>{summary?.average_session_duration ?? 0} minutes average session duration</li>
                    <li>{summary?.total_learners_attended ?? 0} total learners attended</li>
                    {insights.mostActiveMentor && <li>Most active mentor: {insights.mostActiveMentor[0]} ({insights.mostActiveMentor[1]} sessions)</li>}
                    {insights.topBatch && <li>{insights.topBatch[0]} has the highest attendance ({insights.topBatch[1]}%)</li>}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>

        {exportMenu && (
          <div className="export-menu" style={{ position: "fixed", top: exportMenu.top, left: exportMenu.left }}>
            <a href={exportAllUrl} className="export-item" onClick={() => setExportMenu(null)}>Export CSV (all)</a>
            <a href={exportUrl} className="export-item" onClick={() => setExportMenu(null)}>Export Filtered Data (CSV)</a>
            <a href={exportPdfUrl} className="export-item" target="_blank" rel="noreferrer" onClick={() => setExportMenu(null)}>Export PDF</a>
          </div>
        )}

        {rowMenu && (
          <div className="row-menu" style={{ position: "fixed", top: rowMenu.top, left: rowMenu.left }}>
            <Link href={`/session-reports/${rowMenu.id}`} className="row-menu-item" onClick={() => setRowMenu(null)}>
              <FileText size={13} /> View Report
            </Link>
            <Link href="/sessions" className="row-menu-item" onClick={() => setRowMenu(null)}>
              <ExternalLink size={13} /> Open Session
            </Link>
            <a className="row-menu-item" href={`${API}/session-reports/${rowMenu.id}/download`} target="_blank" rel="noreferrer" onClick={() => setRowMenu(null)}>
              <Download size={13} /> Download PDF
            </a>
          </div>
        )}

        {drawerSession && <SessionDrawer session={drawerSession} onClose={() => setDrawerSession(null)} />}

        <style jsx>{`
          .page-hero {
            position: relative;
            overflow: hidden;
            border-radius: 18px;
            padding: 30px 32px;
            margin-bottom: 20px;
            background: linear-gradient(120deg, #0f172a 0%, #1e293b 60%, #0f172a 100%);
            background-size: 200% 200%;
            animation: heroShift 12s ease infinite;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            box-shadow: 0 16px 32px -18px rgba(15, 23, 42, 0.55);
          }
          .page-hero-blob {
            position: absolute;
            width: 220px;
            height: 220px;
            border-radius: 50%;
            background: #3b82f6;
            filter: blur(60px);
            opacity: 0.3;
            top: -80px;
            right: 160px;
            animation: float 9s ease-in-out infinite;
          }
          .page-hero-content { position: relative; z-index: 1; }
          .page-hero-eyebrow {
            display: inline-block;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: #fbbf24;
            background: rgba(251, 191, 36, 0.12);
            border: 1px solid rgba(251, 191, 36, 0.3);
            padding: 5px 10px;
            border-radius: 999px;
            margin-bottom: 10px;
          }
          .page-hero-title { font-size: 26px; font-weight: 800; color: #f8fafc; margin: 0 0 6px; }
          .page-hero-subtitle { color: #94a3b8; font-size: 14px; margin: 0 0 8px; max-width: 520px; }
          .page-hero-meta { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #cbd5e1; font-weight: 600; }
          .page-hero-updated { color: #64748b; font-weight: 500; }
          .live-dot { width: 7px; height: 7px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 0 3px rgba(34,197,94,0.2); display: inline-block; }

          .export-wrap { position: relative; z-index: 2; }
          .export-menu {
            background: #fff; border-radius: 10px;
            box-shadow: 0 16px 30px -14px rgba(0,0,0,0.35); padding: 6px; min-width: 210px; z-index: 200;
          }
          :global(.export-item) {
            display: block; padding: 9px 10px; font-size: 13px; font-weight: 600; color: #1e293b;
            text-decoration: none; border-radius: 7px;
          }
          :global(.export-item:hover) { background: #f1f5f9; }


          .kpi-section-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 10px; }
          .kpi-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
            gap: 12px;
          }
          .kpi-skel { height: 68px; border-radius: 12px; background: linear-gradient(90deg, #e2e8f0 25%, #edf1f5 50%, #e2e8f0 75%); background-size: 200% 100%; animation: shimmerSkeleton 1.4s ease infinite; }

          .grid-2a { display: grid; grid-template-columns: 1.6fr 1fr; gap: 16px; margin-top: 16px; }
          .grid-table-side { display: grid; grid-template-columns: minmax(0, 1fr); gap: 16px; margin-top: 20px; align-items: start; }
          .side-col { display: flex; flex-direction: column; }

          .card {
            background: #ffffff;
            border-radius: 16px;
            padding: 22px 24px;
            box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
            border: 1px solid #eef2f7;
          }
          :global(.card-title) { margin: 0 0 4px; font-size: 16px; color: #1e293b; }
          :global(.card-sub) { font-size: 12px; color: #94a3b8; }
          .card-note { font-size: 11px; color: #94a3b8; margin-top: 10px; font-style: italic; }

          .range-toggle { display: flex; gap: 2px; background: #f1f5f9; border-radius: 8px; padding: 3px; flex-shrink: 0; }
          .range-btn { border: none; background: none; padding: 5px 9px; font-size: 11px; font-weight: 700; color: #64748b; border-radius: 6px; cursor: pointer; }
          .range-btn-active { background: #fff; color: #0f172a; box-shadow: 0 1px 3px rgba(15,23,42,0.15); }
          :global(.card-header-row) { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 16px; }

          .health-row { display: flex; align-items: center; gap: 18px; }
          .health-row-wide { display: flex; align-items: center; gap: 28px; flex-wrap: wrap; }
          .health-center {
            position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;
            font-size: 20px; font-weight: 800; color: #0f172a; text-align: center; pointer-events: none;
          }
          .health-center span { font-size: 9px; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
          .health-legend { display: flex; flex-direction: column; gap: 8px; font-size: 12.5px; color: #475569; font-weight: 600; }
          .health-legend b { color: #0f172a; margin-left: 4px; }
          .legend-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 6px; }

          .filter-count-chip { background: #fef3c7; color: #b45309; font-size: 11.5px; font-weight: 700; padding: 5px 10px; border-radius: 999px; white-space: nowrap; flex-shrink: 0; }

          .filters-card { margin-top: 0; margin-bottom: 20px; padding: 14px 18px; }
          .fbar { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 12px; }
          .fbar-more { margin-top: 12px; padding-top: 12px; border-top: 1px dashed #e2e8f0; }
          .fbar-field { flex: 1 1 130px; min-width: 130px; max-width: 200px; }
          .fbar-actions { display: flex; gap: 8px; margin-left: auto; flex-wrap: wrap; }
          .fbar-count { display: inline-block; margin-top: 10px; }

          .field-label {
            display: block;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.03em;
            text-transform: uppercase;
            color: #64748b;
            margin-bottom: 6px;
          }

          .btn { border: none; border-radius: 10px; padding: 10px 18px; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.15s ease; display: inline-flex; align-items: center; gap: 6px; }
          .btn:disabled { opacity: 0.45; cursor: not-allowed; }
          .btn-primary { background: linear-gradient(120deg, #f59e0b, #fbbf24); color: #0f172a; box-shadow: 0 6px 16px -6px rgba(245, 158, 11, 0.6); }
          .btn-primary:hover { transform: translateY(-1px); }
          .btn-ghost { background: #f1f5f9; color: #475569; }
          .btn-ghost:hover:not(:disabled) { background: #e2e8f0; }
          .btn-export { background: #16a34a; color: white; display: inline-flex; align-items: center; gap: 6px; }
          .btn-export:hover { background: #15803d; transform: translateY(-1px); }

          .list-toolbar { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 14px; margin-bottom: 18px; }
          .search-wrap { position: relative; }
          .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); opacity: 0.45; }
          .search-input { width: 280px; padding-left: 32px !important; }

          .table-wrap { overflow-x: auto; }
          .styled-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 1750px; }
          .styled-table.matrix-table { min-width: 760px; }
          /* Session Explorer: 12 compact columns that fit the card width; only very narrow screens scroll. */
          .styled-table.explorer-table { min-width: 980px; table-layout: auto; }
          .explorer-table thead th { padding: 10px 8px; font-size: 10.5px; }
          .explorer-table td { padding: 10px 8px; white-space: normal; word-break: break-word; vertical-align: middle; }
          .explorer-table td .muted-sm { white-space: normal; }
          .explorer-table .attendance-cell { min-width: 84px; }
          .explorer-table .actions-cell { flex-wrap: nowrap; }
          .styled-table thead th {
            text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em;
            color: #94a3b8; font-weight: 700; padding: 10px 12px; border-bottom: 2px solid #f1f5f9; white-space: nowrap;
          }
          .styled-table thead th.sortable { cursor: pointer; user-select: none; }
          .styled-table thead th.sortable:hover { color: #475569; }
          .styled-table tbody tr { animation: fadeSlideUp 0.3s ease both; transition: background 0.12s ease; }
          .styled-table tbody tr:hover { background: #fafaf9; }
          .styled-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #1e293b; white-space: nowrap; }
          .styled-table td.muted { color: #94a3b8; }
          .styled-table td .strong { font-weight: 700; }
          .styled-table td .muted-sm { color: #94a3b8; font-size: 11px; margin-top: 2px; }

          .attendance-cell { display: flex; flex-direction: column; gap: 4px; min-width: 70px; }
          .attendance-track { height: 5px; background: #f1f5f9; border-radius: 999px; overflow: hidden; }
          .attendance-fill { height: 100%; background: linear-gradient(90deg, #22c55e, #4ade80); border-radius: 999px; }

          .actions-cell { display: flex; align-items: center; gap: 6px; }
          .btn-view-details {
            background: #0f172a; color: #fff; border: none; padding: 7px 12px; font-size: 11.5px; font-weight: 700;
            border-radius: 8px; cursor: pointer; white-space: nowrap;
          }
          .btn-view-details:hover { background: #1e293b; }
          .btn-icon-only { background: #f1f5f9; border: none; width: 28px; height: 28px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #475569; }
          .btn-icon-only:hover { background: #e2e8f0; }
          .row-menu { background: #fff; border-radius: 10px; box-shadow: 0 16px 30px -14px rgba(0,0,0,0.35); padding: 6px; min-width: 170px; z-index: 200; }
          :global(.row-menu-item) {
            display: flex; align-items: center; gap: 8px; padding: 8px 9px; font-size: 12.5px; font-weight: 600; color: #1e293b;
            text-decoration: none; border-radius: 7px; border: none; background: none; width: 100%; box-sizing: border-box; cursor: pointer; text-align: left;
          }
          :global(.row-menu-item:hover) { background: #f1f5f9; }

          .attention-list { display: flex; flex-direction: column; gap: 4px; }
          .attention-item { display: flex; gap: 9px; align-items: center; padding: 9px 6px; border-radius: 8px; cursor: pointer; }
          .attention-item:hover { background: #f8fafc; }
          .attention-dot { width: 7px; height: 7px; border-radius: 50%; margin-top: 0; flex-shrink: 0; }
          .attention-dot-red { background: #ef4444; }
          .attention-dot-amber { background: #f59e0b; }
          .attention-reason { font-size: 12.5px; font-weight: 700; color: #1e293b; }
          .attention-sub { font-size: 11px; color: #94a3b8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .attention-more { font-size: 11.5px; color: #94a3b8; padding: 6px; font-weight: 600; }

          .insights-list { margin: 0; padding-left: 18px; font-size: 12.5px; color: #334155; line-height: 1.9; columns: 3 260px; column-gap: 32px; }

          .mini-kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 12px; }
          .mini-kpi { background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 10px; padding: 10px 12px; text-align: center; }
          .mini-kpi-val { font-size: 19px; font-weight: 800; color: #0f172a; font-variant-numeric: tabular-nums; }
          .mini-kpi-label { font-size: 10.5px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.03em; margin-top: 2px; }

          .attendance-intel-row { display: grid; grid-template-columns: 1.2fr 1fr; gap: 24px; align-items: center; }
          .attendance-dist { display: flex; flex-direction: column; gap: 6px; }
          .dist-row { display: flex; justify-content: space-between; font-size: 12px; font-weight: 700; color: #334155; }
          .dist-label { display: flex; align-items: center; }
          .dist-track { height: 6px; background: #f1f5f9; border-radius: 999px; overflow: hidden; margin-bottom: 4px; }
          .dist-fill { height: 100%; border-radius: 999px; }

          .signals-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; }
          .signal-card { background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 12px; padding: 14px 16px; }
          .signal-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; color: #94a3b8; margin-bottom: 6px; }
          .signal-val { font-size: 22px; font-weight: 800; color: #0f172a; margin-bottom: 8px; font-variant-numeric: tabular-nums; }
          .signal-meta { font-size: 10.5px; color: #94a3b8; margin-top: 8px; }
          .signal-investigate { font-size: 10.5px; color: #b45309; font-weight: 700; margin-top: 6px; }

          .action-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 14px; }
          .action-card { background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 12px; padding: 14px 16px; }
          .action-card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; margin-bottom: 10px; }
          .action-issue { font-size: 13.5px; font-weight: 800; color: #0f172a; }
          .action-row { font-size: 12px; color: #475569; margin-bottom: 4px; line-height: 1.5; }
          .action-key { display: inline-block; min-width: 62px; font-weight: 700; color: #94a3b8; text-transform: uppercase; font-size: 10px; letter-spacing: 0.03em; margin-right: 4px; }

          .empty-state, .error-state { text-align: center; padding: 50px 20px; color: #94a3b8; font-size: 14px; }
          .error-state { color: #b91c1c; }

          .skeleton-wrap { display: flex; flex-direction: column; gap: 10px; }
          .skeleton-row { height: 40px; border-radius: 8px; background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%); background-size: 200% 100%; animation: shimmerSkeleton 1.4s ease infinite; }

          .pagination { display: flex; align-items: center; justify-content: center; gap: 16px; margin-top: 20px; }
          .page-info { font-size: 13px; color: #64748b; font-weight: 600; }

          @keyframes heroShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
          @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(16px); } }
          @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes shimmerSkeleton { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

          @media (max-width: 1300px) {
            .grid-2a { grid-template-columns: 1fr; }
            .grid-table-side { grid-template-columns: 1fr; }
            .attendance-intel-row { grid-template-columns: 1fr; }
          }
        `}</style>
      </>
    </ProtectedRoute>
  );
}
