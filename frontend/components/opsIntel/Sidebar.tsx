import {
  BarChart3,
  BookOpen,
  Calendar,
  ChevronDown,
  FileText,
  FolderKanban,
  Home,
  Menu,
  MessageSquareText,
  Receipt,
  Users,
  Video,
  X,
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  label: string;
  icon: React.ElementType;
}
interface NavGroup {
  label: string | null;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  { label: null, items: [{ label: "Home", icon: Home }] },
  {
    label: "Operations",
    items: [
      { label: "Sessions", icon: Calendar },
      { label: "Mentors", icon: Users },
      { label: "Batches", icon: FolderKanban },
      { label: "Session Reports", icon: FileText },
      { label: "Analytics", icon: BarChart3 },
      { label: "Mentor 360", icon: Users },
      { label: "Invoice Generator", icon: Receipt },
    ],
  },
  {
    label: "Learner Feedback",
    items: [
      { label: "NPS Form", icon: MessageSquareText },
      { label: "NPS Analytics", icon: BarChart3 },
      { label: "Log Webinar Report", icon: Video },
    ],
  },
  { label: "Resource Portal", items: [{ label: "Resource Portal", icon: BookOpen }] },
];

function SidebarContent({ collapsed, activeItem }: { collapsed: boolean; activeItem: string }) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-5 pb-4 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl border border-gold/70 bg-[#111C33] text-gold font-extrabold flex items-center justify-center flex-shrink-0 shadow-[0_0_0_1px_rgba(245,166,35,0.2)]">KN</div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-[12px] font-semibold tracking-[0.14em] text-gold uppercase leading-tight truncate">Krish Naik Academy</div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-slate-400 pt-1 truncate">Learn • Build • Grow</div>
              <div className="text-[11px] text-slate-300 pt-1 truncate">Operations Portal</div>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2.5 py-3">
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi} className="mb-4">
            {group.label && !collapsed && (
              <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 px-2.5 mb-2">{group.label}</div>
            )}
            <div className="flex flex-col gap-1">
              {group.items.map((item) => {
                const isActive = item.label === activeItem;
                return (
                  <button
                    key={item.label}
                    className={`relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-semibold transition-all ${
                      isActive ? "bg-[#171F36] text-gold border-l-2 border-gold shadow-[inset_0_0_0_1px_rgba(245,166,35,0.06)]" : "text-slate-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <item.icon size={15} strokeWidth={2.2} className="flex-shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                    {isActive && <span className="absolute left-0 top-1 bottom-1 w-[2px] rounded-r bg-gold" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <button className="w-full flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-white/5">
          <div className="w-8 h-8 rounded-full bg-gold/20 text-gold font-bold text-xs flex items-center justify-center flex-shrink-0">RK</div>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1 text-left">
                <div className="text-white text-[12.5px] font-bold truncate">Rahul Kumar</div>
                <div className="text-slate-400 text-[10.5px] truncate">Operations Team</div>
              </div>
              <ChevronDown size={14} className="text-slate-400 flex-shrink-0" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function Sidebar({ activeItem = "Session Reports" }: { activeItem?: string }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop */}
      <aside
        className="hidden lg:flex fixed inset-y-0 left-0 z-30 flex-col transition-all duration-200"
        style={{ width: collapsed ? 76 : 248, background: "linear-gradient(180deg, #0B1426 0%, #111C33 100%)" }}
      >
        <SidebarContent collapsed={collapsed} activeItem={activeItem} />
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-navy-800 border border-white/10 text-white flex items-center justify-center"
          aria-label="Toggle sidebar"
        >
          <ChevronDown size={13} className={`transition-transform ${collapsed ? "-rotate-90" : "rotate-90"}`} />
        </button>
      </aside>

      {/* Mobile top bar trigger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-30 w-9 h-9 rounded-lg bg-navy-900 text-white flex items-center justify-center shadow-card"
        aria-label="Open menu"
      >
        <Menu size={18} />
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="relative w-[248px] flex flex-col" style={{ background: "linear-gradient(180deg, #0B1426 0%, #111C33 100%)" }}>
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-3 text-white/70" aria-label="Close menu">
              <X size={18} />
            </button>
            <SidebarContent collapsed={false} activeItem={activeItem} />
          </div>
        </div>
      )}

      <div className="hidden lg:block flex-shrink-0 transition-all duration-200" style={{ width: collapsed ? 76 : 248 }} />
    </>
  );
}
