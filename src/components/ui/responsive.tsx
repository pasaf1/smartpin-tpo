import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Menu, X, ChevronDown, ChevronRight } from 'lucide-react'

// Comprehensive Responsive Layout System
// Mobile-first design with breakpoint utilities and responsive components

// Hook for responsive breakpoints
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'>('xs')

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth
      if (width >= 1536) setBreakpoint('2xl')
      else if (width >= 1280) setBreakpoint('xl')
      else if (width >= 1024) setBreakpoint('lg')
      else if (width >= 768) setBreakpoint('md')
      else if (width >= 640) setBreakpoint('sm')
      else setBreakpoint('xs')
    }

    updateBreakpoint()
    window.addEventListener('resize', updateBreakpoint)
    return () => window.removeEventListener('resize', updateBreakpoint)
  }, [])

  const isMobile = breakpoint === 'xs' || breakpoint === 'sm'
  const isTablet = breakpoint === 'md'
  const isDesktop = breakpoint === 'lg' || breakpoint === 'xl' || breakpoint === '2xl'

  return { breakpoint, isMobile, isTablet, isDesktop }
}

// Responsive Container with proper mobile handling
interface ResponsiveContainerProps {
  children: React.ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  padding?: {
    mobile?: string
    tablet?: string
    desktop?: string
  }
}

export function ResponsiveContainer({
  children,
  className,
  maxWidth = 'lg',
  padding = {
    mobile: 'px-4 py-4',
    tablet: 'px-6 py-6',
    desktop: 'px-8 py-8'
  }
}: ResponsiveContainerProps) {
  const { isMobile, isTablet, isDesktop } = useBreakpoint()

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-4xl',
    lg: 'max-w-7xl',
    xl: 'max-w-screen-xl',
    '2xl': 'max-w-screen-2xl',
    full: 'max-w-none'
  }

  const getPadding = () => {
    if (isMobile) return padding.mobile
    if (isTablet) return padding.tablet
    return padding.desktop
  }

  return (
    <div className={cn(
      'w-full mx-auto',
      maxWidthClasses[maxWidth],
      getPadding(),
      className
    )}>
      {children}
    </div>
  )
}

// Mobile-First Navigation
interface MobileNavigationProps {
  children: React.ReactNode
  className?: string
  title?: string
  logo?: React.ReactNode
}

export function MobileNavigation({
  children,
  className,
  title,
  logo
}: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { isMobile } = useBreakpoint()

  // Close menu when switching to desktop
  useEffect(() => {
    if (!isMobile) {
      setIsOpen(false)
    }
  }, [isMobile])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isMobile) {
    // Desktop navigation
    return (
      <nav className={cn('flex items-center justify-between', className)}>
        <div className="flex items-center gap-4">
          {logo}
          {title && (
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {title}
            </h1>
          )}
        </div>
        <div className="flex items-center gap-4">
          {children}
        </div>
      </nav>
    )
  }

  // Mobile navigation with hamburger menu
  return (
    <>
      <nav className={cn('flex items-center justify-between', className)}>
        <div className="flex items-center gap-3">
          {logo}
          {title && (
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {title}
            </h1>
          )}
        </div>
        
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg"
          aria-label="Toggle navigation menu"
          aria-expanded={isOpen}
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-white dark:bg-slate-900">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                {logo}
                {title && (
                  <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {title}
                  </h1>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg"
                aria-label="Close navigation menu"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Menu Items */}
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {children}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Responsive Grid with mobile-first approach
interface ResponsiveGridProps {
  children: React.ReactNode
  className?: string
  columns?: {
    mobile: number
    tablet?: number
    desktop?: number
  }
  gap?: {
    mobile?: string
    tablet?: string
    desktop?: string
  }
}

export function ResponsiveGrid({
  children,
  className,
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  gap = { mobile: 'gap-4', tablet: 'gap-6', desktop: 'gap-8' }
}: ResponsiveGridProps) {
  const { isMobile, isTablet } = useBreakpoint()

  const getGridColumns = () => {
    if (isMobile) return `grid-cols-${columns.mobile}`
    if (isTablet && columns.tablet) return `grid-cols-${columns.tablet}`
    return `grid-cols-${columns.desktop || columns.tablet || columns.mobile}`
  }

  const getGap = () => {
    if (isMobile) return gap.mobile || 'gap-4'
    if (isTablet && gap.tablet) return gap.tablet
    return gap.desktop || gap.tablet || gap.mobile || 'gap-8'
  }

  return (
    <div className={cn('grid', getGridColumns(), getGap(), className)}>
      {children}
    </div>
  )
}

// Mobile-First Modal
interface ResponsiveModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  className?: string
  showCloseButton?: boolean
}

export function ResponsiveModal({
  isOpen,
  onClose,
  title,
  children,
  className,
  showCloseButton = true
}: ResponsiveModalProps) {
  const { isMobile } = useBreakpoint()

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  if (isMobile) {
    // Full-screen mobile modal
    return (
      <div className="fixed inset-0 z-50 bg-white dark:bg-slate-900">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {title}
            </h2>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          
          {/* Content */}
          <div className={cn('flex-1 overflow-auto p-4', className)}>
            {children}
          </div>
        </div>
      </div>
    )
  }

  // Desktop modal with backdrop
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={cn(
        'bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-700',
        className
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {title}
          </h2>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        
        {/* Content */}
        <div className="overflow-auto max-h-[calc(90vh-80px)] p-6">
          {children}
        </div>
      </div>
    </div>
  )
}

// Collapsible Section for Mobile
interface CollapsibleSectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  className?: string
  forceCollapse?: boolean // Force collapse on mobile
}

export function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
  className,
  forceCollapse = false
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const { isMobile } = useBreakpoint()

  // Force collapse on mobile if specified
  const shouldCollapse = forceCollapse ? isMobile : true

  if (!shouldCollapse) {
    return (
      <div className={className}>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          {title}
        </h3>
        {children}
      </div>
    )
  }

  return (
    <div className={className}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full p-4 text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
        aria-expanded={isOpen}
      >
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h3>
        {isOpen ? (
          <ChevronDown className="w-5 h-5 text-slate-500 dark:text-slate-400" />
        ) : (
          <ChevronRight className="w-5 h-5 text-slate-500 dark:text-slate-400" />
        )}
      </button>
      
      {isOpen && (
        <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
          {children}
        </div>
      )}
    </div>
  )
}

