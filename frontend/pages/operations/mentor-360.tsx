import { useQuery, useQueryClient } from "@tanstack/react-query";
import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";

import ProtectedRoute from "../../components/ProtectedRoute";
import QueryProvider from "../../components/opsIntel/QueryProvider";
import Sidebar from "../../components/opsIntel/Sidebar";
import PageHeader from "../../components/opsIntel/PageHeader";
import MentorProfileCard from "../../components/mentor360/MentorProfileCard";
import Tabs, { MENTOR_TABS, MentorTab } from "../../components/mentor360/Tabs";
import OverviewTab from "../../components/mentor360/tabs/OverviewTab";
import SessionsTab from "../../components/mentor360/tabs/SessionsTab";
import NpsFeedbackTab from "../../components/mentor360/tabs/NpsFeedbackTab";
import BatchesTab from "../../components/mentor360/tabs/BatchesTab";
import AttendanceTab from "../../components/mentor360/tabs/AttendanceTab";
import QualityTab from "../../components/mentor360/tabs/QualityTab";
import OperationsTab from "../../components/mentor360/tabs/OperationsTab";
import ReportsTab from "../../components/mentor360/tabs/ReportsTab";

import { getMentorKPIs, getMentors, getNPS, getQuality, getSessionTrend } from "../../lib/mentor360/mentorService";
import type { Period } from "../../lib/mentor360/types";

function isMentorTab(v: unknown): v is MentorTab {
  return typeof v === "string" && (MENTOR_TABS as readonly string[]).includes(v);
}

function Mentor360Page() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [hydrated, setHydrated] = useState(false);
  const [mentorId, setMentorId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<MentorTab>("Overview");
  const [period, setPeriod] = useState<Period>("30d");
  const [exportRows, setExportRows] = useState<Record<string, unknown>[]>([]);

  const mentorsQ = useQuery({ queryKey: ["mentor360", "mentors"], queryFn: getMentors });

  // Hydrate mentor + tab from the URL once, then keep the URL in sync (shallow).
  useEffect(() => {
    if (!router.isReady || hydrated || !mentorsQ.data) return;
    const qMentor = typeof router.query.mentor === "string" ? router.query.mentor : "";
    const qTab = router.query.tab;
    setMentorId(qMentor && mentorsQ.data.some((m) => m.id === qMentor) ? qMentor : mentorsQ.data[0]?.id ?? "");
    if (isMentorTab(qTab)) setActiveTab(qTab);
    setHydrated(true);
  }, [router.isReady, hydrated, mentorsQ.data, router.query]);

  useEffect(() => {
    if (!hydrated || !mentorId) return;
    router.replace({ pathname: router.pathname, query: { mentor: mentorId, tab: activeTab } }, undefined, { shallow: true });
  }, [mentorId, activeTab, hydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  const kpisQ = useQuery({ queryKey: ["mentor360", "kpis", mentorId, period], queryFn: () => getMentorKPIs(mentorId, period), enabled: !!mentorId });
  const trendQ = useQuery({ queryKey: ["mentor360", "trend", mentorId, period], queryFn: () => getSessionTrend(mentorId, period), enabled: !!mentorId });
  const npsQ = useQuery({ queryKey: ["mentor360", "npsOverview", mentorId], queryFn: () => getNPS(mentorId), enabled: !!mentorId });
  const qualityQ = useQuery({ queryKey: ["mentor360", "qualityOverview", mentorId], queryFn: () => getQuality(mentorId), enabled: !!mentorId });

  const retry = (key: string) => queryClient.invalidateQueries({ queryKey: ["mentor360", key] });

  const handleSelectMentor = useCallback((id: string) => {
    setMentorId(id);
    setExportRows([]);
  }, []);

  const mentor = mentorsQ.data?.find((m) => m.id === mentorId) ?? null;

  return (
    <div className="min-h-screen bg-surface flex">
      <Sidebar activeItem="Mentor 360" />
      <div className="flex-1 min-w-0 px-4 sm:px-6 lg:px-7 py-5 lg:py-6 pt-16 lg:pt-6">
        <PageHeader eyebrow="Operations" title="Mentor 360" subtitle="Complete mentor insights – performance, sessions, learner feedback and operational metrics." />

        <MentorProfileCard mentors={mentorsQ.data ?? []} mentor={mentor} onSelect={handleSelectMentor} getExportRows={() => exportRows} />

        {!mentorId ? (
          <div className="bg-white border border-border rounded-card shadow-card p-10 text-center text-slate-400">
            {mentorsQ.isLoading ? "Loading mentors…" : "No mentors available."}
          </div>
        ) : (
          <>
            <Tabs active={activeTab} onChange={setActiveTab} />

            {activeTab === "Overview" && (
              <OverviewTab kpisQ={kpisQ} trendQ={trendQ} period={period} onPeriodChange={setPeriod} npsQ={npsQ} qualityQ={qualityQ} onRetry={retry} />
            )}
            {activeTab === "Sessions" && <SessionsTab mentorId={mentorId} onDataChange={setExportRows} />}
            {activeTab === "NPS & Feedback" && <NpsFeedbackTab mentorId={mentorId} onDataChange={setExportRows} />}
            {activeTab === "Batches" && <BatchesTab mentorId={mentorId} onDataChange={setExportRows} />}
            {activeTab === "Attendance" && <AttendanceTab mentorId={mentorId} onDataChange={setExportRows} />}
            {activeTab === "Quality" && <QualityTab mentorId={mentorId} onDataChange={setExportRows} />}
            {activeTab === "Operations" && <OperationsTab mentorId={mentorId} onDataChange={setExportRows} />}
            {activeTab === "Reports" && <ReportsTab mentorId={mentorId} onDataChange={setExportRows} />}
          </>
        )}
      </div>
    </div>
  );
}

export default function Mentor360EntryPoint() {
  return (
    <ProtectedRoute permission={["mentor_360", "view"]}>
      <Head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Dancing+Script:wght@600&display=swap" />
      </Head>
      <QueryProvider>
        <Mentor360Page />
      </QueryProvider>
    </ProtectedRoute>
  );
}
