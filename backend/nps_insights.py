import re
from collections import Counter

STOPWORDS = {
    "the", "a", "an", "and", "or", "but", "is", "was", "were", "are", "to", "of", "in",
    "on", "for", "with", "this", "that", "it", "its", "i", "my", "me", "we", "our", "us",
    "you", "your", "very", "so", "as", "at", "be", "been", "have", "has", "had", "not",
    "no", "did", "do", "does", "from", "by", "all", "some", "more", "most", "than",
    "session", "sessions", "course", "courses", "really", "just", "also", "there",
    "here", "would", "could", "should", "will", "can", "get", "got", "which", "what",
    "how", "when", "krish", "naik", "academy",
}

PRAISE_WORDS = {
    "great", "good", "excellent", "amazing", "awesome", "nice", "helpful", "informative",
    "best", "love", "loved", "clear", "well", "perfect", "fantastic", "wonderful",
}


def _segment(score):
    if score >= 9:
        return "promoter"
    if score >= 7:
        return "passive"
    return "detractor"


def _keywords(texts, exclude_praise=False, top_n=8):
    counter = Counter()

    for text in texts:
        if not text:
            continue

        words = re.findall(r"[a-zA-Z']+", text.lower())

        for word in words:
            if len(word) < 4 or word in STOPWORDS:
                continue
            if exclude_praise and word in PRAISE_WORDS:
                continue
            counter[word] += 1

    return [{"word": w, "count": c} for w, c in counter.most_common(top_n)]


def _breakdown_by(records, attr, min_responses=1):
    groups = {}

    for r in records:
        key = getattr(r, attr) or "Unknown"
        groups.setdefault(key, []).append(r)

    result = []

    for name, items in groups.items():
        if len(items) < min_responses:
            continue

        total = len(items)
        promoters = sum(1 for i in items if i.nps_score >= 9)
        detractors = sum(1 for i in items if i.nps_score <= 6)
        nps_score = round(((promoters - detractors) / total) * 100) if total else 0

        avg_rating = round(
            sum(
                ((i.instructor_rating or 0) + (i.doubt_rating or 0) + (i.website_rating or 0)) / 3
                for i in items
            )
            / total,
            2,
        )

        result.append({
            "name": name,
            "responses": total,
            "nps_score": nps_score,
            "avg_rating": avg_rating,
        })

    return sorted(result, key=lambda x: x["nps_score"])


def _recommendations(overall, by_mentor, by_course, by_batch, concern_keywords, rating_breakdown):
    recs = []

    if overall["total"] == 0:
        return [{
            "type": "opportunity",
            "title": "Start collecting feedback",
            "text": "No responses collected yet — prompt learners for feedback after each session to start building signal.",
        }]

    if overall["nps_score"] < 0:
        recs.append({
            "type": "risk",
            "title": "Negative overall NPS",
            "text": f"Detractors ({overall['detractors']}) outweigh promoters ({overall['promoters']}) — "
                    "prioritize a recovery outreach to recent detractors before acquiring new learners.",
        })
    elif overall["detractor_rate"] >= 20:
        recs.append({
            "type": "risk",
            "title": "High detractor rate",
            "text": f"{overall['detractor_rate']}% of respondents are detractors. A structured win-back "
                    "campaign (personal call, makeup session, or discount on the next course) could convert "
                    "some before they churn or leave public reviews.",
        })

    weakest_rating = min(rating_breakdown, key=lambda r: r["value"])
    if weakest_rating["value"] < 4:
        recs.append({
            "type": "opportunity",
            "title": f"{weakest_rating['label']} is the weak link",
            "text": f"Rated {weakest_rating['value']}/5 on average — this is the highest-leverage place "
                    "to invest next, since even a small improvement here likely moves the most learners.",
        })

    if by_mentor:
        worst_mentor = by_mentor[0]
        if worst_mentor["responses"] >= 2 and worst_mentor["nps_score"] < 0:
            recs.append({
                "type": "risk",
                "title": f"Mentor coaching opportunity: {worst_mentor['name']}",
                "text": f"NPS of {worst_mentor['nps_score']} across {worst_mentor['responses']} responses — "
                        "worth a 1:1 coaching or shadow session to understand what's not landing with learners.",
            })

    if by_course:
        worst_course = by_course[0]
        if worst_course["responses"] >= 2 and worst_course["nps_score"] < 0:
            recs.append({
                "type": "risk",
                "title": f"Course underperforming: {worst_course['name']}",
                "text": f"NPS of {worst_course['nps_score']}. Consider a curriculum review or a short "
                        "learner survey specific to this course.",
            })

    if by_batch:
        worst_batch = by_batch[0]
        if worst_batch["responses"] >= 2 and worst_batch["nps_score"] < 0:
            recs.append({
                "type": "risk",
                "title": f"Batch showing friction: {worst_batch['name']}",
                "text": f"NPS of {worst_batch['nps_score']} — check pacing, cohort size, or scheduling "
                        "issues specific to this batch.",
            })

    if concern_keywords:
        top = concern_keywords[0]
        recs.append({
            "type": "opportunity",
            "title": f"Recurring theme: “{top['word']}”",
            "text": f"Mentioned {top['count']}x in constructive feedback — a good candidate for the "
                    "next ops review agenda.",
        })

    if overall["total"] < 10:
        recs.append({
            "type": "opportunity",
            "title": "Response volume is low",
            "text": "Consider auto-triggering the NPS form right after a session or batch milestone "
                    "to raise response rates and get more reliable signal.",
        })

    if not any(r["type"] == "risk" for r in recs):
        recs.append({
            "type": "strength",
            "title": "No major red flags",
            "text": "Metrics look healthy across the board — maintain the current mentor and content quality bar.",
        })

    return recs


