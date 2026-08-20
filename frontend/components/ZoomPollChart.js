import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

export default function ZoomPollChart({ data }) {
  // Calculate Summary
  const totalPolls = data.reduce((sum, item) => sum + item.polls, 0);

  const totalResponses = data.reduce(
    (sum, item) => sum + item.responses,
    0
  );

  const avgRating =
    data.length > 0
      ? (
          data.reduce((sum, item) => sum + item.rating, 0) /
          data.length
        ).toFixed(1)
      : 0;

  return (
    <>
      {/* KPI Cards */}

      <div
        style={{
          background: "#fff",
          padding: "25px",
          borderRadius: "12px",
          marginTop: "40px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        }}
      >
        <h2 style={{ marginBottom: "25px" }}>
          📊 Poll Analytics
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: "20px",
            marginBottom: "30px",
          }}
        >
          <div
            style={{
              background: "#eff6ff",
              padding: "20px",
              borderRadius: "10px",
            }}
          >
            <h3>Total Polls</h3>
            <h1>{totalPolls}</h1>
          </div>

          <div
            style={{
              background: "#ecfdf5",
              padding: "20px",
              borderRadius: "10px",
            }}
          >
            <h3>Responses</h3>
            <h1>{totalResponses}</h1>
          </div>

          <div
            style={{
              background: "#fff7ed",
              padding: "20px",
              borderRadius: "10px",
            }}
          >
            <h3>Average Rating</h3>
            <h1>⭐ {avgRating}/5</h1>
          </div>
        </div>

        {/* Chart */}

        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="meeting" />

            <YAxis />

            <Tooltip />

            <Legend />

            <Bar
              dataKey="polls"
              fill="#2563eb"
              name="Polls Conducted"
            />

            <Bar
              dataKey="responses"
              fill="#16a34a"
              name="Responses"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}