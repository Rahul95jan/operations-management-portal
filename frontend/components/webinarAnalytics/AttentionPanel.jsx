import { Target, AlertCircle, AlertTriangle, CheckCircle2, ChevronRight } from "lucide-react";
import CardShell from "./CardShell";
import { tone } from "./tones";

const ICONS = { red: AlertCircle, amber: AlertTriangle, orange: AlertTriangle, green: CheckCircle2 };

export default function AttentionPanel({ items, healthStatus, expanded, onToggle, limit = 3 }) {
  const visible = expanded ? items : items.slice(0, limit);
  const hidden = items.length - visible.length;

  return (
    <CardShell
      icon={Target}
      iconColor="#dc2626"
      title="What Needs Attention"
      subtitle={healthStatus ? `Based on current data analysis · Overall health: ${healthStatus}` : "Based on current data analysis"}
      right={
        items.length > limit ? (
          <button className="details-btn" onClick={onToggle}>{expanded ? "Show Less" : `View Details${hidden > 0 ? ` (+${hidden})` : ""}`}</button>
        ) : null
      }
    >
      <div className="list">
        {visible.map((item) => {
          const t = tone(item.tone);
          const Icon = ICONS[item.tone] || AlertCircle;
          return (
            <div key={item.key} className="row">
              <span className="row-icon" style={{ background: t.soft, color: t.fg, borderColor: t.border }}>
                <Icon size={22} strokeWidth={2.1} />
              </span>
              <div className="row-body">
                <h3 style={{ color: t.fg }}>{item.title}</h3>
                <p>{item.text}</p>
              </div>
              <ChevronRight size={16} className="chev" />
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .details-btn { border: 1px solid #e2e8f0; background: #fff; color: #1e293b; font-size: 12px; font-weight: 700; padding: 7px 14px; border-radius: 8px; cursor: pointer; white-space: nowrap; }
        .details-btn:hover { background: #f8fafc; }
        .list { display: flex; flex-direction: column; gap: 10px; }
        .row { display: flex; align-items: center; gap: 14px; border: 1px solid #e8edf5; border-radius: 10px; padding: 12px 14px; background: #fff; }
        .row-icon { width: 44px; height: 44px; border-radius: 50%; border: 1px solid; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .row-body { flex: 1; min-width: 0; }
        h3 { margin: 0 0 3px; font-size: 13px; font-weight: 800; }
        p { margin: 0; font-size: 12px; line-height: 1.5; color: #475569; }
        .row :global(.chev) { color: #64748b; flex-shrink: 0; }
      `}</style>
    </CardShell>
  );
}
