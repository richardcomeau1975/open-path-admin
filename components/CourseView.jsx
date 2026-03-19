"use client";

import { useState, useEffect } from "react";
import { adminFetch } from "../lib/api";

export default function CourseView({ course, onBack }) {
  const [topics, setTopics] = useState([]);
  const [modifiers, setModifiers] = useState([]);
  const [modifierTypes, setModifierTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [editingModifier, setEditingModifier] = useState(null);
  const [modifierContent, setModifierContent] = useState("");
  const [savingModifier, setSavingModifier] = useState(false);

  const loadData = async () => {
    try {
      const [t, m, mt] = await Promise.all([
        adminFetch(`/api/admin/courses/${course.id}/topics`),
        adminFetch(`/api/admin/modifiers?course_id=${course.id}&student_id=${course.studentId}`),
        adminFetch("/api/admin/modifier-types"),
      ]);
      setTopics(t);
      setModifiers(m);
      setModifierTypes(mt);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [course.id]);

  const getModifierForType = (type) => modifiers.find((m) => m.modifier_type === type);

  const handleSaveModifier = async (modType) => {
    setSavingModifier(true); setError(null); setSuccess(null);
    try {
      await adminFetch("/api/admin/modifiers", {
        method: "POST",
        body: JSON.stringify({
          student_id: course.studentId,
          course_id: course.id,
          modifier_type: modType,
          content: modifierContent,
        }),
      });
      setSuccess(`Saved ${modType}`);
      setEditingModifier(null);
      setModifierContent("");
      await loadData();
    } catch (err) { setError(err.message); }
    finally { setSavingModifier(false); }
  };

  const handleDeleteModifier = async (modId, modType) => {
    if (!confirm(`Clear ${modType}?`)) return;
    setError(null); setSuccess(null);
    try {
      await adminFetch(`/api/admin/modifiers/${modId}`, { method: "DELETE" });
      setSuccess(`Cleared ${modType}`);
      await loadData();
    } catch (err) { setError(err.message); }
  };

  const statusColor = (status) => {
    if (status === "complete") return "var(--status-green)";
    if (status === "generating") return "var(--status-amber)";
    return "var(--text-muted)";
  };

  const statusLabel = (status) => {
    if (status === "complete") return "Generated";
    if (status === "generating") return "Generating...";
    return "Not started";
  };

  const smallBtnStyle = { background: "none", border: "1px solid var(--border-card)", borderRadius: "var(--radius)", padding: "4px 12px", fontSize: "12px", color: "var(--text-muted)", cursor: "pointer", fontFamily: "var(--font-body), 'Inter', sans-serif" };

  if (loading) return <p style={{ color: "var(--text-muted)" }}>Loading...</p>;

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <p style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>{course.studentName}</p>
        <h2 style={{ fontFamily: "var(--font-display), 'Lora', serif", fontSize: "24px", fontWeight: 600 }}>{course.name}</h2>
        {course.framework_type && <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>Framework: {course.framework_type}</p>}
      </div>

      {success && <p style={{ color: "var(--status-green)", fontSize: "13px", marginBottom: "12px" }}>{success}</p>}
      {error && <p style={{ color: "var(--status-amber)", fontSize: "13px", marginBottom: "12px" }}>{error}</p>}

      {/* TOPICS */}
      <div style={{ marginBottom: "32px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>Topics</h3>
        {topics.length === 0 ? (
          <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-card)", borderRadius: "var(--radius-lg)", padding: "24px", textAlign: "center" }}>
            <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>No topics uploaded yet.</p>
          </div>
        ) : (
          topics.map((topic) => (
            <div key={topic.id} style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-card)", borderRadius: "var(--radius)", padding: "14px 18px", marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: "14px", fontWeight: 500 }}>{topic.name}</span>
                {topic.week_number && <span style={{ fontSize: "12px", color: "var(--text-muted)", marginLeft: "10px" }}>Week {topic.week_number}</span>}
              </div>
              <span style={{ fontSize: "12px", fontWeight: 500, color: statusColor(topic.generation_status) }}>
                {statusLabel(topic.generation_status)}
              </span>
            </div>
          ))
        )}
      </div>

      {/* MODIFIERS */}
      <div style={{ marginBottom: "32px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>Modifiers</h3>
        {modifierTypes.filter((mt) => mt.scope === "course").map((mt) => {
          const existing = getModifierForType(mt.type);
          const isEditing = editingModifier === mt.type;

          return (
            <div key={mt.type} style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-card)", borderRadius: "var(--radius)", padding: "16px 18px", marginBottom: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                <div>
                  <span style={{ fontSize: "14px", fontWeight: 500 }}>{mt.label}</span>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>{mt.description}</p>
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  {existing && !isEditing && (
                    <button onClick={() => handleDeleteModifier(existing.id, mt.label)} style={{ ...smallBtnStyle, color: "var(--status-amber)" }}>Clear</button>
                  )}
                  <button onClick={() => {
                    if (isEditing) { setEditingModifier(null); setModifierContent(""); }
                    else { setEditingModifier(mt.type); setModifierContent(existing?.content || ""); }
                  }} style={smallBtnStyle}>
                    {isEditing ? "Cancel" : existing ? "Edit" : "Configure"}
                  </button>
                </div>
              </div>

              {!isEditing && existing && (
                <pre style={{ fontSize: "13px", color: "var(--text-muted)", whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: "80px", overflow: "hidden", fontFamily: "monospace", lineHeight: "1.5" }}>
                  {existing.content}
                </pre>
              )}
              {!isEditing && !existing && (
                <p style={{ fontSize: "13px", color: "var(--text-muted)", fontStyle: "italic" }}>Not configured</p>
              )}

              {isEditing && (
                <div style={{ marginTop: "8px" }}>
                  <textarea value={modifierContent} onChange={(e) => setModifierContent(e.target.value)} rows={6}
                    style={{ width: "100%", padding: "12px", border: "1px solid var(--border-card)", borderRadius: "var(--radius)", fontSize: "14px", fontFamily: "monospace", outline: "none", resize: "vertical" }} />
                  <button onClick={() => handleSaveModifier(mt.type)} disabled={savingModifier || !modifierContent.trim()}
                    style={{ marginTop: "8px", backgroundColor: "var(--btn-normal)", color: "#ffffff", border: "none", borderRadius: "var(--radius)", padding: "6px 16px", fontSize: "13px", fontFamily: "var(--font-body), 'Inter', sans-serif", fontWeight: 500, cursor: savingModifier ? "not-allowed" : "pointer" }}>
                    {savingModifier ? "Saving..." : "Save"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ACTIVITY LOG placeholder */}
      <div>
        <h3 style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>Activity</h3>
        <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-card)", borderRadius: "var(--radius-lg)", padding: "24px", textAlign: "center" }}>
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Activity log will appear here once generation pipeline is active.</p>
        </div>
      </div>
    </div>
  );
}
