import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Sidebar from "../../components/Sidebar";
import ProtectedRoute from "../../components/ProtectedRoute";
import OperationsKPI from "../../components/analytics/OperationsKPI";
import BarChartCard from "../../components/resources/analytics/BarChartCard";
import BusinessScoreBadge, { RiskBadge } from "../../components/mentorPerformance/BusinessScoreBadge";
import PerformanceMatrix from "../../components/mentorPerformance/PerformanceMatrix";
import BreakdownDonutChart from "../../components/mentorPerformance/BreakdownDonutChart";

const API = "http://127.0.0.1:8000";

const EMPTY_FILTERS = {
  course_name: "",
  batch_name: "",
  mentor_name: "",
  date_from: "",
  date_to: "",
  classification: "",
  risk: "",
};

const CLASSIFICATIONS = ["Excellent", "Strong Performer", "Needs Attention", "At Risk", "Critical"];
const RISK_LEVELS = ["Low", "Medium", "High", "Critical"];

function unique(list) {
  return [...new Set(list.filter(Boolean))].sort();
}

function buildQuery(filters, keys) {
  const params = new URLSearchParams();
  keys.forEach((key) => {
    if (filters[key]) params.set(key, filters[key]);
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

const FILTER_KEYS = ["course_name", "batch_name", "mentor_name", "date_from", "date_to", "classification", "risk"];

function FilterSelect({ label, value, options, onChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label style={{ fontSize: "12px", fontWeight: 700, color: "#64748b" }}>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="filter-select">
        <option value="">All {label}s</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

function dim(row, key, field = "score") {
  const d = row[key];
  if (!d) return "N/A";
  const v = d[field];
  return v === null || v === undefined ? "N/A" : v;
}

export default function MentorPerformancePage() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [filterOptions, setFilterOptions] = useState({ course_name: [], batch_name: [], mentor_name: [] });
  const [kpis, setKpis] = useState(null);
  const [mentors, setMentors] = useState(null);

  const hasActiveFilter = Object.values(filters).some(Boolean);

  useEffect(() => {
    fetch(`${API}/batches`)
      .then((r) => r.json())
      .then((data) => {
        const all = Array.isArray(data) ? data : [];
        setFilterOptions({
          course_name: unique(all.map((b) => b.course_name)),
          batch_name: unique(all.map((b) => b.batch_name)),
          mentor_name: unique(all.map((b) => b.mentor_name)),
        });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const qs = buildQuery(filters, FILTER_KEYS);
    fetch(`${API}/mentor-360/dashboard${qs}`)
      .then((r) => r.json())
      .then((data) => {
        setKpis(data.kpis);
        setMentors(Array.isArray(data.mentors) ? data.mentors : []);
      })
      .catch(() => {
        setKpis(null);
        setMentors([]);
      });
  }, [filters]);

  const handleFilterChange = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));
  const clearFilters = () => setFilters(EMPTY_FILTERS);

  const matrixData = useMemo(
    () =>
      (mentors || []).map((m) => ({
        mentor_name: m.mentor_name,
        x: typeof m.delivery_performance?.score === "number" ? m.delivery_performance.score : null,
        y: typeof m.learner_experience?.score === "number" ? m.learner_experience.score : null,
        z: m.productivity?.learners_served || 1,
      })),
    [mentors]
  );

  const classificationData = useMemo(() => {
    if (!kpis) return [];
    const map = [
      ["Excellent", kpis.excellent, "#16a34a"],
      ["Strong Performer", kpis.strong_performer, "#2563eb"],
      ["Needs Attention", kpis.needs_attention, "#f59e0b"],
      ["At Risk", kpis.at_risk, "#ea580c"],
      ["Critical", kpis.critical, "#dc2626"],
    ];
    return map.filter(([, count]) => count > 0).map(([label, count, color]) => ({ label, count, color }));
  }, [kpis]);

  const riskData = useMemo(() => {
    if (!mentors) return [];
    const counts = { Low: 0, Medium: 0, High: 0, Critical: 0 };
    mentors.forEach((m) => {
      if (counts[m.risk] !== undefined) counts[m.risk] += 1;
    });
    const colors = { Low: "#16a34a", Medium: "#f59e0b", High: "#ea580c", Critical: "#dc2626" };
    return Object.entries(counts)
      .filter(([, count]) => count > 0)
      .map(([label, count]) => ({ label, count, color: colors[label] }));
  }, [mentors]);

  // Org-wide diagnostic: average score per dimension across the filtered
  // mentor set — reveals which dimension is dragging performance down
  // overall, independent of any single mentor.
  const dimensionAverages = useMemo(() => {
    if (!mentors || mentors.length === 0) return [];
    const dims = [
      ["Delivery", "delivery_performance"],
      ["Attendance", "attendance_engagement"],
      ["Learner Exp.", "learner_experience"],
      ["Quality", "session_quality"],
      ["Resources", "resource_compliance"],
      ["Reliability", "reliability"],
      ["Productivity", "productivity"],
      ["Cost Eff.", "cost_efficiency"],
    ];
    return dims
      .map(([label, key]) => {
        const scores = mentors.map((m) => m[key]?.score).filter((s) => typeof s === "number");
        if (scores.length === 0) return null;
        return { name: label, value: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 };
      })
      .filter(Boolean);
  }, [mentors]);

  const exportQs = buildQuery(filters, FILTER_KEYS);
  const hasData = mentors && mentors.length > 0;

  return (
    <ProtectedRoute>
      <>
        <Sidebar />

        <div style={{ marginLeft: "280px", padding: "32px 36px 60px", background: "#f1f5f9", minHeight: "100vh" }}>
          <div className="page-hero">
            <div className="page-hero-blob" />
            <div className="page-hero-content">
              <div className="page-hero-eyebrow">Operations</div>
              <h1 className="page-hero-title">Mentor Business Performance</h1>
              <p className="page-hero-subtitle">
                Monitor mentor delivery, learner experience, operational reliability and business performance.
              </p>
            </div>
            <div className="page-hero-stat">
              <div className="page-hero-stat-value">{kpis ? kpis.average_score : "—"}</div>
              <div className="page-hero-stat-label">Avg Business Score</div>
            </div>
          </div>

          {/* Filter bar */}
          <div className="card filter-card">
            <FilterSelect label="Course" value={filters.course_name} options={filterOptions.course_name} onChange={(v) => handleFilterChange("course_name", v)} />
            <FilterSelect label="Batch" value={filters.batch_name} options={filterOptions.batch_name} onChange={(v) => handleFilterChange("batch_name", v)} />
            <FilterSelect label="Mentor" value={filters.mentor_name} options={filterOptions.mentor_name} onChange={(v) => handleFilterChange("mentor_name", v)} />
            <FilterSelect label="Performance" value={filters.classification} options={CLASSIFICATIONS} onChange={(v) => handleFilterChange("classification", v)} />
            <FilterSelect label="Risk" value={filters.risk} options={RISK_LEVELS} onChange={(v) => handleFilterChange("risk", v)} />

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "#64748b" }}>Date From</label>
              <input type="date" value={filters.date_from} onChange={(e) => handleFilterChange("date_from", e.target.value)} className="date-input" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "#64748b" }}>Date To</label>
              <input type="date" value={filters.date_to} onChange={(e) => handleFilterChange("date_to", e.target.value)} className="date-input" />
            </div>

            {hasActiveFilter && (
              <button onClick={clearFilters} className="btn-clear">
                ✕ Clear Filters
              </button>
            )}

            <div className="export-actions">
              {hasData ? (
                <>
                  <a href={`${API}/mentor-360/export-excel${exportQs}`} target="_blank" rel="noreferrer" className="btn-export btn-export-excel">
                    ⬇ Export Excel
                  </a>
                  <a href={`${API}/mentor-360/export-pdf${exportQs}`} target="_blank" rel="noreferrer" className="btn-export btn-export-pdf">
                    ⬇ Export PDF
                  </a>
                </>
              ) : (
                <span className="export-disabled">No data available for the selected filters.</span>
              )}
            </div>
          </div>

          {/* Active filter chips */}
          {hasActiveFilter && (
            <div className="chips">
              {FILTER_KEYS.filter((k) => filters[k]).map((k) => (
                <span key={k} className="chip">
                  {filters[k]}
                  <button onClick={() => handleFilterChange(k, "")}>×</button>
                </span>
              ))}
            </div>
          )}

          {/* KPI row */}
          <div className="kpi-grid">
            <OperationsKPI title="Total Mentors" value={kpis ? kpis.total_mentors : "—"} color="#0f172a" />
            <OperationsKPI title="Avg Business Score" value={kpis ? kpis.average_score : "—"} color="#f59e0b" />
            <OperationsKPI title="Excellent" value={kpis ? kpis.excellent : "—"} color="#16a34a" />
            <OperationsKPI title="Strong Performers" value={kpis ? kpis.strong_performer : "—"} color="#2563eb" />
            <OperationsKPI title="At Risk" value={kpis ? kpis.at_risk : "—"} color="#ea580c" />
            <OperationsKPI title="Critical" value={kpis ? kpis.critical : "—"} color="#dc2626" />
          </div>

          <div className="chart-row">
            <BreakdownDonutChart title="Performance Classification" data={classificationData} />
            <BreakdownDonutChart title="Risk Distribution" data={riskData} donut={false} />
          </div>

          {dimensionAverages.length > 0 && (
            <BarChartCard
              title="Average Score by Dimension (all filtered mentors)"
              data={dimensionAverages}
              dataKey="value"
              nameKey="name"
              color="#0f172a"
              layout="vertical"
            />
          )}

          <PerformanceMatrix data={matrixData} />

          <div className="card table-card">
            <h2 className="card-title">Mentor Performance Scorecard</h2>
            {mentors === null ? (
              <div className="empty-state">Loading…</div>
            ) : mentors.length === 0 ? (
              <div className="empty-state">No data available for the selected filters.</div>
            ) : (
              <div className="table-wrap">
                <table className="styled-table" style={{ minWidth: "1100px" }}>
                  <thead>
                    <tr>
                      {["Mentor", "Overall Score", "Delivery", "Learner Experience", "Quality", "Reliability", "Resources", "Attendance", "Productivity", "Cost", "Risk"].map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {mentors.map((m) => (
                      <tr key={m.mentor_name}>
                        <td className="strong">
                          <Link href={`/mentor-performance/${encodeURIComponent(m.mentor_name)}`}>{m.mentor_name}</Link>
                        </td>
                        <td className="strong">
                          {m.overall_score} <BusinessScoreBadge classification={m.classification} />
                        </td>
                        <td>{dim(m, "delivery_performance")}{typeof m.delivery_performance?.score === "number" ? "%" : ""}</td>
                        <td>{dim(m, "learner_experience")}{typeof m.learner_experience?.score === "number" ? "%" : ""}</td>
                        <td>{dim(m, "session_quality")}{typeof m.session_quality?.score === "number" ? "%" : ""}</td>
                        <td>{dim(m, "reliability")}{typeof m.reliability?.score === "number" ? "%" : ""}</td>
                        <td>{dim(m, "resource_compliance")}{typeof m.resource_compliance?.score === "number" ? "%" : ""}</td>
                        <td>{dim(m, "attendance_engagement")}{typeof m.attendance_engagement?.score === "number" ? "%" : ""}</td>
                        <td>{dim(m, "productivity")}{typeof m.productivity?.score === "number" ? "%" : ""}</td>
                        <td>{dim(m, "cost_efficiency")}{typeof m.cost_efficiency?.score === "number" ? "%" : ""}</td>
                        <td>
                          <RiskBadge risk={m.risk} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
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
            background: #f59e0b;
            filter: blur(60px);
            opacity: 0.3;
            top: -80px;
            right: 160px;
            animation: float 9s ease-in-out infinite;
          }
          .page-hero-content { position: relative; z-index: 1; }
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
          .page-hero-title { font-size: 26px; font-weight: 800; color: #f8fafc; margin: 0 0 6px; }
          .page-hero-subtitle { color: #94a3b8; font-size: 14px; margin: 0; }
          .page-hero-stat {
            position: relative;
            z-index: 1;
            text-align: center;
            padding: 14px 26px;
            border-radius: 14px;
            background: rgba(255, 255, 255, 0.06);
            border: 1px solid rgba(255, 255, 255, 0.1);
            flex-shrink: 0;
          }
          .page-hero-stat-value { font-size: 26px; font-weight: 800; color: #fbbf24; }
          .page-hero-stat-label { font-size: 11px; color: #94a3b8; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.04em; }

          .card {
            background: #ffffff;
            border-radius: 16px;
            padding: 22px 24px;
            box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
            border: 1px solid #eef2f7;
            margin-bottom: 24px;
          }

          .filter-card { display: flex; align-items: flex-end; gap: 16px; flex-wrap: wrap; }

          .filter-select {
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 10px 12px;
            font-size: 14px;
            min-width: 160px;
            background: #f8fafc;
            outline: none;
          }

          .date-input {
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 10px 12px;
            font-size: 14px;
            background: #f8fafc;
            outline: none;
          }

          .btn-clear {
            background: #f1f5f9;
            color: #334155;
            border: 1.5px solid #e2e8f0;
            border-radius: 10px;
            padding: 10px 16px;
            font-weight: 700;
            font-size: 13px;
            cursor: pointer;
          }
          .btn-clear:hover { background: #e2e8f0; }

          .export-actions { display: flex; gap: 10px; margin-left: auto; align-items: center; }

          .export-disabled { color: #94a3b8; font-size: 13px; }

          .btn-export {
            display: inline-block;
            text-decoration: none;
            border-radius: 10px;
            padding: 10px 16px;
            font-weight: 700;
            font-size: 13px;
            cursor: pointer;
            transition: transform 0.15s ease, box-shadow 0.15s ease;
          }
          .btn-export:hover { transform: translateY(-1px); }
          .btn-export-excel { background: #16a34a; color: #fff; }
          .btn-export-excel:hover { box-shadow: 0 8px 18px -8px rgba(22, 163, 74, 0.6); }
          .btn-export-pdf { background: linear-gradient(120deg, #0f172a, #1e293b); color: #facc15; }
          .btn-export-pdf:hover { box-shadow: 0 8px 18px -8px rgba(15, 23, 42, 0.6); }

          .chips { display: flex; gap: 8px; flex-wrap: wrap; margin: 12px 0 0; }
          .chip {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: #eef2ff;
            color: #3730a3;
            padding: 5px 10px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 600;
          }
          .chip button {
            background: none;
            border: none;
            color: #3730a3;
            cursor: pointer;
            font-size: 14px;
            line-height: 1;
            padding: 0;
          }

          .kpi-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
            gap: 16px;
            margin: 20px 0 24px;
          }

          .chart-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            gap: 20px;
          }

          .table-card { padding: 20px; }
          .card-title { margin: 0 0 14px; font-size: 17px; color: #1e293b; }

          .table-wrap { overflow-x: auto; }
          .styled-table { width: 100%; border-collapse: collapse; font-size: 14px; }
          .styled-table thead th {
            text-align: left;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            color: #94a3b8;
            font-weight: 700;
            padding: 10px 12px;
            border-bottom: 2px solid #f1f5f9;
            white-space: nowrap;
          }
          .styled-table td { padding: 12px; border-bottom: 1px solid #f1f5f9; color: #1e293b; white-space: nowrap; }
          .styled-table td.strong { font-weight: 700; }
          .styled-table td a { color: #0f172a; text-decoration: none; }
          .styled-table td a:hover { text-decoration: underline; }

          .empty-state { text-align: center; padding: 40px 20px; color: #94a3b8; font-size: 14px; }

          @keyframes heroShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
          @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(16px); } }
        `}</style>
      </>
    </ProtectedRoute>
  );
}
