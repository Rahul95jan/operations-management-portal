import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import ResourceRow from "../../../components/resources/ResourceRow";

function rowFromRequirement(req) {
  return {
    resource_category: req.resource_category || "",
    resource_type: req.resource_type || "",
    resource_title: req.resource_name || "",
    resource_url: "",
    file: null,
    description: "",
    result: null,
  };
}

function emptyRow() {
  return {
    resource_category: "",
    resource_type: "",
    resource_title: "",
    resource_url: "",
    file: null,
    description: "",
    result: null,
  };
}

export default function SubmitResourcesByToken() {
  const router = useRouter();
  const { token } = router.query;

  const [loading, setLoading] = useState(true);
  const [invalid, setInvalid] = useState(false);
  const [session, setSession] = useState(null);
  const [rows, setRows] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!token) return;

    fetch(`http://127.0.0.1:8000/resources/submit/${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) {
          setInvalid(true);
          return;
        }
        setSession(data.session);
        const pending = data.pending_requirements || [];
        setRows(pending.length ? pending.map(rowFromRequirement) : [emptyRow()]);
      })
      .catch(() => setInvalid(true))
      .finally(() => setLoading(false));
  }, [token]);

  const updateRow = (index, field, value) => {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value, result: null } : row))
    );
  };

  const addRow = () => setRows((prev) => [...prev, emptyRow()]);
  const removeRow = (index) => setRows((prev) => prev.filter((_, i) => i !== index));

  const validate = () => {
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

    const results = await Promise.all(
      rows.map(async (row) => {
        const body = new FormData();
        body.append("resource_type", row.resource_type);
        if (row.resource_category) body.append("resource_category", row.resource_category);
        body.append("resource_title", row.resource_title);
        if (row.resource_url) body.append("resource_url", row.resource_url);
        if (row.description) body.append("description", row.description);
        if (row.file) body.append("file", row.file);

        try {
          const res = await fetch(`http://127.0.0.1:8000/resources/submit/${token}`, {
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
      setSubmitted(true);
    }
  };

  return (
    <>
      <Head>
        <title>Submit Session Resources</title>
      </Head>

      <div className="page">
        <div className="page-hero">
          <div className="page-hero-blob" />
          <div className="page-hero-content">
            <div className="page-hero-eyebrow">Resource Portal</div>
            <h1 className="page-hero-title">📦 Submit Session Resources</h1>
            <p className="page-hero-subtitle">
              Share your code, notes, slides or recordings for this session — no login needed.
            </p>
          </div>
        </div>

        {loading && <div className="card">Loading…</div>}

        {!loading && invalid && (
          <div className="card">
            <h3 className="subheading" style={{ marginTop: 0 }}>Link not valid</h3>
            <p style={{ color: "#64748b", fontSize: "14px" }}>
              This submission link is invalid or has expired. Please check the link in your email,
              or contact the Operations team for a new one.
            </p>
          </div>
        )}

        {!loading && !invalid && submitted && (
          <div className="card">
            <h3 className="subheading" style={{ marginTop: 0 }}>✓ Resources Submitted Successfully</h3>
            <p style={{ color: "#64748b", fontSize: "14px" }}>
              Thank you — your submission for <strong>{session?.topic}</strong> has been recorded.
              A confirmation email is on its way.
            </p>
          </div>
        )}

        {!loading && !invalid && !submitted && session && (
          <>
            <div className="card">
              <h3 className="subheading" style={{ marginTop: 0 }}>Session Details</h3>
              <div className="detail-grid">
                <div>
                  <div className="detail-label">Mentor</div>
                  <div className="detail-value">{session.mentor_name || "—"}</div>
                </div>
                <div>
                  <div className="detail-label">Batch</div>
                  <div className="detail-value">{session.batch_name || "—"}</div>
                </div>
                <div>
                  <div className="detail-label">Session</div>
                  <div className="detail-value">{session.topic || "—"}</div>
                </div>
                <div>
                  <div className="detail-label">Session Date</div>
                  <div className="detail-value">{session.session_date || "—"}</div>
                </div>
              </div>
            </div>

            <div className="card" style={{ marginTop: "24px" }}>
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
            </div>
          </>
        )}

        <style jsx>{`
          .page {
            max-width: 760px;
            margin: 0 auto;
            padding: 40px 20px 60px;
            background: #f1f5f9;
            min-height: 100vh;
          }

          .page-hero {
            position: relative;
            overflow: hidden;
            border-radius: 18px;
            padding: 30px 32px;
            margin-bottom: 24px;
            background: linear-gradient(120deg, #0f172a 0%, #1e293b 60%, #0f172a 100%);
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
            right: 40px;
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
            font-size: 24px;
            font-weight: 800;
            color: #f8fafc;
            margin: 0 0 6px;
          }

          .page-hero-subtitle {
            color: #94a3b8;
            font-size: 14px;
            margin: 0;
          }

          .card {
            background: #ffffff;
            border-radius: 16px;
            padding: 26px 28px;
            box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
            border: 1px solid #eef2f7;
          }

          .subheading {
            font-size: 15px;
            color: #1e293b;
            margin: 0 0 14px;
          }

          .detail-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
          }

          .detail-label {
            font-size: 11px;
            font-weight: 700;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            margin-bottom: 4px;
          }

          .detail-value {
            font-size: 14px;
            font-weight: 600;
            color: #1e293b;
          }

          .btn {
            border: none;
            border-radius: 10px;
            padding: 12px 20px;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
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

          .btn-submit {
            background: linear-gradient(120deg, #0f172a, #1e293b);
            color: #facc15;
            box-shadow: 0 6px 16px -6px rgba(15, 23, 42, 0.5);
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
        `}</style>
      </div>
    </>
  );
}
