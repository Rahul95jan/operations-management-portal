const HOURS = Array.from({ length: 24 }, (_, i) => i);
const pad = (n) => String(n).padStart(2, "0");

// 24-hour track showing when automatic reminders are allowed to go out.
// A start >= end window is treated as misconfigured by the backend, which
// then fails open (reminders may fire at any hour) — the bar says so.
export default function ReminderWindowBar({ start, end, timezone }) {
  const s = Number(start);
  const e = Number(end);
  const valid = Number.isFinite(s) && Number.isFinite(e) && s >= 0 && e <= 24 && s < e;

  return (
    <div className="bar-wrap">
      <div className="track" aria-hidden="true">
        {HOURS.map((h) => (
          <span key={h} className={`cell ${valid && h >= s && h < e ? "cell-on" : ""}`} />
        ))}
      </div>
      <div className="ticks" aria-hidden="true">
        {[0, 6, 12, 18, 24].map((h) => <span key={h}>{pad(h)}:00</span>)}
      </div>
      <p className="summary">
        {valid
          ? `Reminders can go out between ${pad(s)}:00 and ${pad(e)}:00${timezone ? ` (${timezone})` : ""}.`
          : "The window isn't valid (start must be before end), so reminders can currently be sent at any hour."}
      </p>

      <style jsx>{`
        .bar-wrap { padding: 14px 16px; border: 1px solid #e6ecf5; border-radius: 12px; background: #f8fafc; }
        .track { display: grid; grid-template-columns: repeat(24, 1fr); gap: 3px; }
        .cell { height: 14px; border-radius: 4px; background: #dfe7f1; }
        .cell-on { background: linear-gradient(180deg, #fbbf24, #f59e0b); }
        .ticks { display: flex; justify-content: space-between; margin-top: 6px; font-size: 10.5px; color: #94a3b8; font-variant-numeric: tabular-nums; }
        .summary { margin: 10px 0 0; font-size: 12.5px; color: #475569; }
      `}</style>
    </div>
  );
}
