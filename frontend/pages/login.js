import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

function RecoveryModal({ mode, onClose }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const isPassword = mode === "password";
  const title = isPassword ? "Forgot Password?" : "Forgot Username?";
  const icon = isPassword ? "🔒" : "👤";

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    setSent(true);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} title="Close">
          ✕
        </button>

        <div className="modal-icon">{icon}</div>
        <h3 className="modal-title">{title}</h3>

        {!sent ? (
          <>
            <p className="modal-body">
              Enter the email associated with your account and we'll send you instructions.
            </p>

            <form onSubmit={handleSubmit}>
              <input
                type="email"
                required
                placeholder="you@krishnaikacademy.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="modal-input"
              />

              <button type="submit" className="modal-submit">
                Send Instructions
              </button>
            </form>
          </>
        ) : (
          <div className="modal-success">
            <p className="modal-body">
              <b>This is a demo environment.</b> In production this would email {isPassword ? "reset instructions" : "your username"} to{" "}
              <b>{email}</b>.
            </p>
            <p className="modal-body modal-body-muted">
              Operations Portal currently uses a single shared login — contact your administrator for access.
            </p>
            <button className="modal-submit modal-submit-ghost" onClick={onClose}>
              Got it
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(3px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
          animation: overlayIn 0.15s ease;
        }

        .modal-card {
          position: relative;
          background: #fff;
          border-radius: 18px;
          width: 100%;
          max-width: 400px;
          padding: 32px 28px 28px;
          box-shadow: 0 30px 60px -20px rgba(0, 0, 0, 0.5);
          animation: cardIn 0.2s ease;
        }

        .modal-close {
          position: absolute;
          top: 14px;
          right: 14px;
          background: #f1f5f9;
          color: #64748b;
          border: none;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 13px;
        }

        .modal-close:hover {
          background: #e2e8f0;
        }

        .modal-icon {
          font-size: 32px;
          text-align: center;
          margin-bottom: 8px;
        }

        .modal-title {
          text-align: center;
          margin: 0 0 12px;
          color: #0f172a;
          font-size: 19px;
        }

        .modal-body {
          color: #64748b;
          font-size: 13.5px;
          line-height: 1.6;
          text-align: center;
          margin: 0 0 18px;
        }

        .modal-body-muted {
          font-size: 12.5px;
          color: #94a3b8;
        }

        .modal-input {
          width: 100%;
          box-sizing: border-box;
          padding: 12px 14px;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          font-size: 14px;
          margin-bottom: 14px;
          outline: none;
        }

        .modal-input:focus {
          border-color: #f59e0b;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15);
        }

        .modal-submit {
          width: 100%;
          padding: 12px;
          border: none;
          border-radius: 10px;
          background: linear-gradient(120deg, #0f172a, #1e293b);
          color: #facc15;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.15s ease;
        }

        .modal-submit:hover {
          transform: translateY(-1px);
        }

        .modal-submit-ghost {
          background: #f1f5f9;
          color: #334155;
        }

        @keyframes overlayIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes cardIn {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}

export default function Login() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(null); // "password" | "username" | null

  useEffect(() => {
    const savedUsername = localStorage.getItem("rememberedUsername");
    if (savedUsername) {
      setUsername(savedUsername);
      setRemember(true);
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    setError("");
    setLoggingIn(true);

    setTimeout(() => {
      if (username === "admin" && password === "admin123") {
        if (remember) {
          localStorage.setItem("rememberedUsername", username);
        } else {
          localStorage.removeItem("rememberedUsername");
        }
        localStorage.setItem("loggedIn", "true");
        router.push("/");
      } else {
        setError("Invalid username or password. Please try again.");
        setLoggingIn(false);
      }
    }, 400);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Left — brand panel */}
        <div className="brand-panel">
          <div className="brand-blob brand-blob-1" />
          <div className="brand-blob brand-blob-2" />
          <div className="brand-grid" />

          <div className="brand-logo-wrap">
            <Image
              src="/logo.png"
              alt="Krish Naik Academy"
              width={320}
              height={116}
              priority
              style={{ width: "100%", height: "auto", borderRadius: "10px" }}
            />
          </div>

          <div className="brand-middle">
            <h1 className="brand-headline">
              Operations,
              <br />
              Orchestrated.
            </h1>
            <p className="brand-tagline">
              One portal for sessions, mentors, batches, learner feedback, and resource
              compliance — kept in sync, all in one place.
            </p>
          </div>
        </div>

        {/* Right — form panel */}
        <div className="form-panel">
          <div className="form-accent">
            <svg width="70" height="40" viewBox="0 0 70 40" fill="none">
              <path d="M2 34C20 34 26 6 66 4" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 4" strokeLinecap="round" />
            </svg>
            <span className="form-accent-icon">📈</span>
          </div>

          <h2 className="welcome-title">
            Welcome to <span>Krish Naik Academy</span> Operation Portal
          </h2>

          <form onSubmit={handleLogin}>
            <div className="field-block">
              <label className="field-label">Username</label>
              <div className="field-wrap">
                <span className="field-icon">👤</span>
                <input
                  type="text"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="login-input"
                  autoFocus
                />
              </div>
            </div>

            <div className="field-block">
              <label className="field-label">Password</label>
              <div className="field-wrap">
                <span className="field-icon">🔒</span>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="login-input"
                />
              </div>
            </div>

            {error && <div className="error-banner">⚠ {error}</div>}

            <div className="login-row">
              <label className="remember-label">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                Remember me
              </label>

              <button type="button" className="link-btn" onClick={() => setRecoveryMode("password")}>
                Forgot your password?
              </button>
            </div>

            <button type="submit" className="login-btn" disabled={loggingIn}>
              {loggingIn ? "Signing in..." : "LOGIN"}
            </button>
          </form>

          <div className="login-footer-links">
            <button type="button" className="link-btn" onClick={() => setRecoveryMode("username")}>
              Forgot username?
            </button>
          </div>

          <div className="access-note">
            <b>Need access? Contact your administrator</b>
          </div>

          <p className="login-footer">Powered by Krish Naik Academy</p>
        </div>
      </div>

      {recoveryMode && <RecoveryModal mode={recoveryMode} onClose={() => setRecoveryMode(null)} />}

      <style jsx>{`
        .login-page {
          position: relative;
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          overflow: hidden;
          padding: 24px;
          box-sizing: border-box;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
          background-size: 200% 200%;
          animation: heroShift 14s ease infinite;
        }

        .login-card {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 900px;
          min-height: 560px;
          background: #ffffff;
          border-radius: 24px;
          box-shadow: 0 40px 80px -20px rgba(0, 0, 0, 0.5);
          display: grid;
          grid-template-columns: 42% 58%;
          overflow: hidden;
          animation: cardIn 0.35s ease;
        }

        .brand-panel {
          position: relative;
          overflow: hidden;
          background: linear-gradient(160deg, #0f172a 0%, #1e293b 70%, #0f172a 100%);
          padding: 36px 32px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 40px;
        }

        .brand-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(70px);
          opacity: 0.4;
          animation: float 10s ease-in-out infinite;
        }

        .brand-blob-1 {
          width: 220px;
          height: 220px;
          background: #f59e0b;
          top: -60px;
          right: -60px;
        }

        .brand-blob-2 {
          width: 180px;
          height: 180px;
          background: #3b82f6;
          bottom: -50px;
          left: -50px;
          animation-delay: 2.5s;
        }

        .brand-grid {
          position: absolute;
          inset: 0;
          background-image: linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
          background-size: 30px 30px;
          mask-image: radial-gradient(ellipse at center, black, transparent 75%);
        }

        .brand-logo-wrap {
          position: relative;
          z-index: 1;
          width: 100%;
        }

        .brand-middle {
          position: relative;
          z-index: 1;
        }

        .brand-headline {
          color: #e5e7eb;
          font-size: 30px;
          font-weight: 800;
          line-height: 1.25;
          margin: 0 0 14px;
        }

        .brand-tagline {
          color: #e5e7eb;
          font-weight: 700;
          font-size: 13.5px;
          line-height: 1.6;
          max-width: 280px;
          margin: 0;
        }

        .form-panel {
          position: relative;
          padding: 44px 48px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .form-accent {
          position: absolute;
          top: 4px;
          right: 34px;
          display: flex;
          align-items: flex-end;
          gap: 4px;
          opacity: 0.9;
        }

        .form-accent-icon {
          font-size: 16px;
          transform: translateY(4px);
        }

        .welcome-title {
          font-size: 27px;
          line-height: 1.35;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 28px;
        }

        .welcome-title span {
          font-weight: 900;
          background: linear-gradient(90deg, #f59e0b, #fbbf24);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .field-block {
          margin-bottom: 16px;
        }

        .field-label {
          display: block;
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          color: #94a3b8;
          margin-bottom: 6px;
        }

        .field-wrap {
          position: relative;
        }

        .field-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 14px;
          opacity: 0.5;
        }

        .login-input {
          width: 100%;
          box-sizing: border-box;
          padding: 13px 14px 13px 40px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          border-radius: 10px;
          font-size: 14px;
          outline: none;
          transition: all 0.15s ease;
        }

        .login-input:focus {
          border-color: #f59e0b;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15);
        }

        .error-banner {
          background: #fee2e2;
          color: #b91c1c;
          font-size: 12.5px;
          font-weight: 600;
          padding: 10px 12px;
          border-radius: 8px;
          margin-bottom: 14px;
          animation: shake 0.3s ease;
        }

        .login-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 22px;
          font-size: 12.5px;
        }

        .remember-label {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #64748b;
          cursor: pointer;
        }

        .link-btn {
          background: none;
          border: none;
          color: #d97706;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
        }

        .link-btn:hover {
          text-decoration: underline;
        }

        .login-btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(120deg, #f59e0b, #fbbf24);
          color: #0f172a;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 800;
          letter-spacing: 0.04em;
          cursor: pointer;
          box-shadow: 0 8px 20px -6px rgba(245, 158, 11, 0.6);
          transition: transform 0.15s ease;
        }

        .login-btn:hover:not(:disabled) {
          transform: translateY(-1px);
        }

        .login-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .login-footer-links {
          text-align: center;
          margin-top: 16px;
        }

        .access-note {
          text-align: center;
          margin-top: 18px;
          padding-top: 16px;
          border-top: 1px solid #f1f5f9;
          color: #94a3b8;
          font-size: 12.5px;
        }

        .access-note b {
          color: #334155;
        }

        .login-footer {
          text-align: center;
          margin-top: 16px;
          color: #64748b;
          font-size: 12px;
          font-weight: 800;
        }

        @media (max-width: 820px) {
          .login-card {
            grid-template-columns: 1fr;
            max-width: 440px;
          }

          .brand-panel {
            display: none;
          }

          .form-panel {
            padding: 40px 32px;
          }
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
            transform: translateY(0px) translateX(0px);
          }
          50% {
            transform: translateY(24px) translateX(12px);
          }
        }

        @keyframes cardIn {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-4px);
          }
          75% {
            transform: translateX(4px);
          }
        }
      `}</style>
    </div>
  );
}
