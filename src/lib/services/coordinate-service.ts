/**
 * PinMapper Enhanced System - Coordinate Service
 * Comprehensive coordinate transformation and validation utilities
 */

import { 
  CanvasCoordinates, 
  NormalizedCoordinates, 
  ScreenCoordinates, 
  ViewportState 
} from '../layer-types'

// Coordinate transformation service
export class CoordinateService {
  private canvasWidth: number
  private canvasHeight: number
  private viewport: ViewportState

  constructor(
    canvasWidth: number = 1000, 
    canvasHeight: number = 1000,
    viewport?: ViewportState
  ) {
    this.canvasWidth = canvasWidth
    this.canvasHeight = canvasHeight
    this.viewport = viewport || {
      zoom: 1,
      pan: { x: 0, y: 0 },
      bounds: { minX: 0, maxX: canvasWidth, minY: 0, maxY: canvasHeight },
      center: { x: canvasWidth / 2, y: canvasHeight / 2 }
    }
  }

  // Update canvas dimensions
  updateCanvasDimensions(width: number, height: number): void {
    this.canvasWidth = width
    this.canvasHeight = height
    this.viewport.bounds = {
      minX: 0,
      maxX: width,
      minY: 0,
      maxY: height
    }
  }

  // Update viewport state
  updateViewport(viewport: ViewportState): void {
    this.viewport = viewport
  }

  // Convert normalized coordinates (0-1) to canvas coordinates
  normalizedToCanvas(normalized: NormalizedCoordinates): CanvasCoordinates {
    return {
      x: normalized.x * this.canvasWidth,
      y: normalized.y * this.canvasHeight
    }
  }

  // Convert canvas coordinates to normalized coordinates (0-1)
  canvasToNormalized(canvas: CanvasCoordinates): NormalizedCoordinates {
    return {
      x: canvas.x / this.canvasWidth,
      y: canvas.y / this.canvasHeight
    }
  }

  // Convert canvas coordinates to screen coordinates (with zoom and pan)
  canvasToScreen(canvas: CanvasCoordinates): ScreenCoordinates {
    return {
      x: (canvas.x + this.viewport.pan.x) * this.viewport.zoom,
      y: (canvas.y + this.viewport.pan.y) * this.viewport.zoom
    }
  }

  // Convert screen coordinates to canvas coordinates (inverse zoom and pan)
  screenToCanvas(screen: ScreenCoordinates): CanvasCoordinates {
    return {
      x: (screen.x / this.viewport.zoom) - this.viewport.pan.x,
      y: (screen.y / this.viewport.zoom) - this.viewport.pan.y
    }
  }

  // Convert normalized coordinates directly to screen coordinates
  normalizedToScreen(normalized: NormalizedCoordinates): ScreenCoordinates {
    const canvas = this.normalizedToCanvas(normalized)
    return this.canvasToScreen(canvas)
  }

  // Convert screen coordinates directly to normalized coordinates
  screenToNormalized(screen: ScreenCoordinates): NormalizedCoordinates {
    const canvas = this.screenToCanvas(screen)
    return this.canvasToNormalized(canvas)
  }

  // Check if coordinates are within canvas bounds
  isWithinCanvasBounds(canvas: CanvasCoordinates): boolean {
    return canvas.x >= 0 && 
           canvas.x <= this.canvasWidth && 
           canvas.y >= 0 && 
           canvas.y <= this.canvasHeight
  }

  // Check if normalized coordinates are valid (0-1 range)
  isValidNormalized(normalized: NormalizedCoordinates): boolean {
    return normalized.x >= 0 && 
           normalized.x <= 1 && 
           normalized.y >= 0 && 
           normalized.y <= 1
  }

  // Clamp coordinates to canvas bounds
  clampToCanvas(canvas: CanvasCoordinates): CanvasCoordinates {
    return {
      x: Math.max(0, Math.min(this.canvasWidth, canvas.x)),
      y: Math.max(0, Math.min(this.canvasHeight, canvas.y))
    }
  }

  // Clamp normalized coordinates to valid range
  clampNormalized(normalized: NormalizedCoordinates): NormalizedCoordinates {
    return {
      x: Math.max(0, Math.min(1, normalized.x)),
      y: Math.max(0, Math.min(1, normalized.y))
    }
  }

