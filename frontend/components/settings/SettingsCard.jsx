// Card for one group of settings: icon tile, title, description and an
// optional badge (e.g. "Read-only"), with the controls as children.
export default function SettingsCard({ id, icon: Icon, tone = "amber", title, description, badge, children }) {
  return (
    <section id={id} className="card">
      <header className="card-head">
        <span className={`icon icon-${tone}`}><Icon size={20} strokeWidth={2.1} /></span>
        <div className="titles">
          <h3>{title}</h3>
          {description && <p>{description}</p>}
        </div>
        {badge && <span className="badge">{badge}</span>}
      </header>
      <div className="card-body">{children}</div>

      <style jsx>{`
        .card { background: #fff; border: 1px solid #e6ecf5; border-radius: 16px; box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px -16px rgba(15, 23, 42, 0.12); margin-bottom: 18px; scroll-margin-top: 16px; overflow: hidden; }
        .card-head { display: flex; align-items: flex-start; gap: 14px; padding: 20px 24px 16px; border-bottom: 1px solid #eef2f7; background: linear-gradient(180deg, #fbfcfe, #fff); }
        .icon { width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .icon-amber { background: #fff4d6; color: #b7791f; }
        .icon-blue { background: #e0edff; color: #2563eb; }
        .icon-green { background: #dcfce7; color: #16a34a; }
        .icon-purple { background: #ede9fe; color: #7c3aed; }
        .icon-slate { background: #eef2f7; color: #475569; }
        .titles { flex: 1; min-width: 0; }
        h3 { margin: 0; font-size: 16px; font-weight: 800; color: #0f172a; }
        p { margin: 4px 0 0; font-size: 13px; line-height: 1.55; color: #64748b; max-width: 760px; }
        .badge { flex-shrink: 0; font-size: 11px; font-weight: 700; letter-spacing: 0.03em; text-transform: uppercase; color: #475569; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 999px; padding: 4px 10px; }
        .card-body { padding: 22px 24px 24px; display: flex; flex-direction: column; gap: 22px; }
        @media (max-width: 640px) { .card-head { padding: 16px; flex-wrap: wrap; } .card-body { padding: 18px 16px; } }
      `}</style>
    </section>
  );
}
