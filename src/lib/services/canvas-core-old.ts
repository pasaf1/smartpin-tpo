/**
 * Canvas Core Service - Precision canvas operations and coordinate transformations
 * Provides the foundation for accurate canvas rendering, zoom/pan, and coordinate handling
 */

export interface Bounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

export interface Viewport {
  zoom: number
  pan: { x: number; y: number }
  bounds: Bounds
  devicePixelRatio: number
}

export interface CanvasSize {
  width: number
  height: number
  pixelWidth: number
  pixelHeight: number
}

export class CanvasCore {
  private viewport: Viewport
  private canvasSize: CanvasSize
  private resizeObserver?: ResizeObserver

  constructor() {
    this.viewport = {
      zoom: 1,
      pan: { x: 0, y: 0 },
      bounds: { minX: -2, maxX: 2, minY: -2, maxY: 2 },
      devicePixelRatio: window.devicePixelRatio || 1
    }
    
    this.canvasSize = {
      width: 800,
      height: 600,
      pixelWidth: 800,
      pixelHeight: 600
    }
  }

  /**
   * Convert screen coordinates to normalized 0-1 coordinates
   * This is the core transformation for precise pin placement
   */
  screenToNormalized(screenX: number, screenY: number): { x: number; y: number } {
    const { zoom, pan } = this.viewport
    const { width, height } = this.canvasSize

    // Convert screen to world coordinates
    const worldX = (screenX - width / 2) / zoom - pan.x
    const worldY = (screenY - height / 2) / zoom - pan.y

    // Normalize to 0-1 range based on canvas bounds
    // Assuming canvas represents a 1x1 normalized space
    const normalizedX = (worldX + width / (2 * zoom)) / (width / zoom)
    const normalizedY = (worldY + height / (2 * zoom)) / (height / zoom)

    // Clamp to 0-1 range
    return {
      x: Math.max(0, Math.min(1, normalizedX)),
      y: Math.max(0, Math.min(1, normalizedY))
    }
  }

  /**
   * Convert normalized 0-1 coordinates to screen coordinates
   * Used for rendering pins at correct screen positions
   */
  normalizedToScreen(normalizedX: number, normalizedY: number): { x: number; y: number } {
    const { zoom, pan } = this.viewport
    const { width, height } = this.canvasSize

    // Convert normalized to world coordinates
    const worldX = (normalizedX * (width / zoom)) - width / (2 * zoom)
    const worldY = (normalizedY * (height / zoom)) - height / (2 * zoom)

    // Convert world to screen coordinates
    const screenX = (worldX + pan.x) * zoom + width / 2
    const screenY = (worldY + pan.y) * zoom + height / 2

    return { x: screenX, y: screenY }
  }

  /**
   * Zoom around a specific pointer position (UX critical)
   * Ensures the point under the cursor stays stationary during zoom
   */
  zoomAtPointer(delta: number, pointerX: number, pointerY: number): void {
    const { zoom, pan } = this.viewport
    const { width, height } = this.canvasSize

    // Calculate zoom factor (negative delta = zoom in)
    const zoomFactor = delta > 0 ? 0.9 : 1.1
    const newZoom = Math.max(0.1, Math.min(10, zoom * zoomFactor))

    // Calculate the point in world coordinates before zoom
    const worldX = (pointerX - width / 2) / zoom - pan.x
    const worldY = (pointerY - height / 2) / zoom - pan.y

    // Calculate new pan to keep the world point under the cursor
    const newPanX = pan.x + worldX * (1 - zoom / newZoom)
    const newPanY = pan.y + worldY * (1 - zoom / newZoom)

    // Apply bounds constraints
    const constrainedPan = this.constrainPan(newPanX, newPanY, newZoom)

    this.viewport.zoom = newZoom
    this.viewport.pan = constrainedPan
  }

  /**
   * Set pan position with bounds checking
   */
  setPan(x: number, y: number): void {
    const constrainedPan = this.constrainPan(x, y, this.viewport.zoom)
    this.viewport.pan = constrainedPan
  }

  /**
   * Set zoom level with bounds checking
   */
  setZoom(zoom: number): void {
    const newZoom = Math.max(0.1, Math.min(10, zoom))
    const constrainedPan = this.constrainPan(this.viewport.pan.x, this.viewport.pan.y, newZoom)
    
    this.viewport.zoom = newZoom
    this.viewport.pan = constrainedPan
  }

  /**
   * Reset viewport to default state
   */
  resetViewport(): void {
    this.viewport.zoom = 1
    this.viewport.pan = { x: 0, y: 0 }
  }

  /**
   * Fit content to canvas bounds
   */
  fitToCanvas(): void {
    const { width, height } = this.canvasSize
    const aspectRatio = width / height
    
    // Calculate zoom to fit 0-1 normalized space with padding
    const padding = 0.1 // 10% padding
    const zoomX = width * (1 - padding)
    const zoomY = height * (1 - padding)
    const newZoom = Math.min(zoomX, zoomY)

    this.viewport.zoom = newZoom
    this.viewport.pan = { x: 0, y: 0 }
  }

  /**
   * Center viewport on a specific normalized coordinate
   */
  centerOnPoint(normalizedX: number, normalizedY: number): void {
    const { width, height } = this.canvasSize
    const { zoom } = this.viewport

    // Convert normalized point to world coordinates
    const worldX = (normalizedX * (width / zoom)) - width / (2 * zoom)
    const worldY = (normalizedY * (height / zoom)) - height / (2 * zoom)

    // Set pan to center this point
    this.setPan(-worldX, -worldY)
  }

