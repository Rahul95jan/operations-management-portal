import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Sidebar from "../../components/Sidebar";
import ProtectedRoute from "../../components/ProtectedRoute";
import StatusBadge from "../../components/resources/StatusBadge";
import ResourceActions from "../../components/resources/ResourceActions";
import { typeConfig } from "../../components/resources/resourceTypes";
import { categoryConfig } from "../../components/resources/resourceCategories";

const API = "http://127.0.0.1:8000";

function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function DeadlineBanner({ status, dueAt, delayHours }) {
  if (!dueAt) return null;

  if (status === "Overdue") {
    const hoursOverdue = Math.max(0, Math.round((Date.now() - new Date(dueAt).getTime()) / 3600000));
    return (
      <div style={{ background: "#fee2e2", color: "#991b1b", padding: "12px 16px", borderRadius: "10px", fontWeight: 700, marginBottom: "20px" }}>
        🚨 OVERDUE BY {hoursOverdue} HOUR{hoursOverdue === 1 ? "" : "S"} · Deadline was {formatDateTime(dueAt)}
      </div>
    );
  }

  if (status === "Delayed") {
    return (
      <div style={{ background: "#ffedd5", color: "#9a3412", padding: "12px 16px", borderRadius: "10px", fontWeight: 700, marginBottom: "20px" }}>
        ⏱ Submitted {delayHours} hrs late · Deadline was {formatDateTime(dueAt)}
      </div>
    );
  }

  return (
    <div style={{ background: "#f1f5f9", color: "#334155", padding: "12px 16px", borderRadius: "10px", fontWeight: 600, marginBottom: "20px" }}>
      Resource Deadline: {formatDateTime(dueAt)}
    </div>
  );
}

