"use client";

import { useState, useEffect } from "react";
import { adminFetch } from "../lib/api";

export default function PromptsTab() {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [newFeature, setNewFeature] = useState("");
  const [newFramework, setNewFramework] = useState("");
  const [newContent, setNewContent] = useState("");
  const [creating, setCreating] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);

  // History state
  const [historyId, setHistoryId] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Global replace
  const [showReplace, setShowReplace] = useState(false);
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [replacing, setReplacing] = useState(false);

  const loadPrompts = async () => {
    try {
      const data = await adminFetch("/api/admin/prompts");
      setPrompts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrompts();
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    setSuccess(null);
    try {
      await adminFetch("/api/admin/prompts", {
        method: "POST",
        body: JSON.stringify({
          feature: newFeature,
          framework_type: newFramework || undefined,
          content: newContent,
        }),
      });
      setSuccess("Prompt created");
      setNewFeature("");
      setNewFramework("");
      setNewContent("");
      setShowCreate(false);
      await loadPrompts();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = async (promptId) => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await adminFetch(`/api/admin/prompts/${promptId}`, {
        method: "PUT",
        body: JSON.stringify({ content: editContent }),
      });
      setSuccess("Prompt updated (new version created)");
      setEditingId(null);
      setEditContent("");
      await loadPrompts();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleViewHistory = async (promptId) => {
    if (historyId === promptId) {
      setHistoryId(null);
      setHistory([]);
      return;
    }
    setLoadingHistory(true);
    setHistoryId(promptId);
    try {
      const data = await adminFetch(`/api/admin/prompts/${promptId}/history`);
      setHistory(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleRollback = async (promptId) => {
    setError(null);
    setSuccess(null);
    try {
      const data = await adminFetch(`/api/admin/prompts/${promptId}/rollback`, {
        method: "POST",
      });
      setSuccess(`Rolled back to version ${data.active_version}`);
      setHistoryId(null);
      setHistory([]);
      await loadPrompts();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGlobalReplace = async () => {
    setReplacing(true);
    setError(null);
    setSuccess(null);
    try {
      const data = await adminFetch("/api/admin/prompts/global-replace", {
        method: "POST",
        body: JSON.stringify({ find: findText, replace: replaceText }),
      });
      setSuccess(`Replaced in ${data.count} prompt(s)`);
      setFindText("");
      setReplaceText("");
      setShowReplace(false);
      await loadPrompts();
    } catch (err) {
      setError(err.message);
    } finally {
      setReplacing(false);
    }
  };

  const buttonStyle = {
    backgroundColor: "var(--btn-normal)",
    color: "#ffffff",
    border: "none",
    borderRadius: "var(--radius)",
    padding: "6px 14px",
    fontFamily: "var(--font-body), 'Inter', sans-serif",
    fontWeight: 500,
    fontSize: "12px",
    cursor: "pointer",
  };

  const smallBtnStyle = {
    background: "none",
    border: "1px solid var(--border-card)",
    borderRadius: "var(--radius)",
    padding: "4px 12px",
    fontSize: "12px",
    color: "var(--text-muted)",
    cursor: "pointer",
    fontFamily: "var(--font-body), 'Inter', sans-serif",
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
          Prompts
        </h2>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={() => setShowReplace(!showReplace)} style={smallBtnStyle}>
            Global Replace
          </button>
          <button
            onClick={() => setShowCreate(!showCreate)}
            style={buttonStyle}
            onMouseOver={(e) => (e.target.style.backgroundColor = "var(--btn-hover)")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "var(--btn-normal)")}
          >
            {showCreate ? "Cancel" : "New Prompt"}
          </button>
        </div>
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

      {showReplace && (
        <div
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border-card)",
            borderRadius: "var(--radius-lg)",
            padding: "24px",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ fontSize: "15px", fontWeight: 500, marginBottom: "16px" }}>
            Global Find & Replace
          </h3>
          <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "4px" }}>Find</label>
              <input
                value={findText}
                onChange={(e) => setFindText(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border-card)", borderRadius: "var(--radius)", fontSize: "14px", fontFamily: "var(--font-body), 'Inter', sans-serif", outline: "none" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "4px" }}>Replace with</label>
              <input
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border-card)", borderRadius: "var(--radius)", fontSize: "14px", fontFamily: "var(--font-body), 'Inter', sans-serif", outline: "none" }}
              />
            </div>
          </div>
          <button onClick={handleGlobalReplace} disabled={replacing || !findText} style={buttonStyle}>
            {replacing ? "Replacing..." : "Replace in All Active Prompts"}
          </button>
        </div>
      )}

      {showCreate && (
        <div
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border-card)",
            borderRadius: "var(--radius-lg)",
            padding: "24px",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "4px" }}>Feature *</label>
              <input
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                placeholder="e.g. walkthrough, podcast, note_chart"
                style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border-card)", borderRadius: "var(--radius)", fontSize: "14px", fontFamily: "var(--font-body), 'Inter', sans-serif", outline: "none" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "4px" }}>Framework Type</label>
              <input
                value={newFramework}
                onChange={(e) => setNewFramework(e.target.value)}
                placeholder="optional"
                style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border-card)", borderRadius: "var(--radius)", fontSize: "14px", fontFamily: "var(--font-body), 'Inter', sans-serif", outline: "none" }}
              />
            </div>
          </div>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "4px" }}>Content *</label>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={10}
              placeholder="Prompt content..."
              style={{ width: "100%", padding: "12px", border: "1px solid var(--border-card)", borderRadius: "var(--radius)", fontSize: "14px", fontFamily: "monospace", outline: "none", resize: "vertical" }}
            />
          </div>
          <button onClick={handleCreate} disabled={creating || !newFeature.trim() || !newContent.trim()} style={buttonStyle}>
            {creating ? "Creating..." : "Create Prompt"}
          </button>
        </div>
      )}

      {loading ? (
        <p style={{ color: "var(--text-muted)" }}>Loading...</p>
      ) : prompts.length === 0 ? (
        <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "40px" }}>
          No prompts yet.
        </p>
      ) : (
        prompts.map((prompt) => (
          <div
            key={prompt.id}
            style={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border-card)",
              borderRadius: "var(--radius-lg)",
              padding: "20px",
              marginBottom: "12px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
              <div>
                <span
                  style={{
                    display: "inline-block",
                    backgroundColor: "#f0ebe0",
                    color: "var(--accent-gold)",
                    fontSize: "12px",
                    fontWeight: 500,
                    padding: "2px 10px",
                    borderRadius: "20px",
                    marginRight: "8px",
                  }}
                >
                  {prompt.feature}
                </span>
                {prompt.framework_type && (
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    {prompt.framework_type}
                  </span>
                )}
                <span style={{ fontSize: "12px", color: "var(--text-muted)", marginLeft: "12px" }}>
                  v{prompt.version}
                </span>
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  onClick={() => handleViewHistory(prompt.id)}
                  style={smallBtnStyle}
                >
                  {historyId === prompt.id ? "Hide History" : "History"}
                </button>
                <button
                  onClick={() => {
                    if (editingId === prompt.id) {
                      setEditingId(null);
                    } else {
                      setEditingId(prompt.id);
                      setEditContent(prompt.content);
                    }
                  }}
                  style={smallBtnStyle}
                >
                  {editingId === prompt.id ? "Cancel" : "Edit"}
                </button>
              </div>
            </div>

            {editingId === prompt.id ? (
              <div>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={12}
                  style={{ width: "100%", padding: "12px", border: "1px solid var(--border-card)", borderRadius: "var(--radius)", fontSize: "14px", fontFamily: "monospace", outline: "none", resize: "vertical", marginBottom: "12px" }}
                />
                <button onClick={() => handleEdit(prompt.id)} disabled={saving} style={buttonStyle}>
                  {saving ? "Saving..." : "Save (New Version)"}
                </button>
              </div>
            ) : (
              <pre
                style={{
                  fontSize: "13px",
                  color: "var(--text-muted)",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  maxHeight: "120px",
                  overflow: "hidden",
                  fontFamily: "monospace",
                  lineHeight: "1.5",
                }}
              >
                {prompt.content}
              </pre>
            )}

            {historyId === prompt.id && (
              <div
                style={{
                  marginTop: "16px",
                  paddingTop: "16px",
                  borderTop: "1px solid var(--border-card)",
                }}
              >
                <h4 style={{ fontSize: "13px", fontWeight: 500, marginBottom: "12px" }}>
                  Version History
                </h4>
                {loadingHistory ? (
                  <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>Loading...</p>
                ) : (
                  history.map((h) => (
                    <div
                      key={h.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px 12px",
                        backgroundColor: h.is_active ? "#f0f7f0" : "transparent",
                        borderRadius: "var(--radius)",
                        marginBottom: "4px",
                      }}
                    >
                      <div>
                        <span style={{ fontSize: "13px", fontWeight: h.is_active ? 500 : 400 }}>
                          v{h.version}
                        </span>
                        {h.is_active && (
                          <span style={{ fontSize: "11px", color: "var(--status-green)", marginLeft: "8px" }}>
                            active
                          </span>
                        )}
                        <span style={{ fontSize: "12px", color: "var(--text-muted)", marginLeft: "12px" }}>
                          {new Date(h.created_at).toLocaleString()}
                        </span>
                      </div>
                      {!h.is_active && (
                        <button onClick={() => handleRollback(h.id)} style={smallBtnStyle}>
                          Restore
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
