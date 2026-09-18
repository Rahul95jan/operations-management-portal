import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import Sidebar from "../components/Sidebar";
import ProtectedRoute from "../components/ProtectedRoute";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const API = "http://127.0.0.1:8000";

const ICON_PATHS = {
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
  menu: (
    <>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </>
  ),
  wallet: (
    <>
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
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
  fileText: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </>
  ),
  hours: (
    <>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
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
  plus: (
    <>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
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
  download: (
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </>
  ),
  send: (
    <>
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </>
  ),
  checkSquare: (
    <>
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </>
  ),
  xCircle: (
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </>
  ),
};

function Icon({ name, size = 16, color = "currentColor", strokeWidth = 2 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
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
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
}
function Avatar({ name, size = 32 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `${avatarColor(name)}22`, color: avatarColor(name), display: "flex", alignItems: "center", justifyContent: "center", fontSize: size <= 32 ? "12px" : "18px", fontWeight: 700, flexShrink: 0 }}>
      {initials(name)}
    </div>
  );
}

function money(v) {
  const n = Number(v) || 0;
  return `₹${n.toLocaleString("en-IN")}`;
}

function monthLabel(m) {
  if (!m) return "—";
  const [y, mo] = m.split("-");
  if (!mo) return m;
  const d = new Date(Number(y), Number(mo) - 1, 1);
  return d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

function fmtDate(d) {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

function isOverdue(inv) {
  if (inv.payment_status !== "Pending" || !inv.due_date) return false;
  return new Date(inv.due_date) < new Date(new Date().toDateString());
}
function displayStatus(inv) {
  return isOverdue(inv) ? "Overdue" : inv.payment_status;
}

function StatusBadge({ status }) {
  const map = {
    Paid: { bg: "#dcfce7", color: "#15803d", dot: "#22c55e" },
    Pending: { bg: "#fef3c7", color: "#b45309", dot: "#f59e0b" },
    Overdue: { bg: "#fee2e2", color: "#b91c1c", dot: "#ef4444" },
  };
  const s = map[status] || map.Pending;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: s.bg, color: s.color, fontSize: "12px", fontWeight: 700, padding: "5px 12px", borderRadius: "999px", whiteSpace: "nowrap" }}>
      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: s.dot }} />
      {status}
    </span>
  );
}

const inputStyle = { width: "100%", padding: "11px 14px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "14px", background: "#f8fafc", boxSizing: "border-box", outline: "none" };
const fieldLabelStyle = { display: "block", fontSize: "12px", fontWeight: 700, letterSpacing: "0.03em", color: "#64748b", marginBottom: "6px" };
function Field({ label, required, children }) {
  return (
    <div>
      <label style={fieldLabelStyle}>{label}{required && <span style={{ color: "#ef4444" }}> *</span>}</label>
      {children}
    </div>
  );
}

const EMPTY_FORM = { mentor_name: "", mentor_email: "", batch_name: "", month: "", sessions: "", hours: "", rate: "", amount: "" };
const ROWS_PER_PAGE = 5;

function Toast({ toast, onClose }) {
  if (!toast) return null;
  const isError = toast.type === "error";
  return (
    <div style={{ position: "fixed", top: "20px", right: "20px", zIndex: 999, background: isError ? "#fee2e2" : "#dcfce7", color: isError ? "#b91c1c" : "#15803d", border: `1px solid ${isError ? "#fecaca" : "#bbf7d0"}`, padding: "12px 18px", borderRadius: "10px", fontSize: "14px", fontWeight: 600, boxShadow: "0 12px 24px -12px rgba(15,23,42,0.35)", display: "flex", alignItems: "center", gap: "10px", maxWidth: "380px" }}>
      <span>{isError ? "⚠️" : "✅"} {toast.message}</span>
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontWeight: 700 }}>✕</button>
    </div>
  );
}

