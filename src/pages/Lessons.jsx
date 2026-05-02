import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Link } from "react-router-dom";
import { useState } from "react";

// SVG Illustrations (inline, no external deps)
const IllustrationStudy = () => (
  <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="72" height="72" rx="18" fill="rgba(46,204,113,0.1)"/>
    <rect x="18" y="22" width="28" height="4" rx="2" fill="rgba(46,204,113,0.5)"/>
    <rect x="18" y="30" width="36" height="3" rx="1.5" fill="rgba(255,255,255,0.2)"/>
    <rect x="18" y="37" width="30" height="3" rx="1.5" fill="rgba(255,255,255,0.15)"/>
    <rect x="18" y="44" width="24" height="3" rx="1.5" fill="rgba(255,255,255,0.1)"/>
    <circle cx="54" cy="50" r="10" fill="rgba(46,204,113,0.2)" stroke="#2ecc71" strokeWidth="1.5"/>
    <path d="M50 50l3 3 5-6" stroke="#2ecc71" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IllustrationMic = () => (
  <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="72" height="72" rx="18" fill="rgba(99,102,241,0.1)"/>
    <rect x="30" y="16" width="12" height="22" rx="6" fill="rgba(99,102,241,0.4)" stroke="rgba(99,102,241,0.8)" strokeWidth="1.5"/>
    <path d="M22 36c0 7.732 6.268 14 14 14s14-6.268 14-14" stroke="rgba(99,102,241,0.8)" strokeWidth="2" strokeLinecap="round"/>
    <line x1="36" y1="50" x2="36" y2="58" stroke="rgba(99,102,241,0.8)" strokeWidth="2" strokeLinecap="round"/>
    <line x1="28" y1="58" x2="44" y2="58" stroke="rgba(99,102,241,0.8)" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const IllustrationVocab = () => (
  <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="72" height="72" rx="18" fill="rgba(251,191,36,0.1)"/>
    <rect x="14" y="20" width="44" height="32" rx="6" fill="none" stroke="rgba(251,191,36,0.5)" strokeWidth="1.5"/>
    <rect x="20" y="28" width="14" height="14" rx="3" fill="rgba(251,191,36,0.25)"/>
    <rect x="38" y="28" width="14" height="4" rx="2" fill="rgba(251,191,36,0.4)"/>
    <rect x="38" y="36" width="10" height="3" rx="1.5" fill="rgba(255,255,255,0.2)"/>
    <text x="24" y="40" fontSize="10" fill="rgba(251,191,36,0.9)" fontWeight="bold">あ</text>
    <circle cx="58" cy="20" r="8" fill="rgba(251,191,36,0.2)" stroke="rgba(251,191,36,0.6)" strokeWidth="1.5"/>
    <path d="M55 20l2 2 4-4" stroke="rgba(251,191,36,0.9)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IllustrationStory = () => (
  <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="72" height="72" rx="18" fill="rgba(236,72,153,0.1)"/>
    <rect x="14" y="18" width="26" height="36" rx="4" fill="none" stroke="rgba(236,72,153,0.5)" strokeWidth="1.5"/>
    <rect x="18" y="24" width="18" height="2.5" rx="1.25" fill="rgba(236,72,153,0.5)"/>
    <rect x="18" y="30" width="14" height="2" rx="1" fill="rgba(255,255,255,0.2)"/>
    <rect x="18" y="35" width="16" height="2" rx="1" fill="rgba(255,255,255,0.15)"/>
    <rect x="18" y="40" width="12" height="2" rx="1" fill="rgba(255,255,255,0.1)"/>
    <circle cx="50" cy="36" r="14" fill="rgba(236,72,153,0.15)" stroke="rgba(236,72,153,0.5)" strokeWidth="1.5"/>
    <path d="M46 36l6-4v8l-6-4z" fill="rgba(236,72,153,0.8)"/>
  </svg>
);

const IllustrationLocked = () => (
  <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="72" height="72" rx="18" fill="rgba(107,114,128,0.1)"/>
    <rect x="22" y="36" width="28" height="20" rx="5" fill="rgba(107,114,128,0.3)" stroke="rgba(107,114,128,0.5)" strokeWidth="1.5"/>
    <path d="M28 36v-6a8 8 0 0116 0v6" stroke="rgba(107,114,128,0.5)" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="36" cy="44" r="3" fill="rgba(107,114,128,0.7)"/>
    <line x1="36" y1="47" x2="36" y2="51" stroke="rgba(107,114,128,0.7)" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

function ProgressBar({ value, max, color = "#2ecc71" }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <div style={{ flex: 1, height: "5px", background: "rgba(255,255,255,0.08)", borderRadius: "999px", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: "999px", transition: "width 0.5s ease" }} />
      </div>
      <span style={{ color: "#6b7280", fontSize: "12px", minWidth: "40px", textAlign: "right" }}>{value}/{max}</span>
    </div>
  );
}

function ModeCard({ illustration: Illustration, title, subtitle, meta, progress, progressColor, to, locked, badge, badgeColor }) {
  const [hovered, setHovered] = useState(false);

  const content = (
    <div
      onMouseEnter={() => !locked && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: "20px",
        background: locked ? "rgba(255,255,255,0.02)" : hovered ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)",
        backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        border: `1px solid ${hovered && !locked ? "rgba(46,204,113,0.25)" : "rgba(255,255,255,0.08)"}`,
        borderRadius: "18px", padding: "22px 24px",
        transition: "all 0.2s ease",
        cursor: locked ? "default" : "pointer",
        position: "relative", overflow: "hidden",
        opacity: locked ? 0.6 : 1,
        transform: hovered && !locked ? "translateY(-2px)" : "none",
        boxShadow: hovered && !locked ? "0 12px 32px rgba(0,0,0,0.3)" : "0 4px 16px rgba(0,0,0,0.2)",
      }}
    >
      {/* Glow on hover */}
      {hovered && !locked && (
        <div style={{ position: "absolute", top: "-30px", right: "-30px", width: "120px", height: "120px", background: `${progressColor || "rgba(46,204,113,0.15)"}`, borderRadius: "50%", filter: "blur(50px)", pointerEvents: "none" }} />
      )}

      {/* Illustration */}
      <div style={{ flexShrink: 0 }}>
        {locked ? <IllustrationLocked /> : <Illustration />}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
          <h3 style={{ color: locked ? "#6b7280" : "#fff", fontSize: "16px", fontWeight: "700", margin: 0, letterSpacing: "-0.2px" }}>
            {title}
          </h3>
          {badge && (
            <span style={{ fontSize: "10px", fontWeight: "700", padding: "2px 8px", borderRadius: "999px", background: `${badgeColor || "rgba(46,204,113,0.15)"}`, color: badgeColor ? "#fff" : "#2ecc71", border: `1px solid ${badgeColor || "rgba(46,204,113,0.3)"}` }}>
              {badge}
            </span>
          )}
        </div>
        <p style={{ color: "#9ca3af", fontSize: "13px", margin: "0 0 12px" }}>{subtitle}</p>
        {progress ? (
          <ProgressBar value={progress.done} max={progress.total} color={progressColor} />
        ) : meta ? (
          <span style={{ color: "#6b7280", fontSize: "13px" }}>{meta}</span>
        ) : null}
      </div>

      {/* Arrow */}
      {!locked && (
        <div style={{ color: hovered ? (progressColor?.replace("0.15", "1") || "#2ecc71") : "#374151", fontSize: "20px", transition: "all 0.2s", transform: hovered ? "translateX(3px)" : "none", flexShrink: 0 }}>
          →
        </div>
      )}
    </div>
  );

  return locked ? content : <Link to={to} style={{ textDecoration: "none" }}>{content}</Link>;
}

