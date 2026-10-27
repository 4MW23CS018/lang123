// src/components/speech/PronunciationFeedback.jsx
import { useEffect, useState } from "react";



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
      {/* Feedback Status Header */}
      <div style={{ textAlign: 'center', padding: '4px 0' }}>
        <span style={{ color, fontSize: '22px', fontWeight: '800' }}>
          {accuracy >= 80 ? 'Excellent! 🎉' : accuracy >= 50 ? 'Good try! 💪' : 'Keep practicing 🔄'}
        </span>
      </div>

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

        {/* AI Tutor Tip */}
        {feedback.ai_tip && (
          <div style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '12px', padding: '16px' }}>
            <p style={{ color: 'var(--purple)', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🤖</span> Tutor's Tip
            </p>
            <p style={{ color: 'var(--text-primary)', fontSize: '15px', fontWeight: '500', margin: 0, fontStyle: 'italic', lineHeight: '1.4' }}>
              {feedback.ai_tip}
            </p>
          </div>
        )}

        {/* Word Breakdown */}
        {feedback.word_breakdown?.length > 0 && (
          <div style={{ background: 'var(--bg-elevated)', borderRadius: '12px', padding: '14px 16px' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 10px' }}>Word Breakdown</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {feedback.word_breakdown.map((item, i) => {
                let itemBg, itemBorder, itemText, icon;
                if (item.status === "correct") {
                  itemBg = "rgba(46,204,113,0.1)"; itemBorder = "rgba(46,204,113,0.3)"; itemText = "#2ecc71"; icon = "✅";
                } else if (item.status === "partial") {
                  itemBg = "rgba(234,179,8,0.12)"; itemBorder = "rgba(234,179,8,0.35)"; itemText = "#eab308"; icon = "◐";
                } else if (item.status === "mispronounced") {
                  itemBg = "rgba(250,204,21,0.1)"; itemBorder = "rgba(250,204,21,0.3)"; itemText = "#facc15"; icon = "⚠️";
                } else {
                  itemBg = "rgba(239,68,68,0.1)"; itemBorder = "rgba(239,68,68,0.3)"; itemText = "#ef4444"; icon = "❌";
                }

                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4, background: itemBg, border: `1px solid ${itemBorder}`, borderRadius: '8px', padding: '8px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px' }}>{icon}</span>
                        <span style={{ color: 'var(--text-primary)', fontSize: '15px', fontWeight: '600' }}>{item.word}</span>
                      </div>
                      {item.status === "partial" && (
                        <div style={{ fontSize: '12px', color: itemText, background: 'rgba(0,0,0,0.2)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                          Partial
                        </div>
                      )}
                      {item.status === "mispronounced" && item.spoken_as && (
                        <div style={{ fontSize: '12px', color: itemText, background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '4px' }}>
                          Heard: <em>{item.spoken_as}</em>
                        </div>
                      )}
                      {item.status === "missing" && (
                        <div style={{ fontSize: '12px', color: itemText, background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '4px' }}>
                          Missing
                        </div>
                      )}
                    </div>
                    {item.note && item.status !== "correct" && (
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', paddingLeft: '22px' }}>
                        {item.note}
                      </div>
                    )}
                  </div>
                );
              })}
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