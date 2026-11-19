import { useEffect, useRef } from 'react';
import { useTheme } from '../hooks/useTheme';

export default function InteractiveLanguageGlobe() {
  const canvasRef = useRef(null);
  const { isDark } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5); // Cap DPR at 2.5 for mobile performance
    const rect = canvas.getBoundingClientRect();
    const baseSize = Math.max(260, Math.min(420, rect.width || 380));
    
    const width = (canvas.width = baseSize * dpr);
    const height = (canvas.height = baseSize * dpr);
    const radius = baseSize * 0.3 * dpr;
    const focalLength = radius * 2.8;

    // Mouse & Touch tracking
    let mouse = { targetX: 0, targetY: 0 };
    let rotation = { x: 0.25, y: 0.5 };
    let clicks = [];

    // Create 3D particles on sphere surface
    const numParticles = 110;
    const particles = [];
    const charList = ['ಅ', 'அ', 'అ', 'അ', 'ಕ', 'க', 'క', 'ഗ', '⚡', '✨', '🎯', '💬'];

    for (let i = 0; i < numParticles; i++) {
      const phi = Math.acos(-1 + (2 * i) / numParticles);
      const theta = Math.sqrt(numParticles * Math.PI) * phi;
      particles.push({
        baseX: radius * Math.cos(theta) * Math.sin(phi),
        baseY: radius * Math.sin(theta) * Math.sin(phi),
        baseZ: radius * Math.cos(phi),
        size: Math.random() * 2.0 + 1.8,
        char: i % 7 === 0 ? charList[i % charList.length] : null,
      });
    }

    // Language floating badges in 3D orbit
    const badges = [
      { text: 'ಕನ್ನಡ', angle: 0, speed: 0.006, r: radius * 1.25, color: '#16a34a', darkColor: '#22c55e' },
      { text: 'தமிழ்', angle: Math.PI / 2, speed: 0.006, r: radius * 1.25, color: '#7c3aed', darkColor: '#a78bfa' },
      { text: 'తెలుగు', angle: Math.PI, speed: 0.006, r: radius * 1.25, color: '#d97706', darkColor: '#fbbf24' },
      { text: 'മലയാളം', angle: (3 * Math.PI) / 2, speed: 0.006, r: radius * 1.25, color: '#e11d48', darkColor: '#fb7185' },
    ];

    const handlePointerMove = (clientX, clientY) => {
      const bounds = canvas.getBoundingClientRect();
      const x = clientX - bounds.left;
      const y = clientY - bounds.top;
      mouse.targetX = (x - bounds.width / 2) * 0.0028;
      mouse.targetY = (y - bounds.height / 2) * 0.0028;
    };

    const handleMouseMove = (e) => handlePointerMove(e.clientX, e.clientY);
    const handleTouchMove = (e) => {
      if (e.touches && e.touches[0]) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleClick = (e) => {
      const bounds = canvas.getBoundingClientRect();
      clicks.push({
        x: (e.clientX - bounds.left) * dpr,
        y: (e.clientY - bounds.top) * dpr,
        radius: 0,
        maxRadius: 140 * dpr,
        alpha: 1,
      });
    };

    const parent = canvas.parentElement || window;
    parent.addEventListener('mousemove', handleMouseMove, { passive: true });
    parent.addEventListener('touchmove', handleTouchMove, { passive: true });
    canvas.addEventListener('click', handleClick);

    const render = () => {
      try {
        ctx.clearRect(0, 0, width, height);

        // Smooth rotation dampening & continuous slow spin
        rotation.x += (mouse.targetY - rotation.x) * 0.05;
        rotation.y += (mouse.targetX - rotation.y) * 0.05;
        rotation.y += 0.004;

        const cx = width / 2;
        const cy = height / 2;

        const cosX = Math.cos(rotation.x);
        const sinX = Math.sin(rotation.x);
        const cosY = Math.cos(rotation.y);
        const sinY = Math.sin(rotation.y);

        // Theme Colors
        const primaryDotColor = isDark ? '34, 197, 94' : '22, 163, 74';
        const lineBaseColor = isDark ? '34, 197, 94' : '5, 150, 105';

        // Render shockwave click pulses
        for (let idx = clicks.length - 1; idx >= 0; idx--) {
          const c = clicks[idx];
          c.radius += 4 * dpr;
          c.alpha -= 0.025;
          if (c.alpha <= 0) {
            clicks.splice(idx, 1);
            continue;
          }
          ctx.beginPath();
          ctx.arc(c.x, c.y, Math.max(0.1, c.radius), 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${primaryDotColor}, ${Math.max(0, c.alpha * 0.75)})`;
          ctx.lineWidth = 2 * dpr;
          ctx.stroke();
        }

        // Project particles to 2D with safe focal perspective
        const projected = [];
        particles.forEach((p) => {
          let x1 = p.baseX * cosY - p.baseZ * sinY;
          let z1 = p.baseZ * cosY + p.baseX * sinY;

          let y1 = p.baseY * cosX - z1 * sinX;
          let z2 = z1 * cosX + p.baseY * sinX;

          const dist = focalLength + z2;
          const scale = dist > 10 ? focalLength / dist : 0.1;
          const safeScale = Math.max(0.08, Math.min(2.5, scale));

          const px = cx + x1 * safeScale;
          const py = cy + y1 * safeScale;

          projected.push({ x: px, y: py, z: z2, scale: safeScale, char: p.char, size: p.size });
        });

        // Draw connecting lines between front particles
        ctx.lineWidth = 1 * dpr;
        for (let i = 0; i < projected.length; i++) {
          for (let j = i + 1; j < projected.length; j++) {
            const p1 = projected[i];
            const p2 = projected[j];
            if (p1.z > -40 && p2.z > -40) {
              const dx = p1.x - p2.x;
              const dy = p1.y - p2.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < 50 * dpr) {
                const alpha = Math.max(0, (1 - dist / (50 * dpr)) * (isDark ? 0.22 : 0.25) * p1.scale);
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.strokeStyle = `rgba(${lineBaseColor}, ${alpha})`;
                ctx.stroke();
              }
            }
          }
        }

        // Draw particles & glyphs
        projected.sort((a, b) => a.z - b.z);
        projected.forEach((p) => {
          const alpha = Math.max(0.12, Math.min(1, (p.z + radius) / (2 * radius)));
          if (p.char) {
            ctx.font = `800 ${Math.max(8, Math.round(13 * p.scale * dpr))}px system-ui, -apple-system, sans-serif`;
            ctx.fillStyle = `rgba(${primaryDotColor}, ${alpha * (isDark ? 0.95 : 0.9)})`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(p.char, p.x, p.y);
          } else {
            const arcR = Math.max(0.5, p.size * p.scale * dpr);
            ctx.beginPath();
            ctx.arc(p.x, p.y, arcR, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${primaryDotColor}, ${alpha * (isDark ? 0.8 : 0.75)})`;
            ctx.fill();
          }
        });

        // Render orbiting Language Badges
        badges.forEach((b) => {
          b.angle += b.speed;
          const bx = cx + Math.cos(b.angle) * b.r * cosY;
          const bz = Math.sin(b.angle) * b.r * sinY;
          const by = cy + Math.sin(b.angle * 0.7) * (b.r * 0.35) * cosX;
          
          const dist = focalLength + bz;
          const scale = dist > 10 ? focalLength / dist : 0.1;
          const safeScale = Math.max(0.1, Math.min(2.5, scale));
          const alpha = Math.max(0.35, Math.min(1, (bz + radius) / (2 * radius)));
          const badgeColor = isDark ? b.darkColor : b.color;

          ctx.save();
          ctx.font = `700 ${Math.max(9, Math.round(12 * safeScale * dpr))}px system-ui, -apple-system, sans-serif`;
          const textWidth = ctx.measureText(b.text).width;
          const padX = 10 * dpr;
          const padY = 5 * dpr;

          const bw = Math.max(20, textWidth + padX * 2);
          const bh = Math.max(16, 17 * dpr + padY * 2);
          const bx0 = bx - bw / 2;
          const by0 = by - bh / 2;

          if (!isDark) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
            ctx.shadowBlur = 6 * dpr;
            ctx.shadowOffsetY = 2 * dpr;
          }

          // Badge Pill Background
          ctx.fillStyle = isDark ? `rgba(18, 20, 29, ${alpha * 0.92})` : `rgba(255, 255, 255, ${alpha * 0.95})`;
          const hexAlpha = Math.min(255, Math.max(0, Math.round(alpha * 220))).toString(16).padStart(2, '0');
          ctx.strokeStyle = isDark ? `${badgeColor}${hexAlpha}` : `${badgeColor}70`;
          ctx.lineWidth = (isDark ? 1.5 : 1.8) * dpr;

          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(bx0, by0, bw, bh, 9 * dpr);
          } else {
            ctx.rect(bx0, by0, bw, bh);
          }
          ctx.fill();
          ctx.stroke();

          // Reset shadow for text
          ctx.shadowColor = 'transparent';

          // Badge Text
          ctx.fillStyle = badgeColor;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(b.text, bx, by);
          ctx.restore();
        });
      } catch (renderError) {
        console.warn('[InteractiveLanguageGlobe] Render frame skipped:', renderError);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      parent.removeEventListener('mousemove', handleMouseMove);
      parent.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('click', handleClick);
    };
  }, [isDark]);

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 420, aspectRatio: '1/1', margin: '0 auto', cursor: 'grab', touchAction: 'none' }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />
    </div>
  );
}
