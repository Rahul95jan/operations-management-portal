import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/router";

export default function Login() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    if (username === "admin" && password === "admin123") {
      localStorage.setItem("loggedIn", "true");
      router.push("/");
    } else {
      alert("Invalid Credentials");
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background:
          "linear-gradient(135deg, #0f172a, #1e293b)",
      }}
    >
      <div
        style={{
          width: "450px",
          background: "#ffffff",
          padding: "40px",
          borderRadius: "20px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
        }}
      >
        {/* Logo */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "25px",
          }}
        >
          <Image
            src="/logo.png"
            alt="Krish Naik Academy"
            width={250}
            height={90}
            priority
          />

          <h2
            style={{
              marginTop: "15px",
              color: "#0f172a",
              fontWeight: "700",
            }}
          >
            Krish Naik Academy
          </h2>

          <p
            style={{
              color: "#64748b",
              marginTop: "5px",
            }}
          >
            Operations Management Portal
          </p>
        </div>

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "15px",
            border: "1px solid #cbd5e1",
            borderRadius: "8px",
            boxSizing: "border-box",
          }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "20px",
            border: "1px solid #cbd5e1",
            borderRadius: "8px",
            boxSizing: "border-box",
          }}
        />

        <button
          onClick={handleLogin}
          style={{
            width: "100%",
            padding: "12px",
            background: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          Login
        </button>

        <p
          style={{
            textAlign: "center",
            marginTop: "15px",
            color: "#64748b",
            fontSize: "14px",
          }}
        >
          Powered by Krish Naik Academy
        </p>
      </div>
    </div>
  );
}