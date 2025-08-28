/**
 * PinMapper Enhanced System - Performance Monitoring Service
 * Comprehensive performance monitoring and optimization utilities
 */

import { PerformanceMetrics } from '../layer-types'

// Performance monitoring service
export class PerformanceService {
  private metrics: PerformanceMetrics[]
  private isMonitoring: boolean
  private frameStartTime: number
  private frameCount: number
  private lastFPSUpdate: number
  private currentFPS: number
  private observers: Set<(metrics: PerformanceMetrics) => void>
  private memoryUsageHistory: number[]
  private renderTimeHistory: number[]
  private updateTimeHistory: number[]

  constructor() {
    this.metrics = []
    this.isMonitoring = false
    this.frameStartTime = 0
    this.frameCount = 0
    this.lastFPSUpdate = performance.now()
    this.currentFPS = 60
    this.observers = new Set()
    this.memoryUsageHistory = []
    this.renderTimeHistory = []
    this.updateTimeHistory = []
  }

  // Start performance monitoring
  startMonitoring(): void {
    if (this.isMonitoring) return
    
    this.isMonitoring = true
    this.frameCount = 0
    this.lastFPSUpdate = performance.now()
    this.scheduleMetricsCollection()
  }

  // Stop performance monitoring
  stopMonitoring(): void {
    this.isMonitoring = false
  }

  // Add performance observer
  addObserver(callback: (metrics: PerformanceMetrics) => void): () => void {
    this.observers.add(callback)
    return () => this.observers.delete(callback)
  }

  // Start measuring render time
  startRenderMeasure(): void {
    this.frameStartTime = performance.now()
  }

  // End measuring render time and record
  endRenderMeasure(): number {
    const renderTime = performance.now() - this.frameStartTime
    this.renderTimeHistory.push(renderTime)
    
    // Keep only last 100 measurements
    if (this.renderTimeHistory.length > 100) {
      this.renderTimeHistory.shift()
    }
    
    return renderTime
  }

  // Measure update time
  measureUpdateTime<T>(fn: () => T): { result: T; duration: number } {
    const startTime = performance.now()
    const result = fn()
    const duration = performance.now() - startTime
    
    this.updateTimeHistory.push(duration)
    
    // Keep only last 100 measurements
    if (this.updateTimeHistory.length > 100) {
      this.updateTimeHistory.shift()
    }
    
    return { result, duration }
  }

  // Calculate current FPS
  updateFPS(): void {
    this.frameCount++
    const now = performance.now()
    const elapsed = now - this.lastFPSUpdate
    
    if (elapsed >= 1000) { // Update every second
      this.currentFPS = Math.round((this.frameCount * 1000) / elapsed)
      this.frameCount = 0
      this.lastFPSUpdate = now
    }
  }

