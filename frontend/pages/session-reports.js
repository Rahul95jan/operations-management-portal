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
  Chart as ChartJS,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Chart, Doughnut } from "react-chartjs-2";
import {
  Video,
  Users,
  CalendarClock,
  XCircle,
  CheckCircle2,
  Percent,
  Timer,
  Star,
  Search,
  MoreVertical,
  Download,
  FileText,
  ExternalLink,
  AlertTriangle,
  Sparkles,
  ChevronDown,
  RadioTower,
  SlidersHorizontal,
  Check,
  RotateCcw,
} from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler);

const API = "http://127.0.0.1:8000";

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

// Frontend-only thresholds for the Session Health rollup — no backend business
// logic changes; tune these if operations wants different cutoffs.
const HEALTH_THRESHOLDS = {
  lowAttendancePct: 60,
  lowRating: 3,
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

function KPICard({ icon: Icon, label, value, sub, color = "#0f172a" }) {
  return (
    <div className="kpi-tile">
      <div className="kpi-icon" style={{ background: `${color}1a`, color }}>
        <Icon size={17} strokeWidth={2.2} />
      </div>
      <div>
        <div className="kpi-value" style={{ color }}>{value}</div>
        <div className="kpi-label">{label}</div>
        {sub && <div className="kpi-sub">{sub}</div>}
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
};

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

function buildTrend(allRows) {
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toLocaleDateString("en-CA"));
  }
  const byDate = {};
  allRows.forEach((r) => {
    if (!r.session_date) return;
    if (!byDate[r.session_date]) byDate[r.session_date] = { count: 0, sum: 0, n: 0 };
    byDate[r.session_date].count += 1;
    if (r.attendance_percentage) {
      byDate[r.session_date].sum += r.attendance_percentage;
      byDate[r.session_date].n += 1;
    }
  });

  return {
    labels: days.map((d) => new Date(d).toLocaleDateString(undefined, { day: "2-digit", month: "short" })),
    counts: days.map((d) => (byDate[d] ? byDate[d].count : 0)),
    attendance: days.map((d) => (byDate[d] && byDate[d].n ? Math.round(byDate[d].sum / byDate[d].n) : null)),
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
  const [rows, setRows] = useState([]);
  const [allRows, setAllRows] = useState([]); // unpaginated, same filters — powers charts/health/insights
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [mentors, setMentors] = useState([]);
  const [batches, setBatches] = useState([]);
  const [npsFeedback, setNpsFeedback] = useState([]);

  const [filters, setFilters] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [search, setSearch] = useState("");

  const [sortBy, setSortBy] = useState("session_date");
  const [sortDir, setSortDir] = useState("desc");

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

    const listQuery = buildQuery({ ...appliedFilters, search, page, page_size: pageSize, sort_by: sortBy, sort_dir: sortDir });
    const summaryQuery = buildQuery(appliedFilters);
    const allQuery = buildQuery({ ...appliedFilters, search, page: 1, page_size: 1000, sort_by: sortBy, sort_dir: sortDir });

    Promise.all([
      fetch(`${API}/session-reports?${listQuery}`).then((r) => r.json()),
      fetch(`${API}/session-reports/summary?${summaryQuery}`).then((r) => r.json()),
      fetch(`${API}/session-reports?${allQuery}`).then((r) => r.json()),
    ])
      .then(([listData, summaryData, allData]) => {
        setRows(listData.items || []);
        setTotal(listData.total || 0);
        setSummary(summaryData);
        setAllRows(allData.items || []);
        setLastUpdated(new Date());
      })
      .catch(() => setError("Unable to reach the server."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [appliedFilters, search, page, sortBy, sortDir]);

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

  const clearFilters = () => {
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setSearch("");
    setPage(1);
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir("asc");
    }
  };

  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  const exportUrl = `${API}/session-reports/export?${buildQuery({ ...appliedFilters, search })}`;
  const exportAllUrl = `${API}/session-reports/export`;
  const exportPdfUrl = `${API}/session-reports/export/pdf?${buildQuery({ ...appliedFilters, search })}`;

  const sortIndicator = (field) => (sortBy === field ? (sortDir === "asc" ? " ▲" : " ▼") : "");

  const appliedFilterCount = Object.values(appliedFilters).filter((v) => v !== "").length + (search ? 1 : 0);

  const trend = useMemo(() => buildTrend(allRows), [allRows]);

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
    allRows.forEach((r) => {
      const c = classifySessionHealth(r);
      buckets[c.tier] += 1;
      if (c.tier !== "healthy") flagged.push({ ...r, reason: c.reason, tier: c.tier });
    });
    flagged.sort((a, b) => (a.tier === b.tier ? 0 : a.tier === "attention" ? -1 : 1));
    return { buckets, flagged };
  }, [allRows]);

  const insights = useMemo(() => {
    if (!allRows.length) return null;
    const mentorCounts = {};
    const batchAttendance = {};
    allRows.forEach((r) => {
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
  }, [allRows]);

  return (
    <ProtectedRoute>
      <>
        <Sidebar />

        <div style={{ marginLeft: "var(--om-sidebar-width, 280px)", transition: "margin-left 0.25s ease", padding: "32px 36px 60px", background: "#f1f5f9", minHeight: "100vh" }}>
          {/* Header */}
          <div className="page-hero">
            <div className="page-hero-blob" />
            <div className="page-hero-content">
              <div className="page-hero-eyebrow">Operations</div>
              <h1 className="page-hero-title">Session Reports</h1>
              <p className="page-hero-subtitle">
                Centralized session performance, attendance and operational monitoring.
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

          {/* KPI cards */}
          <div className="kpi-section-label">Session Overview</div>
          {summary ? (
            <div className="kpi-grid">
              <KPICard icon={CalendarClock} label="Total Sessions" value={summary.total_sessions} sub="All time" color="#0f172a" />
              <KPICard icon={RadioTower} label="Upcoming" value={summary.upcoming_sessions} sub="Scheduled sessions" color="#6366f1" />
              <KPICard icon={Video} label="Live" value={summary.live_sessions} sub="Currently live" color="#ef4444" />
              <KPICard icon={CheckCircle2} label="Completed" value={summary.completed_sessions} sub="Successfully completed" color="#16a34a" />
              <KPICard icon={XCircle} label="Cancelled" value={summary.cancelled_sessions} sub="Cancelled sessions" color="#64748b" />
            </div>
          ) : (
            <div className="kpi-grid">{[...Array(5)].map((_, i) => <KPISkeleton key={i} />)}</div>
          )}

          <div className="kpi-section-label" style={{ marginTop: "18px" }}>Performance</div>
          {summary ? (
            <div className="kpi-grid">
              <KPICard icon={Users} label="Learners Attended" value={summary.total_learners_attended} sub="Total learners" color="#2563eb" />
              <KPICard icon={Percent} label="Avg Attendance" value={`${summary.average_attendance_percentage}%`} sub="Across all sessions" color="#16a34a" />
              <KPICard icon={Timer} label="Avg Duration" value={`${summary.average_session_duration} min`} sub="Per session" color="#f59e0b" />
              <KPICard icon={Star} label="Avg Rating" value={summary.average_rating ? `${summary.average_rating} / 5` : "Not Available"} sub="Based on feedback" color="#a855f7" />
            </div>
          ) : (
            <div className="kpi-grid">{[...Array(4)].map((_, i) => <KPISkeleton key={i} />)}</div>
          )}

          {/* Filters */}
          <div className="card filters-card">
            <div className="card-header-row">
              <div className="filters-title-row">
                <div className="filters-icon"><SlidersHorizontal size={16} strokeWidth={2.3} /></div>
                <div>
                  <h2 className="card-title" style={{ margin: 0 }}>Filters</h2>
                  <div className="card-sub">Filter sessions — KPIs, charts and exports below all reflect your selection</div>
                </div>
              </div>
              {appliedFilterCount > 0 && <div className="filter-count-chip">{appliedFilterCount} filter{appliedFilterCount > 1 ? "s" : ""} applied</div>}
            </div>
            <div className="filters-grid">
              <div>
                <label className="field-label">Date From</label>
                <input type="date" style={inputStyle} value={filters.date_from} onChange={(e) => setFilters({ ...filters, date_from: e.target.value })} />
              </div>
              <div>
                <label className="field-label">Date To</label>
                <input type="date" style={inputStyle} value={filters.date_to} onChange={(e) => setFilters({ ...filters, date_to: e.target.value })} />
              </div>
              <div>
                <label className="field-label">Status</label>
                <select style={inputStyle} value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                  <option value="">All</option>
                  {Object.keys(STATUS_STYLES).map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="field-label">Mentor</label>
                <select style={inputStyle} value={filters.mentor_name} onChange={(e) => setFilters({ ...filters, mentor_name: e.target.value })}>
                  <option value="">All</option>
                  {mentors.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label className="field-label">Batch</label>
                <select style={inputStyle} value={filters.batch_name} onChange={(e) => setFilters({ ...filters, batch_name: e.target.value })}>
                  <option value="">All</option>
                  {batches.map((b) => <option key={b.id} value={b.batch_name}>{b.batch_name}</option>)}
                </select>
              </div>
            </div>

            <div className="filters-divider"><span>More Filters</span></div>

            <div className="filters-grid">
              <div>
                <label className="field-label">Course</label>
                <input placeholder="Course name" style={inputStyle} value={filters.course_name} onChange={(e) => setFilters({ ...filters, course_name: e.target.value })} />
              </div>
              <div>
                <label className="field-label">Session Type</label>
                <input placeholder="e.g. GenAI" style={inputStyle} value={filters.session_type} onChange={(e) => setFilters({ ...filters, session_type: e.target.value })} />
              </div>
              <div>
                <label className="field-label">Recording Status</label>
                <select style={inputStyle} value={filters.recording_status} onChange={(e) => setFilters({ ...filters, recording_status: e.target.value })}>
                  <option value="">All</option>
                  <option value="Available">Available</option>
                  <option value="Not Available">Not Available</option>
                </select>
              </div>
              <div>
                <label className="field-label">Report Status</label>
                <select style={inputStyle} value={filters.report_status} onChange={(e) => setFilters({ ...filters, report_status: e.target.value })}>
                  <option value="">All</option>
                  <option value="Pending">Pending</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Reviewed">Reviewed</option>
                </select>
              </div>
            </div>

            <div className="filters-actions">
              <button className="btn btn-primary" onClick={applyFilters}><Check size={14} strokeWidth={2.6} /> Apply Filters</button>
              <button className="btn btn-ghost" onClick={clearFilters}><RotateCcw size={14} strokeWidth={2.3} /> Clear Filters</button>
            </div>
          </div>

          {/* Trend + Quality + Health */}
          <div className="grid-3a">
            <div className="card">
              <div className="card-header-row">
                <div>
                  <h2 className="card-title" style={{ margin: 0 }}>Session &amp; Attendance Trend</h2>
                  <div className="card-sub">Sessions conducted vs learner attendance (last 30 days)</div>
                </div>
              </div>
              {allRows.length === 0 ? (
                <div className="empty-state" style={{ padding: "40px 0" }}>No session data in the selected range.</div>
              ) : (
                <div style={{ height: "230px" }}>
                  <Chart
                    type="bar"
                    data={{
                      labels: trend.labels,
                      datasets: [
                        { type: "bar", label: "Sessions Conducted", data: trend.counts, backgroundColor: "#3b82f6", borderRadius: 4, yAxisID: "y", barThickness: 10 },
                        { type: "line", label: "Attendance %", data: trend.attendance, borderColor: "#f59e0b", backgroundColor: "#f59e0b", tension: 0.35, pointRadius: 2, yAxisID: "y1", spanGaps: true },
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
            </div>

            <div className="card">
              <h2 className="card-title" style={{ margin: "0 0 2px" }}>Session Quality</h2>
              <div className="card-sub" style={{ marginBottom: "16px" }}>Based on learner feedback ({quality?.count || 0} responses)</div>
              <QualityBar label="Mentor Teaching Method" value={quality?.instructor} max={5} />
              <QualityBar label="Doubt Resolution" value={quality?.doubt} max={5} />
              <QualityBar label="Overall Experience (NPS)" value={quality?.nps} max={10} note="Matched by batch + mentor — not tied to a single session." />
            </div>

            <div className="card">
              <h2 className="card-title" style={{ margin: "0 0 14px" }}>Session Health</h2>
              {allRows.length === 0 ? (
                <div className="empty-state" style={{ padding: "20px 0" }}>No data yet.</div>
              ) : (
                <div className="health-row">
                  <div style={{ position: "relative", width: "110px", flexShrink: 0 }}>
                    <Doughnut
                      data={{
                        labels: ["Healthy", "Needs Review", "Attention"],
                        datasets: [{ data: [health.buckets.healthy, health.buckets.needsReview, health.buckets.attention], backgroundColor: ["#22c55e", "#f59e0b", "#ef4444"], borderWidth: 0 }],
                      }}
                      options={{ plugins: { legend: { display: false } }, cutout: "72%" }}
                    />
                    <div className="health-center">{allRows.length}<br /><span>Total Sessions</span></div>
                  </div>
                  <div className="health-legend">
                    <div><span className="legend-dot" style={{ background: "#22c55e" }} /> Healthy <b>{health.buckets.healthy}</b></div>
                    <div><span className="legend-dot" style={{ background: "#f59e0b" }} /> Needs Review <b>{health.buckets.needsReview}</b></div>
                    <div><span className="legend-dot" style={{ background: "#ef4444" }} /> Attention <b>{health.buckets.attention}</b></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Table + side column */}
          <div className="grid-table-side">
            <div className="card">
              <div className="list-toolbar">
                <div>
                  <h2 className="card-title" style={{ margin: 0 }}>All Session Reports</h2>
                  <div className="card-sub">View, search and manage all session reports</div>
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
                  <table className="styled-table">
                    <thead>
                      <tr>
                        <th onClick={() => toggleSort("id")} className="sortable">Session{sortIndicator("id")}</th>
                        <th onClick={() => toggleSort("session_date")} className="sortable">Date &amp; Time{sortIndicator("session_date")}</th>
                        <th>Mentor</th>
                        <th>Batch</th>
                        <th>Course</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Learners</th>
                        <th>Attendance</th>
                        <th>Attendance %</th>
                        <th>Rating</th>
                        <th>Recording</th>
                        <th>Report</th>
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
                            <td>{r.batch_name || "—"}</td>
                            <td className="muted">{r.course_name || "—"}</td>
                            <td className="muted">{r.session_type || "—"}</td>
                            <td><Badge label={r.status} styles={STATUS_STYLES} /></td>
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
                <div className="side-header">
                  <h3 className="card-title" style={{ margin: 0, fontSize: "14.5px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <AlertTriangle size={15} color="#f59e0b" /> Requires Attention
                  </h3>
                </div>
                {health.flagged.length === 0 ? (
                  <div className="empty-state" style={{ padding: "16px 0", fontSize: "12.5px" }}>Nothing needs attention right now.</div>
                ) : (
                  <div className="attention-list">
                    {health.flagged.slice(0, 6).map((r) => (
                      <div key={r.id} className="attention-item" onClick={() => setDrawerSession(r)}>
                        <span className={`attention-dot ${r.tier === "attention" ? "attention-dot-red" : "attention-dot-amber"}`} />
                        <div style={{ minWidth: 0 }}>
                          <div className="attention-reason">{r.reason}</div>
                          <div className="attention-sub">{r.topic} · {r.batch_name || "No batch"}</div>
                        </div>
                      </div>
                    ))}
                    {health.flagged.length > 6 && <div className="attention-more">+{health.flagged.length - 6} more</div>}
                  </div>
                )}
              </div>

              <div className="card" style={{ marginTop: "16px" }}>
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

          .grid-3a { display: grid; grid-template-columns: 1.3fr 1fr 1fr; gap: 16px; margin-top: 20px; }
          .grid-table-side { display: grid; grid-template-columns: 1fr 300px; gap: 16px; margin-top: 20px; align-items: start; }
          .side-col { display: flex; flex-direction: column; }

          .card {
            background: #ffffff;
            border-radius: 16px;
            padding: 22px 24px;
            box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
            border: 1px solid #eef2f7;
          }
          .card-title { margin: 0 0 4px; font-size: 16px; color: #1e293b; }
          .card-sub { font-size: 12px; color: #94a3b8; }
          .card-header-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 16px; }

          .health-row { display: flex; align-items: center; gap: 18px; }
          .health-center {
            position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;
            font-size: 20px; font-weight: 800; color: #0f172a; text-align: center; pointer-events: none;
          }
          .health-center span { font-size: 9px; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
          .health-legend { display: flex; flex-direction: column; gap: 8px; font-size: 12.5px; color: #475569; font-weight: 600; }
          .health-legend b { color: #0f172a; margin-left: 4px; }
          .legend-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 6px; }

          .filter-count-chip { background: #fef3c7; color: #b45309; font-size: 11.5px; font-weight: 700; padding: 5px 10px; border-radius: 999px; white-space: nowrap; flex-shrink: 0; }

          .filters-card {
            margin-bottom: 20px;
            border-top: 3px solid #fbbf24;
          }

          .filters-title-row { display: flex; align-items: flex-start; gap: 12px; }
          .filters-icon {
            width: 34px; height: 34px; border-radius: 9px; flex-shrink: 0;
            background: rgba(245, 158, 11, 0.12); color: #b45309;
            display: flex; align-items: center; justify-content: center;
          }

          .filters-divider {
            display: flex; align-items: center; gap: 10px;
            margin: 18px 0 14px; font-size: 10.5px; font-weight: 800; text-transform: uppercase;
            letter-spacing: 0.05em; color: #94a3b8;
          }
          .filters-divider::before, .filters-divider::after {
            content: ""; flex: 1; height: 1px; background: #f1f5f9;
          }

          .filters-actions { margin-top: 18px; display: flex; gap: 12px; }
          .filters-actions :global(svg) { flex-shrink: 0; }

          .field-label {
            display: block;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.03em;
            text-transform: uppercase;
            color: #64748b;
            margin-bottom: 6px;
          }

          .filters-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
            gap: 14px;
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
          .styled-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 1600px; }
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
          .attention-item { display: flex; gap: 9px; align-items: flex-start; padding: 9px 6px; border-radius: 8px; cursor: pointer; }
          .attention-item:hover { background: #f8fafc; }
          .attention-dot { width: 7px; height: 7px; border-radius: 50%; margin-top: 5px; flex-shrink: 0; }
          .attention-dot-red { background: #ef4444; }
          .attention-dot-amber { background: #f59e0b; }
          .attention-reason { font-size: 12.5px; font-weight: 700; color: #1e293b; }
          .attention-sub { font-size: 11px; color: #94a3b8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .attention-more { font-size: 11.5px; color: #94a3b8; padding: 6px; font-weight: 600; }

          .insights-list { margin: 0; padding-left: 18px; font-size: 12.5px; color: #334155; line-height: 1.9; }

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
            .grid-3a { grid-template-columns: 1fr; }
            .grid-table-side { grid-template-columns: 1fr; }
          }
        `}</style>
      </>
    </ProtectedRoute>
  );
}
