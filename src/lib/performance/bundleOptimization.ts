// Bundle Optimization and Code Splitting Utilities
import dynamic from 'next/dynamic'
import React, { ComponentType, lazy, Suspense } from 'react'
import { LoadingSpinner } from '@/components/ui/loading-states'

// Dynamic import wrapper with loading states
export function dynamicImport<T = {}>(
  importFunction: () => Promise<{ default: ComponentType<T> }>,
  options: {
    loading?: ComponentType
    ssr?: boolean
    fallback?: React.ComponentType
  } = {}
) {
  const {
    loading,
    ssr = false,
    fallback
  } = options

  return dynamic(importFunction, {
    loading: loading ? () => React.createElement(loading as any) : undefined,
    ssr,
  })
}

// Dynamic component creation utility
// Use this to create code-split components on demand
// Example: const LazyComponent = createDynamicComponent(() => import('./MyComponent'))
export const createDynamicComponent = <T = {}>(
  importFunction: () => Promise<{ default: ComponentType<T> }>,
  options: { ssr?: boolean } = {}
) => {
  return dynamic(importFunction, {
    ssr: options.ssr ?? false,
  })
}

// Bundle size analysis utilities
export const BundleAnalytics = {
  // Track component loading times
  measureComponentLoad: (componentName: string) => {
    const startTime = performance.now()
    return () => {
      const endTime = performance.now()
      const loadTime = endTime - startTime
      
      // Send to analytics
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'component_load_time', {
          component_name: componentName,
          load_time: Math.round(loadTime),
          category: 'performance'
        })
      }
      
      console.debug(`Component ${componentName} loaded in ${loadTime.toFixed(2)}ms`)
    }
  },

  // Track bundle chunk loads
  trackChunkLoad: (chunkName: string, size?: number) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'chunk_loaded', {
        chunk_name: chunkName,
        chunk_size: size,
        category: 'bundle'
      })
    }
  }
}

// Preload critical components
export const preloadCriticalComponents = async () => {
  // Preload components that are likely to be used soon
  const criticalComponents = [
    () => import('@/components/dashboard/InteractiveRoofPlan'),
    () => import('@/components/canvas/PinCanvas'),
  ]

  // Use requestIdleCallback if available, otherwise setTimeout
  const schedulePreload = (fn: () => Promise<any>) => {
    if (typeof window !== 'undefined') {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(() => fn())
      } else {
        setTimeout(() => fn(), 0)
      }
    }
  }

  criticalComponents.forEach(schedulePreload)
}

// Image optimization utilities
export const ImageOptimization = {
  // Convert to WebP with fallback
  optimizeImageSrc: (src: string, width?: number, height?: number) => {
    const params = new URLSearchParams()
    if (width) params.set('w', width.toString())
    if (height) params.set('h', height.toString())
    params.set('f', 'webp')
    params.set('q', '85') // Quality setting
    
    return `/api/images/optimize?${params.toString()}&src=${encodeURIComponent(src)}`
  },

  // Lazy loading with intersection observer
  setupLazyLoading: () => {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement
            if (img.dataset.src) {
              img.src = img.dataset.src
              img.classList.remove('lazy')
              observer.unobserve(img)
            }
          }
        })
      })

      // Observe all lazy images
      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img)
      })
    }
  }
}

// Performance monitoring
export const PerformanceMonitoring = {
  // Web Vitals tracking (disabled - web-vitals package not installed)
  trackWebVitals: () => {
    if (typeof window !== 'undefined') {
      console.debug('Web vitals tracking disabled - web-vitals package not available')
      // TODO: Install web-vitals package to enable this functionality
      // import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      //   getCLS((metric: any) => { /* track CLS */ })
      //   getFID((metric: any) => { /* track FID */ })
      //   getFCP((metric: any) => { /* track FCP */ })
      //   getLCP((metric: any) => { /* track LCP */ })
      //   getTTFB((metric: any) => { /* track TTFB */ })
      // })
    }
  },

  // Bundle size tracking
  trackBundleSize: () => {
    if (typeof window !== 'undefined' && 'PerformanceNavigationTiming' in window) {
      window.addEventListener('load', () => {
        const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        const resourceTiming = performance.getEntriesByType('resource')
        
        let totalJSSize = 0
        let totalCSSSize = 0
        
        resourceTiming.forEach(resource => {
          if (resource.name.includes('.js')) {
            totalJSSize += (resource as any).transferSize || 0
          } else if (resource.name.includes('.css')) {
            totalCSSSize += (resource as any).transferSize || 0
          }
        })

        window.gtag?.('event', 'bundle_metrics', {
          total_js_size: totalJSSize,
          total_css_size: totalCSSSize,
          load_time: Math.round(navTiming.loadEventEnd - navTiming.fetchStart),
          category: 'performance'
        })
      })
    }
  }
}