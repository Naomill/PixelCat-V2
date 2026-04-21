import { useReducer, useState, useEffect, useCallback } from 'react'
import PixelConverter from './components/PixelConverter.jsx'
import FrameStrip from './components/FrameStrip.jsx'
import AnimationPreview from './components/AnimationPreview.jsx'
import ExportButton from './components/ExportButton.jsx'

// ===================== BACKGROUND SCENE =====================
function PixelBackground() {
  const clouds = [
    { top: 30, left: '8%', w: 90, h: 24 },
    { top: 50, left: '25%', w: 130, h: 32 },
    { top: 20, left: '52%', w: 80, h: 20 },
    { top: 60, left: '68%', w: 110, h: 28 },
    { top: 35, left: '85%', w: 95, h: 22 },
  ]
  const grassX = [40, 120, 200, 300, 420, 550, 680, 780, 880]
  return (
    <div className="scene">
      <div className="sky">
        {clouds.map((c, i) => (
          <div key={i} style={{
            position: 'absolute', top: c.top, left: c.left,
            width: c.w, height: c.h,
            background: 'rgba(255,255,255,0.9)',
            boxShadow: `${c.w * 0.3}px 0 0 rgba(255,255,255,0.9), ${c.w * 0.6}px -6px 0 rgba(255,255,255,0.9), ${c.w * 0.15}px -10px 0 rgba(255,255,255,0.85)`,
            imageRendering: 'pixelated',
          }} />
        ))}
      </div>
      <div className="ground-strip">
        {grassX.map((x, i) => (
          <div key={i} style={{
            position: 'absolute', bottom: 0, left: x,
            width: 8, height: 20,
            background: 'var(--grass-col)',
          }} />
        ))}
      </div>
      <div className="ground-dark" />
    </div>
  )
}

// ===================== PANEL WINDOW =====================
function Win98Window({ title, children, style = {}, badge }) {
  return (
    <div className="pixel-panel" style={style}>
      <div className="panel-titlebar">
        <span className="panel-title-text">{title}</span>
        {badge && <span className="badge">{badge}</span>}
        <div className="panel-btn">-</div>
        <div className="panel-btn">□</div>
        <div className="panel-btn close">✕</div>
      </div>
      <div className="panel-body">
        {children}
      </div>
    </div>
  )
}

// ===================== NOTIFICATION =====================
function Notification({ message }) {
  if (!message) return null
  return <div className="notification">{message}</div>
}

// ===================== TWEAK PANEL =====================
function TweakPanel({ visible, theme, setTheme, onReset }) {
  return (
    <div className={`tweak-panel ${visible ? 'visible' : ''}`}>
      <div className="tweak-title">⚙ Tweaks</div>
      <div className="tweak-body">
        <div className="tweak-row">
          <label>PANEL THEME</label>
          <select value={theme} onChange={e => setTheme(e.target.value)}>
            <option value="classic">Classic Win95</option>
            <option value="dark">Dark Mode</option>
          </select>
        </div>
        <div className="tweak-row">
          <label>RESET</label>
          <button className="px-btn sm danger" onClick={onReset}>Clear All</button>
        </div>
      </div>
    </div>
  )
}

// ===================== REDUCER =====================
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
    case 'RESET':
      return initialState
    default:
      return state
  }
}

// ===================== APP =====================
export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const { frames, fps, activeFrameIdx } = state

  const [theme, setTheme] = useState('classic')
  const [notification, setNotification] = useState(null)
  const [tweakVisible, setTweakVisible] = useState(false)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const notify = useCallback((msg) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 2200)
  }, [])

  const handleAddFrame = useCallback((frame) => {
    dispatch({ type: 'ADD_FRAME', frame })
    notify('✓ Frame added!')
  }, [notify])

  const handleReset = () => {
    dispatch({ type: 'RESET' })
    setTweakVisible(false)
    notify('✓ Reset!')
  }

  return (
    <>
      <PixelBackground />

      {/* Top bar */}
      <div className="app-titlebar">
        <div className="app-logo">
          <img
            src="/logo.svg"
            alt="PixelCat"
            style={{ width: 32, height: 32, imageRendering: 'pixelated' }}
            className={frames.length > 0 ? 'cat-bounce' : ''}
          />
          <div>
            <div className="app-title">PixelCat</div>
            <div className="app-subtitle">IMAGE PIXEL CONVERTER</div>
          </div>
        </div>
        <button
          className="px-btn sm"
          style={{ marginLeft: 'auto' }}
          onClick={() => setTweakVisible(v => !v)}
        >
          ⚙ Tweaks
        </button>
      </div>

      <Notification message={notification} />

      {/* Main layout */}
      <div className="app-layout">

        {/* Left panel — Upload & Convert */}
        <Win98Window
          title="🖼 Upload and Convert"
          style={{ width: 'clamp(520px, 44vw, 860px)', flexShrink: 0, height: 'clamp(500px, calc(100vh - 120px), 660px)' }}
        >
          <PixelConverter onAddFrame={handleAddFrame} />
        </Win98Window>

        {/* Right panel — Preview Animation */}
        <Win98Window
          title="▶ Preview Animation"
          badge={frames.length > 1 ? `${frames.length}f` : null}
          style={{ width: 'clamp(360px, 30vw, 600px)', flexShrink: 0, height: 'clamp(500px, calc(100vh - 120px), 660px)' }}
        >
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
            <AnimationPreview
              frames={frames}
              fps={fps}
              onSetFps={f => dispatch({ type: 'SET_FPS', fps: f })}
              activeIdx={activeFrameIdx}
            />

            {frames.length > 0 && (
              <div className="frame-list">
                <FrameStrip
                  frames={frames}
                  activeIdx={activeFrameIdx}
                  onSelect={idx => dispatch({ type: 'SET_ACTIVE', index: idx })}
                  onRemove={idx => dispatch({ type: 'REMOVE_FRAME', index: idx })}
                  onReorder={(from, to) => dispatch({ type: 'REORDER_FRAMES', from, to })}
                  onDuplicate={idx => dispatch({ type: 'DUPLICATE_FRAME', index: idx })}
                />
              </div>
            )}

            {frames.length > 0 && (
              <div className="action-bar">
                <ExportButton frames={frames} fps={fps} />
              </div>
            )}
          </div>
        </Win98Window>

      </div>

      <TweakPanel
        visible={tweakVisible}
        theme={theme}
        setTheme={setTheme}
        onReset={handleReset}
      />
    </>
  )
}
