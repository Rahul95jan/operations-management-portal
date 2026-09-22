import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FolderKanban } from "lucide-react";
import { useEffect } from "react";
import SectionCard from "../../opsIntel/SectionCard";
import { getBatches } from "../../../lib/mentor360/mentorService";

export default function BatchesTab({ mentorId, onDataChange }: { mentorId: string; onDataChange: (rows: Record<string, unknown>[]) => void }) {
  const queryClient = useQueryClient();
  const batchesQ = useQuery({ queryKey: ["mentor360", "batches", mentorId], queryFn: () => getBatches(mentorId) });

  useEffect(() => {
    if (batchesQ.data) onDataChange(batchesQ.data as unknown as Record<string, unknown>[]);
  }, [batchesQ.data]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SectionCard
      icon={FolderKanban}
      iconColor="#16A34A"
      title="Batches"
      subtitle="Batches this mentor is currently assigned to"
      isLoading={batchesQ.isLoading}
      isError={batchesQ.isError}
      onRetry={() => queryClient.invalidateQueries({ queryKey: ["mentor360", "batches"] })}
      isEmpty={batchesQ.data?.length === 0}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {batchesQ.data?.map((b) => (
          <div key={b.id} className="border border-border rounded-lg p-3.5">
            <div className="font-bold text-navy-900 text-[13.5px] mb-0.5">{b.name}</div>
            <div className="text-[11.5px] text-slate-400 mb-3">{b.course}</div>
            <div className="flex items-center justify-between text-[12px] text-slate-500 mb-1.5">
              <span>{b.learners} learners</span>
              <span className="font-bold text-navy-900">{b.progressPct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden mb-3">
              <div className="h-full rounded-full bg-gold" style={{ width: `${b.progressPct}%` }} />
            </div>
            <div className="text-[11px] text-slate-400">
              {new Date(b.startDate).toLocaleDateString(undefined, { month: "short", year: "numeric" })} – {new Date(b.endDate).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
