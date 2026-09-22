import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertOctagon, ShieldCheck } from "lucide-react";
import { useEffect } from "react";
import SectionCard from "../../opsIntel/SectionCard";
import TrendBadge from "../../opsIntel/TrendBadge";
import { getOperations } from "../../../lib/mentor360/mentorService";

export default function OperationsTab({ mentorId, onDataChange }: { mentorId: string; onDataChange: (rows: Record<string, unknown>[]) => void }) {
  const queryClient = useQueryClient();
  const opsQ = useQuery({ queryKey: ["mentor360", "operations", mentorId], queryFn: () => getOperations(mentorId) });

  useEffect(() => {
    if (opsQ.data) onDataChange(opsQ.data.escalations as unknown as Record<string, unknown>[]);
  }, [opsQ.data]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <SectionCard
        icon={ShieldCheck}
        iconColor="#16A34A"
        title="Operational Metrics"
        subtitle="Punctuality, reschedules, cancellations and SLA — last 30 days"
        isLoading={opsQ.isLoading}
        isError={opsQ.isError}
        onRetry={() => queryClient.invalidateQueries({ queryKey: ["mentor360", "operations"] })}
      >
        {opsQ.data && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xl font-extrabold text-navy-900">{opsQ.data.punctualityPct}%</div>
              <div className="text-[10.5px] font-bold uppercase text-slate-400 mb-1">Punctuality</div>
              <TrendBadge trend={opsQ.data.punctualityTrend} compact suffix=" pts" />
            </div>
            <div>
              <div className="text-xl font-extrabold text-navy-900">{opsQ.data.reschedules}</div>
              <div className="text-[10.5px] font-bold uppercase text-slate-400 mb-1">Reschedules</div>
              <TrendBadge trend={opsQ.data.reschedulesTrend} compact />
            </div>
            <div>
              <div className="text-xl font-extrabold text-navy-900">{opsQ.data.cancellations}</div>
              <div className="text-[10.5px] font-bold uppercase text-slate-400 mb-1">Cancellations</div>
              <TrendBadge trend={opsQ.data.cancellationsTrend} compact />
            </div>
            <div>
              <div className="text-xl font-extrabold text-navy-900">{opsQ.data.slaAdherencePct}%</div>
              <div className="text-[10.5px] font-bold uppercase text-slate-400 mb-1">SLA Adherence</div>
              <TrendBadge trend={opsQ.data.slaAdherenceTrend} compact suffix=" pts" />
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard
        icon={AlertOctagon}
        iconColor="#DC2626"
        title="Escalations"
        subtitle="Issues raised by batch coordinators or learners"
        isLoading={opsQ.isLoading}
        isError={opsQ.isError}
        onRetry={() => queryClient.invalidateQueries({ queryKey: ["mentor360", "operations"] })}
        isEmpty={opsQ.data?.escalations.length === 0}
      >
        <div className="flex flex-col divide-y divide-slate-50">
          {opsQ.data?.escalations.map((e) => (
            <div key={e.id} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
              <div>
                <p className="text-[12.5px] text-slate-600">{e.description}</p>
                <div className="text-[11px] text-slate-400 mt-1">{new Date(e.date).toLocaleDateString()}</div>
              </div>
              <span
                className="text-[11px] font-bold rounded-full px-2.5 py-1 flex-shrink-0"
                style={e.status === "Resolved" ? { color: "#16A34A", backgroundColor: "#DCFCE7" } : { color: "#DC2626", backgroundColor: "#FEE2E2" }}
              >
                {e.status}
              </span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
