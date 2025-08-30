import React from 'react'
import { cn } from '@/lib/utils'
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react'

// Standardized Loading Component System
// Provides consistent loading states across the entire application

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'primary' | 'secondary' | 'minimal'
  className?: string
}

export function LoadingSpinner({ size = 'md', variant = 'primary', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }

  const variantClasses = {
    primary: 'text-indigo-600 dark:text-indigo-400',
    secondary: 'text-slate-600 dark:text-slate-400',
    minimal: 'text-current'
  }

  return (
    <Loader2 
      className={cn(
        'animate-spin',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      aria-label="Loading"
    />
  )
}

interface LoadingPageProps {
  title?: string
  message?: string
  showLogo?: boolean
  variant?: 'fullscreen' | 'card' | 'inline'
  className?: string
}

export function LoadingPage({ 
  title = 'Loading', 
  message = 'Please wait while we fetch your data...',
  showLogo = true,
  variant = 'fullscreen',
  className 
}: LoadingPageProps) {
  const baseClasses = {
    fullscreen: 'min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center',
    card: 'p-8 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col items-center',
    inline: 'py-12 flex flex-col items-center'
  }

  return (
    <div className={cn(baseClasses[variant], className)} role="status" aria-live="polite">
      <div className="text-center max-w-md mx-auto">
        {/* Logo */}
        {showLogo && (
          <div className="relative mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-blue-700 dark:from-indigo-500 dark:to-blue-600 rounded-2xl shadow-xl shadow-indigo-500/30 flex items-center justify-center mx-auto">
              <div className="w-12 h-12 bg-white rounded-lg opacity-90"></div>
            </div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 dark:border-t-indigo-400 rounded-2xl animate-spin mx-auto"></div>
          </div>
        )}

        {/* Animated Spinner */}
        {!showLogo && (
          <div className="relative mb-6">
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <div className="w-12 h-12 border-4 border-blue-400 border-b-transparent rounded-full animate-spin mx-auto absolute top-2 left-1/2 transform -translate-x-1/2" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
        )}
        
        {/* Loading Text */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            {title}
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            {message}
          </p>
          <div className="text-xs text-slate-500 dark:text-slate-500 mt-4">
            If this takes longer than expected, please check your connection
          </div>
        </div>
        
        {/* Progress dots animation */}
        <div className="flex justify-center space-x-2 mt-6">
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  )
}

interface LoadingErrorProps {
  title?: string
  message?: string
  onRetry?: () => void
  onReload?: () => void
  error?: Error | string
  className?: string
}

export function LoadingError({
  title = 'Failed to Load',
  message = 'We couldn\'t load the requested data. This might be a temporary connection issue.',
  onRetry,
  onReload,
  error,
  className
}: LoadingErrorProps) {
  return (
    <div className={cn('min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center', className)} role="alert">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
            {title}
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            {message}
          </p>
          
          {error && (
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-700 dark:text-red-400">
                Error: {error instanceof Error ? error.message : String(error)}
              </p>
            </div>
          )}
          
          <div className="flex gap-3 justify-center pt-4">
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                aria-label="Retry loading"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            )}
            
            {onReload && (
              <button
                onClick={onReload}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                aria-label="Reload page"
              >
                Reload Page
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'rectangular' | 'circular'
  width?: string | number
  height?: string | number
  count?: number
}

export function Skeleton({ 
  className, 
  variant = 'rectangular', 
  width,
  height,
  count = 1 
}: SkeletonProps) {
  const baseClasses = 'bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 animate-pulse'
  
  const variantClasses = {
    text: 'h-4 rounded',
    rectangular: 'rounded',
    circular: 'rounded-full'
  }

  const items = Array.from({ length: count }, (_, index) => (
    <div
      key={index}
      className={cn(
        baseClasses,
        variantClasses[variant],
        className
      )}
      style={{
        width: width,
        height: height || (variant === 'text' ? '1rem' : undefined)
      }}
      aria-label="Loading content"
    />
  ))

  return count > 1 ? <div className="space-y-2">{items}</div> : items[0]
}

interface LoadingButtonProps {
  isLoading?: boolean
  children: React.ReactNode
  className?: string
  disabled?: boolean
  loadingText?: string
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
}

export function LoadingButton({
  isLoading = false,
  children,
  className,
  disabled,
  loadingText,
  variant = 'primary',
  size = 'md',
  onClick,
  type = 'button'
}: LoadingButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-indigo-600 to-blue-700 hover:from-indigo-700 hover:to-blue-800 text-white shadow-lg focus:ring-indigo-500',
    secondary: 'bg-slate-200 hover:bg-slate-300 text-slate-900 focus:ring-slate-500 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-100',
    outline: 'border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white focus:ring-indigo-500 dark:border-indigo-400 dark:text-indigo-400'
  }

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      aria-busy={isLoading}
      aria-disabled={disabled || isLoading}
    >
      {isLoading && (
        <LoadingSpinner size="sm" variant="minimal" className="mr-2" />
      )}
      {isLoading && loadingText ? loadingText : children}
    </button>
  )
}

// Progress indicator for long-running operations
interface ProgressIndicatorProps {
  progress: number // 0-100
  message?: string
  showPercentage?: boolean
  className?: string
  variant?: 'linear' | 'circular'
}

export function ProgressIndicator({
  progress,
  message,
  showPercentage = true,
  className,
  variant = 'linear'
}: ProgressIndicatorProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress))

  if (variant === 'circular') {
    const radius = 50
    const circumference = 2 * Math.PI * radius
    const strokeDashoffset = circumference - (clampedProgress / 100) * circumference

    return (
      <div className={cn('flex flex-col items-center space-y-4', className)} role="progressbar" aria-valuenow={clampedProgress} aria-valuemin={0} aria-valuemax={100}>
        <div className="relative">
          <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-slate-200 dark:text-slate-700"
            />
            <circle
              cx="60"
              cy="60"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="text-indigo-600 dark:text-indigo-400 transition-all duration-300"
              strokeLinecap="round"
            />
          </svg>
          {showPercentage && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                {Math.round(clampedProgress)}%
              </span>
            </div>
          )}
        </div>
        {message && (
          <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
            {message}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)} role="progressbar" aria-valuenow={clampedProgress} aria-valuemin={0} aria-valuemax={100}>
      <div className="flex items-center justify-between">
        {message && (
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {message}
          </p>
        )}
        {showPercentage && (
          <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
            {Math.round(clampedProgress)}%
          </span>
        )}
      </div>
      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
        <div
          className="bg-gradient-to-r from-indigo-600 to-blue-700 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  )
}