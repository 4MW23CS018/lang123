import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Sparkles, Volume2, Flame, Trophy, Check } from 'lucide-react';
import ListenButton from '../speech/ListenButton';

const CARDS = [
  {
    id: 'kan',
    lang: 'Kannada',
    native: 'ನಮಸ್ಕಾರ',
    phonetic: 'Namaskāra',
    meaning: 'Hello / Greetings',
    color: '#22c55e',
    xp: '+15 XP',
    badge: 'Basics Unit 1',
    pos: { top: '5%', left: '10%', rotate: -6 }
  },
  {
    id: 'tam',
    lang: 'Tamil',
    native: 'வணக்கம்',
    phonetic: 'Vaṇakkam',
    meaning: 'Greetings / Welcome',
    color: '#8b5cf6',
    xp: '+15 XP',
    badge: 'Greetings Unit 1',
    pos: { top: '15%', right: '8%', rotate: 8 }
  },
  {
    id: 'tel',
    lang: 'Telugu',
    native: 'నమస్కారం',
    phonetic: 'Namaskāram',
    meaning: 'Hello / Respects',
    color: '#f59e0b',
    xp: '+20 XP',
    badge: 'Phrases Unit 2',
    pos: { bottom: '25%', left: '4%', rotate: 4 }
  },
  {
    id: 'mal',
    lang: 'Malayalam',
    native: 'നമസ്കാരം',
    phonetic: 'Namaskāram',
    meaning: 'Warm Greetings',
    color: '#f43f5e',
    xp: '+20 XP',
    badge: 'Essentials Unit 1',
    pos: { bottom: '10%', right: '12%', rotate: -5 }
  },
  {
    id: 'ai',
    lang: 'Speech AI',
    native: '🎙️ Pronunciation',
    phonetic: '98% Accuracy',
    meaning: 'Instant AI Voice Analysis',
    color: '#0ea5e9',
    xp: 'AI Voice',
    badge: 'Live Assessment',
    pos: { top: '42%', left: '32%', rotate: -2 }
  }
];

export default function InteractiveFlashcardMatrix() {
  const containerRef = useRef(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [flipped, setFlipped] = useState({});
  const [activeCard, setActiveCard] = useState(null);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    setRotate({ x: -y * 12, y: x * 12 });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
  };

  const toggleFlip = (id) => {
    setFlipped(prev => ({ ...prev, [id]: !prev[id] }));
    setActiveCard(id);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: 520,
        height: 460,
        margin: '0 auto',
        perspective: 1200,
        cursor: 'pointer',
      }}
    >
      <motion.div
        animate={{ rotateX: rotate.x, rotateY: rotate.y }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          transformStyle: 'preserve-3d',
        }}
      >
        {CARDS.map((card, idx) => {
          const isFlipped = !!flipped[card.id];
          const isActive = activeCard === card.id;

          return (
            <motion.div
              key={card.id}
              onClick={() => toggleFlip(card.id)}
              initial={{ opacity: 0, scale: 0.8, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              whileHover={{ scale: 1.06, zIndex: 30 }}
              style={{
                position: 'absolute',
                ...card.pos,
                width: card.id === 'ai' ? 220 : 200,
                height: 140,
                transformStyle: 'preserve-3d',
                transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                transform: `rotate(${card.pos.rotate}deg) rotateY(${isFlipped ? 180 : 0}deg)`,
                zIndex: isActive ? 20 : 10 - idx,
              }}
            >
              {/* FRONT OF CARD */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  borderRadius: 18,
                  padding: '16px 18px',
                  background: 'var(--bg-card)',
                  border: `1.5px solid ${card.color}40`,
                  boxShadow: `0 10px 25px -5px ${card.color}25, 0 4px 10px var(--card-shadow)`,
                  display: 'flex',
                  flexDirection: 'column',
                  justify: 'space-between',
                  overflow: 'hidden',
                }}
              >
                {/* Glowing top line */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: card.color, borderRadius: '18px 18px 0 0' }} />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: card.color, textTransform: 'uppercase', letterSpacing: '0.8px', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Sparkles size={12} /> {card.lang}
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 800, background: `${card.color}15`, color: card.color, padding: '2px 8px', borderRadius: 99 }}>
                    {card.xp}
                  </span>
                </div>

                <div style={{ margin: '8px 0 4px' }}>
                  <h3 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.5px' }}>
                    {card.native}
                  </h3>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0', fontStyle: 'italic' }}>
                    {card.phonetic}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>{card.meaning}</span>
                  <span style={{ fontSize: 10, color: card.color, fontWeight: 700 }}>Click to flip ↺</span>
                </div>
              </div>

              {/* BACK OF CARD */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  borderRadius: 18,
                  padding: '16px 18px',
                  background: 'var(--bg-elevated)',
                  border: `1.5px solid ${card.color}`,
                  boxShadow: `0 10px 25px -5px ${card.color}35`,
                  display: 'flex',
                  flexDirection: 'column',
                  justify: 'space-between',
                  transform: 'rotateY(180deg)',
                  overflow: 'hidden',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: card.color, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Check size={14} /> Mastered Phrase
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{card.badge}</span>
                </div>

                <div style={{ textAlign: 'center', margin: '4px 0' }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>{card.meaning}</p>
                  <p style={{ fontSize: 12, color: card.color, fontWeight: 600 }}>"{card.phonetic}"</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: `${card.color}15`, padding: '6px', borderRadius: 10 }}>
                  <Volume2 size={14} color={card.color} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: card.color }}>Listen & Practice</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Floating Prompt Indicator */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        padding: '6px 16px',
        borderRadius: 99,
        fontSize: 12,
        fontWeight: 600,
        color: 'var(--text-muted)',
        boxShadow: 'var(--card-shadow)',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        pointerEvents: 'none',
      }}>
        <Sparkles size={14} color="var(--accent)" /> Interactive 3D Cards • Tilt & Click to Flip
      </div>
    </div>
  );
}
