import { useEffect, useMemo, useState } from "react";
import Sidebar from "../../components/Sidebar";
import ProtectedRoute from "../../components/ProtectedRoute";
import PlacementKPI from "../../components/analytics/PlacementKPI";
import NPSHeaderBanner from "../../components/nps/NPSHeaderBanner";
import NPSFilterBar from "../../components/nps/NPSFilterBar";
import NPSDistributionChart from "../../components/nps/NPSDistributionChart";
import AverageRatingsChart from "../../components/nps/AverageRatingsChart";
import NPSScoreDistributionChart from "../../components/nps/NPSScoreDistributionChart";
import NPSTrendChart from "../../components/nps/NPSTrendChart";
import NPSBreakdownChart from "../../components/nps/NPSBreakdownChart";
import TopFeedbackKeywordsChart from "../../components/nps/TopFeedbackKeywordsChart";
import LearnerConcerns from "../../components/nps/LearnerConcerns";
import AutomatedInsightsTable from "../../components/nps/AutomatedInsightsTable";
import NPSRecommendations from "../../components/nps/NPSRecommendations";
import NPSResponseTable from "../../components/nps/NPSResponseTable";

const EMPTY_FILTERS = { course_name: "", batch_name: "", mentor_name: "" };

function unique(list) {
  return [...new Set(list.filter(Boolean))].sort();
}

function buildQuery(filters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  return params.toString();
}

export default function NPSAnalyticsPage() {
  const [responses, setResponses] = useState(null);
  const [insights, setInsights] = useState(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [filterOptions, setFilterOptions] = useState({ course_name: [], batch_name: [], mentor_name: [] });

  // Baseline fetch (unfiltered) — only used to populate filter dropdown options once.
  useEffect(() => {
    fetch("http://127.0.0.1:8000/nps")
      .then((res) => res.json())
      .then((data) => {
        const all = Array.isArray(data) ? data : [];
        setFilterOptions({
          course_name: unique(all.map((r) => r.course_name)),
          batch_name: unique(all.map((r) => r.batch_name)),
          mentor_name: unique(all.map((r) => r.mentor_name)),
        });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const query = buildQuery(filters);
    const suffix = query ? `?${query}` : "";

    fetch(`http://127.0.0.1:8000/nps${suffix}`)
      .then((res) => res.json())
      .then((data) => setResponses(Array.isArray(data) ? data : []))
      .catch(() => setResponses([]));

    fetch(`http://127.0.0.1:8000/nps-insights${suffix}`)
      .then((res) => res.json())
      .then((data) => setInsights(data))
      .catch(() => setInsights(null));
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => setFilters(EMPTY_FILTERS);

  const exportQuery = buildQuery(filters);
  const exportSuffix = exportQuery ? `?${exportQuery}` : "";

  const lastUpdated = useMemo(() => {
    if (!responses || responses.length === 0) return null;

    const latest = responses.reduce((max, r) => {
      if (!r.created_at) return max;
      const t = new Date(r.created_at).getTime();
      return t > max ? t : max;
    }, 0);

    return latest ? new Date(latest).toLocaleString() : null;
  }, [responses]);

  const trend = useMemo(() => {
    if (!insights) return [];

    const responsesByDate = Object.fromEntries(
      insights.responses_per_day.map((r) => [r.date, r.count])
    );

    return insights.nps_trend_per_day.map((t) => ({
      month: t.date,
      responses: responsesByDate[t.date] || 0,
      nps: t.avg_nps,
    }));
  }, [insights]);

  if (responses === null || insights === null) {
    return <h2 style={{ padding: "30px" }}>Loading NPS Analytics...</h2>;
  }

  const {
    overall,
    rating_breakdown,
    by_mentor,
    by_course,
    by_batch,
    concern_keywords,
    praise_keywords,
    score_distribution,
    automated_insights_table,
    recommendations,
  } = insights;

  return (
    <ProtectedRoute>
      <>
        <Sidebar />

        <div
          style={{
            marginLeft: "300px",
            padding: "30px",
            background: "#f8fafc",
            minHeight: "100vh",
          }}
        >
          <NPSHeaderBanner lastUpdated={lastUpdated} />

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px",
              marginBottom: "24px",
            }}
          >
            <a href={`http://127.0.0.1:8000/export-nps${exportSuffix}`} target="_blank" rel="noreferrer">
              <button
                style={{
                  background: "#16a34a",
                  color: "#fff",
                  border: "none",
                  padding: "10px 18px",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                ⬇ Export Excel
              </button>
            </a>

            <a href={`http://127.0.0.1:8000/export-nps-report${exportSuffix}`} target="_blank" rel="noreferrer">
              <button
                style={{
                  background: "#0f172a",
                  color: "#facc15",
                  border: "none",
                  padding: "10px 18px",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                ⬇ Export PDF Report
              </button>
            </a>
          </div>

          <NPSFilterBar
            filters={filters}
            options={filterOptions}
            onChange={handleFilterChange}
            onClear={clearFilters}
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: "20px",
              marginBottom: "20px",
            }}
          >
            <PlacementKPI title="Total Responses" value={overall.total} color="#334155" />
            <PlacementKPI title="Avg Recommendation Score" value={`${overall.avg_nps_score} / 10`} color="#7c3aed" />
            <PlacementKPI title="NPS Score" value={overall.nps_score} color="#0f172a" />
            <PlacementKPI title="Promoters" value={overall.promoters} color="#16a34a" />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: "20px",
              marginBottom: "20px",
            }}
          >
            <PlacementKPI title="Passives" value={overall.passives} color="#f59e0b" />
            <PlacementKPI title="Detractors" value={overall.detractors} color="#dc2626" />
            <PlacementKPI title="Avg Instructor Rating" value={`${overall.avg_instructor} / 5`} color="#2563eb" />
            <PlacementKPI title="Avg Doubt Resolution" value={`${overall.avg_doubt} / 5`} color="#0891b2" />
          </div>

          <div style={{ marginBottom: "40px" }}>
            <PlacementKPI title="Avg Website / LMS Rating" value={`${overall.avg_website} / 5`} color="#ea580c" />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
            }}
          >
            <NPSDistributionChart
              promoters={overall.promoters}
              passives={overall.passives}
              detractors={overall.detractors}
            />

            <AverageRatingsChart
              instructor={overall.avg_instructor}
              doubt={overall.avg_doubt}
              website={overall.avg_website}
            />
          </div>

          <NPSScoreDistributionChart data={score_distribution} />

          <NPSTrendChart data={trend} />

          <h2 style={{ marginBottom: "6px" }}>🧭 Where to Focus</h2>
          <p style={{ color: "#64748b", marginTop: 0, marginBottom: "20px" }}>
            NPS score broken down by mentor, course, and batch — lowest first.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: "20px",
            }}
          >
            <NPSBreakdownChart title="👨‍🏫 By Mentor" data={by_mentor} />
            <NPSBreakdownChart title="📚 By Course" data={by_course} />
            <NPSBreakdownChart title="🎓 By Batch" data={by_batch} />
          </div>

          <TopFeedbackKeywordsChart data={concern_keywords} />

          <LearnerConcerns concernKeywords={concern_keywords} praiseKeywords={praise_keywords} />

          <AutomatedInsightsTable rows={automated_insights_table} />

          <NPSRecommendations recommendations={recommendations} />

          <NPSResponseTable data={responses} />
        </div>
      </>
    </ProtectedRoute>
  );
}
