// HandwritingTracer.jsx
import { useRef, useState, useEffect, useCallback } from 'react';
import { X, RotateCcw, Play } from 'lucide-react';

// ---------- SVG Path Parser (supports M, L, Q, C, A, H, V, Z) ----------
function parseSVGPathToPoints(d) {
  if (!d) return [];

  const tokens = d.replace(/,/g, ' ').match(/[MQLCZAHV]|[-\d.]+/g);
  if (!tokens) return [];

  const points = [];
  let currentX = 0, currentY = 0;
  let startX = 0, startY = 0;
  let i = 0;

  while (i < tokens.length) {
    const cmd = tokens[i++];
    if (cmd === 'M') {
      const x = parseFloat(tokens[i++]);
      const y = parseFloat(tokens[i++]);
      currentX = x; currentY = y;
      startX = x; startY = y;
      points.push({ x, y });
    } else if (cmd === 'L') {
      const x = parseFloat(tokens[i++]);
      const y = parseFloat(tokens[i++]);
      const steps = Math.max(2, Math.floor(Math.sqrt((x - currentX) ** 2 + (y - currentY) ** 2) * 20));
      for (let t = 1; t <= steps; t++) {
        const frac = t / steps;
        points.push({
          x: currentX + (x - currentX) * frac,
          y: currentY + (y - currentY) * frac,
        });
      }
      currentX = x; currentY = y;
    } else if (cmd === 'Q') {
      const cx = parseFloat(tokens[i++]);
      const cy = parseFloat(tokens[i++]);
      const x = parseFloat(tokens[i++]);
      const y = parseFloat(tokens[i++]);
      const steps = 20;
      for (let t = 1; t <= steps; t++) {
        const frac = t / steps;
        const u = 1 - frac;
        points.push({
          x: u * u * currentX + 2 * u * frac * cx + frac * frac * x,
          y: u * u * currentY + 2 * u * frac * cy + frac * frac * y,
        });
      }
      currentX = x; currentY = y;
    } else if (cmd === 'C') {
      const c1x = parseFloat(tokens[i++]);
      const c1y = parseFloat(tokens[i++]);
      const c2x = parseFloat(tokens[i++]);
      const c2y = parseFloat(tokens[i++]);
      const x = parseFloat(tokens[i++]);
      const y = parseFloat(tokens[i++]);
      const steps = 30;
      for (let t = 1; t <= steps; t++) {
        const frac = t / steps;
        const u = 1 - frac;
        points.push({
          x: u * u * u * currentX + 3 * u * u * frac * c1x + 3 * u * frac * frac * c2x + frac * frac * frac * x,
          y: u * u * u * currentY + 3 * u * u * frac * c1y + 3 * u * frac * frac * c2y + frac * frac * frac * y,
        });
      }
      currentX = x; currentY = y;
    } else if (cmd === 'A') {
      // Arc: rx ry x-axis-rotation large-arc-flag sweep-flag x y
      const rx = parseFloat(tokens[i++]);
      const ry = parseFloat(tokens[i++]);
      const rot = parseFloat(tokens[i++]) * Math.PI / 180;
      const large = parseFloat(tokens[i++]);
      const sweep = parseFloat(tokens[i++]);
      const ex = parseFloat(tokens[i++]);
      const ey = parseFloat(tokens[i++]);

      // --- Accurate arc sampling ---
      const dx = (currentX - ex) / 2;
      const dy = (currentY - ey) / 2;
      // Rotate to remove rotation
      const cos = Math.cos(-rot);
      const sin = Math.sin(-rot);
      const x1 = cos * dx - sin * dy;
      const y1 = sin * dx + cos * dy;

      let rx2 = rx * rx;
      let ry2 = ry * ry;
      let x1_2 = x1 * x1;
      let y1_2 = y1 * y1;
      // Check if radii are too small
      const lambdaNum = rx2 * ry2 - rx2 * y1_2 - ry2 * x1_2;
      const lambdaDen = rx2 * y1_2 + ry2 * x1_2;
      let lambda = 0;
      if (lambdaDen > 0) {
        const sqrtVal = Math.sqrt(Math.max(0, lambdaNum / lambdaDen));
        lambda = (large === 1) ? sqrtVal : -sqrtVal;
      }
      // Center in local coords
      const cx = lambda * (rx * y1 / ry);
      const cy = -lambda * (ry * x1 / rx);

      // Calculate start and end angles
      const ux = (x1 - cx) / rx;
      const uy = (y1 - cy) / ry;
      const vx = (-x1 - cx) / rx;
      const vy = (-y1 - cy) / ry;
      let theta1 = Math.atan2(uy, ux);
      let deltaTheta = Math.atan2(vy, vx) - Math.atan2(uy, ux);
      if (sweep === 0 && deltaTheta > 0) deltaTheta -= 2 * Math.PI;
      if (sweep === 1 && deltaTheta < 0) deltaTheta += 2 * Math.PI;

      const steps = Math.max(10, Math.ceil(Math.abs(deltaTheta) * 10));
      // Compute points on ellipse (in local coords) and rotate back
      for (let t = 1; t <= steps; t++) {
        const frac = t / steps;
        const angle = theta1 + deltaTheta * frac;
        const lx = rx * Math.cos(angle) + cx;
        const ly = ry * Math.sin(angle) + cy;
        // Rotate back to original orientation and translate
        const px = cos * lx - sin * ly + (currentX + ex) / 2;
        const py = sin * lx + cos * ly + (currentY + ey) / 2;
        points.push({ x: px, y: py });
      }
      currentX = ex; currentY = ey;
    } else if (cmd === 'H') {
      const x = parseFloat(tokens[i++]);
      const steps = Math.max(2, Math.floor(Math.abs(x - currentX) * 20));
      for (let t = 1; t <= steps; t++) {
        const frac = t / steps;
        points.push({ x: currentX + (x - currentX) * frac, y: currentY });
      }
      currentX = x;
    } else if (cmd === 'V') {
      const y = parseFloat(tokens[i++]);
      const steps = Math.max(2, Math.floor(Math.abs(y - currentY) * 20));
      for (let t = 1; t <= steps; t++) {
        const frac = t / steps;
        points.push({ x: currentX, y: currentY + (y - currentY) * frac });
      }
      currentY = y;
    } else if (cmd === 'Z') {
      const x = startX, y = startY;
      const steps = 10;
      for (let t = 1; t <= steps; t++) {
        const frac = t / steps;
        points.push({
          x: currentX + (x - currentX) * frac,
          y: currentY + (y - currentY) * frac,
        });
      }
      currentX = x; currentY = y;
    }
  }
  return points;
}

