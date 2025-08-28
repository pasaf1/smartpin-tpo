/**
 * PinMapper Enhanced System - Performance Monitoring Service
 * Robust, SSR-safe performance monitor with FPS smoothing and trend analysis
 */

import { PerformanceMetrics } from '../layer-types'

// ===== Thresholds & constants =====
const HISTORY_MAX = 100
const METRICS_MAX = 1000
const WARN_RENDER_MS = 16 // ~60fps
const WARN_RENDER_MS_SEVERE = 33 // ~30fps
const WARN_MEMORY_MB = 100
const WARN_MEMORY_MB_MED = 50
const WARN_FPS_LOW = 30
const WARN_FPS_WARN = 45
const EMA_ALPHA = 0.2 // FPS smoothing

type Trend = 'improving' | 'degrading' | 'stable'
type MemTrend = 'increasing' | 'decreasing' | 'stable'

export class PerformanceService {
  private metrics: PerformanceMetrics[] = []
  private isMonitoring = false

  private frameStartTime = 0
  private frameCount = 0

  private lastFPSUpdate = this.now()
  private currentFPS = 60
  private fpsEma = 60
  private lastFrameTs = 0
  private rafId: number | null = null

  private observers = new Set<(m: PerformanceMetrics) => void>()
  private memoryUsageHistory: number[] = []
  private renderTimeHistory: number[] = []
  private updateTimeHistory: number[] = []

  // ===== utils =====
  private now(): number {
    return typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now()
  }

  private addToHistory<T>(arr: T[], value: T, max = HISTORY_MAX) {
    arr.push(value)
    if (arr.length > max) arr.shift()
  }

  private schedule() {
    if (!this.isMonitoring) return
    if (typeof requestAnimationFrame === 'undefined') return
    this.rafId = requestAnimationFrame((t) => {
      this.updateFPSEma(t)
      this.schedule()
    })
  }

  // ===== lifecycle =====
  startMonitoring(): void {
    if (this.isMonitoring) return
    this.isMonitoring = true
    this.frameCount = 0
    this.lastFPSUpdate = this.now()
    this.lastFrameTs = 0
    this.schedule()
  }

