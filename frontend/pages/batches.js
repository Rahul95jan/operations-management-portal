import { useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "../components/Sidebar";
import ProtectedRoute from "../components/ProtectedRoute";

const API = "http://127.0.0.1:8000";

// Small hand-drawn icon set (no external icon library, no new dependency) —
// consistent flat line icons instead of emoji, which render inconsistently
// across OS/browsers.
const ICON_PATHS = {
  layers: (
    <>
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </>
  ),
  users: (
    <>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  checkCircle: (
    <>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </>
  ),
  alertTriangle: (
    <>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </>
  ),
  chevronDown: <polyline points="6 9 12 15 18 9" />,
  filter: <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />,
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </>
  ),
  refreshCcw: (
    <>
      <polyline points="1 4 1 10 7 10" />
      <polyline points="23 20 23 14 17 14" />
      <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
    </>
  ),
  download: (
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </>
  ),
  table: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9" y1="3" x2="9" y2="21" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </>
  ),
  eye: (
    <>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  edit: (
    <>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </>
  ),
  power: (
    <>
      <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
      <line x1="12" y1="2" x2="12" y2="12" />
    </>
  ),
  trash: (
    <>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </>
  ),
  x: (
    <>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </>
  ),
  logout: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </>
  ),
  graduation: (
    <>
      <path d="M22 10 12 5 2 10l10 5 10-5z" />
      <path d="M6 12.5V17c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5" />
    </>
  ),
  plus: (
    <>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </>
  ),
};

function Icon({ name, size = 16, color = "currentColor", strokeWidth = 2 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block" }}
    >
      {ICON_PATHS[name]}
    </svg>
  );
}

function DotsIcon({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>
      <circle cx="12" cy="5" r="1.6" fill={color} />
      <circle cx="12" cy="12" r="1.6" fill={color} />
      <circle cx="12" cy="19" r="1.6" fill={color} />
    </svg>
  );
}

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

function mentorPhotoUrl(mentor) {
  if (!mentor || !mentor.photo_path) return null;
  return `${API}/mentors/${mentor.id}/photo?v=${encodeURIComponent(mentor.photo_path)}`;
}

// Shows the mentor's real photo from Mentor Management when one is on file
// (looked up live by name every render, so it always reflects whatever is
// currently set there), falling back to initials otherwise.
function Avatar({ mentor, name, size = 32 }) {
  const resolvedName = mentor?.name || name;
  const url = mentorPhotoUrl(mentor);
  const [broken, setBroken] = useState(false);

  if (url && !broken) {
    return (
      <img
        src={url}
        alt={resolvedName}
        onError={() => setBroken(true)}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          objectPosition: "center 22%",
          flexShrink: 0,
          border: "2px solid #ffffff",
          boxShadow: "0 0 0 1px #e2e8f0, 0 1px 3px rgba(15, 23, 42, 0.08)",
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: resolvedName ? `${avatarColor(resolvedName)}22` : "#e2e8f0",
        color: resolvedName ? avatarColor(resolvedName) : "#94a3b8",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size <= 32 ? "12px" : "20px",
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {initials(resolvedName)}
    </div>
  );
}

function StatusBadge({ status }) {
  const isInactive = status === "Inactive";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        background: isInactive ? "#f1f5f9" : "#dcfce7",
        color: isInactive ? "#64748b" : "#15803d",
        fontSize: "12px",
        fontWeight: 700,
        padding: "5px 12px",
        borderRadius: "999px",
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: isInactive ? "#94a3b8" : "#22c55e",
        }}
      />
      {isInactive ? "Inactive" : "Active"}
    </span>
  );
}

const HEALTH_STYLES = {
  Healthy: { color: "#15803d", dot: "#22c55e" },
  "At Risk": { color: "#b91c1c", dot: "#ef4444" },
  "Not Enough Data": { color: "#64748b", dot: "#94a3b8" },
};

function HealthBadge({ health }) {
  const s = HEALTH_STYLES[health] || HEALTH_STYLES["Not Enough Data"];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, color: s.color }}>
      <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
      {health}
    </span>
  );
}

