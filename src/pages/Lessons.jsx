import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../components/hooks/useLanguage";

const LANG_META = {
  Kannada:  { color: '#22c55e', emoji: '🟢' },
  Tamil:    { color: '#8b5cf6', emoji: '🟣' },
  Telugu:   { color: '#f59e0b', emoji: '🟠' },
  Malayalam:{ color: '#f43f5e', emoji: '🩷' },
  Tulu:     { color: '#0ea5e9', emoji: '🩵' },
  Kodava:   { color: '#d97706', emoji: '🟡' },
};

function PathNode({ lesson, status, color, index }) {
  const [hov, setHov] = useState(false);
  const [shake, setShake] = useState(false);
  const navigate = useNavigate();

  // Zig-zag offset
  const offset = Math.sin(index * 1.2) * 60; 

  const isLocked = status === 'locked';
  const isPassed = status === 'passed';
  const isCurrent = status === 'current';

  const handleClick = (e) => {
    if (isLocked) {
      e.preventDefault();
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } else {
      navigate(`/lesson/${lesson._id}`);
    }
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      transform: `translateX(${offset}px)`, margin: '16px 0',
      position: 'relative', zIndex: 2
    }}>
      {/* Node Button */}
      <button 
        onClick={handleClick}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        className={shake ? 'shake-anim' : ''}
        style={{
          width: 70, height: 70, borderRadius: '50%',
          border: 'none', cursor: isLocked ? 'not-allowed' : 'pointer',
          background: isLocked ? 'var(--bg-elevated)' : (isPassed ? '#eab308' : color),
          color: isLocked ? 'var(--text-faint)' : '#fff',
          fontSize: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: isLocked 
            ? '0 6px 0 var(--border-subtle)' 
            : `0 6px 0 ${isPassed ? '#ca8a04' : (color + 'aa')}`,
          transform: hov && !isLocked ? 'translateY(-2px)' : (isCurrent ? 'translateY(-4px)' : 'none'),
          transition: 'transform 0.1s, box-shadow 0.1s',
          '--node-color-aa': color + 'aa',
          '--node-color-40': color + '40',
          '--node-color-00': color + '00',
          animation: isCurrent ? 'bouncePulse 2s infinite ease-in-out' : 'none',
          marginBottom: 12
        }}
      >
        {isPassed ? '✓' : (isLocked ? '🔒' : '⭐')}
      </button>

      {/* Tooltip (shows on hover or if current) */}
      <div style={{
        background: 'var(--bg-elevated)', padding: '6px 12px', borderRadius: 12,
        border: '1px solid var(--border-subtle)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        opacity: (hov || isCurrent) ? 1 : 0, 
        transform: (hov || isCurrent) ? 'translateY(0)' : 'translateY(10px)',
        transition: 'all 0.2s', pointerEvents: 'none',
        whiteSpace: 'nowrap', textAlign: 'center'
      }}>
        <p style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 700, margin: 0 }}>
          {lesson.title}
        </p>
        {!isLocked && lesson.phonetics && (
          <p style={{ color: 'var(--text-muted)', fontSize: 11, margin: 0, fontStyle: 'italic' }}>
            {lesson.phonetics}
          </p>
        )}
      </div>


    </div>
  );
}

function CustomLessonRow({ lesson, index, color }) {
  const [hov, setHov] = useState(false);
  return (
    <Link to={`/lesson/${lesson._id}`} style={{ textDecoration: 'none' }}>
      <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '14px 16px', borderRadius: 12,
          background: hov ? 'var(--bg-elevated)' : 'transparent',
          transition: 'all 0.18s var(--ease-out)', cursor: 'pointer',
          marginBottom: 2, border: '1px dashed var(--border-subtle)'
        }}>
        <span style={{ fontSize: 24 }}>🤖</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lesson.title}</p>
          <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', padding: '2px 8px', borderRadius: 999, background: 'var(--accent-bg)', color: 'var(--accent)' }}>AI Generated</span>
        </div>
        <span style={{ color: hov ? color : 'var(--text-faint)', fontSize: 14, transition: 'all 0.15s', transform: hov ? 'translateX(2px)' : 'none', display: 'inline-block' }}>→</span>
      </div>
    </Link>
  );
}

