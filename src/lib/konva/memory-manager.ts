/**
 * Konva Memory Manager
 *
 * Production-ready memory management for Konva.js applications
 * Optimized for Vercel deployment with aggressive cleanup strategies
 */

interface MemoryConfig {
  checkInterval?: number
  maxMemoryMB?: number
  enableAutomaticCleanup?: boolean
  onMemoryWarning?: (usage: number, threshold: number) => void
  onCleanupComplete?: (freedMemory: number) => void
}

interface CacheableNode {
  id: string
  node: any
  lastAccessed: number
  size: number
  priority: number
}

export class KonvaMemoryManager {
  private config: Required<MemoryConfig>
  private cachedNodes: Map<string, CacheableNode> = new Map()
  private imageCache: Map<string, HTMLImageElement> = new Map()
  private timerInterval: NodeJS.Timeout | null = null
  private isRunning = false
  private initialMemoryUsage = 0

  // Memory thresholds
  private readonly CACHE_SIZE_LIMIT = 50 // Max cached nodes
  private readonly IMAGE_CACHE_LIMIT = 20 // Max cached images
  private readonly STALE_THRESHOLD = 5 * 60 * 1000 // 5 minutes
  private readonly CLEANUP_THRESHOLD_MB = 80 // Start cleanup at 80MB

  constructor(config: MemoryConfig = {}) {
    this.config = {
      checkInterval: config.checkInterval ?? 30000, // 30 seconds
      maxMemoryMB: config.maxMemoryMB ?? 100, // 100MB limit
      enableAutomaticCleanup: config.enableAutomaticCleanup ?? true,
      onMemoryWarning: config.onMemoryWarning ?? (() => {}),
      onCleanupComplete: config.onCleanupComplete ?? (() => {})
    }

    if (typeof window !== 'undefined') {
      this.initialMemoryUsage = this.getCurrentMemoryUsage()
      this.start()
    }
  }

