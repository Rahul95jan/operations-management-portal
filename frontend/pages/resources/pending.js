import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Sidebar from "../../components/Sidebar";
import ProtectedRoute from "../../components/ProtectedRoute";
import StatusBadge from "../../components/resources/StatusBadge";

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

        <div style={{ marginLeft: "300px", padding: "30px", background: "#f8fafc", minHeight: "100vh" }}>
          <h1 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "6px" }}>⏳ Pending Resources</h1>
          <p style={{ color: "#64748b", marginTop: 0, marginBottom: "24px" }}>
            Everything still outstanding, most overdue first.
          </p>

          <div
            style={{
              background: "#fff",
              borderRadius: "12px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
              padding: "16px 20px",
              marginBottom: "20px",
              display: "flex",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
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

          <div style={{ background: "#fff", borderRadius: "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)", padding: "20px", overflowX: "auto" }}>
            {rows === null ? (
              <p>Loading...</p>
            ) : rows.length === 0 ? (
              <p style={{ color: "#16a34a", fontWeight: 600 }}>✅ Nothing pending — all caught up.</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1000px" }}>
                <thead>
                  <tr style={{ textAlign: "left", borderBottom: "2px solid #e2e8f0" }}>
                    {["Mentor", "Session", "Batch", "Resource", "Status", "Due Date", "Delay", "Reminders", "Last Reminder", "Actions"].map((h) => (
                      <th key={h} style={{ padding: "10px 12px", fontSize: "12px", color: "#64748b", textTransform: "uppercase" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.requirement_id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px", fontWeight: 600 }}>{r.mentor_name}</td>
                      <td style={{ padding: "12px" }}>{r.session_topic}</td>
                      <td style={{ padding: "12px" }}>{r.batch_name}</td>
                      <td style={{ padding: "12px" }}>{r.resource_name}</td>
                      <td style={{ padding: "12px" }}>
                        <StatusBadge status={r.status} />
                      </td>
                      <td style={{ padding: "12px", fontSize: "13px" }}>{formatDateTime(r.due_at)}</td>
                      <td style={{ padding: "12px", fontSize: "13px", color: r.delay_hours > 0 ? "#dc2626" : "#64748b", fontWeight: r.delay_hours > 0 ? 700 : 400 }}>
                        {r.delay_hours > 0 ? `${r.delay_hours} hrs` : "—"}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>{r.reminder_count}</td>
                      <td style={{ padding: "12px", fontSize: "13px" }}>{formatDateTime(r.last_reminder_sent_at)}</td>
                      <td style={{ padding: "12px" }}>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          <Link href={`/resources/${r.session_id}`}>
                            <ActionBtn label="View" color="#2563eb" />
                          </Link>

                          <button
                            onClick={() => handleSendReminder(r.requirement_id, r.resource_name)}
                            disabled={sendingId === r.requirement_id}
                            style={{ border: "none", padding: 0, background: "none", cursor: "pointer" }}
                          >
                            <ActionBtn label={sendingId === r.requirement_id ? "Sending..." : "Send Reminder"} color="#f59e0b" />
                          </button>

                          <a href={`${API}/sessions/${r.session_id}/resources/lms-package`}>
                            <ActionBtn label="Download Available" color="#0f172a" textColor="#facc15" />
                          </a>
                        </div>
                      </td>
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

function ActionBtn({ label, color, textColor = "#fff" }) {
  return (
    <span style={{ display: "inline-block", background: color, color: textColor, padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 700, whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

function FilterSelect({ label, value, options, onChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label style={{ fontSize: "12px", fontWeight: 600, color: "#64748b" }}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ border: "1.5px solid #e2e8f0", borderRadius: "8px", padding: "9px 12px", fontSize: "14px", minWidth: "160px" }}
      >
        <option value="">All {label}s</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}
