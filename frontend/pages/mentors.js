import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";

const AVATAR_COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b", "#22c55e", "#ec4899", "#06b6d4"];

function avatarColor(name) {
  if (!name) return AVATAR_COLORS[0];
  const code = name.charCodeAt(0) + (name.charCodeAt(1) || 0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

function initials(name) {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

function Avatar({ name }) {
  return (
    <div
      style={{
        width: "36px",
        height: "36px",
        borderRadius: "50%",
        background: `${avatarColor(name)}22`,
        color: avatarColor(name),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "13px",
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {initials(name)}
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

export default function Mentors() {
  const [mentors, setMentors] = useState([]);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    expertise: "",
    linkedin: "",
    hourly_rate: "",
  });

  const loadMentors = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/mentors");
      const data = await res.json();
      setMentors(data);
    } catch (error) {
      console.error("Error loading mentors:", error);
    }
  };

  useEffect(() => {
    loadMentors();
  }, []);

  const clearForm = () => {
    setForm({
      name: "",
      email: "",
      phone: "",
      expertise: "",
      linkedin: "",
      hourly_rate: "",
    });

    setEditId(null);
  };

  const createMentor = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/mentors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error(data);
        alert("Failed to create mentor");
        return;
      }

      await loadMentors();
      clearForm();
    } catch (error) {
      console.error("Error creating mentor:", error);
    }
  };

  const updateMentor = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/mentors/${editId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error(data);
        alert("Failed to update mentor");
        return;
      }

      await loadMentors();
      clearForm();
    } catch (error) {
      console.error("Error updating mentor:", error);
    }
  };

  const deleteMentor = async (id) => {
    if (!window.confirm("Are you sure you want to delete this mentor?")) {
      return;
    }

    try {
      await fetch(`http://127.0.0.1:8000/mentors/${id}`, {
        method: "DELETE",
      });

      loadMentors();
    } catch (error) {
      console.error("Error deleting mentor:", error);
    }
  };

  const editMentor = (mentor) => {
    setEditId(mentor.id);

    setForm({
      name: mentor.name || "",
      email: mentor.email || "",
      phone: mentor.phone || "",
      expertise: mentor.expertise || "",
      linkedin: mentor.linkedin || "",
      hourly_rate: mentor.hourly_rate || "",
    });
  };

  const filteredMentors = mentors.filter(
    (mentor) =>
      mentor.name?.toLowerCase().includes(search.toLowerCase()) ||
      mentor.email?.toLowerCase().includes(search.toLowerCase()) ||
      mentor.expertise?.toLowerCase().includes(search.toLowerCase())
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
            <h1 className="page-hero-title">Mentor Management</h1>
            <p className="page-hero-subtitle">
              Onboard mentors, keep their contact details current, and manage rates.
            </p>
          </div>
          <div className="page-hero-stat">
            <div className="page-hero-stat-value">{mentors.length}</div>
            <div className="page-hero-stat-label">Total Mentors</div>
          </div>
        </div>

        {/* Create / Update form */}
        <div className="card form-card">
          <h2 className="card-title">{editId ? "✏️ Update Mentor" : "➕ Add Mentor"}</h2>

          <div className="form-grid">
            <Field label="Name">
              <input
                className="styled-input"
                style={inputStyle}
                placeholder="e.g. Krish Naik"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>

            <Field label="Email">
              <input
                className="styled-input"
                style={inputStyle}
                placeholder="mentor@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>

            <Field label="Phone">
              <input
                className="styled-input"
                style={inputStyle}
                placeholder="+91 90000 00000"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </Field>

            <Field label="Expertise">
              <input
                className="styled-input"
                style={inputStyle}
                placeholder="e.g. GenAI, MLOps"
                value={form.expertise}
                onChange={(e) => setForm({ ...form, expertise: e.target.value })}
              />
            </Field>

            <Field label="LinkedIn">
              <input
                className="styled-input"
                style={inputStyle}
                placeholder="linkedin.com/in/..."
                value={form.linkedin}
                onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
              />
            </Field>

            <Field label="Hourly Rate">
              <input
                type="text"
                className="styled-input"
                style={inputStyle}
                placeholder="e.g. 2000"
                value={form.hourly_rate}
                onChange={(e) => setForm({ ...form, hourly_rate: e.target.value })}
              />
            </Field>
          </div>

          <div style={{ marginTop: "22px", display: "flex", gap: "12px" }}>
            {editId ? (
              <>
                <button className="btn btn-primary" onClick={updateMentor}>
                  Update Mentor
                </button>
                <button className="btn btn-ghost" onClick={clearForm}>
                  Cancel
                </button>
              </>
            ) : (
              <button className="btn btn-primary" onClick={createMentor}>
                Create Mentor
              </button>
            )}
          </div>
        </div>

        {/* Mentor list */}
        <div className="card" style={{ marginTop: "24px" }}>
          <div className="list-toolbar">
            <h2 className="card-title" style={{ margin: 0 }}>
              👨‍🏫 Mentor List
            </h2>

            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search mentors..."
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
                  <th>Mentor</th>
                  <th>Email</th>
                  <th>Expertise</th>
                  <th>Hourly Rate</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredMentors.map((mentor, i) => (
                  <tr key={mentor.id} style={{ animationDelay: `${i * 0.03}s` }}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <Avatar name={mentor.name} />
                        <div>
                          <div className="strong">{mentor.name}</div>
                          <div className="muted" style={{ fontSize: "12px" }}>
                            ID #{mentor.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>{mentor.email}</td>
                    <td>
                      {mentor.expertise && (
                        <span className="tag">{mentor.expertise}</span>
                      )}
                    </td>
                    <td className="strong">
                      {mentor.hourly_rate ? `₹${mentor.hourly_rate}/hr` : "—"}
                    </td>
                    <td>
                      <button className="btn btn-icon" onClick={() => editMentor(mentor)}>
                        ✏️ Edit
                      </button>
                      <button
                        className="btn btn-icon btn-danger"
                        onClick={() => deleteMentor(mentor.id)}
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredMentors.length === 0 && (
              <div className="empty-state">
                <div style={{ fontSize: "32px", marginBottom: "8px" }}>👨‍🏫</div>
                {mentors.length === 0
                  ? "No mentors yet — add your first one above."
                  : "No mentors match your search."}
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
          background: #8b5cf6;
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
          background: #ede9fe;
          color: #6d28d9;
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
