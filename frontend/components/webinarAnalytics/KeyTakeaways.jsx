import { BookOpen } from "lucide-react";
import CardShell from "./CardShell";
import { INSIGHT_ICONS } from "./insightIcons";
import { tone } from "./tones";

export default function KeyTakeaways({ items }) {
  return (
    <CardShell icon={BookOpen} iconColor="#2563eb" title="Key Takeaways" subtitle="Actionable insights from your webinar performance">
      <div className="grid">
        {items.map((item, i) => {
          const t = tone(item.tone);
          const Icon = INSIGHT_ICONS[item.icon] || BookOpen;
          return (
            <article key={item.key} className="take" style={{ background: t.soft, borderColor: t.border }}>
              <span className="num" style={{ color: t.fg }}>{String(i + 1).padStart(2, "0")}</span>
              <div className="take-body">
                <h3 style={{ color: t.fg }}>{item.title}</h3>
                <p>{item.text}</p>
              </div>
              <Icon size={17} strokeWidth={2.2} className="take-icon" style={{ color: t.fg }} />
            </article>
          );
        })}
      </div>

      <style jsx>{`
        .grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
        .take { position: relative; display: flex; align-items: flex-start; gap: 12px; border: 1px solid; border-radius: 10px; padding: 14px 16px; min-height: 84px; }
        .num { font-size: 26px; font-weight: 800; line-height: 1; background: #fff; border-radius: 8px; padding: 8px 9px; box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06); flex-shrink: 0; }
        .take-body { min-width: 0; padding-right: 18px; }
        h3 { margin: 0 0 4px; font-size: 13px; font-weight: 800; }
        p { margin: 0; font-size: 11.5px; line-height: 1.5; color: #475569; }
        .take :global(.take-icon) { position: absolute; top: 12px; right: 12px; }
        @media (max-width: 1200px) { .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 700px) { .grid { grid-template-columns: 1fr; } }
      `}</style>
    </CardShell>
  );
}