function LessonListItem({ lesson, index, accentColor = "#2ecc71" }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link to={`/lessons/${lesson._id}`} style={{ textDecoration: "none" }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: "flex", alignItems: "center", gap: "16px",
          padding: "14px 18px", borderRadius: "12px",
          background: hovered ? accentColor + "12" : "transparent",
          border: `1px solid ${hovered ? accentColor + "35" : "rgba(255,255,255,0.05)"}`,
          cursor: "pointer", transition: "all 0.15s",
          marginBottom: "6px",
        }}
      >
        <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: accentColor + "18", border: `1px solid ${accentColor}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ color: accentColor, fontSize: "13px", fontWeight: "700" }}>{index + 1}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: "#e5e7eb", fontSize: "14px", fontWeight: "600", margin: "0 0 2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{lesson.title}</p>
          <p style={{ color: "#6b7280", fontSize: "12px", margin: 0 }}>{lesson.language} · Beginner</p>
        </div>
        <span style={{ color: hovered ? accentColor : "#374151", fontSize: "16px", transition: "color 0.15s", flexShrink: 0 }}>→</span>
      </div>
    </Link>
  );
}

const LANG_META = {
  Kannada:  { color: "#2ecc71", emoji: "🟢" },
  Tamil:    { color: "#818cf8", emoji: "🟣" },
  Telugu:   { color: "#fb923c", emoji: "🟠" },
  Malayalam:{ color: "#ec4899", emoji: "🩷" },
  Tulu:     { color: "#34d399", emoji: "🩵" },
  Kodava:   { color: "#facc15", emoji: "🟡" },
};

function LanguageGroupedLessons({ lessons }) {
  const groups = lessons.reduce((acc, lesson) => {
    const lang = lesson.language || "Other";
    if (!acc[lang]) acc[lang] = [];
    acc[lang].push(lesson);
    return acc;
  }, {});

  return (
    <>
      {Object.entries(groups).map(([lang, langLessons]) => {
        const { color, emoji } = LANG_META[lang] || { color: "#6b7280", emoji: "📖" };
        return (
          <div key={lang} style={{ marginBottom: "28px" }}>
            {/* Language header */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
              <div style={{ width: "34px", height: "34px", borderRadius: "9px", background: color + "18", border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0 }}>
                {emoji}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ color: "#fff", fontSize: "15px", fontWeight: "700", margin: 0 }}>{lang}</p>
                <p style={{ color: "#6b7280", fontSize: "11px", margin: 0 }}>{langLessons.length} lesson{langLessons.length !== 1 ? "s" : ""}</p>
              </div>
              <span style={{ color, fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", background: color + "15", border: `1px solid ${color}25`, padding: "3px 10px", borderRadius: "999px" }}>Beginner</span>
            </div>

            {/* Lesson items */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "14px", padding: "8px" }}>
              {langLessons.map((lesson, i) => (
                <LessonListItem key={lesson._id} lesson={lesson} index={i} accentColor={color} />
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}

export default function Lessons() {
  const lessons = useQuery(api.lessons.list);
  const userId = localStorage.getItem("userId");
  const user = useQuery(api.users.get, userId ? { userId } : "skip");

  const done = lessons ? Math.min(2, lessons.length) : 0;
  const total = lessons?.length || 6;

  return (
    <div style={{ padding: "32px 24px", maxWidth: "780px", margin: "0 auto" }}>

      {/* Page Header */}
      <div style={{ marginBottom: "32px" }}>
        <p style={{ fontSize: "11px", fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: "1.5px", margin: "0 0 4px" }}>Your Library</p>
        <div style={{ width: "32px", height: "2px", background: "#2ecc71", borderRadius: "2px", marginBottom: "12px" }} />
        <h1 style={{ color: "#fff", fontSize: "26px", fontWeight: "800", margin: 0, letterSpacing: "-0.5px" }}>Lessons</h1>
      </div>

      {/* Mode Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "40px" }}>

        <ModeCard
          illustration={IllustrationStudy}
          title="Structured Lessons"
          subtitle="Step-by-step guided learning"
          progress={{ done, total }}
          progressColor="#2ecc71"
          to="/lessons/structured"
          badge={`Unit ${Math.ceil((done + 1) / 6)}`}
          badgeColor={null}
        />

        <ModeCard
          illustration={IllustrationMic}
          title="Free Speak"
          subtitle="Anything goes — just talk!"
          meta="5:00 session"
          progressColor="rgba(99,102,241,0.5)"
          to="/practice/freespeak"
          badge="LIVE"
          badgeColor="rgba(99,102,241,0.7)"
        />

        <ModeCard
          illustration={IllustrationVocab}
          title="Vocab Revision"
          subtitle="Speak 10 words anywhere to unlock"
          locked={true}
          meta="0/10 words spoken"
        />

        <ModeCard
          illustration={IllustrationStory}
          title="Story Mode"
          subtitle="Interactive scenarios and dialogues"
          meta="Explore Stories"
          progressColor="rgba(236,72,153,0.5)"
          to="/lessons/stories"
          badge="NEW"
          badgeColor="rgba(236,72,153,0.7)"
        />
      </div>

      {/* Lessons grouped by language */}
      <div>
        <div style={{ marginBottom: "20px" }}>
          <p style={{ fontSize: "11px", fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: "1.5px", margin: "0 0 4px" }}>By Language</p>
          <div style={{ width: "32px", height: "2px", background: "#2ecc71", borderRadius: "2px" }} />
        </div>

        {!lessons ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ width: "36px", height: "36px", border: "3px solid rgba(46,204,113,0.3)", borderTop: "3px solid #2ecc71", borderRadius: "50%", margin: "0 auto 12px", animation: "spin 1s linear infinite" }} />
            <p style={{ color: "#6b7280", fontSize: "14px" }}>Loading lessons...</p>
          </div>
        ) : lessons.length === 0 ? (
          <p style={{ color: "#4b5563", fontSize: "14px", textAlign: "center", padding: "40px 0" }}>No lessons available yet.</p>
        ) : (
          <LanguageGroupedLessons lessons={lessons} />
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}