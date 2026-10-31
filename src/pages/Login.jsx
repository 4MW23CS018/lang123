import { useState, useEffect } from 'react';
import { useMutation, useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Link, useNavigate } from 'react-router-dom';

export default function Login() {
  const [view, setView] = useState('login'); // 'login' | 'forgot_email' | 'forgot_otp'
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [focused, setFocused] = useState('');

  const login = useMutation(api.auth.login);
  const sendPasswordResetOtp = useAction(api.auth.sendPasswordResetOtp);
  const resetPasswordWithOtp = useMutation(api.auth.resetPasswordWithOtp);
  const resendOtpAction = useAction(api.auth.resendOtp);
  const navigate = useNavigate();

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setLoading(true);

    try {
      const userId = await login({ emailOrUsername, password });
      localStorage.setItem('userId', userId);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('UNVERIFIED_EMAIL')) {
        setError('Please verify your email before logging in. Check your inbox for the OTP.');
      } else if (msg.includes('No account found')) {
        setError('No account found with that email or username.');
      } else if (msg.includes('Invalid password')) {
        setError('Invalid password. Please try again.');
      } else {
        setError(msg || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetCode = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setLoading(true);

    try {
      await sendPasswordResetOtp({ email: resetEmail });
      setView('forgot_otp');
      setCooldown(60);
      setInfoMessage(`A 6-digit reset code has been sent to ${resetEmail}.`);
    } catch (err) {
      setError(err.message || 'Failed to send reset code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    if (resetOtp.trim().length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const userId = await resetPasswordWithOtp({
        email: resetEmail,
        code: resetOtp.trim(),
        newPassword,
      });
      localStorage.setItem('userId', userId);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Password reset failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendResetCode = async () => {
    if (cooldown > 0) return;
    setError('');
    setInfoMessage('');

    try {
      await resendOtpAction({ email: resetEmail, type: 'reset_password' });
      setCooldown(60);
      setInfoMessage('A new reset code was sent to your email.');
    } catch (err) {
      setError(err.message || 'Failed to resend reset code.');
    }
  };

  const inputStyle = (field) => ({
    width: '100%',
    padding: '13px 16px',
    boxSizing: 'border-box',
    background: 'var(--bg-input)',
    border: `1.5px solid ${focused === field ? 'var(--accent)' : 'var(--border-default)'}`,
    borderRadius: 12,
    color: 'var(--text-primary)',
    fontSize: 15,
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxShadow: focused === field ? '0 0 0 3px rgba(34,197,94,0.1)' : 'none',
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-base)' }}>
      {/* Left branding panel */}
      <div
        style={{
          flex: '0 0 44%',
          background: 'var(--bg-card)',
          borderRight: '1px solid var(--border-subtle)',
          padding: '60px 48px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '20%',
            right: '-20%',
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(34,197,94,0.08), transparent 60%)',
            pointerEvents: 'none',
          }}
        />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>
            Lang<span style={{ color: 'var(--accent)' }}>Bridge</span>
          </span>
          <h1
            style={{
              fontSize: 40,
              fontWeight: 800,
              color: 'var(--text-primary)',
              margin: '40px 0 16px',
              letterSpacing: '-1.5px',
              lineHeight: 1.15,
            }}
          >
            Welcome
            <br />
            back.
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 16, lineHeight: 1.7, maxWidth: 320 }}>
            Continue your journey to mastering South Indian languages.
          </p>
          <div style={{ marginTop: 40, display: 'flex', gap: 12 }}>
            {['🔥 Streaks', '🎯 Lessons', '📊 Progress'].map((t) => (
              <span
                key={t}
                style={{
                  padding: '6px 14px',
                  borderRadius: 999,
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div style={{ width: '100%', maxWidth: 420, animation: 'fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both' }}>
          {view === 'login' && (
            <>
              <h2
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  margin: '0 0 6px',
                  letterSpacing: '-0.5px',
                }}
              >
                Log In
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: '0 0 28px' }}>
                Enter your credentials to continue.
              </p>

              {infoMessage && (
                <div
                  style={{
                    padding: '12px 16px',
                    background: 'rgba(34,197,94,0.12)',
                    border: '1px solid rgba(34,197,94,0.25)',
                    borderRadius: 12,
                    color: 'var(--accent)',
                    fontSize: 14,
                    marginBottom: 18,
                  }}
                >
                  {infoMessage}
                </div>
              )}

              {error && (
                <div
                  style={{
                    padding: '12px 16px',
                    background: 'var(--coral-bg)',
                    border: '1px solid rgba(244,63,94,0.2)',
                    borderRadius: 12,
                    color: 'var(--coral)',
                    fontSize: 14,
                    marginBottom: 18,
                  }}
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleLoginSubmit}>
                <div style={{ marginBottom: 16 }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      marginBottom: 6,
                    }}
                  >
                    Email or Username
                  </label>
                  <input
                    style={inputStyle('user')}
                    placeholder="Enter email or username"
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    required
                    onFocus={() => setFocused('user')}
                    onBlur={() => setFocused('')}
                  />
                </div>

                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setView('forgot_email');
                        setError('');
                        setInfoMessage('');
                        setResetEmail(emailOrUsername.includes('@') ? emailOrUsername : '');
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent)',
                        fontSize: 13,
                        cursor: 'pointer',
                        padding: 0,
                        fontWeight: 600,
                      }}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <input
                    type="password"
                    style={inputStyle('pass')}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    onFocus={() => setFocused('pass')}
                    onBlur={() => setFocused('')}
                  />
                </div>

                <div style={{ marginTop: 24 }}>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: 14,
                      background: loading ? 'var(--text-muted)' : 'var(--accent)',
                      border: 'none',
                      borderRadius: 12,
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: 16,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) e.target.style.background = 'var(--accent-hover)';
                    }}
                    onMouseLeave={(e) => {
                      if (!loading) e.target.style.background = 'var(--accent)';
                    }}
                  >
                    {loading ? 'Signing in...' : 'Log In'}
                  </button>
                </div>
              </form>

              <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-secondary)', marginTop: 24 }}>
                Don't have an account?{' '}
                <Link to="/signup" style={{ color: 'var(--accent)', fontWeight: 600 }}>
                  Sign up
                </Link>
              </p>
            </>
          )}

          {view === 'forgot_email' && (
            <>
              <h2
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  margin: '0 0 6px',
                  letterSpacing: '-0.5px',
                }}
              >
                Reset Password
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: '0 0 24px' }}>
                Enter your registered email and we'll send you a 6-digit reset code.
              </p>

              {error && (
                <div
                  style={{
                    padding: '12px 16px',
                    background: 'var(--coral-bg)',
                    border: '1px solid rgba(244,63,94,0.2)',
                    borderRadius: 12,
                    color: 'var(--coral)',
                    fontSize: 14,
                    marginBottom: 18,
                  }}
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSendResetCode}>
                <div style={{ marginBottom: 24 }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      marginBottom: 6,
                    }}
                  >
                    Account Email
                  </label>
                  <input
                    type="email"
                    style={inputStyle('resetEmail')}
                    placeholder="name@example.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    onFocus={() => setFocused('resetEmail')}
                    onBlur={() => setFocused('')}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: 14,
                    background: loading ? 'var(--text-muted)' : 'var(--accent)',
                    border: 'none',
                    borderRadius: 12,
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 16,
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading ? 'Sending code...' : 'Send Reset Code'}
                </button>
              </form>

              <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-secondary)', marginTop: 24 }}>
                <button
                  type="button"
                  onClick={() => {
                    setView('login');
                    setError('');
                    setInfoMessage('');
                  }}
                  style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontWeight: 600 }}
                >
                  ← Back to Log In
                </button>
              </p>
            </>
          )}

          {view === 'forgot_otp' && (
            <>
              <h2
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  margin: '0 0 6px',
                  letterSpacing: '-0.5px',
                }}
              >
                Set New Password
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: '0 0 24px' }}>
                Enter the 6-digit code sent to <strong style={{ color: 'var(--text-primary)' }}>{resetEmail}</strong>
              </p>

              {infoMessage && (
                <div
                  style={{
                    padding: '12px 16px',
                    background: 'rgba(34,197,94,0.12)',
                    border: '1px solid rgba(34,197,94,0.25)',
                    borderRadius: 12,
                    color: 'var(--accent)',
                    fontSize: 14,
                    marginBottom: 18,
                    textAlign: 'center',
                  }}
                >
                  {infoMessage}
                </div>
              )}

              {error && (
                <div
                  style={{
                    padding: '12px 16px',
                    background: 'var(--coral-bg)',
                    border: '1px solid rgba(244,63,94,0.2)',
                    borderRadius: 12,
                    color: 'var(--coral)',
                    fontSize: 14,
                    marginBottom: 18,
                  }}
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleResetPassword}>
                <div style={{ marginBottom: 20 }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      marginBottom: 6,
                    }}
                  >
                    6-Digit Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '14px',
                      boxSizing: 'border-box',
                      background: 'var(--bg-input)',
                      border: `1.5px solid ${focused === 'resetOtp' ? 'var(--accent)' : 'var(--border-default)'}`,
                      borderRadius: 12,
                      color: 'var(--text-primary)',
                      fontSize: 24,
                      fontWeight: 800,
                      letterSpacing: '6px',
                      textAlign: 'center',
                      fontFamily: 'monospace',
                      outline: 'none',
                    }}
                    placeholder="••••••"
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    onFocus={() => setFocused('resetOtp')}
                    onBlur={() => setFocused('')}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      marginBottom: 6,
                    }}
                  >
                    New Password
                  </label>
                  <input
                    type="password"
                    style={inputStyle('newPass')}
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    onFocus={() => setFocused('newPass')}
                    onBlur={() => setFocused('')}
                  />
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      marginBottom: 6,
                    }}
                  >
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    style={inputStyle('confirmPass')}
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    onFocus={() => setFocused('confirmPass')}
                    onBlur={() => setFocused('')}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || resetOtp.length !== 6}
                  style={{
                    width: '100%',
                    padding: 14,
                    background: loading || resetOtp.length !== 6 ? 'var(--text-muted)' : 'var(--accent)',
                    border: 'none',
                    borderRadius: 12,
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 16,
                    cursor: loading || resetOtp.length !== 6 ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading ? 'Updating password...' : 'Save New Password & Log In'}
                </button>
              </form>

              <div style={{ marginTop: 20, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  type="button"
                  onClick={handleResendResetCode}
                  disabled={cooldown > 0}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: cooldown > 0 ? 'var(--text-muted)' : 'var(--accent)',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: cooldown > 0 ? 'default' : 'pointer',
                  }}
                >
                  {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setView('login');
                    setError('');
                    setInfoMessage('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  ← Back to Log In
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
