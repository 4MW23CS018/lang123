// HandwritingTracer.jsx — Font-rendered guide + freehand canvas tracing
import { useRef, useState, useEffect, useCallback } from 'react';
import { X, RotateCcw, Eraser } from 'lucide-react';

// ── Accuracy scoring ──
// Compares user-drawn pixels against the character outline pixels
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

  // Update debug stats
  const debugEl = document.getElementById('debug-stats');
  if (debugEl) {
    debugEl.innerHTML = `
      charPixels: ${charPixels}<br/>
      userPixels: ${userPixels}<br/>
      userOnChar: ${userOnChar}<br/>
      expectedCov: ${Math.round(expectedUserPixels)}<br/>
      Coverage: ${(coverage * 100).toFixed(1)}%<br/>
      Precision: ${(precision * 100).toFixed(1)}%
    `;
  }

  return finalScore;
}

// ── Main Component ──
const HandwritingTracer = ({ char, onClose, onNext }) => {
  const canvasRef = useRef(null);       // User drawing canvas
  const charCanvasRef = useRef(null);   // Hidden canvas with character rendered as font
  const guideCanvasRef = useRef(null);  // Visible guide canvas (outline of character)
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [showGuide, setShowGuide] = useState(true);
  const lastPoint = useRef(null);

  const SIZE = 400;

  // Render the character as a font glyph onto hidden + guide canvases
  useEffect(() => {
    const FONT = `bold ${SIZE * 0.65}px 'Noto Sans Kannada', 'Noto Sans Tamil', 'Noto Sans Telugu', 'Noto Sans Malayalam', sans-serif`;

    // Wait for fonts to be ready before rendering to canvas
    document.fonts.ready.then(() => {
      // ── Hidden character canvas (Fat Hitbox for scoring) ──
      const charCanvas = charCanvasRef.current;
      if (!charCanvas) return;
      const charCtx = charCanvas.getContext('2d');
      charCanvas.width = SIZE;
      charCanvas.height = SIZE;
      charCtx.clearRect(0, 0, SIZE, SIZE);

      charCtx.font = FONT;
      charCtx.textAlign = 'center';
      charCtx.textBaseline = 'middle';

      // Draw the exact character shape (NO thick stroke, otherwise loops close into a solid blob!)
      charCtx.fillStyle = 'rgba(255,255,255,1)';
      charCtx.fillText(char, SIZE / 2, SIZE / 2 + 10);

      // ── Visible guide canvas (dashed outline) ──
      const guideCanvas = guideCanvasRef.current;
      if (!guideCanvas) return;
      const guideCtx = guideCanvas.getContext('2d');
      guideCanvas.width = SIZE;
      guideCanvas.height = SIZE;
      guideCtx.clearRect(0, 0, SIZE, SIZE);

      // Draw a light filled version as background guide
      guideCtx.font = FONT;
      guideCtx.textAlign = 'center';
      guideCtx.textBaseline = 'middle';
      guideCtx.fillStyle = 'rgba(255,255,255,0.08)';
      guideCtx.fillText(char, SIZE / 2, SIZE / 2 + 10);

      // Draw a dashed outline — the main tracing guide
      guideCtx.lineWidth = 3;
      guideCtx.strokeStyle = 'rgba(255,255,255,0.35)';
      guideCtx.setLineDash([8, 6]);
      guideCtx.strokeText(char, SIZE / 2, SIZE / 2 + 10);

      // Clear the user drawing canvas
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = SIZE;
        canvas.height = SIZE;
      }
    });
  }, [char]);

  const getCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (SIZE / rect.width),
      y: (clientY - rect.top) * (SIZE / rect.height),
    };
  };

  const handleStart = (e) => {
    e.preventDefault();
    if (finished) return;
    setIsDrawing(true);
    setHasDrawn(true);
    const coords = getCoords(e);
    lastPoint.current = coords;

    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.arc(coords.x, coords.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#00e5ff';
    ctx.fill();
  };

  const handleMove = (e) => {
    e.preventDefault();
    if (!isDrawing || finished) return;
    const coords = getCoords(e);
    const ctx = canvasRef.current.getContext('2d');

    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();

    lastPoint.current = coords;
  };

  const handleEnd = (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    setIsDrawing(false);
    lastPoint.current = null;
  };

  const handleCheck = () => {
    if (!hasDrawn) return;
    const accuracy = computeAccuracy(canvasRef.current, charCanvasRef.current);
    setScore(accuracy);
    setFinished(true);
  };

  const handleReset = () => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, SIZE, SIZE);
    setHasDrawn(false);
    setFinished(false);
    setScore(0);
    lastPoint.current = null;
  };

  const getStars = (s) => {
    if (s >= 90) return '★★★★★';
    if (s >= 70) return '★★★★☆';
    if (s >= 50) return '★★★☆☆';
    if (s >= 30) return '★★☆☆☆';
    return '★☆☆☆☆';
  };

  const getFeedback = (s) => {
    if (s >= 90) return { text: 'Perfect!', color: '#4caf50' };
    if (s >= 70) return { text: 'Great job!', color: '#8bc34a' };
    if (s >= 50) return { text: 'Good effort!', color: '#ff9800' };
    if (s >= 30) return { text: 'Keep practicing!', color: '#ff5722' };
    return { text: 'Try again', color: '#f44336' };
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      padding: '20px', color: '#fff',
    }}>
      {/* Header */}
      <div style={{ width: '100%', maxWidth: 460, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', cursor: 'pointer', borderRadius: 10, padding: '8px 10px', display: 'flex', alignItems: 'center' }}>
          <X size={20} />
        </button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Trace the character</div>
          <div style={{ fontSize: 32, fontWeight: 'bold', marginTop: 2 }}>{char}</div>
        </div>
        <button onClick={handleReset} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', cursor: 'pointer', borderRadius: 10, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Eraser size={18} />
        </button>
      </div>

      {/* Canvas area */}
      <div style={{
        position: 'relative', width: '100%', maxWidth: 400, aspectRatio: '1/1',
        background: 'rgba(10,10,10,0.95)', borderRadius: 16,
        border: '2px solid rgba(255,255,255,0.12)', overflow: 'hidden',
      }}>
        {/* Guide canvas (background layer) */}
        <canvas
          ref={guideCanvasRef}
          style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            pointerEvents: 'none', zIndex: 1,
            opacity: showGuide ? 1 : 0,
            transition: 'opacity 0.3s',
          }}
        />

        {/* User drawing canvas (top layer, transparent bg) */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'relative', width: '100%', height: '100%',
            touchAction: 'none', background: 'transparent', zIndex: 2,
            cursor: finished ? 'default' : 'crosshair',
          }}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
        />
      </div>

      {/* Controls */}
      <div style={{ marginTop: 20, width: '100%', maxWidth: 400 }}>
        {finished ? (
          <div style={{ textAlign: 'center', animation: 'fadeUp 0.3s ease-out both' }}>
            <div style={{ fontSize: 56, fontWeight: 800, color: getFeedback(score).color, lineHeight: 1 }}>{score}%</div>
            <div style={{ fontSize: 22, letterSpacing: 4, marginTop: 6, color: '#fbbf24' }}>{getStars(score)}</div>
            <div style={{ fontSize: 16, color: getFeedback(score).color, fontWeight: 600, marginTop: 6 }}>{getFeedback(score).text}</div>
            <div style={{ marginTop: 16, display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={handleReset} style={{
                padding: '10px 24px', background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12,
                color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                transition: 'all 0.2s',
              }}>
                <RotateCcw size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Retry
              </button>
              <button onClick={onNext} style={{
                padding: '10px 24px', background: '#4caf50',
                border: 'none', borderRadius: 12,
                color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                transition: 'all 0.2s',
              }}>
                Next →
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <button
              onClick={handleCheck}
              disabled={!hasDrawn}
              style={{
                width: '100%', padding: '14px',
                background: hasDrawn ? 'linear-gradient(135deg, #00e5ff, #00b0ff)' : 'rgba(255,255,255,0.06)',
                border: 'none', borderRadius: 14,
                color: hasDrawn ? '#000' : '#555',
                fontSize: 16, fontWeight: 800, cursor: hasDrawn ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
                letterSpacing: '0.5px',
              }}
            >
              ✨ Check My Tracing
            </button>
            <p style={{ color: '#666', fontSize: 13, margin: 0 }}>
              {hasDrawn ? 'Tap to check your accuracy' : 'Draw over the guide character'}
            </p>
          </div>
        )}
      </div>

      {/* Guide toggle */}
      <div style={{ marginTop: 14 }}>
        <label style={{ color: '#666', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={showGuide} onChange={() => setShowGuide(!showGuide)} style={{ accentColor: '#00e5ff' }} />
          Show guide
        </label>
      </div>

      {/* Debug view: show the hidden scoring canvas and stats */}
      <div style={{ marginTop: 20, width: '100%', maxWidth: 400, background: '#222', padding: 12, borderRadius: 8, fontSize: 12, fontFamily: 'monospace' }}>
        <div style={{ marginBottom: 8, fontWeight: 'bold' }}>DEBUG: Scoring Canvas</div>
        <div style={{ display: 'flex', gap: 12 }}>
          <canvas 
            ref={charCanvasRef} 
            style={{ width: 100, height: 100, border: '1px solid #f00', background: '#000' }} 
          />
          <div>
            <div>Score: {score}%</div>
            <div id="debug-stats">
              Stats will appear here after checking.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HandwritingTracer;