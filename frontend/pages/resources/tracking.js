import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Sidebar from "../../components/Sidebar";
import ProtectedRoute from "../../components/ProtectedRoute";
import PortalHeader from "../../components/resources/portal/PortalHeader";
import MentorAvatar from "../../components/resources/portal/MentorAvatar";
import { API, SESSION_TYPES, displayStatus, formatDate, formatDuration, formatFileSize, formatTime, parseServerDate, sessionTypeLabel, tabForStatus } from "../../components/resources/portal/portalUtils";
import {
  CalendarDays,
  Layers,
  Users,
  PlayCircle,
  Video,
  Circle,
  Search,
  Download,
  Upload,
  ExternalLink,
  FileText,
  FileSpreadsheet,
  FileArchive,
  Presentation,
  Image as ImageIcon,
  Link2,
  ListChecks,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Timer,
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  MoreVertical,
  Eye,
  X,
} from "lucide-react";

const TABS = [
  { key: "All", label: "All", icon: ListChecks },
  { key: "Pending", label: "Pending", icon: Clock },
  { key: "Submitted", label: "Submitted", icon: CheckCircle2 },
  { key: "Overdue", label: "Overdue", icon: AlertTriangle },
  { key: "Late", label: "Late", icon: Timer },
];

const DATE_RANGES = [
  { value: "", label: "All Dates" },
  { value: "today", label: "Today" },
  { value: "next7", label: "Next 7 Days" },
  { value: "last7", label: "Last 7 Days" },
  { value: "last30", label: "Last 30 Days" },
  { value: "month", label: "This Month" },
];

const EMPTY_FILTERS = { range: "", batch_name: "", mentor_name: "", session_type: "", session_id: "" };

// Session-type chip colours (same palette as the Sessions page).
const TYPE_STYLES = {
  "Live Session": { bg: "#e0edff", color: "#1d4ed8" },
  "Webinar Session": { bg: "#ede9fe", color: "#6d28d9" },
};

// Icon + colours for the status pill, keyed by the *displayed* status.
const STATUS_PILL = {
  Submitted: { icon: CheckCircle2, bg: "#dcfce7", color: "#166534" },
  Pending: { icon: Clock, bg: "#fef3c7", color: "#b45309" },
  "Partially Submitted": { icon: Clock, bg: "#dbeafe", color: "#1d4ed8" },
  Overdue: { icon: AlertCircle, bg: "#fee2e2", color: "#b91c1c" },
  Late: { icon: AlertCircle, bg: "#ffe4e6", color: "#be123c" },
  "Not Required": { icon: Circle, bg: "#f1f5f9", color: "#64748b" },
};

const STATUS_ORDER = { Overdue: 0, "Partially Submitted": 1, Pending: 2, Late: 3, Submitted: 4, "Not Required": 5 };

function unique(list) {
  return [...new Set(list.filter(Boolean))].sort();
}

function StatusPill({ status }) {
  const style = STATUS_PILL[status] || STATUS_PILL["Not Required"];
  const Icon = style.icon;
  return (
    <span className="pill" style={{ background: style.bg, color: style.color }}>
      <Icon size={13} strokeWidth={2.4} /> {status}
      <style jsx>{`
        .pill { display: inline-flex; align-items: center; gap: 6px; border-radius: 6px; padding: 5px 10px; font-size: 12px; font-weight: 700; white-space: nowrap; }
      `}</style>
    </span>
  );
}

// Coloured icon square by file extension, like a file manager.
function fileVisual(resource) {
  if (!resource.file_path) return { icon: Link2, color: "#2563eb", bg: "#e7f0ff" };
  const ext = (resource.file_name || "").split(".").pop().toLowerCase();
  if (ext === "pdf") return { icon: FileText, color: "#dc2626", bg: "#fee2e2" };
  if (["ppt", "pptx"].includes(ext)) return { icon: Presentation, color: "#ea580c", bg: "#ffedd5" };
  if (["xls", "xlsx", "csv"].includes(ext)) return { icon: FileSpreadsheet, color: "#16a34a", bg: "#dcfce7" };
  if (["doc", "docx"].includes(ext)) return { icon: FileText, color: "#2563eb", bg: "#e0edff" };
  if (["zip", "rar"].includes(ext)) return { icon: FileArchive, color: "#d97706", bg: "#fef3c7" };
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return { icon: ImageIcon, color: "#7c3aed", bg: "#ede9fe" };
  return { icon: FileText, color: "#475569", bg: "#f1f5f9" };
}

