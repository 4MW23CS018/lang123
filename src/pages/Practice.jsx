import { useParams } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import SpeechRecorder from "../components/speech/SpeechRecorder";

export default function Practice() {
  const { id } = useParams();
  const userId = localStorage.getItem("userId");
  const lesson = useQuery(api.lessons.getById, { id });

  if (!lesson || !userId) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 36, height: 36, border: '2.5px solid var(--border-subtle)', borderTopColor: 'var(--purple)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading practice…</p>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '32px 24px', maxWidth: 640, margin: '0 auto' }}>
      <div style={{ animation: 'fadeUp 0.4s var(--ease-out) both', marginBottom: 20 }}>
        <span style={{ display: 'inline-block', background: 'var(--purple-bg)', border: '1px solid var(--purple-border)', borderRadius: 999, padding: '4px 14px', fontSize: 12, color: 'var(--purple)', fontWeight: 600, marginBottom: 12, textTransform: 'capitalize' }}>{lesson.language}</span>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px', letterSpacing: '-0.5px' }}>Practice: {lesson.title}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>Listen, repeat, and get scored on your pronunciation.</p>
      </div>

      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
        borderRadius: 20, padding: '32px 28px',
        boxShadow: 'var(--card-shadow)',
        animation: 'fadeUp 0.45s var(--ease-out) 100ms both',
      }}>
        <span style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', display: 'block', marginBottom: 20 }}>Pronunciation Challenge</span>
        <SpeechRecorder phrase={lesson.phrase} language={lesson.language} userId={userId} lessonId={lesson._id} phonetics={lesson.phonetics} />
      </div>
    </div>
  );
}
