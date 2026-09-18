import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import ProtectedRoute from "../components/ProtectedRoute";

const inputStyle = {
  width: "100%",
  padding: "11px 14px",
  borderRadius: "10px",
  border: "1px solid #e2e8f0",
  fontSize: "14px",
  background: "#f8fafc",
  boxSizing: "border-box",
  outline: "none",
};

const fieldLabelStyle = {
  display: "block",
  fontSize: "12px",
  fontWeight: 700,
  letterSpacing: "0.03em",
  color: "#64748b",
  marginBottom: "6px",
};

function Field({ label, children }) {
  return (
    <div>
      <label style={fieldLabelStyle}>{label}</label>
      {children}
    </div>
  );
}

function NumField({ label, value, onChange, step }) {
  return (
    <Field label={label}>
      <input
        type="number"
        step={step || 1}
        className="styled-input"
        style={inputStyle}
        value={value}
        onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
      />
    </Field>
  );
}

const STATUS_STYLES = {
  Scheduled: { bg: "#dbeafe", color: "#1d4ed8" },
  Completed: { bg: "#dcfce7", color: "#15803d" },
  Cancelled: { bg: "#fee2e2", color: "#b91c1c" },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || { bg: "#e2e8f0", color: "#475569" };
  return (
    <span
      style={{
        display: "inline-flex",
        background: s.bg,
        color: s.color,
        fontSize: "12px",
        fontWeight: 700,
        padding: "4px 10px",
        borderRadius: "999px",
        whiteSpace: "nowrap",
      }}
    >
      {status}
    </span>
  );
}

const POLL_HEALTH_STYLES = {
  Good: { bg: "#dcfce7", color: "#15803d" },
  Poor: { bg: "#fee2e2", color: "#b91c1c" },
};

function PollHealthBadge({ status }) {
  const s = POLL_HEALTH_STYLES[status] || { bg: "#e2e8f0", color: "#475569" };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        background: s.bg,
        color: s.color,
        fontSize: "13px",
        fontWeight: 700,
        padding: "6px 14px",
        borderRadius: "999px",
        whiteSpace: "nowrap",
      }}
    >
      {status || "—"}
    </span>
  );
}

const WEBINAR_HEALTH_STYLES = {
  Excellent: { bg: "#dcfce7", color: "#15803d" },
  Good: { bg: "#dbeafe", color: "#1d4ed8" },
  "Needs Improvement": { bg: "#fef3c7", color: "#b45309" },
  Poor: { bg: "#fee2e2", color: "#b91c1c" },
};

function healthStatusFor(score) {
  const n = Number(score) || 0;
  if (n >= 85) return "Excellent";
  if (n >= 70) return "Good";
  if (n >= 50) return "Needs Improvement";
  return "Poor";
}

function HealthBadgeInline({ status }) {
  const s = WEBINAR_HEALTH_STYLES[status] || { bg: "#e2e8f0", color: "#475569" };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        background: s.bg,
        color: s.color,
        fontSize: "13px",
        fontWeight: 700,
        padding: "6px 14px",
        borderRadius: "999px",
        whiteSpace: "nowrap",
      }}
    >
      {status || "—"}
    </span>
  );
}

const EMPTY_FORM = {
  session_id: "",
  meeting_id: "",
  webinar_status: "Scheduled",

  registered_learners: 0,
  attended_learners: 0,
  peak_concurrent_users: 0,
  average_watch_time: 0,
  late_joiners: 0,
  early_exit_learners: 0,
  average_join_time: "",
  average_leave_time: "",

  total_chat_messages: 0,
  learner_messages: 0,
  mentor_messages: 0,
  questions_asked: 0,
  raised_hands: 0,
  emoji_reactions: 0,

  questions_answered: 0,
  average_response_time: 0,
  resolved_questions: 0,
  open_questions: 0,

  polls_conducted: 0,
  poll_responses: 0,
  poll_response_rate: 0,
  poll_average_rating: 0,
  highest_rated_poll: 0,

  feedback_submitted: 0,
  session_rating: 0,
  mentor_rating: 0,
  content_rating: 0,
  audio_quality_rating: 0,
  video_quality_rating: 0,

  mentor_speaking_minutes: 0,
  learner_speaking_minutes: 0,
  qa_duration: 0,
  discussion_duration: 0,

  recording_available: false,
  recording_views: 0,
  average_recording_watch_time: 0,
  recording_completion_rate: 0,

  engagement_score: 0,
  webinar_health_score: 0,
  learner_satisfaction: 0,

  remarks: "",
};

