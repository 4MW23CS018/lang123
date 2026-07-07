import { useState, useRef, useEffect } from "react";
import { useLanguage, SOUTH_INDIAN_LANGUAGES } from "../hooks/useLanguage";

export default function LanguageSwitcher() {
  const { current, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 7,
          background: open ? "var(--bg-elevated)" : "transparent",
          border: `1.5px solid ${open ? 'var(--border-strong)' : 'var(--border-default)'}`,
          borderRadius: 10, padding: "6px 12px",
          color: "var(--text-primary)", fontSize: 13, fontWeight: 600,
          cursor: "pointer", transition: "all 0.15s",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "var(--bg-elevated)"}
        onMouseLeave={e => { if (!open) e.currentTarget.style.background = "transparent"; }}>
        <span>{current.emoji}</span>
        <span style={{ color: current.color }}>{current.label}</span>
        <span style={{ color: "var(--text-muted)", fontSize: 10, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s", display: "inline-block" }}>▼</span>
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", right: 0,
          background: "var(--bg-card)", border: "1px solid var(--border-default)",
          borderRadius: 14, padding: 6, width: 210, zIndex: 1000,
          boxShadow: "var(--card-shadow-hover)",
          animation: "dropIn 0.2s cubic-bezier(0.16,1,0.3,1) both",
        }}>
          <p style={{ color: "var(--text-muted)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.2px", padding: "6px 10px 4px", margin: 0 }}>Switch Language</p>
          {SOUTH_INDIAN_LANGUAGES.map(lang => {
            const isActive = lang.label === current.label;
            return (
              <button key={lang.code} onClick={() => { setLanguage(lang.label); setOpen(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 10px", border: "none",
                  background: isActive ? lang.color + "15" : "transparent",
                  borderRadius: 9, cursor: "pointer", transition: "background 0.12s", textAlign: "left",
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "var(--bg-elevated)"; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}>
                <span style={{ fontSize: 15 }}>{lang.emoji}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ color: isActive ? lang.color : "var(--text-primary)", fontSize: 13, fontWeight: isActive ? 700 : 500, margin: 0 }}>{lang.label}</p>
                  <p style={{ color: "var(--text-muted)", fontSize: 11, margin: 0 }}>{lang.script}</p>
                </div>
                {isActive && <span style={{ color: lang.color, fontSize: 14 }}>✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}