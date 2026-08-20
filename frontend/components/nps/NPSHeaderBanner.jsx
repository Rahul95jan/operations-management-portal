export default function NPSHeaderBanner({ lastUpdated }) {
  return (
    <div className="banner">
      <div className="title">NPS Analytics Dashboard</div>
      <div className="sub">
        <span className="dot" /> Live — refreshes on every form submission
        {lastUpdated && <span className="updated"> &nbsp;|&nbsp; Last updated: {lastUpdated}</span>}
      </div>

      <style jsx>{`
        .banner {
          background: #0f172a;
          border-radius: 12px;
          padding: 16px 22px;
          margin-bottom: 24px;
        }

        .title {
          color: #facc15;
          font-size: 20px;
          font-weight: 800;
        }

        .sub {
          color: #cbd5e1;
          font-size: 12px;
          margin-top: 6px;
          display: flex;
          align-items: center;
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #22c55e;
          margin-right: 6px;
          box-shadow: 0 0 6px 2px rgba(34, 197, 94, 0.6);
        }

        .updated {
          color: #94a3b8;
        }
      `}</style>
    </div>
  );
}
