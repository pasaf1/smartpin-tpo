/**
 * Konva Performance Monitor
 *
 * Production-ready performance monitoring for Konva.js applications
 * Optimized for Vercel deployment with minimal overhead
 */

interface PerformanceStats {
  fps: number
  renderTime: number
  memoryUsage: number
  drawCalls: number
  activeNodes: number
}

interface PerformanceConfig {
  sampleSize?: number
  updateInterval?: number
  onStatsUpdate?: (stats: PerformanceStats) => void
  onPerformanceWarning?: (warning: string, stats: PerformanceStats) => void
  enableMemoryMonitoring?: boolean
  targetFPS?: number
}

export class KonvaPerformanceMonitor {
  private config: Required<PerformanceConfig>
  private frameStartTime = 0
  private frameCount = 0
  private frameTimes: number[] = []
  private drawCalls = 0
  private activeNodes = 0
  private isRunning = false
  private updateTimer: NodeJS.Timeout | null = null
  private lastUpdateTime = 0

  // Performance thresholds
  private readonly FPS_WARNING_THRESHOLD = 30
  private readonly MEMORY_WARNING_THRESHOLD = 100 // MB
  private readonly RENDER_TIME_WARNING_THRESHOLD = 16 // ms for 60fps

  constructor(config: PerformanceConfig = {}) {
    this.config = {
      sampleSize: config.sampleSize ?? 60, // 1 second at 60fps
      updateInterval: config.updateInterval ?? 1000, // 1 second
      onStatsUpdate: config.onStatsUpdate ?? (() => {}),
      onPerformanceWarning: config.onPerformanceWarning ?? (() => {}),
      enableMemoryMonitoring: config.enableMemoryMonitoring ?? true,
      targetFPS: config.targetFPS ?? 60
    }

    this.start()
  }

  /**
   * Start monitoring performance
   */
  start(): void {
    if (this.isRunning) return

    this.isRunning = true
    this.lastUpdateTime = performance.now()

    // Set up regular stats updates
    this.updateTimer = setInterval(() => {
      this.updateStats()
    }, this.config.updateInterval)

    // Monitor for critical performance issues
    this.monitorCriticalPerformance()
  }

  /**
   * Stop monitoring performance
   */
  stop(): void {
    this.isRunning = false
    if (this.updateTimer) {
      clearInterval(this.updateTimer)
      this.updateTimer = null
    }
  }

  /**
   * Mark the start of a frame
   */
  startFrame(): void {
    if (!this.isRunning) return
    this.frameStartTime = performance.now()
  }

  /**
   * Mark the end of a frame
   */
  endFrame(): void {
    if (!this.isRunning || this.frameStartTime === 0) return

    const frameTime = performance.now() - this.frameStartTime
    this.frameTimes.push(frameTime)
    this.frameCount++

    // Keep only the most recent samples
    if (this.frameTimes.length > this.config.sampleSize) {
      this.frameTimes.shift()
    }

    // Check for immediate performance issues
    if (frameTime > this.RENDER_TIME_WARNING_THRESHOLD * 2) {
      this.config.onPerformanceWarning(
        `Long frame detected: ${frameTime.toFixed(2)}ms`,
        this.getCurrentStats()
      )
    }
  }

  /**
   * Track draw calls for performance analysis
   */
  trackDrawCall(): void {
    this.drawCalls++
  }

  /**
   * Track active nodes count
   */
  updateNodeCount(count: number): void {
    this.activeNodes = count
  }

  /**
   * Get current performance statistics
   */
  getCurrentStats(): PerformanceStats {
    const now = performance.now()
    const timeDelta = now - this.lastUpdateTime

    // Calculate FPS
    const fps = timeDelta > 0 ? (this.frameCount * 1000) / timeDelta : 0

    // Calculate average render time
    const avgRenderTime = this.frameTimes.length > 0
      ? this.frameTimes.reduce((sum, time) => sum + time, 0) / this.frameTimes.length
      : 0

    // Get memory usage (if available)
    const memoryUsage = this.getMemoryUsage()

    return {
      fps: Math.round(fps),
      renderTime: Math.round(avgRenderTime * 100) / 100,
      memoryUsage,
      drawCalls: this.drawCalls,
      activeNodes: this.activeNodes
    }
  }

