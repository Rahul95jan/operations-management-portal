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
  Radio,
  FileBarChart,
  Presentation,
  LayoutDashboard,
  UserPlus,
  Wallet,
  Upload,
  UserSearch,
  Settings as SettingsIcon,
  LogOut,
  ChevronDown,
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

  useEffect(() => {
    fetch(`${API}/users/me`).then((r) => r.json()).then(setUser).catch(() => setUser(null));
  }, []);

  const [resourcesOpen, setResourcesOpen] = useState(
    router.pathname === "/resources" ||
      router.pathname.startsWith("/resources/") ||
      router.pathname.startsWith("/resource-analytics")
  );

  const [webinarsOpen, setWebinarsOpen] = useState(
    router.pathname.startsWith("/webinars") || router.pathname === "/zoom-analytics"
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
  const webinarsGroupActive = router.pathname.startsWith("/webinars") || router.pathname === "/zoom-analytics";

  return (
    <div className="sidebar">
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

<<<<<<< Updated upstream
          <NavGroupLabel>Operations</NavGroupLabel>
          <NavItem href="/sessions" icon={Calendar} label="Sessions" active={isActive("/sessions")} />
          <NavItem href="/mentors" icon={Users} label="Mentors" active={isActive("/mentors")} />
          <NavItem href="/batches" icon={GraduationCap} label="Batches" active={isActive("/batches")} />
          <NavItem
            href="/session-reports"
            icon={FileBarChart}
            label="Session Reports"
            active={router.pathname === "/session-reports" || router.pathname.startsWith("/session-reports/")}
          />
          <NavItem href="/analytics" icon={BarChart3} label="Analytics" active={isActive("/analytics")} />
          <NavItem href="/mentor-performance" icon={Gauge} label="Mentor 360" active={isActive("/mentor-performance")} />
          <NavItem href="/invoice-generator" icon={Receipt} label="Invoice Generator" active={isActive("/invoice-generator")} />

          <NavGroupLabel>Learner Feedback</NavGroupLabel>
          <NavItem href="/nps" icon={ClipboardList} label="NPS Form" active={isActive("/nps")} />
          <NavItem href="/nps/analytics" icon={PieChart} label="NPS Analytics" active={isActive("/nps/analytics")} />
<<<<<<< HEAD

          <NavGroupLabel>Webinars</NavGroupLabel>
          <li className={`nav-item ${webinarsGroupActive ? "nav-item-parent-active" : ""}`}>
            <div className="nav-parent-row" onClick={() => setWebinarsOpen((prev) => !prev)}>
              <Link href="/webinars" className="nav-link nav-link-parent">
                <span className="nav-icon">
                  <Radio size={16} strokeWidth={2} />
                </span>
                <span className="nav-label">Webinars</span>
              </Link>
              <span className={`nav-chevron ${webinarsOpen ? "nav-chevron-open" : ""}`}>
                <ChevronDown size={14} strokeWidth={2.5} />
              </span>
            </div>

            <div className={`nav-submenu ${webinarsOpen ? "nav-submenu-open" : ""}`}>
              <ul className="nav-sublist">
                <SubNavItem href="/webinars/dashboard" icon={LayoutDashboard} label="Webinar Dashboard" active={isActive("/webinars/dashboard")} />
                <SubNavItem href="/webinars" icon={Presentation} label="Webinar Scheduler" active={isActive("/webinars")} />
                <SubNavItem href="/webinars/leads" icon={UserPlus} label="Leads / Conversion" active={isActive("/webinars/leads")} />
                <SubNavItem href="/webinars/payouts" icon={Wallet} label="Mentor Payouts" active={isActive("/webinars/payouts")} />
                <SubNavItem href="/webinars/import" icon={Upload} label="Import Participants" active={isActive("/webinars/import")} />
                <SubNavItem href="/webinars/learner-360" icon={UserSearch} label="Learner 360" active={isActive("/webinars/learner-360")} />
                <SubNavItem href="/zoom-analytics" icon={Video} label="Zoom Analytics" active={isActive("/zoom-analytics")} />
              </ul>
            </div>
          </li>
=======
          <NavItem href="/webinar-analytics" icon={Video} label="Webinar Analytics" active={isActive("/webinar-analytics")} />
          <NavItem href="/webinar-reports" icon={FilePlus2} label="Log Webinar Report" active={isActive("/webinar-reports")} />
>>>>>>> 967f926 (Initial commit)
=======
              {(hasPermission(user, "sessions") || hasPermission(user, "mentors") || hasPermission(user, "batches") || hasPermission(user, "analytics") || hasPermission(user, "invoices")) && (
                <NavGroupLabel>Operations</NavGroupLabel>
              )}
              {hasPermission(user, "sessions") && <NavItem href="/sessions" icon={Calendar} label="Sessions" active={isActive("/sessions")} />}
              {hasPermission(user, "mentors") && <NavItem href="/mentors" icon={Users} label="Mentors" active={isActive("/mentors")} />}
              {hasPermission(user, "batches") && <NavItem href="/batches" icon={GraduationCap} label="Batches" active={isActive("/batches")} />}
              {hasPermission(user, "analytics") && <NavItem href="/analytics" icon={BarChart3} label="Analytics" active={isActive("/analytics")} />}
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
>>>>>>> Stashed changes

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
          {userPhotoUrl(user) ? (
            <img src={userPhotoUrl(user)} alt={user?.name} className="profile-avatar profile-avatar-img" />
          ) : (
            <div className="profile-avatar">{initials(user?.name)}</div>
          )}
          <div className="profile-info">
            <div className="profile-name">{user?.name || "—"}</div>
            <div className="profile-role">{user?.role || "No role set"}</div>
          </div>
        </Link>

        <button onClick={logout} className="logout-btn">
          <LogOut size={16} strokeWidth={2.2} /> Logout
        </button>
      </div>

      <style jsx>{`
        .sidebar {
          width: 280px;
          height: 100vh;
          background: linear-gradient(180deg, #0B0F12 0%, var(--om-bg-header) 100%);
          color: white;
          position: fixed;
          left: 0;
          top: 0;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-sizing: border-box;
          border-right: 1px solid var(--om-border-2);
          box-shadow: 4px 0 24px -12px rgba(0, 0, 0, 0.4);
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
          overflow-y: auto;
          padding: 22px 16px 12px;
          scrollbar-width: thin;
          scrollbar-color: rgba(240, 199, 94, 0.3) transparent;
        }

        .sidebar-scroll::-webkit-scrollbar {
          width: 6px;
        }

        .sidebar-scroll::-webkit-scrollbar-thumb {
          background: rgba(240, 199, 94, 0.25);
          border-radius: 10px;
        }

        .brand {
          text-align: center;
          margin-bottom: 20px;
          padding-bottom: 18px;
          border-bottom: 1px solid var(--om-border-1);
        }

        .brand-logo {
          display: inline-flex;
          border-radius: 12px;
          padding: 3px;
          background: linear-gradient(120deg, rgba(212, 167, 44, 0.4), rgba(212, 167, 44, 0));
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
          color: var(--om-text-primary);
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
          color: var(--om-text-body);
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
          padding: 8px 12px;
          border-radius: 10px;
          position: relative;
          transition: background 0.15s ease, color 0.15s ease, transform 0.1s ease;
        }

        :global(.nav-link:hover) {
          background: var(--om-border-2);
          color: var(--om-text-primary);
          transform: translateX(2px);
        }

        :global(.nav-link:hover .nav-icon) {
          background: var(--om-border-strong);
          color: var(--om-text-primary);
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
          background: var(--om-border-3);
          color: var(--om-text-muted);
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
          color: var(--om-text-faint);
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
          background: var(--om-border-4);
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
          color: var(--om-text-faint);
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
          border-left: 2px solid var(--om-border-1);
        }

        :global(.nav-sublink) {
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--om-text-muted);
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
          padding: 7px 10px;
          border-radius: 8px;
          margin-bottom: 2px;
          transition: background 0.15s ease, color 0.15s ease;
        }

        :global(.nav-sublink:hover) {
          background: var(--om-border-3);
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
          border-top: 1px solid var(--om-border-1);
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
          background: var(--om-border-4);
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

        .profile-name {
          color: var(--om-text-primary);
          font-size: 13px;
          font-weight: 700;
        }

        .profile-role {
          color: var(--om-text-faint);
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
      <Link href={href} className={`nav-link ${active ? "nav-link-active" : ""}`}>
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
