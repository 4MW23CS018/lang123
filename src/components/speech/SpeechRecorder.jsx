// src/components/speech/SpeechRecorder.jsx
import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import PronunciationFeedback from "./PronunciationFeedback";
import WaveformVisualizer from "./WaveformVisualizer";
import ListenButton from "./ListenButton";
import Confetti from "react-confetti";

export default function SpeechRecorder({ phrase, displayPhrase, language, userId, lessonId, phonetics, onComplete }) {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [processing, setProcessing] = useState(false);

  const generateUploadUrl = useMutation(api.speech.generateUploadUrl);
  const saveAssessment = useMutation(api.speech.saveAssessment);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const start = async () => {
    setFeedback(null);
    setAudioBlob(null);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    chunksRef.current = [];
    mediaRecorderRef.current.ondataavailable = (e) => chunksRef.current.push(e.data);
    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      setAudioBlob(blob);
    };
    mediaRecorderRef.current.start();
    setRecording(true);
  };

  const stop = () => {
    mediaRecorderRef.current.stop();
    mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    setRecording(false);
  };

  const submit = async () => {
    if (!audioBlob) return;
    setProcessing(true);
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
      });

      const uploadUrl = await generateUploadUrl();
      const uploadResult = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": audioBlob.type },
        body: audioBlob,
      });
      const { storageId } = await uploadResult.json();

      const flaskResponse = await fetch(`${import.meta.env.VITE_FLASK_URL || 'http://localhost:5000'}/assess`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Bypass-Tunnel-Reminder": "true" },
        body: JSON.stringify({ audio_base64: base64, phrase, phonetics, language }),
      });

      if (!flaskResponse.ok) {
        const errorText = await flaskResponse.text();
        throw new Error(`Flask error: ${flaskResponse.status} - ${errorText}`);
      }

      const assessment = await flaskResponse.json();
      const { xpEarned } = await saveAssessment({
        userId, lessonId,
        transcription: assessment.transcription,
        accuracy: assessment.accuracy,
        audioStorageId: storageId,
      });

      setFeedback({ ...assessment, xpEarned, phonetics });
    } catch (err) {
      console.error("FAILED:", err);
      alert(`Failed to analyze audio.\n${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  if (feedback) {
    const isSuccess = feedback.accuracy >= 80;

    const BreakdownView = () => (
      <div style={{ width: '100%', maxWidth: 440, margin: '0 auto' }}>
        {/* Faster-Whisper transcribed text */}
        {feedback.transcription && (
          <div style={{
            background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
            borderRadius: 12, padding: '10px 16px', marginBottom: 18, textAlign: 'center',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
          }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              You said:
            </span>
            <span style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 700 }}>
              "{feedback.transcription}"
            </span>
          </div>
        )}

        {/* Word breakdown badges */}
        {feedback.word_breakdown && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 18 }}>
            {feedback.word_breakdown.map((w, i) => {
              const isCorrect = w.status === 'correct';
              const isPartial = w.status === 'partial';
              const isMis = w.status === 'mispronounced';
              const bg = isCorrect ? 'rgba(34,197,94,0.15)' : isPartial ? 'rgba(234,179,8,0.18)' : isMis ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)';
              const color = isCorrect ? '#22c55e' : isPartial ? '#eab308' : isMis ? '#f59e0b' : '#ef4444';
              const border = isCorrect ? 'rgba(34,197,94,0.3)' : isPartial ? 'rgba(234,179,8,0.4)' : isMis ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)';

              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <span style={{ 
                    padding: '6px 14px', borderRadius: 10, fontWeight: 700, fontSize: 16,
                    background: bg, color: color, border: `1px solid ${border}`,
                    display: 'inline-flex', alignItems: 'center', gap: 6
                  }}>
                    <span>{isCorrect ? '✓' : isPartial ? '◐' : isMis ? '⚠' : '✕'}</span>
                    {w.word}
                  </span>
                  {isPartial && w.missing_part && (
                    <span style={{ fontSize: 11, color: '#eab308', fontWeight: 600 }}>
                      missed: {w.missing_part}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Diagnostic detailed notes if partial or missing */}
        {feedback.word_breakdown?.some(w => w.status === 'partial' || (w.note && w.status !== 'correct')) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18 }}>
            {feedback.word_breakdown.filter(w => w.status === 'partial' || (w.note && w.status !== 'correct')).map((w, idx) => (
              <div key={idx} style={{
                fontSize: 13, padding: '8px 14px', borderRadius: 10,
                background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.25)',
                color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                lineHeight: 1.4
              }}>
                <span style={{ fontWeight: 600 }}>{w.note || `Partial match on "${w.word}"`}</span>
              </div>
            ))}
          </div>
        )}
        
        {/* AI Tutor tip */}
        {feedback.ai_tip && (
          <div style={{
            background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
            padding: 16, borderRadius: 14, marginBottom: 24, textAlign: 'left',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--purple, #a855f7)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>💡</span> Tutor's Feedback
            </p>
            <p style={{ margin: 0, fontSize: 15, color: 'var(--text-primary)', lineHeight: 1.5, fontWeight: 500 }}>
              {feedback.ai_tip}
            </p>
          </div>
        )}
      </div>
    );

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 24, animation: 'fadeUp 0.4s var(--ease-out) forwards' }}>
        {isSuccess && <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={400} />}
        {isSuccess ? (
          <div style={{ textAlign: 'center', zIndex: 10 }}>
            <div style={{ fontSize: 80, animation: 'bouncePulse 2s infinite ease-in-out' }}>🎉</div>
            <h2 style={{ color: '#22c55e', fontSize: 32, fontWeight: 800, margin: '16px 0 24px' }}>Awesome Job!</h2>

            <BreakdownView />

            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 32 }}>
              <div style={{ background: 'var(--bg-elevated)', padding: '12px 24px', borderRadius: 16, border: '2px solid #eab308' }}>
                <span style={{ fontSize: 24, display: 'block', marginBottom: 4 }}>⭐</span>
                <span style={{ color: '#eab308', fontWeight: 800, fontSize: 18 }}>+{feedback.xpEarned} XP</span>
              </div>
              <div style={{ background: 'var(--bg-elevated)', padding: '12px 24px', borderRadius: 16, border: '2px solid #0ea5e9' }}>
                <span style={{ fontSize: 24, display: 'block', marginBottom: 4 }}>💎</span>
                <span style={{ color: '#0ea5e9', fontWeight: 800, fontSize: 18 }}>+{Math.max(1, Math.floor(feedback.xpEarned / 5))}</span>
              </div>
            </div>

            <button
              onClick={() => {
                if (onComplete) onComplete(true);
                window.location.href = '/lessons';
              }}
              style={{
                background: '#22c55e', color: '#fff', border: 'none', borderRadius: 16,
                padding: '16px 48px', fontSize: 20, fontWeight: 800, cursor: 'pointer',
                boxShadow: '0 6px 0 #16a34a', transition: 'all 0.1s'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
              onMouseDown={e => { e.currentTarget.style.transform = 'translateY(6px)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              CONTINUE
            </button>
          </div>
        ) : (
          <div style={{ textAlign: 'center', zIndex: 10 }}>
            <div style={{ fontSize: 80 }}>😅</div>
            <h2 style={{ color: '#ef4444', fontSize: 32, fontWeight: 800, margin: '16px 0 24px' }}>Keep Trying!</h2>

            <BreakdownView />

            <button
              onClick={() => {
                setFeedback(null);
                setAudioBlob(null);
              }}
              style={{
                background: '#ef4444', color: '#fff', border: 'none', borderRadius: 16,
                padding: '16px 48px', fontSize: 20, fontWeight: 800, cursor: 'pointer',
                boxShadow: '0 6px 0 #dc2626', transition: 'all 0.1s'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
              onMouseDown={e => { e.currentTarget.style.transform = 'translateY(6px)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              TRY AGAIN
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <style>{`
        @keyframes pulse-ring {
          0%   { transform: scale(1);   opacity: 0.6; }
          100% { transform: scale(1.55); opacity: 0; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes bouncePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>

      {/* ── Phrase display ── */}
      <div className="glass-panel" style={{
        textAlign: 'center', padding: '32px 24px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 0%, rgba(46,204,113,0.08), transparent 60%)', pointerEvents: 'none' }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', margin: '0 0 16px', fontWeight: '700' }}>
          Pronunciation Challenge
        </p>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 10px', fontWeight: '500' }}>
          Listen &amp; repeat this phrase:
        </p>
        {/* Large native script or fallback to phrase */}
        <p style={{
          color: 'var(--text-primary)', fontSize: 'clamp(28px, 5vw, 42px)',
          fontWeight: '800', margin: '0 0 8px', lineHeight: 1.3,
          letterSpacing: '-0.5px',
        }}>
          {displayPhrase || phrase}
        </p>
        {/* Phonetics guide */}
        {phonetics && (
          <p style={{
            color: 'var(--purple)', fontSize: 'clamp(14px, 2.5vw, 18px)',
            fontWeight: '600', fontStyle: 'italic',
            margin: '0 0 18px', letterSpacing: '1px',
          }}>
            🗣 {phonetics}
          </p>
        )}
        {!phonetics && <div style={{ marginBottom: 18 }} />}
        {/* Listen button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <ListenButton phrase={phrase} displayPhrase={displayPhrase} language={language} size={48} />
          <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '500' }}>Tap to hear pronunciation</span>
        </div>
      </div>

      {/* ── Pulsing record button ── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        {!recording ? (
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Pulse rings */}
            {[0, 0.3, 0.6].map((delay, i) => (
              <div key={i} style={{
                position: 'absolute', width: '88px', height: '88px', borderRadius: '50%',
                border: '2px solid rgba(46,204,113,0.4)',
                animation: `pulse-ring 1.8s ease-out infinite`,
                animationDelay: `${delay}s`,
              }} />
            ))}
            <button onClick={start} style={{
              position: 'relative', width: '88px', height: '88px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #2ecc71, #27ae60)',
              border: 'none', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px',
              boxShadow: '0 0 40px rgba(46,204,113,0.4), 0 8px 24px rgba(0,0,0,0.3)',
              transition: 'transform 0.15s, box-shadow 0.15s',
              zIndex: 1,
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.06)'; e.currentTarget.style.boxShadow = '0 0 55px rgba(46,204,113,0.55), 0 12px 30px rgba(0,0,0,0.35)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 0 40px rgba(46,204,113,0.4), 0 8px 24px rgba(0,0,0,0.3)'; }}
            >
              <span style={{ fontSize: '26px' }}>🎤</span>
              <span style={{ color: '#000', fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Record</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <button onClick={stop} style={{
              width: '88px', height: '88px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              border: 'none', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px',
              boxShadow: '0 0 40px rgba(239,68,68,0.45), 0 8px 24px rgba(0,0,0,0.3)',
              transition: 'transform 0.15s',
              animation: 'pulse-ring 1.5s ease-out infinite',
            }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.06)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div style={{ width: '22px', height: '22px', borderRadius: '5px', background: '#fff' }} />
              <span style={{ color: '#fff', fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Stop</span>
            </button>
            <WaveformVisualizer isRecording={recording} />
            <p style={{ color: '#ef4444', fontSize: '13px', fontWeight: '600', margin: 0, animation: 'pulse-ring 1s ease-in-out infinite' }}>
              ● Recording…
            </p>
          </div>
        )}
      </div>

      {/* ── Recorded audio + submit ── */}
      {audioBlob && !recording && (
        <div className="glass-panel" style={{
          padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px',
        }}>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 8px' }}>Your recording</p>
            <audio src={URL.createObjectURL(audioBlob)} controls style={{ width: '100%', height: '44px', borderRadius: '8px' }} />
          </div>
          <button
            onClick={submit}
            disabled={processing}
            style={{
              width: '100%', padding: '16px',
              background: processing ? 'rgba(46,204,113,0.4)' : '#2ecc71',
              border: 'none', borderRadius: '12px', color: '#000',
              fontWeight: '800', fontSize: '16px',
              cursor: processing ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              transition: 'background 0.2s, transform 0.15s',
            }}
            onMouseEnter={e => { if (!processing) { e.currentTarget.style.background = '#27ae60'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
            onMouseLeave={e => { if (!processing) { e.currentTarget.style.background = '#2ecc71'; e.currentTarget.style.transform = 'none'; } }}
          >
            {processing ? (
              <>
                <div style={{ width: '16px', height: '16px', border: '2px solid rgba(0,0,0,0.2)', borderTop: '2px solid #000', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Analyzing Pronunciation…
              </>
            ) : (
              <>✨ Check Pronunciation →</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}