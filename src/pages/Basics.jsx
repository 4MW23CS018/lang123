import { useState } from "react";
import { useLanguage, SOUTH_INDIAN_LANGUAGES } from "../components/hooks/useLanguage";
import { BASICS_DATA } from "../data/basics";
import ListenButton from "../components/speech/ListenButton";

const TABS = ["Vowels", "Consonants", "Numbers"];

function BasicCard({ item, language, delay }) {
  const [hov, setHov] = useState(false);
  const isNumber = item.val !== undefined;
  
  return (
    <div className="glass-card" onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '24px 16px', gap: 12, position: 'relative',
        opacity: 0, animation: `fadeUp 0.4s var(--ease-out) ${delay}ms forwards`,
        transition: 'transform 0.2s', cursor: 'default',
        transform: hov ? 'translateY(-4px)' : 'none',
      }}>
      
      {/* Native Character */}
      <div style={{ fontSize: isNumber ? 36 : 48, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
        {item.char}
      </div>

      {/* English Pronunciation */}
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>
        {item.ph}
      </div>

      {/* Example Word (Alphabet Book style) */}
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
  const { current, language } = useLanguage();
  const [activeTab, setActiveTab] = useState("Vowels");
  
  const data = BASICS_DATA[language];
  const items = data ? (data[activeTab.toLowerCase()] || []) : [];

  return (
    <div style={{ padding: '32px 24px', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32, opacity: 0, animation: 'fadeDown 0.4s var(--ease-out) 60ms forwards' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px' }}>Foundations</span>
        <h1 style={{ color: 'var(--text-primary)', fontSize: 28, fontWeight: 800, margin: '4px 0 0', letterSpacing: '-0.8px' }}>
          {current.emoji} {language} Basics
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '6px 0 0' }}>
          Learn the essential letters and numbers. Use the language switcher to change languages!
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
              <button key={tab} onClick={() => setActiveTab(tab)}
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
            <BasicCard key={item.char} item={item} language={language} delay={i * 30} />
          ))}
        </div>
        
        {items.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>Data not available for this tab.</p>
        )}
          </>
        )}
      </div>
    </div>
  );
}
