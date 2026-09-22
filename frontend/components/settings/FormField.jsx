// Label + control + optional hint. The label wraps the control so clicking it
// focuses the input.
export default function FormField({ label, hint, children }) {
  return (
    <div className="field">
      <label>
        <span className="label">{label}</span>
        {children}
      </label>
      {hint && <p className="hint">{hint}</p>}

      <style jsx>{`
        .field { min-width: 0; }
        label { display: flex; flex-direction: column; gap: 7px; }
        .label { font-size: 13px; font-weight: 700; color: #1e293b; }
        .hint { margin: 7px 0 0; font-size: 12px; line-height: 1.5; color: #94a3b8; }
      `}</style>
    </div>
  );
}
