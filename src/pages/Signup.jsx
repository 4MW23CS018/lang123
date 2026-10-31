import { useState, useEffect } from 'react';
import { useAction, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Link, useNavigate } from 'react-router-dom';

export default function Signup() {
  const [step, setStep] = useState('register'); // 'register' | 'verify'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [focused, setFocused] = useState('');

  const sendSignupOtp = useAction(api.auth.sendSignupOtp);
  const verifySignupOtp = useMutation(api.auth.verifySignupOtp);
  const resendOtpAction = useAction(api.auth.resendOtp);
  const navigate = useNavigate();

  // Cooldown timer effect
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setLoading(true);

    try {
      await sendSignupOtp({ name, email, password });
      setStep('verify');
      setCooldown(60);
      setInfoMessage(`We've sent a 6-digit verification code to ${email}.`);
    } catch (err) {
      setError(err.message || 'Failed to send verification email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    if (otp.trim().length !== 6) {
      setError('Please enter the complete 6-digit code.');
      return;
    }

    setLoading(true);

    try {
      const userId = await verifySignupOtp({ email, code: otp.trim() });
      localStorage.setItem('userId', userId);
      navigate('/onboarding');
    } catch (err) {
      setError(err.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setError('');
    setInfoMessage('');
    setResending(true);

    try {
      await resendOtpAction({ email, type: 'signup' });
      setCooldown(60);
      setInfoMessage('A new 6-digit code has been sent to your email.');
    } catch (err) {
      setError(err.message || 'Failed to resend code.');
    } finally {
      setResending(false);
    }
  };

  const inputStyle = (field) => ({
    width: '100%',
    padding: '13px 16px',
    boxSizing: 'border-box',
    background: 'var(--bg-input)',
    border: `1.5px solid ${focused === field ? 'var(--purple)' : 'var(--border-default)'}`,
    borderRadius: 12,
    color: 'var(--text-primary)',
    fontSize: 15,
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxShadow: focused === field ? '0 0 0 3px rgba(139,92,246,0.1)' : 'none',
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-base)' }}>
      {/* Left branding panel */}
      <div
        style={{
          flex: '0 0 44%',
          background: 'linear-gradient(160deg, #7c3aed, #4f46e5)',
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
            bottom: '10%',
            left: '-10%',
            width: 350,
            height: 350,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
            pointerEvents: 'none',
          }}
        />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>
            Lang<span style={{ opacity: 0.7 }}>Bridge</span>
          </span>
          <h1
            style={{
              fontSize: 40,
              fontWeight: 800,
              color: '#fff',
              margin: '40px 0 16px',
              letterSpacing: '-1.5px',
              lineHeight: 1.15,
            }}
          >
            Start your
            <br />
            journey today.
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, lineHeight: 1.7, maxWidth: 320 }}>
            Join thousands mastering Kannada, Tamil, Telugu, and more with AI-powered lessons.
          </p>
          <div style={{ marginTop: 40, display: 'flex', gap: 12 }}>
            {['✨ Free', '🎤 Speech AI', '🌿 6 Languages'].map((t) => (
              <span
                key={t}
                style={{
                  padding: '6px 14px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.85)',
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
          {step === 'register' ? (
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
                Create Account
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: '0 0 28px' }}>
                Sign up with your email to start learning.
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

              <form onSubmit={handleRegisterSubmit}>
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
                    Name
                  </label>
                  <input
                    style={inputStyle('name')}
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    onFocus={() => setFocused('name')}
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
                    Email Address
                  </label>
                  <input
                    type="email"
                    style={inputStyle('email')}
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    onFocus={() => setFocused('email')}
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
                    Password
                  </label>
                  <input
                    type="password"
                    style={inputStyle('pass')}
                    placeholder="Create a strong password (min 6 chars)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    onFocus={() => setFocused('pass')}
                    onBlur={() => setFocused('')}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: 14,
                    background: loading ? 'var(--text-muted)' : 'var(--purple)',
                    border: 'none',
                    borderRadius: 12,
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 16,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) e.target.style.background = '#6d28d9';
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) e.target.style.background = 'var(--purple)';
                  }}
                >
                  {loading ? 'Sending verification code...' : 'Sign Up'}
                </button>
              </form>

              <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-secondary)', marginTop: 24 }}>
                Already have an account?{' '}
                <Link to="/login" style={{ color: 'var(--purple)', fontWeight: 600 }}>
                  Log in
                </Link>
              </p>
            </>
          ) : (
            <>
              {/* STEP 2: OTP VERIFICATION */}
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: 'rgba(139,92,246,0.15)',
                    color: 'var(--purple)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 26,
                    margin: '0 auto 16px',
                  }}
                >
                  ✉️
                </div>
                <h2
                  style={{
                    fontSize: 26,
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    margin: '0 0 6px',
                    letterSpacing: '-0.5px',
                  }}
                >
                  Verify Your Email
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
                  Enter the 6-digit code sent to
                  <br />
                  <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>
                </p>
              </div>

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
                    textAlign: 'center',
                  }}
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleVerifySubmit}>
                <div style={{ marginBottom: 24 }}>
                  <input
                    type="text"
                    maxLength={6}
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '16px',
                      boxSizing: 'border-box',
                      background: 'var(--bg-input)',
                      border: `2px solid ${focused === 'otp' ? 'var(--purple)' : 'var(--border-default)'}`,
                      borderRadius: 12,
                      color: 'var(--text-primary)',
                      fontSize: 28,
                      fontWeight: 800,
                      letterSpacing: '8px',
                      textAlign: 'center',
                      outline: 'none',
                      fontFamily: 'monospace',
                    }}
                    placeholder="••••••"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    onFocus={() => setFocused('otp')}
                    onBlur={() => setFocused('')}
                  />
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>
                    Code valid for 10 minutes
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  style={{
                    width: '100%',
                    padding: 14,
                    background: loading || otp.length !== 6 ? 'var(--text-muted)' : 'var(--purple)',
                    border: 'none',
                    borderRadius: 12,
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 16,
                    cursor: loading || otp.length !== 6 ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {loading ? 'Activating account...' : 'Verify & Continue'}
                </button>
              </form>

              <div style={{ marginTop: 20, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={cooldown > 0 || resending}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: cooldown > 0 ? 'var(--text-muted)' : 'var(--purple)',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: cooldown > 0 ? 'default' : 'pointer',
                  }}
                >
                  {resending
                    ? 'Resending code...'
                    : cooldown > 0
                    ? `Resend code in ${cooldown}s`
                    : 'Resend 6-digit code'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('register');
                    setError('');
                    setInfoMessage('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    fontSize: 13,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Edit name or email
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