export default function Lessons() {
  const userId = localStorage.getItem("userId");
  const { current, language } = useLanguage();
  
  const lessons = useQuery(api.lessons.listByLanguage, { language });
  const completedLessonIds = useQuery(api.progress.getCompletedLessonIds, { userId }) || [];
  
  const generateLesson = useAction(api.ai.generateCustomLesson);
  const createLesson = useMutation(api.lessons.create);

  const meta = LANG_META[language] || { color: 'var(--text-muted)', emoji: '📖' };
  const color = meta.color;

  if (!lessons) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 36, height: 36, border: '2.5px solid var(--border-subtle)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading path…</p>
      </div>
    </div>
  );
  
  const officialLessons = lessons.filter(l => !l.isCustom);
  const customLessons = lessons.filter(l => l.isCustom);

  // Determine current lesson (first uncompleted)
  const currentLessonId = officialLessons.find(l => !completedLessonIds.includes(l._id))?._id;

  // Group by unit
  const units = officialLessons.reduce((acc, lesson) => {
    const u = lesson.unit || 1;
    if (!acc[u]) acc[u] = { unit: u, topic: lesson.topic || `Unit ${u}`, lessons: [] };
    acc[u].lessons.push(lesson);
    return acc;
  }, {});
  
  const unitArray = Object.values(units).sort((a, b) => a.unit - b.unit);

  return (
    <div style={{ padding: '32px 24px', maxWidth: 600, margin: '0 auto', paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ marginBottom: 40, opacity: 0, animation: 'fadeDown 0.4s var(--ease-out) forwards', textAlign: 'center' }}>
        <h1 style={{ color: 'var(--text-primary)', fontSize: 32, fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.8px' }}>
          {current.emoji} {language}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 15, margin: 0 }}>
          Follow the path to master the language
        </p>
      </div>

      {/* The Path */}
      {unitArray.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <span style={{ fontSize: 40, display: 'block', marginBottom: 16 }}>🚧</span>
          <p style={{ color: 'var(--text-primary)', fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>Path Under Construction</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>No structured lessons available for {language} yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          {unitArray.map((u, ui) => (
            <div key={u.unit} style={{ opacity: 0, animation: `fadeUp 0.4s var(--ease-out) ${ui * 100}ms forwards` }}>
              {/* Unit Header */}
              <div style={{ 
                background: color, borderRadius: 16, padding: '20px 24px', 
                color: '#fff', marginBottom: 24, boxShadow: `0 8px 0 ${color}aa`,
                position: 'relative', overflow: 'hidden'
              }}>
                <div style={{ position: 'relative', zIndex: 2 }}>
                  <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.5px' }}>Unit {u.unit}</h2>
                  <p style={{ fontSize: 15, margin: 0, opacity: 0.9, fontWeight: 600 }}>{u.topic}</p>
                </div>
                <div style={{ position: 'absolute', right: -20, top: -20, fontSize: 120, opacity: 0.15, transform: 'rotate(15deg)' }}>
                  {current.emoji}
                </div>
              </div>

              {/* Unit Nodes */}
              <div style={{ display: 'flex', flexDirection: 'column', position: 'relative', padding: '20px 0' }}>
                {/* Connecting Line */}
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 4, background: 'var(--border-subtle)', transform: 'translateX(-50%)', zIndex: 1, borderRadius: 2 }} />

                {u.lessons.map((lesson, i) => {
                  const isPassed = completedLessonIds.includes(lesson._id);
                  const isCurrent = lesson._id === currentLessonId;
                  const status = isPassed ? 'passed' : (isCurrent ? 'current' : 'locked');
                  
                  return (
                    <PathNode 
                      key={lesson._id} 
                      lesson={lesson} 
                      status={status} 
                      color={color} 
                      index={i} 
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI Custom Lessons Section */}
      <div style={{ marginTop: 60, paddingTop: 40, borderTop: '2px dashed var(--border-subtle)' }}>
        <h3 style={{ color: 'var(--text-primary)', fontSize: 18, fontWeight: 800, marginBottom: 16 }}>Extra Practice</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>Need to learn something specific? Ask AI to generate a custom lesson just for you.</p>
        
        <button 
          onClick={() => {
            const topic = prompt("What would you like to practice? (e.g., 'Ordering food' or 'Greetings')");
            if (!topic) return;
            
            const btn = document.getElementById('ai-btn-text');
            if (btn) btn.innerText = "Generating...";
            
            generateLesson({ language, topic }).then(lesson => {
              createLesson({ ...lesson, isCustom: true }).then(id => {
                window.location.href = `/practice/${id}`;
              });
            }).catch(err => {
              alert("Failed to generate lesson: " + err.message);
              if (btn) btn.innerText = "✨ Generate Custom Lesson";
            });
          }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            background: 'var(--bg-elevated)', border: '2px solid var(--accent)',
            color: 'var(--accent)', padding: '16px', borderRadius: '12px',
            fontWeight: '700', fontSize: '15px', cursor: 'pointer', width: '100%',
            transition: 'all 0.2s ease', marginBottom: 24
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--accent)'; }}
        >
          <span id="ai-btn-text">✨ Generate Custom Lesson</span>
        </button>

        {customLessons.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {customLessons.map((lesson, i) => <CustomLessonRow key={lesson._id} lesson={lesson} index={i} color="var(--accent)" />)}
          </div>
        )}
      </div>
    </div>
  );
}