import { CheckCircle2, Loader2, Save, Undo2 } from "lucide-react";

// Sticky action bar: shows whether there are unsaved changes and holds the
// Discard / Save buttons.
export default function SaveBar({ dirty, saving, saved, updatedAt, onSave, onDiscard }) {
  return (
    <div className={`bar ${dirty ? "bar-dirty" : ""}`}>
      <div className="status" aria-live="polite">
        {dirty ? (
          <><span className="pulse" /> You have unsaved changes</>
        ) : saved ? (
          <span className="ok"><CheckCircle2 size={16} /> Settings saved</span>
        ) : (
          <span className="idle">All changes saved</span>
        )}
        {updatedAt && <span className="updated">Last updated {new Date(updatedAt).toLocaleString()}</span>}
      </div>
      <div className="buttons">
        <button type="button" className="btn btn-ghost" onClick={onDiscard} disabled={!dirty || saving}>
          <Undo2 size={15} /> Discard
        </button>
        <button type="button" className="btn btn-save" onClick={onSave} disabled={saving || !dirty}>
          {saving ? <><Loader2 size={15} className="spin" /> Saving…</> : <><Save size={15} /> Save Settings</>}
        </button>
      </div>

      <style jsx>{`
        .bar { position: sticky; bottom: 14px; z-index: 20; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin: 6px 0 30px; padding: 12px 16px 12px 20px; background: rgba(255, 255, 255, 0.92); backdrop-filter: blur(8px); border: 1px solid #e6ecf5; border-radius: 14px; box-shadow: 0 10px 30px -14px rgba(15, 23, 42, 0.35); transition: border-color 0.2s ease, box-shadow 0.2s ease; }
        .bar-dirty { border-color: #fcd34d; box-shadow: 0 10px 30px -12px rgba(245, 158, 11, 0.5); }
        .status { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; font-size: 13.5px; font-weight: 700; color: #92400e; }
        .pulse { width: 9px; height: 9px; border-radius: 50%; background: #f59e0b; box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.6); animation: pulse 1.6s infinite; }
        .ok { display: inline-flex; align-items: center; gap: 6px; color: #16a34a; }
        .idle { color: #475569; }
        .updated { font-size: 12px; font-weight: 500; color: #94a3b8; }
        .buttons { display: flex; gap: 10px; }
        .btn { display: inline-flex; align-items: center; gap: 7px; border-radius: 10px; padding: 10px 18px; font-size: 13.5px; font-weight: 700; cursor: pointer; border: 1px solid transparent; transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease; }
        .btn:disabled { cursor: not-allowed; }
        .btn:focus-visible { outline: none; box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.3); }
        .btn-ghost { background: #fff; color: #334155; border-color: #d9e2ee; }
        .btn-ghost:hover:not(:disabled) { background: #f1f5f9; }
        .btn-ghost:disabled { color: #a3b1c4; }
        .btn-save { background: linear-gradient(120deg, #0f172a, #1e293b); color: #facc15; box-shadow: 0 6px 16px -6px rgba(15, 23, 42, 0.5); }
        .btn-save:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 10px 20px -6px rgba(15, 23, 42, 0.6); }
        .btn-save:disabled { background: #cbd5e1; color: #f8fafc; box-shadow: none; }
        .btn :global(.spin) { animation: spin 0.9s linear infinite; }
        @keyframes pulse { 70% { box-shadow: 0 0 0 8px rgba(245, 158, 11, 0); } 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 640px) { .buttons { width: 100%; } .btn { flex: 1; justify-content: center; } }
      `}</style>
    </div>
  );
}
