// HandwritingTracer.jsx — Font-rendered guide + freehand canvas tracing
//  Guided handwriting practice dialog.
//
// Renders the exact font glyph as a faint background. Reviewed centerline
// paths are shown only when a character-specific path exists; otherwise the
// same canvas supports freehand practice without a generated trajectory.
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
import { HANDWRITING_PATHS } from "../data/handwritingPaths";
import {
  CANVAS_SIZE,
  GLYPH_FONT_SIZE,
  GLYPH_INSET,
  PEN_SIZE,
  fitGlyph,
  getPathMetrics,
  isPathInsideGlyph,
} from "../utils/handwritingTracerGeometry";


// The brush remains 32 logical canvas pixels wide. This larger font size makes
// the painted glyph occupy most of the 400 × 400 practice board.
const STROKE_TOLERANCE = 22;
const START_TOLERANCE = 30;
const MAX_POINTER_SAMPLE_GAP = 40;
const MAX_TRACE_ADVANCE = 28;
const TRACE_SAMPLE_SPACING = 5;
const PATH_SAMPLE_TOLERANCE = STROKE_TOLERANCE;
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
function computeAccuracy(canvas, charCanvas) {
  const comparisonCanvas = document.createElement("canvas");
  comparisonCanvas.width = charCanvas.width;
  comparisonCanvas.height = charCanvas.height;
  comparisonCanvas
    .getContext("2d")
    .drawImage(canvas, 0, 0, comparisonCanvas.width, comparisonCanvas.height);

  const w = comparisonCanvas.width;
  const h = comparisonCanvas.height;
  const userData = comparisonCanvas.getContext("2d").getImageData(0, 0, w, h).data;
  const charCtx = charCanvas.getContext("2d");
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
 * Used to paint chalk progress (0..strokeProgress) and the
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
  // Explicitly fill the moving endpoint as well. With a glyph mask this keeps
  // antialiased partial strokes continuous while the learner is moving.
  ctx.beginPath();
  ctx.arc(end.x, end.y, width / 2, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function drawPathDots(ctx, metrics, color, gap = 13, radius = 2.5) {
  for (let distance = 0; distance <= metrics.length; distance += gap) {
    const point = pointAtDistance(metrics, distance);
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
  const first = metrics.points[0];
  const end = pointAtDistance(metrics, metrics.length);
  const distanceFromFirst = Math.hypot(end.x - first.x, end.y - first.y);
  const remainder = metrics.length % gap;
  if (distanceFromFirst < gap * 0.5 || remainder < gap * 0.5) return;
  ctx.beginPath();
  ctx.arc(end.x, end.y, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function getChalkPalette(board) {
  const styles = board ? getComputedStyle(board) : null;
  const read = (name, fallback) =>
    styles?.getPropertyValue(name).trim() || fallback;
  return {
    guide: read("--tracer-guide-color", "rgba(255, 255, 255, 0.32)"),
    dots: read("--tracer-path-color", "rgba(255, 255, 255, 0.88)"),
    remainingDots: read(
      "--tracer-remaining-path-color",
      "rgba(255, 255, 255, 0.38)",
    ),
    markerTrail: read("--tracer-marker-trail-color", "#ffc857"),
    progress: read("--tracer-progress-color", "#f4b942"),
    marker: read("--tracer-marker-color", "#ffd166"),
    markerRing: read("--tracer-marker-ring-color", "#fff4cf"),
    freehand: read("--tracer-freehand-color", "#a7f3d0"),
  };
}

function isPointNearGlyph(glyphPixels, point, size, radius = PEN_SIZE / 2) {
  const centerX = Math.round(point.x);
  const centerY = Math.round(point.y);
  for (let y = centerY - radius; y <= centerY + radius; y++) {
    for (let x = centerX - radius; x <= centerX + radius; x++) {
      if (x < 0 || y < 0 || x >= size || y >= size) continue;
      if (Math.hypot(x - centerX, y - centerY) > radius) continue;
      if (glyphPixels[(y * size + x) * 4 + 3] > 16) return true;
    }
  }
  return false;
}

function maskCanvasToGlyph(canvas, glyphCanvas) {
  if (!canvas || !glyphCanvas) return;
  const ctx = canvas.getContext("2d");
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = "destination-in";
  ctx.drawImage(glyphCanvas, 0, 0, canvas.width, canvas.height);
  ctx.restore();
}

function drawGlyphMaskedLayer(ctx, glyphCanvas, size, drawLayer) {
  const layer = document.createElement("canvas");
  layer.width = size;
  layer.height = size;
  const layerCtx = layer.getContext("2d");
  drawLayer(layerCtx);
  layerCtx.globalCompositeOperation = "destination-in";
  layerCtx.drawImage(glyphCanvas, 0, 0, size, size);
  ctx.drawImage(layer, 0, 0, size, size);
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
  fontFamily,
  fontWeight,
  previousChar,
  nextChar,
  onPreviousCharacter,
  onNextCharacter,
  onClose,
  onNext,
}) => {
  const canvasRef = useRef(null); // User drawing canvas
  const charCanvasRef = useRef(null); // Hidden canvas with character rendered as font
  const targetPixelsRef = useRef(null); // Alpha mask for the exact rendered glyph
  const guideCanvasRef = useRef(null); // Visible glyph and reviewed path guidance
  const glyphDisplayRef = useRef(null); // DOM glyph whose font is also used by canvas
  // Dead at the moment  const [practiceMode, setPracticeMode] = useState('guided');
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [readyTargetKey, setReadyTargetKey] = useState("");
  const [targetFailure, setTargetFailure] = useState({ key: "", message: "" });
  const [pathAlignment, setPathAlignment] = useState({ key: "", aligned: false });
  const [stars, setStars] = useState(0);
  const [activeStroke, setActiveStroke] = useState(0);
  const [completedStrokes, setCompletedStrokes] = useState(0);
  const [strokeProgress, setStrokeProgress] = useState(0);
  const [canvasVersion, setCanvasVersion] = useState(0);
  const [shareStatus, setShareStatus] = useState("");
  const [showGuide, setShowGuide] = useState(true);
  const [pointerActive, setPointerActive] = useState(false);
  const [handDemoDistance, setHandDemoDistance] = useState(0);
  const lastPoint = useRef(null);
  const drawingPointerId = useRef(null);
  const pathErrorTotal = useRef(0);
  const pathErrorSamples = useRef(0);
  const activeStrokeRef = useRef(0);
  const completedStrokesRef = useRef(0);
  const strokeProgressRef = useRef(0);
  const dialogRef = useRef(null);
  const activeRenderTargetKeyRef = useRef("");

  const SIZE = CANVAS_SIZE;
  const targetKey = JSON.stringify([
    script,
    char,
    fontFamily || "",
    fontWeight || "",
  ]);
  const targetReady = readyTargetKey === targetKey;
  const targetError =
    targetFailure.key === targetKey ? targetFailure.message : "";
  const pathAligned =
    pathAlignment.key === targetKey && pathAlignment.aligned;
  const pathDefinition = HANDWRITING_PATHS[`${script}:${char}`];
  const pathMetrics = useMemo(
    () => {
      if (!Array.isArray(pathDefinition?.strokes) || !pathDefinition.strokes.length)
        return [];
      try {
        return pathDefinition.strokes.map((stroke) =>
          getPathMetrics(stroke.d, pathDefinition.viewBox, SIZE),
        );
      } catch {
        return [];
      }
    },
    [pathDefinition, SIZE],
  );
  const isGuidedCharacter =
    Boolean(pathDefinition) &&
    Array.isArray(pathDefinition.strokes) &&
    pathMetrics.length > 0 &&
    pathMetrics.length === pathDefinition.strokes.length;
  const guidedActive = isGuidedCharacter && pathAligned;
  const pathTolerance = STROKE_TOLERANCE;
  const hasInvalidPath = Boolean(pathDefinition) && !isGuidedCharacter;
  const hasMisalignedPath =
    isGuidedCharacter && targetReady && !pathAligned;

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

  // Load the exact script font before rendering the trace target to canvas.
  useEffect(() => {
    let cancelled = false;
    const renderTarget = async () => {
      try {
        if (fontFamily) {
          const loadedFaces = await document.fonts.load(
            `${fontWeight || 400} ${GLYPH_FONT_SIZE}px ${fontFamily}`,
            char,
          );
          if (!loadedFaces.some((face) => face.status === "loaded")) {
            throw new Error("The script font did not load.");
          }
        } else {
          await document.fonts.ready;
        }
      } catch {
        if (!cancelled) {
          setTargetFailure({
            key: targetKey,
            message: "This script glyph could not be loaded, so tracing is unavailable.",
          });
        }
        return;
      }
      if (cancelled) return;
      if (activeRenderTargetKeyRef.current !== targetKey) {
        activeRenderTargetKeyRef.current = targetKey;
        targetPixelsRef.current = null;
        drawingPointerId.current = null;
        lastPoint.current = null;
        activeStrokeRef.current = 0;
        completedStrokesRef.current = 0;
        strokeProgressRef.current = 0;
        pathErrorTotal.current = 0;
        pathErrorSamples.current = 0;
        setActiveStroke(0);
        setCompletedStrokes(0);
        setStrokeProgress(0);
        setFinished(false);
        setHasDrawn(false);
        setPointerActive(false);
        setHandDemoDistance(0);
        setScore(0);
        setStars(0);
        setPathAlignment({ key: targetKey, aligned: false });
        setTargetFailure({ key: targetKey, message: "" });
        setReadyTargetKey("");
        const drawingCanvas = canvasRef.current;
        if (drawingCanvas) {
          const drawingCtx = drawingCanvas.getContext("2d");
          drawingCtx.save();
          drawingCtx.setTransform(1, 0, 0, 1, 0, 0);
          drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
          drawingCtx.restore();
        }
      }
      // ── Hidden character canvas (Fat Hitbox for scoring) ──
      const charCanvas = charCanvasRef.current;
      if (!charCanvas) return;
      const charCtx = charCanvas.getContext("2d");
      charCanvas.width = SIZE;
      charCanvas.height = SIZE;
      charCtx.clearRect(0, 0, SIZE, SIZE);

      const glyphStyle = glyphDisplayRef.current
        ? getComputedStyle(glyphDisplayRef.current)
        : null;
      const targetFontFamily = fontFamily || glyphStyle?.fontFamily;
      const targetFontWeight = fontWeight || glyphStyle?.fontWeight || "700";

      charCtx.textAlign = "left";
      charCtx.textBaseline = "alphabetic";
      // Measure the same font and weight used by the DOM glyph above the board.
      const { x, baseline } = fitGlyph(
        charCtx,
        char,
        SIZE,
        GLYPH_FONT_SIZE,
        GLYPH_INSET,
        targetFontFamily,
        targetFontWeight,
      );

      // Draw the exact character shape (NO thick stroke, otherwise loops close into a solid blob!)
      charCtx.fillStyle = "rgba(255,255,255,1)";
      charCtx.fillText(char, x, baseline);
      const targetPixels = charCtx.getImageData(0, 0, SIZE, SIZE).data;
      let hasTargetInk = false;
      for (let index = 3; index < targetPixels.length; index += 4) {
        if (targetPixels[index] > 16) {
          hasTargetInk = true;
          break;
        }
      }
      if (!hasTargetInk) {
        setTargetFailure({
          key: targetKey,
          message: "No traceable glyph was rendered for this character.",
        });
        targetPixelsRef.current = null;
        setPathAlignment({ key: targetKey, aligned: false });
        return;
      }
      targetPixelsRef.current = targetPixels;
      setPathAlignment({
        key: targetKey,
        aligned:
          isGuidedCharacter &&
          isPathInsideGlyph(pathMetrics, targetPixels, SIZE, 4),
      });

      // ── Visible guide canvas, aligned to the scoring glyph ──
      const guideCanvas = guideCanvasRef.current;
      if (!guideCanvas) return;
      const guideCtx = syncCanvasResolution(guideCanvas, SIZE);
      guideCtx.clearRect(0, 0, SIZE, SIZE);
      const palette = getChalkPalette(guideCanvas.parentElement);

      // Draw a light filled version as background guide
      guideCtx.font = charCtx.font;
      guideCtx.textAlign = "left";
      guideCtx.textBaseline = "alphabetic";
      guideCtx.fillStyle = palette.guide;
      guideCtx.fillText(char, x, baseline);

      if (guidedActive) {
        drawGlyphMaskedLayer(guideCtx, charCanvas, SIZE, (layerCtx) => {
          pathMetrics.forEach((metrics, index) => {
            if (index < activeStroke) return;
            drawPathDots(
              layerCtx,
              metrics,
              index === activeStroke ? palette.dots : palette.remainingDots,
              index === activeStroke ? 13 : 16,
              index === activeStroke ? 2.5 : 2,
            );
          });

          const activeMetrics = pathMetrics[activeStroke];
          if (!activeMetrics) return;
          const start = pointAtDistance(activeMetrics, 0);

          // A short yellow dotted tail points from the start marker into the
          // active stroke, using the same centerline as validation.
          [30, 18].forEach((distance, index) => {
            if (activeMetrics.length < distance) return;
            const trailPoint = pointAtDistance(activeMetrics, distance);
            layerCtx.beginPath();
            layerCtx.arc(
              trailPoint.x,
              trailPoint.y,
              index === 0 ? 2.2 : 3,
              0,
              Math.PI * 2,
            );
            layerCtx.fillStyle = palette.markerTrail;
            layerCtx.fill();
          });

          // Same start point used by pointer validation, clipped to glyph ink.
          layerCtx.beginPath();
          layerCtx.arc(start.x, start.y, 7, 0, Math.PI * 2);
          layerCtx.fillStyle = palette.marker;
          layerCtx.fill();
          layerCtx.lineWidth = 2;
          layerCtx.strokeStyle = palette.markerRing;
          layerCtx.stroke();
        });
      }

      // Clear the user drawing canvas
      const canvas = canvasRef.current;
      if (canvas) syncCanvasResolution(canvas, SIZE);
      setReadyTargetKey(targetKey);
    };
    renderTarget();
    return () => {
      cancelled = true;
    };
  }, [
    char,
    fontFamily,
    fontWeight,
    targetKey,
    guidedActive,
    isGuidedCharacter,
    canvasVersion,
    activeStroke,
    pathMetrics,
    SIZE,
  ]);

  // Demonstrate the active path continuously, but pause the hand when the
  // learner takes over. The hand follows the exact metric points used by the
  // dotted guide and pointer validator.
  useEffect(() => {
    const metrics = pathMetrics[activeStroke];
    if (!guidedActive || !showGuide || finished || pointerActive || !metrics) {
      return undefined;
    }
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }

    let frameId = 0;
    let startedAt = null;
    const duration = Math.max(2800, metrics.length * 12);
    const animate = (now) => {
      if (startedAt === null) startedAt = now;
      const elapsed = (now - startedAt) % duration;
      setHandDemoDistance((elapsed / duration) * metrics.length);
      frameId = window.requestAnimationFrame(animate);
    };
    frameId = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frameId);
  }, [
    activeStroke,
    finished,
    guidedActive,
    pathMetrics,
    pointerActive,
    showGuide,
  ]);

  useEffect(() => {
    if (!guidedActive || !canvasRef.current) return;
    const ctx = syncCanvasResolution(canvasRef.current, SIZE);
    const palette = getChalkPalette(canvasRef.current.parentElement);
    ctx.clearRect(0, 0, SIZE, SIZE);
    drawGlyphMaskedLayer(ctx, charCanvasRef.current, SIZE, (layerCtx) => {
      pathMetrics.forEach((metrics, index) => {
        // Keep the 32 px chalk stroke inside the visible character silhouette.
        if (index < completedStrokes) {
          drawPathRange(
            layerCtx,
            metrics,
            0,
            metrics.length,
            palette.progress,
            PEN_SIZE,
          );
        } else if (index === activeStroke) {
          drawPathRange(
            layerCtx,
            metrics,
            0,
            strokeProgress,
            palette.progress,
            PEN_SIZE,
          );
        }
      });
    });
  }, [
    guidedActive,
    pathDefinition,
    pathMetrics,
    activeStroke,
    completedStrokes,
    strokeProgress,
    canvasVersion,
    SIZE,
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
      !targetReady ||
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
        (strokeProgressRef.current === 0 ? START_TOLERANCE : pathTolerance)
      )
        return;
    } else if (
      !targetPixelsRef.current ||
      !isPointNearGlyph(targetPixelsRef.current, coords, SIZE)
    ) {
      return;
    }
    drawingPointerId.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    lastPoint.current = coords;
    setPointerActive(true);

    if (guidedActive) return;
    setHasDrawn(true);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.arc(coords.x, coords.y, 16, 0, Math.PI * 2);
    ctx.fillStyle = getChalkPalette(canvasRef.current.parentElement).freehand;
    ctx.fill();
    maskCanvasToGlyph(canvasRef.current, charCanvasRef.current);
  };

  const handleMove = (e) => {
    e.preventDefault();
    if (
      drawingPointerId.current !== e.pointerId ||
      !targetReady ||
      finished ||
      !lastPoint.current
    )
      return;
    if (guidedActive) {
      const canvas = e.currentTarget;
      const nativeEvent = e.nativeEvent || e;
      const coalesced = nativeEvent.getCoalescedEvents?.() || [];
      const samples = coalesced.length ? coalesced : [e];
      let progressChanged = false;

      for (const sample of samples) {
        if (drawingPointerId.current !== e.pointerId) break;
        const coords = getCoords(sample);
        const previous = lastPoint.current;
        if (!previous) break;
        const movement = Math.hypot(coords.x - previous.x, coords.y - previous.y);
        lastPoint.current = coords;

        // Do not infer a path trace from a large unobserved pointer jump.
        if (movement > MAX_POINTER_SAMPLE_GAP) continue;
        const steps = Math.max(1, Math.ceil(movement / TRACE_SAMPLE_SPACING));
        for (let step = 1; step <= steps; step++) {
          if (drawingPointerId.current !== e.pointerId) break;
          const ratio = step / steps;
          const point = {
            x: previous.x + (coords.x - previous.x) * ratio,
            y: previous.y + (coords.y - previous.y) * ratio,
          };
          const priorRatio = (step - 1) / steps;
          const priorPoint = {
            x: previous.x + (coords.x - previous.x) * priorRatio,
            y: previous.y + (coords.y - previous.y) * priorRatio,
          };
          const pointMovement = Math.hypot(
            point.x - priorPoint.x,
            point.y - priorPoint.y,
          );
          const metrics = pathMetrics[activeStrokeRef.current];
          if (!metrics) break;
          const fromDistance = strokeProgressRef.current;
          const allowedAdvance = Math.min(
            MAX_TRACE_ADVANCE,
            Math.max(3, pointMovement * 1.8 + 2),
          );
          const candidate = projectToExpectedPath(
            metrics,
            point,
            fromDistance,
            allowedAdvance,
          );
          if (
            !candidate ||
            candidate.deviation > PATH_SAMPLE_TOLERANCE ||
            candidate.distance <= fromDistance + 0.5 ||
            candidate.distance - fromDistance > pointMovement * 1.8 + 2
          )
            continue;

          pathErrorTotal.current += candidate.deviation;
          pathErrorSamples.current += 1;
          strokeProgressRef.current = Math.min(candidate.distance, metrics.length);
          progressChanged = true;

          if (strokeProgressRef.current >= metrics.length - 5) {
            completedStrokesRef.current += 1;
            setCompletedStrokes(completedStrokesRef.current);
            drawingPointerId.current = null;
            lastPoint.current = null;
            setPointerActive(false);
            if (completedStrokesRef.current < pathMetrics.length) {
              activeStrokeRef.current = completedStrokesRef.current;
              setActiveStroke(activeStrokeRef.current);
              strokeProgressRef.current = 0;
              setStrokeProgress(0);
              setHandDemoDistance(0);
            } else {
              setFinished(true);
              const meanDeviation =
                pathErrorTotal.current / Math.max(1, pathErrorSamples.current);
              const earned = meanDeviation <= 9 ? 3 : meanDeviation <= 16 ? 2 : 1;
              setStars((best) => Math.max(best, earned));
            }
            // Each authored pen motion requires a fresh pointer-down.
            if (canvas.hasPointerCapture(e.pointerId))
              canvas.releasePointerCapture(e.pointerId);
            return;
          }
        }
      }
      if (progressChanged) setStrokeProgress(strokeProgressRef.current);
      return;
    }
    const coords = getCoords(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.strokeStyle = getChalkPalette(canvasRef.current.parentElement).freehand;
    ctx.lineWidth = PEN_SIZE;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    maskCanvasToGlyph(canvasRef.current, charCanvasRef.current);

    lastPoint.current = coords;
  };

  const handleEnd = (e) => {
    e.preventDefault();
    if (drawingPointerId.current !== e.pointerId) return;
    drawingPointerId.current = null;
    lastPoint.current = null;
    setPointerActive(false);
  };

  const handleCheck = () => {
    if (!hasDrawn) return;
    setScore(computeAccuracy(canvasRef.current, charCanvasRef.current));
    setFinished(true);
  };

  const handleReset = () => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, SIZE, SIZE);
    drawingPointerId.current = null;
    lastPoint.current = null;
    setPointerActive(false);
    setHandDemoDistance(0);
    //setHasDrawn(false);
    setFinished(false);
    setHasDrawn(false);
    setScore(0);
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
    const safeScript = (script || "script")
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-");
    const file = new File([blob], `langbridge-${safeScript}-practice.png`, {
      type: "image/png",
    });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `${script || "Script"} handwriting practice`,
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
    guidedActive && !finished && !pointerActive && pathMetrics[activeStroke]
      ? pointAtDistance(
          pathMetrics[activeStroke],
          handDemoDistance,
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
            aria-label={`Close tracing for ${label || "this character"}`}
            onClick={onClose}
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-default)",
              color: "var(--text-primary)",
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
            <div
              ref={glyphDisplayRef}
              style={{
                fontSize: 32,
                fontWeight: fontWeight || (fontFamily ? 400 : 800),
                marginTop: 2,
                fontFamily: fontFamily || "var(--font-body)",
              }}
            >
              {targetReady ? char : label}
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
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-default)",
              color: "var(--text-primary)",
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
            aria-label="Previous character"
            title="Previous character"
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
          <strong aria-current="true" style={{ fontSize: 20, fontFamily, fontWeight }}>
            {targetReady ? char : label}
          </strong>
          <button
            type="button"
            disabled={!nextChar || !onNextCharacter}
            onClick={onNextCharacter}
            style={{
              ...previewButtonStyle,
              opacity: nextChar && onNextCharacter ? 1 : 0.45,
            }}
            aria-label="Next character"
            title="Next character"
          >
            <ArrowRight size={18} aria-hidden="true" />
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
            ? "Begin at the yellow marker. Follow the active stroke in order, lift your finger at each stroke end, then start at the next marker."
            : "Practise freehand over the faint glyph. Ordered stroke guidance is not available for this character yet."}
        </p>
        {hasInvalidPath && (
          <p role="status" style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>
            Saved path data failed validation, so only freehand practice is available.
          </p>
        )}
        {hasMisalignedPath && (
          <p role="status" style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>
            The saved path does not match this rendered glyph, so guided tracing is disabled for this character.
          </p>
        )}
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
          className="handwriting-tracer-board"
          style={{
            position: "relative",
            width: "min(100%, 400px)",
            maxHeight: "min(44vh, 400px)",
            aspectRatio: "1/1",
            flexShrink: 1,
            margin: "0 auto",
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
          {!targetReady && (
            <div
              role={targetError ? "alert" : "status"}
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 4,
                display: "grid",
                placeItems: "center",
                padding: 20,
                background: "rgba(24, 38, 31, 0.96)",
                color: "#f1f5f2",
                fontSize: 14,
                textAlign: "center",
              }}
            >
              {targetError || "Loading the script glyph…"}
            </div>
          )}
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
                fill="var(--tracer-marker-color, #ffd166)"
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
        {guidedActive && (
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
        {guidedActive && (
          <p
            style={{
              margin: "5px 0 0",
              textAlign: "center",
              fontSize: 10,
              color: "var(--text-muted)",
            }}
          >
            {pathDefinition.verificationStatus === "verified"
              ? "Manually verified path. "
              : "Provisional path. "}
            {pathDefinition.verificationNote}{" "}
            {pathDefinition.source && (
              <>
                Reference: <a href={pathDefinition.source} target="_blank" rel="noreferrer">
                  {pathDefinition.sourceAuthor || "source"}
                </a>
                {pathDefinition.sourceLicense && ` · ${pathDefinition.sourceLicense}`}
              </>
            )}
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
              <div
                role="status"
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: "var(--text-primary)",
                }}
              >
                {guidedActive ? "Guided path complete" : "Trace complete"}
              </div>
              <p style={{ margin: "8px 0", color: "var(--text-secondary)" }}>
                {guidedActive
                  ? `Best path tracking: ${stars} of 3 stars.`
                  : `Your trace matched ${score}% of the glyph guide. Keep practising at your own pace.`}
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
                {(!guidedActive || nextChar) && (
                  <button
                    onClick={
                      guidedActive ? onNextCharacter || onNext : onNext
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
                    <ArrowRight size={16} aria-hidden="true" /> Next
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <p
                role="status"
                style={{
                  textAlign: "center",
                  color: "var(--text-secondary)",
                  fontSize: 14,
                  margin: 0,
                }}
              >
                {guidedActive
                  ? `Trace stroke ${Math.min(activeStroke + 1, pathMetrics.length)} of ${pathMetrics.length} from its yellow start marker.`
                  : hasDrawn
                    ? "Your trace is ready for feedback."
                    : "Trace over the faint glyph guide."}
              </p>
              {!guidedActive && (
                <button
                  type="button"
                  onClick={handleCheck}
                  disabled={!targetReady || !hasDrawn}
                  style={{
                    ...buttonStyle,
                    display: "flex",
                    margin: "12px auto 0",
                    opacity: targetReady && hasDrawn ? 1 : 0.5,
                    cursor: targetReady && hasDrawn ? "pointer" : "not-allowed",
                  }}
                >
                  Check trace
                </button>
              )}
            </>
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
