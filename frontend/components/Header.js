import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Bell, ChevronDown, ChevronLeft, ChevronRight, LogOut, User as UserIcon, Settings as SettingsIcon, Sun, Moon, CalendarDays } from "lucide-react";
import { clearSession } from "../lib/auth";
import { getStoredTheme, setTheme } from "../lib/theme";

const API = "http://127.0.0.1:8000";

function initials(name) {
  if (!name) return "?";
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
}

function userPhotoUrl(user) {
  if (!user?.photo_path) return null;
  return `${API}/users/${user.id}/photo?v=${encodeURIComponent(user.photo_path)}`;
}

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function buildMonthGrid(viewDate) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}

function isSameDay(a, b) {
  return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function Header({ notificationCount = 0, notifications = [] }) {
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [theme, setThemeState] = useState("dark");
  const [now, setNow] = useState(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [viewDate, setViewDate] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const boxRef = useRef(null);

  useEffect(() => {
    fetch(`${API}/users/me`).then((r) => r.json()).then(setUser).catch(() => setUser(null));
    setThemeState(getStoredTheme());
    const nowDate = new Date();
    setNow(nowDate);
    setViewDate(nowDate);
    setSelectedDate(nowDate);
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    setThemeState(next);
  };

  useEffect(() => {
    const onClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) {
        setProfileOpen(false);
        setNotifOpen(false);
        setCalendarOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const logout = () => {
    clearSession();
    router.push("/login");
  };

  return (
    <div className="header" ref={boxRef}>
      <div className="header-item-wrap">
        <button
          type="button"
          className="date-chip"
          onClick={() => { setCalendarOpen((v) => !v); setProfileOpen(false); setNotifOpen(false); }}
          aria-label="Open calendar"
        >
          <span className="date-chip-icon"><CalendarDays size={20} strokeWidth={2.2} /></span>
          <div className="date-chip-text">
            <div className="date-chip-main">{now ? now.toLocaleDateString(undefined, { weekday: "long", day: "2-digit", month: "long", year: "numeric" }) : ""}</div>
          </div>
          <ChevronDown size={16} strokeWidth={2.3} className={`date-chip-chevron ${calendarOpen ? "date-chip-chevron-open" : ""}`} />
        </button>

        {calendarOpen && viewDate && (
          <div className="dropdown calendar-dropdown">
            <div className="calendar-header">
              <button type="button" className="calendar-nav-btn" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} aria-label="Previous month">
                <ChevronLeft size={16} strokeWidth={2.3} />
              </button>
              <div className="calendar-month-label">{viewDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</div>
              <button type="button" className="calendar-nav-btn" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} aria-label="Next month">
                <ChevronRight size={16} strokeWidth={2.3} />
              </button>
            </div>

            <div className="calendar-weekdays">
              {WEEKDAY_LABELS.map((w, i) => (
                <div key={i} className="calendar-weekday">{w}</div>
              ))}
            </div>

            <div className="calendar-grid">
              {buildMonthGrid(viewDate).map((d, i) => {
                if (d === null) return <div key={i} className="calendar-cell calendar-cell-empty" />;
                const cellDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), d);
                const isToday = isSameDay(cellDate, now);
                const isSelected = isSameDay(cellDate, selectedDate);
                return (
                  <button
                    key={i}
                    type="button"
                    className={`calendar-cell calendar-day ${isToday ? "calendar-day-today" : ""} ${isSelected && !isToday ? "calendar-day-selected" : ""}`}
                    onClick={() => setSelectedDate(cellDate)}
                  >
                    {d}
                  </button>
                );
              })}
            </div>

            <div className="calendar-footer">
              <span className="calendar-selected-label">
                {selectedDate ? selectedDate.toLocaleDateString(undefined, { weekday: "long", day: "2-digit", month: "long", year: "numeric" }) : ""}
              </span>
              <button
                type="button"
                className="calendar-today-btn"
                onClick={() => { const t = new Date(); setViewDate(t); setSelectedDate(t); }}
              >
                Today
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="header-right" style={{ marginLeft: "auto" }}>
        <button
          className="theme-toggle"
          type="button"
          onClick={toggleTheme}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          aria-label="Toggle theme"
        >
          <Sun size={12} strokeWidth={2.4} className="theme-toggle-icon" />
          <span className={`theme-toggle-dot ${theme === "light" ? "theme-toggle-dot-light" : ""}`} />
          <Moon size={12} strokeWidth={2.4} className="theme-toggle-icon" />
        </button>

        <div className="header-item-wrap">
          <button className="icon-btn" onClick={() => { setNotifOpen((v) => !v); setProfileOpen(false); }} aria-label="Notifications">
            <Bell size={18} strokeWidth={2} />
            {notificationCount > 0 && <span className="notif-badge">{notificationCount > 9 ? "9+" : notificationCount}</span>}
          </button>
          {notifOpen && (
            <div className="dropdown notif-dropdown">
              <div className="dropdown-title">Notifications</div>
              {notifications.length === 0 ? (
                <div className="dropdown-empty">You&apos;re all caught up.</div>
              ) : (
                notifications.slice(0, 6).map((n, i) => (
                  <div key={i} className="notif-row">
                    <span className={`notif-dot notif-dot-${n.level || "orange"}`} />
                    <span>{n.text}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="header-item-wrap">
          <button className="profile-btn" onClick={() => { setProfileOpen((v) => !v); setNotifOpen(false); }}>
            {userPhotoUrl(user) ? (
              <img src={userPhotoUrl(user)} alt={user?.name} className="profile-avatar profile-avatar-img" />
            ) : (
              <div className="profile-avatar">{initials(user?.name)}</div>
            )}
            <div className="profile-text">
              <div className="profile-name">{user?.name || "—"}</div>
              <div className="profile-role">{user?.role || "No role set"}</div>
            </div>
            <ChevronDown size={14} strokeWidth={2.3} />
          </button>
          {profileOpen && (
            <div className="dropdown profile-dropdown">
              <Link href="/profile" className="dropdown-link"><UserIcon size={14} strokeWidth={2.2} /> My Profile</Link>
              <Link href="/settings" className="dropdown-link"><SettingsIcon size={14} strokeWidth={2.2} /> Settings</Link>
              <button className="dropdown-link dropdown-link-danger" onClick={logout}><LogOut size={14} strokeWidth={2.2} /> Logout</button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .header {
          position: sticky;
          top: 0;
          z-index: 20;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 14px 28px;
          margin: -28px -32px 20px;
          background: var(--om-bg-header);
          border-bottom: 1px solid var(--om-border-2);
        }

        .date-chip {
          display: flex;
          align-items: center;
          gap: 12px;
          background: var(--om-bg-page);
          border: 1px solid var(--om-border-1);
          border-radius: 14px;
          padding: 10px 18px;
          color: #f0c75e;
          cursor: pointer;
          transition: border-color 0.15s ease;
        }

        .date-chip:hover {
          border-color: rgba(240, 199, 94, 0.4);
        }

        .date-chip-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(240, 199, 94, 0.15);
          color: #f0c75e;
          flex-shrink: 0;
        }

        .date-chip-text {
          text-align: left;
        }

        .date-chip-main {
          font-size: 14px;
          font-weight: 700;
          color: var(--om-text-strong);
          white-space: nowrap;
        }

        .date-chip-chevron {
          color: var(--om-text-faint);
          transition: transform 0.15s ease;
          flex-shrink: 0;
        }

        .date-chip-chevron-open {
          transform: rotate(180deg);
        }

        .calendar-dropdown {
          left: 0;
          right: auto;
          min-width: 280px;
          padding: 14px;
        }

        .calendar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
        }

        .calendar-month-label {
          font-size: 13px;
          font-weight: 700;
          color: var(--om-text-strong);
        }

        .calendar-nav-btn {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: var(--om-bg-page);
          border: 1px solid var(--om-border-1);
          color: var(--om-text-body);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .calendar-nav-btn:hover {
          border-color: rgba(240, 199, 94, 0.4);
          color: #f0c75e;
        }

        .calendar-weekdays {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          margin-bottom: 4px;
        }

        .calendar-weekday {
          text-align: center;
          font-size: 10.5px;
          font-weight: 700;
          color: var(--om-text-faint);
          padding: 4px 0;
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 2px;
        }

        .calendar-cell {
          height: 32px;
        }

        .calendar-day {
          background: transparent;
          border: none;
          border-radius: 8px;
          color: var(--om-text-body);
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
        }

        .calendar-day:hover {
          background: var(--om-border-3);
        }

        .calendar-day-today {
          background: #f0c75e;
          color: #1a1400;
          font-weight: 800;
        }

        .calendar-day-selected {
          border: 1px solid #f0c75e;
          color: #f0c75e;
        }

        .calendar-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 12px;
          padding-top: 10px;
          border-top: 1px solid var(--om-border-1);
        }

        .calendar-selected-label {
          font-size: 11px;
          color: var(--om-text-faint);
        }

        .calendar-today-btn {
          background: rgba(240, 199, 94, 0.15);
          border: 1px solid rgba(240, 199, 94, 0.35);
          color: #f0c75e;
          font-size: 11px;
          font-weight: 700;
          padding: 5px 12px;
          border-radius: 8px;
          cursor: pointer;
        }

        .calendar-today-btn:hover {
          background: rgba(240, 199, 94, 0.25);
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-shrink: 0;
        }

        .theme-toggle {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 54px;
          background: var(--om-bg-page);
          border: 1px solid var(--om-border-1);
          border-radius: 999px;
          padding: 6px 8px;
          color: var(--om-text-faint);
          cursor: pointer;
        }

        :global(.theme-toggle-icon) {
          position: relative;
          z-index: 1;
          flex-shrink: 0;
          color: inherit;
        }

        .theme-toggle-dot {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #f0c75e;
          transition: left 0.2s ease;
        }

        .theme-toggle-dot-light {
          left: calc(100% - 21px);
        }

        .header-item-wrap {
          position: relative;
        }

        .icon-btn {
          position: relative;
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: var(--om-bg-page);
          border: 1px solid var(--om-border-1);
          color: var(--om-text-body);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: border-color 0.15s ease, color 0.15s ease;
        }

        .icon-btn:hover {
          border-color: rgba(240, 199, 94, 0.4);
          color: #f0c75e;
        }

        .notif-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          min-width: 16px;
          height: 16px;
          padding: 0 4px;
          border-radius: 999px;
          background: #ef4444;
          color: #fff;
          font-size: 9.5px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .profile-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 4px;
          color: var(--om-text-body);
        }

        .profile-avatar-img {
          object-fit: cover;
          object-position: center 22%;
        }

        .profile-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: rgba(240, 199, 94, 0.18);
          color: #f0c75e;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 800;
          flex-shrink: 0;
        }

        .profile-text {
          text-align: left;
        }

        .profile-name {
          font-size: 12.5px;
          font-weight: 700;
          color: #f1f5f9;
        }

        .profile-role {
          font-size: 10.5px;
          color: var(--om-text-faint);
        }

        .dropdown {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          min-width: 220px;
          background: var(--om-bg-card);
          border: 1px solid var(--om-border-1);
          border-radius: 12px;
          box-shadow: 0 16px 30px -14px rgba(0, 0, 0, 0.6);
          padding: 8px;
          z-index: 30;
        }

        .dropdown-title {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--om-text-faint);
          padding: 6px 8px 8px;
        }

        .dropdown-empty {
          font-size: 12.5px;
          color: var(--om-text-faint);
          padding: 10px 8px;
        }

        .notif-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12.5px;
          color: var(--om-text-strong);
          padding: 7px 8px;
          border-radius: 8px;
        }

        .notif-row:hover {
          background: var(--om-border-4);
        }

        .notif-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .notif-dot-red {
          background: #ef4444;
        }

        .notif-dot-orange {
          background: #f59e0b;
        }

        .notif-dot-yellow {
          background: #eab308;
        }

        :global(.dropdown-link) {
          display: flex;
          align-items: center;
          gap: 9px;
          width: 100%;
          box-sizing: border-box;
          background: transparent;
          border: none;
          text-align: left;
          text-decoration: none;
          color: var(--om-text-strong);
          font-size: 13px;
          font-weight: 600;
          padding: 9px 8px;
          border-radius: 8px;
          cursor: pointer;
        }

        :global(.dropdown-link:hover) {
          background: var(--om-border-3);
        }

        :global(.dropdown-link-danger) {
          color: #f87171;
        }
      `}</style>
    </div>
  );
}
