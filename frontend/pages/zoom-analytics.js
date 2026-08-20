import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import ProtectedRoute from "../components/ProtectedRoute";
import AnalyticsCard from "../components/AnalyticsCard";

import ZoomAttendanceChart from "../components/ZoomAttendanceChart";
import ZoomChatChart from "../components/ZoomChatChart";
import ZoomPollChart from "../components/ZoomPollChart";

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
    return <h2>Loading...</h2>;
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
            📹 Webinar Analytics Dashboard
          </h1>

          {/* Webinar Filter */}

          <div
            style={{
              background: "#fff",
              padding: "25px",
              borderRadius: "12px",
              marginBottom: "30px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            }}
          >
            <h2>📄 Individual Webinar Report</h2>

<div
  style={{
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 1fr 2fr 1fr",
    gap: "20px",
    marginTop: "20px",
    alignItems: "end",
  }}
>
 {/* Date Filter */}

<div>
  <label
    style={{
      display: "block",
      marginBottom: "8px",
      fontWeight: "600",
    }}
  >
    📅 Date
  </label>

  <select
    value={selectedDate}
    onChange={(e) => setSelectedDate(e.target.value)}
    style={{
      width: "100%",
      padding: "12px",
      borderRadius: "8px",
    }}
  >
    <option value="">All Dates</option>

    {[...new Set(webinars.map((item) => item.date))].map((date) => (
      <option key={date} value={date}>
        {date}
      </option>
    ))}
  </select>
</div>

{/* Mentor Filter */}

<div>
  <label
    style={{
      display: "block",
      marginBottom: "8px",
      fontWeight: "600",
    }}
  >
    👨‍🏫 Mentor
  </label>

  <select
    value={selectedMentor}
    onChange={(e) => setSelectedMentor(e.target.value)}
    style={{
      width: "100%",
      padding: "12px",
      borderRadius: "8px",
    }}
  >
    <option value="">All Mentors</option>

    {[...new Set(webinars.map((item) => item.mentor))].map((mentor) => (
      <option key={mentor} value={mentor}>
        {mentor}
      </option>
    ))}
  </select>
</div>

{/* Batch Filter */}

<div>
  <label
    style={{
      display: "block",
      marginBottom: "8px",
      fontWeight: "600",
    }}
  >
    🎓 Batch
  </label>

  <select
    value={selectedBatch}
    onChange={(e) => setSelectedBatch(e.target.value)}
    style={{
      width: "100%",
      padding: "12px",
      borderRadius: "8px",
    }}
  >
    <option value="">All Batches</option>

    {[...new Set(webinars.map((item) => item.batch))].map((batch) => (
      <option key={batch} value={batch}>
        {batch}
      </option>
    ))}
  </select>
</div>

{/* Webinar Filter */}

<div>
  <label
    style={{
      display: "block",
      marginBottom: "8px",
      fontWeight: "600",
    }}
  >
    🎥 Webinar
  </label>

  <select
    value={selectedWebinar}
    onChange={(e) => setSelectedWebinar(e.target.value)}
    style={{
      width: "100%",
      padding: "12px",
      borderRadius: "8px",
      border: "1px solid #d1d5db",
    }}
  >
    <option value="">Select Webinar</option>

    {webinars
      .filter((item) => {
        const dateMatch =
          selectedDate === "" || item.date === selectedDate;

        const mentorMatch =
          selectedMentor === "" || item.mentor === selectedMentor;

        const batchMatch =
          selectedBatch === "" || item.batch === selectedBatch;

        return (
          dateMatch &&
          mentorMatch &&
          batchMatch
        );
      })
      .map((item) => (
        <option
          key={item.session_id}
          value={item.session_id}
        >
          {item.title} | {item.mentor} | {item.batch} | {item.date}
        </option>
      ))}
  </select>
</div>

  {/* Generate Button */}

  <button
    onClick={generateReport}
    style={{
      background: "#2563eb",
      color: "#fff",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      padding: "12px",
      fontWeight: "600",
    }}
  >
    Generate Report
  </button>
</div>
          </div>

          {/* Webinar Details */}

{selectedReport && (
  <div
    style={{
      background: "#fff",
      padding: "25px",
      borderRadius: "12px",
      marginBottom: "30px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    }}
  >
    <h2
      style={{
        marginBottom: "25px",
      }}
    >
      📄 Individual Webinar Report
    </h2>

    {/* ========================= */}
    {/* Webinar Information */}
    {/* ========================= */}

    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3,1fr)",
        gap: "20px",
        marginBottom: "30px",
      }}
    >
      <div>
        <strong>Title</strong>
        <br />
        {selectedReport.title}
      </div>

      <div>
        <strong>Course</strong>
        <br />
        {selectedReport.course}
      </div>

      <div>
        <strong>Batch</strong>
        <br />
        {selectedReport.batch}
      </div>

      <div>
        <strong>Mentor</strong>
        <br />
        {selectedReport.mentor}
      </div>

      <div>
        <strong>Mentor Email</strong>
        <br />
        {selectedReport.mentor_email}
      </div>

      <div>
        <strong>Date</strong>
        <br />
        {selectedReport.date}
      </div>

      <div>
        <strong>Time</strong>
        <br />
        {selectedReport.time}
      </div>

      <div>
        <strong>Duration</strong>
        <br />
        {selectedReport.duration} mins
      </div>

      <div>
        <strong>Platform</strong>
        <br />
        {selectedReport.platform}
      </div>

      <div>
        <strong>Status</strong>
        <br />
        {selectedReport.status}
      </div>
    </div>

    <hr style={{ margin: "30px 0" }} />

{/* ========================= */}
{/* Webinar Performance */}
{/* ========================= */}

<h3
  style={{
    marginBottom: "20px",
  }}
>
  📊 Webinar Performance
</h3>

<div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(4,1fr)",
    gap: "20px",
    marginBottom: "30px",
  }}
>
  <AnalyticsCard
    title="Registered Learners"
    value={selectedReport.registered_learners}
    color="#2563eb"
  />

  <AnalyticsCard
    title="Attended Learners"
    value={selectedReport.attended_learners}
    color="#16a34a"
  />

  <AnalyticsCard
    title="Attendance %"
    value={`${selectedReport.attendance_rate}%`}
    color="#0891b2"
  />

  <AnalyticsCard
    title="No Shows"
    value={selectedReport.no_show_learners}
    color="#dc2626"
  />

  <AnalyticsCard
    title="Polls Conducted"
    value={selectedReport.polls_conducted}
    color="#9333ea"
  />

  <AnalyticsCard
    title="Poll Responses"
    value={selectedReport.poll_responses}
    color="#7c3aed"
  />

  <AnalyticsCard
    title="Poll Response %"
    value={`${selectedReport.poll_response_rate}%`}
    color="#f59e0b"
  />

  <AnalyticsCard
    title="Engagement Score"
    value={selectedReport.engagement_score}
    color="#ea580c"
  />
</div>

<hr style={{ margin: "30px 0" }} />

{/* ========================= */}
{/* Attendance Summary */}
{/* ========================= */}

<h3 style={{ marginBottom: "15px" }}>
  📊 Attendance Summary
</h3>

<table
  style={{
    width: "100%",
    borderCollapse: "collapse",
    marginBottom: "30px",
  }}
>
  <tbody>
    <tr>
      <td><strong>Registered Learners</strong></td>
      <td>{selectedReport.registered_learners}</td>

      <td><strong>Attended Learners</strong></td>
      <td>{selectedReport.attended_learners}</td>
    </tr>

    <tr>
      <td><strong>Attendance Rate</strong></td>
      <td>{selectedReport.attendance_rate}%</td>

      <td><strong>No Shows</strong></td>
      <td>{selectedReport.no_show_learners}</td>
    </tr>

    <tr>
      <td><strong>No Show Rate</strong></td>
      <td>{selectedReport.no_show_rate}%</td>

      <td><strong>Peak Concurrent Users</strong></td>
      <td>{selectedReport.peak_concurrent_users}</td>
    </tr>
  </tbody>
</table>

<hr style={{ margin: "30px 0" }} />

{/* ========================= */}
{/* Poll Analytics */}
{/* ========================= */}

<h3 style={{ marginBottom: "15px" }}>
  📊 Poll Analytics
</h3>

<table
  style={{
    width: "100%",
    borderCollapse: "collapse",
    marginBottom: "30px",
  }}
>
  <tbody>
    <tr>
      <td><strong>Polls Conducted</strong></td>
      <td>{selectedReport.polls_conducted}</td>

      <td><strong>Poll Responses</strong></td>
      <td>{selectedReport.poll_responses}</td>
    </tr>

    <tr>
      <td><strong>Response Rate</strong></td>
      <td>{selectedReport.poll_response_rate}%</td>

      <td><strong>Average Rating</strong></td>
      <td>{selectedReport.poll_average_rating}</td>
    </tr>

    <tr>
      <td><strong>Highest Rated Poll</strong></td>
      <td>{selectedReport.highest_rated_poll}</td>

      <td><strong>Engagement Score</strong></td>
      <td>{selectedReport.engagement_score}</td>
    </tr>
  </tbody>
</table>

</div>
)}