function FileChip({ resource }) {
  const { icon: Icon, color, bg } = fileVisual(resource);
  const hasFile = !!resource.file_path;
  const href = hasFile ? `${API}/resources/${resource.id}/download` : resource.resource_url;
  const name = hasFile ? resource.file_name : resource.resource_title;

  return (
    <div className="file">
      <span className="file-icon" style={{ background: bg, color }}><Icon size={15} strokeWidth={2.2} /></span>
      <div className="file-text">
        <div className="file-name" title={name}>{name}</div>
        <div className="file-sub">{hasFile ? formatFileSize(resource.file_size) || "File" : "Link"}</div>
      </div>
      {href && (
        <a className="file-action" href={href} {...(hasFile ? {} : { target: "_blank", rel: "noreferrer" })} title={hasFile ? "Download" : "Open link"} aria-label={hasFile ? `Download ${name}` : `Open ${name}`}>
          {hasFile ? <Download size={14} /> : <ExternalLink size={14} />}
        </a>
      )}
      <style jsx>{`
        .file { display: flex; align-items: center; gap: 9px; border: 1px solid #e3eaf4; border-radius: 8px; background: #fff; padding: 6px 9px; max-width: 220px; }
        .file-icon { width: 26px; height: 26px; border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .file-text { min-width: 0; flex: 1; }
        .file-name { font-size: 12px; font-weight: 700; color: #1e293b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .file-sub { font-size: 10.5px; color: #94a3b8; }
        .file :global(.file-action) { display: flex; color: #2563eb; padding: 4px; border-radius: 6px; }
        .file :global(.file-action:hover) { background: #dbe8ff; }
      `}</style>
    </div>
  );
}

function FilterField({ icon: Icon, label, children }) {
  return (
    <div className="ff">
      <span className="ff-icon"><Icon size={22} strokeWidth={1.9} /></span>
      <div className="ff-body">
        <label>{label}</label>
        {children}
      </div>
      <style jsx>{`
        .ff { display: flex; align-items: center; gap: 8px; flex: 1 1 120px; min-width: 110px; }
        .ff-icon { color: #2563eb; display: flex; flex-shrink: 0; }
        .ff-icon :global(svg) { width: 18px; height: 18px; }
        .ff-body { flex: 1; min-width: 0; }
        label { display: block; font-size: 11.5px; font-weight: 700; color: #334155; margin-bottom: 4px; }
      `}</style>
    </div>
  );
}

function SortHeader({ label, field, sort, onSort }) {
  const active = sort.field === field;
  const Icon = !active ? ChevronsUpDown : sort.dir === "asc" ? ChevronUp : ChevronDown;
  return (
    <th className="sortable" onClick={() => onSort(field)} aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
      {label} <Icon size={12} strokeWidth={2.4} className={active ? "sort-on" : "sort-off"} />
    </th>
  );
}

