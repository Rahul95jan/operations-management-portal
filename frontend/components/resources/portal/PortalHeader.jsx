import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { API, initials, userPhotoUrl } from "./portalUtils";

// Shared page header for the two Resource Portal pages: title + subtitle on
// the left, signed-in user chip and tagline on the right.
export default function PortalHeader({ title = "Resource Portal", subtitle, tagline }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch(`${API}/users/me`).then((r) => r.json()).then(setUser).catch(() => setUser(null));
  }, []);

  return (
    <header className="portal-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="right">
        <div className="user-row">
          <span className="bell"><Bell size={17} strokeWidth={2} /></span>
          {user && (
            <>
              {userPhotoUrl(user) ? (
                <img src={userPhotoUrl(user)} alt={user.name} className="avatar" />
              ) : (
                <span className="avatar avatar-fallback">{initials(user.name)}</span>
              )}
              <div className="who">
                <div className="who-name">{user.name}</div>
                <div className="who-role">{user.role || ""}</div>
              </div>
            </>
          )}
        </div>
        {tagline && <div className="tagline">“{tagline}”</div>}
      </div>

      <style jsx>{`
        .portal-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 18px; }
        h1 { margin: 0; font-size: 26px; font-weight: 800; color: #0f172a; line-height: 1.2; }
        p { margin: 4px 0 0; font-size: 13px; color: #475569; }
        .right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
        .user-row { display: flex; align-items: center; gap: 12px; }
        .bell { color: #334155; display: flex; }
        .avatar { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; }
        .avatar-fallback { background: linear-gradient(135deg, #7c3aed, #6366f1); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; }
        .who-name { font-size: 12.5px; font-weight: 700; color: #0f172a; }
        .who-role { font-size: 11px; color: #64748b; }
        .tagline { font-size: 11.5px; font-style: italic; color: #64748b; }
        @media (max-width: 800px) { .portal-header { flex-direction: column; } .right { align-items: flex-start; } }
      `}</style>
    </header>
  );
}