// ---------- Validation helpers ----------
function resamplePoints(points, targetCount = 20) {
  if (points.length === 0) return [];
  if (points.length === 1) return Array(targetCount).fill(points[0]);
  const totalLen = points.reduce((acc, p, i) => {
    if (i === 0) return 0;
    const dx = p.x - points[i - 1].x,
      dy = p.y - points[i - 1].y;
    return acc + Math.sqrt(dx * dx + dy * dy);
  }, 0);
  const segLen = totalLen / (targetCount - 1);
  const result = [points[0]];
  let accumulated = 0,
    currentIdx = 0;
  for (let i = 1; i < targetCount - 1; i++) {
    const target = i * segLen;
    while (currentIdx < points.length - 1) {
      const dx = points[currentIdx + 1].x - points[currentIdx].x;
      const dy = points[currentIdx + 1].y - points[currentIdx].y;
      const seg = Math.sqrt(dx * dx + dy * dy);
      if (accumulated + seg >= target) {
        const t = (target - accumulated) / seg;
        result.push({
          x: points[currentIdx].x + dx * t,
          y: points[currentIdx].y + dy * t,
        });
        break;
      }
      accumulated += seg;
      currentIdx++;
    }
    if (result.length <= i) result.push(points[points.length - 1]);
  }
  result.push(points[points.length - 1]);
  return result;
}

