/**
 * Style Debugging Utilities for SmartPin TPO
 * 
 * Collection of utility functions to help with CSS debugging,
 * performance analysis, and style conflict detection.
 */

// Types
export interface StyleMetrics {
  cssRulesCount: number
  elementsCount: number
  averageDepth: number
  maxDepth: number
  memoryUsage: number
  renderTime: number
}

export interface ClassConflict {
  element: Element
  conflicts: string[]
  severity: 'low' | 'medium' | 'high'
  suggestions: string[]
}

export interface PerformanceIssue {
  type: 'layout' | 'paint' | 'composite' | 'style'
  severity: 'low' | 'medium' | 'high'
  description: string
  element?: Element
  fix: string
}

// Tailwind class conflict detection
export const TAILWIND_CONFLICTS = {
  display: [
    'block', 'inline-block', 'inline', 'flex', 'inline-flex', 
    'table', 'inline-table', 'table-caption', 'table-cell', 
    'table-column', 'table-column-group', 'table-footer-group',
    'table-header-group', 'table-row-group', 'table-row',
    'flow-root', 'grid', 'inline-grid', 'contents', 'list-item', 'hidden'
  ],
  position: ['static', 'fixed', 'absolute', 'relative', 'sticky'],
  float: ['float-right', 'float-left', 'float-none'],
  clear: ['clear-left', 'clear-right', 'clear-both', 'clear-none'],
  textAlign: ['text-left', 'text-center', 'text-right', 'text-justify', 'text-start', 'text-end'],
  verticalAlign: [
    'align-baseline', 'align-top', 'align-middle', 'align-bottom',
    'align-text-top', 'align-text-bottom', 'align-sub', 'align-super'
  ],
  overflow: ['overflow-auto', 'overflow-hidden', 'overflow-clip', 'overflow-visible', 'overflow-scroll'],
  overflowX: ['overflow-x-auto', 'overflow-x-hidden', 'overflow-x-clip', 'overflow-x-visible', 'overflow-x-scroll'],
  overflowY: ['overflow-y-auto', 'overflow-y-hidden', 'overflow-y-clip', 'overflow-y-visible', 'overflow-y-scroll'],
  flexDirection: ['flex-row', 'flex-row-reverse', 'flex-col', 'flex-col-reverse'],
  flexWrap: ['flex-wrap', 'flex-wrap-reverse', 'flex-nowrap'],
  justifyContent: [
    'justify-normal', 'justify-start', 'justify-end', 'justify-center', 
    'justify-between', 'justify-around', 'justify-evenly', 'justify-stretch'
  ],
  alignItems: ['items-start', 'items-end', 'items-center', 'items-baseline', 'items-stretch'],
  alignContent: [
    'content-normal', 'content-center', 'content-start', 'content-end', 
    'content-between', 'content-around', 'content-evenly', 'content-baseline', 'content-stretch'
  ],
  alignSelf: ['self-auto', 'self-start', 'self-end', 'self-center', 'self-stretch', 'self-baseline']
}

/**
 * Analyzes the DOM for style metrics and performance indicators
 */
export function analyzeStyleMetrics(): StyleMetrics {
  const allElements = document.querySelectorAll('*')
  const elementsCount = allElements.length

  // Count CSS rules
  let cssRulesCount = 0
  try {
    Array.from(document.styleSheets).forEach(sheet => {
      try {
        cssRulesCount += sheet.cssRules?.length || 0
      } catch (e) {
        // Cross-origin stylesheets
      }
    })
  } catch (e) {
    console.warn('Could not access stylesheets:', e)
  }

  // Calculate DOM depth
  let totalDepth = 0
  let maxDepth = 0

  const calculateDepth = (element: Element, depth = 0): void => {
    totalDepth += depth
    maxDepth = Math.max(maxDepth, depth)
    
    Array.from(element.children).forEach(child => {
      calculateDepth(child, depth + 1)
    })
  }

  if (document.body) {
    calculateDepth(document.body)
  }

  const averageDepth = elementsCount > 0 ? totalDepth / elementsCount : 0

  // Memory usage (if available)
  const memoryUsage = 'memory' in performance 
    ? (performance as any).memory?.usedJSHeapSize / 1024 / 1024 || 0
    : 0

  return {
    cssRulesCount,
    elementsCount,
    averageDepth,
    maxDepth,
    memoryUsage,
    renderTime: performance.now()
  }
}

