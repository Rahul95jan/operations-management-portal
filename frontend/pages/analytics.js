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
    const res = await fetch(
      "http://127.0.0.1:8000/session-trend"
    );

    const data = await res.json();

    setSessionTrend(data);
  } catch (err) {
    console.log(err);
  }
};
 const [batchHealthData, setBatchHealthData] = useState([]);

const fetchBatchHealthChart = async () => {
  try {
    const res = await fetch(
      "http://127.0.0.1:8000/batch-health-chart"
    );

    const data = await res.json();

    setBatchHealthData(data);
  } catch (err) {
    console.log(err);
  }
};

const fetchPlacementStatus = async () => {
  try {
    const res = await fetch(
      "http://127.0.0.1:8000/placement-status"
    );

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
    const res = await fetch(
      "http://127.0.0.1:8000/batch-analytics"
    );

    const data = await res.json();

    setBatchSummary(data);
  } catch (err) {
    console.log(err);
  }
};

const fetchBatchPerformance = async () => {
  try {
    const res = await fetch(
      "http://127.0.0.1:8000/batch-performance"
    );

    const data = await res.json();

    setBatchPerformance(data);
  } catch (err) {
    console.log(err);
  }
};

  const fetchLearnerSummary = async () => {
  try {
    const res = await fetch(
      "http://127.0.0.1:8000/learner-analytics"
    );

    const data = await res.json();

    setLearnerSummary(data);

  } catch (err) {
    console.log(err);
  }
};

const fetchPlacementSummary = async () => {
  try {
    const res = await fetch(
      "http://127.0.0.1:8000/placement-summary"
    );

    const data = await res.json();

    setPlacementSummary(data);
  } catch (err) {
    console.log(err);
  }
};
  const fetchExecutiveSummary = async () => {
  try {
    const res = await fetch(
      "http://127.0.0.1:8000/executive-summary"
    );

    const data = await res.json();

    setExecutiveSummary(data);
  } catch (err) {
    console.log(err);
  }
};

const fetchAtRiskBatches = async () => {
  try {
    const res = await fetch(
      "http://127.0.0.1:8000/at-risk-batches"
    );

    const data = await res.json();

    setAtRiskBatches(data);
  } catch (err) {
    console.log(err);
  }
};

const fetchOperationsSummary = async () => {
  try {
    const res = await fetch(
      "http://127.0.0.1:8000/operations-analytics"
    );

    const data = await res.json();

    setOperationsSummary(data);
  } catch (err) {
    console.log(err);
  }
};

const fetchRevenueTrend = async () => {
  try {
    const res = await fetch(
      "http://127.0.0.1:8000/revenue-trend"
    );

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

  if (
    !sessionData ||
    !mentorData ||
    !batchData ||
    !revenueData
  ) {
    return <h2>Loading Analytics...</h2>;
  }

  return (
  <ProtectedRoute>
    <>
      <Sidebar />

      <div
        style={{
          marginLeft: "300px",
          padding: "30px",
          background: "#f8fafc",
          minHeight: "100vh",
        }}
      >
        <h1
  style={{
    fontSize: "36px",
    fontWeight: "700",
    marginBottom: "30px",
  }}
>
  📊 Analytics Dashboard
</h1>

{/* 💼 Placement Analytics */}
<div
  style={{
    background: "#ffffff",
    padding: "25px",
    borderRadius: "12px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    marginBottom: "40px",
  }}
>
  <h2 style={{ marginBottom: "25px" }}>
    💼 Placement Analytics
  </h2>

<div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(4,1fr)",
    gap: "20px",
  }}
>
  <PlacementKPI
    title="Eligible Students"
    value={placementSummary.eligible_students}
    color="#2563eb"
  />

  <PlacementKPI
    title="Placed Students"
    value={placementSummary.placed_students}
    color="#16a34a"
  />

  <PlacementKPI
    title="Placement Rate"
    value={`${placementSummary.placement_rate}%`}
    color="#9333ea"
  />

  <PlacementKPI
    title="Interviews Scheduled"
    value={placementSummary.interview_scheduled}
    color="#ea580c"
  />

  <PlacementKPI
    title="Offers Received"
    value={placementSummary.offers_received}
    color="#0891b2"
  />

  <PlacementKPI
    title="Companies Hiring"
    value={placementSummary.companies_hiring}
    color="#dc2626"
  />

  <PlacementKPI
    title="Average CTC"
    value={`${placementSummary.average_ctc} LPA`}
    color="#059669"
  />

  <PlacementKPI
    title="Highest CTC"
    value={`${placementSummary.highest_ctc} LPA`}
    color="#7c3aed"
  />
</div>

{/* 📈 Placement Status Overview */}
<div
  style={{
    background: "#ffffff",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    marginBottom: "40px",
  }}
>
  <h2 style={{ marginBottom: "20px" }}>
    📈 Placement Status Overview
  </h2>

  <PlacementStatusChart data={placementStatus} />
</div>
</div>

<h2 style={{ marginBottom: "20px" }}>
  🚀 Executive Operations Summary
</h2>

<div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(4,1fr)",
    gap: "20px",
    marginBottom: "40px",
  }}
