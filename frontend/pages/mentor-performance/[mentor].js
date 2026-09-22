import { useRouter } from "next/router";
import MentorDetailView from "../../components/mentorPerformance/MentorDetailView";

// Standalone deep-link route (/mentor-performance/<name>). The main Mentor 360
// page renders the same view inline when a mentor is picked in its filters.
export default function MentorDetailPage() {
  const router = useRouter();
  const { mentor, course_name, batch_name, date_from, date_to } = router.query;

  return (
    <MentorDetailView
      mentorName={mentor ? decodeURIComponent(mentor) : null}
      filters={{ course_name, batch_name, date_from, date_to }}
    />
  );
}
