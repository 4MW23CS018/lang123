import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import SpeechRecorder from "../components/speech/SpeechRecorder";
import { useState, useMemo, useEffect } from "react";
import { personalizePhrase, RAW_CURRICULUM_BY_LANG } from "../data/treeCurriculum";

export default function Practice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
  const user = useQuery(api.users.get, userId ? { userId } : "skip");
  const storedUserName = localStorage.getItem("userName");
  const userName = user?.name || user?.username || storedUserName || "Friend";

  const lesson = useQuery(api.lessons.getById, { id });
  const updateLessonPhonetics = useMutation(api.lessons.updateLessonPhonetics);
  
  // 0 to 100
  const [progress, setProgress] = useState(0);

  // Close practice on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") navigate("/lessons");
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [navigate]);

  // Look up canonical static curriculum definition by nodeKey or phrase
  const staticMatch = useMemo(() => {
    if (!lesson) return null;
    const lang = lesson.language || "Kannada";
    const list = RAW_CURRICULUM_BY_LANG[lang] || [];

    // 1. Match by nodeKey
    if (lesson.nodeKey) {
      const byKey = list.find((item) => item.nodeKey === lesson.nodeKey);
      if (byKey) return byKey;
    }

    // 2. Match by pure native phrase without parenthetical transliterations
    const cleanDbPhrase = (lesson.phrase || "").replace(/\(.*?\)/g, "").replace(/\[.*?\]/g, "").trim();
    if (cleanDbPhrase) {
      const byPhrase = list.find((item) => {
        const itemPhrase = (item.phrase || "").replace(/\(.*?\)/g, "").replace(/\[.*?\]/g, "").trim();
        return itemPhrase === cleanDbPhrase;
      });
      if (byPhrase) return byPhrase;
    }

    return null;
  }, [lesson]);

  // Resolve pure native phrase and matching phonetics
  const { cleanPhrase, cleanDisplayPhrase, cleanPhonetics } = useMemo(() => {
    if (!lesson) return { cleanPhrase: "", cleanDisplayPhrase: "", cleanPhonetics: "" };

    // 1. Pure native script (strip any parenthetical transliterations)
    let rawNative = staticMatch?.phrase || lesson.phrase || lesson.displayPhrase || "";
    rawNative = rawNative.replace(/\(.*?\)/g, "").replace(/\[.*?\]/g, "").trim();

    // 2. Pure matching phonetics
    let rawPhonetics = "";
    if (staticMatch?.phonetics) {
      rawPhonetics = staticMatch.phonetics;
    } else {
      // Check if displayPhrase had transliteration in parentheses: e.g. "(Nimma hesarēnu?)"
      const parenMatch = (lesson.displayPhrase || "").match(/\((.*?)\)/);
      if (parenMatch && parenMatch[1] && parenMatch[1].trim()) {
        rawPhonetics = parenMatch[1].trim();
      } else {
        rawPhonetics = lesson.phonetics || "";
      }
    }

    const pPhrase = personalizePhrase(rawNative, userName);
    const pDisplay = personalizePhrase(rawNative, userName);
    const pPhonetics = personalizePhrase(rawPhonetics, userName);

    return {
      cleanPhrase: pPhrase,
      cleanDisplayPhrase: pDisplay,
      cleanPhonetics: pPhonetics,
    };
  }, [lesson, staticMatch, userName]);

  // Auto-heal DB record if stored phonetics was mismatched or corrupted
  useEffect(() => {
    if (lesson && lesson._id && cleanPhonetics && lesson.phonetics !== cleanPhonetics) {
      updateLessonPhonetics({
        id: lesson._id,
        phrase: cleanPhrase,
        phonetics: cleanPhonetics,
        displayPhrase: cleanPhrase,
      }).catch(() => {});
    }
  }, [lesson, cleanPhrase, cleanPhonetics, updateLessonPhonetics]);

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
          phrase={cleanPhrase} 
          displayPhrase={cleanDisplayPhrase} 
          language={lesson.language} 
          userId={userId} 
          lessonId={lesson._id} 
          phonetics={cleanPhonetics} 
          onComplete={(success) => {
            if (success) setProgress(100);
          }}
        />
      </div>
    </div>
  );
}
