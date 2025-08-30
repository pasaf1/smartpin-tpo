'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface MobileFABProps {
  tools: Array<{
    id: string
    name: string
    icon: React.ReactNode
    color?: string
    disabled?: boolean
  }>
  selectedTool: string
  onToolSelect: (toolId: string) => void
  className?: string
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center'
}

export function MobileFAB({
  tools,
  selectedTool,
  onToolSelect,
  className,
  position = 'bottom-right'
}: MobileFABProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  // Auto-hide FAB on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const isScrollingDown = currentScrollY > lastScrollY
      const hasScrolledEnough = Math.abs(currentScrollY - lastScrollY) > 10

      if (hasScrolledEnough) {
        setIsVisible(!isScrollingDown || currentScrollY < 100)
        setLastScrollY(currentScrollY)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  // Close expanded menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element
      if (isExpanded && !target.closest('.mobile-fab')) {
        setIsExpanded(false)
      }
    }

    if (isExpanded) {
      document.addEventListener('click', handleClickOutside, { capture: true })
      return () => document.removeEventListener('click', handleClickOutside, { capture: true })
    }
  }, [isExpanded])

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-left':
        return 'bottom-6 left-6'
      case 'bottom-center':
        return 'bottom-6 left-1/2 transform -translate-x-1/2'
      case 'bottom-right':
      default:
        return 'bottom-6 right-6'
    }
  }

  const getExpandDirection = () => {
    switch (position) {
      case 'bottom-left':
        return 'flex-col-reverse items-start'
      case 'bottom-center':
        return 'flex-col-reverse items-center'
      case 'bottom-right':
      default:
        return 'flex-col-reverse items-end'
    }
  }

  const selectedToolData = tools.find(tool => tool.id === selectedTool)

  return (
    <div 
      className={cn(
        'mobile-fab fixed z-50 transition-all duration-300',
        getPositionClasses(),
        !isVisible && 'translate-y-20 opacity-0',
        className
      )}
    >
      <div className={cn('flex gap-4', getExpandDirection())}>
        {/* Tool options (shown when expanded) */}
        {isExpanded && tools.map((tool, index) => (
          <button
            key={tool.id}
            onClick={() => {
              onToolSelect(tool.id)
              setIsExpanded(false)
            }}
            disabled={tool.disabled}
            className={cn(
              'w-14 h-14 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center text-white font-bold',
              'transform scale-0 animate-in',
              tool.id === selectedTool ? 'ring-4 ring-white ring-opacity-50' : '',
              tool.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110 active:scale-95',
              tool.color || 'bg-blue-600'
            )}
            style={{
              backgroundColor: tool.color,
              animationDelay: `${index * 50}ms`,
              animationFillMode: 'forwards'
            }}
          >
            {tool.icon}
          </button>
        ))}

        {/* Main FAB button */}
        <div className="relative">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              'w-16 h-16 rounded-full shadow-xl transition-all duration-300 flex items-center justify-center text-white',
              'hover:scale-110 active:scale-95 transform',
              isExpanded ? 'rotate-45 bg-red-600' : 'bg-blue-600',
              selectedToolData?.color && !isExpanded && `bg-[${selectedToolData.color}]`
            )}
            style={{
              backgroundColor: !isExpanded && selectedToolData?.color ? selectedToolData.color : undefined
            }}
          >
            {isExpanded ? (
              // Close icon (X)
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            ) : (
              selectedToolData?.icon || (
                // Default tools icon
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              )
            )}
          </button>

          {/* Tool name indicator */}
          {selectedToolData && !isExpanded && (
            <div className={cn(
              'absolute -top-12 whitespace-nowrap bg-black text-white px-3 py-1 rounded-full text-sm font-medium transition-opacity duration-200',
              position === 'bottom-center' ? 'left-1/2 transform -translate-x-1/2' :
              position === 'bottom-left' ? 'left-0' : 'right-0'
            )}>
              {selectedToolData.name}
              <div className={cn(
                'absolute top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black',
                position === 'bottom-center' ? 'left-1/2 transform -translate-x-1/2' :
                position === 'bottom-left' ? 'left-4' : 'right-4'
              )} />
            </div>
          )}

          {/* Pulse animation for active tool */}
          {!isExpanded && (
            <div 
              className={cn(
                'absolute inset-0 rounded-full animate-pulse opacity-20',
                selectedToolData?.color || 'bg-blue-600'
              )}
              style={{
                backgroundColor: selectedToolData?.color
              }}
            />
          )}
        </div>
      </div>

      {/* Backdrop for expanded state */}
      {isExpanded && (
        <div className="fixed inset-0 bg-black bg-opacity-20 -z-10" />
      )}
    </div>
  )
}

// Predefined tool configurations
export const defaultBluebinTools = [
  {
    id: 'pin',
    name: 'Add Pin',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      </svg>
    ),
    color: '#dc2626'
  },
  {
    id: 'childPin',
    name: 'Add Child Issue',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
    ),
    color: '#f97316'
  },
  {
    id: 'annotation',
    name: 'Draw',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    ),
    color: '#3b82f6'
  },
  {
    id: 'text',
    name: 'Add Text',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    color: '#10b981'
  },
  {
    id: 'measure',
    name: 'Measure',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    color: '#8b5cf6'
  }
]