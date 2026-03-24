"use client";
import { useState, useEffect, useCallback } from "react";

var API = process.env.NEXT_PUBLIC_API_URL || "";

function api(path, opts) {
  opts = opts || {};
  var token = typeof window !== "undefined" ? sessionStorage.getItem("admin_token") : null;
  var headers = Object.assign({}, opts.headers || {});
  if (token) headers["Authorization"] = "Bearer " + token;
  return fetch(API + path, Object.assign({}, opts, { headers: headers }))
    .then(function(r) {
      if (!r.ok) return r.text().then(function(t) { throw new Error(r.status + ": " + t); });
      return r.json();
    });
}

var S = {
  page: { maxWidth: 900, margin: "0 auto", padding: "2rem 1.5rem", fontFamily: "Inter, sans-serif" },
  h1: { fontFamily: "Lora, serif", fontSize: 24, fontWeight: 600, marginBottom: 4 },
  h2: { fontFamily: "Lora, serif", fontSize: 18, fontWeight: 500, marginBottom: 8 },
  muted: { color: "#6B6B6B", fontSize: 13 },
  card: { background: "#fff", border: "1px solid #E8E4DA", borderRadius: 12, padding: "14px 18px", marginBottom: 8 },
  label: { fontSize: 11, fontWeight: 500, color: "#6B6B6B", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 },
  badge: function(ok) { return { display: "inline-block", fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 6, background: ok ? "#e8f5e9" : "#f5f5f5", color: ok ? "#4A7C59" : "#999" }; },
  btn: { background: "#9B8E82", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer" },
  btnSm: { background: "#9B8E82", color: "#fff", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 500, cursor: "pointer" },
  btnAccent: { background: "#4A7C59", color: "#fff", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 500, cursor: "pointer" },
  btnOut: { background: "transparent", color: "#9B8E82", border: "1px solid #E8E4DA", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 500, cursor: "pointer" },
  input: { width: "100%", padding: "8px 12px", border: "1px solid #E8E4DA", borderRadius: 8, fontSize: 14, fontFamily: "Inter, sans-serif" },
  select: { padding: "8px 12px", border: "1px solid #E8E4DA", borderRadius: 8, fontSize: 14, fontFamily: "Inter, sans-serif", background: "#fff", width: "100%" },
  row: { display: "flex", gap: 10, alignItems: "center", marginBottom: 10 },
  spin: { display: "inline-block", width: 14, height: 14, border: "2px solid #E8E4DA", borderTop: "2px solid #9B8E82", borderRadius: "50%", animation: "spin 0.6s linear infinite" },
  log: { fontSize: 12, color: "#6B6B6B", lineHeight: 1.6, padding: 12, background: "#fdfbf7", borderRadius: 8, maxHeight: 180, overflowY: "auto", marginTop: 8 },
  topicRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderBottom: "1px solid #f0ece4", cursor: "pointer" },
  indent: { marginLeft: 28, borderLeft: "2px solid #E8E4DA", paddingLeft: 14 },
};

var STEP_MAP = {
  learning_asset: "generate_learning_asset",
  podcast_script: "generate_podcast_script",
  notechart: "generate_notechart",
  visual_overview_script: "generate_visual_overview_script",
  visual_overview_images: "generate_images",
  podcast_audio: "generate_podcast_audio",
  narration_audio: "generate_narration_audio",
};

