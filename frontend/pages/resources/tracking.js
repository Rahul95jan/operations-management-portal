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
            marginLeft: "300px",
            padding: "30px",
            background: "#f8fafc",
            minHeight: "100vh",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "6px" }}>
            <h1 style={{ fontSize: "32px", fontWeight: 700, margin: 0 }}>
              📋 Resource Tracking
            </h1>

            <div style={{ display: "flex", gap: "10px" }}>
              <a href="http://127.0.0.1:8000/resources/export?format=csv">
                <ExportBtn label="⬇ Export CSV" color="#16a34a" />
              </a>
              <a href="http://127.0.0.1:8000/resources/export?format=excel">
                <ExportBtn label="⬇ Export Excel" color="#0f172a" textColor="#facc15" />
              </a>
            </div>
          </div>
          <p style={{ color: "#64748b", marginTop: 0, marginBottom: "20px" }}>
            One row per session — what's required, what came in, what's still missing.
          </p>

          <input
            type="text"
            placeholder="Search by mentor, session, topic, course, batch, or resource title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px 16px",
              borderRadius: "10px",
              border: "1.5px solid #e2e8f0",
              fontSize: "14px",
              marginBottom: "20px",
              background: "#fff",
            }}
          />

          {summary && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4,1fr)",
                gap: "16px",
                marginBottom: "24px",
              }}
            >
              <SummaryCard title="Sessions Tracked" value={summary.total} color="#334155" />
              <SummaryCard title="Overdue" value={summary.overdue} color="#dc2626" />
              <SummaryCard title="Pending" value={summary.pending} color="#f59e0b" />
              <SummaryCard title="Complete" value={summary.complete} color="#16a34a" />
            </div>
          )}

          <div
            style={{
              background: "#fff",
              borderRadius: "12px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
              padding: "16px 20px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "flex-end",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
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
              <button
                onClick={clearFilters}
                style={{
                  background: "#f1f5f9",
                  color: "#334155",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "10px 16px",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                ✕ Clear Filters
              </button>
            )}
          </div>

          <div
            style={{
              background: "#fff",
              borderRadius: "12px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
              padding: "20px",
              overflowX: "auto",
            }}
          >
            {rows === null ? (
              <p>Loading...</p>
            ) : rows.length === 0 ? (
              <p style={{ color: "#94a3b8" }}>
                No sessions with resource requirements yet — configure requirements from the Resource Portal.
              </p>
            ) : visibleRows.length === 0 ? (
              <p style={{ color: "#94a3b8" }}>No sessions match "{search}".</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1100px" }}>
                <thead>
                  <tr style={{ textAlign: "left", borderBottom: "2px solid #e2e8f0" }}>
                    {["Session", "Date", "Course", "Batch", "Mentor", "Required", "Received", "Missing", "Status", "Due At", "Received At", "Delay", "Reminders"].map((h) => (
                      <th key={h} style={{ padding: "10px 12px", fontSize: "12px", color: "#64748b", textTransform: "uppercase" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {visibleRows.map((r) => (
                    <tr key={r.session_id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px", fontWeight: 600 }}>
                        <Link href={`/resources/${r.session_id}`} style={{ color: "#0f172a", textDecoration: "none" }}>
                          {r.session_topic} →
                        </Link>
                      </td>
                      <td style={{ padding: "12px" }}>{r.session_date}</td>
                      <td style={{ padding: "12px" }}>{r.course_name}</td>
                      <td style={{ padding: "12px" }}>{r.batch_name}</td>
                      <td style={{ padding: "12px" }}>{r.mentor_name}</td>
                      <td style={{ padding: "12px", textAlign: "center" }}>{r.required_count}</td>
                      <td style={{ padding: "12px", textAlign: "center" }}>{r.received_count}</td>
                      <td
                        style={{ padding: "12px", textAlign: "center", fontWeight: r.missing_count > 0 ? 700 : 400, color: r.missing_count > 0 ? "#dc2626" : "#0f172a" }}
                        title={r.missing_resources.join(", ")}
                      >
                        {r.missing_count}
                      </td>
                      <td style={{ padding: "12px" }}>
                        <StatusBadge status={r.status} />
                      </td>
                      <td style={{ padding: "12px", fontSize: "13px" }}>{formatDate(r.due_at)}</td>
                      <td style={{ padding: "12px", fontSize: "13px" }}>{formatDate(r.received_at)}</td>
                      <td style={{ padding: "12px", fontSize: "13px" }}>
                        {r.delay_hours > 0 ? `${r.delay_hours} hrs` : "0 hrs"}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>{r.reminder_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </>
    </ProtectedRoute>
  );
}

function ExportBtn({ label, color, textColor = "#fff" }) {
  return (
    <span
      style={{
        display: "inline-block",
        background: color,
        color: textColor,
        padding: "10px 16px",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      {label}
    </span>
  );
}

function SummaryCard({ title, value, color }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "12px",
        padding: "18px 20px",
        borderLeft: `6px solid ${color}`,
        boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
      }}
    >
      <div style={{ fontSize: "13px", color: "#64748b", fontWeight: 600 }}>{title}</div>
      <div style={{ fontSize: "28px", fontWeight: 800, color }}>{value}</div>
    </div>
  );
}

function FilterSelect({ label, value, options, onChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label style={{ fontSize: "12px", fontWeight: 600, color: "#64748b" }}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          border: "1.5px solid #e2e8f0",
          borderRadius: "8px",
          padding: "9px 12px",
          fontSize: "14px",
          minWidth: "160px",
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
