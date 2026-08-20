import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import ProtectedRoute from "../components/ProtectedRoute";

const API = "http://127.0.0.1:8000";

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [schedulerStatus, setSchedulerStatus] = useState(null);

  const load = () => {
    fetch(`${API}/settings`)
      .then((res) => res.json())
      .then((data) => {
        setSettings(data);
        setForm(data);
      });

    fetch(`${API}/resource-scheduler/status`)
      .then((res) => res.json())
      .then(setSchedulerStatus)
      .catch(() => setSchedulerStatus(null));
  };

  useEffect(load, []);

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    try {
      const payload = {
        email_notifications_enabled: form.email_notifications_enabled,
        ops_notification_email: form.ops_notification_email || null,
        reminder_scheduler_enabled: form.reminder_scheduler_enabled,
        max_reminders_before_final: Number(form.max_reminders_before_final),
        resource_default_deadline_hours: Number(form.resource_default_deadline_hours),
      };

      const res = await fetch(`${API}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setSettings(data);
      setForm(data);
      setSaved(true);
      fetch(`${API}/resource-scheduler/status`).then((r) => r.json()).then(setSchedulerStatus);
    } catch (err) {
      alert("Unable to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const dirty = settings && form && JSON.stringify(settings) !== JSON.stringify(form);

  const liveStatus = form ? (form.email_notifications_enabled && form.reminder_scheduler_enabled ? "Active" : "Paused") : "—";

  return (
    <ProtectedRoute>
      <>
        <Sidebar />

        <div style={{ marginLeft: "280px", padding: "32px 36px 60px", background: "#f1f5f9", minHeight: "100vh" }}>
          {/* Header */}
          <div className="page-hero">
            <div className="page-hero-blob" />
            <div className="page-hero-content">
              <div className="page-hero-eyebrow">Configuration</div>
              <h1 className="page-hero-title">⚙️ Settings</h1>
              <p className="page-hero-subtitle">
                Live configuration for the Resource Portal — changes take effect immediately, no restart needed.
              </p>
            </div>
            <div className={`page-hero-stat ${liveStatus === "Active" ? "" : "page-hero-stat-muted"}`}>
              <div className="page-hero-stat-value">{liveStatus}</div>
              <div className="page-hero-stat-label">Automation Status</div>
            </div>
          </div>

          {!form ? (
            <div className="card">
              <div className="empty-state">Loading…</div>
            </div>
          ) : (
            <>
              <Section
                icon="✉️"
                title="Email Notifications"
                description="Controls every automated email the Resource Portal sends: initial requests, reminders, submission confirmations, and operations notifications."
                delay={0}
              >
                <ToggleRow
                  label="Enable email notifications"
                  checked={form.email_notifications_enabled}
                  onChange={(v) => update("email_notifications_enabled", v)}
                  warning={!form.email_notifications_enabled ? "Notifications are paused — nothing will be emailed to mentors right now." : null}
                />

                <Field label="Operations notification email" hint="Optional — gets pinged whenever a mentor submits a resource. Leave blank to disable.">
                  <input
                    type="email"
                    value={form.ops_notification_email || ""}
                    onChange={(e) => update("ops_notification_email", e.target.value)}
                    placeholder="ops-team@yourcompany.com"
                    className="styled-input"
                    style={inputStyle}
                  />
                </Field>
              </Section>

              <Section
                icon="⏰"
                title="Reminder Automation"
                description="The scheduler checks for overdue resources in the background. Sending itself is gated by this toggle AND the Email Notifications switch above — both must be on."
                delay={0.05}
              >
                <ToggleRow
                  label="Enable automatic daily reminders"
                  checked={form.reminder_scheduler_enabled}
                  onChange={(v) => update("reminder_scheduler_enabled", v)}
                  warning={form.reminder_scheduler_enabled ? "This will start emailing mentors with overdue resources automatically, once per day per requirement, with no further confirmation." : null}
                />

                <Field label={'Reminders before escalating to "Final Reminder"'}>
                  <input
                    type="number"
                    min="1"
                    value={form.max_reminders_before_final}
                    onChange={(e) => update("max_reminders_before_final", e.target.value)}
                    className="styled-input"
                    style={{ ...inputStyle, maxWidth: "120px" }}
                  />
                </Field>

                {schedulerStatus && (
                  <p className="hint-text">
                    Background check runs every {schedulerStatus.interval_hours}h (set via <code>RESOURCE_REMINDER_INTERVAL_HOURS</code> — needs a server restart to change).
                  </p>
                )}
              </Section>

              <Section
                icon="📅"
                title="Resource Deadlines"
                description="Default deadline applied when Operations configures required resources without specifying one."
                delay={0.1}
              >
                <Field label="Default deadline (hours after configuration)">
                  <input
                    type="number"
                    min="1"
                    value={form.resource_default_deadline_hours}
                    onChange={(e) => update("resource_default_deadline_hours", e.target.value)}
                    className="styled-input"
                    style={{ ...inputStyle, maxWidth: "120px" }}
                  />
                </Field>
              </Section>

              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <button onClick={handleSave} disabled={saving || !dirty} className="btn btn-save">
                  {saving ? "Saving..." : "Save Settings"}
                </button>

                {saved && <span className="saved-chip">✓ Saved</span>}
                {settings?.updated_at && (
                  <span className="updated-text">Last updated {new Date(settings.updated_at).toLocaleString()}</span>
                )}
              </div>
            </>
          )}
        </div>

        <style jsx>{`
          .page-hero {
            position: relative;
            overflow: hidden;
            border-radius: 18px;
            padding: 30px 32px;
            margin-bottom: 24px;
            background: linear-gradient(120deg, #0f172a 0%, #1e293b 60%, #0f172a 100%);
            background-size: 200% 200%;
            animation: heroShift 12s ease infinite;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            box-shadow: 0 16px 32px -18px rgba(15, 23, 42, 0.55);
          }

          .page-hero-blob {
            position: absolute;
            width: 220px;
            height: 220px;
            border-radius: 50%;
            background: #22c55e;
            filter: blur(60px);
            opacity: 0.3;
            top: -80px;
            right: 160px;
            animation: float 9s ease-in-out infinite;
          }

          .page-hero-content {
            position: relative;
            z-index: 1;
          }

          .page-hero-eyebrow {
            display: inline-block;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: #fbbf24;
            background: rgba(251, 191, 36, 0.12);
            border: 1px solid rgba(251, 191, 36, 0.3);
            padding: 5px 10px;
            border-radius: 999px;
            margin-bottom: 10px;
          }

          .page-hero-title {
            font-size: 26px;
            font-weight: 800;
            color: #f8fafc;
            margin: 0 0 6px;
          }

          .page-hero-subtitle {
            color: #94a3b8;
            font-size: 14px;
            margin: 0;
            max-width: 520px;
          }

          .page-hero-stat {
            position: relative;
            z-index: 1;
            text-align: center;
            padding: 14px 26px;
            border-radius: 14px;
            background: rgba(34, 197, 94, 0.12);
            border: 1px solid rgba(34, 197, 94, 0.3);
            flex-shrink: 0;
          }

          .page-hero-stat-muted {
            background: rgba(255, 255, 255, 0.06);
            border: 1px solid rgba(255, 255, 255, 0.1);
          }

          .page-hero-stat-value {
            font-size: 22px;
            font-weight: 800;
            color: #4ade80;
          }

          .page-hero-stat-muted .page-hero-stat-value {
            color: #fbbf24;
          }

          .page-hero-stat-label {
            font-size: 11px;
            color: #94a3b8;
            margin-top: 2px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            white-space: nowrap;
          }

          .card {
            background: #ffffff;
            border-radius: 16px;
            box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
            border: 1px solid #eef2f7;
            padding: 22px;
          }

          :global(.settings-section) {
            background: #ffffff;
            border-radius: 16px;
            box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
            border: 1px solid #eef2f7;
            padding: 22px;
            margin-bottom: 20px;
            animation: fadeSlideUp 0.4s ease both;
          }

          :global(.settings-section-title) {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: 0;
            margin-bottom: 4px;
            font-size: 16px;
            color: #1e293b;
          }

          :global(.settings-section-desc) {
            color: #94a3b8;
            font-size: 13px;
            margin-top: 0;
            margin-bottom: 18px;
          }

          .styled-input:focus {
            border-color: #f59e0b !important;
            background: #ffffff !important;
            box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15);
          }

          .hint-text {
            font-size: 12px;
            color: #94a3b8;
            margin-top: 4px;
          }

          .btn {
            border: none;
            border-radius: 10px;
            padding: 12px 24px;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.15s ease;
          }

          .btn:disabled {
            cursor: not-allowed;
          }

          .btn-save {
            background: linear-gradient(120deg, #0f172a, #1e293b);
            color: #facc15;
            box-shadow: 0 6px 16px -6px rgba(15, 23, 42, 0.5);
          }

          .btn-save:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 10px 20px -6px rgba(15, 23, 42, 0.6);
          }

          .btn-save:disabled {
            background: #94a3b8;
            color: #f1f5f9;
            box-shadow: none;
          }

          .saved-chip {
            color: #16a34a;
            font-weight: 700;
            font-size: 13px;
          }

          .updated-text {
            color: #94a3b8;
            font-size: 12px;
          }

          .empty-state {
            text-align: center;
            padding: 40px 20px;
            color: #94a3b8;
            font-size: 14px;
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
              transform: translateY(16px);
            }
          }

          @keyframes fadeSlideUp {
            from {
              opacity: 0;
              transform: translateY(8px);
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

function Section({ icon, title, description, children, delay = 0 }) {
  return (
    <div className="settings-section" style={{ animationDelay: `${delay}s` }}>
      <h3 className="settings-section-title">
        <span>{icon}</span> {title}
      </h3>
      <p className="settings-section-desc">{description}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>{children}</div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px", color: "#334155" }}>{label}</label>
      {children}
      {hint && <p style={{ color: "#94a3b8", fontSize: "12px", marginTop: "4px", marginBottom: 0 }}>{hint}</p>}
    </div>
  );
}

function ToggleRow({ label, checked, onChange, warning }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>{label}</span>
        <Switch checked={checked} onChange={onChange} />
      </div>
      {warning && (
        <p style={{ background: "#fffbeb", color: "#92400e", fontSize: "12px", padding: "8px 12px", borderRadius: "8px", marginTop: "8px" }}>
          ⚠️ {warning}
        </p>
      )}
    </div>
  );
}

function Switch({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        width: "44px",
        height: "24px",
        borderRadius: "999px",
        border: "none",
        background: checked ? "#16a34a" : "#cbd5e1",
        position: "relative",
        cursor: "pointer",
        transition: "background 0.15s ease",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: "3px",
          left: checked ? "23px" : "3px",
          width: "18px",
          height: "18px",
          borderRadius: "50%",
          background: "#fff",
          transition: "left 0.15s ease",
          boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
        }}
      />
    </button>
  );
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  borderRadius: "10px",
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
  fontSize: "14px",
  outline: "none",
};
