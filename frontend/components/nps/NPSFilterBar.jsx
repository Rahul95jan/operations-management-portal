const FIELDS = [
  { key: "course_name", label: "Course" },
  { key: "batch_name", label: "Batch" },
  { key: "mentor_name", label: "Mentor" },
];

export default function NPSFilterBar({ filters, options, onChange, onClear }) {
  const hasActiveFilter = Object.values(filters).some(Boolean);

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "12px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        padding: "16px 20px",
        marginBottom: "24px",
        display: "flex",
        alignItems: "flex-end",
        gap: "16px",
        flexWrap: "wrap",
      }}
    >
      {FIELDS.map((field) => (
        <div key={field.key} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "12px", fontWeight: 600, color: "#64748b" }}>
            {field.label}
          </label>

          <select
            value={filters[field.key]}
            onChange={(e) => onChange(field.key, e.target.value)}
            style={{
              border: "1.5px solid #e2e8f0",
              borderRadius: "8px",
              padding: "9px 12px",
              fontSize: "14px",
              minWidth: "180px",
              background: "#fff",
              color: "#0f172a",
            }}
          >
            <option value="">All {field.label}s</option>
            {options[field.key].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
      ))}

      {hasActiveFilter && (
        <button
          onClick={onClear}
          style={{
            background: "#f1f5f9",
            color: "#334155",
            border: "1.5px solid #e2e8f0",
            borderRadius: "8px",
            padding: "10px 16px",
            fontWeight: 600,
            fontSize: "13px",
            cursor: "pointer",
          }}
        >
          ✕ Clear Filters
        </button>
      )}
    </div>
  );
}
