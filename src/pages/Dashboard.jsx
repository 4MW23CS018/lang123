import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import LessonCard from "../components/lessons/LessonCard";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

// ── tiny helpers ──────────────────────────────────────────────────────────────

function ring(pct, color, size = 56, stroke = 5) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.8s ease" }} />
    </svg>
  );
}

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
// Simulated weekly XP — replace with real data when available
function weeklyXp(totalXp) {
  const seed = totalXp || 0;
  return DAYS.map((_, i) => Math.max(0, Math.floor(Math.sin(i + seed) * 30 + 35)));
}

// ── sub-components ────────────────────────────────────────────────────────────

function StatPill({ icon, value, label, color }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "10px",
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "14px", padding: "12px 16px", flex: 1, minWidth: 0,
    }}>
      <span style={{ fontSize: "22px" }}>{icon}</span>
      <div>
        <p style={{ color, fontSize: "18px", fontWeight: "800", margin: 0, lineHeight: 1 }}>{value}</p>
        <p style={{ color: "#6b7280", fontSize: "11px", margin: "3px 0 0", fontWeight: "500" }}>{label}</p>
      </div>
    </div>
  );
}

function DailyGoal({ xp, goalXp = 50 }) {
  const pct = Math.min(100, Math.round((xp / goalXp) * 100));
  const done = pct >= 100;
  return (
    <div style={{
      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "18px", padding: "22px 24px",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <div>
          <p style={{ color: "#6b7280", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1.2px", margin: "0 0 3px" }}>Daily Goal</p>
          <p style={{ color: "#fff", fontSize: "15px", fontWeight: "700", margin: 0 }}>
            {done ? "🎉 Goal complete!" : `${xp} / ${goalXp} XP`}
          </p>
        </div>
        <div style={{ position: "relative" }}>
          {ring(pct, done ? "#2ecc71" : "#facc15", 56, 5)}
          <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "800", color: done ? "#2ecc71" : "#facc15" }}>
            {pct}%
          </span>
        </div>
      </div>
      {/* Bar */}
      <div style={{ height: "6px", background: "rgba(255,255,255,0.07)", borderRadius: "999px", overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: "999px",
          width: `${pct}%`,
          background: done
            ? "linear-gradient(90deg, #2ecc71, #27ae60)"
            : "linear-gradient(90deg, #facc15, #f59e0b)",
          transition: "width 0.8s ease",
          boxShadow: done ? "0 0 8px rgba(46,204,113,0.5)" : "0 0 8px rgba(250,204,21,0.4)",
        }} />
      </div>
      {!done && (
        <p style={{ color: "#4b5563", fontSize: "12px", margin: "10px 0 0" }}>
          {goalXp - xp} XP to go · keep it up! 🚀
        </p>
      )}
    </div>
  );
}

function WeeklyChart({ xpArr }) {
  const max = Math.max(...xpArr, 1);
  const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
  return (
    <div style={{
      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "18px", padding: "22px 24px",
    }}>
      <p style={{ color: "#6b7280", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1.2px", margin: "0 0 20px" }}>
        Weekly Activity
      </p>
      <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "72px" }}>
        {xpArr.map((v, i) => {
          const h = Math.max(6, Math.round((v / max) * 64));
          const isToday = i === todayIdx;
          const isPast = i < todayIdx;
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
              <div style={{ position: "relative", width: "100%", display: "flex", justifyContent: "center" }}>
                {isToday && (
                  <div style={{ position: "absolute", top: `-${h + 6}px`, left: "50%", transform: "translateX(-50%)", background: "#2ecc71", color: "#000", fontSize: "9px", fontWeight: "800", padding: "2px 5px", borderRadius: "4px", whiteSpace: "nowrap" }}>
                    {v} XP
                  </div>
                )}
                <div style={{
                  width: "100%", maxWidth: "28px", height: `${h}px`, borderRadius: "6px 6px 3px 3px",
                  background: isToday
                    ? "linear-gradient(180deg, #2ecc71, #27ae60)"
                    : isPast ? "rgba(46,204,113,0.3)" : "rgba(255,255,255,0.07)",
                  boxShadow: isToday ? "0 0 10px rgba(46,204,113,0.4)" : "none",
                  transition: "height 0.5s ease",
                }} />
              </div>
              <span style={{ color: isToday ? "#2ecc71" : "#4b5563", fontSize: "10px", fontWeight: isToday ? "700" : "500" }}>
                {DAYS[i]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ContinueCard({ lesson }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link to={`/lesson/${lesson._id}`} style={{ textDecoration: "none" }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: hovered ? "rgba(46,204,113,0.1)" : "rgba(255,255,255,0.04)",
          border: `1px solid ${hovered ? "rgba(46,204,113,0.3)" : "rgba(255,255,255,0.08)"}`,
          borderRadius: "14px", padding: "16px 18px",
          display: "flex", alignItems: "center", gap: "14px",
          cursor: "pointer", transition: "all 0.2s",
          transform: hovered ? "translateY(-1px)" : "none",
        }}
      >
        <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(46,204,113,0.12)", border: "1px solid rgba(46,204,113,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontSize: "18px" }}>📖</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: "#fff", fontSize: "14px", fontWeight: "600", margin: "0 0 2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{lesson.title}</p>
          <p style={{ color: "#6b7280", fontSize: "12px", margin: 0 }}>{lesson.language} · Continue</p>
        </div>
        <span style={{ color: hovered ? "#2ecc71" : "#374151", fontSize: "18px", transition: "all 0.2s", transform: hovered ? "translateX(3px)" : "none" }}>→</span>
      </div>
    </Link>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const userId = localStorage.getItem("userId");
  const lessons = useQuery(api.lessons.list);
  const user = useQuery(api.users.get, userId ? { userId } : "skip");
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  if (!lessons || !user) return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: "40px", height: "40px", border: "3px solid rgba(46,204,113,0.2)", borderTop: "3px solid #2ecc71", borderRadius: "50%", margin: "0 auto 16px", animation: "spin 1s linear infinite" }} />
        <p style={{ color: "#6b7280", fontSize: "14px" }}>Loading your dashboard…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const xp = user.totalXp || 0;
  const streak = user.streak || 0;
  const dailyXp = xp % 50; // simulated daily XP — replace with real field if you have it
  const xpArr = weeklyXp(xp);
  const recentLesson = lessons[0];
  const recommendedLessons = lessons.slice(0, 3);

  const fadeIn = (delay = 0) => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? "none" : "translateY(12px)",
    transition: `opacity 0.4s ease ${delay}ms, transform 0.4s ease ${delay}ms`,
  });

  return (
    <div style={{ padding: "32px 24px", maxWidth: "1100px", margin: "0 auto" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }`}</style>

      {/* ── Welcome Banner ── */}
      <div style={{
        ...fadeIn(0),
        background: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "22px", padding: "28px 32px",
        marginBottom: "24px", position: "relative", overflow: "hidden",
        boxShadow: "0 8px 40px rgba(0,0,0,0.35)",
      }}>
        {/* Background glow blobs */}
        <div style={{ position: "absolute", top: "-60px", right: "-40px", width: "220px", height: "220px", background: "rgba(46,204,113,0.12)", borderRadius: "50%", filter: "blur(70px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "-40px", left: "30%", width: "160px", height: "160px", background: "rgba(99,102,241,0.08)", borderRadius: "50%", filter: "blur(60px)", pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "20px" }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#fff", margin: "0 0 6px", letterSpacing: "-0.4px" }}>
              Welcome back, <span style={{ color: "#2ecc71" }}>{user.name}</span>! 👋
            </h1>
            <p style={{ color: "#9ca3af", fontSize: "14px", margin: 0 }}>
              Ready to learn {lessons[0]?.language || "a new language"}?
            </p>
          </div>

          {/* Stat pills */}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <StatPill icon="🔥" value={`${streak}d`} label="Streak" color="#fb923c" />
            <StatPill icon="⭐" value={xp} label="Total XP" color="#facc15" />
            <StatPill icon="📚" value={lessons.length} label="Lessons" color="#818cf8" />
          </div>
        </div>
      </div>

      {/* ── Two-column: Goal + Weekly chart ── */}
      <div style={{ ...fadeIn(80), display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <DailyGoal xp={dailyXp} goalXp={50} />
        <WeeklyChart xpArr={xpArr} />
      </div>

      {/* ── Continue + Recommended ── */}
      <div style={{ ...fadeIn(160), display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px", marginBottom: "24px" }}>

        {/* Continue where you left off */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "18px", padding: "22px 24px" }}>
          <div style={{ marginBottom: "14px" }}>
            <p style={{ fontSize: "11px", fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: "1.2px", margin: "0 0 4px" }}>Continue</p>
            <div style={{ width: "28px", height: "2px", background: "#818cf8", borderRadius: "2px" }} />
          </div>
          {recentLesson
            ? <ContinueCard lesson={recentLesson} />
            : <p style={{ color: "#4b5563", fontSize: "13px" }}>No lessons started yet.</p>
          }
          <Link to="/lessons" style={{ display: "block", marginTop: "12px", textAlign: "center", color: "#6b7280", fontSize: "13px", textDecoration: "none", padding: "10px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#6b7280"; }}>
            View all lessons →
          </Link>
        </div>

        {/* Streak calendar (last 7 days dots) */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "18px", padding: "22px 24px" }}>
          <div style={{ marginBottom: "14px" }}>
            <p style={{ fontSize: "11px", fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: "1.2px", margin: "0 0 4px" }}>Streak Calendar</p>
            <div style={{ width: "28px", height: "2px", background: "#fb923c", borderRadius: "2px" }} />
          </div>
          <div style={{ display: "flex", gap: "6px", marginBottom: "16px" }}>
            {DAYS.map((d, i) => {
              const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
              const active = i <= todayIdx && streak > (todayIdx - i);
              const isToday = i === todayIdx;
              return (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "5px" }}>
                  <div style={{
                    width: "100%", maxWidth: "32px", aspectRatio: "1",
                    borderRadius: "8px",
                    background: active ? (isToday ? "#fb923c" : "rgba(251,146,60,0.35)") : "rgba(255,255,255,0.05)",
                    border: isToday ? "1.5px solid #fb923c" : "1px solid transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: isToday ? "0 0 10px rgba(251,146,60,0.4)" : "none",
                  }}>
                    {active && <span style={{ fontSize: "12px" }}>🔥</span>}
                  </div>
                  <span style={{ color: isToday ? "#fb923c" : "#4b5563", fontSize: "9px", fontWeight: isToday ? "700" : "400" }}>{d}</span>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(251,146,60,0.08)", border: "1px solid rgba(251,146,60,0.2)", borderRadius: "10px", padding: "10px 14px" }}>
            <span style={{ fontSize: "20px" }}>🔥</span>
            <div>
              <p style={{ color: "#fb923c", fontSize: "15px", fontWeight: "800", margin: 0 }}>{streak} day streak</p>
              <p style={{ color: "#6b7280", fontSize: "11px", margin: 0 }}>Keep it alive today!</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Recommended lessons ── */}
      <div style={fadeIn(240)}>
        <div style={{ marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: "11px", fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: "1.5px", margin: "0 0 4px" }}>Recommended for you</p>
            <div style={{ width: "32px", height: "2px", background: "#2ecc71", borderRadius: "2px" }} />
          </div>
          <Link to="/lessons" style={{ color: "#2ecc71", fontSize: "13px", fontWeight: "600", textDecoration: "none", opacity: 0.8 }}
            onMouseEnter={e => e.currentTarget.style.opacity = "1"}
            onMouseLeave={e => e.currentTarget.style.opacity = "0.8"}>
            See all →
          </Link>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "18px" }}>
          {recommendedLessons.map((lesson) => (
            <LessonCard key={lesson._id} lesson={lesson} />
          ))}
        </div>
      </div>
    </div>
  );
}