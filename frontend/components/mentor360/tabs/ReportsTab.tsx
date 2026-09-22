import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, FileText, RefreshCw } from "lucide-react";
import { useEffect } from "react";
import SectionCard from "../../opsIntel/SectionCard";
import StatusPill from "../../opsIntel/StatusPill";
import { getReports } from "../../../lib/mentor360/mentorService";

export default function ReportsTab({ mentorId, onDataChange }: { mentorId: string; onDataChange: (rows: Record<string, unknown>[]) => void }) {
  const queryClient = useQueryClient();
  const reportsQ = useQuery({ queryKey: ["mentor360", "reports", mentorId], queryFn: () => getReports(mentorId) });

  useEffect(() => {
    if (reportsQ.data) onDataChange(reportsQ.data as unknown as Record<string, unknown>[]);
  }, [reportsQ.data]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SectionCard
      icon={FileText}
      iconColor="#2563EB"
      title="Reports"
      subtitle="Downloadable and scheduled reports for this mentor"
      isLoading={reportsQ.isLoading}
      isError={reportsQ.isError}
      onRetry={() => queryClient.invalidateQueries({ queryKey: ["mentor360", "reports"] })}
      isEmpty={reportsQ.data?.length === 0}
    >
      <div className="flex flex-col divide-y divide-slate-50">
        {reportsQ.data?.map((r) => (
          <div key={r.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <div className="font-bold text-navy-900 text-[13px]">{r.name}</div>
              <div className="text-[11px] text-slate-400">
                {r.type} · {r.generatedDate ? new Date(r.generatedDate).toLocaleDateString() : "Not generated yet"}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <StatusPill label={r.status} />
              {r.status === "Ready" ? (
                <button
                  onClick={() => alert(`This is a prototype — "${r.name}" isn't a real generated file yet.`)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-navy-900 bg-slate-100 hover:bg-slate-200 rounded-lg px-3 py-1.5"
                >
                  <Download size={12} /> Download
                </button>
              ) : (
                <button
                  onClick={() => alert("Report generation is not wired up in this prototype yet.")}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-navy-900 bg-slate-100 hover:bg-slate-200 rounded-lg px-3 py-1.5"
                >
                  <RefreshCw size={12} /> Generate
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
