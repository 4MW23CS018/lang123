import { Link, useLocation } from 'react-router-dom';
import LanguageSwitcher from './layout/LanguageSwitcher';
import SideNav from './layout/SideNav';
import { useTheme } from './hooks/useTheme';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Home, Type, BookOpen, Mic, Sun, Moon } from 'lucide-react';
import shopGemIcon from '../assets/shop-gem.png';

const LEARNING_NAV = [
  { to: '/dashboard', label: 'Home', icon: Home },
  { to: '/basics', label: 'Basics', icon: Type },
  { to: '/lessons', label: 'Lessons', icon: BookOpen },
  { to: '/roleplay', label: 'Roleplay', icon: Mic },
];

export default function Layout({ children }) {
  const loc = useLocation();
  const { isDark, toggle } = useTheme();
  const userId = localStorage.getItem('userId');
  const user = useQuery(api.users.get, userId ? { userId } : "skip");

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)', transition: 'background 0.3s ease' }}>
      {/* Top Navigation Bar: ONLY learning-related links + utilities with generous spacing */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: isDark ? 'rgba(15,15,26,0.92)' : 'rgba(250,248,245,0.95)',
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
        transition: 'background 0.3s ease',
      }}>
        <div style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '0 32px',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Logo */}
          <Link to="/dashboard" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
              Lang<span style={{ color: 'var(--accent)' }}>Bridge</span>
            </span>
          </Link>

          {/* Learning Links: Home, Basics, Lessons, Roleplay with generous spacing */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {LEARNING_NAV.map(({ to, label, icon: Icon }) => {
              const active = loc.pathname === to || (to === '/lessons' && (loc.pathname.startsWith('/lesson/') || loc.pathname.startsWith('/practice/')));
              return (
                <Link
                  key={to}
                  to={to}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 18px',
                    borderRadius: 12,
                    textDecoration: 'none',
                    fontSize: 14.5,
                    fontWeight: active ? 750 : 550,
                    color: active ? 'var(--accent)' : 'var(--text-secondary)',
                    background: active ? 'var(--accent-bg)' : 'transparent',
                    transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      e.currentTarget.style.color = 'var(--text-primary)';
                      e.currentTarget.style.background = 'var(--bg-elevated)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      e.currentTarget.style.color = 'var(--text-secondary)';
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <Icon size={17} />
                  <span>{label}</span>
                </Link>
              );
            })}
          </div>

          {/* Top Right Utilities: Gems, Theme Toggle, Language Switcher with decent spacing */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {user && (
              <Link to="/shop" style={{ textDecoration: 'none' }}>
                <div style={{ 
                  display: 'flex', alignItems: 'center', gap: 7, 
                  padding: '5px 12px 5px 9px', background: 'var(--bg-elevated)', 
                  borderRadius: 12, border: '1px solid rgba(168, 85, 247, 0.35)', 
                  color: '#c084fc', fontWeight: 750, fontSize: 14,
                  cursor: 'pointer', transition: 'all 0.2s',
                  boxShadow: '0 2px 8px rgba(168, 85, 247, 0.12)'
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(168, 85, 247, 0.15)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                >
                  <img src={shopGemIcon} alt="Gems" style={{ width: 19, height: 19, objectFit: 'contain' }} />
                  <span>{user.gems || 0}</span>
                </div>
              </Link>
            )}

            {/* Theme toggle */}
            <button
              onClick={toggle}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              style={{
                width: 38,
                height: 38,
                borderRadius: 11,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                color: 'var(--text-primary)'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <LanguageSwitcher />
          </div>
        </div>
      </nav>

      {/* Discord-style Vertical Side Navigation Rail (Shop with Treasure Chest, Leaderboard, Profile Avatar icon) */}
      <SideNav user={user} />

      {/* Main Page Content (offset by side nav on desktop) */}
      <main className="app-main-content" style={{ flex: 1 }}>{children}</main>

      <footer className="app-main-content" style={{ borderTop: '1px solid var(--border-subtle)', padding: '24px 32px', textAlign: 'center' }}>
        <span style={{ color: 'var(--text-faint)', fontSize: 13 }}>© {new Date().getFullYear()} LangBridge</span>
      </footer>
    </div>
  );
}
