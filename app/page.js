"use client";

import { useState, useEffect } from "react";
import { adminFetch, getToken, setToken, clearToken } from "../lib/api";

// ── Display names ──
const DISPLAY_NAMES = {
  learning_asset_generator: "Learning Asset Generator",
  podcast_generator: "Podcast Script",
  visual_overview: "Topic Introduction",
  notechart: "Active Recall",
  walkthrough_tutor: "Office Hours",
  quiz_generator: "Exam-Style Questions",
  exam_analyzer: "Exam Analyzer",
  exit_ticket: "Exit Ticket",
};

function displayName(key) {
  return DISPLAY_NAMES[key] || key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Styles ──
const card = { background: "#fff", border: "1px solid #E8E4DA", borderRadius: 12, padding: "1rem 1.25rem", marginBottom: 10 };
const sectionLabel = { fontFamily: "Lora, serif", fontSize: 16, fontWeight: 500, color: "#8B6914", marginBottom: 16, display: "block" };
const muted = { color: "#6B6B6B", fontSize: 14 };
const btn = { background: "#9B8E82", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 14, fontWeight: 500, cursor: "pointer" };
const btnGold = { ...btn, background: "#8B6914" };
const btnOutline = { background: "transparent", border: "1px solid #E8E4DA", color: "#1a1a1a", borderRadius: 8, padding: "6px 14px", fontSize: 13, cursor: "pointer" };
const btnDanger = { ...btnOutline, color: "#c0392b", borderColor: "#c0392b" };
const input = { width: "100%", padding: "10px 12px", border: "1px solid #E8E4DA", borderRadius: 8, fontSize: 14, marginBottom: 10, outline: "none", fontFamily: "Inter, sans-serif" };
const badge = (bg) => ({ display: "inline-block", padding: "2px 10px", borderRadius: 12, fontSize: 12, fontWeight: 500, color: "#fff", background: bg });
const backLink = { background: "none", border: "none", color: "#6B6B6B", cursor: "pointer", fontSize: 14, marginBottom: 20, display: "block" };
const headerRow = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 };

