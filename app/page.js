"use client";

import { useState, useEffect, useCallback } from "react";
import { adminFetch, getToken, setToken, clearToken } from "../lib/api";

// ── Styles ──────────────────────────────────────────
const S = {
  page: { maxWidth: 900, margin: "0 auto", padding: "32px 24px" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 },
  backRow: { display: "flex", alignItems: "center", gap: 12 },
  backBtn: { background: "none", border: "none", color: "#8888aa", cursor: "pointer", fontSize: 14 },
  title: { fontSize: 24, fontWeight: 600, color: "#e0e0e0" },
  tileGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 },
  tileGrid2: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 },
  tile: { background: "#16213e", border: "1px solid #2a2a4a", borderRadius: 8, padding: "32px 24px", cursor: "pointer", textAlign: "center" },
  card: { background: "#16213e", border: "1px solid #2a2a4a", borderRadius: 8, padding: "16px 20px", marginBottom: 12 },
  listItem: { background: "#16213e", border: "1px solid #2a2a4a", borderRadius: 8, padding: "14px 20px", marginBottom: 8, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" },
  btn: { background: "#7c3aed", color: "#fff", border: "none", borderRadius: 6, padding: "8px 18px", cursor: "pointer", fontSize: 14, fontWeight: 500 },
  btnDanger: { background: "#f87171", color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontSize: 13 },
  btnGhost: { background: "transparent", border: "1px solid #2a2a4a", color: "#e0e0e0", borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontSize: 13 },
  input: { width: "100%", padding: "10px 12px", background: "#1a1a2e", border: "1px solid #2a2a4a", borderRadius: 6, color: "#e0e0e0", fontSize: 14, marginBottom: 10, outline: "none", fontFamily: "inherit" },
  textarea: { width: "100%", padding: "10px 12px", background: "#1a1a2e", border: "1px solid #2a2a4a", borderRadius: 6, color: "#e0e0e0", fontSize: 14, minHeight: 120, resize: "vertical", marginBottom: 10, outline: "none", fontFamily: "inherit" },
  badge: (color) => ({ display: "inline-block", padding: "2px 10px", borderRadius: 12, fontSize: 12, fontWeight: 500, color: "#fff", background: color }),
  muted: { color: "#8888aa", fontSize: 13 },
  label: { color: "#8888aa", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6, display: "block" },
  logoutBtn: { background: "none", border: "1px solid #2a2a4a", color: "#8888aa", borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontSize: 13 },
};

const STATUS_COLORS = { completed: "#4ade80", running: "#fbbf24", queued: "#fbbf24", failed: "#f87171" };

// ── Main App ────────────────────────────────────────
export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [view, setView] = useState("home");
  const [viewStack, setViewStack] = useState([]);
  const [ctx, setCtx] = useState({});

  useEffect(() => { if (getToken()) setLoggedIn(true); }, []);

  function navigate(newView, newCtx = {}) {
    setViewStack(prev => [...prev, { view, ctx: { ...ctx } }]);
    setCtx(prev => ({ ...prev, ...newCtx }));
    setView(newView);
  }

  function goBack() {
    setViewStack(prev => {
      const stack = [...prev];
      const previous = stack.pop();
      if (previous) { setView(previous.view); setCtx(previous.ctx); }
      else { setView("home"); setCtx({}); }
      return stack;
    });
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

  function handleLogout() { clearToken(); setLoggedIn(false); setView("home"); setViewStack([]); setCtx({}); }

  if (!loggedIn) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <form onSubmit={handleLogin} style={{ ...S.card, width: 340, textAlign: "center" }}>
          <h2 style={{ marginBottom: 20, fontSize: 20 }}>Open Path Admin</h2>
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={S.input} />
          {loginError && <p style={{ color: "#f87171", fontSize: 13, marginBottom: 10 }}>{loginError}</p>}
          <button type="submit" style={{ ...S.btn, width: "100%" }}>Log In</button>
        </form>
      </div>
    );
  }

  const HeaderBar = ({ title }) => (
    <div style={S.header}>
      <div style={S.backRow}>
        {view !== "home" && <button onClick={goBack} style={S.backBtn}>← Back</button>}
        <h1 style={S.title}>{title}</h1>
      </div>
      <button onClick={handleLogout} style={S.logoutBtn}>Log out</button>
    </div>
  );

  const views = {
    home: <HomeView navigate={navigate} H={HeaderBar} />,
    students: <StudentsView navigate={navigate} H={HeaderBar} />,
    studentCourses: <StudentCoursesView navigate={navigate} H={HeaderBar} ctx={ctx} />,
    courseDetail: <CourseDetailView navigate={navigate} H={HeaderBar} ctx={ctx} />,
    courseTopics: <CourseTopicsView H={HeaderBar} ctx={ctx} />,
    coursePrompts: <CoursePromptsView navigate={navigate} H={HeaderBar} ctx={ctx} />,
    courseModifiers: <CourseModifiersView H={HeaderBar} ctx={ctx} />,
    courseActivity: <CourseActivityView H={HeaderBar} ctx={ctx} />,
    prompts: <PromptsHomeView navigate={navigate} H={HeaderBar} />,
    globalPrompts: <GlobalPromptsView navigate={navigate} H={HeaderBar} />,
    frameworkPrompts: <FrameworkPromptsView navigate={navigate} H={HeaderBar} />,
    frameworkDetail: <FrameworkDetailView navigate={navigate} H={HeaderBar} ctx={ctx} />,
    promptDetail: <PromptDetailView H={HeaderBar} ctx={ctx} />,
    activity: <ActivityView H={HeaderBar} />,
  };

  return <div style={S.page}>{views[view] || views.home}</div>;
}