  stopMonitoring(): void {
    this.isMonitoring = false
    if (this.rafId != null && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  // ===== observers =====
  addObserver(cb: (metrics: PerformanceMetrics) => void): () => void {
    this.observers.add(cb)
    return () => this.observers.delete(cb)
  }

  // ===== render measures =====
  startRenderMeasure(): void {
    this.frameStartTime = this.now()
  }

  endRenderMeasure(): number {
    const renderTime = this.now() - this.frameStartTime
    this.addToHistory(this.renderTimeHistory, renderTime)
    return renderTime
  }

  // generic code execution timing
  measureUpdateTime<T>(fn: () => T): { result: T; duration: number } {
    const start = this.now()
    const result = fn()
    const duration = this.now() - start
    this.addToHistory(this.updateTimeHistory, duration)
    return { result, duration }
  }

  // ===== FPS tracking with EMA smoothing =====
  private updateFPSEma(currentTs: number): void {
    if (!this.lastFrameTs) this.lastFrameTs = currentTs
    const dt = currentTs - this.lastFrameTs
    this.lastFrameTs = currentTs

    if (dt > 0) {
      const inst = 1000 / dt
      this.fpsEma = EMA_ALPHA * inst + (1 - EMA_ALPHA) * this.fpsEma
      this.currentFPS = Math.round(this.fpsEma)
    }

    // legacy counter update once per second (optional)
    this.frameCount++
    const elapsed = currentTs - this.lastFPSUpdate
    if (elapsed >= 1000) {
      this.frameCount = 0
      this.lastFPSUpdate = currentTs
    }
  }

  // ===== memory =====
  getMemoryUsage(): number {
    const perf: any = typeof performance !== 'undefined' ? performance : undefined
    if (perf && perf.memory && perf.memory.usedJSHeapSize) {
      return perf.memory.usedJSHeapSize / (1024 * 1024) // MB
    }
    return 0
  }

  // ===== collection =====
  collectMetrics(pinCount: number, layerCount: number): PerformanceMetrics {
    const memoryUsage = this.getMemoryUsage()
    this.addToHistory(this.memoryUsageHistory, memoryUsage)

    const metrics: PerformanceMetrics = {
      renderTime: this.getAverageRenderTime(),
      updateTime: this.getAverageUpdateTime(),
      memoryUsage,
      pinCount,
      layerCount,
      fps: this.currentFPS,
      timestamp: new Date(),
    }

    this.metrics.push(metrics)
    if (this.metrics.length > METRICS_MAX) this.metrics.shift()

    // notify
    this.observers.forEach((cb) => {
      try { cb(metrics) } catch {/* no-op */}
    })

    return metrics
  }

  // ===== averages =====
  getAverageRenderTime(): number {
    if (!this.renderTimeHistory.length) return 0
    const sum = this.renderTimeHistory.reduce((a, b) => a + b, 0)
    return sum / this.renderTimeHistory.length
  }

  getAverageUpdateTime(): number {
    if (!this.updateTimeHistory.length) return 0
    const sum = this.updateTimeHistory.reduce((a, b) => a + b, 0)
    return sum / this.updateTimeHistory.length
  }

  // ===== trends =====
  private analyzeTrend(
    data: number[],
    positiveIsGood: boolean
  ): Trend {
    if (data.length < 10) return 'stable'
    const recent = data.slice(-10)
    const older = data.slice(-20, -10)
    if (older.length < 10) return 'stable'

    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length
    const r = avg(recent)
    const o = avg(older)
    if (o === 0) return 'stable'

    const changePct = ((r - o) / o) * 100
    if (Math.abs(changePct) < 5) return 'stable'

    const improving = positiveIsGood ? changePct > 0 : changePct < 0
    return improving ? 'improving' : 'degrading'
  }

  getStats(): {
    current: PerformanceMetrics | null
    averages: { renderTime: number; updateTime: number; memoryUsage: number; fps: number }
    trends: { renderTime: Trend; memoryUsage: MemTrend; fps: Trend }
    warnings: string[]
  } {
    const current = this.metrics[this.metrics.length - 1] || null
    const averages = {
      renderTime: this.getAverageRenderTime(),
      updateTime: this.getAverageUpdateTime(),
      memoryUsage: this.memoryUsageHistory.length
        ? this.memoryUsageHistory.reduce((a, b) => a + b, 0) / this.memoryUsageHistory.length
        : 0,
      fps: this.currentFPS,
    }

    const rtTrend = this.analyzeTrend(this.renderTimeHistory, /* positiveIsGood */ false)
    const memTrendGeneric = this.analyzeTrend(this.memoryUsageHistory, /* positiveIsGood */ false)
    const fpsTrend = this.analyzeTrend(this.metrics.slice(-20).map((m) => m.fps), /* positiveIsGood */ true)

    const memTrend: MemTrend =
      memTrendGeneric === 'stable'
        ? 'stable'
        : memTrendGeneric === 'improving'
        ? 'decreasing'
        : 'increasing'

    const warnings: string[] = []
    if (averages.renderTime > WARN_RENDER_MS) warnings.push('High render time detected. Consider virtualization or reducing per-frame work.')
    if (averages.renderTime > WARN_RENDER_MS_SEVERE) warnings.push('Severe render time. Consider LOD and clustering.')
    if (averages.memoryUsage > WARN_MEMORY_MB) warnings.push('High memory usage. Check for leaks and large images.')
    if (averages.fps < WARN_FPS_LOW) warnings.push('Low FPS. Optimize renders and batching.')
    if (memTrend === 'increasing') warnings.push('Memory usage trending up. Audit allocations and listeners.')

    return {
      current,
      averages,
      trends: { renderTime: rtTrend, memoryUsage: memTrend, fps: fpsTrend },
      warnings,
    }
  }

  isPerformanceDegraded(): boolean {
    const s = this.getStats()
    return (
      s.warnings.length > 0 ||
      s.averages.fps < WARN_FPS_LOW ||
      s.averages.renderTime > WARN_RENDER_MS_SEVERE
    )
  }

  getRecommendations(): string[] {
    const out: string[] = []
    const s = this.getStats()

    if (s.averages.renderTime > WARN_RENDER_MS) {
      out.push('Enable canvas virtualization')
      out.push('Increase clustering threshold')
      out.push('Apply LOD at low zoom levels')
    }
    if (s.averages.memoryUsage > WARN_MEMORY_MB_MED) {
      out.push('Lazy-load pin metadata and thumbnails')
      out.push('Clear stale caches')
      out.push('Pool frequently created objects')
    }
    if (s.averages.fps < WARN_FPS_WARN) {
      out.push('Reduce animation complexity')
      out.push('Batch state updates to cut re-renders')
      out.push('Use requestAnimationFrame-driven loops')
    }
    if (s.trends.memoryUsage === 'increasing') {
      out.push('Check listener cleanup on unmount')
      out.push('Audit large arrays and image lifecycles')
    }
    return out
  }

  clearHistory(): void {
    this.metrics = []
    this.memoryUsageHistory = []
    this.renderTimeHistory = []
    this.updateTimeHistory = []
    this.frameCount = 0
    this.lastFPSUpdate = this.now()
    this.lastFrameTs = 0
    this.fpsEma = 60
    this.currentFPS = 60
  }

  exportData(): {
    summary: ReturnType<PerformanceService['getStats']>
    rawMetrics: PerformanceMetrics[]
    recommendations: string[]
  } {
    return {
      summary: this.getStats(),
      rawMetrics: [...this.metrics],
      recommendations: this.getRecommendations(),
    }
  }
}

// ===== Performance utils (browser-safe) =====
export const PerformanceUtils = {
  debounce<T extends (...args: any[]) => any>(fn: T, wait: number) {
    let t: ReturnType<typeof setTimeout> | undefined
    return (...args: Parameters<T>) => {
      if (t) clearTimeout(t)
      t = setTimeout(() => fn(...args), wait)
    }
  },

  throttle<T extends (...args: any[]) => any>(fn: T, limit: number) {
    let inThrottle = false
    return (...args: Parameters<T>) => {
      if (inThrottle) return
      fn(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  },

  measureTime<T>(label: string, fn: () => T): T {
    const start = typeof performance !== 'undefined' ? performance.now() : Date.now()
    const res = fn()
    const end = typeof performance !== 'undefined' ? performance.now() : Date.now()
    // eslint-disable-next-line no-console
    console.log(`${label}: ${(end - start).toFixed(2)}ms`)
    return res
  },

  isPerformanceAPIAvailable(): boolean {
    return typeof performance !== 'undefined' && typeof performance.now === 'function'
  },

  getDeviceCapabilities(): {
    hardwareConcurrency: number
    memory?: number
    connection?: { effectiveType: string; downlink: number }
    isLowEndDevice: boolean
  } {
    const caps: any = {
      hardwareConcurrency: typeof navigator !== 'undefined' && (navigator as any).hardwareConcurrency || 4,
      isLowEndDevice: false,
    }

    if (typeof navigator !== 'undefined' && 'deviceMemory' in navigator) {
      caps.memory = (navigator as any).deviceMemory
      caps.isLowEndDevice = (navigator as any).deviceMemory < 4
    }

    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const c = (navigator as any).connection
      caps.connection = { effectiveType: c.effectiveType, downlink: c.downlink }
      caps.isLowEndDevice = caps.isLowEndDevice || c.effectiveType === '3g' || c.effectiveType === '2g'
    }

    return caps
  },

  getRecommendedSettings(): {
    enableVirtualization: boolean
    clusterThreshold: number
    animationsEnabled: boolean
    maxPinsVisible: number
    renderQuality: 'low' | 'medium' | 'high'
  } {
    const caps = this.getDeviceCapabilities()
    if (caps.isLowEndDevice) {
      return { enableVirtualization: true, clusterThreshold: 20, animationsEnabled: false, maxPinsVisible: 500, renderQuality: 'low' }
    }
    if (caps.hardwareConcurrency >= 8) {
      return { enableVirtualization: false, clusterThreshold: 100, animationsEnabled: true, maxPinsVisible: 5000, renderQuality: 'high' }
    }
    return { enableVirtualization: true, clusterThreshold: 50, animationsEnabled: true, maxPinsVisible: 2000, renderQuality: 'medium' }
  },

  createRAFLoop(callback: (deltaTime: number) => void): () => void {
    if (typeof requestAnimationFrame === 'undefined') {
      // Fallback: setInterval ~60fps
      const id = setInterval(() => callback(16), 16)
      return () => clearInterval(id)
    }
    let isRunning = false
    let lastTime = typeof performance !== 'undefined' ? performance.now() : Date.now()
    const loop = (current: number) => {
      if (!isRunning) return
      const dt = current - lastTime
      lastTime = current
      callback(dt)
      requestAnimationFrame(loop)
    }
    const start = () => {
      if (isRunning) return
      isRunning = true
      lastTime = typeof performance !== 'undefined' ? performance.now() : Date.now()
      requestAnimationFrame(loop)
    }
    const stop = () => { isRunning = false }
    start()
    return stop
  },

  getMemoryInfo(): { used: number; total: number; available: number } | null {
    const p: any = typeof performance !== 'undefined' ? performance : undefined
    if (p && p.memory) {
      return {
        used: p.memory.usedJSHeapSize,
        total: p.memory.totalJSHeapSize,
        available: p.memory.jsHeapSizeLimit,
      }
    }
    return null
  },

  forceGC(): void {
    if (typeof window !== 'undefined' && 'gc' in window) {
      ;(window as any).gc()
    }
  },
}

// singleton
let globalPerformanceService: PerformanceService | null = null
export const getPerformanceService = (): PerformanceService => {
  if (!globalPerformanceService) globalPerformanceService = new PerformanceService()
  return globalPerformanceService
}

export default PerformanceService
