const DOTS = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left: Math.round((i * 53.7) % 100),
  top: Math.round((i * 31.3) % 100),
  size: 2 + (i % 4),
  duration: 6 + (i % 5) * 1.6,
  delay: (i % 6) * 0.7,
}));

export default function Particles() {
  return (
    <div className="particles">
      {DOTS.map((dot) => (
        <span
          key={dot.id}
          className="dot"
          style={{
            left: `${dot.left}%`,
            top: `${dot.top}%`,
            width: dot.size,
            height: dot.size,
            animationDuration: `${dot.duration}s`,
            animationDelay: `${dot.delay}s`,
          }}
        />
      ))}

      <style jsx>{`
        .particles {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
        }

        .dot {
          position: absolute;
          border-radius: 50%;
          background: #facc15;
          box-shadow: 0 0 8px 2px rgba(250, 204, 21, 0.6);
          opacity: 0.55;
          animation-name: float;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0);
            opacity: 0.35;
          }
          50% {
            transform: translateY(-18px);
            opacity: 0.9;
          }
        }
      `}</style>
    </div>
  );
}
