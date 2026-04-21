import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDownload } from '@fortawesome/free-solid-svg-icons'

const FRAME_SIZE = 400

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
      <button
        onClick={handleExport}
        disabled={disabled}
        className="px-btn success"
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
      >
        <FontAwesomeIcon icon={faDownload} />
        {isExporting ? `Encoding… ${progress}%` : `Export GIF (${frames.length}f)`}
      </button>

      {isExporting && (
        <div style={{ width: '100%', height: 6, background: 'var(--settings-border)', border: '1px solid var(--upload-border)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: '#2a7a2a', transition: 'width 0.2s' }} />
        </div>
      )}

      {error && (
        <div className="error-msg">{error}</div>
      )}
    </div>
  )
}
