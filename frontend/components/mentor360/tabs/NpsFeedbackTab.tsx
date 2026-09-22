import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { MessageSquareText, Star, ThumbsDown, ThumbsUp } from "lucide-react";
import { useEffect } from "react";
import SectionCard from "../../opsIntel/SectionCard";
import { getFeedback, getNPS } from "../../../lib/mentor360/mentorService";

export default function NpsFeedbackTab({ mentorId, onDataChange }: { mentorId: string; onDataChange: (rows: Record<string, unknown>[]) => void }) {
  const queryClient = useQueryClient();
  const npsQ = useQuery({ queryKey: ["mentor360", "nps", mentorId], queryFn: () => getNPS(mentorId) });
  const feedbackQ = useQuery({ queryKey: ["mentor360", "feedback", mentorId], queryFn: () => getFeedback(mentorId) });

  useEffect(() => {
    if (feedbackQ.data) onDataChange(feedbackQ.data as unknown as Record<string, unknown>[]);
  }, [feedbackQ.data]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <SectionCard
        icon={Star}
        iconColor="#A855F7"
        title="NPS Trend"
        subtitle="Score over the last 6 months"
        className="lg:col-span-2"
        isLoading={npsQ.isLoading}
        isError={npsQ.isError}
        onRetry={() => queryClient.invalidateQueries({ queryKey: ["mentor360", "nps"] })}
      >
        {npsQ.data && (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={npsQ.data.trend} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E6EAF0", fontSize: 12 }} />
              <Line type="monotone" dataKey="score" name="NPS" stroke="#F5B82E" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </SectionCard>

      <SectionCard icon={MessageSquareText} iconColor="#0891B2" title="Sentiment Summary" isLoading={npsQ.isLoading} isError={npsQ.isError} onRetry={() => queryClient.invalidateQueries({ queryKey: ["mentor360", "nps"] })}>
        {npsQ.data && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between bg-green-50 rounded-lg px-3 py-2.5">
              <span className="inline-flex items-center gap-2 text-[12.5px] font-bold text-status-good"><ThumbsUp size={14} /> Promoters</span>
              <span className="font-extrabold text-navy-900">{npsQ.data.promoters}</span>
            </div>
            <div className="flex items-center justify-between bg-amber-50 rounded-lg px-3 py-2.5">
              <span className="text-[12.5px] font-bold text-status-watch">Passives</span>
              <span className="font-extrabold text-navy-900">{npsQ.data.passives}</span>
            </div>
            <div className="flex items-center justify-between bg-red-50 rounded-lg px-3 py-2.5">
              <span className="inline-flex items-center gap-2 text-[12.5px] font-bold text-status-critical"><ThumbsDown size={14} /> Detractors</span>
              <span className="font-extrabold text-navy-900">{npsQ.data.detractors}</span>
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard
        icon={MessageSquareText}
        iconColor="#F5B82E"
        title="Recent Learner Comments"
        className="lg:col-span-3"
        isLoading={feedbackQ.isLoading}
        isError={feedbackQ.isError}
        onRetry={() => queryClient.invalidateQueries({ queryKey: ["mentor360", "feedback"] })}
        isEmpty={feedbackQ.data?.length === 0}
      >
        <div className="flex flex-col divide-y divide-slate-50">
          {feedbackQ.data?.map((f) => (
            <div key={f.id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-navy-900 text-[13px]">{f.learnerName}</span>
                <span className="inline-flex items-center gap-1 text-[12px] font-bold text-amber-600">
                  <Star size={12} fill="currentColor" /> {f.rating}
                </span>
              </div>
              <p className="text-[12.5px] text-slate-500 mt-1">{f.comment}</p>
              <div className="text-[11px] text-slate-400 mt-1">{f.batch} · {new Date(f.date).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
