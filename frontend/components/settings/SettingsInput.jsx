// Text / number input with an optional unit suffix (e.g. "hours").
export default function SettingsInput({ unit, width, style, ...props }) {
  return (
    <div className="wrap" style={{ maxWidth: width }}>
      <input {...props} className="input" style={style} />
      {unit && <span className="unit">{unit}</span>}

      <style jsx>{`
        .wrap { position: relative; width: 100%; }
        .input { width: 100%; box-sizing: border-box; padding: 11px 14px; border: 1px solid #d9e2ee; border-radius: 10px; background: #fff; font-size: 14px; color: #0f172a; font-family: inherit; outline: none; transition: border-color 0.15s ease, box-shadow 0.15s ease; }
        .input::placeholder { color: #a3b1c4; }
        .input:hover { border-color: #b8c6d9; }
        .input:focus { border-color: #f59e0b; box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.16); }
        .input[type="number"] { padding-right: ${unit ? "64px" : "14px"}; font-variant-numeric: tabular-nums; }
        .unit { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); font-size: 12px; font-weight: 600; color: #94a3b8; pointer-events: none; }
      `}</style>
    </div>
  );
}
