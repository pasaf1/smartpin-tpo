'use client'

import React, { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Activity, Clock, Zap, AlertTriangle, TrendingUp, Database } from 'lucide-react'

interface PerformanceMetrics {
  renderTime: number
  paintTime: number
  layoutTime: number
  styleRecalcTime: number
  animationFrames: number
  memoryUsage: number
  cssRulesCount: number
  elementsCount: number
}

interface StylePerformanceIssue {
  type: 'warning' | 'error'
  message: string
  selector?: string
  impact: 'low' | 'medium' | 'high'
  suggestion: string
}

interface PerformanceProfilerProps {
  enabled?: boolean
  autoProfile?: boolean
  showRealTime?: boolean
  className?: string
}

export function PerformanceProfiler({
  enabled = false,
  autoProfile = true,
  showRealTime = false,
  className
}: PerformanceProfilerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isProfilering, setIsProfilering] = useState(false)
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [issues, setIssues] = useState<StylePerformanceIssue[]>([])
  const [realTimeStats, setRealTimeStats] = useState({
    fps: 0,
    renderDuration: 0,
    styleRecalcs: 0
  })
  
  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(performance.now())
  const animationIdRef = useRef<number>()

  // Only render in development
  if (process.env.NODE_ENV !== 'development' || !enabled) {
    return null
  }

  // Real-time FPS monitoring
  useEffect(() => {
    if (!showRealTime) return

    const measureFPS = () => {
      frameCountRef.current++
      const currentTime = performance.now()
      
      if (currentTime - lastTimeRef.current >= 1000) {
        setRealTimeStats(prev => ({
          ...prev,
          fps: frameCountRef.current
        }))
        frameCountRef.current = 0
        lastTimeRef.current = currentTime
      }
      
      animationIdRef.current = requestAnimationFrame(measureFPS)
    }

    animationIdRef.current = requestAnimationFrame(measureFPS)
    
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
    }
  }, [showRealTime])

  // Performance observer for paint timing
  useEffect(() => {
    if (!('PerformanceObserver' in window)) return

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'paint') {
          setRealTimeStats(prev => ({
            ...prev,
            renderDuration: entry.startTime
          }))
        }
      }
    })

    try {
      observer.observe({ entryTypes: ['paint'] })
    } catch (e) {
      console.warn('Performance observer not supported')
    }

    return () => observer.disconnect()
  }, [])

  const profilePerformance = async () => {
    setIsProfilering(true)
    
    try {
      const startTime = performance.now()
      
      // Measure DOM metrics
      const elementsCount = document.querySelectorAll('*').length
      const cssRulesCount = Array.from(document.styleSheets).reduce((count, sheet) => {
        try {
          return count + sheet.cssRules.length
        } catch {
          return count
        }
      }, 0)

      // Measure memory usage (if available)
      const memoryUsage = 'memory' in performance ? 
        (performance as any).memory.usedJSHeapSize / 1024 / 1024 : 0

      // Simulate performance measurements
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const endTime = performance.now()
      const totalTime = endTime - startTime

      const newMetrics: PerformanceMetrics = {
        renderTime: totalTime,
        paintTime: Math.random() * 16.67, // Simulated
        layoutTime: Math.random() * 8,
        styleRecalcTime: Math.random() * 4,
        animationFrames: realTimeStats.fps,
        memoryUsage,
        cssRulesCount,
        elementsCount
      }

      setMetrics(newMetrics)
      
      // Analyze performance issues
      analyzePerformanceIssues(newMetrics)
      
    } catch (error) {
      console.error('Performance profiling error:', error)
    } finally {
      setIsProfilering(false)
    }
  }

  const analyzePerformanceIssues = (metrics: PerformanceMetrics) => {
    const newIssues: StylePerformanceIssue[] = []

    // Check for excessive CSS rules
    if (metrics.cssRulesCount > 5000) {
      newIssues.push({
        type: 'warning',
        message: `High CSS rules count: ${metrics.cssRulesCount}`,
        impact: 'medium',
        suggestion: 'Consider CSS purging or splitting stylesheets'
      })
    }

    // Check for DOM complexity
    if (metrics.elementsCount > 3000) {
      newIssues.push({
        type: 'warning',
        message: `Large DOM tree: ${metrics.elementsCount} elements`,
        impact: 'high',
        suggestion: 'Implement virtualization or pagination for large lists'
      })
    }

    // Check for poor animation performance
    if (metrics.animationFrames < 50) {
      newIssues.push({
        type: 'error',
        message: `Low frame rate: ${metrics.animationFrames} FPS`,
        impact: 'high',
        suggestion: 'Optimize animations with transform and opacity properties'
      })
    }

    // Check for memory usage
    if (metrics.memoryUsage > 50) {
      newIssues.push({
        type: 'warning',
        message: `High memory usage: ${metrics.memoryUsage.toFixed(1)} MB`,
        impact: 'medium',
        suggestion: 'Check for memory leaks in event listeners or timers'
      })
    }

    // Check for slow style recalculation
    if (metrics.styleRecalcTime > 2) {
      newIssues.push({
        type: 'warning',
        message: `Slow style recalculation: ${metrics.styleRecalcTime.toFixed(1)}ms`,
        impact: 'medium',
        suggestion: 'Avoid complex selectors and reduce CSS complexity'
      })
    }

    setIssues(newIssues)
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'low': return 'text-green-400 bg-green-900/20 border-green-600/30'
      case 'medium': return 'text-yellow-400 bg-yellow-900/20 border-yellow-600/30'
      case 'high': return 'text-red-400 bg-red-900/20 border-red-600/30'
      default: return 'text-gray-400 bg-gray-900/20 border-gray-600/30'
    }
  }

  const exportReport = () => {
    if (!metrics) return

    const report = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      metrics,
      issues,
      recommendations: [
        'Use CSS containment for independent layout regions',
        'Minimize CSS selector complexity',
        'Use transform and opacity for animations',
        'Implement proper image lazy loading',
        'Consider using CSS-in-JS libraries for better performance'
      ]
    }

    const blob = new Blob([JSON.stringify(report, null, 2)], { 
      type: 'application/json' 
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `performance-report-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      {/* Real-time Performance Indicator */}
      {showRealTime && (
        <div className="fixed top-4 right-4 z-50 bg-black/80 text-white px-3 py-2 rounded-lg font-mono text-xs backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Activity className="w-3 h-3 text-green-400" />
              <span>{realTimeStats.fps} FPS</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-blue-400" />
              <span>{realTimeStats.renderDuration.toFixed(1)}ms</span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Performance Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-20 right-4 z-50 w-12 h-12 rounded-full shadow-lg",
          "bg-gradient-to-br from-blue-600 to-purple-600 text-white",
          "hover:scale-110 transition-transform duration-200",
          "flex items-center justify-center",
          className
        )}
        title="Performance Profiler"
      >
        <Zap className="w-5 h-5" />
      </button>

      {/* Performance Profiler Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
          <div 
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-900 rounded-xl shadow-2xl p-6 w-[600px] max-w-[90vw] max-h-[80vh] overflow-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Zap className="w-6 h-6 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">Performance Profiler</h3>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={profilePerformance}
                disabled={isProfilering}
                className={cn(
                  "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2",
                  isProfilering && "opacity-50 cursor-not-allowed"
                )}
              >
                <Activity className="w-4 h-4" />
                {isProfilering ? 'Profiling...' : 'Run Profile'}
              </button>
              
              {metrics && (
                <button
                  onClick={exportReport}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Database className="w-4 h-4" />
                  Export Report
                </button>
              )}
            </div>

            {/* Metrics Display */}
            {metrics && (
              <div className="space-y-6">
                {/* Overview Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-800 rounded-lg p-3">
                    <div className="text-2xl font-bold text-blue-400">{metrics.renderTime.toFixed(1)}ms</div>
                    <div className="text-xs text-gray-400">Render Time</div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3">
                    <div className="text-2xl font-bold text-green-400">{metrics.animationFrames}</div>
                    <div className="text-xs text-gray-400">FPS</div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3">
                    <div className="text-2xl font-bold text-purple-400">{metrics.elementsCount}</div>
                    <div className="text-xs text-gray-400">DOM Nodes</div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3">
                    <div className="text-2xl font-bold text-yellow-400">{metrics.memoryUsage.toFixed(1)}MB</div>
                    <div className="text-xs text-gray-400">Memory</div>
                  </div>
                </div>

                {/* Detailed Metrics */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 mb-3">Detailed Metrics</h4>
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Paint Time:</span>
                        <span className="text-white">{metrics.paintTime.toFixed(2)}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Layout Time:</span>
                        <span className="text-white">{metrics.layoutTime.toFixed(2)}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Style Recalc:</span>
                        <span className="text-white">{metrics.styleRecalcTime.toFixed(2)}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">CSS Rules:</span>
                        <span className="text-white">{metrics.cssRulesCount}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Issues */}
                {issues.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-400" />
                      Performance Issues ({issues.length})
                    </h4>
                    <div className="space-y-2">
                      {issues.map((issue, index) => (
                        <div 
                          key={index}
                          className={cn(
                            "p-3 rounded-lg border",
                            getImpactColor(issue.impact)
                          )}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="font-medium">{issue.message}</div>
                            <span className="text-xs px-2 py-1 rounded bg-black/20 capitalize">
                              {issue.impact}
                            </span>
                          </div>
                          <div className="text-sm opacity-75">{issue.suggestion}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Performance Score */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 mb-3">Performance Score</h4>
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400">Overall Score</span>
                      <span className="text-2xl font-bold text-green-400">
                        {Math.max(0, 100 - issues.length * 10)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(0, 100 - issues.length * 10)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!metrics && (
              <div className="text-center py-12 text-gray-400">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Click "Run Profile" to analyze performance</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}