  /**
   * Start memory monitoring
   */
  start(): void {
    if (this.isRunning || typeof window === 'undefined') return

    this.isRunning = true

    // Set up regular memory checks
    this.timerInterval = setInterval(() => {
      this.performMemoryCheck()
    }, this.config.checkInterval)

    // Set up cleanup on visibility change (when tab becomes hidden)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.performAggressiveCleanup()
      }
    })

    // Set up cleanup before page unload
    window.addEventListener('beforeunload', () => {
      this.destroy()
    })

    // Set up cleanup on memory pressure (if supported)
    if ('memory' in performance && 'onmemory' in window) {
      ;(window as any).onmemory = () => {
        this.performEmergencyCleanup()
      }
    }
  }

  /**
   * Stop memory monitoring
   */
  stop(): void {
    this.isRunning = false
    if (this.timerInterval) {
      clearInterval(this.timerInterval)
      this.timerInterval = null
    }
  }

  /**
   * Cache a Konva node for reuse
   */
  cacheNode(id: string, node: any, priority: number = 1): void {
    if (!node || !id) return

    // Remove oldest items if cache is full
    if (this.cachedNodes.size >= this.CACHE_SIZE_LIMIT) {
      this.removeOldestCachedNode()
    }

    // Estimate node size (rough approximation)
    const size = this.estimateNodeSize(node)

    this.cachedNodes.set(id, {
      id,
      node,
      lastAccessed: Date.now(),
      size,
      priority
    })
  }

  /**
   * Retrieve a cached node
   */
  getCachedNode(id: string): any | null {
    const cached = this.cachedNodes.get(id)
    if (cached) {
      cached.lastAccessed = Date.now()
      return cached.node
    }
    return null
  }

  /**
   * Remove a node from cache
   */
  removeCachedNode(id: string): void {
    const cached = this.cachedNodes.get(id)
    if (cached) {
      // Clean up the node
      if (cached.node && typeof cached.node.destroy === 'function') {
        cached.node.destroy()
      }
      this.cachedNodes.delete(id)
    }
  }

  /**
   * Cache an image with automatic cleanup
   */
  cacheImage(url: string, image: HTMLImageElement): void {
    if (!url || !image) return

    // Remove oldest images if cache is full
    if (this.imageCache.size >= this.IMAGE_CACHE_LIMIT) {
      const oldestUrl = this.imageCache.keys().next().value
      if (oldestUrl) {
        this.removeImageFromCache(oldestUrl)
      }
    }

    this.imageCache.set(url, image)
  }

  /**
   * Get cached image
   */
  getCachedImage(url: string): HTMLImageElement | null {
    return this.imageCache.get(url) || null
  }

  /**
   * Remove image from cache
   */
  removeImageFromCache(url: string): void {
    const image = this.imageCache.get(url)
    if (image) {
      // Clean up image resources
      image.onload = null
      image.onerror = null
      image.src = ''
    }
    this.imageCache.delete(url)
  }

  /**
   * Get current memory usage in MB
   */
  getCurrentMemoryUsage(): number {
    if (typeof window === 'undefined') return 0

    // Use performance.memory if available (Chrome)
    if ('memory' in performance) {
      const memory = (performance as any).memory
      return Math.round(memory.usedJSHeapSize / (1024 * 1024))
    }

    // Fallback estimation
    const estimatedUsage = (
      this.cachedNodes.size * 0.1 + // Estimate based on cached nodes
      this.imageCache.size * 0.5 + // Estimate based on cached images
      (typeof document !== 'undefined' ? document.querySelectorAll('*').length * 0.001 : 0)
    )

    return Math.round(estimatedUsage)
  }

  /**
   * Get memory usage relative to initial state
   */
  getRelativeMemoryUsage(): number {
    return this.getCurrentMemoryUsage() - this.initialMemoryUsage
  }

  /**
   * Perform routine memory cleanup
   */
  performCleanup(): number {
    let freedMemory = 0
    const before = this.getCurrentMemoryUsage()

    // Clean up stale cached nodes
    const staleThreshold = Date.now() - this.STALE_THRESHOLD
    const staleNodes: string[] = []

    this.cachedNodes.forEach((cached, id) => {
      if (cached.lastAccessed < staleThreshold) {
        staleNodes.push(id)
      }
    })

    staleNodes.forEach(id => {
      this.removeCachedNode(id)
    })

    // Clean up unused images
    if (this.imageCache.size > this.IMAGE_CACHE_LIMIT / 2) {
      const imagesToRemove = Array.from(this.imageCache.keys())
        .slice(0, Math.floor(this.imageCache.size / 2))

      imagesToRemove.forEach(url => {
        this.removeImageFromCache(url)
      })
    }

    // Force garbage collection if available (development only)
    if (process.env.NODE_ENV === 'development' && (window as any).gc) {
      ;(window as any).gc()
    }

    const after = this.getCurrentMemoryUsage()
    freedMemory = before - after

    if (freedMemory > 0) {
      this.config.onCleanupComplete(freedMemory)
    }

    return freedMemory
  }

  /**
   * Perform aggressive cleanup for memory pressure
   */
  performAggressiveCleanup(): number {
    const before = this.getCurrentMemoryUsage()

    // Clear all caches
    this.cachedNodes.forEach((cached, id) => {
      this.removeCachedNode(id)
    })
    this.cachedNodes.clear()

    // Clear image cache
    this.imageCache.forEach((image, url) => {
      this.removeImageFromCache(url)
    })
    this.imageCache.clear()

    const after = this.getCurrentMemoryUsage()
    const freedMemory = before - after

    this.config.onCleanupComplete(freedMemory)
    return freedMemory
  }

  /**
   * Emergency cleanup for critical memory pressure
   */
  performEmergencyCleanup(): void {
    console.warn('[Konva Memory Manager] Emergency cleanup triggered')

    // Immediate aggressive cleanup
    this.performAggressiveCleanup()

    // Request immediate garbage collection
    if ((window as any).gc) {
      ;(window as any).gc()
    }

    // Force browser to release memory
    setTimeout(() => {
      // Create and destroy a large array to trigger GC
      let dummy: any[] | null = new Array(1000000).fill(0)
      dummy = null
    }, 100)
  }

  /**
   * Destroy the memory manager and clean up all resources
   */
  destroy(): void {
    this.stop()
    this.performAggressiveCleanup()
  }

  /**
   * Estimate the memory size of a Konva node
   */
  private estimateNodeSize(node: any): number {
    if (!node) return 0

    let size = 100 // Base size

    // Add size for common properties
    if (node.children) {
      size += node.children.length * 50
    }

    if (node.cache && node.cache()) {
      size += 200 // Cached nodes are larger
    }

    if (node.filters && node.filters.length > 0) {
      size += node.filters.length * 100
    }

    return size
  }

  /**
   * Remove the oldest cached node
   */
  private removeOldestCachedNode(): void {
    let oldestId: string | null = null
    let oldestTime = Date.now()

    this.cachedNodes.forEach((cached, id) => {
      if (cached.lastAccessed < oldestTime || (cached.lastAccessed === oldestTime && cached.priority < 1)) {
        oldestTime = cached.lastAccessed
        oldestId = id
      }
    })

    if (oldestId) {
      this.removeCachedNode(oldestId)
    }
  }

  /**
   * Perform regular memory check
   */
  private performMemoryCheck(): void {
    if (!this.isRunning) return

    const currentUsage = this.getCurrentMemoryUsage()

    // Check if we're approaching the memory limit
    if (currentUsage > this.CLEANUP_THRESHOLD_MB) {
      this.config.onMemoryWarning(currentUsage, this.config.maxMemoryMB)

      if (this.config.enableAutomaticCleanup) {
        this.performCleanup()
      }
    }

    // Emergency cleanup if we exceed the limit
    if (currentUsage > this.config.maxMemoryMB) {
      console.warn(`[Konva Memory Manager] Memory limit exceeded: ${currentUsage}MB > ${this.config.maxMemoryMB}MB`)
      this.performEmergencyCleanup()
    }
  }
}

/**
 * Create a memory manager with production defaults
 */
export function createProductionMemoryManager(): KonvaMemoryManager {
  return new KonvaMemoryManager({
    checkInterval: 60000, // Check every minute
    maxMemoryMB: 50, // Lower limit for production
    enableAutomaticCleanup: true,
    onMemoryWarning: (usage, threshold) => {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[Konva Memory] High usage: ${usage}MB (limit: ${threshold}MB)`)
      }
    },
    onCleanupComplete: (freed) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Konva Memory] Cleanup freed ${freed}MB`)
      }
    }
  })
}