📄 Export PDF

<div
  style={{
    display: "flex",
    justifyContent: "flex-end",
    gap: "15px",
    marginBottom: "25px",
  }}
>
  <button
    onClick={() => {
      if (!selectedWebinar) {
        alert("Please select a webinar first.");
        return;
      }

      window.open(
        `http://127.0.0.1:8000/export-webinar-pdf/${selectedWebinar}`,
        "_blank"
      );
    }}
    style={{
      background: "#dc2626",
      color: "#fff",
      padding: "12px 20px",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      fontWeight: "600",
    }}
  >
    📄 Export PDF
  </button>

  <button
    style={{
      background: "#16a34a",
      color: "#fff",
      padding: "12px 20px",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      fontWeight: "600",
    }}
  >
    📊 Export Excel
  </button>
</div>
          {/* Overall Dashboard */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: "20px",
              marginBottom: "40px",
            }}
          >
            <AnalyticsCard
              title="Total Webinars"
              value={summary.total_webinars}
              color="#2563eb"
            />

            <AnalyticsCard
              title="Registered Learners"
              value={summary.registered_learners}
              color="#16a34a"
            />

            <AnalyticsCard
              title="Attended Learners"
              value={summary.attended_learners}
              color="#0891b2"
            />

            <AnalyticsCard
              title="Attendance Rate"
              value={`${summary.attendance_rate}%`}
              color="#9333ea"
            />

            <AnalyticsCard
              title="Avg Watch Time"
              value={`${summary.average_watch_time} mins`}
              color="#ea580c"
            />

            <AnalyticsCard
              title="Engagement Score"
              value={summary.engagement_score}
              color="#dc2626"
            />

            <AnalyticsCard
              title="Session Rating"
              value={`⭐ ${summary.session_rating}`}
              color="#059669"
            />

            <AnalyticsCard
              title="Recording Views"
              value={summary.recording_views}
              color="#7c3aed"
            />
          </div>

          <ZoomAttendanceChart data={attendanceTrend} />

          <ZoomChatChart data={chatData} />

          <ZoomPollChart data={pollData} />
        </div>
      </>
    </ProtectedRoute>
  );
}