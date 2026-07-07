// src/components/speech/SpeechRecorder.jsx
import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import PronunciationFeedback from "./PronunciationFeedback";
import WaveformVisualizer from "./WaveformVisualizer";
import ListenButton from "./ListenButton";

export default function SpeechRecorder({ phrase, language, userId, lessonId, phonetics }) {
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

      const flaskResponse = await fetch("http://localhost:5000/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audio_base64: base64, phrase, language }),
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <style>{`
        @keyframes pulse-ring {
          0%   { transform: scale(1);   opacity: 0.6; }
          100% { transform: scale(1.55); opacity: 0; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* ── Phrase display ── */}
      <div style={{
        textAlign: 'center', padding: '32px 24px',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '20px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 0%, rgba(46,204,113,0.08), transparent 60%)', pointerEvents: 'none' }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', margin: '0 0 16px', fontWeight: '700' }}>
          Pronunciation Challenge
        </p>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 10px', fontWeight: '500' }}>
          Listen &amp; repeat this phrase:
        </p>
        {/* Large native script */}
        <p style={{
          color: 'var(--text-primary)', fontSize: 'clamp(28px, 5vw, 42px)',
          fontWeight: '800', margin: '0 0 8px', lineHeight: 1.3,
          letterSpacing: '-0.5px',
        }}>
          {phrase}
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
          <ListenButton phrase={phrase} language={language} size={48} />
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
        <div style={{
          background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
          borderRadius: '18px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px',
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

      {/* ── Feedback ── */}
      {feedback && (
        <PronunciationFeedback feedback={feedback} />
      )}
    </div>
  );
}