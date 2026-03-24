// FILE: app/test/page.js
// Drop this file into open-path-admin/app/test/page.js
// Access at: https://your-admin-url.vercel.app/test

"use client";
import { useState, useEffect, useCallback } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "";

function api(path, opts = {}) {
  const token = typeof window !== "undefined" ? sessionStorage.getItem("admin_token") : null;
  return fetch(`${API}${path}`, {
    ...opts,
    headers: {
      ...(opts.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  }).then(async (r) => {
    if (!r.ok) {
      const text = await r.text();
      throw new Error(`${r.status}: ${text}`);
    }
    return r.json();
  });
}

// ── Pipeline dependency info ────────────────────────────────────

const OUTPUTS = [
  { key: "learning_asset", label: "Learning Asset", accept: ".txt,.md,.yaml,.yml", group: "source" },
  { key: "podcast_script", label: "Podcast Script", accept: ".txt,.md", group: "scripts" },
  { key: "notechart", label: "Note Chart", accept: ".json,.txt,.md", group: "scripts" },
  { key: "visual_overview_script", label: "Visual Overview Script", accept: ".json,.txt,.md", group: "scripts" },
  { key: "visual_overview_images", label: "Visual Overview Images", accept: "image/*", multiple: true, group: "media" },
  { key: "podcast_audio", label: "Podcast Audio", accept: ".mp3,.wav", group: "media" },
  { key: "narration_audio", label: "Narration Audio", accept: ".mp3,.wav", multiple: true, group: "media" },
];

const STEP_MAP = {
  learning_asset: "generate_learning_asset",
  podcast_script: "generate_podcast_script",
  notechart: "generate_notechart",
  visual_overview_script: "generate_visual_overview_script",
  visual_overview_images: "generate_images",
  podcast_audio: "generate_podcast_audio",
  narration_audio: "generate_narration_audio",
};

// ── Styles ──────────────────────────────────────────────────────

const styles = {
  page: { maxWidth: 900, margin: "0 auto", padding: "2rem 1.5rem", fontFamily: "Inter, sans-serif" },
  h1: { fontFamily: "Lora, serif", fontSize: 24, fontWeight: 600, marginBottom: 8 },
  h2: { fontFamily: "Lora, serif", fontSize: 18, fontWeight: 500, marginBottom: 12 },
  subtitle: { color: "#6B6B6B", fontSize: 14, marginBottom: 24 },
  card: { background: "#fff", border: "1px solid #E8E4DA", borderRadius: 12, padding: 20, marginBottom: 12 },
  label: { fontSize: 12, fontWeight: 500, color: "#6B6B6B", textTransform: "uppercase", letterSpacing: "0.04em" },
  badge: (exists) => ({
    display: "inline-block", fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 6,
    background: exists ? "#e8f5e9" : "#f5f5f5", color: exists ? "#4A7C59" : "#999",
  }),
  btn: { background: "#9B8E82", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer" },
  btnSmall: { background: "#9B8E82", color: "#fff", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 500, cursor: "pointer" },
  btnDanger: { background: "#C0392B", color: "#fff", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 500, cursor: "pointer" },
  btnOutline: { background: "transparent", color: "#9B8E82", border: "1px solid #E8E4DA", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 500, cursor: "pointer" },
  input: { width: "100%", padding: "8px 12px", border: "1px solid #E8E4DA", borderRadius: 8, fontSize: 14, fontFamily: "Inter, sans-serif" },
  select: { padding: "8px 12px", border: "1px solid #E8E4DA", borderRadius: 8, fontSize: 14, fontFamily: "Inter, sans-serif", background: "#fff" },
  row: { display: "flex", gap: 12, alignItems: "center", marginBottom: 12 },
  spinner: { display: "inline-block", width: 14, height: 14, border: "2px solid #E8E4DA", borderTop: "2px solid #9B8E82", borderRadius: "50%", animation: "spin 0.6s linear infinite" },
  depChain: { fontSize: 12, color: "#6B6B6B", lineHeight: 1.8, padding: "12px 16px", background: "#fdfbf7", borderRadius: 8, marginBottom: 20 },
  log: { fontSize: 12, color: "#6B6B6B", lineHeight: 1.6, padding: 12, background: "#fdfbf7", borderRadius: 8, maxHeight: 200, overflowY: "auto", marginTop: 12 },
};

// ── Main Component ──────────────────────────────────────────────

export default function TestEnvironment() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");

  // Topic selection / creation
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [topicName, setTopicName] = useState("");
  const [topicId, setTopicId] = useState("");
  const [topicIdManual, setTopicIdManual] = useState("");

  // Active topic state
  const [topicInfo, setTopicInfo] = useState(null);
  const [outputs, setOutputs] = useState({});

  // UI state
  const [loading, setLoading] = useState({});
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");

  // Check if already authed
  useEffect(() => {
    const token = sessionStorage.getItem("admin_token");
    if (token) {
      setAuthed(true);
      loadCourses();
    }
  }, []);

  const log = useCallback((msg) => {
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()} — ${msg}`]);
  }, []);

  // ── Auth ──────────────────────────────────────────────────────

  async function handleLogin() {
    try {
      const res = await fetch(`${API}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) throw new Error("Wrong password");
      const data = await res.json();
      sessionStorage.setItem("admin_token", data.token);
      setAuthed(true);
      loadCourses();
    } catch (e) {
      setError(e.message);
    }
  }

  // ── Load courses for dropdown ─────────────────────────────────

  async function loadCourses() {
    try {
      const data = await api("/api/admin/test/courses");
      setCourses(data.courses || []);
    } catch (e) {
      setError(`Failed to load courses: ${e.message}`);
    }
  }

  // ── Create blank topic ────────────────────────────────────────

  async function createTopic() {
    if (!selectedCourse || !topicName.trim()) return;
    setError("");
    try {
      const form = new FormData();
      form.append("name", topicName.trim());
      form.append("course_id", selectedCourse);
      const data = await api("/api/admin/test/topics", { method: "POST", body: form });
      const newId = data.topic.id;
      setTopicId(newId);
      log(`Created topic "${topicName}" (${newId})`);
      await loadOutputs(newId);
    } catch (e) {
      setError(`Failed to create topic: ${e.message}`);
    }
  }

  // ── Load existing topic ───────────────────────────────────────

  async function loadExistingTopic() {
    if (!topicIdManual.trim()) return;
    setError("");
    setTopicId(topicIdManual.trim());
    await loadOutputs(topicIdManual.trim());
  }

  // ── Load outputs for active topic ─────────────────────────────

  async function loadOutputs(tid) {
    try {
      const data = await api(`/api/admin/test/topics/${tid}/outputs`);
      setTopicInfo(data);
      setOutputs(data.outputs || {});
      log(`Loaded outputs for ${data.topic?.name || tid}`);
    } catch (e) {
      setError(`Failed to load topic: ${e.message}`);
      setTopicId("");
    }
  }

  // ── Replace an output ─────────────────────────────────────────

  async function replaceOutput(outputType, files) {
    setLoading((prev) => ({ ...prev, [outputType]: "replacing" }));
    setError("");
    try {
      const form = new FormData();
      for (const f of files) {
        form.append("files", f);
      }
      await api(`/api/admin/test/topics/${topicId}/outputs/${outputType}`, {
        method: "PUT",
        body: form,
      });
      log(`Replaced ${outputType} (${files.length} file${files.length > 1 ? "s" : ""})`);
      await loadOutputs(topicId);
    } catch (e) {
      setError(`Replace failed: ${e.message}`);
    }
    setLoading((prev) => ({ ...prev, [outputType]: null }));
  }

  // ── Generate a single step ────────────────────────────────────

  async function generateStep(outputType) {
    const step = STEP_MAP[outputType];
    setLoading((prev) => ({ ...prev, [outputType]: "generating" }));
    setError("");
    log(`Generating ${step}...`);
    try {
      const data = await api(`/api/admin/test/topics/${topicId}/generate/${step}`, { method: "POST" });
      log(`${step} → ${data.status}`);
      await loadOutputs(topicId);
    } catch (e) {
      setError(`Generate failed: ${e.message}`);
      log(`${step} → FAILED: ${e.message}`);
    }
    setLoading((prev) => ({ ...prev, [outputType]: null }));
  }

  // ── Generate all downstream ───────────────────────────────────

  async function generateDownstream() {
    setLoading((prev) => ({ ...prev, downstream: true }));
    setError("");
    log("Generating all downstream from learning asset...");
    try {
      const data = await api(`/api/admin/test/topics/${topicId}/generate-downstream`, { method: "POST" });
      for (const [step, status] of Object.entries(data.results || {})) {
        log(`  ${step} → ${status}`);
      }
      await loadOutputs(topicId);
    } catch (e) {
      setError(`Downstream generation failed: ${e.message}`);
      log(`Downstream → FAILED: ${e.message}`);
    }
    setLoading((prev) => ({ ...prev, downstream: false }));
  }

  // ── Download an output ────────────────────────────────────────

  async function downloadOutput(outputType) {
    try {
      const data = await api(`/api/admin/test/topics/${topicId}/download/${outputType}`);
      if (data.url) {
        window.open(data.url, "_blank");
      } else if (data.files) {
        // Multiple files — open first one
        window.open(data.files[0].url, "_blank");
      }
    } catch (e) {
      setError(`Download failed: ${e.message}`);
    }
  }

  // ── Render: Login ─────────────────────────────────────────────

  if (!authed) {
    return (
      <div style={styles.page}>
        <h1 style={styles.h1}>Test Environment</h1>
        <div style={styles.card}>
          <input
            style={{ ...styles.input, marginBottom: 12 }}
            type="password"
            placeholder="Admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
          <button style={styles.btn} onClick={handleLogin}>Log In</button>
          {error && <p style={{ color: "#C0392B", fontSize: 13, marginTop: 8 }}>{error}</p>}
        </div>
      </div>
    );
  }

  // ── Render: Topic Selection ───────────────────────────────────

  if (!topicId) {
    return (
      <div style={styles.page}>
        <h1 style={styles.h1}>Test Environment</h1>
        <p style={styles.subtitle}>Create a blank topic or load an existing one to start testing.</p>

        {error && <p style={{ color: "#C0392B", fontSize: 13, marginBottom: 12 }}>{error}</p>}

        <div style={styles.card}>
          <h2 style={styles.h2}>Create blank topic</h2>
          <div style={styles.row}>
            <select style={styles.select} value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
              <option value="">Pick a course...</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.student_name} — {c.name} {c.framework_type ? `(${c.framework_type})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div style={styles.row}>
            <input style={{ ...styles.input, flex: 1 }} placeholder="Topic name" value={topicName} onChange={(e) => setTopicName(e.target.value)} />
            <button style={styles.btn} onClick={createTopic} disabled={!selectedCourse || !topicName.trim()}>Create</button>
          </div>
        </div>

        <div style={{ ...styles.card, marginTop: 16 }}>
          <h2 style={styles.h2}>Load existing topic</h2>
          <div style={styles.row}>
            <input style={{ ...styles.input, flex: 1 }} placeholder="Paste topic UUID" value={topicIdManual} onChange={(e) => setTopicIdManual(e.target.value)} />
            <button style={styles.btn} onClick={loadExistingTopic} disabled={!topicIdManual.trim()}>Load</button>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <a href="/" style={{ fontSize: 13, color: "#9B8E82" }}>← Back to Admin</a>
        </div>
      </div>
    );
  }

  // ── Render: Active Topic ──────────────────────────────────────

  const info = topicInfo || {};
  const groups = {
    source: OUTPUTS.filter((o) => o.group === "source"),
    scripts: OUTPUTS.filter((o) => o.group === "scripts"),
    media: OUTPUTS.filter((o) => o.group === "media"),
  };

  return (
    <div style={styles.page}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h1 style={styles.h1}>{info.topic?.name || "Test Topic"}</h1>
          <p style={styles.subtitle}>
            {info.student?.name || ""} — {info.course?.name || ""}{" "}
            {info.course?.framework_type ? <span style={styles.badge(true)}>{info.course.framework_type}</span> : ""}
          </p>
          <p style={{ fontSize: 12, color: "#999" }}>Topic ID: {topicId}</p>
        </div>
        <button style={styles.btnOutline} onClick={() => { setTopicId(""); setTopicInfo(null); setOutputs({}); setLogs([]); }}>
          ← Different topic
        </button>
      </div>

      {error && <p style={{ color: "#C0392B", fontSize: 13, marginBottom: 12 }}>{error}</p>}

      {/* Dependency chain */}
      <div style={styles.depChain}>
        <span style={styles.label}>Pipeline flow</span><br />
        Source Files → <strong>Learning Asset</strong> → Podcast Script → Podcast Audio<br />
        <span style={{ marginLeft: 180 }}>→ Note Chart</span><br />
        <span style={{ marginLeft: 180 }}>→ Visual Overview Script → Images</span><br />
        <span style={{ marginLeft: 295 }}>→ Narration Audio</span>
      </div>

      {/* Source layer */}
      <p style={{ ...styles.label, marginBottom: 8 }}>Source of truth</p>
      {groups.source.map((o) => (
        <OutputCard key={o.key} config={o} output={outputs[o.key]} loading={loading[o.key]}
          onReplace={(files) => replaceOutput(o.key, files)}
          onGenerate={() => generateStep(o.key)}
          onDownload={() => downloadOutput(o.key)}
          extraButton={
            outputs[o.key]?.exists ? (
              <button style={{ ...styles.btn, marginLeft: 8 }}
                onClick={generateDownstream}
                disabled={loading.downstream}>
                {loading.downstream ? <span style={styles.spinner} /> : "Generate All Downstream"}
              </button>
            ) : null
          }
        />
      ))}

      {/* Scripts layer */}
      <p style={{ ...styles.label, marginBottom: 8, marginTop: 20 }}>Generated from learning asset</p>
      {groups.scripts.map((o) => (
        <OutputCard key={o.key} config={o} output={outputs[o.key]} loading={loading[o.key]}
          onReplace={(files) => replaceOutput(o.key, files)}
          onGenerate={() => generateStep(o.key)}
          onDownload={() => downloadOutput(o.key)}
        />
      ))}

      {/* Media layer */}
      <p style={{ ...styles.label, marginBottom: 8, marginTop: 20 }}>Generated from scripts</p>
      {groups.media.map((o) => (
        <OutputCard key={o.key} config={o} output={outputs[o.key]} loading={loading[o.key]}
          onReplace={(files) => replaceOutput(o.key, files)}
          onGenerate={() => generateStep(o.key)}
          onDownload={() => downloadOutput(o.key)}
        />
      ))}

      {/* Activity log */}
      {logs.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <p style={styles.label}>Activity log</p>
          <div style={styles.log}>
            {logs.map((l, i) => <div key={i}>{l}</div>)}
          </div>
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <a href="/" style={{ fontSize: 13, color: "#9B8E82" }}>← Back to Admin</a>
      </div>
    </div>
  );
}


// ── Output Card Component ───────────────────────────────────────

function OutputCard({ config, output, loading, onReplace, onGenerate, onDownload, extraButton }) {
  const exists = output?.exists;
  const fileCount = output?.file_count || 0;

  function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    if (files.length > 0) onReplace(files);
    e.target.value = "";
  }

  return (
    <div style={styles.card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <span style={{ fontSize: 14, fontWeight: 500 }}>{config.label}</span>
          <span style={{ ...styles.badge(exists), marginLeft: 8 }}>
            {exists ? (fileCount > 1 ? `${fileCount} files` : "Exists") : "Not generated"}
          </span>
          {loading && <span style={{ ...styles.spinner, marginLeft: 8 }} />}
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          {/* Download */}
          {exists && (
            <button style={styles.btnOutline} onClick={onDownload}>View</button>
          )}

          {/* Replace */}
          <label style={{ ...styles.btnSmall, display: "inline-flex", alignItems: "center", cursor: "pointer" }}>
            Replace
            <input type="file" accept={config.accept} multiple={config.multiple} onChange={handleFileSelect}
              style={{ display: "none" }} />
          </label>

          {/* Generate */}
          <button style={styles.btnSmall} onClick={onGenerate} disabled={!!loading}>
            Generate
          </button>

          {/* Extra button (e.g., Generate All Downstream) */}
          {extraButton}
        </div>
      </div>
    </div>
  );
}
