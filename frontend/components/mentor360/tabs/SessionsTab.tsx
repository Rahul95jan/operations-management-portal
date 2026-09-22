import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef, SortingState } from "@tanstack/react-table";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import DataTable from "../../opsIntel/DataTable";
import StatusPill from "../../opsIntel/StatusPill";
import { getSessions } from "../../../lib/mentor360/mentorService";
import type { MentorSessionRow, SessionRowStatus } from "../../../lib/mentor360/types";

export default function SessionsTab({ mentorId, onDataChange }: { mentorId: string; onDataChange: (rows: Record<string, unknown>[]) => void }) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<SessionRowStatus | "">("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "date", desc: true }]);

  const sortBy = (sorting[0]?.id ?? "date") as keyof MentorSessionRow;
  const sortDir = sorting[0]?.desc ? "desc" : "asc";

  const sessionsQ = useQuery({
    queryKey: ["mentor360", "sessions", mentorId, page, pageSize, search, status, sortBy, sortDir],
    queryFn: () => getSessions({ id: mentorId, page, pageSize, search, sortBy, sortDir, status }),
    placeholderData: (prev) => prev,
  });

  useEffect(() => {
    if (sessionsQ.data) onDataChange(sessionsQ.data.rows as unknown as Record<string, unknown>[]);
  }, [sessionsQ.data]); // eslint-disable-line react-hooks/exhaustive-deps

  const columns = useMemo<ColumnDef<MentorSessionRow>[]>(
    () => [
      { accessorKey: "date", header: "Date", cell: (i) => new Date(i.getValue() as string).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }) },
      { accessorKey: "title", header: "Title", cell: (i) => <span className="font-semibold text-navy-900">{i.getValue() as string}</span> },
      { accessorKey: "batch", header: "Batch" },
      { accessorKey: "durationMinutes", header: "Duration", cell: (i) => `${i.getValue()} min` },
      { accessorKey: "attendees", header: "Attendees" },
      { accessorKey: "rating", header: "Rating", cell: (i) => (i.getValue() !== null ? `${i.getValue()} / 5` : <span className="text-slate-300">N/A</span>) },
      { accessorKey: "status", header: "Status", cell: (i) => <StatusPill label={i.getValue() as string} /> },
    ],
    []
  );

  const totalPages = sessionsQ.data ? Math.max(1, Math.ceil(sessionsQ.data.total / pageSize)) : 1;

  return (
    <div className="bg-white border border-border rounded-card shadow-card p-4 sm:p-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="font-extrabold text-navy-900 text-[15.5px]">Sessions</h2>
          <p className="text-[11.5px] text-slate-400">All sessions conducted or scheduled by this mentor</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={status} onChange={(e) => { setStatus(e.target.value as SessionRowStatus | ""); setPage(1); }} className="text-[13px] font-semibold border border-border rounded-lg px-2.5 py-2 outline-none">
            <option value="">All Status</option>
            <option value="Completed">Completed</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => { setPage(1); setSearch(e.target.value); }}
              placeholder="Search sessions…"
              className="text-[13px] border border-border rounded-lg pl-8 pr-3 py-2 w-52 outline-none focus:border-gold"
            />
          </div>
        </div>
      </div>

      {sessionsQ.isLoading && !sessionsQ.data ? (
        <div className="animate-pulse h-56 bg-slate-100 rounded-lg" />
      ) : sessionsQ.isError ? (
        <div className="text-center py-10 text-status-critical font-semibold">
          Couldn&apos;t load sessions.{" "}
          <button onClick={() => queryClient.invalidateQueries({ queryKey: ["mentor360", "sessions"] })} className="underline">
            Retry
          </button>
        </div>
      ) : (
        <>
          <DataTable columns={columns} data={sessionsQ.data?.rows ?? []} manualSorting sorting={sorting} onSortingChange={setSorting} rowKey={(r) => r.id} />
          <div className="flex items-center justify-between mt-4 text-[12.5px]">
            <span className="text-slate-500">
              Showing {sessionsQ.data ? Math.min((page - 1) * pageSize + 1, sessionsQ.data.total) : 0}–{sessionsQ.data ? Math.min(page * pageSize, sessionsQ.data.total) : 0} of {sessionsQ.data?.total ?? 0}
            </span>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="font-bold text-slate-600 disabled:opacity-30 px-2 py-1">
                Previous
              </button>
              <span className="font-bold text-navy-900">{page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="font-bold text-slate-600 disabled:opacity-30 px-2 py-1">
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
