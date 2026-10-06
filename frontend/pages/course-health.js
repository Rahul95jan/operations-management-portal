import { Fragment, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import Sidebar from "../components/Sidebar";
import ProtectedRoute from "../components/ProtectedRoute";
import { courseOptionsFromBatches } from "../lib/courses";
import {
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Chart as ChartJS,
  Tooltip,
  Legend,
} from "chart.js";
import { Chart } from "react-chartjs-2";
import {
  Activity,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Download,
  Layers,
  Percent,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend);

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const HEALTH_STYLES = {
  Healthy: { bg: "#dcfce7", color: "#15803d" },
  Watch: { bg: "#fef3c7", color: "#b45309" },
  Critical: { bg: "#fee2e2", color: "#b91c1c" },
  "No data": { bg: "#f1f5f9", color: "#64748b" },
};

function HealthBadge({ label }) {
  const s = HEALTH_STYLES[label] || HEALTH_STYLES["No data"];
  return (
    <span style={{ background: s.bg, color: s.color, fontWeight: 800, fontSize: "12px", padding: "4px 10px", borderRadius: "999px" }}>
      {label || "No data"}
    </span>
  );
}

function MetricBar({ label, value, max = 100, suffix = "%", goodAt = 50, lowerIsBetter = false }) {
  const pct = value === null || value === undefined ? 0 : Math.min(100, (value / max) * 100);
  let color = "#cbd5e1";
  if (value !== null && value !== undefined) {
    if (lowerIsBetter) {
      color = value <= goodAt ? "#22c55e" : value <= goodAt * 2 ? "#f59e0b" : "#ef4444";
    } else {
      color = value >= goodAt ? "#22c55e" : value >= goodAt * 0.5 ? "#f59e0b" : "#ef4444";
    }
  }
  return (
    <div style={{ marginBottom: "14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
        <span>{label}</span>
        <span>{value === null || value === undefined ? "—" : `${value}${suffix}`}</span>
      </div>
      <div style={{ height: "8px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: "999px" }} />
      </div>
    </div>
  );
}

function mentor360Url(mentorName, courseName, batchName, dateFrom, dateTo) {
  const params = new URLSearchParams();
  if (courseName) params.set("course_name", courseName);
  if (batchName) params.set("batch_name", batchName);
  if (dateFrom) params.set("date_from", dateFrom);
  if (dateTo) params.set("date_to", dateTo);
  const qs = params.toString();
  return `/mentor-performance/${encodeURIComponent(mentorName)}${qs ? `?${qs}` : ""}`;
}

export default function CourseHealthPage() {
  const router = useRouter();
  const [batches, setBatches] = useState([]);
  const [summary, setSummary] = useState([]);
  const [detail, setDetail] = useState(null);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mentorsLoading, setMentorsLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedMentor, setExpandedMentor] = useState(null);

  const [courseName, setCourseName] = useState("");
  const [batchName, setBatchName] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const courseOptions = useMemo(() => courseOptionsFromBatches(batches), [batches]);
  const batchOptions = useMemo(() => {
    if (!courseName) return batches.map((b) => b.batch_name).filter(Boolean);
    return batches.filter((b) => (b.course_name || b.batch_name) === courseName).map((b) => b.batch_name);
  }, [batches, courseName]);

  useEffect(() => {
    if (router.query.tab === "mentors") setActiveTab("mentors");
    if (router.query.course_name) setCourseName(String(router.query.course_name));
  }, [router.query.tab, router.query.course_name]);

  useEffect(() => {
    fetch(`${API}/batches`).then((r) => r.json()).then(setBatches).catch(() => {});
    fetch(`${API}/course-health/summary`).then((r) => r.json()).then((d) => setSummary(d.items || [])).catch(() => {});
  }, []);

  const buildParams = () => {
    const params = new URLSearchParams();
    if (courseName) params.set("course_name", courseName);
    if (batchName) params.set("batch_name", batchName);
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);
    return params;
  };

  const loadDetail = () => {
    if (!courseName && !batchName) {
      setError("Select a course or batch.");
      return;
    }
    setLoading(true);
    setError("");
    fetch(`${API}/course-health?${buildParams()}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) {
          setDetail(null);
          setError(d.detail || "No data for this selection.");
          return;
        }
        setDetail(d);
      })
      .catch(() => {
        setDetail(null);
        setError("Unable to reach the server.");
      })
      .finally(() => setLoading(false));
  };

  const loadMentors = () => {
    if (!courseName && !batchName) {
      setMentors([]);
      return;
    }
    setMentorsLoading(true);
    fetch(`${API}/course-health/mentors?${buildParams()}`)
      .then((r) => r.json())
      .then((d) => {
        setMentors(d.success ? d.mentors || [] : []);
      })
      .catch(() => setMentors([]))
      .finally(() => setMentorsLoading(false));
  };

  useEffect(() => {
    if (courseOptions.length && !courseName) {
      setCourseName(courseOptions[0]);
    }
  }, [courseOptions, courseName]);

  useEffect(() => {
    if (courseName || batchName) {
      loadDetail();
      loadMentors();
    }
  }, [courseName, batchName, dateFrom, dateTo]); // eslint-disable-line react-hooks/exhaustive-deps

  const trendChart = useMemo(() => {
    if (!detail?.trend?.length) return null;
    return {
      labels: detail.trend.map((t) => t.session_date),
      datasets: [
        {
          type: "line",
          label: "Median stay %",
          data: detail.trend.map((t) => t.median_stay_pct),
          borderColor: "#3b82f6",
          backgroundColor: "#3b82f6",
          tension: 0.35,
          yAxisID: "y",
          spanGaps: true,
        },
        {
          type: "line",
          label: "Poll overall",
          data: detail.trend.map((t) => t.poll_overall),
          borderColor: "#a855f7",
          backgroundColor: "#a855f7",
          tension: 0.35,
          yAxisID: "y1",
          spanGaps: true,
        },
      ],
    };
  }, [detail]);

  const exportUrl = `${API}/course-health/export${dateFrom || dateTo ? `?${new URLSearchParams({ ...(dateFrom && { date_from: dateFrom }), ...(dateTo && { date_to: dateTo }) })}` : ""}`;

  const overviewContent = detail ? (
    <>
      <div className="grid-3">
        <div className="card">
          <div className="card-label"><Activity size={14} /> Health</div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "10px" }}>
            <HealthBadge label={detail.health_label} />
            <span style={{ fontSize: "12px", color: "#64748b" }}>{detail.completed_sessions} completed sessions</span>
          </div>
          {detail.health_reasons?.length > 0 ? (
            <ul className="reasons">
              {detail.health_reasons.map((reason) => <li key={reason}>{reason}</li>)}
            </ul>
          ) : detail.health_label === "Healthy" ? (
            <p className="muted">Delivery and experience are both solid for uploaded sessions.</p>
          ) : null}
        </div>

        <div className="card">
          <div className="card-label"><Layers size={14} /> Coverage</div>
          <div className="big-value">{detail.coverage_pct}%</div>
          <p className="muted">Sessions with both attendee + poll uploads</p>
          {detail.coverage_confidence === "Low" && (
            <div className="warning"><AlertTriangle size={14} /> Low confidence — upload more files before acting on this score.</div>
          )}
          {detail.coverage_confidence === "Medium" && (
            <div className="warning soft">Medium confidence — {detail.coverage_confidence} coverage band (50–79%).</div>
          )}
        </div>

        <div className="card">
          <div className="card-label"><TrendingUp size={14} /> Headline scores</div>
          <div className="score-row"><span>Median stay</span><b>{detail.delivery_score ?? "—"}{detail.delivery_score != null ? "%" : ""}</b></div>
          <div className="score-row"><span>Poll overall</span><b>{detail.experience_score ?? "—"}{detail.experience_score != null ? " / 5" : ""}</b></div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-label"><Percent size={14} /> Delivery pillar</div>
          <MetricBar label="Median stay (% of class)" value={detail.delivery_metrics?.median_stay_pct} goodAt={50} />
          <MetricBar label="Hold rate" value={detail.delivery_metrics?.hold_rate} goodAt={70} />
          <MetricBar label="Early bounce (&lt;15 min)" value={detail.delivery_metrics?.early_bounce_pct} goodAt={20} max={100} suffix="%" lowerIsBetter />
        </div>
        <div className="card">
          <div className="card-label"><Star size={14} /> Experience pillar</div>
          <MetricBar label="Teaching style" value={detail.experience_metrics?.teaching_style_avg ? detail.experience_metrics.teaching_style_avg * 20 : null} goodAt={86} suffix="" max={100} />
          <MetricBar label="Doubts & queries" value={detail.experience_metrics?.doubts_avg ? detail.experience_metrics.doubts_avg * 20 : null} goodAt={86} suffix="" max={100} />
          <MetricBar label="Session effectiveness" value={detail.experience_metrics?.effectiveness_avg ? detail.experience_metrics.effectiveness_avg * 20 : null} goodAt={86} suffix="" max={100} />
          <MetricBar label="Response rate" value={detail.experience_metrics?.response_rate} goodAt={15} />
        </div>
      </div>

      {trendChart && (
        <div className="card">
          <div className="card-label"><TrendingUp size={14} /> Trend by session date</div>
          <div style={{ height: "260px" }}>
            <Chart
              type="line"
              data={trendChart}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: "top" } },
                scales: {
                  y: { position: "left", title: { display: true, text: "Stay %" }, min: 0, max: 100 },
                  y1: { position: "right", title: { display: true, text: "Poll / 5" }, min: 0, max: 5, grid: { drawOnChartArea: false } },
                },
              }}
            />
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-label">Sessions in this course</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Topic</th>
                <th>Mentor</th>
                <th>Stay %</th>
                <th>Poll</th>
                <th>Response</th>
                <th>Health</th>
              </tr>
            </thead>
            <tbody>
              {(detail.sessions || []).map((s) => (
                <tr key={s.session_id}>
                  <td>{s.session_date}</td>
                  <td><Link href={`/session-reports/${s.session_id}`}>{s.topic}</Link></td>
                  <td>{s.mentor_name}</td>
                  <td>{s.median_stay_pct ?? "—"}</td>
                  <td>{s.poll_overall ?? "—"}</td>
                  <td>{s.response_rate != null ? `${s.response_rate}%` : "—"}</td>
                  <td><HealthBadge label={s.health_label} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  ) : null;

  const mentorsContent = (
    <div className="card">
      <div className="card-label"><Users size={14} /> Mentors in this course</div>
      {mentorsLoading ? (
        <p className="muted" style={{ marginTop: "12px" }}>Loading mentor roll-ups…</p>
      ) : mentors.length === 0 ? (
        <p className="muted" style={{ marginTop: "12px" }}>No completed sessions with mentor data for this selection.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: "28px" }} />
                <th>Mentor</th>
                <th>Sessions</th>
                <th>Topics covered</th>
                <th>Stay</th>
                <th>Poll overall</th>
                <th>Health</th>
                <th>Coverage</th>
              </tr>
            </thead>
            <tbody>
              {mentors.map((m) => {
                const isOpen = expandedMentor === m.mentor_name;
                return (
                  <Fragment key={m.mentor_name}>
                    <tr className="mentor-row">
                      <td>
                        <button type="button" className="expand-btn" onClick={() => setExpandedMentor(isOpen ? null : m.mentor_name)} aria-label={isOpen ? "Collapse" : "Expand"}>
                          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                      </td>
                      <td>
                        <Link href={mentor360Url(m.mentor_name, courseName, batchName, dateFrom, dateTo)} className="mentor-link">
                          {m.mentor_name}
                        </Link>
                        {m.expertise && <div className="expertise">{m.expertise}</div>}
                      </td>
                      <td>{m.session_count}</td>
                      <td className="topics-cell">{(m.topics || []).join(", ") || "—"}</td>
                      <td>{m.delivery_score != null ? `${m.delivery_score}%` : "—"}</td>
                      <td>{m.experience_score ?? "—"}</td>
                      <td><HealthBadge label={m.health_label} /></td>
                      <td>{m.coverage_pct}%</td>
                    </tr>
                    {isOpen && (m.sessions || []).map((s) => (
                      <tr key={`${m.mentor_name}-${s.session_id}`} className="session-subrow">
                        <td />
                        <td colSpan={2}><Link href={`/session-reports/${s.session_id}`}>{s.topic || `Session ${s.session_id}`}</Link></td>
                        <td>{s.session_date}</td>
                        <td>{s.median_stay_pct != null ? `${s.median_stay_pct}%` : "—"}</td>
                        <td>{s.poll_overall ?? "—"}</td>
                        <td><HealthBadge label={s.health_label} /></td>
                        <td />
                      </tr>
                    ))}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <ProtectedRoute>
      <Sidebar />
      <div className="page">
        <div className="hero">
          <div>
            <div className="eyebrow">Operations Intelligence</div>
            <h1>Course Health</h1>
            <p>Roll-up delivery and poll experience across uploaded session reports.</p>
          </div>
          <div className="hero-actions">
            <a href={exportUrl} className="btn-secondary" target="_blank" rel="noreferrer">
              <Download size={14} /> Export CSV
            </a>
            <Link href="/session-reports" className="btn-secondary">Session Reports</Link>
          </div>
        </div>

        <div className="card filters">
          <div className="filter-grid">
            <label>
              Course
              <select value={courseName} onChange={(e) => { setCourseName(e.target.value); setBatchName(""); }}>
                <option value="">All courses</option>
                {courseOptions.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label>
              Batch
              <select value={batchName} onChange={(e) => setBatchName(e.target.value)}>
                <option value="">All batches</option>
                {batchOptions.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </label>
            <label>
              From
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </label>
            <label>
              To
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </label>
          </div>
        </div>

        {(courseName || batchName) && (
          <div className="tabs">
            <button type="button" className={`tab ${activeTab === "overview" ? "tab-active" : ""}`} onClick={() => setActiveTab("overview")}>
              Course overview
            </button>
            <button type="button" className={`tab ${activeTab === "mentors" ? "tab-active" : ""}`} onClick={() => setActiveTab("mentors")}>
              By mentor
            </button>
          </div>
        )}

        {error && <div className="alert">{error}</div>}

        {loading && activeTab === "overview" ? (
          <div className="card empty">Loading course health…</div>
        ) : activeTab === "overview" ? (
          overviewContent || <div className="card empty">Select a course or batch to view health.</div>
        ) : (
          mentorsContent
        )}

        {summary.length > 0 && (
          <div className="card" style={{ marginTop: "20px" }}>
            <div className="card-label">All courses with imports</div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Batch</th>
                    <th>Sessions</th>
                    <th>Coverage</th>
                    <th>Stay %</th>
                    <th>Poll</th>
                    <th>Health</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.map((row) => (
                    <tr key={`${row.course_name}-${row.batch_name}`}>
                      <td>{row.course_name}</td>
                      <td>{row.batch_name}</td>
                      <td>{row.completed_sessions}</td>
                      <td>{row.coverage_pct}%</td>
                      <td>{row.delivery_score ?? "—"}</td>
                      <td>{row.experience_score ?? "—"}</td>
                      <td><HealthBadge label={row.health_label} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .page { margin-left: var(--om-sidebar-width, 280px); padding: 28px 32px 56px; min-height: 100vh; background: #f8fafc; }
        .hero { display: flex; justify-content: space-between; gap: 20px; align-items: flex-start; margin-bottom: 20px; }
        .eyebrow { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.04em; }
        h1 { margin: 6px 0 8px; color: #0f172a; }
        p { margin: 0; color: #64748b; }
        .hero-actions { display: flex; gap: 10px; flex-wrap: wrap; }
        .btn-secondary, :global(.btn-secondary) {
          display: inline-flex; align-items: center; gap: 6px; padding: 9px 14px; border-radius: 10px;
          background: #fff; border: 1px solid #e2e8f0; color: #1e293b; font-weight: 700; font-size: 13px; text-decoration: none;
        }
        .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; margin-bottom: 16px; box-shadow: 0 1px 2px rgba(15,23,42,0.04); }
        .filters { margin-bottom: 16px; }
        .filter-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
        label { display: flex; flex-direction: column; gap: 6px; font-size: 12px; font-weight: 700; color: #475569; }
        select, input { border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px; font-size: 13px; }
        .tabs { display: flex; gap: 8px; margin-bottom: 16px; }
        .tab {
          border: 1px solid #e2e8f0; background: #fff; color: #475569; font-weight: 700; font-size: 13px;
          padding: 10px 16px; border-radius: 10px; cursor: pointer;
        }
        .tab-active { background: #0f172a; color: #fff; border-color: #0f172a; }
        .grid-3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
        .grid-2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
        .card-label { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.03em; }
        .big-value { font-size: 34px; font-weight: 800; color: #0f172a; margin-top: 8px; }
        .muted { color: #64748b; font-size: 13px; margin: 8px 0 0; }
        .reasons { margin: 12px 0 0; padding-left: 18px; color: #475569; font-size: 13px; }
        .warning { display: flex; align-items: center; gap: 8px; margin-top: 12px; padding: 10px 12px; border-radius: 10px; background: #fef3c7; color: #92400e; font-size: 12px; font-weight: 700; }
        .warning.soft { background: #fff7ed; color: #9a3412; }
        .score-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
        .score-row:last-child { border-bottom: none; }
        .table-wrap { overflow-x: auto; margin-top: 12px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th, td { text-align: left; padding: 10px 8px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
        th { font-size: 11px; text-transform: uppercase; letter-spacing: 0.03em; color: #64748b; }
        .empty, .alert { padding: 18px; border-radius: 12px; }
        .alert { background: #fef2f2; color: #b91c1c; font-weight: 700; margin-bottom: 16px; }
        .mentor-link { color: #1d4ed8; font-weight: 700; text-decoration: none; }
        .expertise { font-size: 11px; color: #64748b; margin-top: 4px; font-weight: 500; }
        .topics-cell { max-width: 220px; }
        .expand-btn { border: none; background: transparent; color: #64748b; cursor: pointer; padding: 0; display: flex; align-items: center; }
        .session-subrow td { background: #f8fafc; font-size: 12px; }
        @media (max-width: 1100px) {
          .grid-3, .grid-2, .filter-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </ProtectedRoute>
  );
}
