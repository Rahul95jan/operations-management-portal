import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import ProtectedRoute from "../../components/ProtectedRoute";
import ResourceHeaderBanner from "../../components/resources/analytics/ResourceHeaderBanner";
import ComplianceBadge from "../../components/resources/analytics/ComplianceBadge";
import MentorHeatmap from "../../components/resources/analytics/MentorHeatmap";

const API = "http://127.0.0.1:8000";

const COLUMNS = [
  ["mentor_name", "Mentor"],
  ["sessions", "Sessions"],
  ["required", "Required"],
  ["received", "Received"],
  ["pending", "Pending"],
  ["delayed", "Delayed"],
  ["on_time_percent", "On-Time %"],
  ["avg_delay_hours", "Avg Delay"],
  ["reminder_count", "Reminders"],
  ["compliance_score", "Compliance Score"],
];

export default function MentorPerformancePage() {
  const [mentors, setMentors] = useState(null);
  const [heatmap, setHeatmap] = useState(null);

  useEffect(() => {
    fetch(`${API}/resource-analytics/mentors`)
      .then((res) => res.json())
      .then((data) => setMentors(Array.isArray(data) ? data : []))
      .catch(() => setMentors([]));

    fetch(`${API}/resource-analytics/mentor-heatmap?weeks=4`)
      .then((res) => res.json())
      .then(setHeatmap)
      .catch(() => setHeatmap(null));
  }, []);

  return (
    <ProtectedRoute>
      <>
        <Sidebar />

        <div style={{ marginLeft: "300px", padding: "30px", background: "#f8fafc", minHeight: "100vh" }}>
          <ResourceHeaderBanner />
          <h1 style={{ fontSize: "26px", fontWeight: 700, marginTop: 0 }}>👨‍🏫 Mentor Resource Performance</h1>
          <p style={{ color: "#64748b", marginTop: 0, marginBottom: "24px" }}>
            Worst performers first — Compliance Score = On-Time Submissions ÷ Total Required × 100.
          </p>

          <div style={{ background: "#fff", borderRadius: "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)", padding: "20px", marginBottom: "24px", overflowX: "auto" }}>
            {mentors === null ? (
              <p>Loading...</p>
            ) : mentors.length === 0 ? (
              <p style={{ color: "#94a3b8" }}>No mentor data yet.</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
                <thead>
                  <tr style={{ textAlign: "left", borderBottom: "2px solid #e2e8f0" }}>
                    {COLUMNS.map(([key, label]) => (
                      <th key={key} style={{ padding: "10px 12px", fontSize: "12px", color: "#64748b", textTransform: "uppercase" }}>
                        {label}
                      </th>
                    ))}
                    <th style={{ padding: "10px 12px", fontSize: "12px", color: "#64748b", textTransform: "uppercase" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {mentors.map((m) => (
                    <tr key={m.mentor_name} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px", fontWeight: 700 }}>{m.mentor_name}</td>
                      <td style={{ padding: "12px" }}>{m.sessions}</td>
                      <td style={{ padding: "12px" }}>{m.required}</td>
                      <td style={{ padding: "12px" }}>{m.received}</td>
                      <td style={{ padding: "12px" }}>{m.pending}</td>
                      <td style={{ padding: "12px" }}>{m.delayed}</td>
                      <td style={{ padding: "12px" }}>{m.on_time_percent}%</td>
                      <td style={{ padding: "12px" }}>{m.avg_delay_hours} hrs</td>
                      <td style={{ padding: "12px" }}>{m.reminder_count}</td>
                      <td style={{ padding: "12px", fontWeight: 700 }}>{m.compliance_score}%</td>
                      <td style={{ padding: "12px" }}>
                        <ComplianceBadge classification={m.classification} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div style={{ background: "#fff", borderRadius: "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)", padding: "20px" }}>
            <h2 style={{ marginTop: 0 }}>🗓️ Mentor Resource Compliance Heatmap</h2>
            <p style={{ color: "#94a3b8", marginTop: 0 }}>On-time submission rate per week — spot mentors trending worse before it becomes a pattern.</p>
            <MentorHeatmap data={heatmap} />
          </div>
        </div>
      </>
    </ProtectedRoute>
  );
}
