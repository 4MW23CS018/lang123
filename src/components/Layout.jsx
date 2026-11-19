import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LanguageSwitcher from './layout/LanguageSwitcher';
import SideNav from './layout/SideNav';
import { useTheme } from './hooks/useTheme';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { 
  Home, Type, BookOpen, Mic, Sun, Moon, Download, 
  Menu, X, Trophy, ShoppingBag, User as UserIcon, 
  LogOut, ChevronRight, Flame, Zap
} from 'lucide-react';
import shopGemIcon from '../assets/shop-gem.png';

const LEARNING_NAV = [
  { to: '/dashboard', label: 'Home', icon: Home, desc: 'Your daily hub & path' },
  { to: '/basics', label: 'Basics', icon: Type, desc: 'Alphabet & character tracing' },
  { to: '/lessons', label: 'Lessons', icon: BookOpen, desc: 'Grammar & interactive exercises' },
  { to: '/roleplay', label: 'Roleplay', icon: Mic, desc: 'AI voice conversations' },
];

const DISCOVER_NAV = [
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy, desc: 'Compete on XP rankings' },
  { to: '/shop', label: 'Shop', icon: ShoppingBag, desc: 'Cosmetics, chests & themes' },
  { to: '/profile', label: 'Profile', icon: UserIcon, desc: 'Stats, badges & account' },
];

