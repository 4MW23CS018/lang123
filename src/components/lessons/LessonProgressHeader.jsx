// src/components/lessons/LessonProgressHeader.jsx
import React from 'react';
import { BookOpen, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LessonProgressHeader({
  language,
  languageMeta,
}) {
  const color = languageMeta?.color || 'var(--accent)';

  return (
    <div style={{
      marginBottom: 6,
      opacity: 0,
      animation: 'fadeDown 0.4s var(--ease-out) forwards',
    }}>
      {/* Title & Subtitle + Language Badge */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 14,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: languageMeta?.color ? `${languageMeta.color}20` : 'var(--accent-bg)',
              color: color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <BookOpen size={18} />
            </div>
            <h1 style={{
              color: 'var(--text-primary)',
              fontSize: 'clamp(22px, 3.5vw, 28px)',
              fontWeight: 800,
              margin: 0,
              letterSpacing: '-0.6px',
            }}>
              Explore Lessons
            </h1>
          </div>
          <p style={{
            color: 'var(--text-muted)',
            fontSize: 14,
            margin: 0,
            fontWeight: 500,
          }}>
            Build real conversations, one branching phrase at a time.
          </p>
        </div>

        {/* Actions & Language Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Custom Lessons Page Button */}
          <Link
            to="/custom-lessons"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--accent-bg)',
              border: '1px solid var(--accent)',
              borderRadius: 999,
              padding: '6px 14px',
              color: 'var(--accent)',
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 700,
              boxShadow: '0 2px 8px rgba(34, 197, 94, 0.12)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--accent)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--accent-bg)';
              e.currentTarget.style.color = 'var(--accent)';
            }}
          >
            <Sparkles size={14} />
            <span>Custom AI Lessons</span>
          </Link>

          {/* Language Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            borderRadius: 999,
            padding: '5px 14px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}>
            <span style={{ fontSize: 15 }}>{languageMeta?.emoji || '🗣️'}</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 13.5 }}>
              {language}
            </span>
            {languageMeta?.script && (
              <span style={{
                color: color,
                fontWeight: 700,
                fontSize: 12,
                padding: '2px 7px',
                borderRadius: 6,
                background: `${color}18`,
              }}>
                {languageMeta.script}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
