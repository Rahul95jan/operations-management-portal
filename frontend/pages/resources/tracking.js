import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Sidebar from "../../components/Sidebar";
import ProtectedRoute from "../../components/ProtectedRoute";
import StatusBadge from "../../components/resources/StatusBadge";

const EMPTY_FILTERS = { mentor_name: "", batch_name: "", course_name: "", status: "" };

function unique(list) {
  return [...new Set(list.filter(Boolean))].sort();
}

function buildQuery(filters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  return params.toString();
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ResourceTrackingPage() {
  const [rows, setRows] = useState(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [filterOptions, setFilterOptions] = useState({ mentor_name: [], batch_name: [], course_name: [] });
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/resource-tracking")
      .then((res) => res.json())
      .then((data) => {
        const all = Array.isArray(data) ? data : [];
        setFilterOptions({
          mentor_name: unique(all.map((r) => r.mentor_name)),
          batch_name: unique(all.map((r) => r.batch_name)),
          course_name: unique(all.map((r) => r.course_name)),
        });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const query = buildQuery(filters);
    const suffix = query ? `?${query}` : "";

    fetch(`http://127.0.0.1:8000/resource-tracking${suffix}`)
      .then((res) => res.json())
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch(() => setRows([]));
  }, [filters]);

  const handleFilterChange = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));
  const clearFilters = () => setFilters(EMPTY_FILTERS);
  const hasActiveFilter = Object.values(filters).some(Boolean);

  const summary = useMemo(() => {
    if (!rows) return null;

    return {
      total: rows.length,
      overdue: rows.filter((r) => r.status === "Overdue").length,
      pending: rows.filter((r) => r.status === "Pending").length,
      complete: rows.filter((r) => r.status === "Complete").length,
    };
  }, [rows]);

  const visibleRows = useMemo(() => {
    if (!rows) return [];
    const term = search.trim().toLowerCase();
    if (!term) return rows;

    return rows.filter((r) => {
      const haystack = [
        r.session_topic,
        r.course_name,
        r.batch_name,
        r.mentor_name,
        ...(r.required_resources || []),
        ...(r.received_resources || []),
        ...(r.missing_resources || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [rows, search]);

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
          {/* Header */}
          <div className="page-hero">
            <div className="page-hero-blob" />
            <div className="page-hero-content">
              <div className="page-hero-eyebrow">Resource Portal</div>
              <h1 className="page-hero-title">📋 Resource Tracking</h1>
              <p className="page-hero-subtitle">
                One row per session — what's required, what came in, what's still missing.
              </p>
            </div>
            <div className="page-hero-actions">
              <a href="http://127.0.0.1:8000/resources/export?format=csv" className="btn btn-export-outline">
                ⬇ CSV
              </a>
              <a href="http://127.0.0.1:8000/resources/export?format=excel" className="btn btn-export">
                ⬇ Excel
              </a>
            </div>
          </div>

          {/* Search */}
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by mentor, session, topic, course, batch, or resource title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="styled-input search-input"
            />
          </div>

          {/* Summary */}
          {summary && (
            <div className="kpi-grid">
              <SummaryCard title="Sessions Tracked" value={summary.total} color="#334155" />
              <SummaryCard title="Overdue" value={summary.overdue} color="#dc2626" />
              <SummaryCard title="Pending" value={summary.pending} color="#f59e0b" />
              <SummaryCard title="Complete" value={summary.complete} color="#16a34a" />
            </div>
          )}

          {/* Filters */}
          <div className="card filter-card">
            <FilterSelect
              label="Mentor"
              value={filters.mentor_name}
              options={filterOptions.mentor_name}
              onChange={(v) => handleFilterChange("mentor_name", v)}
            />
            <FilterSelect
              label="Batch"
              value={filters.batch_name}
              options={filterOptions.batch_name}
              onChange={(v) => handleFilterChange("batch_name", v)}
            />
            <FilterSelect
              label="Course"
              value={filters.course_name}
              options={filterOptions.course_name}
              onChange={(v) => handleFilterChange("course_name", v)}
            />
            <FilterSelect
              label="Status"
              value={filters.status}
              options={["Pending", "Overdue", "Delayed", "Complete", "Partially Submitted", "Not Required"]}
              onChange={(v) => handleFilterChange("status", v)}
            />

            {hasActiveFilter && (
              <button onClick={clearFilters} className="btn btn-ghost">
                ✕ Clear Filters
              </button>
            )}
          </div>

          {/* Table */}
          <div className="card table-card">
            {rows === null ? (
              <div className="empty-state">Loading…</div>
            ) : rows.length === 0 ? (
              <div className="empty-state">
                No sessions with resource requirements yet — configure requirements from the Resource Portal.
              </div>
            ) : visibleRows.length === 0 ? (
              <div className="empty-state">No sessions match "{search}".</div>
            ) : (
              <div className="table-wrap">
                <table className="styled-table" style={{ minWidth: "1100px" }}>
                  <thead>
                    <tr>
                      {["Session", "Date", "Course", "Batch", "Mentor", "Required", "Received", "Missing", "Status", "Due At", "Received At", "Delay", "Reminders"].map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {visibleRows.map((r, i) => (
                      <tr key={r.session_id} style={{ animationDelay: `${i * 0.03}s` }}>
                        <td className="strong">
                          <Link href={`/resources/${r.session_id}`} className="row-link">
                            {r.session_topic} →
                          </Link>
                        </td>
                        <td className="muted">{r.session_date}</td>
                        <td>{r.course_name}</td>
                        <td>{r.batch_name}</td>
                        <td>{r.mentor_name}</td>
                        <td style={{ textAlign: "center" }}>{r.required_count}</td>
                        <td style={{ textAlign: "center" }}>{r.received_count}</td>
                        <td
                          style={{ textAlign: "center", fontWeight: r.missing_count > 0 ? 700 : 400, color: r.missing_count > 0 ? "#dc2626" : "#1e293b" }}
                          title={r.missing_resources.join(", ")}
                        >
                          {r.missing_count}
                        </td>
                        <td>
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="muted" style={{ fontSize: "13px" }}>{formatDate(r.due_at)}</td>
                        <td className="muted" style={{ fontSize: "13px" }}>{formatDate(r.received_at)}</td>
                        <td className="muted" style={{ fontSize: "13px" }}>
                          {r.delay_hours > 0 ? `${r.delay_hours} hrs` : "0 hrs"}
                        </td>
                        <td style={{ textAlign: "center" }}>{r.reminder_count}</td>
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
            background: #facc15;
            filter: blur(60px);
            opacity: 0.25;
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

          .page-hero-actions {
            position: relative;
            z-index: 1;
            display: flex;
            gap: 10px;
            flex-shrink: 0;
          }

          .btn {
            border: none;
            border-radius: 10px;
            padding: 10px 18px;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.15s ease;
            text-decoration: none;
            display: inline-block;
          }

          .btn-export {
            background: #facc15;
            color: #0f172a;
          }

          .btn-export:hover {
            transform: translateY(-1px);
            filter: brightness(1.05);
          }

          .btn-export-outline {
            background: rgba(255, 255, 255, 0.08);
            color: #f8fafc;
            border: 1px solid rgba(255, 255, 255, 0.2);
          }

          .btn-export-outline:hover {
            background: rgba(255, 255, 255, 0.14);
          }

          .btn-ghost {
            background: #f1f5f9;
            color: #334155;
            border: 1.5px solid #e2e8f0 !important;
          }

          .btn-ghost:hover {
            background: #e2e8f0;
          }

          .search-wrap {
            position: relative;
            margin-bottom: 20px;
          }

          .search-icon {
            position: absolute;
            left: 16px;
            top: 50%;
            transform: translateY(-50%);
            font-size: 14px;
            opacity: 0.5;
          }

          .search-input {
            width: 100%;
            box-sizing: border-box;
            padding: 13px 16px 13px 42px !important;
            border-radius: 10px !important;
            border: 1px solid #e2e8f0 !important;
            font-size: 14px;
            background: #fff !important;
          }

          .styled-input:focus {
            border-color: #f59e0b !important;
            box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15);
          }

          .kpi-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-bottom: 20px;
          }

          :global(.kpi-tile) {
            background: #fff;
            border-radius: 12px;
            padding: 18px 20px;
            box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
            transition: transform 0.15s ease, box-shadow 0.15s ease;
          }

          :global(.kpi-tile:hover) {
            transform: translateY(-2px);
            box-shadow: 0 8px 18px -10px rgba(15, 23, 42, 0.25);
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
            align-items: flex-end;
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

          :global(.row-link) {
            color: #0f172a;
            text-decoration: none;
            font-weight: 600;
          }

          :global(.row-link:hover) {
            color: #f59e0b;
          }

          .empty-state {
            text-align: center;
            padding: 40px 20px;
            color: #94a3b8;
            font-size: 14px;
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

function SummaryCard({ title, value, color }) {
  return (
    <div className="kpi-tile" style={{ borderLeft: `4px solid ${color}` }}>
      <div style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.03em", textTransform: "uppercase", color: "#94a3b8", marginBottom: "8px" }}>
        {title}
      </div>
      <div style={{ fontSize: "26px", fontWeight: 800, color, fontVariantNumeric: "tabular-nums" }}>{value}</div>
    </div>
  );
}

function FilterSelect({ label, value, options, onChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label style={{ fontSize: "12px", fontWeight: 700, color: "#64748b" }}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          border: "1px solid #e2e8f0",
          borderRadius: "10px",
          padding: "10px 12px",
          fontSize: "14px",
          minWidth: "160px",
          background: "#f8fafc",
          outline: "none",
        }}
      >
        <option value="">All {label}s</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}
