import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

/* ── 1. SpotlightCard ──
   Mouse-tracking 3D spotlight card with subtle radial gradient border follow effect
*/
export function SpotlightCard({ children, spotlightColor = 'rgba(34, 197, 94, 0.15)', style = {}, delay = 0 }) {
  const divRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <motion.div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6, delay: delay / 1000, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -5, transition: { duration: 0.25 } }}
      style={{
        position: 'relative',
        borderRadius: 20,
        border: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-card)',
        overflow: 'hidden',
        padding: '32px 28px',
        boxShadow: 'var(--card-shadow)',
        ...style,
      }}
    >
      <div
        style={{
          pointerEvents: 'none',
          position: 'absolute',
          inset: 0,
          opacity,
          transition: 'opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          background: `radial-gradient(400px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 65%)`,
          zIndex: 0,
        }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </motion.div>
  );
}

/* ── 2. DecryptedText ──
   Cyberpunk/tech scrambled text decryption effect
*/
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZഅಆಇಈಉಊಎಏಐಒಓಔಕಖಗಘಙಚಛಜಝಞ';

export function DecryptedText({ text, speed = 40, maxIterations = 8, style = {} }) {
  const [displayText, setDisplayText] = useState(text);

  useEffect(() => {
    let iteration = 0;
    const interval = setInterval(() => {
      setDisplayText(
        text
          .split('')
          .map((char, index) => {
            if (char === ' ') return ' ';
            if (index < iteration) return text[index];
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join('')
      );

      if (iteration >= text.length) {
        clearInterval(interval);
      }
      iteration += 1 / maxIterations;
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, maxIterations]);

  return (
    <span
      style={{
        color: 'var(--accent)',
        fontFamily: 'var(--font-display)',
        fontStyle: 'italic',
        fontWeight: 800,
        ...style,
      }}
    >
      {displayText}
    </span>
  );
}

/* ── 3. BlurText ──
   Smooth staggered blur-in text animation
*/
export function BlurText({ text, delay = 0.04, style = {} }) {
  const words = text.split(' ');

  return (
    <span style={{ display: 'inline-flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.25em', ...style }}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ filter: 'blur(12px)', opacity: 0, y: 14 }}
          animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: i * delay, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: 'inline-block' }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

/* ── 4. AuroraBackground ──
   Dynamic animated glowing mesh gradient background
*/
export function AuroraBackground({ children }) {
  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @keyframes aurora-glow-1 {
          0% { transform: translate(-10%, -10%) scale(1); opacity: 0.6; }
          50% { transform: translate(10%, 15%) scale(1.2); opacity: 0.85; }
          100% { transform: translate(-10%, -10%) scale(1); opacity: 0.6; }
        }
        @keyframes aurora-glow-2 {
          0% { transform: translate(15%, 10%) scale(1.1); opacity: 0.5; }
          50% { transform: translate(-15%, -10%) scale(0.9); opacity: 0.75; }
          100% { transform: translate(15%, 10%) scale(1.1); opacity: 0.5; }
        }
      `}</style>
      <div
        style={{
          position: 'absolute',
          top: '-15%',
          left: '15%',
          width: '55vw',
          height: '55vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(34, 197, 94, 0.12) 0%, rgba(14, 165, 233, 0.06) 45%, transparent 70%)',
          filter: 'blur(70px)',
          pointerEvents: 'none',
          animation: 'aurora-glow-1 16s ease-in-out infinite',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '5%',
          right: '10%',
          width: '45vw',
          height: '45vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, rgba(245, 158, 11, 0.06) 45%, transparent 70%)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
          animation: 'aurora-glow-2 20s ease-in-out infinite',
        }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  );
}

/* ── 5. TiltCard ──
   Interactive 3D tilt card effect
*/
export function TiltCard({ children, style = {}, delay = 0 }) {
  const [rotate, setRotate] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const card = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - card.left - card.width / 2;
    const y = e.clientY - card.top - card.height / 2;
    setRotate({ x: -(y / card.height) * 12, y: (x / card.width) * 12 });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: delay / 1000, ease: [0.16, 1, 0.3, 1] }}
      animate={{ rotateX: rotate.x, rotateY: rotate.y }}
      style={{
        transformStyle: 'preserve-3d',
        perspective: 1000,
        transition: 'transform 0.15s ease-out',
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
}
