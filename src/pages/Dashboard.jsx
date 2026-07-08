import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import DailyQuests from '../components/gamification/DailyQuests';

function StatCard({ icon, label, value, sub, color, delay }) {
  const [hov, setHov] = useState(false);
  return (
    <div className="glass-card" onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        padding: '20px 18px',
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
      <div className="glass-card" onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '16px 18px',
          cursor: 'pointer',
          border: hov ? `1px solid ${color}40` : undefined,
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

/* ── Daily Goal Progress Ring ── */
function DailyGoalRing({ dailyXp, dailyGoal, animate }) {
  const size = 160;
  const stroke = 10;
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min((dailyXp / dailyGoal) * 100, 100);
  const dash = animate ? (pct / 100) * circ : 0;
  const goalMet = dailyXp >= dailyGoal;

  const ringColor = goalMet ? '#2ecc71' : 'var(--accent)';
  const emoji = goalMet ? '🎯' : '🔥';
  const statusText = goalMet ? 'Goal reached!' : `${Math.round(pct)}% complete`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        {/* Glow effect when goal met */}
        {goalMet && (
          <div style={{
            position: 'absolute', inset: -8,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(46,204,113,0.15) 0%, transparent 70%)',
            animation: 'pulse-glow 2s ease-in-out infinite alternate',
          }} />
        )}
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background track */}
          <circle cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke="var(--border-subtle)" strokeWidth={stroke} />
          {/* Progress arc */}
          <circle cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={ringColor} strokeWidth={stroke}
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dasharray 1.2s cubic-bezier(0.16,1,0.3,1), stroke 0.5s ease',
              filter: goalMet ? 'drop-shadow(0 0 8px rgba(46,204,113,0.5))' : 'none',
            }} />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 28, marginBottom: 2 }}>{emoji}</span>
          <span style={{
            color: ringColor, fontSize: 22, fontWeight: 900, lineHeight: 1,
          }}>
            {dailyXp}
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 600, marginTop: 2 }}>
            / {dailyGoal} XP
          </span>
        </div>
      </div>
      <span style={{
        color: goalMet ? '#2ecc71' : 'var(--text-secondary)',
        fontSize: 13, fontWeight: 700,
      }}>
        {statusText}
      </span>
    </div>
  );
}

/* ── Daily Goal Setter ── */
const GOAL_OPTIONS = [30, 50, 100, 150];

function DailyGoalSetter({ currentGoal, userId }) {
  const updateGoal = useMutation(api.users.updateDailyGoal);
  const [activeGoal, setActiveGoal] = useState(currentGoal);

  useEffect(() => setActiveGoal(currentGoal), [currentGoal]);

  const handleSelect = async (goal) => {
    setActiveGoal(goal);
    await updateGoal({ userId, dailyGoal: goal });
  };

  return (
    <div>
      <span style={{
        color: 'var(--text-muted)', fontSize: 11, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.8px',
        display: 'block', marginBottom: 10,
      }}>
        Daily XP Goal
      </span>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
        {GOAL_OPTIONS.map(goal => {
          const active = goal === activeGoal;
          return (
            <button key={goal} onClick={() => handleSelect(goal)}
              style={{
                padding: '10px 0', borderRadius: 10,
                background: active ? 'var(--accent)' : 'var(--bg-elevated)',
                border: active ? '1px solid var(--accent)' : '1px solid var(--border-subtle)',
                color: active ? '#fff' : 'var(--text-secondary)',
                fontWeight: 700, fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.2s var(--ease-out)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              }}
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.color = 'var(--accent)';
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              <span style={{ fontSize: 15, fontWeight: 800 }}>{goal}</span>
              <span style={{ fontSize: 9, fontWeight: 600, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.5px' }}>XP</span>
            </button>
          );
        })}
      </div>
      <p style={{
        color: 'var(--text-faint)', fontSize: 11, margin: '8px 0 0',
        textAlign: 'center',
      }}>
        {activeGoal <= 30 ? '🌱 Casual' : activeGoal <= 50 ? '💪 Regular' : activeGoal <= 100 ? '🔥 Serious' : '🏆 Intense'} pace
      </p>
    </div>
  );
}

export default function Dashboard() {
  const userId = localStorage.getItem('userId');
  const user = useQuery(api.users.get, userId ? { userId } : 'skip');
  const lessons = useQuery(api.lessons.list);
  const [xpVis, setXpVis] = useState(false);
  const [goalVis, setGoalVis] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setXpVis(true), 600);
    const t2 = setTimeout(() => setGoalVis(true), 800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

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

  // Daily goal data
  const dailyGoal = user.dailyGoal || 50;
  const todayStr = new Date().toISOString().slice(0, 10);
  const dailyXp = user.dailyXpDate === todayStr ? (user.dailyXp || 0) : 0;

  return (
    <div style={{ padding: '32px 24px', maxWidth: 800, margin: '0 auto' }}>
      <style>{`
        @keyframes pulse-glow {
          0% { opacity: 0.5; transform: scale(0.98); }
          100% { opacity: 1; transform: scale(1.02); }
        }
      `}</style>

      {/* Welcome */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28, opacity: 0, animation: 'fadeDown 0.4s var(--ease-out) 60ms forwards' }}>
        <div className={user.equippedBorder ? user.equippedBorder.replace(/_/g, '-') : ''} style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'var(--accent-bg)', border: user.equippedBorder ? 'none' : '2px solid var(--accent-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, fontWeight: 800, color: 'var(--accent)', flexShrink: 0,
          position: 'relative', zIndex: 1,
        }}>
          {user.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', margin: '0 0 4px' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.8px' }}>
            Welcome back, <span style={{ color: 'var(--accent)' }}>{user.name}</span> 👋
          </h1>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        <StatCard icon="⚡" label="Total XP" value={xp.toLocaleString()} color="var(--accent)" delay="120ms" />
        <StatCard icon="🔥" label="Streak" value={streak} sub="days in a row" color="#f59e0b" delay="180ms" />
        <StatCard icon="📚" label="Lessons" value={lessonCount} sub="available" color="var(--purple)" delay="240ms" />
        <StatCard icon="🎯" label="Level" value={level} sub={`${pct}% to next`} color="var(--sky)" delay="300ms" />
      </div>

      {/* Two-col layout: daily goal + level progress */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        {/* Daily Goal */}
        <div className="glass-panel" style={{
          padding: '22px 20px',
          opacity: 0, animation: 'fadeUp 0.4s var(--ease-out) 320ms forwards',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
        }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', alignSelf: 'flex-start' }}>Today's Goal</span>
          <DailyGoalRing dailyXp={dailyXp} dailyGoal={dailyGoal} animate={goalVis} />
          {dailyXp === 0 && (
            <p style={{ color: 'var(--text-faint)', fontSize: 12, textAlign: 'center', margin: 0, fontStyle: 'italic' }}>
              Practice a lesson to start earning XP today!
            </p>
          )}
        </div>

        {/* Level Progress + Goal Setter */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Level progress */}
          <div className="glass-panel" style={{
            padding: '22px 20px',
            opacity: 0, animation: 'fadeUp 0.4s var(--ease-out) 380ms forwards',
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

          {/* Goal setter */}
          <div className="glass-panel" style={{
            padding: '18px 20px',
            opacity: 0, animation: 'fadeUp 0.4s var(--ease-out) 440ms forwards',
          }}>
            <DailyGoalSetter currentGoal={dailyGoal} userId={userId} />
          </div>

          {/* Daily Quests */}
          <DailyQuests userId={userId} />
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ opacity: 0, animation: 'fadeUp 0.4s var(--ease-out) 500ms forwards' }}>
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