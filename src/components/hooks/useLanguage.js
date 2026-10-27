// src/hooks/useLanguage.js
// Drop this in src/hooks/useLanguage.js
// Use this hook anywhere you need the selected language or want to change it.

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

export const SOUTH_INDIAN_LANGUAGES = [
  { code: "kn", label: "Kannada",   script: "ಕನ್ನಡ",   color: "#2ecc71", emoji: "🟢" },
  { code: "ta", label: "Tamil",     script: "தமிழ்",    color: "#818cf8", emoji: "🟣" },
  { code: "te", label: "Telugu",    script: "తెలుగు",   color: "#fb923c", emoji: "🟠" },
  { code: "ml", label: "Malayalam", script: "മലയാളം",   color: "#ec4899", emoji: "🩷" },
  { code: "tcy","label": "Tulu",    script: "ತುಳು",     color: "#34d399", emoji: "🩵" },
  { code: "kfa", label: "Kodava",   script: "ಕೊಡವ",    color: "#facc15", emoji: "🟡" },
];

const LS_KEY = "langbridge_language";

export function useLanguage() {
  const [language, setLanguageState] = useState(
    () => localStorage.getItem(LS_KEY) || "Kannada"
  );
  const userId = localStorage.getItem("userId");
  const savePrefs = useMutation(api.preferences.saveOnboarding);

  const setLanguage = (lang) => {
    localStorage.setItem(LS_KEY, lang);
    setLanguageState(lang);
    // Persist to Convex so it survives across devices
    if (userId) {
      savePrefs({
        userId,
        preferences: JSON.stringify({ selectedLanguage: lang }),
      }).catch(() => {}); // silent fail — localStorage is the source of truth
    }
    // Dispatch a custom event so other components using this hook update too
    window.dispatchEvent(new CustomEvent("langbridge_lang_change", { detail: lang }));
  };

  // Listen for changes from other components / tabs
  useEffect(() => {
    const handler = (e) => setLanguageState(e.detail);
    window.addEventListener("langbridge_lang_change", handler);
    return () => window.removeEventListener("langbridge_lang_change", handler);
  }, []);

  const current = SOUTH_INDIAN_LANGUAGES.find(l => l.label === language)
    || SOUTH_INDIAN_LANGUAGES[0];

  return { language, setLanguage, current, languages: SOUTH_INDIAN_LANGUAGES };
}