import { useEffect, useRef, useState } from 'react'
import { T } from '../ui.js'

const FPS_OPTIONS = [4, 8, 12, 24]

export default function AnimationPreview({ frames, fps, onSetFps }) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const intervalRef = useRef(null)

  // Reset current index when frames change
  useEffect(() => {
    setCurrentIdx(0)
  }, [frames.length])

  // Playback loop
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
    <div className="flex flex-col h-full p-4 gap-3">
      <div className="text-xs font-bold tracking-widest uppercase text-muted border-b border-border pb-1">
        02 — Preview
      </div>

      {/* Preview canvas area */}
      <div
        className="flex-1 border border-border flex items-center justify-center relative overflow-hidden"
        style={{ backgroundColor: T.creamy, minHeight: '200px' }}
      >
        {currentFrame ? (
          <img
            src={currentFrame.dataUrl}
            alt={`Frame ${currentIdx + 1}`}
            className="max-w-full max-h-full object-contain pixel-canvas"
            style={{ imageRendering: 'pixelated' }}
          />
        ) : (
          <div className="text-center">
            <div className="text-4xl mb-2">🎞️</div>
            <div className="text-xs text-muted">Add frames to preview animation</div>
          </div>
        )}

        {/* Frame counter */}
        {frames.length > 0 && (
          <div
            className="absolute bottom-1 right-1 text-xs px-2 py-0.5"
            style={{ backgroundColor: T.borderDark, color: 'white', fontSize: '10px' }}
          >
            {currentIdx + 1}/{frames.length}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Play/Pause */}
        {frames.length > 1 && (
          <button
            onClick={() => setIsPlaying(p => !p)}
            className="px-3 py-1 text-xs font-bold border"
            style={{
              borderColor: T.borderDark,
              backgroundColor: isPlaying ? T.borderDark : 'transparent',
              color: isPlaying ? 'white' : T.text,
              boxShadow: '2px 2px 0 #8A8A7A',
            }}
          >
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>
        )}

        {/* FPS */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted">FPS</span>
          {FPS_OPTIONS.map(f => (
            <button
              key={f}
              onClick={() => onSetFps(f)}
              className="px-2 py-1 text-xs font-bold border"
              style={{
                borderColor: fps === f ? T.blue : T.border,
                backgroundColor: fps === f ? T.blue : 'transparent',
                color: fps === f ? 'white' : T.text,
                boxShadow: fps === f ? `2px 2px 0 #2A70B9` : 'none',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
