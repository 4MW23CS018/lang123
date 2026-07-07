import { Link } from 'react-router-dom';
import { useState } from 'react';

const LEVEL_COLORS = {
  Beginner: 'var(--accent)',
  Intermediate: 'var(--sky)',
  Advanced: 'var(--coral)',
};

export default function LessonCard({ lesson }) {
  const [hov, setHov] = useState(false);
  const level = lesson.level || 'Beginner';
  const color = LEVEL_COLORS[level] || LEVEL_COLORS.Beginner;

  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
        borderRadius: 16, padding: '22px 20px',
        display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box',
        transition: 'all 0.25s var(--ease-out)',
        transform: hov ? 'translateY(-3px)' : 'none',
        boxShadow: hov ? 'var(--card-shadow-hover)' : 'var(--card-shadow)',
        cursor: 'pointer',
      }}>
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color, background: color + '15', padding: '3px 10px', borderRadius: 999 }}>{level}</span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, textTransform: 'capitalize' }}>{lesson.language}</span>
      </div>

      {/* Title */}
      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 10px', lineHeight: 1.3 }}>{lesson.title}</h3>

      {/* Phrase preview */}
      <div style={{
        background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
        borderRadius: 10, padding: '10px 12px', marginBottom: 16, flex: 1,
      }}>
        <p style={{
          fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{lesson.phrase}</p>
      </div>

      {/* CTA */}
      <Link to={`/lesson/${lesson._id}`} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        padding: '10px', borderRadius: 10, textDecoration: 'none',
        background: hov ? 'var(--accent)' : 'var(--accent-bg)',
        color: hov ? '#fff' : 'var(--accent)',
        fontSize: 13, fontWeight: 700,
        transition: 'all 0.2s var(--ease-out)', marginTop: 'auto',
      }}>
        Start Lesson <span style={{ transform: hov ? 'translateX(2px)' : 'none', transition: 'transform 0.2s', display: 'inline-block' }}>→</span>
      </Link>
    </div>
  );
}
