// src/lib/flaskConfig.js

export const DEFAULT_FLASK_URL = "https://mean-doors-love.loca.lt";

export function getFlaskUrl() {
  if (typeof window !== "undefined") {
    const override = localStorage.getItem("FLASK_URL") || localStorage.getItem("VITE_FLASK_URL");
    if (override && override.trim()) {
      return override.trim().replace(/\/$/, "");
    }
  }
  return (import.meta.env.VITE_FLASK_URL || DEFAULT_FLASK_URL).trim().replace(/\/$/, "");
}