// ── HOME ────────────────────────────────────────────
function HomeView({ navigate, H }) {
  return (
    <>
      <H title="Open Path Admin" />
      <div style={S.tileGrid}>
        <div style={S.tile} onClick={() => navigate("students")}>
          <h3 style={{ fontSize: 18, marginBottom: 8 }}>Students</h3>
          <p style={S.muted}>Manage students & courses</p>
        </div>
        <div style={S.tile} onClick={() => navigate("prompts")}>
          <h3 style={{ fontSize: 18, marginBottom: 8 }}>Prompts</h3>
          <p style={S.muted}>Base prompts & frameworks</p>
        </div>
        <div style={S.tile} onClick={() => navigate("activity")}>
          <h3 style={{ fontSize: 18, marginBottom: 8 }}>Activity</h3>
          <p style={S.muted}>Batch jobs, errors & API usage</p>
        </div>
      </div>
    </>
  );
}

// ── STUDENTS ────────────────────────────────────────
function StudentsView({ navigate, H }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [error, setError] = useState("");

  useEffect(() => { loadStudents(); }, []);
  async function loadStudents() {
    try { const data = await adminFetch("/api/admin/students"); setStudents(data); } catch (e) { setError(e.message); } finally { setLoading(false); }
  }

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await adminFetch("/api/admin/students", { method: "POST", body: JSON.stringify(form) });
      setForm({ name: "", email: "", phone: "" }); setShowForm(false); loadStudents();
    } catch (e) { setError(e.message); }
  }

  return (
    <>
      <H title="Students" />
      <div style={{ marginBottom: 16 }}>
        <button style={S.btn} onClick={() => setShowForm(!showForm)}>{showForm ? "Cancel" : "Add Student"}</button>
      </div>
      {showForm && (
        <form onSubmit={handleCreate} style={{ ...S.card, marginBottom: 16 }}>
          <input placeholder="Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={S.input} required />
          <input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={S.input} />
          <input placeholder="Phone (optional)" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={S.input} />
          <button type="submit" style={S.btn}>Create Student</button>
        </form>
      )}
      {error && <p style={{ color: "#f87171", marginBottom: 12 }}>{error}</p>}
      {loading ? <p style={S.muted}>Loading...</p> : students.map(s => (
        <div key={s.id} style={S.listItem} onClick={() => navigate("studentCourses", { student: s })}>
          <div>
            <div style={{ fontWeight: 500 }}>{s.name}</div>
            <div style={S.muted}>{s.email}</div>
          </div>
          <span style={S.muted}>→</span>
        </div>
      ))}
    </>
  );
}

