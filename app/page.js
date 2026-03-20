"use client";

import { useState, useEffect } from "react";
import { adminFetch, getToken, setToken, clearToken } from "../lib/api";

// ── Display name mapping ────────────────────────────
const DISPLAY_NAMES = {
  learning_asset_generator: "Learning Asset Generator",
  podcast_generator: "Podcast Generator",
  visual_overview: "Visual Overview",
  notechart: "Notechart",
  walkthrough_tutor: "Walkthrough Tutor",
  quiz_generator: "Quiz Generator",
  exam_analyzer: "Exam Analyzer",
};

const PROMPT_GROUPS = [
  { label: "KNOWLEDGE BASE", features: ["learning_asset_generator"] },
  { label: "CONTENT DELIVERY", features: ["podcast_generator", "visual_overview"] },
  { label: "CONSOLIDATION", features: ["notechart", "walkthrough_tutor"] },
  { label: "TESTING", features: ["quiz_generator", "exam_analyzer"] },
];

const STATUS_MAP = {
  completed: { label: "Ready", bg: "#4A7C59" },
  generating: { label: "Generating", bg: "#C4972A" },
  failed: { label: "Failed", bg: "#c0392b" },
};

// ── Main App ────────────────────────────────────────
export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [activeTab, setActiveTab] = useState("students");
  const [viewStack, setViewStack] = useState([]);
  const [currentView, setCurrentView] = useState({ type: "student_list" });

  useEffect(() => { if (getToken()) setLoggedIn(true); }, []);

  function navigate(newView) {
    setViewStack(prev => [...prev, currentView]);
    setCurrentView(newView);
  }

  function goBack() {
    setViewStack(prev => {
      const stack = [...prev];
      const previous = stack.pop() || { type: "student_list" };
      setCurrentView(previous);
      return stack;
    });
  }

  function switchTab(tab) {
    setActiveTab(tab);
    setViewStack([]);
    setCurrentView(tab === "students" ? { type: "student_list" } : { type: tab });
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError("");
    try {
      const data = await adminFetch("/api/admin/login", { method: "POST", body: JSON.stringify({ password }) });
      setToken(data.token);
      setLoggedIn(true);
    } catch (err) { setLoginError(err.message); }
  }

  function handleLogout() { clearToken(); setLoggedIn(false); setActiveTab("students"); setViewStack([]); setCurrentView({ type: "student_list" }); }

  if (!loggedIn) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#fdfbf7" }}>
        <form onSubmit={handleLogin} style={{ background: "#fff", border: "1px solid #E8E4DA", borderRadius: 12, padding: "2rem", width: 360, textAlign: "center" }}>
          <h2 style={{ fontFamily: "Lora, serif", fontSize: 22, marginBottom: 20, color: "#1a1a1a" }}>Open Path Admin</h2>
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
            style={{ width: "100%", padding: "10px 12px", border: "1px solid #E8E4DA", borderRadius: 8, fontSize: 14, marginBottom: 12, outline: "none", fontFamily: "Inter, sans-serif" }} />
          {loginError && <p style={{ color: "#c0392b", fontSize: 13, marginBottom: 10 }}>{loginError}</p>}
          <button type="submit" style={{ width: "100%", padding: "10px", background: "#9B8E82", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Log In</button>
        </form>
      </div>
    );
  }

  const TABS = ["students", "prompts", "activity"];

  return (
    <div style={{ minHeight: "100vh", background: "#fdfbf7" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 32px", borderBottom: "1px solid #E8E4DA" }}>
        <span style={{ fontFamily: "Lora, serif", fontSize: 22, fontWeight: 600, color: "#1a1a1a" }}>Open Path Admin</span>
        <button onClick={handleLogout} style={{ background: "none", border: "none", color: "#6B6B6B", cursor: "pointer", fontSize: 14, fontFamily: "Inter, sans-serif" }}>Log out</button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 32, padding: "0 32px", borderBottom: "1px solid #E8E4DA" }}>
        {TABS.map(tab => (
          <button key={tab} onClick={() => switchTab(tab)} style={{
            background: "none", border: "none", borderBottom: activeTab === tab ? "2px solid #8B6914" : "2px solid transparent",
            padding: "12px 0", color: activeTab === tab ? "#8B6914" : "#6B6B6B", fontSize: 15, fontWeight: 500,
            cursor: "pointer", fontFamily: "Inter, sans-serif", textTransform: "capitalize",
          }}>{tab}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 24px" }}>
        {activeTab === "students" && <StudentsRouter view={currentView} navigate={navigate} goBack={goBack} />}
        {activeTab === "prompts" && <p style={{ color: "#6B6B6B", fontFamily: "Inter, sans-serif" }}>Prompts tab — coming in next task.</p>}
        {activeTab === "activity" && <p style={{ color: "#6B6B6B", fontFamily: "Inter, sans-serif" }}>Activity tab — coming in next task.</p>}
      </div>
    </div>
  );
}

// ── Students Router ─────────────────────────────────
function StudentsRouter({ view, navigate, goBack }) {
  switch (view.type) {
    case "student_list": return <StudentList navigate={navigate} />;
    case "student_courses": return <StudentCourses student={view.student} navigate={navigate} goBack={goBack} />;
    case "course_detail": return <CourseDetail student={view.student} course={view.course} navigate={navigate} goBack={goBack} />;
    case "course_topics": return <CourseTopics course={view.course} goBack={goBack} />;
    case "course_prompts": return <CoursePrompts course={view.course} goBack={goBack} />;
    case "course_modifiers": return <CourseModifiers student={view.student} course={view.course} goBack={goBack} />;
    case "course_activity": return <CourseActivity course={view.course} goBack={goBack} />;
    default: return <StudentList navigate={navigate} />;
  }
}

// ── Shared Styles ───────────────────────────────────
const card = { background: "#fff", border: "1px solid #E8E4DA", borderRadius: 12, padding: "1rem 1.25rem", marginBottom: 10 };
const listCard = { ...card, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" };
const sectionLabel = { fontFamily: "Lora, serif", fontSize: 16, fontWeight: 500, color: "#8B6914" };
const muted = { color: "#6B6B6B", fontSize: 14, fontFamily: "Inter, sans-serif" };
const btn = { background: "#9B8E82", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "Inter, sans-serif" };
const btnOutline = { background: "transparent", border: "1px solid #E8E4DA", color: "#1a1a1a", borderRadius: 8, padding: "6px 14px", fontSize: 13, cursor: "pointer", fontFamily: "Inter, sans-serif" };
const input = { width: "100%", padding: "10px 12px", border: "1px solid #E8E4DA", borderRadius: 8, fontSize: 14, marginBottom: 10, outline: "none", fontFamily: "Inter, sans-serif" };
const badge = (bg) => ({ display: "inline-block", padding: "2px 10px", borderRadius: 12, fontSize: 12, fontWeight: 500, color: "#fff", background: bg });
const backLink = { background: "none", border: "none", color: "#6B6B6B", cursor: "pointer", fontSize: 14, marginBottom: 20, display: "block", fontFamily: "Inter, sans-serif" };
const headerRow = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 };
const tileGrid = { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 };
const tile = { ...card, cursor: "pointer", textAlign: "center", padding: "2rem 1.25rem" };

// ── Student List ────────────────────────────────────
function StudentList({ navigate }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [error, setError] = useState("");

  useEffect(() => { load(); }, []);
  async function load() {
    try { const data = await adminFetch("/api/admin/students"); setStudents(data); } catch (e) { setError(e.message); } finally { setLoading(false); }
  }

  async function handleCreate(e) {
    e.preventDefault(); setError("");
    try {
      await adminFetch("/api/admin/students", { method: "POST", body: JSON.stringify(form) });
      setForm({ name: "", email: "", phone: "" }); setShowForm(false); load();
    } catch (e) { setError(e.message); }
  }

  return (
    <>
      <div style={headerRow}>
        <span style={sectionLabel}>Students</span>
        <button style={btn} onClick={() => setShowForm(!showForm)}>{showForm ? "Cancel" : "+ Add Student"}</button>
      </div>
      {showForm && (
        <form onSubmit={handleCreate} style={{ ...card, marginBottom: 16 }}>
          <input placeholder="Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={input} required />
          <input placeholder="Email *" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={input} required />
          <input placeholder="Phone (optional)" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={input} />
          {error && <p style={{ color: "#c0392b", fontSize: 13, marginBottom: 10 }}>{error}</p>}
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" style={btn}>Create Student</button>
            <button type="button" style={btnOutline} onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}
      {!showForm && error && <p style={{ color: "#c0392b", fontSize: 13, marginBottom: 10 }}>{error}</p>}
      {loading ? <p style={muted}>Loading...</p> : students.map(s => (
        <div key={s.id} style={listCard} onClick={() => navigate({ type: "student_courses", student: s })}>
          <span style={{ fontWeight: 500, fontFamily: "Inter, sans-serif", fontSize: 15 }}>{s.name}</span>
          <span style={muted}>→</span>
        </div>
      ))}
    </>
  );
}

// ── Student Courses ─────────────────────────────────
function StudentCourses({ student, navigate, goBack }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", framework_type: "" });
  const [frameworks, setFrameworks] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => { load(); loadFw(); }, []);
  async function load() {
    try { const data = await adminFetch("/api/admin/courses"); setCourses(data.filter(c => c.student_id === student.id)); } catch (e) { setError(e.message); } finally { setLoading(false); }
  }
  async function loadFw() {
    try { const data = await adminFetch("/api/admin/framework-types"); setFrameworks(data.framework_types || []); } catch (e) { /* ignore */ }
  }

  async function handleCreate(e) {
    e.preventDefault(); setError("");
    try {
      await adminFetch("/api/admin/courses", { method: "POST", body: JSON.stringify({ student_id: student.id, name: form.name, framework_type: form.framework_type || null }) });
      setForm({ name: "", framework_type: "" }); setShowForm(false); load();
    } catch (e) { setError(e.message); }
  }

  return (
    <>
      <button style={backLink} onClick={goBack}>← Students</button>
      <div style={headerRow}>
        <span style={sectionLabel}>{student.name}</span>
        <button style={btn} onClick={() => setShowForm(!showForm)}>{showForm ? "Cancel" : "+ Add Course"}</button>
      </div>
      {showForm && (
        <form onSubmit={handleCreate} style={{ ...card, marginBottom: 16 }}>
          <input placeholder="Course name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={input} required />
          <select value={form.framework_type} onChange={e => setForm({ ...form, framework_type: e.target.value })} style={input}>
            <option value="">None</option>
            {frameworks.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          {error && <p style={{ color: "#c0392b", fontSize: 13, marginBottom: 10 }}>{error}</p>}
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" style={btn}>Create Course</button>
            <button type="button" style={btnOutline} onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}
      {!showForm && error && <p style={{ color: "#c0392b", fontSize: 13, marginBottom: 10 }}>{error}</p>}
      {loading ? <p style={muted}>Loading...</p> : courses.length === 0 ? <p style={muted}>No courses yet.</p> : courses.map(c => (
        <div key={c.id} style={listCard} onClick={() => navigate({ type: "course_detail", student, course: c })}>
          <span style={{ fontWeight: 500, fontFamily: "Inter, sans-serif", fontSize: 15 }}>{c.name}</span>
          <span style={muted}>→</span>
        </div>
      ))}
    </>
  );
}

// ── Course Detail ───────────────────────────────────
function CourseDetail({ student, course: initialCourse, navigate, goBack }) {
  const [course, setCourse] = useState(initialCourse);
  const [frameworks, setFrameworks] = useState([]);
  const [fw, setFw] = useState(course.framework_type || "");

  useEffect(() => { loadFw(); }, []);
  async function loadFw() {
    try { const data = await adminFetch("/api/admin/framework-types"); setFrameworks(data.framework_types || []); } catch (e) { /* ignore */ }
  }

  async function handleFwChange(e) {
    const val = e.target.value;
    setFw(val);
    try {
      await adminFetch(`/api/admin/courses/${course.id}`, { method: "PUT", body: JSON.stringify({ framework_type: val || null }) });
      setCourse({ ...course, framework_type: val || null });
    } catch (e) { /* ignore */ }
  }

  return (
    <>
      <button style={backLink} onClick={goBack}>← {student.name}</button>
      <span style={{ ...sectionLabel, display: "block", marginBottom: 20 }}>{course.name}</span>

      <div style={{ ...card, marginBottom: 24 }}>
        <label style={{ ...muted, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 6 }}>Framework Type</label>
        <select value={fw} onChange={handleFwChange} style={{ ...input, marginBottom: 0 }}>
          <option value="">None</option>
          {frameworks.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      </div>

      <div style={tileGrid}>
        <div style={tile} onClick={() => navigate({ type: "course_topics", student, course })}>
          <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: 15 }}>Topics</span>
        </div>
        <div style={tile} onClick={() => navigate({ type: "course_prompts", student, course })}>
          <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: 15 }}>Prompts</span>
        </div>
        <div style={tile} onClick={() => navigate({ type: "course_modifiers", student, course })}>
          <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: 15 }}>Modifiers</span>
        </div>
        <div style={tile} onClick={() => navigate({ type: "course_activity", student, course })}>
          <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: 15 }}>Activity</span>
        </div>
      </div>
    </>
  );
}

