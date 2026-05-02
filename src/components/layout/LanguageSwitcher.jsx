// src/components/LanguageSwitcher.jsx
// Place this in your Navbar — it drops down over the page content.

import { useState, useRef, useEffect } from "react";
import { useLanguage, SOUTH_INDIAN_LANGUAGES } from "../hooks/useLanguage";

export default function LanguageSwitcher() {
  const { current, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: "8px",
          background: open ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
          border: `1px solid ${open ? current.color + "50" : "rgba(255,255,255,0.1)"}`,
          borderRadius: "10px", padding: "7px 12px",
          color: "#fff", fontSize: "13px", fontWeight: "600",
          cursor: "pointer", transition: "all 0.15s",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
        onMouseLeave={e => { if (!open) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
      >
        <span>{current.emoji}</span>
        <span style={{ color: current.color }}>{current.label}</span>
        <span style={{ color: "#6b7280", fontSize: "10px", marginLeft: "2px", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s", display: "inline-block" }}>▼</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0,
          background: "rgba(15,15,20,0.97)",
          backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "14px", padding: "6px",
          width: "200px", zIndex: 1000,
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
          animation: "dropIn 0.15s ease",
        }}>
          <p style={{ color: "#4b5563", fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", padding: "6px 10px 4px", margin: 0 }}>
            Switch Language
          </p>
          {SOUTH_INDIAN_LANGUAGES.map(lang => {
            const isActive = lang.label === current.label;
            return (
              <button
                key={lang.code}
                onClick={() => { setLanguage(lang.label); setOpen(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  width: "100%", padding: "9px 10px", border: "none",
                  background: isActive ? lang.color + "15" : "transparent",
                  borderRadius: "9px", cursor: "pointer", transition: "background 0.12s",
                  textAlign: "left",
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ fontSize: "15px" }}>{lang.emoji}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ color: isActive ? lang.color : "#d1d5db", fontSize: "13px", fontWeight: isActive ? "700" : "500", margin: 0 }}>{lang.label}</p>
                  <p style={{ color: "#6b7280", fontSize: "11px", margin: 0 }}>{lang.script}</p>
                </div>
                {isActive && <span style={{ color: lang.color, fontSize: "14px" }}>✓</span>}
              </button>
            );
          })}
        </div>
      )}
      <style>{`@keyframes dropIn { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:none; } }`}</style>
    </div>
  );
}