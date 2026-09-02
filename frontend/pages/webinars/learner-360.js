import { useState } from "react";
import Sidebar from "../../components/Sidebar";
import ProtectedRoute from "../../components/ProtectedRoute";

const API = "http://127.0.0.1:8000";

const inputStyle = { padding: "11px 14px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "14px", background: "#f8fafc", boxSizing: "border-box", outline: "none", flex: 1, minWidth: "260px" };

function KPICard({ label, value, color = "#0f172a" }) {
  return (
    <div style={{ background: "#fff", borderLeft: `4px solid ${color}`, padding: "16px 18px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(15,23,42,0.06)" }}>
      <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em", color: "#94a3b8", marginBottom: "6px" }}>{label}</div>
      <div style={{ fontSize: "22px", fontWeight: 800, color }}>{value === null || value === undefined ? "N/A" : value}</div>
    </div>
  );
}

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

export default function Learner360Page() {
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  const search = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setSearched(true);
    setError("");
    setProfile(null);

    try {
      const res = await fetch(`${API}/webinars/lead-profile?email=${encodeURIComponent(email.trim())}`);
      const data = await res.json();
      if (!data.success) {
        setError(data.message);
      } else {
        setProfile(data.profile);
      }
    } catch (err) {
      setError("Unable to reach the server.");
    } finally {
      setLoading(false);
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
              <h1 className="page-hero-title">Learner 360°</h1>
              <p className="page-hero-subtitle">
                Search any email to see their full webinar history — there's no separate learner directory in this
                system, so this view is built entirely from webinar participation records.
              </p>
            </div>
          </div>

          <div className="card">
            <div style={{ display: "flex", gap: "12px" }}>
              <input
                type="email"
                placeholder="learner@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && search()}
                style={inputStyle}
              />
              <button className="btn btn-primary" onClick={search} disabled={loading}>{loading ? "Searching..." : "Search"}</button>
            </div>
          </div>

          {searched && error && (
            <div className="card" style={{ marginTop: "20px" }}>
              <p style={{ color: "#94a3b8", fontSize: "14px", margin: 0 }}>{error}</p>
            </div>
          )}

          {profile && (
            <>
              <div className="card" style={{ marginTop: "24px" }}>
                <h2 style={{ margin: "0 0 4px", fontSize: "20px", color: "#0f172a" }}>{profile.name}</h2>
                <div style={{ color: "#64748b", fontSize: "14px" }}>{profile.email} · {profile.is_existing_user ? "Existing user (matched via NPS feedback or prior webinars)" : "New user"}</div>
              </div>

              <h3 className="section-title">Webinar Activity</h3>
              <div className="kpi-grid">
                <KPICard label="Webinars Registered" value={profile.webinars_registered} />
                <KPICard label="Webinars Attended" value={profile.webinars_attended} color="#16a34a" />
                <KPICard label="Unique Webinars Attended" value={profile.unique_webinars_attended} color="#16a34a" />
                <KPICard label="Avg Rating Given" value={profile.average_rating_given !== null ? `${profile.average_rating_given}/5` : "N/A"} color="#f59e0b" />
                <KPICard label="First Webinar" value={profile.first_webinar ? new Date(profile.first_webinar).toLocaleDateString() : "N/A"} />
                <KPICard label="Last Webinar" value={profile.last_webinar ? new Date(profile.last_webinar).toLocaleDateString() : "N/A"} />
              </div>

              <div className="card">
                <h2 className="card-title">Attendance History</h2>
                <div className="table-wrap">
                  <table className="styled-table">
                    <thead>
                      <tr>{["Webinar", "Date", "Mentor", "Attended", "Rating", "Lead Status"].map((h) => <th key={h}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {profile.attendance_history.map((h, i) => (
                        <tr key={i}>
                          <td className="strong">{h.webinar_title || "—"}</td>
                          <td className="muted">{h.session_date || "—"}</td>
                          <td>{h.mentor_name || "—"}</td>
                          <td>{h.attended ? "✅" : "—"}</td>
                          <td>{h.rating ? `${h.rating}/5` : "—"}</td>
                          <td><LeadBadge status={h.lead_status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <h3 className="section-title">Sales Activity</h3>
              <div className="card">
                <div className="sales-grid">
                  <div><div className="stat-label">Current Lead Status</div><LeadBadge status={profile.sales_activity.current_lead_status} /></div>
                  <div><div className="stat-label">Course Interest</div><div className="stat-value">{profile.sales_activity.course_interest || "—"}</div></div>
                  <div><div className="stat-label">Follow-up Status</div><div className="stat-value">{profile.sales_activity.sales_followup_status || "—"}</div></div>
                  <div><div className="stat-label">Last Follow-up</div><div className="stat-value">{profile.sales_activity.last_follow_up_date ? new Date(profile.sales_activity.last_follow_up_date).toLocaleDateString() : "—"}</div></div>
                  <div><div className="stat-label">Conversion Status</div><LeadBadge status={profile.sales_activity.conversion_status} /></div>
                </div>
              </div>
            </>
          )}
        </div>

        <style jsx>{`
          .page-hero { position: relative; overflow: hidden; border-radius: 18px; padding: 30px 32px; margin-bottom: 24px; background: linear-gradient(120deg, #0f172a 0%, #1e293b 60%, #0f172a 100%); box-shadow: 0 16px 32px -18px rgba(15, 23, 42, 0.55); }
          .page-hero-blob { position: absolute; width: 220px; height: 220px; border-radius: 50%; background: #8b5cf6; filter: blur(60px); opacity: 0.3; top: -80px; right: 160px; }
          .page-hero-content { position: relative; z-index: 1; }
          .page-hero-eyebrow { display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #fbbf24; background: rgba(251, 191, 36, 0.12); border: 1px solid rgba(251, 191, 36, 0.3); padding: 5px 10px; border-radius: 999px; margin-bottom: 10px; }
          .page-hero-title { font-size: 26px; font-weight: 800; color: #f8fafc; margin: 0 0 6px; }
          .page-hero-subtitle { color: #94a3b8; font-size: 14px; margin: 0; max-width: 560px; }

          .card { background: #ffffff; border-radius: 16px; padding: 22px 24px; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06); border: 1px solid #eef2f7; margin-bottom: 24px; }
          .card-title { margin: 0 0 16px; font-size: 16px; color: #1e293b; }
          .section-title { font-size: 14px; color: #64748b; text-transform: uppercase; letter-spacing: 0.03em; margin: 0 0 12px; }

          .btn { border: none; border-radius: 10px; padding: 11px 22px; font-size: 14px; font-weight: 700; cursor: pointer; }
          .btn:disabled { cursor: not-allowed; opacity: 0.6; }
          .btn-primary { background: linear-gradient(120deg, #f59e0b, #fbbf24); color: #0f172a; }

          .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 14px; margin-bottom: 24px; }

          .sales-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 20px; }
          .stat-label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #94a3b8; margin-bottom: 6px; }
          .stat-value { font-size: 14px; font-weight: 700; color: #1e293b; }

          .table-wrap { overflow-x: auto; }
          .styled-table { width: 100%; border-collapse: collapse; font-size: 13px; }
          .styled-table thead th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: #94a3b8; font-weight: 700; padding: 10px 12px; border-bottom: 2px solid #f1f5f9; white-space: nowrap; }
          .styled-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #1e293b; white-space: nowrap; }
          .styled-table td.muted { color: #94a3b8; }
          .styled-table td.strong { font-weight: 700; }
        `}</style>
      </>
    </ProtectedRoute>
  );
}
