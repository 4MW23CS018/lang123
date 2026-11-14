import React, { useState, useRef, useMemo, useEffect, useCallback } from "react";
import PhraseNode from "./PhraseNode";
import TreeConnections from "./TreeConnections";
import TreeControls from "./TreeControls";
import { GitFork, ChevronRight, Sparkles, Lock, Unlock, CheckCircle2, Trophy, Compass } from "lucide-react";

/**
 * Top-Down Conversational Tree Layout
 * Centers parent directly above its children horizontally, and distributes
 * conversation branches down the page just like the hand-drawn architecture sketch.
 */
function computeTopDownTreeLayout(roots, allNodes) {
  const NODE_WIDTH = 250;
  const NODE_HEIGHT = 135;
  const LEVEL_HEIGHT = 180;
  const HORIZONTAL_GAP = 28;
  const ROOT_HORIZONTAL_GAP = 64;

  // 1. Calculate subtree widths bottom-up
  function computeSubtreeWidth(node) {
    if (!node.children || node.children.length === 0) {
      node._subtreeWidth = NODE_WIDTH + HORIZONTAL_GAP;
      return node._subtreeWidth;
    }
    let total = 0;
    for (const child of node.children) {
      total += computeSubtreeWidth(child);
    }
    node._subtreeWidth = Math.max(total, NODE_WIDTH + HORIZONTAL_GAP);
    return node._subtreeWidth;
  }

  for (const root of roots) {
    computeSubtreeWidth(root);
  }

  // 2. Position nodes top-down
  const positions = new Map();

  function assignPositions(node, level, intervalLeft) {
    const y = 40 + level * LEVEL_HEIGHT;
    // Center node within its allocated horizontal interval
    const x = intervalLeft + (node._subtreeWidth - HORIZONTAL_GAP - NODE_WIDTH) / 2;

    positions.set(node.nodeKey, {
      x,
      y,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      level,
    });

    if (node.children && node.children.length > 0) {
      let childLeft = intervalLeft;
      for (const child of node.children) {
        assignPositions(child, level + 1, childLeft);
        childLeft += child._subtreeWidth;
      }
    }
  }

  let currentRootLeft = 40;
  for (const root of roots) {
    assignPositions(root, 0, currentRootLeft);
    currentRootLeft += root._subtreeWidth + ROOT_HORIZONTAL_GAP;
  }

  // 3. Vertical top-to-bottom connections (curves flowing from bottom-center of parent to top-center of child)
  const connections = [];
  for (const node of allNodes) {
    if (node.parentKey && positions.has(node.parentKey) && positions.has(node.nodeKey)) {
      const pPos = positions.get(node.parentKey);
      const cPos = positions.get(node.nodeKey);
      connections.push({
        id: `${node.parentKey}->${node.nodeKey}`,
        fromX: pPos.x + NODE_WIDTH / 2,
        fromY: pPos.y + NODE_HEIGHT,
        toX: cPos.x + NODE_WIDTH / 2,
        toY: cPos.y,
        parentKey: node.parentKey,
        childKey: node.nodeKey,
        status: node.status,
      });
    }
  }

  // 4. Bounding box
  let maxX = 800;
  let maxY = 600;
  for (const pos of positions.values()) {
    maxX = Math.max(maxX, pos.x + pos.width + 80);
    maxY = Math.max(maxY, pos.y + pos.height + 160);
  }

  return { positions, connections, canvasWidth: maxX, canvasHeight: maxY };
}

/**
 * PhraseTree
 * Interactive branching conversational phrase tree flowing from top to bottom.
 * Renders dialogue choices, user name substitution, and milestone locks.
 */
