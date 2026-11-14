import React from "react";

/**
 * TreeConnections
 * Renders SVG cubic bezier curves between parent and child nodes in a top-down vertical tree.
 * Curves flow from bottom of parent to top of child, matching conversational branching diagrams.
 */
export default function TreeConnections({
  connections = [],
  width = 1200,
  height = 800,
  categoryColor = "#22c55e",
}) {
  if (!connections || connections.length === 0) return null;

  return (
    <svg
      width={width}
      height={height}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "none",
        zIndex: 5,
        overflow: "visible",
      }}
    >
      <defs>
        {/* Glow filter for selected active branches */}
        <filter id="treeBranchGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Linear gradient for completed connections */}
        <linearGradient id="completedGradVert" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.85" />
        </linearGradient>

        <linearGradient id="accentGradVert" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={categoryColor} stopOpacity="0.85" />
          <stop offset="100%" stopColor={categoryColor} stopOpacity="0.55" />
        </linearGradient>
      </defs>

      {connections.map((conn) => {
        const {
          id,
          fromX,
          fromY,
          toX,
          toY,
          status = "locked",
          isSelected = false,
        } = conn;

        // Vertical cubic bezier: smooth top-down conversational branch
        const dy = Math.abs(toY - fromY) * 0.5;
        const cp1x = fromX;
        const cp1y = fromY + dy;
        const cp2x = toX;
        const cp2y = toY - dy;
        const pathData = `M ${fromX} ${fromY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${toX} ${toY}`;

        // Determine appearance by status
        const isCompleted = status === "completed";
        const isAvailable = status === "available" || status === "current";

        let stroke = "var(--border-subtle, rgba(255,255,255,0.15))";
        let strokeWidth = 2.5;
        let strokeDasharray = "none";
        let strokeOpacity = 0.55;

        if (isCompleted) {
          stroke = "url(#completedGradVert)";
          strokeWidth = 3.5;
          strokeOpacity = 0.95;
        } else if (isAvailable) {
          stroke = "url(#accentGradVert)";
          strokeWidth = 3;
          strokeOpacity = 0.85;
        } else {
          // Locked
          stroke = "var(--text-faint, rgba(148, 163, 184, 0.35))";
          strokeWidth = 2;
          strokeDasharray = "6 6";
          strokeOpacity = 0.45;
        }

        if (isSelected) {
          stroke = categoryColor;
          strokeWidth = 4.5;
          strokeOpacity = 1;
        }

        return (
          <g key={id}>
            {/* Background highlight glow if selected */}
            {isSelected && (
              <path
                d={pathData}
                fill="none"
                stroke={categoryColor}
                strokeWidth={9}
                strokeOpacity={0.35}
                filter="url(#treeBranchGlow)"
              />
            )}

            {/* Main connecting curve */}
            <path
              d={pathData}
              fill="none"
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              strokeOpacity={strokeOpacity}
              strokeLinecap="round"
            />

            {/* Parent bottom anchor dot */}
            <circle
              cx={fromX}
              cy={fromY}
              r={isCompleted ? 4.5 : 3.5}
              fill={isCompleted ? "#22c55e" : isAvailable ? categoryColor : "var(--text-muted)"}
              opacity={strokeOpacity}
            />

            {/* Child top anchor dot */}
            <circle
              cx={toX}
              cy={toY}
              r={isCompleted ? 4.5 : 3.5}
              fill={isCompleted ? "#22c55e" : isAvailable ? categoryColor : "var(--text-muted)"}
              opacity={strokeOpacity}
            />
          </g>
        );
      })}
    </svg>
  );
}
