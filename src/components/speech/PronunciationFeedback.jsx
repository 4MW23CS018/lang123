// src/components/speech/PronunciationFeedback.jsx
import { useEffect, useState } from "react";

function AccuracyRing({ accuracy }) {
  const size = 120;
  const stroke = 8;
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(accuracy), 100);
    return () => clearTimeout(t);
  }, [accuracy]);

  const color = accuracy >= 80 ? '#2ecc71' : accuracy >= 50 ? '#facc15' : '#ef4444';
  const label = accuracy >= 80 ? 'Excellent! 🎉' : accuracy >= 50 ? 'Good try! 💪' : 'Keep practicing 🔄';
  const dash = (animated / 100) * circ;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke="var(--border-subtle)" strokeWidth={stroke} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={color} strokeWidth={stroke}
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1s ease, stroke 0.5s ease' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color, fontSize: '26px', fontWeight: '900', lineHeight: 1 }}>{accuracy}%</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '10px', fontWeight: '600', marginTop: '2px' }}>accuracy</span>
        </div>
      </div>
      <span style={{ color, fontSize: '14px', fontWeight: '700' }}>{label}</span>
    </div>
  );
}

/**
 * Renders a phonetics string like "Na-mas-kaa-ra" as styled syllable bubbles.
 */
function PhoneticBreakdown({ phonetics }) {
  if (!phonetics) return null;

  // Split by spaces (word boundaries) then by hyphens (syllables)
  const words = phonetics.split(' ');

  return (
    <div style={{
      background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
      borderRadius: '14px', padding: '16px 18px',
    }}>
      <p style={{
        color: 'var(--text-muted)', fontSize: '11px', fontWeight: '700',
        textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 10px',
      }}>
        📖 Pronunciation Guide
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
        {words.map((word, wi) => {
          const syllables = word.split('-');
          return (
            <div key={wi} style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
              {syllables.map((syl, si) => (
                <span key={si} style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--purple-bg)', border: '1px solid var(--purple-border)',
                  borderRadius: '8px', padding: '5px 10px',
                  color: 'var(--purple)', fontSize: '15px', fontWeight: '700',
                  letterSpacing: '0.3px',
                  animation: `fadeUp 0.3s ease ${(wi * syllables.length + si) * 0.06}s both`,
                }}>
                  {syl}
                </span>
              ))}
              {wi < words.length - 1 && (
                <span style={{ color: 'var(--text-faint)', fontSize: '16px', margin: '0 2px' }}>·</span>
              )}
            </div>
          );
        })}
      </div>
      <p style={{
        color: 'var(--purple)', fontSize: '12px', margin: '10px 0 0',
        fontStyle: 'italic', opacity: 0.8,
      }}>
        Break it down syllable by syllable, then say it faster!
      </p>
    </div>
  );
}

export default function PronunciationFeedback({ feedback }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 50); return () => clearTimeout(t); }, []);

  const accuracy = feedback.accuracy ?? 0;
  const color = accuracy >= 80 ? '#2ecc71' : accuracy >= 50 ? '#facc15' : '#ef4444';
  const bgColor = accuracy >= 80 ? 'rgba(46,204,113,0.08)' : accuracy >= 50 ? 'rgba(250,204,21,0.08)' : 'rgba(239,68,68,0.08)';
  const borderColor = accuracy >= 80 ? 'rgba(46,204,113,0.2)' : accuracy >= 50 ? 'rgba(250,204,21,0.2)' : 'rgba(239,68,68,0.2)';

  // Show phonetics help when accuracy is below 80%
  const showPhonetics = accuracy < 80 && feedback.phonetics;

  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'none' : 'translateY(16px)',
      transition: 'opacity 0.4s ease, transform 0.4s ease',
      background: bgColor,
      border: `1px solid ${borderColor}`,
      borderRadius: '20px',
      padding: '28px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
    }}>
      {/* Accuracy ring */}
      <AccuracyRing accuracy={accuracy} />

      <div style={{ height: '1px', background: 'var(--border-subtle)' }} />

      {/* Detail rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* What you said */}
        <div style={{ background: 'var(--bg-elevated)', borderRadius: '12px', padding: '14px 16px' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 4px' }}>You said</p>
          <p style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: '600', margin: 0 }}>
            "{feedback.transcription || '—'}"
          </p>
        </div>

        {/* Missing words */}
        {feedback.missing_words?.length > 0 && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', padding: '14px 16px' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 6px' }}>Missing words</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {feedback.missing_words.map((w, i) => (
                <span key={i} style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '4px 10px', color: '#fca5a5', fontSize: '14px', fontWeight: '600' }}>
                  {w}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Phonetics pronunciation guide — shown when accuracy < 80% */}
        {showPhonetics && (
          <PhoneticBreakdown phonetics={feedback.phonetics} />
        )}

        {/* XP earned */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.2)', borderRadius: '12px', padding: '14px' }}>
          <span style={{ fontSize: '22px' }}>⭐</span>
          <span style={{ color: '#facc15', fontSize: '20px', fontWeight: '900' }}>+{feedback.xpEarned} XP</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>earned</span>
        </div>
      </div>
    </div>
  );
}