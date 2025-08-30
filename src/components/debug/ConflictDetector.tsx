'use client'

import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { AlertTriangle, Search, Filter, FileX, Zap } from 'lucide-react'

interface StyleConflict {
  id: string
  type: 'tailwind' | 'css' | 'specificity' | 'override'
  severity: 'low' | 'medium' | 'high' | 'critical'
  element: string
  selector: string
  conflictingRules: string[]
  description: string
  suggestion: string
  affectedElements: number
}

interface ConflictDetectorProps {
  enabled?: boolean
  autoScan?: boolean
  className?: string
}

// Common problematic Tailwind class combinations
const CONFLICTING_CLASSES = {
  display: ['block', 'inline', 'inline-block', 'flex', 'inline-flex', 'grid', 'inline-grid', 'hidden'],
  positioning: ['static', 'fixed', 'absolute', 'relative', 'sticky'],
  flexDirection: ['flex-row', 'flex-col', 'flex-row-reverse', 'flex-col-reverse'],
  textAlign: ['text-left', 'text-center', 'text-right', 'text-justify'],
  overflow: ['overflow-visible', 'overflow-hidden', 'overflow-scroll', 'overflow-auto'],
  zIndex: ['z-0', 'z-10', 'z-20', 'z-30', 'z-40', 'z-50']
}

// Performance-heavy CSS patterns
const PERFORMANCE_ANTIPATTERNS = [
  { pattern: /transform.*scale.*rotate/i, message: 'Multiple transforms can be expensive' },
  { pattern: /box-shadow.*,.*box-shadow/i, message: 'Multiple box-shadows impact performance' },
  { pattern: /filter.*blur.*brightness/i, message: 'Stacked filters can be costly' },
  { pattern: /@keyframes.*100%.*transform/i, message: 'Transform animations should use will-change' }
]