// ── STUDENT COURSES ─────────────────────────────────
function StudentCoursesView({ navigate, H, ctx }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", framework_type: "" });
  const [frameworks, setFrameworks] = useState([]);
  const [error, setError] = useState("");
  const student = ctx.student;

  useEffect(() => { loadCourses(); loadFrameworks(); }, []);
  async function loadCourses() {
    try { const data = await adminFetch("/api/admin/courses"); setCourses(data.filter(c => c.student_id === student.id)); } catch (e) { setError(e.message); } finally { setLoading(false); }
  }
  async function loadFrameworks() {
    try { const data = await adminFetch("/api/admin/framework-types"); setFrameworks(data.framework_types || []); } catch (e) { /* ignore */ }
  }

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await adminFetch("/api/admin/courses", { method: "POST", body: JSON.stringify({ student_id: student.id, name: form.name, framework_type: form.framework_type || null }) });
      setForm({ name: "", framework_type: "" }); setShowForm(false); loadCourses();
    } catch (e) { setError(e.message); }
  }

  return (
    <>
      <H title={student.name} />
      <div style={{ marginBottom: 16 }}>
        <button style={S.btn} onClick={() => setShowForm(!showForm)}>{showForm ? "Cancel" : "Add Course"}</button>
      </div>
      {showForm && (
        <form onSubmit={handleCreate} style={{ ...S.card, marginBottom: 16 }}>
          <input placeholder="Course name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={S.input} required />
          <select value={form.framework_type} onChange={e => setForm({ ...form, framework_type: e.target.value })} style={S.input}>
            <option value="">No framework</option>
            {frameworks.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          <button type="submit" style={S.btn}>Create Course</button>
        </form>
      )}
      {error && <p style={{ color: "#f87171", marginBottom: 12 }}>{error}</p>}
      {loading ? <p style={S.muted}>Loading...</p> : courses.length === 0 ? <p style={S.muted}>No courses yet.</p> : courses.map(c => (
        <div key={c.id} style={S.listItem} onClick={() => navigate("courseDetail", { course: c })}>
          <div>
            <div style={{ fontWeight: 500 }}>{c.name}</div>
            <div style={S.muted}>{c.framework_type || "No framework"}</div>
          </div>
          <span style={S.muted}>→</span>
        </div>
      ))}
    </>
  );
}

// ── COURSE DETAIL ───────────────────────────────────
function CourseDetailView({ navigate, H, ctx }) {
  const [course, setCourse] = useState(ctx.course);
  const [editing, setEditing] = useState(false);
  const [fw, setFw] = useState(course.framework_type || "");
  const [frameworks, setFrameworks] = useState([]);

  useEffect(() => { loadFrameworks(); }, []);
  async function loadFrameworks() {
    try { const data = await adminFetch("/api/admin/framework-types"); setFrameworks(data.framework_types || []); } catch (e) { /* ignore */ }
  }

  async function saveFw() {
    try {
      await adminFetch(`/api/admin/courses/${course.id}`, { method: "PUT", body: JSON.stringify({ framework_type: fw || null }) });
      setCourse({ ...course, framework_type: fw || null }); setEditing(false);
    } catch (e) { /* ignore */ }
  }

  return (
    <>
      <H title={`${ctx.student?.name || ""} / ${course.name}`} />
      <div style={{ ...S.card, marginBottom: 24 }}>
        <span style={S.label}>Framework</span>
        {editing ? (
          <div style={{ display: "flex", gap: 8 }}>
            <select value={fw} onChange={e => setFw(e.target.value)} style={{ ...S.input, marginBottom: 0, flex: 1 }}>
              <option value="">None</option>
              {frameworks.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
            <button style={S.btn} onClick={saveFw}>Save</button>
            <button style={S.btnGhost} onClick={() => setEditing(false)}>Cancel</button>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span>{course.framework_type || "None"}</span>
            <button style={S.btnGhost} onClick={() => setEditing(true)}>Edit</button>
          </div>
        )}
      </div>
      <div style={S.tileGrid2}>
        <div style={S.tile} onClick={() => navigate("courseTopics", { course })}>
          <h3 style={{ fontSize: 16, marginBottom: 6 }}>Topics</h3>
          <p style={S.muted}>Uploads & generation</p>
        </div>
        <div style={S.tile} onClick={() => navigate("coursePrompts", { course })}>
          <h3 style={{ fontSize: 16, marginBottom: 6 }}>Prompts</h3>
          <p style={S.muted}>What this course uses</p>
        </div>
        <div style={S.tile} onClick={() => navigate("courseModifiers", { course })}>
          <h3 style={{ fontSize: 16, marginBottom: 6 }}>Modifiers</h3>
          <p style={S.muted}>Context & preferences</p>
        </div>
        <div style={S.tile} onClick={() => navigate("courseActivity", { course })}>
          <h3 style={{ fontSize: 16, marginBottom: 6 }}>Activity</h3>
          <p style={S.muted}>Recent generations</p>
        </div>
      </div>
    </>
  );
}

// ── COURSE TOPICS ───────────────────────────────────
function CourseTopicsView({ H, ctx }) {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rerunning, setRerunning] = useState(null);

  useEffect(() => { loadTopics(); }, []);
  async function loadTopics() {
    try { const data = await adminFetch(`/api/admin/courses/${ctx.course.id}/topics`); setTopics(data); } catch (e) { /* ignore */ } finally { setLoading(false); }
  }

  async function handleRerun(topicId) {
    setRerunning(topicId);
    try { await adminFetch(`/api/admin/topics/${topicId}/rerun`, { method: "POST" }); setTimeout(loadTopics, 2000); } catch (e) { /* ignore */ } finally { setRerunning(null); }
  }

  return (
    <>
      <H title={`${ctx.course.name} / Topics`} />
      {loading ? <p style={S.muted}>Loading...</p> : topics.length === 0 ? <p style={S.muted}>No topics yet.</p> : topics.map(t => (
        <div key={t.id} style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontWeight: 500 }}>{t.name}</span>
              {t.week_number != null && <span style={S.muted}> — Week {t.week_number}</span>}
              {t.generation_status && t.generation_status !== "none" && (
                <span style={{ ...S.badge(STATUS_COLORS[t.generation_status] || "#8888aa"), marginLeft: 10 }}>{t.generation_status}</span>
              )}
            </div>
            <button style={S.btnGhost} onClick={() => handleRerun(t.id)} disabled={rerunning === t.id}>
              {rerunning === t.id ? "Starting..." : "Re-run"}
            </button>
          </div>
        </div>
      ))}
    </>
  );
}

