import { useParams, Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import ListenButton from "../components/speech/ListenButton";

export default function LessonDetail() {
  const { id } = useParams();
  const userId = localStorage.getItem("userId");
  const lesson = useQuery(api.lessons.getById, { id });

  if (!lesson || !userId) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 36, height: 36, border: '2.5px solid var(--border-subtle)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading lesson…</p>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '32px 24px', maxWidth: 640, margin: '0 auto' }}>
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
        borderRadius: 20, padding: '36px 32px',
        boxShadow: 'var(--card-shadow)',
        animation: 'fadeUp 0.45s var(--ease-out) both',
      }}>
        <span style={{ display: 'inline-block', background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', borderRadius: 999, padding: '4px 14px', fontSize: 12, color: 'var(--accent)', fontWeight: 600, marginBottom: 18, textTransform: 'capitalize' }}>{lesson.language}</span>

        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 24px', letterSpacing: '-0.5px' }}>{lesson.title}</h1>

        <span style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', display: 'block', marginBottom: 10 }}>Lesson Phrase</span>
        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '22px 20px', marginBottom: 28 }}>
          <p style={{ color: 'var(--text-primary)', fontSize: 20, margin: '0 0 8px', lineHeight: 1.7, fontWeight: 500 }}>{lesson.phrase}</p>
          {lesson.phonetics && (
            <div style={{
              background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)',
              borderRadius: 10, padding: '10px 14px', marginBottom: 12,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ fontSize: 14 }}>🗣</span>
              <span style={{ color: '#a5b4fc', fontSize: 15, fontWeight: 600, fontStyle: 'italic', letterSpacing: '0.5px' }}>
                {lesson.phonetics}
              </span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ListenButton phrase={lesson.phrase} language={lesson.language} size={42} />
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Listen to pronunciation</span>
          </div>
        </div>

        <Link to={`/practice/${lesson._id}`} style={{
          display: 'block', width: '100%', padding: 15, boxSizing: 'border-box',
          background: 'var(--accent)', color: '#fff',
          fontWeight: 700, fontSize: 16, borderRadius: 14, textAlign: 'center',
          transition: 'all 0.25s var(--ease-out)', textDecoration: 'none',
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = 'var(--accent-hover)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.background = 'var(--accent)'; }}>
          Start Practice Session →
        </Link>
      </div>
    </div>
  );
}