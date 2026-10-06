import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAction, useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Mic, Square, Volume2, User, Bot, Play, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';

const SCENARIOS = [
  { id: 'cafe', title: 'Ordering Coffee', context: 'You are a barista at a local cafe in Bangalore. I am a customer ordering a filter coffee.' },
  { id: 'directions', title: 'Asking Directions', context: 'You are a friendly local on the street. I am asking for directions to the nearest bus stand.' },
  { id: 'market', title: 'Bargaining at Market', context: 'You are a fruit vendor at a bustling market. I am trying to buy mangoes and bargain for a good price.' },
];

export default function Roleplay() {
  const userId = localStorage.getItem('userId');
  const language = localStorage.getItem('selectedLanguage') || 'Kannada';
  
  const [activeScenario, setActiveScenario] = useState(SCENARIOS[0]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const messagesEndRef = useRef(null);
  
  const roleplayAction = useAction(api.roleplay.chat);
  const history = useQuery(api.roleplay.getScenarioHistory, userId ? { userId, scenarioId: activeScenario.id } : 'skip');
  const clearHistory = useMutation(api.roleplay.clearHistory);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isProcessing]);

  const handleClear = async () => {
    if (userId) await clearHistory({ userId, scenarioId: activeScenario.id });
  };

  const playTTS = async (text) => {
    try {
      const res = await fetch("http://localhost:5000/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phrase: text, language })
      });
      const blob = await res.blob();
      const audio = new Audio(URL.createObjectURL(blob));
      audio.play();
    } catch (err) {
      console.error("TTS failed:", err);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      
      mr.onstop = async () => {
        setIsProcessing(true);
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
          const b64 = reader.result.split(',')[1];
          try {
            // 1. Transcribe the user's voice
            const res = await fetch("http://localhost:5000/transcribe", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ audio_base64: b64, language }) 
            });
            const data = await res.json();
            const userText = data.text;
            
            if (userText && userText.trim()) {
              // 2. Send to AI Roleplay
              const aiRes = await roleplayAction({
                userId,
                language,
                message: userText,
                scenarioId: activeScenario.id,
                scenarioContext: activeScenario.context
              });
              
              // 3. Automatically speak the AI's response!
              if (aiRes.reply) {
                playTTS(aiRes.reply);
              }
            }
          } catch (err) {
            console.error("Roleplay Error:", err);
          } finally {
            setIsProcessing(false);
          }
        };
      };
      
      mr.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic access denied", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      setIsRecording(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 20px', minHeight: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' }}>
      
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px' }}>
          Voice <span style={{ color: 'var(--purple)' }}>Roleplay</span>
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>Immerse yourself in real-world conversational scenarios.</p>
      </div>

      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 12, marginBottom: 12 }}>
        {SCENARIOS.map(scen => (
          <button 
            key={scen.id}
            onClick={() => setActiveScenario(scen)}
            style={{
              padding: '12px 20px', borderRadius: 16, border: 'none',
              background: activeScenario.id === scen.id ? 'var(--purple)' : 'var(--bg-elevated)',
              color: activeScenario.id === scen.id ? '#fff' : 'var(--text-primary)',
              fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
              boxShadow: activeScenario.id === scen.id ? '0 4px 12px rgba(139,92,246,0.3)' : 'none'
            }}
          >
            {scen.title}
          </button>
        ))}
      </div>

      <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
        
        {/* Chat History Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ textAlign: 'center', padding: '16px', background: 'var(--bg-subtle)', borderRadius: 12, color: 'var(--text-secondary)', fontSize: 14 }}>
            <strong>Scenario:</strong> {activeScenario.context}<br/><br/>
            <em>Tap the microphone and start speaking to begin!</em>
          </div>

          {history?.map((msg, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-end', gap: 12, alignSelf: 'flex-start', maxWidth: '85%' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', background: 'var(--purple)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0
              }}>
                <Bot size={18} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {msg.userMessage && (
                  <div style={{
                    padding: '14px 18px', borderRadius: '18px 18px 18px 4px',
                    background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: 13,
                    alignSelf: 'flex-start'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, color: 'var(--text-secondary)' }}>
                      <User size={12} /> <strong>You</strong>
                    </div>
                    {msg.userMessage}
                  </div>
                )}
                
                <div style={{
                  padding: '16px 20px', borderRadius: '4px 18px 18px 18px',
                  background: 'var(--purple-bg)', border: '1px solid var(--purple)', color: 'var(--text-primary)', fontSize: 15,
                  display: 'flex', alignItems: 'center', gap: 12
                }}>
                  {msg.assistantMessage}
                  <button onClick={() => playTTS(msg.assistantMessage)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--purple)', padding: 4 }}>
                    <Volume2 size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {isProcessing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-muted)' }}>
              <Bot size={18} /> <div className="typing-indicator"><span/><span/><span/></div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Controls Area */}
        <div style={{ padding: '24px', background: 'var(--bg-elevated)', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={handleClear} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <RotateCcw size={16} /> Reset
          </button>

          <button
            onClick={isRecording ? stopRecording : startRecording}
            style={{
              width: 72, height: 72, borderRadius: '50%', border: 'none',
              background: isRecording ? 'var(--coral)' : 'var(--purple)',
              color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: isRecording ? '0 0 20px rgba(244,63,94,0.6)' : '0 8px 24px rgba(139,92,246,0.4)',
              transition: 'all 0.2s', transform: isRecording ? 'scale(1.1)' : 'scale(1)'
            }}
          >
            {isRecording ? <Square size={28} fill="currentColor" /> : <Mic size={32} />}
          </button>
          
          <div style={{ width: 60 }} /> {/* Spacer */}
        </div>
        <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-faint)', paddingBottom: 12, background: 'var(--bg-elevated)' }}>
          Tap to talk. Speak in {language} or English.
        </div>
      </div>
    </div>
  );
}
