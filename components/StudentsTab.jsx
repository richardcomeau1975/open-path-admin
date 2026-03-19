"use client";

import { useState, useEffect } from "react";
import { adminFetch } from "../lib/api";

export default function StudentsTab() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const loadStudents = async () => {
    try {
      const data = await adminFetch("/api/admin/students");
      setStudents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    setSuccess(null);
    try {
      const data = await adminFetch("/api/admin/students", {
        method: "POST",
        body: JSON.stringify({ name, email, phone }),
      });
      setSuccess(`Created ${data.name} (Clerk ID: ${data.clerk_id})`);
      setName("");
      setEmail("");
      setPhone("");
      setShowForm(false);
      await loadStudents();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-display), 'Lora', serif",
            fontSize: "22px",
            fontWeight: 600,
          }}
        >
          Students
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            backgroundColor: "var(--btn-normal)",
            color: "#ffffff",
            border: "none",
            borderRadius: "var(--radius)",
            padding: "8px 16px",
            fontFamily: "var(--font-body), 'Inter', sans-serif",
            fontWeight: 500,
            fontSize: "13px",
            cursor: "pointer",
          }}
          onMouseOver={(e) =>
            (e.target.style.backgroundColor = "var(--btn-hover)")
          }
          onMouseOut={(e) =>
            (e.target.style.backgroundColor = "var(--btn-normal)")
          }
        >
          {showForm ? "Cancel" : "Add Student"}
        </button>
      </div>

      {success && (
        <p
          style={{
            color: "var(--status-green)",
            fontSize: "13px",
            marginBottom: "12px",
          }}
        >
          {success}
        </p>
      )}
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

      {showForm && (
        <div
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border-card)",
            borderRadius: "var(--radius-lg)",
            padding: "24px",
            marginBottom: "20px",
          }}
        >
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "4px" }}>
              Name *
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid var(--border-card)",
                borderRadius: "var(--radius)",
                fontSize: "14px",
                fontFamily: "var(--font-body), 'Inter', sans-serif",
                outline: "none",
              }}
            />
          </div>
          <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "4px" }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid var(--border-card)",
                  borderRadius: "var(--radius)",
                  fontSize: "14px",
                  fontFamily: "var(--font-body), 'Inter', sans-serif",
                  outline: "none",
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "4px" }}>
                Phone (optional)
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1234567890"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid var(--border-card)",
                  borderRadius: "var(--radius)",
                  fontSize: "14px",
                  fontFamily: "var(--font-body), 'Inter', sans-serif",
                  outline: "none",
                }}
              />
            </div>
          </div>
          <button
            onClick={handleCreate}
            disabled={creating || !name.trim()}
            style={{
              backgroundColor: creating ? "var(--text-muted)" : "var(--btn-normal)",
              color: "#ffffff",
              border: "none",
              borderRadius: "var(--radius)",
              padding: "10px 20px",
              fontFamily: "var(--font-body), 'Inter', sans-serif",
              fontWeight: 500,
              fontSize: "14px",
              cursor: creating ? "not-allowed" : "pointer",
            }}
          >
            {creating ? "Creating..." : "Create Student"}
          </button>
        </div>
      )}

      {loading ? (
        <p style={{ color: "var(--text-muted)" }}>Loading...</p>
      ) : (
        <div
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border-card)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
          }}
        >
          {students.length === 0 ? (
            <p style={{ padding: "24px", color: "var(--text-muted)", textAlign: "center" }}>
              No students yet.
            </p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-card)" }}>
                  <th style={{ textAlign: "left", padding: "12px 16px", fontSize: "12px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Name</th>
                  <th style={{ textAlign: "left", padding: "12px 16px", fontSize: "12px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Email</th>
                  <th style={{ textAlign: "left", padding: "12px 16px", fontSize: "12px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Clerk ID</th>
                  <th style={{ textAlign: "left", padding: "12px 16px", fontSize: "12px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Created</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} style={{ borderBottom: "1px solid var(--border-card)" }}>
                    <td style={{ padding: "12px 16px", fontSize: "14px" }}>{s.name}</td>
                    <td style={{ padding: "12px 16px", fontSize: "14px", color: "var(--text-muted)" }}>{s.email || "—"}</td>
                    <td style={{ padding: "12px 16px", fontSize: "12px", color: "var(--text-muted)", fontFamily: "monospace" }}>{s.clerk_id ? s.clerk_id.slice(0, 16) + "..." : "—"}</td>
                    <td style={{ padding: "12px 16px", fontSize: "13px", color: "var(--text-muted)" }}>{new Date(s.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
