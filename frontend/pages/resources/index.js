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
              <div className="page-hero-eyebrow">Resource Portal</div>
              <h1 className="page-hero-title">📦 Submit Session Resources</h1>
              <p className="page-hero-subtitle">
                Code, notes, slides, recordings — submit everything mentors owe for a session.
              </p>
            </div>
            <div className="page-hero-stats">
              <div className="page-hero-stat">
                <div className="page-hero-stat-value">{sessions.length}</div>
                <div className="page-hero-stat-label">Sessions Available</div>
              </div>
              <div className="page-hero-stat">
                <div className="page-hero-stat-value">{existingResources.length}</div>
                <div className="page-hero-stat-label">Already Submitted</div>
              </div>
            </div>
          </div>

          <div className="card">
            <SessionPicker sessions={sessions} selectedSession={selectedSession} onSelect={handleSessionSelect} />

            <div style={{ marginBottom: "24px", maxWidth: "300px" }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: "8px", fontSize: "13px", color: "#334155" }}>
                Submitted By
              </label>
              <input
                type="text"
                value={submittedBy}
                onChange={(e) => setSubmittedBy(e.target.value)}
                placeholder="Your name"
                className="styled-input"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </div>

            {selectedSession && (
              <>
                <h3 className="subheading">📝 Resources</h3>

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

                <button type="button" onClick={addRow} className="btn btn-add">
                  + Add Another Resource
                </button>

                {formError && <div className="form-error">{formError}</div>}

                <button type="button" onClick={handleSubmit} disabled={submitting} className="btn btn-submit">
                  {submitting ? "Submitting..." : "Submit Resources"}
                </button>
              </>
            )}
          </div>

          {selectedSession && (
            <div className="card" style={{ marginTop: "24px" }}>
              <h3 className="subheading" style={{ marginTop: 0 }}>
                📋 Already Submitted for "{selectedSession.topic}"
              </h3>
              <SubmittedResourcesList resources={existingResources} />
            </div>
          )}
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
            background: #facc15;
            filter: blur(60px);
            opacity: 0.25;
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
            animation: fadeSlideUp 0.4s ease both;
          }

          .subheading {
            font-size: 15px;
            color: #1e293b;
            margin: 0 0 14px;
          }

          .styled-input:focus {
            border-color: #f59e0b !important;
            background: #ffffff !important;
            box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15);
          }

          .btn {
            border: none;
            border-radius: 10px;
            padding: 12px 20px;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.15s ease;
          }

          .btn:disabled {
            cursor: not-allowed;
          }

          .btn-add {
            background: #f1f5f9;
            color: #334155;
            border: 1.5px dashed #cbd5e1 !important;
            font-weight: 600;
            font-size: 13px;
            margin-bottom: 20px;
          }

          .btn-add:hover {
            background: #e2e8f0;
          }

          .btn-submit {
            background: linear-gradient(120deg, #0f172a, #1e293b);
            color: #facc15;
            box-shadow: 0 6px 16px -6px rgba(15, 23, 42, 0.5);
          }

          .btn-submit:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 10px 20px -6px rgba(15, 23, 42, 0.6);
          }

          .btn-submit:disabled {
            background: #94a3b8;
            color: #f1f5f9;
          }

          .form-error {
            background: #fee2e2;
            color: #991b1b;
            padding: 10px 14px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 600;
            margin-bottom: 16px;
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
              transform: translateY(8px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </>
    </ProtectedRoute>
  );
}
