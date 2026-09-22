export const MENTOR_TABS = ["Overview", "Sessions", "NPS & Feedback", "Batches", "Attendance", "Quality", "Operations", "Reports"] as const;
export type MentorTab = (typeof MENTOR_TABS)[number];

export default function Tabs({ active, onChange }: { active: MentorTab; onChange: (tab: MentorTab) => void }) {
  return (
    <div className="bg-white border border-border rounded-[16px] shadow-card mb-5 px-2">
      <div role="tablist" aria-label="Mentor 360 sections" className="flex gap-1 overflow-x-auto no-scrollbar">
        {MENTOR_TABS.map((tab) => {
          const isActive = tab === active;
          return (
            <button
              key={tab}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab)}
              className={`relative flex-shrink-0 px-4 py-3.5 text-[13px] font-bold whitespace-nowrap transition-colors ${
                isActive ? "text-navy-900" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {tab}
              {isActive && <span className="absolute left-3 right-3 -bottom-[1px] h-[3px] bg-gold rounded-full" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
