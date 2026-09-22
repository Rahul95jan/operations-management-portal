import { ChevronDown, Download } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SessionRecord } from "../../lib/opsIntel/types";

function toCsv(rows: SessionRecord[]): string {
  const headers = ["Date", "Session", "Mentor", "Batch", "Course", "Learners", "Attendance %", "Rating", "Duration", "Recording", "Report", "SLA", "Status"];
  const lines = rows.map((r) =>
    [
      new Date(r.dateTime).toLocaleString(),
      r.topic,
      r.mentorName,
      r.batchName,
      r.courseName,
      r.learners,
      r.attendancePct ?? "",
      r.rating ?? "",
      r.durationMinutes,
      r.recording,
      r.report,
      r.sla,
      r.status,
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );
  return [headers.join(","), ...lines].join("\n");
}

export default function ExportMenu({ rows }: { rows: SessionRecord[] }) {
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
    const csv = toCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `session-operations-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 bg-gold hover:bg-gold-dark text-navy-900 font-bold text-sm rounded-lg px-4 py-2.5 shadow-sm transition-colors"
      >
        <Download size={15} strokeWidth={2.3} /> Export Report <ChevronDown size={13} strokeWidth={2.5} />
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] bg-white border border-border rounded-lg shadow-card min-w-[190px] z-30 p-1">
          <button onClick={downloadCsv} className="block w-full text-left text-[13px] font-semibold text-navy-900 hover:bg-slate-50 rounded-md px-3 py-2">
            Export as CSV
          </button>
          <button
            onClick={() => alert("PDF export is not wired up in this prototype yet — CSV export uses the real in-memory session data.")}
            className="block w-full text-left text-[13px] font-semibold text-slate-400 hover:bg-slate-50 rounded-md px-3 py-2"
          >
            Export as PDF
          </button>
          <button
            onClick={() => alert("Excel export is not wired up in this prototype yet — CSV export uses the real in-memory session data.")}
            className="block w-full text-left text-[13px] font-semibold text-slate-400 hover:bg-slate-50 rounded-md px-3 py-2"
          >
            Export as Excel
          </button>
        </div>
      )}
    </div>
  );
}