// ── COURSE PROMPTS ──────────────────────────────────
function CoursePromptsView({ navigate, H, ctx }) {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const fw = ctx.course?.framework_type;

  const FEATURES = ["learning_asset_generator", "podcast_generator", "visual_overview", "notechart", "walkthrough", "quiz_generator", "exam_analysis"];

  useEffect(() => { loadPrompts(); }, []);
  async function loadPrompts() {
    try { const data = await adminFetch("/api/admin/prompts"); setPrompts(data); } catch (e) { /* ignore */ } finally { setLoading(false); }
  }

  function getPromptForFeature(feature) {
    if (fw) { const fwPrompt = prompts.find(p => p.feature === feature && p.framework_type === fw); if (fwPrompt) return { prompt: fwPrompt, source: `Framework: ${fw}` }; }
    const global = prompts.find(p => p.feature === feature && !p.framework_type);
    return global ? { prompt: global, source: "Global" } : null;
  }

  return (
    <>
      <H title={`${ctx.course.name} / Prompts`} />
      {loading ? <p style={S.muted}>Loading...</p> : FEATURES.map(f => {
        const match = getPromptForFeature(f);
        return (
          <div key={f} style={{ ...S.card, cursor: match ? "pointer" : "default" }} onClick={() => match && navigate("promptDetail", { prompt: match.prompt })}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 500 }}>{f.replace(/_/g, " ")}</span>
              {match ? <span style={{ ...S.badge("#7c3aed") }}>{match.source}</span> : <span style={S.muted}>No prompt</span>}
            </div>
            {match && <p style={{ ...S.muted, marginTop: 6 }}>{match.prompt.content.slice(0, 100)}...</p>}
          </div>
        );
      })}
    </>
  );
}

