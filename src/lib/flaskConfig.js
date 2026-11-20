// src/lib/flaskConfig.js

export const ACTIVE_NGROK_URL = "https://obedience-retrain-jolliness.ngrok-free.dev";
export const ACTIVE_RENDER_URL = "https://langbridge-speech-backend.onrender.com";
export const ACTIVE_CLOUDFLARE_URL = "https://bruce-sized-opening-emacs.trycloudflare.com";

// Primary is always Ngrok (8 CPU threads on your PC); Secondary is Render (24/7 Cloud)
export const PRIMARY_SERVER_URL = ACTIVE_NGROK_URL;
export const SECONDARY_SERVER_URL = ACTIVE_RENDER_URL;
export const DEFAULT_FALLBACK_URL = PRIMARY_SERVER_URL;

/**
 * Returns the active speech service URL.
 * Defaults to Ngrok as primary; falls back to Render as secondary.
 */
export function getFlaskUrl() {
  if (typeof window !== "undefined") {
    const override = localStorage.getItem("FLASK_URL");
    if (override && override.trim()) {
      const clean = override.trim().replace(/[/\\]+$/, "");

      // If user specifically picked Render or Cloudflare or a custom URL, respect it
      if (clean === ACTIVE_RENDER_URL || clean === ACTIVE_CLOUDFLARE_URL) {
        return clean;
      }

      // If user had an old localhost or old temporary tunnel in storage, clear it out
      if (
        (window.location.protocol === "https:" && (clean.includes("127.0.0.1") || clean.includes("localhost"))) ||
        clean.includes("trycloudflare.com") ||
        clean.includes("loca.lt")
      ) {
        localStorage.removeItem("FLASK_URL");
        return PRIMARY_SERVER_URL;
      }

      return clean;
    }
  }

  // If environment variable explicitly specifies a non-render custom url, use it; otherwise ALWAYS default to Ngrok as primary!
  const envUrl = (import.meta.env.VITE_FLASK_URL || "").trim().replace(/[/\\]+$/, "");
  if (envUrl && !envUrl.includes("onrender.com") && !envUrl.includes("127.0.0.1")) {
    return envUrl;
  }

  return PRIMARY_SERVER_URL;
}

export function setFlaskUrl(url) {
  if (typeof window !== "undefined") {
    if (!url || !url.trim() || url === PRIMARY_SERVER_URL) {
      localStorage.removeItem("FLASK_URL");
      console.log("[flaskConfig] Using primary URL:", PRIMARY_SERVER_URL);
      return PRIMARY_SERVER_URL;
    } else {
      const cleanUrl = url.trim().replace(/[/\\]+$/, "");
      localStorage.setItem("FLASK_URL", cleanUrl);
      console.log("[flaskConfig] Updated Flask URL override to:", cleanUrl);
      return cleanUrl;
    }
  }
  return url;
}

export async function testFlaskConnection(targetUrl) {
  const url = (targetUrl || getFlaskUrl()).replace(/[/\\]+$/, "");
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(`${url}/health`, {
      method: "GET",
      headers: { 
        "Bypass-Tunnel-Reminder": "true",
        "ngrok-skip-browser-warning": "true"
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const latency = Date.now() - start;
    if (res.ok) {
      return { ok: true, status: res.status, latency, url };
    }
    return { ok: false, status: res.status, latency, url, error: `HTTP ${res.status}` };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      latency: Date.now() - start,
      url,
      error: err.name === "AbortError" ? "Timed out (6s)" : (err.message || "Network error / Offline"),
    };
  }
}

// Expose on window for easy updating in browser devtools without touching code:
if (typeof window !== "undefined") {
  window.setFlaskUrl = setFlaskUrl;
  window.getFlaskUrl = getFlaskUrl;
  window.testFlaskConnection = testFlaskConnection;
}
