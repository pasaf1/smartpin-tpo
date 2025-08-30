import React, { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

// Comprehensive Accessibility Enhancement System
// Provides WCAG 2.1 AA compliance components and utilities

// Skip Navigation Link
interface SkipLinkProps {
  href: string
  children: React.ReactNode
  className?: string
}

export function SkipLink({ href, children, className }: SkipLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium',
        'focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200',
        className
      )}
    >
      {children}
    </a>
  )
}

// Screen Reader Only Text
interface ScreenReaderOnlyProps {
  children: React.ReactNode
  className?: string
}

export function ScreenReaderOnly({ children, className }: ScreenReaderOnlyProps) {
  return (
    <span className={cn('sr-only', className)}>
      {children}
    </span>
  )
}

// Focus Trap for Modals
interface FocusTrapProps {
  children: React.ReactNode
  isActive?: boolean
  className?: string
  initialFocus?: React.RefObject<HTMLElement>
}

export function FocusTrap({ children, isActive = true, className, initialFocus }: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const lastActiveElement = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isActive) return

    // Store the currently focused element
    lastActiveElement.current = document.activeElement as HTMLElement

    // Focus the initial element or first focusable element
    const focusableElements = getFocusableElements(containerRef.current)
    if (initialFocus?.current) {
      initialFocus.current.focus()
    } else if (focusableElements.length > 0) {
      focusableElements[0].focus()
    }

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      const focusableElements = getFocusableElements(containerRef.current)
      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (e.shiftKey) {
        // Shift + Tab: move to previous element
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        }
      } else {
        // Tab: move to next element
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    document.addEventListener('keydown', handleTabKey)

    return () => {
      document.removeEventListener('keydown', handleTabKey)
      // Restore focus to the previously focused element
      if (lastActiveElement.current) {
        lastActiveElement.current.focus()
      }
    }
  }, [isActive, initialFocus])

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  )
}

// Helper function to get focusable elements
function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) return []

  const focusableSelectors = [
    'button',
    'a[href]',
    'input',
    'select',
    'textarea',
    '[tabindex]:not([tabindex="-1"])'
  ].join(', ')

  return Array.from(container.querySelectorAll(focusableSelectors))
    .filter(el => !el.hasAttribute('disabled') && el.getAttribute('tabindex') !== '-1') as HTMLElement[]
}

// Accessible Modal Dialog
interface AccessibleModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

