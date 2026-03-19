"use client";

import { useState, useEffect } from "react";
import { adminFetch, getToken, setToken, clearToken } from "../lib/api";
import StudentsTab from "../components/StudentsTab";
import CoursesTab from "../components/CoursesTab";
import PromptsTab from "../components/PromptsTab";

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("students");
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    if (getToken()) {
      setLoggedIn(true);
    }
  }, []);

  const handleLogin = async () => {
    setLoggingIn(true);
    setError(null);
    try {
      const data = await adminFetch("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ password }),
      });
      setToken(data.token);
      setLoggedIn(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    clearToken();
    setLoggedIn(false);
    setPassword("");
  };

  if (!loggedIn) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "var(--bg-page)",
        }}
      >
        <div
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border-card)",
            borderRadius: "var(--radius-lg)",
            padding: "40px",
            width: "400px",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              fontFamily: "var(--font-display), 'Lora', serif",
              fontSize: "28px",
              fontWeight: 600,
              marginBottom: "8px",
            }}
          >
            Open Path Admin
          </h1>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "14px",
              marginBottom: "32px",
            }}
          >
            Enter admin password to continue
          </p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="Password"
            style={{
              width: "100%",
              padding: "12px 14px",
              border: "1px solid var(--border-card)",
              borderRadius: "var(--radius)",
              fontSize: "14px",
              fontFamily: "var(--font-body), 'Inter', sans-serif",
              outline: "none",
              marginBottom: "16px",
            }}
          />
          {error && (
            <p
              style={{
                color: "var(--status-amber)",
                fontSize: "13px",
                marginBottom: "12px",
              }}
            >
              {error}
            </p>
          )}
          <button
            onClick={handleLogin}
            disabled={loggingIn}
            style={{
              width: "100%",
              backgroundColor: "var(--btn-normal)",
              color: "#ffffff",
              border: "none",
              borderRadius: "var(--radius)",
              padding: "12px",
              fontFamily: "var(--font-body), 'Inter', sans-serif",
              fontWeight: 500,
              fontSize: "15px",
              cursor: loggingIn ? "not-allowed" : "pointer",
            }}
            onMouseOver={(e) => {
              if (!loggingIn) e.target.style.backgroundColor = "var(--btn-hover)";
            }}
            onMouseOut={(e) => {
              if (!loggingIn) e.target.style.backgroundColor = "var(--btn-normal)";
            }}
          >
            {loggingIn ? "Logging in..." : "Continue"}
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { key: "students", label: "Students" },
    { key: "courses", label: "Courses" },
    { key: "prompts", label: "Prompts" },
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-page)" }}>
      <header
        style={{
          backgroundColor: "var(--bg-card)",
          borderBottom: "1px solid var(--border-card)",
          padding: "16px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-display), 'Lora', serif",
            fontWeight: 600,
            fontSize: "18px",
          }}
        >
          Open Path Admin
        </h1>
        <button
          onClick={handleLogout}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-muted)",
            fontSize: "13px",
            cursor: "pointer",
            fontFamily: "var(--font-body), 'Inter', sans-serif",
          }}
        >
          Log out
        </button>
      </header>

      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "24px",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "4px",
            marginBottom: "24px",
            borderBottom: "1px solid var(--border-card)",
            paddingBottom: "0",
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: "10px 20px",
                background: "none",
                border: "none",
                borderBottom:
                  activeTab === tab.key
                    ? "2px solid var(--accent-gold)"
                    : "2px solid transparent",
                color:
                  activeTab === tab.key
                    ? "var(--text-primary)"
                    : "var(--text-muted)",
                fontFamily: "var(--font-body), 'Inter', sans-serif",
                fontWeight: activeTab === tab.key ? 500 : 400,
                fontSize: "14px",
                cursor: "pointer",
                marginBottom: "-1px",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "students" && <StudentsTab />}
        {activeTab === "courses" && <CoursesTab />}
        {activeTab === "prompts" && <PromptsTab />}
      </div>
    </div>
  );
}
