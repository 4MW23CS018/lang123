import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect, useState, useRef } from "react";

const style = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500;700&family=Syne:wght@700;800&display=swap');

  @keyframes floatUp {
    from { opacity: 0; transform: translateY(50px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-18px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes fadeDown {
    from { opacity: 0; transform: translateY(-12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }
  @keyframes pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0); }
    50%       { box-shadow: 0 0 0 8px rgba(245,158,11,0.12); }
  }

  .lb-header {
    opacity: 0;
    animation: fadeDown 0.6s cubic-bezier(.22,.68,0,1.2) 80ms forwards;
  }
  .lb-podium-3 {
    opacity: 0;
    animation: floatUp 0.75s cubic-bezier(.22,.68,0,1.2) 200ms forwards;
  }
  .lb-podium-1 {
    opacity: 0;
    animation: floatUp 0.85s cubic-bezier(.22,.68,0,1.2) 550ms forwards;
  }
  .lb-podium-2 {
    opacity: 0;
    animation: floatUp 0.75s cubic-bezier(.22,.68,0,1.2) 900ms forwards;
  }
  .lb-list-wrap {
    opacity: 0;
    animation: fadeDown 0.5s ease 1100ms forwards;
  }

  .lb-avatar:hover {
    transform: scale(1.12) !important;
  }
  .lb-row {
    transition: background 0.18s, transform 0.18s;
  }
  .lb-row:hover {
    background: rgba(255,255,255,0.04) !important;
    transform: translateX(5px);
  }

  .lb-glass {
    background: rgba(255,255,255,0.04);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.09);
    box-shadow: 0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08);
  }

  .lb-empty {
    opacity: 0;
    animation: fadeDown 0.5s ease 0.1s forwards;
  }
`;

function PodiumCard({ user, rank }) {
  const configs = {
    1: {
      animClass: "lb-podium-1",
      medal: "🥇",
      color: "#f59e0b",
      glow: "rgba(245,158,11,0.3)",
      border: "rgba(245,158,11,0.4)",
      bg: "rgba(245,158,11,0.1)",
      nameSz: 16,
      xpSz: 22,
      avatarSz: 66,
      avatarFontSz: 26,
      paddingTop: 0,
      baseH: 58,
      pulse: true,
    },
    2: {
      animClass: "lb-podium-2",
      medal: "🥈",
      color: "#9ca3af",
      glow: "rgba(156,163,175,0.2)",
      border: "rgba(156,163,175,0.3)",
      bg: "rgba(156,163,175,0.07)",
      nameSz: 13,
      xpSz: 16,
      avatarSz: 50,
      avatarFontSz: 19,
      paddingTop: 20,
      baseH: 36,
      pulse: false,
    },
    3: {
      animClass: "lb-podium-3",
      medal: "🥉",
      color: "#cd7c2f",
      glow: "rgba(180,110,60,0.2)",
      border: "rgba(180,110,60,0.3)",
      bg: "rgba(180,110,60,0.07)",
      nameSz: 13,
      xpSz: 16,
      avatarSz: 50,
      avatarFontSz: 19,
      paddingTop: 20,
      baseH: 36,
      pulse: false,
    },
  };

  const c = configs[rank];
  // podium visual order: 3rd=left(1), 1st=center(2), 2nd=right(3)
  const orderMap = { 1: 2, 2: 3, 3: 1 };

  return (
    <div className={c.animClass} style={{
      order: orderMap[rank],
      flex: rank === 1 ? "0 0 36%" : "0 0 28%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      paddingTop: c.paddingTop,
    }}>
      {/* Avatar */}
      <div
        className="lb-avatar"
        style={{
          width: c.avatarSz,
          height: c.avatarSz,
          borderRadius: "50%",
          background: c.bg,
          border: `2px solid ${c.border}`,
          boxShadow: `0 0 24px ${c.glow}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: c.avatarFontSz,
          fontWeight: 800,
          color: c.color,
          marginBottom: 8,
          transition: "transform 0.2s, box-shadow 0.2s",
          animation: c.pulse ? "pulse 2.5s ease-in-out 1.8s infinite" : "none",
          cursor: "default",
          fontFamily: "'Syne', sans-serif",
        }}
      >
        {user.name?.[0]?.toUpperCase()}
      </div>

      <span style={{ fontSize: rank === 1 ? 22 : 17, marginBottom: 4, lineHeight: 1 }}>{c.medal}</span>

      <p style={{
        color: "#e5e7eb",
        fontWeight: 700,
        fontFamily: "'Syne', sans-serif",
        fontSize: c.nameSz,
        margin: "0 0 4px",
        textAlign: "center",
        maxWidth: 110,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        letterSpacing: "-0.2px",
      }}>
        {user.name}
      </p>

      <span style={{
        fontWeight: 700,
        fontSize: c.xpSz,
        color: c.color,
        fontFamily: "'DM Mono', monospace",
        letterSpacing: "-0.5px",
      }}>
        {(user.totalXp || 0).toLocaleString()}
        <span style={{ fontSize: c.xpSz * 0.55, marginLeft: 3, opacity: 0.65, fontWeight: 500 }}>XP</span>
      </span>

      {/* Podium base */}
      <div style={{
        marginTop: 12,
        width: "100%",
        height: c.baseH,
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderBottom: "none",
        borderRadius: "10px 10px 0 0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 12,
        fontWeight: 800,
        color: c.color,
        fontFamily: "'Syne', sans-serif",
        backdropFilter: "blur(8px)",
      }}>
        #{rank}
      </div>
    </div>
  );
}

