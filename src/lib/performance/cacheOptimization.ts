import { QueryClient } from '@tanstack/react-query'

// Enhanced cache duration constants
export const CACHE_DURATIONS = {
  IMMEDIATE: 0,
  SHORT: 5 * 60 * 1000,      // 5 minutes
  MEDIUM: 30 * 60 * 1000,    // 30 minutes  
  LONG: 2 * 60 * 60 * 1000,  // 2 hours
  VERY_LONG: 24 * 60 * 60 * 1000, // 24 hours
  INFINITE: Infinity
} as const

export const queryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: CACHE_DURATIONS.SHORT,
      gcTime: CACHE_DURATIONS.LONG,
      retry: (failureCount: number, error: any) => {
        // Don't retry on client errors
        if (error?.status >= 400 && error?.status < 500) return false
        // Don't retry network errors more than 3 times
        return failureCount < 3
      },
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: true,
      // Network optimization
      networkMode: 'online' as const,
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
      // Network optimization for mutations
      networkMode: 'online' as const,
    },
  },
}

export function createOptimizedQueryClient(): QueryClient {
  return new QueryClient(queryClientConfig)
}

export class CacheManager {
  private queryClient: QueryClient

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient
  }

  prefetchProjectData(projectId: string) {
    this.queryClient.prefetchQuery({
      queryKey: ['projects', projectId],
      staleTime: 10 * 60 * 1000, // 10 minutes
    })
    
    this.queryClient.prefetchQuery({
      queryKey: ['roofs', 'project', projectId],
      staleTime: 5 * 60 * 1000, // 5 minutes
    })
  }

  prefetchRoofData(roofId: string) {
    this.queryClient.prefetchQuery({
      queryKey: ['roofs', roofId],
      staleTime: 5 * 60 * 1000,
    })
    
    this.queryClient.prefetchQuery({
      queryKey: ['pins', 'roof', roofId],
      staleTime: 2 * 60 * 1000, // 2 minutes for pins (more dynamic)
    })
  }

  prefetchPinData(pinId: string) {
    this.queryClient.prefetchQuery({
      queryKey: ['pins', pinId, 'children'],
      staleTime: 1 * 60 * 1000, // 1 minute for pin details
    })
    
    this.queryClient.prefetchQuery({
      queryKey: ['photos', 'pin', pinId],
      staleTime: 2 * 60 * 1000,
    })
    
    this.queryClient.prefetchQuery({
      queryKey: ['chat', 'pin', pinId],
      staleTime: 30 * 1000, // 30 seconds for chat
    })
  }

  optimisticUpdate<T>(
    queryKey: string[], 
    updateFn: (oldData: T | undefined) => T | undefined
  ) {
    const previousData = this.queryClient.getQueryData<T>(queryKey)
    
    this.queryClient.setQueryData<T>(queryKey, updateFn)
    
    return () => {
      this.queryClient.setQueryData<T>(queryKey, previousData)
    }
  }

  invalidateScope(scope: 'project' | 'roof' | 'pin', id: string) {
    switch (scope) {
      case 'project':
        this.queryClient.invalidateQueries({ queryKey: ['projects', id] })
        this.queryClient.invalidateQueries({ queryKey: ['roofs', 'project', id] })
        this.queryClient.invalidateQueries({ queryKey: ['chat', 'project', id] })
        break
      case 'roof':
        this.queryClient.invalidateQueries({ queryKey: ['roofs', id] })
        this.queryClient.invalidateQueries({ queryKey: ['pins', 'roof', id] })
        this.queryClient.invalidateQueries({ queryKey: ['chat', 'roof', id] })
        break
      case 'pin':
        this.queryClient.invalidateQueries({ queryKey: ['pins', id] })
        this.queryClient.invalidateQueries({ queryKey: ['photos', 'pin', id] })
        this.queryClient.invalidateQueries({ queryKey: ['chat', 'pin', id] })
        break
    }
  }

  clearStaleData() {
    this.queryClient.clear()
  }

  getMemoryUsage() {
    const cache = this.queryClient.getQueryCache()
    const queries = cache.getAll()
    
    return {
      totalQueries: queries.length,
      staleQueries: queries.filter(q => q.isStale()).length,
      inactiveQueries: queries.filter(q => !q.getObserversCount()).length,
      memoryEstimate: this.estimateMemoryUsage(queries)
    }
  }

  private estimateMemoryUsage(queries: any[]): string {
    // Rough estimation based on query count and data size
    const baseSize = queries.length * 1024 // 1KB per query baseline
    const dataSize = queries.reduce((sum, query) => {
      const data = query.state.data
      if (data) {
        try {
          return sum + JSON.stringify(data).length * 2 // Rough estimate
        } catch {
          return sum + 1024
        }
      }
      return sum
    }, 0)
    
    const totalBytes = baseSize + dataSize
    
    if (totalBytes < 1024) return `${totalBytes} B`
    if (totalBytes < 1024 * 1024) return `${(totalBytes / 1024).toFixed(1)} KB`
    return `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`
  }
}

