import { CartesianGrid, ReferenceArea, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis, Legend } from "recharts";
import { RiskPoint } from "../../lib/opsIntel/types";
import { RISK_MATRIX_DIVIDERS } from "../../lib/opsIntel/config";

const COMPLIANCE_COLOR: Record<RiskPoint["compliance"], string> = {
  Healthy: "#16A34A",
  Watch: "#F59E0B",
  Critical: "#DC2626",
};

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const p: RiskPoint = payload[0].payload;
  return (
    <div className="bg-white border border-border rounded-lg shadow-card px-3 py-2 text-xs">
      <div className="font-bold text-navy-900 mb-1">{p.sessionName}</div>
      <div className="text-slate-500">Mentor: {p.mentor}</div>
      <div className="text-slate-500">Batch: {p.batch}</div>
      <div className="text-slate-500">Attendance: {p.attendancePct}% · Rating: {p.rating}</div>
      <div className="text-slate-500">Learners: {p.learners}</div>
    </div>
  );
}

export default function RiskMatrixChart({ data, onPointClick }: { data: RiskPoint[]; onPointClick?: (point: RiskPoint) => void }) {
  const { attendancePct: xDivider, rating: yDivider } = RISK_MATRIX_DIVIDERS;
  const byCompliance: Record<RiskPoint["compliance"], RiskPoint[]> = { Healthy: [], Watch: [], Critical: [] };
  data.forEach((p) => byCompliance[p.compliance].push(p));

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 20, right: 16, left: -8, bottom: 8 }}>
          <CartesianGrid stroke="#F1F5F9" />
          <XAxis type="number" dataKey="attendancePct" name="Attendance %" domain={[0, 100]} tick={{ fontSize: 10, fill: "#94A3B8" }} tickFormatter={(v) => `${v}%`} label={{ value: "Attendance %", position: "insideBottom", offset: -4, fontSize: 10, fill: "#94A3B8" }} />
          <YAxis type="number" dataKey="rating" name="Rating" domain={[0, 5]} tick={{ fontSize: 10, fill: "#94A3B8" }} label={{ value: "Rating", angle: -90, position: "insideLeft", fontSize: 10, fill: "#94A3B8" }} />
          <ZAxis type="number" dataKey="learners" range={[40, 320]} name="Learners" />

          {/* Quadrant tints */}
          <ReferenceArea x1={xDivider} x2={100} y1={yDivider} y2={5} fill="#16A34A" fillOpacity={0.05} />
          <ReferenceArea x1={0} x2={xDivider} y1={0} y2={yDivider} fill="#DC2626" fillOpacity={0.06} />
          <ReferenceLine x={xDivider} stroke="#CBD5E1" strokeDasharray="4 4" />
          <ReferenceLine y={yDivider} stroke="#CBD5E1" strokeDasharray="4 4" />

          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: "3 3" }} />
          <Legend wrapperStyle={{ fontSize: 11, fontWeight: 600 }} />

          {(Object.keys(byCompliance) as RiskPoint["compliance"][]).map((tier) => (
            <Scatter
              key={tier}
              name={tier}
              data={byCompliance[tier]}
              fill={COMPLIANCE_COLOR[tier]}
              fillOpacity={0.6}
              cursor={onPointClick ? "pointer" : "default"}
              onClick={(point: any) => onPointClick?.(point)}
            />
          ))}
        </ScatterChart>
      </ResponsiveContainer>

      {/* Quadrant labels */}
      <div className="pointer-events-none absolute inset-0 hidden sm:block text-[9px] font-bold uppercase tracking-wide text-slate-400">
        <span className="absolute top-1 right-4">High Attendance, High Rating (Healthy)</span>
        <span className="absolute top-1 left-8">Low Attendance, High Rating (Engagement Risk)</span>
        <span className="absolute bottom-6 right-4">High Attendance, Low Rating (Quality Risk)</span>
        <span className="absolute bottom-6 left-8">Low Attendance, Low Rating (Critical Attention)</span>
      </div>
    </div>
  );
}
