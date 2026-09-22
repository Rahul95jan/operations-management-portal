import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import ProtectedRoute from "../components/ProtectedRoute";
import KpiTile from "../components/webinarAnalytics/KpiTile";
import AttendanceTrendCard from "../components/webinarAnalytics/AttendanceTrendCard";
import PollAnalyticsCard from "../components/webinarAnalytics/PollAnalyticsCard";
import InsightsPanel from "../components/webinarAnalytics/InsightsPanel";
import AttentionPanel from "../components/webinarAnalytics/AttentionPanel";
import KeyTakeaways from "../components/webinarAnalytics/KeyTakeaways";
import WebinarReportPanel from "../components/webinarAnalytics/WebinarReportPanel";
import { buildInsights, buildAttention, buildTakeaways, chartInsight, pollInsight, pollTotals } from "../lib/webinarAnalytics/insights";
import {
  Video,
  Users,
  UserCheck,
  Percent,
  MessageSquareText,
  Star,
  Heart,
  Bell,
  CalendarDays,
  Presentation,
  ChevronDown,
  FileText,
  FileSpreadsheet,
  RefreshCw,
  Quote,
  AlertTriangle,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function initials(name) {
  if (!name) return "?";
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
}

function userPhotoUrl(user) {
  if (!user || !user.photo_path) return null;
  return `${API}/users/${user.id}/photo?v=${encodeURIComponent(user.photo_path)}`;
}

function buildQuery(params) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v) qs.set(k, v);
  });
  const text = qs.toString();
  return text ? `?${text}` : "";
}

function FilterField({ icon: Icon, label, value, onChange, children }) {
  return (
    <div className="filter-field">
      <span className="filter-icon"><Icon size={26} strokeWidth={1.8} /></span>
      <div className="filter-control">
        <label>{label}</label>
        <div className="select-wrap">
          <select value={value} onChange={(e) => onChange(e.target.value)}>{children}</select>
          <ChevronDown size={14} />
        </div>
      </div>

      <style jsx>{`
        .filter-field { display: flex; align-items: center; gap: 10px; flex: 1 1 170px; min-width: 150px; }
        .filter-icon { color: #2563eb; display: flex; flex-shrink: 0; }
        .filter-control { flex: 1; min-width: 0; }
        label { display: block; font-size: 11.5px; font-weight: 700; color: #475569; margin-bottom: 4px; }
        .select-wrap { position: relative; }
        select { width: 100%; appearance: none; border: 1px solid #dbe3ee; border-radius: 8px; background: #fff; padding: 9px 30px 9px 12px; font-size: 12.5px; color: #0f172a; outline: none; cursor: pointer; text-overflow: ellipsis; }
        select:focus { border-color: #f59e0b; box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15); }
        .select-wrap :global(svg) { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); pointer-events: none; color: #0f172a; }
      `}</style>
    </div>
  );
}

