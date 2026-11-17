// src/lib/flaskConfig.js

export const DEFAULT_FLASK_URL = "https://bumpy-pandas-shake.loca.lt";

export function getFlaskUrl() {
  if (typeof window !== "undefined") {
    const override = localStorage.getItem("FLASK_URL") || localStorage.getItem("VITE_FLASK_URL");
    if (override && override.trim()) {
      return override.trim().replace(/\/$/, "");
    }
  }
  return (import.meta.env.VITE_FLASK_URL || DEFAULT_FLASK_URL).trim().replace(/\/$/, "");
}

export function setFlaskUrl(url) {
  if (typeof window !== "undefined") {
    if (!url || !url.trim()) {
      localStorage.removeItem("FLASK_URL");
      localStorage.removeItem("VITE_FLASK_URL");
      console.log("[flaskConfig] Reset to default:", DEFAULT_FLASK_URL);
      return DEFAULT_FLASK_URL;
    } else {
      const cleanUrl = url.trim().replace(/\/$/, "");
      localStorage.setItem("FLASK_URL", cleanUrl);
      console.log("[flaskConfig] Updated Flask URL to:", cleanUrl);
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
