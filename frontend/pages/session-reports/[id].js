import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Sidebar from "../../components/Sidebar";
import ProtectedRoute from "../../components/ProtectedRoute";
import {
  Info,
  Radio,
  Users,
  UserCheck,
  UserX,
  Clock3,
  CalendarClock,
  TrendingUp,
  Gauge,
  Video,
  Link2,
  BookOpen,
  ClipboardList,
  MessageSquare,
  Award,
  CheckCircle2,
  XCircle,
  Trash2,
  FileText,
  Presentation,
  Star,
} from "lucide-react";

const API = "http://127.0.0.1:8000";

const REPORT_STATUSES = ["Pending", "Submitted", "Reviewed"];

const REPORT_STATUS_META = {
  Pending: { tone: "warning", icon: Clock3, message: "This report hasn't been submitted by operations yet." },
  Submitted: { tone: "info", icon: FileText, message: "Report submitted — awaiting operations review." },
  Reviewed: { tone: "positive", icon: CheckCircle2, message: "Report reviewed and finalized." },
};

const TONES = {
  positive: { bg: "#dcfce7", color: "#15803d" },
  negative: { bg: "#fee2e2", color: "#b91c1c" },
  warning: { bg: "#fef3c7", color: "#b45309" },
  info: { bg: "#dbeafe", color: "#1d4ed8" },
  neutral: { bg: "#f1f5f9", color: "#475569" },
};

function SectionHeader({ icon: Icon, title, accent = "#f59e0b", right }) {
  return (
    <div className="section-header">
      <div className="section-header-left">
        <span className="section-icon" style={{ background: `${accent}1a`, color: accent }}>
          <Icon size={16} strokeWidth={2.2} />
        </span>
        <h2 className="card-title">{title}</h2>
      </div>
      {right}
      <style jsx>{`
        .section-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 16px; width: 100%; }
        .section-header-left { display: flex; align-items: center; gap: 10px; }
        .section-icon { display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 9px; flex-shrink: 0; }
        .card-title { margin: 0; font-size: 16px; color: #1e293b; }
      `}</style>
    </div>
  );
}

function ProgressBar({ percent, color = "#16a34a" }) {
  const pct = Math.max(0, Math.min(100, percent || 0));
  return (
    <div className="progress-track">
      <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
      <style jsx>{`
        .progress-track { height: 5px; border-radius: 999px; background: #f1f5f9; overflow: hidden; margin-top: 8px; }
        .progress-fill { height: 100%; border-radius: 999px; transition: width 0.4s ease; }
      `}</style>
    </div>
  );
}

function KPICard({ label, value, color = "#0f172a", icon: Icon, percent }) {
  return (
    <div className="kpi-card" style={{ borderLeft: `4px solid ${color}` }}>
      <div className="kpi-card-top">
        <span className="kpi-label">{label}</span>
        {Icon && <Icon size={14} color={color} strokeWidth={2.4} />}
      </div>
      <div className="kpi-value" style={{ color: typeof value === "string" || typeof value === "number" ? color : undefined }}>
        {value === null || value === undefined || value === "" ? "N/A" : value}
      </div>
      {typeof percent === "number" && <ProgressBar percent={percent} color={color} />}
      <style jsx>{`
        .kpi-card {
          background: #fff;
          padding: 14px 16px;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .kpi-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 18px -10px rgba(15, 23, 42, 0.25);
        }
        .kpi-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
        }
        .kpi-label {
          font-size: 10.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          color: #94a3b8;
        }
        .kpi-value {
          font-size: 19px;
          font-weight: 800;
          font-variant-numeric: tabular-nums;
        }
      `}</style>
    </div>
  );
}

function StatusPill({ label, tone = "neutral", icon: Icon }) {
  const t = TONES[tone] || TONES.neutral;
  return (
    <span className="status-pill" style={{ background: t.bg, color: t.color }}>
      {Icon && <Icon size={12} strokeWidth={2.6} />}
      {label}
      <style jsx>{`
        .status-pill { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 999px; }
      `}</style>
    </span>
  );
}

