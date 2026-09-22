import { Bell } from "lucide-react";
import { useEffect, useState } from "react";

interface PageHeaderProps {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
}

export default function PageHeader({
  eyebrow = "Operations",
  title = "Session Operations Intelligence",
  subtitle = "Monitor session performance, learner engagement, batch health, mentor delivery and operational compliance.",
}: PageHeaderProps) {
  const [now, setNow] = useState<Date | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="relative overflow-hidden rounded-[18px] px-5 sm:px-7 py-6 mb-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
      style={{ background: "linear-gradient(120deg, #0B1220 0%, #111C33 60%, #0B1220 100%)" }}
    >
      <div className="relative z-10">
        <span className="inline-block text-[10.5px] font-bold uppercase tracking-[0.18em] text-gold bg-gold/10 border border-gold/30 rounded-full px-2.5 py-1.5 mb-3">
          {eyebrow}
        </span>
        <h1 className="text-white text-[2rem] font-display font-bold leading-none mb-2">{title}</h1>
        <p className="text-slate-300 text-[13px] max-w-xl leading-relaxed">{subtitle}</p>
      </div>

      <div className="relative z-10 text-gold font-script text-[2.1rem] leading-[0.8] text-center hidden lg:block tracking-[0.02em] rotate-[-6deg] mt-1">
        Empowering
        <br />
        Minds Together
      </div>

      <div className="relative z-10 flex items-center gap-3 flex-shrink-0">
        {now && (
          <div className="hidden sm:flex flex-col items-end text-[11px] text-slate-300 font-semibold leading-tight">
            <span>{now.toLocaleDateString(undefined, { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}</span>
            <span className="text-slate-400">{now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        )}
        <div className="relative">
          <button onClick={() => setNotifOpen((v) => !v)} className="relative w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-white flex items-center justify-center border border-white/10" aria-label="Notifications">
            <Bell size={16} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
          </button>
          {notifOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 top-[calc(100%+8px)] w-64 bg-white rounded-lg shadow-card border border-border p-3 z-30 text-sm">
                <div className="font-bold text-navy-900 mb-1">Notifications</div>
                <div className="text-slate-400 text-xs">You&apos;re all caught up.</div>
              </div>
            </>
          )}
        </div>
        <div className="w-10 h-10 rounded-full bg-gold text-navy-900 font-extrabold text-xs flex items-center justify-center flex-shrink-0 border border-gold/60">RK</div>
      </div>
    </div>
  );
}
