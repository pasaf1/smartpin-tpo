'use client'

import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Monitor, Smartphone, Tablet, Laptop, MonitorSpeaker } from 'lucide-react'

interface Breakpoint {
  name: string
  min: number
  max?: number
  icon: React.ReactNode
  color: string
}

interface ResponsiveDebuggerProps {
  enabled?: boolean
  showBreakpoints?: boolean
  showViewportInfo?: boolean
  className?: string
}

const BREAKPOINTS: Breakpoint[] = [
  {
    name: 'Mobile',
    min: 0,
    max: 767,
    icon: <Smartphone className="w-4 h-4" />,
    color: 'from-red-500 to-red-600'
  },
  {
    name: 'Tablet',
    min: 768,
    max: 1023,
    icon: <Tablet className="w-4 h-4" />,
    color: 'from-orange-500 to-orange-600'
  },
  {
    name: 'Desktop',
    min: 1024,
    max: 1279,
    icon: <Laptop className="w-4 h-4" />,
    color: 'from-green-500 to-green-600'
  },
  {
    name: 'Large',
    min: 1280,
    max: 1535,
    icon: <Monitor className="w-4 h-4" />,
    color: 'from-blue-500 to-blue-600'
  },
  {
    name: 'XL',
    min: 1536,
    icon: <MonitorSpeaker className="w-4 h-4" />,
    color: 'from-purple-500 to-purple-600'
  }
]

const COMMON_VIEWPORT_SIZES = [
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPhone 12', width: 390, height: 844 },
  { name: 'iPad', width: 768, height: 1024 },
  { name: 'iPad Pro', width: 1024, height: 1366 },
  { name: 'Desktop HD', width: 1920, height: 1080 },
  { name: 'Desktop 4K', width: 2560, height: 1440 }
]

