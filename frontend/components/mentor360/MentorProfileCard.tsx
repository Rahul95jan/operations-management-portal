import { Calendar, Mail } from "lucide-react";
import Link from "next/link";
import { Mentor } from "../../lib/mentor360/types";
import MentorSelector from "./MentorSelector";
import StatusBadge from "./StatusBadge";
import MentorExportMenu from "./MentorExportMenu";

export default function MentorProfileCard({
  mentors,
  mentor,
  onSelect,
  getExportRows,
}: {
  mentors: Mentor[];
  mentor: Mentor | null;
  onSelect: (id: string) => void;
  getExportRows: () => Record<string, unknown>[];
}) {
  return (
    <div className="bg-white border border-border rounded-[16px] shadow-card px-4 py-4 mb-5 flex flex-col xl:flex-row xl:items-center gap-4">
      <MentorSelector mentors={mentors} selectedId={mentor?.id ?? ""} onSelect={onSelect} />

      <div className="hidden xl:block w-px h-20 self-stretch bg-border" />

      {mentor ? (
        <>
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {mentor.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mentor.photoUrl} alt={mentor.name} className="w-16 h-16 rounded-full object-cover flex-shrink-0 border border-border shadow-sm" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gold/15 text-gold-dark font-extrabold text-xl flex items-center justify-center flex-shrink-0 border border-gold/20">{mentor.initials}</div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="font-display text-[2rem] leading-none text-navy-900 font-bold">{mentor.name}</h2>
                <StatusBadge status={mentor.status} />
              </div>
              <div className="text-[12.5px] text-slate-500 mt-2 flex items-center gap-2 flex-wrap">
                <span>Mentor</span>
                <span className="text-slate-300">|</span>
                <span>{mentor.expertise.join(" • ")}</span>
              </div>
              <div className="text-[11.5px] text-slate-500 mt-2 flex items-center gap-4 flex-wrap">
                <span className="inline-flex items-center gap-1.5"><Mail size={12} className="text-slate-400" /> {mentor.email}</span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar size={12} className="text-slate-400" /> Joined {new Date(mentor.joinedDate).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-shrink-0">
            <Link href="/mentors" className="bg-white border border-border hover:bg-slate-50 text-navy-900 font-bold text-sm rounded-xl px-4 py-2.5 shadow-sm">
              View Profile
            </Link>
            <MentorExportMenu filenamePrefix={`mentor-360-${mentor.name.toLowerCase().replace(/\s+/g, "-")}`} getExportRows={getExportRows} />
          </div>
        </>
      ) : (
        <div className="flex-1 text-slate-400 text-sm">Select a mentor to view their profile.</div>
      )}
    </div>
  );
}
