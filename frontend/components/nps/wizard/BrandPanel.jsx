import Image from "next/image";
import Particles from "./Particles";

const TRUST_ITEMS = [
  "Confidential — used only to improve the course",
  "Takes less than 2 minutes",
  "Your feedback genuinely matters",
];

export default function BrandPanel({ courseName }) {
  return (
    <aside className="panel">
      <Particles />

      <div className="glow" />

      <div className="top">
        <Image src="/logo.png" alt="Krish Naik Academy" width={130} height={48} priority />
      </div>

      <div className="middle">
        <h1 className="headline">
          Your Voice Shapes <span className="accent">the Future</span>
        </h1>

        <p className="sub">
          Help us create an even better learning experience for every cohort that follows.
        </p>

        {courseName && (
          <div className="courseBadge">
            <span className="eyebrow">Course</span>
            <span className="courseName">{courseName}</span>
          </div>
        )}

        <ul className="trustList">
          {TRUST_ITEMS.map((item) => (
            <li key={item}>
              <span className="check">✓</span> {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="bottom">
        © {new Date().getFullYear()} Krish Naik Academy. All rights reserved.
      </div>

      <style jsx>{`
        .panel {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 32px;
          padding: 40px 36px;
          overflow: hidden;
          border-radius: 20px;
        }

        .glow {
          position: absolute;
          width: 420px;
          height: 420px;
          background: radial-gradient(circle, rgba(250, 204, 21, 0.16), transparent 70%);
          top: -140px;
          left: -140px;
          pointer-events: none;
        }

        .top {
          position: relative;
          z-index: 1;
        }

        .middle {
          position: relative;
          z-index: 1;
          max-width: 380px;
        }

        .headline {
          font-family: var(--font-heading);
          font-size: 34px;
          line-height: 1.15;
          font-weight: 800;
          color: #f8fafc;
          margin: 0 0 14px;
        }

        .accent {
          color: #facc15;
        }

        .sub {
          color: #94a3b8;
          font-size: 14px;
          line-height: 1.6;
          margin: 0 0 22px;
        }

        .courseBadge {
          display: inline-flex;
          flex-direction: column;
          gap: 4px;
          border: 1px solid rgba(250, 204, 21, 0.35);
          background: rgba(250, 204, 21, 0.06);
          border-radius: 12px;
          padding: 12px 16px;
          margin-bottom: 26px;
        }

        .eyebrow {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #facc15;
        }

        .courseName {
          font-size: 14px;
          font-weight: 700;
          color: #f1f5f9;
        }

        .trustList {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .trustList li {
          font-size: 13px;
          color: #cbd5e1;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .check {
          color: #22c55e;
          font-weight: 800;
        }

        .bottom {
          position: relative;
          z-index: 1;
          font-size: 11px;
          color: #64748b;
        }

        @media (max-width: 980px) {
          .panel {
            padding: 28px 24px;
          }

          .headline {
            font-size: 26px;
          }
        }
      `}</style>
    </aside>
  );
}
