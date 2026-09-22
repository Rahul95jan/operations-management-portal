import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import Sidebar from "../../components/Sidebar";
import ProtectedRoute from "../../components/ProtectedRoute";
import PortalHeader from "../../components/resources/portal/PortalHeader";
import MentorAvatar from "../../components/resources/portal/MentorAvatar";
import SubmittedResourcesList from "../../components/resources/SubmittedResourcesList";
import { RESOURCE_TYPES, typeConfig } from "../../components/resources/resourceTypes";
import { API, FILE_ACCEPT, NO_BATCH, SESSION_TYPES, fileMatchesType, formatDate, formatFileSize, formatTime, sessionTypeOf, typeLabel } from "../../components/resources/portal/portalUtils";
import {
  UploadCloud,
  BookOpen,
  CheckCircle2,
  Clock,
  Lightbulb,
  ArrowRight,
  FileText,
  X,
  Plus,
  Link2,
  AlertTriangle,
  Loader2,
} from "lucide-react";

const NOTES_LIMIT = 500;

function unique(list) {
  return [...new Set(list.filter(Boolean))].sort();
}

function stripExtension(name) {
  return (name || "").replace(/\.[^.]+$/, "");
}

// Sentence describing the real reminder rules from /resource-scheduler/status.
function reminderText(status) {
  if (!status) return "Reminders are sent automatically until the required resources are submitted.";
  const hours = status.reminder_interval_hours;
  const window = `${String(status.reminder_window_start_hour).padStart(2, "0")}:00–${String(status.reminder_window_end_hour).padStart(2, "0")}:00`;
  if (!status.enabled) {
    return "Automatic reminder emails are currently switched off. Please submit before the due date shown in the Resource Tracker.";
  }
  return `Reminder emails go out every ${hours} hour${hours === 1 ? "" : "s"} (${window}, ${status.reminder_timezone}) until the resource is submitted.`;
}

