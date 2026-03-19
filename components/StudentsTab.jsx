"use client";

import { useState, useEffect } from "react";
import { adminFetch } from "../lib/api";
import CourseView from "./CourseView";

export default function StudentsTab() {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [creatingStudent, setCreatingStudent] = useState(false);

  const [showAddCourse, setShowAddCourse] = useState(null);
  const [courseName, setCourseName] = useState("");
  const [frameworkType, setFrameworkType] = useState("");
  const [creatingCourse, setCreatingCourse] = useState(false);

  const loadData = async () => {
    try {
      const [s, c] = await Promise.all([
        adminFetch("/api/admin/students"),
        adminFetch("/api/admin/courses"),
      ]);
      setStudents(s);
      setCourses(c);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleCreateStudent = async () => {
    setCreatingStudent(true); setError(null); setSuccess(null);
    try {
      const data = await adminFetch("/api/admin/students", { method: "POST", body: JSON.stringify({ name: newName, email: newEmail, phone: newPhone }) });
      setSuccess(`Created ${data.name}`);
      setNewName(""); setNewEmail(""); setNewPhone(""); setShowAddStudent(false);
      await loadData();
    } catch (err) { setError(err.message); }
    finally { setCreatingStudent(false); }
  };

  const handleArchiveStudent = async (studentId, studentName) => {
    if (!confirm(`Archive ${studentName}? They won't be able to log in.`)) return;
    setError(null); setSuccess(null);
    try {
      await adminFetch(`/api/admin/students/${studentId}/archive`, { method: "POST" });
      setSuccess(`Archived ${studentName}`);
      await loadData();
    } catch (err) { setError(err.message); }
  };

  const handleCreateCourse = async (studentId) => {
    setCreatingCourse(true); setError(null); setSuccess(null);
    try {
      const data = await adminFetch("/api/admin/courses", { method: "POST", body: JSON.stringify({ student_id: studentId, name: courseName, framework_type: frameworkType || undefined }) });
      setSuccess(`Created "${data.name}"`);
      setCourseName(""); setFrameworkType(""); setShowAddCourse(null);
      await loadData();
    } catch (err) { setError(err.message); }
    finally { setCreatingCourse(false); }
  };

  const handleArchiveCourse = async (courseId, courseName) => {
    if (!confirm(`Archive "${courseName}"?`)) return;
    setError(null); setSuccess(null);
    try {
      await adminFetch(`/api/admin/courses/${courseId}/archive`, { method: "POST" });
      setSuccess(`Archived "${courseName}"`);
      if (selectedCourse?.id === courseId) setSelectedCourse(null);
      await loadData();
    } catch (err) { setError(err.message); }
  };

  const getStudentCourses = (studentId) => courses.filter((c) => c.student_id === studentId);

  // If a course is selected, show CourseView
  if (selectedCourse) {
    return (
      <div>
        <button onClick={() => setSelectedCourse(null)}
          style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "14px", cursor: "pointer", padding: "0", marginBottom: "20px", fontFamily: "var(--font-body), 'Inter', sans-serif" }}>
          ← Back to Students
        </button>
        <CourseView course={selectedCourse} onBack={() => setSelectedCourse(null)} />
      </div>
    );
  }

  const inputStyle = { width: "100%", padding: "10px 12px", border: "1px solid var(--border-card)", borderRadius: "var(--radius)", fontSize: "14px", fontFamily: "var(--font-body), 'Inter', sans-serif", outline: "none" };
  const btnStyle = { backgroundColor: "var(--btn-normal)", color: "#ffffff", border: "none", borderRadius: "var(--radius)", padding: "8px 16px", fontFamily: "var(--font-body), 'Inter', sans-serif", fontWeight: 500, fontSize: "13px", cursor: "pointer" };
  const smallBtnStyle = { background: "none", border: "1px solid var(--border-card)", borderRadius: "var(--radius)", padding: "4px 12px", fontSize: "12px", color: "var(--text-muted)", cursor: "pointer", fontFamily: "var(--font-body), 'Inter', sans-serif" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ fontFamily: "var(--font-display), 'Lora', serif", fontSize: "22px", fontWeight: 600 }}>Students</h2>
        <button onClick={() => setShowAddStudent(!showAddStudent)} style={btnStyle}
          onMouseOver={(e) => (e.target.style.backgroundColor = "var(--btn-hover)")}
          onMouseOut={(e) => (e.target.style.backgroundColor = "var(--btn-normal)")}>
          {showAddStudent ? "Cancel" : "Add Student"}
        </button>
      </div>

      {success && <p style={{ color: "var(--status-green)", fontSize: "13px", marginBottom: "12px" }}>{success}</p>}
      {error && <p style={{ color: "var(--status-amber)", fontSize: "13px", marginBottom: "12px" }}>{error}</p>}

      {showAddStudent && (
        <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-card)", borderRadius: "var(--radius-lg)", padding: "24px", marginBottom: "20px" }}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "4px" }}>Name *</label>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Full name" style={inputStyle} />
          </div>
          <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "4px" }}>Email</label>
              <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="student@example.com" style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "4px" }}>Phone (optional)</label>
              <input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="+1234567890" style={inputStyle} />
            </div>
          </div>
          <button onClick={handleCreateStudent} disabled={creatingStudent || !newName.trim()}
            style={{ ...btnStyle, opacity: creatingStudent || !newName.trim() ? 0.6 : 1, cursor: creatingStudent ? "not-allowed" : "pointer" }}>
            {creatingStudent ? "Creating..." : "Create Student"}
          </button>
        </div>
      )}

      {loading ? <p style={{ color: "var(--text-muted)" }}>Loading...</p> : students.length === 0 ? (
        <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "40px" }}>No students yet.</p>
      ) : (
        students.map((student) => {
          const studentCourses = getStudentCourses(student.id);
          const isExpanded = expandedStudent === student.id;

          return (
            <div key={student.id} style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-card)", borderRadius: "var(--radius-lg)", marginBottom: "12px", overflow: "hidden" }}>
              <div onClick={() => setExpandedStudent(isExpanded ? null : student.id)}
                style={{ padding: "20px 24px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ fontFamily: "var(--font-display), 'Lora', serif", fontSize: "17px", fontWeight: 500, marginBottom: "4px" }}>{student.name}</h3>
                  <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                    {student.email || "No email"}
                    {student.clerk_id && <span style={{ marginLeft: "12px", fontFamily: "monospace", fontSize: "11px" }}>{student.clerk_id.slice(0, 16)}...</span>}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)", backgroundColor: "#f0ebe0", padding: "2px 10px", borderRadius: "20px" }}>
                    {studentCourses.length} course{studentCourses.length !== 1 ? "s" : ""}
                  </span>
                  <span style={{ color: "var(--text-muted)", fontSize: "18px" }}>{isExpanded ? "▾" : "▸"}</span>
                </div>
              </div>

              {isExpanded && (
                <div style={{ borderTop: "1px solid var(--border-card)", padding: "16px 24px", backgroundColor: "#faf8f4" }}>
                  {studentCourses.map((course) => (
                    <div key={course.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", backgroundColor: "var(--bg-card)", border: "1px solid var(--border-card)", borderRadius: "var(--radius)", marginBottom: "8px" }}>
                      <div onClick={() => setSelectedCourse({ ...course, studentName: student.name, studentId: student.id })} style={{ cursor: "pointer", flex: 1 }}>
                        <span style={{ fontSize: "14px", fontWeight: 500 }}>{course.name}</span>
                        {course.framework_type && <span style={{ fontSize: "12px", color: "var(--text-muted)", marginLeft: "10px" }}>{course.framework_type}</span>}
                      </div>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button onClick={() => setSelectedCourse({ ...course, studentName: student.name, studentId: student.id })} style={smallBtnStyle}>View</button>
                        <button onClick={(e) => { e.stopPropagation(); handleArchiveCourse(course.id, course.name); }}
                          style={{ ...smallBtnStyle, color: "var(--status-amber)" }}>Archive</button>
                      </div>
                    </div>
                  ))}

                  {showAddCourse === student.id ? (
                    <div style={{ marginTop: "12px", padding: "16px", backgroundColor: "var(--bg-card)", border: "1px solid var(--border-card)", borderRadius: "var(--radius)" }}>
                      <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
                        <div style={{ flex: 2 }}><input value={courseName} onChange={(e) => setCourseName(e.target.value)} placeholder="Course name" style={inputStyle} /></div>
                        <div style={{ flex: 1 }}><input value={frameworkType} onChange={(e) => setFrameworkType(e.target.value)} placeholder="Framework (optional)" style={inputStyle} /></div>
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button onClick={() => handleCreateCourse(student.id)} disabled={creatingCourse || !courseName.trim()} style={{ ...btnStyle, opacity: creatingCourse || !courseName.trim() ? 0.6 : 1 }}>
                          {creatingCourse ? "Creating..." : "Add"}
                        </button>
                        <button onClick={() => { setShowAddCourse(null); setCourseName(""); setFrameworkType(""); }} style={smallBtnStyle}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setShowAddCourse(student.id)}
                      style={{ marginTop: "8px", background: "none", border: "1px dashed var(--border-card)", borderRadius: "var(--radius)", padding: "8px 16px", fontSize: "13px", color: "var(--text-muted)", cursor: "pointer", fontFamily: "var(--font-body), 'Inter', sans-serif", width: "100%", textAlign: "center" }}>
                      + Add Course
                    </button>
                  )}

                  <div style={{ marginTop: "12px", textAlign: "right" }}>
                    <button onClick={() => handleArchiveStudent(student.id, student.name)}
                      style={{ ...smallBtnStyle, color: "var(--status-amber)" }}>Archive Student</button>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
