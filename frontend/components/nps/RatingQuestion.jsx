export default function RatingQuestion({ label, name, value, handleChange, number }) {
  const selected = Number(value) || 0;

  const select = (rating) => {
    handleChange({ target: { name, value: rating } });
  };

  return (
    <div className="ratingQuestion">
      <div className="questionHead">
        {number && <span className="badge">{String(number).padStart(2, "0")}</span>}
        <label className="ratingLabel">{label}</label>
      </div>

      <div className="stars">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => select(rating)}
            aria-label={`${rating} star${rating > 1 ? "s" : ""}`}
            className={`star ${rating <= selected ? "filled" : ""}`}
          >
            ★
          </button>
        ))}

        <span className="ratingValue">
          {selected ? `${selected}/5` : "Not rated"}
        </span>
      </div>

      <style jsx>{`
        .ratingQuestion {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .questionHead {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          border-radius: 8px;
          background: rgba(250, 204, 21, 0.1);
          border: 1px solid rgba(250, 204, 21, 0.35);
          color: #facc15;
          font-size: 12px;
          font-weight: 800;
          flex-shrink: 0;
        }

        .ratingLabel {
          font-size: 16px;
          font-weight: 700;
          color: #f1f5f9;
        }

        .stars {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .star {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 32px;
          line-height: 1;
          color: #334155;
          padding: 2px;
          transition: transform 0.15s ease, color 0.15s ease, filter 0.15s ease;
        }

        .star:hover {
          transform: scale(1.2) rotate(-4deg);
          color: #facc15;
        }

        .star.filled {
          color: #facc15;
          filter: drop-shadow(0 0 8px rgba(250, 204, 21, 0.55));
        }

        .ratingValue {
          margin-left: 10px;
          font-size: 13px;
          color: #64748b;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}
