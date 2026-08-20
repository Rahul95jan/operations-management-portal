import PollTrendChart from "../components/PollTrendChart";
import { useEffect, useState } from "react";
import AttendanceChart from "../components/AttendanceChart";
export default function SessionAnalytics() {
  const [summary, setSummary] = useState({
  total_sessions: 0,
  registered: 0,
  joined: 0,
  unique_attendance: 0,
  attendance_percentage: 0,
  mentor_hours: 0,
  student_hours: 0,
  total_duration: 0,
});

  const [search, setSearch] = useState("");
const [mentorFilter, setMentorFilter] = useState("All");
const [batchFilter, setBatchFilter] = useState("All");
  const [analytics, setAnalytics] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
const [pollSummary, setPollSummary] = useState({
  total_polls: 0,
  total_participants: 0,
  average_participation: 0,
  average_accuracy: 0,
});

const [pollTrend, setPollTrend] = useState([]);
const [mentorPerformance, setMentorPerformance] = useState([]);
  const filteredAnalytics = analytics.filter((item) => {
  const matchesSearch =
    item.mentor_name.toLowerCase().includes(search.toLowerCase()) ||
    item.batch_name.toLowerCase().includes(search.toLowerCase());

  const matchesMentor =
    mentorFilter === "All" ||
    item.mentor_name === mentorFilter;

  const matchesBatch =
    batchFilter === "All" ||
    item.batch_name === batchFilter;

  return (
    matchesSearch &&
    matchesMentor &&
    matchesBatch
  );
});

useEffect(() => {
  fetchSummary();
  fetchAnalytics();
  fetchAttendanceTrend();
  fetchPollSummary();
  fetchPollTrend();
  fetchMentorPerformance();
}, []);

const fetchMentorPerformance = async () => {
  try {
    const res = await fetch(
      "http://127.0.0.1:8000/mentor-performance"
    );

    const data = await res.json();

    setMentorPerformance(data);

  } catch (err) {
    console.log(err);
  }
};
const fetchPollTrend = async () => {
  try {
    const res = await fetch(
      "http://127.0.0.1:8000/poll-trend"
    );

    const data = await res.json();

    setPollTrend(data);

  } catch (err) {
    console.log(err);
  }
};
  const fetchSummary = async () => {
    try {
      const res = await fetch(
        "http://127.0.0.1:8000/session-analytics-summary"
      );

      const data = await res.json();

      setSummary(data);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(
        "http://127.0.0.1:8000/session-analytics"
      );

      const data = await res.json();

      setAnalytics(data);
    } catch (err) {
      console.log(err);
    }
  };
  const fetchAttendanceTrend = async () => {
  try {
    const res = await fetch(
      "http://127.0.0.1:8000/attendance-trend"
    );

    const data = await res.json();

    setAttendanceData(data);

  } catch (err) {
    console.log(err);
  }
};

const fetchPollSummary = async () => {
  try {
    const res = await fetch(
      "http://127.0.0.1:8000/poll-summary"
    );

    const data = await res.json();

    console.log("Poll Summary API:", data);

    setPollSummary(data);

  } catch (err) {
    console.log(err);
  }
};
  return (
    <div
      style={{
        padding: "30px",
        background: "#f8fafc",
        minHeight: "100vh",
      }}
    >
      <h1
        style={{
          marginBottom: "30px",
          color: "#1f2937",
        }}
      >
        📊 Session Analytics
      </h1>

      {/* Summary Cards */}

      <div
  style={{
    display: "flex",
    gap: "15px",
    marginBottom: "20px",
    alignItems: "center",
  }}
>
  <input
    type="text"
    placeholder="🔍 Search Mentor or Batch..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    style={{
      width: "300px",
      padding: "10px",
      borderRadius: "8px",
      border: "1px solid #ccc",
    }}
  />

  <select
    value={mentorFilter}
    onChange={(e) => setMentorFilter(e.target.value)}
    style={{
      padding: "10px",
      borderRadius: "8px",
    }}
  >
    <option value="All">All Mentors</option>

    {[...new Set(analytics.map((a) => a.mentor_name))].map((mentor) => (
      <option key={mentor} value={mentor}>
        {mentor}
      </option>
    ))}
  </select>

  <select
    value={batchFilter}
    onChange={(e) => setBatchFilter(e.target.value)}
    style={{
      padding: "10px",
      borderRadius: "8px",
    }}
  >
    <option value="All">All Batches</option>

    {[...new Set(analytics.map((a) => a.batch_name))].map((batch) => (
      <option key={batch} value={batch}>
        {batch}
      </option>
    ))}
  </select>
</div>

      <div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(4,1fr)",
    gap: "20px",
    marginBottom: "30px",
  }}
