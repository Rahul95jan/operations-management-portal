import { useEffect, useState } from "react";
import ProtectedRoute from "../components/ProtectedRoute";
import Sidebar from "../components/Sidebar";

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
            marginLeft: "300px",
            padding: "30px",
            background: "#f8fafc",
            minHeight: "100vh",
          }}
        >
          <h1>📄 Reports Center</h1>

          {/* Session Report */}

          <div style={cardStyle}>
            <h2>📅 Session Report</h2>

            <table border="1" cellPadding="10" width="100%">
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
                {sessions.map((session) => (
                  <tr key={session.id}>
                    <td>{session.id}</td>
                    <td>{session.topic}</td>
                    <td>{session.mentor_name}</td>
                    <td>{session.batch_name}</td>
                    <td>{session.session_date}</td>
                    <td>{session.session_time}</td>
                    <td>{session.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mentor Report */}

          <div style={cardStyle}>
            <h2>👨‍🏫 Mentor Report</h2>

            <table border="1" cellPadding="10" width="100%">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Expertise</th>
                  <th>Hourly Rate</th>
                </tr>
              </thead>

              <tbody>
                {mentors.map((mentor) => (
                  <tr key={mentor.id}>
                    <td>{mentor.name}</td>
                    <td>{mentor.email}</td>
                    <td>{mentor.expertise}</td>
                    <td>₹{mentor.hourly_rate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Batch Report */}

          <div style={cardStyle}>
            <h2>🎓 Batch Report</h2>

            <table border="1" cellPadding="10" width="100%">
              <thead>
                <tr>
                  <th>Batch</th>
                  <th>Course</th>
                  <th>Strength</th>
                  <th>Mentor</th>
                </tr>
              </thead>

              <tbody>
                {batches.map((batch) => (
                  <tr key={batch.id}>
                    <td>{batch.batch_name}</td>
                    <td>{batch.course_name}</td>
                    <td>{batch.strength}</td>
                    <td>{batch.mentor_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Export */}

          <div style={cardStyle}>
            <h2>📥 Export Reports</h2>

            <a
              href="http://127.0.0.1:8000/export-sessions"
              target="_blank"
            >
              Download Session Excel Report
            </a>
          </div>
        </div>
      </>
    </ProtectedRoute>
  );
}

const cardStyle = {
  background: "white",
  padding: "25px",
  marginBottom: "25px",
  borderRadius: "12px",
  boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
};