  /**
   * Reset performance counters
   */
  reset(): void {
    this.frameCount = 0
    this.frameTimes = []
    this.drawCalls = 0
    this.lastUpdateTime = performance.now()
  }

  /**
   * Destroy the performance monitor
   */
  destroy(): void {
    this.stop()
    this.frameTimes = []
  }

  /**
   * Get memory usage information
   */
  private getMemoryUsage(): number {
    if (!this.config.enableMemoryMonitoring || typeof window === 'undefined') {
      return 0
    }

    // Use performance.memory if available (Chrome)
    if ('memory' in performance) {
      const memory = (performance as any).memory
      return Math.round(memory.usedJSHeapSize / (1024 * 1024)) // Convert to MB
    }

    // Fallback: estimate based on document complexity
    if (typeof document !== 'undefined') {
      const elements = document.querySelectorAll('*').length
      return Math.round(elements * 0.001) // Rough estimate
    }

    return 0
  }

  /**
   * Update and broadcast performance statistics
   */
  private updateStats(): void {
    const stats = this.getCurrentStats()

    // Check for performance warnings
    if (stats.fps < this.FPS_WARNING_THRESHOLD) {
      this.config.onPerformanceWarning(
        `Low FPS detected: ${stats.fps}fps (target: ${this.config.targetFPS}fps)`,
        stats
      )
    }

    if (stats.memoryUsage > this.MEMORY_WARNING_THRESHOLD) {
      this.config.onPerformanceWarning(
        `High memory usage: ${stats.memoryUsage}MB`,
        stats
      )
    }

    // Broadcast stats
    this.config.onStatsUpdate(stats)

    // Reset counters for next interval
    this.reset()
  }

  /**
   * Monitor for critical performance issues that need immediate attention
   */
  private monitorCriticalPerformance(): void {
    // Monitor for memory leaks
    if (this.config.enableMemoryMonitoring && typeof window !== 'undefined') {
      const checkMemoryLeak = () => {
        const memoryUsage = this.getMemoryUsage()
        if (memoryUsage > this.MEMORY_WARNING_THRESHOLD * 2) {
          this.config.onPerformanceWarning(
            `Critical memory usage: ${memoryUsage}MB - possible memory leak`,
            this.getCurrentStats()
          )
        }
      }

      // Check every 30 seconds
      setInterval(checkMemoryLeak, 30000)
    }

    // Monitor for frozen frames
    let lastFrameTime = performance.now()
    const checkFrozenFrames = () => {
      const now = performance.now()
      const timeSinceLastFrame = now - lastFrameTime

      if (timeSinceLastFrame > 1000 && this.isRunning) {
        this.config.onPerformanceWarning(
          `Frozen frame detected: ${timeSinceLastFrame.toFixed(2)}ms since last frame`,
          this.getCurrentStats()
        )
      }

      lastFrameTime = now
    }

    // Check every 2 seconds
    setInterval(checkFrozenFrames, 2000)
  }
}

/**
 * Create a performance monitor with production defaults
 */
export function createProductionPerformanceMonitor(
  onStatsUpdate?: (stats: PerformanceStats) => void
): KonvaPerformanceMonitor {
  return new KonvaPerformanceMonitor({
    sampleSize: 30, // Smaller sample size for production
    updateInterval: 2000, // Less frequent updates
    onStatsUpdate,
    onPerformanceWarning: (warning, stats) => {
      // Only log warnings in development
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[Konva Performance]`, warning, stats)
      }
    },
    enableMemoryMonitoring: process.env.NODE_ENV === 'development',
    targetFPS: 60
  })
}

/**
 * Performance monitoring hook for React components
 */
export function useKonvaPerformance() {
  const monitor = new KonvaPerformanceMonitor({
    enableMemoryMonitoring: false, // Disable for production
    onPerformanceWarning: (warning) => {
      console.warn('[Konva Performance Warning]:', warning)
    }
  })

  return {
    startFrame: () => monitor.startFrame(),
    endFrame: () => monitor.endFrame(),
    trackDrawCall: () => monitor.trackDrawCall(),
    updateNodeCount: (count: number) => monitor.updateNodeCount(count),
    getStats: () => monitor.getCurrentStats(),
    destroy: () => monitor.destroy()
  }
}