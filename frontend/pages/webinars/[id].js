import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Sidebar from "../../components/Sidebar";
import ProtectedRoute from "../../components/ProtectedRoute";

const API = "http://127.0.0.1:8000";

const LEAD_STATUSES = ["New", "Interested", "Follow-up Required", "Contacted", "Qualified", "Converted", "Not Interested", "Not Reachable"];

const LEAD_COLORS = {
  New: { bg: "#f1f5f9", color: "#475569" },
  Interested: { bg: "#dbeafe", color: "#1d4ed8" },
  "Follow-up Required": { bg: "#fef3c7", color: "#b45309" },
  Contacted: { bg: "#e0e7ff", color: "#4338ca" },
  Qualified: { bg: "#fde68a", color: "#92400e" },
  Converted: { bg: "#dcfce7", color: "#15803d" },
  "Not Interested": { bg: "#fee2e2", color: "#b91c1c" },
  "Not Reachable": { bg: "#fee2e2", color: "#991b1b" },
};

function LeadBadge({ status }) {
  const s = LEAD_COLORS[status] || LEAD_COLORS.New;
  return <span style={{ background: s.bg, color: s.color, fontSize: "11px", fontWeight: 700, padding: "3px 9px", borderRadius: "999px", whiteSpace: "nowrap" }}>{status}</span>;
}

function KPICard({ label, value, color = "#0f172a" }) {
  return (
    <div style={{ background: "#fff", borderLeft: `4px solid ${color}`, padding: "16px 18px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(15,23,42,0.06)" }}>
      <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em", color: "#94a3b8", marginBottom: "6px" }}>{label}</div>
      <div style={{ fontSize: "22px", fontWeight: 800, color }}>{value === null || value === undefined ? "N/A" : value}</div>
    </div>
  );
}

