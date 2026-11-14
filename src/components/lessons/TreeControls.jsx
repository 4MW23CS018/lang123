import React, { useState } from "react";
import { Plus, Minus, RotateCcw, Maximize2, HelpCircle, X, List, Network } from "lucide-react";

/**
 * TreeControls
 * Floating toolbar providing zoom, pan-reset, layout toggle, and interactive legend.
 */
export default function TreeControls({
  zoom = 1,
  onZoomIn,
  onZoomOut,
  onResetView,
  isMobileMode = false,
  onToggleLayout,
  categoryColor = "#22c55e",
}) {
  const [showLegend, setShowLegend] = useState(false);

  return (
    <>
      {/* Floating Toolbar */}
      <div
        style={{
          position: "absolute",
          bottom: 24,
          right: 24,
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 8px",
          borderRadius: 14,
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-subtle)",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
          backdropFilter: "blur(12px)",
          zIndex: 30,
        }}
      >
        {/* Zoom In */}
        {!isMobileMode && (
          <>
            <button
              onClick={onZoomIn}
              title="Zoom In (+)"
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                border: "1px solid var(--border-subtle)",
                background: "var(--bg-base)",
                color: "var(--text-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-elevated)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-base)")}
            >
              <Plus size={16} />
            </button>

            {/* Current Zoom Percent */}
            <button
              onClick={onResetView}
              title="Reset Zoom to 100%"
              style={{
                height: 34,
                padding: "0 10px",
                borderRadius: 10,
                border: "1px solid var(--border-subtle)",
                background: "var(--bg-base)",
                color: "var(--text-secondary)",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {Math.round(zoom * 100)}%
            </button>

            {/* Zoom Out */}
            <button
              onClick={onZoomOut}
              title="Zoom Out (-)"
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                border: "1px solid var(--border-subtle)",
                background: "var(--bg-base)",
                color: "var(--text-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-elevated)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-base)")}
            >
              <Minus size={16} />
            </button>

            {/* Reset / Center */}
            <button
              onClick={onResetView}
              title="Recenter Canvas"
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                border: "1px solid var(--border-subtle)",
                background: "var(--bg-base)",
                color: "var(--text-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-elevated)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-base)")}
            >
              <Maximize2 size={15} />
            </button>

            <div style={{ width: 1, height: 20, background: "var(--border-subtle)", margin: "0 2px" }} />
          </>
        )}

        {/* Layout Mode Toggle (Tree Canvas vs Linear List) */}
        {onToggleLayout && (
          <button
            onClick={onToggleLayout}
            title={isMobileMode ? "Switch to Interactive Tree Canvas" : "Switch to Branch List View"}
            style={{
              height: 34,
              padding: "0 10px",
              borderRadius: 10,
              border: "1px solid var(--border-subtle)",
              background: isMobileMode ? `${categoryColor}22` : "var(--bg-base)",
              color: isMobileMode ? categoryColor : "var(--text-primary)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {isMobileMode ? <Network size={15} /> : <List size={15} />}
            <span>{isMobileMode ? "Tree Graph" : "List View"}</span>
          </button>
        )}

        {/* Legend Button */}
        <button
          onClick={() => setShowLegend(!showLegend)}
          title="Tree Legend"
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            border: "1px solid var(--border-subtle)",
            background: showLegend ? `${categoryColor}22` : "var(--bg-base)",
            color: showLegend ? categoryColor : "var(--text-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <HelpCircle size={16} />
        </button>
      </div>

      {/* Legend Modal / Popover */}
      {showLegend && (
        <div
          style={{
            position: "absolute",
            bottom: 74,
            right: 24,
            width: 280,
            padding: "16px 18px",
            borderRadius: 16,
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-subtle)",
            boxShadow: "0 12px 32px rgba(0,0,0,0.2)",
            backdropFilter: "blur(14px)",
            zIndex: 35,
            animation: "fadeUp 0.2s ease-out",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
              Tree Map Legend
            </h4>
            <button
              onClick={() => setShowLegend(false)}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                padding: 4,
                display: "flex",
              }}
            >
              <X size={15} />
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 12, height: 12, borderRadius: 4, background: "#22c55e" }} />
              <div>
                <strong style={{ color: "var(--text-primary)" }}>Mastered (Completed):</strong>
                <span style={{ color: "var(--text-secondary)", marginLeft: 4 }}>Scored ≥80% accuracy. Unlocks its branches!</span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 12, height: 12, borderRadius: 4, background: "#f59e0b" }} />
              <div>
                <strong style={{ color: "var(--text-primary)" }}>Start Here / Current:</strong>
                <span style={{ color: "var(--text-secondary)", marginLeft: 4 }}>Your next recommended phrase to practice.</span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 12, height: 12, borderRadius: 4, background: categoryColor }} />
              <div>
                <strong style={{ color: "var(--text-primary)" }}>Available:</strong>
                <span style={{ color: "var(--text-secondary)", marginLeft: 4 }}>Unlocked and ready for pronunciation practice.</span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 12, height: 12, borderRadius: 4, background: "var(--text-muted)", opacity: 0.5 }} />
              <div>
                <strong style={{ color: "var(--text-primary)" }}>Locked:</strong>
                <span style={{ color: "var(--text-secondary)", marginLeft: 4 }}>Complete the connected parent phrase first.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

