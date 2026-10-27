// src/components/speech/WaveformVisualizer.jsx
export default function WaveformVisualizer({ isRecording }) {
  if (!isRecording) return null;

  const bars = [3, 5, 8, 6, 9, 7, 4, 8, 5, 3, 6, 9, 5, 7, 4];

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', height: '32px' }}>
      {bars.map((h, i) => (
        <div
          key={i}
          style={{
            width: '3px',
            height: `${h * 3}px`,
            borderRadius: '999px',
            background: '#ef4444',
            animation: `wavebar 0.8s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.06}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes wavebar {
          from { transform: scaleY(0.3); opacity: 0.5; }
          to   { transform: scaleY(1);   opacity: 1; }
        }
      `}</style>
    </div>
  );
}