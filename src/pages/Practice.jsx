import { useParams, Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import SpeechRecorder from "../components/speech/SpeechRecorder";
import { useState } from "react";

export default function Practice() {
  const { id } = useParams();
  const userId = localStorage.getItem("userId");
  const lesson = useQuery(api.lessons.getById, { id });
  
  // 0 to 100
  const [progress, setProgress] = useState(0);

  if (!lesson || !userId) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 36, height: 36, border: '2.5px solid var(--border-subtle)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading practice…</p>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '0 24px', maxWidth: 640, margin: '0 auto', height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* Mini-game Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 24, marginBottom: 40 }}>
        <Link to="/lessons" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 24, fontWeight: 700, padding: 8 }}>
          ×
        </Link>
        <div style={{ flex: 1, height: 16, background: 'var(--bg-elevated)', borderRadius: 99, overflow: 'hidden', border: '2px solid var(--border-subtle)' }}>
          <div style={{ 
            height: '100%', background: 'var(--accent)', borderRadius: 99, 
            width: `${progress}%`, transition: 'width 0.5s var(--ease-out)',
            position: 'relative', overflow: 'hidden'
          }}>
             <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 100%)' }} />
          </div>
        </div>
      </div>

      <div style={{ animation: 'fadeUp 0.4s var(--ease-out) both', marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px', letterSpacing: '-0.5px' }}>
          Translate this sentence
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15, margin: 0 }}>
          Listen, repeat, and get scored on your pronunciation.
        </p>
      </div>

      <div className="glass-panel" style={{
        padding: '32px 28px',
        animation: 'fadeUp 0.45s var(--ease-out) 100ms both',
        flex: 1, display: 'flex', flexDirection: 'column'
      }}>
        <SpeechRecorder 
          phrase={lesson.phrase} 
          displayPhrase={lesson.displayPhrase} 
          language={lesson.language} 
          userId={userId} 
          lessonId={lesson._id} 
          phonetics={lesson.phonetics} 
          onComplete={(success) => {
            if (success) setProgress(100);
          }}
        />
      </div>
    </div>
  );
}
