import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import ProtectedRoute from "../components/ProtectedRoute";
import AnalyticsCard from "../components/AnalyticsCard";

import ZoomAttendanceChart from "../components/ZoomAttendanceChart";
import ZoomChatChart from "../components/ZoomChatChart";
import ZoomPollChart from "../components/ZoomPollChart";

const selectStyle = {
  width: "100%",
  padding: "11px 14px",
  borderRadius: "10px",
  border: "1px solid #e2e8f0",
  fontSize: "14px",
  background: "#f8fafc",
  boxSizing: "border-box",
  outline: "none",
};

const fieldLabelStyle = {
  display: "block",
  fontSize: "12px",
  fontWeight: 700,
  letterSpacing: "0.03em",
  color: "#64748b",
  marginBottom: "6px",
};

function Field({ label, children }) {
  return (
    <div>
      <label style={fieldLabelStyle}>{label}</label>
      {children}
    </div>
  );
}

function InfoChip({ label, value }) {
  return (
    <div className="info-chip">
      <div className="info-chip-label">{label}</div>
      <div className="info-chip-value">{value ?? "—"}</div>
    </div>
  );
}

export default function ZoomAnalytics() {
  const [summary, setSummary] = useState(null);

  const [attendanceTrend, setAttendanceTrend] = useState([]);
  const [chatData, setChatData] = useState([]);
  const [pollData, setPollData] = useState([]);

  const [webinars, setWebinars] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedWebinar, setSelectedWebinar] = useState("");
  const [selectedMentor, setSelectedMentor] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/zoom-summary")
      .then((res) => res.json())
      .then((data) => setSummary(data));

    fetch("http://127.0.0.1:8000/zoom-attendance-trend")
      .then((res) => res.json())
      .then((data) => setAttendanceTrend(data));

    fetch("http://127.0.0.1:8000/zoom-chat-analytics")
      .then((res) => res.json())
      .then((data) => setChatData(data));

    fetch("http://127.0.0.1:8000/zoom-poll-analytics")
      .then((res) => res.json())
      .then((data) => setPollData(data));

    fetch("http://127.0.0.1:8000/webinars")
      .then((res) => res.json())
      .then((data) => setWebinars(data));
  }, []);

  const generateReport = () => {
    if (!selectedWebinar) {
      alert("Please select a webinar");
      return;
    }

    fetch(`http://127.0.0.1:8000/webinar-report/${selectedWebinar}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("Webinar Report:", data);
        setSelectedReport(data);
      })
      .catch((err) => console.error(err));
  };

  if (!summary) {
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
            <div style={{ color: "#64748b", fontSize: "14px" }}>Loading webinar analytics…</div>
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
              <div className="page-hero-eyebrow">Learner Feedback</div>
              <h1 className="page-hero-title">Webinar Analytics Dashboard</h1>
              <p className="page-hero-subtitle">
                Attendance, engagement, and poll performance across live webinars.
              </p>
            </div>
            <div className="page-hero-stat">
              <div className="page-hero-stat-value">{summary.attendance_rate}%</div>
              <div className="page-hero-stat-label">Attendance Rate</div>
            </div>
          </div>

          {/* Webinar Filter */}
          <div className="card">
            <h2 className="card-title">📄 Individual Webinar Report</h2>

            <div className="filter-grid">
              <Field label="📅 Date">
                <select className="styled-input" style={selectStyle} value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}>
                  <option value="">All Dates</option>
                  {[...new Set(webinars.map((item) => item.date))].map((date) => (
                    <option key={date} value={date}>
                      {date}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="👨‍🏫 Mentor">
                <select className="styled-input" style={selectStyle} value={selectedMentor} onChange={(e) => setSelectedMentor(e.target.value)}>
                  <option value="">All Mentors</option>
                  {[...new Set(webinars.map((item) => item.mentor))].map((mentor) => (
                    <option key={mentor} value={mentor}>
                      {mentor}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="🎓 Batch">
                <select className="styled-input" style={selectStyle} value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)}>
                  <option value="">All Batches</option>
                  {[...new Set(webinars.map((item) => item.batch))].map((batch) => (
                    <option key={batch} value={batch}>
                      {batch}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="🎥 Webinar">
                <select className="styled-input" style={selectStyle} value={selectedWebinar} onChange={(e) => setSelectedWebinar(e.target.value)}>
                  <option value="">Select Webinar</option>
                  {webinars
                    .filter((item) => {
                      const dateMatch = selectedDate === "" || item.date === selectedDate;
                      const mentorMatch = selectedMentor === "" || item.mentor === selectedMentor;
                      const batchMatch = selectedBatch === "" || item.batch === selectedBatch;
                      return dateMatch && mentorMatch && batchMatch;
                    })
                    .map((item) => (
                      <option key={item.session_id} value={item.session_id}>
                        {item.title} | {item.mentor} | {item.batch} | {item.date}
                      </option>
                    ))}
                </select>
              </Field>

              <div style={{ alignSelf: "end" }}>
                <button className="btn btn-primary" onClick={generateReport} style={{ width: "100%" }}>
                  Generate Report
                </button>
              </div>
            </div>
          </div>

          {/* Webinar Details */}
          {selectedReport && (
            <div className="card" style={{ marginTop: "24px" }}>
              <h2 className="card-title">📄 Individual Webinar Report</h2>

              <h3 className="subsection-title">Webinar Information</h3>
              <div className="info-grid">
                <InfoChip label="Title" value={selectedReport.title} />
                <InfoChip label="Course" value={selectedReport.course} />
                <InfoChip label="Batch" value={selectedReport.batch} />
                <InfoChip label="Mentor" value={selectedReport.mentor} />
                <InfoChip label="Mentor Email" value={selectedReport.mentor_email} />
                <InfoChip label="Date" value={selectedReport.date} />
                <InfoChip label="Time" value={selectedReport.time} />
                <InfoChip label="Duration" value={`${selectedReport.duration} mins`} />
                <InfoChip label="Platform" value={selectedReport.platform} />
                <InfoChip label="Status" value={selectedReport.status} />
              </div>

              <h3 className="subsection-title">📊 Webinar Performance</h3>
              <div className="kpi-grid">
                <AnalyticsCard title="Registered Learners" value={selectedReport.registered_learners} color="#2563eb" />
                <AnalyticsCard title="Attended Learners" value={selectedReport.attended_learners} color="#16a34a" />
                <AnalyticsCard title="Attendance %" value={`${selectedReport.attendance_rate}%`} color="#0891b2" />
                <AnalyticsCard title="No Shows" value={selectedReport.no_show_learners} color="#dc2626" />
                <AnalyticsCard title="Polls Conducted" value={selectedReport.polls_conducted} color="#9333ea" />
                <AnalyticsCard title="Poll Responses" value={selectedReport.poll_responses} color="#7c3aed" />
                <AnalyticsCard title="Poll Response %" value={`${selectedReport.poll_response_rate}%`} color="#f59e0b" />
                <AnalyticsCard title="Engagement Score" value={selectedReport.engagement_score} color="#ea580c" />
              </div>

              <h3 className="subsection-title">📊 Attendance Summary</h3>
              <div className="info-grid">
                <InfoChip label="Registered Learners" value={selectedReport.registered_learners} />
                <InfoChip label="Attended Learners" value={selectedReport.attended_learners} />
                <InfoChip label="Attendance Rate" value={`${selectedReport.attendance_rate}%`} />
                <InfoChip label="No Shows" value={selectedReport.no_show_learners} />
                <InfoChip label="No Show Rate" value={`${selectedReport.no_show_rate}%`} />
                <InfoChip label="Peak Concurrent Users" value={selectedReport.peak_concurrent_users} />
              </div>

              <h3 className="subsection-title">📊 Poll Analytics</h3>
              <div className="info-grid">
                <InfoChip label="Polls Conducted" value={selectedReport.polls_conducted} />
                <InfoChip label="Poll Responses" value={selectedReport.poll_responses} />
                <InfoChip label="Response Rate" value={`${selectedReport.poll_response_rate}%`} />
                <InfoChip label="Average Rating" value={selectedReport.poll_average_rating} />
                <InfoChip label="Highest Rated Poll" value={selectedReport.highest_rated_poll} />
                <InfoChip label="Engagement Score" value={selectedReport.engagement_score} />
              </div>
            </div>
          )}

          {/* Export */}
          <div className="export-row">
            <button
              className="btn btn-export-pdf"
              onClick={() => {
                if (!selectedWebinar) {
                  alert("Please select a webinar first.");
                  return;
                }

                window.open(`http://127.0.0.1:8000/export-webinar-pdf/${selectedWebinar}`, "_blank");
              }}
            >
              📄 Export PDF
            </button>

            <button className="btn btn-export-excel">📊 Export Excel</button>
          </div>

          {/* Overall Dashboard */}
          <h2 className="section-title">📊 Overall Dashboard</h2>

          <div className="kpi-grid" style={{ marginBottom: "10px" }}>
            <AnalyticsCard title="Total Webinars" value={summary.total_webinars} color="#2563eb" />
            <AnalyticsCard title="Registered Learners" value={summary.registered_learners} color="#16a34a" />
            <AnalyticsCard title="Attended Learners" value={summary.attended_learners} color="#0891b2" />
            <AnalyticsCard title="Attendance Rate" value={`${summary.attendance_rate}%`} color="#9333ea" />
            <AnalyticsCard title="Avg Watch Time" value={`${summary.average_watch_time} mins`} color="#ea580c" />
            <AnalyticsCard title="Engagement Score" value={summary.engagement_score} color="#dc2626" />
            <AnalyticsCard title="Session Rating" value={`⭐ ${summary.session_rating}`} color="#059669" />
            <AnalyticsCard title="Recording Views" value={summary.recording_views} color="#7c3aed" />
          </div>

          <ZoomAttendanceChart data={attendanceTrend} />
          <ZoomChatChart data={chatData} />
          <ZoomPollChart data={pollData} />
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
            background: #8b5cf6;
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

          .card {
            background: #ffffff;
            border-radius: 16px;
            padding: 26px 28px;
            box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
            border: 1px solid #eef2f7;
            animation: fadeSlideUp 0.4s ease both;
          }

          .card-title {
            margin: 0 0 18px;
            font-size: 17px;
            color: #1e293b;
          }

          .subsection-title {
            font-size: 14px;
            color: #475569;
            margin: 26px 0 14px;
            padding-top: 18px;
            border-top: 1px solid #f1f5f9;
          }

          .subsection-title:first-of-type {
            border-top: none;
            padding-top: 0;
            margin-top: 8px;
          }

          .filter-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 16px;
            align-items: end;
          }

          .styled-input:focus {
            border-color: #f59e0b !important;
            background: #ffffff !important;
            box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15);
          }

          .btn {
            border: none;
            border-radius: 10px;
            padding: 11px 20px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s ease;
          }

          .btn-primary {
            background: linear-gradient(120deg, #f59e0b, #fbbf24);
            color: #0f172a;
            box-shadow: 0 6px 16px -6px rgba(245, 158, 11, 0.6);
          }

          .btn-primary:hover {
            transform: translateY(-1px);
            box-shadow: 0 10px 20px -6px rgba(245, 158, 11, 0.7);
          }

          .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 14px;
          }

          :global(.info-chip) {
            background: #f8fafc;
            border: 1px solid #eef2f7;
            border-radius: 10px;
            padding: 12px 14px;
          }

          :global(.info-chip-label) {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.03em;
            color: #94a3b8;
            margin-bottom: 4px;
          }

          :global(.info-chip-value) {
            font-size: 14px;
            font-weight: 600;
            color: #1e293b;
          }

          .kpi-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
            gap: 16px;
          }

          .export-row {
            display: flex;
            justify-content: flex-end;
            gap: 14px;
            margin: 24px 0;
          }

          .btn-export-pdf {
            background: #dc2626;
            color: #fff;
          }

          .btn-export-pdf:hover {
            background: #b91c1c;
            transform: translateY(-1px);
          }

          .btn-export-excel {
            background: #16a34a;
            color: #fff;
          }

          .btn-export-excel:hover {
            background: #15803d;
            transform: translateY(-1px);
          }

          .section-title {
            font-size: 20px;
            color: #1e293b;
            margin: 0 0 16px;
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
