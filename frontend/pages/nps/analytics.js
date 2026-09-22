import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import Sidebar from "../../components/Sidebar";
import ProtectedRoute from "../../components/ProtectedRoute";
import {
  Star,
  Users,
  GraduationCap,
  MessageSquareText,
  Bell,
  Download,
  ChevronDown,
  Search,
  ListFilter,
  Sparkles,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Meh,
  RefreshCw,
  Info,
  ArrowUpRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const API = "http://127.0.0.1:8000";

// ---- Frontend-only, clearly configurable thresholds (no backend logic touched) ----
const HEALTH_THRESHOLDS = {
  healthyNps: 30,
  watchNps: 0,
  minSampleForImpact: 5,
  minSampleForSegment: 3,
  lowResponseVolume: 10,
  highDetractorPct: 25,
  dimensionDeclineDelta: 0.3,
  npsDeclineDelta: 10,
};

const TREND_RANGE_LABELS = { 7: "7D", 30: "30D", 90: "90D", 180: "6M", 365: "12M" };
const DATE_RANGE_LABELS = { 30: "Last 30 Days", 90: "Last 90 Days", 180: "Last 6 Months", 365: "Last 12 Months", 0: "All Time" };

const THEME_DEFS = [
  { name: "Teaching Quality", pattern: /teach|explain|clarity|instructor/i },
  { name: "Doubt Resolution", pattern: /doubt|clarif|question|resolv/i },
  { name: "Course Content", pattern: /content|curriculum|material|syllabus/i },
  { name: "Pacing", pattern: /pac(e|ing)|speed|fast|slow/i },
  { name: "LMS Experience", pattern: /lms|website|platform|portal|login/i },
  { name: "Assignments", pattern: /assignment|homework|practice|exercise/i },
  { name: "Communication", pattern: /communicat|respons(e|iveness)|reply/i },
  { name: "Session Experience", pattern: /session|live class|recording|schedul/i },
];

function segmentOf(score) {
  if (score >= 9) return "promoter";
  if (score >= 7) return "passive";
  return "detractor";
}

function unique(list) {
  return [...new Set(list.filter(Boolean))].sort();
}

function toQuery(params) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== "" && v !== null && v !== undefined) usp.set(k, v);
  });
  return usp.toString();
}

function avg(list) {
  const vals = list.filter((v) => v !== null && v !== undefined);
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
}

function round(v, d = 1) {
  if (v === null || v === undefined || isNaN(v)) return null;
  const p = Math.pow(10, d);
  return Math.round(v * p) / p;
}

// Pearson correlation between two equal-length numeric arrays.
function pearson(xs, ys) {
  const n = xs.length;
  if (n < 2) return null;
  const mx = avg(xs), my = avg(ys);
  let num = 0, dx2 = 0, dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx, dy = ys[i] - my;
    num += dx * dy;
    dx2 += dx * dx;
    dy2 += dy * dy;
  }
  const denom = Math.sqrt(dx2 * dy2);
  return denom === 0 ? null : num / denom;
}

function computeStats(records) {
  const total = records.length;
  const promoters = records.filter((r) => r.nps_score >= 9).length;
  const passives = records.filter((r) => r.nps_score >= 7 && r.nps_score <= 8).length;
  const detractors = records.filter((r) => r.nps_score <= 6).length;
  const nps = total ? Math.round(((promoters - detractors) / total) * 100) : null;
  return {
    total, promoters, passives, detractors, nps,
    promotersPct: total ? Math.round((promoters / total) * 100) : 0,
    passivesPct: total ? Math.round((passives / total) * 100) : 0,
    detractorsPct: total ? Math.round((detractors / total) * 100) : 0,
    detractorRate: total ? Math.round((detractors / total) * 100) : 0,
    avgTeaching: round(avg(records.map((r) => r.instructor_rating)), 2),
    avgDoubt: round(avg(records.map((r) => r.doubt_rating)), 2),
    avgLms: round(avg(records.map((r) => r.website_rating)), 2),
  };
}

function pctChange(curr, prev) {
  if (curr === null || prev === null || prev === 0) return null;
  const delta = Math.round(((curr - prev) / Math.abs(prev)) * 100);
  return delta === 0 ? null : { dir: delta > 0 ? "up" : "down", text: `${Math.abs(delta)}%` };
}

function absChange(curr, prev, digits = 1) {
  if (curr === null || prev === null) return null;
  const delta = round(curr - prev, digits);
  if (delta === 0 || delta === null) return null;
  return { dir: delta > 0 ? "up" : "down", text: `${Math.abs(delta)}` };
}

function extractThemes(records) {
  return THEME_DEFS.map((t) => {
    const matches = records.filter((r) => r.feedback && t.pattern.test(r.feedback));
    if (matches.length === 0) return null;
    const npsVals = matches.map((r) => r.nps_score);
    const segCounts = { promoter: 0, passive: 0, detractor: 0 };
    matches.forEach((r) => segCounts[segmentOf(r.nps_score)]++);
    const dominant = Object.entries(segCounts).sort((a, b) => b[1] - a[1])[0][0];
    return {
      name: t.name,
      mentions: matches.length,
      avgNps: round(avg(npsVals), 0),
      sentiment: dominant === "promoter" ? "Positive" : dominant === "detractor" ? "Negative" : "Neutral",
    };
  }).filter(Boolean).sort((a, b) => b.mentions - a.mentions);
}

function groupBy(records, key) {
  const groups = {};
  records.forEach((r) => {
    const k = r[key] || "Unknown";
    if (!groups[k]) groups[k] = [];
    groups[k].push(r);
  });
  return groups;
}

function buildGroupTable(records, key) {
  const groups = groupBy(records, key);
  return Object.entries(groups).map(([name, items]) => {
    const s = computeStats(items);
    return {
      name,
      responses: items.length,
      nps: s.nps,
      teaching: s.avgTeaching,
      doubt: s.avgDoubt,
      lms: s.avgLms,
      detractorPct: s.detractorsPct,
      items,
    };
  }).sort((a, b) => (a.nps ?? 0) - (b.nps ?? 0));
}

function StatusPill({ label, tone }) {
  const styles = {
    good: { bg: "#dcfce7", color: "#15803d" },
    watch: { bg: "#fef3c7", color: "#b45309" },
    risk: { bg: "#fee2e2", color: "#b91c1c" },
    neutral: { bg: "#f1f5f9", color: "#475569" },
  };
  const s = styles[tone] || styles.neutral;
  return <span style={{ background: s.bg, color: s.color, fontSize: "11px", fontWeight: 700, padding: "3px 9px", borderRadius: "999px", whiteSpace: "nowrap" }}>{label}</span>;
}

function TrendArrow({ trend }) {
  if (!trend) return <span style={{ color: "#94a3b8" }}>—</span>;
  return <span style={{ color: trend.dir === "up" ? "#16a34a" : "#dc2626", fontWeight: 800 }}>{trend.dir === "up" ? "↑" : "↓"}</span>;
}

function SectionTitle({ icon: Icon, color = "#2563eb", title, sub }) {
  return (
    <div className="section-title-row">
      <span className="section-title-icon" style={{ background: `${color}1a`, color }}><Icon size={15} strokeWidth={2.2} /></span>
      <div>
        <h2 className="card-title">{title}</h2>
        {sub && <div className="card-sub">{sub}</div>}
      </div>
      <style jsx>{`
        .section-title-row { display: flex; align-items: flex-start; gap: 10px; }
        .section-title-icon { width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
      `}</style>
    </div>
  );
}

