import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function AverageRatingsChart({ instructor, doubt, website }) {
  const data = [
    { category: "Instructor", rating: instructor },
    { category: "Doubt Resolution", rating: doubt },
    { category: "Website / LMS", rating: website },
  ];

  return (
    <div
      style={{
        background: "#fff",
        padding: "20px",
        borderRadius: "12px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        marginBottom: "40px",
      }}
    >
      <h2>⭐ Average Ratings</h2>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="category" />
          <YAxis domain={[0, 5]} />
          <Tooltip />

          <Bar dataKey="rating" fill="#0f172a" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
