'use client'

/* ---------- Types ---------- */
export interface ImageMetadata {
  width: number
  height: number
  size: number
  format: string
  uploadedAt: string
}

export interface ImageProcessingResult {
  originalUrl: string
  annotatedUrl: string
  annotations: AnnotationData[]
  metadata: ImageMetadata
}

export type SeverityLevel = 'Low' | 'Medium' | 'High' | 'Critical'
export type AnnotationType = 'arrow' | 'rectangle' | 'circle' | 'text' | 'freehand'

export interface Point {
  x: number
  y: number
}

export interface AnnotationData {
  id: string
  type: AnnotationType
  x: number
  y: number
  width?: number
  height?: number
  color: string
  strokeWidth: number
  text?: string
  severity?: SeverityLevel
  timestamp: number
  author: string
  points?: Point[]
}

/* ---------- Implementation ---------- */
export class ImageProcessor {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D

  constructor() {
    this.canvas = document.createElement('canvas')
    const context = this.canvas.getContext('2d')
    if (!context) throw new Error('2D context is not available')
    this.ctx = context
  }

  async processImage(
    imageFile: File,
    annotations: AnnotationData[] = []
  ): Promise<ImageProcessingResult> {
    const img = new Image()
    const objectUrl = URL.createObjectURL(imageFile)

    try {
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('Failed to load image'))
        img.src = objectUrl
      })
    } finally {
      URL.revokeObjectURL(objectUrl)
    }

    // Size canvas to image
    this.canvas.width = img.width
    this.canvas.height = img.height

    // Draw base image
    this.ctx.clearRect(0, 0, img.width, img.height)
    this.ctx.drawImage(img, 0, 0)

    // Original snapshot
    const originalUrl = this.canvas.toDataURL('image/png')

    // Draw annotations (if any)
    if (annotations.length > 0) {
      this.drawAnnotations(annotations)
    }

    const annotatedUrl = this.canvas.toDataURL('image/png')

    const result: ImageProcessingResult = {
      originalUrl,
      annotatedUrl,
      annotations,
      metadata: {
        width: img.width,
        height: img.height,
        size: imageFile.size,
        format: imageFile.type || 'image/png',
        uploadedAt: new Date().toISOString(),
      },
    }

    return result
  }

  private drawAnnotations(annotations: AnnotationData[]): void {
    for (const a of annotations) {
      this.ctx.save()
      this.ctx.lineWidth = Math.max(1, a.strokeWidth)
      this.ctx.strokeStyle = a.color
      this.ctx.fillStyle = a.color

      switch (a.type) {
        case 'arrow':
          this.drawArrow(a)
          break
        case 'rectangle':
          this.drawRectangle(a)
          break
        case 'circle':
          this.drawCircle(a)
          break
        case 'text':
          this.drawText(a)
          break
        case 'freehand':
          this.drawFreehand(a)
          break
      }

      this.ctx.restore()
    }
  }

  private drawArrow(a: AnnotationData): void {
    if (a.width == null || a.height == null) return
    const startX = a.x
    const startY = a.y
    const endX = a.x + a.width
    const endY = a.y + a.height

    this.ctx.beginPath()
    this.ctx.moveTo(startX, startY)
    this.ctx.lineTo(endX, endY)
    this.ctx.stroke()

    const len = Math.hypot(a.width, a.height)
    const head = Math.min(20, len * 0.2)
    const angle = Math.atan2(a.height, a.width)

    this.ctx.beginPath()
    this.ctx.moveTo(endX, endY)
    this.ctx.lineTo(
      endX - head * Math.cos(angle - Math.PI / 6),
      endY - head * Math.sin(angle - Math.PI / 6)
    )
    this.ctx.moveTo(endX, endY)
    this.ctx.lineTo(
      endX - head * Math.cos(angle + Math.PI / 6),
      endY - head * Math.sin(angle + Math.PI / 6)
    )
    this.ctx.stroke()
  }

  private drawRectangle(a: AnnotationData): void {
    if (a.width == null || a.height == null) return
    this.ctx.beginPath()
    this.ctx.rect(a.x, a.y, a.width, a.height)
    this.ctx.stroke()
  }

  private drawCircle(a: AnnotationData): void {
    if (a.width == null || a.height == null) return
    const cx = a.x + a.width / 2
    const cy = a.y + a.height / 2
    const r = Math.min(a.width, a.height) / 2
    this.ctx.beginPath()
    this.ctx.arc(cx, cy, r, 0, 2 * Math.PI)
    this.ctx.stroke()
  }

  private drawText(a: AnnotationData): void {
    if (!a.text) return
    const fontSize = Math.max(10, Math.round(a.strokeWidth * 3))
    this.ctx.font = `${fontSize}px Arial, sans-serif`
    this.ctx.textAlign = 'left'
    this.ctx.textBaseline = 'top'

    const metrics = this.ctx.measureText(a.text)
    const padding = 4
    // background
    this.ctx.save()
    this.ctx.fillStyle = 'rgba(255,255,255,0.85)'
    this.ctx.fillRect(a.x - padding, a.y - padding, metrics.width + padding * 2, fontSize + padding * 2)
    this.ctx.restore()

    // text
    this.ctx.fillStyle = a.color
    this.ctx.fillText(a.text, a.x, a.y)
  }

  private drawFreehand(a: AnnotationData): void {
    if (!a.points || a.points.length < 2) return
    this.ctx.beginPath()
    this.ctx.moveTo(a.points[0].x, a.points[0].y)
    for (let i = 1; i < a.points.length; i++) {
      this.ctx.lineTo(a.points[i].x, a.points[i].y)
    }
    this.ctx.stroke()
  }

  async uploadToSupabase(
    originalBlob: Blob,
    annotatedBlob: Blob | null,
    metadata: ImageMetadata
  ): Promise<{ originalPath: string; annotatedPath?: string }> {
    const ts = Date.now()
    const originalPath = `images/original_${ts}.png`
    const annotatedPath = annotatedBlob ? `images/annotated_${ts}.png` : undefined

    // Example for production (uncomment and ensure bucket exists):
    // const { error: e1 } = await supabase.storage.from('pin-images').upload(originalPath, originalBlob)
    // if (e1) throw e1
    // if (annotatedBlob) {
    //   const { error: e2 } = await supabase.storage.from('pin-images').upload(annotatedPath!, annotatedBlob)
    //   if (e2) throw e2
    // }

    console.debug('Upload planned', { originalPath, annotatedPath, metadata })
    return { originalPath, annotatedPath }
  }

  dataURLToBlob(dataURL: string): Blob {
    const [meta, b64] = dataURL.split(',')
    const mimeMatch = meta.match(/data:(.*?);base64/)
    const mime = mimeMatch ? mimeMatch[1] : 'image/png'
    const bin = atob(b64)
    const len = bin.length
    const u8 = new Uint8Array(len)
    for (let i = 0; i < len; i++) u8[i] = bin.charCodeAt(i)
    return new Blob([u8], { type: mime })
  }

  cleanup(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }
}

/* ---------- Singleton ---------- */
let processorInstance: ImageProcessor | null = null

export function getImageProcessor(): ImageProcessor {
  if (!processorInstance) processorInstance = new ImageProcessor()
  return processorInstance
}

export function cleanupImageProcessor(): void {
  if (!processorInstance) return
  processorInstance.cleanup()
  processorInstance = null
}
