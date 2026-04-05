import { useRef, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCopy, faXmark } from '@fortawesome/free-solid-svg-icons'

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
    if (fromIdx !== null && fromIdx !== toIdx) onReorder(fromIdx, toIdx)
    dragFromIdx.current = null
  }

  const handleDragEnd = () => {
    setDragOverIdx(null)
    dragFromIdx.current = null
  }

  if (frames.length === 0) {
    return (
      <div style={{ fontSize: 11, color: '#8A8A7A', padding: '4px 0' }}>
        No frames yet
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 2 }}>
      {frames.map((frame, idx) => (
        <div
          key={frame.id}
          draggable
          onDragStart={e => handleDragStart(e, idx)}
          onDragOver={e => handleDragOver(e, idx)}
          onDrop={e => handleDrop(e, idx)}
          onDragEnd={handleDragEnd}
          onClick={() => onSelect(idx)}
          style={{
            position: 'relative',
            flexShrink: 0,
            cursor: 'pointer',
            border: activeIdx === idx ? '2px solid #3550C4' : '2px solid #C8C4B8',
            boxShadow: dragOverIdx === idx ? '0 0 0 2px #3550C4' : 'none',
            opacity: dragFromIdx.current === idx ? 0.4 : 1,
          }}
        >
          <img
            src={frame.thumbnail}
            alt={`Frame ${idx + 1}`}
            width={56}
            height={56}
            className="pixel-canvas"
            draggable={false}
            style={{ display: 'block' }}
          />

          {/* Number badge */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            background: activeIdx === idx ? '#3550C4' : '#555',
            color: 'white',
            fontSize: 9,
            lineHeight: '14px',
            padding: '0 3px',
          }}>
            {idx + 1}
          </div>

          {/* Hover controls */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.55)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              opacity: 0,
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = 1}
            onMouseLeave={e => e.currentTarget.style.opacity = 0}
          >
            <button
              title="Duplicate"
              onClick={e => { e.stopPropagation(); onDuplicate(idx) }}
              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: 13, padding: 0 }}
            >
              <FontAwesomeIcon icon={faCopy} />
            </button>
            <button
              title="Remove"
              onClick={e => { e.stopPropagation(); onRemove(idx) }}
              style={{ background: 'none', border: 'none', color: '#FF9999', cursor: 'pointer', fontSize: 13, padding: 0 }}
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
        </div>
      ))}

      {/* Empty slots placeholder */}
      {[...Array(Math.max(0, 4 - frames.length))].map((_, i) => (
        <div
          key={`empty-${i}`}
          style={{
            width: 60,
            height: 60,
            border: '2px solid #C8C4B8',
            background: '#F0EDE6',
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  )
}
