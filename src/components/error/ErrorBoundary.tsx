'use client'

import React from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorFallbackProps {
  error?: Error
  resetError: () => void
  goHome: () => void
}

const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError, goHome }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
    <div className="max-w-md w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-white/40 dark:border-slate-700/50 rounded-2xl shadow-xl p-8 text-center">
      <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
      </div>
      
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        Something went wrong
      </h1>
      
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Don't worry, this happens sometimes. You can try refreshing the page or go back to the homepage.
      </p>
      
      {error && (
        <details className="text-left bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6 text-sm">
          <summary className="cursor-pointer font-medium text-gray-700 dark:text-gray-300 mb-2">
            Error Details
          </summary>
          <pre className="text-red-600 dark:text-red-400 whitespace-pre-wrap overflow-auto max-h-32">
            {error.message}
          </pre>
        </details>
      )}
      
      <div className="flex gap-3 justify-center">
        <Button 
          onClick={resetError}
          className="flex items-center gap-2"
          variant="outline"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </Button>
        
        <Button 
          onClick={goHome}
          className="flex items-center gap-2"
        >
          <Home className="w-4 h-4" />
          Go Home
        </Button>
      </div>
    </div>
  </div>
)

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 Error Boundary caught an error:', error, errorInfo)
    
    // Log to external service if needed
    this.props.onError?.(error, errorInfo)
    
    this.setState({
      error,
      errorInfo,
    })
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  goHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      
      return (
        <FallbackComponent 
          error={this.state.error}
          resetError={this.resetError}
          goHome={this.goHome}
        />
      )
    }

    return this.props.children
  }
}

// Hook for functional components to trigger error boundary
export const useErrorHandler = () => {
  const [, setError] = React.useState()
  
  return React.useCallback((error: Error) => {
    setError(() => {
      throw error
    })
  }, [])
}