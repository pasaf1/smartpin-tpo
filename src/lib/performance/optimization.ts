import { useState, useEffect, useCallback, useMemo, lazy } from 'react'

export function useVirtualization<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  buffer: number = 5
) {
  const [scrollTop, setScrollTop] = useState(0)

  const visibleRange = useMemo(() => {
    const visibleItemCount = Math.ceil(containerHeight / itemHeight)
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer)
    const endIndex = Math.min(items.length - 1, startIndex + visibleItemCount + buffer * 2)
    
    return { startIndex, endIndex, visibleItemCount }
  }, [scrollTop, itemHeight, containerHeight, buffer, items.length])

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1).map((item, index) => ({
      item,
      index: visibleRange.startIndex + index,
      style: {
        position: 'absolute' as const,
        top: (visibleRange.startIndex + index) * itemHeight,
        height: itemHeight,
        width: '100%'
      }
    }))
  }, [items, visibleRange, itemHeight])

  const totalHeight = items.length * itemHeight

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop)
  }, [])

  return {
    visibleItems,
    totalHeight,
    handleScroll,
    visibleRange
  }
}

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const [lastCall, setLastCall] = useState(0)

  return useCallback((...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastCall >= delay) {
      setLastCall(now)
      return callback(...args)
    }
  }, [callback, delay, lastCall]) as T
}

export function useMemoizedSelector<T, R>(
  data: T,
  selector: (data: T) => R,
  deps: React.DependencyList
): R {
  return useMemo(() => selector(data), [data, ...deps])
}

export class LazyLoader {
  private loadedModules = new Map<string, any>()
  private loadingPromises = new Map<string, Promise<any>>()

  async loadComponent(moduleName: string, loader: () => Promise<any>) {
    if (this.loadedModules.has(moduleName)) {
      return this.loadedModules.get(moduleName)
    }

    if (this.loadingPromises.has(moduleName)) {
      return this.loadingPromises.get(moduleName)
    }

    const loadingPromise = loader().then(module => {
      this.loadedModules.set(moduleName, module)
      this.loadingPromises.delete(moduleName)
      return module
    }).catch(error => {
      this.loadingPromises.delete(moduleName)
      throw error
    })

    this.loadingPromises.set(moduleName, loadingPromise)
    return loadingPromise
  }

  preloadComponent(moduleName: string, loader: () => Promise<any>) {
    if (!this.loadedModules.has(moduleName) && !this.loadingPromises.has(moduleName)) {
      this.loadComponent(moduleName, loader).catch(console.error)
    }
  }

  clearCache() {
    this.loadedModules.clear()
    this.loadingPromises.clear()
  }
}

export const lazyLoader = new LazyLoader()

export function createLazyComponent<T = any>(
  moduleName: string,
  loader: () => Promise<{ default: T }>
) {
  return lazy(() => lazyLoader.loadComponent(moduleName, loader))
}

export function useIntersectionObserver(
  targetRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false)

  useEffect(() => {
    const target = targetRef.current
    if (!target) return

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setIsIntersecting(entry.isIntersecting)
      }
    }, {
      threshold: 0.1,
      rootMargin: '50px',
      ...options
    })

    observer.observe(target)

    return () => {
      observer.unobserve(target)
    }
  }, [targetRef, options])

  return isIntersecting
}

export function useImagePreloader(urls: string[]) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set())

  const preloadImage = useCallback((url: string) => {
    if (loadedImages.has(url) || loadingImages.has(url)) return

    setLoadingImages(prev => new Set(prev).add(url))

    const img = new Image()
    img.onload = () => {
      setLoadedImages(prev => new Set(prev).add(url))
      setLoadingImages(prev => {
        const newSet = new Set(prev)
        newSet.delete(url)
        return newSet
      })
    }
    img.onerror = () => {
      setLoadingImages(prev => {
        const newSet = new Set(prev)
        newSet.delete(url)
        return newSet
      })
    }
    img.src = url
  }, [loadedImages, loadingImages])

  useEffect(() => {
    urls.forEach(preloadImage)
  }, [urls, preloadImage])

  return {
    loadedImages,
    loadingImages,
    preloadImage,
    isLoaded: (url: string) => loadedImages.has(url),
    isLoading: (url: string) => loadingImages.has(url)
  }
}

export class ResourceManager {
  private static instance: ResourceManager
  private cleanupTasks: (() => void)[] = []
  private memoryThreshold = 100 * 1024 * 1024 // 100MB

  static getInstance(): ResourceManager {
    if (!ResourceManager.instance) {
      ResourceManager.instance = new ResourceManager()
    }
    return ResourceManager.instance
  }

  addCleanupTask(task: () => void) {
    this.cleanupTasks.push(task)
  }

  cleanup() {
    this.cleanupTasks.forEach(task => {
      try {
        task()
      } catch (error) {
        console.error('Cleanup task failed:', error)
      }
    })
    this.cleanupTasks = []
  }

  async checkMemoryUsage(): Promise<{
    used: number
    total: number
    percentage: number
    shouldCleanup: boolean
  }> {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory
      const used = memInfo.usedJSHeapSize
      const total = memInfo.totalJSHeapSize
      const percentage = (used / total) * 100

      return {
        used,
        total,
        percentage,
        shouldCleanup: used > this.memoryThreshold
      }
    }

    return {
      used: 0,
      total: 0,
      percentage: 0,
      shouldCleanup: false
    }
  }

  async performGarbageCollection() {
    if ('gc' in window && typeof (window as any).gc === 'function') {
      try {
        (window as any).gc()
        console.log('Manual garbage collection performed')
      } catch (error) {
        console.warn('Manual GC not available:', error)
      }
    }
    
    this.cleanup()
    
    if (typeof window !== 'undefined' && 'caches' in window) {
      try {
        const cacheNames = await caches.keys()
        const oldCaches = cacheNames.filter(name => 
          !name.includes('v1') && !name.includes(new Date().getFullYear().toString())
        )
        
        await Promise.all(oldCaches.map(name => caches.delete(name)))
        console.log(`Cleared ${oldCaches.length} old caches`)
      } catch (error) {
        console.warn('Cache cleanup failed:', error)
      }
    }
  }
}

export const resourceManager = ResourceManager.getInstance()

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    resourceManager.cleanup()
  })

  setInterval(async () => {
    const memoryUsage = await resourceManager.checkMemoryUsage()
    if (memoryUsage.shouldCleanup) {
      console.log(`Memory usage high (${memoryUsage.percentage.toFixed(1)}%), performing cleanup`)
      await resourceManager.performGarbageCollection()
    }
  }, 60000) // Check every minute
}