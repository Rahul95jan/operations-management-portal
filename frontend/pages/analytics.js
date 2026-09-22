import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import ProtectedRoute from "../components/ProtectedRoute";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler);

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const EMPTY_FILTERS = { date_from: "", date_to: "", batch_name: "", mentor_name: "", session_type: "" };

function unique(list) {
  return [...new Set(list.filter(Boolean))].sort();
}

function round1(n) {
  return Math.round((n + Number.EPSILON) * 10) / 10;
}

function sessionDt(s) {
  if (!s.session_date) return null;
  const d = new Date(`${s.session_date}T${s.session_time || "00:00"}`);
  return isNaN(d.getTime()) ? null : d;
}

function avg(list) {
  if (!list.length) return null;
  return list.reduce((a, b) => a + b, 0) / list.length;
}

function KPI({ icon, value, label, color, bg }) {
  return (
    <div className="kpi-card">
      <div className="kpi-icon" style={{ background: bg, color }}>{icon}</div>
      <div>
        <div className="kpi-value">{value}</div>
        <div className="kpi-label">{label}</div>
      </div>
    </div>
  );
}

function Section({ icon, title, subtitle, children, action }) {
  return (
    <div className="section">
      <div className="section-header">
        <h2 className="section-title"><span>{icon}</span> {title}</h2>
        {action}
      </div>
      {subtitle && <p className="section-subtitle">{subtitle}</p>}
      {children}
    </div>
  );
}

function Card({ title, children, style }) {
  return (
    <div className="card" style={style}>
      {title && <div className="card-title">{title}</div>}
      {children}
    </div>
  );
}

function BarRow({ label, value, max, color }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="bar-row">
      <div className="bar-row-label">{label}</div>
      <div className="bar-row-track">
        <div className="bar-row-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="bar-row-value">{value}</div>
    </div>
  );
}

const HEALTH_COLORS = { Healthy: "#22c55e", "At Risk": "#ef4444", "Not Enough Data": "#94a3b8" };

const chartFont = { family: "inherit", size: 11 };