function ListRow({ user, index }) {
  const rank = index + 4;
  const delay = `${index * 55}ms`;

  return (
    <div
      className="lb-row"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 20px",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        cursor: "default",
        animation: `slideIn 0.45s ease ${delay} both`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{
          width: 32, height: 32,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 700,
          color: "#4b5563",
          fontFamily: "'DM Mono', monospace",
          background: "rgba(255,255,255,0.035)",
          borderRadius: 7,
          flexShrink: 0,
        }}>
          {rank}
        </span>

        {/* Mini avatar */}
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.1)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 700, color: "#9ca3af",
          fontFamily: "'Syne', sans-serif",
          flexShrink: 0,
        }}>
          {user.name?.[0]?.toUpperCase()}
        </div>

        <span style={{ fontWeight: 600, color: "#9ca3af", fontSize: 14, fontFamily: "'Syne', sans-serif" }}>
          {user.name}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {user.streak > 0 && (
          <span style={{
            background: "rgba(251,146,60,0.1)",
            border: "1px solid rgba(251,146,60,0.18)",
            color: "#fb923c",
            fontSize: 11, fontWeight: 700,
            padding: "2px 8px", borderRadius: 999,
          }}>
            🔥 {user.streak}
          </span>
        )}
        <span style={{
          fontWeight: 700, fontSize: 13,
          color: "#2ecc71",
          fontFamily: "'DM Mono', monospace",
          minWidth: 54, textAlign: "right",
        }}>
          {(user.totalXp || 0).toLocaleString()} XP
        </span>
      </div>
    </div>
  );
}

export default function Leaderboard() {
  const users = useQuery(api.users.getLeaderboard) || [];
  const top3 = users.slice(0, 3);
  const rest = users.slice(3);

  return (
    <>
      <style>{style}</style>
      <div style={{ padding: "40px 24px", maxWidth: 720, margin: "0 auto" }}>

        {/* Header */}
        <div className="lb-header" style={{ marginBottom: 32 }}>
          <h1 style={{
            fontSize: 30, fontWeight: 800, color: "#fff",
            margin: "0 0 4px", letterSpacing: "-0.8px",
            fontFamily: "'Syne', sans-serif",
          }}>
            Leaderboard
          </h1>
          <p style={{ color: "#4b5563", fontSize: 13, margin: 0 }}>
            Top learners ranked by XP earned
          </p>
        </div>

        {/* Podium */}
        {top3.length > 0 && (
          <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-end",
            gap: 6,
            padding: "0 4px",
          }}>
            <PodiumCard user={top3[0]} rank={1} />
            {top3[1] && <PodiumCard user={top3[1]} rank={2} />}
            {top3[2] && <PodiumCard user={top3[2]} rank={3} />}
          </div>
        )}

        {/* Rest list — glassmorphism card */}
        {rest.length > 0 && (
          <div className="lb-list-wrap lb-glass" style={{
            borderRadius: "0 0 20px 20px",
            overflow: "hidden",
          }}>
            <div style={{
              display: "flex", justifyContent: "space-between",
              padding: "8px 20px",
              background: "rgba(0,0,0,0.18)",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "1.2px", fontFamily: "'DM Mono', monospace" }}>
                Rank · Learner
              </span>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "1.2px", fontFamily: "'DM Mono', monospace" }}>
                Score
              </span>
            </div>
            {rest.map((user, i) => (
              <ListRow key={user._id} user={user} index={i} />
            ))}
          </div>
        )}

        {users.length === 0 && (
          <p className="lb-empty" style={{ textAlign: "center", color: "#4b5563", padding: "52px 0", fontSize: 14 }}>
            No learners yet — be the first!
          </p>
        )}
      </div>
    </>
  );
}