/**
 * audioService.js
 * Browser MediaRecorder integration with Flask Faster-Whisper endpoint (localhost:5000)
 * and gTTS / SpeechSynthesis fallback.
 */

const FLASK_BASE_URL = import.meta.env.VITE_FLASK_URL || "http://localhost:5000";

/**
 * Clean text to remove parenthetical English translations before sending to TTS.
 */
function cleanTextForSpeech(text) {
  if (!text) return "";
  return text.replace(/\(.*?\)/g, "").replace(/\[.*?\]/g, "").trim();
}

/**
 * Start recording from the user's microphone.
 * Returns an object with `stop()` and `cancel()` methods.
 */
export async function startRecording({
  language = "kannada",
  onRecordingComplete,
  onTranscriptionSuccess,
  onError,
  onStatusChange,
  onTimeUpdate,
  maxDuration = 10
}) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    onError?.("Microphone access is not supported in this browser.");
    return null;
  }

  let mediaStream = null;
  let mediaRecorder = null;
  let chunks = [];
  let timerId = null;
  let elapsedSeconds = 0;
  let isCancelled = false;

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });
  } catch (err) {
    if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
      onError?.("Microphone permission denied. Please allow microphone access in your browser settings to speak.");
    } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
      onError?.("No microphone detected. Please connect a microphone and try again.");
    } else {
      onError?.(`Could not access microphone: ${err.message || err.name}`);
    }
    return null;
  }

  // Determine supported MIME type
  let mimeType = "";
  if (typeof MediaRecorder !== "undefined") {
    if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
      mimeType = "audio/webm;codecs=opus";
    } else if (MediaRecorder.isTypeSupported("audio/webm")) {
      mimeType = "audio/webm";
    } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
      mimeType = "audio/mp4";
    }
  }

  try {
    mediaRecorder = mimeType ? new MediaRecorder(mediaStream, { mimeType }) : new MediaRecorder(mediaStream);
  } catch (mrErr) {
    mediaStream.getTracks().forEach(t => t.stop());
    onError?.(`Failed to initialize recorder: ${mrErr.message}`);
    return null;
  }

  mediaRecorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  mediaRecorder.onstop = async () => {
    clearInterval(timerId);
    mediaStream.getTracks().forEach(t => t.stop());

    if (isCancelled) return;

    if (elapsedSeconds < 0.4 && chunks.reduce((acc, c) => acc + c.size, 0) < 500) {
      onError?.("Recording was too short. Please tap and speak clearly for a moment.");
      return;
    }

    onStatusChange?.("transcribing");

    const audioBlob = new Blob(chunks, { type: mimeType || "audio/webm" });

    // Log concise diagnostics (no sensitive payload or base64 data)
    console.log(
      `[AudioDebug] Recording completed: MIME type="${audioBlob.type || mimeType}", size=${audioBlob.size} bytes, duration=${elapsedSeconds.toFixed(1)}s`
    );

    // Retain exact Blob for playback replay
    onRecordingComplete?.(audioBlob, {
      mimeType: audioBlob.type || mimeType,
      sizeBytes: audioBlob.size,
      durationSeconds: elapsedSeconds
    });

    // Convert blob to base64
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
      const resultStr = reader.result;
      if (!resultStr || typeof resultStr !== "string") {
        onError?.("Failed to process recorded audio data.");
        return;
      }
      const base64Data = resultStr.split(",")[1];

      try {
        const response = await fetch(`${FLASK_BASE_URL}/transcribe`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            audio_base64: base64Data,
            language: language.toLowerCase()
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP error ${response.status}`);
        }

        const data = await response.json();
        const recognizedText = data.text?.trim() || "";

        if (!recognizedText) {
          onError?.("ಧ್ವನಿ ಕೇಳಿಸಲಿಲ್ಲ (Could not hear speech clearly). Please try speaking again closer to the mic.");
          return;
        }

        onTranscriptionSuccess?.(recognizedText);
      } catch (err) {
        console.warn("[audioService] Transcription error:", err);
        const isNetworkErr = err.name === "TypeError" || err.message?.includes("fetch");
        if (isNetworkErr) {
          onError?.(
            "Speech service (localhost:5000) is offline or unreachable. Ensure the Python Faster-Whisper service is running, or tap one of the suggested phrases below."
          );
        } else {
          onError?.(`Transcription failed: ${err.message}`);
        }
      }
    };
  };

  // Start recording
  mediaRecorder.start(250);
  onStatusChange?.("recording");

  // Timer for duration & auto-stop
  timerId = setInterval(() => {
    elapsedSeconds += 0.5;
    onTimeUpdate?.(elapsedSeconds);
    if (elapsedSeconds >= maxDuration) {
      controller.stop();
    }
  }, 500);

  const controller = {
    stop() {
      if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
      }
    },
    cancel() {
      isCancelled = true;
      clearInterval(timerId);
      if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
      }
      if (mediaStream) {
        mediaStream.getTracks().forEach(t => t.stop());
      }
      onStatusChange?.("idle");
    }
  };

  return controller;
}

/**
 * Play Kannada character audio.
 * Attempts Flask /tts first, then falls back to window.speechSynthesis.
 */
let currentAudio = null;

export async function playCharacterSpeech(text, language = "Kannada") {
  const cleaned = cleanTextForSpeech(text);
  if (!cleaned) return;

  // Stop any currently playing audio
  stopAudioPlayback();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(`${FLASK_BASE_URL}/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phrase: cleaned,
        language: language.toLowerCase()
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      currentAudio = new Audio(audioUrl);
      currentAudio.play().catch(e => console.warn("[audioService] Audio play error:", e));
      return;
    }
  } catch (err) {
    // Flask TTS unreachable or timed out — fallback to Web Speech API
    console.warn("[audioService] Flask TTS unavailable, using browser SpeechSynthesis fallback");
  }

  // Browser SpeechSynthesis fallback
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleaned);
      utterance.lang = "kn-IN";
      utterance.rate = 0.9; // Slightly slower for language learners
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("[audioService] SpeechSynthesis error:", e);
    }
  }
}

export function stopAudioPlayback() {
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    } catch {}
    currentAudio = null;
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
