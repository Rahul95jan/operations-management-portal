import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import ProtectedRoute from "../components/ProtectedRoute";
import PlacementKPI from "../components/analytics/PlacementKPI";
import ResourceHeaderBanner from "../components/resources/analytics/ResourceHeaderBanner";
import OnTimeDonutChart from "../components/resources/analytics/OnTimeDonutChart";
import BarChartCard from "../components/resources/analytics/BarChartCard";
import TrendChartCard from "../components/resources/analytics/TrendChartCard";

const API = "http://127.0.0.1:8000";

export default function ResourceAnalyticsPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`${API}/resource-analytics`)
      .then((res) => res.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  if (!data) {
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
            <div style={{ color: "#64748b", fontSize: "14px" }}>Loading resource analytics…</div>
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

  const { overall } = data;

  return (
    <ProtectedRoute>
      <>
        <Sidebar />

        <div style={{ marginLeft: "280px", padding: "32px 36px 60px", background: "#f1f5f9", minHeight: "100vh" }}>
          <ResourceHeaderBanner stat={{ value: `${overall.completion_rate}%`, label: "Completion Rate" }} />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "16px" }}>
            <PlacementKPI title="Total Sessions" value={overall.total_sessions} color="#334155" />
            <PlacementKPI title="Resources Required" value={overall.resources_required} color="#2563eb" />
            <PlacementKPI title="Resources Received" value={overall.resources_received} color="#16a34a" />
            <PlacementKPI title="Pending" value={overall.resources_pending} color="#f59e0b" />
            <PlacementKPI title="Delayed" value={overall.resources_delayed} color="#dc2626" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "30px" }}>
            <PlacementKPI title="Completion Rate" value={`${overall.completion_rate}%`} color="#0891b2" />
            <PlacementKPI title="On-Time Rate" value={`${overall.on_time_rate}%`} color="#16a34a" />
            <PlacementKPI title="Avg Delay" value={`${overall.avg_delay_hours} hrs`} color="#ea580c" />
            <PlacementKPI title="Mentors With Pending" value={overall.mentors_with_pending} color="#7c3aed" />
            <PlacementKPI title="Reminders Sent" value={overall.total_reminders_sent} color="#0f172a" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <OnTimeDonutChart data={data.on_time_vs_delayed} />
            <BarChartCard
              title="📊 Resource Type Distribution"
              data={data.resource_type_distribution}
              dataKey="count"
              nameKey="resource_type"
              color="#7c3aed"
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <BarChartCard
              title="⚠️ Pending Resources by Mentor"
              data={data.pending_by_mentor}
              dataKey="count"
              nameKey="mentor_name"
              color="#f59e0b"
              layout="vertical"
            />
            <BarChartCard
              title="⏳ Average Delay by Resource Type"
              data={data.avg_delay_by_type}
              dataKey="avg_delay_hours"
              nameKey="resource_type"
              color="#dc2626"
              layout="vertical"
            />
          </div>

          <BarChartCard
            title="👨‍🏫 Mentor Performance (Completion Rate %)"
            data={data.mentor_performance}
            dataKey="completion_rate"
            nameKey="mentor_name"
            color="#0891b2"
            layout="vertical"
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <TrendChartCard title="📈 Resource Submission Trend" data={data.submission_trend} color="#0f172a" type="line" />
            <TrendChartCard title="📅 Daily Submission Volume" data={data.submission_trend} color="#16a34a" type="bar" />
          </div>

          <TrendChartCard title="🔔 Reminder Trend" data={data.reminder_trend} color="#f59e0b" type="bar" />
        </div>
      </>
    </ProtectedRoute>
  );
}
