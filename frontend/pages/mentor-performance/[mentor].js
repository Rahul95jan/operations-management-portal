import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Sidebar from "../../components/Sidebar";
import ProtectedRoute from "../../components/ProtectedRoute";
import BusinessScoreBadge, { RiskBadge } from "../../components/mentorPerformance/BusinessScoreBadge";
import PerformanceMatrix from "../../components/mentorPerformance/PerformanceMatrix";
import TrendChartCard from "../../components/resources/analytics/TrendChartCard";
import BarChartCard from "../../components/resources/analytics/BarChartCard";
import DimensionRadar from "../../components/mentorPerformance/DimensionRadar";

const API = "http://127.0.0.1:8000";

function buildQuery(filters, keys) {
  const params = new URLSearchParams();
  keys.forEach((key) => {
    if (filters[key]) params.set(key, filters[key]);
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

function DimensionCard({ title, value, unit = "%", children }) {
  return (
    <div className="dim-card">
      <div className="dim-title">{title}</div>
      <div className="dim-value">{value === null || value === undefined ? "N/A" : `${value}${typeof value === "number" ? unit : ""}`}</div>
      {children && <div className="dim-details">{children}</div>}
    </div>
  );
}

export default function MentorDetailPage() {
  const router = useRouter();
  const { mentor: mentorParam, course_name, batch_name, date_from, date_to } = router.query;
  const mentorName = mentorParam ? decodeURIComponent(mentorParam) : null;

  const [filters, setFilters] = useState({ course_name: "", batch_name: "", date_from: "", date_to: "" });
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [mentorData, setMentorData] = useState(null);
  const [mentorInfo, setMentorInfo] = useState(null);
  const [trend, setTrend] = useState(null);
  const [peers, setPeers] = useState([]);
  const [webinarStats, setWebinarStats] = useState(null);

  useEffect(() => {
    setFilters({
      course_name: course_name || "",
      batch_name: batch_name || "",
      date_from: date_from || "",
      date_to: date_to || "",
    });
  }, [course_name, batch_name, date_from, date_to]);

  useEffect(() => {
    fetch(`${API}/mentors`)
      .then((r) => r.json())
      .then((data) => {
        const all = Array.isArray(data) ? data : [];
        setMentorInfo(all.find((m) => m.name === mentorName) || null);
      })
      .catch(() => {});
  }, [mentorName]);

  useEffect(() => {
    if (!mentorName) return;

    setLoading(true);
    const qs = buildQuery({ ...filters, mentor_name: mentorName }, ["course_name", "batch_name", "date_from", "date_to"]);

    fetch(`${API}/mentor-360/${encodeURIComponent(mentorName)}${qs}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) {
          setNotFound(true);
          setMentorData(null);
        } else {
          setNotFound(false);
          setMentorData(data.mentor);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));

    fetch(`${API}/mentor-360/scorecard${buildQuery(filters, ["course_name", "batch_name", "date_from", "date_to"])}`)
      .then((r) => r.json())
      .then((data) => setPeers(Array.isArray(data) ? data : []))
      .catch(() => setPeers([]));
  }, [mentorName, filters]);

  useEffect(() => {
    if (!mentorName || !mentorData) return;
    fetch(`${API}/mentor-360/${encodeURIComponent(mentorName)}/trends?months=6`)
      .then((r) => r.json())
      .then((data) => setTrend(Array.isArray(data) ? data : []))
      .catch(() => setTrend([]));
  }, [mentorName, mentorData]);

  useEffect(() => {
    if (!mentorName) return;
    // Supplementary section — a separate module (webinar_operations), not
    // part of the 8-dimension business score. Silently omitted if the
    // mentor has never run a webinar.
    fetch(`${API}/webinars/mentor-performance/${encodeURIComponent(mentorName)}`)
      .then((r) => r.json())
      .then((data) => setWebinarStats(data.success ? data.stats : null))
      .catch(() => setWebinarStats(null));
  }, [mentorName]);

  const matrixData = useMemo(
    () =>
      peers.map((m) => ({
        mentor_name: m.mentor_name,
        x: typeof m.delivery_performance?.score === "number" ? m.delivery_performance.score : null,
        y: typeof m.learner_experience?.score === "number" ? m.learner_experience.score : null,
        z: m.productivity?.learners_served || 1,
      })),
    [peers]
  );

  const trendPoints = useMemo(
    () => (trend || []).map((t) => ({ date: t.month, count: t.overall_score })),
    [trend]
  );

  const dimensionBarData = useMemo(() => {
    if (!mentorData) return [];
    const dims = [
      ["Delivery", mentorData.delivery_performance],
      ["Attendance", mentorData.attendance_engagement],
      ["Learner Exp.", mentorData.learner_experience],
      ["Quality", mentorData.session_quality],
      ["Resources", mentorData.resource_compliance],
      ["Reliability", mentorData.reliability],
      ["Productivity", mentorData.productivity],
      ["Cost Eff.", mentorData.cost_efficiency],
    ];
    return dims
      .filter(([, d]) => d && typeof d.score === "number")
      .map(([label, d]) => ({ name: label, value: d.score }));
  }, [mentorData]);

  return (
    <ProtectedRoute>
      <>
        <Sidebar />

        <div style={{ marginLeft: "280px", padding: "32px 36px 60px", background: "#f1f5f9", minHeight: "100vh" }}>
          <Link href="/mentor-performance" className="back-link">← Back to Mentor 360</Link>

          {loading && <div className="card empty-state">Loading…</div>}

          {!loading && notFound && (
            <div className="card empty-state">No performance data found for this mentor in the selected scope.</div>
          )}

          {!loading && !notFound && mentorData && (
            <>
              <div className="page-hero">
                <div className="page-hero-blob" />
                <div className="page-hero-content">
                  <div className="page-hero-eyebrow">Mentor 360</div>
                  <h1 className="page-hero-title">{mentorData.mentor_name}</h1>
                  <p className="page-hero-subtitle">
                    {mentorInfo?.expertise || "Expertise not on file"} &nbsp;·&nbsp; Status: {mentorInfo?.status || "Unknown"}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "12px" }}>
                  <div className="page-hero-stat">
                    <div className="page-hero-stat-value">{mentorData.overall_score}</div>
                    <div className="page-hero-stat-label">Business Score</div>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
                <BusinessScoreBadge classification={mentorData.classification} />
                <RiskBadge risk={mentorData.risk} />
                <span style={{ color: "#94a3b8", fontSize: "12px" }}>{mentorData.score_basis}</span>
              </div>

              {/* Filters */}
              <div className="card filter-card">
                <div className="filter-field">
                  <label>Course</label>
                  <input
                    type="text"
                    value={filters.course_name}
                    placeholder="Any"
                    onChange={(e) => setFilters((prev) => ({ ...prev, course_name: e.target.value }))}
                  />
                </div>
                <div className="filter-field">
                  <label>Batch</label>
                  <input
                    type="text"
                    value={filters.batch_name}
                    placeholder="Any"
                    onChange={(e) => setFilters((prev) => ({ ...prev, batch_name: e.target.value }))}
                  />
                </div>
                <div className="filter-field">
                  <label>Date From</label>
                  <input type="date" value={filters.date_from} onChange={(e) => setFilters((prev) => ({ ...prev, date_from: e.target.value }))} />
                </div>
                <div className="filter-field">
                  <label>Date To</label>
                  <input type="date" value={filters.date_to} onChange={(e) => setFilters((prev) => ({ ...prev, date_to: e.target.value }))} />
                </div>
              </div>

              {/* Dimension cards */}
              <div className="dim-grid">
                <DimensionCard title="Delivery Performance" value={mentorData.delivery_performance?.score}>
                  {mentorData.delivery_performance && (
                    <>
                      <div>Scheduled: {mentorData.delivery_performance.scheduled}</div>
                      <div>Completed: {mentorData.delivery_performance.completed}</div>
                      <div>Cancelled: {mentorData.delivery_performance.cancelled}</div>
                      <div>Rescheduled: {mentorData.delivery_performance.rescheduled}</div>
                    </>
                  )}
                </DimensionCard>

                <DimensionCard title="Learner Experience" value={mentorData.learner_experience?.score}>
                  {mentorData.learner_experience && (
                    <>
                      <div>Instructor Rating: {mentorData.learner_experience.avg_instructor_rating} / 5</div>
                      <div>Doubt Rating: {mentorData.learner_experience.avg_doubt_rating} / 5</div>
                      <div>NPS: {mentorData.learner_experience.nps_score > 0 ? "+" : ""}{mentorData.learner_experience.nps_score}</div>
                      <div>Feedback Count: {mentorData.learner_experience.feedback_count}</div>
                    </>
                  )}
                </DimensionCard>

                <DimensionCard title="Session Quality" value={mentorData.session_quality?.score}>
                  {mentorData.session_quality && (
                    <>
                      <div>Avg Feedback Score: {mentorData.session_quality.avg_session_feedback_score} / 5</div>
                      <div>QA Score: {mentorData.session_quality.qa_score}</div>
                    </>
                  )}
                </DimensionCard>

                <DimensionCard title="Reliability" value={mentorData.reliability?.score} />

                <DimensionCard title="Resource Compliance" value={mentorData.resource_compliance?.score}>
                  {mentorData.resource_compliance && (
                    <>
                      <div>Required: {mentorData.resource_compliance.required}</div>
                      <div>Received: {mentorData.resource_compliance.received}</div>
                      <div>Avg Delay: {mentorData.resource_compliance.avg_delay_hours} hrs</div>
                      <div>Reminders: {mentorData.resource_compliance.reminder_count}</div>
                    </>
                  )}
                </DimensionCard>

                <DimensionCard title="Attendance & Engagement" value={mentorData.attendance_engagement?.score}>
                  {mentorData.attendance_engagement && (
                    <>
                      <div>Registered: {mentorData.attendance_engagement.registered_learners}</div>
                      <div>Attended: {mentorData.attendance_engagement.attended_learners}</div>
                      <div>Low-Attendance Sessions: {mentorData.attendance_engagement.low_attendance_sessions}</div>
                    </>
                  )}
                </DimensionCard>

                <DimensionCard title="Productivity" value={mentorData.productivity?.score}>
                  {mentorData.productivity && (
                    <>
                      <div>Sessions: {mentorData.productivity.sessions_delivered}</div>
                      <div>Learners Served: {mentorData.productivity.learners_served}</div>
                      <div>Batches: {mentorData.productivity.batches_served}</div>
                      <div>Avg Learners/Session: {mentorData.productivity.avg_learners_per_session}</div>
                    </>
                  )}
                </DimensionCard>

                <DimensionCard title="Cost Efficiency" value={mentorData.cost_efficiency?.score}>
                  {mentorData.cost_efficiency && (
                    <>
                      <div>Cost / Session: ₹{mentorData.cost_efficiency.cost_per_session}</div>
                      <div>Cost / Hour: {mentorData.cost_efficiency.cost_per_hour ? `₹${mentorData.cost_efficiency.cost_per_hour}` : "N/A"}</div>
                      <div>Total Cost: ₹{mentorData.cost_efficiency.total_cost}</div>
                    </>
                  )}
                </DimensionCard>
              </div>

              {mentorData.learning_outcomes && (
                <div className="card">
                  <h2 className="card-title">Learning Outcomes <span className="supplementary-tag">Supplementary — not part of the weighted score</span></h2>
                  <div style={{ display: "flex", gap: "24px", fontSize: "14px", color: "#334155" }}>
                    <div>Avg Course Completion: <strong>{mentorData.learning_outcomes.avg_course_completion_percent}%</strong></div>
                    <div>Total Dropouts: <strong>{mentorData.learning_outcomes.total_dropouts}</strong></div>
                  </div>
                </div>
              )}

              {webinarStats && (
                <div className="card">
                  <h2 className="card-title">🎥 Webinar Performance <span className="supplementary-tag">Supplementary — not part of the weighted score</span></h2>
                  <div className="dim-grid" style={{ marginBottom: "18px" }}>
                    <DimensionCard title="Total Webinars" value={webinarStats.total_webinars} unit="" />
                    <DimensionCard title="Completed" value={webinarStats.completed_webinars} unit="" />
                    <DimensionCard title="Upcoming" value={webinarStats.upcoming_webinars} unit="" />
                    <DimensionCard title="Total Attendees" value={webinarStats.total_attendees} unit="" />
                    <DimensionCard title="Avg Rating" value={webinarStats.average_rating} unit="/5" />
                    <DimensionCard title="Leads Generated" value={webinarStats.leads_generated} unit="" />
                    <DimensionCard title="Conversions" value={webinarStats.conversions} unit="" />
                    <DimensionCard title="Total Payout" value={`₹${webinarStats.total_payout}`} unit="" />
                  </div>
                  <h3 style={{ fontSize: "13px", color: "#64748b", margin: "0 0 10px" }}>Mentor Efficiency</h3>
                  <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", fontSize: "14px", color: "#334155" }}>
                    <div>Avg Attendees / Webinar: <strong>{webinarStats.average_attendance_per_webinar ?? "N/A"}</strong></div>
                    <div>Leads / Webinar: <strong>{webinarStats.leads_per_webinar ?? "N/A"}</strong></div>
                    <div>Conversion Rate: <strong>{webinarStats.conversion_rate !== null ? `${webinarStats.conversion_rate}%` : "N/A"}</strong></div>
                    <div>Payout / Attendee: <strong>{webinarStats.payout_per_attendee !== null ? `₹${webinarStats.payout_per_attendee}` : "N/A"}</strong></div>
                  </div>
                </div>
              )}

              {dimensionBarData.length > 0 && (
                <>
                  <DimensionRadar data={dimensionBarData} />
                  <BarChartCard title="Dimension Breakdown" data={dimensionBarData} dataKey="value" nameKey="name" color="#0f172a" />
                </>
              )}

              {trendPoints.length >= 2 && (
                <TrendChartCard title="Business Score Trend (last 6 months)" data={trendPoints} color="#f59e0b" type="line" />
              )}

              <PerformanceMatrix data={matrixData} highlightMentor={mentorData.mentor_name} />
            </>
          )}
        </div>

        <style jsx>{`
          .back-link { display: inline-block; margin-bottom: 16px; color: #475569; font-size: 13px; text-decoration: none; font-weight: 600; }
          .back-link:hover { text-decoration: underline; }

          .page-hero {
            position: relative;
            overflow: hidden;
            border-radius: 18px;
            padding: 30px 32px;
            margin-bottom: 16px;
            background: linear-gradient(120deg, #0f172a 0%, #1e293b 60%, #0f172a 100%);
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            box-shadow: 0 16px 32px -18px rgba(15, 23, 42, 0.55);
          }
          .page-hero-blob {
            position: absolute; width: 220px; height: 220px; border-radius: 50%;
            background: #f59e0b; filter: blur(60px); opacity: 0.3; top: -80px; right: 160px;
          }
          .page-hero-content { position: relative; z-index: 1; }
          .page-hero-eyebrow {
            display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: 0.08em;
            text-transform: uppercase; color: #fbbf24; background: rgba(251, 191, 36, 0.12);
            border: 1px solid rgba(251, 191, 36, 0.3); padding: 5px 10px; border-radius: 999px; margin-bottom: 10px;
          }
          .page-hero-title { font-size: 26px; font-weight: 800; color: #f8fafc; margin: 0 0 6px; }
          .page-hero-subtitle { color: #94a3b8; font-size: 14px; margin: 0; }
          .page-hero-stat {
            position: relative; z-index: 1; text-align: center; padding: 14px 26px; border-radius: 14px;
            background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.1); flex-shrink: 0;
          }
          .page-hero-stat-value { font-size: 26px; font-weight: 800; color: #fbbf24; }
          .page-hero-stat-label { font-size: 11px; color: #94a3b8; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.04em; }

          .card {
            background: #ffffff; border-radius: 16px; padding: 22px 24px;
            box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06); border: 1px solid #eef2f7; margin-bottom: 24px;
          }
          .card-title { margin: 0 0 14px; font-size: 17px; color: #1e293b; display: flex; align-items: center; gap: 10px; }
          .supplementary-tag { font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: none; }

          .filter-card { display: flex; gap: 16px; flex-wrap: wrap; }
          .filter-field { display: flex; flex-direction: column; gap: 6px; }
          .filter-field label { font-size: 12px; font-weight: 700; color: #64748b; }
          .filter-field input {
            border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px; font-size: 14px;
            background: #f8fafc; outline: none; min-width: 160px;
          }

          .dim-grid {
            display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 16px; margin-bottom: 24px;
          }
          .dim-card {
            background: #fff; border-radius: 14px; padding: 18px 20px;
            box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06); border: 1px solid #eef2f7;
          }
          .dim-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; color: #94a3b8; margin-bottom: 6px; }
          .dim-value { font-size: 26px; font-weight: 800; color: #0f172a; margin-bottom: 8px; }
          .dim-details { font-size: 12.5px; color: #64748b; display: flex; flex-direction: column; gap: 3px; }

          .empty-state { text-align: center; padding: 40px 20px; color: #94a3b8; font-size: 14px; }
        `}</style>
      </>
    </ProtectedRoute>
  );
}
