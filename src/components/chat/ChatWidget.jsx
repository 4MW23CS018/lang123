import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatPanel from './ChatPanel';

/**
 * Floating chat widget — FAB button in bottom-right that expands
 * into the ChatPanel. Visible on all protected pages.
 */
export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);

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
              position: 'absolute', bottom: 64, right: 0,
              width: 380, height: 520,
              transformOrigin: 'bottom right',
            }}
          >
            <ChatPanel compact={true} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FAB Button ── */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        style={{
          width: 56, height: 56, borderRadius: 18,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', overflow: 'hidden',
        }}
      >

        <motion.span
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ type: 'spring', damping: 15 }}
          style={{ fontSize: 24, lineHeight: 1 }}
        >
          {isOpen ? '✕' : '✨'}
        </motion.span>
      </motion.button>
    </div>
  );
}