function KPICard({ icon: Icon, label, value, sub, color = "#0f172a", trend, children }) {
  return (
    <div className="kpi-tile">
      <div className="kpi-icon" style={{ background: `${color}1a`, color }}><Icon size={17} strokeWidth={2.2} /></div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="kpi-value-row">
          <div className="kpi-value" style={{ color }}>{value}</div>
          {trend && <span className={`kpi-trend ${trend.dir === "up" ? "kpi-trend-up" : "kpi-trend-down"}`}>{trend.dir === "up" ? "↑" : "↓"} {trend.text}</span>}
        </div>
        <div className="kpi-label">{label}</div>
        {sub && <div className="kpi-sub">{sub}</div>}
        {children}
      </div>
      <style jsx>{`
        .kpi-tile { background: #fff; border: 1px solid #eef2f7; border-left: 4px solid ${color}; padding: 12px 14px; border-radius: 12px; display: flex; gap: 10px; align-items: flex-start; box-shadow: 0 1px 3px rgba(15,23,42,0.06); }
        .kpi-icon { width: 32px; height: 32px; border-radius: 9px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .kpi-value-row { display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap; }
        .kpi-value { font-size: 19px; font-weight: 800; line-height: 1.1; }
        .kpi-trend { font-size: 10px; font-weight: 800; }
        .kpi-trend-up { color: #16a34a; }
        .kpi-trend-down { color: #dc2626; }
        .kpi-label { font-size: 10.5px; font-weight: 700; color: #64748b; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.02em; }
        .kpi-sub { font-size: 10px; color: #94a3b8; margin-top: 1px; }
      `}</style>
    </div>
  );
}

function MiniSegmentRow({ label, pct, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "10px", color: "#475569", fontWeight: 600 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} /> {label} <b style={{ color: "#0f172a" }}>{pct}%</b>
    </div>
  );
}