export default function InvoiceGenerator() {
  const router = useRouter();
  const [invoices, setInvoices] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [batches, setBatches] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [validated, setValidated] = useState(false);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [batchFilter, setBatchFilter] = useState("All");
  const [monthFilter, setMonthFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [historyTab, setHistoryTab] = useState("invoices");

  const [openMenuId, setOpenMenuId] = useState(null);
  const [viewInvoice, setViewInvoice] = useState(null);
  const [drawerTab, setDrawerTab] = useState("overview");
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [dateRangeOpen, setDateRangeOpen] = useState(false);
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");

  const showToast = (message, type = "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [i, m, b, s] = await Promise.all([
        fetch(`${API}/invoices`).then((r) => r.json()).catch(() => []),
        fetch(`${API}/mentors`).then((r) => r.json()).catch(() => []),
        fetch(`${API}/batch-names`).then((r) => r.json()).catch(() => []),
        fetch(`${API}/sessions`).then((r) => r.json()).catch(() => []),
      ]);
      setInvoices(Array.isArray(i) ? i : []);
      setMentors(Array.isArray(m) ? m : []);
      setBatches(Array.isArray(b) ? b : []);
      setSessions(Array.isArray(s) ? s : []);
    } catch (err) {
      showToast("Failed to load invoices. Please refresh and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, batchFilter, monthFilter, statusFilter]);

  useEffect(() => {
    setValidated(false);
  }, [form.mentor_name, form.batch_name, form.month, editId]);

  const rangeFilteredInvoices = useMemo(() => {
    if (!rangeFrom && !rangeTo) return invoices;
    return invoices.filter((inv) => {
      if (rangeFrom && inv.month < rangeFrom) return false;
      if (rangeTo && inv.month > rangeTo) return false;
      return true;
    });
  }, [invoices, rangeFrom, rangeTo]);

  // ---- Stat cards (all real, derived from actual invoice records) ----
  const totalPayable = rangeFilteredInvoices.reduce((sum, i) => sum + (Number(i.total_amount) || 0), 0);
  const paidAmount = rangeFilteredInvoices.filter((i) => i.payment_status === "Paid").reduce((sum, i) => sum + (Number(i.total_amount) || 0), 0);
  const overdueList = rangeFilteredInvoices.filter(isOverdue);
  const overdueAmount = overdueList.reduce((sum, i) => sum + (Number(i.total_amount) || 0), 0);
  const pendingList = rangeFilteredInvoices.filter((i) => i.payment_status === "Pending" && !isOverdue(i));
  const pendingAmount = pendingList.reduce((sum, i) => sum + (Number(i.total_amount) || 0), 0);
  const totalInvoices = rangeFilteredInvoices.length;
  const thisMonthKey = new Date().toISOString().slice(0, 7);
  const invoicesThisMonth = rangeFilteredInvoices.filter((i) => i.invoice_date && i.invoice_date.slice(0, 7) === thisMonthKey).length;
  const totalHours = rangeFilteredInvoices.reduce((sum, i) => sum + (Number(i.total_hours) || 0), 0);

  const paidCount = rangeFilteredInvoices.filter((i) => i.payment_status === "Paid").length;
  const pendingCount = pendingList.length;
  const overdueCount = overdueList.length;

  // ---- Monthly Payout Trend (real, grouped by invoice month) ----
  const payoutTrend = useMemo(() => {
    const byMonth = {};
    rangeFilteredInvoices.forEach((i) => {
      if (!i.month) return;
      if (!byMonth[i.month]) byMonth[i.month] = { paid: 0, pending: 0 };
      const amt = Number(i.total_amount) || 0;
      if (i.payment_status === "Paid") byMonth[i.month].paid += amt;
      else byMonth[i.month].pending += amt;
    });
    return Object.keys(byMonth).sort().map((m) => ({ month: m, ...byMonth[m] }));
  }, [rangeFilteredInvoices]);

  // ---- Recent Activity (real, synthesized from actual invoice timestamps) ----
  const recentActivity = useMemo(() => {
    const events = [];
    invoices.forEach((i) => {
      events.push({ ts: i.invoice_date || "", icon: "fileText", text: `Invoice generated — ${i.invoice_number || `#${i.id}`}`, when: fmtDate(i.invoice_date) });
      if (i.payment_status === "Paid" && i.payment_date) {
        events.push({ ts: i.payment_date, icon: "checkCircle", text: `Payment recorded — ${i.invoice_number || `#${i.id}`}`, when: fmtDate(i.payment_date) });
      }
    });
    return events.sort((a, b) => (b.ts || "").localeCompare(a.ts || "")).slice(0, 5);
  }, [invoices]);

  // ---- Generate Invoice form logic ----
  const handleMentorChange = (e) => {
    const selected = e.target.value;
    const mentor = mentors.find((m) => m.name === selected);
    setForm((f) => ({
      ...f,
      mentor_name: selected,
      mentor_email: mentor ? mentor.email : "",
      rate: mentor ? mentor.hourly_rate : "",
      amount: mentor ? Number(f.hours || 0) * Number(mentor.hourly_rate || 0) : f.amount,
    }));
  };

  const handleHoursChange = (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, hours: value, amount: Number(value || 0) * Number(f.rate || 0) }));
  };

  const matchingSessions = useMemo(() => {
    if (!form.mentor_name || !form.batch_name || !form.month) return [];
    return sessions.filter((s) => s.mentor_name === form.mentor_name && s.batch_name === form.batch_name && (s.session_date || "").startsWith(form.month));
  }, [sessions, form.mentor_name, form.batch_name, form.month]);

  // Auto-fill Total Sessions / Total Hours from the real matching sessions —
  // still editable afterwards, since tracked session durations are often
  // estimates rather than the mentor's actual billable hours.
  useEffect(() => {
    if (matchingSessions.length === 0) return;
    const sessionCount = matchingSessions.length;
    const hoursSum = matchingSessions.reduce((sum, s) => sum + (Number(s.duration) || 0), 0) / 60;
    setForm((f) => ({
      ...f,
      sessions: sessionCount,
      hours: hoursSum || f.hours,
      amount: (hoursSum || Number(f.hours) || 0) * Number(f.rate || 0),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchingSessions]);

  const validationChecks = useMemo(() => {
    const hasMentor = !!form.mentor_name;
    const hasBatch = !!form.batch_name;
    const hasMonth = !!form.month;
    const sessionsFound = matchingSessions.length > 0;
    const allHaveDuration = sessionsFound && matchingSessions.every((s) => Number(s.duration) > 0);
    const duplicate = invoices.some((i) => i.id !== editId && i.mentor_name === form.mentor_name && i.batch_name === form.batch_name && i.month === form.month);
    return [
      { label: "Mentor selected", pass: hasMentor },
      { label: "Batch selected", pass: hasBatch },
      { label: "Billing month selected", pass: hasMonth },
      { label: "Sessions found", pass: sessionsFound, advisory: true },
      { label: "All sessions have duration", pass: allHaveDuration, advisory: true },
      { label: "No duplicate invoice", pass: !duplicate },
    ];
  }, [form.mentor_name, form.batch_name, form.month, matchingSessions, invoices, editId]);

  const allChecksPass = validationChecks.filter((c) => !c.advisory).every((c) => c.pass);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditId(null);
    setValidated(false);
  };

  const editInvoice = (inv) => {
    setEditId(inv.id);
    setForm({
      mentor_name: inv.mentor_name,
      mentor_email: inv.mentor_email || "",
      batch_name: inv.batch_name,
      month: inv.month,
      sessions: inv.total_sessions,
      hours: inv.total_hours,
      rate: inv.hourly_rate,
      amount: inv.total_amount,
    });
    setOpenMenuId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveInvoice = async () => {
    if (!form.mentor_name || !form.batch_name || !form.month || !form.sessions || !form.hours) {
      showToast("Please fill all required fields.");
      return;
    }
    setSaving(true);
    const payload = {
      mentor_name: form.mentor_name,
      mentor_email: form.mentor_email,
      batch_name: form.batch_name,
      month: form.month,
      total_sessions: Number(form.sessions),
      total_hours: String(form.hours),
      hourly_rate: String(form.rate),
      total_amount: String(form.amount),
      payment_status: editId ? undefined : "Pending",
    };
    try {
      const url = editId ? `${API}/invoice/${editId}` : `${API}/invoices`;
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok || data.error) {
        showToast(data.detail || data.error || "Failed to save invoice.");
        return;
      }
      showToast(editId ? "Invoice updated successfully." : "Invoice generated successfully.", "success");
      await load();
      resetForm();
    } catch (err) {
      showToast("Server error while saving invoice.");
    } finally {
      setSaving(false);
    }
  };

  const markPaid = async (id) => {
    try {
      const res = await fetch(`${API}/invoice-paid/${id}`, { method: "PUT" });
      if (!res.ok) {
        showToast("Failed to mark invoice as paid.");
        return;
      }
      showToast("Invoice marked as Paid.", "success");
      await load();
      if (viewInvoice?.id === id) setViewInvoice({ ...viewInvoice, payment_status: "Paid" });
    } catch (err) {
      showToast("Failed to mark invoice as paid.");
    }
  };

  const markSelectedPaid = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Mark ${selectedIds.length} invoice(s) as Paid?`)) return;
    await Promise.all(selectedIds.map((id) => fetch(`${API}/invoice-paid/${id}`, { method: "PUT" })));
    showToast(`${selectedIds.length} invoice(s) marked as Paid.`, "success");
    setSelectedIds([]);
    await load();
  };

  const deleteInvoiceRow = async (id) => {
    setOpenMenuId(null);
    if (!window.confirm("Delete this invoice? This cannot be undone.")) return;
    try {
      const res = await fetch(`${API}/invoices/${id}`, { method: "DELETE" });
      if (!res.ok) {
        showToast("Failed to delete invoice.");
        return;
      }
      showToast("Invoice deleted.", "success");
      if (viewInvoice?.id === id) setViewInvoice(null);
      await load();
    } catch (err) {
      showToast("Failed to delete invoice.");
    }
  };

  const sendInvoiceEmail = async (id) => {
    setOpenMenuId(null);
    try {
      const res = await fetch(`${API}/send-invoice/${id}`, { method: "POST" });
      const data = await res.json();
      showToast(data.success ? "Invoice sent to mentor." : data.message || "Failed to send invoice.", data.success ? "success" : "error");
    } catch (err) {
      showToast("Failed to send invoice.");
    }
  };

  const filteredInvoices = useMemo(() => {
    const q = search.toLowerCase();
    return rangeFilteredInvoices.filter((inv) => {
      const matchesSearch = !q || (inv.mentor_name || "").toLowerCase().includes(q) || (inv.batch_name || "").toLowerCase().includes(q) || (inv.invoice_number || "").toLowerCase().includes(q);
      if (!matchesSearch) return false;
      if (batchFilter !== "All" && inv.batch_name !== batchFilter) return false;
      if (monthFilter !== "All" && inv.month !== monthFilter) return false;
      if (statusFilter !== "All" && displayStatus(inv) !== statusFilter) return false;
      return true;
    });
  }, [rangeFilteredInvoices, search, batchFilter, monthFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / ROWS_PER_PAGE));
  const pagedInvoices = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    return filteredInvoices.slice(start, start + ROWS_PER_PAGE);
  }, [filteredInvoices, currentPage]);

  const toggleSelect = (id) => setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleSelectAll = () => setSelectedIds(selectedIds.length === pagedInvoices.length ? [] : pagedInvoices.map((i) => i.id));

  const mentorPayoutSummary = useMemo(() => {
    const map = {};
    rangeFilteredInvoices.forEach((i) => {
      if (!map[i.mentor_name]) map[i.mentor_name] = { name: i.mentor_name, invoices: 0, total: 0, paid: 0, pending: 0 };
      const amt = Number(i.total_amount) || 0;
      map[i.mentor_name].invoices += 1;
      map[i.mentor_name].total += amt;
      if (i.payment_status === "Paid") map[i.mentor_name].paid += amt;
      else map[i.mentor_name].pending += amt;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [rangeFilteredInvoices]);

  const batchPayoutSummary = useMemo(() => {
    const map = {};
    rangeFilteredInvoices.forEach((i) => {
      if (!map[i.batch_name]) map[i.batch_name] = { name: i.batch_name, invoices: 0, total: 0, paid: 0, pending: 0 };
      const amt = Number(i.total_amount) || 0;
      map[i.batch_name].invoices += 1;
      map[i.batch_name].total += amt;
      if (i.payment_status === "Paid") map[i.batch_name].paid += amt;
      else map[i.batch_name].pending += amt;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [rangeFilteredInvoices]);

  const invoiceActivity = (inv) => {
    if (!inv) return [];
    const events = [{ icon: "fileText", text: "Invoice generated", when: fmtDate(inv.invoice_date) }];
    if (inv.payment_status === "Paid") events.push({ icon: "checkCircle", text: "Payment recorded", when: fmtDate(inv.payment_date) });
    return events;
  };

  const logout = () => {
    localStorage.removeItem("loggedIn");
    router.push("/login");
  };

  return (
    <ProtectedRoute>
      <>
        <Sidebar />
        <div
          style={{ marginLeft: "280px", padding: "32px 36px 60px", background: "#f1f5f9", minHeight: "100vh" }}
          onClick={() => { if (openMenuId) setOpenMenuId(null); if (profileMenuOpen) setProfileMenuOpen(false); if (dateRangeOpen) setDateRangeOpen(false); }}
        >
          {/* Top bar — scoped to this page only */}
          <div className="top-bar">
            <div className="top-bar-left">
              <button className="top-bar-menu-btn"><Icon name="menu" size={18} color="#475569" /></button>
              <div className="top-bar-search">
                <span className="search-icon"><Icon name="search" size={14} color="#94a3b8" /></span>
                <input type="text" placeholder="Search anything (mentors, batches, invoices...)" className="styled-input" style={{ ...inputStyle, width: "320px", paddingLeft: "34px" }} />
              </div>
            </div>
            <div className="top-bar-right">
              <button className="top-bar-bell">
                <Icon name="bell" size={18} color="#1e293b" />
                {overdueCount > 0 && <span className="top-bar-badge">{overdueCount}</span>}
              </button>
              <div className="top-bar-profile" onClick={(e) => { e.stopPropagation(); setProfileMenuOpen((v) => !v); }}>
                <Avatar name="Rahul Kumar Singh" />
                <span className="top-bar-profile-name">Rahul Kumar Singh</span>
                <Icon name="chevronDown" size={14} color="#64748b" />
                {profileMenuOpen && (
                  <div className="dropdown-menu top-bar-dropdown" onClick={(e) => e.stopPropagation()}>
                    <button onClick={logout}><Icon name="logout" size={13} /> Logout</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Header */}
          <div className="page-header-row">
            <div>
              <h1 className="page-title">Invoice &amp; Mentor Payouts</h1>
              <p className="page-subtitle">Generate mentor invoices, track payment status, and manage payouts.</p>
            </div>
            <div className="date-range-wrap">
              <button className="btn btn-ghost" onClick={(e) => { e.stopPropagation(); setDateRangeOpen((v) => !v); }}>
                <Icon name="calendar" size={14} /> {rangeFrom || rangeTo ? `${monthLabel(rangeFrom) || "…"} - ${monthLabel(rangeTo) || "…"}` : "All Time"} <Icon name="chevronDown" size={12} />
              </button>
              {dateRangeOpen && (
                <div className="date-range-popover" onClick={(e) => e.stopPropagation()}>
                  <Field label="From"><input type="month" className="styled-input" style={inputStyle} value={rangeFrom} onChange={(e) => setRangeFrom(e.target.value)} /></Field>
                  <Field label="To"><input type="month" className="styled-input" style={inputStyle} value={rangeTo} onChange={(e) => setRangeTo(e.target.value)} /></Field>
                  {(rangeFrom || rangeTo) && <button className="btn btn-ghost" onClick={() => { setRangeFrom(""); setRangeTo(""); }}>Clear</button>}
                </div>
              )}
            </div>
          </div>

          {/* Stat cards */}
          <div className="stat-row">
            <div className="stat-card" style={{ background: "#f0fdf4" }}>
              <div className="stat-card-icon" style={{ background: "#dcfce7", color: "#15803d" }}><Icon name="wallet" size={18} /></div>
              <div><div className="stat-card-value">{money(totalPayable)}</div><div className="stat-card-label">Total Payable</div><div className="stat-card-sub">All generated invoices</div></div>
            </div>
            <div className="stat-card" style={{ background: "#eff6ff" }}>
              <div className="stat-card-icon" style={{ background: "#dbeafe", color: "#1d4ed8" }}><Icon name="checkCircle" size={18} /></div>
              <div><div className="stat-card-value">{money(paidAmount)}</div><div className="stat-card-label">Paid Amount</div><div className="stat-card-sub">{totalPayable ? Math.round((paidAmount / totalPayable) * 100) : 0}% of total</div></div>
            </div>
            <div className="stat-card" style={{ background: "#fffbeb" }}>
              <div className="stat-card-icon" style={{ background: "#fef3c7", color: "#b45309" }}><Icon name="clock" size={18} /></div>
              <div><div className="stat-card-value">{money(pendingAmount)}</div><div className="stat-card-label">Pending Amount</div><div className="stat-card-sub">{totalPayable ? Math.round((pendingAmount / totalPayable) * 100) : 0}% of total</div></div>
            </div>
            <div className="stat-card" style={{ background: "#fef2f2" }}>
              <div className="stat-card-icon" style={{ background: "#fee2e2", color: "#b91c1c" }}><Icon name="alertTriangle" size={18} /></div>
              <div><div className="stat-card-value">{money(overdueAmount)}</div><div className="stat-card-label">Overdue Amount</div><div className="stat-card-sub">{overdueCount} invoice{overdueCount === 1 ? "" : "s"} overdue</div></div>
            </div>
            <div className="stat-card" style={{ background: "#f5f3ff" }}>
              <div className="stat-card-icon" style={{ background: "#ede9fe", color: "#7c3aed" }}><Icon name="fileText" size={18} /></div>
              <div><div className="stat-card-value">{totalInvoices}</div><div className="stat-card-label">Total Invoices</div><div className="stat-card-sub">+{invoicesThisMonth} this month</div></div>
            </div>
            <div className="stat-card" style={{ background: "#ecfeff" }}>
              <div className="stat-card-icon" style={{ background: "#cffafe", color: "#0e7490" }}><Icon name="hours" size={18} /></div>
              <div><div className="stat-card-value">{totalHours}</div><div className="stat-card-label">Total Hours</div><div className="stat-card-sub">Across all sessions</div></div>
            </div>
          </div>

          {/* Payment Status + Monthly Trend + Recent Activity */}
          <div className="insights-grid">
            <div className="card">
              <div className="card-title">Payment Status</div>
              {totalInvoices === 0 ? <div className="empty-state">No invoices yet.</div> : (
                <div className="donut-row">
                  <div style={{ position: "relative", width: "140px" }}>
                    <Doughnut data={{ labels: ["Paid", "Pending", "Overdue"], datasets: [{ data: [paidCount, pendingCount, overdueCount], backgroundColor: ["#22c55e", "#eab308", "#ef4444"] }] }} options={{ plugins: { legend: { display: false } }, cutout: "70%" }} />
                    <div className="donut-center-label">{totalInvoices}<br /><span>Invoices</span></div>
                  </div>
                  <div className="donut-legend">
                    <div><span className="legend-dot" style={{ background: "#22c55e" }} /> Paid <b>{paidCount} ({totalInvoices ? Math.round((paidCount / totalInvoices) * 100) : 0}%)</b></div>
                    <div><span className="legend-dot" style={{ background: "#eab308" }} /> Pending <b>{pendingCount} ({totalInvoices ? Math.round((pendingCount / totalInvoices) * 100) : 0}%)</b></div>
                    <div><span className="legend-dot" style={{ background: "#ef4444" }} /> Overdue <b>{overdueCount} ({totalInvoices ? Math.round((overdueCount / totalInvoices) * 100) : 0}%)</b></div>
                  </div>
                </div>
              )}
            </div>

            <div className="card">
              <div className="card-title">Monthly Payout Trend</div>
              {payoutTrend.length === 0 ? <div className="empty-state">Not enough data yet.</div> : (
                <Bar
                  data={{ labels: payoutTrend.map((d) => monthLabel(d.month)), datasets: [
                    { label: "Paid", data: payoutTrend.map((d) => d.paid), backgroundColor: "#22c55e" },
                    { label: "Pending", data: payoutTrend.map((d) => d.pending), backgroundColor: "#eab308" },
                  ] }}
                  options={{ plugins: { legend: { position: "top", labels: { boxWidth: 10 } } }, scales: { x: { stacked: true }, y: { stacked: true } } }}
                  height={140}
                />
              )}
            </div>

            <div className="card">
              <div className="card-title">Recent Activity</div>
              {recentActivity.length === 0 ? <div className="empty-state">No activity yet.</div> : (
                <div className="activity-list">
                  {recentActivity.map((a, i) => (
                    <div key={i} className="activity-row">
                      <div className="activity-icon"><Icon name={a.icon} size={13} color="#16a34a" /></div>
                      <div style={{ flex: 1 }}><div className="strong" style={{ fontSize: "13px" }}>{a.text}</div></div>
                      <div className="muted" style={{ fontSize: "11.5px" }}>{a.when}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Generate Invoice */}
          <div className="card form-card">
            <h2 className="card-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="icon-badge"><Icon name="plus" size={14} color="#fff" /></span> {editId ? "Update Invoice" : "Generate Invoice"}
            </h2>

            <div className="generate-grid">
              <div className="form-grid">
                <Field label="Mentor" required>
                  <select className="styled-input" style={inputStyle} value={form.mentor_name} onChange={handleMentorChange}>
                    <option value="">Select Mentor</option>
                    {mentors.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
                  </select>
                </Field>
                <Field label="Batch" required>
                  <select className="styled-input" style={inputStyle} value={form.batch_name} onChange={(e) => setForm({ ...form, batch_name: e.target.value })}>
                    <option value="">Select Batch</option>
                    {batches.map((b) => <option key={b.id} value={b.batch_name}>{b.batch_name}</option>)}
                  </select>
                </Field>
                <Field label="Billing Month" required>
                  <input type="month" className="styled-input" style={inputStyle} value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} />
                </Field>
                <Field label="Total Sessions">
                  <input type="number" className="styled-input" style={inputStyle} value={form.sessions} onChange={(e) => setForm({ ...form, sessions: e.target.value })} />
                </Field>
                <Field label="Total Hours">
                  <input type="number" className="styled-input" style={inputStyle} value={form.hours} onChange={handleHoursChange} />
                </Field>
                <Field label="Hourly Rate">
                  <input className="styled-input" readOnly value={form.rate ? `₹${form.rate}` : ""} style={{ ...inputStyle, background: "#f1f5f9", color: "#64748b" }} />
                </Field>
                <Field label="Total Amount">
                  <input className="styled-input" readOnly value={form.amount ? money(form.amount) : ""} style={{ ...inputStyle, background: "#f1f5f9", color: "#64748b", fontWeight: 700 }} />
                </Field>
                <div style={{ display: "flex", alignItems: "flex-end" }}>
                  <button className="btn btn-validate" onClick={() => setValidated(true)}>
                    <Icon name="checkSquare" size={14} /> Validate Data
                  </button>
                </div>
              </div>

              <div className="validation-panel">
                <div className="validation-title">Invoice Validation</div>
                {validationChecks.map((c) => {
                  const state = c.pass ? "pass" : c.advisory ? "advisory" : "fail";
                  return (
                    <div key={c.label} className={`validation-row validation-${state}`}>
                      <Icon name={c.pass ? "checkCircle" : c.advisory ? "alertTriangle" : "xCircle"} size={14} />
                      <span>{c.label}{c.advisory && !c.pass ? " (not required)" : ""}</span>
                    </div>
                  );
                })}
                <button
                  className="btn btn-primary"
                  style={{ width: "100%", justifyContent: "center", marginTop: "14px" }}
                  disabled={!allChecksPass || !validated || saving}
                  onClick={saveInvoice}
                >
                  {saving ? "Saving…" : "Preview & Generate →"}
                </button>
              </div>
            </div>

            {editId && (
              <div style={{ marginTop: "14px" }}>
                <button className="btn btn-ghost" onClick={resetForm}>Cancel Edit</button>
              </div>
            )}
          </div>

          {/* History card with tabs */}
          <div className="card" style={{ marginTop: "24px" }}>
            <div className="history-tabs">
              <button className={`history-tab ${historyTab === "invoices" ? "history-tab-active" : ""}`} onClick={() => setHistoryTab("invoices")}>Invoice History</button>
              <button className={`history-tab ${historyTab === "mentor" ? "history-tab-active" : ""}`} onClick={() => setHistoryTab("mentor")}>Mentor Payout Summary</button>
              <button className={`history-tab ${historyTab === "batch" ? "history-tab-active" : ""}`} onClick={() => setHistoryTab("batch")}>Batch Payout Summary</button>
            </div>

            {historyTab === "invoices" && (
              <>
                <div className="list-toolbar">
                  <div className="filters-row">
                    <div className="search-wrap">
                      <span className="search-icon"><Icon name="search" size={13} color="#94a3b8" /></span>
                      <input type="text" placeholder="Search invoice no., mentor, batch..." value={search} onChange={(e) => setSearch(e.target.value)} className="styled-input" style={{ ...inputStyle, width: "260px", paddingLeft: "34px" }} />
                    </div>
                    <select className="styled-input filter-select" style={{ ...inputStyle, width: "auto" }} value={batchFilter} onChange={(e) => setBatchFilter(e.target.value)}>
                      <option value="All">All Batches</option>
                      {[...new Set(invoices.map((i) => i.batch_name))].map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                    <select className="styled-input filter-select" style={{ ...inputStyle, width: "auto" }} value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}>
                      <option value="All">All Months</option>
                      {[...new Set(invoices.map((i) => i.month))].sort().map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
                    </select>
                    <select className="styled-input filter-select" style={{ ...inputStyle, width: "auto" }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                      <option value="All">All Status</option>
                      <option value="Paid">Paid</option>
                      <option value="Pending">Pending</option>
                      <option value="Overdue">Overdue</option>
                    </select>
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <a href={`${API}/export-invoices`} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
                      <button className="btn btn-ghost"><Icon name="download" size={13} /> Export</button>
                    </a>
                    {selectedIds.length > 0 && (
                      <button className="btn btn-mark-paid" onClick={markSelectedPaid}>Mark {selectedIds.length} as Paid</button>
                    )}
                  </div>
                </div>

                <div className="table-wrap">
                  {loading ? (
                    <div className="empty-state">Loading invoices…</div>
                  ) : (
                    <>
                      <table className="styled-table">
                        <thead>
                          <tr>
                            <th><input type="checkbox" checked={pagedInvoices.length > 0 && selectedIds.length === pagedInvoices.length} onChange={toggleSelectAll} /></th>
                            <th>Invoice No.</th>
                            <th>Mentor</th>
                            <th>Batch</th>
                            <th>Month</th>
                            <th>Sessions</th>
                            <th>Hours</th>
                            <th>Amount</th>
                            <th>Invoice Date</th>
                            <th>Due Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pagedInvoices.map((inv, i) => (
                            <tr key={inv.id} style={{ animationDelay: `${i * 0.03}s` }}>
                              <td><input type="checkbox" checked={selectedIds.includes(inv.id)} onChange={() => toggleSelect(inv.id)} /></td>
                              <td className="muted">{inv.invoice_number || `#${inv.id}`}</td>
                              <td className="strong">{inv.mentor_name}</td>
                              <td>{inv.batch_name}</td>
                              <td>{monthLabel(inv.month)}</td>
                              <td>{inv.total_sessions}</td>
                              <td>{inv.total_hours}</td>
                              <td className="strong">{money(inv.total_amount)}</td>
                              <td className="muted">{fmtDate(inv.invoice_date)}</td>
                              <td className="muted">{fmtDate(inv.due_date)}</td>
                              <td><StatusBadge status={displayStatus(inv)} /></td>
                              <td style={{ whiteSpace: "nowrap", position: "relative" }}>
                                <button className="btn btn-icon" onClick={() => { setViewInvoice(inv); setDrawerTab("overview"); }}><Icon name="eye" size={13} /></button>
                                <a href={`${API}/download-invoice/${inv.id}`} target="_blank" rel="noreferrer" className="btn btn-icon" style={{ textDecoration: "none" }}><Icon name="download" size={13} /></a>
                                <button className="btn btn-icon" onClick={() => sendInvoiceEmail(inv.id)}><Icon name="send" size={13} /></button>
                                <button className="btn btn-icon btn-dots" onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === inv.id ? null : inv.id); }}><DotsIcon size={15} /></button>
                                {openMenuId === inv.id && (
                                  <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
                                    <button onClick={() => editInvoice(inv)}><Icon name="edit" size={13} /> Edit Invoice</button>
                                    {inv.payment_status === "Pending" && <button onClick={() => markPaid(inv.id)}><Icon name="checkCircle" size={13} /> Mark as Paid</button>}
                                    <button className="dropdown-danger" onClick={() => deleteInvoiceRow(inv.id)}><Icon name="trash" size={13} /> Delete Invoice</button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {filteredInvoices.length === 0 && (
                        <div className="empty-state"><div style={{ fontSize: "32px", marginBottom: "8px" }}>📄</div>{invoices.length === 0 ? "No invoices yet — generate your first one above." : "No invoices match your filters."}</div>
                      )}
                      {filteredInvoices.length > 0 && (
                        <div className="pagination-row">
                          <div className="pagination-info">Showing {(currentPage - 1) * ROWS_PER_PAGE + 1} to {Math.min(currentPage * ROWS_PER_PAGE, filteredInvoices.length)} of {filteredInvoices.length} invoices</div>
                          <div className="pagination-controls">
                            <button className="pagination-arrow-btn" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>‹</button>
                            <span className="pagination-page-btn pagination-page-btn-active">{currentPage}</span>
                            <button className="pagination-arrow-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>›</button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            )}

            {historyTab === "mentor" && (
              <div className="table-wrap">
                <table className="styled-table">
                  <thead><tr><th>Mentor</th><th>Invoices</th><th>Total</th><th>Paid</th><th>Pending</th></tr></thead>
                  <tbody>
                    {mentorPayoutSummary.map((m) => (
                      <tr key={m.name}><td className="strong">{m.name}</td><td>{m.invoices}</td><td>{money(m.total)}</td><td>{money(m.paid)}</td><td>{money(m.pending)}</td></tr>
                    ))}
                  </tbody>
                </table>
                {mentorPayoutSummary.length === 0 && <div className="empty-state">No invoices yet.</div>}
              </div>
            )}

            {historyTab === "batch" && (
              <div className="table-wrap">
                <table className="styled-table">
                  <thead><tr><th>Batch</th><th>Invoices</th><th>Total</th><th>Paid</th><th>Pending</th></tr></thead>
                  <tbody>
                    {batchPayoutSummary.map((b) => (
                      <tr key={b.name}><td className="strong">{b.name}</td><td>{b.invoices}</td><td>{money(b.total)}</td><td>{money(b.paid)}</td><td>{money(b.pending)}</td></tr>
                    ))}
                  </tbody>
                </table>
                {batchPayoutSummary.length === 0 && <div className="empty-state">No invoices yet.</div>}
              </div>
            )}
          </div>
        </div>

        {/* Invoice details drawer */}
        {viewInvoice && (
          <div className="drawer-overlay" onClick={() => setViewInvoice(null)}>
            <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
              <div className="drawer-header">
                <h2 className="card-title" style={{ margin: 0 }}>Invoice Details</h2>
                <button className="btn btn-ghost" onClick={() => setViewInvoice(null)}><Icon name="x" size={16} /></button>
              </div>

              <div className="drawer-profile">
                <div className="drawer-profile-name-row">
                  <h3 style={{ margin: 0 }}>{viewInvoice.invoice_number || `#${viewInvoice.id}`}</h3>
                  <StatusBadge status={displayStatus(viewInvoice)} />
                </div>
                <div className="muted" style={{ fontSize: "13px" }}>{viewInvoice.mentor_name} · {viewInvoice.batch_name}</div>
              </div>

              <div className="drawer-tabs">
                <button className={`drawer-tab ${drawerTab === "overview" ? "drawer-tab-active" : ""}`} onClick={() => setDrawerTab("overview")}>Overview</button>
                <button className={`drawer-tab ${drawerTab === "sessions" ? "drawer-tab-active" : ""}`} onClick={() => setDrawerTab("sessions")}>Sessions</button>
                <button className={`drawer-tab ${drawerTab === "activity" ? "drawer-tab-active" : ""}`} onClick={() => setDrawerTab("activity")}>Activity</button>
              </div>

              {drawerTab === "overview" && (
                <>
                  <div className="drawer-section">
                    <div className="info-grid">
                      <div className="info-chip"><div className="info-chip-label">Billing Month</div><div className="info-chip-value">{monthLabel(viewInvoice.month)}</div></div>
                      <div className="info-chip"><div className="info-chip-label">Invoice Date</div><div className="info-chip-value">{fmtDate(viewInvoice.invoice_date)}</div></div>
                      <div className="info-chip"><div className="info-chip-label">Due Date</div><div className="info-chip-value">{fmtDate(viewInvoice.due_date)}</div></div>
                      <div className="info-chip"><div className="info-chip-label">Payment Date</div><div className="info-chip-value">{fmtDate(viewInvoice.payment_date)}</div></div>
                      <div className="info-chip"><div className="info-chip-label">Sessions</div><div className="info-chip-value">{viewInvoice.total_sessions}</div></div>
                      <div className="info-chip"><div className="info-chip-label">Total Hours</div><div className="info-chip-value">{viewInvoice.total_hours}</div></div>
                      <div className="info-chip"><div className="info-chip-label">Hourly Rate</div><div className="info-chip-value">₹{viewInvoice.hourly_rate}</div></div>
                    </div>
                  </div>

                  <div className="total-amount-banner">
                    <div>Total Amount</div>
                    <div className="total-amount-value">{money(viewInvoice.total_amount)}</div>
                  </div>

                  <div className="drawer-section">
                    <div className="drawer-section-title">Payment Details</div>
                    <div className="info-grid">
                      <div className="info-chip"><div className="info-chip-label">Payment Mode</div><div className="info-chip-value">{viewInvoice.payment_mode || "—"}</div></div>
                      <div className="info-chip"><div className="info-chip-label">Transaction ID</div><div className="info-chip-value">{viewInvoice.transaction_id || "—"}</div></div>
                      <div className="info-chip"><div className="info-chip-label">Payment Reference</div><div className="info-chip-value">{viewInvoice.payment_reference || "—"}</div></div>
                    </div>
                    {viewInvoice.notes && (
                      <div style={{ marginTop: "10px" }}>
                        <div className="drawer-section-title">Notes</div>
                        <div style={{ fontSize: "13px", color: "#334155" }}>{viewInvoice.notes}</div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {drawerTab === "sessions" && (
                <div className="drawer-section">
                  <div className="drawer-section-title">Matching Sessions</div>
                  {sessions.filter((s) => s.mentor_name === viewInvoice.mentor_name && s.batch_name === viewInvoice.batch_name && (s.session_date || "").startsWith(viewInvoice.month)).length === 0 ? (
                    <div className="hint-text">No sessions found for this mentor, batch, and billing month.</div>
                  ) : (
                    <div className="drawer-sessions-list">
                      {sessions.filter((s) => s.mentor_name === viewInvoice.mentor_name && s.batch_name === viewInvoice.batch_name && (s.session_date || "").startsWith(viewInvoice.month)).map((s) => (
                        <div key={s.id} className="drawer-session-row">
                          <div className="drawer-session-date">{s.session_date}</div>
                          <div><div className="strong">{s.topic || "Untitled Session"}</div><div className="muted" style={{ fontSize: "12px" }}>{s.duration ? `${s.duration} min` : "Duration —"}</div></div>
                        </div>
                      ))}
                    </div>
                  )}
                  <a href="/sessions" className="btn btn-ghost" style={{ marginTop: "14px", display: "inline-block", textDecoration: "none" }}>View All in Sessions →</a>
                </div>
              )}

              {drawerTab === "activity" && (
                <div className="drawer-section">
                  <div className="drawer-section-title">Activity</div>
                  <div className="activity-list">
                    {invoiceActivity(viewInvoice).map((a, i) => (
                      <div key={i} className="activity-row">
                        <div className="activity-icon"><Icon name={a.icon} size={13} color="#16a34a" /></div>
                        <div style={{ flex: 1 }}><div className="strong" style={{ fontSize: "13px" }}>{a.text}</div></div>
                        <div className="muted" style={{ fontSize: "11.5px" }}>{a.when}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="drawer-footer">
                <a href={`${API}/download-invoice/${viewInvoice.id}`} target="_blank" rel="noreferrer" className="btn btn-ghost" style={{ textDecoration: "none" }}><Icon name="download" size={13} /> Download PDF</a>
                <button className="btn btn-ghost" onClick={() => sendInvoiceEmail(viewInvoice.id)}><Icon name="send" size={13} /> Send to Mentor</button>
                {viewInvoice.payment_status === "Pending" && (
                  <button className="btn btn-primary" onClick={() => markPaid(viewInvoice.id)}>Mark as Paid</button>
                )}
              </div>
            </div>
          </div>
        )}

        <Toast toast={toast} onClose={() => setToast(null)} />

        <style jsx>{`
          .top-bar { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 4px 2px; margin-bottom: 20px; flex-wrap: wrap; }
          .top-bar-left { display: flex; align-items: center; gap: 14px; flex: 1; }
          .top-bar-menu-btn { background: transparent; border: none; cursor: pointer; padding: 6px; }
          .top-bar-search { position: relative; }
          .top-bar-right { display: flex; align-items: center; gap: 16px; }
          .top-bar-bell { position: relative; background: transparent; border: none; border-radius: 999px; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
          .top-bar-bell:hover { background: #f1f5f9; }
          .top-bar-badge { position: absolute; top: -4px; right: -4px; background: #ef4444; color: white; font-size: 10px; font-weight: 800; border-radius: 999px; padding: 1px 5px; min-width: 16px; }
          .top-bar-profile { position: relative; display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 4px 8px; border-radius: 10px; }
          .top-bar-profile:hover { background: #f1f5f9; }
          .top-bar-profile-name { font-size: 13.5px; font-weight: 700; color: #1e293b; white-space: nowrap; }
          .top-bar-dropdown { right: 0; left: auto; top: calc(100% + 6px); min-width: 140px; }

          .page-header-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
          .page-title { font-size: 24px; font-weight: 800; color: #1e293b; margin: 0; }
          .page-subtitle { color: #64748b; font-size: 13.5px; margin: 4px 0 0; }

          .date-range-wrap { position: relative; }
          .date-range-popover { position: absolute; right: 0; top: calc(100% + 6px); background: #ffffff; border: 1px solid #eef2f7; border-radius: 12px; box-shadow: 0 12px 24px -8px rgba(15, 23, 42, 0.25); padding: 16px; z-index: 30; display: flex; flex-direction: column; gap: 12px; min-width: 200px; }

          .stat-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; margin-bottom: 24px; }
          .stat-card { border-radius: 14px; padding: 16px 18px; border: 1px solid #eef2f7; display: flex; gap: 12px; align-items: flex-start; }
          .stat-card-icon { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
          .stat-card-value { font-size: 19px; font-weight: 800; color: #1e293b; line-height: 1.15; }
          .stat-card-label { font-size: 12px; color: #475569; margin-top: 2px; font-weight: 600; }
          .stat-card-sub { font-size: 11px; color: #94a3b8; margin-top: 2px; }

          .insights-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
          :global(.card) { background: #ffffff; border-radius: 16px; padding: 22px 24px; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06); border: 1px solid #eef2f7; }
          :global(.card-title) { font-size: 15px; font-weight: 700; color: #1e293b; margin-bottom: 16px; }

          .donut-row { display: flex; align-items: center; gap: 20px; }
          .donut-center-label { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -20%); text-align: center; font-size: 16px; font-weight: 800; color: #1e293b; pointer-events: none; }
          .donut-center-label span { font-size: 10px; font-weight: 600; color: #94a3b8; }
          .donut-legend { display: flex; flex-direction: column; gap: 10px; font-size: 12.5px; color: #475569; }
          .legend-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 6px; }

          .activity-list { display: flex; flex-direction: column; gap: 12px; }
          .activity-row { display: flex; align-items: center; gap: 10px; }
          .activity-icon { width: 28px; height: 28px; border-radius: 8px; background: #dcfce7; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

          .icon-badge { width: 24px; height: 24px; border-radius: 50%; background: linear-gradient(120deg, #f59e0b, #fbbf24); display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }

          .generate-grid { display: grid; grid-template-columns: 1fr 280px; gap: 24px; }
          .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; align-items: end; }

          .validation-panel { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 16px; }
          .validation-title { font-weight: 700; color: #1e40af; font-size: 13px; margin-bottom: 10px; }
          .validation-row { display: flex; align-items: center; gap: 8px; font-size: 12.5px; margin-bottom: 8px; }
          .validation-pass { color: #15803d; }
          .validation-fail { color: #94a3b8; }
          .validation-advisory { color: #b45309; }

          .btn { border: none; border-radius: 10px; padding: 11px 18px; font-size: 13.5px; font-weight: 600; cursor: pointer; transition: all 0.15s ease; display: inline-flex; align-items: center; gap: 6px; }
          .btn:disabled { opacity: 0.5; cursor: not-allowed; }
          .btn-primary { background: linear-gradient(120deg, #f59e0b, #fbbf24); color: #0f172a; }
          .btn-primary:hover:not(:disabled) { transform: translateY(-1px); }
          .btn-ghost { background: #f1f5f9; color: #475569; }
          .btn-ghost:hover { background: #e2e8f0; }
          .btn-validate { background: #1d4ed8; color: #fff; }
          .btn-validate:hover { background: #1e40af; }
          .btn-mark-paid { background: #16a34a; color: white; }
          .btn-mark-paid:hover { background: #15803d; }

          .history-tabs { display: flex; gap: 22px; border-bottom: 1px solid #f1f5f9; margin-bottom: 18px; }
          .history-tab { border: none; background: none; padding: 8px 2px 12px; font-size: 13.5px; font-weight: 700; color: #94a3b8; cursor: pointer; border-bottom: 2px solid transparent; }
          .history-tab-active { color: #b45309; border-bottom-color: #f59e0b; }

          .list-toolbar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px; margin-bottom: 18px; }
          .filters-row { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
          .filter-select { min-width: 130px; }
          .search-wrap { position: relative; }
          .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); display: flex; opacity: 0.6; }

          .table-wrap { overflow-x: auto; }
          .styled-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
          .styled-table thead th { text-align: left; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.03em; color: #94a3b8; font-weight: 700; padding: 10px 12px; border-bottom: 2px solid #f1f5f9; white-space: nowrap; }
          .styled-table tbody tr { animation: fadeSlideUp 0.3s ease both; transition: background 0.12s ease; }
          .styled-table tbody tr:hover { background: #fafaf9; }
          .styled-table td { padding: 11px 12px; border-bottom: 1px solid #f1f5f9; color: #1e293b; }
          .styled-table td.muted { color: #94a3b8; }
          .styled-table td.strong { font-weight: 600; }

          .btn-icon { background: transparent; padding: 6px 8px; font-size: 13px; color: #475569; }
          .btn-icon:hover { background: #f1f5f9; }
          .btn-dots { padding: 6px 8px; }

          .dropdown-menu { position: absolute; right: 0; top: 100%; margin-top: 4px; background: #ffffff; border: 1px solid #eef2f7; border-radius: 10px; box-shadow: 0 12px 24px -8px rgba(15, 23, 42, 0.25); z-index: 20; min-width: 180px; overflow: hidden; }
          .dropdown-menu button { display: flex; align-items: center; gap: 8px; width: 100%; text-align: left; padding: 10px 14px; background: none; border: none; font-size: 13px; font-weight: 600; color: #334155; cursor: pointer; }
          .dropdown-menu button:hover { background: #f8fafc; }
          .dropdown-danger { color: #b91c1c !important; }

          .empty-state { text-align: center; padding: 40px 20px; color: #94a3b8; font-size: 13.5px; }

          .pagination-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px; margin-top: 18px; padding-top: 16px; border-top: 1px solid #f1f5f9; }
          .pagination-info { font-size: 12.5px; color: #64748b; }
          .pagination-controls { display: flex; align-items: center; gap: 4px; }
          .pagination-arrow-btn, .pagination-page-btn { border: 1px solid #eef2f7; background: #ffffff; color: #475569; min-width: 30px; height: 30px; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
          .pagination-arrow-btn:disabled { opacity: 0.4; cursor: not-allowed; }
          .pagination-page-btn-active { background: linear-gradient(120deg, #f59e0b, #fbbf24); color: #0f172a; border-color: transparent; }

          .strong { font-weight: 600; }
          .muted { color: #94a3b8; }
          .hint-text { font-size: 12px; color: #94a3b8; }

          .drawer-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.45); z-index: 200; display: flex; justify-content: flex-end; }
          .drawer-panel { width: 440px; max-width: 92vw; height: 100vh; background: #ffffff; padding: 26px 28px; overflow-y: auto; box-shadow: -12px 0 32px -12px rgba(15, 23, 42, 0.3); }
          .drawer-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
          .drawer-profile { padding-bottom: 16px; border-bottom: 1px solid #f1f5f9; margin-bottom: 16px; }
          .drawer-profile-name-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
          .drawer-tabs { display: flex; gap: 20px; border-bottom: 1px solid #f1f5f9; margin-bottom: 18px; }
          .drawer-tab { border: none; background: none; padding: 8px 2px 12px; font-size: 13px; font-weight: 700; color: #94a3b8; cursor: pointer; border-bottom: 2px solid transparent; }
          .drawer-tab-active { color: #b45309; border-bottom-color: #f59e0b; }
          .drawer-section { margin-bottom: 20px; }
          .drawer-section-title { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.03em; color: #64748b; margin-bottom: 10px; }
          .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; }
          :global(.info-chip) { background: #f8fafc; border: 1px solid #eef2f7; border-radius: 10px; padding: 10px 14px; }
          :global(.info-chip-label) { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; color: #94a3b8; margin-bottom: 4px; }
          :global(.info-chip-value) { font-size: 14px; font-weight: 600; color: #1e293b; }
          .total-amount-banner { display: flex; justify-content: space-between; align-items: center; background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 14px 16px; margin-bottom: 20px; font-weight: 700; color: #92400e; }
          .total-amount-value { font-size: 20px; color: #b45309; }
          .drawer-sessions-list { display: flex; flex-direction: column; gap: 10px; }
          .drawer-session-row { display: grid; grid-template-columns: 90px 1fr; gap: 10px; padding: 10px; background: #f8fafc; border: 1px solid #eef2f7; border-radius: 10px; font-size: 13px; }
          .drawer-session-date { color: #64748b; font-size: 12px; }
          .drawer-footer { display: flex; gap: 10px; margin-top: 22px; padding-top: 18px; border-top: 1px solid #f1f5f9; flex-wrap: wrap; }

          @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

          @media (max-width: 1200px) {
            .insights-grid, .generate-grid { grid-template-columns: 1fr; }
          }
        `}</style>
      </>
    </ProtectedRoute>
  );
}