export default function Layout({ children }) {
  const loc = useLocation();
  const navigate = useNavigate();
  const { isDark, toggle } = useTheme();
  const { isInstalled, promptInstall } = usePWAInstall();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const userId = localStorage.getItem('userId');
  const user = useQuery(api.users.get, userId ? { userId } : "skip");

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [loc.pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userId');
    setDrawerOpen(false);
    navigate('/');
  };

  const isLearningActive = (to) => {
    return loc.pathname === to || (to === '/lessons' && (loc.pathname.startsWith('/lesson/') || loc.pathname.startsWith('/practice/')));
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)', transition: 'background 0.3s ease' }}>
      {/* Top Navigation Bar */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: isDark ? 'rgba(15,15,26,0.92)' : 'rgba(250,248,245,0.95)',
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
        transition: 'background 0.3s ease',
      }}>
        <div 
          className="app-top-nav-inner"
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            padding: '0 32px',
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          {/* Logo */}
          <Link to="/dashboard" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
              Lang<span style={{ color: 'var(--accent)' }}>Bridge</span>
            </span>
          </Link>

          {/* DESKTOP ONLY: Learning Links (Home, Basics, Lessons, Roleplay) */}
          <div className="desktop-nav-group" style={{ alignItems: 'center', gap: 16 }}>
            {LEARNING_NAV.map(({ to, label, icon: Icon }) => {
              const active = isLearningActive(to);
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

          {/* DESKTOP ONLY: Top Right Utilities (Gems, Theme Toggle, Install App, Language Switcher) */}
          <div className="desktop-nav-group" style={{ alignItems: 'center', gap: 14 }}>
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

            {/* In-app PWA Install Button for Chromium / Mobile */}
            {!isInstalled && (
              <button
                onClick={promptInstall}
                title="Install LangBridge as a desktop app"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  height: 38,
                  padding: '0 14px',
                  borderRadius: 11,
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.color = 'var(--accent)';
                  e.currentTarget.style.background = 'var(--accent-bg)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border-default)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                  e.currentTarget.style.background = 'var(--bg-elevated)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <Download size={14} style={{ color: 'var(--accent)' }} />
                <span>Install App</span>
              </button>
            )}

            <LanguageSwitcher />
          </div>

          {/* MOBILE ONLY: Minimal Top Bar Controls (Gems + Hamburger Drawer Toggle) */}
          <div className="mobile-nav-group" style={{ alignItems: 'center', gap: 10 }}>
            {user && (
              <Link to="/shop" style={{ textDecoration: 'none' }}>
                <div style={{ 
                  display: 'flex', alignItems: 'center', gap: 5, 
                  padding: '5px 10px 5px 8px', background: 'var(--bg-elevated)', 
                  borderRadius: 10, border: '1px solid rgba(168, 85, 247, 0.35)', 
                  color: '#c084fc', fontWeight: 750, fontSize: 13,
                }}>
                  <img src={shopGemIcon} alt="Gems" style={{ width: 16, height: 16, objectFit: 'contain' }} />
                  <span>{user.gems || 0}</span>
                </div>
              </Link>
            )}

            {/* Hamburger Menu Toggle Button */}
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="Open Navigation Menu"
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* MOBILE DRAWER (Hidden Navigation Sheet) */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setDrawerOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.65)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                zIndex: 9998,
              }}
            />

            {/* Slide-out Drawer Panel */}
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              style={{
                position: 'fixed',
                top: 0,
                right: 0,
                bottom: 0,
                width: 'min(86vw, 360px)',
                background: isDark ? '#10121e' : '#ffffff',
                borderLeft: '1px solid var(--border-default)',
                boxShadow: '-12px 0 36px rgba(0, 0, 0, 0.45)',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {/* Drawer Top Header: Logo + Close Button */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '18px 20px',
                borderBottom: '1px solid var(--border-subtle)',
              }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                  Lang<span style={{ color: 'var(--accent)' }}>Bridge</span>
                </span>
                
                <button
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close menu"
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = 'var(--text-primary)';
                    e.currentTarget.style.background = 'var(--bg-subtle)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.background = 'var(--bg-elevated)';
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Content */}
              <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>
                
                {/* User Snapshot Card (if logged in) */}
                {user && (
                  <div style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 16,
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 42,
                        height: 42,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--accent) 0%, #3b82f6 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: 17,
                        flexShrink: 0,
                      }}>
                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ margin: 0, fontSize: 14.5, fontWeight: 750, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {user.name || 'Language Learner'}
                        </p>
                        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
                          Level {user.level || 1} Explorer
                        </p>
                      </div>
                    </div>

                    {/* Stats pills: Streak, Gems, XP */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, paddingTop: 4, borderTop: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>
                        <Flame size={14} />
                        <span>{user.streak || 0}d</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: '#c084fc' }}>
                        <img src={shopGemIcon} alt="Gems" style={{ width: 14, height: 14, objectFit: 'contain' }} />
                        <span>{user.gems || 0}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>
                        <Zap size={14} />
                        <span>{user.xp || 0} XP</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Section 1: Learning Pages */}
                <div>
                  <p style={{
                    fontSize: 11,
                    fontWeight: 750,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    color: 'var(--text-muted)',
                    margin: '0 0 8px 6px',
                  }}>
                    Learning
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {LEARNING_NAV.map(({ to, label, icon: Icon, desc }) => {
                      const active = isLearningActive(to);
                      return (
                        <Link
                          key={to}
                          to={to}
                          onClick={() => setDrawerOpen(false)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 14px',
                            borderRadius: 12,
                            textDecoration: 'none',
                            background: active ? 'var(--accent-bg)' : 'transparent',
                            border: active ? '1px solid var(--accent-border)' : '1px solid transparent',
                            color: active ? 'var(--accent)' : 'var(--text-primary)',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                              width: 34,
                              height: 34,
                              borderRadius: 10,
                              background: active ? 'var(--accent)' : 'var(--bg-elevated)',
                              color: active ? '#fff' : 'var(--accent)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}>
                              <Icon size={17} />
                            </div>
                            <div>
                              <p style={{ margin: 0, fontSize: 14, fontWeight: active ? 750 : 600 }}>{label}</p>
                              <p style={{ margin: 0, fontSize: 11.5, color: 'var(--text-muted)' }}>{desc}</p>
                            </div>
                          </div>
                          <ChevronRight size={16} style={{ color: active ? 'var(--accent)' : 'var(--text-faint)' }} />
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* Section 2: Discover & Community Pages */}
                <div>
                  <p style={{
                    fontSize: 11,
                    fontWeight: 750,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    color: 'var(--text-muted)',
                    margin: '0 0 8px 6px',
                  }}>
                    Discover
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {DISCOVER_NAV.map(({ to, label, icon: Icon, desc }) => {
                      const active = loc.pathname === to;
                      return (
                        <Link
                          key={to}
                          to={to}
                          onClick={() => setDrawerOpen(false)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 14px',
                            borderRadius: 12,
                            textDecoration: 'none',
                            background: active ? 'var(--accent-bg)' : 'transparent',
                            border: active ? '1px solid var(--accent-border)' : '1px solid transparent',
                            color: active ? 'var(--accent)' : 'var(--text-primary)',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                              width: 34,
                              height: 34,
                              borderRadius: 10,
                              background: active ? 'var(--accent)' : 'var(--bg-elevated)',
                              color: active ? '#fff' : 'var(--text-secondary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}>
                              <Icon size={17} />
                            </div>
                            <div>
                              <p style={{ margin: 0, fontSize: 14, fontWeight: active ? 750 : 600 }}>{label}</p>
                              <p style={{ margin: 0, fontSize: 11.5, color: 'var(--text-muted)' }}>{desc}</p>
                            </div>
                          </div>
                          <ChevronRight size={16} style={{ color: active ? 'var(--accent)' : 'var(--text-faint)' }} />
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* Section 3: Preferences & Actions */}
                <div style={{ paddingTop: 12, borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <p style={{
                    fontSize: 11,
                    fontWeight: 750,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    color: 'var(--text-muted)',
                    margin: '0 0 6px 6px',
                  }}>
                    Preferences
                  </p>

                  {/* Language Selector container */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border-default)' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Language</span>
                    <LanguageSwitcher />
                  </div>

                  {/* Theme Toggle row */}
                  <button
                    onClick={toggle}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: 12,
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 600,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {isDark ? <Sun size={16} style={{ color: '#f59e0b' }} /> : <Moon size={16} style={{ color: 'var(--accent)' }} />}
                      <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Toggle</span>
                  </button>

                  {/* PWA Install Button */}
                  {!isInstalled && (
                    <button
                      onClick={() => {
                        promptInstall();
                        setDrawerOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        padding: '11px 14px',
                        borderRadius: 12,
                        background: 'var(--accent)',
                        border: 'none',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: 13.5,
                        cursor: 'pointer',
                        marginTop: 4,
                        boxShadow: '0 2px 10px rgba(34, 197, 94, 0.25)',
                      }}
                    >
                      <Download size={16} />
                      <span>Install LangBridge App</span>
                    </button>
                  )}

                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      padding: '10px 14px',
                      borderRadius: 12,
                      background: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      color: '#ef4444',
                      fontWeight: 650,
                      fontSize: 13,
                      cursor: 'pointer',
                      marginTop: 2,
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'}
                  >
                    <LogOut size={15} />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* DESKTOP ONLY: Side Navigation Rail (Shop, Leaderboard, Profile) */}
      <SideNav user={user} />

      {/* Main Page Content */}
      <main className="app-main-content" style={{ flex: 1 }}>{children}</main>

      <footer className="app-main-content" style={{ borderTop: '1px solid var(--border-subtle)', padding: '24px 32px', textAlign: 'center' }}>
        <span style={{ color: 'var(--text-faint)', fontSize: 13 }}>© {new Date().getFullYear()} LangBridge</span>
      </footer>
    </div>
  );
}
