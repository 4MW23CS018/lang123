import { getFlaskUrl } from "../lib/flaskConfig";
import React, { useState, useRef, useEffect } from 'react';
import { useAction, useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Mic, Square, Volume2, User, Bot, RotateCcw, Send, AlertCircle, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const SCENARIOS = [
  { id: 'cafe', title: 'Ordering Coffee', context: 'You are a barista at a local cafe in Bangalore. I am a customer ordering a filter coffee.' },
  { id: 'directions', title: 'Asking Directions', context: 'You are a friendly local on the street. I am asking for directions to the nearest bus stand.' },
  { id: 'market', title: 'Bargaining at Market', context: 'You are a fruit vendor at a bustling market. I am trying to buy mangoes and bargain for a good price.' },
];

export default function Roleplay() {
  const userId = localStorage.getItem('userId') || 'guest';
  const language = localStorage.getItem('selectedLanguage') || 'Kannada';
  
  const [activeScenario, setActiveScenario] = useState(SCENARIOS[0]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");
  const [toastMessage, setToastMessage] = useState(null);
  const [textInput, setTextInput] = useState("");
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const recordStartTimeRef = useRef(0);
  const timerIntervalRef = useRef(null);
  const messagesEndRef = useRef(null);
  
  const roleplayAction = useAction(api.roleplay.chat);
  const history = useQuery(api.roleplay.getScenarioHistory, userId ? { userId, scenarioId: activeScenario.id } : 'skip');
  const clearHistory = useMutation(api.roleplay.clearHistory);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isProcessing]);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (mediaRecorderRef.current) {
        try {
          if (mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
          }
        } catch {}
        try {
          mediaRecorderRef.current.stream?.getTracks().forEach(t => t.stop());
        } catch {}
      }
    };
  }, []);

  const handleClear = async () => {
    if (userId) await clearHistory({ userId, scenarioId: activeScenario.id });
    setToastMessage(null);
  };

  const flaskUrl = getFlaskUrl();

  const playTTS = async (text) => {
    if (!text || text.startsWith("[Error]")) return;
    try {
      const res = await fetch(`${flaskUrl}/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Bypass-Tunnel-Reminder": "true" },
        body: JSON.stringify({ phrase: text, language })
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const audio = new Audio(URL.createObjectURL(blob));
      audio.play().catch(e => console.warn("Audio autoplay blocked:", e));
    } catch (err) {
      console.warn("TTS fetch failed:", err);
    }
  };

  const handleSendMessage = async (messageText) => {
    if (!messageText || !messageText.trim()) return;
    setIsProcessing(true);
    setProcessingStatus("AI is replying in character...");
    setToastMessage(null);

    try {
      const aiRes = await roleplayAction({
        userId,
        language,
        message: messageText.trim(),
        scenarioId: activeScenario.id,
        scenarioContext: activeScenario.context
      });

      if (aiRes?.reply) {
        playTTS(aiRes.reply);
      }
    } catch (err) {
      console.error("Roleplay action error:", err);
      setToastMessage("AI temporarily unavailable. Check backend connection.");
    } finally {
      setIsProcessing(false);
      setProcessingStatus("");
    }
  };

  const startRecording = async () => {
    setToastMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const mr = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      recordStartTimeRef.current = Date.now();
      setRecordingSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);

      mr.ondataavailable = e => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      
      mr.onstop = async () => {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        const durationMs = Date.now() - recordStartTimeRef.current;

        if (durationMs < 450 || chunksRef.current.length === 0) {
          setIsProcessing(false);
          setToastMessage("Recording was too short. Tap to start, speak your phrase, and tap stop.");
          return;
        }

        setIsProcessing(true);
        setProcessingStatus("Cleaning & transcribing audio with Whisper...");

        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(blob);

        reader.onloadend = async () => {
          const resultStr = reader.result;
          if (!resultStr || typeof resultStr !== "string") {
            setIsProcessing(false);
            setToastMessage("Could not read microphone audio data.");
            return;
          }

          const b64 = resultStr.split(',')[1];
          try {
            // 1. Transcribe the user's voice with preprocessing & scenario priming
            const res = await fetch(`${flaskUrl}/transcribe`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Bypass-Tunnel-Reminder": "true"
              },
              body: JSON.stringify({
                audio_base64: b64,
                language,
                scenario: activeScenario.id,
                context: activeScenario.context
              })
            });

            if (!res.ok) {
              throw new Error(`Speech server error (${res.status})`);
            }

            const data = await res.json();
            const userText = (data.text || "").trim();
            
            if (userText) {
              // 2. Send transcribed text to AI Roleplay
              await handleSendMessage(userText);
            } else {
              setToastMessage("Could not detect clear speech. Please speak clearly into the microphone.");
              setIsProcessing(false);
            }
          } catch (err) {
            console.error("Roleplay Audio Transcription Error:", err);
            setToastMessage("Failed to reach speech server. Verify that the Python backend is running.");
            setIsProcessing(false);
          }
        };
      };
      
      mr.start(100); // chunk every 100ms
      setIsRecording(true);
    } catch (err) {
      console.error("Mic access denied", err);
      setToastMessage("Microphone access denied. Please grant microphone permissions in browser.");
    }
  };

  const stopRecording = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream?.getTracks().forEach(t => t.stop());
      setIsRecording(false);
    }
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (!textInput.trim() || isProcessing) return;
    const msg = textInput.trim();
    setTextInput("");
    handleSendMessage(msg);
  };

  return (
    <div style={{ maxWidth: 840, margin: '0 auto', padding: '24px 20px', minHeight: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' }}>
      
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>
          Voice <span style={{ color: 'var(--purple)' }}>Roleplay</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Practice real-world South Indian language conversations with audio & AI.
        </p>
      </div>

      {/* Visual Novel Banner */}
      <Link 
        to="/roleplay/game"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 18px',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(244, 63, 94, 0.1) 100%)',
          border: '1.5px solid var(--purple)',
          borderRadius: 16,
          marginBottom: 16,
          textDecoration: 'none',
          color: 'var(--text-primary)',
          transition: 'all 0.2s',
          boxShadow: '0 4px 16px rgba(139, 92, 246, 0.1)'
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'none'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--purple)', display: 'grid', placeItems: 'center', color: '#fff', fontSize: 20 }}>
            ☕
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 900, background: 'var(--purple)', color: '#fff', padding: '2px 8px', borderRadius: 999 }}>VISUAL NOVEL</span>
              <strong style={{ fontSize: 14 }}>Chapter 1: A Stranger in Town</strong>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
              Interactive voice-first story at Old Town Café. Speak in {language} to order!
            </p>
          </div>
        </div>
        <div style={{ background: 'var(--purple)', color: '#fff', padding: '6px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
          Play Story ↗
        </div>
      </Link>

      {/* Scenario Selector */}
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 10, marginBottom: 10 }}>
        {SCENARIOS.map(scen => (
          <button 
            key={scen.id}
            onClick={() => {
              setActiveScenario(scen);
              setToastMessage(null);
            }}
            style={{
              padding: '10px 18px', borderRadius: 14, border: 'none',
              background: activeScenario.id === scen.id ? 'var(--purple)' : 'var(--bg-elevated)',
              color: activeScenario.id === scen.id ? '#fff' : 'var(--text-primary)',
              fontWeight: 600, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
              boxShadow: activeScenario.id === scen.id ? '0 4px 12px rgba(139,92,246,0.3)' : 'none',
              transition: 'all 0.15s'
            }}
          >
            {scen.title}
          </button>
        ))}
      </div>

      {/* Main Dialogue Panel */}
      <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
        
        {/* Chat History Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ textAlign: 'center', padding: '12px 16px', background: 'var(--bg-subtle)', borderRadius: 12, color: 'var(--text-secondary)', fontSize: 13 }}>
            <strong>Scenario:</strong> {activeScenario.context}
          </div>

          {history?.map((msg, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, alignSelf: 'flex-start', maxWidth: '88%' }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%', background: 'var(--purple)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0, marginTop: 4
              }}>
                <Bot size={17} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
                {msg.userMessage && (
                  <div style={{
                    padding: '12px 16px', borderRadius: '16px 16px 16px 4px',
                    background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: 14,
                    alignSelf: 'flex-start'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, color: 'var(--text-muted)', fontSize: 11 }}>
                      <User size={11} /> <strong>You</strong>
                    </div>
                    {msg.userMessage}
                  </div>
                )}
                
                <div style={{
                  padding: '14px 18px', borderRadius: '4px 16px 16px 16px',
                  background: 'var(--purple-bg)', border: '1px solid var(--purple)', color: 'var(--text-primary)', fontSize: 15,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12
                }}>
                  <span style={{ lineHeight: 1.5 }}>{msg.assistantMessage}</span>
                  <button
                    onClick={() => playTTS(msg.assistantMessage)}
                    title="Listen pronunciation"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--purple)', padding: 4, flexShrink: 0 }}
                  >
                    <Volume2 size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {isProcessing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--purple)', fontSize: 13, padding: '8px 12px', background: 'rgba(139,92,246,0.08)', borderRadius: 12, width: 'fit-content' }}>
              <Bot size={18} />
              <span>{processingStatus || "Processing..."}</span>
              <div className="typing-indicator" style={{ display: 'inline-flex', gap: 4 }}><span/><span/><span/></div>
            </div>
          )}

          {toastMessage && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid #ef4444', borderRadius: 10, color: '#f87171', fontSize: 13 }}>
              <AlertCircle size={16} />
              <span>{toastMessage}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Live Recording Status Indicator */}
        {isRecording && (
          <div style={{
            padding: '8px 16px',
            background: 'rgba(239, 68, 68, 0.15)',
            borderTop: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            fontSize: 13, color: '#f87171', fontWeight: 600
          }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'pulse 1s infinite' }} />
            Recording voice in {language}... ({recordingSeconds}s) — Tap stop button when done
          </div>
        )}

        {/* Controls Area */}
        <div style={{ padding: '16px 20px', background: 'var(--bg-elevated)', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <button
              onClick={handleClear}
              title="Reset Conversation"
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
            >
              <RotateCcw size={15} /> Reset
            </button>

            {/* Central Mic Button */}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              title={isRecording ? "Stop Recording" : "Tap and Speak"}
              style={{
                width: 68, height: 68, borderRadius: '50%', border: 'none',
                background: isRecording ? '#ef4444' : 'var(--purple)',
                color: '#fff', cursor: isProcessing ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: isRecording ? '0 0 24px rgba(239,68,68,0.7)' : '0 8px 24px rgba(139,92,246,0.4)',
                transition: 'all 0.2s', transform: isRecording ? 'scale(1.08)' : 'scale(1)',
                opacity: isProcessing ? 0.6 : 1
              }}
            >
              {isRecording ? <Square size={26} fill="currentColor" /> : <Mic size={30} />}
            </button>
            
            <div style={{ width: 60 }} />
          </div>

          {/* Fallback Text Input */}
          <form onSubmit={handleTextSubmit} style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              placeholder={`Or type a message in ${language} or English...`}
              disabled={isRecording || isProcessing}
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 12,
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-subtle)', color: 'var(--text-primary)',
                fontSize: 13, outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={!textInput.trim() || isProcessing}
              style={{
                padding: '0 16px', borderRadius: 12, border: 'none',
                background: 'var(--purple)', color: '#fff', cursor: 'pointer',
                opacity: (!textInput.trim() || isProcessing) ? 0.5 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <Send size={15} />
            </button>
          </form>

          <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-faint)' }}>
            Speak in {language} or English • Whisper speech recognition & Indic NLP active
          </div>
        </div>
      </div>
    </div>
  );
}