>
  <OperationsKPI
    title="Projects"
    value={executiveSummary.total_projects}
    color="#2563eb"
  />

  <OperationsKPI
    title="Sessions"
    value={executiveSummary.total_sessions}
    color="#16a34a"
  />

  <OperationsKPI
    title="Batches"
    value={executiveSummary.total_batches}
    color="#9333ea"
  />

  <OperationsKPI
    title="Mentors"
    value={executiveSummary.total_mentors}
    color="#ea580c"
  />

  <OperationsKPI
    title="Learners"
    value={executiveSummary.total_learners}
    color="#0891b2"
  />

  <OperationsKPI
    title="Revenue"
    value={`₹${executiveSummary.total_revenue}`}
    color="#16a34a"
  />

  <OperationsKPI
    title="Active Issues"
    value={executiveSummary.active_issues}
    color="#dc2626"
  />

  <OperationsKPI
    title="Health Score"
    value={`${executiveSummary.health_score}%`}
    color="#059669"
  />
</div>
          {/* Session Analytics */}

          <h2>📅 Session Analytics</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: "20px",
              marginBottom: "40px",
            }}
          >
            <AnalyticsCard
              title="Total Sessions"
              value={sessionData.total_sessions}
              color="#2563eb"
            />

            <AnalyticsCard
              title="Completed"
              value={sessionData.completed_sessions}
              color="#16a34a"
            />

            <AnalyticsCard
              title="Scheduled"
              value={sessionData.scheduled_sessions}
              color="#0891b2"
            />

            <AnalyticsCard
              title="Cancelled"
              value={sessionData.cancelled_sessions}
              color="#dc2626"
            />
          </div>

            <SessionTrendChart data={sessionTrend} />

          {/* Mentor Analytics */}

          <h2>👨‍🏫 Mentor Analytics</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: "20px",
              marginBottom: "40px",
            }}
          >
            <AnalyticsCard
              title="Total Mentors"
              value={mentorData.total_mentors}
              color="#7c3aed"
            />

            <AnalyticsCard
              title="Active Mentors"
              value={mentorData.active_mentors}
              color="#16a34a"
            />

            <AnalyticsCard
              title="Inactive Mentors"
              value={mentorData.inactive_mentors}
              color="#dc2626"
            />

            <AnalyticsCard
              title="Avg Hourly Rate"
              value={`₹${mentorData.average_hourly_rate}`}
              color="#ea580c"
            />
          </div>

          {/* Batch Analytics */}

          <div
          style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: "20px",
         marginBottom: "40px",
         }}
>
  <AnalyticsCard
    title="Total Batches"
    value={batchSummary.total_batches}
    color="#2563eb"
  />

  <AnalyticsCard
    title="Completed"
    value={batchSummary.completed_batches}
    color="#16a34a"
  />

  <AnalyticsCard
    title="Ongoing"
    value={batchSummary.ongoing_batches}
    color="#0891b2"
  />

  <AnalyticsCard
    title="Delayed"
    value={batchSummary.delayed_batches}
    color="#dc2626"
  />

  <AnalyticsCard
    title="Attendance %"
    value={`${batchSummary.average_attendance}%`}
    color="#9333ea"
  />

  <AnalyticsCard
    title="Completion %"
    value={`${batchSummary.average_completion}%`}
    color="#ea580c"
  />

  <AnalyticsCard
    title="Health Score"
    value={batchSummary.average_health}
    color="#059669"
  />
</div>
<BatchHealthChart data={batchHealthData} />

{/* Batch Performance */}

<div
  style={{
    background: "#ffffff",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    marginBottom: "40px",
  }}
>
  <h2>📋 Batch Performance</h2>

  <table
    border="1"
    cellPadding="10"
    style={{
      width: "100%",
      borderCollapse: "collapse",
    }}
  >
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
      {batchPerformance.map((batch) => (
        <tr key={batch.id}>
          <td>{batch.batch_name}</td>
          <td>{batch.mentor_name}</td>
          <td>{batch.strength}</td>
          <td>
            {batch.completed_sessions} / {batch.total_sessions}
          </td>
          <td>{batch.attendance_percentage}%</td>
          <td>{batch.completion_percentage}%</td>
          <td>{batch.health_score}</td>
          <td>{batch.status}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

<h2>👨‍🎓 Learner Analytics</h2>

<div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(5,1fr)",
    gap: "20px",
    marginBottom: "40px",
  }}
>
  <AnalyticsCard
    title="Total Learners"
    value={learnerSummary.total_learners}
    color="#2563eb"
  />

  <AnalyticsCard
    title="Active Learners"
    value={learnerSummary.active_learners}
    color="#16a34a"
  />

  <AnalyticsCard
    title="Inactive Learners"
    value={learnerSummary.inactive_learners}
    color="#dc2626"
  />

  <AnalyticsCard
    title="Dropouts"
    value={learnerSummary.dropout_count}
    color="#f59e0b"
  />

  <AnalyticsCard
    title="Completion %"
    value={`${learnerSummary.average_completion}%`}
    color="#059669"
  />
</div>
          <h2>⚙️ Operations Analytics</h2>

<div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(3,1fr)",
    gap: "20px",
    marginBottom: "40px",
  }}
