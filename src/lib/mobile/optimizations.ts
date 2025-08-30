// Mobile Optimizations & Progressive Enhancement
// Enhances performance and UX specifically for mobile devices

export class MobileOptimizer {
  private static instance: MobileOptimizer
  private touchEnabled = false
  private viewport = { width: 0, height: 0 }
  private connectionType: string | null = null
  private deviceMemory: number | null = null

  private constructor() {
    this.initialize()
  }

  static getInstance(): MobileOptimizer {
    if (!MobileOptimizer.instance) {
      MobileOptimizer.instance = new MobileOptimizer()
    }
    return MobileOptimizer.instance
  }

  private initialize() {
    if (typeof window === 'undefined') return

    // Detect touch capabilities
    this.touchEnabled = 'ontouchstart' in window || navigator.maxTouchPoints > 0

    // Get viewport dimensions
    this.updateViewport()
    window.addEventListener('resize', () => this.updateViewport())
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.updateViewport(), 100)
    })

    // Get connection information
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
    this.connectionType = connection?.effectiveType || null

    // Get device memory info
    this.deviceMemory = (navigator as any).deviceMemory || null

    // Apply mobile optimizations
    this.applyOptimizations()
  }

  private updateViewport() {
    this.viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    }
  }

  private applyOptimizations() {
    if (this.isMobile()) {
      this.optimizeForMobile()
    }

    if (this.isLowEndDevice()) {
      this.applyLowEndOptimizations()
    }

    if (this.isSlowConnection()) {
      this.applySlowConnectionOptimizations()
    }
  }

  // Device detection
  isMobile(): boolean {
    return this.viewport.width <= 768 || this.touchEnabled
  }

  isTablet(): boolean {
    return this.viewport.width > 768 && this.viewport.width <= 1024 && this.touchEnabled
  }

  isDesktop(): boolean {
    return this.viewport.width > 1024 && !this.touchEnabled
  }

  isLowEndDevice(): boolean {
    return (this.deviceMemory !== null && this.deviceMemory <= 4) ||
           this.viewport.width <= 360
  }

  isSlowConnection(): boolean {
    return this.connectionType === 'slow-2g' || 
           this.connectionType === '2g' || 
           this.connectionType === '3g'
  }

  // Mobile-specific optimizations
  private optimizeForMobile() {
    // Optimize touch interactions
    this.optimizeTouchInteractions()

    // Reduce animation complexity on mobile
    this.optimizeAnimations()

    // Implement lazy loading for images
    this.setupLazyLoading()

    // Optimize viewport handling
    this.optimizeViewport()
  }

  private optimizeTouchInteractions() {
    // Add touch-action: manipulation to prevent 300ms delay
    document.body.style.touchAction = 'manipulation'

    // Optimize scrolling
    ;(document.body.style as any).webkitOverflowScrolling = 'touch'
    ;(document.body.style as any).overscrollBehavior = 'contain'

    // Add passive event listeners for better scroll performance
    const passiveEvents = ['touchstart', 'touchmove', 'wheel']
    passiveEvents.forEach(event => {
      document.addEventListener(event, () => {}, { passive: true })
    })
  }

  private optimizeAnimations() {
    const style = document.createElement('style')
    style.textContent = `
      @media (prefers-reduced-motion: reduce) {
        * {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }
      
      /* Optimize animations for mobile */
      @media (max-width: 768px) {
        .animate-spin,
        .animate-pulse,
        .animate-bounce {
          animation-duration: 1s;
        }
        
        .transition-all {
          transition-duration: 200ms;
        }
      }
    `
    document.head.appendChild(style)
  }

  private setupLazyLoading() {
    if ('IntersectionObserver' in window) {
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
      }, {
        rootMargin: '50px'
      })

      // Observe all images with data-src
      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img)
      })
    }
  }

  private optimizeViewport() {
    // Prevent zoom on form inputs
    const meta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement
    if (meta) {
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
    }

    // Handle virtual keyboard
    if ('visualViewport' in window) {
      const visualViewport = window.visualViewport!
      
      visualViewport.addEventListener('resize', () => {
        const heightDifference = window.innerHeight - visualViewport.height
        if (heightDifference > 150) { // Virtual keyboard is likely open
          document.body.style.paddingBottom = `${heightDifference}px`
        } else {
          document.body.style.paddingBottom = '0'
        }
      })
    }
  }

  // Low-end device optimizations
  private applyLowEndOptimizations() {
    // Reduce image quality
    this.optimizeImageLoading()

    // Disable expensive effects
    this.disableExpensiveEffects()

    // Limit concurrent operations
    this.limitConcurrentOperations()
  }

  private optimizeImageLoading() {
    const style = document.createElement('style')
    style.textContent = `
      /* Lower quality images for low-end devices */
      img {
        image-rendering: optimizeSpeed;
        image-rendering: -webkit-optimize-contrast;
      }
      
      /* Reduce blur effects */
      .backdrop-blur-sm,
      .backdrop-blur-md,
      .backdrop-blur-lg {
        backdrop-filter: none !important;
        background-color: rgba(255, 255, 255, 0.8) !important;
      }
    `
    document.head.appendChild(style)
  }

  private disableExpensiveEffects() {
    const style = document.createElement('style')
    style.textContent = `
      /* Disable expensive CSS effects on low-end devices */
      .shadow-lg,
      .shadow-xl,
      .shadow-2xl {
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1) !important;
      }
      
      .gradient {
        background: #f3f4f6 !important;
      }
      
      .filter,
      .backdrop-filter {
        filter: none !important;
        backdrop-filter: none !important;
      }
    `
    document.head.appendChild(style)
  }

  private limitConcurrentOperations() {
    // Override fetch to limit concurrent requests
    const originalFetch = window.fetch
    let activeRequests = 0
    const maxConcurrentRequests = 4

    window.fetch = async (...args) => {
      while (activeRequests >= maxConcurrentRequests) {
        await new Promise(resolve => setTimeout(resolve, 10))
      }
      
      activeRequests++
      try {
        return await originalFetch(...args)
      } finally {
        activeRequests--
      }
    }
  }

  // Slow connection optimizations
  private applySlowConnectionOptimizations() {
    // Aggressive image compression
    this.enableAggressiveImageCompression()

    // Preload critical resources only
    this.preloadCriticalResources()

    // Enable data saver mode
    this.enableDataSaverMode()
  }

  private enableAggressiveImageCompression() {
    // Replace image URLs with compressed versions
    const images = document.querySelectorAll('img')
    images.forEach(img => {
      const src = img.src
      if (src && src.includes('/photos/')) {
        // Add compression parameters
        const url = new URL(src)
        url.searchParams.set('q', '60') // Low quality
        url.searchParams.set('w', '400') // Max width
        img.src = url.toString()
      }
    })
  }

  private preloadCriticalResources() {
    const criticalResources = [
      '/',
      '/manifest.json',
      '/icons/icon-192x192.png'
    ]

    criticalResources.forEach(href => {
      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.href = href
      document.head.appendChild(link)
    })
  }

  private enableDataSaverMode() {
    // Store data saver preference
    localStorage.setItem('smartpin-data-saver', 'enabled')

    // Disable auto-play videos
    const videos = document.querySelectorAll('video')
    videos.forEach(video => {
      video.autoplay = false
      video.preload = 'none'
    })

    // Reduce polling frequency by overriding setInterval
    const originalSetInterval = window.setInterval
    window.setInterval = ((callback: any, delay: any, ...args: any[]) => {
      // Double the interval to reduce network usage
      return originalSetInterval(callback, Math.max(delay * 2, 1000), ...args)
    }) as typeof window.setInterval
  }

  // Public methods for component integration
  getOptimizedImageSrc(src: string): string {
    if (this.isLowEndDevice()) {
      const url = new URL(src)
      url.searchParams.set('q', '60')
      url.searchParams.set('w', '400')
      return url.toString()
    }

    if (this.isSlowConnection()) {
      const url = new URL(src)
      url.searchParams.set('q', '70')
      url.searchParams.set('w', '800')
      return url.toString()
    }

    return src
  }

  getOptimizedVideoSettings(): { preload: string; autoplay: boolean } {
    if (this.isSlowConnection()) {
      return { preload: 'none', autoplay: false }
    }

    return { preload: 'metadata', autoplay: false }
  }

  shouldUseReducedAnimations(): boolean {
    return this.isLowEndDevice() || 
           window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  getOptimalChunkSize(): number {
    if (this.isSlowConnection()) return 1024 * 512 // 512KB
    if (this.isLowEndDevice()) return 1024 * 1024 // 1MB
    return 1024 * 1024 * 2 // 2MB
  }

  // Performance monitoring
  measurePerformance(name: string, fn: () => void | Promise<void>) {
    if (typeof performance !== 'undefined' && performance.mark) {
      const startMark = `${name}-start`
      const endMark = `${name}-end`
      const measureName = `${name}-duration`

      performance.mark(startMark)
      
      const result = fn()
      
      if (result instanceof Promise) {
        return result.finally(() => {
          performance.mark(endMark)
          performance.measure(measureName, startMark, endMark)
        })
      } else {
        performance.mark(endMark)
        performance.measure(measureName, startMark, endMark)
        return result
      }
    }

    return fn()
  }

  // Battery optimization
  optimizeForBatteryLife() {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        if (battery.level < 0.2) { // Battery below 20%
          // Reduce animation frequency
          this.shouldUseReducedAnimations = () => true

          // Reduce polling frequency
          const originalSetTimeout = window.setTimeout
          window.setTimeout = ((callback: any, delay: any) => {
            return originalSetTimeout(callback, Math.max(delay * 1.5, 100))
          }) as typeof window.setTimeout

          // Disable vibrations
          if ('vibrate' in navigator) {
            navigator.vibrate = () => false
          }
        }
      })
    }
  }

  // Service Worker integration
  registerServiceWorkerUpdates() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'CACHE_UPDATED') {
          // Show update notification
          this.showUpdateNotification()
        }
      })
    }
  }

  private showUpdateNotification() {
    const notification = document.createElement('div')
    notification.className = 'fixed bottom-4 right-4 bg-blue-500 text-white p-4 rounded-lg shadow-lg z-50'
    notification.innerHTML = `
      <div class="flex items-center space-x-2">
        <span>App updated! Refresh to see changes.</span>
        <button onclick="window.location.reload()" class="bg-white text-blue-500 px-2 py-1 rounded text-sm">
          Refresh
        </button>
        <button onclick="this.parentElement.parentElement.remove()" class="text-white/70 hover:text-white">
          ×
        </button>
      </div>
    `
    document.body.appendChild(notification)

    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove()
      }
    }, 10000)
  }
}