export function ConflictDetector({
  enabled = false,
  autoScan = true,
  className
}: ConflictDetectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [conflicts, setConflicts] = useState<StyleConflict[]>([])
  const [filter, setFilter] = useState<'all' | 'high' | 'critical'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Only render in development
  if (process.env.NODE_ENV !== 'development' || !enabled) {
    return null
  }

  useEffect(() => {
    if (autoScan) {
      scanForConflicts()
    }
  }, [autoScan])

  const scanForConflicts = async () => {
    setIsScanning(true)
    const foundConflicts: StyleConflict[] = []

    try {
      // Scan for Tailwind class conflicts
      const elements = document.querySelectorAll('*[class]')
      
      elements.forEach((element, index) => {
        const classes = Array.from(element.classList)
        const tailwindConflicts = findTailwindConflicts(classes)
        
        tailwindConflicts.forEach(conflict => {
          foundConflicts.push({
            id: `tw-${index}-${conflict.type}`,
            type: 'tailwind',
            severity: conflict.severity,
            element: element.tagName.toLowerCase(),
            selector: `.${classes.join('.')}`,
            conflictingRules: conflict.classes,
            description: `Multiple ${conflict.type} classes found on same element`,
            suggestion: conflict.suggestion,
            affectedElements: 1
          })
        })

        // Check for CSS specificity issues
        const computedStyle = window.getComputedStyle(element)
        const specificityIssues = checkSpecificityIssues(element, computedStyle)
        
        specificityIssues.forEach(issue => {
          foundConflicts.push({
            id: `spec-${index}`,
            type: 'specificity',
            severity: 'medium',
            element: element.tagName.toLowerCase(),
            selector: issue.selector,
            conflictingRules: issue.rules,
            description: 'Specificity conflict detected',
            suggestion: issue.suggestion,
            affectedElements: 1
          })
        })
      })

      // Scan for performance anti-patterns in stylesheets
      const performanceIssues = await scanStylesheets()
      foundConflicts.push(...performanceIssues)

      setConflicts(foundConflicts)
    } catch (error) {
      console.error('Error scanning for conflicts:', error)
    } finally {
      setIsScanning(false)
    }
  }

  const findTailwindConflicts = (classes: string[]) => {
    const conflicts: Array<{
      type: string
      severity: 'low' | 'medium' | 'high' | 'critical'
      classes: string[]
      suggestion: string
    }> = []

    // Check each conflict group
    Object.entries(CONFLICTING_CLASSES).forEach(([type, conflictingClasses]) => {
      const foundClasses = classes.filter(cls => 
        conflictingClasses.some(conflictCls => 
          cls === conflictCls || cls.startsWith(`${conflictCls}-`)
        )
      )

      if (foundClasses.length > 1) {
        conflicts.push({
          type,
          severity: type === 'display' ? 'high' : 'medium',
          classes: foundClasses,
          suggestion: `Remove redundant ${type} classes. Keep only one: ${foundClasses[foundClasses.length - 1]}`
        })
      }
    })

    // Check for responsive conflicts
    const responsiveConflicts = checkResponsiveConflicts(classes)
    conflicts.push(...responsiveConflicts)

    return conflicts
  }

  const checkResponsiveConflicts = (classes: string[]) => {
    const conflicts: Array<{
      type: string
      severity: 'low' | 'medium' | 'high' | 'critical'
      classes: string[]
      suggestion: string
    }> = []

    // Group classes by breakpoint
    const breakpoints = ['sm:', 'md:', 'lg:', 'xl:', '2xl:']
    const baseClasses = classes.filter(cls => !breakpoints.some(bp => cls.startsWith(bp)))
    
    breakpoints.forEach(bp => {
      const bpClasses = classes.filter(cls => cls.startsWith(bp))
      
      // Check for conflicting responsive classes
      baseClasses.forEach(baseClass => {
        const conflictingResponsive = bpClasses.find(bpClass => 
          bpClass.substring(bp.length) === baseClass
        )
        
        if (conflictingResponsive) {
          conflicts.push({
            type: 'responsive',
            severity: 'low',
            classes: [baseClass, conflictingResponsive],
            suggestion: `Responsive class ${conflictingResponsive} overrides ${baseClass}`
          })
        }
      })
    })

    return conflicts
  }

  const checkSpecificityIssues = (element: Element, computedStyle: CSSStyleDeclaration) => {
    const issues: Array<{
      selector: string
      rules: string[]
      suggestion: string
    }> = []

    // Check for !important usage (simplified detection)
    try {
      const sheets = Array.from(document.styleSheets)
      sheets.forEach(sheet => {
        try {
          const rules = Array.from(sheet.cssRules || sheet.rules || [])
          rules.forEach((rule: any) => {
            if (rule.style && rule.selectorText) {
              const hasImportant = rule.style.cssText.includes('!important')
              if (hasImportant && element.matches && element.matches(rule.selectorText)) {
                issues.push({
                  selector: rule.selectorText,
                  rules: ['!important detected'],
                  suggestion: 'Avoid !important, use more specific selectors instead'
                })
              }
            }
          })
        } catch (e) {
          // Cross-origin stylesheet access blocked
        }
      })
    } catch (e) {
      // Stylesheet access error
    }

    return issues
  }

  const scanStylesheets = async (): Promise<StyleConflict[]> => {
    const performanceConflicts: StyleConflict[] = []

    try {
      const sheets = Array.from(document.styleSheets)
      let ruleCount = 0

      sheets.forEach(sheet => {
        try {
          const rules = Array.from(sheet.cssRules || sheet.rules || [])
          ruleCount += rules.length

          rules.forEach((rule: any, index) => {
            if (rule.style) {
              const cssText = rule.style.cssText
              
              // Check against performance anti-patterns
              PERFORMANCE_ANTIPATTERNS.forEach(antiPattern => {
                if (antiPattern.pattern.test(cssText)) {
                  performanceConflicts.push({
                    id: `perf-${index}`,
                    type: 'css',
                    severity: 'medium',
                    element: 'stylesheet',
                    selector: rule.selectorText || 'unknown',
                    conflictingRules: [cssText],
                    description: antiPattern.message,
                    suggestion: 'Consider optimizing for better performance',
                    affectedElements: document.querySelectorAll(rule.selectorText || '*').length
                  })
                }
              })
            }
          })
        } catch (e) {
          // Cross-origin or access issues
        }
      })

      // Add stylesheet size warning
      if (ruleCount > 5000) {
        performanceConflicts.push({
          id: 'css-size',
          type: 'css',
          severity: 'high',
          element: 'stylesheet',
          selector: 'global',
          conflictingRules: [`${ruleCount} CSS rules`],
          description: 'Large stylesheet detected',
          suggestion: 'Consider CSS purging or code splitting',
          affectedElements: 1
        })
      }
    } catch (error) {
      console.error('Error scanning stylesheets:', error)
    }

    return performanceConflicts
  }

  const filteredConflicts = conflicts.filter(conflict => {
    const matchesFilter = filter === 'all' || conflict.severity === filter
    const matchesSearch = searchTerm === '' || 
      conflict.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conflict.selector.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesFilter && matchesSearch
  })

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-green-400 bg-green-900/20 border-green-600/30'
      case 'medium': return 'text-yellow-400 bg-yellow-900/20 border-yellow-600/30'  
      case 'high': return 'text-orange-400 bg-orange-900/20 border-orange-600/30'
      case 'critical': return 'text-red-400 bg-red-900/20 border-red-600/30'
      default: return 'text-gray-400 bg-gray-900/20 border-gray-600/30'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-400" />
      case 'high': return <AlertTriangle className="w-4 h-4 text-orange-400" />
      default: return <FileX className="w-4 h-4 text-yellow-400" />
    }
  }

  const fixConflict = (conflictId: string) => {
    // Auto-fix logic would go here
    console.log(`Attempting to fix conflict: ${conflictId}`)
    
    // For now, just remove the conflict from the list
    setConflicts(prev => prev.filter(c => c.id !== conflictId))
  }

  return (
    <>
      {/* Floating Conflict Detector Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-32 right-4 z-50 w-12 h-12 rounded-full shadow-lg",
          "bg-gradient-to-br from-orange-600 to-red-600 text-white",
          "hover:scale-110 transition-transform duration-200",
          "flex items-center justify-center",
          conflicts.length > 0 && "animate-pulse",
          className
        )}
        title={`Style Conflicts (${conflicts.length})`}
      >
        {conflicts.length > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold">
            {conflicts.length}
          </div>
        )}
        <AlertTriangle className="w-5 h-5" />
      </button>

      {/* Conflict Detection Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
          <div 
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-900 rounded-xl shadow-2xl p-6 w-[700px] max-w-[90vw] max-h-[80vh] overflow-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-orange-400" />
                <h3 className="text-lg font-semibold text-white">Style Conflict Detector</h3>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex gap-2">
                <button
                  onClick={scanForConflicts}
                  disabled={isScanning}
                  className={cn(
                    "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2",
                    isScanning && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <Search className="w-4 h-4" />
                  {isScanning ? 'Scanning...' : 'Scan for Conflicts'}
                </button>
                
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Severities</option>
                  <option value="high">High Priority</option>
                  <option value="critical">Critical Only</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search conflicts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <Filter className="w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-800 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-red-400">
                  {conflicts.filter(c => c.severity === 'critical').length}
                </div>
                <div className="text-xs text-gray-400">Critical</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-orange-400">
                  {conflicts.filter(c => c.severity === 'high').length}
                </div>
                <div className="text-xs text-gray-400">High</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-yellow-400">
                  {conflicts.filter(c => c.severity === 'medium').length}
                </div>
                <div className="text-xs text-gray-400">Medium</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-400">
                  {conflicts.filter(c => c.severity === 'low').length}
                </div>
                <div className="text-xs text-gray-400">Low</div>
              </div>
            </div>

            {/* Conflicts List */}
            <div className="space-y-3">
              {filteredConflicts.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  {conflicts.length === 0 ? (
                    <>
                      <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No conflicts detected. Click "Scan for Conflicts" to analyze.</p>
                    </>
                  ) : (
                    <p>No conflicts match your current filters.</p>
                  )}
                </div>
              ) : (
                filteredConflicts.map(conflict => (
                  <div 
                    key={conflict.id}
                    className={cn(
                      "p-4 rounded-lg border",
                      getSeverityColor(conflict.severity)
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getSeverityIcon(conflict.severity)}
                        <div>
                          <div className="font-medium">{conflict.description}</div>
                          <div className="text-sm opacity-75">{conflict.selector}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 rounded bg-black/20 capitalize">
                          {conflict.type}
                        </span>
                        <button
                          onClick={() => fixConflict(conflict.id)}
                          className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                        >
                          Fix
                        </button>
                      </div>
                    </div>
                    
                    <div className="mb-2">
                      <div className="text-sm font-medium mb-1">Conflicting Rules:</div>
                      <div className="bg-black/20 rounded p-2 font-mono text-xs">
                        {conflict.conflictingRules.join(', ')}
                      </div>
                    </div>
                    
                    <div className="text-sm">
                      <span className="font-medium">Suggestion:</span> {conflict.suggestion}
                    </div>
                    
                    {conflict.affectedElements > 1 && (
                      <div className="text-xs opacity-75 mt-1">
                        Affects {conflict.affectedElements} elements
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}