export default function ResourceDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [detail, setDetail] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;

    fetch(`${API}/resource-tracking/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.message === "Session not found") {
          setNotFound(true);
        } else {
          setDetail(data);
        }
      })
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound) {
    return (
      <ProtectedRoute>
        <>
          <Sidebar />
          <div style={{ marginLeft: "300px", padding: "30px" }}>
            <h2>Session not found</h2>
          </div>
        </>
      </ProtectedRoute>
    );
  }

  if (!detail) {
    return (
      <ProtectedRoute>
        <>
          <Sidebar />
          <div style={{ marginLeft: "300px", padding: "30px" }}>Loading...</div>
        </>
      </ProtectedRoute>
    );
  }

  const { session, requirements, resources, emails } = detail;
  const submittedByType = new Set(resources.map((r) => r.resource_type));

  return (
    <ProtectedRoute>
      <>
        <Sidebar />

        <div style={{ marginLeft: "300px", padding: "30px", background: "#f8fafc", minHeight: "100vh" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h1 style={{ fontSize: "28px", fontWeight: 700, margin: "0 0 6px" }}>{session.topic}</h1>
              <div style={{ color: "#64748b", fontSize: "14px" }}>
                {session.course_name} · {session.batch_name} · {session.mentor_name} · {session.session_date} {session.session_time}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <StatusBadge status={detail.status} />
              <a href={`${API}/sessions/${session.id}/resources/lms-package`}>
                <span style={{ display: "inline-block", background: "#0f172a", color: "#facc15", padding: "10px 18px", borderRadius: "8px", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}>
                  ⬇ Download All Resources
                </span>
              </a>
            </div>
          </div>

          <DeadlineBanner status={detail.status} dueAt={detail.due_at} delayHours={detail.delay_hours} />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px", marginBottom: "30px" }}>
            <SummaryCard title="Required" value={detail.required_count} color="#334155" />
            <SummaryCard title="Received" value={detail.received_count} color="#16a34a" />
            <SummaryCard title="Missing" value={detail.missing_count} color="#dc2626" />
            <SummaryCard title="Reminders Sent" value={detail.reminder_count} color="#f59e0b" />
          </div>

          <Section title="✅ Required Resources">
            {requirements.length === 0 ? (
              <Empty text="No resource requirements configured for this session." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {requirements.map((req) => (
                  <div key={req.id} style={rowStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span>{typeConfig(req.resource_type)?.icon || "📎"}</span>
                      <div>
                        <div style={{ fontWeight: 600 }}>{req.resource_name}</div>
                        <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                          {categoryConfig(req.resource_category)?.label && `${categoryConfig(req.resource_category).label} · `}
                          {req.due_at ? `Due ${formatDateTime(req.due_at)}` : "No deadline set"}
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={req.status} />
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="📦 Submitted Resources">
            {resources.length === 0 ? (
              <Empty text="Nothing submitted yet." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {resources.map((r) => (
                  <div key={r.id} style={{ ...rowStyle, alignItems: "flex-start" }}>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <span style={{ fontSize: "18px" }}>{typeConfig(r.resource_type)?.icon || "📎"}</span>
                      <div>
                        <div style={{ fontWeight: 600 }}>{r.resource_title}</div>
                        <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                          {categoryConfig(r.resource_category)?.label && `${categoryConfig(r.resource_category).label} · `}
                          {typeConfig(r.resource_type)?.label || r.resource_type}
                          {r.file_size ? ` · ${(r.file_size / 1024).toFixed(1)} KB` : ""}
                          {" · Submitted "}{formatDateTime(r.submitted_at)}
                        </div>
                      </div>
                    </div>
                    <ResourceActions resource={r} />
                  </div>
                ))}
              </div>
            )}
          </Section>

          {detail.missing_resources.length > 0 && (
            <Section title="⚠️ Missing Resources">
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {detail.missing_resources.map((name) => (
                  <span key={name} style={{ background: "#fee2e2", color: "#991b1b", padding: "6px 12px", borderRadius: "999px", fontSize: "13px", fontWeight: 600 }}>
                    {name}
                  </span>
                ))}
              </div>
            </Section>
          )}

          <Section title="🔔 Reminder History">
            {requirements.every((r) => (r.reminder_count || 0) === 0) ? (
              <Empty text="No reminders sent yet." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {requirements.filter((r) => (r.reminder_count || 0) > 0).map((r) => (
                  <div key={r.id} style={rowStyle}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{r.resource_name}</div>
                      <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                        Last reminder: {formatDateTime(r.last_reminder_sent_at)}
                      </div>
                    </div>
                    <span style={{ fontWeight: 700, color: "#f59e0b" }}>{r.reminder_count}x</span>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="✉️ Email History">
            {emails.length === 0 ? (
              <Empty text="No emails logged yet." />
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", borderBottom: "1px solid #e2e8f0" }}>
                    <th style={{ padding: "8px", fontSize: "12px", color: "#64748b" }}>Type</th>
                    <th style={{ padding: "8px", fontSize: "12px", color: "#64748b" }}>Recipient</th>
                    <th style={{ padding: "8px", fontSize: "12px", color: "#64748b" }}>Sent At</th>
                    <th style={{ padding: "8px", fontSize: "12px", color: "#64748b" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {emails.map((e) => (
                    <tr key={e.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "8px" }}>{e.email_type}</td>
                      <td style={{ padding: "8px" }}>{e.email}</td>
                      <td style={{ padding: "8px" }}>{formatDateTime(e.sent_at)}</td>
                      <td style={{ padding: "8px" }}>{e.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Section>
        </div>
      </>
    </ProtectedRoute>
  );
}

const rowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  padding: "12px 16px",
};

function Section({ title, children }) {
  return (
    <div style={{ background: "#fff", borderRadius: "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)", padding: "20px", marginBottom: "20px" }}>
      <h3 style={{ marginTop: 0, marginBottom: "16px" }}>{title}</h3>
      {children}
    </div>
  );
}

function Empty({ text }) {
  return <p style={{ color: "#94a3b8", margin: 0 }}>{text}</p>;
}

function SummaryCard({ title, value, color }) {
  return (
    <div style={{ background: "#fff", borderRadius: "12px", padding: "16px 18px", borderLeft: `6px solid ${color}`, boxShadow: "0 2px 10px rgba(0,0,0,0.08)" }}>
      <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>{title}</div>
      <div style={{ fontSize: "24px", fontWeight: 800, color }}>{value}</div>
    </div>
  );
}
