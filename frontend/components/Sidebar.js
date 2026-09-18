import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Home,
  Calendar,
  Users,
  GraduationCap,
  BarChart3,
  Receipt,
  ClipboardList,
  PieChart,
  Video,
  FilePlus2,
  Package,
  ListChecks,
  Clock,
  TrendingUp,
  Award,
  Gauge,
  FileBarChart,
  Settings as SettingsIcon,
  LogOut,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  UserCog,
  History,
} from "lucide-react";
import { hasPermission, isSuperAdmin, clearSession } from "../lib/auth";

const API = "http://127.0.0.1:8000";

function initials(name) {
  if (!name) return "?";
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
}

function userPhotoUrl(user) {
  if (!user?.photo_path) return null;
  return `${API}/users/${user.id}/photo?v=${encodeURIComponent(user.photo_path)}`;
}

export default function Sidebar() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    fetch(`${API}/users/me`).then((r) => r.json()).then(setUser).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    let stored = null;
    try {
      stored = localStorage.getItem("omSidebarCollapsed");
    } catch (e) {}
    if (stored === "1") setCollapsed(true);
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--om-sidebar-width", collapsed ? "84px" : "280px");
    try {
      localStorage.setItem("omSidebarCollapsed", collapsed ? "1" : "0");
    } catch (e) {}
  }, [collapsed]);

  const [resourcesOpen, setResourcesOpen] = useState(
    router.pathname === "/resources" ||
      router.pathname.startsWith("/resources/") ||
      router.pathname.startsWith("/resource-analytics")
  );

  const logout = () => {
    clearSession();
    router.push("/login");
  };

  const isActive = (href) => router.pathname === href;
  const resourcesGroupActive =
    router.pathname === "/resources" ||
    router.pathname.startsWith("/resources/") ||
    router.pathname.startsWith("/resource-analytics");

  return (
    <div className={`sidebar ${collapsed ? "sidebar-collapsed" : ""}`}>
      <button
        type="button"
        className="sidebar-collapse-btn"
        onClick={() => setCollapsed((v) => !v)}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight size={13} strokeWidth={2.6} /> : <ChevronLeft size={13} strokeWidth={2.6} />}
      </button>

      <div className="sidebar-scroll">
        <div className="brand">
          <div className="brand-logo">
            <Image src="/logo.png" alt="Krish Naik Academy" width={180} height={70} loading="eager" style={{ borderRadius: "10px" }} />
          </div>
          <div className="brand-tagline">Learn &middot; Build &middot; Grow</div>
          <h3 className="brand-title">Operations Portal</h3>
        </div>

        <ul className="nav-list">
          {!user ? null : (
            <>
              <NavItem href="/" icon={Home} label="Home" active={isActive("/")} />

              {(hasPermission(user, "sessions") || hasPermission(user, "mentors") || hasPermission(user, "batches") || hasPermission(user, "analytics") || hasPermission(user, "invoices")) && (
                <NavGroupLabel>Operations</NavGroupLabel>
              )}
              {hasPermission(user, "sessions") && <NavItem href="/sessions" icon={Calendar} label="Sessions" active={isActive("/sessions")} />}
              {hasPermission(user, "mentors") && <NavItem href="/mentors" icon={Users} label="Mentors" active={isActive("/mentors")} />}
              {hasPermission(user, "batches") && <NavItem href="/batches" icon={GraduationCap} label="Batches" active={isActive("/batches")} />}
              {hasPermission(user, "analytics") && (
                <NavItem
                  href="/session-reports"
                  icon={FileBarChart}
                  label="Session Reports"
                  active={router.pathname === "/session-reports" || router.pathname.startsWith("/session-reports/")}
                />
              )}
              {hasPermission(user, "analytics") && <NavItem href="/analytics" icon={BarChart3} label="Analytics" active={isActive("/analytics")} />}
              {hasPermission(user, "analytics") && <NavItem href="/mentor-performance" icon={Gauge} label="Mentor 360" active={isActive("/mentor-performance")} />}
              {hasPermission(user, "invoices") && <NavItem href="/invoice-generator" icon={Receipt} label="Invoice Generator" active={isActive("/invoice-generator")} />}

              {hasPermission(user, "feedback") && (
                <>
                  <NavGroupLabel>Learner Feedback</NavGroupLabel>
                  <NavItem href="/nps" icon={ClipboardList} label="NPS Form" active={isActive("/nps")} />
                  <NavItem href="/nps/analytics" icon={PieChart} label="NPS Analytics" active={isActive("/nps/analytics")} />
                  <NavItem href="/webinar-analytics" icon={Video} label="Webinar Analytics" active={isActive("/webinar-analytics")} />
                  <NavItem href="/webinar-reports" icon={FilePlus2} label="Log Webinar Report" active={isActive("/webinar-reports")} />
                </>
              )}

              {hasPermission(user, "resources") && (
                <>
                  <NavGroupLabel>Resource Portal</NavGroupLabel>
                  <li className={`nav-item ${resourcesGroupActive ? "nav-item-parent-active" : ""}`}>
                    <div className="nav-parent-row" onClick={() => setResourcesOpen((prev) => !prev)}>
                      <Link href="/resources" className="nav-link nav-link-parent">
                        <span className="nav-icon">
                          <Package size={16} strokeWidth={2} />
                        </span>
                        <span className="nav-label">Resource Portal</span>
                      </Link>
                      <span className={`nav-chevron ${resourcesOpen ? "nav-chevron-open" : ""}`}>
                        <ChevronDown size={14} strokeWidth={2.5} />
                      </span>
                    </div>

                    <div className={`nav-submenu ${resourcesOpen ? "nav-submenu-open" : ""}`}>
                      <ul className="nav-sublist">
                        <SubNavItem href="/resources/tracking" icon={ListChecks} label="Resource Tracking" active={isActive("/resources/tracking")} />
                        <SubNavItem href="/resources/pending" icon={Clock} label="Pending Resources" active={isActive("/resources/pending")} />
                        <SubNavItem href="/resource-analytics" icon={TrendingUp} label="Resource Analytics" active={isActive("/resource-analytics")} />
                        <SubNavItem href="/resource-analytics/mentors" icon={Award} label="Mentor Performance" active={isActive("/resource-analytics/mentors")} />
                      </ul>
                    </div>
                  </li>
                </>
              )}

              {isSuperAdmin(user) && (
                <>
                  <NavGroupLabel>Administration</NavGroupLabel>
                  <NavItem href="/admin/users" icon={UserCog} label="User Management" active={isActive("/admin/users")} />
                  <NavItem href="/admin/activity" icon={History} label="Activity Logs" active={isActive("/admin/activity")} />
                  <NavItem href="/settings" icon={SettingsIcon} label="Settings" active={isActive("/settings")} />
                </>
              )}
            </>
          )}
        </ul>
      </div>

      <div className="sidebar-footer">
        <Link href="/profile" className="profile-row">
          <div className="profile-avatar-wrap">
            {userPhotoUrl(user) ? (
              <img src={userPhotoUrl(user)} alt={user?.name} className="profile-avatar profile-avatar-img" />
            ) : (
              <div className="profile-avatar">{initials(user?.name)}</div>
            )}
            <span className="profile-online-dot" />
          </div>
          <div className="profile-info">
            <div className="profile-name">{user?.name || "—"}</div>
            <div className="profile-role">{user?.role || "No role set"}</div>
          </div>
        </Link>

        <button onClick={logout} className="logout-btn" title="Logout">
          <LogOut size={16} strokeWidth={2.2} /> <span className="logout-label">Logout</span>
        </button>
      </div>

      <style jsx>{`
        .sidebar {
          width: 280px;
          height: 100vh;
          background: linear-gradient(180deg, #0B0F12 0%, #11171C 100%);
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
          transition: width 0.25s ease;
          z-index: 25;
        }

        .sidebar-collapsed {
          width: 84px;
        }

        .sidebar-collapse-btn {
          position: absolute;
          top: 76px;
          right: -13px;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: #171d24;
          border: 1px solid rgba(240, 199, 94, 0.4);
          color: #F0C75E;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 30;
          box-shadow: 0 4px 12px -4px rgba(0, 0, 0, 0.6);
          transition: background 0.15s ease, transform 0.15s ease;
        }

        .sidebar-collapse-btn:hover {
          background: #232b34;
          transform: scale(1.08);
        }

        .sidebar-collapsed .sidebar-scroll {
          padding: 22px 10px 12px;
        }

        .sidebar-collapsed .brand {
          padding: 6px 0 18px;
        }

        .sidebar-collapsed .brand-logo {
          width: 50px;
          height: 52px;
          padding: 0;
          overflow: hidden;
          position: relative;
        }

        .sidebar-collapsed .brand-logo :global(img) {
          position: absolute;
          top: -10px;
          left: -13px;
          width: 200px;
          max-width: none;
          height: auto;
        }

        .sidebar-collapsed .brand-tagline,
        .sidebar-collapsed .brand-title,
        .sidebar-collapsed .profile-info,
        .sidebar-collapsed .logout-label,
        .sidebar-collapsed .nav-chevron {
          display: none;
        }

        .sidebar-collapsed .nav-submenu {
          display: none;
        }

        .sidebar-collapsed .nav-parent-row {
          justify-content: center;
        }

        .sidebar-collapsed .logout-btn {
          padding: 12px 0;
        }

        :global(.sidebar-collapsed .nav-link) {
          justify-content: center;
          padding: 8px;
        }

        :global(.sidebar-collapsed .nav-label),
        :global(.sidebar-collapsed .nav-group-label) {
          display: none;
        }

        :global(.sidebar-collapsed .nav-link-active::before) {
          display: none;
        }

        :global(.sidebar-collapsed .profile-row) {
          justify-content: center;
        }

        .sidebar::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #D4A72C, #F0C75E, #D4A72C);
          background-size: 200% 100%;
          animation: shimmer 6s linear infinite;
        }

        .sidebar-scroll {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          padding: 22px 16px 12px;
          scrollbar-width: thin;
          scrollbar-color: rgba(240, 199, 94, 0.3) transparent;
          -webkit-mask-image: linear-gradient(180deg, transparent 0, #000 14px, #000 calc(100% - 14px), transparent 100%);
          mask-image: linear-gradient(180deg, transparent 0, #000 14px, #000 calc(100% - 14px), transparent 100%);
        }

        .sidebar-scroll::-webkit-scrollbar {
          width: 6px;
        }

        .sidebar-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .sidebar-scroll::-webkit-scrollbar-thumb {
          background: rgba(240, 199, 94, 0.25);
          border-radius: 10px;
        }

        .sidebar-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(240, 199, 94, 0.45);
        }

        .brand {
          text-align: center;
          margin-bottom: 20px;
          padding: 6px 6px 18px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .brand-logo {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 16px;
          padding: 12px 20px;
          background: linear-gradient(150deg, rgba(240, 199, 94, 0.16), rgba(240, 199, 94, 0.02) 60%);
          border: 1px solid rgba(240, 199, 94, 0.32);
          box-shadow: 0 10px 26px -12px rgba(240, 199, 94, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.06);
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }

        .brand-logo:hover {
          transform: translateY(-2px);
          border-color: rgba(240, 199, 94, 0.55);
          box-shadow: 0 14px 30px -10px rgba(240, 199, 94, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08);
        }

        .brand-tagline {
          margin: 10px 0 0;
          color: #F0C75E;
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .brand-title {
          margin: 4px 0 0;
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
          padding: 8px 12px;
          border-radius: 10px;
          position: relative;
          transition: background 0.15s ease, color 0.15s ease, transform 0.1s ease;
        }

        :global(.nav-link:hover) {
          background: rgba(255, 255, 255, 0.06);
          color: #f8fafc;
          transform: translateX(2px);
        }

        :global(.nav-link:hover .nav-icon) {
          background: rgba(255, 255, 255, 0.1);
          color: #f8fafc;
        }

        :global(.nav-link-active) {
          background: linear-gradient(90deg, rgba(212, 167, 44, 0.18), rgba(212, 167, 44, 0.02));
          color: #F0C75E;
        }

        :global(.nav-link-active::before) {
          content: "";
          position: absolute;
          left: -16px;
          top: 50%;
          transform: translateY(-50%);
          width: 4px;
          height: 22px;
          background: #F0C75E;
          border-radius: 0 4px 4px 0;
          box-shadow: 0 0 8px 1px rgba(240, 199, 94, 0.6);
        }

        :global(.nav-link-active .nav-icon) {
          background: rgba(240, 199, 94, 0.16);
          color: #F0C75E;
        }

        :global(.nav-icon) {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          border-radius: 9px;
          background: rgba(255, 255, 255, 0.05);
          color: #94a3b8;
          flex-shrink: 0;
          transition: background 0.15s ease, color 0.15s ease;
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
          color: #F0C75E;
        }

        .nav-item-parent-active :global(.nav-icon) {
          background: rgba(240, 199, 94, 0.16);
          color: #F0C75E;
        }

        .nav-chevron {
          display: flex;
          align-items: center;
          color: #64748b;
          transition: transform 0.2s ease, color 0.2s ease;
          margin-right: 14px;
          flex-shrink: 0;
        }

        .nav-chevron-open {
          transform: rotate(180deg);
          color: #F0C75E;
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
          padding: 7px 10px;
          border-radius: 8px;
          margin-bottom: 2px;
          transition: background 0.15s ease, color 0.15s ease;
        }

        :global(.nav-sublink:hover) {
          background: rgba(255, 255, 255, 0.05);
          color: #f1f5f9;
        }

        :global(.nav-sublink-active) {
          color: #F0C75E;
          background: rgba(212, 167, 44, 0.12);
        }

        :global(.nav-sublink svg) {
          flex-shrink: 0;
          opacity: 0.85;
        }

        .sidebar-footer {
          padding: 14px 16px 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        :global(.profile-row) {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 4px 2px 12px;
          text-decoration: none;
          cursor: pointer;
          border-radius: 8px;
          transition: background 0.15s ease;
        }

        :global(.profile-row:hover) {
          background: rgba(255, 255, 255, 0.04);
        }

        .profile-avatar-wrap {
          position: relative;
          flex-shrink: 0;
        }

        .profile-avatar-img {
          object-fit: cover;
          object-position: center 22%;
        }

        .profile-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: rgba(240, 199, 94, 0.16);
          color: #F0C75E;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 800;
          flex-shrink: 0;
        }

        .profile-online-dot {
          position: absolute;
          bottom: -1px;
          right: -1px;
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #4ade80;
          border: 2px solid #11171C;
        }

        .profile-name {
          color: #f8fafc;
          font-size: 13px;
          font-weight: 700;
        }

        .profile-role {
          color: #64748b;
          font-size: 11px;
          font-weight: 600;
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

function NavItem({ href, icon: Icon, label, active }) {
  return (
    <li className="nav-item">
      <Link href={href} className={`nav-link ${active ? "nav-link-active" : ""}`} title={label}>
        <span className="nav-icon">
          <Icon size={16} strokeWidth={2} />
        </span>
        <span className="nav-label">{label}</span>
      </Link>
    </li>
  );
}

function SubNavItem({ href, icon: Icon, label, active }) {
  return (
    <li>
      <Link href={href} className={`nav-sublink ${active ? "nav-sublink-active" : ""}`}>
        <Icon size={14} strokeWidth={2} />
        {label}
      </Link>
    </li>
  );
}

function NavGroupLabel({ children }) {
  return <div className="nav-group-label">{children}</div>;
}
