import React, { useState, useRef } from "react";
import { Check, Lock, Play, Star, GitFork, AlertCircle, Sparkles } from "lucide-react";
import ListenButton from "../speech/ListenButton";

/**
 * PhraseNode
 * Renders phrase lessons as interactive game-like milestone shapes.
 * Instead of showing the entire text on screen, nodes appear as compact shapes.
 * - Unlocked nodes: Hovering reveals the complete phrase details (native script, phonetics, translation, audio).
 * - Locked nodes: Hovering does NOT show what is there (phrase content is hidden and protected).
 */
export default function PhraseNode({
  node,
  isSelected = false,
  onClick,
  categoryColor = "#22c55e",
  language = "Kannada",
  variant = "card", // "card" | "mobile"
  style = {},
}) {
  const [shake, setShake] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef(null);

  const status = node.status || "locked";
  const isCompleted = status === "completed";
  const isAvailable = status === "available" || status === "current";
  const isCurrent = status === "current";
  const isLocked = status === "locked";

  const levelLabels = {
    0: "Root Phrase",
    1: "Response",
    2: "Follow-up",
    3: "Deep Branch",
  };
  const levelLabel = levelLabels[node.level] || `Level ${node.level ?? 0}`;

  const handleClick = (e) => {
    e.stopPropagation();
    if (isLocked) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return; // Do NOT reveal or open locked phrases
    }
    if (onClick) {
      onClick(node);
    }
  };

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 120);
  };

  // Status visual attributes for the shape
  const statusConfig = {
    completed: {
      shapeBg: "linear-gradient(135deg, #22c55e 0%, #15803d 100%)",
      shapeBorder: "3px solid #86efac",
      glow: "0 0 20px rgba(34, 197, 94, 0.45)",
      badgeBg: "rgba(34, 197, 94, 0.15)",
      badgeBorder: "rgba(34, 197, 94, 0.35)",
      badgeColor: "#22c55e",
      badgeIcon: Check,
      badgeText: "Mastered",
      iconColor: "#ffffff",
    },
    current: {
      shapeBg: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
      shapeBorder: "3px solid #fef08a",
      glow: "0 0 24px rgba(245, 158, 11, 0.65)",
      badgeBg: "rgba(245, 158, 11, 0.15)",
      badgeBorder: "rgba(245, 158, 11, 0.4)",
      badgeColor: "#f59e0b",
      badgeIcon: Star,
      badgeText: "Start Here",
      iconColor: "#ffffff",
    },
    available: {
      shapeBg: `linear-gradient(135deg, ${categoryColor} 0%, ${categoryColor}cc 100%)`,
      shapeBorder: "3px solid rgba(255, 255, 255, 0.6)",
      glow: `0 0 18px ${categoryColor}40`,
      badgeBg: `${categoryColor}22`,
      badgeBorder: `${categoryColor}44`,
      badgeColor: categoryColor,
      badgeIcon: Play,
      badgeText: "Available",
      iconColor: "#ffffff",
    },
    locked: {
      shapeBg: "linear-gradient(135deg, var(--bg-elevated) 0%, var(--bg-base) 100%)",
      shapeBorder: "2px dashed var(--border-subtle)",
      glow: "none",
      badgeBg: "rgba(100, 116, 139, 0.12)",
      badgeBorder: "rgba(100, 116, 139, 0.2)",
      badgeColor: "var(--text-muted)",
      badgeIcon: Lock,
      badgeText: "Locked",
      iconColor: "var(--text-muted)",
    },
  };

  const currentCfg = statusConfig[status] || statusConfig.locked;
  const BadgeIcon = currentCfg.badgeIcon;
  const childCount = Array.isArray(node.children) ? node.children.length : 0;

  // Render the core shape icon
  const renderShapeIcon = () => {
    if (isCompleted) {
      return <Check size={28} color="#ffffff" strokeWidth={3} />;
    }
    if (isCurrent) {
      return <Star size={26} color="#ffffff" fill="#ffffff" />;
    }
    if (isAvailable) {
      return <Play size={24} color="#ffffff" fill="#ffffff" style={{ marginLeft: 3 }} />;
    }
    return <Lock size={22} color="var(--text-muted)" />;
  };

  // ── HOVER POPOVER CARD ──
  // Only rendered if isHovered AND !isLocked!
  // Locked nodes strictly DO NOT show what is there.
  const renderHoverCard = (placement = "above") => {
    if (!isHovered) return null;

    // LOCKED HOVER: Never show the phrase, phonetics, translation or audio!
    if (isLocked) {
      return (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 10px)",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(15, 23, 42, 0.95)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 12,
            padding: "8px 14px",
            fontSize: 12,
            fontWeight: 700,
            color: "var(--text-muted)",
            whiteSpace: "nowrap",
            zIndex: 1000,
            pointerEvents: "none",
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            gap: 6,
            backdropFilter: "blur(12px)",
            animation: "fadeUp 0.15s ease-out",
          }}
        >
          <Lock size={13} color="#f59e0b" />
          <span>Locked &bull; Complete previous step to unlock</span>
        </div>
      );
    }

    // UNLOCKED HOVER: Reveals what is there!
    const isAbove = placement === "above";

    return (
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={(e) => {
          e.stopPropagation();
          if (onClick) onClick(node);
        }}
        style={{
          position: "absolute",
          ...(isAbove ? { bottom: "calc(100% + 14px)" } : { top: "calc(100% + 14px)" }),
          left: "50%",
          transform: "translateX(-50%)",
          width: 300,
          background: "var(--bg-elevated)",
          border: `2px solid ${isCompleted ? "#22c55e" : isCurrent ? "#f59e0b" : categoryColor}`,
          borderRadius: 20,
          boxShadow: "0 18px 45px rgba(0, 0, 0, 0.35)",
          backdropFilter: "blur(16px)",
          padding: "16px 18px",
          zIndex: 1000,
          pointerEvents: "auto",
          textAlign: "left",
          cursor: "pointer",
          animation: isAbove
            ? "fadeUp 0.18s cubic-bezier(0.16, 1, 0.3, 1)"
            : "fadeDown 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Header: Status badge, level label, and listen button */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                padding: "3px 8px",
                borderRadius: 999,
                background: currentCfg.badgeBg,
                color: currentCfg.badgeColor,
                border: `1px solid ${currentCfg.badgeBorder}`,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <BadgeIcon size={11} />
              {currentCfg.badgeText}
            </span>
            <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>
              {levelLabel}
            </span>
          </div>

          <div onClick={(e) => e.stopPropagation()} title="Listen to pronunciation">
            <ListenButton
              phrase={node.phrase}
              displayPhrase={node.displayPhrase}
              language={language}
              size={32}
              ariaLabel={`pronunciation for ${node.phrase}`}
            />
          </div>
        </div>

        {/* Native Phrase */}
        <div style={{ marginBottom: 4 }}>
          <h4
            style={{
              margin: "0 0 3px",
              fontSize: 20,
              fontWeight: 800,
              color: "var(--text-primary)",
              lineHeight: 1.25,
              letterSpacing: "-0.2px",
            }}
          >
            {node.displayPhrase || node.phrase}
          </h4>

          {node.phonetics && (
            <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)", fontStyle: "italic", fontWeight: 500 }}>
              {node.phonetics}
            </p>
          )}
        </div>

        {/* English Meaning */}
        <p style={{ margin: "6px 0 12px", fontSize: 13, color: "var(--text-secondary)", fontWeight: 600, lineHeight: 1.35 }}>
          {node.meaning || node.title}
        </p>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 8,
            borderTop: "1px dashed var(--border-subtle)",
            fontSize: 11,
            color: "var(--text-muted)",
          }}
        >
          {childCount > 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: 4, color: categoryColor, fontWeight: 700 }}>
              <GitFork size={12} />
              <span>{childCount} {childCount === 1 ? "response" : "responses"}</span>
            </div>
          ) : (
            <span style={{ color: "var(--text-faint)", fontStyle: "italic" }}>End of branch</span>
          )}

          <span
            style={{
              color: isCompleted ? "#22c55e" : isCurrent ? "#f59e0b" : "#0ea5e9",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            Click to practice →
          </span>
        </div>

        {/* Arrow Pointer */}
        <div
          style={{
            position: "absolute",
            ...(isAbove ? { bottom: -7 } : { top: -7 }),
            left: "50%",
            transform: "translateX(-50%) rotate(45deg)",
            width: 12,
            height: 12,
            background: "var(--bg-elevated)",
            ...(isAbove
              ? {
                  borderRight: `2px solid ${isCompleted ? "#22c55e" : isCurrent ? "#f59e0b" : categoryColor}`,
                  borderBottom: `2px solid ${isCompleted ? "#22c55e" : isCurrent ? "#f59e0b" : categoryColor}`,
                }
              : {
                  borderLeft: `2px solid ${isCompleted ? "#22c55e" : isCurrent ? "#f59e0b" : categoryColor}`,
                  borderTop: `2px solid ${isCompleted ? "#22c55e" : isCurrent ? "#f59e0b" : categoryColor}`,
                }),
          }}
        />
      </div>
    );
  };

  // ── VARIANT 1: HIERARCHICAL LIST / BRANCH ROW ──
  if (variant === "mobile") {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => e.key === "Enter" && handleClick(e)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={shake ? "shake-anim" : ""}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "12px 16px",
          borderRadius: 20,
          background: isSelected ? "var(--bg-elevated)" : "var(--bg-base)",
          border: `2px solid ${isSelected ? (isCompleted ? "#22c55e" : categoryColor) : currentCfg.badgeBorder}`,
          boxShadow: isSelected ? currentCfg.glow : isHovered ? "0 8px 24px rgba(0,0,0,0.08)" : "0 2px 8px rgba(0,0,0,0.02)",
          cursor: isLocked ? "not-allowed" : "pointer",
          transition: "all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)",
          position: "relative",
          userSelect: "none",
          ...style,
        }}
      >
        {/* Interactive Shape Orb */}
        <div
          style={{
            position: "relative",
            width: 54,
            height: 54,
            borderRadius: "50%",
            background: currentCfg.shapeBg,
            border: currentCfg.shapeBorder,
            boxShadow: isCurrent ? currentCfg.glow : isHovered && !isLocked ? currentCfg.glow : "0 4px 12px rgba(0,0,0,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transform: isHovered && !isLocked ? "scale(1.08)" : "scale(1)",
            transition: "transform 0.18s ease, box-shadow 0.18s ease",
            animation: isCurrent ? "pulseGlow 2.2s infinite ease-in-out" : "none",
          }}
        >
          {renderShapeIcon()}

          {/* Floating START Ribbon for Current Node */}
          {isCurrent && (
            <div
              style={{
                position: "absolute",
                top: -8,
                background: "#f59e0b",
                color: "#ffffff",
                fontSize: 9,
                fontWeight: 900,
                letterSpacing: "0.5px",
                padding: "2px 6px",
                borderRadius: 99,
                boxShadow: "0 2px 6px rgba(245, 158, 11, 0.5)",
                textTransform: "uppercase",
              }}
            >
              START
            </div>
          )}
        </div>

        {/* Compact Info Bar (Notice: Entire text is NOT shown here, only status/level) */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                padding: "2px 8px",
                borderRadius: 999,
                background: currentCfg.badgeBg,
                color: currentCfg.badgeColor,
                border: `1px solid ${currentCfg.badgeBorder}`,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <BadgeIcon size={10} />
              {currentCfg.badgeText}
            </span>
            <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 700 }}>
              {levelLabel}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {isLocked ? (
              <span style={{ fontSize: 13, color: "var(--text-muted)", fontStyle: "italic", display: "flex", alignItems: "center", gap: 5 }}>
                <Lock size={12} />
                Locked &bull; Complete previous step to unlock
              </span>
            ) : (
              <span style={{ fontSize: 13, color: isHovered ? "var(--text-primary)" : "var(--text-secondary)", fontWeight: 600 }}>
                {isCompleted ? "Mastered phrase" : isCurrent ? "Next up on your path" : "Ready to practice"} &bull;{" "}
                <span style={{ color: categoryColor, textDecoration: "underline", textUnderlineOffset: 3 }}>
                  Hover to view phrase
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Branch Counter on the Right */}
        {childCount > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: 12,
              color: isLocked ? "var(--text-muted)" : categoryColor,
              fontWeight: 700,
              background: "var(--bg-elevated)",
              padding: "6px 10px",
              borderRadius: 10,
              border: "1px solid var(--border-subtle)",
              flexShrink: 0,
            }}
          >
            <GitFork size={13} />
            <span>{childCount} {childCount === 1 ? "branch" : "branches"}</span>
          </div>
        )}

        {/* Popover revealing what is there when hovered (unlocked only) */}
        {renderHoverCard(node.level === 0 ? "below" : "above")}
      </div>
    );
  }

  // ── VARIANT 2: 2D CANVAS SHAPE NODE ──
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => e.key === "Enter" && handleClick(e)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={shake ? "shake-anim" : ""}
      style={{
        position: "absolute",
        width: 64,
        height: 64,
        borderRadius: "50%",
        background: currentCfg.shapeBg,
        border: currentCfg.shapeBorder,
        boxShadow: isSelected
          ? currentCfg.glow
          : isCurrent
            ? currentCfg.glow
            : isHovered && !isLocked
              ? currentCfg.glow
              : "0 6px 18px rgba(0,0,0,0.18)",
        cursor: isLocked ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        userSelect: "none",
        zIndex: isSelected ? 30 : isHovered ? 25 : 10,
        transform: isHovered && !isLocked ? "scale(1.12)" : "scale(1)",
        transition: "transform 0.18s ease, box-shadow 0.18s ease",
        animation: isCurrent ? "pulseGlow 2.2s infinite ease-in-out" : "none",
        ...style,
      }}
    >
      {/* Core Shape Icon */}
      {renderShapeIcon()}

      {/* Floating START Badge for Current Node */}
      {isCurrent && (
        <div
          style={{
            position: "absolute",
            top: -10,
            background: "#f59e0b",
            color: "#ffffff",
            fontSize: 9,
            fontWeight: 900,
            letterSpacing: "0.5px",
            padding: "2px 7px",
            borderRadius: 99,
            boxShadow: "0 2px 6px rgba(245, 158, 11, 0.5)",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >
          START
        </div>
      )}

      {/* Popover revealing what is there when hovered (unlocked only) */}
      {renderHoverCard(node.level === 0 ? "below" : "above")}
    </div>
  );
}