  // Get memory usage (if available)
  getMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      return memory.usedJSHeapSize / (1024 * 1024) // Convert to MB
    }
    return 0
  }

  // Collect current metrics
  collectMetrics(pinCount: number, layerCount: number): PerformanceMetrics {
    const memoryUsage = this.getMemoryUsage()
    this.memoryUsageHistory.push(memoryUsage)
    
    // Keep only last 100 measurements
    if (this.memoryUsageHistory.length > 100) {
      this.memoryUsageHistory.shift()
    }

    const metrics: PerformanceMetrics = {
      renderTime: this.getAverageRenderTime(),
      updateTime: this.getAverageUpdateTime(),
      memoryUsage,
      pinCount,
      layerCount,
      fps: this.currentFPS,
      timestamp: new Date()
    }

    this.metrics.push(metrics)
    
    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics.shift()
    }

    // Notify observers
    this.observers.forEach(observer => observer(metrics))

    return metrics
  }

  // Get average render time
  getAverageRenderTime(): number {
    if (this.renderTimeHistory.length === 0) return 0
    const sum = this.renderTimeHistory.reduce((a, b) => a + b, 0)
    return sum / this.renderTimeHistory.length
  }

  // Get average update time
  getAverageUpdateTime(): number {
    if (this.updateTimeHistory.length === 0) return 0
    const sum = this.updateTimeHistory.reduce((a, b) => a + b, 0)
    return sum / this.updateTimeHistory.length
  }

  // Get performance statistics
  getStats(): {
    current: PerformanceMetrics | null
    averages: {
      renderTime: number
      updateTime: number
      memoryUsage: number
      fps: number
    }
    trends: {
      renderTime: 'improving' | 'degrading' | 'stable'
      memoryUsage: 'increasing' | 'decreasing' | 'stable'
      fps: 'improving' | 'degrading' | 'stable'
    }
    warnings: string[]
  } {
    const current = this.metrics[this.metrics.length - 1] || null
    const warnings: string[] = []

    // Calculate averages
    const averages = {
      renderTime: this.getAverageRenderTime(),
      updateTime: this.getAverageUpdateTime(),
      memoryUsage: this.memoryUsageHistory.length > 0 
        ? this.memoryUsageHistory.reduce((a, b) => a + b, 0) / this.memoryUsageHistory.length 
        : 0,
      fps: this.currentFPS
    }

    // Analyze trends
    const trends = {
      renderTime: this.analyzeTrend(this.renderTimeHistory) as 'improving' | 'degrading' | 'stable',
      memoryUsage: this.analyzeTrend(this.memoryUsageHistory) as 'increasing' | 'decreasing' | 'stable',
      fps: this.analyzeTrend(this.metrics.slice(-20).map(m => m.fps)) as 'improving' | 'degrading' | 'stable'
    }

    // Generate warnings
    if (averages.renderTime > 16) { // >16ms render time (below 60fps)
      warnings.push('High render time detected. Consider enabling virtualization or reducing pin count.')
    }
    
    if (averages.memoryUsage > 100) { // >100MB memory usage
      warnings.push('High memory usage detected. Consider clearing pin cache or reducing data.')
    }
    
    if (averages.fps < 30) {
      warnings.push('Low FPS detected. Performance optimization recommended.')
    }
    
    if (trends.memoryUsage === 'increasing') {
      warnings.push('Memory usage is trending upward. Check for memory leaks.')
    }

    return {
      current,
      averages,
      trends,
      warnings
    }
  }

  // Analyze trend in data
  private analyzeTrend(data: number[]): 'improving' | 'degrading' | 'stable' | 'increasing' | 'decreasing' {
    if (data.length < 5) return 'stable'
    
    const recent = data.slice(-10)
    const older = data.slice(-20, -10)
    
    if (recent.length === 0 || older.length === 0) return 'stable'
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length
    
    const changePercent = ((recentAvg - olderAvg) / olderAvg) * 100
    
    if (Math.abs(changePercent) < 5) return 'stable'
    
    // For render time and memory, increasing is bad (degrading)
    // For FPS, increasing is good (improving)
    if (changePercent > 0) {
      return data === this.metrics.slice(-20).map(m => m.fps) ? 'improving' : 'degrading'
    } else {
      return data === this.metrics.slice(-20).map(m => m.fps) ? 'degrading' : 'improving'
    }
  }

  // Check if performance is degraded
  isPerformanceDegraded(): boolean {
    const stats = this.getStats()
    return stats.warnings.length > 0 || 
           stats.averages.fps < 30 || 
           stats.averages.renderTime > 33 // ~30fps threshold
  }

  // Get performance recommendations
  getRecommendations(): string[] {
    const recommendations: string[] = []
    const stats = this.getStats()
    
    if (stats.averages.renderTime > 16) {
      recommendations.push('Enable canvas virtualization to improve render performance')
      recommendations.push('Consider increasing clustering threshold to reduce pin count')
      recommendations.push('Use Level of Detail (LOD) to simplify rendering at low zoom levels')
    }
    
    if (stats.averages.memoryUsage > 50) {
      recommendations.push('Clear unused pin data from memory')
      recommendations.push('Implement lazy loading for pin metadata')
      recommendations.push('Consider using object pooling for frequently created objects')
    }
    
    if (stats.averages.fps < 45) {
      recommendations.push('Reduce animation complexity')
      recommendations.push('Optimize re-render triggers')
      recommendations.push('Consider using requestAnimationFrame for smoother animations')
    }
    
    if (stats.trends.memoryUsage === 'increasing') {
      recommendations.push('Implement memory cleanup routines')
      recommendations.push('Check for event listener leaks')
      recommendations.push('Review component unmounting procedures')
    }
    
    return recommendations
  }

  // Clear all collected data
  clearHistory(): void {
    this.metrics = []
    this.memoryUsageHistory = []
    this.renderTimeHistory = []
    this.updateTimeHistory = []
    this.frameCount = 0
    this.lastFPSUpdate = performance.now()
  }

  // Export performance data
  exportData(): {
    summary: any
    rawMetrics: PerformanceMetrics[]
    recommendations: string[]
  } {
    return {
      summary: this.getStats(),
      rawMetrics: [...this.metrics],
      recommendations: this.getRecommendations()
    }
  }

  // Schedule periodic metrics collection
  private scheduleMetricsCollection(): void {
    if (!this.isMonitoring) return
    
    requestAnimationFrame(() => {
      this.updateFPS()
      this.scheduleMetricsCollection()
    })
  }
}