export default function TestEnvironment() {
  var _s = useState(false), authed = _s[0], setAuthed = _s[1];
  var _p = useState(""), password = _p[0], setPassword = _p[1];
  var _c = useState([]), courses = _c[0], setCourses = _c[1];
  var _sc = useState(""), selectedCourse = _sc[0], setSelectedCourse = _sc[1];
  var _ct = useState([]), courseTopics = _ct[0], setCourseTopics = _ct[1];
  var _nt = useState(""), newTopicName = _nt[0], setNewTopicName = _nt[1];
  var _ti = useState(""), topicId = _ti[0], setTopicId = _ti[1];
  var _info = useState(null), topicInfo = _info[0], setTopicInfo = _info[1];
  var _out = useState({}), outputs = _out[0], setOutputs = _out[1];
  var _ld = useState({}), loading = _ld[0], setLoading = _ld[1];
  var _lg = useState([]), logs = _lg[0], setLogs = _lg[1];
  var _er = useState(""), error = _er[0], setError = _er[1];

  useEffect(function() {
    if (sessionStorage.getItem("admin_token")) { setAuthed(true); loadCourses(); }
  }, []);

  var log = useCallback(function(msg) {
    setLogs(function(prev) { return prev.concat(new Date().toLocaleTimeString() + " — " + msg); });
  }, []);

  // ── Auth ──────────────────────────────────────────────────────
  async function handleLogin() {
    try {
      var res = await fetch(API + "/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: password }) });
      if (!res.ok) throw new Error("Wrong password");
      var data = await res.json();
      sessionStorage.setItem("admin_token", data.token);
      setAuthed(true); loadCourses();
    } catch (e) { setError(e.message); }
  }

  // ── Data ──────────────────────────────────────────────────────
  async function loadCourses() {
    try { var data = await api("/api/admin/test/courses"); setCourses(data.courses || []); }
    catch (e) { setError("Load courses: " + e.message); }
  }

  async function loadTopicsForCourse(courseId) {
    setSelectedCourse(courseId); setCourseTopics([]);
    if (!courseId) return;
    try { var data = await api("/api/admin/courses/" + courseId + "/topics"); setCourseTopics(data.topics || data || []); }
    catch (e) { setError("Load topics: " + e.message); }
  }

  async function createTopic() {
    if (!selectedCourse || !newTopicName.trim()) return;
    setError("");
    try {
      var form = new FormData(); form.append("name", newTopicName.trim()); form.append("course_id", selectedCourse);
      var data = await api("/api/admin/test/topics", { method: "POST", body: form });
      setNewTopicName(""); log("Created \"" + data.topic.name + "\"");
      await loadTopicsForCourse(selectedCourse); selectTopic(data.topic.id);
    } catch (e) { setError("Create: " + e.message); }
  }

  async function selectTopic(tid) {
    setTopicId(tid); setError(""); setLogs([]);
    try {
      var data = await api("/api/admin/test/topics/" + tid + "/outputs");
      setTopicInfo(data); setOutputs(data.outputs || {});
      log("Loaded " + (data.topic ? data.topic.name : tid));
    } catch (e) { setError("Load: " + e.message); setTopicId(""); }
  }

  // ── Actions ───────────────────────────────────────────────────
  async function replaceOutput(key, files) {
    setLoading(function(p) { var n = Object.assign({}, p); n[key] = "replacing"; return n; });
    setError("");
    try {
      var form = new FormData(); for (var i = 0; i < files.length; i++) form.append("files", files[i]);
      await api("/api/admin/test/topics/" + topicId + "/outputs/" + key, { method: "PUT", body: form });
      log("Replaced " + key); await selectTopic(topicId);
    } catch (e) { setError("Replace: " + e.message); }
    setLoading(function(p) { var n = Object.assign({}, p); n[key] = null; return n; });
  }

  async function generateOne(key) {
    var step = STEP_MAP[key];
    setLoading(function(p) { var n = Object.assign({}, p); n[key] = "generating"; return n; });
    setError(""); log("Generating " + key + "...");
    try {
      var data = await api("/api/admin/test/topics/" + topicId + "/generate/" + step, { method: "POST" });
      log(key + " → " + data.status); await selectTopic(topicId);
    } catch (e) { setError("Generate: " + e.message); log(key + " → FAILED"); }
    setLoading(function(p) { var n = Object.assign({}, p); n[key] = null; return n; });
  }

  async function generateFrom(key) {
    setLoading(function(p) { var n = Object.assign({}, p); n[key + "_downstream"] = true; return n; });
    setError(""); log("Generating downstream from " + key + "...");
    try {
      var data = await api("/api/admin/test/topics/" + topicId + "/generate-from/" + key, { method: "POST" });
      var results = data.results || {};
      for (var step in results) log("  " + step + " → " + results[step]);
      await selectTopic(topicId);
    } catch (e) { setError("Downstream: " + e.message); log("Downstream → FAILED"); }
    setLoading(function(p) { var n = Object.assign({}, p); n[key + "_downstream"] = null; return n; });
  }

  async function downloadOutput(key) {
    try {
      var data = await api("/api/admin/test/topics/" + topicId + "/download/" + key);
      var url = data.url || (data.files && data.files[0] && data.files[0].url);
      if (url) window.open(url, "_blank");
    } catch (e) { setError("Download: " + e.message); }
  }

  // ── Render helpers ────────────────────────────────────────────
  function Out(props) {
    var key = props.k, label = props.label, o = outputs[key];
    var exists = o && o.exists, count = o && o.file_count || 0;
    return (
      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>{label}</span>
            <span style={S.badge(exists)}>{exists ? (count > 1 ? count + " files" : "Exists") : "Empty"}</span>
            {loading[key] && <span style={S.spin} />}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {exists && <button style={S.btnOut} onClick={function() { downloadOutput(key); }}>View</button>}
            {exists && <button style={S.btnOut} onClick={function() {
              api("/api/admin/test/topics/" + topicId + "/outputs/" + key, { method: "DELETE" })
                .then(function() { log("Cleared " + key); selectTopic(topicId); })
                .catch(function(e) { setError("Clear: " + e.message); });
            }}>Clear</button>}
            <label style={Object.assign({}, S.btnSm, { display: "inline-flex", alignItems: "center", cursor: "pointer" })}>
              Replace
              <input type="file" accept={props.accept} multiple={props.multi}
                onChange={function(e) { var f = Array.from(e.target.files); if (f.length) replaceOutput(key, f); e.target.value = ""; }}
                style={{ display: "none" }} />
            </label>
            <button style={S.btnSm} onClick={function() { generateOne(key); }} disabled={!!loading[key]}>Generate</button>
            {props.downstream && exists && (
              <button style={S.btnAccent}
                onClick={function() { generateFrom(key); }}
                disabled={!!loading[key + "_downstream"]}>
                {loading[key + "_downstream"] ? <span style={S.spin} /> : props.downstream}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Login ─────────────────────────────────────────────────────
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

  // ── Active topic ──────────────────────────────────────────────
  if (topicId && topicInfo) {
    var info = topicInfo;
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
          <button style={S.btnOut} onClick={function() { setTopicId(""); setTopicInfo(null); setOutputs({}); setLogs([]); }}>← Back</button>
        </div>

        {error && <p style={{ color: "#C0392B", fontSize: 13, marginBottom: 10 }}>{error}</p>}

        {/* ── PIPELINE FLOW ── */}

        <Out k="learning_asset" label="Learning Asset" accept=".txt,.md,.yaml,.yml"
          downstream="Generate all downstream ↓" />

        <div style={S.indent}>
          <Out k="podcast_script" label="Podcast Script" accept=".txt,.md"
            downstream="Generate audio ↓" />
          <div style={S.indent}>
            <Out k="podcast_audio" label="Podcast Audio" accept=".mp3,.wav" />
          </div>

          <Out k="notechart" label="Note Chart" accept=".json,.txt,.md" />

          <Out k="visual_overview_script" label="Visual Overview Script" accept=".json,.txt,.md"
            downstream="Generate images + narration ↓" />
          <div style={S.indent}>
            <Out k="visual_overview_images" label="Visual Overview Images" accept="image/*" multi={true} />
            <Out k="narration_audio" label="Narration Audio" accept=".mp3,.wav" multi={true} />
          </div>
        </div>

        {/* ── LOG ── */}
        {logs.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <p style={S.label}>Log</p>
            <div style={S.log}>{logs.map(function(l, i) { return <div key={i}>{l}</div>; })}</div>
          </div>
        )}
      </div>
    );
  }

  // ── Course / topic picker ─────────────────────────────────────
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
          return <option key={c.id} value={c.id}>{c.student_name} — {c.name} {c.framework_type ? "(" + c.framework_type + ")" : ""}</option>;
        })}
      </select>

      {selectedCourse && (
        <div style={S.card}>
          <h2 style={Object.assign({}, S.h2, { marginBottom: 12 })}>Topics in {selectedCourseObj ? selectedCourseObj.name : "course"}</h2>
          {courseTopics.length > 0 ? (
            <div style={{ border: "1px solid #f0ece4", borderRadius: 8, overflow: "hidden", marginBottom: 14 }}>
              {courseTopics.map(function(t) {
                return (
                  <div key={t.id} style={S.topicRow} onClick={function() { selectTopic(t.id); }}
                    onMouseEnter={function(e) { e.currentTarget.style.background = "#fdfbf7"; }}
                    onMouseLeave={function(e) { e.currentTarget.style.background = "transparent"; }}>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 500 }}>{t.name}</span>
                      {t.week_number && <span style={Object.assign({}, S.muted, { marginLeft: 8 })}>Week {t.week_number}</span>}
                    </div>
                    <span style={S.badge(t.generation_status === "completed")}>{t.generation_status || "idle"}</span>
                  </div>
                );
              })}
            </div>
          ) : (<p style={Object.assign({}, S.muted, { marginBottom: 14 })}>No topics yet.</p>)}

          <div style={S.row}>
            <input style={Object.assign({}, S.input, { flex: 1 })} placeholder="New topic name"
              value={newTopicName} onChange={function(e) { setNewTopicName(e.target.value); }}
              onKeyDown={function(e) { if (e.key === "Enter") createTopic(); }} />
            <button style={S.btnSm} onClick={createTopic} disabled={!newTopicName.trim()}>+ Create</button>
          </div>
        </div>
      )}
      <div style={{ marginTop: 16 }}><a href="/" style={{ fontSize: 13, color: "#9B8E82" }}>← Back to Admin</a></div>
    </div>
  );
}
