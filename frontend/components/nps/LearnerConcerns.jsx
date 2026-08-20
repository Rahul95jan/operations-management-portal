function Tags({ items, color, bg }) {
  if (items.length === 0) {
    return <p style={{ color: "#94a3b8", margin: 0 }}>Nothing detected yet.</p>;
  }

  return (
    <div className="tags">
      {items.map((item) => (
        <span key={item.word} className="tag">
          {item.word}
          <span className="count">{item.count}</span>
        </span>
      ))}

      <style jsx>{`
        .tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: ${bg};
          color: ${color};
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 600;
          text-transform: capitalize;
        }

        .count {
          background: rgba(255, 255, 255, 0.6);
          color: ${color};
          border-radius: 999px;
          padding: 0 7px;
          font-size: 11px;
        }
      `}</style>
    </div>
  );
}

export default function LearnerConcerns({ concernKeywords, praiseKeywords }) {
  return (
    <div
      style={{
        background: "#fff",
        padding: "20px",
        borderRadius: "12px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        marginBottom: "40px",
      }}
    >
      <h2 style={{ marginBottom: "18px" }}>🔎 What Learners Are Saying</h2>

      <div style={{ marginBottom: "18px" }}>
        <h4 style={{ color: "#991b1b", marginBottom: "10px" }}>
          Recurring concerns (from passives &amp; detractors)
        </h4>
        <Tags items={concernKeywords} color="#991b1b" bg="#fee2e2" />
      </div>

      <div>
        <h4 style={{ color: "#166534", marginBottom: "10px" }}>
          What's working (from promoters)
        </h4>
        <Tags items={praiseKeywords} color="#166534" bg="#dcfce7" />
      </div>
    </div>
  );
}
