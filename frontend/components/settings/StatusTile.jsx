const TONES = {
  green: { dot: "#16a34a", bg: "#ecfdf3", text: "#15803d" },
  amber: { dot: "#f59e0b", bg: "#fffbeb", text: "#b45309" },
  slate: { dot: "#94a3b8", bg: "#f1f5f9", text: "#475569" },
};

// One tile in the summary strip at the top of the page.
export default function StatusTile({ icon: Icon, label, value, sub, tone = "slate" }) {
  const t = TONES[tone] || TONES.slate;
  return (
    <div className="tile">
      <div className="top">
        <span className="icon" style={{ background: t.bg, color: t.text }}><Icon size={17} strokeWidth={2.2} /></span>
        <span className="label">{label}</span>
        <span className="dot" style={{ background: t.dot }} />
      </div>
      <div className="value" style={{ color: t.text }}>{value}</div>
      {sub && <div className="sub">{sub}</div>}

      <style jsx>{`
        .tile { background: #fff; border: 1px solid #e6ecf5; border-radius: 14px; padding: 14px 16px; box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04); min-width: 0; }
        .top { display: flex; align-items: center; gap: 10px; }
        .icon { width: 30px; height: 30px; border-radius: 9px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .label { flex: 1; font-size: 11.5px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; box-shadow: 0 0 0 3px rgba(148, 163, 184, 0.15); }
        .value { font-size: 20px; font-weight: 800; margin-top: 10px; line-height: 1.2; font-variant-numeric: tabular-nums; }
        .sub { font-size: 12px; color: #64748b; margin-top: 3px; }
      `}</style>
    </div>
  );
}
