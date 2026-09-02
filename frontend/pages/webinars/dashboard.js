import { useEffect, useMemo, useState } from "react";
import Sidebar from "../../components/Sidebar";
import ProtectedRoute from "../../components/ProtectedRoute";
import OperationsKPI from "../../components/analytics/OperationsKPI";
import BarChartCard from "../../components/resources/analytics/BarChartCard";
import BreakdownDonutChart from "../../components/mentorPerformance/BreakdownDonutChart";

const API = "http://127.0.0.1:8000";

const EMPTY_FILTERS = { mentor_name: "", category: "", status: "", date_from: "", date_to: "" };
const STATUS_OPTIONS = ["Draft", "Scheduled", "Live", "Completed", "Cancelled", "Rescheduled"];

function unique(list) {
  return [...new Set(list.filter(Boolean))].sort();
}

function buildQuery(filters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

function FilterSelect({ label, value, options, onChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label style={{ fontSize: "12px", fontWeight: 700, color: "#64748b" }}>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="filter-select">
        <option value="">All {label}s</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function InsightCard({ title, message }) {
  return (
    <div className="insight-card">
      <div className="insight-title">{title}</div>
      <div className="insight-message">{message}</div>
    </div>
  );
}

function StatRow({ label, value }) {
  return (
    <div className="stat-row">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value === null || value === undefined ? "N/A" : value}</span>
    </div>
  );
}

export default function WebinarDashboardPage() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [filterOptions, setFilterOptions] = useState({ mentor_name: [], category: [] });
  const [kpis, setKpis] = useState(null);
  const [insights, setInsights] = useState(null);
  const [webinars, setWebinars] = useState([]);

  const hasActiveFilter = Object.values(filters).some(Boolean);

  useEffect(() => {
    fetch(`${API}/webinars?stats=true`)
      .then((r) => r.json())
      .then((data) => {
        const all = Array.isArray(data) ? data : [];
        setFilterOptions({
          mentor_name: unique(all.map((w) => w.mentor_name)),
          category: unique(all.map((w) => w.category)),
        });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const qs = buildQuery(filters);
    fetch(`${API}/webinars/dashboard${qs}`).then((r) => r.json()).then(setKpis).catch(() => setKpis(null));
    fetch(`${API}/webinars/business-insights${qs}`).then((r) => r.json()).then(setInsights).catch(() => setInsights(null));
    fetch(`${API}/webinars?stats=true${qs}`).then((r) => r.json()).then((d) => setWebinars(Array.isArray(d) ? d : [])).catch(() => setWebinars([]));
  }, [filters]);

  const handleFilterChange = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));
  const clearFilters = () => setFilters(EMPTY_FILTERS);

  const regVsAttendData = useMemo(
    () => webinars.slice(0, 10).map((w) => ({ name: w.title.length > 18 ? w.title.slice(0, 18) + "…" : w.title, registered: w.registered, attended: w.attended })),
    [webinars]
  );

  const leadStatusData = useMemo(() => {
    if (!insights) return [];
    const s = insights.sales;
    const rows = [
      { label: "Qualified", count: s.qualified_leads, color: "#f59e0b" },
      { label: "Converted", count: s.converted_users, color: "#16a34a" },
      { label: "Follow-up Pending", count: s.follow_up_pending, color: "#ea580c" },
    ];
    return rows.filter((r) => r.count > 0);
  }, [insights]);

  return (
    <ProtectedRoute>
      <>
        <Sidebar />

        <div style={{ marginLeft: "280px", padding: "32px 36px 60px", background: "#f1f5f9", minHeight: "100vh" }}>
          <div className="page-hero">
            <div className="page-hero-blob" />
            <div className="page-hero-content">
              <div className="page-hero-eyebrow">Webinars</div>
              <h1 className="page-hero-title">Webinar Dashboard</h1>
              <p className="page-hero-subtitle">Registration, attendance, leads, conversion, and mentor cost — all in one view.</p>
            </div>
            <div className="page-hero-stat">
              <div className="page-hero-stat-value">{kpis ? kpis.total_webinars : "—"}</div>
              <div className="page-hero-stat-label">Total Webinars</div>
            </div>
          </div>

          <div className="card filter-card">
            <FilterSelect label="Mentor" value={filters.mentor_name} options={filterOptions.mentor_name} onChange={(v) => handleFilterChange("mentor_name", v)} />
            <FilterSelect label="Category" value={filters.category} options={filterOptions.category} onChange={(v) => handleFilterChange("category", v)} />
            <FilterSelect label="Status" value={filters.status} options={STATUS_OPTIONS} onChange={(v) => handleFilterChange("status", v)} />
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "#64748b" }}>Date From</label>
              <input type="date" value={filters.date_from} onChange={(e) => handleFilterChange("date_from", e.target.value)} className="date-input" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "#64748b" }}>Date To</label>
              <input type="date" value={filters.date_to} onChange={(e) => handleFilterChange("date_to", e.target.value)} className="date-input" />
            </div>
            {hasActiveFilter && <button onClick={clearFilters} className="btn-clear">✕ Clear Filters</button>}

            <div className="export-actions">
              {kpis && kpis.total_webinars > 0 ? (
                <>
                  <a href={`${API}/webinars/export/excel${buildQuery(filters)}`} target="_blank" rel="noreferrer" className="btn-export btn-export-excel">⬇ Export Excel</a>
                  <a href={`${API}/webinars/export/pdf${buildQuery(filters)}`} target="_blank" rel="noreferrer" className="btn-export btn-export-pdf">⬇ Export PDF</a>
                </>
              ) : (
                <span className="export-disabled">No data available for the selected filters.</span>
              )}
            </div>
          </div>

          {kpis && (
            <div className="kpi-grid">
              <OperationsKPI title="Total Webinars" value={kpis.total_webinars} color="#0f172a" />
              <OperationsKPI title="Upcoming" value={kpis.upcoming_webinars} color="#2563eb" />
              <OperationsKPI title="Completed" value={kpis.completed_webinars} color="#16a34a" />
              <OperationsKPI title="Total Registrations" value={kpis.total_registrations} color="#0f172a" />
              <OperationsKPI title="Total Attendees" value={kpis.total_attendees} color="#16a34a" />
              <OperationsKPI title="Unique Users" value={kpis.unique_users ?? "N/A"} color="#8b5cf6" />
              <OperationsKPI title="Avg Attendance %" value={kpis.average_attendance_percentage !== null ? `${kpis.average_attendance_percentage}%` : "N/A"} color="#16a34a" />
              <OperationsKPI title="Avg Rating" value={kpis.average_rating !== null ? `${kpis.average_rating}/5` : "N/A"} color="#f59e0b" />
              <OperationsKPI title="Total Leads" value={kpis.total_leads} color="#f59e0b" />
              <OperationsKPI title="Converted Leads" value={kpis.converted_leads} color="#16a34a" />
              <OperationsKPI title="Conversion Rate" value={kpis.conversion_rate !== null ? `${kpis.conversion_rate}%` : "N/A"} color="#16a34a" />
              <OperationsKPI title="Mentor Payout" value={`₹${kpis.total_mentor_payout}`} color="#0f172a" />
            </div>
          )}

          <div className="chart-row">
            {regVsAttendData.length > 0 && (
              <BarChartCard title="Registrations by Webinar" data={regVsAttendData} dataKey="registered" nameKey="name" color="#94a3b8" />
            )}
            {leadStatusData.length > 0 && <BreakdownDonutChart title="Lead Funnel Breakdown" data={leadStatusData} />}
          </div>

          {insights && (
            <>
              <div className="card">
                <h2 className="card-title">🧠 Business Insights</h2>
                {insights.cards.length === 0 ? (
                  <p style={{ color: "#94a3b8", fontSize: "13px" }}>Not enough data yet to generate insights for this scope.</p>
                ) : (
                  <div className="insight-grid">
                    {insights.cards.map((c) => <InsightCard key={c.type} title={c.title} message={c.message} />)}
                  </div>
                )}
              </div>

              <div className="insight-columns">
                <div className="card">
                  <h3 className="section-title">👥 Audience Insights</h3>
                  <StatRow label="Total Unique Users" value={insights.audience.total_unique_users} />
                  <StatRow label="New Users" value={insights.audience.new_users} />
                  <StatRow label="Existing Users" value={insights.audience.existing_users} />
                  <StatRow label="Repeat Attendees" value={insights.audience.repeat_attendees} />
                  {insights.audience.most_popular_topics.length > 0 && (
                    <div style={{ marginTop: "10px" }}>
                      <div className="stat-label" style={{ marginBottom: "6px" }}>Most Popular Topics</div>
                      {insights.audience.most_popular_topics.map((t) => (
                        <div key={t.topic} className="stat-row"><span>{t.topic}</span><span>{t.webinar_count}</span></div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="card">
                  <h3 className="section-title">🏆 Performance Insights</h3>
                  <StatRow label="Top by Attendance" value={insights.performance.top_webinar_by_attendance} />
                  <StatRow label="Top by Rating" value={insights.performance.top_webinar_by_rating} />
                  <StatRow label="Top by Registrations" value={insights.performance.top_webinar_by_registrations} />
                  <StatRow label="Top Mentor (Attendance)" value={insights.performance.top_mentor_by_attendance} />
                  <StatRow label="Top Mentor (Rating)" value={insights.performance.top_mentor_by_rating} />
                  <StatRow label="Top Topic" value={insights.performance.top_topic} />
                </div>

                <div className="card">
                  <h3 className="section-title">💼 Sales Insights</h3>
                  <StatRow label="Total Leads" value={insights.sales.total_leads} />
                  <StatRow label="Qualified Leads" value={insights.sales.qualified_leads} />
                  <StatRow label="Course-Interested" value={insights.sales.course_interested_users} />
                  <StatRow label="Converted" value={insights.sales.converted_users} />
                  <StatRow label="Conversion Rate" value={insights.sales.conversion_rate !== null ? `${insights.sales.conversion_rate}%` : "N/A"} />
                  <StatRow label="Follow-up Pending" value={insights.sales.follow_up_pending} />
                </div>

                <div className="card">
                  <h3 className="section-title">💰 Financial Insights</h3>
                  <StatRow label="Total Mentor Payout" value={`₹${insights.financial.total_mentor_payout}`} />
                  <StatRow label="Avg Payout / Webinar" value={insights.financial.average_payout_per_webinar !== null ? `₹${insights.financial.average_payout_per_webinar}` : "N/A"} />
                  <StatRow label="Payout / Attendee" value={insights.financial.payout_per_attendee !== null ? `₹${insights.financial.payout_per_attendee}` : "N/A"} />
                  <StatRow label="Cost / Qualified Lead" value={insights.financial.cost_per_qualified_lead !== null ? `₹${insights.financial.cost_per_qualified_lead}` : "N/A"} />
                  <StatRow label="Cost / Conversion" value={insights.financial.cost_per_conversion !== null ? `₹${insights.financial.cost_per_conversion}` : "N/A"} />
                </div>
              </div>
            </>
          )}
        </div>

        <style jsx>{`
          .page-hero { position: relative; overflow: hidden; border-radius: 18px; padding: 30px 32px; margin-bottom: 24px; background: linear-gradient(120deg, #0f172a 0%, #1e293b 60%, #0f172a 100%); display: flex; align-items: center; justify-content: space-between; gap: 20px; box-shadow: 0 16px 32px -18px rgba(15, 23, 42, 0.55); }
          .page-hero-blob { position: absolute; width: 220px; height: 220px; border-radius: 50%; background: #8b5cf6; filter: blur(60px); opacity: 0.3; top: -80px; right: 160px; }
          .page-hero-content { position: relative; z-index: 1; }
          .page-hero-eyebrow { display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #fbbf24; background: rgba(251, 191, 36, 0.12); border: 1px solid rgba(251, 191, 36, 0.3); padding: 5px 10px; border-radius: 999px; margin-bottom: 10px; }
          .page-hero-title { font-size: 26px; font-weight: 800; color: #f8fafc; margin: 0 0 6px; }
          .page-hero-subtitle { color: #94a3b8; font-size: 14px; margin: 0; }
          .page-hero-stat { position: relative; z-index: 1; text-align: center; padding: 14px 26px; border-radius: 14px; background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.1); flex-shrink: 0; }
          .page-hero-stat-value { font-size: 26px; font-weight: 800; color: #fbbf24; }
          .page-hero-stat-label { font-size: 11px; color: #94a3b8; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.04em; }

          .card { background: #ffffff; border-radius: 16px; padding: 22px 24px; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06); border: 1px solid #eef2f7; margin-bottom: 24px; }
          .card-title { margin: 0 0 16px; font-size: 17px; color: #1e293b; }
          .section-title { margin: 0 0 14px; font-size: 14px; color: #1e293b; }

          .filter-card { display: flex; align-items: flex-end; gap: 16px; flex-wrap: wrap; }
          .filter-select { border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px; font-size: 14px; min-width: 160px; background: #f8fafc; outline: none; }
          .date-input { border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px; font-size: 14px; background: #f8fafc; outline: none; }
          .btn-clear { background: #f1f5f9; color: #334155; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 10px 16px; font-weight: 700; font-size: 13px; cursor: pointer; }
          .btn-clear:hover { background: #e2e8f0; }

          .export-actions { display: flex; gap: 10px; margin-left: auto; align-items: center; }
          .export-disabled { color: #94a3b8; font-size: 13px; }
          .btn-export { display: inline-block; text-decoration: none; border-radius: 10px; padding: 10px 16px; font-weight: 700; font-size: 13px; cursor: pointer; transition: transform 0.15s ease; }
          .btn-export:hover { transform: translateY(-1px); }
          .btn-export-excel { background: #16a34a; color: #fff; }
          .btn-export-pdf { background: linear-gradient(120deg, #0f172a, #1e293b); color: #facc15; }

          .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; margin: 20px 0 24px; }
          .chart-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; margin-bottom: 24px; }

          .insight-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 14px; }
          .insight-card { background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 14px 16px; }
          .insight-title { font-size: 12px; font-weight: 800; color: #92400e; text-transform: uppercase; letter-spacing: 0.03em; margin-bottom: 6px; }
          .insight-message { font-size: 13.5px; color: #334155; line-height: 1.5; }

          .insight-columns { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; }
          .stat-row { display: flex; justify-content: space-between; font-size: 13px; padding: 6px 0; border-bottom: 1px solid #f1f5f9; }
          .stat-label { color: #64748b; }
          .stat-value { font-weight: 700; color: #1e293b; }
        `}</style>
      </>
    </ProtectedRoute>
  );
}
