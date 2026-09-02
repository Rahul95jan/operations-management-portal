import { useEffect, useState } from "react";
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

const inputStyle = { border: "1px solid #e2e8f0", borderRadius: "10px", padding: "10px 12px", fontSize: "14px", background: "#f8fafc", outline: "none", minWidth: "160px" };

export default function WebinarLeadsPage() {
  const [leads, setLeads] = useState(null);
  const [mentors, setMentors] = useState([]);
  const [filters, setFilters] = useState({ mentor_name: "", lead_status: "", date_from: "", date_to: "" });
  const [search, setSearch] = useState("");

  const loadLeads = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    const qs = params.toString() ? `?${params.toString()}` : "";
    fetch(`${API}/webinars/leads${qs}`).then((r) => r.json()).then((d) => setLeads(Array.isArray(d) ? d : [])).catch(() => setLeads([]));
  };

  useEffect(loadLeads, [filters]);
  useEffect(() => {
    fetch(`${API}/mentors`).then((r) => r.json()).then((d) => setMentors(Array.isArray(d) ? d : [])).catch(() => setMentors([]));
  }, []);

  const filtered = (leads || []).filter((l) => !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.email.toLowerCase().includes(search.toLowerCase()));

  const hasActiveFilter = Object.values(filters).some(Boolean);

  return (
    <ProtectedRoute>
      <>
        <Sidebar />

        <div style={{ marginLeft: "280px", padding: "32px 36px 60px", background: "#f1f5f9", minHeight: "100vh" }}>
          <div className="page-hero">
            <div className="page-hero-blob" />
            <div className="page-hero-content">
              <div className="page-hero-eyebrow">Webinars</div>
              <h1 className="page-hero-title">Webinar Leads &amp; Conversion</h1>
              <p className="page-hero-subtitle">Everyone who attended a webinar but hasn't converted yet — the sales team's working list.</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div className="page-hero-stat">
                <div className="page-hero-stat-value">{leads ? leads.length : "—"}</div>
                <div className="page-hero-stat-label">Leads in Scope</div>
              </div>
              <a href={`${API}/webinars/export/excel`} target="_blank" rel="noreferrer" className="btn-export-excel">⬇ Export Excel</a>
            </div>
          </div>

          <div className="card filter-card">
            <input type="text" placeholder="Search name or email..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...inputStyle, width: "220px" }} />
            <select style={inputStyle} value={filters.mentor_name} onChange={(e) => setFilters({ ...filters, mentor_name: e.target.value })}>
              <option value="">All Mentors</option>
              {mentors.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
            </select>
            <select style={inputStyle} value={filters.lead_status} onChange={(e) => setFilters({ ...filters, lead_status: e.target.value })}>
              <option value="">All Lead Statuses</option>
              {LEAD_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "#64748b" }}>From</label>
              <input type="date" value={filters.date_from} onChange={(e) => setFilters({ ...filters, date_from: e.target.value })} style={inputStyle} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "#64748b" }}>To</label>
              <input type="date" value={filters.date_to} onChange={(e) => setFilters({ ...filters, date_to: e.target.value })} style={inputStyle} />
            </div>
            {hasActiveFilter && <button className="btn-clear" onClick={() => setFilters({ mentor_name: "", lead_status: "", date_from: "", date_to: "" })}>✕ Clear</button>}
          </div>

          <div className="card" style={{ marginTop: "24px" }}>
            <div className="table-wrap">
              <table className="styled-table" style={{ minWidth: "1000px" }}>
                <thead>
                  <tr>
                    {["Name", "Email", "Webinar", "Mentor", "Registered", "Attended", "Existing?", "Course Interest", "Lead Status", "Follow-up"].map((h) => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((l) => (
                    <tr key={l.participant_id}>
                      <td className="strong">{l.name}</td>
                      <td className="muted">{l.email}</td>
                      <td><Link href={`/webinars/${l.webinar_id}`}>{l.webinar_title}</Link></td>
                      <td>{l.mentor_name}</td>
                      <td className="muted">{l.registration_date ? new Date(l.registration_date).toLocaleDateString() : "—"}</td>
                      <td>{l.attended ? "✅" : "—"}</td>
                      <td>{l.is_existing_user ? "Yes" : "No"}</td>
                      <td>{l.course_interest || "—"}</td>
                      <td><LeadBadge status={l.lead_status} /></td>
                      <td className="muted">{l.sales_followup_status || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {leads !== null && filtered.length === 0 && (
                <div className="empty-state">{leads.length === 0 ? "No leads recorded yet." : "No leads match your filters."}</div>
              )}
            </div>
          </div>
        </div>

        <style jsx>{`
          .page-hero { position: relative; overflow: hidden; border-radius: 18px; padding: 30px 32px; margin-bottom: 24px; background: linear-gradient(120deg, #0f172a 0%, #1e293b 60%, #0f172a 100%); display: flex; align-items: center; justify-content: space-between; gap: 20px; box-shadow: 0 16px 32px -18px rgba(15, 23, 42, 0.55); }
          .page-hero-blob { position: absolute; width: 220px; height: 220px; border-radius: 50%; background: #8b5cf6; filter: blur(60px); opacity: 0.3; top: -80px; right: 160px; }
          .page-hero-content { position: relative; z-index: 1; }
          .page-hero-eyebrow { display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #fbbf24; background: rgba(251, 191, 36, 0.12); border: 1px solid rgba(251, 191, 36, 0.3); padding: 5px 10px; border-radius: 999px; margin-bottom: 10px; }
          .page-hero-title { font-size: 26px; font-weight: 800; color: #f8fafc; margin: 0 0 6px; }
          .page-hero-subtitle { color: #94a3b8; font-size: 14px; margin: 0; max-width: 480px; }
          .page-hero-stat { position: relative; z-index: 1; text-align: center; padding: 14px 26px; border-radius: 14px; background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.1); flex-shrink: 0; }
          .page-hero-stat-value { font-size: 26px; font-weight: 800; color: #fbbf24; }
          .page-hero-stat-label { font-size: 11px; color: #94a3b8; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.04em; }

          .card { background: #ffffff; border-radius: 16px; padding: 22px 24px; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06); border: 1px solid #eef2f7; }
          .filter-card { display: flex; align-items: flex-end; gap: 14px; flex-wrap: wrap; }
          .btn-clear { background: #f1f5f9; color: #334155; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 10px 16px; font-weight: 700; font-size: 13px; cursor: pointer; }
          .btn-clear:hover { background: #e2e8f0; }
          .btn-export-excel { background: #16a34a; color: #fff; text-decoration: none; padding: 10px 16px; border-radius: 10px; font-weight: 700; font-size: 13px; }
          .btn-export-excel:hover { background: #15803d; }

          .table-wrap { overflow-x: auto; }
          .styled-table { width: 100%; border-collapse: collapse; font-size: 13px; }
          .styled-table thead th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: #94a3b8; font-weight: 700; padding: 10px 12px; border-bottom: 2px solid #f1f5f9; white-space: nowrap; }
          .styled-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #1e293b; white-space: nowrap; }
          .styled-table td.muted { color: #94a3b8; }
          .styled-table td.strong { font-weight: 700; }
          .styled-table td a { color: #0f172a; text-decoration: none; }
          .styled-table td a:hover { text-decoration: underline; }

          .empty-state { text-align: center; padding: 40px 20px; color: #94a3b8; font-size: 14px; }
        `}</style>
      </>
    </ProtectedRoute>
  );
}
