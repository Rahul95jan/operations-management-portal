import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import ProtectedRoute from "../../components/ProtectedRoute";

const API = "http://127.0.0.1:8000";

const inputStyle = { width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "14px", background: "#f8fafc", boxSizing: "border-box", outline: "none" };

export default function WebinarImportPage() {
  const [webinars, setWebinars] = useState([]);
  const [webinarId, setWebinarId] = useState("");
  const [file, setFile] = useState(null);

  const [preview, setPreview] = useState(null);
  const [mapping, setMapping] = useState({});
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState("");

  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetch(`${API}/webinars?stats=true`).then((r) => r.json()).then((d) => setWebinars(Array.isArray(d) ? d : [])).catch(() => setWebinars([]));
  }, []);

  const handleFileChange = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(null);
    setResult(null);
    setPreviewError("");
    setLoadingPreview(true);

    const body = new FormData();
    body.append("file", f);

    try {
      const res = await fetch(`${API}/webinars/import/preview`, { method: "POST", body });
      const data = await res.json();
      if (!data.success) {
        setPreviewError(data.message);
      } else {
        setPreview(data);
        // Best-effort auto-map: if a column name loosely matches a target field, pre-select it.
        const autoMap = {};
        Object.keys(data.target_fields).forEach((field) => {
          const match = data.columns.find((c) => c.toLowerCase().replace(/[^a-z]/g, "").includes(field.replace(/_/g, "")));
          if (match) autoMap[field] = match;
        });
        setMapping(autoMap);
      }
    } catch (err) {
      setPreviewError("Unable to reach the server.");
    } finally {
      setLoadingPreview(false);
    }
  };

  const runImport = async () => {
    if (!webinarId) {
      alert("Select a target webinar first.");
      return;
    }
    if (!mapping.name || !mapping.email) {
      alert("Name and Email columns must be mapped.");
      return;
    }

    setImporting(true);
    setResult(null);

    const body = new FormData();
    body.append("file", file);
    body.append("column_mapping", JSON.stringify(mapping));

    try {
      const res = await fetch(`${API}/webinars/${webinarId}/import/participants`, { method: "POST", body });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ success: false, message: "Unable to reach the server." });
    } finally {
      setImporting(false);
    }
  };

  return (
    <ProtectedRoute>
      <>
        <Sidebar />

        <div style={{ marginLeft: "280px", padding: "32px 36px 60px", background: "#f1f5f9", minHeight: "100vh" }}>
          <div className="page-hero">
            <div className="page-hero-blob" />
            <div className="page-hero-content">
              <div className="page-hero-eyebrow">Webinars</div>
              <h1 className="page-hero-title">Import Participants</h1>
              <p className="page-hero-subtitle">Upload a CSV/XLSX (e.g. exported from your Google Sheet), preview it, map columns, then confirm.</p>
            </div>
          </div>

          <div className="card">
            <h2 className="card-title">1. Choose Target Webinar &amp; File</h2>
            <div className="form-row">
              <div style={{ flex: 1 }}>
                <label className="field-label">Target Webinar</label>
                <select style={inputStyle} value={webinarId} onChange={(e) => setWebinarId(e.target.value)}>
                  <option value="">Select a webinar...</option>
                  {webinars.map((w) => <option key={w.id} value={w.id}>{w.title} ({w.session_date})</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label className="field-label">CSV or XLSX File</label>
                <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} style={inputStyle} />
              </div>
            </div>
            {loadingPreview && <p style={{ color: "#94a3b8", fontSize: "13px", marginTop: "12px" }}>Reading file…</p>}
            {previewError && <div className="form-error">{previewError}</div>}
          </div>

          {preview && (
            <>
              <div className="card">
                <h2 className="card-title">2. Map Columns ({preview.row_count} rows detected)</h2>
                <div className="mapping-grid">
                  {Object.entries(preview.target_fields).map(([field, label]) => (
                    <div key={field}>
                      <label className="field-label">{label}</label>
                      <select style={inputStyle} value={mapping[field] || ""} onChange={(e) => setMapping({ ...mapping, [field]: e.target.value })}>
                        <option value="">— Not mapped —</option>
                        {preview.columns.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h2 className="card-title">3. Preview (first {preview.preview_rows.length} rows)</h2>
                <div className="table-wrap">
                  <table className="styled-table">
                    <thead>
                      <tr>{preview.columns.map((c) => <th key={c}>{c}</th>)}</tr>
                    </thead>
                    <tbody>
                      {preview.preview_rows.map((row, i) => (
                        <tr key={i}>{preview.columns.map((c) => <td key={c}>{row[c] || "—"}</td>)}</tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ marginTop: "20px" }}>
                  <button className="btn btn-primary" onClick={runImport} disabled={importing}>
                    {importing ? "Importing..." : `Confirm Import (${preview.row_count} rows)`}
                  </button>
                </div>
              </div>
            </>
          )}

          {result && (
            <div className="card">
              <h2 className="card-title">Import Result</h2>
              {result.success === false ? (
                <div className="form-error">{result.message}</div>
              ) : (
                <>
                  <div className="result-row"><span>✅ Imported</span><strong>{result.imported}</strong></div>
                  <div className="result-row"><span>⚠️ Skipped (duplicates)</span><strong>{result.skipped_duplicates}</strong></div>
                  <div className="result-row"><span>❌ Errors</span><strong>{result.errors.length}</strong></div>
                  {result.errors.length > 0 && (
                    <div style={{ marginTop: "12px" }}>
                      {result.errors.map((e, i) => (
                        <div key={i} style={{ fontSize: "12px", color: "#991b1b" }}>Row {e.row}: {e.reason}</div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <style jsx>{`
          .page-hero { position: relative; overflow: hidden; border-radius: 18px; padding: 30px 32px; margin-bottom: 24px; background: linear-gradient(120deg, #0f172a 0%, #1e293b 60%, #0f172a 100%); display: flex; align-items: center; justify-content: space-between; gap: 20px; box-shadow: 0 16px 32px -18px rgba(15, 23, 42, 0.55); }
          .page-hero-blob { position: absolute; width: 220px; height: 220px; border-radius: 50%; background: #8b5cf6; filter: blur(60px); opacity: 0.3; top: -80px; right: 160px; }
          .page-hero-content { position: relative; z-index: 1; }
          .page-hero-eyebrow { display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #fbbf24; background: rgba(251, 191, 36, 0.12); border: 1px solid rgba(251, 191, 36, 0.3); padding: 5px 10px; border-radius: 999px; margin-bottom: 10px; }
          .page-hero-title { font-size: 26px; font-weight: 800; color: #f8fafc; margin: 0 0 6px; }
          .page-hero-subtitle { color: #94a3b8; font-size: 14px; margin: 0; max-width: 520px; }

          .card { background: #ffffff; border-radius: 16px; padding: 22px 24px; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06); border: 1px solid #eef2f7; margin-bottom: 24px; }
          .card-title { margin: 0 0 16px; font-size: 16px; color: #1e293b; }
          .field-label { display: block; font-size: 12px; font-weight: 700; color: #64748b; margin-bottom: 6px; }

          .form-row { display: flex; gap: 20px; flex-wrap: wrap; }
          .mapping-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }

          .form-error { background: #fee2e2; color: #991b1b; padding: 10px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; margin-top: 14px; }

          .btn { border: none; border-radius: 10px; padding: 11px 20px; font-size: 14px; font-weight: 700; cursor: pointer; }
          .btn:disabled { cursor: not-allowed; opacity: 0.6; }
          .btn-primary { background: linear-gradient(120deg, #f59e0b, #fbbf24); color: #0f172a; }

          .table-wrap { overflow-x: auto; }
          .styled-table { width: 100%; border-collapse: collapse; font-size: 13px; }
          .styled-table thead th { text-align: left; font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: 700; padding: 8px 10px; border-bottom: 2px solid #f1f5f9; white-space: nowrap; }
          .styled-table td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; color: #1e293b; white-space: nowrap; }

          .result-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
        `}</style>
      </>
    </ProtectedRoute>
  );
}
