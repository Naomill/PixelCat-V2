import { useState, useEffect, useRef, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faCheck } from '@fortawesome/free-solid-svg-icons'
import { convertToPixelArt, convertToSVG, cropToContent, generateThumbnail } from '../utils/pixelArt.js'

const PIXEL_SIZES = [2, 4, 8, 16]
const MAX_FILE_SIZE = 5 * 1024 * 1024

export default function PixelConverter({ onAddFrame }) {
  const [image, setImage] = useState(null)
  const [originalDataUrl, setOriginalDataUrl] = useState(null)
  const [convertedDataUrl, setConvertedDataUrl] = useState(null)
  const [pixelSize, setPixelSize] = useState(8)
  const [numColors] = useState('full')
  const [removeBg, setRemoveBg] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState(null)
  const [isConverting, setIsConverting] = useState(false)
  const fileInputRef = useRef(null)
  const dragCounter = useRef(0)

  useEffect(() => {
    if (!image) return
    setIsConverting(true)
    const timer = setTimeout(() => {
      try {
        const dataUrl = convertToPixelArt(image, pixelSize, numColors, { removeBg })
        setConvertedDataUrl(dataUrl)
      } catch (e) {
        console.error('Conversion error:', e)
        setError('Conversion failed. Try a different image.')
      } finally {
        setIsConverting(false)
      }
    }, 0)
    return () => clearTimeout(timer)
  }, [image, pixelSize, numColors, removeBg])

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

  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) { e.preventDefault(); loadImageFile(file) }
          break
        }
      }
    }
    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [loadImageFile])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    dragCounter.current = 0
    setIsDragging(false)
    loadImageFile(e.dataTransfer.files[0])
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

  const handleDragOver = useCallback((e) => { e.preventDefault() }, [])
  const handleFileInput = (e) => { loadImageFile(e.target.files[0]) }

  const handleUseThis = async () => {
    if (!convertedDataUrl) return
    const thumbnail = await generateThumbnail(convertedDataUrl, 80)
    onAddFrame({
      id: `frame-${Date.now()}-${Math.random()}`,
      dataUrl: convertedDataUrl,
      thumbnail,
      hasAlpha: removeBg,
    })
  }

  const handleDownloadPNG = async () => {
    if (!convertedDataUrl) return
    let url = convertedDataUrl
    if (removeBg) {
      const img = new Image()
      await new Promise(r => { img.onload = r; img.src = convertedDataUrl })
      const c = document.createElement('canvas')
      c.width = img.width; c.height = img.height
      c.getContext('2d').drawImage(img, 0, 0)
      url = cropToContent(c).toDataURL('image/png')
    }
    const a = document.createElement('a')
    a.href = url; a.download = 'pixcat.png'; a.click()
  }

  const handleDownloadSVG = () => {
    if (!image) return
    const svg = convertToSVG(image, pixelSize, numColors, { removeBg })
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'pixcat.svg'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Upload zone */}
      <div
        role="button"
        className={`upload-zone ${isDragging ? 'drag-over' : ''}`}
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
          style={{ display: 'none' }}
          onChange={handleFileInput}
        />
        <img
          src={image ? (originalDataUrl || '/DropImgIcon.png') : '/DropImgIcon.png'}
          alt="drop"
          style={{ width: 40, height: 40, objectFit: 'contain', imageRendering: 'pixelated', flexShrink: 0 }}
        />
        <div className="upload-zone-text">
          <div className="upload-zone-title">
            {isDragging ? 'DROP IT!' : image ? '✓ Image ready' : 'Drop image or click to select'}
          </div>
          <div className="upload-zone-sub" >
            PNG, JPG, WebP, GIF (max 5MB)<br />
            or cmd+v to paste
          </div>
        </div>
        <button
          className="px-btn sm"
          onClick={e => { e.stopPropagation(); fileInputRef.current?.click() }}
        >
          ↑ {image ? 'Change' : 'Upload'}
        </button>
      </div>

      {/* Error */}
      {error && <div className="error-msg" style={{ margin: '0 12px' }}>{error}</div>}

      {/* Settings bar */}
      <div className="settings-bar">
        {/* Pixel Size */}
        <div className="setting-group">
          <div className="setting-label">PIXEL SIZE</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {PIXEL_SIZES.map(size => (
              <button
                key={size}
                onClick={() => setPixelSize(size)}
                className={`px-btn sm ${pixelSize === size ? 'active' : ''}`}
                style={{ padding: '4px 8px', minWidth: 32 }}
              >
                {size}px
              </button>
            ))}
          </div>
        </div>

        {/* Remove BG */}
        <div className="setting-group">
          <div className="setting-label">BACKGROUND</div>
          <button
            onClick={() => setRemoveBg(v => !v)}
            className={`px-btn sm ${removeBg ? 'active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: 5 }}
          >
            <span style={{
              width: 10, height: 10,
              border: '2px solid currentColor',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 7,
              flexShrink: 0,
            }}>
              {removeBg ? <FontAwesomeIcon icon={faCheck} /> : ''}
            </span>
            Remove BG
          </button>
        </div>
      </div>

      {/* Canvas area — Before / After */}
      <div className="canvas-area" style={{ flex: 1 }}>
        {image ? (
          <>
            {/* Before */}
            <div className="before-after-panel">
              <div className="before-after-label">Before</div>
              <div className="before-after-img">
                <img
                  src={originalDataUrl}
                  alt="Original"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                />
              </div>
            </div>

            {/* After */}
            <div className="before-after-panel">
              <div className="before-after-label">
                After{removeBg && <span style={{ color: '#4a8aff' }}> · transparent</span>}
              </div>
              <div
                className="before-after-img"
                style={{
                  backgroundImage: removeBg
                    ? 'linear-gradient(45deg,#ccc 25%,transparent 25%),linear-gradient(-45deg,#ccc 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#ccc 75%),linear-gradient(-45deg,transparent 75%,#ccc 75%)'
                    : 'none',
                  backgroundSize: removeBg ? '14px 14px' : 'auto',
                  backgroundPosition: removeBg ? '0 0,0 7px,7px -7px,-7px 0' : 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                {isConverting ? (
                  <div className="empty-label">converting…</div>
                ) : convertedDataUrl ? (
                  <img
                    src={convertedDataUrl}
                    alt="Pixel art"
                    className="pixel-canvas"
                    style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                  />
                ) : null}
              </div>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <img
              src="/NoImgContentIcon.png"
              alt=""
              style={{ width: 72, imageRendering: 'pixelated', opacity: 0.8 }}
            />
            <div className="empty-label">Upload an image to get started!</div>
          </div>
        )}
      </div>

      {/* Action bar */}
      {convertedDataUrl && !isConverting && (
        <div className="action-bar">
          <button onClick={handleDownloadPNG} className="px-btn sm">
            ↓ Save PNG
          </button>
          <button onClick={handleDownloadSVG} className="px-btn sm">
            ↓ Save SVG
          </button>
          <button
            onClick={handleUseThis}
            className="px-btn sm success"
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <FontAwesomeIcon icon={faPlus} style={{ fontSize: 8 }} /> Add Frame
          </button>
          <div style={{ marginLeft: 'auto', color: 'var(--status-text)', display: 'flex', gap: 10, fontFamily: 'var(--pixel-font)', fontSize: '9px' }}>
            <span>{pixelSize}px</span>
            {removeBg && <span>transparent</span>}
          </div>
        </div>
      )}
    </div>
  )
}
