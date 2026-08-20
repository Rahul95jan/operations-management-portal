import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";

export default function Sidebar() {
  const router = useRouter();

  const [resourcesOpen, setResourcesOpen] = useState(
    router.pathname === "/resources" ||
      router.pathname.startsWith("/resources/") ||
      router.pathname.startsWith("/resource-analytics")
  );

  const logout = () => {
    localStorage.removeItem("loggedIn");
    router.push("/login");
  };

  return (
    <div
      style={{
        width: "280px",
        height: "100vh",
        background: "#0f172a",
        color: "white",
        padding: "20px",
        position: "fixed",
        left: 0,
        top: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxSizing: "border-box",
      }}
    >
      <div>
        <div
          style={{
            textAlign: "center",
            marginBottom: "30px",
          }}
        >
          <Image
            src="/logo.png"
            alt="Krish Naik Academy"
            width={180}
            height={70}
            loading="eager"
            style={{
              borderRadius: "10px",
            }}
          />

          <h3
            style={{
              marginTop: "10px",
              color: "#f8fafc",
              fontSize: "16px",
            }}
          >
            Operations Portal
          </h3>
        </div>

        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
          }}
        >
          <li style={menuStyle}>
            <Link href="/" style={linkStyle}>🏠 Home</Link>
          </li>

          <li style={menuStyle}>
            <Link href="/sessions" style={linkStyle}>📅 Sessions</Link>
          </li>

          <li style={menuStyle}>
            <Link href="/mentors" style={linkStyle}>👨‍🏫 Mentors</Link>
          </li>

          <li style={menuStyle}>
            <Link href="/batches" style={linkStyle}>🎓 Batches</Link>
          </li>

          <li style={menuStyle}>
            <Link href="/analytics" style={linkStyle}>📈 Analytics</Link>
          </li>

          <li style={menuStyle}>
            <Link href="/reports" style={linkStyle}>📑 Reports</Link>
          </li>

          <li style={menuStyle}>
            <Link href="/invoice-generator" style={linkStyle}>
              💰 Invoice Generator
            </Link>
          </li>

          <li style={menuStyle}>
            <Link href="/nps" style={linkStyle}>📝 NPS Form</Link>
          </li>

          <li style={menuStyle}>
            <Link href="/nps/analytics" style={linkStyle}>📊 NPS Analytics</Link>
          </li>

          <li style={menuStyle}>
            <Link href="/zoom-analytics" style={linkStyle}>📹 Zoom Analytics</Link>
          </li>

          <li style={menuStyle}>
            <div
              onClick={() => setResourcesOpen((prev) => !prev)}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
            >
              <Link href="/resources" style={{ ...linkStyle, flex: 1 }}>
                📦 Resource Portal
              </Link>
              <span
                style={{
                  fontSize: "12px",
                  color: "#94a3b8",
                  transform: resourcesOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.15s ease",
                  marginLeft: "8px",
                }}
              >
                ▾
              </span>
            </div>

            {resourcesOpen && (
              <ul style={{ listStyle: "none", padding: 0, margin: "10px 0 0 14px", borderLeft: "2px solid #1e293b" }}>
                <li style={subMenuStyle}>
                  <Link href="/resources/tracking" style={subLinkStyle}>📋 Resource Tracking</Link>
                </li>

                <li style={subMenuStyle}>
                  <Link href="/resources/pending" style={subLinkStyle}>⏳ Pending Resources</Link>
                </li>

                <li style={subMenuStyle}>
                  <Link href="/resource-analytics" style={subLinkStyle}>📈 Resource Analytics</Link>
                </li>

                <li style={{ ...subMenuStyle, marginBottom: 0 }}>
                  <Link href="/resource-analytics/mentors" style={subLinkStyle}>👨‍🏫 Mentor Performance</Link>
                </li>
              </ul>
            )}
          </li>

          <li style={menuStyle}>
            <Link href="/settings" style={linkStyle}>⚙️ Settings</Link>
          </li>
        </ul>
      </div>

      <div>
        <button
          onClick={logout}
          style={{
            width: "100%",
            padding: "12px",
            background: "#dc2626",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "16px",
            marginBottom: "20px",
          }}
        >
          🚪 Logout
        </button>
      </div>
    </div>
  );
}

const menuStyle = {
  marginBottom: "18px",
};

const linkStyle = {
  color: "white",
  textDecoration: "none",
  fontSize: "18px",
  display: "block",
};

const subMenuStyle = {
  marginBottom: "14px",
  paddingLeft: "12px",
};

const subLinkStyle = {
  ...linkStyle,
  fontSize: "15px",
  color: "#cbd5e1",
};