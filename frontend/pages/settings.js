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

  return (
    <ProtectedRoute>
      <>
        <Sidebar />

        <div style={{ marginLeft: "300px", padding: "30px", background: "#f8fafc", minHeight: "100vh" }}>
          <h1 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "6px" }}>⚙️ Settings</h1>
          <p style={{ color: "#64748b", marginTop: 0, marginBottom: "24px" }}>
            Live configuration for the Resource Portal — changes take effect immediately, no restart needed.
          </p>

          {!form ? (
            <p>Loading...</p>
          ) : (
            <>
              <Section
                title="✉️ Email Notifications"
                description="Controls every automated email the Resource Portal sends: initial requests, reminders, submission confirmations, and operations notifications."
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
                    style={inputStyle}
                  />
                </Field>
              </Section>

              <Section
                title="⏰ Reminder Automation"
                description="The scheduler checks for overdue resources in the background. Sending itself is gated by this toggle AND the Email Notifications switch above — both must be on."
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
                    style={{ ...inputStyle, maxWidth: "120px" }}
                  />
                </Field>

                {schedulerStatus && (
                  <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>
                    Background check runs every {schedulerStatus.interval_hours}h (set via <code>RESOURCE_REMINDER_INTERVAL_HOURS</code> — needs a server restart to change).
                  </p>
                )}
              </Section>

              <Section
                title="📅 Resource Deadlines"
                description="Default deadline applied when Operations configures required resources without specifying one."
              >
                <Field label="Default deadline (hours after configuration)">
                  <input
                    type="number"
                    min="1"
                    value={form.resource_default_deadline_hours}
                    onChange={(e) => update("resource_default_deadline_hours", e.target.value)}
                    style={{ ...inputStyle, maxWidth: "120px" }}
                  />
                </Field>
              </Section>

              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <button
                  onClick={handleSave}
                  disabled={saving || !dirty}
                  style={{
                    background: !dirty ? "#94a3b8" : "#0f172a",
                    color: "#facc15",
                    border: "none",
                    padding: "12px 24px",
                    borderRadius: "10px",
                    fontWeight: 700,
                    fontSize: "14px",
                    cursor: !dirty ? "not-allowed" : "pointer",
                  }}
                >
                  {saving ? "Saving..." : "Save Settings"}
                </button>

                {saved && <span style={{ color: "#16a34a", fontWeight: 600, fontSize: "13px" }}>✓ Saved</span>}
                {settings?.updated_at && (
                  <span style={{ color: "#94a3b8", fontSize: "12px" }}>
                    Last updated {new Date(settings.updated_at).toLocaleString()}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </>
    </ProtectedRoute>
  );
}

function Section({ title, description, children }) {
  return (
    <div style={{ background: "#fff", borderRadius: "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)", padding: "22px", marginBottom: "20px" }}>
      <h3 style={{ marginTop: 0, marginBottom: "4px" }}>{title}</h3>
      <p style={{ color: "#94a3b8", fontSize: "13px", marginTop: 0, marginBottom: "18px" }}>{description}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>{children}</div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>{label}</label>
      {children}
      {hint && <p style={{ color: "#94a3b8", fontSize: "12px", marginTop: "4px", marginBottom: 0 }}>{hint}</p>}
    </div>
  );
}

function ToggleRow({ label, checked, onChange, warning }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "14px", fontWeight: 600 }}>{label}</span>
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
  borderRadius: "8px",
  border: "1.5px solid #e2e8f0",
  fontSize: "14px",
};