export function AccessibleModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
  size = 'md'
}: AccessibleModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll
      document.body.style.overflow = 'hidden'
      
      // Announce modal opening to screen readers
      const announcement = document.createElement('div')
      announcement.setAttribute('aria-live', 'polite')
      announcement.className = 'sr-only'
      announcement.textContent = `Dialog opened: ${title}`
      document.body.appendChild(announcement)
      
      setTimeout(() => {
        document.body.removeChild(announcement)
      }, 1000)
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen, title])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-[95vw]'
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby={description ? "modal-description" : undefined}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <FocusTrap isActive={isOpen}>
        <div
          ref={modalRef}
          className={cn(
            'relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-700',
            sizeClasses[size],
            className
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
            <div>
              <h2 id="modal-title" className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {title}
              </h2>
              {description && (
                <p id="modal-description" className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Close dialog"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="overflow-auto max-h-[calc(90vh-120px)]">
            {children}
          </div>
        </div>
      </FocusTrap>
    </div>
  )
}

// Accessible Form Field
interface AccessibleFieldProps {
  label: string
  children: React.ReactNode
  error?: string
  hint?: string
  required?: boolean
  className?: string
  id?: string
}

export function AccessibleField({
  label,
  children,
  error,
  hint,
  required = false,
  className,
  id
}: AccessibleFieldProps) {
  const fieldId = id || `field-${Math.random().toString(36).substr(2, 9)}`
  const hintId = hint ? `${fieldId}-hint` : undefined
  const errorId = error ? `${fieldId}-error` : undefined

  return (
    <div className={cn('space-y-2', className)}>
      <label
        htmlFor={fieldId}
        className="block text-sm font-medium text-slate-700 dark:text-slate-300"
      >
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="required">
            *
          </span>
        )}
      </label>

      {hint && (
        <p id={hintId} className="text-sm text-slate-500 dark:text-slate-400">
          {hint}
        </p>
      )}

      <div className="relative">
        {React.cloneElement(children as React.ReactElement, {
          id: fieldId,
          'aria-describedby': [hintId, errorId].filter(Boolean).join(' '),
          'aria-invalid': error ? 'true' : undefined,
          'aria-required': required,
          className: cn(
            (children as React.ReactElement).props.className,
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500'
          )
        })}
      </div>

      {error && (
        <p
          id={errorId}
          role="alert"
          className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1"
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}

// Live Region for Dynamic Content Updates
interface LiveRegionProps {
  children: React.ReactNode
  priority?: 'polite' | 'assertive' | 'off'
  atomic?: boolean
  className?: string
}

export function LiveRegion({
  children,
  priority = 'polite',
  atomic = false,
  className
}: LiveRegionProps) {
  return (
    <div
      aria-live={priority}
      aria-atomic={atomic}
      className={cn('sr-only', className)}
    >
      {children}
    </div>
  )
}

// Accessible Table with proper headers and navigation
interface AccessibleTableProps {
  caption?: string
  headers: Array<{
    key: string
    label: string
    scope?: 'col' | 'row'
    sortable?: boolean
    onSort?: () => void
    sortDirection?: 'asc' | 'desc' | null
  }>
  rows: Array<Record<string, React.ReactNode>>
  className?: string
  rowClassName?: (row: Record<string, React.ReactNode>, index: number) => string
}

export function AccessibleTable({
  caption,
  headers,
  rows,
  className,
  rowClassName
}: AccessibleTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className={cn('w-full border-collapse', className)} role="table">
        {caption && (
          <caption className="text-left text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            {caption}
          </caption>
        )}
        
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700">
            {headers.map((header) => (
              <th
                key={header.key}
                scope={header.scope || 'col'}
                className={cn(
                  'px-4 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100',
                  header.sortable && 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800'
                )}
                onClick={header.sortable ? header.onSort : undefined}
                aria-sort={
                  header.sortable 
                    ? header.sortDirection === 'asc' 
                      ? 'ascending' 
                      : header.sortDirection === 'desc' 
                        ? 'descending' 
                        : 'none'
                    : undefined
                }
              >
                <div className="flex items-center gap-2">
                  {header.label}
                  {header.sortable && (
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={index}
              className={cn(
                'border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors',
                rowClassName?.(row, index)
              )}
            >
              {headers.map((header) => (
                <td
                  key={header.key}
                  className="px-4 py-3 text-sm text-slate-900 dark:text-slate-100"
                >
                  {row[header.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// High Contrast Mode Toggle
export function HighContrastToggle() {
  const [isHighContrast, setIsHighContrast] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('high-contrast')
    }
    return false
  })

  const toggleHighContrast = () => {
    const newValue = !isHighContrast
    setIsHighContrast(newValue)
    
    if (newValue) {
      document.documentElement.classList.add('high-contrast')
      localStorage.setItem('high-contrast', 'true')
    } else {
      document.documentElement.classList.remove('high-contrast')
      localStorage.setItem('high-contrast', 'false')
    }
  }

  React.useEffect(() => {
    const stored = localStorage.getItem('high-contrast')
    if (stored === 'true') {
      document.documentElement.classList.add('high-contrast')
      setIsHighContrast(true)
    }
  }, [])

  return (
    <button
      onClick={toggleHighContrast}
      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      aria-pressed={isHighContrast}
      aria-label={`${isHighContrast ? 'Disable' : 'Enable'} high contrast mode`}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
      High Contrast
    </button>
  )
}