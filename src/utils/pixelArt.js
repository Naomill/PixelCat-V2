const FRAME_SIZE = 400

/**
 * Remove background by flood-filling from all 4 corners.
 * Sets matching pixels to alpha=0.
 * @param {ImageData} imageData - will be mutated in place
 * @param {number} tolerance - color distance threshold (Euclidean, 0–441)
 */
function removeBackground(imageData, tolerance = 35) {
  const { width, height, data } = imageData
  const visited = new Uint8Array(width * height)

  const corners = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ]

  for (const [sx, sy] of corners) {
    const si = (sy * width + sx) * 4
    if (data[si + 3] < 128) continue // already transparent

    const bgR = data[si], bgG = data[si + 1], bgB = data[si + 2]
    const thresh = tolerance * tolerance

    const stack = [sy * width + sx]
    while (stack.length > 0) {
      const pos = stack.pop()
      if (visited[pos]) continue
      visited[pos] = 1

      const i = pos * 4
      if (data[i + 3] < 128) continue

      const dr = data[i] - bgR, dg = data[i + 1] - bgG, db = data[i + 2] - bgB
      if (dr * dr + dg * dg + db * db > thresh) continue

      data[i + 3] = 0

      const x = pos % width, y = (pos / width) | 0
      if (x > 0) stack.push(pos - 1)
      if (x < width - 1) stack.push(pos + 1)
      if (y > 0) stack.push(pos - width)
      if (y < height - 1) stack.push(pos + width)
    }
  }
}

/**
 * Crop a canvas to the bounding box of non-transparent pixels.
 * @param {HTMLCanvasElement} canvas
 * @returns {HTMLCanvasElement} cropped canvas (or original if all transparent)
 */
export function cropToContent(canvas) {
  const ctx = canvas.getContext('2d')
  const { width, height } = canvas
  const data = ctx.getImageData(0, 0, width, height).data

  let minX = width, maxX = -1, minY = height, maxY = -1

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] >= 128) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }

  if (maxX < 0) return canvas // nothing visible

  const cw = maxX - minX + 1
  const ch = maxY - minY + 1
  const out = document.createElement('canvas')
  out.width = cw
  out.height = ch
  out.getContext('2d').drawImage(canvas, minX, minY, cw, ch, 0, 0, cw, ch)
  return out
}

/**
 * Quantize color to reduced palette using median cut algorithm.
 * @param {Uint8ClampedArray} pixels - flat RGBA pixel array
 * @param {number} numColors - target palette size
 * @returns {Array<[number,number,number]>} palette of [r,g,b] entries
 */
function buildPalette(pixels, numColors) {
  // Collect all opaque colors with 5-bit quantization for performance
  const colorMap = new Map()
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] < 128) continue
    const r = pixels[i] & 0xF8
    const g = pixels[i + 1] & 0xF8
    const b = pixels[i + 2] & 0xF8
    const key = (r << 16) | (g << 8) | b
    colorMap.set(key, (colorMap.get(key) || 0) + 1)
  }

  const colors = Array.from(colorMap.entries()).map(([key, count]) => ({
    r: (key >> 16) & 0xFF,
    g: (key >> 8) & 0xFF,
    b: key & 0xFF,
    count,
  }))

  if (colors.length === 0) return [[0, 0, 0]]
  if (colors.length <= numColors) return colors.map(c => [c.r, c.g, c.b])

  // Median cut
  let buckets = [colors]

  while (buckets.length < numColors) {
    let maxRange = -1
    let splitIdx = 0

    for (let i = 0; i < buckets.length; i++) {
      const range = channelRange(buckets[i])
      if (range > maxRange) {
        maxRange = range
        splitIdx = i
      }
    }

    const bucket = buckets[splitIdx]
    if (bucket.length <= 1) break

    const ch = dominantChannel(bucket)
    bucket.sort((a, b) => a[ch] - b[ch])
    const mid = Math.ceil(bucket.length / 2)
    const a = bucket.slice(0, mid)
    const b = bucket.slice(mid)

    if (a.length === 0 || b.length === 0) break
    buckets.splice(splitIdx, 1, a, b)
  }

  return buckets.map(bucket => {
    const total = bucket.reduce((s, c) => s + c.count, 0)
    const r = Math.round(bucket.reduce((s, c) => s + c.r * c.count, 0) / total)
    const g = Math.round(bucket.reduce((s, c) => s + c.g * c.count, 0) / total)
    const b = Math.round(bucket.reduce((s, c) => s + c.b * c.count, 0) / total)
    return [r, g, b]
  })
}

