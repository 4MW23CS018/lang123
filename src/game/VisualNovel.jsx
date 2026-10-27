import React, { useState, useRef, useEffect, useCallback } from "react";
import { 
  BookOpen, 
  MapPin, 
  Volume2, 
  Languages, 
  Sparkles, 
  Gem, 
  RotateCcw, 
  Mic, 
  Square, 
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Coffee,
  MessageSquare
} from "lucide-react";
import { chapter01 } from "./data/chapter01";
import { SceneEngine, validateChapter } from "./SceneEngine";
import LanguageSwitcher from "../components/layout/LanguageSwitcher";
import { useLanguage } from "../components/hooks/useLanguage";
import { startRecording, playCharacterSpeech, stopAudioPlayback } from "./audioService";
import { evaluateLearnerSpeech } from "./ConversationController";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import "./visual-novel.css";

const SAVE_KEY = "langbridge.vn.chapter01.v1";

function readSave() {
  try {
    return JSON.parse(localStorage.getItem(SAVE_KEY) || "{}");
  } catch {
    return {};
  }
}

/**
 * Character portrait component with position and active speaking state
 */
function Character({ character, active, isSpeaking }) {
  const expression = character.expression || "neutral";
  return (
    <div 
      className={`vn-char vn-char-${character.position} ${active ? "vn-active" : ""}`}
      aria-label={`${character.name} (${character.role || "Character"})`}
    >
      {active && isSpeaking && <div className="vn-char-speaking-glow" />}
      <div className="vn-hair" />
      <div className="vn-face">
        <span className={`vn-eyes vn-eyes-${expression}`} />
        <span className={`vn-brows vn-brows-${expression}`} />
        <span className={`vn-mouth vn-mouth-${expression}`} />
        <i className="vn-blush vn-blush-left" />
        <i className="vn-blush vn-blush-right" />
      </div>
      <div className="vn-neck" />
      <div className={`vn-body ${character.position === "right" ? "vn-body-right" : ""}`}>
        <i className="vn-collar" />
      </div>
      <div className="vn-name-tag">
        <span>{character.name}</span>
        {character.role && <span className="vn-name-role">{character.role}</span>}
      </div>
    </div>
  );
}

/**
 * Notice displayed when user has selected a language other than Kannada
 */