export default function WebinarAnalytics() {
  const [webinars, setWebinars] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedMentor, setSelectedMentor] = useState("");
  const [selectedKey, setSelectedKey] = useState(""); // index into `webinars`

  const [summary, setSummary] = useState(null);
  const [attendanceTrend, setAttendanceTrend] = useState([]);
  const [pollData, setPollData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const [report, setReport] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [notice, setNotice] = useState("");
  const [attentionExpanded, setAttentionExpanded] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);

  const selectedWebinar = selectedKey !== "" ? webinars[Number(selectedKey)] : null;
  const selectedTitle = selectedWebinar ? selectedWebinar.title : "";

  useEffect(() => {
    fetch(`${API}/webinars`).then((r) => r.json()).then((d) => setWebinars(Array.isArray(d) ? d : [])).catch(() => {});
    fetch(`${API}/users/me`).then((r) => r.json()).then(setCurrentUser).catch(() => setCurrentUser(null));
  }, []);

  // Date / Mentor / Webinar filters drive every KPI, chart and insight below.
  useEffect(() => {
    const qs = buildQuery({ date: selectedDate, mentor: selectedMentor, title: selectedTitle });
    setLoading(true);
    setError("");
    Promise.all([
      fetch(`${API}/zoom-summary${qs}`).then((r) => r.json()),
      fetch(`${API}/zoom-attendance-trend${qs}`).then((r) => r.json()),
      fetch(`${API}/zoom-poll-analytics${qs}`).then((r) => r.json()),
    ])
      .then(([sum, trend, polls]) => {
        setSummary(sum);
        setAttendanceTrend(Array.isArray(trend) ? trend : []);
        setPollData(Array.isArray(polls) ? polls : []);
        setLastUpdated(new Date());
      })
      .catch(() => setError("Couldn't load webinar analytics. Please check your connection and try again."))
      .finally(() => setLoading(false));
  }, [selectedDate, selectedMentor, selectedTitle]);

  const dateOptions = useMemo(() => [...new Set(webinars.map((w) => w.date).filter(Boolean))].sort().reverse(), [webinars]);
  const mentorOptions = useMemo(() => [...new Set(webinars.map((w) => w.mentor).filter(Boolean))].sort(), [webinars]);
  const webinarOptions = useMemo(
    () =>
      webinars
        .map((w, index) => ({ ...w, index }))
        .filter((w) => (!selectedDate || w.date === selectedDate) && (!selectedMentor || w.mentor === selectedMentor)),
    [webinars, selectedDate, selectedMentor]
  );

  const changeDate = (v) => { setSelectedDate(v); setSelectedKey(""); setReport(null); setNotice(""); };
  const changeMentor = (v) => { setSelectedMentor(v); setSelectedKey(""); setReport(null); setNotice(""); };
  const changeWebinar = (v) => { setSelectedKey(v); setReport(null); setNotice(""); };

  // Individual-webinar actions need a webinar that has a linked session record.
  const requireReportableWebinar = () => {
    if (!selectedWebinar) {
      setNotice("Please select a webinar first.");
      return null;
    }
    if (!selectedWebinar.session_id) {
      setNotice("This webinar has no linked session record, so a detailed report isn't available.");
      return null;
    }
    setNotice("");
    return selectedWebinar.session_id;
  };

  const generateReport = () => {
    const id = requireReportableWebinar();
    if (!id) return;
    fetch(`${API}/webinar-report/${id}`).then((r) => r.json()).then(setReport).catch(() => setNotice("Couldn't generate the report."));
    fetch(`${API}/webinar-registrations/${id}`).then((r) => r.json()).then((d) => setRegistrations(Array.isArray(d) ? d : [])).catch(() => setRegistrations([]));
  };

  const exportPdf = () => {
    const id = requireReportableWebinar();
    if (id) window.open(`${API}/export-webinar-pdf/${id}`, "_blank");
  };

  const exportExcel = () => {
    window.open(`${API}/webinar-analytics/export-excel${buildQuery({ date: selectedDate, mentor: selectedMentor, title: selectedTitle })}`, "_blank");
  };

  const insights = useMemo(() => buildInsights(summary, attendanceTrend), [summary, attendanceTrend]);
  const attention = useMemo(() => buildAttention(summary, attendanceTrend, pollData), [summary, attendanceTrend, pollData]);
  const takeaways = useMemo(() => buildTakeaways(summary, attendanceTrend), [summary, attendanceTrend]);
  const totals = useMemo(() => pollTotals(pollData), [pollData]);

  return (
    <ProtectedRoute>
      <>
        <Sidebar />

        <div className="page">
          {/* Hero */}
          <div className="hero">
            <div className="hero-glow" />
            <div className="hero-left">
              <div className="hero-eyebrow">Learner Engagement</div>
              <h1>Webinar Analytics Dashboard</h1>
              <p>Track attendance, engagement and performance across all your webinars.</p>
            </div>
            <div className="hero-tagline">
              <Quote size={12} />
              <span>Better Webinars<br />Build Brighter Careers”</span>
            </div>
            <div className="hero-user">
              <span className="hero-bell"><Bell size={16} strokeWidth={2.1} /></span>
              {currentUser && (
                <>
                  {userPhotoUrl(currentUser) ? (
                    <img src={userPhotoUrl(currentUser)} alt={currentUser.name} className="hero-avatar" />
                  ) : (
                    <span className="hero-avatar hero-avatar-fallback">{initials(currentUser.name)}</span>
                  )}
                  <div className="hero-user-text">
                    <div className="hero-user-name">{currentUser.name}</div>
                    <div className="hero-user-role">{currentUser.role || ""}</div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="filters">
            <FilterField icon={CalendarDays} label="Date" value={selectedDate} onChange={changeDate}>
              <option value="">All Dates</option>
              {dateOptions.map((d) => <option key={d} value={d}>{d}</option>)}
            </FilterField>
            <FilterField icon={Users} label="Mentor" value={selectedMentor} onChange={changeMentor}>
              <option value="">All Mentors</option>
              {mentorOptions.map((m) => <option key={m} value={m}>{m}</option>)}
            </FilterField>
            <FilterField icon={Presentation} label="Webinar" value={selectedKey} onChange={changeWebinar}>
              <option value="">Select Webinar</option>
              {webinarOptions.map((w) => (
                <option key={w.index} value={w.index}>{`${(w.title || "Untitled").trim()} | ${w.mentor || "—"} | ${w.date || "—"}`}</option>
              ))}
            </FilterField>

            <button className="btn-generate" onClick={generateReport}>Generate Report</button>
            <div className="export-group">
              <button className="btn-pdf" onClick={exportPdf}><FileText size={14} /> Export PDF</button>
              <button className="btn-excel" onClick={exportExcel}><FileSpreadsheet size={14} /> Export Excel</button>
            </div>
          </div>
          {notice && (
            <div className="notice"><AlertTriangle size={14} /> {notice}</div>
          )}

          {error && <div className="error-banner">{error}</div>}

          {/* KPI row */}
          {summary ? (
            <div className={`kpis ${loading ? "kpis-loading" : ""}`}>
              <KpiTile icon={Video} label="Total Webinars" value={summary.total_webinars} color="blue" />
              <KpiTile icon={Users} label="Registered Learners" value={summary.registered_learners} color="green" />
              <KpiTile icon={UserCheck} label="Attended Learners" value={summary.attended_learners} color="blue" />
              <KpiTile icon={Percent} label="Attendance Rate" value={`${summary.attendance_rate}%`} color="purple" />
              <KpiTile icon={MessageSquareText} label="Poll Response Rate" value={`${summary.poll_response_rate}%`} color="green" />
              <KpiTile icon={Star} label="Session Rating" value={summary.session_rating} color="amber" />
              <KpiTile icon={Heart} label="Health Score" value={summary.webinar_health_score} suffix="/ 100" color="red" />
            </div>
          ) : (
            <div className="loading-box"><RefreshCw size={16} className="spin" /> Loading webinar analytics…</div>
          )}

          {summary && (
            <>
              <div className="row row-attendance">
                <AttendanceTrendCard data={attendanceTrend} average={summary.total_webinars ? summary.attendance_rate : null} insight={chartInsight(summary, attendanceTrend)} />
                <InsightsPanel insights={insights} />
              </div>

              <div className="row row-poll">
                <PollAnalyticsCard polls={pollData} totals={totals} insight={pollInsight(pollData)} />
                <AttentionPanel
                  items={attention}
                  healthStatus={summary.total_webinars ? summary.webinar_health_status : ""}
                  expanded={attentionExpanded}
                  onToggle={() => setAttentionExpanded((v) => !v)}
                />
              </div>

              <div className="row-single">
                <KeyTakeaways items={takeaways} />
              </div>
            </>
          )}

          {report && (
            <div className="row-single">
              <WebinarReportPanel report={report} registrations={registrations} />
            </div>
          )}

          <footer className="foot">
            <span><RefreshCw size={12} /> Last updated: {lastUpdated ? lastUpdated.toLocaleString(undefined, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}</span>
            <em>“Insight today. Impact tomorrow.”</em>
          </footer>
        </div>

        <style jsx>{`
          .page { margin-left: var(--om-sidebar-width, 280px); transition: margin-left 0.25s ease; padding: 0 22px 24px; background: #f1f5f9; min-height: 100vh; }

          .hero { position: relative; overflow: hidden; display: flex; align-items: center; gap: 24px; margin: 0 -22px 14px; padding: 18px 30px 20px; background: linear-gradient(115deg, #0b1220 0%, #101b33 55%, #0b1220 100%); border-radius: 0 0 16px 16px; box-shadow: 0 10px 28px -16px rgba(11, 18, 32, 0.8); }
          .hero-glow { position: absolute; width: 320px; height: 220px; right: 22%; top: -110px; background: rgba(245, 166, 35, 0.16); filter: blur(70px); pointer-events: none; }
          .hero-left { position: relative; z-index: 1; flex: 1; min-width: 0; }
          .hero-eyebrow { display: inline-block; font-size: 9.5px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: #f5a623; border: 1px solid rgba(245, 166, 35, 0.6); border-radius: 999px; padding: 3px 9px; margin-bottom: 8px; }
          h1 { margin: 0 0 4px; font-size: 21px; font-weight: 800; color: #f8fafc; line-height: 1.2; }
          .hero-left p { margin: 0; font-size: 11.5px; color: #94a3b8; }
          .hero-tagline { position: relative; z-index: 1; display: flex; align-items: flex-start; gap: 6px; font-family: "Playfair Display", Georgia, serif; font-style: italic; font-size: 13px; color: #94a3b8; text-align: left; line-height: 1.5; }
          .hero-user { position: relative; z-index: 1; display: flex; align-items: center; gap: 12px; }
          .hero-bell { color: #e2e8f0; display: flex; }
          .hero-avatar { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; }
          .hero-avatar-fallback { background: linear-gradient(135deg, #7c3aed, #6366f1); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; }
          .hero-user-name { font-size: 12px; font-weight: 700; color: #f8fafc; }
          .hero-user-role { font-size: 10.5px; color: #94a3b8; }

          .filters { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; background: #fff; border: 1px solid #e8edf5; border-radius: 12px; padding: 14px 18px; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05); margin-bottom: 14px; }
          .btn-generate { flex: 1.2 1 130px; border: none; border-radius: 8px; padding: 11px 18px; font-size: 13px; font-weight: 700; color: #0f172a; cursor: pointer; background: linear-gradient(90deg, #f59e0b, #fbbf24); box-shadow: 0 6px 14px -8px rgba(245, 158, 11, 0.8); transition: transform 0.15s ease; }
          .btn-generate:hover { transform: translateY(-1px); }
          .export-group { display: flex; gap: 8px; padding-left: 14px; border-left: 1px solid #e8edf5; flex-shrink: 0; }
          .btn-pdf, .btn-excel { display: inline-flex; align-items: center; gap: 6px; border: none; border-radius: 6px; padding: 10px 13px; font-size: 12px; font-weight: 700; color: #fff; cursor: pointer; white-space: nowrap; transition: transform 0.15s ease; }
          .btn-pdf { background: #dc2626; }
          .btn-excel { background: #16a34a; }
          .btn-pdf:hover, .btn-excel:hover { transform: translateY(-1px); }

          .notice { display: flex; align-items: center; gap: 8px; background: #fffbeb; border: 1px solid #fde68a; color: #92400e; border-radius: 8px; padding: 9px 14px; font-size: 12.5px; font-weight: 600; margin: -6px 0 14px; }
          .error-banner { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; border-radius: 8px; padding: 10px 14px; font-size: 13px; margin-bottom: 14px; }

          .kpis { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 12px; margin-bottom: 14px; transition: opacity 0.15s ease; }
          .kpis-loading { opacity: 0.55; }
          .loading-box { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 60px 0; color: #64748b; font-size: 13.5px; }
          .loading-box :global(.spin) { animation: spin 0.9s linear infinite; }

          .row { display: grid; gap: 14px; margin-bottom: 14px; }
          .row-attendance { grid-template-columns: minmax(0, 1.12fr) minmax(0, 1fr); }
          .row-poll { grid-template-columns: minmax(0, 1.12fr) minmax(0, 1fr); }
          .row-single { margin-bottom: 14px; }

          .foot { display: flex; align-items: center; justify-content: space-between; padding: 6px 4px 0; font-size: 11px; color: #64748b; }
          .foot span { display: inline-flex; align-items: center; gap: 6px; }
          .foot em { font-family: "Playfair Display", Georgia, serif; }

          @keyframes spin { to { transform: rotate(360deg); } }

          @media (max-width: 1500px) { .kpis { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
          @media (max-width: 1200px) {
            .row-attendance, .row-poll { grid-template-columns: 1fr; }
            .hero-tagline { display: none; }
          }
          @media (max-width: 900px) { .kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); } .export-group { border-left: none; padding-left: 0; } }
        `}</style>
      </>
    </ProtectedRoute>
  );
}
