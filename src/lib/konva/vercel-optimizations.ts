/**
 * Vercel Edge Runtime Optimizations for Konva.js
 *
 * Production-ready optimizations specifically for Vercel deployment
 * including edge runtime compatibility, dynamic imports, and build optimizations
 */

interface VercelConfig {
  enableDynamicImports?: boolean
  enableLazyLoading?: boolean
  enableBundleOptimization?: boolean
  enableEdgeOptimization?: boolean
  maxBundleSize?: number
  enableSSRSafety?: boolean
}

interface LazyLoadConfig {
  threshold?: number // Intersection observer threshold
  rootMargin?: string
  enablePreload?: boolean
  preloadDelay?: number
}

/**
 * Vercel-specific Konva optimizations
 */
export class VercelKonvaOptimizer {
  private config: Required<VercelConfig>
  private isEdgeRuntime: boolean
  private lazyComponents: Map<string, Promise<any>> = new Map()

  constructor(config: VercelConfig = {}) {
    this.config = {
      enableDynamicImports: config.enableDynamicImports ?? true,
      enableLazyLoading: config.enableLazyLoading ?? true,
      enableBundleOptimization: config.enableBundleOptimization ?? true,
      enableEdgeOptimization: config.enableEdgeOptimization ?? true,
      maxBundleSize: config.maxBundleSize ?? 250000, // 250KB
      enableSSRSafety: config.enableSSRSafety ?? true
    }

    // Detect if running in Vercel Edge Runtime
    this.isEdgeRuntime = this.detectEdgeRuntime()
  }

  /**
   * Get optimized dynamic import for Konva components
   */
  getDynamicKonvaImport() {
    if (!this.config.enableDynamicImports) {
      return import('react-konva')
    }

    // Cache the import promise
    if (!this.lazyComponents.has('konva-main')) {
      this.lazyComponents.set('konva-main', this.createOptimizedKonvaImport())
    }

    return this.lazyComponents.get('konva-main')!
  }

