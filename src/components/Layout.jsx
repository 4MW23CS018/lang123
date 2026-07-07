import { Link, useLocation } from 'react-router-dom';
import LanguageSwitcher from './layout/LanguageSwitcher';
import { useTheme } from './hooks/useTheme';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { to: '/lessons', label: 'Lessons', icon: '📚' },
  { to: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
  { to: '/profile', label: 'Profile', icon: '👤' },
];

export default function Layout({ children }) {
  const loc = useLocation();
  const { isDark, toggle } = useTheme();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)', transition: 'background 0.3s ease' }}>
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: isDark ? 'rgba(15,15,26,0.9)' : 'rgba(250,248,245,0.92)',
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
        transition: 'background 0.3s ease',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/dashboard" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: 19, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
              Lang<span style={{ color: 'var(--accent)' }}>Bridge</span>
            </span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {NAV.map(({ to, label, icon }) => {
              const active = loc.pathname.startsWith(to) || (to === '/lessons' && (loc.pathname.startsWith('/lesson/') || loc.pathname.startsWith('/practice/')));
              return (
                <Link key={to} to={to} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 10, textDecoration: 'none',
                  fontSize: 14, fontWeight: active ? 700 : 500,
                  color: active ? 'var(--accent)' : 'var(--text-secondary)',
                  background: active ? 'var(--accent-bg)' : 'transparent',
                  transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
                }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-elevated)'; } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; } }}>
                  <span style={{ fontSize: 15 }}>{icon}</span><span>{label}</span>
                </Link>
              );
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Theme toggle */}
            <button onClick={toggle} title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-elevated)'}>
              {isDark ? '☀️' : '🌙'}
            </button>
            <LanguageSwitcher />
          </div>
        </div>
      </nav>

      <main style={{ flex: 1 }}>{children}</main>

      <footer style={{ borderTop: '1px solid var(--border-subtle)', padding: '20px 24px', textAlign: 'center' }}>
        <span style={{ color: 'var(--text-faint)', fontSize: 13 }}>© {new Date().getFullYear()} LangBridge</span>
      </footer>
    </div>
  );
}