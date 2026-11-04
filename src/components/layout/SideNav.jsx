import { Link, useLocation } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { useState } from 'react';

// Treasure Chest Icon (RPG / Game style)
function TreasureChestIcon({ size = 22, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Arched chest lid */}
      <path d="M3 10C3 6.686 5.686 4 9 4H15C18.314 4 21 6.686 21 10V11H3V10Z" />
      {/* Chest base */}
      <rect x="3" y="11" width="18" height="9" rx="1.5" />
      {/* Center lock clasp */}
      <rect x="10" y="9.5" width="4" height="4" rx="1" fill="currentColor" stroke="none" />
      {/* Iron reinforcement straps */}
      <line x1="7.5" y1="4.5" x2="7.5" y2="20" strokeWidth="1.6" opacity="0.85" />
      <line x1="16.5" y1="4.5" x2="16.5" y2="20" strokeWidth="1.6" opacity="0.85" />
    </svg>
  );
}

export default function SideNav({ user }) {
  const loc = useLocation();
  const [hoveredItem, setHoveredItem] = useState(null);

  const isShopActive = loc.pathname === '/shop';
  const isLeaderboardActive = loc.pathname === '/leaderboard';
  const isProfileActive = loc.pathname === '/profile';

  const equippedBorderClass = user?.equippedBorder ? user.equippedBorder.replace(/_/g, '-') : 'border-default';

  return (
    <aside className="discord-nav-rail" aria-label="Side Navigation">
      {/* Pinned strictly to the bottom of the vertical sidebar */}
      <div className="discord-rail-content-bottom">
        
        {/* Shop (Treasure Chest Icon restored) */}
        <Link
          to="/shop"
          className="discord-nav-item"
          onMouseEnter={() => setHoveredItem('/shop')}
          onMouseLeave={() => setHoveredItem(null)}
          aria-label="Shop"
        >
          <div
            className="discord-pill-indicator"
            style={{
              height: isShopActive ? 40 : hoveredItem === '/shop' ? 20 : 0,
              opacity: isShopActive || hoveredItem === '/shop' ? 1 : 0,
            }}
          />
          <div className={`discord-icon-btn ${isShopActive ? 'active' : ''}`} title="Shop">
            <TreasureChestIcon size={22} />
          </div>
          <div className="discord-tooltip">Shop</div>
        </Link>

        {/* Leaderboard */}
        <Link
          to="/leaderboard"
          className="discord-nav-item"
          onMouseEnter={() => setHoveredItem('/leaderboard')}
          onMouseLeave={() => setHoveredItem(null)}
          aria-label="Leaderboard"
        >
          <div
            className="discord-pill-indicator"
            style={{
              height: isLeaderboardActive ? 40 : hoveredItem === '/leaderboard' ? 20 : 0,
              opacity: isLeaderboardActive || hoveredItem === '/leaderboard' ? 1 : 0,
            }}
          />
          <div className={`discord-icon-btn ${isLeaderboardActive ? 'active' : ''}`} title="Leaderboard">
            <Trophy size={21} />
          </div>
          <div className="discord-tooltip">Leaderboard</div>
        </Link>

        {/* Subtle Horizontal Divider */}
        <div style={{
          width: 32,
          height: 2,
          background: 'var(--border-subtle)',
          borderRadius: 99,
          margin: '6px 0 12px',
          flexShrink: 0,
        }} />

        {/* Profile: Avatar Icon ONLY (NO text saying profile) */}
        <Link
          to="/profile"
          className="discord-nav-item"
          onMouseEnter={() => setHoveredItem('/profile')}
          onMouseLeave={() => setHoveredItem(null)}
          aria-label="Profile"
        >
          <div
            className="discord-pill-indicator"
            style={{
              height: isProfileActive ? 40 : hoveredItem === '/profile' ? 20 : 0,
              opacity: isProfileActive || hoveredItem === '/profile' ? 1 : 0,
            }}
          />

          <div
            className={`discord-icon-btn ${isProfileActive ? 'active' : ''}`}
            style={{
              padding: 2,
              border: isProfileActive ? '2px solid var(--accent)' : '1px solid var(--border-subtle)',
              position: 'relative',
            }}
          >
            <div
              className={equippedBorderClass}
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                overflow: 'hidden',
                background: 'var(--bg-card)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name || "Profile"}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--accent)' }}>
                  {user?.name?.[0]?.toUpperCase() || "P"}
                </span>
              )}
            </div>
          </div>

          <div className="discord-tooltip">
            {user?.name || "Profile"}
          </div>
        </Link>

      </div>
    </aside>
  );
}