def _score_distribution(records):
    counts = {score: 0 for score in range(11)}

    for r in records:
        if r.nps_score in counts:
            counts[r.nps_score] += 1

    return [{"score": score, "count": counts[score]} for score in range(11)]


def _responses_per_day(records):
    buckets = {}

    for r in records:
        if not r.created_at:
            continue

        day = r.created_at.strftime("%Y-%m-%d")
        buckets.setdefault(day, {"date": day, "count": 0, "score_sum": 0})
        buckets[day]["count"] += 1
        buckets[day]["score_sum"] += r.nps_score

    responses_per_day = []
    nps_trend_per_day = []

    for day in sorted(buckets):
        bucket = buckets[day]
        responses_per_day.append({"date": day, "count": bucket["count"]})
        nps_trend_per_day.append({
            "date": day,
            "avg_nps": round(bucket["score_sum"] / bucket["count"], 2),
        })

    return responses_per_day, nps_trend_per_day


def _automated_insights_table(overall, rating_breakdown, score_distribution):
    if overall["total"] == 0:
        return [{"label": "Status", "value": "No responses yet"}]

    strongest = max(rating_breakdown, key=lambda r: r["value"])
    weakest = min(rating_breakdown, key=lambda r: r["value"])
    most_common = max(score_distribution, key=lambda s: s["count"])

    return [
        {"label": "Top Strength", "value": f"{strongest['label']} (avg {strongest['value']:.2f})"},
        {"label": "Area of Improvement", "value": f"{weakest['label']} (avg {weakest['value']:.2f})"},
        {"label": "Most Common Score", "value": f"{most_common['score']} ({most_common['count']} responses)"},
        {"label": "Highest Rated Metric", "value": strongest["label"]},
        {"label": "Lowest Rated Metric", "value": weakest["label"]},
        {"label": "Total Positive Responses (Promoters)", "value": str(overall["promoters"])},
        {"label": "Total Negative Responses (Detractors)", "value": str(overall["detractors"])},
    ]


def compute_nps_insights(records):
    total = len(records)

    promoters = sum(1 for r in records if r.nps_score >= 9)
    passives = sum(1 for r in records if 7 <= r.nps_score <= 8)
    detractors = sum(1 for r in records if r.nps_score <= 6)

    nps_score = round(((promoters - detractors) / total) * 100) if total else 0
    detractor_rate = round((detractors / total) * 100) if total else 0
    avg_nps_score = round(sum(r.nps_score for r in records) / total, 2) if total else 0

    avg_instructor = round(sum(r.instructor_rating or 0 for r in records) / total, 2) if total else 0
    avg_doubt = round(sum(r.doubt_rating or 0 for r in records) / total, 2) if total else 0
    avg_website = round(sum(r.website_rating or 0 for r in records) / total, 2) if total else 0

    overall = {
        "total": total,
        "promoters": promoters,
        "passives": passives,
        "detractors": detractors,
        "nps_score": nps_score,
        "avg_nps_score": avg_nps_score,
        "detractor_rate": detractor_rate,
        "avg_instructor": avg_instructor,
        "avg_doubt": avg_doubt,
        "avg_website": avg_website,
    }

    rating_breakdown = [
        {"label": "Instructor", "value": avg_instructor},
        {"label": "Doubt Resolution", "value": avg_doubt},
        {"label": "Website / LMS", "value": avg_website},
    ]

    by_mentor = _breakdown_by(records, "mentor_name")
    by_course = _breakdown_by(records, "course_name")
    by_batch = _breakdown_by(records, "batch_name")

    concern_texts = [r.feedback for r in records if r.nps_score <= 8]
    praise_texts = [r.feedback for r in records if r.nps_score >= 9]

    concern_keywords = _keywords(concern_texts, exclude_praise=True)
    praise_keywords = _keywords(praise_texts)

    score_distribution = _score_distribution(records)
    responses_per_day, nps_trend_per_day = _responses_per_day(records)
    automated_insights_table = _automated_insights_table(overall, rating_breakdown, score_distribution)

    recommendations = _recommendations(
        overall, by_mentor, by_course, by_batch, concern_keywords, rating_breakdown
    )

    return {
        "overall": overall,
        "rating_breakdown": rating_breakdown,
        "by_mentor": by_mentor,
        "by_course": by_course,
        "by_batch": by_batch,
        "concern_keywords": concern_keywords,
        "praise_keywords": praise_keywords,
        "score_distribution": score_distribution,
        "responses_per_day": responses_per_day,
        "nps_trend_per_day": nps_trend_per_day,
        "automated_insights_table": automated_insights_table,
        "recommendations": recommendations,
    }
