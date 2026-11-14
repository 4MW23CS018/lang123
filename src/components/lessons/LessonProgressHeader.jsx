// src/components/lessons/LessonProgressHeader.jsx
import React from 'react';
import { Flame, BookOpen, CheckCircle2, Layers } from 'lucide-react';

export default function LessonProgressHeader({
  language,
  languageMeta,
  totalPhrases,
  completedPhrases,
  progressPercentage,
  streak = 0,
}) {
  const color = languageMeta?.color || 'var(--accent)';

  return (
    <div style={{
      marginBottom: 32,
      opacity: 0,
      animation: 'fadeDown 0.4s var(--ease-out) forwards',
    }}>
      {/* Title & Subtitle */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        marginBottom: 20,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: languageMeta?.color ? `${languageMeta.color}20` : 'var(--accent-bg)',
              color: color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <BookOpen size={20} />
            </div>
            <h1 style={{
              color: 'var(--text-primary)',
              fontSize: 28,
              fontWeight: 800,
              margin: 0,
              letterSpacing: '-0.6px',
            }}>
              Explore Lessons
            </h1>
          </div>
          <p style={{
            color: 'var(--text-muted)',
            fontSize: 14.5,
            margin: 0,
            fontWeight: 500,
          }}>
            Build real conversations, one branching phrase at a time.
          </p>
        </div>

        {/* Language Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
          borderRadius: 999,
          padding: '6px 16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}>
          <span style={{ fontSize: 16 }}>{languageMeta?.emoji || '🗣️'}</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 14 }}>
            {language}
          </span>
          {languageMeta?.script && (
            <span style={{
              color: color,
              fontWeight: 700,
              fontSize: 13,
              padding: '2px 8px',
              borderRadius: 6,
              background: `${color}18`,
            }}>
              {languageMeta.script}
            </span>
          )}
        </div>
      </div>

      {/* Progress & Stat Cards Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 14,
      }}>
        {/* Overall Completion Card */}
        <div style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 16,
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Conversational Mastery
            </span>
            <span style={{ color, fontSize: 16, fontWeight: 800 }}>
              {progressPercentage}%
            </span>
          </div>
          {/* Progress Bar */}
          <div style={{
            height: 8,
            borderRadius: 99,
            background: 'var(--bg-subtle)',
            overflow: 'hidden',
            border: '1px solid var(--border-subtle)',
            position: 'relative',
          }}>
            <div style={{
              height: '100%',
              width: `${progressPercentage}%`,
              background: color,
              borderRadius: 99,
              transition: 'width 0.6s var(--ease-out)',
              boxShadow: `0 0 10px ${color}88`,
            }} />
          </div>
        </div>

        {/* Phrases Count Card */}
        <div style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 16,
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: 'rgba(34, 197, 94, 0.12)',
            color: '#22c55e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ color: 'var(--text-primary)', fontSize: 18, fontWeight: 800 }}>
              {completedPhrases} <span style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 600 }}>/ {totalPhrases}</span>
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 600 }}>
              Phrases Mastered
            </div>
          </div>
        </div>

        {/* Streak / Gamification Card */}
        <div style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 16,
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: 'rgba(245, 158, 11, 0.12)',
            color: '#f59e0b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Flame size={22} />
          </div>
          <div>
            <div style={{ color: 'var(--text-primary)', fontSize: 18, fontWeight: 800 }}>
              {streak} <span style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 600 }}>days</span>
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 600 }}>
              Active Learning Streak
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

