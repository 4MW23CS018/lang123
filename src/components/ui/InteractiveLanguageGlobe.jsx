import { useEffect, useRef } from 'react';
import { useTheme } from '../hooks/useTheme';

export default function InteractiveLanguageGlobe() {
  const canvasRef = useRef(null);
  const { isDark } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let animationFrameId;
    const dpr = window.devicePixelRatio || 1;
    const size = 440;
    const width = (canvas.width = size * dpr);
    const height = (canvas.height = size * dpr);
    const radius = 135 * dpr;

    // Mouse tracking
    let mouse = { targetX: 0, targetY: 0 };
    let rotation = { x: 0.25, y: 0.5 };
    let clicks = [];

    // Create 3D particles on sphere surface
    const numParticles = 115;
    const particles = [];
    const charList = ['ಅ', 'அ', 'అ', 'അ', 'ಕ', 'க', 'க', 'ഗ', '⚡', '✨', '🎯', '💬'];

    for (let i = 0; i < numParticles; i++) {
      const phi = Math.acos(-1 + (2 * i) / numParticles);
      const theta = Math.sqrt(numParticles * Math.PI) * phi;
      particles.push({
        baseX: radius * Math.cos(theta) * Math.sin(phi),
        baseY: radius * Math.sin(theta) * Math.sin(phi),
        baseZ: radius * Math.cos(phi),
        size: Math.random() * 2.2 + 1.8,
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

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;
      mouse.targetX = (clientX - rect.width / 2) * 0.0028;
      mouse.targetY = (clientY - rect.height / 2) * 0.0028;
    };

    const handleClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      clicks.push({
        x: (e.clientX - rect.left) * dpr,
        y: (e.clientY - rect.top) * dpr,
        radius: 0,
        maxRadius: 160 * dpr,
        alpha: 1,
      });
    };

    const parent = canvas.parentElement || window;
    parent.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);

    const render = () => {
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
        c.radius += 5 * dpr;
        c.alpha -= 0.025;
        if (c.alpha <= 0) {
          clicks.splice(idx, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${primaryDotColor}, ${c.alpha * 0.75})`;
        ctx.lineWidth = 2 * dpr;
        ctx.stroke();
      }

      // Project particles to 2D
      const projected = [];
      particles.forEach((p) => {
        let x1 = p.baseX * cosY - p.baseZ * sinY;
        let z1 = p.baseZ * cosY + p.baseX * sinY;

        let y1 = p.baseY * cosX - z1 * sinX;
        let z2 = z1 * cosX + p.baseY * sinX;

        const scale = 320 / (320 + z2);
        const px = cx + x1 * scale;
        const py = cy + y1 * scale;

        projected.push({ x: px, y: py, z: z2, scale, char: p.char, size: p.size });
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
            if (dist < 55 * dpr) {
              const alpha = (1 - dist / (55 * dpr)) * (isDark ? 0.24 : 0.28) * p1.scale;
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
        const alpha = Math.max(0.15, (p.z + radius) / (2 * radius));
        if (p.char) {
          ctx.font = `800 ${Math.round(14 * p.scale * dpr)}px system-ui, -apple-system, sans-serif`;
          ctx.fillStyle = `rgba(${primaryDotColor}, ${alpha * (isDark ? 0.95 : 0.9)})`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(p.char, p.x, p.y);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * p.scale * dpr, 0, Math.PI * 2);
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
        const scale = 320 / (320 + bz);
        const alpha = Math.max(0.45, (bz + radius) / (2 * radius));
        const badgeColor = isDark ? b.darkColor : b.color;

        ctx.save();
        ctx.font = `700 ${Math.round(12.5 * scale * dpr)}px system-ui, -apple-system, sans-serif`;
        const textWidth = ctx.measureText(b.text).width;
        const padX = 11 * dpr;
        const padY = 5.5 * dpr;

        const bw = textWidth + padX * 2;
        const bh = 18 * dpr + padY * 2;
        const bx0 = bx - bw / 2;
        const by0 = by - bh / 2;

        // Shadow for Light mode
        if (!isDark) {
          ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
          ctx.shadowBlur = 8 * dpr;
          ctx.shadowOffsetY = 2 * dpr;
        }

        // Badge Pill Background (Adaptive)
        ctx.fillStyle = isDark ? `rgba(18, 20, 29, ${alpha * 0.92})` : `rgba(255, 255, 255, ${alpha * 0.95})`;
        ctx.strokeStyle = isDark ? `${badgeColor}${Math.round(alpha * 220).toString(16).padStart(2, '0')}` : `${badgeColor}60`;
        ctx.lineWidth = (isDark ? 1.5 : 1.8) * dpr;

        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(bx0, by0, bw, bh, 10 * dpr);
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

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      parent.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
    };
  }, [isDark]);

  return (
    <div style={{ position: 'relative', width: 440, height: 440, margin: '0 auto', cursor: 'grab' }}>
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
