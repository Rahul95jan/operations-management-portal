import AnalyticsCard from "../AnalyticsCard";

const HEALTH_STYLES = {
  Excellent: { bg: "#dcfce7", color: "#15803d" },
  Good: { bg: "#dbeafe", color: "#1d4ed8" },
  "Needs Improvement": { bg: "#fef3c7", color: "#b45309" },
  Poor: { bg: "#fee2e2", color: "#b91c1c" },
};

function HealthBadge({ status }) {
  const s = HEALTH_STYLES[status] || { bg: "#e2e8f0", color: "#475569" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: s.bg, color: s.color, fontSize: "13px", fontWeight: 700, padding: "6px 14px", borderRadius: "999px", whiteSpace: "nowrap" }}>
      {status || "—"}
    </span>
  );
}

function InfoChip({ label, value }) {
  return (
    <div className="info-chip">
      <div className="info-chip-label">{label}</div>
      <div className="info-chip-value">{value ?? "—"}</div>
      <style jsx>{`
        .info-chip { background: #f8fafc; border: 1px solid #eef2f7; border-radius: 10px; padding: 12px 14px; }
        .info-chip-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; color: #94a3b8; margin-bottom: 4px; }
        .info-chip-value { font-size: 14px; font-weight: 600; color: #1e293b; }
      `}</style>
    </div>
  );
}

// Detailed report for one webinar, shown after "Generate Report".
export default function WebinarReportPanel({ report, registrations }) {
  return (
    <div className="report-card">
        <h2 className="card-title">📄 Individual Webinar Report</h2>

        <h3 className="subsection-title">Webinar Information</h3>
        <div className="info-grid">
          <InfoChip label="Title" value={report.title} />
          <InfoChip label="Course" value={report.course} />
          <InfoChip label="Batch" value={report.batch} />
          <InfoChip label="Mentor" value={report.mentor} />
          <InfoChip label="Mentor Email" value={report.mentor_email} />
          <InfoChip label="Date" value={report.date} />
          <InfoChip label="Time" value={report.time} />
          <InfoChip label="Duration" value={`${report.duration} mins`} />
          <InfoChip label="Platform" value={report.platform} />
          <InfoChip label="Status" value={report.status} />
        </div>

        <h3 className="subsection-title">📊 Webinar Performance</h3>
        <div className="kpi-grid">
          <AnalyticsCard title="Registered Learners" value={report.registered_learners} color="#2563eb" />
          <AnalyticsCard title="Attended Learners" value={report.attended_learners} color="#16a34a" />
          <AnalyticsCard title="Attendance %" value={`${report.attendance_rate}%`} color="#0891b2" />
          <AnalyticsCard title="No Shows" value={report.no_show_learners} color="#dc2626" />
          <AnalyticsCard title="Polls Conducted" value={report.polls_conducted} color="#9333ea" />
          <AnalyticsCard title="Poll Responses" value={report.poll_responses} color="#7c3aed" />
          <AnalyticsCard title="Poll Response %" value={`${report.poll_response_rate}%`} color="#f59e0b" />
          <AnalyticsCard title="Engagement Score" value={report.engagement_score} color="#ea580c" />
        </div>

        <h3 className="subsection-title">🩺 Webinar Health</h3>
        <div className="health-row">
          <div className="health-score">
            <div className="health-score-value">{report.webinar_health_score}</div>
            <div className="health-score-label">Health Score / 100</div>
          </div>
          <HealthBadge status={report.webinar_health_status} />
          <div className="info-grid" style={{ flex: 1 }}>
            <InfoChip label="Dropout Rate" value={`${report.dropout_rate}%`} />
            <InfoChip label="Q&A Resolution Rate" value={`${report.qa_resolution_rate}%`} />
            <InfoChip label="Learner Satisfaction" value={`⭐ ${report.learner_satisfaction}`} />
          </div>
        </div>

        <h3 className="subsection-title">🧑‍🎓 Registered Learners ({registrations.length})</h3>
        <div className="table-scroll">
          <table className="reg-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
              </tr>
            </thead>
            <tbody>
              {registrations.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ textAlign: "center", color: "#94a3b8", padding: "16px" }}>
                    No registration records for this webinar.
                  </td>
                </tr>
              )}
              {registrations.map((learner) => (
                <tr key={learner.id}>
                  <td>{learner.learner_name}</td>
                  <td className="muted">{learner.learner_email}</td>
                  <td className="muted">{learner.phone ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className="subsection-title">📊 Attendance Summary</h3>
        <div className="info-grid">
          <InfoChip label="Registered Learners" value={report.registered_learners} />
          <InfoChip label="Attended Learners" value={report.attended_learners} />
          <InfoChip label="Attendance Rate" value={`${report.attendance_rate}%`} />
          <InfoChip label="No Shows" value={report.no_show_learners} />
          <InfoChip label="No Show Rate" value={`${report.no_show_rate}%`} />
          <InfoChip label="Peak Concurrent Users" value={report.peak_concurrent_users} />
        </div>

        <h3 className="subsection-title">📊 Poll Analytics</h3>
        <div className="info-grid">
          <InfoChip label="Polls Conducted" value={report.polls_conducted} />
          <InfoChip label="Poll Responses" value={report.poll_responses} />
          <InfoChip label="Response Rate" value={`${report.poll_response_rate}%`} />
          <InfoChip label="Average Rating" value={report.poll_average_rating} />
          <InfoChip label="Highest Rated Poll" value={report.highest_rated_poll} />
          <InfoChip label="Engagement Score" value={report.engagement_score} />
        </div>
  
      <style jsx>{`
        .report-card { background: #fff; border: 1px solid #e8edf5; border-radius: 14px; padding: 22px 24px; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05); }
        .card-title { margin: 0 0 18px; font-size: 17px; color: #1e293b; }
        .subsection-title { font-size: 14px; color: #475569; margin: 26px 0 14px; padding-top: 18px; border-top: 1px solid #f1f5f9; }
        .subsection-title:first-of-type { border-top: none; padding-top: 0; margin-top: 8px; }
        .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; }
        .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 16px; }
        .health-row { display: flex; align-items: center; flex-wrap: wrap; gap: 20px; padding: 16px; background: #f8fafc; border: 1px solid #eef2f7; border-radius: 12px; }
        .health-score { text-align: center; flex-shrink: 0; }
        .health-score-value { font-size: 30px; font-weight: 800; color: #1e293b; }
        .health-score-label { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.03em; }
        .table-scroll { overflow-x: auto; }
        .reg-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .reg-table th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.03em; color: #94a3b8; padding: 10px 12px; border-bottom: 2px solid #eef2f7; white-space: nowrap; }
        .reg-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; white-space: nowrap; }
        .reg-table .muted { color: #64748b; }
      `}</style>
    </div>
  );
}
