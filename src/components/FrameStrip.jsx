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
      <div className="empty-label" style={{ padding: '4px 0' }}>No frames yet</div>
    )
  }

  return (
    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', alignItems: 'center', minHeight: 44 }}>
      {frames.map((frame, idx) => (
        <div
          key={frame.id}
          draggable
          onDragStart={e => handleDragStart(e, idx)}
          onDragOver={e => handleDragOver(e, idx)}
          onDrop={e => handleDrop(e, idx)}
          onDragEnd={handleDragEnd}
          onClick={() => onSelect(idx)}
          className={`frame-thumb ${activeIdx === idx ? 'active' : ''}`}
          style={{
            boxShadow: dragOverIdx === idx ? '0 0 0 2px #1a45c8' : '2px 2px 0 #000',
            opacity: dragFromIdx.current === idx ? 0.4 : 1,
          }}
        >
          <img
            src={frame.thumbnail}
            alt={`Frame ${idx + 1}`}
            width={52}
            height={52}
            className="pixel-canvas"
            draggable={false}
            style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div className="frame-num">{idx + 1}</div>

          {/* Hover controls */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
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
              style={{ background: 'none', border: 'none', color: 'white', fontSize: 11, padding: 0 }}
            >
              <FontAwesomeIcon icon={faCopy} />
            </button>
            <button
              title="Remove"
              onClick={e => { e.stopPropagation(); onRemove(idx) }}
              style={{ background: 'none', border: 'none', color: '#FF9999', fontSize: 11, padding: 0 }}
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
