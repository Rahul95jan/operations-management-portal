import { tone } from "./tones";

// One KPI in the dashboard's summary row: tinted icon, small-caps label and a
// large coloured value, on a card with a coloured left edge.
export default function KpiTile({ icon: Icon, label, value, suffix, color = "blue" }) {
  const t = tone(color);
  return (
    <div className="kpi-tile" style={{ borderLeftColor: t.fg }}>
      <span className="kpi-icon" style={{ background: t.soft, color: t.fg }}>
        <Icon size={20} strokeWidth={2.1} />
      </span>
      <div className="kpi-body">
        <div className="kpi-label">{label}</div>
        <div className="kpi-value" style={{ color: t.fg }}>{value}{suffix && <span className="kpi-suffix">{suffix}</span>}</div>
      </div>

      <style jsx>{`
        .kpi-tile {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #fff;
          border: 1px solid #e8edf5;
          border-left-width: 3px;
          border-radius: 12px;
          padding: 12px 12px;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
          min-width: 0;
        }
        .kpi-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .kpi-body { min-width: 0; }
        .kpi-label { font-size: 9.5px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: #64748b; line-height: 1.25; }
        .kpi-suffix { font-size: 12px; font-weight: 700; color: #64748b; margin-left: 3px; }
        .kpi-value { font-size: 20px; font-weight: 800; line-height: 1.2; margin-top: 3px; font-variant-numeric: tabular-nums; white-space: nowrap; }
      `}</style>
    </div>
  );
}
