// Rule-based (not AI-generated) insights derived from the real webinar
// analytics responses. Every sentence is built from numbers in the data —
// nothing here is a fixed claim.

export const LOW_ATTENDANCE_PCT = 50;
export const HEALTHY_ATTENDANCE_PCT = 70;
export const HIGH_POLL_RESPONSE_PCT = 70;

const round1 = (n) => Math.round(n * 10) / 10;
const avg = (list) => (list.length ? round1(list.reduce((a, b) => a + b, 0) / list.length) : null);
const pct = (n) => `${round1(n)}%`;

// Webinars with no registrations have an attendance of 0 only because there is
// nothing to measure — they are excluded from best/worst comparisons.
export function measurableWebinars(trend) {
  return (trend || []).filter((t) => (t.registered || 0) > 0);
}

export function pollTotals(polls) {
  const list = polls || [];
  const withPolls = list.filter((p) => (p.polls || 0) > 0);
  return {
    totalPolls: list.reduce((sum, p) => sum + (p.polls || 0), 0),
    totalResponses: list.reduce((sum, p) => sum + (p.responses || 0), 0),
    averageRating: avg(withPolls.map((p) => p.rating).filter((r) => typeof r === "number" && r > 0)),
  };
}

function extremes(trend) {
  const measurable = measurableWebinars(trend);
  if (!measurable.length) return { best: null, worst: null, measurable };
  const sorted = [...measurable].sort((a, b) => b.attendance - a.attendance);
  const best = sorted[0];
  const worst = sorted.length > 1 ? sorted[sorted.length - 1] : null;
  return { best, worst, measurable };
}

export function buildInsights(summary, trend) {
  if (!summary) return [];
  const { best, worst } = extremes(trend);
  const insights = [];

  insights.push(
    best
      ? {
          key: "strong-attendance",
          tone: "green",
          icon: "trend",
          title: "Strong Attendance",
          text: `${best.meeting.trim()} has the highest attendance at ${pct(best.attendance)}.`,
          series: (trend || []).map((t) => t.attendance),
        }
      : { key: "strong-attendance", tone: "slate", icon: "trend", title: "Attendance", text: "No webinar with registrations yet, so attendance can't be compared.", series: [] }
  );

  const pollRate = summary.poll_response_rate;
  const high = pollRate >= HIGH_POLL_RESPONSE_PCT;
  insights.push({
    key: "poll-engagement",
    tone: high ? "blue" : "amber",
    icon: "chat",
    title: high ? "High Engagement" : "Low Poll Engagement",
    text: high
      ? `Poll response rate is ${pct(pollRate)}, indicating active learner interaction during sessions.`
      : `Poll response rate is only ${pct(pollRate)}. Encourage learners to take part in polls.`,
    series: [],
  });

  if (worst && worst.attendance < HEALTHY_ATTENDANCE_PCT) {
    insights.push({
      key: "needs-attention",
      tone: "orange",
      icon: "alert",
      title: "Needs Attention",
      text: `${worst.meeting.trim()} shows the lowest attendance at ${pct(worst.attendance)} compared to other webinars.`,
      series: (trend || []).map((t) => t.attendance),
    });
  } else {
    insights.push({
      key: "needs-attention",
      tone: "green",
      icon: "check",
      title: "Attendance Is Healthy",
      text: worst ? `Every webinar is at ${pct(worst.attendance)} attendance or above.` : "Only one webinar is in scope, so there is nothing to compare against.",
      series: [],
    });
  }

  const rating = summary.session_rating;
  const ratingTone = rating >= 4 ? "purple" : rating >= 3 ? "purple" : "red";
  insights.push({
    key: "session-experience",
    tone: ratingTone,
    icon: "star",
    title: rating >= 4 ? "Session Experience" : rating >= 3 ? "Session Experience" : "Low Session Ratings",
    text:
      rating >= 4
        ? `Learners rate sessions ${round1(rating)}/5 on average — a strong experience.`
        : rating > 0
          ? `Learners have given ${rating >= 3 ? "moderate" : "low"} ratings (${round1(rating)}/5). There is scope to improve the overall experience.`
          : "No session ratings have been recorded yet.",
    series: [],
  });

  return insights;
}

