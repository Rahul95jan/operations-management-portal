import AnalyticsCard from "../components/AnalyticsCard";
import SessionTrendChart from "../components/analytics/SessionTrendChart";
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import ProtectedRoute from "../components/ProtectedRoute";
import RevenueTrendChart from "../components/analytics/RevenueTrendChart";
import BatchHealthChart from "../components/analytics/BatchHealthChart";
import OperationsKPI from "../components/analytics/OperationsKPI";
import PlacementKPI from "../components/analytics/PlacementKPI";
import PlacementStatusChart from "../components/analytics/PlacementStatusChart";

const STATUS_COLORS = {
  Completed: { bg: "#dcfce7", color: "#15803d" },
  "On Track": { bg: "#dcfce7", color: "#15803d" },
  Ongoing: { bg: "#dbeafe", color: "#1d4ed8" },
  Scheduled: { bg: "#dbeafe", color: "#1d4ed8" },
  Delayed: { bg: "#fef3c7", color: "#b45309" },
  "At Risk": { bg: "#fee2e2", color: "#b91c1c" },
  Cancelled: { bg: "#fee2e2", color: "#b91c1c" },
};

function StatusPill({ status }) {
  const s = STATUS_COLORS[status] || { bg: "#e2e8f0", color: "#475569" };
  return (
    <span
      style={{
        display: "inline-block",
        background: s.bg,
        color: s.color,
        fontSize: "12px",
        fontWeight: 700,
        padding: "5px 12px",
        borderRadius: "999px",
      }}
    >
      {status}
    </span>
  );
}

function Section({ icon, title, children, delay = 0 }) {
  return (
    <div className="section" style={{ animationDelay: `${delay}s` }}>
      <h2 className="section-title">
        <span>{icon}</span> {title}
      </h2>
      {children}
    </div>
  );
}

function Card({ children }) {
  return <div className="card">{children}</div>;
}