function boolPill(flag, trueLabel = "Yes", falseLabel = "No") {
  return flag
    ? <StatusPill label={trueLabel} tone="positive" icon={CheckCircle2} />
    : <StatusPill label={falseLabel} tone="negative" icon={XCircle} />;
}

function Field({ label, value }) {
  return (
    <div style={{ marginBottom: "10px" }}>
      <div className="mini-label">{label}</div>
      <div className="mini-value">{value === null || value === undefined || value === "" ? "—" : String(value)}</div>
      <style jsx>{`
        .mini-label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #94a3b8; margin-bottom: 4px; }
        .mini-value { font-size: 14px; font-weight: 600; color: #0f172a; word-break: break-word; }
      `}</style>
    </div>
  );
}

function NoteCard({ label, icon: Icon, value }) {
  return (
    <div className="note-card">
      <div className="note-card-head">
        <Icon size={14} strokeWidth={2.2} />
        <span>{label}</span>
      </div>
      <p className="note-card-body">{value || "Not added yet."}</p>
      <style jsx>{`
        .note-card { background: #f8fafc; border: 1px solid #eef2f7; border-radius: 12px; padding: 14px 16px; }
        .note-card-head { display: flex; align-items: center; gap: 7px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; color: #64748b; margin-bottom: 8px; }
        .note-card-body { margin: 0; font-size: 13px; color: #1e293b; line-height: 1.6; white-space: pre-wrap; word-break: break-word; }
      `}</style>
    </div>
  );
}

function LinkChip({ label, url, icon: Icon }) {
  const Tag = url ? "a" : "div";
  const linkProps = url ? { href: url, target: "_blank", rel: "noreferrer" } : {};

  return (
    <Tag className={`link-chip ${url ? "link-chip-active" : "link-chip-empty"}`} {...linkProps}>
      <Icon size={14} strokeWidth={2.2} />
      <span className="link-chip-label">{label}</span>
      <span className="link-chip-status">{url ? "Open ↗" : "Not added"}</span>
      <style jsx>{`
        .link-chip { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-radius: 10px; font-size: 13px; font-weight: 600; text-decoration: none; border: 1px solid transparent; }
        .link-chip-active { background: #eff6ff; color: #1d4ed8; border-color: #dbeafe; }
        .link-chip-active:hover { background: #dbeafe; }
        .link-chip-empty { background: #f8fafc; color: #94a3b8; border-color: #eef2f7; }
        .link-chip-label { flex: 1; }
        .link-chip-status { font-size: 11px; font-weight: 700; opacity: 0.85; }
      `}</style>
    </Tag>
  );
}

function FieldLabel({ icon: Icon, children }) {
  return (
    <label className="field-label">
      <Icon size={12} strokeWidth={2.4} />
      {children}
      <style jsx>{`
        .field-label { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; letter-spacing: 0.03em; text-transform: uppercase; color: #64748b; margin-bottom: 6px; }
      `}</style>
    </label>
  );
}

