/**
 * Konva.js Production Optimization Suite
 *
 * Comprehensive optimization library for Konva.js applications
 * specifically designed for Vercel deployment and production performance
 */

// Core optimization modules
export { KonvaPerformanceMonitor, createProductionPerformanceMonitor, useKonvaPerformance } from './performance-monitor'
export { KonvaMemoryManager, createProductionMemoryManager } from './memory-manager'
export { ViewportCuller, createViewportCuller, cullPins, useViewportCulling } from './viewport-culling'

// Mobile optimizations
export {
  MobileGestureHandler,
  MobileKonvaOptimizer,
  createMobileGestureHandler,
  createMobileKonvaOptimizer,
  isMobileDevice,
  getMobileCanvasSettings
} from './mobile-optimizations'

// Vercel-specific optimizations
export {
  VercelKonvaOptimizer,
  VercelDeploymentHelper,
  createDynamicKonvaComponent,
  createVercelOptimizedKonva
} from './vercel-optimizations'

// Optimized components (commented out due to JSX resolution issues)
// export { default as OptimizedKonvaComponents } from './optimized-components'

// Import types for internal use
import { KonvaPerformanceMonitor, createProductionPerformanceMonitor } from './performance-monitor'
import { KonvaMemoryManager, createProductionMemoryManager } from './memory-manager'
import { ViewportCuller, createViewportCuller } from './viewport-culling'
import { MobileKonvaOptimizer, createMobileKonvaOptimizer, isMobileDevice, getMobileCanvasSettings } from './mobile-optimizations'
import { VercelKonvaOptimizer, createVercelOptimizedKonva } from './vercel-optimizations'

/**
 * All-in-one optimization configuration for production
 */
export interface ProductionKonvaConfig {
  // Performance settings
  enablePerformanceMonitoring?: boolean
  enableMemoryManagement?: boolean
  enableViewportCulling?: boolean

  // Mobile settings
  isMobile?: boolean
  enableMobileOptimizations?: boolean

  // Vercel settings
  enableVercelOptimizations?: boolean
  enableDynamicImports?: boolean

  // Canvas settings
  maxMemoryMB?: number
  maxRenderItems?: number
  performanceMode?: 'high' | 'balanced' | 'performance'

  // Debug settings
  enableDebugMode?: boolean
}

/**
 * Initialize all Konva optimizations for production use
 */
export function initializeProductionKonva(config: ProductionKonvaConfig = {}) {
  const {
    enablePerformanceMonitoring = true,
    enableMemoryManagement = true,
    enableViewportCulling = true,
    isMobile = false,
    enableMobileOptimizations = true,
    enableVercelOptimizations = true,
    enableDynamicImports = true,
    maxMemoryMB = 50,
    maxRenderItems = 300,
    performanceMode = 'balanced',
    enableDebugMode = process.env.NODE_ENV === 'development'
  } = config

  const optimizations = {
    performanceMonitor: null as KonvaPerformanceMonitor | null,
    memoryManager: null as KonvaMemoryManager | null,
    viewportCuller: null as ViewportCuller | null,
    mobileOptimizer: null as MobileKonvaOptimizer | null,
    vercelOptimizer: null as VercelKonvaOptimizer | null
  }

  // Initialize performance monitoring
  if (enablePerformanceMonitoring) {
    optimizations.performanceMonitor = createProductionPerformanceMonitor()
  }

  // Initialize memory management
  if (enableMemoryManagement) {
    optimizations.memoryManager = createProductionMemoryManager()
  }

  // Initialize viewport culling
  if (enableViewportCulling) {
    optimizations.viewportCuller = createViewportCuller({
      enableFrustumCulling: true,
      debug: enableDebugMode
    })
  }

  // Initialize mobile optimizations
  if (enableMobileOptimizations && isMobile) {
    optimizations.mobileOptimizer = createMobileKonvaOptimizer({
      enablePerformanceMode: performanceMode === 'performance'
    })
  }

  // Initialize Vercel optimizations
  if (enableVercelOptimizations) {
    optimizations.vercelOptimizer = createVercelOptimizedKonva({
      enableDynamicImports,
      maxBundleSize: maxMemoryMB * 1000 * 5, // 5KB per MB estimate
      enableEdgeOptimization: true
    })
  }

  return {
    ...optimizations,

    // Cleanup function
    destroy: () => {
      optimizations.performanceMonitor?.destroy()
      optimizations.memoryManager?.destroy()
      optimizations.viewportCuller?.clearSpatialIndex()
    },

    // Get optimized settings
    getOptimizedSettings: () => ({
      // Canvas settings
      pixelRatio: isMobile ? Math.min(window.devicePixelRatio, 2) : window.devicePixelRatio,
      imageSmoothingEnabled: performanceMode !== 'performance',
      clearBeforeDraw: true,
      perfectDrawEnabled: performanceMode === 'high',

      // Performance limits
      maxMemoryMB,
      maxRenderItems,

      // Feature flags
      enableViewportCulling,
      enablePinCaching: performanceMode !== 'performance',
      enableHitOptimization: true
    }),

    // Get mobile-specific settings
    getMobileSettings: () => isMobile ? getMobileCanvasSettings() : null,

    // Get performance stats
    getPerformanceStats: () => ({
      monitor: optimizations.performanceMonitor?.getCurrentStats(),
      memory: optimizations.memoryManager?.getCurrentMemoryUsage(),
      viewport: optimizations.viewportCuller?.getStats()
    })
  }
}

/**
 * Environment-based configuration factory
 */
export function createEnvironmentOptimizedConfig(): ProductionKonvaConfig {
  const isProduction = process.env.NODE_ENV === 'production'
  const isVercel = process.env.VERCEL === '1'
  const isMobile = typeof window !== 'undefined' && isMobileDevice()

  return {
    enablePerformanceMonitoring: !isProduction, // Only in development
    enableMemoryManagement: true,
    enableViewportCulling: true,
    isMobile,
    enableMobileOptimizations: isMobile,
    enableVercelOptimizations: isVercel,
    enableDynamicImports: isProduction,
    maxMemoryMB: isVercel ? 40 : 80, // Lower limit on Vercel
    maxRenderItems: isProduction ? 200 : 500,
    performanceMode: isProduction ? 'balanced' : 'high',
    enableDebugMode: !isProduction
  }
}

/**
 * Quick setup function for common use cases
 */
export function setupKonvaForProduction() {
  const config = createEnvironmentOptimizedConfig()
  return initializeProductionKonva(config)
}

/**
 * Utility function to get canvas dimensions optimized for device
 */
export function getOptimizedCanvasDimensions(
  containerElement: HTMLElement,
  isMobile: boolean = false
) {
  if (!containerElement) {
    return { width: 800, height: 600 }
  }

  const { width, height } = containerElement.getBoundingClientRect()

  return {
    width: Math.max(width, isMobile ? 320 : 600),
    height: Math.max(height, isMobile ? 480 : 400)
  }
}

/**
 * Type definitions for optimized Konva props
 */
export interface OptimizedKonvaProps {
  enablePerformanceMode?: boolean
  enableViewportCulling?: boolean
  enablePinCaching?: boolean
  maxRenderItems?: number
  performanceMode?: 'high' | 'balanced' | 'performance'
  isMobile?: boolean
  enableMobileOptimizations?: boolean
}

// Types are already exported above, removing duplicate exports

// Default export for convenience
const KonvaUtils = {
  initializeProductionKonva,
  setupKonvaForProduction,
  createEnvironmentOptimizedConfig,
  getOptimizedCanvasDimensions
}

export default KonvaUtils