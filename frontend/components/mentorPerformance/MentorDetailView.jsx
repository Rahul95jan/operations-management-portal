import { Fragment, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Head from "next/head";
import Sidebar from "../Sidebar";
import ProtectedRoute from "../ProtectedRoute";
import BusinessScoreBadge, { RiskBadge } from "./BusinessScoreBadge";
import PerformanceMatrix from "./PerformanceMatrix";
import TrendChartCard from "../resources/analytics/TrendChartCard";
import BarChartCard from "../resources/analytics/BarChartCard";
import DimensionRadar from "./DimensionRadar";
import {
  Search,
  ChevronDown,
  Star,
  Users,
  Percent,
  Timer,
  CalendarClock,
  AlertTriangle,
  Sparkles,
  Bell,
  RefreshCw,
  ListFilter,
  FileText,
  ExternalLink,
  Download,
  MoreVertical,
  Check,
  Mail,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Meh,
  BarChart2,
  PieChart as PieChartIcon,
  GraduationCap,
  BookOpen,
  Settings as SettingsIcon,
  SlidersHorizontal,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const TABS = ["Overview", "Sessions", "NPS & Feedback", "Batches", "Attendance", "Quality", "Operations", "Reports"];
const TREND_RANGE_LABELS = { 7: "7 Days", 30: "30 Days", 90: "3 Months", 180: "6 Months" };

// Frontend-only, clearly configurable thresholds — no backend logic touched.
const ATTENDANCE_THRESHOLDS = { high: 90, medium: 75 };
const HEALTH_THRESHOLDS = { lowAttendancePct: 70, lowRating: 3.5 };

const STATUS_STYLES = {
  Upcoming: { bg: "#e0e7ff", color: "#4338ca", dot: "#6366f1" },
  Scheduled: { bg: "#dbeafe", color: "#1d4ed8", dot: "#3b82f6" },
  Live: { bg: "#fee2e2", color: "#b91c1c", dot: "#ef4444" },
  Completed: { bg: "#dcfce7", color: "#15803d", dot: "#22c55e" },
  Cancelled: { bg: "#f1f5f9", color: "#475569", dot: "#94a3b8" },
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

function Badge({ label, styles }) {
  const s = styles[label] || { bg: "#e2e8f0", color: "#475569", dot: "#94a3b8" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: s.bg, color: s.color, fontSize: "11.5px", fontWeight: 700, padding: "3px 9px", borderRadius: "999px", whiteSpace: "nowrap" }}>
      {s.dot && <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: s.dot }} />}
      {label || "—"}
    </span>
  );
}

function StarRow({ value, max = 5, size = 14 }) {
  if (!value) return <span style={{ color: "#94a3b8", fontSize: "12.5px" }}>Not Available</span>;
  const rounded = Math.round(value);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "2px" }}>
      {[...Array(max)].map((_, i) => (
        <Star key={i} size={size} fill={i < rounded ? "#f59e0b" : "none"} color="#f59e0b" strokeWidth={1.5} />
      ))}
    </span>
  );
}

const DOT_PALETTE = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#a855f7", "#06b6d4"];
function dotColor(i) {
  return DOT_PALETTE[i % DOT_PALETTE.length];
}

function initials(name) {
  if (!name) return "?";
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
}

function mentorPhotoUrl(mentor) {
  if (!mentor || !mentor.photo_path) return null;
  return `${API}/mentors/${mentor.id}/photo?v=${encodeURIComponent(mentor.photo_path)}`;
}

function userPhotoUrl(user) {
  if (!user || !user.photo_path) return null;
  return `${API}/users/${user.id}/photo?v=${encodeURIComponent(user.photo_path)}`;
}

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

function fmtDateTime(dateStr, timeStr) {
  if (!dateStr) return { date: "—", time: timeStr || "—" };
  const d = new Date(dateStr);
  const date = isNaN(d.getTime()) ? dateStr : d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
  return { date, time: timeStr || "—" };
}

function buildQuery(filters, keys) {
  const params = new URLSearchParams();
  keys.forEach((key) => {
    if (filters[key]) params.set(key, filters[key]);
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

function toQuery(params) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== "" && v !== null && v !== undefined) usp.set(k, v);
  });
  return usp.toString();
}

function DimensionCard({ title, value, unit = "%", children }) {
  return (
    <div className="dim-card">
      <div className="dim-title">{title}</div>
      <div className="dim-value">{value === null || value === undefined ? "N/A" : `${value}${typeof value === "number" ? unit : ""}`}</div>
      {children && <div className="dim-details">{children}</div>}
    </div>
  );
}

function SectionTitle({ icon: Icon, color = "#2563eb", title, sub }) {
  return (
    <div className="section-title-row">
      <span className="section-title-icon" style={{ background: `${color}1a`, color }}><Icon size={15} strokeWidth={2.2} /></span>
      <div>
        <h2 className="card-title" style={{ margin: 0 }}>{title}</h2>
        {sub && <div className="card-sub">{sub}</div>}
      </div>
      <style jsx>{`
        .section-title-row { display: flex; align-items: flex-start; gap: 10px; }
        .section-title-icon { width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
      `}</style>
    </div>
  );
}

