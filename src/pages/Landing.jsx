import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../components/hooks/useTheme';
import { Sun, Moon, Target, Mic, BarChart3, Flame, Users, Star, Globe, BookOpen, Brain, Bell, Rocket, ArrowRight } from 'lucide-react';
import { SpotlightCard } from '../components/ui/ReactBits';
import InteractiveLanguageGlobe from '../components/ui/InteractiveLanguageGlobe';
import { motion, AnimatePresence } from 'framer-motion';

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
          initial={{ y: 18, opacity: 0, filter: 'blur(4px)' }}
          animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
          exit={{ y: -18, opacity: 0, filter: 'blur(4px)' }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
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
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return; obs.disconnect();
      let start = null;
      const step = ts => { if (!start) start = ts; const p = Math.min(1, (ts - start) / duration); setVal(Math.floor(p * to)); if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to, duration]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

function Reveal({ children, delay = 0, style = {} }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.6, delay: delay / 1000, ease: [0.16, 1, 0.3, 1] }}
      style={style}
    >
      {children}
    </motion.div>
  );
}

export default function Landing() {
  const { isDark, toggle } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh', color: 'var(--text-primary)', position: 'relative' }}>
      {/* NAV */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? (isDark ? 'rgba(15,15,26,0.9)' : 'rgba(250,248,245,0.92)') : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--border-subtle)' : '1px solid transparent',
        transition: 'all 0.3s ease'
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>Lang<span style={{ color: 'var(--accent)' }}>Bridge</span></span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={toggle} title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all 0.2s', marginRight: 4,
                color: 'var(--text-primary)'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-elevated)'}>
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link to="/login" style={{ padding: '8px 20px', fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', borderRadius: 10, transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>Log In</Link>
            <Link to="/signup" style={{ padding: '9px 22px', fontSize: 14, fontWeight: 700, color: '#fff', background: 'var(--accent)', borderRadius: 10, transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-hover)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.transform = 'none'; }}>Get Started</Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '120px 24px 80px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '10%', right: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.07), transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '5%', left: '-8%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.05), transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 48, alignItems: 'center' }}>
          
          {/* Left Column: Hero Text */}
          <div style={{ textAlign: 'left' }}>
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', borderRadius: 999, padding: '6px 18px', marginBottom: 28 }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
              <span style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>South Indian Language Learning</span>
            </motion.div>

            <h1 style={{ fontSize: 'clamp(40px, 5.5vw, 64px)', fontWeight: 800, margin: '0 0 8px', letterSpacing: '-2px', lineHeight: 1.08 }}>
              Learn to speak
            </h1>

            <h1 style={{ fontSize: 'clamp(40px, 5.5vw, 64px)', margin: '0 0 24px', letterSpacing: '-2px', lineHeight: 1.1, minHeight: '1.2em' }}>
              <DynamicLanguageSwitcher />
            </h1>

            <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(16px, 1.8vw, 19px)', maxWidth: 500, margin: '0 0 36px', lineHeight: 1.7 }}>
              AI pronunciation feedback, gamified lessons, and a personal learning plan — all in one app.
            </p>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 44 }}
            >
              <Link to="/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '15px 36px', background: 'var(--accent)', color: '#fff', fontWeight: 700, fontSize: 16, borderRadius: 14, boxShadow: '0 4px 20px rgba(34,197,94,0.35)', transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(34,197,94,0.45)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(34,197,94,0.35)'; }}>Start for free <ArrowRight size={18} /></Link>
              <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '15px 36px', background: 'var(--bg-card)', color: 'var(--text-primary)', fontWeight: 600, fontSize: 16, borderRadius: 14, border: '1px solid var(--border-default)', transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--card-shadow)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>Log In</Link>
            </motion.div>

            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {[
                { icon: Target, l: 'Gamified' },
                { icon: Mic, l: 'Speech AI' },
                { icon: BarChart3, l: 'Personal Plan' },
                { icon: Flame, l: 'Streaks' }
              ].map(({ icon: Icon, l }) => (
                <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 13, fontWeight: 500 }}>
                  <Icon size={16} color="var(--accent)" />
                  {l}
                </span>
              ))}
            </div>
          </div>

          {/* Right Column: Theme-Adaptive 3D Interactive Globe Object */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
          >
            <InteractiveLanguageGlobe />
          </motion.div>

        </div>
      </section>

      {/* STATS */}
      <section style={{ padding: '0 24px 80px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          {[
            { v: 12000, s: '+', l: 'Active Learners', icon: Users, color: 'rgba(34, 197, 94, 0.18)' },
            { v: 95, s: '%', l: 'Satisfaction', icon: Star, color: 'rgba(245, 158, 11, 0.18)' },
            { v: 6, s: '', l: 'Languages', icon: Globe, color: 'rgba(14, 165, 233, 0.18)' },
            { v: 500, s: '+', l: 'Lessons', icon: BookOpen, color: 'rgba(139, 92, 246, 0.18)' },
          ].map(({ v, s, l, icon: Icon, color }, i) => (
            <SpotlightCard key={l} delay={i * 60} spotlightColor={color} style={{ padding: 28, textAlign: 'center' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', margin: '0 auto 12px' }}>
                <Icon size={20} />
              </div>
              <p style={{ color: 'var(--accent)', fontSize: 28, fontWeight: 800, margin: '0 0 2px', letterSpacing: '-1px' }}><Counter to={v} suffix={s} /></p>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0, fontWeight: 500 }}>{l}</p>
            </SpotlightCard>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: '0 24px 80px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <span style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2 }}>Why LangBridge</span>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, margin: '10px 0 0', letterSpacing: '-1px' }}>
                Everything you need to become <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--accent)' }}>fluent</span>
              </h2>
            </div>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {[
              { icon: Mic, title: 'AI Speech Recognition', desc: 'Get real-time feedback on your pronunciation. No judgement, just progress.', color: 'rgba(34, 197, 94, 0.18)' },
              { icon: Target, title: 'Gamified Learning', desc: 'Earn XP, maintain streaks, climb the leaderboard. Learning that\'s fun.', color: 'rgba(245, 158, 11, 0.18)' },
              { icon: Brain, title: 'Adaptive Curriculum', desc: 'Your plan evolves as you learn. Lessons adapt to your pace.', color: 'rgba(139, 92, 246, 0.18)' },
              { icon: BookOpen, title: 'Story Mode', desc: 'Real-life scenarios and interactive dialogues for immersion.', color: 'rgba(14, 165, 233, 0.18)' },
              { icon: Bell, title: 'Smart Reminders', desc: 'Gentle nudges so you never break your streak.', color: 'rgba(236, 72, 153, 0.18)' },
              { icon: Globe, title: 'South Indian Focus', desc: 'Kannada, Tamil, Telugu, Malayalam, Tulu and Kodava.', color: 'rgba(34, 197, 94, 0.18)' },
            ].map(({ icon: Icon, title, desc, color }, i) => (
              <SpotlightCard key={title} delay={i * 60} spotlightColor={color}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', marginBottom: 20 }}>
                  <Icon size={24} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>{title}</h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.7 }}>{desc}</p>
              </SpotlightCard>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: '0 24px 80px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <span style={{ color: 'var(--purple)', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2 }}>How it works</span>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, margin: '10px 0 0', letterSpacing: '-1px' }}>
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
              <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', padding: '24px 0', borderBottom: i < 2 ? '1px solid var(--border-subtle)' : 'none' }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color, flexShrink: 0 }}>{n}</div>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 4px' }}>{title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0, lineHeight: 1.7 }}>{desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ padding: '0 24px 80px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <span style={{ color: 'var(--amber)', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2 }}>Testimonials</span>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, margin: '10px 0 0', letterSpacing: '-1px' }}>
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
              <SpotlightCard key={name} delay={idx * 80} spotlightColor={c + '25'} style={{ padding: '28px 24px' }}>
                <div style={{ display: 'flex', gap: 3, marginBottom: 14 }}>
                  {[...Array(5)].map((_, j) => <Star key={j} size={14} fill="#f59e0b" color="#f59e0b" />)}
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.75, margin: '0 0 20px', fontStyle: 'italic' }}>"{q}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: c, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 700 }}>{init}</div>
                  <div>
                    <p style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, margin: 0 }}>{name}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: 0 }}>Learning {lang}</p>
                  </div>
                </div>
              </SpotlightCard>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '0 24px 80px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <Reveal>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--accent-border)', borderRadius: 28, padding: '56px 40px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-60%', right: '-20%', width: '60%', height: '200%', background: 'radial-gradient(circle, rgba(34,197,94,0.08), transparent 60%)', pointerEvents: 'none' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ width: 64, height: 64, borderRadius: 20, background: 'var(--accent-bg)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <Rocket size={32} />
                </div>
                <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, margin: '0 0 12px', letterSpacing: '-0.8px' }}>Your first lesson is free.</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 16, margin: '0 0 32px', lineHeight: 1.7 }}>No credit card. No commitment. Just you and your new language.</p>
                <Link to="/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '15px 40px', background: 'var(--accent)', color: '#fff', fontWeight: 700, fontSize: 16, borderRadius: 14, boxShadow: '0 4px 20px rgba(34,197,94,0.3)', transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'none'}>Start Learning <ArrowRight size={18} /></Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <footer style={{ borderTop: '1px solid var(--border-subtle)', padding: '28px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-muted)' }}>LangBridge</span>
          <p style={{ color: 'var(--text-faint)', fontSize: 13, margin: 0 }}>© 2026 LangBridge. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}