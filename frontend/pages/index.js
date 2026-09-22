import { useEffect, useMemo, useState } from "react";
import ProtectedRoute from "../components/ProtectedRoute";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Link from "next/link";
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
  UserCheck,
  Layers,
  FileWarning,
  Receipt,
  Activity,
  AlertTriangle,
  Plus,
  UserPlus,
  Settings2,
  ArrowRight,
} from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler);

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function greeting(now) {
  if (!now) return "Welcome back";
  const hour = now.getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

function todayStr() {
  return new Date().toLocaleDateString("en-CA");
}

function dayStr(offset) {
  return new Date(Date.now() + offset * 86400000).toLocaleDateString("en-CA");
}

function sessionDt(s) {
  if (!s.session_date) return null;
  const d = new Date(`${s.session_date}T${s.session_time || "00:00"}`);
  return isNaN(d.getTime()) ? null : d;
}

function fmtTime(s) {
  const d = sessionDt(s);
  if (!d) return "--:--";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function fmtDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
}

function avg(list) {
  if (!list.length) return null;
  return list.reduce((a, b) => a + b, 0) / list.length;
}

function sessionLiveStatus(s, nowMs) {
  if (s.status === "Cancelled") return "Cancelled";
  if (s.status === "Completed") return "Completed";
  const dt = sessionDt(s);
  if (!dt) return s.status || "Scheduled";
  const end = new Date(dt.getTime() + (Number(s.duration) || 60) * 60000);
  if (nowMs >= dt.getTime() && nowMs <= end.getTime()) return "Live";
  if (dt.getTime() > nowMs) return "Upcoming";
  return "Scheduled";
}

const STATUS_STYLES = {
  Live: { bg: "rgba(34,197,94,0.14)", color: "#4ade80" },
  Upcoming: { bg: "rgba(59,130,246,0.14)", color: "#60a5fa" },
  Scheduled: { bg: "rgba(148,163,184,0.14)", color: "var(--om-text-body)" },
  Completed: { bg: "rgba(59,130,246,0.14)", color: "#60a5fa" },
  Cancelled: { bg: "rgba(239,68,68,0.14)", color: "#f87171" },
};
function StatusPill({ status }) {
  const s = STATUS_STYLES[status] || { bg: "rgba(148,163,184,0.14)", color: "var(--om-text-body)" };
  return (
    <span className="status-pill" style={{ background: s.bg, color: s.color }}>
      {status === "Live" && <span className="live-dot" />}
      {status}
    </span>
  );
}

const AVATAR_COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b", "#22c55e", "#ec4899", "#06b6d4"];
function avatarColor(name) {
  if (!name) return AVATAR_COLORS[0];
  const code = name.charCodeAt(0) + (name.charCodeAt(1) || 0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}
function initials(name) {
  if (!name) return "?";
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
}
function mentorPhotoUrl(mentor) {
  if (!mentor || !mentor.photo_path) return null;
  return `${API}/mentors/${mentor.id}/photo?v=${encodeURIComponent(mentor.photo_path)}`;
}
function MentorAvatar({ mentor, name, size = 26 }) {
  const resolvedName = mentor?.name || name;
  const url = mentorPhotoUrl(mentor);
  const [broken, setBroken] = useState(false);

  if (url && !broken) {
    return (
      <img
        src={url}
        alt={resolvedName}
        onError={() => setBroken(true)}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          objectPosition: "center 22%",
          flexShrink: 0,
          border: "2px solid var(--om-bg-card)",
          boxShadow: "0 0 0 1px var(--om-border-1)",
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: resolvedName ? `${avatarColor(resolvedName)}22` : "var(--om-border-2)",
        color: resolvedName ? avatarColor(resolvedName) : "var(--om-text-muted)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size <= 28 ? "10.5px" : "13px",
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {initials(resolvedName)}
    </div>
  );
}

function useThemeChartColors() {
  const [colors, setColors] = useState({ text: "#cbd5e1", grid: "rgba(148,163,184,0.14)" });

  useEffect(() => {
    const read = () => {
      const style = getComputedStyle(document.documentElement);
      const text = style.getPropertyValue("--om-text-body").trim();
      const grid = style.getPropertyValue("--om-border-3").trim();
      setColors({ text: text || "#cbd5e1", grid: grid || "rgba(148,163,184,0.14)" });
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  return colors;
}

function useSessionReportsToday() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/dashboard/session-reports-today")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  return data;
}

export default function Home() {
  const sessionReportsToday = useSessionReportsToday();
  const [now, setNow] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [batches, setBatches] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [nps, setNps] = useState([]);
  const [resourceTracking, setResourceTracking] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/sessions`).then((r) => r.json()).catch(() => []),
      fetch(`${API}/mentors`).then((r) => r.json()).catch(() => []),
      fetch(`${API}/batches`).then((r) => r.json()).catch(() => []),
      fetch(`${API}/invoices`).then((r) => r.json()).catch(() => []),
      fetch(`${API}/nps`).then((r) => r.json()).catch(() => []),
      fetch(`${API}/resource-tracking`).then((r) => r.json()).catch(() => []),
    ]).then(([s, m, b, i, n, rt]) => {
      setSessions(Array.isArray(s) ? s : []);
      setMentors(Array.isArray(m) ? m : []);
      setBatches(Array.isArray(b) ? b : []);
      setInvoices(Array.isArray(i) ? i : []);
      setNps(Array.isArray(n) ? n : []);
      setResourceTracking(Array.isArray(rt) ? rt : []);
      setLoading(false);
    });
  }, []);

  const mentorByName = (name) => mentors.find((m) => m.name === name);

  const today = todayStr();
  const nowMs = now ? now.getTime() : Date.now();
  const last7Dates = useMemo(() => Array.from({ length: 7 }, (_, i) => dayStr(i - 6)), [today]);

  const todaysSessions = useMemo(
    () => sessions.filter((s) => s.session_date === today).sort((a, b) => (a.session_time || "").localeCompare(b.session_time || "")),
    [sessions, today]
  );

  const liveSessionsCount = useMemo(() => todaysSessions.filter((s) => sessionLiveStatus(s, nowMs) === "Live").length, [todaysSessions, nowMs]);

  const yesterdayStr = useMemo(() => dayStr(-1), []);
  const yesterdaysSessionsCount = useMemo(() => sessions.filter((s) => s.session_date === yesterdayStr).length, [sessions, yesterdayStr]);
  const sessionsTrend = todaysSessions.length - yesterdaysSessionsCount;

  const activeMentors = mentors.filter((m) => m.status !== "Inactive").length;
  const activeBatches = useMemo(() => batches.filter((b) => b.status !== "Inactive" && b.status !== "Completed"), [batches]);
  const totalLearners = useMemo(
    () => activeBatches.reduce((sum, b) => sum + (Number(b.active_learners) > 0 ? Number(b.active_learners) : Number(b.strength) || 0), 0),
    [activeBatches]
  );

  const pendingResourceSessions = resourceTracking.filter((r) => r.missing_count > 0).length;
  const pendingInvoices = invoices.filter((i) => i.payment_status === "Pending").length;
  const sessionsMissingAttendance = sessions.filter((s) => s.status === "Completed" && !(Number(s.attended_students) > 0)).length;

  // ---- Session Trend: real per-day status counts, last 7 days ----
  const sessionTrend = useMemo(() => {
    const completed = [], cancelled = [], scheduled = [];
    last7Dates.forEach((d) => {
      const daySessions = sessions.filter((s) => s.session_date === d);
      completed.push(daySessions.filter((s) => s.status === "Completed").length);
      cancelled.push(daySessions.filter((s) => s.status === "Cancelled").length);
      scheduled.push(daySessions.filter((s) => s.status === "Scheduled").length);
    });
    return { completed, cancelled, scheduled };
  }, [sessions, last7Dates]);

  // ---- Batch Health: real health_score buckets ----
  const batchHealth = useMemo(() => {
    const c = { Healthy: 0, "At Risk": 0, Critical: 0 };
    batches.forEach((b) => {
      const score = Number(b.health_score) || 0;
      if (score >= 70) c.Healthy += 1;
      else if (score >= 40) c["At Risk"] += 1;
      else c.Critical += 1;
    });
    return c;
  }, [batches]);

  // ---- Mentor Performance: real aggregates from sessions + nps ----
  const mentorPerformance = useMemo(() => {
    const byMentor = {};
    sessions.forEach((s) => {
      if (!s.mentor_name) return;
      byMentor[s.mentor_name] = byMentor[s.mentor_name] || { sessions: 0, minutes: 0 };
      byMentor[s.mentor_name].sessions += 1;
      byMentor[s.mentor_name].minutes += Number(s.duration) || 0;
    });
    const ratingByMentor = {};
    nps.forEach((n) => {
      if (!n.mentor_name) return;
      const r = (Number(n.instructor_rating) + Number(n.doubt_rating) + Number(n.website_rating)) / 3;
      ratingByMentor[n.mentor_name] = ratingByMentor[n.mentor_name] || [];
      ratingByMentor[n.mentor_name].push(r);
    });
    return Object.entries(byMentor)
      .map(([name, v]) => ({ name, sessions: v.sessions, hours: Math.round(v.minutes / 60), rating: avg(ratingByMentor[name] || []) }))
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 5);
  }, [sessions, nps]);

  // ---- Learner Engagement: real per-day attendance% and rating, last 7 days ----
  const learnerEngagement = useMemo(() => {
    const attendance = [], rating = [];
    last7Dates.forEach((d) => {
      const daySessions = sessions.filter((s) => s.session_date === d && Number(s.registered_students) > 0);
      attendance.push(daySessions.length ? Math.round(avg(daySessions.map((s) => Number(s.attendance_percentage) || 0))) : 0);
      const dayNps = nps.filter((n) => n.created_at && n.created_at.slice(0, 10) === d);
      rating.push(dayNps.length ? avg(dayNps.map((n) => (Number(n.instructor_rating) + Number(n.doubt_rating) + Number(n.website_rating)) / 3)) : null);
    });
    return { attendance, rating };
  }, [sessions, nps, last7Dates]);

  // ---- Recent Activity: real timestamps only ----
  const recentActivity = useMemo(() => {
    const events = [];
    invoices.forEach((i) => {
      if (i.invoice_date) events.push({ icon: Receipt, color: "#60a5fa", text: `Invoice generated — ${i.invoice_number || `#${i.id}`}`, who: i.mentor_name, ts: i.invoice_date });
    });
    resourceTracking.forEach((r) => {
      if (r.received_at) events.push({ icon: Layers, color: "#4ade80", text: `Resource uploaded — ${r.session_topic}`, who: r.mentor_name, ts: r.received_at.slice(0, 10) });
    });
    nps.forEach((n) => {
      if (n.created_at) events.push({ icon: UserCheck, color: "#f0c75e", text: `Feedback received — ${n.batch_name}`, who: n.mentor_name, ts: n.created_at.slice(0, 10) });
    });
    return events.sort((a, b) => (b.ts || "").localeCompare(a.ts || "")).slice(0, 5);
  }, [invoices, resourceTracking, nps]);

  // ---- Attention Required: real derived alerts ----
  const attentionItems = useMemo(() => {
    const items = [];
    resourceTracking.filter((r) => r.missing_count > 0).forEach((r) => {
      items.push({ text: `${r.missing_count} resource${r.missing_count === 1 ? "" : "s"} pending — ${r.session_topic || r.batch_name}`, when: r.session_date });
    });
    sessions.filter((s) => s.status === "Completed" && !(Number(s.attended_students) > 0)).forEach((s) => {
      items.push({ text: `Attendance not recorded — ${s.topic || s.batch_name}`, when: s.session_date });
    });
    sessions.filter((s) => s.status === "Completed" && Number(s.attended_students) > 0 && Number(s.attendance_percentage) > 0 && Number(s.attendance_percentage) < 60).forEach((s) => {
      items.push({ text: `Low attendance (${Math.round(s.attendance_percentage)}%) — ${s.batch_name || s.topic}`, when: s.session_date });
    });
    return items.sort((a, b) => (b.when || "").localeCompare(a.when || "")).slice(0, 5);
  }, [resourceTracking, sessions]);

  const notifications = useMemo(() => attentionItems.map((a) => ({ text: a.text, level: "orange" })), [attentionItems]);
  const notifCount = pendingResourceSessions + sessionsMissingAttendance + pendingInvoices;

  const quickActions = [
    { icon: Plus, label: "Create Session", href: "/sessions", accent: "#60a5fa" },
    { icon: UserPlus, label: "Add Mentor", href: "/mentors", accent: "#4ade80" },
    { icon: Settings2, label: "Manage Batches", href: "/batches", accent: "#a78bfa" },
    { icon: Receipt, label: "Generate Invoice", href: "/invoice-generator", accent: "#f0c75e" },
  ];

  const lineData = {
    labels: last7Dates.map((d) => new Date(d).toLocaleDateString(undefined, { day: "2-digit", month: "short" })),
    datasets: [
      { label: "Completed", data: sessionTrend.completed, borderColor: "#4ade80", backgroundColor: "rgba(74,222,128,0.12)", fill: true, tension: 0.35, pointRadius: 3 },
      { label: "Scheduled", data: sessionTrend.scheduled, borderColor: "#f0c75e", backgroundColor: "rgba(240,199,94,0.1)", fill: true, tension: 0.35, pointRadius: 3 },
      { label: "Cancelled", data: sessionTrend.cancelled, borderColor: "#f87171", backgroundColor: "rgba(248,113,113,0.08)", fill: true, tension: 0.35, pointRadius: 3 },
    ],
  };

  const engagementData = {
    labels: last7Dates.map((d) => new Date(d).toLocaleDateString(undefined, { day: "2-digit", month: "short" })),
    datasets: [
      { type: "bar", label: "Attendance %", data: learnerEngagement.attendance, backgroundColor: "#f0c75e", borderRadius: 4, yAxisID: "y" },
      { type: "line", label: "Avg Rating", data: learnerEngagement.rating, borderColor: "#60a5fa", backgroundColor: "#60a5fa", tension: 0.35, pointRadius: 3, yAxisID: "y1" },
    ],
  };

  const { text: chartTextColor, grid: chartGrid } = useThemeChartColors();

  return (
    <ProtectedRoute>
      <>
        <Sidebar />
        <div style={{ marginLeft: "var(--om-sidebar-width, 280px)", transition: "margin-left 0.25s ease", padding: "28px 32px 56px", background: "var(--om-bg-page)", minHeight: "100vh" }}>
          <Header notificationCount={notifCount} notifications={notifications} />

          <div className="page-head">
            <h1 className="page-title">{greeting(now)}, Rahul! 👋</h1>
          </div>

          {/* KPI row */}
          <div className="kpi-row">
            <KPICard icon={Video} accent="#60a5fa" value={liveSessionsCount} label="Live Sessions" sub="Ongoing now" />
            <KPICard icon={Users} accent="#4ade80" value={totalLearners} label="Total Learners" sub="Across all batches" />
            <KPICard
              icon={UserCheck} accent="#f0c75e" value={activeMentors} label="Active Mentors"
              trend={sessionsTrend === 0 ? null : { dir: sessionsTrend > 0 ? "up" : "down", text: `${Math.abs(sessionsTrend)} sessions vs yesterday` }}
            />
            <KPICard icon={Layers} accent="#a78bfa" value={activeBatches.length} label="Active Batches" sub="Ongoing" />
            <KPICard icon={FileWarning} accent="#fb923c" value={pendingResourceSessions} label="Pending Resources" sub="Need attention" />
            <KPICard icon={Receipt} accent="#f87171" value={pendingInvoices} label="Pending Invoices" sub="To be generated" />
          </div>

          {/* Row 2: Session Trend | Batch Health | Today's Sessions */}
          <div className="grid-3a">
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Session Trend</div>
                  <div className="card-sub">Completed, scheduled and cancelled sessions over time</div>
                </div>
              </div>
              <div style={{ height: "220px" }}>
                <Chart
                  type="line"
                  data={lineData}
                  options={{
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { position: "top", labels: { color: chartTextColor, boxWidth: 10, font: { size: 12, weight: 600 } } } },
                    scales: {
                      x: { ticks: { color: chartTextColor, font: { size: 11.5, weight: 600 } }, grid: { color: chartGrid } },
                      y: { beginAtZero: true, ticks: { color: chartTextColor, font: { size: 11.5, weight: 600 } }, grid: { color: chartGrid } },
                    },
                  }}
                />
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Batch Health Status</div>
                  <div className="card-sub">Overall performance of active batches</div>
                </div>
              </div>
              {batches.length === 0 ? (
                <div className="empty-state">No batches yet.</div>
              ) : (
                <div className="donut-row">
                  <div style={{ position: "relative", width: "130px", flexShrink: 0 }}>
                    <Doughnut
                      data={{ labels: Object.keys(batchHealth), datasets: [{ data: Object.values(batchHealth), backgroundColor: ["#4ade80", "#f0c75e", "#f87171"], borderWidth: 0 }] }}
                      options={{ plugins: { legend: { display: false } }, cutout: "72%" }}
                    />
                    <div className="donut-center-label">{batches.length}<br /><span>Total Batches</span></div>
                  </div>
                  <div className="donut-legend">
                    <div><span className="legend-dot" style={{ background: "#4ade80" }} /> Healthy <b>{batchHealth.Healthy}</b></div>
                    <div><span className="legend-dot" style={{ background: "#f0c75e" }} /> At Risk <b>{batchHealth["At Risk"]}</b></div>
                    <div><span className="legend-dot" style={{ background: "#f87171" }} /> Critical <b>{batchHealth.Critical}</b></div>
                  </div>
                </div>
              )}
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-title">Today&apos;s Sessions</div>
                <Link href="/sessions" className="view-all">View All →</Link>
              </div>
              {loading ? (
                <div className="empty-state">Loading…</div>
              ) : todaysSessions.length === 0 ? (
                <div className="empty-state">No sessions today.</div>
              ) : (
                <div className="today-list">
                  {todaysSessions.slice(0, 5).map((s) => (
                    <div key={s.id} className="today-row">
                      <div className="today-time">{fmtTime(s)}</div>
                      <MentorAvatar mentor={mentorByName(s.mentor_name)} name={s.mentor_name} size={24} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="strong">{s.topic || "Untitled Session"}</div>
                        <div className="muted" style={{ fontSize: "11.5px" }}>By {s.mentor_name || "Not Assigned"}</div>
                      </div>
                      <StatusPill status={sessionLiveStatus(s, nowMs)} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Row 3: Mentor Performance | Learner Engagement | Recent Activity */}
          <div className="grid-3b">
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Mentor Performance</div>
                  <div className="card-sub">Top mentors by session hours</div>
                </div>
                <Link href="/resource-analytics/mentors" className="view-all">View All →</Link>
              </div>
              {mentorPerformance.length === 0 ? (
                <div className="empty-state">No session data yet.</div>
              ) : (
                <div className="table-wrap">
                  <table className="perf-table">
                    <thead>
                      <tr><th>#</th><th>Mentor</th><th>Sessions</th><th>Hours</th><th>Rating</th></tr>
                    </thead>
                    <tbody>
                      {mentorPerformance.map((m, i) => (
                        <tr key={m.name}>
                          <td className="muted">{i + 1}</td>
                          <td className="strong">
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <MentorAvatar mentor={mentorByName(m.name)} name={m.name} />
                              <span>{m.name}</span>
                            </div>
                          </td>
                          <td>{m.sessions}</td>
                          <td>{m.hours} hrs</td>
                          <td>{m.rating === null ? "—" : <span className="rating-star">★ {m.rating.toFixed(1)}</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Learner Engagement</div>
                  <div className="card-sub">Attendance &amp; feedback trend</div>
                </div>
              </div>
              <div style={{ height: "200px" }}>
                <Chart
                  type="bar"
                  data={engagementData}
                  options={{
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { position: "top", labels: { color: chartTextColor, boxWidth: 10, font: { size: 12, weight: 600 } } } },
                    scales: {
                      x: { ticks: { color: chartTextColor, font: { size: 11.5, weight: 600 } }, grid: { color: chartGrid } },
                      y: { position: "left", min: 0, max: 100, ticks: { color: chartTextColor, font: { size: 11.5, weight: 600 } }, grid: { color: chartGrid } },
                      y1: { position: "right", min: 0, max: 5, ticks: { color: chartTextColor, font: { size: 11.5, weight: 600 } }, grid: { drawOnChartArea: false } },
                    },
                  }}
                />
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-title">Recent Activity</div>
              </div>
              {recentActivity.length === 0 ? (
                <div className="empty-state">No recent activity yet.</div>
              ) : (
                <div className="activity-list">
                  {recentActivity.map((a, i) => (
                    <div key={i} className="activity-row">
                      <div className="activity-icon" style={{ background: `${a.color}1f`, color: a.color }}><a.icon size={14} strokeWidth={2.2} /></div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="strong" style={{ fontSize: "12.5px" }}>{a.text}</div>
                        <div className="muted" style={{ fontSize: "11px" }}>{a.who}</div>
                      </div>
                      <div className="muted" style={{ fontSize: "11px" }}>{fmtDate(a.ts)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Row 4: Attention Required | Quick Actions */}
          <div className="grid-2c">
            <div className="card card-attention">
              <div className="card-header">
                <div className="card-title"><AlertTriangle size={16} strokeWidth={2.2} color="#f87171" /> Attention Required</div>
                <Link href="/resources/pending" className="view-all">View All →</Link>
              </div>
              {attentionItems.length === 0 ? (
                <div className="empty-state">✅ Nothing needs attention right now.</div>
              ) : (
                <div className="activity-list">
                  {attentionItems.map((a, i) => (
                    <div key={i} className="activity-row">
                      <div className="activity-icon activity-icon-warn"><AlertTriangle size={13} strokeWidth={2.2} /></div>
                      <div style={{ flex: 1, minWidth: 0 }} className="strong">{a.text}</div>
                      <div className="muted" style={{ fontSize: "11px" }}>{fmtDate(a.when)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-title"><Activity size={16} strokeWidth={2.2} color="#f0c75e" /> Quick Actions</div>
              </div>
              <div className="quick-actions-grid">
                {quickActions.map((a) => (
                  <Link key={a.label} href={a.href} className="quick-action-btn" style={{ background: `${a.accent}1a`, color: a.accent }}>
                    <a.icon size={18} strokeWidth={2.2} />
                    <span>{a.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Session Reports summary */}
          <div className="session-reports-panel">
            <div className="session-reports-panel-header">
              <h2 className="section-heading" style={{ margin: 0 }}>Session Reports</h2>
              <Link href="/session-reports" className="view-all-link">View All Reports →</Link>
            </div>

            <div className="session-reports-kpis">
              <MiniStat label="Sessions Today" value={sessionReportsToday?.sessions_today} color="#3b82f6" />
              <MiniStat label="Completed Today" value={sessionReportsToday?.completed_today} color="#16a34a" />
              <MiniStat label="Live Now" value={sessionReportsToday?.live_now} color="#ef4444" />
              <MiniStat label="Attendance Today" value={sessionReportsToday ? `${sessionReportsToday.attendance_today}%` : undefined} color="#22c55e" />
              <MiniStat label="Pending Reports" value={sessionReportsToday?.pending_reports} color="#f59e0b" />
            </div>
          </div>
        </div>

        <style jsx>{`
          .page-head {
            margin-bottom: 20px;
          }

          .page-title {
            font-size: 26px;
            font-weight: 800;
            color: var(--om-text-primary);
            margin: 0 0 4px;
          }

          .kpi-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 14px;
            margin-bottom: 18px;
          }

          :global(.kpi-card) {
            background: var(--om-bg-card);
            border-radius: 14px;
            padding: 18px;
            border: 1px solid var(--om-border-2);
            display: flex;
            gap: 14px;
            align-items: flex-start;
            transition: transform 0.15s ease, border-color 0.15s ease;
          }

          :global(.kpi-card:hover) {
            transform: translateY(-2px);
            border-color: rgba(240, 199, 94, 0.3);
          }

          :global(.kpi-icon) {
            width: 44px;
            height: 44px;
            border-radius: 11px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }

          :global(.kpi-value) {
            font-size: 32px;
            font-weight: 800;
            color: var(--om-text-primary);
            line-height: 1.1;
            letter-spacing: -0.01em;
          }

          :global(.kpi-label) {
            font-size: 12.5px;
            color: var(--om-text-muted);
            font-weight: 700;
            margin-top: 3px;
          }

          :global(.kpi-sub) {
            font-size: 10.5px;
            color: var(--om-text-faint);
            margin-top: 4px;
          }

          :global(.kpi-trend) {
            font-size: 10.5px;
            font-weight: 700;
            margin-top: 4px;
          }

          :global(.kpi-trend-up) {
            color: #4ade80;
          }

          :global(.kpi-trend-down) {
            color: #f87171;
          }

          .grid-3a {
            display: grid;
            grid-template-columns: 1.3fr 1fr 1fr;
            gap: 16px;
            margin-bottom: 16px;
          }

          .session-reports-panel {
            margin-top: 16px;
            background: var(--om-bg-card);
            border-radius: 14px;
            padding: 18px 20px;
            border: 1px solid var(--om-border-2);
          }

          .session-reports-panel-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 12px;
            margin-bottom: 16px;
          }

          .view-all-link {
            font-size: 13px;
            font-weight: 700;
            color: #f0c75e;
            text-decoration: none;
          }

          .view-all-link:hover {
            text-decoration: underline;
          }

          .session-reports-kpis {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 14px;
          }

          .grid-3b {
            display: grid;
            grid-template-columns: 1.2fr 1fr 1fr;
            gap: 16px;
            margin-bottom: 16px;
          }

          .grid-2c {
            display: grid;
            grid-template-columns: 1.4fr 1fr;
            gap: 16px;
            margin-bottom: 16px;
          }

          :global(.card) {
            background: var(--om-bg-card);
            border-radius: 14px;
            padding: 18px 20px;
            border: 1px solid var(--om-border-2);
          }

          :global(.card-header) {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 14px;
          }

          :global(.card-title),
          :global(.section-heading) {
            display: flex;
            align-items: center;
            gap: 7px;
            font-size: 14.5px;
            font-weight: 700;
            color: var(--om-text-primary);
          }

          :global(.card-sub) {
            font-size: 11px;
            color: var(--om-text-faint);
            margin-top: 2px;
          }

          :global(.view-all) {
            font-size: 12px;
            font-weight: 700;
            color: #f0c75e;
            text-decoration: none;
            flex-shrink: 0;
          }

          :global(.donut-row) {
            display: flex;
            align-items: center;
            gap: 18px;
          }

          :global(.donut-center-label) {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -20%);
            text-align: center;
            font-size: 16px;
            font-weight: 800;
            color: var(--om-text-primary);
            pointer-events: none;
          }

          :global(.donut-center-label span) {
            font-size: 9px;
            font-weight: 600;
            color: var(--om-text-faint);
          }

          :global(.donut-legend) {
            display: flex;
            flex-direction: column;
            gap: 10px;
            font-size: 12.5px;
            color: var(--om-text-body);
          }

          :global(.legend-dot) {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            display: inline-block;
            margin-right: 6px;
          }

          .today-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          :global(.today-row) {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          :global(.today-time) {
            font-size: 11px;
            font-weight: 700;
            color: #f0c75e;
            background: rgba(240, 199, 94, 0.1);
            border-radius: 7px;
            padding: 5px 8px;
            flex-shrink: 0;
            white-space: nowrap;
          }

          :global(.status-pill) {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            font-size: 10.5px;
            font-weight: 700;
            padding: 4px 10px;
            border-radius: 999px;
            white-space: nowrap;
            flex-shrink: 0;
          }

          :global(.live-dot) {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #4ade80;
            box-shadow: 0 0 0 2px rgba(74, 222, 128, 0.25);
          }

          .table-wrap {
            overflow-x: auto;
          }

          :global(.perf-table) {
            width: 100%;
            border-collapse: collapse;
            font-size: 12.5px;
          }

          :global(.perf-table th) {
            text-align: left;
            font-size: 10.5px;
            font-weight: 700;
            text-transform: uppercase;
            color: var(--om-text-faint);
            padding: 0 8px 8px 0;
            border-bottom: 1px solid var(--om-border-2);
          }

          :global(.perf-table td) {
            padding: 9px 8px 9px 0;
            border-bottom: 1px solid var(--om-border-4);
            color: var(--om-text-body);
            white-space: nowrap;
          }

          :global(.rating-star) {
            color: #f0c75e;
            font-weight: 700;
          }

          .activity-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          :global(.activity-row) {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          :global(.activity-icon) {
            width: 28px;
            height: 28px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }

          :global(.activity-icon-warn) {
            background: rgba(248, 113, 113, 0.14);
            color: #f87171;
          }

          .quick-actions-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }

          :global(.quick-action-btn) {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 18px 10px;
            border-radius: 12px;
            text-decoration: none;
            font-size: 12px;
            font-weight: 700;
            text-align: center;
            transition: transform 0.15s ease, filter 0.15s ease;
          }

          :global(.quick-action-btn:hover) {
            transform: translateY(-2px);
            filter: brightness(1.15);
          }

          :global(.strong) {
            font-weight: 600;
            color: var(--om-text-strong);
          }

          :global(.muted) {
            color: var(--om-text-faint);
          }

          :global(.empty-state) {
            text-align: center;
            padding: 20px;
            color: var(--om-text-faint);
            font-size: 13px;
          }

          @media (max-width: 1400px) {
            .grid-3a,
            .grid-3b {
              grid-template-columns: 1fr 1fr;
            }
          }

          @media (max-width: 1000px) {
            .grid-3a,
            .grid-3b,
            .grid-2c {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </>
    </ProtectedRoute>
  );
}

function KPICard({ icon: Icon, accent, value, label, sub, trend }) {
  return (
    <div className="kpi-card">
      <div className="kpi-icon" style={{ background: `${accent}1a`, color: accent }}>
        <Icon size={20} strokeWidth={2.2} />
      </div>
      <div>
        <div className="kpi-value">{value}</div>
        <div className="kpi-label">{label}</div>
        {trend ? (
          <div className={`kpi-trend kpi-trend-${trend.dir}`}>{trend.dir === "up" ? "↑" : "↓"} {trend.text}</div>
        ) : (
          sub && <div className="kpi-sub">{sub}</div>
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div style={{ background: "var(--om-bg-page)", borderLeft: `3px solid ${color}`, padding: "12px 14px", borderRadius: "10px" }}>
      <div style={{ fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em", color: "var(--om-text-muted)", marginBottom: "4px" }}>
        {label}
      </div>
      <div style={{ fontSize: "23px", fontWeight: 800, color, fontVariantNumeric: "tabular-nums" }}>
        {value === null || value === undefined ? "—" : value}
      </div>
    </div>
  );
}
