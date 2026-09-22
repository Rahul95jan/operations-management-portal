# Data & Analytics Preferences

- Never fabricate data: every number, KPI and chart must be computed from real backend data, and any metric with no real source must render as "N/A" / "Not Available" / "Data unavailable" rather than an invented value. Confidence: 0.95
- Wants approximations surfaced honestly (e.g., a note that NPS was matched by batch + mentor because no direct per-session link exists) instead of being presented as exact. Confidence: 0.75
- Real statistics must be labeled for what they are (e.g., actual Pearson correlation reported as correlation/"impact", never as "importance"), with no causation claims and cautious wording ("investigate", "review"). Confidence: 0.75
- Validation checks whose underlying data quality is optional (e.g., whether Session records exist / all have duration for a manually invoiced month) must be advisory — shown as a warning but not gating the primary action button; only genuinely required fields may hard-block. Confidence: 0.75
- Wants parsers to accept real-world messy exports (multi-section Zoom CSVs with ragged rows, reconnect duplicates, embedded quotes/commas) without silently dropping records. Confidence: 0.7
- Verifies aggregations explicitly (asks for averages/percentages to be recomputed and confirmed correct, e.g. per-question averages then the average of those). Confidence: 0.65
- Expects empty/loading/error states for every widget, since real data may be missing. Confidence: 0.7
