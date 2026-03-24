// FILE: app/test/page.js
// Replace the existing file in open-path-admin/app/test/page.js

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

const S = {
  page: { maxWidth: 900, margin: "0 auto", padding: "2rem 1.5rem", fontFamily: "Inter, sans-serif" },
  h1: { fontFamily: "Lora, serif", fontSize: 24, fontWeight: 600, marginBottom: 4 },
  h2: { fontFamily: "Lora, serif", fontSize: 18, fontWeight: 500, marginBottom: 8 },
  muted: { color: "#6B6B6B", fontSize: 13 },
  card: { background: "#fff", border: "1px solid #E8E4DA", borderRadius: 12, padding: 20, marginBottom: 10 },
  label: { fontSize: 11, fontWeight: 500, color: "#6B6B6B", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 },
  badge: function(ok) { return { display: "inline-block", fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 6, background: ok ? "#e8f5e9" : "#f5f5f5", color: ok ? "#4A7C59" : "#999" }; },
  btn: { background: "#9B8E82", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer" },
  btnSm: { background: "#9B8E82", color: "#fff", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 500, cursor: "pointer" },
  btnOut: { background: "transparent", color: "#9B8E82", border: "1px solid #E8E4DA", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 500, cursor: "pointer" },
  input: { width: "100%", padding: "8px 12px", border: "1px solid #E8E4DA", borderRadius: 8, fontSize: 14, fontFamily: "Inter, sans-serif" },
  select: { padding: "8px 12px", border: "1px solid #E8E4DA", borderRadius: 8, fontSize: 14, fontFamily: "Inter, sans-serif", background: "#fff", width: "100%" },
  row: { display: "flex", gap: 10, alignItems: "center", marginBottom: 10 },
  spin: { display: "inline-block", width: 14, height: 14, border: "2px solid #E8E4DA", borderTop: "2px solid #9B8E82", borderRadius: "50%", animation: "spin 0.6s linear infinite" },
  log: { fontSize: 12, color: "#6B6B6B", lineHeight: 1.6, padding: 12, background: "#fdfbf7", borderRadius: 8, maxHeight: 180, overflowY: "auto", marginTop: 8 },
  topicRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderBottom: "1px solid #f0ece4", cursor: "pointer" },
};

