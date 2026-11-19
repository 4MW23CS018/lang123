import { useState, useRef, useEffect } from "react";
import { useLanguage, SOUTH_INDIAN_LANGUAGES } from "../hooks/useLanguage";
import { X } from "lucide-react";

export default function LanguageSwitcher() {
  const { current, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 640);
  const ref = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (!isMobile && ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isMobile]);

  // Intercept back gesture / escape key when sheet is open on mobile
  useEffect(() => {
    if (!open) return;
    const handlePop = () => setOpen(false);
    const handleKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("popstate", handlePop, { passive: true });
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("popstate", handlePop);
      window.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          background: open ? "var(--bg-elevated)" : "transparent",
          border: `1.5px solid ${open ? "var(--border-strong)" : "var(--border-default)"}`,
          borderRadius: 10,
          padding: "6px 12px",
          color: "var(--text-primary)",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-elevated)")}
        onMouseLeave={(e) => {
          if (!open) e.currentTarget.style.background = "transparent";
        }}
      >
        <span>{current.emoji}</span>
        <span style={{ color: current.color }}>{current.label}</span>
        <span
          style={{
            color: "var(--text-muted)",
            fontSize: 10,
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.2s",
            display: "inline-block",
          }}
        >
          ▼
        </span>
      </button>

      {open && (
        <>
          {/* Mobile Backdrop Overlay */}
          {isMobile && (
            <div
              onClick={() => setOpen(false)}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0, 0, 0, 0.6)",
                backdropFilter: "blur(4px)",
                WebkitBackdropFilter: "blur(4px)",
                zIndex: 9998,
                animation: "fadeIn 0.2s ease-out",
              }}
            />
          )}

          {/* Menu Container: Desktop Dropdown or Mobile Bottom Sheet */}
          <div
            style={
              isMobile
                ? {
                    position: "fixed",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: "var(--bg-card)",
                    borderTop: "1px solid var(--border-default)",
                    borderRadius: "24px 24px 0 0",
                    padding: "16px 20px 32px",
                    zIndex: 9999,
                    boxShadow: "0 -8px 40px rgba(0, 0, 0, 0.35)",
                    animation: "slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                    maxWidth: 540,
                    margin: "0 auto",
                  }
                : {
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-default)",
                    borderRadius: 16,
                    padding: "10px 12px 12px",
                    width: "min(calc(100vw - 32px), 300px)",
                    zIndex: 1000,
                    boxShadow: "var(--card-shadow-hover), 0 12px 36px rgba(0,0,0,0.2)",
                    animation: "dropIn 0.2s cubic-bezier(0.16,1,0.3,1) both",
                  }
            }
          >
            {/* Mobile Sheet Handle */}
            {isMobile && (
              <div
                style={{
                  width: 38,
                  height: 4,
                  borderRadius: 99,
                  background: "var(--border-default)",
                  margin: "0 auto 14px",
                }}
              />
            )}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: isMobile ? "0 0 14px" : "2px 4px 8px",
                borderBottom: isMobile ? "1px solid var(--border-subtle)" : "none",
                marginBottom: isMobile ? 12 : 0,
              }}
            >
              <div>
                <p
                  style={{
                    color: "var(--text-muted)",
                    fontSize: isMobile ? 12 : 10.5,
                    fontWeight: 750,
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    margin: 0,
                  }}
                >
                  Switch Learning Language
                </p>
                {isMobile && (
                  <p style={{ margin: "2px 0 0", fontSize: 13, fontWeight: 700, color: current.color }}>
                    Active: {current.emoji} {current.label} ({current.script})
                  </p>
                )}
              </div>

              {isMobile ? (
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    border: "1px solid var(--border-subtle)",
                    background: "var(--bg-elevated)",
                    color: "var(--text-secondary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <X size={16} />
                </button>
              ) : (
                <span style={{ fontSize: 11, color: current.color, fontWeight: 700 }}>
                  {current.emoji} {current.label}
                </span>
              )}
            </div>

            {/* Language grid: 3x2 on mobile, 2x3 on desktop - ALL 6 visible without scrolling */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "repeat(3, 1fr)" : "repeat(2, 1fr)",
                gap: isMobile ? 10 : 6,
              }}
            >
              {SOUTH_INDIAN_LANGUAGES.map((lang) => {
                const isActive = lang.label === current.label;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      setLanguage(lang.label);
                      setOpen(false);
                    }}
                    style={{
                      display: "flex",
                      flexDirection: isMobile ? "column" : "row",
                      alignItems: isMobile ? "center" : "center",
                      justifyContent: isMobile ? "center" : "flex-start",
                      gap: isMobile ? 6 : 8,
                      padding: isMobile ? "12px 6px" : "8px 9px",
                      border: isActive ? `2px solid ${lang.color}` : "1px solid var(--border-subtle)",
                      background: isActive ? `${lang.color}18` : "var(--bg-elevated)",
                      borderRadius: 12,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      textAlign: isMobile ? "center" : "left",
                      boxShadow: isActive ? `0 2px 10px ${lang.color}25` : "none",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.background = "var(--bg-card)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.background = "var(--bg-elevated)";
                    }}
                  >
                    <span style={{ fontSize: isMobile ? 22 : 16, flexShrink: 0 }}>{lang.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          color: isActive ? lang.color : "var(--text-primary)",
                          fontSize: isMobile ? 13 : 12.5,
                          fontWeight: isActive ? 800 : 600,
                          margin: 0,
                          lineHeight: 1.2,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {lang.label}
                      </p>
                      <p
                        style={{
                          color: isActive ? lang.color : "var(--text-muted)",
                          fontSize: isMobile ? 11 : 10.5,
                          margin: "2px 0 0",
                          opacity: 0.85,
                          lineHeight: 1,
                        }}
                      >
                        {lang.script}
                      </p>
                    </div>
                    {isActive && (
                      <span style={{ color: lang.color, fontSize: 13, fontWeight: 800 }}>✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