// ── COURSE MODIFIERS ────────────────────────────────
function CourseModifiersView({ H, ctx }) {
  const [modifiers, setModifiers] = useState([]);
  const [modifierTypes, setModifierTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [addingType, setAddingType] = useState(null);
  const [addContent, setAddContent] = useState("");
  const [addFeature, setAddFeature] = useState("");

  useEffect(() => { loadData(); }, []);
  async function loadData() {
    try {
      const [mods, types] = await Promise.all([
        adminFetch(`/api/admin/modifiers?student_id=${ctx.student.id}&course_id=${ctx.course.id}`),
        adminFetch("/api/admin/modifier-types"),
      ]);
      setModifiers(mods); setModifierTypes(types);
    } catch (e) { /* ignore */ } finally { setLoading(false); }
  }

  async function handleSave(mod) {
    try {
      await adminFetch("/api/admin/modifiers", { method: "POST", body: JSON.stringify({ student_id: ctx.student.id, course_id: ctx.course.id, modifier_type: mod.modifier_type, feature: mod.feature || null, content: editContent }) });
      setEditingId(null); loadData();
    } catch (e) { /* ignore */ }
  }

  async function handleAdd(typeKey) {
    try {
      await adminFetch("/api/admin/modifiers", { method: "POST", body: JSON.stringify({ student_id: ctx.student.id, course_id: ctx.course.id, modifier_type: typeKey, feature: addFeature || null, content: addContent }) });
      setAddingType(null); setAddContent(""); setAddFeature(""); loadData();
    } catch (e) { /* ignore */ }
  }

  async function handleDelete(modId) {
    if (!confirm("Delete this modifier?")) return;
    try { await adminFetch(`/api/admin/modifiers/${modId}`, { method: "DELETE" }); loadData(); } catch (e) { /* ignore */ }
  }

  if (loading) return <><H title={`${ctx.course.name} / Modifiers`} /><p style={S.muted}>Loading...</p></>;

  return (
    <>
      <H title={`${ctx.course.name} / Modifiers`} />
      {modifierTypes.map(mt => {
        const typeMods = modifiers.filter(m => m.modifier_type === mt.key);
        return (
          <div key={mt.key} style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, marginBottom: 4 }}>{mt.label}</h3>
            <p style={{ ...S.muted, marginBottom: 12 }}>{mt.description}</p>
            {typeMods.length === 0 ? (
              <p style={{ ...S.muted, fontStyle: "italic", marginBottom: 8 }}>Empty</p>
            ) : typeMods.map(mod => (
              <div key={mod.id} style={S.card}>
                {mod.feature ? <span style={{ ...S.badge("#7c3aed"), marginBottom: 8, display: "inline-block" }}>{mod.feature}</span> : <span style={{ ...S.muted, marginBottom: 8, display: "inline-block" }}>All features</span>}
                {editingId === mod.id ? (
                  <>
                    <textarea style={S.textarea} value={editContent} onChange={e => setEditContent(e.target.value)} />
                    <div style={{ display: "flex", gap: 8 }}>
                      <button style={S.btn} onClick={() => handleSave(mod)}>Save</button>
                      <button style={S.btnGhost} onClick={() => setEditingId(null)}>Cancel</button>
                    </div>
                  </>
                ) : (
                  <>
                    <pre style={{ whiteSpace: "pre-wrap", fontSize: 13, color: "#e0e0e0", marginBottom: 8 }}>{mod.content}</pre>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button style={S.btnGhost} onClick={() => { setEditingId(mod.id); setEditContent(mod.content); }}>Edit</button>
                      <button style={S.btnDanger} onClick={() => handleDelete(mod.id)}>Delete</button>
                    </div>
                  </>
                )}
              </div>
            ))}
            {addingType === mt.key ? (
              <div style={S.card}>
                <input placeholder="Feature (optional, e.g. podcast_generator)" value={addFeature} onChange={e => setAddFeature(e.target.value)} style={S.input} />
                <textarea placeholder="Content..." value={addContent} onChange={e => setAddContent(e.target.value)} style={S.textarea} />
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={S.btn} onClick={() => handleAdd(mt.key)}>Add</button>
                  <button style={S.btnGhost} onClick={() => setAddingType(null)}>Cancel</button>
                </div>
              </div>
            ) : (
              <button style={S.btnGhost} onClick={() => setAddingType(mt.key)}>+ Add {mt.label}</button>
            )}
          </div>
        );
      })}
    </>
  );
}

