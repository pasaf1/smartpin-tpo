// Comprehensive Analytics & Monitoring System
// Tracks user interactions, performance metrics, and business insights

import { getSupabaseClient } from '@/lib/supabase/client'

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void
  }
}

// Analytics Event Types
export type AnalyticsEvent = 
  // User Actions
  | 'page_view'
  | 'project_created'
  | 'project_opened'
  | 'roof_uploaded'
  | 'pin_created'
  | 'pin_status_changed'
  | 'photo_uploaded'
  | 'chat_message_sent'
  | 'export_data'
  // Performance Events
  | 'component_load_time'
  | 'api_response_time'
  | 'image_load_time'
  | 'bundle_loaded'
  // Business Events
  | 'issue_resolved'
  | 'quality_score_calculated'
  | 'inspection_completed'
  | 'user_session_start'
  | 'user_session_end'
  // Error Events
  | 'javascript_error'
  | 'api_error'
  | 'upload_failed'
  | 'authentication_failed'

// Analytics Data Structure
export interface AnalyticsData {
  event: AnalyticsEvent
  properties?: Record<string, any>
  userId?: string
  sessionId?: string
  timestamp?: Date
  metadata?: {
    userAgent?: string
    viewport?: { width: number; height: number }
    connection?: string
    performance?: Record<string, number>
  }
}

// Core Analytics Manager
export class AnalyticsManager {
  private static instance: AnalyticsManager
  private supabase = getSupabaseClient()
  private sessionId: string
  private queue: AnalyticsData[] = []
  private isOnline = true
  private flushInterval: NodeJS.Timeout | null = null

  private constructor() {
    this.sessionId = this.generateSessionId()
    this.initializeOnlineListener()
    this.startPeriodicFlush()
  }

  static getInstance(): AnalyticsManager {
    if (!AnalyticsManager.instance) {
      AnalyticsManager.instance = new AnalyticsManager()
    }
    return AnalyticsManager.instance
  }

  // Track an analytics event
  async track(event: AnalyticsEvent, properties?: Record<string, any>, userId?: string) {
    const analyticsData: AnalyticsData = {
      event,
      properties: {
        ...properties,
        page_url: typeof window !== 'undefined' ? window.location.href : undefined,
        page_title: typeof document !== 'undefined' ? document.title : undefined,
        referrer: typeof document !== 'undefined' ? document.referrer : undefined,
      },
      ...(userId ? { userId } : {}),
      sessionId: this.sessionId,
      timestamp: new Date(),
      metadata: this.getMetadata()
    }

    // Add to queue for batching
    this.queue.push(analyticsData)

    // Send to external analytics if available
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', event, {
        custom_parameter_1: properties?.['category'],
        custom_parameter_2: properties?.['label'],
        value: properties?.['value'],
        user_id: userId,
        session_id: this.sessionId
      })
    }

    // Flush immediately for critical events
    if (this.isCriticalEvent(event)) {
      await this.flush()
    }
  }

  // Performance tracking
  async trackPerformance(metric: string, value: number, context?: Record<string, any>) {
    await this.track('component_load_time', {
      metric,
      value,
      context,
      category: 'performance'
    })
  }

  // Error tracking
  async trackError(error: Error, context?: Record<string, any>) {
    await this.track('javascript_error', {
      error_message: error.message,
      error_stack: error.stack,
      error_name: error.name,
      context,
      category: 'error'
    })
  }

  // API call tracking
  async trackApiCall(endpoint: string, method: string, responseTime: number, status: number) {
    const event: AnalyticsEvent = status >= 400 ? 'api_error' : 'api_response_time'
    
    await this.track(event, {
      endpoint,
      method,
      response_time: responseTime,
      status_code: status,
      category: 'api'
    })
  }

  // User session tracking
  async startSession(userId?: string) {
    await this.track('user_session_start', {
      category: 'session'
    }, userId)
  }

  async endSession(userId?: string) {
    await this.track('user_session_end', {
      session_duration: this.getSessionDuration(),
      category: 'session'
    }, userId)
    
    // Flush remaining events
    await this.flush()
  }

  // Page view tracking
  async trackPageView(path: string, userId?: string) {
    await this.track('page_view', {
      page_path: path,
      category: 'navigation'
    }, userId)
  }

  // Business metrics tracking
  async trackBusinessMetric(metric: string, value: number, dimensions?: Record<string, any>) {
    await this.track('quality_score_calculated', {
      metric_name: metric,
      metric_value: value,
      dimensions,
      category: 'business'
    })
  }

  // Flush events to storage
  private async flush() {
    if (this.queue.length === 0) return

    const eventsToFlush = [...this.queue]
    this.queue = []

    try {
      // For now, just store events locally as the analytics_events table doesn't exist
      // In production, you would create this table in your database
      this.storeEventsLocally(eventsToFlush)
    } catch (error) {
      console.warn('Analytics flush failed:', error)
      // Store in localStorage as fallback
      this.storeEventsLocally(eventsToFlush)
    }
  }

  // Fallback local storage
  private storeEventsLocally(events: AnalyticsData[]) {
    try {
      const storedEvents = JSON.parse(localStorage.getItem('analytics_events') || '[]')
      const updatedEvents = [...storedEvents, ...events].slice(-1000) // Keep last 1000 events
      localStorage.setItem('analytics_events', JSON.stringify(updatedEvents))
    } catch {
      // Ignore localStorage errors
    }
  }

  // Retrieve locally stored events
  private getStoredEvents(): AnalyticsData[] {
    try {
      return JSON.parse(localStorage.getItem('analytics_events') || '[]')
    } catch {
      return []
    }
  }

  // Sync stored events when back online
  private async syncStoredEvents() {
    const storedEvents = this.getStoredEvents()
    if (storedEvents.length === 0) return

    // For now, just clear stored events since we're not syncing to database
    // In production, you would sync these to your analytics_events table
    localStorage.removeItem('analytics_events')
  }

  // Utility methods
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private getMetadata() {
    if (typeof window === 'undefined') return {}

    return {
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      connection: (navigator as any).connection?.effectiveType,
      performance: {
        memory_used: (performance as any).memory?.usedJSHeapSize,
        memory_limit: (performance as any).memory?.jsHeapSizeLimit,
        load_time: performance.timing?.loadEventEnd - performance.timing?.navigationStart
      }
    }
  }

  private getSessionDuration(): number {
    const parts = this.sessionId.split('_')
    const sessionStart = parts[1] ? parseInt(parts[1]) : Date.now()
    return Date.now() - sessionStart
  }

  private isCriticalEvent(event: AnalyticsEvent): boolean {
    return [
      'javascript_error',
      'api_error',
      'authentication_failed',
      'upload_failed'
    ].includes(event)
  }

  private initializeOnlineListener() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true
        this.syncStoredEvents()
      })

      window.addEventListener('offline', () => {
        this.isOnline = false
      })
    }
  }

  private startPeriodicFlush() {
    this.flushInterval = setInterval(() => {
      if (this.queue.length > 0) {
        this.flush()
      }
    }, 30000) // Flush every 30 seconds
  }

  // Cleanup
  public destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
    }
    this.flush() // Final flush
  }
}