/**
 * Detects conflicting Tailwind CSS classes on elements
 */
export function detectTailwindConflicts(): ClassConflict[] {
  const conflicts: ClassConflict[] = []
  const elements = document.querySelectorAll('*[class]')

  elements.forEach(element => {
    const classes = Array.from(element.classList)
    const elementConflicts = findClassConflicts(classes)
    
    if (elementConflicts.length > 0) {
      conflicts.push({
        element,
        conflicts: elementConflicts,
        severity: getSeverityForConflicts(elementConflicts),
        suggestions: generateConflictSuggestions(elementConflicts)
      })
    }
  })

  return conflicts
}

function findClassConflicts(classes: string[]): string[] {
  const conflicts: string[] = []

  Object.entries(TAILWIND_CONFLICTS).forEach(([category, conflictingClasses]) => {
    const matches = classes.filter(cls => {
      // Direct match or prefixed match (for responsive variants)
      return conflictingClasses.some(conflictCls => 
        cls === conflictCls || 
        cls.match(new RegExp(`^(sm:|md:|lg:|xl:|2xl:)${conflictCls}$`))
      )
    })

    if (matches.length > 1) {
      conflicts.push(...matches)
    }
  })

  return [...new Set(conflicts)]
}

function getSeverityForConflicts(conflicts: string[]): 'low' | 'medium' | 'high' {
  if (conflicts.some(c => c.includes('display') || c.includes('position'))) {
    return 'high'
  }
  if (conflicts.length > 3) {
    return 'medium'
  }
  return 'low'
}

function generateConflictSuggestions(conflicts: string[]): string[] {
  const suggestions: string[] = []
  
  if (conflicts.some(c => c.includes('flex'))) {
    suggestions.push('Consider using only one flex direction class')
  }
  if (conflicts.some(c => c.includes('text-'))) {
    suggestions.push('Remove redundant text alignment classes')
  }
  if (conflicts.some(c => c.includes('overflow'))) {
    suggestions.push('Use only one overflow class per axis')
  }

  return suggestions
}

/**
 * Identifies performance issues in CSS
 */
export function detectPerformanceIssues(): PerformanceIssue[] {
  const issues: PerformanceIssue[] = []

  // Check for expensive selectors
  try {
    Array.from(document.styleSheets).forEach(sheet => {
      try {
        Array.from(sheet.cssRules || []).forEach((rule: any) => {
          if (rule.selectorText) {
            const selector = rule.selectorText
            
            // Complex selectors
            if (selector.split(' ').length > 4) {
              issues.push({
                type: 'style',
                severity: 'medium',
                description: `Complex selector: ${selector}`,
                fix: 'Simplify selector or use class-based targeting'
              })
            }
            
            // Universal selectors
            if (selector.includes('*')) {
              issues.push({
                type: 'style',
                severity: 'high',
                description: `Universal selector: ${selector}`,
                fix: 'Replace with specific class selectors'
              })
            }

            // Multiple pseudo-selectors
            if ((selector.match(/:/g) || []).length > 2) {
              issues.push({
                type: 'style',
                severity: 'medium',
                description: `Multiple pseudo-selectors: ${selector}`,
                fix: 'Consider combining or simplifying selectors'
              })
            }
          }

          // Check for expensive properties
          if (rule.style) {
            const cssText = rule.style.cssText
            
            if (cssText.includes('box-shadow') && cssText.includes(',')) {
              issues.push({
                type: 'paint',
                severity: 'medium',
                description: 'Multiple box-shadows detected',
                fix: 'Combine box-shadows or use pseudo-elements'
              })
            }

            if (cssText.includes('filter') && cssText.includes('blur')) {
              issues.push({
                type: 'composite',
                severity: 'medium',
                description: 'Blur filters can impact performance',
                fix: 'Consider alternatives or limit usage'
              })
            }
          }
        })
      } catch (e) {
        // Cross-origin issues
      }
    })
  } catch (e) {
    console.warn('Could not analyze stylesheets:', e)
  }

  // Check for layout-triggering properties in animations
  document.querySelectorAll('[class*="animate"], [style*="animation"]').forEach(element => {
    const computedStyle = window.getComputedStyle(element)
    
    if (computedStyle.animationName && computedStyle.animationName !== 'none') {
      // This would require more sophisticated analysis of keyframes
      issues.push({
        type: 'layout',
        severity: 'low',
        description: 'Animated element detected',
        element,
        fix: 'Ensure animations only use transform and opacity'
      })
    }
  })

  return issues
}

