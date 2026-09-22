// Standard white dashboard panel: icon + title/subtitle header with an
// optional control on the right.
export default function CardShell({ icon: Icon, iconColor = "#2563eb", title, subtitle, right, children, className = "" }) {
  return (
    <section className={`shell ${className}`}>
      <header className="shell-head">
        <div className="shell-title-row">
          {Icon && (
            <span className="shell-icon" style={{ color: iconColor }}>
              <Icon size={20} strokeWidth={2.1} />
            </span>
          )}
          <div>
            <h2 className="shell-title">{title}</h2>
            {subtitle && <div className="shell-sub">{subtitle}</div>}
          </div>
        </div>
        {right}
      </header>
      {children}

      <style jsx>{`
        .shell { background: #fff; border: 1px solid #e8edf5; border-radius: 14px; padding: 18px 20px; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05); min-width: 0; }
        .shell-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
        .shell-title-row { display: flex; align-items: flex-start; gap: 10px; min-width: 0; }
        .shell-icon { margin-top: 1px; flex-shrink: 0; display: flex; }
        .shell-title { margin: 0; font-size: 16px; font-weight: 800; color: #0f172a; line-height: 1.25; }
        .shell-sub { font-size: 11.5px; color: #64748b; margin-top: 3px; }
      `}</style>
    </section>
  );
}
