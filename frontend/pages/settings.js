import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import ProtectedRoute from "../components/ProtectedRoute";
import SettingsCard from "../components/settings/SettingsCard";
import SettingsInput from "../components/settings/SettingsInput";
import FormField from "../components/settings/FormField";
import ToggleRow from "../components/settings/ToggleRow";
import StatusTile from "../components/settings/StatusTile";
import ReminderWindowBar from "../components/settings/ReminderWindowBar";
import SaveBar from "../components/settings/SaveBar";
import {
  Package,
  Mail,
  BellRing,
  CalendarClock,
  Scale,
  Tags,
  Target,
  Video,
  Zap,
  Clock,
  Info,
  RefreshCw,
  AlertTriangle,
  Timer,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const pad = (n) => String(n).padStart(2, "0");

const JUMP_LINKS = [
  { href: "#email", label: "Email Notifications" },
  { href: "#reminders", label: "Reminder Automation" },
  { href: "#deadlines", label: "Resource Deadlines" },
  { href: "#mentor-360", label: "Mentor 360" },
  { href: "#webinars", label: "Webinar Operations" },
];

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [schedulerStatus, setSchedulerStatus] = useState(null);
  const [mentorConfig, setMentorConfig] = useState(null);
  const [webinarConfig, setWebinarConfig] = useState(null);

  const load = () => {
    setLoadError(false);

    fetch(`${API}/settings`)
      .then((res) => res.json())
      .then((data) => {
        setSettings(data);
        setForm(data);
      })
      .catch(() => setLoadError(true));

    fetch(`${API}/resource-scheduler/status`)
      .then((res) => res.json())
      .then(setSchedulerStatus)
      .catch(() => setSchedulerStatus(null));

    fetch(`${API}/mentor-360/config`)
      .then((res) => res.json())
      .then(setMentorConfig)
      .catch(() => setMentorConfig(null));

    fetch(`${API}/webinars/config`)
      .then((res) => res.json())
      .then(setWebinarConfig)
      .catch(() => setWebinarConfig(null));
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
        reminder_interval_hours: Number(form.reminder_interval_hours),
        reminder_window_start_hour: Number(form.reminder_window_start_hour),
        reminder_window_end_hour: Number(form.reminder_window_end_hour),
        reminder_timezone: form.reminder_timezone,
        weekend_deadline_enabled: form.weekend_deadline_enabled,
      };

      const res = await fetch(`${API}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      // A rejected save (e.g. validation error) returns an error body, not the
      // settings — don't let it replace the form.
      if (!res.ok) throw new Error("save failed");
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

  const handleDiscard = () => {
    setForm(settings);
    setSaved(false);
  };

  const dirty = settings && form && JSON.stringify(settings) !== JSON.stringify(form);

  const liveStatus = form ? (form.email_notifications_enabled && form.reminder_scheduler_enabled ? "Active" : "Paused") : "—";

  const maxWeight = mentorConfig ? Math.max(...Object.values(mentorConfig.dimension_weights), 1) : 1;

  const windowText = form ? `${pad(Number(form.reminder_window_start_hour) || 0)}:00 – ${pad(Number(form.reminder_window_end_hour) || 0)}:00` : "—";

  return (
    <ProtectedRoute>
      <>
        <Sidebar />

        <div className="page">
          {/* Header */}
          <div className="hero">
            <div className="hero-blob" />
            <div className="hero-content">
              <div className="hero-eyebrow">Configuration</div>
              <h1>Settings</h1>
              <p>
                One place for how every module in the portal behaves. Resource Portal settings are live and editable here;
                Mentor 360 and Webinar Operations are shown read-only for now (see each card for why).
              </p>
            </div>
            <div className={`hero-stat ${liveStatus === "Active" ? "" : "hero-stat-muted"}`}>
              <div className="hero-stat-value">
                <span className="hero-dot" /> {liveStatus}
              </div>
              <div className="hero-stat-label">Automation Status</div>
            </div>
          </div>

          {loadError ? (
            <div className="state-card">
              <AlertTriangle size={26} />
              <h3>Couldn&apos;t load settings</h3>
              <p>Check that the backend is running, then try again.</p>
              <button className="btn-retry" onClick={load}><RefreshCw size={14} /> Retry</button>
            </div>
          ) : !form ? (
            <div className="skeletons" aria-busy="true" aria-label="Loading settings">
              <div className="sk-tiles">{[0, 1, 2, 3].map((i) => <div key={i} className="sk sk-tile" />)}</div>
              <div className="sk sk-card" />
              <div className="sk sk-card sk-card-tall" />
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="tiles">
                <StatusTile
                  icon={Mail}
                  label="Email Notifications"
                  value={form.email_notifications_enabled ? "On" : "Paused"}
                  sub={form.email_notifications_enabled ? "Mentors are being emailed" : "Nothing is emailed right now"}
                  tone={form.email_notifications_enabled ? "green" : "amber"}
                />
                <StatusTile
                  icon={BellRing}
                  label="Auto Reminders"
                  value={form.reminder_scheduler_enabled ? "On" : "Off"}
                  sub={form.reminder_scheduler_enabled ? `Every ${form.reminder_interval_hours || 2}h · final after ${form.max_reminders_before_final}` : "Overdue resources aren't chased"}
                  tone={form.reminder_scheduler_enabled ? "green" : "slate"}
                />
                <StatusTile icon={Clock} label="Reminder Window" value={windowText} sub={form.reminder_timezone || "No timezone set"} tone="slate" />
                <StatusTile
                  icon={Timer}
                  label="Default Deadline"
                  value={`${form.resource_default_deadline_hours}h`}
                  sub={form.weekend_deadline_enabled ? "Weekend sessions due Monday" : "Weekend rule off"}
                  tone="slate"
                />
              </div>

              <nav className="jump" aria-label="Jump to section">
                <span className="jump-label">Jump to</span>
                {JUMP_LINKS.map((l) => <a key={l.href} href={l.href}>{l.label}</a>)}
              </nav>

              <div className="group-head">
                <span className="group-icon"><Package size={16} strokeWidth={2.2} /></span>
                <h2>Resource Portal</h2>
                <div className="group-line" />
              </div>

              <SettingsCard
                id="email"
                icon={Mail}
                tone="blue"
                title="Email Notifications"
                description="Controls every automated email the Resource Portal sends: initial requests, reminders, submission confirmations, and operations notifications."
              >
                <ToggleRow
                  label="Enable email notifications"
                  checked={form.email_notifications_enabled}
                  onChange={(v) => update("email_notifications_enabled", v)}
                  warning={!form.email_notifications_enabled ? "Notifications are paused — nothing will be emailed to mentors right now." : null}
                />

                <FormField label="Operations notification email" hint="Optional — gets pinged whenever a mentor submits a resource. Leave blank to disable.">
                  <SettingsInput
                    type="email"
                    value={form.ops_notification_email || ""}
                    onChange={(e) => update("ops_notification_email", e.target.value)}
                    placeholder="ops-team@yourcompany.com"
                    width="460px"
                  />
                </FormField>
              </SettingsCard>

              <SettingsCard
                id="reminders"
                icon={BellRing}
                tone="amber"
                title="Reminder Automation"
                description="The scheduler checks for overdue resources in the background. Sending itself is gated by this toggle AND the Email Notifications switch above — both must be on."
              >
                <ToggleRow
                  label="Enable automatic reminders"
                  checked={form.reminder_scheduler_enabled}
                  onChange={(v) => update("reminder_scheduler_enabled", v)}
                  warning={form.reminder_scheduler_enabled ? `This will start emailing mentors with overdue resources automatically, every ${form.reminder_interval_hours || 2}h per requirement (within the reminder window below), with no further confirmation.` : null}
                />

                <div className="grid-2">
                  <FormField label={'Reminders before escalating to "Final Reminder"'}>
                    <SettingsInput
                      type="number"
                      min="1"
                      value={form.max_reminders_before_final}
                      onChange={(e) => update("max_reminders_before_final", e.target.value)}
                      unit="reminders"
                      width="220px"
                    />
                  </FormField>

                  <FormField label="Reminder interval" hint="How often an overdue requirement can be re-reminded. This is the real per-requirement cadence — live, no restart needed.">
                    <SettingsInput
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={form.reminder_interval_hours}
                      onChange={(e) => update("reminder_interval_hours", e.target.value)}
                      unit="hours"
                      width="220px"
                    />
                  </FormField>
                </div>

                <div>
                  <div className="subhead">Reminder window</div>
                  <div className="grid-3">
                    <FormField label="Start hour (0-23)">
                      <SettingsInput
                        type="number"
                        min="0"
                        max="23"
                        value={form.reminder_window_start_hour}
                        onChange={(e) => update("reminder_window_start_hour", e.target.value)}
                        unit="o'clock"
                      />
                    </FormField>
                    <FormField label="End hour (0-23)">
                      <SettingsInput
                        type="number"
                        min="0"
                        max="23"
                        value={form.reminder_window_end_hour}
                        onChange={(e) => update("reminder_window_end_hour", e.target.value)}
                        unit="o'clock"
                      />
                    </FormField>
                    <FormField label="Timezone" hint="IANA timezone used for the window and the weekend deadline rule.">
                      <SettingsInput
                        type="text"
                        value={form.reminder_timezone || ""}
                        onChange={(e) => update("reminder_timezone", e.target.value)}
                        placeholder="Asia/Kolkata"
                      />
                    </FormField>
                  </div>
                  <div className="window-bar">
                    <ReminderWindowBar start={form.reminder_window_start_hour} end={form.reminder_window_end_hour} timezone={form.reminder_timezone} />
                  </div>
                </div>

                {schedulerStatus && (
                  <div className="note">
                    <Info size={16} />
                    <p>
                      This is different from the background check&apos;s own tick, which runs every {schedulerStatus.interval_hours}h
                      (set via <code>RESOURCE_REMINDER_INTERVAL_HOURS</code> — needs a server restart to change). The reminder interval
                      above controls whether any given requirement is actually due for a resend when that tick runs.
                    </p>
                  </div>
                )}
              </SettingsCard>

              <SettingsCard
                id="deadlines"
                icon={CalendarClock}
                tone="green"
                title="Resource Deadlines"
                description="Default deadline applied when Operations configures required resources without specifying one."
              >
                <FormField label="Default deadline (hours after configuration)">
                  <SettingsInput
                    type="number"
                    min="1"
                    value={form.resource_default_deadline_hours}
                    onChange={(e) => update("resource_default_deadline_hours", e.target.value)}
                    unit="hours"
                    width="220px"
                  />
                </FormField>

                <div>
                  <ToggleRow
                    label="Weekend sessions due first-half Monday"
                    checked={form.weekend_deadline_enabled}
                    onChange={(v) => update("weekend_deadline_enabled", v)}
                  />
                  <div className="note note-inline">
                    <Info size={16} />
                    <p>
                      When on, Saturday/Sunday sessions get a due date on the following Monday at the reminder window&apos;s start hour,
                      instead of the flat default-deadline offset above.
                    </p>
                  </div>
                </div>
              </SettingsCard>

              <SaveBar dirty={!!dirty} saving={saving} saved={saved} updatedAt={settings?.updated_at} onSave={handleSave} onDiscard={handleDiscard} />

              <div className="group-head">
                <span className="group-icon"><Target size={16} strokeWidth={2.2} /></span>
                <h2>Mentor 360</h2>
                <div className="group-line" />
              </div>
              <SettingsCard
                id="mentor-360"
                icon={Scale}
                tone="purple"
                title="Business Score Weights"
                badge="Read-only"
                description="How the 8 dimensions combine into the overall Mentor Business Score. Currently fixed in code, not database-backed — shown here for reference until it's made editable."
              >
                {mentorConfig ? (
                  <>
                    <div className="weights">
                      {Object.entries(mentorConfig.dimension_weights).map(([key, weight]) => (
                        <div key={key} className="weight">
                          <div className="weight-top">
                            <span className="weight-label">{key.replace(/_/g, " ")}</span>
                            <span className="weight-value">{weight}%</span>
                          </div>
                          <div className="weight-track"><div className="weight-fill" style={{ width: `${(weight / maxWeight) * 100}%` }} /></div>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="subhead">Classification bands</div>
                      <div className="chips">
                        {mentorConfig.classification_bands.map((b) => (
                          <span key={b.label} className="chip chip-band">{b.label} <b>≥ {b.min_score}</b></span>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="muted">Unable to load — is the backend running?</p>
                )}
              </SettingsCard>

              <div className="group-head">
                <span className="group-icon"><Video size={16} strokeWidth={2.2} /></span>
                <h2>Webinar Operations</h2>
                <div className="group-line" />
              </div>
              <SettingsCard
                id="webinars"
                icon={Tags}
                tone="slate"
                title="Status Vocabularies"
                badge="Read-only"
                description="The fixed status values used across the Webinar Scheduler and Leads pages. Currently fixed in code, not database-backed — shown here for reference until it's made editable."
              >
                {webinarConfig ? (
                  <div className="grid-2">
                    <div>
                      <div className="subhead">Webinar Status</div>
                      <div className="chips">
                        {webinarConfig.webinar_statuses.map((s) => <span key={s} className="chip">{s}</span>)}
                      </div>
                    </div>
                    <div>
                      <div className="subhead">Lead Status</div>
                      <div className="chips">
                        {webinarConfig.lead_statuses.map((s) => <span key={s} className="chip">{s}</span>)}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="muted">Unable to load — is the backend running?</p>
                )}
              </SettingsCard>
            </>
          )}
        </div>

        <style jsx>{`
          .page { margin-left: var(--om-sidebar-width, 280px); transition: margin-left 0.25s ease; padding: 28px 36px 40px; background: #f1f5f9; min-height: 100vh; }

          .hero { position: relative; overflow: hidden; display: flex; align-items: center; justify-content: space-between; gap: 20px; border-radius: 18px; padding: 28px 32px; margin-bottom: 20px; background: linear-gradient(120deg, #0b1220 0%, #16233e 60%, #0b1220 100%); box-shadow: 0 16px 32px -18px rgba(15, 23, 42, 0.55); border: 1px solid rgba(245, 166, 35, 0.12); }
          .hero-blob { position: absolute; width: 260px; height: 260px; border-radius: 50%; background: rgba(245, 166, 35, 0.28); filter: blur(70px); top: -100px; right: 200px; pointer-events: none; }
          .hero-content { position: relative; z-index: 1; }
          .hero-eyebrow { display: inline-block; font-size: 10.5px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: #f5a623; background: rgba(245, 166, 35, 0.12); border: 1px solid rgba(245, 166, 35, 0.3); padding: 5px 11px; border-radius: 999px; margin-bottom: 12px; }
          h1 { margin: 0 0 6px; font-size: 26px; font-weight: 800; color: #f8fafc; }
          .hero-content p { margin: 0; max-width: 620px; font-size: 13.5px; line-height: 1.55; color: #94a3b8; }
          .hero-stat { position: relative; z-index: 1; text-align: center; padding: 14px 26px; border-radius: 14px; background: rgba(34, 197, 94, 0.12); border: 1px solid rgba(34, 197, 94, 0.32); flex-shrink: 0; }
          .hero-stat-muted { background: rgba(245, 158, 11, 0.1); border-color: rgba(245, 158, 11, 0.3); }
          .hero-stat-value { display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 22px; font-weight: 800; color: #4ade80; }
          .hero-stat-muted .hero-stat-value { color: #fbbf24; }
          .hero-dot { width: 9px; height: 9px; border-radius: 50%; background: currentColor; box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.08); }
          .hero-stat-label { font-size: 11px; color: #94a3b8; margin-top: 3px; text-transform: uppercase; letter-spacing: 0.06em; white-space: nowrap; }

          .tiles { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin-bottom: 16px; }

          .jump { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; }
          .jump-label { font-size: 11.5px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; color: #94a3b8; margin-right: 4px; }
          .jump a { font-size: 12.5px; font-weight: 600; color: #334155; background: #fff; border: 1px solid #e2e8f0; border-radius: 999px; padding: 6px 13px; text-decoration: none; transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease; }
          .jump a:hover { border-color: #f59e0b; color: #92400e; background: #fffbeb; }
          .jump a:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.3); }

          .group-head { display: flex; align-items: center; gap: 10px; margin: 10px 0 14px; }
          .group-icon { width: 28px; height: 28px; border-radius: 8px; background: #0f172a; color: #facc15; display: flex; align-items: center; justify-content: center; }
          h2 { margin: 0; font-size: 12.5px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #475569; }
          .group-line { flex: 1; height: 1px; background: #dbe3ee; }

          .grid-2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 22px; align-items: start; }
          .grid-3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 22px; align-items: start; }
          .subhead { font-size: 12px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; color: #64748b; margin-bottom: 10px; }
          .window-bar { margin-top: 16px; }

          .note { display: flex; gap: 10px; align-items: flex-start; padding: 12px 14px; border-radius: 10px; background: #eff6ff; border: 1px solid #dbeafe; color: #1e40af; }
          .note :global(svg) { flex-shrink: 0; margin-top: 2px; }
          .note p { margin: 0; font-size: 12.5px; line-height: 1.55; }
          .note code { background: rgba(37, 99, 235, 0.1); border-radius: 4px; padding: 1px 5px; font-size: 11.5px; }
          .note-inline { margin-top: 10px; }

          .weights { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 12px; }
          .weight { padding: 12px 14px; background: #f8fafc; border: 1px solid #eef2f7; border-radius: 10px; }
          .weight-top { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; }
          .weight-label { font-size: 13px; font-weight: 600; color: #334155; text-transform: capitalize; }
          .weight-value { font-size: 14px; font-weight: 800; color: #0f172a; font-variant-numeric: tabular-nums; }
          .weight-track { height: 6px; border-radius: 999px; background: #e2e8f0; overflow: hidden; }
          .weight-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, #8b5cf6, #6366f1); }

          .chips { display: flex; flex-wrap: wrap; gap: 8px; }
          .chip { background: #eef2ff; color: #3730a3; font-size: 12px; font-weight: 600; padding: 6px 13px; border-radius: 999px; }
          .chip-band { background: #f1f5f9; color: #334155; border: 1px solid #e2e8f0; }
          .chip-band b { color: #0f172a; margin-left: 3px; }
          .muted { margin: 0; font-size: 13px; color: #94a3b8; }

          .state-card { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 50px 20px; background: #fff; border: 1px solid #e6ecf5; border-radius: 16px; text-align: center; color: #b45309; }
          .state-card h3 { margin: 6px 0 0; font-size: 17px; color: #0f172a; }
          .state-card p { margin: 0; font-size: 13px; color: #64748b; }
          .btn-retry { margin-top: 12px; display: inline-flex; align-items: center; gap: 7px; background: #0f172a; color: #facc15; border: none; border-radius: 10px; padding: 10px 18px; font-size: 13px; font-weight: 700; cursor: pointer; }

          .skeletons { display: flex; flex-direction: column; gap: 16px; }
          .sk-tiles { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
          .sk { border-radius: 14px; background: linear-gradient(90deg, #e8edf4 25%, #f3f6fa 50%, #e8edf4 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
          .sk-tile { height: 96px; }
          .sk-card { height: 180px; }
          .sk-card-tall { height: 320px; }
          @keyframes shimmer { to { background-position: -200% 0; } }

          @media (max-width: 1100px) { .tiles, .sk-tiles { grid-template-columns: repeat(2, minmax(0, 1fr)); } .grid-3 { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
          @media (max-width: 800px) {
            .page { padding: 20px 16px 30px; }
            .hero { flex-direction: column; align-items: flex-start; padding: 22px 20px; }
            .grid-2, .grid-3 { grid-template-columns: 1fr; }
          }
          @media (max-width: 520px) { .tiles, .sk-tiles { grid-template-columns: 1fr; } }
        `}</style>
      </>
    </ProtectedRoute>
  );
}