export const createCacheManager = (queryClient: QueryClient) => new CacheManager(queryClient)

// Browser cache management for static assets
export class BrowserCacheManager {
  // Service Worker cache management
  static async updateServiceWorkerCache() {
    if ('serviceWorker' in navigator && 'caches' in window) {
      try {
        const cacheNames = await caches.keys()
        const currentCache = cacheNames.find(name => name.includes('smartpin-tpo'))
        
        if (currentCache) {
          const cache = await caches.open(currentCache)
          
          // Cache critical assets
          await cache.addAll([
            '/',
            '/roofs',
            '/settings',
            '/offline',
            '/manifest.json',
          ])
        }
      } catch (error) {
        console.warn('Service Worker cache update failed:', error)
      }
    }
  }

  // Local Storage cache with expiration
  static setWithExpiry(key: string, value: any, ttl: number) {
    const now = new Date()
    const item = {
      value: value,
      expiry: now.getTime() + ttl,
    }
    try {
      localStorage.setItem(key, JSON.stringify(item))
    } catch (error) {
      // Handle quota exceeded
      console.warn('Local storage quota exceeded:', error)
      this.clearOldEntries()
      try {
        localStorage.setItem(key, JSON.stringify(item))
      } catch {
        // Still failing, clear everything
        localStorage.clear()
      }
    }
  }

  static getWithExpiry(key: string) {
    try {
      const itemStr = localStorage.getItem(key)
      if (!itemStr) return null

      const item = JSON.parse(itemStr)
      const now = new Date()

      if (now.getTime() > item.expiry) {
        localStorage.removeItem(key)
        return null
      }
      
      return item.value
    } catch {
      return null
    }
  }

  private static clearOldEntries() {
    const now = new Date().getTime()
    const keysToRemove: string[] = []
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key) continue
      
      try {
        const item = JSON.parse(localStorage.getItem(key) || '')
        if (item.expiry && now > item.expiry) {
          keysToRemove.push(key)
        }
      } catch {
        // Invalid JSON, remove it
        keysToRemove.push(key)
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key))
  }
}

// Memory management for large datasets
export class MemoryOptimizer {
  private static memoryCache = new Map<string, { data: any; timestamp: number; size: number }>()
  private static maxMemorySize = 50 * 1024 * 1024 // 50MB limit

  static set(key: string, data: any) {
    const size = this.calculateSize(data)
    const timestamp = Date.now()
    
    // Check if we need to clear old data
    this.ensureMemoryLimit(size)
    
    this.memoryCache.set(key, { data, timestamp, size })
  }

  static get(key: string, maxAge: number = CACHE_DURATIONS.MEDIUM) {
    const item = this.memoryCache.get(key)
    if (!item) return null

    const age = Date.now() - item.timestamp
    if (age > maxAge) {
      this.memoryCache.delete(key)
      return null
    }

    return item.data
  }

  static clear() {
    this.memoryCache.clear()
  }

  static getStats() {
    const items = Array.from(this.memoryCache.values())
    const totalSize = items.reduce((sum, item) => sum + item.size, 0)
    
    return {
      itemCount: items.length,
      totalSize: totalSize,
      formattedSize: this.formatSize(totalSize),
      maxSize: this.formatSize(this.maxMemorySize),
      utilizationPercent: Math.round((totalSize / this.maxMemorySize) * 100)
    }
  }

  private static calculateSize(obj: any): number {
    try {
      return new Blob([JSON.stringify(obj)]).size
    } catch {
      return 1024 // Fallback estimate
    }
  }

  private static ensureMemoryLimit(newSize: number) {
    const currentSize = Array.from(this.memoryCache.values())
      .reduce((total, item) => total + item.size, 0)

    if (currentSize + newSize > this.maxMemorySize) {
      // Remove oldest entries until we have enough space
      const entries = Array.from(this.memoryCache.entries())
        .sort(([,a], [,b]) => a.timestamp - b.timestamp)

      let freedSize = 0
      for (const [key, item] of entries) {
        this.memoryCache.delete(key)
        freedSize += item.size
        if (freedSize >= newSize) break
      }
    }
  }

  private static formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }
}