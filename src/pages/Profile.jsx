import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Zap, Sprout, Rocket, Sparkles, Flame, Gem, Star, LogOut } from "lucide-react";

function getLevel(xp) { return Math.floor(Math.sqrt(xp / 100)) + 1; }
function xpForLevel(lvl) { return Math.pow(lvl - 1, 2) * 100; }
function xpProgress(xp) {
  const lvl = getLevel(xp); const curr = xpForLevel(lvl); const next = xpForLevel(lvl + 1);
  return { lvl, curr, next, pct: Math.round(((xp - curr) / (next - curr)) * 100) };
}

function getAchievements(user) {
  const xp = user?.totalXp || user?.xp || 0, streak = user?.streak || 0;
  return [
    { id: 'first_xp',  icon: Zap,      label: 'First Spark',   desc: 'Earned your first XP', unlocked: xp >= 1, color: 'var(--accent)' },
    { id: 'xp_100',    icon: Sprout,   label: 'Seedling',      desc: 'Reached 100 XP',       unlocked: xp >= 100, color: '#22c55e' },
    { id: 'xp_500',    icon: Rocket,   label: 'Accelerating',  desc: 'Reached 500 XP',       unlocked: xp >= 500, color: '#0ea5e9' },
    { id: 'xp_1000',   icon: Sparkles, label: 'Scholar',       desc: 'Reached 1,000 XP',     unlocked: xp >= 1000, color: '#8b5cf6' },
    { id: 'streak_3',  icon: Flame,    label: 'On Fire',       desc: '3-day streak',          unlocked: streak >= 3, color: '#f59e0b' },
    { id: 'streak_7',  icon: Gem,      label: 'Diamond Habit', desc: '7-day streak',          unlocked: streak >= 7, color: '#3b82f6' },
    { id: 'streak_30', icon: Star,     label: 'Legendary',     desc: '30-day streak',         unlocked: streak >= 30, color: '#ec4899' },
  ];
}

function mockActivity(user) {
  const streak = user?.streak || 0;
  return Array.from({ length: 14 }, (_, i) => { const d = 13 - i; return d < streak ? Math.floor(Math.random() * 3) + 1 : Math.random() > 0.65 ? 1 : 0; });
}
function heatColor(v) {
  if (v === 0) return 'var(--bg-elevated)';
  if (v === 1) return 'var(--accent)' + '40';
  if (v === 2) return 'var(--accent)' + '80';
  return 'var(--accent)';
}

function StatCard({ icon: Icon, label, value, sub, color, delay }) {
  return (
    <div className="glass-card" style={{
      border: `1px solid ${color}40`,
      borderRadius: 14, padding: '16px 14px',
      opacity: 0, animation: `fadeUp 0.4s var(--ease-out) ${delay} forwards`,
      transition: 'transform 0.2s', cursor: 'default',
    }}
      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color }}>
        <Icon size={16} />
        <span style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{label}</span>
      </div>
      <p style={{ color, fontSize: 26, fontWeight: 800, margin: '0 0 1px', letterSpacing: '-1px', lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ color: 'var(--text-faint)', fontSize: 11, margin: 0 }}>{sub}</p>}
    </div>
  );
}

