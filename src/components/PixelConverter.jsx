import { useState, useEffect, useRef, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDownload, faPlus, faCheck, faUpload } from '@fortawesome/free-solid-svg-icons'
import { convertToPixelArt, convertToSVG, cropToContent, generateThumbnail } from '../utils/pixelArt.js'

const PIXEL_SIZES = [2, 4, 8, 16]
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB


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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 12, gap: 10 }}>

      {/* Upload zone */}
      <div
        style={{
          border: `2px dashed ${isDragging ? '#3550C4' : '#C8C4B8'}`,
          backgroundColor: isDragging ? '#E8EDFF' : '#F5F2EC',
          cursor: 'pointer',
          transition: 'border-color 0.15s, background-color 0.15s',
          padding: '16px 12px',
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
          style={{ display: 'none' }}
          onChange={handleFileInput}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Icon */}
          <img
            src={image ? (originalDataUrl || '/DropImgIcon.png') : '/DropImgIcon.png'}
            alt="drop"
            style={{
              width: 52,
              height: 52,
              objectFit: 'contain',
              imageRendering: 'pixelated',
              flexShrink: 0,
            }}
          />
          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 'bold', color: '#222' }}>
              {image ? 'Drop new image to replace' : 'Drop image here or click to select'}
            </div>
            <div style={{ fontSize: 11, color: '#6A6A5A', marginTop: 2 }}>
              PNG, JPG, WebP, GIF (max 5MB) or command+v to paste
            </div>
          </div>
          {/* Button */}
          <button
            className="btn-pixel-primary"
            style={{ padding: '10px 16px', fontSize: 12, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={e => { e.stopPropagation(); fileInputRef.current?.click() }}
          >
            <FontAwesomeIcon icon={faUpload} />
            {image ? 'Change' : 'Upload'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ fontSize: 11, color: '#CC2222', border: '1px solid #FFAAAA', background: '#FFF0F0', padding: '4px 8px' }}>
          {error}
        </div>
      )}

      {/* Controls */}
      {image && (
        <div style={{ border: '2px solid #C8C4B8', padding: '16px 12px', background: '#F5F2EC' }}>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {/* Pixel Size */}
            <div>
              <div style={{ fontSize: 11, color: '#6A6A5A', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pixel Size</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {PIXEL_SIZES.map(size => (
                  <button
                    key={size}
                    onClick={() => setPixelSize(size)}
                    className={pixelSize === size ? 'btn-pixel-active' : 'btn-pixel'}
                    style={{ width: 52, height: 36, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {size}px
                  </button>
                ))}
              </div>
            </div>

            {/* Remove BG */}
            <div>
              <div style={{ fontSize: 11, color: '#6A6A5A', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Background</div>
              <button
                onClick={() => setRemoveBg(v => !v)}
                className={removeBg ? 'btn-pixel-active' : 'btn-pixel'}
                style={{ padding: '6px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <span style={{
                  width: 14, height: 14,
                  border: '2px solid currentColor',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 9,
                  flexShrink: 0,
                }}>
                  {removeBg ? <FontAwesomeIcon icon={faCheck} /> : ''}
                </span>
                Remove BG
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Before / After preview */}
      {image && (
        <div className="before-after-wrap" style={{ display: 'flex', gap: 10, flex: 1, minHeight: 0 }}>
          {/* Before */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
            <span style={{ fontSize: 11, color: '#6A6A5A', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Before</span>
            <div style={{
              flex: 1,
              border: '2px solid #C8C4B8',
              background: '#fff',
              overflow: 'hidden',
              minHeight: 160,
            }}>
              <img
                src={originalDataUrl}
                alt="Original"
                style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
              />
            </div>
          </div>

          {/* After */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
            <span style={{ fontSize: 11, color: '#6A6A5A', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              After{removeBg && <span style={{ color: '#3550C4' }}> · transparent</span>}
            </span>
            <div style={{
              flex: 1,
              border: '2px solid #C8C4B8',
              backgroundImage: removeBg
                ? 'linear-gradient(45deg,#ccc 25%,transparent 25%),linear-gradient(-45deg,#ccc 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#ccc 75%),linear-gradient(-45deg,transparent 75%,#ccc 75%)'
                : 'none',
              backgroundColor: '#fff',
              backgroundSize: removeBg ? '16px 16px' : 'auto',
              backgroundPosition: removeBg ? '0 0,0 8px,8px -8px,-8px 0' : 'auto',
              overflow: 'hidden',
              minHeight: 160,
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {isConverting ? (
                <div style={{ fontSize: 11, color: '#999' }}>converting…</div>
              ) : convertedDataUrl ? (
                <img
                  src={convertedDataUrl}
                  alt="Pixel art"
                  className="pixel-canvas"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated', display: 'block' }}
                />
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!image && !error && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10 }}>
          <img src="/NoImgContentIcon.png" alt="" style={{ width: 90, imageRendering: 'pixelated', opacity: 0.8 }} />
          <div style={{ fontSize: 12, color: '#8A8A7A' }}>Upload an image to started!</div>
        </div>
      )}

      {/* Action bar */}
      {convertedDataUrl && !isConverting && (
        <div style={{
          marginTop: 4,
        }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleDownloadPNG}
              className="btn-pixel"
              style={{ flex: 1, padding: '10px 8px', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
            >
              <FontAwesomeIcon icon={faDownload} /> Save as PNG
            </button>
            <button
              onClick={handleDownloadSVG}
              className="btn-pixel"
              style={{ flex: 1, padding: '10px 8px', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
            >
              <FontAwesomeIcon icon={faDownload} /> Save as SVG
            </button>
            <button
              onClick={handleUseThis}
              className="btn-pixel-primary"
              style={{ flex: 1, padding: '10px 8px', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
            >
              <FontAwesomeIcon icon={faPlus} /> Use this frame
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
