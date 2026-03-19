"use client";

import { useState, useEffect } from "react";
import { adminFetch } from "../lib/api";

export default function ActivityTab() {
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await adminFetch("/api/admin/activity");
        setActivity(data);
      } catch (err) { setError(err.message); }
      finally { setLoading(false); }
    }
    load();
  }, []);

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

      {/* Recent topics */}
      <div style={{ marginBottom: "32px" }}>
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

      {/* Recent jobs */}
      <div>
        <h3 style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>Recent Jobs</h3>
        <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-card)", borderRadius: "var(--radius-lg)", padding: "24px", textAlign: "center" }}>
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Job log will appear here once generation pipeline is active.</p>
        </div>
      </div>
    </div>
  );
}
