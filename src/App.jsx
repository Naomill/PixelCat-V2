import { useReducer } from 'react'
import PixelConverter from './components/PixelConverter.jsx'
import FrameStrip from './components/FrameStrip.jsx'
import AnimationPreview from './components/AnimationPreview.jsx'
import ExportButton from './components/ExportButton.jsx'

const WIN_BLUE = 'linear-gradient(to bottom, #4A6FD8 0%, #3550C4 100%)'
const WIN_BG = '#EDE8DC'

function Win98Window({ title, children, className = '', contentStyle = {}, style = {} }) {
  return (
    <div
      className={`flex flex-col ${className}`}
      style={{
        border: '3px solid #000',
        boxShadow: '4px 4px 0 rgba(0,0,0,0.35)',
        minHeight: 0,
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* Title bar */}
      <div
        style={{
          background: WIN_BLUE,
          padding: '5px 8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          userSelect: 'none',
        }}
      >
        <span style={{ color: 'white', fontWeight: 'bold', fontSize: '13px', letterSpacing: '0.02em' }}>
          {title}
        </span>
        <button
          style={{
            background: '#CC2233',
            color: 'white',
            border: '1px solid #AA1122',
            width: 22,
            height: 20,
            fontSize: '12px',
            cursor: 'pointer',
            fontWeight: 'bold',
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          ✕
        </button>
      </div>
      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', backgroundColor: WIN_BG, ...contentStyle }}>
        {children}
      </div>
    </div>
  )
}

const initialState = {
  frames: [],
  fps: 8,
  activeFrameIdx: 0,
}

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_FRAME': {
      const newFrames = [...state.frames, action.frame]
      return { ...state, frames: newFrames, activeFrameIdx: newFrames.length - 1 }
    }
    case 'REMOVE_FRAME': {
      const newFrames = state.frames.filter((_, i) => i !== action.index)
      const newActive = Math.min(state.activeFrameIdx, Math.max(0, newFrames.length - 1))
      return { ...state, frames: newFrames, activeFrameIdx: newActive }
    }
    case 'REORDER_FRAMES': {
      const { from, to } = action
      const newFrames = [...state.frames]
      const [moved] = newFrames.splice(from, 1)
      newFrames.splice(to, 0, moved)
      return { ...state, frames: newFrames, activeFrameIdx: to }
    }
    case 'SET_FPS':
      return { ...state, fps: action.fps }
    case 'SET_ACTIVE':
      return { ...state, activeFrameIdx: action.index }
    case 'DUPLICATE_FRAME': {
      const frame = state.frames[action.index]
      if (!frame) return state
      const dup = { ...frame, id: `frame-${Date.now()}-${Math.random()}` }
      const newFrames = [...state.frames.slice(0, action.index + 1), dup, ...state.frames.slice(action.index + 1)]
      return { ...state, frames: newFrames, activeFrameIdx: action.index + 1 }
    }
    default:
      return state
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const { frames, fps, activeFrameIdx } = state

  const handleAddFrame = (frame) => dispatch({ type: 'ADD_FRAME', frame })
  const handleRemoveFrame = (index) => dispatch({ type: 'REMOVE_FRAME', index })
  const handleReorder = (from, to) => dispatch({ type: 'REORDER_FRAMES', from, to })
  const handleSelectFrame = (index) => dispatch({ type: 'SET_ACTIVE', index })
  const handleSetFps = (fps) => dispatch({ type: 'SET_FPS', fps })
  const handleDuplicate = (index) => dispatch({ type: 'DUPLICATE_FRAME', index })

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'LINESeedSansTH', 'Courier New', sans-serif" }}>
      {/* Header */}
      <header style={{ textAlign: 'center', padding: '20px 16px 12px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <img
            src="/logo.svg"
            alt="PixelCat"
            style={{ width: 52, height: 'auto', imageRendering: 'pixelated' }}
          />
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 28, fontWeight: 'bold', color: '#111', lineHeight: 1 }}>
              PixelCat
            </div>
            <div style={{ fontSize: 13, color: '#333', marginTop: 2 }}>
              Image Pixel Convertor
            </div>
          </div>
        </div>
      </header>

      {/* Main windows */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          gap: 16,
          padding: '0 16px 20px',
          alignItems: 'stretch',
          maxWidth: 1400,
          width: '100%',
          margin: '0 auto',
          boxSizing: 'border-box',
        }}
      >
        {/* Left window — Upload & Convert */}
        <Win98Window title="Upload and Convert" className="flex-1" contentStyle={{ display: 'flex', flexDirection: 'column' }}>
          <PixelConverter onAddFrame={handleAddFrame} />
        </Win98Window>

        {/* Right window — Preview & Export */}
        <Win98Window
          title="Preview Animation"
          contentStyle={{ display: 'flex', flexDirection: 'column' }}
          style={{ width: 420, flexShrink: 0 }}
        >
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {/* Animation preview */}
            <AnimationPreview frames={frames} fps={fps} onSetFps={handleSetFps} activeIdx={activeFrameIdx} />

            {/* Frame strip */}
            <div style={{ borderTop: '1px solid #C8C4B8', padding: '8px 12px' }}>
              <div style={{ fontSize: 11, fontWeight: 'bold', color: '#6A6A5A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                Frame
              </div>
              <FrameStrip
                frames={frames}
                activeIdx={activeFrameIdx}
                onSelect={handleSelectFrame}
                onRemove={handleRemoveFrame}
                onReorder={handleReorder}
                onDuplicate={handleDuplicate}
              />
            </div>

            {/* Export */}
            <div style={{ borderTop: '1px solid #C8C4B8', padding: '10px 12px' }}>
              <ExportButton frames={frames} fps={fps} />
            </div>
          </div>
        </Win98Window>
      </main>
    </div>
  )
}
