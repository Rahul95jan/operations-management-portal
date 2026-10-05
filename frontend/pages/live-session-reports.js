import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Sidebar from "../components/Sidebar";
import ProtectedRoute from "../components/ProtectedRoute";
import { Radio, Upload, Users, UserCheck, UserX, Clock3, TrendingUp, BarChart3, Star, FileText, Trash2 } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

// Log Live Session Report: upload Zoom attendance / poll reports for a Live
// Session. Uses the same endpoints as the Session Report page, so whatever is
// imported here shows up on that session's report, the Session Reports list
// and Analytics.
export default function LiveSessionReports() {
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState("");
  // Date filter for the session list: edited in draftDate, applied on "Apply Filter".
  const [draftDate, setDraftDate] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [attendance, setAttendance] = useState(null);
  const [polls, setPolls] = useState(null);
  const [importing, setImporting] = useState(null); // "attendance" | "polls" | null
  const [messages, setMessages] = useState({ attendance: null, polls: null }); // { ok, text }

  useEffect(() => {
    fetch(`${API}/sessions`)
      .then((r) => r.json())
      .then((d) => setSessions(Array.isArray(d) ? d : []))
      .catch(() => setSessions([]));
  }, []);

  const liveSessions = useMemo(
    () =>
      sessions
        .filter((s) => (s.session_type || "Live Session") === "Live Session")
        .sort((a, b) => String(b.session_date || "").localeCompare(String(a.session_date || ""))),
    [sessions]
  );
  const filteredSessions = useMemo(
    () => (filterDate ? liveSessions.filter((s) => s.session_date === filterDate) : liveSessions),
    [liveSessions, filterDate]
  );
  const selected = filteredSessions.find((s) => String(s.id) === String(sessionId)) || null;

  const applyFilter = () => {
    setFilterDate(draftDate);
    // Drop a selection that the new date no longer includes.
    if (sessionId && draftDate && !liveSessions.some((s) => String(s.id) === String(sessionId) && s.session_date === draftDate)) {
      setSessionId("");
    }
  };
  const clearFilter = () => {
    setDraftDate("");
    setFilterDate("");
  };
  const fmtDate = (d) => new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });

  const loadSession = (id) => {
    if (!id) {
      setAttendance(null);
      setPolls(null);
      return;
    }
    fetch(`${API}/session-reports/${id}/attendance`).then((r) => r.json()).then((d) => setAttendance(d.success ? d : null)).catch(() => setAttendance(null));
    fetch(`${API}/session-reports/${id}/polls`).then((r) => r.json()).then((d) => setPolls(d.success ? d : null)).catch(() => setPolls(null));
  };

  useEffect(() => {
    setMessages({ attendance: null, polls: null });
    loadSession(sessionId);
  }, [sessionId]);

  const importReport = async (kind, file) => {
    setImporting(kind);
    setMessages((m) => ({ ...m, [kind]: null }));
    try {
      const body = new FormData();
      body.append("file", file);
      const path = kind === "attendance" ? "attendance/import" : "polls/import";
      const res = await fetch(`${API}/session-reports/${sessionId}/${path}`, { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Import failed. Please check the file and try again.");
      setMessages((m) => ({ ...m, [kind]: { ok: true, text: data.message } }));
      loadSession(sessionId);
    } catch (err) {
      setMessages((m) => ({ ...m, [kind]: { ok: false, text: err.message === "Failed to fetch" ? "Couldn't reach the server — please try again." : err.message } }));
    } finally {
      setImporting(null);
    }
  };

  const clearImported = async (kind) => {
    const what = kind === "attendance" ? "the imported attendance" : "the imported poll results";
    if (!window.confirm(`Clear ${what} for this session? You can re-import a corrected file afterwards.`)) return;
    const res = await fetch(`${API}/session-reports/${sessionId}/${kind}`, { method: "DELETE" }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    setMessages((m) => ({ ...m, [kind]: res && res.ok ? { ok: true, text: data.message } : { ok: false, text: "Couldn't clear — please try again." } }));
    loadSession(sessionId);
  };

  const hasAttendance = !!attendance?.has_detailed_rows;
  const hasPolls = !!polls?.has_data;

  return (
    <ProtectedRoute>
      <>
        <Sidebar />
        <div className="page">
          <div className="page-head">
            <h1 className="page-title"><Radio size={22} strokeWidth={2.2} /> Log Live Session Report</h1>
            <p className="page-sub">Upload Zoom&apos;s attendance and poll reports for a live session. The results appear on that session&apos;s report, in Session Reports and in Analytics.</p>
          </div>

          <div className="card">
            <div className="filter-row">
              <div className="filter-field">
                <label className="field-label">Date</label>
                <input type="date" className="date-input" value={draftDate} onChange={(e) => setDraftDate(e.target.value)} />
              </div>
              <button className="btn-apply" onClick={applyFilter} disabled={draftDate === filterDate}>Apply Filter</button>
              <button className="btn-clear" onClick={clearFilter} disabled={!draftDate && !filterDate}>Clear Filter</button>
              {filterDate && (
                <span className="filter-note">
                  Showing {filteredSessions.length} live session{filteredSessions.length === 1 ? "" : "s"} on {fmtDate(filterDate)}
                </span>
              )}
            </div>

            <label className="field-label">Live Session</label>
            <select className="select" value={selected ? sessionId : ""} onChange={(e) => setSessionId(e.target.value)}>
              <option value="">{filterDate && filteredSessions.length === 0 ? "No live sessions on this date" : "Select a live session"}</option>
              {filteredSessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {`${(s.topic || "Untitled").trim()} | ${s.mentor_name || "—"} | ${s.session_date || "—"}${s.session_time ? ` ${s.session_time}` : ""}`}
                </option>
              ))}
            </select>
            {liveSessions.length === 0 && (
              <div className="hint">No live sessions yet — create one in <Link href="/sessions">Sessions</Link> (Session Type: Live Session).</div>
            )}

            {selected && (
              <div className="info-grid">
                <Info label="Course" value={selected.course_name || selected.batch_name} />
                <Info label="Mentor" value={selected.mentor_name} />
                <Info label="Date" value={selected.session_date} />
                <Info label="Time" value={selected.session_time} />
                <Info label="Status" value={selected.status} />
                <Link href={`/session-reports/${selected.id}`} className="report-link"><FileText size={14} /> View full session report →</Link>
              </div>
            )}
          </div>

          {selected && (
            <>
              {/* Attendance */}
              <div className="card">
                <div className="card-head">
                  <div>
                    <h2 className="card-title">🎯 Attendance (Zoom report)</h2>
                    <p className="hint">Upload Zoom&apos;s attendance / participants report (CSV or Excel). Learners are matched by email; joining more than 10 min after the start counts as Late, and the mentor (host) is left out. Absentees are counted against Zoom&apos;s registrants or the course strength.</p>
                  </div>
                  <div className="actions">
                    <FileButton label="Import Attendance" busy={importing === "attendance"} onFile={(f) => importReport("attendance", f)} />
                    {hasAttendance && <button className="clear-btn" onClick={() => clearImported("attendance")}><Trash2 size={13} /> Clear</button>}
                  </div>
                </div>
                {messages.attendance && <div className={`msg ${messages.attendance.ok ? "msg-ok" : "msg-err"}`}>{messages.attendance.text}</div>}

                {hasAttendance ? (
                  <div className="kpi-grid">
                    <Kpi icon={UserCheck} label="Unique Joiners" value={attendance.unique_joiners} color="#2563eb" />
                    <Kpi icon={Users} label="Total Learners" value={attendance.total_learners} />
                    <Kpi icon={UserCheck} label="Present" value={attendance.present} color="#16a34a" />
                    <Kpi icon={Clock3} label="Late" value={attendance.late} color="#f59e0b" />
                    <Kpi icon={UserX} label="Absent" value={attendance.absent} color="#dc2626" />
                    <Kpi icon={TrendingUp} label="Attendance %" value={`${attendance.attendance_percentage}%`} color="#16a34a" />
                    <Kpi icon={Clock3} label="Avg Join / Leave" value={attendance.average_join_time ? `${attendance.average_join_time} – ${attendance.average_leave_time || "—"}` : "—"} />
                  </div>
                ) : (
                  <div className="empty">No attendance imported for this session yet.</div>
                )}
              </div>

              {/* Polls */}
              <div className="card">
                <div className="card-head">
                  <div>
                    <h2 className="card-title">📊 Poll Report (Zoom report)</h2>
                    <p className="hint">Upload Zoom&apos;s Poll Report (CSV or Excel). Ratings of 1–5 are averaged per question, then per poll; 4.3 / 5 or above counts as good poll health.</p>
                  </div>
                  <div className="actions">
                    <FileButton label="Import Poll Report" busy={importing === "polls"} onFile={(f) => importReport("polls", f)} />
                    {hasPolls && <button className="clear-btn" onClick={() => clearImported("polls")}><Trash2 size={13} /> Clear</button>}
                  </div>
                </div>
                {messages.polls && <div className={`msg ${messages.polls.ok ? "msg-ok" : "msg-err"}`}>{messages.polls.text}</div>}

                {hasPolls ? (
                  <>
                    <div className="kpi-grid">
                      <Kpi icon={BarChart3} label="Polls Conducted" value={polls.polls_conducted} color="#7c3aed" />
                      <Kpi icon={Users} label="Poll Responses" value={polls.poll_responses} color="#2563eb" />
                      <Kpi icon={TrendingUp} label="Response Rate" value={polls.response_rate !== null ? `${polls.response_rate}%` : "Import attendance"} color="#0891b2" />
                      <Kpi icon={Star} label="Average Rating" value={`${polls.poll_average_rating} / 5`} color="#f59e0b" />
                      <Kpi icon={Star} label="Poll Health" value={polls.poll_health_status} color={polls.poll_health_status === "Good" ? "#16a34a" : polls.poll_health_status === "Poor" ? "#dc2626" : "#94a3b8"} />
                    </div>
                    <table className="table">
                      <thead><tr><th>Poll</th><th>Responses</th><th>Question Averages</th><th>Average Rating</th></tr></thead>
                      <tbody>
                        {polls.polls.map((p, i) => (
                          <tr key={i}>
                            <td className="strong">{p.name}</td>
                            <td>{p.responses}</td>
                            <td className="muted">{p.question_averages?.length ? p.question_averages.join(" · ") : "—"}</td>
                            <td className="strong">{p.average_rating ? `${p.average_rating} / 5` : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                ) : (
                  <div className="empty">No poll results imported for this session yet.</div>
                )}
              </div>
            </>
          )}
        </div>

        <style jsx>{`
          .page { margin-left: var(--om-sidebar-width, 280px); transition: margin-left 0.25s ease; padding: 32px 36px 60px; background: #f1f5f9; min-height: 100vh; }
          .page-head { margin-bottom: 20px; }
          .page-title { display: flex; align-items: center; gap: 10px; font-size: 24px; font-weight: 800; color: #1e293b; margin: 0 0 4px; }
          .page-sub { font-size: 13.5px; color: #64748b; margin: 0; max-width: 720px; }
          .card { background: #fff; border: 1px solid #eef2f7; border-radius: 16px; padding: 22px 24px; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06); margin-bottom: 20px; }
          .card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 14px; }
          .card-title { margin: 0 0 4px; font-size: 16px; color: #1e293b; }
          .field-label { display: block; font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 6px; }
          .filter-row { display: flex; align-items: flex-end; gap: 10px; flex-wrap: wrap; margin-bottom: 18px; padding-bottom: 18px; border-bottom: 1px solid #f1f5f9; }
          .filter-field { display: flex; flex-direction: column; }
          .date-input { padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 14px; background: #f8fafc; outline: none; min-width: 180px; }
          .date-input:focus { border-color: #f59e0b; box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15); }
          .btn-apply { border: none; border-radius: 10px; padding: 10px 16px; font-size: 13px; font-weight: 700; color: #0f172a; cursor: pointer; background: linear-gradient(120deg, #f59e0b, #fbbf24); }
          .btn-clear { border: 1px solid #e2e8f0; border-radius: 10px; padding: 9px 14px; font-size: 13px; font-weight: 700; color: #334155; cursor: pointer; background: #fff; }
          .btn-clear:hover:not(:disabled) { background: #f1f5f9; }
          .btn-apply:disabled, .btn-clear:disabled { opacity: 0.5; cursor: not-allowed; }
          .filter-note { font-size: 12.5px; color: #64748b; font-weight: 600; margin-left: 4px; padding-bottom: 10px; }
          .select { width: 100%; max-width: 640px; padding: 11px 14px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 14px; background: #f8fafc; outline: none; }
          .select:focus { border-color: #f59e0b; box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15); }
          .hint { font-size: 12.5px; color: #64748b; margin: 8px 0 0; line-height: 1.5; max-width: 720px; }
          .info-grid { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; margin-top: 16px; }
          .actions { display: flex; align-items: center; gap: 8px; }
          .clear-btn { display: inline-flex; align-items: center; gap: 5px; background: #fff; border: 1px solid #e2e8f0; color: #b91c1c; border-radius: 8px; padding: 8px 12px; font-size: 12.5px; font-weight: 700; cursor: pointer; }
          .clear-btn:hover { background: #fef2f2; }
          .msg { font-size: 12.5px; font-weight: 600; border-radius: 8px; padding: 9px 12px; margin-bottom: 14px; }
          .msg-ok { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
          .msg-err { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
          .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 14px; }
          .empty { text-align: center; padding: 26px 16px; color: #94a3b8; font-size: 13.5px; background: #f8fafc; border-radius: 10px; }
          .table { width: 100%; border-collapse: collapse; font-size: 13px; }
          .table th { text-align: left; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.03em; color: #94a3b8; padding: 9px 10px; border-bottom: 2px solid #f1f5f9; }
          .table td { padding: 10px; border-bottom: 1px solid #f1f5f9; color: #1e293b; }
          .strong { font-weight: 700; }
          .muted { color: #64748b; }
          :global(.report-link) { display: inline-flex; align-items: center; gap: 6px; margin-left: auto; font-size: 13px; font-weight: 700; color: #b45309; text-decoration: none; }
          :global(.report-link:hover) { text-decoration: underline; }
        `}</style>
      </>
    </ProtectedRoute>
  );
}

function Info({ label, value }) {
  return (
    <div className="info">
      <div className="info-label">{label}</div>
      <div className="info-value">{value || "—"}</div>
      <style jsx>{`
        .info { background: #f8fafc; border: 1px solid #eef2f7; border-radius: 10px; padding: 9px 14px; min-width: 120px; }
        .info-label { font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; color: #94a3b8; margin-bottom: 2px; }
        .info-value { font-size: 13.5px; font-weight: 600; color: #1e293b; }
      `}</style>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, color = "#0f172a" }) {
  return (
    <div className="kpi" style={{ borderLeft: `4px solid ${color}` }}>
      <div className="kpi-top"><span>{label}</span><Icon size={15} color={color} /></div>
      <div className="kpi-value">{value ?? "—"}</div>
      <style jsx>{`
        .kpi { background: #f8fafc; border: 1px solid #eef2f7; border-radius: 12px; padding: 12px 14px; }
        .kpi-top { display: flex; align-items: center; justify-content: space-between; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.03em; margin-bottom: 6px; }
        .kpi-value { font-size: 20px; font-weight: 800; color: #1e293b; }
      `}</style>
    </div>
  );
}

function FileButton({ label, busy, onFile }) {
  return (
    <label className={`file-btn ${busy ? "file-btn-busy" : ""}`}>
      <Upload size={13} strokeWidth={2.4} /> {busy ? "Importing…" : label}
      <input type="file" accept=".csv,.xlsx,.xls" disabled={busy} onChange={(e) => { const f = e.target.files[0]; e.target.value = ""; if (f) onFile(f); }} />
      <style jsx>{`
        .file-btn { display: inline-flex; align-items: center; gap: 6px; background: linear-gradient(120deg, #f59e0b, #fbbf24); color: #0f172a; border-radius: 8px; padding: 8px 13px; font-size: 12.5px; font-weight: 700; cursor: pointer; white-space: nowrap; }
        .file-btn input { display: none; }
        .file-btn-busy { opacity: 0.6; cursor: progress; }
      `}</style>
    </label>
  );
}
