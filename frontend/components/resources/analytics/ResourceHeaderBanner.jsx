export default function ResourceHeaderBanner({
  eyebrow = "Resource Portal",
  title = "Resource Analytics Dashboard",
  subtitle = "Live — reflects current submission & reminder data",
  stat = null,
}) {
  return (
    <div className="banner">
      <div className="blob" />
      <div className="content">
        <div className="eyebrow">{eyebrow}</div>
        <div className="title">{title}</div>
        <div className="sub">
          <span className="dot" /> {subtitle}
        </div>
      </div>

      {stat && (
        <div className="stat">
          <div className="stat-value">{stat.value}</div>
          <div className="stat-label">{stat.label}</div>
        </div>
      )}

      <style jsx>{`
        .banner {
          position: relative;
          overflow: hidden;
          background: linear-gradient(120deg, #0f172a 0%, #1e293b 60%, #0f172a 100%);
          background-size: 200% 200%;
          animation: heroShift 12s ease infinite;
          border-radius: 18px;
          padding: 26px 30px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          box-shadow: 0 16px 32px -18px rgba(15, 23, 42, 0.55);
        }

        .blob {
          position: absolute;
          width: 220px;
          height: 220px;
          border-radius: 50%;
          background: #7c3aed;
          filter: blur(60px);
          opacity: 0.28;
          top: -80px;
          right: 160px;
          animation: float 9s ease-in-out infinite;
        }

        .content {
          position: relative;
          z-index: 1;
        }

        .eyebrow {
          display: inline-block;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #fbbf24;
          background: rgba(251, 191, 36, 0.12);
          border: 1px solid rgba(251, 191, 36, 0.3);
          padding: 5px 10px;
          border-radius: 999px;
          margin-bottom: 10px;
        }

        .title {
          color: #f8fafc;
          font-size: 24px;
          font-weight: 800;
        }

        .sub {
          color: #94a3b8;
          font-size: 12px;
          margin-top: 8px;
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

        .stat {
          position: relative;
          z-index: 1;
          text-align: center;
          padding: 14px 26px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          flex-shrink: 0;
        }

        .stat-value {
          font-size: 26px;
          font-weight: 800;
          color: #fbbf24;
        }

        .stat-label {
          font-size: 11px;
          color: #94a3b8;
          margin-top: 2px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        @keyframes heroShift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(16px);
          }
        }
      `}</style>
    </div>
  );
}