export default function PhraseTree({
  categoryTree,
  selectedNode,
  onSelectNode,
  category,
  language = "Kannada",
  onOpenAiPrompt,
}) {
  const containerRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isMobileMode, setIsMobileMode] = useState(false);

  const roots = categoryTree?.roots || [];
  const allNodes = categoryTree?.allNodes || [];
  const completedCount = categoryTree?.completedCount || 0;
  const totalCount = categoryTree?.totalCount || 0;
  const isMastered = totalCount > 0 && completedCount === totalCount;
  const categoryColor = category?.color || "#22c55e";

  // Check window size on mount and resize to auto-switch mobile mode
  useEffect(() => {
    const checkWidth = () => {
      if (window.innerWidth < 860) {
        setIsMobileMode(true);
      }
    };
    checkWidth();
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, []);

  // Compute top-down graph coordinates
  const { positions, connections, canvasWidth, canvasHeight } = useMemo(() => {
    return computeTopDownTreeLayout(roots, allNodes);
  }, [roots, allNodes]);

  // Recenter / Fit View
  const handleResetView = useCallback(() => {
    setZoom(1);
    // Center horizontally if canvas is wider or narrower than container
    if (containerRef.current) {
      const containerW = containerRef.current.clientWidth || 900;
      const initialX = Math.max(20, (containerW - canvasWidth) / 2);
      setPan({ x: initialX, y: 10 });
    } else {
      setPan({ x: 30, y: 10 });
    }
  }, [canvasWidth]);

  // Center on category change
  useEffect(() => {
    handleResetView();
  }, [category?.id, handleResetView]);

  // Zoom controls
  const handleZoomIn = () => setZoom((z) => Math.min(1.8, +(z + 0.15).toFixed(2)));
  const handleZoomOut = () => setZoom((z) => Math.max(0.4, +(z - 0.15).toFixed(2)));

  // Pan handlers
  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    if (e.target.closest('button, [role="button"]')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Wheel zoom/pan
  const handleWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY * -0.0015;
      setZoom((z) => Math.min(1.8, Math.max(0.4, +(z + delta).toFixed(2))));
    } else {
      setPan((p) => ({
        x: p.x - e.deltaX * 0.7,
        y: p.y - e.deltaY * 0.7,
      }));
    }
  };

  // Breadcrumbs: Trace hierarchy of selected node
  const breadcrumbChain = useMemo(() => {
    if (!selectedNode) return [];
    const chain = [selectedNode];
    let curr = selectedNode;
    while (curr.parentKey) {
      const parent = allNodes.find((n) => n.nodeKey === curr.parentKey);
      if (parent) {
        chain.unshift(parent);
        curr = parent;
      } else {
        break;
      }
    }
    return chain;
  }, [selectedNode, allNodes]);

  // Empty state when category has no phrases
  if (allNodes.length === 0) {
    return (
      <div
        style={{
          minHeight: 460,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 24px",
          background: "var(--bg-elevated)",
          borderRadius: 24,
          border: "1px dashed var(--border-subtle)",
          textAlign: "center",
          margin: "16px 0",
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            background: `${categoryColor}18`,
            color: categoryColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <Compass size={32} />
        </div>
        <h3 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>
          Phrases Coming Soon
        </h3>
        <p style={{ margin: "0 0 24px", maxWidth: 440, fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.5 }}>
          We are currently expanding the <strong>{category?.name}</strong> curriculum for <strong>{language}</strong> with native speakers.
        </p>
        {onOpenAiPrompt && (
          <button
            onClick={onOpenAiPrompt}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 20px",
              borderRadius: 12,
              background: "var(--accent)",
              color: "#fff",
              border: "none",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <Sparkles size={16} />
            <span>Generate Instant Practice with AI</span>
          </button>
        )}
      </div>
    );
  }

  // --- MOBILE / LIST VIEW RENDERING ---
  if (isMobileMode) {
    return (
      <div style={{ position: "relative", margin: "16px 0" }}>
        {/* Mobile Header / Mode Switcher */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
            padding: "8px 14px",
            borderRadius: 14,
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>
            Showing <strong>{allNodes.length}</strong> conversational phrases
          </span>
          <button
            onClick={() => setIsMobileMode(false)}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              background: "var(--bg-base)",
              border: "1px solid var(--border-subtle)",
              color: categoryColor,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            2D Canvas View
          </button>
        </div>

        {/* Hierarchical Mobile List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {roots.map((root) => (
            <div
              key={root.nodeKey}
              style={{
                borderRadius: 20,
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-subtle)",
                padding: "20px 16px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
              }}
            >
              {/* Root Card */}
              <div style={{ marginBottom: 16 }}>
                <PhraseNode
                  node={root}
                  isSelected={selectedNode?.nodeKey === root.nodeKey}
                  onClick={onSelectNode}
                  categoryColor={categoryColor}
                  language={language}
                  variant="mobile"
                />
              </div>

              {/* Children Branches */}
              {root.children && root.children.length > 0 && (
                <div
                  style={{
                    marginLeft: 16,
                    paddingLeft: 16,
                    borderLeft: `2px solid ${categoryColor}33`,
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                  }}
                >
                  {root.children.map((child) => (
                    <div key={child.nodeKey}>
                      <PhraseNode
                        node={child}
                        isSelected={selectedNode?.nodeKey === child.nodeKey}
                        onClick={onSelectNode}
                        categoryColor={categoryColor}
                        language={language}
                        variant="mobile"
                      />

                      {/* Follow-up level 2 */}
                      {child.children && child.children.length > 0 && (
                        <div
                          style={{
                            marginLeft: 14,
                            marginTop: 12,
                            paddingLeft: 14,
                            borderLeft: `2px dashed ${categoryColor}25`,
                            display: "flex",
                            flexDirection: "column",
                            gap: 12,
                          }}
                        >
                          {child.children.map((subChild) => (
                            <div key={subChild.nodeKey}>
                              <PhraseNode
                                node={subChild}
                                isSelected={selectedNode?.nodeKey === subChild.nodeKey}
                                onClick={onSelectNode}
                                categoryColor={categoryColor}
                                language={language}
                                variant="mobile"
                              />

                              {/* Level 3 follow-ups */}
                              {subChild.children && subChild.children.length > 0 && (
                                <div
                                  style={{
                                    marginLeft: 14,
                                    marginTop: 10,
                                    paddingLeft: 14,
                                    borderLeft: `2px dotted ${categoryColor}25`,
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 10,
                                  }}
                                >
                                  {subChild.children.map((level3) => (
                                    <PhraseNode
                                      key={level3.nodeKey}
                                      node={level3}
                                      isSelected={selectedNode?.nodeKey === level3.nodeKey}
                                      onClick={onSelectNode}
                                      categoryColor={categoryColor}
                                      language={language}
                                      variant="mobile"
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Milestone Lock Card for Mobile */}
          <div
            style={{
              padding: "18px 20px",
              borderRadius: 18,
              background: isMastered ? "rgba(34, 197, 94, 0.1)" : "var(--bg-elevated)",
              border: `1.5px solid ${isMastered ? "#22c55e" : "var(--border-subtle)"}`,
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: isMastered ? "#22c55e" : "var(--bg-base)",
                color: isMastered ? "#fff" : "var(--text-muted)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {isMastered ? <Trophy size={22} /> : <Lock size={22} />}
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                {isMastered ? "Branch Mastered!" : "* Unlock all to get more lessons"}
              </h4>
              <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)" }}>
                {completedCount} of {totalCount} phrases completed ({totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%)
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- DESKTOP 2D TOP-DOWN CANVAS RENDERING ---
  return (
    <div
      style={{
        position: "relative",
        margin: "16px 0",
        borderRadius: 24,
        overflow: "hidden",
        border: "1px solid var(--border-subtle)",
        background: "var(--bg-base)",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
      }}
    >
      {/* Canvas Top Bar: Breadcrumb & Mode Switch */}
      <div
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          right: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 25,
          pointerEvents: "none",
        }}
      >
        {/* Breadcrumb Pill */}
        <div
          style={{
            pointerEvents: "auto",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            borderRadius: 12,
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-subtle)",
            backdropFilter: "blur(12px)",
            boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
            fontSize: 13,
            color: "var(--text-secondary)",
          }}
        >
          <span style={{ fontWeight: 700, color: categoryColor }}>{category?.name}</span>
          {breadcrumbChain.map((item, idx) => (
            <React.Fragment key={item.nodeKey}>
              <ChevronRight size={14} style={{ opacity: 0.5 }} />
              <button
                onClick={() => onSelectNode(item)}
                style={{
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  color: idx === breadcrumbChain.length - 1 ? "var(--text-primary)" : "var(--text-muted)",
                  fontWeight: idx === breadcrumbChain.length - 1 ? 700 : 500,
                  cursor: "pointer",
                  maxWidth: 160,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {item.title || item.phrase}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Pan Hint */}
        <div
          style={{
            pointerEvents: "auto",
            fontSize: 12,
            color: "var(--text-muted)",
            background: "var(--bg-elevated)",
            padding: "6px 12px",
            borderRadius: 10,
            border: "1px solid var(--border-subtle)",
            backdropFilter: "blur(8px)",
          }}
        >
          Conversational decision tree • Click phrase to practice
        </div>
      </div>

      {/* Main Interactive Canvas Area */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{
          width: "100%",
          height: 640,
          position: "relative",
          overflow: "hidden",
          cursor: isDragging ? "grabbing" : "grab",
          backgroundImage: `
            radial-gradient(circle at 50% 50%, var(--border-subtle) 1px, transparent 1px)
          `,
          backgroundSize: "28px 28px",
        }}
      >
        {/* Transformable Canvas Layer */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: canvasWidth,
            height: canvasHeight + 100,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
            transition: isDragging ? "none" : "transform 0.1s ease-out",
          }}
        >
          {/* SVG Connections between Nodes */}
          <TreeConnections
            connections={connections}
            width={canvasWidth}
            height={canvasHeight + 100}
            categoryColor={categoryColor}
          />

          {/* Render Phrase Nodes */}
          {allNodes.map((node) => {
            const pos = positions.get(node.nodeKey);
            if (!pos) return null;

            return (
              <PhraseNode
                key={node.nodeKey}
                node={node}
                isSelected={selectedNode?.nodeKey === node.nodeKey}
                onClick={onSelectNode}
                categoryColor={categoryColor}
                language={language}
                variant="card"
                style={{
                  left: pos.x,
                  top: pos.y,
                  width: pos.width,
                }}
              />
            );
          })}

          {/* Milestone Lock at the Bottom: matching the user's handwritten diagram */}
          <div
            style={{
              position: "absolute",
              left: 40,
              top: canvasHeight - 40,
              width: Math.max(320, canvasWidth - 80),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 24px",
                borderRadius: 16,
                background: isMastered ? "rgba(34, 197, 94, 0.15)" : "var(--bg-elevated)",
                border: `1.5px solid ${isMastered ? "#22c55e" : "var(--border-subtle)"}`,
                boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
                backdropFilter: "blur(12px)",
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  background: isMastered ? "#22c55e" : "var(--bg-base)",
                  color: isMastered ? "#fff" : "var(--text-muted)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isMastered ? <Trophy size={20} /> : <Lock size={20} />}
              </div>
              <div>
                <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                  {isMastered ? "🎉 Conversational Milestone Complete!" : "🔒 * unlock all to get more lessons"}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 140, height: 6, background: "var(--bg-base)", borderRadius: 99, overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`,
                        background: isMastered ? "#22c55e" : categoryColor,
                        borderRadius: 99,
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>
                    {completedCount} / {totalCount} Mastered
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Toolbar Controls */}
      <TreeControls
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={handleResetView}
        isMobileMode={isMobileMode}
        onToggleLayout={() => setIsMobileMode(true)}
        categoryColor={categoryColor}
      />
    </div>
  );
}
