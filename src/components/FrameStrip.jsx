import { useRef, useState } from 'react'
import { T } from '../ui.js'

export default function FrameStrip({ frames, activeIdx, onSelect, onRemove, onReorder, onDuplicate }) {
  const dragFromIdx = useRef(null)
  const [dragOverIdx, setDragOverIdx] = useState(null)

  const handleDragStart = (e, idx) => {
    dragFromIdx.current = idx
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', idx.toString())
  }

  const handleDragOver = (e, idx) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIdx(idx)
  }

  const handleDrop = (e, toIdx) => {
    e.preventDefault()
    const fromIdx = dragFromIdx.current
    setDragOverIdx(null)
    if (fromIdx !== null && fromIdx !== toIdx) {
      onReorder(fromIdx, toIdx)
    }
    dragFromIdx.current = null
  }

  const handleDragEnd = () => {
    setDragOverIdx(null)
    dragFromIdx.current = null
  }

  return (
    <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto">
      <span className="text-xs text-muted uppercase tracking-widest shrink-0 mr-2">Frames</span>

      {frames.map((frame, idx) => (
        <div
          key={frame.id}
          draggable
          onDragStart={e => handleDragStart(e, idx)}
          onDragOver={e => handleDragOver(e, idx)}
          onDrop={e => handleDrop(e, idx)}
          onDragEnd={handleDragEnd}
          className="relative shrink-0 cursor-pointer select-none"
          style={{
            border: activeIdx === idx ? `2px solid ${T.accent}` : `2px solid ${T.border}`,
            boxShadow: dragOverIdx === idx ? `3px 3px 0 ${T.accent}` : activeIdx === idx ? `2px 2px 0 ${T.accentHover}` : '2px 2px 0 #C8C4B8',
            opacity: dragFromIdx.current === idx ? 0.4 : 1,
            transition: 'transform 0.1s',
          }}
          onClick={() => onSelect(idx)}
        >
          {/* Frame thumbnail */}
          <img
            src={frame.thumbnail}
            alt={`Frame ${idx + 1}`}
            width={64}
            height={64}
            className="block pixel-canvas"
            draggable={false}
          />

          {/* Frame number badge */}
          <div
            className="absolute top-0 left-0 text-xs px-1 leading-none"
            style={{
              backgroundColor: activeIdx === idx ? T.accent : T.borderDark,
              color: 'white',
              fontSize: '9px',
              lineHeight: '14px',
            }}
          >
            {idx + 1}
          </div>

          {/* Controls on hover */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-1 opacity-0 hover:opacity-100 transition-opacity"
            style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
          >
            <button
              title="Duplicate"
              className="text-white text-xs px-1 hover:text-yellow-300"
              onClick={e => { e.stopPropagation(); onDuplicate(idx) }}
            >
              ⧉
            </button>
            <button
              title="Remove"
              className="text-white text-xs px-1 hover:text-red-300"
              onClick={e => { e.stopPropagation(); onRemove(idx) }}
            >
              ✕
            </button>
          </div>
        </div>
      ))}

      {frames.length === 0 && (
        <div className="text-xs text-muted italic">No frames yet — convert an image and click "Use This Frame"</div>
      )}
    </div>
  )
}
