import { useState } from 'react'
import { T } from '../ui.js'

const FRAME_SIZE = T.FRAME_SIZE

export default function ExportButton({ frames, fps }) {
  const [isExporting, setIsExporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)

  const handleExport = async () => {
    if (frames.length === 0 || isExporting) return
    setError(null)
    setIsExporting(true)
    setProgress(0)

    try {
      const GIF = (await import('gif.js')).default

      const gif = new GIF({
        workers: 2,
        quality: 10,
        width: FRAME_SIZE,
        height: FRAME_SIZE,
        workerScript: '/gif.worker.js',
        transparent: null,
      })

      // Load all frames as images and add to gif
      for (const frame of frames) {
        const canvas = document.createElement('canvas')
        canvas.width = FRAME_SIZE
        canvas.height = FRAME_SIZE
        const ctx = canvas.getContext('2d')
        ctx.imageSmoothingEnabled = false

        await new Promise((resolve, reject) => {
          const img = new Image()
          img.onload = () => {
            ctx.drawImage(img, 0, 0, FRAME_SIZE, FRAME_SIZE)
            resolve()
          }
          img.onerror = reject
          img.src = frame.dataUrl
        })

        gif.addFrame(canvas, { delay: Math.round(1000 / fps), copy: true })
      }

      gif.on('progress', (p) => {
        setProgress(Math.round(p * 100))
      })

      gif.on('finished', (blob) => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'pixcat_export.gif'
        a.click()
        URL.revokeObjectURL(url)
        setIsExporting(false)
        setProgress(0)
      })

      gif.render()
    } catch (e) {
      console.error('Export error:', e)
      setError('Export failed. Check console for details.')
      setIsExporting(false)
      setProgress(0)
    }
  }

  const disabled = frames.length === 0 || isExporting

  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs font-bold tracking-widest uppercase text-muted border-b border-border pb-1">
        03 — Export
      </div>

      <button
        onClick={handleExport}
        disabled={disabled}
        className="w-full py-2.5 text-sm font-bold tracking-wide uppercase border-2 transition-all"
        style={{
          borderColor: disabled ? T.border : T.green,
          backgroundColor: disabled ? T.creamy : T.green,
          color: disabled ? T.textMuted : 'white',
          boxShadow: disabled ? 'none' : `3px 3px 0 #2A8F57`,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
        onMouseEnter={e => {
          if (!disabled) {
            e.currentTarget.style.transform = 'translate(2px, 2px)'
            e.currentTarget.style.boxShadow = `1px 1px 0 #2A8F57`
          }
        }}
        onMouseLeave={e => {
          if (!disabled) {
            e.currentTarget.style.transform = 'none'
            e.currentTarget.style.boxShadow = `3px 3px 0 #2A8F57`
          }
        }}
      >
        {isExporting ? `Encoding… ${progress}%` : `Export GIF (${frames.length} frame${frames.length !== 1 ? 's' : ''})`}
      </button>

      {/* Progress bar */}
      {isExporting && (
        <div className="w-full h-2 border border-border overflow-hidden" style={{ backgroundColor: T.creamy }}>
          <div
            className="h-full transition-all"
            style={{ width: `${progress}%`, backgroundColor: T.green }}
          />
        </div>
      )}

      {error && (
        <div className="text-xs text-red-600 border border-red-300 bg-red-50 px-2 py-1">
          {error}
        </div>
      )}

      {frames.length === 0 && (
        <div className="text-xs text-muted">Add at least one frame to export</div>
      )}
    </div>
  )
}
