import { getFlaskUrl, ACTIVE_RENDER_URL } from "../../lib/flaskConfig";
import { useState, useRef, useCallback, useEffect } from "react";
import { personalizePhrase } from "../../data/treeCurriculum";

/**
 * A "Listen" button that fetches TTS audio from the Flask /tts endpoint
 * and plays it so the user can hear the correct pronunciation.
 *
 * Props:
 *  - phrase   (string)  – the text to pronounce
 *  - language (string)  – e.g. "Kannada", "Tamil", etc.
 *  - size     (number)  – button diameter in px, default 44
 */
function getTtsText(phrase, displayPhrase) {
  const p = personalizePhrase(phrase);
  const dp = personalizePhrase(displayPhrase);
  let target = p || dp || "";

  // If phrase is English but displayPhrase contains native script (non-ASCII), prefer displayPhrase
  if (p && dp && /^[a-zA-Z0-9\s.,?!'-]+$/.test(p.trim())) {
    if (/[^\p{ASCII}]/u.test(dp)) {
      target = dp;
    }
  }

  const cleaned = target.replace(/\(.*?\)/g, "").trim();
  return cleaned || target;
}

export default function ListenButton({ phrase, displayPhrase, language, size = 44, ariaLabel = 'pronunciation' }) {
  const [state, setState] = useState("idle"); // idle | loading | playing
  const audioRef = useRef(null);
  const blobUrlRef = useRef(null);
  const cachedPhraseRef = useRef(null);

  const phraseToSpeak = getTtsText(phrase, displayPhrase);

  // Stop audio on unmount or navigation
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        try {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        } catch {}
        audioRef.current = null;
      }
      if (blobUrlRef.current) {
        try {
          URL.revokeObjectURL(blobUrlRef.current);
        } catch {}
      }
    };
  }, []);

  const speakNativeBrowserFallback = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(phraseToSpeak);
        const codeMap = {
          kannada: "kn-IN",
          tamil: "ta-IN",
          telugu: "te-IN",
          malayalam: "ml-IN",
          english: "en-IN",
        };
        utter.lang = codeMap[(language || "").toLowerCase()] || "kn-IN";
        utter.rate = 0.85;
        utter.onend = () => setState("idle");
        utter.onerror = () => setState("idle");
        window.speechSynthesis.speak(utter);
        setState("playing");
        return true;
      } catch (e) {
        console.warn("[TTS] speechSynthesis fallback failed:", e);
      }
    }
    return false;
  }, [phraseToSpeak, language]);

  const play = useCallback(async () => {
    // If already playing, stop it
    if (state === "playing") {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setState("idle");
      return;
    }

    setState("loading");

    try {
      // If we already fetched this phrase, reuse the cached blob URL
      if (!blobUrlRef.current || cachedPhraseRef.current !== phraseToSpeak) {
        const primaryUrl = getFlaskUrl();
        const candidateUrls = [primaryUrl, ACTIVE_RENDER_URL].filter(
          (u, idx, arr) => u && arr.indexOf(u) === idx
        );

        let res = null;
        for (const targetUrl of candidateUrls) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 6000);
            const candidateRes = await fetch(`${targetUrl}/tts`, {
              method: "POST",
              headers: { 
                "Content-Type": "application/json", 
                "Bypass-Tunnel-Reminder": "true",
                "ngrok-skip-browser-warning": "true"
              },
              body: JSON.stringify({ phrase: phraseToSpeak, language }),
              signal: controller.signal,
            });
            clearTimeout(timeoutId);

            if (candidateRes.ok) {
              res = candidateRes;
              break;
            }
          } catch (endpointErr) {
            console.warn(`[TTS] Failed calling ${targetUrl}:`, endpointErr.message);
          }
        }

        if (!res) {
          throw new Error("All TTS remote endpoints unreachable");
        }

        if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
        const blob = await res.blob();
        blobUrlRef.current = URL.createObjectURL(blob);
        cachedPhraseRef.current = phraseToSpeak;
      }

      const audio = new Audio(blobUrlRef.current);
      audioRef.current = audio;
      audio.onended = () => setState("idle");
      audio.onerror = () => {
        // If audio decoding failed, try browser speech synthesis fallback
        speakNativeBrowserFallback();
      };
      await audio.play();
      setState("playing");
    } catch (err) {
      console.warn("[TTS] Remote TTS unavailable, attempting browser Web Speech fallback:", err);
      const spoke = speakNativeBrowserFallback();
      if (!spoke) {
        setState("idle");
      }
    }
  }, [phraseToSpeak, language, state, speakNativeBrowserFallback]);

  const icon = state === "loading" ? "⏳" : state === "playing" ? "⏸" : "🔊";
  const label =
    state === "loading"
      ? "Loading…"
      : state === "playing"
        ? "Pause"
        : "Listen";

  return (
    <button
      onClick={play}
      disabled={state === "loading"}
      aria-label={`${label} ${ariaLabel}`}
      title={label}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        border: "1px solid var(--border-default)",
        background:
          state === "playing"
            ? "rgba(46,204,113,0.25)"
            : "var(--bg-elevated)",
        cursor: state === "loading" ? "wait" : "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.42,
        transition: "all 0.2s ease",
        flexShrink: 0,
        boxShadow:
          state === "playing"
            ? "0 0 16px rgba(46,204,113,0.3)"
            : "none",
      }}
      onMouseEnter={(e) => {
        if (state !== "loading")
          e.currentTarget.style.background = "rgba(46,204,113,0.2)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background =
          state === "playing"
            ? "rgba(46,204,113,0.25)"
            : "var(--bg-elevated)";
      }}
    >
      {state === "loading" ? (
        <div
          style={{
            width: size * 0.38,
            height: size * 0.38,
            border: "2px solid var(--border-default)",
            borderTopColor: "#2ecc71",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
      ) : (
        <span style={{ lineHeight: 1 }}>{icon}</span>
      )}
    </button>
  );
}