function validateStroke(userPoints, expectedPoints, tolerance = 0.2) {
  if (!expectedPoints || expectedPoints.length < 2) return { score: 100, distance: 0, direction: 1 };
  const u = resamplePoints(userPoints);
  const e = resamplePoints(expectedPoints);
  let sum = 0;
  for (let i = 0; i < u.length; i++) {
    const dx = u[i].x - e[i].x,
      dy = u[i].y - e[i].y;
    sum += Math.sqrt(dx * dx + dy * dy);
  }
  const avgDist = sum / u.length;
  const distScore = Math.max(0, 1 - avgDist / tolerance) * 100;

  const uVec = { x: u[u.length - 1].x - u[0].x, y: u[u.length - 1].y - u[0].y };
  const eVec = { x: e[e.length - 1].x - e[0].x, y: e[e.length - 1].y - e[0].y };
  const magU = Math.sqrt(uVec.x * uVec.x + uVec.y * uVec.y);
  const magE = Math.sqrt(eVec.x * eVec.x + eVec.y * eVec.y);
  let dir = 0;
  if (magU > 0 && magE > 0) {
    const dot = (uVec.x * eVec.x + uVec.y * eVec.y) / (magU * magE);
    dir = Math.max(0, (dot + 1) / 2);
  }
  const dirScore = dir * 100;
  const score = Math.round(0.7 * distScore + 0.3 * dirScore);
  return { score, distance: avgDist, direction: dir };
}

