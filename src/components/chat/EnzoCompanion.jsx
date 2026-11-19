// src/components/chat/EnzoCompanion.jsx
// src/components/chat/EnzoCompanion.jsx
import React from 'react';
import { motion } from 'framer-motion';

/**
 * EnZo — The Player's Chibi RPG Language Companion / Familiar.
 * An animated, friendly spirit guide who helps with translations, pronunciation, and quests.
 */
export default function EnzoCompanion({ size = 40, mood = 'happy', animated = true }) {
  const content = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 72 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', overflow: 'visible' }}
    >
      <defs>
        {/* Mystic Aura Gradient */}
        <radialGradient id="enzoAura" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.4" />
          <stop offset="60%" stopColor="#8b5cf6" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
        </radialGradient>

        {/* Head Gradient (Soft Ethereal Lavender / Mint) */}
        <linearGradient id="enzoBody" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f3e8ff" />
          <stop offset="60%" stopColor="#e9d5ff" />
          <stop offset="100%" stopColor="#c084fc" />
        </linearGradient>

        {/* Ear Gradient */}
        <linearGradient id="enzoEar" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>

        {/* Emerald Gem Shimmer */}
        <linearGradient id="enzoGem" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#16a34a" />
        </linearGradient>
      </defs>

      {/* ── Background Magical Glow Aura ── */}
      <circle cx="36" cy="38" r="34" fill="url(#enzoAura)" />

      {/* ── Cute RPG Floating Wings / Cloak ── */}
      <path
        d="M 14 36 C 4 30 6 48 18 44 Z"
        fill="#8b5cf6"
        opacity="0.8"
      />
      <path
        d="M 58 36 C 68 30 66 48 54 44 Z"
        fill="#8b5cf6"
        opacity="0.8"
      />

      {/* ── Chibi Ears (Familiar / Kitsune RPG Style) ── */}
      {/* Left Ear */}
      <path
        d="M 18 28 C 14 10 26 12 30 20 Z"
        fill="url(#enzoEar)"
      />
      <path
        d="M 20 25 C 17 14 24 15 27 20 Z"
        fill="#f472b6"
        opacity="0.75"
      />

      {/* Right Ear */}
      <path
        d="M 54 28 C 58 10 46 12 42 20 Z"
        fill="url(#enzoEar)"
      />
      <path
        d="M 52 25 C 55 14 48 15 45 20 Z"
        fill="#f472b6"
        opacity="0.75"
      />

      {/* ── Round Chibi Head ── */}
      <ellipse cx="36" cy="38" rx="22" ry="19" fill="url(#enzoBody)" />

      {/* ── Adventurer Headband with Emerald Focus Gem ── */}
      <path
        d="M 17 31 C 28 26 44 26 55 31"
        stroke="#4c1d95"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Emerald Crystal on Headband */}
      <polygon
        points="36,23 40,28 36,33 32,28"
        fill="url(#enzoGem)"
        stroke="#ffffff"
        strokeWidth="0.8"
      />
      {/* Gem Sparkle */}
      <circle cx="35" cy="27" r="0.9" fill="#ffffff" />

      {/* ── Big Sparkly Chibi Anime Eyes ── */}
      {mood === 'thinking' ? (
        // Playful ^ ^ blinking eyes
        <>
          <path d="M 25 38 Q 29 33 33 38" stroke="#1e1b4b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M 39 38 Q 43 33 47 38" stroke="#1e1b4b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </>
      ) : (
        // Big shining eyes
        <>
          {/* Left Eye */}
          <ellipse cx="29" cy="38" rx="3.6" ry="4.8" fill="#1e1b4b" />
          <circle cx="28" cy="36.5" r="1.6" fill="#ffffff" />
          <circle cx="30.2" cy="40" r="0.8" fill="#ffffff" />
          <circle cx="30" cy="38.5" r="0.6" fill="#4ade80" />

          {/* Right Eye */}
          <ellipse cx="43" cy="38" rx="3.6" ry="4.8" fill="#1e1b4b" />
          <circle cx="42" cy="36.5" r="1.6" fill="#ffffff" />
          <circle cx="44.2" cy="40" r="0.8" fill="#ffffff" />
          <circle cx="44" cy="38.5" r="0.6" fill="#4ade80" />
        </>
      )}

      {/* ── Rosy Chibi Cheeks ── */}
      <ellipse cx="23" cy="42" rx="3.2" ry="1.6" fill="#fb7185" opacity="0.65" />
      <ellipse cx="49" cy="42" rx="3.2" ry="1.6" fill="#fb7185" opacity="0.65" />

      {/* ── Cute Happy Mouth ── */}
      <path
        d="M 34 43.5 Q 36 46 38 43.5"
        stroke="#1e1b4b"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />

      {/* ── Floating Magical Sparkles ── */}
      <path
        d="M 12 18 L 13 22 L 17 23 L 13 24 L 12 28 L 11 24 L 7 23 L 11 22 Z"
        fill="#facc15"
        opacity="0.85"
      />
      <circle cx="61" cy="22" r="1.8" fill="#4ade80" opacity="0.8" />
      <circle cx="58" cy="16" r="1" fill="#facc15" opacity="0.9" />
    </svg>
  );

  if (!animated) {
    return <div style={{ width: size, height: size }}>{content}</div>;
  }

  return (
    <motion.div
      animate={{
        y: [0, -3.5, 0],
      }}
      transition={{
        duration: 2.4,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      style={{
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {content}
    </motion.div>
  );
}