export default function UploadResourcePage() {
  const router = useRouter();
  const fileInput = useRef(null);

  const [sessions, setSessions] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [schedulerStatus, setSchedulerStatus] = useState(null);

  const [batchName, setBatchName] = useState("");
  const [mentorName, setMentorName] = useState("");
  const [sessionType, setSessionType] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [resourceType, setResourceType] = useState("");
  const [files, setFiles] = useState([]);
  const [links, setLinks] = useState([{ title: "", url: "" }]);
  const [notes, setNotes] = useState("");

  const [requirements, setRequirements] = useState([]);
  const [existingResources, setExistingResources] = useState([]);

  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {
    fetch(`${API}/sessions`).then((r) => r.json()).then((d) => setSessions(Array.isArray(d) ? d : [])).catch(() => setSessions([]));
    fetch(`${API}/mentors`).then((r) => r.json()).then((d) => setMentors(Array.isArray(d) ? d : [])).catch(() => setMentors([]));
    fetch(`${API}/users/me`).then((r) => r.json()).then(setCurrentUser).catch(() => setCurrentUser(null));
    fetch(`${API}/resource-scheduler/status`).then((r) => r.json()).then(setSchedulerStatus).catch(() => setSchedulerStatus(null));
  }, []);

  const selectedSession = useMemo(() => sessions.find((s) => String(s.id) === String(sessionId)) || null, [sessions, sessionId]);

  // Deep link from the tracker: /resources?session_id=12 preselects batch + session.
  useEffect(() => {
    const wanted = router.query.session_id;
    if (!wanted || !sessions.length) return;
    const match = sessions.find((s) => String(s.id) === String(wanted));
    if (match) {
      setBatchName(match.batch_name || NO_BATCH);
      setMentorName(match.mentor_name || "");
      setSessionType(sessionTypeOf(match));
      setSessionId(String(match.id));
    }
  }, [router.query.session_id, sessions]);

  const loadSessionState = (id) => {
    if (!id) {
      setRequirements([]);
      setExistingResources([]);
      return;
    }
    fetch(`${API}/resource-tracking/${id}`)
      .then((r) => r.json())
      .then((d) => setRequirements(Array.isArray(d?.requirements) ? d.requirements : []))
      .catch(() => setRequirements([]));
    fetch(`${API}/resources?session_id=${id}`)
      .then((r) => r.json())
      .then((d) => setExistingResources(Array.isArray(d) ? d : []))
      .catch(() => setExistingResources([]));
  };

  useEffect(() => {
    loadSessionState(sessionId);
  }, [sessionId]);

  // Batch -> Mentor -> Session Type -> Session: each step narrows the next.
  const batchOptions = useMemo(() => unique(sessions.map((s) => s.batch_name)), [sessions]);
  const hasUnbatched = useMemo(() => sessions.some((s) => !s.batch_name), [sessions]);
  const batchSessions = useMemo(
    () => sessions.filter((s) => !batchName || (batchName === NO_BATCH ? !s.batch_name : s.batch_name === batchName)),
    [sessions, batchName]
  );
  const mentorOptions = useMemo(() => unique(batchSessions.map((s) => s.mentor_name)), [batchSessions]);
  const selectedMentor = useMemo(() => mentors.find((m) => m.name === mentorName) || null, [mentors, mentorName]);
  const mentorSessions = useMemo(() => batchSessions.filter((s) => !mentorName || s.mentor_name === mentorName), [batchSessions, mentorName]);
  const sessionOptions = useMemo(
    () =>
      mentorSessions
        .filter((s) => !sessionType || sessionTypeOf(s) === sessionType)
        .sort((a, b) => String(b.session_date || "").localeCompare(String(a.session_date || ""))),
    [mentorSessions, sessionType]
  );

  const outstanding = useMemo(() => requirements.filter((r) => r.is_required !== false && (r.status === "Pending" || r.status === "Overdue")), [requirements]);
  const outstandingTypes = useMemo(() => new Set(outstanding.map((r) => r.resource_type)), [outstanding]);
  const config = typeConfig(resourceType);
  const acceptsFiles = !config || config.kind === "file" || config.kind === "both";
  const acceptsLinks = config && (config.kind === "url" || config.kind === "both");

  const changeBatch = (value) => {
    setBatchName(value);
    setMentorName("");
    setSessionType("");
    setSessionId("");
    setResourceType("");
    setResults([]);
    setFormError("");
  };

  const changeMentor = (value) => {
    setMentorName(value);
    setSessionType("");
    setSessionId("");
    setResourceType("");
    setResults([]);
    setFormError("");
  };

  const changeSessionType = (value) => {
    setSessionType(value);
    setSessionId("");
    setResourceType("");
    setResults([]);
    setFormError("");
  };

  const changeSession = (value) => {
    setSessionId(value);
    setResourceType("");
    setResults([]);
    setFormError("");
  };

  const changeType = (value) => {
    setResourceType(value);
    setFiles([]);
    setResults([]);
    setFormError("");
  };

  const addFiles = (incoming) => {
    const list = Array.from(incoming || []);
    if (!list.length) return;
    if (!resourceType) {
      setFormError("Choose a resource type before adding files.");
      return;
    }
    const rejected = list.filter((f) => !fileMatchesType(f, resourceType));
    const accepted = list.filter((f) => fileMatchesType(f, resourceType));
    setFormError(rejected.length ? `${rejected.map((f) => f.name).join(", ")} doesn't match the "${typeLabel(resourceType)}" type (allowed: ${FILE_ACCEPT[resourceType]}).` : "");
    setResults([]);
    setFiles((prev) => [...prev, ...accepted.filter((f) => !prev.some((p) => p.name === f.name && p.size === f.size))]);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  const validate = () => {
    if (!batchName) return "Please select a batch.";
    if (!mentorName) return "Please select your name.";
    if (!sessionType) return "Please choose the session type.";
    if (!selectedSession) return "Please select a session.";
    if (!resourceType) return "Please choose a resource type.";
    const filledLinks = links.filter((l) => l.url.trim());
    if (!files.length && !filledLinks.length) {
      return acceptsLinks ? "Add at least one file or link." : "Add at least one file.";
    }
    for (const l of filledLinks) {
      if (!l.title.trim()) return "Every link needs a title.";
    }
    return "";
  };

  const handleSubmit = async () => {
    const error = validate();
    if (error) {
      setFormError(error);
      return;
    }
    setFormError("");
    setSubmitting(true);

    const mentor = mentors.find((m) => m.name === selectedSession.mentor_name);
    const matchingRequirement = requirements.find((r) => r.resource_type === resourceType && r.resource_category);

    const items = [
      ...files.map((file) => ({ kind: "file", label: file.name, title: stripExtension(file.name), file })),
      ...links.filter((l) => l.url.trim()).map((l) => ({ kind: "link", label: l.title.trim(), title: l.title.trim(), url: l.url.trim() })),
    ];

    const outcome = [];
    // One at a time: the backend matches each upload to a pending requirement
    // for the session, so concurrent requests could race on the same one.
    for (const item of items) {
      const body = new FormData();
      body.append("session_id", selectedSession.id);
      if (mentor) body.append("mentor_id", mentor.id);
      body.append("mentor_name", selectedSession.mentor_name || "");
      body.append("batch_name", selectedSession.batch_name || "");
      body.append("course_name", selectedSession.course_name || "");
      body.append("session_topic", selectedSession.topic || "");
      body.append("session_date", selectedSession.session_date || "");
      body.append("resource_type", resourceType);
      if (matchingRequirement?.resource_category) body.append("resource_category", matchingRequirement.resource_category);
      body.append("resource_title", item.title);
      if (item.url) body.append("resource_url", item.url);
      if (notes.trim()) body.append("description", notes.trim());
      if (currentUser?.name) body.append("created_by", currentUser.name);
      if (item.file) body.append("file", item.file);

      try {
        const res = await fetch(`${API}/resources`, { method: "POST", body });
        const data = await res.json();
        outcome.push({ label: item.label, success: data.success !== false && res.ok, message: data.message || (res.ok ? "Submitted" : "Upload failed") });
      } catch {
        outcome.push({ label: item.label, success: false, message: "Unable to reach the server." });
      }
    }

    setResults(outcome);
    setSubmitting(false);
    loadSessionState(sessionId);

    if (outcome.every((o) => o.success)) {
      setFiles([]);
      setLinks([{ title: "", url: "" }]);
      setNotes("");
    }
  };

  const typeGroups = useMemo(() => {
    const requiredTypes = RESOURCE_TYPES.filter((t) => outstandingTypes.has(t.value));
    const extraRequired = [...outstandingTypes].filter((v) => !typeConfig(v)).map((v) => ({ value: v, label: v }));
    const others = RESOURCE_TYPES.filter((t) => !outstandingTypes.has(t.value));
    return { required: [...requiredTypes, ...extraRequired], others };
  }, [outstandingTypes]);

  return (
    <ProtectedRoute>
      <>
        <Sidebar />

        <div className="page">
          <PortalHeader subtitle="Upload and manage session resources for your learners" tagline="Knowledge shared, learners empowered" />

          <div className="layout">
            {/* ---------- Upload form ---------- */}
            <section className="panel">
              <div className="panel-head">
                <span className="panel-icon"><UploadCloud size={22} strokeWidth={2.1} /></span>
                <div>
                  <h2>Upload Resource</h2>
                  <p>Select a session and upload the required resource files for your learners.</p>
                </div>
              </div>

              <div className="form-grid">
                <div className="fields">
                  <label className="field">
                    <span>Select Batch <b>*</b></span>
                    <select value={batchName} onChange={(e) => changeBatch(e.target.value)}>
                      <option value="">Choose a batch</option>
                      {batchOptions.map((b) => <option key={b} value={b}>{b}</option>)}
                      {hasUnbatched && <option value={NO_BATCH}>No batch (webinars)</option>}
                    </select>
                  </label>

                  <label className="field">
                    <span>Select Mentor <b>*</b></span>
                    <div className="mentor-select">
                      {mentorName && <MentorAvatar mentor={selectedMentor} name={mentorName} size={28} />}
                      <select value={mentorName} onChange={(e) => changeMentor(e.target.value)} disabled={!batchName}>
                        <option value="">Choose your name</option>
                        {mentorOptions.map((m) => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                  </label>

                  <label className="field">
                    <span>Session Type <b>*</b></span>
                    <select value={sessionType} onChange={(e) => changeSessionType(e.target.value)} disabled={!mentorName}>
                      <option value="">Choose session type</option>
                      {SESSION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </label>

                  <label className="field">
                    <span>Select Session <b>*</b></span>
                    <select value={sessionId} onChange={(e) => changeSession(e.target.value)} disabled={!sessionType || !sessionOptions.length}>
                      <option value="">{sessionType && !sessionOptions.length ? "No sessions found" : "Choose a session"}</option>
                      {sessionOptions.map((s) => (
                        <option key={s.id} value={s.id}>{`${s.topic || "Untitled"} — ${s.session_date || "no date"}`}</option>
                      ))}
                    </select>
                  </label>

                  <label className="field">
                    <span>Resource Type <b>*</b></span>
                    <select value={resourceType} onChange={(e) => changeType(e.target.value)} disabled={!selectedSession}>
                      <option value="">Choose resource type</option>
                      {typeGroups.required.length > 0 && (
                        <optgroup label="Required for this session">
                          {typeGroups.required.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </optgroup>
                      )}
                      <optgroup label={typeGroups.required.length ? "All other types" : "Resource types"}>
                        {typeGroups.others.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </optgroup>
                    </select>
                  </label>
                </div>

                {acceptsFiles ? (
                  <div
                    className={`dropzone ${dragOver ? "dropzone-over" : ""}`}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={onDrop}
                  >
                    <UploadCloud size={34} strokeWidth={1.6} className="dz-icon" />
                    <div className="dz-title">Drag &amp; drop files here</div>
                    <div className="dz-sub">or click to browse</div>
                    <div className="dz-hint">
                      {resourceType && FILE_ACCEPT[resourceType]
                        ? `Accepted for ${typeLabel(resourceType)}: ${FILE_ACCEPT[resourceType].replace(/,/g, ", ")}`
                        : "Choose a resource type to see the accepted formats"}
                    </div>
                    <input
                      ref={fileInput}
                      type="file"
                      multiple
                      hidden
                      accept={FILE_ACCEPT[resourceType] || undefined}
                      onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
                    />
                    <button type="button" className="btn-choose" onClick={() => fileInput.current?.click()}>Choose Files</button>
                  </div>
                ) : (
                  <div className="links-box">
                    <div className="links-title"><Link2 size={16} /> Add {typeLabel(resourceType)}</div>
                    {links.map((l, i) => (
                      <div key={i} className="link-row">
                        <input placeholder="Title (e.g. RAG Session Repo)" value={l.title} onChange={(e) => setLinks((prev) => prev.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
                        <input type="url" placeholder="https://…" value={l.url} onChange={(e) => setLinks((prev) => prev.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
                        {links.length > 1 && (
                          <button type="button" className="icon-btn" onClick={() => setLinks((prev) => prev.filter((_, j) => j !== i))} aria-label="Remove link"><X size={14} /></button>
                        )}
                      </div>
                    ))}
                    <button type="button" className="btn-add-link" onClick={() => setLinks((prev) => [...prev, { title: "", url: "" }])}><Plus size={14} /> Add another link</button>
                  </div>
                )}
              </div>

              {acceptsFiles && acceptsLinks && (
                <div className="links-box links-box-inline">
                  <div className="links-title"><Link2 size={16} /> Or add a link</div>
                  {links.map((l, i) => (
                    <div key={i} className="link-row">
                      <input placeholder="Title" value={l.title} onChange={(e) => setLinks((prev) => prev.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
                      <input type="url" placeholder="https://…" value={l.url} onChange={(e) => setLinks((prev) => prev.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
                    </div>
                  ))}
                </div>
              )}

              {selectedSession && requirements.some((r) => r.status !== "Not Required") && (
                <div className="requirements">
                  <div className="section-label">Required for this session</div>
                  <div className="req-chips">
                    {requirements.filter((r) => r.status !== "Not Required").map((r) => {
                      const done = r.status === "Received" || r.status === "Delayed" || r.status === "Complete" || !!r.received_at;
                      const overdue = r.status === "Overdue";
                      return (
                        <span key={r.id} className={`chip ${done ? "chip-done" : overdue ? "chip-overdue" : "chip-pending"}`}>
                          {done ? <CheckCircle2 size={13} /> : overdue ? <AlertTriangle size={13} /> : <Clock size={13} />}
                          {r.resource_name || typeLabel(r.resource_type)}
                          <em>{done ? "Received" : r.due_at ? `Due ${formatDate(r.due_at)} ${formatTime(r.due_at)}` : r.status}</em>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="selected">
                <div className="section-label">Selected Files ({files.length})</div>
                <div className="file-list">
                  {files.length === 0 ? (
                    <div className="file-empty"><FileText size={15} /> No files selected yet.</div>
                  ) : (
                    files.map((f, i) => (
                      <div key={`${f.name}-${i}`} className="file-item">
                        <FileText size={15} />
                        <span className="file-name">{f.name}</span>
                        <span className="file-size">{formatFileSize(f.size)}</span>
                        <button type="button" className="icon-btn" onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))} aria-label={`Remove ${f.name}`}><X size={14} /></button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="notes">
                <div className="section-label">Notes (Optional)</div>
                <textarea
                  rows={2}
                  maxLength={NOTES_LIMIT}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any additional notes for learners…"
                />
                <div className="counter">{notes.length}/{NOTES_LIMIT}</div>
              </div>

              {formError && <div className="alert alert-error"><AlertTriangle size={15} /> {formError}</div>}
              {results.length > 0 && (
                <div className="results">
                  {results.map((r, i) => (
                    <div key={i} className={`alert ${r.success ? "alert-ok" : "alert-error"}`}>
                      {r.success ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                      <strong>{r.label}</strong> — {r.message}
                    </div>
                  ))}
                </div>
              )}

              <div className="actions">
                <button type="button" className="btn-upload" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? <><Loader2 size={16} className="spin" /> Uploading…</> : <><UploadCloud size={16} /> Upload Resource</>}
                </button>
              </div>

              {selectedSession && existingResources.length > 0 && (
                <div className="existing">
                  <div className="section-label">Already submitted for “{selectedSession.topic}”</div>
                  <SubmittedResourcesList resources={existingResources} />
                </div>
              )}
            </section>

            {/* ---------- Side cards ---------- */}
            <aside className="side">
              <div className="side-card">
                <span className="side-icon side-icon-green"><BookOpen size={22} /></span>
                <div>
                  <h3>Resource Guidelines</h3>
                  <p>Please make sure you upload the correct and final version of the resource.</p>
                  <ul>
                    <li><CheckCircle2 size={15} /> Select the correct batch and session</li>
                    <li><CheckCircle2 size={15} /> Upload only relevant and finalized content</li>
                    <li><CheckCircle2 size={15} /> Choose the type that matches what you upload</li>
                    <li><CheckCircle2 size={15} /> A confirmation email is sent after each successful upload</li>
                  </ul>
                </div>
              </div>

              <div className="side-card side-card-blue">
                <span className="side-icon side-icon-blue"><Clock size={22} /></span>
                <div>
                  <h3 className="blue">Need to upload later?</h3>
                  <p>You can check all your sessions and due dates in the Resource Tracker.</p>
                  <Link href="/resources/tracking" className="btn-tracker">View Tracker <ArrowRight size={14} /></Link>
                </div>
              </div>

              <div className="side-card side-card-amber">
                <span className="side-icon side-icon-amber"><Lightbulb size={22} /></span>
                <div>
                  <h3 className="amber">Reminder</h3>
                  <p>{reminderText(schedulerStatus)}</p>
                </div>
              </div>
            </aside>
          </div>
        </div>

        <style jsx>{`
          .page { margin-left: var(--om-sidebar-width, 280px); transition: margin-left 0.25s ease; padding: 26px 30px 50px; background: #eef3fa; min-height: 100vh; }
          .layout { display: grid; grid-template-columns: minmax(0, 1fr) 380px; gap: 18px; align-items: start; }

          .panel { background: #fff; border: 1px solid #e3eaf4; border-radius: 14px; padding: 22px 24px; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05); }
          .panel-head { display: flex; align-items: center; gap: 14px; padding-bottom: 14px; margin-bottom: 18px; border-bottom: 1px solid #eef2f7; }
          .panel-icon { width: 46px; height: 46px; border-radius: 12px; background: #e0edff; color: #2563eb; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
          h2 { margin: 0; font-size: 19px; font-weight: 800; color: #0f172a; }
          .panel-head p { margin: 3px 0 0; font-size: 12.5px; color: #64748b; }

          .form-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 16px; }
          .fields { border: 1px solid #e6ecf5; border-radius: 10px; padding: 14px 16px; display: flex; flex-direction: column; gap: 14px; background: #fbfdff; }
          .field { display: flex; flex-direction: column; gap: 6px; }
          .field span { font-size: 12px; font-weight: 700; color: #1e293b; }
          .field b { color: #dc2626; }
          select, textarea, .link-row input { border: 1px solid #d8e1ee; border-radius: 8px; background: #fff; padding: 10px 12px; font-size: 13px; color: #0f172a; outline: none; font-family: inherit; }
          select:focus, textarea:focus, .link-row input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12); }
          .mentor-select { display: flex; align-items: center; gap: 8px; }
          .mentor-select select { flex: 1; min-width: 0; }
          select:disabled { background: #f1f5f9; color: #94a3b8; cursor: not-allowed; }

          .dropzone { border: 1.5px dashed #93b4ea; background: #f5f9ff; border-radius: 10px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 22px 16px; gap: 4px; transition: background 0.15s ease, border-color 0.15s ease; }
          .dropzone-over { background: #e6f0ff; border-color: #2563eb; }
          .dropzone :global(.dz-icon) { color: #2563eb; margin-bottom: 4px; }
          .dz-title { font-size: 15px; font-weight: 800; color: #0f172a; }
          .dz-sub { font-size: 12px; color: #475569; }
          .dz-hint { font-size: 10.5px; color: #64748b; margin: 6px 0 10px; max-width: 320px; }
          .btn-choose { background: #2563eb; color: #fff; border: none; border-radius: 6px; padding: 9px 22px; font-size: 13px; font-weight: 700; cursor: pointer; }
          .btn-choose:hover { background: #1d4ed8; }

          .links-box { border: 1px solid #e6ecf5; border-radius: 10px; padding: 14px 16px; background: #fbfdff; display: flex; flex-direction: column; gap: 10px; }
          .links-box-inline { margin-top: 14px; }
          .links-title { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 800; color: #0f172a; }
          .link-row { display: flex; gap: 8px; align-items: center; }
          .link-row input { flex: 1; min-width: 0; }
          .btn-add-link { align-self: flex-start; display: inline-flex; align-items: center; gap: 6px; background: none; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 7px 12px; font-size: 12px; font-weight: 600; color: #334155; cursor: pointer; }

          .section-label { font-size: 12px; font-weight: 700; color: #1e293b; margin-bottom: 8px; }
          .requirements { margin-top: 18px; }
          .req-chips { display: flex; flex-wrap: wrap; gap: 8px; }
          .chip { display: inline-flex; align-items: center; gap: 6px; border-radius: 999px; padding: 5px 11px; font-size: 12px; font-weight: 700; }
          .chip em { font-style: normal; font-weight: 600; opacity: 0.85; }
          .chip-done { background: #dcfce7; color: #166534; }
          .chip-pending { background: #fef9c3; color: #854d0e; }
          .chip-overdue { background: #fee2e2; color: #991b1b; }

          .selected { margin-top: 18px; }
          .file-list { border: 1px solid #e3eaf4; border-radius: 8px; background: #f8fafc; }
          .file-empty { display: flex; align-items: center; gap: 8px; padding: 12px 14px; font-size: 12.5px; color: #64748b; }
          .file-item { display: flex; align-items: center; gap: 10px; padding: 9px 14px; font-size: 12.5px; color: #1e293b; border-bottom: 1px solid #edf1f7; }
          .file-item:last-child { border-bottom: none; }
          .file-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 600; }
          .file-size { color: #94a3b8; font-size: 11.5px; }
          .icon-btn { background: none; border: none; color: #94a3b8; cursor: pointer; display: flex; padding: 4px; border-radius: 6px; }
          .icon-btn:hover { background: #e2e8f0; color: #334155; }

          .notes { margin-top: 18px; position: relative; }
          textarea { width: 100%; box-sizing: border-box; resize: vertical; }
          .counter { position: absolute; right: 12px; bottom: 8px; font-size: 10.5px; color: #94a3b8; }

          .alert { display: flex; align-items: flex-start; gap: 8px; border-radius: 8px; padding: 10px 14px; font-size: 12.5px; margin-top: 14px; }
          .alert-error { background: #fee2e2; color: #991b1b; }
          .alert-ok { background: #dcfce7; color: #166534; }
          .results .alert { margin-top: 8px; }

          .actions { display: flex; justify-content: flex-end; margin-top: 18px; }
          .btn-upload { display: inline-flex; align-items: center; gap: 8px; background: #2563eb; color: #fff; border: none; border-radius: 8px; padding: 12px 24px; font-size: 14px; font-weight: 700; cursor: pointer; box-shadow: 0 8px 18px -10px rgba(37, 99, 235, 0.8); }
          .btn-upload:hover:not(:disabled) { background: #1d4ed8; }
          .btn-upload:disabled { background: #93a7cc; cursor: not-allowed; box-shadow: none; }
          .btn-upload :global(.spin) { animation: spin 0.9s linear infinite; }
          .existing { margin-top: 22px; padding-top: 18px; border-top: 1px solid #eef2f7; }

          .side { display: flex; flex-direction: column; gap: 14px; }
          .side-card { display: flex; gap: 14px; background: #fff; border: 1px solid #e3eaf4; border-radius: 14px; padding: 20px; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05); }
          .side-card-blue { background: #f1f6ff; }
          .side-card-amber { background: #fff8ec; border-color: #fde9c3; }
          .side-icon { width: 46px; height: 46px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
          .side-icon-green { background: #d1fae5; color: #059669; }
          .side-icon-blue { background: #dbe8ff; color: #2563eb; }
          .side-icon-amber { background: #ffe7bd; color: #d97706; }
          h3 { margin: 0 0 4px; font-size: 15px; font-weight: 800; color: #1d4ed8; }
          h3.blue { color: #1d4ed8; }
          h3.amber { color: #b45309; }
          .side-card:first-child h3 { color: #059669; }
          .side-card p { margin: 0; font-size: 12.5px; color: #475569; line-height: 1.5; }
          ul { list-style: none; margin: 12px 0 0; padding: 0; display: flex; flex-direction: column; gap: 9px; }
          li { display: flex; align-items: flex-start; gap: 9px; font-size: 12.5px; color: #1e293b; }
          li :global(svg) { color: #16a34a; flex-shrink: 0; margin-top: 1px; }
          .side :global(.btn-tracker) { display: inline-flex; align-items: center; gap: 8px; margin-top: 12px; background: #fff; color: #1d4ed8; border: 1px solid #93b4ea; border-radius: 6px; padding: 7px 14px; font-size: 12.5px; font-weight: 700; text-decoration: none; }
          .side :global(.btn-tracker:hover) { background: #eff6ff; }

          @keyframes spin { to { transform: rotate(360deg); } }
          @media (max-width: 1250px) { .layout { grid-template-columns: 1fr; } }
          @media (max-width: 900px) { .form-grid { grid-template-columns: 1fr; } }
        `}</style>
      </>
    </ProtectedRoute>
  );
}
