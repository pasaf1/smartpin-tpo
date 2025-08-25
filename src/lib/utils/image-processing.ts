'use client'

export interface ImageProcessingResult {
  originalUrl: string
  annotatedUrl: string
  annotations: any[]
  metadata: {
    width: number
    height: number
    size: number
    format: string
    uploadedAt: string
  }
}

export interface AnnotationData {
  id: string
  type: 'arrow' | 'rectangle' | 'circle' | 'text' | 'freehand'
  x: number
  y: number
  width?: number
  height?: number
  color: string
  strokeWidth: number
  text?: string
  severity?: 'Low' | 'Medium' | 'High' | 'Critical'
  timestamp: number
  author: string
  points?: { x: number; y: number }[]
}

export class ImageProcessor {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D

  constructor() {
    this.canvas = document.createElement('canvas')
    this.ctx = this.canvas.getContext('2d')!
  }

  async processImage(
    imageFile: File, 
    annotations: AnnotationData[] = []
  ): Promise<ImageProcessingResult> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      
      img.onload = () => {
        try {
          // Set canvas dimensions to match image
          this.canvas.width = img.width
          this.canvas.height = img.height

          // Clear canvas and draw original image
          this.ctx.clearRect(0, 0, img.width, img.height)
          this.ctx.drawImage(img, 0, 0)

          // Create original image URL
          const originalUrl = this.canvas.toDataURL('image/png', 0.95)

          // Draw annotations if provided
          let annotatedUrl = originalUrl
          if (annotations.length > 0) {
            this.drawAnnotations(annotations)
            annotatedUrl = this.canvas.toDataURL('image/png', 0.95)
          }

          const result: ImageProcessingResult = {
            originalUrl,
            annotatedUrl,
            annotations,
            metadata: {
              width: img.width,
              height: img.height,
              size: imageFile.size,
              format: imageFile.type,
              uploadedAt: new Date().toISOString()
            }
          }

          resolve(result)
        } catch (error) {
          reject(error)
        }
      }

      img.onerror = () => {
        reject(new Error('Failed to load image'))
      }

      // Create object URL for the image
      const objectUrl = URL.createObjectURL(imageFile)
      img.src = objectUrl

      // Cleanup
      img.onload = () => {
        URL.revokeObjectURL(objectUrl)
        img.onload()
      }
    })
  }

  private drawAnnotations(annotations: AnnotationData[]) {
    annotations.forEach(annotation => {
      this.ctx.save()
      
      // Set annotation style
      this.ctx.strokeStyle = annotation.color
      this.ctx.lineWidth = annotation.strokeWidth
      this.ctx.fillStyle = annotation.color

      switch (annotation.type) {
        case 'arrow':
          this.drawArrow(annotation)
          break
        case 'rectangle':
          this.drawRectangle(annotation)
          break
        case 'circle':
          this.drawCircle(annotation)
          break
        case 'text':
          this.drawText(annotation)
          break
        case 'freehand':
          this.drawFreehand(annotation)
          break
      }

      this.ctx.restore()
    })
  }

  private drawArrow(annotation: AnnotationData) {
    if (!annotation.width || !annotation.height) return

    const startX = annotation.x
    const startY = annotation.y
    const endX = annotation.x + annotation.width
    const endY = annotation.y + annotation.height

    // Draw arrow line
    this.ctx.beginPath()
    this.ctx.moveTo(startX, startY)
    this.ctx.lineTo(endX, endY)
    this.ctx.stroke()

    // Draw arrowhead
    const headLength = Math.min(20, Math.sqrt(annotation.width ** 2 + annotation.height ** 2) * 0.2)
    const angle = Math.atan2(annotation.height, annotation.width)
    
    this.ctx.beginPath()
    this.ctx.moveTo(endX, endY)
    this.ctx.lineTo(
      endX - headLength * Math.cos(angle - Math.PI / 6),
      endY - headLength * Math.sin(angle - Math.PI / 6)
    )
    this.ctx.moveTo(endX, endY)
    this.ctx.lineTo(
      endX - headLength * Math.cos(angle + Math.PI / 6),
      endY - headLength * Math.sin(angle + Math.PI / 6)
    )
    this.ctx.stroke()
  }

  private drawRectangle(annotation: AnnotationData) {
    if (!annotation.width || !annotation.height) return

    this.ctx.beginPath()
    this.ctx.rect(annotation.x, annotation.y, annotation.width, annotation.height)
    this.ctx.stroke()
  }

  private drawCircle(annotation: AnnotationData) {
    if (!annotation.width || !annotation.height) return

    const centerX = annotation.x + annotation.width / 2
    const centerY = annotation.y + annotation.height / 2
    const radius = Math.min(annotation.width, annotation.height) / 2

    this.ctx.beginPath()
    this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
    this.ctx.stroke()
  }

  private drawText(annotation: AnnotationData) {
    if (!annotation.text) return

    const fontSize = annotation.strokeWidth * 3
    this.ctx.font = `${fontSize}px Arial`
    this.ctx.textAlign = 'left'
    this.ctx.textBaseline = 'top'
    
    // Draw text background
    const metrics = this.ctx.measureText(annotation.text)
    const padding = 4
    
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    this.ctx.fillRect(
      annotation.x - padding,
      annotation.y - padding,
      metrics.width + padding * 2,
      fontSize + padding * 2
    )
    
    // Draw text
    this.ctx.fillStyle = annotation.color
    this.ctx.fillText(annotation.text, annotation.x, annotation.y)
  }

  private drawFreehand(annotation: AnnotationData) {
    if (!annotation.points || annotation.points.length < 2) return

    this.ctx.beginPath()
    this.ctx.moveTo(annotation.points[0].x, annotation.points[0].y)
    
    for (let i = 1; i < annotation.points.length; i++) {
      this.ctx.lineTo(annotation.points[i].x, annotation.points[i].y)
    }
    
    this.ctx.stroke()
  }

  async uploadToSupabase(
    originalBlob: Blob,
    annotatedBlob: Blob | null,
    metadata: any
  ): Promise<{ originalPath: string; annotatedPath?: string }> {
    // Mock implementation for demo mode
    const timestamp = Date.now()
    const originalPath = `images/original_${timestamp}.png`
    const annotatedPath = annotatedBlob ? `images/annotated_${timestamp}.png` : undefined

    // In production, this would upload to Supabase Storage
    // const { data: originalData, error: originalError } = await supabase.storage
    //   .from('pin-images')
    //   .upload(originalPath, originalBlob)
    
    // if (annotatedBlob) {
    //   const { data: annotatedData, error: annotatedError } = await supabase.storage
    //     .from('pin-images')
    //     .upload(annotatedPath, annotatedBlob)
    // }

    console.log('Demo: Would upload images to Supabase:', {
      originalPath,
      annotatedPath,
      metadata
    })

    return { originalPath, annotatedPath }
  }

  dataURLToBlob(dataURL: string): Blob {
    const arr = dataURL.split(',')
    const mime = arr[0].match(/:(.*?);/)![1]
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    
    return new Blob([u8arr], { type: mime })
  }

  cleanup() {
    // Clean up canvas and context if needed
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }
}

// Singleton instance for performance
let processorInstance: ImageProcessor | null = null

export function getImageProcessor(): ImageProcessor {
  if (!processorInstance) {
    processorInstance = new ImageProcessor()
  }
  return processorInstance
}

export function cleanupImageProcessor() {
  if (processorInstance) {
    processorInstance.cleanup()
    processorInstance = null
  }
}