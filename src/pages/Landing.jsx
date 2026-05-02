import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';

// ── Floating particle canvas ──────────────────────────────────────────────────
function ParticleField() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    const onResize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    window.addEventListener('resize', onResize);

    const count = 55;
    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.5 + 0.4,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.5 + 0.1,
    }));

    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(46,204,113,${p.opacity})`;
        ctx.fill();
      }
      // Draw connections
      for (let i = 0; i < count; i++) {
        for (let j = i + 1; j < count; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(46,204,113,${0.08 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />;
}

// ── Typewriter for rotating words ─────────────────────────────────────────────
const WORDS = ['Kannada', 'Tamil', 'Telugu', 'Malayalam', 'Tulu', 'Kodava'];
function Typewriter() {
  const [wordIdx, setWordIdx] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [pause, setPause] = useState(false);

  useEffect(() => {
    if (pause) { const t = setTimeout(() => setPause(false), 1200); return () => clearTimeout(t); }
    const word = WORDS[wordIdx];
    if (!deleting && displayed === word) { setPause(true); setDeleting(true); return; }
    if (deleting && displayed === '') { setDeleting(false); setWordIdx(i => (i + 1) % WORDS.length); return; }
    const speed = deleting ? 60 : 100;
    const t = setTimeout(() => {
      setDisplayed(prev => deleting ? prev.slice(0, -1) : word.slice(0, prev.length + 1));
    }, speed);
    return () => clearTimeout(t);
  }, [displayed, deleting, wordIdx, pause]);

  return (
    <span style={{ color: '#2ecc71', display: 'inline-block', minWidth: '160px' }}>
      {displayed}
      <span style={{ animation: 'blink 1s step-end infinite', color: '#2ecc71', marginLeft: '2px' }}>|</span>
    </span>
  );
}

// ── Animated counter ──────────────────────────────────────────────────────────
function Counter({ to, suffix = '', duration = 1800 }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      let start = null;
      const step = ts => {
        if (!start) start = ts;
        const pct = Math.min(1, (ts - start) / duration);
        setVal(Math.floor(pct * to));
        if (pct < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to, duration]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

// ── Feature card ──────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc, color, delay }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.2 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  const [hov, setHov] = useState(false);
  return (
    <div ref={ref} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(24px)',
        transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
        background: hov ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${hov ? color + '40' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: '20px', padding: '28px 26px',
        cursor: 'default', transition: `all 0.25s ease, opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
        boxShadow: hov ? `0 16px 40px rgba(0,0,0,0.3), 0 0 0 1px ${color}20` : '0 4px 16px rgba(0,0,0,0.2)',
        position: 'relative', overflow: 'hidden',
      }}>
      {hov && <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '120px', height: '120px', background: color + '18', borderRadius: '50%', filter: 'blur(40px)', pointerEvents: 'none' }} />}
      <div style={{ fontSize: '32px', marginBottom: '14px' }}>{icon}</div>
      <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: '700', margin: '0 0 8px', letterSpacing: '-0.2px' }}>{title}</h3>
      <p style={{ color: '#6b7280', fontSize: '14px', margin: 0, lineHeight: 1.65 }}>{desc}</p>
    </div>
  );
}

// ── Testimonial card ──────────────────────────────────────────────────────────
function TestiCard({ name, lang, quote, avatar, delay }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.2 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(20px)',
      transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '18px', padding: '24px',
    }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
        {[...Array(5)].map((_, i) => <span key={i} style={{ color: '#facc15', fontSize: '13px' }}>★</span>)}
      </div>
      <p style={{ color: '#d1d5db', fontSize: '14px', lineHeight: 1.7, margin: '0 0 16px', fontStyle: 'italic' }}>"{quote}"</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(46,204,113,0.15)', border: '1px solid rgba(46,204,113,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>{avatar}</div>
        <div>
          <p style={{ color: '#fff', fontSize: '13px', fontWeight: '600', margin: 0 }}>{name}</p>
          <p style={{ color: '#6b7280', fontSize: '11px', margin: 0 }}>Learning {lang}</p>
        </div>
      </div>
    </div>
  );
}

