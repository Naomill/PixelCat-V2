import { useState } from 'react'
import { T } from '../ui.js'

const FRAME_SIZE = T.FRAME_SIZE
const BTN_BLUE = '#3550C4'

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
      const hasTransparency = frames.some(f => f.hasAlpha)
      const TRANSPARENT_COLOR = 0xFF00FF
      const TRANSPARENT_RGB = [255, 0, 255]

      const gif = new GIF({
        workers: 2,
        quality: 10,
        width: FRAME_SIZE,
        height: FRAME_SIZE,
        workerScript: '/gif.worker.js',
        transparent: hasTransparency ? TRANSPARENT_COLOR : null,
      })

      for (const frame of frames) {
        const canvas = document.createElement('canvas')
        canvas.width = FRAME_SIZE
        canvas.height = FRAME_SIZE
        const ctx = canvas.getContext('2d')
        ctx.imageSmoothingEnabled = false

        await new Promise((resolve, reject) => {
          const img = new Image()
          img.onload = () => {
            if (hasTransparency) {
              ctx.fillStyle = `rgb(${TRANSPARENT_RGB.join(',')})`
              ctx.fillRect(0, 0, FRAME_SIZE, FRAME_SIZE)
            }
            ctx.drawImage(img, 0, 0, FRAME_SIZE, FRAME_SIZE)
            resolve()
          }
          img.onerror = reject
          img.src = frame.dataUrl
        })

        gif.addFrame(canvas, { delay: Math.round(1000 / fps), copy: true })
      }

      gif.on('progress', (p) => setProgress(Math.round(p * 100)))

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: 11, fontWeight: 'bold', color: '#6A6A5A' }}>
        Download your GIF here!
      </div>

      <button
        onClick={handleExport}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '8px 12px',
          background: disabled ? '#C8C4B8' : BTN_BLUE,
          color: 'white',
          border: 'none',
          fontSize: 13,
          fontWeight: 'bold',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          opacity: disabled ? 0.7 : 1,
        }}
      >
        ↓ {isExporting ? `Encoding… ${progress}%` : `Export GIF`}
      </button>

      {isExporting && (
        <div style={{ width: '100%', height: 6, background: '#E0DCCC', border: '1px solid #C8C4B8', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: BTN_BLUE, transition: 'width 0.2s' }} />
        </div>
      )}

      {error && (
        <div style={{ fontSize: 11, color: '#CC2222', border: '1px solid #FFAAAA', background: '#FFF0F0', padding: '3px 6px' }}>
          {error}
        </div>
      )}
    </div>
  )
}