// ── COURSE ACTIVITY ─────────────────────────────────
function CourseActivityView({ H, ctx }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadJobs(); }, []);
  async function loadJobs() {
    try {
      const data = await adminFetch("/api/admin/batch-jobs");
      const topics = await adminFetch(`/api/admin/courses/${ctx.course.id}/topics`);
      const topicIds = new Set(topics.map(t => t.id));
      setJobs((data.jobs || []).filter(j => topicIds.has(j.topic_id)));
    } catch (e) { /* ignore */ } finally { setLoading(false); }
  }

  return (
    <>
      <H title={`${ctx.course.name} / Activity`} />
      {loading ? <p style={S.muted}>Loading...</p> : jobs.length === 0 ? <p style={S.muted}>No batch jobs yet.</p> : jobs.map(j => (
        <div key={j.id} style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontWeight: 500 }}>{j.topic_name || "Unknown"}</span>
              <span style={{ ...S.badge(STATUS_COLORS[j.status] || "#8888aa"), marginLeft: 10 }}>{j.status}</span>
            </div>
            <span style={S.muted}>{j.started_at ? new Date(j.started_at).toLocaleString() : ""}</span>
          </div>
          {j.error_log && <p style={{ color: "#f87171", fontSize: 13, marginTop: 8 }}>{j.error_log}</p>}
        </div>
      ))}
    </>
  );
}

// ── PROMPTS HOME ────────────────────────────────────
function PromptsHomeView({ navigate, H }) {
  return (
    <>
      <H title="Prompts" />
      <div style={S.tileGrid2}>
        <div style={S.tile} onClick={() => navigate("globalPrompts")}>
          <h3 style={{ fontSize: 16, marginBottom: 6 }}>Global Prompts</h3>
          <p style={S.muted}>Defaults for all courses</p>
        </div>
        <div style={S.tile} onClick={() => navigate("frameworkPrompts")}>
          <h3 style={{ fontSize: 16, marginBottom: 6 }}>Framework Prompts</h3>
          <p style={S.muted}>Per-framework overrides</p>
        </div>
      </div>
    </>
  );
}

// ── GLOBAL PROMPTS ──────────────────────────────────
function GlobalPromptsView({ navigate, H }) {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadPrompts(); }, []);
  async function loadPrompts() {
    try { const data = await adminFetch("/api/admin/prompts"); setPrompts(data.filter(p => !p.framework_type)); } catch (e) { /* ignore */ } finally { setLoading(false); }
  }

  return (
    <>
      <H title="Global Prompts" />
      {loading ? <p style={S.muted}>Loading...</p> : prompts.map(p => (
        <div key={p.id} style={S.listItem} onClick={() => navigate("promptDetail", { prompt: p })}>
          <div>
            <div style={{ fontWeight: 500 }}>{p.feature.replace(/_/g, " ")}</div>
            <div style={S.muted}>v{p.version} — {p.content.slice(0, 80)}...</div>
          </div>
          <span style={S.muted}>→</span>
        </div>
      ))}
    </>
  );
}

// ── FRAMEWORK PROMPTS ───────────────────────────────
function FrameworkPromptsView({ navigate, H }) {
  const [frameworks, setFrameworks] = useState([]);
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);
  async function loadData() {
    try {
      const [fwData, promptData] = await Promise.all([adminFetch("/api/admin/framework-types"), adminFetch("/api/admin/prompts")]);
      setFrameworks(fwData.framework_types || []);
      setPrompts(promptData.filter(p => p.framework_type));
    } catch (e) { /* ignore */ } finally { setLoading(false); }
  }

  return (
    <>
      <H title="Framework Prompts" />
      {loading ? <p style={S.muted}>Loading...</p> : frameworks.length === 0 ? <p style={S.muted}>No frameworks defined yet.</p> : frameworks.map(fw => {
        const count = prompts.filter(p => p.framework_type === fw).length;
        return (
          <div key={fw} style={S.listItem} onClick={() => navigate("frameworkDetail", { framework: fw })}>
            <div>
              <div style={{ fontWeight: 500 }}>{fw}</div>
              <div style={S.muted}>{count} prompt{count !== 1 ? "s" : ""}</div>
            </div>
            <span style={S.muted}>→</span>
          </div>
        );
      })}
    </>
  );
}

