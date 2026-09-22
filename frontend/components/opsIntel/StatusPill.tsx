import { AlertTriangle, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Tier, TIER_COLORS } from "../../lib/opsIntel/config";

const TIER_ICON: Record<Tier, React.ElementType> = {
  good: CheckCircle2,
  watch: Clock,
  critical: AlertTriangle,
};

// Maps arbitrary label strings ("Healthy", "Ready", "On Time", "Critical", ...)
// to a visual tier so every pill in the app stays consistent even though the
// underlying vocabularies differ (risk levels vs recording/report/SLA states).
function tierForLabel(label: string): Tier {
  const goodLabels = ["Healthy", "Good", "Ready", "Available", "On Time", "Active", "Completed"];
  const watchLabels = ["Watch", "Medium", "Pending", "Scheduled", "Rescheduled", "On Leave", "Generating"];
  if (goodLabels.includes(label)) return "good";
  if (watchLabels.includes(label)) return "watch";
  return "critical";
}

export default function StatusPill({ label, tier, icon = true }: { label: string; tier?: Tier; icon?: boolean }) {
  const resolvedTier = tier ?? tierForLabel(label);
  const colors = TIER_COLORS[resolvedTier];
  const Icon = TIER_ICON[resolvedTier];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap"
      style={{ color: colors.text, backgroundColor: colors.bg }}
    >
      {icon && <Icon size={12} strokeWidth={2.5} />}
      {label}
    </span>
  );
}

export function CancelledPill() {
  return <StatusPill label="Cancelled" tier="critical" icon={false} />;
}

export function RiskPill({ risk }: { risk: "Healthy" | "Watch" | "Critical" }) {
  const tier: Tier = risk === "Healthy" ? "good" : risk === "Watch" ? "watch" : "critical";
  return <StatusPill label={risk} tier={tier} />;
}

export function XPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap" style={{ color: TIER_COLORS.critical.text, backgroundColor: TIER_COLORS.critical.bg }}>
      <XCircle size={12} strokeWidth={2.5} />
      {label}
    </span>
  );
}
