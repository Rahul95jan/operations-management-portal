import { useId } from "react";
import { AlertTriangle } from "lucide-react";

// A labelled on/off switch. Rendered as a real switch for keyboard and
// screen-reader users; `warning` shows a callout under it.
export default function ToggleRow({ label, description, checked, onChange, warning }) {
  const labelId = useId();
  return (
    <div>
      <div className={`row ${checked ? "row-on" : ""}`}>
        <div className="text">
          <div className="label" id={labelId}>{label}</div>
          {description && <div className="desc">{description}</div>}
        </div>
        <span className={`state ${checked ? "state-on" : ""}`}>{checked ? "On" : "Off"}</span>
        <button type="button" role="switch" aria-checked={!!checked} aria-labelledby={labelId} className={`switch ${checked ? "switch-on" : ""}`} onClick={() => onChange(!checked)}>
          <span className="knob" />
        </button>
      </div>
      {warning && (
        <div className="warning" role="status">
          <AlertTriangle size={15} strokeWidth={2.2} />
          <span>{warning}</span>
        </div>
      )}

      <style jsx>{`
        .row { display: flex; align-items: center; gap: 14px; padding: 14px 16px; border: 1px solid #e6ecf5; border-radius: 12px; background: #f8fafc; transition: background 0.15s ease, border-color 0.15s ease; }
        .row-on { background: #f3fbf6; border-color: #cdeedb; }
        .text { flex: 1; min-width: 0; }
        .label { font-size: 14px; font-weight: 700; color: #0f172a; }
        .desc { font-size: 12px; color: #64748b; margin-top: 2px; }
        .state { font-size: 11px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; color: #94a3b8; }
        .state-on { color: #16a34a; }
        .switch { position: relative; width: 46px; height: 26px; border: none; border-radius: 999px; background: #cbd5e1; cursor: pointer; flex-shrink: 0; transition: background 0.18s ease; }
        .switch:focus-visible { outline: none; box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.3); }
        .switch-on { background: #16a34a; }
        .knob { position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.35); transition: transform 0.18s ease; }
        .switch-on .knob { transform: translateX(20px); }
        .warning { display: flex; gap: 9px; align-items: flex-start; margin-top: 10px; padding: 10px 14px; border-radius: 10px; background: #fffbeb; border: 1px solid #fde68a; color: #92400e; font-size: 12.5px; line-height: 1.5; }
        .warning :global(svg) { flex-shrink: 0; margin-top: 2px; }
      `}</style>
    </div>
  );
}
