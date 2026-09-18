import { useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "../components/Sidebar";
import ProtectedRoute from "../components/ProtectedRoute";

const API = "http://127.0.0.1:8000";

// Small hand-drawn icon set (no external icon library, no new dependency) —
// used instead of emoji so these render as consistent flat line icons
// across every OS/browser.
const ICON_PATHS = {
  users: (
    <>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  userCheck: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <polyline points="17 11 19 13 23 9" />
    </>
  ),
  userX: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="18" y1="8" x2="23" y2="13" />
      <line x1="23" y1="8" x2="18" y2="13" />
    </>
  ),
  tag: (
    <>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </>
  ),
  mail: (
    <>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </>
  ),
  phone: (
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  ),
  linkedin: (
    <>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
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
  clock: (
    <>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
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
  search: (
    <>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </>
  ),
  camera: (
    <>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
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

function photoUrl(mentor) {
  if (!mentor || !mentor.photo_path) return null;
  return `${API}/mentors/${mentor.id}/photo?v=${encodeURIComponent(mentor.photo_path)}`;
}

function Avatar({ mentor, size = 36 }) {
  const [broken, setBroken] = useState(false);
  const url = photoUrl(mentor);

  if (url && !broken) {
    return (
      <img
        src={url}
        alt={mentor.name}
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
        background: `${avatarColor(mentor?.name)}22`,
        color: avatarColor(mentor?.name),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size <= 36 ? "13px" : "22px",
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {initials(mentor?.name)}
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
        background: isInactive ? "#fee2e2" : "#dcfce7",
        color: isInactive ? "#b91c1c" : "#15803d",
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
          background: isInactive ? "#ef4444" : "#22c55e",
        }}
      />
      {isInactive ? "Inactive" : "Active"}
    </span>
  );
}

function ExpertiseTags({ value, small }) {
  const tags = (value || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  if (tags.length === 0) return <span className="muted">—</span>;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
      {tags.map((t) => (
        <span key={t} className={small ? "tag tag-sm" : "tag"}>
          {t}
        </span>
      ))}
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

const errorInputStyle = { ...inputStyle, borderColor: "#ef4444", background: "#fef2f2" };

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

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  linkedin: "",
  hourly_rate: "",
};

const ROWS_PER_PAGE = 5;

function formatMinutes(totalMinutes) {
  const mins = Number(totalMinutes) || 0;
  if (mins <= 0) return "0h";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
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
      <button
        onClick={onClose}
        style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontWeight: 700 }}
      >
        ✕
      </button>
    </div>
  );
}

export default function Mentors() {
  const [mentors, setMentors] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loadingMentors, setLoadingMentors] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [toast, setToast] = useState(null);

  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [expertiseTags, setExpertiseTags] = useState([]);
  const [expertiseInput, setExpertiseInput] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const photoInputRef = useRef(null);

  const [search, setSearch] = useState("");
  const [expertiseFilter, setExpertiseFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [openMenuId, setOpenMenuId] = useState(null);
  const [viewMentor, setViewMentor] = useState(null);
  const [drawerTab, setDrawerTab] = useState("overview");

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

  const loadMentors = async () => {
    setLoadingMentors(true);
    setLoadError(false);
    try {
      const res = await fetch(`${API}/mentors`);
      if (!res.ok) throw new Error("bad status");
      const data = await res.json();
      setMentors(data);
    } catch (err) {
      setLoadError(true);
    } finally {
      setLoadingMentors(false);
    }
  };

  const loadSessions = async () => {
    try {
      const res = await fetch(`${API}/sessions`);
      const data = await res.json();
      setSessions(Array.isArray(data) ? data : []);
    } catch (err) {
      // Non-fatal — session counts just fall back to 0.
    }
  };

  useEffect(() => {
    loadMentors();
    loadSessions();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, expertiseFilter, statusFilter]);

  // ---- Real per-mentor session stats (from the existing Sessions data — no fake numbers) ----
  const sessionStatsByMentor = useMemo(() => {
    const stats = {};
    sessions.forEach((s) => {
      if (!s.mentor_name) return;
      if (!stats[s.mentor_name]) stats[s.mentor_name] = { count: 0, minutes: 0, list: [] };
      stats[s.mentor_name].count += 1;
      stats[s.mentor_name].minutes += Number(s.duration) || 0;
      stats[s.mentor_name].list.push(s);
    });
    return stats;
  }, [sessions]);

  const statsFor = (mentor) => sessionStatsByMentor[mentor?.name] || { count: 0, minutes: 0, list: [] };

  const expertiseOptions = useMemo(() => {
    const set = new Set();
    mentors.forEach((m) =>
      (m.expertise || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .forEach((t) => set.add(t))
    );
    return [...set].sort();
  }, [mentors]);

  const totalMentors = mentors.length;
  const activeMentors = mentors.filter((m) => m.status !== "Inactive").length;
  const inactiveMentors = totalMentors - activeMentors;
  const expertiseAreas = expertiseOptions.length;

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setExpertiseTags([]);
    setExpertiseInput("");
    setFormErrors({});
    setEditId(null);
    setPhotoFile(null);
    setPhotoPreview(null);
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  const addExpertiseTag = () => {
    const val = expertiseInput.trim();
    if (!val) return;
    if (!expertiseTags.some((t) => t.toLowerCase() === val.toLowerCase())) {
      setExpertiseTags([...expertiseTags, val]);
    }
    setExpertiseInput("");
  };

  const removeExpertiseTag = (tag) => {
    setExpertiseTags(expertiseTags.filter((t) => t !== tag));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Please choose an image file (JPG, PNG, or WEBP).");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast("Image must be 2MB or smaller.");
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const uploadPhotoIfNeeded = async (mentorId) => {
    if (!photoFile) return;
    const body = new FormData();
    body.append("file", photoFile);
    try {
      const res = await fetch(`${API}/mentors/${mentorId}/photo`, { method: "POST", body });
      if (!res.ok) {
        showToast(await friendlyError(res, "Mentor saved, but the photo upload failed."));
      }
    } catch {
      showToast("Mentor saved, but the photo upload failed.");
    }
  };

  const validate = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = "Name is required.";
    if (!form.email.trim()) {
      errors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = "Enter a valid email address.";
    }
    if (!form.hourly_rate.toString().trim()) {
      errors.hourly_rate = "Hourly rate is required.";
    } else if (Number(form.hourly_rate) < 0 || isNaN(Number(form.hourly_rate))) {
      errors.hourly_rate = "Hourly rate must be a non-negative number.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const buildPayload = (statusOverride) => ({
    name: form.name.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    expertise: expertiseTags.join(", "),
    linkedin: form.linkedin.trim(),
    hourly_rate: form.hourly_rate.toString().trim(),
    status: statusOverride || (editId ? mentors.find((m) => m.id === editId)?.status : "Active") || "Active",
  });

  const createMentor = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/mentors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload("Active")),
      });
      if (!res.ok) {
        showToast(await friendlyError(res, "Failed to create mentor. Please try again."));
        return;
      }
      const data = await res.json();
      await uploadPhotoIfNeeded(data.id);
      showToast("Mentor created successfully.", "success");
      await loadMentors();
      resetForm();
    } catch (err) {
      showToast("Failed to create mentor. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const updateMentor = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/mentors/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      if (!res.ok) {
        showToast(await friendlyError(res, "Failed to update mentor. Please try again."));
        return;
      }
      await uploadPhotoIfNeeded(editId);
      showToast("Mentor updated successfully.", "success");
      await loadMentors();
      resetForm();
    } catch (err) {
      showToast("Failed to update mentor. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const editMentor = (mentor) => {
    setEditId(mentor.id);
    setForm({
      name: mentor.name || "",
      email: mentor.email || "",
      phone: mentor.phone || "",
      linkedin: mentor.linkedin || "",
      hourly_rate: mentor.hourly_rate || "",
    });
    setExpertiseTags(
      (mentor.expertise || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    );
    setExpertiseInput("");
    setFormErrors({});
    setPhotoFile(null);
    setPhotoPreview(null);
    setOpenMenuId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const setMentorStatus = async (mentor, nextStatus) => {
    setOpenMenuId(null);
    if (nextStatus === "Inactive") {
      const stat = statsFor(mentor);
      const warn =
        stat.count > 0
          ? `${mentor.name} has ${stat.count} session${stat.count === 1 ? "" : "s"} on record. Deactivating keeps all history intact — they just won't be selectable for new sessions. Continue?`
          : `Deactivate ${mentor.name}? They won't be selectable for new sessions until reactivated.`;
      if (!window.confirm(warn)) return;
    }
    try {
      const res = await fetch(`${API}/mentors/${mentor.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: mentor.name,
          email: mentor.email,
          phone: mentor.phone || "",
          expertise: mentor.expertise || "",
          linkedin: mentor.linkedin || "",
          hourly_rate: mentor.hourly_rate || "",
          status: nextStatus,
        }),
      });
      if (!res.ok) {
        showToast(await friendlyError(res, "Failed to update mentor status."));
        return;
      }
      showToast(nextStatus === "Inactive" ? "Mentor deactivated successfully." : "Mentor activated successfully.", "success");
      await loadMentors();
      if (viewMentor?.id === mentor.id) setViewMentor({ ...mentor, status: nextStatus });
    } catch (err) {
      showToast("Failed to update mentor status.");
    }
  };

  const deleteMentor = async (mentor) => {
    setOpenMenuId(null);
    const stat = statsFor(mentor);
    const warning =
      stat.count > 0
        ? `${mentor.name} has ${stat.count} session${stat.count === 1 ? "" : "s"} on record. Deleting removes the mentor permanently (sessions will keep the mentor's name as text, but the mentor record itself is gone). Consider Deactivate instead. Delete anyway?`
        : `Delete ${mentor.name}? This cannot be undone.`;
    if (!window.confirm(warning)) return;

    try {
      const res = await fetch(`${API}/mentors/${mentor.id}`, { method: "DELETE" });
      if (!res.ok) {
        showToast(await friendlyError(res, "Failed to delete mentor."));
        return;
      }
      showToast("Mentor deleted.", "success");
      if (editId === mentor.id) resetForm();
      if (viewMentor?.id === mentor.id) setViewMentor(null);
      await loadMentors();
    } catch (err) {
      showToast("Failed to delete mentor.");
    }
  };

  const filteredMentors = useMemo(() => {
    const q = search.toLowerCase();
    return mentors.filter((mentor) => {
      const matchesSearch =
        !q ||
        (mentor.name || "").toLowerCase().includes(q) ||
        (mentor.email || "").toLowerCase().includes(q) ||
        (mentor.expertise || "").toLowerCase().includes(q);
      if (!matchesSearch) return false;

      if (expertiseFilter) {
        const tags = (mentor.expertise || "").split(",").map((t) => t.trim());
        if (!tags.includes(expertiseFilter)) return false;
      }

      if (statusFilter) {
        const status = mentor.status === "Inactive" ? "Inactive" : "Active";
        if (status !== statusFilter) return false;
      }

      return true;
    });
  }, [mentors, search, expertiseFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredMentors.length / ROWS_PER_PAGE));
  const pagedMentors = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    return filteredMentors.slice(start, start + ROWS_PER_PAGE);
  }, [filteredMentors, currentPage]);

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

  const openView = (mentor) => {
    setViewMentor(mentor);
    setDrawerTab("overview");
    setOpenMenuId(null);
  };

  return (
    <ProtectedRoute permission={["mentors", "view"]}>
      <Sidebar />

      <div
        style={{
          marginLeft: "var(--om-sidebar-width, 280px)", transition: "margin-left 0.25s ease",
          padding: "32px 36px 60px",
          background: "#f1f5f9",
          minHeight: "100vh",
        }}
        onClick={() => openMenuId && setOpenMenuId(null)}
      >
        {/* Header */}
        <div className="page-hero">
          <div className="page-hero-blob" />
          <div className="page-hero-content">
            <div className="page-hero-eyebrow">Operations</div>
            <h1 className="page-hero-title">Mentor Management</h1>
            <p className="page-hero-subtitle">
              Add and manage mentors who can be assigned to live sessions and webinars.
            </p>
          </div>

          <div className="hero-stat-row">
            <div className="hero-stat" style={{ background: "rgba(59,130,246,0.16)" }}>
              <Icon name="users" size={18} color="#93c5fd" />
              <div>
                <div className="hero-stat-value">{totalMentors}</div>
                <div className="hero-stat-label">Total Mentors</div>
              </div>
            </div>
            <div className="hero-stat" style={{ background: "rgba(34,197,94,0.16)" }}>
              <Icon name="userCheck" size={18} color="#86efac" />
              <div>
                <div className="hero-stat-value">{activeMentors}</div>
                <div className="hero-stat-label">Active Mentors</div>
              </div>
            </div>
            <div className="hero-stat" style={{ background: "rgba(239,68,68,0.16)" }}>
              <Icon name="userX" size={18} color="#fca5a5" />
              <div>
                <div className="hero-stat-value">{inactiveMentors}</div>
                <div className="hero-stat-label">Inactive Mentors</div>
              </div>
            </div>
            <div className="hero-stat" style={{ background: "rgba(139,92,246,0.18)" }}>
              <Icon name="tag" size={18} color="#c4b5fd" />
              <div>
                <div className="hero-stat-value">{expertiseAreas}</div>
                <div className="hero-stat-label">Expertise Areas</div>
              </div>
            </div>
          </div>
        </div>

        {/* Create / Update form */}
        <div className="card form-card">
          <div className="form-card-header">
            <h2 className="card-title" style={{ margin: 0 }}>
              {editId ? "✏️ Update Mentor" : "➕ Add Mentor"}
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span className="hint-text">All fields are optional except Name, Email and Hourly Rate</span>
              <button className="btn btn-ghost" onClick={resetForm} type="button">
                Clear
              </button>
            </div>
          </div>

          <div className="add-mentor-grid">
            <div className="photo-upload-col">
              <div className="photo-preview-wrap" onClick={() => photoInputRef.current?.click()}>
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="photo-preview-img" />
                ) : editId && photoUrl(mentors.find((m) => m.id === editId)) ? (
                  <img
                    src={photoUrl(mentors.find((m) => m.id === editId))}
                    alt="Current"
                    className="photo-preview-img"
                  />
                ) : (
                  <Icon name="camera" size={26} color="#94a3b8" />
                )}
              </div>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                ref={photoInputRef}
                onChange={handlePhotoChange}
                style={{ display: "none" }}
              />
              <button className="btn btn-ghost btn-sm" type="button" onClick={() => photoInputRef.current?.click()}>
                Upload Photo
              </button>
              <div className="hint-text" style={{ textAlign: "center" }}>JPG, PNG (Max 2MB)</div>
              <div className="hint-text" style={{ textAlign: "center", maxWidth: "140px" }}>
                Recommended: square, 400×400px, face centered &amp; filling the frame
              </div>
            </div>

            <div className="form-grid">
              <Field label="Name" required error={formErrors.name}>
                <input
                  className="styled-input"
                  style={formErrors.name ? errorInputStyle : inputStyle}
                  placeholder="e.g. Krish Naik"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </Field>

              <Field label="Email" required error={formErrors.email}>
                <input
                  className="styled-input"
                  style={formErrors.email ? errorInputStyle : inputStyle}
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

              <Field label="Expertise" required error={formErrors.expertise}>
                <div className="tag-input-box">
                  {expertiseTags.map((tag) => (
                    <span key={tag} className="tag tag-removable">
                      {tag}
                      <button type="button" onClick={() => removeExpertiseTag(tag)} className="tag-remove-btn">
                        <Icon name="x" size={11} />
                      </button>
                    </span>
                  ))}
                  <input
                    className="tag-input"
                    placeholder={expertiseTags.length === 0 ? "Select or type to add expertise" : ""}
                    value={expertiseInput}
                    onChange={(e) => setExpertiseInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        addExpertiseTag();
                      } else if (e.key === "Backspace" && !expertiseInput && expertiseTags.length > 0) {
                        removeExpertiseTag(expertiseTags[expertiseTags.length - 1]);
                      }
                    }}
                    onBlur={addExpertiseTag}
                    list="expertise-suggestions"
                  />
                  <datalist id="expertise-suggestions">
                    {expertiseOptions.map((opt) => (
                      <option key={opt} value={opt} />
                    ))}
                  </datalist>
                </div>
              </Field>

              <Field label="LinkedIn">
                <input
                  className="styled-input"
                  style={inputStyle}
                  placeholder="https://linkedin.com/in/..."
                  value={form.linkedin}
                  onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                />
              </Field>

              <Field label="Hourly Rate (₹)" required error={formErrors.hourly_rate}>
                <input
                  type="text"
                  className="styled-input"
                  style={formErrors.hourly_rate ? errorInputStyle : inputStyle}
                  placeholder="e.g. 5000"
                  value={form.hourly_rate}
                  onChange={(e) => setForm({ ...form, hourly_rate: e.target.value })}
                />
              </Field>
            </div>
          </div>

          <div style={{ marginTop: "22px", display: "flex", gap: "12px" }}>
            {editId ? (
              <>
                <button className="btn btn-primary" onClick={updateMentor} disabled={saving}>
                  {saving ? "Saving…" : "Update Mentor"}
                </button>
                <button className="btn btn-ghost" onClick={resetForm}>
                  Cancel
                </button>
              </>
            ) : (
              <button className="btn btn-primary" onClick={createMentor} disabled={saving}>
                {saving ? "Saving…" : "Create Mentor"}
              </button>
            )}
          </div>
        </div>

        {/* Mentor list */}
        <div className="card" style={{ marginTop: "24px" }}>
          <div className="list-toolbar">
            <h2 className="card-title" style={{ margin: 0 }}>
              👨‍🏫 Mentor List
              <div className="hint-text" style={{ fontWeight: 400, marginTop: "2px" }}>
                Manage and view all mentors
              </div>
            </h2>

            <div className="filters-row">
              <div className="search-wrap">
                <span className="search-icon"><Icon name="search" size={13} color="#94a3b8" /></span>
                <input
                  type="text"
                  placeholder="Search mentors by name, email or expertise..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="styled-input search-input"
                  style={{ ...inputStyle, width: "300px" }}
                />
              </div>

              <select
                className="styled-input filter-select"
                style={{ ...inputStyle, width: "auto" }}
                value={expertiseFilter}
                onChange={(e) => setExpertiseFilter(e.target.value)}
              >
                <option value="">All Expertise</option>
                {expertiseOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>

              <select
                className="styled-input filter-select"
                style={{ ...inputStyle, width: "auto" }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="table-wrap">
            {loadingMentors ? (
              <div className="empty-state">Loading mentors…</div>
            ) : loadError ? (
              <div className="empty-state">
                <div style={{ fontSize: "32px", marginBottom: "8px" }}>⚠️</div>
                Couldn't load mentors. Please refresh and try again.
              </div>
            ) : (
              <>
                <table className="styled-table">
                  <thead>
                    <tr>
                      <th>Mentor</th>
                      <th>Expertise</th>
                      <th>Status</th>
                      <th>Sessions</th>
                      <th>Hourly Rate</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {pagedMentors.map((mentor, i) => {
                      const stat = statsFor(mentor);
                      return (
                        <tr key={mentor.id} style={{ animationDelay: `${i * 0.03}s` }}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <Avatar mentor={mentor} />
                              <div>
                                <div className="strong">{mentor.name}</div>
                                <div className="muted" style={{ fontSize: "12px" }}>{mentor.email}</div>
                              </div>
                            </div>
                          </td>
                          <td><ExpertiseTags value={mentor.expertise} small /></td>
                          <td><StatusBadge status={mentor.status} /></td>
                          <td className="strong">{stat.count}</td>
                          <td className="strong">
                            {mentor.hourly_rate ? `₹${mentor.hourly_rate}/hr` : "—"}
                          </td>
                          <td style={{ whiteSpace: "nowrap", position: "relative" }}>
                            <button className="btn btn-icon" onClick={() => openView(mentor)}>
                              <Icon name="eye" size={13} /> View
                            </button>
                            <button className="btn btn-icon" onClick={() => editMentor(mentor)}>
                              <Icon name="edit" size={13} /> Edit
                            </button>
                            <button
                              className="btn btn-icon btn-dots"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(openMenuId === mentor.id ? null : mentor.id);
                              }}
                            >
                              <DotsIcon size={15} />
                            </button>

                            {openMenuId === mentor.id && (
                              <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
                                {mentor.status === "Inactive" ? (
                                  <button onClick={() => setMentorStatus(mentor, "Active")}>
                                    <Icon name="power" size={13} /> Activate Mentor
                                  </button>
                                ) : (
                                  <button onClick={() => setMentorStatus(mentor, "Inactive")}>
                                    <Icon name="power" size={13} /> Deactivate Mentor
                                  </button>
                                )}
                                <button className="dropdown-danger" onClick={() => deleteMentor(mentor)}>
                                  <Icon name="trash" size={13} /> Delete Mentor
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {filteredMentors.length === 0 && (
                  <div className="empty-state">
                    <div style={{ fontSize: "32px", marginBottom: "8px" }}>👨‍🏫</div>
                    {mentors.length === 0
                      ? "No mentors yet — add your first one above."
                      : "No mentors found."}
                  </div>
                )}

                {filteredMentors.length > 0 && (
                  <div className="pagination-row">
                    <div className="pagination-info">
                      Showing {(currentPage - 1) * ROWS_PER_PAGE + 1} to{" "}
                      {Math.min(currentPage * ROWS_PER_PAGE, filteredMentors.length)} of{" "}
                      {filteredMentors.length} mentors
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
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mentor details drawer */}
      {viewMentor && (
        <div className="drawer-overlay" onClick={() => setViewMentor(null)}>
          <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h2 className="card-title" style={{ margin: 0 }}>Mentor Details</h2>
              <button className="btn btn-ghost" onClick={() => setViewMentor(null)}>
                <Icon name="x" size={16} />
              </button>
            </div>

            <div className="drawer-profile">
              <Avatar mentor={viewMentor} size={72} />
              <div className="drawer-profile-name-row">
                <h3 style={{ margin: 0 }}>{viewMentor.name}</h3>
                <StatusBadge status={viewMentor.status} />
              </div>
              <ExpertiseTags value={viewMentor.expertise} />
            </div>

            <div className="drawer-tabs">
              <button
                className={`drawer-tab ${drawerTab === "overview" ? "drawer-tab-active" : ""}`}
                onClick={() => setDrawerTab("overview")}
              >
                Overview
              </button>
              <button
                className={`drawer-tab ${drawerTab === "sessions" ? "drawer-tab-active" : ""}`}
                onClick={() => setDrawerTab("sessions")}
              >
                Sessions
              </button>
            </div>

            {drawerTab === "overview" ? (
              <>
                <div className="drawer-section">
                  <div className="drawer-section-title">Contact Information</div>
                  <div className="drawer-contact-row">
                    <Icon name="mail" size={14} color="#64748b" />
                    <span>{viewMentor.email || "—"}</span>
                  </div>
                  <div className="drawer-contact-row">
                    <Icon name="phone" size={14} color="#64748b" />
                    <span>{viewMentor.phone || "—"}</span>
                  </div>
                  {viewMentor.linkedin && (
                    <div className="drawer-contact-row">
                      <Icon name="linkedin" size={14} color="#64748b" />
                      <a href={viewMentor.linkedin} target="_blank" rel="noreferrer">{viewMentor.linkedin}</a>
                    </div>
                  )}
                </div>

                <div className="drawer-section">
                  <div className="drawer-section-title">Basic Information</div>
                  <div className="info-grid">
                    <div className="info-chip">
                      <div className="info-chip-label">Hourly Rate</div>
                      <div className="info-chip-value">{viewMentor.hourly_rate ? `₹${viewMentor.hourly_rate}/hr` : "—"}</div>
                    </div>
                    <div className="info-chip">
                      <div className="info-chip-label">Total Sessions</div>
                      <div className="info-chip-value">{statsFor(viewMentor).count}</div>
                    </div>
                  </div>
                </div>

                <div className="drawer-section">
                  <div className="drawer-section-title">Quick Stats</div>
                  <div className="quick-stats-row">
                    <div className="quick-stat">
                      <Icon name="calendar" size={16} color="#b45309" />
                      <div className="quick-stat-value">{statsFor(viewMentor).count}</div>
                      <div className="quick-stat-label">Total Sessions</div>
                    </div>
                    <div className="quick-stat">
                      <Icon name="clock" size={16} color="#0369a1" />
                      <div className="quick-stat-value">{formatMinutes(statsFor(viewMentor).minutes)}</div>
                      <div className="quick-stat-label">Total Hours</div>
                    </div>
                  </div>
                </div>

                <div className="drawer-note">
                  {viewMentor.status === "Inactive"
                    ? "This mentor is deactivated and won't appear when creating new sessions."
                    : "This mentor is available for assignment in live sessions and webinars."}
                </div>
              </>
            ) : (
              <div className="drawer-section">
                <div className="drawer-section-title">Recent Sessions</div>
                {statsFor(viewMentor).list.length === 0 ? (
                  <div className="hint-text">No sessions recorded for this mentor yet.</div>
                ) : (
                  <div className="drawer-sessions-list">
                    {statsFor(viewMentor)
                      .list.slice()
                      .sort((a, b) => `${b.session_date}${b.session_time}`.localeCompare(`${a.session_date}${a.session_time}`))
                      .slice(0, 10)
                      .map((s) => (
                        <div key={s.id} className="drawer-session-row">
                          <div className="drawer-session-date">{s.session_date || "—"}</div>
                          <div>
                            <div className="strong">{s.topic || "Untitled Session"}</div>
                            <div className="muted" style={{ fontSize: "12px" }}>
                              {s.batch_name || "Not Assigned"} · {s.duration ? `${s.duration} min` : "Duration —"}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
                <a href="/sessions" className="btn btn-ghost" style={{ marginTop: "14px", display: "inline-block", textDecoration: "none" }}>
                  View All in Sessions →
                </a>
              </div>
            )}

            <div className="drawer-footer">
              <button className="btn btn-ghost" onClick={() => { setViewMentor(null); editMentor(viewMentor); }}>
                <Icon name="edit" size={13} /> Edit Mentor
              </button>
              {viewMentor.status === "Inactive" ? (
                <button className="btn btn-activate" onClick={() => setMentorStatus(viewMentor, "Active")}>
                  <Icon name="power" size={13} /> Activate Mentor
                </button>
              ) : (
                <button className="btn btn-deactivate" onClick={() => setMentorStatus(viewMentor, "Inactive")}>
                  <Icon name="power" size={13} /> Deactivate
                </button>
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
          gap: 20px;
          flex-wrap: wrap;
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
          max-width: 520px;
        }

        .hero-stat-row {
          position: relative;
          z-index: 1;
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .hero-stat {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 18px;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          min-width: 110px;
        }

        .hero-stat-value {
          font-size: 20px;
          font-weight: 800;
          color: #f8fafc;
          line-height: 1.1;
        }

        .hero-stat-label {
          font-size: 10.5px;
          color: #cbd5e1;
          margin-top: 2px;
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

        .form-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 18px;
        }

        .hint-text {
          font-size: 12px;
          color: #94a3b8;
        }

        .add-mentor-grid {
          display: grid;
          grid-template-columns: 140px 1fr;
          gap: 24px;
        }

        .photo-upload-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .photo-preview-wrap {
          width: 96px;
          height: 96px;
          border-radius: 50%;
          background: #f1f5f9;
          border: 1px dashed #cbd5e1;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
        }

        .photo-preview-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center 22%;
        }

        .btn-sm {
          padding: 6px 12px;
          font-size: 12px;
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

        .tag-input-box {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 6px;
          padding: 7px 10px;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          min-height: 44px;
          box-sizing: border-box;
        }

        .tag-input {
          border: none;
          background: transparent;
          outline: none;
          font-size: 14px;
          flex: 1;
          min-width: 140px;
          padding: 4px;
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
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .btn-ghost:hover {
          background: #e2e8f0;
        }

        .btn-activate {
          background: #dcfce7;
          color: #15803d;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .btn-deactivate {
          background: #fee2e2;
          color: #b91c1c;
          display: inline-flex;
          align-items: center;
          gap: 6px;
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
          width: auto;
          min-width: 150px;
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
          width: 300px;
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
          vertical-align: middle;
        }

        .styled-table td.muted {
          color: #94a3b8;
        }

        .styled-table td.strong {
          font-weight: 600;
        }

        :global(.tag) {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #ede9fe;
          color: #6d28d9;
          font-size: 12px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 999px;
        }

        :global(.tag-sm) {
          font-size: 11px;
          padding: 3px 8px;
        }

        :global(.tag-removable) {
          padding-right: 6px;
        }

        :global(.tag-remove-btn) {
          border: none;
          background: rgba(109, 40, 217, 0.12);
          color: #6d28d9;
          border-radius: 50%;
          width: 15px;
          height: 15px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          padding: 0;
        }

        .btn-icon {
          background: transparent;
          padding: 6px 10px;
          font-size: 13px;
          color: #475569;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }

        .btn-icon:hover {
          background: #f1f5f9;
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

        .drawer-tabs {
          display: flex;
          gap: 20px;
          border-bottom: 1px solid #f1f5f9;
          margin-bottom: 18px;
        }

        .drawer-tab {
          border: none;
          background: none;
          padding: 8px 2px 12px;
          font-size: 13px;
          font-weight: 700;
          color: #94a3b8;
          cursor: pointer;
          border-bottom: 2px solid transparent;
        }

        .drawer-tab-active {
          color: #b45309;
          border-bottom-color: #f59e0b;
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

        .drawer-contact-row a {
          color: #2563eb;
          word-break: break-all;
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
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .quick-stat {
          background: #f8fafc;
          border: 1px solid #eef2f7;
          border-radius: 10px;
          padding: 14px;
          text-align: center;
        }

        .quick-stat-value {
          font-size: 18px;
          font-weight: 800;
          color: #1e293b;
          margin-top: 4px;
        }

        .quick-stat-label {
          font-size: 11px;
          color: #94a3b8;
          margin-top: 2px;
        }

        .drawer-note {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #1e40af;
          font-size: 12.5px;
          padding: 10px 14px;
          border-radius: 10px;
        }

        .drawer-sessions-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .drawer-session-row {
          display: grid;
          grid-template-columns: 90px 1fr;
          gap: 10px;
          padding: 10px;
          background: #f8fafc;
          border: 1px solid #eef2f7;
          border-radius: 10px;
          font-size: 13px;
        }

        .drawer-session-date {
          color: #64748b;
          font-size: 12px;
        }

        .drawer-footer {
          display: flex;
          gap: 10px;
          margin-top: 22px;
          padding-top: 18px;
          border-top: 1px solid #f1f5f9;
        }

        .strong {
          font-weight: 600;
        }

        .muted {
          color: #94a3b8;
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