function channelRange(colors) {
  if (colors.length === 0) return 0
  let minR = 255, maxR = 0, minG = 255, maxG = 0, minB = 255, maxB = 0
  for (const c of colors) {
    if (c.r < minR) minR = c.r
    if (c.r > maxR) maxR = c.r
    if (c.g < minG) minG = c.g
    if (c.g > maxG) maxG = c.g
    if (c.b < minB) minB = c.b
    if (c.b > maxB) maxB = c.b
  }
  return Math.max(maxR - minR, maxG - minG, maxB - minB)
}

function dominantChannel(colors) {
  let minR = 255, maxR = 0, minG = 255, maxG = 0, minB = 255, maxB = 0
  for (const c of colors) {
    if (c.r < minR) minR = c.r; if (c.r > maxR) maxR = c.r
    if (c.g < minG) minG = c.g; if (c.g > maxG) maxG = c.g
    if (c.b < minB) minB = c.b; if (c.b > maxB) maxB = c.b
  }
  const rRange = maxR - minR, gRange = maxG - minG, bRange = maxB - minB
  if (rRange >= gRange && rRange >= bRange) return 'r'
  if (gRange >= bRange) return 'g'
  return 'b'
}

function nearestColor(palette, r, g, b) {
  let minDist = Infinity
  let best = palette[0]
  for (const p of palette) {
    const dr = r - p[0], dg = g - p[1], db = b - p[2]
    const dist = dr * dr + dg * dg + db * db
    if (dist < minDist) {
      minDist = dist
      best = p
    }
  }
  return best
}

/**
 * Convert an image to pixel art and return a dataURL.
 * @param {HTMLImageElement} img
 * @param {number} pixelSize - block size: 2, 4, 8, or 16
 * @param {number|'full'} numColors - palette size or 'full'
 * @param {{ removeBg?: boolean, bgTolerance?: number }} opts
 * @returns {string} dataURL of the pixel art canvas (PNG, transparent when removeBg=true)
 */
export function convertToPixelArt(img, pixelSize, numColors, { removeBg = false, bgTolerance = 35 } = {}) {
  const tileW = Math.floor(FRAME_SIZE / pixelSize)
  const tileH = Math.floor(FRAME_SIZE / pixelSize)

  // Step 1: Shrink image to tile size, preserving aspect ratio (letterbox)
  const smallCanvas = document.createElement('canvas')
  smallCanvas.width = tileW
  smallCanvas.height = tileH
  const smallCtx = smallCanvas.getContext('2d')
  smallCtx.imageSmoothingEnabled = false
  smallCtx.imageSmoothingQuality = 'low'

  // Letterbox: fit image into tileW x tileH
  const imgAspect = img.naturalWidth / img.naturalHeight
  let drawW = tileW, drawH = tileH, drawX = 0, drawY = 0
  if (imgAspect > 1) {
    drawH = Math.floor(tileH / imgAspect)
    drawY = Math.floor((tileH - drawH) / 2)
  } else {
    drawW = Math.floor(tileW * imgAspect)
    drawX = Math.floor((tileW - drawW) / 2)
  }

  // Fill background only when NOT removing it
  if (!removeBg) {
    smallCtx.fillStyle = '#F5F0E8'
    smallCtx.fillRect(0, 0, tileW, tileH)
  }
  smallCtx.drawImage(img, drawX, drawY, drawW, drawH)

  // Step 2: Read pixels, optionally remove background
  const imageData = smallCtx.getImageData(0, 0, tileW, tileH)
  if (removeBg) {
    removeBackground(imageData, bgTolerance)
  }
  const pixels = imageData.data

  // Step 3: Build palette if needed (only from opaque pixels)
  let palette = null
  if (numColors !== 'full') {
    palette = buildPalette(pixels, numColors)
  }

  // Step 4: Draw pixel art on full canvas
  const canvas = document.createElement('canvas')
  canvas.width = FRAME_SIZE
  canvas.height = FRAME_SIZE
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = false

  // Fill background only when NOT using transparency
  if (!removeBg) {
    ctx.fillStyle = '#F5F0E8'
    ctx.fillRect(0, 0, FRAME_SIZE, FRAME_SIZE)
  }

  for (let y = 0; y < tileH; y++) {
    for (let x = 0; x < tileW; x++) {
      const i = (y * tileW + x) * 4
      if (pixels[i + 3] < 128) continue // skip transparent pixels

      let r = pixels[i], g = pixels[i + 1], b = pixels[i + 2]

      if (palette) {
        const nearest = nearestColor(palette, r, g, b)
        r = nearest[0]; g = nearest[1]; b = nearest[2]
      }

      ctx.fillStyle = `rgb(${r},${g},${b})`
      ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize)
    }
  }

  return canvas.toDataURL('image/png')
}

