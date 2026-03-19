"use client";

import { useState, useEffect } from "react";
import { adminFetch } from "../lib/api";

export default function CoursesTab() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [courseName, setCourseName] = useState("");
  const [frameworkType, setFrameworkType] = useState("");
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
      const data = await adminFetch("/api/admin/courses", {
        method: "POST",
        body: JSON.stringify({
          student_id: selectedStudent,
          name: courseName,
          framework_type: frameworkType || undefined,
        }),
      });
      setSuccess(`Created "${data.name}"`);
      setCourseName("");
      setFrameworkType("");
      setShowForm(false);
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
          Courses
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
          {showForm ? "Cancel" : "Add Course"}
        </button>
      </div>

      {success && (
        <p style={{ color: "var(--status-green)", fontSize: "13px", marginBottom: "12px" }}>
          {success}
        </p>
      )}
      {error && (
        <p style={{ color: "var(--status-amber)", fontSize: "13px", marginBottom: "12px" }}>
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
              Student *
            </label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid var(--border-card)",
                borderRadius: "var(--radius)",
                fontSize: "14px",
                fontFamily: "var(--font-body), 'Inter', sans-serif",
                outline: "none",
                backgroundColor: "#ffffff",
              }}
            >
              <option value="">Select a student...</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.email || "no email"})
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
            <div style={{ flex: 2 }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "4px" }}>
                Course Name *
              </label>
              <input
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="e.g. Psychology 1000"
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
                Framework Type
              </label>
              <input
                value={frameworkType}
                onChange={(e) => setFrameworkType(e.target.value)}
                placeholder="optional"
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
            disabled={creating || !selectedStudent || !courseName.trim()}
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
            {creating ? "Creating..." : "Create Course"}
          </button>
        </div>
      )}

      {loading ? (
        <p style={{ color: "var(--text-muted)" }}>Loading...</p>
      ) : (
        <div>
          {students.map((student) => (
            <div
              key={student.id}
              style={{
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border-card)",
                borderRadius: "var(--radius-lg)",
                padding: "20px",
                marginBottom: "12px",
              }}
            >
              <h3
                style={{
                  fontSize: "15px",
                  fontWeight: 500,
                  marginBottom: "4px",
                }}
              >
                {student.name}
              </h3>
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--text-muted)",
                }}
              >
                {student.email || "No email"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
