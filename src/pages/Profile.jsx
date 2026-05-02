import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";

const style = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500;700&family=Syne:wght@700;800&display=swap');

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeDown {
    from { opacity: 0; transform: translateY(-10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes xpFill {
    from { width: 0%; }
  }
  @keyframes countUp {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes badgePop {
    0%   { transform: scale(0.7); opacity: 0; }
    70%  { transform: scale(1.08); }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes glowPulse {
    0%,100% { box-shadow: 0 0 0 0 rgba(46,204,113,0); }
    50%      { box-shadow: 0 0 16px 4px rgba(46,204,113,0.15); }
  }

  .pf-header   { opacity:0; animation: fadeDown 0.5s ease 60ms forwards; }
  .pf-card     { opacity:0; animation: fadeUp 0.55s cubic-bezier(.22,.68,0,1.2) 120ms forwards; }
  .pf-stats    { opacity:0; animation: fadeUp 0.5s ease 260ms forwards; }
  .pf-level    { opacity:0; animation: fadeUp 0.5s ease 330ms forwards; }
  .pf-badges   { opacity:0; animation: fadeUp 0.5s ease 400ms forwards; }
  .pf-activity { opacity:0; animation: fadeUp 0.5s ease 470ms forwards; }
  .pf-logout   { opacity:0; animation: fadeUp 0.5s ease 540ms forwards; }

  .xp-bar {
    animation: xpFill 1.1s cubic-bezier(.22,.68,0,1.2) 700ms both;
  }

  .badge-item {
    opacity: 0;
    animation: badgePop 0.45s cubic-bezier(.22,.68,0,1.2) both;
    cursor: default;
    transition: transform 0.2s;
  }
  .badge-item:hover { transform: scale(1.1) translateY(-2px); }

  .stat-card {
    transition: transform 0.2s, box-shadow 0.2s;
    cursor: default;
  }
  .stat-card:hover {
    transform: translateY(-3px);
  }

  .logout-btn {
    transition: background 0.2s, border-color 0.2s, transform 0.1s;
  }
  .logout-btn:hover {
    background: rgba(239,68,68,0.15) !important;
    border-color: rgba(239,68,68,0.38) !important;
  }
  .logout-btn:active {
    transform: scale(0.98);
  }

  .heat-cell {
    transition: transform 0.15s;
    cursor: default;
  }
  .heat-cell:hover {
    transform: scale(1.3);
  }

  .avatar-ring {
    animation: glowPulse 3s ease-in-out 1.5s infinite;
  }
`;

// ── XP / Level helpers ───────────────────────────────────────────────────────
function getLevel(xp) {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}
function xpForLevel(lvl) {
  return Math.pow(lvl - 1, 2) * 100;
}
function xpProgress(xp) {
  const lvl = getLevel(xp);
  const curr = xpForLevel(lvl);
  const next = xpForLevel(lvl + 1);
  return { lvl, curr, next, pct: Math.round(((xp - curr) / (next - curr)) * 100) };
}

// ── Achievements definition ──────────────────────────────────────────────────
function getAchievements(user) {
  const xp = user?.totalXp || 0;
  const streak = user?.streak || 0;
  return [
    { id: "first_xp",    icon: "⚡", label: "First Spark",    desc: "Earned your first XP",        unlocked: xp >= 1 },
    { id: "xp_100",      icon: "🌱", label: "Seedling",       desc: "Reached 100 XP",               unlocked: xp >= 100 },
    { id: "xp_500",      icon: "🚀", label: "Accelerating",   desc: "Reached 500 XP",               unlocked: xp >= 500 },
    { id: "xp_1000",     icon: "🔮", label: "Scholar",        desc: "Reached 1 000 XP",             unlocked: xp >= 1000 },
    { id: "xp_5000",     icon: "👑", label: "Grand Master",   desc: "Reached 5 000 XP",             unlocked: xp >= 5000 },
    { id: "streak_3",    icon: "🔥", label: "On Fire",        desc: "3-day streak",                 unlocked: streak >= 3 },
    { id: "streak_7",    icon: "💎", label: "Diamond Habit",  desc: "7-day streak",                 unlocked: streak >= 7 },
    { id: "streak_30",   icon: "🌟", label: "Legendary",      desc: "30-day streak",                unlocked: streak >= 30 },
  ];
}

// ── Mock activity heatmap (last 14 days) ────────────────────────────────────
// In a real app this would come from your DB; we'll generate plausible data from xp+streak
function mockActivity(user) {
  const streak = user?.streak || 0;
  const days = 14;
  return Array.from({ length: days }, (_, i) => {
    const daysAgo = days - 1 - i;
    if (daysAgo < streak) return Math.floor(Math.random() * 3) + 1; // 1-3
    if (daysAgo === streak) return Math.floor(Math.random() * 2);   // maybe 0-1
    return Math.random() > 0.65 ? 1 : 0;
  });
}

function heatColor(v) {
  if (v === 0) return "rgba(255,255,255,0.05)";
  if (v === 1) return "rgba(46,204,113,0.25)";
  if (v === 2) return "rgba(46,204,113,0.55)";
  return "rgba(46,204,113,0.9)";
}

// ── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, accent, sub, delay }) {
  return (
    <div className="stat-card" style={{
      background: `rgba(${accent}, 0.07)`,
      border: `1px solid rgba(${accent}, 0.16)`,
      borderRadius: 14,
      padding: "18px 16px",
      animationDelay: delay,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <span style={{ fontSize: 13 }}>{icon}</span>
        <p style={{
          color: "#4b5563", fontSize: 10.5, fontWeight: 700, margin: 0,
          textTransform: "uppercase", letterSpacing: "0.9px",
          fontFamily: "'DM Mono', monospace",
        }}>
          {label}
        </p>
      </div>
      <p style={{
        color: `rgb(${accent})`, fontSize: 30, fontWeight: 800,
        margin: 0, letterSpacing: "-1.2px",
        fontFamily: "'DM Mono', monospace", lineHeight: 1,
      }}>
        {value}
      </p>
      {sub && <p style={{ color: "#4b5563", fontSize: 11, margin: "5px 0 0", fontWeight: 500 }}>{sub}</p>}
    </div>
  );
}

// ── Section label ─────────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <p style={{
      fontSize: 10, fontWeight: 700, color: "#374151",
      textTransform: "uppercase", letterSpacing: "1.1px", margin: "0 0 12px",
      fontFamily: "'DM Mono', monospace",
    }}>
      {children}
    </p>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────
function Divider() {
  return <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "22px 0" }} />;
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Profile() {
  const userId = localStorage.getItem("userId");
  const user = useQuery(api.users.get, userId ? { userId } : "skip");
  const navigate = useNavigate();
  const [xpVisible, setXpVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setXpVisible(true), 750);
    return () => clearTimeout(t);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("userId");
    navigate("/");
  };

  if (!user) return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 34, height: 34, borderRadius: "50%",
          border: "2.5px solid rgba(46,204,113,0.25)",
          borderTopColor: "#2ecc71",
          animation: "spin 0.75s linear infinite",
          margin: "0 auto 12px",
        }} />
        <p style={{ color: "#4b5563", fontSize: 13, margin: 0 }}>Loading profile…</p>
      </div>
    </div>
  );

  const initial = user.name?.[0]?.toUpperCase() ?? "?";
  const { lvl, curr, next, pct } = xpProgress(user.totalXp || 0);
  const achievements = getAchievements(user);
  const activity = mockActivity(user);

  const joinedDate = user._creationTime
    ? new Date(user._creationTime).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;

  return (
    <>
      <style>{style}</style>
      <div style={{ padding: "40px 24px", maxWidth: 500, margin: "0 auto" }}>

        {/* Page title */}
        <div className="pf-header" style={{ marginBottom: 26 }}>
          <h1 style={{
            fontSize: 30, fontWeight: 800, color: "#fff",
            margin: 0, letterSpacing: "-0.7px",
            fontFamily: "'Syne', sans-serif",
          }}>
            Profile
          </h1>
        </div>

        {/* Main card */}
        <div className="pf-card" style={{
          background: "rgba(255,255,255,0.03)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 22,
          padding: "28px 24px",
          boxShadow: "0 24px 48px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.07)",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Subtle top-right glow blob */}
          <div style={{
            position: "absolute", top: -50, right: -50,
            width: 180, height: 180,
            background: "radial-gradient(circle, rgba(46,204,113,0.07) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />

          {/* ── Avatar + Name row ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 0 }}>
            <div className="avatar-ring" style={{
              width: 58, height: 58, borderRadius: "50%",
              background: "rgba(46,204,113,0.1)",
              border: "2px solid rgba(46,204,113,0.35)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, fontWeight: 800, color: "#2ecc71",
              fontFamily: "'Syne', sans-serif",
              flexShrink: 0,
            }}>
              {initial}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                color: "#e5e7eb", fontWeight: 800, fontSize: 17,
                margin: "0 0 2px", letterSpacing: "-0.3px",
                fontFamily: "'Syne', sans-serif",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {user.name}
              </p>
              <p style={{ color: "#374151", fontSize: 12, margin: 0, fontWeight: 500 }}>
                Level {lvl} Learner{joinedDate ? ` · Joined ${joinedDate}` : ""}
              </p>
            </div>
          </div>

          <Divider />

          {/* ── Stat Cards ── */}
          <div className="pf-stats">
            <SectionLabel>Statistics</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 0 }}>
              <StatCard
                label="Total XP" icon="⚡"
                value={(user.totalXp || 0).toLocaleString()}
                accent="46,204,113" delay="280ms"
              />
              <StatCard
                label="Streak" icon="🔥"
                value={user.streak || 0}
                accent="251,146,60"
                sub="days in a row"
                delay="340ms"
              />
            </div>
          </div>

          <Divider />

          {/* ── Level & XP Progress ── */}
          <div className="pf-level">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
              <SectionLabel>Level Progress</SectionLabel>
              <span style={{
                fontSize: 11, color: "#4b5563", fontFamily: "'DM Mono', monospace",
              }}>
                Lvl {lvl} → {lvl + 1}
              </span>
            </div>

            {/* Bar track */}
            <div style={{
              height: 8, borderRadius: 99,
              background: "rgba(255,255,255,0.06)",
              overflow: "hidden",
              marginBottom: 6,
            }}>
              <div className="xp-bar" style={{
                height: "100%",
                width: `${xpVisible ? pct : 0}%`,
                background: "linear-gradient(90deg, #16a34a, #2ecc71)",
                borderRadius: 99,
                transition: "width 1.1s cubic-bezier(.22,.68,0,1.2)",
              }} />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 10.5, color: "#374151", fontFamily: "'DM Mono', monospace" }}>
                {((user.totalXp || 0) - curr).toLocaleString()} XP
              </span>
              <span style={{ fontSize: 10.5, color: "#374151", fontFamily: "'DM Mono', monospace" }}>
                {(next - curr).toLocaleString()} XP needed
              </span>
            </div>
          </div>

          <Divider />

          {/* ── Achievements ── */}
          <div className="pf-badges">
            <SectionLabel>Achievements</SectionLabel>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 8,
            }}>
              {achievements.map((a, i) => (
                <div
                  key={a.id}
                  className="badge-item"
                  title={a.unlocked ? `${a.label}: ${a.desc}` : `Locked: ${a.desc}`}
                  style={{
                    animationDelay: `${480 + i * 55}ms`,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 5,
                    padding: "10px 6px",
                    borderRadius: 12,
                    background: a.unlocked ? "rgba(46,204,113,0.07)" : "rgba(255,255,255,0.02)",
                    border: a.unlocked ? "1px solid rgba(46,204,113,0.2)" : "1px solid rgba(255,255,255,0.05)",
                    filter: a.unlocked ? "none" : "grayscale(1) opacity(0.3)",
                  }}
                >
                  <span style={{ fontSize: 20 }}>{a.icon}</span>
                  <span style={{
                    fontSize: 9.5, fontWeight: 700, color: a.unlocked ? "#6ee7b7" : "#374151",
                    textAlign: "center", lineHeight: 1.2,
                    fontFamily: "'DM Mono', monospace",
                  }}>
                    {a.label}
                  </span>
                </div>
              ))}
            </div>

            <p style={{ color: "#374151", fontSize: 11, margin: "10px 0 0", textAlign: "right" }}>
              {achievements.filter(a => a.unlocked).length}/{achievements.length} unlocked
            </p>
          </div>

          <Divider />

          {/* ── Activity Heatmap ── */}
          <div className="pf-activity">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
              <SectionLabel>Activity — Last 14 Days</SectionLabel>
            </div>
            <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
              {activity.map((v, i) => (
                <div key={i} className="heat-cell" style={{
                  flex: 1,
                  height: 28,
                  borderRadius: 5,
                  background: heatColor(v),
                  border: "1px solid rgba(255,255,255,0.04)",
                  animationDelay: `${500 + i * 35}ms`,
                }} title={v === 0 ? "No activity" : `${v} session${v > 1 ? "s" : ""}`} />
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 7, justifyContent: "flex-end" }}>
              <span style={{ fontSize: 10, color: "#374151" }}>Less</span>
              {[0, 1, 2, 3].map(v => (
                <div key={v} style={{ width: 10, height: 10, borderRadius: 3, background: heatColor(v) }} />
              ))}
              <span style={{ fontSize: 10, color: "#374151" }}>More</span>
            </div>
          </div>

          <Divider />

          {/* ── Log out ── */}
          <div className="pf-logout">
            <button
              className="logout-btn"
              onClick={handleLogout}
              style={{
                width: "100%", padding: "12px",
                background: "rgba(239,68,68,0.07)",
                border: "1px solid rgba(239,68,68,0.18)",
                borderRadius: 12, color: "#f87171",
                fontWeight: 700, fontSize: 14,
                cursor: "pointer",
                fontFamily: "'Syne', sans-serif",
                letterSpacing: "-0.2px",
              }}
            >
              Log out
            </button>
          </div>
        </div>
      </div>
    </>
  );
}