>
  <AnalyticsCard
    title="Projects"
    value={operationsSummary.total_projects}
    color="#2563eb"
  />

  <AnalyticsCard
    title="Total Sessions"
    value={operationsSummary.total_sessions}
    color="#0891b2"
  />

  <AnalyticsCard
    title="Completed"
    value={operationsSummary.completed_sessions}
    color="#16a34a"
  />

  <AnalyticsCard
    title="Cancelled"
    value={operationsSummary.cancelled_sessions}
    color="#dc2626"
  />

  <AnalyticsCard
    title="SLA %"
    value={`${operationsSummary.average_sla}%`}
    color="#7c3aed"
  />

  <AnalyticsCard
    title="Completion %"
    value={`${operationsSummary.average_completion}%`}
    color="#ea580c"
  />

  <AnalyticsCard
    title="Mentor Utilization"
    value={`${operationsSummary.average_mentor_utilization}%`}
    color="#0f766e"
  />

  <AnalyticsCard
    title="Resource Utilization"
    value={`${operationsSummary.average_resource_utilization}%`}
    color="#9333ea"
  />

  <AnalyticsCard
    title="Productivity"
    value={`${operationsSummary.average_productivity}%`}
    color="#059669"
  />
</div>

           <div
  style={{
    background: "#ffffff",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    marginBottom: "40px",
  }}
>
  <h2>🚨 At-Risk Batches</h2>

  <table
    border="1"
    cellPadding="10"
    style={{
      width: "100%",
      borderCollapse: "collapse",
      textAlign: "center",
    }}
  >
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
      {atRiskBatches.length === 0 ? (
        <tr>
          <td colSpan="6">✅ No At-Risk Batches</td>
        </tr>
      ) : (
        atRiskBatches.map((batch, index) => (
          <tr key={index}>
            <td>{batch.batch_name}</td>
            <td>{batch.mentor_name}</td>
            <td>{batch.attendance}%</td>
            <td>{batch.completion}%</td>

            <td>
              <span
                style={{
                  background: "#dc2626",
                  color: "#fff",
                  padding: "5px 10px",
                  borderRadius: "20px",
                  fontWeight: "bold",
                }}
              >
                {batch.health}
              </span>
            </td>

            <td>
              <span
                style={{
                  background: "#facc15",
                  color: "#000",
                  padding: "5px 12px",
                  borderRadius: "20px",
                  fontWeight: "bold",
                }}
              >
                {batch.status}
              </span>
            </td>
          </tr>
        ))
      )}
    </tbody>
  </table>
</div>
          {/* Revenue Analytics */}

          <h2>💰 Revenue Analytics</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: "20px",
              marginBottom: "40px",
            }}
          >
            <AnalyticsCard
              title="Total Invoices"
              value={revenueData.total_invoices}
              color="#2563eb"
            />

            <AnalyticsCard
              title="Total Revenue"
              value={`₹${revenueData.total_revenue}`}
              color="#16a34a"
            />

            <AnalyticsCard
              title="Paid Amount"
              value={`₹${revenueData.paid_amount}`}
              color="#0891b2"
            />

            <AnalyticsCard
              title="Pending Amount"
              value={`₹${revenueData.pending_amount}`}
              color="#dc2626"
            />
          </div>

           <RevenueTrendChart data={revenueTrend} />

          {/* Top Mentors */}

          <div
            style={{
              background: "#ffffff",
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
              marginBottom: "40px",
            }}
          >
            <h2>🏆 Top Mentors Leaderboard</h2>

            <table
              border="1"
              cellPadding="10"
              style={{
                width: "100%",
                borderCollapse: "collapse",
              }}
            >
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
                  <tr key={index}>
                    <td>{mentor.mentor_name}</td>
                    <td>{mentor.sessions}</td>
                    <td>₹{mentor.hourly_rate}</td>
                    <td>₹{mentor.revenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Top Batches */}

<div
  style={{
    background: "#ffffff",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    marginBottom: "40px",
  }}
>
  <h2>🎓 Top Batches Leaderboard</h2>

  <table
    border="1"
    cellPadding="10"
    style={{
      width: "100%",
      borderCollapse: "collapse",
    }}
  >
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
        <tr key={index}>
          <td>{batch.batch_name}</td>
          <td>{batch.course_name}</td>
          <td>{batch.mentor_name}</td>
          <td>{batch.strength}</td>
          <td>{batch.sessions}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

      </div>
    </>
  </ProtectedRoute>
);
}