// Responsive Table with horizontal scroll and mobile cards
interface ResponsiveTableProps<T = Record<string, any>> {
  data: T[]
  columns: Array<{
    key: keyof T
    label: string
    render?: (value: any, row: T) => React.ReactNode
  }>
  mobileCardRender?: (row: T, index: number) => React.ReactNode
  className?: string
  emptyState?: React.ReactNode
}

export function ResponsiveTable<T extends Record<string, any>>({
  data,
  columns,
  mobileCardRender,
  className,
  emptyState
}: ResponsiveTableProps<T>) {
  const { isMobile } = useBreakpoint()

  if (data.length === 0 && emptyState) {
    return <div className={className}>{emptyState}</div>
  }

  if (isMobile && mobileCardRender) {
    // Mobile card layout
    return (
      <div className={cn('space-y-4', className)}>
        {data.map((row, index) => mobileCardRender(row, index))}
      </div>
    )
  }

  // Desktop/tablet table layout with horizontal scroll
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full border-collapse min-w-[600px]">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700">
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className="px-4 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr
              key={index}
              className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              {columns.map((column) => (
                <td
                  key={String(column.key)}
                  className="px-4 py-3 text-sm text-slate-900 dark:text-slate-100"
                >
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Touch-Friendly Button for Mobile
interface TouchButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}

export function TouchButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  className,
  disabled = false,
  type = 'button'
}: TouchButtonProps) {
  const { isMobile } = useBreakpoint()

  // Larger touch targets for mobile
  const sizeClasses = {
    sm: isMobile ? 'px-4 py-3 text-sm min-h-[44px]' : 'px-3 py-2 text-sm',
    md: isMobile ? 'px-6 py-4 text-base min-h-[48px]' : 'px-4 py-2 text-base',
    lg: isMobile ? 'px-8 py-5 text-lg min-h-[52px]' : 'px-6 py-3 text-lg'
  }

  const variantClasses = {
    primary: 'bg-gradient-to-r from-indigo-600 to-blue-700 hover:from-indigo-700 hover:to-blue-800 text-white shadow-lg focus:ring-indigo-500',
    secondary: 'bg-slate-200 hover:bg-slate-300 text-slate-900 focus:ring-slate-500 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-100',
    outline: 'border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white focus:ring-indigo-500 dark:border-indigo-400 dark:text-indigo-400',
    ghost: 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 focus:ring-slate-500'
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'active:scale-95', // Touch feedback
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      {children}
    </button>
  )
}