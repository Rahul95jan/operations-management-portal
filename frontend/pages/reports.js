import { useEffect, useState } from "react";
import ProtectedRoute from "../components/ProtectedRoute";
import Sidebar from "../components/Sidebar";

const STATUS_STYLES = {
  Scheduled: { bg: "#dbeafe", color: "#1d4ed8", dot: "#3b82f6" },
  Completed: { bg: "#dcfce7", color: "#15803d", dot: "#22c55e" },
  Cancelled: { bg: "#fee2e2", color: "#b91c1c", dot: "#ef4444" },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || { bg: "#e2e8f0", color: "#475569", dot: "#94a3b8" };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        background: s.bg,
        color: s.color,
        fontSize: "12px",
        fontWeight: 700,
        padding: "5px 12px",
        borderRadius: "999px",
      }}
    >
      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: s.dot }} />
      {status}
    </span>
  );
}

function ReportSection({ icon, title, count, delay, children }) {
  return (
    <div className="card" style={{ animationDelay: `${delay}s` }}>
      <div className="section-header">
        <h2 className="card-title">
          {icon} {title}
        </h2>
        {typeof count === "number" && <span className="count-chip">{count} records</span>}
      </div>
      {children}
    </div>
  );
}

export default function Reports() {
  const [sessions, setSessions] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [batches, setBatches] = useState([]);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/sessions")
      .then((res) => res.json())
      .then((data) => setSessions(data));

    fetch("http://127.0.0.1:8000/mentors")
      .then((res) => res.json())
      .then((data) => setMentors(data));

    fetch("http://127.0.0.1:8000/batches")
      .then((res) => res.json())
      .then((data) => setBatches(data));
  }, []);

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
              <h1 className="page-hero-title">Reports Center</h1>
              <p className="page-hero-subtitle">
                Consolidated session, mentor, and batch reports — ready to export.
              </p>
            </div>
            <div className="page-hero-stats">
              <div className="page-hero-stat">
                <div className="page-hero-stat-value">{sessions.length}</div>
                <div className="page-hero-stat-label">Sessions</div>
              </div>
              <div className="page-hero-stat">
                <div className="page-hero-stat-value">{mentors.length}</div>
                <div className="page-hero-stat-label">Mentors</div>
              </div>
              <div className="page-hero-stat">
                <div className="page-hero-stat-value">{batches.length}</div>
                <div className="page-hero-stat-label">Batches</div>
              </div>
            </div>
          </div>

          {/* Session Report */}
          <ReportSection icon="📅" title="Session Report" count={sessions.length} delay={0}>
            <div className="table-wrap">
              <table className="styled-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Topic</th>
                    <th>Mentor</th>
                    <th>Batch</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session, i) => (
                    <tr key={session.id} style={{ animationDelay: `${i * 0.03}s` }}>
                      <td className="muted">{session.id}</td>
                      <td className="strong">{session.topic}</td>
                      <td>{session.mentor_name}</td>
                      <td>{session.batch_name}</td>
                      <td className="muted">{session.session_date}</td>
                      <td className="muted">{session.session_time}</td>
                      <td>
                        <StatusBadge status={session.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {sessions.length === 0 && <div className="empty-state">No sessions yet.</div>}
            </div>
          </ReportSection>

          {/* Mentor Report */}
          <ReportSection icon="👨‍🏫" title="Mentor Report" count={mentors.length} delay={0.05}>
            <div className="table-wrap">
              <table className="styled-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Expertise</th>
                    <th>Hourly Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {mentors.map((mentor, i) => (
                    <tr key={mentor.id} style={{ animationDelay: `${i * 0.03}s` }}>
                      <td className="strong">{mentor.name}</td>
                      <td>{mentor.email}</td>
                      <td>{mentor.expertise && <span className="tag">{mentor.expertise}</span>}</td>
                      <td className="strong">₹{mentor.hourly_rate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {mentors.length === 0 && <div className="empty-state">No mentors yet.</div>}
            </div>
          </ReportSection>

          {/* Batch Report */}
          <ReportSection icon="🎓" title="Batch Report" count={batches.length} delay={0.1}>
            <div className="table-wrap">
              <table className="styled-table">
                <thead>
                  <tr>
                    <th>Batch</th>
                    <th>Course</th>
                    <th>Strength</th>
                    <th>Mentor</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map((batch, i) => (
                    <tr key={batch.id} style={{ animationDelay: `${i * 0.03}s` }}>
                      <td className="strong">{batch.batch_name}</td>
                      <td>{batch.course_name && <span className="tag">{batch.course_name}</span>}</td>
                      <td>{batch.strength}</td>
                      <td>{batch.mentor_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {batches.length === 0 && <div className="empty-state">No batches yet.</div>}
            </div>
          </ReportSection>

          {/* Export */}
          <div className="card export-card" style={{ animationDelay: "0.15s" }}>
            <div>
              <h2 className="card-title" style={{ margin: "0 0 6px" }}>
                📥 Export Reports
              </h2>
              <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>
                Download the full session log as an Excel workbook.
              </p>
            </div>
            <a
              href="http://127.0.0.1:8000/export-sessions"
              target="_blank"
              rel="noreferrer"
              style={{ textDecoration: "none" }}
            >
              <button className="btn btn-export">📊 Download Session Excel Report</button>
            </a>
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
            background: #3b82f6;
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

          .page-hero-stats {
            position: relative;
            z-index: 1;
            display: flex;
            gap: 12px;
            flex-shrink: 0;
          }

          .page-hero-stat {
            text-align: center;
            padding: 14px 22px;
            border-radius: 14px;
            background: rgba(255, 255, 255, 0.06);
            border: 1px solid rgba(255, 255, 255, 0.1);
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

          :global(.card) {
            background: #ffffff;
            border-radius: 16px;
            padding: 24px 26px;
            box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
            border: 1px solid #eef2f7;
            margin-bottom: 22px;
            animation: fadeSlideUp 0.4s ease both;
          }

          :global(.section-header) {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 16px;
          }

          :global(.card-title) {
            margin: 0;
            font-size: 17px;
            color: #1e293b;
          }

          :global(.count-chip) {
            font-size: 12px;
            font-weight: 700;
            color: #64748b;
            background: #f1f5f9;
            padding: 5px 12px;
            border-radius: 999px;
          }

          :global(.export-card) {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 16px;
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

          .styled-table td.muted {
            color: #94a3b8;
          }

          .styled-table td.strong {
            font-weight: 600;
          }

          .tag {
            display: inline-block;
            background: #dbeafe;
            color: #1d4ed8;
            font-size: 12px;
            font-weight: 600;
            padding: 4px 10px;
            border-radius: 999px;
          }

          .btn-export {
            border: none;
            border-radius: 10px;
            padding: 12px 22px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            background: #16a34a;
            color: white;
            transition: all 0.15s ease;
          }

          .btn-export:hover {
            background: #15803d;
            transform: translateY(-1px);
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