export default function NPSAnalyticsPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [now, setNow] = useState(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [exportMenu, setExportMenu] = useState(null);

  const [allResponses, setAllResponses] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [filterOptions, setFilterOptions] = useState({ course_name: [], batch_name: [], mentor_name: [] });

  const [filters, setFilters] = useState({ course_name: "", batch_name: "", mentor_name: "" });
  const [dateRangeDays, setDateRangeDays] = useState(90);
  const [segment, setSegment] = useState("");
  const [trendRangeDays, setTrendRangeDays] = useState(90);
  const [expTrendRangeDays, setExpTrendRangeDays] = useState(90);

  const [responseSearch, setResponseSearch] = useState("");
  const [responsePage, setResponsePage] = useState(1);
  const responsePageSize = 10;

  useEffect(() => {
    fetch(`${API}/users/me`).then((r) => r.json()).then(setCurrentUser).catch(() => setCurrentUser(null));
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    fetch(`${API}/nps`).then((r) => r.json()).then((data) => {
      const all = Array.isArray(data) ? data : [];
      setFilterOptions({
        course_name: unique(all.map((r) => r.course_name)),
        batch_name: unique(all.map((r) => r.batch_name)),
        mentor_name: unique(all.map((r) => r.mentor_name)),
      });
    }).catch(() => {});
  }, []);

  const loadResponses = () => {
    setLoadError(false);
    const qs = toQuery(filters);
    fetch(`${API}/nps${qs ? `?${qs}` : ""}`)
      .then((r) => { if (!r.ok) throw new Error("bad status"); return r.json(); })
      .then((data) => setAllResponses(Array.isArray(data) ? data : []))
      .catch(() => { setAllResponses([]); setLoadError(true); });
  };

  useEffect(loadResponses, [filters]);

  const resetFilters = () => {
    setFilters({ course_name: "", batch_name: "", mentor_name: "" });
    setDateRangeDays(90);
    setSegment("");
  };

  // ---- Date-range + segment filtering (client-side; course/batch/mentor already server-filtered) ----
  const { current, previous } = useMemo(() => {
    if (!allResponses) return { current: [], previous: [] };
    const now2 = Date.now();
    const dayMs = 86400000;
    const inWindow = (dateStr, startDaysAgo, endDaysAgo) => {
      if (!dateStr) return dateRangeDays === 0;
      const t = new Date(dateStr).getTime();
      if (isNaN(t)) return false;
      const age = (now2 - t) / dayMs;
      return age >= endDaysAgo && age < startDaysAgo;
    };

    let curr = dateRangeDays === 0 ? allResponses.slice() : allResponses.filter((r) => inWindow(r.created_at, dateRangeDays, 0));
    let prev = dateRangeDays === 0 ? [] : allResponses.filter((r) => inWindow(r.created_at, dateRangeDays * 2, dateRangeDays));

    if (segment) {
      curr = curr.filter((r) => segmentOf(r.nps_score) === segment);
      prev = prev.filter((r) => segmentOf(r.nps_score) === segment);
    }
    return { current: curr, previous: prev };
  }, [allResponses, dateRangeDays, segment]);

  const stats = useMemo(() => computeStats(current), [current]);
  const prevStats = useMemo(() => computeStats(previous), [previous]);

  const trends = useMemo(() => ({
    nps: absChange(stats.nps, prevStats.nps, 0),
    total: pctChange(stats.total, prevStats.total),
    teaching: absChange(stats.avgTeaching, prevStats.avgTeaching, 1),
    doubt: absChange(stats.avgDoubt, prevStats.avgDoubt, 1),
    lms: absChange(stats.avgLms, prevStats.avgLms, 1),
    feedbackCount: pctChange(current.filter((r) => r.feedback).length, previous.filter((r) => r.feedback).length),
  }), [stats, prevStats, current, previous]);

  const withFeedback = useMemo(() => current.filter((r) => r.feedback && r.feedback.trim()), [current]);
  const feedbackSentiment = useMemo(() => {
    const positive = withFeedback.filter((r) => segmentOf(r.nps_score) === "promoter").length;
    const neutral = withFeedback.filter((r) => segmentOf(r.nps_score) === "passive").length;
    const negative = withFeedback.filter((r) => segmentOf(r.nps_score) === "detractor").length;
    const total = withFeedback.length;
    return {
      total, positive, neutral, negative,
      positivePct: total ? Math.round((positive / total) * 100) : 0,
      neutralPct: total ? Math.round((neutral / total) * 100) : 0,
      negativePct: total ? Math.round((negative / total) * 100) : 0,
    };
  }, [withFeedback]);

  const scoreDistribution = useMemo(() => {
    const counts = Array.from({ length: 11 }, (_, i) => ({ score: i, count: 0 }));
    current.forEach((r) => { if (r.nps_score >= 0 && r.nps_score <= 10) counts[r.nps_score].count++; });
    return counts;
  }, [current]);

  function buildDailySeries(records, days) {
    const buckets = {};
    records.forEach((r) => {
      if (!r.created_at) return;
      const day = r.created_at.slice(0, 10);
      if (!buckets[day]) buckets[day] = [];
      buckets[day].push(r);
    });
    const out = [];
    const span = days === 0 ? 90 : days;
    const bucketCount = Math.min(span, 24);
    const stepDays = Math.max(1, Math.round(span / bucketCount));
    for (let i = span - 1; i >= 0; i -= stepDays) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
      const windowRecords = [];
      for (let j = 0; j < stepDays; j++) {
        const dd = new Date();
        dd.setDate(dd.getDate() - i + j);
        const key = dd.toLocaleDateString("en-CA");
        if (buckets[key]) windowRecords.push(...buckets[key]);
      }
      const s = computeStats(windowRecords);
      out.push({ date: label, nps: s.total ? s.nps : null, teaching: s.avgTeaching, doubt: s.avgDoubt, lms: s.avgLms, responses: windowRecords.length });
    }
    return out;
  }

  const npsTrendSeries = useMemo(() => buildDailySeries(current, trendRangeDays), [current, trendRangeDays]);
  const expTrendSeries = useMemo(() => buildDailySeries(current, expTrendRangeDays), [current, expTrendRangeDays]);

  // ---- Experience Driver / Impact Matrix (real Pearson correlation, no fabricated "importance") ----
  const driverAnalysis = useMemo(() => {
    const dims = [
      { key: "instructor_rating", label: "Teaching Method", score: stats.avgTeaching, prevScore: prevStats.avgTeaching },
      { key: "doubt_rating", label: "Doubt Resolution", score: stats.avgDoubt, prevScore: prevStats.avgDoubt },
      { key: "website_rating", label: "Website / LMS", score: stats.avgLms, prevScore: prevStats.avgLms },
    ];
    const withRatings = current.filter((r) => r.instructor_rating != null && r.doubt_rating != null && r.website_rating != null && r.nps_score != null);
    return dims.map((d) => {
      const xs = withRatings.map((r) => r[d.key]);
      const ys = withRatings.map((r) => r.nps_score);
      const n = xs.length;
      const r = n >= HEALTH_THRESHOLDS.minSampleForImpact ? pearson(xs, ys) : null;
      let impactLabel = "Insufficient responses for reliable impact estimate.";
      let impactTier = "unknown";
      if (r !== null) {
        const abs = Math.abs(r);
        if (abs >= 0.5) { impactLabel = "High"; impactTier = "high"; }
        else if (abs >= 0.25) { impactLabel = "Moderate"; impactTier = "moderate"; }
        else { impactLabel = "Low"; impactTier = "low"; }
      }
      return { ...d, r, impactLabel, impactTier, n, trend: absChange(d.score, d.prevScore, 1) };
    });
  }, [current, stats, prevStats]);

  const byMentor = useMemo(() => buildGroupTable(current, "mentor_name"), [current]);
  const byCourse = useMemo(() => buildGroupTable(current, "course_name"), [current]);
  const byBatch = useMemo(() => buildGroupTable(current, "batch_name"), [current]);

  const themes = useMemo(() => extractThemes(withFeedback), [withFeedback]);

  const detractors = useMemo(() => current.filter((r) => segmentOf(r.nps_score) === "detractor"), [current]);
  const passives = useMemo(() => current.filter((r) => segmentOf(r.nps_score) === "passive"), [current]);
  const promoters = useMemo(() => current.filter((r) => segmentOf(r.nps_score) === "promoter"), [current]);

  function modeOf(records, key) {
    if (!records.length) return "—";
    const counts = {};
    records.forEach((r) => { const k = r[key] || "Unknown"; counts[k] = (counts[k] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  }

  const detractorIntel = useMemo(() => {
    const detractorThemes = extractThemes(detractors.filter((r) => r.feedback));
    return {
      total: detractors.length,
      pct: stats.total ? Math.round((detractors.length / stats.total) * 100) : 0,
      topTheme: detractorThemes[0]?.name || "—",
      topCourse: modeOf(detractors, "course_name"),
      topBatch: modeOf(detractors, "batch_name"),
      topMentor: modeOf(detractors, "mentor_name"),
    };
  }, [detractors, stats.total]);

  const passiveIntel = useMemo(() => {
    const s = computeStats(passives);
    return { total: passives.length, pct: stats.total ? Math.round((passives.length / stats.total) * 100) : 0, avgTeaching: s.avgTeaching, avgDoubt: s.avgDoubt, avgLms: s.avgLms, themes: extractThemes(passives.filter((r) => r.feedback)).slice(0, 3) };
  }, [passives, stats.total]);

  const promoterIntel = useMemo(() => {
    const s = computeStats(promoters);
    return { total: promoters.length, pct: stats.total ? Math.round((promoters.length / stats.total) * 100) : 0, avgTeaching: s.avgTeaching, avgDoubt: s.avgDoubt, avgLms: s.avgLms, themes: extractThemes(promoters.filter((r) => r.feedback)).slice(0, 3) };
  }, [promoters, stats.total]);

  // ---- Action Center + Priority Signals (rule-based, real thresholds, real evidence) ----
  const actionItems = useMemo(() => {
    const items = [];
    driverAnalysis.forEach((d) => {
      if (d.trend && d.trend.dir === "down" && Math.abs(d.score - (d.prevScore ?? d.score)) >= HEALTH_THRESHOLDS.dimensionDeclineDelta) {
        items.push({
          issue: `Declining ${d.label}`,
          evidence: `Average score changed from ${d.prevScore} → ${d.score}.`,
          affected: "All filtered responses",
          metric: `${d.score} / 5`,
          trendDir: "down",
          priority: d.impactTier === "high" ? "High" : "Medium",
          note: "Investigate recent session feedback for this dimension.",
        });
      }
    });
    byMentor.filter((m) => m.responses >= HEALTH_THRESHOLDS.minSampleForSegment && m.detractorPct >= HEALTH_THRESHOLDS.highDetractorPct).forEach((m) => {
      items.push({
        issue: "High Detractor Concentration",
        evidence: `${m.detractorPct}% detractors across ${m.responses} responses.`,
        affected: `Mentor: ${m.name}`,
        metric: `NPS ${m.nps}`,
        trendDir: "down",
        priority: "High",
        note: "Review learner feedback and session-level comments for this mentor.",
      });
    });
    byBatch.filter((b) => b.responses >= HEALTH_THRESHOLDS.minSampleForSegment && b.detractorPct >= HEALTH_THRESHOLDS.highDetractorPct).forEach((b) => {
      items.push({
        issue: "High Detractor Concentration",
        evidence: `${b.detractorPct}% detractors across ${b.responses} responses.`,
        affected: `Batch: ${b.name}`,
        metric: `NPS ${b.nps}`,
        trendDir: "down",
        priority: "Medium",
        note: "Check pacing, cohort size, or scheduling for this batch.",
      });
    });
    if (trends.nps && trends.nps.dir === "down" && Math.abs(parseInt(trends.nps.text, 10)) >= HEALTH_THRESHOLDS.npsDeclineDelta) {
      items.push({
        issue: "NPS Decline",
        evidence: `NPS moved from ${prevStats.nps} → ${stats.nps}.`,
        affected: "Overall (filtered scope)",
        metric: `${stats.nps}`,
        trendDir: "down",
        priority: "High",
        note: "Review recent detractor feedback for a potential driver.",
      });
    }
    if (stats.total > 0 && stats.total < HEALTH_THRESHOLDS.lowResponseVolume) {
      items.push({
        issue: "Low Response Coverage",
        evidence: `Only ${stats.total} responses in the selected scope.`,
        affected: "Selected filters",
        metric: `${stats.total} responses`,
        trendDir: null,
        priority: "Low",
        note: "Interpret this segment's metrics with caution — sample size is small.",
      });
    }
    return items;
  }, [driverAnalysis, byMentor, byBatch, trends, prevStats, stats]);

  const filteredResponses = useMemo(() => {
    const term = responseSearch.trim().toLowerCase();
    if (!term) return current;
    return current.filter((r) =>
      (r.learner_name || "").toLowerCase().includes(term) ||
      (r.course_name || "").toLowerCase().includes(term) ||
      (r.batch_name || "").toLowerCase().includes(term) ||
      (r.mentor_name || "").toLowerCase().includes(term) ||
      (r.feedback || "").toLowerCase().includes(term)
    );
  }, [current, responseSearch]);
  const responseTotalPages = Math.max(Math.ceil(filteredResponses.length / responsePageSize), 1);
  const pagedResponses = filteredResponses.slice((responsePage - 1) * responsePageSize, responsePage * responsePageSize);
  useEffect(() => setResponsePage(1), [responseSearch, filters, dateRangeDays, segment]);

  const exportQs = toQuery(filters);
  const exportSuffix = exportQs ? `?${exportQs}` : "";

  const loading = allResponses === null;

  return (
    <ProtectedRoute>
      <>
        <Head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&display=swap" />
        </Head>
        <Sidebar />

        <div style={{ marginLeft: "var(--om-sidebar-width, 280px)", transition: "margin-left 0.25s ease", padding: "32px 36px 60px", background: "#f1f5f9", minHeight: "100vh" }}>
          <div className="page-hero">
            <div className="page-hero-blob" />
            <div className="page-hero-content">
              <div className="page-hero-eyebrow">Learner Feedback</div>
              <h1 className="page-hero-title">NPS Analytics</h1>
              <p className="page-hero-subtitle">Turn learner feedback into actionable insights for a better learning experience.</p>
            </div>
            <div className="page-hero-right">
              {now && (
                <div className="hero-clock">
                  {now.toLocaleDateString(undefined, { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
                  <span className="hero-clock-time">{now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              )}
              <div className="header-item-wrap">
                <button className="hero-icon-btn" onClick={() => setNotifOpen((v) => !v)} aria-label="Notifications"><Bell size={16} strokeWidth={2.1} /></button>
                {notifOpen && (
                  <>
                    <div className="dismiss-backdrop" onClick={() => setNotifOpen(false)} />
                    <div className="hero-notif-dropdown">
                      <div className="hero-notif-title">Notifications</div>
                      <div className="hero-notif-empty">You&apos;re all caught up.</div>
                    </div>
                  </>
                )}
              </div>
              {currentUser && (
                currentUser.photo_path ? (
                  <img src={`${API}/users/${currentUser.id}/photo?v=${encodeURIComponent(currentUser.photo_path)}`} alt={currentUser.name} className="hero-avatar-img" />
                ) : (
                  <div className="hero-avatar">{(currentUser.name || "?").trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("")}</div>
                )
              )}
            </div>
          </div>

          {/* Filter bar */}
          <div className="card filter-card">
            <div className="filter-grid">
              <div className="filter-field">
                <label>Date Range</label>
                <select value={dateRangeDays} onChange={(e) => setDateRangeDays(Number(e.target.value))}>
                  {Object.entries(DATE_RANGE_LABELS).map(([d, label]) => <option key={d} value={d}>{label}</option>)}
                </select>
              </div>
              <div className="filter-field">
                <label>Course</label>
                <select value={filters.course_name} onChange={(e) => setFilters((p) => ({ ...p, course_name: e.target.value }))}>
                  <option value="">All Courses</option>
                  {filterOptions.course_name.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="filter-field">
                <label>Batch</label>
                <select value={filters.batch_name} onChange={(e) => setFilters((p) => ({ ...p, batch_name: e.target.value }))}>
                  <option value="">All Batches</option>
                  {filterOptions.batch_name.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div className="filter-field">
                <label>Mentor</label>
                <select value={filters.mentor_name} onChange={(e) => setFilters((p) => ({ ...p, mentor_name: e.target.value }))}>
                  <option value="">All Mentors</option>
                  {filterOptions.mentor_name.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="filter-field">
                <label>NPS Segment</label>
                <select value={segment} onChange={(e) => setSegment(e.target.value)}>
                  <option value="">All</option>
                  <option value="promoter">Promoters</option>
                  <option value="passive">Passives</option>
                  <option value="detractor">Detractors</option>
                </select>
              </div>
              <button className="btn-reset" onClick={resetFilters}><RefreshCw size={13} strokeWidth={2.3} /> Reset Filters</button>
              <div className="export-wrap">
                <button
                  className="btn-export-main"
                  onClick={(e) => {
                    if (exportMenu) { setExportMenu(null); return; }
                    const rect = e.currentTarget.getBoundingClientRect();
                    setExportMenu({ top: rect.bottom + 8, left: rect.right - 210 });
                  }}
                >
                  <Download size={14} strokeWidth={2.3} /> Export Report <ChevronDown size={12} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>

          {loadError && (
            <div className="error-banner">
              <AlertTriangle size={16} strokeWidth={2.2} />
              <span>Couldn&apos;t load NPS responses. Please check your connection and try again.</span>
              <button className="btn-retry" onClick={loadResponses}><RefreshCw size={13} strokeWidth={2.3} /> Retry</button>
            </div>
          )}

          {loading ? (
            <div className="card empty-state">Loading NPS analytics…</div>
          ) : stats.total === 0 ? (
            <div className="card empty-state">
              No NPS responses match the selected filters.
              <div style={{ marginTop: "12px" }}><button className="btn-reset" onClick={resetFilters}>Reset Filters</button></div>
            </div>
          ) : (
            <>
              {/* KPI row */}
              <div className="kpi-grid">
                <KPICard icon={Star} label="NPS Score" value={stats.nps > 0 ? `+${stats.nps}` : stats.nps} color="#16a34a" trend={trends.nps}>
                  <div style={{ display: "flex", gap: "8px", marginTop: "5px", flexWrap: "wrap" }}>
                    <MiniSegmentRow label="Promoters" pct={stats.promotersPct} color="#22c55e" />
                    <MiniSegmentRow label="Passives" pct={stats.passivesPct} color="#f59e0b" />
                    <MiniSegmentRow label="Detractors" pct={stats.detractorsPct} color="#ef4444" />
                  </div>
                </KPICard>
                <KPICard icon={Users} label="Total Responses" value={stats.total} sub="Response volume" color="#2563eb" trend={trends.total} />
                <KPICard icon={GraduationCap} label="Avg Teaching" value={stats.avgTeaching ? `${stats.avgTeaching} / 5` : "N/A"} sub="Based on responses" color="#3b82f6" trend={trends.teaching} />
                <KPICard icon={MessageSquareText} label="Doubt Resolution" value={stats.avgDoubt ? `${stats.avgDoubt} / 5` : "N/A"} sub="Based on responses" color="#06b6d4" trend={trends.doubt} />
                <KPICard icon={ListFilter} label="Website / LMS" value={stats.avgLms ? `${stats.avgLms} / 5` : "N/A"} sub="Based on responses" color="#f59e0b" trend={trends.lms}>
                  <span />
                </KPICard>
                <KPICard icon={MessageSquareText} label="Open Feedback" value={feedbackSentiment.total} sub="Written responses" color="#8b5cf6" trend={trends.feedbackCount}>
                  <div style={{ display: "flex", gap: "8px", marginTop: "5px", flexWrap: "wrap" }}>
                    <MiniSegmentRow label="Positive" pct={feedbackSentiment.positivePct} color="#22c55e" />
                    <MiniSegmentRow label="Neutral" pct={feedbackSentiment.neutralPct} color="#f59e0b" />
                    <MiniSegmentRow label="Negative" pct={feedbackSentiment.negativePct} color="#ef4444" />
                  </div>
                </KPICard>
              </div>

              {/* NPS Health row */}
              <div className="grid-3a">
                <div className="card">
                  <SectionTitle icon={Star} color="#16a34a" title="NPS Health" sub="Overall learner advocacy and trend" />
                  <div className="nps-row" style={{ marginTop: "12px" }}>
                    <div style={{ position: "relative", width: 110, height: 110, flexShrink: 0 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={[{ v: stats.promoters }, { v: stats.passives }, { v: stats.detractors }]} dataKey="v" innerRadius={36} outerRadius={52} startAngle={90} endAngle={-270}>
                            <Cell fill="#22c55e" /><Cell fill="#f59e0b" /><Cell fill="#ef4444" />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="nps-center">{stats.nps > 0 ? "+" : ""}{stats.nps}<br /><span>NPS Score</span></div>
                    </div>
                    <div className="nps-legend">
                      <div><ThumbsUp size={12} color="#22c55e" /> Promoters <b>{stats.promotersPct}%</b> ({stats.promoters})</div>
                      <div><Meh size={12} color="#f59e0b" /> Passives <b>{stats.passivesPct}%</b> ({stats.passives})</div>
                      <div><ThumbsDown size={12} color="#ef4444" /> Detractors <b>{stats.detractorsPct}%</b> ({stats.detractors})</div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header-row">
                    <SectionTitle icon={ArrowUpRight} color="#2563eb" title="NPS Trend" sub="Overall learner advocacy and trend" />
                    <div className="range-pills">
                      {Object.entries(TREND_RANGE_LABELS).map(([d, label]) => (
                        <button key={d} className={`range-pill ${Number(d) === trendRangeDays ? "range-pill-active" : ""}`} onClick={() => setTrendRangeDays(Number(d))}>{label}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{ height: 180, marginTop: "8px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={npsTrendSeries}>
                        <CartesianGrid stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#94a3b8" }} interval={Math.ceil(npsTrendSeries.length / 6)} />
                        <YAxis domain={[-100, 100]} tick={{ fontSize: 9.5, fill: "#94a3b8" }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="nps" name="NPS" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2 }} connectNulls />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="card nps-status-card">
                  <div className="status-label">NPS Status</div>
                  <div className="status-value">
                    {stats.nps >= HEALTH_THRESHOLDS.healthyNps ? "Healthy" : stats.nps >= HEALTH_THRESHOLDS.watchNps ? "Watch" : "At Risk"}
                  </div>
                  {trends.nps && (
                    <div className={`status-trend ${trends.nps.dir === "up" ? "status-trend-up" : "status-trend-down"}`}>
                      {trends.nps.dir === "up" ? "↑" : "↓"} {trends.nps.text} points vs previous period
                    </div>
                  )}
                  <div className="status-rows">
                    <div><span>Total Responses</span><b>{stats.total}</b></div>
                    <div><span>Previous Period NPS</span><b>{prevStats.total ? prevStats.nps : "N/A"}</b></div>
                  </div>
                  {stats.total < HEALTH_THRESHOLDS.lowResponseVolume && (
                    <div className="low-sample-note"><Info size={11} /> Low response volume — interpret with caution.</div>
                  )}
                </div>
              </div>

              {/* Response Distribution */}
              <div className="card">
                <SectionTitle icon={ListFilter} color="#8b5cf6" title="Response Distribution" sub="NPS scores from 0 (would not recommend) to 10 (definitely recommend)" />
                <div style={{ height: 160, marginTop: "10px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={scoreDistribution}>
                      <CartesianGrid stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="score" tick={{ fontSize: 10.5, fill: "#94a3b8" }} />
                      <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {scoreDistribution.map((d) => (
                          <Cell key={d.score} fill={d.score <= 6 ? "#ef4444" : d.score <= 8 ? "#f59e0b" : "#22c55e"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="distribution-legend">
                  <div className="dist-box dist-box-red"><b>Detractors</b><span>0–6</span><div>{stats.detractorsPct}% ({stats.detractors})</div></div>
                  <div className="dist-box dist-box-amber"><b>Passives</b><span>7–8</span><div>{stats.passivesPct}% ({stats.passives})</div></div>
                  <div className="dist-box dist-box-green"><b>Promoters</b><span>9–10</span><div>{stats.promotersPct}% ({stats.promoters})</div></div>
                </div>
              </div>

              {/* Experience Driver Analysis + Impact Matrix + Scorecard */}
              <div className="grid-3a">
                <div className="card">
                  <SectionTitle icon={GraduationCap} color="#2563eb" title="What Drives Learner Satisfaction?" sub="Association between experience dimensions and NPS" />
                  <div className="table-wrap" style={{ marginTop: "10px" }}>
                    <table className="mini-table">
                      <thead><tr><th>Dimension</th><th>Avg. Score</th><th>NPS Impact</th><th>Responses</th><th>Trend</th></tr></thead>
                      <tbody>
                        {driverAnalysis.map((d) => (
                          <tr key={d.label}>
                            <td className="strong">{d.label}</td>
                            <td>{d.score ? `${d.score} / 5` : "N/A"}</td>
                            <td><StatusPill label={d.impactLabel} tone={d.impactTier === "high" ? "risk" : d.impactTier === "moderate" ? "watch" : d.impactTier === "low" ? "neutral" : "neutral"} /></td>
                            <td className="muted">{d.n}</td>
                            <td><TrendArrow trend={d.trend} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="card">
                  <SectionTitle icon={ListFilter} color="#a855f7" title="Learner Experience Impact Matrix" sub="Performance vs NPS impact (based on response data)" />
                  <div style={{ height: 210, marginTop: "10px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                        <CartesianGrid stroke="#f1f5f9" />
                        <XAxis type="number" dataKey="impact" domain={[0, 1]} tickFormatter={(v) => v.toFixed(1)} tick={{ fontSize: 9.5, fill: "#94a3b8" }} label={{ value: "Estimated NPS Impact", position: "insideBottom", offset: -4, fontSize: 10, fill: "#94a3b8" }} />
                        <YAxis type="number" dataKey="performance" domain={[0, 5]} tick={{ fontSize: 9.5, fill: "#94a3b8" }} label={{ value: "Experience Performance", angle: -90, position: "insideLeft", fontSize: 10, fill: "#94a3b8" }} />
                        <ZAxis range={[120, 120]} />
                        <Tooltip cursor={{ strokeDasharray: "3 3" }} formatter={(v, n) => [v, n]} labelFormatter={() => ""} content={({ payload }) => payload && payload[0] ? (
                          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "6px 10px", fontSize: 11 }}>
                            <b>{payload[0].payload.label}</b><br />Performance: {payload[0].payload.performance}/5<br />Impact: {payload[0].payload.impact === null ? "Insufficient data" : payload[0].payload.impact.toFixed(2)}
                          </div>
                        ) : null} />
                        <Scatter data={driverAnalysis.map((d) => ({ label: d.label, performance: d.score || 0, impact: d.r === null ? 0.02 : Math.abs(d.r) }))} fill="#8b5cf6">
                          {driverAnalysis.map((d, i) => <Cell key={i} fill={["#3b82f6", "#06b6d4", "#f59e0b"][i % 3]} />)}
                        </Scatter>
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="matrix-legend">
                    {driverAnalysis.map((d, i) => (
                      <div key={d.label}><span className="legend-dot" style={{ background: ["#3b82f6", "#06b6d4", "#f59e0b"][i % 3] }} /> {d.label}</div>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <SectionTitle icon={Star} color="#f59e0b" title="Experience Scorecard" sub="Current vs previous period" />
                  <div className="table-wrap" style={{ marginTop: "10px" }}>
                    <table className="mini-table">
                      <thead><tr><th>Dimension</th><th>Score</th><th>Previous</th><th>Change</th><th>Status</th></tr></thead>
                      <tbody>
                        {driverAnalysis.map((d) => {
                          const delta = d.trend ? (d.trend.dir === "up" ? d.trend.text : `-${d.trend.text}`) : "0";
                          const status = !d.trend ? "Stable" : d.trend.dir === "up" ? "Improving" : "Watch";
                          return (
                            <tr key={d.label}>
                              <td className="strong">{d.label}</td>
                              <td>{d.score ?? "N/A"}</td>
                              <td className="muted">{d.prevScore ?? "N/A"}</td>
                              <td style={{ color: !d.trend ? "#94a3b8" : d.trend.dir === "up" ? "#16a34a" : "#dc2626", fontWeight: 700 }}>{d.prevScore != null ? (d.score - d.prevScore >= 0 ? "+" : "") + round(d.score - d.prevScore, 1) : "—"}</td>
                              <td><StatusPill label={status} tone={status === "Improving" ? "good" : status === "Watch" ? "watch" : "neutral"} /></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {themes[0] && (
                    <div className="quick-insight">
                      <Sparkles size={13} color="#f59e0b" />
                      <span><b>Quick Insight:</b> &ldquo;{themes[0].name}&rdquo; is the most-mentioned theme in learner feedback ({themes[0].mentions} mentions, avg NPS {themes[0].avgNps}).</span>
                    </div>
                  )}
                </div>
              </div>

              {/* By Mentor / Course / Batch */}
              <div className="grid-3a">
                <div className="card">
                  <SectionTitle icon={Users} color="#2563eb" title="Mentor NPS Performance" sub="Compare NPS and experience scores across mentors" />
                  <div className="table-wrap" style={{ marginTop: "10px" }}>
                    <table className="mini-table">
                      <thead><tr><th>Mentor</th><th>Resp.</th><th>NPS</th><th>Teach</th><th>Doubt</th><th>LMS</th></tr></thead>
                      <tbody>
                        {byMentor.slice(0, 6).map((m) => (
                          <tr key={m.name}>
                            <td className="strong">{m.name}</td>
                            <td className="muted">{m.responses}</td>
                            <td style={{ color: m.nps >= 0 ? "#16a34a" : "#dc2626", fontWeight: 700 }}>{m.nps > 0 ? "+" : ""}{m.nps}</td>
                            <td className="muted">{m.teaching ?? "—"}</td>
                            <td className="muted">{m.doubt ?? "—"}</td>
                            <td className="muted">{m.lms ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="card">
                  <SectionTitle icon={GraduationCap} color="#16a34a" title="Course Experience Intelligence" sub="Context data linking courses and impact scores" />
                  <div className="table-wrap" style={{ marginTop: "10px" }}>
                    <table className="mini-table">
                      <thead><tr><th>Course</th><th>Resp.</th><th>NPS</th><th>Teach</th><th>Doubt</th><th>LMS</th></tr></thead>
                      <tbody>
                        {byCourse.slice(0, 6).map((c) => (
                          <tr key={c.name}>
                            <td className="strong">{c.name}</td>
                            <td className="muted">{c.responses}</td>
                            <td style={{ color: c.nps >= 0 ? "#16a34a" : "#dc2626", fontWeight: 700 }}>{c.nps > 0 ? "+" : ""}{c.nps}</td>
                            <td className="muted">{c.teaching ?? "—"}</td>
                            <td className="muted">{c.doubt ?? "—"}</td>
                            <td className="muted">{c.lms ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="card">
                  <SectionTitle icon={ListFilter} color="#f59e0b" title="Batch Health" sub="Response count and NPS by batch" />
                  <div className="table-wrap" style={{ marginTop: "10px" }}>
                    <table className="mini-table">
                      <thead><tr><th>Batch</th><th>NPS</th><th>Resp.</th><th>Detr. %</th><th>Trend</th></tr></thead>
                      <tbody>
                        {byBatch.slice(0, 6).map((b) => (
                          <tr key={b.name}>
                            <td className="strong">{b.name}</td>
                            <td style={{ color: b.nps >= 0 ? "#16a34a" : "#dc2626", fontWeight: 700 }}>{b.nps > 0 ? "+" : ""}{b.nps}</td>
                            <td className="muted">{b.responses}</td>
                            <td className="muted">{b.detractorPct}%</td>
                            <td>{b.nps >= 0 ? <span style={{ color: "#16a34a" }}>↑</span> : <span style={{ color: "#dc2626" }}>↓</span>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* NPS Trend vs Experience + Feedback Sentiment/Themes */}
              <div className="grid-2a">
                <div className="card">
                  <div className="card-header-row">
                    <SectionTitle icon={ArrowUpRight} color="#3b82f6" title="NPS Trend vs Experience Scores" sub="Do experience score changes track with NPS?" />
                    <div className="range-pills">
                      {Object.entries(TREND_RANGE_LABELS).slice(0, 4).map(([d, label]) => (
                        <button key={d} className={`range-pill ${Number(d) === expTrendRangeDays ? "range-pill-active" : ""}`} onClick={() => setExpTrendRangeDays(Number(d))}>{label}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{ height: 220, marginTop: "8px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={expTrendSeries}>
                        <CartesianGrid stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#94a3b8" }} interval={Math.ceil(expTrendSeries.length / 6)} />
                        <YAxis yAxisId="left" domain={[0, 5]} tick={{ fontSize: 9.5, fill: "#94a3b8" }} />
                        <YAxis yAxisId="right" orientation="right" domain={[-100, 100]} tick={{ fontSize: 9.5, fill: "#94a3b8" }} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 10.5 }} />
                        <Line yAxisId="right" type="monotone" dataKey="nps" name="NPS (scaled)" stroke="#3b82f6" strokeWidth={2} dot={false} connectNulls />
                        <Line yAxisId="left" type="monotone" dataKey="teaching" name="Teaching" stroke="#f59e0b" strokeWidth={1.5} dot={false} connectNulls />
                        <Line yAxisId="left" type="monotone" dataKey="doubt" name="Doubt Resolution" stroke="#06b6d4" strokeWidth={1.5} dot={false} connectNulls />
                        <Line yAxisId="left" type="monotone" dataKey="lms" name="Website / LMS" stroke="#a855f7" strokeWidth={1.5} dot={false} connectNulls />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="card">
                  <SectionTitle icon={MessageSquareText} color="#16a34a" title="Feedback Sentiment & Top Themes" sub="Sentiment inferred from each response's NPS segment" />
                  <div className="nps-row" style={{ marginTop: "12px", alignItems: "flex-start" }}>
                    <div style={{ position: "relative", width: 100, height: 100, flexShrink: 0 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={[{ v: feedbackSentiment.positive }, { v: feedbackSentiment.neutral }, { v: feedbackSentiment.negative }]} dataKey="v" innerRadius={32} outerRadius={48} startAngle={90} endAngle={-270}>
                            <Cell fill="#22c55e" /><Cell fill="#f59e0b" /><Cell fill="#ef4444" />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="nps-center" style={{ fontSize: "16px" }}>{feedbackSentiment.total}<br /><span>Feedback</span></div>
                    </div>
                    <div className="table-wrap" style={{ flex: 1 }}>
                      <table className="mini-table">
                        <thead><tr><th>Theme</th><th>Mentions</th><th>Sentiment</th><th>Avg NPS</th></tr></thead>
                        <tbody>
                          {themes.length === 0 ? (
                            <tr><td colSpan={4} className="muted">No recurring themes detected in current feedback.</td></tr>
                          ) : themes.slice(0, 5).map((t) => (
                            <tr key={t.name}>
                              <td className="strong">{t.name}</td>
                              <td className="muted">{t.mentions}</td>
                              <td><StatusPill label={t.sentiment} tone={t.sentiment === "Positive" ? "good" : t.sentiment === "Negative" ? "risk" : "watch"} /></td>
                              <td className="muted">{t.avgNps > 0 ? "+" : ""}{t.avgNps}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Promoter / Passive Intelligence */}
              <div className="grid-2a">
                <div className="card">
                  <SectionTitle icon={ThumbsUp} color="#16a34a" title="Promoter Experience" sub={`${promoterIntel.total} promoters (${promoterIntel.pct}%)`} />
                  <div className="intel-stats-row">
                    <div><span>Avg Teaching</span><b>{promoterIntel.avgTeaching ?? "N/A"}</b></div>
                    <div><span>Avg Doubt Resolution</span><b>{promoterIntel.avgDoubt ?? "N/A"}</b></div>
                    <div><span>Avg Website / LMS</span><b>{promoterIntel.avgLms ?? "N/A"}</b></div>
                  </div>
                  <div className="intel-subtitle">What Promoters Like</div>
                  {promoterIntel.themes.length === 0 ? (
                    <div className="empty-state" style={{ padding: "10px 0" }}>No written feedback from promoters yet.</div>
                  ) : (
                    <div className="theme-chip-row">{promoterIntel.themes.map((t) => <span key={t.name} className="theme-chip theme-chip-good">{t.name} ({t.mentions})</span>)}</div>
                  )}
                </div>

                <div className="card">
                  <SectionTitle icon={Meh} color="#b45309" title="Passive Learners" sub={`${passiveIntel.total} passives (${passiveIntel.pct}%) — rated 7–8`} />
                  <div className="intel-stats-row">
                    <div><span>Avg Teaching</span><b>{passiveIntel.avgTeaching ?? "N/A"}</b></div>
                    <div><span>Avg Doubt Resolution</span><b>{passiveIntel.avgDoubt ?? "N/A"}</b></div>
                    <div><span>Avg Website / LMS</span><b>{passiveIntel.avgLms ?? "N/A"}</b></div>
                  </div>
                  <div className="intel-subtitle">Common Feedback Themes</div>
                  {passiveIntel.themes.length === 0 ? (
                    <div className="empty-state" style={{ padding: "10px 0" }}>No written feedback from passives yet.</div>
                  ) : (
                    <div className="theme-chip-row">{passiveIntel.themes.map((t) => <span key={t.name} className="theme-chip theme-chip-watch">{t.name} ({t.mentions})</span>)}</div>
                  )}
                </div>
              </div>

              {/* Detractor Intelligence + Action Center */}
              <div className="grid-2a">
                <div className="card attention-card">
                  <SectionTitle icon={AlertTriangle} color="#dc2626" title="Detractor Intelligence" sub="Learners who rated 0–6" />
                  <div className="intel-stats-row" style={{ marginTop: "10px" }}>
                    <div><span>Total Detractors</span><b>{detractorIntel.total} ({detractorIntel.pct}%)</b></div>
                    <div><span>Top Complaint Theme</span><b>{detractorIntel.topTheme}</b></div>
                  </div>
                  <div className="intel-stats-row">
                    <div><span>Most Affected Course</span><b>{detractorIntel.topCourse}</b></div>
                    <div><span>Most Affected Batch</span><b>{detractorIntel.topBatch}</b></div>
                    <div><span>Most Affected Mentor</span><b>{detractorIntel.topMentor}</b></div>
                  </div>
                  {detractors.length === 0 ? (
                    <div className="empty-state" style={{ padding: "10px 0" }}>No detractors in the current scope.</div>
                  ) : (
                    <div className="table-wrap" style={{ marginTop: "8px" }}>
                      <table className="mini-table">
                        <thead><tr><th>NPS</th><th>Mentor</th><th>Course</th><th>Batch</th><th>Feedback</th></tr></thead>
                        <tbody>
                          {detractors.slice(0, 5).map((r) => (
                            <tr key={r.id}>
                              <td style={{ color: "#dc2626", fontWeight: 800 }}>{r.nps_score}</td>
                              <td className="muted">{r.mentor_name}</td>
                              <td className="muted">{r.course_name}</td>
                              <td className="muted">{r.batch_name}</td>
                              <td className="muted" style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.feedback || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="card attention-card">
                  <SectionTitle icon={AlertTriangle} color="#f59e0b" title="Action Center" sub="Data-driven signals worth investigating" />
                  {actionItems.length === 0 ? (
                    <div className="empty-state" style={{ padding: "14px 0" }}>No signals require attention right now.</div>
                  ) : (
                    <div className="action-list">
                      {actionItems.slice(0, 5).map((a, i) => (
                        <div key={i} className="action-item">
                          <span className={`attention-icon ${a.priority === "High" ? "attention-icon-red" : "attention-icon-amber"}`}>{a.priority === "High" ? "✕" : "!"}</span>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div className="action-issue">{a.issue} <StatusPill label={a.priority} tone={a.priority === "High" ? "risk" : a.priority === "Medium" ? "watch" : "neutral"} /></div>
                            <div className="action-evidence">{a.evidence} {a.affected}</div>
                            <div className="action-note">{a.note}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Response Explorer */}
              <div className="card">
                <div className="list-toolbar">
                  <SectionTitle icon={Search} color="#2563eb" title="Response Explorer" sub="View detailed learner responses with filters" />
                  <div className="search-wrap">
                    <Search size={14} strokeWidth={2.3} className="search-icon" />
                    <input className="search-input" placeholder="Search by learner, course, batch, mentor…" value={responseSearch} onChange={(e) => setResponseSearch(e.target.value)} />
                  </div>
                </div>
                <div className="table-wrap">
                  <table className="styled-table">
                    <thead>
                      <tr><th>Date</th><th>Learner</th><th>Course</th><th>Batch</th><th>Mentor</th><th>Teaching</th><th>Doubt</th><th>LMS</th><th>NPS</th><th>Segment</th><th>Feedback</th></tr>
                    </thead>
                    <tbody>
                      {pagedResponses.map((r) => {
                        const seg = segmentOf(r.nps_score);
                        return (
                          <tr key={r.id}>
                            <td className="muted">{r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}</td>
                            <td className="strong">{r.learner_name}</td>
                            <td className="muted">{r.course_name}</td>
                            <td className="muted">{r.batch_name}</td>
                            <td className="muted">{r.mentor_name}</td>
                            <td className="muted">{r.instructor_rating}</td>
                            <td className="muted">{r.doubt_rating}</td>
                            <td className="muted">{r.website_rating}</td>
                            <td className="muted">{r.nps_score}</td>
                            <td><StatusPill label={seg[0].toUpperCase() + seg.slice(1)} tone={seg === "promoter" ? "good" : seg === "detractor" ? "risk" : "watch"} /></td>
                            <td className="muted" style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.feedback || "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {filteredResponses.length === 0 && <div className="empty-state">No responses match your search.</div>}
                </div>
                {filteredResponses.length > 0 && (
                  <div className="pagination">
                    <button className="btn-page" disabled={responsePage <= 1} onClick={() => setResponsePage((p) => p - 1)}>← Previous</button>
                    <span className="page-info">Showing {(responsePage - 1) * responsePageSize + 1} to {Math.min(responsePage * responsePageSize, filteredResponses.length)} of {filteredResponses.length} results</span>
                    <button className="btn-page" disabled={responsePage >= responseTotalPages} onClick={() => setResponsePage((p) => p + 1)}>Next →</button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {exportMenu && (
          <>
            <div className="dismiss-backdrop" onClick={() => setExportMenu(null)} />
            <div className="export-menu" style={{ position: "fixed", top: exportMenu.top, left: exportMenu.left }}>
              <a href={`${API}/export-nps${exportSuffix}`} className="export-item" target="_blank" rel="noreferrer" onClick={() => setExportMenu(null)}>Export Excel</a>
              <a href={`${API}/export-nps-report${exportSuffix}`} className="export-item" target="_blank" rel="noreferrer" onClick={() => setExportMenu(null)}>Export PDF Report</a>
            </div>
          </>
        )}

        <style jsx>{`
          .page-hero {
            position: relative; overflow: hidden; border-radius: 18px; padding: 26px 32px; margin-bottom: 14px;
            background: linear-gradient(120deg, #0f172a 0%, #1e293b 60%, #0f172a 100%);
            display: flex; align-items: center; justify-content: space-between; gap: 20px;
            box-shadow: 0 16px 32px -18px rgba(15, 23, 42, 0.55);
          }
          .page-hero-blob { position: absolute; width: 220px; height: 220px; border-radius: 50%; background: #f59e0b; filter: blur(60px); opacity: 0.3; top: -80px; right: 160px; }
          .page-hero-content { position: relative; z-index: 1; }
          .page-hero-eyebrow {
            display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
            color: #fbbf24; background: rgba(251, 191, 36, 0.12); border: 1px solid rgba(251, 191, 36, 0.3);
            padding: 5px 10px; border-radius: 999px; margin-bottom: 10px;
          }
          :global(.page-hero-title) { font-family: "Playfair Display", Georgia, serif; font-size: 26px; font-weight: 800; color: #f8fafc; margin: 0 0 6px; }
          .page-hero-subtitle { color: #94a3b8; font-size: 13.5px; margin: 0; max-width: 480px; }
          .page-hero-right { position: relative; z-index: 2; display: flex; align-items: center; gap: 12px; flex-shrink: 0; margin-left: auto; }
          .hero-clock { color: #cbd5e1; font-size: 11.5px; font-weight: 600; text-align: right; white-space: nowrap; }
          .hero-clock-time { display: block; color: #fbbf24; font-weight: 800; font-size: 13px; margin-top: 1px; }
          .header-item-wrap { position: relative; }
          .hero-icon-btn { width: 34px; height: 34px; border-radius: 9px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); color: #cbd5e1; display: flex; align-items: center; justify-content: center; cursor: pointer; }
          .hero-icon-btn:hover { background: rgba(255,255,255,0.14); color: #fbbf24; }
          .hero-notif-dropdown { position: absolute; top: calc(100% + 10px); right: 0; min-width: 210px; background: #fff; border-radius: 12px; box-shadow: 0 16px 30px -14px rgba(0,0,0,0.35); padding: 10px; z-index: 30; }
          .hero-notif-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: #94a3b8; padding: 2px 4px 8px; }
          .hero-notif-empty { font-size: 12.5px; color: #94a3b8; padding: 4px; }
          .hero-avatar-img { width: 34px; height: 34px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
          .hero-avatar { width: 34px; height: 34px; border-radius: 50%; background: rgba(240,199,94,0.18); color: #fbbf24; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; flex-shrink: 0; }
          .dismiss-backdrop { position: fixed; inset: 0; z-index: 25; }

          .card { background: #ffffff; border-radius: 14px; padding: 16px 18px; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06); border: 1px solid #eef2f7; margin-bottom: 14px; }
          :global(.card-title) { margin: 0; font-family: "Playfair Display", Georgia, serif; font-weight: 800; font-size: 15px; color: #1e293b; }
          :global(.card-sub) { font-size: 10.5px; color: #94a3b8; margin-top: 1px; }
          .card-header-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 2px; }

          .filter-card { padding: 14px 18px; }
          .filter-grid { display: flex; align-items: flex-end; gap: 12px; flex-wrap: wrap; }
          .filter-field { display: flex; flex-direction: column; gap: 5px; }
          .filter-field label { font-size: 10.5px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.02em; }
          .filter-field select { border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 10px; font-size: 12.5px; background: #f8fafc; outline: none; min-width: 140px; }
          .btn-reset { display: inline-flex; align-items: center; gap: 6px; background: #f1f5f9; border: 1px solid #e2e8f0; color: #334155; border-radius: 8px; padding: 8px 12px; font-size: 12px; font-weight: 700; cursor: pointer; }
          .btn-reset:hover { background: #e2e8f0; }
          .export-wrap { position: relative; margin-left: auto; }
          .btn-export-main { background: linear-gradient(120deg, #f59e0b, #fbbf24); color: #0f172a; border: none; border-radius: 8px; padding: 8px 14px; font-weight: 800; font-size: 12.5px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
          .export-menu { background: #fff; border-radius: 10px; box-shadow: 0 16px 30px -14px rgba(0,0,0,0.35); padding: 6px; min-width: 190px; z-index: 30; }
          :global(.export-item) { display: block; padding: 9px 10px; font-size: 13px; font-weight: 600; color: #1e293b; text-decoration: none; border-radius: 7px; }
          :global(.export-item:hover) { background: #f1f5f9; }

          .error-banner { display: flex; align-items: center; gap: 10px; background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; padding: 10px 14px; border-radius: 10px; margin-bottom: 14px; font-size: 12.5px; font-weight: 600; }
          .error-banner span { flex: 1; }
          .btn-retry { display: inline-flex; align-items: center; gap: 6px; background: #fff; border: 1px solid #fecaca; color: #b91c1c; border-radius: 8px; padding: 6px 12px; font-size: 12px; font-weight: 700; cursor: pointer; }

          .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 10px; margin-bottom: 14px; }
          .grid-3a { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; margin-bottom: 14px; }
          .grid-2a { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }

          .nps-row { display: flex; align-items: center; gap: 16px; }
          .nps-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 18px; font-weight: 800; color: #0f172a; text-align: center; pointer-events: none; }
          .nps-center span { font-size: 8.5px; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
          .nps-legend { display: flex; flex-direction: column; gap: 7px; font-size: 12px; color: #475569; font-weight: 600; }
          .nps-legend > div { display: flex; align-items: center; gap: 6px; }
          .nps-legend b { color: #0f172a; margin-left: 2px; }

          .range-pills { display: flex; gap: 4px; flex-shrink: 0; }
          .range-pill { background: #f8fafc; border: 1px solid #e2e8f0; color: #64748b; font-size: 10.5px; font-weight: 700; padding: 4px 8px; border-radius: 6px; cursor: pointer; }
          .range-pill:hover { background: #f1f5f9; }
          .range-pill-active { background: #0f172a; border-color: #0f172a; color: #fbbf24; }

          .nps-status-card { display: flex; flex-direction: column; }
          .status-label { font-size: 10.5px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.03em; }
          .status-value { font-family: "Playfair Display", Georgia, serif; font-size: 24px; font-weight: 800; color: #0f172a; margin-top: 4px; }
          .status-trend { font-size: 11.5px; font-weight: 700; margin-top: 4px; }
          .status-trend-up { color: #16a34a; }
          .status-trend-down { color: #dc2626; }
          .status-rows { margin-top: 12px; display: flex; flex-direction: column; gap: 6px; }
          .status-rows > div { display: flex; justify-content: space-between; font-size: 11.5px; color: #64748b; font-weight: 600; }
          .status-rows b { color: #0f172a; }
          .low-sample-note { display: flex; align-items: center; gap: 5px; font-size: 10.5px; color: #b45309; background: #fef3c7; padding: 6px 8px; border-radius: 8px; margin-top: 10px; }

          .distribution-legend { display: flex; gap: 10px; margin-top: 10px; }
          .dist-box { flex: 1; border-radius: 10px; padding: 8px 10px; font-size: 11px; }
          .dist-box b { display: block; font-size: 12px; }
          .dist-box span { color: #94a3b8; font-size: 10px; }
          .dist-box div { font-weight: 800; margin-top: 2px; }
          .dist-box-red { background: #fef2f2; color: #b91c1c; }
          .dist-box-amber { background: #fffbeb; color: #b45309; }
          .dist-box-green { background: #f0fdf4; color: #15803d; }

          .table-wrap { overflow-x: auto; }
          .mini-table { width: 100%; border-collapse: collapse; font-size: 11.5px; }
          .mini-table thead th { text-align: left; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.03em; color: #94a3b8; font-weight: 700; padding: 5px 8px 6px 0; border-bottom: 1px solid #f1f5f9; white-space: nowrap; }
          .mini-table td { padding: 7px 8px 7px 0; border-bottom: 1px solid #f8fafc; color: #334155; }
          .mini-table tr:last-child td { border-bottom: none; }
          .mini-table td.strong { font-weight: 700; color: #1e293b; }
          .mini-table td.muted { color: #94a3b8; }

          .matrix-legend { display: flex; gap: 12px; margin-top: 8px; font-size: 10.5px; color: #64748b; font-weight: 600; flex-wrap: wrap; }
          .matrix-legend > div { display: flex; align-items: center; gap: 5px; }
          .legend-dot { width: 7px; height: 7px; border-radius: 50%; display: inline-block; }

          .quick-insight { display: flex; gap: 7px; align-items: flex-start; background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 8px 10px; margin-top: 10px; font-size: 11px; color: #92400e; line-height: 1.4; }

          .intel-stats-row { display: flex; gap: 22px; flex-wrap: wrap; margin-bottom: 4px; }
          .intel-stats-row > div { display: flex; flex-direction: column; }
          .intel-stats-row span { font-size: 10px; color: #94a3b8; font-weight: 700; text-transform: uppercase; }
          .intel-stats-row b { font-size: 15px; color: #0f172a; margin-top: 2px; }
          .intel-subtitle { font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.03em; margin: 10px 0 6px; }
          .theme-chip-row { display: flex; gap: 6px; flex-wrap: wrap; }
          .theme-chip { font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 999px; }
          .theme-chip-good { background: #dcfce7; color: #15803d; }
          .theme-chip-watch { background: #fef3c7; color: #b45309; }

          .attention-card { border-left: 3px solid #f59e0b; }
          .action-list { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; }
          .action-item { display: flex; gap: 10px; align-items: flex-start; padding: 8px 6px; border-radius: 8px; }
          .action-item:hover { background: #f8fafc; }
          .attention-icon { width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; flex-shrink: 0; margin-top: 1px; }
          .attention-icon-red { background: rgba(239,68,68,0.14); color: #ef4444; }
          .attention-icon-amber { background: rgba(245,158,11,0.14); color: #b45309; }
          .action-issue { font-size: 12.5px; font-weight: 700; color: #1e293b; display: flex; align-items: center; gap: 8px; }
          .action-evidence { font-size: 11px; color: #64748b; margin-top: 2px; }
          .action-note { font-size: 10.5px; color: #94a3b8; margin-top: 2px; font-style: italic; }

          .list-toolbar { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 14px; margin-bottom: 14px; }
          .search-wrap { position: relative; }
          .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); opacity: 0.45; }
          .search-input { width: 280px; padding: 9px 11px 9px 32px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 12.5px; background: #f8fafc; outline: none; box-sizing: border-box; }

          .styled-table { width: 100%; border-collapse: collapse; font-size: 12px; min-width: 1100px; }
          .styled-table thead th { text-align: left; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.03em; color: #94a3b8; font-weight: 700; padding: 8px 10px; border-bottom: 2px solid #f1f5f9; white-space: nowrap; }
          .styled-table td { padding: 9px 10px; border-bottom: 1px solid #f1f5f9; color: #1e293b; white-space: nowrap; }
          .styled-table td.strong { font-weight: 700; }
          .styled-table td.muted { color: #64748b; }

          .pagination { display: flex; align-items: center; justify-content: space-between; margin-top: 14px; flex-wrap: wrap; gap: 10px; }
          .btn-page { background: #f1f5f9; border: none; border-radius: 8px; padding: 7px 14px; font-size: 12px; font-weight: 700; color: #334155; cursor: pointer; }
          .btn-page:disabled { opacity: 0.4; cursor: not-allowed; }
          .page-info { font-size: 12px; color: #64748b; font-weight: 600; }

          .empty-state { text-align: center; padding: 40px 20px; color: #94a3b8; font-size: 14px; }

          @media (max-width: 1500px) {
            .grid-3a { grid-template-columns: 1fr 1fr; }
          }
          @media (max-width: 1100px) {
            .grid-3a, .grid-2a { grid-template-columns: 1fr; }
          }
        `}</style>
      </>
    </ProtectedRoute>
  );
}
