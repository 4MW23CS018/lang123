import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function DailyQuests({ userId }) {
  const quests = useQuery(api.quests.getDailyProgress, userId ? { userId } : 'skip');

  if (!quests) return (
    <div className="glass-panel" style={{ padding: '22px 20px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: 24, height: 24, border: '2px solid var(--border-subtle)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  return (
    <div className="glass-panel" style={{ padding: '22px 20px', opacity: 0, animation: 'fadeUp 0.4s var(--ease-out) 350ms forwards' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Daily Quests</span>
        <span style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 700 }}>
          {quests.filter(q => q.current >= q.target).length} / {quests.length} Completed
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {quests.map(quest => {
          const isDone = quest.current >= quest.target;
          const pct = Math.min((quest.current / quest.target) * 100, 100);

          return (
            <div key={quest.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: isDone ? quest.color : 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, transition: 'all 0.3s' }}>
                {isDone ? '✨' : quest.icon}
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <p style={{ color: isDone ? quest.color : 'var(--text-primary)', fontSize: 13, fontWeight: 700, margin: 0, transition: 'color 0.3s' }}>{quest.title}</p>
                  <span style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 600 }}>{quest.current} / {quest.target}</span>
                </div>
                
                <div style={{ height: 6, borderRadius: 99, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${pct}%`, borderRadius: 99,
                    background: quest.color, transition: 'width 1s var(--ease-out)',
                  }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
