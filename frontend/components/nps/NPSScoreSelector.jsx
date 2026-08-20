const SCORES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function zoneOf(score) {
  if (score >= 9) return "promoter";
  if (score >= 7) return "passive";
  return "detractor";
}

export default function NPSScoreSelector({ value, handleChange, number, courseLabel = "this course" }) {
  const selected = value === "" ? null : Number(value);

  const select = (score) => {
    handleChange({ target: { name: "nps_score", value: score } });
  };

  return (
    <div className="npsSelector">
      <div className="questionHead">
        {number && <span className="badge">{String(number).padStart(2, "0")}</span>}
        <label className="label">
          How likely are you to recommend {courseLabel} to others?
        </label>
      </div>

      <div className="track" />

      <div className="scale">
        {SCORES.map((score) => (
          <button
            key={score}
            type="button"
            onClick={() => select(score)}
            className={`scoreBtn ${zoneOf(score)} ${
              selected === score ? "active" : ""
            }`}
          >
            {score}
          </button>
        ))}
      </div>

      <div className="scaleLabels">
        <span>Not likely</span>
        <span>Extremely likely</span>
      </div>

      <style jsx>{`
        .npsSelector {
          display: flex;
          flex-direction: column;
          gap: 14px;
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

        .label {
          font-size: 16px;
          font-weight: 700;
          color: #f1f5f9;
        }

        .track {
          height: 5px;
          border-radius: 999px;
          background: linear-gradient(
            90deg,
            #dc2626 0%,
            #dc2626 63.5%,
            #f59e0b 63.5%,
            #f59e0b 81.5%,
            #16a34a 81.5%,
            #16a34a 100%
          );
          opacity: 0.55;
        }

        .scale {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-top: -6px;
        }

        .scoreBtn {
          flex: 1 1 auto;
          min-width: 34px;
          height: 42px;
          border-radius: 10px;
          border: 1.5px solid #334155;
          background: #1a2032;
          color: #cbd5e1;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .scoreBtn:hover {
          border-color: #facc15;
          transform: translateY(-3px);
          box-shadow: 0 6px 14px rgba(0, 0, 0, 0.35);
        }

        .scoreBtn.active.detractor {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          border-color: #dc2626;
          color: #fff;
          box-shadow: 0 6px 16px rgba(220, 38, 38, 0.4);
        }

        .scoreBtn.active.passive {
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          border-color: #f59e0b;
          color: #fff;
          box-shadow: 0 6px 16px rgba(245, 158, 11, 0.4);
        }

        .scoreBtn.active.promoter {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          border-color: #16a34a;
          color: #fff;
          box-shadow: 0 6px 16px rgba(22, 163, 74, 0.4);
        }

        .scaleLabels {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #64748b;
        }
      `}</style>
    </div>
  );
}
