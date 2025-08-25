export interface ImageOptimizationOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'jpeg' | 'webp' | 'png'
  progressive?: boolean
}

export interface CompressionResult {
  file: File
  originalSize: number
  compressedSize: number
  compressionRatio: number
  quality: number
}

export interface BasicImageMetadata {
  width: number
  height: number
  aspectRatio: number
  megapixels: number
}

export class ImageOptimizer {
  static async compressImage(
    file: File,
    options: ImageOptimizationOptions = {}
  ): Promise<CompressionResult> {
    const {
      maxWidth = 1920,
      maxHeight = 1920,
      quality = 0.8,
      format = 'jpeg',
      progressive: _progressive = true, // hint only; canvas API has no progressive toggle
    } = options

    // Use the flag to satisfy linters and document intent
    if (_progressive && format === 'jpeg') {
      // Progressive JPEG is encoder-level; kept here as a no-op hint for future encoders.
    }

    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      if (!ctx) {
        reject(new Error('Canvas context not available'))
        return
      }

      const objectUrl = URL.createObjectURL(file)

      img.onload = () => {
        try {
          URL.revokeObjectURL(objectUrl)

          let { width, height } = img
          const aspectRatio = width / height

          if (width > maxWidth) {
            width = maxWidth
            height = Math.round(width / aspectRatio)
          }
          if (height > maxHeight) {
            height = maxHeight
            width = Math.round(height * aspectRatio)
          }

          canvas.width = width
          canvas.height = height

          // Paint white background for JPEG to avoid black transparency
          if (format === 'jpeg') {
            ctx.fillStyle = '#FFFFFF'
            ctx.fillRect(0, 0, width, height)
          }

          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'
          ctx.drawImage(img, 0, 0, width, height)

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Compression failed'))
                return
              }

              const extMime: Record<typeof format, string> = {
                jpeg: 'image/jpeg',
                webp: 'image/webp',
                png: 'image/png',
              }

              const compressedFile = new File([blob], file.name, {
                type: extMime[format],
                lastModified: Date.now(),
              })

              const compressionRatio = file.size > 0 ? blob.size / file.size : 1

              resolve({
                file: compressedFile,
                originalSize: file.size,
                compressedSize: blob.size,
                compressionRatio,
                quality,
              })
            },
            `image/${format}`,
            quality
          )
        } catch (e) {
          reject(e)
        }
      }

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl)
        reject(new Error('Failed to load image'))
      }

      img.src = objectUrl
    })
  }

  static async generateThumbnail(
    file: File,
    size = 200,
    quality = 0.7
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      if (!ctx) {
        reject(new Error('Canvas context not available'))
        return
      }

      const objectUrl = URL.createObjectURL(file)

      img.onload = () => {
        try {
          URL.revokeObjectURL(objectUrl)

          canvas.width = size
          canvas.height = size

          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(0, 0, size, size)

          const minDim = Math.min(img.width, img.height)
          const x = (img.width - minDim) / 2
          const y = (img.height - minDim) / 2

          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'
          ctx.drawImage(img, x, y, minDim, minDim, 0, 0, size, size)

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Thumbnail generation failed'))
                return
              }
              const thumbnailFile = new File([blob], `thumb_${file.name}`, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              })
              resolve(thumbnailFile)
            },
            'image/jpeg',
            quality
          )
        } catch (e) {
          reject(e)
        }
      }

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl)
        reject(new Error('Failed to load image for thumbnail'))
      }

      img.src = objectUrl
    })
  }

  static async addWatermark(
    file: File,
    watermarkText: string,
    options: {
      position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center'
      fontSize?: number
      color?: string
      backgroundColor?: string
      opacity?: number
    } = {}
  ): Promise<File> {
    const {
      position = 'bottom-right',
      fontSize = 16,
      color = '#FFFFFF',
      backgroundColor = 'rgba(0,0,0,0.5)',
      opacity = 0.8,
    } = options

    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      if (!ctx) {
        reject(new Error('Canvas context not available'))
        return
      }

      const objectUrl = URL.createObjectURL(file)

      img.onload = () => {
        try {
          URL.revokeObjectURL(objectUrl)

          canvas.width = img.width
          canvas.height = img.height
          ctx.drawImage(img, 0, 0)

          ctx.font = `${fontSize}px Arial, sans-serif`
          ctx.globalAlpha = opacity

          const metrics = ctx.measureText(watermarkText)
          const textWidth = metrics.width
          const textHeight = fontSize
          const padding = 10

          let x: number
          let y: number
          switch (position) {
            case 'bottom-left':
              x = padding
              y = canvas.height - padding
              break
            case 'top-right':
              x = canvas.width - textWidth - padding
              y = textHeight + padding
              break
            case 'top-left':
              x = padding
              y = textHeight + padding
              break
            case 'center':
              x = (canvas.width - textWidth) / 2
              y = canvas.height / 2
              break
            case 'bottom-right':
            default:
              x = canvas.width - textWidth - padding
              y = canvas.height - padding
          }

          // Background box
          ctx.fillStyle = backgroundColor
          ctx.fillRect(
            x - padding / 2,
            y - textHeight - padding / 2,
            textWidth + padding,
            textHeight + padding
          )

          // Text
          ctx.fillStyle = color
          ctx.fillText(watermarkText, x, y)

          ctx.globalAlpha = 1

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Watermark failed'))
                return
              }
              const watermarkedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              })
              resolve(watermarkedFile)
            },
            file.type,
            0.9
          )
        } catch (e) {
          reject(e)
        }
      }

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl)
        reject(new Error('Failed to load image for watermarking'))
      }

      img.src = objectUrl
    })
  }

  static async generateImageHash(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async () => {
        try {
          const arrayBuffer = reader.result as ArrayBuffer
          const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
          const hashArray = Array.from(new Uint8Array(hashBuffer))
          const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
          resolve(hashHex)
        } catch (e) {
          reject(e)
        }
      }
      reader.onerror = () => reject(new Error('Failed to read file for hashing'))
      reader.readAsArrayBuffer(file)
    })
  }

  static getImageMetadata(file: File): Promise<BasicImageMetadata> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const objectUrl = URL.createObjectURL(file)

      img.onload = () => {
        URL.revokeObjectURL(objectUrl)
        const metadata: BasicImageMetadata = {
          width: img.width,
          height: img.height,
          aspectRatio: img.width / img.height,
          megapixels: (img.width * img.height) / 1_000_000,
        }
        resolve(metadata)
      }

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl)
        reject(new Error('Failed to load image metadata'))
      }

      img.src = objectUrl
    })
  }

  static validateImageFile(file: File): { valid: boolean; error?: string } {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/heic',
      'image/heif',
    ]

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} is not supported. Please use: JPEG, PNG, WebP, or HEIC`,
      }
    }

    const maxSize = 25 * 1024 * 1024 // 25MB
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds maximum of 25MB`,
      }
    }

    return { valid: true }
  }

  static async processImageForUpload(
    file: File,
    options: ImageOptimizationOptions & {
      generateThumbnail?: boolean
      addWatermark?: boolean
      watermarkText?: string
    } = {}
  ): Promise<{
    main: CompressionResult
    thumbnail?: File
    hash: string
    metadata: BasicImageMetadata
  }> {
    const validation = this.validateImageFile(file)
    if (!validation.valid) {
      throw new Error(validation.error)
    }

    const [compressed, metadata, hash] = await Promise.all([
      this.compressImage(file, options),
      this.getImageMetadata(file),
      this.generateImageHash(file),
    ])

    let thumbnail: File | undefined
    if (options.generateThumbnail) {
      thumbnail = await this.generateThumbnail(compressed.file)
    }

    let finalFile = compressed.file
    if (options.addWatermark && options.watermarkText) {
      finalFile = await this.addWatermark(compressed.file, options.watermarkText, {
        position: 'bottom-right',
      })
    }

    return {
      main: { ...compressed, file: finalFile },
      thumbnail,
      hash,
      metadata,
    }
  }
}

export const imageOptimizer = new ImageOptimizer()