// ── Course Topics ───────────────────────────────────
function CourseTopics({ course, goBack }) {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rerunning, setRerunning] = useState(null);

  useEffect(() => { load(); }, []);
  async function load() {
    try { const data = await adminFetch(`/api/admin/courses/${course.id}/topics`); setTopics(data); } catch (e) { /* ignore */ } finally { setLoading(false); }
  }

  async function handleRerun(topicId) {
    setRerunning(topicId);
    try { await adminFetch(`/api/admin/topics/${topicId}/rerun`, { method: "POST" }); setTimeout(load, 2000); } catch (e) { /* ignore */ } finally { setRerunning(null); }
  }

  return (
    <>
      <button style={backLink} onClick={goBack}>← {course.name}</button>
      <span style={{ ...sectionLabel, display: "block", marginBottom: 20 }}>Topics</span>
      {loading ? <p style={muted}>Loading...</p> : topics.length === 0 ? <p style={muted}>No topics yet.</p> : topics.map(t => {
        const status = STATUS_MAP[t.generation_status];
        const showRerun = t.generation_status === "completed" || t.generation_status === "failed";
        return (
          <div key={t.id} style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontWeight: 500, fontFamily: "Inter, sans-serif", fontSize: 15 }}>{t.name}</span>
              {status ? <span style={badge(status.bg)}>{status.label}</span> : <span style={badge("#aaa")}>None</span>}
            </div>
            {showRerun && (
              <button style={btnOutline} onClick={() => handleRerun(t.id)} disabled={rerunning === t.id}>
                {rerunning === t.id ? "Starting..." : "Re-run"}
              </button>
            )}
          </div>
        );
      })}
    </>
  );
}

