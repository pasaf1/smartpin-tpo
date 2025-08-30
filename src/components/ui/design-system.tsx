import React from 'react'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

// Comprehensive Design System Components
// Provides consistent UI patterns across the entire application

// Standardized Card System
interface SmartCardProps {
  children: React.ReactNode
  variant?: 'elevated' | 'flat' | 'bordered' | 'glass'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  clickable?: boolean
  hover?: boolean
  onClick?: () => void
  role?: string
  tabIndex?: number
}

export function SmartCard({
  children,
  variant = 'elevated',
  size = 'md',
  className,
  clickable = false,
  hover = true,
  onClick,
  role,
  tabIndex
}: SmartCardProps) {
  const baseClasses = 'rounded-xl transition-all duration-300'
  
  const variantClasses = {
    elevated: 'bg-white dark:bg-slate-900 shadow-xl shadow-slate-500/10 border border-slate-200/50 dark:border-slate-700/50',
    flat: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700',
    bordered: 'bg-transparent border-2 border-slate-300 dark:border-slate-600',
    glass: 'bg-white/10 backdrop-blur-sm border border-white/20 dark:border-slate-700/50'
  }

  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10'
  }

  const interactiveClasses = clickable 
    ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2' 
    : ''

  const hoverClasses = hover && clickable
    ? 'hover:scale-105 hover:shadow-2xl hover:shadow-slate-500/20'
    : hover
    ? 'hover:shadow-2xl hover:shadow-slate-500/20'
    : ''

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        interactiveClasses,
        hoverClasses,
        className
      )}
      onClick={onClick}
      role={clickable ? role || 'button' : role}
      tabIndex={clickable ? tabIndex || 0 : tabIndex}
      onKeyDown={clickable ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.()
        }
      } : undefined}
    >
      {children}
    </div>
  )
}

// Standardized Gradient System
interface GradientBoxProps {
  children: React.ReactNode
  gradient?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'luxury'
  direction?: 'to-r' | 'to-l' | 'to-t' | 'to-b' | 'to-br' | 'to-bl' | 'to-tr' | 'to-tl'
  className?: string
  opacity?: number
}

export function GradientBox({
  children,
  gradient = 'primary',
  direction = 'to-br',
  className,
  opacity = 100
}: GradientBoxProps) {
  const gradientClasses = {
    primary: `bg-gradient-${direction} from-indigo-600 to-blue-700`,
    success: `bg-gradient-${direction} from-emerald-600 to-green-700`,
    warning: `bg-gradient-${direction} from-amber-500 to-orange-600`,
    error: `bg-gradient-${direction} from-red-600 to-rose-700`,
    info: `bg-gradient-${direction} from-blue-500 to-cyan-600`,
    luxury: `bg-gradient-${direction} from-purple-600 to-indigo-700`
  }

  return (
    <div 
      className={cn(gradientClasses[gradient], className)}
      style={{ opacity: opacity / 100 }}
    >
      {children}
    </div>
  )
}

// Standardized Icon Container
interface IconContainerProps {
  icon: LucideIcon
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'rounded' | 'circle' | 'square'
  background?: 'primary' | 'success' | 'warning' | 'error' | 'neutral' | 'glass'
  className?: string
}

export function IconContainer({
  icon: Icon,
  size = 'md',
  variant = 'rounded',
  background = 'primary',
  className
}: IconContainerProps) {
  const sizeClasses = {
    xs: 'w-8 h-8',
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  }

  const iconSizeClasses = {
    xs: 'w-4 h-4',
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-10 h-10'
  }

  const variantClasses = {
    rounded: 'rounded-xl',
    circle: 'rounded-full',
    square: 'rounded-none'
  }

  const backgroundClasses = {
    primary: 'bg-gradient-to-br from-indigo-600 to-blue-700 text-white shadow-lg shadow-indigo-500/30',
    success: 'bg-gradient-to-br from-emerald-600 to-green-700 text-white shadow-lg shadow-emerald-500/30',
    warning: 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30',
    error: 'bg-gradient-to-br from-red-600 to-rose-700 text-white shadow-lg shadow-red-500/30',
    neutral: 'bg-gradient-to-br from-slate-600 to-gray-700 text-white shadow-lg shadow-slate-500/30',
    glass: 'bg-white/20 backdrop-blur-sm border border-white/30 text-white shadow-lg'
  }

  return (
    <div className={cn(
      'flex items-center justify-center transition-transform duration-300 hover:scale-105',
      sizeClasses[size],
      variantClasses[variant],
      backgroundClasses[background],
      className
    )}>
      <Icon className={iconSizeClasses[size]} />
    </div>
  )
}

// Standardized Status Badge System
interface StatusBadgeProps {
  status: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary'
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  variant?: 'solid' | 'outline' | 'soft'
  className?: string
  icon?: LucideIcon
}

