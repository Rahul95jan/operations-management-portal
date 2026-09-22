import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { BarChart3, Lightbulb, MessageSquareText, Users, Star } from "lucide-react";
import CardShell from "./CardShell";
import { tone } from "./tones";

function StatTile({ icon: Icon, label, value, color }) {
  const t = tone(color);
  return (
    <div className="stat" style={{ background: t.soft, borderColor: t.border }}>
      <span className="stat-icon" style={{ color: t.fg }}><Icon size={22} strokeWidth={2} /></span>
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
      </div>
      <style jsx>{`
        .stat { display: flex; align-items: center; gap: 14px; border: 1px solid; border-radius: 10px; padding: 14px 18px; }
        .stat-icon { width: 38px; height: 38px; border-radius: 10px; background: rgba(255,255,255,0.7); display: flex; align-items: center; justify-content: center; }
        .stat-label { font-size: 12px; font-weight: 600; color: #475569; }
        .stat-value { font-size: 22px; font-weight: 800; color: #0f172a; margin-top: 2px; font-variant-numeric: tabular-nums; }
      `}</style>
    </div>
  );
}

function Tick({ x, y, payload }) {
  const label = String(payload.value || "").trim();
  return <text x={x} y={y + 14} textAnchor="middle" fontSize={11} fill="#334155">{label.length > 22 ? `${label.slice(0, 21)}…` : label}</text>;
}

export default function PollAnalyticsCard({ polls, totals, insight }) {
  const rows = (polls || []).map((p) => ({ name: p.meeting || "Untitled", "Polls Conducted": p.polls || 0, Responses: p.responses || 0 }));

  return (
    <CardShell icon={BarChart3} iconColor="#2563eb" title="Poll Analytics">
      <div className="stats">
        <StatTile icon={MessageSquareText} label="Total Polls" value={totals.totalPolls} color="blue" />
        <StatTile icon={Users} label="Responses" value={totals.totalResponses} color="green" />
        <StatTile icon={Star} label="Avg Poll Rating" value={totals.averageRating !== null ? `${totals.averageRating}/5` : "N/A"} color="amber" />
      </div>

      {rows.length === 0 ? (
        <div className="empty">No poll data for the selected filters.</div>
      ) : (
        <div className="chart-box">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} margin={{ top: 10, right: 16, left: 0, bottom: 0 }} barGap={2}>
              <CartesianGrid stroke="#e8edf5" />
              <XAxis dataKey="name" tick={<Tick />} interval={0} height={30} axisLine={{ stroke: "#cbd5e1" }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#475569" }} axisLine={false} tickLine={false} width={40} allowDecimals={false} label={{ value: "Count", angle: -90, position: "insideLeft", fontSize: 11, fill: "#475569" }} />
              <Tooltip cursor={{ fill: "rgba(148,163,184,0.12)" }} />
              <Legend iconType="square" iconSize={9} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Polls Conducted" fill="#2563eb" maxBarSize={60} isAnimationActive={false} />
              <Bar dataKey="Responses" fill="#16a34a" maxBarSize={60} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {insight && (
        <div className="insight-note">
          <Lightbulb size={15} strokeWidth={2.1} /> <span>{insight}</span>
        </div>
      )}

      <style jsx>{`
        .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 14px; }
        .chart-box { height: 210px; }
        .empty { padding: 50px 0; text-align: center; color: #94a3b8; font-size: 13px; }
        .insight-note { display: flex; align-items: center; gap: 8px; margin-top: 10px; background: #eff6ff; color: #1e3a8a; border-radius: 8px; padding: 10px 14px; font-size: 12px; }
        .insight-note :global(svg) { color: #2563eb; flex-shrink: 0; }
        @media (max-width: 900px) { .stats { grid-template-columns: 1fr; } }
      `}</style>
    </CardShell>
  );
}
