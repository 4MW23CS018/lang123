// HandwritingTracer.jsx — Font-rendered guide + freehand canvas tracing
//  Guided handwriting practice dialog.
//
// Renders a font glyph as a faint background, overlays a dotted path the
// user traces with finger/mouse/pen, and scores how closely they followed
// it. Every character uses guided mode (no freehand toggle).
import { useRef, useState, useEffect, useMemo } from "react";
import {
  X,
  RotateCcw,
  Eraser,
  ArrowLeft,
  ArrowRight,
  Share2,
  Star,
} from "lucide-react";
import { VERIFIED_HANDWRITING_PATHS } from "../data/handwritingPaths";


const GLYPH_FONT_SIZE = 400 * 0.65;
const GLYPH_INSET = 12;
const buttonStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  padding: "8px 12px",
  minHeight: 44,
  borderRadius: 12,
  border: "1px solid var(--border-default)",
  background: "var(--bg-elevated)",
  color: "var(--text-primary)",
  fontWeight: 700,
  cursor: "pointer",
};

// Removed features (kept here as a record, not executed) 


// ── Accuracy scoring ──
// Compares user-drawn pixels against the character outline pixels
/* ____ Dead at the moment (bcz we are only helping users learn not to compete imediatly )
function computeAccuracy(canvas, charCanvas) {
  const ctx = canvas.getContext('2d');
  const charCtx = charCanvas.getContext('2d');
  const w = canvas.width, h = canvas.height;

  const userData = ctx.getImageData(0, 0, w, h).data;
  const charData = charCtx.getImageData(0, 0, w, h).data;

  let charPixels = 0;
  let userPixels = 0;
  let userOnChar = 0;

  for (let i = 0; i < w * h; i++) {
    const ci = i * 4;
    // We only care about alpha (presence of drawn pixels)
    const charAlpha = charData[ci + 3];
    const userAlpha = userData[ci + 3];

    const isChar = charAlpha > 30;
    const isUser = userAlpha > 30;

    if (isChar) charPixels++;
    if (isUser) {
      userPixels++;
      if (isChar) userOnChar++;
    }
  }

  if (charPixels === 0 || userPixels === 0) return 0;

  // The character guide is now the EXACT shape of the font (no dilation).
  // A perfect 6px trace through the middle of the ~20px thick character 
  // will cover about 15-20% of its area.
  const expectedUserPixels = charPixels * 0.18; 
  
  // Coverage: Did the user draw enough pixels?
  const coverage = Math.min(1, userPixels / expectedUserPixels);
  
  // Precision: How many of the user's pixels stayed on the character?
  const precision = userOnChar / userPixels;

  // We use an exponential penalty (power of 4) to utterly destroy the score of scribbles.
  const score = coverage * Math.pow(precision, 4);

  const finalScore = Math.min(100, Math.round(score * 100));

  return finalScore;
} */

function fitGlyph(ctx, char, canvasSize, fontSize, inset) {
  const available = canvasSize - inset * 2;
  const fontFamily =
    "'Noto Sans Kannada', 'Noto Sans Tamil', 'Noto Sans Telugu', 'Noto Sans Malayalam', sans-serif";
  const measure = (size) => {
    ctx.font = `bold ${size}px ${fontFamily}`;
    const metrics = ctx.measureText(char);
    return {
      metrics,
      width: metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight,
      height:
        metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent,
    };
  };

  let fittedSize = fontSize;
  let bounds = measure(fittedSize);
  if (bounds.width > available || bounds.height > available) {
    let low = 1;
    let high = fontSize;
    for (let i = 0; i < 12; i++) {
      const candidate = (low + high) / 2;
      const candidateBounds = measure(candidate);
      if (
        candidateBounds.width <= available &&
        candidateBounds.height <= available
      ) {
        low = candidate;
      } else {
        high = candidate;
      }
    }
    fittedSize = low;
    bounds = measure(fittedSize);
  }

  const x =
    (canvasSize +
      bounds.metrics.actualBoundingBoxLeft -
      bounds.metrics.actualBoundingBoxRight) /
    2;
  const baseline =
    (canvasSize +
      bounds.metrics.actualBoundingBoxAscent -
      bounds.metrics.actualBoundingBoxDescent) /
    2;
  return { x, baseline };
}

/**
 * Convert an SVG path (bceause there is no inbuilt function) string into a polyline we can walk by arc length.
 *
 * Supported commands: M, L, Q, C — absolute, no arcs, no close-path.
 * Q and C curves are flattened by sampling segments every ~2px.
 *
 * @returns {{ points: {x,y}[], cumulative: number[], length: number }}
 *   points     — flattened polyline in canvas coords
 *   cumulative — cumulative arc length at each point
 *   length     — total arc length
 */

