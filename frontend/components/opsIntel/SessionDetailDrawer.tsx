import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { getSessionById } from "../../lib/opsIntel/sessionReportsService";
import StatusPill from "./StatusPill";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="mb-3">
      <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-0.5">{label}</div>
      <div className="text-[13.5px] font-semibold text-navy-900">{value ?? "—"}</div>
    </div>
  );
}

export default function SessionDetailDrawer({ sessionId, onClose }: { sessionId: string | null; onClose: () => void }) {
  const { data: session, isLoading } = useQuery({
    queryKey: ["opsIntel", "session", sessionId],
    queryFn: () => getSessionById(sessionId as string),
    enabled: !!sessionId,
  });

  if (!sessionId) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between px-5 py-4 border-b border-border">
          <div>
            <div className="text-[10.5px] font-bold uppercase tracking-wide text-slate-400 mb-0.5">Session {sessionId}</div>
            <h3 className="font-extrabold text-navy-900 text-[16px]">{session?.topic ?? "Loading…"}</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center flex-shrink-0" aria-label="Close">
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {isLoading || !session ? (
            <div className="animate-pulse space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-4 bg-slate-100 rounded" />
              ))}
            </div>
          ) : (
            <>
              <div className="text-[11px] font-bold uppercase tracking-wide text-navy-900 border-b-2 border-gold pb-1.5 mb-3">Session</div>
              <div className="grid grid-cols-2 gap-x-4">
                <Field label="Date & Time" value={new Date(session.dateTime).toLocaleString()} />
                <Field label="Duration" value={`${session.durationMinutes} min`} />
                <Field label="Mentor" value={session.mentorName} />
                <Field label="Batch" value={session.batchName} />
                <Field label="Course" value={session.courseName} />
                <Field label="Type" value={session.sessionType} />
                <Field label="Status" value={<StatusPill label={session.status} />} />
              </div>

              <div className="text-[11px] font-bold uppercase tracking-wide text-navy-900 border-b-2 border-gold pb-1.5 mb-3 mt-4">Attendance</div>
              <div className="grid grid-cols-2 gap-x-4">
                <Field label="Registered" value={session.learners} />
                <Field label="Attended" value={session.attended} />
                <Field label="Attendance %" value={session.attendancePct !== null ? `${session.attendancePct}%` : "N/A"} />
              </div>

              <div className="text-[11px] font-bold uppercase tracking-wide text-navy-900 border-b-2 border-gold pb-1.5 mb-3 mt-4">Feedback</div>
              <Field label="Session Rating" value={session.rating !== null ? `${session.rating} / 5` : "Not available"} />

              <div className="text-[11px] font-bold uppercase tracking-wide text-navy-900 border-b-2 border-gold pb-1.5 mb-3 mt-4">Recording &amp; Report</div>
              <div className="grid grid-cols-2 gap-x-4">
                <Field label="Recording" value={<StatusPill label={session.recording} />} />
                <Field label="Report" value={<StatusPill label={session.report} />} />
                <Field label="SLA" value={<StatusPill label={session.sla} />} />
              </div>

              <div className="text-[11px] font-bold uppercase tracking-wide text-navy-900 border-b-2 border-gold pb-1.5 mb-3 mt-4">Timeline</div>
              <ul className="text-[12.5px] text-slate-500 space-y-1.5 pl-4 list-disc">
                <li>Session scheduled</li>
                <li>Session {session.status === "Completed" ? "conducted" : session.status.toLowerCase()}</li>
                {session.recording === "Available" && <li>Recording uploaded</li>}
                {session.report === "Ready" && <li>Report submitted</li>}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
