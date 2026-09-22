import { ChevronDown, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Mentor } from "../../lib/mentor360/types";

export default function MentorSelector({ mentors, selectedId, onSelect }: { mentors: Mentor[]; selectedId: string; onSelect: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const selected = mentors.find((m) => m.id === selectedId);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return mentors;
    return mentors.filter((m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q));
  }, [mentors, query]);

  return (
    <div className="relative w-full lg:w-[260px] flex-shrink-0" ref={ref}>
      <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-2">Select Mentor</label>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 bg-white border border-border rounded-xl px-3 py-2.5 text-left shadow-sm"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="font-bold text-navy-900 text-[14px] truncate">{selected?.name ?? "Select mentor"}</span>
        <ChevronDown size={14} className="text-slate-400 flex-shrink-0" />
      </button>

      {open && (
        <div className="absolute z-30 top-[calc(100%+8px)] left-0 right-0 bg-white border border-border rounded-xl shadow-card max-h-80 overflow-y-auto p-1.5">
          <div className="relative mb-1.5">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full text-[12.5px] border border-border rounded-lg pl-7 pr-2 py-1.5 outline-none focus:border-gold"
            />
          </div>
          {filtered.length === 0 ? (
            <div className="text-center text-xs text-slate-400 py-4">No mentors match.</div>
          ) : (
            filtered.map((m) => (
              <button
                key={m.id}
                onClick={() => { onSelect(m.id); setOpen(false); setQuery(""); }}
                className={`w-full flex items-center gap-2.5 rounded-lg px-2 py-2 text-left ${m.id === selectedId ? "bg-gold/10" : "hover:bg-slate-50"}`}
              >
                <span className="w-7 h-7 rounded-full bg-gold/15 text-gold-dark font-bold text-[11px] flex items-center justify-center flex-shrink-0">{m.initials}</span>
                <div className="min-w-0">
                  <div className="text-[13px] font-bold text-navy-900 truncate">{m.name}</div>
                  <div className="text-[11px] text-slate-400 truncate">{m.email}</div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
