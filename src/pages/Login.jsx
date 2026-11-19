import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

export default function Login() {
  const [searchParams] = useSearchParams();
  const prefill = searchParams.get('username') || '';
  const [name, setName] = useState(prefill);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState('');
  const login = useMutation(api.auth.login);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const userId = await login({ name, password });
      localStorage.setItem('userId', userId);
      localStorage.setItem('userName', name);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('No account found') || msg.includes('User not found')) {
        setError('No account found with that username.');
      } else if (msg.includes('Invalid password')) {
        setError('Invalid password. Please try again.');
      } else {
        const cleanMsg = msg
          .replace(/^\[Request ID:.*?\]\s*/i, '')
          .replace(/^Server Error\s*/i, '')
          .replace(/^Uncaught Error:\s*/i, '')
          .trim();
        setError(cleanMsg || 'Login failed. Please try again.');
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
    border: `1.5px solid ${focused === field ? 'var(--accent)' : 'var(--border-default)'}`,
    borderRadius: 12,
    color: 'var(--text-primary)',
    fontSize: 16, // 16px prevents iOS Safari from automatically zooming in
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxShadow: focused === field ? '0 0 0 3px rgba(34,197,94,0.1)' : 'none',
  });

  return (
    <div className="auth-page-container">
      {/* Left branding panel (Desktop Only) */}
      <div className="auth-branding-panel">
        <div style={{ position: 'absolute', top: '20%', right: '-20%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.08), transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>Lang<span style={{ color: 'var(--accent)' }}>Bridge</span></span>
          <h1 style={{ fontSize: 40, fontWeight: 800, color: 'var(--text-primary)', margin: '40px 0 16px', letterSpacing: '-1.5px', lineHeight: 1.15 }}>Welcome<br/>back.</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 16, lineHeight: 1.7, maxWidth: 320 }}>Continue your journey to mastering South Indian languages.</p>
          <div style={{ marginTop: 40, display: 'flex', gap: 12 }}>
            {['🔥 Streaks', '🎯 Lessons', '📊 Progress'].map(t => (
              <span key={t} style={{ padding: '6px 14px', borderRadius: 999, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: 12, fontWeight: 600 }}>{t}</span>
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
              Lang<span style={{ color: 'var(--accent)' }}>Bridge</span>
            </span>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: '14px 0 6px', letterSpacing: '-0.5px' }}>
              Welcome back.
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, margin: 0 }}>
              Enter your credentials to continue learning.
            </p>
          </div>

          {/* Desktop Header */}
          <div className="auth-desktop-header">
            <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px', letterSpacing: '-0.5px' }}>Log In</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: '0 0 28px' }}>Enter your credentials to continue.</p>
          </div>

          {error && (
            <div style={{
              padding: '12px 16px',
              background: 'var(--coral-bg)',
              border: '1px solid rgba(244,63,94,0.2)',
              borderRadius: 12,
              color: 'var(--coral)',
              fontSize: 14,
              marginBottom: 18,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Username</label>
              <input
                style={inputStyle('name')}
                placeholder="Enter your username"
                value={name}
                onChange={e => setName(e.target.value)}
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
                placeholder="Enter your password"
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
                background: loading ? 'var(--text-muted)' : 'var(--accent)',
                border: 'none',
                borderRadius: 12,
                color: '#fff',
                fontWeight: 700,
                fontSize: 16,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { if (!loading) e.target.style.background = 'var(--accent-hover)'; }}
              onMouseLeave={e => { if (!loading) e.target.style.background = 'var(--accent)'; }}
            >
              {loading ? 'Signing in...' : 'Log In'}
            </button>
          </form>
          <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-secondary)', marginTop: 24 }}>
            Don't have an account? <Link to="/signup" style={{ color: 'var(--accent)', fontWeight: 600 }}>Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
