import { useEffect, useMemo, useState } from "react";
import Sidebar from "../../components/Sidebar";
import ProtectedRoute from "../../components/ProtectedRoute";
import OperationsKPI from "../../components/analytics/OperationsKPI";
import BarChartCard from "../../components/resources/analytics/BarChartCard";
import BusinessScoreBadge, { RiskBadge } from "../../components/mentorPerformance/BusinessScoreBadge";
import PerformanceMatrix from "../../components/mentorPerformance/PerformanceMatrix";
import BreakdownDonutChart from "../../components/mentorPerformance/BreakdownDonutChart";
import MentorDetailView from "../../components/mentorPerformance/MentorDetailView";
import {
  Users,
  Gauge,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  XCircle,
  SlidersHorizontal,
  PieChart as PieChartIcon,
  Trophy,
  X as XIcon,
} from "lucide-react";

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

const FILTER_KEYS = ["course_name", "batch_name", "mentor_name", "date_from", "date_to", "classification", "risk"];

const SCORECARD_COLUMNS = [
  "Mentor",
  "Overall Score",
  "Delivery",
  "Learner Experience",
  "Quality",
  "Reliability",
  "Resources",
  "Attendance",
  "Productivity",
  "Cost",
  "Risk",
];

// Shared Tailwind recipes for the controls in the filter bar — keeps the
// select and the date inputs visually identical.
const FIELD_CLASS =
  "rounded-[10px] border border-slate-200 bg-slate-50 px-2.5 py-[9px] text-[12.5px] text-slate-900 shadow-[inset_0_1px_1px_rgba(15,23,42,0.02)] outline-none focus:border-[#f5a623]";

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

function dim(row, key, field = "score") {
  const d = row[key];
  if (!d) return "N/A";
  const v = d[field];
  return v === null || v === undefined ? "N/A" : v;
}

function FilterSelect({ label, value, options, onChange }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] font-bold text-slate-500">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={`${FIELD_CLASS} min-w-[150px]`}>
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

function DateField({ label, value, onChange }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-bold uppercase tracking-[0.03em] text-slate-500">{label}</label>
      <input type="date" value={value} onChange={(e) => onChange(e.target.value)} className={FIELD_CLASS} />
    </div>
  );
}

