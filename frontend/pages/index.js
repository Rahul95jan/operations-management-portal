import ProtectedRoute from "../components/ProtectedRoute";
import Sidebar from "../components/Sidebar";
import Link from "next/link";

export default function Home() {
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
              marginBottom: "10px",
            }}
          >
            Welcome to Operations Management Portal
          </h1>

          <p
            style={{
              color: "#64748b",
              marginBottom: "30px",
            }}
          >
            The intelligent platform for modern operations management.
          </p>

          {/* Quick Navigation */}

          <h2>Quick Navigation</h2>

          <QuickNavGroup label="Operations">
            <QuickCard icon="👨‍🏫" title="Mentors" link="/mentors" />
            <QuickCard icon="📅" title="Sessions" link="/sessions" />
            <QuickCard icon="🎓" title="Batches" link="/batches" />
            <QuickCard icon="📈" title="Analytics" link="/analytics" />
            <QuickCard icon="📑" title="Reports" link="/reports" />
            <QuickCard icon="💰" title="Invoices" link="/invoice-generator" />
            <QuickCard icon="⚙️" title="Settings" link="/settings" />
          </QuickNavGroup>

          <QuickNavGroup label="Learner Feedback">
            <QuickCard icon="📝" title="NPS Form" link="/nps" />
            <QuickCard icon="📊" title="NPS Analytics" link="/nps/analytics" />
            <QuickCard icon="📹" title="Zoom Analytics" link="/zoom-analytics" />
          </QuickNavGroup>

          <QuickNavGroup label="Resource Portal">
            <QuickCard icon="📦" title="Resource Portal" link="/resources" />
            <QuickCard icon="📋" title="Resource Tracking" link="/resources/tracking" />
            <QuickCard icon="⏳" title="Pending Resources" link="/resources/pending" />
            <QuickCard icon="📈" title="Resource Analytics" link="/resource-analytics" />
            <QuickCard icon="👨‍🏫" title="Mentor Performance" link="/resource-analytics/mentors" />
          </QuickNavGroup>

          {/* Recent Activities */}

          <div style={sectionStyle}>
            <h2>📌 Recent Activities</h2>

            <ul>
              <li>New mentor added</li>
              <li>Session scheduled</li>
              <li>Batch created</li>
              <li>Invoice generated</li>
            </ul>
          </div>

          {/* Notifications */}

          <div style={sectionStyle}>
            <h2>🔔 Notifications</h2>

            <ul>
              <li>3 invoices pending</li>
              <li>2 sessions pending attendance</li>
              <li>1 mentor payout pending</li>
            </ul>
          </div>

          {/* Upcoming Work */}

          <div style={sectionStyle}>
            <h2>📅 Upcoming Tasks</h2>

            <ul>
              <li>Upload attendance reports</li>
              <li>Generate mentor invoices</li>
              <li>Review learner feedback</li>
            </ul>
          </div>
        </div>
      </>
    </ProtectedRoute>
  );
}

function QuickNavGroup({ label, children }) {
  return (
    <div style={{ marginBottom: "30px" }}>
      <h4
        style={{
          fontSize: "12px",
          fontWeight: 700,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "#94a3b8",
          marginBottom: "12px",
        }}
      >
        {label}
      </h4>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: "20px",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function QuickCard({ title, link, icon }) {
  return (
    <Link href={link} style={{ textDecoration: "none", color: "inherit" }}>
      <div
        style={{
          background: "#ffffff",
          padding: "20px",
          borderRadius: "12px",
          cursor: "pointer",
          textAlign: "center",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        {icon && <div style={{ fontSize: "22px", marginBottom: "6px" }}>{icon}</div>}
        <h3 style={{ margin: 0, fontSize: "16px" }}>{title}</h3>
      </div>
    </Link>
  );
}

const sectionStyle = {
  background: "#ffffff",
  padding: "20px",
  borderRadius: "12px",
  marginBottom: "30px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
};