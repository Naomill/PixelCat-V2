import { useReducer } from 'react'
import PixelConverter from './components/PixelConverter.jsx'
import FrameStrip from './components/FrameStrip.jsx'
import AnimationPreview from './components/AnimationPreview.jsx'
import ExportButton from './components/ExportButton.jsx'
import { T } from './ui.js'

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
    <div className="min-h-screen bg-cream flex flex-col" style={{ fontFamily: T.fontMono }}>
      {/* Header */}
      <header className="border-b-2 border-border-dark px-6 py-3 flex items-center gap-3 bg-creamy">
        <span className="text-2xl">🐱</span>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink leading-none">Pixcat</h1>
          <p className="text-xs text-muted mt-0.5">image → pixel art → animated gif</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {frames.length > 0 && (
            <span className="text-xs text-muted border border-border px-2 py-1">
              {frames.length} frame{frames.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col lg:flex-row gap-0">
        {/* Left: Converter */}
        <div className="flex-1 border-b lg:border-b-0 lg:border-r-2 border-border-dark">
          <PixelConverter onAddFrame={handleAddFrame} />
        </div>

        {/* Right: Preview + Controls */}
        <div className="w-full lg:w-[420px] flex flex-col">
          {/* Animation Preview */}
          <div className="flex-1 border-b border-border-dark">
            <AnimationPreview frames={frames} fps={fps} onSetFps={handleSetFps} />
          </div>

          {/* Export */}
          <div className="border-b border-border-dark px-4 py-3">
            <ExportButton frames={frames} fps={fps} />
          </div>
        </div>
      </main>

      {/* Frame Strip */}
      {frames.length > 0 && (
        <div className="border-t-2 border-border-dark bg-creamy">
          <FrameStrip
            frames={frames}
            activeIdx={activeFrameIdx}
            onSelect={handleSelectFrame}
            onRemove={handleRemoveFrame}
            onReorder={handleReorder}
            onDuplicate={handleDuplicate}
          />
        </div>
      )}
    </div>
  )
}
