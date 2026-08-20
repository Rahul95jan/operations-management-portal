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

  const isActive = (href) => router.pathname === href;
  const resourcesGroupActive =
    router.pathname === "/resources" ||
    router.pathname.startsWith("/resources/") ||
    router.pathname.startsWith("/resource-analytics");

  return (
    <div className="sidebar">
      <div className="sidebar-scroll">
        <div className="brand">
          <div className="brand-logo">
            <Image src="/logo.png" alt="Krish Naik Academy" width={180} height={70} loading="eager" style={{ borderRadius: "10px" }} />
          </div>
          <h3 className="brand-title">Operations Portal</h3>
        </div>

        <ul className="nav-list">
          <NavItem href="/" icon="🏠" label="Home" active={isActive("/")} />

          <NavGroupLabel>Operations</NavGroupLabel>
          <NavItem href="/sessions" icon="📅" label="Sessions" active={isActive("/sessions")} />
          <NavItem href="/mentors" icon="👨‍🏫" label="Mentors" active={isActive("/mentors")} />
          <NavItem href="/batches" icon="🎓" label="Batches" active={isActive("/batches")} />
          <NavItem href="/analytics" icon="📈" label="Analytics" active={isActive("/analytics")} />
          <NavItem href="/reports" icon="📑" label="Reports" active={isActive("/reports")} />
          <NavItem href="/invoice-generator" icon="💰" label="Invoice Generator" active={isActive("/invoice-generator")} />

          <NavGroupLabel>Learner Feedback</NavGroupLabel>
          <NavItem href="/nps" icon="📝" label="NPS Form" active={isActive("/nps")} />
          <NavItem href="/nps/analytics" icon="📊" label="NPS Analytics" active={isActive("/nps/analytics")} />
          <NavItem href="/zoom-analytics" icon="📹" label="Zoom Analytics" active={isActive("/zoom-analytics")} />

          <NavGroupLabel>Resource Portal</NavGroupLabel>
          <li className={`nav-item ${resourcesGroupActive ? "nav-item-parent-active" : ""}`}>
            <div className="nav-parent-row" onClick={() => setResourcesOpen((prev) => !prev)}>
              <Link href="/resources" className="nav-link nav-link-parent">
                <span className="nav-icon">📦</span>
                <span className="nav-label">Resource Portal</span>
              </Link>
              <span className={`nav-chevron ${resourcesOpen ? "nav-chevron-open" : ""}`}>▾</span>
            </div>

            <div className={`nav-submenu ${resourcesOpen ? "nav-submenu-open" : ""}`}>
              <ul className="nav-sublist">
                <SubNavItem href="/resources/tracking" icon="📋" label="Resource Tracking" active={isActive("/resources/tracking")} />
                <SubNavItem href="/resources/pending" icon="⏳" label="Pending Resources" active={isActive("/resources/pending")} />
                <SubNavItem href="/resource-analytics" icon="📈" label="Resource Analytics" active={isActive("/resource-analytics")} />
                <SubNavItem href="/resource-analytics/mentors" icon="👨‍🏫" label="Mentor Performance" active={isActive("/resource-analytics/mentors")} />
              </ul>
            </div>
          </li>

          <NavItem href="/settings" icon="⚙️" label="Settings" active={isActive("/settings")} />
        </ul>
      </div>

      <div className="sidebar-footer">
        <button onClick={logout} className="logout-btn">
          <span>🚪</span> Logout
        </button>
      </div>

      <style jsx>{`
        .sidebar {
          width: 280px;
          height: 100vh;
          background: linear-gradient(180deg, #0f172a 0%, #131c30 100%);
          color: white;
          position: fixed;
          left: 0;
          top: 0;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-sizing: border-box;
          border-right: 1px solid rgba(255, 255, 255, 0.06);
          box-shadow: 4px 0 24px -12px rgba(0, 0, 0, 0.4);
        }

        .sidebar::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #f59e0b, #fbbf24, #f59e0b);
          background-size: 200% 100%;
          animation: shimmer 6s linear infinite;
        }

        .sidebar-scroll {
          overflow-y: auto;
          padding: 22px 16px 12px;
          scrollbar-width: thin;
          scrollbar-color: rgba(251, 191, 36, 0.3) transparent;
        }

        .sidebar-scroll::-webkit-scrollbar {
          width: 6px;
        }

        .sidebar-scroll::-webkit-scrollbar-thumb {
          background: rgba(251, 191, 36, 0.25);
          border-radius: 10px;
        }

        .brand {
          text-align: center;
          margin-bottom: 20px;
          padding-bottom: 18px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .brand-logo {
          display: inline-flex;
          border-radius: 12px;
          padding: 3px;
          background: linear-gradient(120deg, rgba(245, 158, 11, 0.4), rgba(245, 158, 11, 0));
        }

        .brand-title {
          margin: 12px 0 0;
          color: #f8fafc;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.02em;
        }

        .nav-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        :global(.nav-item) {
          margin-bottom: 4px;
        }

        :global(.nav-link) {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #cbd5e1;
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
          padding: 10px 12px;
          border-radius: 10px;
          position: relative;
          transition: background 0.15s ease, color 0.15s ease, transform 0.1s ease;
        }

        :global(.nav-link:hover) {
          background: rgba(255, 255, 255, 0.06);
          color: #f8fafc;
          transform: translateX(2px);
        }

        :global(.nav-link-active) {
          background: linear-gradient(90deg, rgba(245, 158, 11, 0.16), rgba(245, 158, 11, 0.02));
          color: #fbbf24;
        }

        :global(.nav-link-active::before) {
          content: "";
          position: absolute;
          left: -16px;
          top: 50%;
          transform: translateY(-50%);
          width: 4px;
          height: 22px;
          background: #fbbf24;
          border-radius: 0 4px 4px 0;
          box-shadow: 0 0 8px 1px rgba(251, 191, 36, 0.6);
        }

        :global(.nav-icon) {
          font-size: 16px;
          width: 20px;
          text-align: center;
          flex-shrink: 0;
        }

        :global(.nav-label) {
          flex: 1;
          white-space: nowrap;
        }

        :global(.nav-group-label) {
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.09em;
          text-transform: uppercase;
          color: #64748b;
          padding: 16px 12px 6px;
        }

        .nav-parent-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-radius: 10px;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .nav-parent-row:hover {
          background: rgba(255, 255, 255, 0.04);
        }

        :global(.nav-link-parent) {
          flex: 1;
          padding-right: 4px;
        }

        :global(.nav-link-parent:hover) {
          background: none;
          transform: none;
        }

        .nav-item-parent-active :global(.nav-link-parent) {
          color: #fbbf24;
        }

        .nav-chevron {
          font-size: 11px;
          color: #64748b;
          transition: transform 0.2s ease;
          margin-right: 12px;
          flex-shrink: 0;
        }

        .nav-chevron-open {
          transform: rotate(180deg);
          color: #fbbf24;
        }

        .nav-submenu {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.25s ease;
        }

        .nav-submenu-open {
          max-height: 260px;
        }

        .nav-sublist {
          list-style: none;
          padding: 4px 0 2px 14px;
          margin: 6px 0 0;
          border-left: 2px solid rgba(255, 255, 255, 0.08);
        }

        :global(.nav-sublink) {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #94a3b8;
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
          padding: 8px 10px;
          border-radius: 8px;
          margin-bottom: 2px;
          transition: background 0.15s ease, color 0.15s ease;
        }

        :global(.nav-sublink:hover) {
          background: rgba(255, 255, 255, 0.05);
          color: #f1f5f9;
        }

        :global(.nav-sublink-active) {
          color: #fbbf24;
          background: rgba(245, 158, 11, 0.1);
        }

        .sidebar-footer {
          padding: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .logout-btn {
          width: 100%;
          padding: 12px;
          background: linear-gradient(120deg, #dc2626, #b91c1c);
          color: white;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .logout-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 18px -8px rgba(220, 38, 38, 0.6);
        }

        @keyframes shimmer {
          0% {
            background-position: 0% 0%;
          }
          100% {
            background-position: 200% 0%;
          }
        }
      `}</style>
    </div>
  );
}

function NavItem({ href, icon, label, active }) {
  return (
    <li className="nav-item">
      <Link href={href} className={`nav-link ${active ? "nav-link-active" : ""}`}>
        <span className="nav-icon">{icon}</span>
        <span className="nav-label">{label}</span>
      </Link>
    </li>
  );
}

function SubNavItem({ href, icon, label, active }) {
  return (
    <li>
      <Link href={href} className={`nav-sublink ${active ? "nav-sublink-active" : ""}`}>
        <span>{icon}</span> {label}
      </Link>
    </li>
  );
}

function NavGroupLabel({ children }) {
  return <div className="nav-group-label">{children}</div>;
}
