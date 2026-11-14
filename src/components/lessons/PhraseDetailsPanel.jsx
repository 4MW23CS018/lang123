import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  X,
  Play,
  CheckCircle2,
  Lock,
  GitFork,
  ArrowRight,
  ArrowLeft,
  Volume2,
  ShieldCheck,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import ListenButton from "../speech/ListenButton";

/**
 * PhraseDetailsPanel
 * Slide-over drawer / bottom-sheet detailing the selected phrase node.
 * Features native audio, contextual usage hints, branch previews, and direct practice navigation.
 */
export default function PhraseDetailsPanel({
  node,
  onClose,
  onSelectNode,
  category,
  language = "Kannada",
  allNodes = [],
}) {
  const navigate = useNavigate();

  if (!node) return null;

  const status = node.status || "locked";
  const isCompleted = status === "completed";
  const isLocked = status === "locked";
  const isAvailable = status === "available" || status === "current";

  const categoryColor = category?.color || "#22c55e";

  const levelNames = {
    0: "Root Phrase (Level 0)",
    1: "Conversational Response (Level 1)",
    2: "Follow-up Question (Level 2)",
    3: "Deep Branch (Level 3)",
  };
  const levelText = levelNames[node.level] || `Level ${node.level ?? 0}`;

  // Find parent node object if applicable
  const parentNode = node.parentKey
    ? allNodes.find((n) => n.nodeKey === node.parentKey)
    : null;

  // Resolve target route ID for practice
  const practiceTargetId = node.dbLessonId || node._id || node.nodeKey;

  const handleStartPractice = () => {
    navigate(`/practice/${practiceTargetId}`);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        width: "100%",
        maxWidth: 440,
        background: "var(--bg-elevated)",
        borderLeft: "1px solid var(--border-subtle)",
        boxShadow: "-8px 0 32px rgba(0, 0, 0, 0.25)",
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        animation: "slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* Drawer Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 24px",
          borderBottom: "1px solid var(--border-subtle)",
          position: "sticky",
          top: 0,
          background: "var(--bg-elevated)",
          backdropFilter: "blur(12px)",
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: categoryColor,
              boxShadow: `0 0 8px ${categoryColor}`,
            }}
          />
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
              {category?.name || "Curriculum"}
            </h3>
            <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)" }}>
              {levelText}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          aria-label="Close details"
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            border: "1px solid var(--border-subtle)",
            background: "var(--bg-base)",
            color: "var(--text-secondary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
        >
          <X size={18} />
        </button>
      </div>

      {/* Drawer Body */}
      <div style={{ padding: "24px", flex: 1, display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Main Phrase Card */}
        <div
          style={{
            padding: "24px",
            borderRadius: 20,
            background: "var(--bg-base)",
            border: `2px solid ${isCompleted ? "#22c55e44" : categoryColor + "33"}`,
            boxShadow: `0 8px 24px ${categoryColor}15`,
            position: "relative",
          }}
        >
          {/* Status Badge */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                padding: "4px 10px",
                borderRadius: 999,
                background: isCompleted
                  ? "rgba(34, 197, 94, 0.15)"
                  : isAvailable
                    ? `${categoryColor}22`
                    : "rgba(100, 116, 139, 0.15)",
                color: isCompleted ? "#22c55e" : isAvailable ? categoryColor : "var(--text-muted)",
                border: `1px solid ${isCompleted ? "#22c55e44" : isAvailable ? categoryColor + "44" : "var(--border-subtle)"}`,
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              {isCompleted ? <CheckCircle2 size={13} /> : isLocked ? <Lock size={13} /> : <Play size={13} />}
              {isCompleted ? "Mastered (≥80%)" : isLocked ? "Locked" : "Ready to Practice"}
            </span>

            {/* Pronunciation Audio */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ListenButton
                phrase={node.phrase}
                displayPhrase={node.displayPhrase}
                language={language}
                size={40}
                ariaLabel={`Pronounce ${node.phrase}`}
              />
            </div>
          </div>

          {/* Native Script */}
          <h2
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: "var(--text-primary)",
              margin: "0 0 6px",
              lineHeight: 1.25,
              letterSpacing: "-0.5px",
            }}
          >
            {node.displayPhrase || node.phrase}
          </h2>

          {/* Phonetics / Transliteration */}
          {node.phonetics && (
            <p
              style={{
                fontSize: 15,
                color: "var(--text-muted)",
                fontStyle: "italic",
                margin: "0 0 12px",
                fontWeight: 500,
              }}
            >
              {node.phonetics}
            </p>
          )}

          {/* English Meaning */}
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-subtle)",
              marginBottom: 14,
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: 2 }}>
              English Meaning
            </span>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>
              {node.meaning || node.title}
            </p>
          </div>

          {/* Context / When to use */}
          {node.context && (
            <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, display: "flex", alignItems: "flex-start", gap: 8 }}>
              <Sparkles size={16} color={categoryColor} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong style={{ color: "var(--text-primary)" }}>When to use: </strong>
                {node.context}
              </div>
            </div>
          )}

          {/* Authentic Review Badge (for minority/indigenous languages) */}
          {node.contentReviewStatus === "verified" && (
            <div
              style={{
                marginTop: 12,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 10px",
                borderRadius: 8,
                background: "rgba(14, 165, 233, 0.1)",
                border: "1px solid rgba(14, 165, 233, 0.25)",
                color: "#0284c7",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              <ShieldCheck size={13} />
              <span>Verified Authentic Native Curriculum</span>
            </div>
          )}
        </div>

        {/* Action Button: Start Practice or Prerequisite Warning */}
        {isLocked ? (
          <div
            style={{
              padding: "18px 20px",
              borderRadius: 16,
              background: "rgba(245, 158, 11, 0.08)",
              border: "1px solid rgba(245, 158, 11, 0.3)",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <AlertCircle size={20} color="#f59e0b" style={{ flexShrink: 0 }} />
              <div>
                <h4 style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 700, color: "#f59e0b" }}>
                  Phrase Locked
                </h4>
                <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>
                  Complete the parent phrase with at least <strong>80% pronunciation accuracy</strong> to unlock this response.
                </p>
              </div>
            </div>

            {parentNode && (
              <button
                onClick={() => onSelectNode && onSelectNode(parentNode)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  transition: "background 0.15s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <ArrowLeft size={15} color={categoryColor} />
                  <span>Go to Parent: <strong>{parentNode.title || parentNode.phrase}</strong></span>
                </div>
                <ArrowRight size={14} style={{ opacity: 0.5 }} />
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={handleStartPractice}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              padding: "16px 24px",
              borderRadius: 16,
              background: isCompleted
                ? "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
                : `linear-gradient(135deg, ${categoryColor} 0%, #059669 100%)`,
              color: "#fff",
              border: "none",
              fontSize: 16,
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: `0 8px 24px ${categoryColor}40`,
              transition: "transform 0.18s ease, box-shadow 0.18s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = `0 12px 28px ${categoryColor}60`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = `0 8px 24px ${categoryColor}40`;
            }}
          >
            <Play size={18} fill="#fff" />
            <span>{isCompleted ? "Practice Again" : "Start Pronunciation Practice"}</span>
            <ArrowRight size={18} />
          </button>
        )}

        {/* Conversational Hierarchy: Parent Connection */}
        {parentNode && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
              Parent Phrase (Conversation Origin)
            </span>
            <div
              role="button"
              tabIndex={0}
              onClick={() => onSelectNode && onSelectNode(parentNode)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 14px",
                borderRadius: 14,
                background: "var(--bg-base)",
                border: "1px solid var(--border-subtle)",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = categoryColor)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-subtle)")}
            >
              <div>
                <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                  {parentNode.phrase}
                </p>
                <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)" }}>
                  {parentNode.meaning || parentNode.title}
                </p>
              </div>
              <ArrowLeft size={16} color="var(--text-muted)" />
            </div>
          </div>
        )}

        {/* Branching Options: Child Responses */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <GitFork size={15} color={categoryColor} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                Conversational Responses ({node.children?.length || 0})
              </span>
            </div>
          </div>

          {node.children && node.children.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {node.children.map((child) => {
                const childStatus = child.status || (child.isCompleted ? "completed" : child.isUnlocked ? "available" : "locked");
                const childLocked = childStatus === "locked";
                return (
                  <div
                    key={child.nodeKey}
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectNode && onSelectNode(child)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 16px",
                      borderRadius: 14,
                      background: "var(--bg-base)",
                      border: "1px solid var(--border-subtle)",
                      cursor: "pointer",
                      opacity: childLocked ? 0.7 : 1,
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = categoryColor;
                      e.currentTarget.style.transform = "translateX(3px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--border-subtle)";
                      e.currentTarget.style.transform = "none";
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0, paddingRight: 10 }}>
                      <p style={{ margin: "0 0 2px", fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
                        {child.phrase}
                      </p>
                      <p style={{ margin: 0, fontSize: 12, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {child.meaning || child.title}
                      </p>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {child.isCompleted ? (
                        <CheckCircle2 size={16} color="#22c55e" />
                      ) : childLocked ? (
                        <Lock size={15} color="var(--text-muted)" />
                      ) : (
                        <Play size={14} color={categoryColor} />
                      )}
                      <ArrowRight size={14} color="var(--text-muted)" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              style={{
                padding: "18px",
                borderRadius: 14,
                background: "var(--bg-base)",
                border: "1px dashed var(--border-subtle)",
                textAlign: "center",
                color: "var(--text-muted)",
                fontSize: 13,
              }}
            >
              This is a terminal phrase in this conversational branch.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