export default function ResourceTrackerPage() {
  const [rows, setRows] = useState(null);
  const [resources, setResources] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("All"); // also drives the Status select
  const [sort, setSort] = useState({ field: null, dir: "asc" });
  const [expanded, setExpanded] = useState({});
  const [exportOpen, setExportOpen] = useState(false);
  const [rowMenu, setRowMenu] = useState(null); // session_id whose ⋮ menu is open
  const [now, setNow] = useState(() => Date.now());

  const load = () => {
    setError("");
    Promise.all([
      fetch(`${API}/resource-tracking`).then((r) => r.json()),
      fetch(`${API}/resources`).then((r) => r.json()),
    ])
      .then(([tracking, all]) => {
        setRows(Array.isArray(tracking) ? tracking : []);
        setResources(Array.isArray(all) ? all : []);
      })
      .catch(() => {
        setRows([]);
        setError("Couldn't load the resource tracker. Please check your connection and try again.");
      });
  };

  useEffect(load, []);

  // Mentor photos come from the Mentors section; if this user can't read the
  // mentor list the tracker still works and shows initials instead.
  useEffect(() => {
    fetch(`${API}/mentors`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setMentors(Array.isArray(d) ? d : []))
      .catch(() => setMentors([]));
  }, []);

  // Keep "overdue by …" fresh without a reload.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  const mentorsByName = useMemo(() => Object.fromEntries(mentors.map((m) => [m.name, m])), [mentors]);

  const resourcesBySession = useMemo(() => {
    const map = {};
    resources.forEach((r) => {
      if (r.session_id == null) return;
      (map[r.session_id] = map[r.session_id] || []).push(r);
    });
    return map;
  }, [resources]);

  const options = useMemo(
    () => ({
      batch_name: unique((rows || []).map((r) => r.batch_name)),
      mentor_name: unique((rows || []).map((r) => r.mentor_name)),
      sessions: (rows || []).map((r) => ({ id: r.session_id, label: `${r.session_topic || "Untitled"} — ${r.session_date || "no date"}` })),
    }),
    [rows]
  );

  // The date a row is measured by: its deadline, or the session date when no deadline is set.
  const refTime = (r) => {
    const due = parseServerDate(r.due_at);
    if (due) return due.getTime();
    return r.session_date ? new Date(`${r.session_date}T12:00:00`).getTime() : null;
  };

  const inRange = (r, range) => {
    if (!range) return true;
    const t = refTime(r);
    if (t === null) return false;
    const day = 86400000;
    const startOfToday = new Date(now).setHours(0, 0, 0, 0);
    switch (range) {
      case "today": return t >= startOfToday && t < startOfToday + day;
      case "next7": return t >= startOfToday && t < startOfToday + 7 * day;
      case "last7": return t >= startOfToday - 7 * day && t < startOfToday + day;
      case "last30": return t >= startOfToday - 30 * day && t < startOfToday + day;
      case "month": {
        const d = new Date(now);
        return t >= new Date(d.getFullYear(), d.getMonth(), 1).getTime() && t < new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
      }
      default: return true;
    }
  };

  // Filters + search narrow the list; the tabs (== Status select) then split it by status.
  const filtered = useMemo(() => {
    if (!rows) return [];
    const term = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (filters.batch_name && r.batch_name !== filters.batch_name) return false;
      if (filters.mentor_name && r.mentor_name !== filters.mentor_name) return false;
      if (filters.session_type && (r.session_type || "Live Session") !== filters.session_type) return false;
      if (filters.session_id && String(r.session_id) !== filters.session_id) return false;
      if (!inRange(r, filters.range)) return false;
      if (term) {
        const haystack = [r.session_topic, r.course_name, r.batch_name, r.mentor_name, ...(r.required_resources || []), ...(r.missing_resources || [])]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [rows, filters, search, now]);

  const counts = useMemo(() => {
    const c = { All: filtered.length, Pending: 0, Submitted: 0, Overdue: 0, Late: 0 };
    filtered.forEach((r) => {
      const t = tabForStatus(r.status);
      if (t) c[t] += 1;
    });
    return c;
  }, [filtered]);

  const visible = useMemo(() => {
    const list = tab === "All" ? filtered : filtered.filter((r) => tabForStatus(r.status) === tab);
    if (!sort.field) return list;
    const dir = sort.dir === "asc" ? 1 : -1;
    const key = {
      batch: (r) => (r.batch_name || "").toLowerCase(),
      due: (r) => parseServerDate(r.due_at)?.getTime() ?? null,
      status: (r) => STATUS_ORDER[displayStatus(r.status)] ?? 9,
      submitted: (r) => (r.missing_count > 0 ? null : parseServerDate(r.received_at)?.getTime() ?? null),
    }[sort.field];
    // Empty values always sink to the bottom, whichever way we sort.
    return [...list].sort((a, b) => {
      const x = key(a);
      const y = key(b);
      if (x === null && y === null) return 0;
      if (x === null) return 1;
      if (y === null) return -1;
      return x < y ? -dir : x > y ? dir : 0;
    });
  }, [filtered, tab, sort]);

  const hasFilters = Object.values(filters).some(Boolean) || !!search;
  const setFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));
  const clearAll = () => { setFilters(EMPTY_FILTERS); setSearch(""); setTab("All"); };
  const toggleSort = (field) => setSort((prev) => (prev.field === field ? { field, dir: prev.dir === "asc" ? "desc" : "asc" } : { field, dir: "asc" }));

  // What the status cell says beyond the pill itself.
  const statusNote = (r) => {
    const due = parseServerDate(r.due_at);
    if (r.status === "Overdue" && due) return { text: `Overdue by ${formatDuration(now - due.getTime())}`, tone: "red" };
    if (r.status === "Delayed") return { text: r.delay_hours > 0 ? `Submitted ${formatDuration(r.delay_hours * 3600000)} late` : "Submitted late", tone: "orange" };
    if (r.status === "Partially Submitted" || (r.status === "Pending" && r.received_count > 0)) return { text: `${r.received_count} of ${r.required_count} received`, tone: "blue" };
    if (r.status === "Pending" && due) {
      const left = due.getTime() - now;
      return left > 0 ? { text: `Due in ${formatDuration(left)}`, tone: "slate" } : null;
    }
    if (r.status === "Pending") return { text: `${r.required_count} resource${r.required_count === 1 ? "" : "s"} required`, tone: "slate" };
    return null;
  };

  return (
    <ProtectedRoute>
      <>
        <Sidebar />

        <div className="page" onClick={() => rowMenu && setRowMenu(null)}>
          <PortalHeader subtitle="Track your resource submissions and due dates" tagline="Timely resources, better learning outcomes" />

          {/* Filters */}
          <div className="filters">
            <FilterField icon={CalendarDays} label="Date Range">
              <select value={filters.range} onChange={(e) => setFilter("range", e.target.value)}>
                {DATE_RANGES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </FilterField>
            <FilterField icon={Layers} label="Batch">
              <select value={filters.batch_name} onChange={(e) => setFilter("batch_name", e.target.value)}>
                <option value="">All Batches</option>
                {options.batch_name.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </FilterField>
            <FilterField icon={Users} label="Mentor">
              <select value={filters.mentor_name} onChange={(e) => setFilter("mentor_name", e.target.value)}>
                <option value="">All Mentors</option>
                {options.mentor_name.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </FilterField>
            <FilterField icon={Video} label="Session Type">
              <select value={filters.session_type} onChange={(e) => setFilter("session_type", e.target.value)}>
                <option value="">All Types</option>
                {SESSION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </FilterField>
            <FilterField icon={PlayCircle} label="Session">
              <select value={filters.session_id} onChange={(e) => setFilter("session_id", e.target.value)}>
                <option value="">All Sessions</option>
                {options.sessions.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </FilterField>
            <FilterField icon={Circle} label="Status">
              <select value={tab} onChange={(e) => setTab(e.target.value)}>
                <option value="All">All Status</option>
                {TABS.filter((t) => t.key !== "All").map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select>
            </FilterField>
            <div className="search">
              <label>Search</label>
              <div className="search-box">
                <input placeholder="Search by session, batch or resource…" value={search} onChange={(e) => setSearch(e.target.value)} />
                <span className="search-btn"><Search size={15} /></span>
              </div>
            </div>
          </div>

          {/* Tabs + export */}
          <div className="tabs-row">
            <div className="tabs" role="tablist">
              {TABS.map(({ key, label, icon: Icon }) => (
                <button key={key} role="tab" aria-selected={tab === key} className={`tab ${tab === key ? "tab-active" : ""} tab-${key.toLowerCase()}`} onClick={() => setTab(key)}>
                  <Icon size={14} strokeWidth={2.2} /> {label} ({counts[key]})
                </button>
              ))}
            </div>
            <div className="export">
              <button className="btn-export" onClick={() => setExportOpen((v) => !v)}>
                <Download size={14} /> Export
              </button>
              {exportOpen && (
                <>
                  <div className="backdrop" onClick={() => setExportOpen(false)} />
                  <div className="export-menu">
                    <a href={`${API}/resources/export?format=excel`} onClick={() => setExportOpen(false)}>Excel (.xlsx)</a>
                    <a href={`${API}/resources/export?format=csv`} onClick={() => setExportOpen(false)}>CSV</a>
                  </div>
                </>
              )}
            </div>
          </div>

          {error && <div className="error-banner">{error} <button onClick={load}>Retry</button></div>}

          {/* Table */}
          <div className="table-card">
            {rows === null ? (
              <div className="empty">Loading…</div>
            ) : rows.length === 0 ? (
              <div className="empty">No sessions have resource requirements yet.</div>
            ) : visible.length === 0 ? (
              <div className="empty">
                No sessions match the current filters.
                {(hasFilters || tab !== "All") && <div><button className="btn-clear" onClick={clearAll}><X size={13} /> Clear filters</button></div>}
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th className="c-num">#</th>
                      <th>Session Details</th>
                      <SortHeader label="Batch" field="batch" sort={sort} onSort={toggleSort} />
                      <SortHeader label="Due Date" field="due" sort={sort} onSort={toggleSort} />
                      <SortHeader label="Submission Status" field="status" sort={sort} onSort={toggleSort} />
                      <SortHeader label="Submitted Date" field="submitted" sort={sort} onSort={toggleSort} />
                      <th>File</th>
                      <th className="c-actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((r, i) => {
                      const files = resourcesBySession[r.session_id] || [];
                      const open = !!expanded[r.session_id];
                      const shown = open ? files : files.slice(0, 2);
                      const note = statusNote(r);
                      const missing = r.missing_count > 0;
                      const firstFile = files.find((f) => f.file_path);
                      return (
                        <tr key={r.session_id} className={r.status === "Overdue" ? "row-overdue" : r.status === "Delayed" ? "row-late" : ""}>
                          <td className="c-num">{i + 1}</td>
                          <td>
                            <Link href={`/resources/${r.session_id}`} className="session-link">{r.session_topic}</Link>
                            <span
                              className="type-chip"
                              style={TYPE_STYLES[r.session_type] || TYPE_STYLES["Live Session"]}
                            >
                              {sessionTypeLabel(r.session_type)}
                            </span>
                            <div className="mentor">
                              <MentorAvatar mentor={mentorsByName[r.mentor_name]} name={r.mentor_name} size={22} />
                              <span className="mentor-name">{r.mentor_name || "—"}</span>
                              <span className="sub">· {r.session_date ? formatDate(`${r.session_date}T00:00:00`) : "—"}</span>
                            </div>
                          </td>
                          <td className="nowrap">{r.batch_name || "—"}</td>
                          <td className="nowrap">
                            {r.due_at ? (
                              <>
                                <div>{formatDate(r.due_at)}</div>
                                <div className="sub">{formatTime(r.due_at)}</div>
                              </>
                            ) : (
                              <span className="dash" title="No deadline set for this session">—</span>
                            )}
                          </td>
                          <td>
                            <StatusPill status={displayStatus(r.status)} />
                            {note && <div className={`note note-${note.tone}`} title={missing ? `Missing: ${(r.missing_resources || []).join(", ")}` : undefined}>{note.text}</div>}
                          </td>
                          <td className="nowrap">
                            {r.received_at && !missing ? (
                              <>
                                <div>{formatDate(r.received_at)}</div>
                                <div className="sub">{formatTime(r.received_at)}</div>
                              </>
                            ) : (
                              <span className="dash">—</span>
                            )}
                          </td>
                          <td>
                            {files.length === 0 ? (
                              <span className="dash">—</span>
                            ) : (
                              <div className="files">
                                {shown.map((f) => <FileChip key={f.id} resource={f} />)}
                                {files.length > 2 && (
                                  <button className="more" onClick={() => setExpanded((prev) => ({ ...prev, [r.session_id]: !open }))}>
                                    {open ? "Show less" : `+${files.length - 2} more`}
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="c-actions">
                            <div className="actions">
                              {missing ? (
                                <Link href={`/resources?session_id=${r.session_id}`} className="btn-primary"><Upload size={14} /> Upload</Link>
                              ) : firstFile ? (
                                <a href={`${API}/resources/${firstFile.id}/download`} className="btn-outline"><Download size={14} /> Download</a>
                              ) : (
                                <Link href={`/resources/${r.session_id}`} className="btn-outline"><Eye size={14} /> View</Link>
                              )}
                              <div className="kebab-wrap">
                                <button
                                  className="kebab"
                                  aria-label="More actions"
                                  onClick={(e) => { e.stopPropagation(); setRowMenu(rowMenu === r.session_id ? null : r.session_id); }}
                                >
                                  <MoreVertical size={16} />
                                </button>
                                {rowMenu === r.session_id && (
                                  <div className="row-menu" onClick={(e) => e.stopPropagation()}>
                                    <Link href={`/resources/${r.session_id}`}><Eye size={14} /> View details</Link>
                                    <Link href={`/resources?session_id=${r.session_id}`}><Upload size={14} /> {missing ? "Upload resource" : "Add another resource"}</Link>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <style jsx>{`
          .page { margin-left: var(--om-sidebar-width, 280px); transition: margin-left 0.25s ease; padding: 26px 30px 50px; background: #eef3fa; min-height: 100vh; }

          .filters { display: flex; align-items: flex-end; gap: 12px; flex-wrap: wrap; background: #fff; border: 1px solid #e3eaf4; border-radius: 12px 12px 0 0; padding: 14px 18px; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04); }
          .filters select { width: 100%; box-sizing: border-box; border: 1px solid #d8e1ee; border-radius: 8px; background: #fff; padding: 9px 10px; font-size: 12.5px; color: #0f172a; outline: none; font-family: inherit; }
          .filters input { width: 100%; box-sizing: border-box; border: 1px solid #d8e1ee; border-radius: 8px; background: #fff; padding: 9px 10px; font-size: 12.5px; color: #0f172a; outline: none; font-family: inherit; }
          .filters select:focus, .filters input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12); }
          .search { flex: 1.4 1 190px; padding-left: 12px; border-left: 1px solid #e3eaf4; }
          .search label { display: block; font-size: 11.5px; font-weight: 700; color: #334155; margin-bottom: 4px; }
          .search-box { display: flex; }
          .search-box input { border-radius: 8px 0 0 8px; border-right: none; }
          .search-btn { display: flex; align-items: center; justify-content: center; width: 40px; border: 1px solid #d8e1ee; border-radius: 0 8px 8px 0; background: #f8fafc; color: #334155; }

          .tabs-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; background: #fff; border: 1px solid #e3eaf4; border-top: none; padding: 10px 18px 0; }
          .tabs { display: flex; gap: 6px; flex-wrap: wrap; }
          .tab { display: inline-flex; align-items: center; gap: 7px; background: none; border: none; border-bottom: 2.5px solid transparent; padding: 9px 12px 11px; font-size: 12.5px; font-weight: 600; color: #475569; cursor: pointer; }
          .tab:hover { color: #0f172a; }
          .tab-active { color: #1d4ed8; border-bottom-color: #2563eb; background: #eff5ff; border-radius: 8px 8px 0 0; }
          .tab-overdue :global(svg) { color: #ea580c; }
          .tab-late :global(svg) { color: #d97706; }
          .tab-submitted :global(svg) { color: #16a34a; }
          .tab-pending :global(svg) { color: #d97706; }

          .export { position: relative; padding-bottom: 8px; }
          .btn-export { display: inline-flex; align-items: center; gap: 7px; background: #fff; border: 1px solid #d8e1ee; border-radius: 8px; padding: 8px 16px; font-size: 12.5px; font-weight: 700; color: #0f172a; cursor: pointer; }
          .btn-export:hover { background: #f8fafc; }
          .backdrop { position: fixed; inset: 0; z-index: 20; }
          .export-menu { position: absolute; right: 0; top: calc(100% - 2px); z-index: 30; background: #fff; border: 1px solid #e3eaf4; border-radius: 10px; box-shadow: 0 14px 28px -14px rgba(15, 23, 42, 0.35); padding: 6px; min-width: 150px; }
          .export-menu a { display: block; padding: 9px 10px; border-radius: 7px; font-size: 12.5px; font-weight: 600; color: #1e293b; text-decoration: none; }
          .export-menu a:hover { background: #f1f5f9; }

          .error-banner { display: flex; align-items: center; gap: 10px; background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; padding: 10px 16px; font-size: 13px; }
          .error-banner button { background: #fff; border: 1px solid #fecaca; border-radius: 6px; padding: 4px 10px; color: #b91c1c; font-weight: 700; cursor: pointer; }

          .table-card { background: #fff; border: 1px solid #e3eaf4; border-top: 1px solid #edf1f7; border-radius: 0 0 12px 12px; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04); }
          .table-wrap { overflow-x: auto; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          thead th { text-align: left; font-size: 11.5px; font-weight: 700; color: #1e293b; padding: 12px 14px; background: #f7f9fd; border-bottom: 1px solid #e3eaf4; white-space: nowrap; }
          /* Sortable headers render inside SortHeader (a separate component), so they need :global styles. */
          :global(th.sortable) { text-align: left; font-size: 11.5px; font-weight: 700; color: #1e293b; padding: 12px 14px; background: #f7f9fd; border-bottom: 1px solid #e3eaf4; white-space: nowrap; cursor: pointer; user-select: none; }
          :global(th.sortable:hover) { color: #1d4ed8; }
          thead th :global(.sort-off) { color: #94a3b8; vertical-align: -1px; margin-left: 2px; }
          thead th :global(.sort-on) { color: #2563eb; vertical-align: -1px; margin-left: 2px; }
          tbody td { padding: 14px 14px; border-bottom: 1px solid #edf1f7; color: #1e293b; vertical-align: middle; }
          tbody tr:last-child td { border-bottom: none; }
          tbody tr:hover { background: #fafcff; }
          .row-overdue { background: #fff8f8; }
          .row-overdue:hover { background: #fff3f3; }
          .row-late { background: #fffaf3; }
          .c-num { width: 40px; color: #64748b; }
          .c-actions { text-align: right; white-space: nowrap; }
          .nowrap { white-space: nowrap; }
          .sub { font-size: 11.5px; color: #64748b; margin-top: 2px; }
          .dash { color: #94a3b8; }
          tbody :global(.session-link) { font-weight: 700; color: #0f172a; text-decoration: none; }
          tbody :global(.session-link:hover) { color: #2563eb; text-decoration: underline; }
          .type-chip { display: inline-block; margin-left: 8px; border-radius: 999px; padding: 2px 8px; font-size: 10.5px; font-weight: 700; vertical-align: 1px; white-space: nowrap; }
          .mentor { display: flex; align-items: center; gap: 7px; margin-top: 5px; }
          .mentor-name { font-size: 12px; font-weight: 600; color: #334155; white-space: nowrap; }
          .mentor .sub { margin: 0; white-space: nowrap; }
          .note { font-size: 11px; font-weight: 600; margin-top: 5px; }
          .note-red { color: #b91c1c; }
          .note-orange { color: #c2410c; }
          .note-blue { color: #1d4ed8; }
          .note-slate { color: #64748b; }

          .files { display: flex; flex-direction: column; gap: 6px; align-items: flex-start; }
          .more { background: none; border: none; padding: 0; font-size: 11.5px; font-weight: 700; color: #2563eb; cursor: pointer; }

          .actions { display: flex; align-items: center; justify-content: flex-end; gap: 6px; }
          .actions :global(.btn-primary), .actions :global(.btn-outline) { display: inline-flex; align-items: center; gap: 7px; border-radius: 6px; padding: 8px 16px; font-size: 12px; font-weight: 700; text-decoration: none; min-width: 92px; justify-content: center; box-sizing: border-box; }
          .actions :global(.btn-primary) { background: #2563eb; color: #fff; border: 1px solid #2563eb; }
          .actions :global(.btn-primary:hover) { background: #1d4ed8; }
          .actions :global(.btn-outline) { background: #f3f7ff; color: #1d4ed8; border: 1px solid #c8d8f5; }
          .actions :global(.btn-outline:hover) { background: #e4eeff; }
          .kebab-wrap { position: relative; }
          .kebab { display: flex; background: none; border: none; color: #475569; padding: 6px; border-radius: 6px; cursor: pointer; }
          .kebab:hover { background: #eef2f7; color: #0f172a; }
          .row-menu { position: absolute; right: 0; top: calc(100% + 4px); z-index: 40; background: #fff; border: 1px solid #e3eaf4; border-radius: 10px; box-shadow: 0 14px 28px -14px rgba(15, 23, 42, 0.35); padding: 6px; min-width: 180px; text-align: left; }
          .row-menu :global(a) { display: flex; align-items: center; gap: 9px; padding: 9px 10px; border-radius: 7px; font-size: 12.5px; font-weight: 600; color: #1e293b; text-decoration: none; }
          .row-menu :global(a:hover) { background: #f1f5f9; }

          .empty { padding: 60px 20px; text-align: center; color: #94a3b8; font-size: 14px; }
          .btn-clear { margin-top: 14px; display: inline-flex; align-items: center; gap: 6px; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 14px; font-size: 12.5px; font-weight: 700; color: #334155; cursor: pointer; }

          @media (max-width: 900px) { .tabs-row { flex-direction: column; align-items: flex-start; } .search { border-left: none; padding-left: 0; } }
        `}</style>
      </>
    </ProtectedRoute>
  );
}
