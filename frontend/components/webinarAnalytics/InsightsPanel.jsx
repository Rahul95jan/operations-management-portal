import { Lightbulb } from "lucide-react";
import CardShell from "./CardShell";
import { INSIGHT_ICONS } from "./insightIcons";
import { tone } from "./tones";

// Tiny bars drawn from the real attendance series (decorative context only).
function MiniBars({ series, color }) {
  if (!series || series.length < 2) return null;
  const max = Math.max(...series, 1);
  return (
    <div className="mini" aria-hidden="true">
      {series.slice(0, 8).map((v, i) => (
        <span key={i} style={{ height: `${Math.max(12, (v / max) * 100)}%`, background: color }} />
      ))}
      <style jsx>{`
        .mini { position: absolute; right: 14px; bottom: 10px; display: flex; align-items: flex-end; gap: 3px; height: 22px; opacity: 0.55; }
        .mini span { width: 5px; border-radius: 1px; }
      `}</style>
    </div>
  );
}

export default function InsightsPanel({ insights }) {
  return (
    <CardShell
      icon={Lightbulb}
      iconColor="#f59e0b"
      title="Webinar Insights"
      subtitle="Key insights derived from your webinar data"
      right={<span className="count">{insights.length} insights</span>}
    >
      <div className="grid">
        {insights.map((item) => {
          const t = tone(item.tone);
          const Icon = INSIGHT_ICONS[item.icon] || Lightbulb;
          return (
            <article key={item.key} className="insight" style={{ background: t.soft, borderColor: t.border }}>
              <span className="insight-icon" style={{ background: "#fff", color: t.fg, borderColor: t.border }}>
                <Icon size={18} strokeWidth={2.2} />
              </span>
              <div className="insight-body">
                <h3 style={{ color: t.fg }}>{item.title}</h3>
                <p>{item.text}</p>
              </div>
              <MiniBars series={item.series} color={t.bar} />
            </article>
          );
        })}
      </div>

      <style jsx>{`
        .count { background: #eff6ff; color: #2563eb; font-size: 12px; font-weight: 700; padding: 6px 12px; border-radius: 8px; white-space: nowrap; }
        .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
        .insight { position: relative; display: flex; gap: 12px; border: 1px solid; border-radius: 10px; padding: 14px 14px 16px; min-height: 112px; }
        .insight-icon { width: 36px; height: 36px; border-radius: 50%; border: 1px solid; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .insight-body { min-width: 0; padding-right: 8px; }
        h3 { margin: 0 0 4px; font-size: 13px; font-weight: 800; }
        p { margin: 0; font-size: 12px; line-height: 1.5; color: #475569; }
        @media (max-width: 1100px) { .grid { grid-template-columns: 1fr; } }
      `}</style>
    </CardShell>
  );
}