const inputStyle = { width: "100%", padding: "9px 11px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "13px", background: "#f8fafc", boxSizing: "border-box", outline: "none" };

function emptyParticipant() {
  return { name: "", email: "", phone: "", source: "", course_interest: "" };
}

export default function WebinarDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [webinar, setWebinar] = useState(null);
  const [report, setReport] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [payout, setPayout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [newParticipant, setNewParticipant] = useState(emptyParticipant());
  const [regError, setRegError] = useState("");
  const [registering, setRegistering] = useState(false);

  const load = () => {
    if (!id) return;
    setLoading(true);

    Promise.all([
      fetch(`${API}/webinars/${id}`).then((r) => r.json()),
      fetch(`${API}/webinars/${id}/report`).then((r) => r.json()),
      fetch(`${API}/webinars/${id}/participants`).then((r) => r.json()),
      fetch(`${API}/webinars/${id}/payout`).then((r) => r.json()),
    ])
      .then(([webinarData, reportData, participantsData, payoutData]) => {
        if (!webinarData.success) {
          setNotFound(true);
          return;
        }
        setWebinar(webinarData.webinar);
        setReport(reportData.success ? reportData.report : null);
        setParticipants(Array.isArray(participantsData) ? participantsData : []);
        setPayout(payoutData);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const registerParticipant = async () => {
    if (!newParticipant.name.trim() || !newParticipant.email.trim()) {
      setRegError("Name and email are required.");
      return;
    }
    setRegError("");
    setRegistering(true);

    try {
      const res = await fetch(`${API}/webinars/${id}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newParticipant),
      });
      const data = await res.json();
      if (data.success === false) {
        setRegError(data.message);
      } else {
        setNewParticipant(emptyParticipant());
        load();
      }
    } catch (err) {
      setRegError("Unable to reach the server.");
    } finally {
      setRegistering(false);
    }
  };

  const updateParticipant = async (participantId, fields) => {
    await fetch(`${API}/webinars/${id}/participants/${participantId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    load();
  };

  const createPayout = async () => {
    const res = await fetch(`${API}/webinars/${id}/payout`, { method: "POST" });
    const data = await res.json();
    alert(data.message);
    load();
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <>
          <Sidebar />
          <div style={{ marginLeft: "280px", padding: "32px 36px", background: "#f1f5f9", minHeight: "100vh" }}>
            <div className="card">Loading…</div>
          </div>
        </>
      </ProtectedRoute>
    );
  }

  if (notFound || !webinar) {
    return (
      <ProtectedRoute>
        <>
          <Sidebar />
          <div style={{ marginLeft: "280px", padding: "32px 36px", background: "#f1f5f9", minHeight: "100vh" }}>
            <div className="card">Webinar not found. <Link href="/webinars">← Back to Webinars</Link></div>
          </div>
        </>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <>
        <Sidebar />

        <div style={{ marginLeft: "280px", padding: "32px 36px 60px", background: "#f1f5f9", minHeight: "100vh" }}>
          <Link href="/webinars" className="back-link">← Back to Webinars</Link>

          <div className="card" style={{ marginBottom: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
              <div>
                <h1 style={{ margin: "0 0 8px", fontSize: "22px", color: "#0f172a" }}>{webinar.webinar_title}</h1>
                <div style={{ color: "#64748b", fontSize: "14px" }}>
                  {webinar.mentor_name} · {webinar.session_date} {webinar.session_time || ""} · {webinar.duration || "—"} min · {webinar.webinar_status}
                </div>
              </div>
            </div>
          </div>

          {report && (
            <div className="kpi-grid">
              <KPICard label="Registered" value={report.total_registered} />
              <KPICard label="Attended" value={report.total_attended} color="#16a34a" />
              <KPICard label="Attendance %" value={`${report.attendance_percentage}%`} color="#16a34a" />
              <KPICard label="Unique Users" value={report.unique_attendees} />
              <KPICard label="New Users" value={report.new_users} color="#2563eb" />
              <KPICard label="Existing Users" value={report.existing_users} color="#8b5cf6" />
              <KPICard label="Avg Rating" value={report.average_rating ? `${report.average_rating} / 5` : "N/A"} color="#f59e0b" />
              <KPICard label="Qualified Leads" value={report.qualified_leads} color="#f59e0b" />
              <KPICard label="Converted" value={report.converted_leads} color="#16a34a" />
              <KPICard label="Conversion %" value={report.conversion_rate !== null && report.conversion_rate !== undefined ? `${report.conversion_rate}%` : "N/A"} color="#16a34a" />
              <KPICard label="Payout" value={payout?.success ? `₹${payout.estimated_amount}` : "N/A"} color="#0f172a" />
              {report.source === "zoom_analytics" && (
                <div style={{ gridColumn: "1 / -1", fontSize: "12px", color: "#94a3b8" }}>
                  ℹ️ No participant records yet — these figures come from the webinar's own aggregate stats, not individual registrants.
                </div>
              )}
            </div>
          )}

          <div className="card" style={{ marginBottom: "24px" }}>
            <h2 className="card-title">💰 Mentor Payout</h2>
            {payout?.success ? (
              <div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
                <div><div className="mini-label">Duration</div><div className="mini-value">{payout.duration_minutes} min</div></div>
                <div><div className="mini-label">Hourly Rate</div><div className="mini-value">₹{payout.hourly_rate}</div></div>
                <div><div className="mini-label">Estimated Payout</div><div className="mini-value">₹{payout.estimated_amount}</div></div>
                {payout.already_invoiced ? (
                  <span className="invoiced-chip">✓ Invoice #{payout.invoice_id} already created</span>
                ) : (
                  <button className="btn btn-primary" onClick={createPayout}>Create Payout Invoice</button>
                )}
              </div>
            ) : (
              <p style={{ color: "#94a3b8", fontSize: "13px" }}>{payout?.message || "Payout cannot be calculated."}</p>
            )}
          </div>

          <div className="card" style={{ marginBottom: "24px" }}>
            <h2 className="card-title">➕ Register Participant</h2>
            <div className="reg-grid">
              <input style={inputStyle} placeholder="Name" value={newParticipant.name} onChange={(e) => setNewParticipant({ ...newParticipant, name: e.target.value })} />
              <input style={inputStyle} placeholder="Email" value={newParticipant.email} onChange={(e) => setNewParticipant({ ...newParticipant, email: e.target.value })} />
              <input style={inputStyle} placeholder="Phone (optional)" value={newParticipant.phone} onChange={(e) => setNewParticipant({ ...newParticipant, phone: e.target.value })} />
              <input style={inputStyle} placeholder="Source (optional)" value={newParticipant.source} onChange={(e) => setNewParticipant({ ...newParticipant, source: e.target.value })} />
              <input style={inputStyle} placeholder="Course Interest (optional)" value={newParticipant.course_interest} onChange={(e) => setNewParticipant({ ...newParticipant, course_interest: e.target.value })} />
              <button className="btn btn-primary" onClick={registerParticipant} disabled={registering}>{registering ? "Adding..." : "Register"}</button>
            </div>
            {regError && <div className="form-error">{regError}</div>}
          </div>

          <div className="card">
            <h2 className="card-title">👥 Participants ({participants.length})</h2>
            <div className="table-wrap">
              <table className="styled-table" style={{ minWidth: "1100px" }}>
                <thead>
                  <tr>
                    {["Name", "Email", "Attended", "Duration", "Rating", "Existing?", "Lead Status", "Actions"].map((h) => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {participants.map((p) => (
                    <tr key={p.id}>
                      <td className="strong">{p.name}</td>
                      <td className="muted">{p.email}</td>
                      <td>
                        <input type="checkbox" checked={!!p.attended} onChange={(e) => updateParticipant(p.id, { attended: e.target.checked })} />
                      </td>
                      <td className="muted">{p.attendance_duration ? `${p.attendance_duration} min` : "—"}</td>
                      <td>
                        <select style={{ ...inputStyle, width: "70px" }} value={p.rating || ""} onChange={(e) => updateParticipant(p.id, { rating: e.target.value ? Number(e.target.value) : null })}>
                          <option value="">—</option>
                          {[1, 2, 3, 4, 5].map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </td>
                      <td>{p.is_existing_user ? "Yes" : "No"}</td>
                      <td>
                        <select style={{ ...inputStyle, width: "160px" }} value={p.lead_status} onChange={(e) => updateParticipant(p.id, { lead_status: e.target.value })}>
                          {LEAD_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td><LeadBadge status={p.lead_status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {participants.length === 0 && <div className="empty-state">No participants registered yet.</div>}
            </div>
          </div>
        </div>

        <style jsx>{`
          .back-link { display: inline-block; margin-bottom: 16px; color: #475569; font-size: 13px; text-decoration: none; font-weight: 600; }
          .back-link:hover { text-decoration: underline; }

          .card { background: #ffffff; border-radius: 16px; padding: 22px 24px; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06); border: 1px solid #eef2f7; }
          .card-title { margin: 0 0 16px; font-size: 16px; color: #1e293b; }

          .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 14px; margin-bottom: 24px; }

          .mini-label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #94a3b8; margin-bottom: 4px; }
          .mini-value { font-size: 16px; font-weight: 700; color: #0f172a; }

          .invoiced-chip { background: #dcfce7; color: #15803d; padding: 8px 14px; border-radius: 8px; font-size: 13px; font-weight: 700; }

          .reg-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; align-items: end; }

          .btn { border: none; border-radius: 10px; padding: 10px 18px; font-size: 13px; font-weight: 700; cursor: pointer; }
          .btn:disabled { cursor: not-allowed; opacity: 0.6; }
          .btn-primary { background: linear-gradient(120deg, #f59e0b, #fbbf24); color: #0f172a; }

          .form-error { background: #fee2e2; color: #991b1b; padding: 8px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; margin-top: 10px; }

          .table-wrap { overflow-x: auto; }
          .styled-table { width: 100%; border-collapse: collapse; font-size: 13px; }
          .styled-table thead th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: #94a3b8; font-weight: 700; padding: 10px 12px; border-bottom: 2px solid #f1f5f9; white-space: nowrap; }
          .styled-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #1e293b; white-space: nowrap; }
          .styled-table td.muted { color: #94a3b8; }
          .styled-table td.strong { font-weight: 700; }

          .empty-state { text-align: center; padding: 40px 20px; color: #94a3b8; font-size: 14px; }
        `}</style>
      </>
    </ProtectedRoute>
  );
}
