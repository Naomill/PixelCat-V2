import { useEffect, useRef, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPause, faPlay } from '@fortawesome/free-solid-svg-icons'

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

  // Empty state — no frames yet
  if (frames.length === 0) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: 24,
      }}>
        <img
          src="/NoFrameContentIcon.png"
          alt=""
          style={{ width: 52, imageRendering: 'pixelated' }}
        />
        <div style={{ fontSize: 13, color: '#8A8A7A' }}>Add frames to preview animation</div>
      </div>
    )
  }

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
        <img
          src={currentFrame.dataUrl}
          alt={`Frame ${currentIdx + 1}`}
          className="pixel-canvas"
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', imageRendering: 'pixelated' }}
        />

        {/* Frame counter */}
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
      </div>

      {/* FPS controls */}
      <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, fontWeight: 'bold', color: '#6A6A5A', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: 4 }}>FPS</span>

        <button
          onClick={() => setIsPlaying(p => !p)}
          className={isPlaying ? 'btn-pixel-active' : 'btn-pixel'}
          style={{ width: 44, height: 44, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
        </button>

        {FPS_OPTIONS.map(f => (
          <button
            key={f}
            onClick={() => onSetFps(f)}
            className={fps === f ? 'btn-pixel-active' : 'btn-pixel'}
            style={{ width: 44, height: 44, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >
            {f}
          </button>
        ))}
      </div>
    </div>
  )
}