// ══════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════

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
    else if (tab === "prompts") setCurrentView({ type: "prompts_list" });
    else if (tab === "usage") setCurrentView({ type: "usage_dashboard" });
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

  if (!loggedIn) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#fdfbf7" }}>
        <form onSubmit={handleLogin} style={{ background: "#fff", border: "1px solid #E8E4DA", borderRadius: 12, padding: "2rem", width: 360, textAlign: "center" }}>
          <h2 style={{ fontFamily: "Lora, serif", fontSize: 22, marginBottom: 20, color: "#1a1a1a" }}>Open Path Admin</h2>
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={input} />
          {loginError && <p style={{ color: "#c0392b", fontSize: 13, marginBottom: 10 }}>{loginError}</p>}
          <button type="submit" style={{ ...btn, width: "100%" }}>Log In</button>
        </form>
      </div>
    );
  }

  const TABS = ["students", "prompts", "usage"];

  return (
    <div style={{ minHeight: "100vh", background: "#fdfbf7" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 32px", borderBottom: "1px solid #E8E4DA" }}>
        <span style={{ fontFamily: "Lora, serif", fontSize: 22, fontWeight: 600, color: "#1a1a1a" }}>Open Path Admin</span>
        <button onClick={() => { clearToken(); setLoggedIn(false); }} style={{ background: "none", border: "none", color: "#6B6B6B", cursor: "pointer", fontSize: 14 }}>Log out</button>
      </div>
      <div style={{ display: "flex", gap: 32, padding: "0 32px", borderBottom: "1px solid #E8E4DA" }}>
        {TABS.map(tab => (
          <button key={tab} onClick={() => switchTab(tab)} style={{
            background: "none", border: "none", borderBottom: activeTab === tab ? "2px solid #8B6914" : "2px solid transparent",
            padding: "12px 0", color: activeTab === tab ? "#8B6914" : "#6B6B6B", fontSize: 15, fontWeight: 500,
            cursor: "pointer", textTransform: "capitalize",
          }}>{tab}</button>
        ))}
      </div>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 24px" }}>
        {activeTab === "students" && <StudentsRouter view={currentView} navigate={navigate} goBack={goBack} />}
        {activeTab === "prompts" && <PromptsRouter view={currentView} navigate={navigate} goBack={goBack} />}
        {activeTab === "usage" && <UsageDashboard navigate={(v) => { setActiveTab("students"); navigate(v); }} />}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// STUDENTS TAB
// ══════════════════════════════════════════════════════

function StudentsRouter({ view, navigate, goBack }) {
  switch (view.type) {
    case "student_list": return <StudentList navigate={navigate} />;
    case "student_detail": return <StudentDetail student={view.student} navigate={navigate} goBack={goBack} />;
    case "course_manage": return <CourseManagement student={view.student} course={view.course} goBack={goBack} />;
    default: return <StudentList navigate={navigate} />;
  }
}

// ── Student List ──

function StudentList({ navigate }) {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", courseName: "", framework: "" });
  const [frameworks, setFrameworks] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const [sData, cData, fwData] = await Promise.all([
        adminFetch("/api/admin/students"),
        adminFetch("/api/admin/courses"),
        adminFetch("/api/admin/framework-types"),
      ]);
      setStudents(sData);
      setCourses(cData);
      setFrameworks(fwData.framework_types || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError(""); setSuccess(null);
    try {
      const student = await adminFetch("/api/admin/students", {
        method: "POST",
        body: JSON.stringify({ name: form.name, email: form.email }),
      });

      let courseName = null;
      if (form.courseName.trim()) {
        await adminFetch("/api/admin/courses", {
          method: "POST",
          body: JSON.stringify({
            student_id: student.id,
            name: form.courseName,
            framework_type: form.framework || null,
          }),
        });
        courseName = form.courseName;
      }

      setSuccess({
        name: form.name,
        email: form.email,
        course: courseName,
        framework: form.framework,
      });
      setForm({ name: "", email: "", courseName: "", framework: "" });
      setShowForm(false);
      load();
    } catch (e) { setError(e.message); }
  }

  function courseCount(studentId) {
    return courses.filter(c => c.student_id === studentId).length;
  }

  if (loading) return <p style={muted}>Loading...</p>;

  return (
    <>
      <div style={headerRow}>
        <span style={sectionLabel}>Students</span>
        <button style={btnGold} onClick={() => { setShowForm(!showForm); setSuccess(null); }}>
          {showForm ? "Cancel" : "+ New Student"}
        </button>
      </div>

      {success && (
        <div style={{ ...card, borderLeft: "3px solid #4A7C59", marginBottom: 20 }}>
          <div style={{ fontWeight: 500, marginBottom: 8 }}>✓ {success.name} added</div>
          <div style={muted}>Login: {success.email}</div>
          {success.course && (
            <div style={muted}>Course: {success.course}{success.framework ? ` (${displayName(success.framework)})` : ""}</div>
          )}
          <div style={{ ...muted, marginTop: 8 }}>
            Share this link: <strong>https://open-path-student.vercel.app</strong>
          </div>
          <div style={{ ...muted, fontSize: 12 }}>They'll sign in with their email and receive a verification code.</div>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} style={{ ...card, marginBottom: 20 }}>
          <input placeholder="Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={input} required />
          <input placeholder="Email *" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={input} required />

          <div style={{ fontSize: 13, color: "#6B6B6B", marginTop: 8, marginBottom: 8 }}>Add a course now? (optional)</div>
          <input placeholder="Course name" value={form.courseName} onChange={e => setForm({ ...form, courseName: e.target.value })} style={input} />
          {form.courseName && (
            <select value={form.framework} onChange={e => setForm({ ...form, framework: e.target.value })} style={input}>
              <option value="">Select framework (optional)</option>
              {frameworks.map(f => <option key={f} value={f}>{displayName(f)}</option>)}
            </select>
          )}

          {error && <p style={{ color: "#c0392b", fontSize: 13, marginBottom: 10 }}>{error}</p>}
          <button type="submit" style={btnGold}>Create Student</button>
        </form>
      )}

      {students.length === 0 ? (
        <p style={muted}>No students yet. Click "+ New Student" to get started.</p>
      ) : (
        students.map(s => (
          <div key={s.id} style={{ ...card, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
            onClick={() => navigate({ type: "student_detail", student: s })}>
            <div>
              <span style={{ fontWeight: 500, fontSize: 15 }}>{s.name}</span>
              <span style={{ ...muted, marginLeft: 12 }}>{s.email}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={muted}>{courseCount(s.id)} course{courseCount(s.id) !== 1 ? "s" : ""}</span>
              <span style={muted}>→</span>
            </div>
          </div>
        ))
      )}
    </>
  );
}

// ── Student Detail ──

function StudentDetail({ student, navigate, goBack }) {
  const [courses, setCourses] = useState([]);
  const [frameworks, setFrameworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", framework: "" });
  const [error, setError] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const [cData, fwData] = await Promise.all([
        adminFetch("/api/admin/courses"),
        adminFetch("/api/admin/framework-types"),
      ]);
      setCourses(cData.filter(c => c.student_id === student.id));
      setFrameworks(fwData.framework_types || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    try {
      await adminFetch("/api/admin/courses", {
        method: "POST",
        body: JSON.stringify({ student_id: student.id, name: form.name, framework_type: form.framework || null }),
      });
      setForm({ name: "", framework: "" });
      setShowForm(false);
      load();
    } catch (e) { setError(e.message); }
  }

  async function handleFrameworkChange(courseId, newFw) {
    try {
      await adminFetch(`/api/admin/courses/${courseId}`, {
        method: "PUT",
        body: JSON.stringify({ framework_type: newFw || null }),
      });
      load();
    } catch (e) { /* ignore */ }
  }

  if (loading) return <><button style={backLink} onClick={goBack}>← Students</button><p style={muted}>Loading...</p></>;

  return (
    <>
      <button style={backLink} onClick={goBack}>← Students</button>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: "Lora, serif", fontSize: 22, fontWeight: 600, marginBottom: 4 }}>{student.name}</h2>
        <span style={muted}>{student.email}</span>
      </div>

      <div style={headerRow}>
        <span style={sectionLabel}>Courses</span>
        <button style={btnGold} onClick={() => setShowForm(!showForm)}>{showForm ? "Cancel" : "+ Add Course"}</button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} style={{ ...card, marginBottom: 16 }}>
          <input placeholder="Course name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={input} required />
          <select value={form.framework} onChange={e => setForm({ ...form, framework: e.target.value })} style={input}>
            <option value="">Select framework (optional)</option>
            {frameworks.map(f => <option key={f} value={f}>{displayName(f)}</option>)}
          </select>
          {error && <p style={{ color: "#c0392b", fontSize: 13, marginBottom: 10 }}>{error}</p>}
          <button type="submit" style={btnGold}>Create Course</button>
        </form>
      )}

      {courses.length === 0 ? (
        <p style={muted}>No courses yet.</p>
      ) : (
        courses.map(c => (
          <div key={c.id} style={{ ...card, cursor: "pointer" }}
            onClick={() => navigate({ type: "course_manage", student, course: c })}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 500, fontSize: 15 }}>{c.name}</span>
              <span style={muted}>→</span>
            </div>
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}
              onClick={e => e.stopPropagation()}>
              <span style={{ fontSize: 12, color: "#6B6B6B" }}>Framework:</span>
              <select
                value={c.framework_type || ""}
                onChange={e => handleFrameworkChange(c.id, e.target.value)}
                style={{ padding: "4px 8px", border: "1px solid #E8E4DA", borderRadius: 6, fontSize: 13, outline: "none", background: "#fff" }}>
                <option value="">None</option>
                {frameworks.map(f => <option key={f} value={f}>{displayName(f)}</option>)}
              </select>
            </div>
          </div>
        ))
      )}
    </>
  );
}

