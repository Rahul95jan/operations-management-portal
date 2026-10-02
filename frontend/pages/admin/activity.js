import { useEffect, useState } from "react";
import ProtectedRoute from "../../components/ProtectedRoute";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import { History, FileText, FileSpreadsheet } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function fmtDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(null); // "csv" | "pdf" | null
  const [exportError, setExportError] = useState("");

  // Downloads through fetch so the login token is sent (a plain link can't).
  const exportLogs = async (format) => {
    setExporting(format);
    setExportError("");
    try {
      const res = await fetch(`${API}/admin/activity-logs/export?format=${format}`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `activity_log_${new Date().toLocaleDateString("en-CA")}.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setExportError(`Couldn't export the ${format.toUpperCase()}. Please try again.`);
    } finally {
      setExporting(null);
    }
  };

  useEffect(() => {
    fetch(`${API}/admin/activity-logs`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load activity logs.");
        return r.json();
      })
      .then(setLogs)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ProtectedRoute permission={["activity_logs", "view"]}>
      <Sidebar />
      <div style={{ marginLeft: "var(--om-sidebar-width, 280px)", transition: "margin-left 0.25s ease", padding: "28px 32px 56px", background: "var(--om-bg-page)", minHeight: "100vh" }}>
        <Header />

        <div className="page-head">
          <div>
            <h1 className="page-title"><History size={22} strokeWidth={2.2} /> Activity Logs</h1>
            <p className="page-sub">Every access-management action and operational change performed across the portal — most recent first.</p>
          </div>
          <div className="export-actions">
            <button className="btn-export btn-pdf" onClick={() => exportLogs("pdf")} disabled={!!exporting || logs.length === 0}>
              <FileText size={14} strokeWidth={2.3} /> {exporting === "pdf" ? "Exporting…" : "Export PDF"}
            </button>
            <button className="btn-export btn-csv" onClick={() => exportLogs("csv")} disabled={!!exporting || logs.length === 0}>
              <FileSpreadsheet size={14} strokeWidth={2.3} /> {exporting === "csv" ? "Exporting…" : "Export CSV"}
            </button>
          </div>
        </div>
        {exportError && <div className="export-error">{exportError}</div>}

        <div className="card">
          {loading ? (
            <div className="empty-state">Loading…</div>
          ) : error ? (
            <div className="empty-state">{error}</div>
          ) : logs.length === 0 ? (
            <div className="empty-state">No activity recorded yet.</div>
          ) : (
            <div className="log-list">
              {logs.map((l) => (
                <div key={l.id} className="log-row">
                  <div className="log-time">{fmtDateTime(l.timestamp)}</div>
                  <div className="log-body">
                    <div className="log-action">
                      <span className="strong">{l.performed_by || "System"}</span> — {l.action}
                    </div>
                    {l.details && <div className="log-details">{l.details}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .page-head { margin-bottom: 20px; display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
        .export-actions { display: flex; gap: 10px; }
        .btn-export { display: inline-flex; align-items: center; gap: 6px; border: none; border-radius: 8px; padding: 9px 14px; font-size: 12.5px; font-weight: 700; color: #fff; cursor: pointer; white-space: nowrap; }
        .btn-pdf { background: #dc2626; }
        .btn-csv { background: #16a34a; }
        .btn-export:disabled { opacity: 0.55; cursor: not-allowed; }
        .export-error { margin: -8px 0 16px; font-size: 12.5px; font-weight: 600; color: #f87171; }
        .page-title { display: flex; align-items: center; gap: 10px; font-size: 24px; font-weight: 800; color: var(--om-text-primary); margin: 0 0 4px; }
        .page-sub { font-size: 13px; color: var(--om-text-muted); margin: 0; max-width: 560px; }
        :global(.card) { background: var(--om-bg-card); border-radius: 14px; padding: 8px 4px; border: 1px solid var(--om-border-2); }
        .empty-state { text-align: center; padding: 40px; color: var(--om-text-faint); font-size: 13px; }
        .log-list { display: flex; flex-direction: column; }
        .log-row { display: flex; gap: 18px; padding: 14px 18px; border-bottom: 1px solid var(--om-border-4); }
        .log-row:last-child { border-bottom: none; }
        .log-time { width: 170px; flex-shrink: 0; font-size: 12px; color: var(--om-text-faint); font-weight: 600; }
        .log-body { flex: 1; min-width: 0; }
        .log-action { font-size: 13px; color: var(--om-text-strong); }
        .strong { font-weight: 700; color: #f0c75e; }
        .log-details { font-size: 12px; color: var(--om-text-muted); margin-top: 3px; line-height: 1.5; }
      `}</style>
    </ProtectedRoute>
  );
}
