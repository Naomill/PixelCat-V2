import { useEffect, useRef, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPause, faPlay, faBackward, faForward } from '@fortawesome/free-solid-svg-icons'

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
  const totalMs = frames.length > 0 ? Math.round((1000 / fps) * frames.length) : 0

  if (frames.length === 0) {
    return (
      <div className="anim-preview-area" style={{ flex: 1 }}>
        <div className="empty-state">
          <img
            src="/NoFrameContentIcon.png"
            alt=""
            style={{ width: 52, imageRendering: 'pixelated' }}
          />
          <div className="empty-label">Add frames to preview<br />animation</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Preview area */}
      <div className="anim-preview-area" style={{ flex: 1 }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img
            src={currentFrame.dataUrl}
            alt={`Frame ${currentIdx + 1}`}
            className="pixel-canvas"
            style={{
              maxWidth: '100%',
              maxHeight: '260px',
              objectFit: 'contain',
              imageRendering: 'pixelated',
              display: 'block',
              border: '2px solid var(--upload-border)',
              boxShadow: '3px 3px 0 #000',
            }}
          />
          {frames.length > 1 && (
            <div style={{
              position: 'absolute',
              bottom: 4,
              right: 4,
              fontSize: '5px',
              color: '#fff',
              background: 'rgba(0,0,0,0.65)',
              padding: '2px 5px',
              fontFamily: 'var(--pixel-font)',
            }}>
              {currentIdx + 1} / {frames.length}
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="anim-controls">
        <button
          className="px-btn sm"
          onClick={() => setCurrentIdx(f => Math.max(0, f - 1))}
        >
          <FontAwesomeIcon icon={faBackward} />
        </button>
        <button
          className={`px-btn sm ${isPlaying ? 'active' : ''}`}
          onClick={() => setIsPlaying(p => !p)}
        >
          <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
          {' '}{isPlaying ? 'Pause' : 'Play'}
        </button>
        <button
          className="px-btn sm"
          onClick={() => setCurrentIdx(f => (f + 1) % Math.max(1, frames.length))}
        >
          <FontAwesomeIcon icon={faForward} />
        </button>
        <div className="fps-label">
          FPS:
          {FPS_OPTIONS.map(f => (
            <button
              key={f}
              onClick={() => onSetFps(f)}
              className={`px-btn sm ${fps === f ? 'active' : ''}`}
              style={{ padding: '4px 8px' }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Status bar */}
      <div className="status-bar">
        <span>Mode: {isPlaying ? '▶ Playing' : '⏸ Paused'}</span>
        <span>{fps} FPS</span>
        <span>{totalMs}ms</span>
      </div>
    </div>
  )
}
