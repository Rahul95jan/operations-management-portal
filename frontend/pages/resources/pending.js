import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Sidebar from "../../components/Sidebar";
import ProtectedRoute from "../../components/ProtectedRoute";
import StatusBadge from "../../components/resources/StatusBadge";
import { categoryConfig } from "../../components/resources/resourceCategories";

const API = "http://127.0.0.1:8000";

const EMPTY_FILTERS = { mentor_name: "", batch_name: "" };

function unique(list) {
  return [...new Set(list.filter(Boolean))].sort();
}

function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PendingResourcesPage() {
  const [rows, setRows] = useState(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sendingId, setSendingId] = useState(null);

  const load = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => v && params.set(k, v));
    const suffix = params.toString() ? `?${params.toString()}` : "";

    fetch(`${API}/resources/pending${suffix}`)
      .then((res) => res.json())
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch(() => setRows([]));
  };

  useEffect(load, [filters]);

  const filterOptions = useMemo(() => {
    if (!rows) return { mentor_name: [], batch_name: [] };
    return {
      mentor_name: unique(rows.map((r) => r.mentor_name)),
      batch_name: unique(rows.map((r) => r.batch_name)),
    };
  }, [rows]);

  const overdueCount = useMemo(() => (rows || []).filter((r) => r.delay_hours > 0).length, [rows]);

  const handleSendReminder = async (requirementId, resourceName) => {
    const confirmed = window.confirm(
      `Send a reminder email now for "${resourceName}"?\n\nThis sends a real email to the mentor and counts toward the daily reminder limit.`
    );
    if (!confirmed) return;

    setSendingId(requirementId);

    try {
      const res = await fetch(`${API}/resource-requirements/${requirementId}/send-reminder`, { method: "POST" });
      const data = await res.json();
      alert(data.message);
      load();
    } catch (err) {
      alert("Unable to reach the server.");
    } finally {
      setSendingId(null);
    }
  };

  return (
    <ProtectedRoute>
      <>
        <Sidebar />

        <div style={{ marginLeft: "280px", padding: "32px 36px 60px", background: "#f1f5f9", minHeight: "100vh" }}>
          {/* Header */}
          <div className="page-hero">
            <div className="page-hero-blob" />
            <div className="page-hero-content">
              <div className="page-hero-eyebrow">Resource Portal</div>
              <h1 className="page-hero-title">⏳ Pending Resources</h1>
              <p className="page-hero-subtitle">Everything still outstanding, most overdue first.</p>
            </div>
            <div className="page-hero-stats">
              <div className="page-hero-stat">
                <div className="page-hero-stat-value">{rows ? rows.length : "—"}</div>
                <div className="page-hero-stat-label">Pending</div>
              </div>
              <div className="page-hero-stat page-hero-stat-danger">
                <div className="page-hero-stat-value">{rows ? overdueCount : "—"}</div>
                <div className="page-hero-stat-label">Overdue</div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="card filter-card">
            <FilterSelect
              label="Mentor"
              value={filters.mentor_name}
              options={filterOptions.mentor_name}
              onChange={(v) => setFilters((prev) => ({ ...prev, mentor_name: v }))}
            />
            <FilterSelect
              label="Batch"
              value={filters.batch_name}
              options={filterOptions.batch_name}
              onChange={(v) => setFilters((prev) => ({ ...prev, batch_name: v }))}
            />
          </div>

          {/* Table */}
          <div className="card table-card">
            {rows === null ? (
              <div className="empty-state">Loading…</div>
            ) : rows.length === 0 ? (
              <div className="empty-state empty-state-success">✅ Nothing pending — all caught up.</div>
            ) : (
              <div className="table-wrap">
                <table className="styled-table" style={{ minWidth: "1000px" }}>
                  <thead>
                    <tr>
                      {["Mentor", "Session", "Batch", "Category", "Resource", "Status", "Due Date", "Delay", "Reminders", "Last Reminder", "Actions"].map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={r.requirement_id} style={{ animationDelay: `${i * 0.03}s` }}>
                        <td className="strong">{r.mentor_name}</td>
                        <td>{r.session_topic}</td>
                        <td>{r.batch_name}</td>
                        <td className="muted">{categoryConfig(r.resource_category)?.label || "—"}</td>
                        <td>{r.resource_name}</td>
                        <td>
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="muted" style={{ fontSize: "13px" }}>{formatDateTime(r.due_at)}</td>
                        <td style={{ fontSize: "13px", color: r.delay_hours > 0 ? "#dc2626" : "#94a3b8", fontWeight: r.delay_hours > 0 ? 700 : 400 }}>
                          {r.delay_hours > 0 ? `${r.delay_hours} hrs` : "—"}
                        </td>
                        <td style={{ textAlign: "center" }}>{r.reminder_count}</td>
                        <td className="muted" style={{ fontSize: "13px" }}>{formatDateTime(r.last_reminder_sent_at)}</td>
                        <td>
                          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            <Link href={`/resources/${r.session_id}`} className="action-btn action-btn-view">
                              View
                            </Link>

                            <button
                              onClick={() => handleSendReminder(r.requirement_id, r.resource_name)}
                              disabled={sendingId === r.requirement_id}
                              className="action-btn action-btn-reminder"
                            >
                              {sendingId === r.requirement_id ? "Sending..." : "Send Reminder"}
                            </button>

                            <a href={`${API}/sessions/${r.session_id}/resources/lms-package`} className="action-btn action-btn-download">
                              Download Available
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
            background: #f59e0b;
            filter: blur(60px);
            opacity: 0.3;
            top: -80px;
            right: 160px;
            animation: float 9s ease-in-out infinite;
          }

          .page-hero-content {
            position: relative;
            z-index: 1;
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
          }

          .page-hero-stats {
            position: relative;
            z-index: 1;
            display: flex;
            gap: 12px;
            flex-shrink: 0;
          }

          .page-hero-stat {
            text-align: center;
            padding: 14px 22px;
            border-radius: 14px;
            background: rgba(255, 255, 255, 0.06);
            border: 1px solid rgba(255, 255, 255, 0.1);
          }

          .page-hero-stat-value {
            font-size: 26px;
            font-weight: 800;
            color: #fbbf24;
          }

          .page-hero-stat-danger .page-hero-stat-value {
            color: #f87171;
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
            box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
            border: 1px solid #eef2f7;
            animation: fadeSlideUp 0.4s ease both;
          }

          .filter-card {
            padding: 16px 20px;
            margin-bottom: 20px;
            display: flex;
            gap: 16px;
            flex-wrap: wrap;
          }

          .table-card {
            padding: 20px;
          }

          .table-wrap {
            overflow-x: auto;
          }

          .styled-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
          }

          .styled-table thead th {
            text-align: left;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            color: #94a3b8;
            font-weight: 700;
            padding: 10px 12px;
            border-bottom: 2px solid #f1f5f9;
            white-space: nowrap;
          }

          .styled-table tbody tr {
            animation: fadeSlideUp 0.3s ease both;
            transition: background 0.12s ease;
          }

          .styled-table tbody tr:hover {
            background: #fafaf9;
          }

          .styled-table td {
            padding: 12px;
            border-bottom: 1px solid #f1f5f9;
            color: #1e293b;
          }

          .styled-table td.muted {
            color: #94a3b8;
          }

          .styled-table td.strong {
            font-weight: 600;
          }

          :global(.action-btn) {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 700;
            white-space: nowrap;
            text-decoration: none;
            border: none;
            cursor: pointer;
            transition: transform 0.12s ease, filter 0.12s ease;
          }

          :global(.action-btn:hover) {
            transform: translateY(-1px);
            filter: brightness(1.06);
          }

          :global(.action-btn:disabled) {
            cursor: not-allowed;
            opacity: 0.7;
            transform: none;
          }

          :global(.action-btn-view) {
            background: #dbeafe;
            color: #1d4ed8;
          }

          :global(.action-btn-reminder) {
            background: #fef3c7;
            color: #b45309;
          }

          :global(.action-btn-download) {
            background: #0f172a;
            color: #facc15;
          }

          .empty-state {
            text-align: center;
            padding: 40px 20px;
            color: #94a3b8;
            font-size: 14px;
          }

          .empty-state-success {
            color: #16a34a;
            font-weight: 700;
          }

          @keyframes heroShift {
            0% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
            100% {
              background-position: 0% 50%;
            }
          }

          @keyframes float {
            0%,
            100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(16px);
            }
          }

          @keyframes fadeSlideUp {
            from {
              opacity: 0;
              transform: translateY(8px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </>
    </ProtectedRoute>
  );
}

function FilterSelect({ label, value, options, onChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label style={{ fontSize: "12px", fontWeight: 700, color: "#64748b" }}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ border: "1px solid #e2e8f0", borderRadius: "10px", padding: "10px 12px", fontSize: "14px", minWidth: "160px", background: "#f8fafc", outline: "none" }}
      >
        <option value="">All {label}s</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}