export default function TestEnvironment() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [courseTopics, setCourseTopics] = useState([]);
  const [newTopicName, setNewTopicName] = useState("");
  const [topicId, setTopicId] = useState("");
  const [topicInfo, setTopicInfo] = useState(null);
  const [outputs, setOutputs] = useState({});
  const [loading, setLoading] = useState({});
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");

  useEffect(function() {
    if (sessionStorage.getItem("admin_token")) {
      setAuthed(true);
      loadCourses();
    }
  }, []);

  var log = useCallback(function(msg) {
    setLogs(function(prev) { return prev.concat(new Date().toLocaleTimeString() + " — " + msg); });
  }, []);

  async function handleLogin() {
    try {
      var res = await fetch(API + "/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password }),
      });
      if (!res.ok) throw new Error("Wrong password");
      var data = await res.json();
      sessionStorage.setItem("admin_token", data.token);
      setAuthed(true);
      loadCourses();
    } catch (e) { setError(e.message); }
  }

  async function loadCourses() {
    try {
      var data = await api("/api/admin/test/courses");
      setCourses(data.courses || []);
    } catch (e) { setError("Load courses: " + e.message); }
  }

  async function loadTopicsForCourse(courseId) {
    setSelectedCourse(courseId);
    setCourseTopics([]);
    if (!courseId) return;
    try {
      var data = await api("/api/admin/courses/" + courseId + "/topics");
      setCourseTopics(data.topics || data || []);
    } catch (e) { setError("Load topics: " + e.message); }
  }

  async function createTopic() {
    if (!selectedCourse || !newTopicName.trim()) return;
    setError("");
    try {
      var form = new FormData();
      form.append("name", newTopicName.trim());
      form.append("course_id", selectedCourse);
      var data = await api("/api/admin/test/topics", { method: "POST", body: form });
      setNewTopicName("");
      log("Created \"" + data.topic.name + "\"");
      await loadTopicsForCourse(selectedCourse);
      selectTopic(data.topic.id);
    } catch (e) { setError("Create: " + e.message); }
  }

  async function selectTopic(tid) {
    setTopicId(tid);
    setError("");
    setLogs([]);
    try {
      var data = await api("/api/admin/test/topics/" + tid + "/outputs");
      setTopicInfo(data);
      setOutputs(data.outputs || {});
      log("Loaded " + (data.topic && data.topic.name ? data.topic.name : tid));
    } catch (e) {
      setError("Load topic: " + e.message);
      setTopicId("");
    }
  }

  async function replaceOutput(outputType, files) {
    setLoading(function(p) { var n = Object.assign({}, p); n[outputType] = "replacing"; return n; });
    setError("");
    try {
      var form = new FormData();
      for (var i = 0; i < files.length; i++) form.append("files", files[i]);
      await api("/api/admin/test/topics/" + topicId + "/outputs/" + outputType, { method: "PUT", body: form });
      log("Replaced " + outputType + " (" + files.length + " file" + (files.length > 1 ? "s" : "") + ")");
      await selectTopic(topicId);
    } catch (e) { setError("Replace: " + e.message); }
    setLoading(function(p) { var n = Object.assign({}, p); n[outputType] = null; return n; });
  }

  async function generateStep(outputType) {
    var step = STEP_MAP[outputType];
    setLoading(function(p) { var n = Object.assign({}, p); n[outputType] = "generating"; return n; });
    setError("");
    log("Running " + step + "...");
    try {
      var data = await api("/api/admin/test/topics/" + topicId + "/generate/" + step, { method: "POST" });
      log(step + " → " + data.status);
      await selectTopic(topicId);
    } catch (e) {
      setError("Generate: " + e.message);
      log(step + " → FAILED");
    }
    setLoading(function(p) { var n = Object.assign({}, p); n[outputType] = null; return n; });
  }

  async function downloadOutput(outputType) {
    try {
      var data = await api("/api/admin/test/topics/" + topicId + "/download/" + outputType);
      var url = data.url || (data.files && data.files[0] && data.files[0].url);
      if (url) window.open(url, "_blank");
    } catch (e) { setError("Download: " + e.message); }
  }

  // ── LOGIN ─────────────────────────────────────────────────────

  if (!authed) {
    return (
      <div style={S.page}>
        <h1 style={S.h1}>Test Environment</h1>
        <div style={Object.assign({}, S.card, { maxWidth: 360, marginTop: 20 })}>
          <input style={Object.assign({}, S.input, { marginBottom: 10 })} type="password" placeholder="Admin password"
            value={password} onChange={function(e) { setPassword(e.target.value); }}
            onKeyDown={function(e) { if (e.key === "Enter") handleLogin(); }} />
          <button style={S.btn} onClick={handleLogin}>Log In</button>
          {error && <p style={{ color: "#C0392B", fontSize: 13, marginTop: 8 }}>{error}</p>}
        </div>
      </div>
    );
  }

  // ── ACTIVE TOPIC ──────────────────────────────────────────────

  if (topicId && topicInfo) {
    var info = topicInfo;
    var sourceOutputs = OUTPUTS.filter(function(o) { return o.group === "source"; });
    var scriptOutputs = OUTPUTS.filter(function(o) { return o.group === "scripts"; });
    var mediaOutputs = OUTPUTS.filter(function(o) { return o.group === "media"; });

    return (
      <div style={S.page}>
        <style>{"@keyframes spin { to { transform: rotate(360deg) } }"}</style>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <h1 style={S.h1}>{info.topic && info.topic.name}</h1>
            <p style={S.muted}>
              {info.student && info.student.name} — {info.course && info.course.name}
              {info.course && info.course.framework_type && <span style={Object.assign({}, S.badge(true), { marginLeft: 8 })}>{info.course.framework_type}</span>}
            </p>
          </div>
          <button style={S.btnOut} onClick={function() { setTopicId(""); setTopicInfo(null); setOutputs({}); setLogs([]); }}>
            ← Back
          </button>
        </div>

        {error && <p style={{ color: "#C0392B", fontSize: 13, marginBottom: 10 }}>{error}</p>}

        <p style={S.label}>Source of truth</p>
        {sourceOutputs.map(function(o) {
          return <OutputCard key={o.key} config={o} output={outputs[o.key]} loading={loading[o.key]}
            onReplace={function(f) { replaceOutput(o.key, f); }}
            onGenerate={function() { generateStep(o.key); }}
            onDownload={function() { downloadOutput(o.key); }}
          />;
        })}

        <p style={Object.assign({}, S.label, { marginTop: 16 })}>From learning asset</p>
        {scriptOutputs.map(function(o) {
          return <OutputCard key={o.key} config={o} output={outputs[o.key]} loading={loading[o.key]}
            onReplace={function(f) { replaceOutput(o.key, f); }}
            onGenerate={function() { generateStep(o.key); }}
            onDownload={function() { downloadOutput(o.key); }} />;
        })}

        <p style={Object.assign({}, S.label, { marginTop: 16 })}>From scripts</p>
        {mediaOutputs.map(function(o) {
          return <OutputCard key={o.key} config={o} output={outputs[o.key]} loading={loading[o.key]}
            onReplace={function(f) { replaceOutput(o.key, f); }}
            onGenerate={function() { generateStep(o.key); }}
            onDownload={function() { downloadOutput(o.key); }} />;
        })}

        {logs.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <p style={S.label}>Log</p>
            <div style={S.log}>{logs.map(function(l, i) { return <div key={i}>{l}</div>; })}</div>
          </div>
        )}
      </div>
    );
  }

  // ── COURSE + TOPIC SELECTION ──────────────────────────────────

  var selectedCourseObj = courses.find(function(c) { return c.id === selectedCourse; });

  return (
    <div style={S.page}>
      <h1 style={S.h1}>Test Environment</h1>
      <p style={Object.assign({}, S.muted, { marginBottom: 20 })}>Pick a course, then select or create a topic.</p>

      {error && <p style={{ color: "#C0392B", fontSize: 13, marginBottom: 10 }}>{error}</p>}

      <select style={Object.assign({}, S.select, { marginBottom: 16 })} value={selectedCourse}
        onChange={function(e) { loadTopicsForCourse(e.target.value); }}>
        <option value="">Pick a course...</option>
        {courses.map(function(c) {
          return <option key={c.id} value={c.id}>
            {c.student_name} — {c.name} {c.framework_type ? "(" + c.framework_type + ")" : ""}
          </option>;
        })}
      </select>

      {selectedCourse && (
        <div style={S.card}>
          <h2 style={Object.assign({}, S.h2, { marginBottom: 12 })}>
            Topics in {selectedCourseObj ? selectedCourseObj.name : "course"}
          </h2>

          {courseTopics.length > 0 ? (
            <div style={{ border: "1px solid #f0ece4", borderRadius: 8, overflow: "hidden", marginBottom: 14 }}>
              {courseTopics.map(function(t) {
                return (
                  <div key={t.id} style={S.topicRow}
                    onClick={function() { selectTopic(t.id); }}
                    onMouseEnter={function(e) { e.currentTarget.style.background = "#fdfbf7"; }}
                    onMouseLeave={function(e) { e.currentTarget.style.background = "transparent"; }}>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 500 }}>{t.name}</span>
                      {t.week_number && <span style={Object.assign({}, S.muted, { marginLeft: 8 })}>Week {t.week_number}</span>}
                    </div>
                    <span style={S.badge(t.generation_status === "completed")}>
                      {t.generation_status || "idle"}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={Object.assign({}, S.muted, { marginBottom: 14 })}>No topics yet.</p>
          )}

          <div style={S.row}>
            <input style={Object.assign({}, S.input, { flex: 1 })} placeholder="New topic name"
              value={newTopicName} onChange={function(e) { setNewTopicName(e.target.value); }}
              onKeyDown={function(e) { if (e.key === "Enter") createTopic(); }} />
            <button style={S.btnSm} onClick={createTopic} disabled={!newTopicName.trim()}>+ Create</button>
          </div>
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <a href="/" style={{ fontSize: 13, color: "#9B8E82" }}>← Back to Admin</a>
      </div>
    </div>
  );
}

function OutputCard(props) {
  var config = props.config, output = props.output, loading = props.loading;
  var exists = output && output.exists;
  var count = (output && output.file_count) || 0;

  function handleFileSelect(e) {
    var files = Array.from(e.target.files);
    if (files.length > 0) props.onReplace(files);
    e.target.value = "";
  }

  return (
    <div style={S.card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 500 }}>{config.label}</span>
          <span style={S.badge(exists)}>
            {exists ? (count > 1 ? count + " files" : "Exists") : "Empty"}
          </span>
          {loading && <span style={S.spin} />}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {exists && <button style={S.btnOut} onClick={props.onDownload}>View</button>}
          <label style={Object.assign({}, S.btnSm, { display: "inline-flex", alignItems: "center", cursor: "pointer" })}>
            Replace
            <input type="file" accept={config.accept} multiple={config.multiple}
              onChange={handleFileSelect} style={{ display: "none" }} />
          </label>
          <button style={S.btnSm} onClick={props.onGenerate} disabled={!!loading}>Generate</button>
        </div>
      </div>
    </div>
  );
}
