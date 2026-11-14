// src/lib/flaskConfig.js

export const DEFAULT_FLASK_URL = "https://curly-buckets-yawn.loca.lt";

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
    } else {
      const cleanUrl = url.trim().replace(/\/$/, "");
      localStorage.setItem("FLASK_URL", cleanUrl);
      console.log("[flaskConfig] Updated Flask URL to:", cleanUrl);
    }
  }
}

// Expose on window for easy updating in browser devtools without touching code:
if (typeof window !== "undefined") {
  window.setFlaskUrl = setFlaskUrl;
  window.getFlaskUrl = getFlaskUrl;
}