export default function Analytics() {
  const [sessionData, setSessionData] = useState(null);
  const [mentorData, setMentorData] = useState(null);
  const [batchData, setBatchData] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [topMentors, setTopMentors] = useState([]);
  const [topBatches, setTopBatches] = useState([]);
  const [sessionTrend, setSessionTrend] = useState([]);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [placementStatus, setPlacementStatus] = useState([]);

  const fetchSessionTrend = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/session-trend");
      const data = await res.json();
      setSessionTrend(data);
    } catch (err) {
      console.log(err);
    }
  };

  const [batchHealthData, setBatchHealthData] = useState([]);

  const fetchBatchHealthChart = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/batch-health-chart");
      const data = await res.json();
      setBatchHealthData(data);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchPlacementStatus = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/placement-status");
      const data = await res.json();
      setPlacementStatus(data);
    } catch (err) {
      console.log(err);
    }
  };

  const [operationsSummary, setOperationsSummary] = useState({
    total_projects: 0,
    total_sessions: 0,
    completed_sessions: 0,
    cancelled_sessions: 0,
    average_sla: 0,
    average_completion: 0,
    average_mentor_utilization: 0,
    average_resource_utilization: 0,
    average_productivity: 0,
  });

  const [atRiskBatches, setAtRiskBatches] = useState([]);

  const [batchSummary, setBatchSummary] = useState({
    total_batches: 0,
    completed_batches: 0,
    ongoing_batches: 0,
    delayed_batches: 0,
    average_attendance: 0,
    average_completion: 0,
    average_health: 0,
  });

  const [learnerSummary, setLearnerSummary] = useState({
    total_learners: 0,
    active_learners: 0,
    inactive_learners: 0,
    dropout_count: 0,
    average_completion: 0,
  });

  const fetchBatchSummary = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/batch-analytics");
      const data = await res.json();
      setBatchSummary(data);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchBatchPerformance = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/batch-performance");
      const data = await res.json();
      setBatchPerformance(data);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchLearnerSummary = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/learner-analytics");
      const data = await res.json();
      setLearnerSummary(data);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchPlacementSummary = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/placement-summary");
      const data = await res.json();
      setPlacementSummary(data);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchExecutiveSummary = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/executive-summary");
      const data = await res.json();
      setExecutiveSummary(data);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchAtRiskBatches = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/at-risk-batches");
      const data = await res.json();
      setAtRiskBatches(data);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchOperationsSummary = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/operations-analytics");
      const data = await res.json();
      setOperationsSummary(data);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchRevenueTrend = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/revenue-trend");
      const data = await res.json();
      setRevenueTrend(data);
    } catch (err) {
      console.log(err);
    }
  };

  const [placementSummary, setPlacementSummary] = useState({
    eligible_students: 0,
    placed_students: 0,
    placement_rate: 0,
    interview_scheduled: 0,
    offers_received: 0,
    companies_hiring: 0,
    average_ctc: 0,
    highest_ctc: 0,
  });

  const [executiveSummary, setExecutiveSummary] = useState({
    total_projects: 0,
    total_sessions: 0,
    total_batches: 0,
    total_mentors: 0,
    total_learners: 0,
    total_revenue: 0,
    active_issues: 0,
    health_score: 0,
  });

  const [batchPerformance, setBatchPerformance] = useState([]);

  useEffect(() => {
    fetchLearnerSummary();
    fetchBatchSummary();
    fetchBatchPerformance();
    fetchOperationsSummary();
    fetchAtRiskBatches();
    fetchSessionTrend();
    fetchRevenueTrend();
    fetchBatchHealthChart();
    fetchExecutiveSummary();
    fetchPlacementSummary();
    fetchPlacementStatus();

    fetch("http://127.0.0.1:8000/dashboard/session-analytics")
      .then((res) => res.json())
      .then((data) => setSessionData(data));

    fetch("http://127.0.0.1:8000/dashboard/mentor-analytics")
      .then((res) => res.json())
      .then((data) => setMentorData(data));

    fetch("http://127.0.0.1:8000/dashboard/batch-analytics")
      .then((res) => res.json())
      .then((data) => setBatchData(data));

    fetch("http://127.0.0.1:8000/dashboard/revenue-analytics")
      .then((res) => res.json())
      .then((data) => setRevenueData(data));

    fetch("http://127.0.0.1:8000/dashboard/top-mentors")
      .then((res) => res.json())
      .then((data) => setTopMentors(data));

    fetch("http://127.0.0.1:8000/dashboard/top-batches")
      .then((res) => res.json())
      .then((data) => setTopBatches(data));
  }, []);

  if (!sessionData || !mentorData || !batchData || !revenueData) {
    return (
      <ProtectedRoute>
        <>
          <Sidebar />
          <div
            style={{
              marginLeft: "280px",
              minHeight: "100vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: "14px",
              background: "#f1f5f9",
            }}
          >
            <div className="spinner" />
            <div style={{ color: "#64748b", fontSize: "14px" }}>Loading analytics…</div>
          </div>
          <style jsx>{`
            .spinner {
              width: 36px;
              height: 36px;
              border-radius: 50%;
              border: 3px solid #e2e8f0;
              border-top-color: #f59e0b;
              animation: spin 0.8s linear infinite;
            }
            @keyframes spin {
              to {
                transform: rotate(360deg);
              }
            }
          `}</style>
        </>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <>
        <Sidebar />

        <div
          style={{
            marginLeft: "280px",
            padding: "32px 36px 60px",
            background: "#f1f5f9",
            minHeight: "100vh",
          }}
        >
          {/* Header */}
          <div className="page-hero">
            <div className="page-hero-blob" />
            <div className="page-hero-content">
              <div className="page-hero-eyebrow">Operations</div>
              <h1 className="page-hero-title">Analytics Dashboard</h1>
              <p className="page-hero-subtitle">
                Live view of sessions, mentors, batches, revenue, and placements.
              </p>
            </div>
            <div className="page-hero-stat">
              <div className="page-hero-stat-value">{executiveSummary.health_score}%</div>
              <div className="page-hero-stat-label">Health Score</div>
            </div>
          </div>

          {/* Executive Summary */}
          <Section icon="🚀" title="Executive Operations Summary" delay={0}>
            <div className="kpi-grid kpi-grid-4">
              <OperationsKPI title="Projects" value={executiveSummary.total_projects} color="#2563eb" />
              <OperationsKPI title="Sessions" value={executiveSummary.total_sessions} color="#16a34a" />
              <OperationsKPI title="Batches" value={executiveSummary.total_batches} color="#9333ea" />
              <OperationsKPI title="Mentors" value={executiveSummary.total_mentors} color="#ea580c" />
              <OperationsKPI title="Learners" value={executiveSummary.total_learners} color="#0891b2" />
              <OperationsKPI title="Revenue" value={`₹${executiveSummary.total_revenue}`} color="#16a34a" />
              <OperationsKPI title="Active Issues" value={executiveSummary.active_issues} color="#dc2626" />
              <OperationsKPI title="Health Score" value={`${executiveSummary.health_score}%`} color="#059669" />
            </div>
          </Section>

          {/* Placement Analytics */}
          <Section icon="💼" title="Placement Analytics" delay={0.05}>
            <Card>
              <div className="kpi-grid kpi-grid-4">
                <PlacementKPI title="Eligible Students" value={placementSummary.eligible_students} color="#2563eb" />
                <PlacementKPI title="Placed Students" value={placementSummary.placed_students} color="#16a34a" />
                <PlacementKPI title="Placement Rate" value={`${placementSummary.placement_rate}%`} color="#9333ea" />
                <PlacementKPI title="Interviews Scheduled" value={placementSummary.interview_scheduled} color="#ea580c" />
                <PlacementKPI title="Offers Received" value={placementSummary.offers_received} color="#0891b2" />
                <PlacementKPI title="Companies Hiring" value={placementSummary.companies_hiring} color="#dc2626" />
                <PlacementKPI title="Average CTC" value={`${placementSummary.average_ctc} LPA`} color="#059669" />
                <PlacementKPI title="Highest CTC" value={`${placementSummary.highest_ctc} LPA`} color="#7c3aed" />
              </div>
            </Card>
          </Section>

          {/* Placement Status */}
          <Section icon="📈" title="Placement Status Overview" delay={0.08}>
            <Card>
              <PlacementStatusChart data={placementStatus} />
            </Card>
          </Section>

          {/* Session Analytics */}
          <Section icon="📅" title="Session Analytics" delay={0.1}>
            <div className="kpi-grid kpi-grid-4">
              <AnalyticsCard title="Total Sessions" value={sessionData.total_sessions} color="#2563eb" />
              <AnalyticsCard title="Completed" value={sessionData.completed_sessions} color="#16a34a" />
              <AnalyticsCard title="Scheduled" value={sessionData.scheduled_sessions} color="#0891b2" />
              <AnalyticsCard title="Cancelled" value={sessionData.cancelled_sessions} color="#dc2626" />
            </div>
            <Card>
              <SessionTrendChart data={sessionTrend} />
            </Card>
          </Section>

          {/* Mentor Analytics */}
          <Section icon="👨‍🏫" title="Mentor Analytics" delay={0.12}>
            <div className="kpi-grid kpi-grid-4">
              <AnalyticsCard title="Total Mentors" value={mentorData.total_mentors} color="#7c3aed" />
              <AnalyticsCard title="Active Mentors" value={mentorData.active_mentors} color="#16a34a" />
              <AnalyticsCard title="Inactive Mentors" value={mentorData.inactive_mentors} color="#dc2626" />
              <AnalyticsCard title="Avg Hourly Rate" value={`₹${mentorData.average_hourly_rate}`} color="#ea580c" />
            </div>
          </Section>

          {/* Batch Analytics */}
          <Section icon="🎓" title="Batch Analytics" delay={0.14}>
            <div className="kpi-grid kpi-grid-4">
              <AnalyticsCard title="Total Batches" value={batchSummary.total_batches} color="#2563eb" />
              <AnalyticsCard title="Completed" value={batchSummary.completed_batches} color="#16a34a" />
              <AnalyticsCard title="Ongoing" value={batchSummary.ongoing_batches} color="#0891b2" />
              <AnalyticsCard title="Delayed" value={batchSummary.delayed_batches} color="#dc2626" />
              <AnalyticsCard title="Attendance %" value={`${batchSummary.average_attendance}%`} color="#9333ea" />
              <AnalyticsCard title="Completion %" value={`${batchSummary.average_completion}%`} color="#ea580c" />
              <AnalyticsCard title="Health Score" value={batchSummary.average_health} color="#059669" />
            </div>
            <Card>
              <BatchHealthChart data={batchHealthData} />
            </Card>
          </Section>

          {/* Batch Performance */}
          <Section icon="📋" title="Batch Performance" delay={0.16}>
            <Card>
              <div className="table-wrap">
                <table className="styled-table">
                  <thead>
                    <tr>
                      <th>Batch</th>
                      <th>Mentor</th>
                      <th>Strength</th>
                      <th>Sessions</th>
                      <th>Attendance</th>
                      <th>Completion</th>
                      <th>Health</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batchPerformance.map((batch, i) => (
                      <tr key={batch.id} style={{ animationDelay: `${i * 0.03}s` }}>
                        <td className="strong">{batch.batch_name}</td>
                        <td>{batch.mentor_name}</td>
                        <td>{batch.strength}</td>
                        <td>
                          {batch.completed_sessions} / {batch.total_sessions}
                        </td>
                        <td>{batch.attendance_percentage}%</td>
                        <td>{batch.completion_percentage}%</td>
                        <td>{batch.health_score}</td>
                        <td>
                          <StatusPill status={batch.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {batchPerformance.length === 0 && (
                  <div className="empty-state">No batch performance data yet.</div>
                )}
              </div>
            </Card>
          </Section>

          {/* Learner Analytics */}
          <Section icon="👨‍🎓" title="Learner Analytics" delay={0.18}>
            <div className="kpi-grid kpi-grid-5">
              <AnalyticsCard title="Total Learners" value={learnerSummary.total_learners} color="#2563eb" />
              <AnalyticsCard title="Active Learners" value={learnerSummary.active_learners} color="#16a34a" />
              <AnalyticsCard title="Inactive Learners" value={learnerSummary.inactive_learners} color="#dc2626" />
              <AnalyticsCard title="Dropouts" value={learnerSummary.dropout_count} color="#f59e0b" />
              <AnalyticsCard title="Completion %" value={`${learnerSummary.average_completion}%`} color="#059669" />
            </div>
          </Section>

          {/* Operations Analytics */}
          <Section icon="⚙️" title="Operations Analytics" delay={0.2}>
            <div className="kpi-grid kpi-grid-3">
              <AnalyticsCard title="Projects" value={operationsSummary.total_projects} color="#2563eb" />
              <AnalyticsCard title="Total Sessions" value={operationsSummary.total_sessions} color="#0891b2" />
              <AnalyticsCard title="Completed" value={operationsSummary.completed_sessions} color="#16a34a" />
              <AnalyticsCard title="Cancelled" value={operationsSummary.cancelled_sessions} color="#dc2626" />
              <AnalyticsCard title="SLA %" value={`${operationsSummary.average_sla}%`} color="#7c3aed" />
              <AnalyticsCard title="Completion %" value={`${operationsSummary.average_completion}%`} color="#ea580c" />
              <AnalyticsCard title="Mentor Utilization" value={`${operationsSummary.average_mentor_utilization}%`} color="#0f766e" />
              <AnalyticsCard title="Resource Utilization" value={`${operationsSummary.average_resource_utilization}%`} color="#9333ea" />
              <AnalyticsCard title="Productivity" value={`${operationsSummary.average_productivity}%`} color="#059669" />
            </div>
          </Section>

          {/* At-Risk Batches */}
          <Section icon="🚨" title="At-Risk Batches" delay={0.22}>
            <Card>
              <div className="table-wrap">
                <table className="styled-table">
                  <thead>
                    <tr>
                      <th>Batch</th>
                      <th>Mentor</th>
                      <th>Attendance %</th>
                      <th>Completion %</th>
                      <th>Health Score</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {atRiskBatches.map((batch, index) => (
                      <tr key={index} style={{ animationDelay: `${index * 0.03}s` }}>
                        <td className="strong">{batch.batch_name}</td>
                        <td>{batch.mentor_name}</td>
                        <td>{batch.attendance}%</td>
                        <td>{batch.completion}%</td>
                        <td>
                          <span className="health-pill">{batch.health}</span>
                        </td>
                        <td>
                          <StatusPill status={batch.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {atRiskBatches.length === 0 && (
                  <div className="empty-state">✅ No at-risk batches right now.</div>
                )}
              </div>
            </Card>
          </Section>

          {/* Revenue Analytics */}
          <Section icon="💰" title="Revenue Analytics" delay={0.24}>
            <div className="kpi-grid kpi-grid-4">
              <AnalyticsCard title="Total Invoices" value={revenueData.total_invoices} color="#2563eb" />
              <AnalyticsCard title="Total Revenue" value={`₹${revenueData.total_revenue}`} color="#16a34a" />
              <AnalyticsCard title="Paid Amount" value={`₹${revenueData.paid_amount}`} color="#0891b2" />
              <AnalyticsCard title="Pending Amount" value={`₹${revenueData.pending_amount}`} color="#dc2626" />
            </div>
            <Card>
              <RevenueTrendChart data={revenueTrend} />
            </Card>
          </Section>

          {/* Top Mentors */}
          <Section icon="🏆" title="Top Mentors Leaderboard" delay={0.26}>
            <Card>
              <div className="table-wrap">
                <table className="styled-table">
                  <thead>
                    <tr>
                      <th>Mentor</th>
                      <th>Sessions</th>
                      <th>Hourly Rate</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topMentors.map((mentor, index) => (
                      <tr key={index} style={{ animationDelay: `${index * 0.03}s` }}>
                        <td className="strong">{mentor.mentor_name}</td>
                        <td>{mentor.sessions}</td>
                        <td>₹{mentor.hourly_rate}</td>
                        <td>₹{mentor.revenue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {topMentors.length === 0 && <div className="empty-state">No mentor data yet.</div>}
              </div>
            </Card>
          </Section>

          {/* Top Batches */}
          <Section icon="🎓" title="Top Batches Leaderboard" delay={0.28}>
            <Card>
              <div className="table-wrap">
                <table className="styled-table">
                  <thead>
                    <tr>
                      <th>Batch Name</th>
                      <th>Course</th>
                      <th>Mentor</th>
                      <th>Strength</th>
                      <th>Sessions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topBatches.map((batch, index) => (
                      <tr key={index} style={{ animationDelay: `${index * 0.03}s` }}>
                        <td className="strong">{batch.batch_name}</td>
                        <td>{batch.course_name}</td>
                        <td>{batch.mentor_name}</td>
                        <td>{batch.strength}</td>
                        <td>{batch.sessions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {topBatches.length === 0 && <div className="empty-state">No batch data yet.</div>}
              </div>
            </Card>
          </Section>
        </div>

        <style jsx>{`
          .page-hero {
            position: relative;
            overflow: hidden;
            border-radius: 18px;
            padding: 30px 32px;
            margin-bottom: 28px;
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
            background: #22c55e;
            filter: blur(60px);
            opacity: 0.3;
            top: -80px;
            right: 160px;
            animation: float 9s ease-in-out infinite;
          }

          .page-hero-content {
            position: relative;
            z-index: 1;
          }

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

          .page-hero-title {
            font-size: 26px;
            font-weight: 800;
            color: #f8fafc;
            margin: 0 0 6px;
          }

          .page-hero-subtitle {
            color: #94a3b8;
            font-size: 14px;
            margin: 0;
          }

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

          .page-hero-stat-value {
            font-size: 26px;
            font-weight: 800;
            color: #fbbf24;
          }

          .page-hero-stat-label {
            font-size: 11px;
            color: #94a3b8;
            margin-top: 2px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }

          :global(.section) {
            margin-bottom: 30px;
            animation: fadeSlideUp 0.4s ease both;
          }

          :global(.section-title) {
            font-size: 17px;
            color: #1e293b;
            margin: 0 0 14px;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .kpi-grid {
            display: grid;
            gap: 16px;
            margin-bottom: 16px;
          }

          .kpi-grid-3 {
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          }

          .kpi-grid-4 {
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          }

          .kpi-grid-5 {
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          }

          :global(.card) {
            background: #ffffff;
            border-radius: 16px;
            padding: 22px 24px;
            box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
            border: 1px solid #eef2f7;
          }

          .table-wrap {
            overflow-x: auto;
          }

          .styled-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
          }

          .styled-table thead th {
            text-align: left;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            color: #94a3b8;
            font-weight: 700;
            padding: 10px 14px;
            border-bottom: 2px solid #f1f5f9;
          }

          .styled-table tbody tr {
            animation: fadeSlideUp 0.3s ease both;
            transition: background 0.12s ease;
          }

          .styled-table tbody tr:hover {
            background: #fafaf9;
          }

          .styled-table td {
            padding: 12px 14px;
            border-bottom: 1px solid #f1f5f9;
            color: #1e293b;
          }

          .styled-table td.strong {
            font-weight: 600;
          }

          .health-pill {
            display: inline-block;
            background: #fee2e2;
            color: #b91c1c;
            font-weight: 700;
            padding: 5px 12px;
            border-radius: 999px;
            font-size: 12px;
          }

          .empty-state {
            text-align: center;
            padding: 34px 20px;
            color: #94a3b8;
            font-size: 14px;
          }

          @keyframes heroShift {
            0% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
            100% {
              background-position: 0% 50%;
            }
          }

          @keyframes float {
            0%,
            100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(16px);
            }
          }

          @keyframes fadeSlideUp {
            from {
              opacity: 0;
              transform: translateY(8px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </>
    </ProtectedRoute>
  );
}
