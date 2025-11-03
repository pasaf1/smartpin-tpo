'use client'

/**
 * SmartPin TPO - Error Handling Utilities
 * Enterprise error boundaries and handling for pin components
 */

import React from 'react'
import { PinError } from '../types'

interface PinErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface PinErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>
  onError?: (error: PinError) => void
}

export class PinErrorBoundary extends React.Component<PinErrorBoundaryProps, PinErrorBoundaryState> {
  constructor(props: PinErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): PinErrorBoundaryState {
    return {
      hasError: true,
      error
    }
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo })

    // Create structured error
    const pinError: PinError = {
      code: 'COMPONENT_ERROR',
      message: error.message,
      severity: 'high',
      recoverable: true,
      timestamp: new Date().toISOString(),
      context: {
        component: 'PinErrorBoundary',
        stack: error.stack,
        componentStack: errorInfo.componentStack
      }
    }

    // Report to parent
    this.props.onError?.(pinError)

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[PinErrorBoundary] Component error:', error, errorInfo)
    }
  }

  retry = () => {
    this.setState({ hasError: false })
  }

  override render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return React.createElement(FallbackComponent, { error: this.state.error, retry: this.retry })
    }

    return this.props.children
  }
}

// Default error fallback component
const DefaultErrorFallback: React.FC<{ error: Error; retry: () => void }> = ({ error, retry }) => (
  React.createElement('div', { className: 'p-6 bg-red-50 border border-red-200 rounded-lg' },
    React.createElement('div', { className: 'flex items-center gap-3 mb-4' },
      React.createElement('div', { className: 'w-10 h-10 bg-red-500 rounded-full flex items-center justify-center' },
        React.createElement('svg', { className: 'w-6 h-6 text-white', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
          React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '2', d: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' })
        )
      ),
      React.createElement('div', null,
        React.createElement('h3', { className: 'text-lg font-semibold text-red-900' }, 'Pin System Error'),
        React.createElement('p', { className: 'text-sm text-red-600' }, 'Something went wrong with the pin component')
      )
    ),
    React.createElement('div', { className: 'mb-4' },
      React.createElement('details', { className: 'text-sm' },
        React.createElement('summary', { className: 'cursor-pointer text-red-700 font-medium mb-2' }, 'Error Details'),
        React.createElement('div', { className: 'bg-white p-3 rounded border border-red-200 font-mono text-xs text-red-800 overflow-auto' },
          error.message,
          process.env.NODE_ENV === 'development' && error.stack && React.createElement('pre', { className: 'mt-2 text-xs opacity-75' }, error.stack)
        )
      )
    ),
    React.createElement('div', { className: 'flex gap-3' },
      React.createElement('button', {
        onClick: retry,
        className: 'px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors'
      }, 'Try Again'),
      React.createElement('button', {
        onClick: () => window.location.reload(),
        className: 'px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors'
      }, 'Reload Page')
    )
  )
)

// Error handling utilities
export const createPinError = (
  code: string,
  message: string,
  severity: PinError['severity'] = 'medium',
  context?: Record<string, any>
): PinError => ({
  code,
  message,
  severity,
  recoverable: severity !== 'critical',
  timestamp: new Date().toISOString(),
  context
})

// Async error handler with retry logic
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000,
  backoffMultiplier: number = 2
): Promise<T> => {
  let lastError: Error

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error

      if (attempt === maxRetries) {
        throw createPinError(
          'MAX_RETRIES_EXCEEDED',
          `Operation failed after ${maxRetries} attempts: ${lastError.message}`,
          'high',
          { attempts: maxRetries, lastError: lastError.message }
        )
      }

      // Wait before retry with exponential backoff
      const waitTime = delay * Math.pow(backoffMultiplier, attempt - 1)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }

  throw lastError!
}

// Validation error helper
export const validatePinData = (pin: any): PinError[] => {
  const errors: PinError[] = []

  if (!pin.id) {
    errors.push(createPinError('VALIDATION_ERROR', 'Pin ID is required', 'medium'))
  }

  if (!pin.seq_number || pin.seq_number <= 0) {
    errors.push(createPinError('VALIDATION_ERROR', 'Pin sequence number must be positive', 'medium'))
  }

  if (typeof pin.x !== 'number' || typeof pin.y !== 'number') {
    errors.push(createPinError('VALIDATION_ERROR', 'Pin coordinates must be numbers', 'medium'))
  }

  if (pin.x < 0 || pin.x > 1 || pin.y < 0 || pin.y > 1) {
    errors.push(createPinError('VALIDATION_ERROR', 'Pin coordinates must be between 0 and 1', 'medium'))
  }

  const validStatuses = ['Open', 'ReadyForInspection', 'Closed', 'InDispute']
  if (!validStatuses.includes(pin.status)) {
    errors.push(createPinError('VALIDATION_ERROR', `Invalid pin status: ${pin.status}`, 'medium'))
  }

  return errors
}

// Network error handler
export const handleNetworkError = (error: any): PinError => {
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return createPinError(
      'NETWORK_ERROR',
      'Network connection failed. Please check your internet connection.',
      'medium',
      { originalError: error.message }
    )
  }

  if (error.code === 'PGRST301') {
    return createPinError(
      'DATABASE_ERROR',
      'Database query failed due to row-level security policies',
      'high',
      { supabaseError: error }
    )
  }

  if (error.status === 401) {
    return createPinError(
      'AUTH_ERROR',
      'Authentication required. Please log in again.',
      'high',
      { status: error.status }
    )
  }

  if (error.status === 403) {
    return createPinError(
      'PERMISSION_ERROR',
      'You do not have permission to perform this action',
      'medium',
      { status: error.status }
    )
  }

  if (error.status >= 500) {
    return createPinError(
      'SERVER_ERROR',
      'Server error occurred. Please try again later.',
      'high',
      { status: error.status, message: error.message }
    )
  }

  return createPinError(
    'UNKNOWN_ERROR',
    error.message || 'An unexpected error occurred',
    'medium',
    { originalError: error }
  )
}

// Hook for error handling in components
export const usePinErrorHandler = () => {
  const [errors, setErrors] = React.useState<PinError[]>([])

  const addError = React.useCallback((error: PinError | Error | string) => {
    let pinError: PinError

    if (typeof error === 'string') {
      pinError = createPinError('GENERIC_ERROR', error)
    } else if (error instanceof Error) {
      pinError = handleNetworkError(error)
    } else {
      pinError = error
    }

    setErrors(prev => [...prev, pinError])

    // Auto-remove recoverable errors after 5 seconds
    if (pinError.recoverable) {
      setTimeout(() => {
        setErrors(prev => prev.filter(e => e !== pinError))
      }, 5000)
    }
  }, [])

  const removeError = React.useCallback((errorToRemove: PinError) => {
    setErrors(prev => prev.filter(error => error !== errorToRemove))
  }, [])

  const clearErrors = React.useCallback(() => {
    setErrors([])
  }, [])

  return {
    errors,
    addError,
    removeError,
    clearErrors,
    hasErrors: errors.length > 0,
    hasCriticalErrors: errors.some(e => e.severity === 'critical')
  }
}

export default PinErrorBoundary