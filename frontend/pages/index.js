import { useEffect, useState } from "react";
import ProtectedRoute from "../components/ProtectedRoute";
import Sidebar from "../components/Sidebar";
import Link from "next/link";

function useClock() {
  const [now, setNow] = useState(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(id);
  }, []);

  return now;
}

function greeting(now) {
  if (!now) return "Welcome back";
  const hour = now.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function Home() {
  const now = useClock();

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
          {/* Hero */}
          <div className="hero">
            <div className="hero-blob hero-blob-1" />
            <div className="hero-blob hero-blob-2" />
            <div className="hero-grid" />

            <div className="hero-content">
              <div className="hero-eyebrow">
                {greeting(now)} · Krish Naik Academy
              </div>
              <h1 className="hero-title">
                Operations Management <span>Portal</span>
              </h1>
              <p className="hero-subtitle">
                One workspace for sessions, mentors, batches, invoices, learner
                feedback, and resource compliance — kept in sync, all in one
                place.
              </p>
            </div>

            <div className="hero-clock">
              <div className="hero-clock-time">
                {now
                  ? now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  : "--:--"}
              </div>
              <div className="hero-clock-date">
                {now
                  ? now.toLocaleDateString([], {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })
                  : ""}
              </div>
            </div>
          </div>

          {/* Quick Navigation */}
          <h2 className="section-heading">Quick Navigation</h2>

          <QuickNavGroup label="Operations" delay={0}>
            <QuickCard icon="👨‍🏫" title="Mentors" link="/mentors" accent="#3b82f6" />
            <QuickCard icon="📅" title="Sessions" link="/sessions" accent="#3b82f6" />
            <QuickCard icon="🎓" title="Batches" link="/batches" accent="#3b82f6" />
            <QuickCard icon="📈" title="Analytics" link="/analytics" accent="#3b82f6" />
            <QuickCard icon="💰" title="Invoices" link="/invoice-generator" accent="#3b82f6" />
            <QuickCard icon="⚙️" title="Settings" link="/settings" accent="#3b82f6" />
          </QuickNavGroup>

          <QuickNavGroup label="Learner Feedback" delay={1}>
            <QuickCard icon="📝" title="NPS Form" link="/nps" accent="#8b5cf6" />
            <QuickCard icon="📊" title="NPS Analytics" link="/nps/analytics" accent="#8b5cf6" />
            <QuickCard icon="📹" title="Zoom Analytics" link="/zoom-analytics" accent="#8b5cf6" />
          </QuickNavGroup>

          <QuickNavGroup label="Resource Portal" delay={2}>
            <QuickCard icon="📦" title="Resource Portal" link="/resources" accent="#f59e0b" />
            <QuickCard icon="📋" title="Resource Tracking" link="/resources/tracking" accent="#f59e0b" />
            <QuickCard icon="⏳" title="Pending Resources" link="/resources/pending" accent="#f59e0b" />
            <QuickCard icon="📈" title="Resource Analytics" link="/resource-analytics" accent="#f59e0b" />
            <QuickCard icon="👨‍🏫" title="Mentor Performance" link="/resource-analytics/mentors" accent="#f59e0b" />
          </QuickNavGroup>

          {/* Info panels */}
          <div className="info-grid">
            <InfoPanel icon="📌" title="Recent Activities" accent="#3b82f6">
              <li>New mentor added</li>
              <li>Session scheduled</li>
              <li>Batch created</li>
              <li>Invoice generated</li>
            </InfoPanel>

            <InfoPanel icon="🔔" title="Notifications" accent="#f59e0b">
              <li>3 invoices pending</li>
              <li>2 sessions pending attendance</li>
              <li>1 mentor payout pending</li>
            </InfoPanel>

            <InfoPanel icon="📅" title="Upcoming Tasks" accent="#22c55e">
              <li>Upload attendance reports</li>
              <li>Generate mentor invoices</li>
              <li>Review learner feedback</li>
            </InfoPanel>
          </div>
        </div>

        <style jsx>{`
          .hero {
            position: relative;
            overflow: hidden;
            border-radius: 20px;
            padding: 40px 40px;
            margin-bottom: 36px;
            background: linear-gradient(120deg, #0f172a 0%, #1e293b 55%, #0f172a 100%);
            background-size: 200% 200%;
            animation: heroShift 12s ease infinite;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 24px;
            box-shadow: 0 20px 40px -20px rgba(15, 23, 42, 0.6);
          }

          .hero-grid {
            position: absolute;
            inset: 0;
            background-image: linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
            background-size: 32px 32px;
            mask-image: radial-gradient(ellipse at top left, black, transparent 70%);
          }

          .hero-blob {
            position: absolute;
            border-radius: 50%;
            filter: blur(50px);
            opacity: 0.35;
            animation: float 9s ease-in-out infinite;
          }

          .hero-blob-1 {
            width: 260px;
            height: 260px;
            background: #f59e0b;
            top: -80px;
            right: 120px;
          }

          .hero-blob-2 {
            width: 200px;
            height: 200px;
            background: #3b82f6;
            bottom: -90px;
            right: -40px;
            animation-delay: 2s;
          }

          .hero-content {
            position: relative;
            z-index: 1;
            max-width: 640px;
          }

          .hero-eyebrow {
            display: inline-block;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: #fbbf24;
            background: rgba(251, 191, 36, 0.12);
            border: 1px solid rgba(251, 191, 36, 0.3);
            padding: 6px 12px;
            border-radius: 999px;
            margin-bottom: 16px;
          }

          .hero-title {
            font-size: 34px;
            line-height: 1.2;
            font-weight: 800;
            color: #f8fafc;
            margin: 0 0 12px;
          }

          .hero-title span {
            background: linear-gradient(90deg, #fbbf24, #f59e0b);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
          }

          .hero-subtitle {
            color: #94a3b8;
            font-size: 15px;
            line-height: 1.6;
            margin: 0;
          }

          .hero-clock {
            position: relative;
            z-index: 1;
            text-align: right;
            flex-shrink: 0;
            padding: 18px 26px;
            border-radius: 14px;
            background: rgba(255, 255, 255, 0.06);
            border: 1px solid rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(6px);
          }

          .hero-clock-time {
            font-size: 28px;
            font-weight: 700;
            color: #f8fafc;
            font-variant-numeric: tabular-nums;
          }

          .hero-clock-date {
            font-size: 13px;
            color: #94a3b8;
            margin-top: 4px;
          }

          .section-heading {
            font-size: 20px;
            color: #1e293b;
            margin: 0 0 18px;
          }

          .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
            margin-top: 8px;
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
              transform: translateY(20px);
            }
          }

          @keyframes fadeSlideUp {
            from {
              opacity: 0;
              transform: translateY(10px);
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

function QuickNavGroup({ label, children, delay = 0 }) {
  return (
    <div style={{ marginBottom: "32px" }}>
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
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "16px",
        }}
      >
        {Array.isArray(children)
          ? children.map((child, i) => (
              <div
                key={i}
                style={{
                  animation: "fadeSlideUp 0.4s ease both",
                  animationDelay: `${delay * 0.05 + i * 0.05}s`,
                }}
              >
                {child}
              </div>
            ))
          : children}
      </div>
    </div>
  );
}

function QuickCard({ title, link, icon, accent = "#3b82f6" }) {
  const [hover, setHover] = useState(false);

  return (
    <Link href={link} style={{ textDecoration: "none", color: "inherit" }}>
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          background: "#ffffff",
          padding: "20px 16px",
          borderRadius: "14px",
          cursor: "pointer",
          textAlign: "center",
          border: `1px solid ${hover ? accent : "#e2e8f0"}`,
          boxShadow: hover
            ? `0 12px 24px -12px ${accent}88`
            : "0 1px 3px rgba(15, 23, 42, 0.06)",
          transform: hover ? "translateY(-4px)" : "translateY(0)",
          transition: "all 0.18s ease",
        }}
      >
        {icon && (
          <div
            style={{
              width: "44px",
              height: "44px",
              margin: "0 auto 10px",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              background: `${accent}1a`,
            }}
          >
            {icon}
          </div>
        )}
        <h3 style={{ margin: 0, fontSize: "15px", color: "#1e293b" }}>{title}</h3>
      </div>
    </Link>
  );
}

function InfoPanel({ icon, title, accent, children }) {
  return (
    <div
      style={{
        background: "#ffffff",
        padding: "22px",
        borderRadius: "14px",
        borderLeft: `4px solid ${accent}`,
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.06)",
      }}
    >
      <h2
        style={{
          margin: "0 0 12px",
          fontSize: "16px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          color: "#1e293b",
        }}
      >
        <span>{icon}</span> {title}
      </h2>
      <ul
        style={{
          margin: 0,
          paddingLeft: "18px",
          color: "#475569",
          fontSize: "14px",
          lineHeight: 1.9,
        }}
      >
        {children}
      </ul>
    </div>
  );
}
