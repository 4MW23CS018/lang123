import { useState, useRef, useCallback } from "react";

/**
 * A "Listen" button that fetches TTS audio from the Flask /tts endpoint
 * and plays it so the user can hear the correct pronunciation.
 *
 * Props:
 *  - phrase   (string)  – the text to pronounce
 *  - language (string)  – e.g. "Kannada", "Tamil", etc.
 *  - size     (number)  – button diameter in px, default 44
 */
export default function ListenButton({ phrase, language, size = 44 }) {
  const [state, setState] = useState("idle"); // idle | loading | playing
  const audioRef = useRef(null);
  const blobUrlRef = useRef(null);

  const play = useCallback(async () => {
    // If already playing, stop it
    if (state === "playing" && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setState("idle");
      return;
    }

    setState("loading");

    try {
      // If we already fetched this phrase, reuse the cached blob URL
      if (!blobUrlRef.current) {
        const res = await fetch("http://localhost:5000/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phrase, language }),
        });

        if (!res.ok) throw new Error(`TTS error: ${res.status}`);

        const blob = await res.blob();
        blobUrlRef.current = URL.createObjectURL(blob);
      }

      const audio = new Audio(blobUrlRef.current);
      audioRef.current = audio;
      audio.onended = () => setState("idle");
      audio.onerror = () => setState("idle");
      await audio.play();
      setState("playing");
    } catch (err) {
      console.error("TTS failed:", err);
      setState("idle");
    }
  }, [phrase, language, state]);

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
      aria-label={label}
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
