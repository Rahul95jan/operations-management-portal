import { MentorStatus } from "../../lib/mentor360/types";

const STYLES: Record<MentorStatus, { text: string; bg: string; dot: string }> = {
  Active: { text: "#16A34A", bg: "#DCFCE7", dot: "#16A34A" },
  Inactive: { text: "#64748B", bg: "#F1F5F9", dot: "#94A3B8" },
  "On Leave": { text: "#F59E0B", bg: "#FEF3C7", dot: "#F59E0B" },
};

export default function StatusBadge({ status }: { status: MentorStatus }) {
  const s = STYLES[status];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold" style={{ color: s.text, backgroundColor: s.bg }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.dot }} />
      {status}
    </span>
  );
}
