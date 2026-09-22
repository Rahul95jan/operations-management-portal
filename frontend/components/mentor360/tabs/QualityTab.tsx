import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardCheck, Star } from "lucide-react";
import { useEffect } from "react";
import SectionCard from "../../opsIntel/SectionCard";
import { getQualityAudits } from "../../../lib/mentor360/mentorService";

export default function QualityTab({ mentorId, onDataChange }: { mentorId: string; onDataChange: (rows: Record<string, unknown>[]) => void }) {
  const queryClient = useQueryClient();
  const auditsQ = useQuery({ queryKey: ["mentor360", "qualityAudits", mentorId], queryFn: () => getQualityAudits(mentorId) });

  useEffect(() => {
    if (auditsQ.data) onDataChange(auditsQ.data as unknown as Record<string, unknown>[]);
  }, [auditsQ.data]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SectionCard
      icon={ClipboardCheck}
      iconColor="#F5B82E"
      title="Quality Audits"
      subtitle="Periodic reviews by Operations and Academic leadership"
      isLoading={auditsQ.isLoading}
      isError={auditsQ.isError}
      onRetry={() => queryClient.invalidateQueries({ queryKey: ["mentor360", "qualityAudits"] })}
      isEmpty={auditsQ.data?.length === 0}
    >
      <div className="flex flex-col divide-y divide-slate-50">
        {auditsQ.data?.map((audit) => (
          <div key={audit.id} className="py-4 first:pt-0 last:pb-0">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <div className="font-bold text-navy-900 text-[13.5px]">{audit.reviewer}</div>
                <div className="text-[11px] text-slate-400">{new Date(audit.date).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}</div>
              </div>
              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-600 font-bold text-[13px] rounded-full px-3 py-1">
                <Star size={13} fill="currentColor" /> {audit.score} / 5
              </span>
            </div>
            <p className="text-[12.5px] text-slate-500 mt-2">{audit.notes}</p>
            {audit.improvementAreas.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {audit.improvementAreas.map((area) => (
                  <span key={area} className="text-[11px] font-semibold bg-slate-100 text-slate-600 rounded-full px-2.5 py-1">
                    {area}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