  // Calculate distance between two points
  distance(point1: CanvasCoordinates, point2: CanvasCoordinates): number {
    const dx = point2.x - point1.x
    const dy = point2.y - point1.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  // Calculate angle between two points (in radians)
  angle(point1: CanvasCoordinates, point2: CanvasCoordinates): number {
    const dx = point2.x - point1.x
    const dy = point2.y - point1.y
    return Math.atan2(dy, dx)
  }

  // Calculate midpoint between two coordinates
  midpoint(point1: CanvasCoordinates, point2: CanvasCoordinates): CanvasCoordinates {
    return {
      x: (point1.x + point2.x) / 2,
      y: (point1.y + point2.y) / 2
    }
  }

  // Snap coordinates to grid
  snapToGrid(canvas: CanvasCoordinates, gridSize: number): CanvasCoordinates {
    return {
      x: Math.round(canvas.x / gridSize) * gridSize,
      y: Math.round(canvas.y / gridSize) * gridSize
    }
  }

  // Get visible area in canvas coordinates
  getVisibleArea(): {
    topLeft: CanvasCoordinates
    bottomRight: CanvasCoordinates
    width: number
    height: number
  } {
    const topLeft = this.screenToCanvas({ x: 0, y: 0 })
    const bottomRight = this.screenToCanvas({ 
      x: this.canvasWidth * this.viewport.zoom, 
      y: this.canvasHeight * this.viewport.zoom 
    })
    
    return {
      topLeft,
      bottomRight,
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y
    }
  }

  // Check if a point is visible on screen
  isPointVisible(canvas: CanvasCoordinates, margin: number = 0): boolean {
    const screen = this.canvasToScreen(canvas)
    return screen.x >= -margin && 
           screen.x <= (this.canvasWidth * this.viewport.zoom) + margin &&
           screen.y >= -margin && 
           screen.y <= (this.canvasHeight * this.viewport.zoom) + margin
  }

  // Calculate bounds for a set of points
  calculateBounds(points: CanvasCoordinates[]): {
    minX: number
    maxX: number
    minY: number
    maxY: number
    width: number
    height: number
    center: CanvasCoordinates
  } {
    if (points.length === 0) {
      return {
        minX: 0, maxX: 0, minY: 0, maxY: 0,
        width: 0, height: 0,
        center: { x: 0, y: 0 }
      }
    }

    const minX = Math.min(...points.map(p => p.x))
    const maxX = Math.max(...points.map(p => p.x))
    const minY = Math.min(...points.map(p => p.y))
    const maxY = Math.max(...points.map(p => p.y))

    return {
      minX, maxX, minY, maxY,
      width: maxX - minX,
      height: maxY - minY,
      center: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 }
    }
  }

  // Fit viewport to show all points
  fitToPoints(points: CanvasCoordinates[], padding: number = 50): ViewportState {
    if (points.length === 0) return this.viewport

    const bounds = this.calculateBounds(points)
    const paddedWidth = bounds.width + (padding * 2)
    const paddedHeight = bounds.height + (padding * 2)

    const scaleX = this.canvasWidth / paddedWidth
    const scaleY = this.canvasHeight / paddedHeight
    const zoom = Math.min(scaleX, scaleY, 10) // Max zoom of 10

    const centerX = bounds.center.x
    const centerY = bounds.center.y

    return {
      zoom,
      pan: {
        x: (this.canvasWidth / 2) / zoom - centerX,
        y: (this.canvasHeight / 2) / zoom - centerY
      },
      bounds: this.viewport.bounds,
      center: bounds.center
    }
  }

  // Convert mouse event to canvas coordinates
  mouseEventToCanvas(event: MouseEvent, canvasElement: HTMLElement): CanvasCoordinates {
    const rect = canvasElement.getBoundingClientRect()
    const screen = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    }
    return this.screenToCanvas(screen)
  }

  // Convert touch event to canvas coordinates
  touchEventToCanvas(event: TouchEvent, canvasElement: HTMLElement): CanvasCoordinates {
    const rect = canvasElement.getBoundingClientRect()
    const touch = event.touches[0] || event.changedTouches[0]
    const screen = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    }
    return this.screenToCanvas(screen)
  }

  // Transform a rectangle
  transformRectangle(
    topLeft: CanvasCoordinates,
    width: number,
    height: number
  ): {
    topLeft: ScreenCoordinates
    topRight: ScreenCoordinates
    bottomLeft: ScreenCoordinates
    bottomRight: ScreenCoordinates
    width: number
    height: number
  } {
    const screenTopLeft = this.canvasToScreen(topLeft)
    const screenTopRight = this.canvasToScreen({ x: topLeft.x + width, y: topLeft.y })
    const screenBottomLeft = this.canvasToScreen({ x: topLeft.x, y: topLeft.y + height })
    const screenBottomRight = this.canvasToScreen({ x: topLeft.x + width, y: topLeft.y + height })

    return {
      topLeft: screenTopLeft,
      topRight: screenTopRight,
      bottomLeft: screenBottomLeft,
      bottomRight: screenBottomRight,
      width: (screenTopRight.x - screenTopLeft.x),
      height: (screenBottomLeft.y - screenTopLeft.y)
    }
  }

  // Get scale factor for rendering
  getScaleFactor(): number {
    return this.viewport.zoom
  }

  // Get effective pin size based on zoom
  getEffectivePinSize(basePinSize: number, minSize: number = 8, maxSize: number = 48): number {
    const scaledSize = basePinSize * this.viewport.zoom
    return Math.max(minSize, Math.min(maxSize, scaledSize))
  }

  // Check if two rectangles intersect (useful for selection areas)
  rectanglesIntersect(
    rect1: { x: number; y: number; width: number; height: number },
    rect2: { x: number; y: number; width: number; height: number }
  ): boolean {
    return !(rect1.x + rect1.width < rect2.x || 
             rect2.x + rect2.width < rect1.x || 
             rect1.y + rect1.height < rect2.y || 
             rect2.y + rect2.height < rect1.y)
  }

  // Check if point is within rectangle
  pointInRectangle(
    point: CanvasCoordinates,
    rect: { x: number; y: number; width: number; height: number }
  ): boolean {
    return point.x >= rect.x && 
           point.x <= rect.x + rect.width &&
           point.y >= rect.y && 
           point.y <= rect.y + rect.height
  }

  // Check if point is within circle
  pointInCircle(
    point: CanvasCoordinates,
    center: CanvasCoordinates,
    radius: number
  ): boolean {
    return this.distance(point, center) <= radius
  }

  // Linear interpolation between two points
  lerp(
    point1: CanvasCoordinates,
    point2: CanvasCoordinates,
    t: number // 0-1
  ): CanvasCoordinates {
    return {
      x: point1.x + (point2.x - point1.x) * t,
      y: point1.y + (point2.y - point1.y) * t
    }
  }

  // Rotate point around center
  rotatePoint(
    point: CanvasCoordinates,
    center: CanvasCoordinates,
    angle: number // radians
  ): CanvasCoordinates {
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const dx = point.x - center.x
    const dy = point.y - center.y

    return {
      x: center.x + (dx * cos - dy * sin),
      y: center.y + (dx * sin + dy * cos)
    }
  }

  // Scale point relative to center
  scalePoint(
    point: CanvasCoordinates,
    center: CanvasCoordinates,
    scale: number
  ): CanvasCoordinates {
    return {
      x: center.x + (point.x - center.x) * scale,
      y: center.y + (point.y - center.y) * scale
    }
  }

  // Get coordinate system info
  getCoordinateSystemInfo() {
    return {
      canvasWidth: this.canvasWidth,
      canvasHeight: this.canvasHeight,
      viewport: this.viewport,
      scaleFactor: this.getScaleFactor(),
      visibleArea: this.getVisibleArea()
    }
  }
}