export default function WebinarReports() {
  const [sessions, setSessions] = useState([]);
  const [reports, setReports] = useState([]);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [viewReport, setViewReport] = useState(null);

  const [registrations, setRegistrations] = useState([]);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState("");

  const [attendanceFile, setAttendanceFile] = useState(null);
  const [attendanceImporting, setAttendanceImporting] = useState(false);
  const [attendanceImportStatus, setAttendanceImportStatus] = useState("");

  const [pollFile, setPollFile] = useState(null);
  const [pollImporting, setPollImporting] = useState(false);
  const [pollImportStatus, setPollImportStatus] = useState("");
  const [pollHealthStatus, setPollHealthStatus] = useState("");
  const [pollBreakdown, setPollBreakdown] = useState([]);

  const loadSessions = async () => {
    const res = await fetch("http://127.0.0.1:8000/sessions");
    const data = await res.json();
    setSessions(data.filter((s) => s.session_type === "Webinar Session"));
  };

  const loadReports = async () => {
    const res = await fetch("http://127.0.0.1:8000/zoom-analytics");
    const data = await res.json();
    setReports(data);
  };

  const loadRegistrations = async (sessionId) => {
    if (!sessionId) {
      setRegistrations([]);
      return;
    }
    const res = await fetch(`http://127.0.0.1:8000/webinar-registrations/${sessionId}`);
    const data = await res.json();
    setRegistrations(data);
  };

  useEffect(() => {
    loadSessions();
    loadReports();
  }, []);

  useEffect(() => {
    loadRegistrations(form.session_id);
    setImportStatus("");
    setAttendanceImportStatus("");
    setPollImportStatus("");
    setPollHealthStatus("");
    setPollBreakdown([]);
  }, [form.session_id]);

  const set = (field) => (value) => setForm((f) => ({ ...f, [field]: value }));

  const selectedSession = sessions.find((s) => s.id === Number(form.session_id));

  const attendedLearners = registrations.filter((r) => r.attended);
  const avgDurationMinutes = attendedLearners.length
    ? Math.round(
        attendedLearners.reduce((sum, r) => sum + (r.attendance_duration_minutes || 0), 0) /
          attendedLearners.length
      )
    : 0;

  const importRegistrations = async () => {
    if (!form.session_id) {
      alert("Please select a webinar session first");
      return;
    }
    if (!importFile) {
      alert("Please choose an Excel file to import");
      return;
    }

    setImporting(true);
    setImportStatus("");

    try {
      const body = new FormData();
      body.append("file", importFile);

      const res = await fetch(
        `http://127.0.0.1:8000/webinar-registrations/${form.session_id}/import`,
        { method: "POST", body }
      );
      const data = await res.json();
      let statusMsg = data.message || "Import complete.";

      // Zoom's registration report carries its own authoritative approved
      // count — use it to save re-typing "Registered Learners" by hand.
      if (data.meeting_summary?.approved_registrants) {
        setForm((f) => ({
          ...f,
          registered_learners: Number(data.meeting_summary.approved_registrants) || f.registered_learners,
        }));
        statusMsg += ` Registered Learners set to ${data.meeting_summary.approved_registrants} from Zoom's report.`;
      }

      setImportStatus(statusMsg);
      setImportFile(null);
      loadRegistrations(form.session_id);
    } catch (err) {
      setImportStatus("Import failed. Please check the file and try again.");
    } finally {
      setImporting(false);
    }
  };

  const importAttendance = async () => {
    if (!form.session_id) {
      alert("Please select a webinar session first");
      return;
    }
    if (!attendanceFile) {
      alert("Please choose an attendance file to import");
      return;
    }

    setAttendanceImporting(true);
    setAttendanceImportStatus("");

    try {
      const body = new FormData();
      body.append("file", attendanceFile);

      const res = await fetch(
        `http://127.0.0.1:8000/webinar-registrations/${form.session_id}/import`,
        { method: "POST", body }
      );
      const data = await res.json();
      let statusMsg = data.message || "Import complete.";

      // Zoom's attendance report carries its own authoritative attended
      // (# Participants) count — use it to save re-typing by hand.
      if (data.meeting_summary?.total_participants) {
        setForm((f) => ({
          ...f,
          attended_learners: Number(data.meeting_summary.total_participants) || f.attended_learners,
        }));
        statusMsg += ` Attended Learners set to ${data.meeting_summary.total_participants} from Zoom's report.`;
      }

      setAttendanceImportStatus(statusMsg);
      setAttendanceFile(null);
      loadRegistrations(form.session_id);
    } catch (err) {
      setAttendanceImportStatus("Import failed. Please check the file and try again.");
    } finally {
      setAttendanceImporting(false);
    }
  };

  const importPollReport = async () => {
    if (!form.session_id) {
      alert("Please select a webinar session first");
      return;
    }
    if (!pollFile) {
      alert("Please choose a poll report file to import");
      return;
    }

    setPollImporting(true);
    setPollImportStatus("");

    try {
      const body = new FormData();
      body.append("file", pollFile);

      const res = await fetch(
        `http://127.0.0.1:8000/webinar-registrations/${form.session_id}/import-polls`,
        { method: "POST", body }
      );
      const data = await res.json();
      let statusMsg = data.message || "Import complete.";

      const patch = {
        polls_conducted: data.polls_conducted ?? form.polls_conducted,
        poll_responses: data.poll_responses ?? form.poll_responses,
        poll_average_rating: data.poll_average_rating ?? form.poll_average_rating,
        highest_rated_poll: data.highest_rated_poll ?? form.highest_rated_poll,
      };
      // A response rate needs a "how many people could have responded"
      // denominator. Prefer Attended Learners (who could actually see the
      // poll); fall back to Registered Learners if attendance hasn't been
      // imported yet; otherwise leave it as-is and say why.
      const base = form.attended_learners > 0 ? form.attended_learners : form.registered_learners;
      if (base > 0 && data.poll_responses) {
        patch.poll_response_rate = Math.round((data.poll_responses / base) * 1000) / 10;
      } else {
        statusMsg += " Poll Response Rate left as-is — import Registered or Attended Learners first so it has a total to divide against.";
      }
      setForm((f) => ({ ...f, ...patch }));

      setPollHealthStatus(data.poll_health_status || "");
      setPollBreakdown(data.polls || []);
      setPollImportStatus(statusMsg);
      setPollFile(null);
    } catch (err) {
      setPollImportStatus("Import failed. Please check the file and try again.");
    } finally {
      setPollImporting(false);
    }
  };

  const deleteImportedLearners = async () => {
    if (!form.session_id) {
      alert("Please select a webinar session first");
      return;
    }
    if (registrations.length === 0) {
      alert("No imported learners to delete for this webinar.");
      return;
    }
    if (!window.confirm(`Delete all ${registrations.length} imported learner(s) for this webinar? You can re-import a corrected file afterwards.`)) {
      return;
    }

    try {
      const res = await fetch(`http://127.0.0.1:8000/webinar-registrations/${form.session_id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      setImportStatus(data.message || "Deleted.");
      await loadRegistrations(form.session_id);
    } catch (err) {
      setImportStatus("Delete failed. Please try again.");
    }
  };

  const deleteImportedAttendance = async () => {
    if (!form.session_id) {
      alert("Please select a webinar session first");
      return;
    }
    const attendedCount = registrations.filter((r) => r.attended).length;
    if (attendedCount === 0) {
      alert("No imported attendance to delete for this webinar.");
      return;
    }
    if (!window.confirm(`Clear attendance data (Join/Leave Time, Duration) for ${attendedCount} learner(s)? The registration list itself is kept — you can re-import a corrected attendance file afterwards.`)) {
      return;
    }

    try {
      const res = await fetch(`http://127.0.0.1:8000/webinar-registrations/${form.session_id}/attendance`, {
        method: "DELETE",
      });
      const data = await res.json();
      setAttendanceImportStatus(data.message || "Deleted.");
      await loadRegistrations(form.session_id);
    } catch (err) {
      setAttendanceImportStatus("Delete failed. Please try again.");
    }
  };

  const clearPollReport = () => {
    if (!form.session_id) {
      alert("Please select a webinar session first");
      return;
    }
    if (!window.confirm("Clear the imported poll numbers (Polls Conducted, Responses, Average Rating, Response Rate, Highest Rated Poll)? You can re-import a corrected poll file afterwards.")) {
      return;
    }

    setForm((f) => ({
      ...f,
      polls_conducted: 0,
      poll_responses: 0,
      poll_response_rate: 0,
      poll_average_rating: 0,
      highest_rated_poll: 0,
    }));
    setPollHealthStatus("");
    setPollBreakdown([]);
    setPollImportStatus("Cleared imported poll data.");
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditId(null);
  };

  const buildPayload = () => {
    const session = sessions.find((s) => s.id === Number(form.session_id)) ||
      reports.find((r) => r.id === editId);

    return {
      ...form,
      session_id: Number(form.session_id),
      webinar_title: session?.topic || session?.webinar_title || "",
      project_name: session?.project_name || "",
      batch_name: session?.batch_name || "",
      course_name: session?.course_name || "",
      mentor_name: session?.mentor_name || "",
      mentor_email: session?.mentor_email || "",
      session_date: session?.session_date || "",
      session_time: session?.session_time || "",
      duration: session?.duration || 0,
      platform: session?.platform || "Zoom",
      meeting_id: session?.webinar_id || "",
    };
  };

  const saveReport = async () => {
    if (!form.session_id) {
      alert("Please select a webinar session");
      return;
    }

    const payload = buildPayload();

    if (editId) {
      await fetch(`http://127.0.0.1:8000/zoom-analytics/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("http://127.0.0.1:8000/zoom-analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    loadReports();
    resetForm();
  };

  const editReport = (report) => {
    setEditId(report.id);
    setForm({
      ...EMPTY_FORM,
      ...report,
      session_id: report.session_id || "",
    });
  };

  const deleteReport = async (id) => {
    if (!window.confirm("Delete this webinar report?")) return;
    await fetch(`http://127.0.0.1:8000/zoom-analytics/${id}`, { method: "DELETE" });
    loadReports();
  };

  const downloadReportPdf = (report) => {
    window.open(`http://127.0.0.1:8000/export-webinar-pdf/${report.session_id}`, "_blank");
  };

  return (
    <ProtectedRoute>
      <>
        <Sidebar />

        <div
          style={{
            marginLeft: "280px",
            padding: "32px 36px 60px",
            background: "#f1f5f9",
            minHeight: "100vh",
          }}
        >
          <div className="page-hero">
            <div className="page-hero-content">
              <div className="page-hero-eyebrow">Learner Feedback</div>
              <h1 className="page-hero-title">Webinar Report Entry</h1>
              <p className="page-hero-subtitle">
                Log real attendance, poll, and engagement numbers for each webinar so they show up on Webinar Analytics.
              </p>
            </div>
            <div className="page-hero-stat">
              <div className="page-hero-stat-value">{reports.length}</div>
              <div className="page-hero-stat-label">Reports Logged</div>
            </div>
          </div>

          <div className="card">
            <h2 className="card-title">{editId ? "✏️ Update Webinar Report" : "➕ Log Webinar Report"}</h2>

            <div className="form-grid">
              <Field label="🎥 Webinar Session">
                <select
                  className="styled-input"
                  style={inputStyle}
                  value={form.session_id}
                  disabled={!!editId}
                  onChange={(e) => set("session_id")(e.target.value)}
                >
                  <option value="">Select Webinar Session</option>
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.topic} | {s.mentor_name} | {s.batch_name} | {s.session_date}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Webinar Status">
                <select className="styled-input" style={inputStyle} value={form.webinar_status} onChange={(e) => set("webinar_status")(e.target.value)}>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </Field>
            </div>

            {selectedSession && (
              <div className="info-grid" style={{ marginTop: "16px" }}>
                <div className="info-chip"><div className="info-chip-label">Batch</div><div className="info-chip-value">{selectedSession.batch_name || "—"}</div></div>
                <div className="info-chip"><div className="info-chip-label">Mentor</div><div className="info-chip-value">{selectedSession.mentor_name || "—"}</div></div>
                <div className="info-chip"><div className="info-chip-label">Date</div><div className="info-chip-value">{selectedSession.session_date || "—"}</div></div>
                <div className="info-chip"><div className="info-chip-label">Platform</div><div className="info-chip-value">{selectedSession.platform || "Zoom"}</div></div>
                <div className="info-chip"><div className="info-chip-label">Meeting ID</div><div className="info-chip-value">{selectedSession.webinar_id || "—"}</div></div>
              </div>
            )}

            <h3 className="subsection-title">🧑‍🎓 Import Registered Learners (Zoom CSV)</h3>
            <p className="hint-text">
              Upload the Registration CSV from Zoom to load the learner list, then upload the Attendance CSV
              after the webinar to fill in who actually attended — matched automatically by email. Excel files (.xlsx) work too.
            </p>
            <div className="import-row">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => setImportFile(e.target.files[0] || null)}
                disabled={!form.session_id}
              />
              <button
                className="btn btn-primary"
                onClick={importRegistrations}
                disabled={!form.session_id || !importFile || importing}
              >
                {importing ? "Importing…" : "📥 Import"}
              </button>
              <button
                className="btn btn-danger-outline"
                onClick={deleteImportedLearners}
                disabled={!form.session_id || registrations.length === 0}
              >
                🗑️ Delete Imported Learners
              </button>
            </div>
            {!form.session_id && (
              <div className="hint-text">Select a webinar session above before importing.</div>
            )}
            {importStatus && <div className="import-status">{importStatus}</div>}

            {form.session_id && (
              <div className="table-scroll" style={{ marginTop: "12px" }}>
                <table className="reg-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.length === 0 && (
                      <tr>
                        <td colSpan={3} style={{ textAlign: "center", color: "#94a3b8", padding: "16px" }}>
                          No learners imported for this webinar yet.
                        </td>
                      </tr>
                    )}
                    {registrations.map((learner) => (
                      <tr key={learner.id}>
                        <td>{learner.learner_name}</td>
                        <td className="muted">{learner.learner_email}</td>
                        <td className="muted">{learner.phone || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <h3 className="subsection-title">🎯 Import Attendance (Zoom CSV)</h3>
            <p className="hint-text">
              Upload the Attendance report from Zoom (generated after the webinar ends) to fill in Join Time,
              Leave Time, and Duration for each learner — matched automatically by email against the list above.
              Excel files (.xlsx) work too.
            </p>
            <div className="import-row">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => setAttendanceFile(e.target.files[0] || null)}
                disabled={!form.session_id}
              />
              <button
                className="btn btn-primary"
                onClick={importAttendance}
                disabled={!form.session_id || !attendanceFile || attendanceImporting}
              >
                {attendanceImporting ? "Importing…" : "📥 Import Attendance"}
              </button>
              <button
                className="btn btn-danger-outline"
                onClick={deleteImportedAttendance}
                disabled={!form.session_id || attendedLearners.length === 0}
              >
                🗑️ Delete Imported Attendance
              </button>
            </div>
            {!form.session_id && (
              <div className="hint-text">Select a webinar session above before importing.</div>
            )}
            {attendanceImportStatus && <div className="import-status">{attendanceImportStatus}</div>}

            {form.session_id && (
              <>
                <div className="info-grid" style={{ marginTop: "4px", marginBottom: "12px" }}>
                  <div className="info-chip"><div className="info-chip-label">Attended</div><div className="info-chip-value">{attendedLearners.length}</div></div>
                  <div className="info-chip"><div className="info-chip-label">No Show</div><div className="info-chip-value">{registrations.length - attendedLearners.length}</div></div>
                  <div className="info-chip"><div className="info-chip-label">Avg Duration (mins)</div><div className="info-chip-value">{avgDurationMinutes}</div></div>
                </div>

                <div className="table-scroll">
                  <table className="reg-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Join Time</th>
                        <th>Leave Time</th>
                        <th>Duration (mins)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registrations.length === 0 && (
                        <tr>
                          <td colSpan={6} style={{ textAlign: "center", color: "#94a3b8", padding: "16px" }}>
                            No learners imported for this webinar yet.
                          </td>
                        </tr>
                      )}
                      {registrations.map((learner) => (
                        <tr key={learner.id}>
                          <td>{learner.learner_name}</td>
                          <td className="muted">{learner.learner_email}</td>
                          <td className="muted">{learner.phone || "—"}</td>
                          <td className="muted">{learner.join_time || "—"}</td>
                          <td className="muted">{learner.leave_time || "—"}</td>
                          <td className="muted">{learner.attendance_duration_minutes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            <h3 className="subsection-title">📋 Registration &amp; Attendance</h3>
            <div className="form-grid">
              <NumField label="Registered Learners" value={form.registered_learners} onChange={set("registered_learners")} />
              <NumField label="Attended Learners" value={form.attended_learners} onChange={set("attended_learners")} />
            </div>

            <h3 className="subsection-title">📊 Import Poll Report (Zoom CSV)</h3>
            <p className="hint-text">
              Upload the Poll report from Zoom to fill in Polls Conducted, Poll Responses, and Average Rating
              automatically. A rating of 4.3/5 or above across the poll's questions counts as good session health;
              below that, poor. Excel files (.xlsx) work too.
            </p>
            <div className="import-row">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => setPollFile(e.target.files[0] || null)}
                disabled={!form.session_id}
              />
              <button
                className="btn btn-primary"
                onClick={importPollReport}
                disabled={!form.session_id || !pollFile || pollImporting}
              >
                {pollImporting ? "Importing…" : "📥 Import Poll Report"}
              </button>
              <button
                className="btn btn-danger-outline"
                onClick={clearPollReport}
                disabled={!form.session_id}
              >
                🗑️ Delete Imported Poll Report
              </button>
              {pollHealthStatus && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  <span className="hint-text" style={{ margin: 0 }}>Poll Health:</span>
                  <PollHealthBadge status={pollHealthStatus} />
                </span>
              )}
            </div>
            {!form.session_id && (
              <div className="hint-text">Select a webinar session above before importing.</div>
            )}
            {pollImportStatus && <div className="import-status">{pollImportStatus}</div>}

            {pollBreakdown.length > 0 && (
              <div className="table-scroll" style={{ marginBottom: "12px" }}>
                <table className="reg-table">
                  <thead>
                    <tr>
                      <th>Poll Name</th>
                      <th>Questions</th>
                      <th>Responses</th>
                      <th>Avg Rating</th>
                      <th>Health</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pollBreakdown.map((poll, i) => (
                      <tr key={i}>
                        <td>{poll.name}</td>
                        <td className="muted">{poll.questions}</td>
                        <td className="muted">{poll.responses}</td>
                        <td className="muted">{poll.average_rating}</td>
                        <td><PollHealthBadge status={poll.average_rating >= 4.3 ? "Good" : "Poor"} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <h3 className="subsection-title">📊 Poll Reports</h3>
            <div className="form-grid">
              <NumField label="Polls Conducted" value={form.polls_conducted} onChange={set("polls_conducted")} />
              <NumField label="Poll Responses" value={form.poll_responses} onChange={set("poll_responses")} />
              <NumField label="Poll Response Rate (%)" value={form.poll_response_rate} onChange={set("poll_response_rate")} step="0.1" />
              <NumField label="Poll Average Rating (0-5)" value={form.poll_average_rating} onChange={set("poll_average_rating")} step="0.1" />
              <NumField label="Highest Rated Poll (0-5)" value={form.highest_rated_poll} onChange={set("highest_rated_poll")} step="0.1" />
            </div>

            <div style={{ marginTop: "16px" }}>
              <Field label="Remarks">
                <textarea
                  className="styled-input"
                  style={{ ...inputStyle, minHeight: "70px", resize: "vertical" }}
                  value={form.remarks || ""}
                  onChange={(e) => set("remarks")(e.target.value)}
                />
              </Field>
            </div>

            <div style={{ marginTop: "22px", display: "flex", gap: "12px" }}>
              {editId ? (
                <>
                  <button className="btn btn-primary" onClick={saveReport}>Update Report</button>
                  <button className="btn btn-ghost" onClick={resetForm}>Cancel</button>
                </>
              ) : (
                <button className="btn btn-primary" onClick={saveReport}>Save Report</button>
              )}
            </div>
          </div>

          <div className="card" style={{ marginTop: "24px" }}>
            <h2 className="card-title" style={{ marginBottom: "18px" }}>📋 Logged Webinar Reports</h2>

            <div className="table-scroll">
              <table className="reg-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Batch</th>
                    <th>Mentor</th>
                    <th>Date</th>
                    <th>Registered</th>
                    <th>Attended</th>
                    <th>Attendance %</th>
                    <th>Health Score</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.length === 0 && (
                    <tr>
                      <td colSpan={10} style={{ textAlign: "center", color: "#94a3b8", padding: "16px" }}>
                        No webinar reports logged yet.
                      </td>
                    </tr>
                  )}
                  {reports.map((r) => (
                    <tr key={r.id}>
                      <td className="strong">{r.webinar_title}</td>
                      <td className="muted">{r.batch_name}</td>
                      <td className="muted">{r.mentor_name}</td>
                      <td className="muted">{r.session_date}</td>
                      <td className="muted">{r.registered_learners}</td>
                      <td className="muted">{r.attended_learners}</td>
                      <td className="muted">{r.attendance_rate}%</td>
                      <td className="muted">{r.webinar_health_score}</td>
                      <td><StatusBadge status={r.webinar_status} /></td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <button className="btn btn-icon" onClick={() => setViewReport(r)}>👁️ View</button>
                        <button className="btn btn-icon" onClick={() => downloadReportPdf(r)}>📄 PDF</button>
                        <button className="btn btn-icon" onClick={() => editReport(r)}>✏️ Edit</button>
                        <button className="btn btn-icon btn-danger" onClick={() => deleteReport(r.id)}>🗑️ Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {viewReport && (
          <div className="modal-overlay" onClick={() => setViewReport(null)}>
            <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h2 className="card-title" style={{ margin: 0 }}>{viewReport.webinar_title}</h2>
                  <p className="hint-text" style={{ margin: "4px 0 0" }}>
                    {viewReport.batch_name} · {viewReport.mentor_name} · {viewReport.session_date}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <HealthBadgeInline status={healthStatusFor(viewReport.webinar_health_score)} />
                  <button className="btn btn-ghost" onClick={() => setViewReport(null)}>✕ Close</button>
                </div>
              </div>

              <h3 className="subsection-title" style={{ marginTop: 0 }}>Webinar Information</h3>
              <div className="info-grid">
                <div className="info-chip"><div className="info-chip-label">Webinar Title</div><div className="info-chip-value">{viewReport.webinar_title || "—"}</div></div>
                <div className="info-chip"><div className="info-chip-label">Mentor</div><div className="info-chip-value">{viewReport.mentor_name || "—"}</div></div>
                <div className="info-chip"><div className="info-chip-label">Mentor Email</div><div className="info-chip-value">{viewReport.mentor_email || "—"}</div></div>
                <div className="info-chip"><div className="info-chip-label">Meeting ID</div><div className="info-chip-value">{viewReport.meeting_id || "—"}</div></div>
                <div className="info-chip"><div className="info-chip-label">Date</div><div className="info-chip-value">{viewReport.session_date || "—"}</div></div>
                <div className="info-chip"><div className="info-chip-label">Time</div><div className="info-chip-value">{viewReport.session_time || "—"}</div></div>
                <div className="info-chip"><div className="info-chip-label">Duration</div><div className="info-chip-value">{viewReport.duration} mins</div></div>
                <div className="info-chip"><div className="info-chip-label">Platform</div><div className="info-chip-value">{viewReport.platform || "—"}</div></div>
                <div className="info-chip"><div className="info-chip-label">Status</div><div className="info-chip-value">{viewReport.webinar_status || "—"}</div></div>
              </div>

              <h3 className="subsection-title">Registration &amp; Attendance</h3>
              <div className="info-grid">
                <div className="info-chip"><div className="info-chip-label">Registered</div><div className="info-chip-value">{viewReport.registered_learners}</div></div>
                <div className="info-chip"><div className="info-chip-label">Attended</div><div className="info-chip-value">{viewReport.attended_learners}</div></div>
                <div className="info-chip"><div className="info-chip-label">Attendance Rate</div><div className="info-chip-value">{viewReport.attendance_rate}%</div></div>
                <div className="info-chip"><div className="info-chip-label">No Shows</div><div className="info-chip-value">{viewReport.no_show_learners}</div></div>
                <div className="info-chip"><div className="info-chip-label">No Show Rate</div><div className="info-chip-value">{viewReport.no_show_rate}%</div></div>
                <div className="info-chip"><div className="info-chip-label">Peak Concurrent</div><div className="info-chip-value">{viewReport.peak_concurrent_users}</div></div>
              </div>

              <h3 className="subsection-title">Poll Reports</h3>
              <div className="info-grid">
                <div className="info-chip"><div className="info-chip-label">Polls Conducted</div><div className="info-chip-value">{viewReport.polls_conducted}</div></div>
                <div className="info-chip"><div className="info-chip-label">Poll Responses</div><div className="info-chip-value">{viewReport.poll_responses}</div></div>
                <div className="info-chip"><div className="info-chip-label">Response Rate</div><div className="info-chip-value">{viewReport.poll_response_rate}%</div></div>
                <div className="info-chip"><div className="info-chip-label">Average Rating</div><div className="info-chip-value">{viewReport.poll_average_rating}/5</div></div>
                <div className="info-chip"><div className="info-chip-label">Highest Rated Poll</div><div className="info-chip-value">{viewReport.highest_rated_poll}/5</div></div>
              </div>

              <h3 className="subsection-title">🩺 Webinar Health</h3>
              <div className="health-row">
                <div className="health-score">
                  <div className="health-score-value">{viewReport.webinar_health_score}</div>
                  <div className="health-score-label">Health Score / 100</div>
                </div>
                <HealthBadgeInline status={healthStatusFor(viewReport.webinar_health_score)} />
                <div className="info-grid" style={{ flex: 1 }}>
                  <div className="info-chip"><div className="info-chip-label">Engagement Score</div><div className="info-chip-value">{viewReport.engagement_score}</div></div>
                  <div className="info-chip"><div className="info-chip-label">Learner Satisfaction</div><div className="info-chip-value">⭐ {viewReport.learner_satisfaction}</div></div>
                  <div className="info-chip"><div className="info-chip-label">Session Rating</div><div className="info-chip-value">⭐ {viewReport.session_rating}</div></div>
                </div>
              </div>

              {viewReport.remarks && (
                <>
                  <h3 className="subsection-title">Remarks</h3>
                  <p style={{ color: "#475569", fontSize: "14px" }}>{viewReport.remarks}</p>
                </>
              )}

              <div style={{ marginTop: "22px", display: "flex", gap: "12px" }}>
                <button className="btn btn-export-pdf" onClick={() => downloadReportPdf(viewReport)}>📄 Download PDF</button>
                <button className="btn btn-ghost" onClick={() => { setViewReport(null); editReport(viewReport); }}>✏️ Edit This Report</button>
              </div>
            </div>
          </div>
        )}

        <style jsx>{`
          .page-hero {
            position: relative;
            overflow: hidden;
            border-radius: 18px;
            padding: 30px 32px;
            margin-bottom: 24px;
            background: linear-gradient(120deg, #0f172a 0%, #1e293b 60%, #0f172a 100%);
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            box-shadow: 0 16px 32px -18px rgba(15, 23, 42, 0.55);
          }

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

          .page-hero-title {
            font-size: 26px;
            font-weight: 800;
            color: #f8fafc;
            margin: 0 0 6px;
          }

          .page-hero-subtitle {
            color: #94a3b8;
            font-size: 14px;
            margin: 0;
            max-width: 560px;
          }

          .page-hero-stat {
            text-align: center;
            padding: 14px 26px;
            border-radius: 14px;
            background: rgba(255, 255, 255, 0.06);
            border: 1px solid rgba(255, 255, 255, 0.1);
            flex-shrink: 0;
          }

          .page-hero-stat-value {
            font-size: 26px;
            font-weight: 800;
            color: #fbbf24;
          }

          .page-hero-stat-label {
            font-size: 11px;
            color: #94a3b8;
            margin-top: 2px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }

          .card {
            background: #ffffff;
            border-radius: 16px;
            padding: 26px 28px;
            box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
            border: 1px solid #eef2f7;
          }

          .card-title {
            margin: 0 0 18px;
            font-size: 17px;
            color: #1e293b;
          }

          .subsection-title {
            font-size: 14px;
            color: #475569;
            margin: 26px 0 14px;
            padding-top: 18px;
            border-top: 1px solid #f1f5f9;
          }

          .form-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
            gap: 16px;
          }

          .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
            gap: 14px;
          }

          :global(.info-chip) {
            background: #f8fafc;
            border: 1px solid #eef2f7;
            border-radius: 10px;
            padding: 10px 14px;
          }

          :global(.info-chip-label) {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.03em;
            color: #94a3b8;
            margin-bottom: 4px;
          }

          :global(.info-chip-value) {
            font-size: 14px;
            font-weight: 600;
            color: #1e293b;
          }

          .btn {
            border: none;
            border-radius: 10px;
            padding: 11px 20px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
          }

          .btn-primary {
            background: linear-gradient(120deg, #f59e0b, #fbbf24);
            color: #0f172a;
            box-shadow: 0 6px 16px -6px rgba(245, 158, 11, 0.6);
          }

          .btn-ghost {
            background: #f1f5f9;
            color: #475569;
          }

          .btn-danger-outline {
            background: #ffffff;
            color: #dc2626;
            border: 1px solid #fecaca;
          }

          .btn-danger-outline:hover:not(:disabled) {
            background: #fef2f2;
          }

          .btn-danger-outline:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .btn-export-pdf {
            background: #dc2626;
            color: #fff;
          }

          .btn-export-pdf:hover {
            background: #b91c1c;
          }

          .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(15, 23, 42, 0.55);
            display: flex;
            align-items: flex-start;
            justify-content: center;
            padding: 40px 20px;
            overflow-y: auto;
            z-index: 100;
          }

          .modal-panel {
            background: #ffffff;
            border-radius: 16px;
            padding: 28px 32px;
            width: 100%;
            max-width: 780px;
            box-shadow: 0 24px 48px -12px rgba(15, 23, 42, 0.35);
          }

          .modal-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 16px;
            padding-bottom: 16px;
            border-bottom: 1px solid #eef2f7;
            margin-bottom: 8px;
          }

          .health-row {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 20px;
            padding: 16px;
            background: #f8fafc;
            border: 1px solid #eef2f7;
            border-radius: 12px;
          }

          .health-score {
            text-align: center;
            flex-shrink: 0;
          }

          .health-score-value {
            font-size: 30px;
            font-weight: 800;
            color: #1e293b;
          }

          .health-score-label {
            font-size: 11px;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.03em;
          }

          .hint-text {
            font-size: 12.5px;
            color: #94a3b8;
            margin: 0 0 12px;
          }

          .import-row {
            display: flex;
            align-items: center;
            gap: 14px;
            flex-wrap: wrap;
            margin-bottom: 10px;
          }

          .import-status {
            font-size: 13px;
            font-weight: 600;
            color: #15803d;
            background: #dcfce7;
            padding: 8px 14px;
            border-radius: 8px;
            margin-bottom: 12px;
            display: inline-block;
          }

          .btn-icon {
            background: none;
            border: none;
            cursor: pointer;
            font-size: 13px;
            padding: 4px 8px;
            border-radius: 6px;
          }

          .btn-icon:hover {
            background: #f1f5f9;
          }

          .btn-danger {
            color: #dc2626;
          }

          .table-scroll {
            overflow-x: auto;
          }

          .reg-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
          }

          .reg-table th {
            text-align: left;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.03em;
            color: #94a3b8;
            padding: 10px 12px;
            border-bottom: 2px solid #eef2f7;
            white-space: nowrap;
          }

          .reg-table td {
            padding: 10px 12px;
            border-bottom: 1px solid #f1f5f9;
          }

          .reg-table .strong {
            font-weight: 700;
            color: #1e293b;
          }

          .reg-table .muted {
            color: #64748b;
          }
        `}</style>
      </>
    </ProtectedRoute>
  );
}
