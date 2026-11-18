// src/lib/flaskConfig.js

export const DEFAULT_FALLBACK_URL = "http://127.0.0.1:5000";

/**
 * Returns the active speech service URL.
 * Automatically picks up VITE_FLASK_URL from .env.production / .env / .env.local.
 * If you update .env.production, it automatically detects the change and clears any stale browser cache.
 */
export function getFlaskUrl() {
  const envUrl = (import.meta.env.VITE_FLASK_URL || "").trim().replace(/\/$/, "");

  if (typeof window !== "undefined") {
    // If the environment variable in .env.production changed, auto-clear stale localStorage override
    const lastEnvUrl = localStorage.getItem("LAST_VITE_FLASK_URL");
    if (envUrl && envUrl !== lastEnvUrl) {
      localStorage.removeItem("FLASK_URL");
      localStorage.setItem("LAST_VITE_FLASK_URL", envUrl);
      return envUrl;
    }

    const override = localStorage.getItem("FLASK_URL");
    if (override && override.trim()) {
      return override.trim().replace(/\/$/, "");
    }
  }

  return envUrl || DEFAULT_FALLBACK_URL;
}

export function setFlaskUrl(url) {
  if (typeof window !== "undefined") {
    const envUrl = (import.meta.env.VITE_FLASK_URL || "").trim().replace(/\/$/, "");
    if (!url || !url.trim() || url === envUrl) {
      localStorage.removeItem("FLASK_URL");
      console.log("[flaskConfig] Using environment URL:", envUrl || DEFAULT_FALLBACK_URL);
      return envUrl || DEFAULT_FALLBACK_URL;
    } else {
      const cleanUrl = url.trim().replace(/\/$/, "");
      localStorage.setItem("FLASK_URL", cleanUrl);
      console.log("[flaskConfig] Updated Flask URL override to:", cleanUrl);
      return cleanUrl;
    }
  }
  return url;
}

export async function testFlaskConnection(targetUrl) {
  const url = (targetUrl || getFlaskUrl()).replace(/\/$/, "");
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(`${url}/health`, {
      method: "GET",
      headers: { "Bypass-Tunnel-Reminder": "true" },
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
