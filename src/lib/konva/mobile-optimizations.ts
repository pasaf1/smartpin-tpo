/**
 * Mobile Performance Optimizations for Konva.js
 *
 * Production-ready mobile optimizations for touch handling,
 * gesture recognition, and performance on mobile devices
 */

interface TouchPoint {
  x: number
  y: number
  timestamp: number
}

interface GestureConfig {
  enablePinchZoom?: boolean
  enablePanGesture?: boolean
  enableTapGesture?: boolean
  enableDoubleTap?: boolean
  minPinchDistance?: number
  maxPinchDistance?: number
  tapThreshold?: number
  doubleTapDelay?: number
  panThreshold?: number
  velocityThreshold?: number
}

interface TouchState {
  isActive: boolean
  startTime: number
  startPoints: TouchPoint[]
  currentPoints: TouchPoint[]
  lastPoints: TouchPoint[]
  gestureType: 'none' | 'tap' | 'pan' | 'pinch' | 'doubletap'
  velocity: { x: number; y: number }
  distance: number
  scale: number
}

interface MobileOptimizations {
  enableHitOptimization?: boolean
  enableTouchOptimization?: boolean
  enablePerformanceMode?: boolean
  hitAreaMultiplier?: number
  maxTouchPoints?: number
  touchDebounceMs?: number
}

export class MobileGestureHandler {
  private config: Required<GestureConfig>
  private touchState: TouchState
  private touchHistory: TouchPoint[][] = []
  private lastTapTime = 0
  private rafId: number | null = null
  private touchStartHandler: ((e: TouchEvent) => void) | null = null
  private touchMoveHandler: ((e: TouchEvent) => void) | null = null
  private touchEndHandler: ((e: TouchEvent) => void) | null = null

  // Callbacks
  private onPinchZoom: ((scale: number, center: TouchPoint) => void) | null = null
  private onPan: ((delta: { x: number; y: number }, velocity: { x: number; y: number }) => void) | null = null
  private onTap: ((point: TouchPoint) => void) | null = null
  private onDoubleTap: ((point: TouchPoint) => void) | null = null

  constructor(config: GestureConfig = {}) {
    this.config = {
      enablePinchZoom: config.enablePinchZoom ?? true,
      enablePanGesture: config.enablePanGesture ?? true,
      enableTapGesture: config.enableTapGesture ?? true,
      enableDoubleTap: config.enableDoubleTap ?? true,
      minPinchDistance: config.minPinchDistance ?? 30,
      maxPinchDistance: config.maxPinchDistance ?? 300,
      tapThreshold: config.tapThreshold ?? 10,
      doubleTapDelay: config.doubleTapDelay ?? 300,
      panThreshold: config.panThreshold ?? 5,
      velocityThreshold: config.velocityThreshold ?? 0.5
    }

    this.touchState = this.createInitialTouchState()
    this.initializeEventHandlers()
  }

  /**
   * Set up gesture event callbacks
   */
  setupCallbacks({
    onPinchZoom,
    onPan,
    onTap,
    onDoubleTap
  }: {
    onPinchZoom?: (scale: number, center: TouchPoint) => void
    onPan?: (delta: { x: number; y: number }, velocity: { x: number; y: number }) => void
    onTap?: (point: TouchPoint) => void
    onDoubleTap?: (point: TouchPoint) => void
  }): void {
    this.onPinchZoom = onPinchZoom || null
    this.onPan = onPan || null
    this.onTap = onTap || null
    this.onDoubleTap = onDoubleTap || null
  }

  /**
   * Attach gesture handlers to an element
   */
  attachToElement(element: HTMLElement): void {
    if (this.touchStartHandler) {
      element.addEventListener('touchstart', this.touchStartHandler, { passive: false })
      element.addEventListener('touchmove', this.touchMoveHandler!, { passive: false })
      element.addEventListener('touchend', this.touchEndHandler!, { passive: false })
      element.addEventListener('touchcancel', this.touchEndHandler!, { passive: false })
    }
  }