// ---------- Main Component ----------
const HandwritingTracer = ({ char, strokePaths, onClose, onNext }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStrokeIndex, setCurrentStrokeIndex] = useState(0);
  const [userStrokes, setUserStrokes] = useState([]);
  const [currentPoints, setCurrentPoints] = useState([]);
  const [strokeScores, setStrokeScores] = useState([]);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [showGuide, setShowGuide] = useState(true);
  const [animationPlaying, setAnimationPlaying] = useState(true);
  const [animProgress, setAnimProgress] = useState(0);

  // If no stroke paths, treat as single stroke with no guide
  const safeStrokePaths = strokePaths && strokePaths.length > 0 ? strokePaths : [''];
  const expectedStrokes = safeStrokePaths.map(path => parseSVGPathToPoints(path));
  const totalStrokes = expectedStrokes.length;
  const width = 400, height = 400;

  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height,
    };
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, w, h);

    // Dotted guide
    if (showGuide) {
      ctx.save();
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      expectedStrokes.forEach((pts) => {
        if (pts.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(pts[0].x * w, pts[0].y * h);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x * w, pts[i].y * h);
        }
        ctx.stroke();
      });
      ctx.restore();
    }

    // --- GREEN ANIMATED STROKE COMMENTED OUT ---
    /*
    if (animationPlaying) {
      ctx.save();
      ctx.strokeStyle = '#4CAF50';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const pts = expectedStrokes[currentStrokeIndex] || [];
      if (pts.length > 1) {
        const totalLen = pts.reduce((acc, p, i) => {
          if (i === 0) return 0;
          const dx = p.x - pts[i - 1].x,
            dy = p.y - pts[i - 1].y;
          return acc + Math.sqrt(dx * dx + dy * dy);
        }, 0);
        ctx.setLineDash([totalLen, totalLen]);
        ctx.lineDashOffset = totalLen * (1 - animProgress);
        ctx.beginPath();
        ctx.moveTo(pts[0].x * w, pts[0].y * h);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x * w, pts[i].y * h);
        }
        ctx.stroke();
      }
      ctx.restore();
    }
    */

    // Completed user strokes
    ctx.save();
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    userStrokes.forEach((pts, idx) => {
      if (pts.length < 2) return;
      const isCorrect = strokeScores[idx] >= 70;
      ctx.strokeStyle = isCorrect ? '#4caf50' : '#f44336';
      ctx.beginPath();
      ctx.moveTo(pts[0].x * w, pts[0].y * h);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x * w, pts[i].y * h);
      }
      ctx.stroke();
    });
    ctx.restore();

    // Current stroke (cyan)
    if (isDrawing && currentPoints.length > 1) {
      ctx.save();
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(currentPoints[0].x * w, currentPoints[0].y * h);
      for (let i = 1; i < currentPoints.length; i++) {
        ctx.lineTo(currentPoints[i].x * w, currentPoints[i].y * h);
      }
      ctx.stroke();
      ctx.restore();
    }
  }, [expectedStrokes, currentStrokeIndex, userStrokes, currentPoints, isDrawing, strokeScores, showGuide, animationPlaying, animProgress]);

  useEffect(() => { draw(); }, [draw]);

  // Animate current stroke
  useEffect(() => {
    if (!animationPlaying) return;
    const duration = 1500;
    let startTime = null;
    let frameId = null;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setAnimProgress(progress);
      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      } else {
        setAnimationPlaying(false);
        setAnimProgress(1);
      }
    };
    frameId = requestAnimationFrame(animate);
    return () => { if (frameId) cancelAnimationFrame(frameId); };
  }, [animationPlaying]); 

  // We do NOT need a reset useEffect because Basics.jsx passes a unique key={practiceChar}
  // which forces this component to remount completely when the character changes.

  const handleStart = (e) => {
    e.preventDefault();
    if (finished || animationPlaying) return;
    setIsDrawing(true);
    const coords = getCanvasCoords(e);
    setCurrentPoints([coords]);
  };

  const handleMove = (e) => {
    e.preventDefault();
    if (!isDrawing || finished || animationPlaying) return;
    const coords = getCanvasCoords(e);
    setCurrentPoints(prev => [...prev, coords]);
  };

  const handleEnd = (e) => {
    e.preventDefault();
    if (!isDrawing || finished || animationPlaying) return;
    setIsDrawing(false);

    if (currentPoints.length < 3) {
      setCurrentPoints([]);
      return;
    }

    const expected = expectedStrokes[currentStrokeIndex] || [];
    const { score: strokeScore } = validateStroke(currentPoints, expected, 0.2);

    const newScores = [...strokeScores, strokeScore];
    const newStrokes = [...userStrokes, currentPoints];
    setUserStrokes(newStrokes);
    setStrokeScores(newScores);
    setCurrentPoints([]);

    if (currentStrokeIndex + 1 >= totalStrokes) {
      const avg = newScores.reduce((a, b) => a + b, 0) / newScores.length;
      setScore(Math.round(avg));
      setFinished(true);
    } else {
      setCurrentStrokeIndex(currentStrokeIndex + 1);
      setAnimationPlaying(true);
      setAnimProgress(0);
    }
  };

  const resetChar = () => {
    setUserStrokes([]);
    setStrokeScores([]);
    setCurrentPoints([]);
    setCurrentStrokeIndex(0);
    setFinished(false);
    setScore(0);
    setAnimationPlaying(true);
    setAnimProgress(0);
  };

  const replayAnimation = () => {
    setAnimationPlaying(true);
    setAnimProgress(0);
  };

  const getStars = (score) => {
    if (score >= 90) return '★★★★★';
    if (score >= 70) return '★★★★☆';
    if (score >= 50) return '★★★☆☆';
    if (score >= 30) return '★★☆☆☆';
    return '★☆☆☆☆';
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: '#111', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      padding: '20px', color: '#fff'
    }}>
      <div style={{ width: '100%', maxWidth: 500, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
          <X size={24} />
        </button>
        <div style={{ fontSize: 28, fontWeight: 'bold' }}>{char}</div>
        <div>
          <button onClick={replayAnimation} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', marginRight: 8 }} title="Replay demo">
            <Play size={20} />
          </button>
          <button onClick={resetChar} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
            <RotateCcw size={20} />
          </button>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          width: '100%', maxWidth: 400, height: 'auto', aspectRatio: '1/1',
          border: '2px solid #333', borderRadius: 12,
          touchAction: 'none', background: '#0a0a0a'
        }}
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
      />

      {finished ? (
        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 48, fontWeight: 'bold' }}>{score}</div>
          <div style={{ fontSize: 24, letterSpacing: 4 }}>{getStars(score)}</div>
          <div style={{ marginTop: 12, display: 'flex', gap: 16 }}>
            <button onClick={resetChar} style={{ padding: '8px 20px', background: '#444', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer' }}>Retry</button>
            <button onClick={onNext} style={{ padding: '8px 20px', background: '#4caf50', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer' }}>Next</button>
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 12, fontSize: 14, color: '#aaa' }}>
          {animationPlaying ? 'Watching demo...' : `Stroke ${currentStrokeIndex + 1} of ${totalStrokes}`}
        </div>
      )}

      <div style={{ marginTop: 8 }}>
        <label style={{ color: '#aaa', fontSize: 12 }}>
          <input type="checkbox" checked={showGuide} onChange={() => setShowGuide(!showGuide)} />
          Show guide
        </label>
      </div>
    </div>
  );
};

export default HandwritingTracer;