/**
 * Convert an image to pixel art SVG string.
 * Each pixel block becomes a <rect> element.
 * @param {HTMLImageElement} img
 * @param {number} pixelSize
 * @param {number|'full'} numColors
 * @param {{ removeBg?: boolean, bgTolerance?: number }} opts
 * @returns {string} SVG markup
 */
export function convertToSVG(img, pixelSize, numColors, { removeBg = false, bgTolerance = 35 } = {}) {
  const tileW = Math.floor(FRAME_SIZE / pixelSize)
  const tileH = Math.floor(FRAME_SIZE / pixelSize)

  const smallCanvas = document.createElement('canvas')
  smallCanvas.width = tileW
  smallCanvas.height = tileH
  const smallCtx = smallCanvas.getContext('2d')
  smallCtx.imageSmoothingEnabled = false
  smallCtx.imageSmoothingQuality = 'low'

  const imgAspect = img.naturalWidth / img.naturalHeight
  let drawW = tileW, drawH = tileH, drawX = 0, drawY = 0
  if (imgAspect > 1) {
    drawH = Math.floor(tileH / imgAspect)
    drawY = Math.floor((tileH - drawH) / 2)
  } else {
    drawW = Math.floor(tileW * imgAspect)
    drawX = Math.floor((tileW - drawW) / 2)
  }

  if (!removeBg) {
    smallCtx.fillStyle = '#F5F0E8'
    smallCtx.fillRect(0, 0, tileW, tileH)
  }
  smallCtx.drawImage(img, drawX, drawY, drawW, drawH)

  const imageData = smallCtx.getImageData(0, 0, tileW, tileH)
  if (removeBg) removeBackground(imageData, bgTolerance)
  const pixels = imageData.data

  let palette = null
  if (numColors !== 'full') {
    palette = buildPalette(pixels, numColors)
  }

  // Build bounding box for viewBox when removeBg is true
  let svgW = FRAME_SIZE, svgH = FRAME_SIZE
  let offsetX = 0, offsetY = 0

  if (removeBg) {
    let minX = tileW, maxX = -1, minY = tileH, maxY = -1
    for (let y = 0; y < tileH; y++) {
      for (let x = 0; x < tileW; x++) {
        if (pixels[(y * tileW + x) * 4 + 3] >= 128) {
          if (x < minX) minX = x
          if (x > maxX) maxX = x
          if (y < minY) minY = y
          if (y > maxY) maxY = y
        }
      }
    }
    if (maxX >= 0) {
      offsetX = minX * pixelSize
      offsetY = minY * pixelSize
      svgW = (maxX - minX + 1) * pixelSize
      svgH = (maxY - minY + 1) * pixelSize
    }
  }

  const parts = [`<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" shape-rendering="crispEdges">`]

  if (!removeBg) {
    parts.push(`<rect width="${svgW}" height="${svgH}" fill="${'#F5F0E8'}"/>`)
  }

  for (let y = 0; y < tileH; y++) {
    for (let x = 0; x < tileW; x++) {
      const i = (y * tileW + x) * 4
      if (pixels[i + 3] < 128) continue

      let r = pixels[i], g = pixels[i + 1], b = pixels[i + 2]
      if (palette) {
        const nearest = nearestColor(palette, r, g, b)
        r = nearest[0]; g = nearest[1]; b = nearest[2]
      }

      const px = x * pixelSize - offsetX
      const py = y * pixelSize - offsetY
      parts.push(`<rect x="${px}" y="${py}" width="${pixelSize}" height="${pixelSize}" fill="rgb(${r},${g},${b})"/>`)
    }
  }

  parts.push('</svg>')
  return parts.join('\n')
}

/**
 * Generate a thumbnail dataURL from a pixel art dataURL.
 * @param {string} dataUrl
 * @param {number} size - thumbnail size in px
 * @returns {Promise<string>}
 */
export function generateThumbnail(dataUrl, size = 80) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(img, 0, 0, size, size)
      resolve(canvas.toDataURL('image/png'))
    }
    img.src = dataUrl
  })
}
