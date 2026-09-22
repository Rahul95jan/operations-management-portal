import { ChevronDown, Download } from "lucide-react";
import { useEffect, useRef, useState } from "react";

function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const lines = rows.map((r) => headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(","));
  return [headers.join(","), ...lines].join("\n");
}

// Respects "the currently active tab and filters" by taking a lazy row
// getter from the page — whichever tab is open supplies its own rows.
export default function MentorExportMenu({ filenamePrefix, getExportRows }: { filenamePrefix: string; getExportRows: () => Record<string, unknown>[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const downloadCsv = () => {
    const rows = getExportRows();
    if (!rows.length) {
      alert("Nothing to export for the current tab yet.");
      return;
    }
    const csv = toCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((v) => !v)} className="inline-flex items-center gap-2 bg-gold hover:bg-gold-dark text-navy-900 font-bold text-sm rounded-lg px-4 py-2.5 shadow-sm">
        <Download size={15} strokeWidth={2.3} /> Export <ChevronDown size={13} strokeWidth={2.5} />
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] bg-white border border-border rounded-lg shadow-card min-w-[190px] z-30 p-1">
          <button onClick={() => alert("PDF export is not wired up in this prototype yet.")} className="block w-full text-left text-[13px] font-semibold text-slate-400 hover:bg-slate-50 rounded-md px-3 py-2">
            Export as PDF
          </button>
          <button onClick={() => alert("Excel export is not wired up in this prototype yet.")} className="block w-full text-left text-[13px] font-semibold text-slate-400 hover:bg-slate-50 rounded-md px-3 py-2">
            Export as Excel
          </button>
          <button onClick={downloadCsv} className="block w-full text-left text-[13px] font-semibold text-navy-900 hover:bg-slate-50 rounded-md px-3 py-2">
            Export as CSV
          </button>
        </div>
      )}
    </div>
  );
}