  /**
   * Create lazy loader for Konva canvas components
   */
  createLazyCanvasLoader(config?: LazyLoadConfig) {
    const lazyConfig = {
      threshold: config?.threshold ?? 0.1,
      rootMargin: config?.rootMargin ?? '50px',
      enablePreload: config?.enablePreload ?? true,
      preloadDelay: config?.preloadDelay ?? 1000
    }

    const optimizerInstance = this

    return class LazyKonvaCanvas {
      private observer: IntersectionObserver | null = null
      private isLoaded = false
      private loadPromise: Promise<any> | null = null

      constructor(private element: HTMLElement) {
        if (lazyConfig.enablePreload) {
          this.setupIntersectionObserver(lazyConfig)
        } else {
          this.loadCanvas()
        }
      }

      private setupIntersectionObserver(config: Required<LazyLoadConfig>) {
        if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
          this.loadCanvas()
          return
        }

        this.observer = new IntersectionObserver(
          (entries) => {
            entries.forEach(entry => {
              if (entry.isIntersecting && !this.isLoaded) {
                this.loadCanvas()
                this.observer?.disconnect()
              }
            })
          },
          {
            threshold: config.threshold,
            rootMargin: config.rootMargin
          }
        )

        this.observer.observe(this.element)

        // Preload after delay if enabled
        if (config.enablePreload) {
          setTimeout(() => {
            if (!this.isLoaded) {
              this.preloadCanvas()
            }
          }, config.preloadDelay)
        }
      }

      private async loadCanvas() {
        if (this.isLoaded || this.loadPromise) return this.loadPromise

        this.isLoaded = true
        this.loadPromise = optimizerInstance.getDynamicKonvaImport()

        try {
          return await this.loadPromise
        } catch (error) {
          console.error('Failed to load Konva canvas:', error)
          this.isLoaded = false
          this.loadPromise = null
          throw error
        }
      }

      private async preloadCanvas() {
        if (!this.isLoaded && !this.loadPromise) {
          // Create the import but don't mark as loaded
          this.loadPromise = optimizerInstance.getDynamicKonvaImport()
        }
      }

      destroy() {
        if (this.observer) {
          this.observer.disconnect()
          this.observer = null
        }
      }
    }
  }

  /**
   * Optimize bundle imports for Vercel
   */
  getOptimizedImports() {
    // Return minimal imports for better tree shaking
    return {
      Stage: () => import('react-konva').then(m => ({ default: m.Stage })),
      Layer: () => import('react-konva').then(m => ({ default: m.Layer })),
      Circle: () => import('react-konva').then(m => ({ default: m.Circle })),
      Text: () => import('react-konva').then(m => ({ default: m.Text })),
      Group: () => import('react-konva').then(m => ({ default: m.Group })),
      Image: () => import('react-konva').then(m => ({ default: m.Image })),
      Rect: () => import('react-konva').then(m => ({ default: m.Rect })),
      Line: () => import('react-konva').then(m => ({ default: m.Line }))
    }
  }

  /**
   * Generate Vercel-optimized build configuration
   */
  getVercelBuildConfig() {
    return {
      // Next.js config optimizations
      webpack: (config: any, { isServer }: any) => {
        if (!isServer) {
          // Client-side optimizations
          config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
            net: false,
            tls: false,
            canvas: false
          }

          // Optimize Konva bundle splitting
          if (config.optimization?.splitChunks?.cacheGroups) {
            config.optimization.splitChunks.cacheGroups.konva = {
              test: /[\\/]node_modules[\\/](konva|react-konva)[\\/]/,
              name: 'konva',
              chunks: 'all',
              priority: 30,
              enforce: true,
              maxSize: this.config.maxBundleSize
            }
          }
        }

        // Edge runtime optimizations
        if (this.isEdgeRuntime) {
          config.externals = config.externals || []
          config.externals.push({
            canvas: 'canvas',
            'node-canvas': 'node-canvas'
          })
        }

        return config
      },

      // Experimental features for better performance
      experimental: {
        optimizePackageImports: ['konva', 'react-konva'],
        scrollRestoration: true,
        webpackBuildWorker: !this.isEdgeRuntime,
        optimizeServerReact: false // Disable for canvas components
      },

      // Image optimization
      images: {
        formats: ['image/webp', 'image/avif'],
        minimumCacheTTL: 3600,
        deviceSizes: [640, 750, 828, 1080, 1200, 1920],
        imageSizes: [16, 32, 48, 64, 96, 128, 256]
      },

      // Compression
      compress: true,
      swcMinify: true
    }
  }

  /**
   * Create SSR-safe Konva component loader
   */
  createSSRSafeLoader() {
    if (!this.config.enableSSRSafety) {
      return null
    }

    const NoSSRComponent = ({ children, fallback }: any) => {
      const [isMounted, setIsMounted] = React.useState(false)

      React.useEffect(() => {
        setIsMounted(true)
      }, [])

      if (!isMounted) {
        return fallback || null
      }

      return children
    }

    return NoSSRComponent
  }

  /**
   * Get Vercel edge-compatible canvas settings
   */
  getEdgeCompatibleSettings() {
    return {
      // Disable features that don't work in edge runtime
      enableWebGL: false,
      enableWorkers: false,
      enableOffscreenCanvas: false,

      // Optimize for edge runtime constraints
      maxMemoryMB: 30, // Lower memory limit in edge runtime
      enableMemoryOptimization: true,
      enableAggressiveCleanup: true,

      // Performance settings for edge
      pixelRatio: Math.min(window?.devicePixelRatio || 1, 2),
      imageSmoothingEnabled: false,
      clearBeforeDraw: true,
      perfectDrawEnabled: false
    }
  }

  /**
   * Create performance monitor optimized for Vercel
   */
  createVercelPerformanceMonitor() {
    return {
      // Minimal monitoring for production
      enableMonitoring: process.env['NODE_ENV'] === 'development',
      sampleRate: 0.1, // 10% sampling in production
      reportingEndpoint: '/api/performance', // Custom endpoint for Vercel

      // Edge runtime compatible monitoring
      useNavigationTiming: true,
      usePerformanceObserver: !this.isEdgeRuntime,
      enableMemoryTracking: !this.isEdgeRuntime
    }
  }

  private createOptimizedKonvaImport() {
    // Progressive loading: load core first, then additional components
    return Promise.all([
      import('react-konva').then(module => ({ Stage: module.Stage })),
      import('react-konva').then(module => ({ Layer: module.Layer })),
      new Promise(resolve => {
        // Delay loading of non-essential components
        setTimeout(async () => {
          try {
            const additional = await Promise.all([
              import('react-konva').then(module => ({ Group: module.Group })).catch(() => ({})),
              import('react-konva').then(module => ({ Circle: module.Circle })).catch(() => ({})),
              import('react-konva').then(module => ({ Text: module.Text })).catch(() => ({})),
              import('react-konva').then(module => ({ Image: module.Image })).catch(() => ({})),
              import('react-konva').then(module => ({ Rect: module.Rect })).catch(() => ({}))
            ])
            resolve(additional)
          } catch {
            resolve([])
          }
        }, 100)
      })
    ]).then(([stage, layer, additional]) => ({
      Stage: stage.Stage,
      Layer: layer.Layer,
      ...(Array.isArray(additional) ? additional.reduce((acc: any, curr: any) => ({ ...acc, ...curr }), {}) : {})
    }))
  }

  private detectEdgeRuntime(): boolean {
    if (typeof window === 'undefined') return false

    // Check for Vercel Edge Runtime specific globals
    return (
      typeof (globalThis as any).EdgeRuntime !== 'undefined' ||
      (typeof process !== 'undefined' && process.env['VERCEL_REGION'] !== undefined) ||
      (typeof navigator !== 'undefined' && navigator.userAgent.includes('Vercel-Edge-Runtime'))
    )
  }
}

