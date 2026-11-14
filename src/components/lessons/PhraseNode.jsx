import React, { useState } from "react";
import { Check, Lock, Play, Star, Volume2, GitFork, AlertCircle, ChevronRight } from "lucide-react";
import ListenButton from "../speech/ListenButton";

/**
 * PhraseNode
 * Visual card representing a phrase node in the conversational tree.
 * Supports desktop canvas card, compact mode, and mobile branch row.
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

  const status = node.status || "locked";
  const isCompleted = status === "completed";
  const isAvailable = status === "available" || status === "current";
  const isCurrent = status === "current";
  const isLocked = status === "locked";

  const levelLabels = {
    0: "Root Phrase",
    1: "Response",
    2: "Follow-up",
    3: "Deep Follow-up",
  };
  const levelLabel = levelLabels[node.level] || `Level ${node.level ?? 0}`;

  const handleClick = (e) => {
    if (isLocked) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
    if (onClick) {
      onClick(node);
    }
  };

  // Status visual attributes
  const statusConfig = {
    completed: {
      badgeBg: "rgba(34, 197, 94, 0.15)",
      badgeBorder: "rgba(34, 197, 94, 0.35)",
      badgeColor: "#22c55e",
      badgeIcon: Check,
      badgeText: "Mastered",
      cardBorder: isSelected ? "#22c55e" : "rgba(34, 197, 94, 0.3)",
      glow: "0 0 20px rgba(34, 197, 94, 0.25)",
      cardBg: isSelected ? "var(--bg-elevated)" : "var(--bg-surface, var(--bg-elevated))",
    },
    current: {
      badgeBg: "rgba(245, 158, 11, 0.15)",
      badgeBorder: "rgba(245, 158, 11, 0.4)",
      badgeColor: "#f59e0b",
      badgeIcon: Star,
      badgeText: "Start Here",
      cardBorder: isSelected ? "#f59e0b" : "rgba(245, 158, 11, 0.5)",
      glow: "0 0 22px rgba(245, 158, 11, 0.35)",
      cardBg: "var(--bg-elevated)",
    },
    available: {
      badgeBg: `${categoryColor}22`,
      badgeBorder: `${categoryColor}44`,
      badgeColor: categoryColor,
      badgeIcon: Play,
      badgeText: "Available",
      cardBorder: isSelected ? categoryColor : "var(--border-subtle)",
      glow: `0 0 16px ${categoryColor}25`,
      cardBg: "var(--bg-elevated)",
    },
    locked: {
      badgeBg: "rgba(100, 116, 139, 0.12)",
      badgeBorder: "rgba(100, 116, 139, 0.2)",
      badgeColor: "var(--text-muted)",
      badgeIcon: Lock,
      badgeText: "Locked",
      cardBorder: isSelected ? "var(--text-muted)" : "var(--border-subtle)",
      glow: "none",
      cardBg: "var(--bg-base, var(--bg-elevated))",
    },
  };

  const currentCfg = statusConfig[status] || statusConfig.locked;
  const BadgeIcon = currentCfg.badgeIcon;
  const childCount = Array.isArray(node.children) ? node.children.length : 0;

  // --- MOBILE LIST VARIANT ---
  if (variant === "mobile") {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => e.key === "Enter" && handleClick(e)}
        className={shake ? "shake-anim" : ""}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          padding: "16px 18px",
          borderRadius: 16,
          background: isSelected ? "var(--bg-elevated)" : "var(--bg-base)",
          border: `2px solid ${isSelected ? categoryColor : currentCfg.cardBorder}`,
          boxShadow: isSelected ? currentCfg.glow : "0 2px 8px rgba(0,0,0,0.04)",
          opacity: isLocked ? 0.65 : 1,
          cursor: "pointer",
          transition: "all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)",
          position: "relative",
          ...style,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
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

          <div
            onClick={(e) => e.stopPropagation()}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <ListenButton
              phrase={node.phrase}
              displayPhrase={node.displayPhrase}
              language={language}
              size={34}
              ariaLabel={`pronunciation for ${node.phrase}`}
            />
          </div>
        </div>

        <div>
          <h4
            style={{
              margin: "0 0 4px",
              fontSize: 18,
              fontWeight: 700,
              color: isLocked ? "var(--text-secondary)" : "var(--text-primary)",
              lineHeight: 1.3,
            }}
          >
            {node.displayPhrase || node.phrase}
          </h4>
          {node.phonetics && (
            <p style={{ margin: "0 0 4px", fontSize: 13, color: "var(--text-muted)", fontStyle: "italic" }}>
              {node.phonetics}
            </p>
          )}
          <p style={{ margin: 0, fontSize: 14, color: "var(--text-secondary)", fontWeight: 500 }}>
            {node.meaning || node.title}
          </p>
        </div>

        {childCount > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)", paddingTop: 6, borderTop: "1px dashed var(--border-subtle)" }}>
            <GitFork size={13} color={categoryColor} />
            <span>{childCount} {childCount === 1 ? "response branch" : "response branches"}</span>
            <ChevronRight size={14} style={{ marginLeft: "auto", opacity: 0.6 }} />
          </div>
        )}

        {isLocked && node.prerequisite && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#f59e0b", background: "rgba(245, 158, 11, 0.08)", padding: "6px 10px", borderRadius: 8 }}>
            <AlertCircle size={13} />
            <span>Requires: <strong>{node.prerequisite.title}</strong></span>
          </div>
        )}
      </div>
    );
  }

  // --- DESKTOP CANVAS CARD VARIANT ---
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => e.key === "Enter" && handleClick(e)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={shake ? "shake-anim" : ""}
      style={{
        position: "absolute",
        width: 280,
        borderRadius: 18,
        background: isSelected ? "var(--bg-elevated)" : (isLocked ? "var(--bg-base)" : "var(--bg-elevated)"),
        border: `2px solid ${isSelected ? (isCompleted ? "#22c55e" : categoryColor) : currentCfg.cardBorder}`,
        boxShadow: isSelected
          ? currentCfg.glow
          : isHovered
            ? "0 10px 24px rgba(0,0,0,0.12)"
            : "0 4px 12px rgba(0,0,0,0.06)",
        padding: "16px 18px",
        cursor: "pointer",
        transition: "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
        transform: isHovered ? "translateY(-3px) scale(1.015)" : "none",
        opacity: isLocked ? 0.72 : 1,
        userSelect: "none",
        zIndex: isSelected ? 20 : isHovered ? 15 : 10,
        ...style,
      }}
    >
      {/* Selection Glow Indicator */}
      {isSelected && (
        <div
          style={{
            position: "absolute",
            inset: -2,
            borderRadius: 20,
            border: `2px solid ${isCompleted ? "#22c55e" : categoryColor}`,
            pointerEvents: "none",
            animation: "pulseGlow 2s infinite ease-in-out",
          }}
        />
      )}

      {/* Top Header: Status Pill + Level + Audio Button */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
          gap: 6,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
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
          <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600 }}>
            {levelLabel}
          </span>
        </div>

        {/* Quick Pronunciation Audio */}
        <div
          onClick={(e) => e.stopPropagation()}
          title="Listen to pronunciation"
          style={{ display: "flex", alignItems: "center" }}
        >
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
      <div style={{ marginBottom: 6 }}>
        <h4
          style={{
            margin: "0 0 3px",
            fontSize: 20,
            fontWeight: 800,
            color: isLocked ? "var(--text-secondary)" : "var(--text-primary)",
            lineHeight: 1.25,
            letterSpacing: "-0.2px",
          }}
        >
          {node.displayPhrase || node.phrase}
        </h4>

        {/* Phonetics / Transliteration */}
        {node.phonetics && (
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: "var(--text-muted)",
              fontStyle: "italic",
              fontWeight: 500,
            }}
          >
            {node.phonetics}
          </p>
        )}
      </div>

      {/* English Meaning */}
      <p
        style={{
          margin: "0 0 10px",
          fontSize: 13,
          color: "var(--text-secondary)",
          fontWeight: 600,
          lineHeight: 1.35,
        }}
      >
        {node.meaning || node.title}
      </p>

      {/* Footer Details: Prerequisite or Child Branches */}
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
          <div style={{ display: "flex", alignItems: "center", gap: 5, color: categoryColor, fontWeight: 600 }}>
            <GitFork size={13} />
            <span>{childCount} {childCount === 1 ? "branch" : "branches"}</span>
          </div>
        ) : (
          <span style={{ color: "var(--text-faint)", fontStyle: "italic" }}>End of branch</span>
        )}

        {isLocked && node.prerequisite ? (
          <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#f59e0b" }} title={`Requires: ${node.prerequisite.title}`}>
            <AlertCircle size={12} />
            <span style={{ maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              Needs: {node.prerequisite.title}
            </span>
          </div>
        ) : (
          <span style={{ fontSize: 11, color: isCompleted ? "#22c55e" : (isCurrent ? "#f59e0b" : "var(--text-faint)") }}>
            {isCompleted ? "Completed ✓" : (isCurrent ? "Next up →" : "Click to view")}
          </span>
        )}
      </div>
    </div>
  );
}

