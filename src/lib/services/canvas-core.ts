/**
 * Canvas Core Service - Precise Coordinate Transformations
 * Handles normalized ↔ screen conversions with proper scale/pan in pixels
 * SSR-safe with HiDPI support and bounds management
 */

// Type definitions
export interface ViewportSize { 
  width: number
  height: number 
}

export interface ContentSize { 
  width: number   // roof plan intrinsic pixels
  height: number  // roof plan intrinsic pixels
}

export interface ViewportState {
  scale: number                 // zoom factor
  pan: { x: number; y: number } // pixels
  dpr: number                   // devicePixelRatio
}

export interface VisibleArea {
  topLeft: { x: number; y: number }     // normalized 0-1
  bottomRight: { x: number; y: number } // normalized 0-1
}

/**
 * Canvas Core - Mathematical precision for coordinate transformations
 * 
 * Model:
 * - World space: roof plan in intrinsic pixels (contentSize)
 * - Normalized: 0-1 coordinates for pins/data storage  
 * - Screen: viewport pixels for rendering
 * - Scale: zoom factor (1 = natural size)
 * - Pan: offset in screen pixels
 */
export class CanvasCore {
  private viewport: ViewportState = { scale: 1, pan: { x: 0, y: 0 }, dpr: 1 }
  private viewportSize: ViewportSize = { width: 800, height: 600 }
  private contentSize: ContentSize = { width: 1000, height: 700 }
  private resizeObserver?: ResizeObserver

  // ---- Configuration ----
  setViewportSize(width: number, height: number, dpr = 1) {
    this.viewportSize = { width, height }
    this.viewport.dpr = dpr
    // Maintain pan within bounds after size change
    this.viewport.pan = this.clampPan(this.viewport.pan, this.viewport.scale)
  }

  setContentSize(width: number, height: number) {
    this.contentSize = { width, height }
    this.viewport.pan = this.clampPan(this.viewport.pan, this.viewport.scale)
  }

  setScale(nextScale: number) {
    const scale = this.clamp(nextScale, 0.1, 10)
    this.viewport.pan = this.clampPan(this.viewport.pan, scale)
    this.viewport.scale = scale
  }

  setPan(x: number, y: number) {
    this.viewport.pan = this.clampPan({ x, y }, this.viewport.scale)
  }

  reset() {
    this.viewport.scale = 1
    this.fitToViewport(0.95)
  }

  // ---- Core Transformations ----
  /**
   * Convert screen pixels to normalized coordinates (0-1)
   * screen(px) → world(px) → normalized(0-1)
   */
  screenToNormalized(screenX: number, screenY: number): { x: number; y: number } {
    const { scale, pan } = this.viewport
    const { width: contentWidth, height: contentHeight } = this.contentSize
    
    // Remove pan offset and scale to get world coordinates
    const worldX = (screenX - pan.x) / scale
    const worldY = (screenY - pan.y) / scale
    
    // Convert world to normalized
    return {
      x: this.clamp(worldX / contentWidth, 0, 1),
      y: this.clamp(worldY / contentHeight, 0, 1)
    }
  }

  /**
   * Convert normalized coordinates (0-1) to screen pixels
   * normalized(0-1) → world(px) → screen(px)
   */
  normalizedToScreen(normalizedX: number, normalizedY: number): { x: number; y: number } {
    const { scale, pan } = this.viewport
    const { width: contentWidth, height: contentHeight } = this.contentSize
    
    // Convert normalized to world coordinates
    const worldX = normalizedX * contentWidth
    const worldY = normalizedY * contentHeight
    
    // Apply scale and pan to get screen coordinates
    return {
      x: worldX * scale + pan.x,
      y: worldY * scale + pan.y
    }
  }

  // ---- UX Navigation Helpers ----
  /**
   * Zoom at pointer position - keeps the point under cursor fixed
   */
  zoomAtPointer(factor: number, pointerX: number, pointerY: number) {
    const oldScale = this.viewport.scale
    const newScale = this.clamp(oldScale * factor, 0.1, 10)

    // Calculate world point before zoom (in content pixels)
    const worldX = (pointerX - this.viewport.pan.x) / oldScale
    const worldY = (pointerY - this.viewport.pan.y) / oldScale

    // Calculate new pan to keep world point at same screen position
    const newPanX = pointerX - worldX * newScale
    const newPanY = pointerY - worldY * newScale

    const clampedPan = this.clampPan({ x: newPanX, y: newPanY }, newScale)
    this.viewport.scale = newScale
    this.viewport.pan = clampedPan
  }

  /**
   * Fit content to viewport with padding
   */
  fitToViewport(paddingFactor = 0.95) {
    const { width: viewportWidth, height: viewportHeight } = this.viewportSize
    const { width: contentWidth, height: contentHeight } = this.contentSize
    
    if (contentWidth === 0 || contentHeight === 0 || viewportWidth === 0 || viewportHeight === 0) {
      return
    }

    // Calculate scale to fit content with padding
    const scaleX = viewportWidth / contentWidth
    const scaleY = viewportHeight / contentHeight
    const scale = Math.min(scaleX, scaleY) * this.clamp(paddingFactor, 0.1, 1)

    // Center the content
    const scaledContentWidth = contentWidth * scale
    const scaledContentHeight = contentHeight * scale
    const pan = {
      x: (viewportWidth - scaledContentWidth) / 2,
      y: (viewportHeight - scaledContentHeight) / 2
    }

    this.viewport.scale = this.clamp(scale, 0.1, 10)
    this.viewport.pan = this.clampPan(pan, this.viewport.scale)
  }