const inputStyle = { width: "100%", padding: "9px 11px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "13px", background: "#f8fafc", boxSizing: "border-box", outline: "none" };
const textareaStyle = { ...inputStyle, minHeight: "70px", resize: "vertical", fontFamily: "inherit" };

export default function SessionReportDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [bundle, setBundle] = useState(null);
  const [liveDetails, setLiveDetails] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [reportForm, setReportForm] = useState(null);
  const [savingReport, setSavingReport] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const load = () => {
    if (!id) return;
    setLoading(true);

    Promise.all([
      fetch(`${API}/session-reports/${id}`).then((r) => r.json()),
      fetch(`${API}/session-reports/${id}/live-details`).then((r) => r.json()),
      fetch(`${API}/session-reports/${id}/attendance`).then((r) => r.json()),
      fetch(`${API}/session-reports/${id}/feedback`).then((r) => r.json()),
    ])
      .then(([detail, live, att, fb]) => {
        if (!detail.success) {
          setNotFound(true);
          return;
        }
        setBundle(detail);
        setReportForm(detail.report);
        setLiveDetails(live.success ? live : null);
        setAttendance(att.success ? att : null);
        setFeedback(fb.success ? fb : null);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const saveReport = async () => {
    setSavingReport(true);
    setSaveMessage("");
    try {
      const res = await fetch(`${API}/session-reports/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reportForm),
      });
      const data = await res.json();
      setSaveMessage(data.success ? "Report saved." : data.message || "Could not save report.");
      load();
    } catch {
      setSaveMessage("Unable to reach the server.");
    } finally {
      setSavingReport(false);
    }
  };

  const updateReportStatus = async (status) => {
    await fetch(`${API}/session-reports/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ report_status: status }),
    });
    load();
  };

  const removeAttendance = async (attendanceId) => {
    if (!window.confirm("Remove this attendance record?")) return;
    await fetch(`${API}/session-reports/${id}/attendance/${attendanceId}`, { method: "DELETE" });
    load();
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <>
          <Sidebar />
          <div style={{ marginLeft: "280px", padding: "32px 36px", background: "#f1f5f9", minHeight: "100vh" }}>
            <div className="card">Loading session report…</div>
          </div>
          <style jsx>{`.card { background: #fff; border-radius: 16px; padding: 22px 24px; box-shadow: 0 1px 3px rgba(15,23,42,0.06); border: 1px solid #eef2f7; }`}</style>
        </>
      </ProtectedRoute>
    );
  }

  if (notFound || !bundle) {
    return (
      <ProtectedRoute>
        <>
          <Sidebar />
          <div style={{ marginLeft: "280px", padding: "32px 36px", background: "#f1f5f9", minHeight: "100vh" }}>
            <div className="card">Session not found. <Link href="/session-reports">← Back to Session Reports</Link></div>
          </div>
          <style jsx>{`.card { background: #fff; border-radius: 16px; padding: 22px 24px; box-shadow: 0 1px 3px rgba(15,23,42,0.06); border: 1px solid #eef2f7; }`}</style>
        </>
      </ProtectedRoute>
    );
  }

  const { session_info, content, performance, mentor_info } = bundle;
  const statusMeta = REPORT_STATUS_META[reportForm?.report_status] || REPORT_STATUS_META.Pending;

  return (
    <ProtectedRoute>
      <>
        <Sidebar />

        <div style={{ marginLeft: "280px", padding: "32px 36px 60px", background: "#f1f5f9", minHeight: "100vh" }}>
          <Link href="/session-reports" className="back-link">← Back to Session Reports</Link>

          <div className="card" style={{ marginBottom: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
              <div>
                <h1 style={{ margin: "0 0 8px", fontSize: "22px", color: "#0f172a" }}>{session_info.topic}</h1>
                <div style={{ color: "#64748b", fontSize: "14px" }}>
                  Session #{session_info.id} · {session_info.mentor_name} · {session_info.session_date} {session_info.session_time || ""} · {session_info.status}
                </div>
              </div>
              <a href={`${API}/session-reports/${id}/download`} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
                <button className="btn btn-export">⬇️ Download Report</button>
              </a>
            </div>
          </div>

          {/* A. Session Information */}
          <div className="card" style={{ marginBottom: "24px" }}>
            <SectionHeader icon={Info} title="A. Session Information" accent="#3b82f6" />
            <div className="field-grid">
              <Field label="Session ID" value={session_info.id} />
              <Field label="Topic" value={session_info.topic} />
              <Field label="Session Date" value={session_info.session_date} />
              <Field label="Start Time" value={session_info.session_time} />
              <Field label="Duration" value={session_info.duration ? `${session_info.duration} min` : null} />
              <Field label="Session Type" value={session_info.session_type} />
              <Field label="Status" value={session_info.status} />
              <Field label="Course" value={session_info.course_name} />
              <Field label="Batch" value={session_info.batch_name} />
              <Field label="Mentor" value={session_info.mentor_name} />
              <Field label="Mentor Email" value={session_info.mentor_email} />
            </div>
          </div>

          {/* B. Live Session Details */}
          <div className="card" style={{ marginBottom: "24px" }}>
            <SectionHeader icon={Radio} title="B. Live Session Details" accent="#8b5cf6" />
            <div className="field-grid">
              <Field label="Live Session Link" value={liveDetails?.meeting_link} />
              <Field label="Platform" value={liveDetails?.platform} />
              <Field label="Session Started At" value={liveDetails?.session_started_at} />
              <Field label="Session Ended At" value={liveDetails?.session_ended_at} />
              <Field label="Actual Duration" value={liveDetails?.actual_duration ? `${liveDetails.actual_duration} min` : null} />
              <Field label="Scheduled Duration" value={liveDetails?.scheduled_duration ? `${liveDetails.scheduled_duration} min` : null} />
              <Field label="Duration Variance" value={liveDetails?.duration_variance !== null && liveDetails?.duration_variance !== undefined ? `${liveDetails.duration_variance} min` : null} />
              <Field label="Recording Available" value={liveDetails?.recording_available ? "Yes" : "No"} />
              <Field label="Recording Link" value={liveDetails?.recording_link} />
              <Field label="Recording Status" value={liveDetails?.recording_status} />
              <Field label="Session Link Status" value={liveDetails?.session_link_status} />
            </div>
            {!liveDetails?.session_started_at && (
              <p className="hint-text">ℹ️ No Zoom integration is connected yet — start/end times come from Session Analytics when available.</p>
            )}
          </div>

          {/* C. Attendance Report */}
          <div className="card" style={{ marginBottom: "24px" }}>
            <SectionHeader icon={Users} title="C. Attendance Report" accent="#16a34a" />
            {attendance && (
              <div className="kpi-grid" style={{ marginBottom: "18px" }}>
                <KPICard label="Total Learners" value={attendance.total_learners} icon={Users} />
                <KPICard label="Present" value={attendance.present} color="#16a34a" icon={UserCheck} />
                <KPICard label="Absent" value={attendance.absent} color="#dc2626" icon={UserX} />
                <KPICard label="Late" value={attendance.late} color="#f59e0b" icon={Clock3} />
                <KPICard label="Attendance %" value={`${attendance.attendance_percentage}%`} color="#16a34a" icon={TrendingUp} percent={attendance.attendance_percentage} />
                <KPICard label="Avg Join Time" value={attendance.average_join_time} icon={CalendarClock} />
                <KPICard label="Avg Leave Time" value={attendance.average_leave_time} icon={CalendarClock} />
              </div>
            )}

            {!attendance?.has_detailed_rows && (
              <p className="hint-text">ℹ️ No individual attendance records captured yet — the KPIs above use the session's aggregate attendance count.</p>
            )}

            <div className="table-wrap">
              <table className="styled-table">
                <thead>
                  <tr>
                    <th>Learner Name</th><th>Email</th><th>Join Time</th><th>Leave Time</th><th>Duration</th><th>Status</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {(attendance?.learners || []).map((l) => (
                    <tr key={l.id}>
                      <td className="strong">{l.learner_name}</td>
                      <td className="muted">{l.learner_email || "—"}</td>
                      <td className="muted">{l.join_time || "—"}</td>
                      <td className="muted">{l.leave_time || "—"}</td>
                      <td className="muted">{l.duration_minutes ? `${l.duration_minutes} min` : "—"}</td>
                      <td>{l.attendance_status}</td>
                      <td><button className="btn-icon" onClick={() => removeAttendance(l.id)}><Trash2 size={14} strokeWidth={2.2} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(attendance?.learners || []).length === 0 && <div className="empty-state">No individual attendance records yet.</div>}
            </div>
          </div>

          {/* D. Session Performance */}
          <div className="card" style={{ marginBottom: "24px" }}>
            <SectionHeader icon={Gauge} title="D. Session Performance" accent="#f59e0b" />
            <div className="kpi-grid">
              <KPICard label="Scheduled Duration" value={performance.scheduled_duration ? `${performance.scheduled_duration} min` : null} icon={Clock3} />
              <KPICard label="Actual Duration" value={performance.actual_duration ? `${performance.actual_duration} min` : null} icon={Clock3} />
              <KPICard label="Attendance %" value={`${performance.attendance_percentage}%`} color="#16a34a" icon={TrendingUp} percent={performance.attendance_percentage} />
              <KPICard label="Completion %" value={performance.completion_percentage !== null ? `${performance.completion_percentage}%` : null} color="#3b82f6" icon={CheckCircle2} percent={performance.completion_percentage ?? undefined} />
              <KPICard label="Session SLA Status" value={<StatusPill label={performance.sla_status} tone={performance.sla_status === "Breached" ? "negative" : performance.sla_status === "Met" ? "positive" : "neutral"} icon={performance.sla_status === "Breached" ? XCircle : CheckCircle2} />} />
              <KPICard label="Recording Available" value={boolPill(performance.recording_available)} />
              <KPICard label="Report Submitted" value={boolPill(performance.report_submitted)} />
              <KPICard label="Mentor Feedback Submitted" value={boolPill(performance.mentor_feedback_submitted)} />
            </div>
          </div>

          {/* E. Session Content */}
          <div className="card" style={{ marginBottom: "24px" }}>
            <SectionHeader icon={BookOpen} title="E. Session Content" accent="#0ea5e9" />
            <Field label="Session Topic" value={content.topic} />

            <div className="note-grid">
              <NoteCard label="Agenda" icon={ClipboardList} value={content.agenda} />
              <NoteCard label="Learning Objectives" icon={Award} value={content.learning_objectives} />
              <NoteCard label="Topics Covered" icon={BookOpen} value={content.topics_covered} />
            </div>

            <div className="mini-label" style={{ marginTop: "18px", marginBottom: "8px" }}>Links</div>
            <div className="link-chip-grid">
              <LinkChip label="LMS Content" url={content.lms_content_link} icon={BookOpen} />
              <LinkChip label="Presentation" url={content.presentation_link} icon={Presentation} />
              <LinkChip label="Assignment" url={content.assignment_link} icon={ClipboardList} />
              <LinkChip label="Recording" url={content.recording_link} icon={Video} />
            </div>

            {content.resources?.length > 0 && (
              <>
                <div className="mini-label" style={{ marginTop: "18px", marginBottom: "8px" }}>Submitted Resources (Resource Portal)</div>
                <div className="table-wrap">
                  <table className="styled-table">
                    <thead><tr><th>Type</th><th>Category</th><th>Title</th><th>Link</th></tr></thead>
                    <tbody>
                      {content.resources.map((r, i) => (
                        <tr key={i}>
                          <td className="muted">{r.resource_type}</td>
                          <td className="muted">{r.resource_category || "—"}</td>
                          <td className="strong">{r.resource_title}</td>
                          <td>{r.resource_url ? <a href={r.resource_url} target="_blank" rel="noreferrer">Open ↗</a> : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* F. Mentor Information */}
          <div className="card" style={{ marginBottom: "24px" }}>
            <SectionHeader icon={Award} title="F. Mentor Information" accent="#8b5cf6" />
            <div className="field-grid">
              <Field label="Mentor Name" value={mentor_info.mentor_name} />
              <Field label="Mentor Email" value={mentor_info.mentor_email} />
              <Field label="Expertise" value={mentor_info.expertise} />
              <Field label="Session Count" value={mentor_info.session_count} />
              <Field label="Average Feedback Score" value={mentor_info.average_feedback_score !== null ? `${mentor_info.average_feedback_score} / 5` : null} />
              <Field label="Mentor Feedback" value={reportForm?.mentor_feedback} />
              <Field label="Feedback Status" value={reportForm?.mentor_feedback ? "Submitted" : "Pending"} />
            </div>
          </div>

          {/* G. Session Report (editable) */}
          <div className="card" style={{ marginBottom: "24px" }}>
            <SectionHeader
              icon={FileText}
              title="G. Session Report"
              accent="#f59e0b"
              right={
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span className="mini-label" style={{ marginBottom: 0 }}>Report Status</span>
                  <select style={{ ...inputStyle, width: "160px" }} value={reportForm?.report_status || "Pending"} onChange={(e) => updateReportStatus(e.target.value)}>
                    {REPORT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              }
            />

            <div className="status-banner" style={{ background: TONES[statusMeta.tone].bg, color: TONES[statusMeta.tone].color }}>
              <statusMeta.icon size={16} strokeWidth={2.4} />
              {statusMeta.message}
            </div>

            {reportForm && (
              <div className="report-form">
                <div>
                  <FieldLabel icon={FileText}>Session Summary</FieldLabel>
                  <textarea style={textareaStyle} value={reportForm.summary || ""} onChange={(e) => setReportForm({ ...reportForm, summary: e.target.value })} />
                </div>
                <div>
                  <FieldLabel icon={BookOpen}>Topics Covered</FieldLabel>
                  <textarea style={textareaStyle} value={reportForm.topics_covered || ""} onChange={(e) => setReportForm({ ...reportForm, topics_covered: e.target.value })} />
                </div>
                <div>
                  <FieldLabel icon={MessageSquare}>Learner Questions</FieldLabel>
                  <textarea style={textareaStyle} value={reportForm.learner_questions || ""} onChange={(e) => setReportForm({ ...reportForm, learner_questions: e.target.value })} />
                </div>
                <div>
                  <FieldLabel icon={MessageSquare}>Important Discussion Points</FieldLabel>
                  <textarea style={textareaStyle} value={reportForm.discussion_points || ""} onChange={(e) => setReportForm({ ...reportForm, discussion_points: e.target.value })} />
                </div>
                <div>
                  <FieldLabel icon={XCircle}>Issues Faced</FieldLabel>
                  <textarea style={textareaStyle} value={reportForm.issues_faced || ""} onChange={(e) => setReportForm({ ...reportForm, issues_faced: e.target.value })} />
                </div>
                <div>
                  <FieldLabel icon={XCircle}>Technical Issues</FieldLabel>
                  <textarea style={textareaStyle} value={reportForm.technical_issues || ""} onChange={(e) => setReportForm({ ...reportForm, technical_issues: e.target.value })} />
                </div>
                <div>
                  <FieldLabel icon={TrendingUp}>Learner Engagement</FieldLabel>
                  <textarea style={textareaStyle} value={reportForm.learner_engagement || ""} onChange={(e) => setReportForm({ ...reportForm, learner_engagement: e.target.value })} />
                </div>
                <div>
                  <FieldLabel icon={Award}>Mentor Feedback</FieldLabel>
                  <textarea style={textareaStyle} value={reportForm.mentor_feedback || ""} onChange={(e) => setReportForm({ ...reportForm, mentor_feedback: e.target.value })} />
                </div>
                <div>
                  <FieldLabel icon={ClipboardList}>Operations Notes</FieldLabel>
                  <textarea style={textareaStyle} value={reportForm.operations_notes || ""} onChange={(e) => setReportForm({ ...reportForm, operations_notes: e.target.value })} />
                </div>
                <div>
                  <FieldLabel icon={CheckCircle2}>Action Items</FieldLabel>
                  <textarea style={textareaStyle} value={reportForm.action_items || ""} onChange={(e) => setReportForm({ ...reportForm, action_items: e.target.value })} />
                </div>
                <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 600, color: "#334155" }}>
                    <input type="checkbox" checked={!!reportForm.follow_up_required} onChange={(e) => setReportForm({ ...reportForm, follow_up_required: e.target.checked })} />
                    Follow-up Required
                  </label>
                  {reportForm.follow_up_required && (
                    <input type="date" style={{ ...inputStyle, width: "180px" }} value={reportForm.follow_up_date || ""} onChange={(e) => setReportForm({ ...reportForm, follow_up_date: e.target.value })} />
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <button className="btn btn-primary" disabled={savingReport} onClick={saveReport}>{savingReport ? "Saving…" : "Save Report"}</button>
                  {saveMessage && <span className="save-message">{saveMessage}</span>}
                </div>
              </div>
            )}
          </div>

          {/* H. Session Feedback */}
          <div className="card">
            <SectionHeader icon={Star} title="H. Session Feedback" accent="#f59e0b" />
            <div className="kpi-grid">
              <KPICard label="Average Rating" value={feedback?.average_rating ? `${feedback.average_rating} / 5` : null} color="#f59e0b" icon={Star} />
              <KPICard label="NPS (approx.)" value={feedback?.nps?.average_score} color="#8b5cf6" icon={TrendingUp} />
            </div>
            {feedback?.nps && (
              <p className="hint-text">
                ℹ️ {feedback.nps.note} — based on {feedback.nps.response_count} matching response(s).
              </p>
            )}
            <div className="field-grid" style={{ marginTop: "12px" }}>
              <Field label="Mentor Feedback" value={feedback?.mentor_feedback} />
              <Field label="Operations Feedback" value={feedback?.operations_feedback} />
            </div>
          </div>
        </div>

        <style jsx>{`
          .back-link { display: inline-block; margin-bottom: 16px; color: #475569; font-size: 13px; text-decoration: none; font-weight: 600; }
          .back-link:hover { text-decoration: underline; }

          .card { background: #ffffff; border-radius: 16px; padding: 22px 24px; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06); border: 1px solid #eef2f7; }

          .field-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 4px 24px; }
          .mini-label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #94a3b8; margin-bottom: 4px; }
          .mini-value { font-size: 14px; font-weight: 600; color: #0f172a; word-break: break-word; }

          .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 14px; }

          .status-banner { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; padding: 10px 14px; border-radius: 10px; margin-bottom: 18px; }

          .note-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; margin-top: 14px; }

          .link-chip-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; }

          .hint-text { font-size: 12px; color: #94a3b8; margin: 10px 0 0; }

          .table-wrap { overflow-x: auto; margin-top: 12px; }
          .styled-table { width: 100%; border-collapse: collapse; font-size: 13px; }
          .styled-table thead th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: #94a3b8; font-weight: 700; padding: 10px 12px; border-bottom: 2px solid #f1f5f9; white-space: nowrap; }
          .styled-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #1e293b; }
          .styled-table td.muted { color: #94a3b8; }
          .styled-table td.strong { font-weight: 700; }

          .report-form { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-top: 4px; }

          .btn { border: none; border-radius: 10px; padding: 10px 18px; font-size: 13px; font-weight: 700; cursor: pointer; }
          .btn:disabled { cursor: not-allowed; opacity: 0.6; }
          .btn-primary { background: linear-gradient(120deg, #f59e0b, #fbbf24); color: #0f172a; }
          .btn-export { background: #16a34a; color: white; }

          .btn-icon { background: transparent; border: none; cursor: pointer; padding: 6px; border-radius: 6px; color: #94a3b8; display: inline-flex; align-items: center; }
          .btn-icon:hover { background: #fee2e2; color: #b91c1c; }

          .save-message { font-size: 13px; color: #16a34a; font-weight: 600; }

          .empty-state { text-align: center; padding: 30px 20px; color: #94a3b8; font-size: 14px; }
        `}</style>
      </>
    </ProtectedRoute>
  );
}
