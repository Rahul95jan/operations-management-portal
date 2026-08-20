function segmentOf(score) {
  if (score >= 9) return { label: "Promoter", color: "#16a34a" };
  if (score >= 7) return { label: "Passive", color: "#f59e0b" };
  return { label: "Detractor", color: "#dc2626" };
}

export default function NPSResponseTable({ data }) {
  return (
    <div
      style={{
        background: "#fff",
        padding: "20px",
        borderRadius: "12px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        marginBottom: "40px",
        overflowX: "auto",
      }}
    >
      <h2 style={{ marginBottom: "16px" }}>📋 NPS Responses</h2>

      <table
        border="1"
        cellPadding="10"
        style={{ width: "100%", borderCollapse: "collapse", minWidth: "1100px" }}
      >
        <thead>
          <tr>
            <th>Learner</th>
            <th>Email</th>
            <th>Mobile</th>
            <th>Course</th>
            <th>Batch</th>
            <th>Mentor</th>
            <th>Instructor</th>
            <th>Doubt</th>
            <th>Website</th>
            <th>NPS Score</th>
            <th>Segment</th>
            <th>Feedback</th>
            <th>Submitted</th>
          </tr>
        </thead>

        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan="13" style={{ textAlign: "center" }}>
                No responses yet
              </td>
            </tr>
          ) : (
            data.map((item) => {
              const segment = segmentOf(item.nps_score);

              return (
                <tr key={item.id}>
                  <td>{item.learner_name}</td>
                  <td>{item.learner_email}</td>
                  <td>{item.mobile_number}</td>
                  <td>{item.course_name}</td>
                  <td>{item.batch_name}</td>
                  <td>{item.mentor_name}</td>
                  <td>{item.instructor_rating}</td>
                  <td>{item.doubt_rating}</td>
                  <td>{item.website_rating}</td>
                  <td>{item.nps_score}</td>
                  <td>
                    <span
                      style={{
                        background: segment.color,
                        color: "#fff",
                        padding: "4px 10px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: "bold",
                      }}
                    >
                      {segment.label}
                    </span>
                  </td>
                  <td>{item.feedback}</td>
                  <td>
                    {item.created_at
                      ? new Date(item.created_at).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