// Issues for the "What Needs Attention" list, most severe first.
export function buildAttention(summary, trend, polls) {
  if (!summary) return [];
  const items = [];
  const measurable = measurableWebinars(trend);

  const low = measurable.filter((t) => t.attendance < LOW_ATTENDANCE_PCT).sort((a, b) => a.attendance - b.attendance);
  if (low.length) {
    items.push({
      key: "low-attendance",
      tone: "red",
      title: "Lower Attendance",
      text: `${low.map((t) => `${t.meeting.trim()} (${pct(t.attendance)})`).join(", ")} ${low.length > 1 ? "have" : "has"} attendance below ${LOW_ATTENDANCE_PCT}%. Review registration-to-attendance conversion and session timing.`,
    });
  }

  const unmeasured = (trend || []).filter((t) => !(t.registered > 0));
  if (unmeasured.length) {
    items.push({
      key: "no-registrations",
      tone: "amber",
      title: "Missing Registration Data",
      text: `${unmeasured.map((t) => t.meeting.trim()).join(", ")} ${unmeasured.length > 1 ? "have" : "has"} no registered learners on record, so attendance can't be measured.`,
    });
  }

  const over = (polls || []).filter((p) => p.response_rate > 100);
  if (over.length) {
    items.push({
      key: "poll-over-100",
      tone: "amber",
      title: "Poll Response Rate Above 100%",
      text: `${over.map((p) => `${p.meeting.trim()} (${pct(p.response_rate)})`).join(", ")} — responses exceed attendance. Check the poll import for this webinar.`,
    });
  }

  if (summary.session_rating > 0 && summary.session_rating < 3.5) {
    items.push({
      key: "low-rating",
      tone: "amber",
      title: "Moderate Session Ratings",
      text: `Session ratings average ${round1(summary.session_rating)}/5, indicating scope for improvement. Consider gathering more feedback to understand learner expectations.`,
    });
  }

  if (summary.webinar_health_status && summary.webinar_health_status !== "Excellent" && summary.webinar_health_status !== "Good") {
    items.push({
      key: "health",
      tone: "red",
      title: `Overall Health: ${summary.webinar_health_status}`,
      text: `The webinar health score is ${round1(summary.webinar_health_score)} / 100 across the selected webinars.`,
    });
  }

  if (!items.length) {
    items.push({
      key: "all-good",
      tone: "green",
      title: "Everything Looks Good",
      text: "Registration, poll engagement and overall participation are healthy across the selected webinars.",
    });
  }
  return items;
}

export function buildTakeaways(summary, trend) {
  if (!summary) return [];
  const measurable = measurableWebinars(trend);
  const lowCount = measurable.filter((t) => t.attendance < LOW_ATTENDANCE_PCT).length;
  const rate = summary.attendance_rate;
  const pollRate = summary.poll_response_rate;
  const rating = summary.session_rating;

  return [
    {
      key: "attendance",
      tone: rate >= HEALTHY_ATTENDANCE_PCT ? "blue" : rate >= LOW_ATTENDANCE_PCT ? "blue" : "red",
      icon: "trend",
      title: rate >= HEALTHY_ATTENDANCE_PCT ? "Attendance is strong" : rate >= LOW_ATTENDANCE_PCT ? "Attendance is moderate" : "Attendance is low",
      text: `Average attendance is ${pct(rate)} across ${summary.total_webinars} webinar${summary.total_webinars === 1 ? "" : "s"}.`,
    },
    {
      key: "polls",
      tone: pollRate >= HIGH_POLL_RESPONSE_PCT ? "green" : "amber",
      icon: "bars",
      title: pollRate >= HIGH_POLL_RESPONSE_PCT ? "Poll engagement is high" : "Poll engagement is low",
      text: `Poll response rate is ${pct(pollRate)}${pollRate >= HIGH_POLL_RESPONSE_PCT ? ", indicating good interaction." : ", so learners are not responding to polls often."}`,
    },
    {
      key: "attention",
      tone: lowCount ? "orange" : "green",
      icon: lowCount ? "alert" : "check",
      title: lowCount ? `${lowCount} webinar${lowCount === 1 ? "" : "s"} need${lowCount === 1 ? "s" : ""} attention` : "No webinar needs attention",
      text: lowCount
        ? `${lowCount} webinar${lowCount === 1 ? "" : "s"} ${lowCount === 1 ? "has" : "have"} attendance below ${LOW_ATTENDANCE_PCT}% and may require targeted action.`
        : `No webinar with registrations is below ${LOW_ATTENDANCE_PCT}% attendance.`,
    },
    {
      key: "ratings",
      tone: rating >= 4 ? "purple" : "purple",
      icon: "star",
      title: rating >= 4 ? "Ratings are strong" : "Ratings can be improved",
      text: rating > 0 ? `Average session rating is ${round1(rating)}/5${rating >= 4 ? "." : ", an opportunity to enhance the overall experience."}` : "No session ratings have been recorded yet.",
    },
  ];
}

export function chartInsight(summary, trend) {
  const { best, worst, measurable } = extremes(trend);
  if (!measurable.length) return "No webinar with registrations in the selected scope yet.";
  const avgText = summary ? `Average attendance is ${pct(summary.attendance_rate)}. ` : "";
  if (!worst) return `${avgText}${best.meeting.trim()} is the only webinar with registrations (${pct(best.attendance)}).`;
  return `${avgText}${best.meeting.trim()} leads at ${pct(best.attendance)}, while ${worst.meeting.trim()} trails at ${pct(worst.attendance)}.`;
}

export function pollInsight(polls) {
  const withResponses = (polls || []).filter((p) => (p.responses || 0) > 0).sort((a, b) => b.responses - a.responses);
  if (!withResponses.length) return "No poll responses recorded in the selected scope yet.";
  const top = withResponses[0];
  return `${top.meeting.trim()} has the most poll responses (${top.responses}) across ${top.polls} poll${top.polls === 1 ? "" : "s"}.`;
}
