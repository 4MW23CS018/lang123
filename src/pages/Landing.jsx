import { Link } from 'react-router-dom';
import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../components/hooks/useTheme';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Sun, Moon, Target, Mic, BarChart3, Flame, Users, Star, Globe, BookOpen, Brain, Bell, Rocket, ArrowRight, Download, Menu, X } from 'lucide-react';
import { SpotlightCard } from '../components/ui/ReactBits';
import InteractiveLanguageGlobe from '../components/ui/InteractiveLanguageGlobe';
import { motion, AnimatePresence } from 'framer-motion';

class GlobeErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.warn("GlobeErrorBoundary caught:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          <span style={{ fontSize: 48 }}>🌍</span>
          <p style={{ marginTop: 12, fontSize: 14 }}>Learn Kannada, Tamil, Telugu, and Malayalam</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const WORDS = ['Kannada', 'Tamil', 'Telugu', 'Malayalam', 'Tulu', 'Kodava'];

function DynamicLanguageSwitcher() {
  const [wordIdx, setWordIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIdx((prev) => (prev + 1) % WORDS.length);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  return (
    <span style={{ display: 'inline-block', minWidth: 200, textAlign: 'left', position: 'relative' }}>
      <AnimatePresence mode="wait">
        <motion.span
          key={WORDS[wordIdx]}
          initial={{ y: 18, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -18, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          style={{
            display: 'inline-block',
            color: 'var(--accent)',
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontWeight: 800,
          }}
        >
          {WORDS[wordIdx]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function Counter({ to, suffix = '', duration = 1600 }) {
  const [val, setVal] = useState(to);
  const ref = useRef(null);
  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
    const obs = new IntersectionObserver((entries) => {
      const e = entries && entries[0];
      if (!e || !e.isIntersecting) return;
      obs.disconnect();
      let start = null;
      const step = ts => {
        if (!start) start = ts;
        const p = Math.min(1, (ts - start) / duration);
        setVal(Math.floor(p * to));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: 0.05 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to, duration]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

function Reveal({ children, delay = 0, style = {} }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.05 }}
      transition={{ duration: 0.5, delay: delay / 1000, ease: [0.16, 1, 0.3, 1] }}
      style={style}
    >
      {children}
    </motion.div>
  );
}

export default function Landing() {
  const { isDark, toggle } = useTheme();
  const { isInstalled, promptInstall } = usePWAInstall();
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setDrawerOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh', color: 'var(--text-primary)', position: 'relative' }}>
      {/* NAV */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? (isDark ? 'rgba(15,15,26,0.92)' : 'rgba(250,248,245,0.94)') : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--border-subtle)' : '1px solid transparent',
        transition: 'all 0.3s ease'
      }}>
        <div 
          className="app-top-nav-inner"
          style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>Lang<span style={{ color: 'var(--accent)' }}>Bridge</span></span>
          
          {/* DESKTOP NAV */}
          <div className="desktop-nav-group" style={{ alignItems: 'center', gap: 10 }}>
            {!isInstalled && (
              <button
                onClick={promptInstall}
                title="Install LangBridge as a desktop or mobile app"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  height: 36,
                  padding: '0 13px',
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 10,
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.color = 'var(--accent)';
                  e.currentTarget.style.background = 'var(--accent-bg)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border-default)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                  e.currentTarget.style.background = 'var(--bg-elevated)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <Download size={14} style={{ color: 'var(--accent)' }} />
                <span>Install</span>
              </button>
            )}

            <button onClick={toggle} title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all 0.2s',
                color: 'var(--text-primary)'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-elevated)'}>
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <Link to="/login" style={{ padding: '8px 16px', fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', borderRadius: 10, transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>Log In</Link>
            <Link to="/signup" style={{ padding: '8px 18px', fontSize: 14, fontWeight: 700, color: '#fff', background: 'var(--accent)', borderRadius: 10, transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-hover)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.transform = 'none'; }}>Get Started</Link>
          </div>

          {/* MOBILE NAV: Get Started pill + Hamburger button */}
          <div className="mobile-nav-group" style={{ alignItems: 'center', gap: 8 }}>
            <Link 
              to="/signup" 
              style={{ 
                padding: '7px 14px', fontSize: 13, fontWeight: 700, color: '#fff', 
                background: 'var(--accent)', borderRadius: 10, textDecoration: 'none' 
              }}
            >
              Get Started
            </Link>

            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="Open Navigation Menu"
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-primary)',
                cursor: 'pointer',
              }}
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setDrawerOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.65)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                zIndex: 9998,
              }}
            />

            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              style={{
                position: 'fixed',
                top: 0,
                right: 0,
                bottom: 0,
                width: 'min(86vw, 340px)',
                background: isDark ? '#10121e' : '#ffffff',
                borderLeft: '1px solid var(--border-default)',
                boxShadow: '-12px 0 36px rgba(0, 0, 0, 0.45)',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                padding: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <span style={{ fontSize: 18, fontWeight: 800 }}>Lang<span style={{ color: 'var(--accent)' }}>Bridge</span></span>
                <button
                  onClick={() => setDrawerOpen(false)}
                  style={{
                    width: 34, height: 34, borderRadius: 10,
                    background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                    color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                <Link
                  to="/signup"
                  onClick={() => setDrawerOpen(false)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '12px 18px', background: 'var(--accent)', color: '#fff',
                    borderRadius: 12, fontWeight: 700, fontSize: 15, textDecoration: 'none',
                    boxShadow: '0 4px 16px rgba(34, 197, 94, 0.3)',
                  }}
                >
                  Get Started Free
                </Link>

                <Link
                  to="/login"
                  onClick={() => setDrawerOpen(false)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '12px 18px', background: 'var(--bg-elevated)', color: 'var(--text-primary)',
                    borderRadius: 12, fontWeight: 650, fontSize: 14, textDecoration: 'none',
                    border: '1px solid var(--border-default)',
                  }}
                >
                  Log In
                </Link>

                {!isInstalled && (
                  <button
                    onClick={() => {
                      promptInstall();
                      setDrawerOpen(false);
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      padding: '12px 18px', background: 'var(--bg-elevated)', color: 'var(--accent)',
                      borderRadius: 12, fontWeight: 650, fontSize: 14,
                      border: '1px solid var(--accent-border)', cursor: 'pointer',
                    }}
                  >
                    <Download size={16} />
                    <span>Install Web App</span>
                  </button>
                )}

                <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
                  <button
                    onClick={toggle}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      width: '100%', padding: '10px 14px', borderRadius: 12,
                      background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {isDark ? <Sun size={16} style={{ color: '#f59e0b' }} /> : <Moon size={16} style={{ color: 'var(--accent)' }} />}
                      <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Toggle</span>
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* HERO SECTION */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '110px 20px 70px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '10%', right: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.07), transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '5%', left: '-8%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.05), transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 40, alignItems: 'center' }}>
          
          {/* Left Column: Hero Text */}
          <div style={{ textAlign: 'left' }}>
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', borderRadius: 999, padding: '6px 18px', marginBottom: 24 }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
              <span style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>South Indian Language Learning</span>
            </motion.div>

            <h1 style={{ fontSize: 'clamp(36px, 5.2vw, 62px)', fontWeight: 800, margin: '0 0 8px', letterSpacing: '-2px', lineHeight: 1.08 }}>
              Learn to speak
            </h1>

            <h1 style={{ fontSize: 'clamp(36px, 5.2vw, 62px)', margin: '0 0 24px', letterSpacing: '-2px', lineHeight: 1.1, minHeight: '1.2em' }}>
              <DynamicLanguageSwitcher />
            </h1>

            <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(15px, 1.7vw, 19px)', maxWidth: 500, margin: '0 0 32px', lineHeight: 1.7 }}>
              AI pronunciation feedback, gamified lessons, and a personal learning plan — all in one app.
            </p>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: isInstalled ? 38 : 16 }}
            >
              <Link to="/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 32px', background: 'var(--accent)', color: '#fff', fontWeight: 700, fontSize: 15, borderRadius: 14, boxShadow: '0 4px 20px rgba(34,197,94,0.35)', transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(34,197,94,0.45)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(34,197,94,0.35)'; }}>Start for free <ArrowRight size={18} /></Link>
              
              <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', background: 'var(--bg-card)', color: 'var(--text-primary)', fontWeight: 600, fontSize: 15, borderRadius: 14, border: '1px solid var(--border-default)', transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--card-shadow)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>Log In</Link>
            </motion.div>

            {!isInstalled && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.28 }}
                style={{ display: 'flex', alignItems: 'center', marginBottom: 36 }}
              >
                <button
                  onClick={promptInstall}
                  title="Install LangBridge App for Desktop & Mobile"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 14px 6px 10px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 999,
                    color: 'var(--text-secondary)',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    boxShadow: 'var(--card-shadow)',
                    transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--accent)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                    e.currentTarget.style.background = 'var(--accent-bg)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border-default)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.background = 'var(--bg-card)';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: 'var(--accent-bg)',
                    color: 'var(--accent)',
                  }}>
                    <Download size={12} />
                  </span>
                  <span>Available on desktop & mobile — <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Install App</strong></span>
                </button>
              </motion.div>
            )}

            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {[
                { icon: Target, l: 'Gamified' },
                { icon: Mic, l: 'Speech AI' },
                { icon: BarChart3, l: 'Personal Plan' },
                { icon: Flame, l: 'Streaks' }
              ].map(({ icon: Icon, l }) => (
                <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--text-muted)', fontSize: 13, fontWeight: 500 }}>
                  <Icon size={15} color="var(--accent)" />
                  {l}
                </span>
              ))}
            </div>
          </div>

          {/* Right Column: Theme-Adaptive 3D Interactive Globe Object with ErrorBoundary */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', width: '100%', minHeight: 300 }}
          >
            <GlobeErrorBoundary>
              <InteractiveLanguageGlobe />
            </GlobeErrorBoundary>
          </motion.div>

        </div>
      </section>

      {/* STATS */}
      <section style={{ padding: '0 20px 70px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
          {[
            { v: 12000, s: '+', l: 'Active Learners', icon: Users, color: 'rgba(34, 197, 94, 0.18)' },
            { v: 95, s: '%', l: 'Satisfaction', icon: Star, color: 'rgba(245, 158, 11, 0.18)' },
            { v: 6, s: '', l: 'Languages', icon: Globe, color: 'rgba(14, 165, 233, 0.18)' },
            { v: 500, s: '+', l: 'Lessons', icon: BookOpen, color: 'rgba(139, 92, 246, 0.18)' },
          ].map(({ v, s, l, icon: Icon, color }, i) => (
            <SpotlightCard key={l} delay={i * 60} spotlightColor={color} style={{ padding: 24, textAlign: 'center' }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', margin: '0 auto 10px' }}>
                <Icon size={19} />
              </div>
              <p style={{ color: 'var(--accent)', fontSize: 26, fontWeight: 800, margin: '0 0 2px', letterSpacing: '-1px' }}><Counter to={v} suffix={s} /></p>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0, fontWeight: 500 }}>{l}</p>
            </SpotlightCard>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: '0 20px 70px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 44 }}>
              <span style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2 }}>Why LangBridge</span>
              <h2 style={{ fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 800, margin: '8px 0 0', letterSpacing: '-1px' }}>
                Everything you need to become <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--accent)' }}>fluent</span>
              </h2>
            </div>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 16 }}>
            {[
              { icon: Mic, title: 'AI Speech Recognition', desc: 'Get real-time feedback on your pronunciation. No judgement, just progress.', color: 'rgba(34, 197, 94, 0.18)' },
              { icon: Target, title: 'Gamified Learning', desc: 'Earn XP, maintain streaks, climb the leaderboard. Learning that\'s fun.', color: 'rgba(245, 158, 11, 0.18)' },
              { icon: Brain, title: 'Adaptive Curriculum', desc: 'Your plan evolves as you learn. Lessons adapt to your pace.', color: 'rgba(139, 92, 246, 0.18)' },
              { icon: BookOpen, title: 'Story Mode', desc: 'Real-life scenarios and interactive dialogues for immersion.', color: 'rgba(14, 165, 233, 0.18)' },
              { icon: Bell, title: 'Smart Reminders', desc: 'Gentle nudges so you never break your streak.', color: 'rgba(236, 72, 153, 0.18)' },
              { icon: Globe, title: 'South Indian Focus', desc: 'Kannada, Tamil, Telugu, Malayalam, Tulu and Kodava.', color: 'rgba(34, 197, 94, 0.18)' },
            ].map(({ icon: Icon, title, desc, color }, i) => (
              <SpotlightCard key={title} delay={i * 60} spotlightColor={color}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', marginBottom: 16 }}>
                  <Icon size={22} />
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>{title}</h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.65 }}>{desc}</p>
              </SpotlightCard>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: '0 20px 70px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 44 }}>
              <span style={{ color: 'var(--purple)', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2 }}>How it works</span>
              <h2 style={{ fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 800, margin: '8px 0 0', letterSpacing: '-1px' }}>
                Three steps to <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--purple)' }}>fluency</span>
              </h2>
            </div>
          </Reveal>
          {[
            { n: '01', title: 'Tell us your goals', desc: 'Pick your language, share your motivation, set a schedule.', color: 'var(--accent)' },
            { n: '02', title: 'Get your personal plan', desc: 'We build a path tailored to your pace, goals, and availability.', color: 'var(--purple)' },
            { n: '03', title: 'Practice daily', desc: 'Complete bite-sized lessons, earn XP, grow your confidence.', color: 'var(--amber)' },
          ].map(({ n, title, desc, color }, i) => (
            <Reveal key={n} delay={i * 80}>
              <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start', padding: '20px 0', borderBottom: i < 2 ? '1px solid var(--border-subtle)' : 'none' }}>
                <div style={{ width: 46, height: 46, borderRadius: 14, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color, flexShrink: 0 }}>{n}</div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px' }}>{title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0, lineHeight: 1.65 }}>{desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ padding: '0 20px 70px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 44 }}>
              <span style={{ color: 'var(--amber)', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2 }}>Testimonials</span>
              <h2 style={{ fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 800, margin: '8px 0 0', letterSpacing: '-1px' }}>
                Loved by <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--amber)' }}>thousands</span>
              </h2>
            </div>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {[
              { name: 'Priya M.', lang: 'Kannada', i: 'PM', c: '#22c55e', q: 'I moved to Bangalore and felt lost. LangBridge helped me chat with neighbors in two weeks!' },
              { name: 'Arjun S.', lang: 'Tamil', i: 'AS', c: '#8b5cf6', q: 'The speech recognition handles Tamil perfectly. Zero to basic conversations in a month.' },
              { name: 'Sara K.', lang: 'Telugu', i: 'SK', c: '#f59e0b', q: "Haven't missed a day in 3 months. My in-laws in Hyderabad are speechless!" },
            ].map(({ name, lang, i: init, c, q }, idx) => (
              <SpotlightCard key={name} delay={idx * 80} spotlightColor={c + '25'} style={{ padding: '24px 20px' }}>
                <div style={{ display: 'flex', gap: 3, marginBottom: 12 }}>
                  {[...Array(5)].map((_, j) => <Star key={j} size={13} fill="#f59e0b" color="#f59e0b" />)}
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14.5, lineHeight: 1.7, margin: '0 0 18px', fontStyle: 'italic' }}>"{q}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: c, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 700 }}>{init}</div>
                  <div>
                    <p style={{ color: 'var(--text-primary)', fontSize: 13.5, fontWeight: 600, margin: 0 }}>{name}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: 0 }}>Learning {lang}</p>
                  </div>
                </div>
              </SpotlightCard>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '0 20px 80px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <Reveal>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--accent-border)', borderRadius: 24, padding: '48px 32px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-60%', right: '-20%', width: '60%', height: '200%', background: 'radial-gradient(circle, rgba(34,197,94,0.08), transparent 60%)', pointerEvents: 'none' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ width: 56, height: 56, borderRadius: 18, background: 'var(--accent-bg)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                  <Rocket size={28} />
                </div>
                <h2 style={{ fontSize: 'clamp(22px, 4vw, 34px)', fontWeight: 800, margin: '0 0 10px', letterSpacing: '-0.8px' }}>Your first lesson is free.</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 15, margin: '0 0 28px', lineHeight: 1.7 }}>No credit card. No commitment. Just you and your new language.</p>
                
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Link to="/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 36px', background: 'var(--accent)', color: '#fff', fontWeight: 700, fontSize: 15, borderRadius: 14, boxShadow: '0 4px 20px rgba(34,197,94,0.3)', transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'none'}>Start Learning <ArrowRight size={18} /></Link>
                  
                  {!isInstalled && (
                    <button
                      onClick={promptInstall}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 26px',
                        background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontWeight: 600, fontSize: 15,
                        borderRadius: 14, border: '1px solid var(--border-default)', cursor: 'pointer',
                        transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = 'var(--accent)';
                        e.currentTarget.style.color = 'var(--accent)';
                        e.currentTarget.style.background = 'var(--accent-bg)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'var(--border-default)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                        e.currentTarget.style.background = 'var(--bg-elevated)';
                        e.currentTarget.style.transform = 'none';
                      }}
                    >
                      <Download size={17} style={{ color: 'var(--accent)' }} />
                      <span>Install App</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <footer style={{ borderTop: '1px solid var(--border-subtle)', padding: '24px 20px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-muted)' }}>LangBridge</span>
          <p style={{ color: 'var(--text-faint)', fontSize: 12, margin: 0 }}>© 2026 LangBridge. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}