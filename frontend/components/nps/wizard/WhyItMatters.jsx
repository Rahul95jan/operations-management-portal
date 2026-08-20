const ITEMS = [
  {
    icon: "⭐",
    title: "Improve Teaching Quality",
    text: "Sharper sessions shaped by what actually helps you learn.",
  },
  {
    icon: "📈",
    title: "Better Learning Experience",
    text: "From LMS flow to live-class pacing — refined by your input.",
  },
  {
    icon: "✏️",
    title: "Course Enhancements",
    text: "Future cohorts benefit directly from what you tell us today.",
  },
  {
    icon: "🔒",
    title: "100% Confidential",
    text: "Your responses are used only to improve the course.",
  },
];

export default function WhyItMatters() {
  return (
    <aside className="panel">
      <h3 className="title">Why Your Feedback Matters</h3>

      <div className="list">
        {ITEMS.map((item) => (
          <div key={item.title} className="item">
            <div className="iconBox">{item.icon}</div>
            <div>
              <h4 className="itemTitle">{item.title}</h4>
              <p className="itemText">{item.text}</p>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .panel {
          padding: 8px 4px;
        }

        .title {
          font-family: var(--font-heading);
          font-size: 13px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin: 0 0 20px;
        }

        .list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .item {
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }

        .iconBox {
          flex-shrink: 0;
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: rgba(250, 204, 21, 0.1);
          border: 1px solid rgba(250, 204, 21, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
        }

        .itemTitle {
          margin: 0 0 4px;
          font-size: 13px;
          font-weight: 700;
          color: #e2e8f0;
        }

        .itemText {
          margin: 0;
          font-size: 12px;
          line-height: 1.5;
          color: #64748b;
        }
      `}</style>
    </aside>
  );
}
