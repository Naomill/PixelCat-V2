import { useEffect, useRef, useState } from 'react'

const FPS_OPTIONS = [4, 8, 12, 24]

export default function AnimationPreview({ frames, fps, onSetFps }) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const intervalRef = useRef(null)

  useEffect(() => { setCurrentIdx(0) }, [frames.length])

  useEffect(() => {
    clearInterval(intervalRef.current)
    if (!isPlaying || frames.length === 0) return
    intervalRef.current = setInterval(() => {
      setCurrentIdx(prev => (prev + 1) % frames.length)
    }, 1000 / fps)
    return () => clearInterval(intervalRef.current)
  }, [frames, fps, isPlaying])

  const currentFrame = frames.length > 0 ? frames[Math.min(currentIdx, frames.length - 1)] : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      {/* Preview area */}
      <div
        style={{
          flex: 1,
          background: '#fff',
          border: '2px solid #C8C4B8',
          margin: 12,
          marginBottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          minHeight: 280,
          overflow: 'hidden',
        }}
      >
        {currentFrame ? (
          <img
            src={currentFrame.dataUrl}
            alt={`Frame ${currentIdx + 1}`}
            className="pixel-canvas"
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', imageRendering: 'pixelated' }}
          />
        ) : (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <img
              src="/NoFrameContentIcon.png"
              alt=""
              style={{ width: 80, imageRendering: 'pixelated', opacity: 0.85 }}
            />
            <div style={{ fontSize: 12, color: '#8A8A7A' }}>Add frames to preview animation</div>
          </div>
        )}

        {/* Frame counter */}
        {frames.length > 0 && (
          <div style={{
            position: 'absolute',
            bottom: 6,
            right: 8,
            fontSize: 11,
            color: '#888',
            background: 'rgba(255,255,255,0.85)',
            padding: '1px 6px',
            border: '1px solid #ccc',
          }}>
            {currentIdx + 1} / {frames.length}
          </div>
        )}
      </div>

      {/* FPS controls */}
      <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, fontWeight: 'bold', color: '#6A6A5A', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: 4 }}>FPS</span>

        {/* Play/Pause */}
        <button
          onClick={() => setIsPlaying(p => !p)}
          style={{
            padding: '4px 10px',
            fontSize: 12,
            fontWeight: 'bold',
            border: '2px solid #C8C4B8',
            background: isPlaying ? '#555' : 'transparent',
            color: isPlaying ? 'white' : '#333',
            cursor: 'pointer',
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          {isPlaying ? '⏸' : '▶'} {isPlaying ? 'Pause' : 'Play'}
        </button>

        {FPS_OPTIONS.map(f => (
          <button
            key={f}
            onClick={() => onSetFps(f)}
            style={{
              padding: '4px 10px',
              fontSize: 12,
              fontWeight: 'bold',
              border: `2px solid ${fps === f ? '#222' : '#C8C4B8'}`,
              background: fps === f ? '#333' : 'transparent',
              color: fps === f ? 'white' : '#333',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {f}
          </button>
        ))}
      </div>
    </div>
  )
}