export default function Analytics() {
  const [sessions, setSessions] = useState([]);
  const [batches, setBatches] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [npsResponses, setNpsResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/sessions`).then((r) => r.json()).catch(() => []),
      fetch(`${API}/batches`).then((r) => r.json()).catch(() => []),
      fetch(`${API}/mentors`).then((r) => r.json()).catch(() => []),
      fetch(`${API}/nps`).then((r) => r.json()).catch(() => []),
    ]).then(([s, b, m, n]) => {
      setSessions(Array.isArray(s) ? s : []);
      setBatches(Array.isArray(b) ? b : []);
      setMentors(Array.isArray(m) ? m : []);
      setNpsResponses(Array.isArray(n) ? n : []);
      setLoading(false);
    });
  }, []);

  const batchOptions = useMemo(() => unique(batches.map((b) => b.batch_name)), [batches]);
  const mentorOptions = useMemo(() => unique(mentors.map((m) => m.name)), [mentors]);
  const hasActiveFilter = Object.values(filters).some(Boolean);
  const clearFilters = () => setFilters(EMPTY_FILTERS);

  // ---- Filtered sessions (every downstream metric derives from this) ----
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (filters.date_from && s.session_date && s.session_date < filters.date_from) return false;
      if (filters.date_to && s.session_date && s.session_date > filters.date_to) return false;
      if (filters.batch_name && s.batch_name !== filters.batch_name) return false;
      if (filters.mentor_name && s.mentor_name !== filters.mentor_name) return false;
      if (filters.session_type && (s.session_type || "Live Session") !== filters.session_type) return false;
      return true;
    });
  }, [sessions, filters]);

  const filteredNps = useMemo(() => {
    return npsResponses.filter((n) => {
      if (filters.batch_name && n.batch_name !== filters.batch_name) return false;
      if (filters.mentor_name && n.mentor_name !== filters.mentor_name) return false;
      if (filters.date_from && n.created_at && n.created_at.slice(0, 10) < filters.date_from) return false;
      if (filters.date_to && n.created_at && n.created_at.slice(0, 10) > filters.date_to) return false;
      return true;
    });
  }, [npsResponses, filters]);

  // ================= Executive / Session metrics =================
  const nowMs = Date.now();
  const totalSessions = filteredSessions.length;
  const completedSessions = filteredSessions.filter((s) => s.status === "Completed").length;
  const cancelledSessions = filteredSessions.filter((s) => s.status === "Cancelled").length;
  const upcomingSessions = filteredSessions.filter((s) => {
    const dt = sessionDt(s);
    return s.status === "Scheduled" && dt && dt.getTime() > nowMs;
  }).length;
  const rescheduledSessions = filteredSessions.filter((s) => (s.remarks || "").includes("Rescheduled from")).length;

  const totalSessionMinutes = filteredSessions.reduce((sum, s) => sum + (Number(s.duration) || 0), 0);
  const sessionsWithDuration = filteredSessions.filter((s) => Number(s.duration) > 0).length;
  const avgDurationHours = sessionsWithDuration ? totalSessionMinutes / sessionsWithDuration / 60 : null;

  const sessionsWithAttendance = filteredSessions.filter((s) => Number(s.registered_students) > 0);
  const avgAttendance = avg(sessionsWithAttendance.map((s) => Number(s.attendance_percentage) || 0));

  const sessionsWithFeedback = filteredSessions.filter((s) => Number(s.feedback_score) > 0);
  const avgSessionRating = avg(sessionsWithFeedback.map((s) => Number(s.feedback_score)));

  const mentorSLA = totalSessions ? ((totalSessions - cancelledSessions) / totalSessions) * 100 : null;
  const completionRate = totalSessions ? (completedSessions / totalSessions) * 100 : 0;

  const totalMentors = mentors.length;
  const activeMentors = mentors.filter((m) => m.status !== "Inactive").length;
  const totalBatches = batches.length;
  const activeBatches = batches.filter((b) => b.status !== "Inactive").length;

  // ================= Session Trend (real, grouped by date) =================
  const sessionTrend = useMemo(() => {
    const byDate = {};
    filteredSessions.forEach((s) => {
      if (!s.session_date) return;
      if (!byDate[s.session_date]) byDate[s.session_date] = { completed: 0, cancelled: 0, upcoming: 0 };
      const dt = sessionDt(s);
      if (s.status === "Completed") byDate[s.session_date].completed += 1;
      else if (s.status === "Cancelled") byDate[s.session_date].cancelled += 1;
      else if (dt && dt.getTime() > nowMs) byDate[s.session_date].upcoming += 1;
    });
    return Object.keys(byDate).sort().map((date) => ({ date, ...byDate[date] }));
  }, [filteredSessions, nowMs]);

  // ================= Session Type breakdown (real 2 categories) =================
  const sessionTypeBreakdown = useMemo(() => {
    const map = {};
    filteredSessions.forEach((s) => {
      const t = s.session_type || "Live Session";
      map[t] = (map[t] || 0) + 1;
    });
    return Object.entries(map).map(([type, count]) => ({ type, count }));
  }, [filteredSessions]);

  // ================= Session Issues (all real, existing fields) =================
  const sessionIssues = useMemo(() => {
    const noMentor = filteredSessions.filter((s) => !s.mentor_name).length;
    const lowAttendance = filteredSessions.filter((s) => Number(s.registered_students) > 0 && Number(s.attendance_percentage) < 50).length;
    const lowRating = filteredSessions.filter((s) => Number(s.feedback_score) > 0 && Number(s.feedback_score) < 3).length;
    const missingRecording = filteredSessions.filter((s) => s.status === "Completed" && !s.recording_link).length;
    const missingFeedback = filteredSessions.filter((s) => s.status === "Completed" && !(Number(s.feedback_score) > 0)).length;
    return [
      { label: "Sessions without mentor", value: noMentor },
      { label: "Low attendance (< 50%)", value: lowAttendance },
      { label: "Low rating (< 3.0)", value: lowRating },
      { label: "Missing recording", value: missingRecording },
      { label: "Missing feedback", value: missingFeedback },
    ].filter((i) => i.value > 0);
  }, [filteredSessions]);

  // ================= Mentor Analytics (real, from sessions + nps) =================
  const mentorStats = useMemo(() => {
    return mentors.map((m) => {
      const mSessions = filteredSessions.filter((s) => s.mentor_name === m.name);
      const hours = mSessions.reduce((sum, s) => sum + (Number(s.duration) || 0), 0) / 60;
      const attendanceList = mSessions.filter((s) => Number(s.registered_students) > 0).map((s) => Number(s.attendance_percentage) || 0);
      const npsForMentor = filteredNps.filter((n) => n.mentor_name === m.name);
      const teaching = avg(npsForMentor.map((n) => n.instructor_rating));
      const doubt = avg(npsForMentor.map((n) => n.doubt_rating));
      const overall = avg(npsForMentor.map((n) => (n.instructor_rating + n.doubt_rating + n.website_rating) / 3));
      const nonCancelled = mSessions.filter((s) => s.status !== "Cancelled").length;
      const sla = mSessions.length ? (nonCancelled / mSessions.length) * 100 : null;
      return {
        name: m.name,
        sessions: mSessions.length,
        hours: round1(hours),
        attendance: avg(attendanceList),
        teaching,
        doubt,
        overall,
        sla,
      };
    }).filter((m) => !filters.mentor_name || m.name === filters.mentor_name);
  }, [mentors, filteredSessions, filteredNps, filters.mentor_name]);

  const topMentorsBySessions = useMemo(
    () => [...mentorStats].sort((a, b) => b.sessions - a.sessions).slice(0, 5),
    [mentorStats]
  );

  const sessionsConducted = mentorStats.reduce((sum, m) => sum + m.sessions, 0);
  const totalMentorHours = round1(mentorStats.reduce((sum, m) => sum + m.hours, 0));
  const mentorAvgRating = avg(mentorStats.map((m) => m.overall).filter((v) => v !== null));
  const mentorAvgAttendance = avg(mentorStats.map((m) => m.attendance).filter((v) => v !== null));
  const mentorAvgSLA = avg(mentorStats.map((m) => m.sla).filter((v) => v !== null));

  // ================= Batch Analytics (reuses the Batches page's real health methodology) =================
  const batchStats = useMemo(() => {
    return batches
      .filter((b) => !filters.batch_name || b.batch_name === filters.batch_name)
      .map((b) => {
        const bSessions = b.batch_name ? filteredSessions.filter((s) => s.batch_name === b.batch_name) : [];
        const withReg = bSessions.filter((s) => Number(s.registered_students) > 0);
        const attendance = avg(withReg.map((s) => Number(s.attendance_percentage) || 0));
        const completionSessions = withReg.filter((s) => s.assignment_given);
        const completion = completionSessions.length
          ? avg(completionSessions.map((s) => (Number(s.assignment_completed) || 0) / Number(s.registered_students) * 100))
          : null;
        const health = withReg.length === 0 ? "Not Enough Data" : attendance >= 75 ? "Healthy" : "At Risk";
        const npsForBatch = filteredNps.filter((n) => n.batch_name === b.batch_name);
        const rating = avg(npsForBatch.map((n) => (n.instructor_rating + n.doubt_rating + n.website_rating) / 3));
        const completedCount = bSessions.filter((s) => s.status === "Completed").length;
        const allDone = bSessions.length > 0 && bSessions.every((s) => s.status !== "Scheduled");
        return {
          batch_name: b.batch_name || "Untitled",
          mentor_name: b.mentor_name || "Not Assigned",
          sessions: bSessions.length,
          completedCount,
          attendance,
          rating,
          completion,
          health,
          status: allDone ? "Completed" : b.status === "Inactive" ? "Inactive" : "Active",
        };
      });
  }, [batches, filteredSessions, filteredNps, filters.batch_name]);

  const completedBatches = batchStats.filter((b) => b.status === "Completed").length;
  const batchTotalSessions = batchStats.reduce((sum, b) => sum + b.sessions, 0);
  const batchAvgAttendance = avg(batchStats.map((b) => b.attendance).filter((v) => v !== null));
  const batchAvgRating = avg(batchStats.map((b) => b.rating).filter((v) => v !== null));
  const batchAvgCompletion = avg(batchStats.map((b) => b.completion).filter((v) => v !== null));
  const healthCounts = useMemo(() => {
    const c = { Healthy: 0, "At Risk": 0, "Not Enough Data": 0 };
    batchStats.forEach((b) => { c[b.health] += 1; });
    return c;
  }, [batchStats]);

  // ================= Session Feedback Analytics (real, from /nps) =================
  const npsWithOverall = useMemo(
    () => filteredNps.map((n) => ({ ...n, overall: (n.instructor_rating + n.doubt_rating + n.website_rating) / 3 })),
    [filteredNps]
  );
  const feedbackResponses = npsWithOverall.length;
  const avgTeaching = avg(npsWithOverall.map((n) => n.instructor_rating));
  const avgDoubt = avg(npsWithOverall.map((n) => n.doubt_rating));
  const avgOverallExp = avg(npsWithOverall.map((n) => n.website_rating));
  const avgOverallRating = avg(npsWithOverall.map((n) => n.overall));
  const positivePct = feedbackResponses ? (npsWithOverall.filter((n) => n.nps_score >= 9).length / feedbackResponses) * 100 : 0;
  const negativePct = feedbackResponses ? (npsWithOverall.filter((n) => n.nps_score <= 6).length / feedbackResponses) * 100 : 0;

  const ratingDistribution = useMemo(() => {
    const buckets = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    npsWithOverall.forEach((n) => {
      const star = Math.min(5, Math.max(1, Math.round(n.overall)));
      buckets[star] += 1;
    });
    const total = feedbackResponses || 1;
    return [5, 4, 3, 2, 1].map((star) => ({ star, count: buckets[star], pct: Math.round((buckets[star] / total) * 100) }));
  }, [npsWithOverall, feedbackResponses]);

  const ratingTrend = useMemo(() => {
    const byDate = {};
    npsWithOverall.forEach((n) => {
      const date = (n.created_at || "").slice(0, 10);
      if (!date) return;
      if (!byDate[date]) byDate[date] = { teaching: [], doubt: [], overall: [] };
      byDate[date].teaching.push(n.instructor_rating);
      byDate[date].doubt.push(n.doubt_rating);
      byDate[date].overall.push(n.overall);
    });
    return Object.keys(byDate).sort().map((date) => ({
      date,
      teaching: round1(avg(byDate[date].teaching)),
      doubt: round1(avg(byDate[date].doubt)),
      overall: round1(avg(byDate[date].overall)),
    }));
  }, [npsWithOverall]);

  const recentNegativeFeedback = useMemo(() => {
    return npsWithOverall
      .filter((n) => n.overall <= 2.5 && n.feedback)
      .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))
      .slice(0, 5);
  }, [npsWithOverall]);

  // ================= Attendance Analytics (real, from Session aggregate fields) =================
  const totalRegistrations = filteredSessions.reduce((sum, s) => sum + (Number(s.registered_students) || 0), 0);
  const totalAttendees = filteredSessions.reduce((sum, s) => sum + (Number(s.attended_students) || 0), 0);
  const noShowRate = totalRegistrations ? ((totalRegistrations - totalAttendees) / totalRegistrations) * 100 : null;

  const attendanceTrend = useMemo(() => {
    const byDate = {};
    sessionsWithAttendance.forEach((s) => {
      if (!s.session_date) return;
      if (!byDate[s.session_date]) byDate[s.session_date] = [];
      byDate[s.session_date].push(Number(s.attendance_percentage) || 0);
    });
    return Object.keys(byDate).sort().map((date) => ({ date, attendance: round1(avg(byDate[date])) }));
  }, [sessionsWithAttendance]);

  const attendanceBySessionType = useMemo(() => {
    const map = {};
    sessionsWithAttendance.forEach((s) => {
      const t = s.session_type || "Live Session";
      if (!map[t]) map[t] = [];
      map[t].push(Number(s.attendance_percentage) || 0);
    });
    return Object.entries(map).map(([type, list]) => ({ type, attendance: round1(avg(list)) }));
  }, [sessionsWithAttendance]);

  const attendanceByMentorTop5 = useMemo(
    () => [...mentorStats].filter((m) => m.attendance !== null).sort((a, b) => b.attendance - a.attendance).slice(0, 5),
    [mentorStats]
  );

  const lowAttendanceSessions = useMemo(
    () => sessionsWithAttendance.filter((s) => Number(s.attendance_percentage) < 60).sort((a, b) => (a.attendance_percentage || 0) - (b.attendance_percentage || 0)).slice(0, 6),
    [sessionsWithAttendance]
  );

  const exportUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.date_from) params.set("date_from", filters.date_from);
    if (filters.date_to) params.set("date_to", filters.date_to);
    if (filters.batch_name) params.set("batch_name", filters.batch_name);
    if (filters.mentor_name) params.set("mentor_name", filters.mentor_name);
    if (filters.session_type) params.set("session_type", filters.session_type);
    const qs = params.toString();
    return `${API}/export-analytics-report${qs ? `?${qs}` : ""}`;
  }, [filters]);

  const fmtPct = (v) => (v === null || v === undefined || isNaN(v) ? "—" : `${Math.round(v)}%`);
  const fmt1 = (v) => (v === null || v === undefined || isNaN(v) ? "—" : round1(v));

  if (loading) {
    return (
      <ProtectedRoute>
        <>
          <Sidebar />
          <div style={{ marginLeft: "var(--om-sidebar-width, 280px)", transition: "margin-left 0.25s ease", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "14px", background: "#f1f5f9" }}>
            <div className="spinner" />
            <div style={{ color: "#64748b", fontSize: "14px" }}>Loading analytics…</div>
          </div>
          <style jsx>{`
            .spinner { width: 36px; height: 36px; border-radius: 50%; border: 3px solid #e2e8f0; border-top-color: #f59e0b; animation: spin 0.8s linear infinite; }
            @keyframes spin { to { transform: rotate(360deg); } }
          `}</style>
        </>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <>
        <Sidebar />
        <div style={{ marginLeft: "var(--om-sidebar-width, 280px)", transition: "margin-left 0.25s ease", padding: "32px 36px 60px", background: "#f1f5f9", minHeight: "100vh" }}>
          {/* Header */}
          <div className="top-header">
            <div>
              <h1 className="page-title"><span className="page-title-icon">📊</span> Analytics</h1>
              <p className="page-subtitle">Insights for better decisions. Track sessions, mentors and batches performance.</p>
            </div>
            <a href={exportUrl} target="_blank" rel="noreferrer" className="btn-export-report">⬇ Export Report</a>
          </div>

          {/* Filter bar */}
          <div className="filter-bar">
            <div className="date-range-field">
              <input type="date" className="filter-input" value={filters.date_from} onChange={(e) => setFilters({ ...filters, date_from: e.target.value })} />
              <span className="muted">–</span>
              <input type="date" className="filter-input" value={filters.date_to} onChange={(e) => setFilters({ ...filters, date_to: e.target.value })} />
            </div>
            <select className="filter-input" value={filters.batch_name} onChange={(e) => setFilters({ ...filters, batch_name: e.target.value })}>
              <option value="">All Batches</option>
              {batchOptions.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            <select className="filter-input" value={filters.mentor_name} onChange={(e) => setFilters({ ...filters, mentor_name: e.target.value })}>
              <option value="">All Mentors</option>
              {mentorOptions.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <select className="filter-input" value={filters.session_type} onChange={(e) => setFilters({ ...filters, session_type: e.target.value })}>
              <option value="">All Session Types</option>
              <option value="Live Session">Live Session</option>
              <option value="Webinar Session">Webinar Session</option>
            </select>
            {hasActiveFilter && (
              <button className="btn-reset" onClick={clearFilters}>↺ Reset Filters</button>
            )}
          </div>

          {/* Executive Operations Summary */}
          <Section icon="🧭" title="Executive Operations Summary" subtitle="Key metrics at a glance">
            <div className="exec-row">
              <div className="kpi-grid kpi-grid-exec">
                <KPI icon="📅" value={totalSessions} label="Total Sessions" color="#2563eb" bg="#dbeafe" />
                <KPI icon="✅" value={completedSessions} label="Completed" color="#16a34a" bg="#dcfce7" />
                <KPI icon="❌" value={cancelledSessions} label="Cancelled" color="#dc2626" bg="#fee2e2" />
                <KPI icon="📆" value={upcomingSessions} label="Upcoming" color="#0891b2" bg="#e0f2fe" />
                <KPI icon="🧑‍🏫" value={totalMentors} label="Total Mentors" color="#ea580c" bg="#ffedd5" />
                <KPI icon="🟢" value={activeMentors} label="Active Mentors" color="#16a34a" bg="#dcfce7" />
                <KPI icon="🎓" value={totalBatches} label="Total Batches" color="#7c3aed" bg="#ede9fe" />
                <KPI icon="📦" value={activeBatches} label="Active Batches" color="#16a34a" bg="#dcfce7" />
                <KPI icon="⏱️" value={`${round1(totalSessionMinutes / 60)}h`} label="Total Session Hours" color="#0891b2" bg="#e0f2fe" />
                <KPI icon="👥" value={fmtPct(avgAttendance)} label="Avg Attendance" color="#7c3aed" bg="#ede9fe" />
                <KPI icon="⭐" value={avgSessionRating === null ? "—" : `${fmt1(avgSessionRating)} / 5`} label="Avg Session Rating" color="#eab308" bg="#fef9c3" />
                <KPI icon="🛡️" value={fmtPct(mentorSLA)} label="Mentor SLA" color="#059669" bg="#d1fae5" />
              </div>
              <div className="progress-banner">
                <div className="progress-banner-title">🏆 Current Standing</div>
                <div className="progress-banner-text">Session completion rate is <b>{Math.round(completionRate)}%</b> so far{hasActiveFilter ? " for the selected filters" : ""}.</div>
              </div>
            </div>
          </Section>

          {/* Session Analytics */}
          <Section icon="📅" title="Session Analytics" subtitle="Track session trends, status and performance">
            <div className="kpi-grid kpi-grid-4">
              <KPI icon="📅" value={totalSessions} label="Total Sessions" color="#2563eb" bg="#dbeafe" />
              <KPI icon="✅" value={completedSessions} label="Completed" color="#16a34a" bg="#dcfce7" />
              <KPI icon="❌" value={cancelledSessions} label="Cancelled" color="#dc2626" bg="#fee2e2" />
              <KPI icon="🔁" value={rescheduledSessions} label="Rescheduled" color="#8b5cf6" bg="#ede9fe" />
              <KPI icon="📆" value={upcomingSessions} label="Upcoming" color="#0891b2" bg="#e0f2fe" />
              <KPI icon="⏱️" value={`${round1(totalSessionMinutes / 60)}h`} label="Total Hours" color="#eab308" bg="#fef9c3" />
              <KPI icon="⏳" value={avgDurationHours === null ? "—" : `${fmt1(avgDurationHours)}h`} label="Avg Duration" color="#0891b2" bg="#e0f2fe" />
              <KPI icon="👥" value={fmtPct(avgAttendance)} label="Avg Attendance" color="#7c3aed" bg="#ede9fe" />
            </div>

            <div className="grid-4col">
              <Card title="Session Trend" style={{ gridColumn: "span 2" }}>
                {sessionTrend.length === 0 ? <EmptyChart /> : (
                  <Line
                    data={{
                      labels: sessionTrend.map((d) => d.date.slice(5)),
                      datasets: [
                        { label: "Completed", data: sessionTrend.map((d) => d.completed), borderColor: "#22c55e", backgroundColor: "#22c55e33", tension: 0.35 },
                        { label: "Cancelled", data: sessionTrend.map((d) => d.cancelled), borderColor: "#ef4444", backgroundColor: "#ef444433", tension: 0.35 },
                        { label: "Upcoming", data: sessionTrend.map((d) => d.upcoming), borderColor: "#3b82f6", backgroundColor: "#3b82f633", tension: 0.35 },
                      ],
                    }}
                    options={{ responsive: true, plugins: { legend: { position: "top", labels: { font: chartFont } } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }}
                    height={110}
                  />
                )}
              </Card>

              <Card title="Session Status">
                {totalSessions === 0 ? <EmptyChart /> : (
                  <Doughnut
                    data={{
                      labels: ["Completed", "Upcoming", "Cancelled", "Rescheduled"],
                      datasets: [{ data: [completedSessions, upcomingSessions, cancelledSessions, rescheduledSessions], backgroundColor: ["#22c55e", "#3b82f6", "#ef4444", "#eab308"] }],
                    }}
                    options={{ plugins: { legend: { position: "bottom", labels: { font: chartFont, boxWidth: 10 } } } }}
                    height={140}
                  />
                )}
                <div className="donut-center-label">{totalSessions}<br /><span>Sessions</span></div>
              </Card>

              <Card title="Session Type">
                {sessionTypeBreakdown.map((t) => (
                  <BarRow key={t.type} label={t.type} value={t.count} max={totalSessions} color="#6366f1" />
                ))}
              </Card>
            </div>

            {sessionIssues.length > 0 && (
              <Card title="⚠️ Session Issues">
                <div className="issues-grid">
                  {sessionIssues.map((issue) => (
                    <div key={issue.label} className="issue-row">
                      <span className="issue-icon">⚠️</span>
                      <span>{issue.value} {issue.label}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </Section>

          {/* Mentor Analytics */}
          <Section icon="🧑‍🏫" title="Mentor Analytics" subtitle="Track mentor performance, ratings and engagement">
            <div className="kpi-grid kpi-grid-4">
              <KPI icon="🧑‍🏫" value={totalMentors} label="Total Mentors" color="#7c3aed" bg="#ede9fe" />
              <KPI icon="🟢" value={activeMentors} label="Active Mentors" color="#16a34a" bg="#dcfce7" />
              <KPI icon="📅" value={sessionsConducted} label="Sessions Conducted" color="#2563eb" bg="#dbeafe" />
              <KPI icon="⏱️" value={`${totalMentorHours}h`} label="Total Mentor Hours" color="#0891b2" bg="#e0f2fe" />
              <KPI icon="⭐" value={mentorAvgRating === null ? "—" : `${fmt1(mentorAvgRating)} / 5`} label="Avg Rating" color="#eab308" bg="#fef9c3" />
              <KPI icon="👥" value={fmtPct(mentorAvgAttendance)} label="Avg Attendance" color="#7c3aed" bg="#ede9fe" />
              <KPI icon="🛡️" value={fmtPct(mentorAvgSLA)} label="Mentor SLA" color="#059669" bg="#d1fae5" />
            </div>

            <div className="grid-2col">
              <Card title="Top Mentors by Sessions">
                {topMentorsBySessions.length === 0 ? <EmptyChart /> : topMentorsBySessions.map((m) => (
                  <BarRow key={m.name} label={m.name} value={m.sessions} max={Math.max(...topMentorsBySessions.map((x) => x.sessions), 1)} color="#3b82f6" />
                ))}
              </Card>
              <Card title="Mentor Rating Breakdown">
                {mentorStats.filter((m) => m.teaching !== null).length === 0 ? <EmptyChart /> : (
                  <Bar
                    data={{
                      labels: mentorStats.filter((m) => m.teaching !== null).map((m) => m.name),
                      datasets: [
                        { label: "Teaching Method", data: mentorStats.filter((m) => m.teaching !== null).map((m) => fmt1(m.teaching)), backgroundColor: "#3b82f6" },
                        { label: "Doubt Handling", data: mentorStats.filter((m) => m.teaching !== null).map((m) => fmt1(m.doubt)), backgroundColor: "#8b5cf6" },
                        { label: "Overall", data: mentorStats.filter((m) => m.teaching !== null).map((m) => fmt1(m.overall)), backgroundColor: "#22c55e" },
                      ],
                    }}
                    options={{ responsive: true, plugins: { legend: { position: "top", labels: { font: chartFont, boxWidth: 10 } } }, scales: { y: { min: 0, max: 5 } } }}
                    height={140}
                  />
                )}
              </Card>
            </div>

            <Card title="Mentor Performance">
              <div className="table-wrap">
                <table className="styled-table">
                  <thead><tr><th>Mentor</th><th>Sessions</th><th>Hours</th><th>Attendance</th><th>Teaching</th><th>Doubt</th><th>Overall</th><th>SLA</th></tr></thead>
                  <tbody>
                    {mentorStats.map((m) => (
                      <tr key={m.name}>
                        <td className="strong">{m.name}</td>
                        <td>{m.sessions}</td>
                        <td>{m.hours}h</td>
                        <td>{fmtPct(m.attendance)}</td>
                        <td>{fmt1(m.teaching)}</td>
                        <td>{fmt1(m.doubt)}</td>
                        <td>{fmt1(m.overall)}</td>
                        <td>{fmtPct(m.sla)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {mentorStats.length === 0 && <div className="empty-state">No mentor data matches these filters.</div>}
              </div>
            </Card>
          </Section>

          {/* Batch Analytics */}
          <Section icon="🎓" title="Batch Analytics" subtitle="Monitor batch health and overall performance">
            <div className="kpi-grid kpi-grid-4">
              <KPI icon="🎓" value={totalBatches} label="Total Batches" color="#7c3aed" bg="#ede9fe" />
              <KPI icon="📦" value={activeBatches} label="Active Batches" color="#16a34a" bg="#dcfce7" />
              <KPI icon="✅" value={completedBatches} label="Completed" color="#16a34a" bg="#dcfce7" />
              <KPI icon="📅" value={batchTotalSessions} label="Total Sessions" color="#2563eb" bg="#dbeafe" />
              <KPI icon="👥" value={fmtPct(batchAvgAttendance)} label="Avg Attendance" color="#7c3aed" bg="#ede9fe" />
              <KPI icon="⭐" value={batchAvgRating === null ? "—" : `${fmt1(batchAvgRating)} / 5`} label="Avg Rating" color="#eab308" bg="#fef9c3" />
              <KPI icon="📈" value={fmtPct(batchAvgCompletion)} label="Completion Rate" color="#0891b2" bg="#e0f2fe" />
            </div>

            <div className="grid-3col">
              <Card title="Batch Health Status">
                {batchStats.length === 0 ? <EmptyChart /> : (
                  <Doughnut
                    data={{
                      labels: Object.keys(healthCounts),
                      datasets: [{ data: Object.values(healthCounts), backgroundColor: Object.keys(healthCounts).map((k) => HEALTH_COLORS[k]) }],
                    }}
                    options={{ plugins: { legend: { position: "bottom", labels: { font: chartFont, boxWidth: 10 } } } }}
                    height={140}
                  />
                )}
                <div className="donut-center-label">{batchStats.length}<br /><span>Batches</span></div>
              </Card>

              <Card title="Batch Performance" style={{ gridColumn: "span 2" }}>
                <div className="table-wrap">
                  <table className="styled-table">
                    <thead><tr><th>Batch</th><th>Sessions</th><th>Attendance</th><th>Rating</th><th>Completion</th><th>Status</th></tr></thead>
                    <tbody>
                      {batchStats.map((b) => (
                        <tr key={b.batch_name}>
                          <td className="strong">{b.batch_name}</td>
                          <td>{b.completedCount} / {b.sessions}</td>
                          <td>{fmtPct(b.attendance)}</td>
                          <td>{fmt1(b.rating)}</td>
                          <td>{fmtPct(b.completion)}</td>
                          <td><span className={`status-pill status-${b.health === "Healthy" ? "good" : b.health === "At Risk" ? "bad" : "neutral"}`}>{b.health}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {batchStats.length === 0 && <div className="empty-state">No batch data matches these filters.</div>}
                </div>
              </Card>
            </div>

            <Card title="Attendance by Batch">
              {batchStats.filter((b) => b.attendance !== null).length === 0 ? <EmptyChart /> : (
                <Bar
                  data={{
                    labels: batchStats.filter((b) => b.attendance !== null).map((b) => b.batch_name),
                    datasets: [{ label: "Attendance %", data: batchStats.filter((b) => b.attendance !== null).map((b) => fmt1(b.attendance)), backgroundColor: "#3b82f6" }],
                  }}
                  options={{ plugins: { legend: { display: false } }, scales: { y: { min: 0, max: 100 } } }}
                  height={100}
                />
              )}
            </Card>
          </Section>

          {/* Session Feedback Analytics */}
          <Section icon="⭐" title="Session Feedback Analytics" subtitle="Analyze learner feedback and ratings">
            <div className="kpi-grid kpi-grid-6">
              <KPI icon="📝" value={feedbackResponses} label="Responses" color="#7c3aed" bg="#ede9fe" />
              <KPI icon="⭐" value={avgOverallRating === null ? "—" : `${fmt1(avgOverallRating)} / 5`} label="Avg Overall Rating" color="#eab308" bg="#fef9c3" />
              <KPI icon="🎯" value={avgTeaching === null ? "—" : fmt1(avgTeaching)} label="Teaching Method" color="#3b82f6" bg="#dbeafe" />
              <KPI icon="❓" value={avgDoubt === null ? "—" : fmt1(avgDoubt)} label="Doubt Handling" color="#8b5cf6" bg="#ede9fe" />
              <KPI icon="🛡️" value={avgOverallExp === null ? "—" : fmt1(avgOverallExp)} label="Overall Experience" color="#16a34a" bg="#dcfce7" />
              <KPI icon="👍" value={`${Math.round(positivePct)}%`} label="Positive Feedback" color="#16a34a" bg="#dcfce7" />
            </div>

            <div className="grid-2col">
              <Card title="Rating Distribution">
                {ratingDistribution.map((r) => (
                  <BarRow key={r.star} label={"★".repeat(r.star)} value={`${r.pct}%`} max={100} color="#3b82f6" />
                ))}
              </Card>
              <Card title="Rating Trend">
                {ratingTrend.length === 0 ? <EmptyChart /> : (
                  <Line
                    data={{
                      labels: ratingTrend.map((d) => d.date.slice(5)),
                      datasets: [
                        { label: "Teaching Method", data: ratingTrend.map((d) => d.teaching), borderColor: "#3b82f6", tension: 0.35 },
                        { label: "Doubt Handling", data: ratingTrend.map((d) => d.doubt), borderColor: "#8b5cf6", tension: 0.35 },
                        { label: "Overall", data: ratingTrend.map((d) => d.overall), borderColor: "#22c55e", tension: 0.35 },
                      ],
                    }}
                    options={{ plugins: { legend: { position: "top", labels: { font: chartFont, boxWidth: 10 } } }, scales: { y: { min: 0, max: 5 } } }}
                    height={120}
                  />
                )}
              </Card>
            </div>

            <Card title="Recent Negative Feedback">
              <div className="table-wrap">
                <table className="styled-table">
                  <thead><tr><th>Date</th><th>Batch</th><th>Mentor</th><th>Rating</th><th>Feedback</th></tr></thead>
                  <tbody>
                    {recentNegativeFeedback.map((n) => (
                      <tr key={n.id}>
                        <td>{(n.created_at || "").slice(0, 10)}</td>
                        <td>{n.batch_name}</td>
                        <td>{n.mentor_name}</td>
                        <td>{fmt1(n.overall)}</td>
                        <td>{n.feedback}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {recentNegativeFeedback.length === 0 && <div className="empty-state">✅ No recent negative feedback.</div>}
              </div>
            </Card>
          </Section>

          {/* Attendance Analytics */}
          <Section icon="🧑‍🎓" title="Attendance Analytics" subtitle="Track registrations, attendance and learner engagement">
            <div className="kpi-grid kpi-grid-5">
              <KPI icon="📝" value={totalRegistrations} label="Total Registrations" color="#2563eb" bg="#dbeafe" />
              <KPI icon="✅" value={totalAttendees} label="Total Attendees" color="#16a34a" bg="#dcfce7" />
              <KPI icon="👥" value={fmtPct(avgAttendance)} label="Avg Attendance" color="#7c3aed" bg="#ede9fe" />
              <KPI icon="⏳" value={avgDurationHours === null ? "—" : `${fmt1(avgDurationHours)}h`} label="Avg Session Duration" color="#0891b2" bg="#e0f2fe" />
              <KPI icon="📉" value={fmtPct(noShowRate)} label="No-Show Rate" color="#dc2626" bg="#fee2e2" />
            </div>

            <div className="grid-4col">
              <Card title="Attendance Trend" style={{ gridColumn: "span 2" }}>
                {attendanceTrend.length === 0 ? <EmptyChart /> : (
                  <Line
                    data={{ labels: attendanceTrend.map((d) => d.date.slice(5)), datasets: [{ label: "Attendance %", data: attendanceTrend.map((d) => d.attendance), borderColor: "#22c55e", backgroundColor: "#22c55e33", fill: true, tension: 0.35 }] }}
                    options={{ plugins: { legend: { display: false } }, scales: { y: { min: 0, max: 100 } } }}
                    height={110}
                  />
                )}
              </Card>
              <Card title="Attendance by Session Type">
                {attendanceBySessionType.map((t) => (
                  <BarRow key={t.type} label={t.type} value={`${t.attendance}%`} max={100} color="#0ea5e9" />
                ))}
              </Card>
              <Card title="Attendance by Mentor (Top 5)">
                {attendanceByMentorTop5.length === 0 ? <EmptyChart /> : attendanceByMentorTop5.map((m) => (
                  <BarRow key={m.name} label={m.name} value={`${fmt1(m.attendance)}%`} max={100} color="#6366f1" />
                ))}
              </Card>
            </div>

            {lowAttendanceSessions.length > 0 && (
              <Card title="⚠️ Low Attendance Sessions">
                <div className="table-wrap">
                  <table className="styled-table">
                    <thead><tr><th>Session</th><th>Attendance</th></tr></thead>
                    <tbody>
                      {lowAttendanceSessions.map((s) => (
                        <tr key={s.id}><td className="strong">{s.topic || "Untitled"}</td><td>{fmt1(s.attendance_percentage)}%</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </Section>
        </div>

        <style jsx>{`
          .top-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 16px;
            margin-bottom: 18px;
            flex-wrap: wrap;
          }

          .page-title {
            font-size: 24px;
            font-weight: 800;
            color: #1e293b;
            margin: 0;
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .page-title-icon {
            font-size: 22px;
          }

          .page-subtitle {
            color: #64748b;
            font-size: 13.5px;
            margin: 4px 0 0;
          }

          .btn-export-report {
            background: linear-gradient(120deg, #0f172a, #1e293b);
            color: #facc15;
            text-decoration: none;
            padding: 11px 18px;
            border-radius: 10px;
            font-weight: 700;
            font-size: 13.5px;
            white-space: nowrap;
          }

          .filter-bar {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-bottom: 24px;
          }

          .filter-input {
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 10px 12px;
            font-size: 13.5px;
            background: #ffffff;
            outline: none;
          }

          .date-range-field {
            display: flex;
            align-items: center;
            gap: 6px;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 0 8px;
          }

          .date-range-field .filter-input {
            border: none;
            padding: 9px 4px;
          }

          .btn-reset {
            border: 1px solid #e2e8f0;
            background: #ffffff;
            border-radius: 10px;
            padding: 10px 14px;
            font-size: 13px;
            font-weight: 700;
            color: #334155;
            cursor: pointer;
          }

          .btn-reset:hover {
            background: #f1f5f9;
          }

          :global(.section) {
            margin-bottom: 28px;
          }

          :global(.section-header) {
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          :global(.section-title) {
            font-size: 17px;
            font-weight: 700;
            color: #1e293b;
            margin: 0;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          :global(.section-subtitle) {
            font-size: 12.5px;
            color: #94a3b8;
            margin: 2px 0 14px;
          }

          :global(.card) {
            background: #ffffff;
            border-radius: 14px;
            padding: 18px 20px;
            box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
            border: 1px solid #eef2f7;
            margin-bottom: 16px;
            position: relative;
          }

          :global(.card-title) {
            font-size: 13.5px;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 14px;
          }

          .kpi-grid {
            display: grid;
            gap: 12px;
            margin-bottom: 16px;
          }

          .kpi-grid-exec {
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          }

          .kpi-grid-4 {
            grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
          }

          .kpi-grid-5 {
            grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
          }

          .kpi-grid-6 {
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          }

          .exec-row {
            display: grid;
            grid-template-columns: 1fr 260px;
            gap: 16px;
            align-items: start;
          }

          :global(.kpi-card) {
            background: #ffffff;
            border: 1px solid #eef2f7;
            border-radius: 12px;
            padding: 12px 14px;
            display: flex;
            align-items: center;
            gap: 10px;
          }

          :global(.kpi-icon) {
            width: 34px;
            height: 34px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 15px;
            flex-shrink: 0;
          }

          :global(.kpi-value) {
            font-size: 17px;
            font-weight: 800;
            color: #1e293b;
            line-height: 1.1;
          }

          :global(.kpi-label) {
            font-size: 11px;
            color: #64748b;
            margin-top: 2px;
          }

          .progress-banner {
            background: linear-gradient(135deg, #dcfce7, #bbf7d0);
            border-radius: 14px;
            padding: 16px;
            border: 1px solid #86efac;
          }

          .progress-banner-title {
            font-weight: 800;
            color: #166534;
            margin-bottom: 6px;
            font-size: 13.5px;
          }

          .progress-banner-text {
            font-size: 12.5px;
            color: #166534;
            line-height: 1.5;
          }

          .grid-2col {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }

          .grid-3col {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
          }

          .grid-4col {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
          }

          :global(.bar-row) {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 12px;
            font-size: 12.5px;
          }

          :global(.bar-row-label) {
            width: 110px;
            flex-shrink: 0;
            color: #475569;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          :global(.bar-row-track) {
            flex: 1;
            height: 8px;
            background: #f1f5f9;
            border-radius: 999px;
            overflow: hidden;
          }

          :global(.bar-row-fill) {
            height: 100%;
            border-radius: 999px;
          }

          :global(.bar-row-value) {
            width: 40px;
            text-align: right;
            font-weight: 700;
            color: #1e293b;
            flex-shrink: 0;
          }

          .donut-center-label {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -20%);
            text-align: center;
            font-size: 16px;
            font-weight: 800;
            color: #1e293b;
            pointer-events: none;
          }

          .donut-center-label span {
            font-size: 10px;
            font-weight: 600;
            color: #94a3b8;
          }

          .issues-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 10px;
          }

          .issue-row {
            display: flex;
            align-items: center;
            gap: 8px;
            background: #fffbeb;
            border: 1px solid #fde68a;
            color: #92400e;
            border-radius: 10px;
            padding: 8px 12px;
            font-size: 12.5px;
            font-weight: 600;
          }

          .table-wrap {
            overflow-x: auto;
          }

          .styled-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
          }

          .styled-table thead th {
            text-align: left;
            font-size: 10.5px;
            text-transform: uppercase;
            letter-spacing: 0.03em;
            color: #94a3b8;
            font-weight: 700;
            padding: 8px 12px;
            border-bottom: 2px solid #f1f5f9;
          }

          .styled-table td {
            padding: 10px 12px;
            border-bottom: 1px solid #f1f5f9;
            color: #1e293b;
          }

          .styled-table td.strong {
            font-weight: 600;
          }

          .status-pill {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 999px;
            font-size: 11.5px;
            font-weight: 700;
          }

          .status-good {
            background: #dcfce7;
            color: #15803d;
          }

          .status-bad {
            background: #fee2e2;
            color: #b91c1c;
          }

          .status-neutral {
            background: #f1f5f9;
            color: #64748b;
          }

          :global(.empty-state) {
            text-align: center;
            padding: 24px;
            color: #94a3b8;
            font-size: 13px;
          }

          .muted {
            color: #94a3b8;
          }

          @media (max-width: 1200px) {
            .exec-row, .grid-4col, .grid-3col, .grid-2col {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </>
    </ProtectedRoute>
  );
}

function EmptyChart() {
  return <div className="empty-state">Not enough data yet.</div>;
}