// Icon badge + title used as the header of every card on this page.
function CardHeader({ icon: Icon, title, tint = "rgba(245,166,35,0.12)", color = "#b7791f", className = "" }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span
        className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[10px] border border-[rgba(245,166,35,0.14)]"
        style={{ background: tint, color }}
      >
        <Icon size={15} strokeWidth={2.2} />
      </span>
      <h2 className="m-0 text-[14.5px] font-bold text-slate-800">{title}</h2>
    </div>
  );
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

        <div className="ml-[var(--om-sidebar-width,280px)] min-h-screen bg-[#eff4f9] px-[30px] pb-[60px] pt-7 transition-[margin-left] duration-[250ms] ease-out">
          {/* Hero */}
          <div data-keep-colors className="relative mb-4 flex items-center justify-between gap-6 overflow-hidden rounded-[18px] border border-[rgba(245,166,35,0.12)] bg-[linear-gradient(120deg,#0b1220_0%,#111c33_58%,#0b1220_100%)] bg-[length:200%_200%] px-[30px] py-[26px] shadow-[0_18px_36px_-20px_rgba(11,18,32,0.7)] animate-hero-shift">
            <div className="pointer-events-none absolute -top-24 right-[186px] h-[270px] w-[270px] rounded-full bg-[rgba(245,166,35,0.32)] blur-[70px] animate-hero-float" />
            <div className="pointer-events-none absolute bottom-[-110px] right-[-80px] top-[10px] h-[260px] w-[260px] rotate-[24deg] rounded-full border border-[rgba(245,166,35,0.18)] border-b-transparent border-l-transparent" />

            <div className="relative z-[1] flex-1">
              <h1 className="m-0 mb-1.5 text-[25px] font-extrabold leading-[1.15] text-slate-50">
                Mentor Business Performance
              </h1>
              <p className="m-0 max-w-[560px] text-[13px] leading-[1.5] text-slate-300">
                Monitor mentor delivery, learner experience, operational reliability and business performance.
              </p>
            </div>

            <div className="relative z-[1] min-w-[176px] shrink-0 rounded-[14px] border border-white/[0.14] bg-white/5 px-[18px] py-4 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <div className="text-[30px] font-extrabold leading-none text-[#f5a623]">{kpis ? kpis.average_score : "—"}</div>
              <div className="mt-1.5 text-[11px] uppercase tracking-[0.12em] text-slate-300">Avg Business Score</div>
            </div>
          </div>

          {/* Filter bar */}
          <div className="mb-3.5 rounded-2xl border border-[#e8edf5] bg-white px-[18px] py-4 shadow-[0_2px_10px_rgba(15,23,42,0.05)]">
            <CardHeader icon={SlidersHorizontal} title="Filters" className="mb-3.5" />

            <div className="flex flex-wrap items-end gap-3.5">
              <FilterSelect label="Course" value={filters.course_name} options={filterOptions.course_name} onChange={(v) => handleFilterChange("course_name", v)} />
              <FilterSelect label="Batch" value={filters.batch_name} options={filterOptions.batch_name} onChange={(v) => handleFilterChange("batch_name", v)} />
              <FilterSelect label="Mentor" value={filters.mentor_name} options={filterOptions.mentor_name} onChange={(v) => handleFilterChange("mentor_name", v)} />
              <FilterSelect label="Performance" value={filters.classification} options={CLASSIFICATIONS} onChange={(v) => handleFilterChange("classification", v)} />
              <FilterSelect label="Risk" value={filters.risk} options={RISK_LEVELS} onChange={(v) => handleFilterChange("risk", v)} />

              <DateField label="Date From" value={filters.date_from} onChange={(v) => handleFilterChange("date_from", v)} />
              <DateField label="Date To" value={filters.date_to} onChange={(v) => handleFilterChange("date_to", v)} />

              {hasActiveFilter && (
                <button
                  onClick={clearFilters}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border-[1.5px] border-[#dfe7f0] bg-slate-50 px-3.5 py-[9px] text-[12.5px] font-bold text-slate-700 transition-colors hover:border-[#d5deea] hover:bg-[#eef2f7]"
                >
                  <XIcon size={13} strokeWidth={2.5} /> Clear Filters
                </button>
              )}

              <div className="ml-auto flex items-center gap-2.5">
                {hasData ? (
                  <>
                    <a
                      href={`${API}/mentor-360/export-excel${exportQs}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-[10px] border border-transparent bg-[#14b86a] px-3.5 py-[9px] text-[12.5px] font-bold text-white no-underline shadow-[0_10px_18px_-12px_rgba(20,184,106,0.7)] transition-transform hover:-translate-y-px"
                    >
                      ⬇ Export Excel
                    </a>
                    <a
                      href={`${API}/mentor-360/export-pdf${exportQs}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-[10px] border border-[rgba(250,204,21,0.2)] bg-[linear-gradient(120deg,#0f172a,#1e293b)] px-3.5 py-[9px] text-[12.5px] font-bold text-[#facc15] no-underline shadow-[0_12px_18px_-12px_rgba(15,23,42,0.8)] transition-transform hover:-translate-y-px"
                    >
                      ⬇ Export PDF
                    </a>
                  </>
                ) : (
                  <span className="text-[12.5px] text-slate-400">No data available for the selected filters.</span>
                )}
              </div>
            </div>
          </div>

          {/* Active filter chips */}
          {hasActiveFilter && (
            <div className="mb-3.5 mt-2.5 flex flex-wrap gap-2">
              {FILTER_KEYS.filter((k) => filters[k]).map((k) => (
                <span
                  key={k}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(41,77,154,0.06)] bg-[#eef4ff] px-2.5 py-1.5 text-[12px] font-semibold text-[#294d9a]"
                >
                  {filters[k]}
                  <button onClick={() => handleFilterChange(k, "")} className="cursor-pointer border-none bg-transparent p-0 text-[14px] leading-none text-[#294d9a]">
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {filters.mentor_name ? (
            <>
              <button
                onClick={() => handleFilterChange("mentor_name", "")}
                className="mb-3.5 mt-3.5 inline-flex cursor-pointer items-center gap-1.5 border-none bg-transparent p-0 text-[13px] font-semibold text-slate-600 hover:underline"
              >
                ← All mentors
              </button>
              <MentorDetailView
                mentorName={filters.mentor_name}
                embedded
                filters={{
                  course_name: filters.course_name,
                  batch_name: filters.batch_name,
                  date_from: filters.date_from,
                  date_to: filters.date_to,
                }}
              />
            </>
          ) : (
            <>
          {/* KPI row */}
          <div className="mb-3.5 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
            <OperationsKPI icon={Users} title="Total Mentors" value={kpis ? kpis.total_mentors : "—"} color="#0f172a" />
            <OperationsKPI icon={Gauge} title="Avg Business Score" value={kpis ? kpis.average_score : "—"} color="#f59e0b" />
            <OperationsKPI icon={CheckCircle2} title="Excellent" value={kpis ? kpis.excellent : "—"} color="#16a34a" />
            <OperationsKPI icon={TrendingUp} title="Strong Performers" value={kpis ? kpis.strong_performer : "—"} color="#2563eb" />
            <OperationsKPI icon={AlertTriangle} title="At Risk" value={kpis ? kpis.at_risk : "—"} color="#ea580c" />
            <OperationsKPI icon={XCircle} title="Critical" value={kpis ? kpis.critical : "—"} color="#dc2626" />
          </div>

          {/* Distribution donuts */}
          <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-3.5">
            <BreakdownDonutChart title="Performance Classification" data={classificationData} compact icon={PieChartIcon} iconColor="#f59e0b" />
            <BreakdownDonutChart title="Risk Distribution" data={riskData} donut={false} compact icon={AlertTriangle} iconColor="#dc2626" />
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

          {/* Scorecard table */}
          <div className="mb-3.5 rounded-2xl border border-[#e8edf5] bg-white px-[18px] py-4 shadow-[0_2px_10px_rgba(15,23,42,0.05)]">
            <CardHeader icon={Trophy} title="Mentor Performance Scorecard" className="mb-3.5" />

            {mentors === null ? (
              <div className="px-5 py-10 text-center text-sm text-slate-400">Loading…</div>
            ) : mentors.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-slate-400">No data available for the selected filters.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] border-collapse text-[12.5px]">
                  <thead>
                    <tr>
                      {SCORECARD_COLUMNS.map((h) => (
                        <th
                          key={h}
                          className="whitespace-nowrap border-b-2 border-[#eaf0f7] px-3 py-2.5 text-left text-[10.5px] font-extrabold uppercase tracking-[0.06em] text-slate-500"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {mentors.map((m) => (
                      <tr key={m.mentor_name} className="transition-colors hover:bg-slate-50/70">
                        <td className="whitespace-nowrap border-b border-[#edf2f7] px-3 py-2.5 font-bold text-slate-800">
                          <button
                            onClick={() => {
                              handleFilterChange("mentor_name", m.mentor_name);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            className="cursor-pointer border-none bg-transparent p-0 text-[12.5px] font-bold text-slate-900 hover:underline"
                          >
                            {m.mentor_name}
                          </button>
                        </td>
                        <td className="whitespace-nowrap border-b border-[#edf2f7] px-3 py-2.5 font-bold text-slate-800">
                          <span className="mr-2 align-middle">{m.overall_score}</span>
                          <BusinessScoreBadge classification={m.classification} />
                        </td>
                        {[
                          "delivery_performance",
                          "learner_experience",
                          "session_quality",
                          "reliability",
                          "resource_compliance",
                          "attendance_engagement",
                          "productivity",
                          "cost_efficiency",
                        ].map((key) => (
                          <td key={key} className="whitespace-nowrap border-b border-[#edf2f7] px-3 py-2.5 text-slate-800">
                            {dim(m, key)}
                            {typeof m[key]?.score === "number" ? "%" : ""}
                          </td>
                        ))}
                        <td className="whitespace-nowrap border-b border-[#edf2f7] px-3 py-2.5 text-slate-800">
                          <RiskBadge risk={m.risk} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
            </>
          )}
        </div>
      </>
    </ProtectedRoute>
  );
}