function KPICard({ icon: Icon, label, value, sub, color = "#0f172a", trend }) {
  return (
    <div className="kpi-tile">
      <div className="kpi-icon" style={{ background: `${color}1a`, color }}>
        <Icon size={17} strokeWidth={2.2} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div className="kpi-value-row">
          <div className="kpi-value" style={{ color }}>{value}</div>
          {trend && (
            <span className={`kpi-trend ${trend.dir === "up" ? "kpi-trend-up" : "kpi-trend-down"}`}>
              {trend.dir === "up" ? "↑" : "↓"} {trend.text}
            </span>
          )}
        </div>
        <div className="kpi-label">{label}</div>
        {sub && <div className="kpi-sub">{sub}</div>}
      </div>
      <style jsx>{`
        .kpi-tile { background: #fff; border: 1px solid #eef2f7; border-left: 4px solid ${color}; padding: 14px 16px; border-radius: 12px; display: flex; gap: 12px; align-items: flex-start; box-shadow: 0 1px 3px rgba(15,23,42,0.06); }
        .kpi-icon { width: 34px; height: 34px; border-radius: 9px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .kpi-value-row { display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap; }
        .kpi-value { font-size: 21px; font-weight: 800; line-height: 1.1; }
        .kpi-trend { font-size: 10.5px; font-weight: 800; }
        .kpi-trend-up { color: #16a34a; }
        .kpi-trend-down { color: #dc2626; }
        .kpi-label { font-size: 11px; font-weight: 700; color: #64748b; margin-top: 3px; }
        .kpi-sub { font-size: 10.5px; color: #94a3b8; margin-top: 2px; }
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
              <DrawerField label="Batch" value={info?.batch_name || session.batch_name || "—"} />
              <DrawerField label="Course" value={info?.course_name || session.course_name || "—"} />
              <DrawerField label="Session Type" value={info?.session_type || session.session_type || "—"} />
              <DrawerField label="Status" value={<Badge label={info?.status || session.status} styles={STATUS_STYLES} />} />
            </div>

            <div className="drawer-section-title">Attendance</div>
            <div className="drawer-grid">
              <DrawerField label="Registered" value={session.learner_count} />
              <DrawerField label="Attended" value={session.attendance} />
              <DrawerField label="Attendance %" value={`${session.attendance_percentage}%`} />
            </div>

            <div className="drawer-section-title">Session Quality</div>
            <div className="drawer-grid">
              <DrawerField label="Session Rating" value={feedback?.average_rating ? `${feedback.average_rating} / 5` : "Not Available"} />
              <DrawerField label="Batch/Mentor NPS (avg)" value={feedback?.nps?.average_score ?? "Not Available"} />
            </div>
            {feedback?.nps?.note && <div className="drawer-note">ℹ️ {feedback.nps.note}</div>}

            <div className="drawer-section-title">Recording</div>
            <div className="drawer-grid">
              <DrawerField label="Recording Status" value={<Badge label={session.recording_status} styles={RECORDING_STYLES} />} />
              <DrawerField label="Recording Link" value={content?.recording_link ? <a href={content.recording_link} target="_blank" rel="noreferrer">Open Recording</a> : "Not Available"} />
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
        .drawer-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.45); z-index: 200; display: flex; justify-content: flex-end; animation: fadeIn 0.15s ease; }
        .drawer-panel { width: 440px; max-width: 92vw; height: 100vh; background: #fff; box-shadow: -12px 0 32px -12px rgba(0,0,0,0.35); display: flex; flex-direction: column; animation: slideInRight 0.2s ease; }
        .drawer-header { display: flex; align-items: flex-start; justify-content: space-between; padding: 20px 22px; border-bottom: 1px solid #f1f5f9; flex-shrink: 0; }
        .drawer-eyebrow { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 4px; }
        .drawer-title { margin: 0; font-size: 17px; color: #0f172a; max-width: 340px; }
        .drawer-close { background: #f1f5f9; border: none; border-radius: 8px; width: 30px; height: 30px; cursor: pointer; font-size: 13px; color: #475569; flex-shrink: 0; }
        .drawer-body { padding: 20px 22px; overflow-y: auto; }
        .drawer-loading { padding: 40px 22px; color: #94a3b8; font-size: 13px; }
        .drawer-section-title { font-size: 11.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: #0f172a; margin: 18px 0 10px; padding-bottom: 6px; border-bottom: 2px solid #fbbf24; }
        .drawer-section-title:first-child { margin-top: 0; }
        .drawer-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; }
        .drawer-note { font-size: 11px; color: #94a3b8; font-style: italic; margin: -6px 0 10px; }
        .drawer-actions { display: flex; flex-direction: column; gap: 8px; }
        :global(.drawer-btn) { display: block; text-align: center; text-decoration: none; background: #f8fafc; border: 1px solid #e2e8f0; color: #1e293b; font-weight: 700; font-size: 13px; padding: 10px; border-radius: 9px; cursor: pointer; }
        :global(.drawer-btn:hover) { background: #f1f5f9; }
        @keyframes slideInRight { from { transform: translateX(24px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
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

// Full Mentor 360 detail for one mentor. Rendered standalone by
// pages/mentor-performance/[mentor].js (with sidebar, hero and auth guard) and
// embedded (embedded=true) inside the main Mentor 360 page, where the page
// already supplies that chrome and the course/batch/date filters.
export default function MentorDetailView({ mentorName, filters: scope = {}, embedded = false }) {
  const { course_name, batch_name, date_from, date_to } = scope;

  const [filters, setFilters] = useState({ course_name: "", batch_name: "", date_from: "", date_to: "" });
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [mentorData, setMentorData] = useState(null);
  const [trend, setTrend] = useState(null);
  const [peers, setPeers] = useState([]);
  const [webinarStats, setWebinarStats] = useState(null);

  const [mentorsList, setMentorsList] = useState([]);
  const [profileOpen, setProfileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Overview");
  const [trendRangeDays, setTrendRangeDays] = useState(30);
  const [trendRangeOpen, setTrendRangeOpen] = useState(false);
  const [trendCustomRange, setTrendCustomRange] = useState({ from: "", to: "" });

  const [sessionRows, setSessionRows] = useState([]);
  const [sessionSummary, setSessionSummary] = useState(null);
  const [npsFeedback, setNpsFeedback] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState(false);

  const [sessionSearchInput, setSessionSearchInput] = useState("");
  const [sessionSearch, setSessionSearch] = useState("");
  const [sessionPage, setSessionPage] = useState(1);
  const sessionPageSize = 10;

  const [tableFilters, setTableFilters] = useState({ status: "", rating: "" });
  const [tableFilterPanel, setTableFilterPanel] = useState(null); // { top, left } when open

  useEffect(() => {
    const id = setTimeout(() => setSessionSearch(sessionSearchInput), 300);
    return () => clearTimeout(id);
  }, [sessionSearchInput]);

  const [drawerSession, setDrawerSession] = useState(null);
  const [rowMenu, setRowMenu] = useState(null);

  const [currentUser, setCurrentUser] = useState(null);
  const [now, setNow] = useState(null);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    if (embedded) return undefined;
    fetch(`${API}/users/me`).then((r) => r.json()).then(setCurrentUser).catch(() => setCurrentUser(null));
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, [embedded]);

  useEffect(() => {
    setFilters({
      course_name: course_name || "",
      batch_name: batch_name || "",
      date_from: date_from || "",
      date_to: date_to || "",
    });
  }, [course_name, batch_name, date_from, date_to]);

  useEffect(() => {
    fetch(`${API}/mentors`)
      .then((r) => r.json())
      .then((data) => setMentorsList(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const mentorInfo = useMemo(() => mentorsList.find((m) => m.name === mentorName) || null, [mentorsList, mentorName]);

  useEffect(() => {
    if (!mentorName) return;

    setLoading(true);
    const qs = buildQuery({ ...filters, mentor_name: mentorName }, ["course_name", "batch_name", "date_from", "date_to"]);

    fetch(`${API}/mentor-360/${encodeURIComponent(mentorName)}${qs}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) {
          setNotFound(true);
          setMentorData(null);
        } else {
          setNotFound(false);
          setMentorData(data.mentor);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));

    fetch(`${API}/mentor-360/scorecard${buildQuery(filters, ["course_name", "batch_name", "date_from", "date_to"])}`)
      .then((r) => r.json())
      .then((data) => setPeers(Array.isArray(data) ? data : []))
      .catch(() => setPeers([]));
  }, [mentorName, filters]);

  useEffect(() => {
    if (!mentorName || !mentorData) return;
    fetch(`${API}/mentor-360/${encodeURIComponent(mentorName)}/trends?months=6`)
      .then((r) => r.json())
      .then((data) => setTrend(Array.isArray(data) ? data : []))
      .catch(() => setTrend([]));
  }, [mentorName, mentorData]);

  useEffect(() => {
    if (!mentorName) return;
    fetch(`${API}/webinars/mentor-performance/${encodeURIComponent(mentorName)}`)
      .then((r) => r.json())
      .then((data) => setWebinarStats(data.success ? data.stats : null))
      .catch(() => setWebinarStats(null));
  }, [mentorName]);

  // Session-report-backed data — powers Overview/Sessions/NPS/Batches/Attendance/Quality/Reports tabs.
  const loadSessionData = () => {
    if (!mentorName) return;
    setSessionsLoading(true);
    setSessionsError(false);
    const base = { ...filters, mentor_name: mentorName };
    const listQs = toQuery({ ...base, page: 1, page_size: 100000 });
    const summaryQs = toQuery(base);
    const npsQs = toQuery({ mentor_name: mentorName, course_name: filters.course_name, batch_name: filters.batch_name });

    Promise.all([
      fetch(`${API}/session-reports?${listQs}`).then((r) => { if (!r.ok) throw new Error("bad status"); return r.json(); }),
      fetch(`${API}/session-reports/summary?${summaryQs}`).then((r) => { if (!r.ok) throw new Error("bad status"); return r.json(); }),
      fetch(`${API}/nps?${npsQs}`).then((r) => { if (!r.ok) throw new Error("bad status"); return r.json(); }),
    ])
      .then(([listData, summaryData, npsData]) => {
        setSessionRows(listData.items || []);
        setSessionSummary(summaryData);
        setNpsFeedback(Array.isArray(npsData) ? npsData : []);
      })
      .catch(() => {
        setSessionRows([]);
        setSessionSummary(null);
        setNpsFeedback([]);
        setSessionsError(true);
      })
      .finally(() => setSessionsLoading(false));
  };

  useEffect(loadSessionData, [mentorName, filters]);

  useEffect(() => setSessionPage(1), [sessionSearch, mentorName, tableFilters]);

  const matrixData = useMemo(
    () => peers.map((m) => ({
      mentor_name: m.mentor_name,
      x: typeof m.delivery_performance?.score === "number" ? m.delivery_performance.score : null,
      y: typeof m.learner_experience?.score === "number" ? m.learner_experience.score : null,
      z: m.productivity?.learners_served || 1,
    })),
    [peers]
  );

  const trendPoints = useMemo(() => (trend || []).map((t) => ({ date: t.month, count: t.overall_score })), [trend]);

  const dimensionBarData = useMemo(() => {
    if (!mentorData) return [];
    const dims = [
      ["Delivery", mentorData.delivery_performance],
      ["Attendance", mentorData.attendance_engagement],
      ["Learner Exp.", mentorData.learner_experience],
      ["Quality", mentorData.session_quality],
      ["Resources", mentorData.resource_compliance],
      ["Reliability", mentorData.reliability],
      ["Productivity", mentorData.productivity],
      ["Cost Eff.", mentorData.cost_efficiency],
    ];
    return dims.filter(([, d]) => d && typeof d.score === "number").map(([label, d]) => ({ name: label, value: d.score }));
  }, [mentorData]);

  // ---- Session-report-derived analytics (real, computed client-side from already-fetched rows) ----

  const sessionTrend = useMemo(() => {
    const days = [];
    if (trendRangeDays === "custom") {
      if (!trendCustomRange.from || !trendCustomRange.to) return [];
      const start = new Date(trendCustomRange.from);
      const end = new Date(trendCustomRange.to);
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return [];
      // Cap at 366 days so a mistyped range can't hang the browser building the chart.
      const span = Math.min(366, Math.round((end - start) / 86400000));
      for (let i = 0; i <= span; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        days.push(d.toLocaleDateString("en-CA"));
      }
    } else {
      for (let i = trendRangeDays - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toLocaleDateString("en-CA"));
      }
    }
    const byDate = {};
    sessionRows.forEach((r) => {
      if (!r.session_date) return;
      if (!byDate[r.session_date]) byDate[r.session_date] = { count: 0, sum: 0, n: 0 };
      byDate[r.session_date].count += 1;
      if (r.attendance_percentage) { byDate[r.session_date].sum += r.attendance_percentage; byDate[r.session_date].n += 1; }
    });
    return days.map((d) => ({
      date: new Date(d).toLocaleDateString(undefined, { day: "2-digit", month: "short" }),
      sessions: byDate[d] ? byDate[d].count : 0,
      attendance: byDate[d] && byDate[d].n ? Math.round(byDate[d].sum / byDate[d].n) : null,
    }));
  }, [sessionRows, trendRangeDays, trendCustomRange]);

  // Real period-over-period deltas: last 30 days vs the 30 days before that,
  // computed from the mentor's own fetched session/NPS rows — never fabricated.
  const periodComparison = useMemo(() => {
    const now = Date.now();
    const dayMs = 86400000;
    const inWindow = (dateStr, startDaysAgo, endDaysAgo) => {
      if (!dateStr) return false;
      const t = new Date(dateStr).getTime();
      if (isNaN(t)) return false;
      const age = (now - t) / dayMs;
      return age >= endDaysAgo && age < startDaysAgo;
    };
    const currentRows = sessionRows.filter((r) => inWindow(r.session_date, 30, 0));
    const prevRows = sessionRows.filter((r) => inWindow(r.session_date, 60, 30));
    const avg = (rows, key) => {
      const vals = rows.map((r) => r[key]).filter((v) => v !== null && v !== undefined);
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    };
    const pctChange = (curr, prev) => {
      if (curr === null || prev === null || prev === 0) return null;
      return Math.round(((curr - prev) / prev) * 100);
    };
    const currentLearners = currentRows.reduce((a, r) => a + (r.attendance || 0), 0);
    const prevLearners = prevRows.reduce((a, r) => a + (r.attendance || 0), 0);

    const currentNps = npsFeedback.filter((f) => inWindow(f.created_at, 30, 0));
    const prevNps = npsFeedback.filter((f) => inWindow(f.created_at, 60, 30));

    const build = (curr, prev) => {
      const delta = pctChange(curr, prev);
      if (delta === null || delta === 0) return null;
      return { dir: delta > 0 ? "up" : "down", text: `${Math.abs(delta)}%` };
    };

    return {
      sessions: build(currentRows.length, prevRows.length),
      learners: build(currentLearners, prevLearners),
      attendance: build(avg(currentRows, "attendance_percentage"), avg(prevRows, "attendance_percentage")),
      rating: build(avg(currentRows, "rating"), avg(prevRows, "rating")),
      duration: build(avg(currentRows, "duration"), avg(prevRows, "duration")),
      npsResponses: build(currentNps.length, prevNps.length),
      hasPriorPeriodData: prevRows.length > 0 || prevNps.length > 0,
    };
  }, [sessionRows, npsFeedback]);

  const npsStats = useMemo(() => {
    if (!npsFeedback.length) return null;
    const scores = npsFeedback.map((f) => f.nps_score).filter((v) => v !== null && v !== undefined);
    const promoters = scores.filter((s) => s >= 9).length;
    const passives = scores.filter((s) => s >= 7 && s <= 8).length;
    const detractors = scores.filter((s) => s <= 6).length;
    const total = scores.length;
    const npsScore = total ? Math.round(((promoters - detractors) / total) * 100) : null;
    const avg = (key) => {
      const vals = npsFeedback.map((f) => f[key]).filter((v) => v !== null && v !== undefined);
      return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null;
    };
    return {
      npsScore, promoters, passives, detractors, total,
      promotersPct: total ? Math.round((promoters / total) * 100) : 0,
      passivesPct: total ? Math.round((passives / total) * 100) : 0,
      detractorsPct: total ? Math.round((detractors / total) * 100) : 0,
      instructor: avg("instructor_rating"),
      doubt: avg("doubt_rating"),
    };
  }, [npsFeedback]);

  // Monthly NPS trend — only rendered when at least 2 distinct months of real
  // feedback exist, so a single-month mentor never sees a misleading flat line.
  const npsTrend = useMemo(() => {
    const withDate = npsFeedback.filter((f) => f.created_at && f.nps_score !== null && f.nps_score !== undefined);
    if (!withDate.length) return [];
    const byMonth = {};
    withDate.forEach((f) => {
      const d = new Date(f.created_at);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!byMonth[key]) byMonth[key] = { key, date: new Date(d.getFullYear(), d.getMonth(), 1), promoters: 0, detractors: 0, total: 0 };
      byMonth[key].total += 1;
      if (f.nps_score >= 9) byMonth[key].promoters += 1;
      else if (f.nps_score <= 6) byMonth[key].detractors += 1;
    });
    return Object.values(byMonth)
      .sort((a, b) => a.date - b.date)
      .slice(-6)
      .map((m) => ({
        month: m.date.toLocaleDateString(undefined, { month: "short", year: "2-digit" }),
        nps: Math.round(((m.promoters - m.detractors) / m.total) * 100),
        responses: m.total,
      }));
  }, [npsFeedback]);

  const recentFeedback = useMemo(
    () => npsFeedback
      .filter((f) => f.feedback && f.feedback.trim())
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .slice(0, 6),
    [npsFeedback]
  );

  const health = useMemo(() => {
    const buckets = { healthy: 0, needsReview: 0, attention: 0 };
    const flagged = [];
    sessionRows.forEach((r) => {
      const c = classifySessionHealth(r);
      buckets[c.tier] += 1;
      if (c.tier !== "healthy") flagged.push({ ...r, reason: c.reason, tier: c.tier });
    });
    flagged.sort((a, b) => (a.tier === b.tier ? 0 : a.tier === "attention" ? -1 : 1));
    return { buckets, flagged };
  }, [sessionRows]);

  const batchStats = useMemo(() => {
    const map = {};
    sessionRows.forEach((r) => {
      const key = r.batch_name || "No Batch";
      if (!map[key]) map[key] = { name: key, sessions: 0, learners: 0, attSum: 0, attN: 0, ratingSum: 0, ratingN: 0 };
      map[key].sessions += 1;
      map[key].learners += r.learner_count || 0;
      if (r.attendance_percentage) { map[key].attSum += r.attendance_percentage; map[key].attN += 1; }
      if (r.rating) { map[key].ratingSum += r.rating; map[key].ratingN += 1; }
    });
    return Object.values(map)
      .map((b) => ({ ...b, avgAttendance: b.attN ? Math.round(b.attSum / b.attN) : null, avgRating: b.ratingN ? Math.round((b.ratingSum / b.ratingN) * 10) / 10 : null }))
      .sort((a, b) => b.sessions - a.sessions);
  }, [sessionRows]);

  const courseStats = useMemo(() => {
    const map = {};
    sessionRows.forEach((r) => {
      const key = r.course_name || "No Course";
      if (!map[key]) map[key] = { name: key, sessions: 0, learners: 0, attSum: 0, attN: 0, ratingSum: 0, ratingN: 0 };
      map[key].sessions += 1;
      map[key].learners += r.learner_count || 0;
      if (r.attendance_percentage) { map[key].attSum += r.attendance_percentage; map[key].attN += 1; }
      if (r.rating) { map[key].ratingSum += r.rating; map[key].ratingN += 1; }
    });
    return Object.values(map)
      .map((c) => ({ ...c, avgAttendance: c.attN ? Math.round(c.attSum / c.attN) : null, avgRating: c.ratingN ? Math.round((c.ratingSum / c.ratingN) * 10) / 10 : null }))
      .sort((a, b) => b.sessions - a.sessions);
  }, [sessionRows]);

  const attendanceStats = useMemo(() => {
    const registered = sessionRows.reduce((a, r) => a + (r.learner_count || 0), 0);
    const attended = sessionRows.reduce((a, r) => a + (r.attendance || 0), 0);
    const withPct = sessionRows.filter((r) => r.attendance_percentage !== null && r.attendance_percentage !== undefined);
    const high = withPct.filter((r) => r.attendance_percentage >= ATTENDANCE_THRESHOLDS.high).length;
    const medium = withPct.filter((r) => r.attendance_percentage >= ATTENDANCE_THRESHOLDS.medium && r.attendance_percentage < ATTENDANCE_THRESHOLDS.high).length;
    const low = withPct.filter((r) => r.attendance_percentage < ATTENDANCE_THRESHOLDS.medium).length;
    return { registered, attended, high, medium, low, withPctCount: withPct.length };
  }, [sessionRows]);

  const opStats = useMemo(() => {
    const relevant = sessionRows.filter((r) => r.status !== "Cancelled" && (r.status === "Completed" || r.status === "Scheduled" || r.status === "Live"));
    const n = relevant.length;
    if (!n) return null;
    const recordingOk = relevant.filter((r) => r.recording_status === "Available").length;
    const reportOk = relevant.filter((r) => r.report_status !== "Pending").length;
    return { recordingCompliance: Math.round((recordingOk / n) * 100), reportCompletion: Math.round((reportOk / n) * 100), n };
  }, [sessionRows]);

  const filteredSessionRows = useMemo(() => {
    const term = sessionSearch.trim().toLowerCase();
    return sessionRows.filter((r) => {
      if (term) {
        const matchesTerm =
          String(r.id).includes(term) ||
          (r.topic || "").toLowerCase().includes(term) ||
          (r.batch_name || "").toLowerCase().includes(term) ||
          (r.course_name || "").toLowerCase().includes(term);
        if (!matchesTerm) return false;
      }
      if (tableFilters.status && r.status !== tableFilters.status) return false;
      if (tableFilters.rating === "4plus" && !(r.rating >= 4)) return false;
      if (tableFilters.rating === "3plus" && !(r.rating >= 3)) return false;
      if (tableFilters.rating === "below3" && !(r.rating && r.rating < 3)) return false;
      return true;
    });
  }, [sessionRows, sessionSearch, tableFilters]);

  const sessionTotalPages = Math.max(Math.ceil(filteredSessionRows.length / sessionPageSize), 1);
  const pagedSessionRows = filteredSessionRows.slice((sessionPage - 1) * sessionPageSize, sessionPage * sessionPageSize);

  const mentorReportExportUrl = `${API}/mentor-360/export-pdf${buildQuery({ ...filters, mentor_name: mentorName || "" }, ["course_name", "batch_name", "date_from", "date_to", "mentor_name"])}`;
  const sessionsCsvUrl = `${API}/session-reports/export?${toQuery({ ...filters, mentor_name: mentorName })}`;
  const sessionsPdfUrl = `${API}/session-reports/export/pdf?${toQuery({ ...filters, mentor_name: mentorName })}`;

  const Guard = embedded ? Fragment : ProtectedRoute;

  return (
    <Guard>
      <>
        <Head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Caveat:wght@600&display=swap" />
        </Head>
        {!embedded && <Sidebar />}

        <div style={embedded ? undefined : { marginLeft: "var(--om-sidebar-width, 280px)", transition: "margin-left 0.25s ease", padding: "32px 36px 60px", background: "#f1f5f9", minHeight: "100vh" }}>
          {!embedded && (
            <>
          <Link href="/mentor-performance" className="back-link">← Back to Mentor 360</Link>

          {/* Header + Mentor Selector */}
          <div className="page-hero">
            <div className="page-hero-blob" />
            <div className="page-hero-content">
              <div className="page-hero-eyebrow">Mentor 360</div>
              <h1 className="page-hero-title">Mentor 360</h1>
              <p className="page-hero-subtitle">Complete mentor insights — performance, sessions, learner feedback and operational metrics.</p>
            </div>

            <div className="page-hero-tagline">
              <Sparkles size={16} strokeWidth={2} />
              <span>Empowering<br />Minds Together</span>
            </div>

            <div className="page-hero-right">
              {now && (
                <div className="hero-clock">
                  {now.toLocaleDateString(undefined, { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
                  <span className="hero-clock-time">{now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              )}

              <div className="header-item-wrap">
                <button className="hero-icon-btn" onClick={() => setNotifOpen((v) => !v)} aria-label="Notifications">
                  <Bell size={16} strokeWidth={2.1} />
                </button>
                {notifOpen && (
                  <>
                    <div className="range-backdrop" onClick={() => setNotifOpen(false)} />
                    <div className="hero-notif-dropdown">
                      <div className="hero-notif-title">Notifications</div>
                      <div className="hero-notif-empty">You&apos;re all caught up.</div>
                    </div>
                  </>
                )}
              </div>

              {currentUser && (
                userPhotoUrl(currentUser) ? (
                  <img src={userPhotoUrl(currentUser)} alt={currentUser.name} className="hero-avatar-img" />
                ) : (
                  <div className="hero-avatar">{initials(currentUser.name)}</div>
                )
              )}
            </div>
          </div>

            </>
          )}

          {loading && <div className="card empty-state">Loading…</div>}

          {!loading && notFound && (
            <div className="card empty-state">No performance data found for this mentor in the selected scope.</div>
          )}

          {!loading && !notFound && mentorData && (
            <>
              {/* Profile summary */}
              <div className="card profile-card">
                <div className="profile-left">
                  {mentorPhotoUrl(mentorInfo) ? (
                    <img src={mentorPhotoUrl(mentorInfo)} alt={mentorName} className="profile-avatar-img" />
                  ) : (
                    <div className="profile-avatar">{initials(mentorName)}</div>
                  )}
                  <div>
                    <div className="profile-name-row">
                      <h2 className="profile-name">{mentorName}</h2>
                      <Badge label={mentorInfo?.status || "Unknown"} styles={{ Active: { bg: "#dcfce7", color: "#15803d", dot: "#22c55e" } }} />
                    </div>
                    <div className="profile-meta">
                      Mentor
                      {mentorInfo?.expertise && (
                        <>
                          <span className="profile-meta-sep">|</span>
                          {mentorInfo.expertise.split(",").map((s) => s.trim()).filter(Boolean).join(" • ")}
                        </>
                      )}
                    </div>
                    <div className="profile-contact">
                      {mentorInfo?.email ? <span><Mail size={12} /> {mentorInfo.email}</span> : <span>Email not on file</span>}
                    </div>
                  </div>
                </div>

                <div className="profile-actions-col">
                  <div className="profile-actions">
                    <button className="btn-view-profile" onClick={() => setProfileOpen((v) => !v)}>{profileOpen ? "Hide Profile" : "View Profile"}</button>
                  </div>
                  <div className="profile-badges">
                    <BusinessScoreBadge classification={mentorData.classification} />
                    <RiskBadge risk={mentorData.risk} />
                  </div>
                </div>
              </div>

              {profileOpen && (
                <div className="card profile-details">
                  <div className="card-header-row">
                    <SectionTitle icon={Users} color="#2563eb" title="Mentor Profile" sub="Details on file for this mentor" />
                    <button className="profile-details-close" onClick={() => setProfileOpen(false)} aria-label="Close profile">×</button>
                  </div>
                  <div className="profile-details-grid">
                    <DrawerField label="Name" value={mentorName} />
                    <DrawerField label="Status" value={mentorInfo?.status || "—"} />
                    <DrawerField label="Email" value={mentorInfo?.email || "Not on file"} />
                    <DrawerField label="Phone" value={mentorInfo?.phone || "Not on file"} />
                    <DrawerField label="Expertise" value={mentorInfo?.expertise ? mentorInfo.expertise.split(",").map((e) => e.trim()).filter(Boolean).join(" • ") : "—"} />
                    <DrawerField label="LinkedIn" value={<>{mentorInfo?.linkedin ? (
                        <a href={mentorInfo.linkedin} target="_blank" rel="noreferrer" className="profile-details-link">
                          {mentorInfo.linkedin} <ExternalLink size={11} />
                        </a>
                      ) : "Not on file"}</>} />
                    <DrawerField label="Business Score" value={<>{mentorData.overall_score ?? "—"} · {mentorData.classification || "—"}</>} />
                    <DrawerField label="Risk Level" value={mentorData.risk || "—"} />
                  </div>
                </div>
              )}

              {/* KPI Overview */}
              <div className="kpi-grid">
                <KPICard icon={CalendarClock} label="Total Sessions" value={sessionSummary?.total_sessions ?? "—"} sub="All time" color="#0f172a" trend={periodComparison.sessions} />
                <KPICard icon={Users} label="Total Learners" value={sessionSummary?.total_learners_attended ?? "—"} sub="Across all sessions" color="#2563eb" trend={periodComparison.learners} />
                <KPICard icon={Percent} label="Avg Attendance" value={sessionSummary ? `${sessionSummary.average_attendance_percentage}%` : "—"} sub="Across all sessions" color="#16a34a" trend={periodComparison.attendance} />
                <KPICard icon={Star} label="Avg Rating" value={sessionSummary?.average_rating ? `${sessionSummary.average_rating} / 5` : "Not Available"} sub="Based on learner feedback" color="#a855f7" trend={periodComparison.rating} />
                <KPICard icon={Timer} label="Avg Duration" value={sessionSummary ? `${sessionSummary.average_session_duration} min` : "—"} sub="Per session" color="#f59e0b" trend={periodComparison.duration} />
              </div>

              {/* Tabs */}
              <div className="tab-bar">
                {TABS.map((t) => (
                  <button key={t} className={`tab-btn ${activeTab === t ? "tab-btn-active" : ""}`} onClick={() => setActiveTab(t)}>{t}</button>
                ))}
              </div>

              {sessionsError && (
                <div className="error-banner">
                  <AlertTriangle size={16} strokeWidth={2.2} />
                  <span>Couldn&apos;t load this mentor&apos;s session data. Please check your connection and try again.</span>
                  <button className="btn-retry" onClick={loadSessionData}><RefreshCw size={13} strokeWidth={2.3} /> Retry</button>
                </div>
              )}

              {/* ---------------- OVERVIEW ---------------- */}
              {activeTab === "Overview" && (
                <>
                  <div className="grid-3a">
                    <div className="card">
                      <div className="card-header-row">
                        <SectionTitle icon={BarChart2} color="#2563eb" title="Session Performance Trend" sub="Sessions conducted vs attendance percentage" />
                        <div className="range-select-wrap">
                          <button className="range-select-btn" onClick={() => setTrendRangeOpen((v) => !v)}>
                            {trendRangeDays === "custom" ? "Custom" : TREND_RANGE_LABELS[trendRangeDays]} <ChevronDown size={12} strokeWidth={2.5} />
                          </button>
                          {trendRangeOpen && (
                            <>
                              <div className="range-backdrop" onClick={() => setTrendRangeOpen(false)} />
                              <div className="range-select-menu">
                                {Object.entries(TREND_RANGE_LABELS).map(([days, label]) => (
                                  <button key={days} className={`range-select-item ${Number(days) === trendRangeDays ? "range-select-item-active" : ""}`} onClick={() => { setTrendRangeDays(Number(days)); setTrendRangeOpen(false); }}>{label}</button>
                                ))}
                                <button className={`range-select-item ${trendRangeDays === "custom" ? "range-select-item-active" : ""}`} onClick={() => { setTrendRangeDays("custom"); setTrendRangeOpen(false); }}>Custom</button>
                                {trendRangeDays === "custom" && (
                                  <div className="range-select-custom">
                                    <input type="date" value={trendCustomRange.from} onChange={(e) => setTrendCustomRange((p) => ({ ...p, from: e.target.value }))} />
                                    <span>to</span>
                                    <input type="date" value={trendCustomRange.to} onChange={(e) => setTrendCustomRange((p) => ({ ...p, to: e.target.value }))} />
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      {sessionRows.length === 0 ? (
                        <div className="empty-state" style={{ padding: "30px 0" }}>No session data yet.</div>
                      ) : trendRangeDays === "custom" && sessionTrend.length === 0 ? (
                        <div className="empty-state" style={{ padding: "30px 0" }}>Pick a custom date range to view the trend.</div>
                      ) : (
                        <div style={{ height: 200, marginTop: "10px" }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={sessionTrend}>
                              <CartesianGrid stroke="#f1f5f9" vertical={false} />
                              <XAxis dataKey="date" tick={{ fontSize: 9.5, fill: "#94a3b8" }} interval={4} />
                              <YAxis yAxisId="left" tick={{ fontSize: 10.5, fill: "#94a3b8" }} allowDecimals={false} />
                              <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 10.5, fill: "#94a3b8" }} tickFormatter={(v) => `${v}%`} />
                              <Tooltip />
                              <Legend wrapperStyle={{ fontSize: 11 }} />
                              <Bar yAxisId="left" dataKey="sessions" name="Sessions Conducted" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={10} />
                              <Line yAxisId="right" dataKey="attendance" name="Attendance %" stroke="#f59e0b" strokeWidth={2} dot={{ r: 2 }} connectNulls />
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>

                    <div className="card">
                      <SectionTitle icon={PieChartIcon} color="#16a34a" title="NPS Score" sub="Learner satisfaction and feedback" />
                      <div style={{ marginTop: "12px" }} />
                      {!npsStats ? (
                        <div className="empty-state" style={{ padding: "20px 0" }}>No NPS responses are available for this mentor.</div>
                      ) : (
                        <div className="nps-row">
                          <div style={{ position: "relative", width: 110, height: 110, flexShrink: 0 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie data={[{ v: npsStats.promoters }, { v: npsStats.passives }, { v: npsStats.detractors }]} dataKey="v" innerRadius={36} outerRadius={52} startAngle={90} endAngle={-270}>
                                  <Cell fill="#22c55e" />
                                  <Cell fill="#f59e0b" />
                                  <Cell fill="#ef4444" />
                                </Pie>
                              </PieChart>
                            </ResponsiveContainer>
                            <div className="nps-center">{npsStats.npsScore > 0 ? "+" : ""}{npsStats.npsScore}<br /><span>NPS Score</span></div>
                          </div>
                          <div className="nps-legend">
                            <div><ThumbsUp size={12} color="#22c55e" /> Promoters <b>{npsStats.promotersPct}%</b></div>
                            <div><Meh size={12} color="#f59e0b" /> Passives <b>{npsStats.passivesPct}%</b></div>
                            <div><ThumbsDown size={12} color="#ef4444" /> Detractors <b>{npsStats.detractorsPct}%</b></div>
                            <div className="nps-total">
                              Total Responses <b>{npsStats.total}</b>
                              {periodComparison.npsResponses && (
                                <span className={`kpi-trend ${periodComparison.npsResponses.dir === "up" ? "kpi-trend-up" : "kpi-trend-down"}`} style={{ marginLeft: "8px" }}>
                                  {periodComparison.npsResponses.dir === "up" ? "↑" : "↓"} {periodComparison.npsResponses.text}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="card">
                      <SectionTitle icon={Star} color="#a855f7" title="Session Quality" sub="Average ratings from learner feedback" />
                      <div style={{ marginTop: "14px" }}>
                        <QualityBar label="Teaching Method" value={npsStats?.instructor} max={5} />
                        <QualityBar label="Doubt Resolution" value={npsStats?.doubt} max={5} />
                        <QualityBar label="Overall Experience" value={sessionSummary?.average_rating} max={5} />
                      </div>
                    </div>
                  </div>

                  <div className="grid-3a">
                    <div className="card">
                      <div className="card-header-row">
                        <SectionTitle icon={GraduationCap} color="#2563eb" title="Batch-wise Performance" sub="Performance across different batches" />
                        <button className="view-all-link" onClick={() => setActiveTab("Batches")}>View All →</button>
                      </div>
                      {batchStats.length === 0 ? (
                        <div className="empty-state" style={{ padding: "16px 0" }}>No batches found for this mentor.</div>
                      ) : (
                        <div className="table-wrap" style={{ marginTop: "10px" }}>
                          <table className="mini-table">
                            <thead><tr><th>Batch</th><th>Sessions</th><th>Learners</th><th>Attendance</th><th>Rating</th></tr></thead>
                            <tbody>
                              {batchStats.slice(0, 4).map((b, i) => (
                                <tr key={b.name}>
                                  <td><span className="legend-dot" style={{ background: dotColor(i) }} /> {b.name}</td>
                                  <td>{b.sessions}</td>
                                  <td>{b.learners}</td>
                                  <td>{b.avgAttendance !== null ? `${b.avgAttendance}%` : "—"}</td>
                                  <td>{b.avgRating ? `★ ${b.avgRating}` : "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    <div className="card">
                      <div className="card-header-row">
                        <SectionTitle icon={BookOpen} color="#16a34a" title="Course-wise Performance" sub="Performance across courses" />
                        <button className="view-all-link" onClick={() => setActiveTab("Batches")}>View All →</button>
                      </div>
                      {courseStats.length === 0 ? (
                        <div className="empty-state" style={{ padding: "16px 0" }}>No courses found for this mentor.</div>
                      ) : (
                        <div className="table-wrap" style={{ marginTop: "10px" }}>
                          <table className="mini-table">
                            <thead><tr><th>Course</th><th>Sessions</th><th>Learners</th><th>Attendance</th><th>Rating</th></tr></thead>
                            <tbody>
                              {courseStats.slice(0, 4).map((c, i) => (
                                <tr key={c.name}>
                                  <td><span className="legend-dot" style={{ background: dotColor(i) }} /> {c.name}</td>
                                  <td>{c.sessions}</td>
                                  <td>{c.learners}</td>
                                  <td>{c.avgAttendance !== null ? `${c.avgAttendance}%` : "—"}</td>
                                  <td>{c.avgRating ? `★ ${c.avgRating}` : "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    <div className="card">
                      <SectionTitle icon={Users} color="#2563eb" title="Attendance Intelligence" sub="Detailed attendance analysis" />
                      <div style={{ marginTop: "12px" }} />
                      {sessionRows.length === 0 ? (
                        <div className="empty-state" style={{ padding: "16px 0" }}>No sessions found for this mentor.</div>
                      ) : (
                        <>
                          <div className="attn-mini-row"><span>Registered</span><b>{attendanceStats.registered}</b></div>
                          <div className="attn-mini-row"><span>Attended</span><b>{attendanceStats.attended}</b></div>
                          <div className="attn-mini-row"><span>Average</span><b>{sessionSummary?.average_attendance_percentage ?? 0}%</b></div>
                          <div className="attendance-track" style={{ height: 6, margin: "8px 0 12px" }}>
                            <div className="attendance-fill" style={{ width: `${sessionSummary?.average_attendance_percentage || 0}%` }} />
                          </div>
                          <div className="attn-breakdown-mini">
                            <div><span className="legend-dot" style={{ background: "#22c55e" }} /> High <b>{attendanceStats.high}</b></div>
                            <div><span className="legend-dot" style={{ background: "#f59e0b" }} /> Medium <b>{attendanceStats.medium}</b></div>
                            <div><span className="legend-dot" style={{ background: "#ef4444" }} /> Low <b>{attendanceStats.low}</b></div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="grid-3a">
                    <div className="card">
                      <div className="card-header-row">
                        <SectionTitle icon={Sparkles} color="#2563eb" title="Recent Learner Feedback" sub="Latest feedback from learners" />
                        <button className="view-all-link" onClick={() => setActiveTab("NPS & Feedback")}>View All →</button>
                      </div>
                      {recentFeedback.length === 0 ? (
                        <div className="empty-state" style={{ padding: "16px 0" }}>No learner feedback is available yet.</div>
                      ) : (
                        <div className="feedback-list" style={{ marginTop: "10px" }}>
                          {recentFeedback.slice(0, 2).map((f) => (
                            <div key={f.id} className="feedback-item">
                              <div className="feedback-stars"><StarRow value={f.instructor_rating} /></div>
                              <div className="feedback-text">&ldquo;{f.feedback}&rdquo;</div>
                              <div className="feedback-meta">{[f.course_name, f.batch_name].filter(Boolean).join(" · ") || "—"} · {f.created_at ? new Date(f.created_at).toLocaleDateString() : "—"}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="card">
                      <SectionTitle icon={SettingsIcon} color="#64748b" title="Operational Performance" sub="Compliance and operational metrics" />
                      <div style={{ marginTop: "14px" }}>
                        {!opStats ? (
                          <div className="empty-state" style={{ padding: "16px 0" }}>Not enough session data yet.</div>
                        ) : (
                          <>
                            <OpBar label="Recording Compliance" value={opStats.recordingCompliance} />
                            <OpBar label="Report Completion" value={opStats.reportCompletion} />
                          </>
                        )}
                      </div>
                    </div>

                    <div className="card attention-card">
                      <div className="card-header-row">
                        <SectionTitle icon={AlertTriangle} color="#dc2626" title="Requires Attention" sub="Sessions that need operational review" />
                        <button className="view-all-link" onClick={() => setActiveTab("Sessions")}>View All →</button>
                      </div>
                      {health.flagged.length === 0 ? (
                        <div className="empty-state" style={{ padding: "16px 0" }}>Nothing needs attention right now.</div>
                      ) : (
                        <div className="attention-list">
                          {health.flagged.slice(0, 5).map((r) => (
                            <div key={r.id} className="attention-item" onClick={() => setDrawerSession(r)}>
                              <span className={`attention-icon ${r.tier === "attention" ? "attention-icon-red" : "attention-icon-amber"}`}>
                                {r.tier === "attention" ? "✕" : "!"}
                              </span>
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div className="attention-reason">{r.reason}</div>
                                <div className="attention-sub">{r.topic} · {r.batch_name || "No batch"} · {fmtDateTime(r.session_date, r.session_time).date}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* ---------------- SESSIONS ---------------- */}
              {activeTab === "Sessions" && (
                <div className="card">
                  <div className="list-toolbar">
                    <SectionTitle icon={FileText} color="#2563eb" title="All Mentor Sessions" sub="View, search and analyze all sessions by this mentor" />
                    <div style={{ display: "flex", gap: "10px" }}>
                      <div className="search-wrap">
                        <Search size={14} strokeWidth={2.3} className="search-icon" />
                        <input
                          className="search-input"
                          placeholder="Search sessions, topics, batches…"
                          value={sessionSearchInput}
                          onChange={(e) => setSessionSearchInput(e.target.value)}
                          aria-label="Search sessions"
                        />
                      </div>
                      <button
                        className={`btn-filters-shortcut ${(tableFilters.status || tableFilters.rating) ? "btn-filters-shortcut-active" : ""}`}
                        onClick={(e) => {
                          if (tableFilterPanel) { setTableFilterPanel(null); return; }
                          const rect = e.currentTarget.getBoundingClientRect();
                          setTableFilterPanel({ top: rect.bottom + 8, left: rect.right - 260 });
                        }}
                        aria-haspopup="true"
                        aria-expanded={!!tableFilterPanel}
                      >
                        <ListFilter size={13} strokeWidth={2.3} /> Filters
                      </button>
                    </div>
                  </div>

                  {sessionsLoading ? (
                    <div className="empty-state">Loading…</div>
                  ) : filteredSessionRows.length === 0 ? (
                    <div className="empty-state">No sessions found for this mentor.</div>
                  ) : (
                    <div className="table-wrap">
                      <table className="styled-table">
                        <thead>
                          <tr>
                            <th>Session</th><th>Date &amp; Time</th><th>Batch</th><th>Course</th><th>Type</th>
                            <th>Learners</th><th>Attendance</th><th>Attendance %</th><th>Rating</th><th>Recording</th><th>Report</th><th>Status</th><th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pagedSessionRows.map((r) => {
                            const dt = fmtDateTime(r.session_date, r.session_time);
                            return (
                              <tr key={r.id}>
                                <td><div className="strong">#{r.id}</div><div className="muted-sm">{r.topic}</div></td>
                                <td><div>{dt.date}</div><div className="muted-sm">{dt.time}</div></td>
                                <td>{r.batch_name || "—"}</td>
                                <td className="muted">{r.course_name || "—"}</td>
                                <td className="muted">{r.session_type || "—"}</td>
                                <td className="muted">{r.learner_count}</td>
                                <td className="muted">{r.attendance} / {r.learner_count || 0}</td>
                                <td>
                                  <div className="attendance-cell">
                                    <span>{r.attendance_percentage}%</span>
                                    <div className="attendance-track"><div className="attendance-fill" style={{ width: `${Math.min(100, r.attendance_percentage || 0)}%` }} /></div>
                                  </div>
                                </td>
                                <td className="muted">{r.rating ? `★ ${r.rating}` : "—"}</td>
                                <td><Badge label={r.recording_status} styles={RECORDING_STYLES} /></td>
                                <td><Badge label={r.report_status} styles={REPORT_STYLES} /></td>
                                <td><Badge label={r.status} styles={STATUS_STYLES} /></td>
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
                    </div>
                  )}

                  {filteredSessionRows.length > 0 && (
                    <div className="pagination">
                      <button className="btn btn-ghost" disabled={sessionPage <= 1} onClick={() => setSessionPage((p) => p - 1)}>← Prev</button>
                      <span className="page-info">Page {sessionPage} of {sessionTotalPages} · {filteredSessionRows.length} total</span>
                      <button className="btn btn-ghost" disabled={sessionPage >= sessionTotalPages} onClick={() => setSessionPage((p) => p + 1)}>Next →</button>
                    </div>
                  )}
                </div>
              )}

              {/* ---------------- NPS & FEEDBACK ---------------- */}
              {activeTab === "NPS & Feedback" && (
                <>
                  <div className="grid-2a">
                    <div className="card">
                      <h2 className="card-title">NPS &amp; Learner Feedback</h2>
                      {!npsStats ? (
                        <div className="empty-state">No NPS responses are available for this mentor.</div>
                      ) : (
                        <div className="nps-row">
                          <div style={{ position: "relative", width: 130, height: 130, flexShrink: 0 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie data={[{ v: npsStats.promoters }, { v: npsStats.passives }, { v: npsStats.detractors }]} dataKey="v" innerRadius={44} outerRadius={62} startAngle={90} endAngle={-270}>
                                  <Cell fill="#22c55e" /><Cell fill="#f59e0b" /><Cell fill="#ef4444" />
                                </Pie>
                              </PieChart>
                            </ResponsiveContainer>
                            <div className="nps-center">{npsStats.npsScore > 0 ? "+" : ""}{npsStats.npsScore}<br /><span>NPS Score</span></div>
                          </div>
                          <div className="nps-legend">
                            <div><ThumbsUp size={12} color="#22c55e" /> Promoters <b>{npsStats.promotersPct}%</b> ({npsStats.promoters})</div>
                            <div><Meh size={12} color="#f59e0b" /> Passives <b>{npsStats.passivesPct}%</b> ({npsStats.passives})</div>
                            <div><ThumbsDown size={12} color="#ef4444" /> Detractors <b>{npsStats.detractorsPct}%</b> ({npsStats.detractors})</div>
                            <div className="nps-total">
                              Total Responses <b>{npsStats.total}</b>
                              {periodComparison.npsResponses && (
                                <span className={`kpi-trend ${periodComparison.npsResponses.dir === "up" ? "kpi-trend-up" : "kpi-trend-down"}`} style={{ marginLeft: "8px" }}>
                                  {periodComparison.npsResponses.dir === "up" ? "↑" : "↓"} {periodComparison.npsResponses.text}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="card">
                      <h2 className="card-title" style={{ display: "flex", alignItems: "center", gap: "6px" }}><MessageSquare size={16} /> Recent Learner Feedback</h2>
                      {recentFeedback.length === 0 ? (
                        <div className="empty-state">No learner feedback is available yet.</div>
                      ) : (
                        <div className="feedback-list">
                          {recentFeedback.map((f) => (
                            <div key={f.id} className="feedback-item">
                              <div className="feedback-stars"><StarRow value={f.instructor_rating} /></div>
                              <div className="feedback-text">&ldquo;{f.feedback}&rdquo;</div>
                              <div className="feedback-meta">{[f.course_name, f.batch_name].filter(Boolean).join(" · ") || "—"} · {f.created_at ? new Date(f.created_at).toLocaleDateString() : "—"}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {npsTrend.length >= 2 && (
                    <div className="card">
                      <SectionTitle icon={BarChart2} color="#16a34a" title="NPS Trend" sub="Monthly NPS score from real feedback responses" />
                      <div style={{ height: 200, marginTop: "10px" }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={npsTrend}>
                            <CartesianGrid stroke="#f1f5f9" vertical={false} />
                            <XAxis dataKey="month" tick={{ fontSize: 10.5, fill: "#94a3b8" }} />
                            <YAxis tick={{ fontSize: 10.5, fill: "#94a3b8" }} domain={[-100, 100]} />
                            <Tooltip formatter={(v, name) => [name === "nps" ? (v > 0 ? `+${v}` : v) : v, name === "nps" ? "NPS Score" : "Responses"]} />
                            <Line type="monotone" dataKey="nps" name="nps" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ---------------- BATCHES ---------------- */}
              {activeTab === "Batches" && (
                <>
                  <div className="card">
                    <h2 className="card-title">Batch-wise Performance</h2>
                    {batchStats.length === 0 ? (
                      <div className="empty-state">No batches found for this mentor.</div>
                    ) : (
                      <div className="table-wrap">
                        <table className="styled-table">
                          <thead><tr><th>Batch</th><th>Sessions</th><th>Learners</th><th>Attendance</th><th>Rating</th></tr></thead>
                          <tbody>
                            {batchStats.map((b) => (
                              <tr key={b.name}>
                                <td className="strong">{b.name}</td>
                                <td>{b.sessions}</td>
                                <td>{b.learners}</td>
                                <td>{b.avgAttendance !== null ? `${b.avgAttendance}%` : "—"}</td>
                                <td>{b.avgRating ? `★ ${b.avgRating}` : "Not Available"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div className="card">
                    <h2 className="card-title">Course-wise Performance</h2>
                    {courseStats.length === 0 ? (
                      <div className="empty-state">No courses found for this mentor.</div>
                    ) : (
                      <div className="table-wrap">
                        <table className="styled-table">
                          <thead><tr><th>Course</th><th>Sessions</th><th>Learners</th><th>Attendance</th><th>Rating</th></tr></thead>
                          <tbody>
                            {courseStats.map((c) => (
                              <tr key={c.name}>
                                <td className="strong">{c.name}</td>
                                <td>{c.sessions}</td>
                                <td>{c.learners}</td>
                                <td>{c.avgAttendance !== null ? `${c.avgAttendance}%` : "—"}</td>
                                <td>{c.avgRating ? `★ ${c.avgRating}` : "Not Available"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ---------------- ATTENDANCE ---------------- */}
              {activeTab === "Attendance" && (
                <div className="card">
                  <h2 className="card-title">Attendance Intelligence</h2>
                  {sessionRows.length === 0 ? (
                    <div className="empty-state">No sessions found for this mentor.</div>
                  ) : (
                    <>
                      <div className="attn-stats-row">
                        <div><div className="attn-stat-label">Registered Learners</div><div className="attn-stat-value">{attendanceStats.registered}</div></div>
                        <div><div className="attn-stat-label">Attended Learners</div><div className="attn-stat-value">{attendanceStats.attended}</div></div>
                        <div><div className="attn-stat-label">Average Attendance</div><div className="attn-stat-value">{sessionSummary?.average_attendance_percentage ?? 0}%</div></div>
                      </div>
                      <div className="attendance-track" style={{ height: 8, margin: "8px 0 20px" }}>
                        <div className="attendance-fill" style={{ width: `${sessionSummary?.average_attendance_percentage || 0}%` }} />
                      </div>
                      <div className="attn-breakdown">
                        <div><span className="legend-dot" style={{ background: "#22c55e" }} /> High Attendance (&ge; {ATTENDANCE_THRESHOLDS.high}%) <b>{attendanceStats.high}</b></div>
                        <div><span className="legend-dot" style={{ background: "#f59e0b" }} /> Medium Attendance ({ATTENDANCE_THRESHOLDS.medium}–{ATTENDANCE_THRESHOLDS.high - 1}%) <b>{attendanceStats.medium}</b></div>
                        <div><span className="legend-dot" style={{ background: "#ef4444" }} /> Low Attendance (&lt; {ATTENDANCE_THRESHOLDS.medium}%) <b>{attendanceStats.low}</b></div>
                      </div>

                      {sessionTrend.some((d) => d.attendance !== null) && (
                        <>
                          <div className="card-sub" style={{ margin: "22px 0 8px", fontWeight: 700, color: "#334155" }}>Attendance Trend</div>
                          <div style={{ height: 180 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={sessionTrend}>
                                <CartesianGrid stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="date" tick={{ fontSize: 9.5, fill: "#94a3b8" }} interval={4} />
                                <YAxis domain={[0, 100]} tick={{ fontSize: 10.5, fill: "#94a3b8" }} tickFormatter={(v) => `${v}%`} />
                                <Tooltip formatter={(v) => [`${v}%`, "Attendance"]} />
                                <Line type="monotone" dataKey="attendance" name="Attendance %" stroke="#16a34a" strokeWidth={2} dot={{ r: 2 }} connectNulls />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* ---------------- QUALITY ---------------- */}
              {activeTab === "Quality" && (
                <div className="card">
                  <h2 className="card-title">Session Quality</h2>
                  <div className="card-sub" style={{ marginBottom: "16px" }}>Total feedback responses: {npsStats?.total ?? 0}</div>
                  <QualityBar label="Mentor Teaching Method" value={npsStats?.instructor} max={5} />
                  <QualityBar label="Doubt Resolution" value={npsStats?.doubt} max={5} />
                  <QualityBar label="Overall Experience" value={sessionSummary?.average_rating} max={5} note="Based on average session feedback rating." />
                </div>
              )}

              {/* ---------------- OPERATIONS (existing business-score system, preserved) ---------------- */}
              {activeTab === "Operations" && (
                <>
                  <div className="card">
                    <h2 className="card-title">Operational Performance</h2>
                    {!opStats ? (
                      <div className="empty-state">Not enough session data to compute operational metrics.</div>
                    ) : (
                      <>
                        <OpBar label="Recording Compliance" value={opStats.recordingCompliance} />
                        <OpBar label="Report Completion" value={opStats.reportCompletion} />
                      </>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{ color: "#94a3b8", fontSize: "12px" }}>{mentorData.score_basis}</span>
                  </div>

                  <div className="dim-grid">
                    <DimensionCard title="Delivery Performance" value={mentorData.delivery_performance?.score}>
                      {mentorData.delivery_performance && (
                        <>
                          <div>Scheduled: {mentorData.delivery_performance.scheduled}</div>
                          <div>Completed: {mentorData.delivery_performance.completed}</div>
                          <div>Cancelled: {mentorData.delivery_performance.cancelled}</div>
                          <div>Rescheduled: {mentorData.delivery_performance.rescheduled}</div>
                        </>
                      )}
                    </DimensionCard>

                    <DimensionCard title="Learner Experience" value={mentorData.learner_experience?.score}>
                      {mentorData.learner_experience && (
                        <>
                          <div>Instructor Rating: {mentorData.learner_experience.avg_instructor_rating} / 5</div>
                          <div>Doubt Rating: {mentorData.learner_experience.avg_doubt_rating} / 5</div>
                          <div>NPS: {mentorData.learner_experience.nps_score > 0 ? "+" : ""}{mentorData.learner_experience.nps_score}</div>
                          <div>Feedback Count: {mentorData.learner_experience.feedback_count}</div>
                        </>
                      )}
                    </DimensionCard>

                    <DimensionCard title="Session Quality" value={mentorData.session_quality?.score}>
                      {mentorData.session_quality && (
                        <>
                          <div>Avg Feedback Score: {mentorData.session_quality.avg_session_feedback_score} / 5</div>
                          <div>QA Score: {mentorData.session_quality.qa_score}</div>
                        </>
                      )}
                    </DimensionCard>

                    <DimensionCard title="Reliability" value={mentorData.reliability?.score} />

                    <DimensionCard title="Resource Compliance" value={mentorData.resource_compliance?.score}>
                      {mentorData.resource_compliance && (
                        <>
                          <div>Required: {mentorData.resource_compliance.required}</div>
                          <div>Received: {mentorData.resource_compliance.received}</div>
                          <div>Avg Delay: {mentorData.resource_compliance.avg_delay_hours} hrs</div>
                          <div>Reminders: {mentorData.resource_compliance.reminder_count}</div>
                        </>
                      )}
                    </DimensionCard>

                    <DimensionCard title="Attendance & Engagement" value={mentorData.attendance_engagement?.score}>
                      {mentorData.attendance_engagement && (
                        <>
                          <div>Registered: {mentorData.attendance_engagement.registered_learners}</div>
                          <div>Attended: {mentorData.attendance_engagement.attended_learners}</div>
                          <div>Low-Attendance Sessions: {mentorData.attendance_engagement.low_attendance_sessions}</div>
                        </>
                      )}
                    </DimensionCard>

                    <DimensionCard title="Productivity" value={mentorData.productivity?.score}>
                      {mentorData.productivity && (
                        <>
                          <div>Sessions: {mentorData.productivity.sessions_delivered}</div>
                          <div>Learners Served: {mentorData.productivity.learners_served}</div>
                          <div>Batches: {mentorData.productivity.batches_served}</div>
                          <div>Avg Learners/Session: {mentorData.productivity.avg_learners_per_session}</div>
                        </>
                      )}
                    </DimensionCard>

                    <DimensionCard title="Cost Efficiency" value={mentorData.cost_efficiency?.score}>
                      {mentorData.cost_efficiency && (
                        <>
                          <div>Cost / Session: ₹{mentorData.cost_efficiency.cost_per_session}</div>
                          <div>Cost / Hour: {mentorData.cost_efficiency.cost_per_hour ? `₹${mentorData.cost_efficiency.cost_per_hour}` : "N/A"}</div>
                          <div>Total Cost: ₹{mentorData.cost_efficiency.total_cost}</div>
                        </>
                      )}
                    </DimensionCard>
                  </div>

                  {mentorData.learning_outcomes && (
                    <div className="card">
                      <h2 className="card-title">Learning Outcomes <span className="supplementary-tag">Supplementary — not part of the weighted score</span></h2>
                      <div style={{ display: "flex", gap: "24px", fontSize: "14px", color: "#334155" }}>
                        <div>Avg Course Completion: <strong>{mentorData.learning_outcomes.avg_course_completion_percent}%</strong></div>
                        <div>Total Dropouts: <strong>{mentorData.learning_outcomes.total_dropouts}</strong></div>
                      </div>
                    </div>
                  )}

                  {webinarStats && (
                    <div className="card">
                      <h2 className="card-title">🎥 Webinar Performance <span className="supplementary-tag">Supplementary — not part of the weighted score</span></h2>
                      <div className="dim-grid" style={{ marginBottom: "18px" }}>
                        <DimensionCard title="Total Webinars" value={webinarStats.total_webinars} unit="" />
                        <DimensionCard title="Completed" value={webinarStats.completed_webinars} unit="" />
                        <DimensionCard title="Upcoming" value={webinarStats.upcoming_webinars} unit="" />
                        <DimensionCard title="Total Attendees" value={webinarStats.total_attendees} unit="" />
                        <DimensionCard title="Avg Rating" value={webinarStats.average_rating} unit="/5" />
                        <DimensionCard title="Leads Generated" value={webinarStats.leads_generated} unit="" />
                        <DimensionCard title="Conversions" value={webinarStats.conversions} unit="" />
                        <DimensionCard title="Total Payout" value={`₹${webinarStats.total_payout}`} unit="" />
                      </div>
                      <h3 style={{ fontSize: "13px", color: "#64748b", margin: "0 0 10px" }}>Mentor Efficiency</h3>
                      <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", fontSize: "14px", color: "#334155" }}>
                        <div>Avg Attendees / Webinar: <strong>{webinarStats.average_attendance_per_webinar ?? "N/A"}</strong></div>
                        <div>Leads / Webinar: <strong>{webinarStats.leads_per_webinar ?? "N/A"}</strong></div>
                        <div>Conversion Rate: <strong>{webinarStats.conversion_rate !== null ? `${webinarStats.conversion_rate}%` : "N/A"}</strong></div>
                        <div>Payout / Attendee: <strong>{webinarStats.payout_per_attendee !== null ? `₹${webinarStats.payout_per_attendee}` : "N/A"}</strong></div>
                      </div>
                    </div>
                  )}

                  {dimensionBarData.length > 0 && (
                    <>
                      <DimensionRadar data={dimensionBarData} />
                      <BarChartCard title="Dimension Breakdown" data={dimensionBarData} dataKey="value" nameKey="name" color="#0f172a" />
                    </>
                  )}

                  {trendPoints.length >= 2 && (
                    <TrendChartCard title="Business Score Trend (last 6 months)" data={trendPoints} color="#f59e0b" type="line" />
                  )}

                  <PerformanceMatrix data={matrixData} highlightMentor={mentorData.mentor_name} />
                </>
              )}

              {/* ---------------- REPORTS ---------------- */}
              {activeTab === "Reports" && (
                <div className="card">
                  <h2 className="card-title">Mentor Report</h2>
                  <div className="card-sub" style={{ marginBottom: "18px" }}>Generate or export a full summary for {mentorName}.</div>

                  <div className="report-summary-grid">
                    <DrawerField label="Mentor Summary" value={`${mentorData.classification} · Risk: ${mentorData.risk}`} />
                    <DrawerField label="Session Summary" value={sessionSummary ? `${sessionSummary.total_sessions} sessions · ${sessionSummary.completed_sessions} completed · ${sessionSummary.cancelled_sessions} cancelled` : "—"} />
                    <DrawerField label="Attendance Summary" value={sessionSummary ? `${sessionSummary.total_learners_attended} learners · ${sessionSummary.average_attendance_percentage}% avg` : "—"} />
                    <DrawerField label="Rating Summary" value={sessionSummary?.average_rating ? `${sessionSummary.average_rating} / 5` : "Not Available"} />
                    <DrawerField label="NPS Summary" value={npsStats ? `${npsStats.npsScore > 0 ? "+" : ""}${npsStats.npsScore} (${npsStats.total} responses)` : "Not Available"} />
                    <DrawerField label="Learner Feedback" value={`${recentFeedback.length} written responses`} />
                    <DrawerField label="Batch Performance" value={`${batchStats.length} batches`} />
                    <DrawerField label="Course Performance" value={`${courseStats.length} courses`} />
                    <DrawerField label="Operational Performance" value={opStats ? `Recording ${opStats.recordingCompliance}% · Report ${opStats.reportCompletion}%` : "Not Available"} />
                    <DrawerField label="Issues Requiring Attention" value={`${health.flagged.length} sessions flagged`} />
                  </div>

                  <div className="filters-actions">
                    <a className="btn btn-primary" href={mentorReportExportUrl} target="_blank" rel="noreferrer"><Download size={14} /> Export Mentor Report</a>
                    <a className="btn btn-ghost" href={sessionsCsvUrl}><Check size={14} /> Export Sessions CSV</a>
                    <a className="btn btn-ghost" href={sessionsPdfUrl} target="_blank" rel="noreferrer"><FileText size={14} /> Export Sessions PDF</a>
                  </div>
                </div>
              )}
            </>
          )}
        </div>


        {rowMenu && (
          <div className="row-menu" style={{ position: "fixed", top: rowMenu.top, left: rowMenu.left }}>
            <Link href={`/session-reports/${rowMenu.id}`} className="row-menu-item" onClick={() => setRowMenu(null)}><FileText size={13} /> View Report</Link>
            <Link href="/sessions" className="row-menu-item" onClick={() => setRowMenu(null)}><ExternalLink size={13} /> Open Session</Link>
            <a className="row-menu-item" href={`${API}/session-reports/${rowMenu.id}/download`} target="_blank" rel="noreferrer" onClick={() => setRowMenu(null)}><Download size={13} /> Download PDF</a>
          </div>
        )}

        {tableFilterPanel && (
          <>
            <div className="range-backdrop" onClick={() => setTableFilterPanel(null)} />
            <div className="table-filter-panel" style={{ position: "fixed", top: tableFilterPanel.top, left: tableFilterPanel.left }}>
              <div className="table-filter-title">Filter Sessions</div>
              <div className="table-filter-field">
                <label>Status</label>
                <select value={tableFilters.status} onChange={(e) => setTableFilters((p) => ({ ...p, status: e.target.value }))}>
                  <option value="">All</option>
                  {Object.keys(STATUS_STYLES).map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="table-filter-field">
                <label>Rating</label>
                <select value={tableFilters.rating} onChange={(e) => setTableFilters((p) => ({ ...p, rating: e.target.value }))}>
                  <option value="">Any</option>
                  <option value="4plus">4 &amp; above</option>
                  <option value="3plus">3 &amp; above</option>
                  <option value="below3">Below 3</option>
                </select>
              </div>
              <div className="table-filter-note">Batch, Course and Date Range are set in the main Mentor 360 filters and apply here too.</div>
              <button className="table-filter-clear" onClick={() => setTableFilters({ status: "", rating: "" })}>Clear these filters</button>
            </div>
          </>
        )}

        {drawerSession && <SessionDrawer session={drawerSession} onClose={() => setDrawerSession(null)} />}

        <style jsx global>{`
          body { position: relative; }
        `}</style>

        <style jsx>{`
          .back-link { display: inline-block; margin-bottom: 16px; color: #475569; font-size: 13px; text-decoration: none; font-weight: 600; }
          .back-link:hover { text-decoration: underline; }

          :global(.serif-title) { font-family: "Playfair Display", Georgia, serif; font-weight: 800; }

          .page-hero {
            position: relative; overflow: hidden; border-radius: 18px; padding: 26px 32px; margin-bottom: 16px;
            background: linear-gradient(120deg, #0f172a 0%, #1e293b 60%, #0f172a 100%);
            display: flex; align-items: center; justify-content: space-between; gap: 20px;
            box-shadow: 0 16px 32px -18px rgba(15, 23, 42, 0.55);
          }
          .page-hero-blob { position: absolute; width: 220px; height: 220px; border-radius: 50%; background: #f59e0b; filter: blur(60px); opacity: 0.3; top: -80px; right: 160px; }
          .page-hero-content { position: relative; z-index: 1; }
          .page-hero-eyebrow {
            display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
            color: #fbbf24; background: rgba(251, 191, 36, 0.12); border: 1px solid rgba(251, 191, 36, 0.3);
            padding: 5px 10px; border-radius: 999px; margin-bottom: 10px;
          }
          :global(.page-hero-title) { font-family: "Playfair Display", Georgia, serif; font-size: 26px; font-weight: 800; color: #f8fafc; margin: 0 0 6px; }
          .page-hero-subtitle { color: #94a3b8; font-size: 13.5px; margin: 0; max-width: 520px; }

          .page-hero-tagline {
            position: relative; z-index: 1; display: flex; align-items: center; gap: 8px;
            color: #fbbf24; font-family: "Caveat", "Brush Script MT", cursive;
            font-size: 22px; font-weight: 600; line-height: 1.1; text-align: right; opacity: 0.95; flex-shrink: 0;
            transform: rotate(-2deg);
          }
          .page-hero-right { position: relative; z-index: 2; display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
          .hero-clock { color: #cbd5e1; font-size: 11.5px; font-weight: 600; text-align: right; white-space: nowrap; }
          .hero-clock-time { display: block; color: #fbbf24; font-weight: 800; font-size: 13px; margin-top: 1px; }
          .header-item-wrap { position: relative; }
          .hero-icon-btn {
            width: 34px; height: 34px; border-radius: 9px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12);
            color: #cbd5e1; display: flex; align-items: center; justify-content: center; cursor: pointer;
          }
          .hero-icon-btn:hover { background: rgba(255,255,255,0.14); color: #fbbf24; }
          .hero-notif-dropdown {
            position: absolute; top: calc(100% + 10px); right: 0; min-width: 210px; background: #fff; border-radius: 12px;
            box-shadow: 0 16px 30px -14px rgba(0,0,0,0.35); padding: 10px; z-index: 30;
          }
          .hero-notif-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: #94a3b8; padding: 2px 4px 8px; }
          .hero-notif-empty { font-size: 12.5px; color: #94a3b8; padding: 4px; }
          .hero-avatar-img { width: 34px; height: 34px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
          .hero-avatar { width: 34px; height: 34px; border-radius: 50%; background: rgba(240,199,94,0.18); color: #fbbf24; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; flex-shrink: 0; }



          .range-select-wrap { position: relative; flex-shrink: 0; }
          .range-select-btn { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 7px 12px; font-size: 12px; font-weight: 700; color: #334155; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
          .range-select-btn:hover { background: #f1f5f9; }
          .range-backdrop { position: fixed; inset: 0; z-index: 25; }
          .range-select-menu { position: absolute; top: calc(100% + 6px); right: 0; background: #fff; border-radius: 10px; box-shadow: 0 16px 30px -14px rgba(0,0,0,0.35); padding: 6px; min-width: 170px; z-index: 30; }
          .range-select-item { display: block; width: 100%; box-sizing: border-box; text-align: left; background: none; border: none; padding: 8px 10px; font-size: 12.5px; font-weight: 600; color: #1e293b; border-radius: 7px; cursor: pointer; }
          .range-select-item:hover { background: #f1f5f9; }
          .range-select-item-active { background: #fef3c7; color: #b45309; }
          .range-select-custom { display: flex; align-items: center; gap: 6px; padding: 8px 6px 2px; border-top: 1px solid #f1f5f9; margin-top: 4px; }
          .range-select-custom input { flex: 1; min-width: 0; font-size: 11.5px; border: 1px solid #e2e8f0; border-radius: 6px; padding: 4px 6px; }
          .range-select-custom span { font-size: 11px; color: #94a3b8; }

          .card { background: #ffffff; border-radius: 14px; padding: 16px 18px; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06); border: 1px solid #eef2f7; margin-bottom: 14px; }
          :global(.card-title) { margin: 0; font-family: "Playfair Display", Georgia, serif; font-weight: 800; font-size: 15.5px; color: #1e293b; display: flex; align-items: center; gap: 10px; }
          :global(.card-sub) { font-size: 11px; color: #94a3b8; margin-top: 1px; font-family: Inter, -apple-system, sans-serif; }
          .card-header-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 2px; }
          .supplementary-tag { font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: none; }

          .profile-card { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; padding: 16px 20px; position: relative; z-index: 10; }
          .profile-details-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px 24px; margin-top: 14px; }
          .profile-details-close { background: none; border: none; font-size: 22px; line-height: 1; color: #94a3b8; cursor: pointer; }
          .profile-details-close:hover { color: #334155; }
          :global(.profile-details-link) { color: #2563eb; text-decoration: none; word-break: break-all; }
          :global(.profile-details-link:hover) { text-decoration: underline; }
          .profile-left { display: flex; align-items: center; gap: 14px; flex: 1; min-width: 260px; }
          .profile-avatar-img { width: 60px; height: 60px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
          .profile-avatar { width: 60px; height: 60px; border-radius: 50%; background: rgba(245,158,11,0.15); color: #b45309; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 800; flex-shrink: 0; }
          .profile-name-row { display: flex; align-items: center; gap: 10px; }
          :global(.profile-name) { margin: 0; font-family: "Playfair Display", Georgia, serif; font-weight: 800; font-size: 20px; color: #0f172a; }
          .profile-meta { font-size: 12.5px; color: #64748b; margin-top: 3px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
          .profile-meta-sep { color: #cbd5e1; }
          .profile-contact { font-size: 11.5px; color: #94a3b8; margin-top: 4px; display: flex; gap: 12px; }
          .profile-actions-col { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; flex-shrink: 0; }
          .profile-actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
          .profile-badges { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
          :global(.btn-view-profile) { cursor: pointer; background: #f1f5f9; color: #334155; border: 1px solid #e2e8f0; border-radius: 8px; padding: 7px 14px; font-size: 12.5px; font-weight: 700; text-decoration: none; }
          :global(.btn-view-profile:hover) { background: #e2e8f0; }

          .mini-table { width: 100%; border-collapse: collapse; font-size: 12px; }
          .mini-table thead th { text-align: left; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.03em; color: #94a3b8; font-weight: 700; padding: 4px 8px 6px 0; border-bottom: 1px solid #f1f5f9; }
          .mini-table td { padding: 7px 8px 7px 0; border-bottom: 1px solid #f8fafc; color: #334155; font-weight: 600; white-space: nowrap; }
          .mini-table tr:last-child td { border-bottom: none; }

          .btn-filters-shortcut { display: inline-flex; align-items: center; gap: 6px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0 12px; font-size: 12px; font-weight: 700; color: #334155; cursor: pointer; }
          .btn-filters-shortcut:hover { background: #f1f5f9; }
          .btn-filters-shortcut-active { background: #fef3c7; border-color: #fde68a; color: #b45309; }

          .table-filter-panel { background: #fff; border-radius: 12px; box-shadow: 0 16px 30px -14px rgba(0,0,0,0.35); padding: 14px; min-width: 220px; z-index: 300; }
          .table-filter-title { font-size: 11.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: #94a3b8; margin-bottom: 10px; }
          .table-filter-field { display: flex; flex-direction: column; gap: 5px; margin-bottom: 10px; }
          .table-filter-field label { font-size: 11px; font-weight: 700; color: #64748b; }
          .table-filter-field select { border: 1px solid #e2e8f0; border-radius: 8px; padding: 7px 9px; font-size: 12.5px; background: #f8fafc; outline: none; }
          .table-filter-note { font-size: 10.5px; color: #94a3b8; line-height: 1.4; margin-bottom: 10px; }
          .table-filter-clear { width: 100%; background: #f1f5f9; border: none; border-radius: 8px; padding: 8px; font-size: 12px; font-weight: 700; color: #334155; cursor: pointer; }
          .table-filter-clear:hover { background: #e2e8f0; }

          .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 14px; }

          .tab-bar { display: flex; gap: 20px; flex-wrap: wrap; background: #fff; border: 1px solid #eef2f7; border-radius: 12px; padding: 0 18px; margin-bottom: 14px; box-shadow: 0 1px 3px rgba(15,23,42,0.06); }
          .tab-btn { background: none; border: none; border-bottom: 2.5px solid transparent; padding: 12px 2px; font-size: 13px; font-weight: 700; color: #94a3b8; cursor: pointer; }
          .tab-btn:hover { color: #334155; }
          .tab-btn-active { color: #0f172a; border-bottom-color: #f59e0b; }

          .error-banner {
            display: flex; align-items: center; gap: 10px; background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c;
            padding: 10px 14px; border-radius: 10px; margin-bottom: 14px; font-size: 12.5px; font-weight: 600;
          }
          .error-banner span { flex: 1; }
          .btn-retry {
            display: inline-flex; align-items: center; gap: 6px; background: #fff; border: 1px solid #fecaca; color: #b91c1c;
            border-radius: 8px; padding: 6px 12px; font-size: 12px; font-weight: 700; cursor: pointer; flex-shrink: 0;
          }
          .btn-retry:hover { background: #fee2e2; }

          .grid-3a { display: grid; grid-template-columns: 1.3fr 1fr 1fr; gap: 14px; margin-bottom: 14px; }
          .grid-2a { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }

          .nps-row { display: flex; align-items: center; gap: 18px; }
          .nps-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 20px; font-weight: 800; color: #0f172a; text-align: center; pointer-events: none; }
          .nps-center span { font-size: 9px; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
          .nps-legend { display: flex; flex-direction: column; gap: 8px; font-size: 12.5px; color: #475569; font-weight: 600; }
          .nps-legend > div { display: flex; align-items: center; gap: 6px; }
          .nps-legend b { color: #0f172a; margin-left: 2px; }
          .nps-total { margin-top: 4px; padding-top: 8px; border-top: 1px solid #f1f5f9; }

          .attention-card { border-left: 3px solid #f59e0b; }
          .attention-list { display: flex; flex-direction: column; gap: 4px; }
          .attention-item { display: flex; gap: 10px; align-items: flex-start; padding: 9px 6px; border-radius: 8px; cursor: pointer; }
          .attention-item:hover { background: #f8fafc; }
          .attention-dot { width: 7px; height: 7px; border-radius: 50%; margin-top: 5px; flex-shrink: 0; }
          .attention-dot-red { background: #ef4444; }
          .attention-dot-amber { background: #f59e0b; }
          .attention-icon { width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; flex-shrink: 0; margin-top: 1px; }
          .attention-icon-red { background: rgba(239,68,68,0.14); color: #ef4444; }
          .attention-icon-amber { background: rgba(245,158,11,0.14); color: #b45309; }
          .attention-reason { font-size: 12.5px; font-weight: 700; color: #1e293b; }
          .attention-sub { font-size: 11px; color: #94a3b8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

          .view-all-link { background: none; border: none; color: #f59e0b; font-size: 12px; font-weight: 700; cursor: pointer; white-space: nowrap; }
          .view-all-link:hover { text-decoration: underline; }
          .attn-mini-row { display: flex; justify-content: space-between; font-size: 12.5px; color: #475569; font-weight: 600; margin-bottom: 4px; }
          .attn-mini-row b { color: #0f172a; }
          .attn-breakdown-mini { display: flex; flex-direction: column; gap: 6px; font-size: 11.5px; color: #475569; font-weight: 600; }
          .attn-breakdown-mini b { margin-left: auto; color: #0f172a; }
          .attn-breakdown-mini > div { display: flex; align-items: center; }

          .feedback-list { display: flex; flex-direction: column; gap: 14px; }
          .feedback-item { border-bottom: 1px solid #f1f5f9; padding-bottom: 12px; }
          .feedback-item:last-child { border-bottom: none; padding-bottom: 0; }
          .feedback-text { font-size: 13px; color: #334155; margin: 6px 0 4px; font-style: italic; }
          .feedback-meta { font-size: 11px; color: #94a3b8; }

          .legend-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 6px; }
          .attn-stats-row { display: flex; gap: 30px; margin-bottom: 6px; }
          .attn-stat-label { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px; }
          .attn-stat-value { font-size: 22px; font-weight: 800; color: #0f172a; }
          .attn-breakdown { display: flex; gap: 24px; font-size: 12.5px; color: #475569; font-weight: 600; flex-wrap: wrap; }
          .attn-breakdown b { margin-left: 4px; color: #0f172a; }

          .attendance-track { height: 8px; background: #f1f5f9; border-radius: 999px; overflow: hidden; }
          .attendance-fill { height: 100%; background: linear-gradient(90deg, #22c55e, #4ade80); border-radius: 999px; }
          .attendance-cell { display: flex; flex-direction: column; gap: 4px; min-width: 70px; }
          .attendance-cell .attendance-track { height: 5px; }

          .list-toolbar { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 14px; margin-bottom: 18px; }
          .search-wrap { position: relative; }
          .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); opacity: 0.45; }
          .search-input { width: 260px; padding: 9px 11px 9px 32px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 13px; background: #f8fafc; outline: none; box-sizing: border-box; }

          .table-wrap { overflow-x: auto; }
          .styled-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 1300px; }
          .styled-table thead th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: #94a3b8; font-weight: 700; padding: 10px 12px; border-bottom: 2px solid #f1f5f9; white-space: nowrap; }
          .styled-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #1e293b; white-space: nowrap; }
          .styled-table td.strong { font-weight: 700; }
          .styled-table td.muted { color: #94a3b8; }
          .styled-table td .strong { font-weight: 700; }
          .styled-table td .muted-sm { color: #94a3b8; font-size: 11px; margin-top: 2px; }

          .actions-cell { display: flex; align-items: center; gap: 6px; }
          .btn-view-details { background: #0f172a; color: #fff; border: none; padding: 7px 12px; font-size: 11.5px; font-weight: 700; border-radius: 8px; cursor: pointer; white-space: nowrap; }
          .btn-view-details:hover { background: #1e293b; }
          .btn-icon-only { background: #f1f5f9; border: none; width: 28px; height: 28px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #475569; }
          .btn-icon-only:hover { background: #e2e8f0; }
          .row-menu { background: #fff; border-radius: 10px; box-shadow: 0 16px 30px -14px rgba(0,0,0,0.35); padding: 6px; min-width: 170px; z-index: 300; }
          :global(.row-menu-item) { display: flex; align-items: center; gap: 8px; padding: 8px 9px; font-size: 12.5px; font-weight: 600; color: #1e293b; text-decoration: none; border-radius: 7px; border: none; background: none; width: 100%; box-sizing: border-box; cursor: pointer; text-align: left; }
          :global(.row-menu-item:hover) { background: #f1f5f9; }

          .pagination { display: flex; align-items: center; justify-content: center; gap: 16px; margin-top: 18px; }
          .page-info { font-size: 13px; color: #64748b; font-weight: 600; }
          .btn { border: none; border-radius: 10px; padding: 10px 18px; font-size: 13px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; text-decoration: none; }
          .btn-primary { background: linear-gradient(120deg, #f59e0b, #fbbf24); color: #0f172a; }
          .btn-ghost { background: #f1f5f9; color: #334155; }
          .btn-ghost:hover:not(:disabled) { background: #e2e8f0; }
          .btn:disabled { opacity: 0.45; cursor: not-allowed; }

          .filters-actions { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 14px; }
          .report-summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 4px 20px; }

          .dim-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 20px; }
          .dim-card { background: #fff; border-radius: 14px; padding: 18px 20px; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06); border: 1px solid #eef2f7; }
          .dim-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; color: #94a3b8; margin-bottom: 6px; }
          .dim-value { font-size: 26px; font-weight: 800; color: #0f172a; margin-bottom: 8px; }
          .dim-details { font-size: 12.5px; color: #64748b; display: flex; flex-direction: column; gap: 3px; }

          .empty-state { text-align: center; padding: 40px 20px; color: #94a3b8; font-size: 14px; }

          @media (max-width: 1300px) {
            .grid-3a { grid-template-columns: 1fr; }
            .grid-2a { grid-template-columns: 1fr; }
          }
        `}</style>
      </>
    </Guard>
  );
}

function QualityBar({ label, value, max = 5, note }) {
  const pct = value ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="quality-row">
      <div className="quality-row-top">
        <span className="quality-label">{label}</span>
        <span className="quality-value">{value ? `${value} / ${max}` : "Not Available"}</span>
      </div>
      <div className="quality-track"><div className="quality-fill" style={{ width: `${pct}%` }} /></div>
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

function OpBar({ label, value }) {
  if (value === null || value === undefined) {
    return (
      <div style={{ marginBottom: "14px", fontSize: "12.5px", color: "#94a3b8" }}>{label}: Not Available</div>
    );
  }
  const color = value >= 90 ? "#22c55e" : value >= 75 ? "#f59e0b" : "#ef4444";
  return (
    <div className="op-row">
      <div className="op-row-top"><span>{label}</span><b style={{ color }}>{value}%</b></div>
      <div className="op-track"><div className="op-fill" style={{ width: `${value}%`, background: color }} /></div>
      <style jsx>{`
        .op-row { margin-bottom: 14px; }
        .op-row-top { display: flex; justify-content: space-between; font-size: 12.5px; font-weight: 700; color: #334155; margin-bottom: 6px; }
        .op-track { height: 8px; background: #f1f5f9; border-radius: 999px; overflow: hidden; }
        .op-fill { height: 100%; border-radius: 999px; }
      `}</style>
    </div>
  );
}