export function ResponsiveDebugger({
  enabled = false,
  showBreakpoints = true,
  showViewportInfo = true,
  className
}: ResponsiveDebuggerProps) {
  const [viewportWidth, setViewportWidth] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(0)
  const [currentBreakpoint, setCurrentBreakpoint] = useState<Breakpoint | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  // Update viewport dimensions
  useEffect(() => {
    const updateViewport = () => {
      setViewportWidth(window.innerWidth)
      setViewportHeight(window.innerHeight)
    }

    updateViewport()
    window.addEventListener('resize', updateViewport)
    return () => window.removeEventListener('resize', updateViewport)
  }, [])

  // Determine current breakpoint
  useEffect(() => {
    const current = BREAKPOINTS.find(bp => {
      if (bp.max) {
        return viewportWidth >= bp.min && viewportWidth <= bp.max
      }
      return viewportWidth >= bp.min
    })
    setCurrentBreakpoint(current || null)
  }, [viewportWidth])

  // Only render in development
  if (process.env.NODE_ENV !== 'development' || !enabled) {
    return null
  }

  const getBreakpointStatus = (breakpoint: Breakpoint) => {
    if (breakpoint.max) {
      return viewportWidth >= breakpoint.min && viewportWidth <= breakpoint.max
    }
    return viewportWidth >= breakpoint.min
  }

  const simulateViewport = (width: number, height: number) => {
    // This would require browser dev tools integration
    console.log(`Simulating viewport: ${width}x${height}`)
    // For now, just log the action
  }

  return (
    <>
      {/* Floating Breakpoint Indicator */}
      {showBreakpoints && currentBreakpoint && (
        <div 
          className={cn(
            "fixed top-4 left-1/2 transform -translate-x-1/2 z-50",
            "px-4 py-2 rounded-full shadow-lg backdrop-blur-md",
            "bg-gradient-to-r text-white font-medium text-sm",
            "flex items-center gap-2 cursor-pointer",
            "hover:scale-105 transition-transform duration-200",
            currentBreakpoint.color,
            className
          )}
          onClick={() => setIsOpen(!isOpen)}
        >
          {currentBreakpoint.icon}
          <span>{currentBreakpoint.name}</span>
          <span className="opacity-75">
            {viewportWidth}x{viewportHeight}
          </span>
        </div>
      )}

      {/* Viewport Info Panel */}
      {showViewportInfo && (
        <div className="fixed bottom-4 right-4 z-50 bg-black/80 text-white text-xs font-mono p-3 rounded-lg backdrop-blur-md">
          <div className="space-y-1">
            <div>Viewport: {viewportWidth}x{viewportHeight}</div>
            <div>Device Pixel Ratio: {window.devicePixelRatio}</div>
            <div>Orientation: {viewportWidth > viewportHeight ? 'Landscape' : 'Portrait'}</div>
          </div>
        </div>
      )}

      {/* Responsive Debug Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
          <div 
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-900 rounded-xl shadow-2xl p-6 w-96 max-w-[90vw] max-h-[80vh] overflow-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Responsive Debugger</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Current Status */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-300 mb-3">Current Status</h4>
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  {currentBreakpoint?.icon}
                  <span className="text-white font-medium">{currentBreakpoint?.name} Breakpoint</span>
                </div>
                <div className="text-sm text-gray-400 space-y-1">
                  <div>Viewport: {viewportWidth}×{viewportHeight}px</div>
                  <div>Range: {currentBreakpoint?.min}px - {currentBreakpoint?.max || '∞'}px</div>
                  <div>DPR: {window.devicePixelRatio}</div>
                </div>
              </div>
            </div>

            {/* Breakpoint Overview */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-300 mb-3">Breakpoints</h4>
              <div className="space-y-2">
                {BREAKPOINTS.map((bp) => {
                  const isActive = getBreakpointStatus(bp)
                  return (
                    <div 
                      key={bp.name}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border transition-colors",
                        isActive 
                          ? "bg-gray-700 border-gray-600 text-white" 
                          : "bg-gray-800 border-gray-700 text-gray-400"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {bp.icon}
                        <span className="font-medium">{bp.name}</span>
                      </div>
                      <div className="text-sm">
                        {bp.min}px{bp.max ? ` - ${bp.max}px` : '+'}
                      </div>
                      {isActive && (
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Viewport Simulator */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-300 mb-3">Quick Viewport Tests</h4>
              <div className="grid grid-cols-2 gap-2">
                {COMMON_VIEWPORT_SIZES.map((size) => (
                  <button
                    key={size.name}
                    onClick={() => simulateViewport(size.width, size.height)}
                    className="flex flex-col items-center p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-sm"
                  >
                    <span className="text-white font-medium">{size.name}</span>
                    <span className="text-gray-400">{size.width}×{size.height}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* CSS Media Queries Preview */}
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-3">Tailwind Classes</h4>
              <div className="bg-gray-800 rounded-lg p-3">
                <div className="font-mono text-xs space-y-1">
                  <div className="text-gray-400">/* Current applicable classes */</div>
                  {BREAKPOINTS.map((bp) => {
                    const isActive = getBreakpointStatus(bp)
                    const prefix = bp.name.toLowerCase() === 'mobile' ? '' : 
                                  bp.name.toLowerCase() === 'tablet' ? 'md:' :
                                  bp.name.toLowerCase() === 'desktop' ? 'lg:' :
                                  bp.name.toLowerCase() === 'large' ? 'xl:' : '2xl:'
                    
                    return (
                      <div 
                        key={bp.name}
                        className={cn(
                          "flex items-center justify-between",
                          isActive ? "text-green-400" : "text-gray-500"
                        )}
                      >
                        <span>{prefix || 'base'}</span>
                        <span>{isActive ? '✓' : '○'}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Debug Actions */}
            <div className="mt-6 pt-4 border-t border-gray-700">
              <div className="flex gap-2">
                <button 
                  onClick={() => console.log('Viewport info:', { viewportWidth, viewportHeight, currentBreakpoint })}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  Log Info
                </button>
                <button 
                  onClick={() => {
                    const mediaQueries = BREAKPOINTS.map(bp => 
                      `@media (min-width: ${bp.min}px) { /* ${bp.name} */ }`
                    ).join('\n')
                    navigator.clipboard?.writeText(mediaQueries)
                  }}
                  className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                >
                  Copy MQ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Breakpoint Guidelines Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-30 pointer-events-none">
          {BREAKPOINTS.map((bp) => (
            <div
              key={bp.name}
              className="absolute top-0 h-full w-0.5 bg-gradient-to-b opacity-20"
              style={{ 
                left: `${(bp.min / viewportWidth) * 100}%`,
                background: `linear-gradient(to bottom, ${bp.color.replace('from-', '').replace(' to-', ', ')})` 
              }}
            />
          ))}
        </div>
      )}
    </>
  )
}