// ── FRAMEWORK DETAIL ────────────────────────────────
function FrameworkDetailView({ navigate, H, ctx }) {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addFeature, setAddFeature] = useState("");
  const [addContent, setAddContent] = useState("");
  const FEATURES = ["learning_asset_generator", "podcast_generator", "visual_overview", "notechart", "walkthrough", "quiz_generator", "exam_analysis"];

  useEffect(() => { loadPrompts(); }, []);
  async function loadPrompts() {
    try { const data = await adminFetch("/api/admin/prompts"); setPrompts(data.filter(p => p.framework_type === ctx.framework)); } catch (e) { /* ignore */ } finally { setLoading(false); }
  }

  async function handleAdd(e) {
    e.preventDefault();
    try {
      await adminFetch("/api/admin/prompts", { method: "POST", body: JSON.stringify({ feature: addFeature, framework_type: ctx.framework, content: addContent }) });
      setShowAdd(false); setAddFeature(""); setAddContent(""); loadPrompts();
    } catch (e) { /* ignore */ }
  }

  const coveredFeatures = new Set(prompts.map(p => p.feature));

  return (
    <>
      <H title={`Framework: ${ctx.framework}`} />
      <div style={{ marginBottom: 16 }}>
        <button style={S.btn} onClick={() => setShowAdd(!showAdd)}>{showAdd ? "Cancel" : "Add Framework Prompt"}</button>
      </div>
      {showAdd && (
        <form onSubmit={handleAdd} style={{ ...S.card, marginBottom: 16 }}>
          <select value={addFeature} onChange={e => setAddFeature(e.target.value)} style={S.input} required>
            <option value="">Select feature...</option>
            {FEATURES.filter(f => !coveredFeatures.has(f)).map(f => <option key={f} value={f}>{f.replace(/_/g, " ")}</option>)}
          </select>
          <textarea placeholder="Prompt content..." value={addContent} onChange={e => setAddContent(e.target.value)} style={S.textarea} required />
          <button type="submit" style={S.btn}>Create</button>
        </form>
      )}
      {FEATURES.map(f => {
        const p = prompts.find(pr => pr.feature === f);
        return (
          <div key={f} style={{ ...S.card, cursor: p ? "pointer" : "default", opacity: p ? 1 : 0.5 }} onClick={() => p && navigate("promptDetail", { prompt: p })}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 500 }}>{f.replace(/_/g, " ")}</span>
              {p ? <span style={S.muted}>v{p.version}</span> : <span style={S.muted}>Using global</span>}
            </div>
            {p && <p style={{ ...S.muted, marginTop: 4 }}>{p.content.slice(0, 80)}...</p>}
          </div>
        );
      })}
    </>
  );
}

