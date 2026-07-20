import { useState } from 'react';
import ChatPanel from '../components/chat/ChatPanel';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

const LANGUAGES = ['Kannada', 'Tamil', 'Telugu', 'Malayalam', 'Tulu', 'Kodava'];

/**
 * Full-page chat route — immersive chatbot experience with
 * language picker and chat panel.
 */
export default function Chat() {
  const userId = localStorage.getItem('userId');
  const [selectedLang, setSelectedLang] = useState(
    localStorage.getItem('selectedLanguage') || 'Kannada'
  );
  const user = useQuery(api.users.get, userId ? { userId } : 'skip');

  const handleLangChange = (lang) => {
    setSelectedLang(lang);
    localStorage.setItem('selectedLanguage', lang);
  };

  return (
    <div style={{
      maxWidth: 800, margin: '0 auto', padding: '24px 20px',
      minHeight: 'calc(100vh - 140px)',
      display: 'flex', flexDirection: 'column', gap: 20,
      animation: 'fadeUp 0.5s ease-out',
    }}>
      {/* ── Header ── */}
      <div style={{ textAlign: 'center' }}>
        <h1 style={{
          fontSize: 28, fontWeight: 800, color: 'var(--text-primary)',
          letterSpacing: '-0.5px', marginBottom: 6,
        }}>
          <span style={{ color: 'var(--purple)' }}>AI</span> Language Tutor
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Ask anything about {selectedLang} — grammar, pronunciation, vocabulary, and more
        </p>
      </div>

      {/* ── Language Selector ── */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap',
      }}>
        {LANGUAGES.map((lang) => {
          const active = lang === selectedLang;
          return (
            <button
              key={lang}
              onClick={() => handleLangChange(lang)}
              style={{
                padding: '6px 14px', borderRadius: 20,
                background: active ? 'var(--purple)' : 'var(--bg-elevated)',
                border: `1px solid ${active ? 'var(--purple)' : 'var(--border-default)'}`,
                color: active ? '#fff' : 'var(--text-secondary)',
                fontSize: 13, fontWeight: active ? 700 : 500,
                cursor: 'pointer', transition: 'all 0.2s var(--ease-out)',
              }}
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.borderColor = 'var(--purple-border)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.borderColor = 'var(--border-default)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              {lang}
            </button>
          );
        })}
      </div>

      {/* ── Stats Bar ── */}
      {user && (
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 16,
          padding: '10px 0',
        }}>
          {[
            { icon: '🔥', label: 'Streak', value: `${user.streak || 0}d` },
            { icon: '⚡', label: 'XP', value: user.totalXp || 0 },
            { icon: '💎', label: 'Gems', value: user.gems || 0 },
          ].map((stat) => (
            <div key={stat.label} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 12,
              background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
              fontSize: 13, color: 'var(--text-secondary)',
            }}>
              <span>{stat.icon}</span>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{stat.value}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{stat.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Chat Panel (full-page mode) ── */}
      <div style={{
        flex: 1, minHeight: 500,
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
      }}>
        {/* Force re-mount on language change so history reloads */}
        <ChatPanel key={selectedLang} compact={false} />
      </div>
    </div>
  );
}
