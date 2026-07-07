import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';

const WORDS = ['Kannada', 'Tamil', 'Telugu', 'Malayalam', 'Tulu', 'Kodava'];

function Typewriter() {
  const [wordIdx, setWordIdx] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [pause, setPause] = useState(false);
  useEffect(() => {
    if (pause) { const t = setTimeout(() => setPause(false), 1500); return () => clearTimeout(t); }
    const word = WORDS[wordIdx];
    if (!deleting && displayed === word) { setPause(true); setDeleting(true); return; }
    if (deleting && displayed === '') { setDeleting(false); setWordIdx(i => (i + 1) % WORDS.length); return; }
    const t = setTimeout(() => setDisplayed(prev => deleting ? prev.slice(0, -1) : word.slice(0, prev.length + 1)), deleting ? 50 : 90);
    return () => clearTimeout(t);
  }, [displayed, deleting, wordIdx, pause]);
  return (
    <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>
      {displayed}<span style={{ animation: 'blink 1s step-end infinite', color: 'var(--accent)' }}>|</span>
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
  const [vis, setVis] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect(); } }, { threshold: 0.12 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return <div ref={ref} style={{ ...style, opacity: vis ? 1 : 0, transform: vis ? 'none' : 'translateY(18px)', transition: `opacity 0.6s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.6s cubic-bezier(0.16,1,0.3,1) ${delay}ms` }}>{children}</div>;
}

function FeatureCard({ emoji, title, desc, delay }) {
  const [hov, setHov] = useState(false);
  return (
    <Reveal delay={delay}>
      <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 20, padding: '32px 28px', transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)', transform: hov ? 'translateY(-4px)' : 'none', boxShadow: hov ? 'var(--card-shadow-hover)' : 'var(--card-shadow)' }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 20 }}>{emoji}</div>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>{title}</h3>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.7 }}>{desc}</p>
      </div>
    </Reveal>
  );
}