function KannadaChapterNotice({ onSwitchToKannada }) {
  return (
    <div className="vn-main vn-language-notice">
      <div className="vn-notice-card">
        <div style={{ fontSize: 36, marginBottom: 12 }}>☕</div>
        <small style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.16em", color: "var(--purple)" }}>
          LANGBRIDGE STORIES
        </small>
        <h1 style={{ fontSize: 28, margin: "8px 0 12px", color: "#1f112e" }}>
          ಕನ್ನಡದ ಕಥೆಗಳಿಗೆ ಸ್ವಾಗತ!
        </h1>
        <p style={{ color: "#6a577c", fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
          Chapter 1: <strong>"A Stranger in Town"</strong> is a voice-first roleplay scenario currently available in Kannada.
        </p>
        <button 
          className="vn-primary"
          onClick={onSwitchToKannada}
          style={{ padding: "12px 24px", fontSize: 14 }}
        >
          <Sparkles size={16} /> Switch to Kannada & Play (ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಿ)
        </button>
      </div>
    </div>
  );
}

export default function VisualNovel() {
  const { language, setLanguage } = useLanguage();
  const userId = localStorage.getItem("userId");

  // Game Engine State
  const [engine, setEngine] = useState(() => new SceneEngine(chapter01, readSave()));
  const [translation, setTranslation] = useState(true);
  const [journal, setJournal] = useState(false);
  const issues = validateChapter(chapter01);

  // Voice Interaction State
  const [voiceStatus, setVoiceStatus] = useState("idle"); // idle | recording | transcribing | responding | speaking | error
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [lastTranscript, setLastTranscript] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [hasCompletedCelebrated, setHasCompletedCelebrated] = useState(false);

  // Exact user recording for replay and audio diagnostics
  const [userAudioBlob, setUserAudioBlob] = useState(null);
  const [isPlayingUserRecording, setIsPlayingUserRecording] = useState(false);
  const userAudioUrlRef = useRef(null);
  const userAudioInstanceRef = useRef(null);

  const activeRecorderRef = useRef(null);
  const roleplayAction = useAction(api.roleplay.chat);

  const scene = engine.scene;
  const node = engine.node;

  // Persist game state
  const saveEngineState = useCallback((newEngine) => {
    const snap = newEngine.snapshot();
    localStorage.setItem(SAVE_KEY, JSON.stringify(snap));
    setEngine(new SceneEngine(chapter01, snap));
  }, []);

  // Play dialogue audio via Flask /tts or Web Speech API fallback
  const handlePlayAudio = useCallback(async (phrase) => {
    const textToSpeak = phrase || node.text;
    if (!textToSpeak) return;

    // Stop user recording replay if active to prevent overlapping audio
    if (userAudioInstanceRef.current) {
      try {
        userAudioInstanceRef.current.pause();
        userAudioInstanceRef.current.currentTime = 0;
      } catch {}
      userAudioInstanceRef.current = null;
      setIsPlayingUserRecording(false);
    }

    setIsPlayingAudio(true);
    try {
      await playCharacterSpeech(textToSpeak, "Kannada");
    } finally {
      setIsPlayingAudio(false);
    }
  }, [node.text]);

  // Clean up recording and audio on unmount
  useEffect(() => {
    return () => {
      if (activeRecorderRef.current) {
        activeRecorderRef.current.cancel();
      }
      if (userAudioInstanceRef.current) {
        try {
          userAudioInstanceRef.current.pause();
          userAudioInstanceRef.current.currentTime = 0;
        } catch {}
        userAudioInstanceRef.current = null;
      }
      if (userAudioUrlRef.current) {
        URL.revokeObjectURL(userAudioUrlRef.current);
        userAudioUrlRef.current = null;
      }
      stopAudioPlayback();
    };
  }, []);

  // Handle incoming recorded audio blob for replay
  const handleUserRecordingReady = useCallback((blob, meta) => {
    // Stop and clean up any ongoing replay
    if (userAudioInstanceRef.current) {
      try {
        userAudioInstanceRef.current.pause();
        userAudioInstanceRef.current.currentTime = 0;
      } catch {}
      userAudioInstanceRef.current = null;
    }
    setIsPlayingUserRecording(false);

    // Revoke previous object URL only after new recording is ready
    if (userAudioUrlRef.current) {
      URL.revokeObjectURL(userAudioUrlRef.current);
      userAudioUrlRef.current = null;
    }

    const newUrl = URL.createObjectURL(blob);
    userAudioUrlRef.current = newUrl;
    setUserAudioBlob(blob);

    console.log("[AudioDebug] Stored user audio for replay:", {
      mimeType: meta?.mimeType || blob.type,
      sizeBytes: meta?.sizeBytes || blob.size,
      durationSec: meta?.durationSeconds ? meta.durationSeconds.toFixed(1) : undefined
    });
  }, []);

  // Replay user's exact recorded audio
  const handleReplayUserRecording = useCallback(() => {
    if (!userAudioBlob || !userAudioUrlRef.current) {
      console.warn("[AudioDebug] Playback skipped: no recording available");
      setErrorMessage("No recorded audio available to replay. Please record your voice first.");
      return;
    }

    if (userAudioBlob.size === 0) {
      console.warn("[AudioDebug] Playback skipped: recording is empty");
      setErrorMessage("The recorded audio is empty.");
      return;
    }

    // Toggle stop if already playing
    if (isPlayingUserRecording && userAudioInstanceRef.current) {
      console.log("[AudioDebug] Stopping user recording playback");
      try {
        userAudioInstanceRef.current.pause();
        userAudioInstanceRef.current.currentTime = 0;
      } catch {}
      userAudioInstanceRef.current = null;
      setIsPlayingUserRecording(false);
      return;
    }

    // Stop any character TTS playback so they don't overlap
    stopAudioPlayback();

    // Clean up any stale audio instance
    if (userAudioInstanceRef.current) {
      try {
        userAudioInstanceRef.current.pause();
      } catch {}
      userAudioInstanceRef.current = null;
    }

    console.log(
      `[AudioDebug] Starting replay of user recording: size=${userAudioBlob.size} bytes, type="${userAudioBlob.type}"`
    );

    try {
      const audio = new Audio(userAudioUrlRef.current);
      userAudioInstanceRef.current = audio;
      setIsPlayingUserRecording(true);

      audio.onended = () => {
        console.log("[AudioDebug] User recording playback completed successfully");
        setIsPlayingUserRecording(false);
        userAudioInstanceRef.current = null;
      };

      audio.onerror = (e) => {
        console.error("[AudioDebug] User recording playback error event:", e);
        setIsPlayingUserRecording(false);
        userAudioInstanceRef.current = null;
        setErrorMessage("Playback failed. Your browser was unable to decode this audio format.");
      };

      audio.play().catch((err) => {
        console.error("[AudioDebug] Audio.play() rejected:", err);
        setIsPlayingUserRecording(false);
        userAudioInstanceRef.current = null;
        setErrorMessage("Playback could not start. Please click again.");
      });
    } catch (err) {
      console.error("[AudioDebug] Failed to initialize Audio instance:", err);
      setIsPlayingUserRecording(false);
      userAudioInstanceRef.current = null;
      setErrorMessage(`Playback initialization error: ${err.message}`);
    }
  }, [userAudioBlob, isPlayingUserRecording]);

  // Process learner speech or selected phrase
  const handleLearnerInput = useCallback(async (spokenText) => {
    if (!spokenText || !spokenText.trim()) {
      setErrorMessage("No speech detected. Please speak clearly into your microphone.");
      setVoiceStatus("error");
      return;
    }

    setLastTranscript(spokenText);
    setVoiceStatus("responding");
    setErrorMessage("");

    try {
      const evaluation = await evaluateLearnerSpeech({
        transcript: spokenText,
        currentNode: node,
        roleplayAction,
        userId,
        language: "Kannada"
      });

      if (evaluation.success && evaluation.targetNode) {
        const nextState = engine.goToNode(evaluation.targetNode, { transcript: spokenText });
        saveEngineState(new SceneEngine(chapter01, nextState));
        setVoiceStatus("idle");

        // Automatically play character response audio
        const nextNode = chapter01.scenes[nextState.sceneId].nodes[evaluation.targetNode];
        if (nextNode?.text) {
          handlePlayAudio(nextNode.text);
        }
      } else {
        setErrorMessage(evaluation.error || "Could not process speech. Try again.");
        setVoiceStatus("error");
      }
    } catch (err) {
      console.error("[VisualNovel] Speech evaluation error:", err);
      // Fallback safely to unclear node
      const fallbackState = engine.goToNode("unclear", { transcript: spokenText });
      saveEngineState(new SceneEngine(chapter01, fallbackState));
      setVoiceStatus("idle");
    }
  }, [engine, node, roleplayAction, userId, saveEngineState, handlePlayAudio]);

  // Start microphone recording
  const startVoiceRecording = async () => {
    setErrorMessage("");
    setVoiceStatus("recording");
    setRecordingSeconds(0);

    const recorder = await startRecording({
      language: "kannada",
      onRecordingComplete: handleUserRecordingReady,
      onTranscriptionSuccess: (text) => {
        handleLearnerInput(text);
      },
      onError: (errMsg) => {
        setErrorMessage(errMsg);
        setVoiceStatus("error");
      },
      onStatusChange: (status) => {
        setVoiceStatus(status);
      },
      onTimeUpdate: (sec) => {
        setRecordingSeconds(Math.round(sec));
      },
      maxDuration: 8
    });

    if (recorder) {
      activeRecorderRef.current = recorder;
    } else {
      setVoiceStatus("idle");
    }
  };

  // Stop active microphone recording
  const stopVoiceRecording = () => {
    if (activeRecorderRef.current) {
      activeRecorderRef.current.stop();
      activeRecorderRef.current = null;
    }
  };

  // Choice button handler
  const handleChoice = (choiceId) => {
    const choice = (node.choices || []).find(c => c.id === choiceId);
    if (!choice) return;

    if (choice.intent === "order_coffee") {
      handleLearnerInput("ಒಂದು ಕಾಫಿ ಬೇಕು");
    } else if (choice.intent === "ask_help") {
      handleLearnerInput("ಸಹಾಯ ಬೇಕು");
    } else if (choice.intent === "greeting") {
      handleLearnerInput("ನಮಸ್ಕಾರ");
    } else {
      const nextState = engine.choose(choiceId);
      saveEngineState(new SceneEngine(chapter01, nextState));
      const targetNode = chapter01.scenes[nextState.sceneId].nodes[choice.next];
      if (targetNode?.text) {
        handlePlayAudio(targetNode.text);
      }
    }
  };

  // Continue to next narration node
  const handleContinue = () => {
    const nextState = engine.continue();
    saveEngineState(new SceneEngine(chapter01, nextState));
    const nextNode = chapter01.scenes[nextState.sceneId].nodes[nextState.nodeId];
    if (nextNode?.text) {
      handlePlayAudio(nextNode.text);
    }
  };

  // Restart chapter
  const handleRestart = () => {
    const fresh = new SceneEngine(chapter01);
    fresh.reset();
    saveEngineState(fresh);
    setLastTranscript("");
    setErrorMessage("");
    setVoiceStatus("idle");
    setJournal(false);

    if (userAudioInstanceRef.current) {
      try {
        userAudioInstanceRef.current.pause();
        userAudioInstanceRef.current.currentTime = 0;
      } catch {}
      userAudioInstanceRef.current = null;
    }
    if (userAudioUrlRef.current) {
      URL.revokeObjectURL(userAudioUrlRef.current);
      userAudioUrlRef.current = null;
    }
    setUserAudioBlob(null);
    setIsPlayingUserRecording(false);
  };

  const isCurrentSpeaker = (charName) => node.speaker === charName;

  return (
    <main className="vn-shell">
      {/* Top Navigation Bar */}
      <header className="vn-header">
        <a href="/roleplay" aria-label="Return to Roleplay list">
          <ArrowLeft size={16} /> <span>Voice practice</span>
        </a>
        <b>
          <Sparkles size={16} /> LANGBRIDGE <em>STORIES</em>
        </b>
        <div className="vn-header-actions">
          <LanguageSwitcher />
          <button 
            onClick={() => setJournal(v => !v)}
            aria-label="Open Quest Journal"
            aria-expanded={journal}
          >
            <BookOpen size={15} /> Journal
          </button>
        </div>
      </header>

      {/* Language Gate */}
      {language !== "Kannada" ? (
        <KannadaChapterNotice onSwitchToKannada={() => setLanguage("Kannada")} />
      ) : (
        <div className="vn-main">
          {/* Chapter Title & Rewards */}
          <div className="vn-title-row">
            <div>
              <small>CHAPTER 01 · ಕನ್ನಡ</small>
              <h1>{chapter01.title}</h1>
              <p>Voice-first interactive café roleplay. Speak in Kannada to continue.</p>
            </div>
            <div className="vn-reward" aria-label="Earned rewards">
              <Sparkles size={15} /> {engine.state.xp} XP 
              <span style={{ margin: "0 4px", opacity: 0.5 }}>·</span>
              <Gem size={15} /> {engine.state.gems}
            </div>
          </div>

          {/* Illustrated Café Scene Viewport */}
          <section className="vn-scene" aria-label={scene.locationName}>
            <div className="vn-window"><i /><i /><i /><i /></div>
            <div className="vn-shelf"><i /><i /><i /><i /></div>
            <div className="vn-counter" />
            <div className="vn-location">
              <MapPin size={14} /> {scene.locationName}
            </div>
            <div className="vn-characters">
              {scene.characters.map((c) => (
                <Character
                  key={c.id}
                  character={{
                    ...c,
                    expression: isCurrentSpeaker(c.name) ? (node.expression || c.expression) : c.expression
                  }}
                  active={isCurrentSpeaker(c.name)}
                  isSpeaking={isCurrentSpeaker(c.name) && isPlayingAudio}
                />
              ))}
            </div>
          </section>

          {/* Current Quest Objective */}
          <div className="vn-objective">
            <span>OBJECTIVE</span>
            <span>{scene.objective}</span>
            <button onClick={() => setJournal(v => !v)}>Journal ↗</button>
          </div>

          {/* Dialogue & Interaction Area */}
          <section className="vn-interaction">
            {/* Dialogue Card */}
            <div className="vn-dialogue">
              <div className="vn-dialogue-head">
                <div className="vn-speaker-badge">
                  <Coffee size={16} color="var(--purple)" />
                  <b>{node.speaker}</b>
                </div>
                <div>
                  <button 
                    aria-label="Replay dialogue pronunciation in Kannada" 
                    onClick={() => handlePlayAudio(node.text)}
                    className={isPlayingAudio ? "active" : ""}
                    title="Listen to Kannada audio"
                  >
                    <Volume2 size={18} />
                  </button>
                  {node.translation && (
                    <button 
                      aria-label="Toggle English translation" 
                      aria-pressed={translation} 
                      onClick={() => setTranslation(v => !v)}
                      title="Toggle English translation"
                    >
                      <Languages size={18} />
                    </button>
                  )}
                </div>
              </div>

              {/* Native Dialogue */}
              <p className="vn-native" lang="kn">{node.text}</p>

              {/* Translation */}
              {translation && node.translation && (
                <p className="vn-translation">{node.translation}</p>
              )}

              {/* Continue button for narrative transitions */}
              {node.next && !node.allowVoice && !node.end && (
                <button className="vn-primary vn-continue" onClick={handleContinue}>
                  Continue →
                </button>
              )}
            </div>

            {/* Voice-First Hero Dock (when awaiting user input or on voice nodes) */}
            {(node.allowVoice || node.choices) && !node.end && (
              <div className="vn-voice-dock">
                {/* Large Microphone Hero Button */}
                <div className="vn-mic-hero">
                  {voiceStatus === "recording" && <div className="vn-mic-pulse-ring" />}
                  <button
                    className={`vn-mic-btn ${voiceStatus === "recording" ? "recording" : ""}`}
                    onClick={voiceStatus === "recording" ? stopVoiceRecording : startVoiceRecording}
                    aria-label={voiceStatus === "recording" ? "Stop recording speech" : "Tap to speak in Kannada"}
                    disabled={voiceStatus === "transcribing" || voiceStatus === "responding"}
                  >
                    {voiceStatus === "recording" ? (
                      <Square size={28} fill="currentColor" />
                    ) : (
                      <Mic size={34} />
                    )}
                  </button>
                </div>

                {/* Status Indicator */}
                <div className="vn-voice-status-text" role="status" aria-live="polite">
                  {voiceStatus === "idle" && (
                    <span>Tap the microphone to speak in Kannada</span>
                  )}
                  {voiceStatus === "recording" && (
                    <>
                      <div className="vn-audio-waves">
                        <span /><span /><span /><span /><span />
                      </div>
                      <span>Listening... Speak now!</span>
                      <span className="vn-voice-timer">0:0{recordingSeconds}s</span>
                    </>
                  )}
                  {voiceStatus === "transcribing" && (
                    <span>Transcribing your speech with Faster-Whisper...</span>
                  )}
                  {voiceStatus === "responding" && (
                    <span>Evaluating response...</span>
                  )}
                </div>

                {/* Replay My Recording Control */}
                <div className="vn-replay-wrap">
                  <button
                    type="button"
                    className={`vn-replay-btn ${isPlayingUserRecording ? "playing" : ""}`}
                    onClick={handleReplayUserRecording}
                    disabled={!userAudioBlob || voiceStatus === "recording" || voiceStatus === "transcribing"}
                    aria-label={isPlayingUserRecording ? "Stop playing my recording" : "Replay my recording"}
                    title={userAudioBlob ? "Play back the audio captured from your microphone" : "Record your voice first to enable replay"}
                  >
                    {isPlayingUserRecording ? (
                      <>
                        <Square size={13} fill="currentColor" />
                        <span>⏹ Stop Playback</span>
                      </>
                    ) : (
                      <>
                        <Volume2 size={15} />
                        <span>🔊 Replay My Recording</span>
                      </>
                    )}
                  </button>
                  {userAudioBlob && (
                    <span className="vn-recording-meta" title="Captured audio diagnostics">
                      ({(userAudioBlob.size / 1024).toFixed(1)} KB · {userAudioBlob.type.split(";")[0]})
                    </span>
                  )}
                </div>

                {/* Recognized Transcript Display */}
                {lastTranscript && (
                  <div className="vn-transcript-box">
                    <div>
                      <b>You said:</b> “{lastTranscript}”
                    </div>
                    <span style={{ fontSize: 11, color: "var(--emerald)", fontWeight: 700 }}>
                      ✓ Recognized
                    </span>
                  </div>
                )}

                {/* Error Banner with Retry */}
                {errorMessage && (
                  <div className="vn-error-banner" role="alert">
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <AlertCircle size={18} />
                      <span>{errorMessage}</span>
                    </div>
                    <button onClick={startVoiceRecording}>
                      Retry Mic
                    </button>
                  </div>
                )}

                {/* Quick Practice Chips (Phrase hints for accessibility & practice) */}
                <div className="vn-practice-chips">
                  <span className="vn-chips-label">Suggested phrases you can speak:</span>
                  <div className="vn-chips-list">
                    {(node.choices || [
                      { id: "coffee", label: "ಒಂದು ಕಾಫಿ ಬೇಕು", sub: "I'd like a coffee" },
                      { id: "help", label: "ಸಹಾಯ ಬೇಕು", sub: "I need help" },
                      { id: "greet", label: "ನಮಸ್ಕಾರ", sub: "Say hello" }
                    ]).map((c) => (
                      <button
                        key={c.id}
                        className="vn-chip-btn"
                        onClick={() => handleChoice(c.id)}
                        title={`Practice saying: ${c.label}`}
                      >
                        <MessageSquare size={13} color="var(--purple)" />
                        <span>{c.label}</span>
                        {c.sub && <span className="vn-chip-sub">({c.sub})</span>}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Chapter Complete Screen with XP Reward */}
            {node.end && (
              <div className="vn-complete-card">
                <CheckCircle size={44} color="var(--emerald)" />
                <div>
                  <h3 style={{ fontSize: 22, margin: "0 0 6px", color: "#14532d", fontWeight: 800 }}>
                    {node.completeQuest ? "Quest Complete! ಹಳೆಯ ಊರಿಗೆ ಸ್ವಾಗತ!" : "Scene Paused"}
                  </h3>
                  <p style={{ margin: 0, color: "#166534", fontSize: 14 }}>
                    {node.completeQuest 
                      ? "You successfully greeted Ravi and ordered a coffee in Kannada! Ravi is preparing your filter coffee."
                      : "You can return to your Kannada conversation anytime."}
                  </p>
                </div>

                <div className="vn-complete-badges">
                  <div className="vn-complete-badge">
                    <Sparkles size={16} color="var(--purple)" /> +20 XP Earned
                  </div>
                  <div className="vn-complete-badge">
                    <Gem size={16} color="var(--amber)" /> +2 Gems Earned
                  </div>
                </div>

                <div className="vn-complete-actions">
                  <button className="vn-primary" onClick={handleRestart}>
                    <RotateCcw size={15} /> Play Again
                  </button>
                  <a href="/roleplay" className="vn-header" style={{ height: "auto", padding: "10px 18px", borderRadius: 14, background: "#ffffff", border: "1.5px solid var(--emerald)", color: "#166534", fontWeight: 800 }}>
                    ← Back to Roleplay
                  </a>
                </div>
              </div>
            )}
          </section>

          {/* Quest Journal Drawer */}
          {journal && (
            <aside className="vn-journal" aria-label="Quest Journal">
              <div>
                <BookOpen size={18} />
                <b>Quest Journal</b>
                <button aria-label="Close journal" onClick={() => setJournal(false)}>×</button>
              </div>
              <p><strong>Current Objective:</strong> {scene.objective}</p>
              <p>
                <strong>Setting:</strong> {scene.locationName} ({scene.locationNameKn})<br />
                <strong>Key Vocabulary:</strong>
              </p>
              <ul style={{ paddingLeft: 20, margin: "6px 0", fontSize: 13, color: "#4d3960", lineHeight: 1.6 }}>
                <li><strong>ನಮಸ್ಕಾರ (Namaskara):</strong> Hello / Greetings</li>
                <li><strong>ಒಂದು ಕಾಫಿ ಬೇಕು (Ondu kapi beku):</strong> I want a coffee</li>
                <li><strong>ಸಹಾಯ (Sahaya):</strong> Help</li>
                <li><strong>ಸ್ವಾಗತ (Swagata):</strong> Welcome</li>
              </ul>
              <small style={{ color: "var(--emerald)", fontWeight: 800, display: "block", marginTop: 12 }}>
                {engine.state.completedQuests.length ? "✓ Chapter 1 Complete" : "● Chapter 1 In Progress"}
              </small>
              <p className="vn-tip">
                Tip: Tap the speaker icon to listen to the Kannada pronunciation, or toggle the translation button whenever needed.
              </p>
            </aside>
          )}

          {/* Developer Validation Warnings */}
          {import.meta.env.DEV && issues.length > 0 && (
            <pre className="vn-validation">{issues.join("\n")}</pre>
          )}
        </div>
      )}
    </main>
  );
}
