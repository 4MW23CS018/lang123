import { Link, useLocation } from 'react-router-dom';
import LanguageSwitcher from './layout/LanguageSwitcher';

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { to: '/lessons', label: 'Lessons', icon: '📚' },
  { to: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
  { to: '/profile', label: 'Profile', icon: '👤' },
];

export default function Layout({ children }) {
  const location = useLocation();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(10,10,20,0.85)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
      }}>
        <div style={{
          maxWidth: '1100px', margin: '0 auto',
          padding: '0 24px', height: '64px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          {/* Logo */}
          <Link to="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #2ecc71, #27ae60)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px', boxShadow: '0 0 16px rgba(46,204,113,0.3)',
            }}>🌐</div>
            <span style={{ fontSize: '18px', fontWeight: '800', color: '#fff', letterSpacing: '-0.5px' }}>
              Lang<span style={{ color: '#2ecc71' }}>Bridge</span>
            </span>
          </Link>

          {/* Nav Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {NAV_LINKS.map(({ to, label, icon }) => {
              const active = location.pathname.startsWith(to) ||
                             (to === '/lessons' && location.pathname.startsWith('/lesson/')) ||
                             (to === '/lessons' && location.pathname.startsWith('/practice/'));

              return (
                <Link key={to} to={to} style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 14px', borderRadius: '10px', textDecoration: 'none',
                  fontSize: '14px', fontWeight: active ? '700' : '500',
                  color: active ? '#2ecc71' : '#9ca3af',
                  background: active ? 'rgba(46,204,113,0.12)' : 'transparent',
                  border: active ? '1px solid rgba(46,204,113,0.2)' : '1px solid transparent',
                  transition: 'all 0.15s',
                }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.background = 'transparent'; } }}
                >
                  <span style={{ fontSize: '15px' }}>{icon}</span>
                  <span>{label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right side: Language Switcher */}
          <LanguageSwitcher />
        </div>
      </nav>

      {/* Page Content */}
      <main style={{ flex: 1 }}>
        {children}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '20px 24px', textAlign: 'center',
        color: '#4b5563', fontSize: '13px',
      }}>
        © {new Date().getFullYear()} LangBridge. All rights reserved.
      </footer>
    </div>
  );
}