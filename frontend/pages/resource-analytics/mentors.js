import { useEffect, useMemo, useState } from "react";
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
  const [atRisk, setAtRisk] = useState(null);

  useEffect(() => {
    fetch(`${API}/resource-analytics/mentors`)
      .then((res) => res.json())
      .then((data) => setMentors(Array.isArray(data) ? data : []))
      .catch(() => setMentors([]));

    fetch(`${API}/resource-analytics/mentor-heatmap?weeks=4`)
      .then((res) => res.json())
      .then(setHeatmap)
      .catch(() => setHeatmap(null));

    fetch(`${API}/resource-analytics/at-risk-mentors`)
      .then((res) => res.json())
      .then((data) => setAtRisk(Array.isArray(data) ? data : []))
      .catch(() => setAtRisk([]));
  }, []);

  const avgCompliance = useMemo(() => {
    if (!mentors || mentors.length === 0) return null;
    const sum = mentors.reduce((acc, m) => acc + (Number(m.compliance_score) || 0), 0);
    return Math.round(sum / mentors.length);
  }, [mentors]);

  return (
    <ProtectedRoute>
      <>
        <Sidebar />

        <div style={{ marginLeft: "280px", padding: "32px 36px 60px", background: "#f1f5f9", minHeight: "100vh" }}>
          <ResourceHeaderBanner
            title="👨‍🏫 Mentor Resource Performance"
            subtitle="Worst performers first — Compliance Score = On-Time Submissions ÷ Total Required × 100"
            stat={avgCompliance !== null ? { value: `${avgCompliance}%`, label: "Avg Compliance" } : null}
          />

          {atRisk && atRisk.length > 0 && (
            <div className="card risk-card">
              <h2 className="card-title">⚠️ At-Risk Mentors</h2>
              <p className="card-subtitle">
                Compliance classified Needs Improvement or Critical — missing resources, high delay, or heavy reminder load.
              </p>
              <div className="table-wrap">
                <table className="styled-table" style={{ minWidth: "700px" }}>
                  <thead>
                    <tr>
                      <th>Mentor</th>
                      <th>No Submission</th>
                      <th>Avg Delay</th>
                      <th>Reminders</th>
                      <th>Score</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {atRisk.map((m) => (
                      <tr key={m.mentor_name}>
                        <td className="strong">{m.mentor_name}</td>
                        <td>{m.pending}</td>
                        <td className="muted">{m.avg_delay_hours} hrs</td>
                        <td>{m.reminder_count}</td>
                        <td className="strong">{m.compliance_score}%</td>
                        <td>
                          <ComplianceBadge classification={m.classification} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="card table-card">
            {mentors === null ? (
              <div className="empty-state">Loading…</div>
            ) : mentors.length === 0 ? (
              <div className="empty-state">No mentor data yet.</div>
            ) : (
              <div className="table-wrap">
                <table className="styled-table" style={{ minWidth: "900px" }}>
                  <thead>
                    <tr>
                      {COLUMNS.map(([key, label]) => (
                        <th key={key}>{label}</th>
                      ))}
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mentors.map((m, i) => (
                      <tr key={m.mentor_name} style={{ animationDelay: `${i * 0.03}s` }}>
                        <td className="strong">{m.mentor_name}</td>
                        <td>{m.sessions}</td>
                        <td>{m.required}</td>
                        <td>{m.received}</td>
                        <td>{m.pending}</td>
                        <td>{m.delayed}</td>
                        <td>{m.on_time_percent}%</td>
                        <td className="muted">{m.avg_delay_hours} hrs</td>
                        <td>{m.reminder_count}</td>
                        <td className="strong">{m.compliance_score}%</td>
                        <td>
                          <ComplianceBadge classification={m.classification} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="card-title">🗓️ Mentor Resource Compliance Heatmap</h2>
            <p className="card-subtitle">
              On-time submission rate per week — spot mentors trending worse before it becomes a pattern.
            </p>
            <MentorHeatmap data={heatmap} />
          </div>
        </div>

        <style jsx>{`
          .card {
            background: #ffffff;
            border-radius: 16px;
            padding: 22px 24px;
            box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
            border: 1px solid #eef2f7;
            margin-bottom: 24px;
            animation: fadeSlideUp 0.4s ease both;
          }

          .table-card {
            padding: 20px;
          }

          .risk-card {
            padding: 20px;
            border-left: 4px solid #ef4444;
          }

          .card-title {
            margin: 0 0 6px;
            font-size: 17px;
            color: #1e293b;
          }

          .card-subtitle {
            margin: 0 0 16px;
            color: #94a3b8;
            font-size: 13px;
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
            padding: 10px 12px;
            border-bottom: 2px solid #f1f5f9;
            white-space: nowrap;
          }

          .styled-table tbody tr {
            animation: fadeSlideUp 0.3s ease both;
            transition: background 0.12s ease;
          }

          .styled-table tbody tr:hover {
            background: #fafaf9;
          }

          .styled-table td {
            padding: 12px;
            border-bottom: 1px solid #f1f5f9;
            color: #1e293b;
          }

          .styled-table td.muted {
            color: #94a3b8;
          }

          .styled-table td.strong {
            font-weight: 700;
          }

          .empty-state {
            text-align: center;
            padding: 40px 20px;
            color: #94a3b8;
            font-size: 14px;
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
