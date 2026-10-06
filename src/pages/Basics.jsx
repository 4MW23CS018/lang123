// Basics.jsx 
import  { useState } from 'react';
import { useLanguage } from '../components/hooks/useLanguage';
import { BASICS_DATA } from '../data/basics';
import ListenButton from '../components/speech/ListenButton';
import { Type } from 'lucide-react';
import HandwritingTracer from '../components/HandwritingTracer';

const TABS = ['Vowels', 'Consonants', 'Numbers'];

function BasicCard({ item, language, delay, onClick }) {
  const [hov, setHov] = useState(false);
  const isNumber = item.val !== undefined;

  return (
    <div
      className="glass-card"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => onClick(item.char)}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '24px 16px', gap: 12, position: 'relative',
        opacity: 0, animation: `fadeUp 0.4s var(--ease-out) ${delay}ms forwards`,
        transition: 'transform 0.2s', cursor: 'pointer',
        transform: hov ? 'translateY(-4px)' : 'none',
      }}
    >
      {/* Native Character */}
      <div style={{ fontSize: isNumber ? 36 : 48, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
        {item.char}
      </div>

      {/* English Pronunciation */}
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>
        {item.ph}
      </div>

      {/* Example Word */}
      {!isNumber && item.ex && (
        <div style={{ textAlign: 'center', marginTop: 4, background: 'var(--bg-elevated)', padding: '8px 12px', borderRadius: 12, width: '100%', boxSizing: 'border-box' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent)' }}>{item.ex}</div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
            <span style={{ fontStyle: 'italic' }}>{item.exPh}</span> • {item.exEn}
          </div>
        </div>
      )}

      {/* Listen Button */}
      <div style={{ marginTop: 8 }}>
        <ListenButton phrase={item.tts || item.char.split(' ')[0]} language={language} size={36} />
      </div>
    </div>
  );
}

export default function Basics() {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState('Vowels');
  const [practiceChar, setPracticeChar] = useState(null);

  const data = BASICS_DATA[language];
  const items = data ? data[activeTab.toLowerCase()] || [] : [];

  const handleCardClick = (char) => {
    setPracticeChar(char);
  };

  const getCurrentItems = () => data[activeTab.toLowerCase()] || [];

  const findNextChar = (currentChar, direction = 1) => {
    const list = getCurrentItems();
    const idx = list.findIndex(item => item.char === currentChar);
    if (idx === -1) return null;
    const newIdx = idx + direction;
    if (newIdx >= 0 && newIdx < list.length) {
      return list[newIdx].char;
    }
    return null;
  };

  return (
    <div style={{ padding: '32px 24px', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32, opacity: 0, animation: 'fadeDown 0.4s var(--ease-out) 60ms forwards' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px' }}>Foundations</span>
        <h1 style={{ color: 'var(--text-primary)', fontSize: 28, fontWeight: 800, margin: '4px 0 0', letterSpacing: '-0.8px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Type size={28} color="var(--accent)" /> {language} Basics
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '6px 0 0' }}>
          Learn the essential letters and numbers. Tap a character to practice writing it.
        </p>
      </div>

      <div className="glass-panel" style={{ padding: '24px', opacity: 0, animation: 'fadeUp 0.4s var(--ease-out) forwards' }}>
        {!data ? (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
              Basics are not currently available for {language}.
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              This section is available for Kannada, Tamil, Telugu, and Malayalam.
            </p>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16, overflowX: 'auto' }}>
              {TABS.map(tab => {
                const active = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      padding: '8px 16px', borderRadius: 99,
                      background: active ? 'var(--accent)' : 'transparent',
                      color: active ? '#fff' : 'var(--text-secondary)',
                      fontWeight: 700, fontSize: 14, border: 'none',
                      cursor: 'pointer', transition: 'all 0.2s',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-elevated)'; }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>

            {/* Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 16 }}>
              {items.map((item, i) => (
                <BasicCard
                  key={item.char}
                  item={item}
                  language={language}
                  delay={i * 30}
                  onClick={handleCardClick}
                />
              ))}
            </div>

            {items.length === 0 && (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>Data not available for this tab.</p>
            )}
          </>
        )}
      </div>

      {/* Handwriting Tracer Overlay */}
      {practiceChar && (
        <HandwritingTracer
          key={practiceChar}
          char={practiceChar}
          onClose={() => setPracticeChar(null)}
          onNext={() => {
            const next = findNextChar(practiceChar, 1);
            if (next) setPracticeChar(next);
            else setPracticeChar(null);
          }}
        />
      )}
    </div>
  );
}