function getPathMetrics(pathData, viewBox, size) {
  const [, , viewWidth, viewHeight] = viewBox.split(/[ ,]+/).map(Number);
  const tokens =
    pathData.match(/[MLCQ]|[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/gi) || [];
  const points = [];
  let index = 0;
  let command = null;
  let current = { x: 0, y: 0 };
  const readPoint = () => ({
    x: Number(tokens[index++]),
    y: Number(tokens[index++]),
  });
  const appendCurve = (evaluate, estimate) => {
    const steps = Math.max(1, Math.ceil(estimate / 2));
    for (let step = 1; step <= steps; step++)
      points.push(evaluate(step / steps));
  };

  while (index < tokens.length) {
    if (/^[a-z]$/i.test(tokens[index])) command = tokens[index++];
    if (!command || command !== command.toUpperCase())
      throw new Error(
        "Handwriting SVG paths must use supported absolute commands.",
      );
    if (command === "M") {
      current = readPoint();
      points.push(current);
      command = "L"; // SVG treats subsequent coordinate pairs after M as L.
    } else if (command === "L") {
      const start = current;
      const end = readPoint();
      const distance = Math.hypot(end.x - start.x, end.y - start.y);
      appendCurve(
        (t) => ({
          x: start.x + (end.x - start.x) * t,
          y: start.y + (end.y - start.y) * t,
        }),
        distance,
      );
      current = end;
    } else if (command === "Q") {
      const start = current;
      const control = readPoint();
      const end = readPoint();
      const estimate =
        Math.hypot(control.x - start.x, control.y - start.y) +
        Math.hypot(end.x - control.x, end.y - control.y);
      appendCurve(
        (t) => ({
          x:
            (1 - t) ** 2 * start.x +
            2 * (1 - t) * t * control.x +
            t ** 2 * end.x,
          y:
            (1 - t) ** 2 * start.y +
            2 * (1 - t) * t * control.y +
            t ** 2 * end.y,
        }),
        estimate,
      );
      current = end;
    } else if (command === "C") {
      const start = current;
      const firstControl = readPoint();
      const secondControl = readPoint();
      const end = readPoint();
      const estimate =
        Math.hypot(firstControl.x - start.x, firstControl.y - start.y) +
        Math.hypot(
          secondControl.x - firstControl.x,
          secondControl.y - firstControl.y,
        ) +
        Math.hypot(end.x - secondControl.x, end.y - secondControl.y);
      appendCurve(
        (t) => ({
          x:
            (1 - t) ** 3 * start.x +
            3 * (1 - t) ** 2 * t * firstControl.x +
            3 * (1 - t) * t ** 2 * secondControl.x +
            t ** 3 * end.x,
          y:
            (1 - t) ** 3 * start.y +
            3 * (1 - t) ** 2 * t * firstControl.y +
            3 * (1 - t) * t ** 2 * secondControl.y +
            t ** 3 * end.y,
        }),
        estimate,
      );
      current = end;
    } else {
      throw new Error(`Unsupported handwriting SVG command: ${command}`);
    }
  }

  const scaleX = size / viewWidth;
  const scaleY = size / viewHeight;
  const scaledPoints = points.map((point) => ({
    x: point.x * scaleX,
    y: point.y * scaleY,
  }));
  const cumulative = [0];
  for (let i = 1; i < scaledPoints.length; i++) {
    cumulative.push(
      cumulative[i - 1] +
        Math.hypot(
          scaledPoints[i].x - scaledPoints[i - 1].x,
          scaledPoints[i].y - scaledPoints[i - 1].y,
        ),
    );
  }
  return { points: scaledPoints, cumulative, length: cumulative.at(-1) || 0 };
}

function pointAtDistance(metrics, distance) {
  const target = Math.max(0, Math.min(metrics.length, distance));
  for (let i = 1; i < metrics.points.length; i++) {
    if (target > metrics.cumulative[i]) continue;
    const start = metrics.points[i - 1];
    const end = metrics.points[i];
    const segmentLength = metrics.cumulative[i] - metrics.cumulative[i - 1];
    const ratio = segmentLength
      ? (target - metrics.cumulative[i - 1]) / segmentLength
      : 0;
    return {
      x: start.x + (end.x - start.x) * ratio,
      y: start.y + (end.y - start.y) * ratio,
      angle: (Math.atan2(end.y - start.y, end.x - start.x) * 180) / Math.PI,
    };
  }
  const end = metrics.points.at(-1);
  const before = metrics.points.at(-2) || end;
  return {
    ...end,
    angle: (Math.atan2(end.y - before.y, end.x - before.x) * 180) / Math.PI,
  };
}


/**
 * Snap a pointer position onto the expected path, returning where along
 * the path it lands and how far off it is. Only considers a small window
 * from `fromDistance` to `fromDistance + maxAdvance` so the user can't
 * skip ahead by scrubbing the whole canvas.
 *
 * @returns {{ distance: number, deviation: number } | null}
 *   distance  — arc-length position of the nearest point on the path
 *   deviation — perpendicular distance from the pointer to that point
 */

function projectToExpectedPath(metrics, point, fromDistance, maxAdvance) {
  const limit = Math.min(metrics.length, fromDistance + maxAdvance);
  let nearest = null;
  for (let i = 1; i < metrics.points.length; i++) {
    const segmentStartDistance = metrics.cumulative[i - 1];
    const segmentEndDistance = metrics.cumulative[i];
    const segmentLength = segmentEndDistance - segmentStartDistance;
    if (
      !segmentLength ||
      segmentEndDistance < fromDistance ||
      segmentStartDistance > limit
    )
      continue;
    const start = metrics.points[i - 1];
    const end = metrics.points[i];
    const minRatio = Math.max(
      0,
      (fromDistance - segmentStartDistance) / segmentLength,
    );
    const maxRatio = Math.min(
      1,
      (limit - segmentStartDistance) / segmentLength,
    );
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const rawRatio =
      ((point.x - start.x) * dx + (point.y - start.y) * dy) /
      (segmentLength * segmentLength);
    const ratio = Math.max(minRatio, Math.min(maxRatio, rawRatio));
    const projected = { x: start.x + dx * ratio, y: start.y + dy * ratio };
    const deviation = Math.hypot(point.x - projected.x, point.y - projected.y);
    if (!nearest || deviation < nearest.deviation) {
      nearest = {
        distance: segmentStartDistance + ratio * segmentLength,
        deviation,
      };
    }
  }
  return nearest;
}

/**
 * Stroke the slice of `metrics` between two arc-length positions.
 * Used to paint the orange guided progress (0..strokeProgress) and the
 * fully-completed strokes on the user canvas.
 */


function drawPathRange(ctx, metrics, fromDistance, toDistance, color, width) {
  if (toDistance <= fromDistance) return;
  const start = pointAtDistance(metrics, fromDistance);
  const end = pointAtDistance(metrics, toDistance);
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  for (let i = 1; i < metrics.points.length - 1; i++) {
    if (
      metrics.cumulative[i] > fromDistance &&
      metrics.cumulative[i] < toDistance
    ) {
      ctx.lineTo(metrics.points[i].x, metrics.points[i].y);
    }
  }
  ctx.lineTo(end.x, end.y);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();
}

function drawPathDots(ctx, metrics, gap = 12) {
  for (let distance = 0; distance <= metrics.length; distance += gap) {
    const point = pointAtDistance(metrics, distance);
    ctx.beginPath();
    ctx.arc(point.x, point.y, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(210, 218, 228, 0.82)";
    ctx.fill();
  }
  const end = pointAtDistance(metrics, metrics.length);
  ctx.beginPath();
  ctx.arc(end.x, end.y, 2.5, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(210, 218, 228, 0.82)";
  ctx.fill();
}

/**
 * Resize a canvas backing store to match its CSS size × devicePixelRatio,
 * preserving any existing drawing, and return a context whose transform
 * maps [0, size]² to the physical pixel grid.
 *
 * Must be called before drawing on the canvas each time the layout changes.
 */


function syncCanvasResolution(canvas, size) {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.round((rect.width || size) * dpr));
  const height = Math.max(1, Math.round((rect.height || size) * dpr));
  let snapshot = null;
  if (
    canvas.width &&
    canvas.height &&
    (canvas.width !== width || canvas.height !== height)
  ) {
    snapshot = document.createElement("canvas");
    snapshot.width = canvas.width;
    snapshot.height = canvas.height;
    snapshot.getContext("2d").drawImage(canvas, 0, 0);
  }
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(width / size, 0, 0, height / size, 0, 0);
  if (snapshot) ctx.drawImage(snapshot, 0, 0, size, size);
  return ctx;
}

// ── Main Component ──



const HandwritingTracer = ({
  char,
  label,
  example,
  script,
  previousChar,
  nextChar,
  onPreviousCharacter,
  onNextCharacter,
  onClose,
  onNext,
}) => {
  const canvasRef = useRef(null); // User drawing canvas
  const charCanvasRef = useRef(null); // Hidden canvas with character rendered as font
  const guideCanvasRef = useRef(null); // Visible guide canvas (outline of character)
  // Dead at the moment  const [practiceMode, setPracticeMode] = useState('guided');
  // Dead at the moment const [hasDrawn, setHasDrawn] = useState(false);
  const [finished, setFinished] = useState(false);
  // const [score, setScore] = useState(0); Dead at the moment
  const [stars, setStars] = useState(0);
  const [activeStroke, setActiveStroke] = useState(0);
  const [completedStrokes, setCompletedStrokes] = useState(0);
  const [strokeProgress, setStrokeProgress] = useState(0);
  const [canvasVersion, setCanvasVersion] = useState(0);
  const [shareStatus, setShareStatus] = useState("");
  const [showGuide, setShowGuide] = useState(true);
  const lastPoint = useRef(null);
  const drawingPointerId = useRef(null);
  const pathErrorTotal = useRef(0);
  const pathErrorSamples = useRef(0);
  const activeStrokeRef = useRef(0);
  const completedStrokesRef = useRef(0);
  const strokeProgressRef = useRef(0);
  const dialogRef = useRef(null);

  const SIZE = 400;
  const pathDefinition = VERIFIED_HANDWRITING_PATHS[`${script}:${char}`];
  const isGuidedCharacter = Boolean(pathDefinition);
  // changed to below -> const guidedActive = isGuidedCharacter && practiceMode === 'guided';
  const guidedActive = isGuidedCharacter;
  const pathMetrics = useMemo(
    () =>
      pathDefinition?.strokes.map((stroke) =>
        getPathMetrics(stroke.d, pathDefinition.viewBox, SIZE),
      ) || [],
    [pathDefinition],
  );
  const strokeTolerance = 28;

  useEffect(() => {
    const previousFocus = document.activeElement;
    dialogRef.current?.querySelector("button")?.focus();
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab" && dialogRef.current) {
        const controls = [
          ...dialogRef.current.querySelectorAll("button, input"),
        ].filter((control) => !control.disabled);
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus?.();
    };
  }, [onClose]);

  useEffect(() => {
    const container = canvasRef.current?.parentElement;
    if (!container) return undefined;
    const resize = () => setCanvasVersion((version) => version + 1);
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    window.addEventListener("resize", resize);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, []);

  // Render the character as a font glyph onto hidden + guide canvases
  useEffect(() => {
    // Wait for fonts to be ready before rendering to canvas
    document.fonts.ready.then(() => {
      // ── Hidden character canvas (Fat Hitbox for scoring) ──
      const charCanvas = charCanvasRef.current;
      if (!charCanvas) return;
      const charCtx = charCanvas.getContext("2d");
      charCanvas.width = SIZE;
      charCanvas.height = SIZE;
      charCtx.clearRect(0, 0, SIZE, SIZE);

      charCtx.textAlign = "left";
      charCtx.textBaseline = "alphabetic";
      // Preserve ordinary glyph size; shrink only if painted bounds exceed the safe area.
      const { x, baseline } = fitGlyph(
        charCtx,
        char,
        SIZE,
        GLYPH_FONT_SIZE,
        GLYPH_INSET,
      );

      // Draw the exact character shape (NO thick stroke, otherwise loops close into a solid blob!)
      charCtx.fillStyle = "rgba(255,255,255,1)";
      charCtx.fillText(char, x, baseline);

      // ── Visible guide canvas (dashed outline) ──
      const guideCanvas = guideCanvasRef.current;
      if (!guideCanvas) return;
      const guideCtx = syncCanvasResolution(guideCanvas, SIZE);
      guideCtx.clearRect(0, 0, SIZE, SIZE);

      // Draw a light filled version as background guide
      guideCtx.font = charCtx.font;
      guideCtx.textAlign = "left";
      guideCtx.textBaseline = "alphabetic";
      guideCtx.fillStyle = "rgba(235, 226, 226, 0.68)";
      guideCtx.fillText(char, x, baseline);


      if (guidedActive) {
         // 1) Dotted path the user is meant to follow
        pathMetrics.forEach((metrics) => drawPathDots(guideCtx, metrics));
        if (pathMetrics[activeStroke]) {
          const activeMetrics = pathMetrics[activeStroke];
          const start = pointAtDistance(activeMetrics, 0);
          const handDistance = Math.min(
            activeMetrics.length,
            strokeProgress + 14,
          );
          [24, 16, 8].forEach((offset, index) => {
            if (handDistance < offset) return;
            const trailPoint = pointAtDistance(
              activeMetrics,
              handDistance - offset,
            );
            guideCtx.beginPath();
            guideCtx.arc(
              trailPoint.x,
              trailPoint.y,
              1.8 + index * 0.35,
              0,
              Math.PI * 2,
            );
            guideCtx.fillStyle = "rgba(238, 238, 236, 0.7)";
            guideCtx.fill();
          });
           //Color pill marking where to place the finger to begin.
          guideCtx.beginPath();
          guideCtx.arc(start.x, start.y, 7, 0, Math.PI * 2);
          guideCtx.fillStyle = "#ffc247";
          guideCtx.fill();
          guideCtx.lineWidth = 2;
          guideCtx.strokeStyle = "#fff1c2";
          guideCtx.stroke();
        }
      } /* only runs when !guidedActive. With guided-only, that's never.
      else {
        guideCtx.lineWidth = 3;
        guideCtx.strokeStyle = 'rgba(255,255,255,0.35)';
        guideCtx.setLineDash([8, 6]);
        guideCtx.strokeText(char, x, baseline);
      } */

      // Clear the user drawing canvas
      const canvas = canvasRef.current;
      if (canvas) syncCanvasResolution(canvas, SIZE);
    });
  }, [
    char,
    guidedActive,
    canvasVersion,
    activeStroke,
    strokeProgress,
    pathMetrics,
  ]);

  useEffect(() => {
    if (!guidedActive || !canvasRef.current) return;
    const ctx = syncCanvasResolution(canvasRef.current, SIZE);
    ctx.clearRect(0, 0, SIZE, SIZE);
    pathMetrics.forEach((metrics, index) => {
      // PEN: stroke size for the pencil 25px
      if (index < completedStrokes)
        drawPathRange(ctx, metrics, 0, metrics.length, "#ebe9e6", 25);
      else if (index === activeStroke)
        drawPathRange(ctx, metrics, 0, strokeProgress, "#ece9e5", 25);
    });
  }, [
    guidedActive,
    pathDefinition,
    pathMetrics,
    activeStroke,
    completedStrokes,
    strokeProgress,
    canvasVersion,
  ]);

  // ── Pointer coordinate helper
  
  const getCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (SIZE / rect.width),
      y: (e.clientY - rect.top) * (SIZE / rect.height),
    };
  };

  const handleStart = (e) => {
    e.preventDefault();
    if (
      finished ||
      drawingPointerId.current !== null ||
      (e.pointerType === "mouse" && e.button !== 0)
    )
      return;
    const coords = getCoords(e);
    if (guidedActive) {
      const metrics = pathMetrics[activeStrokeRef.current];
      if (!metrics) return;
      const expected = pointAtDistance(metrics, strokeProgressRef.current);
      if (
        Math.hypot(coords.x - expected.x, coords.y - expected.y) >
        (strokeProgressRef.current === 0 ? 38 : strokeTolerance)
      )
        return;
    }
    drawingPointerId.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    // read only in the Check-button gate and the surrounding helper text -> setHasDrawn(true);
    lastPoint.current = coords;

    if (guidedActive) return;
    /* The if (guidedActive) return; line itself can also go — it now returns always.
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.arc(coords.x, coords.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#00e5ff';
    ctx.fill(); */
  };

  const handleMove = (e) => {
    e.preventDefault();
    if (
      drawingPointerId.current !== e.pointerId ||
      finished ||
      !lastPoint.current
    )
      return;
    const coords = getCoords(e);
    if (guidedActive) {
      const strokeIndex = activeStrokeRef.current;
      const metrics = pathMetrics[strokeIndex];
      if (!metrics) return;
      const movement = Math.hypot(
        coords.x - lastPoint.current.x,
        coords.y - lastPoint.current.y,
      );
      const maxAdvance = Math.max(18, Math.min(32, movement * 1.5));
      const candidate = projectToExpectedPath(
        metrics,
        coords,
        strokeProgressRef.current,
        maxAdvance,
      );
      lastPoint.current = coords;
      if (
        !candidate ||
        candidate.deviation > strokeTolerance ||
        candidate.distance <= strokeProgressRef.current + 0.5
      )
        return;

      pathErrorTotal.current += candidate.deviation;
      pathErrorSamples.current += 1;
      const nextProgress = Math.min(candidate.distance, metrics.length);
      strokeProgressRef.current = nextProgress;
      setStrokeProgress(nextProgress);

      if (nextProgress >= metrics.length - 5) {
        completedStrokesRef.current += 1;
        setCompletedStrokes(completedStrokesRef.current);
        if (completedStrokesRef.current < pathMetrics.length) {
          activeStrokeRef.current = completedStrokesRef.current;
          setActiveStroke(activeStrokeRef.current);
          strokeProgressRef.current = 0;
          setStrokeProgress(0);
        } else {
          setFinished(true);
          drawingPointerId.current = null;
          lastPoint.current = null;
          const meanDeviation =
            pathErrorTotal.current / Math.max(1, pathErrorSamples.current);
          // Stars use mean deviation from the authored centerline in canvas units: <=9, <=18, and <=28 earn 3, 2, or 1 star. Only accepted on-path samples count.
          const earned = meanDeviation <= 9 ? 3 : meanDeviation <= 18 ? 2 : 1;
          setStars((best) => Math.max(best, earned));
        }
        if (e.currentTarget.hasPointerCapture(e.pointerId))
          e.currentTarget.releasePointerCapture(e.pointerId);
      }
      return;
    }
    /* dead at the moment 
    const ctx = canvasRef.current.getContext('2d');
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 16;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();

    lastPoint.current = coords;
    */
  };

  const handleEnd = (e) => {
    e.preventDefault();
    if (drawingPointerId.current !== e.pointerId) return;
    drawingPointerId.current = null;
    lastPoint.current = null;
  };

  /* Dead at the moment
  const handleCheck = () => {
    if (!hasDrawn) return;
    if (isGuidedCharacter) {
      setFinished(true);
      return;
    }
    const accuracy = computeAccuracy(canvasRef.current, charCanvasRef.current);
    setScore(accuracy);
    setFinished(true);
  };*/

  const handleReset = () => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, SIZE, SIZE);
    drawingPointerId.current = null;
    lastPoint.current = null;
    //setHasDrawn(false);
    setFinished(false);
    //setScore(0);
    activeStrokeRef.current = 0;
    completedStrokesRef.current = 0;
    strokeProgressRef.current = 0;
    pathErrorTotal.current = 0;
    pathErrorSamples.current = 0;
    setActiveStroke(0);
    setCompletedStrokes(0);
    setStrokeProgress(0);
    setShareStatus("");
  };

  /* Dead at the moment
  const handleModeToggle = () => {
    handleReset();
    setPracticeMode(mode => mode === 'guided' ? 'freehand' : 'guided');
  };*/

  const handleShare = async () => {
    const guideCanvas = guideCanvasRef.current;
    const drawingCanvas = canvasRef.current;
    if (!guideCanvas || !drawingCanvas) return;
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = SIZE;
    exportCanvas.height = SIZE;
    const ctx = exportCanvas.getContext("2d");
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.drawImage(guideCanvas, 0, 0, SIZE, SIZE);
    ctx.drawImage(drawingCanvas, 0, 0, SIZE, SIZE);
    const blob = await new Promise((resolve) =>
      exportCanvas.toBlob(resolve, "image/png"),
    );
    if (!blob) {
      setShareStatus("Image export is unavailable in this browser.");
      return;
    }
    const file = new File([blob], "kannada-a-practice.png", {
      type: "image/png",
    });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: "Kannada ಅ handwriting practice",
        });
        setShareStatus("Practice image shared.");
        return;
      } catch (error) {
        if (error.name === "AbortError") return;
      }
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setShareStatus("Practice image downloaded.");
  };

  /*__Dead at the moment
    const getFeedback = (s) => {
    if (s >= 90) return { text: 'Excellent shape match', color: '#4caf50' };
    if (s >= 70) return { text: 'Strong shape match', color: '#8bc34a' };
    if (s >= 50) return { text: 'Good shape match', color: '#ff9800' };
    if (s >= 30) return { text: 'Keep following the guide', color: '#ff5722' };
    return { text: 'Try tracing closer to the guide', color: '#f44336' };
  }; */

  const handPoint =
    guidedActive && !finished && pathMetrics[activeStroke]
      ? pointAtDistance(
          pathMetrics[activeStroke],
          Math.min(pathMetrics[activeStroke].length, strokeProgress + 14),
        )
      : null;
  const previewButtonStyle = {
    ...buttonStyle,
    padding: "8px 10px",
    minHeight: 44,
    background: "var(--bg-elevated)",
    color: "var(--text-primary)",
  };

  return (
    <div
      role="presentation"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.92)",
        backdropFilter: "blur(12px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "12px",
        color: "var(--text-primary)",
        overflowY: "auto",
      }}
    >
      <style>
        {
          "@keyframes handwriting-pointer-bob { from { margin-top: 0; } to { margin-top: -4px; } } @media (prefers-reduced-motion: reduce) { .handwriting-pointer { animation: none !important; } }"
        }
      </style>
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tracer-title"
        style={{
          width: "min(100%, 460px)",
          maxHeight: "100%",
          overflowY: "auto",
          padding: "clamp(12px, 3vw, 20px)",
          boxSizing: "border-box",
          borderRadius: 18,
          background: "var(--bg-base)",
        }}
      >
        {/* Header */}
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 8,
            marginBottom: 12,
          }}
        >
          <button
            type="button"
            aria-label={`Close tracing for ${char}`}
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              borderRadius: 10,
              padding: "8px 10px",
              display: "flex",
              alignItems: "center",
              minWidth: 44,
              minHeight: 44,
            }}
          >
            <X size={20} />
          </button>
          <div style={{ textAlign: "center" }}>
            <div
              id="tracer-title"
              style={{
                fontSize: 14,
                color: "var(--text-secondary)",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              Trace the character
            </div>
            <div style={{ fontSize: 32, fontWeight: "bold", marginTop: 2 }}>
              {char}
            </div>
            {label && (
              <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                {label}
              </div>
            )}
          </div>
          <button
            type="button"
            aria-label="Clear drawing"
            onClick={handleReset}
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              borderRadius: 10,
              padding: "8px 10px",
              display: "flex",
              alignItems: "center",
              gap: 6,
              minWidth: 44,
              minHeight: 44,
            }}
          >
            <Eraser size={18} />
          </button>
        </div>
        {/* Canvas area */} {/*Trace the character*/}
        {example && (
          <p
            style={{
              textAlign: "center",
              color: "var(--text-secondary)",
              fontSize: 13,
              margin: "8px 0",
            }}
          >
            Example: {example}
          </p>
        )}
        {/* Dead at the moment  {isGuidedCharacter && <div aria-label="Character navigation" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, margin: '8px auto', maxWidth: 400 }}>
        <button type="button" disabled={!previousChar || !onPreviousCharacter} onClick={onPreviousCharacter} style={{ ...previewButtonStyle, opacity: previousChar && onPreviousCharacter ? 1 : 0.45 }} aria-label={previousChar ? `Previous character ${previousChar}` : 'No previous character'}><ArrowLeft size={16} aria-hidden="true" /> {previousChar || 'Previous'}</button>
        <strong aria-current="true" style={{ fontSize: 20 }}>{char}</strong>
        <button type="button" disabled={!nextChar || !onNextCharacter} onClick={onNextCharacter} style={{ ...previewButtonStyle, opacity: nextChar && onNextCharacter ? 1 : 0.45 }} aria-label={nextChar ? `Next character ${nextChar}` : 'No next character'}>{nextChar || 'Next'} <ArrowRight size={16} aria-hidden="true" /></button>
      </div>} */}
        <div
          aria-label="Character navigation"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 8,
            margin: "8px auto",
            maxWidth: 400,
          }}
        >
          <button
            type="button"
            disabled={!previousChar || !onPreviousCharacter}
            onClick={onPreviousCharacter}
            style={{
              ...previewButtonStyle,
              opacity: previousChar && onPreviousCharacter ? 1 : 0.45,
            }}
            aria-label={
              previousChar
                ? `Previous character ${previousChar}`
                : "No previous character"
            }
          >
            <ArrowLeft size={16} aria-hidden="true" />{" "}
            {previousChar || "Previous"}
          </button>
          <strong aria-current="true" style={{ fontSize: 20 }}>
            {char}
          </strong>
          <button
            type="button"
            disabled={!nextChar || !onNextCharacter}
            onClick={onNextCharacter}
            style={{
              ...previewButtonStyle,
              opacity: nextChar && onNextCharacter ? 1 : 0.45,
            }}
            aria-label={
              nextChar ? `Next character ${nextChar}` : "No next character"
            }
          >
            {nextChar || "Next"} <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
        <p
          style={{
            textAlign: "center",
            color: "var(--text-secondary)",
            fontSize: 13,
            margin: "8px 0",
          }}
        >
          {guidedActive
            ? "Begin at the yellow marker. Follow the dots in order; you can retry at any time."
            : isGuidedCharacter
              ? "Freehand practice is active. Clear and try again whenever you like."
              : "Trace the faint guide with your finger or mouse. Stroke order guidance is not available for this character yet."}
        </p>
        {isGuidedCharacter && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 10,
              marginBottom: 10,
            }}
          >
            {/* dead at the moment  <button type="button" aria-pressed={guidedActive} onClick={handleModeToggle} style={previewButtonStyle}><PenTool size={16} aria-hidden="true" /> {guidedActive ? 'Switch to freehand' : 'Switch to guided path'}</button> */}
            <button
              type="button"
              onClick={handleShare}
              style={previewButtonStyle}
            >
              <Share2 size={16} aria-hidden="true" /> Share / export
            </button>
          </div>
        )}
        {shareStatus && (
          <p
            role="status"
            style={{
              textAlign: "center",
              color: "var(--text-secondary)",
              fontSize: 12,
              margin: "4px 0 8px",
            }}
          >
            {shareStatus}
          </p>
        )}
        <div
          style={{
            position: "relative",
            width: "min(100%, 400px)",
            maxHeight: "min(44vh, 400px)",
            aspectRatio: "1/1",
            flexShrink: 1,
            margin: "0 auto",
            background: "#2E4A3A",
            borderRadius: 16,
            border: "2px solid rgba(255,255,255,0.12)",
            overflow: "hidden",
          }}
        >
          {/* Guide canvas (background layer) */}
          <canvas
            ref={guideCanvasRef}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
              zIndex: 1,
              opacity: showGuide ? 1 : 0,
              transition: "opacity 0.3s",
            }}
          />

          {/* User drawing canvas (top layer, transparent bg) */}
          <canvas
            ref={canvasRef}
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              touchAction: "none",
              background: "transparent",
              zIndex: 2,
              cursor: finished ? "default" : "crosshair",
            }}
            onPointerDown={handleStart}
            onPointerMove={handleMove}
            onPointerUp={handleEnd}
            onPointerCancel={handleEnd}
            onLostPointerCapture={handleEnd}
          />
          {handPoint && showGuide && (
            <svg
              className="handwriting-pointer"
              aria-hidden="true"
              viewBox="0 0 32 36"
              width="30"
              height="34"
              style={{
                position: "absolute",
                left: `${(handPoint.x / SIZE) * 100}%`,
                top: `${(handPoint.y / SIZE) * 100}%`,
                zIndex: 3,
                pointerEvents: "none",
                overflow: "visible",
                transform: `translate(-50%, -50%) rotate(${handPoint.angle + 90}deg)`,
                animation:
                  "handwriting-pointer-bob 700ms ease-in-out infinite alternate",
              }}
            >
              <path
                d="M10 33c-3.8 0-6.1-2.2-6.1-5.7v-8.1c0-1.5 2.2-2 3-.5l1.8 3V7.1c0-2.5 3.6-2.5 3.6 0v9.1l1.1-4c.7-2.4 4.1-1.6 3.7.8l-.4 2.3 1-2.1c1.1-2.2 4.2-.9 3.2 1.5l-.6 1.6 1.1-1.2c1.6-1.7 4.1.3 2.7 2.2l-3.7 5.2v5.1c0 3.7-2.4 6.4-6 6.4H10Z"
                fill="#ffd16a"
                stroke="#583c17"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path
                d="M11 7v10"
                stroke="#fff4d3"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          )}
        </div>
        {isGuidedCharacter && (
          <p
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              margin: "10px 0 0",
              color: "var(--text-secondary)",
            }}
            role="status"
            aria-label={`${stars} of 3 path guidance stars`}
          >
            {Array.from({ length: 3 }, (_, index) => (
              <Star
                key={index}
                size={20}
                fill={index < stars ? "#ffc247" : "transparent"}
                color={index < stars ? "#ffc247" : "#64748b"}
                aria-hidden="true"
              />
            ))}
            <span style={{ marginLeft: 6, fontSize: 12 }}>
              {guidedActive
                ? `${completedStrokes} of ${pathMetrics.length} strokes complete`
                : "Path practice"}
            </span>
          </p>
        )}
        {isGuidedCharacter && (
          <p
            style={{
              margin: "5px 0 0",
              textAlign: "center",
              fontSize: 10,
              color: "var(--text-muted)",
            }}
          >
            Provisional path adapted from{" "}
            <a href={pathDefinition.source} target="_blank" rel="noreferrer">
              Kannada-alphabet-a.gif
            </a>{" "}
            by {pathDefinition.sourceAuthor}; {pathDefinition.sourceLicense}.
            The path is a prototype transcription, not an authoritative stroke
            standard.
          </p>
        )}
        {/* Controls */}
        <div style={{ marginTop: 20, width: "100%", maxWidth: 400 }}>
          {finished ? (
            <div
              style={{
                textAlign: "center",
                animation: "fadeUp 0.3s ease-out both",
              }}
            >
              {/* isGuidedCharacter is now always true, so the : <> … getFeedback(score) … </> arm is unreachable. Removing it removes the reference to getFeedback and score */}
              <div
                role="status"
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: "var(--text-primary)",
                }}
              >
                Guided path complete
              </div>
              <p style={{ margin: "8px 0", color: "var(--text-secondary)" }}>
                Best path tracking: {stars} of 3 stars.
              </p>
              <div
                style={{
                  marginTop: 16,
                  display: "flex",
                  gap: 12,
                  justifyContent: "center",
                }}
              >
                <button
                  onClick={handleReset}
                  style={{
                    padding: "10px 24px",
                    background: "rgba(255,255,255,0.1)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: 12,
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <RotateCcw
                    size={14}
                    style={{ marginRight: 6, verticalAlign: "middle" }}
                  />{" "}
                  Retry
                </button>
                {(!isGuidedCharacter || nextChar) && (
                  <button
                    onClick={
                      isGuidedCharacter ? onNextCharacter || onNext : onNext
                    }
                    style={{
                      padding: "10px 24px",
                      background: "#4caf50",
                      border: "none",
                      borderRadius: 12,
                      color: "#fff",
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    Next →
                  </button>
                )}
              </div>
            </div>
          ) : (
            <p
              role="status"
              style={{
                textAlign: "center",
                color: "var(--text-secondary)",
                fontSize: 14,
                margin: 0,
              }}
            >
              Trace stroke {Math.min(activeStroke + 1, pathMetrics.length)} of{" "}
              {pathMetrics.length} from its yellow start marker.
            </p>
          )}
        </div>
        {/* Guide toggle */}
        <div style={{ marginTop: 14 }}>
          <label
            style={{
              color: "#666",
              fontSize: 12,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <input
              type="checkbox"
              checked={showGuide}
              onChange={() => setShowGuide(!showGuide)}
              style={{ accentColor: "#00e5ff" }}
            />
            Show guide
          </label>
        </div>
        <canvas
          ref={charCanvasRef}
          aria-hidden="true"
          style={{ display: "none" }}
        />
      </section>
    </div>
  );
};

export default HandwritingTracer;
