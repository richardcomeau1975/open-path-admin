"use client";

import { useState, useEffect } from "react";
import { adminFetch, getToken, setToken, clearToken } from "../lib/api";

// ── Display name mapping ────────────────────────────
const DISPLAY_NAMES = {
  learning_asset_generator: "Learning Asset Generator",
  podcast_generator: "Podcast Generator",
  visual_overview: "Visual Overview",
  notechart: "Active Recall",
  walkthrough_tutor: "Walkthrough Tutor",
  quiz_generator: "Quiz Generator",
  exam_analyzer: "Exam Analyzer",
  applied_systems_thinking: "Applied Systems Thinking",
  phenomenon_explanation: "Phenomenon Explanation",
  argument_evaluation: "Argument Evaluation",
  framework_application: "Framework Application",
  close_reading: "Close Reading",
  algorithm_proof: "Algorithm Proof",
};

function displayName(key) {
  return DISPLAY_NAMES[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

const PROMPT_GROUPS = [
  { label: "Knowledge Base", features: ["learning_asset_generator"] },
  { label: "Content Delivery", features: ["podcast_generator", "visual_overview"] },
  { label: "Consolidation", features: ["notechart", "walkthrough_tutor"] },
  { label: "Testing", features: ["quiz_generator", "exam_analyzer"] },
];

const ALL_FEATURES = ["learning_asset_generator", "podcast_generator", "visual_overview", "notechart", "walkthrough_tutor", "quiz_generator", "exam_analyzer"];

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
    if (tab === "students") setCurrentView({ type: "student_list" });
    else if (tab === "prompts") setCurrentView({ type: "prompts_home" });
    else setCurrentView({ type: tab });
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
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <a href="/test" style={{ fontSize: 13, color: "#9B8E82", textDecoration: "none", fontFamily: "Inter, sans-serif" }}>Test Environment</a>
          <button onClick={handleLogout} style={{ background: "none", border: "none", color: "#6B6B6B", cursor: "pointer", fontSize: 14, fontFamily: "Inter, sans-serif" }}>Log out</button>
        </div>
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
        {activeTab === "prompts" && <PromptsRouter view={currentView} navigate={navigate} goBack={goBack} />}
        {activeTab === "activity" && <ActivityTab />}
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
            {frameworks.map(f => <option key={f} value={f}>{displayName(f)}</option>)}
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
          {frameworks.map(f => <option key={f} value={f}>{displayName(f)}</option>)}
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
          <div style={{ fontSize: 12, fontWeight: 500, color: "#6B6B6B", letterSpacing: 0.8, marginBottom: 8, fontFamily: "Inter, sans-serif", textTransform: "uppercase" }}>{group.label}</div>
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

// ══════════════════════════════════════════════════════
// PROMPTS TAB
// ══════════════════════════════════════════════════════

function PromptsRouter({ view, navigate, goBack }) {
  switch (view.type) {
    case "prompts_home": return <PromptsHome navigate={navigate} />;
    case "global_prompt_detail": return <PromptDetail prompt={view.prompt} backLabel="← Global Prompts" goBack={goBack} isFramework={false} />;
    case "framework_detail": return <FrameworkDetail framework={view.framework} navigate={navigate} goBack={goBack} />;
    case "framework_prompt_detail": return <PromptDetail prompt={view.prompt} backLabel={`← ${displayName(view.framework)}`} goBack={goBack} isFramework={true} framework={view.framework} />;
    default: return <PromptsHome navigate={navigate} />;
  }
}

// ── Prompts Home ────────────────────────────────────
function PromptsHome({ navigate }) {
  const [prompts, setPrompts] = useState([]);
  const [frameworks, setFrameworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showReplace, setShowReplace] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [addForm, setAddForm] = useState({ feature: "", content: "" });
  const [replaceForm, setReplaceForm] = useState({ find: "", replace: "" });
  const [deleteFeature, setDeleteFeature] = useState("");
  const [replaceResult, setReplaceResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => { load(); }, []);
  async function load() {
    try {
      const [pData, fwData] = await Promise.all([
        adminFetch("/api/admin/prompts"),
        adminFetch("/api/admin/framework-types"),
      ]);
      setPrompts(pData);
      setFrameworks(fwData.framework_types || []);
    } catch (e) { /* ignore */ } finally { setLoading(false); }
  }

  const globalPrompts = prompts.filter(p => !p.framework_type);
  const globalFeatures = new Set(globalPrompts.map(p => p.feature));

  async function handleAdd(e) {
    e.preventDefault(); setError("");
    try {
      await adminFetch("/api/admin/prompts", { method: "POST", body: JSON.stringify({ feature: addForm.feature, content: addForm.content, framework_type: null, created_by: "admin" }) });
      setShowAdd(false); setAddForm({ feature: "", content: "" }); load();
    } catch (e) { setError(e.message); }
  }

  async function handleReplace(e) {
    e.preventDefault(); setError(""); setReplaceResult(null);
    try {
      const data = await adminFetch("/api/admin/prompts/global-replace", { method: "POST", body: JSON.stringify({ find: replaceForm.find, replace: replaceForm.replace }) });
      setReplaceResult(`Replaced in ${data.count} prompt${data.count !== 1 ? "s" : ""}.`);
      load();
    } catch (e) { setError(e.message); }
  }

  async function handleDelete(e) {
    e.preventDefault();
    if (!confirm(`Delete the global prompt for "${displayName(deleteFeature)}"?`)) return;
    const p = globalPrompts.find(p => p.feature === deleteFeature);
    if (!p) return;
    try {
      await adminFetch(`/api/admin/prompts/${p.id}`, { method: "PUT", body: JSON.stringify({ is_active: false }) });
      setShowDelete(false); setDeleteFeature(""); load();
    } catch (e) { setError(e.message); }
  }

  if (loading) return <p style={muted}>Loading...</p>;

  return (
    <>
      {/* Global Prompts */}
      <div style={headerRow}>
        <span style={sectionLabel}>Global Prompts</span>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <button style={btn} onClick={() => { setShowAdd(!showAdd); setShowReplace(false); setShowDelete(false); }}>+ Add</button>
        <button style={btnOutline} onClick={() => { setShowReplace(!showReplace); setShowAdd(false); setShowDelete(false); }}>Global Replace</button>
        <button style={btnOutline} onClick={() => { setShowDelete(!showDelete); setShowAdd(false); setShowReplace(false); }}>Global Delete</button>
      </div>

      {error && <p style={{ color: "#c0392b", fontSize: 13, marginBottom: 10 }}>{error}</p>}

      {showAdd && (
        <form onSubmit={handleAdd} style={{ ...card, marginBottom: 16 }}>
          <select value={addForm.feature} onChange={e => setAddForm({ ...addForm, feature: e.target.value })} style={input} required>
            <option value="">Select feature...</option>
            {ALL_FEATURES.filter(f => !globalFeatures.has(f)).map(f => <option key={f} value={f}>{displayName(f)}</option>)}
          </select>
          <textarea placeholder="Prompt content..." value={addForm.content} onChange={e => setAddForm({ ...addForm, content: e.target.value })}
            style={{ ...input, minHeight: 120, resize: "vertical" }} required />
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" style={btn}>Create</button>
            <button type="button" style={btnOutline} onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
        </form>
      )}

      {showReplace && (
        <form onSubmit={handleReplace} style={{ ...card, marginBottom: 16 }}>
          <input placeholder="Find..." value={replaceForm.find} onChange={e => setReplaceForm({ ...replaceForm, find: e.target.value })} style={input} required />
          <input placeholder="Replace with..." value={replaceForm.replace} onChange={e => setReplaceForm({ ...replaceForm, replace: e.target.value })} style={input} />
          {replaceResult && <p style={{ color: "#4A7C59", fontSize: 13, marginBottom: 10 }}>{replaceResult}</p>}
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" style={btn}>Replace in All Active Prompts</button>
            <button type="button" style={btnOutline} onClick={() => { setShowReplace(false); setReplaceResult(null); }}>Cancel</button>
          </div>
        </form>
      )}

      {showDelete && (
        <form onSubmit={handleDelete} style={{ ...card, marginBottom: 16 }}>
          <select value={deleteFeature} onChange={e => setDeleteFeature(e.target.value)} style={input} required>
            <option value="">Select feature to delete...</option>
            {ALL_FEATURES.filter(f => globalFeatures.has(f)).map(f => <option key={f} value={f}>{displayName(f)}</option>)}
          </select>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" style={{ ...btnOutline, color: "#c0392b", borderColor: "#c0392b" }}>Delete</button>
            <button type="button" style={btnOutline} onClick={() => setShowDelete(false)}>Cancel</button>
          </div>
        </form>
      )}

      {PROMPT_GROUPS.map(group => {
        const groupPrompts = group.features.filter(f => globalFeatures.has(f));
        if (groupPrompts.length === 0) return null;
        return (
          <div key={group.label} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: "#6B6B6B", letterSpacing: 0.5, marginBottom: 8, fontFamily: "Inter, sans-serif", textTransform: "uppercase" }}>{group.label}</div>
            <div style={card}>
              {groupPrompts.map((f, i) => {
                const p = globalPrompts.find(pr => pr.feature === f);
                return (
                  <div key={f} style={{ padding: "12px 0", borderBottom: i < groupPrompts.length - 1 ? "1px solid #E8E4DA" : "none", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                    onClick={() => navigate({ type: "global_prompt_detail", prompt: p })}>
                    <span style={{ fontWeight: 500, fontFamily: "Inter, sans-serif", fontSize: 14 }}>{displayName(f)}</span>
                    <span style={muted}>→</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Framework Prompts */}
      <div style={{ ...headerRow, marginTop: 32 }}>
        <span style={sectionLabel}>Framework Prompts</span>
      </div>
      {frameworks.length === 0 ? <p style={muted}>No frameworks defined yet.</p> : frameworks.map(fw => (
        <div key={fw} style={listCard} onClick={() => navigate({ type: "framework_detail", framework: fw })}>
          <span style={{ fontWeight: 500, fontFamily: "Inter, sans-serif", fontSize: 15 }}>{displayName(fw)}</span>
          <span style={muted}>→</span>
        </div>
      ))}
    </>
  );
}

// ── Framework Detail ────────────────────────────────
function FrameworkDetail({ framework, navigate, goBack }) {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [overrideFeature, setOverrideFeature] = useState(null);
  const [overrideContent, setOverrideContent] = useState("");

  useEffect(() => { load(); }, []);
  async function load() {
    try { const data = await adminFetch("/api/admin/prompts"); setPrompts(data.filter(p => p.framework_type === framework)); } catch (e) { /* ignore */ } finally { setLoading(false); }
  }

  const overrideFeatures = new Set(prompts.map(p => p.feature));

  async function handleCreateOverride(e) {
    e.preventDefault();
    try {
      await adminFetch("/api/admin/prompts", { method: "POST", body: JSON.stringify({ feature: overrideFeature, framework_type: framework, content: overrideContent, created_by: "admin" }) });
      setOverrideFeature(null); setOverrideContent(""); load();
    } catch (e) { /* ignore */ }
  }

  if (loading) return <><button style={backLink} onClick={goBack}>← Prompts</button><p style={muted}>Loading...</p></>;

  return (
    <>
      <button style={backLink} onClick={goBack}>← Prompts</button>
      <span style={{ ...sectionLabel, display: "block", marginBottom: 20 }}>{displayName(framework)}</span>

      {PROMPT_GROUPS.map(group => (
        <div key={group.label} style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: "#6B6B6B", letterSpacing: 0.5, marginBottom: 8, fontFamily: "Inter, sans-serif", textTransform: "uppercase" }}>{group.label}</div>
          <div style={card}>
            {group.features.map((f, i) => {
              const p = prompts.find(pr => pr.feature === f);
              const hasOverride = overrideFeatures.has(f);
              return (
                <div key={f} style={{ padding: "12px 0", borderBottom: i < group.features.length - 1 ? "1px solid #E8E4DA" : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    {hasOverride ? (
                      <span style={{ fontWeight: 500, fontFamily: "Inter, sans-serif", fontSize: 14, cursor: "pointer" }}
                        onClick={() => navigate({ type: "framework_prompt_detail", prompt: p, framework })}>{displayName(f)}</span>
                    ) : (
                      <span style={{ ...muted, fontSize: 14 }}>{displayName(f)}</span>
                    )}
                    {hasOverride ? (
                      <span style={{ ...muted, cursor: "pointer" }} onClick={() => navigate({ type: "framework_prompt_detail", prompt: p, framework })}>→</span>
                    ) : (
                      <button style={btnOutline} onClick={() => { setOverrideFeature(f); setOverrideContent(""); }}>+ Override</button>
                    )}
                  </div>
                  {overrideFeature === f && (
                    <form onSubmit={handleCreateOverride} style={{ marginTop: 10 }}>
                      <div style={{ ...muted, fontSize: 12, marginBottom: 6 }}>{displayName(f)}</div>
                      <textarea placeholder="Prompt content..." value={overrideContent} onChange={e => setOverrideContent(e.target.value)}
                        style={{ ...input, minHeight: 120, resize: "vertical" }} required />
                      <div style={{ display: "flex", gap: 8 }}>
                        <button type="submit" style={btn}>Create</button>
                        <button type="button" style={btnOutline} onClick={() => setOverrideFeature(null)}>Cancel</button>
                      </div>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}

// ── Prompt Detail (Global + Framework) ──────────────
function PromptDetail({ prompt: initialPrompt, backLabel, goBack, isFramework, framework }) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [showText, setShowText] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [viewingVersionId, setViewingVersionId] = useState(null);
  const [viewingVersionText, setViewingVersionText] = useState("");
  const [uploading, setUploading] = useState(false);

  // Modifier sockets
  const [modifiers, setModifiers] = useState([]);
  const [modTypes, setModTypes] = useState([]);
  const [modEditKey, setModEditKey] = useState(null);
  const [modEditContent, setModEditContent] = useState("");

  useEffect(() => { loadMods(); }, []);
  async function loadMods() {
    try {
      const [mods, types] = await Promise.all([
        adminFetch(`/api/admin/modifiers?feature=${prompt.feature}`),
        adminFetch("/api/admin/modifier-types"),
      ]);
      setModifiers(mods); setModTypes(types);
    } catch (e) { /* ignore */ }
  }

  async function handleSave() {
    try {
      const data = await adminFetch(`/api/admin/prompts/${prompt.id}`, { method: "PUT", body: JSON.stringify({ content: editContent }) });
      setPrompt(data); setEditing(false); setShowText(true);
    } catch (e) { /* ignore */ }
  }

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const text = await file.text();
      const data = await adminFetch(`/api/admin/prompts/${prompt.id}`, { method: "PUT", body: JSON.stringify({ content: text }) });
      setPrompt(data);
    } catch (e) { /* ignore */ } finally { setUploading(false); }
  }

  async function loadHistory() {
    if (showHistory) { setShowHistory(false); return; }
    try { const data = await adminFetch(`/api/admin/prompts/${prompt.id}/history`); setHistory(data); setShowHistory(true); } catch (e) { /* ignore */ }
  }

  async function handleRestore(versionId) {
    try {
      await adminFetch(`/api/admin/prompts/${versionId}/rollback`, { method: "POST" });
      const data = await adminFetch(`/api/admin/prompts/${versionId}/history`);
      setHistory(data);
      const active = data.find(p => p.is_active);
      if (active) { setPrompt(active); setEditContent(active.content); }
    } catch (e) { /* ignore */ }
  }

  async function handleDeleteOverride() {
    if (!confirm("Delete this framework override? The feature will fall back to the global prompt.")) return;
    try {
      await adminFetch(`/api/admin/prompts/${prompt.id}`, { method: "PUT", body: JSON.stringify({ is_active: false }) });
      goBack();
    } catch (e) { /* ignore */ }
  }

  async function handleModSave(typeKey) {
    try {
      await adminFetch("/api/admin/modifiers", { method: "POST", body: JSON.stringify({ feature: prompt.feature, modifier_type: typeKey, content: modEditContent }) });
      setModEditKey(null); setModEditContent(""); loadMods();
    } catch (e) { /* ignore */ }
  }

  async function handleModDelete(modId) {
    if (!confirm("Delete this modifier?")) return;
    try { await adminFetch(`/api/admin/modifiers/${modId}`, { method: "DELETE" }); loadMods(); } catch (e) { /* ignore */ }
  }

  return (
    <>
      <button style={backLink} onClick={goBack}>{backLabel}</button>
      <span style={{ ...sectionLabel, display: "block", marginBottom: 16 }}>{displayName(prompt.feature)}</span>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <button style={btnOutline} onClick={() => { setShowText(!showText); setEditing(false); }}>View</button>
        <button style={btnOutline} onClick={() => { setEditing(!editing); setEditContent(prompt.content); setShowText(false); }}>{editing ? "Cancel Edit" : "Edit"}</button>
        <label style={{ ...btnOutline, display: "inline-flex", alignItems: "center", cursor: "pointer" }}>
          {uploading ? "Uploading..." : "Upload"}
          <input type="file" accept=".txt,.md" onChange={handleUpload} style={{ display: "none" }} />
        </label>
        <button style={btnOutline} onClick={loadHistory}>Version History</button>
        {isFramework && (
          <button style={{ ...btnOutline, color: "#c0392b", borderColor: "#c0392b" }} onClick={handleDeleteOverride}>Delete Override</button>
        )}
      </div>

      {showText && !editing && (
        <div style={{ background: "#f9f8f5", border: "1px solid #E8E4DA", borderRadius: 8, padding: "1rem", maxHeight: 300, overflowY: "auto", marginBottom: 20 }}>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 13, lineHeight: 1.6, fontFamily: "Inter, sans-serif", color: "#1a1a1a" }}>{prompt.content}</pre>
        </div>
      )}

      {editing && (
        <div style={{ marginBottom: 20 }}>
          <textarea value={editContent} onChange={e => setEditContent(e.target.value)}
            style={{ ...input, minHeight: 250, resize: "vertical" }} />
          <div style={{ display: "flex", gap: 8 }}>
            <button style={btn} onClick={handleSave}>Save</button>
            <button style={btnOutline} onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </div>
      )}

      {showHistory && (
        <div style={{ marginBottom: 20 }}>
          {history.map(v => (
            <div key={v.id} style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontWeight: 500, fontFamily: "Inter, sans-serif", fontSize: 14 }}>v{v.version}</span>
                {v.is_active && <span style={badge("#4A7C59")}>Active</span>}
                <span style={muted}>{new Date(v.created_at).toLocaleString()}</span>
                {v.created_by && <span style={muted}>by {v.created_by}</span>}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button style={btnOutline} onClick={() => { if (viewingVersionId === v.id) { setViewingVersionId(null); } else { setViewingVersionId(v.id); setViewingVersionText(v.content); } }}>
                  {viewingVersionId === v.id ? "Hide" : "View"}
                </button>
                {!v.is_active && <button style={btnOutline} onClick={() => handleRestore(v.id)}>Restore</button>}
              </div>
            </div>
          ))}
          {viewingVersionId && (
            <div style={{ background: "#f9f8f5", border: "1px solid #E8E4DA", borderRadius: 8, padding: "1rem", maxHeight: 300, overflowY: "auto", marginTop: 10 }}>
              <pre style={{ whiteSpace: "pre-wrap", fontSize: 13, lineHeight: 1.6, fontFamily: "Inter, sans-serif" }}>{viewingVersionText}</pre>
            </div>
          )}
        </div>
      )}

      {/* Modifier Sockets */}
      <div style={{ marginTop: 32 }}>
        <span style={{ ...sectionLabel, display: "block", marginBottom: 16 }}>Modifier Sockets</span>
        <div style={card}>
          {modTypes.map((mt, i) => {
            const mod = modifiers.find(m => m.modifier_type === mt.key && !m.student_id && !m.course_id);
            const isFilled = !!mod;
            const isEditing = modEditKey === mt.key;
            return (
              <div key={mt.key} style={{ padding: "14px 0", borderBottom: i < modTypes.length - 1 ? "1px solid #E8E4DA" : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontWeight: 500, fontFamily: "Inter, sans-serif", fontSize: 14 }}>{mt.label}</span>
                    <span style={{ fontSize: 13, color: isFilled ? "#4A7C59" : "#6B6B6B" }}>{isFilled ? "Filled" : "Empty"}</span>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {!isEditing && (
                      <button style={btnOutline} onClick={() => { setModEditKey(mt.key); setModEditContent(mod?.content || ""); }}>
                        {isFilled ? "Edit" : "Add"}
                      </button>
                    )}
                    {isFilled && !isEditing && (
                      <button style={{ ...btnOutline, color: "#c0392b", borderColor: "#c0392b" }} onClick={() => handleModDelete(mod.id)}>Delete</button>
                    )}
                  </div>
                </div>
                {isEditing && (
                  <div style={{ marginTop: 10 }}>
                    <textarea value={modEditContent} onChange={e => setModEditContent(e.target.value)}
                      style={{ width: "100%", padding: "10px 12px", border: "1px solid #E8E4DA", borderRadius: 8, fontSize: 14, minHeight: 100, resize: "vertical", outline: "none", fontFamily: "Inter, sans-serif", marginBottom: 8 }} />
                    <div style={{ display: "flex", gap: 8 }}>
                      <button style={btn} onClick={() => handleModSave(mt.key)}>Save</button>
                      <button style={btnOutline} onClick={() => setModEditKey(null)}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ── Activity Tab ────────────────────────────────────
function ActivityTab() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rerunning, setRerunning] = useState({});

  const fetchJobs = async () => {
    try {
      const data = await adminFetch("/api/admin/batch-jobs");
      setJobs(data);
    } catch (e) {
      console.error("Failed to fetch batch jobs", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 30000);
    return () => clearInterval(interval);
  }, []);

  const completedCount = jobs.filter(j => j.status === "completed").length;
  const runningCount = jobs.filter(j => ["pending", "generating", "running"].includes(j.status)).length;
  const errorCount = jobs.filter(j => j.status === "failed").length;
  const failedJobs = jobs.filter(j => j.status === "failed");

  const handleRerun = async (topicId) => {
    setRerunning(prev => ({ ...prev, [topicId]: true }));
    try {
      await adminFetch(`/api/admin/topics/${topicId}/rerun`, { method: "POST" });
      await fetchJobs();
    } catch (e) {
      console.error("Rerun failed", e);
    } finally {
      setRerunning(prev => ({ ...prev, [topicId]: false }));
    }
  };

  const sectionLabel = { fontFamily: "Lora, serif", fontSize: 18, fontWeight: 500, color: "#8B6914" };
  const card = { background: "#ffffff", border: "1px solid #E8E4DA", borderRadius: 12, padding: 20 };

  if (loading) return <p style={{ color: "#6B6B6B", fontFamily: "Inter, sans-serif" }}>Loading...</p>;

  return (
    <>
      {/* Stat Cards */}
      <div style={{ display: "flex", gap: 16, marginBottom: 28 }}>
        {[
          { count: completedCount, label: "Completed", color: "#4A7C59" },
          { count: runningCount, label: "Running", color: "#C4972A" },
          { count: errorCount, label: "Errors", color: "#c0392b" },
        ].map(({ count, label, color }) => (
          <div key={label} style={{ ...card, flex: 1, textAlign: "center", padding: "20px 16px" }}>
            <div style={{ fontFamily: "Lora, serif", fontSize: 20, fontWeight: 500, color }}>{count}</div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#6B6B6B", marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Errors Section */}
      <div style={{ marginBottom: 28 }}>
        <span style={{ ...sectionLabel, display: "block", marginBottom: 12 }}>Errors</span>
        <div style={card}>
          {failedJobs.length === 0 ? (
            <p style={{ color: "#6B6B6B", fontFamily: "Inter, sans-serif", fontSize: 13, margin: 0 }}>No errors.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {failedJobs.map((job) => {
                const topicName = job.topics?.name || job.topic_id;
                const courseName = job.course_name || job.topics?.course_id || "—";
                const studentName = job.student_name || job.student_id || "—";
                const time = job.updated_at || job.created_at;
                const timeStr = time ? new Date(time).toLocaleString() : "";
                return (
                  <div key={job.id} style={{ borderBottom: "1px solid #E8E4DA", paddingBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 15 }}>{topicName}</span>
                      <span style={{ background: "#c0392b", color: "#fff", fontSize: 11, fontFamily: "Inter, sans-serif", padding: "2px 10px", borderRadius: 999, fontWeight: 500 }}>Failed</span>
                    </div>
                    <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#6B6B6B", marginTop: 4 }}>
                      {studentName} · {courseName} · {timeStr}
                    </div>
                    {job.error && (
                      <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#c0392b", marginTop: 4 }}>{job.error}</div>
                    )}
                    <button
                      onClick={() => handleRerun(job.topic_id)}
                      disabled={rerunning[job.topic_id]}
                      style={{
                        marginTop: 8, background: "#9B8E82", color: "#fff", border: "none", borderRadius: 6,
                        padding: "6px 16px", fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 500,
                        cursor: rerunning[job.topic_id] ? "not-allowed" : "pointer", opacity: rerunning[job.topic_id] ? 0.6 : 1,
                      }}
                    >
                      {rerunning[job.topic_id] ? "Re-running..." : "Re-run"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* API Usage Section */}
      <div style={{ marginBottom: 28 }}>
        <span style={{ ...sectionLabel, display: "block", marginBottom: 12 }}>API Usage</span>
        <div style={card}>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#6B6B6B", margin: 0 }}>
            Check{" "}
            <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" style={{ color: "#8B6914", textDecoration: "none" }}>Anthropic</a>,{" "}
            <a href="https://platform.openai.com/usage" target="_blank" rel="noopener noreferrer" style={{ color: "#8B6914", textDecoration: "none" }}>OpenAI</a>, and{" "}
            <a href="https://console.cloud.google.com/billing" target="_blank" rel="noopener noreferrer" style={{ color: "#8B6914", textDecoration: "none" }}>Google Cloud</a>{" "}
            dashboards.
          </p>
        </div>
      </div>
    </>
  );
}