// Performance optimization utilities
export const PerformanceUtils = {
  // Debounce function for performance-critical operations
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout
    return (...args: Parameters<T>) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
    }
  },

  // Throttle function for high-frequency events
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle = false
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  },

  // Measure execution time of a function
  measureTime<T>(label: string, fn: () => T): T {
    const start = performance.now()
    const result = fn()
    const end = performance.now()
    console.log(`${label}: ${(end - start).toFixed(2)}ms`)
    return result
  },

  // Check if browser supports performance monitoring
  isPerformanceAPIAvailable(): boolean {
    return typeof performance !== 'undefined' && 
           typeof performance.now === 'function'
  },

  // Get device performance capabilities
  getDeviceCapabilities(): {
    hardwareConcurrency: number
    memory?: number
    connection?: {
      effectiveType: string
      downlink: number
    }
    isLowEndDevice: boolean
  } {
    const capabilities = {
      hardwareConcurrency: navigator.hardwareConcurrency || 4,
      isLowEndDevice: false
    }

    // Check memory if available
    if ('deviceMemory' in navigator) {
      (capabilities as any).memory = (navigator as any).deviceMemory
      capabilities.isLowEndDevice = (navigator as any).deviceMemory < 4
    }

    // Check connection if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      (capabilities as any).connection = {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink
      }
      
      // Consider 3G or slower as low-end
      capabilities.isLowEndDevice = capabilities.isLowEndDevice || 
        connection.effectiveType === '3g' || 
        connection.effectiveType === '2g'
    }

    return capabilities
  },

  // Recommend performance settings based on device
  getRecommendedSettings(): {
    enableVirtualization: boolean
    clusterThreshold: number
    animationsEnabled: boolean
    maxPinsVisible: number
    renderQuality: 'low' | 'medium' | 'high'
  } {
    const capabilities = this.getDeviceCapabilities()
    
    if (capabilities.isLowEndDevice) {
      return {
        enableVirtualization: true,
        clusterThreshold: 20,
        animationsEnabled: false,
        maxPinsVisible: 500,
        renderQuality: 'low'
      }
    }
    
    if (capabilities.hardwareConcurrency >= 8) {
      return {
        enableVirtualization: false,
        clusterThreshold: 100,
        animationsEnabled: true,
        maxPinsVisible: 5000,
        renderQuality: 'high'
      }
    }
    
    // Default medium settings
    return {
      enableVirtualization: true,
      clusterThreshold: 50,
      animationsEnabled: true,
      maxPinsVisible: 2000,
      renderQuality: 'medium'
    }
  },

  // Create a performance-optimized RAF loop
  createRAFLoop(callback: (deltaTime: number) => void): () => void {
    let isRunning = false
    let lastTime = 0
    
    const loop = (currentTime: number) => {
      if (!isRunning) return
      
      const deltaTime = currentTime - lastTime
      lastTime = currentTime
      
      callback(deltaTime)
      requestAnimationFrame(loop)
    }
    
    const start = () => {
      if (isRunning) return
      isRunning = true
      lastTime = performance.now()
      requestAnimationFrame(loop)
    }
    
    const stop = () => {
      isRunning = false
    }
    
    start()
    return stop
  },

  // Memory usage utilities
  getMemoryInfo(): {
    used: number
    total: number
    available: number
  } | null {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        available: memory.jsHeapSizeLimit
      }
    }
    return null
  },

  // Force garbage collection (Chrome only, for development)
  forceGC(): void {
    if ('gc' in window) {
      (window as any).gc()
    }
  }
}

// Global performance service instance
let globalPerformanceService: PerformanceService | null = null

export const getPerformanceService = (): PerformanceService => {
  if (!globalPerformanceService) {
    globalPerformanceService = new PerformanceService()
  }
  return globalPerformanceService
}

export default PerformanceService