  /**
   * Setup HiDPI support for crisp rendering
   */
  setupHiDPI(canvas: HTMLCanvasElement): void {
    const context = canvas.getContext('2d')
    if (!context) return

    const devicePixelRatio = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()

    // Set actual size in memory (scaled to account for HiDPI)
    canvas.width = rect.width * devicePixelRatio
    canvas.height = rect.height * devicePixelRatio

    // Set display size (CSS pixels)
    canvas.style.width = rect.width + 'px'
    canvas.style.height = rect.height + 'px'

    // Scale the context to ensure correct drawing operations
    context.scale(devicePixelRatio, devicePixelRatio)

    // Update canvas size tracking
    this.canvasSize = {
      width: rect.width,
      height: rect.height,
      pixelWidth: canvas.width,
      pixelHeight: canvas.height
    }

    this.viewport.devicePixelRatio = devicePixelRatio
  }

  /**
   * Setup ResizeObserver for automatic canvas resizing
   */
  setupResizeObserver(container: HTMLElement): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
    }

    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        this.updateCanvasSize(width, height)
      }
    })

    this.resizeObserver.observe(container)
  }

  /**
   * Update canvas size when container resizes
   */
  private updateCanvasSize(width: number, height: number): void {
    const devicePixelRatio = this.viewport.devicePixelRatio

    this.canvasSize = {
      width,
      height,
      pixelWidth: width * devicePixelRatio,
      pixelHeight: height * devicePixelRatio
    }
  }

  /**
   * Constrain pan to stay within bounds
   */
  private constrainPan(panX: number, panY: number, zoom: number): { x: number; y: number } {
    const { bounds } = this.viewport
    const { width, height } = this.canvasSize

    // Calculate the world space that should be visible
    const visibleWorldWidth = width / zoom
    const visibleWorldHeight = height / zoom

    // Calculate max pan values to keep bounds visible
    const maxPanX = bounds.maxX - visibleWorldWidth / 2
    const minPanX = bounds.minX + visibleWorldWidth / 2
    const maxPanY = bounds.maxY - visibleWorldHeight / 2
    const minPanY = bounds.minY + visibleWorldHeight / 2

    return {
      x: Math.max(minPanX, Math.min(maxPanX, panX)),
      y: Math.max(minPanY, Math.min(maxPanY, panY))
    }
  }

  /**
   * Set pan bounds for viewport constraints
   */
  setPanBounds(bounds: Bounds): void {
    this.viewport.bounds = bounds
    // Re-constrain current pan to new bounds
    this.viewport.pan = this.constrainPan(
      this.viewport.pan.x,
      this.viewport.pan.y,
      this.viewport.zoom
    )
  }

  /**
   * Get current viewport state
   */
  getViewport(): Viewport {
    return { ...this.viewport }
  }

  /**
   * Get current canvas size
   */
  getCanvasSize(): CanvasSize {
    return { ...this.canvasSize }
  }

  /**
   * Check if a normalized coordinate is visible in current viewport
   */
  isPointVisible(normalizedX: number, normalizedY: number): boolean {
    const screenPos = this.normalizedToScreen(normalizedX, normalizedY)
    const { width, height } = this.canvasSize

    return (
      screenPos.x >= 0 &&
      screenPos.x <= width &&
      screenPos.y >= 0 &&
      screenPos.y <= height
    )
  }

  /**
   * Get visible area in normalized coordinates
   */
  getVisibleArea(): { topLeft: { x: number; y: number }; bottomRight: { x: number; y: number } } {
    const topLeft = this.screenToNormalized(0, 0)
    const bottomRight = this.screenToNormalized(this.canvasSize.width, this.canvasSize.height)

    return { topLeft, bottomRight }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = undefined
    }
  }
}

// Hook for using Canvas Core in React components
export function useCanvasCore() {
  const canvasCore = new CanvasCore()
  
  return {
    canvasCore,
    screenToNormalized: canvasCore.screenToNormalized.bind(canvasCore),
    normalizedToScreen: canvasCore.normalizedToScreen.bind(canvasCore),
    zoomAtPointer: canvasCore.zoomAtPointer.bind(canvasCore),
    setPan: canvasCore.setPan.bind(canvasCore),
    setZoom: canvasCore.setZoom.bind(canvasCore),
    resetViewport: canvasCore.resetViewport.bind(canvasCore),
    fitToCanvas: canvasCore.fitToCanvas.bind(canvasCore),
    centerOnPoint: canvasCore.centerOnPoint.bind(canvasCore),
    setupHiDPI: canvasCore.setupHiDPI.bind(canvasCore),
    setupResizeObserver: canvasCore.setupResizeObserver.bind(canvasCore),
    setPanBounds: canvasCore.setPanBounds.bind(canvasCore),
    getViewport: canvasCore.getViewport.bind(canvasCore),
    getCanvasSize: canvasCore.getCanvasSize.bind(canvasCore),
    isPointVisible: canvasCore.isPointVisible.bind(canvasCore),
    getVisibleArea: canvasCore.getVisibleArea.bind(canvasCore),
    destroy: canvasCore.destroy.bind(canvasCore)
  }
}
