import { useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "../components/Sidebar";
import ProtectedRoute from "../components/ProtectedRoute";

// Small hand-drawn icon set (no external icon library) — used for the chrome
// elements (top bar, stat cards, filters, view toggle) so they render as
// consistent flat line icons instead of relying on the OS/browser's emoji
// font, which varies a lot across platforms.
const ICON_PATHS = {
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </>
  ),
  user: (
    <>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </>
  ),
  trendingUp: (
    <>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </>
  ),
  checkCircle: (
    <>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </>
  ),
  xCircle: (
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </>
  ),
  list: (
    <>
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </>
  ),
  package: (
    <>
      <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </>
  ),
  tag: (
    <>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </>
  ),
  circle: <circle cx="12" cy="12" r="10" />,
  search: (
    <>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
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

const STATUS_STYLES = {
  Scheduled: { bg: "#dbeafe", color: "#1d4ed8", dot: "#3b82f6", emoji: "🔵" },
  Completed: { bg: "#dcfce7", color: "#15803d", dot: "#22c55e", emoji: "🟢" },
  Cancelled: { bg: "#fee2e2", color: "#b91c1c", dot: "#ef4444", emoji: "🔴" },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || { bg: "#e2e8f0", color: "#475569", dot: "#94a3b8", emoji: "⚪" };
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
        whiteSpace: "nowrap",
      }}
    >
      <span aria-hidden="true">{s.emoji}</span>
      {status || "—"}
    </span>
  );
}

const SESSION_TYPE_STYLES = {
  "Live Session": { bg: "#e0f2fe", color: "#0369a1", icon: "🎙️", dot: "#0ea5e9" },
  "Webinar Session": { bg: "#ede9fe", color: "#6d28d9", icon: "📹", dot: "#8b5cf6" },
};

function SessionTypeBadge({ type }) {
  const s = SESSION_TYPE_STYLES[type] || SESSION_TYPE_STYLES["Live Session"];
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
        whiteSpace: "nowrap",
      }}
    >
      {s.icon} {type || "Live Session"}
    </span>
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
  return `http://127.0.0.1:8000/mentors/${mentor.id}/photo?v=${encodeURIComponent(mentor.photo_path)}`;
}

// Shows the mentor's real photo from Mentor Management when one is on file
// (looked up live by name every render, so it always reflects whatever is
// currently set there), falling back to initials otherwise.
function Avatar({ mentor, name, size = 28 }) {
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
        fontSize: size <= 28 ? "11px" : "18px",
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {initials(resolvedName)}
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

const EMPTY_FORM = {
  topic: "",
  mentor_name: "",
  batch_name: "",
  session_date: "",
  session_time: "",
  status: "Scheduled",
  session_type: "Live Session",
  webinar_id: "",
  zoom_id: "",
};

const TABS = ["All", "Today", "Upcoming", "Completed", "Cancelled"];
const ROWS_PER_PAGE_OPTIONS = [5, 10, 25, 50];

// "YYYY-MM-DD" the same way <input type="date"> stores it, in local time
// (avoids the UTC-shift bugs that come from new Date().toISOString()).
function todayStr() {
  return new Date().toLocaleDateString("en-CA");
}

function sessionDateTime(session) {
  if (!session.session_date) return null;
  const time = session.session_time || "00:00";
  const dt = new Date(`${session.session_date}T${time}`);
  return isNaN(dt.getTime()) ? null : dt;
}

function matchesTab(session, tab) {
  if (tab === "All") return true;
  if (tab === "Today") return session.session_date === todayStr();
  if (tab === "Upcoming") {
    const dt = sessionDateTime(session);
    return session.status === "Scheduled" && dt && dt.getTime() > Date.now();
  }
  if (tab === "Completed") return session.status === "Completed";
  if (tab === "Cancelled") return session.status === "Cancelled";
  return true;
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
        maxWidth: "360px",
      }}
    >
      <span>{isError ? "⚠️" : "✅"} {toast.message}</span>
      <button
        onClick={onClose}
        style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontWeight: 700 }}
      >
        ✕
      </button>
    </div>
  );
}

