// src/components/lessons/CategorySelector.jsx
import React, { useRef } from 'react';
import {
  Handshake,
  MessageCircle,
  Users,
  Utensils,
  ShoppingBag,
  Bus,
  Compass,
  GraduationCap,
  Briefcase,
  HeartPulse,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Check,
} from 'lucide-react';

const ICON_MAP = {
  Handshake,
  MessageCircle,
  Users,
  Utensils,
  ShoppingBag,
  Bus,
  Compass,
  GraduationCap,
  Briefcase,
  HeartPulse,
  Clock,
  Sparkles,
};

export default function CategorySelector({
  categories = [],
  selectedCategoryId,
  onSelectCategory,
  themeColor = 'var(--accent)',
}) {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (!scrollRef.current) return;
    const distance = 300;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -distance : distance,
      behavior: 'smooth',
    });
  };

  return (
    <div style={{ marginBottom: 12, position: 'relative' }}>
      {/* Category Section Title & Scroll buttons */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
        padding: '0 2px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            color: 'var(--text-muted)',
            fontSize: 12,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
          }}>
            Topics & Conversational Scenarios
          </span>
          <span style={{
            fontSize: 11,
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 999,
            background: 'var(--bg-elevated)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-subtle)',
          }}>
            {categories.length} Topics
          </span>
        </div>

        {/* Scroll Arrows */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={() => scroll('left')}
            aria-label="Scroll left"
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-elevated)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-card)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'var(--bg-elevated)'; }}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => scroll('right')}
            aria-label="Scroll right"
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-elevated)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-card)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'var(--bg-elevated)'; }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Horizontal Carousel */}
      <div
        ref={scrollRef}
        style={{
          display: 'flex',
          gap: 14,
          overflowX: 'auto',
          scrollBehavior: 'smooth',
          padding: '6px 4px 12px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {categories.map((cat) => {
          const isSelected = cat.id === selectedCategoryId;
          const Icon = ICON_MAP[cat.icon] || Sparkles;
          const catColor = cat.color || themeColor;

          return (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelectCategory(cat.id); }}
              style={{
                flex: '0 0 auto',
                width: 'clamp(210px, 32vw, 240px)',
                borderRadius: 18,
                padding: '16px 16px 14px',
                cursor: 'pointer',
                background: isSelected ? 'var(--bg-card)' : 'var(--bg-elevated)',
                border: isSelected
                  ? `2px solid ${catColor}`
                  : '1px solid var(--border-subtle)',
                boxShadow: isSelected
                  ? `0 6px 20px ${catColor}28, 0 0 0 1px ${catColor}44`
                  : 'var(--card-shadow)',
                transform: isSelected ? 'translateY(-2px)' : 'none',
                transition: 'all 0.2s var(--ease-out)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: 152,
                boxSizing: 'border-box',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = 'var(--border-strong)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                }
              }}
            >
              {/* Top row: Icon & Status Badge */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: isSelected ? `${catColor}25` : 'var(--bg-subtle)',
                  color: isSelected ? catColor : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  flexShrink: 0,
                }}>
                  <Icon size={17} />
                </div>

                {/* Status pill */}
                {cat.isMastered ? (
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    padding: '3px 8px',
                    borderRadius: 999,
                    background: 'rgba(34, 197, 94, 0.15)',
                    color: '#22c55e',
                    fontSize: 10.5,
                    fontWeight: 700,
                  }}>
                    <Check size={11} /> Mastered
                  </span>
                ) : cat.isStarted ? (
                  <span style={{
                    padding: '3px 8px',
                    borderRadius: 999,
                    background: `${catColor}20`,
                    color: catColor,
                    fontSize: 10.5,
                    fontWeight: 700,
                  }}>
                    {cat.progressPercent}%
                  </span>
                ) : (
                  <span style={{
                    padding: '3px 8px',
                    borderRadius: 999,
                    background: 'var(--bg-subtle)',
                    color: 'var(--text-muted)',
                    fontSize: 10.5,
                    fontWeight: 600,
                  }}>
                    {cat.totalPhrases} phrases
                  </span>
                )}
              </div>

              {/* Title & Description */}
              <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{
                  fontSize: 14,
                  fontWeight: 750,
                  color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                  margin: '0 0 4px',
                  letterSpacing: '-0.2px',
                  lineHeight: 1.25,
                }}>
                  {cat.name}
                </h3>
                <p style={{
                  fontSize: 11.5,
                  color: 'var(--text-muted)',
                  margin: 0,
                  lineHeight: 1.35,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                  {cat.description}
                </p>
              </div>

              {/* Bottom mini progress bar */}
              <div style={{
                height: 4.5,
                borderRadius: 99,
                background: 'var(--bg-subtle)',
                overflow: 'hidden',
                marginTop: 10,
              }}>
                <div style={{
                  height: '100%',
                  width: `${cat.progressPercent || 0}%`,
                  background: catColor,
                  borderRadius: 99,
                  transition: 'width 0.4s ease',
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