// React Hook for Analytics
export function useAnalytics() {
  const analytics = AnalyticsManager.getInstance()

  return {
    track: analytics.track.bind(analytics),
    trackError: analytics.trackError.bind(analytics),
    trackPerformance: analytics.trackPerformance.bind(analytics),
    trackApiCall: analytics.trackApiCall.bind(analytics),
    trackPageView: analytics.trackPageView.bind(analytics),
    trackBusinessMetric: analytics.trackBusinessMetric.bind(analytics),
    startSession: analytics.startSession.bind(analytics),
    endSession: analytics.endSession.bind(analytics)
  }
}

// Performance Observer for Web Vitals
export function initializePerformanceObserver() {
  if (typeof window === 'undefined') return

  const analytics = AnalyticsManager.getInstance()

  // Observer for Core Web Vitals
  const observeWebVitals = () => {
    // Web vitals tracking would require installing the 'web-vitals' package
    // import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
    //   getCLS((metric) => {
    //     analytics.trackPerformance('CLS', metric.value, { metric: metric.name })
    //   })
    //   // ... other metrics
    // })
    
    // For now, use basic performance APIs
    if ('PerformanceObserver' in window) {
      try {
        const perfObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            analytics.trackPerformance(entry.name, entry.duration, {
              entryType: entry.entryType,
              startTime: entry.startTime
            })
          })
        })
        
        perfObserver.observe({ entryTypes: ['measure', 'navigation'] })
      } catch (e) {
        console.warn('Performance observer not supported')
      }
    }
  }

  // Observer for long tasks
  if ('PerformanceObserver' in window) {
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          analytics.trackPerformance('long_task', entry.duration, {
            entry_type: entry.entryType,
            start_time: entry.startTime
          })
        })
      })
      
      longTaskObserver.observe({ entryTypes: ['longtask'] })
    } catch (e) {
      // PerformanceObserver not supported
    }
  }

  observeWebVitals()
}

// Global error handler
export function initializeErrorTracking() {
  if (typeof window === 'undefined') return

  const analytics = AnalyticsManager.getInstance()

  // Global error handler
  window.addEventListener('error', (event) => {
    analytics.trackError(event.error || new Error(event.message), {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      type: 'global_error'
    })
  })

  // Promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    analytics.trackError(
      event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
      { type: 'unhandled_promise_rejection' }
    )
  })
}

// Export singleton instance
export const analytics = AnalyticsManager.getInstance()