/**
 * Generates a comprehensive style report
 */
export function generateStyleReport(): {
  metrics: StyleMetrics
  conflicts: ClassConflict[]
  performanceIssues: PerformanceIssue[]
  recommendations: string[]
} {
  const metrics = analyzeStyleMetrics()
  const conflicts = detectTailwindConflicts()
  const performanceIssues = detectPerformanceIssues()
  
  const recommendations: string[] = []
  
  // Generate recommendations based on findings
  if (metrics.cssRulesCount > 5000) {
    recommendations.push('Consider CSS purging to reduce stylesheet size')
  }
  
  if (metrics.maxDepth > 20) {
    recommendations.push('DOM tree is very deep, consider flattening structure')
  }
  
  if (conflicts.length > 0) {
    recommendations.push(`${conflicts.length} class conflicts detected - review and resolve`)
  }
  
  if (performanceIssues.length > 0) {
    recommendations.push(`${performanceIssues.length} performance issues found`)
  }
  
  if (metrics.elementsCount > 5000) {
    recommendations.push('Large DOM size - consider virtualization for lists')
  }

  return {
    metrics,
    conflicts,
    performanceIssues,
    recommendations
  }
}

/**
 * Utility to highlight elements with specific classes
 */
export function highlightElementsWithClasses(classes: string[], color = '#ff0000'): void {
  const selector = classes.map(cls => `.${cls}`).join(', ')
  const elements = document.querySelectorAll(selector)
  
  elements.forEach(element => {
    const el = element as HTMLElement
    el.style.outline = `2px solid ${color}`
    el.style.outlineOffset = '2px'
  })
}

/**
 * Remove highlighting added by highlightElementsWithClasses
 */
export function removeHighlighting(): void {
  const elements = document.querySelectorAll('*[style*="outline"]')
  elements.forEach(element => {
    const el = element as HTMLElement
    el.style.outline = ''
    el.style.outlineOffset = ''
  })
}

/**
 * Get computed styles for debugging
 */
export function getComputedStylesDebug(element: Element): Record<string, string> {
  const computedStyle = window.getComputedStyle(element)
  const importantProperties = [
    'display', 'position', 'width', 'height', 'top', 'right', 'bottom', 'left',
    'margin', 'padding', 'border', 'backgroundColor', 'color', 'fontSize',
    'fontFamily', 'lineHeight', 'textAlign', 'verticalAlign', 'zIndex',
    'transform', 'opacity', 'visibility', 'overflow', 'flex', 'grid'
  ]
  
  const styles: Record<string, string> = {}
  importantProperties.forEach(prop => {
    styles[prop] = computedStyle.getPropertyValue(prop) || 'unset'
  })
  
  return styles
}

/**
 * Log element hierarchy for debugging
 */
export function logElementHierarchy(element: Element, maxDepth = 5): void {
  const logElement = (el: Element, depth = 0, prefix = '') => {
    if (depth > maxDepth) return
    
    const tag = el.tagName.toLowerCase()
    const id = el.id ? `#${el.id}` : ''
    const classes = el.classList.length > 0 ? `.${Array.from(el.classList).join('.')}` : ''
    
    console.log(`${prefix}${tag}${id}${classes}`)
    
    Array.from(el.children).forEach((child, index) => {
      const isLast = index === el.children.length - 1
      const newPrefix = prefix + (isLast ? '    ' : '│   ')
      const childPrefix = prefix + (isLast ? '└── ' : '├── ')
      
      console.log(`${childPrefix}${child.tagName.toLowerCase()}${child.id ? `#${child.id}` : ''}${child.classList.length > 0 ? `.${Array.from(child.classList).join('.')}` : ''}`)
      
      if (depth < maxDepth - 1) {
        logElement(child, depth + 1, newPrefix)
      }
    })
  }
  
  logElement(element)
}

/**
 * Export debug utilities for console use
 */
export const debugUtils = {
  analyzeStyleMetrics,
  detectTailwindConflicts,
  detectPerformanceIssues,
  generateStyleReport,
  highlightElementsWithClasses,
  removeHighlighting,
  getComputedStylesDebug,
  logElementHierarchy
}

// Make utilities available globally in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).__debugUtils = debugUtils
}