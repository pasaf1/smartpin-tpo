import { QueryClient } from '@tanstack/react-query'

export const queryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime)
      retry: (failureCount: number, error: any) => {
        if (error?.status === 404) return false
        if (error?.status === 403) return false
        return failureCount < 3
      },
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: true,
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
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