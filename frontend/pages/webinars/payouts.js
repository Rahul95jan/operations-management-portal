import { useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "../../components/Sidebar";
import ProtectedRoute from "../../components/ProtectedRoute";

const API = "http://127.0.0.1:8000";

const PAYMENT_STATUSES = ["Pending", "Approved", "Processing", "Paid", "On Hold", "Rejected"];

const PAYOUT_STYLES = {
  Pending: { bg: "#fef3c7", color: "#b45309" },
  Approved: { bg: "#dbeafe", color: "#1d4ed8" },
  Processing: { bg: "#dbeafe", color: "#1d4ed8" },
  Paid: { bg: "#dcfce7", color: "#15803d" },
  "On Hold": { bg: "#fee2e2", color: "#b91c1c" },
  Rejected: { bg: "#fee2e2", color: "#b91c1c" },
};

function PayoutBadge({ status }) {
  const s = PAYOUT_STYLES[status] || { bg: "#f1f5f9", color: "#94a3b8" };
  return <span style={{ background: s.bg, color: s.color, fontSize: "12px", fontWeight: 700, padding: "4px 10px", borderRadius: "999px", whiteSpace: "nowrap" }}>{status}</span>;
}

const inputStyle = { border: "1px solid #e2e8f0", borderRadius: "10px", padding: "10px 12px", fontSize: "14px", background: "#f8fafc", outline: "none", minWidth: "160px" };

export default function WebinarPayoutsPage() {
  const [payouts, setPayouts] = useState(null);
  const [mentors, setMentors] = useState([]);
  const [mentorFilter, setMentorFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const load = () => {
    const params = new URLSearchParams();
    if (mentorFilter) params.set("mentor_name", mentorFilter);
    if (statusFilter) params.set("payment_status", statusFilter);
    const qs = params.toString() ? `?${params.toString()}` : "";
    fetch(`${API}/webinars/payouts${qs}`).then((r) => r.json()).then((d) => setPayouts(Array.isArray(d) ? d : [])).catch(() => setPayouts([]));
  };

  useEffect(load, [mentorFilter, statusFilter]);
  useEffect(() => {
    fetch(`${API}/mentors`).then((r) => r.json()).then((d) => setMentors(Array.isArray(d) ? d : [])).catch(() => setMentors([]));
  }, []);

  const totalPending = (payouts || []).filter((p) => p.payment_status === "Pending").reduce((sum, p) => sum + (Number(p.total_amount) || 0), 0);
  const totalPaid = (payouts || []).filter((p) => p.payment_status === "Paid").reduce((sum, p) => sum + (Number(p.total_amount) || 0), 0);

  return (
    <ProtectedRoute>
      <>
        <Sidebar />

        <div style={{ marginLeft: "280px", padding: "32px 36px 60px", background: "#f1f5f9", minHeight: "100vh" }}>
          <div className="page-hero">
            <div className="page-hero-blob" />
            <div className="page-hero-content">
              <div className="page-hero-eyebrow">Webinars</div>
              <h1 className="page-hero-title">Mentor Payouts</h1>
              <p className="page-hero-subtitle">Every webinar payout invoice — pending and paid — in one place.</p>
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <div className="page-hero-stat">
                <div className="page-hero-stat-value">₹{totalPending.toFixed(0)}</div>
                <div className="page-hero-stat-label">Pending</div>
              </div>
              <div className="page-hero-stat">
                <div className="page-hero-stat-value">₹{totalPaid.toFixed(0)}</div>
                <div className="page-hero-stat-label">Paid</div>
              </div>
              <a href={`${API}/webinars/export/excel`} target="_blank" rel="noreferrer" className="btn-export-excel">⬇ Export Excel</a>
            </div>
          </div>

          <div className="card filter-card">
            <select style={inputStyle} value={mentorFilter} onChange={(e) => setMentorFilter(e.target.value)}>
              <option value="">All Mentors</option>
              {mentors.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
            </select>
            <select style={inputStyle} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Payment Statuses</option>
              {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="card" style={{ marginTop: "24px" }}>
            <div className="table-wrap">
              <table className="styled-table" style={{ minWidth: "900px" }}>
                <thead>
                  <tr>
                    {["Webinar", "Mentor", "Month", "Hours", "Rate", "Amount", "Status", "Invoice #", "Actions"].map((h) => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {(payouts || []).map((p) => (
                    <tr key={p.invoice_id}>
                      <td className="strong">{p.webinar_id ? <Link href={`/webinars/${p.webinar_id}`}>{p.webinar_title}</Link> : "—"}</td>
                      <td>{p.mentor_name}</td>
                      <td className="muted">{p.month}</td>
                      <td className="muted">{p.total_hours}</td>
                      <td className="muted">₹{p.hourly_rate}</td>
                      <td className="strong">₹{p.total_amount}</td>
                      <td><PayoutBadge status={p.payment_status} /></td>
                      <td className="muted">{p.invoice_number || "—"}</td>
                      <td>
                        <a href={`${API}/download-invoice/${p.invoice_id}`} target="_blank" rel="noreferrer" className="btn-icon">📄 Invoice</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {payouts !== null && payouts.length === 0 && (
                <div className="empty-state">No webinar payouts yet — create one from a webinar's report page.</div>
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
          .page-hero-subtitle { color: #94a3b8; font-size: 14px; margin: 0; }
          .page-hero-stat { position: relative; z-index: 1; text-align: center; padding: 14px 22px; border-radius: 14px; background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.1); flex-shrink: 0; }
          .page-hero-stat-value { font-size: 22px; font-weight: 800; color: #fbbf24; }
          .page-hero-stat-label { font-size: 11px; color: #94a3b8; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.04em; }

          .card { background: #ffffff; border-radius: 16px; padding: 22px 24px; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06); border: 1px solid #eef2f7; }
          .filter-card { display: flex; gap: 14px; flex-wrap: wrap; }
          .btn-export-excel { background: #16a34a; color: #fff; text-decoration: none; padding: 10px 16px; border-radius: 10px; font-weight: 700; font-size: 13px; align-self: center; }
          .btn-export-excel:hover { background: #15803d; }

          .table-wrap { overflow-x: auto; }
          .styled-table { width: 100%; border-collapse: collapse; font-size: 14px; }
          .styled-table thead th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: #94a3b8; font-weight: 700; padding: 10px 12px; border-bottom: 2px solid #f1f5f9; white-space: nowrap; }
          .styled-table td { padding: 12px; border-bottom: 1px solid #f1f5f9; color: #1e293b; white-space: nowrap; }
          .styled-table td.muted { color: #94a3b8; }
          .styled-table td.strong { font-weight: 700; }
          .styled-table td a { color: #0f172a; text-decoration: none; }
          .styled-table td a:hover { text-decoration: underline; }
          .btn-icon { background: #f1f5f9; color: #475569; padding: 6px 10px; border-radius: 8px; font-size: 12px; text-decoration: none; }
          .btn-icon:hover { background: #e2e8f0; }

          .empty-state { text-align: center; padding: 40px 20px; color: #94a3b8; font-size: 14px; }
        `}</style>
      </>
    </ProtectedRoute>
  );
}
