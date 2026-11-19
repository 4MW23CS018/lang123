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
          position: "absolute",
          top: "calc(100% + 8px)",
          right: 0,
          background: "var(--bg-card)",
          border: "1px solid var(--border-default)",
          borderRadius: 16,
          padding: "10px 12px 12px",
          width: "min(calc(100vw - 32px), 290px)",
          zIndex: 1000,
          boxShadow: "var(--card-shadow-hover), 0 12px 36px rgba(0,0,0,0.2)",
          animation: "dropIn 0.2s cubic-bezier(0.16,1,0.3,1) both",
        }}>
          <p style={{
            color: "var(--text-muted)",
            fontSize: 10.5,
            fontWeight: 750,
            textTransform: "uppercase",
            letterSpacing: "1px",
            padding: "2px 4px 8px",
            margin: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <span>Switch Language</span>
            <span style={{ fontSize: 11, color: current.color, fontWeight: 700 }}>
              {current.emoji} {current.label}
            </span>
          </p>

          {/* 2-column grid: all 6 languages visible instantly without vertical scrolling */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 6,
          }}>
            {SOUTH_INDIAN_LANGUAGES.map(lang => {
              const isActive = lang.label === current.label;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => { setLanguage(lang.label); setOpen(false); }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 9px",
                    border: isActive ? `1.5px solid ${lang.color}` : "1px solid var(--border-subtle)",
                    background: isActive ? `${lang.color}18` : "var(--bg-elevated)",
                    borderRadius: 10,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    textAlign: "left",
                    boxShadow: isActive ? `0 2px 8px ${lang.color}25` : "none",
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "var(--bg-card)"; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "var(--bg-elevated)"; }}
                >
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{lang.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      color: isActive ? lang.color : "var(--text-primary)",
                      fontSize: 12.5,
                      fontWeight: isActive ? 800 : 600,
                      margin: 0,
                      lineHeight: 1.2,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}>
                      {lang.label}
                    </p>
                    <p style={{
                      color: isActive ? lang.color : "var(--text-muted)",
                      fontSize: 10.5,
                      margin: "2px 0 0",
                      opacity: 0.8,
                      lineHeight: 1,
                    }}>
                      {lang.script}
                    </p>
                  </div>
                  {isActive && <span style={{ color: lang.color, fontSize: 12, fontWeight: 800 }}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}