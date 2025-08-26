export interface PerformanceMetrics {
  pageLoadTime: number
  firstContentfulPaint: number
  largestContentfulPaint: number
  cumulativeLayoutShift: number
  firstInputDelay: number
  timeToInteractive: number
}

export interface UserActionMetrics {
  action: string
  duration: number
  timestamp: number
  success: boolean
  error?: string
  metadata?: Record<string, any>
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics | null = null
  private userActions: UserActionMetrics[] = []
  private observer: PerformanceObserver | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeObservers()
      this.collectInitialMetrics()
    }
  }

  private initializeObservers() {
    if (!window.PerformanceObserver) return

    this.observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.processPerformanceEntry(entry)
      }
    })

    try {
      this.observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint', 'layout-shift', 'first-input'] })
    } catch (error) {
      console.warn('Performance observer not fully supported:', error)
    }
  }

  private processPerformanceEntry(entry: PerformanceEntry) {
    switch (entry.entryType) {
      case 'navigation':
        const navEntry = entry as PerformanceNavigationTiming
        this.updateMetrics({
          pageLoadTime: navEntry.loadEventEnd - navEntry.startTime,
          timeToInteractive: navEntry.domInteractive - navEntry.startTime
        })
        break

      case 'paint':
        if (entry.name === 'first-contentful-paint') {
          this.updateMetrics({
            firstContentfulPaint: entry.startTime
          })
        }
        break

      case 'largest-contentful-paint':
        this.updateMetrics({
          largestContentfulPaint: entry.startTime
        })
        break

      case 'layout-shift':
        const clsEntry = entry as any
        if (!clsEntry.hadRecentInput) {
          this.updateMetrics({
            cumulativeLayoutShift: (this.metrics?.cumulativeLayoutShift || 0) + clsEntry.value
          })
        }
        break

      case 'first-input':
        this.updateMetrics({
          firstInputDelay: (entry as any).processingStart - entry.startTime
        })
        break
    }
  }

  private collectInitialMetrics() {
    // Use Performance API if available
    if (window.performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigation) {
        this.metrics = {
          pageLoadTime: navigation.loadEventEnd - navigation.startTime,
          firstContentfulPaint: 0,
          largestContentfulPaint: 0,
          cumulativeLayoutShift: 0,
          firstInputDelay: 0,
          timeToInteractive: navigation.domInteractive - navigation.startTime
        }
      }

      // Get paint timings
      const paintEntries = performance.getEntriesByType('paint')
      for (const entry of paintEntries) {
        if (entry.name === 'first-contentful-paint') {
          this.updateMetrics({ firstContentfulPaint: entry.startTime })
        }
      }
    }
  }

  private updateMetrics(newMetrics: Partial<PerformanceMetrics>) {
    this.metrics = {
      ...this.metrics,
      ...newMetrics
    } as PerformanceMetrics
  }

  trackUserAction(action: string, metadata?: Record<string, any>): () => void {
    const startTime = performance.now()
    const timestamp = Date.now()

    return (success: boolean = true, error?: string) => {
      const duration = performance.now() - startTime
      
      this.userActions.push({
        action,
        duration,
        timestamp,
        success,
        error,
        metadata
      })

      // Keep only last 100 actions
      if (this.userActions.length > 100) {
        this.userActions = this.userActions.slice(-100)
      }

      // Log slow actions
      if (duration > 1000) {
        console.warn(`Slow action detected: ${action} took ${duration.toFixed(2)}ms`)
      }
    }
  }

  getMetrics(): PerformanceMetrics | null {
    return this.metrics
  }

  getUserActionMetrics(): UserActionMetrics[] {
    return [...this.userActions]
  }

  getPerformanceScore(): number {
    if (!this.metrics) return 0

    let score = 100

    // FCP scoring (0-2s = 100, 2-4s = 50, >4s = 0)
    if (this.metrics.firstContentfulPaint > 4000) score -= 25
    else if (this.metrics.firstContentfulPaint > 2000) score -= 12

    // LCP scoring (0-2.5s = 100, 2.5-4s = 50, >4s = 0)
    if (this.metrics.largestContentfulPaint > 4000) score -= 25
    else if (this.metrics.largestContentfulPaint > 2500) score -= 12

    // CLS scoring (0-0.1 = 100, 0.1-0.25 = 50, >0.25 = 0)
    if (this.metrics.cumulativeLayoutShift > 0.25) score -= 25
    else if (this.metrics.cumulativeLayoutShift > 0.1) score -= 12

    // FID scoring (0-100ms = 100, 100-300ms = 50, >300ms = 0)
    if (this.metrics.firstInputDelay > 300) score -= 25
    else if (this.metrics.firstInputDelay > 100) score -= 12

    return Math.max(0, score)
  }

  generateReport(): {
    performance: PerformanceMetrics | null
    score: number
    recommendations: string[]
    userActions: {
      total: number
      successful: number
      failed: number
      averageDuration: number
      slowActions: UserActionMetrics[]
    }
  } {
    const userActionStats = this.userActions.reduce(
      (acc, action) => ({
        total: acc.total + 1,
        successful: acc.successful + (action.success ? 1 : 0),
        failed: acc.failed + (action.success ? 0 : 1),
        totalDuration: acc.totalDuration + action.duration
      }),
      { total: 0, successful: 0, failed: 0, totalDuration: 0 }
    )

    const recommendations: string[] = []
    
    if (this.metrics) {
      if (this.metrics.firstContentfulPaint > 2000) {
        recommendations.push('Optimize First Contentful Paint - consider code splitting and lazy loading')
      }
      if (this.metrics.largestContentfulPaint > 2500) {
        recommendations.push('Optimize Largest Contentful Paint - optimize images and critical resources')
      }
      if (this.metrics.cumulativeLayoutShift > 0.1) {
        recommendations.push('Reduce Cumulative Layout Shift - set dimensions for images and ads')
      }
      if (this.metrics.firstInputDelay > 100) {
        recommendations.push('Optimize First Input Delay - reduce JavaScript execution time')
      }
    }

    const slowActions = this.userActions
      .filter(action => action.duration > 1000)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10)

    return {
      performance: this.metrics,
      score: this.getPerformanceScore(),
      recommendations,
      userActions: {
        ...userActionStats,
        averageDuration: userActionStats.total > 0 ? userActionStats.totalDuration / userActionStats.total : 0,
        slowActions
      }
    }
  }

  trackNavigation(from: string, to: string) {
    const endTracking = this.trackUserAction('navigation', { from, to })
    
    setTimeout(() => {
      endTracking()
    }, 100)
  }

  trackDataLoad(dataType: string, itemCount?: number) {
    const endTracking = this.trackUserAction('data_load', { 
      dataType, 
      itemCount 
    })
    
    return (success: boolean, error?: string) => {
      endTracking()
    }
  }

  trackPhotoUpload(fileSize: number, compressionRatio?: number) {
    const endTracking = this.trackUserAction('photo_upload', { 
      fileSize, 
      compressionRatio 
    })
    
    return (success: boolean, error?: string) => {
      endTracking()
    }
  }

  trackChatMessage(scope: string, hasAttachments: boolean = false) {
    const endTracking = this.trackUserAction('chat_message', { 
      scope, 
      hasAttachments 
    })
    
    return (success: boolean, error?: string) => {
      endTracking()
    }
  }

  cleanup() {
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }
  }
}

export let performanceMonitor: PerformanceMonitor | null = null

if (typeof window !== 'undefined') {
  performanceMonitor = new PerformanceMonitor()
  
  // Global cleanup on page unload
  window.addEventListener('beforeunload', () => {
    performanceMonitor?.cleanup()
  })
}