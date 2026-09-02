import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Sidebar from "../../components/Sidebar";
import ProtectedRoute from "../../components/ProtectedRoute";

const API = "http://127.0.0.1:8000";

const STATUS_OPTIONS = ["Draft", "Scheduled", "Live", "Completed", "Cancelled", "Rescheduled"];

const STATUS_STYLES = {
  Draft: { bg: "#f1f5f9", color: "#475569", dot: "#94a3b8" },
  Scheduled: { bg: "#dbeafe", color: "#1d4ed8", dot: "#3b82f6" },
  Live: { bg: "#fef3c7", color: "#b45309", dot: "#f59e0b" },
  Completed: { bg: "#dcfce7", color: "#15803d", dot: "#22c55e" },
  Cancelled: { bg: "#fee2e2", color: "#b91c1c", dot: "#ef4444" },
  Rescheduled: { bg: "#ede9fe", color: "#6d28d9", dot: "#8b5cf6" },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || { bg: "#e2e8f0", color: "#475569", dot: "#94a3b8" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: s.bg, color: s.color, fontSize: "12px", fontWeight: 700, padding: "5px 12px", borderRadius: "999px", whiteSpace: "nowrap" }}>
      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: s.dot }} />
      {status}
    </span>
  );
}

const PAYOUT_STYLES = {
  Pending: { bg: "#fef3c7", color: "#b45309" },
  Approved: { bg: "#dbeafe", color: "#1d4ed8" },
  Processing: { bg: "#dbeafe", color: "#1d4ed8" },
  Paid: { bg: "#dcfce7", color: "#15803d" },
  "On Hold": { bg: "#fee2e2", color: "#b91c1c" },
  Rejected: { bg: "#fee2e2", color: "#b91c1c" },
  "Not Invoiced": { bg: "#f1f5f9", color: "#94a3b8" },
};

function PayoutBadge({ status }) {
  const s = PAYOUT_STYLES[status] || PAYOUT_STYLES["Not Invoiced"];
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: "12px", fontWeight: 700, padding: "4px 10px", borderRadius: "999px", whiteSpace: "nowrap" }}>
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

const fieldLabelStyle = { display: "block", fontSize: "12px", fontWeight: 700, letterSpacing: "0.03em", color: "#64748b", marginBottom: "6px" };

function Field({ label, children }) {
  return (
    <div>
      <label style={fieldLabelStyle}>{label}</label>
      {children}
    </div>
  );
}

function emptyForm() {
  return {
    webinar_title: "",
    mentor_name: "",
    category: "",
    session_date: "",
    session_time: "",
    duration: "",
    platform: "Zoom",
    target_audience: "",
    description: "",
    webinar_status: "Scheduled",
  };
}

