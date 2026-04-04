import { useState, useEffect, useRef, useCallback } from 'react'
import { convertToPixelArt, generateThumbnail } from '../utils/pixelArt.js'
import { T } from '../ui.js'

const PIXEL_SIZES = [2, 4, 8, 16]
const COLOR_OPTIONS = [
  { label: '16', value: 16 },
  { label: '32', value: 32 },
  { label: '64', value: 64 },
  { label: 'Full', value: 'full' },
]
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export default function PixelConverter({ onAddFrame }) {
  const [image, setImage] = useState(null)         // HTMLImageElement
  const [originalDataUrl, setOriginalDataUrl] = useState(null)
  const [convertedDataUrl, setConvertedDataUrl] = useState(null)
  const [pixelSize, setPixelSize] = useState(8)
  const [numColors, setNumColors] = useState(32)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState(null)
  const [isConverting, setIsConverting] = useState(false)
  const fileInputRef = useRef(null)
  const dragCounter = useRef(0)

  // Re-convert when controls or image change
  useEffect(() => {
    if (!image) return
    setIsConverting(true)
    // defer to next tick so UI can update
    const timer = setTimeout(() => {
      try {
        const dataUrl = convertToPixelArt(image, pixelSize, numColors)
        setConvertedDataUrl(dataUrl)
      } catch (e) {
        console.error('Conversion error:', e)
        setError('Conversion failed. Try a different image.')
      } finally {
        setIsConverting(false)
      }
    }, 0)
    return () => clearTimeout(timer)
  }, [image, pixelSize, numColors])

  const loadImageFile = useCallback((file) => {
    setError(null)
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (PNG, JPG, WebP, GIF)')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('File too large. Maximum size is 5MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target.result
      setOriginalDataUrl(dataUrl)
      const img = new Image()
      img.onload = () => setImage(img)
      img.src = dataUrl
    }
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    dragCounter.current = 0
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    loadImageFile(file)
  }, [loadImageFile])

  const handleDragEnter = useCallback((e) => {
    e.preventDefault()
    dragCounter.current++
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    dragCounter.current--
    if (dragCounter.current === 0) setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
  }, [])

  const handleFileInput = (e) => {
    loadImageFile(e.target.files[0])
  }

  const handleUseThis = async () => {
    if (!convertedDataUrl) return
    const thumbnail = await generateThumbnail(convertedDataUrl, 80)
    onAddFrame({
      id: `frame-${Date.now()}-${Math.random()}`,
      dataUrl: convertedDataUrl,
      thumbnail,
    })
  }

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      {/* Section title */}
      <div className="text-xs font-bold tracking-widest uppercase text-muted border-b border-border pb-1">
        01 — Upload &amp; Convert
      </div>

      {/* Upload zone */}
      <div
        className="relative border-2 border-dashed rounded-pixel cursor-pointer transition-colors"
        style={{
          borderColor: isDragging ? T.accent : T.border,
          backgroundColor: isDragging ? '#FFF3EE' : T.creamy,
          minHeight: '80px',
        }}
        onDrop={handleDrop}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={handleFileInput}
        />
        <div className="flex items-center justify-center gap-3 px-4 py-3">
          <span className="text-2xl">{isDragging ? '📂' : '🖼️'}</span>
          <div>
            <div className="text-sm font-bold text-ink">
              {image ? 'Drop new image to replace' : 'Drop image here or click to select'}
            </div>
            <div className="text-xs text-muted mt-0.5">PNG, JPG, WebP, GIF · max 5MB</div>
          </div>
          {image && (
            <div className="ml-auto text-xs text-accent font-bold border border-accent px-2 py-1">
              change
            </div>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="text-xs text-red-600 border border-red-300 bg-red-50 px-3 py-2">
          {error}
        </div>
      )}

      {/* Controls (only when image loaded) */}
      {image && (
        <div className="flex gap-4 flex-wrap">
          {/* Pixel Size */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted tracking-wide uppercase">Pixel Size</span>
            <div className="flex gap-1">
              {PIXEL_SIZES.map(size => (
                <button
                  key={size}
                  onClick={() => setPixelSize(size)}
                  className="px-3 py-1 text-xs font-bold border transition-colors"
                  style={{
                    borderColor: pixelSize === size ? T.accent : T.border,
                    backgroundColor: pixelSize === size ? T.accent : 'transparent',
                    color: pixelSize === size ? 'white' : T.text,
                    boxShadow: pixelSize === size ? `2px 2px 0 ${T.accentHover}` : 'none',
                  }}
                >
                  {size}px
                </button>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted tracking-wide uppercase">Colors</span>
            <div className="flex gap-1">
              {COLOR_OPTIONS.map(opt => (
                <button
                  key={opt.label}
                  onClick={() => setNumColors(opt.value)}
                  className="px-3 py-1 text-xs font-bold border transition-colors"
                  style={{
                    borderColor: numColors === opt.value ? T.blue : T.border,
                    backgroundColor: numColors === opt.value ? T.blue : 'transparent',
                    color: numColors === opt.value ? 'white' : T.text,
                    boxShadow: numColors === opt.value ? `2px 2px 0 #2A70B9` : 'none',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Before / After preview */}
      {image && (
        <div className="flex gap-3 flex-1 min-h-0">
          {/* Before */}
          <div className="flex-1 flex flex-col gap-1 min-w-0">
            <span className="text-xs text-muted uppercase tracking-wide">Before</span>
            <div
              className="flex-1 border border-border flex items-center justify-center overflow-hidden"
              style={{ backgroundColor: T.creamy, minHeight: '160px', maxHeight: '280px' }}
            >
              <img
                src={originalDataUrl}
                alt="Original"
                className="max-w-full max-h-full object-contain"
                style={{ imageRendering: 'auto' }}
              />
            </div>
          </div>

          {/* After */}
          <div className="flex-1 flex flex-col gap-1 min-w-0">
            <span className="text-xs text-muted uppercase tracking-wide">After</span>
            <div
              className="flex-1 border border-border flex items-center justify-center overflow-hidden relative"
              style={{ backgroundColor: T.creamy, minHeight: '160px', maxHeight: '280px' }}
            >
              {isConverting ? (
                <div className="text-xs text-muted animate-pulse">converting…</div>
              ) : convertedDataUrl ? (
                <img
                  src={convertedDataUrl}
                  alt="Pixel art"
                  className="max-w-full max-h-full object-contain pixel-canvas"
                  style={{ imageRendering: 'pixelated' }}
                />
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!image && !error && (
        <div className="flex-1 flex items-center justify-center text-center">
          <div>
            <div className="text-5xl mb-3">🐱</div>
            <div className="text-sm text-muted">Upload an image to get started</div>
          </div>
        </div>
      )}

      {/* Use This button */}
      {convertedDataUrl && !isConverting && (
        <button
          onClick={handleUseThis}
          className="w-full py-3 text-sm font-bold tracking-wide uppercase border-2 transition-colors"
          style={{
            borderColor: T.accent,
            backgroundColor: T.accent,
            color: 'white',
            boxShadow: `3px 3px 0 ${T.accentHover}`,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = T.accentHover
            e.currentTarget.style.boxShadow = `1px 1px 0 ${T.accentHover}`
            e.currentTarget.style.transform = 'translate(2px, 2px)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = T.accent
            e.currentTarget.style.boxShadow = `3px 3px 0 ${T.accentHover}`
            e.currentTarget.style.transform = 'none'
          }}
        >
          + Use This Frame
        </button>
      )}
    </div>
  )
}
