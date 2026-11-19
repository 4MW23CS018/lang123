import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatPanel from './ChatPanel';
import EnzoCompanion from './EnzoCompanion';

/**
 * Floating chat widget — EnZo RPG Companion in bottom-right that expands
 * into the ChatPanel. Visible on all protected pages.
 */
export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000 }}>
      {/* ── Expanded Chat Panel ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            style={{
              position: 'absolute', bottom: 70, right: 0,
              width: 'min(380px, calc(100vw - 32px))', height: 520,
              transformOrigin: 'bottom right',
            }}
          >
            <ChatPanel compact={true} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Companion Speech Bubble on Hover (Desktop) ── */}
      <AnimatePresence>
        {!isOpen && isHovered && (
          <motion.div
            initial={{ opacity: 0, x: 10, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.9 }}
            style={{
              position: 'absolute',
              right: 68,
              bottom: 12,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              borderRadius: 14,
              padding: '6px 14px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              zIndex: 1001,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 750, color: 'var(--text-primary)' }}>EnZo</span>
            <span style={{ fontSize: 11, color: '#c084fc', background: 'rgba(168, 85, 247, 0.15)', padding: '1px 6px', borderRadius: 6, fontWeight: 700 }}>Companion</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Need a hint? ✨</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Chibi RPG Companion FAB Button ── */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        aria-label="EnZo RPG Language Companion"
        style={{
          width: 60, height: 60, borderRadius: 20,
          background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-elevated) 100%)',
          border: '1.5px solid rgba(168, 85, 247, 0.4)',
          boxShadow: '0 8px 28px rgba(139, 92, 246, 0.25), 0 2px 8px rgba(0,0,0,0.15)',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', overflow: 'hidden',
        }}
      >
        {isOpen ? (
          <motion.span
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}
          >
            ✕
          </motion.span>
        ) : (
          <EnzoCompanion size={46} mood={isHovered ? 'happy' : 'happy'} animated={true} />
        )}
      </motion.button>
    </div>
  );
}