// ── Course Management ──

function CourseManagement({ student, course: initialCourse, goBack }) {
  const [course, setCourse] = useState(initialCourse);
  const [topics, setTopics] = useState([]);
  const [prompts, setPrompts] = useState([]);
  const [modifiers, setModifiers] = useState([]);
  const [modifierTypes, setModifierTypes] = useState([]);
  const [frameworks, setFrameworks] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingMod, setEditingMod] = useState(null);
  const [modContent, setModContent] = useState("");
  const [overrideFeature, setOverrideFeature] = useState(null);
  const [overrideContent, setOverrideContent] = useState("");
  const [activeSection, setActiveSection] = useState("topics");

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const [tData, pData, mData, mtData, fwData] = await Promise.all([
        adminFetch(`/api/admin/courses/${course.id}/topics`),
        adminFetch("/api/admin/prompts"),
        adminFetch(`/api/admin/modifiers?course_id=${course.id}`),
        adminFetch("/api/admin/modifier-types"),
        adminFetch("/api/admin/framework-types"),
      ]);
      setTopics(tData);
      setPrompts(pData);
      setModifiers(mData);
      setModifierTypes(mtData);
      setFrameworks(fwData.framework_types || []);

      // Load usage timeline
      try {
        const usage = await adminFetch(`/api/admin/students/${student.id}/usage`);
        setTimeline(usage.timeline || []);
      } catch (e) { /* usage endpoint may not exist yet */ }
    } catch (e) { /* ignore */ }
    finally { setLoading(false); }
  }

  async function handleFrameworkChange(val) {
    try {
      await adminFetch(`/api/admin/courses/${course.id}`, {
        method: "PUT",
        body: JSON.stringify({ framework_type: val || null }),
      });
      setCourse({ ...course, framework_type: val || null });
    } catch (e) { /* ignore */ }
  }

  // Prompt override helpers
  const ALL_FEATURES = ["learning_asset_generator", "podcast_generator", "visual_overview", "notechart", "walkthrough_tutor", "quiz_generator", "exam_analyzer", "exit_ticket"];

  function getPromptOverride(feature) {
    // Check for course-level modifier of type "system_modifier" for this feature
    return modifiers.find(m => m.modifier_type === "system_modifier" && m.feature === feature);
  }

  function getGlobalPrompt(feature) {
    const fw = course.framework_type;
    if (fw) {
      const fwPrompt = prompts.find(p => p.feature === feature && p.framework_type === fw && p.is_active);
      if (fwPrompt) return { prompt: fwPrompt, source: `Framework (${displayName(fw)})` };
    }
    const global = prompts.find(p => p.feature === feature && !p.framework_type && p.is_active);
    return global ? { prompt: global, source: "Global" } : null;
  }

  async function saveOverride(feature) {
    try {
      const existing = getPromptOverride(feature);
      if (existing) {
        // Update
        await adminFetch(`/api/admin/modifiers/${existing.id}`, { method: "DELETE" });
      }
      if (overrideContent.trim()) {
        await adminFetch("/api/admin/modifiers", {
          method: "POST",
          body: JSON.stringify({
            student_id: student.id,
            course_id: course.id,
            modifier_type: "system_modifier",
            feature: feature,
            content: overrideContent,
          }),
        });
      }
      setOverrideFeature(null);
      setOverrideContent("");
      load();
    } catch (e) { /* ignore */ }
  }

  async function revertOverride(feature) {
    const existing = getPromptOverride(feature);
    if (existing) {
      try {
        await adminFetch(`/api/admin/modifiers/${existing.id}`, { method: "DELETE" });
        load();
      } catch (e) { /* ignore */ }
    }
  }

  // Modifier helpers
  async function saveMod(typeKey) {
    try {
      const existing = modifiers.find(m => m.modifier_type === typeKey);
      if (existing) {
        await adminFetch(`/api/admin/modifiers/${existing.id}`, { method: "DELETE" });
      }
      if (modContent.trim()) {
        await adminFetch("/api/admin/modifiers", {
          method: "POST",
          body: JSON.stringify({
            student_id: student.id,
            course_id: course.id,
            modifier_type: typeKey,
            content: modContent,
          }),
        });
      }
      setEditingMod(null);
      setModContent("");
      load();
    } catch (e) { /* ignore */ }
  }

  const SECTIONS = ["topics", "prompts", "modifiers", "activity"];

  if (loading) return <><button style={backLink} onClick={goBack}>← {student.name}</button><p style={muted}>Loading...</p></>;

  return (
    <>
      <button style={backLink} onClick={goBack}>← {student.name}</button>

      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: "Lora, serif", fontSize: 22, fontWeight: 600, marginBottom: 8 }}>{course.name}</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, color: "#6B6B6B" }}>Framework:</span>
          <select
            value={course.framework_type || ""}
            onChange={e => handleFrameworkChange(e.target.value)}
            style={{ padding: "4px 8px", border: "1px solid #E8E4DA", borderRadius: 6, fontSize: 13, outline: "none", background: "#fff" }}>
            <option value="">None</option>
            {frameworks.map(f => <option key={f} value={f}>{displayName(f)}</option>)}
          </select>
        </div>
      </div>

      {/* Section tabs */}
      <div style={{ display: "flex", gap: 24, marginBottom: 24, borderBottom: "1px solid #E8E4DA" }}>
        {SECTIONS.map(s => (
          <button key={s} onClick={() => setActiveSection(s)} style={{
            background: "none", border: "none", padding: "8px 0",
            borderBottom: activeSection === s ? "2px solid #8B6914" : "2px solid transparent",
            color: activeSection === s ? "#8B6914" : "#6B6B6B",
            fontSize: 14, fontWeight: 500, cursor: "pointer", textTransform: "capitalize",
          }}>{s}</button>
        ))}
      </div>

      {/* ── Topics ── */}
      {activeSection === "topics" && (
        <div>
          {topics.length === 0 ? (
            <p style={muted}>No topics yet. Students upload materials through the student app.</p>
          ) : (
            topics.map(t => (
              <div key={t.id} style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontWeight: 500, fontSize: 14 }}>{t.name}</span>
                  {t.week_number && <span style={{ ...muted, marginLeft: 8 }}>Week {t.week_number}</span>}
                </div>
                <span style={badge(
                  t.generation_status === "completed" ? "#4A7C59" :
                  t.generation_status === "generating" ? "#C4972A" :
                  t.generation_status === "failed" ? "#c0392b" : "#aaa"
                )}>
                  {t.generation_status === "completed" ? "Generated" :
                   t.generation_status === "generating" ? "Generating..." :
                   t.generation_status === "failed" ? "Failed" : "Pending"}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Prompt Overrides ── */}
      {activeSection === "prompts" && (
        <div>
          {ALL_FEATURES.map(feature => {
            const override = getPromptOverride(feature);
            const global = getGlobalPrompt(feature);
            const isEditing = overrideFeature === feature;

            return (
              <div key={feature} style={{ ...card }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 500, fontSize: 14 }}>{displayName(feature)}</span>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {override ? (
                      <>
                        <span style={badge("#8B6914")}>Custom override</span>
                        <button style={btnOutline} onClick={() => { setOverrideFeature(feature); setOverrideContent(override.content); }}>Edit</button>
                        <button style={btnDanger} onClick={() => revertOverride(feature)}>Revert</button>
                      </>
                    ) : (
                      <>
                        <span style={{ ...muted, fontSize: 12 }}>
                          {global ? `Using ${global.source}` : "No prompt"}
                        </span>
                        <button style={btnOutline} onClick={() => {
                          setOverrideFeature(feature);
                          setOverrideContent(global?.prompt?.content || "");
                        }}>Override</button>
                      </>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div style={{ marginTop: 12 }}>
                    <textarea
                      value={overrideContent}
                      onChange={e => setOverrideContent(e.target.value)}
                      rows={12}
                      style={{ width: "100%", padding: "10px 12px", border: "1px solid #E8E4DA", borderRadius: 8, fontSize: 13, resize: "vertical", outline: "none", fontFamily: "monospace", lineHeight: 1.5 }}
                    />
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <button style={btnGold} onClick={() => saveOverride(feature)}>Save Override</button>
                      <button style={btnOutline} onClick={() => { setOverrideFeature(null); setOverrideContent(""); }}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modifiers ── */}
      {activeSection === "modifiers" && (
        <div>
          {["course_info", "personalization"].map(typeKey => {
            const mod = modifiers.find(m => m.modifier_type === typeKey);
            const isEditing = editingMod === typeKey;
            const label = typeKey === "course_info" ? "Course Info" : "Personalization";
            const placeholder = typeKey === "course_info"
              ? "Describe what this course is about, how it's structured, what the student needs to be able to do..."
              : "Describe this student's learning profile, strengths, areas to push on...";

            return (
              <div key={typeKey} style={{ ...card, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontWeight: 500, fontSize: 14 }}>{label}</span>
                  <span style={{ fontSize: 12, color: mod ? "#4A7C59" : "#6B6B6B" }}>{mod ? "Active" : "Empty"}</span>
                </div>

                {!isEditing && mod && (
                  <div style={{ fontSize: 13, color: "#4a4a4a", lineHeight: 1.5, marginBottom: 8, maxHeight: 100, overflow: "hidden" }}>
                    {mod.content.slice(0, 200)}{mod.content.length > 200 ? "..." : ""}
                  </div>
                )}

                {isEditing ? (
                  <div>
                    <textarea
                      value={modContent}
                      onChange={e => setModContent(e.target.value)}
                      placeholder={placeholder}
                      rows={6}
                      style={{ width: "100%", padding: "10px 12px", border: "1px solid #E8E4DA", borderRadius: 8, fontSize: 14, resize: "vertical", outline: "none", lineHeight: 1.5 }}
                    />
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <button style={btnGold} onClick={() => saveMod(typeKey)}>Save</button>
                      <button style={btnOutline} onClick={() => setEditingMod(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button style={btnOutline} onClick={() => { setEditingMod(typeKey); setModContent(mod?.content || ""); }}>
                    {mod ? "Edit" : "Add"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Activity ── */}
      {activeSection === "activity" && (
        <div>
          {timeline.length === 0 ? (
            <p style={muted}>No activity yet.</p>
          ) : (
            timeline.slice(0, 30).map((item, i) => {
              const date = new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
              const time = new Date(item.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

              if (item.type === "session") {
                return (
                  <div key={i} style={{ ...card, borderLeft: "3px solid #8B6914" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: 500, fontSize: 14 }}>Office Hours — {item.topic}</span>
                      <span style={muted}>{date} {time}</span>
                    </div>
                    <div style={{ ...muted, marginTop: 4 }}>
                      {item.messages} messages · {item.mode || "walkthrough"}
                    </div>
                  </div>
                );
              }

              if (item.type === "exit_ticket") {
                return (
                  <div key={i} style={{ ...card, borderLeft: `3px solid ${item.status === "pass" ? "#4A7C59" : "#C4972A"}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: 500, fontSize: 14 }}>
                        Exit Ticket — {item.topic}, Segment {item.segment}
                      </span>
                      <span style={muted}>{date} {time}</span>
                    </div>
                    <div style={{ marginTop: 4 }}>
                      <span style={badge(item.status === "pass" ? "#4A7C59" : "#C4972A")}>
                        {item.status === "pass" ? "Pass" : "Incomplete"}
                      </span>
                    </div>
                    {item.status === "incomplete" && item.evaluation?.not_there_yet && (
                      <div style={{ ...muted, marginTop: 8, fontSize: 13 }}>
                        Missing: {item.evaluation.not_there_yet.slice(0, 150)}...
                      </div>
                    )}
                  </div>
                );
              }

              return null;
            })
          )}
        </div>
      )}
    </>
  );
}

// ══════════════════════════════════════════════════════
// PROMPTS TAB
// ══════════════════════════════════════════════════════

function PromptsRouter({ view, navigate, goBack }) {
  switch (view.type) {
    case "prompts_list": return <PromptsList navigate={navigate} />;
    case "prompt_edit": return <PromptEdit prompt={view.prompt} goBack={goBack} />;
    default: return <PromptsList navigate={navigate} />;
  }
}

function PromptsList({ navigate }) {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);
  async function load() {
    try {
      const data = await adminFetch("/api/admin/prompts");
      // Show only active, global (no framework_type) prompts
      setPrompts(data.filter(p => p.is_active && !p.framework_type));
    } catch (e) { /* ignore */ }
    finally { setLoading(false); }
  }

  if (loading) return <p style={muted}>Loading...</p>;

  return (
    <>
      <span style={sectionLabel}>Global Prompts</span>
      <p style={{ ...muted, marginBottom: 20, marginTop: -8 }}>
        These are the default prompts used by every course unless overridden.
      </p>
      {prompts.map(p => (
        <div key={p.id} style={{ ...card, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
          onClick={() => navigate({ type: "prompt_edit", prompt: p })}>
          <div>
            <span style={{ fontWeight: 500, fontSize: 14 }}>{displayName(p.feature)}</span>
            <span style={{ ...muted, marginLeft: 12 }}>v{p.version}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={muted}>{(p.content || "").length.toLocaleString()} chars</span>
            <span style={muted}>→</span>
          </div>
        </div>
      ))}
    </>
  );
}

function PromptEdit({ prompt: initialPrompt, goBack }) {
  const [content, setContent] = useState(initialPrompt.content || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await adminFetch(`/api/admin/prompts/${initialPrompt.id}`, {
        method: "PUT",
        body: JSON.stringify({ content }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) { /* ignore */ }
    finally { setSaving(false); }
  }

  return (
    <>
      <button style={backLink} onClick={goBack}>← Global Prompts</button>
      <div style={headerRow}>
        <span style={sectionLabel}>{displayName(initialPrompt.feature)}</span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {saved && <span style={{ color: "#4A7C59", fontSize: 13 }}>✓ Saved</span>}
          <button style={btnGold} onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        style={{
          width: "100%", minHeight: 500, padding: "16px", border: "1px solid #E8E4DA",
          borderRadius: 8, fontSize: 13, fontFamily: "monospace", lineHeight: 1.6,
          outline: "none", resize: "vertical", background: "#fff",
        }}
      />
      <div style={{ ...muted, marginTop: 8 }}>
        {content.length.toLocaleString()} characters · v{initialPrompt.version}
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════
// USAGE TAB
// ══════════════════════════════════════════════════════

function UsageDashboard({ navigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);
  async function load() {
    try {
      const result = await adminFetch("/api/admin/usage");
      setData(result);
    } catch (e) { /* ignore */ }
    finally { setLoading(false); }
  }

  if (loading) return <p style={muted}>Loading...</p>;
  if (!data) return <p style={muted}>Usage data unavailable.</p>;

  const { stats, student_activity } = data;

  return (
    <>
      <span style={sectionLabel}>Usage Overview</span>

      {/* Stats cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
        <div style={{ ...card, textAlign: "center", padding: "1.5rem" }}>
          <div style={{ fontSize: 32, fontWeight: 600, fontFamily: "Lora, serif", color: "#1a1a1a" }}>{stats.active_students}</div>
          <div style={muted}>Active Students (30d)</div>
        </div>
        <div style={{ ...card, textAlign: "center", padding: "1.5rem" }}>
          <div style={{ fontSize: 32, fontWeight: 600, fontFamily: "Lora, serif", color: "#1a1a1a" }}>{stats.total_sessions}</div>
          <div style={muted}>Office Hours Sessions</div>
        </div>
        <div style={{ ...card, textAlign: "center", padding: "1.5rem" }}>
          <div style={{ fontSize: 32, fontWeight: 600, fontFamily: "Lora, serif", color: "#8B6914" }}>{stats.exit_ticket_pass_rate}%</div>
          <div style={muted}>Exit Ticket Pass Rate</div>
        </div>
      </div>

      {/* Student activity table */}
      <span style={sectionLabel}>Student Activity</span>
      {student_activity.length === 0 ? (
        <p style={muted}>No activity yet.</p>
      ) : (
        student_activity.map(s => {
          const lastActive = new Date(s.last_active);
          const now = new Date();
          const diffHours = Math.round((now - lastActive) / (1000 * 60 * 60));
          const timeAgo = diffHours < 1 ? "just now" :
            diffHours < 24 ? `${diffHours}h ago` :
            `${Math.round(diffHours / 24)}d ago`;

          return (
            <div key={s.student_id} style={{ ...card, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
              onClick={() => navigate({ type: "student_detail", student: { id: s.student_id, name: s.name, email: s.email } })}>
              <div>
                <span style={{ fontWeight: 500, fontSize: 15 }}>{s.name}</span>
                <span style={{ ...muted, marginLeft: 12 }}>{s.email}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span style={muted}>{s.sessions} session{s.sessions !== 1 ? "s" : ""}</span>
                <span style={muted}>Last active: {timeAgo}</span>
              </div>
            </div>
          );
        })
      )}
    </>
  );
}
