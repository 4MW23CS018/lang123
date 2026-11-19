import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Link, useNavigate } from 'react-router-dom';

export default function Signup() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showLoginHint, setShowLoginHint] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState('');
  const signup = useMutation(api.auth.signup);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setShowLoginHint(false);
    setLoading(true);
    try {
      const res = await signup({ name, password });
      const userId = typeof res === 'object' && res ? res.userId : res;
      const userName = (typeof res === 'object' && res?.name) || name;
      localStorage.setItem('userId', userId);
      localStorage.setItem('userName', userName);

      if (res?.isExistingUser) {
        navigate(res.onboardingCompleted ? '/dashboard' : '/onboarding');
      } else {
        navigate('/onboarding');
      }
    } catch (err) {
      const raw = err?.message || '';
      if (
        raw.includes('USERNAME_ALREADY_TAKEN') ||
        raw.includes('already taken') ||
        raw.includes('choose another')
      ) {
        setError('This username is already registered.');
        setShowLoginHint(true);
      } else {
        const cleanMsg = raw
          .replace(/^\[Request ID:.*?\]\s*/i, '')
          .replace(/^Server Error\s*/i, '')
          .replace(/^Uncaught Error:\s*/i, '')
          .trim();
        setError(cleanMsg || 'Unable to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field) => ({
    width: '100%',
    padding: '14px 16px',
    boxSizing: 'border-box',
    background: 'var(--bg-input)',
    border: `1.5px solid ${focused === field ? 'var(--purple)' : 'var(--border-default)'}`,
    borderRadius: 12,
    color: 'var(--text-primary)',
    fontSize: 16, // 16px prevents iOS Safari auto-zoom
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxShadow: focused === field ? '0 0 0 3px rgba(139,92,246,0.1)' : 'none',
  });

  return (
    <div className="auth-page-container">
      {/* Left branding panel (Desktop Only) */}
      <div className="auth-branding-panel signup-gradient">
        <div style={{ position: 'absolute', bottom: '10%', left: '-10%', width: 350, height: 350, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>Lang<span style={{ opacity: 0.7 }}>Bridge</span></span>
          <h1 style={{ fontSize: 40, fontWeight: 800, color: '#fff', margin: '40px 0 16px', letterSpacing: '-1.5px', lineHeight: 1.15 }}>
            Start your<br/>journey today.
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, lineHeight: 1.7, maxWidth: 320 }}>
            Join thousands mastering Kannada, Tamil, Telugu, and more with AI-powered lessons.
          </p>
          <div style={{ marginTop: 40, display: 'flex', gap: 12 }}>
            {['✨ Free', '🎤 Speech AI', '🌿 6 Languages'].map(t => (
              <span key={t} style={{ padding: '6px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: 600 }}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel (Full width on Mobile) */}
      <div className="auth-form-panel">
        <div className="auth-form-card">
          {/* Mobile Header with App Branding */}
          <div className="auth-mobile-header">
            <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)' }}>
              Lang<span style={{ color: 'var(--purple)' }}>Bridge</span>
            </span>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: '14px 0 6px', letterSpacing: '-0.5px' }}>
              Create Account
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, margin: 0 }}>
              Start your language journey in under 3 minutes.
            </p>
          </div>

          {/* Desktop Header */}
          <div className="auth-desktop-header">
            <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px', letterSpacing: '-0.5px' }}>Create Account</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: '0 0 24px' }}>Start learning in under 3 minutes.</p>
          </div>

          {error && (
            <div style={{
              padding: '12px 16px',
              background: 'var(--coral-bg)',
              border: '1px solid rgba(244,63,94,0.2)',
              borderRadius: 12,
              color: 'var(--coral)',
              fontSize: 14,
              marginBottom: showLoginHint ? 12 : 18,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {showLoginHint && (
            <div style={{
              padding: '14px 16px',
              background: 'rgba(139, 92, 246, 0.1)',
              border: '1.5px solid rgba(139, 92, 246, 0.28)',
              borderRadius: 14,
              marginBottom: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}>
              <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-primary)', fontWeight: 600 }}>
                Is <strong>"{name.trim()}"</strong> already your account?
              </p>
              <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-secondary)' }}>
                You can log in directly, or pick an available variation.
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Link
                  to={`/login?username=${encodeURIComponent(name.trim())}`}
                  style={{
                    padding: '8px 14px',
                    background: 'var(--purple)',
                    color: '#fff',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  Log In as "{name.trim()}" →
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    const rnd = Math.floor(100 + Math.random() * 900);
                    setName(`${name.trim()}_${rnd}`);
                    setError('');
                    setShowLoginHint(false);
                  }}
                  style={{
                    padding: '8px 12px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-secondary)',
                    borderRadius: 8,
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Use "{name.trim()}_{Math.floor(100 + Math.random() * 900)}"
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Username</label>
              <input
                style={inputStyle('name')}
                placeholder="Choose a username"
                value={name}
                onChange={e => {
                  setName(e.target.value);
                  if (showLoginHint) setShowLoginHint(false);
                }}
                required
                onFocus={() => setFocused('name')}
                onBlur={() => setFocused('')}
                autoCapitalize="none"
                autoCorrect="off"
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Password</label>
              <input
                type="password"
                style={inputStyle('pass')}
                placeholder="Create a password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                onFocus={() => setFocused('pass')}
                onBlur={() => setFocused('')}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                minHeight: '48px',
                background: loading ? 'var(--text-muted)' : 'var(--purple)',
                border: 'none',
                borderRadius: 12,
                color: '#fff',
                fontWeight: 700,
                fontSize: 16,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { if (!loading) e.target.style.background = '#6d28d9'; }}
              onMouseLeave={e => { if (!loading) e.target.style.background = 'var(--purple)'; }}
            >
              {loading ? 'Processing...' : 'Sign Up'}
            </button>
          </form>
          <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-secondary)', marginTop: 24 }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--purple)', fontWeight: 600 }}>Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
