import { useEffect, useRef, useState } from "react";
import ProtectedRoute from "../components/ProtectedRoute";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import {
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
  Settings as SettingsIcon,
  ShieldCheck,
  Camera,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function initials(name) {
  if (!name) return "?";
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
}

function userPhotoUrl(user, cacheBust) {
  if (!user?.has_photo || !user?.id) return null;
  return `${API}/users/${user.id}/photo?v=${cacheBust}`;
}

const PORTAL_MODULES = [
  {
    group: "Operations",
    items: [
      { icon: Calendar, label: "Sessions" },
      { icon: Users, label: "Mentors" },
      { icon: GraduationCap, label: "Batches" },
      { icon: BarChart3, label: "Analytics" },
      { icon: Receipt, label: "Invoice Generator" },
    ],
  },
  {
    group: "Learner Feedback",
    items: [
      { icon: ClipboardList, label: "NPS Form" },
      { icon: PieChart, label: "NPS Analytics" },
      { icon: Video, label: "Webinar Analytics" },
      { icon: FilePlus2, label: "Log Webinar Report" },
    ],
  },
  {
    group: "Resource Portal",
    items: [
      { icon: Package, label: "Resource Portal" },
      { icon: ListChecks, label: "Resource Tracking" },
      { icon: Clock, label: "Pending Resources" },
      { icon: TrendingUp, label: "Resource Analytics" },
      { icon: Award, label: "Mentor Performance" },
    ],
  },
  {
    group: "Settings",
    items: [{ icon: SettingsIcon, label: "Settings" }],
  },
];

export default function Profile() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoCacheBust, setPhotoCacheBust] = useState(() => Date.now());
  const [photoError, setPhotoError] = useState(null);
  const photoInputRef = useRef(null);

  const load = () => {
    fetch(`${API}/users/me`)
      .then((r) => r.json())
      .then((data) => { setUser(data); setForm(data); })
      .catch(() => setError("Couldn't load your profile right now."));
  };

  useEffect(load, []);

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const dirty = user && form && JSON.stringify(user) !== JSON.stringify(form);

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError(null);
    if (!file.type.startsWith("image/")) {
      setPhotoError("Please choose an image file (JPG, PNG, or WEBP).");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setPhotoError("Image must be 2MB or smaller.");
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));

    const body = new FormData();
    body.append("file", file);
    fetch(`${API}/users/me/photo`, { method: "POST", body })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.detail || "Photo upload failed.");
        }
        return res.json();
      })
      .then(() => {
        setPhotoCacheBust(Date.now());
        setUser((u) => ({ ...u, has_photo: true }));
        setForm((f) => ({ ...f, has_photo: true }));
      })
      .catch((err) => setPhotoError(err.message));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API}/users/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, phone: form.phone, role: form.role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Unable to save changes.");
      setUser(data);
      setForm(data);
      setSaved(true);
    } catch (err) {
      setError(err.message || "Unable to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const totalModules = PORTAL_MODULES.reduce((sum, g) => sum + g.items.length, 0);
  const photoUrl = photoPreview || userPhotoUrl(form, photoCacheBust);

  return (
    <ProtectedRoute>
      <>
        <Sidebar />
        <div style={{ marginLeft: "var(--om-sidebar-width, 280px)", transition: "margin-left 0.25s ease", padding: "28px 32px 56px", background: "var(--om-bg-page)", minHeight: "100vh" }}>
          <Header />

          <div className="page-head">
            <h1 className="page-title">My Profile</h1>
            <p className="page-sub">Manage your account details and see what parts of the portal you can access.</p>
          </div>

          <div className="grid-2">
            <div className="card">
              <div className="card-header">
                <div className="card-title">Account Details</div>
              </div>

              {!form ? (
                <div className="empty-state">{error || "Loading…"}</div>
              ) : (
                <>
                  <div className="profile-top">
                    <div className="avatar-upload-col">
                      <div className="big-avatar-wrap" onClick={() => photoInputRef.current?.click()} title="Click to change photo">
                        {photoUrl ? (
                          <img src={photoUrl} alt={form.name} className="big-avatar-img" />
                        ) : (
                          <div className="big-avatar">{initials(form.name)}</div>
                        )}
                        <div className="avatar-upload-badge"><Camera size={13} strokeWidth={2.3} /></div>
                      </div>
                      <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: "none" }} />
                      <div className="photo-hint">JPG, PNG (Max 2MB)</div>
                      <div className="photo-hint photo-hint-dim">Recommended: square, 400×400px, face centered &amp; filling the frame</div>
                      {photoError && <div className="photo-hint photo-hint-error">{photoError}</div>}
                    </div>
                    <div>
                      <div className="profile-top-name">{form.name || "Unnamed"}</div>
                      <div className="profile-top-role">{form.role || "No role set"}</div>
                    </div>
                  </div>

                  <div className="field">
                    <label>Full Name</label>
                    <input value={form.name || ""} onChange={(e) => update("name", e.target.value)} placeholder="Your name" />
                  </div>
                  <div className="field">
                    <label>Email</label>
                    <input type="email" value={form.email || ""} onChange={(e) => update("email", e.target.value)} placeholder="you@example.com" />
                  </div>
                  <div className="field">
                    <label>Mobile Number</label>
                    <input type="tel" value={form.phone || ""} onChange={(e) => update("phone", e.target.value)} placeholder="+91 90000 00000" />
                  </div>
                  <div className="field">
                    <label>Role / Title</label>
                    <input value={form.role || ""} onChange={(e) => update("role", e.target.value)} placeholder="e.g. Operations Manager" />
                  </div>

                  <div className="save-row">
                    <button className="save-btn" disabled={!dirty || saving} onClick={handleSave}>
                      {saving ? "Saving…" : "Save Changes"}
                    </button>
                    {saved && <span className="saved-msg">✓ Saved</span>}
                    {error && <span className="error-msg">{error}</span>}
                  </div>
                </>
              )}
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-title"><ShieldCheck size={16} strokeWidth={2.2} color="#f0c75e" /> Portal Access</div>
              </div>
              <div className="access-note">
                Your account currently has <b>full administrator access</b> to every module below ({totalModules} total).
                Role-based, per-module permissions aren&apos;t configured for this portal yet — as the sole account, you can reach everything the sidebar lists.
              </div>
              <div className="access-groups">
                {PORTAL_MODULES.map((g) => (
                  <div key={g.group} className="access-group">
                    <div className="access-group-label">{g.group}</div>
                    {g.items.map((item) => (
                      <div key={item.label} className="access-row">
                        <span className="access-icon"><item.icon size={14} strokeWidth={2.2} /></span>
                        <span style={{ flex: 1 }}>{item.label}</span>
                        <span className="access-badge">Full Access</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <style jsx>{`
          .page-head {
            margin-bottom: 20px;
          }

          .page-title {
            font-size: 24px;
            font-weight: 800;
            color: var(--om-text-primary);
            margin: 0 0 4px;
          }

          .page-sub {
            font-size: 13px;
            color: var(--om-text-muted);
            margin: 0;
          }

          .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            align-items: start;
          }

          :global(.card) {
            background: var(--om-bg-card);
            border-radius: 14px;
            padding: 20px 22px;
            border: 1px solid var(--om-border-2);
          }

          :global(.card-header) {
            margin-bottom: 16px;
          }

          :global(.card-title) {
            display: flex;
            align-items: center;
            gap: 7px;
            font-size: 14.5px;
            font-weight: 700;
            color: #f1f5f9;
          }

          :global(.empty-state) {
            text-align: center;
            padding: 30px;
            color: var(--om-text-faint);
            font-size: 13px;
          }

          .profile-top {
            display: flex;
            align-items: center;
            gap: 14px;
            margin-bottom: 20px;
            padding-bottom: 18px;
            border-bottom: 1px solid var(--om-border-2);
          }

          .big-avatar {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: rgba(240, 199, 94, 0.16);
            color: #f0c75e;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            font-weight: 800;
            flex-shrink: 0;
          }

          .avatar-upload-col {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
            flex-shrink: 0;
          }

          .big-avatar-wrap {
            position: relative;
            width: 56px;
            height: 56px;
            border-radius: 50%;
            cursor: pointer;
            flex-shrink: 0;
          }

          .big-avatar-img {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            object-fit: cover;
            object-position: center 22%;
            border: 2px solid rgba(240, 199, 94, 0.3);
          }

          .avatar-upload-badge {
            position: absolute;
            bottom: -2px;
            right: -2px;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #f0c75e;
            color: var(--om-bg-page);
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid var(--om-bg-card);
          }

          .photo-hint {
            font-size: 10px;
            color: var(--om-text-faint);
            text-align: center;
            max-width: 130px;
            line-height: 1.4;
          }

          .photo-hint-dim {
            font-size: 9.5px;
          }

          .photo-hint-error {
            color: #f87171;
          }

          .profile-top-name {
            font-size: 16px;
            font-weight: 700;
            color: var(--om-text-primary);
          }

          .profile-top-role {
            font-size: 12.5px;
            color: var(--om-text-muted);
            margin-top: 2px;
          }

          .field {
            margin-bottom: 14px;
          }

          .field label {
            display: block;
            font-size: 11.5px;
            font-weight: 700;
            color: var(--om-text-muted);
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }

          .field input {
            width: 100%;
            box-sizing: border-box;
            background: var(--om-bg-page);
            border: 1px solid var(--om-border-1);
            border-radius: 9px;
            padding: 10px 12px;
            color: #f1f5f9;
            font-size: 13.5px;
            outline: none;
            transition: border-color 0.15s ease;
          }

          .field input:focus {
            border-color: rgba(240, 199, 94, 0.5);
          }

          .save-row {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-top: 8px;
          }

          .save-btn {
            background: linear-gradient(120deg, #f0c75e, #d4a72c);
            color: var(--om-bg-page);
            border: none;
            border-radius: 9px;
            padding: 10px 20px;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            transition: transform 0.15s ease, opacity 0.15s ease;
          }

          .save-btn:disabled {
            opacity: 0.4;
            cursor: not-allowed;
          }

          .save-btn:not(:disabled):hover {
            transform: translateY(-1px);
          }

          .saved-msg {
            font-size: 12.5px;
            font-weight: 700;
            color: #4ade80;
          }

          .error-msg {
            font-size: 12.5px;
            font-weight: 600;
            color: #f87171;
          }

          .access-note {
            font-size: 12.5px;
            color: var(--om-text-muted);
            line-height: 1.6;
            background: rgba(240, 199, 94, 0.06);
            border: 1px solid rgba(240, 199, 94, 0.15);
            border-radius: 10px;
            padding: 12px 14px;
            margin-bottom: 18px;
          }

          .access-note b {
            color: #f0c75e;
          }

          .access-groups {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .access-group-label {
            font-size: 10.5px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            color: var(--om-text-faint);
            margin-bottom: 8px;
          }

          .access-row {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 7px 0;
            font-size: 13px;
            color: var(--om-text-body);
          }

          .access-icon {
            width: 26px;
            height: 26px;
            border-radius: 7px;
            background: var(--om-border-3);
            color: var(--om-text-muted);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }

          .access-badge {
            font-size: 10.5px;
            font-weight: 700;
            color: #4ade80;
            background: rgba(74, 222, 128, 0.12);
            padding: 3px 9px;
            border-radius: 999px;
            white-space: nowrap;
          }

          @media (max-width: 1000px) {
            .grid-2 {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </>
    </ProtectedRoute>
  );
}
