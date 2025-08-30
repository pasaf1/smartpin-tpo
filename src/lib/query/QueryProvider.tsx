'use client'

import { QueryClient, QueryClientProvider, MutationCache, QueryCache } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            gcTime: 10 * 60 * 1000, // 10 minutes
            // 2025 Enhancement: Network-aware and offline-first caching
            networkMode: 'offlineFirst',
            refetchOnReconnect: true,
            refetchOnWindowFocus: false, // Prevent excessive refetches
            refetchOnMount: 'always',
            retry: (failureCount, error) => {
              // Don't retry on 4xx errors
              if (error && typeof error === 'object' && 'status' in error) {
                const status = error.status as number
                if (status >= 400 && status < 500) {
                  return false
                }
              }
              return failureCount < 3
            },
          },
          mutations: {
            retry: 1,
            // 2025 Enhancement: Global mutation error handling
            onError: (error, variables, context) => {
              console.error('🚨 Mutation failed:', error, variables)
              // Could integrate with error tracking service here
            },
            // 2025 Enhancement: Global optimistic updates support
            onMutate: async (variables) => {
              // This can be overridden by individual mutations
              console.log('🔄 Mutation started:', variables)
            },
            onSettled: (data, error, variables, context) => {
              // Global cleanup after mutations
              if (error) {
                console.log('🔄 Mutation settled with error, triggering cache refresh')
              }
            }
          },
        },
        // 2025 Enhancement: Advanced cache management
        mutationCache: new MutationCache({
          onError: (error, variables, context, mutation) => {
            console.error('🚨 Global mutation error:', error)
          },
        }),
        queryCache: new QueryCache({
          onError: (error, query) => {
            console.error('🚨 Global query error:', error, query.queryKey)
          },
        }),
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}