export default function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");

  const [mentors, setMentors] = useState([]);
  const [batches, setBatches] = useState([]);
  const [zoomAccounts, setZoomAccounts] = useState([]);
  const [addingZoomId, setAddingZoomId] = useState(false);
  const [newZoomEmail, setNewZoomEmail] = useState("");

  const [form, setForm] = useState(EMPTY_FORM);

  const [loadingSessions, setLoadingSessions] = useState(true);
  const [toast, setToast] = useState(null);

  const [activeTab, setActiveTab] = useState("All");
  const [filters, setFilters] = useState({ date: "", mentor: "", batch: "", type: "", status: "" });
  const [viewMode, setViewMode] = useState("list");

  const [viewSession, setViewSession] = useState(null);
  const [rescheduleSession, setRescheduleSession] = useState(null);
  const [rescheduleForm, setRescheduleForm] = useState({ session_date: "", session_time: "", reason: "" });
  const [rescheduling, setRescheduling] = useState(false);

  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);

  const listSectionRef = useRef(null);
  const calendarSectionRef = useRef(null);

  const showToast = (message, type = "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const scrollToSection = (ref) => {
    if (ref.current) ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/sessions");
      if (!res.ok) throw new Error("bad status");
      const data = await res.json();
      setSessions(data);
    } catch (err) {
      showToast("Failed to load sessions. Please refresh and try again.");
    } finally {
      setLoadingSessions(false);
    }
  };

  const loadMentors = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/mentors");
      const data = await res.json();
      setMentors(data);
    } catch (err) {
      // Non-fatal — the mentor dropdown just stays empty.
    }
  };

  const loadBatches = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/batches");
      const data = await res.json();
      setBatches(data);
    } catch (err) {
      // Non-fatal — the batch dropdown just stays empty.
    }
  };

  const loadZoomAccounts = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/zoom-accounts");
      const data = await res.json();
      setZoomAccounts(data);
    } catch (err) {
      // Non-fatal — the Zoom ID dropdown just stays empty.
    }
  };

  const addZoomAccount = async () => {
    const email = newZoomEmail.trim();
    if (!email) return;
    try {
      const res = await fetch("http://127.0.0.1:8000/zoom-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("bad status");
      const account = await res.json();
      setZoomAccounts((prev) => (prev.some((a) => a.id === account.id) ? prev : [...prev, account]));
      setForm((prev) => ({ ...prev, zoom_id: account.email }));
      setNewZoomEmail("");
      setAddingZoomId(false);
    } catch (err) {
      showToast("Couldn't add that Zoom ID. Please try again.");
    }
  };

  useEffect(() => {
    loadSessions();
    loadMentors();
    loadBatches();
    loadZoomAccounts();
  }, []);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditId(null);
  };

  const createSession = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("bad status");
      showToast(editId ? "Session updated." : "Session created.", "success");
      loadSessions();
      resetForm();
    } catch (err) {
      showToast("Failed to create session. Please try again.");
    }
  };

  const updateSession = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/sessions/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("bad status");
      showToast("Session updated.", "success");
      loadSessions();
      resetForm();
    } catch (err) {
      showToast("Failed to update session. Please try again.");
    }
  };

  const deleteSession = async (id) => {
    if (!window.confirm("Delete this session?")) return;

    try {
      const res = await fetch(`http://127.0.0.1:8000/sessions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("bad status");
      showToast("Session deleted.", "success");
      loadSessions();
    } catch (err) {
      showToast("Failed to delete session. Please try again.");
    }
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
      session_type: session.session_type || "Live Session",
      webinar_id: session.webinar_id || "",
      zoom_id: session.zoom_id || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Prefills the existing Create Session form from another session, but
  // leaves Date/Time blank and does NOT set editId — the user still has to
  // review and click "Create Session" themselves, so nothing is duplicated
  // automatically.
  const duplicateSession = (session) => {
    setEditId(null);
    setForm({
      topic: session.topic,
      mentor_name: session.mentor_name,
      batch_name: session.batch_name,
      session_date: "",
      session_time: "",
      status: session.status,
      session_type: session.session_type || "Live Session",
      webinar_id: "",
      zoom_id: session.zoom_id || "",
    });
    showToast("Session details copied — pick a new date & time, then Create Session.", "success");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openReschedule = (session) => {
    setRescheduleSession(session);
    setRescheduleForm({ session_date: session.session_date || "", session_time: session.session_time || "", reason: "" });
  };

  const submitReschedule = async () => {
    if (!rescheduleSession) return;
    if (!rescheduleForm.session_date || !rescheduleForm.session_time) {
      showToast("Please pick both a new date and time.");
      return;
    }

    setRescheduling(true);
    try {
      const payload = {
        topic: rescheduleSession.topic,
        mentor_name: rescheduleSession.mentor_name,
        batch_name: rescheduleSession.batch_name,
        status: rescheduleSession.status,
        session_type: rescheduleSession.session_type || "Live Session",
        webinar_id: rescheduleSession.webinar_id || "",
        zoom_id: rescheduleSession.zoom_id || "",
        session_date: rescheduleForm.session_date,
        session_time: rescheduleForm.session_time,
        remarks: rescheduleForm.reason
          ? `Rescheduled from ${rescheduleSession.session_date} ${rescheduleSession.session_time} — ${rescheduleForm.reason}`
          : rescheduleSession.remarks || null,
      };

      const res = await fetch(`http://127.0.0.1:8000/sessions/${rescheduleSession.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("bad status");

      showToast("Session rescheduled.", "success");
      setRescheduleSession(null);
      loadSessions();
    } catch (err) {
      showToast("Failed to reschedule session. Please try again.");
    } finally {
      setRescheduling(false);
    }
  };

  // Mentor Management now supports Active/Inactive status. New sessions should
  // only offer Active mentors, but a session already assigned to a mentor who
  // has since been deactivated must keep showing that mentor so the existing
  // assignment isn't silently dropped from the dropdown.
  const assignableMentors = useMemo(() => {
    const active = mentors.filter((m) => m.status !== "Inactive");
    if (form.mentor_name && !active.some((m) => m.name === form.mentor_name)) {
      const current = mentors.find((m) => m.name === form.mentor_name);
      if (current) return [...active, current];
    }
    return active;
  }, [mentors, form.mentor_name]);

  // Looks up the current Mentor Management record for a session's assigned
  // mentor name, so the Session List always shows whatever photo/details are
  // currently set there — never a stale snapshot.
  const mentorByName = (name) => mentors.find((m) => m.name === name);

  // ---- Schedule conflict warnings (feature 4 & 5) — client-side only,
  // warns but never blocks Create/Update. ----
  const scheduleConflicts = useMemo(() => {
    if (!form.session_date || !form.session_time) return { mentor: false, batch: false };

    const clashesWith = (session) =>
      session.id !== editId &&
      session.session_date === form.session_date &&
      session.session_time === form.session_time &&
      session.status !== "Cancelled";

    return {
      mentor: !!form.mentor_name && sessions.some((s) => clashesWith(s) && s.mentor_name === form.mentor_name),
      batch: !!form.batch_name && sessions.some((s) => clashesWith(s) && s.batch_name === form.batch_name),
    };
  }, [form.mentor_name, form.batch_name, form.session_date, form.session_time, sessions, editId]);

  // ---- Tab counts ----
  const tabCounts = useMemo(() => {
    const counts = {};
    TABS.forEach((tab) => {
      counts[tab] = sessions.filter((s) => matchesTab(s, tab)).length;
    });
    return counts;
  }, [sessions]);

  // ---- Combined tab + filters + search ----
  const filteredSessions = useMemo(() => {
    const q = search.toLowerCase();
    return sessions.filter((session) => {
      if (!matchesTab(session, activeTab)) return false;

      const matchesSearch =
        !q ||
        (session.topic || "").toLowerCase().includes(q) ||
        (session.mentor_name || "").toLowerCase().includes(q) ||
        (session.batch_name || "").toLowerCase().includes(q);
      if (!matchesSearch) return false;

      if (filters.date && session.session_date !== filters.date) return false;
      if (filters.mentor && session.mentor_name !== filters.mentor) return false;
      if (filters.batch && session.batch_name !== filters.batch) return false;
      if (filters.type && (session.session_type || "Live Session") !== filters.type) return false;
      if (filters.status && session.status !== filters.status) return false;

      return true;
    });
  }, [sessions, activeTab, search, filters]);

  const clearFilters = () => {
    setFilters({ date: "", mentor: "", batch: "", type: "", status: "" });
    setSearch("");
  };

  const hasActiveFilters =
    search || filters.date || filters.mentor || filters.batch || filters.type || filters.status;

  // ---- Pagination over the filtered list (list view only; calendar always shows the full month) ----
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, search, filters, rowsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredSessions.length / rowsPerPage));

  const pagedSessions = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredSessions.slice(start, start + rowsPerPage);
  }, [filteredSessions, currentPage, rowsPerPage]);

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

  // ---- Calendar grid (month view, read-only) ----
  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const startOffset = firstOfMonth.getDay(); // 0 = Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let day = 1; day <= daysInMonth; day++) cells.push(day);
    while (cells.length % 7 !== 0) cells.push(null);

    return cells.map((day) => {
      if (!day) return null;
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const daySessions = filteredSessions.filter((s) => s.session_date === dateStr);
      return { day, dateStr, sessions: daySessions };
    });
  }, [calendarMonth, filteredSessions]);

  const goToMonth = (offset) => {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  return (
    <ProtectedRoute permission={["sessions", "view"]}>
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

        {/* Stat summary row */}
        <div className="stat-row">
          <div className="stat-card" style={{ borderColor: "#f59e0b" }}>
            <div className="stat-card-icon" style={{ background: "#fef3c7", color: "#b45309" }}>
              <Icon name="calendar" size={19} />
            </div>
            <div>
              <div className="stat-card-value" style={{ color: "#b45309" }}>{tabCounts.All}</div>
              <div className="stat-card-label">Total Sessions</div>
            </div>
          </div>
          <div className="stat-card" style={{ borderColor: "#0ea5e9" }}>
            <div className="stat-card-icon" style={{ background: "#e0f2fe", color: "#0369a1" }}>
              <Icon name="user" size={19} />
            </div>
            <div>
              <div className="stat-card-value" style={{ color: "#0369a1" }}>{tabCounts.Today}</div>
              <div className="stat-card-label">Today</div>
            </div>
          </div>
          <div className="stat-card" style={{ borderColor: "#6366f1" }}>
            <div className="stat-card-icon" style={{ background: "#e0e7ff", color: "#4338ca" }}>
              <Icon name="trendingUp" size={19} />
            </div>
            <div>
              <div className="stat-card-value" style={{ color: "#4338ca" }}>{tabCounts.Upcoming}</div>
              <div className="stat-card-label">Upcoming</div>
            </div>
          </div>
          <div className="stat-card" style={{ borderColor: "#22c55e" }}>
            <div className="stat-card-icon" style={{ background: "#dcfce7", color: "#15803d" }}>
              <Icon name="checkCircle" size={19} />
            </div>
            <div>
              <div className="stat-card-value" style={{ color: "#15803d" }}>{tabCounts.Completed}</div>
              <div className="stat-card-label">Completed</div>
            </div>
          </div>
          <div className="stat-card" style={{ borderColor: "#ef4444" }}>
            <div className="stat-card-icon" style={{ background: "#fee2e2", color: "#b91c1c" }}>
              <Icon name="xCircle" size={19} />
            </div>
            <div>
              <div className="stat-card-value" style={{ color: "#b91c1c" }}>{tabCounts.Cancelled}</div>
              <div className="stat-card-label">Cancelled</div>
            </div>
          </div>
        </div>

        {/* Create / Update form — unchanged fields & behavior */}
        <div className="card form-card">
          <div className="form-card-header">
            <h2 className="card-title" style={{ margin: 0 }}>
              {editId ? "✏️ Update Session" : "➕ Create Session"}
            </h2>
            <div className="tip-box">
              💡 <b>Tip:</b> You can also check mentor &amp; batch conflicts while scheduling.
            </div>
          </div>

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

            <Field label="Session Type">
              <select
                className="styled-input"
                style={inputStyle}
                value={form.session_type}
                onChange={(e) => {
                  const nextType = e.target.value;
                  setForm({
                    ...form,
                    session_type: nextType,
                    batch_name: nextType === "Webinar Session" ? "" : form.batch_name,
                  });
                }}
              >
                <option value="Live Session">🎙️ Live Session</option>
                <option value="Webinar Session">📹 Webinar Session</option>
              </select>
            </Field>

            <Field label="Zoom ID">
              {addingZoomId ? (
                <div style={{ display: "flex", gap: "6px" }}>
                  <input
                    className="styled-input"
                    style={inputStyle}
                    placeholder="e.g. newzoom@krishnaik.in"
                    value={newZoomEmail}
                    autoFocus
                    onChange={(e) => setNewZoomEmail(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addZoomAccount(); } }}
                  />
                  <button type="button" className="btn btn-primary btn-sm" onClick={addZoomAccount}>Add</button>
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost"
                    onClick={() => { setAddingZoomId(false); setNewZoomEmail(""); }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <select
                  className="styled-input"
                  style={inputStyle}
                  value={form.zoom_id}
                  onChange={(e) => {
                    if (e.target.value === "__add_new__") {
                      setAddingZoomId(true);
                      return;
                    }
                    setForm({ ...form, zoom_id: e.target.value });
                  }}
                >
                  <option value="">Select Zoom ID</option>
                  {zoomAccounts.map((account) => (
                    <option key={account.id} value={account.email}>
                      {account.email}
                    </option>
                  ))}
                  {form.zoom_id && !zoomAccounts.some((a) => a.email === form.zoom_id) && (
                    <option value={form.zoom_id}>{form.zoom_id}</option>
                  )}
                  <option value="__add_new__">+ Add New Zoom ID…</option>
                </select>
              )}
            </Field>

            <Field label="Webinar ID">
              <input
                className="styled-input"
                style={inputStyle}
                placeholder="e.g. 890 0442 4382"
                value={form.webinar_id}
                onChange={(e) => setForm({ ...form, webinar_id: e.target.value })}
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
                {assignableMentors.map((mentor) => (
                  <option key={mentor.id} value={mentor.name}>
                    {mentor.name}
                    {mentor.status === "Inactive" ? " (Inactive)" : ""}
                  </option>
                ))}
              </select>
            </Field>

            {form.session_type !== "Webinar Session" && (
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
            )}

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

          {(scheduleConflicts.mentor || scheduleConflicts.batch) && (
            <div className="conflict-warning">
              {scheduleConflicts.mentor && (
                <div>⚠ <b>Schedule Conflict</b> — this mentor already has a session scheduled at this time.</div>
              )}
              {scheduleConflicts.batch && (
                <div>⚠ <b>Batch Schedule Conflict</b> — this batch already has a session scheduled at this time.</div>
              )}
            </div>
          )}

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

        {/* Tabs */}
        <div className="tabs-row">
          {TABS.map((tab) => (
            <button
              key={tab}
              className={`tab-btn ${activeTab === tab ? "tab-btn-active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab} ({tabCounts[tab]})
            </button>
          ))}
        </div>

        {/* Filter controls */}
        <div className="card" style={{ marginTop: "16px" }}>
          <div className="filters-row">
            <div className="search-wrap">
              <span className="search-icon"><Icon name="search" size={13} color="#94a3b8" /></span>
              <input
                type="text"
                placeholder="Search sessions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="styled-input search-input"
              />
            </div>

            <div className="select-wrap">
              <span className="select-icon"><Icon name="calendar" size={13} color="#94a3b8" /></span>
              <select
                className="styled-input filter-select select-with-icon"
                style={inputStyle}
                value={filters.date}
                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
              >
                <option value="">All Dates</option>
                {[...new Set(sessions.map((s) => s.session_date).filter(Boolean))].sort().map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="select-wrap">
              <span className="select-icon"><Icon name="user" size={13} color="#94a3b8" /></span>
              <select
                className="styled-input filter-select select-with-icon"
                style={inputStyle}
                value={filters.mentor}
                onChange={(e) => setFilters({ ...filters, mentor: e.target.value })}
              >
                <option value="">All Mentors</option>
                {mentors.map((m) => (
                  <option key={m.id} value={m.name}>{m.name}</option>
                ))}
              </select>
            </div>

            <div className="select-wrap">
              <span className="select-icon"><Icon name="package" size={13} color="#94a3b8" /></span>
              <select
                className="styled-input filter-select select-with-icon"
                style={inputStyle}
                value={filters.batch}
                onChange={(e) => setFilters({ ...filters, batch: e.target.value })}
              >
                <option value="">All Batches</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.batch_name}>{b.batch_name}</option>
                ))}
              </select>
            </div>

            <div className="select-wrap">
              <span className="select-icon"><Icon name="tag" size={13} color="#94a3b8" /></span>
              <select
                className="styled-input filter-select select-with-icon"
                style={inputStyle}
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              >
                <option value="">All Types</option>
                <option value="Live Session">Live Session</option>
                <option value="Webinar Session">Webinar Session</option>
              </select>
            </div>

            <div className="select-wrap">
              <span className="select-icon"><Icon name="circle" size={13} color="#94a3b8" /></span>
              <select
                className="styled-input filter-select select-with-icon"
                style={inputStyle}
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">All Status</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button className="btn btn-ghost" onClick={clearFilters}>
                ✕ Clear Filters
              </button>
            )}

            <div className="view-toggle">
              <button
                className={`view-toggle-btn ${viewMode === "list" ? "view-toggle-btn-active" : ""}`}
                onClick={() => {
                  setViewMode("list");
                  scrollToSection(listSectionRef);
                }}
              >
                <Icon name="list" size={14} /> List View
              </button>
              <button
                className={`view-toggle-btn ${viewMode === "calendar" ? "view-toggle-btn-active" : ""}`}
                onClick={() => {
                  setViewMode("calendar");
                  scrollToSection(calendarSectionRef);
                }}
              >
                <Icon name="calendar" size={14} /> Calendar View
              </button>
            </div>
          </div>
        </div>

        {/* Session list — always visible alongside the calendar (feature 3) */}
        <div className="card" style={{ marginTop: "24px" }} ref={listSectionRef}>
          <div className="list-toolbar">
            <h2 className="card-title" style={{ margin: 0 }}>
              📋 Session List
            </h2>

            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
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
            {loadingSessions ? (
              <div className="empty-state">Loading sessions…</div>
            ) : (
              <>
                <table className="styled-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Topic</th>
                      <th>Type</th>
                      <th>Webinar ID</th>
                      <th>Zoom ID</th>
                      <th>Mentor</th>
                      <th>Batch</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {pagedSessions.map((session, i) => (
                      <tr key={session.id} style={{ animationDelay: `${i * 0.03}s` }}>
                        <td className="muted">{session.id}</td>
                        <td className="strong">{session.topic}</td>
                        <td>
                          <SessionTypeBadge type={session.session_type} />
                        </td>
                        <td className="muted">{session.webinar_id || "—"}</td>
                        <td className="muted">{session.zoom_id || "—"}</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <Avatar mentor={mentorByName(session.mentor_name)} name={session.mentor_name} />
                            <span>{session.mentor_name || "Not Assigned"}</span>
                          </div>
                        </td>
                        <td>{session.batch_name || "Not Assigned"}</td>
                        <td className="muted">{session.session_date || "—"}</td>
                        <td className="muted">{session.session_time || "—"}</td>
                        <td>
                          <StatusBadge status={session.status} />
                        </td>
                        <td style={{ whiteSpace: "nowrap" }}>
                          <button className="btn btn-icon" onClick={() => setViewSession(session)}>
                            👁️ View
                          </button>
                          <button className="btn btn-icon" onClick={() => duplicateSession(session)}>
                            📄 Duplicate
                          </button>
                          <button className="btn btn-icon" onClick={() => openReschedule(session)}>
                            🔁 Reschedule
                          </button>
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
                      : "No sessions match your current filters."}
                  </div>
                )}

                {filteredSessions.length > 0 && (
                  <div className="pagination-row">
                    <div className="pagination-info">
                      Showing {(currentPage - 1) * rowsPerPage + 1} to{" "}
                      {Math.min(currentPage * rowsPerPage, filteredSessions.length)} of{" "}
                      {filteredSessions.length} sessions
                    </div>

                    <div className="pagination-controls">
                      <button
                        className="pagination-arrow-btn"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      >
                        ‹
                      </button>
                      {pageNumbers.map((p) =>
                        typeof p === "string" ? (
                          <span key={p} className="pagination-ellipsis">…</span>
                        ) : (
                          <button
                            key={p}
                            className={`pagination-page-btn ${p === currentPage ? "pagination-page-btn-active" : ""}`}
                            onClick={() => setCurrentPage(p)}
                          >
                            {p}
                          </button>
                        )
                      )}
                      <button
                        className="pagination-arrow-btn"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      >
                        ›
                      </button>
                    </div>

                    <div className="pagination-rows">
                      <span>Rows per page</span>
                      <select
                        className="styled-input"
                        style={{ ...inputStyle, width: "auto", padding: "6px 10px" }}
                        value={rowsPerPage}
                        onChange={(e) => setRowsPerPage(Number(e.target.value))}
                      >
                        {ROWS_PER_PAGE_OPTIONS.map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Calendar view — always visible alongside the list (feature 3) */}
        <div className="card" style={{ marginTop: "24px" }} ref={calendarSectionRef}>
          <div className="list-toolbar">
            <h2 className="card-title" style={{ margin: 0 }}>
              🗓️ Calendar View
            </h2>
            <div className="calendar-toolbar-right">
              <div className="calendar-nav">
                <button className="btn btn-icon" onClick={() => goToMonth(-1)}>‹ Prev</button>
                <div className="calendar-month-label">
                  {calendarMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                </div>
                <button className="btn btn-icon" onClick={() => goToMonth(1)}>Next ›</button>
                <button
                  className="btn btn-ghost"
                  onClick={() => setCalendarMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}
                >
                  Today
                </button>
              </div>

              <div className="calendar-view-toggle">
                <button className="calendar-view-btn calendar-view-btn-active">Month</button>
                <button
                  className="calendar-view-btn"
                  onClick={() => showToast("Week view is coming soon.", "success")}
                >
                  Week
                </button>
                <button
                  className="calendar-view-btn"
                  onClick={() => showToast("Day view is coming soon.", "success")}
                >
                  Day
                </button>
              </div>
            </div>
          </div>

          <div className="calendar-legend">
            <span><span className="legend-dot" style={{ background: "#0ea5e9" }} /> Live Session</span>
            <span><span className="legend-dot" style={{ background: "#8b5cf6" }} /> Webinar</span>
            <span><span className="legend-dot" style={{ background: "#22c55e" }} /> Completed</span>
            <span><span className="legend-dot" style={{ background: "#ef4444" }} /> Cancelled</span>
          </div>

          <div className="calendar-grid calendar-grid-header">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="calendar-weekday">{d}</div>
            ))}
          </div>

          <div className="calendar-grid">
            {calendarDays.map((cell, i) => (
              <div key={i} className={`calendar-cell ${cell && cell.dateStr === todayStr() ? "calendar-cell-today" : ""}`}>
                {cell && (
                  <>
                    <div className="calendar-day-number">{cell.day}</div>
                    {cell.sessions.slice(0, 3).map((s) => {
                      const typeColor = s.status === "Cancelled"
                        ? "#ef4444"
                        : s.status === "Completed"
                        ? "#22c55e"
                        : (SESSION_TYPE_STYLES[s.session_type] || SESSION_TYPE_STYLES["Live Session"]).dot;
                      return (
                        <div key={s.id} className="calendar-session" title={`${s.topic} — ${s.mentor_name || "Not Assigned"}`}>
                          <span className="legend-dot" style={{ background: typeColor }} />
                          <span className="calendar-session-time">{s.session_time}</span>
                          <span className="calendar-session-topic">{s.topic}</span>
                        </div>
                      );
                    })}
                    {cell.sessions.length > 3 && (
                      <div className="calendar-more">+{cell.sessions.length - 3} more</div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* View session modal */}
      {viewSession && (
        <div className="modal-overlay" onClick={() => setViewSession(null)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="card-title" style={{ margin: 0 }}>Session Details</h2>
              <button className="btn btn-ghost" onClick={() => setViewSession(null)}>✕ Close</button>
            </div>

            <div className="info-grid">
              <div className="info-chip"><div className="info-chip-label">ID</div><div className="info-chip-value">{viewSession.id}</div></div>
              <div className="info-chip"><div className="info-chip-label">Topic</div><div className="info-chip-value">{viewSession.topic || "—"}</div></div>
              <div className="info-chip"><div className="info-chip-label">Session Type</div><div className="info-chip-value"><SessionTypeBadge type={viewSession.session_type} /></div></div>
              <div className="info-chip"><div className="info-chip-label">Mentor</div><div className="info-chip-value">{viewSession.mentor_name || "Not Assigned"}</div></div>
              <div className="info-chip"><div className="info-chip-label">Batch</div><div className="info-chip-value">{viewSession.batch_name || "Not Assigned"}</div></div>
              <div className="info-chip"><div className="info-chip-label">Date</div><div className="info-chip-value">{viewSession.session_date || "—"}</div></div>
              <div className="info-chip"><div className="info-chip-label">Time</div><div className="info-chip-value">{viewSession.session_time || "—"}</div></div>
              <div className="info-chip"><div className="info-chip-label">Status</div><div className="info-chip-value"><StatusBadge status={viewSession.status} /></div></div>
              <div className="info-chip"><div className="info-chip-label">Webinar ID</div><div className="info-chip-value">{viewSession.webinar_id || "—"}</div></div>
              <div className="info-chip"><div className="info-chip-label">Zoom ID</div><div className="info-chip-value">{viewSession.zoom_id || "—"}</div></div>
            </div>

            <div style={{ marginTop: "20px", display: "flex", gap: "12px" }}>
              <button className="btn btn-ghost" onClick={() => { setViewSession(null); editSession(viewSession); }}>✏️ Edit</button>
              <button className="btn btn-ghost" onClick={() => { setViewSession(null); duplicateSession(viewSession); }}>📄 Duplicate</button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule modal */}
      {rescheduleSession && (
        <div className="modal-overlay" onClick={() => setRescheduleSession(null)}>
          <div className="modal-panel modal-panel-narrow" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="card-title" style={{ margin: 0 }}>Reschedule Session</h2>
              <button className="btn btn-ghost" onClick={() => setRescheduleSession(null)}>✕ Close</button>
            </div>

            <p className="hint-text" style={{ marginTop: 0 }}>{rescheduleSession.topic}</p>

            <div className="info-grid" style={{ marginBottom: "16px" }}>
              <div className="info-chip"><div className="info-chip-label">Current Date</div><div className="info-chip-value">{rescheduleSession.session_date || "—"}</div></div>
              <div className="info-chip"><div className="info-chip-label">Current Time</div><div className="info-chip-value">{rescheduleSession.session_time || "—"}</div></div>
            </div>

            <div className="form-grid">
              <Field label="New Date">
                <input
                  type="date"
                  className="styled-input"
                  style={inputStyle}
                  value={rescheduleForm.session_date}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, session_date: e.target.value })}
                />
              </Field>
              <Field label="New Time">
                <input
                  type="time"
                  className="styled-input"
                  style={inputStyle}
                  value={rescheduleForm.session_time}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, session_time: e.target.value })}
                />
              </Field>
            </div>

            <div style={{ marginTop: "16px" }}>
              <Field label="Reason for Rescheduling (optional)">
                <textarea
                  className="styled-input"
                  style={{ ...inputStyle, minHeight: "60px", resize: "vertical" }}
                  value={rescheduleForm.reason}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, reason: e.target.value })}
                />
              </Field>
            </div>

            <div style={{ marginTop: "20px", display: "flex", gap: "12px" }}>
              <button className="btn btn-primary" onClick={submitReschedule} disabled={rescheduling}>
                {rescheduling ? "Rescheduling…" : "Reschedule"}
              </button>
              <button className="btn btn-ghost" onClick={() => setRescheduleSession(null)}>Cancel</button>
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

        .stat-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 14px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: #ffffff;
          border-radius: 14px;
          padding: 16px 18px;
          border: 1px solid #eef2f7;
          border-left-width: 4px;
          border-left-style: solid;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .stat-card-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
        }

        .stat-card-value {
          font-size: 24px;
          font-weight: 800;
          line-height: 1.1;
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
          margin: 0 0 18px;
          font-size: 17px;
          color: #1e293b;
        }

        .form-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 18px;
        }

        .tip-box {
          background: #fffbeb;
          border: 1px solid #fde68a;
          color: #92400e;
          font-size: 12.5px;
          padding: 8px 14px;
          border-radius: 10px;
          max-width: 360px;
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

        .conflict-warning {
          margin-top: 16px;
          background: #fef3c7;
          border: 1px solid #fde68a;
          color: #92400e;
          border-radius: 10px;
          padding: 12px 16px;
          font-size: 13px;
          display: flex;
          flex-direction: column;
          gap: 4px;
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

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-sm {
          padding: 8px 14px;
          font-size: 12.5px;
          border-radius: 8px;
          white-space: nowrap;
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

        .tabs-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 24px;
        }

        .tab-btn {
          background: #ffffff;
          border: 1px solid #eef2f7;
          border-radius: 999px;
          padding: 9px 16px;
          font-size: 13px;
          font-weight: 700;
          color: #64748b;
          cursor: pointer;
          transition: all 0.15s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .tab-btn:hover {
          border-color: #f59e0b;
        }

        .tab-btn-active {
          background: linear-gradient(120deg, #f59e0b, #fbbf24);
          color: #0f172a;
          border-color: transparent;
        }

        .list-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 14px;
          margin-bottom: 18px;
        }

        .filters-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 12px;
        }

        .filter-select {
          width: auto;
          min-width: 140px;
        }

        .select-wrap {
          position: relative;
        }

        .select-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          opacity: 0.85;
          pointer-events: none;
        }

        .select-with-icon {
          padding-left: 32px !important;
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

        .search-input {
          width: 220px;
          padding-left: 34px !important;
        }

        .view-toggle {
          display: inline-flex;
          gap: 6px;
          margin-left: auto;
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

        .pagination-rows {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12.5px;
          color: #64748b;
        }

        .calendar-toolbar-right {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
        }

        .calendar-nav {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .calendar-month-label {
          font-weight: 700;
          color: #1e293b;
          min-width: 140px;
          text-align: center;
        }

        .calendar-view-toggle {
          display: inline-flex;
          gap: 6px;
          background: #f1f5f9;
          padding: 4px;
          border-radius: 10px;
        }

        .calendar-view-btn {
          border: none;
          background: transparent;
          padding: 7px 14px;
          border-radius: 8px;
          font-size: 12.5px;
          font-weight: 700;
          color: #64748b;
          cursor: pointer;
        }

        .calendar-view-btn-active {
          background: #ffffff;
          color: #b45309;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.1);
        }

        .calendar-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 18px;
          font-size: 12px;
          color: #64748b;
          margin-bottom: 14px;
        }

        .calendar-legend span {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
          flex-shrink: 0;
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 6px;
        }

        .calendar-grid-header {
          margin-bottom: 6px;
        }

        .calendar-weekday {
          text-align: center;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #94a3b8;
          padding: 4px 0;
        }

        .calendar-cell {
          min-height: 90px;
          background: #f8fafc;
          border: 1px solid #eef2f7;
          border-radius: 10px;
          padding: 6px 8px;
        }

        .calendar-cell-today {
          border-color: #f59e0b;
          background: #fffbeb;
        }

        .calendar-day-number {
          font-size: 12px;
          font-weight: 700;
          color: #64748b;
          margin-bottom: 4px;
        }

        .calendar-session {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 10.5px;
          color: #1e293b;
          margin-bottom: 2px;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .calendar-session-time {
          color: #64748b;
          flex-shrink: 0;
        }

        .calendar-session-topic {
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .calendar-more {
          font-size: 10px;
          color: #94a3b8;
          font-weight: 600;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.55);
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 40px 20px;
          overflow-y: auto;
          z-index: 100;
        }

        .modal-panel {
          background: #ffffff;
          border-radius: 16px;
          padding: 28px 32px;
          width: 100%;
          max-width: 680px;
          box-shadow: 0 24px 48px -12px rgba(15, 23, 42, 0.35);
        }

        .modal-panel-narrow {
          max-width: 520px;
        }

        .modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          padding-bottom: 16px;
          border-bottom: 1px solid #eef2f7;
          margin-bottom: 16px;
        }

        .hint-text {
          font-size: 13px;
          color: #64748b;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 14px;
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
    </ProtectedRoute>
  );
}
