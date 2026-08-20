import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";

const AVATAR_COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b", "#22c55e", "#ec4899", "#06b6d4"];

function avatarColor(name) {
  if (!name) return AVATAR_COLORS[0];
  const code = name.charCodeAt(0) + (name.charCodeAt(1) || 0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

function BatchIcon({ name }) {
  return (
    <div
      style={{
        width: "36px",
        height: "36px",
        borderRadius: "10px",
        background: `${avatarColor(name)}22`,
        color: avatarColor(name),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "16px",
        flexShrink: 0,
      }}
    >
      🎓
    </div>
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

export default function Batches() {
  const [batches, setBatches] = useState([]);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    batch_name: "",
    course_name: "",
    strength: "",
    mentor_name: "",
  });

  const loadBatches = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/batches");
      const data = await res.json();
      setBatches(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadBatches();
  }, []);

  const clearForm = () => {
    setForm({
      batch_name: "",
      course_name: "",
      strength: "",
      mentor_name: "",
    });

    setEditId(null);
  };

  const createBatch = async () => {
    await fetch("http://127.0.0.1:8000/batches", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...form,
        strength: Number(form.strength),
      }),
    });

    loadBatches();
    clearForm();
  };

  const updateBatch = async () => {
    await fetch(`http://127.0.0.1:8000/batches/${editId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...form,
        strength: Number(form.strength),
      }),
    });

    loadBatches();
    clearForm();
  };

  const deleteBatch = async (id) => {
    if (!window.confirm("Delete this batch?")) {
      return;
    }

    await fetch(`http://127.0.0.1:8000/batches/${id}`, {
      method: "DELETE",
    });

    loadBatches();
  };

  const editBatch = (batch) => {
    setEditId(batch.id);

    setForm({
      batch_name: batch.batch_name,
      course_name: batch.course_name,
      strength: batch.strength,
      mentor_name: batch.mentor_name,
    });
  };

  const filteredBatches = batches.filter((batch) =>
    batch.batch_name.toLowerCase().includes(search.toLowerCase())
  );

  const totalStrength = batches.reduce((sum, b) => sum + (Number(b.strength) || 0), 0);

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
            <h1 className="page-hero-title">Batch Management</h1>
            <p className="page-hero-subtitle">
              Create batches, assign mentors, and track enrolled strength.
            </p>
          </div>
          <div className="page-hero-stats">
            <div className="page-hero-stat">
              <div className="page-hero-stat-value">{batches.length}</div>
              <div className="page-hero-stat-label">Total Batches</div>
            </div>
            <div className="page-hero-stat">
              <div className="page-hero-stat-value">{totalStrength}</div>
              <div className="page-hero-stat-label">Learners Enrolled</div>
            </div>
          </div>
        </div>

        {/* Create / Update form */}
        <div className="card form-card">
          <h2 className="card-title">{editId ? "✏️ Update Batch" : "➕ Create Batch"}</h2>

          <div className="form-grid">
            <Field label="Batch Name">
              <input
                className="styled-input"
                style={inputStyle}
                placeholder="e.g. GenAI Batch 1"
                value={form.batch_name}
                onChange={(e) => setForm({ ...form, batch_name: e.target.value })}
              />
            </Field>

            <Field label="Course Name">
              <input
                className="styled-input"
                style={inputStyle}
                placeholder="e.g. Generative AI"
                value={form.course_name}
                onChange={(e) => setForm({ ...form, course_name: e.target.value })}
              />
            </Field>

            <Field label="Strength">
              <input
                className="styled-input"
                style={inputStyle}
                placeholder="e.g. 100"
                value={form.strength}
                onChange={(e) => setForm({ ...form, strength: e.target.value })}
              />
            </Field>

            <Field label="Mentor Name">
              <input
                className="styled-input"
                style={inputStyle}
                placeholder="e.g. Krish Naik"
                value={form.mentor_name}
                onChange={(e) => setForm({ ...form, mentor_name: e.target.value })}
              />
            </Field>
          </div>

          <div style={{ marginTop: "22px", display: "flex", gap: "12px" }}>
            {editId ? (
              <>
                <button className="btn btn-primary" onClick={updateBatch}>
                  Update Batch
                </button>
                <button className="btn btn-ghost" onClick={clearForm}>
                  Cancel
                </button>
              </>
            ) : (
              <button className="btn btn-primary" onClick={createBatch}>
                Create Batch
              </button>
            )}
          </div>
        </div>

        {/* Batch list */}
        <div className="card" style={{ marginTop: "24px" }}>
          <div className="list-toolbar">
            <h2 className="card-title" style={{ margin: 0 }}>
              🎓 Batch List
            </h2>

            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search batches..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="styled-input search-input"
              />
            </div>
          </div>

          <div className="table-wrap">
            <table className="styled-table">
              <thead>
                <tr>
                  <th>Batch</th>
                  <th>Course</th>
                  <th>Strength</th>
                  <th>Mentor</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredBatches.map((batch, i) => (
                  <tr key={batch.id} style={{ animationDelay: `${i * 0.03}s` }}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <BatchIcon name={batch.batch_name} />
                        <div>
                          <div className="strong">{batch.batch_name}</div>
                          <div className="muted" style={{ fontSize: "12px" }}>
                            ID #{batch.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {batch.course_name && <span className="tag">{batch.course_name}</span>}
                    </td>
                    <td className="strong">{batch.strength}</td>
                    <td>{batch.mentor_name}</td>
                    <td>
                      <button className="btn btn-icon" onClick={() => editBatch(batch)}>
                        ✏️ Edit
                      </button>
                      <button
                        className="btn btn-icon btn-danger"
                        onClick={() => deleteBatch(batch.id)}
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredBatches.length === 0 && (
              <div className="empty-state">
                <div style={{ fontSize: "32px", marginBottom: "8px" }}>🎓</div>
                {batches.length === 0
                  ? "No batches yet — create your first one above."
                  : "No batches match your search."}
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
          background: #22c55e;
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

        .page-hero-stat-label {
          font-size: 11px;
          color: #94a3b8;
          margin-top: 2px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          white-space: nowrap;
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

        .tag {
          display: inline-block;
          background: #dbeafe;
          color: #1d4ed8;
          font-size: 12px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 999px;
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