  /**
   * Detach gesture handlers from an element
   */
  detachFromElement(element: HTMLElement): void {
    if (this.touchStartHandler) {
      element.removeEventListener('touchstart', this.touchStartHandler)
      element.removeEventListener('touchmove', this.touchMoveHandler!)
      element.removeEventListener('touchend', this.touchEndHandler!)
      element.removeEventListener('touchcancel', this.touchEndHandler!)
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    this.touchHistory = []
  }

  /**
   * Get current touch state
   */
  getTouchState(): TouchState {
    return { ...this.touchState }
  }

  private createInitialTouchState(): TouchState {
    return {
      isActive: false,
      startTime: 0,
      startPoints: [],
      currentPoints: [],
      lastPoints: [],
      gestureType: 'none',
      velocity: { x: 0, y: 0 },
      distance: 0,
      scale: 1
    }
  }

  private initializeEventHandlers(): void {
    this.touchStartHandler = (e: TouchEvent) => {
      e.preventDefault()

      const touches = Array.from(e.touches).map((touch, index) => ({
        x: touch.clientX,
        y: touch.clientY,
        timestamp: Date.now()
      }))

      this.touchState = {
        ...this.createInitialTouchState(),
        isActive: true,
        startTime: Date.now(),
        startPoints: [...touches],
        currentPoints: [...touches],
        lastPoints: [...touches]
      }

      this.touchHistory = [touches]
      this.determineGestureType()
    }

    this.touchMoveHandler = (e: TouchEvent) => {
      if (!this.touchState.isActive) return

      e.preventDefault()

      const touches = Array.from(e.touches).map((touch, index) => ({
        x: touch.clientX,
        y: touch.clientY,
        timestamp: Date.now()
      }))

      // Update touch state
      this.touchState.lastPoints = [...this.touchState.currentPoints]
      this.touchState.currentPoints = [...touches]

      // Calculate velocity using recent history
      this.updateVelocity()

      // Add to history (keep only recent touches)
      this.touchHistory.push(touches)
      if (this.touchHistory.length > 10) {
        this.touchHistory.shift()
      }

      // Handle gesture based on type
      this.handleGestureMove()
    }

    this.touchEndHandler = (e: TouchEvent) => {
      if (!this.touchState.isActive) return

      const now = Date.now()
      const duration = now - this.touchState.startTime

      // Handle gesture end
      this.handleGestureEnd(duration)

      // Reset touch state
      this.touchState = this.createInitialTouchState()
      this.touchHistory = []
    }
  }

  private determineGestureType(): void {
    const touchCount = this.touchState.currentPoints.length

    if (touchCount === 1 && this.config.enableTapGesture) {
      this.touchState.gestureType = 'tap'
    } else if (touchCount === 2 && this.config.enablePinchZoom) {
      const point0 = this.touchState.currentPoints[0]
      const point1 = this.touchState.currentPoints[1]
      if (point0 && point1) {
        this.touchState.gestureType = 'pinch'
        this.touchState.distance = this.calculateDistance(point0, point1)
        this.touchState.scale = 1
      }
    }
  }

  private handleGestureMove(): void {
    switch (this.touchState.gestureType) {
      case 'tap':
        this.handleTapMove()
        break
      case 'pinch':
        this.handlePinchMove()
        break
      case 'pan':
        this.handlePanMove()
        break
    }
  }

  private handleTapMove(): void {
    if (this.touchState.currentPoints.length !== 1) return

    const startPoint = this.touchState.startPoints[0]
    const currentPoint = this.touchState.currentPoints[0]

    if (!startPoint || !currentPoint) return

    const distance = this.calculateDistance(startPoint, currentPoint)

    // If movement exceeds threshold, convert to pan gesture
    if (distance > this.config.panThreshold && this.config.enablePanGesture) {
      this.touchState.gestureType = 'pan'
    }
  }

  private handlePinchMove(): void {
    if (this.touchState.currentPoints.length !== 2) return

    const point0 = this.touchState.currentPoints[0]
    const point1 = this.touchState.currentPoints[1]

    if (!point0 || !point1) return

    const currentDistance = this.calculateDistance(point0, point1)

    if (this.touchState.distance > 0) {
      const newScale = currentDistance / this.touchState.distance
      this.touchState.scale = newScale

      // Calculate center point
      const center = this.calculateCenter(this.touchState.currentPoints)

      // Emit pinch zoom event
      if (this.onPinchZoom) {
        this.onPinchZoom(newScale, center)
      }
    }
  }

  private handlePanMove(): void {
    if (this.touchState.currentPoints.length !== 1) return

    const lastPoint = this.touchState.lastPoints[0]
    const currentPoint = this.touchState.currentPoints[0]

    if (lastPoint && currentPoint) {
      const delta = {
        x: currentPoint.x - lastPoint.x,
        y: currentPoint.y - lastPoint.y
      }

      // Emit pan event with velocity
      if (this.onPan) {
        this.onPan(delta, this.touchState.velocity)
      }
    }
  }

  private handleGestureEnd(duration: number): void {
    switch (this.touchState.gestureType) {
      case 'tap':
        this.handleTapEnd(duration)
        break
      case 'pinch':
        // Pinch gesture ended - could implement momentum here
        break
      case 'pan':
        // Pan gesture ended - could implement momentum scrolling here
        break
    }
  }

  private handleTapEnd(duration: number): void {
    if (this.touchState.startPoints.length !== 1) return

    const startPoint = this.touchState.startPoints[0]
    if (!startPoint) return

    const currentPoint = this.touchState.currentPoints[0]
    const distance = currentPoint
      ? this.calculateDistance(startPoint, currentPoint)
      : 0

    // Check if this is a valid tap (short duration, minimal movement)
    if (duration < 500 && distance < this.config.tapThreshold) {
      const now = Date.now()
      const timeSinceLastTap = now - this.lastTapTime

      // Check for double tap
      if (this.config.enableDoubleTap && timeSinceLastTap < this.config.doubleTapDelay) {
        if (this.onDoubleTap) {
          this.onDoubleTap(startPoint)
        }
        this.lastTapTime = 0 // Reset to prevent triple tap
      } else {
        // Single tap
        if (this.onTap) {
          this.onTap(startPoint)
        }
        this.lastTapTime = now
      }
    }
  }

  private updateVelocity(): void {
    if (this.touchHistory.length < 2 || this.touchState.currentPoints.length === 0) {
      this.touchState.velocity = { x: 0, y: 0 }
      return
    }

    const current = this.touchState.currentPoints[0]
    const previousArray = this.touchHistory[this.touchHistory.length - 2]
    const previous = previousArray?.[0]

    if (current && previous) {
      const timeDelta = current.timestamp - previous.timestamp
      if (timeDelta > 0) {
        this.touchState.velocity = {
          x: (current.x - previous.x) / timeDelta * 1000, // pixels per second
          y: (current.y - previous.y) / timeDelta * 1000
        }
      }
    }
  }

  private calculateDistance(point1: TouchPoint, point2: TouchPoint): number {
    const dx = point2.x - point1.x
    const dy = point2.y - point1.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  private calculateCenter(points: TouchPoint[]): TouchPoint {
    const sum = points.reduce((acc, point) => ({
      x: acc.x + point.x,
      y: acc.y + point.y,
      timestamp: point.timestamp
    }), { x: 0, y: 0, timestamp: Date.now() })

    return {
      x: sum.x / points.length,
      y: sum.y / points.length,
      timestamp: sum.timestamp
    }
  }
}

/**
 * Mobile-specific Konva optimizations
 */
export class MobileKonvaOptimizer {
  private config: Required<MobileOptimizations>

  constructor(config: MobileOptimizations = {}) {
    this.config = {
      enableHitOptimization: config.enableHitOptimization ?? true,
      enableTouchOptimization: config.enableTouchOptimization ?? true,
      enablePerformanceMode: config.enablePerformanceMode ?? true,
      hitAreaMultiplier: config.hitAreaMultiplier ?? 1.5,
      maxTouchPoints: config.maxTouchPoints ?? 2,
      touchDebounceMs: config.touchDebounceMs ?? 16
    }
  }

  /**
   * Optimize a Konva stage for mobile performance
   */
  optimizeStage(stage: any): void {
    if (!stage) return

    // Set pixel ratio for mobile devices
    const pixelRatio = this.config.enablePerformanceMode
      ? Math.min(window.devicePixelRatio, 2) // Cap at 2x for performance
      : window.devicePixelRatio

    stage.pixelRatio(pixelRatio)

    // Optimize drawing settings
    if (this.config.enablePerformanceMode) {
      stage.imageSmoothingEnabled(false)
      stage.clearBeforeDraw(true)
    }

    // Add touch optimization
    if (this.config.enableTouchOptimization) {
      this.optimizeTouchHandling(stage)
    }
  }

  /**
   * Optimize touch handling for a stage
   */
  private optimizeTouchHandling(stage: any): void {
    let touchTimeout: NodeJS.Timeout | null = null

    const debouncedTouchHandler = (callback: Function) => {
      return (...args: any[]) => {
        if (touchTimeout) {
          clearTimeout(touchTimeout)
        }
        touchTimeout = setTimeout(() => {
          callback.apply(null, args)
        }, this.config.touchDebounceMs)
      }
    }

    // Override touch event handlers with debounced versions
    const originalTouchStart = stage.addEventListener
    if (originalTouchStart) {
      stage.addEventListener('touchstart', debouncedTouchHandler((e: TouchEvent) => {
        // Limit touch points
        if (e.touches.length > this.config.maxTouchPoints) {
          e.preventDefault()
          return
        }
      }), { passive: false })
    }
  }

  /**
   * Optimize hit detection for mobile
   */
  optimizeHitDetection(node: any): void {
    if (!node || !this.config.enableHitOptimization) return

    // Increase hit area for touch interfaces
    if (node.hitStrokeWidth && typeof node.hitStrokeWidth === 'function') {
      const currentWidth = node.hitStrokeWidth()
      node.hitStrokeWidth(currentWidth * this.config.hitAreaMultiplier)
    }

    // Disable perfect drawing for better performance
    if (node.perfectDrawEnabled && typeof node.perfectDrawEnabled === 'function') {
      node.perfectDrawEnabled(false)
    }

    // Optimize listening
    if (node.listening && typeof node.listening === 'function') {
      // Only enable listening for interactive elements
      const isInteractive = node.onClick || node.onTap || node.onTouchStart
      node.listening(!!isInteractive)
    }
  }

  /**
   * Apply mobile optimizations to a group of nodes
   */
  optimizeNodes(nodes: any[]): void {
    nodes.forEach(node => {
      this.optimizeHitDetection(node)

      // Optimize children if they exist
      if (node.children && typeof node.children === 'function') {
        this.optimizeNodes(node.children())
      }
    })
  }
}

/**
 * Create a mobile gesture handler with production defaults
 */
export function createMobileGestureHandler(config?: GestureConfig): MobileGestureHandler {
  return new MobileGestureHandler({
    enablePinchZoom: true,
    enablePanGesture: true,
    enableTapGesture: true,
    enableDoubleTap: true,
    minPinchDistance: 30,
    maxPinchDistance: 300,
    tapThreshold: 15, // Slightly larger for mobile
    doubleTapDelay: 300,
    panThreshold: 8, // Slightly larger for mobile
    velocityThreshold: 0.3,
    ...config
  })
}

/**
 * Create a mobile Konva optimizer with production defaults
 */
export function createMobileKonvaOptimizer(config?: MobileOptimizations): MobileKonvaOptimizer {
  return new MobileKonvaOptimizer({
    enableHitOptimization: true,
    enableTouchOptimization: true,
    enablePerformanceMode: true,
    hitAreaMultiplier: 1.8, // Larger touch targets
    maxTouchPoints: 2,
    touchDebounceMs: 16, // 60fps debouncing
    ...config
  })
}

/**
 * Detect if the current device is mobile
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false

  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         (window.ontouchstart !== undefined) ||
         navigator.maxTouchPoints > 0
}

/**
 * Get optimal canvas settings for mobile devices
 */
export function getMobileCanvasSettings() {
  const isMobile = isMobileDevice()

  return {
    pixelRatio: isMobile ? Math.min(window.devicePixelRatio, 2) : window.devicePixelRatio,
    imageSmoothingEnabled: !isMobile, // Disable on mobile for performance
    clearBeforeDraw: true,
    perfectDrawEnabled: !isMobile,
    hitAreaMultiplier: isMobile ? 1.8 : 1,
    enableTouchOptimization: isMobile,
    maxFPS: isMobile ? 30 : 60 // Lower FPS target on mobile
  }
}