function ProgressBar({ pct, color }) {
  if (pct === null) {
    return <div className="progress-track"><div className="progress-fill" style={{ width: "0%", background: "#e2e8f0" }} /></div>;
  }
  return (
    <div className="progress-track">
      <div className="progress-fill" style={{ width: `${Math.min(100, Math.max(0, pct))}%`, background: color }} />
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

function Field({ label, required, children, error }) {
  return (
    <div>
      <label style={fieldLabelStyle}>
        {label}
        {required && <span style={{ color: "#ef4444" }}> *</span>}
      </label>
      {children}
      {error && <div className="field-error">{error}</div>}
    </div>
  );
}

const EMPTY_FORM = { batch_name: "", course_name: "", strength: "", mentor_name: "" };
const ROWS_PER_PAGE = 5;

function sessionDateTimeMs(session) {
  if (!session.session_date) return null;
  const time = session.session_time || "00:00";
  const dt = new Date(`${session.session_date}T${time}`);
  return isNaN(dt.getTime()) ? null : dt.getTime();
}

function formatNextSession(session) {
  if (!session || !session.session_date) return "Not Scheduled";
  const dt = new Date(`${session.session_date}T${session.session_time || "00:00"}`);
  if (isNaN(dt.getTime())) return "Not Scheduled";
  const dateStr = dt.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
  const timeStr = dt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${dateStr} ${timeStr}`;
}

function Toast({ toast, onClose }) {
  if (!toast) return null;
  const isError = toast.type === "error";
  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        zIndex: 999,
        background: isError ? "#fee2e2" : "#dcfce7",
        color: isError ? "#b91c1c" : "#15803d",
        border: `1px solid ${isError ? "#fecaca" : "#bbf7d0"}`,
        padding: "12px 18px",
        borderRadius: "10px",
        fontSize: "14px",
        fontWeight: 600,
        boxShadow: "0 12px 24px -12px rgba(15,23,42,0.35)",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        maxWidth: "380px",
      }}
    >
      <span>{isError ? "⚠️" : "✅"} {toast.message}</span>
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontWeight: 700 }}>✕</button>
    </div>
  );
}

export default function Batches() {
  const [batches, setBatches] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(true);
  const [toast, setToast] = useState(null);

  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [mentorFilter, setMentorFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [healthFilter, setHealthFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dateRangeOpen, setDateRangeOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState("table");

  const [openMenuId, setOpenMenuId] = useState(null);
  const [viewBatch, setViewBatch] = useState(null);

  const dateRangeRef = useRef(null);

  const showToast = (message, type = "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const friendlyError = async (res, fallback) => {
    try {
      const data = await res.json();
      return data.detail || data.message || fallback;
    } catch {
      return fallback;
    }
  };

  const loadBatches = async () => {
    setLoadingBatches(true);
    try {
      const res = await fetch(`${API}/batches`);
      if (!res.ok) throw new Error("bad status");
      const data = await res.json();
      setBatches(data);
    } catch (err) {
      showToast("Failed to load batches. Please refresh and try again.");
    } finally {
      setLoadingBatches(false);
    }
  };

  const loadSessions = async () => {
    try {
      const res = await fetch(`${API}/sessions`);
      const data = await res.json();
      setSessions(Array.isArray(data) ? data : []);
    } catch (err) {
      // Non-fatal — attendance/completion/health just fall back to "no data".
    }
  };

  const loadMentors = async () => {
    try {
      const res = await fetch(`${API}/mentors`);
      const data = await res.json();
      setMentors(Array.isArray(data) ? data : []);
    } catch (err) {
      // Non-fatal — the mentor dropdown just stays empty.
    }
  };

  useEffect(() => {
    loadBatches();
    loadSessions();
    loadMentors();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, courseFilter, mentorFilter, statusFilter, healthFilter, dateFrom, dateTo]);

  // ---- Real per-batch metrics, derived entirely from existing Session
  // records (registered_students / attendance_percentage / assignment
  // fields already collected via Sessions & Log Webinar Report) — nothing
  // here is invented or hard-coded. ----
  const batchStats = useMemo(() => {
    const stats = {};
    batches.forEach((b) => {
      const batchSessions = b.batch_name ? sessions.filter((s) => s.batch_name === b.batch_name) : [];
      const withRegistrations = batchSessions.filter((s) => Number(s.registered_students) > 0);

      const learners = withRegistrations.length
        ? Math.max(...withRegistrations.map((s) => Number(s.registered_students) || 0))
        : 0;

      const avgAttendance = withRegistrations.length
        ? withRegistrations.reduce((sum, s) => sum + (Number(s.attendance_percentage) || 0), 0) / withRegistrations.length
        : null;

      const completionSessions = withRegistrations.filter((s) => s.assignment_given);
      const avgCompletion = completionSessions.length
        ? completionSessions.reduce((sum, s) => sum + ((Number(s.assignment_completed) || 0) / Number(s.registered_students)) * 100, 0) / completionSessions.length
        : null;

      const hasData = withRegistrations.length > 0;
      const health = !hasData ? "Not Enough Data" : avgAttendance >= 75 ? "Healthy" : "At Risk";

      const nowMs = Date.now();
      const upcoming = batchSessions
        .filter((s) => s.status === "Scheduled")
        .map((s) => ({ s, dt: sessionDateTimeMs(s) }))
        .filter((x) => x.dt && x.dt > nowMs)
        .sort((a, b2) => a.dt - b2.dt);
      const nextSession = upcoming.length ? upcoming[0].s : null;
      const started = batchSessions.some((s) => {
        const dt = sessionDateTimeMs(s);
        return dt && dt <= nowMs;
      });

      stats[b.id] = { learners, avgAttendance, avgCompletion, health, nextSession, started, sessionCount: batchSessions.length };
    });
    return stats;
  }, [batches, sessions]);

  const statsFor = (batch) => batchStats[batch?.id] || { learners: 0, avgAttendance: null, avgCompletion: null, health: "Not Enough Data", nextSession: null, started: false, sessionCount: 0 };

  const totalBatches = batches.length;
  const totalLearners = batches.reduce((sum, b) => sum + statsFor(b).learners, 0);
  const activeBatches = batches.filter((b) => b.status !== "Inactive").length;
  const upcomingBatches = batches.filter((b) => b.status !== "Inactive" && !statsFor(b).started && statsFor(b).nextSession).length;
  const atRiskBatches = batches.filter((b) => statsFor(b).health === "At Risk").length;

  const courseOptions = useMemo(() => [...new Set(batches.map((b) => b.course_name).filter(Boolean))].sort(), [batches]);
  const mentorOptions = useMemo(() => [...new Set(batches.map((b) => b.mentor_name).filter(Boolean))].sort(), [batches]);

  // Create/Edit form's Mentor dropdown draws from the real Mentor Management
  // list (not free text) so batches always reference an actual mentor
  // record. Only Active mentors are offered for new assignments, but a
  // batch already assigned to a since-deactivated mentor keeps showing them
  // so the existing assignment isn't silently dropped — same pattern as the
  // Sessions page's mentor dropdown.
  const assignableMentors = useMemo(() => {
    const active = mentors.filter((m) => m.status !== "Inactive");
    if (form.mentor_name && !active.some((m) => m.name === form.mentor_name)) {
      const current = mentors.find((m) => m.name === form.mentor_name);
      if (current) return [...active, current];
    }
    return active;
  }, [mentors, form.mentor_name]);

  // Looks up the current Mentor Management record for a batch's assigned
  // mentor name, so the Batch List always shows whatever photo/details are
  // currently set there — never a stale snapshot.
  const mentorByName = (name) => mentors.find((m) => m.name === name);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setFormErrors({});
    setEditId(null);
  };

  const validate = () => {
    const errors = {};
    if (!form.batch_name.trim()) errors.batch_name = "Batch name is required.";
    if (!form.course_name.trim()) errors.course_name = "Course name is required.";
    if (form.strength && (isNaN(Number(form.strength)) || Number(form.strength) < 0)) {
      errors.strength = "Strength must be a non-negative number.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const createBatch = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/batches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, strength: Number(form.strength) || 0, status: "Active" }),
      });
      if (!res.ok) {
        showToast(await friendlyError(res, "Failed to create batch. Please try again."));
        return;
      }
      showToast("Batch created successfully.", "success");
      await loadBatches();
      resetForm();
    } catch (err) {
      showToast("Failed to create batch. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const updateBatch = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const current = batches.find((b) => b.id === editId);
      const res = await fetch(`${API}/batches/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, strength: Number(form.strength) || 0, status: current?.status || "Active" }),
      });
      if (!res.ok) {
        showToast(await friendlyError(res, "Failed to update batch. Please try again."));
        return;
      }
      showToast("Batch updated successfully.", "success");
      await loadBatches();
      resetForm();
    } catch (err) {
      showToast("Failed to update batch. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const editBatch = (batch) => {
    setEditId(batch.id);
    setForm({
      batch_name: batch.batch_name || "",
      course_name: batch.course_name || "",
      strength: batch.strength ?? "",
      mentor_name: batch.mentor_name || "",
    });
    setFormErrors({});
    setOpenMenuId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const setBatchStatus = async (batch, nextStatus) => {
    setOpenMenuId(null);
    if (nextStatus === "Inactive") {
      const stat = statsFor(batch);
      const warn = stat.sessionCount > 0
        ? `${batch.batch_name || "This batch"} has ${stat.sessionCount} session${stat.sessionCount === 1 ? "" : "s"} on record. Deactivating keeps all history intact. Continue?`
        : `Deactivate ${batch.batch_name || "this batch"}?`;
      if (!window.confirm(warn)) return;
    }
    try {
      const res = await fetch(`${API}/batches/${batch.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batch_name: batch.batch_name || "",
          course_name: batch.course_name || "",
          strength: batch.strength || 0,
          mentor_name: batch.mentor_name || "",
          status: nextStatus,
        }),
      });
      if (!res.ok) {
        showToast(await friendlyError(res, "Failed to update batch status."));
        return;
      }
      showToast(nextStatus === "Inactive" ? "Batch deactivated successfully." : "Batch activated successfully.", "success");
      await loadBatches();
      if (viewBatch?.id === batch.id) setViewBatch({ ...batch, status: nextStatus });
    } catch (err) {
      showToast("Failed to update batch status.");
    }
  };

  const deleteBatch = async (batch) => {
    setOpenMenuId(null);
    const stat = statsFor(batch);
    const warning = stat.sessionCount > 0
      ? `${batch.batch_name || "This batch"} has ${stat.sessionCount} session${stat.sessionCount === 1 ? "" : "s"} on record. Deleting removes the batch permanently. Consider deactivating instead. Delete anyway?`
      : `Delete ${batch.batch_name || "this batch"}? This cannot be undone.`;
    if (!window.confirm(warning)) return;

    try {
      const res = await fetch(`${API}/batches/${batch.id}`, { method: "DELETE" });
      if (!res.ok) {
        showToast(await friendlyError(res, "Failed to delete batch."));
        return;
      }
      showToast("Batch deleted.", "success");
      if (editId === batch.id) resetForm();
      if (viewBatch?.id === batch.id) setViewBatch(null);
      await loadBatches();
    } catch (err) {
      showToast("Failed to delete batch.");
    }
  };

  const resetFilters = () => {
    setSearch("");
    setCourseFilter("");
    setMentorFilter("");
    setStatusFilter("");
    setHealthFilter("");
    setDateFrom("");
    setDateTo("");
    setDateRangeOpen(false);
  };

  const hasActiveFilters = search || courseFilter || mentorFilter || statusFilter || healthFilter || dateFrom || dateTo;

  const filteredBatches = useMemo(() => {
    const q = search.toLowerCase();
    return batches.filter((batch) => {
      const matchesSearch =
        !q ||
        (batch.batch_name || "").toLowerCase().includes(q) ||
        (batch.course_name || "").toLowerCase().includes(q) ||
        (batch.mentor_name || "").toLowerCase().includes(q);
      if (!matchesSearch) return false;

      if (courseFilter && batch.course_name !== courseFilter) return false;
      if (mentorFilter && batch.mentor_name !== mentorFilter) return false;
      if (statusFilter) {
        const status = batch.status === "Inactive" ? "Inactive" : "Active";
        if (status !== statusFilter) return false;
      }
      if (healthFilter && statsFor(batch).health !== healthFilter) return false;

      if (dateFrom || dateTo) {
        const next = statsFor(batch).nextSession;
        if (!next || !next.session_date) return false;
        if (dateFrom && next.session_date < dateFrom) return false;
        if (dateTo && next.session_date > dateTo) return false;
      }

      return true;
    });
  }, [batches, search, courseFilter, mentorFilter, statusFilter, healthFilter, dateFrom, dateTo, batchStats]);

  const totalPages = Math.max(1, Math.ceil(filteredBatches.length / ROWS_PER_PAGE));
  const pagedBatches = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    return filteredBatches.slice(start, start + ROWS_PER_PAGE);
  }, [filteredBatches, currentPage]);

  const pageNumbers = useMemo(() => {
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
      (p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1
    );
    const withEllipses = [];
    pages.forEach((p, idx) => {
      if (idx > 0 && p - pages[idx - 1] > 1) withEllipses.push(`ellipsis-${p}`);
      withEllipses.push(p);
    });
    return withEllipses;
  }, [totalPages, currentPage]);

  return (
    <ProtectedRoute permission={["batches", "view"]}>
      <Sidebar />

      <div
        style={{ marginLeft: "var(--om-sidebar-width, 280px)", transition: "margin-left 0.25s ease", padding: "32px 36px 60px", background: "#f1f5f9", minHeight: "100vh" }}
        onClick={() => {
          if (openMenuId) setOpenMenuId(null);
          if (dateRangeOpen) setDateRangeOpen(false);
        }}
      >
        {/* Header */}
        <div className="page-hero">
          <div className="page-hero-blob" />
          <div className="page-hero-content">
            <h1 className="page-hero-title">Batch Management</h1>
            <p className="page-hero-subtitle">
              Create batches, assign mentors, track progress and ensure learner success.
            </p>
          </div>

          <div className="page-hero-right">
            <div className="page-hero-quote">
              “ Better Batches<br />Build Brighter Careers ”
            </div>
            <div className="page-hero-stats">
              <div className="page-hero-stat">
                <Icon name="graduation" size={20} color="#fbbf24" />
                <div className="page-hero-stat-value">{totalBatches}</div>
                <div className="page-hero-stat-label">Total Batches</div>
              </div>
              <div className="page-hero-stat">
                <Icon name="users" size={20} color="#fbbf24" />
                <div className="page-hero-stat-value">{totalLearners}</div>
                <div className="page-hero-stat-label">Learners Enrolled</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stat summary row */}
        <div className="stat-row">
          <div className="stat-card" style={{ background: "#eff6ff" }}>
            <div className="stat-card-icon" style={{ background: "#dbeafe", color: "#1d4ed8" }}><Icon name="layers" size={18} /></div>
            <div className="stat-card-value">{totalBatches}</div>
            <div className="stat-card-label">Total Batches</div>
          </div>
          <div className="stat-card" style={{ background: "#f0fdf4" }}>
            <div className="stat-card-icon" style={{ background: "#dcfce7", color: "#15803d" }}><Icon name="users" size={18} /></div>
            <div className="stat-card-value">{totalLearners}</div>
            <div className="stat-card-label">Total Learners</div>
          </div>
          <div className="stat-card" style={{ background: "#f0fdf4" }}>
            <div className="stat-card-icon" style={{ background: "#dcfce7", color: "#15803d" }}><Icon name="checkCircle" size={18} /></div>
            <div className="stat-card-value">{activeBatches}</div>
            <div className="stat-card-label">Active Batches</div>
          </div>
          <div className="stat-card" style={{ background: "#fffbeb" }}>
            <div className="stat-card-icon" style={{ background: "#fef3c7", color: "#b45309" }}><Icon name="clock" size={18} /></div>
            <div className="stat-card-value">{upcomingBatches}</div>
            <div className="stat-card-label">Upcoming Batches</div>
          </div>
          <div className="stat-card" style={{ background: "#fef2f2" }}>
            <div className="stat-card-icon" style={{ background: "#fee2e2", color: "#b91c1c" }}><Icon name="alertTriangle" size={18} /></div>
            <div className="stat-card-value">{atRiskBatches}</div>
            <div className="stat-card-label">At Risk Batches</div>
          </div>
        </div>

        {/* Create / Update form — fields unchanged from the existing Batch Management flow */}
        <div className="card form-card">
          <h2 className="card-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="icon-badge"><Icon name="plus" size={14} color="#ffffff" /></span> {editId ? "Update Batch" : "Create New Batch"}
          </h2>
          <p className="hint-text" style={{ marginTop: "-12px", marginBottom: "18px" }}>
            {editId ? "Update the details for this batch." : "Add a new batch with course, mentor and strength details."}
          </p>

          <div className="form-grid">
            <Field label="Batch Name" required error={formErrors.batch_name}>
              <input
                className="styled-input"
                style={inputStyle}
                placeholder="e.g. GenAI Batch 1"
                value={form.batch_name}
                onChange={(e) => setForm({ ...form, batch_name: e.target.value })}
              />
            </Field>

            <Field label="Course Name" required error={formErrors.course_name}>
              <input
                className="styled-input"
                style={inputStyle}
                placeholder="e.g. Generative AI"
                value={form.course_name}
                onChange={(e) => setForm({ ...form, course_name: e.target.value })}
              />
            </Field>

            <Field label="Strength" error={formErrors.strength}>
              <input
                className="styled-input"
                style={inputStyle}
                placeholder="e.g. 100"
                value={form.strength}
                onChange={(e) => setForm({ ...form, strength: e.target.value })}
              />
            </Field>

            <Field label="Mentor Name">
              <select
                className="styled-input"
                style={inputStyle}
                value={form.mentor_name}
                onChange={(e) => setForm({ ...form, mentor_name: e.target.value })}
              >
                <option value="">Select Mentor</option>
                {assignableMentors.map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.name}{m.status === "Inactive" ? " (Inactive)" : ""}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div style={{ marginTop: "22px", display: "flex", gap: "12px" }}>
            {editId ? (
              <>
                <button className="btn btn-primary" onClick={updateBatch} disabled={saving}>
                  {saving ? "Saving…" : "Update Batch"}
                </button>
                <button className="btn btn-ghost" onClick={resetForm}>Cancel</button>
              </>
            ) : (
              <button className="btn btn-primary" onClick={createBatch} disabled={saving}>
                <Icon name="plus" size={14} /> {saving ? "Saving…" : "Create Batch"}
              </button>
            )}
          </div>
        </div>

        {/* Filters & Search */}
        <div className="card" style={{ marginTop: "24px" }}>
          <h2 className="card-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Icon name="filter" size={16} color="#b45309" /> Filters &amp; Search
          </h2>
          <p className="hint-text" style={{ marginTop: "-12px", marginBottom: "18px" }}>Find and manage batches easily.</p>

          <div className="filters-row">
            <div className="search-wrap">
              <span className="search-icon"><Icon name="search" size={13} color="#94a3b8" /></span>
              <input
                type="text"
                placeholder="Search batches, courses, or mentors..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="styled-input"
                style={{ ...inputStyle, width: "280px", paddingLeft: "34px" }}
              />
            </div>

            <select className="styled-input filter-select" style={{ ...inputStyle, width: "auto" }} value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}>
              <option value="">All Courses</option>
              {courseOptions.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>

            <select className="styled-input filter-select" style={{ ...inputStyle, width: "auto" }} value={mentorFilter} onChange={(e) => setMentorFilter(e.target.value)}>
              <option value="">All Mentors</option>
              {mentorOptions.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>

            <select className="styled-input filter-select" style={{ ...inputStyle, width: "auto" }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

            <select className="styled-input filter-select" style={{ ...inputStyle, width: "auto" }} value={healthFilter} onChange={(e) => setHealthFilter(e.target.value)}>
              <option value="">All Health</option>
              <option value="Healthy">Healthy</option>
              <option value="At Risk">At Risk</option>
              <option value="Not Enough Data">Not Enough Data</option>
            </select>

            <div className="date-range-wrap" ref={dateRangeRef}>
              <button
                className="btn btn-ghost"
                onClick={(e) => { e.stopPropagation(); setDateRangeOpen((v) => !v); }}
              >
                <Icon name="calendar" size={14} /> Date Range <Icon name="chevronDown" size={12} />
              </button>
              {dateRangeOpen && (
                <div className="date-range-popover" onClick={(e) => e.stopPropagation()}>
                  <Field label="Next session from">
                    <input type="date" className="styled-input" style={inputStyle} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                  </Field>
                  <Field label="Next session to">
                    <input type="date" className="styled-input" style={inputStyle} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                  </Field>
                </div>
              )}
            </div>

            {hasActiveFilters && (
              <button className="btn btn-ghost" onClick={resetFilters}>
                <Icon name="refreshCcw" size={13} /> Reset
              </button>
            )}
          </div>
        </div>

        {/* Batch list */}
        <div className="card" style={{ marginTop: "24px" }}>
          <div className="list-toolbar">
            <h2 className="card-title" style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <Icon name="graduation" size={17} color="#b45309" /> Batch List
              <div className="hint-text" style={{ fontWeight: 400, marginTop: "2px" }}>View, manage and track all your batches.</div>
            </h2>

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <a href={`${API}/export-batches`} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
                <button className="btn btn-ghost"><Icon name="download" size={13} /> Export</button>
              </a>
              <div className="view-toggle">
                <button className={`view-toggle-btn ${viewMode === "table" ? "view-toggle-btn-active" : ""}`} onClick={() => setViewMode("table")}>
                  <Icon name="table" size={13} /> Table View
                </button>
                <button className={`view-toggle-btn ${viewMode === "card" ? "view-toggle-btn-active" : ""}`} onClick={() => setViewMode("card")}>
                  <Icon name="grid" size={13} /> Card View
                </button>
              </div>
            </div>
          </div>

          {loadingBatches ? (
            <div className="empty-state">Loading batches…</div>
          ) : filteredBatches.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>🎓</div>
              {batches.length === 0 ? "No batches yet — create your first one above." : "No batches match your filters."}
            </div>
          ) : viewMode === "table" ? (
            <>
              <div className="table-wrap">
                <table className="styled-table">
                  <thead>
                    <tr>
                      <th>Batch</th>
                      <th>Course</th>
                      <th>Mentor</th>
                      <th>Learners</th>
                      <th>Attendance</th>
                      <th>Completion</th>
                      <th>Health</th>
                      <th>Next Session</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedBatches.map((batch, i) => {
                      const stat = statsFor(batch);
                      return (
                        <tr key={batch.id} style={{ animationDelay: `${i * 0.03}s` }}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <div className="batch-icon"><Icon name="graduation" size={16} color="#b45309" /></div>
                              <div>
                                <div className="strong">{batch.batch_name}</div>
                                <div className="muted" style={{ fontSize: "12px" }}>ID #{batch.id}</div>
                              </div>
                            </div>
                          </td>
                          <td>{batch.course_name ? <span className="tag">{batch.course_name}</span> : <span className="muted">N/A</span>}</td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <Avatar mentor={mentorByName(batch.mentor_name)} name={batch.mentor_name} />
                              <span>{batch.mentor_name || "Not Assigned"}</span>
                            </div>
                          </td>
                          <td>
                            <div className="strong" style={{ marginBottom: "4px" }}>{stat.learners} / {batch.strength || 0}</div>
                            <ProgressBar pct={batch.strength ? (stat.learners / batch.strength) * 100 : 0} color="#22c55e" />
                          </td>
                          <td>
                            {stat.avgAttendance === null ? <span className="muted">—</span> : (
                              <>
                                <div className="strong" style={{ marginBottom: "4px" }}>{Math.round(stat.avgAttendance)}%</div>
                                <ProgressBar pct={stat.avgAttendance} color="#0ea5e9" />
                              </>
                            )}
                          </td>
                          <td>
                            {stat.avgCompletion === null ? <span className="muted">—</span> : (
                              <>
                                <div className="strong" style={{ marginBottom: "4px" }}>{Math.round(stat.avgCompletion)}%</div>
                                <ProgressBar pct={stat.avgCompletion} color="#6366f1" />
                              </>
                            )}
                          </td>
                          <td><HealthBadge health={stat.health} /></td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
                              <Icon name="calendar" size={13} color="#94a3b8" />
                              {formatNextSession(stat.nextSession)}
                            </div>
                          </td>
                          <td><StatusBadge status={batch.status} /></td>
                          <td style={{ whiteSpace: "nowrap", position: "relative" }}>
                            <button className="btn btn-icon" onClick={() => { setViewBatch(batch); setOpenMenuId(null); }}>
                              <Icon name="eye" size={13} /> View
                            </button>
                            <button className="btn btn-icon btn-danger" onClick={() => deleteBatch(batch)}>
                              <Icon name="trash" size={13} /> Delete
                            </button>
                            <button
                              className="btn btn-icon btn-dots"
                              onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === batch.id ? null : batch.id); }}
                            >
                              <DotsIcon size={15} />
                            </button>
                            {openMenuId === batch.id && (
                              <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
                                <button onClick={() => editBatch(batch)}><Icon name="edit" size={13} /> Edit Batch</button>
                                {batch.status === "Inactive" ? (
                                  <button onClick={() => setBatchStatus(batch, "Active")}><Icon name="power" size={13} /> Activate Batch</button>
                                ) : (
                                  <button onClick={() => setBatchStatus(batch, "Inactive")}><Icon name="power" size={13} /> Deactivate Batch</button>
                                )}
                                <button className="dropdown-danger" onClick={() => deleteBatch(batch)}><Icon name="trash" size={13} /> Delete Batch</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="pagination-row">
                <div className="pagination-info">
                  Showing {(currentPage - 1) * ROWS_PER_PAGE + 1} to {Math.min(currentPage * ROWS_PER_PAGE, filteredBatches.length)} of {filteredBatches.length} batches
                </div>
                <div className="pagination-controls">
                  <button className="pagination-arrow-btn" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>‹</button>
                  {pageNumbers.map((p) =>
                    typeof p === "string" ? <span key={p} className="pagination-ellipsis">…</span> : (
                      <button key={p} className={`pagination-page-btn ${p === currentPage ? "pagination-page-btn-active" : ""}`} onClick={() => setCurrentPage(p)}>{p}</button>
                    )
                  )}
                  <button className="pagination-arrow-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>›</button>
                </div>
              </div>
            </>
          ) : (
            <div className="card-grid">
              {pagedBatches.map((batch) => {
                const stat = statsFor(batch);
                return (
                  <div key={batch.id} className="batch-card">
                    <div className="batch-card-header">
                      <div className="batch-icon"><Icon name="graduation" size={18} color="#b45309" /></div>
                      <div style={{ flex: 1 }}>
                        <div className="strong">{batch.batch_name || <span className="muted">Untitled</span>}</div>
                        <div className="muted" style={{ fontSize: "12px" }}>ID #{batch.id}</div>
                      </div>
                      <StatusBadge status={batch.status} />
                    </div>
                    <div style={{ margin: "10px 0" }}>
                      {batch.course_name ? <span className="tag">{batch.course_name}</span> : <span className="muted">N/A</span>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                      <Avatar mentor={mentorByName(batch.mentor_name)} name={batch.mentor_name} />
                      <span style={{ fontSize: "13px" }}>{batch.mentor_name || "Not Assigned"}</span>
                    </div>
                    <div className="batch-card-metric">
                      <span>Learners</span><span className="strong">{stat.learners} / {batch.strength || 0}</span>
                    </div>
                    <ProgressBar pct={batch.strength ? (stat.learners / batch.strength) * 100 : 0} color="#22c55e" />
                    <div className="batch-card-metric" style={{ marginTop: "10px" }}>
                      <span>Attendance</span><span className="strong">{stat.avgAttendance === null ? "—" : `${Math.round(stat.avgAttendance)}%`}</span>
                    </div>
                    <ProgressBar pct={stat.avgAttendance} color="#0ea5e9" />
                    <div className="batch-card-metric" style={{ marginTop: "10px" }}>
                      <span>Completion</span><span className="strong">{stat.avgCompletion === null ? "—" : `${Math.round(stat.avgCompletion)}%`}</span>
                    </div>
                    <ProgressBar pct={stat.avgCompletion} color="#6366f1" />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "14px" }}>
                      <HealthBadge health={stat.health} />
                      <span className="muted" style={{ fontSize: "12px" }}>{formatNextSession(stat.nextSession)}</span>
                    </div>
                    <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
                      <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setViewBatch(batch)}><Icon name="eye" size={13} /> View</button>
                      <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => editBatch(batch)}><Icon name="edit" size={13} /> Edit</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* View batch drawer */}
      {viewBatch && (
        <div className="drawer-overlay" onClick={() => setViewBatch(null)}>
          <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h2 className="card-title" style={{ margin: 0 }}>Batch Details</h2>
              <button className="btn btn-ghost" onClick={() => setViewBatch(null)}><Icon name="x" size={16} /></button>
            </div>

            <div className="drawer-profile">
              <div className="batch-icon" style={{ width: "56px", height: "56px" }}><Icon name="graduation" size={26} color="#b45309" /></div>
              <div className="drawer-profile-name-row">
                <h3 style={{ margin: 0 }}>{viewBatch.batch_name || "Untitled Batch"}</h3>
                <StatusBadge status={viewBatch.status} />
              </div>
              {viewBatch.course_name && <span className="tag">{viewBatch.course_name}</span>}
            </div>

            <div className="drawer-section">
              <div className="drawer-section-title">Batch Information</div>
              <div className="info-grid">
                <div className="info-chip"><div className="info-chip-label">Mentor</div><div className="info-chip-value">{viewBatch.mentor_name || "Not Assigned"}</div></div>
                <div className="info-chip"><div className="info-chip-label">Strength</div><div className="info-chip-value">{viewBatch.strength || 0}</div></div>
              </div>
            </div>

            <div className="drawer-section">
              <div className="drawer-section-title">Quick Stats</div>
              <div className="quick-stats-row">
                <div className="quick-stat">
                  <Icon name="users" size={16} color="#15803d" />
                  <div className="quick-stat-value">{statsFor(viewBatch).learners} / {viewBatch.strength || 0}</div>
                  <div className="quick-stat-label">Learners</div>
                </div>
                <div className="quick-stat">
                  <Icon name="checkCircle" size={16} color="#0369a1" />
                  <div className="quick-stat-value">{statsFor(viewBatch).avgAttendance === null ? "—" : `${Math.round(statsFor(viewBatch).avgAttendance)}%`}</div>
                  <div className="quick-stat-label">Attendance</div>
                </div>
                <div className="quick-stat">
                  <Icon name="layers" size={16} color="#4338ca" />
                  <div className="quick-stat-value">{statsFor(viewBatch).avgCompletion === null ? "—" : `${Math.round(statsFor(viewBatch).avgCompletion)}%`}</div>
                  <div className="quick-stat-label">Completion</div>
                </div>
              </div>
            </div>

            <div className="drawer-section">
              <div className="drawer-section-title">Health &amp; Schedule</div>
              <div className="drawer-contact-row"><HealthBadge health={statsFor(viewBatch).health} /></div>
              <div className="drawer-contact-row">
                <Icon name="calendar" size={14} color="#64748b" />
                <span>Next Session: {formatNextSession(statsFor(viewBatch).nextSession)}</span>
              </div>
              <div className="drawer-contact-row">
                <Icon name="layers" size={14} color="#64748b" />
                <span>{statsFor(viewBatch).sessionCount} session{statsFor(viewBatch).sessionCount === 1 ? "" : "s"} on record</span>
              </div>
            </div>

            <a href="/sessions" className="btn btn-ghost" style={{ display: "inline-block", textDecoration: "none", marginBottom: "18px" }}>
              View All in Sessions →
            </a>

            <div className="drawer-footer">
              <button className="btn btn-ghost" onClick={() => { setViewBatch(null); editBatch(viewBatch); }}><Icon name="edit" size={13} /> Edit Batch</button>
              {viewBatch.status === "Inactive" ? (
                <button className="btn btn-activate" onClick={() => setBatchStatus(viewBatch, "Active")}><Icon name="power" size={13} /> Activate Batch</button>
              ) : (
                <button className="btn btn-deactivate" onClick={() => setBatchStatus(viewBatch, "Inactive")}><Icon name="power" size={13} /> Deactivate</button>
              )}
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />

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
          gap: 24px;
          flex-wrap: wrap;
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
          max-width: 480px;
        }

        .page-hero-right {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          gap: 22px;
          flex-wrap: wrap;
        }

        .page-hero-quote {
          font-style: italic;
          color: #cbd5e1;
          font-size: 13.5px;
          line-height: 1.5;
          text-align: right;
        }

        .page-hero-stats {
          display: flex;
          gap: 12px;
        }

        .page-hero-stat {
          text-align: center;
          padding: 12px 20px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .page-hero-stat-value {
          font-size: 22px;
          font-weight: 800;
          color: #fbbf24;
          margin-top: 4px;
        }

        .page-hero-stat-label {
          font-size: 10.5px;
          color: #94a3b8;
          margin-top: 2px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          white-space: nowrap;
        }

        .stat-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 14px;
          margin-bottom: 24px;
        }

        .stat-card {
          border-radius: 14px;
          padding: 16px 18px;
          border: 1px solid #eef2f7;
        }

        .stat-card-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 10px;
        }

        .stat-card-value {
          font-size: 22px;
          font-weight: 800;
          color: #1e293b;
        }

        .stat-card-label {
          font-size: 12px;
          color: #64748b;
          margin-top: 2px;
          font-weight: 600;
        }

        .card {
          background: #ffffff;
          border-radius: 16px;
          padding: 26px 28px;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
          border: 1px solid #eef2f7;
        }

        .card-title {
          margin: 0 0 6px;
          font-size: 17px;
          color: #1e293b;
        }

        .hint-text {
          font-size: 12.5px;
          color: #94a3b8;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 18px;
        }

        .field-error {
          color: #ef4444;
          font-size: 12px;
          margin-top: 5px;
          font-weight: 600;
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
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
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

        .btn-activate {
          background: #dcfce7;
          color: #15803d;
        }

        .btn-deactivate {
          background: #fee2e2;
          color: #b91c1c;
        }

        .list-toolbar {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 14px;
          margin-bottom: 18px;
        }

        .filters-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
        }

        .filter-select {
          min-width: 130px;
        }

        .search-wrap {
          position: relative;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          opacity: 0.6;
        }

        .date-range-wrap {
          position: relative;
        }

        .date-range-popover {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          background: #ffffff;
          border: 1px solid #eef2f7;
          border-radius: 12px;
          box-shadow: 0 12px 24px -8px rgba(15, 23, 42, 0.25);
          padding: 16px;
          z-index: 30;
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-width: 220px;
        }

        .view-toggle {
          display: inline-flex;
          gap: 6px;
          background: #f1f5f9;
          padding: 4px;
          border-radius: 10px;
        }

        .view-toggle-btn {
          border: none;
          background: transparent;
          padding: 8px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 700;
          color: #64748b;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .view-toggle-btn-active {
          background: #ffffff;
          color: #b45309;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.1);
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
          padding: 12px 14px;
          border-bottom: 1px solid #f1f5f9;
          color: #1e293b;
          vertical-align: middle;
        }

        .strong {
          font-weight: 600;
        }

        .muted {
          color: #94a3b8;
        }

        .batch-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: #fef3c7;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .icon-badge {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(120deg, #f59e0b, #fbbf24);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        :global(.tag) {
          display: inline-block;
          background: #dbeafe;
          color: #1d4ed8;
          font-size: 12px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 999px;
        }

        .progress-track {
          width: 90px;
          height: 6px;
          background: #f1f5f9;
          border-radius: 999px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
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

        .btn-icon.btn-danger {
          color: #b91c1c;
        }

        .btn-icon.btn-danger:hover {
          background: #fee2e2;
        }

        .btn-dots {
          padding: 6px 8px;
        }

        .dropdown-menu {
          position: absolute;
          right: 0;
          top: 100%;
          margin-top: 4px;
          background: #ffffff;
          border: 1px solid #eef2f7;
          border-radius: 10px;
          box-shadow: 0 12px 24px -8px rgba(15, 23, 42, 0.25);
          z-index: 20;
          min-width: 190px;
          overflow: hidden;
        }

        .dropdown-menu button {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          text-align: left;
          padding: 10px 14px;
          background: none;
          border: none;
          font-size: 13px;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
        }

        .dropdown-menu button:hover {
          background: #f8fafc;
        }

        .dropdown-danger {
          color: #b91c1c !important;
        }

        .empty-state {
          text-align: center;
          padding: 50px 20px;
          color: #94a3b8;
          font-size: 14px;
        }

        .pagination-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 14px;
          margin-top: 18px;
          padding-top: 16px;
          border-top: 1px solid #f1f5f9;
        }

        .pagination-info {
          font-size: 12.5px;
          color: #64748b;
        }

        .pagination-controls {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .pagination-arrow-btn,
        .pagination-page-btn {
          border: 1px solid #eef2f7;
          background: #ffffff;
          color: #475569;
          min-width: 30px;
          height: 30px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }

        .pagination-arrow-btn:hover,
        .pagination-page-btn:hover {
          border-color: #f59e0b;
        }

        .pagination-arrow-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .pagination-page-btn-active {
          background: linear-gradient(120deg, #f59e0b, #fbbf24);
          color: #0f172a;
          border-color: transparent;
        }

        .pagination-ellipsis {
          color: #94a3b8;
          padding: 0 4px;
          font-size: 13px;
        }

        .card-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 16px;
        }

        .batch-card {
          border: 1px solid #eef2f7;
          border-radius: 14px;
          padding: 16px;
          background: #fff;
        }

        .batch-card-header {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .batch-card-metric {
          display: flex;
          justify-content: space-between;
          font-size: 12.5px;
          color: #64748b;
          margin-bottom: 4px;
        }

        .drawer-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.45);
          z-index: 200;
          display: flex;
          justify-content: flex-end;
        }

        .drawer-panel {
          width: 420px;
          max-width: 92vw;
          height: 100vh;
          background: #ffffff;
          padding: 26px 28px;
          overflow-y: auto;
          box-shadow: -12px 0 32px -12px rgba(15, 23, 42, 0.3);
        }

        .drawer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
        }

        .drawer-profile {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 8px;
          padding-bottom: 18px;
          border-bottom: 1px solid #f1f5f9;
          margin-bottom: 16px;
        }

        .drawer-profile-name-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .drawer-section {
          margin-bottom: 20px;
        }

        .drawer-section-title {
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          color: #64748b;
          margin-bottom: 10px;
        }

        .drawer-contact-row {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13.5px;
          color: #1e293b;
          margin-bottom: 8px;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 12px;
        }

        :global(.info-chip) {
          background: #f8fafc;
          border: 1px solid #eef2f7;
          border-radius: 10px;
          padding: 10px 14px;
        }

        :global(.info-chip-label) {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          color: #94a3b8;
          margin-bottom: 4px;
        }

        :global(.info-chip-value) {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
        }

        .quick-stats-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        .quick-stat {
          background: #f8fafc;
          border: 1px solid #eef2f7;
          border-radius: 10px;
          padding: 12px 8px;
          text-align: center;
        }

        .quick-stat-value {
          font-size: 15px;
          font-weight: 800;
          color: #1e293b;
          margin-top: 4px;
        }

        .quick-stat-label {
          font-size: 10.5px;
          color: #94a3b8;
          margin-top: 2px;
        }

        .drawer-footer {
          display: flex;
          gap: 10px;
          margin-top: 22px;
          padding-top: 18px;
          border-top: 1px solid #f1f5f9;
        }

        @keyframes heroShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(16px); }
        }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </ProtectedRoute>
  );
}
