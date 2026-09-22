import { RotateCcw } from "lucide-react";
import { Course, Filters, Mentor } from "../../lib/opsIntel/types";
import { batchesForCourse, BATCHES } from "../../lib/opsIntel/mockData";
import ExportMenu from "./ExportMenu";
import { SessionRecord } from "../../lib/opsIntel/types";

const DATE_RANGE_OPTIONS: { value: Filters["dateRange"]; label: string }[] = [
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
  { value: "thisMonth", label: "This Month" },
  { value: "custom", label: "Custom Range" },
];

const selectClass =
  "text-[13px] font-semibold text-navy-900 bg-white border border-border rounded-lg px-3 py-2 outline-none focus:border-gold min-w-[140px]";

interface FilterBarProps {
  filters: Filters;
  onChange: (next: Filters) => void;
  onReset: () => void;
  courses: Course[];
  mentors: Mentor[];
  sessionTypes: string[];
  exportRows: SessionRecord[];
}

export default function FilterBar({ filters, onChange, onReset, courses, mentors, sessionTypes, exportRows }: FilterBarProps) {
  const availableBatches = batchesForCourse(filters.courseId) ?? BATCHES;

  const set = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    const next = { ...filters, [key]: value };
    if (key === "courseId") next.batchId = ""; // batch list narrows with course, so reset selection
    onChange(next);
  };

  return (
    <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border border-border rounded-card shadow-card p-3.5 mb-5 flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-[10.5px] font-bold uppercase tracking-wide text-slate-500">Date Range</label>
        <select className={selectClass} value={filters.dateRange} onChange={(e) => set("dateRange", e.target.value as Filters["dateRange"])}>
          {DATE_RANGE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {filters.dateRange === "custom" && (
        <>
          <div className="flex flex-col gap-1">
            <label className="text-[10.5px] font-bold uppercase tracking-wide text-slate-500">From</label>
            <input type="date" className={selectClass} value={filters.customFrom ?? ""} onChange={(e) => set("customFrom", e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10.5px] font-bold uppercase tracking-wide text-slate-500">To</label>
            <input type="date" className={selectClass} value={filters.customTo ?? ""} onChange={(e) => set("customTo", e.target.value)} />
          </div>
        </>
      )}

      <div className="flex flex-col gap-1">
        <label className="text-[10.5px] font-bold uppercase tracking-wide text-slate-500">Course</label>
        <select className={selectClass} value={filters.courseId} onChange={(e) => set("courseId", e.target.value)}>
          <option value="">All Courses</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10.5px] font-bold uppercase tracking-wide text-slate-500">Batch</label>
        <select className={selectClass} value={filters.batchId} onChange={(e) => set("batchId", e.target.value)}>
          <option value="">All Batches</option>
          {availableBatches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10.5px] font-bold uppercase tracking-wide text-slate-500">Mentor</label>
        <select className={selectClass} value={filters.mentorId} onChange={(e) => set("mentorId", e.target.value)}>
          <option value="">All Mentors</option>
          {mentors.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10.5px] font-bold uppercase tracking-wide text-slate-500">Session Type</label>
        <select className={selectClass} value={filters.sessionType} onChange={(e) => set("sessionType", e.target.value)}>
          <option value="">All Types</option>
          {sessionTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <button onClick={onReset} className="inline-flex items-center gap-1.5 text-[13px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg px-3.5 py-2.5">
          <RotateCcw size={13} strokeWidth={2.5} /> Reset Filters
        </button>
        <ExportMenu rows={exportRows} />
      </div>
    </div>
  );
}
