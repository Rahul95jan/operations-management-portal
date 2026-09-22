import { ActionItemData, BatchMatrixRow, Signal } from "./types";
import { SIGNAL_RULES } from "./config";

// Each rule inspects the already-computed Signals + Batch matrix and decides
// whether it fires. Adding a new recommendation type means adding one entry
// here — nothing else in the page needs to change.
interface RuleContext {
  signals: Signal[];
  batches: BatchMatrixRow[];
}

interface Rule {
  id: string;
  evaluate: (ctx: RuleContext) => ActionItemData | null;
}

function findSignal(signals: Signal[], id: string) {
  return signals.find((s) => s.id === id);
}

const RULES: Rule[] = [
  {
    id: "low-attendance",
    evaluate: ({ signals, batches }) => {
      const s = findSignal(signals, "attendance");
      if (!s || s.change.isGood) return null;
      const worst = [...batches].sort((a, b) => a.attendancePct - b.attendancePct)[0];
      return {
        id: "low-attendance",
        issue: "Low Attendance",
        description: `Attendance decreased from ${s.previous} to ${s.current}.`,
        affectedBatch: worst ? worst.batch : "Multiple batches",
        priority: "High",
        metric: "Attendance",
      };
    },
  },
  {
    id: "report-completion",
    evaluate: ({ signals }) => {
      const s = findSignal(signals, "reportCompletion");
      if (!s || s.change.isGood) return null;
      return {
        id: "report-completion",
        issue: "Report Completion",
        description: `Report completion dropped from ${s.previous} to ${s.current}.`,
        affectedBatch: s.affectedArea,
        priority: "Medium",
        metric: "Report Completion",
      };
    },
  },
  {
    id: "missing-recordings",
    evaluate: ({ signals }) => {
      const s = findSignal(signals, "recordingCompliance");
      if (!s || s.change.isGood) return null;
      return {
        id: "missing-recordings",
        issue: "Missing Recordings",
        description: `Recording compliance moved from ${s.previous} to ${s.current}.`,
        affectedBatch: s.affectedArea,
        priority: "Medium",
        metric: "Recording Compliance",
      };
    },
  },
  {
    id: "session-quality",
    evaluate: ({ signals, batches }) => {
      const s = findSignal(signals, "rating");
      if (!s || s.change.isGood) return null;
      const worst = [...batches].sort((a, b) => a.rating - b.rating)[0];
      return {
        id: "session-quality",
        issue: "Session Quality",
        description: `Average session rating fell from ${s.previous} to ${s.current}.`,
        affectedBatch: worst ? worst.batch : "Multiple batches",
        priority: "High",
        metric: "Rating",
      };
    },
  },
  {
    id: "late-starts",
    evaluate: ({ signals }) => {
      const s = findSignal(signals, "cancellations");
      if (!s || s.change.isGood) return null;
      return {
        id: "late-starts",
        issue: "Cancellations Rising",
        description: `Cancellations moved from ${s.previous} to ${s.current} vs the previous period.`,
        affectedBatch: s.affectedArea,
        priority: "Medium",
        metric: "Cancellations",
      };
    },
  },
];

export function evaluateActionRules(ctx: RuleContext): ActionItemData[] {
  return RULES.map((r) => r.evaluate(ctx)).filter((r): r is ActionItemData => r !== null);
}

export { SIGNAL_RULES };
