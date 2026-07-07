import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Link, useNavigate } from 'react-router-dom';

export default function Signup() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState('');
  const signup = useMutation(api.auth.signup);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { const userId = await signup({ name, password }); localStorage.setItem('userId', userId); navigate('/onboarding'); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const inputStyle = (field) => ({
    width: '100%', padding: '13px 16px', boxSizing: 'border-box',
    background: 'var(--bg-input)', border: `1.5px solid ${focused === field ? 'var(--purple)' : 'var(--border-default)'}`,
    borderRadius: 12, color: 'var(--text-primary)', fontSize: 15, outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxShadow: focused === field ? '0 0 0 3px rgba(139,92,246,0.1)' : 'none',
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-base)' }}>
      {/* Left branding panel */}
      <div style={{ flex: '0 0 44%', background: 'linear-gradient(160deg, #7c3aed, #4f46e5)', padding: '60px 48px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', bottom: '10%', left: '-10%', width: 350, height: 350, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>Lang<span style={{ opacity: 0.7 }}>Bridge</span></span>
          <h1 style={{ fontSize: 40, fontWeight: 800, color: '#fff', margin: '40px 0 16px', letterSpacing: '-1.5px', lineHeight: 1.15 }}>Start your<br/>journey today.</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, lineHeight: 1.7, maxWidth: 320 }}>Join thousands mastering Kannada, Tamil, Telugu, and more with AI-powered lessons.</p>
          <div style={{ marginTop: 40, display: 'flex', gap: 12 }}>
            {['✨ Free', '🎤 Speech AI', '🌿 6 Languages'].map(t => (
              <span key={t} style={{ padding: '6px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: 600 }}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div style={{ width: '100%', maxWidth: 400, animation: 'fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both' }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px', letterSpacing: '-0.5px' }}>Create Account</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: '0 0 28px' }}>Start learning in under 3 minutes.</p>

          {error && <div style={{ padding: '12px 16px', background: 'var(--coral-bg)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: 12, color: 'var(--coral)', fontSize: 14, marginBottom: 18 }}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Username</label>
              <input style={inputStyle('name')} placeholder="Choose a username" value={name} onChange={e => setName(e.target.value)} required
                onFocus={() => setFocused('name')} onBlur={() => setFocused('')} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Password</label>
              <input type="password" style={inputStyle('pass')} placeholder="Create a strong password" value={password} onChange={e => setPassword(e.target.value)} required
                onFocus={() => setFocused('pass')} onBlur={() => setFocused('')} />
            </div>
            <button type="submit" disabled={loading} style={{
              width: '100%', padding: 14, background: loading ? 'var(--text-muted)' : 'var(--purple)',
              border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: 16,
              cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
            }}
              onMouseEnter={e => { if (!loading) e.target.style.background = '#6d28d9'; }}
              onMouseLeave={e => { if (!loading) e.target.style.background = 'var(--purple)'; }}>
              {loading ? 'Creating account...' : 'Sign Up'}
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