'use client'

import React, { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Eye, EyeOff, Grid, Layers, Ruler, Zap, Target, Palette, Monitor } from 'lucide-react'

interface StyleDebuggerProps {
  enabled?: boolean
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  className?: string
}

interface DebugFeature {
  id: string
  name: string
  icon: React.ReactNode
  enabled: boolean
  description: string
  toggle: () => void
}

interface ElementInfo {
  tagName: string
  className: string
  computedStyles: Record<string, string>
  boundingRect: DOMRect | null
  cssRules: string[]
  tailwindClasses: string[]
  conflicts: string[]
}

export function StyleDebugger({ 
  enabled = false, 
  position = 'top-right',
  className 
}: StyleDebuggerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedElement, setSelectedElement] = useState<ElementInfo | null>(null)
  const [inspectMode, setInspectMode] = useState(false)
  const [features, setFeatures] = useState<DebugFeature[]>([])
  const overlayRef = useRef<HTMLDivElement>(null)

  // Initialize debug features
  useEffect(() => {
    setFeatures([
      {
        id: 'grid-overlay',
        name: 'CSS Grid',
        icon: <Grid className="w-4 h-4" />,
        enabled: false,
        description: 'Show CSS Grid visualization',
        toggle: () => toggleFeature('grid-overlay')
      },
      {
        id: 'box-model',
        name: 'Box Model',
        icon: <Target className="w-4 h-4" />,
        enabled: false,
        description: 'Highlight margin, padding, border',
        toggle: () => toggleFeature('box-model')
      },
      {
        id: 'typography',
        name: 'Typography',
        icon: <Palette className="w-4 h-4" />,
        enabled: false,
        description: 'Show font metrics and spacing',
        toggle: () => toggleFeature('typography')
      },
      {
        id: 'responsive',
        name: 'Breakpoints',
        icon: <Monitor className="w-4 h-4" />,
        enabled: false,
        description: 'Visualize responsive breakpoints',
        toggle: () => toggleFeature('responsive')
      },
      {
        id: 'performance',
        name: 'Performance',
        icon: <Zap className="w-4 h-4" />,
        enabled: false,
        description: 'Monitor style performance',
        toggle: () => toggleFeature('performance')
      }
    ])
  }, [])

  // Only render in development
  if (process.env.NODE_ENV !== 'development' || !enabled) {
    return null
  }

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  }

  const toggleFeature = (featureId: string) => {
    setFeatures(prev => prev.map(feature => 
      feature.id === featureId 
        ? { ...feature, enabled: !feature.enabled }
        : feature
    ))
    
    // Apply/remove debug styles
    applyDebugStyle(featureId, !features.find(f => f.id === featureId)?.enabled)
  }

  const applyDebugStyle = (featureId: string, enable: boolean) => {
    const existingStyle = document.querySelector(`#debug-style-${featureId}`)
    
    if (!enable && existingStyle) {
      existingStyle.remove()
      return
    }

    if (enable) {
      const style = document.createElement('style')
      style.id = `debug-style-${featureId}`
      
      switch (featureId) {
        case 'grid-overlay':
          style.textContent = `
            .debug-grid-overlay * {
              outline: 1px solid rgba(255, 0, 0, 0.1) !important;
              position: relative !important;
            }
            .debug-grid-overlay *::before {
              content: attr(class) !important;
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
              background: rgba(0, 0, 0, 0.8) !important;
              color: white !important;
              font-size: 10px !important;
              padding: 2px 4px !important;
              z-index: 9999 !important;
              pointer-events: none !important;
              max-width: 200px !important;
              overflow: hidden !important;
              white-space: nowrap !important;
              text-overflow: ellipsis !important;
            }
          `
          document.body.classList.add('debug-grid-overlay')
          break
          
        case 'box-model':
          style.textContent = `
            .debug-box-model * {
              box-shadow: 
                inset 0 0 0 1px rgba(255, 0, 0, 0.3),
                inset 0 0 0 2px rgba(255, 165, 0, 0.3),
                inset 0 0 0 3px rgba(255, 255, 0, 0.3),
                0 0 0 1px rgba(0, 255, 0, 0.3) !important;
            }
          `
          document.body.classList.add('debug-box-model')
          break
          
        case 'typography':
          style.textContent = `
            .debug-typography * {
              background: linear-gradient(
                to bottom,
                transparent 0%,
                transparent 45%,
                rgba(255, 0, 0, 0.1) 45%,
                rgba(255, 0, 0, 0.1) 55%,
                transparent 55%,
                transparent 100%
              ) !important;
            }
          `
          document.body.classList.add('debug-typography')
          break
          
        case 'responsive':
          style.textContent = `
            .debug-responsive::before {
              content: 'Mobile: < 768px' !important;
              position: fixed !important;
              top: 10px !important;
              right: 10px !important;
              background: rgba(255, 0, 0, 0.9) !important;
              color: white !important;
              padding: 8px 12px !important;
              border-radius: 4px !important;
              font-size: 12px !important;
              z-index: 10000 !important;
              pointer-events: none !important;
            }
            @media (min-width: 768px) {
              .debug-responsive::before {
                content: 'Tablet: 768px - 1024px' !important;
                background: rgba(255, 165, 0, 0.9) !important;
              }
            }
            @media (min-width: 1024px) {
              .debug-responsive::before {
                content: 'Desktop: 1024px - 1280px' !important;
                background: rgba(0, 128, 0, 0.9) !important;
              }
            }
            @media (min-width: 1280px) {
              .debug-responsive::before {
                content: 'Large Desktop: > 1280px' !important;
                background: rgba(0, 0, 255, 0.9) !important;
              }
            }
          `
          document.body.classList.add('debug-responsive')
          break
      }
      
      document.head.appendChild(style)
    }
  }

  const inspectElement = (event: MouseEvent) => {
    if (!inspectMode) return
    
    event.preventDefault()
    event.stopPropagation()
    
    const element = event.target as HTMLElement
    if (!element) return
    
    const computedStyles = window.getComputedStyle(element)
    const classes = Array.from(element.classList)
    
    // Extract Tailwind classes
    const tailwindClasses = classes.filter(cls => 
      cls.includes('-') || 
      ['flex', 'grid', 'block', 'inline', 'hidden'].includes(cls)
    )
    
    // Get important computed styles
    const importantStyles = {
      display: computedStyles.display,
      position: computedStyles.position,
      width: computedStyles.width,
      height: computedStyles.height,
      padding: computedStyles.padding,
      margin: computedStyles.margin,
      border: computedStyles.border,
      backgroundColor: computedStyles.backgroundColor,
      color: computedStyles.color,
      fontSize: computedStyles.fontSize,
      fontFamily: computedStyles.fontFamily,
      zIndex: computedStyles.zIndex,
      transform: computedStyles.transform,
      opacity: computedStyles.opacity
    }
    
    setSelectedElement({
      tagName: element.tagName.toLowerCase(),
      className: element.className,
      computedStyles: importantStyles,
      boundingRect: element.getBoundingClientRect(),
      cssRules: [],
      tailwindClasses,
      conflicts: []
    })
  }

  // Add event listeners for inspect mode
  useEffect(() => {
    if (inspectMode) {
      document.addEventListener('click', inspectElement, true)
      document.body.style.cursor = 'crosshair'
    } else {
      document.removeEventListener('click', inspectElement, true)
      document.body.style.cursor = ''
    }
    
    return () => {
      document.removeEventListener('click', inspectElement, true)
      document.body.style.cursor = ''
    }
  }, [inspectMode])

  // Cleanup debug styles on unmount
  useEffect(() => {
    return () => {
      features.forEach(feature => {
        if (feature.enabled) {
          const style = document.querySelector(`#debug-style-${feature.id}`)
          style?.remove()
          document.body.classList.remove(`debug-${feature.id}`)
        }
      })
    }
  }, [])

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed z-50 w-12 h-12 rounded-full shadow-lg border-2 border-white/20",
          "bg-gradient-to-br from-purple-600 to-blue-600 text-white",
          "hover:scale-110 transition-transform duration-200",
          "flex items-center justify-center",
          positionClasses[position],
          className
        )}
        title="Style Debugger"
      >
        <Eye className="w-5 h-5" />
      </button>

      {/* Debug Panel */}
      {isOpen && (
        <div
          className={cn(
            "fixed z-40 w-80 h-96 bg-gray-900/95 backdrop-blur-md",
            "border border-gray-700 rounded-xl shadow-2xl text-white",
            "flex flex-col overflow-hidden",
            position.includes('right') ? 'right-20' : 'left-20',
            position.includes('top') ? 'top-4' : 'bottom-4'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-400" />
              <h3 className="font-semibold">Style Debugger</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setInspectMode(!inspectMode)}
                className={cn(
                  "px-2 py-1 rounded text-xs font-medium transition-colors",
                  inspectMode 
                    ? "bg-purple-600 text-white" 
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                )}
              >
                {inspectMode ? 'Inspecting...' : 'Inspect'}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded hover:bg-gray-700 transition-colors"
              >
                <EyeOff className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-700">
            {['overview', 'element', 'conflicts'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "flex-1 px-3 py-2 text-sm font-medium capitalize transition-colors",
                  activeTab === tab
                    ? "text-purple-400 border-b-2 border-purple-400"
                    : "text-gray-400 hover:text-gray-300"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-auto p-4">
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">Debug Features</h4>
                  <div className="space-y-2">
                    {features.map(feature => (
                      <div key={feature.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {feature.icon}
                          <span className="text-sm">{feature.name}</span>
                        </div>
                        <button
                          onClick={feature.toggle}
                          className={cn(
                            "px-2 py-1 rounded text-xs font-medium transition-colors",
                            feature.enabled
                              ? "bg-green-600 text-white"
                              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          )}
                        >
                          {feature.enabled ? 'ON' : 'OFF'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">Quick Actions</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => console.log('All Tailwind classes:', document.querySelectorAll('[class*="-"]'))}
                      className="px-3 py-2 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                    >
                      Log Classes
                    </button>
                    <button 
                      onClick={() => console.log('Performance metrics:', performance.getEntriesByType('navigation'))}
                      className="px-3 py-2 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                    >
                      Perf Metrics
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'element' && (
              <div className="space-y-4">
                {selectedElement ? (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">
                      Selected Element: &lt;{selectedElement.tagName}&gt;
                    </h4>
                    
                    <div className="space-y-3">
                      <div>
                        <h5 className="text-xs font-medium text-gray-400 mb-1">Tailwind Classes</h5>
                        <div className="text-xs font-mono bg-gray-800 p-2 rounded max-h-20 overflow-auto">
                          {selectedElement.tailwindClasses.join(' ') || 'None'}
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="text-xs font-medium text-gray-400 mb-1">Computed Styles</h5>
                        <div className="text-xs font-mono bg-gray-800 p-2 rounded max-h-32 overflow-auto">
                          {Object.entries(selectedElement.computedStyles).map(([prop, value]) => (
                            <div key={prop} className="flex justify-between">
                              <span className="text-purple-400">{prop}:</span>
                              <span className="text-green-400">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {selectedElement.boundingRect && (
                        <div>
                          <h5 className="text-xs font-medium text-gray-400 mb-1">Dimensions</h5>
                          <div className="text-xs font-mono bg-gray-800 p-2 rounded">
                            <div>Width: {selectedElement.boundingRect.width.toFixed(1)}px</div>
                            <div>Height: {selectedElement.boundingRect.height.toFixed(1)}px</div>
                            <div>Top: {selectedElement.boundingRect.top.toFixed(1)}px</div>
                            <div>Left: {selectedElement.boundingRect.left.toFixed(1)}px</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Click "Inspect" and select an element</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'conflicts' && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">Style Conflicts</h4>
                  <div className="text-xs text-gray-400 mb-3">
                    Potential CSS conflicts detected in the current page
                  </div>
                  
                  <div className="space-y-2">
                    <div className="bg-yellow-900/20 border border-yellow-600/30 rounded p-2">
                      <div className="text-xs font-medium text-yellow-400">Specificity Warning</div>
                      <div className="text-xs text-gray-300 mt-1">
                        Multiple flex/grid classes detected on same elements
                      </div>
                    </div>
                    
                    <div className="bg-red-900/20 border border-red-600/30 rounded p-2">
                      <div className="text-xs font-medium text-red-400">Transform Conflicts</div>
                      <div className="text-xs text-gray-300 mt-1">
                        Overlapping transform utilities found
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inspector Overlay */}
      {inspectMode && (
        <div className="fixed inset-0 z-30 pointer-events-none">
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg">
            <div className="text-sm font-medium">Inspector Mode Active</div>
            <div className="text-xs opacity-75">Click any element to inspect</div>
          </div>
        </div>
      )}
    </>
  )
}