// ── Course Prompts ──────────────────────────────────
function CoursePrompts({ course, goBack }) {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const fw = course.framework_type;

  useEffect(() => { load(); }, []);
  async function load() {
    try { const data = await adminFetch("/api/admin/prompts"); setPrompts(data); } catch (e) { /* ignore */ } finally { setLoading(false); }
  }

  function getSource(feature) {
    if (fw) {
      const fwPrompt = prompts.find(p => p.feature === feature && p.framework_type === fw);
      if (fwPrompt) return "Framework";
    }
    const global = prompts.find(p => p.feature === feature && !p.framework_type);
    return global ? "Global" : null;
  }

  if (loading) return <><button style={backLink} onClick={goBack}>← {course.name}</button><p style={muted}>Loading...</p></>;

  return (
    <>
      <button style={backLink} onClick={goBack}>← {course.name}</button>
      <span style={{ ...sectionLabel, display: "block", marginBottom: 20 }}>Prompts</span>
      {PROMPT_GROUPS.map(group => (
        <div key={group.label} style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: "#6B6B6B", letterSpacing: 0.8, marginBottom: 8, fontFamily: "Inter, sans-serif" }}>{group.label}</div>
          {group.features.map(f => {
            const source = getSource(f);
            return (
              <div key={f} style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 500, fontFamily: "Inter, sans-serif", fontSize: 14 }}>{DISPLAY_NAMES[f]}</span>
                {source ? (
                  <span style={badge(source === "Framework" ? "#8B6914" : "#9B8E82")}>{source}</span>
                ) : (
                  <span style={muted}>—</span>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </>
  );
}

// ── Course Modifiers ────────────────────────────────
function CourseModifiers({ student, course, goBack }) {
  const [modifiers, setModifiers] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState(null);
  const [editContent, setEditContent] = useState("");

  useEffect(() => { load(); }, []);
  async function load() {
    try {
      const [mods, typeData] = await Promise.all([
        adminFetch(`/api/admin/modifiers?course_id=${course.id}`),
        adminFetch("/api/admin/modifier-types"),
      ]);
      setModifiers(mods); setTypes(typeData);
    } catch (e) { /* ignore */ } finally { setLoading(false); }
  }

  async function handleSave(typeKey) {
    try {
      await adminFetch("/api/admin/modifiers", { method: "POST", body: JSON.stringify({ student_id: student.id, course_id: course.id, modifier_type: typeKey, content: editContent }) });
      setEditingKey(null); setEditContent(""); load();
    } catch (e) { /* ignore */ }
  }

  async function handleDelete(modId) {
    if (!confirm("Delete this modifier?")) return;
    try { await adminFetch(`/api/admin/modifiers/${modId}`, { method: "DELETE" }); load(); } catch (e) { /* ignore */ }
  }

  if (loading) return <><button style={backLink} onClick={goBack}>← {course.name}</button><p style={muted}>Loading...</p></>;

  return (
    <>
      <button style={backLink} onClick={goBack}>← {course.name}</button>
      <span style={{ ...sectionLabel, display: "block", marginBottom: 20 }}>Modifiers</span>
      <div style={card}>
        {types.map((mt, i) => {
          const mod = modifiers.find(m => m.modifier_type === mt.key);
          const isFilled = !!mod;
          const isEditing = editingKey === mt.key;
          return (
            <div key={mt.key} style={{ padding: "14px 0", borderBottom: i < types.length - 1 ? "1px solid #E8E4DA" : "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontWeight: 500, fontFamily: "Inter, sans-serif", fontSize: 14 }}>{mt.label}</span>
                  <span style={{ fontSize: 13, color: isFilled ? "#4A7C59" : "#6B6B6B" }}>{isFilled ? "Filled" : "Empty"}</span>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {!isEditing && (
                    <button style={btnOutline} onClick={() => { setEditingKey(mt.key); setEditContent(mod?.content || ""); }}>
                      {isFilled ? "Edit" : "Add"}
                    </button>
                  )}
                  {isFilled && !isEditing && (
                    <button style={{ ...btnOutline, color: "#c0392b", borderColor: "#c0392b" }} onClick={() => handleDelete(mod.id)}>Delete</button>
                  )}
                </div>
              </div>
              {isEditing && (
                <div style={{ marginTop: 10 }}>
                  <textarea value={editContent} onChange={e => setEditContent(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #E8E4DA", borderRadius: 8, fontSize: 14, minHeight: 100, resize: "vertical", outline: "none", fontFamily: "Inter, sans-serif", marginBottom: 8 }} />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button style={btn} onClick={() => handleSave(mt.key)}>Save</button>
                    <button style={btnOutline} onClick={() => setEditingKey(null)}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

// ── Course Activity ─────────────────────────────────
function CourseActivity({ course, goBack }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rerunning, setRerunning] = useState(null);

  useEffect(() => { load(); }, []);
  async function load() {
    try {
      const [jobData, topicData] = await Promise.all([
        adminFetch("/api/admin/batch-jobs"),
        adminFetch(`/api/admin/courses/${course.id}/topics`),
      ]);
      const topicIds = new Set(topicData.map(t => t.id));
      setJobs((jobData.jobs || []).filter(j => topicIds.has(j.topic_id)));
    } catch (e) { /* ignore */ } finally { setLoading(false); }
  }

  async function handleRerun(topicId) {
    setRerunning(topicId);
    try { await adminFetch(`/api/admin/topics/${topicId}/rerun`, { method: "POST" }); setTimeout(load, 2000); } catch (e) { /* ignore */ } finally { setRerunning(null); }
  }

  const failedJobs = jobs.filter(j => j.status === "failed");

  if (loading) return <><button style={backLink} onClick={goBack}>← {course.name}</button><p style={muted}>Loading...</p></>;

  return (
    <>
      <button style={backLink} onClick={goBack}>← {course.name}</button>
      <span style={{ ...sectionLabel, display: "block", marginBottom: 20 }}>Activity</span>
      {failedJobs.length === 0 ? (
        <p style={muted}>No errors.</p>
      ) : failedJobs.map(j => (
        <div key={j.id} style={{ ...card, borderLeft: "3px solid #c0392b" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontWeight: 500, fontFamily: "Inter, sans-serif", fontSize: 14 }}>{j.topic_name || "Unknown"}</span>
            <button style={btnOutline} onClick={() => handleRerun(j.topic_id)} disabled={rerunning === j.topic_id}>
              {rerunning === j.topic_id ? "Starting..." : "Re-run"}
            </button>
          </div>
          <p style={{ color: "#c0392b", fontSize: 13, fontFamily: "Inter, sans-serif" }}>{j.error_log}</p>
        </div>
      ))}
    </>
  );
}
