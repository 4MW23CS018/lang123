import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

function StatCard({ icon, label, value, sub, color, delay }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
        borderRadius: 16, padding: '20px 18px',
        transition: 'all 0.25s var(--ease-out)',
        transform: hov ? 'translateY(-3px)' : 'none',
        boxShadow: hov ? 'var(--card-shadow-hover)' : 'var(--card-shadow)',
        opacity: 0, animation: `fadeUp 0.4s var(--ease-out) ${delay} forwards`,
      }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{icon}</div>
        <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{label}</span>
      </div>
      <p style={{ color: 'var(--text-primary)', fontSize: 28, fontWeight: 800, margin: '0 0 2px', letterSpacing: '-1px', lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: 0 }}>{sub}</p>}
    </div>
  );
}

function QuickAction({ to, icon, title, desc, color }) {
  const [hov, setHov] = useState(false);
  return (
    <Link to={to} style={{ textDecoration: 'none' }}>
      <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{
          display: 'flex', alignItems: 'center', gap: 14,
          background: 'var(--bg-card)', border: `1px solid ${hov ? color + '30' : 'var(--border-subtle)'}`,
          borderRadius: 14, padding: '16px 18px',
          transition: 'all 0.2s var(--ease-out)',
          transform: hov ? 'translateX(4px)' : 'none',
          boxShadow: hov ? 'var(--card-shadow-hover)' : 'var(--card-shadow)',
          cursor: 'pointer',
        }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{icon}</div>
        <div style={{ flex: 1 }}>
          <p style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 700, margin: '0 0 2px' }}>{title}</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: 0 }}>{desc}</p>
        </div>
        <span style={{ color: hov ? color : 'var(--text-faint)', fontSize: 16, transition: 'all 0.15s', transform: hov ? 'translateX(2px)' : 'none', display: 'inline-block' }}>→</span>
      </div>
    </Link>
  );
}

function WeekChart({ data }) {
  const max = Math.max(...data.map(d => d.v), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
      {data.map((d, i) => {
        const h = Math.max(6, (d.v / max) * 70);
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: '100%', height: h, borderRadius: 6,
              background: d.active ? 'var(--accent)' : 'var(--bg-elevated)',
              transition: 'height 0.5s var(--ease-out)',
            }} />
            <span style={{ color: d.active ? 'var(--accent)' : 'var(--text-faint)', fontSize: 10, fontWeight: 600 }}>{d.day}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function Dashboard() {
  const userId = localStorage.getItem('userId');
  const user = useQuery(api.users.get, userId ? { userId } : 'skip');
  const lessons = useQuery(api.lessons.list);
  const [xpVis, setXpVis] = useState(false);

  useEffect(() => { const t = setTimeout(() => setXpVis(true), 600); return () => clearTimeout(t); }, []);

  if (!user) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 36, height: 36, border: '2.5px solid var(--border-subtle)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading dashboard…</p>
      </div>
    </div>
  );

  const xp = user.totalXp || user.xp || 0;
  const streak = user.streak || 0;
  const level = Math.floor(Math.sqrt(xp / 100)) + 1;
  const currLvlXp = Math.pow(level - 1, 2) * 100;
  const nextLvlXp = Math.pow(level, 2) * 100;
  const pct = nextLvlXp > currLvlXp ? Math.round(((xp - currLvlXp) / (nextLvlXp - currLvlXp)) * 100) : 100;
  const lessonCount = lessons?.length || 0;
  const today = new Date().getDay();
  const DAYS = ['S','M','T','W','T','F','S'];
  const weekData = DAYS.map((day, i) => ({ day, v: i <= today ? (i < streak ? Math.floor(Math.random() * 50) + 20 : Math.floor(Math.random() * 15)) : 0, active: i === today }));

  return (
    <div style={{ padding: '32px 24px', maxWidth: 800, margin: '0 auto' }}>
      {/* Welcome */}
      <div style={{ marginBottom: 28, opacity: 0, animation: 'fadeDown 0.4s var(--ease-out) 60ms forwards' }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', margin: '0 0 4px' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.8px' }}>
          Welcome back, <span style={{ color: 'var(--accent)' }}>{user.name}</span> 👋
        </h1>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        <StatCard icon="⚡" label="Total XP" value={xp.toLocaleString()} color="var(--accent)" delay="120ms" />
        <StatCard icon="🔥" label="Streak" value={streak} sub="days in a row" color="#f59e0b" delay="180ms" />
        <StatCard icon="📚" label="Lessons" value={lessonCount} sub="available" color="var(--purple)" delay="240ms" />
        <StatCard icon="🎯" label="Level" value={level} sub={`${pct}% to next`} color="var(--sky)" delay="300ms" />
      </div>

      {/* Two-col layout: progress + weekly */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        {/* Level progress */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
          borderRadius: 16, padding: '22px 20px',
          boxShadow: 'var(--card-shadow)',
          opacity: 0, animation: 'fadeUp 0.4s var(--ease-out) 320ms forwards',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Level Progress</span>
            <span style={{ color: 'var(--accent)', fontSize: 12, fontWeight: 700 }}>Lvl {level} → {level + 1}</span>
          </div>
          <div style={{ height: 8, borderRadius: 99, background: 'var(--bg-elevated)', overflow: 'hidden', marginBottom: 8 }}>
            <div style={{
              height: '100%', width: `${xpVis ? pct : 0}%`, borderRadius: 99,
              background: 'linear-gradient(90deg, var(--accent-hover), var(--accent))',
              transition: 'width 1s var(--ease-out)',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-faint)', fontSize: 11 }}>{(xp - currLvlXp).toLocaleString()} XP</span>
            <span style={{ color: 'var(--text-faint)', fontSize: 11 }}>{(nextLvlXp - currLvlXp).toLocaleString()} XP needed</span>
          </div>
        </div>

        {/* Weekly activity */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
          borderRadius: 16, padding: '22px 20px',
          boxShadow: 'var(--card-shadow)',
          opacity: 0, animation: 'fadeUp 0.4s var(--ease-out) 380ms forwards',
        }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: 14 }}>This Week</span>
          <WeekChart data={weekData} />
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ opacity: 0, animation: 'fadeUp 0.4s var(--ease-out) 440ms forwards' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: 12 }}>Quick Actions</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <QuickAction to="/lessons" icon="📚" title="Continue Learning" desc="Pick up where you left off" color="var(--accent)" />
          <QuickAction to="/leaderboard" icon="🏆" title="Leaderboard" desc="See how you rank" color="#f59e0b" />
          <QuickAction to="/profile" icon="📊" title="Your Progress" desc="View detailed stats & achievements" color="var(--purple)" />
        </div>
      </div>
    </div>
  );
}