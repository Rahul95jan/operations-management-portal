import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function ZoomAttendanceChart({ data }) {
  return (
    <div
      style={{
        background: "#ffffff",
        padding: "20px",
        borderRadius: "12px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        marginTop: "40px",
      }}
    >
      <h2 style={{ marginBottom: "20px" }}>
        📈 Zoom Attendance Trend
      </h2>

      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="meeting" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="attendance" fill="#2563eb" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}