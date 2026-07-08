import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

const MEDAL = { 1: '🥇', 2: '🥈', 3: '🥉' };
const PODIUM_COLOR = { 1: '#f59e0b', 2: '#94a3b8', 3: '#cd7c2f' };

function PodiumCard({ user, rank }) {
  const color = PODIUM_COLOR[rank];
  const isFirst = rank === 1;
  const order = { 1: 2, 2: 1, 3: 3 };
  const delay = { 1: '200ms', 2: '400ms', 3: '100ms' };

  return (
    <div style={{
      order: order[rank], flex: isFirst ? '0 0 36%' : '0 0 28%',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      paddingTop: isFirst ? 0 : 24,
      opacity: 0, animation: `fadeUp 0.5s var(--ease-out) ${delay[rank]} forwards`,
    }}>
      <div className={user.equippedBorder ? user.equippedBorder.replace(/_/g, '-') : ''} style={{
        width: isFirst ? 64 : 50, height: isFirst ? 64 : 50, borderRadius: '50%',
        background: color + '18', border: user.equippedBorder ? 'none' : `2px solid ${color}50`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: isFirst ? 24 : 18, fontWeight: 800, color,
        marginBottom: 6, transition: 'transform 0.2s', position: 'relative', zIndex: 1,
      }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
        {user.name?.[0]?.toUpperCase()}
      </div>
      <span style={{ fontSize: isFirst ? 20 : 16, marginBottom: 4 }}>{MEDAL[rank]}</span>
      <p style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: isFirst ? 15 : 13, margin: '0 0 2px', maxWidth: 100, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</p>
      <span style={{ fontWeight: 800, fontSize: isFirst ? 20 : 15, color }}>
        {(user.totalXp || user.xp || 0).toLocaleString()} <span style={{ fontSize: '0.6em', opacity: 0.6 }}>XP</span>
      </span>
      {/* Podium base */}
      <div style={{
        marginTop: 10, width: '100%', height: isFirst ? 52 : 32,
        background: color + '12', border: `1px solid ${color}25`,
        borderRadius: '10px 10px 0 0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 800, color,
      }}>#{rank}</div>
    </div>
  );
}

function ListRow({ user, index }) {
  const rank = index + 4;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '11px 18px', borderBottom: '1px solid var(--border-subtle)',
      transition: 'background 0.15s', cursor: 'default',
      opacity: 0, animation: `slideInLeft 0.35s var(--ease-out) ${index * 40}ms forwards`,
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', background: 'var(--bg-elevated)', borderRadius: 7, flexShrink: 0 }}>{rank}</span>
        <div className={user.equippedBorder ? user.equippedBorder.replace(/_/g, '-') : ''} style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-elevated)', border: user.equippedBorder ? 'none' : '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', flexShrink: 0, position: 'relative', zIndex: 1 }}>{user.name?.[0]?.toUpperCase()}</div>
        <span style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: 14 }}>{user.name}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {(user.streak || 0) > 0 && <span style={{ background: 'var(--amber-bg)', border: '1px solid var(--amber-border)', color: 'var(--amber)', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999 }}>🔥 {user.streak}</span>}
        <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--accent)', minWidth: 54, textAlign: 'right' }}>{(user.totalXp || user.xp || 0).toLocaleString()} XP</span>
      </div>
    </div>
  );
}

export default function Leaderboard() {
  const users = useQuery(api.users.getLeaderboard) || [];
  const top3 = users.slice(0, 3);
  const rest = users.slice(3);

  return (
    <div style={{ padding: '32px 24px', maxWidth: 700, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28, opacity: 0, animation: 'fadeDown 0.4s var(--ease-out) 60ms forwards' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px' }}>Rankings</span>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0 4px', letterSpacing: '-0.8px' }}>Leaderboard</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>Top learners ranked by XP earned</p>
      </div>

      {/* Podium */}
      {top3.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 6, padding: '0 4px', marginBottom: 0 }}>
          {top3[0] && <PodiumCard user={top3[0]} rank={1} />}
          {top3[1] && <PodiumCard user={top3[1]} rank={2} />}
          {top3[2] && <PodiumCard user={top3[2]} rank={3} />}
        </div>
      )}

      {/* Rest */}
      {rest.length > 0 && (
        <div className="glass-panel" style={{
          borderRadius: '0 0 16px 16px', overflow: 'hidden',
          opacity: 0, animation: 'fadeUp 0.4s var(--ease-out) 500ms forwards',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 18px', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '1px' }}>Rank · Learner</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '1px' }}>Score</span>
          </div>
          {rest.map((u, i) => <ListRow key={u._id} user={u} index={i} />)}
        </div>
      )}

      {users.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '48px 0', fontSize: 14 }}>No learners yet — be the first!</p>
      )}
    </div>
  );
}