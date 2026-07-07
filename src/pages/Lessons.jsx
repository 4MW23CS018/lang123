import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage, SOUTH_INDIAN_LANGUAGES } from "../components/hooks/useLanguage";

const LANG_META = {
  Kannada:  { color: '#22c55e', emoji: '🟢' },
  Tamil:    { color: '#8b5cf6', emoji: '🟣' },
  Telugu:   { color: '#f59e0b', emoji: '🟠' },
  Malayalam:{ color: '#f43f5e', emoji: '🩷' },
  Tulu:     { color: '#0ea5e9', emoji: '🩵' },
  Kodava:   { color: '#d97706', emoji: '🟡' },
};

const DIFFICULTY_ORDER = { beginner: 0, intermediate: 1, advanced: 2 };
const DIFFICULTY_COLORS = {
  beginner: '#22c55e',
  intermediate: '#f59e0b',
  advanced: '#ef4444',
};

function LessonRow({ lesson, index, color }) {
  const [hov, setHov] = useState(false);
  const diff = lesson.difficulty || 'beginner';
  const diffColor = DIFFICULTY_COLORS[diff] || DIFFICULTY_COLORS.beginner;
  return (
    <Link to={`/lesson/${lesson._id}`} style={{ textDecoration: 'none' }}>
      <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '14px 16px', borderRadius: 12,
          background: hov ? 'var(--bg-elevated)' : 'transparent',
          transition: 'all 0.18s var(--ease-out)', cursor: 'pointer',
          marginBottom: 2,
        }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ color, fontSize: 13, fontWeight: 700 }}>{index + 1}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lesson.title}</p>
          {lesson.phonetics && (
            <p style={{ color: color, fontSize: 12, margin: '0 0 2px', fontWeight: 500, fontStyle: 'italic', opacity: 0.85 }}>🗣 {lesson.phonetics}</p>
          )}
          <span style={{
            display: 'inline-block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.5px', padding: '2px 8px', borderRadius: 999,
            background: diffColor + '15', color: diffColor,
          }}>{diff}</span>
        </div>
        <span style={{ color: hov ? color : 'var(--text-faint)', fontSize: 14, transition: 'all 0.15s', transform: hov ? 'translateX(2px)' : 'none', display: 'inline-block' }}>→</span>
      </div>
    </Link>
  );
}

export default function Lessons() {
  const { current, language } = useLanguage();
  const lessons = useQuery(api.lessons.listByLanguage, { language });

  const meta = LANG_META[language] || { color: 'var(--text-muted)', emoji: '📖' };
  const color = meta.color;

  if (!lessons) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 36, height: 36, border: '2.5px solid var(--border-subtle)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading lessons…</p>
      </div>
    </div>
  );

  // Sort by difficulty
  const sorted = [...lessons].sort((a, b) =>
    (DIFFICULTY_ORDER[a.difficulty] ?? 1) - (DIFFICULTY_ORDER[b.difficulty] ?? 1)
  );

  return (
    <div style={{ padding: '32px 24px', maxWidth: 780, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28, opacity: 0, animation: 'fadeDown 0.4s var(--ease-out) 60ms forwards' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px' }}>Your Library</span>
        <h1 style={{ color: 'var(--text-primary)', fontSize: 28, fontWeight: 800, margin: '4px 0 0', letterSpacing: '-0.8px' }}>
          {current.emoji} {language} Lessons
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '6px 0 0' }}>
          Use the language switcher in the top-right to change language
        </p>
      </div>

      {sorted.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 24px',
          background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
          borderRadius: 18, boxShadow: 'var(--card-shadow)',
        }}>
          <span style={{ fontSize: 48, display: 'block', marginBottom: 16 }}>📭</span>
          <p style={{ color: 'var(--text-secondary)', fontSize: 16, fontWeight: 600, margin: '0 0 6px' }}>
            No {language} lessons yet
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
            Lessons for this language will appear here once available.
          </p>
        </div>
      ) : (
        <div style={{ opacity: 0, animation: 'fadeUp 0.4s var(--ease-out) forwards' }}>
          {/* Language card header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>{current.emoji}</div>
            <div style={{ flex: 1 }}>
              <p style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 700, margin: 0 }}>{language}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: 0 }}>{sorted.length} lesson{sorted.length !== 1 ? 's' : ''} available</p>
            </div>
          </div>

          {/* Lessons list */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 16, padding: 8, boxShadow: 'var(--card-shadow)' }}>
            {sorted.map((lesson, i) => <LessonRow key={lesson._id} lesson={lesson} index={i} color={color} />)}
          </div>
        </div>
      )}
    </div>
  );
}