// ── Main Landing ──────────────────────────────────────────────────────────────
export default function Landing() {
  const [mounted, setMounted] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    setTimeout(() => setMounted(true), 80);
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const heroOpacity = Math.max(0, 1 - scrollY / 400);
  const heroY = scrollY * 0.25;

  const fadeUp = (delay = 0) => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? 'none' : 'translateY(28px)',
    transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
  });

  return (
    <div style={{ minHeight: '100vh', overflowX: 'hidden', position: 'relative' }}>
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes pulse-ring { 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(1.5);opacity:0} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(46,204,113,0.3); border-radius: 3px; }
      `}</style>

      <ParticleField />

      {/* ── HERO ── */}
      <section style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '80px 24px 60px', position: 'relative', zIndex: 1,
        opacity: heroOpacity, transform: `translateY(${heroY}px)`,
      }}>
        {/* Radial glow center */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(46,204,113,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '820px', width: '100%', textAlign: 'center', position: 'relative' }}>

          {/* Badge */}
          <div style={{ ...fadeUp(0), display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(46,204,113,0.1)', border: '1px solid rgba(46,204,113,0.25)', borderRadius: '999px', padding: '7px 18px', marginBottom: '32px' }}>
            <div style={{ position: 'relative' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2ecc71', animation: 'pulse-ring 1.5s ease-out infinite' }} />
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#2ecc71' }} />
            </div>
            <span style={{ color: '#2ecc71', fontSize: '13px', fontWeight: '600', letterSpacing: '0.3px' }}>🌿 South Indian Language Learning</span>
          </div>

          {/* Headline */}
          <h1 style={{ ...fadeUp(100), fontSize: 'clamp(44px, 8vw, 80px)', fontWeight: '900', color: '#fff', margin: '0 0 10px', letterSpacing: '-3px', lineHeight: 1.05 }}>
            Master
          </h1>
          <h1 style={{ ...fadeUp(150), fontSize: 'clamp(44px, 8vw, 80px)', fontWeight: '900', margin: '0 0 24px', letterSpacing: '-3px', lineHeight: 1.05, background: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 40%, #a8edbe 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundSize: '200% auto', animation: 'shimmer 4s linear infinite' }}>
            <Typewriter />
          </h1>

          <p style={{ ...fadeUp(220), fontSize: 'clamp(16px, 2.2vw, 19px)', color: '#9ca3af', maxWidth: '560px', margin: '0 auto 44px', lineHeight: 1.75 }}>
            Learn Kannada, Tamil, Telugu, Malayalam and more — with AI speech recognition, gamified lessons, and a plan built for you.
          </p>

          {/* CTAs */}
          <div style={{ ...fadeUp(300), display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '60px' }}>
            <Link to="/signup" style={{ position: 'relative', overflow: 'hidden', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '15px 36px', background: '#2ecc71', color: '#000', fontWeight: '800', fontSize: '16px', borderRadius: '14px', textDecoration: 'none', boxShadow: '0 0 30px rgba(46,204,113,0.35)', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#27ae60'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 40px rgba(46,204,113,0.45)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#2ecc71'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 0 30px rgba(46,204,113,0.35)'; }}>
              Get Started Free →
            </Link>
            <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '15px 36px', background: 'rgba(255,255,255,0.07)', color: '#fff', fontWeight: '600', fontSize: '16px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.12)', textDecoration: 'none', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'none'; }}>
              Log In
            </Link>
          </div>

          {/* Micro-trust pills */}
          <div style={{ ...fadeUp(380), display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {[['🎯', 'Gamified Lessons'], ['🎤', 'Speech Recognition'], ['📊', 'Personalized Plan'], ['🔥', 'Daily Streaks']].map(([icon, label]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '7px', color: '#6b7280', fontSize: '13px', fontWeight: '500' }}>
                <span>{icon}</span><span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '0 24px 100px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
          {[
            { val: 12000, suffix: '+', label: 'Active Learners', icon: '👥', color: '#818cf8' },
            { val: 95, suffix: '%', label: 'Satisfaction Rate', icon: '⭐', color: '#facc15' },
            { val: 6, suffix: ' languages', label: 'South Indian', icon: '🌿', color: '#2ecc71' },
            { val: 500, suffix: '+', label: 'Lesson Modules', icon: '📚', color: '#fb923c' },
          ].map(({ val, suffix, label, icon, color }) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>{icon}</div>
              <p style={{ color, fontSize: '28px', fontWeight: '900', margin: '0 0 4px', letterSpacing: '-0.5px' }}>
                <Counter to={val} suffix={suffix} />
              </p>
              <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '0 24px 100px' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <p style={{ color: '#2ecc71', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 12px' }}>Why LangBridge</p>
            <h2 style={{ color: '#fff', fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: '800', margin: 0, letterSpacing: '-1px' }}>Built for South India. Built for you.</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
            {[
              { icon: '🎤', title: 'AI Speech Recognition', desc: 'Speak naturally and get instant feedback on your pronunciation from our real-time AI engine.', color: '#2ecc71', delay: 0 },
              { icon: '🎯', title: 'Gamified Learning', desc: 'Earn XP, maintain streaks, and climb the leaderboard. Learning feels like playing.', color: '#facc15', delay: 80 },
              { icon: '🧠', title: 'Adaptive Curriculum', desc: 'Your plan evolves with you — lessons are hand-picked based on your pace and goals.', color: '#818cf8', delay: 160 },
              { icon: '📖', title: 'Story Mode', desc: 'Immerse yourself in interactive dialogues and real-life scenarios as your skill grows.', color: '#fb923c', delay: 240 },
              { icon: '🔔', title: 'Smart Reminders', desc: 'Practice at the time that works for you. We nudge you gently so you never break the streak.', color: '#ec4899', delay: 320 },
              { icon: '🌿', title: 'South Indian Focus', desc: 'Deep support for Kannada, Tamil, Telugu, Malayalam, Tulu and Kodava — with native scripts, audio, and cultural context.', color: '#34d399', delay: 400 },
            ].map(f => <FeatureCard key={f.title} {...f} />)}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '0 24px 100px' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <p style={{ color: '#2ecc71', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 12px' }}>How it works</p>
            <h2 style={{ color: '#fff', fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: '800', margin: 0, letterSpacing: '-1px' }}>Up and running in 3 minutes</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {[
              { n: '01', title: 'Tell us your goals', desc: 'Pick a language, your reasons, and when you want to practice. Takes under 3 minutes.', icon: '🎯', color: '#2ecc71' },
              { n: '02', title: 'Get your personal plan', desc: 'We build a lesson curriculum tailored to your goals, pace, and schedule.', icon: '🧠', color: '#818cf8' },
              { n: '03', title: 'Practice every day', desc: 'Complete bite-sized lessons, earn XP, and watch your fluency skyrocket.', icon: '🚀', color: '#facc15' },
            ].map(({ n, title, desc, icon, color }, i) => (
              <div key={n} style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', padding: '28px 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                <div style={{ flexShrink: 0, width: '52px', height: '52px', borderRadius: '14px', background: color + '18', border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>{icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                    <span style={{ color: color, fontSize: '11px', fontWeight: '800', letterSpacing: '1px' }}>{n}</span>
                    <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: '700', margin: 0 }}>{title}</h3>
                  </div>
                  <p style={{ color: '#6b7280', fontSize: '14px', margin: 0, lineHeight: 1.65 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '0 24px 100px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <p style={{ color: '#2ecc71', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 12px' }}>Learners love it</p>
            <h2 style={{ color: '#fff', fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: '800', margin: 0, letterSpacing: '-1px' }}>Real people, real results</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
            <TestiCard name="Priya M." lang="Kannada" avatar="🌸" delay={0} quote="I moved to Bangalore last year and felt so lost. LangBridge helped me order chai and chat with my neighbors within two weeks!" />
            <TestiCard name="Arjun S." lang="Tamil" avatar="🎋" delay={100} quote="The speech recognition handles Tamil script and pronunciation perfectly. I went from zero to holding basic conversations in 30 days." />
            <TestiCard name="Sara K." lang="Telugu" avatar="✨" delay={200} quote="The streak system is addictive in the best way. I haven't missed a day in 3 months. My in-laws back in Hyderabad are shocked!" />
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '0 24px 100px' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div style={{
            background: 'rgba(46,204,113,0.07)', border: '1px solid rgba(46,204,113,0.2)',
            borderRadius: '28px', padding: '60px 40px', textAlign: 'center',
            position: 'relative', overflow: 'hidden',
            boxShadow: '0 0 80px rgba(46,204,113,0.08)',
          }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 0%, rgba(46,204,113,0.15), transparent 60%)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: '48px', marginBottom: '20px', animation: 'float 3s ease-in-out infinite' }}>🚀</div>
              <h2 style={{ color: '#fff', fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: '900', margin: '0 0 14px', letterSpacing: '-1px' }}>
                Your first lesson is free.
              </h2>
              <p style={{ color: '#9ca3af', fontSize: '16px', margin: '0 0 36px', lineHeight: 1.7 }}>
                No credit card. No commitment. Just you and your new language.
              </p>
              <Link to="/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '16px 44px', background: '#2ecc71', color: '#000', fontWeight: '800', fontSize: '17px', borderRadius: '14px', textDecoration: 'none', boxShadow: '0 0 40px rgba(46,204,113,0.4)', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 50px rgba(46,204,113,0.5)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 0 40px rgba(46,204,113,0.4)'; }}>
                Start Learning for Free →
              </Link>
              <p style={{ color: '#4b5563', fontSize: '13px', marginTop: '18px' }}>Joins 12,000+ learners already on LangBridge</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ position: 'relative', zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.06)', padding: '28px 24px', textAlign: 'center' }}>
        <p style={{ color: '#374151', fontSize: '13px', margin: 0 }}>© 2026 LangBridge. All rights reserved.</p>
      </footer>
    </div>
  );
}