export default function Landing() {
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    setTimeout(() => setMounted(true), 60);
    const h = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  const f = (d = 0) => ({ opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(20px)', transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${d}ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${d}ms` });

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh', color: 'var(--text-primary)' }}>
      {/* NAV */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: scrolled ? 'var(--bg-base)' : 'transparent', backdropFilter: scrolled ? 'blur(16px)' : 'none', borderBottom: scrolled ? '1px solid var(--border-subtle)' : '1px solid transparent', transition: 'all 0.3s ease' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>Lang<span style={{ color: 'var(--accent)' }}>Bridge</span></span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Link to="/login" style={{ padding: '8px 20px', fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', borderRadius: 10, transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>Log In</Link>
            <Link to="/signup" style={{ padding: '9px 22px', fontSize: 14, fontWeight: 700, color: '#fff', background: 'var(--accent)', borderRadius: 10, transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-hover)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.transform = 'none'; }}>Get Started</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '100px 24px 80px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '10%', right: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.07), transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '5%', left: '-8%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.05), transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 780, width: '100%', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ ...f(0), display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', borderRadius: 999, padding: '6px 16px', marginBottom: 28 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
            <span style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>South Indian Language Learning</span>
          </div>
          <h1 style={{ ...f(80), fontSize: 'clamp(42px, 7vw, 72px)', fontWeight: 800, margin: '0 0 8px', letterSpacing: '-2.5px', lineHeight: 1.05 }}>Learn to speak</h1>
          <h1 style={{ ...f(140), fontSize: 'clamp(42px, 7vw, 72px)', margin: '0 0 28px', letterSpacing: '-2.5px', lineHeight: 1.1 }}><Typewriter /></h1>
          <p style={{ ...f(200), fontSize: 'clamp(16px, 2vw, 19px)', color: 'var(--text-secondary)', maxWidth: 520, margin: '0 auto 40px', lineHeight: 1.75 }}>AI pronunciation feedback, gamified lessons, and a personal learning plan — all in one app.</p>
          <div style={{ ...f(280), display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 }}>
            <Link to="/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 34px', background: 'var(--accent)', color: '#fff', fontWeight: 700, fontSize: 16, borderRadius: 14, boxShadow: '0 4px 14px rgba(34,197,94,0.3)', transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(34,197,94,0.35)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(34,197,94,0.3)'; }}>Start for free →</Link>
            <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 34px', background: 'var(--bg-card)', color: 'var(--text-primary)', fontWeight: 600, fontSize: 16, borderRadius: 14, border: '1px solid var(--border-default)', transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--card-shadow)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>Log In</Link>
          </div>
          <div style={{ ...f(360), display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[['🎯','Gamified'], ['🎤','Speech AI'], ['📊','Personal Plan'], ['🔥','Streaks']].map(([e, l]) => (
              <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13, fontWeight: 500 }}><span>{e}</span>{l}</span>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section style={{ padding: '0 24px 80px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          {[
            { v: 12000, s: '+', l: 'Active Learners', e: '👥' },
            { v: 95, s: '%', l: 'Satisfaction', e: '⭐' },
            { v: 6, s: '', l: 'Languages', e: '🌿' },
            { v: 500, s: '+', l: 'Lessons', e: '📚' },
          ].map(({ v, s, l, e }, i) => (
            <Reveal key={l} delay={i * 60}>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 20, padding: 28, textAlign: 'center', transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)' }}
                onMouseEnter={ev => { ev.currentTarget.style.transform = 'translateY(-3px)'; ev.currentTarget.style.boxShadow = 'var(--card-shadow-hover)'; }}
                onMouseLeave={ev => { ev.currentTarget.style.transform = 'none'; ev.currentTarget.style.boxShadow = 'none'; }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, margin: '0 auto 12px' }}>{e}</div>
                <p style={{ color: 'var(--accent)', fontSize: 28, fontWeight: 800, margin: '0 0 2px', letterSpacing: '-1px' }}><Counter to={v} suffix={s} /></p>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0, fontWeight: 500 }}>{l}</p>
              </div>
            </Reveal>
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
            <FeatureCard emoji="🎤" title="AI Speech Recognition" desc="Get real-time feedback on your pronunciation. No judgement, just progress." delay={0} />
            <FeatureCard emoji="🎯" title="Gamified Learning" desc="Earn XP, maintain streaks, climb the leaderboard. Learning that's fun." delay={60} />
            <FeatureCard emoji="🧠" title="Adaptive Curriculum" desc="Your plan evolves as you learn. Lessons adapt to your pace." delay={120} />
            <FeatureCard emoji="📖" title="Story Mode" desc="Real-life scenarios and interactive dialogues for immersion." delay={180} />
            <FeatureCard emoji="🔔" title="Smart Reminders" desc="Gentle nudges so you never break your streak." delay={240} />
            <FeatureCard emoji="🌿" title="South Indian Focus" desc="Kannada, Tamil, Telugu, Malayalam, Tulu and Kodava." delay={300} />
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
              <Reveal key={name} delay={idx * 80}>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 20, padding: '28px 24px' }}>
                  <div style={{ display: 'flex', gap: 3, marginBottom: 14 }}>{[...Array(5)].map((_, j) => <span key={j} style={{ color: '#f59e0b', fontSize: 14 }}>★</span>)}</div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.75, margin: '0 0 20px', fontStyle: 'italic' }}>"{q}"</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: c, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 700 }}>{init}</div>
                    <div>
                      <p style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, margin: 0 }}>{name}</p>
                      <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: 0 }}>Learning {lang}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
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
                <div style={{ fontSize: 48, marginBottom: 16 }}>🚀</div>
                <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, margin: '0 0 12px', letterSpacing: '-0.8px' }}>Your first lesson is free.</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 16, margin: '0 0 32px', lineHeight: 1.7 }}>No credit card. No commitment. Just you and your new language.</p>
                <Link to="/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '15px 40px', background: 'var(--accent)', color: '#fff', fontWeight: 700, fontSize: 16, borderRadius: 14, boxShadow: '0 4px 20px rgba(34,197,94,0.3)', transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'none'}>Start Learning →</Link>
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