export default function Profile() {
  const userId = localStorage.getItem("userId");
  const user = useQuery(api.users.get, userId ? { userId } : "skip");
  const navigate = useNavigate();
  const [xpVis, setXpVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setXpVis(true), 700); return () => clearTimeout(t); }, []);

  const handleLogout = () => { localStorage.removeItem("userId"); navigate("/"); };

  if (!user) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 34, height: 34, borderRadius: '50%', border: '2.5px solid var(--border-subtle)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading profile…</p>
      </div>
    </div>
  );

  const xp = user.totalXp || user.xp || 0;
  const { lvl, curr, next, pct } = xpProgress(xp);
  const achievements = getAchievements(user);
  const activity = mockActivity(user);

  return (
    <div style={{ padding: '32px 24px', maxWidth: 500, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24, opacity: 0, animation: 'fadeDown 0.4s var(--ease-out) 60ms forwards' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px' }}>Account</span>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0 0', letterSpacing: '-0.7px' }}>Profile</h1>
      </div>

      {/* Main card */}
      <div className="glass-panel" style={{
        padding: '26px 22px',
        opacity: 0, animation: 'fadeUp 0.5s var(--ease-out) 120ms forwards',
      }}>
        {/* Avatar + Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid var(--border-subtle)' }}>
          <div className={user.equippedBorder ? user.equippedBorder.replace(/_/g, '-') : ''} style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'var(--accent-bg)', border: user.equippedBorder ? 'none' : '2px solid var(--accent-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 800, color: 'var(--accent)', flexShrink: 0,
            position: 'relative', zIndex: 1,
          }}>{user.name?.[0]?.toUpperCase()}</div>
          <div>
            <p style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: 17, margin: '0 0 2px', letterSpacing: '-0.3px' }}>{user.name}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: 0 }}>Level {lvl} Learner</p>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          <StatCard icon={Zap} label="Total XP" value={xp.toLocaleString()} color="var(--accent)" delay="200ms" />
          <StatCard icon={Flame} label="Streak" value={user.streak || 0} sub="days in a row" color="#f59e0b" delay="260ms" />
        </div>

        {/* Level progress */}
        <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Level Progress</span>
            <span style={{ color: 'var(--accent)', fontSize: 11, fontWeight: 700 }}>Lvl {lvl} → {lvl + 1}</span>
          </div>
          <div style={{ height: 7, borderRadius: 99, background: 'var(--bg-elevated)', overflow: 'hidden', marginBottom: 5 }}>
            <div style={{ height: '100%', width: `${xpVis ? pct : 0}%`, background: 'var(--accent)', borderRadius: 99, transition: 'width 1s var(--ease-out)' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-faint)', fontSize: 10 }}>{(xp - curr).toLocaleString()} XP</span>
            <span style={{ color: 'var(--text-faint)', fontSize: 10 }}>{(next - curr).toLocaleString()} XP needed</span>
          </div>
        </div>

        {/* Achievements */}
        <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid var(--border-subtle)' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: 10 }}>Achievements</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {achievements.map((a, i) => {
              const AchIcon = a.icon;
              return (
                <div key={a.id} title={a.unlocked ? `${a.label}: ${a.desc}` : `Locked: ${a.desc}`}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    padding: '10px 4px', borderRadius: 12,
                    background: a.unlocked ? 'var(--accent-bg)' : 'var(--bg-elevated)',
                    border: a.unlocked ? '1px solid var(--accent-border)' : '1px solid var(--border-subtle)',
                    filter: a.unlocked ? 'none' : 'grayscale(1) opacity(0.35)',
                    opacity: 0, animation: `badgePop 0.35s var(--ease-out) ${400 + i * 50}ms forwards`,
                    cursor: 'default', transition: 'transform 0.2s',
                  }}
                  onMouseEnter={e => { if (a.unlocked) e.currentTarget.style.transform = 'scale(1.06)'; }}
                  onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                  <div style={{ color: a.color }}>
                    <AchIcon size={18} />
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 700, color: a.unlocked ? 'var(--accent)' : 'var(--text-faint)', textAlign: 'center', lineHeight: 1.2 }}>{a.label}</span>
                </div>
              );
            })}
          </div>
          <p style={{ color: 'var(--text-faint)', fontSize: 11, margin: '8px 0 0', textAlign: 'right' }}>{achievements.filter(a => a.unlocked).length}/{achievements.length} unlocked</p>
        </div>

        {/* Activity heatmap */}
        <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid var(--border-subtle)' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: 10 }}>Activity — Last 14 Days</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {activity.map((v, i) => (
              <div key={i} style={{ flex: 1, height: 24, borderRadius: 5, background: heatColor(v), transition: 'transform 0.15s', cursor: 'default' }}
                title={v === 0 ? 'No activity' : `${v} session${v > 1 ? 's' : ''}`}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'none'} />
            ))}
          </div>
        </div>

        {/* Logout */}
        <button onClick={handleLogout} style={{
          width: '100%', padding: 12,
          background: 'var(--coral-bg)', border: '1px solid rgba(244,63,94,0.2)',
          borderRadius: 12, color: 'var(--coral)', fontWeight: 700, fontSize: 14,
          cursor: 'pointer', transition: 'all 0.2s var(--ease-out)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.15)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--coral-bg)'; }}>
          <LogOut size={16} /> Log out
        </button>
      </div>
    </div>
  );
}