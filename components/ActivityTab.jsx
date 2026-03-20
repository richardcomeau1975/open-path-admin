"use client";

import { useState, useEffect, useRef } from "react";
import { adminFetch } from "../lib/api";

const STATUS_COLORS = {
  completed: "var(--status-green, #4A7C59)",
  running: "var(--status-amber, #C4972A)",
  queued: "var(--status-amber, #C4972A)",
  failed: "var(--status-red, #C44A2A)",
};

export default function ActivityTab() {
  const [activity, setActivity] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rerunning, setRerunning] = useState(null);

  const fetchActivity = async () => {
    try {
      const data = await adminFetch("/api/admin/activity");
      setActivity(data);
    } catch (err) {
      console.error("Failed to fetch activity:", err);
    }
  };

  const fetchJobs = async () => {
    try {
      const data = await adminFetch("/api/admin/batch-jobs");
      setJobs(data.jobs || []);
    } catch (err) {
      console.error("Failed to fetch batch jobs:", err);
    }
  };

  useEffect(() => {
    async function load() {
      try {
        await Promise.all([fetchActivity(), fetchJobs()]);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Auto-refresh when jobs are running
  useEffect(() => {
    if (jobs.some((j) => j.status === "running" || j.status === "queued")) {
      const id = setInterval(fetchJobs, 10000);
      return () => clearInterval(id);
    }
  }, [jobs]);

  const handleRerun = async (topicId) => {
    setRerunning(topicId);
    try {
      await adminFetch(`/api/admin/topics/${topicId}/rerun`, { method: "POST" });
      setTimeout(fetchJobs, 1000);
    } catch (err) {
      console.error("Re-run failed:", err);
    } finally {
      setRerunning(null);
    }
  };

  const formatTime = (ts) => {
    if (!ts) return "—";
    return new Date(ts).toLocaleString();
  };

  if (loading) return <p style={{ color: "var(--text-muted)" }}>Loading...</p>;
  if (error) return <p style={{ color: "var(--status-amber)" }}>Error: {error}</p>;

  const stats = activity?.stats || {};

  return (
    <div>
      <h2 style={{ fontFamily: "var(--font-display), 'Lora', serif", fontSize: "22px", fontWeight: 600, marginBottom: "20px" }}>Activity</h2>

      {/* Stats cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "32px" }}>
        {[
          { label: "Students", value: stats.students || 0 },
          { label: "Courses", value: stats.courses || 0 },
          { label: "Topics", value: stats.topics || 0 },
        ].map((stat) => (
          <div key={stat.label} style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-card)", borderRadius: "var(--radius-lg)", padding: "24px", textAlign: "center" }}>
            <p style={{ fontSize: "32px", fontWeight: 600, fontFamily: "var(--font-display), 'Lora', serif", color: "var(--text-primary)" }}>{stat.value}</p>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Batch Jobs */}
      <div style={{ marginBottom: "32px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>Batch Jobs</h3>

        {jobs.length === 0 ? (
          <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-card)", borderRadius: "var(--radius-lg)", padding: "24px", textAlign: "center" }}>
            <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>No batch jobs yet.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {jobs.map((job) => (
              <div
                key={job.id}
                style={{
                  backgroundColor: "var(--bg-card)",
                  border: "1px solid var(--border-card)",
                  borderRadius: "var(--radius-lg)",
                  padding: "16px 20px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div>
                    <span style={{ fontFamily: "var(--font-display), 'Lora', serif", fontWeight: 600, fontSize: "16px" }}>
                      {job.topic_name}
                    </span>
                    <span
                      style={{
                        marginLeft: "12px",
                        padding: "2px 10px",
                        borderRadius: "12px",
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "#fff",
                        background: STATUS_COLORS[job.status] || "var(--text-muted)",
                      }}
                    >
                      {job.status}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRerun(job.topic_id)}
                    disabled={rerunning === job.topic_id || job.status === "running"}
                    style={{
                      padding: "6px 16px",
                      background: rerunning === job.topic_id || job.status === "running" ? "#ccc" : "var(--accent, #9B8E82)",
                      color: "#fff",
                      border: "none",
                      borderRadius: "var(--radius, 8px)",
                      cursor: rerunning === job.topic_id || job.status === "running" ? "not-allowed" : "pointer",
                      fontFamily: "var(--font-body), 'Inter', sans-serif",
                      fontSize: "13px",
                      fontWeight: 500,
                    }}
                  >
                    {rerunning === job.topic_id ? "Starting..." : "Re-run"}
                  </button>
                </div>

                <div style={{ fontSize: "13px", color: "var(--text-muted)", fontFamily: "var(--font-body), 'Inter', sans-serif" }}>
                  {job.current_step && job.status === "running" && (
                    <div style={{ marginBottom: "4px" }}>
                      Current step: <strong>{job.current_step}</strong>
                    </div>
                  )}
                  <div>Started: {formatTime(job.started_at)}</div>
                  {job.completed_at && <div>Completed: {formatTime(job.completed_at)}</div>}
                  {job.error_log && (
                    <div style={{ marginTop: "8px", padding: "8px 12px", background: "#FFF0F0", borderRadius: "var(--radius, 8px)", color: "#C44A2A", fontSize: "12px", whiteSpace: "pre-wrap" }}>
                      {job.error_log}
                    </div>
                  )}
                </div>

                {job.steps_completed && job.steps_completed.length > 0 && (
                  <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--text-muted)" }}>
                    Steps: {job.steps_completed.length}/8 complete
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent topics */}
      <div>
        <h3 style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>Recent Topics</h3>
        {(activity?.recent_topics || []).length === 0 ? (
          <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-card)", borderRadius: "var(--radius-lg)", padding: "24px", textAlign: "center" }}>
            <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>No topics yet.</p>
          </div>
        ) : (
          (activity?.recent_topics || []).slice(0, 20).map((topic) => (
            <div key={topic.id} style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-card)", borderRadius: "var(--radius)", padding: "12px 18px", marginBottom: "6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: "14px" }}>{topic.name}</span>
                {topic.courses && <span style={{ fontSize: "12px", color: "var(--text-muted)", marginLeft: "10px" }}>{topic.courses.name}</span>}
              </div>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{new Date(topic.created_at).toLocaleString()}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
