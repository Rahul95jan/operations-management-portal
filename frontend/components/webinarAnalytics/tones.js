// Shared colour tones for the Webinar Analytics dashboard cards.
export const TONES = {
  green: { fg: "#16a34a", soft: "#ecfdf5", border: "#bbf7d0", bar: "#22c55e" },
  blue: { fg: "#2563eb", soft: "#eff6ff", border: "#bfdbfe", bar: "#3b82f6" },
  amber: { fg: "#d97706", soft: "#fffbeb", border: "#fde68a", bar: "#f59e0b" },
  orange: { fg: "#ea580c", soft: "#fff7ed", border: "#fed7aa", bar: "#f97316" },
  red: { fg: "#dc2626", soft: "#fef2f2", border: "#fecaca", bar: "#ef4444" },
  purple: { fg: "#7c3aed", soft: "#f5f3ff", border: "#ddd6fe", bar: "#8b5cf6" },
  slate: { fg: "#64748b", soft: "#f8fafc", border: "#e2e8f0", bar: "#94a3b8" },
};

export const tone = (name) => TONES[name] || TONES.slate;
