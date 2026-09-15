import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Sidebar from "../components/Sidebar";
import ProtectedRoute from "../components/ProtectedRoute";

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

const REPORT_STATUS_STYLES = {
  Pending: { bg: "#fef3c7", color: "#b45309" },
  Submitted: { bg: "#dbeafe", color: "#1d4ed8" },
  Reviewed: { bg: "#dcfce7", color: "#15803d" },
};

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

function KPICard({ label, value, color = "#0f172a" }) {
  return (
    <div className="kpi-tile">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value" style={{ color }}>{value}</div>
      <style jsx>{`
        .kpi-tile {
          background: #fff;
          border-left: 4px solid ${color};
          padding: 16px 18px;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .kpi-tile:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 18px -10px rgba(15, 23, 42, 0.25);
        }
        .kpi-label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          color: #94a3b8;
          margin-bottom: 6px;
        }
        .kpi-value {
          font-size: 22px;
          font-weight: 800;
          font-variant-numeric: tabular-nums;
        }
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

export default function SessionReports() {
  const [summary, setSummary] = useState(null);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [mentors, setMentors] = useState([]);
  const [batches, setBatches] = useState([]);

  const [filters, setFilters] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [search, setSearch] = useState("");

  const [sortBy, setSortBy] = useState("session_date");
  const [sortDir, setSortDir] = useState("desc");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API}/mentors`).then((r) => r.json()).then(setMentors).catch(() => {});
    fetch(`${API}/batches`).then((r) => r.json()).then(setBatches).catch(() => {});
  }, []);

  const load = () => {
    setLoading(true);
    setError("");

    const listQuery = buildQuery({ ...appliedFilters, search, page, page_size: pageSize, sort_by: sortBy, sort_dir: sortDir });
    const summaryQuery = buildQuery(appliedFilters);

    Promise.all([
      fetch(`${API}/session-reports?${listQuery}`).then((r) => r.json()),
      fetch(`${API}/session-reports/summary?${summaryQuery}`).then((r) => r.json()),
    ])
      .then(([listData, summaryData]) => {
        setRows(listData.items || []);
        setTotal(listData.total || 0);
        setSummary(summaryData);
      })
      .catch(() => setError("Unable to reach the server."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [appliedFilters, search, page, sortBy, sortDir]);

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

  const sortIndicator = (field) => (sortBy === field ? (sortDir === "asc" ? " ▲" : " ▼") : "");

  return (
    <ProtectedRoute>
      <>
        <Sidebar />

        <div style={{ marginLeft: "280px", padding: "32px 36px 60px", background: "#f1f5f9", minHeight: "100vh" }}>
          {/* Header */}
          <div className="page-hero">
            <div className="page-hero-blob" />
            <div className="page-hero-content">
              <div className="page-hero-eyebrow">Operations</div>
              <h1 className="page-hero-title">Session Reports</h1>
              <p className="page-hero-subtitle">
                Monitor, analyze and manage all live session activity and session performance.
              </p>
            </div>
            <a href={exportUrl} style={{ textDecoration: "none" }}>
              <button className="btn btn-export">📥 Export CSV</button>
            </a>
          </div>

          {/* KPI cards */}
          {summary && (
            <div className="kpi-grid">
              <KPICard label="Total Sessions" value={summary.total_sessions} />
              <KPICard label="Live Sessions" value={summary.live_sessions} color="#ef4444" />
              <KPICard label="Completed" value={summary.completed_sessions} color="#16a34a" />
              <KPICard label="Cancelled" value={summary.cancelled_sessions} color="#64748b" />
              <KPICard label="Upcoming" value={summary.upcoming_sessions} color="#6366f1" />
              <KPICard label="Learners Attended" value={summary.total_learners_attended} color="#2563eb" />
              <KPICard label="Avg Attendance %" value={`${summary.average_attendance_percentage}%`} color="#16a34a" />
              <KPICard label="Avg Duration (min)" value={summary.average_session_duration} color="#f59e0b" />
            </div>
          )}

          {/* Filters */}
          <div className="card" style={{ marginTop: "24px" }}>
            <h2 className="card-title">Filters</h2>
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
            <div style={{ marginTop: "16px", display: "flex", gap: "12px" }}>
              <button className="btn btn-primary" onClick={applyFilters}>Apply Filters</button>
              <button className="btn btn-ghost" onClick={clearFilters}>Clear Filters</button>
            </div>
          </div>

          {/* Table */}
          <div className="card" style={{ marginTop: "24px" }}>
            <div className="list-toolbar">
              <h2 className="card-title" style={{ margin: 0 }}>All Session Reports</h2>
              <div className="search-wrap">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search by topic, mentor, batch or session ID"
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
                      <th onClick={() => toggleSort("id")} className="sortable">Session ID{sortIndicator("id")}</th>
                      <th onClick={() => toggleSort("session_date")} className="sortable">Date{sortIndicator("session_date")}</th>
                      <th>Time</th>
                      <th>Duration</th>
                      <th onClick={() => toggleSort("topic")} className="sortable">Topic{sortIndicator("topic")}</th>
                      <th>Mentor</th>
                      <th>Batch</th>
                      <th>Course</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Learners</th>
                      <th>Attendance</th>
                      <th>Attendance %</th>
                      <th>Recording</th>
                      <th>Report</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={r.id} style={{ animationDelay: `${i * 0.02}s` }}>
                        <td className="muted">#{r.id}</td>
                        <td className="muted">{r.session_date}</td>
                        <td className="muted">{r.session_time}</td>
                        <td className="muted">{r.duration ? `${r.duration} min` : "—"}</td>
                        <td className="strong">{r.topic}</td>
                        <td>{r.mentor_name}</td>
                        <td>{r.batch_name}</td>
                        <td className="muted">{r.course_name || "—"}</td>
                        <td className="muted">{r.session_type || "—"}</td>
                        <td><Badge label={r.status} styles={STATUS_STYLES} /></td>
                        <td className="muted">{r.learner_count}</td>
                        <td className="muted">{r.attendance}</td>
                        <td className="muted">{r.attendance_percentage}%</td>
                        <td>
                          <span className={`rec-chip ${r.recording_status === "Available" ? "rec-yes" : "rec-no"}`}>
                            {r.recording_status}
                          </span>
                        </td>
                        <td><Badge label={r.report_status} styles={REPORT_STATUS_STYLES} /></td>
                        <td>
                          <div className="actions-cell">
                            <Link href={`/session-reports/${r.id}`} className="btn-icon">📄 View Report</Link>
                            <Link href="/sessions" className="btn-icon">🗓️ Session</Link>
                            <a className="btn-icon" href={`${API}/session-reports/${r.id}/download`} target="_blank" rel="noreferrer">⬇️ PDF</a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {rows.length === 0 && (
                  <div className="empty-state">
                    <div style={{ fontSize: "32px", marginBottom: "8px" }}>📋</div>
                    {total === 0 ? "No sessions match the current filters." : "No results on this page."}
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
        </div>

        <style jsx>{`
          .page-hero {
            position: relative;
            overflow: hidden;
            border-radius: 18px;
            padding: 30px 32px;
            margin-bottom: 24px;
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
          .page-hero-subtitle { color: #94a3b8; font-size: 14px; margin: 0; max-width: 520px; }

          .kpi-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
            gap: 14px;
          }

          .card {
            background: #ffffff;
            border-radius: 16px;
            padding: 26px 28px;
            box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
            border: 1px solid #eef2f7;
          }
          .card-title { margin: 0 0 18px; font-size: 17px; color: #1e293b; }

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
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 16px;
          }

          .btn { border: none; border-radius: 10px; padding: 10px 18px; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.15s ease; }
          .btn:disabled { opacity: 0.45; cursor: not-allowed; }
          .btn-primary { background: linear-gradient(120deg, #f59e0b, #fbbf24); color: #0f172a; box-shadow: 0 6px 16px -6px rgba(245, 158, 11, 0.6); }
          .btn-primary:hover { transform: translateY(-1px); }
          .btn-ghost { background: #f1f5f9; color: #475569; }
          .btn-ghost:hover:not(:disabled) { background: #e2e8f0; }
          .btn-export { background: #16a34a; color: white; }
          .btn-export:hover { background: #15803d; transform: translateY(-1px); }

          .list-toolbar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px; margin-bottom: 18px; }
          .search-wrap { position: relative; }
          .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: 13px; opacity: 0.5; }
          .search-input { width: 320px; padding-left: 34px !important; }

          .table-wrap { overflow-x: auto; }
          .styled-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 1400px; }
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
          .styled-table td.strong { font-weight: 600; }

          .actions-cell { display: flex; gap: 6px; }
          .actions-cell :global(a.btn-icon) { text-decoration: none; }
          .btn-icon, :global(.btn-icon) {
            background: #f1f5f9; padding: 5px 9px; font-size: 11px; color: #475569;
            border-radius: 8px; font-weight: 700; border: none; cursor: pointer;
          }
          :global(.btn-icon:hover) { background: #e2e8f0; }

          .rec-chip { font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 999px; }
          .rec-yes { background: #dcfce7; color: #15803d; }
          .rec-no { background: #f1f5f9; color: #94a3b8; }

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
        `}</style>
      </>
    </ProtectedRoute>
  );
}