// Utility functions for common coordinate operations
export const CoordinateUtils = {
  // Create a new coordinate service instance
  createService: (width: number, height: number, viewport?: ViewportState) => 
    new CoordinateService(width, height, viewport),

  // Quick conversion functions
  normalizePoint: (point: CanvasCoordinates, width: number, height: number): NormalizedCoordinates => ({
    x: point.x / width,
    y: point.y / height
  }),

  denormalizePoint: (point: NormalizedCoordinates, width: number, height: number): CanvasCoordinates => ({
    x: point.x * width,
    y: point.y * height
  }),

  // Distance calculation
  calculateDistance: (p1: CanvasCoordinates, p2: CanvasCoordinates): number => {
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    return Math.sqrt(dx * dx + dy * dy)
  },

  // Angle calculation (in degrees)
  calculateAngleDegrees: (p1: CanvasCoordinates, p2: CanvasCoordinates): number => {
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    return (Math.atan2(dy, dx) * 180) / Math.PI
  },

  // Snap to grid utility
  snapToGrid: (point: CanvasCoordinates, gridSize: number): CanvasCoordinates => ({
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize
  }),

  // Clamp point to bounds
  clampToBounds: (
    point: CanvasCoordinates, 
    bounds: { minX: number; maxX: number; minY: number; maxY: number }
  ): CanvasCoordinates => ({
    x: Math.max(bounds.minX, Math.min(bounds.maxX, point.x)),
    y: Math.max(bounds.minY, Math.min(bounds.maxY, point.y))
  }),

  // Validate coordinate precision
  validatePrecision: (value: number, precision: number = 6): number => {
    return Math.round(value * Math.pow(10, precision)) / Math.pow(10, precision)
  },

  // Check if points are approximately equal
  pointsEqual: (p1: CanvasCoordinates, p2: CanvasCoordinates, tolerance: number = 0.001): boolean => {
    return Math.abs(p1.x - p2.x) < tolerance && Math.abs(p1.y - p2.y) < tolerance
  },

  // Generate a grid of points
  generateGrid: (
    width: number, 
    height: number, 
    gridSize: number
  ): CanvasCoordinates[] => {
    const points: CanvasCoordinates[] = []
    for (let x = 0; x <= width; x += gridSize) {
      for (let y = 0; y <= height; y += gridSize) {
        points.push({ x, y })
      }
    }
    return points
  },

  // Find nearest grid point
  findNearestGridPoint: (
    point: CanvasCoordinates, 
    gridSize: number
  ): CanvasCoordinates => ({
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize
  }),

  // Calculate bounding box for points
  calculateBoundingBox: (points: CanvasCoordinates[]): {
    x: number
    y: number
    width: number
    height: number
    center: CanvasCoordinates
  } => {
    if (points.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0, center: { x: 0, y: 0 } }
    }

    const xs = points.map(p => p.x)
    const ys = points.map(p => p.y)
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      center: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 }
    }
  }
}

export default CoordinateService