// React Hook for mobile optimizations
export function useMobileOptimizer() {
  const optimizer = MobileOptimizer.getInstance()

  return {
    isMobile: optimizer.isMobile(),
    isTablet: optimizer.isTablet(),
    isDesktop: optimizer.isDesktop(),
    isLowEndDevice: optimizer.isLowEndDevice(),
    isSlowConnection: optimizer.isSlowConnection(),
    shouldUseReducedAnimations: optimizer.shouldUseReducedAnimations(),
    getOptimizedImageSrc: optimizer.getOptimizedImageSrc.bind(optimizer),
    getOptimizedVideoSettings: optimizer.getOptimizedVideoSettings.bind(optimizer),
    getOptimalChunkSize: optimizer.getOptimalChunkSize.bind(optimizer),
    measurePerformance: optimizer.measurePerformance.bind(optimizer)
  }
}

// Initialize mobile optimizer
export const mobileOptimizer = MobileOptimizer.getInstance()

// Auto-initialize on import
if (typeof window !== 'undefined') {
  // Wait for DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      mobileOptimizer.optimizeForBatteryLife()
      mobileOptimizer.registerServiceWorkerUpdates()
    })
  } else {
    mobileOptimizer.optimizeForBatteryLife()
    mobileOptimizer.registerServiceWorkerUpdates()
  }
}