  /**
   * Center viewport on normalized coordinates
   */
  centerOnNormalized(normalizedX: number, normalizedY: number) {
    const { width: viewportWidth, height: viewportHeight } = this.viewportSize
    const { width: contentWidth, height: contentHeight } = this.contentSize
    const scale = this.viewport.scale

    // Place normalized point at viewport center
    const pan = {
      x: viewportWidth / 2 - normalizedX * contentWidth * scale,
      y: viewportHeight / 2 - normalizedY * contentHeight * scale
    }

    this.viewport.pan = this.clampPan(pan, scale)
  }

  /**
   * Get currently visible area in normalized coordinates
   */
  getVisibleAreaNormalized(): VisibleArea {
    const topLeft = this.screenToNormalized(0, 0)
    const bottomRight = this.screenToNormalized(this.viewportSize.width, this.viewportSize.height)
    
    return { topLeft, bottomRight }
  }

  // ---- HiDPI and Resize Support ----
  /**
   * Setup HiDPI canvas - SSR safe
   */
  setupHiDPI(canvas: HTMLCanvasElement, dpr?: number) {
    // SSR safety check
    if (typeof window === 'undefined') return

    const devicePixelRatio = dpr ?? window.devicePixelRatio ?? 1
    const rect = canvas.getBoundingClientRect()
    
    // Set canvas internal resolution
    canvas.width = Math.max(1, Math.round(rect.width * devicePixelRatio))
    canvas.height = Math.max(1, Math.round(rect.height * devicePixelRatio))
    
    // Set canvas display size
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`
    
    this.setViewportSize(rect.width, rect.height, devicePixelRatio)
  }

  /**
   * Setup ResizeObserver for responsive canvas
   */
  setupResizeObserver(container: HTMLElement) {
    // Feature detection for SSR safety
    if (typeof ResizeObserver === 'undefined') return

    this.resizeObserver?.disconnect()
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        this.setViewportSize(width, height, this.viewport.dpr)
      }
    })
    this.resizeObserver.observe(container)
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.resizeObserver?.disconnect()
    this.resizeObserver = undefined
  }

  // ---- Getters ----
  getViewport(): ViewportState { 
    return { ...this.viewport } 
  }

  getViewportSize(): ViewportSize { 
    return { ...this.viewportSize } 
  }

  getContentSize(): ContentSize { 
    return { ...this.contentSize } 
  }

  // ---- Private Utilities ----
  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value))
  }

  /**
   * Clamp pan to keep content within reasonable bounds
   */
  private clampPan(pan: { x: number; y: number }, scale: number): { x: number; y: number } {
    const { width: viewportWidth, height: viewportHeight } = this.viewportSize
    const scaledContentWidth = this.contentSize.width * scale
    const scaledContentHeight = this.contentSize.height * scale

    // Calculate bounds per axis
    // If content is smaller than viewport, lock to center
    // If content is larger, allow panning within reasonable range
    const [minX, maxX] = scaledContentWidth >= viewportWidth 
      ? [viewportWidth - scaledContentWidth, 0] 
      : [(viewportWidth - scaledContentWidth) / 2, (viewportWidth - scaledContentWidth) / 2]

    const [minY, maxY] = scaledContentHeight >= viewportHeight 
      ? [viewportHeight - scaledContentHeight, 0] 
      : [(viewportHeight - scaledContentHeight) / 2, (viewportHeight - scaledContentHeight) / 2]

    return {
      x: this.clamp(pan.x, minX, maxX),
      y: this.clamp(pan.y, minY, maxY)
    }
  }
}

// ---- React Hook ----
/**
 * React hook for Canvas Core - SSR safe singleton
 */
import { useRef } from 'react'

export function useCanvasCore(): CanvasCore {
  const ref = useRef<CanvasCore>()
  if (!ref.current) {
    ref.current = new CanvasCore()
  }
  return ref.current
}

// ---- Utility Functions ----

/**
 * Convert pin database coordinates to screen coordinates
 */
export function pinToScreen(
  pin: { x: number; y: number }, 
  canvasCore: CanvasCore
): { x: number; y: number } {
  return canvasCore.normalizedToScreen(pin.x, pin.y)
}

/**
 * Convert screen coordinates to pin database format
 */
export function screenToPin(
  screenX: number, 
  screenY: number, 
  canvasCore: CanvasCore
): { x: number; y: number } {
  return canvasCore.screenToNormalized(screenX, screenY)
}

/**
 * Check if normalized coordinates are within visible area
 */
export function isNormalizedVisible(
  normalizedX: number, 
  normalizedY: number, 
  canvasCore: CanvasCore
): boolean {
  const visible = canvasCore.getVisibleAreaNormalized()
  return normalizedX >= visible.topLeft.x && 
         normalizedX <= visible.bottomRight.x &&
         normalizedY >= visible.topLeft.y && 
         normalizedY <= visible.bottomRight.y
}
