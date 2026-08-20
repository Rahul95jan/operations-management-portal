import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";

const STATUS_STYLES = {
  Scheduled: { bg: "#dbeafe", color: "#1d4ed8", dot: "#3b82f6" },
  Completed: { bg: "#dcfce7", color: "#15803d", dot: "#22c55e" },
  Cancelled: { bg: "#fee2e2", color: "#b91c1c", dot: "#ef4444" },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || { bg: "#e2e8f0", color: "#475569", dot: "#94a3b8" };
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
        padding: "5px 12px",
        borderRadius: "999px",
      }}
    >
      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: s.dot }} />
      {status}
    </span>
  );
}

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

export default function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");

  const [mentors, setMentors] = useState([]);
  const [batches, setBatches] = useState([]);

  const [form, setForm] = useState({
    topic: "",
    mentor_name: "",
    batch_name: "",
    session_date: "",
    session_time: "",
    status: "Scheduled",
  });

  const loadSessions = async () => {
    const res = await fetch("http://127.0.0.1:8000/sessions");
    const data = await res.json();
    setSessions(data);
  };

  const loadMentors = async () => {
    const res = await fetch("http://127.0.0.1:8000/mentors");
    const data = await res.json();
    setMentors(data);
  };

  const loadBatches = async () => {
    const res = await fetch("http://127.0.0.1:8000/batches");
    const data = await res.json();
    setBatches(data);
  };

  useEffect(() => {
    loadSessions();
    loadMentors();
    loadBatches();
  }, []);

  const resetForm = () => {
    setForm({
      topic: "",
      mentor_name: "",
      batch_name: "",
      session_date: "",
      session_time: "",
      status: "Scheduled",
    });

    setEditId(null);
  };

  const createSession = async () => {
    await fetch("http://127.0.0.1:8000/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    loadSessions();
    resetForm();
  };

  const updateSession = async () => {
    await fetch(`http://127.0.0.1:8000/sessions/${editId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    loadSessions();
    resetForm();
  };

  const deleteSession = async (id) => {
    if (!window.confirm("Delete this session?")) return;

    await fetch(`http://127.0.0.1:8000/sessions/${id}`, {
      method: "DELETE",
    });

    loadSessions();
  };

  const editSession = (session) => {
    setEditId(session.id);

    setForm({
      topic: session.topic,
      mentor_name: session.mentor_name,
      batch_name: session.batch_name,
      session_date: session.session_date,
      session_time: session.session_time,
      status: session.status,
    });
  };

  const filteredSessions = sessions.filter(
    (session) =>
      session.topic.toLowerCase().includes(search.toLowerCase()) ||
      session.mentor_name.toLowerCase().includes(search.toLowerCase()) ||
      session.batch_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
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
            <div className="page-hero-eyebrow">Operations</div>
            <h1 className="page-hero-title">Session Management</h1>
            <p className="page-hero-subtitle">
              Schedule new sessions, track status, and keep mentors &amp; batches in sync.
            </p>
          </div>
          <div className="page-hero-stat">
            <div className="page-hero-stat-value">{sessions.length}</div>
            <div className="page-hero-stat-label">Total Sessions</div>
          </div>
        </div>

        {/* Create / Update form */}
        <div className="card form-card">
          <h2 className="card-title">
            {editId ? "✏️ Update Session" : "➕ Create Session"}
          </h2>

          <div className="form-grid">
            <Field label="Topic">
              <input
                className="styled-input"
                style={inputStyle}
                placeholder="e.g. LangGraph Introduction"
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
              />
            </Field>

            <Field label="Mentor">
              <select
                className="styled-input"
                style={inputStyle}
                value={form.mentor_name}
                onChange={(e) => setForm({ ...form, mentor_name: e.target.value })}
              >
                <option value="">Select Mentor</option>
                {mentors.map((mentor) => (
                  <option key={mentor.id} value={mentor.name}>
                    {mentor.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Batch">
              <select
                className="styled-input"
                style={inputStyle}
                value={form.batch_name}
                onChange={(e) => setForm({ ...form, batch_name: e.target.value })}
              >
                <option value="">Select Batch</option>
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.batch_name}>
                    {batch.batch_name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Date">
              <input
                type="date"
                className="styled-input"
                style={inputStyle}
                value={form.session_date}
                onChange={(e) => setForm({ ...form, session_date: e.target.value })}
              />
            </Field>

            <Field label="Time">
              <input
                type="time"
                className="styled-input"
                style={inputStyle}
                value={form.session_time}
                onChange={(e) => setForm({ ...form, session_time: e.target.value })}
              />
            </Field>

            <Field label="Status">
              <select
                className="styled-input"
                style={inputStyle}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="Scheduled">Scheduled</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </Field>
          </div>

          <div style={{ marginTop: "22px", display: "flex", gap: "12px" }}>
            {editId ? (
              <>
                <button className="btn btn-primary" onClick={updateSession}>
                  Update Session
                </button>
                <button className="btn btn-ghost" onClick={resetForm}>
                  Cancel
                </button>
              </>
            ) : (
              <button className="btn btn-primary" onClick={createSession}>
                Create Session
              </button>
            )}
          </div>
        </div>

        {/* Session list */}
        <div className="card" style={{ marginTop: "24px" }}>
          <div className="list-toolbar">
            <h2 className="card-title" style={{ margin: 0 }}>
              📋 Session List
            </h2>

            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <div className="search-wrap">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search sessions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="styled-input search-input"
                />
              </div>

              <a
                href="http://127.0.0.1:8000/export-sessions"
                target="_blank"
                rel="noreferrer"
                style={{ textDecoration: "none" }}
              >
                <button className="btn btn-export">📥 Export Excel</button>
              </a>
            </div>
          </div>

          <div className="table-wrap">
            <table className="styled-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Topic</th>
                  <th>Mentor</th>
                  <th>Batch</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredSessions.map((session, i) => (
                  <tr key={session.id} style={{ animationDelay: `${i * 0.03}s` }}>
                    <td className="muted">{session.id}</td>
                    <td className="strong">{session.topic}</td>
                    <td>{session.mentor_name}</td>
                    <td>{session.batch_name}</td>
                    <td className="muted">{session.session_date}</td>
                    <td className="muted">{session.session_time}</td>
                    <td>
                      <StatusBadge status={session.status} />
                    </td>
                    <td>
                      <button className="btn btn-icon" onClick={() => editSession(session)}>
                        ✏️ Edit
                      </button>
                      <button
                        className="btn btn-icon btn-danger"
                        onClick={() => deleteSession(session.id)}
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredSessions.length === 0 && (
              <div className="empty-state">
                <div style={{ fontSize: "32px", marginBottom: "8px" }}>🗓️</div>
                {sessions.length === 0
                  ? "No sessions yet — create your first one above."
                  : "No sessions match your search."}
              </div>
            )}
          </div>
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

        .page-hero-stat {
          position: relative;
          z-index: 1;
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

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 18px;
        }

        .styled-input:focus {
          border-color: #f59e0b !important;
          background: #ffffff !important;
          box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15);
        }

        .btn {
          border: none;
          border-radius: 10px;
          padding: 11px 20px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-primary {
          background: linear-gradient(120deg, #f59e0b, #fbbf24);
          color: #0f172a;
          box-shadow: 0 6px 16px -6px rgba(245, 158, 11, 0.6);
        }

        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 20px -6px rgba(245, 158, 11, 0.7);
        }

        .btn-ghost {
          background: #f1f5f9;
          color: #475569;
        }

        .btn-ghost:hover {
          background: #e2e8f0;
        }

        .btn-export {
          background: #16a34a;
          color: white;
        }

        .btn-export:hover {
          background: #15803d;
          transform: translateY(-1px);
        }

        .list-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 14px;
          margin-bottom: 18px;
        }

        .search-wrap {
          position: relative;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 13px;
          opacity: 0.5;
        }

        .search-input {
          width: 240px;
          padding-left: 34px !important;
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
          padding: 10px 14px;
          border-bottom: 2px solid #f1f5f9;
        }

        .styled-table tbody tr {
          animation: fadeSlideUp 0.3s ease both;
          transition: background 0.12s ease;
        }

        .styled-table tbody tr:hover {
          background: #fafaf9;
        }

        .styled-table td {
          padding: 12px 14px;
          border-bottom: 1px solid #f1f5f9;
          color: #1e293b;
        }

        .styled-table td.muted {
          color: #94a3b8;
        }

        .styled-table td.strong {
          font-weight: 600;
        }

        .btn-icon {
          background: transparent;
          padding: 6px 10px;
          font-size: 13px;
          color: #475569;
        }

        .btn-icon:hover {
          background: #f1f5f9;
        }

        .btn-danger:hover {
          background: #fee2e2;
          color: #b91c1c;
        }

        .empty-state {
          text-align: center;
          padding: 50px 20px;
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
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}