>
  <div style={cardStyle}>
    <h3>📅 Total Sessions</h3>
    <h1>{summary.total_sessions}</h1>
  </div>

  <div style={cardStyle}>
    <h3>👥 Registered</h3>
    <h1>{summary.registered}</h1>
  </div>

  <div style={cardStyle}>
    <h3>✅ Joined</h3>
    <h1>{summary.joined}</h1>
  </div>

  <div style={cardStyle}>
    <h3>🎯 Unique Attendance</h3>
    <h1>{summary.unique_attendance}</h1>
  </div>

  <div style={cardStyle}>
    <h3>📈 Attendance %</h3>
    <h1>{summary.attendance_percentage}%</h1>
  </div>

  <div style={cardStyle}>
    <h3>👨‍🏫 Mentor Hours</h3>
    <h1>{summary.mentor_hours}</h1>
  </div>

  <div style={cardStyle}>
    <h3>🎓 Student Hours</h3>
    <h1>{summary.student_hours}</h1>
  </div>

  <div style={cardStyle}>
    <h3>⏱ Total Duration</h3>
    <h1>{summary.total_duration} hrs</h1>
  </div>
  {/* Attendance Trend Chart */}

   <AttendanceChart data={attendanceData} />
   <PollTrendChart data={pollTrend} />
   <div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(3,1fr)",
    gap: "20px",
    marginTop: "30px",
    marginBottom: "30px",
  }}
>
  <div style={cardStyle}>
    <h3>📊 Total Polls</h3>
    <h1>{pollSummary.total_polls}</h1>
  </div>

  <div style={cardStyle}>
    <h3>🙋 Poll Participants</h3>
    <h1>{pollSummary.total_participants}</h1>
  </div>

  <div style={cardStyle}>
    <h3>📈 Avg Participation</h3>
    <h1>{pollSummary.average_participation}</h1>
  </div>
  <div style={cardStyle}>
  <h3>🎯 Poll Accuracy</h3>
  <h1>{pollSummary.average_accuracy}%</h1>
</div>
</div>
</div>

{/* Mentor Performance */}

<div
  style={{
    background: "#fff",
    padding: "20px",
    borderRadius: "12px",
    marginTop: "30px",
    marginBottom: "30px",
    boxShadow: "0 4px 12px rgba(0,0,0,.08)",
  }}
>
  <h2>👨‍🏫 Mentor Performance</h2>

  <table style={tableStyle}>
    <thead>
      <tr>
        <th style={thStyle}>Mentor</th>
        <th style={thStyle}>Sessions</th>
        <th style={thStyle}>Avg Attendance</th>
        <th style={thStyle}>Polls</th>
        <th style={thStyle}>Hours</th>
      </tr>
    </thead>

    <tbody>
      {mentorPerformance.map((mentor) => (
        <tr key={mentor.mentor_name}>
          <td style={tdStyle}>{mentor.mentor_name}</td>
          <td style={tdStyle}>{mentor.sessions}</td>
          <td style={tdStyle}>{mentor.attendance}%</td>
          <td style={tdStyle}>{mentor.polls}</td>
          <td style={tdStyle}>{mentor.hours} hrs</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>


      {/* Analytics Table */}

      <div
        style={{
          background: "#fff",
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,.08)",
        }}
      >
        <h2>Session Analytics</h2>

        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Session ID</th>
              <th style={thStyle}>Mentor</th>
              <th style={thStyle}>Batch</th>
              <th style={thStyle}>Attendance %</th>
              <th style={thStyle}>Polls</th>
              <th style={thStyle}>Quizzes</th>
              <th style={thStyle}>Chat</th>
              <th style={thStyle}>Duration</th>
            </tr>
          </thead>

          <tbody>
  {filteredAnalytics.length === 0 ? (
    <tr>
      <td
        colSpan="8"
        style={{
          textAlign: "center",
          padding: "20px",
          color: "#6b7280",
        }}
      >
        No session analytics found.
      </td>
    </tr>
  ) : (
    filteredAnalytics.map((item) => (
      <tr key={item.id}>
        <td style={tdStyle}>{item.session_id}</td>
        <td style={tdStyle}>{item.mentor_name}</td>
        <td style={tdStyle}>{item.batch_name}</td>
        <td style={tdStyle}>{item.attendance_percentage}%</td>
        <td style={tdStyle}>{item.poll_count}</td>
        <td style={tdStyle}>{item.quiz_count}</td>
        <td style={tdStyle}>{item.chat_messages}</td>
        <td style={tdStyle}>{item.actual_duration} hrs</td>
      </tr>
    ))
  )}
</tbody>
        </table>
      </div>
    </div>
  );
}

const cardStyle = {
  background: "#ffffff",
  borderRadius: "12px",
  padding: "25px",
  textAlign: "center",
  boxShadow: "0 4px 12px rgba(0,0,0,.08)",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: "20px",
};

const thStyle = {
  border: "1px solid #ddd",
  padding: "12px",
  background: "#1f2937",
  color: "#fff",
  textAlign: "center",
};

const tdStyle = {
  border: "1px solid #ddd",
  padding: "10px",
  textAlign: "center",
};