export function StatusBadge({
  status,
  children,
  size = 'md',
  variant = 'soft',
  className,
  icon: Icon
}: StatusBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  }

  const baseClasses = 'inline-flex items-center gap-1.5 font-semibold rounded-full'

  const variantStatusClasses = {
    solid: {
      success: 'bg-emerald-600 text-white',
      warning: 'bg-amber-600 text-white',
      error: 'bg-red-600 text-white',
      info: 'bg-blue-600 text-white',
      neutral: 'bg-slate-600 text-white',
      primary: 'bg-indigo-600 text-white'
    },
    outline: {
      success: 'border-2 border-emerald-600 text-emerald-600 bg-transparent',
      warning: 'border-2 border-amber-600 text-amber-600 bg-transparent',
      error: 'border-2 border-red-600 text-red-600 bg-transparent',
      info: 'border-2 border-blue-600 text-blue-600 bg-transparent',
      neutral: 'border-2 border-slate-600 text-slate-600 bg-transparent',
      primary: 'border-2 border-indigo-600 text-indigo-600 bg-transparent'
    },
    soft: {
      success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400',
      warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400',
      error: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      neutral: 'bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-400',
      primary: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400'
    }
  }

  return (
    <span className={cn(
      baseClasses,
      sizeClasses[size],
      variantStatusClasses[variant][status],
      className
    )}>
      {Icon && <Icon className="w-3 h-3" />}
      {children}
    </span>
  )
}

// Standardized KPI Card System
interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info'
  onClick?: () => void
  isActive?: boolean
  className?: string
}

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'primary',
  onClick,
  isActive = false,
  className
}: KPICardProps) {
  const colorClasses = {
    primary: {
      bg: 'bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/30',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-800 dark:text-blue-200',
      value: 'text-blue-900 dark:text-blue-100',
      icon: 'bg-blue-500 text-white shadow-blue-500/30'
    },
    success: {
      bg: 'bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-900/30',
      border: 'border-emerald-200 dark:border-emerald-800',
      text: 'text-emerald-800 dark:text-emerald-200',
      value: 'text-emerald-900 dark:text-emerald-100',
      icon: 'bg-emerald-500 text-white shadow-emerald-500/30'
    },
    warning: {
      bg: 'bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/30',
      border: 'border-amber-200 dark:border-amber-800',
      text: 'text-amber-800 dark:text-amber-200',
      value: 'text-amber-900 dark:text-amber-100',
      icon: 'bg-amber-500 text-white shadow-amber-500/30'
    },
    error: {
      bg: 'bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-900/20 dark:to-rose-900/30',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-800 dark:text-red-200',
      value: 'text-red-900 dark:text-red-100',
      icon: 'bg-red-500 text-white shadow-red-500/30'
    },
    info: {
      bg: 'bg-gradient-to-br from-cyan-50 to-blue-100 dark:from-cyan-900/20 dark:to-blue-900/30',
      border: 'border-cyan-200 dark:border-cyan-800',
      text: 'text-cyan-800 dark:text-cyan-200',
      value: 'text-cyan-900 dark:text-cyan-100',
      icon: 'bg-cyan-500 text-white shadow-cyan-500/30'
    }
  }

  const colors = colorClasses[color]

  return (
    <div
      className={cn(
        'p-6 rounded-xl border shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:scale-[1.02]',
        colors.bg,
        isActive ? `${colors.border} shadow-${color}-200` : 'border-opacity-50',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      } : undefined}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className={cn('text-3xl font-bold mb-1', colors.value)}>
            {value}
          </div>
          <div className={cn('text-sm font-semibold mb-1', colors.text)}>
            {title}
          </div>
          {subtitle && (
            <div className={cn('text-xs opacity-75', colors.text)}>
              {subtitle}
            </div>
          )}
          {isActive && (
            <div className={cn('text-xs font-medium mt-1', colors.text)}>
              ● Active Filter
            </div>
          )}
          {trend && (
            <div className="flex items-center mt-2 text-xs">
              <span className={trend.isPositive ? 'text-emerald-600' : 'text-red-600'}>
                {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center shadow-lg',
            colors.icon
          )}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  )
}

// Responsive Grid System
interface ResponsiveGridProps {
  children: React.ReactNode
  columns?: {
    xs?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
  gap?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function ResponsiveGrid({
  children,
  columns = { xs: 1, sm: 2, md: 3, lg: 4, xl: 4 },
  gap = 'md',
  className
}: ResponsiveGridProps) {
  const gapClasses = {
    sm: 'gap-3',
    md: 'gap-6',
    lg: 'gap-8',
    xl: 'gap-12'
  }

  const columnClasses = [
    columns.xs && `grid-cols-${columns.xs}`,
    columns.sm && `sm:grid-cols-${columns.sm}`,
    columns.md && `md:grid-cols-${columns.md}`,
    columns.lg && `lg:grid-cols-${columns.lg}`,
    columns.xl && `xl:grid-cols-${columns.xl}`,
  ].filter(Boolean).join(' ')

  return (
    <div className={cn('grid', columnClasses, gapClasses[gap], className)}>
      {children}
    </div>
  )
}

// Mobile-First Container System
interface SmartContainerProps {
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function SmartContainer({
  children,
  size = 'lg',
  padding = 'md',
  className
}: SmartContainerProps) {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-4xl',
    lg: 'max-w-7xl',
    xl: 'max-w-screen-2xl',
    full: 'max-w-none'
  }

  const paddingClasses = {
    none: '',
    sm: 'px-4 py-2',
    md: 'px-6 py-4',
    lg: 'px-8 py-6',
    xl: 'px-12 py-8'
  }

  return (
    <div className={cn(
      'mx-auto w-full',
      sizeClasses[size],
      paddingClasses[padding],
      className
    )}>
      {children}
    </div>
  )
}