export default function WebinarsPage() {
  const [webinars, setWebinars] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [search, setSearch] = useState("");
  const [mentorFilter, setMentorFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const loadWebinars = () => {
    fetch(`${API}/webinars?stats=true`).then((r) => r.json()).then((d) => setWebinars(Array.isArray(d) ? d : [])).catch(() => setWebinars([]));
  };

  useEffect(() => {
    loadWebinars();
    fetch(`${API}/mentors`).then((r) => r.json()).then((d) => setMentors(Array.isArray(d) ? d : [])).catch(() => setMentors([]));
  }, []);

  const resetForm = () => {
    setForm(emptyForm());
    setEditId(null);
    setFormError("");
    setShowForm(false);
  };

  const validate = () => {
    if (!form.webinar_title.trim()) return "Webinar title is required.";
    if (!form.mentor_name) return "Mentor is required.";
    if (!form.session_date) return "Date is required.";
    if (form.duration && Number(form.duration) <= 0) return "Duration must be greater than 0.";
    return "";
  };

  const submitForm = async () => {
    const error = validate();
    if (error) {
      setFormError(error);
      return;
    }
    setFormError("");
    setSaving(true);

    const payload = {
      ...form,
      duration: form.duration ? Number(form.duration) : null,
    };

    try {
      const url = editId ? `${API}/webinars/${editId}` : `${API}/webinars`;
      const method = editId ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success === false) {
        setFormError(data.message);
      } else {
        loadWebinars();
        resetForm();
      }
    } catch (err) {
      setFormError("Unable to reach the server.");
    } finally {
      setSaving(false);
    }
  };

  const editWebinar = async (w) => {
    const res = await fetch(`${API}/webinars/${w.id}`);
    const data = await res.json();
    if (!data.success) return;
    const full = data.webinar;
    setEditId(w.id);
    setForm({
      webinar_title: full.webinar_title || "",
      mentor_name: full.mentor_name || "",
      category: full.category || "",
      session_date: full.session_date || "",
      session_time: full.session_time || "",
      duration: full.duration || "",
      platform: full.platform || "Zoom",
      target_audience: full.target_audience || "",
      description: full.description || "",
      webinar_status: full.webinar_status || "Scheduled",
    });
    setShowForm(true);
  };

  const duplicateWebinar = (w) => {
    setEditId(null);
    setForm({
      webinar_title: `${w.title} (Copy)`,
      mentor_name: w.mentor_name || "",
      category: w.category || "",
      session_date: "",
      session_time: w.session_time || "",
      duration: w.duration || "",
      platform: w.platform || "Zoom",
      target_audience: "",
      description: "",
      webinar_status: "Draft",
    });
    setShowForm(true);
  };

  const patchStatus = async (w, newStatus) => {
    await fetch(`${API}/webinars/${w.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        webinar_title: w.title, mentor_name: w.mentor_name, session_date: w.session_date,
        session_time: w.session_time, duration: w.duration, platform: w.platform,
        category: w.category, webinar_status: newStatus,
      }),
    });
    loadWebinars();
  };

  const markCompleted = (id) => {
    const w = webinars.find((x) => x.id === id);
    if (w) patchStatus(w, "Completed");
  };

  const cancelWebinar = (id) => {
    if (!window.confirm("Cancel this webinar?")) return;
    const w = webinars.find((x) => x.id === id);
    if (w) patchStatus(w, "Cancelled");
  };

  const deleteWebinar = async (id) => {
    if (!window.confirm("Delete this webinar? This only works if it has no participant records.")) return;
    const res = await fetch(`${API}/webinars/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success === false) alert(data.message);
    loadWebinars();
  };

  const categories = useMemo(() => [...new Set(webinars.map((w) => w.category).filter(Boolean))], [webinars]);

  const filtered = webinars.filter((w) => {
    const matchesSearch =
      !search ||
      (w.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (w.mentor_name || "").toLowerCase().includes(search.toLowerCase());
    const matchesMentor = mentorFilter === "All" || w.mentor_name === mentorFilter;
    const matchesStatus = statusFilter === "All" || w.status === statusFilter;
    const matchesCategory = categoryFilter === "All" || w.category === categoryFilter;
    return matchesSearch && matchesMentor && matchesStatus && matchesCategory;
  });

  return (
    <ProtectedRoute>
      <>
        <Sidebar />

        <div style={{ marginLeft: "280px", padding: "32px 36px 60px", background: "#f1f5f9", minHeight: "100vh" }}>
          <div className="page-hero">
            <div className="page-hero-blob" />
            <div className="page-hero-content">
              <div className="page-hero-eyebrow">Webinars</div>
              <h1 className="page-hero-title">Webinar Scheduler</h1>
              <p className="page-hero-subtitle">Plan, schedule, and track every webinar from one place.</p>
            </div>
            <div className="page-hero-stat">
              <div className="page-hero-stat-value">{webinars.length}</div>
              <div className="page-hero-stat-label">Total Webinars</div>
            </div>
          </div>

          <div className="card form-card">
            <div className="list-toolbar" style={{ marginBottom: showForm ? 18 : 0 }}>
              <h2 className="card-title" style={{ margin: 0 }}>{editId ? "✏️ Update Webinar" : "➕ Schedule Webinar"}</h2>
              <button className="btn btn-ghost" onClick={() => (showForm ? resetForm() : setShowForm(true))}>
                {showForm ? "Collapse" : "+ New Webinar"}
              </button>
            </div>

            {showForm && (
              <>
                <div className="form-grid">
                  <Field label="Webinar Title">
                    <input style={inputStyle} placeholder="e.g. Intro to RAG Systems" value={form.webinar_title} onChange={(e) => setForm({ ...form, webinar_title: e.target.value })} />
                  </Field>
                  <Field label="Mentor">
                    <select style={inputStyle} value={form.mentor_name} onChange={(e) => setForm({ ...form, mentor_name: e.target.value })}>
                      <option value="">Select Mentor</option>
                      {mentors.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Category / Topic">
                    <input style={inputStyle} placeholder="e.g. GenAI" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                  </Field>
                  <Field label="Date">
                    <input type="date" style={inputStyle} value={form.session_date} onChange={(e) => setForm({ ...form, session_date: e.target.value })} />
                  </Field>
                  <Field label="Time">
                    <input type="time" style={inputStyle} value={form.session_time} onChange={(e) => setForm({ ...form, session_time: e.target.value })} />
                  </Field>
                  <Field label="Duration (minutes)">
                    <input type="number" min="1" style={inputStyle} value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
                  </Field>
                  <Field label="Platform">
                    <select style={inputStyle} value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}>
                      <option value="Zoom">Zoom</option>
                      <option value="Google Meet">Google Meet</option>
                      <option value="YouTube Live">YouTube Live</option>
                    </select>
                  </Field>
                  <Field label="Target Audience">
                    <input style={inputStyle} placeholder="e.g. Aspiring Data Scientists" value={form.target_audience} onChange={(e) => setForm({ ...form, target_audience: e.target.value })} />
                  </Field>
                  <Field label="Status">
                    <select style={inputStyle} value={form.webinar_status} onChange={(e) => setForm({ ...form, webinar_status: e.target.value })}>
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </Field>
                </div>

                <div style={{ marginTop: "18px" }}>
                  <Field label="Description">
                    <textarea rows="2" style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  </Field>
                </div>

                {formError && <div className="form-error">{formError}</div>}

                <div style={{ marginTop: "20px", display: "flex", gap: "12px" }}>
                  <button className="btn btn-primary" onClick={submitForm} disabled={saving}>
                    {saving ? "Saving..." : editId ? "Update Webinar" : "Create Webinar"}
                  </button>
                  <button className="btn btn-ghost" onClick={resetForm}>Cancel</button>
                </div>
              </>
            )}
          </div>

          <div className="card" style={{ marginTop: "24px" }}>
            <div className="list-toolbar">
              <h2 className="card-title" style={{ margin: 0 }}>📋 Webinar List</h2>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                <input type="text" placeholder="Search webinars..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...inputStyle, width: "200px" }} />
                <select style={{ ...inputStyle, width: "160px" }} value={mentorFilter} onChange={(e) => setMentorFilter(e.target.value)}>
                  <option value="All">All Mentors</option>
                  {mentors.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
                </select>
                <select style={{ ...inputStyle, width: "150px" }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="All">All Status</option>
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <select style={{ ...inputStyle, width: "150px" }} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                  <option value="All">All Categories</option>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="table-wrap">
              <table className="styled-table" style={{ minWidth: "1200px" }}>
                <thead>
                  <tr>
                    {["Webinar", "Date", "Mentor", "Status", "Registered", "Attended", "Attendance %", "Rating", "Leads", "Payout", "Actions"].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((w) => (
                    <tr key={w.id}>
                      <td className="strong"><Link href={`/webinars/${w.id}`}>{w.title}</Link></td>
                      <td className="muted">{w.session_date}{w.session_time ? ` · ${w.session_time}` : ""}</td>
                      <td>{w.mentor_name}</td>
                      <td><StatusBadge status={w.status} /></td>
                      <td>{w.registered}</td>
                      <td>{w.attended}</td>
                      <td>{w.attendance_percentage}%</td>
                      <td>{w.rating ? `${w.rating} / 5` : "—"}</td>
                      <td>{w.leads}{w.converted > 0 ? ` (${w.converted} won)` : ""}</td>
                      <td><PayoutBadge status={w.payout_status} /></td>
                      <td className="actions-cell">
                        <Link href={`/webinars/${w.id}`}><button className="btn btn-icon">👁 View</button></Link>
                        <button className="btn btn-icon" onClick={() => editWebinar(w)}>✏️ Edit</button>
                        <button className="btn btn-icon" onClick={() => duplicateWebinar(w)}>⧉ Duplicate</button>
                        {w.status !== "Completed" && w.status !== "Cancelled" && (
                          <button className="btn btn-icon" onClick={() => markCompleted(w.id)}>✅ Complete</button>
                        )}
                        {w.status !== "Cancelled" && (
                          <button className="btn btn-icon btn-danger" onClick={() => cancelWebinar(w.id)}>✕ Cancel</button>
                        )}
                        <button className="btn btn-icon btn-danger" onClick={() => deleteWebinar(w.id)}>🗑️ Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filtered.length === 0 && (
                <div className="empty-state">
                  <div style={{ fontSize: "32px", marginBottom: "8px" }}>🎥</div>
                  {webinars.length === 0 ? "No webinars yet — schedule your first one above." : "No webinars match your filters."}
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
          .page-hero-blob { position: absolute; width: 220px; height: 220px; border-radius: 50%; background: #8b5cf6; filter: blur(60px); opacity: 0.3; top: -80px; right: 160px; animation: float 9s ease-in-out infinite; }
          .page-hero-content { position: relative; z-index: 1; }
          .page-hero-eyebrow { display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #fbbf24; background: rgba(251, 191, 36, 0.12); border: 1px solid rgba(251, 191, 36, 0.3); padding: 5px 10px; border-radius: 999px; margin-bottom: 10px; }
          .page-hero-title { font-size: 26px; font-weight: 800; color: #f8fafc; margin: 0 0 6px; }
          .page-hero-subtitle { color: #94a3b8; font-size: 14px; margin: 0; }
          .page-hero-stat { position: relative; z-index: 1; text-align: center; padding: 14px 26px; border-radius: 14px; background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.1); flex-shrink: 0; }
          .page-hero-stat-value { font-size: 26px; font-weight: 800; color: #fbbf24; }
          .page-hero-stat-label { font-size: 11px; color: #94a3b8; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.04em; }

          .card { background: #ffffff; border-radius: 16px; padding: 26px 28px; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06); border: 1px solid #eef2f7; }
          .card-title { margin: 0 0 18px; font-size: 17px; color: #1e293b; }

          .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 18px; }

          .form-error { background: #fee2e2; color: #991b1b; padding: 10px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; margin-top: 16px; }

          .btn { border: none; border-radius: 10px; padding: 10px 16px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s ease; }
          .btn:disabled { cursor: not-allowed; opacity: 0.6; }
          .btn-primary { background: linear-gradient(120deg, #f59e0b, #fbbf24); color: #0f172a; box-shadow: 0 6px 16px -6px rgba(245, 158, 11, 0.6); }
          .btn-primary:hover { transform: translateY(-1px); }
          .btn-ghost { background: #f1f5f9; color: #475569; }
          .btn-ghost:hover { background: #e2e8f0; }

          .list-toolbar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px; }

          .table-wrap { overflow-x: auto; margin-top: 4px; }
          .styled-table { width: 100%; border-collapse: collapse; font-size: 14px; }
          .styled-table thead th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: #94a3b8; font-weight: 700; padding: 10px 14px; border-bottom: 2px solid #f1f5f9; white-space: nowrap; }
          .styled-table td { padding: 12px 14px; border-bottom: 1px solid #f1f5f9; color: #1e293b; white-space: nowrap; }
          .styled-table td.muted { color: #94a3b8; }
          .styled-table td.strong { font-weight: 600; }
          .styled-table td a { color: #0f172a; text-decoration: none; }
          .styled-table td a:hover { text-decoration: underline; }
          .actions-cell { display: flex; gap: 4px; flex-wrap: nowrap; }
          .btn-icon { background: transparent; padding: 6px 8px; font-size: 12px; color: #475569; }
          .btn-icon:hover { background: #f1f5f9; }
          .btn-danger:hover { background: #fee2e2; color: #b91c1c; }

          .empty-state { text-align: center; padding: 50px 20px; color: #94a3b8; font-size: 14px; }

          @keyframes heroShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
          @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(16px); } }
        `}</style>
      </>
    </ProtectedRoute>
  );
}
