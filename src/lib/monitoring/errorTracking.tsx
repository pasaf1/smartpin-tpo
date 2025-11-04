import React from 'react'

export interface ErrorReport {
  id: string
  message: string
  stack?: string
  component?: string
  action?: string
  userId?: string
  userAgent: string
  url: string
  timestamp: string
  metadata?: Record<string, unknown>
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export class ErrorTracker {
  private errors: ErrorReport[] = []
  private maxErrors = 100
  private apiEndpoint = '/api/errors'

  constructor() {
    if (typeof window !== 'undefined') {
      this.setupGlobalErrorHandlers()
    }
  }

  private setupGlobalErrorHandlers() {
    window.addEventListener('error', (event) => {
      this.captureError({
        message: event.message,
        ...(event.error?.stack !== undefined ? { stack: event.error.stack } : {}),
        component: 'global',
        severity: 'high',
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      })
    })

    window.addEventListener('unhandledrejection', (event) => {
      this.captureError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        ...(event.reason?.stack !== undefined ? { stack: event.reason.stack } : {}),
        component: 'global',
        severity: 'high',
        metadata: {
          reason: event.reason
        }
      })
    })
  }

  captureError(error: Partial<ErrorReport>) {
    const errorReport: ErrorReport = {
      id: `error-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      message: error.message || 'Unknown error',
      ...(error.stack !== undefined ? { stack: error.stack } : {}),
      ...(error.component !== undefined ? { component: error.component } : { component: 'unknown' }),
      ...(error.action !== undefined ? { action: error.action } : {}),
      ...(error.userId !== undefined ? { userId: error.userId } : {}),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
      url: typeof window !== 'undefined' ? window.location.href : 'server',
      timestamp: new Date().toISOString(),
      ...(error.metadata !== undefined ? { metadata: error.metadata } : {}),
      severity: error.severity || 'medium'
    }

    this.errors.unshift(errorReport)
    
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors)
    }

    console.error('Error captured:', errorReport)
    
    if (errorReport.severity === 'critical') {
      this.sendToServer(errorReport)
    }

    return errorReport
  }

  captureUserError(message: string, component: string, action?: string, metadata?: Record<string, unknown>) {
    return this.captureError({
      message,
      component,
      ...(action !== undefined ? { action } : {}),
      severity: 'medium',
      ...(metadata !== undefined ? { metadata } : {})
    })
  }

  captureNetworkError(url: string, status: number, message: string, metadata?: Record<string, unknown>) {
    return this.captureError({
      message: `Network Error: ${message}`,
      component: 'network',
      action: 'fetch',
      severity: status >= 500 ? 'high' : 'medium',
      metadata: {
        url,
        status,
        ...(metadata !== undefined ? metadata : {})
      }
    })
  }

  private async sendToServer(error: ErrorReport) {
    try {
      await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(error)
      })
    } catch (serverError) {
      console.error('Failed to send error to server:', serverError)
    }
  }

  getErrors(severity?: ErrorReport['severity']): ErrorReport[] {
    if (severity) {
      return this.errors.filter(error => error.severity === severity)
    }
    return [...this.errors]
  }

  getErrorStats() {
    const now = Date.now()
    const oneHourAgo = now - (60 * 60 * 1000)
    const oneDayAgo = now - (24 * 60 * 60 * 1000)

    const recentErrors = this.errors.filter(error => 
      new Date(error.timestamp).getTime() > oneHourAgo
    )
    
    const dailyErrors = this.errors.filter(error => 
      new Date(error.timestamp).getTime() > oneDayAgo
    )

    const errorsByComponent = this.errors.reduce((acc, error) => {
      acc[error.component || 'unknown'] = (acc[error.component || 'unknown'] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const errorsBySeverity = this.errors.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      total: this.errors.length,
      recent: recentErrors.length,
      daily: dailyErrors.length,
      byComponent: errorsByComponent,
      bySeverity: errorsBySeverity,
      criticalErrors: this.errors.filter(e => e.severity === 'critical').length
    }
  }

  clearErrors() {
    this.errors = []
  }

  exportErrors(): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      errors: this.errors,
      stats: this.getErrorStats()
    }, null, 2)
  }
}

export const errorTracker = new ErrorTracker()

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallbackComponent?: React.ComponentType<{ error: Error; reset: () => void }>
) {
  const FallbackComponent = fallbackComponent
  
  return class ErrorBoundaryWrapper extends React.Component<
    P,
    { hasError: boolean; error: Error | null }
  > {
    constructor(props: P) {
      super(props)
      this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error) {
      return { hasError: true, error }
    }

    override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      errorTracker.captureError({
        message: error.message,
        ...(error.stack !== undefined ? { stack: error.stack } : {}),
        component: Component.name || 'Unknown',
        severity: 'high',
        metadata: {
          componentStack: errorInfo.componentStack,
          errorBoundary: true
        }
      })
    }

    override render() {
      if (this.state.hasError && this.state.error) {
        if (FallbackComponent) {
          return (
            <FallbackComponent 
              error={this.state.error}
              reset={() => this.setState({ hasError: false, error: null })}
            />
          )
        }

        return (
          <div className="p-8 text-center border-2 border-red-200 bg-red-50 rounded-lg">
            <h2 className="text-lg font-semibold text-red-800 mb-2">
              Something went wrong
            </h2>
            <p className="text-red-600 mb-4">
              {this.state.error.message}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        )
      }

      return <Component {...this.props} />
    }
  }
}
