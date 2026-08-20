const selectFields = [
  { name: "batch_name", label: "Batch Name", icon: "🎓", key: "batch" },
  { name: "course_name", label: "Course Name", icon: "📚", key: "course" },
  { name: "mentor_name", label: "Mentor Name", icon: "🧑‍🏫", key: "mentor" },
];

export default function CourseBatchMentor({
  formData,
  handleChange,
  handleBatchChange,
  batchNames,
  courseNames,
  mentorNames,
  loading,
}) {
  const optionsFor = (key) => {
    if (key === "batch") return batchNames;
    if (key === "course") return courseNames;
    return mentorNames;
  };

  return (
    <div className="grid">
      {selectFields.map((field) => {
        const options = optionsFor(field.key);

        return (
          <div key={field.name} className="field">
            <label className="label">{field.label}</label>

            <div className="selectWrap">
              <span className="icon">{field.icon}</span>
              <select
                name={field.name}
                value={formData[field.name]}
                onChange={field.key === "batch" ? handleBatchChange : handleChange}
                className="select"
                required
                disabled={loading}
              >
                <option value="" disabled>
                  {loading ? "Loading..." : `Select ${field.label}`}
                </option>

                {options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );
      })}

      {!loading && batchNames.length === 0 && (
        <p className="hint">
          No batches found yet — ask your program admin to add batches before sharing this form.
        </p>
      )}

      <style jsx>{`
        .grid {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .label {
          font-size: 12px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .selectWrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .icon {
          position: absolute;
          left: 14px;
          font-size: 14px;
          opacity: 0.8;
          pointer-events: none;
        }

        .select {
          width: 100%;
          box-sizing: border-box;
          appearance: none;
          border: 1.5px solid #334155;
          background: #1a2032
            url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none'><path d='M5.5 7.5l4.5 4.5 4.5-4.5' stroke='%2394a3b8' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>")
            no-repeat right 14px center;
          color: #f1f5f9;
          border-radius: 10px;
          padding: 13px 14px 13px 38px;
          font-size: 14px;
          font-family: inherit;
          outline: none;
          cursor: pointer;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .select:focus {
          border-color: #facc15;
          box-shadow: 0 0 0 3px rgba(250, 204, 21, 0.2);
        }

        .select:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .select option {
          background: #1a2032;
          color: #f1f5f9;
        }

        .hint {
          margin: 0;
          font-size: 12px;
          color: #fbbf24;
          background: rgba(250, 204, 21, 0.08);
          border: 1px solid rgba(250, 204, 21, 0.25);
          padding: 10px 12px;
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
}