/**
 * Utility to create Next.js dynamic import for Konva components
 * Note: This requires the component to be imported at usage site due to JSX resolution
 */
export function createDynamicKonvaComponent(
  componentName: string,
  options: {
    ssr?: boolean
    loading?: React.ComponentType<any>
  } = {}
) {
  const dynamic = require('next/dynamic')

  // Return a placeholder that needs to be properly implemented at usage site
  return dynamic(
    () => Promise.resolve({ default: () => null }),
    {
      ssr: options.ssr ?? false,
      loading: options.loading ?? (() => null)
    }
  )
}

/**
 * Vercel deployment helper for Konva applications
 */
export class VercelDeploymentHelper {
  /**
   * Generate build-time optimizations
   */
  static generateBuildOptimizations() {
    return {
      // Environment variables for Vercel
      env: {
        NEXT_PUBLIC_KONVA_PERFORMANCE_MODE: process.env['NODE_ENV'] === 'production' ? 'true' : 'false',
        NEXT_PUBLIC_ENABLE_CANVAS_OPTIMIZATION: 'true'
      },

      // Build-time feature flags
      publicRuntimeConfig: {
        enableKonvaOptimizations: true,
        enableLazyLoading: true,
        enableViewportCulling: true
      },

      // Headers for better caching
      async headers() {
        return [
          {
            source: '/_next/static/chunks/konva-:hash.js',
            headers: [
              {
                key: 'Cache-Control',
                value: 'public, max-age=31536000, immutable'
              }
            ]
          }
        ]
      }
    }
  }

  /**
   * Generate Vercel-specific environment configuration
   */
  static getEnvironmentConfig() {
    const isProduction = process.env['NODE_ENV'] === 'production'
    const isVercel = process.env['VERCEL'] === '1'

    return {
      // Canvas optimizations
      KONVA_PIXEL_RATIO: isProduction ? '2' : 'auto',
      KONVA_ENABLE_HIT_OPTIMIZATION: 'true',
      KONVA_ENABLE_MEMORY_MANAGEMENT: 'true',

      // Performance settings
      KONVA_MAX_MEMORY_MB: isVercel ? '50' : '100',
      KONVA_ENABLE_VIEWPORT_CULLING: 'true',
      KONVA_MAX_RENDER_ITEMS: isProduction ? '300' : '500',

      // Debug settings
      KONVA_ENABLE_DEBUG: isProduction ? 'false' : 'true',
      KONVA_PERFORMANCE_MONITORING: isProduction ? 'minimal' : 'full'
    }
  }
}

/**
 * Create Vercel-optimized Konva instance
 */
export function createVercelOptimizedKonva(config?: VercelConfig) {
  return new VercelKonvaOptimizer({
    enableDynamicImports: true,
    enableLazyLoading: true,
    enableBundleOptimization: true,
    enableEdgeOptimization: true,
    maxBundleSize: 200000, // 200KB for better performance
    enableSSRSafety: true,
    ...config
  })
}

// React import (for TypeScript)
import * as React from 'react'

export default VercelKonvaOptimizer