// ── PROMPT DETAIL ───────────────────────────────────
function PromptDetailView({ H, ctx }) {
  const [prompt, setPrompt] = useState(ctx.prompt);
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(prompt.content);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function handleSave() {
    try {
      const data = await adminFetch(`/api/admin/prompts/${prompt.id}`, { method: "PUT", body: JSON.stringify({ content }) });
      setPrompt(data); setContent(data.content); setEditing(false);
    } catch (e) { /* ignore */ }
  }

  async function loadHistory() {
    try { const data = await adminFetch(`/api/admin/prompts/${prompt.id}/history`); setHistory(data); setShowHistory(true); } catch (e) { /* ignore */ }
  }

  async function handleRollback(versionId) {
    try {
      await adminFetch(`/api/admin/prompts/${versionId}/rollback`, { method: "POST" });
      const data = await adminFetch(`/api/admin/prompts/${versionId}/history`);
      setHistory(data);
      const active = data.find(p => p.is_active);
      if (active) { setPrompt(active); setContent(active.content); }
    } catch (e) { /* ignore */ }
  }

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const text = await file.text();
      const data = await adminFetch(`/api/admin/prompts/${prompt.id}`, { method: "PUT", body: JSON.stringify({ content: text }) });
      setPrompt(data); setContent(data.content);
    } catch (e) { /* ignore */ } finally { setUploading(false); }
  }

  return (
    <>
      <H title={prompt.feature.replace(/_/g, " ")} />
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <span style={S.badge(prompt.framework_type ? "#7c3aed" : "#4ade80")}>{prompt.framework_type || "Global"}</span>
        <span style={S.muted}>v{prompt.version}</span>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <button style={S.btn} onClick={() => { setEditing(!editing); setContent(prompt.content); }}>{editing ? "Cancel" : "Edit"}</button>
        <label style={{ ...S.btnGhost, display: "inline-flex", alignItems: "center", cursor: "pointer" }}>
          {uploading ? "Uploading..." : "Upload .txt/.md"}
          <input type="file" accept=".txt,.md" onChange={handleUpload} style={{ display: "none" }} />
        </label>
        <button style={S.btnGhost} onClick={loadHistory}>Version History</button>
      </div>
      {editing ? (
        <>
          <textarea style={{ ...S.textarea, minHeight: 300 }} value={content} onChange={e => setContent(e.target.value)} />
          <button style={S.btn} onClick={handleSave}>Save (New Version)</button>
        </>
      ) : (
        <div style={{ ...S.card, maxHeight: 500, overflow: "auto" }}>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 13, lineHeight: 1.6 }}>{prompt.content}</pre>
        </div>
      )}
      {showHistory && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 16, marginBottom: 12 }}>Version History</h3>
          {history.map(v => (
            <div key={v.id} style={{ ...S.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontWeight: 500 }}>v{v.version}</span>
                {v.is_active && <span style={{ ...S.badge("#4ade80"), marginLeft: 8 }}>Active</span>}
                <span style={{ ...S.muted, marginLeft: 10 }}>{new Date(v.created_at).toLocaleString()}</span>
              </div>
              {!v.is_active && <button style={S.btnGhost} onClick={() => handleRollback(v.id)}>Restore</button>}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ── ACTIVITY ────────────────────────────────────────
function ActivityView({ H }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadJobs = useCallback(async () => {
    try { const data = await adminFetch("/api/admin/batch-jobs"); setJobs(data.jobs || []); } catch (e) { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadJobs(); const interval = setInterval(loadJobs, 30000); return () => clearInterval(interval); }, [loadJobs]);

  const failedJobs = jobs.filter(j => j.status === "failed");

  return (
    <>
      <H title="Activity" />

      <h3 style={{ fontSize: 16, marginBottom: 12 }}>Recent Batch Jobs</h3>
      {loading ? <p style={S.muted}>Loading...</p> : jobs.length === 0 ? <p style={S.muted}>No batch jobs yet.</p> : jobs.slice(0, 20).map(j => (
        <div key={j.id} style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontWeight: 500 }}>{j.topic_name || "Unknown"}</span>
              <span style={{ ...S.badge(STATUS_COLORS[j.status] || "#8888aa"), marginLeft: 10 }}>{j.status}</span>
              {j.current_step && <span style={{ ...S.muted, marginLeft: 10 }}>Step: {j.current_step}</span>}
            </div>
            <span style={S.muted}>{j.started_at ? new Date(j.started_at).toLocaleString() : ""}</span>
          </div>
          {j.steps_completed && <p style={{ ...S.muted, marginTop: 4 }}>Steps: {j.steps_completed.length}/8 complete</p>}
        </div>
      ))}

      <h3 style={{ fontSize: 16, marginTop: 32, marginBottom: 12 }}>Errors</h3>
      {failedJobs.length === 0 ? <p style={S.muted}>No errors.</p> : failedJobs.map(j => (
        <div key={j.id} style={{ ...S.card, borderLeft: "3px solid #f87171" }}>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>{j.topic_name || "Unknown"}</div>
          <p style={{ color: "#f87171", fontSize: 13 }}>{j.error_log}</p>
          <p style={S.muted}>{j.started_at ? new Date(j.started_at).toLocaleString() : ""}</p>
        </div>
      ))}

      <h3 style={{ fontSize: 16, marginTop: 32, marginBottom: 12 }}>System</h3>
      <div style={S.card}>
        <p style={S.muted}>Check API usage dashboards directly:</p>
        <ul style={{ listStyle: "none", marginTop: 8 }}>
          <li style={{ marginBottom: 4 }}><a href="https://console.anthropic.com" target="_blank" rel="noreferrer" style={{ color: "#7c3aed" }}>Anthropic Console</a></li>
          <li style={{ marginBottom: 4 }}><a href="https://platform.openai.com/usage" target="_blank" rel="noreferrer" style={{ color: "#7c3aed" }}>OpenAI Usage</a></li>
          <li><a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" style={{ color: "#7c3aed" }}>Google Cloud Console</a></li>
        </ul>
      </div>
    </>
  );
}
