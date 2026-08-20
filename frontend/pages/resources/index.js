import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import ProtectedRoute from "../../components/ProtectedRoute";
import SessionPicker from "../../components/resources/SessionPicker";
import ResourceRow from "../../components/resources/ResourceRow";
import SubmittedResourcesList from "../../components/resources/SubmittedResourcesList";

function emptyRow() {
  return {
    resource_type: "",
    resource_title: "",
    resource_url: "",
    file: null,
    description: "",
    result: null,
  };
}

export default function ResourcesPage() {
  const [sessions, setSessions] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [submittedBy, setSubmittedBy] = useState("");
  const [rows, setRows] = useState([emptyRow()]);
  const [submitting, setSubmitting] = useState(false);
  const [existingResources, setExistingResources] = useState([]);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/sessions")
      .then((res) => res.json())
      .then((data) => setSessions(Array.isArray(data) ? data : []))
      .catch(() => setSessions([]));

    fetch("http://127.0.0.1:8000/mentors")
      .then((res) => res.json())
      .then((data) => setMentors(Array.isArray(data) ? data : []))
      .catch(() => setMentors([]));
  }, []);

  const loadExistingResources = (sessionId) => {
    fetch(`http://127.0.0.1:8000/resources?session_id=${sessionId}`)
      .then((res) => res.json())
      .then((data) => setExistingResources(Array.isArray(data) ? data : []))
      .catch(() => setExistingResources([]));
  };

  const handleSessionSelect = (session) => {
    setSelectedSession(session);
    setFormError("");

    if (session) {
      loadExistingResources(session.id);
    } else {
      setExistingResources([]);
    }
  };

  const updateRow = (index, field, value) => {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value, result: null } : row))
    );
  };

  const addRow = () => setRows((prev) => [...prev, emptyRow()]);

  const removeRow = (index) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    if (!selectedSession) return "Please select a session first.";

    for (const row of rows) {
      if (!row.resource_type) return "Every resource needs a type selected.";
      if (!row.resource_title.trim()) return "Every resource needs a title.";
      if (!row.resource_url && !row.file) {
        return `Provide a URL or file for "${row.resource_title || "a resource"}".`;
      }
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

    const results = await Promise.all(
      rows.map(async (row) => {
        const body = new FormData();
        body.append("session_id", selectedSession.id);
        if (mentor) body.append("mentor_id", mentor.id);
        body.append("mentor_name", selectedSession.mentor_name || "");
        body.append("batch_name", selectedSession.batch_name || "");
        body.append("course_name", selectedSession.course_name || "");
        body.append("session_topic", selectedSession.topic || "");
        body.append("resource_type", row.resource_type);
        body.append("resource_title", row.resource_title);
        if (row.resource_url) body.append("resource_url", row.resource_url);
        if (row.description) body.append("description", row.description);
        if (submittedBy) body.append("created_by", submittedBy);
        if (row.file) body.append("file", row.file);

        try {
          const res = await fetch("http://127.0.0.1:8000/resources", {
            method: "POST",
            body,
          });
          const data = await res.json();
          return { success: data.success !== false, message: data.message };
        } catch (err) {
          return { success: false, message: "Unable to reach the server." };
        }
      })
    );

    setRows((prev) => prev.map((row, i) => ({ ...row, result: results[i] })));
    setSubmitting(false);

    if (results.every((r) => r.success)) {
      loadExistingResources(selectedSession.id);
      setTimeout(() => setRows([emptyRow()]), 1200);
    }
  };

  return (
    <ProtectedRoute>
      <>
        <Sidebar />

        <div
          style={{
            marginLeft: "300px",
            padding: "30px",
            background: "#f8fafc",
            minHeight: "100vh",
          }}
        >
          <h1 style={{ fontSize: "32px", fontWeight: 700, marginBottom: "6px" }}>
            📦 Resource Portal
          </h1>
          <p style={{ color: "#64748b", marginTop: 0, marginBottom: "30px" }}>
            Submit session resources — code, notes, slides, recordings, and more.
          </p>

          <div
            style={{
              background: "#fff",
              borderRadius: "12px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
              padding: "24px",
              marginBottom: "30px",
            }}
          >
            <SessionPicker
              sessions={sessions}
              selectedSession={selectedSession}
              onSelect={handleSessionSelect}
            />

            <div style={{ marginBottom: "24px", maxWidth: "300px" }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: "8px", fontSize: "13px" }}>
                Submitted By
              </label>
              <input
                type="text"
                value={submittedBy}
                onChange={(e) => setSubmittedBy(e.target.value)}
                placeholder="Your name"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "9px 11px",
                  borderRadius: "8px",
                  border: "1.5px solid #e2e8f0",
                  fontSize: "14px",
                }}
              />
            </div>

            {selectedSession && (
              <>
                <h3 style={{ marginBottom: "12px" }}>Resources</h3>

                {rows.map((row, i) => (
                  <ResourceRow
                    key={i}
                    row={row}
                    index={i}
                    onChange={(field, value) => updateRow(i, field, value)}
                    onRemove={() => removeRow(i)}
                    canRemove={rows.length > 1}
                  />
                ))}

                <button
                  type="button"
                  onClick={addRow}
                  style={{
                    background: "#f1f5f9",
                    color: "#334155",
                    border: "1.5px dashed #cbd5e1",
                    borderRadius: "10px",
                    padding: "10px 16px",
                    fontWeight: 600,
                    fontSize: "13px",
                    cursor: "pointer",
                    marginBottom: "20px",
                  }}
                >
                  + Add Another Resource
                </button>

                {formError && (
                  <div
                    style={{
                      background: "#fee2e2",
                      color: "#991b1b",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: 600,
                      marginBottom: "16px",
                    }}
                  >
                    {formError}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  style={{
                    background: submitting ? "#94a3b8" : "#0f172a",
                    color: "#facc15",
                    border: "none",
                    padding: "14px 24px",
                    borderRadius: "10px",
                    fontWeight: 700,
                    fontSize: "15px",
                    cursor: submitting ? "not-allowed" : "pointer",
                  }}
                >
                  {submitting ? "Submitting..." : "Submit Resources"}
                </button>
              </>
            )}
          </div>

          {selectedSession && (
            <div
              style={{
                background: "#fff",
                borderRadius: "12px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                padding: "24px",
              }}
            >
              <h3 style={{ marginBottom: "16px" }}>
                Already Submitted for "{selectedSession.topic}"
              </h3>
              <SubmittedResourcesList resources={existingResources} />
            </div>
          )}
        </div>
      </>
    </ProtectedRoute>
  );
}
